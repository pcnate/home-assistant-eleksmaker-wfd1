// connect to a serial port com6
var {SerialPort} = require('serialport');
const os = require( 'os' );

var port = new SerialPort({
  path: 'COM6',
  baudRate: 115200,
  dataBits: 8,
  stopBits: 1,
  parity: 'none'
});

let cpuUsage = 0x00;
let gpuUsage = 0x00;
let memUsage = 0x00;

// send data to the serial port on a regular basis

let w = 0x01

async function delay( ms ) {
  return new Promise( ( resolve, reject ) => {
    setTimeout( () => {
      resolve();
    }, ms );
  });
}


/**
 * load CPU usage from AIDA64 shared memory
 */
async function getCpuUsage() {
  const sharedMemory = require( 'aida64-shared-memory' );
  const aida64 = new sharedMemory.Aida64();
  const cpuUsage = await aida64.getCpuUsage();
  console.log( 'cpu usage', cpuUsage );
  return cpuUsage;
}

let x = 0x00;
let y = 0x00;

async function sendData() {
  // if ( w === 0x01 ) {
  //   w = 0x02;
  // } else
  // if ( w === 0x02 ){
  //   w = 0x03;
  // } else {
  //   w = 0x01;
  // }

  // const chars = [
  // //0x46, 0x41, 0x42, 0x49, 0x4c, 0x49, 0x42, 0x49, 0x4c, 0x49, 0x20, 0x20, 0x54, 0x49, 0x4b, 0x54, 0x4f, 0x4b, 0x20
  // //0xeb, 0xaa, 0x00, 0x00, 0x07, 0x5d, 0xb0, 0x06, 0xf8, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20
  //   0x46, 0x41, 0x42, 0x49, 0x4c, 0x49, 0x42, 0x49, 0x4c, 0x49, 0x20, 0x20, 0x54, 0x49, 0x4b, 0x54, 0x4f, 0x4b, 0x20
  //   // 0xef, w
  // ];

  // let data = chars.map( c => {
  //   let s = '';
  //   // s = c.toString(16);
  //   s = String.fromCharCode( c )
  //   console.log( s );
  //   return s;
  // }).join( '' );
  
  // console.log( 'sending data', data );

  // buffer = Buffer.from( data, 'utf8' );

  // port.write( data );
  
  // const d2 = String.fromCharCode( 0xeb ) + String.fromCharCode( 0xaa ) + String.fromCharCode( 0x01 ) + String.fromCharCode( 0x00 ) + String.fromCharCode( 0x08 ) + String.fromCharCode( 0x00 ) + String.fromCharCode( 0x6d ) + String.fromCharCode( 0x00 ) + String.fromCharCode( 0x65 );
  // const d3 = String.fromCharCode( 0xef, 0x04 );

  // await delay( 100 );
  // console.log( 'sending data', d2 );
  // port.write( Buffer.from( d2, 'utf8') )
  // await delay( 100 );
  // console.log( 'sending data', d3 );
  // port.write( d3, 'utf8' )
  console.log( 'sending data' );
  const text = [ 0xEF, 0x04, 0x46, 0x41, 0x55, 0x4E, 0x52, 0x33, 0x34, 0x4C /**, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0xEB, 0xAA, 0x00, 0x00, 0x08, 0x00, 0x6D, 0x00, 0x65, 0xEF */ ];
  // port.write( Buffer.from( text ) );

  // random gPU
  gpuUsage = Math.floor( Math.random() * 0x14 );

  x += 1;
  if ( x > 0x03 ) {
    x = 0x01;
  }

  // resources
  const resources = [ 0xEB, 0xAA, cpuUsage, gpuUsage, memUsage, 0x00, 0x62, 0x00, 0x65, 0xEF, x ];
  // const resources = [ 0xEB, 0xAA, 0x02, 0x00, 0x08, 0x00, 0x33, 0x00, 0x37, 0xEF, 0x01 ];
  // const resources = [ 0x43, 0x4C, 0xEB /**, 0x00, 0x29, 0x00, 0x3A, 0x00, 0x33, 0x00, 0x15, 0xEF, 0x04 */ ];
  port.write( Buffer.from( resources ) );

  // const weather = [ 0xEA, 0xAA, 0x10 ];
  const weather = [ 0x43, 0x4C, 0xEB ];
  // const weather = [ 0xEB, 0xAA ];
  // port.write( Buffer.from( weather ) );

  console.log(
    'sending data',
    '\r\n' +
    resources.map( x => `0x${x.toString( 16 ).toUpperCase().padStart( 2, '0' )}` ).join( ',' ),
    // '\r\n' +
    // weather.map( x => `0x${x.toString( 16 ).toUpperCase().padStart( 2, '0' )}` ).join( ',' ),
  );
  // port.write( Buffer.from( [ x, y, 0x46 ] ) );
}

  
setInterval( sendData, 1333 );
sendData();


/**
 * calculate memory usage
 */
function calculateMemoryUsage() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const _memUsage = usedMem / totalMem * 100;
  // 100% memory = 0x14 and 0% memory = 0x00
  memUsage = Math.floor( _memUsage * 0.14 );
}

/**
 * calculate CPU usage
 */
function calculateCpuUsage() {
  const cpus = os.cpus();

  // Capture first CPU measures
  const start = cpus.map( cpu => ( {
    idle: cpu.times.idle,
    total: Object.values( cpu.times ).reduce( ( acc, tv ) => acc + tv, 0 )
  } ) );

  // Wait for a second before taking the second measure
  setTimeout( () => {
    const cpus = os.cpus();

    // Capture second CPU measures
    const end = cpus.map( cpu => ( {
      idle: cpu.times.idle,
      total: Object.values( cpu.times ).reduce( ( acc, tv ) => acc + tv, 0 )
    } ) );

    const usage = end.map( ( end, i ) => {
      const startCpu = start[ i ];
      const idleDiff = end.idle - startCpu.idle;
      const totalDiff = end.total - startCpu.total;

      // Calculate percentage of used CPU
      return ( 1 - idleDiff / totalDiff ) * 100;
    } );

    // Average CPU usage across all cores
    const averageCpuUsage = usage.reduce( ( acc, val ) => acc + val, 0 ) / usage.length;
    
    // 100% cpu = 0x14 and 0% cpu = 0x00
    cpuUsage = Math.floor( averageCpuUsage * 0.14 );

  }, 1000 );
}

setInterval( calculateCpuUsage, 666 );
setInterval( calculateMemoryUsage, 666 );