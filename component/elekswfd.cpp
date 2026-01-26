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

  // initialize all registers to 0
  for (int i = 0; i < 24*16; i++) {
    display_elements[i] = false;
  }

  this->initializeDS3231();
  this->initializeTM1680();
  this->initializeButtons();
  this->initializeMicrophone();
  this->readTimeFromRTC();

  // this->updateTime( this->counter, this->counter, this->counter );

  set_interval(   66, [this](){ this->debug(); });
  set_interval(   25, [this](){ this->updateDisplay(); });
  set_interval( 1000, [this](){ this->readTimeFromRTC(); });
  set_interval(   50, [this](){ this->readMicrophone(); });
  set_interval(  133, [this](){ this->updateExternals(); });
  set_interval(   50, [this](){ this->animate(); });
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
  // first we determine how much time has passed since the last call
  int64_t now = esp_timer_get_time();
  int64_t time_passed = now - last_time_;
  last_time_ = now;

  if ( time_passed < 250 ) {
    return;
  }

  logo_frame_index++;
  if ( logo_frame_index > logo_frames.size() ) {
    logo_frame_index = 0;
  }

  gif_frame_index++;
  if ( gif_frame_index > 64 ) {
    gif_frame_index = 0;
  }

  this->renderGIF();
  this->renderLogo();
}

void EleksWFD::renderGIF() {
  bool showGIF = true;
  // if ( show_logo_ != nullptr ) {
  //   showGIF = show_logo_->state;
  // }
  
  // use the const array from esphome::elekswfd::display::matrix::CIRCLE and ROW_x to populate indexs
  int indexs[61] = {};

  for (int i = 60; i > -1; i--) {
    if ( i > 48 ) {
      indexs[i] = esphome::elekswfd::display::matrix::CIRCLE[i-49];
    } else
    if ( i > 41 ) {
      indexs[i] = esphome::elekswfd::display::matrix::ROW_6[i-42];
    } else
    if ( i > 34 ) {
      indexs[i] = esphome::elekswfd::display::matrix::ROW_5[i-35];
    } else
    if ( i > 27 ) {
      indexs[i] = esphome::elekswfd::display::matrix::ROW_4[i-28];
    } else
    if ( i > 20 ) {
      indexs[i] = esphome::elekswfd::display::matrix::ROW_3[i-21];
    } else
    if ( i > 13 ) {
      indexs[i] = esphome::elekswfd::display::matrix::ROW_2[i-14];
    } else
    if ( i > 6 ) {
      indexs[i] = esphome::elekswfd::display::matrix::ROW_1[i-7];
    } else {
      indexs[i] = esphome::elekswfd::display::matrix::ROW_0[i];
    }
  }

  for (int i = 0; i < 61; i++) {
    if ( showGIF ) {
      const bool bit = (i % 2) == (gif_frame_index % 2);
      display_elements[ indexs[i] ] = bit;
    } else {
      display_elements[ indexs[i] ] = false;
    }
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

void EleksWFD::updateTime( int hour, int minute, int second ) {
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

  // get the 7 segment value
  uint8_t fourteen_seg = FourteenSegmentASCII[index];

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
  if ( _value > 100 ) {
    ESP_LOGW( TAG, "Invalid value %d/100, using 100/100", _value );
    _value = 100;
  }

  // convert the _value range of 0-100 to 0-12 and round to nearest whole number
  int value = static_cast<int>( round( _value / 8.333333 ) );

  // loop through each element in the vertical bar and set it to true if it is less than the value
  for ( int i = 0; i < 12; i++ ) {
    if ( !bar ) { // element 0 should be on when the value is 1+ and off when the value is 0
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
void EleksWFD::set_logo_animation(text_sensor::TextSensor *sens) {
  logo_frames.clear();
  
  if ( sens == nullptr || !sens->has_state() ) {
    logo_frames.push_back( 0x0FEFEFEF );
    logo_frames.push_back( 0x0EFEFEFE );
    logo_frames.push_back( 0x03FFFFFF );
    logo_frames.push_back( 0x0FEFEFEF );
    logo_frames.push_back( 0x0EFEFEFE );
    logo_frames.push_back( 0x03FFFFFF );
    logo_frame_total = logo_frames.size();
    logo_frame_index = 0;
    return;
  }

  if ( sens->state.length() == 0 ) {
    logo_frame_total = 0;
    logo_frame_index = 0;
    return;
  }

  const std::string &data = sens->state;
  std::stringstream ss( data );
  std::string frame_str;

  while ( std::getline( ss, frame_str, ',' ) ) {
    if ( frame_str.empty() ) continue;
    uint32_t frame = std::stoul( frame_str, nullptr, 16 );
    logo_frames.push_back( frame & 0x00FFFFFF );
  }

  logo_frame_total = logo_frames.size();
  logo_frame_index = 0;
}
void EleksWFD::set_gif_animation(text_sensor::TextSensor *sens) {
  
}
void EleksWFD::set_upper_text(text_sensor::TextSensor *sens) {
  
}
void EleksWFD::set_lower_text(text_sensor::TextSensor *sens) {
  
}

}  // namespace elekswfd
}  // namespace esphome
