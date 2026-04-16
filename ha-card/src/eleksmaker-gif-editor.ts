import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';


/**
 * One frame of the 7x7 matrix + 12 circle LEDs + timing preset.
 */
interface Frame {
  matrix: boolean[][]; // [row][col], 7x7
  circle: boolean[];   // 12 LEDs
  timing: 0 | 1 | 2 | 3; // 0=50ms, 1=100ms, 2=200ms, 3=500ms
}


const TIMING_LABELS = [ '50ms', '100ms', '200ms', '500ms' ];
const MAX_CHARS = 255;
const CHARS_PER_FRAME = 11;
const PRESET_SLOTS = 10;
const PRESET_ENTITY_PREFIX = 'input_text.eleksmaker_gif_preset_';
const FLICKER_ENTITY = 'input_number.eleksmaker_logo_flicker';


@customElement( 'eleksmaker-gif-editor' )
export class EleksmakerGifEditor extends LitElement {
  @property({ attribute: false }) hass!: any;
  @property({ attribute: false }) config!: { entity: string; title?: string };

  @state() private frames: Frame[] = [ this.newFrame() ];
  @state() private currentFrame = 0;
  @state() private lastLoadedValue = '';
  @state() private selectedSlot = 1;
  @state() private clearAfter = false;


  /**
   * Create an empty frame with all LEDs off and timing set to 200ms.
   *
   * @returns fresh frame
   */
  private newFrame(): Frame {
    return {
      matrix: Array.from( { length: 7 }, () => Array( 7 ).fill( false ) ),
      circle: Array( 12 ).fill( false ),
      timing: 2,
    };
  }


  /**
   * HA calls this with the card config when the card is added to a dashboard.
   *
   * @param config - card config from yaml
   */
  setConfig( config: any ): void {
    if ( !config.entity ) throw new Error( 'entity required' );
    this.config = config;
  }


  static styles = css`
    :host {
      display: block;
    }
    ha-card {
      padding: 16px;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .frame-nav {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    button {
      background: var( --primary-color );
      color: var( --text-primary-color );
      border: none;
      border-radius: 4px;
      padding: 6px 12px;
      cursor: pointer;
      font-size: 14px;
    }
    button:hover {
      filter: brightness( 1.1 );
    }
    button.secondary {
      background: var( --secondary-background-color );
      color: var( --primary-text-color );
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .timing {
      display: flex;
      gap: 4px;
      margin-bottom: 12px;
    }
    .timing button.active {
      background: var( --accent-color );
    }
    .display-area {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      margin: 8px 0;
    }
    .horizontal-side {
      display: flex;
      justify-content: space-around;
      align-items: center;
      width: 168px;
    }
    .middle-row {
      display: flex;
      align-items: stretch;
      gap: 8px;
    }
    .vertical-side {
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      align-items: center;
    }
    .matrix {
      display: grid;
      grid-template-columns: repeat( 7, 24px );
      grid-template-rows: repeat( 7, 24px );
      gap: 0;
    }
    .cell {
      width: 24px;
      height: 24px;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      cursor: pointer;
      box-sizing: border-box;
      transition: background 0.1s;
    }
    .cell.on {
      background: #ffffff;
      box-shadow: 0 0 6px rgba( 255, 255, 255, 0.7 );
    }
    .cell:hover {
      outline: 1px solid var( --accent-color );
    }
    .led {
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      cursor: pointer;
      transition: background 0.1s;
      flex-shrink: 0;
      border-radius: 2px;
    }
    .led.on {
      background: #ffffff;
      box-shadow: 0 0 6px rgba( 255, 255, 255, 0.8 );
    }
    .led:hover {
      outline: 1px solid var( --accent-color );
    }
    .led-h {
      width: 48px;
      height: 6px;
    }
    .led-v {
      width: 6px;
      height: 48px;
    }
    .actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      flex-wrap: wrap;
    }
    .presets {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 8px;
      background: var( --secondary-background-color );
      border-radius: 4px;
      flex-wrap: wrap;
    }
    .presets-label {
      font-weight: bold;
      font-size: 14px;
    }
    .presets select {
      padding: 6px;
      background: var( --card-background-color );
      color: var( --primary-text-color );
      border: 1px solid var( --divider-color );
      border-radius: 4px;
      font-size: 14px;
    }
    .meta {
      font-size: 12px;
      color: var( --secondary-text-color );
      margin-top: 8px;
    }
    .warn {
      color: var( --error-color );
    }
  `;


  updated( changed: PropertyValues ): void {
    if ( changed.has( 'hass' ) && this.hass && this.config ) {
      const state = this.hass.states?.[ this.config.entity ];
      // auto-load when the entity state changes externally (but don't clobber local edits)
      if ( state && state.state !== this.lastLoadedValue && this.lastLoadedValue === '' ) {
        this.loadFromHA();
      }
    }
  }


  /**
   * Toggle a cell in the 7x7 matrix.
   *
   * @param r - row (0-6)
   * @param c - column (0-6)
   */
  private toggleCell( r: number, c: number ): void {
    const f = this.frames[ this.currentFrame ];
    f.matrix[ r ][ c ] = !f.matrix[ r ][ c ];
    this.requestUpdate();
  }


  /**
   * Toggle a circle LED.
   *
   * @param i - LED index (0-11)
   */
  private toggleCircle( i: number ): void {
    const f = this.frames[ this.currentFrame ];
    f.circle[ i ] = !f.circle[ i ];
    this.requestUpdate();
  }


  private setTiming( t: 0 | 1 | 2 | 3 ): void {
    this.frames[ this.currentFrame ].timing = t;
    this.requestUpdate();
  }


  private prevFrame(): void {
    if ( this.currentFrame > 0 ) this.currentFrame--;
  }


  private nextFrame(): void {
    if ( this.currentFrame < this.frames.length - 1 ) this.currentFrame++;
  }


  private addFrame(): void {
    if ( ( this.frames.length + 1 ) * CHARS_PER_FRAME > MAX_CHARS ) return;
    this.frames.splice( this.currentFrame + 1, 0, this.newFrame() );
    this.currentFrame++;
    this.requestUpdate();
  }


  private duplicateFrame(): void {
    if ( ( this.frames.length + 1 ) * CHARS_PER_FRAME > MAX_CHARS ) return;
    const src = this.frames[ this.currentFrame ];
    const copy: Frame = {
      matrix: src.matrix.map( row => [ ...row ] ),
      circle: [ ...src.circle ],
      timing: src.timing,
    };
    this.frames.splice( this.currentFrame + 1, 0, copy );
    this.currentFrame++;
    this.requestUpdate();
  }


  private deleteFrame(): void {
    if ( this.frames.length <= 1 ) return;
    this.frames.splice( this.currentFrame, 1 );
    if ( this.currentFrame >= this.frames.length ) this.currentFrame--;
    this.requestUpdate();
  }


  private clearFrame(): void {
    this.frames[ this.currentFrame ] = { ...this.newFrame(), timing: this.frames[ this.currentFrame ].timing };
    this.requestUpdate();
  }


  /**
   * Encode all frames to the EleksWFD string format.
   * Each frame is 11 chars, 6 bits per char (value + 0x30).
   * Layout: bits 0-48 matrix, 49-60 circle, 61-62 timing.
   *
   * @returns encoded string
   */
  private encode(): string {
    let out = '';
    for ( let fi = 0; fi < this.frames.length; fi++ ) {
      const f = this.frames[ fi ];
      let bits = 0n;
      for ( let r = 0; r < 7; r++ ) {
        for ( let c = 0; c < 7; c++ ) {
          if ( f.matrix[ r ][ c ] ) bits |= 1n << BigInt( r * 7 + c );
        }
      }
      for ( let i = 0; i < 12; i++ ) {
        if ( f.circle[ i ] ) bits |= 1n << BigInt( 49 + i );
      }
      bits |= BigInt( f.timing ) << 61n;
      // bit 63 of frame 0 = "clear after cycle" flag
      if ( fi === 0 && this.clearAfter ) bits |= 1n << 63n;
      for ( let i = 0; i < CHARS_PER_FRAME; i++ ) {
        const v = Number( ( bits >> BigInt( i * 6 ) ) & 0x3Fn );
        out += String.fromCharCode( v + 0x30 );
      }
    }
    return out;
  }


  /**
   * Decode an EleksWFD animation string into frames.
   *
   * @param str - encoded string
   * @returns array of frames (at least one)
   */
  private decode( str: string ): Frame[] {
    const out: Frame[] = [];
    this.clearAfter = false;
    for ( let o = 0; o + CHARS_PER_FRAME <= str.length; o += CHARS_PER_FRAME ) {
      let bits = 0n;
      for ( let i = 0; i < CHARS_PER_FRAME; i++ ) {
        bits |= BigInt( str.charCodeAt( o + i ) - 0x30 ) << BigInt( i * 6 );
      }
      const f = this.newFrame();
      for ( let r = 0; r < 7; r++ ) {
        for ( let c = 0; c < 7; c++ ) {
          f.matrix[ r ][ c ] = ( ( bits >> BigInt( r * 7 + c ) ) & 1n ) === 1n;
        }
      }
      for ( let i = 0; i < 12; i++ ) {
        f.circle[ i ] = ( ( bits >> BigInt( 49 + i ) ) & 1n ) === 1n;
      }
      f.timing = Number( ( bits >> 61n ) & 0x3n ) as 0 | 1 | 2 | 3;
      // read clear-after flag from frame 0 bit 63
      if ( o === 0 ) this.clearAfter = ( ( bits >> 63n ) & 1n ) === 1n;
      out.push( f );
    }
    return out.length ? out : [ this.newFrame() ];
  }


  private async saveToHA(): Promise<void> {
    const value = this.encode();
    await this.hass.callService( 'input_text', 'set_value', {
      entity_id: this.config.entity,
      value,
    } );
    this.lastLoadedValue = value;
  }


  private loadFromHA(): void {
    const state = this.hass?.states?.[ this.config.entity ];
    if ( !state ) return;
    this.frames = this.decode( state.state );
    this.currentFrame = 0;
    this.lastLoadedValue = state.state;
    this.requestUpdate();
  }


  /**
   * Return the HA entity ID for a given preset slot number (1-10).
   */
  private presetEntity( slot: number ): string {
    return `${ PRESET_ENTITY_PREFIX }${ slot }`;
  }


  /**
   * Return the current stored value of a preset slot, or empty string.
   */
  private presetValue( slot: number ): string {
    const s = this.hass?.states?.[ this.presetEntity( slot ) ];
    return s?.state ?? '';
  }


  /**
   * Return a label for a preset slot showing the frame count.
   */
  private presetLabel( slot: number ): string {
    const val = this.presetValue( slot );
    if ( !val ) return `Slot ${ slot }: empty`;
    const frames = Math.floor( val.length / CHARS_PER_FRAME );
    return `Slot ${ slot }: ${ frames } frame${ frames === 1 ? '' : 's' }`;
  }


  private async loadPreset(): Promise<void> {
    const val = this.presetValue( this.selectedSlot );
    if ( !val ) return;
    this.frames = this.decode( val );
    this.currentFrame = 0;
    this.requestUpdate();
  }


  private async savePreset(): Promise<void> {
    await this.hass.callService( 'input_text', 'set_value', {
      entity_id: this.presetEntity( this.selectedSlot ),
      value: this.encode(),
    });
  }


  private async clearPreset(): Promise<void> {
    await this.hass.callService( 'input_text', 'set_value', {
      entity_id: this.presetEntity( this.selectedSlot ),
      value: '',
    });
  }


  /**
   * Current flicker rate from HA (flickers per second).
   */
  private flickerRate(): number {
    const v = this.hass?.states?.[ FLICKER_ENTITY ]?.state;
    const n = v != null ? Number( v ) : 0;
    return isFinite( n ) ? n : 0;
  }


  private async setFlickerRate( value: number ): Promise<void> {
    if ( !isFinite( value ) ) return;
    const clamped = Math.max( 0, Math.min( 100, Math.round( value ) ) );
    await this.hass.callService( 'input_number', 'set_value', {
      entity_id: FLICKER_ENTITY,
      value: clamped,
    });
  }


  render() {
    if ( !this.config || !this.hass ) return html``;
    const f = this.frames[ this.currentFrame ];
    const title = this.config.title ?? 'EleksMaker GIF Editor';
    const charCount = this.frames.length * CHARS_PER_FRAME;
    const atMax = ( this.frames.length + 1 ) * CHARS_PER_FRAME > MAX_CHARS;

    /**
     * Render a circle LED as a horizontal bar (top/bottom sides).
     */
    const ledH = ( i: number ) => html`
      <div class="led led-h ${ f.circle[ i ] ? 'on' : '' }"
           @click=${ () => this.toggleCircle( i ) }></div>
    `;

    /**
     * Render a circle LED as a vertical bar (left/right sides).
     */
    const ledV = ( i: number ) => html`
      <div class="led led-v ${ f.circle[ i ] ? 'on' : '' }"
           @click=${ () => this.toggleCircle( i ) }></div>
    `;

    return html`
      <ha-card .header=${ title }>
        <div style="padding: 16px;">
          <div class="header">
            <div class="frame-nav">
              <button class="secondary" @click=${ this.prevFrame } ?disabled=${ this.currentFrame === 0 }>◀</button>
              <span>Frame ${ this.currentFrame + 1 } / ${ this.frames.length }</span>
              <button class="secondary" @click=${ this.nextFrame } ?disabled=${ this.currentFrame === this.frames.length - 1 }>▶</button>
            </div>
            <button @click=${ this.addFrame } ?disabled=${ atMax }>+ New</button>
            <button @click=${ this.duplicateFrame } ?disabled=${ atMax }>Dup</button>
            <button class="secondary" @click=${ this.clearFrame }>Clear</button>
            <button class="secondary" @click=${ this.deleteFrame } ?disabled=${ this.frames.length <= 1 }>Delete</button>
          </div>

          <div class="timing">
            ${ TIMING_LABELS.map( ( label, i ) => html`
              <button class=${ f.timing === i ? 'active' : 'secondary' } @click=${ () => this.setTiming( i as 0 | 1 | 2 | 3 ) }>${ label }</button>
            ` ) }
          </div>

          <div class="display-area">
            <div class="horizontal-side">
              ${ ledH( 0 ) }${ ledH( 1 ) }${ ledH( 2 ) }
            </div>
            <div class="middle-row">
              <div class="vertical-side">
                ${ ledV( 11 ) }${ ledV( 10 ) }${ ledV( 9 ) }
              </div>
              <div class="matrix">
                ${ f.matrix.flat().map( ( on, idx ) => {
                  const r = Math.floor( idx / 7 );
                  const c = idx % 7;
                  return html`
                    <div class="cell ${ on ? 'on' : '' }"
                         @click=${ () => this.toggleCell( r, c ) }></div>
                  `;
                } ) }
              </div>
              <div class="vertical-side">
                ${ ledV( 3 ) }${ ledV( 4 ) }${ ledV( 5 ) }
              </div>
            </div>
            <div class="horizontal-side">
              ${ ledH( 8 ) }${ ledH( 7 ) }${ ledH( 6 ) }
            </div>
          </div>

          <div class="actions">
            <button @click=${ this.saveToHA }>Save to HA</button>
            <button class="secondary" @click=${ this.loadFromHA }>Reload from HA</button>
            <label style="display: flex; align-items: center; gap: 4px; margin-left: 8px;">
              <input
                type="checkbox"
                .checked=${ this.clearAfter }
                @change=${ ( e: Event ) => { this.clearAfter = ( e.target as HTMLInputElement ).checked; } }
              >
              <span>Clear after last frame</span>
            </label>
          </div>

          <div class="presets">
            <div class="presets-label">Presets</div>
            <select
              .value=${ String( this.selectedSlot ) }
              @change=${ ( e: Event ) => { this.selectedSlot = Number( ( e.target as HTMLSelectElement ).value ); } }
            >
              ${ Array.from( { length: PRESET_SLOTS }, ( _, i ) => i + 1 ).map( slot => html`
                <option value=${ slot } ?selected=${ slot === this.selectedSlot }>${ this.presetLabel( slot ) }</option>
              ` ) }
            </select>
            <button @click=${ this.loadPreset } ?disabled=${ !this.presetValue( this.selectedSlot ) }>Load</button>
            <button @click=${ this.savePreset }>Save</button>
            <button class="secondary" @click=${ this.clearPreset } ?disabled=${ !this.presetValue( this.selectedSlot ) }>Clear</button>
          </div>

          <div class="presets">
            <div class="presets-label">Flicker</div>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              .value=${ String( this.flickerRate() ) }
              @change=${ ( e: Event ) => this.setFlickerRate( Number( ( e.target as HTMLInputElement ).value ) ) }
              style="width: 70px; padding: 6px; background: var( --card-background-color ); color: var( --primary-text-color ); border: 1px solid var( --divider-color ); border-radius: 4px;"
            >
            <span style="font-size: 13px; color: var( --secondary-text-color );">flickers/sec (0 = off)</span>
          </div>

          <div class="meta ${ charCount > MAX_CHARS ? 'warn' : '' }">
            ${ charCount }/${ MAX_CHARS } chars · ${ this.frames.length } frames · entity: ${ this.config.entity }
          </div>
        </div>
      </ha-card>
    `;
  }
}


// register with HA's custom card picker
( window as any ).customCards = ( window as any ).customCards || [];
( window as any ).customCards.push( {
  type: 'eleksmaker-gif-editor',
  name: 'EleksMaker GIF Editor',
  description: '7x7 matrix + circle LED animation editor for EleksWFD',
} );
