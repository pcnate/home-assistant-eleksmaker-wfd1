import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';


const root = resolve( __dirname, '..' );
const envFile = resolve( root, '.env' );
const firmware = resolve( root, '.esphome/build/eleksmaker-home/.pioenvs/eleksmaker-home/firmware.ota.bin' );

/** load .env and pull the device IP */
const env = readFileSync( envFile, 'utf-8' );
const match = env.match( /^ESPHOME_DEVICE_IP=(.+)$/m );

if ( !match ) {
  console.error( 'ESPHOME_DEVICE_IP not found in .env' );
  process.exit( 1 );
}

const ip = match[ 1 ].trim();
const url = `http://${ ip }/update`;

console.log( `=== Uploading firmware to ${ ip } ===` );
execSync( `curl -X POST -F "update=@${ firmware }" ${ url }`, { stdio: 'inherit', cwd: root } );
console.log( '=== Upload complete ===' );
