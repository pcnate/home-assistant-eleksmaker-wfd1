use serde::Deserialize;
use wmi::{ COMLibrary, WMIConnection };

use crate::config::SensorIds;


/// Raw sensor row from AIDA64 WMI.
#[derive( Deserialize, Debug )]
#[allow( non_snake_case )]
pub struct Aida64SensorRow {
    pub ID: String,
    pub Label: String,
    pub Value: String,
}


/// Parsed sensor payload with typed fields.
#[derive( Clone )]
pub struct SensorPayload {
    pub cpu_usage: f64,
    pub cpu_temp: f64,
    pub cpu_clock: f64,

    pub gpu_usage: f64,
    pub gpu_temp: f64,

    pub ram_usage: f64,

    pub disk_activity: f64,
    pub disk_read_speed: f64,
    pub disk_write_speed: f64,

    pub battery_perc: f64,
    pub battery_volt: f64,
    pub power_state: String,

    pub connected: u8,
}


impl Default for SensorPayload {
    fn default() -> Self {
        SensorPayload {
            cpu_usage: 0.0,
            cpu_temp: 0.0,
            cpu_clock: 0.0,
            gpu_usage: 0.0,
            gpu_temp: 0.0,
            ram_usage: 0.0,
            disk_activity: 0.0,
            disk_read_speed: 0.0,
            disk_write_speed: 0.0,
            battery_perc: 0.0,
            battery_volt: 0.0,
            power_state: String::new(),
            connected: 0,
        }
    }
}


impl SensorPayload {
    /// Create a payload with NaN values so the first diff always triggers sends.
    pub fn sentinel() -> Self {
        SensorPayload {
            cpu_usage: f64::NAN,
            cpu_temp: f64::NAN,
            cpu_clock: f64::NAN,
            gpu_usage: f64::NAN,
            gpu_temp: f64::NAN,
            ram_usage: f64::NAN,
            disk_activity: f64::NAN,
            disk_read_speed: f64::NAN,
            disk_write_speed: f64::NAN,
            battery_perc: f64::NAN,
            battery_volt: f64::NAN,
            power_state: "\x00".to_string(),
            connected: 255,
        }
    }
}


/// Reads AIDA64 sensor data from WMI.
///
/// Returns None if AIDA64 is not running or WMI query fails.
pub fn read_wmi_sensors( com: &COMLibrary ) -> Option<Vec<Aida64SensorRow>> {
    let conn = WMIConnection::with_namespace_path( "Root\\WMI", (*com).into() ).ok()?;

    let results: Vec<Aida64SensorRow> = conn
        .raw_query( "SELECT * FROM AIDA64_SensorValues" )
        .ok()?;

    Some( results )
}


/// Map raw WMI rows into a SensorPayload using configured sensor IDs.
pub fn map_sensors( rows: &[Aida64SensorRow], max_cpu_clock: &mut f64, ids: &SensorIds ) -> SensorPayload {
    let mut p = SensorPayload::default();

    for row in rows {
        let val_f = row.Value.parse::<f64>().unwrap_or( 0.0 );
        let id = row.ID.as_str();

        if id == ids.cpu_usage {
            p.cpu_usage = val_f.min( 100.0 );
        } else if id == ids.cpu_temp {
            p.cpu_temp = val_f;
        } else if id == ids.cpu_clock {
            if val_f > *max_cpu_clock {
                *max_cpu_clock = val_f;
            }
            p.cpu_clock = ( ( val_f / *max_cpu_clock ) * 100.0 * 100.0 ).round() / 100.0;
        } else if id == ids.gpu_usage {
            p.gpu_usage = val_f.min( 100.0 );
        } else if id == ids.gpu_temp || id == ids.gpu_temp_hot {
            if val_f > p.gpu_temp {
                p.gpu_temp = val_f;
            }
        } else if id == ids.ram_usage {
            p.ram_usage = val_f.min( 100.0 );
        } else if id == ids.disk_activity {
            p.disk_activity = val_f;
        } else if id == ids.disk_read_speed {
            p.disk_read_speed = val_f;
        } else if id == ids.disk_write_speed {
            p.disk_write_speed = val_f;
        } else if id == ids.battery_perc {
            p.battery_perc = val_f;
        } else if id == ids.battery_volt {
            p.battery_volt = val_f;
        } else if id == ids.power_state {
            p.power_state = row.Value.clone();
        }
    }

    p
}


/// Metric definition for diffing and posting to HA.
pub struct MetricDiff {
    pub name: &'static str,
    pub unit: Option<&'static str>,
    pub friendly_name: &'static str,
}


/// All metrics we track and push to HA.
pub const METRICS: &[MetricDiff] = &[
    MetricDiff { name: "cpu_usage",        unit: Some( "%" ),    friendly_name: "CPU Usage" },
    MetricDiff { name: "cpu_clock",        unit: Some( "%" ),    friendly_name: "Max CPU Clock" },
    MetricDiff { name: "cpu_temp",         unit: Some( "°C" ),   friendly_name: "CPU Temp" },
    MetricDiff { name: "gpu_usage",        unit: Some( "%" ),    friendly_name: "GPU Usage" },
    MetricDiff { name: "gpu_temp",         unit: Some( "°C" ),   friendly_name: "GPU Temp" },
    MetricDiff { name: "ram_usage",        unit: Some( "%" ),    friendly_name: "RAM Usage" },
    MetricDiff { name: "disk_activity",    unit: Some( "%" ),    friendly_name: "Disk Activity" },
    MetricDiff { name: "disk_read_speed",  unit: Some( "MB/s" ), friendly_name: "Disk Read Speed" },
    MetricDiff { name: "disk_write_speed", unit: Some( "MB/s" ), friendly_name: "Disk Write Speed" },
    MetricDiff { name: "battery_perc",     unit: Some( "%" ),    friendly_name: "Battery Percentage" },
    MetricDiff { name: "battery_volt",     unit: Some( "V" ),    friendly_name: "Battery Voltage" },
    MetricDiff { name: "power_state",      unit: None,           friendly_name: "Power State" },
    MetricDiff { name: "connected",        unit: None,           friendly_name: "BLA Nate T1D3L Connected" },
];


/// Extract a field value as a JSON-ready serde_json::Value by metric name.
pub fn get_field_value( payload: &SensorPayload, name: &str ) -> serde_json::Value {
    match name {
        "cpu_usage"        => serde_json::json!( payload.cpu_usage ),
        "cpu_clock"        => serde_json::json!( payload.cpu_clock ),
        "cpu_temp"         => serde_json::json!( payload.cpu_temp ),
        "gpu_usage"        => serde_json::json!( payload.gpu_usage ),
        "gpu_temp"         => serde_json::json!( payload.gpu_temp ),
        "ram_usage"        => serde_json::json!( payload.ram_usage ),
        "disk_activity"    => serde_json::json!( payload.disk_activity ),
        "disk_read_speed"  => serde_json::json!( payload.disk_read_speed ),
        "disk_write_speed" => serde_json::json!( payload.disk_write_speed ),
        "battery_perc"     => serde_json::json!( payload.battery_perc ),
        "battery_volt"     => serde_json::json!( payload.battery_volt ),
        "power_state"      => serde_json::json!( payload.power_state ),
        "connected"        => serde_json::json!( payload.connected ),
        _ => serde_json::Value::Null,
    }
}


/// Format a field value as a fixed-width string for log output.
pub fn format_field_value( payload: &SensorPayload, name: &str ) -> String {
    match name {
        "cpu_clock"    => format!( "{:>7.2}", payload.cpu_clock ),
        "battery_volt" => format!( "{:>7.3}", payload.battery_volt ),
        "power_state"  => format!( "{:>7}", payload.power_state ),
        _ => {
            let v = match name {
                "cpu_usage"        => payload.cpu_usage,
                "cpu_temp"         => payload.cpu_temp,
                "gpu_usage"        => payload.gpu_usage,
                "gpu_temp"         => payload.gpu_temp,
                "ram_usage"        => payload.ram_usage,
                "disk_activity"    => payload.disk_activity,
                "disk_read_speed"  => payload.disk_read_speed,
                "disk_write_speed" => payload.disk_write_speed,
                "battery_perc"     => payload.battery_perc,
                "connected"        => payload.connected as f64,
                _ => 0.0,
            };
            format!( "{:>7}", v as i64 )
        }
    }
}


/// Compare two payloads for a given metric name. Returns true if the value changed.
pub fn field_changed( a: &SensorPayload, b: &SensorPayload, name: &str ) -> bool {
    match name {
        "cpu_usage"        => a.cpu_usage != b.cpu_usage,
        "cpu_clock"        => a.cpu_clock != b.cpu_clock,
        "cpu_temp"         => a.cpu_temp != b.cpu_temp,
        "gpu_usage"        => a.gpu_usage != b.gpu_usage,
        "gpu_temp"         => a.gpu_temp != b.gpu_temp,
        "ram_usage"        => a.ram_usage != b.ram_usage,
        "disk_activity"    => a.disk_activity != b.disk_activity,
        "disk_read_speed"  => a.disk_read_speed != b.disk_read_speed,
        "disk_write_speed" => a.disk_write_speed != b.disk_write_speed,
        "battery_perc"     => a.battery_perc != b.battery_perc,
        "battery_volt"     => a.battery_volt != b.battery_volt,
        "power_state"      => a.power_state != b.power_state,
        "connected"        => a.connected != b.connected,
        _ => false,
    }
}
