import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';


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

const TIMING_PRESETS = [ 50, 100, 200, 500 ];
const CHARS_PER_FRAME = 11;


// ── args ────────────────────────────────────────────────────────────

const args = process.argv.slice( 2 );

function argVal( name: string ): string | undefined {
  const kv = args.find( a => a.startsWith( `--${ name }=` ) );
  if ( kv ) return kv.split( '=' )[ 1 ];
  const i = args.findIndex( a => a === `--${ name }` );
  if ( i >= 0 ) return args[ i + 1 ];
  return undefined;
}

const explicitOutput = argVal( 'output' );
const nameArg        = argVal( 'name' );
const positional     = args.find( a => !a.startsWith( '-' ) && !a.includes( '=' ) );
const outputPath = explicitOutput
  ?? ( nameArg ? `docs/images/${ nameArg.replace( /\.gif$/i, '' ) }.gif` : undefined )
  ?? ( positional ? `docs/images/${ positional.replace( /\.gif$/i, '' ) }.gif` : undefined )
  ?? 'docs/images/animation.gif';
const scale      = parseInt( argVal( 'scale' ) ?? '30', 10 );
const presetNum  = argVal( 'preset' );
const rawString  = argVal( 'string' );


// ── fetch animation string ─────────────────────────────────────────

async function fetchAnimationString(): Promise<string> {
  if ( rawString ) return rawString;

  const entity = presetNum
    ? `input_text.eleksmaker_gif_preset_${ presetNum }`
    : 'input_text.eleksmaker_gif';

  if ( !HA_URL || !HA_TOKEN ) throw new Error( 'HA_URL and HA_TOKEN required in .env' );

  const res = await fetch( `${ HA_URL }/api/states/${ entity }`, {
    headers: { 'Authorization': `Bearer ${ HA_TOKEN }` },
  });
  if ( !res.ok ) throw new Error( `HA GET ${ entity } failed: ${ res.status }` );
  const data = await res.json() as any;
  return data.state ?? '';
}


// ── decode frames ──────────────────────────────────────────────────

interface Frame {
  matrix: boolean[][];
  circle: boolean[];
  timing: number;
}

const PREFIX_CHARS = 2;

function decode( str: string ): Frame[] {
  const out: Frame[] = [];
  for ( let o = PREFIX_CHARS; o + CHARS_PER_FRAME <= str.length; o += CHARS_PER_FRAME ) {
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
    out.push( { matrix, circle, timing } );
  }
  return out;
}


// ── render frame to PPM buffer ─────────────────────────────────────

/**
 * Low-res canvas 18×18 pixels (scaled by ffmpeg with nearest-neighbor).
 *   Matrix cells are 2×2 pixels → matrix block 14×14 at rows 2-15, cols 2-15.
 *   Border + gap are each 1 px (half of matrix cell) around the matrix:
 *     row 0  = border,  row 1  = gap,  rows 2-15 = matrix,  row 16 = gap,  row 17 = border
 *     cols similarly
 *   LED strips are on the outer border (row 0, row 17, col 0, col 17), 1 px thick.
 *   Each side's 3 LEDs split the 18-px strip into 6 + 6 + 6 segments, where:
 *     outer LEDs span "border + gap + 2 matrix cells" (6 px)
 *     middle LED spans 3 matrix cells (6 px)
 *   Corner pixels are shared between two perpendicular LEDs — the corner lights
 *   up if either adjacent LED is on (OR via paint-if-on).
 */
function renderPPM( f: Frame ): Buffer {
  const CELL = 2;                        // pixels per matrix cell
  const GAP  = CELL / 2;                 // 1 px (half cell)
  const BORD = CELL / 2;                 // 1 px (half cell)
  const MAT  = 7 * CELL;                 // 14 px matrix side
  const W = MAT + 2 * ( GAP + BORD );    // 18 px canvas side
  const H = W;
  const MATRIX_START = BORD + GAP;       // 2 (row/col where matrix starts)

  const ON:  [ number, number, number ] = [ 255, 250, 220 ];
  const OFF: [ number, number, number ] = [ 20, 20, 20 ];

  // pre-fill entire canvas with OFF so gaps and off LEDs blend
  const px = Buffer.alloc( W * H * 3 );
  for ( let i = 0; i < px.length; i += 3 ) {
    px[ i ] = OFF[ 0 ];
    px[ i + 1 ] = OFF[ 1 ];
    px[ i + 2 ] = OFF[ 2 ];
  }

  const set = ( r: number, c: number, color: [ number, number, number ] ) => {
    if ( r < 0 || r >= H || c < 0 || c >= W ) return;
    const i = ( r * W + c ) * 3;
    px[ i ] = color[ 0 ];
    px[ i + 1 ] = color[ 1 ];
    px[ i + 2 ] = color[ 2 ];
  };

  const fillRect = ( r0: number, c0: number, rows: number, cols: number, color: [ number, number, number ] ) => {
    for ( let dr = 0; dr < rows; dr++ ) {
      for ( let dc = 0; dc < cols; dc++ ) {
        set( r0 + dr, c0 + dc, color );
      }
    }
  };

  // matrix cells (each CELL×CELL pixels)
  for ( let r = 0; r < 7; r++ ) {
    for ( let c = 0; c < 7; c++ ) {
      fillRect( MATRIX_START + r * CELL, MATRIX_START + c * CELL, CELL, CELL, f.matrix[ r ][ c ] ? ON : OFF );
    }
  }

  // LED segment boundaries along the 18-px strip:
  //   outer LEDs (0 and 2) span border + gap + 2 cells = 1 + 1 + 4 = 6 px
  //   middle LED (1) spans 3 cells = 6 px
  const SEG_OUTER = BORD + GAP + 2 * CELL; // 6
  const SEG_MID   = 3 * CELL;              // 6
  const SEGS: Array<[ number, number ]> = [
    [ 0,                       SEG_OUTER ],
    [ SEG_OUTER,               SEG_MID ],
    [ SEG_OUTER + SEG_MID,     SEG_OUTER ],
  ];

  // paint LEDs that are lit; shared corners light via OR (painted by either side)
  const paintHoriz = ( row: number, ledIdx: number, seg: number ) => {
    if ( !f.circle[ ledIdx ] ) return;
    const [ start, len ] = SEGS[ seg ];
    for ( let c = start; c < start + len; c++ ) set( row, c, ON );
  };
  const paintVert = ( col: number, ledIdx: number, seg: number ) => {
    if ( !f.circle[ ledIdx ] ) return;
    const [ start, len ] = SEGS[ seg ];
    for ( let r = start; r < start + len; r++ ) set( r, col, ON );
  };

  // top: indices 0, 1, 2 L→R
  for ( let s = 0; s < 3; s++ ) paintHoriz( 0, s, s );

  // bottom: array 6,7,8 is R→L, display L→R uses 8,7,6
  for ( let s = 0; s < 3; s++ ) paintHoriz( H - 1, 8 - s, s );

  // left: array 9,10,11 is B→T, display T→B uses 11,10,9
  for ( let s = 0; s < 3; s++ ) paintVert( 0, 11 - s, s );

  // right: 3,4,5 T→B
  for ( let s = 0; s < 3; s++ ) paintVert( W - 1, 3 + s, s );

  const header = `P6\n${ W } ${ H }\n255\n`;
  return Buffer.concat( [ Buffer.from( header ), px ] );
}


// ── main ───────────────────────────────────────────────────────────

async function main() {
  const str = await fetchAnimationString();
  if ( !str ) throw new Error( 'No animation string found' );

  const frames = decode( str );
  if ( frames.length === 0 ) throw new Error( 'No frames in string' );

  console.log( `Decoded ${ frames.length } frames (${ str.length } chars)` );

  const tempDir = resolve( root, '.tmp-gif-frames' );
  if ( existsSync( tempDir ) ) rmSync( tempDir, { recursive: true } );
  mkdirSync( tempDir, { recursive: true } );

  // emit PPM per 50ms tick; each source frame is duplicated to match its timing
  const BASE_MS = 50;
  let idx = 0;
  for ( const f of frames ) {
    const ms = TIMING_PRESETS[ f.timing ];
    const repeats = Math.max( 1, Math.round( ms / BASE_MS ) );
    const ppm = renderPPM( f );
    for ( let i = 0; i < repeats; i++ ) {
      writeFileSync( join( tempDir, `frame-${ String( idx ).padStart( 5, '0' ) }.ppm` ), ppm );
      idx++;
    }
  }
  console.log( `Wrote ${ idx } PPM frames at ${ BASE_MS }ms each (scale ×${ scale })` );

  // assemble via ffmpeg with palette for good GIF quality
  const outAbs = resolve( root, outputPath );
  mkdirSync( resolve( outAbs, '..' ), { recursive: true } );

  const framerate = 1000 / BASE_MS;
  const vf = `scale=iw*${ scale }:ih*${ scale }:flags=neighbor,split[a][b];[a]palettegen=max_colors=32[p];[b][p]paletteuse=dither=none`;

  const ffmpegCmd = process.env.FFMPEG || getEnv( 'FFMPEG' ) || 'ffmpeg';

  try {
    execSync(
      `"${ ffmpegCmd }" -y -loglevel error -framerate ${ framerate } -i "${ join( tempDir, 'frame-%05d.ppm' ) }" -vf "${ vf }" "${ outAbs }"`,
      { stdio: 'inherit' }
    );
    console.log( `Wrote ${ outputPath }` );
  } finally {
    rmSync( tempDir, { recursive: true, force: true } );
  }
}

main().catch( err => {
  console.error( err.message );
  process.exit( 1 );
});
