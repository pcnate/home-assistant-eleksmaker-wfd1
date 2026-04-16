import esphome.codegen as cg
import esphome.config_validation as cv
from esphome.components import i2c, time, display, sensor, binary_sensor, switch, text_sensor
from esphome.const import CONF_ID, CONF_I2C_ID, CONF_TIME_ID
from esphome import core

DEPENDENCIES = ["i2c", "time"]

# Define namespaces and classes
elekswfd_ns = cg.esphome_ns.namespace("elekswfd")
EleksWfdComponent = elekswfd_ns.class_("EleksWFD", cg.Component, i2c.I2CDevice)

SENSOR_ID = cv.use_id( sensor.Sensor )
# BINARY_ID = cv.Any( cv.use_id( binary_sensor.BinarySensor ), cv.use_id( switch.Switch ) )
BINARY_ID = cv.use_id( binary_sensor.BinarySensor )
TEXT_SENSOR_ID = cv.use_id( text_sensor.TextSensor )

# Configuration schema
CONFIG_SCHEMA = cv.Schema({
  cv.GenerateID(): cv.declare_id(EleksWfdComponent),
  cv.Optional(CONF_I2C_ID): cv.use_id(i2c.I2CBus),
  cv.Optional("tm1680_address", default=0x73): cv.i2c_address,
  cv.Optional("rtc_address", default=0x68): cv.i2c_address,
  cv.Optional("mic_pin", default=32): cv.int_range(min=0, max=39),
  cv.Optional("a_key_pin", default=27): cv.int_range(min=0, max=39),
  cv.Optional("b_key_pin", default=26): cv.int_range(min=0, max=39),
  cv.Optional("c_key_pin", default=25): cv.int_range(min=0, max=39),
  cv.Required(CONF_TIME_ID): cv.use_id(time.RealTimeClock),
  
  cv.Optional("cpu_usage"):       SENSOR_ID,
  cv.Optional("gpu_usage"):       SENSOR_ID,
  cv.Optional("ram_usage"):       SENSOR_ID,
  
  cv.Optional("weather"):         SENSOR_ID,
  
  cv.Optional("bar_chart_1"):     SENSOR_ID,
  cv.Optional("bar_chart_2"):     SENSOR_ID,
  
  cv.Optional("show_speaker"):    BINARY_ID,
  cv.Optional("show_microphone"): BINARY_ID,
  cv.Optional("show_headsets"):   BINARY_ID,
  cv.Optional("show_record"):     BINARY_ID,
  
  cv.Optional("show_settings"):   BINARY_ID,
  cv.Optional("show_desktop"):    BINARY_ID,
  cv.Optional("show_server"):     BINARY_ID,
  
  cv.Optional("show_watch"):      BINARY_ID,
  cv.Optional("show_hourglass"):  BINARY_ID,
  cv.Optional("show_battery"):    BINARY_ID,
  
  cv.Optional("show_calendar"):   BINARY_ID,
  cv.Optional("show_hotspot"):    BINARY_ID,
  
  cv.Optional("show_time"):       BINARY_ID,
  cv.Optional("show_mic"):        BINARY_ID,
  cv.Optional("show_logo"):       BINARY_ID,
  cv.Optional("logo_flicker"):    SENSOR_ID,
  cv.Optional("gif_clear_after"): BINARY_ID,

  cv.Optional("gif_data"):        TEXT_SENSOR_ID,
  cv.Optional("logo_data"):       TEXT_SENSOR_ID,
  cv.Optional("upper_text"):      TEXT_SENSOR_ID,
  cv.Optional("lower_text"):      TEXT_SENSOR_ID,
}).extend( cv.COMPONENT_SCHEMA )

# Code generation function
async def to_code(config):
  bus = await cg.get_variable(config[CONF_I2C_ID]) if CONF_I2C_ID in config else None
  timer_var = await cg.get_variable(config["time_id"])
  
  var = cg.new_Pvariable(
    config[CONF_ID],
    bus,
    config["rtc_address"],
    config["tm1680_address"],
    config["mic_pin"],
    config["a_key_pin"],
    config["b_key_pin"],
    config["c_key_pin"],
    timer_var
  )

  if "cpu_usage" in config:
    sens = await cg.get_variable(config["cpu_usage"])
    cg.add(var.set_cpu_usage_sensor(sens))
  if "gpu_usage" in config:
    sens = await cg.get_variable(config["gpu_usage"])
    cg.add(var.set_gpu_usage_sensor(sens))
  if "ram_usage" in config:
    sens = await cg.get_variable(config["ram_usage"])
    cg.add(var.set_ram_usage_sensor(sens))
      
  if "bar_chart_1" in config:
    sens = await cg.get_variable(config["bar_chart_1"])
    cg.add(var.set_bar_chart_1_sensor(sens))
  if "bar_chart_2" in config:
    sens = await cg.get_variable(config["bar_chart_2"])
    cg.add(var.set_bar_chart_2_sensor(sens))

  if "weather" in config:
    sens = await cg.get_variable(config["weather"])
    cg.add(var.set_weather_sensor(sens))

  if "show_speaker" in config:
    sens = await cg.get_variable(config["show_speaker"])
    cg.add(var.set_speaker_sensor(sens))
  if "show_microphone" in config:
    sens = await cg.get_variable(config["show_microphone"])
    cg.add(var.set_microphone_sensor(sens))
  if "show_headsets" in config:
    sens = await cg.get_variable(config["show_headsets"])
    cg.add(var.set_headsets_sensor(sens))
  if "show_record" in config:
    sens = await cg.get_variable(config["show_record"])
    cg.add(var.set_record_sensor(sens))
    
  if "show_settings" in config:
    sens = await cg.get_variable(config["show_settings"])
    cg.add(var.set_settings_sensor(sens))
  if "show_desktop" in config:
    sens = await cg.get_variable(config["show_desktop"])
    cg.add(var.set_desktop_connected(sens))
  if "show_server" in config:
    sens = await cg.get_variable(config["show_server"])
    cg.add(var.set_server_connected(sens))
    
  if "show_watch" in config:
    sens = await cg.get_variable(config["show_watch"])
    cg.add(var.set_watch_sensor(sens))
  if "show_hourglass" in config:
    sens = await cg.get_variable(config["show_hourglass"])
    cg.add(var.set_hourglass_sensor(sens))
  if "show_battery" in config:
    sens = await cg.get_variable(config["show_battery"])
    cg.add(var.set_battery_sensor(sens))
    
  if "show_calendar" in config:
    sens = await cg.get_variable(config["show_calendar"])
    cg.add(var.set_calendar_sensor(sens))
  if "show_hotspot" in config:
    sens = await cg.get_variable(config["show_hotspot"])
    cg.add(var.set_hotspot_sensor(sens))
  
  if "show_time" in config:
    sens = await cg.get_variable(config["show_time"])
    cg.add(var.set_show_time(sens))
  if "show_mic" in config:
    sens = await cg.get_variable(config["show_mic"])
    cg.add(var.set_show_mic(sens))
  if "show_logo" in config:
    sens = await cg.get_variable(config["show_logo"])
    cg.add(var.set_show_logo(sens))
  if "logo_flicker" in config:
    sens = await cg.get_variable(config["logo_flicker"])
    cg.add(var.set_logo_flicker(sens))
  if "gif_clear_after" in config:
    sens = await cg.get_variable(config["gif_clear_after"])
    cg.add(var.set_gif_clear_after(sens))

  if "gif_data" in config:
    sens = await cg.get_variable(config["gif_data"])
    cg.add(var.set_gif_animation(sens))
  if "logo_data" in config:
    sens = await cg.get_variable(config["logo_data"])
    cg.add(var.set_logo_animation(sens))
  if "upper_text" in config:
    sens = await cg.get_variable(config["upper_text"])
    cg.add(var.set_upper_text(sens))
  if "lower_text" in config:
    sens = await cg.get_variable(config["lower_text"])
    cg.add(var.set_lower_text(sens))

  await cg.register_component(var, config)