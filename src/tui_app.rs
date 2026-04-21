use std::io::{ self, Read, Stdout };
use std::sync::mpsc;
use crossterm::{
    terminal::{ disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen },
    ExecutableCommand,
};
use ratatui::{
    prelude::*,
    widgets::{ Block, Borders, Paragraph, Clear, Wrap },
};

use crate::config::Config;
use crate::sensors::SensorPayload;


/// TUI application state.
pub struct TuiApp {
    pub paused: bool,
    pub refresh_interval_ms: u64,
    pub log_lines: Vec<String>,
    pub settings_open: bool,
    pub settings_input: String,
    pub should_quit: bool,
    max_log_lines: usize,
}


impl TuiApp {

    /// Create a new TUI app with default state.
    pub fn new() -> Self {
        TuiApp {
            paused: false,
            refresh_interval_ms: 333,
            log_lines: Vec::new(),
            settings_open: false,
            settings_input: String::new(),
            should_quit: false,
            max_log_lines: 100,
        }
    }


    /// Push a log line into the TUI log buffer.
    pub fn push_log( &mut self, msg: &str ) {
        self.log_lines.push( msg.to_string() );
        if self.log_lines.len() > self.max_log_lines {
            self.log_lines.remove( 0 );
        }
    }
}


/// Initialize the terminal for TUI mode.
pub fn init_terminal() -> io::Result<Terminal<CrosstermBackend<Stdout>>> {
    enable_raw_mode()?;
    io::stdout().execute( EnterAlternateScreen )?;
    let backend = CrosstermBackend::new( io::stdout() );
    Terminal::new( backend )
}


/// Restore the terminal to normal mode.
pub fn restore_terminal( terminal: &mut Terminal<CrosstermBackend<Stdout>> ) {
    let _ = disable_raw_mode();
    let _ = terminal.backend_mut().execute( LeaveAlternateScreen );
    let _ = terminal.show_cursor();
}


/// Render the TUI frame.
pub fn render(
    terminal: &mut Terminal<CrosstermBackend<Stdout>>,
    app: &TuiApp,
    config: &Config,
    payload: &SensorPayload,
) -> io::Result<()> {
    terminal.draw( |frame| {
        let area = frame.area();

        // Main vertical layout: body + footer
        let outer = Layout::default()
            .direction( Direction::Vertical )
            .constraints( [ Constraint::Min( 1 ), Constraint::Length( 1 ) ] )
            .split( area );

        // Body: left panel (50%) + right panel (50%)
        let body = Layout::default()
            .direction( Direction::Horizontal )
            .constraints( [ Constraint::Percentage( 50 ), Constraint::Percentage( 50 ) ] )
            .split( outer[0] );

        // Left panel: header + connection + log
        let left = Layout::default()
            .direction( Direction::Vertical )
            .constraints( [
                Constraint::Length( 3 ),  // header
                Constraint::Length( 4 ),  // connection info
                Constraint::Min( 1 ),     // log
            ] )
            .split( body[0] );

        // Header
        let header = Paragraph::new( "System Monitor - AIDA64 (Rust)" )
            .alignment( Alignment::Center )
            .style( Style::default().fg( Color::White ).add_modifier( Modifier::BOLD ) )
            .block( Block::default().borders( Borders::ALL ).border_style( Style::default().fg( Color::Cyan ) ) );
        frame.render_widget( header, left[0] );

        // Connection info
        let ha_short = config.ha_url.replace( "http://", "" ).replace( "https://", "" );
        let conn_text = format!( "Machine: {}\nHA URL:  {}", config.machine_name, ha_short );
        let conn_box = Paragraph::new( conn_text )
            .block(
                Block::default()
                    .title( " Connection " )
                    .borders( Borders::ALL )
                    .border_style( Style::default().fg( Color::Yellow ) )
            )
            .style( Style::default().fg( Color::White ) );
        frame.render_widget( conn_box, left[1] );

        // Log
        let log_height = left[2].height.saturating_sub( 2 ) as usize;
        let skip = if app.log_lines.len() > log_height {
            app.log_lines.len() - log_height
        } else {
            0
        };
        let visible_logs: String = app.log_lines.iter().skip( skip ).cloned().collect::<Vec<_>>().join( "\n" );
        let log_widget = Paragraph::new( visible_logs )
            .block(
                Block::default()
                    .title( " Log " )
                    .borders( Borders::ALL )
                    .border_style( Style::default().fg( Color::Blue ) )
            )
            .style( Style::default().fg( Color::White ) )
            .wrap( Wrap { trim: false } );
        frame.render_widget( log_widget, left[2] );

        // Right panel: sensor data
        let stats_text = format!(
            "{bold}CPU{reset}\n  Usage:    {cpu_usage:>5}%\n  Temp:     {cpu_temp:>5}°C\n\n\
             {bold}GPU{reset}\n  Usage:    {gpu_usage:>5}%\n  Temp:     {gpu_temp:>5}°C\n\n\
             {bold}Memory{reset}\n  RAM:      {ram:>5}%\n\n\
             {bold}Disk{reset}\n  Activity: {disk_act:>5}%\n  Read/Write: {dr:>5} / {dw:>5} MB/s\n\n\
             {bold}Power{reset}\n  State:    {pstate}\n  Battery:  {batt:>5}%",
            bold = "",
            reset = "",
            cpu_usage = payload.cpu_usage as i64,
            cpu_temp = payload.cpu_temp as i64,
            gpu_usage = payload.gpu_usage as i64,
            gpu_temp = payload.gpu_temp as i64,
            ram = payload.ram_usage as i64,
            disk_act = payload.disk_activity as i64,
            dr = payload.disk_read_speed as i64,
            dw = payload.disk_write_speed as i64,
            pstate = payload.power_state,
            batt = payload.battery_perc as i64,
        );
        let stats_widget = Paragraph::new( stats_text )
            .block(
                Block::default()
                    .title( " Sensor Data " )
                    .borders( Borders::ALL )
                    .border_style( Style::default().fg( Color::Green ) )
            )
            .style( Style::default().fg( Color::White ) );
        frame.render_widget( stats_widget, body[1] );

        // Footer
        let status = if app.paused { "PAUSED" } else { "RUNNING" };
        let status_style = if app.paused { Color::Red } else { Color::Green };
        let footer_text = Line::from( vec![
            Span::raw( " " ),
            Span::styled( status, Style::default().fg( status_style ).add_modifier( Modifier::BOLD ) ),
            Span::raw( "  p:pause  s:settings  q:quit  |  Refresh: " ),
            Span::raw( format!( "{}ms ", app.refresh_interval_ms ) ),
        ] );
        let footer = Paragraph::new( footer_text )
            .style( Style::default().fg( Color::Black ).bg( Color::White ) );
        frame.render_widget( footer, outer[1] );

        // Settings modal
        if app.settings_open {
            let modal_area = Rect {
                x: area.width / 2 - 20,
                y: area.height / 2 - 3,
                width: 40,
                height: 7,
            };
            frame.render_widget( Clear, modal_area );
            let modal_text = format!( "Refresh interval (ms):\n> {}\n\nEnter:save  x/Esc:cancel", app.settings_input );
            let modal = Paragraph::new( modal_text )
                .block(
                    Block::default()
                        .title( " Settings " )
                        .borders( Borders::ALL )
                        .border_style( Style::default().fg( Color::Yellow ) )
                )
                .style( Style::default().fg( Color::White ).bg( Color::Black ) );
            frame.render_widget( modal, modal_area );
        }
    } )?;
    Ok(())
}


/// Spawn a background thread that reads stdin byte-by-byte.
/// Works through pipes, SSH, nodemon — anywhere stdin is available.
pub fn spawn_stdin_reader() -> mpsc::Receiver<u8> {
    let ( tx, rx ) = mpsc::channel();
    std::thread::spawn( move || {
        let stdin = io::stdin();
        let mut handle = stdin.lock();
        let mut buf = [0u8; 1];
        while handle.read_exact( &mut buf ).is_ok() {
            if tx.send( buf[0] ).is_err() {
                break;
            }
        }
    } );
    rx
}


/// Process any pending bytes from the stdin reader and update app state.
pub fn handle_events( app: &mut TuiApp, rx: &mpsc::Receiver<u8> ) {
    while let Ok( byte ) = rx.try_recv() {
        if byte == 3 {
            // Ctrl+C
            app.should_quit = true;
            return;
        }

        if app.settings_open {
            match byte {
                27 | b'x' | b'X' => {
                    // Escape / x to cancel
                    app.settings_open = false;
                }
                13 => {
                    // Enter
                    if let Ok( val ) = app.settings_input.parse::<u64>() {
                        if ( 100..=10000 ).contains( &val ) {
                            app.refresh_interval_ms = val;
                        }
                    }
                    app.settings_open = false;
                }
                127 | 8 => {
                    // Backspace / Delete
                    app.settings_input.pop();
                }
                c if c.is_ascii_digit() => {
                    app.settings_input.push( c as char );
                }
                _ => {}
            }
        } else {
            match byte {
                b'q' | b'Q' => {
                    app.should_quit = true;
                }
                b'p' | b'P' | b' ' => {
                    app.paused = !app.paused;
                }
                b's' | b'S' => {
                    app.settings_input = app.refresh_interval_ms.to_string();
                    app.settings_open = true;
                }
                _ => {}
            }
        }
    }
}
