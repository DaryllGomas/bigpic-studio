export async function createCutin(canvas, assets = null) {
const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });
const VS = `#version 300 es
in vec2 p; out vec2 uv; void main(){ uv = p*.5+.5; gl_Position = vec4(p,0.,1.); }`;
const FS = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D tex, previousTex; uniform float crossfade, shimmer, pearl; uniform vec2 res, texRes;
uniform float zoom, rot, aberr, invertMode, flash, lines, blurAmt, bars, ringR, ringA, glow, t, bright;
uniform vec2 focus, shake, lineC, blurC, ringC;
vec2 cover(vec2 u){ // fit the painting to cover the screen, zoom/rotate around the focus point
  float sa = res.x/res.y, ta = texRes.x/texRes.y; vec2 s = sa > ta ? vec2(1., ta/sa) : vec2(sa/ta, 1.);
  vec2 q = (u - .5) * s; q -= (focus - .5) * s * (1. - 1./zoom);
  float c = cos(rot), si = sin(rot); q = mat2(c,-si,si,c) * q; q /= zoom; return q / s + .5 + shake; }
vec3 samp(vec2 u){ vec2 a = cover(u); vec2 d = (a - .5) * aberr;
  return vec3(texture(tex, a + d).r, texture(tex, a).g, texture(tex, a - d).b); }
float hash(float n){ return fract(sin(n)*43758.5453); }
void main(){
  vec3 col = vec3(0.);
  if (blurAmt > .001) { for (int i = 0; i < 16; i++) { float k = float(i)/15.; col += samp(mix(uv, blurC, k*blurAmt)); } col /= 16.; }
  else col = samp(uv);
  col = mix(texture(previousTex, cover(uv)).rgb, col, crossfade);
  vec2 sd=(uv-.5)*vec2(res.x/res.y,1.);
  float halo=exp(-pow((length(sd)-(.18+t*.3))/.055,2.));
  col += mix(vec3(.72,.43,1.),vec3(1.,.78,.3),.5+.5*sin(atan(sd.y,sd.x)*2.))*halo*shimmer;
  float light=dot(col,vec3(.299,.587,.114));
  col=mix(col,mix(vec3(.025,.055,.16),vec3(1.,.8,.38),smoothstep(.15,.95,light)),pearl);
  col *= bright;
  // speed lines radiating from the energy source
  if (lines > .001) { vec2 d = uv - lineC; d.x *= res.x/res.y; float a = atan(d.y, d.x); float r = length(d);
    float id = floor(a * 220.); float on = step(.86, hash(id + floor(t*30.))) * smoothstep(.18, .7, r) * (.5 + .5 * hash(id * 3.1));
    col = mix(col, vec3(1., .97, .9), on * lines * .32); }
  // the gold parry ring closing on Atlas
  if (ringA > .001) { vec2 d = uv - ringC; d.x *= res.x/res.y; float r = length(d);
    float band = exp(-pow((r - ringR) / .006, 2.)); col += vec3(1., .78, .36) * band * ringA * 2.2 + vec3(1., .85, .5) * exp(-pow((r-ringR)/.04,2.)) * ringA * .35; }
  // cyan energy glow pulse
  col += vec3(.25, .85, 1.) * glow * smoothstep(.9, .0, length((uv - lineC) * vec2(res.x/res.y, 1.)));
  // the impact frame: harsh two-tone, the way anime freezes the hit
  if (invertMode > .5) { float l = dot(col, vec3(.299,.587,.114)); float th = step(.55, l);
    col = invertMode < 1.5 ? vec3(th) : vec3(1. - th); col = mix(col, col * vec3(1., .93, .8), .4); }
  col = mix(col, vec3(1.), flash);
  // vignette + letterbox bars
  vec2 v = uv - .5; col *= 1. - dot(v, v) * .55;
  float bh = .11 * bars; if (uv.y < bh || uv.y > 1. - bh) col = vec3(0.);
  o = vec4(col, 1.);
}`;
function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(s); return s; }
const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
const U = new Proxy({}, { get: (_, k) => gl.getUniformLocation(prog, k) });
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
const load = (src) => new Promise((ok,reject) => { const im = new Image(); im.onload = () => { const tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  ok({ tx, w: im.width, h: im.height }); }; im.onerror=()=>reject(new Error('Cut-in art failed: '+src)); im.src = src; });
const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const pulse = (t, a, w) => Math.max(0, 1 - Math.abs(t - a) / w);
const shakeAt = (t, t0, amp, dur) => { const k = Math.max(0, 1 - (t - t0) / dur); if (t < t0 || k <= 0) return [0, 0];
  return [Math.sin(t * 91.3) * amp * k * k, Math.cos(t * 77.1) * amp * k * k]; };
const LEN = 7.2;
let T;
// the timeline: what the camera does in each shot
function frame(t) {
  const s = { tex: 'base', zoom: 1, rot: 0, focus: [.5, .5], shake: [0, 0], aberr: 0, invert: 0, flash: 0, lines: 0, lineC: [.5, .5],
    blur: 0, blurC: [.5, .5], bars: 0, ringR: 0, ringA: 0, ringC: [.46, .6], glow: 0, bright: 1 };
  if (t < 1.72) { // the fight: Sloth's fist comes down, the gold ring closes on Atlas, the HIT
    s.zoom = 1 + .035 * ease(t / 1.7); s.focus = [.45, .4];
    const k = seg(t, .25, 1.6); s.ringA = t < 1.62 ? Math.min(1, k * 3) : 0; s.ringR = .32 - .25 * ease(k); s.ringC = [.455, .6];
    s.flash = pulse(t, 1.66, .07); s.bars = ease(seg(t, 1.6, 1.75));
  } else if (t < 3.3) { // CUT IN: the charge
    const k = seg(t, 1.72, 3.3); s.tex = 'charge'; s.focus = [.8, .32]; s.zoom = 1.2 - .14 * ease(k); s.rot = -.035 * (1 - ease(k));
    s.lines = .9; s.lineC = [.8, .35]; s.glow = .15 + .35 * k * k; s.bars = 1; s.flash = pulse(t, 1.72, .08) * .9 + pulse(t, 3.26, .05);
    s.shake = shakeAt(t, 1.72, .004, 1.6); s.aberr = .006 * k;
  } else if (t < 3.44) { // the impact frame
    s.tex = 'strike'; s.invert = t < 3.37 ? 1 : 2; s.zoom = 1.14; s.focus = [.33, .45]; s.bars = 1;
  } else if (t < 5.0) { // CUT IN: the strike lands
    const k = seg(t, 3.44, 5.0); s.tex = 'strike'; s.focus = [.33, .45]; s.zoom = 1.14 - .12 * ease(k * 2.5);
    s.shake = shakeAt(t, 3.44, .02, 1.1); s.aberr = .03 * (1 - ease(k * 1.5)); s.blur = .18 * (1 - ease(k * 3)); s.blurC = [.33, .45];
    s.lines = .7 * (1 - k); s.lineC = [.33, .45]; s.bars = 1; s.flash = pulse(t, 3.44, .05) * .6 + pulse(t, 4.96, .06); s.bright = 1 + .25 * (1 - ease(k * 2));
  } else { // back to the fight: the shell is cracked, the world still shaking
    const k = seg(t, 5.0, LEN); s.zoom = 1.06 - .05 * ease(k); s.focus = [.5, .38]; s.shake = shakeAt(t, 5.0, .009, 1.2);
    s.flash = pulse(t, 5.02, .1); s.bars = 1 - ease(seg(t, 5.0, 5.35)); s.bright = 1 + .2 * (1 - ease(k * 3)); s.aberr = .006 * (1 - ease(k * 3));
  }
  return s;
}
function draw(t, burst = null, movie = null) {
  const s = burst ? {...frame(0),tex:burst,zoom:1.08-.06*ease(t/1.25),bars:.55,bright:1.04,focus:[.5,.45]} : frame(t);
  if(movie)Object.assign(s,{zoom:1.025+.045*ease(t/movie.duration),focus:[.48+.025*Math.sin(t*.4),.45],bars:.35,flash:movie.impact?Math.max(0,1-t/.12)*.65:0,aberr:movie.impact?.012*(1-ease(t/.6)):0,shake:movie.impact?shakeAt(t,0,.009,.7):[0,0]});
  const im=T[s.tex];
  const w = canvas.clientWidth, h = canvas.clientHeight; if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  gl.viewport(0, 0, w, h); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, im.tx);
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,(T[movie?.previous]||im).tx);gl.uniform1i(U.previousTex,1);gl.uniform1f(U.crossfade,movie?Math.min(1,t/.18):1);
  gl.uniform1f(U.pearl,movie?.pearl?1:0);
  gl.uniform1f(U.shimmer,movie?.impact?Math.max(0,1-t/.85):0);
  gl.uniform1i(U.tex, 0); gl.uniform2f(U.res, w, h); gl.uniform2f(U.texRes, im.w, im.h);
  gl.uniform1f(U.zoom, s.zoom); gl.uniform1f(U.rot, s.rot); gl.uniform2f(U.focus, s.focus[0], 1 - s.focus[1]); gl.uniform2f(U.shake, s.shake[0], s.shake[1]);
  gl.uniform1f(U.aberr, s.aberr); gl.uniform1f(U.invertMode, s.invert); gl.uniform1f(U.flash, s.flash); gl.uniform1f(U.lines, s.lines);
  gl.uniform2f(U.lineC, s.lineC[0], 1 - s.lineC[1]); gl.uniform1f(U.blurAmt, s.blur); gl.uniform2f(U.blurC, s.blurC[0], 1 - s.blurC[1]);
  gl.uniform1f(U.bars, s.bars); gl.uniform1f(U.ringR, s.ringR); gl.uniform1f(U.ringA, s.ringA); gl.uniform2f(U.ringC, s.ringC[0], 1 - s.ringC[1]);
  gl.uniform1f(U.glow, s.glow); gl.uniform1f(U.t, t); gl.uniform1f(U.bright, s.bright);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
T = Object.fromEntries(await Promise.all([...new Set(['base','charge','strike',...Object.keys(assets||{})])].map(async name => [name, await load(assets?.[name] || '/rpg/play/pitch/duel/assets/'+name+'.jpg')]))); return (t, burst, movie) => draw(t, burst, movie); }