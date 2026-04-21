mod config;
mod sensors;
mod ha;
mod logging;
mod tui_app;

use std::path::PathBuf;
use clap::Parser;
// v4
use tokio::signal;

use config::Config;
use ha::{ build_client, check_connectivity, get_from_ha, post_to_ha };
use logging::{ init as init_logging, log };
use sensors::{ read_wmi_sensors, map_sensors, field_changed, get_field_value, format_field_value, METRICS, SensorPayload };
use tui_app::{ TuiApp, init_terminal, restore_terminal, render, handle_events, spawn_stdin_reader };
use wmi::COMLibrary;


#[derive( Parser )]
#[command( name = "eleks-monitor", about = "AIDA64 System Monitor -> Home Assistant" )]
struct Cli {
    /// Run in daemon mode (no TUI, stdout logging)
    #[arg( short, long )]
    daemon: bool,

    /// Send zeros to HA and exit (used by tray launcher on disable)
    #[arg( long )]
    shutdown: bool,
}


#[tokio::main]
async fn main() {
    let cli = Cli::parse();

    // Load .env from the project root (one level up from the exe or cwd)
    let _ = dotenvy::from_path( ".env" );
    let _ = dotenvy::from_path( "../.env" );

    let config = Config::load();

    // Init logging
    let log_dir = std::env::current_exe()
        .ok()
        .and_then( |p| p.parent().map( |d| d.join( "logs" ) ) )
        .unwrap_or_else( || PathBuf::from( "logs" ) );
    init_logging( log_dir, cli.daemon );

    log( &format!( "Machine: {}", config.machine_name ) );
    log( &format!( "HA URL:  {}", config.ha_url ) );
    log( &format!( "Mode:    {}", if cli.daemon { "daemon" } else { "TUI" } ) );

    let client = build_client( &config.ha_token );

    // Shutdown-only mode: send zeros and exit
    if cli.shutdown {
        let previous = SensorPayload::sentinel();
        shutdown( &config, &client, &previous ).await;
        return;
    }

    check_connectivity( &client, &config.ha_url, &config.machine_name ).await;

    // Init WMI COM library (must happen on the thread that uses it)
    let com = match COMLibrary::new() {
        Ok( c ) => c,
        Err( e ) => {
            log( &format!( "Failed to init COM: {}", e ) );
            return;
        }
    };

    let mut previous = SensorPayload::sentinel();
    let mut max_cpu_clock: f64 = 1.0;

    if cli.daemon {
        run_daemon( &config, &client, &com, &mut previous, &mut max_cpu_clock ).await;
    } else {
        run_tui( &config, &client, &com, &mut previous, &mut max_cpu_clock ).await;
    }
}


/// Daemon mode: no TUI, just poll + push in a loop.
async fn run_daemon(
    config: &Config,
    client: &reqwest::Client,
    com: &COMLibrary,
    previous: &mut SensorPayload,
    max_cpu_clock: &mut f64,
) {
    let sensor_name = "refresh_interval";
    let mut refresh_ms: u64 = 333;

    // Load refresh interval from HA, or push default
    if let Some( val ) = get_from_ha( client, &config.ha_url, &config.machine_name, sensor_name ).await {
        if let Ok( ms ) = val.parse::<u64>() {
            if ( 100..=10000 ).contains( &ms ) {
                refresh_ms = ms;
                log( &format!( "Loaded refresh interval from HA: {}ms", ms ) );
            }
        }
    } else {
        post_to_ha( client, &config.ha_url, &config.machine_name, sensor_name, serde_json::json!( refresh_ms ), Some( "ms" ), "Refresh Interval" ).await;
        log( &format!( "Created refresh interval in HA: {}ms", refresh_ms ) );
    }

    let mut last_ha_settings_check = std::time::Instant::now();
    let mut first_failure: Option<std::time::Instant> = None;

    loop {
        tokio::select! {
            _ = signal::ctrl_c() => {
                shutdown( config, client, previous ).await;
                return;
            }
            _ = tokio::time::sleep( std::time::Duration::from_millis( refresh_ms ) ) => {
                let ( _, ha_ok ) = poll_and_push( config, client, com, previous, max_cpu_clock ).await;

                if ha_ok {
                    first_failure = None;
                } else {
                    let now = std::time::Instant::now();
                    let started = *first_failure.get_or_insert( now );
                    if now.duration_since( started ).as_secs() >= 60 {
                        log( "HA unreachable for 60s — daemon exiting" );
                        return;
                    }
                }

                // Check HA for refresh interval changes every 5s
                if last_ha_settings_check.elapsed().as_secs() >= 5 {
                    last_ha_settings_check = std::time::Instant::now();
                    if let Some( val ) = get_from_ha( client, &config.ha_url, &config.machine_name, sensor_name ).await {
                        if let Ok( ms ) = val.parse::<u64>() {
                            if ( 100..=10000 ).contains( &ms ) && ms != refresh_ms {
                                refresh_ms = ms;
                                log( &format!( "Refresh interval updated from HA: {}ms", ms ) );
                            }
                        }
                    }
                }
            }
        }
    }
}


/// TUI mode: render UI, handle input, poll + push.
async fn run_tui(
    config: &Config,
    client: &reqwest::Client,
    com: &COMLibrary,
    previous: &mut SensorPayload,
    max_cpu_clock: &mut f64,
) {
    let mut terminal = match init_terminal() {
        Ok( t ) => t,
        Err( e ) => {
            log( &format!( "Failed to init TUI: {}", e ) );
            return;
        }
    };

    let mut app = TuiApp::new();
    let mut last_poll = std::time::Instant::now();
    let mut last_ha_settings_check = std::time::Instant::now();
    let stdin_rx = spawn_stdin_reader();

    // Load refresh interval from HA, or push default if it doesn't exist
    let sensor_name = "refresh_interval";
    if let Some( val ) = get_from_ha( client, &config.ha_url, &config.machine_name, sensor_name ).await {
        if let Ok( ms ) = val.parse::<u64>() {
            if ( 100..=10000 ).contains( &ms ) {
                app.refresh_interval_ms = ms;
                log( &format!( "Loaded refresh interval from HA: {}ms", ms ) );
            }
        }
    } else {
        post_to_ha( client, &config.ha_url, &config.machine_name, sensor_name, serde_json::json!( app.refresh_interval_ms ), Some( "ms" ), "Refresh Interval" ).await;
        log( &format!( "Created refresh interval in HA: {}ms", app.refresh_interval_ms ) );
    }

    // Watch the source exe for changes (rebuild detection)
    let exe_path = std::env::current_dir().unwrap_or_default().join( "eleks-monitor.exe" );
    let exe_modified = std::fs::metadata( &exe_path ).ok().and_then( |m| m.modified().ok() );

    loop {
        // Render
        if let Err( e ) = render( &mut terminal, &app, config, previous ) {
            log( &format!( "Render error: {}", e ) );
            break;
        }

        // Handle keyboard from stdin reader thread
        let prev_interval = app.refresh_interval_ms;
        handle_events( &mut app, &stdin_rx );

        // If user changed interval via settings, push to HA
        if app.refresh_interval_ms != prev_interval {
            log( &format!( "Refresh interval changed to {}ms", app.refresh_interval_ms ) );
            post_to_ha( client, &config.ha_url, &config.machine_name, sensor_name, serde_json::json!( app.refresh_interval_ms ), Some( "ms" ), "Refresh Interval" ).await;
        }

        // Small sleep to avoid busy-spinning between polls
        tokio::time::sleep( std::time::Duration::from_millis( 30 ) ).await;

        if app.should_quit {
            shutdown( config, client, previous ).await;
            break;
        }

        // Check if source exe was rebuilt
        if let Some( original ) = exe_modified {
            if let Ok( current ) = std::fs::metadata( &exe_path ).and_then( |m| m.modified() ) {
                if current != original {
                    log( "exe changed on disk — restarting..." );
                    app.push_log( "Rebuild detected, restarting..." );
                    break;
                }
            }
        }

        // Check HA for external refresh interval changes (every 5s)
        if last_ha_settings_check.elapsed().as_secs() >= 5 {
            last_ha_settings_check = std::time::Instant::now();
            if let Some( val ) = get_from_ha( client, &config.ha_url, &config.machine_name, sensor_name ).await {
                if let Ok( ms ) = val.parse::<u64>() {
                    if ( 100..=10000 ).contains( &ms ) && ms != app.refresh_interval_ms {
                        app.refresh_interval_ms = ms;
                        log( &format!( "Refresh interval updated from HA: {}ms", ms ) );
                    }
                }
            }
        }

        // Only poll WMI + push to HA when the refresh interval has elapsed
        let elapsed = last_poll.elapsed().as_millis() as u64;
        if !app.paused && elapsed >= app.refresh_interval_ms {
            last_poll = std::time::Instant::now();

            let ( payload, _ ) = poll_and_push( config, client, com, previous, max_cpu_clock ).await;
            if let Some( p ) = payload {
                app.push_log( &format!(
                    "cpu:{:>3}% temp:{:>3}°C gpu:{:>3}°C disk:{:>3}%",
                    p.cpu_usage as i64, p.cpu_temp as i64, p.gpu_temp as i64, p.disk_activity as i64,
                ) );
            }
        }
    }

    restore_terminal( &mut terminal );
}


/// Poll WMI sensors, diff against previous, push changed values to HA.
/// Returns ( payload, ha_success ). ha_success is true if at least one post succeeded
/// or no posts were needed (no changes).
async fn poll_and_push(
    config: &Config,
    client: &reqwest::Client,
    com: &COMLibrary,
    previous: &mut SensorPayload,
    max_cpu_clock: &mut f64,
) -> ( Option<SensorPayload>, bool ) {
    let rows = match read_wmi_sensors( com ) {
        Some( r ) => r,
        None => {
            log( "error, no data, is AIDA64 running?" );
            return ( None, true ); // WMI failure isn't an HA failure
        }
    };

    let payload = map_sensors( &rows, max_cpu_clock, &config.sensors );

    // Diff and push changed metrics
    let mut futures = Vec::new();

    for metric in METRICS {
        if field_changed( &payload, previous, metric.name ) {
            let value = get_field_value( &payload, metric.name );
            log( &format!( "Updating {:18} {}", metric.name, format_field_value( &payload, metric.name ) ) );

            let client = client.clone();
            let ha_url = config.ha_url.clone();
            let machine_name = config.machine_name.clone();
            let sensor_name = metric.name.to_string();
            let unit = metric.unit.map( |s| s.to_string() );
            let friendly = metric.friendly_name.to_string();

            futures.push( tokio::spawn( async move {
                post_to_ha( &client, &ha_url, &machine_name, &sensor_name, value, unit.as_deref(), &friendly ).await
            } ) );
        }
    }

    // No changes = no posts needed = success
    if futures.is_empty() {
        *previous = payload.clone();
        return ( Some( payload ), true );
    }

    // Await all HA posts, track if any succeeded
    let mut any_ok = false;
    for f in futures {
        if let Ok( result ) = f.await {
            if result { any_ok = true; }
        }
    }

    *previous = payload.clone();
    ( Some( payload ), any_ok )
}


/// Send zero values to HA for all metrics, then exit.
async fn shutdown(
    config: &Config,
    client: &reqwest::Client,
    _previous: &SensorPayload,
) {
    log( "Shutting down..." );

    let mut futures = Vec::new();
    for metric in METRICS {
        let zero = if metric.name == "power_state" {
            serde_json::json!( "" )
        } else {
            serde_json::json!( 0 )
        };

        let client = client.clone();
        let ha_url = config.ha_url.clone();
        let machine_name = config.machine_name.clone();
        let name = metric.name.to_string();
        let unit = metric.unit.map( |s| s.to_string() );
        let friendly = metric.friendly_name.to_string();

        futures.push( tokio::spawn( async move {
            post_to_ha( &client, &ha_url, &machine_name, &name, zero, unit.as_deref(), &friendly ).await;
        } ) );
    }

    for f in futures {
        let _ = f.await;
    }

    log( "Exiting" );
}
