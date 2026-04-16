#include "elekswfd.h"
#include "esphome/core/log.h"
#include "displays.cpp"
#include "7_seg.cpp"
#include "14_seg.cpp"
#include "sys/time.h"
#include "esphome/components/time/real_time_clock.h"
#include "driver/adc.h"
#include "driver/gpio.h"
#include "esp_timer.h"
#include "esphome/components/time/real_time_clock.h"
#include <sstream>

#ifdef __INTELLISENSE__
#pragma diag_suppress 1696
#endif
#include "esphome/components/sensor/sensor.h"
#include "esphome/components/text_sensor/text_sensor.h"
#include "esphome/components/binary_sensor/binary_sensor.h"
#include "esphome/components/api/api_server.h"
#include "esphome/components/api/api_pb2.h"
#include "esphome/components/api/homeassistant_service.h"
#ifdef __INTELLISENSE__
#pragma diag_default 1696
#endif

namespace esphome {
namespace elekswfd {

static const char *TAG = "EleksWFD";

void EleksWFD::setup() {
  ESP_LOGD(TAG, "Setup complete!");

  logo_frames.clear();
  logo_frames.push_back(0x0FEFEFEF);
  logo_frames.push_back(0x0EFEFEFE);
  logo_frames.push_back(0x03FFFFFF);
  logo_frames.push_back(0x0FEFEFEF);
  logo_frames.push_back(0x0EFEFEFE);
  logo_frames.push_back(0x03FFFFFF);
  logo_frame_total = logo_frames.size();
  logo_frame_index = 0;

  this->counter = 0;
  this->barcounter = 0;
  this->invert_bar = false;
  this->cpu_usage = 0;
  this->gpu_usage = 0;
  this->ram_usage = 0;
  this->invert_cpu_usage = false;
  this->invert_gpu_usage = false;
  this->invert_ram_usage = false;

  last_time_ = esp_timer_get_time();
  logo_last_frame_time_ = last_time_;
  gif_last_frame_time_ = last_time_;

  // initialize all registers to 0
  for (int i = 0; i < 24*16; i++) {
    display_elements[i] = false;
  }

  this->initializeDS3231();
  this->initializeTM1680();
  this->initializeButtons();
  this->initializeMicrophone();
  this->readTimeFromRTC();
  this->buildFlickerList();

  // this->updateTime( this->counter, this->counter, this->counter );

  set_interval(   66, [this](){ this->debug(); });
  set_interval(   25, [this](){ this->updateDisplay(); });
  set_interval( 1000, [this](){ this->readTimeFromRTC(); });
  set_interval(   50, [this](){ this->readMicrophone(); });
  set_interval(  133, [this](){ this->updateExternals(); });
  set_interval(   50, [this](){ this->animate(); });
  set_interval(   10, [this](){ this->applyFlicker(); });
}

void EleksWFD::loop() {
  int64_t now = esp_timer_get_time(); // Current time
  this->debounce_time_ = 50; // 50ms debounce time

  const bool PRESSED = false;

  // Debounce (Key A)
  bool current_a_state = gpio_get_level( this->a_key_pin_ );
  if ( current_a_state != last_a_state_ ) {
    last_a_change_time_ = now;
    last_a_state_ = current_a_state;
    if ( current_a_state != PRESSED ) {
      a_press_registered_ = false;
    }
  }
  else if ( now - last_a_change_time_ >= debounce_time_ &&
            current_a_state == PRESSED &&
            !a_press_registered_ ) {
    this->counter++;
    a_press_registered_ = true;
  }

  // Debounce (Key B)
  bool current_b_state = gpio_get_level( this->b_key_pin_ );
  if ( current_b_state != last_b_state_ ) {
    last_b_change_time_ = now;
    last_b_state_ = current_b_state;
    if ( current_b_state != PRESSED ) {
      b_press_registered_ = false;
    }
  }
  else if ( now - last_b_change_time_ >= debounce_time_ &&
            current_b_state == PRESSED &&
            !b_press_registered_ ) {
    this->counter--;
    b_press_registered_ = true;
  }

  // Debounce (Key C)
  bool current_c_state = gpio_get_level( this->c_key_pin_ );
  if ( current_c_state != last_c_state_ ) {
    last_c_change_time_ = now;
    last_c_state_ = current_c_state;
    if ( current_c_state != PRESSED ) {
      c_press_registered_ = false;
    }
  }
  else if ( now - last_c_change_time_ >= debounce_time_ &&
            current_c_state == PRESSED &&
            !c_press_registered_ ) {
    this->counter += 10;
    c_press_registered_ = true;
  }
}

void EleksWFD::debug() {
  this->counter--;
  if ( this->counter > 49 ) {
    this->counter = 0;
  }
  if ( this->counter < 0 ) {
    this->counter = 49;
  }

  // loop through the matrix circle elements and highlight based on counter
  // for (int i = 0; i < 12; i++) {
  //   display_elements[ esphome::elekswfd::display::matrix::CIRCLE[i] ] = ( i % 3 ) == ( this->counter % 3 );
  // }

  // loop through the matrix and highlight a single element based on counter
  // 0-6 should highlight a single led in the top row
  // 7-13 should highlight a single led in the next row etc
  // for (int i = 0; i < 49; i++) {
  //   if ( this->counter >= 0 && this->counter <= 6 ) {
  //     display_elements[ esphome::elekswfd::display::matrix::ROW_0[i] ] = i == this->counter;
  //   }
  //   else if ( this->counter >= 7 && this->counter <= 13 ) {
  //     display_elements[ esphome::elekswfd::display::matrix::ROW_1[i] ] = i == this->counter - 7;
  //   }
  //   else if ( this->counter >= 14 && this->counter <= 20 ) {
  //     display_elements[ esphome::elekswfd::display::matrix::CIRCLE[i] ] = i == this->counter - 14;
  //   }
  //   else if ( this->counter >= 21 && this->counter <= 27 ) {
  //     display_elements[ esphome::elekswfd::display::matrix::CIRCLE[i] ] = i == this->counter - 21;
  //   }
  //   else if ( this->counter >= 28 && this->counter <= 34 ) {
  //     display_elements[ esphome::elekswfd::display::matrix::CIRCLE[i] ] = i == this->counter - 28;
  //   }
  //   else if ( this->counter >= 35 && this->counter <= 41 ) {
  //     display_elements[ esphome::elekswfd::display::matrix::CIRCLE[i] ] = i == this->counter - 35;
  //   }
  //   else if ( this->counter >= 42 && this->counter <= 48 ) {
  //     display_elements[ esphome::elekswfd::display::matrix::CIRCLE[i] ] = i == this->counter - 42;
  //   } else {
  //     display_elements[ esphome::elekswfd::display::matrix::CIRCLE[i] ] = false;
  //   }
  // }

}

void EleksWFD::updateDisplay() {
  std::vector<uint8_t> display_packet;
  display_packet.push_back(0b11000010); // write command 0xC2
  display_packet.push_back(0b00000000); // some things I don't understand

  // grab 8 bits at a time from the display_elements array and add it to the display_packet
  for (int i = 0; i < 24*16; i += 8) {
    uint8_t byte = 0;
    for (int j = 0; j < 8; j++) {
      byte |= display_elements[i+j] << j;
    }
    display_packet.push_back(byte);
  }

  this->i2c_bus_->write( this->tm1680_address_, display_packet.data(), display_packet.size());
}

void EleksWFD::initializeDS3231() {
  uint8_t data[19];
  this->i2c_bus_->read(this->rtc_address_, data, 19);
  uint8_t control_reg = data[0x0E];
  control_reg &= ~(1 << 7);
  // this->i2c_bus_->write_register(this->rtc_address_, 0x0E, &control_reg, 1);

  // log the control register in 0b00 format
  ESP_LOGD(TAG, "Control Register: 0b%02x", control_reg);
}

void EleksWFD::initializeTM1680() {
  uint8_t sys_en = 0b10000001;  // Enable system oscillator (SYS EN)
  this->i2c_bus_->write(this->tm1680_address_, &sys_en, 7);
  ESP_LOGI("TM1680", "System Clock Enabled (0b10000001)");

  uint8_t rc_master_mode = 0b10011010;  // Set RC Master Mode 1 (0x9A)
  this->i2c_bus_->write(this->tm1680_address_, &rc_master_mode, 1);
  ESP_LOGI("TM1680", "Set to RC Master Mode 1 (0b10011010)");

  uint8_t sys_disable = 0x80;  // Disable system clock
  this->i2c_bus_->write(this->tm1680_address_, &sys_disable, 1);
  ESP_LOGI("TM1680", "System clock disabled.");

  uint8_t led_disable = 0x82;  // Disable LED display
  this->i2c_bus_->write(this->tm1680_address_, &led_disable, 1);
  ESP_LOGI("TM1680", "LED display disabled.");

  // Clear Display Memory
  std::vector<uint8_t> clear_packet;
  clear_packet.push_back(0xC2);  // Write command for display RAM
  for (int i = 0; i < (16 * 3); i++) {  // Fill entire RAM with zeros
    clear_packet.push_back(0x00);
  }
  this->i2c_bus_->write(this->tm1680_address_, clear_packet.data(), clear_packet.size());
  ESP_LOGI("TM1680", "Display memory cleared.");

  // Re-enable system clock
  uint8_t sys_enable = 0x81;
  this->i2c_bus_->write(this->tm1680_address_, &sys_enable, 1);
  ESP_LOGI("TM1680", "System clock enabled.");

  // Re-enable LED display
  uint8_t led_enable = 0x83;
  this->i2c_bus_->write(this->tm1680_address_, &led_enable, 1);
  ESP_LOGI("TM1680", "LED display enabled.");

  // set the brightness
  uint8_t brightness = 0b10111000;  // Set 31% brightness (PWM 8/16)
  this->i2c_bus_->write(this->tm1680_address_, &brightness, 1);
  ESP_LOGI("TM1680", "Brightness set to 31% (0b10111000)");

  uint8_t set_mode = 0b10100100;  // Set 24×16 mode (Correct)
  this->i2c_bus_->write(this->tm1680_address_, &set_mode, 1);
  ESP_LOGI("TM1680", "Set TM1680 to 24×16 mode (0b10100100).");
}

void EleksWFD::initializeButtons() {
  // use a_key_pin_ to create a digitalRead
  esp_rom_gpio_pad_select_gpio(this->a_key_pin_);
  gpio_set_direction(this->a_key_pin_, GPIO_MODE_INPUT);

  // use b_key_pin_ to create a digitalRead
  esp_rom_gpio_pad_select_gpio(this->b_key_pin_);
  gpio_set_direction(this->b_key_pin_, GPIO_MODE_INPUT);

  // use c_key_pin_ to create a digitalRead
  esp_rom_gpio_pad_select_gpio(this->c_key_pin_);
  gpio_set_direction(this->c_key_pin_, GPIO_MODE_INPUT);
}

void EleksWFD::initializeMicrophone() {
  // initialize the microphone ADC sensor
  adc1_config_width(ADC_WIDTH_BIT_12);
  adc1_config_channel_atten(ADC1_CHANNEL_4, ADC_ATTEN_DB_12);
}

void EleksWFD::readMicrophone() {
  bool show_mic = true;

  if ( show_mic_ != nullptr ) {
    show_mic = show_mic_->state;
  }

  if ( !show_mic ) {
    return;
  }
  // ESP_LOGD(TAG, "Flashing display element %d (%d) and resetting %d (%d)", this->counter, this->display_elements[ this->counter ], lastIndex, this->display_elements[ lastIndex ] );

  // read the value of the microphone pin
  int raw_value = adc1_get_raw( ADC1_CHANNEL_4 );
  
  // convert the raw value to a range of 0-100 not using map
  int value = (raw_value * 100) / 4095;
  // int value = raw_value / 341;

  // set the sound level
  setBarChart( false, value );
  setBarChart( true, value );
}

void EleksWFD::updateExternals() {
  if (cpu_usage_ && cpu_usage_->has_state()) {
    setCpuUsage(static_cast<uint8_t>(cpu_usage_->state));
  }
  if (ram_usage_ && ram_usage_->has_state()) {
    setRamUsage(static_cast<uint8_t>(ram_usage_->state));
  }
  if (gpu_usage_ && gpu_usage_->has_state()) {
    setGpuUsage(static_cast<uint8_t>(gpu_usage_->state));
  }
  if (weather_sensor_ && weather_sensor_->has_state()) {
    setWeather( static_cast<int>(weather_sensor_->state) );
  }

  if ( show_mic_ == nullptr || !show_mic_->state ) {
    if ( bar_chart_1_ && bar_chart_1_->has_state() ) {
      setBarChart( false, static_cast<uint8_t>( bar_chart_1_->state ) );
    }
    if ( bar_chart_2_ && bar_chart_2_->has_state() ) {
      setBarChart( true, static_cast<uint8_t>( bar_chart_2_->state ) );
    }
  }

  showSpeaker( static_cast<bool>( speaker_sensor_->state ) );
  showMicrophone( static_cast<bool>( microphone_sensor_->state ) );
  showHeadsets( static_cast<bool>( headsets_sensor_->state ) );
  showRecord( static_cast<bool>( record_sensor_->state ) );
  
  showSettings( static_cast<bool>( settings_sensor_->state ) );
  showDesktopConnected( static_cast<bool>( desktop_connected_sensor_->state ) );
  showServerConnected( static_cast<bool>( server_connected_sensor_->state ) );
  
  showWatch( static_cast<bool>( watch_sensor_->state ) );
  showHourglass( static_cast<bool>( hourglass_sensor_->state ) );
  showBattery( static_cast<bool>( battery_sensor_->state ) );
  
  showCalendar( static_cast<bool>( calendar_sensor_->state ) );
  showHotspot( static_cast<bool>( hotspot_sensor_->state ) );

}

void EleksWFD::animate() {
  int64_t now = esp_timer_get_time();
  int64_t time_passed = now - last_time_;

  if ( time_passed < 250 ) {
    return;
  }
  last_time_ = now;

  // logo animation -- per-frame timing from encoded data
  if ( logo_frame_total > 0 ) {
    uint16_t logo_delay = logo_delays.size() > 0 ? logo_delays[ logo_frame_index ] : 250;
    int64_t logo_elapsed = ( now - logo_last_frame_time_ ) / 1000;
    if ( logo_elapsed >= logo_delay ) {
      logo_frame_index++;
      if ( logo_frame_index >= logo_frame_total ) {
        logo_frame_index = 0;
      }
      logo_last_frame_time_ = now;
    }
  }

  // gif animation -- per-frame timing from encoded data
  if ( gif_frame_total > 0 && !gif_done_ ) {
    int64_t gif_elapsed = ( now - gif_last_frame_time_ ) / 1000;
    uint16_t delay = gif_delays[ gif_frame_index ];
    if ( gif_elapsed >= delay ) {
      bool at_last_frame = ( gif_frame_index == gif_frame_total - 1 );
      bool should_clear = false;

      if ( at_last_frame ) {
        // end of a cycle — check both counters

        // per-animation count
        if ( gif_play_count_ > 0 && gif_plays_remaining_ > 0 ) {
          gif_plays_remaining_--;
          if ( gif_plays_remaining_ == 0 ) should_clear = true;
        }

        // global count — tracked locally so it works regardless of whether the
        // HA service-call sync succeeds. Snapshot the sensor on first cycle end
        // after a new animation loads; after that, the local counter is the
        // source of truth. HA is updated best-effort for visibility.
        if ( gif_global_remaining_ < 0 ) {
          int snapshot = 0;
          if ( gif_play_count_global_ != nullptr && gif_play_count_global_->has_state() ) {
            snapshot = static_cast<int>( gif_play_count_global_->state );
          }
          gif_global_remaining_ = snapshot > 0 ? snapshot : 0;
        }
        if ( gif_global_remaining_ > 0 ) {
          gif_global_remaining_--;
#if defined( USE_API ) && defined( USE_API_HOMEASSISTANT_SERVICES )
          if ( api::global_api_server != nullptr ) {
            static char global_value_buf[ 8 ];
            snprintf( global_value_buf, sizeof( global_value_buf ), "%d", gif_global_remaining_ );
            api::HomeassistantActionRequest dec_req;
            dec_req.service = StringRef( "input_number.set_value" );
            dec_req.data.init( 2 );
            auto &k1 = dec_req.data.emplace_back();
            k1.key = StringRef( "entity_id" );
            k1.value = StringRef( "input_number.eleksmaker_gif_play_count" );
            auto &k2 = dec_req.data.emplace_back();
            k2.key = StringRef( "value" );
            k2.value = StringRef( global_value_buf );
            api::global_api_server->send_homeassistant_action( dec_req );
          }
#endif
          ESP_LOGI( TAG, "Global play count: %d remaining", gif_global_remaining_ );
          if ( gif_global_remaining_ == 0 ) should_clear = true;
        }
      }

      if ( should_clear ) {
        gif_done_ = true;
#if defined( USE_API ) && defined( USE_API_HOMEASSISTANT_SERVICES )
        // clear the GIF entity so re-pushing the same value re-triggers
        if ( api::global_api_server != nullptr ) {
          api::HomeassistantActionRequest clear_req;
          clear_req.service = StringRef( "input_text.set_value" );
          clear_req.data.init( 2 );
          auto &k1 = clear_req.data.emplace_back();
          k1.key = StringRef( "entity_id" );
          k1.value = StringRef( "input_text.eleksmaker_gif" );
          auto &k2 = clear_req.data.emplace_back();
          k2.key = StringRef( "value" );
          k2.value = StringRef( "" );
          api::global_api_server->send_homeassistant_action( clear_req );
        }
#endif
      } else {
        gif_frame_index++;
        if ( gif_frame_index >= gif_frame_total ) {
          gif_frame_index = 0;
        }
      }
      gif_last_frame_time_ = now;
    }
  }

  this->renderGIF();
  this->renderLogo();
  this->renderUpperText();
  this->renderLowerText();
}

void EleksWFD::renderGIF() {
  // build the LED index map: rows 0-6 (7 LEDs each) then circle (12 LEDs)
  const int *ROWS[] = {
    esphome::elekswfd::display::matrix::ROW_0,
    esphome::elekswfd::display::matrix::ROW_1,
    esphome::elekswfd::display::matrix::ROW_2,
    esphome::elekswfd::display::matrix::ROW_3,
    esphome::elekswfd::display::matrix::ROW_4,
    esphome::elekswfd::display::matrix::ROW_5,
    esphome::elekswfd::display::matrix::ROW_6,
  };

  if ( gif_frame_total == 0 || gif_done_ ) {
    // no frames loaded or animation finished -- blank the matrix and circle
    for ( int row = 0; row < 7; row++ ) {
      for ( int col = 0; col < 7; col++ ) {
        display_elements[ ROWS[ row ][ col ] ] = false;
      }
    }
    for ( int i = 0; i < 12; i++ ) {
      display_elements[ esphome::elekswfd::display::matrix::CIRCLE[ i ] ] = false;
    }
    return;
  }

  uint64_t frame = gif_frames[ gif_frame_index ];

  // bits 0-48: 7 rows of 7 bits each
  for ( int row = 0; row < 7; row++ ) {
    uint8_t row_bits = ( frame >> ( row * 7 ) ) & 0x7F;
    for ( int col = 0; col < 7; col++ ) {
      display_elements[ ROWS[ row ][ col ] ] = ( row_bits >> col ) & 1;
    }
  }

  // bits 49-60: 12 circle LEDs
  uint16_t circle_bits = ( frame >> 49 ) & 0x0FFF;
  for ( int i = 0; i < 12; i++ ) {
    display_elements[ esphome::elekswfd::display::matrix::CIRCLE[ i ] ] = ( circle_bits >> i ) & 1;
  }
}

void EleksWFD::renderLogo() {
  bool showLogo = true;
  if ( show_logo_ != nullptr ) {
    showLogo = show_logo_->state;
  }

  if ( logo_frames.size() == 0 ) {
    showLogo = false;
  }

  // use the const array from esphome::elekswfd::display::logo::UPPER and LOWER to populate indexs
  int indexs[26] = {};

  for (int i = 0; i < 26; i++) {
    if ( i < 13 ) {
      indexs[i] = esphome::elekswfd::display::logo::LOWER[i];
    } else {
      int j = i - 13;
      indexs[i] = esphome::elekswfd::display::logo::UPPER[j];
    }
  }

  for (int i = 0; i < 26; i++) {
    if ( showLogo ) {
      // get bit from logo_frames[logo_frame_index]
      // const bool bit = (i % 2) == (logo_frame_index % 2);
      const bool bit = (logo_frames[logo_frame_index] >> i) & 1;
      display_elements[ indexs[i] ] = bit;
    } else {
      display_elements[ indexs[i] ] = false;
    }
  }
}

void EleksWFD::buildFlickerList() {
  using namespace esphome::elekswfd::display;
  flicker_leds_.clear();

  // logo (26 LEDs)
  for ( int i = 0; i < 13; i++ ) {
    flicker_leds_.push_back( logo::UPPER[ i ] );
    flicker_leds_.push_back( logo::LOWER[ i ] );
  }

  // day of week (15 LEDs)
  for ( int i = 0; i < 2; i++ ) {
    flicker_leds_.push_back( day_of_week::MONDAY[ i ] );
    flicker_leds_.push_back( day_of_week::TUESDAY[ i ] );
    flicker_leds_.push_back( day_of_week::WEDNESDAY[ i ] );
    flicker_leds_.push_back( day_of_week::THURSDAY[ i ] );
    flicker_leds_.push_back( day_of_week::FRIDAY[ i ] );
    flicker_leds_.push_back( day_of_week::SATURDAY[ i ] );
  }
  for ( int i = 0; i < 3; i++ ) {
    flicker_leds_.push_back( day_of_week::SUNDAY[ i ] );
  }

  // horizontal bar groups: logo + bar + percentage = 22 LEDs each, 3 groups (66)
  flicker_leds_.push_back( horizontal_bars::CPU_LOGO[ 0 ] );
  for ( int i = 0; i < 20; i++ ) flicker_leds_.push_back( horizontal_bars::CPU_BAR[ i ] );
  flicker_leds_.push_back( horizontal_bars::CPU_PERCENTAGE[ 0 ] );

  flicker_leds_.push_back( horizontal_bars::GPU_LOGO[ 0 ] );
  for ( int i = 0; i < 20; i++ ) flicker_leds_.push_back( horizontal_bars::GPU_BAR[ i ] );
  flicker_leds_.push_back( horizontal_bars::GPU_PERCENTAGE[ 0 ] );

  flicker_leds_.push_back( horizontal_bars::RAM_LOGO[ 0 ] );
  for ( int i = 0; i < 20; i++ ) flicker_leds_.push_back( horizontal_bars::RAM_BAR[ i ] );
  flicker_leds_.push_back( horizontal_bars::RAM_PERCENTAGE[ 0 ] );

  // vertical bars (24 LEDs)
  for ( int i = 0; i < 12; i++ ) {
    flicker_leds_.push_back( vertical_bars::BAR_1[ i ] );
    flicker_leds_.push_back( vertical_bars::BAR_2[ i ] );
  }

  // upper 14-segment digits (6 * 13 = 78 LEDs)
  const int upper_segs[ 6 ][ 13 ] = {
    { UPPER_DIGIT_1::SEG_A, UPPER_DIGIT_1::SEG_B, UPPER_DIGIT_1::SEG_C, UPPER_DIGIT_1::SEG_D, UPPER_DIGIT_1::SEG_E, UPPER_DIGIT_1::SEG_F, UPPER_DIGIT_1::SEG_G, UPPER_DIGIT_1::SEG_H, UPPER_DIGIT_1::SEG_I, UPPER_DIGIT_1::SEG_J, UPPER_DIGIT_1::SEG_K, UPPER_DIGIT_1::SEG_L, UPPER_DIGIT_1::SEG_M },
    { UPPER_DIGIT_2::SEG_A, UPPER_DIGIT_2::SEG_B, UPPER_DIGIT_2::SEG_C, UPPER_DIGIT_2::SEG_D, UPPER_DIGIT_2::SEG_E, UPPER_DIGIT_2::SEG_F, UPPER_DIGIT_2::SEG_G, UPPER_DIGIT_2::SEG_H, UPPER_DIGIT_2::SEG_I, UPPER_DIGIT_2::SEG_J, UPPER_DIGIT_2::SEG_K, UPPER_DIGIT_2::SEG_L, UPPER_DIGIT_2::SEG_M },
    { UPPER_DIGIT_3::SEG_A, UPPER_DIGIT_3::SEG_B, UPPER_DIGIT_3::SEG_C, UPPER_DIGIT_3::SEG_D, UPPER_DIGIT_3::SEG_E, UPPER_DIGIT_3::SEG_F, UPPER_DIGIT_3::SEG_G, UPPER_DIGIT_3::SEG_H, UPPER_DIGIT_3::SEG_I, UPPER_DIGIT_3::SEG_J, UPPER_DIGIT_3::SEG_K, UPPER_DIGIT_3::SEG_L, UPPER_DIGIT_3::SEG_M },
    { UPPER_DIGIT_4::SEG_A, UPPER_DIGIT_4::SEG_B, UPPER_DIGIT_4::SEG_C, UPPER_DIGIT_4::SEG_D, UPPER_DIGIT_4::SEG_E, UPPER_DIGIT_4::SEG_F, UPPER_DIGIT_4::SEG_G, UPPER_DIGIT_4::SEG_H, UPPER_DIGIT_4::SEG_I, UPPER_DIGIT_4::SEG_J, UPPER_DIGIT_4::SEG_K, UPPER_DIGIT_4::SEG_L, UPPER_DIGIT_4::SEG_M },
    { UPPER_DIGIT_5::SEG_A, UPPER_DIGIT_5::SEG_B, UPPER_DIGIT_5::SEG_C, UPPER_DIGIT_5::SEG_D, UPPER_DIGIT_5::SEG_E, UPPER_DIGIT_5::SEG_F, UPPER_DIGIT_5::SEG_G, UPPER_DIGIT_5::SEG_H, UPPER_DIGIT_5::SEG_I, UPPER_DIGIT_5::SEG_J, UPPER_DIGIT_5::SEG_K, UPPER_DIGIT_5::SEG_L, UPPER_DIGIT_5::SEG_M },
    { UPPER_DIGIT_6::SEG_A, UPPER_DIGIT_6::SEG_B, UPPER_DIGIT_6::SEG_C, UPPER_DIGIT_6::SEG_D, UPPER_DIGIT_6::SEG_E, UPPER_DIGIT_6::SEG_F, UPPER_DIGIT_6::SEG_G, UPPER_DIGIT_6::SEG_H, UPPER_DIGIT_6::SEG_I, UPPER_DIGIT_6::SEG_J, UPPER_DIGIT_6::SEG_K, UPPER_DIGIT_6::SEG_L, UPPER_DIGIT_6::SEG_M },
  };
  for ( int d = 0; d < 6; d++ ) {
    for ( int s = 0; s < 13; s++ ) flicker_leds_.push_back( upper_segs[ d ][ s ] );
  }

  // lower 7-segment digits (6 * 7 = 42 LEDs)
  const int lower_segs[ 6 ][ 7 ] = {
    { LOWER_DIGIT_1::SEG_A, LOWER_DIGIT_1::SEG_B, LOWER_DIGIT_1::SEG_C, LOWER_DIGIT_1::SEG_D, LOWER_DIGIT_1::SEG_E, LOWER_DIGIT_1::SEG_F, LOWER_DIGIT_1::SEG_G },
    { LOWER_DIGIT_2::SEG_A, LOWER_DIGIT_2::SEG_B, LOWER_DIGIT_2::SEG_C, LOWER_DIGIT_2::SEG_D, LOWER_DIGIT_2::SEG_E, LOWER_DIGIT_2::SEG_F, LOWER_DIGIT_2::SEG_G },
    { LOWER_DIGIT_3::SEG_A, LOWER_DIGIT_3::SEG_B, LOWER_DIGIT_3::SEG_C, LOWER_DIGIT_3::SEG_D, LOWER_DIGIT_3::SEG_E, LOWER_DIGIT_3::SEG_F, LOWER_DIGIT_3::SEG_G },
    { LOWER_DIGIT_4::SEG_A, LOWER_DIGIT_4::SEG_B, LOWER_DIGIT_4::SEG_C, LOWER_DIGIT_4::SEG_D, LOWER_DIGIT_4::SEG_E, LOWER_DIGIT_4::SEG_F, LOWER_DIGIT_4::SEG_G },
    { LOWER_DIGIT_5::SEG_A, LOWER_DIGIT_5::SEG_B, LOWER_DIGIT_5::SEG_C, LOWER_DIGIT_5::SEG_D, LOWER_DIGIT_5::SEG_E, LOWER_DIGIT_5::SEG_F, LOWER_DIGIT_5::SEG_G },
    { LOWER_DIGIT_6::SEG_A, LOWER_DIGIT_6::SEG_B, LOWER_DIGIT_6::SEG_C, LOWER_DIGIT_6::SEG_D, LOWER_DIGIT_6::SEG_E, LOWER_DIGIT_6::SEG_F, LOWER_DIGIT_6::SEG_G },
  };
  for ( int d = 0; d < 6; d++ ) {
    for ( int s = 0; s < 7; s++ ) flicker_leds_.push_back( lower_segs[ d ][ s ] );
  }

  // digit separator colons
  flicker_leds_.push_back( LOWER_DIGIT_SEPARATOR_1 );
  flicker_leds_.push_back( LOWER_DIGIT_SEPARATOR_2 );

  ESP_LOGI( TAG, "Flicker pool: %d LEDs", (int) flicker_leds_.size() );
}


void EleksWFD::applyFlicker() {
  if ( flicker_leds_.empty() ) return;

  int64_t now = esp_timer_get_time();
  const int64_t FLICKER_DURATION_US = 40000; // 40ms off time

  // restore LEDs that have been flickered long enough
  for ( auto it = active_flickers_.begin(); it != active_flickers_.end(); ) {
    if ( now - it->time_us >= FLICKER_DURATION_US ) {
      display_elements[ it->led ] = true;
      it = active_flickers_.erase( it );
    } else {
      ++it;
    }
  }

  // flicker rate in flickers-per-second from HA input_number (default 0)
  if ( logo_flicker_ == nullptr || !logo_flicker_->has_state() ) return;
  float rate = logo_flicker_->state;
  if ( rate <= 0.0f ) return;

  // probability per 10ms tick = rate / 100 (since we tick 100x/sec)
  // threshold out of 256 = ( rate * 256 ) / 100
  int threshold = static_cast<int>( ( rate * 256.0f ) / 100.0f );
  if ( threshold > 256 ) threshold = 256;

  uint32_t rand = esp_random();
  if ( static_cast<int>( rand & 0xFF ) < threshold ) {
    int led = flicker_leds_[ ( rand >> 8 ) % flicker_leds_.size() ];
    if ( display_elements[ led ] ) {
      display_elements[ led ] = false;
      active_flickers_.push_back( { led, now } );
    }
  }
}


void EleksWFD::renderUpperText() {
  if ( ota_active_ ) return;

  // treat empty or all-whitespace as "no user text" -> show date
  bool blank = upper_text_length_ == 0;
  if ( !blank ) {
    blank = true;
    for ( int i = 0; i < upper_text_length_; i++ ) {
      if ( upper_text[ i ] != ' ' ) { blank = false; break; }
    }
  }

  // no user text -> show date as "MMM DD" (APR 16, MAR  1)
  if ( blank ) {
    static const char *MONTHS[] = {
      "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
    };
    if ( time_ != nullptr ) {
      auto t = time_->now();
      if ( t.is_valid() && t.month >= 1 && t.month <= 12 ) {
        const char *m = MONTHS[ t.month - 1 ];
        writeUpperDigit( 1, m[ 0 ] );
        writeUpperDigit( 2, m[ 1 ] );
        writeUpperDigit( 3, m[ 2 ] );
        writeUpperDigit( 4, ' ' );
        writeUpperDigit( 5, t.day_of_month >= 10 ? static_cast<char>( ( t.day_of_month / 10 ) + '0' ) : ' ' );
        writeUpperDigit( 6, static_cast<char>( ( t.day_of_month % 10 ) + '0' ) );
        return;
      }
    }
    // no valid time - blank the digits
    for ( int i = 1; i <= 6; i++ ) writeUpperDigit( i, ' ' );
    return;
  }

  int64_t now = esp_timer_get_time();

  // scrolling for text longer than 6 chars
  if ( upper_text_length_ > 6 ) {
    int64_t elapsed = ( now - upper_text_last_scroll_time_ ) / 1000;
    if ( elapsed >= 300 ) {
      upper_text_scroll_offset_++;
      // wrap with a 3-space gap
      if ( upper_text_scroll_offset_ >= upper_text_length_ + 3 ) {
        upper_text_scroll_offset_ = 0;
      }
      upper_text_last_scroll_time_ = now;
    }
  }

  for ( int i = 0; i < 6; i++ ) {
    int idx = upper_text_scroll_offset_ + i;
    char c;
    if ( upper_text_length_ <= 6 ) {
      // static: left-aligned, blank remaining
      c = i < upper_text_length_ ? upper_text[ i ] : ' ';
    } else {
      // scrolling: wrap index with gap
      int total = upper_text_length_ + 3;
      idx = idx % total;
      c = idx < upper_text_length_ ? upper_text[ idx ] : ' ';
    }
    writeUpperDigit( i + 1, c );
  }
}


void EleksWFD::renderLowerText() {
  if ( !lower_text_active_ ) return;

  int64_t now = esp_timer_get_time();

  // scrolling for text longer than 6 chars
  if ( lower_text_length_ > 6 ) {
    int64_t elapsed = ( now - lower_text_last_scroll_time_ ) / 1000;
    if ( elapsed >= 300 ) {
      lower_text_scroll_offset_++;
      if ( lower_text_scroll_offset_ >= lower_text_length_ + 3 ) {
        lower_text_scroll_offset_ = 0;
      }
      lower_text_last_scroll_time_ = now;
    }
  }

  for ( int i = 0; i < 6; i++ ) {
    char c;
    if ( lower_text_length_ <= 6 ) {
      c = i < lower_text_length_ ? lower_text[ i ] : ' ';
    } else {
      int total = lower_text_length_ + 3;
      int idx = ( lower_text_scroll_offset_ + i ) % total;
      c = idx < lower_text_length_ ? lower_text[ idx ] : ' ';
    }
    writeLowerDigit( i + 1, c );
  }
}


void EleksWFD::setOtaProgress( int pct ) {
  if ( pct < 0 ) {
    // OTA ended or errored -- resume normal text
    ota_active_ = false;
    return;
  }

  ota_active_ = true;

  if ( pct > 100 ) pct = 100;

  // "UPd" on digits 1-3
  writeUpperDigit( 1, 'U' );
  writeUpperDigit( 2, 'P' );
  writeUpperDigit( 3, 'd' );

  // percentage right-aligned on digits 4-6
  if ( pct >= 100 ) {
    writeUpperDigit( 4, '1' );
    writeUpperDigit( 5, '0' );
    writeUpperDigit( 6, '0' );
  } else {
    writeUpperDigit( 4, ' ' );
    writeUpperDigit( 5, pct >= 10 ? static_cast<char>( ( pct / 10 ) + '0' ) : ' ' );
    writeUpperDigit( 6, static_cast<char>( ( pct % 10 ) + '0' ) );
  }
}


void EleksWFD::updateTime( int hour, int minute, int second ) {
  if ( lower_text_active_ ) {
    display_elements[ esphome::elekswfd::display::LOWER_DIGIT_SEPARATOR_1 ] = false;
    display_elements[ esphome::elekswfd::display::LOWER_DIGIT_SEPARATOR_2 ] = false;
    return;
  }

  bool showClock = true;
  if ( show_time_ != nullptr ) {
    showClock = show_time_->state;
  }

  if ( showClock ) {
    // write the time to the display
    writeLowerDigit( 1, static_cast<char>( hour   / 10 + '0' ) );
    writeLowerDigit( 2, static_cast<char>( hour   % 10 + '0' ) );
    writeLowerDigit( 3, static_cast<char>( minute / 10 + '0' ) );
    writeLowerDigit( 4, static_cast<char>( minute % 10 + '0' ) );
    writeLowerDigit( 5, static_cast<char>( second / 10 + '0' ) );
    writeLowerDigit( 6, static_cast<char>( second % 10 + '0' ) );
  } else {
    // write the time to the display
    writeLowerDigit( 1, ' ' );
    writeLowerDigit( 2, ' ' );
    writeLowerDigit( 3, ' ' );
    writeLowerDigit( 4, ' ' );
    writeLowerDigit( 5, ' ' );
    writeLowerDigit( 6, ' ' );
  }

  display_elements[ esphome::elekswfd::display::LOWER_DIGIT_SEPARATOR_1 ] = showClock;
  display_elements[ esphome::elekswfd::display::LOWER_DIGIT_SEPARATOR_2 ] = showClock;
}

void EleksWFD::writeLowerDigit( uint8_t digit, char value ) {
  int seg_a = -1;
  int seg_b = -1;
  int seg_c = -1;
  int seg_d = -1;
  int seg_e = -1;
  int seg_f = -1;
  int seg_g = -1;

  switch ( digit ) {
    case 1:
      seg_a = esphome::elekswfd::display::LOWER_DIGIT_1::SEG_A;
      seg_b = esphome::elekswfd::display::LOWER_DIGIT_1::SEG_B;
      seg_c = esphome::elekswfd::display::LOWER_DIGIT_1::SEG_C;
      seg_d = esphome::elekswfd::display::LOWER_DIGIT_1::SEG_D;
      seg_e = esphome::elekswfd::display::LOWER_DIGIT_1::SEG_E;
      seg_f = esphome::elekswfd::display::LOWER_DIGIT_1::SEG_F;
      seg_g = esphome::elekswfd::display::LOWER_DIGIT_1::SEG_G;
      break;
    case 2:
      seg_a = esphome::elekswfd::display::LOWER_DIGIT_2::SEG_A;
      seg_b = esphome::elekswfd::display::LOWER_DIGIT_2::SEG_B;
      seg_c = esphome::elekswfd::display::LOWER_DIGIT_2::SEG_C;
      seg_d = esphome::elekswfd::display::LOWER_DIGIT_2::SEG_D;
      seg_e = esphome::elekswfd::display::LOWER_DIGIT_2::SEG_E;
      seg_f = esphome::elekswfd::display::LOWER_DIGIT_2::SEG_F;
      seg_g = esphome::elekswfd::display::LOWER_DIGIT_2::SEG_G;
      break;
    case 3:
      seg_a = esphome::elekswfd::display::LOWER_DIGIT_3::SEG_A;
      seg_b = esphome::elekswfd::display::LOWER_DIGIT_3::SEG_B;
      seg_c = esphome::elekswfd::display::LOWER_DIGIT_3::SEG_C;
      seg_d = esphome::elekswfd::display::LOWER_DIGIT_3::SEG_D;
      seg_e = esphome::elekswfd::display::LOWER_DIGIT_3::SEG_E;
      seg_f = esphome::elekswfd::display::LOWER_DIGIT_3::SEG_F;
      seg_g = esphome::elekswfd::display::LOWER_DIGIT_3::SEG_G;
      break;
    case 4:
      seg_a = esphome::elekswfd::display::LOWER_DIGIT_4::SEG_A;
      seg_b = esphome::elekswfd::display::LOWER_DIGIT_4::SEG_B;
      seg_c = esphome::elekswfd::display::LOWER_DIGIT_4::SEG_C;
      seg_d = esphome::elekswfd::display::LOWER_DIGIT_4::SEG_D;
      seg_e = esphome::elekswfd::display::LOWER_DIGIT_4::SEG_E;
      seg_f = esphome::elekswfd::display::LOWER_DIGIT_4::SEG_F;
      seg_g = esphome::elekswfd::display::LOWER_DIGIT_4::SEG_G;
      break;
    case 5:
      seg_a = esphome::elekswfd::display::LOWER_DIGIT_5::SEG_A;
      seg_b = esphome::elekswfd::display::LOWER_DIGIT_5::SEG_B;
      seg_c = esphome::elekswfd::display::LOWER_DIGIT_5::SEG_C;
      seg_d = esphome::elekswfd::display::LOWER_DIGIT_5::SEG_D;
      seg_e = esphome::elekswfd::display::LOWER_DIGIT_5::SEG_E;
      seg_f = esphome::elekswfd::display::LOWER_DIGIT_5::SEG_F;
      seg_g = esphome::elekswfd::display::LOWER_DIGIT_5::SEG_G;
      break;
    case 6:
      seg_a = esphome::elekswfd::display::LOWER_DIGIT_6::SEG_A;
      seg_b = esphome::elekswfd::display::LOWER_DIGIT_6::SEG_B;
      seg_c = esphome::elekswfd::display::LOWER_DIGIT_6::SEG_C;
      seg_d = esphome::elekswfd::display::LOWER_DIGIT_6::SEG_D;
      seg_e = esphome::elekswfd::display::LOWER_DIGIT_6::SEG_E;
      seg_f = esphome::elekswfd::display::LOWER_DIGIT_6::SEG_F;
      seg_g = esphome::elekswfd::display::LOWER_DIGIT_6::SEG_G;
      break;
    default:
      ESP_LOGW(TAG, "Invalid digit %d", digit);
      return;
  }

  if ( seg_a == -1 || seg_b == -1 || seg_c == -1 || seg_d == -1 || seg_e == -1 || seg_f == -1 || seg_g == -1 ) {
    ESP_LOGW(TAG, "Invalid segment for digit %d", digit);
    return;
  }

  // convert the char to a uint8_t and subtract 32 to get the correct index
  uint8_t index = (uint8_t)value - 32;
  if ( index < 0 || index > 95 ) {
    ESP_LOGW(TAG, "Invalid value %c", value);
    return;
  }

  // get the 7 segment value
  uint8_t seven_seg = SevenSegmentASCII[index];

  // map the bits in seven_seg to the correct segments
  display_elements[seg_a] = (seven_seg & 0b00000001) > 0;
  display_elements[seg_b] = (seven_seg & 0b00000010) > 0;
  display_elements[seg_c] = (seven_seg & 0b00000100) > 0;
  display_elements[seg_d] = (seven_seg & 0b00001000) > 0;
  display_elements[seg_e] = (seven_seg & 0b00010000) > 0;
  display_elements[seg_f] = (seven_seg & 0b00100000) > 0;
  display_elements[seg_g] = (seven_seg & 0b01000000) > 0;
}

void EleksWFD::writeUpperDigit( uint8_t digit, char value ) {
  int seg_a = -1;
  int seg_b = -1;
  int seg_c = -1;
  int seg_d = -1;
  int seg_e = -1;
  int seg_f = -1;
  int seg_g = -1;
  int seg_h = -1;
  int seg_i = -1;
  int seg_j = -1;
  int seg_k = -1;
  int seg_l = -1;
  int seg_m = -1;

  switch ( digit ) {
    case 1:
      seg_a = esphome::elekswfd::display::UPPER_DIGIT_1::SEG_A;
      seg_b = esphome::elekswfd::display::UPPER_DIGIT_1::SEG_B;
      seg_c = esphome::elekswfd::display::UPPER_DIGIT_1::SEG_C;
      seg_d = esphome::elekswfd::display::UPPER_DIGIT_1::SEG_D;
      seg_e = esphome::elekswfd::display::UPPER_DIGIT_1::SEG_E;
      seg_f = esphome::elekswfd::display::UPPER_DIGIT_1::SEG_F;
      seg_g = esphome::elekswfd::display::UPPER_DIGIT_1::SEG_G;
      seg_h = esphome::elekswfd::display::UPPER_DIGIT_1::SEG_H;
      seg_i = esphome::elekswfd::display::UPPER_DIGIT_1::SEG_I;
      seg_j = esphome::elekswfd::display::UPPER_DIGIT_1::SEG_J;
      seg_k = esphome::elekswfd::display::UPPER_DIGIT_1::SEG_K;
      seg_l = esphome::elekswfd::display::UPPER_DIGIT_1::SEG_L;
      seg_m = esphome::elekswfd::display::UPPER_DIGIT_1::SEG_M;
      break;
    case 2:
      seg_a = esphome::elekswfd::display::UPPER_DIGIT_2::SEG_A;
      seg_b = esphome::elekswfd::display::UPPER_DIGIT_2::SEG_B;
      seg_c = esphome::elekswfd::display::UPPER_DIGIT_2::SEG_C;
      seg_d = esphome::elekswfd::display::UPPER_DIGIT_2::SEG_D;
      seg_e = esphome::elekswfd::display::UPPER_DIGIT_2::SEG_E;
      seg_f = esphome::elekswfd::display::UPPER_DIGIT_2::SEG_F;
      seg_g = esphome::elekswfd::display::UPPER_DIGIT_2::SEG_G;
      seg_h = esphome::elekswfd::display::UPPER_DIGIT_2::SEG_H;
      seg_i = esphome::elekswfd::display::UPPER_DIGIT_2::SEG_I;
      seg_j = esphome::elekswfd::display::UPPER_DIGIT_2::SEG_J;
      seg_k = esphome::elekswfd::display::UPPER_DIGIT_2::SEG_K;
      seg_l = esphome::elekswfd::display::UPPER_DIGIT_2::SEG_L;
      seg_m = esphome::elekswfd::display::UPPER_DIGIT_2::SEG_M;
      break;
    case 3:
      seg_a = esphome::elekswfd::display::UPPER_DIGIT_3::SEG_A;
      seg_b = esphome::elekswfd::display::UPPER_DIGIT_3::SEG_B;
      seg_c = esphome::elekswfd::display::UPPER_DIGIT_3::SEG_C;
      seg_d = esphome::elekswfd::display::UPPER_DIGIT_3::SEG_D;
      seg_e = esphome::elekswfd::display::UPPER_DIGIT_3::SEG_E;
      seg_f = esphome::elekswfd::display::UPPER_DIGIT_3::SEG_F;
      seg_g = esphome::elekswfd::display::UPPER_DIGIT_3::SEG_G;
      seg_h = esphome::elekswfd::display::UPPER_DIGIT_3::SEG_H;
      seg_i = esphome::elekswfd::display::UPPER_DIGIT_3::SEG_I;
      seg_j = esphome::elekswfd::display::UPPER_DIGIT_3::SEG_J;
      seg_k = esphome::elekswfd::display::UPPER_DIGIT_3::SEG_K;
      seg_l = esphome::elekswfd::display::UPPER_DIGIT_3::SEG_L;
      seg_m = esphome::elekswfd::display::UPPER_DIGIT_3::SEG_M;
      break;
    case 4:
      seg_a = esphome::elekswfd::display::UPPER_DIGIT_4::SEG_A;
      seg_b = esphome::elekswfd::display::UPPER_DIGIT_4::SEG_B;
      seg_c = esphome::elekswfd::display::UPPER_DIGIT_4::SEG_C;
      seg_d = esphome::elekswfd::display::UPPER_DIGIT_4::SEG_D;
      seg_e = esphome::elekswfd::display::UPPER_DIGIT_4::SEG_E;
      seg_f = esphome::elekswfd::display::UPPER_DIGIT_4::SEG_F;
      seg_g = esphome::elekswfd::display::UPPER_DIGIT_4::SEG_G;
      seg_h = esphome::elekswfd::display::UPPER_DIGIT_4::SEG_H;
      seg_i = esphome::elekswfd::display::UPPER_DIGIT_4::SEG_I;
      seg_j = esphome::elekswfd::display::UPPER_DIGIT_4::SEG_J;
      seg_k = esphome::elekswfd::display::UPPER_DIGIT_4::SEG_K;
      seg_l = esphome::elekswfd::display::UPPER_DIGIT_4::SEG_L;
      seg_m = esphome::elekswfd::display::UPPER_DIGIT_4::SEG_M;
      break;
    case 5:
      seg_a = esphome::elekswfd::display::UPPER_DIGIT_5::SEG_A;
      seg_b = esphome::elekswfd::display::UPPER_DIGIT_5::SEG_B;
      seg_c = esphome::elekswfd::display::UPPER_DIGIT_5::SEG_C;
      seg_d = esphome::elekswfd::display::UPPER_DIGIT_5::SEG_D;
      seg_e = esphome::elekswfd::display::UPPER_DIGIT_5::SEG_E;
      seg_f = esphome::elekswfd::display::UPPER_DIGIT_5::SEG_F;
      seg_g = esphome::elekswfd::display::UPPER_DIGIT_5::SEG_G;
      seg_h = esphome::elekswfd::display::UPPER_DIGIT_5::SEG_H;
      seg_i = esphome::elekswfd::display::UPPER_DIGIT_5::SEG_I;
      seg_j = esphome::elekswfd::display::UPPER_DIGIT_5::SEG_J;
      seg_k = esphome::elekswfd::display::UPPER_DIGIT_5::SEG_K;
      seg_l = esphome::elekswfd::display::UPPER_DIGIT_5::SEG_L;
      seg_m = esphome::elekswfd::display::UPPER_DIGIT_5::SEG_M;
      break;
    case 6:
      seg_a = esphome::elekswfd::display::UPPER_DIGIT_6::SEG_A;
      seg_b = esphome::elekswfd::display::UPPER_DIGIT_6::SEG_B;
      seg_c = esphome::elekswfd::display::UPPER_DIGIT_6::SEG_C;
      seg_d = esphome::elekswfd::display::UPPER_DIGIT_6::SEG_D;
      seg_e = esphome::elekswfd::display::UPPER_DIGIT_6::SEG_E;
      seg_f = esphome::elekswfd::display::UPPER_DIGIT_6::SEG_F;
      seg_g = esphome::elekswfd::display::UPPER_DIGIT_6::SEG_G;
      seg_h = esphome::elekswfd::display::UPPER_DIGIT_6::SEG_H;
      seg_i = esphome::elekswfd::display::UPPER_DIGIT_6::SEG_I;
      seg_j = esphome::elekswfd::display::UPPER_DIGIT_6::SEG_J;
      seg_k = esphome::elekswfd::display::UPPER_DIGIT_6::SEG_K;
      seg_l = esphome::elekswfd::display::UPPER_DIGIT_6::SEG_L;
      seg_m = esphome::elekswfd::display::UPPER_DIGIT_6::SEG_M;
      break;
    default:
      ESP_LOGW(TAG, "Invalid digit %d", digit);
      return;
  }

  if ( seg_a == -1 || seg_b == -1 || seg_c == -1 || seg_d == -1 || seg_e == -1 || seg_f == -1 || seg_g == -1 ||
       seg_h == -1 || seg_i == -1 || seg_j == -1 || seg_k == -1 || seg_l == -1 || seg_m == -1 ) {
    ESP_LOGW(TAG, "Invalid segment for digit %d", digit);
    return;
  }

  // convert the char to a uint8_t and subtract 32 to get the correct index
  uint8_t index = (uint8_t)value - 32;
  if ( index < 0 || index > 95 ) {
    ESP_LOGW(TAG, "Invalid value %c", value);
    return;
  }

  // get the 14 segment value
  uint16_t fourteen_seg = FourteenSegmentASCII[index];

  // map the bits in fourteen_seg to the correct segments
  display_elements[seg_a] = (fourteen_seg & 0b000000000000001) > 0;
  display_elements[seg_b] = (fourteen_seg & 0b000000000000010) > 0;
  display_elements[seg_c] = (fourteen_seg & 0b000000000000100) > 0;
  display_elements[seg_d] = (fourteen_seg & 0b000000000001000) > 0;
  display_elements[seg_e] = (fourteen_seg & 0b000000000010000) > 0;
  display_elements[seg_f] = (fourteen_seg & 0b000000000100000) > 0;
  display_elements[seg_g] = (fourteen_seg & 0b000000011000000) > 0; // combine G1 and G2 into G
  display_elements[seg_h] = (fourteen_seg & 0b000000100000000) > 0;
  display_elements[seg_i] = (fourteen_seg & 0b000001000000000) > 0;
  display_elements[seg_j] = (fourteen_seg & 0b000010000000000) > 0;
  display_elements[seg_k] = (fourteen_seg & 0b000100000000000) > 0;
  display_elements[seg_l] = (fourteen_seg & 0b001000000000000) > 0;
  display_elements[seg_m] = (fourteen_seg & 0b010000000000000) > 0;
  // decimal point is not available in the EleksWFD displays
}

void EleksWFD::setDayOfWeek( uint8_t value ) {
  for( int i = 0; i < 3; i++ ) {
    if ( i < 2 ) {
      display_elements[ esphome::elekswfd::display::day_of_week::MONDAY[i]    ] = value == 1;
      display_elements[ esphome::elekswfd::display::day_of_week::TUESDAY[i]   ] = value == 2;
      display_elements[ esphome::elekswfd::display::day_of_week::WEDNESDAY[i] ] = value == 3;
      display_elements[ esphome::elekswfd::display::day_of_week::THURSDAY[i]  ] = value == 4;
      display_elements[ esphome::elekswfd::display::day_of_week::FRIDAY[i]    ] = value == 5;
      display_elements[ esphome::elekswfd::display::day_of_week::SATURDAY[i]  ] = value == 6;
    }
    display_elements[ esphome::elekswfd::display::day_of_week::SUNDAY[i] ] = value == 7 || value == 0;
  }
}

void EleksWFD::setCpuUsage( uint8_t value ) {
  uint8_t val = 0;
  if ( value > 0 ) {
    val = round( value / 5 );
  }
  display_elements[ esphome::elekswfd::display::horizontal_bars::CPU_LOGO[0] ] = true;
  display_elements[ esphome::elekswfd::display::horizontal_bars::CPU_PERCENTAGE[0] ] = true;
  for ( int i = 0; i < 20; i++ ) {
    display_elements[ esphome::elekswfd::display::horizontal_bars::CPU_BAR[i] ] = i < val;
  }
}

void EleksWFD::setGpuUsage( uint8_t value ) {
  uint8_t val = 0;
  if ( value > 0 ) {
    val = round( value / 5 );
  }
  display_elements[ esphome::elekswfd::display::horizontal_bars::GPU_LOGO[0] ] = true;
  display_elements[ esphome::elekswfd::display::horizontal_bars::GPU_PERCENTAGE[0] ] = true;
  for ( int i = 0; i < 20; i++ ) {
    display_elements[ esphome::elekswfd::display::horizontal_bars::GPU_BAR[i] ] = i < val;
  }
}

void EleksWFD::setRamUsage( uint8_t value ) {
  uint8_t val = 0;
  if ( value > 0 ) {
    val = round( value / 5 );
  }
  display_elements[ esphome::elekswfd::display::horizontal_bars::RAM_LOGO[0] ] = true;
  display_elements[ esphome::elekswfd::display::horizontal_bars::RAM_PERCENTAGE[0] ] = true;
  for ( int i = 0; i < 20; i++ ) {
    display_elements[ esphome::elekswfd::display::horizontal_bars::RAM_BAR[i] ] = i < val;
  }
}

void EleksWFD::setBarChart( bool bar, uint8_t _value ) {
  // 12 LEDs representing 35°C to 90°C in 5°C steps
  // LED 0 = 35°C, LED 1 = 40°C, ... LED 11 = 90°C
  // LED 0 lights if temp > 35, all off below 35, capped at 100
  if ( _value > 100 ) _value = 100;

  int value = 0;
  if ( _value > 35 ) {
    value = ( _value - 35 ) / 5 + 1;
    if ( value > 12 ) value = 12;
  }

  for ( int i = 0; i < 12; i++ ) {
    if ( !bar ) {
      display_elements[ esphome::elekswfd::display::vertical_bars::BAR_1[i] ] = i < value;
    } else {
      display_elements[ esphome::elekswfd::display::vertical_bars::BAR_2[i] ] = i < value;
    }
  }
}

void EleksWFD::setWeather( int mode ) {
  bool sunny = mode == 1;
  bool cloud = mode == 2;
  bool rains = mode == 3;

  for ( int i = 0; i < 2; i++ ) {
    display_elements[ esphome::elekswfd::display::weather::SUNNY[i] ] = sunny;
    display_elements[ esphome::elekswfd::display::weather::CLOUD[i] ] = cloud;
    display_elements[ esphome::elekswfd::display::weather::RAINS[i] ] = rains;
  }
}

void EleksWFD::showSpeaker( bool show ) {
  display_elements[ esphome::elekswfd::display::status_bar::SPEAKER[0] ] = show;
}
void EleksWFD::showMicrophone( bool show ) {
  display_elements[ esphome::elekswfd::display::status_bar::MICROPHONE[0] ] = show;
}
void EleksWFD::showHeadsets( bool show ) {
  display_elements[ esphome::elekswfd::display::status_bar::HEADSETS[0] ] = show;
}
void EleksWFD::showRecord( bool show ) {
  display_elements[ esphome::elekswfd::display::status_bar::RECORD[0] ] = show;
}
void EleksWFD::showSettings( bool show ) {
  display_elements[ esphome::elekswfd::display::status_bar::SETTINGS[0] ] = show;
  display_elements[ esphome::elekswfd::display::status_bar::SETTINGS[1] ] = show;
}
void EleksWFD::showServerConnected( bool show ) {
  this->setConnected( true, show );
}
void EleksWFD::showDesktopConnected( bool show ) {
  this->setConnected( false, show );
}
void EleksWFD::showWatch( bool show ) {
  display_elements[ esphome::elekswfd::display::status_bar::WATCH[0] ] = show;
  display_elements[ esphome::elekswfd::display::status_bar::WATCH[1] ] = show;
}
void EleksWFD::showHourglass( bool show ) {
  display_elements[ esphome::elekswfd::display::status_bar::HOURGLASS[0] ] = show;
}
void EleksWFD::showBattery( bool show ) {
  display_elements[ esphome::elekswfd::display::status_bar::BATTERY[0] ] = show;
}
void EleksWFD::showCalendar( bool show ) {
  display_elements[ esphome::elekswfd::display::status_bar::CALENDAR[0] ] = show;
}
void EleksWFD::showHotspot( bool show ) {
  display_elements[ esphome::elekswfd::display::status_bar::HOTSPOT[0] ] = show;
  display_elements[ esphome::elekswfd::display::status_bar::HOTSPOT[1] ] = show;
}

void EleksWFD::setConnected( bool server, bool connected ) {
  if ( server ) {
    display_elements[ esphome::elekswfd::display::status_bar::SERVER[0] ] = connected;
  } else {
    display_elements[ esphome::elekswfd::display::status_bar::DESKTOP[0] ] = connected;
  }

  display_elements[ esphome::elekswfd::display::status_bar::SERVER[1] ] = display_elements[ esphome::elekswfd::display::status_bar::SERVER[0] ] && display_elements[ esphome::elekswfd::display::status_bar::DESKTOP[0] ];
}

void EleksWFD::readTimeFromRTC() {
  // read the time from the RTC
  /** disable until RTC is figured out
  uint8_t data[19];
  this->i2c_bus_->read(this->rtc_address_, data, 19);

  // create an i2cDevice object
  // esphome::i2cDevice *i2c_device = new esphome::i2cDevice( this->rtc_address_ );

  // parse register data
  // 0x00 is Seconds  bit 6-4 is 10 seconds, bit 3-0 is seconds
  uint8_t seconds = (data[0] & 0x0F) + (((data[0] >> 4) & 0x07 ) * 10);
  // 0x01 is Minutes  bit 6-4 is 10 minutes, bit 3-0 is minutes
  uint8_t minutes = (data[1] & 0x0F) + ((data[1] >> 4) * 10);
  // 0x02 is Hours    bit 5-4 is 10 hours,   bit 3-0 is hours, bit 6 is 12/24
  uint8_t hours   = (data[2] & 0x0F) + ((data[2] >> 4) * 10);
  // 0x03 is Day     bit 2 - 0 is day (1 - 7)
  int day     = (data[4] & 0x0F) + ((data[4] >> 4) * 10);
  // 0x04 is Date    bit 5-4 is 10 date,     bit 3-0 is date
  uint8_t date    = (data[3] & 0x0F) + ((data[3] >> 4) * 10);
  // 0x05 is Month   bit 7 is century bit 4 is 10 month,    bit 3-0 is month
  uint8_t month   = (data[5] & 0x0F) + ((data[5] >> 4) * 10);
  // 0x06 is Year    bit 7 - 4 is 10 year, bit 3-0 is year
  uint16_t year   = 2000 + (data[6] & 0x0F) + ((data[6] >> 4) * 10);

  // 0x07 is is Alarm 1 Seconds, bit 7 is A1M1, bit 6-4 is 10 seconds, bit 3-0 is seconds
  // 0x08 is is Alarm 1 Minutes, bit 7 is A1M2, bit 6-4 is 10 minutes, bit 3-0 is minutes
  // 0x09 is is Alarm 1 Hours, bit 7 is A1M3, bit 6 is 12/24, bit 5 is 20 hours, bit 4 is 10 hours, bit 3-0 is hours
  // 0x0A is is Alarm 1 Day/Date, bit 7 is A1M4, bit 6 is DY/DT, bit 5-4 is 10 date/day, bit 3-0 is date/day
  
  // 0x0B is is Alarm 2 Seconds, bit 7 is A2M1, bit 6-4 is 10 seconds, bit 3-0 is seconds
  // 0x0B is is Alarm 2 Minutes, bit 7 is A2M2, bit 6-4 is 10 minutes, bit 3-0 is minutes
  // 0x0C is is Alarm 2 Hours, bit 7 is A2M3, bit 6 is 12/24, bit 5 is 20 hours, bit 4 is 10 hours, bit 3-0 is hours
  // 0x0D is is Alarm 2 Day/Date, bit 7 is A2M4, bit 6 is DY/DT, bit 5-4 is 10 date/day, bit 3-0 is date/day

  // 0x0E is is Control, bit 7 is EOSC, bit 6 is BBSQW, bit 5 is CONV, bit 4 is RS2, bit 3 is RS1, bit 2 is INTCN, bit 1 is A2IE, bit 0 is A1IE
  // 0x0F is is Control/Status, bit 7 is OSF, bit 6 is EN32kHz, bit 5 is BSY, bit 4 is A2F, bit 3 is A1F, bit 2 is 0, bit 1 is 0, bit 0 is 0
  // 0x10 is is Aging Offset, bit 7 is sign, bit 6-0 is aging offset

  // 0x11 is is Temp MSB, bit 7 is sign, bit 6-0 is temp MSB
  // 0x12 is is Temp LSB, bit 7-6 is temp LSB, bit 5-0 is 0

  uint16_t temp = data[17] & 0b0111111111000000 >> 6;
  if ( data[17] & 0b10000000 ) {
    temp = -temp;
  }

  // ESP_LOGD(TAG, "Temperature read from RTC: %d", temp );
  // log data registers 0x00 through 0x04 in binary string
  ESP_LOGD(TAG, "RTC Data 0x00-0x04: 0x%02x 0x%02x 0x%02x 0x%02x 0x%02x", data[0], data[1], data[2], data[3], data[4] );
  ESP_LOGD(TAG, "RTC Data 0x04-0x09: 0x%02x 0x%02x 0x%02x 0x%02x 0x%02x", data[5], data[6], data[7], data[8], data[9] );
  // ESP_LOGD(TAG, "RTC Data 0x0A-0x0E: 0x%02x 0x%02x 0x%02x 0x%02x 0x%02x", data[10], data[11], data[12], data[13], data[14] );
  // ESP_LOGD(TAG, "RTC Data 0x0F-0x12: 0x%02x 0x%02x 0x%02x 0x%02x 0x%02x", data[15], data[16], data[17], data[18], data[19] );

  ESP_LOGD(TAG, "Time read from RTC: %02d:%02d:%02d %02d/%02d/%04d %d", hours, minutes, seconds, date, month, year, day );

  // data[7] 

  // ESP_LOGD(TAG, "Time read from RTC: %02d:%02d:%02d %02d/%02d/%04d", hours, minutes, seconds, day, month, year);
   */

  // get day of week from esp
  
  // workaround to get time from esp32
  auto now = this->time_->now();

  if (now.is_valid()) {
    int day = now.day_of_week - 1; // 1 (Monday) to 7 (Sunday)
    int hours = now.hour;      // 0 - 23
    int minutes = now.minute;  // 0 - 59
    int seconds = now.second;  // 0 - 59

    this->setDayOfWeek(day);
    this->updateTime(hours, minutes, seconds);
  }

  // Set the time on the ESP
  // struct tm timeinfo;
  // timeinfo.tm_year = year;
  // timeinfo.tm_mon = month;
  // timeinfo.tm_mon = day;
  // timeinfo.tm_hour = hours;
  // timeinfo.tm_min = minutes;
  // timeinfo.tm_sec = seconds;
  // time_t epoch = mktime(&timeinfo);

  // struct timeval tv;
  // tv.tv_sec = epoch;
  // tv.tv_usec = 0;
  // settimeofday( &tv, nullptr );
}

/**
 * @brief Update the time on the display
 */
void EleksWFD::set_logo_animation( text_sensor::TextSensor *sens ) {
  logo_animation_ = sens;

  if ( sens == nullptr ) return;

  // parse initial state if available
  if ( sens->has_state() && sens->state.length() > 0 ) {
    parseLogoData( sens->state );
  }

  // listen for live updates from HA
  sens->add_on_state_callback( [this]( const std::string &value ) {
    ESP_LOGI( TAG, "Logo data updated (%d chars)", value.length() );
    parseLogoData( value );
  });
}


/**
 * Parse 5-char-per-frame encoded string into logo_frames and logo_delays.
 *
 * Each char minus 0x30 ('0') yields 6 bits. 5 chars = 30 bits per frame.
 * Bit layout (packed LSB-first):
 *   bits 0-12:  LOWER LEDs (13 bits)
 *   bits 13-25: UPPER LEDs (13 bits)
 *   bits 26-27: timing preset
 *
 * Timing presets: 00=50ms, 01=100ms, 10=250ms, 11=500ms
 * Valid chars: '0' (0x30) through 'o' (0x6F)
 */
void EleksWFD::parseLogoData( const std::string &data ) {
  static const uint16_t TIMING_PRESETS[] = { 50, 100, 200, 500 };

  logo_frames.clear();
  logo_delays.clear();
  logo_frame_index = 0;
  logo_frame_total = 0;
  logo_last_frame_time_ = esp_timer_get_time();

  if ( data.length() < 5 ) return;

  int frame_count = data.length() / 5;

  for ( int f = 0; f < frame_count; f++ ) {
    int offset = f * 5;
    uint32_t bits = 0;

    for ( int i = 0; i < 5; i++ ) {
      uint8_t val = static_cast<uint8_t>( data[ offset + i ] ) - 0x30;
      bits |= static_cast<uint32_t>( val & 0x3F ) << ( i * 6 );
    }

    uint32_t frame = bits & 0x03FFFFFF; // bits 0-25: 26 LED bits
    uint8_t timing_idx = ( bits >> 26 ) & 0x03;

    logo_frames.push_back( frame );
    logo_delays.push_back( TIMING_PRESETS[ timing_idx ] );
  }

  logo_frame_total = logo_frames.size();
  ESP_LOGI( TAG, "Parsed %d logo frames", logo_frame_total );
}
void EleksWFD::set_gif_animation( text_sensor::TextSensor *sens ) {
  gif_animation_ = sens;

  if ( sens == nullptr ) return;

  // parse initial state if available
  if ( sens->has_state() && sens->state.length() > 0 ) {
    parseGifData( sens->state );
  }

  // listen for live updates from HA
  sens->add_on_state_callback( [this]( const std::string &value ) {
    ESP_LOGI( TAG, "GIF data updated (%d chars)", value.length() );
    parseGifData( value );
  });
}


/**
 * Parse 11-char-per-frame encoded string into gif_frames and gif_delays.
 *
 * Each char minus 0x30 ('0') yields 6 bits. 11 chars = 66 bits per frame.
 * Bit layout (packed LSB-first):
 *   bits 0-48:  matrix rows 0-6 (7 bits each)
 *   bits 49-60: circle LEDs (12 bits)
 *   bits 61-62: timing preset
 *
 * Timing presets: 00=50ms, 01=100ms, 10=250ms, 11=500ms
 * Valid chars: '0' (0x30) through 'o' (0x6F)
 */
void EleksWFD::parseGifData( const std::string &data ) {
  static const uint16_t TIMING_PRESETS[] = { 50, 100, 200, 500 };

  gif_frames.clear();
  gif_delays.clear();
  gif_frame_index = 0;
  gif_frame_total = 0;
  gif_last_frame_time_ = esp_timer_get_time();
  gif_play_count_ = 0;
  gif_plays_remaining_ = 0;
  gif_global_remaining_ = -1;   // re-snapshot the sensor on next cycle end
  gif_done_ = false;

  // new format: 2 prefix chars (12-bit play count) + N * 11 chars of frames
  if ( data.length() < 2 + 11 ) return;

  uint8_t p_low  = static_cast<uint8_t>( data[ 0 ] ) - 0x30;
  uint8_t p_high = static_cast<uint8_t>( data[ 1 ] ) - 0x30;
  gif_play_count_ = ( p_low & 0x3F ) | ( ( p_high & 0x3F ) << 6 );
  gif_plays_remaining_ = gif_play_count_;

  int frame_count = ( data.length() - 2 ) / 11;

  for ( int f = 0; f < frame_count; f++ ) {
    int offset = 2 + f * 11;
    uint64_t bits = 0;

    for ( int i = 0; i < 11; i++ ) {
      uint8_t val = static_cast<uint8_t>( data[ offset + i ] ) - 0x30;
      bits |= static_cast<uint64_t>( val & 0x3F ) << ( i * 6 );
    }

    uint64_t frame = bits & 0x1FFFFFFFFFFFFFFFull;
    uint8_t timing_idx = ( bits >> 61 ) & 0x03;

    gif_frames.push_back( frame );
    gif_delays.push_back( TIMING_PRESETS[ timing_idx ] );
  }

  gif_frame_total = gif_frames.size();
  ESP_LOGI( TAG, "Parsed %d GIF frames (play_count=%u)", gif_frame_total, gif_play_count_ );
}
void EleksWFD::set_upper_text( text_sensor::TextSensor *sens ) {
  upper_text_ = sens;

  if ( sens == nullptr ) return;

  // parse initial state if available
  if ( sens->has_state() && sens->state.length() > 0 ) {
    const std::string &val = sens->state;
    upper_text_length_ = val.length() > 63 ? 63 : val.length();
    memcpy( upper_text, val.c_str(), upper_text_length_ );
    upper_text[ upper_text_length_ ] = '\0';
    upper_text_scroll_offset_ = 0;
  }

  // listen for live updates from HA
  sens->add_on_state_callback( [this]( const std::string &value ) {
    ESP_LOGI( TAG, "Upper text updated: %s", value.c_str() );
    upper_text_length_ = value.length() > 63 ? 63 : value.length();
    memcpy( upper_text, value.c_str(), upper_text_length_ );
    upper_text[ upper_text_length_ ] = '\0';
    upper_text_scroll_offset_ = 0;
  });
}
void EleksWFD::set_lower_text( text_sensor::TextSensor *sens ) {
  lower_text_ = sens;

  if ( sens == nullptr ) return;

  auto parseLower = [this]( const std::string &value ) {
    // check if empty or all spaces
    bool blank = value.empty();
    if ( !blank ) {
      blank = true;
      for ( char c : value ) {
        if ( c != ' ' ) { blank = false; break; }
      }
    }

    if ( blank ) {
      lower_text_active_ = false;
      lower_text_length_ = 0;
      ESP_LOGI( TAG, "Lower text cleared, showing clock" );
      return;
    }

    lower_text_length_ = value.length() > 63 ? 63 : value.length();
    memcpy( lower_text, value.c_str(), lower_text_length_ );
    lower_text[ lower_text_length_ ] = '\0';
    lower_text_scroll_offset_ = 0;
    lower_text_active_ = true;
    ESP_LOGI( TAG, "Lower text updated: %s", lower_text );
  };

  // parse initial state if available
  if ( sens->has_state() ) {
    parseLower( sens->state );
  }

  // listen for live updates from HA
  sens->add_on_state_callback( parseLower );
}

}  // namespace elekswfd
}  // namespace esphome
