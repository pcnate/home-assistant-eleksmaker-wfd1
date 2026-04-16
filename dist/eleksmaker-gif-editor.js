/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const H = globalThis, j = H.ShadowRoot && (H.ShadyCSS === void 0 || H.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, V = Symbol(), X = /* @__PURE__ */ new WeakMap();
let dt = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== V) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (j && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = X.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && X.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const $t = (s) => new dt(typeof s == "string" ? s : s + "", void 0, V), gt = (s, ...t) => {
  const e = s.length === 1 ? s[0] : t.reduce((i, r, o) => i + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + s[o + 1], s[0]);
  return new dt(e, s, V);
}, vt = (s, t) => {
  if (j) s.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), r = H.litNonce;
    r !== void 0 && i.setAttribute("nonce", r), i.textContent = e.cssText, s.appendChild(i);
  }
}, Z = j ? (s) => s : (s) => s instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return $t(e);
})(s) : s;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: yt, defineProperty: _t, getOwnPropertyDescriptor: bt, getOwnPropertyNames: xt, getOwnPropertySymbols: wt, getPrototypeOf: At } = Object, z = globalThis, J = z.trustedTypes, Et = J ? J.emptyScript : "", St = z.reactiveElementPolyfillSupport, T = (s, t) => s, I = { toAttribute(s, t) {
  switch (t) {
    case Boolean:
      s = s ? Et : null;
      break;
    case Object:
    case Array:
      s = s == null ? s : JSON.stringify(s);
  }
  return s;
}, fromAttribute(s, t) {
  let e = s;
  switch (t) {
    case Boolean:
      e = s !== null;
      break;
    case Number:
      e = s === null ? null : Number(s);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(s);
      } catch {
        e = null;
      }
  }
  return e;
} }, q = (s, t) => !yt(s, t), Q = { attribute: !0, type: String, converter: I, reflect: !1, useDefault: !1, hasChanged: q };
Symbol.metadata ??= Symbol("metadata"), z.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let A = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = Q) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = Symbol(), r = this.getPropertyDescriptor(t, i, e);
      r !== void 0 && _t(this.prototype, t, r);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: r, set: o } = bt(this.prototype, t) ?? { get() {
      return this[e];
    }, set(n) {
      this[e] = n;
    } };
    return { get: r, set(n) {
      const a = r?.call(this);
      o?.call(this, n), this.requestUpdate(t, a, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? Q;
  }
  static _$Ei() {
    if (this.hasOwnProperty(T("elementProperties"))) return;
    const t = At(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(T("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(T("properties"))) {
      const e = this.properties, i = [...xt(e), ...wt(e)];
      for (const r of i) this.createProperty(r, e[r]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [i, r] of e) this.elementProperties.set(i, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, i] of this.elementProperties) {
      const r = this._$Eu(e, i);
      r !== void 0 && this._$Eh.set(r, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const i = new Set(t.flat(1 / 0).reverse());
      for (const r of i) e.unshift(Z(r));
    } else t !== void 0 && e.push(Z(t));
    return e;
  }
  static _$Eu(t, e) {
    const i = e.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof t == "string" ? t.toLowerCase() : void 0;
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
    for (const i of e.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return vt(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t) => t.hostDisconnected?.());
  }
  attributeChangedCallback(t, e, i) {
    this._$AK(t, i);
  }
  _$ET(t, e) {
    const i = this.constructor.elementProperties.get(t), r = this.constructor._$Eu(t, i);
    if (r !== void 0 && i.reflect === !0) {
      const o = (i.converter?.toAttribute !== void 0 ? i.converter : I).toAttribute(e, i.type);
      this._$Em = t, o == null ? this.removeAttribute(r) : this.setAttribute(r, o), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const i = this.constructor, r = i._$Eh.get(t);
    if (r !== void 0 && this._$Em !== r) {
      const o = i.getPropertyOptions(r), n = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : I;
      this._$Em = r;
      const a = n.fromAttribute(e, o.type);
      this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
    }
  }
  requestUpdate(t, e, i, r = !1, o) {
    if (t !== void 0) {
      const n = this.constructor;
      if (r === !1 && (o = this[t]), i ??= n.getPropertyOptions(t), !((i.hasChanged ?? q)(o, e) || i.useDefault && i.reflect && o === this._$Ej?.get(t) && !this.hasAttribute(n._$Eu(t, i)))) return;
      this.C(t, e, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: i, reflect: r, wrapped: o }, n) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, n ?? e ?? this[t]), o !== !0 || n !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (e = void 0), this._$AL.set(t, e)), r === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
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
        for (const [r, o] of this._$Ep) this[r] = o;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [r, o] of i) {
        const { wrapped: n } = o, a = this[r];
        n !== !0 || this._$AL.has(r) || a === void 0 || this.C(r, void 0, o, a);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), this._$EO?.forEach((i) => i.hostUpdate?.()), this.update(e)) : this._$EM();
    } catch (i) {
      throw t = !1, this._$EM(), i;
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
A.elementStyles = [], A.shadowRootOptions = { mode: "open" }, A[T("elementProperties")] = /* @__PURE__ */ new Map(), A[T("finalized")] = /* @__PURE__ */ new Map(), St?.({ ReactiveElement: A }), (z.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const W = globalThis, tt = (s) => s, L = W.trustedTypes, et = L ? L.createPolicy("lit-html", { createHTML: (s) => s }) : void 0, pt = "$lit$", y = `lit$${Math.random().toFixed(9).slice(2)}$`, ut = "?" + y, Ct = `<${ut}>`, x = document, M = () => x.createComment(""), U = (s) => s === null || typeof s != "object" && typeof s != "function", G = Array.isArray, Pt = (s) => G(s) || typeof s?.[Symbol.iterator] == "function", B = `[ 	
\f\r]`, P = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, st = /-->/g, it = />/g, _ = RegExp(`>|${B}(?:([^\\s"'>=/]+)(${B}*=${B}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), rt = /'/g, ot = /"/g, mt = /^(?:script|style|textarea|title)$/i, kt = (s) => (t, ...e) => ({ _$litType$: s, strings: t, values: e }), v = kt(1), E = Symbol.for("lit-noChange"), p = Symbol.for("lit-nothing"), nt = /* @__PURE__ */ new WeakMap(), b = x.createTreeWalker(x, 129);
function ft(s, t) {
  if (!G(s) || !s.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return et !== void 0 ? et.createHTML(t) : t;
}
const Tt = (s, t) => {
  const e = s.length - 1, i = [];
  let r, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", n = P;
  for (let a = 0; a < e; a++) {
    const l = s[a];
    let c, d, h = -1, m = 0;
    for (; m < l.length && (n.lastIndex = m, d = n.exec(l), d !== null); ) m = n.lastIndex, n === P ? d[1] === "!--" ? n = st : d[1] !== void 0 ? n = it : d[2] !== void 0 ? (mt.test(d[2]) && (r = RegExp("</" + d[2], "g")), n = _) : d[3] !== void 0 && (n = _) : n === _ ? d[0] === ">" ? (n = r ?? P, h = -1) : d[1] === void 0 ? h = -2 : (h = n.lastIndex - d[2].length, c = d[1], n = d[3] === void 0 ? _ : d[3] === '"' ? ot : rt) : n === ot || n === rt ? n = _ : n === st || n === it ? n = P : (n = _, r = void 0);
    const g = n === _ && s[a + 1].startsWith("/>") ? " " : "";
    o += n === P ? l + Ct : h >= 0 ? (i.push(c), l.slice(0, h) + pt + l.slice(h) + y + g) : l + y + (h === -2 ? a : g);
  }
  return [ft(s, o + (s[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class N {
  constructor({ strings: t, _$litType$: e }, i) {
    let r;
    this.parts = [];
    let o = 0, n = 0;
    const a = t.length - 1, l = this.parts, [c, d] = Tt(t, e);
    if (this.el = N.createElement(c, i), b.currentNode = this.el.content, e === 2 || e === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (r = b.nextNode()) !== null && l.length < a; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const h of r.getAttributeNames()) if (h.endsWith(pt)) {
          const m = d[n++], g = r.getAttribute(h).split(y), O = /([.?@])?(.*)/.exec(m);
          l.push({ type: 1, index: o, name: O[2], strings: g, ctor: O[1] === "." ? Mt : O[1] === "?" ? Ut : O[1] === "@" ? Nt : D }), r.removeAttribute(h);
        } else h.startsWith(y) && (l.push({ type: 6, index: o }), r.removeAttribute(h));
        if (mt.test(r.tagName)) {
          const h = r.textContent.split(y), m = h.length - 1;
          if (m > 0) {
            r.textContent = L ? L.emptyScript : "";
            for (let g = 0; g < m; g++) r.append(h[g], M()), b.nextNode(), l.push({ type: 2, index: ++o });
            r.append(h[m], M());
          }
        }
      } else if (r.nodeType === 8) if (r.data === ut) l.push({ type: 2, index: o });
      else {
        let h = -1;
        for (; (h = r.data.indexOf(y, h + 1)) !== -1; ) l.push({ type: 7, index: o }), h += y.length - 1;
      }
      o++;
    }
  }
  static createElement(t, e) {
    const i = x.createElement("template");
    return i.innerHTML = t, i;
  }
}
function S(s, t, e = s, i) {
  if (t === E) return t;
  let r = i !== void 0 ? e._$Co?.[i] : e._$Cl;
  const o = U(t) ? void 0 : t._$litDirective$;
  return r?.constructor !== o && (r?._$AO?.(!1), o === void 0 ? r = void 0 : (r = new o(s), r._$AT(s, e, i)), i !== void 0 ? (e._$Co ??= [])[i] = r : e._$Cl = r), r !== void 0 && (t = S(s, r._$AS(s, t.values), r, i)), t;
}
class Ft {
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
    const { el: { content: e }, parts: i } = this._$AD, r = (t?.creationScope ?? x).importNode(e, !0);
    b.currentNode = r;
    let o = b.nextNode(), n = 0, a = 0, l = i[0];
    for (; l !== void 0; ) {
      if (n === l.index) {
        let c;
        l.type === 2 ? c = new R(o, o.nextSibling, this, t) : l.type === 1 ? c = new l.ctor(o, l.name, l.strings, this, t) : l.type === 6 && (c = new Rt(o, this, t)), this._$AV.push(c), l = i[++a];
      }
      n !== l?.index && (o = b.nextNode(), n++);
    }
    return b.currentNode = x, r;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
}
class R {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, e, i, r) {
    this.type = 2, this._$AH = p, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = i, this.options = r, this._$Cv = r?.isConnected ?? !0;
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
    t = S(this, t, e), U(t) ? t === p || t == null || t === "" ? (this._$AH !== p && this._$AR(), this._$AH = p) : t !== this._$AH && t !== E && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Pt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== p && U(this._$AH) ? this._$AA.nextSibling.data = t : this.T(x.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: e, _$litType$: i } = t, r = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = N.createElement(ft(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === r) this._$AH.p(e);
    else {
      const o = new Ft(r, this), n = o.u(this.options);
      o.p(e), this.T(n), this._$AH = o;
    }
  }
  _$AC(t) {
    let e = nt.get(t.strings);
    return e === void 0 && nt.set(t.strings, e = new N(t)), e;
  }
  k(t) {
    G(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, r = 0;
    for (const o of t) r === e.length ? e.push(i = new R(this.O(M()), this.O(M()), this, this.options)) : i = e[r], i._$AI(o), r++;
    r < e.length && (this._$AR(i && i._$AB.nextSibling, r), e.length = r);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    for (this._$AP?.(!1, !0, e); t !== this._$AB; ) {
      const i = tt(t).nextSibling;
      tt(t).remove(), t = i;
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
  constructor(t, e, i, r, o) {
    this.type = 1, this._$AH = p, this._$AN = void 0, this.element = t, this.name = e, this._$AM = r, this.options = o, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = p;
  }
  _$AI(t, e = this, i, r) {
    const o = this.strings;
    let n = !1;
    if (o === void 0) t = S(this, t, e, 0), n = !U(t) || t !== this._$AH && t !== E, n && (this._$AH = t);
    else {
      const a = t;
      let l, c;
      for (t = o[0], l = 0; l < o.length - 1; l++) c = S(this, a[i + l], e, l), c === E && (c = this._$AH[l]), n ||= !U(c) || c !== this._$AH[l], c === p ? t = p : t !== p && (t += (c ?? "") + o[l + 1]), this._$AH[l] = c;
    }
    n && !r && this.j(t);
  }
  j(t) {
    t === p ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Mt extends D {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === p ? void 0 : t;
  }
}
class Ut extends D {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== p);
  }
}
class Nt extends D {
  constructor(t, e, i, r, o) {
    super(t, e, i, r, o), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = S(this, t, e, 0) ?? p) === E) return;
    const i = this._$AH, r = t === p && i !== p || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, o = t !== p && (i === p || r);
    r && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Rt {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    S(this, t);
  }
}
const Ot = W.litHtmlPolyfillSupport;
Ot?.(N, R), (W.litHtmlVersions ??= []).push("3.3.2");
const Ht = (s, t, e) => {
  const i = e?.renderBefore ?? t;
  let r = i._$litPart$;
  if (r === void 0) {
    const o = e?.renderBefore ?? null;
    i._$litPart$ = r = new R(t.insertBefore(M(), o), o, void 0, e ?? {});
  }
  return r._$AI(s), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Y = globalThis;
class F extends A {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Ht(e, this.renderRoot, this.renderOptions);
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
F._$litElement$ = !0, F.finalized = !0, Y.litElementHydrateSupport?.({ LitElement: F });
const It = Y.litElementPolyfillSupport;
It?.({ LitElement: F });
(Y.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Lt = (s) => (t, e) => {
  e !== void 0 ? e.addInitializer(() => {
    customElements.define(s, t);
  }) : customElements.define(s, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const zt = { attribute: !0, type: String, converter: I, reflect: !1, hasChanged: q }, Dt = (s = zt, t, e) => {
  const { kind: i, metadata: r } = e;
  let o = globalThis.litPropertyMetadata.get(r);
  if (o === void 0 && globalThis.litPropertyMetadata.set(r, o = /* @__PURE__ */ new Map()), i === "setter" && ((s = Object.create(s)).wrapped = !0), o.set(e.name, s), i === "accessor") {
    const { name: n } = e;
    return { set(a) {
      const l = t.get.call(this);
      t.set.call(this, a), this.requestUpdate(n, l, s, !0, a);
    }, init(a) {
      return a !== void 0 && this.C(n, void 0, s, a), a;
    } };
  }
  if (i === "setter") {
    const { name: n } = e;
    return function(a) {
      const l = this[n];
      t.call(this, a), this.requestUpdate(n, l, s, !0, a);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function K(s) {
  return (t, e) => typeof e == "object" ? Dt(s, t, e) : ((i, r, o) => {
    const n = r.hasOwnProperty(o);
    return r.constructor.createProperty(o, i), n ? Object.getOwnPropertyDescriptor(r, o) : void 0;
  })(s, t, e);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function C(s) {
  return K({ ...s, state: !0, attribute: !1 });
}
var Bt = Object.defineProperty, jt = Object.getOwnPropertyDescriptor, $ = (s, t, e, i) => {
  for (var r = i > 1 ? void 0 : i ? jt(t, e) : t, o = s.length - 1, n; o >= 0; o--)
    (n = s[o]) && (r = (i ? n(t, e, r) : n(r)) || r);
  return i && r && Bt(t, e, r), r;
};
const at = ["50ms", "100ms", "200ms", "500ms"], lt = [50, 100, 200, 500], k = 255, f = 11, Vt = 10, qt = "input_text.eleksmaker_gif_preset_", ht = "input_number.eleksmaker_logo_flicker", ct = "input_number.eleksmaker_gif_play_count", w = 2;
let u = class extends F {
  constructor() {
    super(...arguments), this.frames = [this.newFrame()], this.currentFrame = 0, this.lastLoadedValue = "", this.selectedSlot = 1, this.playCount = 0, this.previewIdx = 0, this.previewTimer = null, this.stepPreview = () => {
      if (this.frames.length === 0) {
        this.previewTimer = null;
        return;
      }
      this.previewIdx = (this.previewIdx + 1) % this.frames.length;
      const s = lt[this.frames[this.previewIdx].timing];
      this.previewTimer = setTimeout(this.stepPreview, s);
    };
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
  setConfig(s) {
    if (!s.entity) throw new Error("entity required");
    this.config = s;
  }
  updated(s) {
    if (s.has("hass") && this.hass && this.config) {
      const t = this.hass.states?.[this.config.entity];
      t && t.state !== this.lastLoadedValue && this.lastLoadedValue === "" && this.loadFromHA();
    }
    (s.has("frames") || this.previewTimer === null) && this.startPreview();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this.stopPreview();
  }
  startPreview() {
    if (this.stopPreview(), this.frames.length === 0) return;
    this.previewIdx >= this.frames.length && (this.previewIdx = 0);
    const s = lt[this.frames[this.previewIdx].timing];
    this.previewTimer = setTimeout(this.stepPreview, s);
  }
  stopPreview() {
    this.previewTimer !== null && (clearTimeout(this.previewTimer), this.previewTimer = null);
  }
  /**
   * Toggle a cell in the 7x7 matrix.
   *
   * @param r - row (0-6)
   * @param c - column (0-6)
   */
  toggleCell(s, t) {
    const e = this.frames[this.currentFrame];
    e.matrix[s][t] = !e.matrix[s][t], this.requestUpdate();
  }
  /**
   * Toggle a circle LED.
   *
   * @param i - LED index (0-11)
   */
  toggleCircle(s) {
    const t = this.frames[this.currentFrame];
    t.circle[s] = !t.circle[s], this.requestUpdate();
  }
  setTiming(s) {
    this.frames[this.currentFrame].timing = s, this.requestUpdate();
  }
  prevFrame() {
    this.currentFrame > 0 && this.currentFrame--;
  }
  nextFrame() {
    this.currentFrame < this.frames.length - 1 && this.currentFrame++;
  }
  addFrame() {
    w + (this.frames.length + 1) * f > k || (this.frames.splice(this.currentFrame + 1, 0, this.newFrame()), this.currentFrame++, this.requestUpdate());
  }
  duplicateFrame() {
    if (w + (this.frames.length + 1) * f > k) return;
    const s = this.frames[this.currentFrame], t = {
      matrix: s.matrix.map((e) => [...e]),
      circle: [...s.circle],
      timing: s.timing
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
    const s = Math.max(0, Math.min(4095, Math.round(this.playCount)));
    let t = String.fromCharCode((s & 63) + 48) + String.fromCharCode((s >> 6 & 63) + 48);
    for (const e of this.frames) {
      let i = 0n;
      for (let r = 0; r < 7; r++)
        for (let o = 0; o < 7; o++)
          e.matrix[r][o] && (i |= 1n << BigInt(r * 7 + o));
      for (let r = 0; r < 12; r++)
        e.circle[r] && (i |= 1n << BigInt(49 + r));
      i |= BigInt(e.timing) << 61n;
      for (let r = 0; r < f; r++) {
        const o = Number(i >> BigInt(r * 6) & 0x3Fn);
        t += String.fromCharCode(o + 48);
      }
    }
    return t;
  }
  /**
   * Decode an EleksWFD animation string into frames.
   *
   * @param str - encoded string
   * @returns array of frames (at least one)
   */
  decode(s) {
    const t = [];
    if (this.playCount = 0, s.length >= w) {
      const e = s.charCodeAt(0) - 48, i = s.charCodeAt(1) - 48;
      this.playCount = e & 63 | (i & 63) << 6;
    }
    for (let e = w; e + f <= s.length; e += f) {
      let i = 0n;
      for (let o = 0; o < f; o++)
        i |= BigInt(s.charCodeAt(e + o) - 48) << BigInt(o * 6);
      const r = this.newFrame();
      for (let o = 0; o < 7; o++)
        for (let n = 0; n < 7; n++)
          r.matrix[o][n] = (i >> BigInt(o * 7 + n) & 1n) === 1n;
      for (let o = 0; o < 12; o++)
        r.circle[o] = (i >> BigInt(49 + o) & 1n) === 1n;
      r.timing = Number(i >> 61n & 0x3n), t.push(r);
    }
    return t.length ? t : [this.newFrame()];
  }
  async saveToHA() {
    const s = this.encode();
    await this.hass.callService("input_text", "set_value", {
      entity_id: this.config.entity,
      value: s
    }), this.lastLoadedValue = s;
  }
  loadFromHA() {
    const s = this.hass?.states?.[this.config.entity];
    s && (this.frames = this.decode(s.state), this.currentFrame = 0, this.lastLoadedValue = s.state, this.requestUpdate());
  }
  /**
   * Return the HA entity ID for a given preset slot number (1-10).
   */
  presetEntity(s) {
    return `${qt}${s}`;
  }
  /**
   * Return the current stored value of a preset slot, or empty string.
   */
  presetValue(s) {
    return this.hass?.states?.[this.presetEntity(s)]?.state ?? "";
  }
  /**
   * Return a label for a preset slot showing the frame count.
   */
  presetLabel(s) {
    const t = this.presetValue(s);
    if (!t) return `Slot ${s}: empty`;
    const e = Math.floor(t.length / f);
    return `Slot ${s}: ${e} frame${e === 1 ? "" : "s"}`;
  }
  async loadPreset() {
    const s = this.presetValue(this.selectedSlot);
    s && (this.frames = this.decode(s), this.currentFrame = 0, this.requestUpdate());
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
    const s = this.hass?.states?.[ht]?.state, t = s != null ? Number(s) : 0;
    return isFinite(t) ? t : 0;
  }
  async setFlickerRate(s) {
    if (!isFinite(s)) return;
    const t = Math.max(0, Math.min(100, Math.round(s)));
    await this.hass.callService("input_number", "set_value", {
      entity_id: ht,
      value: t
    });
  }
  /**
   * Current global play-count from HA (0 = disabled, N = play N more cycles
   * across any loaded animation; firmware decrements each cycle and clears
   * the GIF entity when it hits 0).
   */
  globalPlayCount() {
    const s = this.hass?.states?.[ct]?.state, t = s != null ? Number(s) : 0;
    return isFinite(t) ? t : 0;
  }
  async setGlobalPlayCount(s) {
    if (!isFinite(s)) return;
    const t = Math.max(0, Math.min(100, Math.round(s)));
    await this.hass.callService("input_number", "set_value", {
      entity_id: ct,
      value: t
    });
  }
  render() {
    if (!this.config || !this.hass) return v``;
    const s = this.frames[this.currentFrame], t = this.config.title ?? "EleksMaker GIF Editor", e = w + this.frames.length * f, i = w + (this.frames.length + 1) * f > k, r = (a, l) => v`
      <div class="led ${l} ${s.circle[a] ? "on" : ""}"
           @click=${() => this.toggleCircle(a)}></div>
    `, o = this.frames[Math.min(this.previewIdx, this.frames.length - 1)] ?? s, n = (a, l) => v`
      <div class="led ${l} ${o.circle[a] ? "on" : ""}"></div>
    `;
    return v`
      <ha-card .header=${t}>
        <div style="padding: 16px;">
          <div class="header">
            <div class="frame-nav">
              <button class="secondary" @click=${this.prevFrame} ?disabled=${this.currentFrame === 0}>◀</button>
              <span>Frame ${this.currentFrame + 1} / ${this.frames.length}</span>
              <button class="secondary" @click=${this.nextFrame} ?disabled=${this.currentFrame === this.frames.length - 1}>▶</button>
            </div>
            <button @click=${this.addFrame} ?disabled=${i}>+ New</button>
            <button @click=${this.duplicateFrame} ?disabled=${i}>Dup</button>
            <button class="secondary" @click=${this.clearFrame}>Clear</button>
            <button class="secondary" @click=${this.deleteFrame} ?disabled=${this.frames.length <= 1}>Delete</button>
          </div>

          <div class="timing">
            ${at.map((a, l) => v`
              <button class=${s.timing === l ? "active" : "secondary"} @click=${() => this.setTiming(l)}>${a}</button>
            `)}
          </div>

          <div class="stage">
            <div class="display-area">
              ${r(0, "led-top-0")}
              ${r(1, "led-top-1")}
              ${r(2, "led-top-2")}
              ${r(3, "led-right-3")}
              ${r(4, "led-right-4")}
              ${r(5, "led-right-5")}
              ${r(6, "led-bottom-6")}
              ${r(7, "led-bottom-7")}
              ${r(8, "led-bottom-8")}
              ${r(9, "led-left-9")}
              ${r(10, "led-left-10")}
              ${r(11, "led-left-11")}

              <div class="matrix">
                ${s.matrix.flat().map((a, l) => {
      const c = Math.floor(l / 7), d = l % 7;
      return v`
                    <div class="cell ${a ? "on" : ""}"
                         @click=${() => this.toggleCell(c, d)}></div>
                  `;
    })}
              </div>
            </div>

            <div>
              <div class="preview-area">
                ${n(0, "led-top-0")}
                ${n(1, "led-top-1")}
                ${n(2, "led-top-2")}
                ${n(3, "led-right-3")}
                ${n(4, "led-right-4")}
                ${n(5, "led-right-5")}
                ${n(6, "led-bottom-6")}
                ${n(7, "led-bottom-7")}
                ${n(8, "led-bottom-8")}
                ${n(9, "led-left-9")}
                ${n(10, "led-left-10")}
                ${n(11, "led-left-11")}

                <div class="matrix">
                  ${o.matrix.flat().map((a) => v`
                    <div class="cell ${a ? "on" : ""}"></div>
                  `)}
                </div>
              </div>
              <div class="preview-label">
                Preview · ${this.previewIdx + 1}/${this.frames.length} · ${at[o.timing]}
              </div>
            </div>
          </div>

          <div class="actions">
            <button @click=${this.saveToHA}>Save to HA</button>
            <button class="secondary" @click=${this.loadFromHA}>Reload from HA</button>
            <label style="display: flex; align-items: center; gap: 4px; margin-left: 8px;">
              <span>Play count:</span>
              <input
                type="number"
                min="0"
                max="4095"
                step="1"
                .value=${String(this.playCount)}
                @change=${(a) => {
      this.playCount = Math.max(0, Number(a.target.value));
    }}
                style="width: 70px; padding: 4px; background: var( --card-background-color ); color: var( --primary-text-color ); border: 1px solid var( --divider-color ); border-radius: 4px;"
              >
              <span style="font-size: 13px; color: var( --secondary-text-color );">(0 = loop)</span>
            </label>
          </div>

          <div class="presets">
            <div class="presets-label">Presets</div>
            <select
              .value=${String(this.selectedSlot)}
              @change=${(a) => {
      this.selectedSlot = Number(a.target.value);
    }}
            >
              ${Array.from({ length: Vt }, (a, l) => l + 1).map((a) => v`
                <option value=${a} ?selected=${a === this.selectedSlot}>${this.presetLabel(a)}</option>
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
              @change=${(a) => this.setFlickerRate(Number(a.target.value))}
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
              .value=${String(this.globalPlayCount())}
              @change=${(a) => this.setGlobalPlayCount(Number(a.target.value))}
              style="width: 70px; padding: 6px; background: var( --card-background-color ); color: var( --primary-text-color ); border: 1px solid var( --divider-color ); border-radius: 4px;"
            >
            <span style="font-size: 13px; color: var( --secondary-text-color );">cycles (0 = disabled, decrements each loop)</span>
          </div>

          <div class="meta ${e > k ? "warn" : ""}">
            ${e}/${k} chars · ${this.frames.length} frames · entity: ${this.config.entity}
          </div>
        </div>
      </ha-card>
    `;
  }
};
u.styles = gt`
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
      gap: 24px;
      margin: 8px 0;
      flex-wrap: wrap;
    }
    .display-area,
    .preview-area {
      position: relative;
      width: 216px;    /* 168 matrix + 2*(12 border + 12 gap) */
      height: 216px;
      background: #1a1a1a;
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
$([
  K({ attribute: !1 })
], u.prototype, "hass", 2);
$([
  K({ attribute: !1 })
], u.prototype, "config", 2);
$([
  C()
], u.prototype, "frames", 2);
$([
  C()
], u.prototype, "currentFrame", 2);
$([
  C()
], u.prototype, "lastLoadedValue", 2);
$([
  C()
], u.prototype, "selectedSlot", 2);
$([
  C()
], u.prototype, "playCount", 2);
$([
  C()
], u.prototype, "previewIdx", 2);
u = $([
  Lt("eleksmaker-gif-editor")
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
