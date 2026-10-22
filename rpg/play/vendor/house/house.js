async function e(e) {
	let t = await fetch("https://api.hyperliquid.xyz/info", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(e)
	});
	if (!t.ok) throw Error(`Hyperliquid info ${t.status}`);
	return t.json();
}
var t = (e) => e.includes(":") ? e.slice(0, e.indexOf(":")) : "", n = ["", "xyz"], r = (e) => ({
	time: Math.floor(e.t / 1e3),
	open: +e.o,
	high: +e.h,
	low: +e.l,
	close: +e.c,
	volume: +(e.v ?? 0) || 0
}), i = {
	"1m": 6e4,
	"5m": 3e5,
	"15m": 9e5,
	"1h": 36e5,
	"4h": 144e5,
	"1d": 864e5,
	"1w": 6048e5
};
async function a(t, n, a = 300) {
	let o = Date.now();
	return (await e({
		type: "candleSnapshot",
		req: {
			coin: t,
			interval: n,
			startTime: o - a * i[n],
			endTime: o
		}
	})).map(r);
}
async function o(t, n, i, a) {
	return (await e({
		type: "candleSnapshot",
		req: {
			coin: t,
			interval: n,
			startTime: i,
			endTime: a
		}
	})).map(r);
}
var s = class {
	ws = null;
	subs = /* @__PURE__ */ new Map();
	h;
	retry = 0;
	closed = !1;
	timer = 0;
	constructor(e) {
		this.h = e;
		for (let e of n) this.subscribe(e ? {
			type: "allMids",
			dex: e
		} : { type: "allMids" });
		this.open();
	}
	open() {
		if (this.closed) return;
		let e = new WebSocket("wss://api.hyperliquid.xyz/ws");
		this.ws = e, e.onopen = () => {
			this.retry = 0, this.h.onStatus(!0);
			for (let e of this.subs.values()) this.send("subscribe", e);
		}, e.onclose = () => {
			if (this.closed) return;
			this.h.onStatus(!1);
			let e = Math.min(15e3, 1e3 * 2 ** this.retry++);
			this.timer = window.setTimeout(() => this.open(), e);
		}, e.onerror = () => e.close(), e.onmessage = (e) => this.handle(e.data);
	}
	close() {
		this.closed = !0, clearTimeout(this.timer);
		let e = this.ws;
		if (this.ws = null, this.subs.clear(), e) {
			e.onopen = e.onclose = e.onerror = e.onmessage = null;
			try {
				e.close();
			} catch {}
		}
	}
	send(e, t) {
		this.ws?.readyState === WebSocket.OPEN && this.ws.send(JSON.stringify({
			method: e,
			subscription: t
		}));
	}
	subscribe(e) {
		let t = JSON.stringify(e);
		this.subs.has(t) || (this.subs.set(t, e), this.send("subscribe", e));
	}
	unsubscribe(e) {
		let t = JSON.stringify(e);
		this.subs.delete(t) && this.send("unsubscribe", e);
	}
	handle(e) {
		if (this.closed) return;
		let t;
		try {
			t = JSON.parse(e);
		} catch {
			return;
		}
		let n = t.data;
		switch (t.channel) {
			case "allMids": {
				let e = {};
				for (let [t, r] of Object.entries(n.mids)) e[t] = +r;
				this.h.onMids(e);
				break;
			}
			case "l2Book": {
				let e = n.levels, t = (e) => e.map((e) => [+e.px, +e.sz]);
				this.h.onBook(n.coin, {
					bids: t(e[0]),
					asks: t(e[1]),
					time: n.time
				});
				break;
			}
			case "candle": this.h.onCandle(n.s, n.i, r(n));
		}
	}
};
//#endregion
//#region node_modules/fancy-canvas/size.mjs
function c(e) {
	var t = e.width, n = e.height;
	if (t < 0) throw Error("Negative width is not allowed for Size");
	if (n < 0) throw Error("Negative height is not allowed for Size");
	return {
		width: t,
		height: n
	};
}
function l(e, t) {
	return e.width === t.width && e.height === t.height;
}
//#endregion
//#region node_modules/fancy-canvas/device-pixel-ratio.mjs
var u = function() {
	function e(e) {
		var t = this;
		this._resolutionListener = function() {
			return t._onResolutionChanged();
		}, this._resolutionMediaQueryList = null, this._observers = [], this._window = e, this._installResolutionListener();
	}
	return e.prototype.dispose = function() {
		this._uninstallResolutionListener(), this._window = null;
	}, Object.defineProperty(e.prototype, "value", {
		get: function() {
			return this._window.devicePixelRatio;
		},
		enumerable: !1,
		configurable: !0
	}), e.prototype.subscribe = function(e) {
		var t = this, n = { next: e };
		return this._observers.push(n), { unsubscribe: function() {
			t._observers = t._observers.filter(function(e) {
				return e !== n;
			});
		} };
	}, e.prototype._installResolutionListener = function() {
		if (this._resolutionMediaQueryList !== null) throw Error("Resolution listener is already installed");
		var e = this._window.devicePixelRatio;
		this._resolutionMediaQueryList = this._window.matchMedia(`all and (resolution: ${e}dppx)`), this._resolutionMediaQueryList.addListener(this._resolutionListener);
	}, e.prototype._uninstallResolutionListener = function() {
		this._resolutionMediaQueryList !== null && (this._resolutionMediaQueryList.removeListener(this._resolutionListener), this._resolutionMediaQueryList = null);
	}, e.prototype._reinstallResolutionListener = function() {
		this._uninstallResolutionListener(), this._installResolutionListener();
	}, e.prototype._onResolutionChanged = function() {
		var e = this;
		this._observers.forEach(function(t) {
			return t.next(e._window.devicePixelRatio);
		}), this._reinstallResolutionListener();
	}, e;
}();
function d(e) {
	return new u(e);
}
//#endregion
//#region node_modules/fancy-canvas/canvas-element-bitmap-size.mjs
var f = function() {
	function e(e, t, n) {
		this._canvasElement = null, this._bitmapSizeChangedListeners = [], this._suggestedBitmapSize = null, this._suggestedBitmapSizeChangedListeners = [], this._devicePixelRatioObservable = null, this._canvasElementResizeObserver = null, this._canvasElement = e, this._canvasElementClientSize = c({
			width: this._canvasElement.clientWidth,
			height: this._canvasElement.clientHeight
		}), this._transformBitmapSize = t ?? (function(e) {
			return e;
		}), this._allowResizeObserver = n?.allowResizeObserver ?? !0, this._chooseAndInitObserver();
	}
	return e.prototype.dispose = function() {
		var e, t;
		if (this._canvasElement === null) throw Error("Object is disposed");
		(e = this._canvasElementResizeObserver) == null || e.disconnect(), this._canvasElementResizeObserver = null, (t = this._devicePixelRatioObservable) == null || t.dispose(), this._devicePixelRatioObservable = null, this._suggestedBitmapSizeChangedListeners.length = 0, this._bitmapSizeChangedListeners.length = 0, this._canvasElement = null;
	}, Object.defineProperty(e.prototype, "canvasElement", {
		get: function() {
			if (this._canvasElement === null) throw Error("Object is disposed");
			return this._canvasElement;
		},
		enumerable: !1,
		configurable: !0
	}), Object.defineProperty(e.prototype, "canvasElementClientSize", {
		get: function() {
			return this._canvasElementClientSize;
		},
		enumerable: !1,
		configurable: !0
	}), Object.defineProperty(e.prototype, "bitmapSize", {
		get: function() {
			return c({
				width: this.canvasElement.width,
				height: this.canvasElement.height
			});
		},
		enumerable: !1,
		configurable: !0
	}), e.prototype.resizeCanvasElement = function(e) {
		this._canvasElementClientSize = c(e), this.canvasElement.style.width = `${this._canvasElementClientSize.width}px`, this.canvasElement.style.height = `${this._canvasElementClientSize.height}px`, this._invalidateBitmapSize();
	}, e.prototype.subscribeBitmapSizeChanged = function(e) {
		this._bitmapSizeChangedListeners.push(e);
	}, e.prototype.unsubscribeBitmapSizeChanged = function(e) {
		this._bitmapSizeChangedListeners = this._bitmapSizeChangedListeners.filter(function(t) {
			return t !== e;
		});
	}, Object.defineProperty(e.prototype, "suggestedBitmapSize", {
		get: function() {
			return this._suggestedBitmapSize;
		},
		enumerable: !1,
		configurable: !0
	}), e.prototype.subscribeSuggestedBitmapSizeChanged = function(e) {
		this._suggestedBitmapSizeChangedListeners.push(e);
	}, e.prototype.unsubscribeSuggestedBitmapSizeChanged = function(e) {
		this._suggestedBitmapSizeChangedListeners = this._suggestedBitmapSizeChangedListeners.filter(function(t) {
			return t !== e;
		});
	}, e.prototype.applySuggestedBitmapSize = function() {
		if (this._suggestedBitmapSize !== null) {
			var e = this._suggestedBitmapSize;
			this._suggestedBitmapSize = null, this._resizeBitmap(e), this._emitSuggestedBitmapSizeChanged(e, this._suggestedBitmapSize);
		}
	}, e.prototype._resizeBitmap = function(e) {
		var t = this.bitmapSize;
		l(t, e) || (this.canvasElement.width = e.width, this.canvasElement.height = e.height, this._emitBitmapSizeChanged(t, e));
	}, e.prototype._emitBitmapSizeChanged = function(e, t) {
		var n = this;
		this._bitmapSizeChangedListeners.forEach(function(r) {
			return r.call(n, e, t);
		});
	}, e.prototype._suggestNewBitmapSize = function(e) {
		var t = this._suggestedBitmapSize, n = c(this._transformBitmapSize(e, this._canvasElementClientSize)), r = l(this.bitmapSize, n) ? null : n;
		(t !== null || r !== null) && (t !== null && r !== null && l(t, r) || (this._suggestedBitmapSize = r, this._emitSuggestedBitmapSizeChanged(t, r)));
	}, e.prototype._emitSuggestedBitmapSizeChanged = function(e, t) {
		var n = this;
		this._suggestedBitmapSizeChangedListeners.forEach(function(r) {
			return r.call(n, e, t);
		});
	}, e.prototype._chooseAndInitObserver = function() {
		var e = this;
		if (!this._allowResizeObserver) {
			this._initDevicePixelRatioObservable();
			return;
		}
		h().then(function(t) {
			return t ? e._initResizeObserver() : e._initDevicePixelRatioObservable();
		});
	}, e.prototype._initDevicePixelRatioObservable = function() {
		var e = this;
		if (this._canvasElement !== null) {
			var t = m(this._canvasElement);
			if (t === null) throw Error("No window is associated with the canvas");
			this._devicePixelRatioObservable = d(t), this._devicePixelRatioObservable.subscribe(function() {
				return e._invalidateBitmapSize();
			}), this._invalidateBitmapSize();
		}
	}, e.prototype._invalidateBitmapSize = function() {
		if (this._canvasElement !== null) {
			var e = m(this._canvasElement);
			if (e !== null) {
				var t = this._devicePixelRatioObservable?.value ?? e.devicePixelRatio, n = this._canvasElement.getClientRects(), r = n[0] === void 0 ? c({
					width: this._canvasElementClientSize.width * t,
					height: this._canvasElementClientSize.height * t
				}) : g(n[0], t);
				this._suggestNewBitmapSize(r);
			}
		}
	}, e.prototype._initResizeObserver = function() {
		var e = this;
		this._canvasElement !== null && (this._canvasElementResizeObserver = new ResizeObserver(function(t) {
			var n = t.find(function(t) {
				return t.target === e._canvasElement;
			});
			if (n && n.devicePixelContentBoxSize && n.devicePixelContentBoxSize[0]) {
				var r = n.devicePixelContentBoxSize[0], i = c({
					width: r.inlineSize,
					height: r.blockSize
				});
				e._suggestNewBitmapSize(i);
			}
		}), this._canvasElementResizeObserver.observe(this._canvasElement, { box: "device-pixel-content-box" }));
	}, e;
}();
function p(e, t) {
	if (t.type === "device-pixel-content-box") return new f(e, t.transform, t.options);
	throw Error("Unsupported binding target");
}
function m(e) {
	return e.ownerDocument.defaultView;
}
function h() {
	return new Promise(function(e) {
		var t = new ResizeObserver(function(n) {
			e(n.every(function(e) {
				return "devicePixelContentBoxSize" in e;
			})), t.disconnect();
		});
		t.observe(document.body, { box: "device-pixel-content-box" });
	}).catch(function() {
		return !1;
	});
}
function g(e, t) {
	return c({
		width: Math.round(e.left * t + e.width * t) - Math.round(e.left * t),
		height: Math.round(e.top * t + e.height * t) - Math.round(e.top * t)
	});
}
//#endregion
//#region node_modules/fancy-canvas/canvas-rendering-target.mjs
var _ = function() {
	function e(e, t, n) {
		if (t.width === 0 || t.height === 0) throw TypeError("Rendering target could only be created on a media with positive width and height");
		if (this._mediaSize = t, n.width === 0 || n.height === 0) throw TypeError("Rendering target could only be created using a bitmap with positive integer width and height");
		this._bitmapSize = n, this._context = e;
	}
	return e.prototype.useMediaCoordinateSpace = function(e) {
		try {
			return this._context.save(), this._context.setTransform(1, 0, 0, 1, 0, 0), this._context.scale(this._horizontalPixelRatio, this._verticalPixelRatio), e({
				context: this._context,
				mediaSize: this._mediaSize
			});
		} finally {
			this._context.restore();
		}
	}, e.prototype.useBitmapCoordinateSpace = function(e) {
		try {
			return this._context.save(), this._context.setTransform(1, 0, 0, 1, 0, 0), e({
				context: this._context,
				mediaSize: this._mediaSize,
				bitmapSize: this._bitmapSize,
				horizontalPixelRatio: this._horizontalPixelRatio,
				verticalPixelRatio: this._verticalPixelRatio
			});
		} finally {
			this._context.restore();
		}
	}, Object.defineProperty(e.prototype, "_horizontalPixelRatio", {
		get: function() {
			return this._bitmapSize.width / this._mediaSize.width;
		},
		enumerable: !1,
		configurable: !0
	}), Object.defineProperty(e.prototype, "_verticalPixelRatio", {
		get: function() {
			return this._bitmapSize.height / this._mediaSize.height;
		},
		enumerable: !1,
		configurable: !0
	}), e;
}();
function v(e, t) {
	var n = e.canvasElementClientSize;
	if (n.width === 0 || n.height === 0) return null;
	var r = e.bitmapSize;
	if (r.width === 0 || r.height === 0) return null;
	var i = e.canvasElement.getContext("2d", t);
	return i === null ? null : new _(i, n, r);
}
//#endregion
//#region node_modules/lightweight-charts/dist/lightweight-charts.production.mjs
var y = {
	title: "",
	visible: !0,
	hitTestTolerance: 3,
	lastValueVisible: !0,
	priceLineVisible: !0,
	priceLineSource: 0,
	priceLineWidth: 1,
	priceLineColor: "",
	priceLineStyle: 2,
	baseLineVisible: !0,
	baseLineWidth: 1,
	baseLineColor: "#B2B5BE",
	baseLineStyle: 0,
	priceFormat: {
		type: "price",
		precision: 2,
		minMove: .01
	}
}, b, x;
function S(e, t) {
	let n = function(e, t) {
		switch (e) {
			case 0:
			default: return [];
			case 1: return [t, t];
			case 2: return [2 * t, 2 * t];
			case 3: return [6 * t, 6 * t];
			case 4: return [t, 4 * t];
		}
	}(t, e.lineWidth);
	return e.setLineDash(n), n;
}
function C(e, t, n, r) {
	e.beginPath();
	let i = e.lineWidth % 2 ? .5 : 0;
	e.moveTo(n, t + i), e.lineTo(r, t + i), e.stroke();
}
function w(e, t) {
	if (!e) throw Error("Assertion failed" + (t ? ": " + t : ""));
}
function T(e) {
	if (e === void 0) throw Error("Value is undefined");
	return e;
}
function E(e) {
	if (e === null) throw Error("Value is null");
	return e;
}
function D(e) {
	return E(T(e));
}
(function(e) {
	e[e.Simple = 0] = "Simple", e[e.WithSteps = 1] = "WithSteps", e[e.Curved = 2] = "Curved";
})(b ||= {}), function(e) {
	e[e.Solid = 0] = "Solid", e[e.Dotted = 1] = "Dotted", e[e.Dashed = 2] = "Dashed", e[e.LargeDashed = 3] = "LargeDashed", e[e.SparseDotted = 4] = "SparseDotted";
}(x ||= {});
var O = class {
	constructor() {
		this.t = [];
	}
	i(e, t, n) {
		let r = {
			h: e,
			l: t,
			o: !0 === n
		};
		this.t.push(r);
	}
	_(e) {
		let t = this.t.findIndex(((t) => e === t.h));
		t > -1 && this.t.splice(t, 1);
	}
	u(e) {
		this.t = this.t.filter(((t) => t.l !== e));
	}
	p(e, t, n) {
		let r = [...this.t];
		this.t = this.t.filter(((e) => !e.o)), r.forEach(((r) => r.h(e, t, n)));
	}
	v() {
		return this.t.length > 0;
	}
	m() {
		this.t = [];
	}
};
function k(e, ...t) {
	for (let n of t) for (let t in n) n[t] !== void 0 && Object.prototype.hasOwnProperty.call(n, t) && ![
		"__proto__",
		"constructor",
		"prototype"
	].includes(t) && (typeof n[t] != "object" || e[t] === void 0 || Array.isArray(n[t]) ? e[t] = n[t] : k(e[t], n[t]));
	return e;
}
function A(e) {
	return typeof e == "number" && isFinite(e);
}
function j(e) {
	return typeof e == "number" && e % 1 == 0;
}
function M(e) {
	return typeof e == "string";
}
function ee(e) {
	return typeof e == "boolean";
}
function N(e) {
	let t = e;
	if (!t || typeof t != "object") return t;
	let n, r, i;
	for (r in n = Array.isArray(t) ? [] : {}, t) t.hasOwnProperty(r) && (i = t[r], n[r] = i && typeof i == "object" ? N(i) : i);
	return n;
}
function te(e) {
	return e !== null;
}
function ne(e) {
	return e === null ? void 0 : e;
}
var P = "-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif";
function F(e, t, n) {
	return t === void 0 && (t = P), `${n = n === void 0 ? "" : `${n} `}${e}px ${t}`;
}
var re = class {
	constructor(e) {
		this.M = {
			S: 1,
			C: 5,
			P: NaN,
			k: "",
			T: "",
			R: "",
			D: "",
			I: 0,
			V: 0,
			B: 0,
			A: 0,
			L: 0
		}, this.O = e;
	}
	N() {
		let e = this.M, t = this.F(), n = this.W();
		return e.P === t && e.T === n || (e.P = t, e.T = n, e.k = F(t, n), e.A = 2.5 / 12 * t, e.I = e.A, e.V = t / 12 * e.C, e.B = t / 12 * e.C, e.L = 0), e.R = this.H(), e.D = this.U(), this.M;
	}
	H() {
		return this.O.N().layout.textColor;
	}
	U() {
		return this.O.$();
	}
	F() {
		return this.O.N().layout.fontSize;
	}
	W() {
		return this.O.N().layout.fontFamily;
	}
};
function I(e) {
	return e < 0 ? 0 : e > 255 ? 255 : Math.round(e) || 0;
}
function L(e) {
	return .199 * e[0] + .687 * e[1] + .114 * e[2];
}
var R = class {
	constructor(e, t) {
		this.j = /* @__PURE__ */ new Map(), this.q = e, t && (this.j = t);
	}
	Y(e, t) {
		if (e === "transparent") return e;
		let n = this.K(e), r = n[3];
		return `rgba(${n[0]}, ${n[1]}, ${n[2]}, ${t * r})`;
	}
	G(e) {
		let t = this.K(e);
		return {
			Z: `rgb(${t[0]}, ${t[1]}, ${t[2]})`,
			X: L(t) > 160 ? "black" : "white"
		};
	}
	J(e) {
		return L(this.K(e));
	}
	tt(e, t, n) {
		let [r, i, a, o] = this.K(e), [s, c, l, u] = this.K(t), d = [
			I(r + n * (s - r)),
			I(i + n * (c - i)),
			I(a + n * (l - a)),
			(f = o + n * (u - o), f <= 0 || f > 1 ? Math.min(Math.max(f, 0), 1) : Math.round(1e4 * f) / 1e4)
		];
		var f;
		return `rgba(${d[0]}, ${d[1]}, ${d[2]}, ${d[3]})`;
	}
	K(e) {
		let t = this.j.get(e);
		if (t) return t;
		let n = function(e) {
			let t = document.createElement("div");
			t.style.display = "none", document.body.appendChild(t), t.style.color = e;
			let n = window.getComputedStyle(t).color;
			return document.body.removeChild(t), n;
		}(e).match(/^rgba?\s*\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)$/);
		if (!n) {
			if (this.q.length) for (let t of this.q) {
				let n = t(e);
				if (n) return this.j.set(e, n), n;
			}
			throw Error(`Failed to parse color: ${e}`);
		}
		let r = [
			parseInt(n[1], 10),
			parseInt(n[2], 10),
			parseInt(n[3], 10),
			n[4] ? parseFloat(n[4]) : 1
		];
		return this.j.set(e, r), r;
	}
}, z = class {
	constructor() {
		this.it = [];
	}
	nt(e) {
		this.it = e;
	}
	st(e, t, n) {
		this.it.forEach(((r) => {
			r.st(e, t, n);
		}));
	}
}, B = class {
	st(e, t, n) {
		e.useBitmapCoordinateSpace(((e) => this.et(e, t, n)));
	}
}, ie = class extends B {
	constructor() {
		super(...arguments), this.rt = null;
	}
	ht(e) {
		this.rt = e;
	}
	et({ context: e, horizontalPixelRatio: t, verticalPixelRatio: n }) {
		if (this.rt === null || this.rt.lt === null) return;
		let r = this.rt.lt, i = this.rt, a = Math.max(1, Math.floor(t)) % 2 / 2, o = (o) => {
			e.beginPath();
			for (let s = r.to - 1; s >= r.from; --s) {
				let r = i.ot[s], c = Math.round(r._t * t) + a, l = r.ut * n, u = o * n + a;
				e.moveTo(c, l), e.arc(c, l, u, 0, 2 * Math.PI);
			}
			e.fill();
		};
		i.ct > 0 && (e.fillStyle = i.dt, o(i.ft + i.ct)), e.fillStyle = i.vt, o(i.ft);
	}
};
function V() {
	return {
		ot: [{
			_t: 0,
			ut: 0,
			wt: 0,
			Mt: 0
		}],
		vt: "",
		dt: "",
		ft: 0,
		ct: 0,
		lt: null
	};
}
var H = {
	from: 0,
	to: 1
}, ae = class {
	constructor(e, t, n) {
		this.gt = new z(), this.bt = [], this.St = [], this.xt = !0, this.O = e, this.Ct = t, this.yt = n, this.gt.nt(this.bt);
	}
	Pt(e) {
		this.kt(), this.xt = !0;
	}
	Tt() {
		return this.xt &&= (this.Rt(), !1), this.gt;
	}
	kt() {
		let e = this.yt.Dt();
		e.length !== this.bt.length && (this.St = e.map(V), this.bt = this.St.map(((e) => {
			let t = new ie();
			return t.ht(e), t;
		})), this.gt.nt(this.bt));
	}
	Rt() {
		let e = this.Ct.N().mode === 2 || !this.Ct.It(), t = this.yt.Vt(), n = this.Ct.Bt(), r = this.O.Et();
		this.kt(), t.forEach(((t, i) => {
			let a = this.St[i], o = t.At(n), s = t.Lt();
			!e && o !== null && t.It() && s !== null ? (a.vt = o.zt, a.ft = o.ft, a.ct = o.Ot, a.ot[0].Mt = o.Mt, a.ot[0].ut = t.Ft().Nt(o.Mt, s.Wt), a.dt = o.Ht ?? this.O.Ut(a.ot[0].ut / t.Ft().$t()), a.ot[0].wt = n, a.ot[0]._t = r.jt(n), a.lt = H) : a.lt = null;
		}));
	}
}, oe = class extends B {
	constructor(e) {
		super(), this.qt = e;
	}
	et({ context: e, bitmapSize: t, horizontalPixelRatio: n, verticalPixelRatio: r }) {
		if (this.qt === null) return;
		let i = this.qt.Yt.It, a = this.qt.Kt.It;
		if (!i && !a) return;
		let o = Math.round(this.qt._t * n), s = Math.round(this.qt.ut * r);
		e.lineCap = "butt", i && o >= 0 && (e.lineWidth = Math.floor(this.qt.Yt.ct * n), e.strokeStyle = this.qt.Yt.R, e.fillStyle = this.qt.Yt.R, S(e, this.qt.Yt.Gt), function(e, t, n, r) {
			e.beginPath();
			let i = e.lineWidth % 2 ? .5 : 0;
			e.moveTo(t + i, n), e.lineTo(t + i, r), e.stroke();
		}(e, o, 0, t.height)), a && s >= 0 && (e.lineWidth = Math.floor(this.qt.Kt.ct * r), e.strokeStyle = this.qt.Kt.R, e.fillStyle = this.qt.Kt.R, S(e, this.qt.Kt.Gt), C(e, s, 0, t.width));
	}
}, se = class {
	constructor(e, t) {
		this.xt = !0, this.Zt = {
			Yt: {
				ct: 1,
				Gt: 0,
				R: "",
				It: !1
			},
			Kt: {
				ct: 1,
				Gt: 0,
				R: "",
				It: !1
			},
			_t: 0,
			ut: 0
		}, this.Xt = new oe(this.Zt), this.Jt = e, this.yt = t;
	}
	Pt() {
		this.xt = !0;
	}
	Tt(e) {
		return this.xt &&= (this.Rt(), !1), this.Xt;
	}
	Rt() {
		let e = this.Jt.It(), t = this.yt.Qt().N().crosshair, n = this.Zt;
		if (t.mode === 2) return n.Kt.It = !1, void (n.Yt.It = !1);
		n.Kt.It = e && this.Jt.ti(this.yt), n.Yt.It = e && this.Jt.ii(), n.Kt.ct = t.horzLine.width, n.Kt.Gt = t.horzLine.style, n.Kt.R = t.horzLine.color, n.Yt.ct = t.vertLine.width, n.Yt.Gt = t.vertLine.style, n.Yt.R = t.vertLine.color, n._t = this.Jt.ni(), n.ut = this.Jt.si();
	}
};
function U(e, t, n, r, i, a) {
	e.fillRect(t + a, n, r - 2 * a, a), e.fillRect(t + a, n + i - a, r - 2 * a, a), e.fillRect(t, n, a, i), e.fillRect(t + r - a, n, a, i);
}
function ce(e, t, n, r, i, a) {
	e.save(), e.globalCompositeOperation = "copy", e.fillStyle = a, e.fillRect(t, n, r, i), e.restore();
}
function le(e, t, n, r, i, a) {
	e.beginPath(), e.roundRect ? e.roundRect(t, n, r, i, a) : (e.lineTo(t + r - a[1], n), a[1] !== 0 && e.arcTo(t + r, n, t + r, n + a[1], a[1]), e.lineTo(t + r, n + i - a[2]), a[2] !== 0 && e.arcTo(t + r, n + i, t + r - a[2], n + i, a[2]), e.lineTo(t + a[3], n + i), a[3] !== 0 && e.arcTo(t, n + i, t, n + i - a[3], a[3]), e.lineTo(t, n + a[0]), a[0] !== 0 && e.arcTo(t, n, t + a[0], n, a[0]));
}
function W(e, t, n, r, i, a, o = 0, s = [
	0,
	0,
	0,
	0
], c = "") {
	if (e.save(), !o || !c || c === a) return le(e, t, n, r, i, s), e.fillStyle = a, e.fill(), void e.restore();
	let l = o / 2;
	var u;
	le(e, t + l, n + l, r - o, i - o, (u = -l, s.map(((e) => e === 0 ? e : e + u)))), a !== "transparent" && (e.fillStyle = a, e.fill()), c !== "transparent" && (e.lineWidth = o, e.strokeStyle = c, e.closePath(), e.stroke()), e.restore();
}
function ue(e, t, n, r, i, a, o) {
	e.save(), e.globalCompositeOperation = "copy";
	let s = e.createLinearGradient(0, 0, 0, i);
	s.addColorStop(0, a), s.addColorStop(1, o), e.fillStyle = s, e.fillRect(t, n, r, i), e.restore();
}
var de = class {
	constructor(e, t) {
		this.ht(e, t);
	}
	ht(e, t) {
		this.qt = e, this.ei = t;
	}
	$t(e, t) {
		return this.qt.It ? e.P + e.A + e.I : 0;
	}
	st(e, t, n, r) {
		if (!this.qt.It || this.qt.ri.length === 0) return;
		let i = this.qt.R, a = this.ei.Z, o = e.useBitmapCoordinateSpace(((e) => {
			let o = e.context;
			o.font = t.k;
			let s = this.hi(e, t, n, r), c = s.ai;
			return s.li ? W(o, c.oi, c._i, c.ui, c.ci, a, c.di, [
				c.ft,
				0,
				0,
				c.ft
			], a) : W(o, c.fi, c._i, c.ui, c.ci, a, c.di, [
				0,
				c.ft,
				c.ft,
				0
			], a), this.qt.pi && (o.fillStyle = i, o.fillRect(c.fi, c.mi, c.wi - c.fi, c.Mi)), this.qt.gi && (o.fillStyle = t.D, o.fillRect(s.li ? c.bi - c.di : 0, c._i, c.di, c.Si - c._i)), s;
		}));
		e.useMediaCoordinateSpace((({ context: e }) => {
			let n = o.xi;
			e.font = t.k, e.textAlign = o.li ? "right" : "left", e.textBaseline = "middle", e.fillStyle = i, e.fillText(this.qt.ri, n.Ci, (n._i + n.Si) / 2 + n.yi);
		}));
	}
	hi(e, t, n, r) {
		let { context: i, bitmapSize: a, mediaSize: o, horizontalPixelRatio: s, verticalPixelRatio: c } = e, l = this.qt.pi || !this.qt.Pi ? t.C : 0, u = this.qt.ki ? t.S : 0, d = t.A + this.ei.Ti, f = t.I + this.ei.Ri, p = t.V, m = t.B, h = this.qt.ri, g = t.P, _ = n.Di(i, h), v = Math.ceil(n.Ii(i, h)), y = g + d + f, b = t.S + p + m + v + l, x = Math.max(1, Math.floor(c)), S = Math.round(y * c);
		S % 2 != x % 2 && (S += 1);
		let C = u > 0 ? Math.max(1, Math.floor(u * s)) : 0, w = Math.round(b * s), T = Math.round(l * s), E = this.ei.Vi ?? this.ei.Bi ?? this.ei.Ei, D = Math.round(E * c) - Math.floor(.5 * c), O = Math.floor(D + x / 2 - S / 2), k = O + S, A = r === "right", j = A ? o.width - u : u, M = A ? a.width - C : C, ee, N, te;
		return A ? (ee = M - w, N = M - T, te = j - l - p - u) : (ee = M + w, N = M + T, te = j + l + p), {
			li: A,
			ai: {
				_i: O,
				mi: D,
				Si: k,
				ui: w,
				ci: S,
				ft: 2 * s,
				di: C,
				oi: ee,
				fi: M,
				wi: N,
				Mi: x,
				bi: a.width
			},
			xi: {
				_i: O / c,
				Si: k / c,
				Ci: te,
				yi: _
			}
		};
	}
}, fe = class {
	constructor(e) {
		this.Ai = {
			Ei: 0,
			Z: "#000",
			Ri: 0,
			Ti: 0
		}, this.Li = {
			ri: "",
			It: !1,
			pi: !0,
			Pi: !1,
			Ht: "",
			R: "#FFF",
			gi: !1,
			ki: !1
		}, this.zi = {
			ri: "",
			It: !1,
			pi: !1,
			Pi: !0,
			Ht: "",
			R: "#FFF",
			gi: !0,
			ki: !0
		}, this.xt = !0, this.Oi = new (e || de)(this.Li, this.Ai), this.Ni = new (e || de)(this.zi, this.Ai);
	}
	ri() {
		return this.Fi(), this.Li.ri;
	}
	Ei() {
		return this.Fi(), this.Ai.Ei;
	}
	Pt() {
		this.xt = !0;
	}
	$t(e, t = !1) {
		return Math.max(this.Oi.$t(e, t), this.Ni.$t(e, t));
	}
	Wi() {
		return this.Ai.Vi ?? null;
	}
	Hi() {
		return this.Ai.Vi ?? this.Ai.Bi ?? this.Ei();
	}
	Ui(e) {
		this.Ai.Bi = e ?? void 0;
	}
	$i() {
		return this.Fi(), this.Li.It || this.zi.It;
	}
	ji() {
		return this.Fi(), this.Li.It;
	}
	Tt(e) {
		return this.Fi(), this.Li.pi = this.Li.pi && e.N().ticksVisible, this.zi.pi = this.zi.pi && e.N().ticksVisible, this.Oi.ht(this.Li, this.Ai), this.Ni.ht(this.zi, this.Ai), this.Oi;
	}
	qi() {
		return this.Fi(), this.Oi.ht(this.Li, this.Ai), this.Ni.ht(this.zi, this.Ai), this.Ni;
	}
	Fi() {
		this.xt && (this.Li.pi = !0, this.zi.pi = !1, this.Yi(this.Li, this.zi, this.Ai));
	}
}, pe = class extends fe {
	constructor(e, t, n) {
		super(), this.Jt = e, this.Ki = t, this.Gi = n;
	}
	Yi(e, t, n) {
		if (e.It = !1, this.Jt.N().mode === 2) return;
		let r = this.Jt.N().horzLine;
		if (!r.labelVisible) return;
		let i = this.Ki.Lt();
		if (!this.Jt.It() || this.Ki.Zi() || i === null) return;
		let a = this.Ki.Xi().G(r.labelBackgroundColor);
		n.Z = a.Z, e.R = a.X;
		let o = 2 / 12 * this.Ki.P();
		n.Ti = o, n.Ri = o;
		let s = this.Gi(this.Ki);
		n.Ei = s.Ei, e.ri = this.Ki.Ji(s.Mt, i), e.It = !0;
	}
}, G = /[1-9]/g, me = class {
	constructor() {
		this.qt = null;
	}
	ht(e) {
		this.qt = e;
	}
	st(e, t) {
		if (this.qt === null || !1 === this.qt.It || this.qt.ri.length === 0) return;
		let n = e.useMediaCoordinateSpace((({ context: e }) => (e.font = t.k, Math.round(t.Qi.Ii(e, E(this.qt).ri, G)))));
		if (n <= 0) return;
		let r = t.tn, i = n + 2 * r, a = i / 2, o = this.qt.nn, s = this.qt.Ei, c = Math.floor(s - a) + .5;
		c < 0 ? (s += Math.abs(0 - c), c = Math.floor(s - a) + .5) : c + i > o && (s -= Math.abs(o - (c + i)), c = Math.floor(s - a) + .5);
		let l = c + i, u = Math.ceil(0 + t.S + t.C + t.A + t.P + t.I);
		e.useBitmapCoordinateSpace((({ context: e, horizontalPixelRatio: n, verticalPixelRatio: r }) => {
			let i = E(this.qt);
			e.fillStyle = i.Z;
			let a = Math.round(c * n), o = Math.round(0 * r), s = Math.round(l * n), d = Math.round(u * r), f = Math.round(2 * n);
			if (e.beginPath(), e.moveTo(a, o), e.lineTo(a, d - f), e.arcTo(a, d, a + f, d, f), e.lineTo(s - f, d), e.arcTo(s, d, s, d - f, f), e.lineTo(s, o), e.fill(), i.pi) {
				let a = Math.round(i.Ei * n), s = o, c = Math.round((s + t.C) * r);
				e.fillStyle = i.R;
				let l = Math.max(1, Math.floor(n)), u = Math.floor(.5 * n);
				e.fillRect(a - u, s, l, c - s);
			}
		})), e.useMediaCoordinateSpace((({ context: e }) => {
			let n = E(this.qt), i = 0 + t.S + t.C + t.A + t.P / 2;
			e.font = t.k, e.textAlign = "left", e.textBaseline = "middle", e.fillStyle = n.R;
			let a = t.Qi.Di(e, "Apr0");
			e.translate(c + r, i + a), e.fillText(n.ri, 0, 0);
		}));
	}
}, he = class {
	constructor(e, t, n) {
		this.xt = !0, this.Xt = new me(), this.Zt = {
			It: !1,
			Z: "#4c525e",
			R: "white",
			ri: "",
			nn: 0,
			Ei: NaN,
			pi: !0
		}, this.Ct = e, this.sn = t, this.Gi = n;
	}
	Pt() {
		this.xt = !0;
	}
	Tt() {
		return this.xt &&= (this.Rt(), !1), this.Xt.ht(this.Zt), this.Xt;
	}
	Rt() {
		let e = this.Zt;
		if (e.It = !1, this.Ct.N().mode === 2) return;
		let t = this.Ct.N().vertLine;
		if (!t.labelVisible) return;
		let n = this.sn.Et();
		if (n.Zi()) return;
		e.nn = n.nn();
		let r = this.Gi();
		if (r === null) return;
		e.Ei = r.Ei;
		let i = n.en(this.Ct.Bt());
		e.ri = n.rn(E(i)), e.It = !0;
		let a = this.sn.Xi().G(t.labelBackgroundColor);
		e.Z = a.Z, e.R = a.X, e.pi = n.N().ticksVisible;
	}
}, ge = class {
	constructor() {
		this.hn = null, this.an = 0;
	}
	ln() {
		return this.an;
	}
	_n(e) {
		this.an = e;
	}
	Ft() {
		return this.hn;
	}
	un(e) {
		this.hn = e;
	}
	cn(e) {
		return [];
	}
	dn() {
		return [];
	}
	It() {
		return !0;
	}
}, _e;
(function(e) {
	e[e.Normal = 0] = "Normal", e[e.Magnet = 1] = "Magnet", e[e.Hidden = 2] = "Hidden", e[e.MagnetOHLC = 3] = "MagnetOHLC";
})(_e ||= {});
var K = class extends ge {
	constructor(e, t) {
		super(), this.yt = null, this.fn = NaN, this.pn = 0, this.vn = !1, this.mn = /* @__PURE__ */ new Map(), this.wn = !1, this.Mn = /* @__PURE__ */ new WeakMap(), this.gn = /* @__PURE__ */ new WeakMap(), this.bn = NaN, this.Sn = NaN, this.xn = NaN, this.Cn = NaN, this.sn = e, this.yn = t, this.Pn = ((e, t) => (n) => {
			let r = t(), i = e();
			if (n === E(this.yt).kn()) return {
				Mt: i,
				Ei: r
			};
			{
				let e = E(n.Lt());
				return {
					Mt: n.Tn(r, e),
					Ei: r
				};
			}
		})((() => this.fn), (() => this.Sn));
		let n = ((e, t) => () => {
			let n = this.sn.Et().Rn(e()), r = t();
			return n && Number.isFinite(r) ? {
				wt: n,
				Ei: r
			} : null;
		})((() => this.pn), (() => this.ni()));
		this.Dn = new he(this, e, n);
	}
	N() {
		return this.yn;
	}
	In(e, t) {
		this.xn = e, this.Cn = t;
	}
	Vn() {
		this.xn = NaN, this.Cn = NaN;
	}
	Bn() {
		return this.xn;
	}
	En() {
		return this.Cn;
	}
	An(e, t, n) {
		this.wn ||= !0, this.vn = !0, this.Ln(e, t, n);
	}
	Bt() {
		return this.pn;
	}
	ni() {
		return this.bn;
	}
	si() {
		return this.Sn;
	}
	It() {
		return this.vn;
	}
	zn() {
		this.vn = !1, this.On(), this.fn = NaN, this.bn = NaN, this.Sn = NaN, this.yt = null, this.Vn(), this.Nn();
	}
	Fn(e) {
		if (!this.yn.doNotSnapToHiddenSeriesIndices) return e;
		let t = this.sn, n = t.Et(), r = null, i = null;
		for (let n of t.Wn()) {
			let t = n.Un().Hn(e, -1);
			if (t) {
				if (t.$n === e) return e;
				(r === null || t.$n > r) && (r = t.$n);
			}
			let a = n.Un().Hn(e, 1);
			if (a) {
				if (a.$n === e) return e;
				(i === null || a.$n < i) && (i = a.$n);
			}
		}
		let a = [r, i].filter(te);
		if (a.length === 0) return e;
		let o = n.jt(e), s = a.map(((e) => Math.abs(o - n.jt(e))));
		return a[s.indexOf(Math.min(...s))];
	}
	jn(e) {
		let t = this.Mn.get(e);
		t || (t = new se(this, e), this.Mn.set(e, t));
		let n = this.gn.get(e);
		return n || (n = new ae(this.sn, this, e), this.gn.set(e, n)), [t, n];
	}
	ti(e) {
		return e === this.yt && this.yn.horzLine.visible;
	}
	ii() {
		return this.yn.vertLine.visible;
	}
	qn(e, t) {
		this.vn && this.yt === e || this.mn.clear();
		let n = [];
		return this.yt === e && n.push(this.Yn(this.mn, t, this.Pn)), n;
	}
	dn() {
		return this.vn ? [this.Dn] : [];
	}
	Kn() {
		return this.yt;
	}
	Nn() {
		this.sn.Gn().forEach(((e) => {
			this.Mn.get(e)?.Pt(), this.gn.get(e)?.Pt();
		})), this.mn.forEach(((e) => e.Pt())), this.Dn.Pt();
	}
	Zn(e) {
		return e && !e.kn().Zi() ? e.kn() : null;
	}
	Ln(e, t, n) {
		this.Xn(e, t, n) && this.Nn();
	}
	Xn(e, t, n) {
		let r = this.bn, i = this.Sn, a = this.fn, o = this.pn, s = this.yt, c = this.Zn(n);
		this.pn = e, this.bn = isNaN(e) ? NaN : this.sn.Et().jt(e), this.yt = n;
		let l = c === null ? null : c.Lt();
		return c !== null && l !== null ? (this.fn = t, this.Sn = c.Nt(t, l)) : (this.fn = NaN, this.Sn = NaN), r !== this.bn || i !== this.Sn || o !== this.pn || a !== this.fn || s !== this.yt;
	}
	On() {
		let e = this.sn.Jn().map(((e) => e.Un().Qn())).filter(te), t = e.length === 0 ? null : Math.max(...e);
		this.pn = t === null ? NaN : t;
	}
	Yn(e, t, n) {
		let r = e.get(t);
		return r === void 0 && (r = new pe(this, t, n), e.set(t, r)), r;
	}
};
function ve(e) {
	return e === "left" || e === "right";
}
var ye = class e {
	constructor(e) {
		this.ts = /* @__PURE__ */ new Map(), this.ns = [], this.ss = e;
	}
	es(e, t) {
		let n = function(e, t) {
			return e === void 0 ? t : {
				rs: Math.max(e.rs, t.rs),
				hs: e.hs || t.hs
			};
		}(this.ts.get(e), t);
		this.ts.set(e, n);
	}
	ls() {
		return this.ss;
	}
	_s(e) {
		let t = this.ts.get(e);
		return t === void 0 ? { rs: this.ss } : {
			rs: Math.max(this.ss, t.rs),
			hs: t.hs
		};
	}
	us() {
		this.cs(), this.ns = [{ ds: 0 }];
	}
	fs(e) {
		this.cs(), this.ns = [{
			ds: 1,
			Wt: e
		}];
	}
	ps(e) {
		this.vs(), this.ns.push({
			ds: 5,
			Wt: e
		});
	}
	cs() {
		this.vs(), this.ns.push({ ds: 6 });
	}
	ws() {
		this.cs(), this.ns = [{ ds: 4 }];
	}
	Ms(e) {
		this.cs(), this.ns.push({
			ds: 2,
			Wt: e
		});
	}
	gs(e) {
		this.cs(), this.ns.push({
			ds: 3,
			Wt: e
		});
	}
	bs() {
		return this.ns;
	}
	Ss(e) {
		for (let t of e.ns) this.xs(t);
		this.ss = Math.max(this.ss, e.ss), e.ts.forEach(((e, t) => {
			this.es(t, e);
		}));
	}
	static Cs() {
		return new e(2);
	}
	static ys() {
		return new e(3);
	}
	xs(e) {
		switch (e.ds) {
			case 0:
				this.us();
				break;
			case 1:
				this.fs(e.Wt);
				break;
			case 2:
				this.Ms(e.Wt);
				break;
			case 3:
				this.gs(e.Wt);
				break;
			case 4:
				this.ws();
				break;
			case 5:
				this.ps(e.Wt);
				break;
			case 6: this.vs();
		}
	}
	vs() {
		let e = this.ns.findIndex(((e) => e.ds === 5));
		e !== -1 && this.ns.splice(e, 1);
	}
}, be = class {
	formatTickmarks(e) {
		return e.map(((e) => this.format(e)));
	}
}, xe = ".";
function Se(e, t) {
	if (!A(e)) return "n/a";
	if (!j(t) || t < 0 || t > 16) throw TypeError("invalid length");
	return t === 0 ? e.toString() : ("0000000000000000" + e.toString()).slice(-t);
}
var Ce = class extends be {
	constructor(e, t) {
		if (super(), t ||= 1, A(e) && j(e) || (e = 100), e < 0) throw TypeError("invalid base");
		this.Ki = e, this.Ps = t, this.ks();
	}
	format(e) {
		let t = e < 0 ? "−" : "";
		return e = Math.abs(e), t + this.Ts(e);
	}
	ks() {
		if (this.Rs = 0, this.Ki > 0 && this.Ps > 0) {
			let e = this.Ki;
			for (; e > 1;) e /= 10, this.Rs++;
		}
	}
	Ts(e) {
		let t = this.Ki / this.Ps, n = Math.floor(e), r = "", i = this.Rs === void 0 ? NaN : this.Rs;
		if (t > 1) {
			let a = +(Math.round(e * t) - n * t).toFixed(this.Rs);
			a >= t && (a -= t, n += 1), r = xe + Se(+a.toFixed(this.Rs) * this.Ps, i);
		} else n = Math.round(n * t) / t, i > 0 && (r = xe + Se(0, i));
		return n.toFixed(0) + r;
	}
}, we = class extends Ce {
	constructor(e = 100) {
		super(e);
	}
	format(e) {
		return `${super.format(e)}%`;
	}
}, Te = class extends be {
	constructor(e) {
		super(), this.Ds = e;
	}
	format(e) {
		let t = "";
		return e < 0 && (t = "-", e = -e), e < 995 ? t + this.Is(e) : e < 999995 ? t + this.Is(e / 1e3) + "K" : e < 999999995 ? (e = 1e3 * Math.round(e / 1e3), t + this.Is(e / 1e6) + "M") : (e = 1e6 * Math.round(e / 1e6), t + this.Is(e / 1e9) + "B");
	}
	Is(e) {
		let t, n = 10 ** this.Ds;
		return t = (e = Math.round(e * n) / n) >= 1e-15 && e < 1 ? e.toFixed(this.Ds).replace(/\.?0+$/, "") : String(e), t.replace(/(\.[1-9]*)0+$/, ((e, t) => t));
	}
}, Ee = /[2-9]/g, De = class {
	constructor(e = 50) {
		this.Vs = 0, this.Bs = 1, this.Es = 1, this.As = {}, this.Ls = /* @__PURE__ */ new Map(), this.zs = e;
	}
	Os() {
		this.Vs = 0, this.Ls.clear(), this.Bs = 1, this.Es = 1, this.As = {};
	}
	Ii(e, t, n) {
		return this.Ns(e, t, n).width;
	}
	Di(e, t, n) {
		let r = this.Ns(e, t, n);
		return ((r.actualBoundingBoxAscent || 0) - (r.actualBoundingBoxDescent || 0)) / 2;
	}
	Ns(e, t, n) {
		let r = n || Ee, i = String(t).replace(r, "0");
		if (this.Ls.has(i)) return T(this.Ls.get(i)).Fs;
		if (this.Vs === this.zs) {
			let e = this.As[this.Es];
			delete this.As[this.Es], this.Ls.delete(e), this.Es++, this.Vs--;
		}
		e.save(), e.textBaseline = "middle";
		let a = e.measureText(i);
		return e.restore(), a.width === 0 && t.length || (this.Ls.set(i, {
			Fs: a,
			Ws: this.Bs
		}), this.As[this.Bs] = i, this.Vs++, this.Bs++), a;
	}
}, Oe = class {
	constructor(e) {
		this.Hs = null, this.M = null, this.Us = "right", this.$s = e;
	}
	js(e, t, n) {
		this.Hs = e, this.M = t, this.Us = n;
	}
	st(e) {
		this.M !== null && this.Hs !== null && this.Hs.st(e, this.M, this.$s, this.Us);
	}
}, ke = class {
	constructor(e, t, n) {
		this.qs = e, this.$s = new De(50), this.Ys = t, this.O = n, this.F = -1, this.Xt = new Oe(this.$s);
	}
	Tt() {
		let e = this.O.Ks(this.Ys);
		if (e === null) return null;
		let t = e.Gs(this.Ys) ? e.Zs() : this.Ys.Ft();
		if (t === null) return null;
		let n = e.Xs(t);
		if (n === "overlay") return null;
		let r = this.O.Js();
		return r.P !== this.F && (this.F = r.P, this.$s.Os()), this.Xt.js(this.qs.qi(), r, n), this.Xt;
	}
}, Ae = class extends B {
	constructor() {
		super(...arguments), this.qt = null;
	}
	ht(e) {
		this.qt = e;
	}
	Qs(e, t) {
		if (!this.qt?.It) return null;
		let { ut: n, ct: r, te: i } = this.qt;
		return t >= n - r - 7 && t <= n + r + 7 ? {
			ie: this.qt,
			ne: Math.abs(t - n),
			se: 2,
			ee: "price-line",
			te: i
		} : null;
	}
	et({ context: e, bitmapSize: t, horizontalPixelRatio: n, verticalPixelRatio: r }) {
		if (this.qt === null || !1 === this.qt.It) return;
		let i = Math.round(this.qt.ut * r);
		i < 0 || i > t.height || (e.lineCap = "butt", e.strokeStyle = this.qt.R, e.lineWidth = Math.floor(this.qt.ct * n), S(e, this.qt.Gt), C(e, i, 0, t.width));
	}
}, je = class {
	constructor(e) {
		this.re = {
			ut: 0,
			R: "rgba(0, 0, 0, 0)",
			ct: 1,
			Gt: 0,
			It: !1
		}, this.he = new Ae(), this.xt = !0, this.ae = e, this.le = e.Qt(), this.he.ht(this.re);
	}
	Pt() {
		this.xt = !0;
	}
	Tt() {
		return this.ae.It() ? (this.xt &&= (this.oe(), !1), this.he) : null;
	}
}, Me = class extends je {
	constructor(e) {
		super(e);
	}
	oe() {
		this.re.It = !1;
		let e = this.ae.Ft(), t = e._e()._e;
		if (t !== 2 && t !== 3) return;
		let n = this.ae.N();
		if (!n.baseLineVisible || !this.ae.It()) return;
		let r = this.ae.Lt();
		r !== null && (this.re.It = !0, this.re.ut = e.Nt(r.Wt, r.Wt), this.re.R = n.baseLineColor, this.re.ct = n.baseLineWidth, this.re.Gt = n.baseLineStyle);
	}
}, Ne = class extends B {
	constructor() {
		super(...arguments), this.qt = null;
	}
	ht(e) {
		this.qt = e;
	}
	ue() {
		return this.qt;
	}
	et({ context: e, horizontalPixelRatio: t, verticalPixelRatio: n }) {
		let r = this.qt;
		if (r === null) return;
		let i = Math.max(1, Math.floor(t)), a = i % 2 / 2, o = Math.round(r.ce.x * t) + a, s = r.ce.y * n;
		e.fillStyle = r.de, e.beginPath();
		let c = Math.max(2, 1.5 * r.fe) * t;
		e.arc(o, s, c, 0, 2 * Math.PI, !1), e.fill(), e.fillStyle = r.pe, e.beginPath(), e.arc(o, s, r.ft * t, 0, 2 * Math.PI, !1), e.fill(), e.lineWidth = i, e.strokeStyle = r.ve, e.beginPath(), e.arc(o, s, r.ft * t + i / 2, 0, 2 * Math.PI, !1), e.stroke();
	}
}, Pe = [
	{
		me: 0,
		we: .25,
		Me: 4,
		ge: 10,
		be: .25,
		Se: 0,
		xe: .4,
		Ce: .8
	},
	{
		me: .25,
		we: .525,
		Me: 10,
		ge: 14,
		be: 0,
		Se: 0,
		xe: .8,
		Ce: 0
	},
	{
		me: .525,
		we: 1,
		Me: 14,
		ge: 14,
		be: 0,
		Se: 0,
		xe: 0,
		Ce: 0
	}
], Fe = class {
	constructor(e) {
		this.Xt = new Ne(), this.xt = !0, this.ye = !0, this.Pe = performance.now(), this.ke = this.Pe - 1, this.Te = e;
	}
	Re() {
		this.ke = this.Pe - 1, this.Pt();
	}
	De() {
		if (this.Pt(), this.Te.N().lastPriceAnimation === 2) {
			let e = performance.now(), t = this.ke - e;
			if (t > 0) return void (t < 650 && (this.ke += 2600));
			this.Pe = e, this.ke = e + 2600;
		}
	}
	Pt() {
		this.xt = !0;
	}
	Ie() {
		this.ye = !0;
	}
	It() {
		return this.Te.N().lastPriceAnimation !== 0;
	}
	Ve() {
		switch (this.Te.N().lastPriceAnimation) {
			case 0: return !1;
			case 1: return !0;
			case 2: return performance.now() <= this.ke;
		}
	}
	Tt() {
		return this.xt ? (this.Rt(), this.xt = !1, this.ye = !1) : this.ye &&= (this.Be(), !1), this.Xt;
	}
	Rt() {
		this.Xt.ht(null);
		let e = this.Te.Qt().Et(), t = e.Ee(), n = this.Te.Lt();
		if (t === null || n === null) return;
		let r = this.Te.Ae(!0);
		if (r.Le || !t.ze(r.$n)) return;
		let i = {
			x: e.jt(r.$n),
			y: this.Te.Ft().Nt(r.Mt, n.Wt)
		}, a = r.R, o = this.Te.N().lineWidth, s = this.Oe(this.Ne(), a);
		this.Xt.ht({
			de: a,
			fe: o,
			pe: s.pe,
			ve: s.ve,
			ft: s.ft,
			ce: i
		});
	}
	Be() {
		let e = this.Xt.ue();
		if (e !== null) {
			let t = this.Oe(this.Ne(), e.de);
			e.pe = t.pe, e.ve = t.ve, e.ft = t.ft;
		}
	}
	Ne() {
		return this.Ve() ? performance.now() - this.Pe : 2599;
	}
	Fe(e, t, n, r) {
		let i = n + (r - n) * t;
		return this.Te.Qt().Xi().Y(e, i);
	}
	Oe(e, t) {
		let n = e % 2600 / 2600, r;
		for (let e of Pe) if (n >= e.me && n <= e.we) {
			r = e;
			break;
		}
		w(r !== void 0, "Last price animation internal logic error");
		let i = (n - r.me) / (r.we - r.me);
		return {
			pe: this.Fe(t, i, r.be, r.Se),
			ve: this.Fe(t, i, r.xe, r.Ce),
			ft: (a = i, o = r.Me, s = r.ge, o + (s - o) * a)
		};
		var a, o, s;
	}
}, Ie = class extends je {
	constructor(e) {
		super(e);
	}
	oe() {
		let e = this.re;
		e.It = !1;
		let t = this.ae.N();
		if (!t.priceLineVisible || !this.ae.It()) return;
		let n = this.ae.Ae(t.priceLineSource === 0);
		n.Le || (e.It = !0, e.ut = n.Ei, e.R = this.ae.We(n.R), e.ct = t.priceLineWidth, e.Gt = t.priceLineStyle);
	}
}, Le = class extends fe {
	constructor(e) {
		super(), this.Jt = e;
	}
	Yi(e, t, n) {
		e.It = !1, t.It = !1;
		let r = this.Jt;
		if (!r.It()) return;
		let i = r.N(), a = i.lastValueVisible, o = r.He() !== "", s = i.seriesLastValueMode === 0, c = r.Ae(!1);
		if (c.Le) return;
		a && (e.ri = this.Ue(c, a, s), e.It = e.ri.length !== 0), (o || s) && (t.ri = this.$e(c, a, o, s), t.It = t.ri.length > 0);
		let l = r.We(c.R), u = this.Jt.Qt().Xi().G(l);
		n.Z = u.Z, n.Ei = c.Ei, t.Ht = r.Qt().Ut(c.Ei / r.Ft().$t()), e.Ht = l, e.R = u.X, t.R = u.X;
	}
	$e(e, t, n, r) {
		let i = "", a = this.Jt.He();
		return n && a.length !== 0 && (i += `${a} `), t && r && (i += this.Jt.Ft().je() ? e.qe : e.Ye), i.trim();
	}
	Ue(e, t, n) {
		return t ? n ? this.Jt.Ft().je() ? e.Ye : e.qe : e.ri : "";
	}
};
function q(e, t, n, r) {
	let i = Number.isFinite(t), a = Number.isFinite(n);
	return i && a ? e(t, n) : i || a ? i ? t : n : r;
}
var J = class e {
	constructor(e, t) {
		this.Ke = e, this.Ge = t;
	}
	Ze(e) {
		return e !== null && this.Ke === e.Ke && this.Ge === e.Ge;
	}
	Xe() {
		return new e(this.Ke, this.Ge);
	}
	Je() {
		return this.Ke;
	}
	Qe() {
		return this.Ge;
	}
	tr() {
		return this.Ge - this.Ke;
	}
	Zi() {
		return this.Ge === this.Ke || Number.isNaN(this.Ge) || Number.isNaN(this.Ke);
	}
	Ss(t) {
		return t === null ? this : new e(q(Math.min, this.Je(), t.Je(), -1 / 0), q(Math.max, this.Qe(), t.Qe(), 1 / 0));
	}
	ir(e) {
		if (!A(e) || this.Ge - this.Ke === 0) return;
		let t = .5 * (this.Ge + this.Ke), n = this.Ge - t, r = this.Ke - t;
		n *= e, r *= e, this.Ge = t + n, this.Ke = t + r;
	}
	nr(e) {
		A(e) && (this.Ge += e, this.Ke += e);
	}
	sr() {
		return {
			minValue: this.Ke,
			maxValue: this.Ge
		};
	}
	static er(t) {
		return t === null ? null : new e(t.minValue, t.maxValue);
	}
}, Re = class e {
	constructor(e, t) {
		this.rr = e, this.hr = t || null;
	}
	ar() {
		return this.rr;
	}
	lr() {
		return this.hr;
	}
	sr() {
		return {
			priceRange: this.rr === null ? null : this.rr.sr(),
			margins: this.hr || void 0
		};
	}
	static er(t) {
		return t === null ? null : new e(J.er(t.priceRange), t.margins);
	}
}, ze = [
	2,
	4,
	8,
	16,
	32,
	64,
	128,
	256,
	512
], Be = "Custom series with conflation reducer must have a priceValueBuilder method", Y = class extends je {
	constructor(e, t) {
		super(e), this._r = t;
	}
	oe() {
		let e = this.re;
		e.It = !1;
		let t = this._r.N();
		if (!this.ae.It() || !t.lineVisible) return;
		let n = this._r.ur();
		n !== null && (e.It = !0, e.ut = n, e.R = t.color, e.ct = t.lineWidth, e.Gt = t.lineStyle, e.te = this._r.N().id);
	}
}, Ve = class extends fe {
	constructor(e, t) {
		super(), this.Te = e, this._r = t;
	}
	Yi(e, t, n) {
		e.It = !1, t.It = !1;
		let r = this._r.N(), i = r.axisLabelVisible, a = r.title !== "", o = this.Te;
		if (!i || !o.It()) return;
		let s = this._r.ur();
		if (s === null) return;
		a && (t.ri = r.title, t.It = !0), t.Ht = o.Qt().Ut(s / o.Ft().$t()), e.ri = this.cr(r.price), e.It = !0;
		let c = this.Te.Qt().Xi().G(r.axisLabelColor || r.color);
		n.Z = c.Z;
		let l = r.axisLabelTextColor || c.X;
		e.R = l, t.R = l, n.Ei = s;
	}
	cr(e) {
		let t = this.Te.Lt();
		return t === null ? "" : this.Te.Ft().Ji(e, t.Wt);
	}
}, He = class {
	constructor(e, t) {
		this.Te = e, this.yn = t, this.dr = new Y(e, this), this.qs = new Ve(e, this), this.pr = new ke(this.qs, e, e.Qt());
	}
	vr(e) {
		k(this.yn, e), this.Pt(), this.Te.Qt().mr();
	}
	N() {
		return this.yn;
	}
	wr() {
		return this.dr;
	}
	Mr() {
		return this.pr;
	}
	gr() {
		return this.qs;
	}
	Pt() {
		this.dr.Pt(), this.qs.Pt();
	}
	ur() {
		let e = this.Te, t = e.Ft();
		if (e.Qt().Et().Zi() || t.Zi()) return null;
		let n = e.Lt();
		return n === null ? null : t.Nt(this.yn.price, n.Wt);
	}
}, Ue = class {
	constructor() {
		this.br = /* @__PURE__ */ new WeakMap();
	}
	Sr(e, t, n) {
		let r = 1 / t * n;
		if (e >= r) return 1;
		let i = r / e;
		return Math.min(2 ** Math.floor(Math.log2(i)), 512);
	}
	Cr(e, t, n, r = !1, i) {
		if (e.length === 0 || t <= 1) return e;
		let a = this.yr(t);
		if (a <= 1) return e;
		let o = this.Pr(e), s = o.kr.get(a);
		return s !== void 0 || (s = this.Tr(e, a, n, r, i, o.kr), o.kr.set(a, s)), s;
	}
	Rr(e, t, n, r, i = !1, a) {
		if (n < 1 || e.length === 0) return e;
		let o = this.Pr(e), s = o.kr.get(n);
		if (!s) return this.Cr(e, n, r, i, a);
		let c = this.Dr(e, t, n, s, i, r, a);
		return o.kr.set(n, c), c;
	}
	yr(e) {
		if (e <= 2) return 2;
		for (let t of ze) if (e <= t) return t;
		return 512;
	}
	Ir(e) {
		if (e.length === 0) return 0;
		let t = e[0], n = e[e.length - 1];
		return 31 * e.length + 17 * t.$n + 13 * n.$n;
	}
	Tr(e, t, n, r = !1, i, a = /* @__PURE__ */ new Map()) {
		if (t === 2) return this.Vr(e, 2, n, r, i);
		let o = t / 2, s = a.get(o);
		return s || (s = this.Tr(e, o, n, r, i, a), a.set(o, s)), this.Br(s, n, r, i);
	}
	Vr(e, t, n, r = !1, i) {
		let a = this.Er(e, t, n, r, i);
		return this.Ar(a, r);
	}
	Br(e, t, n = !1, r) {
		let i = this.Er(e, 2, t, n, r);
		return this.Ar(i, n);
	}
	Er(e, t, n, r = !1, i) {
		let a = [];
		for (let o = 0; o < e.length; o += t) if (e.length - o >= t) {
			let t = this.Lr(e[o], e[o + 1], n, r, i);
			t.zr = !1, a.push(t);
		} else if (a.length === 0) a.push(this.Or(e[o], !0));
		else {
			let t = a[a.length - 1];
			a[a.length - 1] = this.Nr(t, e[o], n, r, i);
		}
		return a;
	}
	Fr(e, t) {
		return (e ?? 1) + (t ?? 1);
	}
	Lr(e, t, n, r = !1, i) {
		if (!r || !n || !i) {
			let n = e.Wt[1] > t.Wt[1] ? e.Wt[1] : t.Wt[1], r = e.Wt[2] < t.Wt[2] ? e.Wt[2] : t.Wt[2];
			return {
				Wr: e.$n,
				Hr: t.$n,
				Ur: e.wt,
				$r: t.wt,
				jr: e.Wt[0],
				qr: n,
				Yr: r,
				Kr: t.Wt[3],
				Gr: this.Fr(e.Gr, t.Gr),
				Zr: void 0,
				zr: !1
			};
		}
		let a = n(this.Xr(e, i), this.Xr(t, i)), o = i(a), s = o.length ? o[o.length - 1] : 0;
		return {
			Wr: e.$n,
			Hr: t.$n,
			Ur: e.wt,
			$r: t.wt,
			jr: e.Wt[0],
			qr: Math.max(e.Wt[1], s),
			Yr: Math.min(e.Wt[2], s),
			Kr: s,
			Gr: this.Fr(e.Gr, t.Gr),
			Zr: a,
			zr: !1
		};
	}
	Nr(e, t, n, r = !1, i) {
		if (!r || !n || !i) return {
			Wr: e.Wr,
			Hr: t.$n,
			Ur: e.Ur,
			$r: t.wt,
			jr: e.jr,
			qr: e.qr > t.Wt[1] ? e.qr : t.Wt[1],
			Yr: e.Yr < t.Wt[2] ? e.Yr : t.Wt[2],
			Kr: t.Wt[3],
			Gr: e.Gr + (t.Gr ?? 1),
			Zr: e.Zr,
			zr: !1
		};
		let a = e.Zr, o = this.Xr(t, i), s = a ? {
			data: a,
			index: e.Wr,
			originalTime: e.Ur,
			time: e.Ur,
			priceValues: i(a)
		} : null, c = s ? n(s, o) : o.data, l = s ? i(c) : o.priceValues, u = l.length ? l[l.length - 1] : 0;
		return {
			Wr: e.Wr,
			Hr: t.$n,
			Ur: e.Ur,
			$r: t.wt,
			jr: e.jr,
			qr: Math.max(e.qr, u),
			Yr: Math.min(e.Yr, u),
			Kr: u,
			Gr: e.Gr + (t.Gr ?? 1),
			Zr: c,
			zr: !1
		};
	}
	Jr(e, t, n, r, i, a, o = !1, s) {
		let c = t === r ? i : e[t];
		if (n - t == 1) return this.Or(c, !0);
		let l = t + 1 === r ? i : e[t + 1], u = this.Lr(c, l, a, o, s);
		for (let c = t + 2; c < n; c++) {
			let t = c === r ? i : e[c];
			u = this.Nr(u, t, a, o, s);
		}
		return u;
	}
	Xr(e, t) {
		let n = e.ue ?? {};
		return {
			data: e.ue,
			index: e.$n,
			originalTime: e.Qr,
			time: e.wt,
			priceValues: t(n)
		};
	}
	th(e, t = !1) {
		let n = !0 === t, r = !!e.Zr;
		return {
			$n: e.Wr,
			wt: e.Ur,
			Qr: e.Ur,
			Wt: [
				n ? e.Kr : e.jr,
				e.qr,
				e.Yr,
				e.Kr
			],
			Gr: e.Gr,
			ue: n ? r ? e.Zr : { wt: e.Ur } : void 0
		};
	}
	Ar(e, t = !1) {
		return e.map(((e) => this.th(e, t)));
	}
	Dr(e, t, n, r, i = !1, a, o) {
		if (r.length === 0) return r;
		let s = e.length - 1, c = Math.floor(s / n) * n;
		if (Math.min(c + n, e.length) - c < n && e.length > n) {
			let r = e.slice();
			return r[r.length - 1] = t, this.Cr(r, n, a, i, o);
		}
		if (Math.floor((s - 1) / n) === Math.floor(s / n) || r.length === 1) {
			let l = Math.min(c + n, e.length), u = l - c;
			if (u <= 0) return r;
			let d = u === 1 ? this.Or(c === s ? t : e[c], !0) : this.Jr(e, c, l, s, t, a, i, o);
			return r[r.length - 1] = this.th(d, i), r;
		}
		{
			let r = e.slice();
			return r[r.length - 1] = t, this.Cr(r, n, a, i, o);
		}
	}
	Or(e, t = !1) {
		return {
			Wr: e.$n,
			Hr: e.$n,
			Ur: e.wt,
			$r: e.wt,
			jr: e.Wt[0],
			qr: e.Wt[1],
			Yr: e.Wt[2],
			Kr: e.Wt[3],
			Gr: e.Gr ?? 1,
			Zr: e.ue,
			zr: t
		};
	}
	Pr(e) {
		let t = this.ih(e), n = this.Ir(e);
		return t.nh !== n && (t.kr.clear(), t.nh = n), t;
	}
	ih(e) {
		let t = this.br.get(e);
		return t === void 0 && (t = {
			nh: this.Ir(e),
			kr: /* @__PURE__ */ new Map()
		}, this.br.set(e, t)), t;
	}
}, We = class extends ge {
	constructor(e) {
		super(), this.sn = e;
	}
	Qt() {
		return this.sn;
	}
}, Ge = {
	Bar: (e, t, n, r) => {
		let i = t.upColor, a = t.downColor, o = E(e(n, r)), s = D(o.Wt[0]) <= D(o.Wt[3]);
		return { sh: o.R ?? (s ? i : a) };
	},
	Candlestick: (e, t, n, r) => {
		let i = t.upColor, a = t.downColor, o = t.borderUpColor, s = t.borderDownColor, c = t.wickUpColor, l = t.wickDownColor, u = E(e(n, r)), d = D(u.Wt[0]) <= D(u.Wt[3]);
		return {
			sh: u.R ?? (d ? i : a),
			eh: u.Ht ?? (d ? o : s),
			rh: u.hh ?? (d ? c : l)
		};
	},
	Custom: (e, t, n, r) => ({ sh: E(e(n, r)).R ?? t.color }),
	Area: (e, t, n, r) => {
		let i = E(e(n, r));
		return {
			sh: i.vt ?? t.lineColor,
			vt: i.vt ?? t.lineColor,
			ah: i.ah ?? t.topColor,
			oh: i.oh ?? t.bottomColor
		};
	},
	Baseline: (e, t, n, r) => {
		let i = E(e(n, r));
		return {
			sh: i.Wt[3] >= t.baseValue.price ? t.topLineColor : t.bottomLineColor,
			_h: i._h ?? t.topLineColor,
			uh: i.uh ?? t.bottomLineColor,
			dh: i.dh ?? t.topFillColor1,
			fh: i.fh ?? t.topFillColor2,
			ph: i.ph ?? t.bottomFillColor1,
			mh: i.mh ?? t.bottomFillColor2
		};
	},
	Line: (e, t, n, r) => {
		let i = E(e(n, r));
		return {
			sh: i.R ?? t.color,
			vt: i.R ?? t.color
		};
	},
	Histogram: (e, t, n, r) => ({ sh: E(e(n, r)).R ?? t.color })
}, Ke = class {
	constructor(e) {
		this.wh = (e, t) => t === void 0 ? this.Te.Un().Mh(e) : t.Wt, this.Te = e, this.gh = Ge[e.bh()];
	}
	Sh(e, t) {
		return this.gh(this.wh, this.Te.N(), e, t);
	}
};
function qe(e, t, n, r, i = 0, a = t.length) {
	let o = a - i;
	for (; 0 < o;) {
		let a = o >> 1, s = i + a;
		r(t[s], n) === e ? (i = s + 1, o -= a + 1) : o = a;
	}
	return i;
}
var Je = qe.bind(null, !0), Ye = qe.bind(null, !1), Xe;
(function(e) {
	e[e.NearestLeft = -1] = "NearestLeft", e[e.None = 0] = "None", e[e.NearestRight = 1] = "NearestRight";
})(Xe ||= {});
var Ze = 30, Qe = class {
	constructor() {
		this.xh = [], this.Ch = /* @__PURE__ */ new Map(), this.yh = /* @__PURE__ */ new Map(), this.Ph = [];
	}
	kh() {
		return this.Th() > 0 ? this.xh[this.xh.length - 1] : null;
	}
	Rh() {
		return this.Th() > 0 ? this.Dh(0) : null;
	}
	Qn() {
		return this.Th() > 0 ? this.Dh(this.xh.length - 1) : null;
	}
	Th() {
		return this.xh.length;
	}
	Zi() {
		return this.Th() === 0;
	}
	ze(e) {
		return this.Ih(e, 0) !== null;
	}
	Mh(e) {
		return this.Hn(e);
	}
	Hn(e, t = 0) {
		let n = this.Ih(e, t);
		return n === null ? null : {
			...this.Vh(n),
			$n: this.Dh(n)
		};
	}
	Bh() {
		return this.xh;
	}
	Eh(e, t, n) {
		if (this.Zi()) return null;
		let r = null;
		for (let i of n) r = $e(r, this.Ah(e, t, i));
		return r;
	}
	ht(e) {
		this.yh.clear(), this.Ch.clear(), this.xh = e, this.Ph = e.map(((e) => e.$n));
	}
	Lh() {
		return this.Ph;
	}
	Dh(e) {
		return this.xh[e].$n;
	}
	Vh(e) {
		return this.xh[e];
	}
	Ih(e, t) {
		let n = this.zh(e);
		if (n === null && t !== 0) switch (t) {
			case -1: return this.Oh(e);
			case 1: return this.Nh(e);
			default: throw TypeError("Unknown search mode");
		}
		return n;
	}
	Oh(e) {
		let t = this.Fh(e);
		return t > 0 && --t, t !== this.xh.length && this.Dh(t) < e ? t : null;
	}
	Nh(e) {
		let t = this.Wh(e);
		return t !== this.xh.length && e < this.Dh(t) ? t : null;
	}
	zh(e) {
		let t = this.Fh(e);
		return t === this.xh.length || e < this.xh[t].$n ? null : t;
	}
	Fh(e) {
		return Je(this.xh, e, ((e, t) => e.$n < t));
	}
	Wh(e) {
		return Ye(this.xh, e, ((e, t) => e.$n > t));
	}
	Hh(e, t, n) {
		let r = null;
		for (let i = e; i < t; i++) {
			let e = this.xh[i].Wt[n];
			Number.isNaN(e) || (r === null ? r = {
				Uh: e,
				$h: e
			} : (e < r.Uh && (r.Uh = e), e > r.$h && (r.$h = e)));
		}
		return r;
	}
	Ah(e, t, n) {
		if (this.Zi()) return null;
		let r = null, i = E(this.Rh()), a = E(this.Qn()), o = Math.max(e, i), s = Math.min(t, a), c = Math.ceil(o / Ze) * Ze, l = Math.max(c, Math.floor(s / Ze) * Ze);
		{
			let e = this.Fh(o), i = this.Wh(Math.min(s, c, t));
			r = $e(r, this.Hh(e, i, n));
		}
		let u = this.Ch.get(n);
		u === void 0 && (u = /* @__PURE__ */ new Map(), this.Ch.set(n, u));
		for (let e = Math.max(c + 1, o); e < l; e += Ze) {
			let t = Math.floor(e / Ze), i = u.get(t);
			if (i === void 0) {
				let e = this.Fh(t * Ze), r = this.Wh((t + 1) * Ze - 1);
				i = this.Hh(e, r, n), u.set(t, i);
			}
			r = $e(r, i);
		}
		{
			let e = this.Fh(l), t = this.Wh(s);
			r = $e(r, this.Hh(e, t, n));
		}
		return r;
	}
};
function $e(e, t) {
	return e === null ? t : t === null ? e : {
		Uh: Math.min(e.Uh, t.Uh),
		$h: Math.max(e.$h, t.$h)
	};
}
function et() {
	return new Qe();
}
var tt = { setLineStyle: S }, nt = class {
	constructor(e) {
		this.jh = e;
	}
	st(e, t, n) {
		this.jh.draw(e, tt);
	}
	qh(e, t, n) {
		this.jh.drawBackground?.(e, tt);
	}
}, rt = class {
	constructor(e) {
		this.Ls = null, this.Yh = e;
	}
	Tt() {
		let e = this.Yh.renderer();
		if (e === null) return null;
		if (this.Ls?.Kh === e) return this.Ls.Gh;
		let t = new nt(e);
		return this.Ls = {
			Kh: e,
			Gh: t
		}, t;
	}
	Zh() {
		return this.Yh.zOrder?.() ?? "normal";
	}
}, it = class {
	constructor(e) {
		this.Xh = null, this.Jh = e;
	}
	Qh() {
		return this.Jh;
	}
	Nn() {
		this.Jh.updateAllViews?.();
	}
	jn() {
		let e = this.Jh.paneViews?.() ?? [];
		if (this.Xh?.Kh === e) return this.Xh.Gh;
		let t = e.map(((e) => new rt(e)));
		return this.Xh = {
			Kh: e,
			Gh: t
		}, t;
	}
	Qs(e, t) {
		return this.Jh.hitTest?.(e, t) ?? null;
	}
}, at = class extends it {
	cn() {
		return [];
	}
}, ot = class {
	constructor(e) {
		this.jh = e;
	}
	st(e, t, n) {
		this.jh.draw(e, tt);
	}
	qh(e, t, n) {
		this.jh.drawBackground?.(e, tt);
	}
}, st = class {
	constructor(e) {
		this.Ls = null, this.Yh = e;
	}
	Tt() {
		let e = this.Yh.renderer();
		if (e === null) return null;
		if (this.Ls?.Kh === e) return this.Ls.Gh;
		let t = new ot(e);
		return this.Ls = {
			Kh: e,
			Gh: t
		}, t;
	}
	Zh() {
		return this.Yh.zOrder?.() ?? "normal";
	}
};
function ct(e) {
	return {
		ri: e.text(),
		Ei: e.coordinate(),
		Vi: e.fixedCoordinate?.(),
		R: e.textColor(),
		Z: e.backColor(),
		It: e.visible?.() ?? !0,
		pi: e.tickVisible?.() ?? !0
	};
}
var lt = class {
	constructor(e, t) {
		this.Xt = new me(), this.ta = e, this.ia = t;
	}
	Tt() {
		return this.Xt.ht({
			nn: this.ia.nn(),
			...ct(this.ta)
		}), this.Xt;
	}
}, ut = class extends fe {
	constructor(e, t) {
		super(), this.ta = e, this.Ki = t;
	}
	Yi(e, t, n) {
		let r = ct(this.ta);
		n.Z = r.Z, e.R = r.R;
		let i = 2 / 12 * this.Ki.P();
		n.Ti = i, n.Ri = i, n.Ei = r.Ei, n.Vi = r.Vi, e.ri = r.ri, e.It = r.It, e.pi = r.pi;
	}
}, dt = class extends it {
	constructor(e, t) {
		super(e), this.na = null, this.sa = null, this.ea = null, this.ra = null, this.Te = t;
	}
	dn() {
		let e = this.Jh.timeAxisViews?.() ?? [];
		if (this.na?.Kh === e) return this.na.Gh;
		let t = this.Te.Qt().Et(), n = e.map(((e) => new lt(e, t)));
		return this.na = {
			Kh: e,
			Gh: n
		}, n;
	}
	qn() {
		let e = this.Jh.priceAxisViews?.() ?? [];
		if (this.sa?.Kh === e) return this.sa.Gh;
		let t = this.Te.Ft(), n = e.map(((e) => new ut(e, t)));
		return this.sa = {
			Kh: e,
			Gh: n
		}, n;
	}
	ha() {
		let e = this.Jh.priceAxisPaneViews?.() ?? [];
		if (this.ea?.Kh === e) return this.ea.Gh;
		let t = e.map(((e) => new st(e)));
		return this.ea = {
			Kh: e,
			Gh: t
		}, t;
	}
	aa() {
		let e = this.Jh.timeAxisPaneViews?.() ?? [];
		if (this.ra?.Kh === e) return this.ra.Gh;
		let t = e.map(((e) => new st(e)));
		return this.ra = {
			Kh: e,
			Gh: t
		}, t;
	}
	la(e, t) {
		return this.Jh.autoscaleInfo?.(e, t) ?? null;
	}
};
function ft(e, t, n, r) {
	e.forEach(((e) => {
		t(e).forEach(((e) => {
			e.Zh() === n && r.push(e);
		}));
	}));
}
function pt(e) {
	return e.jn();
}
function mt(e) {
	return e.ha();
}
function ht(e) {
	return e.aa();
}
var gt = [
	"Area",
	"Line",
	"Baseline"
], _t = class extends We {
	constructor(e, t, n, r, i) {
		super(e), this.qt = et(), this.dr = new Ie(this), this.oa = [], this._a = new Me(this), this.ua = null, this.ca = null, this.da = null, this.fa = [], this.pa = new Ue(), this.va = /* @__PURE__ */ new Map(), this.ma = null, this.yn = n, this.wa = t;
		let a = new Le(this);
		if (this.mn = [a], this.pr = new ke(a, this, e), gt.includes(this.wa) && (this.ua = new Fe(this)), this.Ma(), this.Yh = r(this, this.Qt(), i), this.wa === "Custom") {
			let e = this.Yh;
			e.ga && this.ba(e.ga);
		}
	}
	m() {
		this.da !== null && clearTimeout(this.da);
	}
	We(e) {
		return this.yn.priceLineColor || e;
	}
	Ae(e) {
		let t = { Le: !0 }, n = this.Ft();
		if (this.Qt().Et().Zi() || n.Zi() || this.qt.Zi()) return t;
		let r = this.Qt().Et().Ee(), i = this.Lt();
		if (r === null || i === null) return t;
		let a, o;
		if (e) {
			let e = this.qt.kh();
			if (e === null) return t;
			a = e, o = e.$n;
		} else {
			let e = this.qt.Hn(r.bi(), -1);
			if (e === null || (a = this.qt.Mh(e.$n), a === null)) return t;
			o = e.$n;
		}
		let s = a.Wt[3], c = this.Sa().Sh(o, { Wt: a }), l = n.Nt(s, i.Wt);
		return {
			Le: !1,
			Mt: s,
			ri: n.Ji(s, i.Wt),
			qe: n.xa(s),
			Ye: n.Ca(s, i.Wt),
			R: c.sh,
			Ei: l,
			$n: o
		};
	}
	Sa() {
		return this.ca !== null || (this.ca = new Ke(this)), this.ca;
	}
	N() {
		return this.yn;
	}
	vr(e) {
		let t = this.Qt(), { priceScaleId: n, visible: r, priceFormat: i } = e;
		n !== void 0 && n !== this.yn.priceScaleId && t.ya(this, n), r !== void 0 && r !== this.yn.visible && t.Pa();
		let a = e.conflationThresholdFactor !== void 0;
		k(this.yn, e), Object.prototype.hasOwnProperty.call(e, "autoscaleInfoProvider") && e.autoscaleInfoProvider === void 0 && (this.yn.autoscaleInfoProvider = void 0), a && (this.va.clear(), this.Qt().mr()), i !== void 0 && (this.Ma(), t.ka()), t.Ta(this), t.Ra(), this.Yh.Pt("options");
	}
	ht(e, t) {
		this.qt.ht(e), this.va.clear();
		let n = this.Qt().Et().N();
		n.enableConflation && n.precomputeConflationOnInit && this.Da(n.precomputeConflationPriority), this.Ia(), this.ua !== null && (t && t.Va ? this.ua.De() : e.length === 0 && this.ua.Re());
		let r = this.Qt().Ks(this);
		this.Qt().Ba(r), this.Qt().Ta(this), this.Qt().Ra(), this.Qt().mr();
	}
	Ia() {
		this.Yh.Pt("data");
	}
	Ea(e) {
		let t = new He(this, e);
		return this.oa.push(t), this.Qt().Ta(this), t;
	}
	Aa(e) {
		let t = this.oa.indexOf(e);
		t !== -1 && this.oa.splice(t, 1), this.Qt().Ta(this);
	}
	La() {
		return this.oa;
	}
	bh() {
		return this.wa;
	}
	Lt() {
		let e = this.za();
		return e === null ? null : {
			Wt: e.Wt[3],
			Oa: e.wt
		};
	}
	za() {
		let e = this.Qt().Et().Ee();
		if (e === null) return null;
		let t = e.Na();
		return this.qt.Hn(t, 1);
	}
	Un() {
		return this.qt;
	}
	ba(e) {
		this.ma = e, this.va.clear();
	}
	Fa() {
		return !!this.Qt().Et().N().enableConflation && this.Wa() > 1;
	}
	Rr(e) {
		if (!this.Fa()) return;
		let t = this.Wa();
		if (!this.va.has(t)) return;
		let n = this.wa === "Custom", r = n && this.ma || void 0, i = n && this.Yh.Ha ? (e) => {
			let t = e, n = this.Yh.Ha(t);
			return Array.isArray(n) ? n : [typeof n == "number" ? n : 0];
		} : void 0, a = this.pa.Rr(this.qt.Bh(), e, t, r, n, i), o = et();
		o.ht(a), this.va.set(t, o);
	}
	Ua() {
		let e = this.Qt().Et().N().enableConflation;
		if (this.wa === "Custom" && this.ma === null || !e) return this.qt;
		let t = this.Wa();
		return this.va.get(t) || (this.$a(t), this.va.get(t) ?? this.qt);
	}
	ja(e) {
		let t = this.qt.Mh(e);
		return t === null ? null : this.wa === "Bar" || this.wa === "Candlestick" || this.wa === "Custom" ? {
			jr: t.Wt[0],
			qr: t.Wt[1],
			Yr: t.Wt[2],
			Kr: t.Wt[3]
		} : t.Wt[3];
	}
	qa(e) {
		let t = [];
		ft(this.fa, pt, "top", t);
		let n = this.ua;
		return n !== null && n.It() ? (this.da === null && n.Ve() && (this.da = setTimeout((() => {
			this.da = null, this.Qt().Ya();
		}), 0)), n.Ie(), t.unshift(n), t) : t;
	}
	jn() {
		let e = [];
		this.Ka() || e.push(this._a), e.push(this.Yh, this.dr);
		let t = this.oa.map(((e) => e.wr()));
		return e.push(...t), ft(this.fa, pt, "normal", e), e;
	}
	Ga() {
		let e = this.Yh.Ga?.() ?? null;
		if (e === null) return null;
		let t = [];
		this.Ka() || t.push(this._a), t.push(...e.Za), ft(this.fa, pt, "normal", t);
		let n = [];
		n.push(...e.qa, this.dr);
		let r = this.oa.map(((e) => e.wr()));
		return n.push(...r), {
			Za: t,
			qa: n
		};
	}
	Xa() {
		return this.Ja(pt, "bottom");
	}
	Qa(e) {
		return this.Ja(mt, e);
	}
	tl(e) {
		return this.Ja(ht, e);
	}
	il(e, t) {
		return this.fa.map(((n) => n.Qs(e, t))).filter(((e) => e !== null));
	}
	cn() {
		return [this.pr, ...this.oa.map(((e) => e.Mr()))];
	}
	qn(e, t) {
		if (t !== this.hn && !this.Ka()) return [];
		let n = [...this.mn];
		for (let e of this.oa) n.push(e.gr());
		return this.fa.forEach(((e) => {
			n.push(...e.qn());
		})), n;
	}
	dn() {
		let e = [];
		return this.fa.forEach(((t) => {
			e.push(...t.dn());
		})), e;
	}
	la(e, t) {
		if (this.yn.autoscaleInfoProvider !== void 0) {
			let n = this.yn.autoscaleInfoProvider((() => {
				let n = this.nl(e, t);
				return n === null ? null : n.sr();
			}));
			return Re.er(n);
		}
		return this.nl(e, t);
	}
	Kh() {
		let e = this.yn.priceFormat;
		return e.base ?? 1 / e.minMove;
	}
	sl() {
		return this.el;
	}
	Nn() {
		this.Yh.Pt();
		for (let e of this.mn) e.Pt();
		for (let e of this.oa) e.Pt();
		this.dr.Pt(), this._a.Pt(), this.ua?.Pt(), this.fa.forEach(((e) => e.Nn()));
	}
	Ft() {
		return E(super.Ft());
	}
	At(e) {
		if (this.wa !== "Line" && this.wa !== "Area" && this.wa !== "Baseline" || !this.yn.crosshairMarkerVisible) return null;
		let t = this.qt.Mh(e);
		return t === null ? null : {
			Mt: t.Wt[3],
			ft: this.rl(),
			Ht: this.hl(),
			Ot: this.al(),
			zt: this.ll(e)
		};
	}
	He() {
		return this.yn.title;
	}
	It() {
		return this.yn.visible;
	}
	ol(e) {
		this.fa.push(new dt(e, this));
	}
	_l(e) {
		this.fa = this.fa.filter(((t) => t.Qh() !== e));
	}
	ul() {
		if (this.wa === "Custom") return (e) => this.Yh.Ha(e);
	}
	cl() {
		if (this.wa === "Custom") return (e) => this.Yh.dl(e);
	}
	fl() {
		return this.qt.Lh();
	}
	Ka() {
		return !ve(this.Ft().pl());
	}
	nl(e, t) {
		if (!j(e) || !j(t) || this.qt.Zi()) return null;
		let n = this.wa === "Line" || this.wa === "Area" || this.wa === "Baseline" || this.wa === "Histogram" ? [3] : [2, 1], r = this.qt.Eh(e, t, n), i = r === null ? null : new J(r.Uh, r.$h), a = null;
		if (this.bh() === "Histogram") {
			let e = this.yn.base, t = new J(e, e);
			i = i === null ? t : i.Ss(t);
		}
		return this.fa.forEach(((n) => {
			let r = n.la(e, t);
			if (r?.priceRange) {
				let e = new J(r.priceRange.minValue, r.priceRange.maxValue);
				i = i === null ? e : i.Ss(e);
			}
			r?.margins && (a = r.margins);
		})), new Re(i, a);
	}
	rl() {
		switch (this.wa) {
			case "Line":
			case "Area":
			case "Baseline": return this.yn.crosshairMarkerRadius;
		}
		return 0;
	}
	hl() {
		switch (this.wa) {
			case "Line":
			case "Area":
			case "Baseline": {
				let e = this.yn.crosshairMarkerBorderColor;
				if (e.length !== 0) return e;
			}
		}
		return null;
	}
	al() {
		switch (this.wa) {
			case "Line":
			case "Area":
			case "Baseline": return this.yn.crosshairMarkerBorderWidth;
		}
		return 0;
	}
	ll(e) {
		switch (this.wa) {
			case "Line":
			case "Area":
			case "Baseline": {
				let e = this.yn.crosshairMarkerBackgroundColor;
				if (e.length !== 0) return e;
			}
		}
		return this.Sa().Sh(e).sh;
	}
	Ma() {
		switch (this.yn.priceFormat.type) {
			case "custom": {
				let e = this.yn.priceFormat.formatter;
				this.el = {
					format: e,
					formatTickmarks: this.yn.priceFormat.tickmarksFormatter ?? ((t) => t.map(e))
				};
				break;
			}
			case "volume":
				this.el = new Te(this.yn.priceFormat.precision);
				break;
			case "percent":
				this.el = new we(this.yn.priceFormat.precision);
				break;
			default: {
				let e = 10 ** this.yn.priceFormat.precision;
				this.el = new Ce(e, this.yn.priceFormat.minMove * e);
			}
		}
		this.hn !== null && this.hn.vl();
	}
	Ja(e, t) {
		let n = [];
		return ft(this.fa, e, t, n), n;
	}
	Wa() {
		let { ml: e, wl: t, Ml: n } = this.gl();
		return this.pa.Sr(e, t, n);
	}
	gl() {
		let e = this.Qt().Et(), t = e.ml(), n = window.devicePixelRatio || 1, r = e.N().conflationThresholdFactor;
		return {
			ml: t,
			wl: n,
			Ml: this.yn.conflationThresholdFactor ?? r ?? 1
		};
	}
	bl(e) {
		let t = this.qt.Bh(), n;
		if (this.wa === "Custom" && this.ma !== null) {
			let r = this.ul();
			if (!r) throw Error(Be);
			n = this.pa.Cr(t, e, this.ma, !0, ((e) => r(e)));
		} else n = this.pa.Cr(t, e);
		let r = et();
		return r.ht(n), r;
	}
	$a(e) {
		let t = this.bl(e);
		this.va.set(e, t);
	}
	Da(e) {
		if (this.wa === "Custom" && (this.ma === null || !this.ul())) return;
		this.va.clear();
		let t = this.Qt().Et().Sl();
		for (let n of t) {
			let t = () => {
				this.xl(n);
			}, r = typeof window == "object" && window || typeof self == "object" && self;
			r?.yl?.Cl ? r.yl.Cl((() => {
				t();
			}), { se: e }) : Promise.resolve().then((() => t()));
		}
	}
	xl(e) {
		if (this.va.has(e) || this.qt.Bh().length === 0) return;
		let t = this.bl(e);
		this.va.set(e, t);
	}
}, vt = [3], yt = [
	0,
	1,
	2,
	3
], bt = class {
	constructor(e) {
		this.yn = e;
	}
	Pl(e, t, n) {
		let r = e;
		if (this.yn.mode === 0) return r;
		let i = n.kn(), a = i.Lt();
		if (a === null) return r;
		let o = i.Nt(e, a), s = n.kl().filter(((e) => e instanceof _t)).reduce(((e, r) => {
			if (n.Gs(r) || !r.It()) return e;
			let i = r.Ft(), a = r.Un();
			if (i.Zi() || !a.ze(t)) return e;
			let o = a.Mh(t);
			if (o === null) return e;
			let s = D(r.Lt()), c = this.yn.mode === 3 ? yt : vt;
			return e.concat(c.map(((e) => i.Nt(o.Wt[e], s.Wt))));
		}), []);
		if (s.length === 0) return r;
		s.sort(((e, t) => Math.abs(e - o) - Math.abs(t - o)));
		let c = s[0];
		return r = i.Tn(c, a), r;
	}
};
function xt(e, t, n) {
	return Math.min(Math.max(e, t), n);
}
function St(e, t, n) {
	return t - e <= n;
}
var Ct = class extends B {
	constructor() {
		super(...arguments), this.qt = null;
	}
	ht(e) {
		this.qt = e;
	}
	et({ context: e, bitmapSize: t, horizontalPixelRatio: n, verticalPixelRatio: r }) {
		if (this.qt === null) return;
		let i = Math.max(1, Math.floor(n));
		e.lineWidth = i, function(e, t) {
			e.save(), e.lineWidth % 2 && e.translate(.5, .5), t(), e.restore();
		}(e, (() => {
			let a = E(this.qt);
			if (a.Tl) {
				e.strokeStyle = a.Rl, S(e, a.Dl), e.beginPath();
				for (let r of a.Il) {
					let a = Math.round(r.Vl * n);
					e.moveTo(a, -i), e.lineTo(a, t.height + i);
				}
				e.stroke();
			}
			if (a.Bl) {
				e.strokeStyle = a.El, S(e, a.Al), e.beginPath();
				for (let n of a.Ll) {
					let a = Math.round(n.Vl * r);
					e.moveTo(-i, a), e.lineTo(t.width + i, a);
				}
				e.stroke();
			}
		}));
	}
}, wt = class {
	constructor(e) {
		this.Xt = new Ct(), this.xt = !0, this.yt = e;
	}
	Pt() {
		this.xt = !0;
	}
	Tt() {
		if (this.xt) {
			let e = this.yt.Qt().N().grid, t = {
				Bl: e.horzLines.visible,
				Tl: e.vertLines.visible,
				El: e.horzLines.color,
				Rl: e.vertLines.color,
				Al: e.horzLines.style,
				Dl: e.vertLines.style,
				Ll: this.yt.kn().zl(),
				Il: (this.yt.Qt().Et().zl() || []).map(((e) => ({ Vl: e.coord })))
			};
			this.Xt.ht(t), this.xt = !1;
		}
		return this.Xt;
	}
}, Tt = class {
	constructor(e) {
		this.Yh = new wt(e);
	}
	wr() {
		return this.Yh;
	}
}, Et = {
	Ol: 4,
	Nl: 1e-4
};
function Dt(e, t) {
	let n = 100 * (e - t) / t;
	return t < 0 ? -n : n;
}
function Ot(e, t) {
	return new J(Dt(e.Je(), t), Dt(e.Qe(), t));
}
function kt(e, t) {
	let n = 100 * (e - t) / t + 100;
	return t < 0 ? -n : n;
}
function At(e, t) {
	return new J(kt(e.Je(), t), kt(e.Qe(), t));
}
function jt(e, t) {
	let n = Math.abs(e);
	if (n < 1e-15) return 0;
	let r = Math.log10(n + t.Nl) + t.Ol;
	return e < 0 ? -r : r;
}
function Mt(e, t) {
	let n = Math.abs(e);
	if (n < 1e-15) return 0;
	let r = 10 ** (n - t.Ol) - t.Nl;
	return e < 0 ? -r : r;
}
function Nt(e, t) {
	return e === null ? null : new J(jt(e.Je(), t), jt(e.Qe(), t));
}
function Pt(e, t) {
	return e === null ? null : new J(Mt(e.Je(), t), Mt(e.Qe(), t));
}
function Ft(e) {
	if (e === null) return Et;
	let t = Math.abs(e.Qe() - e.Je());
	if (t >= 1 || t < 1e-15) return Et;
	let n = Math.ceil(Math.abs(Math.log10(t))), r = Et.Ol + n;
	return {
		Ol: r,
		Nl: 1 / 10 ** r
	};
}
var It = class {
	constructor(e, t) {
		if (this.Fl = e, this.Wl = t, function(e) {
			if (e < 0) return !1;
			if (e > 0xde0b6b3a7640000) return !0;
			for (let t = e; t > 1; t /= 10) if (t % 10 != 0) return !1;
			return !0;
		}(this.Fl)) this.Hl = [
			2,
			2.5,
			2
		];
		else {
			this.Hl = [];
			for (let e = this.Fl; e !== 1;) {
				if (e % 2 == 0) this.Hl.push(2), e /= 2;
				else {
					if (e % 5 != 0) throw Error("unexpected base");
					this.Hl.push(2, 2.5), e /= 5;
				}
				if (this.Hl.length > 100) throw Error("something wrong with base");
			}
		}
	}
	Ul(e, t, n) {
		let r = this.Fl === 0 ? 0 : 1 / this.Fl, i = 10 ** Math.max(0, Math.ceil(Math.log10(e - t))), a = 0, o = this.Wl[0];
		for (;;) {
			let e = St(i, r, 1e-14) && i > r + 1e-14, t = St(i, n * o, 1e-14), s = St(i, 1, 1e-14);
			if (!(e && t && s)) break;
			i /= o, o = this.Wl[++a % this.Wl.length];
		}
		if (i <= r + 1e-14 && (i = r), i = Math.max(1, i), this.Hl.length > 0 && (s = i, c = 1, l = 1e-14, Math.abs(s - c) < l)) for (a = 0, o = this.Hl[0]; St(i, n * o, 1e-14) && i > r + 1e-14;) i /= o, o = this.Hl[++a % this.Hl.length];
		var s, c, l;
		return i;
	}
}, Lt = class {
	constructor(e, t, n, r) {
		this.$l = [], this.Ki = e, this.Fl = t, this.jl = n, this.ql = r;
	}
	Ul(e, t) {
		if (e < t) throw Error("high < low");
		let n = this.Ki.$t(), r = (e - t) * this.Yl() / n, i = new It(this.Fl, [
			2,
			2.5,
			2
		]), a = new It(this.Fl, [
			2,
			2,
			2.5
		]), o = new It(this.Fl, [
			2.5,
			2,
			2
		]), s = [];
		return s.push(i.Ul(e, t, r), a.Ul(e, t, r), o.Ul(e, t, r)), function(e) {
			if (e.length < 1) throw Error("array is empty");
			let t = e[0];
			for (let n = 1; n < e.length; ++n) e[n] < t && (t = e[n]);
			return t;
		}(s);
	}
	Kl() {
		let e = this.Ki, t = e.Lt();
		if (t === null) return void (this.$l = []);
		let n = e.$t(), r = this.jl(n - 1, t), i = this.jl(0, t), a = this.Ki.N().entireTextOnly ? this.Gl() / 2 : 0, o = a, s = n - 1 - a, c = Math.max(r, i), l = Math.min(r, i);
		if (c === l) return void (this.$l = []);
		let u = this.Ul(c, l);
		if (this.Zl(t, u, c, l, o, s), e.Xl() && this.Jl(u, l, c)) {
			let e = this.Ki.Ql();
			this.io(t, u, o, s, e, 2 * e);
		}
		let d = this.$l.map(((e) => e.no)), f = this.Ki.so(d);
		for (let e = 0; e < this.$l.length; e++) this.$l[e].eo = f[e];
	}
	zl() {
		return this.$l;
	}
	Gl() {
		return this.Ki.P();
	}
	Yl() {
		return Math.ceil(this.Gl() * this.Ki.N().tickMarkDensity);
	}
	Zl(e, t, n, r, i, a) {
		let o = this.$l, s = this.Ki, c = n % t;
		c += c < 0 ? t : 0;
		let l = n >= r ? 1 : -1, u = null, d = 0;
		for (let f = n - c; f > r; f -= t) {
			let n = this.ql(f, e, !0);
			u !== null && Math.abs(n - u) < this.Yl() || n < i || n > a || (d < o.length ? (o[d].Vl = n, o[d].eo = s.ro(f), o[d].no = f) : o.push({
				Vl: n,
				eo: s.ro(f),
				no: f
			}), d++, u = n, s.ho() && (t = this.Ul(f * l, r)));
		}
		o.length = d;
	}
	io(e, t, n, r, i, a) {
		let o = this.$l, s = this.ao(e, n, i, a), c = this.ao(e, r, -a, -i), l = this.ql(0, e, !0) - this.ql(t, e, !0);
		o.length > 0 && o[0].Vl - s.Vl < l / 2 && o.shift(), o.length > 0 && c.Vl - o[o.length - 1].Vl < l / 2 && o.pop(), o.unshift(s), o.push(c);
	}
	ao(e, t, n, r) {
		let i = (n + r) / 2, a = this.jl(t + n, e), o = this.jl(t + r, e), s = Math.min(a, o), c = Math.max(a, o), l = Math.max(.1, this.Ul(c, s)), u = this.jl(t + i, e), d = u - u % l, f = this.ql(d, e, !0);
		return {
			eo: this.Ki.ro(d),
			Vl: f,
			no: d
		};
	}
	Jl(e, t, n) {
		let r = D(this.Ki.ar());
		return this.Ki.ho() && (r = Pt(r, this.Ki.lo())), r.Je() - t < e && n - r.Qe() < e;
	}
};
function Rt(e) {
	return e.slice().sort(((e, t) => E(e.ln()) - E(t.ln())));
}
var zt;
(function(e) {
	e[e.Normal = 0] = "Normal", e[e.Logarithmic = 1] = "Logarithmic", e[e.Percentage = 2] = "Percentage", e[e.IndexedTo100 = 3] = "IndexedTo100";
})(zt ||= {});
var Bt = new we(), Vt = new Ce(100, 1), Ht = class {
	constructor(e, t, n, r, i) {
		this.oo = 0, this._o = null, this.rr = null, this.uo = null, this.co = {
			do: !1,
			fo: null
		}, this.po = !1, this.vo = 0, this.mo = 0, this.wo = new O(), this.Mo = new O(), this.bo = [], this.So = null, this.xo = null, this.Co = null, this.yo = null, this.Po = null, this.el = Vt, this.ko = Ft(null), this.To = e, this.yn = t, this.Ro = n, this.Do = r, this.Io = i, this.Vo = new Lt(this, 100, this.Bo.bind(this), this.Eo.bind(this));
	}
	pl() {
		return this.To;
	}
	N() {
		return this.yn;
	}
	vr(e) {
		if (k(this.yn, e), this.vl(), e.mode !== void 0 && this.Ao({ _e: e.mode }), e.scaleMargins !== void 0) {
			let t = T(e.scaleMargins.top), n = T(e.scaleMargins.bottom);
			if (t < 0 || t > 1) throw Error(`Invalid top margin - expect value between 0 and 1, given=${t}`);
			if (n < 0 || n > 1) throw Error(`Invalid bottom margin - expect value between 0 and 1, given=${n}`);
			if (t + n > 1) throw Error(`Invalid margins - sum of margins must be less than 1, given=${t + n}`);
			this.Lo(), this.Co = null;
		}
	}
	zo() {
		return this.yn.autoScale;
	}
	Oo() {
		return this.po;
	}
	ho() {
		return this.yn.mode === 1;
	}
	je() {
		return this.yn.mode === 2;
	}
	No() {
		return this.yn.mode === 3;
	}
	lo() {
		return this.ko;
	}
	_e() {
		return {
			hs: this.yn.autoScale,
			Fo: this.yn.invertScale,
			_e: this.yn.mode
		};
	}
	Ao(e) {
		let t = this._e(), n = null;
		e.hs !== void 0 && (this.yn.autoScale = e.hs), e._e !== void 0 && (this.yn.mode = e._e, e._e !== 2 && e._e !== 3 || (this.yn.autoScale = !0), this.co.do = !1), t._e === 1 && e._e !== t._e && (function(e, t) {
			if (e === null) return !1;
			let n = Mt(e.Je(), t), r = Mt(e.Qe(), t);
			return isFinite(n) && isFinite(r);
		}(this.rr, this.ko) ? (n = Pt(this.rr, this.ko), n !== null && this.Wo(n)) : this.yn.autoScale = !0), e._e === 1 && e._e !== t._e && (n = Nt(this.rr, this.ko), n !== null && this.Wo(n));
		let r = t._e !== this.yn.mode;
		r && (t._e === 2 || this.je()) && this.vl(), r && (t._e === 3 || this.No()) && this.vl(), e.Fo !== void 0 && t.Fo !== e.Fo && (this.yn.invertScale = e.Fo, this.Ho()), this.Mo.p(t, this._e());
	}
	Uo() {
		return this.Mo;
	}
	P() {
		return this.Ro.fontSize;
	}
	$t() {
		return this.oo;
	}
	$o(e) {
		this.oo !== e && (this.oo = e, this.Lo(), this.Co = null);
	}
	jo() {
		if (this._o) return this._o;
		let e = this.$t() - this.qo() - this.Yo();
		return this._o = e, e;
	}
	ar() {
		return this.Ko(), this.rr;
	}
	Wo(e, t) {
		let n = this.rr;
		(t || n === null && e !== null || n !== null && !n.Ze(e)) && (this.Co = null, this.rr = e);
	}
	Go(e) {
		this.Wo(e), this.Zo(e !== null);
	}
	Zi() {
		return this.Ko(), this.oo === 0 || !this.rr || this.rr.Zi();
	}
	Xo(e) {
		return this.Fo() ? e : this.$t() - 1 - e;
	}
	Nt(e, t) {
		return this.je() ? e = Dt(e, t) : this.No() && (e = kt(e, t)), this.Eo(e, t);
	}
	Jo(e, t, n) {
		this.Ko();
		let r = this.Yo(), i = E(this.ar()), a = i.Je(), o = i.Qe(), s = this.jo() - 1, c = this.Fo(), l = s / (o - a), u = n === void 0 ? 0 : n.from, d = n === void 0 ? e.length : n.to, f = this.Qo();
		for (let n = u; n < d; n++) {
			let i = e[n], o = i.Mt;
			if (isNaN(o)) continue;
			let s = o;
			f !== null && (s = f(i.Mt, t));
			let u = r + l * (s - a);
			i.ut = c ? u : this.oo - 1 - u;
		}
	}
	t_(e, t, n) {
		this.Ko();
		let r = this.Yo(), i = E(this.ar()), a = i.Je(), o = i.Qe(), s = this.jo() - 1, c = this.Fo(), l = s / (o - a), u = n === void 0 ? 0 : n.from, d = n === void 0 ? e.length : n.to, f = this.Qo();
		for (let n = u; n < d; n++) {
			let i = e[n], o = i.jr, s = i.qr, u = i.Yr, d = i.Kr;
			f !== null && (o = f(i.jr, t), s = f(i.qr, t), u = f(i.Yr, t), d = f(i.Kr, t));
			let p = r + l * (o - a), m = c ? p : this.oo - 1 - p;
			i.i_ = m, p = r + l * (s - a), m = c ? p : this.oo - 1 - p, i.n_ = m, p = r + l * (u - a), m = c ? p : this.oo - 1 - p, i.s_ = m, p = r + l * (d - a), m = c ? p : this.oo - 1 - p, i.e_ = m;
		}
	}
	Tn(e, t) {
		let n = this.Bo(e, t);
		return this.r_(n, t);
	}
	r_(e, t) {
		let n = e;
		return this.je() ? n = function(e, t) {
			return t < 0 && (e = -e), e / 100 * t + t;
		}(n, t) : this.No() && (n = function(e, t) {
			return e -= 100, t < 0 && (e = -e), e / 100 * t + t;
		}(n, t)), n;
	}
	kl() {
		return this.bo;
	}
	Dt() {
		return this.xo ||= Rt(this.bo), this.xo;
	}
	h_(e) {
		this.bo.indexOf(e) === -1 && (this.bo.push(e), this.vl(), this.a_());
	}
	l_(e) {
		let t = this.bo.indexOf(e);
		if (t === -1) throw Error("source is not attached to scale");
		this.bo.splice(t, 1), this.bo.length === 0 && (this.Ao({ hs: !0 }), this.Wo(null)), this.vl(), this.a_();
	}
	Lt() {
		let e = null;
		for (let t of this.bo) {
			let n = t.Lt();
			n !== null && (e === null || n.Oa < e.Oa) && (e = n);
		}
		return e === null ? null : e.Wt;
	}
	Fo() {
		return this.yn.invertScale;
	}
	zl() {
		let e = this.Lt() === null;
		if (this.Co !== null && (e || this.Co.o_ === e)) return this.Co.zl;
		this.Vo.Kl();
		let t = this.Vo.zl();
		return this.Co = {
			zl: t,
			o_: e
		}, this.wo.p(), t;
	}
	__() {
		return this.wo;
	}
	u_(e) {
		this.je() || this.No() || this.yo === null && this.uo === null && (this.Zi() || (this.yo = this.oo - e, this.uo = E(this.ar()).Xe()));
	}
	c_(e) {
		if (this.je() || this.No() || this.yo === null) return;
		this.Ao({ hs: !1 }), (e = this.oo - e) < 0 && (e = 0);
		let t = (this.yo + .2 * (this.oo - 1)) / (e + .2 * (this.oo - 1)), n = E(this.uo).Xe();
		t = Math.max(t, .1), n.ir(t), this.Wo(n);
	}
	d_() {
		this.je() || this.No() || (this.yo = null, this.uo = null);
	}
	f_(e) {
		this.zo() || this.Po === null && this.uo === null && (this.Zi() || (this.Po = e, this.uo = E(this.ar()).Xe()));
	}
	p_(e) {
		if (this.zo() || this.Po === null) return;
		let t = E(this.ar()).tr() / (this.jo() - 1), n = e - this.Po;
		this.Fo() && (n *= -1);
		let r = n * t, i = E(this.uo).Xe();
		i.nr(r), this.Wo(i, !0), this.Co = null;
	}
	v_() {
		this.zo() || this.Po !== null && (this.Po = null, this.uo = null);
	}
	sl() {
		return this.el || this.vl(), this.el;
	}
	Ji(e, t) {
		switch (this.yn.mode) {
			case 2: return this.m_(Dt(e, t));
			case 3: return this.sl().format(kt(e, t));
			default: return this.cr(e);
		}
	}
	ro(e) {
		switch (this.yn.mode) {
			case 2: return this.m_(e);
			case 3: return this.sl().format(e);
			default: return this.cr(e);
		}
	}
	so(e) {
		switch (this.yn.mode) {
			case 2: return this.w_(e);
			case 3: return this.sl().formatTickmarks(e);
			default: return this.M_(e);
		}
	}
	xa(e) {
		return this.cr(e, E(this.So).sl());
	}
	Ca(e, t) {
		return e = Dt(e, t), this.m_(e, Bt);
	}
	g_() {
		return this.bo;
	}
	b_(e) {
		this.co = {
			fo: e,
			do: !1
		};
	}
	Nn() {
		this.bo.forEach(((e) => e.Nn()));
	}
	Xl() {
		return this.yn.ensureEdgeTickMarksVisible && this.zo();
	}
	Ql() {
		return this.P() / 2;
	}
	vl() {
		this.Co = null;
		let e = 1 / 0;
		this.So = null;
		for (let t of this.bo) t.ln() < e && (e = t.ln(), this.So = t);
		let t = 100;
		this.So !== null && (t = Math.round(this.So.Kh())), this.el = Vt, this.je() ? (this.el = Bt, t = 100) : this.No() ? (this.el = new Ce(100, 1), t = 100) : this.So !== null && (this.el = this.So.sl()), this.Vo = new Lt(this, t, this.Bo.bind(this), this.Eo.bind(this)), this.Vo.Kl();
	}
	a_() {
		this.xo = null;
	}
	S_() {
		return this.So === null || this.je() || this.No() ? 1 : 1 / this.So.Kh();
	}
	Xi() {
		return this.Io;
	}
	Zo(e) {
		this.po = e;
	}
	qo() {
		return this.Fo() ? this.yn.scaleMargins.bottom * this.$t() + this.mo : this.yn.scaleMargins.top * this.$t() + this.vo;
	}
	Yo() {
		return this.Fo() ? this.yn.scaleMargins.top * this.$t() + this.vo : this.yn.scaleMargins.bottom * this.$t() + this.mo;
	}
	Ko() {
		this.co.do || (this.co.do = !0, this.x_());
	}
	Lo() {
		this._o = null;
	}
	Eo(e, t) {
		if (this.Ko(), this.Zi()) return 0;
		e = this.ho() && e ? jt(e, this.ko) : e;
		let n = E(this.ar()), r = this.Yo() + (this.jo() - 1) * (e - n.Je()) / n.tr();
		return this.Xo(r);
	}
	Bo(e, t) {
		if (this.Ko(), this.Zi()) return 0;
		let n = this.Xo(e), r = E(this.ar()), i = r.Je() + r.tr() * ((n - this.Yo()) / (this.jo() - 1));
		return this.ho() ? Mt(i, this.ko) : i;
	}
	Ho() {
		this.Co = null, this.Vo.Kl();
	}
	x_() {
		if (this.Oo() && !this.zo()) return;
		let e = this.co.fo;
		if (e === null) return;
		let t = null, n = this.g_(), r = 0, i = 0;
		for (let a of n) {
			if (!a.It()) continue;
			let n = a.Lt();
			if (n === null) continue;
			let o = a.la(e.Na(), e.bi()), s = o && o.ar();
			if (s !== null) {
				switch (this.yn.mode) {
					case 1:
						s = Nt(s, this.ko);
						break;
					case 2:
						s = Ot(s, n.Wt);
						break;
					case 3: s = At(s, n.Wt);
				}
				if (t = t === null ? s : t.Ss(E(s)), o !== null) {
					let e = o.lr();
					e !== null && (r = Math.max(r, e.above), i = Math.max(i, e.below));
				}
			}
		}
		if (this.Xl() && (r = Math.max(r, this.Ql()), i = Math.max(i, this.Ql())), r === this.vo && i === this.mo || (this.vo = r, this.mo = i, this.Co = null, this.Lo()), t !== null) {
			if (t.Je() === t.Qe()) {
				let e = 5 * this.S_();
				this.ho() && (t = Pt(t, this.ko)), t = new J(t.Je() - e, t.Qe() + e), this.ho() && (t = Nt(t, this.ko));
			}
			if (this.ho()) {
				let e = Pt(t, this.ko), n = Ft(e);
				if (a = n, o = this.ko, a.Ol !== o.Ol || a.Nl !== o.Nl) {
					let r = this.uo === null ? null : Pt(this.uo, this.ko);
					this.ko = n, t = Nt(e, n), r !== null && (this.uo = Nt(r, n));
				}
			}
			this.Wo(t);
		} else this.rr === null && (this.Wo(new J(-.5, .5)), this.ko = Ft(null));
		var a, o;
	}
	Qo() {
		return this.je() ? Dt : this.No() ? kt : this.ho() ? (e) => jt(e, this.ko) : null;
	}
	C_(e, t, n) {
		return t === void 0 ? (n === void 0 && (n = this.sl()), n.format(e)) : t(e);
	}
	y_(e, t, n) {
		return t === void 0 ? (n === void 0 && (n = this.sl()), n.formatTickmarks(e)) : t(e);
	}
	cr(e, t) {
		return this.C_(e, this.Do.priceFormatter, t);
	}
	M_(e, t) {
		let n = this.Do.priceFormatter;
		return this.y_(e, this.Do.tickmarksPriceFormatter ?? (n ? (e) => e.map(n) : void 0), t);
	}
	m_(e, t) {
		return this.C_(e, this.Do.percentageFormatter, t);
	}
	w_(e, t) {
		let n = this.Do.percentageFormatter;
		return this.y_(e, this.Do.tickmarksPercentageFormatter ?? (n ? (e) => e.map(n) : void 0), t);
	}
};
function Ut(e) {
	return e instanceof _t;
}
var Wt = class {
	constructor(e, t) {
		this.bo = [], this.P_ = /* @__PURE__ */ new Map(), this.oo = 0, this.k_ = 0, this.T_ = 1, this.xo = null, this.R_ = null, this.D_ = !1, this.I_ = new O(), this.fa = [], this.ia = e, this.sn = t, this.V_ = new Tt(this);
		let n = t.N();
		this.B_ = this.E_("left", n.leftPriceScale), this.A_ = this.E_("right", n.rightPriceScale), this.B_.Uo().i(this.L_.bind(this, this.B_), this), this.A_.Uo().i(this.L_.bind(this, this.A_), this), this.z_(n);
	}
	z_(e) {
		if (e.leftPriceScale && this.B_.vr(e.leftPriceScale), e.rightPriceScale && this.A_.vr(e.rightPriceScale), e.localization && (this.B_.vl(), this.A_.vl()), e.overlayPriceScales) {
			let t = Array.from(this.P_.values());
			for (let n of t) {
				let t = E(n[0].Ft());
				t.vr(e.overlayPriceScales), e.localization && t.vl();
			}
		}
	}
	O_(e) {
		switch (e) {
			case "left": return this.B_;
			case "right": return this.A_;
		}
		return this.P_.has(e) ? T(this.P_.get(e))[0].Ft() : null;
	}
	m() {
		this.Qt().N_().u(this), this.B_.Uo().u(this), this.A_.Uo().u(this), this.bo.forEach(((e) => {
			e.m && e.m();
		})), this.fa = this.fa.filter(((e) => {
			let t = e.Qh();
			return t.detached && t.detached(), !1;
		})), this.I_.p();
	}
	F_() {
		return this.T_;
	}
	W_(e) {
		this.T_ = e;
	}
	Qt() {
		return this.sn;
	}
	nn() {
		return this.k_;
	}
	$t() {
		return this.oo;
	}
	H_(e) {
		this.k_ = e, this.U_();
	}
	$o(e) {
		this.oo = e, this.B_.$o(e), this.A_.$o(e), this.bo.forEach(((t) => {
			if (this.Gs(t)) {
				let n = t.Ft();
				n !== null && n.$o(e);
			}
		})), this.U_();
	}
	j_(e) {
		this.D_ = e;
	}
	q_() {
		return this.D_;
	}
	Y_() {
		return this.bo.filter(Ut);
	}
	kl() {
		return this.bo;
	}
	Gs(e) {
		let t = e.Ft();
		return t === null || this.B_ !== t && this.A_ !== t;
	}
	h_(e, t, n) {
		this.K_(e, t, n ? e.ln() : this.bo.length);
	}
	l_(e, t) {
		let n = this.bo.indexOf(e);
		w(n !== -1, "removeDataSource: invalid data source"), this.bo.splice(n, 1), t || this.bo.forEach(((e, t) => e._n(t)));
		let r = E(e.Ft()).pl();
		if (this.P_.has(r)) {
			let t = T(this.P_.get(r)), n = t.indexOf(e);
			n !== -1 && (t.splice(n, 1), t.length === 0 && this.P_.delete(r));
		}
		let i = e.Ft();
		i && i.kl().indexOf(e) >= 0 && (i.l_(e), this.G_(i)), this.Z_();
	}
	Xs(e) {
		return e === this.B_ ? "left" : e === this.A_ ? "right" : "overlay";
	}
	X_() {
		return this.B_;
	}
	J_() {
		return this.A_;
	}
	Q_(e, t) {
		e.u_(t);
	}
	tu(e, t) {
		e.c_(t), this.U_();
	}
	iu(e) {
		e.d_();
	}
	nu(e, t) {
		e.f_(t);
	}
	su(e, t) {
		e.p_(t), this.U_();
	}
	eu(e) {
		e.v_();
	}
	U_() {
		this.bo.forEach(((e) => {
			e.Nn();
		}));
	}
	kn() {
		let [e, t] = this.ru(), n = null;
		return e.N().visible && e.kl().length !== 0 ? n = e : t.N().visible && t.kl().length !== 0 ? n = t : this.bo.length !== 0 && (n = this.bo[0].Ft()), n === null && (n = this.Zs() ?? e), n;
	}
	Zs() {
		let [e, t] = this.ru();
		return e.N().visible ? e : t.N().visible ? t : null;
	}
	G_(e) {
		e !== null && e.zo() && this.hu(e);
	}
	au(e) {
		let t = this.ia.Ee();
		e.Ao({ hs: !0 }), t !== null && e.b_(t), this.U_();
	}
	lu() {
		this.hu(this.B_), this.hu(this.A_);
	}
	ou() {
		this.G_(this.B_), this.G_(this.A_), this.bo.forEach(((e) => {
			this.Gs(e) && this.G_(e.Ft());
		})), this.U_(), this.sn.mr();
	}
	Dt() {
		return this.xo === null && (this.xo = Rt(this.bo)), this.xo;
	}
	_u() {
		let e = this.Dt(), t = this.sn.cu()?.uu, n = this.sn.N().hoveredSeriesOnTop, r = this.R_;
		if (r !== null && r.Kh === e && r.du === t && r.fu === n) return r.pu;
		let i = function(e, t, n) {
			if (!n) return e;
			let r = e.indexOf(t);
			if (r === -1 || r === e.length - 1) return e;
			let i = [];
			for (let t = 0; t < e.length; t++) t !== r && i.push(e[t]);
			return i.push(e[r]), i;
		}(e, t, n);
		return this.R_ = {
			Kh: e,
			du: t,
			fu: n,
			pu: i
		}, i;
	}
	vu(e, t) {
		t = xt(t, 0, this.bo.length - 1);
		let n = this.bo.indexOf(e);
		w(n !== -1, "setSeriesOrder: invalid data source"), this.bo.splice(n, 1), this.bo.splice(t, 0, e), this.bo.forEach(((e, t) => e._n(t))), this.Z_();
		for (let e of [this.B_, this.A_]) e.a_(), e.vl();
		this.sn.mr();
	}
	Vt() {
		return this.Dt().filter(Ut);
	}
	mu() {
		return this.I_;
	}
	wu() {
		return this.V_;
	}
	ol(e) {
		this.fa.push(new at(e));
	}
	_l(e) {
		this.fa = this.fa.filter(((t) => t.Qh() !== e)), e.detached && e.detached(), this.sn.mr();
	}
	Mu() {
		return this.fa;
	}
	il(e, t) {
		return this.fa.map(((n) => n.Qs(e, t))).filter(((e) => e !== null));
	}
	hu(e) {
		let t = e.g_();
		if (t && t.length > 0 && !this.ia.Zi()) {
			let t = this.ia.Ee();
			t !== null && e.b_(t);
		}
		e.Nn();
	}
	K_(e, t, n) {
		let r = this.O_(t);
		if (r === null && (r = this.E_(t, this.sn.N().overlayPriceScales)), this.bo.splice(n, 0, e), !ve(t)) {
			let n = this.P_.get(t) || [];
			n.push(e), this.P_.set(t, n);
		}
		e._n(n), r.h_(e), e.un(r), this.G_(r), this.Z_();
	}
	Z_() {
		this.xo = null, this.R_ = null;
	}
	ru() {
		return this.sn.N().defaultVisiblePriceScaleId === "left" ? [this.B_, this.A_] : [this.A_, this.B_];
	}
	L_(e, t, n) {
		t._e !== n._e && this.hu(e);
	}
	E_(e, t) {
		let n = new Ht(e, {
			visible: !0,
			autoScale: !0,
			...N(t)
		}, this.sn.N().layout, this.sn.N().localization, this.sn.Xi());
		return n.$o(this.$t()), n;
	}
};
function Gt(e, t) {
	return t === null || e.se === 2 && t.se !== 2 || (t.se !== 2 || e.se === 2) && e.ne !== t.ne && e.ne < t.ne;
}
function Kt(e) {
	return {
		te: e.te,
		ie: e.ie
	};
}
function qt(e) {
	return {
		ne: e.distance ?? 0,
		se: e.hitTestPriority ?? (e.itemType === "marker" ? 2 : 0),
		ee: e.itemType ?? "primitive",
		gu: e.cursorStyle,
		te: e.externalId
	};
}
function Jt(e) {
	return {
		uu: e.uu,
		bu: Kt(e.Su),
		gu: e.Su.gu,
		ee: e.Su.ee ?? "primitive"
	};
}
function Yt(e, t, n, r) {
	let i = null;
	for (let a of e) {
		let e = a.Qs?.(t, n, r) ?? null;
		if (e === null) {
			let i = a.Tt(r);
			e = i !== null && i.Qs ? i.Qs(t, n) : null;
		}
		if (e !== null) {
			let t = {
				xu: a,
				Su: e
			};
			(i === null || Gt(t.Su, i.Su)) && (i = t);
		}
	}
	return i;
}
function Xt(e) {
	return e.jn !== void 0;
}
function Zt(e, t, n) {
	let r = [e, ...e.Dt()].reverse(), i = function(e, t, n) {
		let r, i, a;
		for (let c of e) {
			let e = c.il?.(t, n) ?? [];
			for (let t of e) {
				let e = qt(t);
				o = t.zOrder, s = r?.zOrder, (!s || o === "top" && s !== "top" || o === "normal" && s === "bottom" || t.zOrder === r?.zOrder && i !== void 0 && Gt(e, i) || t.zOrder === r?.zOrder && i === void 0) && (r = t, i = e, a = c);
			}
		}
		var o, s;
		return r && a && i ? {
			Su: i,
			Cu: r,
			uu: a
		} : null;
	}(r, t, n);
	if (i?.Cu.zOrder === "top") return Jt(i);
	let a = null, o = null;
	for (let s of r) {
		if (i && i.uu === s && i.Cu.zOrder !== "bottom" && !i.Cu.isBackground) return a ?? Jt(i);
		if (Xt(s)) {
			let r = Yt(s.jn(e), t, n, e);
			if (r !== null) {
				let e = {
					uu: s,
					xu: r.xu,
					bu: Kt(r.Su),
					gu: r.Su.gu,
					ee: r.Su.ee ?? "primitive"
				};
				(a === null || Gt(r.Su, o)) && (a = e, o = r.Su);
			}
		}
		if (i && i.uu === s && i.Cu.zOrder !== "bottom" && i.Cu.isBackground) return a ?? Jt(i);
	}
	return a === null ? i?.Cu ? Jt(i) : null : a;
}
var Qt = class {
	constructor(e, t, n = 50) {
		this.Vs = 0, this.Bs = 1, this.Es = 1, this.Ls = /* @__PURE__ */ new Map(), this.As = /* @__PURE__ */ new Map(), this.yu = e, this.Pu = t, this.zs = n;
	}
	ku(e) {
		let t = e.time, n = this.Pu.cacheKey(t), r = this.Ls.get(n);
		if (r !== void 0) return r.Tu;
		if (this.Vs === this.zs) {
			let e = this.As.get(this.Es);
			this.As.delete(this.Es), this.Ls.delete(T(e)), this.Es++, this.Vs--;
		}
		let i = this.yu(e);
		return this.Ls.set(n, {
			Tu: i,
			Ws: this.Bs
		}), this.As.set(this.Bs, n), this.Vs++, this.Bs++, i;
	}
}, $t = class {
	constructor(e, t) {
		w(e <= t, "right should be >= left"), this.Ru = e, this.Du = t;
	}
	Na() {
		return this.Ru;
	}
	bi() {
		return this.Du;
	}
	Iu() {
		return this.Du - this.Ru + 1;
	}
	ze(e) {
		return this.Ru <= e && e <= this.Du;
	}
	Ze(e) {
		return this.Ru === e.Na() && this.Du === e.bi();
	}
};
function en(e, t) {
	return e === null || t === null ? e === t : e.Ze(t);
}
var tn = class {
	constructor() {
		this.Vu = /* @__PURE__ */ new Map(), this.Ls = null, this.Bu = !1;
	}
	Eu(e) {
		this.Bu = e, this.Ls = null;
	}
	Au(e, t) {
		this.Lu(t), this.Ls = null;
		for (let n = t; n < e.length; ++n) {
			let t = e[n], r = this.Vu.get(t.timeWeight);
			r === void 0 && (r = [], this.Vu.set(t.timeWeight, r)), r.push({
				index: n,
				time: t.time,
				weight: t.timeWeight,
				originalTime: t.originalTime
			});
		}
	}
	zu(e, t, n, r, i) {
		let a = Math.ceil(t / e);
		return this.Ls !== null && this.Ls.Ou === a && i === this.Ls.Nu && n === this.Ls.Fu || (this.Ls = {
			Nu: i,
			Fu: n,
			zl: this.Wu(a, n, r),
			Ou: a
		}), this.Ls.zl;
	}
	Lu(e) {
		if (e === 0) return void this.Vu.clear();
		let t = [];
		this.Vu.forEach(((n, r) => {
			e <= n[0].index ? t.push(r) : n.splice(Je(n, e, ((t) => t.index < e)), 1 / 0);
		}));
		for (let e of t) this.Vu.delete(e);
	}
	Wu(e, t, n) {
		let r = [], i = (e) => !t || n.has(e.index);
		for (let t of Array.from(this.Vu.keys()).sort(((e, t) => t - e))) {
			if (!this.Vu.get(t)) continue;
			let n = r;
			r = [];
			let a = n.length, o = 0, s = T(this.Vu.get(t)), c = s.length, l = 1 / 0, u = -1 / 0;
			for (let t = 0; t < c; t++) {
				let c = s[t], d = c.index;
				for (; o < a;) {
					let e = n[o], t = e.index;
					if (!(t < d && i(e))) {
						l = t;
						break;
					}
					o++, r.push(e), u = t, l = 1 / 0;
				}
				if (l - d >= e && d - u >= e && i(c)) r.push(c), u = d;
				else if (this.Bu) return n;
			}
			for (; o < a; o++) i(n[o]) && r.push(n[o]);
		}
		return r;
	}
}, nn = class e {
	constructor(e) {
		this.Hu = e;
	}
	Uu() {
		return this.Hu === null ? null : new $t(Math.floor(this.Hu.Na()), Math.ceil(this.Hu.bi()));
	}
	$u() {
		return this.Hu;
	}
	static ju() {
		return new e(null);
	}
};
function rn(e, t) {
	return e.weight > t.weight ? e : t;
}
var an = class {
	constructor(e, t, n, r) {
		this.k_ = 0, this.qu = null, this.Yu = [], this.Po = null, this.yo = null, this.Ku = new tn(), this.Gu = /* @__PURE__ */ new Map(), this.Zu = nn.ju(), this.Xu = !0, this.Ju = new O(), this.Qu = new O(), this.tc = new O(), this.nc = null, this.sc = null, this.ec = /* @__PURE__ */ new Map(), this.rc = -1, this.hc = [], this.ac = 1, this.yn = t, this.Do = n, this.lc = t.rightOffset, this.oc = t.barSpacing, this.sn = e, this._c(t), this.Pu = r, this.uc(), this.Ku.Eu(t.uniformDistribution), this.cc(), this.dc();
	}
	N() {
		return this.yn;
	}
	fc(e) {
		k(this.Do, e), this.vc(), this.uc();
	}
	vr(e, t) {
		k(this.yn, e), this.yn.fixLeftEdge && this.mc(), this.yn.fixRightEdge && this.wc(), e.barSpacing !== void 0 && this.sn.Ms(e.barSpacing), e.rightOffset !== void 0 && this.sn.gs(e.rightOffset), this._c(e), e.minBarSpacing === void 0 && e.maxBarSpacing === void 0 || this.sn.Ms(e.barSpacing ?? this.oc), e.ignoreWhitespaceIndices !== void 0 && e.ignoreWhitespaceIndices !== this.yn.ignoreWhitespaceIndices && this.dc(), this.vc(), this.uc(), e.enableConflation === void 0 && e.conflationThresholdFactor === void 0 || this.cc(), this.tc.p();
	}
	Rn(e) {
		return this.Yu[e]?.time ?? null;
	}
	en(e) {
		return this.Yu[e] ?? null;
	}
	Mc(e, t) {
		if (this.Yu.length < 1) return null;
		if (this.Pu.key(e) > this.Pu.key(this.Yu[this.Yu.length - 1].time)) return t ? this.Yu.length - 1 : null;
		let n = Je(this.Yu, this.Pu.key(e), ((e, t) => this.Pu.key(e.time) < t));
		return this.Pu.key(e) < this.Pu.key(this.Yu[n].time) ? t ? n : null : n;
	}
	Zi() {
		return this.k_ === 0 || this.Yu.length === 0 || this.qu === null;
	}
	gc() {
		return this.Yu.length > 0;
	}
	Ee() {
		return this.bc(), this.Zu.Uu();
	}
	Sc() {
		return this.bc(), this.Zu.$u();
	}
	xc() {
		let e = this.Ee();
		if (e === null) return null;
		let t = {
			from: e.Na(),
			to: e.bi()
		};
		return this.Cc(t);
	}
	Cc(e) {
		let t = Math.round(e.from), n = Math.round(e.to), r = E(this.yc()), i = E(this.Pc());
		return {
			from: E(this.en(Math.max(r, t))),
			to: E(this.en(Math.min(i, n)))
		};
	}
	kc(e) {
		return {
			from: E(this.Mc(e.from, !0)),
			to: E(this.Mc(e.to, !0))
		};
	}
	nn() {
		return this.k_;
	}
	H_(e) {
		if (!isFinite(e) || e <= 0 || this.k_ === e) return;
		let t = this.Sc(), n = this.k_;
		if (this.k_ = e, this.Xu = !0, this.yn.lockVisibleTimeRangeOnResize && n !== 0) {
			let t = this.oc * e / n;
			this.oc = t;
		}
		if (this.yn.fixLeftEdge && t !== null && t.Na() <= 0) {
			let t = n - e;
			this.lc -= Math.round(t / this.oc) + 1, this.Xu = !0;
		}
		this.Tc(), this.Rc();
	}
	jt(e) {
		if (this.Zi() || !j(e)) return 0;
		let t = this.Dc() + this.lc - e;
		return this.k_ - (t + .5) * this.oc - 1;
	}
	Ic(e, t) {
		let n = this.Dc(), r = t === void 0 ? 0 : t.from, i = t === void 0 ? e.length : t.to;
		for (let t = r; t < i; t++) {
			let r = e[t].wt, i = n + this.lc - r, a = this.k_ - (i + .5) * this.oc - 1;
			e[t]._t = a;
		}
	}
	Vc(e, t) {
		let n = Math.ceil(this.Bc(e));
		return t && this.yn.ignoreWhitespaceIndices && !this.Ec(n) ? this.Ac(n) : n;
	}
	gs(e) {
		this.Xu = !0, this.lc = e, this.Rc(), this.sn.Lc(), this.sn.mr();
	}
	ml() {
		return this.oc;
	}
	Ms(e) {
		let t = this.oc;
		if (this.zc(e), this.yn.rightOffsetPixels !== void 0 && t !== 0) {
			let e = this.lc * t / this.oc;
			this.lc = e;
		}
		this.Rc(), this.sn.Lc(), this.sn.mr();
	}
	Oc() {
		return this.lc;
	}
	zl() {
		if (this.Zi()) return null;
		if (this.sc !== null) return this.sc;
		let e = this.oc, t = 5 * (this.sn.N().layout.fontSize + 4) / 8 * (this.yn.tickMarkMaxCharacterLength || 8), n = Math.round(t / e), r = E(this.Ee()), i = Math.max(r.Na(), r.Na() - n), a = Math.max(r.bi(), r.bi() - n), o = this.Ku.zu(e, t, this.yn.ignoreWhitespaceIndices, this.ec, this.rc), s = this.yc() + n, c = this.Pc() - n, l = this.Nc(), u = this.yn.fixLeftEdge || l, d = this.yn.fixRightEdge || l, f = 0;
		for (let e of o) {
			if (!(i <= e.index && e.index <= a)) continue;
			let n;
			f < this.hc.length ? (n = this.hc[f], n.coord = this.jt(e.index), n.label = this.Fc(e), n.weight = e.weight) : (n = {
				needAlignCoordinate: !1,
				coord: this.jt(e.index),
				label: this.Fc(e),
				weight: e.weight
			}, this.hc.push(n)), this.oc > t / 2 && !l ? n.needAlignCoordinate = !1 : n.needAlignCoordinate = u && e.index <= s || d && e.index >= c, f++;
		}
		return this.hc.length = f, this.sc = this.hc, this.hc;
	}
	Wc() {
		let e;
		this.Xu = !0, this.Ms(this.yn.barSpacing), e = this.yn.rightOffsetPixels === void 0 ? this.yn.rightOffset : this.yn.rightOffsetPixels / this.ml(), this.gs(e);
	}
	Hc(e) {
		this.Xu = !0, this.qu = e, this.Rc(), this.mc();
	}
	Uc(e, t) {
		let n = this.Bc(e), r = this.ml(), i = r + r / 10 * t;
		this.Ms(i), this.yn.rightBarStaysOnScroll || this.gs(this.Oc() + (n - this.Bc(e)));
	}
	u_(e) {
		this.Po && this.v_(), this.yo === null && this.nc === null && (this.Zi() || (this.yo = e, this.$c()));
	}
	c_(e) {
		if (this.nc === null) return;
		let t = xt(this.k_ - e, 0, this.k_), n = xt(this.k_ - E(this.yo), 0, this.k_);
		t !== 0 && n !== 0 && this.Ms(this.nc.ml * t / n);
	}
	d_() {
		this.yo !== null && (this.yo = null, this.jc());
	}
	f_(e) {
		this.Po === null && this.nc === null && (this.Zi() || (this.Po = e, this.$c()));
	}
	p_(e) {
		if (this.Po === null) return;
		let t = (this.Po - e) / this.ml();
		this.lc = E(this.nc).Oc + t, this.Xu = !0, this.Rc();
	}
	v_() {
		this.Po !== null && (this.Po = null, this.jc());
	}
	qc() {
		this.Yc(this.yn.rightOffset);
	}
	Yc(e, t = 400) {
		if (!isFinite(e)) throw RangeError("offset is required and must be finite number");
		if (!isFinite(t) || t <= 0) throw RangeError("animationDuration (optional) must be finite positive number");
		let n = this.lc, r = performance.now();
		this.sn.ps({
			Kc: (e) => (e - r) / t >= 1,
			Gc: (i) => {
				let a = (i - r) / t;
				return a >= 1 ? e : n + (e - n) * a;
			}
		});
	}
	Pt(e, t) {
		this.Xu = !0, this.Yu = e, this.Ku.Au(e, t), this.Rc();
	}
	Zc() {
		return this.Ju;
	}
	Xc() {
		return this.Qu;
	}
	Jc() {
		return this.tc;
	}
	Dc() {
		return this.qu || 0;
	}
	Qc(e, t) {
		let n = e.Iu(), r = t && this.yn.rightOffsetPixels || 0;
		this.zc((this.k_ - r) / n), this.lc = e.bi() - this.Dc(), t && (this.lc = r ? r / this.ml() : this.yn.rightOffset), this.Rc(), this.Xu = !0, this.sn.Lc(), this.sn.mr();
	}
	td() {
		let e = this.yc(), t = this.Pc();
		if (e === null || t === null) return;
		let n = !this.yn.rightOffsetPixels && this.yn.rightOffset || 0;
		this.Qc(new $t(e, t + n), !0);
	}
	nd(e) {
		let t = new $t(e.from, e.to);
		this.Qc(t);
	}
	rn(e) {
		return this.Do.timeFormatter === void 0 ? this.Pu.formatHorzItem(e.time) : this.Do.timeFormatter(e.originalTime);
	}
	dc() {
		if (!this.yn.ignoreWhitespaceIndices) return;
		this.ec.clear();
		let e = this.sn.Jn();
		for (let t of e) for (let e of t.fl()) this.ec.set(e, !0);
		this.rc++;
	}
	sd() {
		return this.ac;
	}
	Sl() {
		let e = 1 / (window.devicePixelRatio || 1), t = this.yn.minBarSpacing;
		if (t >= e) return [1];
		let n = [1], r = 2;
		for (; r <= 512;) t < e / r && n.push(r), r *= 2;
		return n;
	}
	Nc() {
		let e = this.sn.N().handleScroll, t = this.sn.N().handleScale;
		return !(e.horzTouchDrag || e.mouseWheel || e.pressedMouseMove || e.vertTouchDrag || t.axisDoubleClickReset.time || t.axisPressedMouseMove.time || t.mouseWheel || t.pinch);
	}
	yc() {
		return this.Yu.length === 0 ? null : 0;
	}
	Pc() {
		return this.Yu.length === 0 ? null : this.Yu.length - 1;
	}
	ed(e) {
		return (this.k_ - 1 - e) / this.oc;
	}
	Bc(e) {
		let t = this.ed(e), n = this.Dc() + this.lc - t;
		return Math.round(1e6 * n) / 1e6;
	}
	zc(e) {
		let t = this.oc;
		this.oc = e, this.Tc(), t !== this.oc && (this.Xu = !0, this.rd(), this.cc());
	}
	bc() {
		if (!this.Xu) return;
		if (this.Xu = !1, this.Zi()) return void this.hd(nn.ju());
		let e = this.Dc(), t = this.k_ / this.oc, n = this.lc + e, r = new $t(n - t + 1, n);
		this.hd(new nn(r));
	}
	Tc() {
		let e = xt(this.oc, this.ad(), this.ld());
		this.oc !== e && (this.oc = e, this.Xu = !0);
	}
	ld() {
		return this.yn.maxBarSpacing > 0 ? this.yn.maxBarSpacing : .5 * this.k_;
	}
	ad() {
		return this.yn.fixLeftEdge && this.yn.fixRightEdge && this.Yu.length !== 0 ? this.k_ / this.Yu.length : this.yn.minBarSpacing;
	}
	cc() {
		if (!this.yn.enableConflation) return void (this.ac = 1);
		let e = 1 / (window.devicePixelRatio || 1) * (this.yn.conflationThresholdFactor ?? 1);
		if (this.oc >= e) return void (this.ac = 1);
		let t = e / this.oc, n = 2 ** Math.floor(Math.log2(t));
		this.ac = Math.min(n, 512);
	}
	Rc() {
		let e = this.od();
		e !== null && this.lc < e && (this.lc = e, this.Xu = !0);
		let t = this._d();
		this.lc > t && (this.lc = t, this.Xu = !0);
	}
	od() {
		let e = this.yc(), t = this.qu;
		return e === null || t === null ? null : e - t - 1 + (this.yn.fixLeftEdge ? this.k_ / this.oc : Math.min(2, this.Yu.length));
	}
	_d() {
		return this.yn.fixRightEdge ? 0 : this.k_ / this.oc - Math.min(2, this.Yu.length);
	}
	$c() {
		this.nc = {
			ml: this.ml(),
			Oc: this.Oc()
		};
	}
	jc() {
		this.nc = null;
	}
	Fc(e) {
		let t = this.Gu.get(e.weight);
		return t === void 0 && (t = new Qt(((e) => this.ud(e)), this.Pu), this.Gu.set(e.weight, t)), t.ku(e);
	}
	ud(e) {
		return this.Pu.formatTickmark(e, this.Do);
	}
	hd(e) {
		let t = this.Zu;
		this.Zu = e, en(t.Uu(), this.Zu.Uu()) || this.Ju.p(), en(t.$u(), this.Zu.$u()) || this.Qu.p(), this.rd();
	}
	rd() {
		this.sc = null;
	}
	vc() {
		this.rd(), this.Gu.clear();
	}
	uc() {
		this.Pu.updateFormatter(this.Do);
	}
	mc() {
		if (!this.yn.fixLeftEdge) return;
		let e = this.yc();
		if (e === null) return;
		let t = this.Ee();
		if (t === null) return;
		let n = t.Na() - e;
		if (n < 0) {
			let e = this.lc - n - 1;
			this.gs(e);
		}
		this.Tc();
	}
	wc() {
		this.Rc(), this.Tc();
	}
	Ec(e) {
		return !this.yn.ignoreWhitespaceIndices || this.ec.get(e) || !1;
	}
	Ac(e) {
		let t = function* (e) {
			let t = Math.round(e), n = t < e, r = 1;
			for (;;) n ? (yield t + r, yield t - r) : (yield t - r, yield t + r), r++;
		}(e), n = this.Pc();
		for (; n;) {
			let e = t.next().value;
			if (this.ec.get(e)) return e;
			if (e < 0 || e > n) break;
		}
		return e;
	}
	_c(e) {
		if (e.rightOffsetPixels !== void 0) {
			let t = e.rightOffsetPixels / (e.barSpacing || this.oc);
			this.sn.gs(t);
		}
	}
}, on, sn, cn, ln, un;
(function(e) {
	e[e.OnTouchEnd = 0] = "OnTouchEnd", e[e.OnNextTap = 1] = "OnNextTap";
})(on ||= {});
var dn = class {
	constructor(e, t, n) {
		this.dd = [], this.fd = [], this.pd = null, this.k_ = 0, this.vd = null, this.md = new O(), this.wd = new O(), this.Md = null, this.gd = e, this.yn = t, this.Pu = n, this.Io = new R(this.yn.layout.colorParsers), this.bd = new re(this), this.ia = new an(this, t.timeScale, this.yn.localization, n), this.Ct = new K(this, t.crosshair), this.Sd = new bt(t.crosshair), t.addDefaultPane && (this.xd(0), this.dd[0].W_(2)), this.Cd = this.yd(0), this.Pd = this.yd(1);
	}
	ka() {
		this.kd(ye.ys());
	}
	mr() {
		this.kd(ye.Cs());
	}
	Ya() {
		this.kd(new ye(1));
	}
	Ta(e) {
		let t = this.Td(e);
		this.kd(t);
	}
	cu() {
		return this.vd;
	}
	Rd(e) {
		if (this.vd?.uu === e?.uu && this.vd?.bu?.te === e?.bu?.te && this.vd?.bu?.ie === e?.bu?.ie && this.vd?.gu === e?.gu && this.vd?.ee === e?.ee) return;
		let t = this.vd;
		this.vd = e, t !== null && this.Ta(t.uu), e !== null && e.uu !== t?.uu && this.Ta(e.uu);
	}
	N() {
		return this.yn;
	}
	vr(e) {
		k(this.yn, e), this.dd.forEach(((t) => t.z_(e))), e.timeScale !== void 0 && this.ia.vr(e.timeScale), e.localization !== void 0 && this.ia.fc(e.localization), (e.leftPriceScale || e.rightPriceScale) && this.md.p(), this.Cd = this.yd(0), this.Pd = this.yd(1), this.ka();
	}
	Dd(e, t, n = 0) {
		let r = this.dd[n];
		if (r === void 0) return;
		if (e === "left") return k(this.yn, { leftPriceScale: t }), r.z_({ leftPriceScale: t }), this.md.p(), void this.ka();
		if (e === "right") return k(this.yn, { rightPriceScale: t }), r.z_({ rightPriceScale: t }), this.md.p(), void this.ka();
		let i = this.Id(e, n);
		i !== null && (i.Ft.vr(t), this.md.p());
	}
	Id(e, t) {
		let n = this.dd[t];
		if (n === void 0) return null;
		let r = n.O_(e);
		return r === null ? null : {
			Kn: n,
			Ft: r
		};
	}
	Et() {
		return this.ia;
	}
	Gn() {
		return this.dd;
	}
	Vd() {
		return this.Ct;
	}
	Bd() {
		return this.wd;
	}
	Ed(e, t) {
		e.$o(t), this.Lc();
	}
	H_(e) {
		this.k_ = e, this.ia.H_(this.k_), this.dd.forEach(((t) => t.H_(e))), this.Lc();
	}
	Ad(e) {
		this.dd.length !== 1 && (w(e >= 0 && e < this.dd.length, "Invalid pane index"), this.dd.splice(e, 1), this.ka());
	}
	Ld(e, t) {
		if (this.dd.length < 2) return;
		w(e >= 0 && e < this.dd.length, "Invalid pane index");
		let n = this.dd[e], r = this.dd.reduce(((e, t) => e + t.F_()), 0), i = this.dd.reduce(((e, t) => e + t.$t()), 0), a = i - 30 * (this.dd.length - 1);
		t = Math.min(a, Math.max(30, t));
		let o = r / i, s = n.$t();
		n.W_(t * o);
		let c = t - s, l = this.dd.length - 1;
		for (let e of this.dd) if (e !== n) {
			let t = Math.min(a, Math.max(30, e.$t() - c / l));
			c -= e.$t() - t, --l;
			let n = t * o;
			e.W_(n);
		}
		this.ka();
	}
	zd(e, t) {
		w(e >= 0 && e < this.dd.length && t >= 0 && t < this.dd.length, "Invalid pane index");
		let n = this.dd[e], r = this.dd[t];
		this.dd[e] = r, this.dd[t] = n, this.ka();
	}
	Od(e, t) {
		if (w(e >= 0 && e < this.dd.length && t >= 0 && t < this.dd.length, "Invalid pane index"), e === t) return;
		let [n] = this.dd.splice(e, 1);
		this.dd.splice(t, 0, n), this.ka();
	}
	Q_(e, t, n) {
		e.Q_(t, n);
	}
	tu(e, t, n) {
		e.tu(t, n), this.Ra(), this.kd(this.Nd(e, 2));
	}
	iu(e, t) {
		e.iu(t), this.kd(this.Nd(e, 2));
	}
	nu(e, t, n) {
		t.zo() || e.nu(t, n);
	}
	su(e, t, n) {
		t.zo() || (e.su(t, n), this.Ra(), this.kd(this.Nd(e, 2)));
	}
	eu(e, t) {
		t.zo() || (e.eu(t), this.kd(this.Nd(e, 2)));
	}
	au(e, t) {
		e.au(t), this.kd(this.Nd(e, 2));
	}
	Fd(e) {
		this.ia.u_(e);
	}
	Wd(e, t) {
		let n = this.Et();
		if (n.Zi() || t === 0) return;
		let r = n.nn();
		e = Math.max(1, Math.min(e, r)), n.Uc(e, t), this.Lc();
	}
	Hd(e) {
		this.Ud(0), this.$d(e), this.jd();
	}
	qd(e) {
		this.ia.c_(e), this.Lc();
	}
	Yd() {
		this.ia.d_(), this.mr();
	}
	Ud(e) {
		this.ia.f_(e);
	}
	$d(e) {
		this.ia.p_(e), this.Lc();
	}
	jd() {
		this.ia.v_(), this.mr();
	}
	Jn() {
		return this.fd;
	}
	Wn() {
		return this.pd === null && (this.pd = this.fd.filter(((e) => e.It()))), this.pd;
	}
	Pa() {
		this.pd = null;
	}
	Kd(e, t, n, r, i) {
		this.Ct.In(e, t);
		let a = NaN, o = this.ia.Vc(e, !0), s = this.ia.Ee();
		s !== null && (o = Math.min(Math.max(s.Na(), o), s.bi())), o = this.Ct.Fn(o);
		let c = r.kn(), l = c.Lt();
		if (l !== null && (a = c.Tn(t, l)), a = this.Sd.Pl(a, o, r), this.Ct.An(o, a, r), this.Ya(), !i) {
			let i = Zt(r, e, t);
			this.Rd(i && {
				uu: i.uu,
				bu: i.bu,
				gu: i.gu || null,
				ee: i.ee
			}), this.wd.p(this.Ct.Bt(), {
				x: e,
				y: t
			}, n);
		}
	}
	Gd(e, t, n) {
		let r = n.kn(), i = r.Lt(), a = r.Nt(e, E(i)), o = this.ia.Mc(t, !0), s = this.ia.jt(E(o));
		this.Kd(s, a, null, n, !0);
	}
	Zd(e) {
		this.Vd().zn(), this.Ya(), e || this.wd.p(null, null, null);
	}
	Ra() {
		let e = this.Ct.Kn();
		if (e !== null) {
			let t = this.Ct.Bn(), n = this.Ct.En();
			this.Kd(t, n, null, e);
		}
		this.Ct.Nn();
	}
	Xd(e, t, n) {
		let r = this.ia.Rn(0);
		t !== void 0 && n !== void 0 && this.ia.Pt(t, n);
		let i = this.ia.Rn(0), a = this.ia.Dc(), o = this.ia.Ee();
		if (o !== null && r !== null && i !== null) {
			let t = o.ze(a), s = this.Pu.key(r) > this.Pu.key(i), c = e !== null && e > a && !s, l = this.ia.N().allowShiftVisibleRangeOnWhitespaceReplacement, u = t && (n !== void 0 || l) && this.ia.N().shiftVisibleRangeOnNewBar;
			if (c && !u) {
				let t = e - a;
				this.ia.gs(this.ia.Oc() - t);
			}
		}
		this.ia.Hc(e);
	}
	Ba(e) {
		e !== null && e.ou();
	}
	Ks(e) {
		if (function(e) {
			return e instanceof Wt;
		}(e)) return e;
		let t = this.dd.find(((t) => t.Dt().includes(e)));
		return t === void 0 ? null : t;
	}
	Lc() {
		this.dd.forEach(((e) => e.ou())), this.Ra();
	}
	m() {
		this.dd.forEach(((e) => e.m())), this.dd.length = 0, this.yn.localization.priceFormatter = void 0, this.yn.localization.percentageFormatter = void 0, this.yn.localization.timeFormatter = void 0;
	}
	Jd() {
		return this.bd;
	}
	Js() {
		return this.bd.N();
	}
	N_() {
		return this.md;
	}
	Qd(e, t) {
		let n = this.xd(t);
		this.tf(e, n), this.fd.push(e), this.Pa(), this.fd.length === 1 ? this.ka() : this.mr();
	}
	if(e) {
		let t = this.Ks(e), n = this.fd.indexOf(e);
		w(n !== -1, "Series not found");
		let r = E(t);
		this.fd.splice(n, 1), r.l_(e), e.m && e.m(), this.Pa(), this.ia.dc(), this.nf(r);
	}
	ya(e, t) {
		let n = E(this.Ks(e));
		n.l_(e, !0), n.h_(e, t, !0);
	}
	td() {
		let e = ye.Cs();
		e.us(), this.kd(e);
	}
	sf(e) {
		let t = ye.Cs();
		t.fs(e), this.kd(t);
	}
	ws() {
		let e = ye.Cs();
		e.ws(), this.kd(e);
	}
	Ms(e) {
		let t = ye.Cs();
		t.Ms(e), this.kd(t);
	}
	gs(e) {
		let t = ye.Cs();
		t.gs(e), this.kd(t);
	}
	ps(e) {
		let t = ye.Cs();
		t.ps(e), this.kd(t);
	}
	cs() {
		let e = ye.Cs();
		e.cs(), this.kd(e);
	}
	ef() {
		let e = this.yn.defaultVisiblePriceScaleId, t = this.yn.leftPriceScale.visible;
		return t === this.yn.rightPriceScale.visible ? e : t ? "left" : "right";
	}
	rf(e, t) {
		if (w(t >= 0, "Index should be greater or equal to 0"), t === this.hf(e)) return;
		let n = E(this.Ks(e));
		n.l_(e);
		let r = this.xd(t);
		this.tf(e, r);
		let i = !1;
		n.kl().length === 0 && (i = this.nf(n)), i || this.ka();
	}
	af() {
		return this.Pd;
	}
	$() {
		return this.Cd;
	}
	Ut(e) {
		let t = this.Pd, n = this.Cd;
		if (t === n) return t;
		if (e = Math.max(0, Math.min(100, Math.round(100 * e))), this.Md === null || this.Md.ah !== n || this.Md.oh !== t) this.Md = {
			ah: n,
			oh: t,
			lf: /* @__PURE__ */ new Map()
		};
		else {
			let t = this.Md.lf.get(e);
			if (t !== void 0) return t;
		}
		let r = this.Io.tt(n, t, e / 100);
		return this.Md.lf.set(e, r), r;
	}
	_f(e) {
		return this.dd.indexOf(e);
	}
	Xi() {
		return this.Io;
	}
	uf() {
		return this.cf();
	}
	cf(e) {
		let t = new Wt(this.ia, this);
		this.dd.push(t);
		let n = e ?? this.dd.length - 1, r = ye.ys();
		return r.es(n, {
			rs: 0,
			hs: !0
		}), this.kd(r), t;
	}
	xd(e) {
		return w(e >= 0, "Index should be greater or equal to 0"), (e = Math.min(this.dd.length, e)) < this.dd.length ? this.dd[e] : this.cf(e);
	}
	hf(e) {
		return this.dd.findIndex(((t) => t.Y_().includes(e)));
	}
	Nd(e, t) {
		let n = new ye(t);
		if (e !== null) {
			let r = this.dd.indexOf(e);
			n.es(r, { rs: t });
		}
		return n;
	}
	Td(e, t) {
		return t === void 0 && (t = 2), this.Nd(this.Ks(e), t);
	}
	kd(e) {
		this.gd && this.gd(e), this.dd.forEach(((e) => e.wu().wr().Pt()));
	}
	tf(e, t) {
		let n = e.N().priceScaleId, r = n === void 0 ? this.ef() : n;
		t.h_(e, r), ve(r) || e.vr(e.N());
	}
	yd(e) {
		let t = this.yn.layout;
		return t.background.type === "gradient" ? e === 0 ? t.background.topColor : t.background.bottomColor : t.background.color;
	}
	nf(e) {
		return !e.q_() && e.kl().length === 0 && this.dd.length > 1 && (this.dd.splice(this._f(e), 1), this.ka(), !0);
	}
};
function fn(e) {
	if (e >= 1) return 0;
	let t = 0;
	for (; t < 8; t++) {
		if (Math.abs(Math.round(e) - e) < 1e-8) return t;
		e *= 10;
	}
	return t;
}
function pn(e) {
	return !A(e) && !M(e);
}
function mn(e) {
	return A(e);
}
(function(e) {
	e[e.Disabled = 0] = "Disabled", e[e.Continuous = 1] = "Continuous", e[e.OnDataUpdate = 2] = "OnDataUpdate";
})(sn ||= {}), function(e) {
	e[e.LastBar = 0] = "LastBar", e[e.LastVisible = 1] = "LastVisible";
}(cn ||= {}), function(e) {
	e.Solid = "solid", e.VerticalGradient = "gradient";
}(ln ||= {}), function(e) {
	e[e.Year = 0] = "Year", e[e.Month = 1] = "Month", e[e.DayOfMonth = 2] = "DayOfMonth", e[e.Time = 3] = "Time", e[e.TimeWithSeconds = 4] = "TimeWithSeconds";
}(un ||= {});
var hn = (e) => e.getUTCFullYear();
function gn(e, t, n) {
	return t.replace(/yyyy/g, ((e) => Se(hn(e), 4))(e)).replace(/yy/g, ((e) => Se(hn(e) % 100, 2))(e)).replace(/MMMM/g, ((e, t) => new Date(e.getUTCFullYear(), e.getUTCMonth(), 1).toLocaleString(t, { month: "long" }))(e, n)).replace(/MMM/g, ((e, t) => new Date(e.getUTCFullYear(), e.getUTCMonth(), 1).toLocaleString(t, { month: "short" }))(e, n)).replace(/MM/g, ((e) => Se(((e) => e.getUTCMonth() + 1)(e), 2))(e)).replace(/dd/g, ((e) => Se(((e) => e.getUTCDate())(e), 2))(e));
}
var _n = class {
	constructor(e = "yyyy-MM-dd", t = "default") {
		this.df = e, this.ff = t;
	}
	ku(e) {
		return gn(e, this.df, this.ff);
	}
}, vn = class {
	constructor(e) {
		this.pf = e || "%h:%m:%s";
	}
	ku(e) {
		return this.pf.replace("%h", Se(e.getUTCHours(), 2)).replace("%m", Se(e.getUTCMinutes(), 2)).replace("%s", Se(e.getUTCSeconds(), 2));
	}
}, yn = {
	vf: "yyyy-MM-dd",
	mf: "%h:%m:%s",
	wf: " ",
	Mf: "default"
}, bn = class {
	constructor(e = {}) {
		let t = {
			...yn,
			...e
		};
		this.gf = new _n(t.vf, t.Mf), this.bf = new vn(t.mf), this.Sf = t.wf;
	}
	ku(e) {
		return `${this.gf.ku(e)}${this.Sf}${this.bf.ku(e)}`;
	}
};
function xn(e) {
	return 60 * e * 60 * 1e3;
}
function Sn(e) {
	return 60 * e * 1e3;
}
var Cn = [
	{
		xf: (wn = 1, 1e3 * wn),
		Cf: 10
	},
	{
		xf: Sn(1),
		Cf: 20
	},
	{
		xf: Sn(5),
		Cf: 21
	},
	{
		xf: Sn(30),
		Cf: 22
	},
	{
		xf: xn(1),
		Cf: 30
	},
	{
		xf: xn(3),
		Cf: 31
	},
	{
		xf: xn(6),
		Cf: 32
	},
	{
		xf: xn(12),
		Cf: 33
	}
], wn;
function Tn(e, t) {
	if (e.getUTCFullYear() !== t.getUTCFullYear()) return 70;
	if (e.getUTCMonth() !== t.getUTCMonth()) return 60;
	if (e.getUTCDate() !== t.getUTCDate()) return 50;
	for (let n = Cn.length - 1; n >= 0; --n) if (Math.floor(t.getTime() / Cn[n].xf) !== Math.floor(e.getTime() / Cn[n].xf)) return Cn[n].Cf;
	return 0;
}
function En(e) {
	let t = e;
	if (M(e) && (t = On(e)), !pn(t)) throw Error("time must be of type BusinessDay");
	let n = new Date(Date.UTC(t.year, t.month - 1, t.day, 0, 0, 0, 0));
	return {
		yf: Math.round(n.getTime() / 1e3),
		Pf: t
	};
}
function Dn(e) {
	if (!mn(e)) throw Error("time must be of type isUTCTimestamp");
	return { yf: e };
}
function On(e) {
	let t = new Date(e);
	if (isNaN(t.getTime())) throw Error(`Invalid date string=${e}, expected format=yyyy-mm-dd`);
	return {
		day: t.getUTCDate(),
		month: t.getUTCMonth() + 1,
		year: t.getUTCFullYear()
	};
}
function kn(e) {
	M(e.time) && (e.time = On(e.time));
}
var An = class {
	options() {
		return this.yn;
	}
	setOptions(e) {
		this.yn = e, this.updateFormatter(e.localization);
	}
	preprocessData(e) {
		Array.isArray(e) ? function(e) {
			e.forEach(kn);
		}(e) : kn(e);
	}
	createConverterToInternalObj(e) {
		return E(function(e) {
			return e.length === 0 ? null : pn(e[0].time) || M(e[0].time) ? En : Dn;
		}(e));
	}
	key(e) {
		return typeof e == "object" && "yf" in e ? e.yf : this.key(this.convertHorzItemToInternal(e));
	}
	cacheKey(e) {
		let t = e;
		return t.Pf === void 0 ? (/* @__PURE__ */ new Date(1e3 * t.yf)).getTime() : new Date(Date.UTC(t.Pf.year, t.Pf.month - 1, t.Pf.day)).getTime();
	}
	convertHorzItemToInternal(e) {
		return mn(t = e) ? Dn(t) : pn(t) ? En(t) : En(On(t));
		var t;
	}
	updateFormatter(e) {
		if (!this.yn) return;
		let t = e.dateFormat;
		this.kf = this.yn.timeScale.timeVisible ? new bn({
			vf: t,
			mf: this.yn.timeScale.secondsVisible ? "%h:%m:%s" : "%h:%m",
			wf: "   ",
			Mf: e.locale
		}) : new _n(t, e.locale);
	}
	formatHorzItem(e) {
		let t = e;
		return this.kf.ku(/* @__PURE__ */ new Date(1e3 * t.yf));
	}
	formatTickmark(e, t) {
		let n = function(e, t, n) {
			switch (e) {
				case 0:
				case 10: return t ? n ? 4 : 3 : 2;
				case 20:
				case 21:
				case 22:
				case 30:
				case 31:
				case 32:
				case 33: return t ? 3 : 2;
				case 50: return 2;
				case 60: return 1;
				case 70: return 0;
			}
		}(e.weight, this.yn.timeScale.timeVisible, this.yn.timeScale.secondsVisible), r = this.yn.timeScale;
		if (r.tickMarkFormatter !== void 0) {
			let i = r.tickMarkFormatter(e.originalTime, n, t.locale);
			if (i !== null) return i;
		}
		return function(e, t, n) {
			let r = {};
			switch (t) {
				case 0:
					r.year = "numeric";
					break;
				case 1:
					r.month = "short";
					break;
				case 2:
					r.day = "numeric";
					break;
				case 3:
					r.hour12 = !1, r.hour = "2-digit", r.minute = "2-digit";
					break;
				case 4: r.hour12 = !1, r.hour = "2-digit", r.minute = "2-digit", r.second = "2-digit";
			}
			let i = e.Pf === void 0 ? /* @__PURE__ */ new Date(1e3 * e.yf) : new Date(Date.UTC(e.Pf.year, e.Pf.month - 1, e.Pf.day));
			return new Date(i.getUTCFullYear(), i.getUTCMonth(), i.getUTCDate(), i.getUTCHours(), i.getUTCMinutes(), i.getUTCSeconds(), i.getUTCMilliseconds()).toLocaleString(n, r);
		}(e.time, n, t.locale);
	}
	maxTickMarkWeight(e) {
		let t = e.reduce(rn, e[0]).weight;
		return t > 30 && t < 50 && (t = 30), t;
	}
	fillWeightsForPoints(e, t) {
		(function(e, t = 0) {
			if (e.length === 0) return;
			let n = t === 0 ? null : e[t - 1].time.yf, r = n === null ? null : /* @__PURE__ */ new Date(1e3 * n), i = 0;
			for (let a = t; a < e.length; ++a) {
				let t = e[a], o = /* @__PURE__ */ new Date(1e3 * t.time.yf);
				r !== null && (t.timeWeight = Tn(o, r)), i += t.time.yf - (n || t.time.yf), n = t.time.yf, r = o;
			}
			if (t === 0 && e.length > 1) {
				let t = Math.ceil(i / (e.length - 1)), n = /* @__PURE__ */ new Date(1e3 * (e[0].time.yf - t));
				e[0].timeWeight = Tn(/* @__PURE__ */ new Date(1e3 * e[0].time.yf), n);
			}
		})(e, t);
	}
	static Tf(e) {
		return k({ localization: { dateFormat: "dd MMM 'yy" } }, e ?? {});
	}
}, jn = typeof window < "u";
function Mn() {
	return !!jn && window.navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
}
function Nn() {
	return !!jn && /iPhone|iPad|iPod/.test(window.navigator.platform);
}
function Pn(e, t) {
	switch (e) {
		case "custom": return t === void 0 ? "series" : "custom-object";
		case "price-line": return "custom-price-line";
		case "marker": return "series-marker";
		case "primitive": return "primitive";
		default: return "series";
	}
}
function Fn(e) {
	return e + e % 2;
}
function In(e) {
	jn && window.chrome !== void 0 && e.addEventListener("mousedown", ((e) => {
		if (e.button === 1) return e.preventDefault(), !1;
	}));
}
var Ln = class {
	constructor(e, t, n) {
		this.Rf = 0, this.Df = null, this.If = {
			_t: -Infinity,
			ut: Infinity
		}, this.Vf = 0, this.Bf = null, this.Ef = {
			_t: -Infinity,
			ut: Infinity
		}, this.Af = null, this.Lf = !1, this.zf = null, this.Of = null, this.Nf = !1, this.Ff = !1, this.Wf = !1, this.Hf = null, this.Uf = null, this.$f = null, this.jf = null, this.qf = null, this.Yf = null, this.Kf = null, this.Gf = 0, this.Zf = !1, this.Xf = !1, this.Jf = !1, this.Qf = 0, this.tp = null, this.ip = !Nn(), this.np = (e) => {
			this.sp(e);
		}, this.ep = (e) => {
			if (this.rp(e)) {
				let t = this.hp(e);
				if (++this.Vf, this.Bf && this.Vf > 1) {
					let { ap: n } = this.lp(Bn(e), this.Ef);
					n < 30 && !this.Wf && this.op(t, this.up._p), this.cp();
				}
			} else {
				let t = this.hp(e);
				if (++this.Rf, this.Df && this.Rf > 1) {
					let { ap: n } = this.lp(Bn(e), this.If);
					n < 5 && !this.Ff && this.dp(t, this.up.fp), this.pp();
				}
			}
		}, this.vp = e, this.up = t, this.yn = n, this.mp();
	}
	m() {
		this.Hf !== null && (this.Hf(), this.Hf = null), this.Uf !== null && (this.Uf(), this.Uf = null), this.jf !== null && (this.jf(), this.jf = null), this.qf !== null && (this.qf(), this.qf = null), this.Yf !== null && (this.Yf(), this.Yf = null), this.$f !== null && (this.$f(), this.$f = null), this.wp(), this.pp();
	}
	Mp(e) {
		this.jf && this.jf();
		let t = this.gp.bind(this);
		if (this.jf = () => {
			this.vp.removeEventListener("mousemove", t);
		}, this.vp.addEventListener("mousemove", t), this.rp(e)) return;
		let n = this.hp(e);
		this.dp(n, this.up.bp), this.ip = !0;
	}
	pp() {
		this.Df !== null && clearTimeout(this.Df), this.Rf = 0, this.Df = null, this.If = {
			_t: -Infinity,
			ut: Infinity
		};
	}
	cp() {
		this.Bf !== null && clearTimeout(this.Bf), this.Vf = 0, this.Bf = null, this.Ef = {
			_t: -Infinity,
			ut: Infinity
		};
	}
	gp(e) {
		if (this.Jf || this.Of !== null || this.rp(e)) return;
		let t = this.hp(e);
		this.dp(t, this.up.Sp), this.ip = !0;
	}
	xp(e) {
		let t = Hn(e.changedTouches, E(this.tp));
		if (t === null || (this.Qf = Vn(e), this.Kf !== null) || this.Xf) return;
		this.Zf = !0;
		let { Cp: n, yp: r, ap: i } = this.lp(Bn(t), E(this.Of));
		if (this.Nf || !(i < 5)) {
			if (!this.Nf) {
				let e = .5 * n, t = r >= e && !this.yn.Pp(), i = e > r && !this.yn.kp();
				t || i || (this.Xf = !0), this.Nf = !0, this.Wf = !0, this.wp(), this.cp();
			}
			if (!this.Xf) {
				let n = this.hp(e, t);
				this.op(n, this.up.Tp), zn(e);
			}
		}
	}
	Rp(e) {
		if (e.button !== 0) return;
		let { ap: t } = this.lp(Bn(e), E(this.zf));
		if (t >= 5 && (this.Ff = !0, this.pp()), this.Ff) {
			let t = this.hp(e);
			this.dp(t, this.up.Dp);
		}
	}
	lp(e, t) {
		let n = Math.abs(t._t - e._t), r = Math.abs(t.ut - e.ut);
		return {
			Cp: n,
			yp: r,
			ap: n + r
		};
	}
	Ip(e) {
		let t = Hn(e.changedTouches, E(this.tp));
		if (t === null && e.touches.length === 0 && (t = e.changedTouches[0]), t === null) return;
		this.tp = null, this.Qf = Vn(e), this.wp(), this.Of = null, this.Yf &&= (this.Yf(), null);
		let n = this.hp(e, t);
		if (this.op(n, this.up.Vp), ++this.Vf, this.Bf && this.Vf > 1) {
			let { ap: e } = this.lp(Bn(t), this.Ef);
			e < 30 && !this.Wf && this.op(n, this.up._p), this.cp();
		} else this.Wf || (this.op(n, this.up.Bp), this.up.Bp && zn(e));
		this.Vf === 0 && zn(e), e.touches.length === 0 && this.Lf && (this.Lf = !1, zn(e));
	}
	sp(e) {
		if (e.button !== 0) return;
		let t = this.hp(e);
		if (this.zf = null, this.Jf = !1, this.qf &&= (this.qf(), null), Mn() && this.vp.ownerDocument.documentElement.removeEventListener("mouseleave", this.np), !this.rp(e)) {
			if (this.dp(t, this.up.Ep), ++this.Rf, this.Df && this.Rf > 1) {
				let { ap: n } = this.lp(Bn(e), this.If);
				n < 5 && !this.Ff && this.dp(t, this.up.fp), this.pp();
			} else this.Ff || this.dp(t, this.up.Ap);
		}
	}
	wp() {
		this.Af !== null && (clearTimeout(this.Af), this.Af = null);
	}
	Lp(e) {
		if (this.tp !== null) return;
		let t = e.changedTouches[0];
		this.tp = t.identifier, this.Qf = Vn(e);
		let n = this.vp.ownerDocument.documentElement;
		this.Wf = !1, this.Nf = !1, this.Xf = !1, this.Of = Bn(t), this.Yf &&= (this.Yf(), null);
		{
			let t = this.xp.bind(this), r = this.Ip.bind(this);
			this.Yf = () => {
				n.removeEventListener("touchmove", t), n.removeEventListener("touchend", r);
			}, n.addEventListener("touchmove", t, { passive: !1 }), n.addEventListener("touchend", r, { passive: !1 }), this.wp(), this.Af = setTimeout(this.zp.bind(this, e), 240);
		}
		let r = this.hp(e, t);
		this.op(r, this.up.Op), this.Bf || (this.Vf = 0, this.Bf = setTimeout(this.cp.bind(this), 500), this.Ef = Bn(t));
	}
	Np(e) {
		if (e.button !== 0) return;
		let t = this.vp.ownerDocument.documentElement;
		Mn() && t.addEventListener("mouseleave", this.np), this.Ff = !1, this.zf = Bn(e), this.qf &&= (this.qf(), null);
		{
			let e = this.Rp.bind(this), n = this.sp.bind(this);
			this.qf = () => {
				t.removeEventListener("mousemove", e), t.removeEventListener("mouseup", n);
			}, t.addEventListener("mousemove", e), t.addEventListener("mouseup", n);
		}
		if (this.Jf = !0, this.rp(e)) return;
		let n = this.hp(e);
		this.dp(n, this.up.Fp), this.Df || (this.Rf = 0, this.Df = setTimeout(this.pp.bind(this), 500), this.If = Bn(e));
	}
	mp() {
		this.vp.addEventListener("mouseenter", this.Mp.bind(this)), this.vp.addEventListener("touchcancel", this.wp.bind(this));
		{
			let e = this.vp.ownerDocument, t = (e) => {
				this.up.Wp && (e.composed && this.vp.contains(e.composedPath()[0]) || e.target && this.vp.contains(e.target) || this.up.Wp());
			};
			this.Uf = () => {
				e.removeEventListener("touchstart", t);
			}, this.Hf = () => {
				e.removeEventListener("mousedown", t);
			}, e.addEventListener("mousedown", t), e.addEventListener("touchstart", t, { passive: !0 });
		}
		Nn() && (this.$f = () => {
			this.vp.removeEventListener("dblclick", this.ep);
		}, this.vp.addEventListener("dblclick", this.ep)), this.vp.addEventListener("mouseleave", this.Hp.bind(this)), this.vp.addEventListener("touchstart", this.Lp.bind(this), { passive: !0 }), In(this.vp), this.vp.addEventListener("mousedown", this.Np.bind(this)), this.Up(), this.vp.addEventListener("touchmove", (() => {}), { passive: !1 });
	}
	Up() {
		this.up.$p === void 0 && this.up.jp === void 0 && this.up.qp === void 0 || (this.vp.addEventListener("touchstart", ((e) => this.Yp(e.touches)), { passive: !0 }), this.vp.addEventListener("touchmove", ((e) => {
			if (e.touches.length === 2 && this.Kf !== null && this.up.jp !== void 0) {
				let t = Rn(e.touches[0], e.touches[1]) / this.Gf;
				this.up.jp(this.Kf, t), zn(e);
			}
		}), { passive: !1 }), this.vp.addEventListener("touchend", ((e) => {
			this.Yp(e.touches);
		})));
	}
	Yp(e) {
		e.length === 1 && (this.Zf = !1), e.length !== 2 || this.Zf || this.Lf ? this.Kp() : this.Gp(e);
	}
	Gp(e) {
		let t = this.vp.getBoundingClientRect() || {
			left: 0,
			top: 0
		};
		this.Kf = {
			_t: (e[0].clientX - t.left + (e[1].clientX - t.left)) / 2,
			ut: (e[0].clientY - t.top + (e[1].clientY - t.top)) / 2
		}, this.Gf = Rn(e[0], e[1]), this.up.$p !== void 0 && this.up.$p(), this.wp();
	}
	Kp() {
		this.Kf !== null && (this.Kf = null, this.up.qp !== void 0 && this.up.qp());
	}
	Hp(e) {
		if (this.jf && this.jf(), this.rp(e) || !this.ip) return;
		let t = this.hp(e);
		this.dp(t, this.up.Zp), this.ip = !Nn();
	}
	zp(e) {
		let t = Hn(e.touches, E(this.tp));
		if (t === null) return;
		let n = this.hp(e, t);
		this.op(n, this.up.Xp), this.Wf = !0, this.Lf = !0;
	}
	rp(e) {
		return e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents !== void 0 ? e.sourceCapabilities.firesTouchEvents : Vn(e) < this.Qf + 500;
	}
	op(e, t) {
		t && t.call(this.up, e);
	}
	dp(e, t) {
		t && t.call(this.up, e);
	}
	hp(e, t) {
		let n = t || e, r = this.vp.getBoundingClientRect() || {
			left: 0,
			top: 0
		};
		return {
			clientX: n.clientX,
			clientY: n.clientY,
			pageX: n.pageX,
			pageY: n.pageY,
			screenX: n.screenX,
			screenY: n.screenY,
			localX: n.clientX - r.left,
			localY: n.clientY - r.top,
			ctrlKey: e.ctrlKey,
			altKey: e.altKey,
			shiftKey: e.shiftKey,
			metaKey: e.metaKey,
			Jp: !e.type.startsWith("mouse") && e.type !== "contextmenu" && e.type !== "click",
			Qp: e.type,
			tv: n.target,
			xu: e.view,
			iv: () => {
				e.type !== "touchstart" && zn(e);
			}
		};
	}
};
function Rn(e, t) {
	let n = e.clientX - t.clientX, r = e.clientY - t.clientY;
	return Math.sqrt(n * n + r * r);
}
function zn(e) {
	e.cancelable && e.preventDefault();
}
function Bn(e) {
	return {
		_t: e.pageX,
		ut: e.pageY
	};
}
function Vn(e) {
	return e.timeStamp || performance.now();
}
function Hn(e, t) {
	for (let n = 0; n < e.length; ++n) if (e[n].identifier === t) return e[n];
	return null;
}
var Un = class {
	constructor(e, t, n) {
		this.nv = null, this.sv = null, this.ev = !0, this.rv = null, this.hv = e, this.av = e.lv()[t], this.ov = e.lv()[n], this._v = document.createElement("tr"), this._v.style.height = "1px", this.uv = document.createElement("td"), this.uv.style.position = "relative", this.uv.style.padding = "0", this.uv.style.margin = "0", this.uv.setAttribute("colspan", "3"), this.cv(), this._v.appendChild(this.uv), this.ev = this.hv.N().layout.panes.enableResize, this.ev ? this.dv() : (this.nv = null, this.sv = null);
	}
	m() {
		this.sv !== null && this.sv.m();
	}
	fv() {
		return this._v;
	}
	pv() {
		return c({
			width: this.av.pv().width,
			height: 1
		});
	}
	vv() {
		return c({
			width: this.av.vv().width,
			height: 1 * window.devicePixelRatio
		});
	}
	mv(e, t, n) {
		let r = this.vv();
		e.fillStyle = this.hv.N().layout.panes.separatorColor, e.fillRect(t, n, r.width, r.height);
	}
	Pt() {
		this.cv(), this.hv.N().layout.panes.enableResize !== this.ev && (this.ev = this.hv.N().layout.panes.enableResize, this.ev ? this.dv() : (this.nv !== null && (this.uv.removeChild(this.nv.wv), this.uv.removeChild(this.nv.Mv), this.nv = null), this.sv !== null && (this.sv.m(), this.sv = null)));
	}
	dv() {
		let e = document.createElement("div"), t = e.style;
		t.position = "fixed", t.display = "none", t.zIndex = "49", t.top = "0", t.left = "0", t.width = "100%", t.height = "100%", t.cursor = "row-resize", this.uv.appendChild(e);
		let n = document.createElement("div"), r = n.style;
		r.position = "absolute", r.zIndex = "50", r.top = "-4px", r.height = "9px", r.width = "100%", r.backgroundColor = "", r.cursor = "row-resize", this.uv.appendChild(n);
		let i = {
			bp: this.gv.bind(this),
			Zp: this.bv.bind(this),
			Fp: this.Sv.bind(this),
			Op: this.Sv.bind(this),
			Dp: this.xv.bind(this),
			Tp: this.xv.bind(this),
			Ep: this.Cv.bind(this),
			Vp: this.Cv.bind(this)
		};
		this.sv = new Ln(n, i, {
			Pp: () => !1,
			kp: () => !0
		}), this.nv = {
			Mv: n,
			wv: e
		};
	}
	cv() {
		this.uv.style.background = this.hv.N().layout.panes.separatorColor;
	}
	gv(e) {
		this.nv !== null && (this.nv.Mv.style.backgroundColor = this.hv.N().layout.panes.separatorHoverColor);
	}
	bv(e) {
		this.nv !== null && this.rv === null && (this.nv.Mv.style.backgroundColor = "");
	}
	Sv(e) {
		if (this.nv === null) return;
		let t = this.av.yv().F_() + this.ov.yv().F_(), n = t / (this.av.pv().height + this.ov.pv().height), r = 30 * n;
		t <= 2 * r || (this.rv = {
			Pv: e.pageY,
			kv: this.av.yv().F_(),
			Tv: t - r,
			Rv: t,
			Dv: n,
			Iv: r
		}, this.nv.wv.style.display = "block");
	}
	xv(e) {
		let t = this.rv;
		if (t === null) return;
		let n = (e.pageY - t.Pv) * t.Dv, r = xt(t.kv + n, t.Iv, t.Tv);
		this.av.yv().W_(r), this.ov.yv().W_(t.Rv - r), this.hv.Qt().ka();
	}
	Cv(e) {
		this.rv !== null && this.nv !== null && (this.rv = null, this.nv.wv.style.display = "none");
	}
};
function Wn(e, t) {
	return e.Vv - t.Vv;
}
function Gn(e, t, n) {
	let r = (e.Vv - t.Vv) / (e.wt - t.wt);
	return Math.sign(r) * Math.min(Math.abs(r), n);
}
var Kn = class {
	constructor(e, t, n, r) {
		this.Bv = null, this.Ev = null, this.Av = null, this.Lv = null, this.zv = null, this.Ov = 0, this.Nv = 0, this.Fv = e, this.Wv = t, this.Hv = n, this.Ps = r;
	}
	Uv(e, t) {
		if (this.Bv !== null) {
			if (this.Bv.wt === t) return void (this.Bv.Vv = e);
			if (Math.abs(this.Bv.Vv - e) < this.Ps) return;
		}
		this.Lv = this.Av, this.Av = this.Ev, this.Ev = this.Bv, this.Bv = {
			wt: t,
			Vv: e
		};
	}
	me(e, t) {
		if (this.Bv === null || this.Ev === null || t - this.Bv.wt > 50) return;
		let n = 0, r = Gn(this.Bv, this.Ev, this.Wv), i = Wn(this.Bv, this.Ev), a = [r], o = [i];
		if (n += i, this.Av !== null) {
			let e = Gn(this.Ev, this.Av, this.Wv);
			if (Math.sign(e) === Math.sign(r)) {
				let t = Wn(this.Ev, this.Av);
				if (a.push(e), o.push(t), n += t, this.Lv !== null) {
					let e = Gn(this.Av, this.Lv, this.Wv);
					if (Math.sign(e) === Math.sign(r)) {
						let t = Wn(this.Av, this.Lv);
						a.push(e), o.push(t), n += t;
					}
				}
			}
		}
		let s = 0;
		for (let e = 0; e < a.length; ++e) s += o[e] / n * a[e];
		Math.abs(s) < this.Fv || (this.zv = {
			Vv: e,
			wt: t
		}, this.Nv = s, this.Ov = function(e, t) {
			let n = Math.log(t);
			return Math.log(1 * n / -e) / n;
		}(Math.abs(s), this.Hv));
	}
	Gc(e) {
		let t = E(this.zv), n = e - t.wt;
		return t.Vv + this.Nv * (this.Hv ** +n - 1) / Math.log(this.Hv);
	}
	Kc(e) {
		return this.zv === null || this.$v(e) === this.Ov;
	}
	$v(e) {
		let t = e - E(this.zv).wt;
		return Math.min(t, this.Ov);
	}
}, qn = class {
	constructor(e, t) {
		this.jv = void 0, this.qv = void 0, this.Yv = void 0, this.vn = !1, this.Kv = e, this.Gv = t, this.Zv();
	}
	Pt() {
		this.Zv();
	}
	Xv() {
		this.jv && this.Kv.removeChild(this.jv), this.qv && this.Kv.removeChild(this.qv), this.jv = void 0, this.qv = void 0;
	}
	Jv() {
		return this.vn !== this.Qv() || this.Yv !== this.tm();
	}
	tm() {
		return this.Gv.Qt().Xi().J(this.Gv.N().layout.textColor) > 160 ? "dark" : "light";
	}
	Qv() {
		return this.Gv.N().layout.attributionLogo;
	}
	im() {
		let e = new URL(location.href);
		return e.hostname ? "&utm_source=" + e.hostname + e.pathname : "";
	}
	Zv() {
		this.Jv() && (this.Xv(), this.vn = this.Qv(), this.vn && (this.Yv = this.tm(), this.qv = document.createElement("style"), this.qv.innerText = "a#tv-attr-logo{--fill:#131722;--stroke:#fff;position:absolute;left:10px;bottom:10px;height:19px;width:35px;margin:0;padding:0;border:0;z-index:3;}a#tv-attr-logo[data-dark]{--fill:#D1D4DC;--stroke:#131722;}", this.jv = document.createElement("a"), this.jv.href = `https://www.tradingview.com/?utm_medium=lwc-link&utm_campaign=lwc-chart${this.im()}`, this.jv.title = "Charting by TradingView", this.jv.id = "tv-attr-logo", this.jv.target = "_blank", this.jv.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"35\" height=\"19\" fill=\"none\"><g fill-rule=\"evenodd\" clip-path=\"url(#a)\" clip-rule=\"evenodd\"><path fill=\"var(--stroke)\" d=\"M2 0H0v10h6v9h21.4l.5-1.3 6-15 1-2.7H23.7l-.5 1.3-.2.6a5 5 0 0 0-7-.9V0H2Zm20 17h4l5.2-13 .8-2h-7l-1 2.5-.2.5-1.5 3.8-.3.7V17Zm-.8-10a3 3 0 0 0 .7-2.7A3 3 0 1 0 16.8 7h4.4ZM14 7V2H2v6h6v9h4V7h2Z\"/><path fill=\"var(--fill)\" d=\"M14 2H2v6h6v9h6V2Zm12 15h-7l6-15h7l-6 15Zm-7-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z\"/></g><defs><clipPath id=\"a\"><path fill=\"var(--stroke)\" d=\"M0 0h35v19H0z\"/></clipPath></defs></svg>", this.jv.toggleAttribute("data-dark", this.Yv === "dark"), this.Kv.appendChild(this.qv), this.Kv.appendChild(this.jv)));
	}
};
function Jn(e, t) {
	let n = E(e.ownerDocument).createElement("canvas");
	e.appendChild(n);
	let r = p(n, {
		type: "device-pixel-content-box",
		options: { allowResizeObserver: !0 },
		transform: (e, t) => ({
			width: Math.max(e.width, t.width),
			height: Math.max(e.height, t.height)
		})
	});
	return r.resizeCanvasElement(t), r;
}
function Yn(e) {
	e.width = 1, e.height = 1, e.getContext("2d")?.clearRect(0, 0, 1, 1);
}
function Xn(e, t, n, r) {
	e.qh && e.qh(t, n, r);
}
function Zn(e, t, n, r) {
	e.st(t, n, r);
}
function Qn(e, t, n, r) {
	$n(e(n, r), t, r);
}
function $n(e, t, n) {
	for (let r of e) {
		let e = r.Tt(n);
		e !== null && t(e);
	}
}
function er(e, t) {
	return (n) => function(e) {
		return e.Ft !== void 0;
	}(n) && (n.Ft()?.pl() ?? "") === t ? n.Qa?.(e) ?? [] : [];
}
function tr(e, t, n, r) {
	if (!e.length) return;
	let i = 0, a = e[0].$t(r, !0), o = t === 1 ? n / 2 - (e[0].Hi() - a / 2) : e[0].Hi() - a / 2 - n / 2;
	o = Math.max(0, o);
	for (let a = 1; a < e.length; a++) {
		let s = e[a], c = e[a - 1], l = c.$t(r, !1), u = s.Hi(), d = c.Hi();
		if (t === 1 ? u > d - l : u < d + l) {
			let r = d - l * t;
			s.Ui(r);
			let a = r - t * l / 2;
			if ((t === 1 ? a < 0 : a > n) && o > 0) {
				let r = t === 1 ? -1 - a : a - n, s = Math.min(r, o);
				for (let n = i; n < e.length; n++) e[n].Ui(e[n].Hi() + t * s);
				o -= s;
			}
		} else i = a, o = t === 1 ? d - l - u : u - (d + l);
	}
}
var nr = class {
	constructor(e, t, n, r) {
		this.Ki = null, this.nm = null, this.sm = !1, this.rm = new De(200), this.hm = null, this.am = 0, this.lm = !1, this.om = () => {
			this.lm || this.yt._m().Qt().mr();
		}, this.um = () => {
			this.lm || this.yt._m().Qt().mr();
		}, this.yt = e, this.yn = t, this.Ro = t.layout, this.bd = n, this.dm = r === "left", this.fm = er("normal", r), this.pm = er("top", r), this.vm = er("bottom", r), this.uv = document.createElement("div"), this.uv.style.height = "100%", this.uv.style.overflow = "hidden", this.uv.style.width = "25px", this.uv.style.left = "0", this.uv.style.position = "relative", this.wm = Jn(this.uv, c({
			width: 16,
			height: 16
		})), this.wm.subscribeSuggestedBitmapSizeChanged(this.om);
		let i = this.wm.canvasElement;
		i.style.position = "absolute", i.style.zIndex = "1", i.style.left = "0", i.style.top = "0", this.Mm = Jn(this.uv, c({
			width: 16,
			height: 16
		})), this.Mm.subscribeSuggestedBitmapSizeChanged(this.um);
		let a = this.Mm.canvasElement;
		a.style.position = "absolute", a.style.zIndex = "2", a.style.left = "0", a.style.top = "0";
		let o = {
			Fp: this.Sv.bind(this),
			Op: this.Sv.bind(this),
			Dp: this.xv.bind(this),
			Tp: this.xv.bind(this),
			Wp: this.gm.bind(this),
			Ep: this.Cv.bind(this),
			Vp: this.Cv.bind(this),
			fp: this.bm.bind(this),
			_p: this.bm.bind(this),
			bp: this.Sm.bind(this),
			Zp: this.bv.bind(this)
		};
		this.sv = new Ln(this.Mm.canvasElement, o, {
			Pp: () => !this.yn.handleScroll.vertTouchDrag,
			kp: () => !0
		});
	}
	m() {
		this.sv.m(), this.Mm.unsubscribeSuggestedBitmapSizeChanged(this.um), Yn(this.Mm.canvasElement), this.Mm.dispose(), this.wm.unsubscribeSuggestedBitmapSizeChanged(this.om), Yn(this.wm.canvasElement), this.wm.dispose(), this.Ki !== null && this.Ki.__().u(this), this.Ki = null;
	}
	fv() {
		return this.uv;
	}
	P() {
		return this.Ro.fontSize;
	}
	xm() {
		let e = this.bd.N();
		return this.hm !== e.k && (this.rm.Os(), this.hm = e.k), e;
	}
	Cm() {
		if (this.Ki === null) return 0;
		let e = 0, t = this.xm(), n = E(this.wm.canvasElement.getContext("2d", { colorSpace: this.yt._m().N().layout.colorSpace }));
		n.save();
		let r = this.Ki.zl();
		n.font = this.ym(), r.length > 0 && (e = Math.max(this.rm.Ii(n, r[0].eo), this.rm.Ii(n, r[r.length - 1].eo)));
		let i = this.Pm();
		for (let t = i.length; t--;) {
			let r = this.rm.Ii(n, i[t].ri());
			r > e && (e = r);
		}
		let a = this.Ki.Lt();
		if (a !== null && this.nm !== null && (o = this.yn.crosshair).mode !== 2 && o.horzLine.visible && o.horzLine.labelVisible) {
			let t = this.Ki.Tn(1, a), r = this.Ki.Tn(this.nm.height - 2, a);
			e = Math.max(e, this.rm.Ii(n, this.Ki.Ji(Math.floor(Math.min(t, r)) + .11111111111111, a)), this.rm.Ii(n, this.Ki.Ji(Math.ceil(Math.max(t, r)) - .11111111111111, a)));
		}
		var o;
		n.restore();
		let s = e || 34;
		return Fn(Math.ceil(t.S + t.C + t.V + t.B + 5 + s));
	}
	km(e) {
		this.nm !== null && l(this.nm, e) || (this.nm = e, this.lm = !0, this.wm.resizeCanvasElement(e), this.Mm.resizeCanvasElement(e), this.lm = !1, this.uv.style.width = `${e.width}px`, this.uv.style.height = `${e.height}px`);
	}
	Tm() {
		return E(this.nm).width;
	}
	un(e) {
		this.Ki !== e && (this.Ki !== null && this.Ki.__().u(this), this.Ki = e, e.__().i(this.wo.bind(this), this));
	}
	Ft() {
		return this.Ki;
	}
	Os() {
		let e = this.yt.yv();
		this.yt._m().Qt().au(e, E(this.Ft()));
	}
	Rm(e) {
		if (this.nm === null) return;
		let t = { colorSpace: this.yt._m().N().layout.colorSpace };
		if (e !== 1) {
			this.Dm(), this.wm.applySuggestedBitmapSize();
			let e = v(this.wm, t);
			e !== null && (e.useBitmapCoordinateSpace(((e) => {
				this.Im(e), this.Vm(e);
			})), this.yt.Bm(e, this.vm), this.Em(e), this.yt.Bm(e, this.fm), this.Am(e));
		}
		this.Mm.applySuggestedBitmapSize();
		let n = v(this.Mm, t);
		n !== null && (n.useBitmapCoordinateSpace((({ context: e, bitmapSize: t }) => {
			e.clearRect(0, 0, t.width, t.height);
		})), this.Lm(n), this.yt.Bm(n, this.pm));
	}
	vv() {
		return this.wm.bitmapSize;
	}
	mv(e, t, n, r) {
		let i = this.vv();
		if (i.width > 0 && i.height > 0 && (e.drawImage(this.wm.canvasElement, t, n), r)) {
			let r = this.Mm.canvasElement;
			e.drawImage(r, t, n);
		}
	}
	Pt() {
		this.Ki?.zl();
	}
	Sv(e) {
		if (this.Ki === null || this.Ki.Zi() || !this.yn.handleScale.axisPressedMouseMove.price) return;
		let t = this.yt._m().Qt(), n = this.yt.yv();
		this.sm = !0, t.Q_(n, this.Ki, e.localY);
	}
	xv(e) {
		if (this.Ki === null || !this.yn.handleScale.axisPressedMouseMove.price) return;
		let t = this.yt._m().Qt(), n = this.yt.yv(), r = this.Ki;
		t.tu(n, r, e.localY);
	}
	gm() {
		if (this.Ki === null || !this.yn.handleScale.axisPressedMouseMove.price) return;
		let e = this.yt._m().Qt(), t = this.yt.yv(), n = this.Ki;
		this.sm && (this.sm = !1, e.iu(t, n));
	}
	Cv(e) {
		if (this.Ki === null || !this.yn.handleScale.axisPressedMouseMove.price) return;
		let t = this.yt._m().Qt(), n = this.yt.yv();
		this.sm = !1, t.iu(n, this.Ki);
	}
	bm(e) {
		this.yn.handleScale.axisDoubleClickReset.price && this.Os();
	}
	Sm(e) {
		this.Ki !== null && (!this.yt._m().Qt().N().handleScale.axisPressedMouseMove.price || this.Ki.je() || this.Ki.No() || this.zm(1));
	}
	bv(e) {
		this.zm(0);
	}
	Pm() {
		let e = [], t = this.Ki === null ? void 0 : this.Ki;
		return ((n) => {
			for (let r = 0; r < n.length; ++r) {
				let i = n[r].qn(this.yt.yv(), t);
				for (let t = 0; t < i.length; t++) e.push(i[t]);
			}
		})(this.yt.yv().Dt()), e;
	}
	Im({ context: e, bitmapSize: t }) {
		let { width: n, height: r } = t, i = this.yt.yv().Qt(), a = i.$(), o = i.af();
		a === o ? ce(e, 0, 0, n, r, a) : ue(e, 0, 0, n, r, a, o);
	}
	Vm({ context: e, bitmapSize: t, horizontalPixelRatio: n }) {
		if (this.nm === null || this.Ki === null || !this.Ki.N().borderVisible) return;
		e.fillStyle = this.Ki.N().borderColor;
		let r = Math.max(1, Math.floor(this.xm().S * n)), i;
		i = this.dm ? t.width - r : 0, e.fillRect(i, 0, r, t.height);
	}
	Em(e) {
		if (this.nm === null || this.Ki === null) return;
		let t = this.Ki.zl(), n = this.Ki.N(), r = this.xm(), i = this.dm ? this.nm.width - r.C : 0;
		n.borderVisible && n.ticksVisible && e.useBitmapCoordinateSpace((({ context: e, horizontalPixelRatio: a, verticalPixelRatio: o }) => {
			e.fillStyle = n.borderColor;
			let s = Math.max(1, Math.floor(o)), c = Math.floor(.5 * o), l = Math.round(r.C * a);
			e.beginPath();
			for (let n of t) e.rect(Math.floor(i * a), Math.round(n.Vl * o) - c, l, s);
			e.fill();
		})), e.useMediaCoordinateSpace((({ context: e }) => {
			e.font = this.ym(), e.fillStyle = n.textColor ?? this.Ro.textColor, e.textAlign = this.dm ? "right" : "left", e.textBaseline = "middle";
			let a = this.dm ? Math.round(i - r.V) : Math.round(i + r.C + r.V), o = t.map(((t) => this.rm.Di(e, t.eo)));
			for (let n = t.length; n--;) {
				let r = t[n];
				e.fillText(r.eo, a, r.Vl + o[n]);
			}
		}));
	}
	Dm() {
		if (this.nm === null || this.Ki === null) return;
		let e = this.nm.height / 2, t = [], n = this.Ki.Dt().slice(), r = this.yt.yv(), i = this.xm();
		this.Ki === r.Zs() && this.yt.yv().Dt().forEach(((e) => {
			r.Gs(e) && n.push(e);
		}));
		let a = this.Ki.kl()[0], o = this.Ki;
		n.forEach(((n) => {
			let i = n.qn(r, o);
			i.forEach(((e) => {
				e.$i() && e.Wi() === null && (e.Ui(null), t.push(e));
			})), a === n && i.length > 0 && (e = i[0].Ei());
		})), this.Ki.N().alignLabels && this.Om(t, i, e);
	}
	Om(e, t, n) {
		if (this.nm === null) return;
		let r = e.filter(((e) => e.Ei() <= n)), i = e.filter(((e) => e.Ei() > n));
		r.sort(((e, t) => t.Ei() - e.Ei())), r.length && i.length && i.push(r[0]), i.sort(((e, t) => e.Ei() - t.Ei()));
		for (let n of e) {
			let e = Math.floor(n.$t(t) / 2), r = n.Ei();
			r > -e && r < e && n.Ui(e), r > this.nm.height - e && r < this.nm.height + e && n.Ui(this.nm.height - e);
		}
		tr(r, 1, this.nm.height, t), tr(i, -1, this.nm.height, t);
	}
	Am(e) {
		if (this.nm === null) return;
		let t = this.Pm(), n = this.xm(), r = this.dm ? "right" : "left";
		t.forEach(((t) => {
			t.ji() && t.Tt(E(this.Ki)).st(e, n, this.rm, r);
		}));
	}
	Lm(e) {
		if (this.nm === null || this.Ki === null) return;
		let t = this.yt._m().Qt(), n = [], r = this.yt.yv(), i = t.Vd().qn(r, this.Ki);
		i.length && n.push(i);
		let a = this.xm(), o = this.dm ? "right" : "left";
		n.forEach(((t) => {
			t.forEach(((t) => {
				t.Tt(E(this.Ki)).st(e, a, this.rm, o);
			}));
		}));
	}
	zm(e) {
		this.uv.style.cursor = e === 1 ? "ns-resize" : "default";
	}
	wo() {
		let e = this.Cm();
		this.am < e && this.yt._m().Qt().ka(), this.am = e;
	}
	ym() {
		return F(this.Ro.fontSize, this.Ro.fontFamily);
	}
};
function rr(e, t) {
	return e.Xa?.(t) ?? [];
}
function ir(e, t) {
	return e.jn?.(t) ?? [];
}
function ar(e, t) {
	return e.cn?.(t) ?? [];
}
function or(e, t) {
	return e.qa?.(t) ?? [];
}
var sr = class e {
	constructor(e, t) {
		this.nm = c({
			width: 0,
			height: 0
		}), this.Nm = null, this.Fm = null, this.Wm = null, this.Hm = null, this.Um = !1, this.$m = new O(), this.jm = new O(), this.qm = 0, this.Ym = !1, this.Km = null, this.Gm = !1, this.Zm = null, this.Xm = null, this.lm = !1, this.om = () => {
			this.lm || this.Jm === null || this.sn().mr();
		}, this.um = () => {
			this.lm || this.Jm === null || this.sn().mr();
		}, this.Gv = e, this.Jm = t, this.Jm.mu().i(this.Qm.bind(this), this, !0), this.tw = document.createElement("td"), this.tw.style.padding = "0", this.tw.style.position = "relative";
		let n = document.createElement("div");
		n.style.width = "100%", n.style.height = "100%", n.style.position = "relative", n.style.overflow = "hidden", this.iw = document.createElement("td"), this.iw.style.padding = "0", this.nw = document.createElement("td"), this.nw.style.padding = "0", this.tw.appendChild(n), this.wm = Jn(n, c({
			width: 16,
			height: 16
		})), this.wm.subscribeSuggestedBitmapSizeChanged(this.om);
		let r = this.wm.canvasElement;
		r.style.position = "absolute", r.style.zIndex = "1", r.style.left = "0", r.style.top = "0", this.Mm = Jn(n, c({
			width: 16,
			height: 16
		})), this.Mm.subscribeSuggestedBitmapSizeChanged(this.um);
		let i = this.Mm.canvasElement;
		i.style.position = "absolute", i.style.zIndex = "2", i.style.left = "0", i.style.top = "0", this._v = document.createElement("tr"), this._v.appendChild(this.iw), this._v.appendChild(this.tw), this._v.appendChild(this.nw), this.sw(), this.sv = new Ln(this.Mm.canvasElement, this, {
			Pp: () => this.Km === null && !this.Gv.N().handleScroll.vertTouchDrag,
			kp: () => this.Km === null && !this.Gv.N().handleScroll.horzTouchDrag
		});
	}
	m() {
		this.Nm !== null && this.Nm.m(), this.Fm !== null && this.Fm.m(), this.Wm = null, this.Mm.unsubscribeSuggestedBitmapSizeChanged(this.um), Yn(this.Mm.canvasElement), this.Mm.dispose(), this.wm.unsubscribeSuggestedBitmapSizeChanged(this.om), Yn(this.wm.canvasElement), this.wm.dispose(), this.Jm !== null && (this.Jm.mu().u(this), this.Jm.m()), this.sv.m();
	}
	yv() {
		return E(this.Jm);
	}
	ew(t) {
		this.Jm !== null && this.Jm.mu().u(this), this.Jm = t, this.Jm !== null && this.Jm.mu().i(e.prototype.Qm.bind(this), this, !0), this.sw(), this.Gv.lv().indexOf(this) === this.Gv.lv().length - 1 ? (this.Wm = this.Wm ?? new qn(this.tw, this.Gv), this.Wm.Pt()) : (this.Wm?.Xv(), this.Wm = null);
	}
	_m() {
		return this.Gv;
	}
	fv() {
		return this._v;
	}
	sw() {
		if (this.Jm !== null && (this.rw(), this.sn().Jn().length !== 0)) {
			if (this.Nm !== null) {
				let e = this.Jm.X_();
				this.Nm.un(E(e));
			}
			if (this.Fm !== null) {
				let e = this.Jm.J_();
				this.Fm.un(E(e));
			}
		}
	}
	hw() {
		this.Nm !== null && this.Nm.Pt(), this.Fm !== null && this.Fm.Pt();
	}
	F_() {
		return this.Jm === null ? 0 : this.Jm.F_();
	}
	W_(e) {
		this.Jm && this.Jm.W_(e);
	}
	bp(e) {
		if (!this.Jm) return;
		this.aw();
		let t = e.localX, n = e.localY;
		this.lw(t, n, e);
	}
	Fp(e) {
		this.aw(), this.ow(), this.lw(e.localX, e.localY, e);
	}
	Sp(e) {
		if (!this.Jm) return;
		this.aw();
		let t = e.localX, n = e.localY;
		this.lw(t, n, e);
	}
	Ap(e) {
		this.Jm !== null && (this.aw(), this.lw(e.localX, e.localY, e), this._w(e));
	}
	fp(e) {
		this.Jm !== null && this.uw(this.jm, e);
	}
	_p(e) {
		this.fp(e);
	}
	Dp(e) {
		this.aw(), this.cw(e), this.lw(e.localX, e.localY, e);
	}
	Ep(e) {
		this.Jm !== null && (this.aw(), this.Ym = !1, this.dw(e));
	}
	Bp(e) {
		this.Jm !== null && this._w(e);
	}
	Xp(e) {
		if (this.Ym = !0, this.Km === null) {
			let t = {
				x: e.localX,
				y: e.localY
			};
			this.fw(t, t, e);
		}
	}
	Zp(e) {
		this.Jm !== null && (this.aw(), this.Jm.Qt().Rd(null), this.pw());
	}
	mw() {
		return this.$m;
	}
	ww() {
		return this.jm;
	}
	$p() {
		this.qm = 1, this.sn().cs();
	}
	jp(e, t) {
		if (!this.Gv.N().handleScale.pinch) return;
		let n = 5 * (t - this.qm);
		this.qm = t, this.sn().Wd(e._t, n);
	}
	Op(e) {
		this.Ym = !1, this.Gm = this.Km !== null, this.ow();
		let t = this.sn().Vd();
		this.Km !== null && t.It() && (this.Zm = {
			x: t.ni(),
			y: t.si()
		}, this.Km = {
			x: e.localX,
			y: e.localY
		});
	}
	Tp(e) {
		if (this.Jm === null) return;
		let t = e.localX, n = e.localY;
		if (this.Km === null) this.cw(e);
		else {
			this.Gm = !1;
			let r = E(this.Zm), i = r.x + (t - this.Km.x), a = r.y + (n - this.Km.y);
			this.lw(i, a, e);
		}
	}
	Vp(e) {
		this._m().N().trackingMode.exitMode === 0 && (this.Gm = !0), this.Mw(), this.dw(e);
	}
	Qs(e, t) {
		let n = this.Jm;
		return n === null ? null : Zt(n, e, t);
	}
	gw(e, t) {
		E(t === "left" ? this.Nm : this.Fm).km(c({
			width: e,
			height: this.nm.height
		}));
	}
	pv() {
		return this.nm;
	}
	km(e) {
		l(this.nm, e) || (this.nm = e, this.lm = !0, this.wm.resizeCanvasElement(e), this.Mm.resizeCanvasElement(e), this.lm = !1, this.tw.style.width = e.width + "px", this.tw.style.height = e.height + "px");
	}
	bw() {
		let e = E(this.Jm);
		e.G_(e.X_()), e.G_(e.J_());
		for (let t of e.kl()) if (e.Gs(t)) {
			let n = t.Ft();
			n !== null && e.G_(n), t.Nn();
		}
		for (let t of e.Mu()) t.Nn();
	}
	vv() {
		return this.wm.bitmapSize;
	}
	mv(e, t, n, r) {
		let i = this.vv();
		if (i.width > 0 && i.height > 0 && (e.drawImage(this.wm.canvasElement, t, n), r)) {
			let r = this.Mm.canvasElement;
			e !== null && e.drawImage(r, t, n);
		}
	}
	Rm(e) {
		if (e === 0 || this.Jm === null) return;
		e > 1 && this.bw(), this.Nm !== null && this.Nm.Rm(e), this.Fm !== null && this.Fm.Rm(e);
		let t = { colorSpace: this.Gv.N().layout.colorSpace };
		if (e !== 1) {
			this.wm.applySuggestedBitmapSize();
			let e = v(this.wm, t);
			e !== null && (e.useBitmapCoordinateSpace(((e) => {
				this.Im(e);
			})), this.Jm && (this.Sw(e, rr), this.xw(e), this.Sw(e, ir), this.Sw(e, ar)));
		}
		this.Mm.applySuggestedBitmapSize();
		let n = v(this.Mm, t);
		n !== null && (n.useBitmapCoordinateSpace((({ context: e, bitmapSize: t }) => {
			e.clearRect(0, 0, t.width, t.height);
		})), this.Cw(n), this.Sw(n, or), this.Sw(n, ar));
	}
	yw() {
		return this.Nm;
	}
	Pw() {
		return this.Fm;
	}
	Bm(e, t) {
		this.Sw(e, t);
	}
	Qm() {
		this.Jm !== null && this.Jm.mu().u(this), this.Jm = null;
	}
	_w(e) {
		this.uw(this.$m, e);
	}
	uw(e, t) {
		let n = t.localX, r = t.localY;
		e.v() && e.p(this.sn().Et().Vc(n), {
			x: n,
			y: r
		}, t);
	}
	Im({ context: e, bitmapSize: t }) {
		let { width: n, height: r } = t, i = this.sn(), a = i.$(), o = i.af();
		a === o ? ce(e, 0, 0, n, r, o) : ue(e, 0, 0, n, r, a, o);
	}
	xw(e) {
		let t = E(this.Jm), n = t.wu().wr().Tt(t);
		n !== null && n.st(e, !1);
	}
	Cw(e) {
		this.kw(e, ir, Zn, this.sn().Vd());
	}
	Sw(e, t) {
		let n = E(this.Jm), r = t === ir ? this.Tw() : null, i = r === null ? null : this.Rw(r, n), a = n.Mu();
		if (i === null || r === null) {
			let r = n._u();
			this.Dw(e, t, Xn, a, r), this.Dw(e, t, Zn, a, r);
			return;
		}
		let o = n.Dt(), s = (e) => e === r ? i.Za : void 0;
		this.Dw(e, t, Xn, a, o, s), this.Dw(e, t, Zn, a, o, s), this.kw(e, t, Xn, r, i.qa), this.kw(e, t, Zn, r, i.qa);
	}
	Dw(e, t, n, r, i, a) {
		for (let i of r) this.kw(e, t, n, i);
		if (a !== void 0) for (let r of i) this.kw(e, t, n, r, a(r));
		else for (let r of i) this.kw(e, t, n, r);
	}
	Tw() {
		let e = E(this.Jm), t = e.Qt().cu()?.uu;
		if (!e.Qt().N().hoveredSeriesOnTop || t === void 0) return null;
		for (let n of e.Dt()) if (n === t) return n;
		return null;
	}
	Rw(e, t) {
		let n = e.Ga?.(t) ?? null;
		return n === null || n.qa.length === 0 ? null : n;
	}
	kw(e, t, n, r, i) {
		let a = E(this.Jm), o = a.Qt().cu(), s = o !== null && o.uu === r, c = o !== null && s && o.bu !== void 0 ? o.bu.ie : void 0, l = (t) => n(t, e, s, c);
		i === void 0 ? Qn(t, l, r, a) : $n(i, l, a);
	}
	rw() {
		if (this.Jm === null) return;
		let e = this.Gv, t = this.Jm.X_().N().visible, n = this.Jm.J_().N().visible;
		t || this.Nm === null || (this.iw.removeChild(this.Nm.fv()), this.Nm.m(), this.Nm = null), n || this.Fm === null || (this.nw.removeChild(this.Fm.fv()), this.Fm.m(), this.Fm = null);
		let r = e.Qt().Jd();
		t && this.Nm === null && (this.Nm = new nr(this, e.N(), r, "left"), this.iw.appendChild(this.Nm.fv())), n && this.Fm === null && (this.Fm = new nr(this, e.N(), r, "right"), this.nw.appendChild(this.Fm.fv()));
	}
	Iw(e) {
		return e.Jp && this.Ym || this.Km !== null;
	}
	lw(e, t, n) {
		e = Math.max(0, Math.min(e, this.nm.width - 1)), t = Math.max(0, Math.min(t, this.nm.height - 1)), this.sn().Kd(e, t, n, E(this.Jm));
	}
	pw() {
		this.sn().Zd();
	}
	Mw() {
		this.Gm && (this.Km = null, this.pw());
	}
	fw(e, t, n) {
		this.Km = e, this.Gm = !1, this.lw(t.x, t.y, n);
		let r = this.sn().Vd();
		this.Zm = {
			x: r.ni(),
			y: r.si()
		};
	}
	sn() {
		return this.Gv.Qt();
	}
	dw(e) {
		if (!this.Um) return;
		let t = this.sn(), n = this.yv();
		if (t.eu(n, n.kn()), this.Hm = null, this.Um = !1, t.jd(), this.Xm !== null) {
			let e = performance.now(), n = t.Et();
			this.Xm.me(n.Oc(), e), this.Xm.Kc(e) || t.ps(this.Xm);
		}
	}
	aw() {
		this.Km = null;
	}
	ow() {
		if (this.Jm) {
			if (this.sn().cs(), document.activeElement !== document.body && document.activeElement !== document.documentElement) E(document.activeElement).blur();
			else {
				let e = document.getSelection();
				e !== null && e.removeAllRanges();
			}
			!this.Jm.kn().Zi() && this.sn().Et().Zi();
		}
	}
	cw(e) {
		if (this.Jm === null) return;
		let t = this.sn(), n = t.Et();
		if (n.Zi()) return;
		let r = this.Gv.N(), i = r.handleScroll, a = r.kineticScroll;
		if ((!i.pressedMouseMove || e.Jp) && (!i.horzTouchDrag && !i.vertTouchDrag || !e.Jp)) return;
		let o = this.Jm.kn(), s = performance.now();
		if (this.Hm !== null || this.Iw(e) || (this.Hm = {
			x: e.clientX,
			y: e.clientY,
			yf: s,
			Vw: e.localX,
			Bw: e.localY
		}), this.Hm !== null && !this.Um && (this.Hm.x !== e.clientX || this.Hm.y !== e.clientY)) {
			if (e.Jp && a.touch || !e.Jp && a.mouse) {
				let e = n.ml();
				this.Xm = new Kn(.2 / e, 7 / e, .997, 15 / e), this.Xm.Uv(n.Oc(), this.Hm.yf);
			} else this.Xm = null;
			o.Zi() || t.nu(this.Jm, o, e.localY), t.Ud(e.localX), this.Um = !0;
		}
		this.Um && (o.Zi() || t.su(this.Jm, o, e.localY), t.$d(e.localX), this.Xm !== null && this.Xm.Uv(n.Oc(), s));
	}
}, cr = class {
	constructor(e, t, n, r, i) {
		this.xt = !0, this.nm = c({
			width: 0,
			height: 0
		}), this.om = () => this.Rm(3), this.dm = e === "left", this.bd = n.Jd, this.yn = t, this.Ew = r, this.Aw = i, this.uv = document.createElement("div"), this.uv.style.width = "25px", this.uv.style.height = "100%", this.uv.style.overflow = "hidden", this.wm = Jn(this.uv, c({
			width: 16,
			height: 16
		})), this.wm.subscribeSuggestedBitmapSizeChanged(this.om);
	}
	m() {
		this.wm.unsubscribeSuggestedBitmapSizeChanged(this.om), Yn(this.wm.canvasElement), this.wm.dispose();
	}
	fv() {
		return this.uv;
	}
	pv() {
		return this.nm;
	}
	km(e) {
		l(this.nm, e) || (this.nm = e, this.wm.resizeCanvasElement(e), this.uv.style.width = `${e.width}px`, this.uv.style.height = `${e.height}px`, this.xt = !0);
	}
	Rm(e) {
		if (e < 3 && !this.xt || this.nm.width === 0 || this.nm.height === 0) return;
		this.xt = !1, this.wm.applySuggestedBitmapSize();
		let t = v(this.wm, { colorSpace: this.yn.layout.colorSpace });
		t !== null && t.useBitmapCoordinateSpace(((e) => {
			this.Im(e), this.Vm(e);
		}));
	}
	vv() {
		return this.wm.bitmapSize;
	}
	mv(e, t, n) {
		let r = this.vv();
		r.width > 0 && r.height > 0 && e.drawImage(this.wm.canvasElement, t, n);
	}
	Vm({ context: e, bitmapSize: t, horizontalPixelRatio: n, verticalPixelRatio: r }) {
		if (!this.Ew()) return;
		e.fillStyle = this.yn.timeScale.borderColor;
		let i = Math.floor(this.bd.N().S * n), a = Math.floor(this.bd.N().S * r), o = this.dm ? t.width - i : 0;
		e.fillRect(o, 0, i, a);
	}
	Im({ context: e, bitmapSize: t }) {
		ce(e, 0, 0, t.width, t.height, this.Aw());
	}
};
function lr(e) {
	return (t) => t.tl?.(e) ?? [];
}
var ur = lr("normal"), dr = lr("top"), fr = lr("bottom"), pr = class {
	constructor(e, t) {
		this.Lw = null, this.zw = null, this.M = null, this.Ow = !1, this.nm = c({
			width: 0,
			height: 0
		}), this.Nw = new O(), this.rm = new De(5), this.lm = !1, this.om = () => {
			this.lm || this.Gv.Qt().mr();
		}, this.um = () => {
			this.lm || this.Gv.Qt().mr();
		}, this.Gv = e, this.Pu = t, this.yn = e.N().layout, this.jv = document.createElement("tr"), this.Fw = document.createElement("td"), this.Fw.style.padding = "0", this.Ww = document.createElement("td"), this.Ww.style.padding = "0", this.uv = document.createElement("td"), this.uv.style.height = "25px", this.uv.style.padding = "0", this.Hw = document.createElement("div"), this.Hw.style.width = "100%", this.Hw.style.height = "100%", this.Hw.style.position = "relative", this.Hw.style.overflow = "hidden", this.uv.appendChild(this.Hw), this.wm = Jn(this.Hw, c({
			width: 16,
			height: 16
		})), this.wm.subscribeSuggestedBitmapSizeChanged(this.om);
		let n = this.wm.canvasElement;
		n.style.position = "absolute", n.style.zIndex = "1", n.style.left = "0", n.style.top = "0", this.Mm = Jn(this.Hw, c({
			width: 16,
			height: 16
		})), this.Mm.subscribeSuggestedBitmapSizeChanged(this.um);
		let r = this.Mm.canvasElement;
		r.style.position = "absolute", r.style.zIndex = "2", r.style.left = "0", r.style.top = "0", this.jv.appendChild(this.Fw), this.jv.appendChild(this.uv), this.jv.appendChild(this.Ww), this.Uw(), this.Gv.Qt().N_().i(this.Uw.bind(this), this), this.sv = new Ln(this.Mm.canvasElement, this, {
			Pp: () => !0,
			kp: () => !this.Gv.N().handleScroll.horzTouchDrag
		});
	}
	m() {
		this.sv.m(), this.Lw !== null && this.Lw.m(), this.zw !== null && this.zw.m(), this.Mm.unsubscribeSuggestedBitmapSizeChanged(this.um), Yn(this.Mm.canvasElement), this.Mm.dispose(), this.wm.unsubscribeSuggestedBitmapSizeChanged(this.om), Yn(this.wm.canvasElement), this.wm.dispose();
	}
	fv() {
		return this.jv;
	}
	$w() {
		return this.Lw;
	}
	jw() {
		return this.zw;
	}
	Fp(e) {
		if (this.Ow) return;
		this.Ow = !0;
		let t = this.Gv.Qt();
		!t.Et().Zi() && this.Gv.N().handleScale.axisPressedMouseMove.time && t.Fd(e.localX);
	}
	Op(e) {
		this.Fp(e);
	}
	Wp() {
		let e = this.Gv.Qt();
		!e.Et().Zi() && this.Ow && (this.Ow = !1, this.Gv.N().handleScale.axisPressedMouseMove.time && e.Yd());
	}
	Dp(e) {
		let t = this.Gv.Qt();
		!t.Et().Zi() && this.Gv.N().handleScale.axisPressedMouseMove.time && t.qd(e.localX);
	}
	Tp(e) {
		this.Dp(e);
	}
	Ep() {
		this.Ow = !1;
		let e = this.Gv.Qt();
		e.Et().Zi() && !this.Gv.N().handleScale.axisPressedMouseMove.time || e.Yd();
	}
	Vp() {
		this.Ep();
	}
	fp() {
		this.Gv.N().handleScale.axisDoubleClickReset.time && this.Gv.Qt().ws();
	}
	_p() {
		this.fp();
	}
	bp() {
		this.Gv.Qt().N().handleScale.axisPressedMouseMove.time && this.zm(1);
	}
	Zp() {
		this.zm(0);
	}
	pv() {
		return this.nm;
	}
	qw() {
		return this.Nw;
	}
	Yw(e, t, n) {
		l(this.nm, e) || (this.nm = e, this.lm = !0, this.wm.resizeCanvasElement(e), this.Mm.resizeCanvasElement(e), this.lm = !1, this.uv.style.width = `${e.width}px`, this.uv.style.height = `${e.height}px`, this.Nw.p(e)), this.Lw !== null && this.Lw.km(c({
			width: t,
			height: e.height
		})), this.zw !== null && this.zw.km(c({
			width: n,
			height: e.height
		}));
	}
	Kw() {
		let e = this.Gw();
		return Math.ceil(e.S + e.C + e.P + e.A + e.I + e.Zw);
	}
	Pt() {
		this.Gv.Qt().Et().zl();
	}
	vv() {
		return this.wm.bitmapSize;
	}
	mv(e, t, n, r) {
		let i = this.vv();
		if (i.width > 0 && i.height > 0 && (e.drawImage(this.wm.canvasElement, t, n), r)) {
			let r = this.Mm.canvasElement;
			e.drawImage(r, t, n);
		}
	}
	Rm(e) {
		if (e === 0) return;
		let t = { colorSpace: this.yn.colorSpace };
		if (e !== 1) {
			this.wm.applySuggestedBitmapSize();
			let n = v(this.wm, t);
			n !== null && (n.useBitmapCoordinateSpace(((e) => {
				this.Im(e), this.Vm(e), this.Xw(n, fr);
			})), this.Em(n), this.Xw(n, ur)), this.Lw !== null && this.Lw.Rm(e), this.zw !== null && this.zw.Rm(e);
		}
		this.Mm.applySuggestedBitmapSize();
		let n = v(this.Mm, t);
		n !== null && (n.useBitmapCoordinateSpace((({ context: e, bitmapSize: t }) => {
			e.clearRect(0, 0, t.width, t.height);
		})), this.Jw([...this.Gv.Qt().Jn(), this.Gv.Qt().Vd()], n), this.Xw(n, dr));
	}
	Xw(e, t) {
		let n = this.Gv.Qt().Jn();
		for (let r of n) Qn(t, ((t) => Xn(t, e, !1, void 0)), r, void 0);
		for (let r of n) Qn(t, ((t) => Zn(t, e, !1, void 0)), r, void 0);
	}
	Im({ context: e, bitmapSize: t }) {
		ce(e, 0, 0, t.width, t.height, this.Gv.Qt().af());
	}
	Vm({ context: e, bitmapSize: t, verticalPixelRatio: n }) {
		if (this.Gv.N().timeScale.borderVisible) {
			e.fillStyle = this.Qw();
			let r = Math.max(1, Math.floor(this.Gw().S * n));
			e.fillRect(0, 0, t.width, r);
		}
	}
	Em(e) {
		let t = this.Gv.Qt().Et(), n = t.zl();
		if (!n || n.length === 0) return;
		let r = this.Pu.maxTickMarkWeight(n), i = this.Gw(), a = t.N();
		a.borderVisible && a.ticksVisible && e.useBitmapCoordinateSpace((({ context: e, horizontalPixelRatio: t, verticalPixelRatio: r }) => {
			e.strokeStyle = this.Qw(), e.fillStyle = this.Qw();
			let a = Math.max(1, Math.floor(t)), o = Math.floor(.5 * t);
			e.beginPath();
			let s = Math.round(i.C * r);
			for (let r = n.length; r--;) {
				let i = Math.round(n[r].coord * t);
				e.rect(i - o, 0, a, s);
			}
			e.fill();
		})), e.useMediaCoordinateSpace((({ context: e }) => {
			let t = i.S + i.C + i.A + i.P / 2;
			e.textAlign = "center", e.textBaseline = "middle", e.fillStyle = this.H(), e.font = this.ym();
			for (let i of n) if (i.weight < r) {
				let n = i.needAlignCoordinate ? this.tM(e, i.coord, i.label) : i.coord;
				e.fillText(i.label, n, t);
			}
			this.Gv.N().timeScale.allowBoldLabels && (e.font = this.iM());
			for (let i of n) if (i.weight >= r) {
				let n = i.needAlignCoordinate ? this.tM(e, i.coord, i.label) : i.coord;
				e.fillText(i.label, n, t);
			}
		}));
	}
	tM(e, t, n) {
		let r = this.rm.Ii(e, n), i = r / 2, a = Math.floor(t - i) + .5;
		return a < 0 ? t += Math.abs(0 - a) : a + r > this.nm.width && (t -= Math.abs(this.nm.width - (a + r))), t;
	}
	Jw(e, t) {
		let n = this.Gw();
		for (let r of e) for (let e of r.dn()) e.Tt().st(t, n);
	}
	Qw() {
		return this.Gv.N().timeScale.borderColor;
	}
	H() {
		return this.yn.textColor;
	}
	F() {
		return this.yn.fontSize;
	}
	ym() {
		return F(this.F(), this.yn.fontFamily);
	}
	iM() {
		return F(this.F(), this.yn.fontFamily, "bold");
	}
	Gw() {
		this.M === null && (this.M = {
			S: 1,
			L: NaN,
			A: NaN,
			I: NaN,
			tn: NaN,
			C: 5,
			P: NaN,
			k: "",
			Qi: new De(),
			Zw: 0
		});
		let e = this.M, t = this.ym();
		if (e.k !== t) {
			let n = this.F();
			e.P = n, e.k = t, e.A = 3 * n / 12, e.I = 3 * n / 12, e.tn = 9 * n / 12, e.L = 0, e.Zw = 4 * n / 12, e.Qi.Os();
		}
		return this.M;
	}
	zm(e) {
		this.uv.style.cursor = e === 1 ? "ew-resize" : "default";
	}
	Uw() {
		let e = this.Gv.Qt(), t = e.N();
		t.leftPriceScale.visible || this.Lw === null || (this.Fw.removeChild(this.Lw.fv()), this.Lw.m(), this.Lw = null), t.rightPriceScale.visible || this.zw === null || (this.Ww.removeChild(this.zw.fv()), this.zw.m(), this.zw = null);
		let n = { Jd: this.Gv.Qt().Jd() }, r = () => t.leftPriceScale.borderVisible && e.Et().N().borderVisible, i = () => e.af();
		t.leftPriceScale.visible && this.Lw === null && (this.Lw = new cr("left", t, n, r, i), this.Fw.appendChild(this.Lw.fv())), t.rightPriceScale.visible && this.zw === null && (this.zw = new cr("right", t, n, r, i), this.Ww.appendChild(this.zw.fv()));
	}
}, mr = !!jn && !!navigator.userAgentData && navigator.userAgentData.brands.some(((e) => e.brand.includes("Chromium"))) && !!jn && (navigator?.userAgentData?.platform ? navigator.userAgentData.platform === "Windows" : navigator.userAgent.toLowerCase().indexOf("win") >= 0), hr = class {
	constructor(e, t, n) {
		var r;
		this.nM = [], this.sM = [], this.eM = 0, this.oo = 0, this.k_ = 0, this.rM = 0, this.hM = 0, this.aM = null, this.lM = !1, this.$m = new O(), this.jm = new O(), this.wd = new O(), this.oM = null, this._M = null, this.Kv = e, this.yn = t, this.Pu = n, this.jv = document.createElement("div"), this.jv.classList.add("tv-lightweight-charts"), this.jv.style.overflow = "hidden", this.jv.style.direction = "ltr", this.jv.style.width = "100%", this.jv.style.height = "100%", (r = this.jv).style.userSelect = "none", r.style.webkitUserSelect = "none", r.style.msUserSelect = "none", r.style.MozUserSelect = "none", r.style.webkitTapHighlightColor = "transparent", this.uM = document.createElement("table"), this.uM.setAttribute("cellspacing", "0"), this.jv.appendChild(this.uM), this.cM = this.dM.bind(this), gr(this.yn) && this.fM(!0), this.sn = new dn(this.gd.bind(this), this.yn, n), this.Qt().Bd().i(this.pM.bind(this), this), this.vM = new pr(this, this.Pu), this.uM.appendChild(this.vM.fv());
		let i = t.autoSize && this.mM(), a = this.yn.width, o = this.yn.height;
		if (i || a === 0 || o === 0) {
			let t = e.getBoundingClientRect();
			a ||= t.width, o ||= t.height;
		}
		this.wM(a, o), this.MM(), e.appendChild(this.jv), this.gM(), this.sn.Et().Jc().i(this.sn.ka.bind(this.sn), this), this.sn.N_().i(this.sn.ka.bind(this.sn), this);
	}
	Qt() {
		return this.sn;
	}
	N() {
		return this.yn;
	}
	lv() {
		return this.nM;
	}
	bM() {
		return this.vM;
	}
	m() {
		this.fM(!1), this.eM !== 0 && window.cancelAnimationFrame(this.eM), this.sn.Bd().u(this), this.sn.Et().Jc().u(this), this.sn.N_().u(this), this.sn.m();
		for (let e of this.nM) this.uM.removeChild(e.fv()), e.mw().u(this), e.ww().u(this), e.m();
		this.nM = [];
		for (let e of this.sM) this.SM(e);
		this.sM = [], E(this.vM).m(), this.jv.parentElement !== null && this.jv.parentElement.removeChild(this.jv), this.wd.m(), this.$m.m(), this.jm.m(), this.xM();
	}
	wM(e, t, n = !1) {
		if (this.oo === t && this.k_ === e) return;
		let r = function(e) {
			let t = Math.floor(e.width), n = Math.floor(e.height);
			return c({
				width: t - t % 2,
				height: n - n % 2
			});
		}(c({
			width: e,
			height: t
		}));
		this.oo = r.height, this.k_ = r.width;
		let i = this.oo + "px", a = this.k_ + "px";
		if (this.CM() || (E(this.jv).style.height = i, E(this.jv).style.width = a), this.uM.style.height = i, this.uM.style.width = a, n) {
			this.eM !== 0 && (window.cancelAnimationFrame(this.eM), this.eM = 0), this.lM = !1;
			let e = ye.ys();
			this.aM !== null && (e.Ss(this.aM), this.aM = null), this.yM(e, performance.now());
		} else this.sn.ka();
	}
	Rm(e) {
		e === void 0 && (e = ye.ys());
		for (let t = 0; t < this.nM.length; t++) this.nM[t].Rm(e._s(t).rs);
		this.yn.timeScale.visible && this.vM.Rm(e.ls());
	}
	vr(e) {
		let t = gr(this.yn);
		this.sn.vr(e);
		let n = gr(this.yn);
		n !== t && this.fM(n), e.layout?.panes && this.PM(), this.gM(), this.kM(e);
	}
	mw() {
		return this.$m;
	}
	ww() {
		return this.jm;
	}
	Bd() {
		return this.wd;
	}
	TM(e = !1) {
		this.aM !== null && (this.yM(this.aM, performance.now()), this.aM = null);
		let t = this.RM(null), n = document.createElement("canvas");
		n.width = t.width, n.height = t.height;
		let r = E(n.getContext("2d"));
		return this.RM(r, e), n;
	}
	DM(e) {
		return e === "left" && !this.IM() || e === "right" && !this.VM() || this.nM.length === 0 ? 0 : E(e === "left" ? this.nM[0].yw() : this.nM[0].Pw()).Tm();
	}
	CM() {
		return this.yn.autoSize && this.oM !== null;
	}
	Mv() {
		return this.jv;
	}
	BM(e) {
		this._M = e, this._M ? this.Mv().style.setProperty("cursor", e) : this.Mv().style.removeProperty("cursor");
	}
	EM() {
		return this._M;
	}
	AM(e) {
		return T(this.nM[e]).pv();
	}
	PM() {
		this.sM.forEach(((e) => {
			e.Pt();
		}));
	}
	kM(e) {
		(e.autoSize !== void 0 || !this.oM || e.width === void 0 && e.height === void 0) && (e.autoSize && !this.oM && this.mM(), !1 === e.autoSize && this.oM !== null && this.xM(), e.autoSize || e.width === void 0 && e.height === void 0 || this.wM(e.width || this.k_, e.height || this.oo));
	}
	RM(e, t) {
		let n = 0, r = 0, i = this.nM[0], a = (n, r) => {
			let i = 0;
			for (let a = 0; a < this.nM.length; a++) {
				let o = this.nM[a], s = E(n === "left" ? o.yw() : o.Pw()), c = s.vv();
				if (e !== null && s.mv(e, r, i, t), i += c.height, a < this.nM.length - 1) {
					let t = this.sM[a], n = t.vv();
					e !== null && t.mv(e, r, i), i += n.height;
				}
			}
		};
		this.IM() && (a("left", 0), n += E(i.yw()).vv().width);
		for (let i = 0; i < this.nM.length; i++) {
			let a = this.nM[i], o = a.vv();
			if (e !== null && a.mv(e, n, r, t), r += o.height, i < this.nM.length - 1) {
				let t = this.sM[i], a = t.vv();
				e !== null && t.mv(e, n, r), r += a.height;
			}
		}
		n += i.vv().width, this.VM() && (a("right", n), n += E(i.Pw()).vv().width);
		let o = (t, n, r) => {
			E(t === "left" ? this.vM.$w() : this.vM.jw()).mv(E(e), n, r);
		};
		if (this.yn.timeScale.visible) {
			let n = this.vM.vv();
			if (e !== null) {
				let a = 0;
				this.IM() && (o("left", a, r), a = E(i.yw()).vv().width), this.vM.mv(e, a, r, t), a += n.width, this.VM() && o("right", a, r);
			}
			r += n.height;
		}
		return c({
			width: n,
			height: r
		});
	}
	LM() {
		let e = 0, t = 0, n = 0;
		for (let r of this.nM) this.IM() && (t = Math.max(t, E(r.yw()).Cm(), this.yn.leftPriceScale.minimumWidth)), this.VM() && (n = Math.max(n, E(r.Pw()).Cm(), this.yn.rightPriceScale.minimumWidth)), e += r.F_();
		t = Fn(t), n = Fn(n);
		let r = this.k_, i = this.oo, a = Math.max(r - t - n, 0), o = 1 * this.sM.length, s = this.yn.timeScale.visible, l = s ? Math.max(this.vM.Kw(), this.yn.timeScale.minimumHeight) : 0;
		var u;
		l = (u = l) + u % 2;
		let d = o + l, f = i < d ? 0 : i - d, p = f / e, m = 0, h = window.devicePixelRatio || 1;
		for (let e = 0; e < this.nM.length; ++e) {
			let r = this.nM[e];
			r.ew(this.sn.Gn()[e]);
			let i = 0, o = 0;
			o = e === this.nM.length - 1 ? Math.ceil((f - m) * h) / h : Math.round(r.F_() * p * h) / h, i = Math.max(o, 2), m += i, r.km(c({
				width: a,
				height: i
			})), this.IM() && r.gw(t, "left"), this.VM() && r.gw(n, "right"), r.yv() && this.sn.Ed(r.yv(), i);
		}
		this.vM.Yw(c({
			width: s ? a : 0,
			height: l
		}), s ? t : 0, s ? n : 0), this.sn.H_(a), this.rM !== t && (this.rM = t), this.hM !== n && (this.hM = n);
	}
	fM(e) {
		e ? this.jv.addEventListener("wheel", this.cM, { passive: !1 }) : this.jv.removeEventListener("wheel", this.cM);
	}
	zM(e) {
		switch (e.deltaMode) {
			case e.DOM_DELTA_PAGE: return 120;
			case e.DOM_DELTA_LINE: return 32;
		}
		return mr ? 1 / window.devicePixelRatio : 1;
	}
	dM(e) {
		if (!(e.deltaX !== 0 && this.yn.handleScroll.mouseWheel || e.deltaY !== 0 && this.yn.handleScale.mouseWheel)) return;
		let t = this.zM(e), n = t * e.deltaX / 100, r = -t * e.deltaY / 100;
		if (e.cancelable && e.preventDefault(), r !== 0 && this.yn.handleScale.mouseWheel) {
			let t = Math.sign(r) * Math.min(1, Math.abs(r)), n = e.clientX - this.jv.getBoundingClientRect().left;
			this.Qt().Wd(n, t);
		}
		n !== 0 && this.yn.handleScroll.mouseWheel && this.Qt().Hd(-80 * n);
	}
	yM(e, t) {
		let n = e.ls();
		n === 3 && this.OM(), n !== 3 && n !== 2 || (this.NM(e), this.FM(e, t), this.vM.Pt(), this.nM.forEach(((e) => {
			e.hw();
		})), this.aM?.ls() === 3 && (this.aM.Ss(e), this.OM(), this.NM(this.aM), this.FM(this.aM, t), e = this.aM, this.aM = null)), this.Rm(e);
	}
	FM(e, t) {
		for (let n of e.bs()) this.xs(n, t);
	}
	NM(e) {
		let t = this.sn.Gn();
		for (let n = 0; n < t.length; n++) e._s(n).hs && t[n].lu();
	}
	xs(e, t) {
		let n = this.sn.Et();
		switch (e.ds) {
			case 0:
				n.td();
				break;
			case 1:
				n.nd(e.Wt);
				break;
			case 2:
				n.Ms(e.Wt);
				break;
			case 3:
				n.gs(e.Wt);
				break;
			case 4:
				n.Wc();
				break;
			case 5: e.Wt.Kc(t) || n.gs(e.Wt.Gc(t));
		}
	}
	gd(e) {
		this.aM === null ? this.aM = e : this.aM.Ss(e), this.lM || (this.lM = !0, this.eM = window.requestAnimationFrame(((e) => {
			if (this.lM = !1, this.eM = 0, this.aM !== null) {
				let t = this.aM;
				this.aM = null, this.yM(t, e);
				for (let n of t.bs()) if (n.ds === 5 && !n.Wt.Kc(e)) {
					this.Qt().ps(n.Wt);
					break;
				}
			}
		})));
	}
	OM() {
		this.MM();
	}
	SM(e) {
		this.uM.removeChild(e.fv()), e.m();
	}
	MM() {
		let e = this.sn.Gn(), t = e.length, n = this.nM.length;
		for (let e = t; e < n; e++) {
			let e = T(this.nM.pop());
			this.uM.removeChild(e.fv()), e.mw().u(this), e.ww().u(this), e.m();
			let t = this.sM.pop();
			t !== void 0 && this.SM(t);
		}
		for (let r = n; r < t; r++) {
			let t = new sr(this, e[r]);
			if (t.mw().i(this.WM.bind(this, t), this), t.ww().i(this.HM.bind(this, t), this), this.nM.push(t), r > 0) {
				let e = new Un(this, r - 1, r);
				this.sM.push(e), this.uM.insertBefore(e.fv(), this.vM.fv());
			}
			this.uM.insertBefore(t.fv(), this.vM.fv());
		}
		for (let n = 0; n < t; n++) {
			let t = e[n], r = this.nM[n];
			r.yv() === t ? r.sw() : r.ew(t);
		}
		this.gM(), this.LM();
	}
	UM(e, t, n, r) {
		let i = /* @__PURE__ */ new Map();
		e !== null && this.sn.Jn().forEach(((t) => {
			let n = t.Un().Hn(e);
			n !== null && i.set(t, n);
		}));
		let a;
		if (e !== null) {
			let t = this.sn.Et().en(e)?.originalTime;
			t !== void 0 && (a = t);
		}
		let o = this.Qt().cu(), s = this.$M(r), c = function(e, t) {
			let n = e !== null && e.uu instanceof _t ? e.uu : void 0, r = e?.bu?.te, i = t !== void 0 && t !== -1 ? t : void 0;
			return e === null || e.ee === void 0 ? {
				jM: n,
				qM: r
			} : {
				jM: n,
				qM: r,
				YM: {
					ds: e.ee,
					KM: (a = e.uu, o = e.ee, a instanceof Wt ? "pane-primitive" : o === "marker" || o === "primitive" ? "series-primitive" : "series"),
					GM: Pn(e.ee, r),
					Y_: n,
					ZM: r,
					XM: i
				}
			};
			var a, o;
		}(o, s);
		return {
			Qr: a,
			$n: e ?? void 0,
			JM: t ?? void 0,
			XM: s === -1 ? void 0 : s,
			jM: c.jM,
			QM: i,
			qM: c.qM,
			YM: c.YM,
			tg: n ?? void 0
		};
	}
	$M(e) {
		let t = -1;
		if (e) t = this.nM.indexOf(e);
		else {
			let e = this.Qt().Vd().Kn();
			e !== null && (t = this.Qt().Gn().indexOf(e));
		}
		return t;
	}
	WM(e, t, n, r) {
		this.$m.p((() => this.UM(t, n, r, e)));
	}
	HM(e, t, n, r) {
		this.jm.p((() => this.UM(t, n, r, e)));
	}
	pM(e, t, n) {
		this.BM(this.Qt().cu()?.gu ?? null), this.wd.p((() => this.UM(e, t, n)));
	}
	gM() {
		let e = this.yn.timeScale.visible ? "" : "none";
		this.vM.fv().style.display = e;
	}
	IM() {
		return this.nM[0].yv().X_().N().visible;
	}
	VM() {
		return this.nM[0].yv().J_().N().visible;
	}
	mM() {
		return "ResizeObserver" in window && (this.oM = new ResizeObserver(((e) => {
			let t = e[e.length - 1];
			if (!t) return;
			let n = t.contentRect.width, r = t.contentRect.height;
			this.wM(n, r, !0);
		})), this.oM.observe(this.Kv, { box: "border-box" }), !0);
	}
	xM() {
		this.oM !== null && this.oM.disconnect(), this.oM = null;
	}
};
function gr(e) {
	return !!(e.handleScroll.mouseWheel || e.handleScale.mouseWheel);
}
function _r(e) {
	return e.open === void 0 && e.value === void 0;
}
function vr(e) {
	return function(e) {
		return e.open !== void 0;
	}(e) || function(e) {
		return e.value !== void 0;
	}(e);
}
function yr(e, t, n, r) {
	let i = n.value, a = {
		$n: t,
		wt: e,
		Wt: [
			i,
			i,
			i,
			i
		],
		Qr: r
	};
	return n.color !== void 0 && (a.R = n.color), a;
}
function br(e, t, n, r) {
	let i = n.value, a = {
		$n: t,
		wt: e,
		Wt: [
			i,
			i,
			i,
			i
		],
		Qr: r
	};
	return n.lineColor !== void 0 && (a.vt = n.lineColor), n.topColor !== void 0 && (a.ah = n.topColor), n.bottomColor !== void 0 && (a.oh = n.bottomColor), a;
}
function xr(e, t, n, r) {
	let i = n.value, a = {
		$n: t,
		wt: e,
		Wt: [
			i,
			i,
			i,
			i
		],
		Qr: r
	};
	return n.topLineColor !== void 0 && (a._h = n.topLineColor), n.bottomLineColor !== void 0 && (a.uh = n.bottomLineColor), n.topFillColor1 !== void 0 && (a.dh = n.topFillColor1), n.topFillColor2 !== void 0 && (a.fh = n.topFillColor2), n.bottomFillColor1 !== void 0 && (a.ph = n.bottomFillColor1), n.bottomFillColor2 !== void 0 && (a.mh = n.bottomFillColor2), a;
}
function Sr(e, t, n, r) {
	let i = {
		$n: t,
		wt: e,
		Wt: [
			n.open,
			n.high,
			n.low,
			n.close
		],
		Qr: r
	};
	return n.color !== void 0 && (i.R = n.color), i;
}
function Cr(e, t, n, r) {
	let i = {
		$n: t,
		wt: e,
		Wt: [
			n.open,
			n.high,
			n.low,
			n.close
		],
		Qr: r
	};
	return n.color !== void 0 && (i.R = n.color), n.borderColor !== void 0 && (i.Ht = n.borderColor), n.wickColor !== void 0 && (i.hh = n.wickColor), i;
}
function wr(e, t, n, r, i) {
	let a = T(i)(n), o = Math.max(...a), s = Math.min(...a), c = a[a.length - 1], l = [
		c,
		o,
		s,
		c
	], { time: u, color: d, ...f } = n;
	return {
		$n: t,
		wt: e,
		Wt: l,
		Qr: r,
		ue: f,
		R: d
	};
}
function Tr(e) {
	return e.Wt !== void 0;
}
function Er(e, t) {
	return t.customValues !== void 0 && (e.ig = t.customValues), e;
}
function Dr(e) {
	return (t, n, r, i, a, o) => function(e, t) {
		return t ? t(e) : _r(e);
	}(r, o) ? Er({
		wt: t,
		$n: n,
		Qr: i
	}, r) : Er(e(t, n, r, i, a), r);
}
function Or(e) {
	return {
		Candlestick: Dr(Cr),
		Bar: Dr(Sr),
		Area: Dr(br),
		Baseline: Dr(xr),
		Histogram: Dr(yr),
		Line: Dr(yr),
		Custom: Dr(wr)
	}[e];
}
function kr(e) {
	return {
		$n: 0,
		ng: /* @__PURE__ */ new Map(),
		Oa: e
	};
}
function Ar(e, t) {
	if (e !== void 0 && e.length !== 0) return {
		sg: t.key(e[0].wt),
		eg: t.key(e[e.length - 1].wt)
	};
}
function jr(e) {
	let t;
	return e.forEach(((e) => {
		t === void 0 && (t = e.Qr);
	})), T(t);
}
var Mr = class {
	constructor(e) {
		this.rg = /* @__PURE__ */ new Map(), this.hg = /* @__PURE__ */ new Map(), this.ag = /* @__PURE__ */ new Map(), this.lg = [], this.Pu = e;
	}
	m() {
		this.rg.clear(), this.hg.clear(), this.ag.clear(), this.lg = [];
	}
	og(e, t) {
		let n = this.rg.size !== 0, r = !1, i = this.hg.get(e);
		if (i !== void 0) {
			if (this.hg.size === 1) n = !1, r = !0, this.rg.clear();
			else for (let t of this.lg) t.pointData.ng.delete(e) && (r = !0);
		}
		let a = [];
		if (t.length !== 0) {
			let n = t.map(((e) => e.time)), i = this.Pu.createConverterToInternalObj(t), o = Or(e.bh()), s = e.ul(), c = e.cl();
			a = t.map(((t, a) => {
				let l = i(t.time), u = this.Pu.key(l), d = this.rg.get(u);
				d === void 0 && (d = kr(l), this.rg.set(u, d), r = !0);
				let f = o(l, d.$n, t, n[a], s, c);
				return d.ng.set(e, f), f;
			}));
		}
		n && this._g(), this.ug(e, a);
		let o = -1;
		if (r) {
			let e = [];
			this.rg.forEach(((t) => {
				e.push({
					timeWeight: 0,
					time: t.Oa,
					pointData: t,
					originalTime: jr(t.ng)
				});
			})), e.sort(((e, t) => this.Pu.key(e.time) - this.Pu.key(t.time))), o = this.cg(e);
		}
		return this.dg(e, o, function(e, t, n) {
			let r = Ar(e, n), i = Ar(t, n);
			if (r !== void 0 && i !== void 0) return {
				fg: !1,
				Va: r.eg >= i.eg && r.sg >= i.sg
			};
		}(this.hg.get(e), i, this.Pu));
	}
	if(e) {
		return this.og(e, []);
	}
	pg(e, t, n) {
		if (n && e.Fa()) throw Error("Historical updates are not supported when conflation is enabled. Conflation requires data to be processed in order.");
		let r = t;
		(function(e) {
			e.Qr === void 0 && (e.Qr = e.time);
		})(r), this.Pu.preprocessData(t);
		let i = this.Pu.createConverterToInternalObj([t])(t.time), a = this.ag.get(e);
		if (!n && a !== void 0 && this.Pu.key(i) < this.Pu.key(a)) throw Error(`Cannot update oldest data, last time=${a}, new time=${i}`);
		let o = this.rg.get(this.Pu.key(i));
		if (n && o === void 0) throw Error("Cannot update non-existing data point when historicalUpdate is true");
		let s = o === void 0;
		o === void 0 && (o = kr(i), this.rg.set(this.Pu.key(i), o));
		let c = Or(e.bh()), l = e.ul(), u = e.cl(), d = c(i, o.$n, t, r.Qr, l, u), f = !n && !s && a !== void 0 && this.Pu.key(i) === this.Pu.key(a);
		o.ng.set(e, d), n ? this.vg(e, d, o.$n) : (f && e.Fa() && Tr(d) && e.Rr(d), this.mg(e, d));
		let p = {
			Va: Tr(d),
			fg: n
		};
		if (!s) return this.dg(e, -1, p);
		let m = {
			timeWeight: 0,
			time: o.Oa,
			pointData: o,
			originalTime: jr(o.ng)
		}, h = Je(this.lg, this.Pu.key(m.time), ((e, t) => this.Pu.key(e.time) < t));
		this.lg.splice(h, 0, m);
		for (let e = h; e < this.lg.length; ++e) Nr(this.lg[e].pointData, e);
		return this.Pu.fillWeightsForPoints(this.lg, h), this.dg(e, h, p);
	}
	wg(e, t) {
		let n = this.hg.get(e);
		if (n === void 0 || t <= 0) return [[], this.Mg()];
		t = Math.min(t, n.length);
		let r = n.splice(-t).reverse();
		n.length === 0 ? this.ag.delete(e) : this.ag.set(e, n[n.length - 1].wt);
		for (let t of r) {
			let n = this.rg.get(this.Pu.key(t.wt));
			if (n && (n.ng.delete(e), n.ng.size === 0)) {
				this.rg.delete(this.Pu.key(n.Oa)), this.lg.splice(n.$n, 1);
				for (let e = n.$n; e < this.lg.length; ++e) Nr(this.lg[e].pointData, e);
			}
		}
		return [r, this.dg(e, this.lg.length - 1, {
			fg: !1,
			Va: !1
		})];
	}
	mg(e, t) {
		let n = this.hg.get(e);
		n === void 0 && (n = [], this.hg.set(e, n));
		let r = n.length === 0 ? null : n[n.length - 1];
		r === null || this.Pu.key(t.wt) > this.Pu.key(r.wt) ? Tr(t) && n.push(t) : Tr(t) ? n[n.length - 1] = t : n.splice(-1, 1), this.ag.set(e, t.wt);
	}
	vg(e, t, n) {
		let r = this.hg.get(e);
		if (r === void 0) return;
		let i = Je(r, n, ((e, t) => e.$n < t));
		Tr(t) ? r[i] = t : r.splice(i, 1);
	}
	ug(e, t) {
		t.length === 0 ? (this.hg.delete(e), this.ag.delete(e)) : (this.hg.set(e, t.filter(Tr)), this.ag.set(e, t[t.length - 1].wt));
	}
	_g() {
		for (let e of this.lg) e.pointData.ng.size === 0 && this.rg.delete(this.Pu.key(e.time));
	}
	cg(e) {
		let t = -1;
		for (let n = 0; n < this.lg.length && n < e.length; ++n) {
			let r = this.lg[n], i = e[n];
			if (this.Pu.key(r.time) !== this.Pu.key(i.time)) {
				t = n;
				break;
			}
			i.timeWeight = r.timeWeight, Nr(i.pointData, n);
		}
		if (t === -1 && this.lg.length !== e.length && (t = Math.min(this.lg.length, e.length)), t === -1) return -1;
		for (let n = t; n < e.length; ++n) Nr(e[n].pointData, n);
		return this.Pu.fillWeightsForPoints(e, t), this.lg = e, t;
	}
	gg() {
		if (this.hg.size === 0) return null;
		let e = 0;
		return this.hg.forEach(((t) => {
			t.length !== 0 && (e = Math.max(e, t[t.length - 1].$n));
		})), e;
	}
	dg(e, t, n) {
		let r = this.Mg();
		if (t !== -1) this.hg.forEach(((t, i) => {
			r.Y_.set(i, {
				ue: t,
				bg: i === e ? n : void 0
			});
		})), this.hg.has(e) || r.Y_.set(e, {
			ue: [],
			bg: n
		}), r.Et.Sg = this.lg, r.Et.xg = t;
		else {
			let t = this.hg.get(e);
			r.Y_.set(e, {
				ue: t || [],
				bg: n
			});
		}
		return r;
	}
	Mg() {
		return {
			Y_: /* @__PURE__ */ new Map(),
			Et: { Dc: this.gg() }
		};
	}
};
function Nr(e, t) {
	e.$n = t, e.ng.forEach(((e) => {
		e.$n = t;
	}));
}
function Pr(e, t) {
	return e._t < t;
}
function Fr(e, t) {
	return t < e._t;
}
function Ir(e, t, n, r) {
	return Je(e, t, Pr, n, r);
}
function Lr(e, t, n, r) {
	return Ye(e, t, Fr, n, r);
}
function Rr(e, t, n) {
	return {
		ne: e,
		se: t,
		ee: n
	};
}
function zr(e, t, n, r) {
	return e >= t - r && e <= n + r;
}
function Br(e, t, n, r, i, a) {
	let o = i - n, s = a - r;
	if (o === 0 && s === 0) return Math.hypot(e - n, t - r);
	let c = ((e - n) * o + (t - r) * s) / (o * o + s * s), l = Math.max(0, Math.min(1, c)), u = n + o * l, d = r + s * l;
	return Math.hypot(e - u, t - d);
}
var Vr = [0, 0];
function Hr(e, t, n) {
	return t === void 0 || t.wt !== e.wt - 1 ? e._t - n / 2 : (t._t + e._t) / 2;
}
function Ur(e, t, n) {
	return t === void 0 || t.wt !== e.wt + 1 ? e._t + n / 2 : (e._t + t._t) / 2;
}
function Wr(e, t, n, r, i, a, o) {
	if (t === null || t.from >= t.to || e.length === 0) return null;
	let s = i / 2 + a, c = Ir(e, n - s, t.from, t.to), l = Lr(e, n + s, c, t.to);
	if (c >= l) return null;
	let u = Infinity;
	for (let s = c; s < l; s++) {
		let c = e[s], l = s > t.from ? e[s - 1] : void 0, d = s < t.to - 1 ? e[s + 1] : void 0, f = Hr(c, l, i) - a, p = Ur(c, d, i) + a;
		if (n < f || n > p) continue;
		o(c, Vr);
		let m = Vr[0], h = Vr[1], g = Math.min(m, h), _ = Math.max(m, h), v = g - a, y = _ + a;
		if (r >= g && r <= _) u = Math.min(u, 0);
		else if (r >= v && r <= y) {
			let e = Math.min(Math.abs(r - g), Math.abs(_ - r));
			u = Math.min(u, e);
		}
	}
	return Number.isFinite(u) ? Rr(u, 0, "series-range") : null;
}
function Gr(e, t) {
	return e.wt < t;
}
function Kr(e, t) {
	return t < e.wt;
}
function qr(e, t, n) {
	let r = t.Na(), i = t.bi(), a = Je(e, r, Gr), o = Ye(e, i, Kr);
	if (!n) return {
		from: a,
		to: o
	};
	let s = a, c = o;
	return a > 0 && a < e.length && e[a].wt >= r && (s = a - 1), o > 0 && o < e.length && e[o - 1].wt <= i && (c = o + 1), {
		from: s,
		to: c
	};
}
var Jr = class {
	constructor(e, t, n) {
		this.Cg = !0, this.yg = !0, this.Pg = !0, this.kg = [], this.Tg = null, this.Rg = -1, this.ae = e, this.le = t, this.Dg = n;
	}
	Pt(e) {
		this.Cg = !0, e === "data" && (this.yg = !0), e === "options" && (this.Pg = !0);
	}
	Tt() {
		return this.ae.It() ? (this.Ig(), this.Tg === null ? null : this.Vg) : null;
	}
	Qs(e, t) {
		return this.ae.It() ? (this.Ig(), this.Tg === null ? null : this.Bg(e, t)) : null;
	}
	Bg(e, t) {
		return null;
	}
	Eg() {
		this.kg = this.kg.map(((e) => ({
			...e,
			...this.ae.Sa().Sh(e.wt)
		})));
	}
	Ag() {
		this.Tg = null;
	}
	Ig() {
		let e = this.le.Et(), t = e.N().enableConflation ? e.sd() : 0;
		t !== this.Rg && (this.yg = !0, this.Rg = t), this.yg &&= (this.Lg(), !1), this.Pg &&= (this.Eg(), !1), this.Cg &&= (this.zg(), !1);
	}
	zg() {
		let e = this.ae.Ft(), t = this.le.Et();
		if (this.Ag(), t.Zi() || e.Zi()) return;
		let n = t.Ee();
		if (n === null || this.ae.Un().Th() === 0) return;
		let r = this.ae.Lt();
		r !== null && (this.Tg = qr(this.kg, n, this.Dg), this.Og(e, t, r.Wt), this.Ng());
	}
}, Yr = class {
	constructor(e, t) {
		this.Fg = e, this.Ki = t;
	}
	st(e, t, n) {
		this.Fg.draw(e, this.Ki, t, n);
	}
};
function Xr(e) {
	switch (e) {
		case "point": return 2;
		case "range": return 0;
		default: return 1;
	}
}
var Zr = class extends Jr {
	constructor(e, t, n) {
		super(e, t, !1), this.Yh = n, this.Fg = this.Yh.renderer(), this.Vg = new Yr(this.Fg, ((e) => this.Wg(e)));
	}
	get ga() {
		return this.Yh.conflationReducer;
	}
	Ha(e) {
		return this.Yh.priceValueBuilder(e);
	}
	dl(e) {
		return this.Yh.isWhitespace(e);
	}
	Bg(e, t) {
		let n = this.Fg.hitTest?.(e, t, ((e) => this.Wg(e)));
		if (n != null) return {
			ne: (r = n).distance,
			se: Xr(r.type),
			ee: "custom",
			gu: r.cursorStyle,
			te: r.objectId,
			ie: r.hitTestData
		};
		var r;
		let i = Wr(this.kg, this.Tg, e, t, this.le.Et().ml(), this.ae.N().hitTestTolerance, ((e, t) => {
			let n = e.Hg, r = NaN, i = NaN;
			if (n !== void 0 && !this.Yh.isWhitespace(n)) for (let e of this.Yh.priceValueBuilder(n)) {
				let t = this.Wg(e);
				t !== null && (r = Number.isNaN(r) ? t : Math.min(r, t), i = Number.isNaN(i) ? t : Math.max(i, t));
			}
			t[0] = r, t[1] = i;
		}));
		return i === null ? null : {
			...i,
			ee: "custom"
		};
	}
	Lg() {
		let e = this.ae.Sa();
		this.kg = this.ae.Ua().Bh().map(((t) => ({
			wt: t.$n,
			_t: NaN,
			...e.Sh(t.$n),
			Hg: t.ue
		})));
	}
	Og(e, t) {
		t.Ic(this.kg, ne(this.Tg));
	}
	Ng() {
		this.Yh.update({
			bars: this.kg.map(Qr),
			barSpacing: this.le.Et().ml(),
			visibleRange: this.Tg,
			conflationFactor: this.le.Et().sd()
		}, this.ae.N());
	}
	Wg(e) {
		let t = this.ae.Lt();
		return t === null ? null : this.ae.Ft().Nt(e, t.Wt);
	}
};
function Qr(e) {
	return {
		x: e._t,
		time: e.wt,
		originalData: e.Hg,
		barColor: e.sh
	};
}
var $r = { color: "#2196f3" }, ei = (e, t, n) => new Zr(e, t, D(n));
function ti(e) {
	let t = {
		value: e.Wt[3],
		time: e.Qr
	};
	return e.ig !== void 0 && (t.customValues = e.ig), t;
}
function ni(e) {
	let t = ti(e);
	return e.R !== void 0 && (t.color = e.R), t;
}
function ri(e) {
	let t = ti(e);
	return e.vt !== void 0 && (t.lineColor = e.vt), e.ah !== void 0 && (t.topColor = e.ah), e.oh !== void 0 && (t.bottomColor = e.oh), t;
}
function ii(e) {
	let t = ti(e);
	return e._h !== void 0 && (t.topLineColor = e._h), e.uh !== void 0 && (t.bottomLineColor = e.uh), e.dh !== void 0 && (t.topFillColor1 = e.dh), e.fh !== void 0 && (t.topFillColor2 = e.fh), e.ph !== void 0 && (t.bottomFillColor1 = e.ph), e.mh !== void 0 && (t.bottomFillColor2 = e.mh), t;
}
function ai(e) {
	let t = {
		open: e.Wt[0],
		high: e.Wt[1],
		low: e.Wt[2],
		close: e.Wt[3],
		time: e.Qr
	};
	return e.ig !== void 0 && (t.customValues = e.ig), t;
}
function oi(e) {
	let t = ai(e);
	return e.R !== void 0 && (t.color = e.R), t;
}
function si(e) {
	let t = ai(e), { R: n, Ht: r, hh: i } = e;
	return n !== void 0 && (t.color = n), r !== void 0 && (t.borderColor = r), i !== void 0 && (t.wickColor = i), t;
}
function ci(e) {
	return {
		Area: ri,
		Line: ni,
		Baseline: ii,
		Histogram: ni,
		Bar: oi,
		Candlestick: si,
		Custom: li
	}[e];
}
function li(e) {
	let t = e.Qr;
	return {
		...e.ue,
		time: t
	};
}
var ui = {
	vertLine: {
		color: "#9598A1",
		width: 1,
		style: 3,
		visible: !0,
		labelVisible: !0,
		labelBackgroundColor: "#131722"
	},
	horzLine: {
		color: "#9598A1",
		width: 1,
		style: 3,
		visible: !0,
		labelVisible: !0,
		labelBackgroundColor: "#131722"
	},
	mode: 1,
	doNotSnapToHiddenSeriesIndices: !1
}, di = {
	vertLines: {
		color: "#D6DCDE",
		style: 0,
		visible: !0
	},
	horzLines: {
		color: "#D6DCDE",
		style: 0,
		visible: !0
	}
}, fi = {
	background: {
		type: "solid",
		color: "#FFFFFF"
	},
	textColor: "#191919",
	fontSize: 12,
	fontFamily: P,
	panes: {
		enableResize: !0,
		separatorColor: "#E0E3EB",
		separatorHoverColor: "rgba(178, 181, 189, 0.2)"
	},
	attributionLogo: !0,
	colorSpace: "srgb",
	colorParsers: []
}, pi = {
	autoScale: !0,
	mode: 0,
	invertScale: !1,
	alignLabels: !0,
	borderVisible: !0,
	borderColor: "#2B2B43",
	entireTextOnly: !1,
	visible: !1,
	ticksVisible: !1,
	scaleMargins: {
		bottom: .1,
		top: .2
	},
	minimumWidth: 0,
	ensureEdgeTickMarksVisible: !1,
	tickMarkDensity: 2.5
}, mi = {
	rightOffset: 0,
	barSpacing: 6,
	minBarSpacing: .5,
	maxBarSpacing: 0,
	fixLeftEdge: !1,
	fixRightEdge: !1,
	lockVisibleTimeRangeOnResize: !1,
	rightBarStaysOnScroll: !1,
	borderVisible: !0,
	borderColor: "#2B2B43",
	visible: !0,
	timeVisible: !1,
	secondsVisible: !0,
	shiftVisibleRangeOnNewBar: !0,
	allowShiftVisibleRangeOnWhitespaceReplacement: !1,
	ticksVisible: !1,
	uniformDistribution: !1,
	minimumHeight: 0,
	allowBoldLabels: !0,
	ignoreWhitespaceIndices: !1,
	enableConflation: !1,
	conflationThresholdFactor: 1,
	precomputeConflationOnInit: !1,
	precomputeConflationPriority: "background"
};
function hi() {
	return {
		addDefaultPane: !0,
		hoveredSeriesOnTop: !0,
		width: 0,
		height: 0,
		autoSize: !1,
		layout: fi,
		crosshair: ui,
		grid: di,
		overlayPriceScales: { ...pi },
		leftPriceScale: {
			...pi,
			visible: !1
		},
		rightPriceScale: {
			...pi,
			visible: !0
		},
		defaultVisiblePriceScaleId: "right",
		timeScale: mi,
		localization: {
			locale: jn ? navigator.language : "",
			dateFormat: "dd MMM 'yy"
		},
		handleScroll: {
			mouseWheel: !0,
			pressedMouseMove: !0,
			horzTouchDrag: !0,
			vertTouchDrag: !0
		},
		handleScale: {
			axisPressedMouseMove: {
				time: !0,
				price: !0
			},
			axisDoubleClickReset: {
				time: !0,
				price: !0
			},
			mouseWheel: !0,
			pinch: !0
		},
		kineticScroll: {
			mouse: !1,
			touch: !0
		},
		trackingMode: { exitMode: 1 }
	};
}
var gi = class {
	constructor(e, t, n) {
		this.hv = e, this.Ug = t, this.$g = n ?? 0;
	}
	applyOptions(e) {
		this.hv.Qt().Dd(this.Ug, e, this.$g);
	}
	options() {
		return this.Ki().N();
	}
	width() {
		return ve(this.Ug) ? this.hv.DM(this.Ug) : 0;
	}
	setVisibleRange(e) {
		this.setAutoScale(!1), this.Ki().Go(new J(e.from, e.to));
	}
	getVisibleRange() {
		let e, t, n = this.Ki().ar();
		if (n === null) return null;
		if (this.Ki().ho()) {
			let r = this.Ki().S_(), i = fn(r);
			n = Pt(n, this.Ki().lo()), e = Number((Math.round(n.Je() / r) * r).toFixed(i)), t = Number((Math.round(n.Qe() / r) * r).toFixed(i));
		} else e = n.Je(), t = n.Qe();
		return {
			from: e,
			to: t
		};
	}
	setAutoScale(e) {
		this.applyOptions({ autoScale: e });
	}
	Ki() {
		return E(this.hv.Qt().Id(this.Ug, this.$g)).Ft;
	}
}, _i = class {
	constructor(e, t, n, r) {
		this.hv = e, this.yt = n, this.jg = t, this.qg = r;
	}
	getHeight() {
		return this.yt.$t();
	}
	setHeight(e) {
		let t = this.hv.Qt(), n = t._f(this.yt);
		t.Ld(n, e);
	}
	getStretchFactor() {
		return this.yt.F_();
	}
	setStretchFactor(e) {
		this.yt.W_(e), this.hv.Qt().ka();
	}
	paneIndex() {
		return this.hv.Qt()._f(this.yt);
	}
	moveTo(e) {
		let t = this.paneIndex();
		t !== e && (w(e >= 0 && e < this.hv.lv().length, "Invalid pane index"), this.hv.Qt().Od(t, e));
	}
	getSeries() {
		return this.yt.Y_().map(((e) => this.jg(e))) ?? [];
	}
	getHTMLElement() {
		let e = this.hv.lv();
		return e && e.length !== 0 && e[this.paneIndex()] ? e[this.paneIndex()].fv() : null;
	}
	attachPrimitive(e) {
		this.yt.ol(e), e.attached && e.attached({
			chart: this.qg,
			requestUpdate: () => this.yt.Qt().ka()
		});
	}
	detachPrimitive(e) {
		this.yt._l(e);
	}
	priceScale(e) {
		if (this.yt.O_(e) === null) throw Error(`Cannot find price scale with id: ${e}`);
		return new gi(this.hv, e, this.paneIndex());
	}
	setPreserveEmptyPane(e) {
		this.yt.j_(e);
	}
	preserveEmptyPane() {
		return this.yt.q_();
	}
	addCustomSeries(e, t = {}, n = 0) {
		return this.qg.addCustomSeries(e, t, n);
	}
	addSeries(e, t = {}) {
		return this.qg.addSeries(e, t, this.paneIndex());
	}
}, vi = {
	color: "#FF0000",
	price: 0,
	lineStyle: 2,
	lineWidth: 1,
	lineVisible: !0,
	axisLabelVisible: !0,
	title: "",
	axisLabelColor: "",
	axisLabelTextColor: ""
}, yi = class {
	constructor(e) {
		this._r = e;
	}
	applyOptions(e) {
		this._r.vr(e);
	}
	options() {
		return this._r.N();
	}
	Yg() {
		return this._r;
	}
}, bi = class {
	constructor(e, t, n, r, i, a) {
		this.Kg = new O(), this.ae = e, this.Gg = t, this.Zg = n, this.Pu = i, this.qg = r, this.Xg = a;
	}
	m() {
		this.Kg.m();
	}
	priceFormatter() {
		return this.ae.sl();
	}
	priceToCoordinate(e) {
		let t = this.ae.Lt();
		return t === null ? null : this.ae.Ft().Nt(e, t.Wt);
	}
	coordinateToPrice(e) {
		let t = this.ae.Lt();
		return t === null ? null : this.ae.Ft().Tn(e, t.Wt);
	}
	barsInLogicalRange(e) {
		if (e === null) return null;
		let t = new nn(new $t(e.from, e.to)).Uu(), n = this.ae.Un();
		if (n.Zi()) return null;
		let r = n.Hn(t.Na(), 1), i = n.Hn(t.bi(), -1), a = E(n.Rh()), o = E(n.Qn());
		if (r !== null && i !== null && r.$n > i.$n) return {
			barsBefore: e.from - a,
			barsAfter: o - e.to
		};
		let s = {
			barsBefore: r === null || r.$n === a ? e.from - a : r.$n - a,
			barsAfter: i === null || i.$n === o ? o - e.to : o - i.$n
		};
		return r !== null && i !== null && (s.from = r.Qr, s.to = i.Qr), s;
	}
	setData(e) {
		this.Pu, this.ae.bh(), this.Gg.Jg(this.ae, e), this.Qg("full");
	}
	update(e, t = !1) {
		this.ae.bh(), this.Gg.tb(this.ae, e, t), this.Qg("update");
	}
	pop(e = 1) {
		let t = this.Gg.ib(this.ae, e);
		t.length !== 0 && this.Qg("update");
		let n = ci(this.seriesType());
		return t.map(((e) => n(e)));
	}
	dataByIndex(e, t) {
		let n = this.ae.Un().Hn(e, t);
		return n === null ? null : ci(this.seriesType())(n);
	}
	data() {
		let e = ci(this.seriesType());
		return this.ae.Un().Bh().map(((t) => e(t)));
	}
	subscribeDataChanged(e) {
		this.Kg.i(e);
	}
	unsubscribeDataChanged(e) {
		this.Kg._(e);
	}
	applyOptions(e) {
		this.ae.vr(e);
	}
	options() {
		return N(this.ae.N());
	}
	priceScale() {
		return this.Zg.priceScale(this.ae.Ft().pl(), this.getPane().paneIndex());
	}
	createPriceLine(e) {
		let t = k(N(vi), e);
		return new yi(this.ae.Ea(t));
	}
	removePriceLine(e) {
		this.ae.Aa(e.Yg());
	}
	priceLines() {
		return this.ae.La().map(((e) => new yi(e)));
	}
	seriesType() {
		return this.ae.bh();
	}
	lastValueData(e) {
		let t = this.ae.Ae(e);
		return t.Le ? { noData: !0 } : {
			noData: !1,
			price: t.Mt,
			color: t.R
		};
	}
	attachPrimitive(e) {
		this.ae.ol(e), e.attached && e.attached({
			chart: this.qg,
			series: this,
			requestUpdate: () => this.ae.Qt().ka(),
			horzScaleBehavior: this.Pu
		});
	}
	detachPrimitive(e) {
		this.ae._l(e), e.detached && e.detached(), this.ae.Qt().ka();
	}
	getPane() {
		let e = this.ae, t = E(this.ae.Qt().Ks(e));
		return this.Xg(t);
	}
	moveToPane(e) {
		this.ae.Qt().rf(this.ae, e);
	}
	seriesOrder() {
		let e = this.ae.Qt().Ks(this.ae);
		return e === null ? -1 : e.Y_().indexOf(this.ae);
	}
	setSeriesOrder(e) {
		let t = this.ae.Qt().Ks(this.ae);
		t !== null && t.vu(this.ae, e);
	}
	Qg(e) {
		this.Kg.v() && this.Kg.p(e);
	}
}, xi = class {
	constructor(e, t, n) {
		this.nb = new O(), this.Qu = new O(), this.Nw = new O(), this.sn = e, this.ia = e.Et(), this.vM = t, this.ia.Zc().i(this.sb.bind(this)), this.ia.Xc().i(this.eb.bind(this)), this.vM.qw().i(this.rb.bind(this)), this.Pu = n;
	}
	m() {
		this.ia.Zc().u(this), this.ia.Xc().u(this), this.vM.qw().u(this), this.nb.m(), this.Qu.m(), this.Nw.m();
	}
	scrollPosition() {
		return this.ia.Oc();
	}
	scrollToPosition(e, t) {
		t ? this.ia.Yc(e, 1e3) : this.sn.gs(e);
	}
	scrollToRealTime() {
		this.ia.qc();
	}
	getVisibleRange() {
		let e = this.ia.xc();
		return e === null ? null : {
			from: e.from.originalTime,
			to: e.to.originalTime
		};
	}
	setVisibleRange(e) {
		let t = {
			from: this.Pu.convertHorzItemToInternal(e.from),
			to: this.Pu.convertHorzItemToInternal(e.to)
		}, n = this.ia.kc(t);
		this.sn.sf(n);
	}
	getVisibleLogicalRange() {
		let e = this.ia.Sc();
		return e === null ? null : {
			from: e.Na(),
			to: e.bi()
		};
	}
	setVisibleLogicalRange(e) {
		w(e.from <= e.to, "The from index cannot be after the to index."), this.sn.sf(e);
	}
	resetTimeScale() {
		this.sn.ws();
	}
	fitContent() {
		this.sn.td();
	}
	logicalToCoordinate(e) {
		let t = this.sn.Et();
		return t.Zi() ? null : t.jt(e);
	}
	coordinateToLogical(e) {
		return this.ia.Zi() ? null : this.ia.Vc(e);
	}
	timeToIndex(e, t) {
		let n = this.Pu.convertHorzItemToInternal(e);
		return this.ia.Mc(n, t);
	}
	timeToCoordinate(e) {
		let t = this.timeToIndex(e, !1);
		return t === null ? null : this.ia.jt(t);
	}
	coordinateToTime(e) {
		let t = this.sn.Et(), n = t.Vc(e), r = t.en(n);
		return r === null ? null : r.originalTime;
	}
	width() {
		return this.vM.pv().width;
	}
	height() {
		return this.vM.pv().height;
	}
	subscribeVisibleTimeRangeChange(e) {
		this.nb.i(e);
	}
	unsubscribeVisibleTimeRangeChange(e) {
		this.nb._(e);
	}
	subscribeVisibleLogicalRangeChange(e) {
		this.Qu.i(e);
	}
	unsubscribeVisibleLogicalRangeChange(e) {
		this.Qu._(e);
	}
	subscribeSizeChange(e) {
		this.Nw.i(e);
	}
	unsubscribeSizeChange(e) {
		this.Nw._(e);
	}
	applyOptions(e) {
		this.ia.vr(e);
	}
	options() {
		return {
			...N(this.ia.N()),
			barSpacing: this.ia.ml()
		};
	}
	sb() {
		this.nb.v() && this.nb.p(this.getVisibleRange());
	}
	eb() {
		this.Qu.v() && this.Qu.p(this.getVisibleLogicalRange());
	}
	rb(e) {
		this.Nw.p(e.width, e.height);
	}
};
function Si(e) {
	return function(e) {
		if (ee(e.handleScale)) {
			let t = e.handleScale;
			e.handleScale = {
				axisDoubleClickReset: {
					time: t,
					price: t
				},
				axisPressedMouseMove: {
					time: t,
					price: t
				},
				mouseWheel: t,
				pinch: t
			};
		} else if (e.handleScale !== void 0) {
			let { axisPressedMouseMove: t, axisDoubleClickReset: n } = e.handleScale;
			ee(t) && (e.handleScale.axisPressedMouseMove = {
				time: t,
				price: t
			}), ee(n) && (e.handleScale.axisDoubleClickReset = {
				time: n,
				price: n
			});
		}
		let t = e.handleScroll;
		ee(t) && (e.handleScroll = {
			horzTouchDrag: t,
			vertTouchDrag: t,
			mouseWheel: t,
			pressedMouseMove: t
		});
	}(e), e;
}
var Ci = class {
	constructor(e, t, n) {
		this.hb = /* @__PURE__ */ new Map(), this.ab = /* @__PURE__ */ new Map(), this.lb = new O(), this.ob = new O(), this._b = new O(), this.dd = /* @__PURE__ */ new WeakMap(), this.ub = new Mr(t);
		let r = n === void 0 ? N(hi()) : k(N(hi()), Si(n));
		this.cb = t, this.hv = new hr(e, r, t), this.hv.mw().i(((e) => {
			this.lb.v() && this.lb.p(this.fb(e()));
		}), this), this.hv.ww().i(((e) => {
			this.ob.v() && this.ob.p(this.fb(e()));
		}), this), this.hv.Bd().i(((e) => {
			this._b.v() && this._b.p(this.fb(e()));
		}), this);
		let i = this.hv.Qt();
		this.pb = new xi(i, this.hv.bM(), this.cb);
	}
	remove() {
		this.hv.mw().u(this), this.hv.ww().u(this), this.hv.Bd().u(this), this.pb.m(), this.hv.m(), this.hb.clear(), this.ab.clear(), this.lb.m(), this.ob.m(), this._b.m(), this.ub.m();
	}
	resize(e, t, n) {
		this.autoSizeActive() || this.hv.wM(e, t, n);
	}
	addCustomSeries(e, t = {}, n = 0) {
		let r = ((e) => ({
			type: "Custom",
			isBuiltIn: !1,
			defaultOptions: {
				...$r,
				...e.defaultOptions()
			},
			mb: ei,
			wb: e
		}))(D(e));
		return this.Mb(r, t, n);
	}
	addSeries(e, t = {}, n = 0) {
		return this.Mb(e, t, n);
	}
	removeSeries(e) {
		let t = T(this.hb.get(e)), n = this.ub.if(t);
		this.hv.Qt().if(t), this.gb(n), this.hb.delete(e), this.ab.delete(t);
	}
	Jg(e, t) {
		this.gb(this.ub.og(e, t));
	}
	tb(e, t, n) {
		this.gb(this.ub.pg(e, t, n));
	}
	ib(e, t) {
		let [n, r] = this.ub.wg(e, t);
		return n.length !== 0 && this.gb(r), n;
	}
	subscribeClick(e) {
		this.lb.i(e);
	}
	unsubscribeClick(e) {
		this.lb._(e);
	}
	subscribeCrosshairMove(e) {
		this._b.i(e);
	}
	unsubscribeCrosshairMove(e) {
		this._b._(e);
	}
	subscribeDblClick(e) {
		this.ob.i(e);
	}
	unsubscribeDblClick(e) {
		this.ob._(e);
	}
	priceScale(e, t = 0) {
		return new gi(this.hv, e, t);
	}
	timeScale() {
		return this.pb;
	}
	applyOptions(e) {
		this.hv.vr(Si(e));
	}
	options() {
		return this.hv.N();
	}
	takeScreenshot(e = !1, t = !1) {
		let n, r;
		try {
			t || (n = this.hv.Qt().N().crosshair.mode, this.hv.vr({ crosshair: { mode: 2 } })), r = this.hv.TM(e);
		} finally {
			t || n === void 0 || this.hv.Qt().vr({ crosshair: { mode: n } });
		}
		return r;
	}
	addPane(e = !1) {
		let t = this.hv.Qt().uf();
		return t.j_(e), this.bb(t);
	}
	removePane(e) {
		this.hv.Qt().Ad(e);
	}
	swapPanes(e, t) {
		this.hv.Qt().zd(e, t);
	}
	autoSizeActive() {
		return this.hv.CM();
	}
	chartElement() {
		return this.hv.Mv();
	}
	panes() {
		return this.hv.Qt().Gn().map(((e) => this.bb(e)));
	}
	paneSize(e = 0) {
		let t = this.hv.AM(e);
		return {
			height: t.height,
			width: t.width
		};
	}
	setCrosshairPosition(e, t, n) {
		let r = this.hb.get(n);
		if (r === void 0) return;
		let i = this.hv.Qt().Ks(r);
		i !== null && this.hv.Qt().Gd(e, t, i);
	}
	clearCrosshairPosition() {
		this.hv.Qt().Zd(!0);
	}
	horzBehaviour() {
		return this.cb;
	}
	Mb(e, t = {}, n = 0) {
		w(e.mb !== void 0), function(e) {
			if (e === void 0 || e.type === "custom") return;
			let t = e;
			t.minMove !== void 0 && t.precision === void 0 && (t.precision = fn(t.minMove));
		}(t.priceFormat), e.type === "Candlestick" && function(e) {
			e.borderColor !== void 0 && (e.borderUpColor = e.borderColor, e.borderDownColor = e.borderColor), e.wickColor !== void 0 && (e.wickUpColor = e.wickColor, e.wickDownColor = e.wickColor);
		}(t);
		let r = k(N(y), N(e.defaultOptions), t), i = e.mb, a = new _t(this.hv.Qt(), e.type, r, i, e.wb);
		this.hv.Qt().Qd(a, n);
		let o = new bi(a, this, this, this, this.cb, ((e) => this.bb(e)));
		return this.hb.set(o, a), this.ab.set(a, o), o;
	}
	gb(e) {
		let t = this.hv.Qt();
		for (let t of e.Y_.keys()) t.Ia();
		t.Xd(e.Et.Dc, e.Et.Sg, e.Et.xg), e.Y_.forEach(((e, t) => t.ht(e.ue, e.bg))), t.Et().dc(), t.Lc();
	}
	Sb(e) {
		return T(this.ab.get(e));
	}
	xb(e) {
		return e !== void 0 && this.ab.has(e) ? this.Sb(e) : void 0;
	}
	fb(e) {
		let t = /* @__PURE__ */ new Map();
		e.QM.forEach(((e, n) => {
			let r = n.bh(), i = ci(r)(e);
			if (r !== "Custom") w(vr(i));
			else {
				let e = n.cl();
				w(!e || !1 === e(i));
			}
			t.set(this.Sb(n), i);
		}));
		let n = this.xb(e.jM), r = e.YM === void 0 ? void 0 : {
			type: e.YM.ds,
			sourceKind: e.YM.KM,
			objectKind: e.YM.GM,
			series: this.xb(e.YM.Y_),
			objectId: e.YM.ZM,
			paneIndex: e.YM.XM
		};
		return {
			time: e.Qr,
			logical: e.$n,
			point: e.JM,
			paneIndex: e.XM,
			hoveredInfo: r,
			hoveredSeries: n,
			hoveredObjectId: e.qM,
			seriesData: t,
			sourceEvent: e.tg
		};
	}
	bb(e) {
		let t = this.dd.get(e);
		return t || (t = new _i(this.hv, ((e) => this.Sb(e)), e, this), this.dd.set(e, t)), t;
	}
};
function wi(e) {
	if (M(e)) {
		let t = document.getElementById(e);
		return w(t !== null, `Cannot find element in DOM with id=${e}`), t;
	}
	return e;
}
function Ti(e, t, n) {
	let r = new Ci(wi(e), t, n);
	return t.setOptions(r.options()), r;
}
function Ei(e, t) {
	return Ti(e, new An(), An.Tf(t));
}
function Di(e, t, n, r) {
	return Math.hypot(n - e, r - t);
}
function Oi(e, t, n, r, i, a, o, s = 0) {
	if (t.length === 0 || r.from >= t.length || r.to <= 0) return;
	let { context: c, horizontalPixelRatio: l, verticalPixelRatio: u } = e, d = t[r.from], f = a(e, d), p = d;
	if (r.to - r.from < 2) {
		let t = i / 2;
		c.beginPath();
		let n = {
			_t: d._t - t,
			ut: d.ut
		}, r = {
			_t: d._t + t,
			ut: d.ut
		};
		c.moveTo(n._t * l, n.ut * u), c.lineTo(r._t * l, r.ut * u), o(e, f, n, r);
	} else {
		let i = s > 0, m = 0, h = (t, n) => {
			if (o(e, f, p, n), c.beginPath(), f = t, p = n, i) {
				let e = m % s;
				c.lineDashOffset = e, m = e;
			}
		}, g = p;
		c.beginPath(), c.moveTo(d._t * l, d.ut * u);
		for (let o = r.from + 1; o < r.to; ++o) {
			g = t[o];
			let r = g._t * l, s = g.ut * u, d = a(e, g);
			switch (n) {
				case 0:
					if (c.lineTo(r, s), i) {
						let e = t[o - 1], n = e._t * l, i = e.ut * u;
						m += Di(n, i, r, s);
					}
					break;
				case 1: {
					let e = t[o - 1], n = e.ut * u;
					c.lineTo(r, n), i && (m += Math.abs(g._t - e._t) * l), d !== f && (h(d, g), c.lineTo(r, n)), c.lineTo(r, s), i && (m += Math.abs(g.ut - e.ut) * u);
					break;
				}
				case 2: {
					let [e, n] = Mi(t, o - 1, o), a = e._t * l, d = e.ut * u, f = n._t * l, p = n.ut * u;
					if (c.bezierCurveTo(a, d, f, p, r, s), i) {
						let e = t[o - 1], n = e._t * l, i = e.ut * u, c = Di(n, i, r, s), h = Di(n, i, a, d) + Di(a, d, f, p) + Di(f, p, r, s);
						m += (c + h) / 2;
					}
					break;
				}
			}
			n !== 1 && d !== f && (h(d, g), c.moveTo(r, s));
		}
		(p !== g || p === g && n === 1) && o(e, f, p, g), i && (c.lineDashOffset = 0);
	}
}
var ki = 6;
function Ai(e, t) {
	return {
		_t: e._t - t._t,
		ut: e.ut - t.ut
	};
}
function ji(e, t) {
	return {
		_t: e._t / t,
		ut: e.ut / t
	};
}
function Mi(e, t, n) {
	let r = Math.max(0, t - 1), i = Math.min(e.length - 1, n + 1);
	var a, o;
	return [(a = e[t], o = ji(Ai(e[n], e[r]), ki), {
		_t: a._t + o._t,
		ut: a.ut + o.ut
	}), Ai(e[n], ji(Ai(e[i], e[t]), ki))];
}
function Ni(e, t) {
	let n = e.context;
	n.strokeStyle = t, n.stroke();
}
var Pi = class extends B {
	constructor() {
		super(...arguments), this.rt = null;
	}
	ht(e) {
		this.rt = e;
	}
	et(e) {
		if (this.rt === null) return;
		let { ot: t, lt: n, Cb: r, yb: i, ct: a, Gt: o, Pb: s } = this.rt;
		if (n === null) return;
		let c = e.context;
		c.lineCap = "butt", c.lineWidth = a * e.verticalPixelRatio;
		let l = S(c, o);
		c.lineJoin = "round";
		let u = this.kb.bind(this), d = function(e) {
			return e.reduce(((e, t) => e + t), 0);
		}(l);
		i !== void 0 && Oi(e, t, i, n, r, u, Ni, d), s && function(e, t, n, r, i) {
			if (r.to - r.from <= 0) return;
			let { horizontalPixelRatio: a, verticalPixelRatio: o, context: s } = e, c = null, l = Math.max(1, Math.floor(a)) % 2 / 2, u = n * o + l;
			for (let n = r.to - 1; n >= r.from; --n) {
				let r = t[n];
				if (r) {
					let t = i(e, r);
					t !== c && (c !== null && s.fill(), s.beginPath(), s.fillStyle = t, c = t);
					let n = Math.round(r._t * a) + l, d = r.ut * o;
					s.moveTo(n, d), s.arc(n, d, u, 0, 2 * Math.PI);
				}
			}
			s.fill();
		}(e, t, s, n, u);
	}
}, Fi = class extends Pi {
	kb(e, t) {
		return t.vt;
	}
};
function Ii(e, t, n, r, i) {
	let a = 1 - i;
	return a * a * a * e + 3 * a * a * i * t + 3 * a * i * i * n + i * i * i * r;
}
function Li(e, t, n, r, i) {
	if (n === 2) {
		let [n, a] = Mi(r, i - 1, i);
		return [Math.min(e._t, t._t, n._t, a._t), Math.max(e._t, t._t, n._t, a._t)];
	}
	return [Math.min(e._t, t._t), Math.max(e._t, t._t)];
}
function Ri(e, t, n, r, i, a, o, s) {
	switch (i) {
		case 1: {
			let i = Br(e, t, n._t, n.ut, r._t, n.ut), a = Br(e, t, r._t, n.ut, r._t, r.ut), o = Math.min(i, a);
			return o <= s ? o : null;
		}
		case 2: {
			let [i, c] = Mi(a, o - 1, o), l = function(e, t, n) {
				let r = Infinity, i = n[0];
				for (let a = 1; a <= 12; a++) {
					let o = a / 12, s = {
						_t: Ii(n[0]._t, n[1]._t, n[2]._t, n[3]._t, o),
						ut: Ii(n[0].ut, n[1].ut, n[2].ut, n[3].ut, o)
					};
					r = Math.min(r, Br(e, t, i._t, i.ut, s._t, s.ut)), i = s;
				}
				return r;
			}(e, t, [
				n,
				i,
				c,
				r
			]);
			return l <= s ? l : null;
		}
		default: {
			let i = Br(e, t, n._t, n.ut, r._t, r.ut);
			return i <= s ? i : null;
		}
	}
}
var zi = class extends Jr {
	constructor(e, t) {
		super(e, t, !0);
	}
	Og(e, t, n) {
		t.Ic(this.kg, ne(this.Tg)), e.Jo(this.kg, n, ne(this.Tg));
	}
	Tb(e, t) {
		return {
			wt: e,
			Mt: t,
			_t: NaN,
			ut: NaN
		};
	}
	Lg() {
		let e = this.ae.Sa();
		this.kg = this.ae.Ua().Bh().map(((t) => {
			let n;
			if ((t.Gr ?? 1) > 1) {
				let e = t.Wt[1], r = t.Wt[2], i = t.Wt[3];
				n = Math.abs(e - i) > Math.abs(r - i) ? e : r;
			} else n = t.Wt[3];
			return this.Rb(t.$n, n, e);
		}));
	}
}, Bi = class extends zi {
	Bg(e, t) {
		let n = this.ae.N();
		return function(e, t, n, r, i, a, o, s = 0, c = 0) {
			if (t === null || t.from >= t.to || e.length === 0) return null;
			let l = Math.max(a / 2, o ?? 0) + c, u = Infinity;
			if (o !== void 0) {
				let i = o + c, a = Ir(e, n - i, t.from, t.to), s = Lr(e, n + i, a, t.to);
				for (let t = a; t < s; t++) {
					let i = e[t];
					if (!zr(n, i._t, i._t, o + c)) continue;
					let a = Math.hypot(n - i._t, r - i.ut);
					a <= o + c && (u = Math.min(u, a));
				}
			}
			if (t.to - t.from < 2) {
				let i = e[t.from], a = Math.max(s / 2, l), o = Br(n, r, i._t - a, i.ut, i._t + a, i.ut);
				return o <= l && (u = Math.min(u, o)), Number.isFinite(u) ? Rr(u, 2, "series-point") : null;
			}
			let d = Infinity, f = Ir(e, n - l, t.from, t.to), p = Lr(e, n + l, f, t.to), m = Math.max(t.from + 1, f), h = Math.min(t.to, p + 1);
			for (let t = m; t < h; t++) {
				let a = e[t - 1], o = e[t], [s, c] = Li(a, o, i, e, t);
				if (!zr(n, s, c, l)) continue;
				let u = Ri(n, r, a, o, i, e, t, l);
				u !== null && (d = Math.min(d, u));
			}
			return Number.isFinite(u) ? Rr(u, 2, "series-point") : Number.isFinite(d) ? Rr(d, 1, "series-line") : null;
		}(this.kg, this.Tg, e, t, n.lineType, n.lineVisible ? n.lineWidth : 1, n.pointMarkersVisible ? n.pointMarkersRadius || n.lineWidth / 2 + 2 : void 0, this.le.Et().ml(), n.hitTestTolerance);
	}
}, Vi = class extends Bi {
	constructor() {
		super(...arguments), this.Vg = new Fi();
	}
	Rb(e, t, n) {
		return {
			...this.Tb(e, t),
			...n.Sh(e)
		};
	}
	Ng() {
		let e = this.ae.N(), t = {
			ot: this.kg,
			Gt: e.lineStyle,
			yb: e.lineVisible ? e.lineType : void 0,
			ct: e.lineWidth,
			Pb: e.pointMarkersVisible ? e.pointMarkersRadius || e.lineWidth / 2 + 2 : void 0,
			lt: this.Tg,
			Cb: this.le.Et().ml()
		};
		this.Vg.ht(t);
	}
}, Hi = {
	type: "Line",
	isBuiltIn: !0,
	defaultOptions: {
		color: "#2196f3",
		lineStyle: 0,
		lineWidth: 3,
		lineType: 0,
		lineVisible: !0,
		crosshairMarkerVisible: !0,
		crosshairMarkerRadius: 4,
		crosshairMarkerBorderColor: "",
		crosshairMarkerBorderWidth: 2,
		crosshairMarkerBackgroundColor: "",
		lastPriceAnimation: 0,
		pointMarkersVisible: !1
	},
	mb: (e, t) => new Vi(e, t)
}, Ui = class extends Jr {
	constructor(e, t) {
		super(e, t, !1);
	}
	Bg(e, t) {
		return Wr(this.kg, this.Tg, e, t, this.le.Et().ml(), this.ae.N().hitTestTolerance, ((e, t) => {
			t[0] = e.n_, t[1] = e.s_;
		}));
	}
	Og(e, t, n) {
		t.Ic(this.kg, ne(this.Tg)), e.t_(this.kg, n, ne(this.Tg));
	}
	fS(e, t, n) {
		return {
			wt: e,
			jr: t.Wt[0],
			qr: t.Wt[1],
			Yr: t.Wt[2],
			Kr: t.Wt[3],
			_t: NaN,
			i_: NaN,
			n_: NaN,
			s_: NaN,
			e_: NaN
		};
	}
	Lg() {
		let e = this.ae.Sa();
		this.kg = this.ae.Ua().Bh().map(((t) => this.Rb(t.$n, t, e)));
	}
}, Wi = class extends B {
	constructor() {
		super(...arguments), this.qt = null, this.oS = 0;
	}
	ht(e) {
		this.qt = e;
	}
	et(e) {
		if (this.qt === null || this.qt.Un.length === 0 || this.qt.lt === null) return;
		let { horizontalPixelRatio: t } = e;
		this.oS = function(e, t) {
			if (e >= 2.5 && e <= 4) return Math.floor(3 * t);
			let n = 1 - .2 * Math.atan(Math.max(4, e) - 4) / (.5 * Math.PI), r = Math.floor(e * n * t), i = Math.floor(e * t);
			return Math.max(Math.floor(t), Math.min(r, i));
		}(this.qt.ml, t), this.oS >= 2 && Math.floor(t) % 2 != this.oS % 2 && this.oS--;
		let n = this.qt.Un;
		this.qt.pS && this.vS(e, n, this.qt.lt), this.qt.gi && this.Vm(e, n, this.qt.lt);
		let r = this.mS(t);
		(!this.qt.gi || this.oS > 2 * r) && this.wS(e, n, this.qt.lt);
	}
	vS(e, t, n) {
		if (this.qt === null) return;
		let { context: r, horizontalPixelRatio: i, verticalPixelRatio: a } = e, o = "", s = Math.min(Math.floor(i), Math.floor(this.qt.ml * i));
		s = Math.max(Math.floor(i), Math.min(s, this.oS));
		let c = Math.floor(.5 * s), l = null;
		for (let e = n.from; e < n.to; e++) {
			let n = t[e];
			n.rh !== o && (r.fillStyle = n.rh, o = n.rh);
			let u = Math.round(Math.min(n.i_, n.e_) * a), d = Math.round(Math.max(n.i_, n.e_) * a), f = Math.round(n.n_ * a), p = Math.round(n.s_ * a), m = Math.round(i * n._t) - c, h = m + s - 1;
			l !== null && (m = Math.max(l + 1, m), m = Math.min(m, h));
			let g = h - m + 1;
			r.fillRect(m, f, g, u - f), r.fillRect(m, d + 1, g, p - d), l = h;
		}
	}
	mS(e) {
		let t = Math.floor(1 * e);
		this.oS <= 2 * t && (t = Math.floor(.5 * (this.oS - 1)));
		let n = Math.max(Math.floor(e), t);
		return this.oS <= 2 * n ? Math.max(Math.floor(e), Math.floor(1 * e)) : n;
	}
	Vm(e, t, n) {
		if (this.qt === null) return;
		let { context: r, horizontalPixelRatio: i, verticalPixelRatio: a } = e, o = "", s = this.mS(i), c = null;
		for (let e = n.from; e < n.to; e++) {
			let n = t[e];
			n.eh !== o && (r.fillStyle = n.eh, o = n.eh);
			let l = Math.round(n._t * i) - Math.floor(.5 * this.oS), u = l + this.oS - 1, d = Math.round(Math.min(n.i_, n.e_) * a), f = Math.round(Math.max(n.i_, n.e_) * a);
			if (c !== null && (l = Math.max(c + 1, l), l = Math.min(l, u)), this.qt.ml * i > 2 * s) U(r, l, d, u - l + 1, f - d + 1, s);
			else {
				let e = u - l + 1;
				r.fillRect(l, d, e, f - d + 1);
			}
			c = u;
		}
	}
	wS(e, t, n) {
		if (this.qt === null) return;
		let { context: r, horizontalPixelRatio: i, verticalPixelRatio: a } = e, o = "", s = this.mS(i);
		for (let e = n.from; e < n.to; e++) {
			let n = t[e], c = Math.round(Math.min(n.i_, n.e_) * a), l = Math.round(Math.max(n.i_, n.e_) * a), u = Math.round(n._t * i) - Math.floor(.5 * this.oS), d = u + this.oS - 1;
			if (n.sh !== o) {
				let e = n.sh;
				r.fillStyle = e, o = e;
			}
			this.qt.gi && (u += s, c += s, d -= s, l -= s), c > l || r.fillRect(u, c, d - u + 1, l - c + 1);
		}
	}
}, Gi = class extends Ui {
	constructor() {
		super(...arguments), this.Vg = new Wi();
	}
	Rb(e, t, n) {
		return {
			...this.fS(e, t, n),
			...n.Sh(e)
		};
	}
	Ng() {
		let e = this.ae.N();
		this.Vg.ht({
			Un: this.kg,
			ml: this.le.Et().ml(),
			pS: e.wickVisible,
			gi: e.borderVisible,
			lt: this.Tg
		});
	}
}, Ki = {
	type: "Candlestick",
	isBuiltIn: !0,
	defaultOptions: {
		upColor: "#26a69a",
		downColor: "#ef5350",
		wickVisible: !0,
		borderVisible: !0,
		borderColor: "#378658",
		borderUpColor: "#26a69a",
		borderDownColor: "#ef5350",
		wickColor: "#737375",
		wickUpColor: "#26a69a",
		wickDownColor: "#ef5350"
	},
	mb: (e, t) => new Gi(e, t)
}, qi = class extends B {
	constructor() {
		super(...arguments), this.qt = null, this.MS = [];
	}
	ht(e) {
		this.qt = e, this.MS = [];
	}
	et({ context: e, horizontalPixelRatio: t, verticalPixelRatio: n }) {
		if (this.qt === null || this.qt.ot.length === 0 || this.qt.lt === null) return;
		this.MS.length || this.gS(t);
		let r = Math.max(1, Math.floor(n)), i = Math.round(this.qt.bS * n) - Math.floor(r / 2), a = i + r;
		for (let t = this.qt.lt.from; t < this.qt.lt.to; t++) {
			let o = this.qt.ot[t], s = this.MS[t - this.qt.lt.from], c = Math.round(o.ut * n), l, u;
			e.fillStyle = o.sh, c <= i ? (l = c, u = a) : (l = i, u = c - Math.floor(r / 2) + r), e.fillRect(s.Na, l, s.bi - s.Na + 1, u - l);
		}
	}
	gS(e) {
		if (this.qt === null || this.qt.ot.length === 0 || this.qt.lt === null) return void (this.MS = []);
		let t = Math.ceil(this.qt.ml * e) <= 1 ? 0 : Math.max(1, Math.floor(e)), n = Math.round(this.qt.ml * e) - t;
		this.MS = Array(this.qt.lt.to - this.qt.lt.from);
		for (let t = this.qt.lt.from; t < this.qt.lt.to; t++) {
			let r = this.qt.ot[t], i = Math.round(r._t * e), a, o;
			if (n % 2) {
				let e = (n - 1) / 2;
				a = i - e, o = i + e;
			} else {
				let e = n / 2;
				a = i - e, o = i + e - 1;
			}
			this.MS[t - this.qt.lt.from] = {
				Na: a,
				bi: o,
				SS: i,
				ce: r._t * e,
				wt: r.wt
			};
		}
		for (let e = this.qt.lt.from + 1; e < this.qt.lt.to; e++) {
			let n = this.MS[e - this.qt.lt.from], r = this.MS[e - this.qt.lt.from - 1];
			n.wt === r.wt + 1 && n.Na - r.bi !== t + 1 && (r.SS > r.ce ? r.bi = n.Na - t - 1 : n.Na = r.bi + t + 1);
		}
		let r = Math.ceil(this.qt.ml * e);
		for (let e = this.qt.lt.from; e < this.qt.lt.to; e++) {
			let t = this.MS[e - this.qt.lt.from];
			t.bi < t.Na && (t.bi = t.Na);
			let n = t.bi - t.Na + 1;
			r = Math.min(n, r);
		}
		if (t > 0 && r < 4) for (let e = this.qt.lt.from; e < this.qt.lt.to; e++) {
			let t = this.MS[e - this.qt.lt.from];
			t.bi - t.Na + 1 > r && (t.SS > t.ce ? --t.bi : t.Na += 1);
		}
	}
}, Ji = class extends zi {
	constructor() {
		super(...arguments), this.Vg = new qi();
	}
	Bg(e, t) {
		let n = this.ae.Ft().Nt(this.ae.N().base, E(this.ae.Lt()).Wt);
		return n === null ? null : Wr(this.kg, this.Tg, e, t, this.le.Et().ml(), this.ae.N().hitTestTolerance, ((e, t) => {
			t[0] = e.ut, t[1] = n;
		}));
	}
	Rb(e, t, n) {
		return {
			...this.Tb(e, t),
			...n.Sh(e)
		};
	}
	Ng() {
		let e = {
			ot: this.kg,
			ml: this.le.Et().ml(),
			lt: this.Tg,
			bS: this.ae.Ft().Nt(this.ae.N().base, E(this.ae.Lt()).Wt)
		};
		this.Vg.ht(e);
	}
}, Yi = {
	type: "Histogram",
	isBuiltIn: !0,
	defaultOptions: {
		color: "#26a69a",
		base: 0
	},
	mb: (e, t) => new Ji(e, t)
};
({ ...y });
//#endregion
//#region src/house/chart/studies.ts
function Xi(e, t = 14) {
	let n = Array(e.length).fill(null);
	if (e.length <= t) return n;
	let r = 0, i = 0;
	for (let n = 1; n <= t; n++) {
		let t = e[n] - e[n - 1];
		t >= 0 ? r += t : i -= t;
	}
	r /= t, i /= t;
	let a = () => i === 0 ? r === 0 ? 50 : 100 : 100 - 100 / (1 + r / i);
	n[t] = a();
	for (let o = t + 1; o < e.length; o++) {
		let s = e[o] - e[o - 1];
		r = (r * (t - 1) + (s > 0 ? s : 0)) / t, i = (i * (t - 1) + (s < 0 ? -s : 0)) / t, n[o] = a();
	}
	return n;
}
function Zi(e, t, n) {
	let r = (e + t + n) / 3;
	return {
		p: r,
		r1: 2 * r - t,
		s1: 2 * r - e,
		r2: r + (e - t),
		s2: r - (e - t),
		r3: e + 2 * (r - t),
		s3: t - 2 * (e - r)
	};
}
function Qi(e, t = 32, n = .7) {
	if (!e.length) return null;
	let r = Infinity, i = -Infinity;
	for (let t of e) t.low < r && (r = t.low), t.high > i && (i = t.high);
	if (!(i > r)) return null;
	let a = (i - r) / t, o = Array(t).fill(0), s = 0;
	for (let n of e) {
		let e = n.volume;
		if (!(e > 0)) continue;
		let i = Math.min(t - 1, Math.max(0, Math.floor((n.low - r) / a))), c = Math.min(t - 1, Math.max(0, Math.floor((n.high - r) / a))), l = e / (c - i + 1);
		for (let e = i; e <= c; e++) o[e] += l;
		s += e;
	}
	if (s <= 0) return null;
	let c = 0;
	for (let e = 1; e < t; e++) o[e] > o[c] && (c = e);
	let l = Array(t).fill(!1);
	l[c] = !0;
	let u = o[c], d = c + 1, f = c - 1;
	for (; u < s * n && (d < t || f >= 0);) if ((d < t ? o[d] + (d + 1 < t ? o[d + 1] : 0) : -1) >= (f >= 0 ? o[f] + (f - 1 >= 0 ? o[f - 1] : 0) : -1)) for (let e = 0; e < 2 && d < t; e++) l[d] = !0, u += o[d], d++;
	else for (let e = 0; e < 2 && f >= 0; e++) l[f] = !0, u += o[f], f--;
	let p = o.map((e, t) => ({
		lo: r + t * a,
		hi: r + (t + 1) * a,
		vol: e,
		va: l[t]
	})), m = p.filter((e) => e.va);
	return {
		rows: p,
		pocIdx: c,
		poc: (p[c].lo + p[c].hi) / 2,
		max: o[c],
		val: m[0].lo,
		vah: m[m.length - 1].hi
	};
}
var $i = [
	0,
	.236,
	.382,
	.5,
	.618,
	.786,
	1,
	1.618
], ea = (e, t, n) => t + (e - t) * n;
function ta(e, t) {
	let n = Math.max(0, 6 - t), r = e > 0 ? 10 ** (Math.floor(Math.log10(e)) - 4) : 0;
	return Math.max(10 ** -n, r);
}
var na = (e, t) => {
	let n = Math.round(e / t) * t, r = Math.max(0, Math.ceil(-Math.log10(t) - 1e-9));
	return +n.toFixed(Math.min(10, r));
};
function ra(e) {
	let t = Math.abs(e), n = Math.floor(t / 86400), r = Math.floor(t % 86400 / 3600), i = Math.floor(t % 3600 / 60);
	return n ? `${n}d ${r}h` : r ? `${r}h ${i}m` : `${i}m`;
}
//#endregion
//#region src/house/chart/chart.css?inline
var ia = ".house-root #chart.hc-host{gap:4px;display:flex;position:relative}.house-root .hc-plot{flex:1;min-width:0;position:relative;overflow:hidden}.house-root .hc-tools{z-index:2;flex-direction:column;flex:none;gap:3px;width:30px;padding:2px 0;display:flex}.house-root .hc-tools button{cursor:pointer;width:28px;height:28px;color:var(--ink-3);background:0 0;border:1px solid #0000;border-radius:5px;place-items:center;padding:0;display:grid}.house-root .hc-tools button svg{fill:none;stroke:currentColor;stroke-width:1.5px;stroke-linecap:round;stroke-linejoin:round;width:16px;height:16px}.house-root .hc-tools button:hover{color:var(--ink);border-color:var(--line-soft)}.house-root .hc-tools button.on{color:var(--gold-hi);border-color:var(--line);background:#d4b06a1a}.house-root .hc-tools .sep{background:var(--line-soft);height:1px;margin:3px 4px}.house-root[data-mode=advanced] .hc-tools button.on{color:var(--ink);border-color:var(--line);background:#ffffff0f}.house-root .hc-chips{border-left:1px solid var(--line-soft);gap:4px;margin-left:10px;padding-left:10px;display:flex}.house-root .hc-chips button{border:1px solid var(--line-soft);cursor:pointer;font:600 10.5px/1 var(--f-num);letter-spacing:.08em;color:var(--ink-3);background:0 0;border-radius:4px;padding:4px 8px}.house-root .hc-chips button:hover{color:var(--ink);border-color:var(--line)}.house-root .hc-chips button.on{color:var(--teal);background:#3fd3c814;border-color:#3fd3c873}.house-root[data-mode=advanced] .hc-chips button.on{color:var(--ink);background:#ffffff0f;border-color:#3a3d48}.house-root .hc-pick{z-index:5;border:1px solid var(--line);font:600 12px/1 var(--f-num);color:var(--ink);white-space:nowrap;background:#080a10f0;border-radius:6px;align-items:center;gap:2px;padding:3px 3px 3px 8px;display:flex;position:absolute;box-shadow:0 6px 22px #0000008c}.house-root .hc-pick b{letter-spacing:.02em;margin-right:4px;font-weight:600}.house-root .hc-pick button{cursor:pointer;width:26px;height:24px;color:var(--ink-2);background:0 0;border:1px solid #0000;border-radius:4px;place-items:center;padding:0;display:grid}.house-root .hc-pick button svg{fill:none;stroke:currentColor;stroke-width:1.5px;stroke-linecap:round;stroke-linejoin:round;width:15px;height:15px}.house-root .hc-pick button:hover{border-color:var(--line);background:#ffffff0f}.house-root .hc-pick button[data-f=price]:hover{color:var(--gold-hi)}.house-root .hc-pick button[data-f=stop]:hover{color:var(--dn)}.house-root .hc-pick button[data-f=target]:hover{color:var(--up)}.house-root[data-mode=advanced] .hc-pick{background:#12131a;border-color:#2a2c36}.house-root[data-mode=game] .hc-tools{background:#060a12d9;border:1px solid #d4b06a47;border-radius:6px;align-self:flex-start;gap:4px;width:36px;padding:6px 3px}.house-root[data-mode=game] .hc-tools button{color:#cdbf9c;width:30px;height:30px}.house-root[data-mode=game] .hc-tools button svg{stroke-width:1.8px;width:19px;height:19px}.house-root[data-mode=game] .hc-tools button:hover{color:var(--gold-hi);background:#d4b06a14}.house-root[data-mode=game] .hc-tools button.on{color:#06070b;background:linear-gradient(#f1dcaa,#c9a15a);border-color:#f1dcaa;box-shadow:0 0 10px #f1dcaa59}", aa = [
	"1m",
	"5m",
	"15m",
	"1h",
	"4h",
	"1d",
	"1w"
], oa = "paper-arena:v0:chart", sa = "paper-arena:v0:drawings", ca = 1e3, la = {
	game: {
		text: "#b9ae97",
		up: "#57d6a3",
		dn: "#e2875a",
		accent: "#f1dcaa",
		teal: "#3fd3c8",
		faint: "rgba(241,220,170,.5)",
		font: "Barlow Condensed, sans-serif",
		fontPx: 13,
		grid: "rgba(212,176,106,0.10)",
		edge: "rgba(212,176,106,0.30)",
		vaBar: "rgba(63,211,200,.34)",
		outBar: "rgba(212,176,106,.20)",
		poc: "#f1dcaa",
		pivP: "#f1dcaa",
		pivR: "#e2875a",
		pivS: "#57d6a3",
		fib: [
			"#9c8d6a",
			"#e2875a",
			"#e0b25a",
			"#d4b06a",
			"#3fd3c8",
			"#57d6a3",
			"#9c8d6a"
		],
		extFib: "#9fdcff",
		draw: "#f1dcaa",
		entry: "#efe6d2",
		liq: "#e0b25a",
		planEntry: "#d4b06a"
	},
	advanced: {
		text: "#8b8c96",
		up: "#4fd1a1",
		dn: "#ef8a62",
		accent: "#d5d7e0",
		teal: "#7f8ba8",
		faint: "rgba(200,204,220,.45)",
		font: "JetBrains Mono, monospace",
		fontPx: 11,
		grid: "rgba(255,255,255,0.05)",
		edge: "#23252d",
		vaBar: "rgba(138,150,185,.34)",
		outBar: "rgba(138,150,185,.14)",
		poc: "#e8e8ec",
		pivP: "#c8cad6",
		pivR: "#b08a7a",
		pivS: "#7aa595",
		fib: [
			"#7c7e8a",
			"#8b8c96",
			"#9a9ca8",
			"#aeb0bb",
			"#d5d7e0",
			"#aeb0bb",
			"#7c7e8a"
		],
		extFib: "#8a96b8",
		draw: "#c8cad6",
		entry: "#e8e8ec",
		liq: "#c9a560",
		planEntry: "#a2a3ad"
	}
}, ua = {
	cursor: "<path d=\"M5 3l12 8-5.2 1.3L9.5 18z\"/>",
	hline: "<path d=\"M3 12h18\"/><circle cx=\"12\" cy=\"12\" r=\"1.6\"/>",
	trend: "<path d=\"M4 18L20 6\"/><circle cx=\"4\" cy=\"18\" r=\"1.6\"/><circle cx=\"20\" cy=\"6\" r=\"1.6\"/>",
	fib: "<path d=\"M3 5h18M3 10h18M3 14h18M3 19h18\" /><path d=\"M7 5v14\" opacity=\".6\"/>",
	measure: "<path d=\"M3 17L17 3l4 4L7 21z\"/><path d=\"M7 13l2 2M10 10l2 2M13 7l2 2\"/>",
	price: "<path d=\"M3 12h13\"/><path d=\"M12 8l4 4-4 4\"/><path d=\"M20 5v14\" opacity=\".5\"/>",
	stop: "<path d=\"M3 11h18\"/><path d=\"M12 11v8M8.5 15.5 12 19l3.5-3.5\"/>",
	target: "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><circle cx=\"12\" cy=\"12\" r=\"4.5\"/><circle cx=\"12\" cy=\"12\" r=\"1\" fill=\"currentColor\"/>"
}, da = (e) => `<svg viewBox="0 0 24 24" aria-hidden="true">${e}</svg>`, fa = () => Math.random().toString(36).slice(2, 9), pa = (e) => {
	let t = e >= 1e3 ? 1 : e >= 100 ? 2 : e >= 1 ? 3 : e >= .01 ? 5 : 7;
	return e.toLocaleString("en-US", {
		minimumFractionDigits: t,
		maximumFractionDigits: t
	});
}, ma = (e, t = 0) => `${e < 0 ? "-" : "+"}$${Math.abs(e).toLocaleString("en-US", {
	minimumFractionDigits: t,
	maximumFractionDigits: t
})}`;
async function ha(e) {
	let t = !1, n = [], r = (e, t, r, i) => {
		e.addEventListener(t, r, i), n.push(() => e.removeEventListener(t, r, i));
	}, a = {
		vol: !0,
		rsi: !0,
		piv: !1,
		vp: !1
	};
	try {
		let t = await e.store.get(oa);
		t && typeof t == "object" && (a = {
			...a,
			...t
		});
	} catch {}
	let s = {};
	try {
		let t = await e.store.get(sa);
		t && typeof t == "object" && (s = t);
	} catch {}
	let c = 0, l = () => {
		clearTimeout(c), c = 0, e.store.set(sa, JSON.parse(JSON.stringify(s))).catch(() => {});
	}, u = () => {
		clearTimeout(c), c = window.setTimeout(l, 350);
	}, d = () => {
		e.store.set(oa, { ...a }).catch(() => {});
	};
	e.host.classList.add("hc-host");
	let f = document.createElement("div");
	f.className = "hc-tools";
	let p = document.createElement("div");
	p.className = "hc-plot", e.host.replaceChildren(f, p);
	let m = document.createElement("div");
	m.className = "hc-chips", m.innerHTML = [
		[
			"vol",
			"VOL",
			"Volume"
		],
		[
			"rsi",
			"RSI",
			"RSI 14"
		],
		[
			"piv",
			"PIV",
			"Pivot points"
		],
		[
			"vp",
			"VP",
			"Volume profile"
		]
	].map(([e, t, n]) => `<button data-k="${e}" title="${n}">${t}</button>`).join("");
	let h = e.bar.querySelector("#conn");
	e.bar.insertBefore(m, h);
	let g = () => la[e.mode()], _ = Ei(p, {
		autoSize: !0,
		crosshair: { mode: 0 },
		timeScale: {
			timeVisible: !0,
			secondsVisible: !1,
			minBarSpacing: .4,
			rightOffset: 6
		},
		layout: {
			attributionLogo: !1,
			panes: {
				separatorColor: "rgba(212,176,106,0.18)",
				separatorHoverColor: "rgba(212,176,106,0.4)",
				enableResize: !0
			}
		}
	}), v = _.addSeries(Ki, {
		upColor: "#57d6a3",
		downColor: "#e2875a",
		borderVisible: !1,
		wickUpColor: "#57d6a3",
		wickDownColor: "#e2875a"
	}), y = null, b = null, S = [], C = e.coin(), w = e.interval(), T = i[w] / 1e3, E = 0, D = !1, O = !1, k = () => S.map((e) => ({
		time: e.time,
		open: e.open,
		high: e.high,
		low: e.low,
		close: e.close
	})), A = (e) => e.close >= e.open ? "rgba(87,214,163,.42)" : "rgba(226,135,90,.42)", j = (e) => ({
		time: e.time,
		value: e.volume,
		color: A(e)
	});
	function M() {
		let e = _.panes(), t = [];
		y && t.push(12), b && t.push(18);
		let n = t.length === 2 ? 70 : t.length === 1 ? y ? 82 : 78 : 100;
		e[0]?.setStretchFactor(n), t.forEach((t, n) => e[n + 1]?.setStretchFactor(t));
	}
	function ee() {
		y &&= (_.removeSeries(y), null), b &&= (_.removeSeries(b), null);
		let e = 1;
		if (a.vol && (y = _.addSeries(Yi, {
			priceFormat: { type: "volume" },
			priceLineVisible: !1,
			lastValueVisible: !1,
			title: "VOL"
		}, e++), y.setData(S.map(j))), a.rsi) {
			b = _.addSeries(Hi, {
				color: g().accent,
				lineWidth: 1,
				priceLineVisible: !1,
				lastValueVisible: !0,
				title: "RSI",
				priceFormat: {
					type: "price",
					precision: 0,
					minMove: 1
				},
				autoscaleInfoProvider: () => ({ priceRange: {
					minValue: 0,
					maxValue: 100
				} })
			}, e++), b.priceScale().applyOptions({ scaleMargins: {
				top: .1,
				bottom: .1
			} });
			for (let [e, t] of [[70, "dn"], [30, "up"]]) b.createPriceLine({
				price: e,
				color: g()[t],
				lineWidth: 1,
				lineStyle: x.Dashed,
				axisLabelVisible: !1,
				title: ""
			});
			N();
		}
		M(), ne(), Pe.update();
	}
	function N() {
		if (!b) return;
		let e = Xi(S.map((e) => e.close)), t = [];
		e.forEach((e, n) => {
			e != null && t.push({
				time: S[n].time,
				value: e
			});
		}), b.setData(t);
	}
	function te() {
		v.setData(k()), y?.setData(S.map(j)), N();
	}
	function ne() {
		let e = g();
		_.applyOptions({
			layout: {
				background: { color: "transparent" },
				textColor: e.text,
				fontFamily: e.font,
				fontSize: e.fontPx,
				panes: {
					separatorColor: e.edge,
					separatorHoverColor: e.accent
				}
			},
			grid: {
				vertLines: { color: e.grid },
				horzLines: { color: e.grid }
			},
			rightPriceScale: { borderColor: e.edge },
			timeScale: { borderColor: e.edge }
		}), v.applyOptions({
			upColor: e.up,
			downColor: e.dn,
			wickUpColor: e.up,
			wickDownColor: e.dn
		}), b?.applyOptions({ color: e.accent });
	}
	function P(e) {
		let t = S.length;
		if (!t) return 0;
		if (e >= S[t - 1].time) return t - 1 + (e - S[t - 1].time) / T;
		if (e <= S[0].time) return (e - S[0].time) / T;
		let n = 0, r = t - 1;
		for (; r - n > 1;) {
			let t = n + r >> 1;
			S[t].time <= e ? n = t : r = t;
		}
		return n + (e - S[n].time) / (S[r].time - S[n].time);
	}
	function F(e) {
		let t = S.length;
		if (!t) return Date.now() / 1e3;
		if (e >= t - 1) return S[t - 1].time + (e - (t - 1)) * T;
		if (e <= 0) return S[0].time + e * T;
		let n = Math.floor(e);
		return S[n].time + (e - n) * (S[n + 1].time - S[n].time);
	}
	let re = (e) => _.timeScale().logicalToCoordinate(P(e)), I = (e) => v.priceToCoordinate(e), L = () => _.timeScale().width(), R = () => _.panes()[0]?.getHeight() ?? 0, z = (e, t) => {
		let n = _.timeScale().coordinateToLogical(e), r = v.coordinateToPrice(t);
		return n == null || r == null ? null : {
			t: F(n),
			p: r
		};
	}, B = () => ta(S.length ? S[S.length - 1].close : 1, e.szDecimals()), ie = (e) => na(e, B()), V = null, H = null, ae = 0, oe = 0;
	async function se(e) {
		let n = Date.now();
		try {
			let [r, i] = await Promise.all([o(C, "1d", n - 10368e5, n), o(C, "1w", n - 24192e5, n)]);
			if (t || e !== E) return;
			let a = (e) => e.length >= 2 ? e[e.length - 2] : null, s = a(r), c = a(i);
			V = s ? Zi(s.high, s.low, s.close) : null, ae = r.length ? r[r.length - 1].time : 0, H = c ? Zi(c.high, c.low, c.close) : null, oe = i.length ? i[i.length - 1].time : 0, Pe.update();
		} catch {}
	}
	let U = (e, t) => {
		let n = /* @__PURE__ */ new Map();
		for (let t of e) n.set(t.time, t);
		for (let e of t) n.set(e.time, e);
		return [...n.values()].sort((e, t) => e.time - t.time);
	};
	function ce() {
		let t = ta(S.length ? S[S.length - 1].close : 1, e.szDecimals()), n = Math.max(0, Math.min(10, Math.ceil(-Math.log10(t) - 1e-9)));
		v.applyOptions({ priceFormat: {
			type: "price",
			precision: n,
			minMove: t
		} });
	}
	async function le() {
		if (t) return;
		let n = ++E;
		C = e.coin(), w = e.interval(), T = (i[w] ?? 36e5) / 1e3, D = !1, O = !1, he = s[C] ?? [], ge = null, K = null, J(), V = H = null;
		let r = Date.now();
		try {
			let e = await o(C, w, r - ca * T * 1e3, r);
			if (t || n !== E) return;
			S = U([], e), te(), ce();
			let i = S.length;
			_.timeScale().setVisibleLogicalRange({
				from: Math.max(-2, i - 130),
				to: i + 6
			}), se(n), G(!0), Pe.update();
		} catch {}
	}
	async function W() {
		if (O || D || !S.length || t) return;
		O = !0;
		let e = E;
		try {
			let n = ca * T * 1e3, r = S[0].time * 1e3 - 1, i = [];
			for (let a = 0; a < 3 && !i.length; a++) if (i = (await o(C, w, r - n, r)).filter((e) => e.time < S[0].time), r -= n, t || e !== E) return;
			if (!i.length) {
				D = !0;
				return;
			}
			let a = _.timeScale().getVisibleLogicalRange(), s = S.length;
			S = U(i, S);
			let c = S.length - s;
			te(), a && c > 0 && _.timeScale().setVisibleLogicalRange({
				from: a.from + c,
				to: a.to + c
			}), Pe.update();
		} catch {} finally {
			O = !1;
		}
	}
	function ue(e, n, r) {
		if (t || e !== C || n !== w || !S.length) return;
		let i = S[S.length - 1];
		if (!(r.time < i.time) && (r.time === i.time ? S[S.length - 1] = r : S.push(r), v.update({
			time: r.time,
			open: r.open,
			high: r.high,
			low: r.low,
			close: r.close
		}), y?.update(j(r)), b)) {
			let e = Xi(S.map((e) => e.close)), t = e[e.length - 1];
			t != null && b.update({
				time: r.time,
				value: t
			});
		}
	}
	let de = [], fe = "", pe = !1;
	function G(n = !1) {
		if (t || pe) return;
		let r = e.state(), i = e.hooks(), a = g(), o = [], s = r.position;
		if (s) {
			let e = s.side === "long" ? 1 : -1, t = (t) => (t - s.entry) * s.qty * e;
			o.push({
				key: "entry",
				price: s.entry,
				color: a.entry,
				title: `ENTRY ${s.side === "long" ? "LONG" : "SHORT"}`,
				style: 0
			}), s.stop != null && o.push({
				key: "stop",
				price: s.stop,
				color: a.dn,
				title: `STOP ${ma(t(s.stop))}`,
				style: 2,
				kind: "stop",
				commit: (e) => i.setStop(r.coin, e)
			}), s.target != null && o.push({
				key: "target",
				price: s.target,
				color: a.up,
				title: `TARGET ${ma(t(s.target))}`,
				style: 2,
				kind: "target",
				commit: (e) => i.setTarget(r.coin, e)
			}), s.liq != null && o.push({
				key: "liq",
				price: s.liq,
				color: a.liq,
				title: "LIQ",
				style: 1
			});
		} else {
			let e = r.plan;
			e.price != null && o.push({
				key: "p-entry",
				price: e.price,
				color: a.planEntry,
				title: "PLAN ENTRY",
				style: 2,
				kind: "plan",
				commit: (e) => i.fillTicket("price", e)
			}), e.stop != null && o.push({
				key: "p-stop",
				price: e.stop,
				color: a.dn,
				title: "PLAN STOP",
				style: 2,
				kind: "plan",
				commit: (e) => i.fillTicket("stop", e)
			}), e.target != null && o.push({
				key: "p-target",
				price: e.target,
				color: a.up,
				title: "PLAN TARGET",
				style: 2,
				kind: "plan",
				commit: (e) => i.fillTicket("target", e)
			}), e.ghostStop != null && e.stop == null && o.push({
				key: "g-stop",
				price: e.ghostStop,
				color: we(a.dn, .55),
				title: "MEASURED STOP",
				style: 3,
				kind: "plan",
				commit: (e) => i.fillTicket("stop", e)
			});
		}
		for (let e of r.orders) {
			let t = /buy|long/i.test(e.side), n = e.type === "stop", r = i.moveOrder;
			o.push({
				key: `o:${e.id}`,
				price: e.price,
				color: n ? a.dn : t ? a.up : a.dn,
				title: `${n ? "STOP" : "LIMIT"} ${t ? "BUY" : "SELL"} ${+e.qty.toPrecision(3)}${e.reduceOnly ? " R" : ""}`,
				style: 3,
				kind: r ? "order" : void 0,
				commit: r ? (t) => r(e.id, t) : void 0
			});
		}
		let c = JSON.stringify([o.map((e) => [
			e.key,
			e.price,
			e.color,
			e.title
		]), e.mode()]);
		if (n || c !== fe) {
			fe = c;
			for (let e of de) try {
				v.removePriceLine(e.line);
			} catch {}
			de = [];
			for (let e of o) {
				let t = v.createPriceLine({
					price: e.price,
					color: e.color,
					lineWidth: 1,
					lineStyle: e.style,
					axisLabelVisible: !0,
					title: e.title
				});
				de.push({
					key: e.key,
					price: e.price,
					line: t,
					title: e.title,
					kind: e.kind ?? "order",
					commit: e.commit ?? (() => {}),
					tag: e.commit ? "drag" : void 0
				});
			}
		}
	}
	let me = () => de.filter((e) => e.tag === "drag"), he = s[C] ?? [], ge = null, _e = null, K = null, ve = () => {
		s[C] = he, u(), Pe.update();
	};
	function ye(e) {
		let t = re(e.a.t), n = I(e.a.p);
		if (t == null || n == null) return null;
		if (e.kind === "hline") return {
			id: e.id,
			kind: e.kind,
			ax: t,
			ay: n,
			bx: t,
			by: n
		};
		if (!e.b) return null;
		let r = re(e.b.t), i = I(e.b.p);
		if (r == null || i == null) return null;
		let a = {
			id: e.id,
			kind: e.kind,
			ax: t,
			ay: n,
			bx: r,
			by: i
		};
		if (e.kind === "fib") {
			a.lv = [];
			for (let t of $i) {
				let n = ea(e.a.p, e.b.p, t), r = I(n);
				r != null && a.lv.push({
					r: t,
					y: r,
					p: n
				});
			}
		}
		return a;
	}
	let be = (e, t, n, r, i, a) => {
		let o = i - n, s = a - r, c = o * o + s * s, l = c ? Math.max(0, Math.min(1, ((e - n) * o + (t - r) * s) / c)) : 0;
		return Math.hypot(e - (n + l * o), t - (r + l * s));
	};
	function xe(e) {
		return {
			x: Math.max(14, Math.min(L() - 14, (e.ax + e.bx) / 2)),
			y: Math.max(16, Math.min(e.ay, e.by) - 14)
		};
	}
	function Se(e, t) {
		if (e < 0 || e > L() || t < 0 || t > R()) return null;
		if (!_e) for (let e of me()) {
			let n = I(e.price);
			if (n != null && Math.abs(n - t) <= 6) return {
				type: "handle",
				h: e
			};
		}
		let n = he.slice().reverse(), r = n.find((e) => e.id === ge);
		if (r) {
			let n = ye(r);
			if (n) {
				let i = xe(n);
				if (Math.hypot(e - i.x, t - i.y) <= 9) return {
					type: "del",
					id: r.id
				};
				if (r.kind !== "hline") {
					if (Math.hypot(e - n.ax, t - n.ay) <= 9) return {
						type: "draw",
						id: r.id,
						part: "a"
					};
					if (Math.hypot(e - n.bx, t - n.by) <= 9) return {
						type: "draw",
						id: r.id,
						part: "b"
					};
				}
			}
		}
		for (let r of n) {
			let n = ye(r);
			if (!n) continue;
			let i = L(), a = !1;
			if (a = n.kind === "hline" ? Math.abs(t - n.ay) <= 6 : n.kind === "trend" ? be(e, t, n.ax, n.ay, n.bx, n.by) <= 6 : n.kind === "fib" ? !!n.lv?.some((r) => Math.abs(r.y - t) <= 5 && e >= Math.min(n.ax, n.bx) - 4 && e <= i) : e >= Math.min(n.ax, n.bx) - 4 && e <= Math.max(n.ax, n.bx) + 4 && t >= Math.min(n.ay, n.by) - 4 && t <= Math.max(n.ay, n.by) + 4, a) return {
				type: "draw",
				id: r.id,
				part: "body"
			};
		}
		return null;
	}
	function Ce(e, t, n, r, i, a, o = "left") {
		e.font = `600 ${g().fontPx - 1}px ${g().font}`;
		let s = e.measureText(t).width + 10, c = o === "left" ? n : o === "right" ? n - s : n - s / 2;
		e.fillStyle = a, e.beginPath(), e.roundRect(c, r - 8, s, 16, 3), e.fill(), e.fillStyle = i, e.textBaseline = "middle", e.textAlign = "left", e.fillText(t, c + 5, r + .5);
	}
	let we = (e, t) => {
		let n = /^#([0-9a-f]{6})$/i.exec(e);
		if (!n) return e;
		let r = parseInt(n[1], 16);
		return `rgba(${r >> 16},${r >> 8 & 255},${r & 255},${t})`;
	}, Te = "", Ee = null;
	function De() {
		let e = _.timeScale().getVisibleLogicalRange();
		if (!e || !S.length) return null;
		let t = Math.max(0, Math.ceil(e.from)), n = Math.min(S.length - 1, Math.floor(e.to));
		if (n <= t) return null;
		let r = `${t}:${n}:${S.length}:${S[n].volume.toFixed(2)}:${S[n].close}`;
		return r !== Te && (Te = r, Ee = Qi(S.slice(t, n + 1), 34)), Ee;
	}
	let Oe = [], ke = [
		.5,
		.618,
		0,
		1,
		.382,
		.786,
		.236,
		1.618
	], Ae = /* @__PURE__ */ new Map(), je = (e) => !Oe.some((t) => Math.abs(t - e) < 11) && (Oe.push(e), !0);
	function Me(t, n, r) {
		let i = g();
		t.save(), Oe = [];
		for (let e of de) {
			let t = I(e.price);
			t != null && Oe.push(t);
		}
		Ae.clear();
		for (let e of he) {
			if (e.kind !== "fib") continue;
			let t = ye(e)?.lv;
			if (!t) continue;
			let n = /* @__PURE__ */ new Set();
			for (let e of ke) {
				let r = t.find((t) => t.r === e);
				r && je(r.y) && n.add(e);
			}
			Ae.set(e.id, n);
		}
		t.lineJoin = "round";
		{
			let a = e.state().plan.zone, o = a ? I(a.entry) : null;
			if (a && o != null) {
				let e = a.side === "short", s = Math.min(r * .62, Math.max(120, r * .5)), c = e ? Math.max(0, o - s) : Math.min(r, o + s), l = t.createLinearGradient(0, o, 0, c);
				l.addColorStop(0, we(i.dn, .26)), l.addColorStop(.55, we(i.dn, .11)), l.addColorStop(1, we(i.dn, 0)), t.fillStyle = l, t.fillRect(0, Math.min(o, c), n, Math.abs(c - o)), t.font = `600 ${i.fontPx - 2}px ${i.font}`, t.textAlign = "center", t.textBaseline = "middle", t.fillStyle = we(i.dn, .85);
				let u = e ? o - s * .5 : o + s * .5;
				t.fillText("RISK ZONE", n * .42, u), t.fillStyle = we(i.dn, .55), t.fillText(`(UNPROTECTED ${a.side.toUpperCase()})`, n * .42, u + 14);
			}
		}
		if (a.vp) {
			let e = De();
			if (e) {
				let r = I(e.vah), a = I(e.val);
				r != null && a != null && (t.fillStyle = we(i.accent, .05), t.fillRect(0, Math.min(r, a), n, Math.abs(a - r)));
				let o = Math.min(n * .24, 190);
				for (let r of e.rows) {
					let a = I(r.hi), s = I(r.lo);
					if (a == null || s == null || r.vol <= 0) continue;
					let c = r.vol / e.max * o;
					t.fillStyle = r.va ? i.vaBar : i.outBar, t.fillRect(n - c, Math.min(a, s) + .5, c, Math.max(1, Math.abs(s - a) - 1));
				}
				let s = e.rows[e.pocIdx], c = I(s.hi), l = I(s.lo);
				if (c != null && l != null) {
					let e = o;
					t.fillStyle = we(i.poc, .62), t.fillRect(n - e, Math.min(c, l) + .5, e, Math.max(1.5, Math.abs(l - c) - 1));
					let r = (c + l) / 2;
					t.strokeStyle = we(i.poc, .4), t.lineWidth = 1, t.setLineDash([5, 4]), t.beginPath(), t.moveTo(0, r), t.lineTo(n - e, r), t.stroke(), t.setLineDash([]), Ce(t, "POC", n - e - 4, r, "#0b0c10", we(i.poc, .9), "right");
				}
				for (let [r, a] of [[e.vah, "VAH"], [e.val, "VAL"]]) {
					let e = I(r);
					e != null && (t.strokeStyle = we(i.accent, .28), t.lineWidth = 1, t.setLineDash([2, 4]), t.beginPath(), t.moveTo(n - o, e), t.lineTo(n, e), t.stroke(), t.setLineDash([]), t.fillStyle = we(i.accent, .55), t.font = `600 ${i.fontPx - 2}px ${i.font}`, t.textAlign = "left", t.textBaseline = "middle", t.fillText(a, n - o + 3, e + (a === "VAH" ? -7 : 7)));
				}
			}
		}
		if (a.piv) {
			let e = (e, a, o, s) => {
				let c = Math.max(0, re(a) ?? 0), l = [
					[
						"R3",
						e.r3,
						i.pivR
					],
					[
						"R2",
						e.r2,
						i.pivR
					],
					[
						"R1",
						e.r1,
						i.pivR
					],
					[
						"P",
						e.p,
						i.pivP
					],
					[
						"S1",
						e.s1,
						i.pivS
					],
					[
						"S2",
						e.s2,
						i.pivS
					],
					[
						"S3",
						e.s3,
						i.pivS
					]
				], u = [
					"P",
					"R1",
					"S1",
					"R2",
					"S2",
					"R3",
					"S3"
				], d = [];
				for (let [e, i, a] of l) {
					let l = I(i);
					if (l == null || l < -4 || l > r + 4) continue;
					let f = e === "P";
					t.strokeStyle = we(a, s ? .3 : f ? .55 : .34), t.lineWidth = f ? 1.2 : 1, t.setLineDash(s ? [8, 5] : [2, 4]), t.beginPath(), t.moveTo(0, l), t.lineTo(n, l), t.stroke(), t.setLineDash([]), t.strokeStyle = we(a, s ? .55 : .7), t.beginPath(), t.moveTo(c, l), t.lineTo(n, l), t.stroke(), d.push({
						y: l,
						text: `${o}${e}  ${pa(i)}`,
						col: a,
						pr: u.indexOf(e)
					});
				}
				t.font = `600 ${i.fontPx - 2}px ${i.font}`, t.textAlign = "left", t.textBaseline = "alphabetic";
				for (let e of d.sort((e, t) => e.pr - t.pr)) je(e.y) && (t.fillStyle = we(e.col, s ? .7 : .85), t.fillText(e.text, 6, e.y - 3));
			};
			H && (w === "1d" || w === "1w") && e(H, oe, "W ", !0), V && e(V, ae, "", !1);
		}
		for (let e of he) Ne(t, e, n, r, e.id === ge);
		K && Ne(t, {
			id: "draft",
			kind: K.kind,
			a: K.a,
			b: K.b
		}, n, r, !1, !0), t.restore();
	}
	function Ne(e, t, n, r, i, a = !1) {
		let o = ye(t);
		if (!o) return;
		let s = g(), c = s.draw;
		if (e.globalAlpha = a ? .8 : 1, e.lineWidth = i ? 2 : 1.4, e.strokeStyle = c, e.fillStyle = c, e.setLineDash([]), t.kind === "hline") e.beginPath(), e.moveTo(0, o.ay), e.lineTo(n, o.ay), e.stroke(), Ce(e, pa(t.a.p), n - 6, o.ay, "#0b0c10", we(c, .92), "right");
		else if (t.kind === "trend") e.beginPath(), e.moveTo(o.ax, o.ay), e.lineTo(o.bx, o.by), e.stroke();
		else if (t.kind === "fib" && o.lv && t.b) {
			let r = Math.min(o.ax, o.bx), l = o.lv;
			for (let t = 0; t < l.length - 2; t++) e.fillStyle = we(s.fib[(t + 1) % s.fib.length] ?? c, .07), e.fillRect(r, Math.min(l[t].y, l[t + 1].y), n - r, Math.abs(l[t + 1].y - l[t].y));
			e.setLineDash([]);
			let u = a ? new Set(l.map((e) => e.r)) : Ae.get(t.id) ?? /* @__PURE__ */ new Set();
			for (let t of l) {
				let a = t.r > 1, o = a ? s.extFib : s.fib[$i.indexOf(t.r)] ?? c;
				e.strokeStyle = we(o, a ? .75 : .9), e.lineWidth = i ? 1.6 : 1.1, e.setLineDash(a ? [5, 4] : []), e.beginPath(), e.moveTo(r, t.y), e.lineTo(n, t.y), e.stroke(), e.setLineDash([]), u.has(t.r) && (e.font = `600 ${s.fontPx - 1}px ${s.font}`, e.textAlign = "left", e.textBaseline = "alphabetic", e.fillStyle = we(o, 1), e.fillText(`${t.r}  ${pa(t.p)}`, r + 4, t.y - 3));
			}
			e.strokeStyle = we(c, .5), e.lineWidth = 1, e.setLineDash([3, 4]), e.beginPath(), e.moveTo(o.ax, o.ay), e.lineTo(o.bx, o.by), e.stroke(), e.setLineDash([]);
		} else if (t.kind === "measure" && t.b) {
			let a = t.b.p >= t.a.p, c = a ? s.up : s.dn;
			e.fillStyle = we(c, .13), e.strokeStyle = we(c, .85), e.lineWidth = i ? 1.8 : 1.2;
			let l = Math.min(o.ax, o.bx), u = Math.min(o.ay, o.by), d = Math.abs(o.bx - o.ax), f = Math.abs(o.by - o.ay);
			e.fillRect(l, u, d, f), e.strokeRect(l, u, d, f), e.beginPath(), e.moveTo(o.ax, o.ay), e.lineTo(o.bx, o.by), e.stroke();
			let p = t.b.p - t.a.p, m = Math.round(P(t.b.t) - P(t.a.t)), h = `${p >= 0 ? "+" : "-"}${pa(Math.abs(p))}  ${p >= 0 ? "+" : "-"}${Math.abs(p / t.a.p * 100).toFixed(2)}%  ${Math.abs(m)} bars  ${ra(t.b.t - t.a.t)}`, g = a ? u - 12 : u + f + 12;
			Ce(e, h, Math.max(8, Math.min(n - 8, l + d / 2)), Math.max(10, Math.min(r - 10, g)), "#0b0c10", we(c, .92), "center");
		}
		if (i && !a) {
			e.setLineDash([]), e.globalAlpha = 1;
			let r = t.kind === "hline" ? [[Math.min(60, n / 2), o.ay]] : [[o.ax, o.ay], [o.bx, o.by]];
			for (let [t, n] of r) e.fillStyle = "#0b0c10", e.strokeStyle = c, e.lineWidth = 1.6, e.beginPath(), e.arc(t, n, 4.5, 0, Math.PI * 2), e.fill(), e.stroke();
			let i = xe(o);
			e.fillStyle = "rgba(11,12,16,.92)", e.strokeStyle = we(s.dn, .9), e.lineWidth = 1.2, e.beginPath(), e.arc(i.x, i.y, 8, 0, Math.PI * 2), e.fill(), e.stroke(), e.beginPath(), e.moveTo(i.x - 3, i.y - 3), e.lineTo(i.x + 3, i.y + 3), e.moveTo(i.x + 3, i.y - 3), e.lineTo(i.x - 3, i.y + 3), e.stroke();
		}
		e.globalAlpha = 1;
	}
	let Pe = (() => {
		let e = null, t = {
			zOrder: () => "normal",
			renderer: () => ({ draw(e) {
				e.useMediaCoordinateSpace(({ context: e, mediaSize: t }) => Me(e, t.width, t.height));
			} })
		};
		return v.attachPrimitive({
			attached(t) {
				e = t.requestUpdate;
			},
			detached() {
				e = null;
			},
			paneViews: () => [t]
		}), { update: () => e?.() };
	})();
	f.innerHTML = [
		[
			null,
			"Cursor",
			ua.cursor
		],
		[
			"hline",
			"Horizontal line",
			ua.hline
		],
		[
			"trend",
			"Trend line",
			ua.trend
		],
		[
			"fib",
			"Fibonacci retracement",
			ua.fib
		],
		[
			"measure",
			"Measure",
			ua.measure
		]
	].map(([e, t, n], r) => `${r === 1 ? "<div class=\"sep\"></div>" : ""}<button data-tool="${e ?? ""}" title="${t}" aria-label="${t}">${da(n)}</button>`).join("");
	function Fe(e) {
		_e = e, K = null, f.querySelectorAll("button").forEach((t) => t.classList.toggle("on", (t.dataset.tool || null) === e)), p.style.cursor = e ? "crosshair" : "", J(), Pe.update();
	}
	f.querySelectorAll("button").forEach((e) => r(e, "click", () => Fe(e.dataset.tool || null)));
	function Ie() {
		m.querySelectorAll("button").forEach((e) => e.classList.toggle("on", a[e.dataset.k]));
	}
	m.querySelectorAll("button").forEach((e) => r(e, "click", () => {
		let t = e.dataset.k;
		a[t] = !a[t], d(), Ie(), t === "vol" || t === "rsi" ? ee() : Pe.update();
	})), Ie();
	let Le = null, q = 0;
	function J() {
		clearTimeout(q), Le?.remove(), Le = null;
	}
	function Re(t, n, r) {
		J();
		let i = e.hooks(), a = document.createElement("div");
		a.className = "hc-pick", a.innerHTML = `<b>${pa(r)}</b>
      <button data-f="price" title="Entry here" aria-label="Entry here">${da(ua.price)}</button>
      <button data-f="stop" title="Stop here" aria-label="Stop here">${da(ua.stop)}</button>
      <button data-f="target" title="Target here" aria-label="Target here">${da(ua.target)}</button>`, p.appendChild(a);
		let o = p.clientWidth, s = R();
		a.style.left = `${Math.max(4, Math.min(o - a.offsetWidth - 70, t + 12))}px`, a.style.top = `${Math.max(4, Math.min(s - a.offsetHeight - 4, n - a.offsetHeight / 2))}px`, a.querySelectorAll("button").forEach((e) => e.onclick = () => {
			i.fillTicket(e.dataset.f, r), J();
		}), Le = a, q = window.setTimeout(J, 9e3);
	}
	let ze = (e) => {
		let t = p.getBoundingClientRect();
		return {
			x: e.clientX - t.left,
			y: e.clientY - t.top
		};
	}, Be = !1, Y = null, Ve = (e) => {
		Be && e.stopImmediatePropagation();
	};
	for (let e of [
		"mousedown",
		"mouseup",
		"click",
		"touchstart",
		"touchend",
		"touchmove",
		"dblclick"
	]) r(p, e, Ve, !0);
	function He(e) {
		if (e.button !== 0 || e.target.closest(".hc-pick")) return;
		let { x: t, y: n } = ze(e);
		if (t < 0 || t > L() || n < 0 || n > R()) return;
		if (Be = !1, _e) {
			Be = !0;
			let e = z(t, n);
			if (!e) return;
			if (_e === "hline") {
				let t = {
					id: fa(),
					kind: "hline",
					a: {
						t: e.t,
						p: ie(e.p)
					}
				};
				he.push(t), ge = t.id, ve(), Fe(null);
			} else if (!K) K = {
				kind: _e,
				a: e,
				b: e,
				pressedAt: {
					x: t,
					y: n
				}
			};
			else {
				let t = {
					id: fa(),
					kind: K.kind,
					a: K.a,
					b: e
				};
				he.push(t), ge = t.id, ve(), Fe(null);
			}
			Pe.update(), We();
			return;
		}
		let r = Se(t, n);
		if (r) {
			if (Be = !0, J(), r.type === "del") {
				Je(), Be = !1;
				return;
			}
			if (r.type === "handle") Y = {
				kind: "handle",
				h: r.h,
				moved: !1,
				startY: n,
				price: r.h.price
			}, pe = !0, p.style.cursor = "ns-resize";
			else {
				ge = r.id;
				let e = he.find((e) => e.id === r.id), i = _.timeScale().coordinateToLogical(t) ?? 0, a = v.coordinateToPrice(n) ?? 0;
				Y = {
					kind: "draw",
					id: r.id,
					part: r.part,
					moved: !1,
					start: {
						x: t,
						y: n
					},
					a0: { ...e.a },
					b0: e.b ? { ...e.b } : void 0,
					l0: i,
					p0: a
				}, Pe.update();
			}
			We();
		}
	}
	let Ue = !1;
	function We() {
		Ue || (Ue = !0, window.addEventListener("pointermove", Ke), window.addEventListener("pointerup", qe));
	}
	function Ge() {
		Ue = !1, window.removeEventListener("pointermove", Ke), window.removeEventListener("pointerup", qe);
	}
	n.push(Ge);
	function Ke(e) {
		let { x: t, y: n } = ze(e);
		if (K) {
			let e = z(Math.max(0, Math.min(L(), t)), Math.max(0, Math.min(R(), n)));
			e && (K.b = e, Pe.update());
			return;
		}
		if (!Y) return;
		if (Y.kind === "handle") {
			if (!Y.moved && Math.abs(n - Y.startY) < 3) return;
			Y.moved = !0;
			let e = v.coordinateToPrice(Math.max(2, Math.min(R() - 2, n)));
			if (e == null) return;
			let t = ie(e);
			Y.price = t, Y.h.line.applyOptions({
				price: t,
				title: `${Y.h.title.split(" ")[0] === "PLAN" ? Y.h.title : Y.h.title.replace(/\s[+-]\$.*$/, "")}`
			});
			return;
		}
		let r = Y, i = he.find((e) => e.id === r.id);
		if (!i || !Y.moved && Math.hypot(t - Y.start.x, n - Y.start.y) < 3) return;
		Y.moved = !0;
		let a = z(Math.max(0, Math.min(L(), t)), Math.max(0, Math.min(R(), n)));
		if (a) {
			if (Y.part === "a") i.a = i.kind === "hline" ? {
				t: i.a.t,
				p: a.p
			} : a;
			else if (Y.part === "b") i.b = a;
			else {
				let e = (_.timeScale().coordinateToLogical(t) ?? Y.l0) - Y.l0, n = a.p - Y.p0;
				i.kind === "hline" ? i.a = {
					t: i.a.t,
					p: Y.a0.p + n
				} : (i.a = {
					t: F(P(Y.a0.t) + e),
					p: Y.a0.p + n
				}, Y.b0 && (i.b = {
					t: F(P(Y.b0.t) + e),
					p: Y.b0.p + n
				}));
			}
			Pe.update();
		}
	}
	function qe(e) {
		let { x: t, y: n } = ze(e);
		if (K) {
			let e = K.pressedAt;
			if (e && Math.hypot(t - e.x, n - e.y) > 10) {
				let e = z(Math.max(0, Math.min(L(), t)), Math.max(0, Math.min(R(), n)));
				if (e) {
					let t = {
						id: fa(),
						kind: K.kind,
						a: K.a,
						b: e
					};
					he.push(t), ge = t.id, ve(), Fe(null);
				}
			} else K.pressedAt = null;
			Be = !1, K || Ge();
			return;
		}
		let r = Y;
		if (Y = null, Be = !1, Ge(), p.style.cursor = _e ? "crosshair" : "", r) {
			if (r.kind === "handle") {
				pe = !1, r.moved && r.price !== r.h.price ? r.h.commit(r.price) : !r.moved && r.h.key === "g-stop" && r.h.commit(r.h.price), G(!0);
				return;
			}
			r.moved && ve();
		}
	}
	r(p, "pointerdown", He, !0);
	function Je() {
		ge && (he = he.filter((e) => e.id !== ge), ge = null, ve());
	}
	r(document, "keydown", (e) => {
		let t = e.target;
		t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || ((e.key === "Delete" || e.key === "Backspace") && ge && p.isConnected ? (e.preventDefault(), Je()) : e.key === "Escape" && (K || _e ? (Fe(null), e.stopPropagation()) : ge && (ge = null, Pe.update()), J()));
	}, !0), r(p, "pointermove", (e) => {
		if (Y || K) return;
		let { x: t, y: n } = ze(e);
		if (_e) {
			p.style.cursor = "crosshair";
			return;
		}
		let r = Se(t, n);
		p.style.cursor = r ? r.type === "handle" ? "ns-resize" : r.type === "del" || r.part === "body" ? "pointer" : "move" : "";
	});
	let Ye = (e) => {
		if (t || _e || Y || Be || !e.point || e.paneIndex != null && e.paneIndex !== 0) return;
		let { x: n, y: r } = e.point;
		if (n < 0 || n > L() || r < 0 || r > R()) return;
		ge = null, Pe.update();
		let i = v.coordinateToPrice(r);
		i != null && Re(n, r, ie(i));
	};
	_.subscribeClick(Ye);
	let Xe = (e) => {
		e && e.from < 40 && W(), Le && J();
	};
	_.timeScale().subscribeVisibleLogicalRangeChange(Xe);
	let Ze = new ResizeObserver(() => {
		t || M(), Pe.update();
	});
	return Ze.observe(p), Fe(null), ne(), ee(), le(), {
		load: le,
		live: ue,
		refreshLines: () => G(!1),
		candles: () => S.slice(),
		focusRange(e, t) {
			if (!S.length) return;
			let n = Math.max(e, S[0].time), r = Math.min(t, S[S.length - 1].time + 1);
			if (r > n) try {
				_.timeScale().setVisibleRange({
					from: n,
					to: r
				});
			} catch {}
		},
		theme() {
			ne(), G(!0), Pe.update();
		},
		destroy() {
			if (!t) {
				t = !0, l(), clearTimeout(q), Ze.disconnect();
				try {
					_.unsubscribeClick(Ye), _.timeScale().unsubscribeVisibleLogicalRangeChange(Xe);
				} catch {}
				for (let e of n.splice(0)) try {
					e();
				} catch {}
				try {
					_.remove();
				} catch {}
				Le?.remove(), m.remove(), e.host.classList.remove("hc-host"), e.host.replaceChildren();
			}
		}
	};
}
//#endregion
//#region src/core/markets.ts
var ga = [
	{
		id: "coins",
		title: "Hall of Coins",
		order: 0
	},
	{
		id: "foundry",
		title: "The Foundry",
		order: 1
	},
	{
		id: "indices",
		title: "The Great Indices",
		order: 2
	},
	{
		id: "metals",
		title: "Old Metals",
		order: 3
	},
	{
		id: "tide",
		title: "The Tide Market",
		order: 4
	},
	{
		id: "money",
		title: "The Moneychangers",
		order: 5
	}
], _a = Object.fromEntries(ga.map((e) => [e.id, e])), va = {
	BTC: "Keystone",
	ETH: "Aether",
	SOL: "Sunglass",
	HYPE: "Wildfire",
	"xyz:GOLD": "Old Sun",
	"xyz:SILVER": "Moonmetal"
}, ya = {}, ba = (e, t) => {
	for (let n of t.split(/\s+/).filter(Boolean)) ya[n] = e;
};
ba("indices", "SP500 XYZ100 JP225 KR200 NIFTY IBOV VIX VOL\n  EWY EWJ EWZ EWT\n  XLE SMH XBI SOXL KORU MAGS TLT URNM\n  H100 DRAM NCLD"), ba("metals", "GOLD SILVER PLATINUM PALLADIUM COPPER ALUMINIUM URANIUM"), ba("tide", "CL BRENTOIL NATGAS TTF CORN WHEAT HO"), ba("money", "EUR JPY GBP KRW DXY");
function xa(e) {
	return t(e) === "" ? "coins" : ya[e.slice(e.indexOf(":") + 1)] ?? "foundry";
}
var Sa = (e) => e.includes(":") ? e.slice(e.indexOf(":") + 1) : e;
async function Ca(t) {
	let [n, r] = await e(t ? {
		type: "metaAndAssetCtxs",
		dex: t
	} : { type: "metaAndAssetCtxs" });
	return n.universe.map((e, n) => {
		let i = r[n] ?? {};
		return {
			key: e.name,
			ticker: Sa(e.name),
			dex: t,
			hall: xa(e.name),
			name: va[e.name] ?? null,
			maxLeverage: e.maxLeverage,
			szDecimals: e.szDecimals,
			markPx: +(i.markPx ?? 0),
			prevDayPx: +(i.prevDayPx ?? 0),
			dayNtlVlm: +(i.dayNtlVlm ?? 0),
			isDelisted: !!e.isDelisted
		};
	});
}
async function wa() {
	let [e, t] = await Promise.all([Ca(""), Ca("xyz")]), n = e.filter((e) => !e.isDelisted).sort((e, t) => t.dayNtlVlm - e.dayNtlVlm), r = new Set(n.slice(0, 40).map((e) => e.key));
	for (let e of n) va[e.key] && r.add(e.key);
	return [...n.filter((e) => r.has(e.key)), ...t.filter((e) => !e.isDelisted)].sort((e, t) => _a[e.hall].order - _a[t.hall].order || t.dayNtlVlm - e.dayNtlVlm);
}
var Ta = (e) => `${Sa(e)}-PERP`, Ea = (e) => t(e) !== "", Da = 45e-5, Oa = 15e-5, ka = (e = 1e4) => ({
	startingCash: e,
	cash: e,
	positions: {},
	history: [],
	orders: [],
	fills: []
}), Aa = (e, t) => `${e}-${t.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
function ja(e) {
	if (!e || typeof e != "object") return ka();
	let t = e;
	if (!t.positions || !Array.isArray(t.history) || typeof t.cash != "number") return ka();
	let n = {};
	for (let [e, r] of Object.entries(t.positions)) {
		let t = r;
		n[e] = {
			...t,
			placedAt: t.placedAt ?? t.openedAt,
			initialQty: t.initialQty ?? t.qty,
			bookedPnl: t.bookedPnl ?? 0,
			exitedQty: t.exitedQty ?? 0,
			exitedValue: t.exitedValue ?? 0,
			feesTotal: t.feesTotal ?? t.entryFee ?? 0,
			fundingPaid: t.fundingPaid ?? 0,
			fundingTotal: t.fundingTotal ?? 0,
			lastFundingAt: t.lastFundingAt ?? Date.now()
		};
	}
	return {
		startingCash: t.startingCash ?? 1e4,
		cash: t.cash,
		positions: n,
		history: t.history,
		orders: Array.isArray(t.orders) ? t.orders : [],
		fills: Array.isArray(t.fills) ? t.fills : []
	};
}
var Ma = (e) => e === "long" ? 1 : -1, Na = (e) => 1 / (2 * e);
function Pa(e) {
	let t = Na(e.maxLeverage);
	return e.side === "long" ? (e.qty * e.entry - e.margin) / (e.qty * (1 - t)) : (e.margin + e.qty * e.entry) / (e.qty * (1 + t));
}
function Fa(e, t) {
	return (t - e.entry) * e.qty * Ma(e.side);
}
function Ia(e, t) {
	let n = e.cash;
	for (let r of Object.values(e.positions)) n += r.margin + Fa(r, t[r.coin] ?? r.entry);
	return n;
}
function La(e, t, n) {
	let r = t ? e.asks : e.bids;
	if (!r.length) return null;
	let i = r[0][0], a = n, o = 0;
	for (let [e, t] of r) {
		let n = Math.min(a, t);
		if (o += n * e, a -= n, a <= 0) break;
	}
	if (a > 0) {
		let e = r[r.length - 1][0];
		o += a * e * (t ? 1.005 : .995);
	}
	let s = o / n;
	return {
		avg: s,
		slippageBps: Math.abs(s - i) / i * 1e4
	};
}
var Ra = (e) => e.reduceOnly ? 0 : e.qty * e.price * (1 / e.leverage + Da), za = (e) => e.cash - e.orders.reduce((e, t) => e + Ra(t), 0), Ba = (e) => e === "target" ? "tp" : e === "stop" || e === "trailingStop" ? "sl" : e === "liquidation" ? "liq" : "market", Va = (e, t) => [...e.fills, t].slice(-500);
function Ha(e, t, n, r) {
	if (e.positions[t.coin]) return {
		ok: !1,
		error: `Already in ${t.coin}. Close it first (one position per coin).`
	};
	let i = t.side === "long";
	if (t.stop != null) {
		if (i && t.stop >= t.price) return {
			ok: !1,
			error: "A long stop must sit below the entry."
		};
		if (!i && t.stop <= t.price) return {
			ok: !1,
			error: "A short stop must sit above the entry."
		};
	}
	if (t.target != null) {
		if (i && t.target <= t.price) return {
			ok: !1,
			error: "A long target must sit above the entry."
		};
		if (!i && t.target >= t.price) return {
			ok: !1,
			error: "A short target must sit below the entry."
		};
	}
	let a = t.qty * t.price, o = a / t.leverage, s = a * t.feeRate;
	if (o + s > t.cashCap + 1e-9) return {
		ok: !1,
		error: `Not enough free collateral: need $${(o + s).toFixed(2)}.`
	};
	let c = {
		coin: t.coin,
		side: t.side,
		qty: t.qty,
		entry: t.price,
		leverage: t.leverage,
		maxLeverage: t.maxLeverage,
		margin: o,
		stop: t.stop,
		initialStop: t.stop,
		target: t.target,
		stopWidenings: 0,
		entryFee: s,
		openedAt: r,
		placedAt: t.placedAt,
		equityAtEntry: Ia(e, n),
		riskPerTradePct: t.riskPct,
		initialQty: t.qty,
		bookedPnl: 0,
		exitedQty: 0,
		exitedValue: 0,
		feesTotal: s,
		fundingPaid: 0,
		fundingTotal: 0,
		lastFundingAt: r
	};
	if (t.stop != null) {
		let e = Pa(c);
		if (i ? t.stop <= e : t.stop >= e) return {
			ok: !1,
			error: `Stop is past the liquidation price (${e.toFixed(4)}). Lower the leverage.`
		};
	}
	let l = {
		id: Aa("f", r),
		time: r,
		coin: t.coin,
		dir: i ? "buy" : "sell",
		qty: t.qty,
		price: t.price,
		fee: s,
		kind: "open",
		how: t.how,
		pnl: null
	};
	return {
		ok: !0,
		value: {
			account: {
				...e,
				cash: e.cash - o - s,
				positions: {
					...e.positions,
					[t.coin]: c
				},
				fills: Va(e, l)
			},
			fill: l
		}
	};
}
function Ua(e, t, n, r, i = Date.now()) {
	if (e.positions[t.coin]) return {
		ok: !1,
		error: `Already in ${t.coin}. Close it first (one position per coin).`
	};
	if (!(t.notional > 0)) return {
		ok: !1,
		error: "Enter a size."
	};
	if (t.leverage < 1 || t.leverage > t.maxLeverage) return {
		ok: !1,
		error: `Leverage must be 1 to ${t.maxLeverage}×.`
	};
	let a = r[t.coin];
	if (!a) return {
		ok: !1,
		error: "No price yet."
	};
	let o = t.notional / a, s = La(n, t.side === "long", o);
	if (!s) return {
		ok: !1,
		error: "Order book is empty. Try again in a second."
	};
	let c = Ha(e, {
		coin: t.coin,
		side: t.side,
		qty: o,
		price: s.avg,
		feeRate: Da,
		leverage: t.leverage,
		maxLeverage: t.maxLeverage,
		stop: t.stop,
		target: t.target,
		riskPct: t.riskPerTradePct,
		placedAt: i,
		how: "market",
		cashCap: za(e)
	}, r, i);
	return c.ok ? {
		ok: !0,
		value: {
			account: c.value.account,
			slippageBps: s.slippageBps
		}
	} : c;
}
function Wa(e, t, n, r, i, a, o = Date.now(), s = {}) {
	let c = e.positions[t];
	if (!c) return null;
	let l = a === "liquidation", u = l || n >= c.qty * (1 - 1e-9), d = u ? c.qty : Math.min(n, c.qty);
	if (!(d > 0)) return null;
	let f = d / c.qty, p, m = 0, h, g;
	l ? (p = Pa(c), h = -c.margin, g = 0) : (p = s.price ?? (r ? La(r, c.side === "short", d)?.avg : void 0) ?? i, m = d * p * (s.feeRate ?? 45e-5), h = (p - c.entry) * d * Ma(c.side) - m, g = Math.max(0, c.margin * f + h));
	let _ = h - c.entryFee * f - c.fundingPaid * f, v = s.how ?? Ba(a), y = {
		id: Aa("f", o),
		time: o,
		coin: t,
		dir: c.side === "long" ? "sell" : "buy",
		qty: d,
		price: p,
		fee: m,
		kind: l ? "liquidation" : u ? "close" : "reduce",
		how: v,
		pnl: _
	}, b = Va(e, y);
	if (!u) {
		let n = {
			...c,
			qty: c.qty - d,
			margin: c.margin * (1 - f),
			entryFee: c.entryFee * (1 - f),
			fundingPaid: c.fundingPaid * (1 - f),
			bookedPnl: c.bookedPnl + _,
			exitedQty: c.exitedQty + d,
			exitedValue: c.exitedValue + d * p,
			feesTotal: c.feesTotal + m
		};
		return {
			account: {
				...e,
				cash: e.cash + g,
				positions: {
					...e.positions,
					[t]: n
				},
				fills: b
			},
			trade: null,
			fill: y
		};
	}
	let x = c.bookedPnl + _, S = c.initialStop == null ? null : Math.abs(c.entry - c.initialStop) * c.initialQty, C = S && S > 0 ? x / S : null, w = c.exitedQty + d, T = {
		id: `${t}-${o}`,
		coin: t,
		side: c.side,
		qty: c.initialQty,
		entry: c.entry,
		exit: w > 0 ? (c.exitedValue + d * p) / w : p,
		leverage: c.leverage,
		initialStop: c.initialStop,
		target: c.target,
		stopWidenings: c.stopWidenings,
		exitReason: a,
		realizedPnl: x,
		plannedRisk: S,
		rMultiple: C,
		equityAtEntry: c.equityAtEntry,
		riskPerTradePct: c.riskPerTradePct,
		openedAt: c.openedAt,
		closedAt: o,
		placedAt: c.placedAt,
		fees: c.feesTotal + m,
		fundingPaid: c.fundingTotal
	}, E = { ...e.positions };
	delete E[t];
	let D = e.orders.filter((e) => e.coin !== t || !l && !e.reduceOnly);
	return {
		account: {
			...e,
			cash: e.cash + g,
			positions: E,
			history: [...e.history, T],
			orders: D,
			fills: b
		},
		trade: T,
		fill: y
	};
}
function Ga(e, t, n, r, i, a = Date.now()) {
	let o = e.positions[t];
	if (!o) return null;
	let s = Wa(e, t, o.qty, n, r, i, a);
	return s && s.trade ? {
		account: s.account,
		trade: s.trade
	} : null;
}
function Ka(e, t, n, r) {
	return e === "stop" ? t === "long" && n <= r ? "A buy stop must sit above the market." : t === "short" && n >= r ? "A sell stop must sit below the market." : null : null;
}
function qa(e, t, n, r) {
	let i = e === "long";
	if (n != null) {
		if (i && n >= t) return "A long stop must sit below the entry.";
		if (!i && n <= t) return "A short stop must sit above the entry.";
	}
	if (r != null) {
		if (i && r <= t) return "A long target must sit above the entry.";
		if (!i && r >= t) return "A short target must sit below the entry.";
	}
	return null;
}
function Ja(e, t, n, r, i = Date.now()) {
	let a = r[t.coin], o = t.side === "long", s = e.positions[t.coin];
	if (t.reduceOnly) {
		if (!s) return {
			ok: !1,
			error: `Reduce-only needs an open ${t.coin} position.`
		};
		if (s.side === t.side) return {
			ok: !1,
			error: `Reduce-only must go against the position: ${s.side === "long" ? "sell" : "buy"} to reduce.`
		};
	} else if (s) return {
		ok: !1,
		error: `Already in ${t.coin}. Close it first (one position per coin).`
	};
	if (!(t.notional > 0)) return {
		ok: !1,
		error: "Enter a size."
	};
	if (!a) return {
		ok: !1,
		error: "No price yet."
	};
	if (!t.reduceOnly && (t.leverage < 1 || t.leverage > t.maxLeverage)) return {
		ok: !1,
		error: `Leverage must be 1 to ${t.maxLeverage}×.`
	};
	if (t.type === "market") {
		if (!n) return {
			ok: !1,
			error: "Waiting for the order book…"
		};
		if (!t.reduceOnly) {
			let a = Ua(e, t, n, r, i);
			return a.ok ? {
				ok: !0,
				value: {
					account: a.value.account,
					status: "filled",
					slippageBps: a.value.slippageBps,
					events: []
				}
			} : a;
		}
		let c = Math.min(t.notional / a, s.qty), l = o ? n.asks[0]?.[0] : n.bids[0]?.[0], u = Wa(e, t.coin, c, n, a, "sell", i);
		if (!u) return {
			ok: !1,
			error: "Nothing to reduce."
		};
		let d = l ? Math.abs(u.fill.price - l) / l * 1e4 : void 0;
		return {
			ok: !0,
			value: {
				account: u.account,
				status: "filled",
				slippageBps: d,
				events: [{
					type: "filled",
					order: Ya(t, c, u.fill.price, i),
					fill: u.fill,
					trade: u.trade
				}]
			}
		};
	}
	let c = t.price ?? 0;
	if (!(c > 0)) return {
		ok: !1,
		error: `Enter a ${t.type} price.`
	};
	let l = Ka(t.type, t.side, c, a);
	if (l) return {
		ok: !1,
		error: l
	};
	let u = t.reduceOnly ? Math.min(t.notional / c, s.qty) : t.notional / c;
	if (!t.reduceOnly) {
		let n = qa(t.side, c, t.stop, t.target);
		if (n) return {
			ok: !1,
			error: n
		};
		let r = u * c * (1 / t.leverage + Da);
		if (r > za(e) + 1e-9) return {
			ok: !1,
			error: `Not enough free collateral: need $${r.toFixed(2)}.`
		};
	}
	let d = {
		id: Aa("o", i),
		coin: t.coin,
		side: t.side,
		type: t.type,
		price: c,
		qty: u,
		reduceOnly: t.reduceOnly,
		stop: t.reduceOnly ? null : t.stop,
		target: t.reduceOnly ? null : t.target,
		leverage: t.leverage,
		maxLeverage: t.maxLeverage,
		riskPerTradePct: t.riskPerTradePct,
		createdAt: i
	}, f = Za({
		...e,
		orders: [...e.orders, d]
	}, r, n ? { [t.coin]: n } : {}, i), p = !f.account.orders.some((e) => e.id === d.id), m = f.events.find((e) => e.order.id === d.id);
	return m?.type === "cancelled" ? {
		ok: !1,
		error: m.reason
	} : {
		ok: !0,
		value: {
			account: f.account,
			status: p ? "filled" : "working",
			orderId: d.id,
			events: f.events
		}
	};
}
function Ya(e, t, n, r) {
	return {
		id: Aa("o", r),
		coin: e.coin,
		side: e.side,
		type: "limit",
		price: n,
		qty: t,
		reduceOnly: !0,
		leverage: e.leverage,
		maxLeverage: e.maxLeverage,
		riskPerTradePct: e.riskPerTradePct,
		createdAt: r
	};
}
var Xa = (e, t) => ({
	type: "cancelled",
	order: e,
	reason: t
});
function Za(e, t, n, r = Date.now()) {
	let i = e, a = [];
	for (let o of e.orders) {
		if (!i.orders.some((e) => e.id === o.id)) continue;
		let e = t[o.coin];
		if (!e) continue;
		let s = o.side === "long", c = n[o.coin], l, u;
		if (o.type === "limit") {
			let t = s ? c?.asks[0]?.[0] : c?.bids[0]?.[0], n = t != null && (s ? t <= o.price : t >= o.price);
			if (!n && !(s ? e <= o.price : e >= o.price)) continue;
			if (n && c) {
				let e = La(c, s, o.qty);
				l = s ? Math.min(e.avg, o.price) : Math.max(e.avg, o.price), u = Da;
			} else l = o.price, u = Oa;
		} else {
			if (!(s ? e >= o.price : e <= o.price)) continue;
			l = (c ? La(c, s, o.qty)?.avg : void 0) ?? e, u = Da;
		}
		let d = {
			...i,
			orders: i.orders.filter((e) => e.id !== o.id)
		}, f = d.positions[o.coin];
		if (o.reduceOnly) {
			if (!f || f.side === o.side) {
				i = d, a.push(Xa(o, "Nothing left to reduce."));
				continue;
			}
			let t = Wa(d, o.coin, Math.min(o.qty, f.qty), c, e, "sell", r, {
				price: l,
				feeRate: u,
				how: o.type
			});
			if (!t) {
				i = d;
				continue;
			}
			i = t.account, a.push({
				type: "filled",
				order: o,
				fill: t.fill,
				trade: t.trade
			});
			continue;
		}
		if (f) {
			i = d, a.push(Xa(o, `Cancelled: already in ${o.coin}.`));
			continue;
		}
		let p = Ha(d, {
			coin: o.coin,
			side: o.side,
			qty: o.qty,
			price: l,
			feeRate: u,
			leverage: o.leverage,
			maxLeverage: o.maxLeverage,
			stop: o.stop ?? null,
			target: o.target ?? null,
			riskPct: o.riskPerTradePct,
			placedAt: o.createdAt,
			how: o.type,
			cashCap: d.cash
		}, t, r);
		if (!p.ok) {
			i = d, a.push(Xa(o, p.error));
			continue;
		}
		i = p.value.account, a.push({
			type: "filled",
			order: o,
			fill: p.value.fill,
			trade: null
		});
	}
	return {
		account: i,
		events: a
	};
}
function Qa(e, t, n, r) {
	let i = e.orders.find((e) => e.id === t);
	if (!i) return {
		ok: !1,
		error: "Too late: that order is gone."
	};
	if (!(n > 0)) return {
		ok: !1,
		error: "Enter a price."
	};
	let a = r[i.coin];
	if (a) {
		let e = Ka(i.type, i.side, n, a);
		if (e) return {
			ok: !1,
			error: e
		};
	}
	if (!i.reduceOnly) {
		let r = qa(i.side, n, i.stop, i.target);
		if (r) return {
			ok: !1,
			error: `${r} Move the order first, or the plan.`
		};
		let a = e.orders.filter((e) => e.id !== t).reduce((e, t) => e + Ra(t), 0), o = i.qty * n * (1 / i.leverage + Da);
		if (o > e.cash - a + 1e-9) return {
			ok: !1,
			error: `Not enough free collateral: need $${o.toFixed(2)}.`
		};
	}
	return {
		ok: !0,
		value: {
			...e,
			orders: e.orders.map((e) => e.id === t ? {
				...e,
				price: n
			} : e)
		}
	};
}
function $a(e, t) {
	return {
		...e,
		orders: e.orders.filter((e) => e.id !== t)
	};
}
function eo(e, t) {
	return {
		...e,
		orders: t ? e.orders.filter((e) => e.coin !== t) : []
	};
}
var to = 36e5, no = (e, t) => Math.max(0, Math.floor(t / to) - Math.floor(e.lastFundingAt / to));
function ro(e, t, n, r) {
	let i = e.positions[t];
	if (!i || !(r > 0)) return {
		account: e,
		paid: 0,
		hours: 0
	};
	let a = 0, o = 0, s = i.lastFundingAt;
	for (let { time: e, rate: t } of [...n].sort((e, t) => e.time - t.time)) e > s && Number.isFinite(t) && (a += i.qty * r * t * Ma(i.side), o += 1, s = e);
	if (!o) return {
		account: e,
		paid: 0,
		hours: 0
	};
	let c = {
		...i,
		margin: i.margin - a,
		fundingPaid: i.fundingPaid + a,
		fundingTotal: i.fundingTotal + a,
		lastFundingAt: s
	};
	return {
		account: {
			...e,
			positions: {
				...e.positions,
				[t]: c
			}
		},
		paid: a,
		hours: o
	};
}
function io(e, t, n, r, i = Date.now()) {
	let a = e.positions[t];
	if (!a) return {
		account: e,
		paid: 0,
		hours: 0
	};
	let o = no(a, i);
	if (!o) return {
		account: e,
		paid: 0,
		hours: 0
	};
	let s = Math.floor(i / to) * to;
	return ro(e, t, Array.from({ length: o }, (e, t) => ({
		time: s - (o - 1 - t) * to + 1e3,
		rate: n
	})), r);
}
var ao = (e, t) => e.margin > 0 ? Fa(e, t) / e.margin * 100 : 0;
function oo(e, t, n) {
	let r = e.positions[t];
	if (!r) return {
		ok: !1,
		error: "No position."
	};
	if (n != null) {
		let e = Pa(r);
		if (r.side === "long" && n <= e || r.side === "short" && n >= e) return {
			ok: !1,
			error: "Stop is past liquidation."
		};
	}
	let i = !1;
	r.stop != null && (i = n == null ? !0 : r.side === "long" ? n < r.stop : n > r.stop);
	let a = r.initialStop ?? n, o = {
		...r,
		stop: n,
		initialStop: a,
		stopWidenings: r.stopWidenings + +!!i
	};
	return {
		ok: !0,
		value: {
			...e,
			positions: {
				...e.positions,
				[t]: o
			}
		}
	};
}
function so(e, t, n) {
	let r = e.positions[t];
	return r ? {
		ok: !0,
		value: {
			...e,
			positions: {
				...e.positions,
				[t]: {
					...r,
					target: n
				}
			}
		}
	} : {
		ok: !1,
		error: "No position."
	};
}
function co(e, t) {
	let n = Pa(e);
	if (e.side === "long") {
		if (t <= n) return "liquidation";
		if (e.stop != null && t <= e.stop) return "stop";
		if (e.target != null && t >= e.target) return "target";
	} else {
		if (t >= n) return "liquidation";
		if (e.stop != null && t >= e.stop) return "stop";
		if (e.target != null && t <= e.target) return "target";
	}
	return null;
}
function lo(e, t, n, r) {
	let i = Math.abs(n - r) / n;
	return i > 0 ? e * t / 100 / i : 0;
}
//#endregion
//#region src/core/ctx.ts
async function uo() {
	let t = {};
	return await Promise.all(n.map(async (n) => {
		let [r, i] = await e(n ? {
			type: "metaAndAssetCtxs",
			dex: n
		} : { type: "metaAndAssetCtxs" });
		r.universe.forEach((e, n) => {
			let r = i[n];
			r && (t[e.name] = {
				funding: +(r.funding ?? 0),
				oraclePx: +(r.oraclePx ?? 0),
				markPx: +(r.markPx ?? 0),
				openInterest: +(r.openInterest ?? 0),
				prevDayPx: +(r.prevDayPx ?? 0),
				dayNtlVlm: +(r.dayNtlVlm ?? 0),
				premium: +(r.premium ?? 0)
			});
		});
	})), t;
}
async function fo(t, n) {
	return (await e({
		type: "fundingHistory",
		coin: t,
		startTime: n
	})).map((e) => ({
		time: e.time,
		rate: +e.fundingRate
	}));
}
var po = (e = Date.now()) => 36e5 - e % 36e5, mo = 7, ho = (e) => typeof e == "number" && Number.isFinite(e);
function go(e) {
	return !ho(e.plannedRisk) || e.plannedRisk <= 0 || !ho(e.equityAtEntry) || e.equityAtEntry <= 0 || !ho(e.riskPerTradePct) || e.riskPerTradePct <= 0 ? null : e.plannedRisk <= e.riskPerTradePct / 100 * e.equityAtEntry * 1.02;
}
function _o(e) {
	let t = ho(e.initialStop), n = ho(e.target), r = ho(e.stopWidenings), i = r ? Math.max(0, Math.trunc(e.stopWidenings) || 0) : 0, a = t && ho(e.rMultiple) ? e.rMultiple : null, o = go(e), s = (t ? 15 : 0) + (n ? 10 : 0), c = !ho(e.plannedRisk) || e.plannedRisk <= 0 ? 0 : o === !1 ? 10 : 20, l;
	switch (e.exitReason) {
		case "target":
			l = 20;
			break;
		case "stop":
		case "trailingStop":
			l = t ? 15 : 6;
			break;
		case "expire":
			l = 4;
			break;
		case "liquidation":
			l = 0;
			break;
		default: l = t && n ? 12 : t ? 9 : 4;
	}
	let u = t ? Math.max(0, 20 - mo * i) : 3, d = 0;
	a != null && a > 0 && (d = a >= 3 ? 15 : a >= 2 ? 10 : a >= 1 ? 6 : 3);
	let f = {
		process: s,
		risk: c,
		execution: l,
		discipline: u,
		outcome: d
	}, p = s + c + l + u + d, m = e.realizedPnl > 0, h = t && i === 0, g = o !== !1, _ = e.exitReason === "liquidation", v;
	v = _ ? "unstructured" : p >= 85 && h && g ? "flawless" : p >= 60 && h ? m ? "solid" : "disciplined" : p >= 30 ? "loose" : "unstructured";
	let y = _ ? "LIQUIDATED" : v === "flawless" ? "FLAWLESS EXECUTION" : v === "disciplined" ? "DISCIPLINED LOSS" : v === "solid" ? "SOLID EXECUTION" : v === "loose" ? "LOOSE EXECUTION" : m ? "UNSTRUCTURED WIN" : "UNSTRUCTURED LOSS", b = _ ? "THE MARKET TOOK THE ACCOUNT. SIZE DOWN." : v === "flawless" ? "GREAT TRADES BUILD GREATER TRADERS." : v === "disciplined" ? "LOSSES ARE TUITION." : v === "solid" ? "PROCESS COMPOUNDS." : v === "loose" ? m ? "IT WORKED. IT WAS NOT THE PLAN." : "THE PLAN BENT. THE MARKET NOTICED." : "LUCK IS NOT A STRATEGY.", x = _ ? "Margin gone. The stop was the exit you skipped." : v === "flawless" ? "Plan. Execute. Repeat." : v === "disciplined" ? "Same process. Different outcome." : v === "solid" ? "The plan held." : v === "loose" ? m ? "It worked. It was not the plan." : "You changed the plan mid-trade." : m ? "Got lucky. No edge." : "No plan to fall back on.", S = (e) => e ? "pass" : "fail", C = e.exitReason === "stop" || e.exitReason === "trailingStop", w = [
		{
			key: "stopSet",
			label: "Stop set before entry",
			state: S(t)
		},
		{
			key: "targetSet",
			label: "Target defined",
			state: S(n)
		},
		{
			key: "noWidening",
			label: "No stop widening",
			state: t ? r ? S(i === 0) : "unknown" : "fail"
		},
		{
			key: "targetHit",
			label: "Target hit",
			state: S(e.exitReason === "target")
		},
		{
			key: "stopHonored",
			label: "Stop honored",
			state: !t || !C ? "fail" : r ? S(i === 0) : "unknown"
		}
	];
	return o != null && w.push({
		key: "sizeInRule",
		label: "Planned risk respected",
		state: S(o)
	}), {
		total: p,
		grade: v,
		headline: y,
		subtext: x,
		motto: b,
		components: f,
		checks: w
	};
}
//#endregion
//#region src/core/progress.ts
var vo = {
	EXCELLENT: {
		name: "EXCELLENT",
		blurb: "Flawless execution",
		xp: 0
	},
	STOP_HONORED: {
		name: "STOP HONORED",
		blurb: "Took the stop as written",
		xp: 0
	},
	SNIPER: {
		name: "SNIPER",
		blurb: "Hit the target at 2R or better",
		xp: 0
	},
	IRON_WILL: {
		name: "IRON WILL",
		blurb: "A disciplined loss",
		xp: 0
	},
	HUMILIATION: {
		name: "HUMILIATION",
		blurb: "Liquidated",
		xp: 0
	},
	TILT: {
		name: "TILT",
		blurb: "Re-entered within 60s of a loss. -10 XP",
		xp: -10
	},
	WIDENED: {
		name: "WIDENED",
		blurb: "Moved the stop away from the market",
		xp: 0
	}
}, yo = (e) => ({
	key: e,
	...vo[e]
});
function bo(e) {
	let t = [];
	for (let n = 0; n < e.length; n++) {
		let r = e[n], i = _o({
			realizedPnl: r.realizedPnl,
			rMultiple: r.rMultiple,
			plannedRisk: r.plannedRisk,
			initialStop: r.initialStop,
			target: r.target,
			exitReason: r.exitReason,
			stopWidenings: r.stopWidenings,
			equityAtEntry: r.equityAtEntry,
			riskPerTradePct: r.riskPerTradePct
		}), a = [];
		i.grade === "flawless" && a.push(yo("EXCELLENT")), r.exitReason === "stop" && r.stopWidenings === 0 && a.push(yo("STOP_HONORED")), r.exitReason === "target" && (r.rMultiple ?? 0) >= 2 && a.push(yo("SNIPER")), i.grade === "disciplined" && a.push(yo("IRON_WILL")), r.exitReason === "liquidation" && a.push(yo("HUMILIATION")), r.stopWidenings > 0 && a.push(yo("WIDENED"));
		let o = e.slice(0, n).reverse().find((e) => e.realizedPnl < 0), s = r.placedAt ?? r.openedAt;
		o && s - o.closedAt < 6e4 && s >= o.closedAt && a.push(yo("TILT"));
		let c = Math.max(0, i.total + a.reduce((e, t) => e + t.xp, 0));
		t.push({
			trade: r,
			award: i,
			medals: a,
			xp: c
		});
	}
	return t;
}
var xo = (e) => 40 * (e - 1) ** 2;
function So(e) {
	let t = e.reduce((e, t) => e + t.xp, 0), n = 1;
	for (; xo(n + 1) <= t;) n++;
	let r = {};
	for (let t of e) for (let e of t.medals) r[e.key] = (r[e.key] ?? 0) + 1;
	return {
		totalXp: t,
		level: n,
		levelFloorXp: xo(n),
		nextLevelXp: xo(n + 1),
		trades: e.length,
		medalCounts: r
	};
}
//#endregion
//#region src/xpSound.ts
var Co = null;
function wo() {
	if (typeof window > "u") return null;
	let e = window.AudioContext ?? window.webkitAudioContext;
	if (!e) return null;
	if (!Co) try {
		Co = new e();
	} catch {
		return null;
	}
	return Co.state === "suspended" && Co.resume().catch(() => {}), Co;
}
function To(e, t, n, r, i, a = "triangle", o = 0) {
	let s = e.createOscillator(), c = e.createGain();
	s.type = a, s.detune.value = o, s.frequency.setValueAtTime(n, t), c.gain.setValueAtTime(0, t), c.gain.linearRampToValueAtTime(i, t + .012), c.gain.exponentialRampToValueAtTime(1e-4, t + r), s.connect(c).connect(e.destination), s.start(t), s.stop(t + r + .02);
}
function Eo(e, t, n, r, i) {
	To(e, t, n, r, i, "triangle"), To(e, t, n * 1.5, r, i * .35, "triangle", 4), To(e, t, n / 2, r, i * .45, "sine");
}
var Do = {
	C4: 261.63,
	D4: 293.66,
	E4: 329.63,
	F4: 349.23,
	G4: 392,
	A4: 440,
	B4: 493.88,
	C5: 523.25,
	D5: 587.33,
	E5: 659.25,
	F5: 698.46,
	G5: 783.99,
	A5: 880,
	C6: 1046.5
};
function Oo(e, t) {
	let n = .16;
	To(e, t + 0, Do.G4, .1, n, "square"), To(e, t + .09, Do.C5, .1, n, "square"), To(e, t + .18, Do.E5, .1, n, "square"), Eo(e, t + .3, Do.G5, .34, n), Eo(e, t + .62, Do.E5, .18, n * .8), Eo(e, t + .78, Do.G5, .18, n * .8), Eo(e, t + .96, Do.C6, .85, n * 1.05), To(e, t + .96, Do.C4, .9, n * .5, "sine");
}
function ko(e, t) {
	let n = .145;
	To(e, t + 0, Do.C5, .1, n, "square"), To(e, t + .1, Do.E5, .1, n, "square"), Eo(e, t + .22, Do.G5, .5, n);
}
function Ao(e, t) {
	let n = .125;
	To(e, t + 0, Do.C4, .55, n * .55, "sine"), Eo(e, t + 0, Do.E4, .24, n), Eo(e, t + .22, Do.G4, .24, n), Eo(e, t + .44, Do.C5, .62, n * .95);
}
function jo(e, t) {
	let n = .11;
	To(e, t + 0, Do.D5, .12, n, "triangle"), To(e, t + .12, Do.F5, .3, n * .9, "triangle");
}
function Mo(e, t) {
	To(e, t + 0, Do.A4, .09, .075, "sine");
}
var No = {
	flawless: Oo,
	solid: ko,
	disciplined: Ao,
	loose: jo,
	unstructured: Mo
};
function Po(e) {
	let t = wo();
	if (t) try {
		(No[e] ?? Mo)(t, t.currentTime + .02);
	} catch {}
}
function Fo() {
	let e = Co;
	Co = null, e && e.close().catch(() => {});
}
var Io = .1;
function Lo(e, t = 14) {
	if (e.length < t + 1) return null;
	let n = (t) => {
		let n = e[t], r = e[t - 1].close;
		return Math.max(n.high - n.low, Math.abs(n.high - r), Math.abs(n.low - r));
	}, r = 0;
	for (let e = 1; e <= t; e++) r += n(e);
	r /= t;
	for (let i = t + 1; i < e.length; i++) r = (r * (t - 1) + n(i)) / t;
	return r;
}
function Ro(e, t, n = 2) {
	let r = [];
	for (let i = n; i < e.length - n; i++) {
		let a = !0;
		for (let r = 1; r <= n && a; r++) a = t === "low" ? e[i].low < e[i - r].low && e[i].low < e[i + r].low : e[i].high > e[i - r].high && e[i].high > e[i + r].high;
		a && r.push(i);
	}
	return r;
}
function zo(e, t, n) {
	let r = Lo(e);
	if (r == null || !(r > 0) || !(n > 0)) return null;
	let i = t === "long", a = Ro(e, i ? "low" : "high"), o = null;
	for (let t = a.length - 1; t >= 0; t--) {
		let r = i ? e[a[t]].low : e[a[t]].high;
		if (i ? r < n : r > n) {
			o = r;
			break;
		}
	}
	if (o != null) {
		let e = i ? o - Io * r : o + Io * r, t = Math.abs(n - e) / r;
		if (t >= .5 && t <= 3) return {
			stop: e,
			atr: r,
			method: "swing",
			distanceAtr: t,
			swing: o
		};
	}
	return {
		stop: i ? n - 2 * r : n + 2 * r,
		atr: r,
		method: "atr",
		distanceAtr: 2,
		swing: null
	};
}
function Bo(e, t, n) {
	let r = Math.abs(e - t);
	return r < .5 * n ? "inside_noise" : r > 3 * n ? "wide" : "ok";
}
//#endregion
//#region src/core/trainer/oath.ts
var Vo = "paper-arena:v0:oath", Ho = {
	riskPct: [.1, 5],
	maxLeverage: [1, 50],
	tradesPerDay: [1, 50]
}, Uo = 6048e5, Wo = () => ({
	riskPct: 1,
	maxLeverage: 5,
	tradesPerDay: 3,
	setAt: 0,
	lockedUntil: 0
});
function Go(e) {
	let t = new Date(e), n = (t.getUTCDay() + 6) % 7;
	return Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() - n);
}
var Ko = (e) => Go(e) + Uo;
function qo(e) {
	for (let t of [
		"riskPct",
		"maxLeverage",
		"tradesPerDay"
	]) {
		let n = e[t];
		if (typeof n != "number" || !Number.isFinite(n)) return `${t}_invalid`;
		let [r, i] = Ho[t];
		if (n < r || n > i) return `${t}_out_of_range`;
	}
	return Number.isInteger(e.tradesPerDay) ? null : "tradesPerDay_invalid";
}
var Jo = (e, t) => t < e.lockedUntil, Yo = (e, t) => !Jo(e, t);
function Xo(e, t, n) {
	if (Jo(e, n)) return {
		ok: !1,
		reason: "locked",
		unlocksAt: e.lockedUntil
	};
	let r = qo(t);
	if (r) return {
		ok: !1,
		reason: r
	};
	let i = [...e.history ?? []];
	if (e.setAt !== 0) for (let r of [
		"riskPct",
		"maxLeverage",
		"tradesPerDay"
	]) e[r] !== t[r] && i.push({
		date: n,
		field: r,
		from: e[r],
		to: t[r]
	});
	return {
		ok: !0,
		oath: {
			riskPct: t.riskPct,
			maxLeverage: t.maxLeverage,
			tradesPerDay: t.tradesPerDay,
			setAt: n,
			lockedUntil: Ko(n),
			history: i.slice(-40)
		}
	};
}
function Zo(e) {
	return Array.isArray(e) ? e.filter((e) => !!e && typeof e.date == "number" && [
		"riskPct",
		"maxLeverage",
		"tradesPerDay"
	].includes(e.field) && typeof e.from == "number" && typeof e.to == "number").slice(-40) : [];
}
async function Qo(e) {
	try {
		let t = await e.get(Vo);
		if (t && qo(t) == null) return {
			...t,
			setAt: Number(t.setAt) || 0,
			lockedUntil: Number(t.lockedUntil) || 0,
			history: Zo(t.history)
		};
	} catch {}
	return Wo();
}
async function $o(e, t) {
	try {
		await e.set(Vo, JSON.parse(JSON.stringify(t)));
	} catch {}
}
//#endregion
//#region src/core/trainer/seals.ts
var es = 1.02;
function ts(e, t, n, r) {
	let { entry: i, stop: a, target: o, side: s } = e, c = s === "long" ? 1 : -1, l = a == null ? null : Math.abs(i - a) * e.qty, u;
	if (a == null) u = {
		ok: !1,
		code: "no_stop",
		detail: {}
	};
	else if ((i - a) * c <= 0) u = {
		ok: !1,
		code: "wrong_side",
		detail: { distance: i - a }
	};
	else {
		let e = Math.abs(i - a), t = r != null && r > 0 && Bo(i, a, r) === "inside_noise";
		u = {
			ok: !t,
			code: t ? "inside_noise" : "ok",
			detail: r != null && r > 0 ? {
				distance: e,
				atr: r,
				distanceAtr: e / r
			} : { distance: e }
		};
	}
	let d = i * e.qty, f = e.leverage ?? (t.equity > 0 ? d / t.equity : Infinity), p = f > n.maxLeverage + 1e-9, m;
	if (!(t.equity > 0) || !(e.qty > 0)) m = {
		ok: !1,
		code: "invalid",
		detail: {}
	};
	else if (l == null) m = {
		ok: !1,
		code: "no_stop",
		detail: {
			leverage: f,
			maxLeverage: n.maxLeverage
		}
	};
	else {
		let e = l / t.equity * 100, r = e > n.riskPct * es;
		m = {
			ok: !r && !p,
			code: r && p ? "risk_and_leverage_over" : r ? "risk_over" : p ? "leverage_over" : "ok",
			detail: {
				risk: l,
				riskPct: e,
				allowedPct: n.riskPct,
				leverage: f,
				maxLeverage: n.maxLeverage
			}
		};
	}
	let h;
	if (o == null) h = {
		ok: !1,
		code: "no_target",
		detail: {}
	};
	else if ((o - i) * c <= 0) h = {
		ok: !1,
		code: "wrong_side",
		detail: { reward: (o - i) * c }
	};
	else if (a == null || (i - a) * c <= 0) h = {
		ok: !0,
		code: "ok",
		detail: { reward: (o - i) * c }
	};
	else {
		let e = (o - i) * c / Math.abs(i - a);
		h = {
			ok: e >= 1 - 1e-9,
			code: e >= 1 - 1e-9 ? "ok" : "below_1r",
			detail: { rr: e }
		};
	}
	let g = t.tradesToday + 1, _ = {
		ok: g <= n.tradesPerDay,
		code: g <= n.tradesPerDay ? "ok" : "over_daily",
		detail: {
			count: g,
			limit: n.tradesPerDay
		}
	};
	return {
		stop: u,
		size: m,
		target: h,
		trades: _
	};
}
var ns = {
	noStop: 40,
	insideNoise: 15,
	perExtraRiskPct: 10,
	riskCap: 60,
	noTarget: 10,
	below1r: 5,
	leverage: 10,
	overTrades: 20,
	cap: 100
};
function rs(e, t) {
	let n = [], r = (e, t) => {
		t > 0 && n.push({
			code: e,
			cost: t
		});
	};
	if (e.stop.code === "no_stop" ? r("no_stop", ns.noStop) : e.stop.code === "inside_noise" ? r("inside_noise", ns.insideNoise) : e.stop.code === "wrong_side" && r("wrong_side", ns.noStop), e.size.code === "risk_over" || e.size.code === "risk_and_leverage_over") {
		let t = Math.max(0, e.size.detail.riskPct - e.size.detail.allowedPct);
		r("risk_over", Math.min(ns.riskCap, Math.max(1, Math.round(t * ns.perExtraRiskPct))));
	}
	return (e.size.code === "leverage_over" || e.size.code === "risk_and_leverage_over" || e.size.code === "no_stop" && e.size.detail.leverage > e.size.detail.maxLeverage) && r("leverage_over", ns.leverage), e.target.code === "no_target" ? r("no_target", ns.noTarget) : e.target.code === "wrong_side" ? r("wrong_side_target", ns.noTarget) : e.target.code === "below_1r" && r("below_1r", ns.below1r), e.trades.ok || r("over_daily", ns.overTrades), {
		total: Math.min(ns.cap, n.reduce((e, t) => e + t.cost, 0)),
		items: n
	};
}
//#endregion
//#region src/core/trainer/grade.ts
var is = [
	"BTC",
	"ETH",
	"SOL",
	"xyz:GOLD",
	"xyz:SILVER"
], as = {
	stop: 20,
	size: 20,
	target: 15,
	integrity: 25,
	execution: 10
}, os = 90, ss = [
	"A",
	"B",
	"C",
	"D",
	"F"
], cs = (e, t) => ss.indexOf(e) < ss.indexOf(t) ? t : e;
function ls(e, t) {
	let n = 0;
	for (let r of t) r.from != null && (r.to == null || (e === "long" ? r.to < r.from : r.to > r.from)) && n++;
	return n;
}
function us(e) {
	let t = e.side === "long" ? 1 : -1, n = e.originalStop != null && (e.entry - e.originalStop) * t > 0, r = n ? Math.abs(e.entry - e.originalStop) : null, i = r == null ? null : r * e.qty, a = i != null && e.equityAtEntry > 0 ? i / e.equityAtEntry * 100 : null, o = r == null ? null : (e.exit - e.entry) * t / r, s = ls(e.side, e.stopMoves), c = e.exitReason === "liquidation", l = a != null && a > e.oath.riskPct * 1.02, u = e.leverage != null && e.leverage > e.oath.maxLeverage + 1e-9, d = n && !l && !u, f = n && e.atr != null && e.atr > 0 && Math.abs(e.entry - e.originalStop) < .5 * e.atr, p = n && !f && s === 0, m = e.target != null && (e.target - e.entry) * t > 0, h = m && r != null ? (e.target - e.entry) * t / r : null, g = m && (h == null || h >= 1 - 1e-9), _ = e.targetHit || (e.partials ?? []).some((e) => e.atPlan), v = n ? f ? as.stop / 2 : as.stop : 0, y = d ? as.size : 0, b = g ? as.target : 0, x = n ? Math.max(0, as.integrity - 12.5 * s) : 0, S = c ? 0 : _ ? as.execution : e.exitReason === "stop" || e.exitReason === "trailingStop" ? s === 0 && n ? as.execution : 0 : n && s === 0 ? as.execution / 2 : 0, C = v + y + b + x + S, w = C / os, T = w >= .85 ? "A" : w >= .7 ? "B" : w >= .55 ? "C" : w >= .35 ? "D" : "F";
	s >= 2 ? T = cs(T, "D") : s === 1 && (T = cs(T, "C")), l && (T = cs(T, "C")), c && (T = "F");
	let E = n && e.reached1RAt != null && e.stopMoves.some((n) => n.to != null && n.t >= e.reached1RAt && (n.to - e.entry) * t >= 0), D = e.gateTaken ?? 0, O = Math.round(C - s * 15 - D + (E ? 5 : 0) - (e.tilt ? 10 : 0) - (c ? 30 : 0)), k = [], A = p && d && g, j = s === 0 && d && D === 0;
	T === "A" && A && j && k.push("EXCELLENT"), (e.exitReason === "stop" || e.exitReason === "trailingStop") && n && s === 0 && k.push("STOP_HONORED"), j && e.exitReason === "target" && (o ?? 0) >= 2 && k.push("SNIPER"), e.realizedPnl < 0 && (T === "A" || T === "B") && k.push("IRON_WILL"), c && k.push("HUMILIATION"), e.tilt && k.push("TILT"), s > 0 && k.push("WIDENED");
	let M = e.realizedPnl > 0 && (_ || o != null && o >= 1) && s === 0 && d && is.includes(e.coin);
	return {
		grade: T,
		light: O,
		medals: k,
		verdict: {
			stop: {
				ok: p,
				code: n ? s > 0 ? "widened" : f ? "inside_noise" : "ok" : "no_stop"
			},
			size: {
				ok: d,
				code: n ? l && u ? "risk_and_leverage_over" : l ? "risk_over" : u ? "leverage_over" : "ok" : "no_stop"
			},
			target: {
				ok: g,
				code: m ? g ? "ok" : "below_1r" : "no_target"
			}
		},
		elementMinted: M,
		facts: {
			r: o,
			widenings: s,
			riskPct: a,
			breakEvenBonus: E,
			points: C
		}
	};
}
//#endregion
//#region src/core/trainer/plans.ts
var ds = "paper-arena:v0:plans", fs = () => ({
	v: 1,
	open: {},
	closed: [],
	graded: {}
});
function ps(e) {
	let t = fs();
	if (!e || typeof e != "object") return t;
	let n = e;
	return n.open && typeof n.open == "object" && (t.open = n.open), Array.isArray(n.closed) && (t.closed = n.closed.slice(-50)), n.graded && typeof n.graded == "object" && (t.graded = n.graded), t;
}
function ms(e, t, n, r) {
	let i = e.open[t.coin];
	if (i && i.openedAt === t.openedAt) return i;
	let a = {
		coin: t.coin,
		side: t.side,
		entry: t.entry,
		qty: t.initialQty || t.qty,
		leverage: t.leverage,
		equityAtEntry: t.equityAtEntry,
		openedAt: t.openedAt,
		originalStop: t.initialStop,
		target: t.target,
		stopMoves: [],
		gateTaken: n,
		reached1RAt: null,
		partials: [],
		atr: r
	};
	return e.open[t.coin] = a, a;
}
function hs(e, t, n, r, i) {
	let a = e.open[t];
	a && (a.originalStop == null && r != null && n == null && (a.originalStop = r), a.stopMoves.push({
		t: i,
		from: n,
		to: r
	}));
}
function gs(e, t, n, r, i, a, o) {
	let s = e.open[t];
	s && s.partials.push({
		t: o,
		qty: n,
		px: r,
		atPlan: _s(r, i, a)
	});
}
function _s(e, t, n) {
	return t == null ? !1 : n === "long" ? e >= t * .999 : e <= t * 1.001;
}
function vs(e, t, n, r) {
	let i = e.open[t];
	if (!i || i.reached1RAt != null || i.originalStop == null) return !1;
	let a = Math.abs(i.entry - i.originalStop), o = i.side === "long" ? 1 : -1;
	return !(a > 0) || (n - i.entry) * o < a ? !1 : (i.reached1RAt = r, !0);
}
function ys(e, t) {
	for (let n = e.length - 1; n >= 0; n--) if (e[n].realizedPnl < 0) return t - e[n].closedAt < 6e4 && t >= e[n].closedAt;
	return !1;
}
function bs(e, t) {
	return e.open[t.coin] || {
		coin: t.coin,
		side: t.side,
		entry: t.entry,
		qty: t.qty,
		leverage: t.leverage,
		equityAtEntry: t.equityAtEntry,
		openedAt: t.openedAt,
		originalStop: t.initialStop,
		target: t.target,
		stopMoves: [],
		gateTaken: 0,
		reached1RAt: null,
		partials: [],
		atr: null
	};
}
var xs = (e, t) => e.exitReason === "target" || e.realizedPnl > 0 && _s(e.exit, t, e.side);
function Ss(e, t, n, r) {
	let i = e.target ?? t.target;
	return {
		coin: e.coin,
		side: e.side,
		entry: e.entry,
		exit: e.exit,
		qty: e.qty,
		leverage: e.leverage,
		realizedPnl: e.realizedPnl,
		equityAtEntry: e.equityAtEntry,
		exitReason: e.exitReason,
		originalStop: e.initialStop ?? t.originalStop,
		target: i,
		stopMoves: t.stopMoves,
		targetHit: xs(e, i),
		partials: t.partials,
		reached1RAt: t.reached1RAt,
		gateTaken: t.gateTaken,
		tilt: ys(r, e.placedAt ?? e.openedAt),
		atr: t.atr,
		oath: {
			riskPct: n.riskPct,
			maxLeverage: n.maxLeverage
		}
	};
}
function Cs(e, t, n, r) {
	delete e.open[t.coin], e.closed.push({
		id: t.id,
		rec: n,
		debrief: r,
		closedAt: t.closedAt
	}), e.closed.length > 50 && e.closed.splice(0, e.closed.length - 50), e.graded[t.id] = {
		grade: r.grade,
		light: r.light,
		medals: r.medals,
		minted: r.elementMinted
	};
}
//#endregion
//#region src/core/trainer/wiring.ts
function ws(e, t) {
	return t === "liquidation" ? "liquidated" : e.grade === "A" && e.medals.includes("EXCELLENT") ? "flawless" : e.medals.includes("STOP_HONORED") && e.verdict.stop.ok && e.verdict.size.ok ? "stop_honored" : e.grade === "A" || e.grade === "B" ? "disciplined" : e.grade === "C" ? "solid" : e.grade === "D" ? "loose" : "unstructured";
}
var Ts = (e, t) => `house:${e}:${t}`, Es = () => Math.random().toString(36).slice(2, 10).padEnd(8, "0"), Ds = {
	BTC: "keystone",
	ETH: "aether",
	SOL: "sunglass",
	"xyz:GOLD": "oldsun",
	"xyz:SILVER": "moonmetal"
}, Os = (e) => e.targetHit || (e.partials ?? []).some((e) => e.atPlan), ks = "paper-arena:v0:trials", As = {
	stops: 3,
	profit: 3,
	oath: 5
}, js = (e) => ({
	week: Go(e),
	stops: 0,
	profit: 0,
	oath: 0
});
function Ms(e, t) {
	let n = e;
	if (!n || typeof n != "object" || n.week !== Go(t)) return js(t);
	let r = (e) => Math.max(0, Math.floor(Number(e)) || 0);
	return {
		week: n.week,
		stops: r(n.stops),
		profit: r(n.profit),
		oath: r(n.oath),
		...n.chestOpened === !0 ? { chestOpened: !0 } : {}
	};
}
function Ns(e, t, n) {
	return {
		...e,
		stops: e.stops + +!!t.medals.includes("STOP_HONORED"),
		profit: e.profit + +!!Os(n),
		oath: e.oath + +!!t.verdict.size.ok
	};
}
var Ps = (e) => e.stops >= As.stops && e.profit >= As.profit && e.oath >= As.oath, Fs = [
	"no",
	"one",
	"two",
	"three",
	"four",
	"five",
	"six",
	"seven",
	"eight",
	"nine",
	"ten"
], Is = (e) => {
	let t = Math.round(e);
	return `${t <= 10 ? Fs[t] : String(t)} times your rule`;
};
function Ls(e, t) {
	let n = new Set(e.items.map((e) => e.code)), r = [];
	if (n.has("no_stop") ? r.push("no stop") : n.has("wrong_side") ? r.push("the stop sits on the wrong side") : n.has("inside_noise") && r.push("the stop sits inside the noise"), n.has("risk_over") || t != null && t > 1.02 && n.size ? r.push(t != null && t >= 1.5 ? Is(t) : "over your rule") : n.has("leverage_over") && r.push("more leverage than your Oath"), !r.length && n.has("no_target") ? r.push("no target") : !r.length && (n.has("below_1r") || n.has("wrong_side_target")) ? r.push("a target that pays less than it risks") : !r.length && n.has("over_daily") && r.push("past your trades for the day"), !r.length) return "";
	let i = r.slice(0, 2).join(", and ");
	return `${i[0].toUpperCase() + i.slice(1) + "."} You can take it. ${e.total >= 40 ? "It will cost you Light." : "It costs a little Light."}`;
}
var Rs = "Every seal holds. Write it when you are ready.";
function zs(e, t) {
	if (t.exitReason === "liquidation") return "The margin is gone. The House keeps no grudge. Begin again.";
	if (t.tilt) return "So soon after a loss. Breathe first.";
	let n = t.realizedPnl > 0;
	return e.grade === "A" && e.medals.includes("EXCELLENT") ? "Planned, sized and kept. This is what the House pays for." : e.medals.includes("STOP_HONORED") && e.verdict.stop.ok ? "It held where you wrote it. That is the whole craft." : n && (e.grade === "D" || e.grade === "F") ? "The market paid you. The House did not." : n ? "A fair plan, mostly kept. Close the loose seal and it turns gold." : e.grade === "A" || e.grade === "B" ? "The loss is the price of a clean plan. Pay it without flinching." : "There was little written to hold you. Write the line before the trade.";
}
var Bs = [
	"",
	"once",
	"twice",
	"three times"
];
function Vs(e, t) {
	let n = e.facts.widenings, r = e.verdict.stop.code === "no_stop" ? "no stop" : n > 0 ? `widened ${n <= 3 ? Bs[n] : `${n} times`}` : e.verdict.stop.code === "inside_noise" ? "inside the noise" : t.exitReason === "stop" || t.exitReason === "trailingStop" ? "honored" : "kept as written", i = e.facts.riskPct, a = t.oath.riskPct, o = (e) => `${+e.toFixed(+(e < 10))}%`;
	return {
		stop: r,
		size: e.verdict.size.code === "no_stop" ? "no stop to size" : e.verdict.size.code === "leverage_over" ? `${t.leverage ?? "?"}x vs ${t.oath.maxLeverage}x rule` : e.verdict.size.code.startsWith("risk") && i != null ? `${o(i)} vs ${o(a)} rule` : i == null ? "inside rule" : `${o(i)} inside rule`,
		target: e.verdict.target.code === "no_target" ? "no target" : e.verdict.target.code === "below_1r" ? "under 1R" : Os(t) ? "taken at plan" : "set, not reached"
	};
}
//#endregion
//#region src/house/assets.ts
var Hs = () => new URL([".", "house/"].join("/"), import.meta.url).href, Us = "";
function Ws(e) {
	let t = e || Hs();
	Us = t.endsWith("/") ? t : `${t}/`;
}
var Gs = (e) => (Us || (Ws(), Us)) + e, Ks = (e) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${e}</svg>`, qs = (e, t, n) => `<path d="M${e} ${t - n}L${e + n * .22} ${t - n * .22}L${e + n} ${t}L${e + n * .22} ${t + n * .22}L${e} ${t + n}L${e - n * .22} ${t + n * .22}L${e - n} ${t}L${e - n * .22} ${t - n * .22}Z"/>`, Js = {
	coins: Ks(`<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6.5" opacity=".5"/>${qs(12, 12, 4.2)}`),
	foundry: Ks("<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1\"/><circle cx=\"12\" cy=\"12\" r=\"6.5\" opacity=\".55\"/>"),
	indices: Ks("<path d=\"M3 20.5h18M4.5 18h15M6 18V9M10 18V9M14 18V9M18 18V9M3.5 8.5L12 3.5l8.5 5Z\"/>"),
	metals: Ks("<circle cx=\"12\" cy=\"12\" r=\"4.2\"/><path d=\"M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M5.3 18.7L7 17M17 7l1.7-1.7\"/>"),
	tide: Ks("<path d=\"M2.5 9c2.4-2 4.8-2 7.2 0s4.8 2 7.2 0 3.2-1.5 4.6-.7M2.5 14c2.4-2 4.8-2 7.2 0s4.8 2 7.2 0 3.2-1.5 4.6-.7M2.5 19c2.4-2 4.8-2 7.2 0s4.8 2 7.2 0 3.2-1.5 4.6-.7\"/>"),
	money: Ks(`<path d="M12 3.5v16M7 20.5h10M4.5 7.5h15"/><path d="M4.5 7.5L2 13.5a2.6 2.6 0 0 0 5 0L4.5 7.5ZM19.5 7.5L17 13.5a2.6 2.6 0 0 0 5 0l-2.5-6Z"/>${qs(12, 3.5, 1.6)}`),
	BTC: Ks(`<path d="M12 2.5l8 4.5v10l-8 4.5-8-4.5V7Z"/><path d="M12 6.5l4.5 2.6v5.8L12 17.5l-4.5-2.6V9.1Z" opacity=".55"/>${qs(12, 12, 2.6)}`),
	ETH: Ks("<path d=\"M12 2.5l6 9.5-6 3.6-6-3.6Z\"/><path d=\"M6 13.4l6 8.1 6-8.1-6 3.6Z\" opacity=\".7\"/>"),
	SOL: Ks("<circle cx=\"12\" cy=\"12\" r=\"4\"/><circle cx=\"12\" cy=\"12\" r=\"8.5\" stroke-dasharray=\"2 2.4\" opacity=\".7\"/>"),
	HYPE: Ks("<path d=\"M12 21.5c-4 0-6.5-2.8-6.5-6.3 0-3.7 3-5.6 3.7-9 1.7 1.3 2.4 3 2.4 4.6 1-1.1 1.6-2.5 1.6-4.3 3.3 2.2 5.3 5.4 5.3 8.7 0 3.5-2.5 6.3-6.5 6.3Z\"/>"),
	"xyz:GOLD": Ks(`<circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="9" opacity=".45"/>${qs(12, 12, 2.2)}`),
	"xyz:SILVER": Ks(`<path d="M15.5 4a8.5 8.5 0 1 0 4.5 13.5A7 7 0 0 1 15.5 4Z"/>${qs(8.5, 9, 1.8)}`)
}, Ys = {
	BTC: "BTC",
	ETH: "ETH",
	SOL: "SOL",
	HYPE: "HYPE",
	"xyz:GOLD": "GOLD",
	"xyz:SILVER": "SILVER",
	coins: "coins",
	foundry: "foundry",
	indices: "indices",
	metals: "metals",
	tide: "tide",
	money: "money"
}, Xs = (e) => `<img class="med" src="${Gs(`med/${e}.webp`)}" alt="" draggable="false" />`, Zs = (e, t) => {
	let n = Ys[e] ?? Ys[t];
	return n ? Xs(n) : Js[e] ?? Js[t] ?? Js.coins;
}, Qs = Ks(qs(12, 12, 9)), X = (e, t = "0 0 24 24", n = 1.2) => `<svg viewBox="${t}" fill="none" stroke="currentColor" stroke-width="${n}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${e}</svg>`, $s = (e, t, n) => `<path d="M${e} ${t - n}L${e + n * .22} ${t - n * .22}L${e + n} ${t}L${e + n * .22} ${t + n * .22}L${e} ${t + n}L${e - n * .22} ${t + n * .22}L${e - n} ${t}L${e - n * .22} ${t - n * .22}Z"/>`, ec = {
	EXCELLENT: X("<path d=\"M5 19.5V15M9.5 19.5V11.5M14 19.5V8M18.5 19.5V4.5\" stroke-width=\"2.4\"/><path d=\"M3.5 21h17\" opacity=\".6\"/>"),
	STOP_HONORED: X("<path d=\"M12 2.8l7 2.7v6c0 4.4-2.9 7.6-7 9.7-4.1-2.1-7-5.3-7-9.7v-6Z\"/><path d=\"M8.6 12.2l2.5 2.6 4.4-5\"/><path d=\"M3 21h18\" opacity=\".5\"/>"),
	SNIPER: X("<circle cx=\"12\" cy=\"12\" r=\"7\"/><circle cx=\"12\" cy=\"12\" r=\"2.4\"/><path d=\"M12 2v5M12 17v5M2 12h5M17 12h5\"/>"),
	IRON_WILL: X(`<circle cx="12" cy="12" r="8.5" opacity=".55"/>${$s(12, 12, 8)}<circle cx="12" cy="12" r="1.7"/>`),
	HUMILIATION: X("<path d=\"M12 21.5c-3.8 0-6-2.6-6-5.8C6 12 12 9 12 2.5c3.4 2.6 6 6 6 9.7 0 5.6-2.2 9.3-6 9.3Z\" opacity=\".9\"/><path d=\"M12 21.5v-8M9.4 17l2.6-3.5 2.6 3.5\" opacity=\".7\"/>"),
	TILT: X("<path d=\"M3.5 15.5L20.5 8.5\"/><path d=\"M12 12v8M8.5 20.5h7\"/><circle cx=\"12\" cy=\"12\" r=\"1.6\"/><path d=\"M5.5 15l-1.8 3.5h4Z M18.5 9l-1.8 3.5h4Z\" opacity=\".7\"/>"),
	WIDENED: X("<path d=\"M12 3v18\" stroke-dasharray=\"1.6 2.2\" opacity=\".6\"/><path d=\"M8 12H3m0 0l3-3m-3 3l3 3M16 12h5m0 0l-3-3m3 3l-3 3\"/>")
}, tc = X("<rect x=\"5.5\" y=\"10.5\" width=\"13\" height=\"9.5\" rx=\"2.2\"/><path d=\"M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5\"/><circle cx=\"12\" cy=\"15.2\" r=\"1.2\" fill=\"currentColor\"/>", "0 0 24 24", 1.4), nc = X("<path d=\"M5 12.5l4.5 4.5L19 7.5\"/>", "0 0 24 24", 2.4), rc = {
	stops: X(`<path d="M3 20l6.5-9.5 3 4 2.2-3L21 20Z"/><path d="M10.5 20c1.4-1.6 3-1.6 3-3.4 0-1.6-1.6-1.6-1.6-3.1" stroke-dasharray="1.4 1.8" opacity=".8"/>${$s(17.5, 5.5, 2.6)}`),
	profit: X("<path d=\"M5 20v-5M10 20v-8M15 20v-11M20 20V6\" stroke-width=\"2.6\"/><path d=\"M3.5 11l5-4 3.5 2.5L18 3.5\" opacity=\".9\"/><path d=\"M14.4 3.5H18v3.6\" opacity=\".9\"/>"),
	oath: X(`<path d="M12 3v17M7.5 20.5h9"/><path d="M4 7.5h16"/><path d="M4 7.5L1.8 13a2.4 2.4 0 0 0 4.4 0Z M20 7.5L17.8 13a2.4 2.4 0 0 0 4.4 0Z" transform="translate(.4 0)"/>${$s(12, 3.3, 1.5)}`)
}, ic = {
	stops: X(`<circle cx="12" cy="12" r="8.6"/>${$s(12, 12, 6.6)}<circle cx="12" cy="12" r="1.2" fill="currentColor"/>`, "0 0 24 24", 1.1),
	win: X("<path d=\"M5 19L19 5M10 5h9v9\"/>", "0 0 24 24", 1.8),
	loss: X("<path d=\"M19 5L5 19M14 19H5v-9\"/>", "0 0 24 24", 1.8),
	chain: X("<path d=\"M10.2 13.8a3.6 3.6 0 0 0 5 0l3-3a3.6 3.6 0 0 0-5-5l-.9.9\"/><path d=\"M13.8 10.2a3.6 3.6 0 0 0-5 0l-3 3a3.6 3.6 0 0 0 5 5l.9-.9\"/><path d=\"M4 4l2 2M20 20l-2-2\" opacity=\".9\"/>", "0 0 24 24", 1.5),
	steps: X("<path d=\"M7.5 5c1.8 0 2.6 1.8 2.3 3.6-.3 1.6-1.3 2.6-2.7 2.4C5.5 10.8 5 8.4 5.6 6.6 6 5.5 6.7 5 7.5 5Z\"/><path d=\"M6.4 14.2h3.2v1.2c0 .8-.7 1.4-1.6 1.4s-1.6-.6-1.6-1.4Z\"/><path d=\"M16.5 9c1.8 0 2.6 1.8 2.3 3.6-.3 1.6-1.3 2.6-2.7 2.4-1.6-.2-2.1-2.6-1.5-4.4.4-1.1 1.1-1.6 1.9-1.6Z\"/><path d=\"M15.4 18.2h3.2v1.2c0 .8-.7 1.4-1.6 1.4s-1.6-.6-1.6-1.4Z\"/>", "0 0 24 24", 1.1),
	bars: X("<path d=\"M5 20v-5M10 20v-9M15 20v-6M20 20V6\" stroke-width=\"2.6\"/>"),
	flame: X("<path d=\"M12 21.5c-4.2 0-6.8-2.8-6.8-6.4 0-3.9 3.2-5.9 3.9-9.6 1.9 1.4 2.5 3.2 2.5 4.9 1.1-1.2 1.7-2.7 1.7-4.6 3.5 2.3 5.5 5.6 5.5 9.1 0 3.7-2.7 6.6-6.8 6.6Z\"/><path d=\"M12 21.5c-1.6 0-2.7-1.2-2.7-2.7 0-1.8 1.6-2.5 2.7-4.4 1.4 1.4 2.7 2.7 2.7 4.4 0 1.5-1.1 2.7-2.7 2.7Z\" opacity=\".7\"/>", "0 0 24 24", 1.1),
	daily: X(`<circle cx="12" cy="12" r="8.5"/>${$s(12, 12, 5.5)}<path d="M12 3.5v-1.5M12 22v-1.5M3.5 12H2M22 12h-1.5" opacity=".6"/>`, "0 0 24 24", 1.1),
	trials: X(`<circle cx="12" cy="12" r="9"/>${$s(12, 12, 6)}`, "0 0 24 24", 1.1),
	season: X(`<circle cx="12" cy="12" r="9"/>${$s(12, 12, 6)}`, "0 0 24 24", 1.1),
	level: X(`<circle cx="12" cy="12" r="9"/>${$s(12, 12, 6)}`, "0 0 24 24", 1.1),
	ladder: X(`<circle cx="12" cy="12" r="9"/>${$s(12, 12, 6)}`, "0 0 24 24", 1.1),
	medals: X(`<circle cx="12" cy="12" r="9"/>${$s(12, 12, 6)}`, "0 0 24 24", 1.1),
	orbit: X(`<ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-24 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(36 12 12)" opacity=".7"/>${$s(12, 12, 3.2)}`, "0 0 24 24", 1),
	compass: X(`<circle cx="12" cy="12" r="9" opacity=".6"/>${$s(12, 12, 8)}<circle cx="12" cy="12" r="1.4"/>`, "0 0 24 24", 1),
	trend: X("<path d=\"M4 18l5-6 3.5 3L20 5.5\"/><path d=\"M15 5.5h5V10.5\"/>", "0 0 24 24", 1.6)
};
X("<path d=\"M12 2.5l5.2 4v2.2H6.8V6.5Z\"/><path d=\"M8 8.7v11M16 8.7v11M6 20.5h12M5 22h14\"/><path d=\"M9.4 20.5V12a2.6 2.6 0 0 1 5.2 0v8.5\" class=\"sh-win\"/><path d=\"M12 12.4v3\" opacity=\".6\"/>", "0 0 24 24", 1.1), X(`<circle cx="32" cy="30" r="8.5"/><ellipse cx="32" cy="30" rx="22" ry="8" transform="rotate(-28 32 30)"/><ellipse cx="32" cy="30" rx="22" ry="8" transform="rotate(34 32 30)"/><ellipse cx="32" cy="30" rx="12" ry="24"/><path d="M32 6v48M10 30h44" opacity=".5"/><path d="M24 58h16M28 54l-2 4M36 54l2 4"/>${$s(32, 30, 4)}`, "0 0 64 64", 1.1);
function ac(e) {
	let t = "url(#cgold)", n = `<path d="M24 86C24 46 56 32 100 32s76 14 76 54Z" fill="url(#cbody)" stroke="${t}" stroke-width="2.4"/>
    <path d="M36 82C37 54 62 42 100 42s63 12 64 40" fill="none" stroke="${t}" stroke-width="1" opacity=".5"/>
    <path d="M54 38v48M62 36v50M138 36v50M146 38v48" stroke="${t}" stroke-width="2" opacity=".9"/>
    <path d="M92 33h16" stroke="${t}" stroke-width="3"/>`, r = `<path d="M34 84L24 22C64 10 136 10 176 22L166 84Z" fill="url(#cinner)" stroke="${t}" stroke-width="2.4"/>
    <path d="M44 78L36 30C70 22 130 22 164 30L156 78Z" fill="none" stroke="${t}" stroke-width="1" opacity=".5"/>
    <path d="M60 20L64 82M140 20L136 82" stroke="${t}" stroke-width="2" opacity=".8"/>`, i = `<ellipse cx="100" cy="82" rx="62" ry="12" fill="#3a7fae" opacity=".55"/>
    <circle cx="66" cy="76" r="12" fill="url(#cgem)" stroke="#f1dcaa" stroke-width="1.2"/>
    <circle cx="134" cy="76" r="12" fill="url(#cgem)" stroke="#f1dcaa" stroke-width="1.2"/>
    <circle cx="100" cy="68" r="15" fill="${t}" stroke="#fff0b8" stroke-width="1.2"/>
    <circle cx="82" cy="78" r="10" fill="${t}" stroke="#fff0b8" stroke-width="1"/>
    <circle cx="119" cy="79" r="10" fill="${t}" stroke="#fff0b8" stroke-width="1"/>
    <path d="M100 38l3.4 10 10 3.4-10 3.4L100 65l-3.4-10-10-3.4 10-3.4Z" fill="#fff6d6"/>
    <path d="M70 52l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z M132 46l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#cfefff"/>`, a = e === "glowing" ? "<path d=\"M26 86H174\" stroke=\"#fff3c4\" stroke-width=\"3\" opacity=\".95\"/><path d=\"M60 84L50 58M100 84V52M140 84L150 58M80 84L74 64M120 84L126 64\" stroke=\"#ffe9a8\" stroke-width=\"2\" stroke-linecap=\"round\" opacity=\".7\"/>" : "", o = `<path d="M24 86H176V132a8 8 0 0 1-8 8H32a8 8 0 0 1-8-8Z" fill="url(#cbody)" stroke="${t}" stroke-width="2.4"/>
    <rect x="24" y="86" width="152" height="9" fill="${t}" opacity=".9"/>
    <path d="M52 95v45M60 95v45M140 95v45M148 95v45" stroke="${t}" stroke-width="2" opacity=".85"/>
    <path d="M30 108h16M30 124h16M154 108h16M154 124h16" stroke="${t}" stroke-width="1.4" opacity=".8"/>
    <circle cx="100" cy="112" r="15" fill="#0a1020" stroke="${t}" stroke-width="2.2"/>
    <path d="M100 100l3.2 8.4 8.4 3.2-8.4 3.2-3.2 8.4-3.2-8.4-8.4-3.2 8.4-3.2Z" fill="none" stroke="${t}" stroke-width="1.3"/>`;
	return `<svg class="chest-svg" viewBox="0 0 200 150" aria-hidden="true">
    <defs>
      <linearGradient id="cgold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e3b0"/><stop offset=".5" stop-color="#d4b06a"/><stop offset="1" stop-color="#8a6a32"/></linearGradient>
      <linearGradient id="cbody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a2b46"/><stop offset="1" stop-color="#0a1020"/></linearGradient>
      <linearGradient id="cinner" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1730"/><stop offset="1" stop-color="#1f3a5e"/></linearGradient>
      <radialGradient id="cgem"><stop offset="0" stop-color="#e9fbff"/><stop offset=".55" stop-color="#58c9ee"/><stop offset="1" stop-color="#1f6f9c"/></radialGradient>
    </defs>
    ${e === "open" ? `${r}${i}${o}` : `${n}${o}${a}`}
  </svg>`;
}
//#endregion
//#region src/house/medals.ts
var oc = (e) => ec[e] ?? "", sc = (e, t = "") => `<img class="mimg ${t}" data-mk="${e}" src="${Gs(`medal/${e}.webp`)}" alt="" draggable="false" />`, cc = (e) => `<img class="chimg" data-ck="${e}" src="${Gs(`chest-${e}.webp`)}" alt="" draggable="false" />`;
function lc(e, t, n) {
	let r = (e) => {
		let r = e.target;
		if (!(!(r instanceof HTMLImageElement) || n && r.closest(n))) {
			if (r.dataset.mk) {
				let e = document.createElement("span");
				e.className = "mfb", e.innerHTML = oc(r.dataset.mk), r.replaceWith(e);
			} else r.dataset.ck && t && (r.outerHTML = t(r.dataset.ck));
		}
	};
	return e.addEventListener("error", r, !0), () => e.removeEventListener("error", r, !0);
}
//#endregion
//#region src/house/ora.ts
var uc = /* @__PURE__ */ new Set();
function dc() {
	uc.forEach((e) => e.pulse());
}
var fc = Math.PI * 2, pc = matchMedia("(prefers-reduced-motion: reduce)").matches;
function mc(e) {
	let t = document.createElement("canvas");
	t.setAttribute("aria-hidden", "true"), e.appendChild(t);
	let n = t.getContext("2d");
	if (!n) return () => {};
	let r = 0, i = 0, a = Math.min(devicePixelRatio || 1, 2), o = () => {
		r = e.clientWidth || 160, i = e.clientHeight || 150;
		let n = Math.round(r * a), o = Math.round(i * a);
		(t.width !== n || t.height !== o) && (t.width = n, t.height = o, t.style.width = "100%", t.style.height = "100%");
	};
	o();
	let s = [
		{
			R: 40,
			tx: 1.15,
			ty: 0,
			rz: .3,
			spin: .1,
			yspin: .12,
			w: 1.2,
			a: .9,
			gold: !1
		},
		{
			R: 33,
			tx: .55,
			ty: 1.2,
			rz: 2.2,
			spin: -.14,
			yspin: -.09,
			w: 1,
			a: .75,
			gold: !0
		},
		{
			R: 46,
			tx: 1.45,
			ty: .7,
			rz: 4.1,
			spin: .07,
			yspin: .06,
			w: .9,
			a: .6,
			gold: !1
		},
		{
			R: 27,
			tx: .9,
			ty: 2.4,
			rz: 1,
			spin: .17,
			yspin: .15,
			w: .9,
			a: .7,
			gold: !1
		},
		{
			R: 52,
			tx: 1.3,
			ty: 1.8,
			rz: 5.3,
			spin: -.05,
			yspin: .05,
			w: .7,
			a: .45,
			gold: !0
		}
	], c = [
		{
			ring: 0,
			at: .4,
			speed: .55,
			gold: !0,
			r: 1.7
		},
		{
			ring: 1,
			at: 2.6,
			speed: -.75,
			gold: !0,
			r: 1.5
		},
		{
			ring: 2,
			at: 4.4,
			speed: .4,
			gold: !0,
			r: 1.6
		},
		{
			ring: 4,
			at: 1.5,
			speed: -.3,
			gold: !0,
			r: 1.3
		},
		{
			ring: 3,
			at: 5.1,
			speed: .9,
			gold: !0,
			r: 1.2
		},
		{
			ring: 1,
			at: .2,
			speed: -.75,
			gold: !0,
			r: 1.1
		},
		{
			ring: 0,
			at: 3.7,
			speed: .55,
			gold: !1,
			r: 1.1
		},
		{
			ring: 3,
			at: 2,
			speed: .9,
			gold: !1,
			r: 1
		}
	], l = [], u = 0, d = 0, f = 0, p = 0, m = () => !document.hidden && h && (e.closest(".house-root")?.dataset.mode !== "advanced" || !!e.closest(".room")), h = !0;
	function g(e) {
		for (let t = 0; t < e; t++) {
			let e = Math.random() * fc, t = 3 + Math.random() * 9;
			l.push({
				x: 0,
				y: 0,
				vx: Math.cos(e) * t,
				vy: Math.sin(e) * t - 2,
				life: 0,
				max: 2.2 + Math.random() * 2.4,
				r: .5 + Math.random() * .9
			});
		}
	}
	function _(e, t, n) {
		let r = Math.cos(t) * e.R * n, i = Math.sin(t) * e.R * n, a = i * Math.cos(e.tx), o = i * Math.sin(e.tx), s = e.ty + d * e.yspin, c = r * Math.cos(s) + o * Math.sin(s), l = -r * Math.sin(s) + o * Math.cos(s), u = e.rz + d * e.spin, f = c * Math.cos(u) - a * Math.sin(u), p = c * Math.sin(u) + a * Math.cos(u), m = 1 + l / 220;
		return [
			f * m,
			p * m,
			l / e.R
		];
	}
	function v(e) {
		let r = n, a = t.height / 100, o = t.width / a / 2;
		r.setTransform(1, 0, 0, 1, 0, 0), r.clearRect(0, 0, t.width, t.height), r.setTransform(a, 0, 0, a, t.width / 2, t.height / 2), r.globalCompositeOperation = "lighter";
		let f = 1 + .07 * Math.sin(d * 1.3), p = u, m = 100 / Math.max(1, i), h = r.createRadialGradient(0, 0, 0, 0, 0, 56 * f);
		h.addColorStop(0, `rgba(159,220,255,${.58 + .3 * p})`), h.addColorStop(.3, `rgba(120,190,245,${.2 + .1 * p})`), h.addColorStop(1, "rgba(120,190,245,0)"), r.fillStyle = h, r.fillRect(-o, -50, o * 2, 100);
		for (let e of s) {
			let t = 1 + .05 * p, n = _(e, 0, t), i = new Path2D(), a = new Path2D();
			for (let r = 1; r <= 56; r++) {
				let o = _(e, r / 56 * fc, t), s = n[2] + o[2] > 0 ? i : a;
				s.moveTo(n[0], n[1]), s.lineTo(o[0], o[1]), n = o;
			}
			r.lineWidth = e.w * m;
			let o = e.a * (.55 + .45 * p);
			r.strokeStyle = e.gold ? `rgba(212,176,106,${o * .28})` : `rgba(159,220,255,${o * .26})`, r.stroke(a), r.strokeStyle = e.gold ? `rgba(241,220,170,${Math.min(1, o * .95)})` : `rgba(234,247,255,${Math.min(1, o * (1 + .4 * p))})`, r.stroke(i);
		}
		for (let e of c) {
			let t = s[e.ring], [n, i, a] = _(t, e.at + d * e.speed, 1 + .05 * p), o = .62 + .38 * a, c = e.gold ? "241,220,170" : "234,247,255", l = e.r * 1.3 * (.8 + .25 * a);
			h = r.createRadialGradient(n, i, 0, n, i, l * 3.4), h.addColorStop(0, `rgba(${c},${.95 * o})`), h.addColorStop(.3, `rgba(${e.gold ? "212,176,106" : "159,220,255"},${.5 * o})`), h.addColorStop(1, "rgba(0,0,0,0)"), r.fillStyle = h, r.beginPath(), r.arc(n, i, l * 3.4, 0, fc), r.fill();
		}
		for (let t = l.length - 1; t >= 0; t--) {
			let n = l[t];
			if (n.life += e, n.x += n.vx * e, n.y += n.vy * e, n.life > n.max || Math.abs(n.x) > o - 2 || Math.abs(n.y) > 52) {
				l.splice(t, 1);
				continue;
			}
			r.fillStyle = `rgba(200,232,255,${.7 * (1 - n.life / n.max) * Math.min(1, n.life * 3)})`, r.beginPath(), r.arc(n.x, n.y, n.r, 0, fc), r.fill();
		}
		if (p > .02) {
			let e = 1 - p;
			r.lineWidth = (1.6 - e) * m * 1.3, r.strokeStyle = `rgba(190,232,255,${.7 * p})`, r.beginPath(), r.arc(0, 0, 9 + e * 44, 0, fc), r.stroke();
		}
		let g = f * (1 + .4 * p);
		h = r.createRadialGradient(0, 0, 0, 0, 0, 15 * g), h.addColorStop(0, "rgba(255,255,255,1)"), h.addColorStop(.22, "rgba(234,247,255,.95)"), h.addColorStop(.55, "rgba(159,220,255,.40)"), h.addColorStop(1, "rgba(159,220,255,0)"), r.fillStyle = h, r.beginPath(), r.arc(0, 0, 15 * g, 0, fc), r.fill();
		let v = (e, t, n, i) => {
			r.save(), r.rotate(n);
			let a = r.createLinearGradient(-e, 0, e, 0);
			a.addColorStop(0, "rgba(159,220,255,0)"), a.addColorStop(.5, `rgba(255,255,255,${i})`), a.addColorStop(1, "rgba(159,220,255,0)"), r.fillStyle = a, r.beginPath(), r.moveTo(-e, 0), r.quadraticCurveTo(0, -t, e, 0), r.quadraticCurveTo(0, t, -e, 0), r.fill(), r.restore();
		}, y = .92 + .08 * Math.sin(d * .9), b = 1 + .3 * p;
		v((o - 1) * y * b, 3.4, 0, 1), v(48 * y * b, 3, Math.PI / 2, 1), v(o * .4 * y, 1.5, Math.PI / 4, .45), v(o * .4 * y, 1.5, -Math.PI / 4, .45), r.globalCompositeOperation = "source-over", u = Math.max(0, u - e * .8);
	}
	function y(e) {
		if (p = 0, !m() || (p = requestAnimationFrame(y), e - f < 33)) return;
		let t = Math.min(.1, (e - f) / 1e3 || .033);
		f = e, d += t, l.length < 24 && Math.random() < .4 && g(1), v(t);
	}
	let b = !1, x = () => {
		if (!b) {
			if (pc) {
				v(0);
				return;
			}
			!p && m() && (f = performance.now(), p = requestAnimationFrame(y));
		}
	}, S = { pulse: () => {
		b || pc || (u = 1, g(8));
	} };
	uc.add(S);
	let C = new IntersectionObserver((e) => {
		h = e[e.length - 1].isIntersecting, x();
	});
	C.observe(e), document.addEventListener("visibilitychange", x);
	let w = e.closest(".house-root"), T = w ? new MutationObserver(() => {
		o(), x();
	}) : null;
	w && T.observe(w, {
		attributes: !0,
		attributeFilter: ["data-mode"]
	});
	let E = new ResizeObserver(() => {
		o(), pc && v(0);
	});
	return E.observe(e), x(), () => {
		b = !0, cancelAnimationFrame(p), p = 0, uc.delete(S), C.disconnect(), T?.disconnect(), E.disconnect(), document.removeEventListener("visibilitychange", x);
	};
}
//#endregion
//#region src/house/debrief.ts
var hc = (e, t = 1.3) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${t}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${e}</svg>`, gc = {
	EXCELLENT: "<path d=\"M12 2.5l2.4 7.1 7.1 2.4-7.1 2.4L12 21.5l-2.4-7.1L2.5 12l7.1-2.4z\"/>",
	STOP_HONORED: "<path d=\"M12 3l7 3v5.5c0 4.3-3 7.7-7 9.5-4-1.8-7-5.2-7-9.5V6z\"/><path d=\"M8.5 12l2.5 2.5 4.5-5\"/>",
	SNIPER: "<circle cx=\"12\" cy=\"12\" r=\"7\"/><circle cx=\"12\" cy=\"12\" r=\"1.2\" fill=\"currentColor\"/><path d=\"M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4\"/>",
	IRON_WILL: "<path d=\"M12 3l7.5 4.3v9.4L12 21l-7.5-4.3V7.3z\"/><path d=\"M12 8v8M8.5 12h7\"/>",
	HUMILIATION: "<path d=\"M12 21c-4 0-6.5-2.6-6.5-6 0-3 2.5-5 3.5-8 1.5 1.2 2.2 2.7 2.2 4.3 1-1 1.6-2.3 1.6-4 3 2 5.7 4.8 5.7 7.7 0 3.4-2.5 6-6.5 6z\"/>",
	TILT: "<path d=\"M4 16L20 8M6 20l12-6\" />",
	WIDENED: "<path d=\"M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4\"/>"
}, _c = /* @__PURE__ */ new Set([
	"WIDENED",
	"TILT",
	"HUMILIATION"
]), vc = {
	stop: "<path d=\"M3 11h18\"/><path d=\"M12 11v8M8.5 15.5 12 19l3.5-3.5\"/>",
	size: "<path d=\"M12 4v15M7.5 19.5h9M4 7.5h16\"/><path d=\"M4 7.5 1.8 13.5a2.4 2.4 0 0 0 4.4 0zM20 7.5l-2.2 6a2.4 2.4 0 0 0 4.4 0z\"/>",
	target: "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><circle cx=\"12\" cy=\"12\" r=\"4.5\"/><circle cx=\"12\" cy=\"12\" r=\"1\" fill=\"currentColor\"/>",
	crack: "<path d=\"M13.5 3.5l-3 6 4 2-4 4 2.5 5\"/><path d=\"M6 8l3 2M18 14l-3.2-1\" opacity=\".7\"/>"
}, yc = {
	keystone: "KEYSTONE",
	aether: "AETHER",
	sunglass: "SUNGLASS",
	oldsun: "OLD SUN",
	moonmetal: "MOONMETAL"
}, bc = (e) => e.replace(/[&<>"]/g, (e) => ({
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;"
})[e]), xc = (e) => {
	let t = e >= 1e3 ? 1 : e >= 100 ? 2 : e >= 1 ? 3 : 5;
	return e.toLocaleString("en-US", {
		minimumFractionDigits: t,
		maximumFractionDigits: t
	});
}, Sc = (e, t = 0) => `${e >= 0 ? "+" : "−"}${Math.abs(e).toLocaleString("en-US", {
	minimumFractionDigits: t,
	maximumFractionDigits: t
})}`, Cc = null, wc = null;
function Tc(e, t, n) {
	Cc?.(), Cc = null, wc?.(), wc = null;
	let { trade: r, d: i, h: a } = t, o = t.mode === "game" && t.name ? `${bc(t.name)} (${bc(t.sym)})` : bc(t.sym), s = Vs(i, a), c = zs(i, a), l = `${t.unit} ${Sc(i.light)}`, u = `${Sc(r.realizedPnl)} USDC, paper`;
	if (t.mode === "advanced") {
		e.innerHTML = `<div class="dcard compact grade-${i.grade}">
      <div class="d-kicker">DEBRIEF · ${bc(t.sym)} ${r.side.toUpperCase()} ${r.leverage}×</div>
      <div class="d-cgrade"><b>${i.grade}</b><span>${l}</span></div>
      <div class="d-cpnl">${u} · ${r.rMultiple == null ? "no stop" : `${r.rMultiple.toFixed(2)}R`} · ${r.exitReason}</div>
      <ul class="d-clist">
        <li class="${i.verdict.stop.ok ? "ok" : "bad"}"><i>${i.verdict.stop.ok ? "✓" : "✗"}</i>Stop · ${bc(s.stop)}</li>
        <li class="${i.verdict.size.ok ? "ok" : "bad"}"><i>${i.verdict.size.ok ? "✓" : "✗"}</i>Size · ${bc(s.size)}</li>
        <li class="${i.verdict.target.ok ? "ok" : "bad"}"><i>${i.verdict.target.ok ? "✓" : "✗"}</i>Target · ${bc(s.target)}</li>
      </ul>
      ${i.medals.length ? `<div class="d-cmedals">${i.medals.map((e) => `<span class="${_c.has(e) ? "bad" : ""}">${bc(vo[e]?.name ?? e)}</span>`).join("")}</div>` : ""}
      <div class="d-cline">${bc(c)}</div>
      <div class="d-actions"><button class="d-quiet" data-a="back">Continue</button></div>
    </div>`, e.hidden = !1, e.querySelector("[data-a=\"back\"]").onclick = n.onBack;
		return;
	}
	let d = i.grade === "A" || i.grade === "B", f = t.element, p = t.core ? `<div class="d-element ${f ? "minted" : "empty"}">
      <small>${yc[f ?? Ds[r.coin] ?? "keystone"]}</small>
      <div class="crystal-art">${f ? `<img src="${n.assetUrl(`el/${f}.webp`)}" alt="" draggable="false" />` : "<svg viewBox=\"0 0 60 80\" aria-hidden=\"true\"><path d=\"M30 6l20 24-20 44L10 30z M10 30h40 M30 6v68\" fill=\"none\" stroke=\"rgba(120,140,180,.55)\" stroke-width=\"1.2\"/></svg>"}</div>
      <b>${f ? "Element minted" : "No element minted"}</b>${f ? "<i>A planned win.</i>" : "<i>Not a planned trade.</i>"}
    </div>` : "", m = (e, t, n, r) => `<div class="vseal ${n ? "ok" : "bad"}">
      <span class="coin">${hc(vc[e], 1.5)}${n ? "" : `<span class="crack">${hc(vc.crack, 1.6)}</span>`}</span><b>${t}</b><i>${bc(r)}</i></div>`, h = i.medals.length ? i.medals.map((e) => `<div class="mcoin ${_c.has(e) ? "bad" : "good"}"><span class="coin${vo[e] ? " painted" : ""}">${vo[e] ? sc(e) : hc(gc[e] ?? "", 1.5)}</span><b>${bc(vo[e]?.name ?? e)}</b></div>`).join("") : "<p class=\"none\">No medals this time.</p>";
	e.innerHTML = `<div class="dcard grade-${i.grade} ${d ? "gold" : i.grade === "C" ? "brass" : "ember"}" style="--ds:1">
    <span class="d-compass" aria-hidden="true">${Qs}</span>
    <div class="d-sheet">
      <h2 class="d-title">DEBRIEF</h2>
      <div class="d-lot">${o}</div>
      <div class="d-pnl">${u}</div>
      <div class="d-top${t.core ? "" : " two"}">
        <div class="d-grade"><small>DISCIPLINE GRADE</small><b class="letter">${i.grade}</b><span class="light">${l}</span></div>
        ${p}
        <div class="d-ora"><div class="orb" aria-hidden="true"></div><small>ORA</small><q>${bc(c)}</q></div>
      </div>
      <div class="d-mid">
        <section class="d-verdict"><h4><i></i>VERDICT<i></i></h4>
          <div class="vrow">${m("stop", "STOP", i.verdict.stop.ok, s.stop)}${m("size", "SIZE", i.verdict.size.ok, s.size)}${m("target", "TARGET", i.verdict.target.ok, s.target)}</div></section>
        <section class="d-medals"><h4><i></i>MEDALS EARNED<i></i></h4><div class="mrow">${h}</div></section>
      </div>
      <section class="d-chart"><h4>TRADE CHART (${r.side.toUpperCase()})</h4><div class="cwrap"><canvas></canvas></div></section>
      <div class="d-actions"><button class="d-gold" data-a="replay">Replay the trade</button><button class="d-quiet" data-a="back">Back to the floor</button></div>
    </div>
  </div>`, e.hidden = !1;
	let g = e.querySelector(".dcard"), _ = () => {
		g.style.setProperty("--ds", String(Math.min(1, (innerHeight - 30) / 985, (innerWidth - 20) / 900).toFixed(3)));
	};
	_(), window.addEventListener("resize", _);
	let v = () => window.removeEventListener("resize", _);
	e.querySelector("[data-a=\"back\"]").onclick = () => {
		v(), n.onBack();
	}, e.querySelector("[data-a=\"replay\"]").onclick = () => {
		v(), n.onReplay();
	}, Cc = mc(e.querySelector(".d-ora .orb")), wc = v, n.later(() => {
		Dc(e.querySelector(".d-chart canvas"), t);
	}, 60);
}
function Ec(e) {
	let t = e / 90, n = "1m";
	for (let e of [
		"1m",
		"5m",
		"15m",
		"1h",
		"4h",
		"1d"
	]) Math.abs(Math.log(i[e] / t)) < Math.abs(Math.log(i[n] / t)) && (n = e);
	return n;
}
async function Dc(e, t) {
	let { trade: n, rec: r, h: i } = t, a = Math.max(18e5, n.closedAt - n.openedAt), s = Math.max(a * .3, 9e5), c = n.openedAt - s, l = n.closedAt + s * .6, u = Ec(l - c), d = [];
	try {
		d = await o(n.coin, u, c, Math.min(Date.now(), l));
	} catch {
		d = [];
	}
	if (!e.isConnected) return;
	Oc(e, t, d, c / 1e3, l / 1e3, i, r);
	let f = new ResizeObserver(() => {
		e.isConnected && Oc(e, t, d, c / 1e3, l / 1e3, i, r);
	});
	f.observe(e.parentElement);
	let p = wc;
	wc = () => {
		p?.(), f.disconnect();
	};
}
function Oc(e, t, n, r, i, a, o) {
	let s = e.parentElement, c = Math.min(devicePixelRatio || 1, 2), l = s.clientWidth || 780, u = s.clientHeight || 190;
	e.width = Math.round(l * c), e.height = Math.round(u * c), e.style.width = `${l}px`, e.style.height = `${u}px`;
	let d = e.getContext("2d");
	d.setTransform(c, 0, 0, c, 0, 0);
	let f = t.trade, p = a.side, m = "#e2875a", h = "#d4b06a", g = "#3fd3c8", _ = l - 8 - 62, v = u - 10 - 22, y = [];
	o.originalStop != null && y.push({
		at: f.openedAt,
		px: o.originalStop,
		label: "Original Stop",
		original: !0
	});
	let b = 0;
	for (let e of a.stopMoves) {
		if (e.to == null) continue;
		let t = e.from != null && (a.side === "long" ? e.to < e.from : e.to > e.from);
		if (e.from == null) {
			o.originalStop ?? y.push({
				at: e.t,
				px: e.to,
				label: "Stop",
				original: !0
			});
			continue;
		}
		b++, y.push({
			at: e.t,
			px: e.to,
			label: t ? `Stop ${b} (widened)` : `Stop ${b} (tightened)`,
			original: !1
		});
	}
	let x = a.target, S = [
		f.entry,
		f.exit,
		...y.map((e) => e.px),
		...x == null ? [] : [x],
		...n.flatMap((e) => [e.high, e.low])
	], C = Math.min(...S), w = Math.max(...S), T = (w - C || w * .01) * .08;
	C -= T, w += T;
	let E = (e) => 8 + (e - r) / (i - r) * _, D = (e) => 10 + (1 - (e - C) / (w - C)) * v;
	d.clearRect(0, 0, l, u);
	let O = d.createLinearGradient(0, 0, 0, u);
	O.addColorStop(0, "#0a1020"), O.addColorStop(1, "#070b14"), d.fillStyle = O, d.fillRect(0, 0, l, u), d.font = "500 11px \"Barlow Condensed\", sans-serif", d.textBaseline = "middle";
	for (let e = 0; e <= 4; e++) {
		let t = C + (w - C) * e / 4, n = D(t);
		d.strokeStyle = "rgba(212,176,106,.10)", d.lineWidth = 1, d.beginPath(), d.moveTo(8, n), d.lineTo(8 + _, n), d.stroke(), d.fillStyle = "rgba(200,205,220,.7)", d.textAlign = "left", d.fillText(xc(t), 8 + _ + 6, n);
	}
	d.textAlign = "center", d.textBaseline = "alphabetic";
	let k = (e) => {
		let t = /* @__PURE__ */ new Date(e * 1e3);
		return i - r > 259200 ? t.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric"
		}) : t.toLocaleTimeString("en-GB", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: !1
		});
	};
	for (let e = 0; e <= 5; e++) {
		let t = r + (i - r) * e / 5;
		d.fillStyle = "rgba(200,205,220,.6)", d.fillText(k(t), Math.min(l - 24, Math.max(24, E(t))), u - 7);
	}
	let A = n.length > 1 ? n[1].time - n[0].time : 60, j = Math.max(2, Math.min(10, A / (i - r) * _ * .7));
	for (let e of n) {
		let t = E(e.time + 0);
		if (t < 6 || t > 8 + _ + 2) continue;
		let n = e.close >= e.open;
		d.strokeStyle = n ? g : m, d.fillStyle = n ? g : m, d.lineWidth = 1, d.beginPath(), d.moveTo(t, D(e.high)), d.lineTo(t, D(e.low)), d.stroke();
		let r = D(Math.max(e.open, e.close)), i = D(Math.min(e.open, e.close));
		d.fillRect(t - j / 2, r, j, Math.max(1, i - r));
	}
	let M = [], ee = (e, t, n, r, i, a = !0) => {
		let o = D(e), s = Math.max(8, E(r));
		d.save(), d.globalAlpha = i, d.strokeStyle = t, d.lineWidth = 1.2, a && d.setLineDash([5, 4]), d.beginPath(), d.moveTo(s, o), d.lineTo(8 + _, o), d.stroke(), d.setLineDash([]), d.font = "600 11.5px \"Barlow Condensed\", sans-serif", d.textAlign = "right", d.textBaseline = "bottom";
		let c = o - 2;
		for (; M.some((e) => Math.abs(e - c) < 12) && c > 20;) c -= 12;
		M.push(c), d.fillStyle = t, d.fillText(n, 8 + _ - 4, c), d.restore();
	};
	y.forEach((e, t) => {
		let n = y.length - 1 - t;
		ee(e.px, m, e.label, e.at / 1e3, e.original ? .95 : Math.max(.35, .85 - n * .18));
	}), x != null && ee(x, h, `Target ${xc(x)}`, f.openedAt / 1e3, .9);
	let N = (e, t, n, r, i) => {
		let a = Math.min(8 + _ - 4, Math.max(14, E(e))), o = D(t);
		d.beginPath(), d.arc(a, o, 5.5, 0, Math.PI * 2), d.fillStyle = "#0a1020", d.fill(), d.lineWidth = 1.8, d.strokeStyle = r, d.stroke(), d.beginPath(), d.arc(a, o, 2, 0, Math.PI * 2), d.fillStyle = r, d.fill(), d.font = "600 12px \"Barlow Condensed\", sans-serif";
		let s = `${n}  ${xc(t)}`, c = d.measureText(s).width + 12, l = a + 10;
		l + c > 8 + _ && (l = a - 10 - c);
		let u = i ? o + 6 : o - 21;
		d.fillStyle = "rgba(8,11,18,.92)", d.strokeStyle = r, d.lineWidth = 1, d.beginPath(), d.roundRect(l, u, c, 17, 3), d.fill(), d.stroke(), d.fillStyle = "#f1e6c8", d.textAlign = "left", d.textBaseline = "middle", d.fillText(s, l + 6, u + 9);
	};
	N(f.openedAt / 1e3, f.entry, "Entry", "#efe6d2", p === "long"), N(f.closedAt / 1e3, f.exit, "Exit", a.realizedPnl >= 0 ? h : m, p === "short"), n.length || (d.fillStyle = "rgba(200,205,220,.5)", d.textAlign = "center", d.font = "500 12px \"Barlow\", sans-serif", d.fillText("Candles unavailable offline", 8 + _ / 2, 10 + v / 2));
}
//#endregion
//#region src/house/layout.ts
var kc = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M6 3.5h12v17H6z\"/><path d=\"M9 8h6M9 11.5h6\"/><circle cx=\"12\" cy=\"16\" r=\"2\"/></svg>", Ac = "<button id=\"leave\" class=\"ghost leave\" aria-label=\"Leave the House\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M5.5 21V10.5a6.5 6.5 0 0 1 13 0V21\"/><path d=\"M2.5 21h19\"/><path d=\"M9 21v-6.5a3 3 0 0 1 6 0V21\" opacity=\".6\"/></svg></button>", jc = (e = {}) => `
<div class="plate" aria-hidden="true"></div>
<canvas id="dust" aria-hidden="true"></canvas>
<header class="topbar">
  <div class="brand">${Qs}<div><b class="brand-name">THE HOUSE</b><small class="brand-sub">ATLAS VEYR</small></div></div>
  <nav class="gamenav" aria-label="House">
    <button data-room="markets">MARKETS</button>
    <button data-room="trade" class="on" aria-current="page">TRADE</button>
    <button data-room="portfolio">PORTFOLIO</button>
    <button data-room="missions">MISSIONS</button>
    <button data-room="forge">FORGE</button>
    <button data-room="ora" disabled aria-disabled="true">ORA</button>
    <button data-room="codex">CODEX</button>
  </nav>
  <div class="modes" role="tablist" aria-label="View">
    <button data-mode="advanced" role="tab">ADVANCED</button>
    <button data-mode="game" role="tab">GAME</button>
  </div>
  <div id="player"></div>
  <div class="hdr-actions">
    <button id="toField" class="ghost" hidden>FIELD DEVICE</button>
    <button id="sound" class="ghost" title="Sound"></button>
    <button id="tip" class="ghost tip" hidden>DROP SOME DUST</button>
    ${e.exit ? Ac : ""}
  </div>
</header>
<main class="floor">
  <div class="trials panel lite" id="trials" aria-label="Weekly discipline trials"></div>

  <div class="leftcol">
    <section class="charcard panel lite" id="charcard" aria-label="Character"></section>
    <aside class="lots panel">
      <div class="lots-head"><h2 class="lots-title">THE AUCTION HOUSE</h2><p>Live markets. Paper coin. Real discipline.</p></div>
      <div class="lot-search"><input id="lotSearch" type="search" placeholder="Search lots: BTC, NVDA, gold…" aria-label="Search lots" autocomplete="off" /></div>
      <div class="hall-tabs" id="hallTabs" role="tablist" aria-label="Halls"></div>
      <div class="lot-cols" aria-hidden="true"><span>LOT</span><span>PRICE (USD)</span><span>24H</span><span>TREND</span></div>
      <div id="lotList"></div>
      <div class="hud" id="hud"></div>
    </aside>
    <section class="vault panel lite" id="vault" aria-label="Vault of Essence"></section>
  </div>

  <section class="market panel">
    <div class="mk-head">
      <div class="mk-em" id="mkEm"></div>
      <div class="mk-name"><h1><span id="mkName"></span><span class="tk" id="mkTicker"></span><span class="quote g-only">/ USDC PERP</span><span class="perp" id="mkPerp" hidden>PERP</span></h1><p id="mkEpithet"></p></div>
      <div class="mk-price"><b id="mkPrice">—</b><span id="mkChg"></span></div>
    </div>
    <div class="chart-bar"><div id="intervals"></div><div id="conn" class="conn"></div></div>
    <div id="chart"></div>
    <div class="mk-stats" id="mkStats"></div>
  </section>

  <section class="book panel">
    <h3 class="ptitle">${Qs}ORDER BOOK</h3>
    <div class="book-tools"><select id="tickSel" title="Price grouping" aria-label="Price grouping"></select></div>
    <div class="book-head"><span>PRICE</span><span>SIZE</span><span>TOTAL</span></div>
    <div id="asks"></div>
    <div id="spread"></div>
    <div id="bids"></div>
    <div id="bookTip" hidden></div>
  </section>

  <section class="ticket panel">
    <h3 class="ptitle">${Qs}<span class="ticket-title">PAPER TRADE PLAN</span></h3>
    <div class="tk-body">
    <div class="side-toggle"><button id="long" class="on">LONG</button><button id="short">SHORT</button></div>
    <div class="otype" id="otype" role="tablist" aria-label="Order type">
      <button data-t="market" class="on">MARKET</button><button data-t="limit">LIMIT</button><button data-t="stop">STOP</button>
    </div>
    <div class="field price" id="priceRow" hidden><span><i class="a-only">PRICE</i><i class="g-only">Entry Price</i></span><div class="pxbox"><input id="price" type="number" step="any" />
      <button class="chip" data-px="bid" title="Best bid">BID</button><button class="chip" data-px="ask" title="Best ask">ASK</button></div></div>
    <label class="field sizef"><span>SIZE</span><input id="size" type="number" min="0" step="10" placeholder="1000" /><u class="sz-unit">USDC</u></label>
    <div class="sz-eq" id="sizeEq"></div>
    <div class="pct-row"><input id="sizePct" type="range" min="0" max="100" step="1" value="0" aria-label="Size as a share of buying power" /><div class="ticks"><i>0%</i><i>25%</i><i>50%</i><i>75%</i><i>100%</i></div></div>
    <div class="lev-row"><span>LEVERAGE</span><input id="lev" type="range" min="1" step="1" value="5" /><label class="levn"><input id="levn" type="number" min="1" step="1" value="5" aria-label="Leverage" /><i>×</i></label></div>
    <div class="pair">
      <label class="field v stop"><span><i class="a-only">STOP</i><i class="g-only">Stop Price</i></span><input id="stop" type="number" step="any" /></label>
      <label class="field v target"><span><i class="a-only">TARGET</i><i class="g-only">Take Profit</i></span><input id="target" type="number" step="any" /></label>
    </div>
    <div class="field risk"><span>RISK RULE<button id="oathBtn" type="button" class="oath-glyph" aria-label="Your Oath">${kc}</button></span><div class="pxbox2"><input id="risk" type="number" step="0.1" readonly tabindex="-1" aria-label="Risk rule from your Oath, percent of equity" /><button id="sizeRisk" class="ghost">SIZE TO RISK</button></div></div>
    <div class="ro-row"><button id="reduceOnly" class="ro" aria-pressed="false" title="Reduce only"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M4 12h7M4 17h4"/><path d="M15 15l5-5M20 14v-4h-4"/></svg><span>REDUCE ONLY</span></button>
    <div id="checks" class="sigils">
      <i data-k="stop" title="Stop" aria-label="Stop"><svg viewBox="0 0 24 24"><path d="M3 11h18"/><path d="M12 11v8M8.5 15.5 12 19l3.5-3.5"/></svg></i>
      <i data-k="risk" title="Risk" aria-label="Risk"><svg viewBox="0 0 24 24"><path d="M12 4v15M7.5 19.5h9M4 7.5h16"/><path d="M4 7.5 1.8 13.5a2.4 2.4 0 0 0 4.4 0zM20 7.5l-2.2 6a2.4 2.4 0 0 0 4.4 0z"/></svg></i>
      <i data-k="target" title="Target" aria-label="Target"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg></i>
    </div>
    </div>
    <div id="riskbox" class="riskbox" hidden></div>
    <div id="preview" class="preview"></div>
    <button id="place" class="place long">WRITE PLAN · LONG</button>
    <div id="gate" class="gate" hidden><button id="fix" class="place fix" type="button"></button><button id="take" class="take" type="button"></button></div>
    </div>
  </section>

  <section class="desk panel">
    <div class="desk-tabs">
      <button class="on" data-desk="positions">POSITIONS<b id="nPos"></b></button>
      <button data-desk="orders">OPEN ORDERS<b id="nOrd"></b></button>
      <button data-desk="history">TRADE HISTORY</button>
      <button data-desk="fills"><i class="a-only">FILLS</i><i class="g-only">ORDER HISTORY</i></button>
      <span class="spacer"></span>
      <div id="acct"></div>
      <button id="reset" class="ghost small" hiddentitle="Reset the account">RESET</button>
    </div>
    <div class="desk-body" data-pane="positions"><div id="pos"></div></div>
    <div class="desk-body" data-pane="orders" hidden><div id="ords"></div></div>
    <div class="desk-body" data-pane="history" hidden><div id="medals"></div><div id="hist"></div></div>
    <div class="desk-body" data-pane="fills" hidden><div id="fills"></div></div>
  </section>

  <aside class="signal panel">
    <div class="ora"><div class="ora-orb" id="oraOrb" aria-hidden="true"></div><div class="ora-say"><small><span class="a-only">ORA</span><span class="g-only">ORA<em>COMPANION OF LIGHT</em></span></small><q id="oraLine"></q></div></div>
    <div class="contract" id="contract" aria-label="Trade plan contract"></div>
    <div class="gauntlet"><small>SIGNAL GAUNTLET</small><div class="watch"><b id="watchN">0</b><svg class="watch-sigil" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.2 7.3 7.3 2.2-7.3 2.2L12 21.5l-2.2-7.3L2.5 12l7.3-2.2z"/><circle cx="12" cy="12" r="2.2"/></svg></div></div>
  </aside>
</main>
<footer>
  <p><b>PAPER TRADING ONLY.</b> No real money, no prizes, not financial advice. Market data: Hyperliquid public API; not affiliated with Hyperliquid.
  We count visits anonymously on our own server; your account stays in this browser. Charts by <a href="https://www.tradingview.com/" target="_blank" rel="noopener">TradingView</a>.</p>
</footer>
<div id="roomHost" class="roomhost" hidden></div>
<div id="debrief" hidden></div>
<div id="toast"></div>
<div id="fx" aria-hidden="true"></div>
`, Mc = [
	"zero",
	"one",
	"two",
	"three",
	"four",
	"five",
	"six",
	"seven",
	"eight",
	"nine",
	"ten",
	"eleven",
	"twelve",
	"thirteen",
	"fourteen",
	"fifteen",
	"sixteen",
	"seventeen",
	"eighteen",
	"nineteen",
	"twenty"
], Nc = (e) => e.toLocaleString("en-US", { maximumFractionDigits: 2 }), Pc = [
	{
		key: "riskPct",
		title: "RISK PER TRADE",
		min: .25,
		max: 3,
		step: .25,
		show: (e) => `${Nc(e)}%`,
		line: (e, t) => `If a trade fails, you lose at most ${Nc(t * e / 100)} of your ${Nc(t)}.`
	},
	{
		key: "maxLeverage",
		title: "MOST LEVERAGE",
		min: 1,
		max: 20,
		step: 1,
		show: (e) => `${e}x`,
		line: (e) => e === 1 ? "No position may exceed your own cash, with no leverage at all." : `No position may exceed ${Mc[e]} times notional leverage.`
	},
	{
		key: "tradesPerDay",
		title: "TRADES PER DAY",
		min: 1,
		max: 10,
		step: 1,
		show: (e) => String(e),
		line: (e) => `You may open at most ${Mc[e]} ${e === 1 ? "trade" : "trades"} in one day.`
	}
];
for (let e of Pc) {
	let [t, n] = Ho[e.key];
	if (e.min < t || e.max > n) throw Error("oath range outside limits");
}
var Fc = 270, Ic = (e, t) => Math.min(e.max, Math.max(e.min, Math.round((t - e.min) / e.step) * e.step + e.min)), Lc = (e, t) => Ic(e, +t.toFixed(4));
function Rc() {
	let e = "";
	for (let t = 0; t <= 36; t++) {
		let n = (-135 + Fc * t / 36 - 90) * Math.PI / 180, r = t % 6 == 0, i = .85, a = r ? .715 : .775;
		e += `<line data-i="${t}" x1="${(50 + 50 * i * Math.cos(n)).toFixed(2)}" y1="${(50 + 50 * i * Math.sin(n)).toFixed(2)}" x2="${(50 + 50 * a * Math.cos(n)).toFixed(2)}" y2="${(50 + 50 * a * Math.sin(n)).toFixed(2)}" stroke-width="${r ? 1.25 : .7}"/>`;
	}
	return `<svg class="od-ticks" viewBox="0 0 100 100" aria-hidden="true">${e}</svg>`;
}
var zc = [
	"top:-2.5%;left:50%;--r:0deg",
	"top:50%;left:102.5%;--r:90deg",
	"top:102.5%;left:50%;--r:180deg",
	"top:50%;left:-2.5%;--r:270deg"
].map((e) => `<i class="od-dia" style="${e}"><svg viewBox="0 0 20 30" aria-hidden="true"><path d="M10 0L19 15L10 30L1 15Z"/><path d="M10 7L14 15L10 23L6 15Z"/></svg></i>`).join(""), Bc = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" aria-hidden=\"true\"><rect x=\"5\" y=\"10.5\" width=\"14\" height=\"10\" rx=\"2\"/><path d=\"M8 10.5V7.5a4 4 0 0 1 8 0v3\"/></svg>", Vc = "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><defs><linearGradient id=\"opg\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#f6e4b0\"/><stop offset=\".55\" stop-color=\"#c9a15a\"/><stop offset=\"1\" stop-color=\"#7a5a2a\"/></linearGradient><radialGradient id=\"opb\" cx=\".4\" cy=\".35\" r=\".8\"><stop offset=\"0\" stop-color=\"#2c3550\"/><stop offset=\"1\" stop-color=\"#0b1020\"/></radialGradient></defs>\n<path d=\"M24 9c3 3 13 3 16 0l-3 8H27z\" fill=\"#161d33\" stroke=\"url(#opg)\" stroke-width=\"1.6\" stroke-linejoin=\"round\"/>\n<path d=\"M27 17c-12 4-20 14-20 27 0 8 8 13 25 13s25-5 25-13c0-13-8-23-20-27z\" fill=\"url(#opb)\" stroke=\"url(#opg)\" stroke-width=\"2\" stroke-linejoin=\"round\"/>\n<path d=\"M26 18.5c3 2 9 2 12 0\" stroke=\"url(#opg)\" stroke-width=\"3\" stroke-linecap=\"round\" fill=\"none\"/>\n<circle cx=\"32\" cy=\"40\" r=\"9.5\" fill=\"#101630\" stroke=\"url(#opg)\" stroke-width=\"1.6\"/>\n<path d=\"M32 31l2 6.4 6.4 2-6.4 2L32 49l-2-7.6-6.4-2 6.4-2z\" fill=\"url(#opg)\"/></svg>", Hc = "<svg viewBox=\"0 0 60 60\" aria-hidden=\"true\"><defs><radialGradient id=\"osg\" cx=\".4\" cy=\".35\" r=\".85\"><stop offset=\"0\" stop-color=\"#fff0c0\"/><stop offset=\".5\" stop-color=\"#d4b06a\"/><stop offset=\"1\" stop-color=\"#7a5a2a\"/></radialGradient></defs>\n<path d=\"M30 3l5 5 7-1 2 7 7 2-1 7 5 5-5 5 1 7-7 2-2 7-7-1-5 5-5-5-7 1-2-7-7-2 1-7-5-5 5-5-1-7 7-2 2-7 7 1z\" fill=\"url(#osg)\" stroke=\"#5a4220\" stroke-width=\".8\"/>\n<circle cx=\"30\" cy=\"30\" r=\"15\" fill=\"none\" stroke=\"#4a3515\" stroke-width=\"1.1\" opacity=\".75\"/><path d=\"M30 17l3 9.5 9.5 3.5-9.5 3.5L30 43l-3-9.5-9.5-3.5 9.5-3.5z\" fill=\"#4a3515\" opacity=\".8\"/></svg>";
function Uc(e) {
	return new Date(e).toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		timeZone: "UTC"
	});
}
function Wc(e, t) {
	let n = t.view === "game", r = !t.open, i = document.createElement("div");
	i.id = "oathLayer", i.className = `oath-layer ${n ? "og" : "oa"}${r ? " locked" : ""}`, i.setAttribute("role", "dialog"), i.setAttribute("aria-modal", "true"), i.setAttribute("aria-label", "The Oath"), i.style.setProperty("--hall", `url('${Gs("oath.webp")}')`);
	let a = {
		riskPct: t.oath.riskPct,
		maxLeverage: t.oath.maxLeverage,
		tradesPerDay: t.oath.tradesPerDay
	};
	for (let e of Pc) a[e.key] = Lc(e, a[e.key]);
	let o = Pc.map((e) => `
    <section class="od-col" data-key="${e.key}">
      <h3>${e.title}</h3>
      <div class="dial" data-key="${e.key}" role="slider" tabindex="${r ? -1 : 0}" aria-label="${e.title.toLowerCase()}" aria-valuemin="${e.min}" aria-valuemax="${e.max}" aria-valuenow="${a[e.key]}"${r ? " aria-disabled=\"true\"" : ""}>
        <div class="od-bezel"></div>${Rc()}${zc}
        <div class="od-knob"><i></i></div>
        <div class="od-face"><b></b></div>
        <div class="od-seal">${Hc}</div>
        ${r ? `<span class="od-lock">${Bc}</span>` : ""}
      </div>
      <p class="od-line"></p>
    </section>`).join(""), s = r ? `<p class="od-foot lockline">Rewritten at the turning of the week: ${Uc(Ko(t.now))}</p>` : "<p class=\"od-foot\">Your Oath can be rewritten once a week, at the turning of the week.</p>", c = t.first ? "" : `<button class="od-x" type="button" aria-label="Close">${r ? "CLOSE" : "NOT NOW"}</button>`;
	i.innerHTML = n ? `
      <div class="og-art" aria-hidden="true"></div>
      <section class="charcard panel lite og-card" aria-label="Character">${t.card}</section>
      <div class="og-stage"><div class="og-fit">
        <div class="og-ora"><div class="og-orb" aria-hidden="true"></div>
          <div class="og-say"><small>ORA</small><q>Before the House opens to you, write your rules. I will hold you to them.</q></div></div>
        <div class="tablet">
          <i class="tb-comp tb-t">${Qs}</i><i class="tb-comp tb-l">${Qs}</i><i class="tb-comp tb-r">${Qs}</i>
          <div class="tb-dials">${o}</div>
          ${r ? "" : `<button class="swear" type="button"><i>${Qs}</i><span>Swear the Oath</span><i>${Qs}</i></button>`}
          <div class="purse"><span class="pc">${Vc}</span><div><small>PAPER ACCOUNT</small><b>${Nc(t.equity)} USDC, paper</b></div></div>
          ${s}
        </div>
      </div></div>
      ${c}` : `
      <div class="oa-card">
        <div class="oa-head"><b>Your Oath</b><span>${r ? "Locked until the weekly reset" : "Three rules the plan is judged by"}</span></div>
        <div class="tb-dials">${o}</div>
        ${r ? "" : "<button class=\"swear\" type=\"button\"><span>Swear the Oath</span></button>"}
        <div class="oa-acct">Paper account ${Nc(t.equity)} USDC</div>
        ${s}
        ${c}
      </div>`, e.appendChild(i);
	let l = n ? mc(i.querySelector(".og-orb")) : () => {}, u = () => {
		if (!n) return;
		let t = e.clientWidth || innerWidth;
		i.classList.toggle("ph", t <= 600);
		let r = t <= 600 ? 1 : Math.min(innerWidth / 1456, innerHeight / 816);
		i.style.setProperty("--k", String(r));
	};
	u(), addEventListener("resize", u);
	let d = (e) => {
		let n = Pc.find((t) => t.key === e), r = i.querySelector(`.od-col[data-key="${e}"]`), o = r.querySelector(".dial"), s = a[e], c = (s - n.min) / (n.max - n.min);
		o.style.setProperty("--ang", `${-135 + Fc * c}deg`), o.setAttribute("aria-valuenow", String(s)), o.setAttribute("aria-valuetext", n.show(s));
		let l = n.show(s), u = o.querySelector("b");
		u.textContent = l, u.dataset.len = String(l.length), r.querySelector(".od-line").textContent = n.line(s, t.equity), o.querySelectorAll(".od-ticks line").forEach((e) => e.classList.toggle("lit", +e.dataset.i <= Math.round(c * 36)));
	}, f = (e, t) => {
		let n = Lc(Pc.find((t) => t.key === e), t);
		n !== a[e] && (a[e] = n, d(e));
	}, p = !1;
	Pc.forEach((e) => d(e.key)), r || i.querySelectorAll(".dial").forEach((e) => {
		let t = e.dataset.key, n = Pc.find((e) => e.key === t), r = Math.round((n.max - n.min) / n.step);
		e.addEventListener("keydown", (e) => {
			if (p) return;
			let i = e.key, o = 0;
			if (i === "ArrowUp" || i === "ArrowRight" || i === "+" || i === "=") o = n.step;
			else if (i === "ArrowDown" || i === "ArrowLeft" || i === "-" || i === "_") o = -n.step;
			else if (i === "PageUp") o = n.step * Math.max(1, Math.round(r / 6));
			else if (i === "PageDown") o = -n.step * Math.max(1, Math.round(r / 6));
			else if (i === "Home") {
				f(t, n.min), e.preventDefault();
				return;
			} else if (i === "End") {
				f(t, n.max), e.preventDefault();
				return;
			} else return;
			e.preventDefault(), f(t, a[t] + o);
		}), e.addEventListener("wheel", (e) => {
			p || (e.preventDefault(), f(t, a[t] + (e.deltaY < 0 ? n.step : -n.step)));
		}, { passive: !1 });
		let i = null, o = (t) => {
			let n = e.getBoundingClientRect();
			return Math.atan2(t.clientY - (n.top + n.height / 2), t.clientX - (n.left + n.width / 2)) * 180 / Math.PI;
		};
		e.addEventListener("pointerdown", (n) => {
			p || (e.focus({ preventScroll: !0 }), e.setPointerCapture(n.pointerId), i = {
				last: o(n),
				acc: 0,
				base: a[t]
			}, e.classList.add("turning"));
		}), e.addEventListener("pointermove", (e) => {
			if (!i) return;
			let r = o(e), a = r - i.last;
			a > 180 ? a -= 360 : a < -180 && (a += 360), i.last = r, i.acc += a, f(t, i.base + i.acc / Fc * (n.max - n.min));
		});
		let s = () => {
			i = null, e.classList.remove("turning");
		};
		e.addEventListener("pointerup", s), e.addEventListener("pointercancel", s);
	});
	let m = !1, h = () => {
		m || (m = !0, removeEventListener("resize", u), document.removeEventListener("keydown", _, !0), l(), i.remove());
	}, g = () => {
		h(), t.onDone(!1);
	};
	function _(e) {
		if (e.key === "Escape" && !t.first && !p) {
			e.stopPropagation(), g();
			return;
		}
		if (e.key === "Tab") {
			let t = [...i.querySelectorAll(".dial[tabindex=\"0\"], button")].filter((e) => !e.hasAttribute("disabled"));
			if (!t.length) return;
			let n = t.indexOf(document.activeElement), r = e.shiftKey ? n <= 0 ? t.length - 1 : n - 1 : n === t.length - 1 ? 0 : n + 1;
			(n === -1 || e.shiftKey && n === 0 || !e.shiftKey && n === t.length - 1) && (e.preventDefault(), t[r].focus());
		}
	}
	document.addEventListener("keydown", _, !0), i.querySelector(".od-x")?.addEventListener("click", g);
	let v = i.querySelector(".swear");
	return v && (v.onclick = async () => {
		if (!p) {
			if (p = !0, v.disabled = !0, !await t.onSwear({
				riskPct: a.riskPct,
				maxLeverage: a.maxLeverage,
				tradesPerDay: a.tradesPerDay
			})) {
				p = !1, v.disabled = !1;
				return;
			}
			i.classList.add("swearing"), i.querySelectorAll(".od-seal").forEach((e, t) => {
				e.style.animationDelay = `${.55 + t * .38}s`;
			}), window.setTimeout(() => i.classList.add("oraup"), 1500), window.setTimeout(() => i.classList.add("leaving"), 2900), window.setTimeout(() => {
				h(), t.onDone(!0);
			}, 3700);
		}
	}), (i.querySelector(".dial[tabindex=\"0\"]") ?? i.querySelector(".od-x"))?.focus({ preventScroll: !0 }), {
		el: i,
		close: () => {
			m || h();
		}
	};
}
//#endregion
//#region src/core/alerts.ts
var Gc = "paper-arena:v0:alerts";
function Kc(e) {
	let t = Array.isArray(e) ? e : e && typeof e == "object" && Array.isArray(e.alerts) ? e.alerts : [], n = [];
	for (let e of t) {
		if (!e || typeof e.coin != "string" || e.dir !== "above" && e.dir !== "below") continue;
		let t = Number(e.level);
		!Number.isFinite(t) || t <= 0 || n.push({
			id: typeof e.id == "string" && e.id ? e.id : `al-${n.length}-${Math.round(t)}`,
			coin: e.coin,
			dir: e.dir,
			level: t,
			createdAt: Number.isFinite(Number(e.createdAt)) ? Number(e.createdAt) : 0,
			firedAt: Number.isFinite(Number(e.firedAt)) && e.firedAt != null ? Number(e.firedAt) : null,
			firedPx: Number.isFinite(Number(e.firedPx)) && e.firedPx != null ? Number(e.firedPx) : null
		});
	}
	return qc(n);
}
function qc(e) {
	let t = e.filter((e) => e.firedAt == null).slice(-120), n = e.filter((e) => e.firedAt != null).sort((e, t) => (e.firedAt ?? 0) - (t.firedAt ?? 0)).slice(-30), r = /* @__PURE__ */ new Set([...t, ...n]);
	return e.filter((e) => r.has(e));
}
function Jc(e, t, n) {
	return !Number.isFinite(t) || t <= 0 ? "level" : n != null && Number.isFinite(n) && n > 0 && (e === "above" && t <= n || e === "below" && t >= n) ? "side" : null;
}
var Yc = (e, t) => t * (e === "above" ? 1.01 : .99);
function Xc(e, t) {
	let n = `al-${t.now.toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
	return qc([...e, {
		id: n,
		coin: t.coin,
		dir: t.dir,
		level: t.level,
		createdAt: t.now,
		firedAt: null,
		firedPx: null
	}]);
}
var Zc = (e, t) => e.filter((e) => e.id !== t);
function Qc(e, t, n) {
	let r = [], i = null;
	return e.forEach((a, o) => {
		if (a.firedAt != null) return;
		let s = t[a.coin];
		if (typeof s == "number" && Number.isFinite(s) && s > 0 && (a.dir === "above" ? s >= a.level : s <= a.level)) {
			let t = {
				...a,
				firedAt: n,
				firedPx: s
			};
			i ??= e.slice(), i[o] = t, r.push(t);
		}
	}), {
		alerts: i ?? e,
		fired: r
	};
}
var $c = (e) => e.filter((e) => e.firedAt == null), el = "paper-arena:v0:codex", tl = [
	"stop",
	"size",
	"target",
	"leverage",
	"funding",
	"patience",
	"mirror"
], nl = () => ({
	v: 1,
	unlocked: {},
	visitedAt: 0
});
function rl(e) {
	let t = nl();
	if (!e || typeof e != "object") return t;
	let n = e;
	if (n.unlocked && typeof n.unlocked == "object") for (let e of tl) {
		let r = n.unlocked[e];
		r && typeof r.at == "number" && (t.unlocked[e] = {
			tradeId: typeof r.tradeId == "string" ? r.tradeId : null,
			at: r.at,
			...typeof r.day == "string" ? { day: r.day } : {},
			...r.snap && typeof r.snap == "object" && typeof r.snap.entry == "number" ? { snap: r.snap } : {}
		});
	}
	return t.visitedAt = Number(n.visitedAt) || 0, t;
}
var il = {
	stop: (e) => (e.exitReason === "stop" || e.exitReason === "trailingStop") && e.stopOk,
	size: (e) => e.sizeOk && e.sealsKept,
	target: (e) => e.targetAtPlan,
	leverage: (e) => e.liquidated || e.overLeverage,
	funding: (e) => Math.abs(e.fundingPaid) > 1e-9,
	patience: (e) => e.limitFilled,
	mirror: (e, t) => t + 1 >= 10
};
function al(e, t) {
	let n = {
		...e,
		unlocked: { ...e.unlocked }
	}, r = [], i = [...t].sort((e, t) => e.closedAt - t.closedAt);
	for (let e of tl) {
		if (n.unlocked[e]) continue;
		let t = i.findIndex((t, n) => il[e](t, n));
		t >= 0 && (n.unlocked[e] = {
			tradeId: i[t].id,
			at: i[t].closedAt,
			...i[t].snap ? { snap: i[t].snap } : {}
		}, r.push(e));
	}
	return {
		store: r.length ? n : e,
		fresh: r
	};
}
function ol(e, t, n, r) {
	return !n || e.unlocked.patience ? {
		store: e,
		fresh: []
	} : {
		store: {
			...e,
			unlocked: {
				...e.unlocked,
				patience: {
					tradeId: null,
					at: r,
					day: t
				}
			}
		},
		fresh: ["patience"]
	};
}
var sl = (e) => Object.values(e.unlocked).some((t) => !!t && t.at > e.visitedAt), cl = (e, t) => {
	let n = e.unlocked[t];
	return !!n && n.at > e.visitedAt;
}, ll = (e, t) => ({
	...e,
	visitedAt: t
}), ul = "Opens when it happens to you.", dl = "This page is written by your own trade.", fl = "Every page here was written by something you did.", pl = "A page opened in the Codex.", ml = [
	{
		id: "stop",
		numeral: "I",
		title: "The Stop",
		tagline: "Your risk defines the trade.",
		heading: "Why the stop is the trade",
		paragraphs: [
			"The stop defines your risk. Before a position exists, it is only an opinion about price. The stop turns that opinion into a specific, limited amount you have decided you are willing to lose, written down while you are calm, not argued about while the market moves.",
			"A stop also makes the idea falsifiable. If price reaches it, your reasoning was wrong, and you step aside without a story about why it will come back. Moving it further away to avoid the loss is not patience. It is changing the plan after the result is known.",
			"A loss at the stop is not a failure. It is planned tuition, the cost of staying in the game long enough to learn what works. Survival comes first, because only a trader who is still here can use what the losses taught."
		]
	},
	{
		id: "size",
		numeral: "II",
		title: "Size",
		tagline: "Match size to your rule.",
		heading: "Size comes from the stop",
		paragraphs: [
			"Size is not a feeling about how sure you are. It follows from two numbers you already have: the amount you will risk, and the distance from your entry to your stop. Divide one by the other and the position size is not a choice, only arithmetic.",
			"Your Oath fixes the risk per trade before any trade exists. A wide stop means a smaller position, and a tight stop allows a larger one, yet the most you can lose stays the same. That is what lets different trades be compared fairly.",
			"Sizing inside your rule is quiet work, and it is the part that keeps one bad trade from becoming a bad month. Large size can feel like conviction. Consistent size is what lets a run of losses stay an ordinary event."
		]
	},
	{
		id: "target",
		numeral: "III",
		title: "The Target",
		tagline: "Take profit at a plan.",
		heading: "A target is a decision made early",
		paragraphs: [
			"A target is where you decide, before the trade, that the idea has done its work. Set while you are calm, it carries no excitement and no fear. Without one, the exit is made in the middle of the move, by whichever emotion is strongest at that moment.",
			"The distance to the target, compared with the distance to the stop, tells you what the trade is worth taking. If you risk one unit to possibly gain two, you can be wrong more often than right and still be fine. The ratio should be known before you enter.",
			"Taking profit at the plan can feel early when price keeps running, and that is allowed to feel uncomfortable. A plan followed is a result you can repeat. A lucky extra that was never planned teaches you to expect it again."
		]
	},
	{
		id: "leverage",
		numeral: "IV",
		title: "Leverage",
		tagline: "A tool, not a shortcut.",
		heading: "Leverage is a tool, not a shortcut",
		paragraphs: [
			"Leverage lets a small amount of margin hold a larger position. It does not change how likely you are to be right. It changes how little room you have to be wrong, because the same price move now takes a bigger share of your margin.",
			"Every position on margin has a liquidation price, where the exchange closes it by force. Higher leverage brings that price closer to your entry, and a stop that sits beyond it can never be reached. The stop must come first, and leverage must be set to let it.",
			"This is why the Oath names a most leverage. It is a ceiling you chose when you were calm, so that borrowed size cannot quietly grow into a risk you never agreed to. Used inside the rule, leverage is only a way to hold the position."
		]
	},
	{
		id: "funding",
		numeral: "V",
		title: "Funding",
		tagline: "The true cost of holding.",
		heading: "What it costs to hold",
		paragraphs: [
			"A perpetual contract has no expiry, so it needs another way to stay close to the market price. Funding is that way: a periodic payment between those who are long and those who are short. Which side pays depends on the rate at that moment.",
			"Funding is small on a single hour and easy to ignore. Held for days, it becomes a cost or a credit that belongs in the trade. It is paid out of your margin, so it also nudges your liquidation price a little closer while you wait.",
			"None of this says to avoid holding a position. It says the clock has a price. A plan that needs a long wait should include that cost, and a plan that needs only a short wait should not be spoiled by it."
		]
	},
	{
		id: "patience",
		numeral: "VI",
		title: "Patience",
		tagline: "Let the setup come to you.",
		heading: "The setup comes to you",
		paragraphs: [
			"Most of trading is waiting. A limit order sets the price you want and leaves the market to come to you. If it never arrives, you lose nothing. Chasing a move that has already happened pays a worse price for the same idea.",
			"Standing aside is a decision, and the House treats it as one. A day with no trade is not a day wasted. When the picture is unclear, doing nothing keeps your capital, your attention and your record clean for the picture that is.",
			"Patience is not passivity. You have the levels, the plan and the size ready before the price gets there. Then the trade is only the end of work already done, and the waiting stops feeling like a cost and starts to feel like part of the craft."
		]
	},
	{
		id: "mirror",
		numeral: "VII",
		title: "The Mirror",
		tagline: "Meet the trader in you.",
		heading: "The trader you actually are",
		paragraphs: [
			"One trade tells you almost nothing, because luck sits inside every single result. A dozen trades start to show a pattern. Not of profit, but of habit: where you move a stop, which day you rush, how you act after a loss.",
			"The Ledger keeps a mirror from your own graded trades. It does not judge the outcome. It reads your process: stops kept, size kept, targets taken at plan. What it shows is the trader you are on an ordinary day, not the one you intend to be.",
			"Seeing a habit is the first step to changing it, and the change is small and specific. Pick one thing the mirror showed you and fix only that. Then look again after the next ten trades and see whether the reflection moved."
		]
	}
], hl = [
	{
		term: "R",
		short: "R",
		meaning: "A unit of risk: what you lose if the stop is hit."
	},
	{
		term: "ATR",
		short: "ATR",
		meaning: "Average True Range: recent volatility."
	},
	{
		term: "Funding",
		short: "F",
		meaning: "Periodic payment between longs and shorts."
	},
	{
		term: "Liquidation",
		short: "L",
		meaning: "Forced close when margin runs too low."
	},
	{
		term: "Open interest",
		short: "OI",
		meaning: "Total open positions in a market."
	}
], gl = (e) => {
	let t = Math.abs(e), n = t >= 1e3 ? 0 : t >= 100 ? 1 : t >= 1 ? 2 : 4;
	return e.toLocaleString("en-US", {
		minimumFractionDigits: 0,
		maximumFractionDigits: n
	});
}, _l = (e) => e == null ? "" : `${e > 0 ? "+" : e < 0 ? "−" : ""}${Math.abs(e).toFixed(1)}R`;
function vl(e) {
	let t = `Your trade, ${e.dateLabel}:`;
	switch (e.chapter) {
		case "stop": return `${t} the stop held${e.stop == null ? "" : ` at ${gl(e.stop)}`}. ${e.win ? "The plan paid for itself." : "The loss was the plan."}`;
		case "size": return `${t} the size stayed inside your Oath, all three seals kept. ${e.r == null ? "The risk was the number you chose." : `You risked 1R and the trade ended ${_l(e.r)}.`}`;
		case "target": return `${t} you took profit${e.target == null ? "" : ` at ${gl(e.target)}`}, as planned. ${e.r == null ? "No second guess." : `${_l(e.r)}, and no second guess.`}`;
		case "leverage": return e.liquidated ? `${t} ${e.leverage}x leverage left little room, and the position was closed for you. The ceiling is there for this.` : `${t} you ran ${e.leverage}x, above your Oath. Leverage is a tool, and you chose the limit.`;
		case "funding": return `${t} funding ${e.fundingPaid > 0 ? "cost you" : "paid you"} $${Math.abs(e.fundingPaid).toFixed(2)} while you held. Holding has a price.`;
		case "patience": return e.day ? `Your Daily Chart, ${e.dateLabel}: you stood aside. Waiting was the plan.` : `${t} you named the price and waited for it. The market came to you.`;
		case "mirror": return `${e.tradeCount} graded trades. Enough for the Ledger's mirror to see you.`;
	}
}
//#endregion
//#region src/house/rooms/data.ts
var yl = 864e5, bl = 7 * yl, xl = [
	"A",
	"B",
	"C",
	"D",
	"F"
], Sl = {
	A: 4,
	B: 3,
	C: 2,
	D: 1,
	F: 0
}, Cl = (e) => e.length ? e.reduce((e, t) => e + t, 0) / e.length : null, wl = (e) => Math.round(e * 10) / 10, Tl = {
	BTC: "Keystone",
	ETH: "Aether",
	SOL: "Sunglass",
	HYPE: "Wildfire",
	"xyz:GOLD": "Old Sun",
	"xyz:SILVER": "Moonmetal"
}, El = (e) => e.replace(/^[a-z]+:/i, ""), Dl = (e) => Tl[e] ?? El(e), Ol = (e) => (new Date(e).getDay() + 6) % 7, kl = [
	"MON",
	"TUE",
	"WED",
	"THU",
	"FRI",
	"SAT",
	"SUN"
], Al = [
	"Mondays",
	"Tuesdays",
	"Wednesdays",
	"Thursdays",
	"Fridays",
	"Saturdays",
	"Sundays"
];
function jl(e, t, n = {}) {
	let r = /* @__PURE__ */ new Map();
	for (let e of t.history) r.set(e.id, e);
	let i = [];
	for (let t of e.closed) {
		let e = t, a = e.debrief, o = e.rec, s = r.get(e.id), c = o.side === "long" ? 1 : -1, l = [];
		for (let e of o.stopMoves) e.from != null && (e.to == null || (e.to - e.from) * c < 0) && l.push(e.t);
		let u = a.facts.r, d = s ? s.realizedPnl : null, f = a.verdict.size.code, p = a.verdict.stop.code === "no_stop";
		i.push({
			id: e.id,
			coin: o.coin,
			ticker: El(o.coin),
			name: Dl(o.coin),
			side: o.side,
			r: u,
			pnl: d,
			win: d == null ? (u ?? 0) > 0 : d > 0,
			grade: Sl[a.grade] == null ? "F" : a.grade,
			light: a.light,
			medals: a.medals,
			widenings: a.facts.widenings,
			noStop: p,
			riskPct: a.facts.riskPct,
			oversized: f === "risk_over" || f === "risk_and_leverage_over",
			gateTaken: o.gateTaken ?? 0,
			sealsKept: a.verdict.stop.ok && a.verdict.size.ok && a.verdict.target.ok,
			exitReason: s ? s.exitReason : null,
			targetHit: s ? s.exitReason === "target" : !1,
			openedAt: o.openedAt,
			closedAt: e.closedAt,
			note: (e.note ?? n[e.id] ?? "").trim(),
			wideningTimes: l
		});
	}
	return i.sort((e, t) => e.closedAt - t.closedAt);
}
var Ml = [
	{
		name: "Recruit",
		numeral: "I",
		at: 0
	},
	{
		name: "Initiate",
		numeral: "II",
		at: 25
	},
	{
		name: "Adept",
		numeral: "III",
		at: 45
	},
	{
		name: "Disciple",
		numeral: "IV",
		at: 62
	},
	{
		name: "Warden",
		numeral: "V",
		at: 76
	},
	{
		name: "Sage",
		numeral: "VI",
		at: 88
	},
	{
		name: "Paragon",
		numeral: "VII",
		at: 95
	}
];
function Nl(e) {
	let t = e.slice(-30);
	return t.length < 5 ? null : Math.round(Cl(t.map((e) => Sl[e.grade])) / 4 * 100);
}
function Pl(e) {
	if (e == null) {
		let e = Ml[1];
		return {
			index: 0,
			name: "Recruit",
			numeral: "I",
			ranked: !1,
			score: null,
			next: {
				name: e.name,
				at: e.at
			},
			progress: 0
		};
	}
	let t = 0;
	for (let n = 0; n < Ml.length; n++) e >= Ml[n].at && (t = n);
	let n = Ml[t], r = Ml[t + 1], i = r ? Math.min(1, Math.max(0, (e - n.at) / (r.at - n.at))) : 1;
	return {
		index: t,
		name: n.name,
		numeral: n.numeral,
		ranked: !0,
		score: e,
		next: r ? {
			name: r.name,
			at: r.at
		} : null,
		progress: i
	};
}
var Fl = Date.UTC(2026, 9, 5), Il = [
	"The Plan",
	"The Execution",
	"The Discipline",
	"The Composure",
	"The Edge",
	"The Renewal"
], Ll = {
	keystone: "Keystone",
	aether: "Aether",
	sunglass: "Sunglass",
	oldsun: "Old Sun",
	moonmetal: "Moonmetal"
};
function Rl(e) {
	let t = 6 * bl, n = Math.max(0, e - Fl), r = Math.floor(n / t), i = Math.min(6, Math.floor((n - r * t) / bl) + 1), a = Fl + r * t;
	return {
		index: r,
		number: r + 1,
		week: i,
		start: a,
		end: a + t
	};
}
function zl(e, t) {
	let n = {};
	for (let r of e) {
		if (r.closedAt < t.start || r.closedAt >= t.end) continue;
		let e = Ds[r.coin];
		if (!e) continue;
		let i = n[e] ??= {
			n: 0,
			last: 0
		};
		i.n++, i.last = Math.max(i.last, r.closedAt);
	}
	let r = Object.entries(n).sort((e, t) => t[1].n - e[1].n || t[1].last - e[1].last)[0];
	return r ? `Season of the ${Ll[r[0]]}` : `Season ${t.number}`;
}
function Bl(e) {
	let t = 0;
	for (let n = e.length - 1; n >= 0 && e[n].sealsKept; n--) t++;
	return t;
}
var Vl = (e) => Array(e).fill(0), Hl = (e, t, n = 0, r = t.length) => {
	let i = -1;
	for (let e = n; e < r; e++) t[e] > 0 && (i < 0 || t[e] > t[i]) && (i = e);
	return e.map((e, n) => ({
		label: e,
		value: t[n],
		worst: n === i
	}));
};
function Ul(e, t, n) {
	let r = e.filter((e) => e.closedAt >= n - 30 * yl && e.closedAt <= n), i = r.length;
	if (i < 5) return {
		kind: "calm",
		habit: null,
		line: "The mirror needs five trades to see you.",
		coaching: "It shows only what you have written.",
		chartTitle: "TRADES BY WEEKDAY",
		bars: Hl([...kl], Vl(7)),
		looked: i
	};
	let a = [], o = Vl(7), s = 0;
	for (let e of r) for (let t of e.wideningTimes) o[Ol(t)]++, s++;
	let c = r.filter((e) => e.widenings > 0).length;
	if (s >= 3 && c >= 2) {
		let e = o.indexOf(Math.max(...o)), t = o[e] >= 2 && o[e] / s >= .4, n = c / i;
		n >= .1 && a.push({
			habit: t ? "widen_weekday" : "widen",
			score: n * 1,
			line: t ? `You widen stops on ${Al[e]}.` : "You move your stop away from the market.",
			coaching: t ? `A small adjustment on ${Al[e]} will compound your edge.` : "The line you wrote was the wiser one. Let it stand.",
			chartTitle: "STOP WIDENINGS BY WEEKDAY",
			bars: Hl([...kl], o)
		});
	}
	let l = r.filter((e) => e.noStop);
	if (l.length >= 2 && l.length / i >= .2) {
		let e = Vl(7);
		for (let t of l) e[Ol(t.closedAt)]++;
		a.push({
			habit: "no_stop",
			score: l.length / i * 1.2,
			line: "You trade without a stop.",
			coaching: "Write the line first. Then the trade has something to keep.",
			chartTitle: "TRADES WITHOUT A STOP BY WEEKDAY",
			bars: Hl([...kl], e)
		});
	}
	let u = r.filter((e) => e.oversized);
	if (u.length >= 2 && u.length / i >= .2) {
		let e = [
			"½×",
			"1×",
			"1.5×",
			"2×",
			">2×"
		], n = Vl(5);
		for (let e of r) {
			if (e.riskPct == null) continue;
			let r = e.riskPct / Math.max(1e-4, t.riskPct);
			n[r <= .5 ? 0 : r <= 1.02 ? 1 : r <= 1.5 ? 2 : r <= 2 ? 3 : 4]++;
		}
		a.push({
			habit: "oversized",
			score: u.length / i * 1.1,
			line: "You size past your own rule.",
			coaching: "The Oath is the size. Let it hold.",
			chartTitle: "RISK AS A MULTIPLE OF YOUR RULE",
			bars: Hl(e, n, 2, 5)
		});
	}
	let d = r.filter((e) => e.win && e.r != null), f = d.filter((e) => e.r < 1 && !e.targetHit && e.exitReason !== "liquidation" && e.exitReason !== "stop" && e.exitReason !== "trailingStop");
	if (f.length >= 3 && f.length / Math.max(1, d.length) >= .4) {
		let e = [
			"<.25R",
			".25R",
			".5R",
			".75R",
			"1R",
			"1.5R+"
		], t = Vl(6);
		for (let e of d) {
			let n = e.r;
			t[n < .25 ? 0 : n < .5 ? 1 : n < .75 ? 2 : n < 1 ? 3 : n < 1.5 ? 4 : 5]++;
		}
		a.push({
			habit: "early_close",
			score: f.length / i * .9,
			line: "You close winners before they reach 1R.",
			coaching: "Let the plan finish what it began.",
			chartTitle: "WINNERS BY R AT CLOSE",
			bars: Hl(e, t, 0, 4)
		});
	}
	let p = [], m = 0, h = [...e].sort((e, t) => e.openedAt - t.openedAt);
	for (let e of h) {
		if (e.closedAt < n - 30 * yl || e.closedAt > n) continue;
		let t = null;
		for (let n of h) n !== e && n.closedAt <= e.openedAt && (!t || n.closedAt > t.closedAt) && (t = n);
		t && !t.win && p.push(e.openedAt - t.closedAt);
	}
	for (let e of r) e.win || m++;
	let g = p.filter((e) => e < 18e5);
	if (g.length >= 2 && m >= 2 && g.length / m >= .3) {
		let e = [
			"<5m",
			"5-10m",
			"10-20m",
			"20-30m",
			"30-60m",
			"1-2h"
		], t = [
			5,
			10,
			20,
			30,
			60,
			120
		], n = Vl(6);
		for (let e of p) {
			let r = e / 6e4, i = t.findIndex((e) => r < e);
			i >= 0 && n[i]++;
		}
		a.push({
			habit: "revenge",
			score: g.length / m * .45 + .05,
			line: "You re-enter within minutes of a loss.",
			coaching: "After a loss, let the board move without you.",
			chartTitle: "TIME TO THE NEXT TRADE AFTER A LOSS",
			bars: Hl(e, n, 0, 4)
		});
	}
	if (!a.length) {
		let e = Vl(7);
		for (let t of r) e[Ol(t.closedAt)]++;
		return {
			kind: "clean",
			habit: null,
			line: "No habit stands out.",
			coaching: "Keep writing the plan before the trade.",
			chartTitle: "TRADES BY WEEKDAY",
			bars: Hl([...kl], e, 0, 0),
			looked: i
		};
	}
	a.sort((e, t) => t.score - e.score);
	let _ = a[0];
	return {
		kind: "habit",
		habit: _.habit,
		line: _.line,
		coaching: _.coaching,
		chartTitle: _.chartTitle,
		bars: _.bars,
		looked: i
	};
}
function Wl(e, t, n) {
	let r = [...e.history].sort((e, t) => e.closedAt - t.closedAt), i = [], a = e.startingCash;
	r.length && i.push({
		t: r[0].openedAt,
		v: a
	});
	for (let e of r) a += e.realizedPnl, i.push({
		t: e.closedAt,
		v: a
	});
	let o = n != null && Number.isFinite(n) ? n : a;
	return r.length && i.push({
		t: Math.max(t, r[r.length - 1].closedAt),
		v: o
	}), {
		points: i,
		now: o
	};
}
function Gl(e) {
	let t = jl(e.plans, e.account, e.notes), n = t.slice(-30), r = Nl(t), i = Go(e.now), a = Nl(t.filter((e) => e.closedAt < i)), o = Pl(r), s = xl.map((e) => {
		let t = n.filter((t) => t.grade === e).length;
		return {
			grade: e,
			count: t,
			pct: n.length ? Math.round(t / n.length * 100) : 0
		};
	}), c = n.filter((e) => !e.noStop), l = n.length ? Math.round(c.filter((e) => e.widenings === 0).length / n.length * 100) : null, u = n.filter((e) => e.win && e.r != null).map((e) => e.r), d = n.filter((e) => !e.win && e.r != null).map((e) => e.r), f = t.filter((e) => e.closedAt >= i).filter((e) => e.oversized || e.gateTaken > 0 || e.medals.includes("TILT")).length, p = Wl(e.account, e.now, e.equityNow), m = Rl(e.now), h = e.account.startingCash;
	for (let t of [...e.account.history].sort((e, t) => e.closedAt - t.closedAt)) t.closedAt < m.start && (h += t.realizedPnl);
	let g = h > 0 ? (p.now / h - 1) * 100 : null, _ = [...t].reverse().map((e) => ({
		id: e.id,
		coin: e.coin,
		ticker: e.ticker,
		name: e.name,
		side: e.side,
		r: e.r,
		grade: e.grade,
		medals: e.medals,
		note: e.note,
		closedAt: e.closedAt,
		broken: !e.sealsKept || e.widenings > 0
	}));
	return {
		score: r,
		tradesCounted: n.length,
		rank: o,
		delta: r != null && a != null ? r - a : null,
		spread: s,
		tiles: {
			stopsHonoredPct: l,
			avgWinR: Cl(u) == null ? null : wl(Cl(u)),
			avgLossR: Cl(d) == null ? null : wl(Cl(d)),
			oathBreaksWeek: f
		},
		mirror: Ul(t, e.oath, e.now),
		equity: {
			points: p.points,
			now: p.now,
			seasonPct: g,
			empty: e.account.history.length === 0
		},
		journal: _
	};
}
var Kl = [
	"STOP_HONORED",
	"SNIPER",
	"IRON_WILL",
	"EXCELLENT",
	"PATIENCE",
	"BREAKEVEN",
	"WIDENED",
	"TILT",
	"HUMILIATION",
	null,
	null,
	null
], ql = {
	EXCELLENT: "Excellent",
	STOP_HONORED: "Stop Honored",
	SNIPER: "Sniper",
	IRON_WILL: "Iron Will",
	HUMILIATION: "Humiliation",
	TILT: "Tilt",
	WIDENED: "Widened"
}, Jl = {
	EXCELLENT: "cyan",
	STOP_HONORED: "gold",
	SNIPER: "cyan",
	IRON_WILL: "cyan",
	HUMILIATION: "ember",
	TILT: "ember",
	WIDENED: "ember"
};
function Yl(e) {
	let t = {};
	for (let n of Object.values(e.graded)) for (let e of n.medals ?? []) t[e] = (t[e] ?? 0) + 1;
	return Kl.map((e) => {
		if (!e) return {
			key: null,
			name: "",
			count: 0,
			tone: "locked"
		};
		if (e === "PATIENCE" || e === "BREAKEVEN") return {
			key: null,
			art: e,
			name: e === "PATIENCE" ? "Patience" : "Break-even Guard",
			count: 0,
			tone: "locked"
		};
		let n = t[e] ?? 0;
		return {
			key: e,
			name: ql[e],
			count: n,
			tone: n > 0 ? Jl[e] : "locked"
		};
	});
}
var Xl = {
	stops: "Honor three stops",
	profit: "Take profit at plan",
	oath: "Size inside your Oath five times"
};
function Zl(e, t) {
	let n = e && e.week === Go(t) ? e : null;
	return [
		"stops",
		"profit",
		"oath"
	].map((e) => {
		let t = As[e], r = Math.min(t, n ? n[e] : 0);
		return {
			id: e,
			title: Xl[e],
			n: r,
			of: t,
			done: r >= t
		};
	});
}
var Ql = {
	stops: ["stop held", "stops held"],
	profit: ["profit taken at plan", "profits taken at plan"],
	oath: ["trade inside your Oath", "trades inside your Oath"]
}, $l = [
	"No",
	"One",
	"Two",
	"Three",
	"Four",
	"Five"
];
function eu(e) {
	let t = e.filter((e) => !e.done);
	if (!t.length) return "Every trial is sealed. The chest is yours.";
	if (e.every((e) => e.n === 0)) return "The week is unwritten. Honor one stop and it begins.";
	let n = (e) => e.of - e.n, r = (e) => $l[e] ?? String(e);
	if (t.length === 1) {
		let e = t[0], i = n(e);
		return `${r(i)} more ${Ql[e.id][i === 1 ? 0 : 1]} and the chest is yours.`;
	}
	let i = [...t].sort((e, t) => n(e) - n(t))[0], a = n(i);
	return `${r(a)} more ${Ql[i.id][a === 1 ? 0 : 1]} and this trial seals.`;
}
function tu(e) {
	let t = jl(e.plans, e.account, e.notes), n = Pl(Nl(t)), r = Zl(e.trials, e.now), i = r.every((e) => e.done), a = Rl(e.now), o = new Date(e.now);
	o.setHours(0, 0, 0, 0);
	let s = t.filter((e) => e.closedAt >= o.getTime()).reduce((e, t) => e + t.light, 0);
	return {
		rank: n,
		ladder: Ml.map((e, t) => ({
			name: e.name,
			numeral: e.numeral,
			state: t < n.index ? "past" : t === n.index ? "current" : "future"
		})),
		tradesCounted: Math.min(t.length, 30),
		level: e.level ?? null,
		light: {
			steps: e.steps ?? null,
			trading: s
		},
		plaques: r,
		chest: e.chestOpened ?? e.trials?.chestOpened ? "open" : i ? "glowing" : "closed",
		season: {
			number: a.number,
			name: zl(t, a),
			week: a.week,
			weeks: Il.map((e, t) => ({
				n: t + 1,
				name: e,
				state: t + 1 < a.week ? "done" : t + 1 === a.week ? "current" : "locked"
			}))
		},
		streak: Bl(t),
		medals: Yl(e.plans),
		daily: e.daily?.today ? {
			state: "sealed",
			grade: e.daily.today
		} : { state: "open" },
		ora: eu(r)
	};
}
var nu = [
	{
		id: "coins",
		name: "HALL OF COINS",
		sub: "Digital assets"
	},
	{
		id: "foundry",
		name: "THE FOUNDRY",
		sub: "Equities & innovation"
	},
	{
		id: "indices",
		name: "INDICES",
		sub: "Global indices"
	},
	{
		id: "metals",
		name: "OLD METALS",
		sub: "Gold, silver, real assets"
	},
	{
		id: "tide",
		name: "THE TIDE",
		sub: "Energy, grain & commodities"
	},
	{
		id: "money",
		name: "THE MONEYCHANGERS",
		sub: "Currencies & macro"
	}
], ru = [
	{
		key: "keystone",
		name: "KEYSTONE",
		glow: "#f6c66a"
	},
	{
		key: "aether",
		name: "AETHER",
		glow: "#6aa8ff"
	},
	{
		key: "sunglass",
		name: "SUNGLASS",
		glow: "#5fe3e6"
	},
	{
		key: "oldsun",
		name: "OLD SUN",
		glow: "#f4a93c"
	},
	{
		key: "moonmetal",
		name: "MOONMETAL",
		glow: "#c8d2ff"
	}
], iu = Object.keys(Tl), au = [
	"No",
	"One",
	"Two",
	"Three",
	"Four",
	"Five",
	"Six",
	"Seven",
	"Eight",
	"Nine",
	"Ten",
	"Eleven",
	"Twelve"
], ou = (e) => au[e] ?? String(e), su = (e) => {
	if (!Number.isFinite(e)) return "—";
	let t = e >= 1e3 ? 0 : e >= 100 ? 1 : e >= 1 ? 3 : 5;
	return e.toLocaleString("en-US", {
		minimumFractionDigits: e >= 1e3 && e % 1 != 0 ? 1 : t === 0 ? 0 : t,
		maximumFractionDigits: t === 0 ? 1 : t
	});
}, cu = (e) => e == null || !Number.isFinite(e) || e <= 0 ? "—" : e >= 1e9 ? `$${(e / 1e9).toFixed(2)}B` : e >= 1e6 ? `$${(e / 1e6).toFixed(1)}M` : e >= 1e3 ? `$${(e / 1e3).toFixed(0)}K` : `$${e.toFixed(0)}`;
function lu(e, t, n) {
	let r = e.filter((e) => e.firedAt != null && t - e.firedAt < 18e5).sort((e, t) => (t.firedAt ?? 0) - (e.firedAt ?? 0))[0];
	if (r) return `${n(r.coin)} crossed ${su(r.level)}. Your bell rang.`;
	let i = $c(e).length;
	return i === 0 ? "Set a bell on a lot and go live your day. I will call you." : i === 1 ? "One of your alerts is armed. Go walk; I will call you." : `${ou(i)} of your alerts are armed. Go walk; I will call you.`;
}
function uu(e) {
	let t = new Set($c(e.alerts).map((e) => e.coin)), n = new Map(e.catalog.map((e) => [e.key, e])), r = (e) => {
		let t = n.get(e);
		return t?.name ?? Tl[e] ?? t?.ticker ?? El(e);
	}, i = (e) => n.get(e)?.hall ?? "coins", a = {
		coins: [],
		foundry: [],
		indices: [],
		metals: [],
		tide: [],
		money: []
	};
	for (let n of e.catalog) {
		let r = e.marks[n.key] ?? (n.markPx > 0 ? n.markPx : null), i = e.ctxs[n.key], o = i && i.dayNtlVlm > 0 ? i.dayNtlVlm : n.dayNtlVlm > 0 ? n.dayNtlVlm : null;
		a[n.hall]?.push({
			key: n.key,
			hall: n.hall,
			title: n.name ?? n.ticker,
			symbol: `${n.ticker}-PERP`,
			named: !!n.name,
			px: r,
			chg: r != null && n.prevDayPx > 0 ? (r / n.prevDayPx - 1) * 100 : null,
			vol: o,
			funding: i ? i.funding : null,
			heavy: !1,
			armed: t.has(n.key)
		});
	}
	for (let e of nu) {
		let t = (e) => e.named ? iu.indexOf(e.key) : 999, n = a[e.id].sort((e, n) => t(e) - t(n) || (n.vol ?? 0) - (e.vol ?? 0)), r = n.filter((e) => e.vol != null).sort((e, t) => (t.vol ?? 0) - (e.vol ?? 0)), i = n.length >= 5 ? Math.max(1, Math.floor(n.length * .2)) : 0;
		r.slice(0, i).forEach((e) => {
			e.heavy = !0;
		});
	}
	let o = nu.find((t) => t.id === e.hall)?.id ?? "coins", s = n.get("BTC"), c = e.marks.BTC ?? (s && s.markPx > 0 ? s.markPx : null), l = e.orders.map((e) => ({
		id: e.id,
		coin: e.coin,
		title: r(e.coin),
		hall: i(e.coin),
		line: `${e.type === "stop" ? "Stop" : "Limit"} ${e.side === "short" ? "sell" : "buy"} @ ${su(e.price)}`
	})), u = [...e.alerts].sort((e, t) => (e.firedAt == null ? 0 : 1) - (t.firedAt == null ? 0 : 1) || t.createdAt - e.createdAt).map((e) => ({
		id: e.id,
		coin: e.coin,
		title: r(e.coin),
		hall: i(e.coin),
		dir: e.dir,
		level: e.level,
		fired: e.firedAt != null,
		firedAt: e.firedAt
	}));
	return {
		hall: o,
		halls: nu.map((e) => ({
			...e,
			count: a[e.id].length
		})),
		lots: a,
		banner: {
			coin: "BTC",
			name: "Keystone",
			px: c,
			chg: c != null && s && s.prevDayPx > 0 ? (c / s.prevDayPx - 1) * 100 : null
		},
		vault: ru.map((t) => ({
			...t,
			count: Math.max(0, Math.floor(e.vault[t.key] ?? 0))
		})),
		character: e.character,
		daily: e.daily ?? {
			yesterday: null,
			today: null,
			traders: null
		},
		alerts: u,
		armedCount: $c(e.alerts).length,
		alertCap: e.alertCap ?? null,
		orders: l,
		ora: lu(e.alerts, e.now, r),
		now: e.now
	};
}
function du(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let e of t.history) n.set(e.id, e);
	let r = [];
	for (let i of e.closed) {
		let e = n.get(i.id), a = i.debrief.verdict, o = i.rec, s = e?.exitReason === "liquidation" || i.debrief.medals.includes("HUMILIATION"), c = e?.placedAt != null && e.openedAt - e.placedAt >= 3e4, l = t.fills.some((e) => e.coin === o.coin && e.kind === "open" && e.how === "limit" && Math.abs(e.time - o.openedAt) < 2e3);
		r.push({
			id: i.id,
			closedAt: i.closedAt,
			exitReason: e ? e.exitReason : null,
			stopOk: a.stop.ok,
			sizeOk: a.size.ok,
			sealsKept: a.stop.ok && a.size.ok && a.target.ok,
			targetAtPlan: e?.exitReason === "target" || o.partials.some((e) => e.atPlan),
			overLeverage: a.size.code === "leverage_over" || a.size.code === "risk_and_leverage_over",
			liquidated: s,
			fundingPaid: e?.fundingPaid ?? 0,
			limitFilled: l || c,
			snap: e ? {
				coin: e.coin,
				side: e.side,
				entry: e.entry,
				stop: e.initialStop,
				target: e.target,
				exit: e.exit,
				openedAt: e.openedAt,
				closedAt: e.closedAt,
				exitReason: e.exitReason,
				r: i.debrief.facts.r,
				win: e.realizedPnl > 0,
				leverage: e.leverage,
				fundingPaid: e.fundingPaid ?? 0,
				liquidated: s
			} : void 0
		});
	}
	return r.sort((e, t) => e.closedAt - t.closedAt);
}
var fu = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec"
], pu = (e) => {
	let t = new Date(e);
	return `${fu[t.getMonth()]} ${t.getDate()}`;
};
function mu(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.account.history) t.set(n.id, n);
	let n = e.plans.closed.length, r = {};
	for (let i of tl) {
		let a = e.store.unlocked[i];
		if (!a) continue;
		let o = pu(a.day ? Date.parse(`${a.day}T12:00:00`) : a.at), s = a.snap, c = a.tradeId ? t.get(a.tradeId) : void 0, l = a.tradeId ? e.plans.closed.find((e) => e.id === a.tradeId) : void 0, u = s ?? (c && l ? {
			coin: c.coin,
			side: c.side,
			entry: c.entry,
			stop: c.initialStop,
			target: c.target,
			exit: c.exit,
			openedAt: c.openedAt,
			closedAt: c.closedAt,
			exitReason: c.exitReason,
			r: l.debrief.facts.r,
			win: c.realizedPnl > 0,
			leverage: c.leverage,
			fundingPaid: c.fundingPaid ?? 0,
			liquidated: c.exitReason === "liquidation"
		} : null), d = vl({
			chapter: i,
			dateLabel: o,
			ticker: u ? El(u.coin) : "",
			side: u?.side ?? "long",
			stop: u?.stop ?? null,
			target: u?.target ?? null,
			entry: u?.entry ?? 0,
			exit: u?.exit ?? 0,
			r: u?.r ?? null,
			win: u?.win ?? !1,
			leverage: u?.leverage ?? 0,
			fundingPaid: u?.fundingPaid ?? 0,
			liquidated: u?.liquidated,
			tradeCount: Math.max(n, 10),
			day: a.day
		});
		r[i] = {
			tradeId: a.tradeId,
			at: a.at,
			dateLabel: o,
			coin: u?.coin ?? null,
			ticker: u ? El(u.coin) : null,
			side: u?.side ?? null,
			entry: u?.entry ?? null,
			stop: u?.stop ?? null,
			target: u?.target ?? null,
			exit: u?.exit ?? null,
			openedAt: u?.openedAt ?? null,
			closedAt: u?.closedAt ?? null,
			exitReason: u?.exitReason ?? null,
			note: d
		};
	}
	return {
		store: e.store,
		character: e.character,
		oath: e.oath,
		oathHistory: e.oath.history ?? [],
		journeys: r,
		now: e.now
	};
}
//#endregion
//#region src/house/spark.ts
var hu = 6e5, gu = 6e4, _u = 4, vu = 56, yu = 18, bu = "paper-arena:spk", xu = /* @__PURE__ */ new Map(), Su = 0;
function Cu(e, t) {
	if (!t || t.length < 2) {
		e.innerHTML = "";
		return;
	}
	let n = Math.min(...t), r = Math.max(...t) - n || 1, i = 52 / (t.length - 1), a = t.map((e, t) => [2 + t * i, 2 + 14 * (1 - (e - n) / r)]), o = a.map(([e, t], n) => `${n ? "L" : "M"}${e.toFixed(1)} ${t.toFixed(1)}`).join(""), [s, c] = a[a.length - 1];
	e.className = `spk ${t[t.length - 1] < t[0] ? "dn" : "up"}`, e.innerHTML = `<svg viewBox="0 0 ${vu} ${yu}" width="${vu}" height="${yu}" preserveAspectRatio="none"><path class="ln" d="${o}"/><circle class="end" cx="${s.toFixed(1)}" cy="${c.toFixed(1)}" r="1.4"/></svg>`;
}
function wu(e) {
	let t = [], n = 0, r = null, i = /* @__PURE__ */ new WeakSet(), o = !1, s = 0, c = 0;
	function l() {
		try {
			let t = Object.fromEntries([...xu].filter(([, e]) => e.closes));
			Promise.resolve(e.set(bu, t)).catch(() => {});
		} catch {}
	}
	try {
		Promise.resolve(e.get(bu)).then((e) => {
			if (o || !e || typeof e != "object") return;
			let t = e;
			for (let e in t) {
				let n = t[e];
				n && Array.isArray(n.closes) && Date.now() - n.at < hu && !xu.has(e) && xu.set(e, n);
			}
		}).catch(() => {});
	} catch {}
	let u = () => {
		clearTimeout(s), s = window.setTimeout(l, 800);
	};
	function d() {
		if (!o) {
			if (Date.now() < Su) {
				clearTimeout(c), c = window.setTimeout(d, Su - Date.now() + 50);
				return;
			}
			for (; n < _u && t.length;) {
				let e = t.shift();
				if (!e.isConnected || !i.has(e)) continue;
				let r = e.dataset.key, s = xu.get(r);
				if (s && Date.now() - s.at < (s.closes ? hu : gu)) {
					Cu(e.querySelector(".spk"), s.closes);
					continue;
				}
				n++, a(r, "1h", 24).then((e) => e.map((e) => e.close)).catch(() => null).then((t) => {
					t || (Su = Date.now() + 2e4), xu.set(r, {
						at: Date.now(),
						closes: t
					}), u(), !o && e.isConnected && Cu(e.querySelector(".spk"), t);
				}).finally(() => {
					n--, d();
				});
			}
		}
	}
	return {
		observe(e, n = ".lot") {
			o || (r?.disconnect(), t.length = 0, r = new IntersectionObserver((e) => {
				for (let n of e) {
					let e = n.target;
					if (n.isIntersecting) {
						i.add(e);
						let n = xu.get(e.dataset.key);
						n?.closes && Date.now() - n.at < hu ? Cu(e.querySelector(".spk"), n.closes) : t.push(e);
					} else i.delete(e);
				}
				d();
			}, { rootMargin: "120px 0px" }), e.querySelectorAll(n).forEach((e) => r.observe(e)));
		},
		stop() {
			o = !0, r?.disconnect(), r = null, t.length = 0, clearTimeout(c), s && (clearTimeout(s), l());
		}
	};
}
//#endregion
//#region src/house/rooms/util.ts
var Z = (e) => e.replace(/[&<>"']/g, (e) => ({
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
})[e]), Tu = "−", Eu = (e, t = 1) => e == null ? "—" : `${e > 0 ? "+" : e < 0 ? Tu : ""}${Math.abs(e).toFixed(t)}R`, Du = (e, t = 0) => `${e > 0 ? "+" : e < 0 ? Tu : ""}${Math.abs(e).toFixed(t)}`, Ou = (e) => Math.round(e).toLocaleString("en-US"), ku = (e) => new Date(e).toLocaleDateString("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric"
}).toUpperCase();
function Au(e, t) {
	e.classList.add("room", t), e.style.setProperty("--rm-frame", `url('${Gs("frame.webp")}')`);
}
function ju(e, t) {
	e.classList.remove("room", t), e.style.removeProperty("--rm-frame"), e.textContent = "";
}
var Q = (e, t) => `<section class="rp ${e}">${t}</section>`, Mu = "<svg class=\"rp-star\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 2L14.6 9.4L22 12L14.6 14.6L12 22L9.4 14.6L2 12L9.4 9.4Z\" fill=\"currentColor\"/></svg>", Nu = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M6 17.5V11a6 6 0 0 1 12 0v6.5l1.5 1.5h-15z\"/><path d=\"M10 21a2.2 2.2 0 0 0 4 0\"/><path d=\"M12 3.2V5\"/></svg>", Pu = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" aria-hidden=\"true\"><path d=\"M7 7l10 10M17 7L7 17\"/></svg>", Fu = "<svg class=\"arch-svg\" viewBox=\"0 0 100 130\" preserveAspectRatio=\"none\" aria-hidden=\"true\"><defs><linearGradient id=\"mkb\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#f1dcaa\"/><stop offset=\".5\" stop-color=\"#b8924d\"/><stop offset=\"1\" stop-color=\"#7b5d2b\"/></linearGradient></defs><path class=\"a-fill\" d=\"M3 128V54Q3 30 50 3Q97 30 97 54V128Z\"/><path class=\"a-in\" d=\"M8 124V55Q8 34 50 10Q92 34 92 55V124Z\"/><path class=\"a-edge\" d=\"M3 128V54Q3 30 50 3Q97 30 97 54V128Z\" stroke=\"url(#mkb)\"/></svg>", Iu = (e) => e >= 1e3 ? 1 : e >= 100 ? 2 : e >= 1 ? 3 : 5, Lu = (e) => e == null || !Number.isFinite(e) ? "—" : e.toLocaleString("en-US", {
	minimumFractionDigits: Iu(e),
	maximumFractionDigits: Iu(e)
}), Ru = (e) => e == null ? "—" : `${e >= 0 ? "+" : "−"}${Math.abs(e).toFixed(2)}%`, zu = (e) => e == null ? "—" : `${e >= 0 ? "+" : "−"}${Math.abs(e * 100).toFixed(4)}%`, Bu = (e) => e == null ? "nil" : e >= 0 ? "up" : "dn", Vu = 36e5, Hu = (e) => `
  <div class="lc${e.heavy ? " heavy" : ""}${e.named ? " named" : ""}" data-key="${Z(e.key)}" role="button" tabindex="0">
    <div class="lc-h"><span class="lc-em">${Zs(e.key, e.hall)}</span>
      <span class="lc-nm"><b>${Z(e.title)}</b><small>${Z(e.symbol)}</small></span>
      <button type="button" class="bell${e.armed ? " on" : ""}" data-bell="${Z(e.key)}" aria-label="Alert on ${Z(e.title)}">${Nu}</button></div>
    <div class="lc-p"><b data-f="px">${Lu(e.px)}</b><em data-f="chg" class="${Bu(e.chg)}">${Ru(e.chg)}</em></div>
    <span class="spk" aria-hidden="true"></span>
    <div class="lc-f"><span><small>24H VOL</small><b data-f="vol">${cu(e.vol)}</b></span><span><small>FUNDING</small><b data-f="fund">${zu(e.funding)}</b></span></div>
  </div>`;
function Uu(e, t) {
	let n = Math.min(devicePixelRatio || 1, 2), r = e.clientWidth, i = e.clientHeight;
	if (!r || !i) return;
	(e.width !== Math.round(r * n) || e.height !== Math.round(i * n)) && (e.width = Math.round(r * n), e.height = Math.round(i * n));
	let a = e.getContext("2d");
	if (!a || (a.setTransform(n, 0, 0, n, 0, 0), a.clearRect(0, 0, r, i), t.length < 2)) return;
	let o = Math.min(...t.map((e) => e.low)), s = Math.max(...t.map((e) => e.high)) - o || 1, c = (e) => 6 + (i - 6 - 6) * (1 - (e - o) / s), l = r / t.length;
	a.strokeStyle = "rgba(212,176,106,.12)", a.lineWidth = 1;
	for (let e = 1; e < 4; e++) {
		let t = Math.round(i / 4 * e) + .5;
		a.beginPath(), a.moveTo(0, t), a.lineTo(r, t), a.stroke();
	}
	t.forEach((e, t) => {
		let n = e.close >= e.open ? "#3fd3c8" : "#e2875a", r = l * t + l / 2;
		a.strokeStyle = n, a.fillStyle = n, a.lineWidth = 1, a.beginPath(), a.moveTo(r, c(e.high)), a.lineTo(r, c(e.low)), a.stroke();
		let i = c(Math.max(e.open, e.close)), o = Math.max(1.5, Math.abs(c(e.open) - c(e.close)));
		a.fillRect(r - l * .3, i, l * .6, o);
	});
	let u = t[t.length - 1].close, d = Math.round(c(u)) + .5;
	a.setLineDash([3, 3]), a.strokeStyle = "rgba(241,220,170,.55)", a.beginPath(), a.moveTo(0, d), a.lineTo(r, d), a.stroke(), a.setLineDash([]);
}
function Wu(e, t, n) {
	Au(e, "room-markets"), e.style.setProperty("--rm-season", `url('${Gs("season.webp")}')`);
	let r = t, i = r.hall, a = "alerts", o = !1, s = "", c = !1, l = new Set(r.alerts.filter((e) => e.fired).map((e) => e.id)), u = [], d = "", f = /* @__PURE__ */ new Map();
	e.innerHTML = `
    <div class="rm-grid">
      ${Q("lite mk-char", "<div data-s=\"char\"></div>")}
      ${Q("mk-halls", `<h3 class="rp-title rp-small">${Mu}<span>THE SIX HALLS</span></h3><div class="hl-list" data-s="halls"></div>`)}
      ${Q("lite mk-vault", "<h3 class=\"rp-title rp-small\"><span>VAULT OF ESSENCE</span></h3><div class=\"mshelf\" data-s=\"vault\"></div>")}
      <div class="mk-arches" data-s="arches" role="tablist" aria-label="Halls"></div>
      ${Q("mk-daily", "\n        <div class=\"dc-thumb\"><i class=\"dc-c tl\"></i><i class=\"dc-c tr\"></i><i class=\"dc-c bl\"></i><i class=\"dc-c br\"></i></div>\n        <div class=\"dc-title\"><h3>THE DAILY CHART</h3><p data-s=\"dsub\">Today&rsquo;s Keystone session.<br>One chart. One House.</p>\n          <button type=\"button\" class=\"dc-go\" data-act=\"daily\" data-s=\"go\"></button></div>\n        <div class=\"dc-chart\"><div class=\"dc-top\"><span class=\"dc-sym\">BTC <small>1H · 24H</small></span><span class=\"dc-px\"><b data-s=\"bpx\">—</b><em data-s=\"bchg\" class=\"nil\">—</em></span></div>\n          <canvas data-s=\"cv\" aria-hidden=\"true\"></canvas></div>\n        <div class=\"dc-stats\"><div><b data-s=\"dtr\">&mdash;</b><small>traders took the chart today</small></div>\n          <div class=\"dc-grade\"><small>YOUR GRADE YESTERDAY</small><b class=\"engr\" data-s=\"dgr\">&mdash;</b></div></div>")}
      ${Q("mk-floor", "<div class=\"mk-scroll\" data-s=\"scroll\"><div class=\"lc-grid\" data-s=\"cards\"></div></div>")}
      ${Q("lite mk-ora", "<div class=\"ora-orb\" data-s=\"orb\"></div><div class=\"ora-say\"><small>ORA &middot; COMPANION OF LIGHT</small><q data-s=\"ora\"></q></div>")}
      ${Q("mk-watch", `<h3 class="rp-title rp-small">${Mu}<span>WATCH LEDGER</span></h3>
        <div class="wl-tabs" data-s="wtabs"></div><div class="wl-list" data-s="wlist"></div>
        <button type="button" class="wl-manage" data-act="manage" data-s="manage"></button>`)}
      <div class="mk-strip">MANY MARKETS. ONE HOUSE.</div>
      <div class="mk-pop" data-s="pop" hidden></div>
    </div>`;
	let p = (t) => e.querySelector(`[data-s="${t}"]`), m = mc(p("orb")), h = n.store ? wu(n.store) : null;
	function g() {
		let e = r.character, t = e.nextXp - e.floorXp, n = t > 0 ? Math.min(100, Math.max(0, (e.totalXp - e.floorXp) / t * 100)) : 0;
		p("char").innerHTML = `<div class="cc-portrait"><img src="${Gs("atlas.webp")}" alt="" draggable="false" /></div>
      <div class="cc-body"><h2>${Z(e.name)}</h2>
        <div class="cc-lv"><span>LEVEL <b>${e.level}</b></span><em>${Math.round(e.totalXp).toLocaleString("en-US")} / ${Math.round(e.nextXp).toLocaleString("en-US")} Light</em></div>
        <div class="cc-bar"><i style="width:${n.toFixed(1)}%"></i></div>
        <div class="cc-rank"><span>RANK</span><b>${Z(e.rank)}</b></div></div>`;
	}
	function _() {
		p("halls").innerHTML = r.halls.map((e) => `<button type="button" class="hl${e.id === i ? " on" : ""}" data-hall="${e.id}">
      <span class="hl-em">${Zs(e.id, e.id)}</span><span class="hl-t"><b>${e.name}</b><small>${Z(e.sub)}</small></span></button>`).join(""), p("arches").innerHTML = r.halls.map((e) => `<button type="button" role="tab" aria-selected="${e.id === i}" class="arch${e.id === i ? " on" : ""}" data-hall="${e.id}">${Fu}
      <span class="arch-em">${Zs(e.id, e.id)}</span><b class="arch-n">${e.name}</b><i class="arch-u"></i></button>`).join("");
	}
	function v() {
		p("vault").innerHTML = r.vault.map((e) => `<div class="mvc" style="--glow:${e.glow}"><span class="mvc-gem"><img src="${Gs(`el/${e.key}.webp`)}" alt="" draggable="false" /></span><b>${e.name}</b><i>&times;${e.count}</i></div>`).join("");
	}
	function y() {
		let e = p("go"), t = !!n.openDaily;
		e.disabled = !t, e.textContent = t ? "ENTER THE DAILY CHART →" : "OPENS SOON", x(p("dtr"), r.daily.traders == null ? "—" : String(r.daily.traders)), x(p("dgr"), r.daily.yesterday ?? "—");
		let i = p("dsub"), a = r.daily.today ? `Sealed today: ${Z(r.daily.today)}.<br>The next chart opens at 00:00 UTC.` : "Today&rsquo;s Keystone session.<br>One chart. One House.";
		i.dataset.h !== a && (i.dataset.h = a, i.innerHTML = a);
	}
	function b() {
		let e = r.lots[i] ?? [];
		s = `${i}|${e.map((e) => e.key).join(",")}`;
		let t = p("cards");
		t.innerHTML = e.map(Hu).join("") || "<p class=\"empty\">No lots in this hall yet.</p>", f = /* @__PURE__ */ new Map(), t.querySelectorAll(".lc").forEach((e) => f.set(e.dataset.key, {
			el: e,
			px: e.querySelector("[data-f=px]"),
			chg: e.querySelector("[data-f=chg]"),
			vol: e.querySelector("[data-f=vol]"),
			fund: e.querySelector("[data-f=fund]"),
			bell: e.querySelector(".bell")
		})), p("scroll").scrollTop = 0, h?.observe(t, ".lc");
	}
	let x = (e, t) => {
		e.textContent !== t && (e.textContent = t);
	};
	function S() {
		let e = r.lots[i] ?? [];
		s !== `${i}|${e.map((e) => e.key).join(",")}` && b();
		for (let t of e) {
			let e = f.get(t.key);
			if (!e) continue;
			x(e.px, Lu(t.px)), x(e.chg, Ru(t.chg));
			let n = Bu(t.chg);
			e.chg.className !== n && (e.chg.className = n), x(e.vol, cu(t.vol)), x(e.fund, zu(t.funding)), e.el.classList.toggle("heavy", t.heavy), e.bell.classList.toggle("on", t.armed);
		}
	}
	function C() {
		for (let e of r.alerts) {
			if (!e.fired || l.has(e.id)) continue;
			l.add(e.id);
			let t = f.get(e.coin)?.bell;
			t && (t.classList.remove("ring"), t.offsetWidth, t.classList.add("ring"), t.addEventListener("animationend", () => t.classList.remove("ring"), { once: !0 }));
		}
	}
	function w() {
		let e = r.banner;
		x(p("bpx"), Lu(e.px));
		let t = p("bchg");
		if (x(t, `${Ru(e.chg)}`), t.className = Bu(e.chg), u.length && e.px != null) {
			let t = u[u.length - 1];
			r.now >= t.time + Vu ? u = [...u.slice(1), {
				time: t.time + Vu,
				open: t.close,
				high: Math.max(t.close, e.px),
				low: Math.min(t.close, e.px),
				close: e.px
			}] : (t.close = e.px, t.high = Math.max(t.high, e.px), t.low = Math.min(t.low, e.px));
		}
		Uu(p("cv"), u);
	}
	n.candles && (d = "BTC", n.candles("BTC").then((e) => {
		!c && d === "BTC" && (u = e.slice(-24).map((e) => ({
			...e,
			time: e.time < 0xe8d4a51000 ? e.time * 1e3 : e.time
		})), w());
	}).catch(() => {}));
	function T() {
		let e = r.alerts.filter((e) => !e.fired);
		p("wtabs").innerHTML = `<button type="button" class="${a === "alerts" ? "on" : ""}" data-tab="alerts">ALERTS (${e.length}${r.alertCap == null ? "" : `/${r.alertCap}`})</button><button type="button" class="${a === "orders" ? "on" : ""}" data-tab="orders">ORDERS (${r.orders.length})</button>`;
		let t = "";
		a === "alerts" ? (t = (o ? r.alerts : e).map((e) => `<div class="wl-row${e.fired ? " fired" : ""}" data-key="${Z(e.coin)}"><span class="wl-em">${Zs(e.coin, e.hall)}</span>
        <span class="wl-t"><b>${Z(e.title)}</b><small>Alert ${e.dir === "above" ? "≥" : "≤"} ${su(e.level)}${e.fired ? " · rang" : ""}</small></span>
        ${o ? `<button type="button" class="wl-x" data-rm="${Z(e.id)}" aria-label="Remove alert">${Pu}</button>` : ""}</div>`).join(""), t ||= "<p class=\"empty\">No bells set.</p>") : t = r.orders.map((e) => `<div class="wl-row" data-key="${Z(e.coin)}"><span class="wl-em">${Zs(e.coin, e.hall)}</span><span class="wl-t"><b>${Z(e.title)}</b><small>${Z(e.line)}</small></span></div>`).join("") || "<p class=\"empty\">No working orders.</p>", p("wlist").innerHTML = t;
		let n = p("manage");
		n.textContent = o ? "← BACK TO THE WATCH" : "MANAGE ALERTS →", n.hidden = a !== "alerts";
	}
	let E = null, D = (e) => r.lots[i]?.find((t) => t.key === e) ?? Object.values(r.lots).flat().find((t) => t.key === e), O = (e) => parseFloat(e.replace(/,/g, "")), k = (e) => e.toFixed(Iu(e));
	function A() {
		let e = E, t = D(e.key), n = Jc(e.dir, O(e.value), t?.px ?? null) != null, r = p("pop").querySelector("[data-pop=save]"), i = p("pop").querySelector("input");
		return r && (r.disabled = n), i?.classList.toggle("bad", n && e.value !== ""), { ok: !n };
	}
	function j() {
		let e = E, t = D(e.key), n = r.alerts.filter((t) => t.coin === e.key && !t.fired);
		p("pop").innerHTML = `<div class="pop-h"><b>${Z(t?.title ?? e.key)}</b><small>${Z(t?.symbol ?? "")}</small></div>
      <div class="pop-dir"><button type="button" data-dir="above" class="${e.dir === "above" ? "on" : ""}">ABOVE</button><button type="button" data-dir="below" class="${e.dir === "below" ? "on" : ""}">BELOW</button></div>
      <label class="pop-in"><span>ALERT AT PRICE</span><input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" value="${Z(e.value)}" /></label>
      ${n.length ? `<div class="pop-mine">${n.map((e) => `<span>${e.dir === "above" ? "≥" : "≤"} ${su(e.level)}<button type="button" data-rm="${Z(e.id)}" aria-label="Remove">${Pu}</button></span>`).join("")}</div>` : ""}
      <div class="pop-act"><button type="button" data-pop="save">SAVE</button><button type="button" data-pop="cancel">CANCEL</button></div>`, A();
	}
	function M() {
		return E ? (E = null, p("pop").hidden = !0, p("pop").innerHTML = "", !0) : !1;
	}
	function ee(t, n) {
		let r = D(t);
		if (!r || r.px == null) return;
		let i = E?.key === t;
		if (M(), i) return;
		E = {
			key: t,
			dir: "above",
			edited: !1,
			value: k(Yc("above", r.px))
		};
		let a = p("pop");
		a.hidden = !1, j();
		let o = e.querySelector(".rm-grid").getBoundingClientRect(), s = n.getBoundingClientRect(), c = o.width / 1920, l = 236 * c, u = s.right - o.left - l;
		u = Math.max(8 * c, Math.min(u, o.width - l - 8 * c));
		let d = s.bottom - o.top + 8 * c, f = a.offsetHeight || 190 * c;
		d + f > o.height - 8 * c && (d = s.top - o.top - f - 8 * c), a.style.left = `${u}px`, a.style.top = `${Math.max(8 * c, d)}px`, a.querySelector("input")?.focus(), a.querySelector("input")?.select();
	}
	let N = (e) => {
		let t = e.target, r = t.closest("[data-bell]");
		if (r) {
			e.stopPropagation(), ee(r.dataset.bell, r);
			return;
		}
		if (t.closest("[data-s=pop]")) {
			let e = E;
			if (!e) return;
			let r = t.closest("[data-dir]")?.dataset.dir, i = t.closest("[data-rm]")?.dataset.rm, a = t.closest("[data-pop]")?.dataset.pop;
			if (r) {
				e.dir = r;
				let t = D(e.key);
				!e.edited && t?.px != null && (e.value = k(Yc(r, t.px))), j();
			} else if (i) n.removeAlert(i);
			else if (a === "cancel") M();
			else if (a === "save") {
				let t = O(e.value);
				if (A().ok) {
					let r = e.key, i = e.dir;
					M(), n.setAlert(r, i, t);
				}
			}
			return;
		}
		E && M();
		let s = t.closest("[data-hall]");
		if (s && s.dataset.hall) {
			let e = s.dataset.hall;
			e !== i && (i = e, n.pickHall?.(e), _(), S());
			return;
		}
		let c = t.closest("[data-rm]")?.dataset.rm;
		if (c) {
			n.removeAlert(c);
			return;
		}
		let l = t.closest("[data-tab]")?.dataset.tab;
		if (l) {
			a = l, l === "orders" && (o = !1), T();
			return;
		}
		if (t.closest("[data-act]")?.dataset.act === "manage") {
			o = !o, T();
			return;
		}
		if (t.closest("[data-act]")?.dataset.act === "daily") {
			n.openDaily?.();
			return;
		}
		let u = t.closest(".wl-row, .lc");
		u?.dataset.key && n.pickLot(u.dataset.key);
	}, te = (e) => {
		let t = e.target;
		E && t.tagName === "INPUT" && (E.value = t.value, E.edited = !0, A());
	}, ne = (e) => {
		let t = e.target;
		if (E && t.tagName === "INPUT" && e.key === "Enter") {
			e.preventDefault(), p("pop").querySelector("[data-pop=save]")?.click();
			return;
		}
		(e.key === "Enter" || e.key === " ") && t.classList.contains("lc") && (e.preventDefault(), n.pickLot(t.dataset.key));
	};
	e.addEventListener("click", N), e.addEventListener("input", te), e.addEventListener("keydown", ne), p("scroll").addEventListener("scroll", () => {
		M();
	}, { passive: !0 });
	let P = "";
	function F(e) {
		e ? (g(), v(), y(), _(), b()) : (g(), v(), y(), S()), x(p("ora"), `“${r.ora}”`);
		let t = `${a}|${o}|${r.alertCap}|${r.alerts.map((e) => `${e.id}${e.fired}`).join(",")}|${r.orders.map((e) => `${e.id}${e.line}`).join(",")}`;
		t !== P && (P = t, T()), w(), C(), E && p("pop").querySelector("input") && A();
	}
	return F(!0), {
		update(e) {
			if (c) return;
			let t = E ? r.alerts.filter((e) => e.coin === E.key && !e.fired).length : 0;
			if (r = e, F(!1), E && r.alerts.filter((e) => e.coin === E.key && !e.fired).length !== t) {
				let e = E, t = p("pop").querySelector("input")?.value;
				t != null && (e.value = t), j();
			}
		},
		escape: () => M(),
		destroy() {
			c = !0, m(), h?.stop(), e.removeEventListener("click", N), e.removeEventListener("input", te), e.removeEventListener("keydown", ne), e.style.removeProperty("--rm-season"), ju(e, "room-markets");
		}
	};
}
//#endregion
//#region src/core/daily.ts
var Gu = "paper-arena:v0:daily", Ku = "Keystone", qu = 144e5, Ju = 864e5, Yu = 1e4, Xu = 1500, Zu = [
	1,
	4,
	16
], Qu = (e) => new Date(e).toISOString().slice(0, 10), $u = (e) => /^\d{4}-\d{2}-\d{2}$/.test(e) && Qu(Date.parse(`${e}T00:00:00Z`)) === e, ed = (e) => Date.parse(`${e}T00:00:00Z`), td = (e) => ed(e) + Ju, nd = (e) => Qu(ed(e) - Ju);
function rd(e) {
	let t = 2166136261;
	for (let n = 0; n < e.length; n++) t ^= e.charCodeAt(n), t = Math.imul(t, 16777619) >>> 0;
	return t >>> 0;
}
function id(e) {
	let t = e >>> 0;
	return () => {
		t = t + 1831565813 >>> 0;
		let e = t;
		return e = Math.imul(e ^ e >>> 15, e | 1), e ^= e + Math.imul(e ^ e >>> 7, e | 61), ((e ^ e >>> 14) >>> 0) / 4294967296;
	};
}
function ad(e) {
	if (!$u(e)) throw Error(`bad date: ${e}`);
	let t = Math.floor((ed(e) - 30 * Ju) / qu) * qu, n = Math.floor(700 * Ju / qu), r = t - Math.floor(id(rd(`the-daily-chart:${e}`))() * n) * qu;
	return {
		date: e,
		coin: "BTC",
		startMs: r - 120 * qu,
		endMs: r
	};
}
function od(e, t) {
	if (t.length !== 120) return !1;
	let n = e.startMs / 1e3;
	return t.every((e, t) => e.time === n + t * 144e5 / 1e3 && e.high >= e.low && Number.isFinite(e.close));
}
var sd = (e = Yu) => ({
	equity: e,
	status: "idle",
	plan: null,
	side: "long",
	qty: 0,
	leverage: 0,
	entry: null,
	entryT: null,
	entryIdx: null,
	stop: null,
	target: null,
	originalStop: null,
	stopMoves: [],
	reached1RAt: null,
	riskPer: 0,
	exit: null,
	exitT: null,
	exitReason: null,
	targetHit: !1,
	atr: null,
	cancelled: !1
}), cd = (e) => e === "long" ? 1 : -1, ld = (e, t) => e.entryType === "limit" && e.limit != null ? e.limit : t;
function ud(e, t, n) {
	if (e.status !== "idle") return "busy";
	let r = cd(t.side);
	if (t.entryType === "limit") {
		if (t.limit == null || !(t.limit > 0)) return "limit_missing";
		if ((n - t.limit) * r <= 0) return "limit_marketable";
	}
	let i = ld(t, n);
	return !Number.isFinite(t.stop) || !(t.stop > 0) ? "no_stop" : (i - t.stop) * r <= 0 ? "stop_side" : t.target != null && (!(t.target > 0) || (t.target - i) * r <= 0) ? "target_side" : !(t.riskPct > 0) || t.riskPct > 5 ? "risk_invalid" : e.equity > 0 ? null : "size_invalid";
}
var dd = (e, t, n, r) => e * t / 100 / Math.abs(n - r);
function fd(e, t, n, r, i) {
	let a = ud(e, t, n.close);
	if (a) return a;
	let o = ld(t, n.close);
	return e.plan = { ...t }, e.side = t.side, e.qty = dd(e.equity, t.riskPct, o, t.stop), e.leverage = e.qty * o / e.equity, e.stop = t.stop, e.originalStop = t.stop, e.target = t.target, e.riskPer = Math.abs(o - t.stop), e.atr = i, e.stopMoves = [], e.cancelled = !1, t.entryType === "market" ? (e.status = "open", e.entry = o, e.entryT = n.time, e.entryIdx = r) : (e.status = "pending", e.entry = null, e.entryT = null, e.entryIdx = null), null;
}
function pd(e, t, n, r) {
	e.status = "closed", e.exit = t, e.exitT = n, e.exitReason = r, e.targetHit = r === "target";
}
function md(e, t, n) {
	let r = cd(e.side), i = e.stop, a = e.side === "long" ? t.low <= i : t.high >= i, o = e.target != null && (e.side === "long" ? t.high >= e.target : t.low <= e.target);
	if (a) {
		pd(e, !n && (e.side === "long" ? t.open < i : t.open > i) ? t.open : i, t.time, "stop");
		return;
	}
	if (o) {
		pd(e, e.target, t.time, "target");
		return;
	}
	let s = e.entry + r * e.riskPer;
	e.reached1RAt == null && (e.side === "long" ? t.high >= s : t.low <= s) && (e.reached1RAt = t.time);
}
function hd(e, t, n) {
	if (e.status === "pending") {
		let r = e.plan?.limit;
		if (!(e.side === "long" ? t.low <= r : t.high >= r)) return;
		e.status = "open", e.entry = r, e.entryT = t.time, e.entryIdx = n, md(e, t, !0);
		return;
	}
	e.status === "open" && md(e, t, !1);
}
function gd(e, t, n) {
	return e.status !== "open" || e.stop == null ? "not_open" : !Number.isFinite(t) || !(t > 0) ? "invalid" : (n.close - t) * cd(e.side) <= 0 ? "through_market" : (t !== e.stop && (e.stopMoves.push({
		t: n.time,
		from: e.stop,
		to: t
	}), e.stop = t), null);
}
function _d(e, t, n) {
	if (e.status !== "open" && e.status !== "pending") return "not_open";
	if (t != null) {
		if (!Number.isFinite(t) || !(t > 0)) return "invalid";
		if ((t - n.close) * cd(e.side) <= 0) return "through_market";
	}
	return e.target = t, null;
}
function vd(e) {
	return e.status === "pending" && (e.status = "idle", e.cancelled = !0, e.plan = null, e.qty = 0, e.stop = null, e.target = null, e.originalStop = null, !0);
}
function yd(e, t) {
	return e.status === "open" && (pd(e, t.close, t.time, "sell"), !0);
}
function bd(e, t) {
	e.status === "open" ? pd(e, t.close, t.time, "expire") : e.status === "pending" && (e.status = "idle", e.cancelled = !0);
}
function xd(e, t) {
	return e.status === "open" && e.entry != null && e.riskPer > 0 ? (t - e.entry) * cd(e.side) / e.riskPer : e.status === "closed" && e.entry != null && e.exit != null && e.riskPer > 0 ? (e.exit - e.entry) * cd(e.side) / e.riskPer : null;
}
function Sd(e, t) {
	if (e.status !== "closed" || e.entry == null || e.exit == null || e.exitReason == null) return null;
	let n = cd(e.side);
	return {
		coin: "BTC",
		side: e.side,
		entry: e.entry,
		exit: e.exit,
		qty: e.qty,
		leverage: e.leverage,
		realizedPnl: (e.exit - e.entry) * n * e.qty,
		equityAtEntry: e.equity,
		exitReason: e.exitReason,
		originalStop: e.originalStop,
		target: e.target ?? e.plan?.target ?? null,
		stopMoves: e.stopMoves.map((e) => ({ ...e })),
		targetHit: e.targetHit,
		reached1RAt: e.reached1RAt,
		gateTaken: 0,
		tilt: !1,
		atr: e.atr,
		oath: {
			riskPct: t.riskPct,
			maxLeverage: t.maxLeverage
		}
	};
}
function Cd(e, t) {
	let n = Sd(e, t);
	if (!n) return {
		grade: "B",
		light: 25,
		result: { kind: "stood_aside" },
		plan: null,
		reason: "disciplined"
	};
	let r = us(n);
	return {
		grade: r.grade,
		light: r.light,
		plan: n,
		reason: ws(r, n.exitReason),
		result: {
			kind: "traded",
			side: n.side,
			entry: n.entry,
			exit: n.exit,
			exitReason: n.exitReason,
			entryT: e.entryT,
			exitT: e.exitT,
			r: r.facts.r,
			pnl: n.realizedPnl,
			riskPct: r.facts.riskPct,
			medals: r.medals,
			verdict: r.verdict,
			widenings: r.facts.widenings
		}
	};
}
var wd = (e) => `house:daily:${e}`, Td = [
	"A",
	"B",
	"C",
	"D",
	"F"
], Ed = (e) => ({
	date: e,
	history: {}
}), Dd = (e) => e.grade != null;
function Od(e, t) {
	let n = Ed(t);
	if (!e || typeof e != "object") return n;
	let r = e, i = {};
	if (r.history && typeof r.history == "object") for (let [e, t] of Object.entries(r.history)) {
		let n = t?.grade;
		$u(e) && Td.includes(n) && (i[e] = {
			grade: n,
			light: Number(t.light) || 0
		});
	}
	let a = typeof r.date == "string" && $u(r.date) && Td.includes(r.grade);
	r.date === t ? (n.history = i, a ? (n.grade = r.grade, n.light = Number(r.light) || 0, n.result = r.result ?? { kind: "stood_aside" }, n.plan = r.plan ?? null) : r.live && typeof r.live == "object" && r.live.sim && Number.isInteger(r.live.idx) && r.live.idx >= 40 && r.live.idx <= 120 && (n.live = {
		idx: r.live.idx,
		sim: {
			...sd(),
			...r.live.sim
		}
	})) : (a && r.date && (i[r.date] = {
		grade: r.grade,
		light: Number(r.light) || 0
	}), n.history = i);
	let o = Object.keys(n.history).sort();
	for (let e of o.slice(0, Math.max(0, o.length - 30))) delete n.history[e];
	return n;
}
function kd(e, t) {
	return {
		date: e.date,
		grade: t.grade,
		light: t.light,
		result: t.result,
		plan: t.plan,
		live: null,
		history: e.history
	};
}
function Ad(e, t) {
	return e.history[nd(t)]?.grade ?? null;
}
function jd(e) {
	if (e.sealed) return e.sealed.result.kind === "stood_aside" ? "You stood aside. The House does not punish a calm hand." : e.sealed.grade === "A" ? "Every seal kept. That is the whole craft." : e.sealed.grade === "B" ? "A sound plan, mostly kept. Look at what cost you the A." : "Read the verdict. The plan, not the print, is the lesson.";
	let t = e.sim;
	return t.status === "closed" ? t.exitReason === "stop" ? "The stop did its job. Let the last candles fall." : "Done. Let the last candles fall; the grade seals at the end." : t.status === "pending" ? "Your limit waits. Patience is a position." : t.status === "open" ? (e.crowd && t.entryT != null && e.crowd.entries.length >= 5 ? Md(t, e.crowd) : null) || (e.r != null && e.r >= 1 && t.reached1RAt != null ? "You have paid one R. A stop to breakeven is a gift to yourself." : e.r != null && e.r <= -.7 ? "Near the stop. Do not touch it. It is the price of being wrong." : "Your stop is written. The next candles are not yours to predict.") : e.idx <= 40 ? e.running ? "The past is fixed. Write the plan, then watch what the market does." : "Forty candles are behind you. Write the plan before you press play." : "No position. Standing aside is a plan too.";
}
function Md(e, t) {
	let n = e.entryIdx;
	if (n == null) return null;
	let r = t.entries.filter((e) => e.i < n).length, i = Math.round(r / t.entries.length * 100);
	return i >= 50 ? `${i}% of the House entered before you. Late is fine; unplanned is not.` : "Most of the House is still waiting. You moved first. Is the stop where the plan says?";
}
//#endregion
//#region src/house/rooms/daily.ts
var Nd = (e) => e == null || !Number.isFinite(e) ? "—" : e.toLocaleString("en-US", {
	minimumFractionDigits: 1,
	maximumFractionDigits: 1
}), Pd = (e) => `$${Math.round(e).toLocaleString("en-US")}`, Fd = (e) => e.trim() === "" ? NaN : parseFloat(e.replace(/,/g, "")), Id = (e) => Math.round(e * 10) / 10, Ld = (e) => String(e).padStart(2, "0"), Rd = (e) => (/* @__PURE__ */ new Date(e * 1e3)).toLocaleDateString("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
	timeZone: "UTC"
}), zd = {
	stop: "<path d=\"M3 11h18\"/><path d=\"M12 11v8.5M8.2 15.8 12 19.6l3.8-3.8\"/>",
	size: "<path d=\"M12 4v15.5M7 20h10M4 8.5h16\"/><path d=\"M4 8.5 2 14.2a3 3 0 0 0 4 0zM20 8.5l-2 5.7a3 3 0 0 0 4 0z\"/>",
	target: "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><circle cx=\"12\" cy=\"12\" r=\"4.4\"/><circle cx=\"12\" cy=\"12\" r=\"1\" fill=\"currentColor\"/>"
}, Bd = (e) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${zd[e]}</svg>`, Vd = {
	busy: "A plan is already written.",
	no_stop: "Write a stop. The size comes from it.",
	stop_side: "The stop belongs beyond your entry, on the losing side.",
	target_side: "The target belongs on the winning side of your entry.",
	limit_missing: "Set the limit price.",
	limit_marketable: "That limit is at or through the market. Use MARKET, or set it away from the price.",
	risk_invalid: "Risk must be above 0 and at most 5%.",
	size_invalid: "The purse is empty."
}, Hd = {
	ok: "Kept",
	no_stop: "No stop",
	wrong_side: "Wrong side",
	inside_noise: "Inside the noise",
	widened: "Widened",
	risk_over: "Risk over the Oath",
	leverage_over: "Leverage over",
	risk_and_leverage_over: "Over the Oath",
	invalid: "Not sized",
	no_target: "No target",
	below_1r: "Under 1R"
}, Ud = {
	stop: "Stopped at the plan",
	target: "Target taken",
	sell: "Closed by hand",
	expire: "Held to the last candle",
	trailingStop: "Trailing stop",
	liquidation: "Liquidated"
};
function Wd(e, t, n) {
	Au(e, "room-daily"), e.style.setProperty("--rm-season", `url('${Gs("season.webp")}')`);
	let r = t, i = !1, a = r.pick.startMs / 1e3, o = qu / 1e3, s = [], c = 40, l = sd(), u = r.record, d = Dd(u) ? {
		grade: u.grade,
		light: u.light ?? 0,
		result: u.result ?? { kind: "stood_aside" },
		plan: u.plan ?? null,
		reason: "disciplined"
	} : null, f = !1, p = 1, m = 0, h = "loading", g = !1, _ = 0;
	d ? c = 120 : u.live && (c = u.live.idx, l = u.live.sim);
	let v = {
		side: "long",
		entryType: "market",
		limit: "",
		stop: "",
		target: ""
	}, y = "stop", b = !1, S = "";
	e.innerHTML = `
    <div class="dy-grid">
      ${Q("lite dy-char", "<div data-s=\"char\"></div>")}
      ${Q("dy-house", `<h3 class="rp-title rp-small">${Mu}<span>YOUR DAILY CHARTS</span></h3>
        <p class="dh-sub">The last seven days</p><div class="dh-days" data-s="bars"></div>
        <p class="dh-foot" data-s="hfoot">Your grade is sealed when the last candle falls.</p>`)}
      ${Q("lite dy-oath", "<h3 class=\"rp-title rp-small\"><span>YOUR OATH</span></h3><div class=\"do-rows\" data-s=\"oath\"></div>")}
      <section class="rp dy-frame">
        <i class="df-c tl"></i><i class="df-c tr"></i><i class="df-c bl"></i><i class="df-c br"></i>
        <header class="df-head">
          <div class="df-title"><h2>THE DAILY CHART</h2><p data-s="sub">${Z(Ku)}, session of the day</p></div>
          <div class="df-ctl" data-s="ctl">
            <div class="df-speed" role="group" aria-label="Replay speed">${(r.speeds ?? Zu).map((e) => `<button type="button" data-speed="${e}">${e}x</button>`).join("")}</div>
            <button type="button" class="df-play" data-act="play" data-s="play" aria-label="Play"></button>
          </div>
          <div class="df-clock"><small>CANDLE</small><b data-s="clock">—</b><em>of 120</em></div>
        </header>
        <div class="df-plot" data-s="plot"><div class="df-lw" data-s="lw"></div><canvas class="df-ov" data-s="ov" aria-hidden="true"></canvas>
          <div class="df-msg" data-s="pmsg"></div><div class="df-stamp" data-s="stamp" hidden></div></div>
        <footer class="df-plan" data-s="plan"></footer>
      </section>
      ${Q("dy-seals", `<h3 class="rp-title rp-small">${Mu}<span>YOUR SEALS</span></h3><div class="ds-row" data-s="seals"></div>`)}
      ${Q("dy-pos", `<h3 class="rp-title rp-small">${Mu}<span>POSITION STATUS</span></h3><div class="dp-body" data-s="pos"></div>`)}
      ${Q("lite dy-ora", "<div class=\"ora-orb\" data-s=\"orb\"></div><div class=\"ora-say\"><small>ORA &middot; COMPANION OF LIGHT</small><q data-s=\"ora\"></q></div>")}
    </div>`;
	let C = (t) => e.querySelector(`[data-s="${t}"]`), w = mc(C("orb")), T = (e, t) => {
		e.textContent !== t && (e.textContent = t);
	}, E = (e, t) => {
		e.dataset.h !== t && (e.dataset.h = t, e.innerHTML = t);
	}, D = C("lw"), O = 1, k = Ei(D, {
		autoSize: !0,
		crosshair: { mode: 0 },
		handleScroll: !1,
		handleScale: !1,
		layout: {
			background: { color: "transparent" },
			textColor: "#b9ae97",
			fontFamily: "Barlow Condensed, sans-serif",
			fontSize: 13,
			attributionLogo: !1
		},
		grid: {
			vertLines: { color: "rgba(212,176,106,0.07)" },
			horzLines: { color: "rgba(212,176,106,0.10)" }
		},
		rightPriceScale: {
			borderColor: "rgba(212,176,106,0.30)",
			scaleMargins: {
				top: .08,
				bottom: .08
			}
		},
		timeScale: {
			borderColor: "rgba(212,176,106,0.30)",
			timeVisible: !0,
			rightOffset: 0,
			lockVisibleTimeRangeOnResize: !0,
			tickMarkFormatter: (e) => `#${Math.round((e - a) / o) + 1}`
		},
		localization: { timeFormatter: (e) => `Candle ${Math.round((e - a) / o) + 1}` }
	}), A = [], j = k.addSeries(Ki, {
		upColor: "#57d6a3",
		downColor: "#e2875a",
		borderVisible: !1,
		wickUpColor: "#57d6a3",
		wickDownColor: "#e2875a",
		priceFormat: {
			type: "price",
			precision: 1,
			minMove: .1
		},
		lastValueVisible: !1,
		priceLineVisible: !1,
		autoscaleInfoProvider: (e) => {
			let t = e();
			return !t || !A.length ? t : {
				...t,
				priceRange: {
					minValue: Math.min(t.priceRange.minValue, ...A),
					maxValue: Math.max(t.priceRange.maxValue, ...A)
				}
			};
		}
	}), M = {
		entry: null,
		stop: null,
		target: null
	}, ee = {
		entry: {
			color: "#f1dcaa",
			title: "ENTRY"
		},
		stop: {
			color: "#e2875a",
			title: "STOP"
		},
		target: {
			color: "#3fd3c8",
			title: "TARGET"
		}
	};
	function N(e, t, n) {
		let r = M[e];
		if (t == null || !Number.isFinite(t)) {
			r && (j.removePriceLine(r), M[e] = null);
			return;
		}
		let i = {
			price: t,
			color: ee[e].color,
			lineWidth: 2,
			lineStyle: n ? x.Solid : x.Dashed,
			axisLabelVisible: !0,
			title: ee[e].title
		};
		r ? r.applyOptions(i) : M[e] = j.createPriceLine(i);
	}
	let te = () => {
		k.timeScale().setVisibleLogicalRange({
			from: -1,
			to: 120
		});
	}, ne = (e) => Array.from({ length: 120 - e }, (t, n) => ({ time: a + (e + n) * o }));
	function P() {
		j.setData([...s.slice(0, c).map((e) => ({
			time: e.time,
			open: e.open,
			high: e.high,
			low: e.low,
			close: e.close
		})), ...ne(c)]), te();
	}
	let F = (e) => {
		let t = k.timeScale().logicalToCoordinate(0), n = k.timeScale().logicalToCoordinate(1);
		return t == null || n == null ? null : t + e * (n - t);
	}, re = (e) => j.priceToCoordinate(e), I = () => s.length && c >= 1 ? s[c - 1] : null, L = () => s.length ? Lo(s.slice(0, c)) : null, R = () => d != null || c >= 120, z = () => d ? "sealed" : l.status === "pending" ? "pending" : l.status === "open" ? "open" : l.status === "closed" ? "done" : "draft";
	function B() {
		let e = Fd(v.stop);
		if (!Number.isFinite(e)) return null;
		let t = Fd(v.target), n = Fd(v.limit);
		return {
			side: v.side,
			entryType: v.entryType,
			limit: Number.isFinite(n) ? n : null,
			stop: e,
			target: Number.isFinite(t) ? t : null,
			riskPct: r.oath.riskPct
		};
	}
	function ie() {
		let e = I();
		if (l.plan && l.status !== "idle") {
			let e = l.entry ?? l.plan.limit;
			return {
				seals: ts({
					side: l.side,
					entry: e,
					stop: l.originalStop,
					target: l.plan.target,
					qty: l.qty,
					leverage: l.leverage
				}, {
					equity: l.equity,
					tradesToday: 0
				}, r.oath, l.atr),
				qty: l.qty,
				entry: e,
				lev: l.leverage
			};
		}
		let t = B();
		if (!t || !e) return {
			seals: null,
			qty: 0,
			entry: null,
			lev: 0
		};
		let n = ld(t, e.close);
		if (!((n - t.stop) * (t.side === "long" ? 1 : -1) > 0)) return {
			seals: null,
			qty: 0,
			entry: n,
			lev: 0
		};
		let i = dd(Yu, t.riskPct, n, t.stop), a = i * n / Yu;
		return {
			seals: ts({
				side: t.side,
				entry: n,
				stop: t.stop,
				target: t.target,
				qty: i,
				leverage: a
			}, {
				equity: Yu,
				tradesToday: 0
			}, r.oath, L()),
			qty: i,
			entry: n,
			lev: a
		};
	}
	function V() {
		let e = r.character, t = e.nextXp - e.floorXp, n = t > 0 ? Math.min(100, Math.max(0, (e.totalXp - e.floorXp) / t * 100)) : 0;
		E(C("char"), `<div class="cc-portrait"><img src="${Gs("atlas.webp")}" alt="" draggable="false" /></div>
      <div class="cc-body"><h2>${Z(e.name)}</h2>
        <div class="cc-lv"><span>LEVEL <b>${e.level}</b></span><em>${Math.round(e.totalXp).toLocaleString("en-US")} / ${Math.round(e.nextXp).toLocaleString("en-US")} Light</em></div>
        <div class="cc-bar"><i style="width:${n.toFixed(1)}%"></i></div>
        <div class="cc-rank"><span>RANK</span><b>${Z(e.rank)}</b></div></div>`);
	}
	function H() {
		let e = d ? { [r.date]: {
			grade: d.grade,
			light: d.light
		} } : {}, t = {
			...u.history ?? {},
			...e
		}, n = [], i = Date.parse(`${r.date}T00:00:00Z`);
		for (let e = 0; e < 7; e++) {
			let r = (/* @__PURE__ */ new Date(i - e * 864e5)).toISOString().slice(0, 10), a = t[r], o = (/* @__PURE__ */ new Date(`${r}T00:00:00Z`)).toLocaleDateString("en-US", {
				weekday: "short",
				month: "short",
				day: "numeric",
				timeZone: "UTC"
			});
			n.push(`<div class="dd${a ? "" : " none"}${e === 0 ? " now" : ""}"><span>${Z(o)}</span><b>${a ? Z(a.grade) : "·"}</b><em>${a ? `${a.light > 0 ? "+" : ""}${a.light} Light` : ""}</em></div>`);
		}
		E(C("bars"), n.join("")), T(C("hfoot"), d ? "Your grade is sealed. Come back tomorrow." : "Your grade is sealed when the last candle falls.");
	}
	function ae() {
		let e = r.oath;
		E(C("oath"), `<div><span>Risk per trade</span><b>${e.riskPct}%</b></div><div><span>Max leverage</span><b>${e.maxLeverage}x</b></div><div><span>Replay purse</span><b>${Pd(Yu)}</b></div><p>One plan. One attempt. The Oath sizes it.</p>`);
	}
	function oe() {
		e.querySelectorAll("[data-speed]").forEach((e) => e.classList.toggle("on", Number(e.dataset.speed) === p));
		let t = C("play");
		t.innerHTML = f ? "<svg viewBox=\"0 0 24 24\"><path d=\"M7 5h3.5v14H7zM13.5 5H17v14h-3.5z\" fill=\"currentColor\"/></svg>" : "<svg viewBox=\"0 0 24 24\"><path d=\"M7 4.5v15l12-7.5z\" fill=\"currentColor\"/></svg>", t.setAttribute("aria-label", f ? "Pause" : "Play"), e.querySelector(".df-ctl")?.classList.toggle("off", R() || h !== "ready"), T(C("clock"), String(c)), T(C("sub"), d ? `${Ku}, ${Rd(a)} to ${Rd(a + 120 * o - 1)}` : `${Ku}, session of the day`);
	}
	function se(e, t, n, r) {
		return `<div class="sl ${n}" data-seal="${e}"><span class="sl-disc">${Bd(e)}</span><b>${t}</b><small>${Z(r)}</small></div>`;
	}
	function U() {
		if (d?.result.verdict) {
			let e = d.result.verdict;
			E(C("seals"), se("stop", "STOP", e.stop.ok ? "ok" : "broken", Hd[e.stop.code] ?? e.stop.code) + se("size", "SIZE", e.size.ok ? "ok" : "broken", Hd[e.size.code] ?? e.size.code) + se("target", "TARGET", e.target.ok ? "ok" : "broken", Hd[e.target.code] ?? e.target.code));
			return;
		}
		if (d) {
			E(C("seals"), se("stop", "STOP", "", "No plan written") + se("size", "SIZE", "", "Nothing risked") + se("target", "TARGET", "", "No plan written"));
			return;
		}
		let { seals: e } = ie();
		if (!e) {
			E(C("seals"), se("stop", "STOP", "", "Write the plan") + se("size", "SIZE", "", "from your Oath") + se("target", "TARGET", "", "to light the seals"));
			return;
		}
		let t = e.stop, n = e.size, r = e.target, i = t.ok ? t.detail.distanceAtr == null ? "Placed" : `${t.detail.distanceAtr.toFixed(1)} ATR out` : Hd[t.code] ?? t.code, a = n.ok ? `${(n.detail.riskPct ?? 0).toFixed(2)}% risk` : Hd[n.code] ?? n.code, o = r.ok ? `${(r.detail.rr ?? 0).toFixed(1)}R reward` : Hd[r.code] ?? r.code;
		E(C("seals"), se("stop", "STOP", t.ok ? "ok" : "broken", i) + se("size", "SIZE", n.ok ? "ok" : "broken", a) + se("target", "TARGET", r.ok ? "ok" : "broken", o));
	}
	function ce() {
		let e = I(), t = e ? e.close : null, n = l.status === "open" && t != null ? xd(l, t) : l.status === "closed" ? xd(l, 0) : d?.result.r ?? null, r = d && d.result.kind === "traded" ? {
			st: "CLOSED",
			side: d.result.side,
			entry: d.result.entry,
			cur: d.result.exit,
			stop: d.plan?.originalStop ?? null,
			target: d.plan?.target ?? null,
			curLabel: "EXIT"
		} : l.status === "idle" ? null : {
			st: l.status === "pending" ? "WAITING" : l.status === "open" ? "OPEN" : "CLOSED",
			side: l.side,
			entry: l.entry ?? l.plan?.limit ?? null,
			cur: l.status === "closed" ? l.exit : t,
			stop: l.status === "closed" ? l.originalStop : l.stop,
			target: l.target,
			curLabel: l.status === "closed" ? "EXIT" : "CURRENT"
		}, i = n == null ? "nil" : n >= 0 ? "up" : "dn", a = `<div class="dp-pair"><b>${Z(Ku)}</b><span>/ USD</span>${r ? `<em class="${r.side}">${r.side.toUpperCase()} &middot; ${r.st}</em>` : "<em class=\"none\">NO POSITION</em>"}</div>`, o = r ? `<div><small>ENTRY</small><b>${Nd(r.entry)}</b></div><div><small>${r.curLabel}</small><b>${Nd(r.cur)}</b></div><div><small>STOP</small><b class="dn">${Nd(r.stop)}</b></div><div><small>TARGET</small><b class="up">${Nd(r.target)}</b></div>` : `<div><small>ENTRY</small><b>—</b></div><div><small>CURRENT</small><b>${Nd(t)}</b></div><div><small>STOP</small><b>—</b></div><div><small>TARGET</small><b>—</b></div>`;
		E(C("pos"), `${a}<div class="dp-grid">${o}</div><div class="dp-r ${i}"><small>${l.status === "closed" || d ? "RESULT" : "OPEN R"}</small><b>${n == null ? d ? "FLAT" : "—" : Eu(n, 2)}</b></div>`);
	}
	function le() {
		let e = I(), t = l.status === "open" && e ? xd(l, e.close) : null;
		T(C("ora"), `“${jd({
			sim: l,
			idx: c,
			sealed: d,
			r: t,
			crowd: null,
			running: f
		})}”`);
	}
	let W = "", ue = (e, t, n) => `<div class="pl-seg" data-seg="${e}">${t.map(([e, t]) => `<button type="button" data-v="${e}" class="${n === e ? "on" : ""}">${t}</button>`).join("")}</div>`, de = (e, t, n, r, i = "") => `<label class="pl-f${y === e ? " armed" : ""}" data-f="${e}"><span>${t}</span><input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-in="${e}" value="${Z(n)}" placeholder="${r}" />${i}</label>`;
	function fe() {
		let e = z();
		W = e;
		let t = C("plan");
		e === "draft" ? t.innerHTML = `<div class="pl-row">
          <div class="pl-grp"><small>SIDE</small>${ue("side", [["long", "LONG"], ["short", "SHORT"]], v.side)}</div>
          <div class="pl-grp"><small>ENTRY</small>${ue("etype", [["market", "MARKET"], ["limit", "LIMIT"]], v.entryType)}</div>
          ${v.entryType === "limit" ? de("limit", "LIMIT", v.limit, "price") : ""}
          ${de("stop", "STOP", v.stop, "price", "<button type=\"button\" class=\"pl-meas\" data-act=\"measure\" title=\"The measured stop: ATR and the last swing\">MEASURED</button>")}
          ${de("target", "TARGET", v.target, "price")}
          <div class="pl-grp pl-risk"><small>RISK</small><b>${r.oath.riskPct}%</b><em>your Oath</em></div>
          <button type="button" class="pl-go" data-act="place" data-s="place">WRITE THE PLAN</button>
        </div>
        <div class="pl-sub"><span data-s="size"></span><span class="pl-hint" data-s="hint"></span></div>` : e === "pending" ? t.innerHTML = `<div class="pl-row"><div class="pl-grp"><small>LIMIT ORDER</small><b>${l.side.toUpperCase()} at ${Nd(l.plan?.limit)}</b><em>waiting to be touched</em></div>
          ${de("mtarget", "TARGET", l.target == null ? "" : String(l.target), "price", "<button type=\"button\" class=\"pl-meas\" data-act=\"mvtarget\">MOVE</button>")}
          <button type="button" class="pl-go ghost" data-act="cancel">CANCEL THE ORDER</button></div><div class="pl-sub"><span class="pl-hint" data-s="hint"></span></div>` : e === "open" ? t.innerHTML = `<div class="pl-row">
          ${de("mstop", "STOP", String(l.stop ?? ""), "price", "<button type=\"button\" class=\"pl-meas\" data-act=\"mvstop\">MOVE</button>")}
          ${de("mtarget", "TARGET", l.target == null ? "" : String(l.target), "price", "<button type=\"button\" class=\"pl-meas\" data-act=\"mvtarget\">MOVE</button>")}
          <button type="button" class="pl-go ghost" data-act="close">CLOSE NOW</button></div>
        <div class="pl-sub"><span class="pl-hint" data-s="hint"></span></div>` : e === "done" ? t.innerHTML = `<div class="pl-row pl-done"><b>${Z(Ud[l.exitReason ?? "sell"] ?? "Closed")}.</b><span>Let the last candles fall. Your grade is sealed at the end.</span></div>` : G(t), me();
	}
	let pe = () => {
		let e = Math.max(0, td(r.date) - Date.now()), t = Math.floor(e / 1e3);
		return `${Ld(Math.floor(t / 3600))}:${Ld(Math.floor(t % 3600 / 60))}:${Ld(t % 60)}`;
	};
	function G(e) {
		let t = d, n = t.result, r = n.kind === "stood_aside" ? "<b class=\"ln1\">You stood aside.</b><span>No plan, no risk. Standing aside is allowed, and it is graded calm.</span>" : `<b class="ln1">${Z(Ud[n.exitReason ?? "sell"] ?? "Closed")}.</b><span>${(n.side ?? "long").toUpperCase()} ${Nd(n.entry)} to ${Nd(n.exit)} &middot; <i class="${(n.r ?? 0) >= 0 ? "up" : "dn"}">${Eu(n.r ?? null, 2)}</i>${n.medals?.length ? ` &middot; ${n.medals.map((e) => e.replace("_", " ")).join(", ")}` : ""}</span>`;
		e.innerHTML = `<div class="pl-row pl-sealed"><div class="sg"><span class="sg-l">${t.grade}</span><small>SEALED</small></div>
        <div class="sg-t">${r}<span class="sg-light">${t.light > 0 ? `+${t.light} Light` : `${t.light} Light`}</span></div>
        <div class="sg-next"><small>Tomorrow&rsquo;s chart opens at 00:00 UTC</small><b data-s="cd">${pe()}</b></div></div>`;
	}
	function me() {
		let t = e.querySelector("[data-s=\"hint\"]");
		if (z() === "draft") {
			let n = B(), r = I(), i = !b && !v.stop && !v.target && !v.limit, a = n && r ? ud(l, n, r.close) : "no_stop", o = ie(), s = e.querySelector("[data-s=\"size\"]");
			s && (s.textContent = o.qty > 0 && o.entry != null ? `Size ${o.qty.toFixed(4)} BTC · ${Pd(o.qty * o.entry)} · ${o.lev.toFixed(1)}x` : "");
			let c = e.querySelector("[data-s=\"place\"]");
			c && (c.disabled = a != null || h !== "ready" || R()), t && (t.textContent = S || (i ? "" : a && a !== "no_stop" ? Vd[a] : a === "no_stop" && b ? Vd.no_stop : ""));
		} else t && (t.textContent = S);
	}
	function he(e) {
		S = e, me();
	}
	function ge(e) {
		g = !0, !(!e && performance.now() - _ < 500) && _e();
	}
	function _e() {
		!g || d || i || (g = !1, _ = performance.now(), u = {
			...u,
			live: {
				idx: c,
				sim: JSON.parse(JSON.stringify(l))
			}
		}, n.save(u));
	}
	function K() {
		oe(), U(), ce(), le(), H(), V(), ae(), W === z() ? me() : fe(), ve();
	}
	function ve() {
		A.length = 0;
		let e = l.status === "open" || l.status === "pending" || l.status === "closed" || d != null;
		if (d?.plan) N("entry", d.plan.entry, !0), N("stop", d.plan.originalStop, !0), N("target", d.plan.target, !0);
		else if (l.plan && l.status !== "idle") N("entry", l.entry ?? l.plan.limit, e), N("stop", l.status === "closed" ? l.originalStop : l.stop, !0), N("target", l.target, !0);
		else {
			let e = B(), t = I();
			N("entry", e && t ? ld(e, t.close) : null, !1), N("stop", e ? e.stop : null, !1), N("target", e?.target ?? null, !1);
		}
		for (let e of [
			"entry",
			"stop",
			"target"
		]) {
			let t = M[e];
			t && A.push(t.options().price);
		}
		A.length && j.applyOptions({});
	}
	function ye() {
		if (c >= 120 || !s.length) return;
		c++;
		let e = s[c - 1], t = l.status;
		if (hd(l, e, c - 1), P(), t !== l.status && (l.status === "closed" ? (f = !1, S = "", he("")) : l.status === "open" && (S = "")), c >= 120) {
			be();
			return;
		}
		ge(t !== l.status), oe(), ce(), le(), U(), W !== z() && fe(), ve();
	}
	function be() {
		bd(l, s[119]);
		let e = Cd(l, r.oath);
		d = e, f = !1, u = kd(u, e), n.seal(u, e);
		let t = C("stamp");
		t.hidden = !1, t.innerHTML = `<span class="stm-g">${e.grade}</span><small>${e.result.kind === "stood_aside" ? "YOU STOOD ASIDE" : "SEALED"}</small>`, t.classList.remove("go"), t.offsetWidth, t.classList.add("go"), W = "", K(), fe();
	}
	function xe() {
		let e = I(), t = B();
		if (!e || !t || R()) return;
		let n = fd(l, t, e, c - 1, L());
		if (n) {
			he(Vd[n]);
			return;
		}
		S = "", ge(!0), W = "", K(), fe();
	}
	function Se() {
		let t = I(), n = Fd(e.querySelector("[data-in=\"mstop\"]")?.value ?? "");
		if (!t) return;
		let r = gd(l, n, t);
		if (r) {
			he(r === "through_market" ? "A stop through the price would close you at once. Use CLOSE NOW." : "Not a price.");
			return;
		}
		let i = l.stopMoves[l.stopMoves.length - 1];
		he(i && i.to != null && i.from != null && (l.side === "long" ? i.to < i.from : i.to > i.from) ? "Stop widened. That is recorded and it will cost you." : "Stop moved."), ge(!0), K();
	}
	function Ce() {
		let t = I(), n = e.querySelector("[data-in=\"mtarget\"]")?.value ?? "";
		if (!t) return;
		let r = n.trim() === "" ? null : Fd(n), i = _d(l, r, t);
		if (i) {
			he(i === "through_market" ? "The target must sit on the winning side of the price." : "Not a price.");
			return;
		}
		he("Target moved."), ge(!0), K();
	}
	let we = (e) => {
		let t = j.coordinateToPrice(e);
		return t == null ? null : Id(t);
	};
	function Te(t) {
		let n = e.querySelector(`[data-in="${y}"]`);
		n && (n.value = String(t), Ee(y, n.value));
	}
	function Ee(e, t) {
		b = !0, S = "", (e === "limit" || e === "stop" || e === "target") && (v[e] = t, U(), ve(), me());
	}
	let De = (t) => {
		let n = t.target, r = n.closest("[data-speed]");
		if (r) {
			p = Number(r.dataset.speed), oe();
			return;
		}
		let i = n.closest("[data-act]")?.dataset.act;
		if (i === "play") {
			Ne();
			return;
		}
		if (i === "place") {
			xe();
			return;
		}
		if (i === "mvstop") {
			Se();
			return;
		}
		if (i === "mvtarget") {
			Ce();
			return;
		}
		if (i === "cancel") {
			vd(l), S = "", ge(!0), W = "", K(), fe();
			return;
		}
		if (i === "close") {
			let e = I();
			e && yd(l, e) && (f = !1, ge(!0), W = "", K(), fe());
			return;
		}
		if (i === "measure") {
			let e = I();
			if (!e) return;
			let t = B(), n = t ? ld({
				entryType: v.entryType,
				limit: t.limit
			}, e.close) : e.close, r = zo(s.slice(0, c), v.side, n);
			if (!r) {
				he("Not enough candles to measure.");
				return;
			}
			v.stop = String(Id(r.stop)), b = !0, fe(), U(), ve();
			return;
		}
		let a = n.closest(".pl-seg [data-v]");
		if (a) {
			let e = a.parentElement.dataset.seg;
			e === "side" ? v.side = a.dataset.v : e === "etype" && (v.entryType = a.dataset.v, y = v.entryType === "limit" ? "limit" : y === "limit" ? "stop" : y), b = !0, S = "", fe(), U(), ve();
			return;
		}
		let o = n.closest(".pl-f");
		o?.dataset.f && o.dataset.f !== y && (y = o.dataset.f, e.querySelectorAll(".pl-f").forEach((e) => e.classList.toggle("armed", e.dataset.f === y)));
	}, Oe = (e) => {
		let t = e.target;
		t.dataset.in && Ee(t.dataset.in, t.value);
	}, ke = (t) => {
		let n = t.target;
		n.dataset?.in && n.dataset.in !== y && (y = n.dataset.in, e.querySelectorAll(".pl-f").forEach((e) => e.classList.toggle("armed", e.dataset.f === y)));
	}, Ae = (e) => {
		let t = e.target;
		if (t.tagName === "INPUT" && e.key === "Enter") {
			e.preventDefault();
			let n = t.dataset.in;
			n === "mstop" ? Se() : n === "mtarget" ? Ce() : xe();
			return;
		}
		e.key === " " && t.tagName !== "INPUT" && t.tagName !== "BUTTON" && (e.preventDefault(), Ne());
	};
	e.addEventListener("click", De), e.addEventListener("input", Oe), e.addEventListener("focusin", ke), document.addEventListener("keydown", Ae);
	let je = () => {
		k.unsubscribeClick(Me);
	};
	function Me(e) {
		if (!e.point || R() || l.status === "closed" || e.logical != null && e.logical > c - .5) return;
		let t = we(e.point.y);
		t != null && (z() === "draft" || z() === "open" || z() === "pending") && Te(t);
	}
	k.subscribeClick(Me);
	function Ne() {
		R() || h !== "ready" || (f = !f, oe(), le());
	}
	let Pe = C("pmsg");
	function Fe() {
		h = "loading", Pe.innerHTML = "<span class=\"pm-orb\"></span><b>The House is opening the chart&hellip;</b>", Pe.hidden = !1, n.loadCandles(r.pick).then((e) => {
			if (!i) {
				if (s = e, h = "ready", Pe.hidden = !0, d) c = 120;
				else if (c >= 120) {
					P(), be();
					return;
				}
				P(), W = "", K(), fe(), Be();
			}
		}).catch(() => {
			i || (h = "failed", Pe.innerHTML = "<b>The chart could not be reached.</b><span>The session loads from Hyperliquid. Check the connection.</span><button type=\"button\" data-act=\"retry\">TRY AGAIN</button>", Pe.hidden = !1);
		});
	}
	let Ie = (e) => {
		e.target.closest("[data-act=\"retry\"]") && Fe();
	};
	e.addEventListener("click", Ie);
	let Le = C("ov"), q = Le.getContext("2d"), J = 0, Re = 0, ze = 1;
	function Be() {
		let e = Le.clientWidth, t = Le.clientHeight;
		e && t && (ze = Math.min(devicePixelRatio || 1, 2), (J !== e || Re !== t || Le.width !== Math.round(e * ze)) && (J = e, Re = t, Le.width = Math.round(e * ze), Le.height = Math.round(t * ze)), O = Math.max(.5, Math.min(e / 1e3, 1.4)), k.applyOptions({ layout: { fontSize: Math.round(13 * Math.max(.8, O)) } }), te());
	}
	let Y = new ResizeObserver(Be);
	Y.observe(C("plot"));
	function Ve(e, t, n, r, i) {
		q.globalAlpha = r, q.fillStyle = i, q.beginPath(), q.arc(e, t, n, 0, 6.2832), q.fill();
	}
	function He(e) {
		if (!J || !Re) return;
		q.setTransform(ze, 0, 0, ze, 0, 0), q.clearRect(0, 0, J, Re);
		let t = k.timeScale().width(), n = k.timeScale().height(), r = Re - n;
		if (t <= 0 || r <= 0) return;
		let i = e / 1e3;
		q.save(), q.beginPath(), q.rect(0, 0, t, r), q.clip();
		let s = c >= 120, u = s ? 119.5 : c - .5 + Math.min(m, .999), f = F(u);
		if (f != null && !s) {
			let e = 70 * O, n = q.createLinearGradient(f, 0, f + e, 0);
			n.addColorStop(0, "rgba(12,20,44,0)"), n.addColorStop(1, "rgba(12,20,44,.93)"), q.globalAlpha = 1, q.fillStyle = n, q.fillRect(f, 0, e, r), q.fillStyle = "rgba(12,20,44,.93)", q.fillRect(f + e, 0, Math.max(0, t - f - e), r);
			let i = q.createLinearGradient(0, 0, 0, r);
			i.addColorStop(0, "rgba(255,240,200,.15)"), i.addColorStop(.5, "rgba(255,240,200,.95)"), i.addColorStop(1, "rgba(255,240,200,.15)"), q.globalAlpha = 1, q.shadowColor = "rgba(255,214,130,.9)", q.shadowBlur = 16 * O, q.fillStyle = i, q.fillRect(f - 1.2 * O, 0, 2.4 * O, r), q.shadowBlur = 0;
			let a = q.createLinearGradient(f - 28 * O, 0, f, 0);
			a.addColorStop(0, "rgba(255,214,130,0)"), a.addColorStop(1, "rgba(255,214,130,.13)"), q.fillStyle = a, q.fillRect(f - 28 * O, 0, 28 * O, r), q.globalAlpha = 1, q.fillStyle = "#fff4d6", q.shadowColor = "rgba(255,214,130,1)", q.shadowBlur = 12 * O, q.beginPath(), q.moveTo(f, 2), q.lineTo(f + 5 * O, 8 * O), q.lineTo(f, 14 * O), q.lineTo(f - 5 * O, 8 * O), q.closePath(), q.fill(), q.shadowBlur = 0;
		}
		let p = (e, t, n) => {
			if (e == null || t == null) return;
			let r = F(e), a = re(t);
			if (r == null || a == null) return;
			let o = .7 + .3 * Math.sin(i * 2.2), s = n === "in" ? "#ffe7a8" : "#bfeee9";
			q.globalAlpha = .22 * o, q.fillStyle = s, q.beginPath(), q.arc(r, a, 12 * O, 0, 6.2832), q.fill(), q.globalAlpha = 1, q.strokeStyle = s, q.lineWidth = 1.4 * O, q.beginPath(), q.moveTo(r - 7 * O, a), q.lineTo(r + 7 * O, a), q.moveTo(r, a - 7 * O), q.lineTo(r, a + 7 * O), q.stroke(), Ve(r, a, 2.6 * O, 1, "#fff6dc");
		};
		if (d?.result.kind === "traded") {
			let e = d.result;
			p(e.entryT == null ? null : Math.round((e.entryT - a) / o), e.entry ?? null, "in"), p(e.exitT == null ? null : Math.round((e.exitT - a) / o), e.exit ?? null, "out");
		} else if (!d && ((l.status === "open" || l.status === "closed") && p(l.entryIdx, l.entry, "in"), l.status === "closed" && l.exitT != null && p(Math.round((l.exitT - a) / o), l.exit, "out"), l.status === "pending" && l.plan?.limit != null)) {
			let e = F(c - 1), t = re(l.plan.limit);
			e != null && t != null && (q.globalAlpha = .5 + .4 * Math.sin(i * 3), q.strokeStyle = "#ffe7a8", q.lineWidth = 1.2 * O, q.beginPath(), q.arc(e, t, 6 * O, 0, 6.2832), q.stroke());
		}
		q.restore(), q.globalAlpha = 1;
	}
	let Ue = 0, We = 0, Ge = "";
	function Ke(t) {
		if (i) return;
		Ue = requestAnimationFrame(Ke);
		let n = We ? Math.min(t - We, 250) : 16;
		if (We = t, f && !R() && h === "ready") {
			m += n * p / Xu;
			let e = 0;
			for (; m >= 1 && c < 120 && e++ < 40;) if (--m, ye(), !f) {
				m = 0;
				break;
			}
			c >= 120 && (m = 0);
		}
		if (g && performance.now() - _ > 500 && _e(), He(t), d) {
			let t = e.querySelector("[data-s=\"cd\"]");
			if (t) {
				let e = pe();
				e !== Ge && (Ge = e, t.textContent = e);
			}
		}
	}
	return oe(), V(), H(), ae(), U(), ce(), le(), fe(), Fe(), Be(), Ue = requestAnimationFrame(Ke), {
		update(e) {
			i || (r = {
				...e,
				record: u
			}, V(), H(), ae(), le());
		},
		destroy() {
			_e(), i = !0, cancelAnimationFrame(Ue), Y.disconnect(), je(), k.remove(), e.removeEventListener("click", De), e.removeEventListener("click", Ie), e.removeEventListener("input", Oe), e.removeEventListener("focusin", ke), document.removeEventListener("keydown", Ae), w(), e.style.removeProperty("--rm-season"), ju(e, "room-daily");
		}
	};
}
//#endregion
//#region src/house/rooms/ledger.ts
var Gd = [
	["all", "All"],
	["a", "A grades"],
	["broken", "Broken seals"],
	["notes", "Notes"]
], Kd = /* @__PURE__ */ new Set(["STOP_HONORED"]), qd = {
	EXCELLENT: "Excellent",
	STOP_HONORED: "Stop Honored",
	SNIPER: "Sniper",
	IRON_WILL: "Iron Will",
	HUMILIATION: "Humiliation",
	TILT: "Tilt",
	WIDENED: "Widened"
}, Jd = /* @__PURE__ */ new Set([
	"HUMILIATION",
	"TILT",
	"WIDENED"
]), Yd = (e) => {
	let t = e == null ? 0 : Math.max(0, Math.min(100, e));
	return `<svg class="rl-dial-svg" viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <linearGradient id="rl-dg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e3b0"/><stop offset=".5" stop-color="#c9a45e"/><stop offset="1" stop-color="#7d5f2c"/></linearGradient>
      <filter id="rl-dglow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <circle cx="100" cy="100" r="95" fill="none" stroke="url(#rl-dg)" stroke-width="4"/>
    <circle cx="100" cy="100" r="89" fill="none" stroke="#06070b" stroke-width="2"/>
    <circle cx="100" cy="100" r="76" fill="none" stroke="url(#rl-dg)" stroke-width="15" pathLength="100" stroke-dasharray=".85 .15" transform="rotate(-90 100 100)"/>
    <circle cx="100" cy="100" r="76" fill="none" stroke="#071018" stroke-width="9.5" pathLength="100" transform="rotate(-90 100 100)" opacity=".92"/>
    ${t > 0 ? `<circle cx="100" cy="100" r="76" fill="none" stroke="#3fd3c8" stroke-width="9.5" stroke-linecap="butt" pathLength="100" stroke-dasharray="${t} 100" transform="rotate(-90 100 100)" filter="url(#rl-dglow)"/>` : ""}
    <circle cx="100" cy="100" r="64" fill="none" stroke="url(#rl-dg)" stroke-width="2"/>
    <circle cx="100" cy="100" r="60" fill="rgba(6,9,15,.9)" stroke="#9c7a3e" stroke-width=".8"/>
  </svg>`;
}, Xd = (e) => {
	let t = Math.max(...e.spread.map((e) => e.count), 0), n = t <= 5 ? 1 : t <= 10 ? 2 : 5, r = Math.max(n * 3, Math.ceil(t / n) * n), i = [];
	for (let e = r; e >= 0; e -= n) i.push(e);
	return `<div class="gs-plot">
    <div class="gs-axis">${i.map((e) => `<span style="bottom:${e / r * 100}%">${e}</span>`).join("")}</div>
    <div class="gs-grid">${i.map((e) => `<i style="bottom:${e / r * 100}%"></i>`).join("")}
      <div class="gs-bars">${e.spread.map((e) => `<div class="gs-col g-${e.grade}" style="--h:${e.count / r * 100}%">
          <b class="gs-n">${e.count}</b><span class="gs-bar"></span>
        </div>`).join("")}</div>
    </div>
    <div class="gs-labels">${e.spread.map((e) => `<div class="gs-lab g-${e.grade}"><b>${e.grade}</b><small>${e.pct}%</small></div>`).join("")}</div>
  </div>`;
}, Zd = (e) => {
	let t = e.mirror, n = Math.max(...t.bars.map((e) => e.value), 0), r = n <= 4 ? 1 : n <= 8 ? 2 : n <= 20 ? 4 : 10, i = Math.max(r * 2, Math.ceil(n / r) * r), a = [];
	for (let e = i; e >= 0; e -= r) a.push(e);
	return `<div class="mb-title">${Z(t.chartTitle)}</div>
  <div class="mb-plot">
    <div class="mb-axis">${a.map((e) => `<span style="bottom:${e / i * 100}%">${e}</span>`).join("")}</div>
    <div class="mb-grid">${a.map((e) => `<i style="bottom:${e / i * 100}%"></i>`).join("")}
      <div class="mb-bars" style="--n:${t.bars.length}">${t.bars.map((e) => `<div class="mb-col${e.worst ? " worst" : ""}${e.value === 0 ? " nil" : ""}" style="--h:${e.value / i * 100}%"><span class="mb-bar"></span></div>`).join("")}</div>
    </div>
    <div class="mb-labels" style="--n:${t.bars.length}">${t.bars.map((e) => `<span class="${e.worst ? "worst" : ""}">${Z(e.label)}</span>`).join("")}</div>
  </div>`;
}, Qd = (e) => `<span class="coin ${Kd.has(e) ? "gold" : Jd.has(e) ? "bronze" : "silver"}" title="${Z(qd[e] ?? e)}">${qd[e] ? sc(e) : ec[e] ?? ""}</span>`, $d = (e) => {
	let t = e.coin.startsWith("xyz:") ? "foundry" : "coins", n = e.r, r = [...e.medals].sort((e, t) => Number(Jd.has(e)) - Number(Jd.has(t))).slice(0, 3);
	return `<button class="jc g-${e.grade}${e.broken ? " broken" : ""}" data-id="${Z(e.id)}" type="button">
    <span class="jc-med">${Zs(e.coin, t)}</span>
    <span class="jc-id"><b>${Z(e.name)}</b><small>${Z(e.ticker)}-PERP</small>
      <em class="jc-r ${n == null ? "" : n >= 0 ? "up" : "dn"}">${Eu(n)}</em></span>
    <span class="jc-side"><i class="pill ${e.side}">${e.side === "long" ? "LONG" : "SHORT"}</i><span class="gbox">${e.grade}</span></span>
    <span class="jc-coins">${r.map(Qd).join("")}</span>
    <span class="jc-note"><q>${Z(e.note)}</q></span>
    <span class="jc-date">${ku(e.closedAt)}</span>
    <span class="seal${e.broken ? " cracked" : ""}" aria-hidden="true"></span>
  </button>`;
};
function ef(e, t, n) {
	Au(e, "room-ledger");
	let r = t, i = "all", a = !0, o = 0, s = 0;
	e.innerHTML = `
    <div class="rl-grid">
      ${Q("rl-score", `<h3 class="rp-title">${Mu}<span>DISCIPLINE SCORE</span></h3><div class="rl-score-body" data-s="score"></div>`)}
      ${Q("rl-spread", `<h3 class="rp-title">${Mu}<span>GRADE SPREAD <em>&mdash;</em> LAST 30 TRADES</span></h3><div data-s="spread"></div>`)}
      <div class="rl-tiles" data-s="tiles"></div>
      ${Q("rl-mirror", `<h3 class="rp-title">${Mu}<span>THE MIRROR</span></h3>
        <div class="rl-mirror-body">
          <div class="mi-ora"><div class="mi-orb" data-s="orb"></div><p class="mi-quote" data-s="quote"></p></div>
          <div class="mi-mid"><small class="mi-who">ORA</small><div class="mi-line" data-s="line"></div><div data-s="mbars"></div></div>
          <div class="mi-eq"><div class="eq-head"><span class="eq-t">PAPER EQUITY CURVE</span><span class="eq-n" data-s="eqn"></span></div><div class="eq-plot"><canvas data-s="eqc"></canvas></div></div>
        </div>`)}
      ${Q("rl-journal", "<div class=\"jr-head\"><h3 class=\"rp-title jr-title\"><span>JOURNAL</span></h3><div class=\"jr-tabs\" data-s=\"tabs\" role=\"tablist\"></div>\n        <button class=\"jr-sort\" data-s=\"sort\" type=\"button\"></button></div><div class=\"jr-list\" data-s=\"list\"></div>")}
    </div>`;
	let c = (t) => e.querySelector(`[data-s="${t}"]`), l = mc(c("orb")), u = lc(e), d = () => {
		let e = r.journal;
		return i === "a" ? e = e.filter((e) => e.grade === "A") : i === "broken" ? e = e.filter((e) => e.broken) : i === "notes" && (e = e.filter((e) => e.note.length > 0)), a ? e : [...e].reverse();
	};
	function f() {
		let e = r.score, t = r.delta;
		c("score").innerHTML = `
      <div class="rl-dial"><div class="rl-dial-art">${Yd(e)}<div class="rl-dial-n"><b>${e ?? "&mdash;"}</b><small>of 100</small></div></div></div>
      <div class="rank-side">
        <div class="rank-row"><span class="rank-ico">${ic.compass}</span><span class="rank-name">${Z(r.rank.name)}<small>${r.rank.numeral}</small></span></div>
        <div class="delta ${t == null ? "" : t >= 0 ? "up" : "dn"}"><span class="d-arr">${t != null && t < 0 ? ic.loss : ic.win}</span>
          <span class="d-n">${t == null ? "&mdash;" : Du(t)}</span><small>from last week</small></div>
        <p class="motto">CONSISTENCY<br>CREATES<br>FREEDOM</p>
      </div>`;
	}
	function p() {
		let e = r.tiles;
		c("tiles").innerHTML = [
			[
				"stops",
				"STOPS HONORED",
				e.stopsHonoredPct == null ? "—" : `${e.stopsHonoredPct}%`,
				"up",
				ic.stops
			],
			[
				"win",
				"AVERAGE WIN",
				e.avgWinR == null ? "—" : Eu(e.avgWinR),
				"up",
				ic.win
			],
			[
				"loss",
				"AVERAGE LOSS",
				e.avgLossR == null ? "—" : Eu(e.avgLossR),
				"dn",
				ic.loss
			],
			[
				"oath",
				"OATH BREAKS<br>THIS WEEK",
				String(e.oathBreaksWeek),
				e.oathBreaksWeek > 0 ? "dn" : "up",
				ic.chain
			]
		].map(([e, t, n, r, i]) => `<div class="rp stat ${r} st-${e}"><span class="st-ico">${i}</span><span class="st-txt"><small>${t}</small><b>${n}</b></span></div>`).join("");
	}
	function m() {
		let e = c("eqc"), t = e.parentElement, n = t.clientWidth, i = t.clientHeight;
		if (!n || !i) return;
		let a = Math.min(devicePixelRatio || 1, 2);
		e.width = Math.round(n * a), e.height = Math.round(i * a), e.style.width = `${n}px`, e.style.height = `${i}px`;
		let o = e.getContext("2d");
		if (!o) return;
		o.setTransform(a, 0, 0, a, 0, 0), o.clearRect(0, 0, n, i);
		let s = r.equity.points, l = n - 46 - 8, u = i - 8 - 22;
		o.font = "500 11px \"Barlow Condensed\", sans-serif", o.fillStyle = "rgba(185,174,151,.8)", o.strokeStyle = "rgba(212,176,106,.13)", o.lineWidth = 1;
		let d = Infinity, f = -Infinity;
		for (let e of s) d = Math.min(d, e.v), f = Math.max(f, e.v);
		s.length || (d = r.equity.now * .98, f = r.equity.now * 1.02);
		let p = Math.max((f - d) * .12, r.equity.now * .004, 1);
		d -= p, f += p;
		let m = (f - d) / 4, h = 10 ** Math.floor(Math.log10(m)), g = [
			1,
			2,
			2.5,
			5,
			10
		].map((e) => e * h).find((e) => e >= m) ?? m, _ = (e) => 8 + u - (e - d) / (f - d) * u;
		o.textAlign = "right", o.textBaseline = "middle";
		for (let e = Math.ceil(d / g) * g; e <= f; e += g) o.beginPath(), o.moveTo(46, _(e)), o.lineTo(n - 8, _(e)), o.stroke(), o.fillText(g >= 1e3 ? `${+(e / 1e3).toFixed(1)}K` : Ou(e), 39, _(e));
		if (s.length < 2) {
			o.setLineDash([4, 5]), o.strokeStyle = "rgba(63,211,200,.55)", o.lineWidth = 1.5, o.beginPath(), o.moveTo(46, _(r.equity.now)), o.lineTo(n - 8, _(r.equity.now)), o.stroke(), o.setLineDash([]);
			return;
		}
		let v = s[0].t, y = s[s.length - 1].t, b = (e) => 46 + (y === v ? 0 : (e - v) / (y - v) * l);
		o.textAlign = "center", o.textBaseline = "alphabetic";
		let x = y - v, S = [];
		if (x > 648e7) {
			let e = new Date(v);
			e.setDate(1), e.setHours(0, 0, 0, 0);
			for (let t = new Date(e); t.getTime() <= y; t.setMonth(t.getMonth() + 1)) t.getTime() >= v && S.push([t.getTime(), t.toLocaleDateString("en-US", { month: "short" }).toUpperCase()]);
		} else for (let e = 0; e <= 5; e++) {
			let t = v + x * e / 5;
			S.push([t, new Date(t).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric"
			}).toUpperCase()]);
		}
		let C = Math.ceil(S.length / 8);
		S.forEach(([e, t], r) => {
			r % C === 0 && o.fillText(t, Math.min(n - 14, Math.max(56, b(e))), i - 6);
		});
		let w = o.createLinearGradient(0, 8, 0, 8 + u);
		w.addColorStop(0, "rgba(63,211,200,.30)"), w.addColorStop(1, "rgba(63,211,200,0)"), o.beginPath(), s.forEach((e, t) => t ? o.lineTo(b(e.t), _(e.v)) : o.moveTo(b(e.t), _(e.v))), o.lineTo(b(y), 8 + u), o.lineTo(b(v), 8 + u), o.closePath(), o.fillStyle = w, o.fill(), o.beginPath(), s.forEach((e, t) => t ? o.lineTo(b(e.t), _(e.v)) : o.moveTo(b(e.t), _(e.v))), o.strokeStyle = "#3fd3c8", o.lineWidth = 1.6, o.lineJoin = "round", o.shadowColor = "rgba(63,211,200,.6)", o.shadowBlur = 6, o.stroke(), o.shadowBlur = 0;
		let T = s[s.length - 1];
		o.beginPath(), o.arc(b(T.t), _(T.v), 3, 0, Math.PI * 2), o.fillStyle = "#eafffd", o.fill();
	}
	function h() {
		let e = r.mirror;
		c("quote").innerHTML = e.kind === "habit" ? `&ldquo;${Z(e.coaching)}&rdquo;` : Z(e.coaching), c("line").textContent = e.line, c("line").dataset.kind = e.kind, c("mbars").innerHTML = Zd(r);
		let t = r.equity;
		c("eqn").innerHTML = `<b>${Ou(t.now)}</b> USDC paper${t.seasonPct == null ? "" : `, <span class="${t.seasonPct >= 0 ? "up" : "dn"}">${Du(t.seasonPct, 1)}%</span> this season`}`, cancelAnimationFrame(s), s = requestAnimationFrame(m);
	}
	function g(e) {
		c("tabs").innerHTML = Gd.map(([e, t]) => `<button class="${i === e ? "on" : ""}" data-tab="${e}" role="tab" type="button">${t}</button>`).join(""), c("sort").innerHTML = `${a ? "Newest first" : "Oldest first"}<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5L6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`;
		let t = c("list"), n = d();
		t.innerHTML = n.length ? n.map($d).join("") : `<div class="jr-empty">${[
			0,
			1,
			2,
			3,
			4
		].map(() => "<i class=\"ghost\"></i>").join("")}<p>${r.journal.length ? "Nothing under this seal." : "No sealed trades yet."}</p></div>`, t.scrollLeft = e ? o : 0;
	}
	let _ = (e) => {
		let t = e.target, r = t.closest("[data-tab]");
		if (r) {
			i = r.dataset.tab, g(!1);
			return;
		}
		if (t.closest("[data-s=\"sort\"]")) {
			a = !a, g(!1);
			return;
		}
		let o = t.closest(".jc");
		o?.dataset.id && n.openDebrief(o.dataset.id);
	};
	e.addEventListener("click", _), c("list").addEventListener("scroll", () => {
		o = c("list").scrollLeft;
	}, { passive: !0 });
	let v = new ResizeObserver(() => {
		cancelAnimationFrame(s), s = requestAnimationFrame(m);
	});
	v.observe(c("eqc").parentElement);
	let y = (e) => {
		f(), p(), c("spread").innerHTML = Xd(r), h(), g(e);
	};
	return y(!1), {
		update(e) {
			r = e, y(!0);
		},
		destroy() {
			cancelAnimationFrame(s), v.disconnect(), l(), u(), e.removeEventListener("click", _), ju(e, "room-ledger");
		}
	};
}
//#endregion
//#region src/house/rooms/trials.ts
var tf = (e) => `<span class="rose ${e}" aria-hidden="true">${ic.compass}</span>`, nf = (e) => {
	let t = e.rank, n = [...e.ladder].reverse().map((e) => `<li class="lad ${e.state}">${tf("")}<span class="lad-n">${e.name.toUpperCase()}</span><span class="lad-r">${e.numeral}</span></li>`).join("");
	return `${t.next ? `<div class="to"><span>To ${Z(t.next.name)}</span><b>${t.score == null ? "&mdash;" : t.score} / ${t.next.at}</b></div><div class="to-bar"><i style="width:${(t.progress * 100).toFixed(1)}%"></i></div>` : `<div class="to"><span>${Z(t.name)}</span><b>${t.score} / 100</b></div><div class="to-bar"><i style="width:100%"></i></div>`}<ol class="lad-list">${n}</ol><p class="lad-note">Rank follows your last 30 trades.<br>It can fall.</p>`;
}, rf = (e) => `
  <article class="plq${e.done ? " sealed" : ""}" data-trial="${e.id}">
    <i class="plq-c tl"></i><i class="plq-c tr"></i><i class="plq-c bl"></i><i class="plq-c br"></i>
    <span class="plq-em">${rc[e.id]}</span>
    <h4>${Z(e.title)}</h4>
    <b class="plq-n">${e.n} / ${e.of}</b>
    <div class="plq-bar" style="--cells:${e.of}">${Array.from({ length: e.of }, (t, n) => `<i class="${n < e.n ? "f" : ""}"></i>`).join("")}</div>
    ${e.done ? "<span class=\"plq-seal\">SEALED</span>" : ""}
  </article>`, af = [
	9.7,
	24.4,
	36.8,
	49.2,
	61.1,
	73.1
], of = (e) => {
	let t = e.season.weeks.map((e, t) => `
    <div class="shr ${e.state}" style="left:${af[t]}%">
      <span class="shr-dot">${e.state === "done" ? nc : e.state === "locked" ? tc : "<i></i>"}</span>
      <small>WEEK ${e.n}</small><b>${Z(e.name)}</b>
    </div>`).join(""), n = Math.max(7, Math.min(e.streak, 10));
	return `<div class="road">
      <div class="road-shade"></div>
      ${t}
      <button class="rcpt" type="button" data-act="receipt"><b>Season receipt</b></button>
    </div>
    <div class="streak"><span class="st-fl">${ic.flame}</span><b>STREAK</b><i class="st-bar"></i>
      <span class="st-txt">${e.streak} ${e.streak === 1 ? "trade" : "trades"}, every seal kept</span>
      <span class="st-flames">${Array.from({ length: n }, (t, n) => `<em class="${n < e.streak ? "lit" : ""}">${ic.flame}</em>`).join("")}</span></div>`;
}, sf = (e) => e.medals.map((e) => {
	if (!e.key) return e.art ? `<div class="mdl locked sil" title="${Z(e.name)}"><span class="mdl-c">${sc(e.art)}<span class="lockg">${tc}</span></span><small>${Z(e.name)}</small></div>` : `<div class="mdl locked"><span class="mdl-c"><span class="lockg">${tc}</span></span></div>`;
	let t = e.count > 0;
	return `<div class="mdl ${t ? `earned ${e.tone}` : "locked"}" title="${Z(e.name)}"><span class="mdl-c">${sc(e.key)}${t ? `<em>&times;${e.count}</em>` : `<span class="lockg">${tc}</span>`}</span><small>${Z(e.name)}</small></div>`;
}).join(""), cf = (e, t, n, r, i) => `<div class="lt ${e}"><span class="lt-i">${t}</span><span class="lt-l">${n}</span><b class="${i}">${r}</b></div>`;
function lf(e, t, n = {}) {
	Au(e, "room-trials"), e.style.setProperty("--rm-hall", `url('${Gs("hall.webp")}')`);
	let r = t;
	e.innerHTML = `
    <div class="rt-grid">
      <div class="rt-left">
        ${Q("rt-ladder", `<h3 class="rp-title">${Mu}<span>THE RANK LADDER</span></h3><div data-s="ladder"></div>`)}
        ${Q("rt-level", `<h3 class="rp-title">${Mu}<span>LEVEL</span></h3><div class="lvl-body" data-s="level"></div>`)}
      </div>
      <div class="rt-mid">
        ${Q("rt-trials", `<h3 class="rp-title rt-trials-t">${Mu}<span>THIS WEEK&rsquo;S TRIALS</span><em>Complete trials. Build discipline. Earn the season receipt.</em></h3>
          <div class="trials-body"><div class="plaques" data-s="plaques"></div><div class="chest" data-s="chest"></div></div>`)}
        ${Q("rt-season", `<h3 class="rp-title rt-season-t">${Mu}<span>THE SEASON</span><b data-s="sname"></b><em>A longer road builds a stronger you.</em></h3><div class="season-body" data-s="season"></div>`)}
      </div>
      <div class="rt-right">
        ${Q("rt-medals", `<h3 class="rp-title">${Mu}<span>THE MEDAL CABINET</span></h3><div class="cabinet" data-s="medals"></div>`)}
        ${Q("rt-daily", `<h3 class="rp-title rp-small"><span class="ti">${ic.bars}</span><span>DAILY CHART</span></h3><button class="daily" type="button" data-act="daily"><span class="parch"><i class="dl-c">${ic.compass}</i><q data-s="daily"></q></span></button>`)}
        ${Q("rt-ora", "<div class=\"ora-row\"><div class=\"ora-orb\" data-s=\"orb\"></div><div class=\"ora-say\"><small>ORA</small><q data-s=\"ora\"></q></div></div>")}
      </div>
    </div>`;
	let i = (t) => e.querySelector(`[data-s="${t}"]`), a = mc(i("orb"));
	e.style.setProperty("--rm-season", `url('${Gs("season.webp")}')`);
	let o = lc(e, (e) => ac(e === "ready" ? "glowing" : e));
	function s() {
		i("ladder").innerHTML = nf(r);
		let e = r.level, t = e && e.nextXp > e.floorXp ? Math.min(100, Math.max(0, (e.totalXp - e.floorXp) / (e.nextXp - e.floorXp) * 100)) : 0;
		i("level").innerHTML = `
      <div class="lvl-med"><span class="lvl-ring"><b>${e ? e.level : "&mdash;"}</b></span></div>
      <div class="lvl-side"><p class="lvl-note">Level never falls.</p>
        ${e ? `<div class="lvl-bar" title="${Ou(e.totalXp)} / ${Ou(e.nextXp)} Light"><i style="width:${t.toFixed(1)}%"></i></div>` : ""}
        <h5>LIGHT TODAY</h5>
        ${cf("steps", ic.steps, "Steps", r.light.steps == null ? "—" : Du(r.light.steps), r.light.steps == null ? "nil" : "up")}
        ${cf("trading", ic.bars, "Trading", Du(r.light.trading), r.light.trading < 0 ? "dn" : r.light.trading === 0 ? "nil" : "up")}
      </div>`, i("plaques").innerHTML = r.plaques.map(rf).join(""), i("chest").dataset.state = r.chest, i("chest").innerHTML = `<h5>REWARDS CHEST</h5><button type="button" class="chest-art" data-act="chest">${cc(r.chest === "glowing" ? "ready" : r.chest)}</button>
      <p>${r.chest === "closed" ? "Complete all weekly trials<br>to earn your reward." : r.chest === "glowing" ? "Every trial is sealed." : "Reward taken."}</p>`, i("sname").textContent = `${r.season.name}, week ${r.season.week} of 6`, i("season").innerHTML = of(r), i("medals").innerHTML = sf(r), i("daily").textContent = r.daily.state === "sealed" ? `Sealed today: ${r.daily.grade}.` : "Today’s chart is open.", i("ora").textContent = `“${r.ora}”`;
	}
	let c = (e) => {
		let t = e.target.closest("[data-act]");
		t && (t.dataset.act === "receipt" ? n.openReceipt?.() : t.dataset.act === "chest" && r.chest !== "closed" ? n.openChest?.() : t.dataset.act === "daily" && n.openDaily?.());
	};
	return e.addEventListener("click", c), s(), {
		update(e) {
			r = e, s();
		},
		destroy() {
			a(), o(), e.style.removeProperty("--rm-season"), e.removeEventListener("click", c), e.style.removeProperty("--rm-hall"), ju(e, "room-trials");
		}
	};
}
//#endregion
//#region src/house/rooms/rooms.css?inline
var uf = ".house-root .room{--rg:#d4b06a;--rgh:#f1dcaa;--rgl:#9c7a3e;--rc:#3fd3c8;--re:#e2875a;--ro:#9fdcff;--ink:#efe6d2;--ink2:#b9ae97;--ink3:#7d7563;--pn:#080b12f0;--u:min(calc(100cqw / 1920), calc(100cqh / 1080));font:400 calc(15 * var(--u)) / 1.3 \"Barlow\", system-ui, sans-serif;color:var(--ink);position:absolute;inset:0;overflow:hidden;container-type:size}.house-root .room *,.house-root .room :before,.house-root .room :after{box-sizing:border-box}.house-root .room button{font:inherit;color:inherit;cursor:pointer;background:0 0;border:0;padding:0}.house-root .room h3,.house-root .room h4,.house-root .room h5,.house-root .room p{margin:0;font-weight:400}.house-root .room svg{display:block}.house-root .room .up{color:var(--rc)}.house-root .room .dn{color:var(--re)}.house-root .room .nil{color:var(--ink3)}.house-root .room .rl-grid,.house-root .room .rt-grid{width:calc(1920 * var(--u));height:calc(1080 * var(--u));position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}.house-root .room .rl-grid>*,.house-root .room .rt-left>*,.house-root .room .rt-mid>*,.house-root .room .rt-right>*{position:absolute}.house-root .room .rp{border-radius:calc(4 * var(--u));box-shadow:0 0 0 1px #000000b3, 0 calc(16 * var(--u)) calc(36 * var(--u)) #0009, inset 0 1px 0 #f1dcaa1f, inset 0 0 calc(50 * var(--u)) #3f78be0f;background:radial-gradient(80% 60% at 50% 0,#3c6eaa21,#0000 70%),linear-gradient(#0b111df2,#060910f5);border:1px solid #d4b06a8c;position:absolute}.house-root .room .rp:before{content:\"\";inset:calc(5 * var(--u));border-radius:calc(2 * var(--u));pointer-events:none;border:1px solid #d4b06a29;position:absolute}.house-root .room .rp:after{content:\"\";inset:calc(-12 * var(--u));pointer-events:none;z-index:2;border:calc(44 * var(--u)) solid transparent;border-image:var(--rm-frame) 118 / calc(44 * var(--u)) stretch;filter:drop-shadow(0 calc(2 * var(--u)) calc(6 * var(--u)) #0009);position:absolute}.house-root .room .rp.lite:after,.house-root .room .stat:after{inset:calc(-8 * var(--u));border-width:calc(28 * var(--u));border-image-width:calc(28 * var(--u))}.house-root .room .rp-title{white-space:nowrap;justify-content:center;align-items:center;gap:calc(12 * var(--u));font:600 calc(23 * var(--u)) / 1 \"Cinzel\", Georgia, serif;letter-spacing:.14em;color:var(--rg);text-shadow:0 0 calc(14 * var(--u)) #d4b06a47, 0 1px 0 #000;padding:calc(17 * var(--u)) calc(20 * var(--u)) calc(11 * var(--u));display:flex;position:relative}.house-root .room .rp-title em{color:var(--ink2);letter-spacing:0;margin:0 .2em;font-style:normal}.house-root .room .rp-star{width:calc(20 * var(--u));height:calc(20 * var(--u));color:var(--rgh);filter:drop-shadow(0 0 calc(6 * var(--u)) #f1dcaab3);flex:none}.house-root .room-ledger .rl-score{left:calc(210 * var(--u));top:calc(226 * var(--u));width:calc(454 * var(--u));height:calc(284 * var(--u))}.house-root .room-ledger .rl-spread{left:calc(698 * var(--u));top:calc(226 * var(--u));width:calc(560 * var(--u));height:calc(284 * var(--u))}.house-root .room-ledger .rl-tiles{left:calc(1292 * var(--u));top:calc(226 * var(--u));width:calc(495 * var(--u));height:calc(284 * var(--u));gap:calc(22 * var(--u));grid-template:1fr 1fr/1fr 1fr;display:grid}.house-root .room-ledger .rl-mirror{left:calc(165 * var(--u));top:calc(548 * var(--u));width:calc(1600 * var(--u));height:calc(262 * var(--u))}.house-root .room-ledger .rl-journal{left:calc(76 * var(--u));top:calc(842 * var(--u));width:calc(1766 * var(--u));height:calc(224 * var(--u))}.house-root .room-ledger .rl-score-body{align-items:center;gap:calc(16 * var(--u));padding:calc(4 * var(--u)) calc(22 * var(--u)) 0 calc(24 * var(--u));height:calc(222 * var(--u));display:flex}.house-root .room-ledger .rl-dial{width:calc(200 * var(--u));height:calc(200 * var(--u));flex:none}.house-root .room-ledger .rl-dial-art{width:100%;height:100%;filter:drop-shadow(0 0 calc(10 * var(--u)) #3fd3c833);position:relative}.house-root .room-ledger .rl-dial-svg{width:100%;height:100%}.house-root .room-ledger .rl-dial-n{text-align:center;place-content:center;display:grid;position:absolute;inset:0}.house-root .room-ledger .rl-dial-n b{font:600 calc(78 * var(--u)) / .95 \"Cinzel\", serif;color:var(--rgh);text-shadow:0 0 calc(18 * var(--u)) #f1dcaa59}.house-root .room-ledger .rl-dial-n small{font:500 calc(21 * var(--u)) / 1 \"Cinzel\", serif;color:var(--ink2);margin-top:calc(2 * var(--u));letter-spacing:.06em}.house-root .room-ledger .rank-side{flex:1;min-width:0}.house-root .room-ledger .rank-row{align-items:center;gap:calc(12 * var(--u));padding-bottom:calc(14 * var(--u));border-bottom:1px solid #d4b06a47;display:flex}.house-root .room-ledger .rank-ico{width:calc(50 * var(--u));height:calc(50 * var(--u));color:var(--rg);border:1px solid var(--rg);box-shadow:0 0 calc(12 * var(--u)) #d4b06a40;background:radial-gradient(circle,#3f78be4d,#060910e6 70%);border-radius:50%;flex:none;place-items:center;display:grid}.house-root .room-ledger .rank-ico svg{width:70%;height:70%}.house-root .room-ledger .rank-name{font:600 calc(30 * var(--u)) / 1 \"Cinzel\", serif;color:var(--rgh);letter-spacing:.03em;gap:calc(4 * var(--u));display:grid}.house-root .room-ledger .rank-name small{font-size:calc(15 * var(--u));color:var(--ink2);letter-spacing:.24em}.house-root .room-ledger .delta{column-gap:calc(12 * var(--u));padding:calc(14 * var(--u)) 0 calc(12 * var(--u));border-bottom:1px solid #d4b06a47;grid-template-columns:auto 1fr;align-items:center;display:grid}.house-root .room-ledger .delta .d-arr{width:calc(36 * var(--u));height:calc(36 * var(--u));grid-row:span 2}.house-root .room-ledger .delta .d-arr svg{width:100%;height:100%;filter:drop-shadow(0 0 calc(6 * var(--u)) currentColor)}.house-root .room-ledger .delta .d-n{font:600 calc(36 * var(--u)) / 1 \"Barlow Condensed\", sans-serif;letter-spacing:.02em}.house-root .room-ledger .delta small{font:500 calc(15 * var(--u)) / 1.1 \"Barlow\", sans-serif;color:var(--ink2)}.house-root .room-ledger .motto{margin-top:calc(8 * var(--u));text-align:center;font:500 calc(13 * var(--u)) / 1.5 \"Cinzel\", serif;letter-spacing:.26em;color:var(--ink3)}.house-root .room-ledger .rl-spread>div{height:calc(218 * var(--u));padding:0 calc(30 * var(--u)) 0 calc(24 * var(--u))}.house-root .room-ledger .gs-plot{height:100%;position:relative}.house-root .room-ledger .gs-axis{left:0;top:calc(30 * var(--u));bottom:calc(58 * var(--u));width:calc(28 * var(--u));font:500 calc(15 * var(--u)) \"Barlow Condensed\", sans-serif;color:var(--ink2);position:absolute}.house-root .room-ledger .gs-axis span{right:calc(8 * var(--u));position:absolute;transform:translateY(50%)}.house-root .room-ledger .gs-grid{left:calc(32 * var(--u));right:0;top:calc(30 * var(--u));bottom:calc(58 * var(--u));border-bottom:1px solid #d4b06a80;border-left:1px solid #d4b06a80;position:absolute}.house-root .room-ledger .gs-grid>i{background:#d4b06a1a;height:1px;position:absolute;left:0;right:0}.house-root .room-ledger .gs-bars{padding:0 calc(10 * var(--u));gap:calc(26 * var(--u));grid-template-columns:repeat(5,1fr);display:grid;position:absolute;inset:0}.house-root .room-ledger .gs-col{height:100%;position:relative}.house-root .room-ledger .gs-bar{height:var(--h);min-height:2px;box-shadow:inset 0 1px 0 #fff4cdbf, inset 0 -2px 6px #00000059, 0 0 calc(14 * var(--u)) #d4b06a2e;background-blend-mode:normal;background:linear-gradient(90deg,#8a6a32,#ecd49a 38%,#cfa95f 62%,#7b5d2b);border-top-left-radius:1px;position:absolute;bottom:0;left:4%;right:4%}.house-root .room-ledger .gs-col.g-D .gs-bar,.house-root .room-ledger .gs-col.g-F .gs-bar{box-shadow:inset 0 1px 0 #ffdec899, inset 0 -2px 6px #00000059, 0 0 calc(14 * var(--u)) #e2875a2e;background:linear-gradient(90deg,#7a3a20,#f0a27a 40%,#d2723f 62%,#6a3119)}.house-root .room-ledger .gs-n{left:0;right:0;bottom:calc(var(--h) + 4 * var(--u));text-align:center;font:600 calc(23 * var(--u)) / 1 \"Barlow Condensed\", sans-serif;color:var(--ink);position:absolute}.house-root .room-ledger .gs-labels{left:calc(32 * var(--u));height:calc(50 * var(--u));padding:calc(6 * var(--u)) calc(10 * var(--u)) 0;gap:calc(26 * var(--u));text-align:center;grid-template-columns:repeat(5,1fr);display:grid;position:absolute;bottom:0;right:0}.house-root .room-ledger .gs-lab b{font:600 calc(24 * var(--u)) / 1 \"Cinzel\", serif;color:var(--ink);display:block}.house-root .room-ledger .gs-lab small{font:500 calc(17 * var(--u)) / 1.2 \"Barlow Condensed\", sans-serif;color:var(--ink2);letter-spacing:.04em}.house-root .room-ledger .gs-lab.g-D b,.house-root .room-ledger .gs-lab.g-F b{color:var(--re)}.house-root .room-ledger .stat{align-items:center;gap:calc(14 * var(--u));padding:0 calc(16 * var(--u));display:flex;position:relative}.house-root .room-ledger .stat>*{z-index:1;position:relative}.house-root .room-ledger .st-ico{width:calc(58 * var(--u));height:calc(58 * var(--u));box-shadow:0 0 calc(14 * var(--u)) currentColor;background:radial-gradient(circle,#3f78be38,#060910d9 72%);border:1.5px solid;border-radius:50%;flex:none;place-items:center;display:grid}.house-root .room-ledger .st-ico svg{width:60%;height:60%}.house-root .room-ledger .stat.up .st-ico{color:var(--rc)}.house-root .room-ledger .stat.dn .st-ico{color:var(--re)}.house-root .room-ledger .st-stops .st-ico{color:var(--rg);box-shadow:0 0 calc(14 * var(--u)) #d4b06a73}.house-root .room-ledger .st-txt{gap:calc(3 * var(--u));min-width:0;display:grid}.house-root .room-ledger .st-txt small{font:500 calc(14 * var(--u)) / 1.2 \"Barlow\", sans-serif;letter-spacing:.13em;color:var(--ink2)}.house-root .room-ledger .st-txt b{font:600 calc(44 * var(--u)) / 1 \"Barlow Condensed\", sans-serif;letter-spacing:.02em}.house-root .room-ledger .stat.up .st-txt b{color:var(--rc);text-shadow:0 0 calc(14 * var(--u)) #3fd3c873}.house-root .room-ledger .stat.dn .st-txt b{color:var(--re);text-shadow:0 0 calc(14 * var(--u)) #e2875a66}.house-root .room-ledger .rl-mirror .rp-title{left:calc(354 * var(--u));z-index:1;font-size:calc(26 * var(--u));padding-left:0;position:absolute;top:0}.house-root .room-ledger .rl-mirror .rp-title .rp-star{display:none}.house-root .room-ledger .rl-mirror-body{grid-template-columns:calc(318 * var(--u)) calc(770 * var(--u)) 1fr;display:grid;position:absolute;inset:0}.house-root .room-ledger .mi-ora{padding:calc(10 * var(--u)) calc(12 * var(--u)) 0 calc(20 * var(--u));flex-direction:column;align-items:center;display:flex}.house-root .room-ledger .mi-orb{width:calc(250 * var(--u));height:calc(156 * var(--u));position:relative}.house-root .room-ledger .mi-quote{font:italic 500 calc(19 * var(--u)) / 1.25 \"Cormorant Garamond\", Georgia, serif;color:var(--ro);text-align:center;margin-top:calc(6 * var(--u));text-shadow:0 0 calc(12 * var(--u)) #9fdcff59}.house-root .room-ledger .mi-mid{padding:calc(46 * var(--u)) calc(10 * var(--u)) calc(14 * var(--u)) calc(34 * var(--u));border-right:1px solid #d4b06a00;min-width:0}.house-root .room-ledger .mi-who{font:500 calc(14 * var(--u)) \"Cinzel\", serif;letter-spacing:.3em;color:var(--ink2);margin-bottom:calc(1 * var(--u));display:block}.house-root .room-ledger .mi-line{font:400 calc(40 * var(--u)) / 1.05 \"Marcellus\", \"Cinzel\", serif;color:var(--ink);text-shadow:0 0 calc(20 * var(--u)) #f1dcaa2e;margin-bottom:calc(8 * var(--u));white-space:nowrap}.house-root .room-ledger .mi-line[data-kind=calm],.house-root .room-ledger .mi-line[data-kind=clean]{color:var(--ink2);font-size:calc(34 * var(--u))}.house-root .room-ledger .mb-title{font:500 calc(12.5 * var(--u)) \"Barlow\", sans-serif;letter-spacing:.2em;color:var(--ink2);margin-bottom:calc(4 * var(--u));padding-left:calc(6 * var(--u))}.house-root .room-ledger .mb-plot{height:calc(112 * var(--u));border-radius:calc(3 * var(--u));background:#04080e99;border:1px solid #d4b06a38;padding:0;position:relative}.house-root .room-ledger .mb-axis{left:0;top:calc(8 * var(--u));bottom:calc(22 * var(--u));width:calc(30 * var(--u));font:500 calc(14 * var(--u)) \"Barlow Condensed\", sans-serif;color:var(--ink2);position:absolute}.house-root .room-ledger .mb-axis span{right:calc(8 * var(--u));position:absolute;transform:translateY(50%)}.house-root .room-ledger .mb-grid{left:calc(34 * var(--u));right:calc(10 * var(--u));top:calc(8 * var(--u));bottom:calc(22 * var(--u));border-bottom:1px solid #d4b06a59;border-left:1px solid #d4b06a59;position:absolute}.house-root .room-ledger .mb-grid>i{background:#d4b06a17;height:1px;position:absolute;left:0;right:0}.house-root .room-ledger .mb-bars{grid-template-columns:repeat(var(--n), 1fr);gap:calc(14 * var(--u));padding:0 calc(10 * var(--u));display:grid;position:absolute;inset:0}.house-root .room-ledger .mb-col{height:100%;position:relative}.house-root .room-ledger .mb-bar{height:var(--h);box-shadow:0 0 calc(10 * var(--u)) #46a7e873, inset 0 1px 0 #c8f0ff80;background:linear-gradient(#46a7e8,#1f6aa8);position:absolute;bottom:0;left:12%;right:12%}.house-root .room-ledger .mb-col.nil .mb-bar{opacity:.4;height:2px;box-shadow:none}.house-root .room-ledger .mb-col.worst .mb-bar{box-shadow:0 0 calc(14 * var(--u)) #e2875a99, inset 0 1px 0 #ffe0cd99;background:linear-gradient(#f0a27a,#cf6a3b)}.house-root .room-ledger .mb-labels{left:calc(34 * var(--u));right:calc(10 * var(--u));bottom:calc(3 * var(--u));grid-template-columns:repeat(var(--n), 1fr);gap:calc(14 * var(--u));padding:0 calc(10 * var(--u));text-align:center;font:500 calc(13 * var(--u)) \"Barlow\", sans-serif;letter-spacing:.12em;color:var(--ink2);display:grid;position:absolute}.house-root .room-ledger .mb-labels .worst{color:var(--re)}.house-root .room-ledger .mi-eq{padding:calc(36 * var(--u)) calc(34 * var(--u)) calc(18 * var(--u)) calc(10 * var(--u));border-left:1px solid #d4b06a00;flex-direction:column;min-width:0;display:flex}.house-root .room-ledger .eq-head{justify-content:space-between;align-items:baseline;gap:calc(12 * var(--u));padding-left:calc(46 * var(--u));display:flex}.house-root .room-ledger .eq-t{font:500 calc(13 * var(--u)) \"Barlow\", sans-serif;letter-spacing:.22em;color:var(--ink2)}.house-root .room-ledger .eq-n{font:500 calc(17 * var(--u)) \"Barlow\", sans-serif;color:var(--ink);white-space:nowrap}.house-root .room-ledger .eq-n b{font:600 calc(20 * var(--u)) \"Barlow Condensed\", sans-serif;letter-spacing:.02em}.house-root .room-ledger .eq-plot{margin-top:calc(8 * var(--u));flex:1;min-height:0;position:relative}.house-root .room-ledger .eq-plot canvas{position:absolute;top:0;left:0}.house-root .room-ledger .jr-head{align-items:center;gap:calc(26 * var(--u));padding:calc(14 * var(--u)) calc(30 * var(--u)) calc(8 * var(--u)) calc(34 * var(--u));display:flex}.house-root .room-ledger .jr-title{font-size:calc(26 * var(--u));letter-spacing:.26em;padding:0}.house-root .room-ledger .jr-tabs{border-radius:calc(5 * var(--u));background:#04080eb3;border:1px solid #d4b06a66;display:flex;overflow:hidden}.house-root .room-ledger .jr-tabs button{padding:calc(8 * var(--u)) calc(30 * var(--u));font:500 calc(17 * var(--u)) \"Barlow\", sans-serif;letter-spacing:.03em;color:var(--ink2);border-left:1px solid #d4b06a38}.house-root .room-ledger .jr-tabs button:first-child{border-left:0}.house-root .room-ledger .jr-tabs button.on{color:var(--ink);box-shadow:inset 0 0 0 1px var(--rc), 0 0 calc(14 * var(--u)) #3fd3c859;background:linear-gradient(#3fd3c838,#3fd3c80f)}.house-root .room-ledger .jr-sort{align-items:center;gap:calc(10 * var(--u));font:500 calc(17 * var(--u)) \"Barlow\", sans-serif;color:var(--ink2);margin-left:auto;display:flex}.house-root .room-ledger .jr-sort svg{width:calc(13 * var(--u));height:calc(13 * var(--u))}.house-root .room-ledger .jr-list{left:calc(26 * var(--u));right:calc(26 * var(--u));bottom:calc(18 * var(--u));top:calc(62 * var(--u));grid-auto-flow:column;grid-auto-columns:calc((100% - 4 * 20 * var(--u)) / 5);gap:calc(20 * var(--u));scroll-snap-type:x proximity;scrollbar-width:thin;scrollbar-color:#d4b06a80 transparent;padding:0 0 calc(2 * var(--u));display:grid;position:absolute;overflow:auto hidden}.house-root .room-ledger .jc{scroll-snap-align:start;text-align:left;border-radius:calc(5 * var(--u));grid-template-columns:calc(76 * var(--u)) 1fr auto;column-gap:calc(12 * var(--u));padding:calc(10 * var(--u)) calc(14 * var(--u)) calc(8 * var(--u));box-shadow:inset 0 0 0 3px #05080ee6, inset 0 0 0 4px #d4b06a29, 0 calc(6 * var(--u)) calc(14 * var(--u)) #00000080;background:linear-gradient(#0e1422f5,#070a12fa);border:1px solid #d4b06a80;grid-template-rows:auto 1fr auto;transition:transform .15s,box-shadow .15s,border-color .15s;display:grid;position:relative;overflow:hidden}.house-root .room-ledger .jc:hover{transform:translateY(calc(-3 * var(--u)));border-color:var(--rgh);box-shadow:inset 0 0 0 3px #05080ee6, inset 0 0 0 4px #d4b06a4d, 0 calc(10 * var(--u)) calc(22 * var(--u)) #0009, 0 0 calc(18 * var(--u)) #d4b06a2e}.house-root .room-ledger .jc:focus-visible{outline:2px solid var(--rc);outline-offset:2px}.house-root .room-ledger .jc-med{width:calc(70 * var(--u));height:calc(70 * var(--u));filter:drop-shadow(0 0 calc(8 * var(--u)) #d4b06a59);border-radius:50%;grid-row:1/3;place-items:center;display:grid}.house-root .room-ledger .jc-med img,.house-root .room-ledger .jc-med svg{object-fit:contain;width:100%;height:100%}.house-root .room-ledger .jc-id{align-content:start;gap:calc(1 * var(--u));min-width:0;padding-top:calc(2 * var(--u));display:grid}.house-root .room-ledger .jc-id b{font:600 calc(21 * var(--u)) / 1.05 \"Marcellus\", \"Cinzel\", serif;color:var(--ink);letter-spacing:.02em;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.house-root .room-ledger .jc-id small{font:500 calc(14 * var(--u)) / 1.2 \"Barlow\", sans-serif;letter-spacing:.08em;color:var(--ink2)}.house-root .room-ledger .jc-r{font:600 calc(36 * var(--u)) / 1 \"Barlow Condensed\", sans-serif;margin-top:calc(3 * var(--u));letter-spacing:.01em;font-style:normal}.house-root .room-ledger .jc-r.up{text-shadow:0 0 calc(14 * var(--u)) #3fd3c866}.house-root .room-ledger .jc-r.dn{text-shadow:0 0 calc(14 * var(--u)) #e2875a66}.house-root .room-ledger .jc-side{padding:calc(2 * var(--u)) 0 calc(4 * var(--u));flex-direction:column;grid-row:1/3;justify-content:space-between;align-items:flex-end;display:flex}.house-root .room-ledger .pill{font:600 calc(13 * var(--u)) \"Barlow\", sans-serif;letter-spacing:.14em;padding:calc(5 * var(--u)) calc(12 * var(--u));border-radius:calc(4 * var(--u));border:1px solid;font-style:normal}.house-root .room-ledger .pill.long{color:var(--rc);background:#3fd3c81a;border-color:#3fd3c8b3}.house-root .room-ledger .pill.short{color:var(--re);background:#e2875a1a;border-color:#e2875ab3}.house-root .room-ledger .gbox{width:calc(50 * var(--u));height:calc(42 * var(--u));font:600 calc(27 * var(--u)) / 1 \"Cinzel\", serif;color:var(--ink);border-radius:calc(4 * var(--u));box-shadow:inset 0 calc(2 * var(--u)) calc(5 * var(--u)) #000000b3, 0 1px 0 #f1dcaa33;background:linear-gradient(#0000008c,#1e180c73);border:1.5px solid #d4b06abf;place-items:center;display:grid}.house-root .room-ledger .jc.g-D .gbox,.house-root .room-ledger .jc.g-F .gbox{color:var(--re);border-color:#e2875acc}.house-root .room-ledger .jc.g-A .gbox{color:var(--rgh);text-shadow:0 0 calc(10 * var(--u)) #f1dcaa80}.house-root .room-ledger .jc-coins{gap:calc(4 * var(--u));margin-left:calc(-2 * var(--u));grid-area:3/1;align-self:end;align-items:center;display:flex}.house-root .room-ledger .coin{width:calc(28 * var(--u));height:calc(28 * var(--u));padding:calc(5 * var(--u));color:#3a2a0e;border-radius:50%;place-items:center;display:grid;box-shadow:inset 0 1px 1px #ffffff8c,inset 0 -2px 3px #00000059,0 1px 3px #000000b3}.house-root .room-ledger .coin.gold{background:radial-gradient(circle at 35% 30%,#f6e3b0,#c9a45e 55%,#7d5f2c)}.house-root .room-ledger .coin.silver{color:#263340;background:radial-gradient(circle at 35% 30%,#f3f7fa,#aab7c2 55%,#5d6b77)}.house-root .room-ledger .coin.bronze{color:#3a1b0b;background:radial-gradient(circle at 35% 30%,#f4b894,#c9764a 55%,#6d3a1f)}.house-root .room-ledger .jc-note{margin-right:calc(18 * var(--u));height:calc(38 * var(--u));padding:0 calc(30 * var(--u)) 0 calc(10 * var(--u));box-shadow:0 2px 4px #00000080, inset 0 0 calc(10 * var(--u)) #785a2859;clip-path:polygon(0 3%,3% 0,97% 4%,100% 0,99% 96%,96% 100%,3% 97%,0 100%);background:linear-gradient(#d8c79c,#c3ad7c);grid-area:3/2/auto/4;align-self:end;align-items:center;display:flex;position:relative;transform:rotate(-1.1deg)}.house-root .room-ledger .jc-note q{quotes:none;font:italic 500 calc(17 * var(--u)) / 1.05 \"Cormorant Garamond\", Georgia, serif;color:#3a2a14;-webkit-line-clamp:2;-webkit-box-orient:vertical;display:-webkit-box;overflow:hidden}.house-root .room-ledger .jc-date{font:500 calc(12.5 * var(--u)) \"Barlow\", sans-serif;letter-spacing:.12em;color:var(--ink3);padding-top:calc(5 * var(--u));grid-area:4/1/auto/3}.house-root .room-ledger .seal{right:calc(10 * var(--u));bottom:calc(8 * var(--u));width:calc(30 * var(--u));height:calc(30 * var(--u));background:radial-gradient(circle at 35% 30%,#d99a6a,#b8673a 55%,#7a4222);border-radius:50%;position:absolute;box-shadow:0 1px 3px #000c,inset 0 -2px 3px #0006,inset 0 1px 1px #ffe0b466}.house-root .room-ledger .seal:after{content:\"\";clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);filter:drop-shadow(0 0 1px #ffe096cc);opacity:.9;background:#e9c473;position:absolute;inset:26%}.house-root .room-ledger .seal:before{content:\"\";border:1px solid #e9c4738c;border-radius:50%;position:absolute;inset:14%}.house-root .room-ledger .seal.cracked{background:radial-gradient(circle at 35% 30%,#9a7a5e,#6a4a35 55%,#3a2a20)}.house-root .room-ledger .seal.cracked:after{opacity:.7;background:#a88c5a}.house-root .room-ledger .seal.cracked:before{content:\"\";background:#0b0d14;border:0;width:2px;margin-left:-1px;position:absolute;inset:-2px auto -2px 50%;transform:rotate(18deg);box-shadow:0 0 2px #000}.house-root .room-ledger .jr-list:has(.jr-empty){display:block;overflow:hidden}.house-root .room-ledger .jr-empty{gap:calc(20 * var(--u));grid-template-columns:repeat(5,1fr);height:100%;display:grid;position:relative}.house-root .room-ledger .jr-empty .ghost{border-radius:calc(5 * var(--u));background:#080b1280;border:1px dashed #d4b06a47}.house-root .room-ledger .jr-empty p{font:italic 500 calc(26 * var(--u)) \"Cormorant Garamond\", Georgia, serif;color:var(--ink2);text-shadow:0 0 calc(12 * var(--u)) #000, 0 0 calc(24 * var(--u)) #000;place-content:center;display:grid;position:absolute;inset:0}.house-root .room-trials .rt-ladder{left:calc(56 * var(--u));top:calc(240 * var(--u));width:calc(348 * var(--u));height:calc(540 * var(--u))}.house-root .room-trials .rt-level{left:calc(56 * var(--u));top:calc(806 * var(--u));width:calc(348 * var(--u));height:calc(244 * var(--u))}.house-root .room-trials .rt-trials{left:calc(422 * var(--u));top:calc(240 * var(--u));width:calc(1054 * var(--u));height:calc(398 * var(--u))}.house-root .room-trials .rt-season{left:calc(422 * var(--u));top:calc(666 * var(--u));width:calc(1054 * var(--u));height:calc(384 * var(--u))}.house-root .room-trials .rt-medals{left:calc(1500 * var(--u));top:calc(240 * var(--u));width:calc(372 * var(--u));height:calc(578 * var(--u))}.house-root .room-trials .rt-daily{left:calc(1500 * var(--u));top:calc(844 * var(--u));width:calc(372 * var(--u));height:calc(112 * var(--u))}.house-root .room-trials .rt-ora{left:calc(1500 * var(--u));top:calc(982 * var(--u));width:calc(372 * var(--u));height:calc(72 * var(--u))}.house-root .room-trials .rp-title{letter-spacing:.11em;padding-left:calc(26 * var(--u));justify-content:flex-start}.house-root .room-trials .rp-small{font-size:calc(17 * var(--u));padding-top:calc(11 * var(--u));padding-bottom:calc(4 * var(--u))}.house-root .room-trials .rp-small .ti{width:calc(22 * var(--u));height:calc(22 * var(--u));color:var(--rg)}.house-root .room-trials .to{padding:0 calc(28 * var(--u));font:500 calc(16 * var(--u)) \"Barlow\", sans-serif;color:var(--ink2);justify-content:space-between;align-items:baseline;display:flex}.house-root .room-trials .to b{font:600 calc(19 * var(--u)) \"Barlow Condensed\", sans-serif;color:var(--ink);letter-spacing:.03em}.house-root .room-trials .to-bar{margin:calc(4 * var(--u)) calc(28 * var(--u)) 0;height:calc(11 * var(--u));background:#03070ce6;border:1px solid #d4b06a73;border-radius:2px;overflow:hidden}.house-root .room-trials .to-bar i{height:100%;box-shadow:0 0 calc(10 * var(--u)) #3fd3c8b3;background:linear-gradient(#6ef0e4,#1fa89e);display:block}.house-root .room-trials .lad-list{margin:calc(12 * var(--u)) calc(24 * var(--u)) 0 calc(28 * var(--u));padding:0 0 0 calc(14 * var(--u));gap:calc(9 * var(--u));list-style:none;display:grid;position:relative}.house-root .room-trials .lad-list:before{content:\"\";left:calc(3 * var(--u));top:calc(6 * var(--u));bottom:calc(6 * var(--u));width:calc(3 * var(--u));box-shadow:0 0 calc(6 * var(--u)) #d4b06a4d;background:linear-gradient(#e8cb8a,#8a6a32,#e8cb8a);border-radius:2px;position:absolute}.house-root .room-trials .lad{align-items:center;gap:calc(14 * var(--u));height:calc(46 * var(--u));padding:0 calc(18 * var(--u)) 0 calc(5 * var(--u));border-radius:calc(5 * var(--u));background:linear-gradient(#141a28f2,#080b12f2);border:1px solid #d4b06a80;display:flex;position:relative;box-shadow:inset 0 0 0 2px #00000080}.house-root .room-trials .lad:before{content:\"\";left:calc(-12 * var(--u));width:calc(12 * var(--u));background:#b99555;height:2px;position:absolute;top:50%}.house-root .room-trials .rose{width:calc(32 * var(--u));height:calc(32 * var(--u));color:var(--rg);border:1px solid var(--rgl);background:radial-gradient(circle,#20304a,#0b1018 75%);border-radius:50%;flex:none;place-items:center;display:grid}.house-root .room-trials .rose svg{width:76%;height:76%}.house-root .room-trials .lad-n{font:500 calc(20 * var(--u)) \"Cinzel\", serif;letter-spacing:.12em;color:var(--ink2);flex:1}.house-root .room-trials .lad-r{font:500 calc(16 * var(--u)) \"Cinzel\", serif;color:var(--ink3);letter-spacing:.08em}.house-root .room-trials .lad.past .lad-n{color:var(--ink)}.house-root .room-trials .lad.current{border-color:var(--rc);box-shadow:inset 0 0 0 2px #0006, 0 0 calc(18 * var(--u)) #3fd3c88c, inset 0 0 calc(18 * var(--u)) #3fd3c833;background:linear-gradient(#1446548c,#081820f2)}.house-root .room-trials .lad.current .lad-n,.house-root .room-trials .lad.current .lad-r{color:var(--rc);text-shadow:0 0 calc(10 * var(--u)) #3fd3c8cc}.house-root .room-trials .lad.current .rose{color:#aaf3ee;border-color:var(--rc);box-shadow:0 0 calc(12 * var(--u)) #3fd3c8cc}.house-root .room-trials .lad.future .rose{opacity:.75}.house-root .room-trials .lad-note{left:0;right:0;bottom:calc(14 * var(--u));text-align:center;font:italic 500 calc(17 * var(--u)) / 1.2 \"Cormorant Garamond\", Georgia, serif;color:var(--ink2);position:absolute}.house-root .room-trials .lvl-body{gap:calc(12 * var(--u));padding:calc(2 * var(--u)) calc(22 * var(--u)) 0 calc(20 * var(--u));display:flex}.house-root .room-trials .lvl-med{width:calc(148 * var(--u));flex:none;place-items:center;display:grid}.house-root .room-trials .lvl-ring{width:calc(138 * var(--u));height:calc(138 * var(--u));border:calc(5 * var(--u)) solid transparent;box-shadow:0 0 0 2px #0a0d14, 0 0 0 calc(4 * var(--u)) var(--rgl), inset 0 0 calc(20 * var(--u)) #3f78be59, 0 0 calc(22 * var(--u)) #d4b06a4d;outline:calc(3 * var(--u)) solid #d4b06a;outline-offset:calc(-1 * var(--u));background:radial-gradient(circle at 50% 40%,#1b2a44,#070b13 72%) padding-box padding-box;border-image:;border-radius:50%;place-items:center;display:grid;position:relative}.house-root .room-trials .lvl-ring:before{content:\"\";inset:calc(6 * var(--u));border:1px dashed #f1dcaa80;border-radius:50%;position:absolute}.house-root .room-trials .lvl-ring b{font:600 calc(58 * var(--u)) / 1 \"Cinzel\", serif;color:var(--rgh);text-shadow:0 0 calc(16 * var(--u)) #f1dcaa80}.house-root .room-trials .lvl-side{flex-direction:column;flex:1;min-width:0;display:flex}.house-root .room-trials .lvl-note{text-align:right;font:italic 500 calc(18 * var(--u)) \"Cormorant Garamond\", Georgia, serif;color:var(--ink2);margin:calc(2 * var(--u)) 0 calc(4 * var(--u))}.house-root .room-trials .lvl-bar{height:calc(7 * var(--u));margin-bottom:calc(8 * var(--u));background:#03070ce6;border:1px solid #d4b06a66}.house-root .room-trials .lvl-bar i{background:linear-gradient(#f1dcaa,#b8914a);height:100%;display:block}.house-root .room-trials .lvl-side h5{text-align:center;font:500 calc(14 * var(--u)) \"Cinzel\", serif;letter-spacing:.24em;color:var(--rg);padding:calc(4 * var(--u)) 0 calc(6 * var(--u));margin-bottom:calc(6 * var(--u));border-top:1px solid #d4b06a4d;border-bottom:1px solid #d4b06a2e}.house-root .room-trials .lt{align-items:center;gap:calc(10 * var(--u));padding:calc(5 * var(--u)) calc(6 * var(--u));display:flex}.house-root .room-trials .lt-i{width:calc(24 * var(--u));height:calc(24 * var(--u));color:var(--rc)}.house-root .room-trials .lt-l{font:500 calc(18 * var(--u)) \"Barlow\", sans-serif;color:var(--ink);flex:1}.house-root .room-trials .lt b{font:600 calc(26 * var(--u)) \"Barlow Condensed\", sans-serif;letter-spacing:.02em}.house-root .room-trials .lt b.up{color:var(--rc);text-shadow:0 0 calc(10 * var(--u)) #3fd3c866}.house-root .room-trials .rt-trials-t{padding-bottom:calc(6 * var(--u))}.house-root .room-trials .rt-trials-t em,.house-root .room-trials .rt-season-t em{font:400 calc(16 * var(--u)) \"Barlow\", sans-serif;color:var(--ink);text-align:right;letter-spacing:0;padding-right:calc(8 * var(--u));margin:0 0 0 auto}.house-root .room-trials .trials-body{gap:calc(14 * var(--u));padding:calc(8 * var(--u)) calc(24 * var(--u)) 0 calc(26 * var(--u));display:flex}.house-root .room-trials .plaques{grid-template-columns:repeat(3, calc(230 * var(--u)));gap:calc(22 * var(--u));display:grid}.house-root .room-trials .plq{height:calc(300 * var(--u));padding:calc(18 * var(--u)) calc(14 * var(--u)) 0;text-align:center;border-radius:calc(7 * var(--u));box-shadow:inset 0 0 calc(24 * var(--u)) #6e501e80, inset 0 0 0 calc(3 * var(--u)) #e2c885, inset 0 0 0 calc(5 * var(--u)) #7d5f2c, 0 calc(10 * var(--u)) calc(20 * var(--u)) #0009;color:#2a1f0e;background:radial-gradient(90% 60% at 50% 30%,#d9caa4,#bfa978 60%,#a58f5f),#bda774;flex-direction:column;align-items:center;display:flex;position:relative}.house-root .room-trials .plq:before{content:\"\";inset:calc(9 * var(--u));border-radius:calc(4 * var(--u));pointer-events:none;border:1px solid #50381680;position:absolute}.house-root .room-trials .plq-c{width:calc(26 * var(--u));height:calc(26 * var(--u));border:calc(3 * var(--u)) solid #e8cb8a;pointer-events:none;border-radius:3px;position:absolute;box-shadow:0 1px 2px #0009}.house-root .room-trials .plq-c.tl{left:calc(-3 * var(--u));top:calc(-3 * var(--u));border-bottom:0;border-right:0}.house-root .room-trials .plq-c.tr{right:calc(-3 * var(--u));top:calc(-3 * var(--u));border-bottom:0;border-left:0}.house-root .room-trials .plq-c.bl{left:calc(-3 * var(--u));bottom:calc(-3 * var(--u));border-top:0;border-right:0}.house-root .room-trials .plq-c.br{right:calc(-3 * var(--u));bottom:calc(-3 * var(--u));border-top:0;border-left:0}.house-root .room-trials .plq-em{width:calc(104 * var(--u));height:calc(104 * var(--u));padding:calc(23 * var(--u));color:#e8cb8a;box-shadow:0 0 0 calc(3 * var(--u)) #e2c885, 0 0 0 calc(5 * var(--u)) #6a4f22, 0 calc(4 * var(--u)) calc(8 * var(--u)) #0000008c, inset 0 0 calc(14 * var(--u)) #3f78be59;margin-top:calc(6 * var(--u));background:radial-gradient(circle at 50% 35%,#1d2b44,#070b13 78%);border-radius:50%}.house-root .room-trials .plq-em svg{stroke-width:1.3px;width:100%;height:100%;filter:drop-shadow(0 0 calc(4 * var(--u)) #f1dcaa8c)}.house-root .room-trials .plq h4{font:600 calc(23 * var(--u)) / 1.15 \"Marcellus\", \"Cinzel\", serif;margin-top:calc(18 * var(--u));min-height:calc(54 * var(--u));color:#20170a;align-items:center;display:grid}.house-root .room-trials .plq-n{font:600 calc(31 * var(--u)) / 1 \"Marcellus\", \"Cinzel\", serif;margin-top:calc(6 * var(--u));color:#20170a}.house-root .room-trials .plq-bar{grid-template-columns:repeat(var(--cells), 1fr);gap:calc(3 * var(--u));width:86%;margin-top:calc(10 * var(--u));padding:calc(3 * var(--u));background:#0a121c;border:1px solid #5a4318;border-radius:2px;display:grid;box-shadow:inset 0 1px 3px #000}.house-root .room-trials .plq-bar i{height:calc(13 * var(--u));background:#16222f}.house-root .room-trials .plq-bar i.f{box-shadow:0 0 calc(8 * var(--u)) #3fd3c8cc;background:linear-gradient(#7ff3e8,#25aaa0)}.house-root .room-trials .plq.sealed{box-shadow:inset 0 0 calc(24 * var(--u)) #fff4c899, inset 0 0 0 calc(3 * var(--u)) #fff0b8, inset 0 0 0 calc(5 * var(--u)) #a67c2e, 0 0 calc(34 * var(--u)) #ffd6788c, 0 0 calc(70 * var(--u)) #ffbe5040, 0 calc(10 * var(--u)) calc(20 * var(--u)) #0009;background:radial-gradient(90% 70% at 50% 35%,#fff2c4,#f0d17d 55%,#c9a04a)}.house-root .room-trials .plq-seal{left:50%;bottom:calc(-12 * var(--u));padding:calc(7 * var(--u)) calc(34 * var(--u));font:700 calc(17 * var(--u)) / 1 \"Cinzel\", serif;letter-spacing:.24em;color:#3a2a0a;z-index:3;background:linear-gradient(#fff0b8,#d9ac4e 55%,#b98a32);border:1px solid #7d5f2c;border-radius:3px;position:absolute;transform:translate(-50%);box-shadow:0 2px 6px #0009,inset 0 1px #ffffffb3}.house-root .room-trials .chest{text-align:center;min-width:0;padding-top:calc(0 * var(--u));border-radius:calc(5 * var(--u));height:calc(296 * var(--u));background:radial-gradient(80% 60%,#3f78be33,#05091099 80%);border:1px solid #d4b06a4d;flex-direction:column;flex:1;align-items:center;display:flex}.house-root .room-trials .chest h5{font:500 calc(15 * var(--u)) \"Cinzel\", serif;letter-spacing:.22em;color:var(--rg);padding:calc(10 * var(--u)) 0 calc(2 * var(--u))}.house-root .room-trials .chest p{font:400 calc(16 * var(--u)) / 1.25 \"Barlow\", sans-serif;color:var(--ink2);padding-bottom:calc(14 * var(--u));margin-top:auto}@keyframes rt-glow{50%{filter:drop-shadow(0 0 calc(26 * var(--u)) #ffe096)}}.house-root .room-trials .rt-season-t b{font:500 calc(21 * var(--u)) \"Marcellus\", \"Cinzel\", serif;letter-spacing:.02em;color:var(--ink);margin-left:calc(20 * var(--u))}.house-root .room-trials .streak{left:50%;bottom:calc(14 * var(--u));align-items:center;gap:calc(14 * var(--u));padding:calc(10 * var(--u)) calc(28 * var(--u));width:calc(640 * var(--u));border-radius:calc(7 * var(--u));box-shadow:inset 0 0 0 3px #04070ce6, inset 0 0 0 4px #d4b06a40, 0 calc(6 * var(--u)) calc(16 * var(--u)) #0009;background:linear-gradient(#0e1422f5,#060910f7);border:1px solid #d4b06acc;display:flex;position:absolute;transform:translate(-50%)}.house-root .room-trials .st-fl{width:calc(42 * var(--u));height:calc(42 * var(--u));padding:calc(7 * var(--u));border:1.5px solid var(--rg);color:#ffc86a;background:radial-gradient(circle,#ffbe5a38,#060910e6 75%);border-radius:50%}.house-root .room-trials .streak>b{font:600 calc(23 * var(--u)) \"Cinzel\", serif;letter-spacing:.22em;color:var(--rgh)}.house-root .room-trials .st-bar{width:1px;height:calc(28 * var(--u));background:#d4b06a73}.house-root .room-trials .st-txt{font:400 calc(19 * var(--u)) \"Barlow\", sans-serif;color:var(--ink);white-space:nowrap}.house-root .room-trials .st-flames{gap:calc(4 * var(--u));margin-left:auto;display:flex}.house-root .room-trials .st-flames em{width:calc(22 * var(--u));height:calc(26 * var(--u));color:#3b3a3a}.house-root .room-trials .st-flames em.lit{color:#ffbe55;filter:drop-shadow(0 0 calc(6 * var(--u)) #ffaa3ce6)}.house-root .room-trials .st-flames em svg,.house-root .room-trials .st-fl svg{fill:currentColor;fill-opacity:.5;width:100%;height:100%}.house-root .room-trials .season-body{left:calc(14 * var(--u));right:calc(14 * var(--u));top:calc(60 * var(--u));bottom:calc(14 * var(--u));background:#070b16;border:1px solid #d4b06a59;position:absolute;overflow:hidden}.house-root .room-trials .road{aspect-ratio:1568/491;background:var(--rm-season) 0 0 / 100% 100% no-repeat;width:100%;position:absolute;top:0;left:0}.house-root .room-trials .road-shade{pointer-events:none;background:linear-gradient(#04070e00,#04070e9e 38% 70%,#04070e00);height:30%;position:absolute;top:55%;left:0;right:0}.house-root .room-trials .shr{height:100%;width:calc(130 * var(--u));margin-left:calc(-65 * var(--u));text-align:center;color:var(--rg);pointer-events:none;position:absolute;top:0}.house-root .room-trials .shr-dot{width:calc(30 * var(--u));height:calc(30 * var(--u));margin:calc(-15 * var(--u)) 0 0 calc(-15 * var(--u));color:#6fd8ff;box-shadow:0 0 calc(10 * var(--u)) #d4b06a8c, 0 2px 4px #000000b3;background:#0a1220;border:1.5px solid #d4b06a;border-radius:50%;place-items:center;display:grid;position:absolute;top:58%;left:50%}.house-root .room-trials .shr-dot svg{width:62%;height:62%}.house-root .room-trials .shr.locked .shr-dot{color:#c4c9d3;background:#11161f;border-color:#8a8f99;box-shadow:0 2px 4px #000000b3}.house-root .room-trials .shr.current .shr-dot{width:calc(42 * var(--u));height:calc(42 * var(--u));margin:calc(-21 * var(--u)) 0 0 calc(-21 * var(--u));box-shadow:0 0 calc(18 * var(--u)) #6fe8ff, 0 0 calc(40 * var(--u)) #6fe8ff8c;background:radial-gradient(circle,#cfffff,#3fd3c8 55%,#1a7f9e);border-color:#fff0b8}.house-root .room-trials .shr.current .shr-dot i{background:#fff;width:38%;height:38%;transform:rotate(45deg);box-shadow:0 0 8px #fff}.house-root .room-trials .shr small{font:500 calc(13.5 * var(--u)) \"Barlow\", sans-serif;letter-spacing:.12em;color:#d6dae4;text-shadow:0 1px 3px #000;position:absolute;top:64.5%;left:0;right:0}.house-root .room-trials .shr b{font:500 calc(15.5 * var(--u)) \"Marcellus\", serif;color:var(--ink);white-space:nowrap;text-shadow:0 1px 4px #000;position:absolute;top:69.5%;left:0;right:0}.house-root .room-trials .shr.current small,.house-root .room-trials .shr.current b{color:#fff0b8;text-shadow:0 0 calc(10 * var(--u)) #ffd678cc, 0 1px 3px #000}.house-root .room-trials .shr.locked b{color:#c3c8d2}.house-root .room-trials .rcpt{width:calc(150 * var(--u));height:52%;margin-left:calc(-75 * var(--u));cursor:pointer;background:0 0;border:0;justify-content:center;align-items:flex-end;display:flex;position:absolute;top:8%;left:92%}.house-root .room-trials .rcpt b{font:500 calc(16 * var(--u)) \"Marcellus\", serif;color:var(--ink);text-shadow:0 1px 4px #000, 0 0 calc(8 * var(--u)) #04070ee6}.house-root .room-trials .rcpt:hover b{color:#fff0b8}.house-root .room-trials .streak{bottom:calc(6 * var(--u));padding-top:calc(3 * var(--u));padding-bottom:calc(3 * var(--u))}.house-root .room-trials .streak .st-fl{width:calc(34 * var(--u));height:calc(34 * var(--u));padding:calc(5 * var(--u))}.house-root .room-trials .chest-art{width:94%;margin-top:calc(2 * var(--u));display:block}.house-root .room-trials .chimg{width:100%;max-height:calc(196 * var(--u));object-fit:contain;filter:drop-shadow(0 calc(6 * var(--u)) calc(8 * var(--u)) #000000b3);display:block}.house-root .room-trials .chest[data-state=glowing]{box-shadow:0 0 calc(30 * var(--u)) #ffd67859, inset 0 0 calc(30 * var(--u)) #ffd67833;border-color:#ffe096b3}.house-root .room-trials .chest[data-state=glowing] .chimg{animation:2.4s ease-in-out infinite rt-glow}.house-root .room-trials .chest[data-state=glowing] .chest-art{cursor:pointer}.house-root .room-trials .chest-svg{width:100%}.house-root .room-trials .mdl{align-content:start;justify-items:center;gap:calc(6 * var(--u));height:calc(120 * var(--u));text-align:center;display:grid}.house-root .room-trials .mdl small{font:500 calc(15 * var(--u)) / 1.1 \"Barlow\", sans-serif;color:var(--ink);min-height:calc(30 * var(--u));align-items:start;display:grid}.house-root .room-trials .mdl-c{width:calc(88 * var(--u));height:calc(88 * var(--u));color:#f1dcaa;place-items:center;display:grid;position:relative}.house-root .room-trials .mdl .mimg{object-fit:contain;width:100%;height:100%;filter:drop-shadow(0 calc(4 * var(--u)) calc(6 * var(--u)) #000000b3)}.house-root .room-trials .mdl .mfb{width:58%;height:58%}.house-root .room-trials .mdl .mfb svg{stroke-width:1.3px;width:100%;height:100%}.house-root .room-trials .mdl.earned.gold .mimg{filter:drop-shadow(0 0 calc(10 * var(--u)) #ffd6788c) drop-shadow(0 calc(4 * var(--u)) calc(6 * var(--u)) #0009)}.house-root .room-trials .mdl.earned.cyan .mimg{filter:drop-shadow(0 0 calc(10 * var(--u)) #6fc8ff8c) drop-shadow(0 calc(4 * var(--u)) calc(6 * var(--u)) #0009)}.house-root .room-trials .mdl.earned.ember .mimg{filter:drop-shadow(0 0 calc(10 * var(--u)) #e2875a80) drop-shadow(0 calc(4 * var(--u)) calc(6 * var(--u)) #0009)}.house-root .room-trials .mdl-c em{right:calc(-4 * var(--u));bottom:calc(-2 * var(--u));font:600 calc(15 * var(--u)) / 1 \"Barlow Condensed\", sans-serif;padding:calc(3 * var(--u)) calc(6 * var(--u));color:var(--rgh);background:#0a0e16;border:1px solid #d4b06a;border-radius:9px;font-style:normal;position:absolute}.house-root .room-trials .mdl.locked .mimg{filter:grayscale()brightness(.5)contrast(.9);opacity:.62}.house-root .room-trials .mdl.locked.sil .mimg{filter:brightness(0)invert(.3);opacity:.8}.house-root .room-trials .mdl.locked small{color:var(--ink3)}.house-root .room-trials .mdl.locked .mdl-c:not(:has(.mimg)){box-shadow:0 0 0 calc(3 * var(--u)) #4a4f58, 0 0 0 calc(5 * var(--u)) #20242c, inset 0 0 calc(14 * var(--u)) #000000b3;color:#6a717d;background:radial-gradient(circle at 38% 30%,#232a36,#0b0e14 80%);border-radius:50%}.house-root .room-trials .lockg{color:#8f96a3;width:38%;height:38%}.house-root .room-trials .mdl-c:has(.mimg) .lockg{width:30%;height:30%;padding:calc(4 * var(--u));box-sizing:content-box;background:#0a0e16;border:1px solid #5b616d;border-radius:50%;position:absolute;bottom:2%;right:2%}.house-root .room-trials .lockg svg{width:100%;height:100%}.house-root .room-trials .cabinet{gap:calc(12 * var(--u)) calc(8 * var(--u));padding:calc(6 * var(--u)) calc(22 * var(--u)) 0;grid-template-columns:repeat(3,1fr);display:grid}.house-root .room-trials .daily{width:100%;padding:calc(4 * var(--u)) calc(22 * var(--u)) 0;display:block}.house-root .room-trials .parch{justify-content:center;align-items:center;gap:calc(14 * var(--u));height:calc(60 * var(--u));padding:0 calc(20 * var(--u));box-shadow:0 2px 4px #00000080, inset 0 0 calc(14 * var(--u)) #785a2866;clip-path:polygon(0 4%,2% 0,98% 5%,100% 0,99% 95%,97% 100%,2% 96%,0 100%);background:linear-gradient(#dccca0,#c3ad7c);display:flex;position:relative}.house-root .room-trials .parch .dl-c{width:calc(34 * var(--u));height:calc(34 * var(--u));color:#7d5f2c;opacity:.8;flex:none}.house-root .room-trials .parch .dl-c svg{width:100%;height:100%}.house-root .room-trials .parch q{quotes:none;font:italic 500 calc(23 * var(--u)) / 1.1 \"Cormorant Garamond\", Georgia, serif;color:#33240f;text-align:center}.house-root .room-trials .ora-row{padding:0 calc(16 * var(--u)) 0 calc(6 * var(--u));align-items:center;display:flex;position:absolute;inset:0}.house-root .room-trials .ora-orb{width:calc(96 * var(--u));height:calc(70 * var(--u));flex:none;position:relative}.house-root .room-trials .ora-say{min-width:0}.house-root .room-trials .ora-say small{font:500 calc(13 * var(--u)) \"Cinzel\", serif;letter-spacing:.3em;color:var(--rg);display:block}.house-root .room-trials .ora-say q{quotes:none;font:italic 500 calc(17 * var(--u)) / 1.15 \"Cormorant Garamond\", Georgia, serif;color:var(--ro);text-shadow:0 0 calc(10 * var(--u)) #9fdcff59;display:block}.house-root .room-ledger .coin:has(.mimg){box-shadow:none;width:calc(34 * var(--u));height:calc(34 * var(--u));background:0 0;border-radius:0;padding:0}.house-root .room-ledger .coin .mimg{object-fit:contain;filter:drop-shadow(0 1px 2px #000c);width:100%;height:100%}.house-root .room-ledger .coin .mfb{color:#c9a45e;width:100%;height:100%;display:grid}.house-root .room-markets .rm-grid{width:calc(1920 * var(--u));height:calc(1080 * var(--u));position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}.house-root .room-markets .rm-grid>*{position:absolute}.house-root .room-markets .rp-small{font-size:calc(19 * var(--u));padding-top:calc(13 * var(--u));padding-bottom:calc(8 * var(--u))}.house-root .room-markets .empty{color:var(--ink3);font:500 calc(15 * var(--u)) \"Barlow\", sans-serif;padding:calc(14 * var(--u));text-align:center;grid-column:1/-1}.house-root .room-markets .mk-char{left:calc(70 * var(--u));top:calc(70 * var(--u));width:calc(340 * var(--u));height:calc(122 * var(--u))}.house-root .room-markets .mk-char>div{align-items:center;gap:calc(14 * var(--u));padding:0 calc(18 * var(--u));display:flex;position:absolute;inset:0}.house-root .room-markets .cc-portrait{width:calc(86 * var(--u));height:calc(86 * var(--u));border:calc(2 * var(--u)) solid var(--rg);box-shadow:0 0 calc(14 * var(--u)) #d4b06a59;border-radius:50%;flex:none;overflow:hidden}.house-root .room-markets .cc-portrait img{object-fit:cover;object-position:50% 22%;width:100%;height:100%;display:block}.house-root .room-markets .cc-body{flex:1;min-width:0}.house-root .room-markets .cc-body h2{font:600 calc(25 * var(--u)) / 1 \"Cinzel\", serif;letter-spacing:.08em;color:var(--rgh);text-shadow:0 0 calc(12 * var(--u)) #d4b06a4d;white-space:nowrap;margin:0}.house-root .room-markets .cc-lv{margin-top:calc(9 * var(--u));font:500 calc(13 * var(--u)) \"Barlow\", sans-serif;letter-spacing:.14em;color:var(--ink2);justify-content:space-between;align-items:baseline;display:flex}.house-root .room-markets .cc-lv b{font:600 calc(17 * var(--u)) \"Barlow Condensed\", sans-serif;color:var(--rgh)}.house-root .room-markets .cc-lv em{letter-spacing:0;color:var(--ink);font-style:normal;font-size:calc(13 * var(--u))}.house-root .room-markets .cc-bar{height:calc(7 * var(--u));margin:calc(5 * var(--u)) 0;background:#0000008c;border:1px solid #d4b06a59;border-radius:99px;overflow:hidden}.house-root .room-markets .cc-bar i{height:100%;box-shadow:0 0 calc(8 * var(--u)) #f1dcaa80;background:linear-gradient(90deg,#9c7a3e,#f1dcaa);display:block}.house-root .room-markets .cc-rank{font:500 calc(13 * var(--u)) \"Barlow\", sans-serif;letter-spacing:.2em;color:var(--ink3);justify-content:space-between;align-items:baseline;display:flex}.house-root .room-markets .cc-rank b{font:600 calc(16 * var(--u)) \"Cinzel\", serif;color:var(--rc);letter-spacing:.06em}.house-root .room-markets .mk-halls{left:calc(70 * var(--u));top:calc(222 * var(--u));width:calc(340 * var(--u));height:calc(588 * var(--u))}.house-root .room-markets .hl-list{gap:calc(7 * var(--u));padding:calc(4 * var(--u)) calc(16 * var(--u)) 0;display:grid}.house-root .room-markets .hl{align-items:center;gap:calc(12 * var(--u));height:calc(76 * var(--u));padding:0 calc(12 * var(--u));text-align:left;border-radius:calc(3 * var(--u));background:linear-gradient(90deg,#0a101ce6,#070a12e6);border:1px solid #d4b06a47;transition:border-color .15s,background .15s;display:flex;position:relative}.house-root .room-markets .hl:hover{border-color:#d4b06a99}.house-root .room-markets .hl-em{width:calc(56 * var(--u));height:calc(56 * var(--u));flex:none;place-items:center;display:grid}.house-root .room-markets .hl-em img,.house-root .room-markets .arch-em img,.house-root .room-markets .lc-em img,.house-root .room-markets .wl-em img{object-fit:contain;width:100%;height:100%;display:block}.house-root .room-markets .hl-em svg,.house-root .room-markets .wl-em svg,.house-root .room-markets .lc-em svg{width:70%;height:70%;color:var(--rg)}.house-root .room-markets .hl-t{gap:calc(4 * var(--u));min-width:0;display:grid}.house-root .room-markets .hl-t b{font:600 calc(17 * var(--u)) / 1 \"Cinzel\", serif;letter-spacing:.07em;color:var(--ink2);white-space:nowrap}.house-root .room-markets .hl-t small{font:400 calc(14 * var(--u)) / 1.1 \"Barlow\", sans-serif;color:var(--ink3);white-space:nowrap}.house-root .room-markets .hl.on{border-color:var(--rc);box-shadow:0 0 calc(16 * var(--u)) #3fd3c838, inset 0 0 calc(20 * var(--u)) #3fd3c814;background:linear-gradient(90deg,#163442d9,#091622e6)}.house-root .room-markets .hl.on .hl-t b{color:var(--rgh)}.house-root .room-markets .hl.on .hl-t small{color:var(--ink2)}.house-root .room-markets .mk-vault{left:calc(70 * var(--u));top:calc(838 * var(--u));width:calc(340 * var(--u));height:calc(196 * var(--u))}.house-root .room-markets .mshelf{padding:calc(6 * var(--u)) calc(14 * var(--u)) 0;grid-template-columns:repeat(5,1fr);display:grid}.house-root .room-markets .mvc{justify-items:center;gap:calc(3 * var(--u));display:grid}.house-root .room-markets .mvc .mvc-gem{width:calc(56 * var(--u));height:calc(80 * var(--u));filter:drop-shadow(0 0 calc(9 * var(--u)) var(--glow));display:block;position:relative}.house-root .room-markets .mvc .mvc-gem img{object-fit:contain;width:100%;height:100%;position:absolute;inset:0}.house-root .room-markets .mvc b{font:600 calc(8.5 * var(--u)) \"Cinzel\", serif;letter-spacing:0;text-transform:uppercase;color:var(--ink3);white-space:nowrap}.house-root .room-markets .mvc i{font:600 calc(19 * var(--u)) \"Barlow Condensed\", sans-serif;color:var(--rgh);font-style:normal}.house-root .room-markets .mk-arches{left:calc(440 * var(--u));top:calc(56 * var(--u));width:calc(1040 * var(--u));height:calc(206 * var(--u));gap:calc(8 * var(--u));grid-template-columns:repeat(6,1fr);display:grid}.house-root .room-markets .arch{filter:brightness(.7)saturate(.85);transition:filter .2s,transform .2s;display:block;position:relative}.house-root .room-markets .arch:hover{filter:brightness(.9)}.house-root .room-markets .arch .arch-svg{width:100%;height:100%;position:absolute;inset:0;overflow:visible}.house-root .room-markets .arch .a-fill{fill:#070b15}.house-root .room-markets .arch .a-in{fill:#16284e8c;stroke:#d4b06a40;stroke-width:1px;vector-effect:non-scaling-stroke}.house-root .room-markets .arch .a-edge{fill:none;stroke-width:calc(5 * var(--u));vector-effect:non-scaling-stroke;filter:drop-shadow(0 calc(3 * var(--u)) calc(6 * var(--u)) #000000b3)}.house-root .room-markets .arch-em{left:50%;top:calc(46 * var(--u));width:calc(104 * var(--u));height:calc(104 * var(--u));filter:drop-shadow(0 0 calc(10 * var(--u)) #f1dcaa59);position:absolute;transform:translate(-50%)}.house-root .room-markets .arch-em svg{width:100%;height:100%;color:var(--rg)}.house-root .room-markets .arch-n{left:0;right:0;bottom:calc(15 * var(--u));text-align:center;font:600 calc(11.5 * var(--u)) / 1 \"Cinzel\", serif;letter-spacing:.05em;color:var(--ink2);text-shadow:0 1px #000,0 -1px #fff0c81f;white-space:nowrap;position:absolute}.house-root .room-markets .arch-u{left:14%;right:14%;bottom:calc(6 * var(--u));height:calc(3 * var(--u));background:0 0;border-radius:2px;position:absolute}.house-root .room-markets .arch.on{filter:brightness(1.12)saturate(1.1)}.house-root .room-markets .arch.on .a-in{fill:#28468299;stroke:#f1dcaa99}.house-root .room-markets .arch.on .a-edge{filter:drop-shadow(0 0 calc(10 * var(--u)) #f1dcaa99)}.house-root .room-markets .arch.on .arch-em{filter:drop-shadow(0 0 calc(18 * var(--u)) #ffe296bf)}.house-root .room-markets .arch.on .arch-n{color:var(--rgh)}.house-root .room-markets .arch.on .arch-u{background:var(--rc);box-shadow:0 0 calc(10 * var(--u)) var(--rc)}.house-root .room-markets .mk-daily{left:calc(440 * var(--u));top:calc(284 * var(--u));width:calc(1040 * var(--u));height:calc(184 * var(--u));grid-template-columns:calc(176 * var(--u)) calc(296 * var(--u)) minmax(0, 1fr) calc(158 * var(--u));gap:calc(18 * var(--u));padding:calc(18 * var(--u)) calc(24 * var(--u));grid-template-rows:minmax(0,1fr);align-items:stretch;display:grid}.house-root .room-markets .dc-thumb{border:1px solid var(--rg);box-shadow:0 0 0 calc(3 * var(--u)) #05080f, 0 0 0 calc(4 * var(--u)) #d4b06a8c, 0 0 calc(18 * var(--u)) #3f78be59;background:var(--rm-season) 90% 52% / auto 230% no-repeat;position:relative}.house-root .room-markets .dc-thumb:after{content:\"\";background:radial-gradient(at 50% 45%,#0000 40%,#05080f80);position:absolute;inset:0}.house-root .room-markets .dc-c{width:calc(10 * var(--u));height:calc(10 * var(--u));border:0 solid var(--rgh);z-index:1;position:absolute}.house-root .room-markets .dc-c.tl{border-width:2px 0 0 2px;top:-2px;left:-2px}.house-root .room-markets .dc-c.tr{border-width:2px 2px 0 0;top:-2px;right:-2px}.house-root .room-markets .dc-c.bl{border-width:0 0 2px 2px;bottom:-2px;left:-2px}.house-root .room-markets .dc-c.br{border-width:0 2px 2px 0;bottom:-2px;right:-2px}.house-root .room-markets .dc-title{justify-content:center;gap:calc(7 * var(--u));flex-direction:column;min-width:0;display:flex}.house-root .room-markets .dc-title h3{font:600 calc(25 * var(--u)) / 1 \"Cinzel\", serif;letter-spacing:.1em;color:var(--rgh);text-shadow:0 0 calc(16 * var(--u)) #d4b06a66, 0 1px 0 #000;white-space:nowrap}.house-root .room-markets .dc-title p{font:italic 500 calc(15 * var(--u)) / 1.3 \"Cormorant Garamond\", Georgia, serif;font-size:calc(17 * var(--u));color:var(--ink2)}.house-root .room-markets .dc-go{margin-top:calc(4 * var(--u));height:calc(36 * var(--u));padding:0 calc(18 * var(--u));border-radius:calc(3 * var(--u));font:700 calc(13 * var(--u)) / 1 \"Cinzel\", serif;letter-spacing:.14em;color:#2a1d0c;box-shadow:0 0 calc(14 * var(--u)) #f1dcaa66, inset 0 1px 0 #fffae1cc;white-space:nowrap;background:linear-gradient(#f6e4b0,#d4b06a 55%,#a98443);align-self:flex-start}.house-root .room-markets .dc-go:disabled{cursor:default;color:#d4b06a8c;background:#1e1a12bf;box-shadow:inset 0 0 0 1px #d4b06a47}.house-root .room-markets .dc-chart{min-width:0;padding:calc(8 * var(--u)) calc(12 * var(--u)) calc(6 * var(--u));background:#04070db3;border:1px solid #d4b06a4d;flex-direction:column;display:flex;position:relative}.house-root .room-markets .dc-top{justify-content:space-between;align-items:baseline;display:flex}.house-root .room-markets .dc-sym{font:600 calc(17 * var(--u)) \"Cinzel\", serif;letter-spacing:.08em;color:var(--ink)}.house-root .room-markets .dc-sym small{font:500 calc(11 * var(--u)) \"Barlow\", sans-serif;letter-spacing:.14em;color:var(--ink3);margin-left:calc(6 * var(--u))}.house-root .room-markets .dc-px b{font:600 calc(24 * var(--u)) \"Barlow Condensed\", sans-serif;color:var(--ink);margin-right:calc(10 * var(--u))}.house-root .room-markets .dc-px em{font:600 calc(16 * var(--u)) \"Barlow Condensed\", sans-serif;font-style:normal}.house-root .room-markets .dc-chart{min-height:0;overflow:hidden}.house-root .room-markets .dc-chart canvas{width:100%;height:0;min-height:0;margin-top:calc(4 * var(--u));flex:1 1 0}.house-root .room-markets .dc-stats{gap:calc(8 * var(--u));text-align:center;grid-template-rows:1fr 1fr;align-content:center;min-height:0;display:grid}.house-root .room-markets .dc-stats>div{align-content:center;justify-items:center;gap:calc(3 * var(--u));border-left:1px solid #d4b06a38;display:grid}.house-root .room-markets .dc-stats b{font:600 calc(34 * var(--u)) / 1 \"Barlow Condensed\", sans-serif;color:var(--ink2)}.house-root .room-markets .dc-stats small{font:500 calc(12 * var(--u)) / 1.2 \"Barlow\", sans-serif;letter-spacing:.1em;color:var(--ink3);text-transform:uppercase}.house-root .room-markets .dc-grade b.engr{font:700 calc(40 * var(--u)) / 1 \"Cinzel\", serif;color:#d4b06abf;text-shadow:0 1px #fff0c859,0 -1px #000}.house-root .room-markets .mk-floor{left:calc(440 * var(--u));top:calc(496 * var(--u));width:calc(1040 * var(--u));height:calc(548 * var(--u))}.house-root .room-markets .mk-scroll{inset:calc(14 * var(--u)) calc(12 * var(--u)) calc(14 * var(--u)) calc(16 * var(--u));padding-right:calc(8 * var(--u));scrollbar-width:thin;scrollbar-color:#d4b06a80 #0000004d;overscroll-behavior:contain;position:absolute;overflow:hidden auto}.house-root .room-markets .lc-grid{gap:calc(14 * var(--u));padding:calc(4 * var(--u)) calc(4 * var(--u)) calc(6 * var(--u));grid-template-columns:repeat(4,1fr);display:grid}.house-root .room-markets .lc{height:calc(164 * var(--u));padding:calc(11 * var(--u)) calc(13 * var(--u)) calc(9 * var(--u));cursor:pointer;text-align:left;border-radius:calc(3 * var(--u));box-shadow:inset 0 0 0 calc(3 * var(--u)) #080c18, inset 0 0 0 calc(4 * var(--u)) #d4b06a29, 0 calc(5 * var(--u)) calc(12 * var(--u)) #00000080;background:linear-gradient(#0d1527,#080c18);border:1px solid #d4b06a80;flex-direction:column;transition:border-color .15s,box-shadow .15s,transform .15s;display:flex;position:relative}.house-root .room-markets .lc:hover{border-color:var(--rgh);transform:translateY(calc(-2 * var(--u)))}.house-root .room-markets .lc:focus-visible{outline:2px solid var(--rc);outline-offset:2px}.house-root .room-markets .lc.heavy{border-color:var(--rgh);box-shadow:inset 0 0 0 calc(3 * var(--u)) #080c18, inset 0 0 0 calc(4 * var(--u)) #f1dcaa73, 0 0 calc(18 * var(--u)) #f1dcaa6b, 0 0 calc(3 * var(--u)) #ffecb4b3}.house-root .room-markets .lc-h{align-items:center;gap:calc(10 * var(--u));display:flex}.house-root .room-markets .lc-em{width:calc(46 * var(--u));height:calc(46 * var(--u));filter:drop-shadow(0 0 calc(6 * var(--u)) #f1dcaa47);flex:none;place-items:center;display:grid}.house-root .room-markets .lc-nm{gap:calc(3 * var(--u));flex:1;min-width:0;display:grid}.house-root .room-markets .lc-nm b{font:600 calc(18 * var(--u)) / 1.1 \"Cinzel\", serif;letter-spacing:.01em;color:var(--rgh);white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.house-root .room-markets .lc:not(.named) .lc-nm b{color:var(--ink)}.house-root .room-markets .lc-nm small{font:500 calc(12 * var(--u)) / 1 \"Barlow Condensed\", sans-serif;letter-spacing:.14em;color:var(--ink3);white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.house-root .room-markets .bell{width:calc(26 * var(--u));height:calc(26 * var(--u));color:var(--ink3);border-radius:50%;flex:none;align-self:flex-start;place-items:center;transition:color .15s;display:grid}.house-root .room-markets .bell svg{width:78%;height:78%}.house-root .room-markets .bell:hover{color:var(--rg)}.house-root .room-markets .bell.on{color:var(--rgh);filter:drop-shadow(0 0 calc(6 * var(--u)) #f1dcaacc)}.house-root .room-markets .bell.on svg{fill:#f1dcaa47}.house-root .room-markets .bell.ring{color:var(--rgh);animation:1.1s ease-out mk-ring}@keyframes mk-ring{0%{filter:drop-shadow(0 0 #ffecaa00);transform:rotate(0)}12%{filter:drop-shadow(0 0 calc(14 * var(--u)) #ffecaa);transform:rotate(22deg)}28%{transform:rotate(-18deg)}44%{transform:rotate(12deg)}60%{transform:rotate(-8deg)}80%{transform:rotate(3deg)}to{filter:drop-shadow(0 0 calc(6 * var(--u)) #ffecaa33);transform:rotate(0)}}.house-root .room-markets .lc-p{margin-top:calc(7 * var(--u));justify-content:space-between;align-items:baseline;display:flex}.house-root .room-markets .lc-p b{font:600 calc(27 * var(--u)) / 1 \"Barlow Condensed\", sans-serif;color:var(--ink);letter-spacing:.01em}.house-root .room-markets .lc-p em{font:600 calc(17 * var(--u)) / 1 \"Barlow Condensed\", sans-serif;font-style:normal}.house-root .room-markets .lc .spk{min-height:0;margin:calc(5 * var(--u)) 0 calc(4 * var(--u));flex:1;display:block;position:relative}.house-root .room-markets .lc .spk svg{width:100%;height:100%;position:absolute;inset:0;overflow:visible}.house-root .room-markets .lc .spk .ln{fill:none;stroke:currentColor;stroke-width:1.6px;vector-effect:non-scaling-stroke;stroke-linejoin:round;filter:drop-shadow(0 0 3px)}.house-root .room-markets .lc .spk .end{display:none}.house-root .room-markets .lc .spk.up{color:var(--rc)}.house-root .room-markets .lc .spk.dn{color:var(--re)}.house-root .room-markets .lc-f{justify-content:space-between;gap:calc(8 * var(--u));padding-top:calc(5 * var(--u));border-top:1px solid #d4b06a2e;display:flex}.house-root .room-markets .lc-f span{gap:calc(1 * var(--u));display:grid}.house-root .room-markets .lc-f span:last-child{text-align:right}.house-root .room-markets .lc-f small{font:500 calc(10 * var(--u)) / 1 \"Barlow\", sans-serif;letter-spacing:.14em;color:var(--ink3)}.house-root .room-markets .lc-f b{font:600 calc(14 * var(--u)) / 1.1 \"Barlow Condensed\", sans-serif;color:var(--ink2);letter-spacing:.02em}.house-root .room-markets .mk-ora{left:calc(1512 * var(--u));top:calc(70 * var(--u));width:calc(338 * var(--u));height:calc(176 * var(--u));align-items:center;gap:calc(8 * var(--u));padding:0 calc(20 * var(--u)) 0 calc(6 * var(--u));display:flex}.house-root .room-markets .mk-ora .ora-orb{width:calc(104 * var(--u));height:calc(104 * var(--u));flex:none}.house-root .room-markets .mk-ora .ora-say{gap:calc(7 * var(--u));min-width:0;display:grid}.house-root .room-markets .mk-ora small{font:600 calc(11 * var(--u)) / 1.2 \"Cinzel\", serif;letter-spacing:.12em;color:var(--rc)}.house-root .room-markets .mk-ora q{quotes:none;font:italic 500 calc(18 * var(--u)) / 1.3 \"Cormorant Garamond\", Georgia, serif;color:var(--ink)}.house-root .room-markets .mk-watch{left:calc(1512 * var(--u));top:calc(276 * var(--u));width:calc(338 * var(--u));height:calc(700 * var(--u))}.house-root .room-markets .wl-tabs{margin:calc(4 * var(--u)) calc(18 * var(--u)) 0;border-bottom:1px solid #d4b06a4d;grid-template-columns:1fr 1fr;display:grid}.house-root .room-markets .wl-tabs button{height:calc(40 * var(--u));font:600 calc(14 * var(--u)) \"Cinzel\", serif;letter-spacing:.1em;color:var(--ink3);border-bottom:calc(3 * var(--u)) solid transparent}.house-root .room-markets .wl-tabs button.on{color:var(--rgh);border-bottom-color:var(--rc);box-shadow:0 calc(6 * var(--u)) calc(10 * var(--u)) calc(-6 * var(--u)) #3fd3c880}.house-root .room-markets .wl-list{left:calc(18 * var(--u));right:calc(18 * var(--u));top:calc(104 * var(--u));bottom:calc(76 * var(--u));align-content:start;gap:calc(8 * var(--u));scrollbar-width:thin;scrollbar-color:#d4b06a80 transparent;display:grid;position:absolute;overflow-y:auto}.house-root .room-markets .wl-row{align-items:center;gap:calc(12 * var(--u));min-height:calc(62 * var(--u));padding:calc(5 * var(--u)) calc(10 * var(--u));border-radius:calc(3 * var(--u));cursor:pointer;background:#080c16d9;border:1px solid #d4b06a40;display:flex}.house-root .room-markets .wl-row:hover{border-color:#d4b06a99}.house-root .room-markets .wl-row.fired{opacity:.6}.house-root .room-markets .wl-em{width:calc(44 * var(--u));height:calc(44 * var(--u));flex:none;place-items:center;display:grid}.house-root .room-markets .wl-t{gap:calc(3 * var(--u));flex:1;min-width:0;display:grid}.house-root .room-markets .wl-t b{font:600 calc(18 * var(--u)) / 1 \"Cinzel\", serif;color:var(--rgh);white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.house-root .room-markets .wl-t small{font:500 calc(15 * var(--u)) / 1.1 \"Barlow Condensed\", sans-serif;letter-spacing:.04em;color:var(--ink2)}.house-root .room-markets .wl-x{width:calc(26 * var(--u));height:calc(26 * var(--u));color:var(--ink3)}.house-root .room-markets .wl-x:hover{color:var(--re)}.house-root .room-markets .wl-x svg{width:70%;height:70%;margin:auto}.house-root .room-markets .wl-manage{left:calc(18 * var(--u));right:calc(18 * var(--u));bottom:calc(18 * var(--u));height:calc(44 * var(--u));font:700 calc(13 * var(--u)) \"Cinzel\", serif;letter-spacing:.14em;color:var(--rgh);border:1px solid var(--rg);border-radius:calc(3 * var(--u));background:linear-gradient(#3c2e14d9,#1a140ae6);position:absolute;box-shadow:inset 0 1px #f1dcaa40}.house-root .room-markets .wl-manage:hover{box-shadow:0 0 calc(14 * var(--u)) #d4b06a59, inset 0 1px 0 #f1dcaa40}.house-root .room-markets .wl-manage[hidden]{display:none}.house-root .room-markets .mk-strip{left:calc(1512 * var(--u));top:calc(1006 * var(--u));width:calc(338 * var(--u));text-align:center;font:600 calc(12 * var(--u)) \"Cinzel\", serif;letter-spacing:.26em;color:#ecd296d9;text-shadow:0 1px #000}.house-root .room-markets .mk-pop{z-index:20;width:calc(236 * var(--u));padding:calc(14 * var(--u));border:1px solid var(--rg);border-radius:calc(4 * var(--u));box-shadow:0 calc(14 * var(--u)) calc(30 * var(--u)) #000000bf, 0 0 calc(18 * var(--u)) #d4b06a40, inset 0 0 0 calc(3 * var(--u)) #090d17, inset 0 0 0 calc(4 * var(--u)) #d4b06a40;gap:calc(10 * var(--u));background:linear-gradient(#0e1626fa,#070a12fa);display:grid}.house-root .room-markets .mk-pop[hidden]{display:none}.house-root .room-markets .pop-h{justify-content:space-between;align-items:baseline;display:flex}.house-root .room-markets .pop-h b{font:600 calc(18 * var(--u)) \"Cinzel\", serif;color:var(--rgh)}.house-root .room-markets .pop-h small{font:500 calc(12 * var(--u)) \"Barlow Condensed\", sans-serif;letter-spacing:.14em;color:var(--ink3)}.house-root .room-markets .pop-dir{border-radius:calc(3 * var(--u));border:1px solid #d4b06a66;grid-template-columns:1fr 1fr;display:grid;overflow:hidden}.house-root .room-markets .pop-dir button{height:calc(30 * var(--u));font:600 calc(12 * var(--u)) \"Cinzel\", serif;letter-spacing:.12em;color:var(--ink3)}.house-root .room-markets .pop-dir button.on{color:#2a1d0c;background:linear-gradient(#f6e4b0,#c9a45b)}.house-root .room-markets .pop-in{gap:calc(5 * var(--u));display:grid}.house-root .room-markets .pop-in span{font:500 calc(11 * var(--u)) \"Barlow\", sans-serif;letter-spacing:.14em;color:var(--ink2)}.house-root .room-markets .pop-in input{width:100%;height:calc(36 * var(--u));padding:0 calc(10 * var(--u));font:600 calc(20 * var(--u)) \"Barlow Condensed\", sans-serif;color:var(--ink);border-radius:calc(3 * var(--u));background:#0000008c;border:1px solid #d4b06a80;outline:none}.house-root .room-markets .pop-in input:focus{border-color:var(--rc);box-shadow:0 0 calc(10 * var(--u)) #3fd3c84d}.house-root .room-markets .pop-in input.bad{border-color:var(--re);color:var(--re)}.house-root .room-markets .pop-mine{gap:calc(6 * var(--u));flex-wrap:wrap;display:flex}.house-root .room-markets .pop-mine span{align-items:center;gap:calc(4 * var(--u));padding:0 calc(4 * var(--u)) 0 calc(8 * var(--u));height:calc(24 * var(--u));font:600 calc(14 * var(--u)) \"Barlow Condensed\", sans-serif;color:var(--rgh);border:1px solid #d4b06a59;border-radius:99px;display:inline-flex}.house-root .room-markets .pop-mine button{width:calc(18 * var(--u));height:calc(18 * var(--u));color:var(--ink3)}.house-root .room-markets .pop-mine button:hover{color:var(--re)}.house-root .room-markets .pop-act{gap:calc(8 * var(--u));grid-template-columns:1.3fr 1fr;display:grid}.house-root .room-markets .pop-act button{height:calc(34 * var(--u));font:700 calc(12 * var(--u)) \"Cinzel\", serif;letter-spacing:.14em;border-radius:calc(3 * var(--u));color:var(--ink2);border:1px solid #d4b06a66}.house-root .room-markets .pop-act [data-pop=save]{color:#2a1d0c;border-color:var(--rg);background:linear-gradient(#f6e4b0,#c9a45b)}.house-root .room-markets .pop-act [data-pop=save]:disabled{opacity:.35;cursor:default}", df = ".house-root .room-daily .rp-small{font-size:calc(19 * var(--u));padding-top:calc(13 * var(--u));padding-bottom:calc(8 * var(--u))}.house-root .room-daily .dy-char{left:calc(70 * var(--u));top:calc(70 * var(--u));width:calc(340 * var(--u));height:calc(122 * var(--u))}.house-root .room-daily .dy-char>div{align-items:center;gap:calc(14 * var(--u));padding:0 calc(18 * var(--u));display:flex;position:absolute;inset:0}.house-root .room-daily .cc-portrait{width:calc(86 * var(--u));height:calc(86 * var(--u));border:calc(2 * var(--u)) solid var(--rg);box-shadow:0 0 calc(14 * var(--u)) #d4b06a59;border-radius:50%;flex:none;overflow:hidden}.house-root .room-daily .cc-portrait img{object-fit:cover;object-position:50% 22%;width:100%;height:100%;display:block}.house-root .room-daily .cc-body{flex:1;min-width:0}.house-root .room-daily .cc-body h2{font:600 calc(25 * var(--u)) / 1 \"Cinzel\", serif;letter-spacing:.08em;color:var(--rgh);text-shadow:0 0 calc(12 * var(--u)) #d4b06a4d;white-space:nowrap;margin:0}.house-root .room-daily .cc-lv{margin-top:calc(9 * var(--u));font:500 calc(13 * var(--u)) \"Barlow\", sans-serif;letter-spacing:.14em;color:var(--ink2);justify-content:space-between;align-items:baseline;display:flex}.house-root .room-daily .cc-lv b{font:600 calc(17 * var(--u)) \"Barlow Condensed\", sans-serif;color:var(--rgh)}.house-root .room-daily .cc-lv em{letter-spacing:0;color:var(--ink);font-style:normal;font-size:calc(13 * var(--u))}.house-root .room-daily .cc-bar{height:calc(7 * var(--u));margin:calc(5 * var(--u)) 0;background:#0000008c;border:1px solid #d4b06a59;border-radius:99px;overflow:hidden}.house-root .room-daily .cc-bar i{height:100%;box-shadow:0 0 calc(8 * var(--u)) #f1dcaa80;background:linear-gradient(90deg,#9c7a3e,#f1dcaa);display:block}.house-root .room-daily .cc-rank{font:500 calc(13 * var(--u)) \"Barlow\", sans-serif;letter-spacing:.2em;color:var(--ink3);justify-content:space-between;align-items:baseline;display:flex}.house-root .room-daily .cc-rank b{font:600 calc(16 * var(--u)) \"Cinzel\", serif;color:var(--rc);letter-spacing:.06em}.house-root .room-daily .dy-ora{left:calc(1512 * var(--u));top:calc(70 * var(--u));width:calc(338 * var(--u));height:calc(176 * var(--u));align-items:center;gap:calc(8 * var(--u));padding:0 calc(20 * var(--u)) 0 calc(6 * var(--u));display:flex}.house-root .room-daily .dy-ora .ora-orb{width:calc(104 * var(--u));height:calc(104 * var(--u));flex:none}.house-root .room-daily .dy-ora .ora-say{gap:calc(7 * var(--u));min-width:0;display:grid}.house-root .room-daily .dy-ora small{font:600 calc(11 * var(--u)) / 1.2 \"Cinzel\", serif;letter-spacing:.12em;color:var(--rc)}.house-root .room-daily .dy-ora q{quotes:none;font:italic 500 calc(18 * var(--u)) / 1.3 \"Cormorant Garamond\", Georgia, serif;color:var(--ink)}.house-root .room-daily:before{content:\"\";z-index:0;pointer-events:none;background:radial-gradient(58% 62%,#04070e2e,#03050abd 100%),#03050a47;position:absolute;inset:0}.house-root .room-daily .dy-grid{width:calc(1920 * var(--u));height:calc(1080 * var(--u));z-index:1;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}.house-root .room-daily .dy-grid>.rp:not(.dy-frame){filter:brightness(.82)saturate(.9)}.house-root .room-daily .dy-house{left:calc(70 * var(--u));top:calc(232 * var(--u));width:calc(340 * var(--u));height:calc(470 * var(--u))}.house-root .room-daily .dy-oath{left:calc(70 * var(--u));top:calc(742 * var(--u));width:calc(340 * var(--u));height:calc(268 * var(--u))}.house-root .room-daily .dy-seals{left:calc(1512 * var(--u));top:calc(70 * var(--u));width:calc(338 * var(--u));height:calc(262 * var(--u))}.house-root .room-daily .dy-pos{left:calc(1512 * var(--u));top:calc(372 * var(--u));width:calc(338 * var(--u));height:calc(352 * var(--u))}.house-root .room-daily .dy-ora{left:calc(1512 * var(--u));top:calc(764 * var(--u));width:calc(338 * var(--u));height:calc(246 * var(--u));text-align:center;justify-content:center;gap:calc(6 * var(--u));padding:0 calc(24 * var(--u));flex-direction:column}.house-root .room-daily .dy-ora .ora-orb{width:calc(120 * var(--u));height:calc(104 * var(--u))}.house-root .room-daily .dy-ora .ora-say{text-align:center}.house-root .room-daily .dy-ora q{font-size:calc(21 * var(--u));line-height:1.28}.house-root .room-daily .dy-char{left:calc(70 * var(--u));top:calc(70 * var(--u))}.house-root .room-daily .dh-sub{text-align:center;font:500 calc(13 * var(--u)) \"Barlow\", sans-serif;letter-spacing:.22em;text-transform:uppercase;color:var(--ink3);margin:calc(2 * var(--u)) 0 calc(14 * var(--u))}.house-root .room-daily .dh-bars{gap:calc(11 * var(--u));padding:0 calc(26 * var(--u));display:grid}.house-root .room-daily .hb{grid-template-columns:calc(30 * var(--u)) 1fr calc(52 * var(--u));align-items:center;gap:calc(12 * var(--u));height:calc(46 * var(--u));display:grid}.house-root .room-daily .hb b{font:700 calc(30 * var(--u)) / 1 \"Cinzel\", serif;color:#d4b06acc;text-shadow:0 1px #fff0c84d,0 -1px #000;text-align:center}.house-root .room-daily .hb-t{height:calc(16 * var(--u));background:#0000008c;border:1px solid #d4b06a4d;border-radius:99px;display:block;overflow:hidden}.house-root .room-daily .hb-t i{height:100%;box-shadow:0 0 calc(8 * var(--u)) #f1dcaa73;background:linear-gradient(90deg,#8a6a30,#f1dcaa);transition:width .6s;display:block}.house-root .room-daily .hb em{font:600 calc(17 * var(--u)) \"Barlow Condensed\", sans-serif;color:var(--ink3);text-align:right;letter-spacing:.06em;font-style:normal}.house-root .room-daily .hb.you b{color:var(--rgh);text-shadow:0 0 calc(14 * var(--u)) #f1dcaacc, 0 -1px 0 #000}.house-root .room-daily .hb.you em{color:var(--rc)}.house-root .room-daily .hb.you .hb-t{border-color:var(--rgh);box-shadow:0 0 calc(10 * var(--u)) #f1dcaa66}.house-root .room-daily .dh-note{text-align:center;margin:calc(18 * var(--u)) calc(26 * var(--u)) 0;font:italic 500 calc(18 * var(--u)) / 1.3 \"Cormorant Garamond\", Georgia, serif;color:var(--ink2);min-height:calc(48 * var(--u))}.house-root .room-daily .dh-foot{left:calc(24 * var(--u));right:calc(24 * var(--u));bottom:calc(22 * var(--u));text-align:center;padding-top:calc(14 * var(--u));font:500 calc(15 * var(--u)) / 1.35 \"Barlow\", sans-serif;letter-spacing:.04em;color:var(--rgh);border-top:1px solid #d4b06a38;position:absolute}.house-root .room-daily .do-rows{gap:calc(6 * var(--u));padding:0 calc(26 * var(--u));display:grid}.house-root .room-daily .do-rows>div{padding:calc(8 * var(--u)) 0;border-bottom:1px solid #d4b06a24;justify-content:space-between;align-items:baseline;display:flex}.house-root .room-daily .do-rows span{font:500 calc(14 * var(--u)) \"Barlow\", sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--ink3)}.house-root .room-daily .do-rows b{font:600 calc(24 * var(--u)) \"Barlow Condensed\", sans-serif;color:var(--ink)}.house-root .room-daily .do-rows p{margin-top:calc(10 * var(--u));text-align:center;font:italic 500 calc(17 * var(--u)) / 1.3 \"Cormorant Garamond\", Georgia, serif;color:var(--ink2)}.house-root .room-daily .dy-frame{left:calc(440 * var(--u));top:calc(70 * var(--u));width:calc(1040 * var(--u));height:calc(940 * var(--u));padding:calc(30 * var(--u)) calc(36 * var(--u)) calc(30 * var(--u));box-shadow:0 0 0 1px #000, 0 0 calc(90 * var(--u)) #d4b06a38, 0 0 calc(40 * var(--u)) #5082c829, 0 calc(24 * var(--u)) calc(60 * var(--u)) #000000bf, inset 0 0 calc(70 * var(--u)) #3f78be1a;background:radial-gradient(70% 50% at 50% 0,#4678be33,#0000 70%),linear-gradient(#090e1af7,#04070dfa);border-color:#f1dcaacc;flex-direction:column;display:flex}.house-root .room-daily .dy-frame:after{inset:calc(-16 * var(--u));border-width:calc(54 * var(--u));border-image-width:calc(54 * var(--u))}.house-root .room-daily .df-c{width:calc(26 * var(--u));height:calc(26 * var(--u));border:0 solid var(--rgh);z-index:3;filter:drop-shadow(0 0 calc(6 * var(--u)) #f1dcaacc);pointer-events:none;position:absolute}.house-root .room-daily .df-c.tl{left:calc(22 * var(--u));top:calc(22 * var(--u));border-width:2px 0 0 2px}.house-root .room-daily .df-c.tr{right:calc(22 * var(--u));top:calc(22 * var(--u));border-width:2px 2px 0 0}.house-root .room-daily .df-c.bl{left:calc(22 * var(--u));bottom:calc(22 * var(--u));border-width:0 0 2px 2px}.house-root .room-daily .df-c.br{right:calc(22 * var(--u));bottom:calc(22 * var(--u));border-width:0 2px 2px 0}.house-root .room-daily .df-head{column-gap:calc(24 * var(--u));padding-bottom:calc(14 * var(--u));grid-template-rows:auto auto;grid-template-columns:1fr auto;align-items:center;display:grid}.house-root .room-daily .df-title h2{font:600 calc(36 * var(--u)) / 1 \"Cinzel\", serif;letter-spacing:.12em;color:var(--rgh);text-shadow:0 0 calc(22 * var(--u)) #d4b06a80, 0 1px 0 #000}.house-root .room-daily .df-title p{margin-top:calc(6 * var(--u));font:italic 500 calc(21 * var(--u)) \"Cormorant Garamond\", Georgia, serif;color:var(--ink2)}.house-root .room-daily .df-ctl{align-items:center;gap:calc(12 * var(--u));justify-self:end;display:flex}.house-root .room-daily .df-ctl.off{opacity:.35;pointer-events:none}.house-root .room-daily .df-speed{border-radius:calc(4 * var(--u));background:#00000080;border:1px solid #d4b06a8c;display:flex;overflow:hidden}.house-root .room-daily .df-speed button{padding:0 calc(16 * var(--u));height:calc(38 * var(--u));font:600 calc(17 * var(--u)) \"Barlow Condensed\", sans-serif;letter-spacing:.08em;color:var(--ink2)}.house-root .room-daily .df-speed button+button{border-left:1px solid #d4b06a4d}.house-root .room-daily .df-speed button.on{color:#2a1d0c;background:linear-gradient(#f6e4b0,#d4b06a 60%,#a98443)}.house-root .room-daily .df-play{width:calc(46 * var(--u));height:calc(38 * var(--u));border-radius:calc(4 * var(--u));color:var(--rgh);border:1px solid var(--rg);box-shadow:0 0 calc(14 * var(--u)) #d4b06a4d;background:#00000080;place-items:center;display:grid}.house-root .room-daily .df-play svg{width:calc(20 * var(--u));height:calc(20 * var(--u))}.house-root .room-daily .df-play:hover{background:#d4b06a33}.house-root .room-daily .df-clock{align-items:baseline;gap:calc(10 * var(--u));margin-top:calc(12 * var(--u));display:flex}.house-root .room-daily .df-clock small,.house-root .room-daily .df-crowd small{font:500 calc(14 * var(--u)) \"Barlow\", sans-serif;letter-spacing:.2em;text-transform:uppercase;color:var(--ink3)}.house-root .room-daily .df-clock b{font:600 calc(40 * var(--u)) / 1 \"Barlow Condensed\", sans-serif;color:var(--ink);text-align:right;min-width:2ch}.house-root .room-daily .df-clock em{font:500 calc(20 * var(--u)) \"Barlow Condensed\", sans-serif;color:var(--ink2);letter-spacing:.06em;font-style:normal}.house-root .room-daily .df-crowd{justify-self:end;align-items:baseline;gap:calc(12 * var(--u));margin-top:calc(12 * var(--u));display:flex}.house-root .room-daily .df-crowd small{letter-spacing:.1em;text-transform:none;font-size:calc(16 * var(--u))}.house-root .room-daily .df-crowd b{font:600 calc(26 * var(--u)) / 1 \"Barlow Condensed\", sans-serif;color:var(--rc)}.house-root .room-daily .df-plot{border-radius:calc(3 * var(--u));min-height:0;box-shadow:inset 0 0 calc(40 * var(--u)) #000000b3, 0 0 calc(30 * var(--u)) #5082c81f;background:radial-gradient(80% 70% at 50% 40%,#1624428c,#050810f2);border:1px solid #d4b06a80;flex:1 1 0;position:relative;overflow:hidden}.house-root .room-daily .df-lw,.house-root .room-daily .df-ov{width:100%;height:100%;position:absolute;inset:0}.house-root .room-daily .df-ov{pointer-events:none;z-index:5}.house-root .room-daily .df-lw{z-index:1}.house-root .room-daily .df-msg{place-content:center;justify-items:center;gap:calc(12 * var(--u));text-align:center;z-index:2;background:#050810d1;display:grid;position:absolute;inset:0}.house-root .room-daily .df-msg[hidden]{display:none}.house-root .room-daily .df-msg b{font:600 calc(24 * var(--u)) \"Cinzel\", serif;letter-spacing:.08em;color:var(--rgh)}.house-root .room-daily .df-msg span{font:italic 500 calc(18 * var(--u)) \"Cormorant Garamond\", serif;color:var(--ink2)}.house-root .room-daily .df-msg button{height:calc(36 * var(--u));padding:0 calc(20 * var(--u));font:700 calc(13 * var(--u)) \"Cinzel\", serif;letter-spacing:.14em;color:#2a1d0c;border-radius:calc(3 * var(--u));background:linear-gradient(#f6e4b0,#d4b06a 55%,#a98443)}.house-root .room-daily .pm-orb{width:calc(46 * var(--u));height:calc(46 * var(--u));background:radial-gradient(circle,#fff6dc,#d4b06a 40%,#0000 70%);border-radius:50%;animation:1.6s ease-in-out infinite dy-pulse}@keyframes dy-pulse{50%{opacity:.6;transform:scale(1.3)}}.house-root .room-daily .df-stamp{z-index:3;pointer-events:none;opacity:0;place-content:center;justify-items:center;display:grid;position:absolute;inset:0}.house-root .room-daily .df-stamp[hidden]{display:none}.house-root .room-daily .df-stamp.go{animation:4.2s ease-out forwards dy-stamp}.house-root .room-daily .stm-g{font:700 calc(230 * var(--u)) / 1 \"Cinzel\", serif;color:var(--rgh);text-shadow:0 0 calc(60 * var(--u)) #f1dcaae6, 0 0 calc(12 * var(--u)) #000}.house-root .room-daily .df-stamp small{font:600 calc(24 * var(--u)) \"Cinzel\", serif;letter-spacing:.5em;color:var(--rg);text-shadow:0 0 calc(18 * var(--u)) #000000e6}@keyframes dy-stamp{0%{opacity:0;transform:scale(1.8)}12%{opacity:1;transform:scale(1)}70%{opacity:1}to{opacity:0;transform:scale(.96)}}.house-root .room-daily .df-plan{height:calc(150 * var(--u));margin-top:calc(16 * var(--u));justify-content:center;gap:calc(10 * var(--u));flex-direction:column;flex:none;display:flex}.house-root .room-daily .pl-row{align-items:flex-end;gap:calc(14 * var(--u));display:flex}.house-root .room-daily .pl-grp{gap:calc(5 * var(--u));display:grid}.house-root .room-daily .pl-grp small,.house-root .room-daily .pl-f span{font:500 calc(12 * var(--u)) \"Barlow\", sans-serif;letter-spacing:.2em;text-transform:uppercase;color:var(--ink3)}.house-root .room-daily .pl-seg{border-radius:calc(3 * var(--u));background:#00000073;border:1px solid #d4b06a80;display:flex;overflow:hidden}.house-root .room-daily .pl-seg button{padding:0 calc(13 * var(--u));height:calc(42 * var(--u));font:600 calc(15 * var(--u)) \"Barlow Condensed\", sans-serif;letter-spacing:.1em;color:var(--ink2)}.house-root .room-daily .pl-seg button+button{border-left:1px solid #d4b06a4d}.house-root .room-daily .pl-seg button.on{color:var(--rgh);box-shadow:inset 0 -2px 0 var(--rg);background:#d4b06a38}.house-root .room-daily .pl-f{gap:calc(5 * var(--u));flex:1 1 0;min-width:0;display:grid;position:relative}.house-root .room-daily .pl-f input{width:100%;height:calc(42 * var(--u));padding:0 calc(10 * var(--u));font:600 calc(20 * var(--u)) \"Barlow Condensed\", sans-serif;color:var(--ink);border-radius:calc(3 * var(--u));background:#0000008c;border:1px solid #d4b06a59;outline:none}.house-root .room-daily .pl-f input::placeholder{color:var(--ink3);font-weight:400}.house-root .room-daily .pl-f.armed input{border-color:var(--rgh);box-shadow:0 0 calc(12 * var(--u)) #f1dcaa59, inset 0 0 calc(8 * var(--u)) #f1dcaa14}.house-root .room-daily .pl-f[data-f=stop] input,.house-root .room-daily .pl-f[data-f=mstop] input{color:var(--re)}.house-root .room-daily .pl-f[data-f=target] input,.house-root .room-daily .pl-f[data-f=mtarget] input{color:var(--rc)}.house-root .room-daily .pl-f[data-f=limit] input{color:var(--rgh)}.house-root .room-daily .pl-meas{right:calc(5 * var(--u));bottom:calc(6 * var(--u));height:calc(30 * var(--u));padding:0 calc(8 * var(--u));font:600 calc(11 * var(--u)) \"Cinzel\", serif;letter-spacing:.1em;color:var(--rg);border-radius:calc(2 * var(--u));background:#d4b06a14;border:1px solid #d4b06a73;position:absolute}.house-root .room-daily .pl-meas:hover{color:var(--rgh);background:#d4b06a40}.house-root .room-daily .pl-risk b{font:600 calc(26 * var(--u)) / 1 \"Barlow Condensed\", sans-serif;color:var(--rgh)}.house-root .room-daily .pl-risk em,.house-root .room-daily .pl-grp em{font:italic 500 calc(15 * var(--u)) \"Cormorant Garamond\", serif;color:var(--ink2);font-style:italic}.house-root .room-daily .pl-grp b{font:600 calc(22 * var(--u)) \"Barlow Condensed\", sans-serif;color:var(--ink);letter-spacing:.04em}.house-root .room-daily .pl-go{height:calc(54 * var(--u));padding:0 calc(22 * var(--u));border-radius:calc(3 * var(--u));font:700 calc(15 * var(--u)) / 1 \"Cinzel\", serif;letter-spacing:.14em;white-space:nowrap;color:#2a1d0c;box-shadow:0 0 calc(16 * var(--u)) #f1dcaa66, inset 0 1px 0 #fffae1cc;background:linear-gradient(#f6e4b0,#d4b06a 55%,#a98443);flex:none}.house-root .room-daily .pl-go:disabled{cursor:default;color:#d4b06a80;background:#1e1a12bf;box-shadow:inset 0 0 0 1px #d4b06a47}.house-root .room-daily .pl-go.ghost{color:var(--rgh);border:1px solid var(--rg);box-shadow:none;background:#00000080}.house-root .room-daily .pl-go.ghost:hover{background:#d4b06a2e}.house-root .room-daily .pl-sub{justify-content:space-between;gap:calc(20 * var(--u));min-height:calc(26 * var(--u));font:500 calc(16 * var(--u)) \"Barlow\", sans-serif;color:var(--ink2);display:flex}.house-root .room-daily .pl-hint{color:var(--re);text-align:right;font-family:Cormorant Garamond,Georgia,serif;font-style:italic;font-size:calc(18 * var(--u))}.house-root .room-daily .pl-done{align-items:flex-start;gap:calc(6 * var(--u));flex-direction:column}.house-root .room-daily .pl-done b{font:600 calc(26 * var(--u)) \"Cinzel\", serif;color:var(--rgh)}.house-root .room-daily .pl-done span{font:italic 500 calc(19 * var(--u)) \"Cormorant Garamond\", serif;color:var(--ink2)}.house-root .room-daily .pl-sealed{align-items:center;gap:calc(26 * var(--u));height:100%}.house-root .room-daily .sg{width:calc(116 * var(--u));height:calc(116 * var(--u));border:2px solid var(--rgh);box-shadow:0 0 calc(30 * var(--u)) #f1dcaa73, inset 0 0 calc(20 * var(--u)) #f1dcaa33;background:radial-gradient(circle,#f1dcaa33,#00000080);border-radius:50%;flex:none;place-content:center;justify-items:center;display:grid}.house-root .room-daily .sg-l{font:700 calc(64 * var(--u)) / 1 \"Cinzel\", serif;color:var(--rgh);text-shadow:0 0 calc(18 * var(--u)) #f1dcaacc, 0 -1px 0 #000}.house-root .room-daily .sg small{font:600 calc(11 * var(--u)) \"Cinzel\", serif;letter-spacing:.3em;color:var(--rg);margin-top:calc(2 * var(--u))}.house-root .room-daily .sg-t{gap:calc(6 * var(--u));flex:1;min-width:0;display:grid}.house-root .room-daily .sg-t .ln1{font:600 calc(28 * var(--u)) / 1.1 \"Cinzel\", serif;color:var(--rgh);letter-spacing:.04em}.house-root .room-daily .sg-t span{font:500 calc(18 * var(--u)) / 1.3 \"Barlow\", sans-serif;color:var(--ink2)}.house-root .room-daily .sg-t i{font-style:normal;font-weight:700}.house-root .room-daily .sg-t .sg-light{font:600 calc(22 * var(--u)) \"Barlow Condensed\", sans-serif;color:var(--rc);letter-spacing:.06em}.house-root .room-daily .sg-next{text-align:right;gap:calc(6 * var(--u));padding-left:calc(26 * var(--u));border-left:1px solid #d4b06a4d;flex:none;display:grid}.house-root .room-daily .sg-next small{font:italic 500 calc(18 * var(--u)) \"Cormorant Garamond\", serif;color:var(--ink2);max-width:calc(250 * var(--u))}.house-root .room-daily .sg-next b{font:600 calc(38 * var(--u)) / 1 \"Barlow Condensed\", sans-serif;letter-spacing:.06em;color:var(--rgh)}.house-root .room-daily .ds-row{gap:calc(8 * var(--u));padding:calc(10 * var(--u)) calc(18 * var(--u)) 0;grid-template-columns:repeat(3,1fr);display:grid}.house-root .room-daily .sl{align-content:start;justify-items:center;gap:calc(7 * var(--u));text-align:center;display:grid}.house-root .room-daily .sl-disc{width:calc(84 * var(--u));height:calc(84 * var(--u));color:#b9ae9773;border:calc(3 * var(--u)) double #b9ae9759;background:radial-gradient(circle at 35% 30%,#3c404ee6,#0e111af2);border-radius:50%;place-items:center;transition:all .4s;display:grid}.house-root .room-daily .sl-disc svg{width:calc(40 * var(--u));height:calc(40 * var(--u))}.house-root .room-daily .sl b{font:600 calc(15 * var(--u)) \"Cinzel\", serif;letter-spacing:.16em;color:var(--ink3)}.house-root .room-daily .sl small{font:500 calc(14 * var(--u)) / 1.2 \"Barlow\", sans-serif;color:var(--ink3);min-height:calc(34 * var(--u))}.house-root .room-daily .sl.ok .sl-disc{color:#2a1d0c;border-color:var(--rgh);box-shadow:0 0 calc(24 * var(--u)) #f1dcaaa6, inset 0 0 calc(10 * var(--u)) #fffae199;background:radial-gradient(circle at 35% 30%,#fff1c4,#d4b06a 55%,#8a6a30)}.house-root .room-daily .sl.ok b{color:var(--rgh)}.house-root .room-daily .sl.ok small{color:var(--ink2)}.house-root .room-daily .sl.broken .sl-disc{color:#3a1c0e;box-shadow:0 0 calc(14 * var(--u)) #e2875a66;background:radial-gradient(circle at 35% 30%,#d9946a,#b8673a 55%,#6d3a1c);border-style:dashed;border-color:#b8673a}.house-root .room-daily .sl.broken .sl-disc:after{content:\"\";width:calc(4 * var(--u));height:calc(70 * var(--u));background:linear-gradient(#0000,#2a1208 30% 70%,#0000);position:absolute;transform:rotate(24deg)}.house-root .room-daily .sl-disc{position:relative;overflow:hidden}.house-root .room-daily .sl.broken b,.house-root .room-daily .sl.broken small{color:var(--re)}.house-root .room-daily .dp-body{padding:calc(2 * var(--u)) calc(30 * var(--u)) 0;gap:calc(14 * var(--u));display:grid}.house-root .room-daily .dp-pair{align-items:baseline;gap:calc(8 * var(--u));white-space:nowrap;display:flex}.house-root .room-daily .dp-pair b{font:600 calc(24 * var(--u)) \"Cinzel\", serif;color:var(--rgh);letter-spacing:.06em}.house-root .room-daily .dp-pair span{font:500 calc(18 * var(--u)) \"Barlow Condensed\", sans-serif;color:var(--ink3)}.house-root .room-daily .dp-pair em{font:600 calc(13 * var(--u)) \"Barlow\", sans-serif;letter-spacing:.08em;padding:calc(4 * var(--u)) calc(8 * var(--u));white-space:nowrap;border:1px solid;border-radius:99px;margin-left:auto;font-style:normal}.house-root .room-daily .dp-pair em.long{color:var(--rc)}.house-root .room-daily .dp-pair em.short{color:var(--re)}.house-root .room-daily .dp-pair em.none{color:var(--ink3);border-color:#7d756380}.house-root .room-daily .dp-grid{gap:calc(12 * var(--u)) calc(20 * var(--u));grid-template-columns:1fr 1fr;display:grid}.house-root .room-daily .dp-grid>div{gap:calc(3 * var(--u));padding-bottom:calc(8 * var(--u));border-bottom:1px solid #d4b06a24;display:grid}.house-root .room-daily .dp-grid small,.house-root .room-daily .dp-r small{font:500 calc(12 * var(--u)) \"Barlow\", sans-serif;letter-spacing:.2em;color:var(--ink3)}.house-root .room-daily .dp-grid b{font:600 calc(26 * var(--u)) / 1 \"Barlow Condensed\", sans-serif;color:var(--ink)}.house-root .room-daily .dp-r{gap:calc(2 * var(--u));padding-top:calc(4 * var(--u));justify-items:center;display:grid}.house-root .room-daily .dp-r b{font:600 calc(66 * var(--u)) / 1 \"Barlow Condensed\", sans-serif;text-shadow:0 0 calc(24 * var(--u)) currentColor}.house-root .room-daily .dp-r.up b{color:var(--rc)}.house-root .room-daily .dp-r.dn b{color:var(--re)}.house-root .room-daily .dp-r.nil b{color:var(--ink3);text-shadow:none;font-size:calc(40 * var(--u));letter-spacing:.1em;padding-top:calc(12 * var(--u))}.house-root .room-daily .dh-days{gap:calc(6 * var(--u));padding:0 calc(22 * var(--u));display:grid}.house-root .room-daily .dd{grid-template-columns:1fr calc(44 * var(--u)) calc(92 * var(--u));align-items:center;gap:calc(10 * var(--u));height:calc(36 * var(--u));padding:0 calc(12 * var(--u));border-radius:calc(4 * var(--u));background:#0000004d;border:1px solid #d4b06a33;display:grid}.house-root .room-daily .dd span{font:500 calc(15 * var(--u)) \"Barlow\", sans-serif;letter-spacing:.04em;color:var(--ink2)}.house-root .room-daily .dd b{font:700 calc(26 * var(--u)) / 1 \"Cinzel\", serif;color:var(--rgh);text-align:center}.house-root .room-daily .dd em{font:600 calc(15 * var(--u)) \"Barlow Condensed\", sans-serif;color:var(--rc);text-align:right;font-style:normal}.house-root .room-daily .dd.none b{color:var(--ink3);opacity:.5}.house-root .room-daily .dd.now{border-color:#f1dcaa8c}", ff = ".house-root .room-forge:before{content:\"\";z-index:0;pointer-events:none;background:radial-gradient(58% 62%,#04070e1f,#03050ab8 100%),#03050a42;position:absolute;inset:0}.house-root .room-forge .fg-grid{width:calc(1920 * var(--u));height:calc(1080 * var(--u));z-index:1;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}.house-root .room-forge .rp-small{font-size:calc(19 * var(--u));padding-top:calc(13 * var(--u));padding-bottom:calc(8 * var(--u))}.house-root .room-forge .fg-sub{text-align:center;font:italic 500 calc(18 * var(--u)) / 1 \"Cormorant Garamond\", Georgia, serif;color:var(--ink2);margin-top:calc(-4 * var(--u))}.house-root .room-forge .fg-char{left:calc(70 * var(--u));top:calc(70 * var(--u));width:calc(400 * var(--u));height:calc(122 * var(--u))}.house-root .room-forge .fg-char>div{align-items:center;gap:calc(14 * var(--u));padding:0 calc(22 * var(--u));display:flex;position:absolute;inset:0}.house-root .room-forge .cc-portrait{width:calc(86 * var(--u));height:calc(86 * var(--u));border:calc(2 * var(--u)) solid var(--rg);box-shadow:0 0 calc(14 * var(--u)) #d4b06a59;border-radius:50%;flex:none;overflow:hidden}.house-root .room-forge .cc-portrait img{object-fit:cover;object-position:50% 22%;width:100%;height:100%;display:block}.house-root .room-forge .cc-body{flex:1;min-width:0}.house-root .room-forge .cc-body h2{font:600 calc(25 * var(--u)) / 1 \"Cinzel\", serif;letter-spacing:.08em;color:var(--rgh);text-shadow:0 0 calc(12 * var(--u)) #d4b06a4d;white-space:nowrap;margin:0}.house-root .room-forge .cc-lv{margin-top:calc(9 * var(--u));font:500 calc(13 * var(--u)) \"Barlow\", sans-serif;letter-spacing:.14em;color:var(--ink2);justify-content:space-between;align-items:baseline;display:flex}.house-root .room-forge .cc-lv b{font:600 calc(17 * var(--u)) \"Barlow Condensed\", sans-serif;color:var(--rgh)}.house-root .room-forge .cc-lv em{letter-spacing:0;color:var(--ink);font-style:normal;font-size:calc(13 * var(--u))}.house-root .room-forge .cc-bar{height:calc(7 * var(--u));margin:calc(5 * var(--u)) 0;background:#0000008c;border:1px solid #d4b06a59;border-radius:99px;overflow:hidden}.house-root .room-forge .cc-bar i{height:100%;box-shadow:0 0 calc(8 * var(--u)) #f1dcaa80;background:linear-gradient(90deg,#9c7a3e,#f1dcaa);display:block}.house-root .room-forge .cc-rank{font:500 calc(13 * var(--u)) \"Barlow\", sans-serif;letter-spacing:.2em;color:var(--ink3);justify-content:space-between;align-items:baseline;display:flex}.house-root .room-forge .cc-rank b{font:600 calc(16 * var(--u)) \"Cinzel\", serif;color:var(--rc);letter-spacing:.06em}.house-root .room-forge .fg-vault{left:calc(70 * var(--u));top:calc(232 * var(--u));width:calc(400 * var(--u));height:calc(578 * var(--u))}.house-root .room-forge .fg-tubes{left:calc(16 * var(--u));right:calc(16 * var(--u));top:calc(78 * var(--u));bottom:calc(76 * var(--u));gap:calc(2 * var(--u));grid-template-columns:repeat(5,1fr);display:grid;position:absolute}.house-root .room-forge .fg-tube{justify-items:center;gap:calc(3 * var(--u));grid-template-rows:1fr auto auto;min-height:0;display:grid}.house-root .room-forge .fg-tube .glass{width:calc(58 * var(--u));border-radius:calc(29 * var(--u)) calc(29 * var(--u)) calc(9 * var(--u)) calc(9 * var(--u));border:calc(1.5 * var(--u)) solid #9fdcff52;height:100%;box-shadow:inset 0 0 calc(18 * var(--u)) #78b4ff1f, 0 0 calc(10 * var(--u)) #0009;background:linear-gradient(90deg,#ffffff17,#ffffff04 38%,#ffffff05 62%,#ffffff14),linear-gradient(#28466e38,#060a12d9);position:relative;overflow:hidden}.house-root .room-forge .fg-tube .glass:before{content:\"\";opacity:.55;background:linear-gradient(#ffffff57,#fff0 70%);border-radius:99px;width:10%;position:absolute;top:5%;bottom:8%;left:14%}.house-root .room-forge .fg-tube .glass:after{content:\"\";height:calc(9 * var(--u));box-shadow:0 calc(-1 * var(--u)) calc(6 * var(--u)) #d4b06a66;background:linear-gradient(#d4b06a,#7b5d2b);position:absolute;bottom:0;left:0;right:0}.house-root .room-forge .fg-tube .liq{left:0;right:0;bottom:calc(9 * var(--u));background:linear-gradient(180deg, transparent, var(--glow));opacity:0;height:0;position:absolute}.house-root .room-forge .fg-tube.has .liq{opacity:.26;height:36%}.house-root .room-forge .fg-tube .gem{width:calc(50 * var(--u));height:calc(72 * var(--u));filter:drop-shadow(0 0 calc(10 * var(--u)) var(--glow)) grayscale(.9) brightness(.45);opacity:.5;position:absolute;top:44%;left:50%;transform:translate(-50%,-50%)}.house-root .room-forge .fg-tube.has .gem{filter:drop-shadow(0 0 calc(12 * var(--u)) var(--glow));opacity:1;animation:4s ease-in-out infinite alternate fg-bob}.house-root .room-forge .fg-tube .gem img{object-fit:contain;width:100%;height:100%;display:block}.house-root .room-forge .fg-tube.need .glass{box-shadow:inset 0 0 calc(18 * var(--u)) #f1dcaa29, 0 0 calc(16 * var(--u)) #d4b06a80;border-color:#f1dcaad9}.house-root .room-forge .fg-tube b{font:600 calc(9 * var(--u)) \"Cinzel\", serif;text-transform:uppercase;color:var(--ink2);white-space:nowrap;letter-spacing:0}.house-root .room-forge .fg-tube .n{font:600 calc(26 * var(--u)) / 1 \"Barlow Condensed\", sans-serif;color:var(--rgh);font-style:normal}.house-root .room-forge .fg-tube:not(.has) .n{color:var(--ink3)}.house-root .room-forge .fg-foot{left:calc(26 * var(--u));right:calc(26 * var(--u));bottom:calc(18 * var(--u));text-align:center;text-wrap:balance;font:italic 500 calc(16 * var(--u)) / 1.3 \"Cormorant Garamond\", Georgia, serif;color:var(--ink2);position:absolute}@keyframes fg-bob{0%{transform:translate(-50%, calc(-50% - 3 * var(--u)))}to{transform:translate(-50%, calc(-50% + 5 * var(--u)))}}.house-root .room-forge .fg-forge{left:calc(520 * var(--u));top:calc(70 * var(--u));width:calc(880 * var(--u));height:calc(740 * var(--u))}.house-root .room-forge .fg-forge:before{background:radial-gradient(60% 46% at 50% 44%,#5a8cdc29,#0000 70%);border-color:#d4b06a38}.house-root .room-forge .fg-stage{left:0;right:0;top:calc(80 * var(--u));height:calc(330 * var(--u));position:absolute}.house-root .room-forge .fg-anvil{perspective:calc(900 * var(--u));position:absolute;inset:0}.house-root .room-forge .fa-glow{width:calc(640 * var(--u));height:calc(190 * var(--u));margin:calc(-95 * var(--u)) 0 0 calc(-320 * var(--u));filter:blur(calc(6 * var(--u)));background:radial-gradient(#bee1ff8c,#78aaff42 32%,#d4b06a29 55%,#0000 72%);border-radius:50%;position:absolute;top:72%;left:50%}.house-root .room-forge .fa-ring{--d:300;width:calc(var(--d) * var(--u));height:calc(var(--d) * var(--u));margin:calc(var(--d) * -.5 * var(--u)) 0 0 calc(var(--d) * -.5 * var(--u));-webkit-mask:radial-gradient(farthest-side, transparent calc(100% - 3.5 * var(--u)), #000 calc(100% - 3 * var(--u)));-webkit-mask:radial-gradient(farthest-side, transparent calc(100% - 3.5 * var(--u)), #000 calc(100% - 3 * var(--u)));mask:radial-gradient(farthest-side, transparent calc(100% - 3.5 * var(--u)), #000 calc(100% - 3 * var(--u)));border-radius:50%;animation:14s linear infinite fg-spin;position:absolute;top:72%;left:50%;transform:rotateX(72deg)rotate(0)}.house-root .room-forge .fa-ring.r1{--d:300;filter:drop-shadow(0 0 calc(8 * var(--u)) #9fdcff);background:conic-gradient(#bee1ff40,#eaf6ff 12%,#bee1ff40 40%,#bee1ff26 70%,#bfe4ff 90%,#bee1ff40);animation-duration:11s}.house-root .room-forge .fa-ring.r2{--d:430;filter:drop-shadow(0 0 calc(8 * var(--u)) #f1c878cc);background:conic-gradient(from 90deg,#d4b06a4d,#f6e4b0 14%,#d4b06a40 42%,#d4b06a26 70%,#f1dcaa 88%,#d4b06a4d);animation-duration:17s;animation-direction:reverse}.house-root .room-forge .fa-ring.r3{--d:560;filter:drop-shadow(0 0 calc(6 * var(--u)) #9fdcff99);background:conic-gradient(from 200deg,#96c8ff1a,#cfeaff 10%,#96c8ff1f 30%,#96c8ff1a 65%,#9fdcff 85%,#96c8ff1a);animation-duration:24s}.house-root .room-forge .fa-disc{width:calc(230 * var(--u));height:calc(46 * var(--u));margin:calc(-23 * var(--u)) 0 0 calc(-115 * var(--u));box-shadow:0 0 calc(30 * var(--u)) #bee1ffbf, 0 calc(8 * var(--u)) calc(14 * var(--u)) #0009, inset 0 calc(2 * var(--u)) 0 #fff4cdcc;background:radial-gradient(at 50% 35%,#f6e4b0,#b8924d 40%,#5d4520 78%,#2b1f0d);border-radius:50%;position:absolute;top:72%;left:50%}@keyframes fg-spin{to{transform:rotateX(72deg)rotate(360deg)}}.house-root .room-forge .fg-relic{left:50%;top:calc(-6 * var(--u));width:calc(290 * var(--u));height:calc(250 * var(--u));margin-left:calc(-145 * var(--u));animation:4.6s ease-in-out infinite alternate fg-float;position:absolute}.house-root .room-forge .fg-relic img{object-fit:contain;width:100%;height:100%;filter:drop-shadow(0 calc(10 * var(--u)) calc(22 * var(--u)) #000000b3) drop-shadow(0 0 calc(24 * var(--u)) #bee1ff80);display:block}.house-root .room-forge .fg-relic.dim img{filter:saturate(.6) brightness(.72) drop-shadow(0 calc(10 * var(--u)) calc(22 * var(--u)) #000000b3)}.house-root .room-forge .fg-relic.hidden{opacity:0}.house-root .room-forge .fg-relic.appear{animation:.9s cubic-bezier(.2,.8,.2,1) both fg-appear}@keyframes fg-float{0%{transform:translateY(calc(2 * var(--u)))}to{transform:translateY(calc(-12 * var(--u)))}}@keyframes fg-appear{0%{opacity:0;transform:translateY(calc(70 * var(--u))) scale(.5);filter:brightness(3)}60%{opacity:1;transform:translateY(calc(-18 * var(--u))) scale(1.08);filter:brightness(1.8)}to{opacity:1;filter:brightness();transform:translateY(0)scale(1)}}.house-root .room-forge .fg-flare{width:calc(900 * var(--u));height:calc(900 * var(--u));margin:calc(-450 * var(--u)) 0 0 calc(-450 * var(--u));pointer-events:none;opacity:0;background:radial-gradient(circle,#fffffff2,#bee1ff99 12%,#f1c87857 28%,#0000 56%);border-radius:50%;position:absolute;top:72%;left:50%}.house-root .room-forge .fg-flare.go{animation:1.3s ease-out fg-flare}@keyframes fg-flare{0%{opacity:0;transform:scale(.15)}18%{opacity:1;transform:scale(.6)}to{opacity:0;transform:scale(1.25)}}.house-root .room-forge .fg-stage.flaring .fa-ring{filter:brightness(2.4) drop-shadow(0 0 calc(18 * var(--u)) #fff);transition:filter .15s}.house-root .room-forge .fg-stage.flaring .fa-glow{opacity:1;filter:blur(calc(6 * var(--u))) brightness(1.9)}.house-root .room-forge .fg-info{left:0;right:0;top:calc(414 * var(--u));text-align:center;position:absolute}.house-root .room-forge .fg-name{font:600 calc(44 * var(--u)) / 1 \"Cinzel\", serif;letter-spacing:.12em;color:var(--rgh);text-shadow:0 0 calc(22 * var(--u)) #f1dcaa66, 0 2px 0 #000;margin:0}.house-root .room-forge .fg-subt{margin-top:calc(6 * var(--u));font:italic 500 calc(23 * var(--u)) / 1.1 \"Cormorant Garamond\", Georgia, serif;color:var(--ro);text-shadow:0 0 calc(12 * var(--u)) #9fdcff59}.house-root .room-forge .fs-slots{justify-content:center;gap:calc(30 * var(--u));margin-top:calc(16 * var(--u));display:flex}.house-root .room-forge .fs-group{justify-items:center;gap:calc(6 * var(--u));display:grid}.house-root .room-forge .fs-row{gap:calc(5 * var(--u));display:flex}.house-root .room-forge .fs{width:calc(40 * var(--u));height:calc(46 * var(--u));border:calc(1.5 * var(--u)) dashed #d4b06a47;border-radius:calc(8 * var(--u));background:#00000080;place-items:center;display:grid}.house-root .room-forge .fs.on{border:calc(1.5 * var(--u)) solid #f1dcaa99;background:radial-gradient(circle, color-mix(in srgb, var(--glow) 35%, transparent), #00000059);box-shadow:0 0 calc(14 * var(--u)) var(--glow), inset 0 0 calc(8 * var(--u)) #ffffff1a}.house-root .room-forge .fs img{object-fit:contain;width:86%;height:86%;filter:drop-shadow(0 0 calc(5 * var(--u)) var(--glow))}.house-root .room-forge .fs-group small{font:600 calc(12 * var(--u)) \"Cinzel\", serif;letter-spacing:.08em;color:var(--ink3)}.house-root .room-forge .fs-group small b{font:600 calc(15 * var(--u)) \"Barlow Condensed\", sans-serif;color:var(--re);letter-spacing:.02em}.house-root .room-forge .fs-group.ok small b{color:var(--rgh)}.house-root .room-forge .fs-group.ok small{color:var(--ink2)}.house-root .room-forge .fg-says{margin-top:calc(14 * var(--u));font:400 calc(23 * var(--u)) / 1.2 \"Marcellus\", \"Cinzel\", serif;color:var(--ink)}.house-root .room-forge .fg-btn{margin:calc(14 * var(--u)) auto 0;width:calc(360 * var(--u));height:calc(62 * var(--u));border-radius:calc(5 * var(--u));color:#2a1d0c;font:700 calc(27 * var(--u)) / 1 \"Cinzel\", serif;letter-spacing:.3em;box-shadow:0 0 calc(26 * var(--u)) #f1c8788c, 0 calc(6 * var(--u)) calc(14 * var(--u)) #0000008c, inset 0 1px 0 #fffae1d9;cursor:pointer;background:linear-gradient(#f6e4b0,#d4b06a 55%,#a98443);border:1px solid #f1dcaa;padding-left:.3em;transition:transform .12s,box-shadow .2s;display:block}.house-root .room-forge .fg-btn:hover:not(:disabled){transform:translateY(calc(-2 * var(--u)));box-shadow:0 0 calc(40 * var(--u)) #ffdc8ccc, 0 calc(8 * var(--u)) calc(16 * var(--u)) #0000008c, inset 0 1px 0 #fffae1d9}.house-root .room-forge .fg-btn:disabled{cursor:default;color:var(--ink3);background:linear-gradient(#282e3ce6,#0e121cf2);border-color:#d4b06a47;box-shadow:inset 0 1px #ffffff0d}.house-root .room-forge .fg-req{margin-top:calc(10 * var(--u));justify-content:center;align-items:center;gap:calc(8 * var(--u));font:600 calc(15 * var(--u)) \"Cinzel\", serif;letter-spacing:.16em;color:var(--rg);display:flex}.house-root .room-forge .fg-req svg{width:calc(18 * var(--u));height:calc(18 * var(--u))}.house-root .room-forge .fg-gear{left:calc(1450 * var(--u));top:calc(70 * var(--u));width:calc(400 * var(--u));height:calc(740 * var(--u))}.house-root .room-forge .fg-atlas{left:50%;top:calc(88 * var(--u));width:calc(330 * var(--u));height:calc(584 * var(--u));margin-left:calc(-165 * var(--u));position:absolute}.house-root .room-forge .fg-fig{object-fit:contain;width:100%;height:100%;filter:drop-shadow(0 calc(10 * var(--u)) calc(20 * var(--u)) #0009);position:absolute;inset:0}.house-root .room-forge .fg-aura{inset:calc(-20 * var(--u));pointer-events:none;opacity:0;border-radius:50%;transition:opacity .8s;position:absolute}.house-root .room-forge .fg-aura[data-auras]{opacity:0}.house-root .room-forge .fg-aura[data-auras~=gold]{opacity:.5;background:radial-gradient(at 50% 55%,#f6c66a80,#0000 62%)}.house-root .room-forge .fg-aura[data-auras~=signal]{opacity:.5;background:radial-gradient(at 50% 55%,#6aa8ff80,#0000 62%)}.house-root .room-forge .fg-aura[data-auras~=moon]{opacity:.5;background:radial-gradient(at 50% 55%,#c8d2ff80,#0000 62%)}.house-root .room-forge .fg-aura[data-auras~=harmonic]{opacity:.6;background:radial-gradient(at 50% 30%,#f6c66a66,#0000 45%),radial-gradient(at 50% 70%,#5fe3e666,#0000 50%)}.house-root .room-forge .fg-slots{top:calc(92 * var(--u));height:calc(580 * var(--u));width:calc(100 * var(--u));z-index:2;flex-direction:column;justify-content:space-between;display:flex;position:absolute}.house-root .room-forge .fg-slots.left{left:calc(18 * var(--u))}.house-root .room-forge .fg-slots.right{right:calc(18 * var(--u));justify-content:space-around}.house-root .room-forge .fg-slot{justify-items:center;gap:calc(4 * var(--u));display:grid}.house-root .room-forge .fg-slot small{font:600 calc(11 * var(--u)) \"Cinzel\", serif;letter-spacing:.1em;color:var(--rg);white-space:nowrap;text-shadow:0 1px #000}.house-root .room-forge .fg-slot .box{width:calc(92 * var(--u));height:calc(92 * var(--u));border-radius:calc(6 * var(--u));box-shadow:inset 0 0 calc(14 * var(--u)) #000000b3, 0 0 0 1px #0009;background:radial-gradient(circle at 50% 40%,#28466e73,#05080fe0);border:1px solid #d4b06a80;place-items:center;display:grid;position:relative}.house-root .room-forge .fg-slot .box em{font:italic 500 calc(15 * var(--u)) \"Cormorant Garamond\", Georgia, serif;color:var(--ink3)}.house-root .room-forge .fg-slot .box img{object-fit:contain;width:90%;height:90%;filter:drop-shadow(0 0 calc(8 * var(--u)) #bee1ff8c);display:block}.house-root .room-forge .fg-slot.full .box{box-shadow:inset 0 0 calc(14 * var(--u)) #bee1ff33, 0 0 calc(16 * var(--u)) #d4b06a73;border-color:#f1dcaad9}.house-root .room-forge .fg-slot.land .box{animation:1.4s ease-out fg-land}@keyframes fg-land{0%{box-shadow:0 0 0 0 #fffffff2, 0 0 calc(40 * var(--u)) #fff}to{box-shadow:0 0 0 calc(34 * var(--u)) #bee1ff00, 0 0 calc(16 * var(--u)) #d4b06a73}}.house-root .room-forge .fg-count{left:0;right:0;bottom:calc(20 * var(--u));text-align:center;font:600 calc(23 * var(--u)) / 1 \"Cinzel\", serif;letter-spacing:.14em;color:var(--rg);position:absolute}.house-root .room-forge .fg-count b{color:var(--rgh);font-weight:700}.house-root .room-forge .fg-recipes{left:calc(70 * var(--u));top:calc(852 * var(--u));width:calc(1410 * var(--u));height:calc(178 * var(--u))}.house-root .room-forge .fr-strip{left:calc(20 * var(--u));right:calc(20 * var(--u));top:calc(48 * var(--u));bottom:calc(14 * var(--u));gap:calc(10 * var(--u));grid-template-columns:repeat(8,1fr);display:grid;position:absolute}.house-root .room-forge .fr-card{align-items:center;gap:calc(2 * var(--u));min-width:0;padding:calc(4 * var(--u)) calc(4 * var(--u)) calc(5 * var(--u));border-radius:calc(4 * var(--u));background:linear-gradient(#142036bf,#070b13e6);border:1px solid #d4b06a4d;flex-direction:column;transition:border-color .15s,box-shadow .15s;display:flex;position:relative}.house-root .room-forge .fr-card:hover{border-color:#f1dcaab3}.house-root .room-forge .fr-card.on{box-shadow:0 0 calc(18 * var(--u)) #d4b06a8c, inset 0 0 calc(16 * var(--u)) #d4b06a1f;border-color:#f1dcaa}.house-root .room-forge .fr-art{width:calc(58 * var(--u));height:calc(50 * var(--u));display:block}.house-root .room-forge .fr-art img{object-fit:contain;width:100%;height:100%;filter:drop-shadow(0 0 calc(7 * var(--u)) #bee1ff66);display:block}.house-root .room-forge .fr-nm{font:600 calc(10.5 * var(--u)) / 1.12 \"Cinzel\", serif;letter-spacing:.04em;color:var(--rgh);text-align:center;height:calc(23 * var(--u));align-items:center;display:grid}.house-root .room-forge .fr-cost{justify-content:center;gap:calc(2 * var(--u)) calc(6 * var(--u));flex-wrap:wrap;display:flex}.house-root .room-forge .chip{align-items:center;gap:calc(2 * var(--u));display:inline-flex}.house-root .room-forge .chip img{width:calc(17 * var(--u));height:calc(21 * var(--u));object-fit:contain}.house-root .room-forge .chip b{font:600 calc(14 * var(--u)) \"Barlow Condensed\", sans-serif;color:var(--rgh)}.house-root .room-forge .chip.short b{color:var(--re)}.house-root .room-forge .fr-req{font:600 calc(10.5 * var(--u)) \"Cinzel\", serif;letter-spacing:.08em;color:var(--ink3);text-align:center;padding-top:calc(5 * var(--u))}.house-root .room-forge .fr-req.ok{color:var(--rc)}.house-root .room-forge .fr-card.locked .fr-art,.house-root .room-forge .fr-card.locked .fr-nm{opacity:.42;filter:grayscale(.7)}.house-root .room-forge .fr-lock{right:calc(5 * var(--u));top:calc(5 * var(--u));width:calc(18 * var(--u));height:calc(18 * var(--u));color:var(--rg);z-index:1;position:absolute}.house-root .room-forge .fr-lock svg{width:100%;height:100%}.house-root .room-forge .fg-ora{left:calc(1520 * var(--u));top:calc(852 * var(--u));width:calc(330 * var(--u));height:calc(178 * var(--u));align-items:center;gap:calc(8 * var(--u));padding:0 calc(20 * var(--u)) 0 calc(6 * var(--u));display:flex}.house-root .room-forge .fg-ora .ora-orb{width:calc(100 * var(--u));height:calc(100 * var(--u));flex:none}.house-root .room-forge .fg-ora .ora-say{gap:calc(7 * var(--u));min-width:0;display:grid}.house-root .room-forge .fg-ora small{font:600 calc(11 * var(--u)) / 1.2 \"Cinzel\", serif;letter-spacing:.12em;color:var(--rc)}.house-root .room-forge .fg-ora q{quotes:none;font:italic 500 calc(18 * var(--u)) / 1.3 \"Cormorant Garamond\", Georgia, serif;color:var(--ink)}.house-root .room-forge .fg-fx{pointer-events:none;z-index:5;position:absolute;inset:0}.house-root .room-forge .fg-shard{width:calc(34 * var(--u));height:calc(48 * var(--u));filter:drop-shadow(0 0 calc(12 * var(--u)) var(--c)) drop-shadow(0 0 calc(5 * var(--u)) var(--c));display:block;position:absolute;transform:translate(-50%,-50%)}.house-root .room-forge .fg-shard img{object-fit:contain;width:100%;height:100%;display:block}.house-root .room-forge .fg-ghost{filter:drop-shadow(0 0 calc(18 * var(--u)) #bee1ffcc);display:block;position:absolute;transform:translate(-50%,-50%)}.house-root .room-forge .fg-ghost img{object-fit:contain;width:100%;height:100%;display:block}@media (prefers-reduced-motion:reduce){.house-root .room-forge .fa-ring,.house-root .room-forge .fg-relic,.house-root .room-forge .fg-tube .gem{animation:none}}", pf = ".house-root .room-codex:before{content:\"\";z-index:0;pointer-events:none;background:radial-gradient(60% 60% at 50% 48%,#04070e0d,#03050a99 100%),#03050a2e;position:absolute;inset:0}.house-root .room-codex .cx-grid{width:calc(1920 * var(--u));height:calc(1080 * var(--u));z-index:1;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}.house-root .room-codex .cx-char{left:calc(70 * var(--u));top:calc(70 * var(--u));width:calc(400 * var(--u));height:calc(122 * var(--u))}.house-root .room-codex .cx-char>div{align-items:center;gap:calc(14 * var(--u));padding:0 calc(22 * var(--u));display:flex;position:absolute;inset:0}.house-root .room-codex .cc-portrait{width:calc(86 * var(--u));height:calc(86 * var(--u));border:calc(2 * var(--u)) solid var(--rg);box-shadow:0 0 calc(14 * var(--u)) #d4b06a59;border-radius:50%;flex:none;overflow:hidden}.house-root .room-codex .cc-portrait img{object-fit:cover;object-position:50% 22%;width:100%;height:100%;display:block}.house-root .room-codex .cc-body{flex:1;min-width:0}.house-root .room-codex .cc-body h2{font:600 calc(25 * var(--u)) / 1 \"Cinzel\", serif;letter-spacing:.08em;color:var(--rgh);text-shadow:0 0 calc(12 * var(--u)) #d4b06a4d;white-space:nowrap;margin:0}.house-root .room-codex .cc-lv{margin-top:calc(9 * var(--u));font:500 calc(13 * var(--u)) \"Barlow\", sans-serif;letter-spacing:.14em;color:var(--ink2);justify-content:space-between;align-items:baseline;display:flex}.house-root .room-codex .cc-lv b{font:600 calc(17 * var(--u)) \"Barlow Condensed\", sans-serif;color:var(--rgh)}.house-root .room-codex .cc-lv em{letter-spacing:0;color:var(--ink);font-style:normal;font-size:calc(13 * var(--u))}.house-root .room-codex .cc-bar{height:calc(7 * var(--u));margin:calc(5 * var(--u)) 0;background:#0000008c;border:1px solid #d4b06a59;border-radius:99px;overflow:hidden}.house-root .room-codex .cc-bar i{height:100%;box-shadow:0 0 calc(8 * var(--u)) #f1dcaa80;background:linear-gradient(90deg,#9c7a3e,#f1dcaa);display:block}.house-root .room-codex .cc-rank{font:500 calc(13 * var(--u)) \"Barlow\", sans-serif;letter-spacing:.2em;color:var(--ink3);justify-content:space-between;align-items:baseline;display:flex}.house-root .room-codex .cc-rank b{font:600 calc(16 * var(--u)) \"Cinzel\", serif;color:var(--rc);letter-spacing:.06em}.house-root .room-codex .cx-shelves{left:calc(70 * var(--u));top:calc(236 * var(--u));width:calc(400 * var(--u));height:calc(770 * var(--u))}.house-root .room-codex .cx-list{left:calc(18 * var(--u));right:calc(18 * var(--u));top:calc(70 * var(--u));bottom:calc(18 * var(--u));gap:calc(8 * var(--u));grid-template-rows:repeat(7,1fr);display:grid;position:absolute}.house-root .room-codex .cx-row{align-items:center;gap:calc(14 * var(--u));padding:0 calc(16 * var(--u)) 0 calc(12 * var(--u));text-align:left;border-radius:calc(5 * var(--u));min-height:0;box-shadow:inset 0 1px 0 #f1dcaa24, 0 calc(3 * var(--u)) calc(10 * var(--u)) #00000080;background:linear-gradient(#1c263ad9,#0b101ceb);border:1px solid #d4b06a80;transition:box-shadow .25s,border-color .25s,transform .25s;display:flex;position:relative}.house-root .room-codex .cx-row:before{content:\"\";inset:calc(3 * var(--u));border-radius:calc(3 * var(--u));pointer-events:none;border:1px solid #d4b06a24;position:absolute}.house-root .room-codex .cx-row:hover{border-color:#f1dcaad9}.house-root .room-codex .cx-row.on{border-color:var(--rgh);box-shadow:inset 0 0 calc(24 * var(--u)) #d4b06a33, 0 0 calc(18 * var(--u)) #d4b06a73, 0 calc(3 * var(--u)) calc(10 * var(--u)) #00000080;background:linear-gradient(#3c321ee6,#14141af0)}.house-root .room-codex .cx-row.shut{background:linear-gradient(#0e131ee0,#070a11f0);border-color:#d4b06a3d}.house-root .room-codex .cx-row.shut.on{border-color:#d4b06ab3}.house-root .room-codex .cx-medal{width:calc(60 * var(--u));height:calc(60 * var(--u));color:var(--rgh);border:calc(2 * var(--u)) solid var(--rg);box-shadow:0 0 calc(10 * var(--u)) #d4b06a4d, inset 0 0 calc(8 * var(--u)) #000000b3;background:radial-gradient(circle at 50% 38%,#465a8280,#080c16f2 70%);border-radius:50%;flex:none;place-items:center;display:grid}.house-root .room-codex .cx-medal svg{width:56%;height:56%}.house-root .room-codex .cx-row.shut .cx-medal{color:var(--ink3);box-shadow:inset 0 0 calc(8 * var(--u)) #000000b3;border-color:#d4b06a4d}.house-root .room-codex .cx-rt{gap:calc(2 * var(--u));flex:1;min-width:0;display:grid}.house-root .room-codex .cx-rt b{align-items:baseline;gap:calc(12 * var(--u));font:600 calc(20 * var(--u)) / 1.1 \"Cinzel\", serif;color:var(--rgh);letter-spacing:.03em;white-space:nowrap;display:flex}.house-root .room-codex .cx-rt b i{font-style:normal;font:500 calc(17 * var(--u)) \"Cinzel\", serif;color:var(--ink2);min-width:calc(24 * var(--u))}.house-root .room-codex .cx-rt em{font:italic 500 calc(16 * var(--u)) / 1.15 \"Cormorant Garamond\", Georgia, serif;color:var(--ink)}.house-root .room-codex .cx-rt small{font:italic 500 calc(15 * var(--u)) / 1.1 \"Cormorant Garamond\", Georgia, serif;color:var(--ink3)}.house-root .room-codex .cx-row.shut .cx-rt b{color:var(--ink2)}.house-root .room-codex .cx-row.shut .cx-rt em{color:var(--ink3)}.house-root .room-codex .cx-st{width:calc(30 * var(--u));height:calc(30 * var(--u));color:var(--rgh);border-radius:50%;flex:none;place-items:center;display:grid}.house-root .room-codex .cx-st svg{width:64%;height:64%}.house-root .room-codex .cx-row.open .cx-st{border:calc(2 * var(--u)) solid var(--rg);box-shadow:0 0 calc(8 * var(--u)) #d4b06a59;background:#d4b06a1f}.house-root .room-codex .cx-row.shut .cx-st{width:calc(26 * var(--u));height:calc(26 * var(--u));color:var(--ink3)}.house-root .room-codex .cx-row.new:after{content:\"\";left:calc(-5 * var(--u));top:calc(-5 * var(--u));width:calc(13 * var(--u));height:calc(13 * var(--u));box-shadow:0 0 calc(10 * var(--u)) #f1dcaae6;background:radial-gradient(circle at 40% 35%,#fff3c9,#d4b06a 70%);border-radius:50%;position:absolute}.house-root .room-codex .cx-book{left:calc(500 * var(--u));top:calc(262 * var(--u));width:calc(1000 * var(--u));height:calc(720 * var(--u));position:absolute}.house-root .room-codex .cx-cover{left:calc(-18 * var(--u));right:calc(-18 * var(--u));top:calc(-4 * var(--u));height:calc(666 * var(--u));border-radius:calc(16 * var(--u));border:calc(3 * var(--u)) solid #b8903f;box-shadow:0 calc(30 * var(--u)) calc(60 * var(--u)) #000000bf, inset 0 0 0 calc(6 * var(--u)) #0a1220, inset 0 0 0 calc(7 * var(--u)) #d4b06a8c, inset 0 0 calc(40 * var(--u)) #0009, 0 0 calc(40 * var(--u)) #d4b06a26;background:linear-gradient(#1b2a4a,#0b1424 60%,#070c18);position:absolute}.house-root .room-codex .cx-leaves{left:0;right:0;top:calc(14 * var(--u));height:calc(630 * var(--u));filter:drop-shadow(0 calc(6 * var(--u)) calc(8 * var(--u)) #00000080);grid-template-columns:1fr 1fr;gap:0;display:grid;position:absolute}.house-root .room-codex .cx-page{padding:calc(30 * var(--u)) calc(40 * var(--u)) calc(30 * var(--u));color:#2a1c0e;box-shadow:inset 0 0 calc(60 * var(--u)) #78501e59, inset 0 0 0 calc(3 * var(--u)) #c29a52, inset 0 0 0 calc(4 * var(--u)) #6a4a1c;background:radial-gradient(85% 70% at 50% 42%,#f8ebc9 0%,#efdcaa 58%,#d8b87a 100%);position:relative;overflow:hidden}.house-root .room-codex .cx-left{border-radius:calc(14 * var(--u)) 0 0 calc(14 * var(--u));transform-origin:100%;transform:perspective(2400px)rotateY(1.6deg)}.house-root .room-codex .cx-right{border-radius:0 calc(14 * var(--u)) calc(14 * var(--u)) 0;transform-origin:0;transform:perspective(2400px)rotateY(-1.6deg)}.house-root .room-codex .cx-page:before{content:\"\";pointer-events:none;mix-blend-mode:multiply;opacity:.55;background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' seed='4' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .45  0 0 0 0 .32  0 0 0 0 .16  0 0 0 .7 -.12'/></filter><rect width='220' height='220' filter='url(%23n)'/></svg>\");position:absolute;inset:0}.house-root .room-codex .cx-page:after{content:\"\";pointer-events:none;position:absolute;inset:0}.house-root .room-codex .cx-left:after{background:linear-gradient(270deg,#46280a80,#46280a1f 9%,#0000 18%),linear-gradient(90deg,#6e46194d,#0000 6%)}.house-root .room-codex .cx-right:after{background:linear-gradient(90deg,#46280a80,#46280a1f 9%,#0000 18%),linear-gradient(270deg,#6e46194d,#0000 6%)}.house-root .room-codex .cx-page>*{z-index:1;position:relative}.house-root .room-codex .cx-spine{left:50%;top:calc(8 * var(--u));width:calc(18 * var(--u));height:calc(642 * var(--u));pointer-events:none;background:linear-gradient(90deg,#0000,#1e0e048c 40%,#1e0e04b3 50%,#1e0e048c 60%,#0000);position:absolute;transform:translate(-50%)}.house-root .room-codex .cx-ribbon{left:calc(50% - 22 * var(--u));top:calc(2 * var(--u));width:calc(44 * var(--u));height:calc(300 * var(--u));z-index:3;pointer-events:none;clip-path:polygon(0 0,100% 0,100% 100%,50% calc(100% - 26px),0 100%);filter:drop-shadow(0 calc(4 * var(--u)) calc(5 * var(--u)) #0009);background:linear-gradient(90deg,#12285a,#2f56a8 38%,#3c68c4 52%,#1c3a82 78%,#0f2250);position:absolute;box-shadow:inset 0 0 0 1px #96beff40}.house-root .room-codex .cx-ribbon:after{content:\"\";inset:0 calc(6 * var(--u));border-left:1px solid #d4b06a80;border-right:1px solid #d4b06a80;position:absolute}.house-root .room-codex .cx-star{margin:calc(-4 * var(--u)) auto 0;width:calc(46 * var(--u));height:calc(46 * var(--u));color:#8a6420;-webkit-mask:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><path d='M24 2l3.4 17.2L45 24l-17.6 4.8L24 46l-3.4-17.2L3 24l17.6-4.8Z' fill='black'/><circle cx='24' cy='24' r='19' fill='none' stroke='black' stroke-width='1.4'/><circle cx='24' cy='24' r='4' fill='white'/></svg>\") 50%/contain no-repeat;background:currentColor;display:block;-webkit-mask:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><path d='M24 2l3.4 17.2L45 24l-17.6 4.8L24 46l-3.4-17.2L3 24l17.6-4.8Z' fill='black'/><circle cx='24' cy='24' r='19' fill='none' stroke='black' stroke-width='1.4'/></svg>\") 50%/contain no-repeat;mask:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><path d='M24 2l3.4 17.2L45 24l-17.6 4.8L24 46l-3.4-17.2L3 24l17.6-4.8Z' fill='black'/><circle cx='24' cy='24' r='19' fill='none' stroke='black' stroke-width='1.4'/></svg>\") 50%/contain no-repeat}.house-root .room-codex .cx-num{text-align:center;font:600 calc(26 * var(--u)) / 1 \"Cinzel\", serif;color:#3a2610;margin-top:calc(4 * var(--u));letter-spacing:.06em}.house-root .room-codex .cx-h{text-align:center;margin:calc(8 * var(--u)) 0 calc(16 * var(--u));font:400 calc(33 * var(--u)) / 1.1 \"Marcellus\", Georgia, serif;color:#14223f;letter-spacing:.005em;white-space:nowrap}.house-root .room-codex .cx-paras{gap:calc(13 * var(--u));display:grid}.house-root .room-codex .cx-para{gap:calc(14 * var(--u));align-items:flex-start;display:flex}.house-root .room-codex .cx-cap{width:calc(46 * var(--u));height:calc(46 * var(--u));margin-top:calc(2 * var(--u));border:calc(2.5 * var(--u)) solid #8a6420;border-radius:calc(3 * var(--u));box-shadow:inset 0 0 0 calc(2 * var(--u)) #e9d29a, inset 0 0 0 calc(3 * var(--u)) #7d5a1c, 0 calc(1 * var(--u)) calc(3 * var(--u)) #3c230866;background:radial-gradient(circle at 35% 30%,#e0c78d,#b88f48 80%);flex:none;place-items:center;font-style:normal;display:grid}.house-root .room-codex .cx-cap b{font:700 calc(30 * var(--u)) / 1 \"Cinzel\", Georgia, serif;color:#2a1608}.house-root .room-codex .cx-para p{min-width:0;font:400 calc(17 * var(--u)) / 1.38 Georgia, \"Times New Roman\", serif;color:#2e2012;text-wrap:pretty;flex:1}.house-root .room-codex .cx-flo{left:50%;bottom:calc(14 * var(--u));width:calc(110 * var(--u));height:calc(10 * var(--u));background:radial-gradient(circle at 50% 50%, #8a6420 0 calc(3 * var(--u)), transparent calc(4 * var(--u))), linear-gradient(90deg, transparent, #8a6420 30%, #8a6420 70%, transparent) center / 100% 1px no-repeat;position:absolute;transform:translate(-50%)}.house-root .room-codex .cx-lesson{text-align:center;font:600 calc(15 * var(--u)) / 1 \"Cinzel\", serif;letter-spacing:.24em;color:#6a4a1c;margin:calc(4 * var(--u)) 0 calc(18 * var(--u))}.house-root .room-codex .cx-frame{padding:calc(14 * var(--u)) calc(14 * var(--u)) calc(6 * var(--u));border:calc(2 * var(--u)) solid #b08a46;box-shadow:inset 0 0 0 calc(2 * var(--u)) #fff4d6b3, 0 calc(2 * var(--u)) calc(6 * var(--u)) #50320e40;background:linear-gradient(#fff8e2d9,#f4e4bab3);position:relative}.house-root .room-codex .cx-cap2{font:600 calc(16 * var(--u)) / 1 \"Barlow Condensed\", \"Barlow\", sans-serif;letter-spacing:.08em;color:#2a2f45;margin-bottom:calc(6 * var(--u))}.house-root .room-codex .cx-cap2 span{color:#8a6420;margin:0 .35em}.house-root .room-codex .cx-plot{position:relative}.house-root .room-codex .cx-chart{width:100%;height:auto;font-family:Barlow Condensed,Barlow,sans-serif;display:block;overflow:visible}.house-root .room-codex .cx-chart .g{stroke:#6e501e33;stroke-width:.7px}.house-root .room-codex .cx-chart .ax{fill:#5c4a2c;font-size:12.5px}.house-root .room-codex .cx-chart path.u{stroke:#2d7b69;stroke-width:1.1px}.house-root .room-codex .cx-chart path.d{stroke:#a85a34;stroke-width:1.1px}.house-root .room-codex .cx-chart rect.u{fill:#3a9a82;stroke:#25695a;stroke-width:.5px}.house-root .room-codex .cx-chart rect.d{fill:#c8703f;stroke:#8f4a26;stroke-width:.5px}.house-root .room-codex .cx-chart .ln{stroke-width:1.3px;fill:none}.house-root .room-codex .cx-chart .ln.st{stroke:#e2875a;stroke-dasharray:5 3.5;stroke-width:1.6px}.house-root .room-codex .cx-chart .ln.tg{stroke:#2f8f7c;stroke-dasharray:5 3.5}.house-root .room-codex .cx-chart .ln.en{stroke:#26324f;stroke-width:1.1px}.house-root .room-codex .cx-chart .lb{paint-order:stroke;stroke:#faeecde6;stroke-width:3px;font-size:13.5px;font-weight:600}.house-root .room-codex .cx-chart .lb.st{fill:#c4602f}.house-root .room-codex .cx-chart .lb.tg{fill:#1f7a68}.house-root .room-codex .cx-chart .lb.en{fill:#26324f}.house-root .room-codex .cx-chart .mk.en{fill:#f4e6bd;stroke:#26324f;stroke-width:1.8px}.house-root .room-codex .cx-chart .mk.ex{fill:#f4e6bd;stroke:#e2875a;stroke-width:1.8px}.house-root .room-codex .cx-chart .mk.exd{fill:#e2875a}.house-root .room-codex .cx-note{margin-top:calc(18 * var(--u));padding:0 calc(8 * var(--u));text-align:center;font:italic 500 calc(36 * var(--u)) / 1.18 \"Cormorant Garamond\", Georgia, serif;color:#1b2748;text-shadow:0 0 1px #1b274859;text-wrap:balance;transform:rotate(-1.4deg)}.house-root .room-codex .cx-empty{inset:calc(44 * var(--u)) calc(38 * var(--u));place-content:center;justify-items:center;gap:calc(20 * var(--u));text-align:center;border:calc(2 * var(--u)) dashed #8a64208c;border-radius:calc(6 * var(--u));background:radial-gradient(at 50% 45%,#fff8e259,#0000 70%);display:grid;position:absolute}.house-root .room-codex .cx-empty p{font:italic 500 calc(30 * var(--u)) / 1.2 \"Cormorant Garamond\", Georgia, serif;color:#6a4a1c;max-width:80%}.house-root .room-codex .cx-seal{width:calc(64 * var(--u));height:calc(64 * var(--u));color:#8a6420;border:calc(2 * var(--u)) solid #8a642099;border-radius:50%;place-items:center;font-style:normal;display:grid}.house-root .room-codex .cx-seal svg{width:50%;height:50%}.house-root .room-codex .cx-day{place-items:center;gap:calc(14 * var(--u));padding:calc(60 * var(--u)) 0;font:600 calc(22 * var(--u)) \"Cinzel\", serif;color:#5a3f14;letter-spacing:.12em;display:grid}.house-root .room-codex .cx-lectern{left:calc(-24 * var(--u));right:calc(-24 * var(--u));top:calc(640 * var(--u));height:calc(74 * var(--u));pointer-events:none;position:absolute}.house-root .room-codex .cx-brass{height:calc(24 * var(--u));border-radius:calc(12 * var(--u));box-shadow:0 calc(8 * var(--u)) calc(18 * var(--u)) #000000b3, inset 0 1px 0 #fff4c8b3;background:linear-gradient(#f6e3a6,#c9a152 35%,#7d5a1f 75%,#43300f);position:absolute;top:0;left:0;right:0}.house-root .room-codex .cx-stand{left:calc(90 * var(--u));right:calc(90 * var(--u));top:calc(20 * var(--u));height:calc(54 * var(--u));border:calc(2 * var(--u)) solid #8a6a2c;clip-path:polygon(0 0,100% 0,96% 100%,4% 100%);background:linear-gradient(#1c2d52,#0a1222);border-top:0;position:absolute}.house-root .room-codex .cx-medal2{left:50%;top:calc(2 * var(--u));width:calc(64 * var(--u));height:calc(64 * var(--u));border:calc(3 * var(--u)) solid #d4b06a;box-shadow:0 0 calc(18 * var(--u)) #d4b06a8c, inset 0 0 0 calc(3 * var(--u)) #0a1222, inset 0 0 0 calc(4 * var(--u)) #d4b06a99;background:radial-gradient(circle at 50% 40%,#223a68,#0a1222 70%);border-radius:50%;position:absolute;transform:translate(-50%)}.house-root .room-codex .cx-medal2:after{content:\"\";inset:calc(12 * var(--u));filter:drop-shadow(0 0 calc(5 * var(--u)) #f1dcaacc);background:#f1dcaa;position:absolute;-webkit-mask:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 1l2.7 8.3L23 12l-8.3 2.7L12 23l-2.7-8.3L1 12l8.3-2.7Z'/></svg>\") 50%/contain no-repeat;mask:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 1l2.7 8.3L23 12l-8.3 2.7L12 23l-2.7-8.3L1 12l8.3-2.7Z'/></svg>\") 50%/contain no-repeat}.house-root .room-codex .cx-oath{left:calc(1530 * var(--u));top:calc(196 * var(--u));width:calc(330 * var(--u));height:calc(384 * var(--u))}.house-root .room-codex .cx-rules{gap:calc(7 * var(--u));padding:0 calc(18 * var(--u));display:grid}.house-root .room-codex .cx-rule{align-items:center;gap:calc(12 * var(--u));height:calc(44 * var(--u));padding:0 calc(14 * var(--u));border-radius:calc(3 * var(--u));background:linear-gradient(#1e2a42d9,#0c121ee6);border:1px solid #d4b06a80;display:flex;box-shadow:inset 0 1px #f1dcaa1f}.house-root .room-codex .cx-rule .ri{width:calc(26 * var(--u));height:calc(26 * var(--u));color:var(--rg);flex:none}.house-root .room-codex .cx-rule .ri svg{width:100%;height:100%}.house-root .room-codex .cx-rule .rn{font:500 calc(17 * var(--u)) \"Cormorant Garamond\", Georgia, serif;color:var(--ink);flex:1;font-style:italic}.house-root .room-codex .cx-rule b{font:600 calc(26 * var(--u)) / 1 \"Barlow Condensed\", sans-serif;color:var(--rgh)}.house-root .room-codex .cx-sub{margin:calc(12 * var(--u)) calc(20 * var(--u)) calc(5 * var(--u));font:italic 500 calc(17 * var(--u)) \"Cormorant Garamond\", Georgia, serif;color:var(--rg)}.house-root .room-codex .cx-hist{margin:0 calc(20 * var(--u));gap:calc(4 * var(--u));padding:0;list-style:none;display:grid}.house-root .room-codex .cx-hist li{column-gap:calc(8 * var(--u));font:500 calc(13 * var(--u)) / 1.2 \"Barlow\", sans-serif;color:var(--ink2);padding-bottom:calc(3 * var(--u));border-bottom:1px solid #d4b06a1f;grid-template-columns:1fr auto;align-items:baseline;display:grid}.house-root .room-codex .cx-hist time{color:var(--ink);letter-spacing:.02em;grid-area:1/1;font-weight:500}.house-root .room-codex .cx-hist span{font-size:calc(12 * var(--u));color:var(--ink3);grid-area:2/1}.house-root .room-codex .cx-hist b{font:600 calc(15 * var(--u)) \"Barlow Condensed\", sans-serif;color:var(--rgh);grid-area:1/2/span 2;align-self:center}.house-root .room-codex .cx-hist li.none{font:italic 500 calc(15 * var(--u)) \"Cormorant Garamond\", Georgia, serif;color:var(--ink3);border:0;display:block}.house-root .room-codex .cx-terms{left:calc(1530 * var(--u));top:calc(602 * var(--u));width:calc(330 * var(--u));height:calc(318 * var(--u))}.house-root .room-codex .cx-termlist{padding:0 calc(16 * var(--u));gap:calc(5 * var(--u));margin:0;list-style:none;display:grid}.house-root .room-codex .cx-termlist li{align-items:center;gap:calc(11 * var(--u));height:calc(48 * var(--u));padding:0 calc(8 * var(--u));border-radius:calc(3 * var(--u));background:linear-gradient(#182236b3,#0a0f1acc);border:1px solid #d4b06a47;display:flex}.house-root .room-codex .cx-termlist .tb{width:calc(28 * var(--u));height:calc(28 * var(--u));border:calc(1.6 * var(--u)) solid var(--rg);font:600 calc(11 * var(--u)) / 1 \"Cinzel\", serif;color:var(--rgh);border-radius:50%;flex:none;place-items:center;font-style:normal;display:grid}.house-root .room-codex .cx-termlist span{min-width:0;display:grid}.house-root .room-codex .cx-termlist b{font:600 calc(13 * var(--u)) / 1.1 \"Cinzel\", serif;color:var(--rgh);letter-spacing:.02em}.house-root .room-codex .cx-termlist em{font:normal 400 calc(11.6 * var(--u)) / 1.18 \"Barlow\", sans-serif;color:var(--ink2)}.house-root .room-codex .cx-ora{left:calc(1530 * var(--u));top:calc(942 * var(--u));width:calc(330 * var(--u));height:calc(88 * var(--u));align-items:center;gap:calc(8 * var(--u));padding:0 calc(16 * var(--u)) 0 calc(6 * var(--u));display:flex}.house-root .room-codex .cx-ora .ora-orb{width:calc(76 * var(--u));height:calc(76 * var(--u));flex:none}.house-root .room-codex .cx-ora .ora-say{gap:calc(4 * var(--u));min-width:0;display:grid}.house-root .room-codex .cx-ora small{font:600 calc(11 * var(--u)) / 1.2 \"Cinzel\", serif;letter-spacing:.12em;color:var(--rc)}.house-root .room-codex .cx-ora q{quotes:none;font:italic 500 calc(16 * var(--u)) / 1.25 \"Cormorant Garamond\", Georgia, serif;color:var(--ink)}@media (prefers-reduced-motion:reduce){.house-root .room-codex .cx-row{transition:none}}.house-root .room-codex .cx-halo{left:calc(-120 * var(--u));right:calc(-120 * var(--u));top:calc(-90 * var(--u));height:calc(820 * var(--u));pointer-events:none;z-index:-1;background:radial-gradient(52% 50% at 50% 48%,#ffcd7861,#ffbe5a1f 55%,#0000 75%);position:absolute}.house-root .room-codex .cx-co{width:calc(62 * var(--u));height:calc(62 * var(--u));pointer-events:none;z-index:2;border-top:calc(2.5 * var(--u)) solid #a27a2c;border-left:calc(2.5 * var(--u)) solid #a27a2c;border-top-left-radius:calc(10 * var(--u));filter:drop-shadow(0 0 calc(1 * var(--u)) #ffecaacc);position:absolute}.house-root .room-codex .cx-co:before{content:\"\";left:calc(9 * var(--u));top:calc(9 * var(--u));width:calc(34 * var(--u));height:calc(34 * var(--u));border-top-left-radius:calc(7 * var(--u));border-top:1px solid #a27a2c;border-left:1px solid #a27a2c;position:absolute}.house-root .room-codex .cx-co:after{content:\"\";left:calc(-6 * var(--u));top:calc(-6 * var(--u));width:calc(11 * var(--u));height:calc(11 * var(--u));background:radial-gradient(circle at 35% 30%,#f6e3a6,#a27a2c 75%);position:absolute;transform:rotate(45deg)}.house-root .room-codex .cx-co.a{left:calc(14 * var(--u));top:calc(14 * var(--u))}.house-root .room-codex .cx-co.b{right:calc(14 * var(--u));top:calc(14 * var(--u));transform:scaleX(-1)}.house-root .room-codex .cx-co.c{left:calc(14 * var(--u));bottom:calc(14 * var(--u));transform:scaleY(-1)}.house-root .room-codex .cx-co.d{right:calc(14 * var(--u));bottom:calc(14 * var(--u));transform:scale(-1)}.house-root .room-codex .cx-brass:before,.house-root .room-codex .cx-brass:after{content:\"\";top:calc(-8 * var(--u));width:calc(40 * var(--u));height:calc(40 * var(--u));box-shadow:0 calc(5 * var(--u)) calc(12 * var(--u)) #000000b3, 0 0 calc(16 * var(--u)) #f1dcaa59;background:radial-gradient(circle at 36% 30%,#fff1c0,#d4a94f 40%,#6d4d16 82%);border-radius:50%;position:absolute}.house-root .room-codex .cx-brass:before{left:calc(-4 * var(--u))}.house-root .room-codex .cx-brass:after{right:calc(-4 * var(--u))}.house-root .room-codex .cx-stand{box-shadow:inset 0 calc(10 * var(--u)) calc(14 * var(--u)) #0006, inset 0 0 0 calc(2 * var(--u)) #d4b06a40;background:linear-gradient(#223763,#0a1222 70%)}.house-root .room-codex .cx-row.open .cx-medal{border-width:calc(3 * var(--u));color:#f6e3a6;box-shadow:0 0 calc(14 * var(--u)) #f1d68c80, inset 0 0 calc(10 * var(--u)) #000000a6, inset 0 0 0 calc(2 * var(--u)) #ffecaa40;background:radial-gradient(circle at 50% 32%,#7a6538,#1d1708 74%)}.house-root .room-codex .cx-row.open .cx-medal svg{filter:drop-shadow(0 0 calc(4 * var(--u)) #ffe296cc)}.house-root .room-codex .cx-cover{box-shadow:0 calc(30 * var(--u)) calc(60 * var(--u)) #000000bf, 0 0 calc(70 * var(--u)) #ffc4644d, inset 0 0 0 calc(6 * var(--u)) #0a1220, inset 0 0 0 calc(7 * var(--u)) #d4b06a8c, inset 0 0 calc(40 * var(--u)) #0009}.house-root .room-codex .cx-note{transform:rotate(-2deg)}", mf = ".house-root[data-field]{max-height:100dvh;overflow:hidden}.house-root[data-field]>:not(#field){visibility:hidden}.house-root[data-field]>#toast{display:none}.house-root .fdev{--fd-navy:#0b1424;--fd-navy-2:#101c31;--fd-line:#d4b06a57;--fd-cyan:#3fd3c8;z-index:45;color:var(--ink);font:14px/1.35 var(--f-ui);overscroll-behavior:contain;padding:env(safe-area-inset-top) env(safe-area-inset-right) 0 env(safe-area-inset-left);-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;background:#070c15;flex-direction:column;display:flex;position:fixed;inset:0}.house-root .fdev:before{content:\"\";z-index:0;pointer-events:none;background:linear-gradient(to bottom, #070c15db, #070c15f0 40%, #070c15fa), var(--fd-bg) center 30% / cover no-repeat;position:absolute;inset:0}.house-root .fdev>*{z-index:1;position:relative}.house-root .fdev button{font:inherit;color:inherit;cursor:pointer;touch-action:manipulation}.house-root .fdev input{-webkit-user-select:text;user-select:text}.house-root .fd-frame{z-index:60;pointer-events:none;border:1px solid #3fd3c8b8;border-radius:22px;position:absolute;inset:5px;box-shadow:0 0 10px #3fd3c86b,inset 0 0 14px #3fd3c829}.house-root .fd-frame i{filter:drop-shadow(0 0 3px #d4b06a99);border:2.5px solid #d4b06a;width:20px;height:20px;position:absolute}.house-root .fd-frame .tl{border-bottom:0;border-right:0;border-radius:22px 0 0;top:-3px;left:-3px}.house-root .fd-frame .tr{border-bottom:0;border-left:0;border-radius:0 22px 0 0;top:-3px;right:-3px}.house-root .fd-frame .bl{border-top:0;border-right:0;border-radius:0 0 0 22px;bottom:-3px;left:-3px}.house-root .fd-frame .br{border-top:0;border-left:0;border-radius:0 0 22px;bottom:-3px;right:-3px}.house-root .fd-top{text-align:center;flex:none;align-self:stretch;padding:16px 20px 6px;position:relative}.house-root .fd-top small{font:600 9.5px var(--f-title);letter-spacing:.34em;color:var(--gold);opacity:.85;display:block}.house-root .fd-top b{font:600 19px var(--f-title);letter-spacing:.14em;color:var(--gold-hi);text-shadow:0 0 14px #d4b06a59;margin-top:2px;display:block}.house-root .fd-link{background:#6b6455;border-radius:50%;width:8px;height:8px;position:absolute;top:24px;right:28px}.house-root .fd-link.on{background:var(--fd-cyan);box-shadow:0 0 8px var(--fd-cyan)}.house-root .fd-body{-webkit-overflow-scrolling:touch;overscroll-behavior:contain;flex:1;min-height:0;padding:6px 16px 14px;overflow:hidden auto}.house-root .fd-stack{flex-direction:column;gap:12px;display:flex}.house-root .fd-h{font:600 11px var(--f-title);letter-spacing:.24em;color:var(--gold);align-items:center;gap:8px;margin:6px 4px 0;display:flex}.house-root .fd-h.in{margin:0 0 10px}.house-root .fd-h svg.sm{width:15px;height:15px}.house-root .fd-slots{font:500 12px var(--f-num);letter-spacing:.12em;color:var(--ink-2);margin-left:auto}.house-root .fd-empty{color:var(--ink-3);text-align:center;margin:22px 0}.house-root .fd-card{background:var(--fd-navy);border:1px solid var(--fd-line);border-radius:12px;padding:14px;box-shadow:inset 0 1px #f1dcaa14,0 6px 18px #00000059}.house-root .fd-lothead{align-items:center;gap:12px;display:flex}.house-root .fd-med{flex:none;place-items:center;width:44px;height:44px;display:grid}.house-root .fd-med.lg{width:62px;height:62px}.house-root .fd-med .med,.house-root .fd-med img{object-fit:contain;filter:drop-shadow(0 2px 6px #0009);width:100%;height:100%}.house-root .fd-med svg{width:70%;height:70%;color:var(--gold)}.house-root .fd-lotn{flex-direction:column;flex:1;gap:1px;min-width:0;display:flex}.house-root .fd-lotn b{font:600 16px var(--f-title);letter-spacing:.08em;color:var(--gold-hi);white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.house-root .fd-lotn i{font:500 12.5px var(--f-num);letter-spacing:.1em;color:var(--ink-2);font-style:normal}.house-root .fd-lotn em{font:500 15px var(--f-ui);color:var(--ink);margin-top:3px;font-style:normal}.house-root .fd-lotp{text-align:right;flex-direction:column;align-items:flex-end;gap:1px;display:flex}.house-root .fd-lotp b{font:600 18px var(--f-num);letter-spacing:.02em;color:var(--ink)}.house-root .fd-lotp em{font:500 13px var(--f-num);font-style:normal}.house-root .fdev .up{color:var(--up)}.house-root .fdev .dn{color:var(--dn)}.house-root .fd-list{flex-direction:column;gap:8px;display:flex}.house-root .fd-lot{background:var(--fd-navy);border:1px solid #d4b06a29;border-radius:12px;grid-template-columns:44px 1fr auto 44px;align-items:center;gap:10px;padding:9px 8px 9px 10px;display:grid}.house-root .fd-lot.named{background:linear-gradient(90deg, #d4b06a12, transparent 60%), var(--fd-navy);border-color:#d4b06a5c}.house-root .fd-bell{width:44px;height:44px;color:var(--ink-2);background:0 0;border:1px solid #d4b06a33;border-radius:50%;place-items:center;padding:0;display:grid;position:relative}.house-root .fd-bell svg{width:21px;height:21px}.house-root .fd-bell.on{color:var(--gold-hi);border-color:var(--gold);background:#d4b06a1a}.house-root .fd-bell b{background:var(--gold);color:#1a1408;min-width:16px;height:16px;font:700 10px/16px var(--f-num);text-align:center;border-radius:8px;position:absolute;top:-2px;right:-2px}.house-root .fd-bellp{border-top:1px solid #d4b06a24;grid-column:1/-1;grid-template-columns:auto 1fr auto;align-items:center;gap:8px;padding-top:6px;display:grid}.house-root .fd-seg{border:1px solid var(--fd-line);border-radius:8px;display:flex;overflow:hidden}.house-root .fd-seg button{font:600 11px var(--f-title);letter-spacing:.12em;color:var(--ink-2);background:0 0;border:0;padding:9px 10px}.house-root .fd-seg button.on{color:var(--fd-cyan);background:#3fd3c829}.house-root .fd-bellp input{border:1px solid var(--fd-line);width:100%;min-width:0;color:var(--ink);font:500 16px var(--f-num);background:#070d18;border-radius:8px;padding:9px 10px}.house-root .fd-armed{color:var(--ink-2);font:500 14px var(--f-num);grid-column:1/-1;justify-content:space-between;align-items:center;display:flex}.house-root .fd-armed span{align-items:center;gap:6px;display:flex}.house-root .fd-armed svg{width:16px;height:16px;color:var(--gold)}.house-root .fd-armed button{width:36px;height:32px;color:var(--ink-3);background:0 0;border:0}.house-root .fd-armed button svg{width:16px;height:16px;color:inherit}.house-root .fd-gold{color:#1d1406;width:100%;min-height:52px;font:700 15px var(--f-title);letter-spacing:.16em;text-shadow:0 1px #ffffff4d;background:linear-gradient(#ecd391 0%,#d4b06a 46%,#a98245 100%);border:1px solid #f1dcaa;border-radius:14px;padding:15px 18px;box-shadow:0 0 0 1px #0006,0 6px 22px #d4b06a57,inset 0 1px #ffffff8c}.house-root .fd-gold:active{filter:brightness(.95);transform:translateY(1px)}.house-root .fd-gold:disabled{color:var(--ink-3);box-shadow:none;text-shadow:none;background:#2a2a2e;border-color:#d4b06a2e}.house-root .fd-gold.sm{border-radius:10px;width:auto;min-height:40px;padding:8px 14px;font-size:12px}.house-root .fd-gold.wide{justify-content:center;align-items:center;gap:12px;display:flex}.house-root .fd-gold svg{flex:none;width:22px;height:22px}.house-root .fd-gold svg.rot{opacity:.7}.house-root .fd-quiet{min-height:44px;font:600 12.5px var(--f-title);letter-spacing:.26em;color:var(--ink-2);background:0 0;border:0;padding:12px}.house-root .fd-ghost,.house-root .fd-ember{min-height:46px;font:600 12.5px var(--f-title);letter-spacing:.18em;background:0 0;border-radius:12px;flex:1}.house-root .fd-ghost{border:1px solid var(--fd-line);color:var(--gold-hi)}.house-root .fd-ember{color:var(--dn);background:#e2875a12;border:1px solid #e2875a99}.house-root .fd-btns{gap:10px;margin-top:12px;display:flex}.house-root .fd-pnlrow{border-top:1px solid #d4b06a24;justify-content:space-between;align-items:baseline;margin:12px 0 8px;padding-top:10px;display:flex}.house-root .fd-pnlrow span{font:600 10.5px var(--f-title);letter-spacing:.22em;color:var(--ink-3)}.house-root .fd-pnl{font:600 24px var(--f-num)}.house-root .fd-facts{grid-template-columns:repeat(3,1fr);gap:8px;display:grid}.house-root .fd-facts span{background:#08101d;border:1px solid #d4b06a1f;border-radius:8px;flex-direction:column;gap:2px;padding:7px 8px;display:flex}.house-root .fd-facts i{font:600 9.5px var(--f-title);letter-spacing:.2em;color:var(--ink-3);font-style:normal}.house-root .fd-facts b{font:500 15px var(--f-num);color:var(--ink)}.house-root .fd-armedtag{letter-spacing:.2em;color:var(--fd-cyan);font:700 10px var(--f-title)!important}.house-root .fd-quiet-state{min-height:55%;color:var(--ink-3);text-align:center;flex-direction:column;justify-content:center;align-items:center;gap:14px;display:flex}.house-root .fd-quiet-state>svg{width:54px;height:54px;color:var(--gold-lo);opacity:.6}.house-root .fd-quiet-state p{font:italic 500 18px var(--f-voice);color:var(--ink-2);margin:0}.house-root .fd-bigorb{width:220px;height:150px;display:block}.house-root .fd-tight{background:#08101d;border:1px solid #3fd3c847;border-radius:10px;margin-top:12px;padding:11px 12px 9px}.house-root .fd-trow{justify-content:space-between;align-items:center;gap:10px;display:flex}.house-root .fd-trow>span{font:600 10.5px var(--f-title);letter-spacing:.2em;color:var(--gold)}.house-root .fd-trow>span i{color:var(--ink-3);letter-spacing:.16em;font-style:normal}.house-root .fd-num{border:1px solid var(--fd-line);width:118px;color:var(--ink);font:600 17px var(--f-num);text-align:right;background:#050a13;border-radius:8px;padding:8px 10px}.house-root .fd-num:focus{border-color:var(--fd-cyan);outline:none;box-shadow:0 0 0 2px #3fd3c833}.house-root .fd-range{appearance:none;touch-action:pan-y;background:0 0;width:100%;height:30px;margin:6px 0 0}.house-root .fd-range::-webkit-slider-runnable-track{background:linear-gradient(90deg, #e2875a 0%, #d4b06a8c 40%, var(--fd-cyan) 100%);opacity:.85;border-radius:3px;height:6px}.house-root .fd-range::-moz-range-track{background:linear-gradient(90deg, #e2875a 0%, #d4b06a8c 40%, var(--fd-cyan) 100%);opacity:.85;border-radius:3px;height:6px}.house-root .fd-range::-webkit-slider-thumb{-webkit-appearance:none;background:radial-gradient(circle at 35% 30%,#fff3c9,#d4b06a 60%,#8a6a32);border:2px solid #f1dcaa;border-radius:50%;width:26px;height:26px;margin-top:-10px;box-shadow:0 0 10px #d4b06a99}.house-root .fd-range::-moz-range-thumb{background:radial-gradient(circle at 35% 30%,#fff3c9,#d4b06a 60%,#8a6a32);border:2px solid #f1dcaa;border-radius:50%;width:22px;height:22px;box-shadow:0 0 10px #d4b06a99}.house-root .fd-range:disabled{opacity:.35}.house-root .fd-lockline{color:var(--ink-2);font:500 12.5px var(--f-ui);align-items:center;gap:7px;margin:4px 0 0;display:flex}.house-root .fd-lockline svg{width:15px;height:15px;color:var(--gold);flex:none}.house-root .fd-lockline.shake{color:var(--dn);animation:.45s fd-shake}.house-root .fd-lockline.shake svg{color:var(--dn)}@keyframes fd-shake{0%,to{transform:translate(0)}20%{transform:translate(-5px)}40%{transform:translate(5px)}60%{transform:translate(-3px)}80%{transform:translate(3px)}}.house-root .fd-feed{text-align:left;background:var(--fd-navy);border:1px solid #d4b06a33;border-radius:12px;grid-template-columns:54px 1fr auto;align-items:center;gap:12px;width:100%;padding:11px 12px;display:grid}.house-root .fd-feed.new{border-color:var(--fd-cyan);box-shadow:0 0 12px #3fd3c82e}.house-root .fd-feedcoin .fd-coin{width:54px;height:54px}.house-root .fd-feedtx{flex-direction:column;gap:2px;min-width:0;display:flex}.house-root .fd-feedtx b{font:600 12px var(--f-title);letter-spacing:.14em;color:var(--gold-hi)}.house-root .fd-feedtx b em{font:italic 500 12px var(--f-voice);letter-spacing:.02em;color:var(--ora);margin-left:8px}.house-root .fd-feedtx i{font:500 12px var(--f-num);letter-spacing:.08em;color:var(--ink-2);font-style:normal}.house-root .fd-feedtx q{font:italic 500 14.5px/1.25 var(--f-voice);color:var(--ora-hi);quotes:none;opacity:.92}.house-root .fd-feedr{text-align:right;flex-direction:column;align-self:start;gap:2px;display:flex}.house-root .fd-feedr b{font:600 16px var(--f-num)}.house-root .fd-feedr small{font:500 11px var(--f-ui);color:var(--ink-3);white-space:nowrap}.house-root .fd-rank{grid-template-columns:1fr auto;row-gap:10px;display:grid}.house-root .fd-rank small,.house-root .fd-streak b{font:600 10px var(--f-title);letter-spacing:.24em;color:var(--ink-3);display:block}.house-root .fd-rankl b{font:600 25px var(--f-title);letter-spacing:.1em;color:var(--gold-hi);text-shadow:0 0 14px #d4b06a4d}.house-root .fd-rankr{text-align:right}.house-root .fd-rankr b{font:600 32px var(--f-num);color:var(--ora-hi);text-shadow:0 0 12px #9fdcff80}.house-root .fd-bar{background:#060b14;border:1px solid #d4b06a2e;border-radius:4px;grid-column:1/-1;height:8px;overflow:hidden}.house-root .fd-bar i{background:linear-gradient(90deg,#9c7a3e,#f1dcaa);border-radius:4px;height:100%;display:block;box-shadow:0 0 8px #d4b06a99}.house-root .fd-bar.sm{height:5px;margin-top:6px}.house-root .fd-barcap{font:500 12px var(--f-num);color:var(--ink-2);grid-column:1/-1;justify-content:space-between;margin:-4px 0 0;display:flex}.house-root .fd-streak{align-items:center;gap:14px;display:flex}.house-root .fd-streakn{font:600 40px var(--f-num);color:var(--fd-cyan);text-shadow:0 0 14px #3fd3c880;text-align:center;min-width:44px}.house-root .fd-streak>div{flex:1}.house-root .fd-streak i{font:500 13px var(--f-ui);color:var(--ink-2);font-style:normal}.house-root .fd-streak>svg{width:34px;height:34px;color:var(--gold-lo)}.house-root .fd-trial{grid-template-columns:1fr auto;row-gap:0;margin-bottom:11px;display:grid}.house-root .fd-trial span{font:500 14px var(--f-ui);color:var(--ink)}.house-root .fd-trial b{font:600 14px var(--f-num);color:var(--gold-hi)}.house-root .fd-trial .fd-bar{grid-column:1/-1}.house-root .fd-trial.done b{color:var(--up)}.house-root .fd-grades{grid-template-columns:repeat(5,1fr);gap:7px;display:grid}.house-root .fd-grade{background:#08101d;border:1px solid #d4b06a29;border-radius:10px;flex-direction:column;align-items:center;gap:3px;min-width:0;padding:9px 2px 8px;display:flex}.house-root .fd-grade b{width:36px;height:36px;font:700 19px var(--f-title);color:#1a1408;background:radial-gradient(circle at 35% 30%,#f6e3b0,#d4b06a 62%,#8a6a32);border-radius:50%;place-items:center;display:grid;box-shadow:0 0 10px #d4b06a59}.house-root .fd-grade.g-b b{background:radial-gradient(circle at 35% 30%,#e6f4ff,#9fdcff 62%,#4f86ad);box-shadow:0 0 10px #9fdcff59}.house-root .fd-grade.g-c b{background:radial-gradient(circle at 35% 30%,#ddf5f1,#5fd0c4 62%,#2b8077);box-shadow:0 0 10px #3fd3c84d}.house-root .fd-grade.g-d b{background:radial-gradient(circle at 35% 30%,#f3d2bd,#e2875a 62%,#99532f);box-shadow:0 0 10px #e2875a4d}.house-root .fd-grade.g-f b{color:#f2e6dc;box-shadow:none;background:radial-gradient(circle at 35% 30%,#c9b8ac,#8a6a5a 62%,#4a3a32)}.house-root .fd-grade i{font:600 9px var(--f-title);letter-spacing:.06em;color:var(--ink-2);text-overflow:ellipsis;white-space:nowrap;max-width:100%;font-style:normal;overflow:hidden}.house-root .fd-grade em{font:500 12px var(--f-num);color:var(--ink-3);font-style:normal}.house-root .fd-set{font:500 16px var(--f-ui);justify-content:space-between;align-items:center;min-height:34px;display:flex}.house-root .fd-gold-t{font:600 20px var(--f-num);color:var(--gold-hi)}.house-root .fd-switch{border:1px solid var(--fd-line);background:#060b14;border-radius:15px;width:54px;height:30px;padding:0;position:relative}.house-root .fd-switch i{background:#7d7563;border-radius:50%;width:22px;height:22px;transition:left .18s,background .18s;position:absolute;top:3px;left:3px}.house-root .fd-switch.on{border-color:var(--fd-cyan);background:#3fd3c824}.house-root .fd-switch.on i{background:var(--fd-cyan);box-shadow:0 0 8px var(--fd-cyan);left:27px}.house-root .fd-oath{grid-template-columns:repeat(3,1fr);gap:8px;display:grid}.house-root .fd-oath span{background:#08101d;border:1px solid #d4b06a24;border-radius:8px;flex-direction:column;gap:3px;padding:9px 8px;display:flex}.house-root .fd-oath i{font:600 9px var(--f-title);letter-spacing:.16em;color:var(--ink-3);font-style:normal}.house-root .fd-oath b{font:600 20px var(--f-num);color:var(--gold-hi)}.house-root .fd-tabs{padding:8px 14px calc(14px + env(safe-area-inset-bottom));background:linear-gradient(#070c1500,#070c15 30%);border-top:1px solid #3fd3c82e;flex:none;grid-template-columns:1fr 1fr 82px 1fr 1fr;align-items:end;display:grid;position:relative}.house-root .fd-tabs:before{content:\"\";background:linear-gradient(90deg, transparent, var(--fd-cyan), transparent);filter:blur(.4px);height:1px;position:absolute;top:-1px;left:22%;right:22%}.house-root .fd-tabs button{color:var(--ink-3);background:0 0;border:0;flex-direction:column;align-items:center;gap:3px;min-height:48px;padding:5px 0 2px;display:flex;position:relative}.house-root .fd-tabs button svg{width:24px;height:24px}.house-root .fd-tabs button span{font:600 9.5px var(--f-title);letter-spacing:.14em}.house-root .fd-tabs button.on{color:var(--gold-hi)}.house-root .fd-tabs button.on svg{filter:drop-shadow(0 0 5px #d4b06ab3)}.house-root .fd-tabs button.on:after{content:\"\";background:var(--gold);width:18px;height:2px;box-shadow:0 0 6px var(--gold);border-radius:1px;position:absolute;bottom:-3px}.house-root .fd-count{background:var(--fd-cyan);color:#04100f;min-width:16px;height:16px;font:700 10px/16px var(--f-num);text-align:center;border-radius:8px;position:absolute;top:1px;left:calc(50% + 6px)}.house-root .fd-tabs .fd-oratab{border-radius:50%;justify-content:center;justify-self:center;width:72px;height:72px;min-height:0;margin-top:-26px;padding:0}.house-root .fd-oratab:after{display:none}.house-root .fd-oraring{background:radial-gradient(circle,#0d1b33,#070d1a 70%);border:2px solid #d4b06a;border-radius:50%;width:72px;height:72px;display:block;position:relative;overflow:hidden;box-shadow:0 0 0 1px #0009,0 0 18px #9fdcff73,inset 0 0 16px #9fdcff38}.house-root .fd-oratab.on .fd-oraring{border-color:#f1dcaa;box-shadow:0 0 0 1px #0009,0 0 24px #9fdcffb3,inset 0 0 18px #9fdcff4d}.house-root .fd-oraorb{display:block;position:absolute;inset:0}.house-root .fd-dot{background:var(--gold);width:12px;height:12px;box-shadow:0 0 8px var(--gold);border:2px solid #070c15;border-radius:50%;position:absolute;top:4px;right:6px}.house-root .fd-toast{left:24px;right:24px;bottom:calc(96px + env(safe-area-inset-bottom));z-index:70;text-align:center;border:1px solid var(--fd-cyan);color:var(--ink);font:500 14px var(--f-ui);opacity:0;pointer-events:none;background:#0d1a2e;border-radius:12px;padding:11px 14px;transition:opacity .2s,transform .2s;position:absolute;transform:translateY(8px)}.house-root .fd-toast.show{opacity:1;transform:none}.house-root .fd-toast.bad{border-color:var(--dn)}.house-root .fd-layer{z-index:50;padding:20px 18px calc(20px + env(safe-area-inset-bottom));overscroll-behavior:contain;background:#070c15;position:absolute;inset:0;overflow:hidden auto}.house-root .fd-layer[hidden]{display:none}.house-root .fd-layer:before{content:\"\";pointer-events:none;z-index:0;background:radial-gradient(ellipse 80% 42% at 50% 22%, #9fdcff29, transparent 70%), linear-gradient(to bottom, #070c15cc, #070c15f5 45%), var(--fd-bg) center 25% / cover no-repeat;position:fixed;inset:0}.house-root .fd-layer>*{z-index:1;position:relative}.house-root .fd-callhead{text-align:center;padding-top:6px}.house-root .fd-callhead small{font:600 10px var(--f-title);letter-spacing:.36em;color:var(--gold);opacity:.9;display:block}.house-root .fd-callhead h1{font:600 33px var(--f-title);letter-spacing:.12em;color:var(--gold-hi);text-shadow:0 0 22px #d4b06a80,0 2px #00000080;margin:5px 0 2px}.house-root .fd-callhead p{font:italic 500 16.5px var(--f-voice);color:var(--ora);letter-spacing:.02em;margin:0}.house-root .fd-orbwrap{justify-content:center;margin:-4px 0 -10px;display:flex}.house-root .fd-callorb{filter:drop-shadow(0 0 18px #9fdcff73);width:250px;height:150px;display:block}.house-root .fd-away{width:max-content;font:600 10px var(--f-title);letter-spacing:.26em;color:var(--ora);background:#9fdcff14;border:1px solid #9fdcff80;border-radius:12px;margin:0 auto 10px;padding:4px 14px}.house-root .fd-callcard{background:linear-gradient(#0e1a2f,#0a1424);border-color:#d4b06a80;padding:14px 14px 12px;box-shadow:0 0 0 1px #00000080,0 10px 30px #00000080,inset 0 1px #f1dcaa24}.house-root .fd-result{text-align:center;font:500 21px var(--f-voice);letter-spacing:.02em;color:var(--dn);text-shadow:0 0 14px #e2875a47;border-top:1px solid #d4b06a29;margin:12px 0 0;padding-top:11px}.house-root .fd-result.target{color:var(--up);text-shadow:0 0 14px #57d6a347}.house-root .fd-result.alert{color:var(--fd-cyan);text-shadow:0 0 14px #3fd3c847}.house-root .fd-coinrow{flex-direction:column;align-items:center;gap:4px;margin-top:8px;display:flex}.house-root .fd-coin{object-fit:contain;filter:drop-shadow(0 0 18px #d4b06a99)drop-shadow(0 4px 8px #0009);width:150px;height:150px;display:block}.house-root .fd-coin.ember{filter:drop-shadow(0 0 16px #e2875a80)saturate(.8)drop-shadow(0 4px 8px #0009)}.house-root .fd-coin-art{color:#1d1406;background:radial-gradient(circle at 36% 28%,#fbeab9,#d4b06a 55%,#8a6a32);border:4px solid #f1dcaa;border-radius:50%;place-items:center;width:150px;height:150px;display:grid;box-shadow:inset 0 0 0 6px #8a6a328c,inset 0 0 22px #00000059,0 0 22px #d4b06a80}.house-root .fd-coin-art svg{stroke-width:1.6px;width:54%;height:54%}.house-root .fd-feedcoin .fd-coin-art{border-width:2px;width:54px;height:54px;box-shadow:inset 0 0 0 3px #8a6a3280,0 0 10px #d4b06a66}.house-root .fd-coincap{flex-direction:column;align-items:center;gap:2px;display:flex}.house-root .fd-coincap b{font:700 14px var(--f-title);letter-spacing:.3em;color:var(--gold-hi);text-shadow:0 0 10px #d4b06a66}.house-root .fd-light{font:600 25px var(--f-num);letter-spacing:.04em;color:#f6dc97;text-shadow:0 0 14px #f6c66a8c}.house-root .fd-quote{background:linear-gradient(#0d1a2e,#0a1424);border:1px solid #9fdcff61;border-radius:12px;grid-template-columns:54px 1fr;align-items:center;column-gap:12px;margin:14px 0 0;padding:12px 14px;display:grid;box-shadow:0 0 16px #9fdcff1f}.house-root .fd-qorb{background:radial-gradient(circle,#10213a,#070d1a 75%);border:1.5px solid #9fdcffb3;border-radius:50%;grid-row:1/3;width:54px;height:54px;display:block;position:relative;overflow:hidden;box-shadow:0 0 12px #9fdcff80}.house-root .fd-quote p{font:italic 500 18.5px/1.22 var(--f-voice);color:var(--ora-hi);margin:0}.house-root .fd-quote cite{font:600 11px var(--f-title);letter-spacing:.26em;color:var(--ora);margin-top:3px;font-style:normal}.house-root .fd-actions{flex-direction:column;gap:4px;margin-top:16px;display:flex}.house-root .fd-pips{justify-content:center;gap:6px;margin-top:4px;display:flex}.house-root .fd-pips i{background:#3a4150;border-radius:50%;width:6px;height:6px}.house-root .fd-pips i.on{background:var(--gold)}.house-root .fd-call[data-kind=liquidated] .fd-callhead h1{color:#e8c9b5;text-shadow:0 0 18px #e2875a59}.house-root .fd-rhead{align-items:center;gap:10px;padding:4px 0 10px;display:flex}.house-root .fd-x{border:1px solid var(--fd-line);width:44px;height:44px;color:var(--gold-hi);background:#0b1424;border-radius:50%;flex:none;place-items:center;padding:0;display:grid}.house-root .fd-x svg{width:22px;height:22px}.house-root .fd-chartbox{background:var(--fd-navy);border:1px solid #3fd3c852;border-radius:12px;padding:8px 4px 6px;box-shadow:0 0 14px #3fd3c81a}.house-root .fd-chart{width:100%;height:196px}.house-root .fd-legend{font:600 11.5px var(--f-num);letter-spacing:.08em;justify-content:space-between;padding:6px 10px 2px;display:flex}.house-root .fd-legend .e{color:var(--gold)}.house-root .fd-legend .s{color:var(--dn)}.house-root .fd-legend .t{color:var(--fd-cyan)}.house-root .fd-seals{grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0;display:grid}.house-root .fd-seal{color:#5d584b;text-align:center;background:#09111f;border:1px solid #d4b06a24;border-radius:12px;flex-direction:column;align-items:center;gap:6px;padding:10px 4px 9px;transition:all .25s;display:flex}.house-root .fd-seal svg{box-sizing:content-box;border:1.5px solid;border-radius:50%;width:30px;height:30px;padding:7px}.house-root .fd-seal span{font:600 9.5px/1.15 var(--f-title);letter-spacing:.1em}.house-root .fd-seal.lit{color:var(--gold-hi);background:linear-gradient(#d4b06a24,#0b1424);border-color:#d4b06ab3;box-shadow:0 0 14px #d4b06a47,inset 0 0 12px #d4b06a1a}.house-root .fd-seal.lit svg{filter:drop-shadow(0 0 5px #f1dcaacc);background:radial-gradient(circle,#f1dcaa38,#0000 70%)}.house-root .fd-rparams{padding:12px 14px 10px}.house-root .fd-prow{justify-content:space-between;align-items:center;display:flex}.house-root .fd-prow>span{font:600 10.5px var(--f-title);letter-spacing:.2em;color:var(--gold)}.house-root .fd-prow>span i{color:var(--ink-3);letter-spacing:.16em;font-style:normal}.house-root .fd-ro{background:#08101d;border:1px solid #d4b06a38;border-radius:8px;align-items:center;gap:8px;padding:8px 12px;display:flex}.house-root .fd-ro b{font:600 16px var(--f-num);color:var(--ink)}.house-root .fd-ro svg{width:15px;height:15px;color:var(--gold)}.house-root .fd-pnote{font:500 12.5px var(--f-num);color:var(--ink-3);text-align:right;letter-spacing:.04em;margin:5px 2px 0}.house-root .fd-rparams .fd-tight{background:0 0;border:0;border-top:1px solid #d4b06a24;border-radius:0;margin-top:10px;padding:12px 0 2px}.house-root .fd-actions.rearm{gap:8px;margin-top:12px}.house-root .fd-slotline{text-align:center;font:500 12px var(--f-num);letter-spacing:.2em;color:var(--ink-3);margin:0}.house-root .fd-rearm.sealed .fd-chartbox{border-color:var(--gold);transition:all .4s;box-shadow:0 0 40px #d4b06a99}@media (max-height:760px){.house-root .fd-callorb{width:200px;height:118px}.house-root .fd-coin,.house-root .fd-coin-art{width:112px;height:112px}.house-root .fd-callhead h1{font-size:28px}}@media (prefers-reduced-motion:reduce){.house-root .fd-lockline.shake{animation:none}}.house-root .fdev button.fd-gold{color:#1d1406}.house-root .fdev button.fd-gold:disabled{color:var(--ink-3)}.house-root .fd-trow>span{white-space:nowrap;letter-spacing:.14em;font-size:10px}.house-root .fd-trow>span i{letter-spacing:.1em}.house-root .fd-num{width:104px}", hf = ".house-root[data-pad] :is(.topbar,.floor),.house-root[data-pad]>footer{zoom:var(--pz,1)}.house-root[data-pad]{cursor:none}.house-root[data-pad] *{cursor:none!important}.house-root .pad-focus{outline-offset:2px;animation:1.6s ease-in-out infinite padPulse;outline:3px solid #f4cd72!important;box-shadow:0 0 0 7px #f4cd7238,0 0 28px 6px #f4cd7273!important}@keyframes padPulse{50%{box-shadow:0 0 0 9px #f4cd721f,0 0 34px 8px #f4cd7299}}.house-root .pad-edit{color:#fff!important;background:#286e6c59!important;outline:3px solid #6fe3d4!important}.house-root .pad-editing{box-shadow:0 0 0 3px #6fe3d473,0 0 26px #6fe3d473!important}.house-root .pad-legend{z-index:110;pointer-events:none;letter-spacing:.06em;color:#e8e2cf;white-space:nowrap;background:#06080edb;border:1px solid #f4cd728c;border-radius:40px;align-items:center;gap:14px;padding:10px 26px;font:600 22px/1 Barlow,Inter,system-ui,sans-serif;display:none;position:fixed;bottom:3.2vh;left:50%;transform:translate(-50%);box-shadow:0 8px 30px #0009}.house-root[data-pad] .pad-legend{display:flex}.house-root .pad-legend b{color:#f4cd72;letter-spacing:0;border:2px solid #f4cd72;border-radius:20px;place-items:center;min-width:34px;height:34px;margin-right:8px;padding:0 8px;font-size:18px;font-weight:700;display:inline-grid}.house-root .pad-legend i{background:#f4cd724d;width:1px;height:24px;margin:0 6px}.house-root .pad-menu{z-index:120;-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);background:#040509c7;place-items:center;display:grid;position:fixed;inset:0}.house-root .pm-card{color:#e8e2cf;background:linear-gradient(#0d1424,#080c16);border:2px solid #f4cd7299;border-radius:10px;width:min(760px,86vw);padding:34px 44px 30px;box-shadow:0 30px 80px #000000bf}.house-root .pm-card h2{text-align:center;letter-spacing:.2em;color:#f4cd72;margin:0 0 22px;font:600 34px/1 Cinzel,serif}.house-root .pm-list{gap:12px;display:grid}.house-root .pm-list button{letter-spacing:.14em;text-align:center;cursor:pointer;color:#e8e2cf;background:#141e34e6;border:1px solid #f4cd7259;border-radius:6px;padding:16px 20px;font:600 28px/1 Cinzel,serif}.house-root .pm-map{border-top:1px solid #f4cd7240;grid-template-columns:max-content 1fr;gap:8px 26px;margin:26px 0 0;padding-top:20px;font:500 22px/1.25 Barlow,system-ui,sans-serif;display:grid}.house-root .pm-map dt{color:#f4cd72;font-weight:700}.house-root .pm-map dd{color:#cfc9b5;margin:0}.house-root .dial.pad-edit{border-radius:50%;background:0 0!important}", gf = .2, _f = .55, vf = {
	A: 0,
	B: 1,
	X: 2,
	Y: 3,
	LB: 4,
	RB: 5,
	LT: 6,
	RT: 7,
	VIEW: 8,
	START: 9,
	LS: 10,
	RS: 11,
	UP: 12,
	DOWN: 13,
	LEFT: 14,
	RIGHT: 15
};
function yf() {
	if (!new URLSearchParams(location.search).has("padtest") || window.__fakePad) return;
	let e = {
		id: "padtest (Xbox 360 Controller)",
		index: 0,
		connected: !0,
		mapping: "standard",
		timestamp: 0,
		axes: [
			0,
			0,
			0,
			0
		],
		buttons: Array.from({ length: 17 }, () => ({
			pressed: !1,
			touched: !1,
			value: 0
		})),
		hapticActuators: []
	};
	window.__fakePad = e, Object.defineProperty(navigator, "getGamepads", {
		configurable: !0,
		value: () => [e]
	});
}
var bf = "button, a[href], [role=\"button\"], [role=\"slider\"], [role=\"tab\"], [tabindex]:not([tabindex=\"-1\"]), summary, input", xf = "[disabled], [aria-disabled=\"true\"]", Sf = "[hidden], .pad-skip, #asks, #bids, #chart, .pad-legend, .house-root > footer", Cf = (e) => e instanceof HTMLInputElement && !e.readOnly && (e.type === "number" || e.inputMode === "decimal"), wf = (e) => e instanceof HTMLInputElement && e.type === "range";
function Tf(e) {
	for (let t = e?.parentElement ?? null; t; t = t.parentElement) {
		let e = getComputedStyle(t);
		if ((e.overflowY === "auto" || e.overflowY === "scroll") && t.scrollHeight > t.clientHeight + 2) return t;
	}
	return null;
}
var Ef = "<b>A</b> select<i></i><b>B</b> back<i></i><b>&#9776;</b> menu", Df = "<b>&#9650;&#9660;</b> change<i></i><b>&#9664;&#9654;</b> fine<i></i><b>A</b> set<i></i><b>B</b> cancel", Of = "<b>&#9664;&#9654;</b> adjust<i></i><b>&#9650;&#9660;</b> move on<i></i><b>B</b> back";
function kf(e, t) {
	yf();
	let n = document.createElement("div");
	n.className = "pad-legend", n.setAttribute("aria-hidden", "true"), e.appendChild(n);
	let r = 0, i = !1, a = performance.now(), o = !1, s = !1, c = [], l = null, u = null, d = "", f = 0, p = null, m = 0, h = null, g = null, _ = null, v = !1, y = "", b = !1, x = null, S = 1, C = () => {
		s || (s = !0, window.__nativeGamepad = !0, document.documentElement.dataset.nativeGamepad = "1", window.dispatchEvent(new CustomEvent("nativegamepad")));
	}, w = () => {
		S = o ? Math.max(1, Math.min(2, Math.min(innerWidth / 1500, innerHeight / 840))) : 1, e.style.setProperty("--pz", S.toFixed(3)), e.style.setProperty("--vh", `${(1 / S).toFixed(4)}vh`), e.style.setProperty("--vw", `${(1 / S).toFixed(4)}vw`);
	}, T = () => {
		o || (o = !0, e.dataset.pad = "1", w(), D(Ef));
	}, E = () => {
		o && (g && ce(!0), le(), o = !1, delete e.dataset.pad, w(), I(), de(), l = null);
	}, D = (e) => {
		n.innerHTML !== e && (n.innerHTML = e);
	}, O = () => w();
	addEventListener("resize", O);
	let k = -1, A = -1, j = (e) => {
		if (e.pointerType !== "mouse") return;
		let t = k >= 0 && Math.abs(e.clientX - k) + Math.abs(e.clientY - A) > 2;
		k = e.clientX, A = e.clientY, t && E();
	};
	addEventListener("pointermove", j, !0);
	let M = () => C();
	addEventListener("gamepadconnected", M);
	let ee = () => {
		if (h) return [h];
		let t = e.querySelector(".oath-layer");
		if (t) return [t];
		let n = e.querySelector("#debrief");
		if (n && !n.hidden) return [n];
		let r = e.querySelector("#roomHost");
		return r && !r.hidden ? [e.querySelector(".topbar"), r].filter(Boolean) : [e];
	}, N = (e) => e.width >= 4 && e.height >= 4 && e.bottom > -4e3 && e.right > -4e3, te = (e, t, n) => {
		for (let r = e.parentElement; r && r !== n.parentElement; r = r.parentElement) {
			let e = getComputedStyle(r), n = (e.overflowX === "auto" || e.overflowX === "scroll") && r.scrollWidth > r.clientWidth + 2, i = (e.overflowY === "auto" || e.overflowY === "scroll") && r.scrollHeight > r.clientHeight + 2;
			if (!n && !i) continue;
			let a = r.getBoundingClientRect();
			if (n && (t.right > a.right + 1 || t.left < a.left - 1) || i && (t.bottom > a.bottom + 1 || t.top < a.top - 1)) return !0;
		}
		return !1;
	}, ne = () => {
		let e = [], t = /* @__PURE__ */ new Set(), n = innerWidth, r = innerHeight;
		for (let i of ee()) {
			let a = i.querySelectorAll("*");
			for (let o of a) {
				if (t.has(o)) continue;
				let a = o.matches(bf);
				if (!a) {
					if (o.tagName === "SPAN" || o.tagName === "I" || o.tagName === "B" || o.tagName === "IMG" || o.tagName === "SVG" || o.tagName === "CANVAS" || o.tagName === "path") continue;
					a = getComputedStyle(o).cursor === "pointer" && !!o.parentElement && getComputedStyle(o.parentElement).cursor !== "pointer";
				}
				if (!a || o.matches(xf) || o.closest(Sf) || o instanceof HTMLInputElement && (o.type === "hidden" || o.readOnly || o.tabIndex < 0 && o.type !== "range" || !(Cf(o) || wf(o) || /^(checkbox|radio|button|submit)$/.test(o.type))) || o.classList.contains("amt")) continue;
				let s = o.getBoundingClientRect();
				if (!N(s) || s.width * s.height > n * r * .4) continue;
				let c = getComputedStyle(o);
				if (!(c.visibility === "hidden" || Number(c.opacity) < .05 || c.pointerEvents === "none")) {
					if (s.bottom > 0 && s.top < r && s.right > 0 && s.left < n && !te(o, s, i)) {
						let e = !1;
						for (let t of [
							.5,
							.2,
							.8
						]) {
							let i = Math.min(n - 1, Math.max(0, s.left + s.width * t)), a = Math.min(r - 1, Math.max(0, s.top + s.height / 2)), c = document.elementFromPoint(i, a);
							if (!c || o.contains(c) || c.contains(o)) {
								e = !0;
								break;
							}
						}
						if (!e) continue;
					}
					t.add(o), e.push(o);
				}
			}
		}
		return e;
	}, P = (e) => {
		let t = Object.entries(e.dataset).map(([e, t]) => `${e}=${t}`).join("&");
		return `${e.tagName}#${e.id}.${t}|${(e.textContent || "").trim().slice(0, 24)}`;
	}, F = (e, t, n) => {
		let r = null, i = Infinity;
		for (let a of e) {
			let e = a.getBoundingClientRect(), o = Math.hypot(e.left + e.width / 2 - t, e.top + e.height / 2 - n);
			o < i && (i = o, r = a);
		}
		return r;
	}, re = (e, t, n) => {
		let r = e.getBoundingClientRect(), i = r.left + r.width / 2, a = r.top + r.height / 2, o = n === "up" || n === "down", s = null, c = Infinity, l = null, u = Infinity;
		for (let d of t) {
			if (d === e || e.contains(d) || d.contains(e)) continue;
			let t = d.getBoundingClientRect(), f = t.left + t.width / 2 - i, p = t.top + t.height / 2 - a, m = Math.max(0, n === "up" ? r.top - t.bottom : n === "down" ? t.top - r.bottom : n === "left" ? r.left - t.right : t.left - r.right);
			if ((n === "up" ? -p : n === "down" ? p : n === "left" ? -f : f) <= 2) continue;
			let h = Math.abs(o ? f : p), g = 13 * m * m + h * h;
			g < c && (c = g, s = d), (o ? Math.min(t.right, r.right) - Math.max(t.left, r.left) : Math.min(t.bottom, r.bottom) - Math.max(t.top, r.top)) > 6 && g < u && (u = g, l = d);
		}
		return l ?? s;
	}, I = () => {
		e.querySelectorAll(".pad-focus").forEach((e) => e.classList.remove("pad-focus"));
	}, L = (e) => {
		for (let t = e.parentElement; t; t = t.parentElement) {
			let n = getComputedStyle(t), r = (n.overflowY === "auto" || n.overflowY === "scroll") && t.scrollHeight > t.clientHeight + 2, i = (n.overflowX === "auto" || n.overflowX === "scroll") && t.scrollWidth > t.clientWidth + 2;
			if (!i && !r) continue;
			let a = e.getBoundingClientRect(), o = t.getBoundingClientRect();
			r && (a.top < o.top + 8 ? t.scrollTop -= o.top + 8 - a.top : a.bottom > o.bottom - 8 && (t.scrollTop += a.bottom - o.bottom + 8)), i && (a.left < o.left + 8 ? t.scrollLeft -= o.left + 8 - a.left : a.right > o.right - 8 && (t.scrollLeft += a.right - o.right + 8));
		}
		let t = e.getBoundingClientRect(), n = document.scrollingElement;
		n && n.scrollHeight > innerHeight + 2 && (t.top < 0 || t.bottom > innerHeight) && scrollBy(0, t.top < 0 ? t.top - 20 : t.bottom - innerHeight + 20);
	}, R = (e) => {
		if (I(), l = e, e) {
			e.classList.add("pad-focus");
			try {
				e.focus({ preventScroll: !0 });
			} catch {}
			L(e), u = e.getBoundingClientRect(), d = P(e);
		}
	}, z = () => {
		let e = ne();
		if (!e.length) {
			l = null;
			return;
		}
		if (d) {
			let t = e.find((e) => P(e) === d);
			if (t) return R(t);
		}
		if (u) {
			let t = F(e, u.left + u.width / 2, u.top + u.height / 2);
			if (t) return R(t);
		}
		for (let t of [
			".pad-menu .pm-first",
			".dial[tabindex=\"0\"]",
			"[data-a=\"back\"]",
			".gamenav button.on"
		]) {
			let n = e.find((e) => e.matches(t));
			if (n) return R(n);
		}
		R(F(e, innerWidth / 2, innerHeight / 2));
	}, B = (t) => {
		let n = [...e.querySelectorAll(t)].find((e) => e.getClientRects().length > 0 && !e.disabled);
		return n ? (R(n), !0) : !1;
	}, ie = () => !!l?.closest(".gamenav"), V = (e) => {
		let t = e.getBoundingClientRect(), n = {
			bubbles: !0,
			cancelable: !0,
			clientX: t.left + t.width / 2,
			clientY: t.top + t.height / 2,
			button: 0,
			pointerType: "mouse",
			isPrimary: !0
		};
		e.dispatchEvent(new PointerEvent("pointerdown", n)), e.dispatchEvent(new PointerEvent("pointerup", n)), e.click();
	}, H = (e, t) => {
		e.dispatchEvent(new Event(t, { bubbles: !0 }));
	}, ae = () => parseFloat((e.querySelector("#mkPrice")?.textContent ?? "").replace(/,/g, "")) || 0, oe = (t, n) => {
		let r = se(t), i = e.querySelector("#short.on, [data-v=\"short\"].on") ? -1 : 1;
		return /stop/i.test(n) ? +(r * (1 - .01 * i)).toPrecision(6) : /target/i.test(n) ? +(r * (1 + .02 * i)).toPrecision(6) : r;
	}, se = (t) => {
		if (t.closest("#roomHost")) {
			let t = [...e.querySelectorAll("#roomHost small")].find((e) => /^CURRENT$/i.test((e.textContent ?? "").trim())), n = parseFloat((t?.nextElementSibling?.textContent ?? "").replace(/,/g, ""));
			if (n > 0) return n;
		}
		return ae();
	}, U = (e) => {
		if (g = {
			el: e,
			orig: e.value
		}, e.classList.add("pad-edit"), e.closest(".field, .pl-f, .pop-in, .levn")?.classList.add("pad-editing"), e.value.trim() === "") {
			let t = parseFloat(e.placeholder), n = Number.isFinite(t) && t > 0 ? t : e.id === "size" ? 1e3 : oe(e, e.id || e.dataset.in || "") || 1;
			e.value = String(n), H(e, "input");
		}
		e.focus({ preventScroll: !0 }), m = 0, p = null, f = 0;
	}, ce = (e) => {
		if (!g) return;
		let { el: t, orig: n } = g;
		g = null, t.classList.remove("pad-edit"), t.closest(".pad-editing")?.classList.remove("pad-editing"), e && t.value !== n && (t.value = n, H(t, "input")), H(t, "change"), t.blur(), t.isConnected && R(t);
	}, le = () => {
		_ &&= (_.classList.remove("pad-edit"), null);
	}, W = (e, t, n, r) => {
		let i = parseFloat(e.value), a = Number.isFinite(i) ? i : 0, o = e.step && e.step !== "any" ? parseFloat(e.step) : NaN, s;
		s = Number.isFinite(o) && o > 0 ? n ? o : o * (Math.abs(a) >= 100 * o ? 5 : 1) : 10 ** (Math.floor(Math.log10(Math.max(Math.abs(a), 1e-9))) - (n ? 3 : 2));
		let c = e.min === "" ? 0 : parseFloat(e.min), l = a + t * s * r;
		l < c && (l = c);
		let u = e.max === "" ? Infinity : parseFloat(e.max);
		l > u && (l = u), e.value = String(+l.toPrecision(10)), H(e, "input");
	}, ue = (e, t, n) => {
		if (e instanceof HTMLInputElement && wf(e)) {
			let r = parseFloat(e.min || "0"), i = parseFloat(e.max || "100"), a = parseFloat(e.step || "1") || 1, o = Math.max(a, Math.round((i - r) / 40 / a) * a);
			e.value = String(Math.max(r, Math.min(i, parseFloat(e.value) + t * o * n))), H(e, "input"), H(e, "change");
		} else e.dispatchEvent(new KeyboardEvent("keydown", {
			key: t > 0 ? "ArrowRight" : "ArrowLeft",
			bubbles: !0,
			cancelable: !0
		}));
	}, de = () => {
		h && (h.remove(), h = null, x &&= (d = x.sig, u = x.rect, b = !0, null));
	}, fe = () => {
		if (h) return;
		let n = document.createElement("div");
		n.className = "pad-menu", n.innerHTML = `<div class="pm-card" role="dialog" aria-label="Menu">
      <h2>THE HOUSE</h2>
      <div class="pm-list">
        <button class="pm-first" data-pm="resume">RESUME</button>
        <button data-pm="oath">YOUR OATH</button>
        <button data-pm="sound">SOUND</button>
        <button data-pm="view">VIEW: ${e.dataset.mode === "advanced" ? "ADVANCED" : "GAME"}</button>
        ${t.leave ? "<button data-pm=\"leave\">LEAVE THE HOUSE</button>" : ""}
      </div>
      <dl class="pm-map">
        <dt>Stick / D-pad</dt><dd>move</dd>
        <dt>A</dt><dd>press, edit a number</dd>
        <dt>B</dt><dd>back</dd>
        <dt>Start</dt><dd>menu (pauses the Daily Chart)</dd>
        <dt>Right stick</dt><dd>scroll, pan and zoom the chart</dd>
        <dt>X &middot; Y</dt><dd>top bar &middot; WRITE PLAN</dd>
        <dt>LB &middot; RB</dt><dd>previous &middot; next room</dd>
      </dl>
    </div>`, n.addEventListener("click", (n) => {
			let r = n.target.closest("[data-pm]");
			if (!r) return;
			let i = r.dataset.pm;
			i === "resume" ? de() : i === "oath" ? (de(), e.querySelector("#oathBtn")?.click()) : i === "sound" ? e.querySelector("#sound")?.click() : i === "view" ? (e.querySelector(".modes button:not(.on)")?.click(), de()) : i === "leave" && (de(), t.leave?.());
		}), x = {
			sig: d,
			rect: u
		}, e.appendChild(n), h = n, d = "", u = null, z();
	}, pe = () => {
		try {
			let e = [...navigator.getGamepads?.() ?? []].filter((e) => !!e && e.connected);
			return e.find((e) => e.buttons.some((e, t) => t < 16 && e.pressed) || e.axes.slice(0, 4).some((e) => Math.abs(e) > .3)) ?? e[0] ?? null;
		} catch {
			return null;
		}
	}, G = (n) => {
		if (i) return;
		r = requestAnimationFrame(G);
		let x = Math.min(.1, (n - a) / 1e3);
		a = n;
		let S = pe();
		if (!S) {
			o && !s && E();
			return;
		}
		C();
		let w = [];
		for (let e = 0; e < 16; e++) w[e] = !!S.buttons[e]?.pressed;
		let O = Array.from(S.axes), k = O[0] ?? 0, A = O[1] ?? 0, j = O[2] ?? 0, M = O[3] ?? 0, N = (e) => w[e] && !c[e], te = Math.hypot(k, A) > gf || Math.hypot(j, M) > gf, P = o;
		if ((w.some((e, t) => e && !c[t]) || te) && T(), !o) {
			c = w;
			return;
		}
		if (!P) {
			y = "", d = "", u = null, c = w, v = !0;
			return;
		}
		if (v) {
			if (w.some(Boolean) || te) {
				c = w;
				return;
			}
			v = !1;
		}
		let F = (h ? "m" : "") + ee().map((e) => e.id || e.className).join("|") + t.room();
		F === y ? (!l || !l.isConnected || l.getClientRects().length === 0) && z() : (y = F, g && ce(!0), le(), b || (d = "", u = null), b = !1, z());
		let I = null;
		w[vf.UP] || A < -.55 ? I = "up" : w[vf.DOWN] || A > _f ? I = "down" : w[vf.LEFT] || k < -.55 ? I = "left" : (w[vf.RIGHT] || k > _f) && (I = "right"), I ? m += x : m = 0, f = Math.max(0, f - x);
		let L = I !== null && (p !== I || f === 0), H = m > 1.6 ? 16 : m > .6 ? 4 : 1;
		if (g) {
			D(Df), I && L && (f = p === I ? .07 : .32, I === "up" || I === "down" ? W(g.el, I === "up" ? 1 : -1, !1, H) : W(g.el, I === "right" ? 1 : -1, !0, H)), p = I, N(vf.A) ? ce(!1) : N(vf.B) && ce(!0), c = w;
			return;
		}
		if (_) {
			D(Df), I && L && (f = p === I ? .07 : .3, ue(_, I === "right" || I === "up" ? 1 : -1, H)), p = I, (N(vf.A) || N(vf.B)) && le(), c = w;
			return;
		}
		let ae = !!l && wf(l);
		if (D(ae ? Of : Ef), I && L && l) {
			if (ae && (I === "left" || I === "right")) f = p === I ? .06 : .28, ue(l, I === "right" ? 1 : -1, H);
			else {
				f = p === I ? .14 : .32;
				let e = ne(), t = re(l, e, I);
				if (t) R(t);
				else {
					let e = Tf(l);
					e && (I === "up" || I === "down") && (e.scrollTop += (I === "down" ? 1 : -1) * e.clientHeight * .6, d = "");
				}
			}
		}
		if (p = I, N(vf.A) && l && (Cf(l) ? U(l) : l instanceof HTMLInputElement && l.type === "checkbox" ? V(l) : l.matches("[role=\"slider\"]") ? (_ = l, l.classList.add("pad-edit"), m = 0, p = null, f = 0) : ae || V(l)), N(vf.B)) {
			if (h) de();
			else {
				let n = e.querySelector("#debrief");
				t.back() || (n && !n.hidden ? n.hidden = !0 : ie() ? t.leave?.() : B(".gamenav button.on"));
			}
		}
		if (N(vf.START) && (h ? de() : t.room() === "daily" ? document.body.dispatchEvent(new KeyboardEvent("keydown", {
			key: " ",
			code: "Space",
			bubbles: !0,
			cancelable: !0
		})) : fe()), !h && (N(vf.X) && B(".gamenav button.on"), N(vf.Y) && B("#place"), N(vf.LB) || N(vf.RB))) {
			let t = [...e.querySelectorAll(".gamenav button[data-room]:not([disabled])")], n = t[(t.findIndex((e) => e.classList.contains("on")) + (N(vf.RB) ? 1 : -1) + t.length) % t.length];
			n && !e.querySelector(".oath-layer") && V(n);
		}
		if (Math.hypot(j, M) > gf && !h) {
			let t = (l?.closest(".market") ? e.querySelector("#chart") : null)?.querySelector("canvas") ?? null;
			if (t) {
				let e = t.getBoundingClientRect(), n = {
					bubbles: !0,
					cancelable: !0,
					clientX: e.left + e.width / 2,
					clientY: e.top + e.height / 2
				};
				Math.abs(M) > Math.abs(j) ? t.dispatchEvent(new WheelEvent("wheel", {
					...n,
					deltaY: M * 60 * x * 20,
					deltaMode: 0
				})) : t.dispatchEvent(new WheelEvent("wheel", {
					...n,
					deltaX: j * 120 * x * 20,
					deltaMode: 0
				}));
			} else {
				let e = Tf(l);
				e ? e.scrollTop += M * 900 * x : scrollBy(0, M * 900 * x);
			}
		}
		c = w;
	};
	return r = requestAnimationFrame(G), new URLSearchParams(location.search).has("padtest") && (window.__padDebug = () => ne().map((e) => {
		let t = e.getBoundingClientRect();
		return `${P(e)} @${Math.round(t.left)},${Math.round(t.top)} ${Math.round(t.width)}x${Math.round(t.height)}`;
	})), () => {
		i = !0, cancelAnimationFrame(r), removeEventListener("resize", O), removeEventListener("pointermove", j, !0), removeEventListener("gamepadconnected", M), n.remove(), h?.remove(), h = null, e.style.removeProperty("--pz"), e.style.removeProperty("--vh"), e.style.removeProperty("--vw"), delete e.dataset.pad;
	};
}
//#endregion
//#region src/core/forge.ts
var Af = "paper-arena:v0:relics", jf = [
	"keystone",
	"aether",
	"sunglass",
	"oldsun",
	"moonmetal"
], Mf = [
	"Recruit",
	"Initiate",
	"Adept",
	"Disciple",
	"Warden",
	"Sage",
	"Paragon"
], Nf = [
	"HEAD",
	"GAUNTLET",
	"SIGIL RING",
	"CLOAK CLASP",
	"LANTERN",
	"CLOAK",
	"FIELD DEVICE"
], Pf = [
	{
		id: "keystone_gauntlet",
		name: "KEYSTONE GAUNTLET",
		subtitle: "The Signal Gauntlet's first upgrade",
		slot: "GAUNTLET",
		cost: {
			keystone: 5,
			oldsun: 2
		},
		grants: "rearm_slots +1",
		says: "Your field device can rearm two plans at once.",
		rank: "Recruit"
	},
	{
		id: "aether_lantern",
		name: "AETHER LANTERN",
		subtitle: "A light for the long watch",
		slot: "LANTERN",
		cost: {
			aether: 3,
			moonmetal: 1
		},
		grants: "alert_slots +3",
		says: "Three more bells you can hang.",
		rank: "Recruit"
	},
	{
		id: "sunglass_compass",
		name: "SUNGLASS COMPASS",
		subtitle: "It points at the chart that matters",
		slot: "FIELD DEVICE",
		cost: {
			sunglass: 3,
			aether: 2
		},
		grants: "daily_replay_speed 32x",
		says: "The Daily Chart turns faster for you.",
		rank: "Initiate"
	},
	{
		id: "oldsun_clasp",
		name: "OLD SUN CLASP",
		subtitle: "It holds the cloak, and the day",
		slot: "CLOAK CLASP",
		cost: {
			oldsun: 4,
			keystone: 2
		},
		grants: "aura gold",
		says: "A gold light follows Atlas.",
		rank: "Adept"
	},
	{
		id: "sigil_ring",
		name: "SIGIL RING",
		subtitle: "A seal worn by those who keep their word",
		slot: "SIGIL RING",
		cost: {
			keystone: 3,
			aether: 3,
			sunglass: 3
		},
		grants: "aura signal",
		says: "A signal-blue light follows Atlas.",
		rank: "Adept"
	},
	{
		id: "moonmetal_aegis",
		name: "MOONMETAL AEGIS",
		subtitle: "A cloak cut from cold light",
		slot: "CLOAK",
		cost: {
			moonmetal: 4,
			oldsun: 2
		},
		grants: "aura moon",
		says: "A pale moon light follows Atlas.",
		rank: "Disciple"
	},
	{
		id: "celestial_navigator",
		name: "CELESTIAL NAVIGATOR",
		subtitle: "The field device's second slot",
		slot: "FIELD DEVICE",
		cost: {
			aether: 4,
			sunglass: 4,
			moonmetal: 2
		},
		grants: "rearm_slots +1",
		says: "A third rearm on the road.",
		rank: "Disciple"
	},
	{
		id: "harmonic_crown",
		name: "HARMONIC CROWN",
		subtitle: "All five, in tune",
		slot: "HEAD",
		cost: {
			keystone: 3,
			aether: 3,
			sunglass: 3,
			oldsun: 3,
			moonmetal: 3
		},
		grants: "aura harmonic",
		says: "The five lights circle Atlas.",
		rank: "Warden"
	}
], Ff = (e) => Pf.find((t) => t.id === e), If = (e) => Math.max(0, Mf.indexOf(e));
function Lf(e) {
	let t = Array.isArray(e) ? e : [], n = /* @__PURE__ */ new Set(), r = [];
	for (let e of t) {
		if (!e || typeof e.id != "string" || n.has(e.id)) continue;
		let t = Ff(e.id);
		t && (n.add(e.id), r.push({
			id: t.id,
			name: t.name,
			slot: t.slot,
			forged_at: typeof e.forged_at == "string" ? e.forged_at : "",
			rank: typeof e.rank == "string" ? e.rank : "Recruit",
			grants: t.grants
		}));
	}
	return r;
}
function Rf(e, t, n, r) {
	let i = Ff(e);
	if (!i) return {
		ok: !1,
		block: "unknown",
		missing: {}
	};
	let a = {};
	for (let e of jf) {
		let n = (i.cost[e] ?? 0) - (t[e] ?? 0);
		n > 0 && (a[e] = n);
	}
	return n.some((t) => t.id === e) ? {
		ok: !1,
		block: "owned",
		missing: a
	} : r < If(i.rank) ? {
		ok: !1,
		block: "rank",
		missing: a
	} : Object.keys(a).length ? {
		ok: !1,
		block: "short",
		missing: a
	} : {
		ok: !0,
		block: null,
		missing: a
	};
}
function zf(e, t, n, r, i, a) {
	let o = Rf(e, t, n, r);
	if (!o.ok) return {
		ok: !1,
		block: o.block
	};
	let s = Ff(e), c = { ...t };
	for (let e of jf) c[e] = (c[e] ?? 0) - (s.cost[e] ?? 0);
	let l = {
		id: s.id,
		name: s.name,
		slot: s.slot,
		forged_at: new Date(a).toISOString(),
		rank: i,
		grants: s.grants
	};
	return {
		ok: !0,
		vault: c,
		relics: [...n, l],
		relic: l
	};
}
function Bf(e) {
	let t = Object.fromEntries(Nf.map((e) => [e, null]));
	for (let n of e) t[n.slot] = n;
	return t;
}
function Vf(e) {
	let t = {
		rearm_slots: 0,
		alert_slots: 0,
		daily_replay_speed: null,
		auras: []
	};
	for (let n of e) {
		let [e, r] = n.grants.split(" ");
		e === "rearm_slots" ? t.rearm_slots += parseInt(r, 10) || 0 : e === "alert_slots" ? t.alert_slots += parseInt(r, 10) || 0 : e === "daily_replay_speed" ? t.daily_replay_speed = Math.max(t.daily_replay_speed ?? 0, parseInt(r, 10) || 0) : e === "aura" && r && !t.auras.includes(r) && t.auras.push(r);
	}
	return t;
}
var Hf = (e) => 5 + Vf(e).alert_slots, Uf = (e, t) => e < Hf(t), Wf = (e, t) => {
	let n = Vf(t).daily_replay_speed;
	return n != null && !e.includes(n) ? [...e, n] : [...e];
}, Gf = "paper-arena:v0:calls", Kf = "paper-arena:v0:field";
function qf(e, t, n, r) {
	if (!Number.isFinite(n) || n <= 0 || !Number.isFinite(r) || r <= 0) return {
		ok: !1,
		reason: "invalid"
	};
	if (e === "long") {
		if (n >= r) return {
			ok: !1,
			reason: "past_mark"
		};
		if (t != null && n < t) return {
			ok: !1,
			reason: "widen"
		};
	} else {
		if (n <= r) return {
			ok: !1,
			reason: "past_mark"
		};
		if (t != null && n > t) return {
			ok: !1,
			reason: "widen"
		};
	}
	return { ok: !0 };
}
var Jf = (e, t) => e === "long" ? t * .999 : t * 1.001;
function Yf(e, t, n, r) {
	let i = Jf(e, r);
	if (e === "long") {
		let e = Math.min(n, i);
		return t != null && (e = Math.max(e, t)), e;
	}
	let a = Math.max(n, i);
	return t != null && (a = Math.min(a, t)), a;
}
var Xf = (e, t, n) => e + (t - e) * Math.max(0, Math.min(1, n)), Zf = (e, t, n) => t === e ? 0 : Math.max(0, Math.min(1, (n - e) / (t - e))), Qf = (e) => 1 + Vf(e).rearm_slots, $f = (e, t) => e.filter((e) => !e.reduceOnly && t.includes(e.id)).length, ep = (e, t, n) => $f(e, t) < Qf(n), tp = (e, t) => t.filter((t) => e.some((e) => e.id === t));
function np(e, t, n) {
	return e === "long" ? t <= n ? "limit" : "stop" : t >= n ? "limit" : "stop";
}
var rp = {
	stop: "It held where you wrote it. That is the whole craft.",
	target: "Taken at plan. The House saw it.",
	alert: "",
	liquidated: "The margin is gone. The House keeps no grudge. Begin again."
}, ip = (e) => e === "stop" ? "STOP HONORED" : e === "target" ? "TARGET TAKEN" : e === "alert" ? "BELL RUNG" : "LIQUIDATED";
function ap(e) {
	return e === "stop" || e === "trailingStop" ? "stop" : e === "target" ? "target" : e === "liquidation" ? "liquidated" : null;
}
function op(e) {
	let t = ap(e.trade.exitReason);
	if (!t) return null;
	let n = e.trade;
	return {
		id: `c-${n.id}`,
		kind: t,
		t: e.now,
		coin: n.coin,
		name: e.name,
		sym: e.sym,
		side: n.side,
		price: n.exit,
		r: n.rMultiple != null && Number.isFinite(n.rMultiple) ? n.rMultiple : null,
		grade: e.grade,
		light: Math.max(0, Math.round(e.light)),
		medals: [...e.medals],
		clean: n.stopWidenings === 0,
		plan: {
			side: n.side,
			entry: n.entry,
			stop: n.initialStop,
			target: n.target,
			leverage: n.leverage
		},
		away: e.away,
		seen: !1,
		tradeId: n.id
	};
}
function sp(e) {
	return {
		id: `c-alert-${e.id}`,
		kind: "alert",
		t: e.now,
		coin: e.coin,
		name: e.name,
		sym: e.sym,
		side: null,
		price: e.level,
		r: null,
		grade: null,
		light: 0,
		medals: [],
		clean: !0,
		plan: null,
		away: !1,
		seen: !1,
		tradeId: null
	};
}
function cp(e, t) {
	return [...e.filter((e) => e.id !== t.id), t].sort((e, t) => e.t - t.t).slice(-50);
}
var lp = [
	"stop",
	"target",
	"alert",
	"liquidated"
];
function up(e) {
	let t = Array.isArray(e) ? e : [], n = [];
	for (let e of t) {
		if (!e || typeof e.id != "string" || !lp.includes(e.kind) || typeof e.coin != "string") continue;
		let t = e.plan;
		n.push({
			id: e.id,
			kind: e.kind,
			t: Number(e.t) || 0,
			coin: e.coin,
			name: String(e.name ?? e.coin),
			sym: String(e.sym ?? e.coin),
			side: e.side === "long" || e.side === "short" ? e.side : null,
			price: Number(e.price) || 0,
			r: e.r != null && Number.isFinite(Number(e.r)) ? Number(e.r) : null,
			grade: typeof e.grade == "string" ? e.grade : null,
			light: Number(e.light) || 0,
			medals: Array.isArray(e.medals) ? e.medals.filter((e) => typeof e == "string") : [],
			clean: e.clean !== !1,
			plan: t && (t.side === "long" || t.side === "short") && Number(t.entry) > 0 ? {
				side: t.side,
				entry: Number(t.entry),
				stop: t.stop != null && Number(t.stop) > 0 ? Number(t.stop) : null,
				target: t.target != null && Number(t.target) > 0 ? Number(t.target) : null,
				leverage: Number(t.leverage) || 1
			} : null,
			away: !!e.away,
			seen: !!e.seen,
			tradeId: typeof e.tradeId == "string" ? e.tradeId : null
		});
	}
	return n.sort((e, t) => e.t - t.t).slice(-50);
}
function dp(e, t) {
	return e.filter((e) => !e.seen && t - e.t < 432e5).slice(-3);
}
function fp(e) {
	if (e.kind === "alert") return "";
	if (e.kind === "liquidated") return "The margin is spent";
	let t = e.r;
	if (t == null) return e.clean ? "Exactly as written" : "";
	let n = `${t < 0 ? "−" : t > 0 ? "+" : ""}${(Math.round(Math.abs(t) * 10) / 10).toString()}R`;
	return e.clean ? `${n}, exactly as written` : n;
}
function pp(e) {
	let t = e && typeof e == "object" ? e : {};
	return {
		lastSeen: Number.isFinite(Number(t.lastSeen)) && Number(t.lastSeen) > 0 ? Number(t.lastSeen) : 0,
		armed: Array.isArray(t.armed) ? t.armed.filter((e) => typeof e == "string").slice(-20) : []
	};
}
function mp(e) {
	return e <= 3e8 ? "1m" : e <= 15e8 ? "5m" : e <= 45e8 ? "15m" : "1h";
}
function hp(e, t, n) {
	let r = Pa(e), i = e.side === "long", a = Math.max(n, e.openedAt);
	for (let n of t) if (!(n.time < a)) {
		if (i ? n.low <= r : n.high >= r) return {
			t: n.time,
			coin: e.coin,
			reason: "liquidation",
			price: r
		};
		if (e.stop != null && (i ? n.low <= e.stop : n.high >= e.stop)) {
			let t = i ? n.open < e.stop : n.open > e.stop;
			return {
				t: n.time,
				coin: e.coin,
				reason: "stop",
				price: t ? n.open : e.stop
			};
		}
		if (e.target != null && (i ? n.high >= e.target : n.low <= e.target)) {
			let t = i ? n.open > e.target : n.open < e.target;
			return {
				t: n.time,
				coin: e.coin,
				reason: "target",
				price: t ? n.open : e.target
			};
		}
	}
	return null;
}
function gp(e, t, n) {
	let r = [];
	for (let i of Object.values(e.positions)) {
		let e = hp(i, t[i.coin] ?? [], n);
		e && r.push(e);
	}
	return r.sort((e, t) => e.t - t.t || (e.coin < t.coin ? -1 : 1));
}
function _p(e, t) {
	return Ga(e, t.coin, void 0, t.price, t.reason, t.t);
}
//#endregion
//#region src/house/field.ts
var $ = (e) => e.replace(/[&<>"]/g, (e) => ({
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;"
})[e]), vp = (e) => e == null || !Number.isFinite(e) ? "—" : su(e), yp = (e) => `${e < 0 ? "−" : ""}$${Math.abs(e).toLocaleString("en-US", {
	maximumFractionDigits: e >= 100 ? 0 : 2,
	minimumFractionDigits: e >= 100 ? 0 : 2
})}`, bp = (e, t = 2) => `${e < 0 ? "−" : "+"}${Math.abs(e).toLocaleString("en-US", {
	minimumFractionDigits: t,
	maximumFractionDigits: t
})}`, xp = (e) => e === "long" ? "Long" : e === "short" ? "Short" : "", Sp = (e, t = Date.now()) => {
	let n = Math.max(0, Math.round((t - e) / 6e4));
	if (n < 1) return "just now";
	if (n < 60) return `${n} min ago`;
	let r = Math.round(n / 60);
	return r < 24 ? `${r} h ago` : `${Math.round(r / 24)} d ago`;
}, Cp = (e, t = "") => `<svg class="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${e}</svg>`, wp = {
	lock: "<rect x=\"5\" y=\"11\" width=\"14\" height=\"9.5\" rx=\"2\"/><path d=\"M8 11V8a4 4 0 0 1 8 0v3\"/><circle cx=\"12\" cy=\"15.5\" r=\"1.2\" fill=\"currentColor\"/>",
	bell: "<path d=\"M6 17.5h12l-1.6-2.4V10.5a4.4 4.4 0 0 0-8.8 0v4.6z\"/><path d=\"M10.3 20a1.9 1.9 0 0 0 3.4 0\"/><path d=\"M12 4.5V3\"/>",
	back: "<path d=\"M14.5 5.5 8 12l6.5 6.5\"/>",
	close: "<path d=\"M6 6l12 12M18 6 6 18\"/>",
	markets: "<path d=\"M3.5 20.5h17M5.5 20.5V10M10 20.5V10M14 20.5V10M18.5 20.5V10M3.5 10 12 4l8.5 6z\"/>",
	plan: "<path d=\"M7 3.5h10v17H7z\"/><path d=\"M9.8 8h4.4M9.8 11.5h4.4\"/><path d=\"M12 14.2l1.2 1.9 2.2.3-1.6 1.5.4 2.1-2.2-1-2.2 1 .4-2.1-1.6-1.5 2.2-.3z\"/>",
	journey: "<path d=\"M4 19c3-1 3-6 6-7s4-4 6-7\"/><circle cx=\"4.5\" cy=\"19\" r=\"1.4\"/><path d=\"M16.5 3.5l.9 2 2 .9-2 .9-.9 2-.9-2-2-.9 2-.9z\"/>",
	more: "<circle cx=\"5.5\" cy=\"12\" r=\"1.4\" fill=\"currentColor\"/><circle cx=\"12\" cy=\"12\" r=\"1.4\" fill=\"currentColor\"/><circle cx=\"18.5\" cy=\"12\" r=\"1.4\" fill=\"currentColor\"/>",
	desk: "<path d=\"M5.5 21V10.5a6.5 6.5 0 0 1 13 0V21\"/><path d=\"M2.5 21h19\"/><path d=\"M9 21v-6.5a3 3 0 0 1 6 0V21\" opacity=\".6\"/>",
	rotate: "<rect x=\"3\" y=\"7\" width=\"18\" height=\"10\" rx=\"2\"/><path d=\"M18 12h.01\"/>",
	oath: "<path d=\"M6 3.5h12v17H6z\"/><path d=\"M9 8h6M9 11.5h6\"/><circle cx=\"12\" cy=\"16\" r=\"2\"/>",
	target: "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><circle cx=\"12\" cy=\"12\" r=\"4.5\"/><circle cx=\"12\" cy=\"12\" r=\"1\" fill=\"currentColor\"/>",
	shield: "<path d=\"M12 3l7 3v5.5c0 4.3-3 7.7-7 9.5-4-1.8-7-5.2-7-9.5V6z\"/><path d=\"M8.5 12l2.5 2.5 4.5-5\"/>"
}, Tp = [
	{
		k: "stop",
		label: "Stop Defined",
		glyph: "<path d=\"M3 11h18\"/><path d=\"M12 11v8M8.5 15.5 12 19l3.5-3.5\"/>"
	},
	{
		k: "size",
		label: "Size Within Rule",
		glyph: "<path d=\"M12 4v15M7.5 19.5h9M4 7.5h16\"/><path d=\"M4 7.5 1.8 13.5a2.4 2.4 0 0 0 4.4 0zM20 7.5l-2.2 6a2.4 2.4 0 0 0 4.4 0z\"/>"
	},
	{
		k: "target",
		label: "Target Defined",
		glyph: wp.target
	}
], Ep = {
	A: "g-a",
	B: "g-b",
	C: "g-c",
	D: "g-d",
	F: "g-f"
}, Dp = (e) => `<span class="fd-coin fd-coin-art" aria-hidden="true">${Cp(e)}</span>`;
function Op(e, t) {
	let n = !1, r = document.createElement("div");
	r.id = "field", r.className = "fdev", r.setAttribute("role", "application"), r.setAttribute("aria-label", "Field device"), r.innerHTML = `
    <div class="fd-frame" aria-hidden="true"><i class="tl"></i><i class="tr"></i><i class="bl"></i><i class="br"></i></div>
    <div class="fd-top"><small>ATLAS VEYR</small><b id="fdTitle">MARKETS</b><span class="fd-link" id="fdLink" aria-hidden="true"></span></div>
    <div class="fd-body" id="fdBody"></div>
    <nav class="fd-tabs" aria-label="Field device">
      <button data-tab="markets">${Cp(wp.markets)}<span>MARKETS</span></button>
      <button data-tab="plan">${Cp(wp.plan)}<span>PLAN</span><b class="fd-count" id="fdPlanN" hidden></b></button>
      <button data-tab="ora" class="fd-oratab" aria-label="Ora"><span class="fd-oraring"><span class="fd-oraorb" id="fdTabOrb"></span></span><b class="fd-dot" id="fdOraDot" hidden></b></button>
      <button data-tab="journey">${Cp(wp.journey)}<span>JOURNEY</span></button>
      <button data-tab="more">${Cp(wp.more)}<span>MORE</span></button>
    </nav>
    <div class="fd-toast" id="fdToast" role="status"></div>
    <div class="fd-layer fd-call" id="fdCall" hidden></div>
    <div class="fd-layer fd-rearm" id="fdRearm" hidden></div>`, r.style.setProperty("--fd-bg", `url('${Gs("hall.webp")}')`), e.appendChild(r);
	let i = (e) => r.querySelector(e), a = i("#fdBody"), o = /* @__PURE__ */ new Set(), s = (e, t) => {
		let r = window.setTimeout(() => {
			o.delete(r), n || e();
		}, t);
		o.add(r);
	}, c = [];
	c.push(mc(i("#fdTabOrb")));
	let l = 0;
	function u(e, t = !1) {
		let n = i("#fdToast");
		n.textContent = e, n.className = t ? "fd-toast show bad" : "fd-toast show", clearTimeout(l), l = window.setTimeout(() => {
			n.className = "fd-toast";
		}, 2600);
	}
	let d = "markets";
	try {
		let e = sessionStorage.getItem("house:fieldtab");
		(e === "markets" || e === "plan" || e === "ora" || e === "journey" || e === "more") && (d = e);
	} catch {}
	let f = "", p = null, m = "above", h = (e) => {
		let n = t.snap().byKey[e];
		return Zs(e, n?.hall ?? "coins");
	}, g = {
		markets: "MARKETS",
		plan: "PLAN",
		ora: "ORA",
		journey: "JOURNEY",
		more: "MORE"
	};
	function _(e) {
		d = e;
		try {
			sessionStorage.setItem("house:fieldtab", e);
		} catch {}
		r.querySelectorAll(".fd-tabs button").forEach((t) => t.classList.toggle("on", t.dataset.tab === e)), i("#fdTitle").textContent = g[e], a.scrollTop = 0, S(!0), e === "ora" && dc();
	}
	r.querySelectorAll(".fd-tabs button").forEach((e) => e.onclick = () => _(e.dataset.tab));
	let v = () => !!document.activeElement && a.contains(document.activeElement) && /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName) || y, y = !1;
	function b(e) {
		let t = `${d}|${e.calls.length}|${e.calls.filter((e) => !e.seen).length}`;
		return d === "plan" ? `${t}|${Object.values(e.account.positions).map((e) => `${e.coin}${e.qty}${e.stop}${e.target}`).join()}|${e.account.orders.map((e) => `${e.id}${e.price}`).join()}|${e.armed.join()}` : d === "markets" ? `${t}|${e.alerts.map((e) => `${e.id}${e.firedAt}`).join()}|${p}|${m}|${e.catalog.length}` : d === "more" ? `${t}|${e.sound}|${e.relics.length}|${e.oath.setAt}` : d === "journey" ? `${t}|${e.grades.map((e) => e.t).join()}|${e.level.totalXp}|${e.rank.name}` : t;
	}
	function S(e = !1) {
		if (n) return;
		let o = t.snap(), s = Object.keys(o.account.positions).length + o.account.orders.length, c = i("#fdPlanN");
		c.hidden = s === 0, c.textContent = String(s), i("#fdOraDot").hidden = !o.calls.some((e) => !e.seen), i("#fdLink").className = `fd-link${o.connected ? " on" : ""}`;
		let l = b(o);
		if (!e && l === f) {
			C(o);
			return;
		}
		if (!e && v()) {
			C(o);
			return;
		}
		f = l, r.querySelectorAll(".fd-tabs button").forEach((e) => e.classList.toggle("on", e.dataset.tab === d)), i("#fdTitle").textContent = g[d];
		let u = a.scrollTop;
		d === "markets" ? a.innerHTML = T(o) : d === "plan" ? a.innerHTML = k(o) : d === "ora" ? a.innerHTML = j(o) : d === "journey" ? a.innerHTML = M(o) : a.innerHTML = ee(o), a.scrollTop = e ? 0 : u, te(o);
	}
	function C(e) {
		a.querySelectorAll("[data-fpx]").forEach((t) => {
			let n = e.marks[t.dataset.fpx];
			n && (t.textContent = vp(n));
		}), a.querySelectorAll("[data-fchg]").forEach((t) => {
			let n = t.dataset.fchg, r = e.byKey[n], i = e.marks[n];
			if (!r || !i || !(r.prevDayPx > 0)) return;
			let a = (i / r.prevDayPx - 1) * 100;
			t.textContent = `${a >= 0 ? "+" : "−"}${Math.abs(a).toFixed(2)}%`, t.className = a >= 0 ? "up" : "dn";
		}), a.querySelectorAll("[data-fpnl]").forEach((t) => {
			let n = e.account.positions[t.dataset.fpnl], r = n && e.marks[n.coin];
			if (!n || !r) return;
			let i = Fa(n, r);
			t.textContent = `${bp(i)}`, t.className = `fd-pnl ${i >= 0 ? "up" : "dn"}`;
		}), a.querySelectorAll("[data-fpr]").forEach((t) => {
			let n = e.account.positions[t.dataset.fpr], r = n && e.marks[n.coin];
			if (!n || !r) return;
			let i = n.initialStop == null ? 0 : Math.abs(n.entry - n.initialStop) * n.initialQty;
			t.textContent = i > 0 ? `${bp((Fa(n, r) + n.bookedPnl) / i, 1)}R` : "";
		});
	}
	function w(e) {
		let t = e.catalog.filter((e) => e.name).sort((e, t) => t.dayNtlVlm - e.dayNtlVlm), n = e.catalog.filter((e) => !e.name && !e.isDelisted).sort((e, t) => t.dayNtlVlm - e.dayNtlVlm).slice(0, 36);
		return [...t, ...n];
	}
	function T(e) {
		return `<div class="fd-list">${w(e).map((t) => {
			let n = e.marks[t.key] ?? t.markPx, r = t.prevDayPx > 0 && n ? (n / t.prevDayPx - 1) * 100 : null, i = e.alerts.filter((e) => e.coin === t.key && e.firedAt == null), a = p === t.key, o = t.name ? t.name.toUpperCase() : $(t.ticker), s = "";
			if (a) {
				let n = e.marks[t.key] ?? t.markPx, r = Yc(m, n);
				s = `<div class="fd-bellp" data-bp="${$(t.key)}">
          <div class="fd-seg"><button data-bd="above" class="${m === "above" ? "on" : ""}">ABOVE</button><button data-bd="below" class="${m === "below" ? "on" : ""}">BELOW</button></div>
          <input type="number" inputmode="decimal" step="any" value="${+r.toPrecision(6)}" aria-label="Bell level" />
          <button class="fd-gold sm" data-hang="${$(t.key)}">HANG</button>
          ${i.map((e) => `<div class="fd-armed"><span>${Cp(wp.bell)}${e.dir === "above" ? "≥" : "≤"} ${su(e.level)}</span><button data-unbell="${$(e.id)}" aria-label="Take the bell down">${Cp(wp.close)}</button></div>`).join("")}
        </div>`;
			}
			return `<div class="fd-lot${t.name ? " named" : ""}" data-lot="${$(t.key)}">
        <span class="fd-med">${Zs(t.key, t.hall)}</span>
        <div class="fd-lotn"><b>${o}</b><i>${$(e.sym(t.key))}</i></div>
        <div class="fd-lotp"><b data-fpx="${$(t.key)}">${vp(n)}</b><em data-fchg="${$(t.key)}" class="${r == null ? "" : r >= 0 ? "up" : "dn"}">${r == null ? "" : `${r >= 0 ? "+" : "−"}${Math.abs(r).toFixed(2)}%`}</em></div>
        <button class="fd-bell${i.length ? " on" : ""}" data-bell="${$(t.key)}" aria-label="Bell">${Cp(wp.bell)}${i.length ? `<b>${i.length}</b>` : ""}</button>
        ${s}</div>`;
		}).join("") || "<p class=\"fd-empty\">The board is loading.</p>"}</div>`;
	}
	function E(e, t, n, r) {
		let i = Jf(e, n), a = t ?? (e === "long" ? n * .97 : n * 1.03), o = e === "long" ? i > a : i < a;
		return `<div class="fd-tight" data-tg="${$(r)}" data-side="${e}" data-cur="${a}" data-edge="${i}" data-had="${t == null ? 0 : 1}">
      <div class="fd-trow"><span>STOP <i>(TIGHTEN ONLY)</i></span>
        <input class="fd-num" type="number" inputmode="decimal" step="any" value="${+(t ?? a).toPrecision(6)}" aria-label="Stop" /></div>
      <input class="fd-range" type="range" min="0" max="1000" step="1" value="0" ${o ? "" : "disabled"} aria-label="Tighten the stop" />
      <p class="fd-lockline">${Cp(wp.lock)}<span>Widen only at the House</span></p>
    </div>`;
	}
	function D(e, t) {
		let n = e.marks[t.coin] ?? t.entry, r = Fa(t, n), i = t.initialStop == null ? 0 : Math.abs(t.entry - t.initialStop) * t.initialQty, a = i > 0 ? (r + t.bookedPnl) / i : null;
		return `<article class="fd-card fd-pos" data-pos="${$(t.coin)}">
      <header class="fd-lothead"><span class="fd-med">${h(t.coin)}</span>
        <div class="fd-lotn"><b>${$(e.nameOf(t.coin).toUpperCase())}</b><i>${$(e.sym(t.coin))} · ${xp(t.side).toUpperCase()} ${t.leverage}×</i></div>
        <div class="fd-lotp"><b data-fpx="${$(t.coin)}">${vp(n)}</b><em data-fpr="${$(t.coin)}" class="${(a ?? 0) >= 0 ? "up" : "dn"}">${a == null ? "" : `${bp(a, 1)}R`}</em></div></header>
      <div class="fd-pnlrow"><span>UNREALISED</span><b data-fpnl="${$(t.coin)}" class="fd-pnl ${r >= 0 ? "up" : "dn"}">${bp(r)}</b></div>
      <div class="fd-facts"><span><i>ENTRY</i><b>${vp(t.entry)}</b></span><span><i>TARGET</i><b>${vp(t.target)}</b></span><span><i>LIQ</i><b>${vp(Pa(t))}</b></span></div>
      ${E(t.side, t.stop, n, t.coin)}
      <div class="fd-btns"><button class="fd-ghost" data-half="${$(t.coin)}">TAKE HALF</button><button class="fd-ember" data-closeall="${$(t.coin)}">CLOSE</button></div>
    </article>`;
	}
	function O(e, t) {
		let n = e.armed.includes(t.id);
		return `<article class="fd-card fd-ord">
      <header class="fd-lothead"><span class="fd-med">${h(t.coin)}</span>
        <div class="fd-lotn"><b>${$(e.nameOf(t.coin).toUpperCase())}</b><i>${$(e.sym(t.coin))} · ${t.reduceOnly ? "REDUCE" : t.side === "long" ? "BUY" : "SELL"} ${t.type.toUpperCase()}</i></div>
        <div class="fd-lotp"><b>${vp(t.price)}</b>${n ? "<em class=\"fd-armedtag\">ARMED</em>" : ""}</div></header>
      <div class="fd-facts"><span><i>STOP</i><b>${vp(t.stop)}</b></span><span><i>TARGET</i><b>${vp(t.target)}</b></span><span><i>NOW</i><b data-fpx="${$(t.coin)}">${vp(e.marks[t.coin])}</b></span></div>
      <div class="fd-btns"><button class="fd-ghost" data-cancel="${$(t.id)}">CANCEL</button></div>
    </article>`;
	}
	function k(e) {
		let t = Object.values(e.account.positions), n = e.account.orders;
		if (!t.length && !n.length) return `<div class="fd-quiet-state">${Cp(wp.plan)}<p>No plan is working.</p></div>`;
		let r = Qf(e.relics), i = $f(n, e.armed);
		return `<div class="fd-stack">${t.length ? "<h3 class=\"fd-h\">POSITIONS</h3>" + t.map((t) => D(e, t)).join("") : ""}
      ${n.length ? `<h3 class="fd-h">WORKING ORDERS<span class="fd-slots">REARM ${i} / ${r}</span></h3>` + n.map((t) => O(e, t)).join("") : ""}</div>`;
	}
	function A(e) {
		if (e.kind === "alert") return Dp(wp.bell);
		if (e.kind === "liquidated") return `<img class="fd-coin ember" src="${Gs("medal/HUMILIATION.webp")}" alt="" draggable="false" />`;
		if (e.kind === "stop" && e.clean) return `<img class="fd-coin" src="${Gs("medal/STOP_HONORED.webp")}" alt="" draggable="false" />`;
		let t = [
			"SNIPER",
			"EXCELLENT",
			"IRON_WILL"
		].find((t) => e.medals.includes(t));
		return t ? `<img class="fd-coin" src="${Gs(`medal/${t}.webp`)}" alt="" draggable="false" />` : Dp(e.kind === "target" ? wp.target : wp.shield);
	}
	function j(e) {
		let t = [...e.calls].reverse();
		return t.length ? `<div class="fd-stack">${t.map((e) => `<button class="fd-feed ${e.kind}${e.seen ? "" : " new"}" data-call="${$(e.id)}">
      <span class="fd-feedcoin">${A(e)}</span>
      <span class="fd-feedtx"><b>${$(ip(e.kind))}${e.away ? "<em>while you walked</em>" : ""}</b>
        <i>${$(e.name.toUpperCase())} · ${$(e.sym)}</i>
        <q>${$(e.kind === "alert" ? `${e.name} crossed ${su(e.price)}. Your bell rang.` : rp[e.kind])}</q></span>
      <span class="fd-feedr">${e.kind === "alert" ? "" : `<b class="${(e.r ?? -1) >= 0 ? "up" : "dn"}">${e.r == null ? "" : `${e.r < 0 ? "−" : "+"}${Math.round(Math.abs(e.r) * 10) / 10}R`}</b>`}<small>${Sp(e.t)}</small></span></button>`).join("")}</div>` : "<div class=\"fd-quiet-state\"><span class=\"fd-bigorb\" id=\"fdBigOrb\"></span><p>Ora is listening.</p></div>";
	}
	function M(e) {
		let t = e.level, n = Math.max(1, t.nextXp - t.floorXp), r = Math.max(0, Math.min(1, (t.totalXp - t.floorXp) / n)), i = e.grades.slice(0, 5);
		return `<div class="fd-stack">
      <section class="fd-card fd-rank"><div class="fd-rankl"><small>RANK</small><b>${$(e.rank.name.toUpperCase())} ${$(e.rank.numeral)}</b></div>
        <div class="fd-rankr"><small>LEVEL</small><b>${t.level}</b></div>
        <div class="fd-bar"><i style="width:${(r * 100).toFixed(1)}%"></i></div>
        <p class="fd-barcap"><span>${Math.round(t.totalXp)} Light</span><span>${t.nextXp > 0 ? `${Math.round(t.nextXp)}` : ""}</span></p></section>
      <section class="fd-card fd-streak"><span class="fd-streakn">${e.streak}</span><div><b>STREAK</b><i>${e.streak === 1 ? "trade" : "trades"} with every seal kept</i></div>${Cp(wp.shield)}</section>
      <section class="fd-card"><h3 class="fd-h in">TRIALS</h3>${e.plaques.map((e) => `<div class="fd-trial${e.done ? " done" : ""}"><span>${$(e.title)}</span><b>${e.n}/${e.of}</b><div class="fd-bar sm"><i style="width:${e.n / e.of * 100}%"></i></div></div>`).join("")}</section>
      <section class="fd-card"><h3 class="fd-h in">LAST GRADES</h3>${i.length ? `<div class="fd-grades">${i.map((t) => `<div class="fd-grade ${Ep[t.grade] ?? ""}"><b>${$(t.grade)}</b><i>${$(e.nameOf(t.coin).toUpperCase())}</i><em>${t.light > 0 ? `+${Math.round(t.light)}` : "0"}</em></div>`).join("")}</div>` : "<p class=\"fd-empty\">No graded trades yet.</p>"}</section>
    </div>`;
	}
	function ee(e) {
		let t = e.oath;
		return `<div class="fd-stack">
      <button class="fd-gold wide" id="fdDesk">${Cp(wp.desk)}<span>RETURN TO THE HOUSE</span>${Cp(wp.rotate, "rot")}</button>
      <section class="fd-card"><div class="fd-set"><span>Sound</span><button class="fd-switch${e.sound ? " on" : ""}" id="fdSound" role="switch" aria-checked="${e.sound}" aria-label="Sound"><i></i></button></div></section>
      <section class="fd-card"><h3 class="fd-h in">${Cp(wp.oath, "sm")} THE OATH</h3>
        <div class="fd-oath"><span><i>RISK</i><b>${t.riskPct}%</b></span><span><i>LEVERAGE</i><b>${t.maxLeverage}×</b></span><span><i>TRADES / DAY</i><b>${t.tradesPerDay}</b></span></div>
        <p class="fd-lockline">${Cp(wp.lock)}<span>Widen only at the House</span></p></section>
      <section class="fd-card"><div class="fd-set"><span>Rearm slots</span><b class="fd-gold-t">${Qf(e.relics)}</b></div></section>
    </div>`;
	}
	let N = [];
	function te(e) {
		for (let e of N.splice(0)) e();
		a.querySelectorAll("[data-bell]").forEach((e) => e.onclick = (t) => {
			t.stopPropagation();
			let n = e.dataset.bell;
			p = p === n ? null : n, S(!0);
		}), a.querySelectorAll("[data-bd]").forEach((e) => e.onclick = () => {
			m = e.dataset.bd, S(!0);
		}), a.querySelectorAll("[data-hang]").forEach((n) => n.onclick = () => {
			let r = n.dataset.hang, i = parseFloat(n.parentElement.querySelector("input").value), a = e.marks[r] ?? e.byKey[r]?.markPx;
			if (!(i > 0)) return u("Enter a level.", !0);
			if (a && (m === "above" ? i <= a : i >= a)) return u(m === "above" ? "A bell above must hang over the price." : "A bell below must hang under the price.", !0);
			let o = t.snap().alerts.filter((e) => e.firedAt == null).length;
			t.setAlert(r, m, i), t.snap().alerts.filter((e) => e.firedAt == null).length > o && (u("The bell is hung."), p = null), S(!0);
		}), a.querySelectorAll("[data-unbell]").forEach((e) => e.onclick = () => {
			t.removeAlert(e.dataset.unbell), S(!0);
		}), a.querySelectorAll("[data-closeall]").forEach((e) => e.onclick = () => {
			t.closeAll(e.dataset.closeall), S(!0);
		}), a.querySelectorAll("[data-half]").forEach((e) => e.onclick = () => {
			t.reduceHalf(e.dataset.half), S(!0);
		}), a.querySelectorAll("[data-cancel]").forEach((e) => e.onclick = () => {
			t.cancelOrder(e.dataset.cancel), S(!0);
		}), a.querySelectorAll("[data-call]").forEach((e) => e.onclick = () => {
			let n = t.snap().calls.find((t) => t.id === e.dataset.call);
			n && R([n], !0);
		}), a.querySelectorAll(".fd-tight").forEach(ne);
		let n = a.querySelector("#fdDesk");
		n && (n.onclick = () => t.desk());
		let r = a.querySelector("#fdSound");
		r && (r.onclick = () => {
			t.setSound(!t.snap().sound), S(!0);
		});
		let i = a.querySelector("#fdBigOrb");
		i && N.push(mc(i));
	}
	function ne(e) {
		let n = e.dataset.side, r = parseFloat(e.dataset.cur), i = parseFloat(e.dataset.edge), a = e.dataset.tg, o = e.querySelector(".fd-range"), s = e.querySelector(".fd-num"), c = e.querySelector(".fd-lockline"), l = () => {
			c.classList.remove("shake"), c.offsetWidth, c.classList.add("shake");
		}, d = (c) => {
			let d = t.snap().marks[a] ?? i, f = e.dataset.had === "1";
			if (!qf(n, f ? r : null, c, d).ok) {
				l(), s.value = String(+r.toPrecision(6)), o.value = "0";
				return;
			}
			let p = t.tighten(a, c);
			if (p) {
				u(p, !0), l();
				return;
			}
			u("Stop tightened.");
		};
		o.oninput = () => {
			s.value = String(+Xf(r, i, o.valueAsNumber / 1e3).toPrecision(6));
		}, o.onpointerdown = () => {
			y = !0;
		};
		let f = () => {
			y = !1;
		};
		o.onpointerup = f, o.onpointercancel = f, o.onchange = () => {
			y = !1, o.valueAsNumber > 0 && d(Xf(r, i, o.valueAsNumber / 1e3));
		}, s.onchange = () => {
			let c = parseFloat(s.value);
			if (!(c > 0)) {
				s.value = String(+r.toPrecision(6));
				return;
			}
			let u = e.dataset.had === "1", f = t.snap().marks[a] ?? i, p = Yf(n, u ? r : null, c, f);
			p !== c && l(), s.value = String(+p.toPrecision(6)), o.value = String(Math.round(Zf(r, i, p) * 1e3)), p !== r && d(p);
		};
	}
	let P = [], F = !1, re = [], I = () => {
		for (let e of re.splice(0)) e();
	};
	function L(e, t, n) {
		let r = e.kind === "stop" ? `${xp(e.side)}, ${e.clean ? "stop honored" : "stopped"} at ${su(e.price)}` : e.kind === "target" ? `${xp(e.side)}, target taken at ${su(e.price)}` : e.kind === "liquidated" ? `${xp(e.side)}, liquidated at ${su(e.price)}` : "Your bell rang", i = e.kind === "alert" ? `Crossed ${su(e.price)}` : fp(e), a = e.kind === "alert" ? `${e.name} crossed ${su(e.price)}. Your bell rang.` : rp[e.kind], o = e.kind === "stop" && e.clean ? "STOP HONORED" : ip(e.kind), s = !!e.plan && e.plan.stop != null;
		return `
      <div class="fd-callhead"><small>ATLAS VEYR</small><h1>THE CALL</h1><p>Discipline makes a higher tomorrow</p></div>
      <div class="fd-orbwrap"><div class="fd-callorb" id="fdCallOrb"></div></div>
      ${e.away ? "<div class=\"fd-away\">WHILE YOU WALKED</div>" : ""}
      <div class="fd-card fd-callcard ${e.kind}">
        <div class="fd-lothead"><span class="fd-med lg">${h(e.coin)}</span>
          <div class="fd-lotn"><b>${$(e.name.toUpperCase())}</b><i>${$(e.sym)}</i><em>${$(r)}</em></div></div>
        ${i ? `<div class="fd-result ${e.kind}">${$(i)}</div>` : ""}
        <div class="fd-coinrow">${A(e)}<div class="fd-coincap"><b>${$(o)}</b>${e.light > 0 ? `<span class="fd-light">+${e.light} Light</span>` : ""}</div></div>
      </div>
      <blockquote class="fd-quote"><span class="fd-qorb" id="fdQOrb" aria-hidden="true"></span><p>${$(a)}</p><cite>— ORA</cite></blockquote>
      <div class="fd-actions">
        ${s ? "<button class=\"fd-gold\" id=\"fdRearmBtn\">REARM THE PLAN</button>" : "<button class=\"fd-gold\" id=\"fdLotBtn\">OPEN THE LOT</button>"}
        <button class="fd-quiet" id="fdLater">${F ? "BACK" : "LATER"}</button>
      </div>
      ${n > 1 ? `<div class="fd-pips">${Array.from({ length: n }, (e, n) => `<i class="${n === t ? "on" : ""}"></i>`).join("")}</div>` : ""}`;
	}
	function R(e, t = !1) {
		!n && e.length && (P = [...e], F = t, z());
	}
	function z() {
		let e = P[0], n = i("#fdCall");
		if (!e) {
			n.hidden = !0, I(), n.innerHTML = "";
			return;
		}
		I(), n.innerHTML = L(e, 0, P.length), n.hidden = !1, n.dataset.kind = e.kind, n.scrollTop = 0, re.push(mc(i("#fdCallOrb")), mc(i("#fdQOrb"))), s(() => dc(), 350);
		let r = () => {
			F || t.seen([e.id]), P.shift(), z(), S(!0);
		};
		i("#fdLater").onclick = r;
		let a = n.querySelector("#fdRearmBtn");
		a && (a.onclick = () => {
			F || t.seen([e.id]), P = P.slice(1), z(), ae(e);
		});
		let o = n.querySelector("#fdLotBtn");
		o && (o.onclick = () => {
			F || t.seen([e.id]), P.shift(), z(), _("markets");
		});
	}
	let B = [], ie = () => {
		for (let e of B.splice(0)) e();
	}, V = [];
	function H() {
		ie();
		let e = i("#fdRearm");
		if (e.hidden = !0, e.innerHTML = "", V.length) {
			let e = V;
			V = [], R(e);
		}
		S(!0);
	}
	function ae(e) {
		let r = e.plan;
		if (!r || r.stop == null) return;
		V = P.slice(), P = [];
		let a = i("#fdRearm");
		ie();
		let o = t.snap(), c = r.side, l = r.stop, d = r.entry, f = Jf(c, d), p = l, m = () => t.snap().marks[e.coin] ?? d;
		a.innerHTML = `
      <header class="fd-rhead"><button class="fd-x" id="fdRBack" aria-label="Back">${Cp(wp.back)}</button>
        <span class="fd-med">${h(e.coin)}</span>
        <div class="fd-lotn"><b>${$(e.name.toUpperCase())}</b><i>${$(e.sym)} · ${xp(c).toUpperCase()}</i></div>
        <div class="fd-lotp"><b id="fdRPx">${vp(m())}</b></div></header>
      <div class="fd-chartbox"><div class="fd-chart" id="fdRChart"></div>
        <div class="fd-legend"><span class="e">ENTRY ${vp(d)}</span><span class="s" id="fdRLegS">STOP ${vp(p)}</span><span class="t">TARGET ${vp(r.target)}</span></div></div>
      <div class="fd-seals" id="fdSeals">${Tp.map((e) => `<div class="fd-seal" data-seal="${e.k}">${Cp(e.glyph)}<span>${e.label}</span></div>`).join("")}</div>
      <section class="fd-card fd-rparams">
        <div class="fd-prow"><span>SIZE <i>(RISK)</i></span><div class="fd-ro"><b>${o.oath.riskPct}% of account</b>${Cp(wp.lock)}</div></div>
        <div class="fd-pnote" id="fdRSize"></div>
        <div class="fd-tight" id="fdRTight"><div class="fd-trow"><span>STOP <i>(TIGHTEN ONLY)</i></span><input class="fd-num" id="fdRNum" type="number" inputmode="decimal" step="any" value="${+p.toPrecision(6)}" aria-label="Stop" /></div>
          <input class="fd-range" id="fdRRange" type="range" min="0" max="1000" step="1" value="0" aria-label="Tighten the stop" />
          <p class="fd-lockline" id="fdRLock">${Cp(wp.lock)}<span>Widen only at the House</span></p></div>
      </section>
      <div class="fd-actions rearm"><button class="fd-gold" id="fdSealBtn">SEAL THE PLAN</button><p class="fd-slotline" id="fdRSlots"></p></div>`, a.hidden = !1, a.scrollTop = 0;
		let g = Ei(a.querySelector("#fdRChart"), {
			autoSize: !0,
			layout: {
				background: { color: "transparent" },
				textColor: "#8a8472",
				fontFamily: "Barlow Condensed, sans-serif",
				fontSize: 11,
				attributionLogo: !1
			},
			grid: {
				vertLines: { color: "rgba(212,176,106,.06)" },
				horzLines: { color: "rgba(212,176,106,.08)" }
			},
			rightPriceScale: {
				borderVisible: !1,
				scaleMargins: {
					top: .12,
					bottom: .12
				}
			},
			timeScale: {
				borderVisible: !1,
				timeVisible: !0,
				secondsVisible: !1,
				rightOffset: 3
			},
			crosshair: {
				mode: 0,
				vertLine: {
					visible: !1,
					labelVisible: !1
				},
				horzLine: {
					visible: !1,
					labelVisible: !1
				}
			},
			handleScroll: !1,
			handleScale: !1
		}), v = g.addSeries(Ki, {
			upColor: "#57d6a3",
			downColor: "#e2875a",
			borderUpColor: "#57d6a3",
			borderDownColor: "#e2875a",
			wickUpColor: "#57d6a3",
			wickDownColor: "#e2875a",
			priceLineVisible: !1,
			lastValueVisible: !1,
			autoscaleInfoProvider: (e) => {
				let t = e(), n = [
					d,
					p,
					r.target
				].filter((e) => e != null);
				return t && {
					...t,
					priceRange: {
						minValue: Math.min(t.priceRange.minValue, ...n),
						maxValue: Math.max(t.priceRange.maxValue, ...n)
					}
				};
			}
		}), y = (e, t, n, r) => v.createPriceLine({
			price: e,
			color: t,
			lineWidth: 2,
			lineStyle: r,
			axisLabelVisible: !0,
			title: n
		});
		y(d, "#d4b06a", "ENTRY", x.Solid);
		let b = y(p, "#e2875a", "STOP", x.Dashed);
		r.target != null && y(r.target, "#3fd3c8", "TARGET", x.Dashed);
		let S = 0, C = () => {
			if (n || !g) return;
			let r = t.candles(e.coin);
			if (!r || r.length < 5) {
				S++ < 20 && s(C, 600);
				return;
			}
			v.setData(r.map((e) => ({
				time: e.time,
				open: e.open,
				high: e.high,
				low: e.low,
				close: e.close
			})));
			let i = r.length;
			g.timeScale().setVisibleLogicalRange({
				from: Math.max(0, i - 56),
				to: i + 3
			});
		};
		C(), B.push(() => {
			try {
				g?.remove();
			} catch {}
			g = null;
		});
		let w = a.querySelector("#fdRNum"), T = a.querySelector("#fdRRange"), E = a.querySelector("#fdRLock"), D = () => {
			E.classList.remove("shake"), E.offsetWidth, E.classList.add("shake");
		};
		function O() {
			let n = t.snap(), i = Math.max(1, Math.min(r.leverage, n.oath.maxLeverage, n.byKey[e.coin]?.maxLeverage ?? 10)), o = lo(n.equity, n.oath.riskPct, d, p), s = o / d, l = ts({
				side: c,
				entry: d,
				stop: p,
				target: r.target,
				qty: s,
				leverage: i
			}, {
				equity: n.equity,
				tradesToday: n.tradesToday
			}, n.oath, n.atr(e.coin)), u = {
				stop: l.stop.ok,
				size: l.size.ok,
				target: l.target.ok
			};
			a.querySelectorAll(".fd-seal").forEach((e) => e.classList.toggle("lit", u[e.dataset.seal]));
			let f = ep(n.account.orders, n.armed, n.relics), h = Qf(n.relics), g = $f(n.account.orders, n.armed);
			a.querySelector("#fdRSlots").textContent = `${g} / ${h}`, a.querySelector("#fdRSize").textContent = `${yp(o)} at ${i}× · risk ${yp(o * Math.abs(d - p) / d)}`, a.querySelector("#fdRLegS").textContent = `STOP ${vp(p)}`, a.querySelector("#fdRPx").textContent = vp(m());
			let _ = a.querySelector("#fdSealBtn"), v = u.stop && u.size && u.target && l.trades.ok, y = !!n.account.positions[e.coin];
			_.disabled = !(v && f && !y && o > 0), _.textContent = f ? y ? "ALREADY IN" : l.trades.ok ? "SEAL THE PLAN" : "THE DAY IS FULL" : "SLOTS FULL";
		}
		let k = (e) => {
			p = Yf(c, l, e, d), w.value = String(+p.toPrecision(6)), T.value = String(Math.round(Zf(l, f, p) * 1e3)), b.applyOptions({ price: p }), O();
		};
		T.oninput = () => k(Xf(l, f, T.valueAsNumber / 1e3)), w.onchange = () => {
			let e = parseFloat(w.value);
			if (!(e > 0)) return k(p);
			Yf(c, l, e, d) !== e && D(), k(e);
		}, a.querySelector("#fdRBack").onclick = H, a.querySelector("#fdSealBtn").onclick = () => {
			let n = t.snap(), i = Math.max(1, Math.min(r.leverage, n.oath.maxLeverage, n.byKey[e.coin]?.maxLeverage ?? 10)), o = lo(n.equity, n.oath.riskPct, d, p), l = t.seal({
				coin: e.coin,
				side: c,
				entry: d,
				stop: p,
				target: r.target,
				leverage: i,
				notional: o,
				type: np(c, d, m())
			});
			if (!l.ok) return u(l.error, !0);
			u("The plan is sealed."), a.classList.add("sealed"), s(() => {
				a.classList.remove("sealed"), V = [], H(), _("plan");
			}, 650);
		}, O();
		let A = window.setInterval(() => {
			!n && !a.hidden && O();
		}, 1e3);
		B.push(() => clearInterval(A));
	}
	return _(d), {
		el: r,
		update() {
			n || S(!1);
		},
		showCalls(e) {
			R(e);
		},
		destroy() {
			n = !0, o.forEach((e) => clearTimeout(e)), o.clear(), clearTimeout(l), I(), ie();
			for (let e of N.splice(0)) e();
			for (let e of c.splice(0)) try {
				e();
			} catch {}
			r.remove();
		}
	};
}
//#endregion
//#region src/house/rooms/forge.ts
var kp = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5\" y=\"10.5\" width=\"14\" height=\"10\" rx=\"2\"/><path d=\"M8 10.5V8a4 4 0 0 1 8 0v2.5\"/></svg>", Ap = Object.fromEntries(ru.map((e) => [e.key, e.glow])), jp = Object.fromEntries(ru.map((e) => [e.key, e.name])), Mp = {
	HEAD: "HEAD",
	GAUNTLET: "GAUNTLET",
	"SIGIL RING": "SIGIL RING",
	"CLOAK CLASP": "CLOAK CLASP",
	LANTERN: "LANTERN",
	CLOAK: "CLOAK",
	"FIELD DEVICE": "FIELD DEVICE"
}, Np = [
	"HEAD",
	"GAUNTLET",
	"SIGIL RING",
	"CLOAK CLASP"
], Pp = [
	"LANTERN",
	"CLOAK",
	"FIELD DEVICE"
], Fp = (e) => `<img src="${Gs(`el/${e}.webp`)}" alt="" draggable="false" />`, Ip = (e) => `<img src="${Gs(`relic/${e}.webp`)}" alt="" draggable="false" />`, Lp = (e) => e.toUpperCase();
function Rp(e, t, n) {
	Au(e, "room-forge");
	let r = t, i = !1, a = !1, o = !1, s = m(), c = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Set(), d = (e, t) => {
		let n = setTimeout(() => {
			c.delete(n), i || e();
		}, t);
		c.add(n);
	};
	e.innerHTML = `
    <div class="fg-grid">
      ${Q("lite fg-char", "<div data-s=\"char\"></div>")}
      ${Q("fg-vault", `<h3 class="rp-title">${Mu}<span>VAULT OF ESSENCE</span></h3><p class="fg-sub">Elements minted only from planned wins</p>
        <div class="fg-tubes" data-s="tubes"></div><p class="fg-foot">Elements are minted only from planned wins on the five core lots.</p>`)}
      ${Q("fg-forge", `<h3 class="rp-title">${Mu}<span>THE FORGE</span></h3><p class="fg-sub">Transform elements into relics</p>
        <div class="fg-stage" data-s="stage">
          <div class="fg-anvil" aria-hidden="true"><i class="fa-glow"></i><i class="fa-ring r1"></i><i class="fa-ring r2"></i><i class="fa-ring r3"></i><i class="fa-disc"></i></div>
          <div class="fg-relic" data-s="relic"></div>
          <i class="fg-flare" data-s="flare"></i>
        </div>
        <div class="fg-info" data-s="info"></div>`)}
      ${Q("fg-gear", `<h3 class="rp-title">${Mu}<span>ATLAS&rsquo;S GEAR</span></h3><p class="fg-sub">Relics shape a higher you</p>
        <div class="fg-atlas" data-s="atlas"><img class="fg-fig" src="${Gs("atlas-full.webp")}" alt="" draggable="false" /><i class="fg-aura" data-s="aura"></i></div>
        <div class="fg-slots left" data-s="sl"></div><div class="fg-slots right" data-s="sr"></div>
        <p class="fg-count" data-s="count"></p>`)}
      ${Q("fg-recipes", `<h3 class="rp-title rp-small">${Mu}<span>FORGE RECIPES</span></h3><div class="fr-strip" data-s="strip"></div>`)}
      ${Q("lite fg-ora", "<div class=\"ora-orb\" data-s=\"orb\"></div><div class=\"ora-say\"><small>ORA &middot; COMPANION OF LIGHT</small><q>What you forge here was paid for with patience.</q></div>")}
      <div class="fg-fx" data-s="fx" aria-hidden="true"></div>
    </div>`;
	let f = (t) => e.querySelector(`[data-s="${t}"]`), p = mc(f("orb"));
	function m() {
		let e = Pf.filter((e) => !r.relics.some((t) => t.id === e.id));
		return (e.find((e) => Rf(e.id, r.vault, r.relics, r.rank.index).ok) ?? e[0] ?? Pf[0]).id;
	}
	function h() {
		let e = r.character, t = e.nextXp - e.floorXp, n = t > 0 ? Math.min(100, Math.max(0, (e.totalXp - e.floorXp) / t * 100)) : 0;
		f("char").innerHTML = `<div class="cc-portrait"><img src="${Gs("atlas.webp")}" alt="" draggable="false" /></div>
      <div class="cc-body"><h2>${Z(e.name)}</h2>
        <div class="cc-lv"><span>LEVEL <b>${e.level}</b></span><em>${Math.round(e.totalXp).toLocaleString("en-US")} / ${Math.round(e.nextXp).toLocaleString("en-US")} Light</em></div>
        <div class="cc-bar"><i style="width:${n.toFixed(1)}%"></i></div>
        <div class="cc-rank"><span>RANK</span><b>${Z(e.rank)}</b></div></div>`;
	}
	function g() {
		let e = Ff(s)?.cost ?? {};
		f("tubes").innerHTML = jf.map((t) => {
			let n = Math.max(0, Math.floor(r.vault[t] ?? 0));
			return `<div class="fg-tube${n > 0 ? " has" : ""}${e[t] ? " need" : ""}" data-el="${t}" style="--glow:${Ap[t]}">
        <div class="glass"><i class="liq"></i><span class="gem">${Fp(t)}</span></div><b>${jp[t]}</b><i class="n">&times;${n}</i></div>`;
		}).join("");
	}
	function _(e) {
		return jf.filter((t) => e.cost[t]).map((t) => {
			let n = Math.max(0, Math.floor(r.vault[t] ?? 0)), i = e.cost[t];
			return `<span class="chip${n >= i ? " ok" : " short"}">${Fp(t)}<b>${Math.min(n, 99)}/${i}</b></span>`;
		}).join("");
	}
	function v() {
		f("strip").innerHTML = Pf.map((e) => {
			let t = r.relics.some((t) => t.id === e.id), n = !t && r.rank.index < y(e);
			return `<button type="button" class="fr-card${e.id === s ? " on" : ""}${n ? " locked" : ""}${t ? " owned" : ""}" data-recipe="${e.id}">
        ${n ? `<span class="fr-lock">${kp}</span>` : ""}
        <span class="fr-art">${Ip(e.id)}</span><b class="fr-nm">${Z(e.name)}</b>
        ${n ? `<small class="fr-req">Requires ${Lp(e.rank)}</small>` : t ? "<small class=\"fr-req ok\">Forged</small>" : `<span class="fr-cost">${_(e)}</span>`}</button>`;
		}).join("");
	}
	let y = (e) => If(e.rank);
	function b() {
		let e = Ff(s), t = Rf(e.id, r.vault, r.relics, r.rank.index), n = t.block === "owned";
		f("relic").innerHTML = Ip(e.id), f("relic").classList.toggle("dim", !t.ok && !n), f("relic").classList.toggle("hidden", o);
		let i = jf.filter((t) => e.cost[t]).map((t) => {
			let i = Math.max(0, Math.floor(r.vault[t] ?? 0)), a = e.cost[t], o = Array.from({ length: a }, (e, r) => `<span class="fs${n || r < i ? " on" : ""}" style="--glow:${Ap[t]}">${n || r < i ? Fp(t) : ""}</span>`).join("");
			return `<div class="fs-group${n || i >= a ? " ok" : ""}" data-el="${t}"><div class="fs-row">${o}</div><small>${jp[t]} <b>${n ? a : Math.min(i, a)}/${a}</b></small></div>`;
		}).join(""), c = n ? "FORGED" : "FORGE", l = t.block === "rank" ? `<p class="fg-req">${kp}<span>Requires ${Lp(e.rank)}</span></p>` : "";
		f("info").innerHTML = `<h2 class="fg-name">${Z(e.name)}</h2><p class="fg-subt">${Z(e.subtitle)}</p>
      <div class="fs-slots">${i}</div><p class="fg-says">${Z(e.says)}</p>
      <button type="button" class="fg-btn" data-act="forge" ${t.ok && !a ? "" : "disabled"}><span>${c}</span></button>${l}`;
	}
	function x() {
		let e = Bf(r.relics), t = (t) => {
			let n = e[t];
			return `<div class="fg-slot${n ? " full" : ""}" data-slot="${t}"><small>${Mp[t]}</small><div class="box">${n ? Ip(n.id) : "<em>Empty</em>"}</div></div>`;
		};
		f("sl").innerHTML = Np.map(t).join(""), f("sr").innerHTML = Pp.map(t).join(""), f("count").innerHTML = `RELICS FORGED: <b>${r.relics.length}</b>`;
		let n = r.relics.filter((e) => e.grants.startsWith("aura ")).map((e) => e.grants.split(" ")[1]);
		f("aura").dataset.auras = n.join(" ");
	}
	function S() {
		h(), g(), v(), b(), x();
	}
	S();
	let C = e.querySelector(".fg-grid"), w = (e) => {
		let t = C.getBoundingClientRect(), n = e.getBoundingClientRect();
		return {
			x: n.left - t.left + n.width / 2,
			y: n.top - t.top + n.height / 2,
			w: n.width,
			h: n.height
		};
	}, T = (e) => (f("fx").appendChild(e), u.add(e), e), E = (e) => {
		e.remove(), u.delete(e);
	}, D = (e, t, n) => {
		let r = e.animate(t, {
			fill: "forwards",
			...n
		});
		return l.add(r), r.finished.then(() => {
			l.delete(r);
		}, () => {
			l.delete(r);
		});
	};
	function O(t, n) {
		o = !0, b();
		let r = w(f("stage").querySelector(".fg-anvil")), a = f("relic"), s = [], c = 0;
		for (let n of jf) {
			let i = t.cost[n] ?? 0;
			if (!i) continue;
			let a = e.querySelector(`.fg-tube[data-el="${n}"] .gem`);
			if (!a) continue;
			let o = w(a);
			for (let e = 0; e < Math.min(i, 5); e++, c++) {
				let e = document.createElement("i");
				e.className = "fg-shard", e.style.cssText = `--c:${Ap[n]};left:${o.x}px;top:${o.y}px`, e.innerHTML = Fp(n), T(e);
				let t = r.x - o.x, i = r.y - o.y + 20, a = -120 - Math.random() * 120, l = (Math.random() - .5) * 160;
				s.push(new Promise((e) => d(e, c * 45)).then(() => D(e, [
					{
						transform: "translate(-50%,-50%) scale(1)",
						opacity: 1,
						offset: 0
					},
					{
						transform: `translate(calc(-50% + ${t * .45 + l}px), calc(-50% + ${i * .35 + a}px)) scale(1.15) rotate(120deg)`,
						opacity: 1,
						offset: .5
					},
					{
						transform: `translate(calc(-50% + ${t}px), calc(-50% + ${i}px)) scale(.35) rotate(300deg)`,
						opacity: .2,
						offset: 1
					}
				], {
					duration: 780,
					easing: "cubic-bezier(.45,0,.55,1)"
				})).then(() => E(e)));
			}
		}
		g(), Promise.all(s).then(() => {
			if (i) return;
			let t = f("flare");
			t.classList.remove("go"), t.offsetWidth, t.classList.add("go"), k().classList.add("flaring"), d(() => k().classList.remove("flaring"), 1300), d(() => {
				o = !1, a.classList.remove("hidden"), a.classList.add("appear"), d(() => a.classList.remove("appear"), 900);
			}, 380), d(() => {
				let t = e.querySelector(`.fg-slot[data-slot="${n.slot}"] .box`);
				if (!t) {
					A();
					return;
				}
				let r = w(a.querySelector("img") ?? a), s = w(t), c = document.createElement("i");
				c.className = "fg-ghost", c.style.cssText = `left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px`, c.innerHTML = Ip(n.id), T(c), o = !0, a.classList.add("hidden");
				let l = Math.min(s.w, s.h) / Math.max(r.w, r.h) * .9;
				D(c, [
					{
						transform: "translate(-50%,-50%) scale(1)",
						opacity: 1,
						offset: 0
					},
					{
						transform: `translate(calc(-50% + ${(s.x - r.x) * .5}px), calc(-50% + ${(s.y - r.y) * .5 - 90}px)) scale(${(1 + l) / 2.4})`,
						opacity: 1,
						offset: .5
					},
					{
						transform: `translate(calc(-50% + ${s.x - r.x}px), calc(-50% + ${s.y - r.y}px)) scale(${l})`,
						opacity: 1,
						offset: 1
					}
				], {
					duration: 800,
					easing: "cubic-bezier(.5,0,.4,1)"
				}).then(() => {
					if (E(c), i) return;
					A();
					let t = e.querySelector(`.fg-slot[data-slot="${n.slot}"]`);
					t?.classList.add("land"), d(() => t?.classList.remove("land"), 1500);
				});
			}, 1250);
		});
	}
	let k = () => f("stage");
	function A() {
		a = !1, o = !1, S();
	}
	let j = (e) => {
		let t = e.target, i = t.closest("[data-recipe]");
		if (i && !a) {
			s = i.dataset.recipe, g(), v(), b();
			return;
		}
		if (t.closest("[data-act=forge]") && !a) {
			let e = Ff(s);
			if (!e || !Rf(s, r.vault, r.relics, r.rank.index).ok) return;
			a = !0;
			let t = n.forge(s);
			t ? O(e, t) : a = !1;
		}
	};
	return e.addEventListener("click", j), {
		update(e) {
			if (!i) {
				if (r = e, a) {
					g();
					return;
				}
				S();
			}
		},
		destroy() {
			i = !0, c.forEach((e) => clearTimeout(e)), c.clear(), l.forEach((e) => {
				try {
					e.cancel();
				} catch {}
			}), l.clear(), u.forEach((e) => e.remove()), u.clear(), p(), e.removeEventListener("click", j), ju(e, "room-forge");
		}
	};
}
//#endregion
//#region src/house/rooms/codex.ts
var zp = (e) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${e}</svg>`, Bp = {
	stop: zp("<path d=\"M4 5.5C7 4 9.5 4.4 12 6c2.5-1.6 5-2 8-.5V18c-3-1.5-5.5-1.1-8 .5-2.5-1.6-5-2-8-.5Z\"/><path d=\"M12 6v12.5\"/>"),
	size: zp("<circle cx=\"12\" cy=\"6.5\" r=\"2.6\"/><path d=\"M7.5 20c0-4.4 2-7.2 4.5-7.2s4.5 2.8 4.5 7.2Z\"/><path d=\"M5 20h14\"/>"),
	target: zp("<circle cx=\"12\" cy=\"12\" r=\"8\"/><circle cx=\"12\" cy=\"12\" r=\"4.4\"/><circle cx=\"12\" cy=\"12\" r=\"1.2\"/><path d=\"M12 2v3M12 19v3M2 12h3M19 12h3\"/>"),
	leverage: zp("<path d=\"M5 19l8-8M13 11l1.6-5.6 4 4Z\"/><path d=\"M4 20.5h16\" opacity=\".6\"/>"),
	funding: zp("<ellipse cx=\"12\" cy=\"7\" rx=\"6.5\" ry=\"2.4\"/><path d=\"M5.5 7v4c0 1.3 2.9 2.4 6.5 2.4s6.5-1.1 6.5-2.4V7M5.5 11v4c0 1.3 2.9 2.4 6.5 2.4s6.5-1.1 6.5-2.4v-4\"/>"),
	patience: zp("<path d=\"M7 3.5h10M7 20.5h10M8 3.5c0 4 4 4.6 4 8.5s-4 4.5-4 8.5M16 3.5c0 4-4 4.6-4 8.5s4 4.5 4 8.5\"/>"),
	mirror: zp("<circle cx=\"12\" cy=\"10\" r=\"6.2\"/><path d=\"M9 7.5a4 4 0 0 1 3-1.6M12 16.2V21M8.5 21h7\"/>")
}, Vp = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M5.5 12.5l4.2 4.2L18.5 7.5\"/></svg>", Hp = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5\" y=\"10.5\" width=\"14\" height=\"10\" rx=\"2\"/><path d=\"M8 10.5V8a4 4 0 0 1 8 0v2.5\"/></svg>", Up = {
	riskPct: "<svg viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden=\"true\"><rect x=\"4\" y=\"13\" width=\"4\" height=\"7\" rx=\".6\"/><rect x=\"10\" y=\"8.5\" width=\"4\" height=\"11.5\" rx=\".6\"/><rect x=\"16\" y=\"4\" width=\"4\" height=\"16\" rx=\".6\"/></svg>",
	maxLeverage: "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 3.5l8.5 4.3L12 12 3.5 7.8Z\"/><path d=\"M3.5 12.2L12 16.5l8.5-4.3M3.5 16.4L12 20.7l8.5-4.3\"/></svg>",
	tradesPerDay: "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M12 7v5.5l3.5 2\"/></svg>"
}, Wp = {
	riskPct: "Risk per trade",
	maxLeverage: "Leverage",
	tradesPerDay: "Trades per day"
}, Gp = (e, t) => e === "riskPct" ? `${t}%` : e === "maxLeverage" ? `${t}x` : String(t), Kp = (e) => new Date(e).toLocaleDateString("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric"
});
function qp(e, t) {
	let n = Math.max(6e4, t - e) * 2.6 / 48;
	return [
		["1m", 6e4],
		["5m", 3e5],
		["15m", 9e5],
		["1h", 36e5],
		["4h", 144e5]
	].reduce((e, t) => Math.abs(Math.log(t[1] / n)) < Math.abs(Math.log(e[1] / n)) ? t : e)[0];
}
var Jp = (e) => {
	let t = Math.abs(e);
	return e.toLocaleString("en-US", { maximumFractionDigits: t >= 1e3 ? 0 : t >= 100 ? 1 : t >= 1 ? 2 : 4 });
}, Yp = (e) => {
	let t = new Date(e);
	return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
};
function Xp(e, t) {
	if (e.entry == null || e.openedAt == null || e.closedAt == null) return "";
	let n = t ? {
		"1m": 6e4,
		"5m": 3e5,
		"15m": 9e5,
		"1h": 36e5,
		"4h": 144e5
	}[t.interval] ?? 9e5 : 0, r = t?.bars ?? [], i = [
		e.entry,
		e.stop,
		e.target,
		e.exit
	].filter((e) => e != null && Number.isFinite(e)), a = Math.min(...i, ...r.map((e) => e.low)), o = Math.max(...i, ...r.map((e) => e.high)), s = (o - a || o * .01) * .1;
	a -= s, o += s;
	let c = (e) => 14 + (1 - (e - a) / (o - a)) * 270, l = r.length ? r[0].time * 1e3 : e.openedAt - (e.closedAt - e.openedAt) * .6 - 6e4, u = r.length ? r[r.length - 1].time * 1e3 + n : e.closedAt + (e.closedAt - e.openedAt) * .6 + 6e4, d = (e) => 10 + (Math.min(u, Math.max(l, e)) - l) / (u - l) * 334, f = Array.from({ length: 5 }, (e, t) => {
		let n = a + (o - a) * (t + .5) / 5;
		return `<path d="M10 ${c(n).toFixed(1)}H344" class="g"/><text x="350" y="${(c(n) + 4).toFixed(1)}" class="ax">${Jp(n)}</text>`;
	}).join(""), p = r.length ? Math.max(1.6, 334 / r.length * .62) : 0, m = r.map((e) => {
		let t = d(e.time * 1e3 + n / 2), r = e.close >= e.open, i = c(Math.max(e.open, e.close)), a = c(Math.min(e.open, e.close));
		return `<path d="M${t.toFixed(1)} ${c(e.high).toFixed(1)}V${c(e.low).toFixed(1)}" class="${r ? "u" : "d"}"/><rect x="${(t - p / 2).toFixed(1)}" y="${i.toFixed(1)}" width="${p.toFixed(1)}" height="${Math.max(1.2, a - i).toFixed(1)}" class="${r ? "u" : "d"}"/>`;
	}).join(""), h = d(e.openedAt), g = d(e.closedAt), _ = [
		e.target,
		e.stop,
		e.entry
	].filter((e) => e != null).sort((e, t) => t - e), v = (e) => {
		let t = _.indexOf(e);
		return _.length < 2 || t === 0 || t !== _.length - 1 && Math.abs(c(_[t - 1]) - c(e)) > Math.abs(c(_[t + 1]) - c(e));
	}, y = (e, t, n) => e == null ? "" : `<path d="M10 ${c(e).toFixed(1)}H344" class="ln ${t}"/><text x="15" y="${(c(e) + (v(e) ? -6 : 15)).toFixed(1)}" class="lb ${t}">${n} ${Jp(e)}</text>`, b = Array.from({ length: 4 }, (e, t) => {
		let n = l + (u - l) * (t + .5) / 4;
		return `<text x="${d(n).toFixed(1)}" y="308" text-anchor="middle" class="ax">${Yp(n)}</text>`;
	}).join(""), x = c(e.entry);
	return `<svg class="cx-chart" viewBox="0 0 400 318" role="img" aria-label="Your trade">${f}${m}
    ${y(e.target, "tg", "Target")}${y(e.stop, "st", "Stop")}${y(e.entry, "en", "Entry")}
    <circle cx="${h.toFixed(1)}" cy="${x.toFixed(1)}" r="4.2" class="mk en"/>
    ${e.exit == null ? "" : `<circle cx="${g.toFixed(1)}" cy="${c(e.exit).toFixed(1)}" r="4.6" class="mk ex"/><circle cx="${g.toFixed(1)}" cy="${c(e.exit).toFixed(1)}" r="1.6" class="mk exd"/>`}
    ${b}</svg>`;
}
var Zp = "<i class=\"cx-co a\"></i><i class=\"cx-co b\"></i><i class=\"cx-co c\"></i><i class=\"cx-co d\"></i>", Qp = (e) => [e.charAt(0).toUpperCase(), e.slice(1)];
function $p(e, t, n) {
	Au(e, "room-codex");
	let r = t, i = !1, a = f(), o = new Set(ml.filter((e) => cl(r.store, e.id)).map((e) => e.id)), s = /* @__PURE__ */ new Map(), c = "", l = "";
	e.innerHTML = `
    <div class="cx-grid">
      ${Q("lite cx-char", "<div data-s=\"char\"></div>")}
      ${Q("cx-shelves", `<h3 class="rp-title">${Mu}<span>THE SHELVES</span></h3><div class="cx-list" data-s="list"></div>`)}
      <div class="cx-book" data-s="book" aria-live="polite"></div>
      ${Q("cx-oath", `<h3 class="rp-title">${Mu}<span>THE OATH</span></h3><div class="cx-rules" data-s="rules"></div><h4 class="cx-sub">History of changes</h4><ul class="cx-hist" data-s="hist"></ul>`)}
      ${Q("cx-terms", `<h3 class="rp-title">${Mu}<span>TERMS</span></h3><ul class="cx-termlist" data-s="terms"></ul>`)}
      ${Q("lite cx-ora", `<div class="ora-orb" data-s="orb"></div><div class="ora-say"><small>ORA &middot; COMPANION OF LIGHT</small><q>${Z(fl)}</q></div>`)}
    </div>`;
	let u = (t) => e.querySelector(`[data-s="${t}"]`), d = mc(u("orb"));
	function f() {
		return (ml.filter((e) => cl(r.store, e.id)).sort((e, t) => r.store.unlocked[t.id].at - r.store.unlocked[e.id].at)[0] ?? ml[0]).id;
	}
	function p() {
		let e = r.character, t = e.nextXp - e.floorXp, n = t > 0 ? Math.min(100, Math.max(0, (e.totalXp - e.floorXp) / t * 100)) : 0;
		u("char").innerHTML = `<div class="cc-portrait"><img src="${Gs("atlas.webp")}" alt="" draggable="false" /></div>
      <div class="cc-body"><h2>${Z(e.name)}</h2>
        <div class="cc-lv"><span>LEVEL <b>${e.level}</b></span><em>${Math.round(e.totalXp).toLocaleString("en-US")} / ${Math.round(e.nextXp).toLocaleString("en-US")} Light</em></div>
        <div class="cc-bar"><i style="width:${n.toFixed(1)}%"></i></div>
        <div class="cc-rank"><span>RANK</span><b>${Z(e.rank)}</b></div></div>`;
	}
	function m() {
		u("list").innerHTML = ml.map((e) => {
			let t = !!r.store.unlocked[e.id];
			return `<button type="button" class="cx-row${t ? " open" : " shut"}${e.id === a ? " on" : ""}${o.has(e.id) ? " new" : ""}" data-ch="${e.id}" aria-current="${e.id === a}">
        <span class="cx-medal">${Bp[e.id]}</span>
        <span class="cx-rt"><b><i>${e.numeral}</i>${Z(e.title)}</b><em>${Z(e.tagline)}</em>${t ? "" : `<small>${ul}</small>`}</span>
        <span class="cx-st">${t ? Vp : Hp}</span></button>`;
		}).join("");
	}
	function h() {
		let e = r.oath;
		u("rules").innerHTML = [
			"riskPct",
			"maxLeverage",
			"tradesPerDay"
		].map((t) => `<div class="cx-rule"><span class="ri">${Up[t]}</span><span class="rn">${t === "riskPct" ? "Risk per trade" : t === "maxLeverage" ? "Most leverage" : "Trades per day"}</span><b>${Gp(t, e[t])}</b></div>`).join("");
		let t = [...r.oathHistory].reverse().slice(0, 4);
		u("hist").innerHTML = t.length ? t.map((e) => `<li><time>${Z(Kp(e.date))}</time><span>${Wp[e.field]}</span><b>${Gp(e.field, e.from)} &rarr; ${Gp(e.field, e.to)}</b></li>`).join("") : "<li class=\"none\">No changes yet. The Oath is as first sworn.</li>", u("terms").innerHTML = hl.map((e) => `<li><i class="tb">${Z(e.short)}</i><span><b>${Z(e.term)}</b><em>${Z(e.meaning)}</em></span></li>`).join("");
	}
	function g(e) {
		let t = e.paragraphs.map((e) => {
			let [t, n] = Qp(e);
			return `<div class="cx-para"><i class="cx-cap"><b>${Z(t)}</b></i><p>${Z(n)}</p></div>`;
		}).join("");
		return `<div class="cx-page cx-left">${Zp}<i class="cx-star" aria-hidden="true"></i><div class="cx-num">${e.numeral}</div><h2 class="cx-h">${Z(e.heading)}</h2><div class="cx-paras">${t}</div><i class="cx-flo" aria-hidden="true"></i></div>`;
	}
	function _(e) {
		let t = r.journeys[e.id];
		if (!t) return `<div class="cx-page cx-right">${Zp}<div class="cx-empty"><i class="cx-seal">${Hp}</i><p>${Z(dl)}</p></div></div>`;
		let n = "";
		if (t.coin && t.entry != null && t.openedAt != null && t.closedAt != null) {
			let e = s.get(t.tradeId ?? ""), r = e && e !== "wait" && e !== "none" ? e.interval : qp(t.openedAt, t.closedAt);
			n = `<div class="cx-frame"><div class="cx-cap2">${Z(t.ticker ?? "")}-PERP <span>&middot;</span> ${r} <span>&middot;</span> ${Z(Kp(t.closedAt))}</div>
        <div class="cx-plot" data-s="plot">${Xp(t, e && e !== "wait" && e !== "none" ? e : null)}</div></div>`;
		} else n = `<div class="cx-frame cx-day"><i class="cx-seal">${Vp}</i><span>${Z(t.dateLabel)}</span></div>`;
		return `<div class="cx-page cx-right">${Zp}<div class="cx-lesson">A LESSON FROM YOUR JOURNEY</div>${n}<p class="cx-note">${Z(t.note)}</p></div>`;
	}
	function v() {
		let e = ml.find((e) => e.id === a), t = r.journeys[a], o = t?.tradeId ? s.get(t.tradeId) : void 0, l = `${a}|${JSON.stringify(t ?? null)}|${o && o !== "wait" && o !== "none" ? o.bars.length : String(o)}`;
		if (l !== c && (c = l, u("book").innerHTML = `<i class="cx-halo"></i><div class="cx-cover"></div><div class="cx-leaves">${g(e)}${_(e)}</div><i class="cx-spine"></i><i class="cx-ribbon"></i>
      <div class="cx-lectern" aria-hidden="true"><i class="cx-brass"></i><i class="cx-stand"></i><i class="cx-medal2"></i></div>`, t?.tradeId && t.coin && t.openedAt != null && !s.has(t.tradeId))) {
			let e = t.tradeId;
			s.set(e, "wait"), n.loadCandles(t).then((t) => {
				i || (s.set(e, t.bars.length ? t : "none"), v());
			}, () => {
				i || (s.set(e, "none"), v());
			});
		}
	}
	function y() {
		p(), m(), h(), v();
	}
	y(), l = b();
	function b() {
		return JSON.stringify([
			r.store.unlocked,
			r.oath,
			r.oathHistory,
			r.character,
			Object.keys(r.journeys)
		]);
	}
	let x = (e) => {
		let t = e.target.closest("[data-ch]");
		t && (a = t.dataset.ch, m(), v());
	};
	return e.addEventListener("click", x), {
		update(e) {
			if (i) return;
			r = e;
			let t = b();
			t !== l && (l = t, y());
		},
		destroy() {
			i = !0, d(), e.removeEventListener("click", x), ju(e, "room-codex");
		}
	};
}
//#endregion
//#region src/house/lore.ts
var em = {
	BTC: "The first stone. Every other lot was built on it.",
	ETH: "The air the contracts breathe.",
	SOL: "Light caught in glass, and fast.",
	HYPE: "It spreads where the wind is.",
	"xyz:GOLD": "The oldest light. It outlived every empire that minted it.",
	"xyz:SILVER": "Gold’s quiet twin. It moves by night."
}, tm = {
	coins: "From the Hall of Coins.",
	foundry: "Forged in the Foundry.",
	indices: "A whole market, weighed as one.",
	metals: "From the vaults of Old Metals.",
	tide: "It rises and falls with the Tide.",
	money: "Weighed by the Moneychangers."
}, nm = (e, t) => em[e] ?? tm[t] ?? "", rm = {
	welcome: "The House is open. Write your plan before you trade.",
	oathSworn: "The Oath is rewritten. I will hold you to it.",
	welcomeBack: "Welcome back. The board kept moving while you were away.",
	noStop: "No stop. The House can’t weigh a trade with no line in it.",
	placed: "Your plan is written. Now let it work.",
	widened: "You moved the line away. I saw it.",
	tightened: "Tighter. Good.",
	flawless: "Everything as written. +{x} Light.",
	solid: "A clean plan, kept. +{x} Light.",
	disciplined: "Your stop held. +{x} Light.",
	loose: "It ended off the plan. +{x} Light.",
	unstructured: "There was no plan to keep. +{x} Light.",
	liquidated: "The margin is gone. The House keeps no grudge. Begin again.",
	tilt: "So soon after a loss. Breathe first.",
	levelUp: "You’ve grown. Level {x}."
}, im = (e, t) => e.replace("{x}", String(t ?? ""));
//#endregion
//#region src/house/dust.ts
function am(e, t) {
	if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
	let n = e.getContext("2d");
	if (!n) return () => {};
	let r = 0, i = 0, a = 1, o = [], s = (e) => ({
		x: Math.random() * r,
		y: e ? Math.random() * i : i + 10,
		r: .6 + Math.random() * 1.8,
		vy: -(4 + Math.random() * 12),
		vx: (Math.random() - .5) * 4,
		a: .15 + Math.random() * .55,
		tw: Math.random() * Math.PI * 2,
		ora: Math.random() < .12
	}), c = () => {
		a = Math.min(devicePixelRatio || 1, 1.5), r = innerWidth, i = innerHeight, e.width = r * a, e.height = i * a, e.style.width = `${r}px`, e.style.height = `${i}px`, n.setTransform(a, 0, 0, a, 0, 0);
	};
	c(), addEventListener("resize", c);
	let l = Math.round(Math.min(90, r * i / 22e3));
	for (let e = 0; e < l; e++) o.push(s(!0));
	let u = performance.now(), d = 0, f = !1, p = (e) => {
		if (f) return;
		if (d = requestAnimationFrame(p), document.hidden || !t()) {
			u = e, n.clearRect(0, 0, r, i);
			return;
		}
		let a = e - u;
		if (a < 33) return;
		u = e;
		let c = Math.min(a, 100) / 1e3;
		n.clearRect(0, 0, r, i), n.globalCompositeOperation = "lighter";
		for (let t = 0; t < o.length; t++) {
			let r = o[t];
			r.y += r.vy * c, r.x += r.vx * c + Math.sin(r.tw + e / 2400) * .15, r.tw += c, r.y < -10 && (o[t] = s(!1));
			let i = r.a * (.6 + .4 * Math.sin(r.tw * 1.3)), a = n.createRadialGradient(r.x, r.y, 0, r.x, r.y, r.r * 5), l = r.ora ? "200,235,255" : "255,214,140";
			a.addColorStop(0, `rgba(${l},${i})`), a.addColorStop(1, `rgba(${l},0)`), n.fillStyle = a, n.beginPath(), n.arc(r.x, r.y, r.r * 5, 0, Math.PI * 2), n.fill();
		}
		n.globalCompositeOperation = "source-over";
	};
	return d = requestAnimationFrame(p), () => {
		f = !0, cancelAnimationFrame(d), removeEventListener("resize", c);
	};
}
//#endregion
//#region src/pulse.ts
var om = "https://pulse.bigpicsolutions.com", sm = "paper-arena", cm = (e, t) => {
	try {
		let n = t.getItem(e);
		return n || (n = crypto.randomUUID(), t.setItem(e, n)), n;
	} catch {
		return crypto.randomUUID();
	}
}, lm = () => navigator.doNotTrack === "1" || navigator.globalPrivacyControl === !0, um = /^(localhost|127\.|192\.168\.)/.test(location.hostname), dm = "", fm = "";
function pm(e, t) {
	lm() || um || (dm || (dm = cm("bp_vid", localStorage), fm = cm("bp_sid", sessionStorage)), fetch(`${om}/v1/event`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		keepalive: !0,
		body: JSON.stringify({
			site: sm,
			event: e,
			target: t ?? null,
			visitor: dm,
			session: fm,
			path: location.pathname,
			w: innerWidth
		})
	}).catch(() => {}));
}
//#endregion
//#region src/house/mount.ts
var mm = [
	[
		"BTC",
		40,
		"Keystone"
	],
	[
		"ETH",
		25,
		"Aether"
	],
	[
		"SOL",
		20,
		"Sunglass"
	],
	[
		"HYPE",
		10,
		"Wildfire"
	]
].map(([e, t, n]) => ({
	key: e,
	ticker: e,
	dex: "",
	hall: "coins",
	name: n,
	maxLeverage: t,
	szDecimals: 2,
	markPx: 0,
	prevDayPx: 0,
	dayNtlVlm: 0,
	isDelisted: !1
})), hm = aa, gm = "paper-arena:v0", _m = "paper-arena:v0:vault", vm = [
	{
		key: "keystone",
		name: "KEYSTONE",
		glow: "#f6c66a"
	},
	{
		key: "aether",
		name: "AETHER",
		glow: "#6aa8ff"
	},
	{
		key: "sunglass",
		name: "SUNGLASS",
		glow: "#5fe3e6"
	},
	{
		key: "oldsun",
		name: "OLD SUN",
		glow: "#f4a93c"
	},
	{
		key: "moonmetal",
		name: "MOONMETAL",
		glow: "#c8d2ff"
	}
], ym = () => ({
	keystone: 0,
	aether: 0,
	sunglass: 0,
	oldsun: 0,
	moonmetal: 0
}), bm = [
	{
		id: "stops",
		title: "Honor three stops",
		of: As.stops,
		icon: "<path d=\"M12 3l7 3v5.5c0 4.3-3 7.7-7 9.5-4-1.8-7-5.2-7-9.5V6z\"/><path d=\"M8.5 12l2.5 2.5 4.5-5\"/>"
	},
	{
		id: "profit",
		title: "Take profit at plan",
		of: As.profit,
		icon: "<path d=\"M12 3.5v17M7.5 20.5h9M5 8l7-3 7 3\"/><path d=\"M5 8l-2.5 6a2.6 2.6 0 0 0 5 0zM19 8l-2.5 6a2.6 2.6 0 0 0 5 0z\"/>"
	},
	{
		id: "oath",
		title: "Size inside your Oath",
		of: As.oath,
		icon: "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><circle cx=\"12\" cy=\"12\" r=\"4.5\"/><circle cx=\"12\" cy=\"12\" r=\"1\" fill=\"currentColor\"/>"
	}
], xm = {
	coins: "Hall of Coins",
	foundry: "The Foundry",
	indices: "Indices",
	metals: "Old Metals",
	tide: "The Tide",
	money: "Money-changers"
}, Sm = [
	{
		k: "stop",
		label: "Stop<br>Defined",
		glyph: "<path d=\"M3 11h18\"/><path d=\"M12 11v8M8.5 15.5 12 19l3.5-3.5\"/>"
	},
	{
		k: "size",
		label: "Size Within<br>Rule",
		glyph: "<path d=\"M12 4v15M7.5 19.5h9M4 7.5h16\"/><path d=\"M4 7.5 1.8 13.5a2.4 2.4 0 0 0 4.4 0zM20 7.5l-2.2 6a2.4 2.4 0 0 0 4.4 0z\"/>"
	},
	{
		k: "target",
		label: "Target<br>Defined",
		glyph: "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><circle cx=\"12\" cy=\"12\" r=\"4.5\"/><circle cx=\"12\" cy=\"12\" r=\"1\" fill=\"currentColor\"/>"
	}
], Cm = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=Barlow:wght@400;500;600&family=Cinzel:wght@500;600;700&family=Marcellus&family=Cormorant+Garamond:ital,wght@1,400;1,500&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap", wm = {
	async get(e) {
		try {
			let t = localStorage.getItem(e);
			return t ? JSON.parse(t) : null;
		} catch {
			return null;
		}
	},
	async set(e, t) {
		try {
			localStorage.setItem(e, JSON.stringify(t));
		} catch {}
	}
};
function Tm() {
	if (!document.head.querySelector("style[data-house]")) {
		let e = document.createElement("style");
		e.dataset.house = "", e.textContent = ".house-root{--void:#06070b;--night:#0b1220;--ink:#efe6d2;--ink-2:#b9ae97;--ink-3:#7d7563;--gold:#d4b06a;--gold-hi:#f1dcaa;--gold-lo:#9c7a3e;--teal:#3fd3c8;--ora:#9fdcff;--ora-hi:#eaf7ff;--up:#57d6a3;--dn:#e2875a;--liq:#e0b25a;--panel:#08080ca8;--panel-2:#0e0d1280;--line:#d4b06a6b;--line-soft:#d4b06a29;--f-title:\"Cinzel\", \"Trajan Pro\", Georgia, serif;--f-num:\"Barlow Condensed\", \"JetBrains Mono\", sans-serif;--f-voice:\"Cormorant Garamond\", Georgia, serif;--f-ui:\"Barlow\", \"Inter\", system-ui, sans-serif;--radius:6px;--gap:10px}.house-root[data-mode=advanced]{--ink:#e8e8ec;--ink-2:#a2a3ad;--ink-3:#6b6c76;--gold:#c9a560;--panel:#0f1014;--panel-2:#14151a;--line:#23252d;--line-soft:#1b1d23;--up:#4fd1a1;--dn:#ef8a62;--f-title:\"Inter\", system-ui, sans-serif;--f-num:\"JetBrains Mono\", ui-monospace, monospace;--f-ui:\"Inter\", system-ui, sans-serif;--radius:8px;--gap:8px}:where(.house-root),:where(.house-root) *{box-sizing:border-box}.house-root{background:var(--void);color:var(--ink);font:14px/1.4 var(--f-ui);-webkit-font-smoothing:antialiased;overflow-x:clip}.house-root[data-mode=advanced]{background:#08090c}:where(.house-root) button{font:inherit;color:inherit;cursor:pointer}:where(.house-root) input,:where(.house-root) select{font:inherit;color:inherit}:where(.house-root) a{color:var(--gold)}.house-root .up{color:var(--up)}.house-root .dn{color:var(--dn)}.house-root .liq{color:var(--liq)}.house-root{isolation:isolate;min-height:100%;position:relative}.house-root[data-embedded]{height:100%;overflow:hidden auto}.house-root .plate{z-index:-2;background:#06070b 50% 38%/cover no-repeat;transition:opacity .6s;position:fixed;inset:0}.house-root .plate:after{content:\"\";background:radial-gradient(70% 60% at 50% 48%,#06070b59,#06070b0d 70%,#06070b73),linear-gradient(#06070b8c,#06070b00 18% 70%,#06070bbf);position:absolute;inset:0}.house-root #dust{z-index:-1;pointer-events:none;position:fixed;inset:0}.house-root[data-mode=advanced] .plate,.house-root[data-mode=advanced] #dust{opacity:0;pointer-events:none}.house-root .topbar{border-bottom:1px solid var(--line);background:linear-gradient(#06070beb,#06070bb3);align-items:center;gap:18px;height:58px;padding:0 18px;display:flex;position:relative}.house-root .topbar:after{content:\"\";background:linear-gradient(90deg, transparent, var(--gold-hi), transparent);opacity:.55;height:1px;position:absolute;bottom:-1px;left:10%;right:10%}.house-root[data-mode=advanced] .topbar{border-color:var(--line);background:#0b0c10}.house-root[data-mode=advanced] .topbar:after{display:none}.house-root .brand{white-space:nowrap;align-items:center;gap:10px;display:flex}.house-root .brand svg{width:22px;height:22px;color:var(--gold);filter:drop-shadow(0 0 6px #f1dcaa80)}.house-root .brand b{font:600 15px/1 var(--f-title);letter-spacing:.22em;color:var(--gold-hi)}.house-root .brand small{font:500 10px/1.2 var(--f-ui);letter-spacing:.28em;color:var(--ink-3);margin-top:3px;display:block}.house-root[data-mode=advanced] .brand b{letter-spacing:.02em;color:var(--ink);font-weight:600}.house-root[data-mode=advanced] .brand svg{filter:none}.house-root .gamenav{gap:2px;display:flex}.house-root .gamenav button{font:600 11px/1 var(--f-title);letter-spacing:.2em;color:var(--ink-3);background:0 0;border:0;border-bottom:1px solid #0000;padding:8px 12px}.house-root .gamenav button.on{color:var(--gold-hi);border-color:var(--gold)}.house-root .gamenav button{position:relative}.house-root .gamenav button.on{border-color:var(--teal);box-shadow:0 1px 0 var(--teal)}.house-root .gamenav button.dot:after{content:\"\";pointer-events:none;background:radial-gradient(circle at 40% 35%,#fff3c9,#d4b06a 70%);border-radius:50%;width:7px;height:7px;position:absolute;top:3px;right:3px;box-shadow:0 0 7px #f1dcaae6}.house-root .gamenav button:disabled{opacity:.38;cursor:default}.house-root[data-oathup] .gamenav{pointer-events:none;opacity:.35}.house-root[data-mode=advanced] .gamenav button{font:600 12px/1 var(--f-ui);letter-spacing:.06em;text-transform:none}.house-root[data-mode=advanced] .gamenav button.on{color:var(--ink)}.house-root .roomhost{z-index:30;overscroll-behavior:contain;background:#06070b 50% 38%/cover no-repeat;position:fixed;bottom:0;left:0;right:0;overflow:hidden}.house-root .roomhost[hidden]{display:none}.house-root .roomhost .roomstage{position:absolute;inset:0}.house-root .modes{border:1px solid var(--line);background:#06070bb3;border-radius:999px;gap:3px;margin:0 auto;padding:3px;display:flex}.house-root .modes button{font:600 11px/1 var(--f-title);letter-spacing:.24em;color:var(--ink-3);background:0 0;border:0;border-radius:999px;padding:7px 18px}.house-root .modes button.on{color:#1a1408;background:linear-gradient(180deg, var(--gold-hi), var(--gold) 60%, var(--gold-lo));box-shadow:0 0 18px #d4b06a59,inset 0 1px #ffffff80}.house-root[data-mode=advanced] .modes{background:#101116}.house-root[data-mode=advanced] .modes button{letter-spacing:.08em;font-family:var(--f-ui)}.house-root[data-mode=advanced] .modes button.on{color:#0b0c10;box-shadow:none;background:#e8e8ec}.house-root #player{font:500 12px/1 var(--f-num);align-items:center;gap:10px;display:flex}.house-root #player .lvl{font:600 11px/1 var(--f-title);letter-spacing:.18em;color:var(--ink-2)}.house-root #player .lvl b{font:600 18px/1 var(--f-num);color:var(--gold-hi);margin-left:4px}.house-root #player .xpbar{border:1px solid var(--line);background:#0006;border-radius:99px;width:150px;height:8px;position:relative;overflow:hidden}.house-root #player .xpbar div{background:linear-gradient(90deg, var(--gold-lo), var(--gold-hi));height:100%;box-shadow:0 0 10px var(--gold)}.house-root #player .xpbar span{display:none}.house-root #player .xptext{color:var(--ink-3);font-size:12px}.house-root #player .rank{font:600 10px/1 var(--f-title);letter-spacing:.2em;color:var(--ink-2);border:1px solid var(--line);border-radius:3px;padding:5px 7px}.house-root .hdr-actions{gap:6px;display:flex}.house-root .ghost{border:1px solid var(--line);border-radius:var(--radius);color:var(--ink-2);background:0 0;padding:6px 10px}.house-root .ghost:hover{border-color:var(--gold);color:var(--ink)}.house-root .leave{place-items:center;padding:6px 9px;display:grid}.house-root .leave svg{fill:none;stroke:currentColor;stroke-width:1.3px;stroke-linecap:round;stroke-linejoin:round;width:18px;height:18px}.house-root .leave:hover{color:var(--gold-hi)}.house-root .ghost.small{padding:4px 8px;font-size:11px}.house-root .floor{gap:var(--gap);padding:var(--gap) 14px;height:calc((var(--vh,1vh) * 100) - 58px - 30px);grid-template:\"lots market book ticket\"minmax(0,1fr)\"lots desk desk signal\"236px/344px minmax(0,1fr) 236px 316px;min-height:760px;display:grid}.house-root .lots{grid-area:lots}.house-root .market{grid-area:market}.house-root .book{grid-area:book}.house-root .ticket{grid-area:ticket}.house-root .desk{grid-area:desk}.house-root .signal{grid-area:signal}.house-root .panel{background:linear-gradient(180deg, var(--panel-2), var(--panel));border:1px solid var(--line);border-radius:var(--radius);-webkit-backdrop-filter:blur(3px)saturate(1.15);backdrop-filter:blur(3px)saturate(1.15);flex-direction:column;min-width:0;min-height:0;padding:12px 14px;display:flex;position:relative;box-shadow:0 0 0 1px #0009,0 18px 40px #00000073,inset 0 1px #f1dcaa14,inset 0 0 30px #d4b06a0d}.house-root[data-mode=game] .panel:before{content:\"\";border:1px solid var(--line-soft);pointer-events:none;border-radius:3px;position:absolute;inset:4px}.house-root[data-mode=game] .panel:after{content:\"\";pointer-events:none;z-index:1;border:44px solid #0000;border-image:var(--frame) 118 / 44px stretch;filter:drop-shadow(0 2px 6px #0009);position:absolute;inset:-12px}.house-root[data-mode=advanced] .panel{-webkit-backdrop-filter:none;backdrop-filter:none;box-shadow:none;background:var(--panel)}.house-root .ptitle{font:600 12px/1 var(--f-title);letter-spacing:.22em;color:var(--gold-hi);text-transform:uppercase;align-items:center;gap:8px;margin:0 0 10px;display:flex}.house-root .ptitle svg{width:12px;height:12px;color:var(--gold)}.house-root .ptitle .spacer{flex:1}.house-root[data-mode=advanced] .ptitle{letter-spacing:.06em;color:var(--ink-2);font-size:11px}.house-root[data-mode=advanced] .ptitle svg{display:none}.house-root .lots{padding:0;overflow:hidden}.house-root .lots-head{text-align:center;border-bottom:1px solid var(--line-soft);padding:16px 16px 10px}.house-root .lots-head h2{font:600 17px/1.1 var(--f-title);letter-spacing:.2em;color:var(--gold-hi);text-shadow:0 0 18px #d4b06a66;margin:0}.house-root .lots-head p{font:italic 400 14px/1.2 var(--f-voice);color:var(--ink-2);margin:5px 0 0}.house-root[data-mode=advanced] .lots-head{text-align:left;padding:12px 12px 8px}.house-root[data-mode=advanced] .lots-head h2{font:600 13px/1 var(--f-ui);letter-spacing:.02em;color:var(--ink);text-shadow:none}.house-root[data-mode=advanced] .lots-head p{display:none}.house-root .lot-search input{border:1px solid var(--line-soft);background:#00000059;border-radius:4px;outline:none;width:100%;padding:7px 10px;font-size:12px}.house-root .lot-search input:focus{border-color:var(--gold)}.house-root #lotList{scrollbar-width:thin;scrollbar-color:var(--gold-lo) transparent;flex:1;padding:0 6px 10px;overflow-y:auto}.house-root .hall-h{font:600 10.5px/1 var(--f-title);letter-spacing:.24em;color:var(--gold);align-items:center;gap:8px;margin:12px 8px 4px;display:flex}.house-root .hall-h:after{content:\"\";background:linear-gradient(90deg, var(--line), transparent);flex:1;height:1px}.house-root .hall-h svg{width:13px;height:13px}.house-root .hall-h small{font:500 10px var(--f-num);color:var(--ink-3);letter-spacing:0}.house-root[data-mode=advanced] .hall-h{font:600 10px/1 var(--f-ui);letter-spacing:.08em;color:var(--ink-3)}.house-root[data-mode=advanced] .hall-h svg{display:none}.house-root .lot{text-align:left;background:0 0;border:1px solid #0000;border-radius:4px;grid-template-columns:26px minmax(0,1fr) 48px 54px 46px;align-items:center;gap:5px;width:100%;padding:6px 8px;display:grid}.house-root .lot:hover{background:#d4b06a0f}.house-root .lot.on{border-color:var(--gold);background:linear-gradient(90deg,#3fd3c829,#d4b06a1c 55%,#d4b06a08);box-shadow:inset 0 0 0 1px #3fd3c88c,inset 0 0 20px #3fd3c821,0 0 0 1px #f1dcaa40,0 0 16px #d4b06a61,0 0 30px #3fd3c81f}.house-root .lot .spk{height:18px;display:block}.house-root .lot .spk svg{width:48px;height:16px;display:block;overflow:visible}.house-root .lot .spk .ln{fill:none;stroke:var(--gold-hi);stroke-width:1.2px;stroke-linecap:round;stroke-linejoin:round;opacity:.85;filter:drop-shadow(0 0 2px #d4b06a80)}.house-root .lot .spk .end{fill:var(--gold-hi)}.house-root .lot .spk.dn .ln{stroke:var(--dn);filter:drop-shadow(0 0 2px #e2875a80)}.house-root .lot .spk.dn .end{fill:var(--dn)}.house-root .lot .em{width:26px;height:26px;color:var(--gold);border:1px solid var(--line);background:radial-gradient(circle,#d4b06a24,#0000 70%);border-radius:50%;place-items:center;display:grid}.house-root .lot .em svg{width:16px;height:16px}.house-root .lot .nm{min-width:0}.house-root .lot .nm b{font:600 13.5px/1.1 var(--f-title);letter-spacing:.03em;color:var(--ink);white-space:nowrap;text-overflow:ellipsis;display:block;overflow:hidden}.house-root .lot .nm small{font:500 10.5px/1 var(--f-num);letter-spacing:.08em;color:var(--ink-3)}.house-root .lot .px{font:500 13px/1 var(--f-num);color:var(--ink);text-align:right}.house-root .lot .chg{font:500 12px/1 var(--f-num);text-align:right}.house-root .lot.has-pos .em{border-color:var(--teal);box-shadow:0 0 8px #3fd3c873}.house-root[data-mode=advanced] .lot{grid-template-columns:minmax(0,1fr) 48px auto 56px;padding:5px 8px}.house-root[data-mode=advanced] .lot .em{display:none}.house-root[data-mode=advanced] .lot .spk .ln{stroke:#5d5f6a;stroke-width:.9px;opacity:1;filter:none}.house-root[data-mode=advanced] .lot .spk .end{display:none}.house-root[data-mode=advanced] .lot .spk svg{width:44px;height:16px}.house-root[data-mode=advanced] .lot .spk{height:16px}.house-root[data-mode=advanced] .lot .nm b{font:600 12.5px/1.1 var(--f-ui);letter-spacing:0}.house-root[data-mode=advanced] .lot .nm .themed{display:none}.house-root[data-mode=advanced] .lot.on{box-shadow:none;background:#1a1c22;border-color:#2c2f38}.house-root .hud{border-top:1px solid var(--line-soft);background:linear-gradient(#0000,#d4b06a12);align-items:center;gap:12px;padding:12px 14px;display:flex}.house-root .medallion{border:1px solid var(--gold);background:radial-gradient(circle at 50% 40%,#f1dcaa38,#06070be6 70%);border-radius:50%;flex:none;place-items:center;width:64px;height:64px;display:grid;position:relative;box-shadow:0 0 22px #d4b06a59,inset 0 0 12px #d4b06a4d}.house-root .medallion:before{content:\"\";border:1px dashed #d4b06a59;border-radius:50%;position:absolute;inset:5px}.house-root .medallion small{font:600 8px/1 var(--f-title);letter-spacing:.2em;color:var(--ink-2);position:absolute;top:12px}.house-root .medallion b{font:600 26px/1 var(--f-num);color:var(--gold-hi);text-shadow:0 0 10px #f1dcaa99;margin-top:8px}.house-root .hud-text{flex:1;min-width:0}.house-root .hud-text .title{font:600 12px/1.2 var(--f-title);letter-spacing:.12em;color:var(--ink)}.house-root .hud-text .bar{border:1px solid var(--line-soft);background:#00000080;border-radius:99px;height:6px;margin:7px 0 4px;overflow:hidden}.house-root .hud-text .bar div{background:linear-gradient(90deg, var(--gold-lo), var(--gold-hi));height:100%;box-shadow:0 0 8px var(--gold)}.house-root .hud-text .sub{font:500 11px/1 var(--f-num);color:var(--ink-3)}.house-root[data-mode=advanced] .hud{display:none}.house-root .market{background:linear-gradient(#0a090d9e,#07070ac7);padding:0}.house-root .mk-head{border-bottom:1px solid var(--line-soft);align-items:center;gap:14px;padding:12px 16px;display:flex}.house-root .mk-em{width:46px;height:46px;color:var(--gold-hi);border:1px solid var(--gold);background:radial-gradient(circle,#d4b06a40,#06070bcc 70%);border-radius:50%;place-items:center;display:grid;box-shadow:0 0 16px #d4b06a4d}.house-root .mk-em svg{width:26px;height:26px}.house-root .mk-name{min-width:0}.house-root .mk-name h1{font:600 26px/1 var(--f-title);letter-spacing:.04em;color:var(--gold-hi);text-shadow:0 0 18px #d4b06a59;margin:0}.house-root .mk-name .tk{font:600 12px/1 var(--f-num);letter-spacing:.14em;color:var(--ink-2);margin-left:8px}.house-root .mk-name p{font:italic 400 14px/1.2 var(--f-voice);color:var(--ink-2);margin:5px 0 0}.house-root .mk-price{text-align:right;margin-left:auto}.house-root .mk-price b{font:600 30px/1 var(--f-num);color:var(--ink);letter-spacing:.01em;display:block}.house-root .mk-price span{font:500 13px/1 var(--f-num)}.house-root[data-mode=advanced] .mk-em{display:none}.house-root[data-mode=advanced] .mk-name h1{font:600 18px/1 var(--f-ui);letter-spacing:0;color:var(--ink);text-shadow:none}.house-root[data-mode=advanced] .mk-name p{font:400 12px/1.2 var(--f-ui);color:var(--ink-3);font-style:normal}.house-root[data-mode=advanced] .mk-price b{font-size:22px}.house-root .chart-bar{align-items:center;gap:10px;padding:8px 14px 0;display:flex}.house-root #intervals{gap:4px;display:flex}.house-root #intervals button{font:500 12px/1 var(--f-num);color:var(--ink-3);background:0 0;border:1px solid #0000;border-radius:4px;padding:4px 9px}.house-root #intervals button.on{border-color:var(--line);color:var(--gold-hi);background:#d4b06a14}.house-root .conn{font:600 10px/1 var(--f-title);letter-spacing:.2em;margin-left:auto}.house-root .conn.ok{color:var(--teal)}.house-root .conn.bad{color:var(--liq)}.house-root #chart{flex:1;min-height:0;margin:4px 6px 0}.house-root .mk-stats{border-top:1px solid var(--line-soft);grid-template-columns:repeat(5,1fr);display:grid}.house-root .mk-stats div{border-left:1px solid var(--line-soft);padding:8px 14px}.house-root .mk-stats div:first-child{border-left:0}.house-root .mk-stats span{font:600 9.5px/1 var(--f-title);letter-spacing:.18em;color:var(--ink-3);margin-bottom:5px;display:block}.house-root .mk-stats b{font:500 14px/1 var(--f-num);color:var(--ink)}.house-root .perp{font:600 9.5px/1 var(--f-num);letter-spacing:.16em;color:var(--teal);vertical-align:3px;cursor:help;border:1px solid #3fd3c873;border-radius:3px;margin-left:8px;padding:3px 6px 2px}.house-root[data-mode=advanced] .mk-stats span{font:500 10px/1 var(--f-ui);letter-spacing:.04em}.house-root .book{font:500 12px/1 var(--f-num);padding-bottom:8px}.house-root .book-head{color:var(--ink-3);letter-spacing:.1em;justify-content:space-between;padding:0 2px 6px;font-size:10.5px;display:flex}.house-root #asks,.house-root #bids{flex-direction:column;gap:1px;display:flex}.house-root #asks{flex:1;justify-content:flex-end;overflow:hidden}.house-root #bids{flex:1;overflow:hidden}.house-root .lv{justify-content:space-between;padding:3.5px 4px;display:flex;position:relative}.house-root .lv i{opacity:.22;position:absolute;top:0;bottom:0;right:0}.house-root .lv.ask i{background:var(--dn)}.house-root .lv.bid i{background:var(--up)}.house-root .lv.ask span:first-of-type{color:var(--dn)}.house-root .lv.bid span:first-of-type{color:var(--up)}.house-root .lv span{position:relative}.house-root #spread{text-align:center;color:var(--ink-2);border-top:1px solid var(--line-soft);border-bottom:1px solid var(--line-soft);margin:6px 0;padding:7px 4px;font-size:11px}.house-root #spread b{color:var(--gold-hi);margin-bottom:3px;font-size:18px;display:block}.house-root[data-mode=advanced] #spread b{color:var(--ink)}.house-root .ticket{scrollbar-width:thin;scrollbar-color:var(--gold-lo) transparent;gap:9px;overflow:hidden auto}.house-root .side-toggle{border:1px solid var(--line);border-radius:4px;grid-template-columns:1fr 1fr;display:grid;overflow:hidden}.house-root .side-toggle button{font:600 12px/1 var(--f-title);letter-spacing:.22em;color:var(--ink-3);background:0 0;border:0;padding:9px}.house-root .side-toggle #long.on{color:var(--up);box-shadow:inset 0 -2px 0 var(--up);background:#57d6a329}.house-root .side-toggle #short.on{color:var(--dn);box-shadow:inset 0 -2px 0 var(--dn);background:#e2875a29}.house-root .field{grid-template-columns:96px 1fr;align-items:center;gap:8px;display:grid}.house-root .field>span{font:600 10.5px/1.1 var(--f-title);letter-spacing:.14em;color:var(--ink-2)}.house-root .field input,.house-root .field select{border:1px solid var(--line-soft);width:100%;min-width:0;font:500 14px/1 var(--f-num);background:#0006;border-radius:4px;outline:none;padding:7px 9px}.house-root .field input:focus{border-color:var(--gold);box-shadow:0 0 0 3px #d4b06a1f}.house-root .field.stop input{border-color:#e2875a73}.house-root .field.target input{border-color:#57d6a359}.house-root .lev-row{grid-template-columns:96px 1fr 52px;align-items:center;gap:8px;display:grid}.house-root .lev-row>span{font:600 10.5px/1 var(--f-title);letter-spacing:.14em;color:var(--ink-2)}.house-root .lev-row b{font:600 13px/1 var(--f-num);color:var(--gold-hi);text-align:right}.house-root input[type=range]{accent-color:var(--gold);width:100%}.house-root .row-actions{gap:6px;display:flex}.house-root .row-actions .ghost{font:600 10px/1 var(--f-title);letter-spacing:.14em;flex:1;padding:8px}.house-root #checks{justify-content:center;gap:18px;margin:4px 0 2px;display:flex}.house-root #checks i{width:30px;height:30px;color:var(--ink-3);border:1px solid var(--line-soft);background:#08080c66;border-radius:50%;place-items:center;transition:color .4s,border-color .4s,box-shadow .4s,background .4s;display:grid}.house-root #checks svg{fill:none;stroke:currentColor;stroke-width:1.4px;stroke-linecap:round;stroke-linejoin:round;width:18px;height:18px}.house-root #checks i.ok{color:var(--teal);background:#3fd3c817;border-color:#3fd3c8bf;box-shadow:0 0 12px #3fd3c880,inset 0 0 8px #3fd3c82e}.house-root #checks i.bad{color:var(--dn);background:#e2875a14;border-color:#e2875acc;box-shadow:0 0 10px #e2875a66}.house-root[data-mode=advanced] #checks{gap:14px}.house-root[data-mode=advanced] #checks i{width:26px;height:26px;box-shadow:none!important;background:0 0!important}.house-root[data-mode=advanced] #checks i.ok{border-color:var(--up);color:var(--up)}.house-root .preview{font:500 12px/1.3 var(--f-num);grid-template-columns:1fr 1fr;gap:4px 10px;display:grid}.house-root .preview div{justify-content:space-between;gap:6px;display:flex}.house-root .preview span{color:var(--ink-3)}.house-root .place{border:1px solid var(--gold);font:700 13px/1 var(--f-title);letter-spacing:.26em;color:#1a1408;background:linear-gradient(180deg, var(--gold-hi), var(--gold) 55%, var(--gold-lo));border-radius:4px;margin-top:auto;padding:13px;transition:transform 80ms,box-shadow .2s,filter .2s;box-shadow:0 0 22px #d4b06a59,inset 0 1px #ffffff8c}.house-root .place:hover{filter:brightness(1.08);box-shadow:0 0 30px #f1dcaa80,inset 0 1px #ffffff8c}.house-root .place:active{transform:translateY(1px)scale(.995)}.house-root[data-mode=advanced] .side-toggle button,.house-root[data-mode=advanced] .field>span,.house-root[data-mode=advanced] .lev-row>span{font-family:var(--f-ui);letter-spacing:.04em}.house-root[data-mode=advanced] .place{font-family:var(--f-ui);letter-spacing:.1em;color:#0b0c10;background:var(--up);border-color:var(--up);box-shadow:none}.house-root[data-mode=advanced] .place.short{background:var(--dn);border-color:var(--dn)}.house-root .desk{overflow:hidden}.house-root .desk-tabs{align-items:center;gap:4px;margin-bottom:8px;display:flex}.house-root .desk-tabs button{font:600 11px/1 var(--f-title);letter-spacing:.2em;color:var(--ink-3);background:0 0;border:0;border-bottom:1px solid #0000;padding:4px 10px 6px}.house-root .desk-tabs button.on{color:var(--gold-hi);border-color:var(--gold)}.house-root .desk-tabs .spacer{flex:1}.house-root #acct{font:500 12px/1 var(--f-num);color:var(--ink-2)}.house-root #acct b{color:var(--ink)}.house-root .desk-body{flex:1;overflow:auto}.house-root .desk table{border-collapse:collapse;width:100%;font:500 12.5px/1 var(--f-num)}.house-root .desk th{text-align:left;font:600 9.5px/1 var(--f-title);letter-spacing:.16em;color:var(--ink-3);border-bottom:1px solid var(--line-soft);padding:6px}.house-root .desk td{white-space:nowrap;border-bottom:1px solid #d4b06a0f;padding:7px 6px}.house-root .desk td.long{color:var(--up)}.house-root .desk td.short{color:var(--dn)}.house-root .desk input.edit{border:1px solid var(--line-soft);width:92px;font:500 12px var(--f-num);background:#0006;border-radius:3px;padding:4px 6px}.house-root .desk em{font:600 10px var(--f-num);color:var(--dn);margin-left:4px;font-style:normal}.house-root .desk .close{border:1px solid var(--line);font:600 10px/1 var(--f-title);letter-spacing:.14em;color:var(--ink-2);background:0 0;border-radius:3px;padding:4px 8px}.house-root .desk .close:hover{border-color:var(--dn);color:var(--dn)}.house-root .empty{color:var(--ink-3);font:italic 400 15px/1.3 var(--f-voice);margin:8px 2px}.house-root[data-mode=advanced] .empty{font:400 12.5px/1.3 var(--f-ui)}.house-root #medals{flex-wrap:wrap;gap:5px;margin-bottom:8px;display:flex}.house-root .medal{font:600 9.5px/1 var(--f-title);letter-spacing:.14em;border:1px solid var(--line);color:var(--gold-hi);border-radius:3px;padding:5px 8px}.house-root .medal b{font-family:var(--f-num);margin-left:4px}.house-root .medal.dim{opacity:.35}.house-root .medal.m-HUMILIATION,.house-root .medal.m-TILT,.house-root .medal.m-WIDENED{color:var(--dn);border-color:#e2875a66}.house-root .g-flawless{color:var(--gold-hi)}.house-root .g-solid{color:var(--up)}.house-root .g-disciplined{color:var(--ora)}.house-root .g-loose{color:var(--liq)}.house-root .g-unstructured{color:var(--dn)}.house-root .signal{gap:8px;overflow:hidden}.house-root .signal .gauntlet{padding:5px 12px}.house-root .signal .watch b{font-size:28px}.house-root .ora{flex:1;align-items:center;gap:0;min-height:0;display:flex}.house-root .ora-orb{flex:none;width:168px;height:142px;margin:-8px 0 -6px -16px;position:relative}.house-root .ora-orb canvas{display:block}.house-root .ora-say{min-width:0}.house-root .ora-say small{font:600 10px/1 var(--f-title);letter-spacing:.26em;color:var(--ora);margin-bottom:5px;display:block}.house-root .ora-say q{quotes:\"“\" \"”\";font:italic 500 17px/1.25 var(--f-voice);color:var(--ora-hi);text-shadow:0 0 12px #9fdcff59}.house-root .gauntlet{background:linear-gradient(135deg,#3fd3c81a,#3fd3c805);border:1px solid #3fd3c859;border-radius:4px;justify-content:space-between;align-items:center;gap:10px;margin-top:auto;padding:8px 12px;display:flex}.house-root .gauntlet small{font:600 10px/1.4 var(--f-title);letter-spacing:.24em;color:var(--teal)}.house-root .watch{align-items:center;gap:10px;display:flex}.house-root .watch b{font:500 34px/1 var(--f-num);color:var(--ink)}.house-root .watch-sigil{fill:none;width:20px;height:20px;stroke:var(--teal);stroke-width:1.3px;stroke-linejoin:round;opacity:.45;transition:opacity .5s,filter .5s}.house-root .gauntlet.lit .watch-sigil{opacity:1;filter:drop-shadow(0 0 5px #3fd3c8cc)}.house-root .gauntlet.lit .watch b{text-shadow:0 0 12px #3fd3c873}.house-root[data-mode=advanced] .signal .ora{flex:none}.house-root[data-mode=advanced] .signal .ora-orb{background:var(--ora);width:10px;height:10px;box-shadow:0 0 8px var(--ora);filter:none;border-radius:50%;flex:none;margin:5px 2px}.house-root[data-mode=advanced] .signal .ora-orb canvas{display:none}.house-root[data-mode=advanced] .signal .ora{align-items:flex-start}.house-root[data-mode=advanced] .signal .ora-say small{font-family:var(--f-ui);letter-spacing:.06em}.house-root[data-mode=advanced] .signal .ora-say q{font:400 13px/1.35 var(--f-ui);color:var(--ink-2);text-shadow:none;font-style:normal}.house-root[data-mode=advanced] .gauntlet{display:none}.house-root footer{height:30px;color:var(--ink-3);text-align:center;justify-content:center;align-items:center;padding:0 16px;font-size:10.5px;display:flex}.house-root footer p{white-space:nowrap;text-overflow:ellipsis;margin:0;overflow:hidden}.house-root #toast{opacity:0;pointer-events:none;border:1px solid var(--gold);z-index:50;background:#09090df2;border-radius:4px;max-width:640px;padding:10px 16px;font-size:13px;transition:all .25s;position:fixed;bottom:46px;left:50%;transform:translate(-50%,20px);box-shadow:0 10px 30px #00000080}.house-root #toast.show{opacity:1;transform:translate(-50%)}.house-root #toast.bad{border-color:var(--dn);color:#f3c3a8}.house-root #debrief{z-index:40;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);background:#040407b8;place-items:center;display:grid;position:fixed;inset:0}.house-root #debrief[hidden]{display:none}.house-root #debrief .card{text-align:center;border:1px solid var(--gold);background:linear-gradient(#14110cf7,#08080bfa);border-radius:6px;width:min(520px,92vw);padding:28px 30px 22px;animation:.5s cubic-bezier(.2,.9,.3,1.2) house-card-in;position:relative;box-shadow:0 0 60px #d4b06a40,inset 0 0 40px #d4b06a0f}@keyframes house-card-in{0%{opacity:0;transform:translateY(18px)scale(.96)}to{opacity:1;transform:none}}.house-root .card-kicker{font:600 10.5px/1 var(--f-title);letter-spacing:.26em;color:var(--ink-3)}.house-root .card-head{font:600 30px/1.05 var(--f-title);letter-spacing:.06em;color:var(--gold-hi);text-shadow:0 0 24px #d4b06a80;margin:14px 0 4px}.house-root .card-xp{font:700 44px/1 var(--f-num);color:var(--gold-hi)}.house-root .card-sub{font:italic 400 16px/1.3 var(--f-voice);color:var(--ink-2);margin:8px 0 14px}.house-root .card-stats{grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;display:grid}.house-root .card-stats div{border:1px solid var(--line-soft);border-radius:4px;padding:8px}.house-root .card-stats span{font:600 9.5px/1 var(--f-title);letter-spacing:.18em;color:var(--ink-3);margin-bottom:5px;display:block}.house-root .card-stats b{font:600 16px/1 var(--f-num)}.house-root .checks{text-align:left;gap:5px;margin:0 0 12px;padding:0;font-size:13px;list-style:none;display:grid}.house-root .checks li{color:var(--ink-2);gap:8px;display:flex}.house-root .checks li i{text-align:center;width:16px;font-style:normal}.house-root .checks li.pass i{color:var(--teal)}.house-root .checks li.fail i{color:var(--dn)}.house-root .card-medals{flex-wrap:wrap;justify-content:center;gap:6px;margin-bottom:12px;display:flex}.house-root .card-motto{font:italic 400 15px/1.3 var(--f-voice);color:var(--ora-hi);margin-bottom:16px}.house-root #dismiss{border:1px solid var(--gold);font:600 12px/1 var(--f-title);letter-spacing:.24em;color:var(--gold-hi);background:0 0;border-radius:4px;padding:10px 26px}.house-root .grade-unstructured .card-head,.house-root .grade-loose .card-head{color:#f0c9a8;text-shadow:0 0 20px #e2875a59}.house-root .grade-disciplined .card-head{color:var(--ora-hi);text-shadow:0 0 20px #9fdcff66}@media (max-width:1280px){.house-root .floor{grid-template:\"lots market ticket\"minmax(420px,1fr)\"lots book ticket\"\"desk desk signal\"/290px minmax(0,1fr) 300px;height:auto}}@media (max-width:1100px){.house-root .lot{grid-template-columns:26px minmax(0,1fr) auto 48px}.house-root .lot .spk{display:none}.house-root[data-mode=advanced] .lot{grid-template-columns:minmax(0,1fr) auto 56px}}@media (max-width:900px){.house-root .topbar{flex-wrap:wrap;gap:10px;height:auto;padding:10px 12px}.house-root .gamenav,.house-root #player .xpbar,.house-root #player .xptext{display:none}.house-root .modes{order:3;justify-content:center;width:100%;margin:0}.house-root .floor{grid-template-rows:none;grid-template-columns:1fr;grid-template-areas:\"market\"\"ticket\"\"signal\"\"desk\"\"book\"\"lots\";height:auto;min-height:0;padding:8px}.house-root .market{min-height:460px}.house-root .lots{max-height:calc(var(--vh,1vh) * 70)}.house-root .mk-stats{grid-template-columns:repeat(3,1fr)}.house-root .mk-stats div:nth-child(n+4){display:none}.house-root footer{height:auto;padding:12px}.house-root footer p{white-space:normal}}@media (prefers-reduced-motion:reduce){.house-root #debrief .card{animation:none}}@media (min-width:1280px) and (min-height:900px){.house-root[data-mode=game]{--band:clamp(120px, calc(120px + ((var(--vh,1vh) * 100) - 900px) * .4), 160px)}.house-root[data-mode=game] .floor{margin-top:var(--band);height:calc((var(--vh,1vh) * 100) - 58px - 30px - var(--band));min-height:640px}.house-root[data-mode=game] .plate{background-position:50% 0}.house-root[data-mode=game] .plate:after{background:radial-gradient(70% 50% at 50% 62%,#06070b59,#06070b0d 70%,#06070b73),linear-gradient(#06070b73,#06070b00 10% 70%,#06070bbf)}}.house-root .med{object-fit:contain;-webkit-user-select:none;user-select:none;width:100%;height:100%;display:block}.house-root .lot .em:has(.med){filter:drop-shadow(0 1px 3px #000000b3);background:0 0;border:0;width:30px;height:30px}.house-root .lot.on .em:has(.med){filter:drop-shadow(0 0 6px #f1dcaa8c)}.house-root .lot.has-pos .em:has(.med){filter:drop-shadow(0 0 6px #3fd3c8bf);box-shadow:none}.house-root .mk-em:has(.med){width:58px;height:58px;box-shadow:none;filter:drop-shadow(0 0 14px #d4b06a73);background:0 0;border:0}.house-root .hall-h .med{width:16px;height:16px}.house-root[data-mode=advanced] .hall-h .med{display:none}.house-root .hall-more{border:0;border-top:1px dashed var(--line-soft);width:100%;color:var(--gold);cursor:pointer;background:0 0;justify-content:center;align-items:center;gap:6px;margin:1px 0 2px;padding:3px 0;display:flex}.house-root .hall-more svg{fill:none;stroke:currentColor;stroke-width:1.6px;stroke-linecap:round;stroke-linejoin:round;width:14px;height:14px;transition:transform .25s}.house-root .hall-more.open svg{transform:rotate(180deg)}.house-root .hall-more b{font:600 11px/1 var(--f-num);color:var(--ink-2);letter-spacing:.04em}.house-root .hall-more:hover{color:var(--gold-hi);background:#d4b06a12}.house-root[data-mode=advanced] .hall-more{color:var(--ink-3);border-top-color:#23252d;margin:0;padding:1px 0}.house-root[data-mode=advanced] .hall-more:hover{color:var(--ink);background:#17181d}.house-root[data-mode=advanced] .hall-more svg{width:12px;height:12px}.house-root[data-mode=advanced] .hall-more b{font-size:10px}.house-root .cab{grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;margin-bottom:10px;display:grid}.house-root .plaque{color:var(--ink-3);opacity:.42;background:linear-gradient(#00000059,#d4b06a08);border:1px solid #d4b06a29;border-radius:4px;grid-template-rows:auto auto;grid-template-columns:auto 1fr;align-items:center;column-gap:8px;padding:7px 9px;display:grid;position:relative;box-shadow:inset 0 1px 3px #0009}.house-root .plaque svg{grid-row:1/3;width:22px;height:22px}.house-root .plaque b{font:600 17px/1 var(--f-num);text-align:right}.house-root .plaque small{font:600 8px/1 var(--f-title);letter-spacing:.1em;text-align:right;white-space:nowrap;text-overflow:ellipsis;margin-top:3px;overflow:hidden}.house-root .plaque.lit{opacity:1;color:var(--gold-hi);background:linear-gradient(#d4b06a29,#d4b06a0a);border-color:#d4b06a99;box-shadow:0 0 14px #d4b06a38,inset 0 1px #f1dcaa40}.house-root .plaque.lit svg{filter:drop-shadow(0 0 4px #f1dcaab3)}.house-root .plaque.m-HUMILIATION.lit,.house-root .plaque.m-TILT.lit,.house-root .plaque.m-WIDENED.lit{color:var(--dn);background:linear-gradient(#e2875a21,#e2875a08);border-color:#e2875a80;box-shadow:0 0 12px #e2875a2e}.house-root .cab.slim{gap:6px;margin:10px 0 0}.house-root .cab.slim .plaque{padding:4px 7px}.house-root .cab.slim .plaque svg{grid-row:1/3;width:16px;height:16px}.house-root .cab.slim .plaque b{font-size:14px}.house-root .cab.slim .plaque small{display:none}.house-root .dcards{grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;display:grid}.house-root .dc{min-height:58px;color:var(--gold);border:1px solid;border-color:color-mix(in srgb, currentColor 40%, transparent);background:linear-gradient(135deg,#d4b06a17,#0000004d);border-radius:5px;grid-template-columns:auto auto 1fr auto;align-items:center;gap:10px;padding:8px 12px;display:grid;box-shadow:inset 0 0 18px #00000073}.house-root .dc .gg{filter:drop-shadow(0 0 5px);width:24px;height:24px}.house-root .dc .dem{width:34px;height:34px;display:block}.house-root .dc .dem svg{width:100%;height:100%;color:var(--gold)}.house-root .dc .dtx{gap:3px;display:grid}.house-root .dc .dtx b{font:600 18px/1 var(--f-num)}.house-root .dc .dtx i{font:500 12px/1 var(--f-num);color:var(--gold-hi);font-style:normal}.house-root .dc .dmd{gap:4px;display:flex}.house-root .dc .mini{width:18px;height:18px;color:var(--gold-hi);display:block}.house-root .dc .mini svg{width:100%;height:100%}.house-root .dc .mini.m-HUMILIATION,.house-root .dc .mini.m-TILT,.house-root .dc .mini.m-WIDENED{color:var(--dn)}.house-root .dc.g-solid{color:var(--teal)}.house-root .dc.g-disciplined{color:var(--ora)}.house-root .dc.g-loose{color:var(--liq)}.house-root .dc.g-unstructured{color:var(--dn)}.house-root .dc.ghostcard{box-shadow:none;background:#0000001f;border:1px dashed #d4b06a29}.house-root[data-mode=advanced] .plaque{opacity:.4;box-shadow:none;background:0 0;border-radius:2px}.house-root[data-mode=advanced] .plaque.lit{opacity:1;color:var(--ink);box-shadow:none;background:#17181d;border-color:#3a3d48}.house-root[data-mode=advanced] .plaque.lit svg{filter:none}.house-root[data-mode=advanced] .plaque small{font-family:var(--f-ui);letter-spacing:0;font-size:8.5px}.house-root[data-mode=advanced] .dc{box-shadow:none;background:#101116;border-radius:3px}.house-root[data-mode=advanced] .dc .gg,.house-root[data-mode=advanced] .dc .dem{display:none}.house-root[data-mode=advanced] .dc{grid-template-columns:1fr auto}.house-root[data-mode=advanced] .dc .gg{filter:none}@media (max-width:900px){.house-root .cab{grid-template-columns:repeat(4,minmax(0,1fr))}.house-root .dcards{grid-template-columns:1fr}.house-root .ora-orb{width:150px;height:130px}}@media (prefers-reduced-motion:reduce){.house-root .hall-more svg{transition:none}}.house-root .lot{padding:3px 8px}.house-root .hall-h{margin:8px 8px 3px}.house-root .hall:first-child .hall-h{margin-top:4px}.house-root .lot .em:has(.med){width:28px;height:28px}.house-root .lots-head{padding:12px 16px 8px}.house-root .lot-search{margin:8px 12px 2px}.house-root .plaque{opacity:.58}.house-root .dc.ghostcard{background:#d4b06a06;border-color:#d4b06a42}.house-root .desk-body>#pos{flex-direction:column;min-height:100%;display:flex}.house-root .dcards{flex:1;min-height:64px;max-height:120px}.house-root .dc{min-height:0}.house-root .plaque{grid-template-columns:auto 1fr;row-gap:4px}.house-root .plaque svg{grid-row:1}.house-root .plaque small{text-align:center;letter-spacing:.12em;grid-column:1/-1;margin-top:0;font-size:8.5px}.house-root .cab.slim .plaque{grid-template-rows:auto}.house-root .dc .gg{width:30px;height:30px}.house-root .dc .dem{width:44px;height:44px}.house-root .dc .dtx b{font-size:24px}.house-root .dc .dtx i{font-size:14px}.house-root .dc{gap:14px;padding:8px 16px}.house-root[data-mode=advanced] .lot .nm small{display:none}.house-root[data-mode=advanced] .lot{padding-top:3px;padding-bottom:3px}.house-root[data-mode=advanced] .dcards{min-height:52px;max-height:72px}.house-root[data-mode=advanced] .dc .dtx b{font-size:18px}.house-root[data-mode=game]{--panel:#080b12f0;--panel-2:#0b0f18eb;--ink:#f4eee2;--ink-2:#cfc6b3;--ink-3:#958c78;--teal:#45d6cb;--f-name:\"Marcellus\", \"Cinzel\", Georgia, serif;font-size:15px}.house-root[data-mode=game] .panel{-webkit-backdrop-filter:none;backdrop-filter:none;background:linear-gradient(180deg, var(--panel-2), var(--panel))}.house-root[data-mode=game] .panel:before{border-color:#d4b06a1a}.house-root[data-mode=game] .market{background:linear-gradient(#0a0e16f2,#07090ff5)}.house-root[data-mode=game] .ptitle{letter-spacing:.14em;font-size:13.5px}.house-root[data-mode=game] .lots-head h2{font-size:19px}.house-root[data-mode=game] .lots-head p{color:var(--ink-2);font-size:15px}.house-root[data-mode=game] .hall-h{font:600 12px/1 var(--f-title);letter-spacing:.14em;color:var(--gold);margin:14px 6px 6px}.house-root[data-mode=game] .hall-h small{font:500 11px var(--f-ui);color:var(--ink-3)}.house-root[data-mode=game] .lot{background:#ffffff06;border:1px solid #ffffff14;border-radius:5px;margin:0 0 5px;padding:7px 10px}.house-root[data-mode=game] .lot:hover{background:#d4b06a12;border-color:#d4b06a40}.house-root[data-mode=game] .lot.on{border-color:var(--teal);background:linear-gradient(90deg,#45d6cb24,#45d6cb0a);box-shadow:0 0 14px #45d6cb47,inset 0 0 12px #45d6cb1a}.house-root[data-mode=game] .lot .nm b{font:400 17px/1.15 var(--f-name);letter-spacing:.01em;color:var(--ink);text-transform:none}.house-root[data-mode=game] .lot .nm small{font:500 11.5px/1.2 var(--f-ui);letter-spacing:.06em;color:var(--ink-3)}.house-root[data-mode=game] .lot .px{font:600 14.5px/1 var(--f-ui);color:var(--ink)}.house-root[data-mode=game] .lot .chg{font:600 13.5px/1 var(--f-ui)}.house-root[data-mode=game] .lot{grid-template-columns:34px minmax(0,1fr) 44px 62px 50px;gap:6px}@media (min-width:1281px){.house-root[data-mode=game] .floor{grid-template-columns:372px minmax(0,1fr) 236px 316px}}.house-root[data-mode=game] .lot .em:has(.med){width:34px;height:34px}.house-root[data-mode=game] .plaque small{font:600 9.5px/1 var(--f-ui);letter-spacing:.06em;color:var(--ink-2)}.house-root[data-mode=game] .plaque b{font:600 18px/1 var(--f-ui)}@media (max-width:1100px){.house-root[data-mode=game] .lot{grid-template-columns:36px minmax(0,1fr) 64px 52px}}.house-root[data-mode=game] .mk-name h1{font:400 36px/1 var(--f-name);letter-spacing:.01em}.house-root[data-mode=game] .mk-name .tk{font:600 13px/1 var(--f-ui);letter-spacing:.1em;color:var(--ink-2)}.house-root[data-mode=game] .mk-name p{color:var(--ink-2);font-size:17px}.house-root[data-mode=game] .mk-price b{font:600 36px/1 var(--f-ui);color:#e9fbf8;text-shadow:0 0 18px #45d6cb59}.house-root[data-mode=game] .mk-price span{font:600 14.5px/1 var(--f-ui)}.house-root[data-mode=game] #intervals button{font:600 13px/1 var(--f-ui);color:var(--ink-2);padding:6px 11px}.house-root[data-mode=game] #intervals button.on{color:var(--ink);border-color:var(--teal);background:#45d6cb1a}.house-root[data-mode=game] .mk-stats span{font:600 11px/1 var(--f-ui);letter-spacing:.08em;color:var(--ink-3)}.house-root[data-mode=game] .mk-stats b{font:600 16px/1 var(--f-ui);color:var(--ink)}.house-root[data-mode=game] .book{font:500 13.5px/1 var(--f-ui)}.house-root[data-mode=game] .book-head{font:600 11px var(--f-ui);letter-spacing:.08em;color:var(--ink-3)}.house-root[data-mode=game] .lv{border-radius:2px;margin-bottom:1px;padding:4px 6px}.house-root[data-mode=game] .lv.ask{background:#e2875a12}.house-root[data-mode=game] .lv.bid{background:#45d6cb0f}.house-root[data-mode=game] .lv i{opacity:.3}.house-root[data-mode=game] .lv.bid i{background:var(--teal)}.house-root[data-mode=game] .lv.bid span:first-of-type{color:var(--teal)}.house-root[data-mode=game] .lv span:last-child{color:var(--ink)}.house-root[data-mode=game] #spread{font:500 12px var(--f-ui);color:var(--ink-2)}.house-root[data-mode=game] #spread b{font:600 24px/1.1 var(--f-ui);color:var(--gold-hi);text-shadow:0 0 14px #d4b06a66}.house-root[data-mode=game] .ticket{gap:11px}.house-root[data-mode=game] .side-toggle{border:0;border-radius:5px;gap:6px}.house-root[data-mode=game] .side-toggle button{font:600 14px/1 var(--f-ui);letter-spacing:.12em;color:var(--ink-2);border:1px solid #ffffff24;border-radius:5px;padding:11px}.house-root[data-mode=game] .side-toggle #long.on{border-color:var(--teal);color:var(--teal);background:#45d6cb1f;box-shadow:0 0 12px #45d6cb40}.house-root[data-mode=game] .side-toggle #short.on{border-color:var(--dn);color:var(--dn);background:#e2875a1f;box-shadow:0 0 12px #e2875a40}.house-root[data-mode=game] .field,.house-root[data-mode=game] .lev-row{grid-template-columns:104px 1fr}.house-root[data-mode=game] .lev-row{grid-template-columns:104px 1fr 44px}.house-root[data-mode=game] .field>span,.house-root[data-mode=game] .lev-row>span{font:500 15px/1.1 var(--f-ui);letter-spacing:0;color:var(--ink);text-transform:lowercase}.house-root[data-mode=game] .field>span:first-letter,.house-root[data-mode=game] .lev-row>span:first-letter{text-transform:uppercase}.house-root[data-mode=game] .field input,.house-root[data-mode=game] .field select{font:500 16px/1 var(--f-ui);color:var(--ink);background:#00000073;border:1px solid #ffffff29;border-radius:5px;padding:9px 11px}.house-root[data-mode=game] .field.stop input{border-color:#e2875a8c}.house-root[data-mode=game] .field.target input{border-color:#45d6cb73}.house-root[data-mode=game] .row-actions .ghost{font:600 12.5px/1 var(--f-ui);letter-spacing:.1em;color:var(--ink-2);border-color:#ffffff29;padding:10px}.house-root[data-mode=game] .lev-row b{font:600 15px/1 var(--f-ui)}.house-root[data-mode=game] .preview{font:500 13.5px/1.35 var(--f-ui)}.house-root[data-mode=game] .place{font:700 15px/1 var(--f-title);letter-spacing:.2em;padding:15px}.house-root[data-mode=game] .desk-tabs button,.house-root[data-mode=game] .gamenav button{color:var(--ink-2);font-size:12.5px}.house-root[data-mode=game] .desk-tabs button.on,.house-root[data-mode=game] .gamenav button.on{color:var(--gold-hi)}.house-root[data-mode=game] .desk table{font:500 14px/1 var(--f-ui)}.house-root[data-mode=game] .desk th{font:600 11px/1 var(--f-ui);letter-spacing:.08em;color:var(--ink-3)}.house-root[data-mode=game] #acct{font:500 13.5px/1 var(--f-ui)}.house-root[data-mode=game] .ora-say q{font-size:19px}.house-root[data-mode=game] #player .xptext{font:500 13px var(--f-ui);color:var(--ink-2)}.house-root[data-mode=game] #player .rank{color:var(--ink);font-size:11px}.house-root[data-mode=game] .hud-text .title{font:400 15px/1.2 var(--f-name);letter-spacing:.02em}.house-root[data-mode=game] .hud-text .sub{font:500 12px var(--f-ui);color:var(--ink-2)}.house-root .plaque .mimg{object-fit:contain;filter:grayscale()brightness(.55);grid-row:1/3;width:30px;height:30px}.house-root .plaque .mfb{grid-row:1/3;width:22px;height:22px;display:block}.house-root .plaque .plock{color:#aeb4c0;background:#080a10d9;border-radius:50%;width:12px;height:12px;padding:1px;position:absolute;bottom:4px;left:24px}.house-root .plaque .plock svg{width:100%;height:100%}.house-root .plaque.lit .mimg{filter:drop-shadow(0 0 6px #f1dcaa99)}.house-root .plaque.m-HUMILIATION.lit .mimg,.house-root .plaque.m-TILT.lit .mimg,.house-root .plaque.m-WIDENED.lit .mimg{filter:drop-shadow(0 0 6px #e2875a99)}.house-root .cab.slim .plaque .mimg{width:24px;height:24px}.house-root .cab.slim .plaque .plock{left:18px}.house-root .dc .mini{width:26px;height:26px}.house-root .dc .mini .mimg{object-fit:contain;width:100%;height:100%}.house-root .tr-rewards{cursor:default;background:0 0;border-top:0;border-bottom:0;border-right:0}.house-root .tr-rewards .chimg{object-fit:contain;filter:drop-shadow(0 2px 4px #0009);width:56px;height:46px}.house-root .tr-rewards.ready{cursor:pointer}.house-root .tr-rewards.ready .chimg{filter:drop-shadow(0 0 10px #ffdc82d9);animation:2.4s ease-in-out infinite tr-glow}.house-root .tr-rewards.open .chimg{filter:drop-shadow(0 0 10px #78dcff80)}.house-root .tr-rewards.ready span{color:var(--gold-hi)}@keyframes tr-glow{50%{filter:drop-shadow(0 0 16px #ffe096)}}.house-root .roomhost:before{content:\"\";z-index:0;pointer-events:none;background-image:var(--rh-bg);filter:brightness(1.55)saturate(1.3)hue-rotate(-6deg);background-position:50% 38%;background-size:cover;position:absolute;inset:0;-webkit-mask-image:linear-gradient(#000 0 18%,#0000 30%);mask-image:linear-gradient(#000 0 18%,#0000 30%)}.house-root .roomhost .roomstage{z-index:1}.house-root .otype{border:1px solid var(--line);border-radius:4px;grid-template-columns:repeat(3,1fr);display:grid;overflow:hidden}.house-root .otype button{font:600 11px/1 var(--f-title);letter-spacing:.18em;color:var(--ink-3);background:0 0;border:0;padding:8px 4px}.house-root .otype button.on{color:var(--gold-hi);box-shadow:inset 0 -2px 0 var(--gold);background:#d4b06a1f}.house-root .field.price[hidden]{display:none}.house-root .pxbox{grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:4px;display:grid}.house-root .pxbox input{border:1px solid var(--line-soft);width:100%;min-width:0;font:500 14px/1 var(--f-num);background:#0006;border-radius:4px;outline:none;padding:7px 9px}.house-root .pxbox input:focus{border-color:var(--gold);box-shadow:0 0 0 3px #d4b06a1f}.house-root .chip{border:1px solid var(--line-soft);font:600 9.5px/1 var(--f-title);letter-spacing:.1em;color:var(--ink-2);background:0 0;border-radius:3px;padding:6px}.house-root .chip:hover{border-color:var(--gold);color:var(--gold-hi)}.house-root .lev-row{grid-template-columns:96px 1fr 64px}.house-root .levn{justify-content:flex-end;align-items:center;gap:2px;display:flex}.house-root .levn input{border:1px solid var(--line-soft);width:46px;font:600 13px/1 var(--f-num);color:var(--gold-hi);text-align:right;-moz-appearance:textfield;background:#0006;border-radius:4px;outline:none;padding:5px 4px}.house-root .levn input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}.house-root .levn input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}.house-root .levn input:focus{border-color:var(--gold)}.house-root .levn i{font:normal 600 12px/1 var(--f-num);color:var(--ink-2)}.house-root .ro-row{display:flex}.house-root .ro{border:1px solid var(--line-soft);font:600 10px/1 var(--f-title);letter-spacing:.14em;color:var(--ink-3);background:0 0;border-radius:4px;align-items:center;gap:7px;padding:6px 10px;display:inline-flex}.house-root .ro svg,.house-root .roi{fill:none;stroke:currentColor;stroke-width:1.5px;stroke-linecap:round;stroke-linejoin:round;width:15px;height:15px}.house-root .ro.on{color:var(--teal);background:#3fd3c817;border-color:#3fd3c8b3}.house-root .ticket.ro-on .pair,.house-root .ticket.ro-on .sigils,.house-root .ticket.ro-on .field.risk{display:none}.house-root[data-mode=advanced] .otype button,.house-root[data-mode=advanced] .ro,.house-root[data-mode=advanced] .chip{font-family:var(--f-ui);letter-spacing:.04em}.house-root[data-mode=advanced] .otype button.on{color:var(--ink);box-shadow:inset 0 -2px 0 var(--ink);background:#1b1d23}.house-root[data-mode=game] .otype button{font:600 13px/1 var(--f-ui);letter-spacing:.1em;color:var(--ink-2);border-color:#ffffff24;padding:10px 4px}.house-root[data-mode=game] .otype{border-color:#ffffff24}.house-root[data-mode=game] .otype button.on{color:var(--gold-hi)}.house-root[data-mode=game] .lev-row{grid-template-columns:104px 1fr 64px}.house-root[data-mode=game] .levn input{font:600 15px/1 var(--f-ui);background:#00000073;border-color:#ffffff29;width:48px;padding:6px 4px}.house-root[data-mode=game] .pxbox input{font:500 16px/1 var(--f-ui);color:var(--ink);background:#00000073;border:1px solid #ffffff29;border-radius:5px;padding:9px 11px}.house-root[data-mode=game] .chip{font:600 11px/1 var(--f-ui);letter-spacing:.06em;border-color:#ffffff29;padding:8px 6px}.house-root[data-mode=game] .ro{font:600 12px/1 var(--f-ui);letter-spacing:.08em;color:var(--ink-2);border-color:#ffffff29}.house-root[data-mode=game] .ro.on{color:var(--teal);border-color:var(--teal)}.house-root .mk-stats{grid-template-columns:repeat(auto-fit,minmax(84px,1fr))}.house-root .mk-stats div:nth-child(6){grid-column:span 2}.house-root .mk-stats div{min-width:0}.house-root .mk-stats b{white-space:nowrap}.house-root .mk-stats u{text-decoration:none}.house-root .mk-stats small{font:500 11px/1 var(--f-num);color:var(--ink-3);letter-spacing:0;margin-left:4px}.house-root[data-mode=game] .mk-stats small{font:600 12px/1 var(--f-ui);color:var(--ink-2)}.house-root[data-mode=game] .mk-stats b{font-size:15px}.house-root .book{position:relative}.house-root .book-tools{justify-content:flex-end;padding:0 2px 6px;display:flex}.house-root .book-tools select{color:var(--ink-2);border:1px solid var(--line-soft);font:500 11.5px/1 var(--f-num);cursor:pointer;background:#00000073;border-radius:3px;outline:none;padding:3px 6px}.house-root .book-tools select:focus{border-color:var(--gold)}.house-root[data-mode=game] .book-tools select{font:600 12.5px/1 var(--f-ui);color:var(--ink);background:#00000080;border-color:#ffffff2e}.house-root .lv{cursor:pointer}.house-root .lv:hover{outline:1px solid var(--gold);outline-offset:-1px}.house-root .lv.cum:after{content:\"\";pointer-events:none;background:#d4b06a21;position:absolute;inset:0}.house-root .lv em.mine{background:var(--gold-hi);width:7px;height:7px;box-shadow:0 0 6px var(--gold);vertical-align:1px;margin-right:6px;display:inline-block;transform:rotate(45deg)}.house-root #bookTip{z-index:20;pointer-events:none;border:1px solid var(--gold);background:#0a0d14;border-radius:5px;gap:6px;min-width:150px;padding:9px 12px;display:grid;position:absolute;box-shadow:0 6px 24px #000000b3}.house-root #bookTip[hidden]{display:none}.house-root #bookTip div{font:500 12.5px/1 var(--f-num);justify-content:space-between;gap:18px;display:flex}.house-root #bookTip span{color:var(--ink-3);letter-spacing:.12em;align-self:center;font-size:10px}.house-root #bookTip b{color:var(--ink);font-weight:600}.house-root[data-mode=game] #bookTip div{font-family:var(--f-ui);font-size:14px}.house-root[data-mode=game] #bookTip span{font-family:var(--f-ui);letter-spacing:.08em;font-size:11px}.house-root[data-mode=advanced] #bookTip{background:#0f1014;border-color:#3a3d48}.house-root .desk-tabs{flex-wrap:wrap;row-gap:2px}.house-root .desk-tabs button b{color:var(--gold-hi);font:600 10px/1 var(--f-num);letter-spacing:0;background:#d4b06a33;border-radius:8px;margin-left:6px;padding:2px 5px}.house-root .desk-tabs button b:empty{display:none}.house-root .desk-body{scrollbar-width:thin;scrollbar-color:var(--gold-lo) transparent;overflow:auto}.house-root .desk td.long,.house-root .desk td.short{font-weight:600}.house-root .desk td small{font:500 11px/1 var(--f-num);letter-spacing:0}.house-root[data-mode=game] .desk td small{font:600 12px/1 var(--f-ui)}.house-root .desk td.acts{border-bottom:0;align-items:center;gap:6px;display:flex}.house-root .desk .chips{gap:3px;display:inline-flex}.house-root .desk .chips .close{padding:4px 6px}.house-root .desk input.amt{border:1px solid var(--line-soft);width:52px;font:500 12px var(--f-num);background:#0006;border-radius:3px;outline:none;padding:4px 6px}.house-root .desk input.amt:focus,.house-root .desk input.edit:focus{border-color:var(--gold)}.house-root .desk input.edit{width:72px}.house-root .desk td,.house-root .desk th{padding-left:5px;padding-right:5px}.house-root .desk .ro-tag{vertical-align:-3px;color:var(--teal);display:inline-flex}.house-root .desk .empty{color:var(--ink-3);padding:14px 6px}.house-root .desk th .close{padding:3px 6px;font-size:9px}.house-root .desk-body>#pos{flex-direction:column;min-height:100%;display:flex}.house-root[data-mode=game] .desk .chips .close{font:600 11px/1 var(--f-ui);letter-spacing:.04em;color:var(--ink-2)}.house-root[data-mode=game] .desk input.amt,.house-root[data-mode=game] .desk input.edit{font:500 14px var(--f-ui)}.house-root .ticket{gap:8px}.house-root .pair{grid-template-columns:1fr 1fr;gap:8px;display:grid}.house-root .field.v{grid-template-columns:1fr;gap:4px}.house-root .field.v>span{font-size:10px}.house-root[data-mode=game] .field.v{grid-template-columns:1fr}.house-root[data-mode=game] .field.v>span{font-size:14px}.house-root .pxbox2{grid-template-columns:70px 1fr;align-items:center;gap:6px;display:grid}.house-root .pxbox2 input{border:1px solid var(--line-soft);width:100%;min-width:0;font:500 14px/1 var(--f-num);background:#0006;border-radius:4px;outline:none;padding:7px 9px}.house-root[data-mode=game] .pxbox2 input{font:500 16px/1 var(--f-ui);color:var(--ink);background:#00000073;border:1px solid #ffffff29;border-radius:5px;padding:9px 11px}.house-root .pxbox2 .ghost{font:600 10px/1 var(--f-title);letter-spacing:.12em;white-space:nowrap;padding:9px 6px}.house-root[data-mode=game] .pxbox2 .ghost{font:600 12px/1 var(--f-ui);letter-spacing:.08em;color:var(--ink-2);border-color:#ffffff29}.house-root .ro-row{justify-content:space-between;align-items:center}.house-root .ro-row #checks{gap:10px;margin:0}.house-root .ro-row #checks i{width:28px;height:28px}.house-root .place{position:sticky;bottom:0}.house-root .desk-tabs{flex-wrap:nowrap}.house-root .desk-tabs button{letter-spacing:.12em;white-space:nowrap;padding:4px 8px 6px}.house-root #acct{white-space:nowrap;text-overflow:ellipsis;min-width:0;overflow:hidden}.house-root #reset{white-space:nowrap}.house-root .field.price,.house-root[data-mode=game] .field.price{grid-template-columns:62px 1fr}.house-root .mk-stats div{padding:8px 10px}.house-root[data-mode=game] .ticket{gap:8px}.house-root[data-mode=game] .field input,.house-root[data-mode=game] .field select,.house-root[data-mode=game] .pxbox input,.house-root[data-mode=game] .pxbox2 input{padding:6px 10px;font-size:15px}.house-root[data-mode=game] .chip{padding:7px 6px}.house-root[data-mode=game] .pxbox2 .ghost{padding:8px 6px}.house-root[data-mode=game] .ro{padding:5px 9px}.house-root[data-mode=game] .ro-row #checks i{width:26px;height:26px}.house-root .place{box-shadow:0 -10px 8px -2px #080b12,0 0 22px #d4b06a59,inset 0 1px #ffffff8c}.house-root[data-mode=advanced] .place{box-shadow:0 -10px 8px -2px #0f1014}.house-root .mk-stats span{white-space:nowrap}.house-root #medals{margin-bottom:10px;display:block}.house-root #hist table{margin-top:2px}.house-root .panel.ticket{overflow:visible}.house-root .ticket>*{flex-shrink:0}.house-root .ticket>.tk-body{scrollbar-width:thin;scrollbar-color:var(--gold-lo) transparent;flex-direction:column;flex:auto;gap:8px;min-height:0;display:flex;overflow:hidden auto}.house-root .ticket .tk-body>*{flex-shrink:0}.house-root[data-mode=game] .ticket .tk-body{gap:6px}.house-root[data-mode=game] .field.v{gap:3px}.house-root[data-mode=game] .side-toggle button{padding:7px 8px}.house-root[data-mode=game] .otype button{padding:6px 4px}.house-root[data-mode=game] .place{padding:10px}.house-root{--navy:#080b12f6;--navy-2:#0b101bf7;--brass:#b8924d;--f-mar:\"Marcellus\", \"Cinzel\", Georgia, serif}.house-root i.a-only,.house-root i.g-only,.house-root span.g-only,.house-root span.a-only{font-style:normal}.house-root[data-mode=advanced] .g-only,.house-root[data-mode=game] .a-only{display:none!important}.house-root[data-mode=advanced] .leftcol{display:contents}.house-root[data-mode=advanced] .charcard,.house-root[data-mode=advanced] .vault,.house-root[data-mode=advanced] .trials,.house-root[data-mode=advanced] .hall-tabs,.house-root[data-mode=advanced] .lot-cols,.house-root[data-mode=advanced] .contract,.house-root[data-mode=advanced] .sz-eq,.house-root[data-mode=advanced] .pct-row,.house-root[data-mode=advanced] .sz-unit,.house-root[data-mode=advanced] .book-head span:nth-child(3),.house-root[data-mode=advanced] .lv span:nth-child(3),.house-root[data-mode=advanced] #spread em{display:none}.house-root #spread small{font:inherit}.house-root[data-mode=advanced] .tk-body>.side-toggle{order:0}.house-root[data-mode=advanced] .tk-body>.otype{order:1}.house-root[data-mode=advanced] .tk-body>#priceRow{order:2}.house-root[data-mode=advanced] .tk-body>.pair{order:3}.house-root[data-mode=advanced] .tk-body>.risk{order:4}.house-root[data-mode=advanced] .tk-body>.sizef{order:5}.house-root[data-mode=advanced] .tk-body>.lev-row{order:6}.house-root[data-mode=advanced] .tk-body>.ro-row{order:7}.house-root[data-mode=advanced] .tk-body>.preview{order:8}.house-root[data-mode=advanced] .tk-body>.place{order:9}.house-root[data-mode=advanced] .sizef{grid-template-columns:96px 1fr}.house-root[data-mode=advanced] .mk-name .quote{display:none}.house-root #fx{z-index:90;pointer-events:none;position:fixed;inset:0;overflow:hidden}.house-root #fx .shard{opacity:0;background:radial-gradient(circle at 50% 30%, #fff 0 14%, var(--c) 60%);box-shadow:0 0 6px 2px var(--c), 0 0 18px 5px color-mix(in srgb, var(--c) 60%, transparent);border-radius:55% 55% 45% 45%/65% 65% 35% 35%;position:absolute;top:0;left:0}.house-root #fx .plus1{font:700 30px/1 var(--f-num);color:#fff;letter-spacing:.02em;text-shadow:0 0 8px var(--c), 0 0 22px var(--c);animation:1.3s ease-out forwards house-plus;position:absolute;transform:translate(-50%,-100%)}@keyframes house-plus{0%{opacity:0;margin-top:0;scale:.6}15%{opacity:1;scale:1.25}to{opacity:0;margin-top:-48px;scale:1}}@keyframes house-flare{0%{filter:drop-shadow(0 0 8px var(--glow)) brightness(1);transform:scale(1)}25%{filter:drop-shadow(0 0 22px var(--glow)) drop-shadow(0 0 40px var(--glow)) brightness(1.9);transform:scale(1.32)}to{filter:drop-shadow(0 0 8px var(--glow)) brightness(1);transform:scale(1)}}@keyframes house-ring{0%{opacity:.9;transform:scale(.4)}to{opacity:0;transform:scale(2.2)}}@media (prefers-reduced-motion:reduce){.house-root #fx .plus1{animation-duration:10ms}}.house-root[data-mode=game] .topbar{background:linear-gradient(#06070bd1,#06070b40);border-bottom:0;height:52px}.house-root[data-mode=game] .topbar:after{opacity:.35;left:6%;right:6%}.house-root[data-mode=game] #player{display:none}.house-root[data-mode=game] .plate{filter:saturate(1.15)brightness(1.18);background-position:50% 0}.house-root[data-mode=game] .plate:after{background:linear-gradient(#06070b4d,#06070b00 10% 45%,#06070b8c)}@media (min-width:1180px){.house-root[data-mode=game]{--colL:360px;--colBook:210px;--colTk:268px;--gapG:16px;--deskH:clamp(176px, (var(--vh,1vh) * 21.5), 232px);--band:clamp(34px, (var(--vh,1vh) * 6.2), 66px)}.house-root[data-mode=game] .floor{margin-top:var(--band);gap:var(--gapG);grid-template-columns:var(--colL) minmax(0, 1fr) var(--colBook) var(--colTk);grid-template-rows:56px minmax(0, 1fr) var(--deskH);height:calc((var(--vh,1vh) * 100) - 52px - 26px - var(--band));grid-template-areas:\"left trials trials trials\"\"left market book ticket\"\"left desk signal signal\";min-height:700px;padding:10px 20px 0}.house-root[data-mode=game] .trials{grid-area:trials}.house-root[data-mode=game] .leftcol{flex-direction:column;grid-area:left;gap:16px;min-width:0;min-height:0;display:flex}}@media (min-width:1180px) and (max-width:1700px){.house-root[data-mode=game]{--colL:300px;--colBook:186px;--colTk:240px;--gapG:14px}}.house-root[data-mode=game] .panel{background:linear-gradient(180deg, var(--navy-2), var(--navy));-webkit-backdrop-filter:none;backdrop-filter:none;border-color:#d4b06a80;box-shadow:0 0 0 1px #000000b3,0 14px 34px #0000008c,inset 0 1px #f1dcaa1a,inset 0 0 40px #3f78be0d}.house-root[data-mode=game] .panel.lite:after{border-width:30px;border-image:var(--frame) 118 / 30px stretch;inset:-9px}.house-root[data-mode=game] .panel.lite:before{inset:3px}.house-root[data-mode=game] .market{background:linear-gradient(#0b1220,#080c15)}.house-root[data-mode=game] .charcard{flex-direction:row;flex:none;align-items:center;gap:14px;height:112px;margin-top:4px;padding:8px 16px 8px 12px}.house-root .cc-portrait{background:conic-gradient(from 210deg,#f6e3b2,#a88345 18%,#f1dcaa 36%,#6e5224 55%,#f6e3b2 72%,#a88345 90%,#f6e3b2);border-radius:50%;flex:none;width:96px;height:96px;margin:-4px 0 -4px -4px;padding:4px;position:relative;box-shadow:0 0 0 1px #000c,0 0 22px #d4b06a73,0 6px 14px #0009}.house-root .cc-portrait:after{content:\"\";pointer-events:none;border:1px solid #ffffff2e;border-radius:50%;position:absolute;inset:9px;box-shadow:inset 0 0 14px #000000b3}.house-root .cc-portrait img{object-fit:cover;border:2px solid #0a0d14;border-radius:50%;width:100%;height:100%;display:block}.house-root .cc-body{flex:1;min-width:0}.house-root .cc-body h2{font:600 25px/1 var(--f-title);letter-spacing:.1em;color:#f3e6c4;text-shadow:0 0 16px #d4b06a73;white-space:nowrap;margin:0 0 6px}.house-root .cc-lv{font:600 12px/1 var(--f-title);letter-spacing:.16em;color:var(--ink-2);justify-content:space-between;align-items:baseline;gap:8px;display:flex}.house-root .cc-lv b{font:600 15px/1 var(--f-num);color:var(--gold-hi);letter-spacing:.04em;margin-left:3px}.house-root .cc-lv em{font:500 13px/1 var(--f-num);color:var(--ink);letter-spacing:.02em;font-style:normal}.house-root .cc-bar{background:#0009;border:1px solid #d4b06a8c;border-radius:99px;height:8px;margin:7px 0 8px;overflow:hidden}.house-root .cc-bar div{background:linear-gradient(90deg,#8a6a30,#f1dcaa);min-width:4px;height:100%;box-shadow:0 0 10px #f1dcaacc}.house-root .cc-rank{justify-content:space-between;align-items:baseline;gap:8px;display:flex}.house-root .cc-rank span{font:600 10px/1 var(--f-title);letter-spacing:.2em;color:var(--ink-3)}.house-root .cc-rank b{font:600 11.5px/1 var(--f-title);letter-spacing:.03em;color:var(--teal);white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.house-root[data-mode=game] .leftcol .lots{flex:1;min-height:0;padding:0}.house-root[data-mode=game] .lots-head{text-align:left;border-bottom:0;padding:11px 16px 4px}.house-root[data-mode=game] .lots-head h2{font:600 16px/1 var(--f-title);letter-spacing:.16em;color:#f3e6c4}.house-root[data-mode=game] .lots-head p{display:none}.house-root[data-mode=game] .lot-search{width:112px;margin:0;position:absolute;top:9px;right:14px}.house-root[data-mode=game] .lot-search input{font:500 12px var(--f-ui);background:#00000080;border-color:#d4b06a4d;padding:5px 9px}.house-root .hall-tabs{grid-template-columns:repeat(6,minmax(0,1fr));gap:2px;padding:4px 8px 6px;display:grid}.house-root .hall-tabs .ht{min-width:0;color:var(--ink-3);background:0 0;border:1px solid #0000;border-radius:6px;flex-direction:column;align-items:center;gap:3px;padding:5px 0 4px;display:flex}.house-root .hall-tabs .mt{filter:drop-shadow(0 2px 3px #000000b3);opacity:.82;width:38px;height:38px;transition:opacity .2s,filter .2s;display:block}.house-root .hall-tabs .mt img{object-fit:contain;width:100%;height:100%;display:block}.house-root .hall-tabs small{font:500 10.5px/1.12 var(--f-mar);letter-spacing:.01em;text-align:center;min-height:24px;color:var(--ink-2)}.house-root .hall-tabs .ht:hover .mt{opacity:1}.house-root .hall-tabs .ht.on{background:linear-gradient(#d4b06a33,#d4b06a0d);border-color:#f1dcaad9;box-shadow:0 0 14px #d4b06a66,inset 0 0 12px #d4b06a1f}.house-root .hall-tabs .ht.on .mt{opacity:1;filter:drop-shadow(0 0 8px #f1dcaab3)}.house-root .hall-tabs .ht.on small{color:#f3e6c4}.house-root .lot-cols,.house-root[data-mode=game] .lot{grid-template-columns:34px minmax(0,1fr) auto 54px 56px;align-items:center;column-gap:8px;display:grid}.house-root .lot-cols{background:#d4b06a0d;border-top:1px solid #d4b06a40;border-bottom:1px solid #d4b06a40;margin:0 6px;padding:6px 18px 6px 16px}.house-root .lot-cols span{font:600 10px/1 var(--f-ui);letter-spacing:.14em;color:var(--ink-2);text-align:right}.house-root .lot-cols span:first-child{text-align:left;grid-column:1/3}.house-root .lot-cols span:nth-child(2){grid-column:3}.house-root .lot-cols span:nth-child(3){grid-column:4}.house-root .lot-cols span:nth-child(4){text-align:center;grid-column:5}.house-root[data-mode=game] #lotList{padding:2px 6px 8px}.house-root[data-mode=game] .lot{border:1px solid #0000;border-bottom-color:#d4b06a1f;border-radius:0;padding:6px 10px}.house-root[data-mode=game] .lot .em:has(.med){width:34px;height:34px}.house-root[data-mode=game] .lot .nm b{font:400 16px/1.1 var(--f-mar);letter-spacing:.01em;color:#f1ead8}.house-root[data-mode=game] .lot .nm small{font:500 11px/1 var(--f-num);letter-spacing:.08em;color:var(--ink-3)}.house-root[data-mode=game] .lot .px{font:500 16px/1 var(--f-num);color:#fff}.house-root[data-mode=game] .lot .chg{font:500 14px/1 var(--f-num);min-width:54px}.house-root[data-mode=game] .lot .chg.up{color:var(--teal)}.house-root[data-mode=game] .lot .spk svg{width:54px;height:18px}.house-root[data-mode=game] .lot .spk{height:18px}.house-root[data-mode=game] .lot .spk .ln{stroke:var(--teal);stroke-width:1.4px;filter:drop-shadow(0 0 3px #3fd3c899);opacity:1}.house-root[data-mode=game] .lot .spk .end{fill:var(--teal)}.house-root[data-mode=game] .lot .spk.dn .ln{stroke:var(--dn);filter:drop-shadow(0 0 3px #e2875a8c)}.house-root[data-mode=game] .lot .spk.dn .end{fill:var(--dn)}.house-root[data-mode=game] .lot.on{background:linear-gradient(90deg,#3fd3c829,#3fd3c80a);border:1px solid #3fd3c8bf;border-radius:4px;box-shadow:0 0 14px #3fd3c838,inset 0 0 14px #3fd3c814}.house-root[data-mode=game] .hud{display:none}@media (min-width:1180px) and (max-width:1700px){.house-root[data-mode=game] .hall-tabs .mt{width:32px;height:32px}.house-root[data-mode=game] .hall-tabs small{font-size:9.5px}.house-root[data-mode=game] .lot-cols,.house-root[data-mode=game] .lot{grid-template-columns:30px minmax(0,1fr) auto 44px 46px;column-gap:6px}.house-root[data-mode=game] .lot .spk svg{width:46px}.house-root[data-mode=game] .lot .em:has(.med){width:30px;height:30px}.house-root[data-mode=game] .lot .nm b,.house-root[data-mode=game] .lot .px{font-size:14.5px}.house-root[data-mode=game] .lot .chg{min-width:44px;font-size:13px}.house-root[data-mode=game] .lots-head h2{letter-spacing:.16em;font-size:15px}.house-root[data-mode=game] .lot-search{width:100px}.house-root .cc-portrait{width:84px;height:84px}.house-root .cc-body h2{font-size:20px}}.house-root[data-mode=game] .vault{flex:none;height:168px;margin-bottom:4px;padding:10px 12px 8px}.house-root .vault .vt-title{font:600 12px/1 var(--f-title);letter-spacing:.24em;color:var(--gold);margin:0 0 4px}.house-root .vault .shelf{flex:1;grid-template-columns:repeat(5,minmax(0,1fr));align-items:end;min-height:0;display:grid;position:relative}.house-root .vault .shelf:after{content:\"\";background:linear-gradient(90deg,#0000,#d4b06ab3,#0000);height:3px;position:absolute;bottom:26px;left:-4px;right:-4px;box-shadow:0 0 10px #d4b06a80}.house-root .crystal{flex-direction:column;justify-content:flex-end;align-items:center;min-width:0;height:100%;padding-bottom:2px;display:flex;position:relative}.house-root .crystal .gem{height:82px;filter:drop-shadow(0 0 8px var(--glow));transform-origin:50% 85%;margin-bottom:8px;animation:5s ease-in-out infinite house-bob;display:block}.house-root .crystal:nth-child(2) .gem{animation-delay:-1s}.house-root .crystal:nth-child(3) .gem{animation-delay:-2s}.house-root .crystal:nth-child(4) .gem{animation-delay:-3s}.house-root .crystal:nth-child(5) .gem{animation-delay:-4s}.house-root .crystal .gem img{-webkit-user-select:none;user-select:none;width:auto;height:100%;display:block}.house-root .crystal b{font:600 8.5px/1 var(--f-title);letter-spacing:.05em;color:#e8ddc2;white-space:nowrap}.house-root .crystal i{font:600 15px/1 var(--f-num);color:var(--gold-hi);text-shadow:0 0 6px #000000e6;font-style:normal;position:absolute;bottom:36px;right:2%}.house-root .crystal.flare .gem{animation:.95s ease-out house-flare}.house-root .crystal.flare:after{content:\"\";border:2px solid var(--glow);width:70px;height:70px;box-shadow:0 0 18px var(--glow);pointer-events:none;border-radius:50%;margin:-35px 0 0 -35px;animation:.9s ease-out forwards house-ring;position:absolute;top:44%;left:50%}@keyframes house-bob{0%,to{transform:translateY(0)}50%{transform:translateY(-3px)}}@media (prefers-reduced-motion:reduce){.house-root .crystal .gem{animation:none}}@media (min-width:1180px) and (max-width:1700px){.house-root[data-mode=game] .vault{height:150px}.house-root .crystal .gem{height:70px}.house-root .crystal b{letter-spacing:.06em;font-size:8.5px}}.house-root[data-mode=game] .trials{flex-direction:row;align-items:center;gap:18px;height:56px;padding:0 20px}.house-root .tr-head{font:600 11.5px/1.25 var(--f-title);letter-spacing:.2em;color:var(--gold);text-align:left;flex:none}.house-root .tr-list{border-left:1px solid #d4b06a47;flex:1;grid-template-columns:repeat(3,minmax(0,1fr));align-items:center;gap:22px;min-width:0;padding:0 0 0 18px;display:grid}.house-root .trial{grid-template-columns:38px minmax(0,1fr) auto;align-items:center;gap:10px;min-width:0;display:grid}.house-root .trial .emb{width:36px;height:36px;color:var(--gold-hi);background:radial-gradient(circle,#d4b06a33,#06070be6 72%);border:1.5px solid #d4b06ad9;border-radius:50%;place-items:center;display:grid;box-shadow:0 0 12px #d4b06a59,inset 0 0 8px #d4b06a33}.house-root .trial .emb svg{width:20px;height:20px}.house-root .trial .tr-body b{font:500 14.5px/1.1 var(--f-ui);color:#efe9d8;white-space:nowrap;text-overflow:ellipsis;margin-bottom:6px;display:block;overflow:hidden}.house-root .trial .tbar{background:#ffffff1a;border-radius:99px;height:6px;overflow:hidden}.house-root .trial .tbar div{background:linear-gradient(90deg,#8a6a30,#f1dcaa);border-radius:99px;height:100%;box-shadow:0 0 8px #f1dcaab3}.house-root .trial em{font:500 15px/1 var(--f-num);color:var(--ink);font-style:normal}.house-root .trial.done .emb{color:var(--teal);border-color:var(--teal);background:radial-gradient(circle,#3fd3c840,#06070be6 72%);box-shadow:0 0 14px #3fd3c88c}.house-root .trial.done .tbar div{background:linear-gradient(90deg, #1f8f89, var(--teal));box-shadow:0 0 8px #3fd3c8cc}.house-root .tr-rewards{border-left:1px solid #d4b06a47;flex:none;align-items:center;gap:12px;padding-left:18px;display:flex}.house-root .tr-rewards span{font:600 11.5px/1 var(--f-title);letter-spacing:.2em;color:var(--gold)}.house-root .tr-rewards svg{filter:drop-shadow(0 0 8px #d4b06a80);width:50px;height:42px}@media (min-width:1180px) and (max-width:1700px){.house-root[data-mode=game] .trials{gap:12px;padding:0 14px}.house-root .tr-list{gap:12px;padding-left:12px}.house-root .trial{grid-template-columns:32px minmax(0,1fr) auto;gap:8px}.house-root .trial .emb{width:32px;height:32px}.house-root .trial .tr-body b{font-size:13px}.house-root .tr-head,.house-root .tr-rewards span{letter-spacing:.14em;font-size:10px}.house-root .tr-rewards{gap:8px;padding-left:12px}.house-root .tr-rewards svg{width:40px}}.house-root[data-mode=game] .mk-head{border-bottom:1px solid #d4b06a2e;flex-wrap:wrap;gap:14px;padding:10px 16px 8px}.house-root[data-mode=game] .mk-em:has(.med){width:54px;height:54px}.house-root[data-mode=game] .mk-name h1{font:400 26px/1 var(--f-mar);letter-spacing:.02em;color:#f7ecd0;text-shadow:0 0 16px #d4b06a4d;white-space:nowrap}.house-root[data-mode=game] .mk-name .quote{font:400 15px/1 var(--f-mar);color:var(--ink-2);letter-spacing:.02em;text-shadow:none;cursor:help;margin-left:8px}.house-root[data-mode=game] .perp,.house-root[data-mode=game] .mk-name .tk{display:none}.house-root[data-mode=game] .mk-name p{font:600 12px/1 var(--f-num);letter-spacing:.12em;color:var(--ink-2);cursor:help;margin-top:7px;font-style:normal}.house-root[data-mode=game] .mk-price{text-align:left;border-left:1px solid #d4b06a33;margin-left:8px;padding-left:16px}.house-root[data-mode=game] .mk-price b{font:600 36px/1 var(--f-num);color:#fff;letter-spacing:.01em}.house-root[data-mode=game] .mk-price span{font:500 14px/1 var(--f-num);margin-top:5px;display:block}.house-root[data-mode=game] .mk-price span.up{color:var(--teal)}.house-root[data-mode=game] .mk-stats{border-top:0;flex:380px;grid-template-columns:repeat(5,minmax(0,1fr));min-width:0;margin-left:4px;display:grid}.house-root[data-mode=game] .mk-stats div{border-left:1px solid #d4b06a33;padding:4px 12px}.house-root[data-mode=game] .mk-stats div:first-child{border-left:1px solid #d4b06a33}.house-root[data-mode=game] .mk-stats div:nth-child(6){grid-column:auto}.house-root[data-mode=game] .mk-stats span{font:500 11.5px/1 var(--f-ui);letter-spacing:.02em;color:var(--ink-2);white-space:nowrap;margin-bottom:8px}.house-root[data-mode=game] .mk-stats b{font:500 17px/1 var(--f-num);color:#f2f2f2}.house-root[data-mode=game] .mk-stats b u{text-decoration:none}.house-root[data-mode=game] .mk-stats b .up{color:var(--teal)}.house-root[data-mode=game] .mk-stats small{font:500 11px/1 var(--f-num);color:var(--ink-3)}@media (min-width:1180px) and (max-width:1700px){.house-root[data-mode=game] .mk-stats{flex-basis:100%;order:5;margin:0}.house-root[data-mode=game] .mk-stats div:first-child{border-left:0;padding-left:0}.house-root[data-mode=game] .mk-name h1{font-size:22px}.house-root[data-mode=game] .mk-price b{font-size:30px}}.house-root[data-mode=game] .chart-bar{gap:6px;padding:8px 12px 4px}.house-root[data-mode=game] #intervals button{font:500 13px/1 var(--f-ui);color:var(--ink-2);border-radius:3px;padding:6px 10px}.house-root[data-mode=game] #intervals button.on{color:#fff;border-color:var(--teal);background:#3fd3c81a;box-shadow:0 0 10px #3fd3c84d}.house-root[data-mode=game] .hc-chips button.on{color:var(--teal)}.house-root[data-mode=game] .conn{font:600 10px/1 var(--f-ui);letter-spacing:.16em}.house-root[data-mode=game] .book{padding:12px 12px 8px}.house-root[data-mode=game] .book .ptitle{font:600 11.5px/1 var(--f-title);letter-spacing:.18em;color:#e9dfc4;margin-bottom:8px}.house-root[data-mode=game] .book .ptitle svg{display:none}.house-root[data-mode=game] .book-tools{padding:0;position:absolute;top:8px;right:10px}.house-root[data-mode=game] .book-tools select{font:600 11.5px/1 var(--f-ui);padding:3px 4px}.house-root[data-mode=game] .book-head,.house-root[data-mode=game] .lv{grid-template-columns:1.15fr 1fr 1fr;column-gap:4px;display:grid}.house-root[data-mode=game] .book-head{font:500 10.5px/1 var(--f-ui);letter-spacing:.04em;color:var(--ink-2);padding:4px 4px 6px}.house-root[data-mode=game] .book-head span:not(:first-child),.house-root[data-mode=game] .lv span:not(:first-of-type){text-align:right}.house-root[data-mode=game] .lv{font:500 13px/1 var(--f-num);padding:3px 4px}.house-root[data-mode=game] .lv span:not(:first-of-type){color:#e4e6ee}.house-root[data-mode=game] .lv.ask i{opacity:.2;background:#e2875ae6}.house-root[data-mode=game] .lv.bid i{background:var(--teal);opacity:.2}.house-root[data-mode=game] .lv.bid span:first-of-type{color:var(--teal)}.house-root[data-mode=game] #spread{text-align:left;border-color:#d4b06a40;margin:5px 0;padding:8px 2px 7px}.house-root[data-mode=game] #spread b{font:600 25px/1 var(--f-num);color:#fff;letter-spacing:.01em;margin:0;display:inline}.house-root[data-mode=game] #spread em{font:500 14px/1 var(--f-num);margin-left:8px;font-style:normal}.house-root[data-mode=game] #spread em.up{color:var(--teal)}.house-root[data-mode=game] #spread small{font:500 10px/1 var(--f-ui);letter-spacing:.06em;color:var(--ink-3);margin-top:5px;display:block}.house-root[data-mode=game] .ticket{padding:12px 12px 10px}.house-root[data-mode=game] .ticket>.ptitle{display:none}.house-root[data-mode=game] .ticket .tk-body{gap:8px}.house-root[data-mode=game] .side-toggle{border:0;gap:8px;overflow:visible}.house-root[data-mode=game] .side-toggle button{font:600 15px/1 var(--f-ui);letter-spacing:.1em;color:var(--ink-2);background:#0000004d;border:1px solid #fff3;border-radius:4px;padding:11px 6px}.house-root[data-mode=game] .side-toggle #long.on{color:#fff;border-color:var(--teal);background:#3fd3c824;box-shadow:0 0 14px #3fd3c84d,inset 0 0 12px #3fd3c81f}.house-root[data-mode=game] .side-toggle #short.on{color:#fff;border-color:var(--dn);background:#e2875a26;box-shadow:0 0 14px #e2875a4d,inset 0 0 12px #e2875a1a}.house-root[data-mode=game] .otype{background:#0000004d;border:0;border-radius:5px;gap:4px;padding:3px;overflow:visible}.house-root[data-mode=game] .otype button{font:600 12px/1 var(--f-ui);letter-spacing:.08em;border:1px solid #0000;border-radius:3px;padding:8px 2px}.house-root[data-mode=game] .otype button.on{color:#fff;border-color:var(--teal);background:#3fd3c81a;box-shadow:0 0 10px #3fd3c840}.house-root[data-mode=game] .field>span{font:500 14px/1 var(--f-ui);letter-spacing:0;color:#d9dbe3;text-transform:none}.house-root[data-mode=game] .field.sizef{background:#0000004d;border:1px solid #fff3;border-radius:5px;grid-template-columns:auto 1fr auto;gap:8px;height:40px;padding:0 10px 0 12px}.house-root[data-mode=game] .field.sizef input{box-shadow:none;text-align:right;font:600 18px/1 var(--f-num);background:0 0;border:0;height:100%;padding:0}.house-root[data-mode=game] .sz-unit{font:600 12px/1 var(--f-ui);letter-spacing:.08em;color:var(--ink-2);border:1px solid #ffffff2e;border-radius:3px;padding:5px 7px;text-decoration:none}.house-root[data-mode=game] .sz-eq{text-align:right;font:500 12.5px/1 var(--f-num);color:var(--ink-3);min-height:12px;margin:-3px 2px 0}.house-root[data-mode=game] .pct-row{padding:0 2px}.house-root .pct-row .ticks{font:500 10.5px/1 var(--f-num);color:var(--ink-3);justify-content:space-between;margin-top:2px;display:flex}.house-root .pct-row .ticks i{font-style:normal}.house-root[data-mode=game] .lev-row{grid-template-columns:auto 1fr 58px;gap:10px}.house-root[data-mode=game] .lev-row>span{font:500 14px/1 var(--f-ui);letter-spacing:0;color:#d9dbe3}.house-root[data-mode=game] .levn input{background:#0000004d;border-color:#ffffff38;width:52px}.house-root[data-mode=game] input[type=range]{appearance:none;--p:0%;background:0 0;height:16px;margin:0;padding:0}.house-root[data-mode=game] input[type=range]::-webkit-slider-runnable-track{background:linear-gradient(90deg, #d4b06a var(--p), #ffffff29 var(--p));border-radius:4px;height:4px}.house-root[data-mode=game] input[type=range]::-moz-range-track{background:#ffffff29;border-radius:4px;height:4px}.house-root[data-mode=game] input[type=range]::-moz-range-progress{background:#d4b06a;border-radius:4px;height:4px}.house-root[data-mode=game] input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;background:radial-gradient(circle at 40% 35%,#fff3cc,#d4b06a 60%,#8a6a30);border:1px solid #1a1408;border-radius:50%;width:14px;height:14px;margin-top:-5px;box-shadow:0 0 10px #f1dcaabf}.house-root[data-mode=game] input[type=range]::-moz-range-thumb{background:#d4b06a;border:1px solid #1a1408;border-radius:50%;width:12px;height:12px;box-shadow:0 0 10px #f1dcaabf}.house-root[data-mode=game] .pair{grid-template-columns:1fr;gap:6px}.house-root[data-mode=game] .field.v,.house-root[data-mode=game] .field.price{background:#0000004d;border:1px solid #fff3;border-radius:5px;justify-content:space-between;align-items:center;gap:8px;height:40px;padding:0 12px;display:flex}.house-root[data-mode=game] .field.price[hidden]{display:none}.house-root[data-mode=game] .field.v input{width:55%;box-shadow:none;text-align:right;font:600 17px/1 var(--f-num);background:0 0;border:0;height:100%;padding:0}.house-root[data-mode=game] .field.price .pxbox{flex:1;grid-template-columns:minmax(0,1fr) auto auto}.house-root[data-mode=game] .field.price .pxbox input{text-align:right;font:600 17px/1 var(--f-num);background:0 0;border:0;padding:0}.house-root[data-mode=game] .field.v.stop{border-color:#e2875ae6;box-shadow:0 0 10px #e2875a33,inset 0 0 8px #e2875a0f}.house-root[data-mode=game] .field.v.target{border-color:#3fd3c8d9;box-shadow:0 0 10px #3fd3c833,inset 0 0 8px #3fd3c80f}.house-root[data-mode=game] .field.v:focus-within,.house-root[data-mode=game] .field.sizef:focus-within{box-shadow:0 0 0 2px #d4b06a40}.house-root[data-mode=game] .field.risk{grid-template-columns:auto 1fr}.house-root[data-mode=game] .field.risk .pxbox2{grid-template-columns:56px 1fr}.house-root[data-mode=game] .ro-row #checks{display:none}.house-root[data-mode=game] .ro-row{justify-content:flex-start}.house-root[data-mode=game] .ro{font:500 13px/1 var(--f-ui);letter-spacing:.01em;color:#d9dbe3;background:0 0;border:0;gap:9px;padding:4px 0}.house-root[data-mode=game] .ro:before{content:\"\";background:#00000059;border:1px solid #ffffff73;border-radius:2px;flex:none;order:-1;width:15px;height:15px}.house-root[data-mode=game] .ro.on:before{border-color:var(--teal);background:var(--teal);box-shadow:0 0 8px #3fd3c899}.house-root[data-mode=game] .ro.on{color:#fff;background:0 0;border:0}.house-root[data-mode=game] .ro svg{display:none}.house-root[data-mode=game] .preview{font:500 13px/1.2 var(--f-num);grid-template-columns:1fr;gap:3px;margin-top:auto;padding:4px 2px 0;display:grid}.house-root[data-mode=game] .preview [data-k=margin],.house-root[data-mode=game] .preview [data-k=eq]{display:none}.house-root[data-mode=game] .preview div{gap:6px}.house-root[data-mode=game] .preview span{font:500 12.5px/1.2 var(--f-ui);color:var(--ink-2)}.house-root[data-mode=game] .preview b{color:#e8e8ee;font-weight:500}.house-root[data-mode=game] .place{font:700 14px/1 var(--f-title);letter-spacing:.16em;border-color:#f1dcaa;border-radius:3px;margin-top:0;padding:14px 8px}.house-root[data-mode=game] .place.short{background:linear-gradient(#f5c9a8,#e2875a 55%,#a85a35);border-color:#f5c9a8;box-shadow:0 0 22px #e2875a59,inset 0 1px #ffffff80}.house-root[data-mode=game] .desk{padding:8px 12px 10px}.house-root[data-mode=game] .desk-tabs{border-bottom:1px solid #d4b06a2e;gap:6px;margin-bottom:8px;padding-bottom:8px}.house-root[data-mode=game] .desk-tabs button[data-desk]{font:600 12px/1 var(--f-ui);letter-spacing:.1em;color:var(--ink-2);border:1px solid #0000;border-radius:3px;padding:8px 14px}.house-root[data-mode=game] .desk-tabs button[data-desk=fills]{order:3}.house-root[data-mode=game] .desk-tabs button[data-desk=history]{order:4}.house-root[data-mode=game] .desk-tabs .spacer{order:5}.house-root[data-mode=game] .desk-tabs #acct{order:6}.house-root[data-mode=game] .desk-tabs #reset{order:7}.house-root[data-mode=game] .desk-tabs button[data-desk].on{color:#fff;border-color:var(--teal);box-shadow:0 0 12px #3fd3c847, inset 0 -2px 0 var(--teal);background:#3fd3c81a}.house-root[data-mode=game] .desk-tabs button b{font:600 12px/1 var(--f-ui);color:inherit;background:0 0;margin-left:5px;padding:0}.house-root[data-mode=game] .desk-tabs button b:before{content:\"(\"}.house-root[data-mode=game] .desk-tabs button b:after{content:\")\"}.house-root[data-mode=game] .desk-tabs #acct{font:500 12px/1 var(--f-num)}.house-root[data-mode=game] .desk th{font:600 10.5px/1 var(--f-ui);letter-spacing:.08em;color:var(--ink-2)}.house-root[data-mode=game] .desk td{font-size:13px}.house-root[data-mode=game] .desk td.long{color:var(--teal)}@media (min-width:1180px) and (max-width:1700px){.house-root[data-mode=game] .desk-tabs button[data-desk]{letter-spacing:.06em;padding:7px 9px;font-size:11px}.house-root[data-mode=game] .desk-tabs #acct{display:none}}.house-root[data-mode=game] .signal{gap:4px;padding:8px 14px}.house-root[data-mode=game] .signal .gauntlet{display:none}.house-root[data-mode=game] .ora{flex:none;align-items:center;height:100px;overflow:visible}.house-root[data-mode=game] .ora-orb{width:200px;height:150px;margin:-24px 0 -24px -30px}.house-root[data-mode=game] .ora-say small{font:600 18px/1 var(--f-title);letter-spacing:.2em;color:#e8f4ff;text-shadow:0 0 14px #9fdcff80;margin-bottom:4px}.house-root[data-mode=game] .ora-say small em{font:500 10px/1 var(--f-ui);letter-spacing:.24em;color:var(--ora);margin-top:5px;font-style:normal;display:block}.house-root[data-mode=game] .ora-say q{font:italic 500 19px/1.2 var(--f-voice);color:var(--ora-hi)}.house-root .contract{border-top:1px solid #d4b06a40;padding:6px 0 0}.house-root .contract .ct-title{text-align:center;font:600 11px/1 var(--f-title);letter-spacing:.28em;color:var(--gold);margin:0 0 6px}.house-root .contract .seals{justify-content:center;gap:34px;display:flex}.house-root .seal{align-items:center;gap:10px;display:flex}.house-root .seal b{font:500 12.5px/1.15 var(--f-ui);color:#d9d5c6;text-align:left}.house-root .seal .disc{color:#7e6a42;background:radial-gradient(circle at 50% 38%,#18233a,#090c14 72%);border:2px solid #9c7a3e;border-radius:50%;flex:none;width:44px;height:44px;transition:border-color .4s,box-shadow .4s,color .4s;position:relative;box-shadow:inset 0 0 0 2px #0a0d15,inset 0 0 0 3px #f1dcaa4d,0 0 8px #d4b06a33}.house-root .seal .disc svg{width:24px;height:24px;transition:opacity .35s;position:absolute;inset:10px}.house-root .seal .g-ok,.house-root .seal .g-bad{opacity:0}.house-root .seal[data-state=ok] .disc{color:var(--teal);border-color:var(--teal);box-shadow:inset 0 0 0 2px #0a0d15,inset 0 0 12px #3fd3c859,0 0 16px #3fd3c899}.house-root .seal[data-state=ok] .g-glyph{opacity:0}.house-root .seal[data-state=ok] .g-ok{opacity:1}.house-root .seal[data-state=broken] .disc{color:var(--dn);border-color:#b4653b;box-shadow:inset 0 0 0 2px #0a0d15,inset 0 0 10px #e2875a40,0 0 12px #e2875a66}.house-root .seal[data-state=broken] .g-glyph{opacity:0}.house-root .seal[data-state=broken] .g-bad{opacity:1}.house-root .seal[data-state=ok] b{color:#fff}@media (min-width:1180px) and (max-width:1700px){.house-root[data-mode=game] .cc-rank span{display:none}.house-root[data-mode=game] .ora-orb{width:140px;margin:-16px 0 -16px -20px}.house-root[data-mode=game] .ora-say q{font-size:17px}.house-root .contract .seals{gap:16px}.house-root .seal b{font-size:11.5px}.house-root .seal .disc{width:38px;height:38px}.house-root .seal .disc svg{inset:7px}}.house-root[data-mode=game] footer{background:linear-gradient(#0000,#0000008c);height:26px;font-size:10px}@media (max-width:1179px){.house-root[data-mode=game] .floor{grid-template-rows:none;grid-template-columns:minmax(0,1fr);grid-template-areas:\"trials\"\"market\"\"ticket\"\"signal\"\"desk\"\"book\"\"left\";height:auto;min-height:0;margin-top:18px}.house-root[data-mode=game] .trials{flex-wrap:wrap;grid-area:trials;height:auto;padding:12px 14px}.house-root[data-mode=game] .tr-list{border-left:0;grid-template-columns:1fr;padding-left:0}.house-root[data-mode=game] .leftcol{flex-direction:column;grid-area:left;gap:16px;display:flex}.house-root[data-mode=game] .leftcol .lots{max-height:calc(var(--vh,1vh) * 70)}.house-root[data-mode=game] .market{min-height:520px}.house-root[data-mode=game] .mk-stats{flex-basis:100%;margin:0}.house-root[data-mode=game] .signal{min-height:220px}}.house-root[data-mode=game] .field.v.stop,.house-root[data-mode=game] .field.v.target{box-shadow:none;border-color:#fff3}.house-root[data-mode=game] .field.v.stop[data-state=ok]{border-color:#3fd3c8d9;box-shadow:0 0 10px #3fd3c833,inset 0 0 8px #3fd3c80f}.house-root[data-mode=game] .field.v.stop[data-state=broken],.house-root[data-mode=game] .field.sizef[data-state=broken]{border-color:#e2875a;box-shadow:0 0 12px #e2875a61,inset 0 0 9px #e2875a1f}.house-root[data-mode=game] .field.v.stop input::placeholder{color:#e2875a80}.house-root .field.risk input[readonly]{opacity:.8;cursor:default;pointer-events:none}.house-root[data-mode=game] .field.risk{opacity:.95}.house-root .riskbox[hidden],.house-root .gate[hidden],.house-root .place[hidden]{display:none}.house-root[data-mode=game] .riskbox{background:#00000047;border:1px solid #d4b06a61;border-radius:5px;gap:3px;margin-top:auto;padding:7px 10px;display:grid}.house-root[data-mode=game] .riskbox div{justify-content:space-between;align-items:baseline;gap:8px;display:flex}.house-root[data-mode=game] .riskbox span{font:500 12px/1.15 var(--f-ui);color:var(--ink-2);white-space:nowrap;align-items:center;gap:6px;display:flex}.house-root[data-mode=game] .riskbox b{font:600 13px/1.1 var(--f-num);color:#e8e8ee;letter-spacing:.01em;white-space:nowrap}.house-root[data-mode=game] .riskbox .bad b{color:var(--dn)}.house-root[data-mode=game] .riskbox .bad span{color:#efc2a6}.house-root[data-mode=game] .riskbox.warm{background:linear-gradient(#e2875a1f,#00000042);border-color:#e2875ae6;box-shadow:0 0 16px #e2875a38,inset 0 0 12px #e2875a14}.house-root[data-mode=game] .riskbox.warm div:first-child span:before,.house-root[data-mode=game] .riskbox.warm div:last-child span:before{content:\"\";background:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23e2875a' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 3.5 2.8 19.5h18.4z'/%3E%3Cpath d='M12 10v4.5M12 17.2v.1'/%3E%3C/svg%3E\") 50%/contain no-repeat;flex:none;width:13px;height:13px}.house-root[data-mode=game] .riskbox.warm div:nth-child(2) span:before{display:none}.house-root[data-mode=game] .riskbox.warm div:nth-child(2) span{padding-left:19px}.house-root[data-mode=game] .sz-eq{min-height:0;margin-top:-4px}.house-root[data-mode=game] .riskbox:not(.warm) .bad span:before,.house-root[data-mode=advanced] .riskbox{display:none}.house-root[data-mode=game] .tk-body>.preview{order:3;margin-top:0}.house-root[data-mode=game] .tk-body>.place,.house-root[data-mode=game] .tk-body>.gate{order:2;margin-top:0}.house-root[data-mode=game] .preview [data-k=risk]{display:none}.house-root[data-mode=game] .tk-body>.riskbox~.preview{margin-top:0}.house-root[data-mode=game] .tk-body>.riskbox[hidden]~.place,.house-root[data-mode=game] .tk-body>.riskbox[hidden]~.gate{margin-top:auto}.house-root .gate{gap:6px;display:grid}.house-root[data-mode=game] .ticket .tk-body{gap:6px}.house-root .gate .fix{text-transform:none;font:700 16px/1 var(--f-title);letter-spacing:.05em;margin:0;padding:12px 8px}.house-root .gate .fix[hidden]{display:none}.house-root[data-mode=game] .gate .fix{color:#1a1408;background:linear-gradient(#f1dcaa,#d4b06a 55%,#9c7a3e);border-color:#f1dcaa;box-shadow:0 0 22px #d4b06a59,inset 0 1px #ffffff8c}.house-root .gate .take{cursor:pointer;color:#f0c7aa;font:600 15px/1 var(--f-ui);letter-spacing:.02em;background:#e2875a0f;border:1px solid #e2875ad9;border-radius:3px;padding:10px 8px;transition:background .2s,box-shadow .2s;box-shadow:inset 0 0 12px #e2875a1a}.house-root .gate .take:hover{background:#e2875a2b;box-shadow:0 0 14px #e2875a4d,inset 0 0 12px #e2875a1f}.house-root[data-mode=game] .ora .ora-orb canvas{transition:filter 1s,opacity 1s}.house-root[data-mode=game] .ora.gated .ora-orb canvas{filter:sepia(.6)saturate(1.5)hue-rotate(-32deg)brightness(.72);opacity:.82}.house-root[data-mode=game] .ora.gated .ora-say q{color:#f3d9c5;text-shadow:0 0 12px #e2875a61}.house-root[data-mode=game] .ora.gated .ora-say small{color:#eab99a}.house-root[data-mode=game] .ora .ora-say q{transition:color 1s}.house-root .tr-rewards svg{overflow:visible}.house-root .tr-rewards svg path:first-of-type{transform-box:view-box;transition:transform .8s cubic-bezier(.3,1.4,.5,1)}.house-root .tr-rewards.open svg{filter:drop-shadow(0 0 12px #f1dcaad9)drop-shadow(0 -6px 18px #3fd3c880)}.house-root .tr-rewards.open svg path:first-of-type{transform-origin:5px 17px;transform:translate(-7px,-9px)rotate(-34deg)}.house-root .tr-rewards.open span{color:var(--teal);text-shadow:0 0 10px #3fd3c899}.house-root #fx .shard.trail{box-shadow:0 0 5px 1px var(--c);filter:blur(.4px);opacity:0}.house-root #fx .burst{background:radial-gradient(circle, #fff 0, var(--c) 35%, transparent 70%);border-radius:50%;width:30px;height:30px;margin:-15px 0 0 -15px;animation:.7s ease-out forwards house-burst;position:absolute}@keyframes house-burst{0%{opacity:.95;transform:scale(.3)}to{opacity:0;transform:scale(3.2)}}.house-root #fx .landed{width:0;height:0;position:absolute}.house-root #fx .landed img{--glow:var(--c);width:auto;height:84px;animation:1.1s ease-out forwards house-landed;position:absolute;top:0;left:0;transform:translate(-50%,-50%)}@keyframes house-landed{0%{filter:drop-shadow(0 0 8px var(--c)) brightness(1);opacity:1;transform:translate(-50%,-50%)scale(1)}22%{filter:drop-shadow(0 0 22px var(--c)) drop-shadow(0 0 46px var(--c)) brightness(2.1);opacity:1;transform:translate(-50%,-50%)scale(1.5)}to{filter:drop-shadow(0 0 10px var(--c)) brightness(1.1);opacity:0;transform:translate(-50%,-50%)scale(1.05)}}.house-root #fx .landed .ring{border:2px solid var(--c);width:90px;height:90px;box-shadow:0 0 18px var(--c);border-radius:50%;margin:-45px 0 0 -45px;animation:.9s ease-out forwards house-ring;position:absolute;top:0;left:0}.house-root #fx .landed .ring.r2{opacity:0;animation-delay:.22s;animation-fill-mode:both}.house-root #fx .plus1{font-size:40px;font-weight:700}.house-root #debrief{-webkit-backdrop-filter:blur(1.5px);backdrop-filter:blur(1.5px);background:#0305099e}.house-root .dcard{--ink:#2a1d10;--ink-soft:#6b5434;--navy:#1b2748;--brass:#b8924d;width:880px;transform:scale(var(--ds,1));transform-origin:50%;color:var(--ink);filter:drop-shadow(0 30px 60px #000000b3)drop-shadow(0 0 40px #d4b06a2e);flex:none;animation:.55s cubic-bezier(.2,.9,.3,1.15) house-card-in;position:relative}.house-root .dcard:after{content:\"\";pointer-events:none;z-index:3;border:50px solid #0000;border-image:var(--frame) 118 / 50px stretch;position:absolute;inset:-14px}.house-root .dcard .d-compass{z-index:4;color:#f1dcaa;background:radial-gradient(circle at 50% 35%,#223a68,#0b1226 70%);border:3px solid #c9a35a;border-radius:50%;place-items:center;width:64px;height:64px;margin-left:-32px;display:grid;position:absolute;top:-30px;left:50%;box-shadow:0 0 0 2px #3a2a10,0 0 22px #f1dcaa8c,inset 0 0 14px #3f78be8c}.house-root .dcard .d-compass svg{width:34px;height:34px}.house-root .dcard .d-sheet{z-index:1;text-align:center;background:radial-gradient(130% 70% at 50% -8%,#fff7dabf,#0000 62%),radial-gradient(90% 60% at 102% 104%,#6e481857,#0000 70%),radial-gradient(70% 50% at -4% 98%,#6e48183d,#0000 70%),url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .34 0 0 0 0 .22 0 0 0 0 .08 0 0 0 .26 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\"),linear-gradient(#ecdcb0,#dcc693 52%,#cdb078);border-radius:4px;padding:52px 62px 50px;position:relative;box-shadow:inset 0 0 60px #78541e73,inset 0 0 0 2px #78541e40}.house-root .dcard .d-title{font:700 64px/1 var(--f-title);letter-spacing:.12em;color:var(--navy);text-shadow:0 1px #fff6d7b3,0 -1px #00000040;margin:0}.house-root .dcard .d-lot{font:600 25px/1.1 var(--f-title);letter-spacing:.02em;color:#1f2a46;margin-top:8px}.house-root .dcard .d-pnl{font:italic 500 19px/1.2 var(--f-voice);color:var(--ink-soft);margin-top:4px}.house-root .dcard .d-top{border-top:1.5px solid #6e4e1e73;grid-template-columns:1.05fr .85fr 1.1fr;align-items:stretch;margin-top:20px;padding:14px 0 12px;display:grid}.house-root .dcard .d-top.two{grid-template-columns:1.1fr 1.1fr}.house-root .dcard .d-top>*{flex-direction:column;align-items:center;min-width:0;padding:0 14px;display:flex}.house-root .dcard .d-top>*+*{border-left:1.5px solid #6e4e1e59}.house-root .dcard small{font:600 16px/1 var(--f-title);letter-spacing:.13em;color:#3a2e1c}.house-root .dcard .d-grade .letter{font:700 152px/1.05 var(--f-title);letter-spacing:0;background:var(--crack,none), linear-gradient(180deg, #fff1c8 0%, #e6c273 38%, #a67c34 70%, #5b3f14 100%);color:#0000;-webkit-text-fill-color:transparent;filter:drop-shadow(0 2px #3b2509)drop-shadow(0 0 16px #d4b06a8c);-webkit-background-clip:text;background-clip:text;margin-top:4px;display:block}.house-root .dcard.ember .d-grade .letter{background:var(--crack), linear-gradient(180deg, #ffd0a2 0%, #f08a52 34%, #c4531e 66%, #5d1f09 100%);filter:drop-shadow(0 2px #3a1306)drop-shadow(0 0 18px #e2875abf);-webkit-background-clip:text;background-clip:text}.house-root .dcard.brass .d-grade .letter{filter:drop-shadow(0 2px #3b2509)drop-shadow(0 0 10px #d4b06a59)}.house-root .dcard{--crack:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 160' preserveAspectRatio='none'%3E%3Cg fill='none' stroke='%23200a02' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' opacity='.85'%3E%3Cpath d='M18 8l10 24-8 12 12 18-6 16 10 20M62 6l-6 22 10 14-8 16 6 22M92 30l-10 18 8 14-12 20 4 24M30 96l16-6 10 12 18-8M6 70l14 6 6-12M104 100l-14 10 6 16'/%3E%3C/g%3E%3C/svg%3E\") center / 100% 100% no-repeat}.house-root .dcard.gold .d-grade .letter,.house-root .dcard.brass .d-grade .letter{background:linear-gradient(#fff1c8 0%,#e6c273 38%,#a67c34 70%,#5b3f14 100%);-webkit-background-clip:text;background-clip:text}.house-root .dcard .d-grade .light{font:700 29px/1 var(--f-title);letter-spacing:.03em;color:#7a4a14;margin-top:2px}.house-root .dcard.ember .d-grade .light{color:#a34a1f}.house-root .dcard.gold .d-grade .light{color:#7c5a10}.house-root .dcard .d-element{gap:5px}.house-root .dcard .d-element .crystal-art{background:radial-gradient(circle at 50% 40%,#162447,#080d1c 78%);border:2px solid #8a6a30;border-radius:3px;place-items:center;width:138px;height:152px;margin:8px 0 4px;display:grid;box-shadow:inset 0 0 18px #000c,0 0 0 1px #2a1d0c}.house-root .dcard .d-element .crystal-art img{filter:drop-shadow(0 0 12px #f1dcaacc);width:auto;height:130px}.house-root .dcard .d-element .crystal-art svg{width:auto;height:96px}.house-root .dcard .d-element b{font:700 18px/1.1 var(--f-ui);color:#26201a}.house-root .dcard .d-element i{font:italic 500 16px/1.1 var(--f-voice);color:var(--ink-soft)}.house-root .dcard .d-element.minted b{color:#7c5a10}.house-root .dcard .d-ora{justify-content:flex-start;position:relative}.house-root .dcard .d-ora .orb{background:radial-gradient(closest-side,#070c1ef5 48%,#070c1e8c 72%,#0000 100%);border-radius:50%;width:270px;height:190px;margin:-10px -20px -22px;position:relative}.house-root .dcard .d-ora small{letter-spacing:.2em;color:#243a68;font-size:18px}.house-root .dcard .d-ora q{quotes:\"“\" \"”\";font:italic 600 22px/1.2 var(--f-voice);color:#1f2a46;margin-top:8px}.house-root .dcard .d-mid{border-top:1.5px solid #6e4e1e73;border-bottom:1.5px solid #6e4e1e73;grid-template-columns:1.05fr 1fr;gap:0;margin-top:4px;display:grid}.house-root .dcard .d-mid section{padding:12px 14px 14px}.house-root .dcard .d-mid section+section{border-left:1.5px solid #6e4e1e59}.house-root .dcard h4{font:600 17px/1 var(--f-title);letter-spacing:.16em;color:#3a2e1c;align-items:center;gap:12px;margin:0 0 10px;display:flex}.house-root .dcard h4 i{background:linear-gradient(90deg,#0000,#6e4e1e99);flex:1;height:1px}.house-root .dcard h4 i:last-child{background:linear-gradient(270deg,#0000,#6e4e1e99)}.house-root .dcard .vrow,.house-root .dcard .mrow{justify-content:center;gap:12px;display:flex}.house-root .dcard .vseal,.house-root .dcard .mcoin{flex-direction:column;flex:1;align-items:center;gap:6px;min-width:0;display:flex}.house-root .dcard .vseal+.vseal{border-left:1.5px solid #6e4e1e4d}.house-root .dcard .vseal b,.house-root .dcard .mcoin b{font:600 17px/1 var(--f-title);letter-spacing:.12em;color:#3a2e1c}.house-root .dcard .mcoin b{letter-spacing:.08em;font-size:14px}.house-root .dcard .vseal i{font:500 16px/1.1 var(--f-ui);color:#2c2418;font-style:normal}.house-root .dcard .coin{color:#3b2709;background:radial-gradient(circle at 36% 28%,#f6e3b0,#d0a34f 50%,#7d5a22 100%);border-radius:50%;place-items:center;width:82px;height:82px;display:grid;position:relative;box-shadow:0 0 0 3px #3a290f,0 0 0 5px #c9a35a,0 4px 10px #00000080,inset 0 0 0 4px #fff4cd80,inset 0 -6px 12px #50320a8c}.house-root .dcard .coin svg{filter:drop-shadow(0 1px #fff4cd99);width:44px;height:44px}.house-root .dcard .coin .crack{color:#200a02;place-items:center;display:grid;position:absolute;inset:0}.house-root .dcard .coin .crack svg{opacity:.85;width:66px;height:66px}.house-root .dcard .vseal.bad .coin,.house-root .dcard .mcoin.bad .coin{color:#2a0c03;background:radial-gradient(circle at 36% 28%,#ffb88a,#d4642c 52%,#5d1f09 100%);box-shadow:0 0 0 3px #3a1608,0 0 0 5px #b4653b,0 0 18px #e2875abf,inset 0 0 0 4px #ffc8a059,inset 0 -6px 12px #3c0e0299}.house-root .dcard .mrow{flex-wrap:wrap;row-gap:10px}.house-root .dcard .mcoin{flex:0 31%}.house-root .dcard .mcoin .coin{width:74px;height:74px}.house-root .dcard .mrow .none{font:italic 500 19px/1 var(--f-voice);color:var(--ink-soft);margin:18px 0}.house-root .dcard .d-chart{text-align:left;margin-top:14px}.house-root .dcard .d-chart h4{letter-spacing:.12em;color:#3a2e1c;margin:0 0 6px 2px;font-size:15px}.house-root .dcard .d-chart .cwrap{background:#0a1020;border:2px solid #5b4420;border-radius:3px;height:196px;overflow:hidden;box-shadow:0 0 0 1px #fff4cd80,inset 0 0 14px #000c}.house-root .dcard .d-chart canvas{display:block}.house-root .dcard .d-actions{justify-content:center;gap:22px;margin-top:18px;display:flex}.house-root .dcard .d-actions button{cursor:pointer;width:300px;font:700 21px/1 var(--f-title);letter-spacing:.06em;border-radius:4px;padding:17px 8px;transition:filter .2s,box-shadow .2s}.house-root .dcard .d-gold{color:#1a1408;background:linear-gradient(#f6e3b0,#d4b06a 52%,#9c7a3e);border:1.5px solid #f6e3b0;box-shadow:0 0 0 2px #4a3414,0 6px 14px #00000073,inset 0 1px #ffffffb3}.house-root .dcard .d-gold:hover{filter:brightness(1.08);box-shadow:0 0 0 2px #4a3414,0 0 22px #f1dcaa99,inset 0 1px #ffffffb3}.house-root .dcard .d-quiet{color:#e9dfc4;background:linear-gradient(#13203c,#0a1226);border:1.5px solid #b8924d;box-shadow:0 0 0 2px #2a1d0c,0 6px 14px #00000073,inset 0 0 14px #3f78be26}.house-root .dcard .d-quiet:hover{filter:brightness(1.18)}.house-root .dcard.compact{text-align:left;filter:none;color:#e8e8ec;background:#0f1014;border:1px solid #23252d;border-radius:8px;width:min(420px,92vw);padding:22px 24px 18px;animation:none;transform:none}.house-root .dcard.compact:after{display:none}.house-root .dcard.compact .d-kicker{font:600 11px/1 var(--f-title);letter-spacing:.08em;color:#a2a3ad}.house-root .dcard.compact .d-cgrade{align-items:baseline;gap:14px;margin:10px 0 2px;display:flex}.house-root .dcard.compact .d-cgrade b{font:700 54px/1 var(--f-num);color:#d5d7e0}.house-root .dcard.compact.ember .d-cgrade b,.house-root .dcard.compact.grade-D .d-cgrade b,.house-root .dcard.compact.grade-F .d-cgrade b{color:#ef8a62}.house-root .dcard.compact .d-cgrade span{font:600 18px/1 var(--f-num);color:#a2a3ad}.house-root .dcard.compact .d-cpnl{font:500 12px/1.3 var(--f-num);color:#8b8c96;margin-bottom:10px}.house-root .dcard.compact .d-clist{font:500 13px/1.3 var(--f-ui);gap:4px;margin:0 0 10px;padding:0;list-style:none;display:grid}.house-root .dcard.compact .d-clist i{width:18px;font-style:normal;display:inline-block}.house-root .dcard.compact .d-clist .ok i{color:#4fd1a1}.house-root .dcard.compact .d-clist .bad i{color:#ef8a62}.house-root .dcard.compact .d-cmedals{flex-wrap:wrap;gap:6px;margin-bottom:10px;display:flex}.house-root .dcard.compact .d-cmedals span{font:600 10.5px/1 var(--f-ui);letter-spacing:.06em;color:#c8cad6;border:1px solid #3a3d48;border-radius:99px;padding:3px 8px}.house-root .dcard.compact .d-cmedals .bad{color:#ef8a62;border-color:#5a3a2c}.house-root .dcard.compact .d-cline{font:400 13px/1.35 var(--f-ui);color:#a2a3ad;margin-bottom:14px}.house-root .dcard.compact .d-actions{margin:0}.house-root .dcard.compact .d-actions button{width:100%;font:600 12px/1 var(--f-ui);letter-spacing:.1em;text-transform:uppercase;color:#0b0c10;background:#d5d7e0;border:0;border-radius:6px;padding:10px}@media (prefers-reduced-motion:reduce){.house-root .dcard{animation:none}}.house-root[data-mode=game] .tk-body>.preview{gap:2px;padding:0 2px}.house-root[data-mode=game] .side-toggle button{padding:10px 6px}.house-root[data-mode=game] .riskbox{padding:6px 10px}.house-root .dcard .coin.painted{box-shadow:none;background:0 0;width:86px;height:86px}.house-root .dcard .mcoin .coin.painted{width:82px;height:82px}.house-root .dcard .coin.painted .mimg{object-fit:contain;filter:drop-shadow(0 3px 5px #2818068c);width:100%;height:100%}.house-root .dcard .mcoin.good .coin.painted .mimg{filter:drop-shadow(0 0 9px #ffd6788c)drop-shadow(0 3px 5px #28180680)}.house-root .dcard .mcoin.bad .coin.painted{box-shadow:none;background:0 0}.house-root .dcard .mcoin.bad .coin.painted .mimg{filter:drop-shadow(0 0 9px #e2875a99)drop-shadow(0 3px 5px #28180680)}.house-root .dcard .coin .mfb{color:#3b2709;place-items:center;width:60%;height:60%;display:grid}.house-root .dcard .coin .mfb svg{width:100%;height:100%}.house-root .oath-layer{z-index:60;color:var(--ink);transition:opacity .8s;position:fixed;inset:0;overflow:hidden}.house-root .oath-layer.leaving{opacity:0;pointer-events:none}.house-root .oath-layer.og{background:#06070b;animation:.7s both house-oath-in}@keyframes house-oath-in{0%{opacity:0}to{opacity:1}}.house-root .og-art{background:#06070b var(--hall) center top / cover no-repeat;position:absolute;inset:0}.house-root .og-art:after{content:\"\";background:radial-gradient(75% 70% at 50% 52%,#06070b00 40%,#06070b80 100%),linear-gradient(#06070b26,#06070b00 20% 80%,#06070b73);position:absolute;inset:0}.house-root .og-card{z-index:3;width:380px;position:absolute;top:22px;left:22px}.house-root .og-stage{position:absolute;inset:0}.house-root .og-fit{width:1456px;height:816px;transform:translate(-50%, -50%) scale(var(--k,1));transform-origin:50%;position:absolute;top:50%;left:50%}.house-root .og-ora{text-align:center;pointer-events:none;position:absolute;top:0;left:0;right:0}.house-root .og-orb{width:460px;height:330px;position:absolute;top:-56px;left:498px}.house-root .og-orb:before{content:\"\";opacity:.7;background:radial-gradient(circle,#9fdcff61,#9fdcff00 68%);border-radius:50%;transition:opacity 1s,transform 1s;position:absolute;inset:14% 18%}.house-root .og-orb canvas{transition:filter 1.1s;position:relative}.house-root .oath-layer.oraup .og-orb canvas{filter:brightness(1.55)saturate(1.25)drop-shadow(0 0 22px #9fdcffe6)}.house-root .oath-layer.oraup .og-orb:before{opacity:1;transform:scale(1.5)}.house-root .og-say{width:600px;position:absolute;top:176px;left:428px}.house-root .og-say small{font:600 13px/1 var(--f-title);letter-spacing:.34em;color:#bfe8ff;text-shadow:0 1px 3px #000,0 0 14px #9fdcffe6;margin-bottom:8px;display:block}.house-root .og-say q{quotes:none;font:italic 500 27px/1.2 var(--f-voice);text-wrap:balance;color:#eef6ff;text-shadow:0 2px 14px #000000e6,0 0 22px #9fdcff59;display:block}.house-root .tablet{background:radial-gradient(80% 55% at 50% 30%,#28385c47,#0000 70%),repeating-linear-gradient(115deg,#ffffff03 0 2px,#0000 2px 9px),linear-gradient(#0d1424,#070a13);width:660px;height:470px;transition:box-shadow 1.2s;position:absolute;top:296px;left:398px;box-shadow:0 0 0 1px #000c,inset 0 0 60px #000000bf,inset 0 0 0 1px #d4b06a2e,0 24px 60px #000000bf,0 0 80px #d4b06a1f}.house-root .tablet:before{content:\"\";pointer-events:none;border:1px solid #d4b06a59;position:absolute;inset:7px}.house-root .tablet:after{content:\"\";pointer-events:none;z-index:2;border:48px solid #0000;border-image:var(--frame) 118 / 48px stretch;filter:drop-shadow(0 3px 8px #000000b3);transition:filter 1.2s;position:absolute;inset:-16px}.house-root .oath-layer.swearing .tablet{animation:1.4s ease-in-out both house-oath-glow;box-shadow:0 0 0 1px #000c,inset 0 0 60px #00000080,inset 0 0 70px #f1dcaa52,0 0 190px #ffe296cc}@keyframes house-oath-glow{0%{filter:brightness()}45%{filter:brightness(1.35)}to{filter:brightness(1.12)}}.house-root .oath-layer.swearing .tablet:after{filter:drop-shadow(0 0 16px #ffe296f2)drop-shadow(0 0 40px #f1c878cc)brightness(1.35)}.house-root .tb-comp{z-index:3;color:#e9cf93;background:radial-gradient(circle,#11182c 55%,#8a6a30 58%,#f1dcaa 70%,#7a5a2a);border-radius:50%;place-items:center;width:38px;height:38px;margin:-19px 0 0 -19px;display:grid;position:absolute;box-shadow:0 2px 8px #000}.house-root .tb-comp svg{fill:#f1dcaa40;stroke:#f1dcaa;width:20px;height:20px}.house-root .tb-t{width:46px;height:46px;margin:-23px 0 0 -23px;top:0;left:50%}.house-root .tb-l{width:28px;height:28px;margin:-14px 0 0 -14px;top:6px;left:138px}.house-root .tb-r{width:28px;height:28px;margin:-14px 0 0 -14px;top:6px;left:522px}.house-root .tb-dials{grid-template-columns:repeat(3,1fr);height:270px;display:grid;position:absolute;top:22px;left:18px;right:18px}.house-root .od-col{flex-direction:column;align-items:center;padding:0 8px;display:flex;position:relative}.house-root .od-col+.od-col:before{content:\"\";background:linear-gradient(#f1dcaa00,#c9a15a 12%,#8a6a30 50%,#c9a15a 88%,#f1dcaa00);width:2px;position:absolute;top:4px;bottom:-10px;left:0;box-shadow:1px 0 #000000b3,-1px 0 #ffe9aa1f}.house-root .od-col h3{font:600 15px/1 var(--f-title);letter-spacing:.2em;color:#e6cc92;white-space:nowrap;text-shadow:0 1px #000,0 0 12px #d4b06a4d;margin:18px 0 12px}.house-root .od-line{text-align:center;max-width:200px;min-height:3.75em;font:500 15.5px/1.25 var(--f-voice);color:#efe3c2;text-shadow:0 1px 6px #000;margin:12px 0 0}.house-root .dial{--ds:148px;--ang:0deg;width:var(--ds);height:var(--ds);cursor:grab;touch-action:none;-webkit-user-select:none;user-select:none;border-radius:50%;outline:none;flex:none;position:relative;container-type:size}.house-root .dial.turning{cursor:grabbing}.house-root .od-bezel{background:conic-gradient(from 25deg,#f8e7b4,#a47f3f,#f3dca0,#6c5025,#ead198,#9c7a3e,#fbebbb,#70542a,#f8e7b4);border-radius:50%;position:absolute;inset:0;box-shadow:0 8px 20px #000000bf,inset 0 0 0 1.5px #1e1405d9,inset 0 2px 3px #fff5cd8c}.house-root .od-bezel:before{content:\"\";background:radial-gradient(circle,#0a0f1d 60%,#121a2e 100%);border-radius:50%;position:absolute;inset:5%;box-shadow:inset 0 3px 8px #000000f2,0 0 0 1px #ffe9aa59}.house-root .od-ticks{width:100%;height:100%;position:absolute;inset:0}.house-root .od-ticks line{stroke:#9a7a3c;stroke-linecap:round;transition:stroke .2s,filter .2s}.house-root .od-ticks line.lit{stroke:#fff0c2;filter:drop-shadow(0 0 2px #ffdc82f2)}.house-root .od-dia{width:11%;height:16%;transform:translate(-50%, -50%) rotate(var(--r));z-index:2;filter:drop-shadow(0 2px 2px #000c);position:absolute}.house-root .od-dia svg{width:100%;height:100%}.house-root .od-dia path:first-child{fill:#e9cf93;stroke:#5a4220;stroke-width:1px}.house-root .od-dia path:last-child{fill:#1a2240}.house-root .od-knob{transform:rotate(var(--ang));background:radial-gradient(circle, transparent 66%, #0000 67%), repeating-conic-gradient(from 0deg, #e6cb88 0 2.5deg, #b08a46 2.5deg 5deg);border-radius:50%;transition:transform .12s ease-out;position:absolute;inset:17%;box-shadow:0 5px 12px #000c,inset 0 0 0 2px #2a1d08,inset 0 0 0 3.5px #ffeeb473}.house-root .dial.turning .od-knob{transition:none}.house-root .od-knob i{background:linear-gradient(#fff6d2,#f1d27d);border-radius:2px 2px 50% 50%;width:8%;height:17%;margin-left:-4%;position:absolute;top:3.5%;left:50%;box-shadow:0 0 0 1.5px #2a1d08,0 0 8px #ffe696e6}.house-root .od-face{background:radial-gradient(circle at 50% 35%,#1b2850,#0a0f20 72%);border-radius:50%;place-items:center;display:grid;position:absolute;inset:29%;box-shadow:inset 0 3px 10px #000000e6,0 0 0 2px #2a1d08,0 0 0 3.5px #f1dcaa8c,0 0 18px #5082dc33}.house-root .od-face b{font:600 24cqw/1 var(--f-title);color:#f3e3b3;text-shadow:0 0 14px #f1dcaa8c,0 2px #000;letter-spacing:.01em}.house-root .od-face b[data-len=\"5\"]{font-size:16cqw}.house-root .od-face b[data-len=\"4\"]{font-size:19cqw}.house-root .dial:focus-visible .od-bezel{box-shadow:0 8px 20px #000000bf,0 0 0 3px #3fd3c8bf,0 0 22px #3fd3c880,inset 0 2px 3px #fff5cd8c}.house-root .od-seal{opacity:0;z-index:4;filter:drop-shadow(0 4px 6px #000c);pointer-events:none;width:36%;height:36%;position:absolute;bottom:-6%;right:-8%}.house-root .od-seal svg{width:100%;height:100%}.house-root .oath-layer.swearing .od-seal{animation:.5s cubic-bezier(.2,1.6,.4,1) both house-oath-stamp}@keyframes house-oath-stamp{0%{opacity:0;filter:drop-shadow(0 0 #0000)brightness(2);transform:scale(2.6)rotate(-24deg)}60%{opacity:1;transform:scale(.92)rotate(3deg)}to{opacity:1;filter:drop-shadow(0 4px 6px #000c)drop-shadow(0 0 14px #ffdc82e6);transform:scale(1)rotate(0)}}.house-root .oath-layer.swearing .dial{pointer-events:none}.house-root .oath-layer.swearing .od-bezel{transition:box-shadow 1s;box-shadow:0 0 34px #ffe296bf,inset 0 0 0 1.5px #1e1405d9,inset 0 2px 3px #fff5cdcc}.house-root .swear{z-index:3;cursor:pointer;width:496px;height:52px;font:700 25px/1 var(--f-title);letter-spacing:.06em;color:#1b1306;text-shadow:0 1px #fff4cd99;background:linear-gradient(#f8e7b4,#d9b66c 38%,#b98f46 62%,#e6c887);border:2px solid #5a4220;border-radius:3px;justify-content:center;align-items:center;gap:22px;transition:filter .2s,box-shadow .3s;display:flex;position:absolute;top:300px;left:82px;box-shadow:0 0 0 2px #f1dcaa80,inset 0 2px #fffae1bf,inset 0 -3px 6px #5a3c148c,0 10px 24px #000000a6,0 0 30px #d4b06a4d}.house-root .swear i{color:#3a2a0e;width:15px;height:15px;display:grid}.house-root .swear i svg{fill:#3a2a0e;stroke:#3a2a0e;width:100%;height:100%}.house-root .swear:hover{filter:brightness(1.08);box-shadow:0 0 0 2px #f1dcaab3,inset 0 2px #fffae1bf,inset 0 -3px 6px #5a3c148c,0 10px 24px #000000a6,0 0 46px #f1d28299}.house-root .swear:focus-visible{outline:2px solid var(--cyan,#3fd3c8);outline-offset:4px}.house-root .swear:disabled{filter:brightness(1.1);cursor:default}.house-root .purse{background:linear-gradient(#0d1426f5,#070a13f5);border:1px solid #d4b06abf;border-radius:3px;align-items:center;gap:14px;width:320px;height:58px;padding:0 18px 0 8px;display:flex;position:absolute;top:370px;left:170px;box-shadow:inset 0 0 0 3px #00000080,inset 0 0 0 4px #d4b06a38,0 4px 14px #0009}.house-root .purse .pc{filter:drop-shadow(0 2px 4px #000c);flex:none;width:48px;height:48px}.house-root .purse .pc svg{width:100%;height:100%}.house-root .purse small{font:600 10px/1 var(--f-ui);letter-spacing:.3em;color:#b9a577;margin-bottom:6px;display:block}.house-root .purse b{font:600 20px/1 var(--f-mar);letter-spacing:.06em;color:#f3e6c4;white-space:nowrap}.house-root .od-foot{text-align:center;font:500 13.5px/1 var(--f-voice);letter-spacing:.06em;color:#cdb987;text-shadow:0 1px #000;margin:0;position:absolute;top:442px;left:0;right:0}.house-root .od-foot.lockline{color:var(--gold-hi);letter-spacing:.08em;font-size:15px}.house-root .od-x{z-index:5;cursor:pointer;font:600 11px/1 var(--f-title);letter-spacing:.26em;color:var(--gold);background:#080b12d9;border:1px solid #d4b06a8c;border-radius:3px;padding:10px 16px;position:absolute;top:24px;right:26px}.house-root .od-x:hover{color:var(--gold-hi);border-color:var(--gold)}.house-root .oath-layer.locked .od-col .dial{cursor:default;filter:saturate(.55)brightness(.62)}.house-root .oath-layer.locked .od-col h3,.house-root .oath-layer.locked .od-line{opacity:.65}.house-root .od-lock{z-index:5;color:#f3e3b3;filter:drop-shadow(0 0 6px #000);place-items:center;width:26cqw;height:26cqw;margin:-13cqw 0 0 -13cqw;display:grid;position:absolute;top:50%;left:50%}.house-root .od-lock svg{width:100%;height:100%}.house-root .oath-layer.locked .od-face b{opacity:0}.house-root .oath-layer.locked .tb-dials{height:280px}.house-root .oath-layer.locked .tablet{height:400px}.house-root .oath-layer.locked .purse{top:300px}.house-root .oath-layer.locked .od-foot{top:372px}.house-root .oath-layer.oa{background:#040508b8;place-items:center;display:grid}.house-root .oa-card{background:var(--panel);border:1px solid var(--line);border-radius:6px;width:min(660px,94vw);padding:18px 20px 16px;position:relative;box-shadow:0 24px 60px #0009}.house-root .oa .oa-head{justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:8px;display:flex}.house-root .oa .oa-head b{font:600 15px/1 var(--f-ui);color:var(--ink)}.house-root .oa .oa-head span{font:12px/1 var(--f-ui);color:var(--ink-3)}.house-root .oa .tb-dials{grid-template-columns:repeat(3,1fr);gap:8px;height:auto;position:static}.house-root .oa .od-col h3{font:600 11px/1 var(--f-ui);letter-spacing:.1em;color:var(--ink-2);margin:10px 0}.house-root .oa .od-col+.od-col:before{background:var(--line);width:1px;box-shadow:none;top:8px;bottom:8px}.house-root .oa .dial{--ds:104px}.house-root .oa .od-face b{font-family:var(--f-num)}.house-root .oa .od-line{font:12.5px/1.35 var(--f-ui);color:var(--ink-2);max-width:170px;min-height:3.4em;text-shadow:none}.house-root .oa .swear{width:100%;height:40px;font:700 14px/1 var(--f-ui);letter-spacing:.12em;text-transform:uppercase;margin-top:8px;position:static}.house-root .oa .oa-acct{font:12px/1 var(--f-num);color:var(--ink-3);text-align:center;margin-top:10px}.house-root .oa .od-foot{font:12px/1.3 var(--f-ui);letter-spacing:0;color:var(--ink-3);text-shadow:none;margin-top:8px;position:static}.house-root .oa .od-foot.lockline{color:var(--gold);font-size:12.5px}.house-root .oa .od-x{font:600 11px/1 var(--f-ui);letter-spacing:.12em;margin:12px auto 0;display:block;position:static}.house-root .oa .od-seal{right:-12%}.house-root .oa.swearing .oa-card{box-shadow:0 0 60px #f1dcaa66,0 24px 60px #0009}.house-root .oath-glyph{vertical-align:middle;cursor:pointer;width:22px;height:22px;color:var(--gold);background:#080b12cc;border:1px solid #d4b06a8c;border-radius:50%;place-items:center;padding:0;display:inline-grid}.house-root .oath-glyph svg{width:14px;height:14px}.house-root .oath-glyph:hover{color:var(--gold-hi);border-color:var(--gold-hi);box-shadow:0 0 10px #f1dcaa80}.house-root .cc-body h2 .oath-glyph{margin-left:8px;position:relative;top:-3px}.house-root .field.risk>span{white-space:nowrap;align-items:center;gap:6px;display:flex}@media (prefers-reduced-motion:reduce){.house-root .oath-layer,.house-root .od-knob,.house-root .tablet,.house-root .og-orb canvas{transition:none;animation:none}.house-root .oath-layer.swearing .od-seal{opacity:1;animation:none}}.house-root .oath-layer.og.ph{overscroll-behavior:contain;-webkit-overflow-scrolling:touch;overflow-y:auto}.house-root .oath-layer.ph .og-art{background-position:34% 0;position:fixed}.house-root .oath-layer.ph .og-card{width:auto;max-width:calc(100% - 24px);margin:12px 12px 0;position:relative;top:auto;left:auto}.house-root .oath-layer.ph .og-stage{position:relative;inset:auto}.house-root .oath-layer.ph .og-fit{width:auto;height:auto;padding:0 12px 28px;position:relative;top:auto;left:auto;transform:none}.house-root .oath-layer.ph .og-ora{flex-direction:column;align-items:center;display:flex;position:relative}.house-root .oath-layer.ph .og-orb{width:220px;height:150px;margin-top:4px;position:relative;top:auto;left:auto}.house-root .oath-layer.ph .og-say{width:auto;max-width:340px;margin:-6px auto 18px;position:relative;top:auto;left:auto}.house-root .oath-layer.ph .og-say q{font-size:21px}.house-root .oath-layer.ph .tablet{width:auto;height:auto;padding:30px 16px 20px;position:relative;top:auto;left:auto}.house-root .oath-layer.ph .tablet:after{border-width:34px;border-image:var(--frame) 118 / 34px stretch;inset:-10px}.house-root .oath-layer.ph .tb-l,.house-root .oath-layer.ph .tb-r{display:none}.house-root .oath-layer.ph .tb-dials,.house-root .oath-layer.ph.locked .tb-dials{flex-direction:column;gap:6px;height:auto;display:flex;position:relative;top:auto;left:auto;right:auto}.house-root .oath-layer.ph .od-col{grid-template-rows:auto 1fr;grid-template-columns:104px 1fr;align-items:center;column-gap:14px;padding:10px 2px;display:grid}.house-root .oath-layer.ph .od-col+.od-col:before{background:linear-gradient(90deg,#f1dcaa00,#c9a15a 20% 80%,#f1dcaa00);width:auto;height:1px;inset:0 8px auto}.house-root .oath-layer.ph .od-col .dial{--ds:104px;grid-area:1/1/3}.house-root .oath-layer.ph .od-col h3{letter-spacing:.14em;white-space:normal;grid-area:1/2;align-self:end;margin:0 0 6px;font-size:14px}.house-root .oath-layer.ph .od-line{text-align:left;grid-area:2/2;align-self:start;max-width:none;min-height:0;margin:0;font-size:17px;line-height:1.3}.house-root .oath-layer.ph .swear{width:100%;margin:16px 0 0;position:relative;top:auto;left:auto;transform:none}.house-root .oath-layer.ph .purse,.house-root .oath-layer.ph.locked .purse{width:-moz-fit-content;width:fit-content;max-width:100%;margin:14px auto 0;position:relative;top:auto;left:auto;transform:none}.house-root .oath-layer.ph .purse b{font-size:17px}.house-root .oath-layer.ph .od-foot,.house-root .oath-layer.ph.locked .od-foot{letter-spacing:.03em;margin:14px 4px 0;font-size:14px;line-height:1.35;position:relative;top:auto}.house-root .oath-layer.ph .od-x{margin:16px auto 0;display:block;position:relative;inset:auto}.house-root .oath-layer.ph .swear{gap:14px;height:50px;font-size:20px}" + uf + df + ff + pf + mf + ia + hf, document.head.appendChild(e);
	}
}
function Em() {
	if ([...document.head.querySelectorAll("link")].some((e) => e.href.includes("fonts.googleapis.com/css2") && e.href.includes("Cinzel"))) return;
	let e = document.createElement("link");
	e.rel = "stylesheet", e.href = Cm, e.dataset.house = "", document.head.appendChild(e);
}
var Dm = (e, t = 2) => `${e < 0 ? "-" : ""}$${Math.abs(e).toLocaleString("en-US", {
	minimumFractionDigits: t,
	maximumFractionDigits: t
})}`, Om = (e) => {
	if (e == null || !Number.isFinite(e)) return "—";
	let t = e >= 1e3 ? 1 : e >= 100 ? 2 : e >= 1 ? 3 : 5;
	return e.toLocaleString("en-US", {
		minimumFractionDigits: t,
		maximumFractionDigits: t
	});
}, km = (e) => {
	let t = parseFloat(e.value);
	return Number.isFinite(t) && t > 0 ? t : null;
}, Am = (e) => e.replace(/[&<>"]/g, (e) => ({
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;"
})[e]), jm = {
	A: "Excellent",
	B: "Iron will",
	C: "Impressive",
	D: "Sloppy",
	F: "No plan"
}, Mm = (e, t) => e && t && e.prevDayPx > 0 ? (t / e.prevDayPx - 1) * 100 : null, Nm = (e) => e == null ? "" : `${e >= 0 ? "+" : ""}${e.toFixed(2)}%`;
async function Pm(e, t = {}) {
	let n = t.store ?? wm, r = e, c = !1, l = [], u = (e, n) => {
		t.track && pm(e, n);
	}, d = (e) => {
		try {
			t.onEvent?.(e);
		} catch {}
	};
	Tm(), Em(), Ws(t.assetBase);
	let f = {
		account: ka(),
		sound: !0,
		riskPct: 1,
		coin: "BTC",
		interval: "4h",
		mode: "game"
	}, p = null;
	try {
		p = await n.get(gm);
	} catch {
		p = null;
	}
	let m = {
		...f,
		...p && typeof p == "object" ? p : {}
	};
	t.mode && (m.mode = t.mode), m.account = ja(m.account);
	let h = ym();
	try {
		let e = await n.get(_m);
		if (e && typeof e == "object") for (let t of vm) {
			let n = Math.floor(Number(e[t.key]));
			n > 0 && (h[t.key] = n);
		}
	} catch {
		h = ym();
	}
	let g = [];
	try {
		g = Lf(await n.get(Af));
	} catch {
		g = [];
	}
	let _ = await Qo(n).catch(() => Wo());
	m.riskPct = _.riskPct, m.accountId ||= Es();
	let v = fs();
	try {
		v = ps(await n.get(ds));
	} catch {
		v = fs();
	}
	let y = Ms(null, Date.now());
	try {
		y = Ms(await n.get(ks), Date.now());
	} catch {}
	let b = Od(null, Qu(Date.now()));
	try {
		b = Od(await n.get(Gu), Qu(Date.now()));
	} catch {}
	let x = (e) => {
		b = e;
		try {
			Promise.resolve(n.set(Gu, JSON.parse(JSON.stringify(e)))).catch(() => {});
		} catch {}
	}, S = () => {
		let e = Qu(Date.now());
		return b.date !== e && (b = Od(b, e)), b;
	}, C = [];
	try {
		C = Kc(await n.get(Gc));
	} catch {
		C = [];
	}
	let w = [];
	try {
		w = up(await n.get(Gf));
	} catch {
		w = [];
	}
	let T = pp(null);
	try {
		T = pp(await n.get(Kf));
	} catch {}
	let E = () => {
		if (!c) try {
			Promise.resolve(n.set(Gf, JSON.parse(JSON.stringify(w)))).catch(() => {});
		} catch {}
	}, D = () => {
		if (!c) try {
			Promise.resolve(n.set(Kf, { ...T })).catch(() => {});
		} catch {}
	}, O = Object.keys(m.account.positions).length > 0 && T.lastSeen > 0 && Date.now() - T.lastSeen > 12e4, k = () => {
		if (!c) try {
			Promise.resolve(n.set(Gc, JSON.parse(JSON.stringify(C)))).catch(() => {});
		} catch {}
	}, A = rl(null);
	try {
		A = rl(await n.get(el));
	} catch {}
	let j = `${el}:charts`, M = {};
	try {
		let e = await n.get(j);
		e && typeof e == "object" && (M = e);
	} catch {}
	let ee = () => {
		if (!c) try {
			Promise.resolve(n.set(el, JSON.parse(JSON.stringify(A)))).catch(() => {});
		} catch {}
	}, N = () => {
		if (!c) try {
			Promise.resolve(n.set(ds, JSON.parse(JSON.stringify(v)))).catch(() => {});
		} catch {}
	}, te = () => {
		if (!c) try {
			Promise.resolve(n.set(ks, { ...y })).catch(() => {});
		} catch {}
	};
	function ne() {
		if (!c) try {
			n.set(gm, JSON.parse(JSON.stringify(m))).catch(() => {});
		} catch {}
	}
	{
		let e = t.onExit ? null : new URLSearchParams(location.search).get("m");
		e && /^(xyz:)?[A-Za-z0-9]{1,16}$/.test(e) && (m.coin = e);
	}
	r.classList.add("house-root"), r.dataset.mode = m.mode, t.onExit && (r.dataset.embedded = "");
	let P = () => m.mode === "game" ? "Light" : "XP", F = {}, re = {}, I = mm, L = Object.fromEntries(mm.map((e) => [e.key, e])), R = (e) => L[e]?.maxLeverage ?? m.account.positions[e]?.maxLeverage ?? 10, z = (e) => Ea(e) ? Ta(e) : Sa(e), B = "long", ie = !1, V = m.type ?? "market", H = !1, ae = {}, oe = null, se = 0, U = (e) => r.querySelector(e), ce = /* @__PURE__ */ new Set(), le = "trade", W = null, ue = null, de = 0, fe = (e, t) => {
		let n = window.setTimeout(() => {
			ce.delete(n), c || e();
		}, t);
		return ce.add(n), n;
	}, pe = 0;
	function G(e, t = !1) {
		let n = U("#toast");
		n.textContent = e, n.className = t ? "show bad" : "show", clearTimeout(pe), pe = fe(() => n.className = "", 3200);
	}
	function me(e) {
		if (m.sound && "speechSynthesis" in window) try {
			let t = new SpeechSynthesisUtterance(e);
			t.rate = .85, t.pitch = .6, t.volume = .9, speechSynthesis.speak(t);
		} catch {}
	}
	r.innerHTML = jc({ exit: !!t.onExit }), U(".plate").style.backgroundImage = `url('${Gs("hall.webp")}')`, r.style.setProperty("--frame", `url('${Gs("frame.webp")}')`), l.push(am(U("#dust"), () => m.mode === "game")), l.push(mc(U("#oraOrb"))), l.push(lc(r, () => _e, ".roomhost"));
	let he = wu(n);
	l.push(he.stop), U("#reset").hidden = !1;
	let ge = (e) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${e}</svg>`, _e = "<svg viewBox=\"0 0 48 40\" aria-hidden=\"true\"><defs><linearGradient id=\"chg\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#f1dcaa\"/><stop offset=\"1\" stop-color=\"#9c7a3e\"/></linearGradient></defs><path d=\"M5 17c0-8 8-13 19-13s19 5 19 13z\" fill=\"#2a1d0c\" stroke=\"url(#chg)\" stroke-width=\"1.8\"/><rect x=\"5\" y=\"17\" width=\"38\" height=\"19\" rx=\"2.5\" fill=\"#1b130a\" stroke=\"url(#chg)\" stroke-width=\"1.8\"/><path d=\"M5 17h38M19 17v19M29 17v19\" stroke=\"url(#chg)\" stroke-width=\"1.4\" opacity=\".8\"/><rect x=\"21\" y=\"19\" width=\"6\" height=\"8\" rx=\"1.4\" fill=\"#f1dcaa\"/><circle cx=\"24\" cy=\"23\" r=\"1.3\" fill=\"#2a1d0c\"/></svg>";
	function K() {
		let e = U("#vault");
		e.firstChild || (e.innerHTML = `<h3 class="ptitle vt-title">VAULT OF ESSENCE</h3><div class="shelf">${vm.map((e) => `<div class="crystal" data-el="${e.key}" style="--glow:${e.glow}"><span class="gem"><img src="${Gs(`el/${e.key}.webp`)}" alt="" draggable="false" /></span><b>${e.name}</b><i>×0</i></div>`).join("")}</div>`);
		for (let t of vm) e.querySelector(`[data-el="${t.key}"] i`).textContent = `×${h[t.key]}`;
	}
	function ve(e) {
		if (!(e in h)) return 0;
		h[e] += 1;
		try {
			Promise.resolve(n.set(_m, { ...h })).catch(() => {});
		} catch {}
		return K(), h[e];
	}
	function ye(e) {
		if (c) return null;
		let t = bt(), r = zf(e, h, g, t.index, t.name, Date.now());
		if (!r.ok) return null;
		h = r.vault, g = r.relics;
		try {
			Promise.resolve(n.set(_m, { ...h })).catch(() => {});
		} catch {}
		try {
			Promise.resolve(n.set(Af, JSON.parse(JSON.stringify(g)))).catch(() => {});
		} catch {}
		K();
		let i = r.relic;
		return d({
			type: "relic_forged",
			id: i.id,
			name: i.name,
			slot: i.slot,
			forged_at: i.forged_at,
			rank: i.rank,
			grants: i.grants
		}), u("relic_forged", i.id), Nn(!0), { ...i };
	}
	function be() {
		let e = Ps(y) && !y.chestOpened, t = !!y.chestOpened;
		U("#trials").innerHTML = `<div class="tr-head">WEEKLY DISCIPLINE<br>TRIALS</div><div class="tr-list">${bm.map((e) => {
			let t = Math.min(e.of, y[e.id]);
			return `<div class="trial${t >= e.of ? " done" : ""}" data-trial="${e.id}"><span class="emb">${ge(e.icon)}</span>
        <div class="tr-body"><b>${e.title}</b><div class="tbar"><div style="width:${Math.min(100, t / e.of * 100).toFixed(0)}%"></div></div></div><em>${t}/${e.of}</em></div>`;
		}).join("")}</div><button type="button" class="tr-rewards${t ? " open" : e ? " ready" : ""}" data-chest="${t ? "open" : e ? "ready" : "shut"}"><span>REWARDS</span>${cc(t ? "open" : e ? "ready" : "closed")}</button>`;
	}
	function xe() {
		Ps(y) && !y.chestOpened && (y = {
			...y,
			chestOpened: !0
		}, te(), be(), W?.kind === "missions" && W.update(tu(Cn())));
	}
	U("#trials").addEventListener("click", (e) => {
		e.target.closest(".tr-rewards.ready") && xe();
	});
	function Se() {
		U("#contract").innerHTML = `<h4 class="ct-title">TRADE PLAN CONTRACT</h4><div class="seals">${Sm.map((e) => `<div class="seal" data-seal="${e.k}" data-state=""><span class="disc"><svg class="g-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${e.glyph}</svg>
        <svg class="g-ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 12.5l4 4 8-9"/></svg>
        <svg class="g-bad" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.5 3.5l-3 6 4 2-4 4 2.5 5"/><path d="M6 8l3 2M18 14l-3.2-1" opacity=".7"/></svg></span><b>${e.label}</b></div>`).join("")}</div>`;
	}
	function Ce(e) {
		for (let t of [
			"stop",
			"size",
			"target"
		]) {
			let n = r.querySelector(`#contract [data-seal="${t}"]`);
			n && (n.dataset.state = e[t] === !0 ? "ok" : e[t] === !1 ? "broken" : "");
		}
	}
	function we(e, t, n = "keystone") {
		let r = U("#fx"), i = vm.find((e) => e.key === n)?.glow ?? "#f6c66a", a = e.getBoundingClientRect(), o = t.getBoundingClientRect(), s = a.left + a.width * .5, l = a.top + a.height * .5, u = o.left + o.width / 2, d = o.top + o.height * .42, f = Math.hypot(u - s, d - l), p = [], m = [], h = document.createElement("i");
		h.className = "burst", h.style.cssText = `left:${s}px;top:${l}px;--c:${i}`, r.appendChild(h), m.push(h);
		for (let e = 0; e < 16; e++) {
			let t = f * (.12 + Math.random() * .18), n = (s + u) / 2 + (Math.random() - .5) * f * .34, a = Math.min(l, d) - t, o = s + (Math.random() - .5) * 46, c = l + (Math.random() - .5) * 30, h = (Math.random() - .5) * 540, g = 1e3 + Math.random() * 380, _ = 7 + e % 3 * 3, v = 12 + e % 4 * 3;
			for (let t = 0; t <= 5; t++) {
				let s = document.createElement("i");
				s.className = t === 0 ? "shard" : "shard trail";
				let l = t === 0 ? 1 : .78 - t * .11;
				s.style.cssText = `--c:${i};width:${_}px;height:${v}px;--o:${t === 0 ? 1 : (.5 - t * .07).toFixed(2)}`, r.appendChild(s), m.push(s);
				let f = [];
				for (let e = 0; e <= 18; e++) {
					let t = e / 18, r = 1 - t, i = r * r * o + 2 * r * t * n + t * t * u, s = r * r * c + 2 * r * t * a + t * t * d, p = (.5 + .9 * Math.sin(Math.PI * t) + .2) * l;
					f.push({
						offset: t,
						opacity: e === 0 ? 0 : e > 16 ? .25 : 1,
						transform: `translate(${i.toFixed(1)}px, ${s.toFixed(1)}px) translate(-50%, -50%) rotate(${(h * t).toFixed(0)}deg) scale(${p.toFixed(2)})`
					});
				}
				let y = s.animate(f, {
					duration: g,
					delay: e * 55 + t * 38,
					easing: "cubic-bezier(.45,.05,.55,.95)",
					fill: "both"
				});
				p.push(y.finished.catch(() => {}));
			}
		}
		return Promise.all(p).then(() => {
			if (m.forEach((e) => e.remove()), c) return;
			t.classList.remove("flare"), t.offsetWidth, t.classList.add("flare");
			let e = t.querySelector(".gem img"), n = (e ?? t).getBoundingClientRect(), a = document.createElement("div");
			a.className = "landed", a.style.cssText = `left:${n.left + n.width / 2}px;top:${n.top + n.height / 2}px;--c:${i}`, a.innerHTML = `<i class="ring"></i><i class="ring r2"></i>${e ? `<img src="${e.getAttribute("src")}" alt="" />` : ""}`, r.appendChild(a);
			let o = document.createElement("b");
			o.className = "plus1", o.textContent = "+1", o.style.cssText = `left:${u}px;top:${n.top - 4}px;--c:${i}`, r.appendChild(o), fe(() => {
				o.remove(), a.remove(), t.classList.remove("flare");
			}, 1700);
		});
	}
	let Te = null, Ee = null, De = 0, Oe = "", ke = {}, Ae = /* @__PURE__ */ new Set();
	function je(e, t = !1) {
		if (!t && e === m.coin && m.interval === "4h") {
			let e = Ie.candles();
			if (e.length >= 30) return e;
		}
		let n = ke[e];
		return (!n || Date.now() - n.at > 24e4) && (Ae.has(e) || (Ae.add(e), a(e, "4h", 200).then((t) => {
			c || (ke[e] = {
				at: Date.now(),
				bars: t
			}, ze());
		}).catch(() => {}).finally(() => Ae.delete(e)))), n?.bars ?? null;
	}
	function Me() {
		let e = Date.UTC((/* @__PURE__ */ new Date()).getUTCFullYear(), (/* @__PURE__ */ new Date()).getUTCMonth(), (/* @__PURE__ */ new Date()).getUTCDate());
		return m.account.history.filter((t) => t.openedAt >= e).length + Object.values(m.account.positions).filter((t) => t.openedAt >= e).length;
	}
	let Ne = 0, Pe = {
		ghost: null,
		zone: null
	};
	function Fe(e) {
		let t = U("#oraLine");
		t.style.opacity = "0", clearTimeout(Ne), dc(), Ne = fe(() => {
			t.textContent = e, t.style.transition = "opacity .6s", t.style.opacity = "1";
		}, 180);
	}
	let Ie = await ha({
		host: U("#chart"),
		bar: U(".chart-bar"),
		store: n,
		mode: () => m.mode,
		coin: () => m.coin,
		interval: () => m.interval,
		szDecimals: () => L[m.coin]?.szDecimals ?? 2,
		state: () => {
			let e = m.account.positions[m.coin], t = (m.account.orders ?? []).filter((e) => e.coin === m.coin), n = r.querySelector("#price"), i = r.querySelector("#priceRow");
			return {
				coin: m.coin,
				mark: F[m.coin],
				position: e ? {
					side: e.side,
					entry: e.entry,
					qty: e.qty,
					stop: e.stop,
					target: e.target,
					liq: Pa(e)
				} : null,
				orders: t,
				plan: {
					price: n && i && !i.hidden ? km(n) : null,
					stop: km(U("#stop")),
					target: km(U("#target")),
					ghostStop: Pe.ghost,
					zone: Pe.zone
				}
			};
		},
		hooks: () => ({
			setStop: it,
			setTarget: at,
			fillTicket: un,
			moveOrder: tt
		})
	});
	l.push(() => Ie.destroy());
	let Le = () => Ie.theme(), q = () => Ie.load(), J = () => Ie.refreshLines(), Re = !1;
	function ze() {
		Re || (Re = !0, fe(() => {
			Re = !1, Zt();
		}, 120));
	}
	let Be = new s({
		onStatus(e) {
			ie = e, yt();
		},
		onMids(e) {
			for (let t in e) t.charCodeAt(0) !== 64 && t.charCodeAt(0) !== 35 && (F[t] = e[t]);
			Ge(), He(), ze();
		},
		onBook(e, t) {
			re[e] = t, e === m.coin && ze();
		},
		onCandle(e, t, n) {
			e === m.coin && t === m.interval && Ie.live(e, t, n);
		}
	}), Y = /* @__PURE__ */ new Set();
	function Ve() {
		let e = /* @__PURE__ */ new Set([
			m.coin,
			...Object.keys(m.account.positions),
			...m.account.orders.map((e) => e.coin)
		]);
		for (let t of [...Y]) e.has(t) || (Be.unsubscribe({
			type: "l2Book",
			coin: t
		}), Y.delete(t), delete re[t]);
		for (let t of e) Y.has(t) || (Be.subscribe({
			type: "l2Book",
			coin: t
		}), Y.add(t));
	}
	Ve(), Be.subscribe({
		type: "candle",
		coin: m.coin,
		interval: m.interval
	});
	function He() {
		if (!C.length) return;
		let e = Qc(C, F, Date.now());
		if (!e.fired.length) return;
		C = e.alerts, k();
		for (let t of e.fired) Gn(sp({
			id: t.id,
			coin: t.coin,
			name: L[t.coin]?.name ?? Sa(t.coin),
			sym: qn(t.coin),
			level: t.level,
			px: t.firedPx,
			now: Date.now()
		}));
		let t = e.fired[0], n = L[t.coin]?.name ?? L[t.coin]?.ticker ?? Sa(t.coin);
		G(`Bell: ${n} ${t.dir === "above" ? "≥" : "≤"} ${su(t.level)}${e.fired.length > 1 ? ` (+${e.fired.length - 1} more)` : ""}`), Fe(`${n} crossed ${su(t.level)}. Your bell rang.`), Nn(!0);
	}
	function Ue(e, t, n) {
		if (!Uf($c(C).length, g)) {
			G(`All ${Hf(g)} bells are hung.`, !0);
			return;
		}
		C = Xc(C, {
			coin: e,
			dir: t,
			level: n,
			now: Date.now()
		}), k(), Nn(!0);
	}
	function We(e) {
		C = Zc(C, e), k(), Nn(!0);
	}
	function Ge() {
		if (!O) {
			if (m.account.orders.length) {
				let e = Za(m.account, F, re);
				e.events.length && (m.account = e.account, Ze(e.events), Ye());
			}
			for (let e of Object.values(m.account.positions)) {
				let t = F[e.coin];
				if (!t) continue;
				vs(v, e.coin, t, Date.now()) && N();
				let n = co(e, t);
				n && Qe(e.coin, n);
			}
		}
	}
	function Ke(e) {
		e !== m.coin && (Be.unsubscribe({
			type: "candle",
			coin: m.coin,
			interval: m.interval
		}), m.coin = e, Be.subscribe({
			type: "candle",
			coin: m.coin,
			interval: m.interval
		}), Ve(), ne(), rn(), U("#price").value = "", H && ln(!1), V !== "market" && cn(V), Ft = 0, q().then(J), gt(), Ut(), Qt());
	}
	function qe(e) {
		e !== m.interval && (Be.unsubscribe({
			type: "candle",
			coin: m.coin,
			interval: m.interval
		}), m.interval = e, Be.subscribe({
			type: "candle",
			coin: m.coin,
			interval: m.interval
		}), ne(), q().then(J), vt());
	}
	let Je = !1;
	function Ye() {
		st(), Ve(), ne(), J(), Je = !0, Qt(), Je = !1, oe?.update();
	}
	function Xe(e = 0) {
		let t = re[m.coin];
		if (V === "market" && !t) return G("Waiting for the order book…", !0);
		let n = H ? null : km(U("#stop")), r = H ? null : km(U("#target")), i = V === "market" ? null : km(U("#price")), a = Ja(m.account, {
			coin: m.coin,
			side: B,
			type: V,
			price: i,
			reduceOnly: H,
			notional: km(U("#size")) ?? 0,
			leverage: tn(),
			maxLeverage: R(m.coin),
			stop: n,
			target: r,
			riskPerTradePct: m.riskPct
		}, t, F);
		if (!a.ok) return G(a.error, !0);
		let o = a.value;
		m.account = o.account, e > 0 && !H && (ot[m.coin] = (ot[m.coin] ?? 0) + e);
		let s = !H && n == null, c = s ? ` · NO STOP: this trade cannot earn full ${P()}` : "";
		o.status === "working" ? G(`${V.toUpperCase()} ${B === "long" ? "BUY" : "SELL"} ${z(m.coin)} resting at ${Om(i)}${c}`, s) : V === "market" && !H && G(`${B.toUpperCase()} ${z(m.coin)} filled · slippage ${(o.slippageBps ?? 0).toFixed(1)} bps${c}`, s), Ze(o.events), H || Fe(s ? rm.noStop : rm.placed), u("trade_placed", m.coin), Ye();
	}
	function Ze(e) {
		for (let t of e) {
			let e = t.order;
			if (t.type === "cancelled") {
				G(`${z(e.coin)}: ${t.reason}`, !0);
				continue;
			}
			if (t.trade) ut(e.coin, t.trade);
			else if (t.fill.kind === "reduce") {
				let n = m.account.positions[e.coin];
				n && (gs(v, e.coin, t.fill.qty, t.fill.price, n.target, n.side, t.fill.time), N()), G(`${t.fill.how.toUpperCase()} ${t.fill.dir.toUpperCase()} ${z(e.coin)} filled at ${Om(t.fill.price)}`);
			} else G(`${t.fill.how.toUpperCase()} ${t.fill.dir.toUpperCase()} ${z(e.coin)} filled at ${Om(t.fill.price)}`);
		}
	}
	function Qe(e, t) {
		let n = Ga(m.account, e, re[e], F[e], t);
		n && (m.account = n.account, ut(e, n.trade), Ye());
	}
	function $e(e, t) {
		let n = m.account.positions[e];
		if (!n || !(t > 0)) return;
		let r = Wa(m.account, e, n.qty * Math.min(1, t), re[e], F[e], "sell");
		r && (m.account = r.account, r.trade ? ut(e, r.trade) : (gs(v, e, r.fill.qty, r.fill.price, n.target, n.side, Date.now()), N(), G(`Reduced ${z(e)} ${Math.round(t * 100)}% · ${Dm(r.fill.pnl ?? 0)} booked`)), Ye());
	}
	function et(e, t) {
		let n = m.account.positions[e], r = F[e] ?? n?.entry;
		n && r && t > 0 && $e(e, t / (n.qty * r));
	}
	function tt(e, t) {
		let n = Qa(m.account, e, t, F);
		if (!n.ok) return G(n.error, !0), !1;
		m.account = n.value;
		let r = Za(m.account, F, re);
		return r.events.length && (m.account = r.account, Ze(r.events)), Ye(), !0;
	}
	function nt(e) {
		m.account.orders.some((t) => t.id === e) && (m.account = $a(m.account, e), G("Order cancelled."), Ye());
	}
	function rt() {
		m.account.orders.length && (m.account = eo(m.account), G("All orders cancelled."), Ye());
	}
	function it(e, t) {
		let n = oo(m.account, e, t);
		if (!n.ok) return G(n.error, !0);
		let r = n.value.positions[e].stopWidenings > m.account.positions[e].stopWidenings, i = m.account.positions[e].stop;
		m.account = n.value, i !== t && (hs(v, e, i, t, Date.now()), N()), ne(), r ? (G("STOP WIDENED. That is recorded and it will cost you.", !0), me("Widened"), Fe(rm.widened)) : (G("Stop moved."), Fe(rm.tightened)), J(), Je = !0, Qt(), Je = !1;
	}
	function at(e, t) {
		let n = so(m.account, e, t);
		if (!n.ok) return G(n.error, !0);
		m.account = n.value, ne(), J(), Je = !0, Qt(), Je = !1;
	}
	let ot = {};
	function st() {
		let e = !1;
		for (let t of Object.values(m.account.positions)) {
			let n = v.open[t.coin], r = !n || n.openedAt !== t.openedAt, i = ke[t.coin]?.bars, a = ms(v, t, ot[t.coin] ?? 0, i ? Lo(i) : null);
			r ? e = !0 : (ot[t.coin] ?? 0) > 0 && (a.gateTaken += ot[t.coin], e = !0), delete ot[t.coin];
		}
		for (let e of Object.keys(ot)) !m.account.positions[e] && !m.account.orders.some((t) => t.coin === e) && delete ot[e];
		e && N();
	}
	let ct = {
		A: "flawless",
		B: "disciplined",
		C: "solid",
		D: "loose",
		F: "unstructured"
	};
	function lt(e) {
		return bo(e).map((e) => {
			let t = v.graded[e.trade.id];
			return t ? {
				...e,
				letter: t.grade,
				xp: Math.max(0, t.light),
				medals: t.medals.filter((e) => vo[e]).map((e) => ({
					key: e,
					...vo[e]
				})),
				award: {
					...e.award,
					grade: ct[t.grade] ?? e.award.grade,
					headline: `Grade ${t.grade}`
				}
			} : {
				...e,
				letter: null
			};
		});
	}
	function ut(e, t, n = !1) {
		let r = m.account.history, i = r.findIndex((e) => e.id === t.id);
		if (i < 0) return;
		let a = So(lt(r.slice(0, i))).level, o = bs(v, t), s = Ss(t, o, _, r.slice(0, i)), c = us(s);
		Cs(v, t, o, c), N();
		let l = So(lt(r.slice(0, i + 1))).level;
		y = Ns(Ms(y, Date.now()), c, s), te(), be();
		let f = t.exitReason === "liquidation", p = c.medals.includes("TILT"), h = Math.max(0, c.light), g = kn().length > 0;
		Fe((f ? rm.liquidated : l > a ? im(rm.levelUp, l) : p ? rm.tilt : im(rm[ct[c.grade]], h)) + (g ? ` ${pl}` : "")), u("trade_closed", c.grade), d({
			type: "trade_closed",
			coin: e,
			grade: c.grade,
			light: c.light,
			medals: c.medals
		}), c.light > 0 && d({
			type: "light_earned",
			amount: c.light,
			source: "house",
			reason: ws(c, t.exitReason),
			event_id: Ts(m.accountId, t.id)
		}), l > a && d({
			type: "level_up",
			level: l
		});
		let b = {
			trade: t,
			d: c,
			h: s,
			rec: o,
			name: L[e]?.name ?? null,
			sym: z(e),
			mode: m.mode,
			unit: P(),
			element: c.elementMinted ? Ds[e] ?? null : null,
			core: e in Ds
		}, x = op({
			trade: t,
			grade: c.grade,
			light: c.light,
			medals: c.medals,
			name: L[e]?.name ?? Sa(e),
			sym: qn(e),
			away: n,
			now: t.closedAt
		});
		x && Gn(x), !n && !oe && dt(b), Nn(!0);
	}
	function dt(e, t = !1) {
		let n = U("#debrief");
		if (Tc(n, e, {
			assetUrl: Gs,
			later: fe,
			onBack: () => {
				n.hidden = !0;
			},
			onReplay: () => {
				n.hidden = !0, ft(e.trade.coin, e.trade.openedAt, e.trade.closedAt);
			}
		}), !t && (m.sound && Po(e.d.grade === "A" ? "flawless" : e.d.grade === "B" ? "disciplined" : e.d.grade === "C" ? "solid" : e.d.grade === "D" ? "loose" : "unstructured"), fe(() => me(e.trade.exitReason === "liquidation" ? "Humiliation" : jm[e.d.grade]), 900), e.element && m.mode === "game")) {
			let t = e.element;
			ve(t), fe(() => {
				let e = r.querySelector(`#vault [data-el="${t}"]`), i = n.querySelector(".d-element .crystal-art") ?? U("#chart");
				e && we(i, e, t);
			}, 900);
		}
	}
	function ft(e, t, n) {
		let r = Math.max(6e4, n - t), a = Math.max(r * .35, 12e5), o = (r + a * 2) / 90, s = hm.reduce((e, t) => Math.abs(Math.log((i[t] ?? 1) / o)) < Math.abs(Math.log((i[e] ?? 1) / o)) ? t : e, hm[0]);
		e !== m.coin && Ke(e), s !== m.interval && qe(s);
		let c = () => Ie.focusRange(Math.floor((t - a) / 1e3), Math.ceil((n + a) / 1e3));
		fe(c, 600), fe(c, 1800);
	}
	let pt = "", mt = null;
	try {
		mt = sessionStorage.getItem("house:hall") || null;
	} catch {}
	let ht = {};
	function gt() {
		let e = m.mode === "game", t = pt.trim().toLowerCase(), n = (e) => !t || e.ticker.toLowerCase().includes(t) || (e.name ?? "").toLowerCase().includes(t) || e.key.toLowerCase().includes(t), r = (t) => {
			let n = e && t.name ? Am(t.name) : Am(t.ticker), r = e && t.name ? Am(Ea(t.key) ? Ta(t.key) : t.ticker) : Ea(t.key) ? "PERP" : "", i = `lot${t.key === m.coin ? " on" : ""}${m.account.positions[t.key] ? " has-pos" : ""}`, a = "<span class=\"spk\" aria-hidden=\"true\"></span>";
			return `<button class="${i}" data-key="${Am(t.key)}"><span class="em">${Zs(t.key, t.hall)}</span>
        <span class="nm"><b>${n}</b><small>${r}</small></span>${e ? "" : a}<span class="px"></span><span class="chg"></span>${e ? a : ""}</button>`;
		}, i = Object.keys(va), a = (e) => e.name ? i.indexOf(e.key) : 999, o = (e, t) => a(e) - a(t) || t.dayNtlVlm - e.dayNtlVlm, s = "";
		if (e) {
			let e = mt && ga.some((e) => e.id === mt) ? mt : L[m.coin]?.hall ?? "coins";
			U("#hallTabs").innerHTML = ga.map((n) => `<button role="tab" class="ht${n.id === e && !t ? " on" : ""}" data-hall="${n.id}" aria-selected="${n.id === e}"><span class="mt">${Zs(n.id, n.id)}</span><small>${xm[n.id] ?? Am(n.title)}</small></button>`).join(""), U("#hallTabs").querySelectorAll(".ht").forEach((e) => e.onclick = () => {
				mt = e.dataset.hall;
				try {
					sessionStorage.setItem("house:hall", mt);
				} catch {}
				gt(), U("#lotList").scrollTop = 0;
			}), s = I.filter((r) => (t ? !0 : r.hall === e) && n(r)).sort(o).map(r).join("");
		} else U("#hallTabs").innerHTML = "", s = ga.map((e) => {
			let i = I.filter((t) => t.hall === e.id && n(t));
			if (!i.length) return "";
			i.sort(o);
			let a = e.title.replace(/^(The |Hall of )/, ""), s = !!t || mt === e.id, c = (U("#lotList").clientHeight || 0) >= 640, l = e.id === "coins" ? c ? 4 : 3 : c ? 3 : 2, u = s ? i : i.filter((e, t) => t < l || e.key === m.coin || !!m.account.positions[e.key]), d = i.length - u.length, f = !t && (d > 0 || mt === e.id) && i.length > l ? `<button class="hall-more${mt === e.id ? " open" : ""}" data-hall="${e.id}" aria-expanded="${mt === e.id}" aria-label="${Am(a)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6"/></svg>${mt === e.id ? "" : `<b>＋${d}</b>`}</button>` : "";
			return `<div class="hall" data-hall="${e.id}"><div class="hall-h">${Zs(e.id, e.id)}${Am(a)} <small>${i.length}</small></div>${u.map(r).join("")}${f}</div>`;
		}).join("");
		let c = U("#lotList"), l = c.scrollTop;
		c.innerHTML = s || "<p class=\"empty\">No lot by that name.</p>", c.scrollTop = l;
		for (let e in ht) delete ht[e];
		c.querySelectorAll(".lot").forEach((e) => {
			ht[e.dataset.key] = {
				px: e.querySelector(".px"),
				chg: e.querySelector(".chg")
			}, e.onclick = () => Ke(e.dataset.key);
		}), c.querySelectorAll(".hall-more").forEach((e) => {
			e.onclick = () => {
				let t = e.dataset.hall;
				mt = mt === t ? null : t;
				try {
					sessionStorage.setItem("house:hall", mt ?? "");
				} catch {}
				gt(), mt && c.querySelector(`.hall[data-hall="${mt}"]`)?.scrollIntoView({ block: "nearest" });
			};
		}), he.observe(c), _t();
	}
	function _t() {
		for (let e in ht) {
			let t = ht[e], n = F[e] ?? L[e]?.markPx;
			t.px.textContent = Om(n);
			let r = Mm(L[e], n);
			t.chg.textContent = Nm(r), t.chg.className = `chg ${r == null ? "" : r >= 0 ? "up" : "dn"}`;
		}
	}
	function vt() {
		U("#intervals").innerHTML = hm.map((e) => `<button data-iv="${e}" class="${e === m.interval ? "on" : ""}">${e}</button>`).join(""), U("#intervals").querySelectorAll("button").forEach((e) => e.onclick = () => qe(e.dataset.iv));
	}
	function yt() {
		let e = U("#conn");
		e.textContent = ie ? "● LIVE" : "● RECONNECTING", e.className = `conn ${ie ? "ok" : "bad"}`;
	}
	let bt = () => Pl(Nl(jl(v, m.account))), xt = "";
	function St() {
		let e = So(lt(m.account.history)), t = e.nextLevelXp - e.levelFloorXp, n = t > 0 ? (e.totalXp - e.levelFloorXp) / t * 100 : 0, r = bt(), i = m.mode === "game" ? `${r.name} ${r.numeral}` : `${r.name.toUpperCase()} ${r.numeral}`, a = `r-${r.name.toLowerCase()}`;
		U("#player").innerHTML = `
      <div class="lvl">LV <b>${e.level}</b></div>
      <div class="xpbar"><div style="width:${n.toFixed(1)}%"></div></div>
      <div class="xptext">${Math.round(e.totalXp)} / ${e.nextLevelXp} ${P()}</div>
      <div class="rank ${a}">${i}</div>`, U("#hud").innerHTML = `
      <div class="medallion"><small>LEVEL</small><b>${e.level}</b></div>
      <div class="hud-text"><div class="title">${i}</div>
        <div class="bar"><div style="width:${n.toFixed(1)}%"></div></div>
        <div class="sub">${Math.round(e.totalXp).toLocaleString()} / ${e.nextLevelXp.toLocaleString()} Light</div></div>`;
		let o = (t) => `
      <div class="cc-portrait"><img src="${Gs("atlas.webp")}" alt="" draggable="false" /></div>
      <div class="cc-body"><h2>ATLAS VEYR${t ? `<button type="button" class="oath-glyph" data-oath aria-label="Your Oath">${kc}</button>` : ""}</h2>
        <div class="cc-lv"><span>LEVEL <b>${e.level}</b></span><em>${Math.round(e.totalXp).toLocaleString()} / ${e.nextLevelXp.toLocaleString()} Light</em></div>
        <div class="cc-bar"><div style="width:${n.toFixed(1)}%"></div></div>
        <div class="cc-rank"><span>RANK</span><b class="${a}">${i}</b></div></div>`;
		xt = o(!1), U("#charcard").innerHTML = o(!0);
	}
	function Ct() {
		let e = lt(m.account.history).slice(-40).reverse();
		U("#medals").innerHTML = Tt(!1), U("#hist").innerHTML = e.length ? `<table>
      <tr><th>LOT</th><th>SIDE</th><th>ENTRY</th><th>EXIT</th><th>HOW</th><th>FUNDING</th><th>P&amp;L</th><th>R</th><th>GRADE</th><th>${P().toUpperCase()}</th></tr>
      ${e.map((e) => {
			let t = e.trade, n = -(t.fundingPaid ?? 0);
			return `<tr>
        <td>${z(t.coin)}</td><td class="${t.side}">${t.side.toUpperCase()} ${t.leverage}×</td>
        <td>${Om(t.entry)}</td><td>${Om(t.exit)}</td><td>${t.exitReason}</td>
        <td class="${n >= 0 ? "up" : "dn"}" title="Funding received (+) or paid (−)">${Dm(n)}</td>
        <td class="${t.realizedPnl >= 0 ? "up" : "dn"}">${Dm(t.realizedPnl)}</td>
        <td>${t.rMultiple == null ? "—" : t.rMultiple.toFixed(2)}</td>
        <td class="g-${e.award.grade}">${e.award.headline}</td><td><b>${Math.round(e.xp)}</b></td></tr>`;
		}).join("")}
    </table>` : "<p class=\"empty\">No missions yet. Set a stop, take a trade, and see what the system thinks of your process.</p>";
	}
	let wt = {
		flawless: "<path d=\"M12 2.5l2.4 7.1 7.1 2.4-7.1 2.4L12 21.5l-2.4-7.1L2.5 12l7.1-2.4z\" fill=\"currentColor\"/>",
		solid: "<path d=\"M12 2.5l2.4 7.1 7.1 2.4-7.1 2.4L12 21.5l-2.4-7.1L2.5 12l7.1-2.4z\"/><circle cx=\"12\" cy=\"12\" r=\"1.8\" fill=\"currentColor\"/>",
		disciplined: "<circle cx=\"12\" cy=\"12\" r=\"8\"/><circle cx=\"12\" cy=\"12\" r=\"2.2\" fill=\"currentColor\"/>",
		loose: "<path d=\"M4 12h16\" /><path d=\"M12 5v14\" opacity=\".4\"/>",
		unstructured: "<path d=\"M5 5l14 14M19 5L5 19\" opacity=\".9\"/>"
	};
	function Tt(e) {
		let t = lt(m.account.history), n = So(t).medalCounts, r = `<div class="cab${e ? " slim" : ""}">${Object.entries(vo).map(([e, t]) => {
			let r = n[e] ?? 0;
			return `<span class="plaque m-${e}${r ? " lit" : ""}" title="${Am(t.name)}">${sc(e)}${r ? "" : `<span class="plock">${ge("<rect x=\"6\" y=\"11\" width=\"12\" height=\"9\" rx=\"1.5\"/><path d=\"M8.5 11V8a3.5 3.5 0 0 1 7 0v3\"/>")}</span>`}<b>${r}</b><small>${Am(t.name)}</small></span>`;
		}).join("")}</div>`;
		if (e) return r;
		let i = t.slice(-3).reverse();
		return `${r}<div class="dcards">${[
			0,
			1,
			2
		].map((e) => {
			let t = i[e];
			if (!t) return "<div class=\"dc ghostcard\" aria-hidden=\"true\"></div>";
			let n = t.trade, r = L[n.coin];
			return `<div class="dc g-${t.award.grade}" title="${Am(t.award.headline)}">
        <svg class="gg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${wt[t.award.grade] ?? ""}</svg>
        <span class="dem">${Zs(n.coin, r?.hall ?? "coins")}</span>
        <span class="dtx"><b class="${n.realizedPnl >= 0 ? "up" : "dn"}">${n.rMultiple == null ? "—" : `${n.rMultiple >= 0 ? "+" : ""}${n.rMultiple.toFixed(2)}R`}</b><i>${t.xp >= 0 ? "+" : ""}${Math.round(t.xp)}</i></span>
        <span class="dmd">${t.medals.map((e) => `<span class="mini m-${e.key}" title="${Am(e.name)}">${sc(e.key)}</span>`).join("")}</span></div>`;
		}).join("")}</div>`;
	}
	let Et = (e) => {
		let t = +e.min || 0, n = +e.max || 100;
		e.style.setProperty("--p", `${Math.max(0, Math.min(100, (+e.value - t) / (n - t || 1) * 100)).toFixed(1)}%`);
	}, Dt = (e) => `${e >= 0 ? "+" : ""}${e.toFixed(1)}%`, Ot = "";
	function kt() {
		let e = Object.values(m.account.positions), t = Ia(m.account, F), n = t - m.account.startingCash;
		U("#acct").innerHTML = `EQUITY <b>${Dm(t)}</b> · FREE <b>${Dm(za(m.account))}</b> · <span class="${n >= 0 ? "up" : "dn"}">${Dm(n)}</span>`, U("#nPos").textContent = e.length ? String(e.length) : "";
		let r = U("#pos"), i = `${m.mode}|${m.account.history.length}|${e.map((e) => [
			e.coin,
			e.side,
			e.qty,
			e.stop,
			e.target,
			e.stopWidenings,
			e.leverage
		].join()).join("|")}`, a = () => {
			for (let t of e) {
				let e = r.querySelector(`tr[data-coin="${t.coin}"]`);
				if (!e) continue;
				let n = F[t.coin], i = Fa(t, n ?? t.entry), a = (t, n, r) => {
					let i = e.querySelector(t);
					i && (i.textContent = n, r != null && (i.className = `${t.slice(1)} ${r}`));
				};
				a(".mark", Om(n)), a(".liq", Om(Pa(t))), a(".marg", Dm(t.margin)), a(".upnl", Dm(i), i >= 0 ? "up" : "dn"), a(".roe", Dt(ao(t, n ?? t.entry)), i >= 0 ? "up" : "dn"), a(".fund", Dm(-t.fundingTotal), -t.fundingTotal >= 0 ? "up" : "dn");
			}
		};
		if (i === Ot) {
			a();
			return;
		}
		if (r.contains(document.activeElement) && !Je) {
			a();
			return;
		}
		Ot = i, r.innerHTML = `${e.length ? `<table>
      <tr><th>LOT</th><th>SIDE</th><th>SIZE</th><th>ENTRY</th><th>MARK</th><th>LIQ</th><th>MARGIN</th><th>uP&amp;L · ROE</th><th>FUNDING</th><th>STOP</th><th>TARGET</th><th>REDUCE</th></tr>
      ${e.map((e) => `<tr data-coin="${e.coin}">
          <td>${z(e.coin)}</td><td class="${e.side}">${e.side.toUpperCase()} ${e.leverage}×</td>
          <td title="${e.qty.toPrecision(5)} ${Am(Sa(e.coin))}">${Dm(e.qty * e.entry, 0)}</td><td>${Om(e.entry)}</td><td class="mark"></td>
          <td class="liq"></td><td class="marg"></td>
          <td><b class="upnl"></b> <small class="roe"></small></td>
          <td class="fund" title="Funding received (+) or paid (−), hourly"></td>
          <td><input class="edit" data-k="stop" value="${e.stop ?? ""}" placeholder="none"/>${e.stopWidenings ? `<em title="stop widenings">W${e.stopWidenings}</em>` : ""}</td>
          <td><input class="edit" data-k="target" value="${e.target ?? ""}" placeholder="none"/></td>
          <td class="acts"><span class="chips">${[
			25,
			50,
			75,
			100
		].map((e) => `<button class="close" data-red="${e / 100}" title="${e === 100 ? "Close it all" : `Close ${e}%`}">${e}</button>`).join("")}</span><input class="amt" type="number" min="0" step="any" placeholder="$" title="Reduce by this much notional, then Enter" aria-label="Reduce by dollars"/></td></tr>`).join("")}
    </table>` : ""}${Tt(e.length > 0)}`, a(), r.querySelectorAll("button[data-red]").forEach((e) => e.onclick = () => {
			let t = e.closest("tr").getAttribute("data-coin"), n = +e.dataset.red;
			n >= 1 ? Qe(t, "sell") : $e(t, n);
		}), r.querySelectorAll("input.amt").forEach((e) => {
			e.onkeydown = (t) => {
				if (t.key !== "Enter") return;
				let n = parseFloat(e.value);
				n > 0 && et(e.closest("tr").getAttribute("data-coin"), n);
			};
		}), r.querySelectorAll("input.edit").forEach((e) => {
			let t = () => {
				let t = e.closest("tr").getAttribute("data-coin"), n = e.value.trim() === "" ? null : parseFloat(e.value);
				if (n != null && !(n > 0)) return G("Enter a price.", !0);
				n !== ((e.dataset.k === "stop" ? m.account.positions[t]?.stop : m.account.positions[t]?.target) ?? null) && (e.dataset.k === "stop" ? it(t, n) : at(t, n));
			};
			e.onkeydown = (n) => {
				n.key === "Enter" && (t(), e.blur());
			}, e.onblur = t;
		});
	}
	let At = "";
	function jt() {
		let e = m.account.orders;
		U("#nOrd").textContent = e.length ? String(e.length) : "";
		let t = U("#ords"), n = `${m.mode}|${e.map((e) => [
			e.id,
			e.price,
			e.qty,
			e.stop,
			e.target
		].join()).join("|")}`, r = () => {
			for (let n of e) {
				let e = t.querySelector(`tr[data-id="${n.id}"] .away`), r = F[n.coin];
				e && (e.textContent = r ? Dt((n.price / r - 1) * 100) : "—");
			}
		};
		if (n === At) {
			r();
			return;
		}
		if (t.contains(document.activeElement) && !Je) {
			r();
			return;
		}
		At = n, t.innerHTML = e.length ? `<table>
      <tr><th>LOT</th><th>SIDE</th><th>TYPE</th><th>PRICE</th><th>AWAY</th><th>SIZE</th><th>STOP</th><th>TARGET</th><th><button class="close" data-cancel-all title="Cancel every order">CANCEL ALL</button></th></tr>
      ${e.slice().reverse().map((e) => `<tr data-id="${e.id}">
        <td>${z(e.coin)}</td><td class="${e.side}">${e.side === "long" ? "BUY" : "SELL"}</td>
        <td>${e.type.toUpperCase()}${e.reduceOnly ? " <span class=\"ro-tag\" title=\"Reduce only\"><svg class=\"roi\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 7h10M4 12h7M4 17h4\"/><path d=\"M15 15l5-5M20 14v-4h-4\"/></svg></span>" : ""}</td>
        <td><input class="edit" data-k="price" value="${e.price}"/></td><td class="away"></td>
        <td title="${e.qty.toPrecision(5)} ${Am(Sa(e.coin))}">${Dm(e.qty * e.price, 0)}</td>
        <td>${e.stop == null ? "—" : Om(e.stop)}</td><td>${e.target == null ? "—" : Om(e.target)}</td>
        <td><button class="close" data-cancel="${e.id}" title="Cancel this order" aria-label="Cancel order">✕</button></td></tr>`).join("")}
    </table>` : "<p class=\"empty\">No open orders.</p>", r(), t.querySelectorAll("button[data-cancel]").forEach((e) => e.onclick = () => nt(e.dataset.cancel)), t.querySelectorAll("button[data-cancel-all]").forEach((e) => e.onclick = rt), t.querySelectorAll("input.edit").forEach((e) => {
			let t = () => {
				let t = e.closest("tr").getAttribute("data-id"), n = m.account.orders.find((e) => e.id === t), r = parseFloat(e.value);
				if (n && r !== n.price) {
					if (!(r > 0)) return e.value = String(n.price), G("Enter a price.", !0);
					tt(t, r) || (e.value = String(n.price));
				}
			};
			e.onkeydown = (n) => {
				if (n.key === "Enter" && (t(), e.blur()), n.key === "Escape") {
					let t = m.account.orders.find((t) => t.id === e.closest("tr").getAttribute("data-id"));
					t && (e.value = String(t.price)), e.blur();
				}
			}, e.onblur = t;
		});
	}
	let Mt = "";
	function Nt() {
		let e = m.account.fills.slice(-100).reverse(), t = `${m.mode}|${m.account.fills.length}|${e[0]?.id ?? ""}`;
		if (t === Mt) return;
		Mt = t;
		let n = (e) => new Date(e).toLocaleTimeString("en-GB", { hour12: !1 });
		U("#fills").innerHTML = e.length ? `<table>
      <tr><th>TIME</th><th>LOT</th><th>DIR</th><th>KIND</th><th>HOW</th><th>PRICE</th><th>SIZE</th><th>FEE</th><th>P&amp;L</th></tr>
      ${e.map((e) => `<tr>
        <td>${n(e.time)}</td><td>${z(e.coin)}</td><td class="${e.dir === "buy" ? "long" : "short"}">${e.dir.toUpperCase()}</td>
        <td>${e.kind === "liquidation" ? "LIQ" : e.kind.toUpperCase()}</td><td>${e.how.toUpperCase()}</td>
        <td>${Om(e.price)}</td><td title="${e.qty.toPrecision(5)} ${Am(Sa(e.coin))}">${Dm(e.qty * e.price, 0)}</td><td>${Dm(e.fee, 3)}</td>
        <td class="${e.pnl == null ? "" : e.pnl >= 0 ? "up" : "dn"}">${e.pnl == null ? "—" : Dm(e.pnl)}</td></tr>`).join("")}
    </table>` : "<p class=\"empty\">No fills yet.</p>";
	}
	let Pt = [
		1,
		2,
		5,
		10,
		100,
		1e3
	], Ft = 0, It = {
		asks: [],
		bids: [],
		dec: 2
	}, Lt = null;
	function Rt(e) {
		return 10 ** (Math.floor(Math.log10(e)) - 4);
	}
	function zt(e) {
		let t = U("#tickSel"), n = Math.max(0, -Math.round(Math.log10(e)));
		t.innerHTML = Pt.map((t, r) => `<option value="${r}">${(e * t).toFixed(Math.max(0, n - 0))}</option>`).join(""), t.value = String(Math.min(m.tickIdx ?? 0, Pt.length - 1));
	}
	function Bt(e, t, n, r, i) {
		let a = [];
		for (let [o, s] of e) {
			let e = o / t, c = +((n ? Math.ceil(e - 1e-9) : Math.floor(e + 1e-9)) * t).toFixed(i), l = a[a.length - 1];
			if (l && l.px === c) l.sz += s, l.ntl += o * s;
			else {
				if (a.length >= r) break;
				a.push({
					px: c,
					sz: s,
					ntl: o * s
				});
			}
		}
		return a;
	}
	function Vt() {
		let e = re[m.coin], t = F[m.coin];
		if (!e || !t) return;
		let n = Rt(t);
		n !== Ft && (Ft = n, zt(n));
		let r = n * Pt[Math.min(m.tickIdx ?? 0, Pt.length - 1)], i = Math.max(0, -Math.floor(Math.log10(r) + 1e-9)), a = Bt(e.asks, r, !0, 11, i + 2), o = Bt(e.bids, r, !1, 11, i + 2);
		It = {
			asks: a,
			bids: o,
			dec: i
		};
		let s = Math.max(...a.map((e) => e.sz), ...o.map((e) => e.sz), 1e-9), c = m.account.orders.filter((e) => e.coin === m.coin), l = (e) => {
			let t = 0;
			return e.map((e) => t += e.sz);
		}, u = {
			ask: l(a),
			bid: l(o)
		}, d = (e, n, i) => {
			let a = c.filter((i) => (i.price < t ? n === "bid" : n === "ask") && Math.abs(i.price - e.px) < r / 2 + 1e-12), o = a.length ? `<em class="mine" title="${a.map((e) => `${e.type} ${e.side === "long" ? "buy" : "sell"} @ ${Om(e.price)}`).join(", ")}"></em>` : "";
			return `<div class="lv ${n}" data-i="${i}" data-p="${e.px}"><i style="width:${(e.sz / s * 100).toFixed(1)}%"></i><span>${o}${Om(e.px)}</span><span>${e.sz.toFixed(3)}</span><span>${u[n][i].toFixed(3)}</span></div>`;
		};
		if (U("#asks").innerHTML = a.map((e, t) => d(e, "ask", t)).reverse().join(""), U("#bids").innerHTML = o.map((e, t) => d(e, "bid", t)).join(""), Ht(), a[0] && o[0]) {
			a[0].px - o[0].px;
			let n = Mm(L[m.coin], t);
			U("#spread").innerHTML = `<b>${Om(t)}</b>${n == null ? "" : `<em class="${n >= 0 ? "up" : "dn"}">${Nm(n)}</em>`}<small>SPREAD ${Om(e.asks[0][0] - e.bids[0][0])} · ${((e.asks[0][0] - e.bids[0][0]) / e.asks[0][0] * 1e4).toFixed(2)} bps</small>`;
		}
	}
	function Ht() {
		let e = U("#bookTip");
		if (r.querySelectorAll("#asks .lv.cum, #bids .lv.cum").forEach((e) => e.classList.remove("cum")), !Lt) {
			e.hidden = !0;
			return;
		}
		let t = Lt.side === "ask" ? It.asks : It.bids;
		if (Lt.i >= t.length) {
			e.hidden = !0;
			return;
		}
		let n = 0, i = 0;
		for (let e = 0; e <= Lt.i; e++) n += t[e].sz, i += t[e].ntl;
		let a = U(Lt.side === "ask" ? "#asks" : "#bids");
		a.querySelectorAll(".lv").forEach((e) => {
			+e.dataset.i <= Lt.i && e.classList.add("cum");
		});
		let o = a.querySelector(`.lv[data-i="${Lt.i}"]`);
		if (!o) {
			e.hidden = !0;
			return;
		}
		e.innerHTML = `<div><span>CUM SIZE</span><b>${n.toFixed(n >= 100 ? 1 : 3)}</b></div><div><span>CUM VALUE</span><b>${Dm(i, 0)}</b></div><div><span>AVG PRICE</span><b>${Om(i / n)}</b></div>`, e.hidden = !1;
		let s = r.getBoundingClientRect(), c = U(".book").getBoundingClientRect(), l = o.getBoundingClientRect(), u = e.offsetWidth, d = c.left - s.left - u - 8;
		e.style.left = `${d >= 4 ? d : c.left - s.left + 8}px`, e.style.top = `${l.top - s.top + (r.scrollTop || 0) - 6}px`;
	}
	function Ut() {
		let e = L[m.coin], t = m.mode === "game", n = e?.hall ?? "coins";
		U("#mkEm").innerHTML = Zs(m.coin, n), U("#mkName").textContent = t && e?.name ? e.name : z(m.coin), U("#mkTicker").textContent = "", U("#mkEpithet").textContent = t ? z(m.coin) : ga.find((e) => e.id === n)?.title ?? "", U("#mkEpithet").title = t ? nm(m.coin, n) : "", U(".mk-name .quote").title = "A perpetual quoted in USDC" + (Ea(m.coin) ? ". It tracks the asset and can drift from the real price outside market hours." : ".");
		let r = U("#mkPerp");
		r.hidden = !Ea(m.coin), r.title = "A perpetual that tracks the asset. It can drift from the real price outside market hours.";
	}
	let Wt = (e) => {
		let t = Math.max(0, Math.floor(e / 1e3));
		return `${String(Math.floor(t / 3600)).padStart(2, "0")}:${String(Math.floor(t / 60) % 60).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
	}, Gt = (e) => e >= 1e9 ? `$${(e / 1e9).toFixed(2)}B` : e >= 1e6 ? `$${(e / 1e6).toFixed(1)}M` : e >= 1e3 ? `$${(e / 1e3).toFixed(0)}K` : `$${e.toFixed(0)}`, Kt = {}, qt = /* @__PURE__ */ new Set();
	function Jt(e) {
		let t = Kt[e];
		qt.has(e) || t && Date.now() - t.at < 6e4 || (qt.add(e), a(e, "1h", 24).then((t) => {
			!c && t.length && (Kt[e] = {
				hi: Math.max(...t.map((e) => e.high)),
				lo: Math.min(...t.map((e) => e.low)),
				at: Date.now()
			}, Yt());
		}).catch(() => {}).finally(() => qt.delete(e)));
	}
	function Yt() {
		let e = L[m.coin], t = ae[m.coin], n = F[m.coin] ?? t?.markPx ?? e?.markPx;
		U("#mkPrice").textContent = Om(n);
		let r = t?.prevDayPx || e?.prevDayPx || 0, i = n && r > 0 ? (n / r - 1) * 100 : null, a = U("#mkChg");
		a.textContent = i == null ? "" : `${Nm(i)} today`, a.className = i == null ? "" : i >= 0 ? "up" : "dn";
		let o = t?.dayNtlVlm || e?.dayNtlVlm || 0, s = t && n ? t.openInterest * n : 0, c = t?.funding;
		Jt(m.coin);
		let l = Kt[m.coin], u = `${c == null ? "—" : `<u class="${c > 0 ? "up" : c < 0 ? "dn" : ""}">${c > 0 ? "+" : ""}${(c * 100).toFixed(4)}%</u>`} <small id="fundCd">${Wt(po())}</small>`;
		if (m.mode === "game") {
			let e = l ? Math.max(l.hi, n ?? 0) : null, t = l ? Math.min(l.lo, n || l.lo) : null;
			U("#mkStats").innerHTML = `
      <div><span>24h High</span><b>${e ? Om(e) : "—"}</b></div>
      <div><span>24h Low</span><b>${t ? Om(t) : "—"}</b></div>
      <div><span>24h Volume</span><b>${o ? Gt(o).replace("$", "") : "—"}</b></div>
      <div><span>Open Interest</span><b>${s ? Gt(s).replace("$", "") : "—"}</b></div>
      <div><span>Funding</span><b title="Hourly rate. Longs pay shorts when it is positive.">${u}</b></div>`;
		} else U("#mkStats").innerHTML = `
      <div><span>MARK</span><b>${Om(n)}</b></div>
      <div><span>ORACLE</span><b title="The index price funding is charged on">${t?.oraclePx ? Om(t.oraclePx) : "—"}</b></div>
      <div><span title="24 hour change">24H CHG</span><b class="${i != null && i < 0 ? "dn" : "up"}">${i == null ? "—" : Nm(i)}</b></div>
      <div><span title="24 hour volume">24H VOL</span><b>${o ? Gt(o) : "—"}</b></div>
      <div><span title="Open interest">OPEN INT.</span><b>${s ? Gt(s) : "—"}</b></div>
      <div><span>FUNDING</span><b title="Hourly rate. Longs pay shorts when it is positive.">${c == null ? "—" : `<u class="${c > 0 ? "up" : c < 0 ? "dn" : ""}">${(c * 100).toFixed(4)}%</u>`} <small id="fundCd">${Wt(po())}</small></b></div>`;
		_t();
		let d = Object.values(m.account.positions).filter((e) => e.stop != null || e.target != null).length;
		U("#watchN").textContent = String(d), U(".gauntlet").classList.toggle("lit", d > 0);
	}
	function Xt() {
		let e = F[m.coin], t = (V === "market" ? null : km(U("#price"))) ?? e, n = km(U("#size")), i = tn(), a = H ? null : km(U("#stop")), o = H ? null : km(U("#target")), s = Ia(m.account, F), c = [];
		if (t && n) {
			let e = n / i, r = n / t;
			if (H) c.push(`<div data-k="fee"><span>${m.mode === "game" ? "Est. Fee" : "Fee"}</span><b>${Dm(n * (V === "limit" ? Oa : Da))}</b></div>`);
			else {
				let i = Pa({
					side: B,
					qty: r,
					entry: t,
					margin: e,
					maxLeverage: R(m.coin)
				});
				if (c.push(`<div data-k="margin"><span>Margin</span><b>${Dm(e)}</b></div>`), c.push(`<div data-k="fee"><span>${m.mode === "game" ? "Est. Fee" : "Fee"}</span><b>${Dm(n * (V === "limit" ? Oa : Da))}</b></div>`), c.push(`<div data-k="liq"><span>${m.mode === "game" ? "Est. Liquidation" : "Liq. price"}</span><b class="liq">${Om(i)}</b></div>`), c.push(`<div data-k="eq"><span>Of equity</span><b>${s > 0 ? (n / s * 100).toFixed(0) : "—"}%</b></div>`), a) {
					let e = Math.abs(t - a) * r, n = e / s * 100;
					c.push(`<div data-k="risk"><span>Risk at stop</span><b class="${n > m.riskPct ? "dn" : "up"}">${Dm(e)} · ${n.toFixed(2)}%</b></div>`), o && c.push(`<div data-k="rr"><span>Reward : Risk</span><b>${(Math.abs(o - t) / Math.abs(t - a)).toFixed(2)}R</b></div>`);
				}
			}
		}
		U("#preview").innerHTML = c.join("");
		let l = H ? null : je(m.coin), u = l ? Lo(l) : null, d = null;
		if (l && t && !a && !H) {
			let e = u ? u / 4 : 0;
			d = zo(l, B, e > 0 ? Math.round(t / e) * e : t);
		}
		let f = U("#stop");
		f.placeholder = d ? an(d.stop) : "", Pe = {
			ghost: d ? d.stop : null,
			zone: !H && !a && t && n ? {
				entry: t,
				side: B
			} : null
		}, Te = d;
		let p = null, h = null;
		if (!H && t && n && s > 0) {
			let e = {
				side: B,
				entry: t,
				stop: a,
				target: o,
				qty: n / t,
				leverage: i
			}, r = {
				equity: s,
				tradesToday: Me()
			};
			p = ts(e, r, _, u), h = a || !d ? p : ts({
				...e,
				stop: d.stop
			}, r, _, u);
		}
		let g = !p || !h ? {
			stop: null,
			size: null,
			target: null
		} : {
			stop: a ? p.stop.ok : null,
			size: p.size.code === "no_stop" ? h.size.code !== "no_stop" && !h.size.ok || p.size.detail.leverage > p.size.detail.maxLeverage ? !1 : null : p.size.ok,
			target: o ? p.target.ok : null
		};
		Ce(g);
		let v = p ? rs(p, _) : null, y = !!v && v.total > 0, b = !!p && !p.stop.ok, x = !!p && (p.size.code === "no_stop" ? g.size === !1 : !p.size.ok), S = !!p && !p.target.ok;
		U("label.stop").dataset.state = b ? "broken" : g.stop ? "ok" : "", U(".sizef").dataset.state = x ? "broken" : "";
		let C = U("#riskbox");
		if (p && h && m.mode === "game") {
			let e = a ?? d?.stop ?? null, r = e == null ? null : Math.abs(t - e) * (n / t), i = !!h.size.detail.riskPct && h.size.detail.riskPct > _.riskPct * 1.02;
			C.hidden = !1, C.className = `riskbox${y ? " warm" : ""}`, C.innerHTML = `<div><span><i class="rb-ico"></i>Account balance (paper)</span><b>${s.toLocaleString("en-US", { maximumFractionDigits: 0 })} USDC</b></div>
        <div><span>Max risk (${+_.riskPct.toFixed(2)}%)</span><b>${(s * _.riskPct / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })} USDC</b></div>
        <div class="${i ? "bad" : ""}"><span>Est. plan risk</span><b>${r == null ? "—" : `${r.toLocaleString("en-US", { maximumFractionDigits: 0 })} USDC (${(r / s * 100).toFixed(1)}%)`}</b></div>`;
		} else C.hidden = !0;
		let w = U("#gate"), T = U("#place"), E = y && m.mode === "game";
		if (w.hidden = !E, T.hidden = E, r.querySelector(".ora").classList.toggle("gated", !!y), E && v && p && h) {
			Ee = b ? "stop" : x ? "size" : S ? "target" : null, De = v.total;
			let e = U("#fix");
			e.hidden = !Ee, e.textContent = Ee === "stop" ? "Set my stop" : Ee === "size" ? "Size to my Oath" : "Set a target", e.classList.toggle("fix-" + B, !0), U("#take").textContent = `Take it anyway  −${v.total} Light`, U("#take").classList.toggle("only", !Ee);
			let t = Ls(v, h.size.detail.riskPct == null ? null : h.size.detail.riskPct / _.riskPct);
			t && t !== Oe && (Oe = t, Fe(t));
		} else if (Ee = null, De = 0, Oe) {
			let e = !!p && !y;
			Oe = "", e && Fe(Rs);
		}
		let D = U("#sizeEq");
		D.textContent = t && n ? `≈ ${(n / t).toFixed(t >= 1e3 ? 4 : t >= 10 ? 3 : 2)} ${z(m.coin)}` : "";
		let O = U("#sizePct");
		if (document.activeElement !== O) {
			let e = za(m.account) * .98 / (1 / i + Da);
			O.value = String(n && e > 0 ? Math.max(0, Math.min(100, Math.round(n / e * 100))) : 0);
		}
		Et($t), Et(U("#sizePct")), U("#checks").querySelectorAll("i").forEach((e, t) => {
			let n = [
				g.stop,
				g.size,
				g.target
			][t];
			e.className = n === !0 ? "ok" : n === !1 ? "bad" : "";
		}), Ie.refreshLines();
	}
	function Zt() {
		Yt(), Vt(), kt(), jt(), Xt(), Nn(!1), oe && Date.now() - se > 800 && (se = Date.now(), oe.update());
	}
	function Qt() {
		vt(), yt(), St(), Ct(), Nt(), Zt(), U("#sound").textContent = m.sound ? "🔊" : "🔈";
	}
	let $t = U("#lev"), en = U("#levn");
	function tn() {
		let e = R(m.coin), t = Math.round(parseFloat(en.value));
		return Number.isFinite(t) ? Math.min(e, Math.max(1, t)) : Math.min(5, e);
	}
	function nn(e, t) {
		let n = R(m.coin), r = Math.min(n, Math.max(1, Math.round(e) || 1));
		$t.max = en.max = String(n), $t.value = en.value = String(r), $t.title = en.title = `Max ${n}×`, t && (m.lev = r, ne());
	}
	function rn() {
		nn(m.lev ?? 5, !1);
	}
	let an = (e) => String(+e.toPrecision(5));
	function on() {
		let e = U("#place"), t = V === "market" ? "MARKET" : V.toUpperCase(), n = B.toUpperCase();
		e.textContent = H ? `REDUCE · ${t} · ${n}` : m.mode === "game" ? V === "market" ? `WRITE PLAN · ${n}` : `SET ${t} PLAN · ${n}` : `PLACE ${t} ${n}`, e.className = `place ${B}`;
	}
	function sn(e) {
		B = e, U("#long").className = e === "long" ? "on" : "", U("#short").className = e === "short" ? "on" : "", on(), Xt();
	}
	function cn(e, t = !1) {
		V = e, t && (m.type = e, ne()), r.querySelectorAll("#otype button").forEach((t) => t.classList.toggle("on", t.dataset.t === e)), U("#priceRow").hidden = e === "market";
		let n = U("#price");
		e !== "market" && !km(n) && F[m.coin] && (n.value = an(F[m.coin])), on(), Xt();
	}
	function ln(e) {
		H = e;
		let t = U("#reduceOnly");
		t.setAttribute("aria-pressed", String(e)), t.classList.toggle("on", e), U(".ticket").classList.toggle("ro-on", e);
		let n = m.account.positions[m.coin];
		e && n && (B = n.side === "long" ? "short" : "long"), sn(B);
	}
	function un(e, t) {
		if (!Number.isFinite(t) || !(t > 0)) return;
		e === "price" && V === "market" && cn("limit", !0), e !== "price" && H && ln(!1);
		let n = r.querySelector(`#${e}`);
		n && (n.value = an(t), n.dispatchEvent(new Event("input", { bubbles: !0 })), n.dispatchEvent(new Event("change", { bubbles: !0 })));
	}
	U("#long").onclick = () => sn("long"), U("#short").onclick = () => sn("short"), r.querySelectorAll("#otype button").forEach((e) => e.onclick = () => cn(e.dataset.t, !0)), U("#reduceOnly").onclick = () => ln(!H), r.querySelectorAll("button[data-px]").forEach((e) => e.onclick = () => {
		let t = re[m.coin], n = e.dataset.px === "bid" ? t?.bids[0]?.[0] : e.dataset.px === "ask" ? t?.asks[0]?.[0] : F[m.coin];
		n && un("price", n);
	}), $t.oninput = () => {
		nn(+$t.value, !0), Xt();
	}, en.oninput = () => {
		let e = parseFloat(en.value);
		e >= 1 && ($t.value = String(Math.min(R(m.coin), Math.round(e))), m.lev = Math.round(e), ne()), Xt();
	}, en.onchange = () => {
		nn(parseFloat(en.value), !0), Xt();
	}, [
		"#size",
		"#stop",
		"#target",
		"#price"
	].forEach((e) => U(e).oninput = Xt);
	let dn = U("#risk");
	dn.value = String(+_.riskPct.toFixed(2));
	function fn() {
		tn() > _.maxLeverage && nn(_.maxLeverage, !0);
		let e = F[m.coin], t = (V === "market" ? null : km(U("#price"))) ?? e, n = km(U("#stop"));
		if (!t || !n) return G("Set a stop first. Sizing starts from where you are wrong.", !0);
		let r = lo(Ia(m.account, F), m.riskPct, t, n), i = tn(), a = za(m.account) * .98 / (1 / i + Da), o = Math.min(r, a);
		U("#size").value = o.toFixed(0), r > a && G(`Full ${m.riskPct}% risk needs ${Dm(r, 0)} notional; your collateral carries ${Dm(a, 0)} at ${i}×. Sized down. Risk less than planned is fine.`, !0), Xt();
	}
	U("#sizeRisk").onclick = fn, U("#fix").onclick = () => {
		let e = (V === "market" ? null : km(U("#price"))) ?? F[m.coin];
		if (Ee === "stop") Te && un("stop", Te.stop), U("#stop").focus();
		else if (Ee === "size") fn();
		else if (Ee === "target") {
			let t = km(U("#stop"));
			e && t && un("target", e + (B === "long" ? 1 : -1) * 2 * Math.abs(e - t)), U("#target").focus();
		}
	}, U("#take").onclick = () => Xe(De), U("#stop").addEventListener("keydown", (e) => {
		let t = e;
		t.key === "Tab" && !t.shiftKey && !U("#stop").value && Te && un("stop", Te.stop);
	}), U("#sizePct").oninput = (e) => {
		let t = e.target.value / 100, n = za(m.account) * .98 / (1 / tn() + Da);
		U("#size").value = t > 0 && n > 0 ? String(Math.floor(n * t)) : "", Xt();
	}, U("#place").onclick = () => Xe(), U("#sound").onclick = () => {
		m.sound = !m.sound, ne(), Qt();
	}, r.appendChild(U("#bookTip")), U("#tickSel").onchange = (e) => {
		m.tickIdx = +e.target.value, ne(), Vt();
	};
	for (let e of ["#asks", "#bids"]) {
		let t = U(e), n = e === "#asks" ? "ask" : "bid";
		t.onclick = (e) => {
			let t = e.target.closest(".lv");
			t && un("price", +t.dataset.p);
		}, t.onmouseover = (e) => {
			let t = e.target.closest(".lv");
			t && (Lt = {
				side: n,
				i: +t.dataset.i
			}, Ht());
		}, t.onmouseleave = () => {
			Lt = null, Ht();
		};
	}
	let pn = 0;
	U("#reset").onclick = () => {
		let e = U("#reset");
		Date.now() - pn < 3e3 ? (m.account = ka(), m.accountId = Es(), v = fs(), N(), y = Ms(null, Date.now()), te(), be(), ne(), J(), Je = !0, Qt(), Je = !1, e.textContent = "RESET", G("Fresh account: $10,000 paper. XP history cleared.")) : (pn = Date.now(), e.textContent = "CLICK AGAIN TO WIPE", fe(() => e.textContent = "RESET", 3e3));
	}, rn(), K(), be(), Se(), Qt();
	let mn = !1;
	async function hn() {
		if (!(mn || c)) {
			mn = !0;
			try {
				let e = !1;
				for (let t of Object.values(m.account.positions)) {
					let n = Date.now();
					if (no(t, n) < 1) continue;
					let r = ae[t.coin]?.oraclePx || F[t.coin];
					if (!r) continue;
					let i = null;
					try {
						let e = await fo(t.coin, t.lastFundingAt - 1);
						if (c) return;
						i = ro(m.account, t.coin, e, r), i.hours === 0 && n % 36e5 > 6e5 && ae[t.coin] && (i = io(m.account, t.coin, ae[t.coin].funding, r, n));
					} catch {
						if (c) return;
						ae[t.coin] && (i = io(m.account, t.coin, ae[t.coin].funding, r, n));
					}
					i && i.hours > 0 && (m.account = i.account, e = !0);
				}
				e && (ne(), Je = !0, Qt(), Je = !1);
			} finally {
				mn = !1;
			}
		}
	}
	async function gn() {
		try {
			let e = await uo();
			if (c) return;
			ae = e, Yt(), hn();
		} catch {}
	}
	gn();
	let _n = window.setInterval(() => void gn(), 2e4), vn = window.setInterval(() => {
		let e = r.querySelector("#fundCd");
		e && (e.textContent = Wt(po()));
	}, 1e3);
	l.push(() => {
		clearInterval(_n), clearInterval(vn);
	}), cn(V), q().then(J), wa().then((e) => {
		c || (I = e, L = Object.fromEntries(e.map((e) => [e.key, e])), !L[m.coin] && !m.account.positions[m.coin] && Ke("BTC"), rn(), gt(), Ut(), Zt());
	}).catch(() => {
		c || G("Could not load the market list. Showing the core four.", !0);
	});
	let yn = null, bn = !1;
	function xn() {
		m.riskPct = _.riskPct;
		let e = r.querySelector("#risk");
		e && (e.value = String(+_.riskPct.toFixed(2))), tn() > _.maxLeverage && nn(_.maxLeverage, !0), Xt(), Zt(), Xn();
	}
	function Sn(e) {
		yn?.close(), bn = e, r.dataset.oathup = "";
		let t = Date.now();
		yn = Wc(r, {
			oath: _,
			now: t,
			first: e,
			view: m.mode === "game" ? "game" : "advanced",
			open: Yo(_, t),
			equity: Ia(m.account, F),
			card: xt,
			async onSwear(e) {
				let t = Xo(_, e, Date.now());
				return t.ok ? (_ = t.oath, await $o(n, _), xn(), u("oath_sworn", `${_.riskPct}/${_.maxLeverage}/${_.tradesPerDay}`), _) : (G("The Oath cannot be rewritten yet.", !0), null);
			},
			onDone(t) {
				yn = null, r.removeAttribute("data-oathup"), t && Fe(e ? rm.welcome : rm.oathSworn);
			}
		});
	}
	r.addEventListener("click", (e) => {
		e.target.closest("[data-oath], #oathBtn") && Sn(!1);
	});
	let Cn = () => {
		let e = So(lt(m.account.history));
		return {
			account: m.account,
			plans: v,
			oath: _,
			trials: y,
			chestOpened: !!y.chestOpened,
			daily: { today: S().grade ?? null },
			level: {
				level: e.level,
				totalXp: e.totalXp,
				floorXp: e.levelFloorXp,
				nextXp: e.nextLevelXp
			},
			equityNow: Ia(m.account, F),
			now: Date.now()
		};
	}, wn = () => {
		let e = So(lt(m.account.history)), t = bt();
		return {
			catalog: I.map((e) => ({
				key: e.key,
				ticker: e.ticker,
				hall: e.hall,
				name: e.name,
				hip3: Ea(e.key),
				prevDayPx: e.prevDayPx,
				dayNtlVlm: e.dayNtlVlm,
				markPx: e.markPx
			})),
			marks: F,
			ctxs: ae,
			hall: mt ?? L[m.coin]?.hall ?? "coins",
			alerts: C,
			orders: m.account.orders,
			vault: { ...h },
			character: Tn(e, t),
			alertCap: Hf(g),
			daily: {
				yesterday: Ad(S(), S().date),
				today: S().grade ?? null,
				traders: null
			},
			now: Date.now()
		};
	}, Tn = (e, t) => ({
		name: "ATLAS VEYR",
		level: e.level,
		totalXp: e.totalXp,
		floorXp: e.levelFloorXp,
		nextXp: e.nextLevelXp,
		rank: `${t.name} ${t.numeral}`
	}), En = () => {
		let e = So(lt(m.account.history)), t = bt();
		return {
			vault: { ...h },
			relics: g.map((e) => ({ ...e })),
			rank: {
				index: t.index,
				name: t.name,
				numeral: t.numeral
			},
			character: Tn(e, t)
		};
	}, Dn = () => {
		let e = S(), t = So(lt(m.account.history));
		return {
			date: e.date,
			pick: ad(e.date),
			record: e,
			oath: _,
			character: Tn(t, bt()),
			crowd: null,
			speeds: Wf(Zu, g)
		};
	}, On = () => {
		r.querySelector(".gamenav button[data-room=\"codex\"]")?.classList.toggle("dot", sl(A));
	};
	function kn() {
		let e = al(A, du(v, m.account));
		return e.fresh.length ? (A = e.store, ee(), On(), W?.kind === "codex" && Nn(!0), e.fresh) : [];
	}
	let An = () => mu({
		account: m.account,
		plans: v,
		oath: _,
		store: A,
		character: Tn(So(lt(m.account.history)), bt()),
		now: Date.now()
	});
	async function jn(e) {
		let t = e.tradeId ?? "";
		if (M[t]) return M[t];
		if (!e.coin || e.openedAt == null || e.closedAt == null) throw Error("no trade");
		let r = qp(e.openedAt, e.closedAt), a = i[r] ?? 9e5, s = Math.max(a * 3, (e.closedAt - e.openedAt) * .8), c = (await o(e.coin, r, e.openedAt - s, e.closedAt + s)).slice(-160);
		if (!c.length) throw Error("no candles");
		M[t] = {
			interval: r,
			bars: c
		};
		let l = Object.keys(M).slice(-10);
		M = Object.fromEntries(l.map((e) => [e, M[e]]));
		try {
			Promise.resolve(n.set(j, JSON.parse(JSON.stringify(M)))).catch(() => {});
		} catch {}
		return M[t];
	}
	kn();
	function Mn() {
		try {
			W?.destroy();
		} catch {}
		W = null, ue?.remove(), ue = null;
	}
	function Nn(e) {
		if (!W || c) return;
		let t = Date.now();
		if (!e && t - de < 1e3) return;
		de = t;
		let n = Cn();
		W.kind === "daily" ? W.update(Dn()) : W.kind === "forge" ? W.update(En()) : W.kind === "codex" ? W.update(An()) : W.kind === "markets" ? W.update(uu(wn())) : W.kind === "portfolio" ? W.update(Gl(n)) : W.update(tu(n));
	}
	function Pn(e) {
		let t = m.account.history, n = t.findIndex((t) => t.id === e), r = v.closed.find((t) => t.id === e);
		if (n < 0 || !r) return;
		let i = t[n], a = Ss(i, r.rec, _, t.slice(0, n)), o = i.coin;
		dt({
			trade: i,
			d: r.debrief,
			h: a,
			rec: r.rec,
			name: L[o]?.name ?? null,
			sym: z(o),
			mode: m.mode,
			unit: P(),
			element: r.debrief.elementMinted ? Ds[o] ?? null : null,
			core: o in Ds
		}, !0);
	}
	let Fn = U("#roomHost"), In = () => {
		Fn.style.top = `${Math.max(0, Math.round(U(".topbar").getBoundingClientRect().bottom))}px`;
	};
	Fn.style.setProperty("--rh-bg", `url('${Gs("hall.webp")}')`), Fn.style.backgroundImage = `linear-gradient(to bottom, rgba(6,7,11,.55), rgba(6,7,11,0) 18%, rgba(6,7,11,0) 70%, rgba(6,7,11,.6)), url('${Gs("hall.webp")}')`;
	let Ln = new ResizeObserver(() => {
		Fn.hidden || In();
	});
	Ln.observe(U(".topbar")), l.push(() => {
		Ln.disconnect(), Mn();
	});
	function Rn(e) {
		if (!yn && (e !== le || e !== "trade" && !W)) {
			le = e;
			try {
				sessionStorage.setItem("house:room", e);
			} catch {}
			if (r.dataset.room = e, r.querySelectorAll(".gamenav button[data-room]").forEach((t) => {
				let n = t.dataset.room === (e === "daily" ? "markets" : e);
				t.classList.toggle("on", n), n ? t.setAttribute("aria-current", "page") : t.removeAttribute("aria-current");
			}), Mn(), e === "portfolio" || e === "missions" || e === "markets" || e === "daily" || e === "forge" || e === "codex") {
				r.scrollTop = 0, window.scrollTo(0, 0), In(), Fn.hidden = !1, ue = document.createElement("div"), ue.className = "roomstage", Fn.appendChild(ue);
				let t = Cn();
				if (de = Date.now(), e === "codex") {
					let e = $p(ue, An(), { loadCandles: jn });
					W = Object.assign(e, { kind: "codex" }), A = ll(A, Date.now()), ee(), On();
				} else if (e === "forge") {
					let e = Rp(ue, En(), { forge: ye });
					W = Object.assign(e, { kind: "forge" });
				} else if (e === "daily") {
					let e = Wd(ue, Dn(), {
						loadCandles: async (e) => {
							let t = await o(e.coin, "4h", e.startMs, e.endMs - 1);
							if (!od(e, t)) throw Error("session incomplete");
							return t;
						},
						save: x,
						seal(e, t) {
							x(e);
							let n = ol(A, e.date, t.result.kind === "stood_aside", Date.now());
							n.fresh.length && (A = n.store, ee(), On()), Fe((t.result.kind === "stood_aside" ? "You stood aside. The House calls that a calm hand." : `The Daily Chart is sealed: ${t.grade}.`) + (n.fresh.length ? ` ${pl}` : "")), t.light > 0 && d({
								type: "light_earned",
								amount: t.light,
								source: "house",
								reason: t.reason,
								event_id: wd(e.date)
							}), Nn(!0);
						}
					});
					W = Object.assign(e, { kind: "daily" });
				} else if (e === "markets") {
					let e = Wu(ue, uu(wn()), {
						pickLot(e) {
							mt = L[e]?.hall ?? mt, Ke(e), Rn("trade");
						},
						pickHall(e) {
							mt = e;
							try {
								sessionStorage.setItem("house:hall", e);
							} catch {}
						},
						setAlert: Ue,
						removeAlert: We,
						store: n,
						openDaily: () => Rn("daily"),
						candles: (e) => a(e, "1h", 24)
					});
					W = Object.assign(e, { kind: "markets" });
				} else if (e === "portfolio") {
					let e = ef(ue, Gl(t), { openDebrief: Pn });
					W = Object.assign(e, { kind: "portfolio" });
				} else {
					let e = lf(ue, tu(t), {
						openReceipt: () => {},
						openChest: xe,
						openDaily: () => Rn("daily")
					});
					W = Object.assign(e, { kind: "missions" });
				}
			} else Fn.hidden = !0;
		}
	}
	r.querySelectorAll(".gamenav button[data-room]").forEach((e) => {
		e.disabled || (e.onclick = () => Rn(e.dataset.room));
	});
	function zn() {
		return le !== "portfolio" && le !== "missions" && le !== "markets" && le !== "daily" && le !== "forge" && le !== "codex" ? !1 : (le === "markets" && W?.escape?.() || Rn(le === "daily" ? "markets" : "trade"), !0);
	}
	function Bn(e, t = !1) {
		m.mode = e, r.dataset.mode = e, r.querySelectorAll(".modes button").forEach((t) => t.classList.toggle("on", t.dataset.mode === e)), U(".brand-name").textContent = e === "game" ? "THE HOUSE" : "The House", U(".brand-sub").textContent = e === "game" ? "ATLAS VEYR" : "ADVANCED VIEW", U(".lots-title").textContent = e === "game" ? "AUCTION FLOOR" : "Markets", U("#lotSearch").placeholder = e === "game" ? "Search lots" : "Search lots: BTC, NVDA, gold…", U("#mkStats").parentElement === U(e === "game" ? ".mk-head" : ".market") || U(e === "game" ? ".mk-head" : ".market").appendChild(U("#mkStats")), U(".ticket-title").textContent = e === "game" ? "PAPER TRADE PLAN" : "Order", Le(), sn(B), gt(), Ut(), Qt(), yn && Sn(bn), t && (ne(), u("mode", e));
	}
	r.querySelectorAll(".modes button").forEach((e) => e.onclick = () => Bn(e.dataset.mode, !0));
	function Vn(e) {
		r.querySelectorAll("[data-pane]").forEach((t) => t.hidden = t.dataset.pane !== e), r.querySelectorAll("[data-desk]").forEach((t) => t.classList.toggle("on", t.dataset.desk === e));
	}
	r.querySelectorAll("[data-desk]").forEach((e) => e.onclick = () => Vn(e.dataset.desk)), U("#lotSearch").oninput = (e) => {
		pt = e.target.value, gt();
	}, Bn(m.mode === "advanced" ? "advanced" : "game"), _.setAt === 0 ? Sn(!0) : Fe(m.account.history.length ? rm.welcomeBack : rm.welcome);
	try {
		let e = sessionStorage.getItem("house:room");
		_.setAt !== 0 && (e === "portfolio" || e === "missions" || e === "markets" || e === "daily" || e === "forge" || e === "codex") && Rn(e);
	} catch {}
	u("page_view", m.mode);
	let Hn = !1;
	try {
		Hn = sessionStorage.getItem("house:desk") === "1";
	} catch {}
	let Un = () => document.head.querySelector("meta[name=\"viewport\"]"), Wn = Un()?.content ?? "width=device-width, initial-scale=1.0";
	function Gn(e) {
		w = cp(w, e), E(), oe && oe.showCalls([e]);
	}
	function Kn() {
		let e = new Map(m.account.history.map((e) => [e.id, e.coin]));
		return v.closed.slice(-5).reverse().map((t) => ({
			coin: e.get(t.id) ?? t.rec.coin,
			grade: t.debrief.grade,
			light: t.debrief.light,
			r: t.debrief.facts.r,
			t: t.closedAt
		}));
	}
	let qn = (e) => Ea(e) ? Ta(e) : `${Sa(e)}-PERP`, Jn = {
		snap: () => ({
			account: m.account,
			marks: F,
			byKey: L,
			catalog: I,
			oath: _,
			relics: g,
			calls: w,
			plans: v,
			alerts: C,
			alertCap: Hf(g),
			sound: m.sound,
			armed: T.armed,
			equity: Ia(m.account, F),
			tradesToday: Me(),
			connected: ie,
			get rank() {
				return bt();
			},
			get level() {
				let e = So(lt(m.account.history));
				return {
					level: e.level,
					totalXp: e.totalXp,
					floorXp: e.levelFloorXp,
					nextXp: e.nextLevelXp
				};
			},
			get plaques() {
				return Zl(y, Date.now());
			},
			get streak() {
				return Bl(jl(v, m.account));
			},
			get grades() {
				return Kn();
			},
			atr(e) {
				let t = je(e);
				return t ? Lo(t) : null;
			},
			sym: qn,
			nameOf: (e) => L[e]?.name ?? Sa(e)
		}),
		tighten(e, t) {
			let n = m.account.positions[e], r = F[e];
			if (!n || !r) return "No price yet.";
			let i = qf(n.side, n.stop, t, r);
			return i.ok ? (it(e, t), null) : i.reason === "widen" ? "Widen only at the House" : "Too close to the market.";
		},
		closeAll: (e) => Qe(e, "sell"),
		reduceHalf: (e) => $e(e, .5),
		cancelOrder: nt,
		seal(e) {
			let t = Ja(m.account, {
				coin: e.coin,
				side: e.side,
				type: e.type,
				price: e.entry,
				reduceOnly: !1,
				notional: e.notional,
				leverage: e.leverage,
				maxLeverage: R(e.coin),
				stop: e.stop,
				target: e.target,
				riskPerTradePct: m.riskPct
			}, re[e.coin], F);
			return t.ok ? (m.account = t.value.account, t.value.status === "working" && t.value.orderId && (T.armed = [...T.armed, t.value.orderId].slice(-20), D()), Ze(t.value.events), Fe(rm.placed), u("trade_placed", e.coin), Ye(), {
				ok: !0,
				orderId: t.value.orderId ?? null
			}) : {
				ok: !1,
				error: t.error
			};
		},
		setAlert: Ue,
		removeAlert: We,
		candles: (e) => je(e, !0),
		desk: () => Qn(!0),
		setSound: (e) => {
			m.sound = e, ne(), Qt();
		},
		seen(e) {
			let t = !1;
			for (let n of w) e.includes(n.id) && !n.seen && (n.seen = !0, t = !0);
			t && E();
		}
	}, Yn = () => !Hn && _.setAt !== 0 && r.clientWidth > 0 && r.clientWidth <= 600;
	function Xn() {
		if (c) return;
		let e = Yn();
		if (e && !oe) {
			oe = Op(r, Jn), r.dataset.field = "";
			let e = dp(w, Date.now()), t = !1;
			for (let n of w) !n.seen && !e.includes(n) && Date.now() - n.t >= 432e5 && (n.seen = !0, t = !0);
			t && E(), e.length && oe.showCalls(e);
		} else !e && oe && (oe.destroy(), oe = null, r.removeAttribute("data-field"));
		let t = r.querySelector("#toField");
		t && (t.hidden = !(Hn && _.setAt !== 0 && (screen.width <= 600 || r.clientWidth <= 600 || Zn)));
	}
	let Zn = !1;
	function Qn(e) {
		Hn = e;
		try {
			e ? sessionStorage.setItem("house:desk", "1") : sessionStorage.removeItem("house:desk");
		} catch {}
		if (!t.onExit) {
			let t = Un();
			t && (e && screen.width <= 600 ? (Zn = !0, t.content = "width=1280") : (Zn = !1, t.content = Wn));
		}
		Xn(), e && Bn(m.mode);
	}
	{
		let e = r.querySelector("#toField");
		e && (e.onclick = () => Qn(!1));
		let n = new ResizeObserver(() => Xn());
		if (n.observe(r), l.push(() => {
			n.disconnect(), oe?.destroy(), oe = null;
		}), Hn && !t.onExit && screen.width <= 600) {
			Zn = !0;
			let e = Un();
			e && (e.content = "width=1280"), l.push(() => {
				let e = Un();
				e && (e.content = Wn);
			});
		}
	}
	function $n() {
		O || c || (T.lastSeen = Date.now(), T.armed = tp(m.account.orders, T.armed), D());
	}
	async function er(e) {
		let t = Object.keys(m.account.positions);
		if (!t.length || !(e > 0) || Date.now() - e < 12e4) {
			O = !1;
			return;
		}
		O = !0;
		try {
			let n = mp(Date.now() - e), r = new Promise((e, t) => fe(() => t(/* @__PURE__ */ Error("away replay timed out")), 9e3)), i = await Promise.race([Promise.all(t.map(async (t) => [t, await o(t, n, e, Date.now())])), r]);
			if (c) return;
			let a = gp(m.account, Object.fromEntries(i.map(([e, t]) => [e, t.map((e) => ({
				...e,
				time: e.time * 1e3
			}))])), e);
			for (let e of a) {
				let t = _p(m.account, e);
				t && (m.account = t.account, ut(e.coin, t.trade, !0));
			}
			a.length && Ye();
		} catch {} finally {
			O = !1, c || (Ge(), $n());
		}
	}
	{
		er(T.lastSeen);
		let e = window.setInterval($n, 15e3);
		l.push(() => clearInterval(e));
		let t = () => {
			document.visibilityState === "hidden" ? $n() : !O && T.lastSeen > 0 && Date.now() - T.lastSeen > 12e4 && er(T.lastSeen);
		}, n = () => $n();
		document.addEventListener("visibilitychange", t), window.addEventListener("pagehide", n), l.push(() => {
			document.removeEventListener("visibilitychange", t), window.removeEventListener("pagehide", n), $n();
		});
	}
	Xn();
	function tr() {
		d({ type: "exit" }), t.onExit?.();
	}
	if (t.onExit) {
		let e = r.querySelector("#leave");
		e && (e.onclick = tr);
		let t = (e) => {
			if (e.key !== "Escape") return;
			if (e.stopPropagation(), yn && !bn) {
				yn.close(), yn = null, r.removeAttribute("data-oathup");
				return;
			}
			let t = U("#debrief");
			if (!t.hidden) {
				t.hidden = !0;
				return;
			}
			zn() || tr();
		};
		document.addEventListener("keydown", t, !0), l.push(() => document.removeEventListener("keydown", t, !0));
		let n = (e) => e.stopPropagation();
		r.addEventListener("keydown", n), r.addEventListener("keyup", n), l.push(() => {
			r.removeEventListener("keydown", n), r.removeEventListener("keyup", n);
		});
	}
	if (!t.onExit) {
		let e = (e) => {
			if (e.key !== "Escape" || yn || le !== "portfolio" && le !== "missions" && le !== "markets" && le !== "daily") return;
			let t = U("#debrief");
			if (!t.hidden) {
				t.hidden = !0, e.preventDefault();
				return;
			}
			zn() && e.preventDefault();
		};
		document.addEventListener("keydown", e), l.push(() => document.removeEventListener("keydown", e));
	}
	return l.push(kf(r, {
		back: () => {
			if (yn) return bn ? !0 : (yn.close(), yn = null, r.removeAttribute("data-oathup"), !0);
			let e = U("#debrief");
			return e.hidden ? zn() : (e.hidden = !0, !0);
		},
		room: () => le,
		leave: t.onExit ? tr : void 0
	})), {
		fillTicket: un,
		moveOrder: tt,
		cancelOrder: nt,
		vaultAdd: ve,
		flyShards: we,
		getRelics: () => g.map((e) => ({ ...e })),
		unmount() {
			if (!c) {
				c = !0, Be.close(), ce.forEach((e) => clearTimeout(e)), ce.clear(), clearTimeout(pe), clearTimeout(Ne);
				for (let e of l.splice(0)) try {
					e();
				} catch {}
				try {
					"speechSynthesis" in window && speechSynthesis.cancel();
				} catch {}
				Fo(), r.replaceChildren(), r.classList.remove("house-root"), r.removeAttribute("data-mode"), r.removeAttribute("data-embedded"), r.removeAttribute("data-room"), r.removeAttribute("data-oathup"), r.style.removeProperty("--frame");
			}
		}
	};
}
//#endregion
export { Pm as mountHouse };
