// Hallbridge 3D intro. A suspension bridge on a night jobsite, the camera flies across it toward a city skyline
// full of tower cranes while the sun rises behind the towers (matched to the home page photo), the wordmark lands,
// then the intro fades into the site. Sound is opt-in ("Sound on"), generated live with Web Audio (no audio files).
// Shown once per browser session; skipped for reduced-motion visitors. Click, key, scroll or Skip ends it.
// Variants (preview only): ?v=1 current pacing, ?v=2 quick start, ?v=3 start on the bridge while the city rises,
// ?v=4 dawn aerial over the finished bridge, ?v=5 fast cut. No ?v = variant 3 (the live intro since 2026-10-26).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const root = document.getElementById('intro');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const force = /[?&]intro=1/.test(location.search);
const VN = Math.min(5, Math.max(1, parseInt((location.search.match(/[?&]v=(\d)/) || [])[1] || '3', 10)));
let seen = false;
try { seen = sessionStorage.getItem('hb-intro') === '1'; } catch (e) {}

// ---------- variant settings ----------
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const deckY = 7;
const VARIANTS = {
  // 1: the current intro. Bridge assembles beam by beam, flythrough, sunrise over the skyline, name lands.
  1: { dur: 10.2, speed: 1, part: 0.75, prebuilt: false, cityGrow: false, sunAt: 5.6, sunDur: 3.6, cityAt: 4.2, markAt: 7.1, whoosh: [3.9, 5.6],
       path: [V3(70, 6, 120), V3(38, 12, 82), V3(10, 13, 52), V3(0, deckY + 5, 26), V3(0, deckY + 6, -18), V3(0, deckY + 8, -44), V3(0, 19, -66), V3(0, 27, -84)],
       look: [V3(0, 14, 0), V3(0, 15, -20), V3(0, 16, -50), V3(0, 22, -140), V3(0, 32, -300), V3(0, 48, -520), V3(0, 56, -640)] },
  // 2: same film, quicker start. The build runs at almost double speed and the camera gets moving sooner.
  2: { dur: 7.4, speed: 0.55, part: 0.5, prebuilt: false, cityGrow: false, sunAt: 3.4, sunDur: 3.2, cityAt: 2.4, markAt: 4.9, whoosh: [2.2, 3.5],
       path: [V3(60, 7, 110), V3(30, 12, 74), V3(6, 13, 44), V3(0, deckY + 5, 20), V3(0, deckY + 6, -18), V3(0, deckY + 8, -44), V3(0, 19, -66), V3(0, 27, -84)],
       look: [V3(0, 14, 0), V3(0, 15, -24), V3(0, 16, -60), V3(0, 22, -150), V3(0, 32, -300), V3(0, 48, -520), V3(0, 56, -640)] },
  // 3: start on the finished bridge. Driving the deck toward the city while the towers rise out of the ground
  // around the cranes and the sun comes up behind them.
  3: { dur: 7.6, speed: 1, part: 0.75, prebuilt: true, cityGrow: true, sunAt: 2.6, sunDur: 3.6, cityAt: 0.8, markAt: 5.1, whoosh: [0.3, 2.8],
       path: [V3(0, deckY + 4, 64), V3(0, deckY + 5, 20), V3(0, deckY + 6, -18), V3(0, deckY + 8, -44), V3(0, 19, -66), V3(0, 27, -84)],
       look: [V3(0, 14, -30), V3(0, 16, -80), V3(0, 22, -160), V3(0, 32, -300), V3(0, 48, -520), V3(0, 56, -640)] },
  // 4: dawn aerial. Start high and wide over the water, sweep down across the finished bridge as the sun rises over
  // a city that is lit and finishing (towers fill in from wireframe to solid).
  4: { dur: 8.2, speed: 1, part: 0.75, prebuilt: true, cityGrow: 'finish', sunAt: 1.6, sunDur: 4.6, cityAt: 0.2, markAt: 5.6, whoosh: [0.6, 3.2], aerial: true,
       path: [V3(120, 70, 150), V3(60, 46, 90), V3(14, 26, 30), V3(0, deckY + 8, -28), V3(0, 16, -56), V3(0, 27, -84)],
       look: [V3(0, 12, 0), V3(0, 16, -60), V3(0, 24, -200), V3(0, 46, -500), V3(0, 56, -640)] },
  // 5: fast cut. Towers already standing, the deck snaps in under the camera as it crosses at speed, straight to the
  // skyline, sunrise and the name. About six seconds.
  5: { dur: 6.0, speed: 0.28, part: 0.35, prebuilt: 'towers', cityGrow: false, sunAt: 2.2, sunDur: 2.8, cityAt: 1.2, markAt: 4.0, whoosh: [0.4, 2.0],
       path: [V3(14, 11, 70), V3(2, deckY + 5, 26), V3(0, deckY + 6, -18), V3(0, deckY + 8, -44), V3(0, 19, -66), V3(0, 27, -84)],
       look: [V3(0, 14, -10), V3(0, 16, -60), V3(0, 24, -180), V3(0, 48, -520), V3(0, 56, -640)] },
};

if (!root || ((reduce || seen) && !force)) { if (root) root.remove(); document.documentElement.classList.remove('intro-on'); }
else { document.documentElement.classList.add('intro-on'); run(); }

function run() {
  window.__hbIntro = true;
  try { sessionStorage.setItem('hb-intro', '1'); } catch (e) {}
  const V = VARIANTS[VN];
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
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1400);

  scene.add(new THREE.HemisphereLight(0x8a6a50, 0x0a0705, 1.1));
  const key = new THREE.DirectionalLight(0xffb27a, 2.4); key.position.set(-30, 40, -120); scene.add(key);
  const fill = new THREE.PointLight(COPPER_L, 18, 140, 1.6); fill.position.set(0, 34, 30); scene.add(fill);
  // Sunrise light: warms the whole scene from behind the city as the sun comes up
  const sunLight = new THREE.DirectionalLight(0xff9a4a, 0); sunLight.position.set(20, 60, -400); scene.add(sunLight);

  // ---------- dawn backdrop, matched to the home page photo ----------
  // Sky, sun, haze and cloud band ride with the camera (position only), far away, so the towers never hide them.
  const backdrop = new THREE.Group(); scene.add(backdrop);
  const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const sky = (() => {
    const tex = canvasTex(16, 512, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 512);
      gr.addColorStop(0, '#0f0b08'); gr.addColorStop(0.42, '#1c110b'); gr.addColorStop(0.62, '#4a2211'); gr.addColorStop(0.74, '#8a3a14'); gr.addColorStop(0.8, '#d4601e'); gr.addColorStop(0.845, '#f0893a'); gr.addColorStop(0.9, '#7a3614'); gr.addColorStop(1, '#0f0b08');
      g.fillStyle = gr; g.fillRect(0, 0, 16, 512);
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2600, 1100), new THREE.MeshBasicMaterial({ map: tex, fog: false, transparent: true, opacity: 0, depthWrite: false }));
    m.position.set(0, 330, -1000); backdrop.add(m); return m;
  })();
  const sun = (() => {   // orange disc with a soft rim
    const tex = canvasTex(256, 256, (g) => {
      const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      r.addColorStop(0, '#ffd98a'); r.addColorStop(0.3, '#ffb24a'); r.addColorStop(0.62, '#ff8426'); r.addColorStop(0.84, '#ff5f12'); r.addColorStop(0.9, 'rgba(255,80,10,0.55)'); r.addColorStop(1, 'rgba(255,70,10,0)');
      g.fillStyle = r; g.fillRect(0, 0, 256, 256);
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(118, 118), new THREE.MeshBasicMaterial({ map: tex, fog: false, transparent: true, opacity: 0, depthWrite: false }));
    m.position.set(70, 240, -960); backdrop.add(m); return m;
  })();
  const glow = (() => {   // wide additive haze around the sun
    const tex = canvasTex(256, 256, (g) => {
      const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      r.addColorStop(0, 'rgba(255,130,45,0.42)'); r.addColorStop(0.35, 'rgba(255,100,30,0.18)'); r.addColorStop(1, 'rgba(255,80,20,0)');
      g.fillStyle = r; g.fillRect(0, 0, 256, 256);
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(620, 420), new THREE.MeshBasicMaterial({ map: tex, fog: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.position.set(70, 250, -955); backdrop.add(m); return m;
  })();
  const cloud = (() => {   // dark cloud bank that the sun climbs out from under, like the photo
    const tex = canvasTex(512, 128, (g) => {
      g.clearRect(0, 0, 512, 128);
      const gr = g.createLinearGradient(0, 0, 0, 128);
      gr.addColorStop(0, 'rgba(24,14,9,0)'); gr.addColorStop(0.3, 'rgba(24,14,9,0.96)'); gr.addColorStop(0.72, 'rgba(30,16,10,0.96)'); gr.addColorStop(1, 'rgba(30,16,10,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 512, 128);
      g.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 26; i++) { const x = Math.random() * 512, y = 70 + Math.random() * 60, rr = 14 + Math.random() * 34; const rg = g.createRadialGradient(x, y, 0, x, y, rr); rg.addColorStop(0, 'rgba(0,0,0,0.9)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2400, 300), new THREE.MeshBasicMaterial({ map: tex, fog: false, transparent: true, opacity: 0, depthWrite: false }));
    m.position.set(0, 345, -940); backdrop.add(m); return m;
  })();

  // Blueprint ground grid + water sheen under the bridge
  const grid = new THREE.GridHelper(900, 300, COPPER, 0x2a1d14);
  grid.material.transparent = true; grid.material.opacity = 0; scene.add(grid);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshStandardMaterial({ color: 0x0a0806, metalness: 0.6, roughness: 0.78 }));
  water.rotation.x = -Math.PI / 2; water.position.y = -0.05; scene.add(water);

  // ---------- the bridge ----------
  const parts = [];
  function part(geo, x, y, z, delay, from, solid = true, kind = 'deck') {
    const grp = new THREE.Group();
    let m = null;
    if (solid) { m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x2b211a, metalness: 0.45, roughness: 0.68, transparent: true, opacity: 0 })); grp.add(m); }
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xffb070, transparent: true, opacity: 0 }));
    grp.add(e); grp.position.set(x, y, z); scene.add(grp);
    parts.push({ grp, m, e, to: new THREE.Vector3(x, y, z), from: from || new THREE.Vector3(x, y - 16, z), delay: delay * V.speed, kind });
    return grp;
  }
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const L = 150, TZ = [-38, 38], TH = 32;
  TZ.forEach((z, i) => {
    [-6, 6].forEach((x, j) => {
      part(box(2.2, deckY + 2, 2.2), x, (deckY + 2) / 2 - 1, z, 0.15 + i * 0.2 + j * 0.06, null, true, 'tower');
      part(box(1.4, TH, 1.4), x, deckY + TH / 2, z, 0.7 + i * 0.2 + j * 0.06, new THREE.Vector3(x, deckY + TH / 2 + 40, z), true, 'tower');
    });
    [TH - 0.6, TH * 0.62, TH * 0.28].forEach((h, k) => part(box(13.4, 1.1, 1.1), 0, deckY + h, z, 1.2 + i * 0.2 + k * 0.1, new THREE.Vector3(0, deckY + h + 45, z), true, 'tower'));
    const bh = TH * 0.34, bl = Math.hypot(12, bh);
    [1, -1].forEach((s) => { const g = part(box(bl, 0.35, 0.35), 0, deckY + TH * 0.8, z, 1.5 + i * 0.2, new THREE.Vector3(0, deckY + TH * 0.8 + 45, z), false, 'tower'); g.rotation.z = s * Math.atan2(bh, 12); });
  });
  const segs = small ? 22 : 30, segL = L / segs;
  for (let s = 0; s < segs; s++) {
    const z = -L / 2 + (s + 0.5) * segL;
    const side = s % 2 ? 1 : -1;
    part(box(12, 0.8, segL - 0.3), 0, deckY, z, 1.0 + (segs - s) * 0.055, new THREE.Vector3(side * 22, deckY + 10, z));
    [-6, 6].forEach((x) => {
      const g = part(box(0.25, Math.hypot(2.4, segL / 2), 0.25), x, deckY - 1.6, z, 1.3 + (segs - s) * 0.055, new THREE.Vector3(x, deckY - 20, z), false);
      g.rotation.x = (s % 2 ? 1 : -1) * Math.atan2(segL / 2, 2.4);
    });
  }
  [-6, 6].forEach((x) => part(box(0.5, 0.5, L), x, deckY - 3, 0, 2.6, new THREE.Vector3(x, deckY - 22, 0), false));
  // Pre-built variants: place the finished parts before the first frame
  parts.forEach((q) => {
    const pre = V.prebuilt === true || (V.prebuilt === 'towers' && q.kind === 'tower');
    if (!pre) return;
    q.grp.position.copy(q.to); q.e.material.opacity = 0.55; if (q.m) q.m.material.opacity = 0.96; q.clanked = true; q.done = true;
  });

  // Suspension cables (drawn on) + hangers
  const cables = [];
  const cableAt = V.prebuilt === true ? -9 : 2.8 * V.speed, hangerAt = V.prebuilt === true ? -9 : 3.3 * V.speed, lampAt = V.prebuilt === true ? -9 : 3.6 * V.speed;
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
  // Towers are kept under the sun line and a little further back so the sunrise reads like the photo.
  const city = new THREE.Group(); scene.add(city);
  const bMat = new THREE.MeshStandardMaterial({ color: 0x120d0a, metalness: 0.3, roughness: 0.8, transparent: true, opacity: 1 });
  // Keep the sun at least half visible from the final camera: any tower standing in the sun's column is capped
  // at the sun's centre line, and the tallest of them is raised to just under it so the sun peeks over a rooftop.
  const camEnd = V.path[V.path.length - 1], SUN = { x: 70, y: 200, z: -960, r: 65 };
  const inSunColumn = (x, w, z) => { const f = (z - camEnd.z) / SUN.z; const sx = camEnd.x + SUN.x * f, half = SUN.r * f + w / 2; return Math.abs(x - sx) < half; };
  const sunLine = (z) => camEnd.y + SUN.y * (z - camEnd.z) / SUN.z;
  const winPos = [], buildings = [], inSun = [];
  // Staggered rows (each row offset by half a column, with jitter) so the skyline is full with no open gaps.
  const lots = [], colW = small ? 34 : 24;
  for (let r = 0; r < 5; r++) for (let x0 = -300 + (r % 2) * colW / 2; x0 <= 300; x0 += colW) lots.push([x0 + (Math.random() - 0.5) * 8, -232 - r * 42 + (Math.random() - 0.5) * 16]);
  for (const [x, z] of lots) {
    const w = 10 + Math.random() * 14, d = 8 + Math.random() * 14; let h = 16 + Math.pow(Math.random(), 1.4) * 78;
    if (Math.abs(x) < 14 && z > -250) continue;
    if (inSunColumn(x, w, z)) { h = Math.min(h, sunLine(z) - 2); inSun.push({ i: buildings.length, h, z }); }
    const b = new THREE.Mesh(box(w, h, d), bMat.clone()); b.position.set(x, h / 2, z); city.add(b);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(box(w, h, d)), new THREE.LineBasicMaterial({ color: COPPER_L, transparent: true, opacity: 0 }));
    e.position.copy(b.position); city.add(e);
    buildings.push({ b, e, h, w, d, seed: Math.random() });
    for (let k = 0; k < h / 5; k++) if (Math.random() < 0.35) winPos.push(x + (Math.random() - 0.5) * w, 3 + Math.random() * (h - 4), z + d / 2 + 0.1);
  }
  if (inSun.length) {   // make sure one rooftop actually reaches up to the sun
    const t = inSun.reduce((a, q) => (q.h / sunLine(q.z) > a.h / sunLine(a.z) ? q : a));
    const q = buildings[t.i], want = sunLine(t.z) - 4;
    if (q.h < want * 0.8) { q.h = want; q.b.geometry = box(q.w, want, q.d); q.e.geometry = new THREE.EdgesGeometry(q.b.geometry); q.b.position.y = q.e.position.y = want / 2; }
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
  const cranes = [crane(-80, -250, 104, 0.4), crane(60, -270, 122, 2.5), crane(-170, -320, 112, 1.2), crane(160, -310, 108, -0.6), crane(5, -350, 128, 1.9), crane(-30, -290, 96, 0.9)];

  // Floating sparks
  const N = small ? 900 : 1800, pos = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 200; pos[i * 3 + 1] = Math.random() * 70; pos[i * 3 + 2] = 60 - Math.random() * 300; seed[i] = Math.random(); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xffb46e, size: 0.28, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  // Camera path for this variant. It ends in front of the city, low, looking up at the skyline and the sun.
  const path = new THREE.CatmullRomCurve3(V.path);
  const look = new THREE.CatmullRomCurve3(V.look);

  // Post-processing: bloom makes the copper edges, lights and the sun glow
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.7, 0.45, 0.62);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---------- sound: generated live, tuned so phone and laptop speakers carry it ----------
  let ac = null, master = null, soundOn = false, unlockEl = null;
  const btn = root.querySelector('.intro-sound');
  function unlockIOS() {   // a looping silent <audio> flips iOS into playback mode so Web Audio plays even with the mute switch on
    if (unlockEl) return;
    unlockEl = document.createElement('audio'); unlockEl.loop = true; unlockEl.setAttribute('playsinline', '');
    unlockEl.src = 'data:audio/wav;base64,UklGRmQGAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YUAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'; unlockEl.volume = 0.01;
    const p = unlockEl.play(); if (p && p.catch) p.catch(() => {});
  }
  function loopNoise() { const b = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = ac.createBufferSource(); s.buffer = b; s.loop = true; s.start(); return s; }
  function startAudio() {
    if (ac) return;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4; comp.connect(master); master.out = comp;
    const wind = loopNoise(), wf = ac.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 520; wf.Q.value = 0.6;
    const wg = ac.createGain(); wg.gain.value = 0.05; wind.connect(wf); wf.connect(wg); wg.connect(comp);
    const wl = ac.createOscillator(); wl.frequency.value = 0.11; const wlg = ac.createGain(); wlg.gain.value = 260; wl.connect(wlg); wlg.connect(wf.frequency); wl.start();
    [220, 220.9, 330, 440.6].forEach((f, i) => { const o = ac.createOscillator(); o.type = i < 2 ? 'sawtooth' : 'triangle'; o.frequency.value = f; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      const g = ac.createGain(); g.gain.value = i < 2 ? 0.03 : 0.022; o.connect(lp); lp.connect(g); g.connect(comp); o.start(); });
  }
  const out = () => master.out;
  function noise(dur) { const b = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = ac.createBufferSource(); s.buffer = b; return s; }
  let lastClank = 0;
  function clank(strength) {
    if (!ac || !soundOn) return;
    const t = ac.currentTime; if (t - lastClank < 0.05) return; lastClank = t;
    const s = noise(0.12), hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1500;
    const g = ac.createGain(); g.gain.setValueAtTime(0.5 * strength, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    s.connect(hp); hp.connect(g); g.connect(out()); s.start(t);
    const base = 480 + Math.random() * 260;
    [1, 1.5, 2.37, 3.1].forEach((r, i) => { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = base * r; const og = ac.createGain();
      og.gain.setValueAtTime((0.22 / (i + 1)) * strength, t); og.gain.exponentialRampToValueAtTime(0.0005, t + 0.9 - i * 0.12); o.connect(og); og.connect(out()); o.start(t); o.stop(t + 1); });
  }
  function whoosh(at, dur) {
    if (!ac || !soundOn) return;
    const t = ac.currentTime + (at || 0), s = noise(dur + 0.2), f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(3200, t + dur * 0.75);
    const g = ac.createGain(); g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.6, t + dur * 0.55); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(out()); s.start(t);
  }
  function swell() {
    if (!ac || !soundOn) return; const t = ac.currentTime;
    [220, 277.2, 329.6, 440, 554.4].forEach((f, i) => { const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = f; const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09 - i * 0.01, t + 0.9); g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5); o.connect(g); g.connect(out()); o.start(t); o.stop(t + 4.6); });
    const o = ac.createOscillator(); o.frequency.setValueAtTime(240, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.7);
    const g = ac.createGain(); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 1.2); o.connect(g); g.connect(out()); o.start(t); o.stop(t + 1.3);
    const s = noise(0.5), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.8;
    const sg = ac.createGain(); sg.gain.setValueAtTime(0.35, t); sg.gain.exponentialRampToValueAtTime(0.001, t + 0.45); s.connect(bp); bp.connect(sg); sg.connect(out()); s.start(t);
  }
  function ramp(v, d) { master.gain.cancelScheduledValues(ac.currentTime); master.gain.setValueAtTime(master.gain.value, ac.currentTime); master.gain.linearRampToValueAtTime(v, ac.currentTime + d); }
  function setSound(on) {
    soundOn = on; btn.classList.toggle('on', on); btn.querySelector('span').textContent = on ? 'Sound off' : 'Sound on';
    if (on) { unlockIOS(); startAudio(); ac.resume(); ramp(1.0, 0.6); } else if (ac) ramp(0, 0.4);
  }
  btn.addEventListener('click', (e) => { e.stopPropagation(); setSound(!soundOn); });

  // ---------- timeline ----------
  const DUR = V.dur;
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
    const gridIn = V.prebuilt === true ? 0.5 : 1.4;
    grid.material.opacity = 0.35 * ease(t / gridIn) * (1 - 0.6 * ease((t - V.cityAt - 1.5) / 2));
    dust.material.opacity = 0.8 * ease((t - 0.3) / 1.5);
    const p = dust.geometry.attributes.position.array;
    for (let i = 0; i < N; i++) { p[i * 3 + 1] += 0.01 + seed[i] * 0.025; if (p[i * 3 + 1] > 70) p[i * 3 + 1] = 0; }
    dust.geometry.attributes.position.needsUpdate = true;

    parts.forEach((q) => {
      if (q.done) { q.e.material.opacity = Math.max(0.3, q.e.material.opacity - 0.004); return; }
      const k = (t - q.delay) / V.part;
      if (k <= 0) return;
      q.grp.position.lerpVectors(q.from, q.to, ease(k));
      q.e.material.opacity = Math.min(1, k * 2.5) * (1 - 0.45 * ease((t - q.delay - 1) / 1.4));
      if (q.m) q.m.material.opacity = 0.96 * ease((k - 0.35) / 0.8);
      if (!q.clanked && k >= 1) { q.clanked = true; clank(0.3 + Math.random() * 0.35); }
    });
    cables.forEach((c) => {
      if (c.line) c.line.geometry.setDrawRange(0, Math.floor(c.n * ease((t - cableAt) / 1.8)));
      if (c.hanger) c.hanger.material.opacity = 0.75 * ease((t - hangerAt - (75 - Math.abs(c.z)) / 110) / 0.5);
    });
    lamps.forEach((l, i) => { l.material.opacity = ease((t - lampAt - i * 0.025) / 0.3); });

    // City: fade in, or rise out of the ground (variant 3), or fill in from wireframe to solid (variant 4)
    const cityK = ease((t - V.cityAt) / 2.2);
    if (V.cityGrow === true) {
      buildings.forEach((q) => { const k = ease((t - V.cityAt - q.seed * 2.4) / 1.6); q.b.scale.y = Math.max(0.02, k); q.b.position.y = q.h * q.b.scale.y / 2; q.e.scale.y = q.b.scale.y; q.e.position.y = q.b.position.y; q.e.material.opacity = 0.7 * Math.min(1, k * 3) * (1 - 0.75 * ease((t - V.cityAt - q.seed * 2.4 - 1.4) / 1.4)); });
      windows.material.opacity = ease((t - V.cityAt - 1.8) / 1.8);
    } else if (V.cityGrow === 'finish') {
      buildings.forEach((q) => { const k = ease((t - V.cityAt - q.seed * 3.2) / 1.8); q.b.material.opacity = k; q.e.material.opacity = 0.75 * (1 - k) + 0.08; });
      windows.material.opacity = ease((t - V.cityAt - 0.6) / 2.4);
    } else {
      windows.material.opacity = cityK;
    }
    cranes.forEach((c, i) => { c.m.opacity = 0.85 * ease((t - V.cityAt - 0.2 - i * 0.18) / 1.2); c.g.rotation.y += 0.0009 * (i % 2 ? 1 : -1); });
    craneLights.forEach((l, i) => { l.material.opacity = cityK * (Math.sin(t * 3.2 + i * 1.7) > 0.2 ? 1 : 0.08); });

    // Sunrise: sky warms, the sun climbs out from under the cloud bank, the light wraps the scene
    const sr = ease((t - V.sunAt) / V.sunDur);
    sky.material.opacity = Math.max(cityK * 0.75, sr);
    cloud.material.opacity = Math.min(1, cityK + sr);
    sun.position.y = 96 + 104 * sr; glow.position.y = sun.position.y + 10;
    sun.material.opacity = Math.min(1, sr * 1.6); glow.material.opacity = 0.9 * sr;
    sun.scale.setScalar(0.85 + 0.25 * sr); glow.scale.setScalar(0.8 + 0.4 * sr);
    sunLight.intensity = 1.6 * sr; scene.fog.color.setHex(0x1a120c).lerp(new THREE.Color(0x4a2412), sr * 0.6);
    backdrop.position.copy(camera.position);

    const ct = easeIO(t / (DUR - 0.8));
    camera.position.copy(path.getPointAt(ct));
    camera.lookAt(look.getPointAt(ct, tmpLook));
    bloom.strength = 0.65 + 0.3 * ease((t - V.markAt + 0.6) / 2);
    if (!w1 && t > V.whoosh[0]) { w1 = true; whoosh(0, 1.6); }
    if (!w2 && t > V.whoosh[1]) { w2 = true; whoosh(0, 2.2); }
    if (!sw && t > V.markAt) { sw = true; swell(); mark.classList.add('in'); }
    if (t > DUR) finish();

    composer.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
