import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';


const root = resolve( __dirname, '..' );
const envFile = resolve( root, '.env' );
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
const text = process.argv.slice( 2 ).join( ' ' );

if ( !text ) {
  console.error( 'Usage: npm run set:upper -- YOUR TEXT HERE' );
  process.exit( 1 );
}

async function main() {
  const res = await fetch( `${ HA_URL }/api/states/input_text.eleksmaker_upper`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ HA_TOKEN }`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      state: text,
      attributes: { friendly_name: 'EleksMaker Upper', icon: 'mdi:format-text', min: 0, max: 255 },
    }),
  });

  if ( !res.ok ) throw new Error( `HA POST failed: ${ res.status }` );
  console.log( `Upper text set: "${ text }"` );
}

main().catch( ( err ) => {
  console.error( err.message );
  process.exit( 1 );
});
