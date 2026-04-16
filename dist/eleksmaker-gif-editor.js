/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const T = globalThis, B = T.ShadowRoot && (T.ShadyCSS === void 0 || T.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, j = Symbol(), J = /* @__PURE__ */ new WeakMap();
let ot = class {
  constructor(t, e, s) {
    if (this._$cssResult$ = !0, s !== j) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (B && t === void 0) {
      const s = e !== void 0 && e.length === 1;
      s && (t = J.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), s && J.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const dt = (r) => new ot(typeof r == "string" ? r : r + "", void 0, j), pt = (r, ...t) => {
  const e = r.length === 1 ? r[0] : t.reduce((s, i, n) => s + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + r[n + 1], r[0]);
  return new ot(e, r, j);
}, ut = (r, t) => {
  if (B) r.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const s = document.createElement("style"), i = T.litNonce;
    i !== void 0 && s.setAttribute("nonce", i), s.textContent = e.cssText, r.appendChild(s);
  }
}, K = B ? (r) => r : (r) => r instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const s of t.cssRules) e += s.cssText;
  return dt(e);
})(r) : r;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: ft, defineProperty: $t, getOwnPropertyDescriptor: mt, getOwnPropertyNames: gt, getOwnPropertySymbols: _t, getPrototypeOf: vt } = Object, L = globalThis, X = L.trustedTypes, yt = X ? X.emptyScript : "", bt = L.reactiveElementPolyfillSupport, P = (r, t) => r, N = { toAttribute(r, t) {
  switch (t) {
    case Boolean:
      r = r ? yt : null;
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
} }, V = (r, t) => !ft(r, t), Y = { attribute: !0, type: String, converter: N, reflect: !1, useDefault: !1, hasChanged: V };
Symbol.metadata ??= Symbol("metadata"), L.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let x = class extends HTMLElement {
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
    const { get: i, set: n } = mt(this.prototype, t) ?? { get() {
      return this[e];
    }, set(o) {
      this[e] = o;
    } };
    return { get: i, set(o) {
      const l = i?.call(this);
      n?.call(this, o), this.requestUpdate(t, l, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? Y;
  }
  static _$Ei() {
    if (this.hasOwnProperty(P("elementProperties"))) return;
    const t = vt(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(P("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(P("properties"))) {
      const e = this.properties, s = [...gt(e), ..._t(e)];
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
      for (const i of s) e.unshift(K(i));
    } else t !== void 0 && e.push(K(t));
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
    return ut(t, this.constructor.elementStyles), t;
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
      const n = (s.converter?.toAttribute !== void 0 ? s.converter : N).toAttribute(e, s.type);
      this._$Em = t, n == null ? this.removeAttribute(i) : this.setAttribute(i, n), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const s = this.constructor, i = s._$Eh.get(t);
    if (i !== void 0 && this._$Em !== i) {
      const n = s.getPropertyOptions(i), o = typeof n.converter == "function" ? { fromAttribute: n.converter } : n.converter?.fromAttribute !== void 0 ? n.converter : N;
      this._$Em = i;
      const l = o.fromAttribute(e, n.type);
      this[i] = l ?? this._$Ej?.get(i) ?? l, this._$Em = null;
    }
  }
  requestUpdate(t, e, s, i = !1, n) {
    if (t !== void 0) {
      const o = this.constructor;
      if (i === !1 && (n = this[t]), s ??= o.getPropertyOptions(t), !((s.hasChanged ?? V)(n, e) || s.useDefault && s.reflect && n === this._$Ej?.get(t) && !this.hasAttribute(o._$Eu(t, s)))) return;
      this.C(t, e, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: s, reflect: i, wrapped: n }, o) {
    s && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, o ?? e ?? this[t]), n !== !0 || o !== void 0) || (this._$AL.has(t) || (this.hasUpdated || s || (e = void 0), this._$AL.set(t, e)), i === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
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
        for (const [i, n] of this._$Ep) this[i] = n;
        this._$Ep = void 0;
      }
      const s = this.constructor.elementProperties;
      if (s.size > 0) for (const [i, n] of s) {
        const { wrapped: o } = n, l = this[i];
        o !== !0 || this._$AL.has(i) || l === void 0 || this.C(i, void 0, n, l);
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
x.elementStyles = [], x.shadowRootOptions = { mode: "open" }, x[P("elementProperties")] = /* @__PURE__ */ new Map(), x[P("finalized")] = /* @__PURE__ */ new Map(), bt?.({ ReactiveElement: x }), (L.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const q = globalThis, Q = (r) => r, R = q.trustedTypes, tt = R ? R.createPolicy("lit-html", { createHTML: (r) => r }) : void 0, at = "$lit$", g = `lit$${Math.random().toFixed(9).slice(2)}$`, lt = "?" + g, At = `<${lt}>`, y = document, F = () => y.createComment(""), U = (r) => r === null || typeof r != "object" && typeof r != "function", W = Array.isArray, xt = (r) => W(r) || typeof r?.[Symbol.iterator] == "function", D = `[ 	
\f\r]`, w = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, et = /-->/g, st = />/g, _ = RegExp(`>|${D}(?:([^\\s"'>=/]+)(${D}*=${D}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), it = /'/g, rt = /"/g, ht = /^(?:script|style|textarea|title)$/i, Et = (r) => (t, ...e) => ({ _$litType$: r, strings: t, values: e }), A = Et(1), E = Symbol.for("lit-noChange"), d = Symbol.for("lit-nothing"), nt = /* @__PURE__ */ new WeakMap(), v = y.createTreeWalker(y, 129);
function ct(r, t) {
  if (!W(r) || !r.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return tt !== void 0 ? tt.createHTML(t) : t;
}
const St = (r, t) => {
  const e = r.length - 1, s = [];
  let i, n = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = w;
  for (let l = 0; l < e; l++) {
    const a = r[l];
    let c, p, h = -1, u = 0;
    for (; u < a.length && (o.lastIndex = u, p = o.exec(a), p !== null); ) u = o.lastIndex, o === w ? p[1] === "!--" ? o = et : p[1] !== void 0 ? o = st : p[2] !== void 0 ? (ht.test(p[2]) && (i = RegExp("</" + p[2], "g")), o = _) : p[3] !== void 0 && (o = _) : o === _ ? p[0] === ">" ? (o = i ?? w, h = -1) : p[1] === void 0 ? h = -2 : (h = o.lastIndex - p[2].length, c = p[1], o = p[3] === void 0 ? _ : p[3] === '"' ? rt : it) : o === rt || o === it ? o = _ : o === et || o === st ? o = w : (o = _, i = void 0);
    const m = o === _ && r[l + 1].startsWith("/>") ? " " : "";
    n += o === w ? a + At : h >= 0 ? (s.push(c), a.slice(0, h) + at + a.slice(h) + g + m) : a + g + (h === -2 ? l : m);
  }
  return [ct(r, n + (r[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), s];
};
class O {
  constructor({ strings: t, _$litType$: e }, s) {
    let i;
    this.parts = [];
    let n = 0, o = 0;
    const l = t.length - 1, a = this.parts, [c, p] = St(t, e);
    if (this.el = O.createElement(c, s), v.currentNode = this.el.content, e === 2 || e === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (i = v.nextNode()) !== null && a.length < l; ) {
      if (i.nodeType === 1) {
        if (i.hasAttributes()) for (const h of i.getAttributeNames()) if (h.endsWith(at)) {
          const u = p[o++], m = i.getAttribute(h).split(g), M = /([.?@])?(.*)/.exec(u);
          a.push({ type: 1, index: n, name: M[2], strings: m, ctor: M[1] === "." ? Ct : M[1] === "?" ? Pt : M[1] === "@" ? kt : I }), i.removeAttribute(h);
        } else h.startsWith(g) && (a.push({ type: 6, index: n }), i.removeAttribute(h));
        if (ht.test(i.tagName)) {
          const h = i.textContent.split(g), u = h.length - 1;
          if (u > 0) {
            i.textContent = R ? R.emptyScript : "";
            for (let m = 0; m < u; m++) i.append(h[m], F()), v.nextNode(), a.push({ type: 2, index: ++n });
            i.append(h[u], F());
          }
        }
      } else if (i.nodeType === 8) if (i.data === lt) a.push({ type: 2, index: n });
      else {
        let h = -1;
        for (; (h = i.data.indexOf(g, h + 1)) !== -1; ) a.push({ type: 7, index: n }), h += g.length - 1;
      }
      n++;
    }
  }
  static createElement(t, e) {
    const s = y.createElement("template");
    return s.innerHTML = t, s;
  }
}
function S(r, t, e = r, s) {
  if (t === E) return t;
  let i = s !== void 0 ? e._$Co?.[s] : e._$Cl;
  const n = U(t) ? void 0 : t._$litDirective$;
  return i?.constructor !== n && (i?._$AO?.(!1), n === void 0 ? i = void 0 : (i = new n(r), i._$AT(r, e, s)), s !== void 0 ? (e._$Co ??= [])[s] = i : e._$Cl = i), i !== void 0 && (t = S(r, i._$AS(r, t.values), i, s)), t;
}
class wt {
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
    const { el: { content: e }, parts: s } = this._$AD, i = (t?.creationScope ?? y).importNode(e, !0);
    v.currentNode = i;
    let n = v.nextNode(), o = 0, l = 0, a = s[0];
    for (; a !== void 0; ) {
      if (o === a.index) {
        let c;
        a.type === 2 ? c = new H(n, n.nextSibling, this, t) : a.type === 1 ? c = new a.ctor(n, a.name, a.strings, this, t) : a.type === 6 && (c = new Ft(n, this, t)), this._$AV.push(c), a = s[++l];
      }
      o !== a?.index && (n = v.nextNode(), o++);
    }
    return v.currentNode = y, i;
  }
  p(t) {
    let e = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(t, s, e), e += s.strings.length - 2) : s._$AI(t[e])), e++;
  }
}
class H {
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
    t = S(this, t, e), U(t) ? t === d || t == null || t === "" ? (this._$AH !== d && this._$AR(), this._$AH = d) : t !== this._$AH && t !== E && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : xt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== d && U(this._$AH) ? this._$AA.nextSibling.data = t : this.T(y.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: e, _$litType$: s } = t, i = typeof s == "number" ? this._$AC(t) : (s.el === void 0 && (s.el = O.createElement(ct(s.h, s.h[0]), this.options)), s);
    if (this._$AH?._$AD === i) this._$AH.p(e);
    else {
      const n = new wt(i, this), o = n.u(this.options);
      n.p(e), this.T(o), this._$AH = n;
    }
  }
  _$AC(t) {
    let e = nt.get(t.strings);
    return e === void 0 && nt.set(t.strings, e = new O(t)), e;
  }
  k(t) {
    W(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let s, i = 0;
    for (const n of t) i === e.length ? e.push(s = new H(this.O(F()), this.O(F()), this, this.options)) : s = e[i], s._$AI(n), i++;
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
class I {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, s, i, n) {
    this.type = 1, this._$AH = d, this._$AN = void 0, this.element = t, this.name = e, this._$AM = i, this.options = n, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = d;
  }
  _$AI(t, e = this, s, i) {
    const n = this.strings;
    let o = !1;
    if (n === void 0) t = S(this, t, e, 0), o = !U(t) || t !== this._$AH && t !== E, o && (this._$AH = t);
    else {
      const l = t;
      let a, c;
      for (t = n[0], a = 0; a < n.length - 1; a++) c = S(this, l[s + a], e, a), c === E && (c = this._$AH[a]), o ||= !U(c) || c !== this._$AH[a], c === d ? t = d : t !== d && (t += (c ?? "") + n[a + 1]), this._$AH[a] = c;
    }
    o && !i && this.j(t);
  }
  j(t) {
    t === d ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Ct extends I {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === d ? void 0 : t;
  }
}
class Pt extends I {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== d);
  }
}
class kt extends I {
  constructor(t, e, s, i, n) {
    super(t, e, s, i, n), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = S(this, t, e, 0) ?? d) === E) return;
    const s = this._$AH, i = t === d && s !== d || t.capture !== s.capture || t.once !== s.once || t.passive !== s.passive, n = t !== d && (s === d || i);
    i && this.element.removeEventListener(this.name, this, s), n && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Ft {
  constructor(t, e, s) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    S(this, t);
  }
}
const Ut = q.litHtmlPolyfillSupport;
Ut?.(O, H), (q.litHtmlVersions ??= []).push("3.3.2");
const Ot = (r, t, e) => {
  const s = e?.renderBefore ?? t;
  let i = s._$litPart$;
  if (i === void 0) {
    const n = e?.renderBefore ?? null;
    s._$litPart$ = i = new H(t.insertBefore(F(), n), n, void 0, e ?? {});
  }
  return i._$AI(r), i;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const G = globalThis;
class k extends x {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Ot(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return E;
  }
}
k._$litElement$ = !0, k.finalized = !0, G.litElementHydrateSupport?.({ LitElement: k });
const Ht = G.litElementPolyfillSupport;
Ht?.({ LitElement: k });
(G.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Mt = (r) => (t, e) => {
  e !== void 0 ? e.addInitializer(() => {
    customElements.define(r, t);
  }) : customElements.define(r, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Tt = { attribute: !0, type: String, converter: N, reflect: !1, hasChanged: V }, Nt = (r = Tt, t, e) => {
  const { kind: s, metadata: i } = e;
  let n = globalThis.litPropertyMetadata.get(i);
  if (n === void 0 && globalThis.litPropertyMetadata.set(i, n = /* @__PURE__ */ new Map()), s === "setter" && ((r = Object.create(r)).wrapped = !0), n.set(e.name, r), s === "accessor") {
    const { name: o } = e;
    return { set(l) {
      const a = t.get.call(this);
      t.set.call(this, l), this.requestUpdate(o, a, r, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(o, void 0, r, l), l;
    } };
  }
  if (s === "setter") {
    const { name: o } = e;
    return function(l) {
      const a = this[o];
      t.call(this, l), this.requestUpdate(o, a, r, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function Z(r) {
  return (t, e) => typeof e == "object" ? Nt(r, t, e) : ((s, i, n) => {
    const o = i.hasOwnProperty(n);
    return i.constructor.createProperty(n, s), o ? Object.getOwnPropertyDescriptor(i, n) : void 0;
  })(r, t, e);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function z(r) {
  return Z({ ...r, state: !0, attribute: !1 });
}
var Rt = Object.defineProperty, Lt = Object.getOwnPropertyDescriptor, b = (r, t, e, s) => {
  for (var i = s > 1 ? void 0 : s ? Lt(t, e) : t, n = r.length - 1, o; n >= 0; n--)
    (o = r[n]) && (i = (s ? o(t, e, i) : o(i)) || i);
  return s && i && Rt(t, e, i), i;
};
const It = ["50ms", "100ms", "200ms", "500ms"], C = 255, f = 11, zt = 10, Dt = "input_text.eleksmaker_gif_preset_";
let $ = class extends k {
  constructor() {
    super(...arguments), this.frames = [this.newFrame()], this.currentFrame = 0, this.lastLoadedValue = "", this.selectedSlot = 1;
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
    (this.frames.length + 1) * f > C || (this.frames.splice(this.currentFrame + 1, 0, this.newFrame()), this.currentFrame++, this.requestUpdate());
  }
  duplicateFrame() {
    if ((this.frames.length + 1) * f > C) return;
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
    for (const t of this.frames) {
      let e = 0n;
      for (let s = 0; s < 7; s++)
        for (let i = 0; i < 7; i++)
          t.matrix[s][i] && (e |= 1n << BigInt(s * 7 + i));
      for (let s = 0; s < 12; s++)
        t.circle[s] && (e |= 1n << BigInt(49 + s));
      e |= BigInt(t.timing) << 61n;
      for (let s = 0; s < f; s++) {
        const i = Number(e >> BigInt(s * 6) & 0x3Fn);
        r += String.fromCharCode(i + 48);
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
    for (let e = 0; e + f <= r.length; e += f) {
      let s = 0n;
      for (let n = 0; n < f; n++)
        s |= BigInt(r.charCodeAt(e + n) - 48) << BigInt(n * 6);
      const i = this.newFrame();
      for (let n = 0; n < 7; n++)
        for (let o = 0; o < 7; o++)
          i.matrix[n][o] = (s >> BigInt(n * 7 + o) & 1n) === 1n;
      for (let n = 0; n < 12; n++)
        i.circle[n] = (s >> BigInt(49 + n) & 1n) === 1n;
      i.timing = Number(s >> 61n & 0x3n), t.push(i);
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
    return `${Dt}${r}`;
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
    const e = Math.floor(t.length / f);
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
  render() {
    if (!this.config || !this.hass) return A``;
    const r = this.frames[this.currentFrame], t = this.config.title ?? "EleksMaker GIF Editor", e = this.frames.length * f, s = (this.frames.length + 1) * f > C, i = (n) => A`
      <div class="led-circle ${r.circle[n] ? "on" : ""}"
           @click=${() => this.toggleCircle(n)}></div>
    `;
    return A`
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
            ${It.map((n, o) => A`
              <button class=${r.timing === o ? "active" : "secondary"} @click=${() => this.setTiming(o)}>${n}</button>
            `)}
          </div>

          <div class="display-area">
            <div class="horizontal-side">
              ${i(0)}${i(1)}${i(2)}
            </div>
            <div class="middle-row">
              <div class="vertical-side">
                ${i(11)}${i(10)}${i(9)}
              </div>
              <div class="matrix">
                ${r.matrix.flat().map((n, o) => {
      const l = Math.floor(o / 7), a = o % 7;
      return A`
                    <div class="cell ${n ? "on" : ""}"
                         @click=${() => this.toggleCell(l, a)}></div>
                  `;
    })}
              </div>
              <div class="vertical-side">
                ${i(3)}${i(4)}${i(5)}
              </div>
            </div>
            <div class="horizontal-side">
              ${i(8)}${i(7)}${i(6)}
            </div>
          </div>

          <div class="actions">
            <button @click=${this.saveToHA}>Save to HA</button>
            <button class="secondary" @click=${this.loadFromHA}>Reload from HA</button>
          </div>

          <div class="presets">
            <div class="presets-label">Presets</div>
            <select
              .value=${String(this.selectedSlot)}
              @change=${(n) => {
      this.selectedSlot = Number(n.target.value);
    }}
            >
              ${Array.from({ length: zt }, (n, o) => o + 1).map((n) => A`
                <option value=${n} ?selected=${n === this.selectedSlot}>${this.presetLabel(n)}</option>
              `)}
            </select>
            <button @click=${this.loadPreset} ?disabled=${!this.presetValue(this.selectedSlot)}>Load</button>
            <button @click=${this.savePreset}>Save</button>
            <button class="secondary" @click=${this.clearPreset} ?disabled=${!this.presetValue(this.selectedSlot)}>Clear</button>
          </div>

          <div class="meta ${e > C ? "warn" : ""}">
            ${e}/${C} chars · ${this.frames.length} frames · entity: ${this.config.entity}
          </div>
        </div>
      </ha-card>
    `;
  }
};
$.styles = pt`
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
    .led-circle {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      cursor: pointer;
      transition: background 0.1s;
      flex-shrink: 0;
    }
    .led-circle.on {
      background: #ffffff;
      box-shadow: 0 0 6px rgba( 255, 255, 255, 0.8 );
    }
    .led-circle:hover {
      outline: 1px solid var( --accent-color );
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
b([
  Z({ attribute: !1 })
], $.prototype, "hass", 2);
b([
  Z({ attribute: !1 })
], $.prototype, "config", 2);
b([
  z()
], $.prototype, "frames", 2);
b([
  z()
], $.prototype, "currentFrame", 2);
b([
  z()
], $.prototype, "lastLoadedValue", 2);
b([
  z()
], $.prototype, "selectedSlot", 2);
$ = b([
  Mt("eleksmaker-gif-editor")
], $);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "eleksmaker-gif-editor",
  name: "EleksMaker GIF Editor",
  description: "7x7 matrix + circle LED animation editor for EleksWFD"
});
export {
  $ as EleksmakerGifEditor
};
