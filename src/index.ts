import * as net from 'node:net';
import * as wmi from 'node-wmi';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as blessed from 'blessed';
import * as dotenv from 'dotenv';
// import mic from 'mic';
// import * as stream from 'stream'

dotenv.config();

const args = process.argv.slice( 2 );
const daemonMode = args.includes( '-d' ) || args.includes( '--daemon' );

const MACHINE_NAME = process.env.MACHINE_NAME || os.hostname().toLowerCase().replace( /\s+/g, '_' );
const HA_URL = process.env.HA_URL || 'http://localhost:8123/api/states/';
const HA_TOKEN = process.env.HA_TOKEN || '';
const ELEKSWFD_ADDR = process.env.ELEKSWFD_ADDR || '127.0.0.1';
const ELEKSWFD_PORT = parseInt( process.env.ELEKSWFD_PORT || '5555', 10 );

var client: net.Socket|undefined;

interface X {
  PBATTCHR: "Battery Charge Rate",
  SBATTLVL: "Battery Level",
  SBATT: "Battery Status",
  SBATTWEARLVL: "Battery Wear Level",
  VBATT: "Battery Voltage",

  TCPU: "CPU Temperature",
  SCPUCLK: "CPU Clock",
  SCPUFSB: "CPU FSB",
  SCPUMUL: "CPU Multiplier",
  SCPUUTI: "CPU Utilization",

  SDSK1ACT: "Disk 1 Activity",
  SDSK1READ: "Disk 1 Read Speed",
  SDSK1WRITE: "Disk 1 Write Speed",

  TGPU1: "GPU1 Temperature",
  TGPU1HOT: "GPU Hot Temperature",
  SGPU1UTI: "GPU1 Utilization",

  SMASTVOL: "Master Volume",

  SMEMUTI: "Memory Utilization",
  SPWRSTATE: "Power State",
}

enum AIDA64_SensorValues {
  battery_charge_rate = 'PBATTCHR',
  battery_perc = 'SBATTLVL',
  battery = 'SBATT',
  battery_wear_level = 'SBATTWEARLVL',
  battery_volt = 'VBATT',

  cpu_temp = 'TCPU',
  cpu_clock = 'SCPUCLK',
  cpu_fsb = 'SCPUFSB',
  cpu_multiplier = 'SCPUMUL',
  cpu_usage = 'SCPUUTI',

  disk_activity = 'SDSK1ACT',
  disk_read_speed = 'SDSK1READSPD',
  disk_write_speed = 'SDSK1WRITESPD',

  gpu_temp = 'TGPU1',
  gpu_temp_hot = 'TGPU1HOT', // not used but overwrites gpu_temp if higher
  gpu_usage = 'SGPU1UTI',

  master_volume = 'SMASTVOL',
  ram_usage = 'SMEMUTI',
  power_state = 'SPWRSTATE',
}

// reverse lookup for AIDA64_SensorValues
enum AIDA64_SensorValues_Reverse {
  PBATTCHR = 'battery_charge_rate',
  SBATTLVL = 'battery_perc',
  SBATT = 'battery',
  SBATTWEARLVL = 'battery_wear_level',
  VBATT = 'battery_volt',

  TCPU = 'cpu_temp',
  SCPUCLK = 'cpu_clock',
  SCPUFSB = 'cpu_fsb',
  SCPUMUL = 'cpu_multiplier',
  SCPUUTI = 'cpu_usage',

  SDSK1ACT = 'disk_activity',
  SDSK1READ = 'disk_read_speed',
  SDSK1WRITE = 'disk_write_speed',

  SGPU1UTI = 'gpu_usage',
  TGPU1 = 'gpu_temp',

  SMASTVOL = 'master_volume',
  SMEMUTI = 'ram_usage',
  SPWRSTATE = 'power_state',
}

// description for both the enum and the reverse lookup
enum AIDA64_SensorValues_Descriptions {
  battery_charge_rate = 'Battery Charge Rate',
  PBATTCHR = 'Battery Charge Rate',
  battery_perc = 'Battery Percentage',
  SBATTLVL = 'Battery Percentage',
  battery = 'Battery Status',
  SBATT = 'Battery Status',
  battery_wear_level = 'Battery Wear Level',
  SBATTWEARLVL = 'Battery Wear Level',
  battery_volt = 'Battery Voltage',
  VBATT = 'Battery Voltage',

  cpu_temp = 'CPU Temperature',
  TCPU = 'CPU Temperature',
  cpu_clock = 'CPU Clock',
  SCPUCLK = 'CPU Clock',
  cpu_fsb = 'CPU FSB',
  SCPUFSB = 'CPU FSB',
  cpu_multiplier = 'CPU Multiplier',
  SCPUMUL = 'CPU Multiplier',
  cpu_usage = 'CPU Usage',
  SCPUUTI = 'GPU Usage',

  gpu_usage = 'GPU Usage',
  SGPU1UTI = 'GPU Usage',
  gpu_temp = 'GPU Temperature',
  TGPU1 = 'GPU Temperature',
  
  disk_activity = 'Disk Activity',
  SDSK1ACT = 'Disk Activity',
  disk_read_speed = 'Disk Read Speed',
  SDSK1READ = 'Disk Read Speed',
  disk_write_speed = 'Disk Write Speed',
  SDSK1WRITE = 'Disk Write Speed',
  
  master_volume = 'Master Volume',
  SMASTVOL = 'Master Volume',
  ram_usage = 'RAM Usage',
  SMEMUTI = 'RAM Usage',
  power_state = 'Power State',
  SPWRSTATE = 'Power State',
}

interface AIDA64_SensorValue {
  battery_charge_rate: number,
  battery_perc: number,
  battery: number,
  battery_wear_level: number,
  battery_volt: number,
  
  cpu_temp: number,
  cpu_clock: number,
  cpu_fsb: number,
  cpu_multiplier: number,
  cpu_usage: number,

  gpu_usage: number,
  gpu_temp: number,
  
  disk_activity: number,
  disk_read_speed: number,
  disk_write_speed: number,
  
  master_volume: number,
  ram_usage: number,
  power_state: string,

  connected: 0 | 1,
}

// PBATTCHR        Battery Charge Rate            P           0.00
// SBATTWEARLVL    Battery Wear Level             S              0
// SBATT           Battery                        S        AC Line

// SCPUMUL         CPU Multiplier                 S             38
// SCPUFSB         CPU FSB                        S            100
// SCPUCLK         CPU Clock                      S           3791

// SMASTVOL        Master Volume                  S             57

const previousPayload: AIDA64_SensorValue = {
  battery_perc: 0,
  battery_volt: 0,
  battery_wear_level: 0,
  battery_charge_rate: 0,
  battery: 0,

  cpu_usage: 0,
  cpu_temp: 0,
  cpu_multiplier: 0,
  cpu_fsb: 0,
  cpu_clock: 0,

  gpu_usage: 0,
  gpu_temp: 0,

  disk_activity: 0,
  disk_read_speed: 0,
  disk_write_speed: 0,

  master_volume: 0,
  ram_usage: 0,
  power_state: '',

  connected: 0,
}

let fileWritten = false;
let max_cpu_clock = 1;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${ HA_TOKEN }`,
  'User-Agent': 'Home Assistant/ NodeJS Windows System Monitor (Android App',
}


// const micInstance = mic({
//   rate: '16000',
//   channels: '1',
//   debug: true,
//   exitOnSilence: 6,
// });

// const micInputStream = micInstance.getAudioStream();

// micInputStream.on('data', function(data: Buffer) {
//   let sum = 0;
//   for (let i = 0; i < data.length; i++) {
//     sum += data[i] * data[i];
//   }
//   let rms = Math.sqrt(sum / data.length);
//   let db = 20 * Math.log10( rms || 0.0001 );
//   console.log( `Mic level: ${ db.toFixed(2) }` );
// });

// micInstance.start();

/**
 * harvest the data from the microphone and speanker then send it over the socket (if connected)
 */
async function readSound() {

}

/**
 * harvest the data from AIDA64 and send it over the socket (if connected)
 */
async function readSystemData() {
  if ( !client ) {
    // await createConnection();
  }

  const data: { ID: string, Label: string, Type: string, Value: string }[]|undefined = await new Promise( resolve => {
    wmi.Query({
      namespace: 'Root\\WMI',
      class: 'AIDA64_SensorValues',
      host: 'localhost',
    }, ( err: any, _data: any ) => {
      if ( err ) {
        log( 'error, no data, is AIDA64 running?' );
        return resolve( undefined );
      }
      resolve( _data );
    });
  })
  
  const payload: AIDA64_SensorValue = {
    battery_perc: 0,
    battery_volt: 0,
    battery_wear_level: 0,
    battery_charge_rate: 0,
    battery: 0,

    cpu_usage: 0,
    cpu_temp: 0,
    cpu_multiplier: 0,
    cpu_fsb: 0,
    cpu_clock: 0,

    gpu_usage: 0,
    gpu_temp: 0,

    disk_activity: 0,
    disk_read_speed: 0,
    disk_write_speed: 0,

    master_volume: 0,
    ram_usage: 0,
    power_state: '',

    connected: 0,
  }

  if ( !!data ) {
    if ( fileWritten === false ) {
      const sorted = data.sort( ( a, b ) => a.Label.localeCompare( b.Label ) );
      // fs.writeFileSync( 'sensors.json', JSON.stringify( sorted, null, 2 ) );
      fileWritten = true;
    }
    for ( const sensor of data ) {
      switch ( sensor.ID ) {
        case AIDA64_SensorValues.battery_charge_rate:
          payload.battery_charge_rate = Number( sensor.Value );
          break;
        case AIDA64_SensorValues.battery_perc:
          payload.battery_perc = Number( sensor.Value );
          break;
        case AIDA64_SensorValues.battery:
          payload.battery = Number( sensor.Value );
          break;
        case AIDA64_SensorValues.battery_wear_level:
          payload.battery_wear_level = Number( sensor.Value );
          break;
        case AIDA64_SensorValues.battery_volt:
          payload.battery_volt = Number( sensor.Value );
          break;

        case AIDA64_SensorValues.cpu_temp:
          payload.cpu_temp = Number( sensor.Value );
          break;
        case AIDA64_SensorValues.cpu_clock:
          const cpu_clock_val = Number( sensor.Value );
          if ( cpu_clock_val > max_cpu_clock )
            max_cpu_clock = cpu_clock_val;
          payload.cpu_clock = Number( ( ( cpu_clock_val / max_cpu_clock ) * 100 ).toFixed( 2 ) );
          break;
        case AIDA64_SensorValues.cpu_fsb:
          payload.cpu_fsb = Number( sensor.Value );
          break;
        case AIDA64_SensorValues.cpu_multiplier:
          payload.cpu_multiplier = Number( sensor.Value );
          break;
        case AIDA64_SensorValues.cpu_usage:
          const cpu_usage_val = Number( sensor.Value );
          payload.cpu_usage = cpu_usage_val > 100 ? 100 : cpu_usage_val;
          break;

        case AIDA64_SensorValues.disk_activity:
          payload.disk_activity = Number( sensor.Value );
          break;
        case AIDA64_SensorValues.disk_read_speed:
          payload.disk_read_speed = Number( sensor.Value );
          break;
        case AIDA64_SensorValues.disk_write_speed:
          payload.disk_write_speed = Number( sensor.Value );
          break;

        case AIDA64_SensorValues.gpu_temp:
        case AIDA64_SensorValues.gpu_temp_hot:
          const gpu_temp_val = Number( sensor.Value );
          if ( gpu_temp_val > payload.gpu_temp )
            payload.gpu_temp = gpu_temp_val;
          break;
        case AIDA64_SensorValues.gpu_usage:
          const gpu_usage_val = Number( sensor.Value );
          payload.gpu_usage = gpu_usage_val > 100 ? 100 : gpu_usage_val;
          break;

        case AIDA64_SensorValues.master_volume:
          payload.master_volume = Number( sensor.Value );
          break;
        case AIDA64_SensorValues.ram_usage:
          const ram_usage_val = Number( sensor.Value );
          payload.ram_usage = ram_usage_val > 100 ? 100 : ram_usage_val;
          break;
        case AIDA64_SensorValues.power_state:
          payload.power_state = sensor.Value;
          break;
        default:
          log( `Unknown sensor: ${ sensor.ID } - ${ sensor.Label } - ${ sensor.Type } - ${ sensor.Value }` );
          break;
      }

      // if ( sensor.ID === AIDA64_SensorValues.gpu_usage ) {
      //   payload.gpu_usage = Number( sensor.Value );
      // } else if ( sensor.ID === AIDA64_SensorValues.cpu_usage ) {
      //   payload.cpu_usage = Number( sensor.Value );
      // } else if ( sensor.ID === AIDA64_SensorValues.ram_usage ) {
      //   payload.ram_usage = Number( sensor.Value );
      // } else if ( sensor.ID === AIDA64_SensorValues.cpu_temp ) {
      //   payload.cpu_temp = Number( sensor.Value );
      // } else if ( sensor.ID === AIDA64_SensorValues.power_state ) {
      //   payload.power_state = sensor.Value;
      // } else if ( sensor.ID === AIDA64_SensorValues.battery_perc ) {
      //   payload.battery_perc = Number( sensor.Value );
      // } else if ( sensor.ID === AIDA64_SensorValues.gpu_temp_hot ) {
      //   const val = Number( sensor.Value );
      //   if ( val > payload.gpu_temp )
      //     payload.gpu_temp = val;
      // } else if ( sensor.ID === AIDA64_SensorValues.gpu_temp ) {
      //   const val = Number( sensor.Value );
      //   if ( val > payload.gpu_temp )
      //     payload.gpu_temp = val;
      // } else if ( sensor.ID === AIDA64_SensorValues.battery_volt ) {
      //   payload.battery_volt = Number( sensor.Value );
      // } else if ( sensor.ID === AIDA64_SensorValues.disk_activity ) {
      //   payload.disk_activity = Number( sensor.Value );
      // } else if ( sensor.ID === AIDA64_SensorValues.disk_write_speed ) {
      //   payload.disk_write_speed = Number( sensor.Value );
      // } else if ( sensor.ID === AIDA64_SensorValues.disk_read_speed ) {
      //   payload.disk_read_speed = Number( sensor.Value );
      // } else {
      //   console.log( `${ sensor.ID.padEnd( 15, ' ' ) } ${ sensor.Label.padEnd( 30, ' ' ) } ${ sensor.Type.padEnd( 5, ' ' ) } ${ sensor.Value.padStart( 10, ' ' ) }` );
      // }
    }
  }

  // if ( payload.gpu_temp < 1 ) payload.gpu_temp = previousPayload.gpu_temp;
  // if ( payload.cpu_temp < 1 ) payload.cpu_temp = previousPayload.cpu_temp;
  // if ( payload.cpu_usage < 1 ) payload.cpu_usage = previousPayload.cpu_usage;
  // if ( payload.gpu_usage < 1 ) payload.gpu_usage = previousPayload.gpu_usage;
  // if ( payload.ram_usage < 1 ) payload.ram_usage = previousPayload.ram_usage;
  // if ( payload.cpu_usage > 100 ) payload.cpu_usage = 100;
  // if ( payload.gpu_usage > 100 ) payload.gpu_usage = 100;
  // if ( payload.ram_usage > 100 ) payload.ram_usage = 100;
  // if ( payload.battery_perc < 1 ) payload.battery_perc = previousPayload.battery_perc;
  // if ( payload.battery_volt < 1 ) payload.battery_volt = previousPayload.battery_volt
  // if ( payload.power_state === '' ) payload.power_state = previousPayload.power_state;

  const p: Promise<any>[] = [];

  if ( payload.cpu_usage !== previousPayload.cpu_usage ) {
    previousPayload.cpu_usage = payload.cpu_usage;
    log( `Updating ${'cpu_usage'.padEnd(18, ' ' ) } ${ payload.cpu_usage?.toString().padStart( 10, ' ')}` );
    p.push( fetch( HA_URL +`sensor.${ MACHINE_NAME }_cpu_usage`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ state: payload.cpu_usage, attributes: { unit_of_measurement: '%', friendly_name: 'CPU Usage', } }),
    }).catch( ( e ) => log( `Error: ${ e }` ) ).then( () => {} ) );
  }
  if ( payload.cpu_clock !== previousPayload.cpu_clock ) {
    previousPayload.cpu_clock = payload.cpu_clock;
    log( `Updating ${'cpu_clock'.padEnd(18, ' ' ) } ${ payload.cpu_clock.toFixed(2).toString().padStart( 10, ' ')}` );
    p.push( fetch( HA_URL +`sensor.${ MACHINE_NAME }_cpu_clock`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ id: `sensor.${ MACHINE_NAME }_cpu_clock`, state: payload.cpu_clock, attributes: { unit_of_measurement: '%', friendly_name: 'Max CPU Clock', } }),
    }).catch( ( e ) => log( `Error: ${ e }` ) ).then( () => {} ) );
  }
  if ( payload.cpu_temp !== previousPayload.cpu_temp ) {
    previousPayload.cpu_temp = payload.cpu_temp;
    log( `Updating ${'cpu_temp'.padEnd(18, ' ' ) } ${ payload.cpu_temp?.toString().padStart( 10, ' ')}` );
    p.push( fetch( HA_URL +`sensor.${ MACHINE_NAME }_cpu_temp`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ state: payload.cpu_temp, attributes: { unit_of_measurement: '°C', friendly_name: 'CPU Temp', } }),
    }).catch( ( e ) => log( `Error: ${ e }` ) ).then( () => {} ) );
  }
  if ( payload.gpu_usage !== previousPayload.gpu_usage ) {
    previousPayload.gpu_usage = payload.gpu_usage;
    log( `Updating ${'gpu_usage'.padEnd(18, ' ' ) } ${ payload.gpu_usage?.toString().padStart( 10, ' ')}` );
    p.push( fetch( HA_URL +`sensor.${ MACHINE_NAME }_gpu_usage`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ state: payload.gpu_usage, attributes: { unit_of_measurement: '%', friendly_name: 'GPU Usage', } }),
    }).catch( ( e ) => log( `Error: ${ e }` ) ).then( () => {} ) );
  }
  if ( payload.gpu_temp !== previousPayload.gpu_temp ) {
    previousPayload.gpu_temp = payload.gpu_temp;
    log( `Updating ${'gpu_temp'.padEnd(18, ' ' ) } ${ payload.gpu_temp?.toString().padStart( 10, ' ')}` );
    p.push( fetch( HA_URL +`sensor.${ MACHINE_NAME }_gpu_temp`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ state: payload.gpu_temp, attributes: { unit_of_measurement: '°C', friendly_name: 'GPU Temp', } }),
    }).catch( ( e ) => log( `Error: ${ e }` ) ).then( () => {} ) );
  }
  if ( payload.ram_usage !== previousPayload.ram_usage ) {
    previousPayload.ram_usage = payload.ram_usage;
    log( `Updating ${'ram_usage'.padEnd(18, ' ' ) } ${ payload.ram_usage?.toString().padStart( 10, ' ')}` );
    p.push( fetch( HA_URL +`sensor.${ MACHINE_NAME }_ram_usage`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ state: payload.ram_usage, attributes: { unit_of_measurement: '%', friendly_name: 'RAM Usage', } }),
    }).catch( ( e ) => log( `Error: ${ e }` ) ).then( () => {} ) );
  }
  if ( payload.power_state !== previousPayload.power_state ) {
    previousPayload.power_state = payload.power_state;
    log( `Updating ${'power_state'.padEnd(18, ' ' ) } ${ payload.power_state?.toString().padStart( 10, ' ')}` );
    p.push( fetch( HA_URL +`sensor.${ MACHINE_NAME }_power_state`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ state: payload.power_state, attributes: { friendly_name: 'Power State', } }),
    }).catch( ( e ) => log( `Error: ${ e }` ) ).then( () => {} ) );
  }
  if ( payload.battery_perc !== previousPayload.battery_perc ) {
    previousPayload.battery_perc = payload.battery_perc;
    log( `Updating ${'battery_perc'.padEnd(18, ' ' ) } ${ payload.battery_perc?.toString().padStart( 10, ' ')}` );
    p.push( fetch( HA_URL +`sensor.${ MACHINE_NAME }_battery_perc`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ state: payload.battery_perc, attributes: { unit_of_measurement: '%', friendly_name: 'Battery Percentage', } }),
    }).catch( ( e ) => log( `Error: ${ e }` ) ).then( () => {} ) );
  }
  if ( payload.battery_volt !== previousPayload.battery_volt ) {
    previousPayload.battery_volt = payload.battery_volt;
    log( `Updating ${'battery_volt'.padEnd(18, ' ' ) } ${ payload.battery_volt?.toString().padStart( 10, ' ')}` );
    p.push( fetch( HA_URL +`sensor.${ MACHINE_NAME }_battery_volt`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ state: payload.battery_volt, attributes: { unit_of_measurement: 'V', friendly_name: 'Battery Voltage', } }),
    }).catch( ( e ) => log( `Error: ${ e }` ) ).then( () => {} ) );
  }


  if ( payload.disk_activity !== previousPayload.disk_activity ) {
    previousPayload.disk_activity = payload.disk_activity;
    log( `Updating ${'disk_activity'.padEnd( 18, ' ' )} ${ payload.disk_activity?.toString().padStart( 10, ' ' ) }` );
    p.push( fetch( HA_URL +`sensor.${ MACHINE_NAME }_disk_activity`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify( { state: payload.disk_activity, attributes: { unit_of_measurement: '%', friendly_name: 'Disk Activity', } } ),
    } ).catch( ( e ) => log( `Error: ${ e }` ) ).then( () => { } ) );
  }

  if ( payload.disk_write_speed !== previousPayload.disk_write_speed ) {
    previousPayload.disk_write_speed = payload.disk_write_speed;
    log( `Updating ${'disk_write_speed'.padEnd( 18, ' ' )} ${ payload.disk_write_speed?.toString().padStart( 10, ' ' ) }` );
    p.push( fetch( HA_URL +`sensor.${ MACHINE_NAME }_disk_write_speed`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify( { state: payload.disk_write_speed, attributes: { unit_of_measurement: 'MB/s', friendly_name: 'Disk Write Speed', } } ),
    } ).catch( ( e ) => log( `Error: ${ e }` ) ).then( () => { } ) );
  }

  if ( payload.disk_read_speed !== previousPayload.disk_read_speed ) {
    previousPayload.disk_read_speed = payload.disk_read_speed;
    log( `Updating ${'disk_read_speed'.padEnd( 18, ' ' )} ${ payload.disk_read_speed?.toString().padStart( 10, ' ' ) }` );
    p.push( fetch( HA_URL +`sensor.${ MACHINE_NAME }_disk_read_speed`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify( { state: payload.disk_read_speed, attributes: { unit_of_measurement: 'MB/s', friendly_name: 'Disk Read Speed', } } ),
    } ).catch( ( e ) => log( `Error: ${ e }` ) ).then( () => { } ) );
  }

  if ( payload.connected !== previousPayload.connected ) {
    previousPayload.connected = payload.connected;
    log( `Updating ${'connection_status'.padEnd(18, ' ' ) } ${ payload.connected?.toString().padStart( 10, ' ')}` );
    p.push( fetch( HA_URL +`sensor.${ MACHINE_NAME }_connected`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ state: payload.connected, attributes: { friendly_name: 'BLA Nate T1D3L Connected', } }),
    }).catch( ( e ) => log( `Error: ${ e }` ) ).then( () => {} ) );
  }

  await Promise.all( p );

}

/**
 * create a connection to the elekswfd
 */
async function createConnection() {
  if ( !client ) {
    client = net.createConnection({ host: ELEKSWFD_ADDR, port: ELEKSWFD_PORT }, () => {
      log( 'Connected to elekswfd' );
    });

    client.on( 'data', ( data ) => {
      log( data.toString() );
    });

    client.on( 'end', () => {
      log( 'Disconnected from elekswfd' );
      client = undefined;
    });

    client.on( 'error', ( err ) => {
      log( `Connection error: ${ err }` );
      client = undefined;
    });

    client.on( 'close', () => {
      log( 'Connection closed' );
      client = undefined;
    });

    client.on( 'timeout', () => {
      log( 'Connection timed out' );
      client = undefined;
    });
  }
}

/**
 * Log a message - in daemon mode logs to console, in TUI mode updates the log box.
 */
function log( message: string ) {
  if ( daemonMode ) {
    console.log( message );
  } else if ( logBox ) {
    const visibleLines = ( logBox.height as number ) - 2; // subtract 2 for border
    logBox.pushLine( message );
    while ( logBox.getLines().length > visibleLines ) {
      logBox.shiftLine( 0 );
    }
  }
}


let screen: blessed.Widgets.Screen | null = null;
let logBox: blessed.Widgets.Log | null = null;
let statsBox: blessed.Widgets.BoxElement | null = null;
let footerBox: blessed.Widgets.BoxElement | null = null;
let settingsBox: blessed.Widgets.BoxElement | null = null;
let intervalInput: blessed.Widgets.TextboxElement | null = null;

let paused = false;
let refreshInterval = 333;
let settingsOpen = false;


/**
 * Create the TUI screen and widgets.
 */
function createTUI() {
  screen = blessed.screen({
    smartCSR: true,
    title: 'System Monitor - AIDA64',
    cursor: {
      artificial: true,
      blink: false,
      shape: 'block',
      color: 'black',
    },
  });

  screen.program.hideCursor();

  // Header - left side only
  blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '50%',
    height: 3,
    content: '{center}{bold}System Monitor - AIDA64{/bold}{/center}',
    tags: true,
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      fg: 'white',
    },
  });

  // Connection info box - left side, below header, fixed height
  blessed.box({
    parent: screen,
    top: 3,
    left: 0,
    width: '50%',
    height: 4,
    label: ' Connection ',
    border: { type: 'line' },
    tags: true,
    content: `{yellow-fg}Machine:{/yellow-fg} ${ MACHINE_NAME }\n{yellow-fg}HA URL:{/yellow-fg} ${ HA_URL.replace( /^https?:\/\//, '' ) }`,
    style: {
      border: { fg: 'yellow' },
      fg: 'white',
    },
  });

  // Log box - left side, fills remaining space
  logBox = blessed.log({
    parent: screen,
    top: 7,
    left: 0,
    width: '50%',
    height: '100%-8',
    label: ' Log ',
    border: { type: 'line' },
    tags: true,
    style: {
      border: { fg: 'blue' },
      fg: 'white',
    },
  });

  // Stats display box - right side, full height minus footer
  statsBox = blessed.box({
    parent: screen,
    top: 0,
    left: '50%',
    width: '50%',
    height: '100%-1',
    label: ' Sensor Data ',
    border: { type: 'line' },
    tags: true,
    style: {
      border: { fg: 'green' },
      fg: 'white',
    },
  });

  // Footer with instructions and status
  footerBox = blessed.box({
    parent: screen,
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    content: '',
    tags: true,
    style: {
      fg: 'black',
      bg: 'white',
    },
  });
  updateFooter();

  // Settings modal (hidden by default)
  settingsBox = blessed.box({
    parent: screen,
    top: 'center',
    left: 'center',
    width: 40,
    height: 7,
    label: ' Settings ',
    border: { type: 'line' },
    tags: true,
    hidden: true,
    style: {
      border: { fg: 'yellow' },
      fg: 'white',
      bg: 'black',
    },
  });

  blessed.text({
    parent: settingsBox,
    top: 0,
    left: 1,
    content: 'Refresh interval (ms):',
    style: { fg: 'white', bg: 'black' },
  });

  intervalInput = blessed.textbox({
    parent: settingsBox,
    top: 1,
    left: 1,
    width: 36,
    height: 1,
    inputOnFocus: true,
    style: {
      fg: 'white',
      bg: 'blue',
      focus: { bg: 'cyan' },
    },
  });

  blessed.text({
    parent: settingsBox,
    top: 3,
    left: 1,
    content: '{bold}Enter{/bold}:save  {bold}Escape{/bold}:cancel',
    tags: true,
    style: { fg: 'gray', bg: 'black' },
  });

  // Key bindings
  screen.key([ 'q', 'C-c' ], async () => {
    if ( settingsOpen ) {
      closeSettings();
    } else {
      await shutdown();
    }
  });

  screen.key([ 'p', 'space' ], () => {
    if ( settingsOpen ) return;
    paused = !paused;
    updateFooter();
    screen?.render();
  });

  screen.key([ 's' ], () => {
    if ( settingsOpen ) return;
    openSettings();
  });

  screen.key([ 'escape' ], () => {
    if ( settingsOpen ) {
      closeSettings();
    }
  });

  intervalInput?.key([ 'enter' ], () => {
    const val = parseInt( intervalInput?.getValue() || '', 10 );
    if ( !isNaN( val ) && val >= 100 && val <= 10000 ) {
      refreshInterval = val;
      updateFooter();
    }
    closeSettings();
  });

  intervalInput?.key([ 'escape' ], () => {
    closeSettings();
  });

  screen.render();
}


/**
 * Update the footer with current state.
 */
function updateFooter() {
  if ( !footerBox ) return;
  const status = paused ? '{red-fg}PAUSED{/red-fg}' : '{green-fg}RUNNING{/green-fg}';
  footerBox.setContent( ` ${ status }  {bold}p{/bold}:pause  {bold}s{/bold}:settings  {bold}q{/bold}:quit  |  Refresh: ${ refreshInterval }ms ` );
}


/**
 * Open the settings modal.
 */
function openSettings() {
  if ( !settingsBox || !intervalInput || !screen ) return;
  settingsOpen = true;
  intervalInput.setValue( refreshInterval.toString() );
  settingsBox.show();
  intervalInput.focus();
  screen.render();
}


/**
 * Close the settings modal.
 */
function closeSettings() {
  if ( !settingsBox || !screen ) return;
  settingsOpen = false;
  settingsBox.hide();
  screen.render();
}


/**
 * Update the stats display in TUI mode.
 */
function updateStatsDisplay() {
  if ( !statsBox || !screen ) return;

  const lines = [
    '{bold}{cyan-fg}CPU{/cyan-fg}{/bold}',
    `  Usage:    ${ previousPayload.cpu_usage.toString().padStart( 5 ) }%`,
    `  Temp:     ${ previousPayload.cpu_temp.toString().padStart( 5 ) }°C`,
    '',
    '{bold}{cyan-fg}GPU{/cyan-fg}{/bold}',
    `  Usage:    ${ previousPayload.gpu_usage.toString().padStart( 5 ) }%`,
    `  Temp:     ${ previousPayload.gpu_temp.toString().padStart( 5 ) }°C`,
    '',
    '{bold}{cyan-fg}Memory{/cyan-fg}{/bold}',
    `  RAM:      ${ previousPayload.ram_usage.toString().padStart( 5 ) }%`,
    '',
    '{bold}{cyan-fg}Disk{/cyan-fg}{/bold}',
    `  Activity: ${ previousPayload.disk_activity.toString().padStart( 5 ) }%`,
    `  Read/Write: ${ previousPayload.disk_read_speed.toString().padStart( 5 ) } / ${ previousPayload.disk_write_speed.toString().padStart( 5 ) } MB/s`,
    '',
    '{bold}{cyan-fg}Power{/cyan-fg}{/bold}',
    `  State:    ${ previousPayload.power_state }`,
    `  Battery:  ${ previousPayload.battery_perc.toString().padStart( 5 ) }%`,
  ];

  statsBox.setContent( lines.join( '\n' ) );
  screen.render();
  process.stdout.write( '\x1B[?25l' );
}


/**
 * Shutdown handler - sends zero values to HA and cleans up.
 */
async function shutdown() {
  log( 'Shutting down...' );

  const p: Promise<any>[] = [];

  p.push( fetch( HA_URL +`sensor.${ MACHINE_NAME }_cpu_usage`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ state: 0, attributes: { unit_of_measurement: '%', friendly_name: 'CPU Usage' } }),
  }).catch( () => {} ) );

  p.push( fetch( HA_URL +`sensor.${ MACHINE_NAME }_cpu_temp`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ state: 0, attributes: { unit_of_measurement: '°C', friendly_name: 'CPU Temp' } }),
  }).catch( () => {} ) );

  p.push( fetch( HA_URL +`sensor.${ MACHINE_NAME }_gpu_usage`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ state: 0, attributes: { unit_of_measurement: '%', friendly_name: 'GPU Usage' } }),
  }).catch( () => {} ) );

  p.push( fetch( HA_URL +`sensor.${ MACHINE_NAME }_gpu_temp`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ state: 0, attributes: { unit_of_measurement: '°C', friendly_name: 'GPU Temp' } }),
  }).catch( () => {} ) );

  p.push( fetch( HA_URL +`sensor.${ MACHINE_NAME }_ram_usage`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ state: 0, attributes: { unit_of_measurement: '%', friendly_name: 'RAM Usage' } }),
  }).catch( () => {} ) );

  p.push( fetch( HA_URL +`sensor.${ MACHINE_NAME }_disk_activity`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ state: 0, attributes: { unit_of_measurement: '%', friendly_name: 'Disk Activity' } }),
  }).catch( () => {} ) );

  p.push( fetch( HA_URL +`sensor.${ MACHINE_NAME }_disk_write_speed`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ state: 0, attributes: { unit_of_measurement: 'MB/s', friendly_name: 'Disk Write Speed' } }),
  }).catch( () => {} ) );

  p.push( fetch( HA_URL +`sensor.${ MACHINE_NAME }_disk_read_speed`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ state: 0, attributes: { unit_of_measurement: 'MB/s', friendly_name: 'Disk Read Speed' } }),
  }).catch( () => {} ) );

  p.push( fetch( HA_URL +`sensor.${ MACHINE_NAME }_connected`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ state: 0, attributes: { friendly_name: 'BLA Nate T1D3L Connected' } }),
  }).catch( () => {} ) );

  if ( client ) {
    client.end();
  }

  await Promise.all( p );

  if ( screen ) {
    screen.destroy();
  }

  log( 'Exiting' );
  process.exit();
}


// if main module
if ( require.main === module ) { ( async () => {

  if ( !daemonMode ) {
    createTUI();
  }

  process.on( 'SIGINT', async () => {
    await shutdown();
  });

  while ( true ) {
    if ( !paused ) {
      await readSystemData();
      if ( !daemonMode ) {
        updateStatsDisplay();
      }
    }
    await new Promise( resolve => setTimeout( resolve, refreshInterval ) );
  }
})() }
