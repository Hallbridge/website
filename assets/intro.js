// Hallbridge 3D intro. A suspension bridge assembles beam by beam on a night jobsite, the camera flies
// across it toward a city skyline full of tower cranes at dawn, the wordmark lands, then the intro fades
// into the site. Sound is opt-in ("Sound on"), generated live with Web Audio (no audio files).
// Shown once per browser session; skipped for reduced-motion visitors. Click, key, scroll or Skip ends it.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const root = document.getElementById('intro');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const force = /[?&]intro=1/.test(location.search);
let seen = false;
try { seen = sessionStorage.getItem('hb-intro') === '1'; } catch (e) {}
if (!root || ((reduce || seen) && !force)) { if (root) root.remove(); document.documentElement.classList.remove('intro-on'); }
else { document.documentElement.classList.add('intro-on'); run(); }

function run() {
  window.__hbIntro = true;
  try { sessionStorage.setItem('hb-intro', '1'); } catch (e) {}
  const bail = () => { document.documentElement.classList.remove('intro-on'); root.remove(); };
  if (!window.WebGLRenderingContext) return bail();
  const COPPER = 0xB87333, COPPER_L = 0xD39A5E, INK = 0x0f0b08;
  const small = Math.min(innerWidth, innerHeight) < 700;
  const canvas = root.querySelector('canvas');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { return bail(); }
  canvas.addEventListener('webglcontextlost', () => finish(), { once: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(INK);
  scene.fog = new THREE.FogExp2(0x1a120c, 0.0085);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 900);

  scene.add(new THREE.HemisphereLight(0x8a6a50, 0x0a0705, 1.1));
  const key = new THREE.DirectionalLight(0xffb27a, 2.4); key.position.set(-30, 40, -120); scene.add(key);
  const fill = new THREE.PointLight(COPPER_L, 18, 140, 1.6); fill.position.set(0, 34, 30); scene.add(fill);

  // Dawn sky glow behind the city
  const sky = (() => {
    const c = document.createElement('canvas'); c.width = 16; c.height = 512; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, '#0f0b08'); gr.addColorStop(0.45, '#2a1a10'); gr.addColorStop(0.7, '#7a3f18'); gr.addColorStop(0.82, '#e08a3c'); gr.addColorStop(0.9, '#3a2214'); gr.addColorStop(1, '#0f0b08');
    g.fillStyle = gr; g.fillRect(0, 0, 16, 512);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1400, 420), new THREE.MeshBasicMaterial({ map: tex, fog: false, transparent: true, opacity: 0 }));
    m.position.set(0, 120, -520); scene.add(m); return m;
  })();
  const sun = new THREE.Mesh(new THREE.CircleGeometry(26, 48), new THREE.MeshBasicMaterial({ color: 0xe8893a, fog: false, transparent: true, opacity: 0 }));
  sun.position.set(40, 34, -510); scene.add(sun);

  // Blueprint ground grid + water sheen under the bridge
  const grid = new THREE.GridHelper(900, 300, COPPER, 0x2a1d14);
  grid.material.transparent = true; grid.material.opacity = 0; scene.add(grid);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: 0x0a0806, metalness: 0.6, roughness: 0.78 }));
  water.rotation.x = -Math.PI / 2; water.position.y = -0.05; scene.add(water);

  // ---------- the bridge ----------
  const parts = [];
  function part(geo, x, y, z, delay, from, solid = true) {
    const grp = new THREE.Group();
    let m = null;
    if (solid) { m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x2b211a, metalness: 0.45, roughness: 0.68, transparent: true, opacity: 0 })); grp.add(m); }
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xffb070, transparent: true, opacity: 0 }));
    grp.add(e); grp.position.set(x, y, z); scene.add(grp);
    parts.push({ grp, m, e, to: new THREE.Vector3(x, y, z), from: from || new THREE.Vector3(x, y - 16, z), delay });
    return grp;
  }
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const L = 150, deckY = 7, TZ = [-38, 38], TH = 32;
  TZ.forEach((z, i) => {
    [-6, 6].forEach((x, j) => {
      part(box(2.2, deckY + 2, 2.2), x, (deckY + 2) / 2 - 1, z, 0.15 + i * 0.2 + j * 0.06);
      part(box(1.4, TH, 1.4), x, deckY + TH / 2, z, 0.7 + i * 0.2 + j * 0.06, new THREE.Vector3(x, deckY + TH / 2 + 40, z));
    });
    [TH - 0.6, TH * 0.62, TH * 0.28].forEach((h, k) => part(box(13.4, 1.1, 1.1), 0, deckY + h, z, 1.2 + i * 0.2 + k * 0.1, new THREE.Vector3(0, deckY + h + 45, z)));
    // X bracing between the top two crossbeams
    const bh = TH * 0.34, bl = Math.hypot(12, bh);
    [1, -1].forEach((s) => { const g = part(box(bl, 0.35, 0.35), 0, deckY + TH * 0.8, z, 1.5 + i * 0.2, new THREE.Vector3(0, deckY + TH * 0.8 + 45, z), false); g.rotation.z = s * Math.atan2(bh, 12); });
  });
  const segs = small ? 22 : 30, segL = L / segs;
  for (let s = 0; s < segs; s++) {
    const z = -L / 2 + (s + 0.5) * segL;
    const side = s % 2 ? 1 : -1;
    part(box(12, 0.8, segL - 0.3), 0, deckY, z, 1.0 + (segs - s) * 0.055, new THREE.Vector3(side * 22, deckY + 10, z));
    // truss under the deck: a V per segment on both sides
    [-6, 6].forEach((x) => {
      const g = part(box(0.25, Math.hypot(2.4, segL / 2), 0.25), x, deckY - 1.6, z, 1.3 + (segs - s) * 0.055, new THREE.Vector3(x, deckY - 20, z), false);
      g.rotation.x = (s % 2 ? 1 : -1) * Math.atan2(segL / 2, 2.4);
    });
  }
  [-6, 6].forEach((x) => part(box(0.5, 0.5, L), x, deckY - 3, 0, 2.6, new THREE.Vector3(x, deckY - 22, 0), false));

  // Suspension cables (drawn on) + hangers
  const cables = [];
  [-6, 6].forEach((x) => {
    const pts = [];
    const top = deckY + TH - 0.6;
    for (let i = 0; i <= 120; i++) {
      const z = -L / 2 + (i / 120) * L, a = Math.abs(z);
      const y = a <= 38 ? deckY + 2 + (top - deckY - 2) * Math.pow(a / 38, 2) : top - (a - 38) * 0.62;
      pts.push(new THREE.Vector3(x, y, z));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts); g.setDrawRange(0, 0);
    const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffc080 }));
    scene.add(line); cables.push({ line, n: pts.length });
    for (let i = 3; i < 120; i += 3) {
      const p = pts[i]; if (p.y - deckY < 1.5) continue;
      const hl = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, deckY + 0.4, p.z), p]), new THREE.LineBasicMaterial({ color: COPPER_L, transparent: true, opacity: 0 }));
      scene.add(hl); cables.push({ hanger: hl, z: p.z });
    }
  });
  // Deck lights that switch on down the span
  const lamps = [];
  for (let z = -L / 2 + 4; z < L / 2; z += 8) [-5.6, 5.6].forEach((x) => {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd39a, transparent: true, opacity: 0 }));
    l.position.set(x, deckY + 1.2, z); scene.add(l); lamps.push(l);
  });

  // ---------- skyline with tower cranes ----------
  const city = new THREE.Group(); scene.add(city);
  const bMat = new THREE.MeshStandardMaterial({ color: 0x120d0a, metalness: 0.3, roughness: 0.8 });
  const winPos = [];
  for (let i = 0; i < (small ? 70 : 120); i++) {
    const w = 8 + Math.random() * 16, d = 8 + Math.random() * 14, h = 18 + Math.pow(Math.random(), 1.8) * 110;
    const x = (Math.random() - 0.5) * 520, z = -200 - Math.random() * 180;
    if (Math.abs(x) < 14 && z > -230) continue;
    const b = new THREE.Mesh(box(w, h, d), bMat); b.position.set(x, h / 2, z); city.add(b);
    for (let k = 0; k < h / 5; k++) if (Math.random() < 0.35) winPos.push(x + (Math.random() - 0.5) * w, 3 + Math.random() * (h - 4), z + d / 2 + 0.1);
  }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(winPos, 3));
  const windows = new THREE.Points(wg, new THREE.PointsMaterial({ color: 0xffc27a, size: 0.9, transparent: true, opacity: 0 }));
  city.add(windows);
  const craneLights = [];
  function crane(x, z, h, rot) {
    const g = new THREE.Group(), m = new THREE.LineBasicMaterial({ color: COPPER_L, transparent: true, opacity: 0 });
    const lat = (w, hh, dd) => new THREE.LineSegments(new THREE.EdgesGeometry(box(w, hh, dd)), m);
    const mast = lat(2.2, h, 2.2); mast.position.y = h / 2; g.add(mast);
    for (let y = 4; y < h; y += 4) { const r = lat(2.2, 0.01, 2.2); r.position.y = y; g.add(r); }
    const jib = lat(52, 1.6, 1.6); jib.position.set(18, h + 1, 0); g.add(jib);
    const cj = lat(16, 1.6, 1.6); cj.position.set(-14, h + 1, 0); g.add(cj);
    const cab = lat(2.4, 6, 2.4); cab.position.set(0, h + 4.6, 0); g.add(cab);
    const hook = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(30, h, 0), new THREE.Vector3(30, h - 26, 0)]), m); g.add(hook);
    const red = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff3b2f, transparent: true, opacity: 0 }));
    red.position.set(0, h + 7.8, 0); g.add(red); craneLights.push(red);
    g.position.set(x, 0, z); g.rotation.y = rot; city.add(g); return { g, m };
  }
  const cranes = [crane(-70, -230, 96, 0.4), crane(55, -250, 120, 2.5), crane(-160, -300, 110, 1.2), crane(150, -290, 104, -0.6), crane(5, -330, 130, 1.9)];

  // Floating sparks
  const N = small ? 900 : 1800, pos = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 200; pos[i * 3 + 1] = Math.random() * 70; pos[i * 3 + 2] = 60 - Math.random() * 300; seed[i] = Math.random(); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xffb46e, size: 0.28, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  // Camera: low wide shot, along the deck through both towers, then up and out toward the skyline
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(70, 6, 120), new THREE.Vector3(38, 12, 82), new THREE.Vector3(10, 13, 52),
    new THREE.Vector3(0, deckY + 5, 26), new THREE.Vector3(0, deckY + 6, -20), new THREE.Vector3(0, deckY + 10, -58),
    new THREE.Vector3(0, 30, -96), new THREE.Vector3(0, 40, -118),
  ]);
  const look = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 14, 0), new THREE.Vector3(0, 15, -20), new THREE.Vector3(0, 16, -50),
    new THREE.Vector3(0, 20, -120), new THREE.Vector3(0, 46, -320), new THREE.Vector3(0, 52, -420),
  ]);

  // Post-processing: bloom makes the copper edges and lights glow
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.7, 0.45, 0.62);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---------- sound ----------
  let ac = null, master = null, soundOn = false;
  const btn = root.querySelector('.intro-sound');
  function startAudio() {
    if (ac) return;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
    const comp = ac.createDynamicsCompressor(); comp.connect(master); master.out = comp;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260; lp.Q.value = 5; lp.connect(comp);
    [55, 55.7, 82.4, 110.3].forEach((f, i) => { const o = ac.createOscillator(); o.type = i === 3 ? 'triangle' : 'sawtooth'; o.frequency.value = f; const g = ac.createGain(); g.gain.value = i === 3 ? 0.03 : 0.045; o.connect(g); g.connect(lp); o.start(); });
    const lfo = ac.createOscillator(); lfo.frequency.value = 0.07; const lg = ac.createGain(); lg.gain.value = 160; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
  }
  const out = () => master.out;
  function noise(dur) { const b = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = ac.createBufferSource(); s.buffer = b; return s; }
  let lastClank = 0;
  function clank(strength) {
    if (!ac || !soundOn) return;
    const t = ac.currentTime; if (t - lastClank < 0.045) return; lastClank = t;
    const s = noise(0.2), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1200 + Math.random() * 1800; bp.Q.value = 10;
    const g = ac.createGain(); g.gain.setValueAtTime(0.28 * strength, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    s.connect(bp); bp.connect(g); g.connect(out()); s.start(t);
    [1, 2.76].forEach((r) => { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = (320 + Math.random() * 200) * r; const og = ac.createGain();
      og.gain.setValueAtTime(0.09 * strength / r, t); og.gain.exponentialRampToValueAtTime(0.0008, t + 0.7); o.connect(og); og.connect(out()); o.start(t); o.stop(t + 0.72); });
  }
  function whoosh(at, dur) {
    if (!ac || !soundOn) return;
    const t = ac.currentTime + (at || 0), s = noise(dur + 0.2), f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4;
    f.frequency.setValueAtTime(180, t); f.frequency.exponentialRampToValueAtTime(2600, t + dur * 0.75);
    const g = ac.createGain(); g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.45, t + dur * 0.55); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(out()); s.start(t);
  }
  function swell() {
    if (!ac || !soundOn) return;
    const t = ac.currentTime;
    [110, 164.8, 220, 277.2].forEach((f) => { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f; const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 1.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5); o.connect(g); g.connect(out()); o.start(t); o.stop(t + 4.6); });
    const o = ac.createOscillator(); o.frequency.setValueAtTime(80, t); o.frequency.exponentialRampToValueAtTime(30, t + 1.4);
    const g = ac.createGain(); g.gain.setValueAtTime(0.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 1.8); o.connect(g); g.connect(out()); o.start(t); o.stop(t + 1.9);
  }
  function setSound(on) {
    soundOn = on;
    btn.classList.toggle('on', on); btn.querySelector('span').textContent = on ? 'Sound off' : 'Sound on';
    if (on) { startAudio(); ac.resume(); master.gain.cancelScheduledValues(ac.currentTime); master.gain.setValueAtTime(master.gain.value, ac.currentTime); master.gain.linearRampToValueAtTime(0.85, ac.currentTime + 0.8); }
    else if (ac) { master.gain.cancelScheduledValues(ac.currentTime); master.gain.setValueAtTime(master.gain.value, ac.currentTime); master.gain.linearRampToValueAtTime(0, ac.currentTime + 0.4); }
  }
  btn.addEventListener('click', (e) => { e.stopPropagation(); setSound(!soundOn); });

  // ---------- timeline ----------
  const DUR = 10.2;
  const clamp = (x) => Math.min(Math.max(x, 0), 1);
  const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
  const easeIO = (x) => (x = clamp(x), x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const mark = root.querySelector('.intro-mark');
  let t0 = null, done = false, w1 = false, w2 = false, sw = false;

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); composer.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
    camera.aspect = w / h; camera.fov = w < h ? 72 : 50; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  function finish() {
    if (done) return; done = true;
    root.classList.add('out');
    document.documentElement.classList.remove('intro-on');
    if (ac && soundOn) { master.gain.cancelScheduledValues(ac.currentTime); master.gain.setValueAtTime(master.gain.value, ac.currentTime); master.gain.linearRampToValueAtTime(0, ac.currentTime + 2.5); }
    setTimeout(() => { renderer.dispose(); root.remove(); }, 1400);
  }
  const skipOn = (e) => { if (e.target && e.target.closest && e.target.closest('.intro-ui')) return; if (t0 !== null && performance.now() - t0 > 800) finish(); };
  ['click', 'keydown', 'wheel', 'touchmove'].forEach((ev) => addEventListener(ev, skipOn, { passive: true }));
  root.querySelector('.intro-skip').addEventListener('click', finish);

  const tmpLook = new THREE.Vector3();
  function frame(now) {
    if (!root.isConnected) return;
    if (t0 === null) t0 = now;
    const t = (now - t0) / 1000;

    grid.material.opacity = 0.35 * ease(t / 1.4) * (1 - 0.6 * ease((t - 6) / 2));
    dust.material.opacity = 0.8 * ease((t - 0.3) / 1.5);
    const p = dust.geometry.attributes.position.array;
    for (let i = 0; i < N; i++) { p[i * 3 + 1] += 0.01 + seed[i] * 0.025; if (p[i * 3 + 1] > 70) p[i * 3 + 1] = 0; }
    dust.geometry.attributes.position.needsUpdate = true;

    parts.forEach((q) => {
      const k = (t - q.delay) / 0.75;
      if (k <= 0) return;
      q.grp.position.lerpVectors(q.from, q.to, ease(k));
      q.e.material.opacity = Math.min(1, k * 2.5) * (1 - 0.45 * ease((t - q.delay - 1) / 1.4));
      if (q.m) q.m.material.opacity = 0.96 * ease((k - 0.35) / 0.8);
      if (!q.clanked && k >= 1) { q.clanked = true; clank(0.3 + Math.random() * 0.35); }
    });
    cables.forEach((c) => {
      if (c.line) c.line.geometry.setDrawRange(0, Math.floor(c.n * ease((t - 2.8) / 1.8)));
      if (c.hanger) c.hanger.material.opacity = 0.75 * ease((t - 3.3 - (75 - Math.abs(c.z)) / 110) / 0.5);
    });
    lamps.forEach((l, i) => { l.material.opacity = ease((t - 3.6 - i * 0.025) / 0.3); });

    const city = ease((t - 4.2) / 2.2);
    sky.material.opacity = city; sun.material.opacity = 0.7 * ease((t - 6) / 2.5); sun.position.y = 18 + 22 * ease((t - 5.5) / 4);
    windows.material.opacity = city;
    cranes.forEach((c, i) => { c.m.opacity = 0.85 * ease((t - 4.4 - i * 0.18) / 1.2); c.g.rotation.y += 0.0009 * (i % 2 ? 1 : -1); });
    craneLights.forEach((l, i) => { l.material.opacity = city * (Math.sin(t * 3.2 + i * 1.7) > 0.2 ? 1 : 0.08); });

    const ct = easeIO(t / (DUR - 0.8));
    camera.position.copy(path.getPointAt(ct));
    camera.lookAt(look.getPointAt(ct, tmpLook));
    bloom.strength = 0.65 + 0.3 * ease((t - 6.5) / 2);
    if (!w1 && t > 3.9) { w1 = true; whoosh(0, 1.6); }
    if (!w2 && t > 5.6) { w2 = true; whoosh(0, 2.2); }
    if (!sw && t > 7.1) { sw = true; swell(); mark.classList.add('in'); }
    if (t > DUR) finish();

    composer.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
