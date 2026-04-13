import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';


const root = resolve( __dirname, '..' );
const envFile = resolve( root, '.env' );

/** load .env values */
const env = readFileSync( envFile, 'utf-8' );


/**
 * Get an env value by key
 *
 * @param key - the env key to look up
 * @returns the value or empty string
 */
function getEnv( key: string ): string {
  const match = env.match( new RegExp( `^${ key }=(.+)$`, 'm' ) );
  return match ? match[ 1 ].trim() : '';
}


const HA_URL = getEnv( 'HA_URL' ).replace( /\/api\/states\/?$/, '' );
const HA_TOKEN = getEnv( 'HA_TOKEN' );

if ( !HA_URL || !HA_TOKEN ) {
  console.error( 'HA_URL and HA_TOKEN must be set in .env' );
  process.exit( 1 );
}


/**
 * Encode bits into a string using 6 bits per char with offset 0x30.
 * Valid output chars: '0' (0x30) through 'o' (0x6F).
 *
 * @param bits - the value to encode as BigInt
 * @param numChars - number of output characters
 * @returns the encoded string
 */
function encode( bits: bigint, numChars: number ): string {
  let s = '';
  for ( let i = 0; i < numChars; i++ ) {
    s += String.fromCharCode( Number( ( bits >> BigInt( i * 6 ) ) & 0x3Fn ) + 0x30 );
  }
  return s;
}


/**
 * Encode a GIF frame (7x7 matrix + 12 circle LEDs + timing).
 * 11 chars per frame.
 *
 * @param rows - array of 7 row values (7 bits each, bit 0 = leftmost LED)
 * @param circle - 12-bit circle value (bit 0 = first circle LED)
 * @param timing - 0=50ms, 1=100ms, 2=250ms, 3=500ms
 * @returns 11-char encoded frame
 */
function encodeGifFrame( rows: number[], circle: number, timing: number ): string {
  let bits = 0n;
  for ( let r = 0; r < 7; r++ ) {
    bits |= BigInt( rows[ r ] & 0x7F ) << BigInt( r * 7 );
  }
  bits |= BigInt( circle & 0xFFF ) << 49n;
  bits |= BigInt( timing & 0x03 ) << 61n;
  return encode( bits, 11 );
}


/**
 * Encode a logo frame (26 LEDs + timing).
 * 5 chars per frame.
 *
 * @param value - 26-bit LED value (bits 0-12 = LOWER, bits 13-25 = UPPER)
 * @param timing - 0=50ms, 1=100ms, 2=250ms, 3=500ms
 * @returns 5-char encoded frame
 */
function encodeLogoFrame( value: number, timing: number ): string {
  let bits = BigInt( value & 0x03FFFFFF );
  bits |= BigInt( timing & 0x03 ) << 26n;
  return encode( bits, 5 );
}


/**
 * POST a value to a Home Assistant entity via the REST API.
 *
 * @param entityId - the entity ID (e.g. input_text.eleksmaker_gif)
 * @param value - the state value to set
 * @param attrs - optional attributes
 */
async function postToHA( entityId: string, value: string, attrs: Record<string, any> = {} ): Promise<void> {
  const url = `${ HA_URL }/api/states/${ entityId }`;
  const body = JSON.stringify({
    state: value,
    attributes: { friendly_name: entityId, ...attrs },
  });

  const res = await fetch( url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ HA_TOKEN }`,
      'Content-Type': 'application/json',
    },
    body,
  });

  if ( !res.ok ) {
    throw new Error( `HA POST failed: ${ res.status } ${ res.statusText }` );
  }
}


// ── frame definitions ──────────────────────────────────────────────

// 00=50ms, 01=100ms, 10=200ms, 11=500ms
const TIMING = { FAST: 0, MEDIUM: 1, SLOW: 2, SLOWER: 3 } as const;

// circle patterns: on-off-off rotating (4 LEDs lit out of 12)
const CIRCLE_A = 0b001001001001; // LEDs 0,3,6,9
const CIRCLE_B = 0b010010010010; // LEDs 1,4,7,10
const CIRCLE_C = 0b100100100100; // LEDs 2,5,8,11

// X pattern (bit 0 = leftmost column)
const X_ROWS = [
  0b1000001, // X.....X
  0b0100010, // .X...X.
  0b0010100, // ..X.X..
  0b0001000, // ...X...
  0b0010100, // ..X.X..
  0b0100010, // .X...X.
  0b1000001, // X.....X
];

// + pattern
const P_ROWS = [
  0b0000000, // .......
  0b0001000, // ...X...
  0b0001000, // ...X...
  0b0111110, // .XXXXX.
  0b0001000, // ...X...
  0b0001000, // ...X...
  0b0000000, // .......
];

// 6 frames: X/+ alternating with rotating circle
const gifStr = encodeGifFrame( X_ROWS, CIRCLE_A, TIMING.SLOW )
             + encodeGifFrame( P_ROWS, CIRCLE_B, TIMING.SLOW )
             + encodeGifFrame( X_ROWS, CIRCLE_C, TIMING.SLOW )
             + encodeGifFrame( P_ROWS, CIRCLE_A, TIMING.SLOW )
             + encodeGifFrame( X_ROWS, CIRCLE_B, TIMING.SLOW )
             + encodeGifFrame( P_ROWS, CIRCLE_C, TIMING.SLOW );

// logo: "ELEKSMAKER" letter-by-letter reveal at 200ms per frame
// bits 0-12 = LOWER row, bits 13-25 = UPPER row (left to right)
// each letter maps to ~2-3 LEDs across both rows
const LETTERS: Record<string, number[]> = {
  E1: [ 0, 1, 13 ],
  L:  [ 2, 14 ],
  E2: [ 3, 4, 15 ],
  K1: [ 5, 16 ],
  S:  [ 6, 17 ],
  M:  [ 7, 8, 18, 19 ],
  A:  [ 9, 20 ],
  K2: [ 10, 21 ],
  E3: [ 11, 22, 23 ],
  R:  [ 12, 24, 25 ],
};

const letterOrder = [ 'E1', 'L', 'E2', 'K1', 'S', 'M', 'A', 'K2', 'E3', 'R' ];

// build progressive frames: each frame adds the next letter
let logoStr = '';
let accumulated = 0;
for ( const key of letterOrder ) {
  for ( const bit of LETTERS[ key ] ) {
    accumulated |= ( 1 << bit );
  }
  logoStr += encodeLogoFrame( accumulated, TIMING.SLOW ); // 200ms per letter
}
// hold the full word, then fade into flickering idle
const ALL_ON = accumulated; // all 26 LEDs

/**
 * Turn off specific LED positions from the all-on state.
 *
 * @param leds - LED indices to turn off (0-25)
 * @returns 26-bit value with those LEDs off
 */
function flicker( ...leds: number[] ): number {
  let val = ALL_ON;
  for ( const led of leds ) val &= ~( 1 << led );
  return val;
}

logoStr += encodeLogoFrame( ALL_ON,            TIMING.SLOWER )  // hold 500ms
         + encodeLogoFrame( ALL_ON,            TIMING.SLOWER )
         + encodeLogoFrame( flicker( 3 ),      TIMING.FAST )    // 1 pixel off 50ms
         + encodeLogoFrame( ALL_ON,            TIMING.SLOWER )
         + encodeLogoFrame( ALL_ON,            TIMING.SLOWER )
         + encodeLogoFrame( flicker( 17 ),     TIMING.FAST )
         + encodeLogoFrame( ALL_ON,            TIMING.SLOWER )
         + encodeLogoFrame( flicker( 8, 21 ),  TIMING.FAST )    // 2 pixels off 50ms
         + encodeLogoFrame( ALL_ON,            TIMING.SLOWER )
         + encodeLogoFrame( ALL_ON,            TIMING.SLOWER )
         + encodeLogoFrame( ALL_ON,            TIMING.SLOWER )
         + encodeLogoFrame( flicker( 14 ),     TIMING.FAST )
         + encodeLogoFrame( ALL_ON,            TIMING.SLOWER )
         + encodeLogoFrame( ALL_ON,            TIMING.SLOWER )
         + encodeLogoFrame( flicker( 5, 22 ),  TIMING.FAST )
         + encodeLogoFrame( ALL_ON,            TIMING.SLOWER )
         + encodeLogoFrame( ALL_ON,            TIMING.SLOWER )
         + encodeLogoFrame( flicker( 10 ),     TIMING.FAST )
         + encodeLogoFrame( ALL_ON,            TIMING.SLOWER )
         + encodeLogoFrame( ALL_ON,            TIMING.SLOWER )
         + encodeLogoFrame( ALL_ON,            TIMING.SLOWER );

/**
 * Turn on specific LED positions from a blank state.
 *
 * @param leds - LED indices to turn on (0-25)
 * @returns 26-bit value with only those LEDs on
 */
function spark( ...leds: number[] ): number {
  let val = 0;
  for ( const led of leds ) val |= ( 1 << led );
  return val;
}

// hide: inverse of flicker -- mostly off with brief pixel sparks
logoStr += encodeLogoFrame( 0,                 TIMING.SLOWER )
         + encodeLogoFrame( spark( 3 ),        TIMING.FAST )
         + encodeLogoFrame( 0,                 TIMING.SLOWER )
         + encodeLogoFrame( 0,                 TIMING.SLOWER )
         + encodeLogoFrame( spark( 17 ),       TIMING.FAST )
         + encodeLogoFrame( 0,                 TIMING.SLOWER )
         + encodeLogoFrame( spark( 8, 21 ),    TIMING.FAST )
         + encodeLogoFrame( 0,                 TIMING.SLOWER )
         + encodeLogoFrame( 0,                 TIMING.SLOWER )
         + encodeLogoFrame( spark( 14 ),       TIMING.FAST )
         + encodeLogoFrame( 0,                 TIMING.SLOWER )
         + encodeLogoFrame( spark( 5, 22 ),    TIMING.FAST )
         + encodeLogoFrame( 0,                 TIMING.SLOWER )
         + encodeLogoFrame( 0,                 TIMING.SLOWER )
         + encodeLogoFrame( spark( 10 ),       TIMING.FAST )
         + encodeLogoFrame( 0,                 TIMING.SLOWER )
         + encodeLogoFrame( 0,                 TIMING.SLOWER );


// ── main ───────────────────────────────────────────────────────────

async function main() {
  console.log( `GIF  (${ gifStr.length / 11 } frames): ${ gifStr }` );
  console.log( `Logo (${ logoStr.length / 5 } frames): ${ logoStr }` );

  await postToHA( 'input_text.eleksmaker_gif', gifStr, {
    icon: 'mdi:animation',
    min: 0,
    max: 255,
  });
  console.log( 'GIF uploaded to input_text.eleksmaker_gif' );

  await postToHA( 'input_text.eleksmaker_logo', logoStr, {
    icon: 'mdi:led-on',
    min: 0,
    max: 255,
  });
  console.log( 'Logo uploaded to input_text.eleksmaker_logo' );

  const upperText = '1234';
  await postToHA( 'input_text.eleksmaker_upper', upperText, {
    icon: 'mdi:format-text',
    min: 0,
    max: 255,
  });
  console.log( `Upper text uploaded: "${ upperText }"` );
}

main().catch( ( err ) => {
  console.error( err.message );
  process.exit( 1 );
});
