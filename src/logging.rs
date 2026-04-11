use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;
use chrono::Local;


static LOG_PATH: Mutex<Option<PathBuf>> = Mutex::new( None );
static DAEMON_MODE: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new( false );


/// Initialize the logging system.
///
/// @param log_path - Path to the log file
/// @param daemon - Whether to also print to stdout
pub fn init( log_path: PathBuf, daemon: bool ) {
    // Truncate the log file
    if let Ok( mut f ) = std::fs::File::create( &log_path ) {
        let _ = writeln!( f, "=== EleksWFD (Rust) started at {} ===", Local::now().format( "%Y-%m-%dT%H:%M:%S" ) );
    }

    *LOG_PATH.lock().unwrap() = Some( log_path );
    DAEMON_MODE.store( daemon, std::sync::atomic::Ordering::Relaxed );
}


/// Log a message to the log file and optionally to stdout.
pub fn log( message: &str ) {
    let timestamp = Local::now().format( "%Y-%m-%dT%H:%M:%S" );
    let line = format!( "{} {}", timestamp, message );

    // Write to log file
    if let Some( path ) = LOG_PATH.lock().unwrap().as_ref() {
        if let Ok( mut f ) = OpenOptions::new().create( true ).append( true ).open( path ) {
            let _ = writeln!( f, "{}", line );
        }
    }

    // In daemon mode, also print to stdout
    if DAEMON_MODE.load( std::sync::atomic::Ordering::Relaxed ) {
        println!( "{}", message );
    }
}
