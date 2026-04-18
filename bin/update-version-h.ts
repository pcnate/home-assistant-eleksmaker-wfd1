import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';


const root = resolve( __dirname, '..' );
const pkg = JSON.parse( readFileSync( resolve( root, 'package.json' ), 'utf-8' ) );
const version: string = pkg.version;

if ( !version ) {
  console.error( 'No version found in package.json' );
  process.exit( 1 );
}

const content = `#pragma once

// Version string; updated automatically by semantic-release on each release.
// Do not hand-edit — changes here will be overwritten by CI.
#define ELEKSWFD_VERSION "${ version }"
`;

const target = resolve( root, 'components/elekswfd/version.h' );
writeFileSync( target, content );
console.log( `Updated version.h -> ${ version }` );
