/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const H = globalThis, z = H.ShadowRoot && (H.ShadyCSS === void 0 || H.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, j = Symbol(), Z = /* @__PURE__ */ new WeakMap();
let at = class {
  constructor(t, e, s) {
    if (this._$cssResult$ = !0, s !== j) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (z && t === void 0) {
      const s = e !== void 0 && e.length === 1;
      s && (t = Z.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), s && Z.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const pt = (r) => new at(typeof r == "string" ? r : r + "", void 0, j), ut = (r, ...t) => {
  const e = r.length === 1 ? r[0] : t.reduce((s, i, o) => s + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + r[o + 1], r[0]);
  return new at(e, r, j);
}, ft = (r, t) => {
  if (z) r.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const s = document.createElement("style"), i = H.litNonce;
    i !== void 0 && s.setAttribute("nonce", i), s.textContent = e.cssText, r.appendChild(s);
  }
}, J = z ? (r) => r : (r) => r instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const s of t.cssRules) e += s.cssText;
  return pt(e);
})(r) : r;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: mt, defineProperty: $t, getOwnPropertyDescriptor: gt, getOwnPropertyNames: _t, getOwnPropertySymbols: yt, getPrototypeOf: vt } = Object, I = globalThis, X = I.trustedTypes, bt = X ? X.emptyScript : "", xt = I.reactiveElementPolyfillSupport, k = (r, t) => r, N = { toAttribute(r, t) {
  switch (t) {
    case Boolean:
      r = r ? bt : null;
      break;
    case Object:
    case Array:
      r = r == null ? r : JSON.stringify(r);
  }
  return r;
}, fromAttribute(r, t) {
  let e = r;
  switch (t) {
    case Boolean:
      e = r !== null;
      break;
    case Number:
      e = r === null ? null : Number(r);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(r);
      } catch {
        e = null;
      }
  }
  return e;
} }, V = (r, t) => !mt(r, t), Y = { attribute: !0, type: String, converter: N, reflect: !1, useDefault: !1, hasChanged: V };
Symbol.metadata ??= Symbol("metadata"), I.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let A = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = Y) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const s = Symbol(), i = this.getPropertyDescriptor(t, s, e);
      i !== void 0 && $t(this.prototype, t, i);
    }
  }
  static getPropertyDescriptor(t, e, s) {
    const { get: i, set: o } = gt(this.prototype, t) ?? { get() {
      return this[e];
    }, set(n) {
      this[e] = n;
    } };
    return { get: i, set(n) {
      const l = i?.call(this);
      o?.call(this, n), this.requestUpdate(t, l, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? Y;
  }
  static _$Ei() {
    if (this.hasOwnProperty(k("elementProperties"))) return;
    const t = vt(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(k("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(k("properties"))) {
      const e = this.properties, s = [..._t(e), ...yt(e)];
      for (const i of s) this.createProperty(i, e[i]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [s, i] of e) this.elementProperties.set(s, i);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, s] of this.elementProperties) {
      const i = this._$Eu(e, s);
      i !== void 0 && this._$Eh.set(i, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const s = new Set(t.flat(1 / 0).reverse());
      for (const i of s) e.unshift(J(i));
    } else t !== void 0 && e.push(J(t));
    return e;
  }
  static _$Eu(t, e) {
    const s = e.attribute;
    return s === !1 ? void 0 : typeof s == "string" ? s : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t) => t(this));
  }
  addController(t) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t), this.renderRoot !== void 0 && this.isConnected && t.hostConnected?.();
  }
  removeController(t) {
    this._$EO?.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const s of e.keys()) this.hasOwnProperty(s) && (t.set(s, this[s]), delete this[s]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return ft(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t) => t.hostDisconnected?.());
  }
  attributeChangedCallback(t, e, s) {
    this._$AK(t, s);
  }
  _$ET(t, e) {
    const s = this.constructor.elementProperties.get(t), i = this.constructor._$Eu(t, s);
    if (i !== void 0 && s.reflect === !0) {
      const o = (s.converter?.toAttribute !== void 0 ? s.converter : N).toAttribute(e, s.type);
      this._$Em = t, o == null ? this.removeAttribute(i) : this.setAttribute(i, o), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const s = this.constructor, i = s._$Eh.get(t);
    if (i !== void 0 && this._$Em !== i) {
      const o = s.getPropertyOptions(i), n = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : N;
      this._$Em = i;
      const l = n.fromAttribute(e, o.type);
      this[i] = l ?? this._$Ej?.get(i) ?? l, this._$Em = null;
    }
  }
  requestUpdate(t, e, s, i = !1, o) {
    if (t !== void 0) {
      const n = this.constructor;
      if (i === !1 && (o = this[t]), s ??= n.getPropertyOptions(t), !((s.hasChanged ?? V)(o, e) || s.useDefault && s.reflect && o === this._$Ej?.get(t) && !this.hasAttribute(n._$Eu(t, s)))) return;
      this.C(t, e, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: s, reflect: i, wrapped: o }, n) {
    s && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, n ?? e ?? this[t]), o !== !0 || n !== void 0) || (this._$AL.has(t) || (this.hasUpdated || s || (e = void 0), this._$AL.set(t, e)), i === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [i, o] of this._$Ep) this[i] = o;
        this._$Ep = void 0;
      }
      const s = this.constructor.elementProperties;
      if (s.size > 0) for (const [i, o] of s) {
        const { wrapped: n } = o, l = this[i];
        n !== !0 || this._$AL.has(i) || l === void 0 || this.C(i, void 0, o, l);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), this._$EO?.forEach((s) => s.hostUpdate?.()), this.update(e)) : this._$EM();
    } catch (s) {
      throw t = !1, this._$EM(), s;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
A.elementStyles = [], A.shadowRootOptions = { mode: "open" }, A[k("elementProperties")] = /* @__PURE__ */ new Map(), A[k("finalized")] = /* @__PURE__ */ new Map(), xt?.({ ReactiveElement: A }), (I.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const q = globalThis, Q = (r) => r, L = q.trustedTypes, tt = L ? L.createPolicy("lit-html", { createHTML: (r) => r }) : void 0, lt = "$lit$", g = `lit$${Math.random().toFixed(9).slice(2)}$`, ht = "?" + g, At = `<${ht}>`, b = document, F = () => b.createComment(""), U = (r) => r === null || typeof r != "object" && typeof r != "function", W = Array.isArray, wt = (r) => W(r) || typeof r?.[Symbol.iterator] == "function", B = `[ 	
\f\r]`, S = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, et = /-->/g, st = />/g, y = RegExp(`>|${B}(?:([^\\s"'>=/]+)(${B}*=${B}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), it = /'/g, rt = /"/g, ct = /^(?:script|style|textarea|title)$/i, Et = (r) => (t, ...e) => ({ _$litType$: r, strings: t, values: e }), x = Et(1), w = Symbol.for("lit-noChange"), d = Symbol.for("lit-nothing"), ot = /* @__PURE__ */ new WeakMap(), v = b.createTreeWalker(b, 129);
function dt(r, t) {
  if (!W(r) || !r.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return tt !== void 0 ? tt.createHTML(t) : t;
}
const St = (r, t) => {
  const e = r.length - 1, s = [];
  let i, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", n = S;
  for (let l = 0; l < e; l++) {
    const a = r[l];
    let c, p, h = -1, f = 0;
    for (; f < a.length && (n.lastIndex = f, p = n.exec(a), p !== null); ) f = n.lastIndex, n === S ? p[1] === "!--" ? n = et : p[1] !== void 0 ? n = st : p[2] !== void 0 ? (ct.test(p[2]) && (i = RegExp("</" + p[2], "g")), n = y) : p[3] !== void 0 && (n = y) : n === y ? p[0] === ">" ? (n = i ?? S, h = -1) : p[1] === void 0 ? h = -2 : (h = n.lastIndex - p[2].length, c = p[1], n = p[3] === void 0 ? y : p[3] === '"' ? rt : it) : n === rt || n === it ? n = y : n === et || n === st ? n = S : (n = y, i = void 0);
    const $ = n === y && r[l + 1].startsWith("/>") ? " " : "";
    o += n === S ? a + At : h >= 0 ? (s.push(c), a.slice(0, h) + lt + a.slice(h) + g + $) : a + g + (h === -2 ? l : $);
  }
  return [dt(r, o + (r[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), s];
};
class T {
  constructor({ strings: t, _$litType$: e }, s) {
    let i;
    this.parts = [];
    let o = 0, n = 0;
    const l = t.length - 1, a = this.parts, [c, p] = St(t, e);
    if (this.el = T.createElement(c, s), v.currentNode = this.el.content, e === 2 || e === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (i = v.nextNode()) !== null && a.length < l; ) {
      if (i.nodeType === 1) {
        if (i.hasAttributes()) for (const h of i.getAttributeNames()) if (h.endsWith(lt)) {
          const f = p[n++], $ = i.getAttribute(h).split(g), R = /([.?@])?(.*)/.exec(f);
          a.push({ type: 1, index: o, name: R[2], strings: $, ctor: R[1] === "." ? kt : R[1] === "?" ? Pt : R[1] === "@" ? Ft : D }), i.removeAttribute(h);
        } else h.startsWith(g) && (a.push({ type: 6, index: o }), i.removeAttribute(h));
        if (ct.test(i.tagName)) {
          const h = i.textContent.split(g), f = h.length - 1;
          if (f > 0) {
            i.textContent = L ? L.emptyScript : "";
            for (let $ = 0; $ < f; $++) i.append(h[$], F()), v.nextNode(), a.push({ type: 2, index: ++o });
            i.append(h[f], F());
          }
        }
      } else if (i.nodeType === 8) if (i.data === ht) a.push({ type: 2, index: o });
      else {
        let h = -1;
        for (; (h = i.data.indexOf(g, h + 1)) !== -1; ) a.push({ type: 7, index: o }), h += g.length - 1;
      }
      o++;
    }
  }
  static createElement(t, e) {
    const s = b.createElement("template");
    return s.innerHTML = t, s;
  }
}
function E(r, t, e = r, s) {
  if (t === w) return t;
  let i = s !== void 0 ? e._$Co?.[s] : e._$Cl;
  const o = U(t) ? void 0 : t._$litDirective$;
  return i?.constructor !== o && (i?._$AO?.(!1), o === void 0 ? i = void 0 : (i = new o(r), i._$AT(r, e, s)), s !== void 0 ? (e._$Co ??= [])[s] = i : e._$Cl = i), i !== void 0 && (t = E(r, i._$AS(r, t.values), i, s)), t;
}
class Ct {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: s } = this._$AD, i = (t?.creationScope ?? b).importNode(e, !0);
    v.currentNode = i;
    let o = v.nextNode(), n = 0, l = 0, a = s[0];
    for (; a !== void 0; ) {
      if (n === a.index) {
        let c;
        a.type === 2 ? c = new M(o, o.nextSibling, this, t) : a.type === 1 ? c = new a.ctor(o, a.name, a.strings, this, t) : a.type === 6 && (c = new Ut(o, this, t)), this._$AV.push(c), a = s[++l];
      }
      n !== a?.index && (o = v.nextNode(), n++);
    }
    return v.currentNode = b, i;
  }
  p(t) {
    let e = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(t, s, e), e += s.strings.length - 2) : s._$AI(t[e])), e++;
  }
}
class M {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, e, s, i) {
    this.type = 2, this._$AH = d, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = s, this.options = i, this._$Cv = i?.isConnected ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const e = this._$AM;
    return e !== void 0 && t?.nodeType === 11 && (t = e.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, e = this) {
    t = E(this, t, e), U(t) ? t === d || t == null || t === "" ? (this._$AH !== d && this._$AR(), this._$AH = d) : t !== this._$AH && t !== w && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : wt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== d && U(this._$AH) ? this._$AA.nextSibling.data = t : this.T(b.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: e, _$litType$: s } = t, i = typeof s == "number" ? this._$AC(t) : (s.el === void 0 && (s.el = T.createElement(dt(s.h, s.h[0]), this.options)), s);
    if (this._$AH?._$AD === i) this._$AH.p(e);
    else {
      const o = new Ct(i, this), n = o.u(this.options);
      o.p(e), this.T(n), this._$AH = o;
    }
  }
  _$AC(t) {
    let e = ot.get(t.strings);
    return e === void 0 && ot.set(t.strings, e = new T(t)), e;
  }
  k(t) {
    W(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let s, i = 0;
    for (const o of t) i === e.length ? e.push(s = new M(this.O(F()), this.O(F()), this, this.options)) : s = e[i], s._$AI(o), i++;
    i < e.length && (this._$AR(s && s._$AB.nextSibling, i), e.length = i);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    for (this._$AP?.(!1, !0, e); t !== this._$AB; ) {
      const s = Q(t).nextSibling;
      Q(t).remove(), t = s;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class D {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, s, i, o) {
    this.type = 1, this._$AH = d, this._$AN = void 0, this.element = t, this.name = e, this._$AM = i, this.options = o, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = d;
  }
  _$AI(t, e = this, s, i) {
    const o = this.strings;
    let n = !1;
    if (o === void 0) t = E(this, t, e, 0), n = !U(t) || t !== this._$AH && t !== w, n && (this._$AH = t);
    else {
      const l = t;
      let a, c;
      for (t = o[0], a = 0; a < o.length - 1; a++) c = E(this, l[s + a], e, a), c === w && (c = this._$AH[a]), n ||= !U(c) || c !== this._$AH[a], c === d ? t = d : t !== d && (t += (c ?? "") + o[a + 1]), this._$AH[a] = c;
    }
    n && !i && this.j(t);
  }
  j(t) {
    t === d ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class kt extends D {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === d ? void 0 : t;
  }
}
class Pt extends D {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== d);
  }
}
class Ft extends D {
  constructor(t, e, s, i, o) {
    super(t, e, s, i, o), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = E(this, t, e, 0) ?? d) === w) return;
    const s = this._$AH, i = t === d && s !== d || t.capture !== s.capture || t.once !== s.once || t.passive !== s.passive, o = t !== d && (s === d || i);
    i && this.element.removeEventListener(this.name, this, s), o && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Ut {
  constructor(t, e, s) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    E(this, t);
  }
}
const Tt = q.litHtmlPolyfillSupport;
Tt?.(T, M), (q.litHtmlVersions ??= []).push("3.3.2");
const Mt = (r, t, e) => {
  const s = e?.renderBefore ?? t;
  let i = s._$litPart$;
  if (i === void 0) {
    const o = e?.renderBefore ?? null;
    s._$litPart$ = i = new M(t.insertBefore(F(), o), o, void 0, e ?? {});
  }
  return i._$AI(r), i;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const G = globalThis;
class P extends A {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Mt(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return w;
  }
}
P._$litElement$ = !0, P.finalized = !0, G.litElementHydrateSupport?.({ LitElement: P });
const Ot = G.litElementPolyfillSupport;
Ot?.({ LitElement: P });
(G.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Rt = (r) => (t, e) => {
  e !== void 0 ? e.addInitializer(() => {
    customElements.define(r, t);
  }) : customElements.define(r, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ht = { attribute: !0, type: String, converter: N, reflect: !1, hasChanged: V }, Nt = (r = Ht, t, e) => {
  const { kind: s, metadata: i } = e;
  let o = globalThis.litPropertyMetadata.get(i);
  if (o === void 0 && globalThis.litPropertyMetadata.set(i, o = /* @__PURE__ */ new Map()), s === "setter" && ((r = Object.create(r)).wrapped = !0), o.set(e.name, r), s === "accessor") {
    const { name: n } = e;
    return { set(l) {
      const a = t.get.call(this);
      t.set.call(this, l), this.requestUpdate(n, a, r, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(n, void 0, r, l), l;
    } };
  }
  if (s === "setter") {
    const { name: n } = e;
    return function(l) {
      const a = this[n];
      t.call(this, l), this.requestUpdate(n, a, r, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function K(r) {
  return (t, e) => typeof e == "object" ? Nt(r, t, e) : ((s, i, o) => {
    const n = i.hasOwnProperty(o);
    return i.constructor.createProperty(o, s), n ? Object.getOwnPropertyDescriptor(i, o) : void 0;
  })(r, t, e);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function O(r) {
  return K({ ...r, state: !0, attribute: !1 });
}
var Lt = Object.defineProperty, It = Object.getOwnPropertyDescriptor, _ = (r, t, e, s) => {
  for (var i = s > 1 ? void 0 : s ? It(t, e) : t, o = r.length - 1, n; o >= 0; o--)
    (n = r[o]) && (i = (s ? n(t, e, i) : n(i)) || i);
  return s && i && Lt(t, e, i), i;
};
const Dt = ["50ms", "100ms", "200ms", "500ms"], C = 255, m = 11, Bt = 10, zt = "input_text.eleksmaker_gif_preset_", nt = "input_number.eleksmaker_logo_flicker";
let u = class extends P {
  constructor() {
    super(...arguments), this.frames = [this.newFrame()], this.currentFrame = 0, this.lastLoadedValue = "", this.selectedSlot = 1, this.clearAfter = !1;
  }
  /**
   * Create an empty frame with all LEDs off and timing set to 200ms.
   *
   * @returns fresh frame
   */
  newFrame() {
    return {
      matrix: Array.from({ length: 7 }, () => Array(7).fill(!1)),
      circle: Array(12).fill(!1),
      timing: 2
    };
  }
  /**
   * HA calls this with the card config when the card is added to a dashboard.
   *
   * @param config - card config from yaml
   */
  setConfig(r) {
    if (!r.entity) throw new Error("entity required");
    this.config = r;
  }
  updated(r) {
    if (r.has("hass") && this.hass && this.config) {
      const t = this.hass.states?.[this.config.entity];
      t && t.state !== this.lastLoadedValue && this.lastLoadedValue === "" && this.loadFromHA();
    }
  }
  /**
   * Toggle a cell in the 7x7 matrix.
   *
   * @param r - row (0-6)
   * @param c - column (0-6)
   */
  toggleCell(r, t) {
    const e = this.frames[this.currentFrame];
    e.matrix[r][t] = !e.matrix[r][t], this.requestUpdate();
  }
  /**
   * Toggle a circle LED.
   *
   * @param i - LED index (0-11)
   */
  toggleCircle(r) {
    const t = this.frames[this.currentFrame];
    t.circle[r] = !t.circle[r], this.requestUpdate();
  }
  setTiming(r) {
    this.frames[this.currentFrame].timing = r, this.requestUpdate();
  }
  prevFrame() {
    this.currentFrame > 0 && this.currentFrame--;
  }
  nextFrame() {
    this.currentFrame < this.frames.length - 1 && this.currentFrame++;
  }
  addFrame() {
    (this.frames.length + 1) * m > C || (this.frames.splice(this.currentFrame + 1, 0, this.newFrame()), this.currentFrame++, this.requestUpdate());
  }
  duplicateFrame() {
    if ((this.frames.length + 1) * m > C) return;
    const r = this.frames[this.currentFrame], t = {
      matrix: r.matrix.map((e) => [...e]),
      circle: [...r.circle],
      timing: r.timing
    };
    this.frames.splice(this.currentFrame + 1, 0, t), this.currentFrame++, this.requestUpdate();
  }
  deleteFrame() {
    this.frames.length <= 1 || (this.frames.splice(this.currentFrame, 1), this.currentFrame >= this.frames.length && this.currentFrame--, this.requestUpdate());
  }
  clearFrame() {
    this.frames[this.currentFrame] = { ...this.newFrame(), timing: this.frames[this.currentFrame].timing }, this.requestUpdate();
  }
  /**
   * Encode all frames to the EleksWFD string format.
   * Each frame is 11 chars, 6 bits per char (value + 0x30).
   * Layout: bits 0-48 matrix, 49-60 circle, 61-62 timing.
   *
   * @returns encoded string
   */
  encode() {
    let r = "";
    for (let t = 0; t < this.frames.length; t++) {
      const e = this.frames[t];
      let s = 0n;
      for (let i = 0; i < 7; i++)
        for (let o = 0; o < 7; o++)
          e.matrix[i][o] && (s |= 1n << BigInt(i * 7 + o));
      for (let i = 0; i < 12; i++)
        e.circle[i] && (s |= 1n << BigInt(49 + i));
      s |= BigInt(e.timing) << 61n, t === 0 && this.clearAfter && (s |= 1n << 63n);
      for (let i = 0; i < m; i++) {
        const o = Number(s >> BigInt(i * 6) & 0x3Fn);
        r += String.fromCharCode(o + 48);
      }
    }
    return r;
  }
  /**
   * Decode an EleksWFD animation string into frames.
   *
   * @param str - encoded string
   * @returns array of frames (at least one)
   */
  decode(r) {
    const t = [];
    this.clearAfter = !1;
    for (let e = 0; e + m <= r.length; e += m) {
      let s = 0n;
      for (let o = 0; o < m; o++)
        s |= BigInt(r.charCodeAt(e + o) - 48) << BigInt(o * 6);
      const i = this.newFrame();
      for (let o = 0; o < 7; o++)
        for (let n = 0; n < 7; n++)
          i.matrix[o][n] = (s >> BigInt(o * 7 + n) & 1n) === 1n;
      for (let o = 0; o < 12; o++)
        i.circle[o] = (s >> BigInt(49 + o) & 1n) === 1n;
      i.timing = Number(s >> 61n & 0x3n), e === 0 && (this.clearAfter = (s >> 63n & 1n) === 1n), t.push(i);
    }
    return t.length ? t : [this.newFrame()];
  }
  async saveToHA() {
    const r = this.encode();
    await this.hass.callService("input_text", "set_value", {
      entity_id: this.config.entity,
      value: r
    }), this.lastLoadedValue = r;
  }
  loadFromHA() {
    const r = this.hass?.states?.[this.config.entity];
    r && (this.frames = this.decode(r.state), this.currentFrame = 0, this.lastLoadedValue = r.state, this.requestUpdate());
  }
  /**
   * Return the HA entity ID for a given preset slot number (1-10).
   */
  presetEntity(r) {
    return `${zt}${r}`;
  }
  /**
   * Return the current stored value of a preset slot, or empty string.
   */
  presetValue(r) {
    return this.hass?.states?.[this.presetEntity(r)]?.state ?? "";
  }
  /**
   * Return a label for a preset slot showing the frame count.
   */
  presetLabel(r) {
    const t = this.presetValue(r);
    if (!t) return `Slot ${r}: empty`;
    const e = Math.floor(t.length / m);
    return `Slot ${r}: ${e} frame${e === 1 ? "" : "s"}`;
  }
  async loadPreset() {
    const r = this.presetValue(this.selectedSlot);
    r && (this.frames = this.decode(r), this.currentFrame = 0, this.requestUpdate());
  }
  async savePreset() {
    await this.hass.callService("input_text", "set_value", {
      entity_id: this.presetEntity(this.selectedSlot),
      value: this.encode()
    });
  }
  async clearPreset() {
    await this.hass.callService("input_text", "set_value", {
      entity_id: this.presetEntity(this.selectedSlot),
      value: ""
    });
  }
  /**
   * Current flicker rate from HA (flickers per second).
   */
  flickerRate() {
    const r = this.hass?.states?.[nt]?.state, t = r != null ? Number(r) : 0;
    return isFinite(t) ? t : 0;
  }
  async setFlickerRate(r) {
    if (!isFinite(r)) return;
    const t = Math.max(0, Math.min(100, Math.round(r)));
    await this.hass.callService("input_number", "set_value", {
      entity_id: nt,
      value: t
    });
  }
  render() {
    if (!this.config || !this.hass) return x``;
    const r = this.frames[this.currentFrame], t = this.config.title ?? "EleksMaker GIF Editor", e = this.frames.length * m, s = (this.frames.length + 1) * m > C, i = (o, n) => x`
      <div class="led ${n} ${r.circle[o] ? "on" : ""}"
           @click=${() => this.toggleCircle(o)}></div>
    `;
    return x`
      <ha-card .header=${t}>
        <div style="padding: 16px;">
          <div class="header">
            <div class="frame-nav">
              <button class="secondary" @click=${this.prevFrame} ?disabled=${this.currentFrame === 0}>◀</button>
              <span>Frame ${this.currentFrame + 1} / ${this.frames.length}</span>
              <button class="secondary" @click=${this.nextFrame} ?disabled=${this.currentFrame === this.frames.length - 1}>▶</button>
            </div>
            <button @click=${this.addFrame} ?disabled=${s}>+ New</button>
            <button @click=${this.duplicateFrame} ?disabled=${s}>Dup</button>
            <button class="secondary" @click=${this.clearFrame}>Clear</button>
            <button class="secondary" @click=${this.deleteFrame} ?disabled=${this.frames.length <= 1}>Delete</button>
          </div>

          <div class="timing">
            ${Dt.map((o, n) => x`
              <button class=${r.timing === n ? "active" : "secondary"} @click=${() => this.setTiming(n)}>${o}</button>
            `)}
          </div>

          <div class="display-area">
            ${i(0, "led-top-0")}
            ${i(1, "led-top-1")}
            ${i(2, "led-top-2")}
            ${i(3, "led-right-3")}
            ${i(4, "led-right-4")}
            ${i(5, "led-right-5")}
            ${i(6, "led-bottom-6")}
            ${i(7, "led-bottom-7")}
            ${i(8, "led-bottom-8")}
            ${i(9, "led-left-9")}
            ${i(10, "led-left-10")}
            ${i(11, "led-left-11")}

            <div class="matrix">
              ${r.matrix.flat().map((o, n) => {
      const l = Math.floor(n / 7), a = n % 7;
      return x`
                  <div class="cell ${o ? "on" : ""}"
                       @click=${() => this.toggleCell(l, a)}></div>
                `;
    })}
            </div>
          </div>

          <div class="actions">
            <button @click=${this.saveToHA}>Save to HA</button>
            <button class="secondary" @click=${this.loadFromHA}>Reload from HA</button>
            <label style="display: flex; align-items: center; gap: 4px; margin-left: 8px;">
              <input
                type="checkbox"
                .checked=${this.clearAfter}
                @change=${(o) => {
      this.clearAfter = o.target.checked;
    }}
              >
              <span>Clear after last frame</span>
            </label>
          </div>

          <div class="presets">
            <div class="presets-label">Presets</div>
            <select
              .value=${String(this.selectedSlot)}
              @change=${(o) => {
      this.selectedSlot = Number(o.target.value);
    }}
            >
              ${Array.from({ length: Bt }, (o, n) => n + 1).map((o) => x`
                <option value=${o} ?selected=${o === this.selectedSlot}>${this.presetLabel(o)}</option>
              `)}
            </select>
            <button @click=${this.loadPreset} ?disabled=${!this.presetValue(this.selectedSlot)}>Load</button>
            <button @click=${this.savePreset}>Save</button>
            <button class="secondary" @click=${this.clearPreset} ?disabled=${!this.presetValue(this.selectedSlot)}>Clear</button>
          </div>

          <div class="presets">
            <div class="presets-label">Flicker</div>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              .value=${String(this.flickerRate())}
              @change=${(o) => this.setFlickerRate(Number(o.target.value))}
              style="width: 70px; padding: 6px; background: var( --card-background-color ); color: var( --primary-text-color ); border: 1px solid var( --divider-color ); border-radius: 4px;"
            >
            <span style="font-size: 13px; color: var( --secondary-text-color );">flickers/sec (0 = off)</span>
          </div>

          <div class="meta ${e > C ? "warn" : ""}">
            ${e}/${C} chars · ${this.frames.length} frames · entity: ${this.config.entity}
          </div>
        </div>
      </ha-card>
    `;
  }
};
u.styles = ut`
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
    .display-area {
      position: relative;
      width: 216px;    /* 168 matrix + 2*(12 border + 12 gap) */
      height: 216px;
      margin: 8px 0;
      background: #1a1a1a;
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

    /* Top row: 72 px wide, 12 px tall, three segments */
    .led-top-0 { top: 0; left: 0;    width: 72px; height: 12px;
      clip-path: polygon( 0 0, 100% 0, 100% 100%, 12px 100% ); }
    .led-top-1 { top: 0; left: 72px; width: 72px; height: 12px; }
    .led-top-2 { top: 0; left: 144px; width: 72px; height: 12px;
      clip-path: polygon( 0 0, 100% 0, calc( 100% - 12px ) 100%, 0 100% ); }

    /* Right column: 12 px wide, 72 px tall */
    .led-right-3 { top: 0;    left: 204px; width: 12px; height: 72px;
      clip-path: polygon( 100% 0, 100% 100%, 0 100%, 0 12px ); }
    .led-right-4 { top: 72px; left: 204px; width: 12px; height: 72px; }
    .led-right-5 { top: 144px; left: 204px; width: 12px; height: 72px;
      clip-path: polygon( 0 0, 100% 0, 100% 100%, 0 calc( 100% - 12px ) ); }

    /* Bottom row (display L→R uses array indices 8, 7, 6) */
    .led-bottom-8 { bottom: 0; left: 0;    width: 72px; height: 12px;
      clip-path: polygon( 12px 0, 100% 0, 100% 100%, 0 100% ); }
    .led-bottom-7 { bottom: 0; left: 72px; width: 72px; height: 12px; }
    .led-bottom-6 { bottom: 0; left: 144px; width: 72px; height: 12px;
      clip-path: polygon( 0 0, calc( 100% - 12px ) 0, 100% 100%, 0 100% ); }

    /* Left column (display T→B uses array indices 11, 10, 9) */
    .led-left-11 { top: 0;    left: 0; width: 12px; height: 72px;
      clip-path: polygon( 0 0, 100% 12px, 100% 100%, 0 100% ); }
    .led-left-10 { top: 72px; left: 0; width: 12px; height: 72px; }
    .led-left-9  { top: 144px; left: 0; width: 12px; height: 72px;
      clip-path: polygon( 0 0, 100% 0, 100% calc( 100% - 12px ), 0 100% ); }
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
_([
  K({ attribute: !1 })
], u.prototype, "hass", 2);
_([
  K({ attribute: !1 })
], u.prototype, "config", 2);
_([
  O()
], u.prototype, "frames", 2);
_([
  O()
], u.prototype, "currentFrame", 2);
_([
  O()
], u.prototype, "lastLoadedValue", 2);
_([
  O()
], u.prototype, "selectedSlot", 2);
_([
  O()
], u.prototype, "clearAfter", 2);
u = _([
  Rt("eleksmaker-gif-editor")
], u);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "eleksmaker-gif-editor",
  name: "EleksMaker GIF Editor",
  description: "7x7 matrix + circle LED animation editor for EleksWFD"
});
export {
  u as EleksmakerGifEditor
};
