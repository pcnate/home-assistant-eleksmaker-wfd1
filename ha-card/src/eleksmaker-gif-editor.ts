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
const TIMING_MS = [ 50, 100, 200, 500 ];
const LED_POS = [
  'led-top-0', 'led-top-1', 'led-top-2',
  'led-right-3', 'led-right-4', 'led-right-5',
  'led-bottom-6', 'led-bottom-7', 'led-bottom-8',
  'led-left-9', 'led-left-10', 'led-left-11',
];
const MAX_CHARS = 255;
const CHARS_PER_FRAME = 11;
const PRESET_SLOTS = 10;
const PRESET_ENTITY_PREFIX = 'input_text.eleksmaker_gif_preset_';
const FLICKER_ENTITY = 'input_number.eleksmaker_logo_flicker';
const PLAY_COUNT_ENTITY = 'input_number.eleksmaker_gif_play_count';
const PREFIX_CHARS = 2; // 2 chars = 12-bit play count at the start of the animation string


@customElement( 'eleksmaker-gif-editor' )
export class EleksmakerGifEditor extends LitElement {
  @property({ attribute: false }) hass!: any;
  @property({ attribute: false }) config!: { entity: string; title?: string };

  @state() private frames: Frame[] = [ this.newFrame() ];
  @state() private currentFrame = 0;
  @state() private lastLoadedValue = '';
  @state() private selectedSlot = 1;
  @state() private playCount = 0; // per-animation play count baked into the first 2 chars (0 = loop)
  // previewIdx intentionally NOT @state — we paint the preview imperatively on
  // each tick to avoid re-rendering the whole card every 50-500ms
  private previewIdx = 0;
  private previewTimer: any = null;


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
    /* Layout sizing: matrix cell = 24 px, border = gap = 12 px (half of cell). */
    .stage {
      display: flex;
      align-items: flex-start;
      gap: 4px;
      margin: 8px 0;
    }
    .display-area,
    .preview-area {
      position: relative;
      width: 216px;    /* 168 matrix + 2*(12 border + 12 gap) */
      height: 216px;
      background: #1a1a1a;
      flex: 0 0 auto;
    }
    .preview-label {
      font-size: 12px;
      color: var( --secondary-text-color );
      margin-top: 6px;
      text-align: center;
    }
    /* preview uses the same sub-element classes as the editor; disable interaction */
    .preview-area .led,
    .preview-area .cell {
      cursor: default;
      pointer-events: none;
    }
    .matrix {
      position: absolute;
      top: 24px;       /* border + gap */
      left: 24px;
      display: grid;
      grid-template-columns: repeat( 7, 24px );
      grid-template-rows: repeat( 7, 24px );
    }
    .cell {
      width: 24px;
      height: 24px;
      background: #1a1a1a;
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

    /* LED strip segments — positioned absolutely; 12 px thick (half cell). */
    .led {
      position: absolute;
      background: #1a1a1a;
      cursor: pointer;
      transition: background 0.1s;
    }
    .led.on {
      background: #ffffff;
      box-shadow: 0 0 6px rgba( 255, 255, 255, 0.8 );
    }
    .led:hover {
      filter: brightness( 1.3 );
    }

    /* Top row: 72 px wide, 12 px tall, three segments.
       Corner LEDs round their outer corner so the panel's outer corner is
       curved when either adjacent LED is lit; inner edges stay straight so
       adjacent lit LEDs meet cleanly with no seam. */
    .led-top-0 { top: 0; left: 0;    width: 72px; height: 12px;
      border-top-left-radius: 12px; }
    .led-top-1 { top: 0; left: 72px; width: 72px; height: 12px; }
    .led-top-2 { top: 0; left: 144px; width: 72px; height: 12px;
      border-top-right-radius: 12px; }

    /* Right column: 12 px wide, 72 px tall */
    .led-right-3 { top: 0;    left: 204px; width: 12px; height: 72px;
      border-top-right-radius: 12px; }
    .led-right-4 { top: 72px; left: 204px; width: 12px; height: 72px; }
    .led-right-5 { top: 144px; left: 204px; width: 12px; height: 72px;
      border-bottom-right-radius: 12px; }

    /* Bottom row (display L→R uses array indices 8, 7, 6) */
    .led-bottom-8 { bottom: 0; left: 0;    width: 72px; height: 12px;
      border-bottom-left-radius: 12px; }
    .led-bottom-7 { bottom: 0; left: 72px; width: 72px; height: 12px; }
    .led-bottom-6 { bottom: 0; left: 144px; width: 72px; height: 12px;
      border-bottom-right-radius: 12px; }

    /* Left column (display T→B uses array indices 11, 10, 9) */
    .led-left-11 { top: 0;    left: 0; width: 12px; height: 72px;
      border-top-left-radius: 12px; }
    .led-left-10 { top: 72px; left: 0; width: 12px; height: 72px; }
    .led-left-9  { top: 144px; left: 0; width: 12px; height: 72px;
      border-bottom-left-radius: 12px; }
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

    // (re)start the preview loop whenever frames change
    if ( changed.has( 'frames' ) || this.previewTimer === null ) {
      this.startPreview();
    }
  }


  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stopPreview();
  }


  /**
   * Advance to the next preview frame, paint it imperatively (no Lit
   * re-render), and schedule the next tick based on its timing preset.
   */
  private stepPreview = (): void => {
    if ( this.frames.length === 0 ) { this.previewTimer = null; return; }
    this.previewIdx = ( this.previewIdx + 1 ) % this.frames.length;
    this.paintPreview();
    const nextMs = TIMING_MS[ this.frames[ this.previewIdx ].timing ];
    this.previewTimer = setTimeout( this.stepPreview, nextMs );
  };


  private startPreview(): void {
    this.stopPreview();
    if ( this.frames.length === 0 ) return;
    if ( this.previewIdx >= this.frames.length ) this.previewIdx = 0;
    this.paintPreview();
    const ms = TIMING_MS[ this.frames[ this.previewIdx ].timing ];
    this.previewTimer = setTimeout( this.stepPreview, ms );
  }


  private stopPreview(): void {
    if ( this.previewTimer !== null ) {
      clearTimeout( this.previewTimer );
      this.previewTimer = null;
    }
  }


  /**
   * Directly toggle the `on` class on preview-area DOM nodes to reflect the
   * current preview frame. Bypasses Lit's render cycle so a 50 ms frame rate
   * doesn't re-render the whole card.
   */
  private paintPreview(): void {
    const root = this.shadowRoot;
    if ( !root ) return;
    const preview = root.querySelector( '.preview-area' );
    if ( !preview ) return;
    const f = this.frames[ this.previewIdx ];
    if ( !f ) return;

    for ( let i = 0; i < 12; i++ ) {
      const el = preview.querySelector( `.${ LED_POS[ i ] }` );
      if ( el ) el.classList.toggle( 'on', f.circle[ i ] );
    }
    const cells = preview.querySelectorAll( '.cell' );
    for ( let i = 0; i < 49 && i < cells.length; i++ ) {
      const r = Math.floor( i / 7 );
      const c = i % 7;
      cells[ i ].classList.toggle( 'on', f.matrix[ r ][ c ] );
    }
    const label = root.querySelector( '.preview-label' );
    if ( label ) {
      label.textContent = `Preview · ${ this.previewIdx + 1 }/${ this.frames.length } · ${ TIMING_LABELS[ f.timing ] }`;
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
    if ( PREFIX_CHARS + ( this.frames.length + 1 ) * CHARS_PER_FRAME > MAX_CHARS ) return;
    this.frames.splice( this.currentFrame + 1, 0, this.newFrame() );
    this.currentFrame++;
    this.requestUpdate();
  }


  private duplicateFrame(): void {
    if ( PREFIX_CHARS + ( this.frames.length + 1 ) * CHARS_PER_FRAME > MAX_CHARS ) return;
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
    // prefix: 2 chars encoding a 12-bit play count (low 6 bits, then high 6 bits)
    const pc = Math.max( 0, Math.min( 4095, Math.round( this.playCount ) ) );
    let out = String.fromCharCode( ( pc & 0x3F ) + 0x30 )
            + String.fromCharCode( ( ( pc >> 6 ) & 0x3F ) + 0x30 );

    for ( const f of this.frames ) {
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
    this.playCount = 0;

    if ( str.length >= PREFIX_CHARS ) {
      const low  = str.charCodeAt( 0 ) - 0x30;
      const high = str.charCodeAt( 1 ) - 0x30;
      this.playCount = ( low & 0x3F ) | ( ( high & 0x3F ) << 6 );
    }

    for ( let o = PREFIX_CHARS; o + CHARS_PER_FRAME <= str.length; o += CHARS_PER_FRAME ) {
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


  /**
   * Update the per-animation play count and push the whole animation string
   * (with the new prefix baked in) back to HA. Skips the save if the value
   * hasn't actually changed.
   */
  private setPlayCount( value: number ): void {
    if ( !isFinite( value ) ) return;
    const n = Math.max( 0, Math.min( 4095, Math.round( value ) ) );
    if ( n === this.playCount ) return;
    this.playCount = n;
    void this.saveToHA();
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


  /**
   * Current global play-count from HA (0 = disabled, N = play N more cycles
   * across any loaded animation; firmware decrements each cycle and clears
   * the GIF entity when it hits 0).
   */
  private globalPlayCount(): number {
    const v = this.hass?.states?.[ PLAY_COUNT_ENTITY ]?.state;
    const n = v != null ? Number( v ) : 0;
    return isFinite( n ) ? n : 0;
  }


  private async setGlobalPlayCount( value: number ): Promise<void> {
    if ( !isFinite( value ) ) return;
    const clamped = Math.max( 0, Math.min( 100, Math.round( value ) ) );
    await this.hass.callService( 'input_number', 'set_value', {
      entity_id: PLAY_COUNT_ENTITY,
      value: clamped,
    });
  }


  render() {
    if ( !this.config || !this.hass ) return html``;
    const f = this.frames[ this.currentFrame ];
    const title = this.config.title ?? 'EleksMaker GIF Editor';
    const charCount = PREFIX_CHARS + this.frames.length * CHARS_PER_FRAME;
    const atMax = PREFIX_CHARS + ( this.frames.length + 1 ) * CHARS_PER_FRAME > MAX_CHARS;

    /**
     * Render a circle LED with a specific position class.
     *
     * @param idx - circle index (0-11)
     * @param posClass - position class name (led-top-0, led-right-3, etc.)
     */
    const led = ( idx: number, posClass: string ) => html`
      <div class="led ${ posClass } ${ f.circle[ idx ] ? 'on' : '' }"
           @click=${ () => this.toggleCircle( idx ) }></div>
    `;

    const pf = this.frames[ Math.min( this.previewIdx, this.frames.length - 1 ) ] ?? f;

    /**
     * Render a non-interactive preview LED from the current preview frame.
     */
    const previewLed = ( idx: number, posClass: string ) => html`
      <div class="led ${ posClass } ${ pf.circle[ idx ] ? 'on' : '' }"></div>
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

          <div class="stage">
            <div class="display-area">
              ${ led( 0,  'led-top-0' ) }
              ${ led( 1,  'led-top-1' ) }
              ${ led( 2,  'led-top-2' ) }
              ${ led( 3,  'led-right-3' ) }
              ${ led( 4,  'led-right-4' ) }
              ${ led( 5,  'led-right-5' ) }
              ${ led( 6,  'led-bottom-6' ) }
              ${ led( 7,  'led-bottom-7' ) }
              ${ led( 8,  'led-bottom-8' ) }
              ${ led( 9,  'led-left-9' ) }
              ${ led( 10, 'led-left-10' ) }
              ${ led( 11, 'led-left-11' ) }

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
            </div>

            <div>
              <div class="preview-area">
                ${ previewLed( 0,  'led-top-0' ) }
                ${ previewLed( 1,  'led-top-1' ) }
                ${ previewLed( 2,  'led-top-2' ) }
                ${ previewLed( 3,  'led-right-3' ) }
                ${ previewLed( 4,  'led-right-4' ) }
                ${ previewLed( 5,  'led-right-5' ) }
                ${ previewLed( 6,  'led-bottom-6' ) }
                ${ previewLed( 7,  'led-bottom-7' ) }
                ${ previewLed( 8,  'led-bottom-8' ) }
                ${ previewLed( 9,  'led-left-9' ) }
                ${ previewLed( 10, 'led-left-10' ) }
                ${ previewLed( 11, 'led-left-11' ) }

                <div class="matrix">
                  ${ pf.matrix.flat().map( on => html`
                    <div class="cell ${ on ? 'on' : '' }"></div>
                  ` ) }
                </div>
              </div>
              <div class="preview-label">
                Preview · ${ this.previewIdx + 1 }/${ this.frames.length } · ${ TIMING_LABELS[ pf.timing ] }
              </div>
            </div>
          </div>

          <div class="actions">
            <button @click=${ this.saveToHA }>Save to HA</button>
            <button class="secondary" @click=${ this.loadFromHA }>Reload from HA</button>
            <label style="display: flex; align-items: center; gap: 4px; margin-left: 8px;">
              <span>Play count:</span>
              <input
                type="number"
                min="0"
                max="4095"
                step="1"
                .value=${ String( this.playCount ) }
                @change=${ ( e: Event ) => this.setPlayCount( Number( ( e.target as HTMLInputElement ).value ) ) }
                style="width: 70px; padding: 4px; background: var( --card-background-color ); color: var( --primary-text-color ); border: 1px solid var( --divider-color ); border-radius: 4px;"
              >
              <span style="font-size: 13px; color: var( --secondary-text-color );">(0 = loop)</span>
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

          <div class="presets">
            <div class="presets-label">Global play count</div>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              .value=${ String( this.globalPlayCount() ) }
              @change=${ ( e: Event ) => this.setGlobalPlayCount( Number( ( e.target as HTMLInputElement ).value ) ) }
              style="width: 70px; padding: 6px; background: var( --card-background-color ); color: var( --primary-text-color ); border: 1px solid var( --divider-color ); border-radius: 4px;"
            >
            <span style="font-size: 13px; color: var( --secondary-text-color );">cycles (0 = disabled, decrements each loop)</span>
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
