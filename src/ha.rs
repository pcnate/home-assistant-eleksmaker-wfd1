use reqwest::Client;
use serde_json::json;

use crate::logging::log;


/// Build a reqwest client with the HA auth header baked in.
pub fn build_client( ha_token: &str ) -> Client {
    let mut headers = reqwest::header::HeaderMap::new();
    headers.insert( "Authorization", format!( "Bearer {}", ha_token ).parse().unwrap() );
    headers.insert( "Content-Type", "application/json".parse().unwrap() );

    Client::builder()
        .default_headers( headers )
        .build()
        .expect( "Failed to build HTTP client" )
}


/// Post a sensor value to Home Assistant.
/// Logs the metric name and root cause on failure.
/// Returns true on success.
pub async fn post_to_ha(
    client: &Client,
    ha_url: &str,
    machine_name: &str,
    sensor_name: &str,
    state: serde_json::Value,
    unit: Option<&str>,
    friendly_name: &str,
) -> bool {
    let url = format!( "{}sensor.{}_{}", ha_url, machine_name, sensor_name );

    let mut attributes = json!( { "friendly_name": friendly_name } );
    if let Some( u ) = unit {
        attributes["unit_of_measurement"] = json!( u );
    }

    let body = json!( {
        "state": state,
        "attributes": attributes,
    } );

    match client.post( &url ).json( &body ).send().await {
        Ok( res ) if res.status().is_success() => true,
        Ok( res ) => {
            log( &format!( "HA error [{}]: {}", sensor_name, res.status() ) );
            false
        }
        Err( e ) => {
            log( &format!( "HA fetch failed [{}]: {}", sensor_name, e ) );
            false
        }
    }
}


/// GET a sensor state from Home Assistant. Returns the state string or None.
pub async fn get_from_ha( client: &Client, ha_url: &str, machine_name: &str, sensor_name: &str ) -> Option<String> {
    let url = format!( "{}sensor.{}_{}", ha_url, machine_name, sensor_name );

    match client.get( &url ).send().await {
        Ok( res ) if res.status().is_success() => {
            if let Ok( body ) = res.json::<serde_json::Value>().await {
                body["state"].as_str().map( |s| s.to_string() )
            } else {
                None
            }
        }
        _ => None,
    }
}


/// Test connectivity to Home Assistant at startup.
pub async fn check_connectivity( client: &Client, ha_url: &str, machine_name: &str ) -> bool {
    log( &format!( "Checking HA connectivity: {}", ha_url ) );

    let url = format!( "{}sensor.{}_connected", ha_url, machine_name );
    match client.get( &url ).send().await {
        Ok( res ) => {
            let status = res.status().as_u16();
            if res.status().is_success() || status == 404 {
                // 404 = entity doesn't exist yet, but HA is reachable
                log( &format!( "HA connected: {} ({})", ha_url, status ) );
                true
            } else if status == 401 {
                log( &format!( "HA auth failed (401) -- check HA_TOKEN" ) );
                false
            } else {
                log( &format!( "HA returned {} -- check HA_URL and HA_TOKEN", status ) );
                false
            }
        }
        Err( e ) => {
            log( &format!( "HA unreachable: {}", e ) );
            log( &format!( "  URL: {}", ha_url ) );
            false
        }
    }
}
