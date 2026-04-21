var N = globalThis, q = N.ShadowRoot && (N.ShadyCSS === void 0 || N.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, j = /* @__PURE__ */ Symbol(), J = /* @__PURE__ */ new WeakMap(), pt = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== j) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (q && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = J.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && J.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
}, bt = (e) => new pt(typeof e == "string" ? e : e + "", void 0, j), yt = (e, ...t) => new pt(e.length === 1 ? e[0] : t.reduce((i, s, r) => i + ((o) => {
  if (o._$cssResult$ === !0) return o.cssText;
  if (typeof o == "number") return o;
  throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
})(s) + e[r + 1], e[0]), e, j), xt = (e, t) => {
  if (q) e.adoptedStyleSheets = t.map((i) => i instanceof CSSStyleSheet ? i : i.styleSheet);
  else for (const i of t) {
    const s = document.createElement("style"), r = N.litNonce;
    r !== void 0 && s.setAttribute("nonce", r), s.textContent = i.cssText, e.appendChild(s);
  }
}, Q = q ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((t) => {
  let i = "";
  for (const s of t.cssRules) i += s.cssText;
  return bt(i);
})(e) : e, { is: _t, defineProperty: wt, getOwnPropertyDescriptor: At, getOwnPropertyNames: Et, getOwnPropertySymbols: St, getPrototypeOf: Ct } = Object, H = globalThis, tt = H.trustedTypes, kt = tt ? tt.emptyScript : "", Pt = H.reactiveElementPolyfillSupport, T = (e, t) => e, I = {
  toAttribute(e, t) {
    switch (t) {
      case Boolean:
        e = e ? kt : null;
        break;
      case Object:
      case Array:
        e = e == null ? e : JSON.stringify(e);
    }
    return e;
  },
  fromAttribute(e, t) {
    let i = e;
    switch (t) {
      case Boolean:
        i = e !== null;
        break;
      case Number:
        i = e === null ? null : Number(e);
        break;
      case Object:
      case Array:
        try {
          i = JSON.parse(e);
        } catch {
          i = null;
        }
    }
    return i;
  }
}, V = (e, t) => !_t(e, t), et = {
  attribute: !0,
  type: String,
  converter: I,
  reflect: !1,
  useDefault: !1,
  hasChanged: V
};
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), H.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var E = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = et) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = /* @__PURE__ */ Symbol(), s = this.getPropertyDescriptor(e, i, t);
      s !== void 0 && wt(this.prototype, e, s);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: s, set: r } = At(this.prototype, e) ?? {
      get() {
        return this[t];
      },
      set(o) {
        this[t] = o;
      }
    };
    return {
      get: s,
      set(o) {
        const a = s?.call(this);
        r?.call(this, o), this.requestUpdate(e, a, i);
      },
      configurable: !0,
      enumerable: !0
    };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? et;
  }
  static _$Ei() {
    if (this.hasOwnProperty(T("elementProperties"))) return;
    const e = Ct(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(T("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(T("properties"))) {
      const t = this.properties, i = [...Et(t), ...St(t)];
      for (const s of i) this.createProperty(s, t[s]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [i, s] of t) this.elementProperties.set(i, s);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, i] of this.elementProperties) {
      const s = this._$Eu(t, i);
      s !== void 0 && this._$Eh.set(s, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const i = new Set(e.flat(1 / 0).reverse());
      for (const s of i) t.unshift(Q(s));
    } else e !== void 0 && t.push(Q(e));
    return t;
  }
  static _$Eu(e, t) {
    const i = t.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
  }
  addController(e) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
  }
  removeController(e) {
    this._$EO?.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
    for (const i of t.keys()) this.hasOwnProperty(i) && (e.set(i, this[i]), delete this[i]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return xt(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((e) => e.hostDisconnected?.());
  }
  attributeChangedCallback(e, t, i) {
    this._$AK(e, i);
  }
  _$ET(e, t) {
    const i = this.constructor.elementProperties.get(e), s = this.constructor._$Eu(e, i);
    if (s !== void 0 && i.reflect === !0) {
      const r = (i.converter?.toAttribute !== void 0 ? i.converter : I).toAttribute(t, i.type);
      this._$Em = e, r == null ? this.removeAttribute(s) : this.setAttribute(s, r), this._$Em = null;
    }
  }
  _$AK(e, t) {
    const i = this.constructor, s = i._$Eh.get(e);
    if (s !== void 0 && this._$Em !== s) {
      const r = i.getPropertyOptions(s), o = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : I;
      this._$Em = s;
      const a = o.fromAttribute(t, r.type);
      this[s] = a ?? this._$Ej?.get(s) ?? a, this._$Em = null;
    }
  }
  requestUpdate(e, t, i, s = !1, r) {
    if (e !== void 0) {
      const o = this.constructor;
      if (s === !1 && (r = this[e]), i ??= o.getPropertyOptions(e), !((i.hasChanged ?? V)(r, t) || i.useDefault && i.reflect && r === this._$Ej?.get(e) && !this.hasAttribute(o._$Eu(e, i)))) return;
      this.C(e, t, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: i, reflect: s, wrapped: r }, o) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, o ?? t ?? this[e]), r !== !0 || o !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (t = void 0), this._$AL.set(e, t)), s === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (t) {
      Promise.reject(t);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [s, r] of this._$Ep) this[s] = r;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [s, r] of i) {
        const { wrapped: o } = r, a = this[s];
        o !== !0 || this._$AL.has(s) || a === void 0 || this.C(s, void 0, r, a);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((i) => i.hostUpdate?.()), this.update(t)) : this._$EM();
    } catch (i) {
      throw e = !1, this._$EM(), i;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    this._$EO?.forEach((t) => t.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
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
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq &&= this._$Eq.forEach((t) => this._$ET(t, this[t])), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
E.elementStyles = [], E.shadowRootOptions = { mode: "open" }, E[T("elementProperties")] = /* @__PURE__ */ new Map(), E[T("finalized")] = /* @__PURE__ */ new Map(), Pt?.({ ReactiveElement: E }), (H.reactiveElementVersions ??= []).push("2.1.2");
var G = globalThis, it = (e) => e, O = G.trustedTypes, st = O ? O.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, ut = "$lit$", b = `lit$${Math.random().toFixed(9).slice(2)}$`, ft = "?" + b, Tt = `<${ft}>`, _ = document, M = () => _.createComment(""), U = (e) => e === null || typeof e != "object" && typeof e != "function", W = Array.isArray, Ft = (e) => W(e) || typeof e?.[Symbol.iterator] == "function", D = `[ 	
\f\r]`, k = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, rt = /-->/g, ot = />/g, y = RegExp(`>|${D}(?:([^\\s"'>=/]+)(${D}*=${D}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), at = /'/g, nt = /"/g, mt = /^(?:script|style|textarea|title)$/i, Y = (e) => (t, ...i) => ({
  _$litType$: e,
  strings: t,
  values: i
}), $ = Y(1), Wt = Y(2), Yt = Y(3), S = /* @__PURE__ */ Symbol.for("lit-noChange"), d = /* @__PURE__ */ Symbol.for("lit-nothing"), lt = /* @__PURE__ */ new WeakMap(), x = _.createTreeWalker(_, 129);
function gt(e, t) {
  if (!W(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return st !== void 0 ? st.createHTML(t) : t;
}
var Mt = (e, t) => {
  const i = e.length - 1, s = [];
  let r, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", a = k;
  for (let n = 0; n < i; n++) {
    const l = e[n];
    let p, c, h = -1, m = 0;
    for (; m < l.length && (a.lastIndex = m, c = a.exec(l), c !== null); ) m = a.lastIndex, a === k ? c[1] === "!--" ? a = rt : c[1] !== void 0 ? a = ot : c[2] !== void 0 ? (mt.test(c[2]) && (r = RegExp("</" + c[2], "g")), a = y) : c[3] !== void 0 && (a = y) : a === y ? c[0] === ">" ? (a = r ?? k, h = -1) : c[1] === void 0 ? h = -2 : (h = a.lastIndex - c[2].length, p = c[1], a = c[3] === void 0 ? y : c[3] === '"' ? nt : at) : a === nt || a === at ? a = y : a === rt || a === ot ? a = k : (a = y, r = void 0);
    const v = a === y && e[n + 1].startsWith("/>") ? " " : "";
    o += a === k ? l + Tt : h >= 0 ? (s.push(p), l.slice(0, h) + ut + l.slice(h) + b + v) : l + b + (h === -2 ? n : v);
  }
  return [gt(e, o + (e[i] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), s];
}, B = class vt {
  constructor({ strings: t, _$litType$: i }, s) {
    let r;
    this.parts = [];
    let o = 0, a = 0;
    const n = t.length - 1, l = this.parts, [p, c] = Mt(t, i);
    if (this.el = vt.createElement(p, s), x.currentNode = this.el.content, i === 2 || i === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (r = x.nextNode()) !== null && l.length < n; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const h of r.getAttributeNames()) if (h.endsWith(ut)) {
          const m = c[a++], v = r.getAttribute(h).split(b), R = /([.?@])?(.*)/.exec(m);
          l.push({
            type: 1,
            index: o,
            name: R[2],
            strings: v,
            ctor: R[1] === "." ? Rt : R[1] === "?" ? Nt : R[1] === "@" ? It : L
          }), r.removeAttribute(h);
        } else h.startsWith(b) && (l.push({
          type: 6,
          index: o
        }), r.removeAttribute(h));
        if (mt.test(r.tagName)) {
          const h = r.textContent.split(b), m = h.length - 1;
          if (m > 0) {
            r.textContent = O ? O.emptyScript : "";
            for (let v = 0; v < m; v++) r.append(h[v], M()), x.nextNode(), l.push({
              type: 2,
              index: ++o
            });
            r.append(h[m], M());
          }
        }
      } else if (r.nodeType === 8) if (r.data === ft) l.push({
        type: 2,
        index: o
      });
      else {
        let h = -1;
        for (; (h = r.data.indexOf(b, h + 1)) !== -1; ) l.push({
          type: 7,
          index: o
        }), h += b.length - 1;
      }
      o++;
    }
  }
  static createElement(t, i) {
    const s = _.createElement("template");
    return s.innerHTML = t, s;
  }
};
function C(e, t, i = e, s) {
  if (t === S) return t;
  let r = s !== void 0 ? i._$Co?.[s] : i._$Cl;
  const o = U(t) ? void 0 : t._$litDirective$;
  return r?.constructor !== o && (r?._$AO?.(!1), o === void 0 ? r = void 0 : (r = new o(e), r._$AT(e, i, s)), s !== void 0 ? (i._$Co ??= [])[s] = r : i._$Cl = r), r !== void 0 && (t = C(e, r._$AS(e, t.values), r, s)), t;
}
var Ut = class {
  constructor(e, t) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: t }, parts: i } = this._$AD, s = (e?.creationScope ?? _).importNode(t, !0);
    x.currentNode = s;
    let r = x.nextNode(), o = 0, a = 0, n = i[0];
    for (; n !== void 0; ) {
      if (o === n.index) {
        let l;
        n.type === 2 ? l = new K(r, r.nextSibling, this, e) : n.type === 1 ? l = new n.ctor(r, n.name, n.strings, this, e) : n.type === 6 && (l = new Ot(r, this, e)), this._$AV.push(l), n = i[++a];
      }
      o !== n?.index && (r = x.nextNode(), o++);
    }
    return x.currentNode = _, s;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
}, K = class $t {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, i, s, r) {
    this.type = 2, this._$AH = d, this._$AN = void 0, this._$AA = t, this._$AB = i, this._$AM = s, this.options = r, this._$Cv = r?.isConnected ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const i = this._$AM;
    return i !== void 0 && t?.nodeType === 11 && (t = i.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, i = this) {
    t = C(this, t, i), U(t) ? t === d || t == null || t === "" ? (this._$AH !== d && this._$AR(), this._$AH = d) : t !== this._$AH && t !== S && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Ft(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== d && U(this._$AH) ? this._$AA.nextSibling.data = t : this.T(_.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: i, _$litType$: s } = t, r = typeof s == "number" ? this._$AC(t) : (s.el === void 0 && (s.el = B.createElement(gt(s.h, s.h[0]), this.options)), s);
    if (this._$AH?._$AD === r) this._$AH.p(i);
    else {
      const o = new Ut(r, this), a = o.u(this.options);
      o.p(i), this.T(a), this._$AH = o;
    }
  }
  _$AC(t) {
    let i = lt.get(t.strings);
    return i === void 0 && lt.set(t.strings, i = new B(t)), i;
  }
  k(t) {
    W(this._$AH) || (this._$AH = [], this._$AR());
    const i = this._$AH;
    let s, r = 0;
    for (const o of t) r === i.length ? i.push(s = new $t(this.O(M()), this.O(M()), this, this.options)) : s = i[r], s._$AI(o), r++;
    r < i.length && (this._$AR(s && s._$AB.nextSibling, r), i.length = r);
  }
  _$AR(t = this._$AA.nextSibling, i) {
    for (this._$AP?.(!1, !0, i); t !== this._$AB; ) {
      const s = it(t).nextSibling;
      it(t).remove(), t = s;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}, L = class {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, i, s, r) {
    this.type = 1, this._$AH = d, this._$AN = void 0, this.element = e, this.name = t, this._$AM = s, this.options = r, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(/* @__PURE__ */ new String()), this.strings = i) : this._$AH = d;
  }
  _$AI(e, t = this, i, s) {
    const r = this.strings;
    let o = !1;
    if (r === void 0) e = C(this, e, t, 0), o = !U(e) || e !== this._$AH && e !== S, o && (this._$AH = e);
    else {
      const a = e;
      let n, l;
      for (e = r[0], n = 0; n < r.length - 1; n++) l = C(this, a[i + n], t, n), l === S && (l = this._$AH[n]), o ||= !U(l) || l !== this._$AH[n], l === d ? e = d : e !== d && (e += (l ?? "") + r[n + 1]), this._$AH[n] = l;
    }
    o && !s && this.j(e);
  }
  j(e) {
    e === d ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}, Rt = class extends L {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === d ? void 0 : e;
  }
}, Nt = class extends L {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== d);
  }
}, It = class extends L {
  constructor(e, t, i, s, r) {
    super(e, t, i, s, r), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = C(this, e, t, 0) ?? d) === S) return;
    const i = this._$AH, s = e === d && i !== d || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, r = e !== d && (i === d || s);
    s && this.element.removeEventListener(this.name, this, i), r && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}, Ot = class {
  constructor(e, t, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    C(this, e);
  }
};
var Ht = G.litHtmlPolyfillSupport;
Ht?.(B, K), (G.litHtmlVersions ??= []).push("3.3.2");
var Lt = (e, t, i) => {
  const s = i?.renderBefore ?? t;
  let r = s._$litPart$;
  if (r === void 0) {
    const o = i?.renderBefore ?? null;
    s._$litPart$ = r = new K(t.insertBefore(M(), o), o, void 0, i ?? {});
  }
  return r._$AI(e), r;
}, X = globalThis, F = class extends E {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Lt(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return S;
  }
};
F._$litElement$ = !0, F.finalized = !0, X.litElementHydrateSupport?.({ LitElement: F });
var Dt = X.litElementPolyfillSupport;
Dt?.({ LitElement: F });
(X.litElementVersions ??= []).push("4.2.2");
var zt = (e) => (t, i) => {
  i !== void 0 ? i.addInitializer(() => {
    customElements.define(e, t);
  }) : customElements.define(e, t);
}, Bt = {
  attribute: !0,
  type: String,
  converter: I,
  reflect: !1,
  hasChanged: V
}, qt = (e = Bt, t, i) => {
  const { kind: s, metadata: r } = i;
  let o = globalThis.litPropertyMetadata.get(r);
  if (o === void 0 && globalThis.litPropertyMetadata.set(r, o = /* @__PURE__ */ new Map()), s === "setter" && ((e = Object.create(e)).wrapped = !0), o.set(i.name, e), s === "accessor") {
    const { name: a } = i;
    return {
      set(n) {
        const l = t.get.call(this);
        t.set.call(this, n), this.requestUpdate(a, l, e, !0, n);
      },
      init(n) {
        return n !== void 0 && this.C(a, void 0, e, n), n;
      }
    };
  }
  if (s === "setter") {
    const { name: a } = i;
    return function(n) {
      const l = this[a];
      t.call(this, n), this.requestUpdate(a, l, e, !0, n);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function Z(e) {
  return (t, i) => typeof i == "object" ? qt(e, t, i) : ((s, r, o) => {
    const a = r.hasOwnProperty(o);
    return r.constructor.createProperty(o, s), a ? Object.getOwnPropertyDescriptor(r, o) : void 0;
  })(e, t, i);
}
function w(e) {
  return Z({
    ...e,
    state: !0,
    attribute: !1
  });
}
function f(e, t, i, s) {
  var r = arguments.length, o = r < 3 ? t : s === null ? s = Object.getOwnPropertyDescriptor(t, i) : s, a;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") o = Reflect.decorate(e, t, i, s);
  else for (var n = e.length - 1; n >= 0; n--) (a = e[n]) && (o = (r < 3 ? a(o) : r > 3 ? a(t, i, o) : a(t, i)) || o);
  return r > 3 && o && Object.defineProperty(t, i, o), o;
}
var z = [
  "50ms",
  "100ms",
  "200ms",
  "500ms"
], ht = [
  50,
  100,
  200,
  500
], jt = [
  "led-top-0",
  "led-top-1",
  "led-top-2",
  "led-right-3",
  "led-right-4",
  "led-right-5",
  "led-bottom-6",
  "led-bottom-7",
  "led-bottom-8",
  "led-left-9",
  "led-left-10",
  "led-left-11"
], P = 255, g = 11, Vt = 10, Gt = "input_text.eleksmaker_gif_preset_", ct = "input_number.eleksmaker_logo_flicker", dt = "input_number.eleksmaker_gif_play_count", A = 2, u = class extends F {
  constructor(...t) {
    super(...t), this.frames = [this.newFrame()], this.currentFrame = 0, this.lastLoadedValue = "", this.selectedSlot = 1, this.playCount = 0, this.previewIdx = 0, this.previewTimer = null, this.globalDraft = "", this.flickerDraft = "", this.stepPreview = () => {
      if (this.frames.length === 0) {
        this.previewTimer = null;
        return;
      }
      this.previewIdx = (this.previewIdx + 1) % this.frames.length, this.paintPreview();
      const i = ht[this.frames[this.previewIdx].timing];
      this.previewTimer = setTimeout(this.stepPreview, i);
    };
  }
  newFrame() {
    return {
      matrix: Array.from({ length: 7 }, () => Array(7).fill(!1)),
      circle: Array(12).fill(!1),
      timing: 2
    };
  }
  setConfig(t) {
    if (!t.entity) throw new Error("entity required");
    this.config = t;
  }
  static {
    this.styles = yt`
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
      border-radius: 12px;   /* matches the corner LEDs' outer curve */
      flex: 0 0 auto;
    }
    .preview-label,
    .editor-label {
      font-size: 12px;
      color: var( --secondary-text-color );
      margin-top: 6px;
      text-align: center;
    }
    .editor-label.warn {
      color: var( --error-color );
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
      background: transparent;
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
      background: transparent;
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
  }
  willUpdate(t) {
    if (!t.has("hass") || !this.hass) return;
    const i = this.shadowRoot, s = i?.activeElement ?? null, r = i?.querySelector(".flicker-input") ?? null;
    if (!(r !== null && s === r)) {
      const a = String(this.flickerRate());
      this.flickerDraft !== a && (this.flickerDraft = a);
    }
    const o = i?.querySelector(".global-play-count-input") ?? null;
    if (!(o !== null && s === o)) {
      const a = String(this.globalPlayCount());
      this.globalDraft !== a && (this.globalDraft = a);
    }
  }
  updated(t) {
    if (t.has("hass") && this.hass && this.config) {
      const i = this.hass.states?.[this.config.entity];
      i && i.state !== this.lastLoadedValue && this.lastLoadedValue === "" && this.loadFromHA();
    }
    (t.has("frames") || this.previewTimer === null) && this.startPreview();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this.stopPreview();
  }
  startPreview() {
    if (this.stopPreview(), this.frames.length === 0) return;
    this.previewIdx >= this.frames.length && (this.previewIdx = 0), this.paintPreview();
    const t = ht[this.frames[this.previewIdx].timing];
    this.previewTimer = setTimeout(this.stepPreview, t);
  }
  stopPreview() {
    this.previewTimer !== null && (clearTimeout(this.previewTimer), this.previewTimer = null);
  }
  paintPreview() {
    const t = this.shadowRoot;
    if (!t) return;
    const i = t.querySelector(".preview-area");
    if (!i) return;
    const s = this.frames[this.previewIdx];
    if (!s) return;
    for (let a = 0; a < 12; a++) {
      const n = i.querySelector(`.${jt[a]}`);
      n && n.classList.toggle("on", s.circle[a]);
    }
    const r = i.querySelectorAll(".cell");
    for (let a = 0; a < 49 && a < r.length; a++) {
      const n = Math.floor(a / 7), l = a % 7;
      r[a].classList.toggle("on", s.matrix[n][l]);
    }
    const o = t.querySelector(".preview-label");
    o && (o.textContent = `Preview · ${this.previewIdx + 1}/${this.frames.length} · ${z[s.timing]}`);
  }
  toggleCell(t, i) {
    const s = this.frames[this.currentFrame];
    s.matrix[t][i] = !s.matrix[t][i], this.requestUpdate();
  }
  toggleCircle(t) {
    const i = this.frames[this.currentFrame];
    i.circle[t] = !i.circle[t], this.requestUpdate();
  }
  setTiming(t) {
    this.frames[this.currentFrame].timing = t, this.requestUpdate();
  }
  prevFrame() {
    this.currentFrame > 0 && this.currentFrame--;
  }
  nextFrame() {
    this.currentFrame < this.frames.length - 1 && this.currentFrame++;
  }
  addFrame() {
    A + (this.frames.length + 1) * g > P || (this.frames.splice(this.currentFrame + 1, 0, this.newFrame()), this.currentFrame++, this.requestUpdate());
  }
  duplicateFrame() {
    if (A + (this.frames.length + 1) * g > P) return;
    const t = this.frames[this.currentFrame], i = {
      matrix: t.matrix.map((s) => [...s]),
      circle: [...t.circle],
      timing: t.timing
    };
    this.frames.splice(this.currentFrame + 1, 0, i), this.currentFrame++, this.requestUpdate();
  }
  deleteFrame() {
    this.frames.length <= 1 || (this.frames.splice(this.currentFrame, 1), this.currentFrame >= this.frames.length && this.currentFrame--, this.requestUpdate());
  }
  clearFrame() {
    this.frames[this.currentFrame] = {
      ...this.newFrame(),
      timing: this.frames[this.currentFrame].timing
    }, this.requestUpdate();
  }
  encode() {
    const t = Math.max(0, Math.min(4095, Math.round(this.playCount)));
    let i = String.fromCharCode((t & 63) + 48) + String.fromCharCode((t >> 6 & 63) + 48);
    for (const s of this.frames) {
      let r = 0n;
      for (let o = 0; o < 7; o++) for (let a = 0; a < 7; a++) s.matrix[o][a] && (r |= 1n << BigInt(o * 7 + a));
      for (let o = 0; o < 12; o++) s.circle[o] && (r |= 1n << BigInt(49 + o));
      r |= BigInt(s.timing) << 61n;
      for (let o = 0; o < g; o++) {
        const a = Number(r >> BigInt(o * 6) & 63n);
        i += String.fromCharCode(a + 48);
      }
    }
    return i;
  }
  decode(t) {
    const i = [];
    if (this.playCount = 0, t.length >= A) {
      const s = t.charCodeAt(0) - 48, r = t.charCodeAt(1) - 48;
      this.playCount = s & 63 | (r & 63) << 6;
    }
    for (let s = A; s + g <= t.length; s += g) {
      let r = 0n;
      for (let a = 0; a < g; a++) r |= BigInt(t.charCodeAt(s + a) - 48) << BigInt(a * 6);
      const o = this.newFrame();
      for (let a = 0; a < 7; a++) for (let n = 0; n < 7; n++) o.matrix[a][n] = (r >> BigInt(a * 7 + n) & 1n) === 1n;
      for (let a = 0; a < 12; a++) o.circle[a] = (r >> BigInt(49 + a) & 1n) === 1n;
      o.timing = Number(r >> 61n & 3n), i.push(o);
    }
    return i.length ? i : [this.newFrame()];
  }
  async saveToHA() {
    const t = this.encode();
    await this.hass.callService("input_text", "set_value", {
      entity_id: this.config.entity,
      value: t
    }), this.lastLoadedValue = t;
  }
  loadFromHA() {
    const t = this.hass?.states?.[this.config.entity];
    t && (this.frames = this.decode(t.state), this.currentFrame = 0, this.lastLoadedValue = t.state, this.requestUpdate());
  }
  presetEntity(t) {
    return `${Gt}${t}`;
  }
  presetValue(t) {
    return this.hass?.states?.[this.presetEntity(t)]?.state ?? "";
  }
  presetLabel(t) {
    const i = this.presetValue(t);
    if (!i) return `Slot ${t}: empty`;
    const s = Math.floor(i.length / g);
    return `Slot ${t}: ${s} frame${s === 1 ? "" : "s"}`;
  }
  async loadPreset() {
    const t = this.presetValue(this.selectedSlot);
    t && (this.frames = this.decode(t), this.currentFrame = 0, this.requestUpdate());
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
  flickerRate() {
    const t = this.hass?.states?.[ct]?.state, i = t != null ? Number(t) : 0;
    return isFinite(i) ? i : 0;
  }
  async setFlickerRate(t) {
    if (!isFinite(t)) return;
    const i = Math.max(0, Math.min(100, Math.round(t)));
    await this.hass.callService("input_number", "set_value", {
      entity_id: ct,
      value: i
    });
  }
  globalPlayCount() {
    const t = this.hass?.states?.[dt]?.state, i = t != null ? Number(t) : 0;
    return isFinite(i) ? i : 0;
  }
  async setGlobalPlayCount(t) {
    if (!isFinite(t)) return;
    const i = Math.max(0, Math.min(100, Math.round(t)));
    await this.hass.callService("input_number", "set_value", {
      entity_id: dt,
      value: i
    });
  }
  render() {
    if (!this.config || !this.hass) return $``;
    const t = this.frames[this.currentFrame], i = this.config.title ?? "EleksMaker GIF Editor", s = A + this.frames.length * g, r = A + (this.frames.length + 1) * g > P, o = (l, p) => $`
      <div class="led ${p} ${t.circle[l] ? "on" : ""}"
           @click=${() => this.toggleCircle(l)}></div>
    `, a = this.frames[Math.min(this.previewIdx, this.frames.length - 1)] ?? t, n = (l, p) => $`
      <div class="led ${p} ${a.circle[l] ? "on" : ""}"></div>
    `;
    return $`
      <ha-card .header=${i}>
        <div style="padding: 16px;">
          <div class="header">
            <div class="frame-nav">
              <button class="secondary" @click=${this.prevFrame} ?disabled=${this.currentFrame === 0}>◀</button>
              <span>Frame ${this.currentFrame + 1} / ${this.frames.length}</span>
              <button class="secondary" @click=${this.nextFrame} ?disabled=${this.currentFrame === this.frames.length - 1}>▶</button>
            </div>
            <button @click=${this.addFrame} ?disabled=${r}>+ New</button>
            <button @click=${this.duplicateFrame} ?disabled=${r}>Dup</button>
            <button class="secondary" @click=${this.clearFrame}>Clear</button>
            <button class="secondary" @click=${this.deleteFrame} ?disabled=${this.frames.length <= 1}>Delete</button>
          </div>

          <div class="timing">
            ${z.map((l, p) => $`
              <button class=${t.timing === p ? "active" : "secondary"} @click=${() => this.setTiming(p)}>${l}</button>
            `)}
          </div>

          <div class="stage">
            <div>
              <div class="display-area">
                ${o(0, "led-top-0")}
                ${o(1, "led-top-1")}
                ${o(2, "led-top-2")}
                ${o(3, "led-right-3")}
                ${o(4, "led-right-4")}
                ${o(5, "led-right-5")}
                ${o(6, "led-bottom-6")}
                ${o(7, "led-bottom-7")}
                ${o(8, "led-bottom-8")}
                ${o(9, "led-left-9")}
                ${o(10, "led-left-10")}
                ${o(11, "led-left-11")}

                <div class="matrix">
                  ${t.matrix.flat().map((l, p) => {
      const c = Math.floor(p / 7), h = p % 7;
      return $`
                      <div class="cell ${l ? "on" : ""}"
                           @click=${() => this.toggleCell(c, h)}></div>
                    `;
    })}
                </div>
              </div>
              <div class="editor-label ${s > P ? "warn" : ""}">
                ${s}/${P} chars
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
                  ${a.matrix.flat().map((l) => $`
                    <div class="cell ${l ? "on" : ""}"></div>
                  `)}
                </div>
              </div>
              <div class="preview-label">
                Preview · ${this.previewIdx + 1}/${this.frames.length} · ${z[a.timing]}
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
                @input=${(l) => {
      this.playCount = Math.max(0, Number(l.target.value) || 0);
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
              @change=${(l) => {
      this.selectedSlot = Number(l.target.value);
    }}
            >
              ${Array.from({ length: Vt }, (l, p) => p + 1).map((l) => $`
                <option value=${l} ?selected=${l === this.selectedSlot}>${this.presetLabel(l)}</option>
              `)}
            </select>
            <button @click=${this.loadPreset} ?disabled=${!this.presetValue(this.selectedSlot)}>Load</button>
            <button @click=${this.savePreset}>Save</button>
            <button class="secondary" @click=${this.clearPreset} ?disabled=${!this.presetValue(this.selectedSlot)}>Clear</button>
          </div>

          <div class="presets">
            <div class="presets-label">Flicker</div>
            <input
              class="flicker-input"
              type="number"
              min="0"
              max="100"
              step="1"
              .value=${this.flickerDraft}
              @input=${(l) => {
      this.flickerDraft = l.target.value;
    }}
              @change=${(l) => this.setFlickerRate(Number(l.target.value))}
              style="width: 70px; padding: 6px; background: var( --card-background-color ); color: var( --primary-text-color ); border: 1px solid var( --divider-color ); border-radius: 4px;"
            >
            <span style="font-size: 13px; color: var( --secondary-text-color );">flickers/sec (0 = off)</span>
          </div>

          <div class="presets">
            <div class="presets-label">Global play count</div>
            <input
              class="global-play-count-input"
              type="number"
              min="0"
              max="100"
              step="1"
              .value=${this.globalDraft}
              @input=${(l) => {
      this.globalDraft = l.target.value;
    }}
              @change=${(l) => this.setGlobalPlayCount(Number(l.target.value))}
              style="width: 70px; padding: 6px; background: var( --card-background-color ); color: var( --primary-text-color ); border: 1px solid var( --divider-color ); border-radius: 4px;"
            >
            <span style="font-size: 13px; color: var( --secondary-text-color );">cycles (0 = disabled, decrements each loop)</span>
          </div>

        </div>
      </ha-card>
    `;
  }
};
f([Z({ attribute: !1 })], u.prototype, "hass", void 0);
f([Z({ attribute: !1 })], u.prototype, "config", void 0);
f([w()], u.prototype, "frames", void 0);
f([w()], u.prototype, "currentFrame", void 0);
f([w()], u.prototype, "lastLoadedValue", void 0);
f([w()], u.prototype, "selectedSlot", void 0);
f([w()], u.prototype, "playCount", void 0);
f([w()], u.prototype, "globalDraft", void 0);
f([w()], u.prototype, "flickerDraft", void 0);
u = f([zt("eleksmaker-gif-editor")], u);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "eleksmaker-gif-editor",
  name: "EleksMaker GIF Editor",
  description: "7x7 matrix + circle LED animation editor for EleksWFD"
});
export {
  u as EleksmakerGifEditor
};
