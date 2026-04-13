#include "esphome/core/component.h"

namespace esphome {
namespace elekswfd {
namespace display {

  // 7 segment digits
  namespace LOWER_DIGIT_1 {
    const int SEG_A = 100;
    const int SEG_B = 101;
    const int SEG_C = 102;
    const int SEG_D = 103;
    const int SEG_E = 96;
    const int SEG_F = 97;
    const int SEG_G = 98;
  }

  // 7 segment digits
  namespace LOWER_DIGIT_2 {
    const int SEG_A = 116;
    const int SEG_B = 117;
    const int SEG_C = 118;
    const int SEG_D = 119;
    const int SEG_E = 112;
    const int SEG_F = 113;
    const int SEG_G = 114;
  }

  // 7 segment digits
  namespace LOWER_DIGIT_3 {
    const int SEG_A = 132;
    const int SEG_B = 133;
    const int SEG_C = 134;
    const int SEG_D = 135;
    const int SEG_E = 128;
    const int SEG_F = 129;
    const int SEG_G = 130;
  }

  // TODO segment a and e are wrong (swapped with something outside of the digits)
  // 7 segment digits
  namespace LOWER_DIGIT_4 {
    const int SEG_A = 148;
    const int SEG_B = 149;
    const int SEG_C = 150;
    const int SEG_D = 151;
    const int SEG_E = 144;
    const int SEG_F = 145;
    const int SEG_G = 146;
  }

  // TODO segment a and e are wrong (swapped with something outside of the digits)
  // 7 segment digits
  namespace LOWER_DIGIT_5 {
    const int SEG_A = 164;
    const int SEG_B = 165;
    const int SEG_C = 166;
    const int SEG_D = 167;
    const int SEG_E = 160;
    const int SEG_F = 161;
    const int SEG_G = 162;
  }

  // TODO segment a and e are wrong (swapped with something outside of the digits)
  // 7 segment digits
  namespace LOWER_DIGIT_6 {
    const int SEG_A = 180;
    const int SEG_B = 181;
    const int SEG_C = 182;
    const int SEG_D = 183;
    const int SEG_E = 176;
    const int SEG_F = 177;
    const int SEG_G = 178;
  }

  // colon between digits 2 and 3
  const int LOWER_DIGIT_SEPARATOR_1 = 115;

  // colon between digits 4 and 5
  const int LOWER_DIGIT_SEPARATOR_2 = 147;

  // 13 segment digits
  namespace UPPER_DIGIT_1 {
    const int SEG_A = 4;
    const int SEG_B = 5;
    const int SEG_C = 6;
    const int SEG_D = 7;
    const int SEG_E = 0;
    const int SEG_F = 1;
    const int SEG_G = 2;
    const int SEG_H = 12;
    const int SEG_I = 13;
    const int SEG_J = 14;
    const int SEG_K = 15;
    const int SEG_L = 8;
    const int SEG_M = 9;
  }

  // 13 segment digits
  namespace UPPER_DIGIT_2 {
    const int SEG_A = 20;
    const int SEG_B = 21;
    const int SEG_C = 22;
    const int SEG_D = 23;
    const int SEG_E = 16;
    const int SEG_F = 17;
    const int SEG_G = 18;
    const int SEG_H = 28;
    const int SEG_I = 29;
    const int SEG_J = 30;
    const int SEG_K = 31;
    const int SEG_L = 24;
    const int SEG_M = 25;
  }

  // 13 segment digits
  namespace UPPER_DIGIT_3 {
    const int SEG_A = 36;
    const int SEG_B = 37;
    const int SEG_C = 38;
    const int SEG_D = 39;
    const int SEG_E = 32;
    const int SEG_F = 33;
    const int SEG_G = 34;
    const int SEG_H = 44;
    const int SEG_I = 45;
    const int SEG_J = 46;
    const int SEG_K = 47;
    const int SEG_L = 40;
    const int SEG_M = 41;
  }

  // 13 segment digits
  namespace UPPER_DIGIT_4 {
    const int SEG_A = 52;
    const int SEG_B = 53;
    const int SEG_C = 54;
    const int SEG_D = 55;
    const int SEG_E = 48;
    const int SEG_F = 49;
    const int SEG_G = 50;
    const int SEG_H = 60;
    const int SEG_I = 61;
    const int SEG_J = 62;
    const int SEG_K = 63;
    const int SEG_L = 56;
    const int SEG_M = 57;
  }

  // 13 segment digits
  namespace UPPER_DIGIT_5 {
    const int SEG_A = 68;
    const int SEG_B = 69;
    const int SEG_C = 70;
    const int SEG_D = 71;
    const int SEG_E = 64;
    const int SEG_F = 65;
    const int SEG_G = 66;
    const int SEG_H = 76;
    const int SEG_I = 77;
    const int SEG_J = 78;
    const int SEG_K = 79;
    const int SEG_L = 72;
    const int SEG_M = 73;
  }

  // 13 segment digits
  namespace UPPER_DIGIT_6 {
    const int SEG_A = 84;
    const int SEG_B = 85;
    const int SEG_C = 86;
    const int SEG_D = 87;
    const int SEG_E = 80;
    const int SEG_F = 81;
    const int SEG_G = 82;
    const int SEG_H = 92;
    const int SEG_I = 93;
    const int SEG_J = 94;
    const int SEG_K = 95;
    const int SEG_L = 88;
    const int SEG_M = 89;
  }

  /**
   * 7 x 7 matrix with a circle of around 13 leds
   */
  namespace matrix {

    // circle seems to be around 13 leds
    // TODO needs organized in order around the circle
    const int CIRCLE[] = {
      138, 139, 124, // top
      156, 157, 131, // right
      140, 141, 142, // bottom
      143, 136, 137 // left
    };

    // 7 rows of 7 leds
    // TODO not 100% sure on the order yet
    const int ROW_0[] = { 125, 126, 127, 120, 121, 122, 123 };
    const int ROW_1[] = {  99, 108, 109, 110, 111, 104, 105 };
    const int ROW_2[] = { 106, 107, 201, 202, 203, 212, 213 };
    const int ROW_3[] = { 214, 215, 208, 209, 210, 211, 220 };
    const int ROW_4[] = { 221, 222, 223, 216, 217, 218, 219 };
    const int ROW_5[] = { 228, 229, 230, 231, 224, 225, 226 };
    const int ROW_6[] = { 227, 236, 237, 238, 239, 232, 233 };

  }

  // each weather segment semes to be 2-3 leds
  namespace weather {
    const int SUNNY[] = { 249, 250 };
    const int CLOUD[] = { 251, 265 };
    const int RAINS[] = { 266, 267 };
  }

  // logo seems to be 2 rows of 16 leds
  namespace logo {
    const int UPPER[] = { 244, 245, 246, 247, 240, 241, 242, 243, 252, 253, 254, 255, 248 };
    const int LOWER[] = { 260, 261, 262, 263, 268, 269, 270, 271, 256, 257, 258, 259, 264 };
  }

  namespace horizontal_bars {
    // seems like 1 led for the logo
    const int CPU_LOGO[] = { 276 };

    // ltr 14 green leds, 4 orange leds and 2 red leds
    // TODO these are not in order
    const int CPU_BAR[] = { 277, 278, 279, 272, 273, 274, 275, 284, 285, 286, 287, 280, 281, 282,  283, 324, 325, 326,  327, 320 };

    // seems like 1 led for the percentage sign
    const int CPU_PERCENTAGE[] = { 321 };

    // seems like 1 led for the logo
    const int GPU_LOGO[] = { 292 };

    // ltr 14 green leds, 4 orange leds and 2 red leds
    // TODO these are not in order
    const int GPU_BAR[] = { 293, 294, 295, 288, 289, 290, 291, 300, 301, 302, 303, 296, 297, 298,  299, 322, 323, 332,  333, 334 };

    // seems like 1 led for the percentage sign
    const int GPU_PERCENTAGE[] = { 335 };

    // seems like 1 led for the logo
    const int RAM_LOGO[] = { 308 };

    // ltr 14 green leds, 4 orange leds and 2 red leds
    // TODO these are not in order
    const int RAM_BAR[] = { 309, 310, 311, 304, 305, 306, 307, 316, 317, 318, 319, 312, 313, 314,  315, 328, 329, 330,  331, 340 };

    // seems like 1 led for the percentage sign
    const int RAM_PERCENTAGE[] = { 341 };
  }

  namespace vertical_bars {
    // 5 green, 4 orange and 3 red leds
    // TODO some of these are swapped with each other and the last 3 lower digits
    const int BAR_1[] = { 186, 184, 190, 188, 171, 169, 175, 173, 163, 154, 152, 158 };
    
    // 5 green, 4 orange and 3 red leds
    // TODO some of these are swapped with each other and the last 3 lower digits
    const int BAR_2[] = { 187, 185, 191, 189, 179, 170, 168, 174, 172, 155, 153, 159 };
  }

  namespace day_of_week {
    // 2-3 leds for each day
    // TODO these may have some missing leds
    const int MONDAY[]    = { 196, 197 };
    const int TUESDAY[]   = { 198, 199 };
    const int WEDNESDAY[] = { 192, 193 };
    const int THURSDAY[]  = { 194, 195 };
    const int FRIDAY[]    = { 204, 205 };
    const int SATURDAY[]  = { 206, 207 };
    const int SUNDAY[]    = { 200, 3, 10 };
  }

  namespace status_bar {
    // red area, 4 icons
    const int SPEAKER[] = { 11 };
    const int MICROPHONE[] = { 19 };
    const int HEADSETS[] = { 26 };
    const int RECORD[] = { 27 };

    // white area, 3 icons
    const int SETTINGS[] = { 35, 42 };
    const int DESKTOP[] = { 43 }; // 51 lights up part of desktop and server
    const int SERVER[] = { 51, 58 };

    // orange area, 3 icons
    const int WATCH[] = { 59, 67 };
    const int HOURGLASS[] = { 74 };
    const int BATTERY[] = { 75 };

    // green area, 2 icons
    const int CALENDAR[] = { 83 };
    const int HOTSPOT[] = { 90, 91 };

  }

  const int UNUSED[] = { 234, 235, 336, 337, 338, 339, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383 };

}
}
}