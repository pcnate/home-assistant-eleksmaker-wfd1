import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { request as httpRequest } from 'node:http';


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
const wsUrl = HA_URL.replace( /^http/, 'ws' ) + '/api/websocket';


/**
 * Send a WebSocket message and wait for a response matching the given id.
 */
function wsSend( ws: WebSocket, msg: Record<string, any> ): Promise<any> {
  return new Promise( ( resolve, reject ) => {
    const handler = ( event: MessageEvent ) => {
      const data = JSON.parse( event.data );
      if ( data.id === msg.id ) {
        ws.removeEventListener( 'message', handler );
        if ( data.success === false ) {
          reject( new Error( data.error?.message || 'WS call failed' ) );
        } else {
          resolve( data );
        }
      }
    };
    ws.addEventListener( 'message', handler );
    ws.send( JSON.stringify( msg ) );
  });
}


/**
 * Create a persistent HA helper via the WebSocket API.
 */
async function createHelper( ws: WebSocket, id: number, type: string, config: Record<string, any> ): Promise<boolean> {
  try {
    await wsSend( ws, { id, type: `${ type }/create`, ...config } );
    console.log( `  Created ${ type }: ${ config.name }` );
    return true;
  } catch ( err: any ) {
    if ( err.message?.includes( 'already' ) ) {
      console.log( `  Exists: ${ config.name }` );
      return false;
    }
    throw err;
  }
}


/**
 * Delete a helper by its entity_id.
 */
async function deleteHelper( ws: WebSocket, id: number, type: string, helperId: string ): Promise<void> {
  try {
    await wsSend( ws, { id, type: `${ type }/delete`, [ `${ type }_id` ]: helperId } );
    console.log( `  Deleted ${ type }: ${ helperId }` );
  } catch ( err: any ) {
    // ignore if not found
  }
}


async function main() {
  const WebSocketClass = globalThis.WebSocket;
  if ( !WebSocketClass ) {
    console.error( 'WebSocket not available. Need Node 22+.' );
    process.exit( 1 );
  }

  const ws = new WebSocketClass( wsUrl );

  await new Promise<void>( ( resolve, reject ) => {
    const onMsg = ( event: MessageEvent ) => {
      const data = JSON.parse( event.data );
      if ( data.type === 'auth_required' ) {
        ws.send( JSON.stringify( { type: 'auth', access_token: HA_TOKEN } ) );
      } else if ( data.type === 'auth_ok' ) {
        ws.removeEventListener( 'message', onMsg );
        resolve();
      } else if ( data.type === 'auth_invalid' ) {
        reject( new Error( 'Auth failed' ) );
      }
    };
    ws.addEventListener( 'message', onMsg );
    ws.addEventListener( 'error', () => reject( new Error( 'WebSocket error' ) ) );
  });

  console.log( '=== Cleaning up old _2 helpers ===' );
  let id = 1;
  await deleteHelper( ws, id++, 'input_text', 'eleksmaker_gif_2' );
  await deleteHelper( ws, id++, 'input_text', 'eleksmaker_logo_2' );
  await deleteHelper( ws, id++, 'input_text', 'eleksmaker_upper_2' );
  await deleteHelper( ws, id++, 'input_text', 'eleksmaker_lower_2' );
  await deleteHelper( ws, id++, 'input_boolean', 'eleksmaker_logo_flicker_2' );

  // deprecated helpers — remove old versions if they exist
  console.log( '=== Removing deprecated helpers ===' );
  await deleteHelper( ws, id++, 'input_boolean', 'eleksmaker_logo_flicker' );
  await deleteHelper( ws, id++, 'input_boolean', 'eleksmaker_gif_clear_after' );

  console.log( '=== Creating persistent HA helpers ===' );
  await createHelper( ws, id++, 'input_text', { name: 'EleksMaker GIF', min: 0, max: 255, icon: 'mdi:animation' } );
  await createHelper( ws, id++, 'input_text', { name: 'EleksMaker Logo', min: 0, max: 255, icon: 'mdi:led-on' } );
  await createHelper( ws, id++, 'input_text', { name: 'EleksMaker Upper', min: 0, max: 255, icon: 'mdi:format-text' } );
  await createHelper( ws, id++, 'input_text', { name: 'EleksMaker Lower', min: 0, max: 255, icon: 'mdi:clock-digital' } );
  await createHelper( ws, id++, 'input_number', {
    name: 'EleksMaker Logo Flicker',
    icon: 'mdi:flash',
    min: 0,
    max: 100,
    step: 1,
    initial: 0,
    unit_of_measurement: 'Hz',
    mode: 'slider',
  });
  await createHelper( ws, id++, 'input_number', {
    name: 'EleksMaker GIF Play Count',
    icon: 'mdi:counter',
    min: 0,
    max: 100,
    step: 1,
    initial: 0,
    mode: 'box',
  });

  for ( let slot = 1; slot <= 10; slot++ ) {
    await createHelper( ws, id++, 'input_text', {
      name: `EleksMaker GIF Preset ${ slot }`,
      min: 0,
      max: 255,
      icon: 'mdi:content-save',
    });
  }

  console.log( '=== Done ===' );
  ws.close();
}

main().catch( ( err ) => {
  console.error( err.message );
  process.exit( 1 );
});
