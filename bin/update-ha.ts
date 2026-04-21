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
 * Encode the 2-char animation prefix containing a 12-bit play count.
 * 0 = loop forever. 1-4095 = play N times then clear.
 *
 * @param count - play count (0-4095)
 * @returns 2-char prefix
 */
function encodePlayCount( count: number ): string {
  const n = Math.max( 0, Math.min( 4095, Math.round( count ) ) );
  return String.fromCharCode( ( n & 0x3F ) + 0x30 )
       + String.fromCharCode( ( ( n >> 6 ) & 0x3F ) + 0x30 );
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
 * Set a value on an HA entity. Uses the appropriate service call for
 * persistent helpers (input_text/set_value, input_boolean/turn_on|turn_off).
 * Falls back to the REST states API if the service call fails.
 *
 * @param entityId - the entity ID (e.g. input_text.eleksmaker_gif)
 * @param value - the state value to set
 * @param attrs - optional attributes (only used for REST fallback)
 */
async function postToHA( entityId: string, value: string, attrs: Record<string, any> = {} ): Promise<void> {
  const headers = {
    'Authorization': `Bearer ${ HA_TOKEN }`,
    'Content-Type': 'application/json',
  };

  const [ domain ] = entityId.split( '.' );

  // try service call first (works with persistent helpers)
  let serviceUrl = '';
  let serviceBody = '';

  if ( domain === 'input_text' ) {
    serviceUrl = `${ HA_URL }/api/services/input_text/set_value`;
    serviceBody = JSON.stringify( { entity_id: entityId, value } );
  } else if ( domain === 'input_boolean' ) {
    const action = value === 'on' ? 'turn_on' : 'turn_off';
    serviceUrl = `${ HA_URL }/api/services/input_boolean/${ action }`;
    serviceBody = JSON.stringify( { entity_id: entityId } );
  } else if ( domain === 'input_number' ) {
    serviceUrl = `${ HA_URL }/api/services/input_number/set_value`;
    serviceBody = JSON.stringify( { entity_id: entityId, value: Number( value ) } );
  }

  if ( serviceUrl ) {
    const res = await fetch( serviceUrl, { method: 'POST', headers, body: serviceBody } );
    if ( res.ok ) return;
    // service failed (helper might not exist yet), fall back to states API
  }

  // fallback: create/update via states API (non-persistent)
  const res = await fetch( `${ HA_URL }/api/states/${ entityId }`, {
    method: 'POST',
    headers,
    body: JSON.stringify( { state: value, attributes: { friendly_name: entityId, ...attrs } } ),
  });

  if ( !res.ok ) {
    throw new Error( `HA POST failed: ${ res.status } ${ res.statusText }` );
  }
}


// ── frame definitions ──────────────────────────────────────────────

// 00=50ms, 01=100ms, 10=200ms, 11=500ms
const TIMING = { FAST: 0, MEDIUM: 1, SLOW: 2, SLOWER: 3 } as const;

// CIRCLE LEDs: 12 LEDs surrounding the 7x7 matrix
// on-off-off pattern, counter-clockwise (opposite to cross rotation)
const CIRCLE_A = 0b001001001001; // LEDs 0,3,6,9
const CIRCLE_B = 0b010010010010; // LEDs 1,4,7,10
const CIRCLE_C = 0b100100100100; // LEDs 2,5,8,11
// CW order: A → B → C
const CW = [ CIRCLE_A, CIRCLE_B, CIRCLE_C ];

/**
 * Rasterize a line at angle theta (radians) through center (3,3) onto a 7x7 grid.
 *
 * @param rows - row array to draw into (mutated)
 * @param theta - angle in radians from horizontal
 */
function drawLine( rows: number[], theta: number ): void {
  const cx = 3, cy = 3;
  const cosT = Math.cos( theta );
  const sinT = Math.sin( theta );

  // iterate along the line in small steps
  for ( let t = -4; t <= 4; t += 0.25 ) {
    const c = Math.round( cx + t * cosT );
    const r = Math.round( cy + t * sinT );
    if ( r >= 0 && r <= 6 && c >= 0 && c <= 6 ) {
      rows[ r ] |= ( 1 << c );
    }
  }
}


/**
 * Generate a rotating cross frame at the given angle.
 * Two perpendicular lines through center.
 *
 * @param theta - angle in radians
 * @returns 7 row values
 */
function crossFrame( theta: number ): number[] {
  const rows = [ 0, 0, 0, 0, 0, 0, 0 ];
  drawLine( rows, theta );
  drawLine( rows, theta + Math.PI / 2 );
  return rows;
}

// 6 unique frames over 90° (15° per step, hits 45° at step 3 so corners light up)
// circle lights up only on the 45° frame (when X passes through corners)
const STEPS = 6;
const SOLID_CIRCLE = 0xFFF;
const CORNER_STEP = 3; // 45° = corners
let gifStr = encodePlayCount( 0 ); // 0 = loop forever
for ( let i = 0; i < STEPS; i++ ) {
  const theta = ( i * Math.PI / 2 ) / STEPS;
  const circle = i === CORNER_STEP ? SOLID_CIRCLE : 0;
  gifStr += encodeGifFrame( crossFrame( theta ), circle, TIMING.MEDIUM );
}

// logo: 4 states across 51 frames (255 / 5), all at 500ms = 25.5s cycle
// bits 0-12 = LOWER row, bits 13-25 = UPPER row (left to right)
// slide in/out advances LOWER[i] and UPPER[i] in lockstep, one index per frame
const ALL_ON = 0x03FFFFFF;
const SLIDE_FRAMES = 13;  // one frame per LED column
const HOLD_ON_FRAMES = 19;
const HOLD_OFF_FRAMES = 6;
// 13 + 19 + 13 + 6 = 51

let logoStr = '';

// state 1: slide in L→R — frame N lights LOWER[N] + UPPER[N]
let accumulated = 0;
for ( let n = 0; n < SLIDE_FRAMES; n++ ) {
  accumulated |= ( 1 << n ) | ( 1 << ( n + 13 ) );
  logoStr += encodeLogoFrame( accumulated, TIMING.SLOW ); // 200ms (halved from 500ms)
}

// state 2: hold on with a sweep-off through all 13 columns
// centered so the middle column (index 6) is off at the midpoint frame
// 19 frames = 3 static + 13 sweep + 3 static, midpoint (frame 9) = column 6
{
  const preStatic = Math.floor( ( HOLD_ON_FRAMES - SLIDE_FRAMES ) / 2 );
  const postStatic = HOLD_ON_FRAMES - SLIDE_FRAMES - preStatic;
  for ( let i = 0; i < preStatic; i++ ) {
    logoStr += encodeLogoFrame( ALL_ON, TIMING.SLOWER );
  }
  for ( let n = 0; n < SLIDE_FRAMES; n++ ) {
    const frame = ALL_ON & ~( ( 1 << n ) | ( 1 << ( n + 13 ) ) );
    logoStr += encodeLogoFrame( frame, TIMING.SLOWER );
  }
  for ( let i = 0; i < postStatic; i++ ) {
    logoStr += encodeLogoFrame( ALL_ON, TIMING.SLOWER );
  }
}

// state 3: slide out L→R — frame N turns off LOWER[N] + UPPER[N]
let remaining = ALL_ON;
for ( let n = 0; n < SLIDE_FRAMES; n++ ) {
  remaining &= ~( ( 1 << n ) | ( 1 << ( n + 13 ) ) );
  logoStr += encodeLogoFrame( remaining, TIMING.SLOW ); // 200ms (halved from 500ms)
}

// state 4: hold off
for ( let i = 0; i < HOLD_OFF_FRAMES; i++ ) {
  logoStr += encodeLogoFrame( 0, TIMING.SLOWER );
}


// ── main ───────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice( 2 );
  const all = args.includes( '--all' ) || args.includes( '-a' );
  const flags = {
    gif:     all || args.includes( '--gif' )     || args.includes( '-g' ),
    logo:    all || args.includes( '--logo' )    || args.includes( '-l' ),
    upper:   all || args.includes( '--upper' )   || args.includes( '-u' ),
    lower:   all || args.includes( '--lower' )   || args.includes( '-L' ),
    flicker: all || args.includes( '--flicker' ) || args.includes( '-f' ),
  };

  if ( !Object.values( flags ).some( v => v ) ) {
    console.log( 'Usage: npm run update:ha -- <flags>' );
    console.log( '  --gif     / -g   update matrix GIF animation' );
    console.log( '  --logo    / -l   update logo animation' );
    console.log( '  --upper   / -u   update upper text' );
    console.log( '  --lower   / -L   update lower text (clock when empty)' );
    console.log( '  --flicker / -f   update logo flicker toggle' );
    console.log( '  --all     / -a   update everything' );
    return;
  }

  if ( flags.gif ) {
    console.log( `GIF  (${ ( gifStr.length - 2 ) / 11 } frames): ${ gifStr }` );
    await postToHA( 'input_text.eleksmaker_gif', gifStr, { icon: 'mdi:animation', min: 0, max: 255 });
    console.log( 'GIF uploaded to input_text.eleksmaker_gif' );
  }

  if ( flags.logo ) {
    console.log( `Logo (${ logoStr.length / 5 } frames): ${ logoStr }` );
    await postToHA( 'input_text.eleksmaker_logo', logoStr, { icon: 'mdi:led-on', min: 0, max: 255 });
    console.log( 'Logo uploaded to input_text.eleksmaker_logo' );
  }

  if ( flags.upper ) {
    const upperText = 'ELEKSMAKER WFD1';
    await postToHA( 'input_text.eleksmaker_upper', upperText, { icon: 'mdi:format-text', min: 0, max: 255 });
    console.log( `Upper text uploaded: "${ upperText }"` );
  }

  if ( flags.lower ) {
    const lowerText = ''; // empty = show clock
    await postToHA( 'input_text.eleksmaker_lower', lowerText, { icon: 'mdi:clock-digital', min: 0, max: 255 });
    console.log( `Lower text uploaded: "${ lowerText || '(empty - clock mode)' }"` );
  }

  if ( flags.flicker ) {
    // flicker is now a rate in Hz (flickers per second), default 0
    await postToHA( 'input_number.eleksmaker_logo_flicker', '25', { friendly_name: 'EleksMaker Logo Flicker', icon: 'mdi:flash' });
    console.log( 'Logo flicker: 25 Hz' );
  }
}

main().catch( ( err ) => {
  console.error( err.message );
  process.exit( 1 );
});
