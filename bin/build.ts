import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';


const root = resolve( __dirname, '..' );
const dist = resolve( root, 'dist' );

mkdirSync( dist, { recursive: true } );

console.log( '=== Building in Docker ===' );
execSync( `docker build -t eleks-rust -f build/Dockerfile .`, { stdio: 'inherit', cwd: root } );

console.log( '=== Extracting binaries ===' );
execSync( `docker run --rm -v "${ dist }:/host" eleks-rust cp /out/eleks-monitor.exe /out/eleks-tray.exe /host/`, { stdio: 'inherit' } );

console.log( '=== Done ===' );
console.log( `  ${ dist }\\eleks-monitor.exe` );
console.log( `  ${ dist }\\eleks-tray.exe` );
