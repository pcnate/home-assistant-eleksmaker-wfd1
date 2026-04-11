use std::fs::{ self, OpenOptions };
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;
use chrono::Local;


static LOG_DIR: Mutex<Option<PathBuf>> = Mutex::new( None );
static DAEMON_MODE: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new( false );
static LAST_CLEANUP: Mutex<Option<chrono::NaiveDate>> = Mutex::new( None );

const RETENTION_DAYS: i64 = 7;


/// Get today's log file path.
fn log_file_path() -> Option<PathBuf> {
    LOG_DIR.lock().unwrap().as_ref().map( |dir| {
        let date = Local::now().format( "%Y-%m-%d" );
        dir.join( format!( "eleks-{}.log", date ) )
    } )
}


/// Initialize the logging system.
///
/// @param log_dir - Directory for log files
/// @param daemon - Whether to also print to stdout
pub fn init( log_dir: PathBuf, daemon: bool ) {
    let _ = fs::create_dir_all( &log_dir );

    *LOG_DIR.lock().unwrap() = Some( log_dir );
    DAEMON_MODE.store( daemon, std::sync::atomic::Ordering::Relaxed );

    log( &format!( "=== EleksWFD (Rust) started ===" ) );
    cleanup_old_logs();
}


/// Log a message to today's log file and optionally to stdout.
pub fn log( message: &str ) {
    let timestamp = Local::now().format( "%Y-%m-%dT%H:%M:%S" );
    let line = format!( "{} {}", timestamp, message );

    if let Some( path ) = log_file_path() {
        if let Ok( mut f ) = OpenOptions::new().create( true ).append( true ).open( &path ) {
            let _ = writeln!( f, "{}", line );
        }
    }

    // Run cleanup once per day
    let today = Local::now().date_naive();
    let mut last = LAST_CLEANUP.lock().unwrap();
    if *last != Some( today ) {
        *last = Some( today );
        drop( last );
        cleanup_old_logs();
    }

    if DAEMON_MODE.load( std::sync::atomic::Ordering::Relaxed ) {
        println!( "{}", message );
    }
}


/// Delete log files older than RETENTION_DAYS.
fn cleanup_old_logs() {
    let dir = match LOG_DIR.lock().unwrap().as_ref() {
        Some( d ) => d.clone(),
        None => return,
    };

    let cutoff = Local::now().date_naive() - chrono::Duration::days( RETENTION_DAYS );

    if let Ok( entries ) = fs::read_dir( &dir ) {
        for entry in entries.flatten() {
            let name = entry.file_name();
            let name = name.to_string_lossy();

            // Match eleks-YYYY-MM-DD.log
            if let Some( date_str ) = name.strip_prefix( "eleks-" ).and_then( |s| s.strip_suffix( ".log" ) ) {
                if let Ok( date ) = chrono::NaiveDate::parse_from_str( date_str, "%Y-%m-%d" ) {
                    if date < cutoff {
                        let _ = fs::remove_file( entry.path() );
                    }
                }
            }
        }
    }
}
