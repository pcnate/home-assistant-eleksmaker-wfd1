import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';


const root = resolve( __dirname, '..' );
const env = readFileSync( resolve( root, '.env' ), 'utf-8' );


/**
 * Get an env value by key
 */
function getEnv( key: string ): string {
  const match = env.match( new RegExp( `^${ key }=(.+)$`, 'm' ) );
  return match ? match[ 1 ].trim() : '';
}


const HA_URL = getEnv( 'HA_URL' ).replace( /\/api\/states\/?$/, '' );
const HA_TOKEN = getEnv( 'HA_TOKEN' );

const args = process.argv.slice( 2 );
const render = args.includes( '--render' ) || args.includes( '-r' );

// --animate [N] or --animate=N or -a [N]
function parseAnimateArg(): { enabled: boolean; loops: number } {
  const eq = args.find( a => a.startsWith( '--animate=' ) );
  if ( eq ) {
    const n = parseInt( eq.split( '=' )[ 1 ], 10 );
    return { enabled: true, loops: Math.min( 100, Math.max( 1, isFinite( n ) ? n : 3 ) ) };
  }
  const flagIdx = args.findIndex( a => a === '--animate' || a === '-a' );
  if ( flagIdx === -1 ) return { enabled: false, loops: 3 };
  const next = args[ flagIdx + 1 ];
  const n = next != null ? parseInt( next, 10 ) : NaN;
  const loops = isFinite( n ) ? Math.min( 100, Math.max( 1, n ) ) : 3;
  return { enabled: true, loops };
}

const animate = parseAnimateArg();

const TIMING_PRESETS = [ 50, 100, 200, 500 ];
const CHARS_PER_FRAME = 11;


/**
 * Decode an EleksWFD animation string into frames.
 *
 * @param str - encoded string
 * @returns array of decoded frames with raw fields
 */
function decode( str: string ) {
  const frames: Array<{
    matrix: boolean[][];
    circle: boolean[];
    timing: number;
    clearAfter: boolean;
  }> = [];

  for ( let o = 0; o + CHARS_PER_FRAME <= str.length; o += CHARS_PER_FRAME ) {
    let bits = 0n;
    for ( let i = 0; i < CHARS_PER_FRAME; i++ ) {
      bits |= BigInt( str.charCodeAt( o + i ) - 0x30 ) << BigInt( i * 6 );
    }
    const matrix = Array.from( { length: 7 }, () => Array( 7 ).fill( false ) );
    for ( let r = 0; r < 7; r++ ) {
      for ( let c = 0; c < 7; c++ ) {
        matrix[ r ][ c ] = ( ( bits >> BigInt( r * 7 + c ) ) & 1n ) === 1n;
      }
    }
    const circle: boolean[] = [];
    for ( let i = 0; i < 12; i++ ) {
      circle.push( ( ( bits >> BigInt( 49 + i ) ) & 1n ) === 1n );
    }
    const timing = Number( ( bits >> 61n ) & 0x3n );
    const clearAfter = ( ( bits >> 63n ) & 1n ) === 1n;
    frames.push( { matrix, circle, timing, clearAfter } );
  }

  return frames;
}


/**
 * Render a frame as ASCII art to the terminal.
 *
 * Layout: 7x7 matrix cells are 1 char each. 12 circle LEDs frame the matrix
 * as 4 sides of 3 dashes. Corner characters (┌ ┐ └ ┘) appear when the two
 * adjacent side LEDs are both lit.
 *
 *    CIRCLE array layout:
 *      top (L→R):     0, 1, 2
 *      right (T→B):   3, 4, 5
 *      bottom (R→L):  6, 7, 8
 *      left (B→T):    9, 10, 11
 *
 * @param f - decoded frame
 * @param idx - 0-indexed frame number
 * @param total - total frame count
 */
function renderFrame( f: ReturnType<typeof decode>[ number ], idx: number, total: number ): void {
  const WHITE = '\x1b[97m';
  const DIM = '\x1b[90m';
  const RESET = '\x1b[0m';

  const c = f.circle;
  const on = ( x: string ) => `${ WHITE }${ x }${ RESET }`;
  const off = `${ DIM }··${ RESET }`;
  const mcell = ( lit: boolean ) => lit ? on( '██' ) : off;

  // Layout widths:
  //   matrix = 7 cells × 2 chars = 14 chars wide, 7 rows tall
  //   total width = 1 corner + 14 + 1 corner = 16 chars
  //   top/bottom LED bars split 14 chars as 5 + 4 + 5 (3 LEDs)
  //   vertical LEDs span 3 rows each; 3 LEDs = 9 rows middle region
  //   matrix occupies rows 1-7 of the 9 middle rows (1 row pad top & bottom)
  const BAR_WIDTHS = [ 5, 4, 5 ];

  /**
   * Corner character: if both adjacent edge LEDs are on → proper corner
   * (┌ ┐ └ ┘), if only the horizontal is on → ─, only vertical → │, else ' '.
   */
  const corner = ( h: boolean, v: boolean, both: string ): string => {
    if ( h && v ) return on( both );
    if ( h ) return on( '─' );
    if ( v ) return on( '│' );
    return ' ';
  };

  const tl = corner( c[ 0 ], c[ 11 ], '┌' );
  const tr = corner( c[ 2 ], c[ 3 ],  '┐' );
  const bl = corner( c[ 8 ], c[ 9 ],  '└' );
  const br = corner( c[ 6 ], c[ 5 ],  '┘' );

  const hBar  = ( lit: boolean, width: number ) => lit ? on( '─'.repeat( width ) ) : ' '.repeat( width );
  const vCell = ( lit: boolean ) => lit ? on( '│' ) : ' ';

  const flags = f.clearAfter && idx === 0 ? '  [CLEAR-AFTER]' : '';
  console.log( `\nFrame ${ idx + 1 }/${ total }  ${ TIMING_PRESETS[ f.timing ] }ms${ flags }` );

  // top: corner + 3 horizontal bars + corner (total 16 chars)
  console.log( `${ tl }${ hBar( c[ 0 ], BAR_WIDTHS[ 0 ] ) }${ hBar( c[ 1 ], BAR_WIDTHS[ 1 ] ) }${ hBar( c[ 2 ], BAR_WIDTHS[ 2 ] ) }${ tr }` );

  // middle: 7 rows matching matrix height. Vertical LEDs distributed 2+3+2:
  //   rows 0-1 → topmost LED (left=11, right=3)
  //   rows 2-4 → middle LED (left=10, right=4)
  //   rows 5-6 → bottom LED (left=9, right=5)
  for ( let row = 0; row < 7; row++ ) {
    const leftLed  = c[ row < 2 ? 11 : row < 5 ? 10 : 9 ];
    const rightLed = c[ row < 2 ? 3  : row < 5 ? 4  : 5 ];
    const body = f.matrix[ row ].map( mcell ).join( '' ); // 14 chars
    console.log( `${ vCell( leftLed ) }${ body }${ vCell( rightLed ) }` );
  }

  // bottom: corner + 3 bars (display L→R uses array 8, 7, 6) + corner
  console.log( `${ bl }${ hBar( c[ 8 ], BAR_WIDTHS[ 0 ] ) }${ hBar( c[ 7 ], BAR_WIDTHS[ 1 ] ) }${ hBar( c[ 6 ], BAR_WIDTHS[ 2 ] ) }${ br }` );
}


async function main() {
  const res = await fetch( `${ HA_URL }/api/states/input_text.eleksmaker_gif`, {
    headers: { 'Authorization': `Bearer ${ HA_TOKEN }` },
  });
  if ( !res.ok ) throw new Error( `HA GET failed: ${ res.status }` );
  const data = await res.json() as any;
  const value: string = data.state ?? '';

  const frames = decode( value );

  console.log( `String: ${ value }` );
  console.log( `Length: ${ value.length } chars / ${ frames.length } frames` );
  if ( frames.length > 0 ) {
    console.log( `Frame 0 clear-after flag: ${ frames[ 0 ].clearAfter ? 'YES' : 'no' }` );
    const timings = frames.map( ( f, i ) => `${ i + 1 }:${ TIMING_PRESETS[ f.timing ] }ms` );
    console.log( `Timings: ${ timings.join( ', ' ) }` );
    console.log( `Total duration: ${ frames.reduce( ( s, f ) => s + TIMING_PRESETS[ f.timing ], 0 ) }ms` );
  }

  if ( animate.enabled ) {
    if ( frames.length === 0 ) {
      console.log( 'No frames to animate.' );
      return;
    }
    // clear screen once before starting
    process.stdout.write( '\x1b[2J' );
    for ( let loop = 0; loop < animate.loops; loop++ ) {
      for ( let i = 0; i < frames.length; i++ ) {
        // move cursor home and clear from there (prevents flicker)
        process.stdout.write( '\x1b[H\x1b[J' );
        console.log( `Loop ${ loop + 1 }/${ animate.loops }` );
        renderFrame( frames[ i ], i, frames.length );
        await new Promise( res => setTimeout( res, TIMING_PRESETS[ frames[ i ].timing ] ) );
      }
    }
  } else if ( render ) {
    for ( let i = 0; i < frames.length; i++ ) {
      renderFrame( frames[ i ], i, frames.length );
    }
  } else {
    console.log( '\nPass --render (or -r) to dump all frames, or --animate [N] to play (default 3 loops, max 100)' );
  }
}

main().catch( ( err ) => {
  console.error( err.message );
  process.exit( 1 );
});
