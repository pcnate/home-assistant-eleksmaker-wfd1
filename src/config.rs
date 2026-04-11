use std::env;


/// AIDA64 sensor ID mapping, configurable per machine.
pub struct SensorIds {
    pub cpu_usage: String,
    pub cpu_temp: String,
    pub cpu_clock: String,
    pub gpu_usage: String,
    pub gpu_temp: String,
    pub gpu_temp_hot: String,
    pub ram_usage: String,
    pub disk_activity: String,
    pub disk_read_speed: String,
    pub disk_write_speed: String,
    pub battery_perc: String,
    pub battery_volt: String,
    pub power_state: String,
}


impl SensorIds {

    /// Load sensor IDs from SENSOR_* env vars, with defaults for GPU1/Disk1.
    pub fn load() -> Self {
        SensorIds {
            cpu_usage:        env::var( "SENSOR_CPU_USAGE" ).unwrap_or_else( |_| "SCPUUTI".to_string() ),
            cpu_temp:         env::var( "SENSOR_CPU_TEMP" ).unwrap_or_else( |_| "TCPU".to_string() ),
            cpu_clock:        env::var( "SENSOR_CPU_CLOCK" ).unwrap_or_else( |_| "SCPUCLK".to_string() ),
            gpu_usage:        env::var( "SENSOR_GPU_USAGE" ).unwrap_or_else( |_| "SGPU1UTI".to_string() ),
            gpu_temp:         env::var( "SENSOR_GPU_TEMP" ).unwrap_or_else( |_| "TGPU1".to_string() ),
            gpu_temp_hot:     env::var( "SENSOR_GPU_TEMP_HOT" ).unwrap_or_else( |_| "TGPU1HOT".to_string() ),
            ram_usage:        env::var( "SENSOR_RAM_USAGE" ).unwrap_or_else( |_| "SMEMUTI".to_string() ),
            disk_activity:    env::var( "SENSOR_DISK_ACTIVITY" ).unwrap_or_else( |_| "SDSK1ACT".to_string() ),
            disk_read_speed:  env::var( "SENSOR_DISK_READ" ).unwrap_or_else( |_| "SDSK1READSPD".to_string() ),
            disk_write_speed: env::var( "SENSOR_DISK_WRITE" ).unwrap_or_else( |_| "SDSK1WRITESPD".to_string() ),
            battery_perc:     env::var( "SENSOR_BATTERY_PERC" ).unwrap_or_else( |_| "SBATTLVL".to_string() ),
            battery_volt:     env::var( "SENSOR_BATTERY_VOLT" ).unwrap_or_else( |_| "VBATT".to_string() ),
            power_state:      env::var( "SENSOR_POWER_STATE" ).unwrap_or_else( |_| "SPWRSTATE".to_string() ),
        }
    }
}


/// Application configuration loaded from .env and environment variables.
pub struct Config {
    pub machine_name: String,
    pub ha_url: String,
    pub ha_token: String,
    pub sensors: SensorIds,
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
            sensors: SensorIds::load(),
        }
    }
}
