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

if ( !HA_URL || !HA_TOKEN ) {
  console.error( 'HA_URL and HA_TOKEN must be set in .env' );
  process.exit( 1 );
}


const CHARS_PER_FRAME = 11;
const PREFIX_CHARS = 2;
const CLEAR_AFTER_BIT = 63n;

const args = process.argv.slice( 2 );
const apply = args.includes( '--apply' );

// which slots to convert (default 1-4)
const slotsArg = args.find( a => a.startsWith( '--slots=' ) );
const slots = slotsArg
  ? slotsArg.split( '=' )[ 1 ].split( ',' ).map( n => parseInt( n, 10 ) ).filter( n => n >= 1 && n <= 10 )
  : [ 1, 2, 3, 4 ];


/**
 * Encode a 12-bit play count as two 6-bit chars (low, high) with 0x30 offset.
 */
function encodePrefix( count: number ): string {
  const n = Math.max( 0, Math.min( 4095, Math.round( count ) ) );
  return String.fromCharCode( ( n & 0x3F ) + 0x30 )
       + String.fromCharCode( ( ( n >> 6 ) & 0x3F ) + 0x30 );
}


/**
 * Convert an old-format animation string (no prefix, clear-after flag in bit
 * 63 of frame 0) to the new format (2-char play count prefix, clear-after
 * bit cleared).
 *
 * If the source had clear-after set, play count becomes 1 (play once). If not,
 * play count is 0 (loop forever — firmware unchanged behaviour).
 */
function convertOldToNew( src: string ): { out: string; clearAfter: boolean } {
  if ( src.length < CHARS_PER_FRAME ) {
    return { out: encodePrefix( 0 ) + src, clearAfter: false };
  }

  // decode frame 0 to read + clear bit 63
  let bits = 0n;
  for ( let i = 0; i < CHARS_PER_FRAME; i++ ) {
    bits |= BigInt( src.charCodeAt( i ) - 0x30 ) << BigInt( i * 6 );
  }
  const clearAfter = ( ( bits >> CLEAR_AFTER_BIT ) & 1n ) === 1n;
  bits &= ~( 1n << CLEAR_AFTER_BIT );

  // re-encode frame 0 without the clear-after bit
  let frame0 = '';
  for ( let i = 0; i < CHARS_PER_FRAME; i++ ) {
    const v = Number( ( bits >> BigInt( i * 6 ) ) & 0x3Fn );
    frame0 += String.fromCharCode( v + 0x30 );
  }

  const rest = src.slice( CHARS_PER_FRAME );
  const playCount = clearAfter ? 1 : 0;
  return { out: encodePrefix( playCount ) + frame0 + rest, clearAfter };
}


/**
 * Determine what format a string is in based on its length modulo CHARS_PER_FRAME.
 */
function detectFormat( s: string ): 'empty' | 'old' | 'new' | 'malformed' {
  if ( s.length === 0 ) return 'empty';
  const mod = s.length % CHARS_PER_FRAME;
  if ( mod === 0 ) return 'old';
  if ( mod === PREFIX_CHARS ) return 'new';
  return 'malformed';
}


async function getState( entity: string ): Promise<string> {
  const res = await fetch( `${ HA_URL }/api/states/${ entity }`, {
    headers: { 'Authorization': `Bearer ${ HA_TOKEN }` },
  });
  if ( !res.ok ) throw new Error( `GET ${ entity } failed: ${ res.status }` );
  const data = await res.json() as any;
  return data.state ?? '';
}


async function setState( entity: string, value: string ): Promise<void> {
  const res = await fetch( `${ HA_URL }/api/services/input_text/set_value`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ HA_TOKEN }`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify( { entity_id: entity, value } ),
  });
  if ( !res.ok ) throw new Error( `set ${ entity } failed: ${ res.status }` );
}


async function main() {
  console.log( `Mode: ${ apply ? 'APPLY' : 'dry-run (pass --apply to commit)' }` );
  console.log( `Slots: ${ slots.join( ', ' ) }\n` );

  for ( const slot of slots ) {
    const entity = `input_text.eleksmaker_gif_preset_${ slot }`;
    const before = await getState( entity );
    const format = detectFormat( before );
    const frames = format === 'old'
      ? before.length / CHARS_PER_FRAME
      : format === 'new'
        ? ( before.length - PREFIX_CHARS ) / CHARS_PER_FRAME
        : 0;

    console.log( `Slot ${ slot } (${ entity })` );
    console.log( `  before: ${ before.length } chars, format=${ format }, frames=${ frames }` );

    if ( format === 'empty' ) {
      console.log( `  skip: empty\n` );
      continue;
    }
    if ( format === 'new' ) {
      console.log( `  skip: already in new format\n` );
      continue;
    }
    if ( format === 'malformed' ) {
      console.log( `  skip: malformed (length % ${ CHARS_PER_FRAME } = ${ before.length % CHARS_PER_FRAME })\n` );
      continue;
    }

    const { out, clearAfter } = convertOldToNew( before );
    console.log( `  clear-after was: ${ clearAfter } → play count = ${ clearAfter ? 1 : 0 }` );
    console.log( `  after:  ${ out.length } chars` );

    if ( apply ) {
      await setState( entity, out );
      console.log( `  ✓ written\n` );
    } else {
      console.log( `  (dry-run, not written)\n` );
    }
  }

  console.log( 'Done.' );
}


main().catch( err => {
  console.error( err.message );
  process.exit( 1 );
});
