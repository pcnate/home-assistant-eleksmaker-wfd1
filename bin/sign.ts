import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { existsSync, readdirSync } from 'node:fs';
import { platform } from 'node:os';


const pfxPath = process.env.CODESIGN_PFX || resolve( __dirname, '..', 'build', 'codesign.pfx' );
const password = process.env.CODESIGN_PASSWORD;

if ( !password ) {
  console.error( 'CODESIGN_PASSWORD env var is required' );
  process.exit( 1 );
}

/**
 * Find signtool.exe in the Windows SDK.
 */
function findSignTool(): string {
  const kitRoot = 'C:\\Program Files (x86)\\Windows Kits\\10\\bin';
  if ( !existsSync( kitRoot ) ) return 'signtool';

  const versions = readdirSync( kitRoot )
    .filter( d => d.match( /^10\./ ) )
    .sort()
    .reverse();

  for ( const ver of versions ) {
    const p = resolve( kitRoot, ver, 'x64', 'signtool.exe' );
    if ( existsSync( p ) ) return `"${ p }"`;
  }
  return 'signtool';
}

const signtool = findSignTool();

if ( !existsSync( pfxPath ) ) {
  console.error( `Certificate not found: ${ pfxPath }` );
  process.exit( 1 );
}

const files = [
  resolve( __dirname, '..', 'dist', 'eleks-monitor.exe' ),
  resolve( __dirname, '..', 'dist', 'eleks-tray.exe' ),
  resolve( __dirname, '..', 'dist', 'EleksWFD-Monitor-Setup.exe' ),
].filter( f => existsSync( f ) );

if ( files.length === 0 ) {
  console.error( 'No files to sign. Run build and create-installer first.' );
  process.exit( 1 );
}

for ( const file of files ) {
  console.log( `Signing: ${ file }` );
  execSync(
    `${ signtool } sign /fd SHA256 /f "${ pfxPath }" /p "${ password }" /t http://timestamp.digicert.com "${ file }"`,
    { stdio: 'inherit' }
  );
}

console.log( `=== Signed ${ files.length } file(s) ===` );
