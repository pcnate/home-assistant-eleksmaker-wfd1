#pragma once

#include "esphome/core/component.h"
#include "esphome/components/i2c/i2c.h"
#include "esphome/components/time/real_time_clock.h"
#include "driver/gpio.h"


// ensure it is only defined once
namespace esphome {

  namespace sensor {
    class Sensor;
  }

  namespace text_sensor {
    class TextSensor;
  }

  namespace binary_sensor {
    class BinarySensor;
  }

  namespace elekswfd {

    class EleksWFD : public Component {

    public:
      EleksWFD(
        i2c::I2CBus *bus,
        uint8_t rtc_addr,
        uint8_t tm1680_addr,
        int mic_pin,
        int a_key_pin,
        int b_key_pin,
        int c_key_pin,
        esphome::time::RealTimeClock *time
      ): i2c_bus_( bus ),
     rtc_address_( rtc_addr ),
  tm1680_address_( tm1680_addr ),
         mic_pin_( mic_pin ),
       a_key_pin_( static_cast<gpio_num_t>( a_key_pin ) ),
       b_key_pin_( static_cast<gpio_num_t>( b_key_pin ) ),
       c_key_pin_( static_cast<gpio_num_t>( c_key_pin ) ),
            time_( time )
      {}

      void set_cpu_usage_sensor(sensor::Sensor *sens) { cpu_usage_ = sens; }
      void set_gpu_usage_sensor(sensor::Sensor *sens) { gpu_usage_ = sens; }
      void set_ram_usage_sensor(sensor::Sensor *sens) { ram_usage_ = sens; }
      void set_weather_sensor(sensor::Sensor *sens) { weather_sensor_ = sens; }

      void set_bar_chart_1_sensor(sensor::Sensor *sens) { bar_chart_1_ = sens; }
      void set_bar_chart_2_sensor(sensor::Sensor *sens) { bar_chart_2_ = sens; }

      void set_speaker_sensor(binary_sensor::BinarySensor *sens) { speaker_sensor_ = sens; }
      void set_microphone_sensor(binary_sensor::BinarySensor *sens) { microphone_sensor_ = sens; }
      void set_headsets_sensor(binary_sensor::BinarySensor *sens) { headsets_sensor_ = sens; }
      void set_record_sensor(binary_sensor::BinarySensor *sens) { record_sensor_ = sens; }

      void set_settings_sensor(binary_sensor::BinarySensor *sens) { settings_sensor_ = sens; }
      void set_desktop_connected( binary_sensor::BinarySensor *sens ) { desktop_connected_sensor_ = sens; }
      void set_server_connected( binary_sensor::BinarySensor *sens ) { server_connected_sensor_ = sens; }

      void set_watch_sensor(binary_sensor::BinarySensor *sens) { watch_sensor_ = sens; }
      void set_hourglass_sensor(binary_sensor::BinarySensor *sens) { hourglass_sensor_ = sens; }
      void set_battery_sensor(binary_sensor::BinarySensor *sens) { battery_sensor_ = sens; }

      void set_calendar_sensor(binary_sensor::BinarySensor *sens) { calendar_sensor_ = sens; }
      void set_hotspot_sensor(binary_sensor::BinarySensor *sens) { hotspot_sensor_ = sens; }

      void set_show_time(binary_sensor::BinarySensor *sens) { show_time_ = sens; }
      void set_show_mic(binary_sensor::BinarySensor *sens) { show_mic_ = sens; }
      void set_show_logo(binary_sensor::BinarySensor *sens) { show_logo_ = sens; }

      void set_logo_animation(text_sensor::TextSensor *sens);
      void set_gif_animation(text_sensor::TextSensor *sens);
      void set_upper_text(text_sensor::TextSensor *sens);
      void set_lower_text(text_sensor::TextSensor *sens);

      /**
       * display OTA progress on the upper digits, or end OTA mode
       *
       * @param pct 0-100 for progress, -1 to end OTA mode
       */
      void setOtaProgress( int pct );

      /**
       * write a 13 segment digit to the display
       *
       * @param digit the digit to write to (1-6) which corresponds to upper_digit_n
       * @param value the value to write to the digit (typical 13 segment values)
       */
      void writeUpperDigit( uint8_t digit, char value );

      void setup() override;
      void loop() override;

    private:
      i2c::I2CBus *i2c_bus_;
      uint8_t rtc_address_;
      uint8_t tm1680_address_;
      int mic_pin_;
      gpio_num_t a_key_pin_;
      gpio_num_t b_key_pin_;
      gpio_num_t c_key_pin_;

      esphome::time::RealTimeClock *time_{nullptr};

      sensor::Sensor *cpu_usage_{ nullptr };
      sensor::Sensor *gpu_usage_{ nullptr };
      sensor::Sensor *ram_usage_{ nullptr };

      sensor::Sensor *weather_sensor_{ nullptr };

      sensor::Sensor *bar_chart_1_{ nullptr };
      sensor::Sensor *bar_chart_2_{ nullptr };

      binary_sensor::BinarySensor *speaker_sensor_{ nullptr };
      binary_sensor::BinarySensor *microphone_sensor_{ nullptr };
      binary_sensor::BinarySensor *headsets_sensor_{ nullptr };
      binary_sensor::BinarySensor *record_sensor_{ nullptr };

      binary_sensor::BinarySensor *settings_sensor_{ nullptr };
      binary_sensor::BinarySensor *desktop_connected_sensor_{ nullptr };
      binary_sensor::BinarySensor *server_connected_sensor_{ nullptr };

      binary_sensor::BinarySensor *watch_sensor_{ nullptr };
      binary_sensor::BinarySensor *hourglass_sensor_{ nullptr };
      binary_sensor::BinarySensor *battery_sensor_{ nullptr };

      binary_sensor::BinarySensor *calendar_sensor_{ nullptr };
      binary_sensor::BinarySensor *hotspot_sensor_{ nullptr };

      binary_sensor::BinarySensor *show_time_{ nullptr };
      binary_sensor::BinarySensor *show_mic_{ nullptr };
      binary_sensor::BinarySensor *show_logo_{ nullptr };

      text_sensor::TextSensor *logo_animation_{ nullptr };
      text_sensor::TextSensor *gif_animation_{ nullptr };
      text_sensor::TextSensor *upper_text_{ nullptr };
      text_sensor::TextSensor *lower_text_{ nullptr };

      bool last_a_state_, last_b_state_, last_c_state_;
      bool a_press_registered_, b_press_registered_, c_press_registered_;
      int64_t last_a_change_time_, last_b_change_time_, last_c_change_time_;
      int32_t debounce_time_;
      int64_t last_time_;

      std::vector<uint32_t> logo_frames;
      std::vector<uint16_t> logo_delays;
      int logo_frame_total{0};
      int logo_frame_index{0};
      int64_t logo_last_frame_time_{0};

      std::vector<uint64_t> gif_frames;
      std::vector<uint16_t> gif_delays;
      int gif_frame_total{0};
      int gif_frame_index{0};
      int64_t gif_last_frame_time_{0};

      char upper_text[64];
      int upper_text_length_{0};
      int upper_text_scroll_offset_{0};
      int64_t upper_text_last_scroll_time_{0};
      bool ota_active_{false};

      char lower_text[64];
      int lower_text_length_{0};
      int lower_text_scroll_offset_{0};
      int64_t lower_text_last_scroll_time_{0};
      bool lower_text_active_{false};

      bool started = false;
      int counter = 0;
      int barcounter = 0;
      bool invert_bar = false;
      int cpu_usage = 0;
      int gpu_usage = 0;
      int ram_usage = 0;
      bool invert_cpu_usage = false;
      bool invert_gpu_usage = false;
      bool invert_ram_usage = false;

      // define 24*16 bit private display_elements
      bool display_elements[24*16];

      /**
       * debug function
       */
      void debug();

      /**
       * initialize the DS3231 RTC over I2C
       */
      void initializeDS3231();

      /**
       * initialize the TM1680 Matrix over I2C
       */
      void initializeTM1680();

      /**
       * initialize the buttons
       */
      void initializeButtons();

      /**
       * initializes the microphone ADC sensor
       */
      void initializeMicrophone();

      /**
       * write the display_elements to the TM1680
       */
      void updateDisplay();

      /**
       * animate the display
       */
      void animate();

      /**
       * render the GIF, bit 0 is the at matrix location 1x1, bit 1 is at 1x2 etc
       */
      void renderGIF();

      /**
       * render scrolling upper text to the 14-segment digits, skipped during OTA
       */
      void renderUpperText();

      /**
       * render lower text to the 7-segment digits, skipped when inactive (clock shows instead)
       */
      void renderLowerText();

      /**
       * parse an 11-char-per-frame encoded string into gif_frames and gif_delays
       *
       * @param data the encoded animation string (6 bits per char, offset 0x30)
       */
      void parseGifData( const std::string &data );

      /**
       * render the logo
       */
      void renderLogo();

      /**
       * parse a 5-char-per-frame encoded string into logo_frames and logo_delays
       *
       * @param data the encoded animation string (6 bits per char, offset 0x30)
       */
      void parseLogoData( const std::string &data );

      /**
       * calculated the hour, minute and second digits and call the write functions
       */
      void updateTime( int hour, int minute, int second );

      /**
       * read the value of teh microphone pin and set the sound level
       */
      void readMicrophone();

      /**
       * read external sensors and update the appropriate variables
       */
      void updateExternals();

      /**
       * write a 7 segment digit to the display
       *
       * @param digit the digit to write to (1-6) which corresponds to lower_digit_n
       * @param value the value to write to the digit (typical 7 segment values)
       */
      void writeLowerDigit(uint8_t digit, char value);

      /**
       * set day of week
       * 
       * @param value the day of week to set (1-7) starting with Monday
       */
      void setDayOfWeek( uint8_t value );

      /**
       * set cpu usage
       * 
       * @param value the cpu usage to set (0-100)
       */
      void setCpuUsage( uint8_t value );

      /**
       * set gpu usage
       * 
       * @param value the gpu usage to set (0-100)
       */
      void setGpuUsage( uint8_t value );

      /**
       * set ram usage
       * 
       * @param value the ram usage to set (0-100)
       */
      void setRamUsage( uint8_t value );

      /**
       * set bar chart level
       * 
       * @param bar false for the left bar, true for the right bar
       * @param value the value to set (0-100)
       */
      void setBarChart( bool bar, uint8_t value );

      /**
       * set weather
       * 
       * @param mode the weather mode to set
       * 0 = off
       * 1 = sunny
       * 2 = cloudy
       * 3 = rains
       */
      void setWeather( int mode );

      void showSpeaker( bool show );
      void showMicrophone( bool show );
      void showHeadsets( bool show );
      void showRecord( bool show );

      void showSettings( bool show );
      void showServerConnected( bool show );
      void showDesktopConnected( bool show );

      void showWatch( bool show );
      void showHourglass( bool show );
      void showBattery( bool show );

      void showCalendar( bool show );
      void showHotspot( bool show );

      /**
       * set connected status for pc
       * 
       * @param server true if server, false if desktop
       * @param connected true if connected, false if not
       */
      void setConnected( bool server, bool connected );

      /**
       * read time from RTC and set it on the ESP
       */
      void readTimeFromRTC();

    };

  }  // namespace elekswfd
}  // namespace esphome