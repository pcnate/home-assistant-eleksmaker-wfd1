use std::env;


/// Application configuration loaded from .env and environment variables.
pub struct Config {
    pub machine_name: String,
    pub ha_url: String,
    pub ha_token: String,
    pub elekswfd_addr: String,
    pub elekswfd_port: u16,
}


impl Config {

    /// Load configuration from environment variables (after dotenvy has loaded .env).
    pub fn load() -> Self {
        let machine_name = env::var( "MACHINE_NAME" ).unwrap_or_else( |_| {
            hostname::get()
                .map( |h| h.to_string_lossy().to_lowercase().replace( ' ', "_" ) )
                .unwrap_or_else( |_| "unknown".to_string() )
        } );

        Config {
            machine_name,
            ha_url: env::var( "HA_URL" ).unwrap_or_else( |_| "http://localhost:8123/api/states/".to_string() ),
            ha_token: env::var( "HA_TOKEN" ).unwrap_or_default(),
            elekswfd_addr: env::var( "ELEKSWFD_ADDR" ).unwrap_or_else( |_| "127.0.0.1".to_string() ),
            elekswfd_port: env::var( "ELEKSWFD_PORT" )
                .ok()
                .and_then( |v| v.parse().ok() )
                .unwrap_or( 5555 ),
        }
    }
}
