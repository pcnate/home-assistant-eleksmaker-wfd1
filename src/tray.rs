//! System tray launcher for eleks-monitor.
//! Manages connectivity checks and auto-starts/stops the daemon.

#![windows_subsystem = "windows"]

use std::env;
use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use std::process::{ Child, Command };
use std::sync::{ Arc, Mutex };
use std::time::Instant;
use std::net::TcpStream;

const CREATE_NO_WINDOW: u32 = 0x08000000;

use tray_icon::{ TrayIcon, TrayIconBuilder, Icon };
use tray_icon::menu::{ Menu, MenuEvent, MenuItem, PredefinedMenuItem };
use winit::application::ApplicationHandler;
use winit::event::WindowEvent;
use winit::event_loop::{ ActiveEventLoop, EventLoop };
use winit::window::WindowId;


/// IDs for menu items.
const ID_ENABLE: &str = "enable";
const ID_DISABLE: &str = "disable";
const ID_EXIT: &str = "exit";

/// How often to check connectivity (seconds).
const CHECK_INTERVAL_SECS: u64 = 60;


/// Icon states.
#[derive( Clone, Copy, PartialEq )]
enum TrayState {
    /// User disabled monitoring
    Disabled,
    /// Enabled but HA unreachable
    Disconnected,
    /// Enabled, connected, daemon running
    Connected,
}


/// Find the monitor exe next to this tray exe.
fn monitor_exe_path() -> PathBuf {
    let mut p = env::current_exe().unwrap_or_default();
    p.set_file_name( "eleks-monitor.exe" );
    p
}


/// Embedded icon PNG.
const ICON_PNG: &[u8] = include_bytes!( "../assets/icon.png" );


/// Load the embedded icon and tint it based on state.
fn make_icon( state: TrayState ) -> Icon {
    let img = image::load_from_memory_with_format( ICON_PNG, image::ImageFormat::Png )
        .expect( "failed to decode icon.png" )
        .resize( 32, 32, image::imageops::FilterType::Lanczos3 )
        .to_rgba8();

    let ( width, height ) = img.dimensions();
    let mut rgba = img.into_raw();

    let ( tr, tg, tb ): ( f32, f32, f32 ) = match state {
        TrayState::Connected    => ( 0.1, 0.5, 0.2 ),    // green
        TrayState::Disconnected => ( 0.8, 0.45, 0.05 ),  // orange
        TrayState::Disabled     => ( 0.35, 0.35, 0.35 ), // gray
    };

    for pixel in rgba.chunks_exact_mut( 4 ) {
        let a = pixel[3] as f32 / 255.0;
        if a > 0.0 {
            let lum = 1.0 - ( pixel[0] as f32 / 255.0 );
            pixel[0] = ( lum * tr * 255.0 ) as u8;
            pixel[1] = ( lum * tg * 255.0 ) as u8;
            pixel[2] = ( lum * tb * 255.0 ) as u8;
            pixel[3] = ( lum * 255.0 ) as u8;
        }
    }

    Icon::from_rgba( rgba, width, height ).expect( "failed to create icon" )
}


/// Parse HA_URL from .env to extract host:port for TCP check.
fn load_ha_addr() -> Option<String> {
    let exe_dir = env::current_exe().ok()?;
    let base = exe_dir.parent()?;

    // Try .env next to exe, then one level up
    for dir in &[ base.to_path_buf(), base.join( ".." ) ] {
        let env_path = dir.join( ".env" );
        if let Ok( contents ) = std::fs::read_to_string( &env_path ) {
            for line in contents.lines() {
                if let Some( url ) = line.strip_prefix( "HA_URL=" ) {
                    // Extract host:port from http://host:port/path
                    let stripped = url
                        .trim_start_matches( "http://" )
                        .trim_start_matches( "https://" );
                    let host_port = stripped.split( '/' ).next().unwrap_or( stripped );
                    if host_port.contains( ':' ) {
                        return Some( host_port.to_string() );
                    } else {
                        return Some( format!( "{}:8123", host_port ) );
                    }
                }
            }
        }
    }
    None
}


/// Check if HA is reachable via TCP connect with a short timeout.
fn check_ha_connectivity( addr: &str ) -> bool {
    TcpStream::connect_timeout(
        &addr.parse().unwrap_or_else( |_| "127.0.0.1:8123".parse().unwrap() ),
        std::time::Duration::from_secs( 5 ),
    ).is_ok()
}


struct App {
    child: Arc<Mutex<Option<Child>>>,
    _tray: Option<TrayIcon>,
    menu_enable: MenuItem,
    menu_disable: MenuItem,
    state: TrayState,
    enabled: bool,
    ha_addr: String,
    last_check: Instant,
}


impl App {

    fn new(
        child: Arc<Mutex<Option<Child>>>,
        tray: TrayIcon,
        menu_enable: MenuItem,
        menu_disable: MenuItem,
        ha_addr: String,
    ) -> Self {
        App {
            child,
            _tray: Some( tray ),
            menu_enable,
            menu_disable,
            state: TrayState::Disabled,
            enabled: true,
            ha_addr,
            last_check: Instant::now() - std::time::Duration::from_secs( CHECK_INTERVAL_SECS + 1 ),
        }
    }


    /// Start the monitor daemon.
    fn start_daemon( &mut self ) {
        // Don't start if already running
        if self.child.lock().unwrap().is_some() {
            return;
        }

        let exe = monitor_exe_path();
        let cwd = exe.parent().unwrap_or_else( || std::path::Path::new( "." ) );

        match Command::new( &exe ).arg( "-d" ).current_dir( cwd ).creation_flags( CREATE_NO_WINDOW ).spawn() {
            Ok( c ) => {
                *self.child.lock().unwrap() = Some( c );
            }
            Err( _e ) => {}
        }
    }


    /// Stop the running daemon.
    fn stop_daemon( &mut self ) {
        let mut lock = self.child.lock().unwrap();
        if let Some( ref mut c ) = *lock {
            let _ = c.kill();
            let _ = c.wait();
        }
        *lock = None;
    }


    /// Update tray icon and tooltip based on current state.
    fn set_state( &mut self, new_state: TrayState ) {
        if self.state == new_state {
            return;
        }
        self.state = new_state;

        let tooltip = match new_state {
            TrayState::Connected    => "EleksWFD Monitor - Connected",
            TrayState::Disconnected => "EleksWFD Monitor - Disconnected",
            TrayState::Disabled     => "EleksWFD Monitor - Disabled",
        };

        if let Some( tray ) = &self._tray {
            let _ = tray.set_icon( Some( make_icon( new_state ) ) );
            let _ = tray.set_tooltip( Some( tooltip ) );
        }
    }


    /// Enable monitoring.
    fn enable( &mut self ) {
        self.enabled = true;
        self.menu_enable.set_enabled( false );
        self.menu_disable.set_enabled( true );
        // Force immediate connectivity check
        self.last_check = Instant::now() - std::time::Duration::from_secs( CHECK_INTERVAL_SECS + 1 );
    }


    /// Disable monitoring.
    fn disable( &mut self ) {
        self.enabled = false;
        self.menu_enable.set_enabled( true );
        self.menu_disable.set_enabled( false );
        self.stop_daemon();
        self.set_state( TrayState::Disabled );
    }


    /// Check if daemon is still alive.
    fn check_child_alive( &mut self ) -> bool {
        let mut lock = self.child.lock().unwrap();
        if let Some( ref mut c ) = *lock {
            match c.try_wait() {
                Ok( Some( _ ) ) => {
                    *lock = None;
                    false
                }
                _ => true,
            }
        } else {
            false
        }
    }


    /// Periodic connectivity check and daemon management.
    fn tick( &mut self ) {
        if !self.enabled {
            return;
        }

        // Check if daemon died
        let daemon_alive = self.check_child_alive();

        // Only check connectivity on interval
        if self.last_check.elapsed().as_secs() < CHECK_INTERVAL_SECS {
            // Between checks, if daemon died, go to disconnected and wait for next check
            if !daemon_alive && self.state == TrayState::Connected {
                self.set_state( TrayState::Disconnected );
            }
            return;
        }

        self.last_check = Instant::now();

        if check_ha_connectivity( &self.ha_addr ) {
            // HA reachable
            if !daemon_alive {
                self.start_daemon();
            }
            self.set_state( TrayState::Connected );
        } else {
            // HA unreachable — stop daemon if running
            if daemon_alive {
                self.stop_daemon();
            }
            self.set_state( TrayState::Disconnected );
        }
    }
}


impl ApplicationHandler for App {
    fn resumed( &mut self, _event_loop: &ActiveEventLoop ) {}

    fn window_event( &mut self, _event_loop: &ActiveEventLoop, _id: WindowId, _event: WindowEvent ) {}

    fn about_to_wait( &mut self, event_loop: &ActiveEventLoop ) {
        // Process menu events
        while let Ok( event ) = MenuEvent::receiver().try_recv() {
            match event.id().0.as_str() {
                x if x == ID_ENABLE  => self.enable(),
                x if x == ID_DISABLE => self.disable(),
                x if x == ID_EXIT    => {
                    self.stop_daemon();
                    event_loop.exit();
                }
                _ => {}
            }
        }

        self.tick();
    }
}


fn main() {
    let ha_addr = load_ha_addr().unwrap_or_else( || "127.0.0.1:8123".to_string() );

    let event_loop = EventLoop::new().expect( "failed to create event loop" );

    // Build menu
    let menu = Menu::new();

    let menu_enable = MenuItem::with_id( ID_ENABLE, "Enable", false, None );
    let menu_disable = MenuItem::with_id( ID_DISABLE, "Disable", true, None );
    let menu_exit = MenuItem::with_id( ID_EXIT, "Exit", true, None );

    let _ = menu.append( &menu_enable );
    let _ = menu.append( &menu_disable );
    let _ = menu.append( &PredefinedMenuItem::separator() );
    let _ = menu.append( &menu_exit );

    let tray = TrayIconBuilder::new()
        .with_icon( make_icon( TrayState::Disconnected ) )
        .with_tooltip( "EleksWFD Monitor - Checking..." )
        .with_menu( Box::new( menu ) )
        .build()
        .expect( "failed to create tray icon" );

    let child: Arc<Mutex<Option<Child>>> = Arc::new( Mutex::new( None ) );

    let mut app = App::new( child, tray, menu_enable, menu_disable, ha_addr );

    // Force immediate check on startup
    app.enable();

    event_loop.run_app( &mut app ).expect( "event loop failed" );
}
