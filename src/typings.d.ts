type QueryOptions = {
  class?: string,
  host?: string,
  namespace?: string,
  password?: string,
  properties?: string,
  props?: string,
  username?: string,
  where?: string,
}

declare module 'node-wmi' {
  // 2 overloads, one with options and the other just with cb
  export function Query( cb: Function ): Promise<any>;
  export function Query( options: QueryOptions, cb: Function ): Promise<any>;
}

declare module 'mic' {
  import { Readable } from 'stream';

  interface MicOptions {
    endian?: 'big' | 'little';
    bitwidth?: '8' | '16' | '24' | '32';
    encoding?: 'unsigned-integer' | 'signed-integer';
    rate?: string; // Sample rate, e.g., '16000'
    channels?: string; // Number of channels, e.g., '1'
    device?: string; // Audio device, e.g., 'plughw:1,0'
    exitOnSilence?: number; // Frames before exit
    fileType?: string; // File type, e.g., 'raw'
    debug?: boolean;
  }

  interface MicInstance {
    start(): void;
    stop(): void;
    pause(): void;
    resume(): void;
    getAudioStream(): Readable;
  }

  function mic( options?: MicOptions ): MicInstance;

  export = mic;
}
