/* Hallbridge bridge: the suspension bridge that builds as the visitor scrolls.
   Home hero (#heroScene): towers stand from the first frame, then the cables are strung, the hangers drop,
   the deck lands from both towers and the lights come on, all while the copy stays pinned; the copy then lifts away.
   Recruiting process (#processSpan): one span per step of the search process (towers, cables, hangers, deck),
   drawn alongside the steps as a vertical span on narrow screens.
   Dividers ([data-draw]): the cable draws once when it scrolls into view.
   The unbuilt state only exists under html.bm, which a small inline script in the page head adds when motion is allowed.
   Without JavaScript, or with reduced motion, every drawing is shown finished and nothing is pinned.
   One requestAnimationFrame loop, driven by scroll position, runs only while a scene is on screen.
   It writes transform, opacity and stroke-dashoffset only; layout is measured on load and resize. */
(function () {
  'use strict';
  window.__hbBridge = true;
  var root = document.documentElement;
  var reduceQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var motion = root.classList.contains('bm') && !reduceQ.matches;
  if (!motion) root.classList.remove('bm');

  function all(el, sel) { return Array.prototype.slice.call(el.querySelectorAll(sel)); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function seg(p, a, d) { return cl((p - a) / d); }
  function outCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function inOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* cached style writers: only touch the DOM when a value changes */
  function W(el, extra) { var w = { el: el, o: '', t: '', d: '' }; if (extra) for (var k in extra) w[k] = extra[k]; return w; }
  function op(w, v) { v = v.toFixed(3); if (w.o !== v) { w.el.style.opacity = v; w.o = v; } }
  function dash(w, v) { v = (1 - v).toFixed(4); if (w.d !== v) { w.el.style.strokeDashoffset = v; w.d = v; } }
  function tf(w, v) { if (w.t !== v) { w.el.style.transform = v; w.t = v; } }
  function num(el, a) { return +el.getAttribute(a) || 0; }
  function docTop(el) { return el.getBoundingClientRect().top + window.pageYOffset; }

  var scenes = [];
  var vh = window.innerHeight;

  /* ── home hero ── */
  function Hero(sec) {
    var stage = sec.querySelector('.hero-stage');
    var svg = sec.querySelector('#heroScene');
    var scrim = sec.querySelector('.hero-scrim');
    var cue = sec.querySelector('.scroll-cue');
    var copy = sec.querySelector('.hero-content');
    var main = all(svg, '.hs-cb[data-k="m"]').map(function (e) { return W(e); });
    var side = all(svg, '.hs-cb[data-k="s"]').map(function (e) { return W(e); });
    var hangers = all(svg, '.hs-hg').map(function (e) { return W(e, { k: num(e, 'data-o') }); });
    var segs = all(svg, '.hs-sg').map(function (e) { return W(e, { k: num(e, 'data-o'), dx: num(e, 'data-dx') }); });
    var lights = all(svg, '.hs-lt').map(function (e) { return W(e, { k: num(e, 'data-o') }); });
    var gC = W(svg.querySelector('.hs-guide-c')), gD = W(svg.querySelector('.hs-guide-d'));
    var sW = scrim && W(scrim), cW = cue && W(cue), kW = copy && W(copy, { v: '' });
    var top = 0, dist = 1, lastP = -1, framed = '';

    /* wide screens keep the full scene; tall screens are re-framed with the whole span (anchor to anchor)
       standing in the lower part of the screen, below the copy, with heavier lines */
    function frame() {
      var w = stage.clientWidth, h = stage.clientHeight || vh, a = w / h, vb, par, narrow = a < 1.15;
      if (narrow) {
        var vbW = 1560, vbH = vbW / a;
        vb = (800 - vbW / 2) + ' ' + (720 - vbH * 0.92).toFixed(1) + ' ' + vbW + ' ' + vbH.toFixed(1);
        par = 'xMidYMid meet';
      } else {
        vb = '0 0 1600 900';
        par = 'xMidYMax meet';
      }
      if (vb + par === framed) return;
      framed = vb + par;
      svg.setAttribute('viewBox', vb);
      svg.setAttribute('preserveAspectRatio', par);
      svg.classList.toggle('narrow', narrow);
    }

    this.el = sec;
    this.measure = function () {
      frame();
      top = docTop(sec);
      dist = Math.max(1, sec.offsetHeight - stage.offsetHeight);
      lastP = -1;
    };
    this.render = function (y) {
      var p = cl((y - top) / dist);
      if (Math.abs(p - lastP) < 0.0002) return;
      lastP = p;
      /* the span is finished by p = 0.8; the copy then lifts away so the finished bridge stands alone */
      var m = inOut(seg(p, 0.02, 0.24)), s = inOut(seg(p, 0.08, 0.21));
      main.forEach(function (c) { dash(c, m); });
      side.forEach(function (c) { dash(c, s); });
      op(gC, 1 - seg(p, 0.02, 0.24));
      hangers.forEach(function (h) { dash(h, outCubic(seg(p, 0.22 + h.k * 0.21, 0.05))); });
      var d = 0;
      segs.forEach(function (g) {
        var v = outCubic(seg(p, 0.44 + g.k * 0.24, 0.06));
        tf(g, 'translateX(' + (g.dx * (1 - v)).toFixed(2) + 'px)');
        op(g, v);
        d += v;
      });
      op(gD, 1 - d / segs.length);
      lights.forEach(function (l) { op(l, 0.85 * seg(p, 0.70 + l.k * 0.06, 0.03)); });
      var lift = seg(p, 0.82, 0.16);
      if (sW) op(sW, 1 - 0.7 * lift);
      if (cW) op(cW, 1 - seg(p, 0.01, 0.06));
      if (kW) {
        op(kW, 1 - lift);
        tf(kW, lift ? 'translateY(' + (-6 * inOut(lift)).toFixed(2) + 'vh)' : '');
        var vis = lift > 0.99 ? 'hidden' : '';
        if (kW.v !== vis) { kW.el.style.visibility = vis; kW.v = vis; }
      }
    };
    this.reset = function () { frame(); };
  }

  /* ── recruiting process span ── */
  function Process(box) {
    var art = box.querySelector('.span-art'), v = box.querySelector('.span-v');
    var steps = all(box, '.step'), on = steps.map(function () { return null; });
    var towers = all(art, '.ps-tw').map(function (e) { return W(e, { k: num(e, 'data-i') }); });
    var cables = all(art, '.ps-cb').map(function (e, i) { return W(e, { k: i }); });
    var hangers = all(art, '.ps-hg').map(function (e) { return W(e, { k: num(e, 'data-o') }); });
    var segs = all(art, '.ps-sg').map(function (e) { return W(e, { k: num(e, 'data-o'), dx: num(e, 'data-dx') }); });
    var guide = W(art.querySelector('.ps-guide'));
    var vCb = v && W(v.querySelector('.pv-cb')), vDk = v && W(v.querySelector('.pv-dk')), vEnd = v && W(v.querySelector('.pv-end'));
    var vHg = v ? all(v, '.pv-hg').map(function (e) { return W(e, { k: num(e, 'data-y') }); }) : [];
    var STEP_AT = [0.02, 0.27, 0.52, 0.77];
    var vertical = false, top = 0, h = 1, vTop = 0, vH = 1, dots = [], last = '';

    function setOn(i, val) {
      if (on[i] === val) return;
      on[i] = val;
      steps[i].classList.toggle('on', val);
    }
    this.el = box;
    this.measure = function () {
      vertical = !!v && window.getComputedStyle(v).display !== 'none';
      top = docTop(box);
      h = box.offsetHeight;
      if (vertical) {
        vTop = docTop(v);
        vH = Math.max(1, v.getBoundingClientRect().height);
        dots = steps.map(function (s) { var d = s.querySelector('.step-dot') || s; var r = d.getBoundingClientRect(); return r.top + window.pageYOffset + r.height / 2; });
      }
      last = '';
    };
    this.render = function (y) {
      var i;
      if (!vertical) {
        var p = cl((y + 0.85 * vh - top) / (h + 0.5 * vh));
        var key = 'h' + p.toFixed(4);
        if (key === last) return;
        last = key;
        towers.forEach(function (t) {
          var s = outCubic(seg(p, t.k ? 0.09 : 0.0, 0.13));
          tf(t, 'scaleY(' + Math.max(s, 0.0001).toFixed(4) + ')');
          op(t, s > 0 ? 1 : 0);
        });
        cables.forEach(function (c) { dash(c, inOut(c.k ? seg(p, 0.33, 0.15) : seg(p, 0.25, 0.22))); });
        hangers.forEach(function (g) { dash(g, outCubic(seg(p, 0.5 + g.k * 0.2, 0.05))); });
        segs.forEach(function (g) {
          var s = outCubic(seg(p, 0.75 + g.k * 0.2, 0.05));
          tf(g, 'translateX(' + (g.dx * (1 - s)).toFixed(2) + 'px)');
          op(g, s);
        });
        op(guide, 1 - seg(p, 0.75, 0.25));
        for (i = 0; i < steps.length; i++) setOn(i, p >= STEP_AT[i]);
      } else {
        var b = y + 0.62 * vh, f = cl((b - vTop) / vH);
        var keyV = 'v' + f.toFixed(4) + (b > (dots[dots.length - 1] || 0));
        if (keyV === last) return;
        last = keyV;
        dash(vCb, f);
        dash(vDk, f);
        vHg.forEach(function (g) { op(g, cl((f - g.k) / 0.03)); });
        op(vEnd, cl((f - 0.96) / 0.04));
        for (i = 0; i < steps.length; i++) setOn(i, b >= dots[i]);
      }
    };
    this.reset = function () { steps.forEach(function (s) { s.classList.remove('on'); }); };
  }

  /* hero framing runs even without motion, so tall screens get the re-framed scene */
  var heroSec = document.querySelector('.hero');
  var hero = heroSec && heroSec.querySelector('#heroScene') ? new Hero(heroSec) : null;
  if (hero) hero.reset();

  if (motion) {
    if (hero) scenes.push(hero);
    var pb = document.getElementById('processSpan');
    if (pb && pb.querySelector('.span-art')) scenes.push(new Process(pb));
  }

  /* the loop */
  var ticking = false;
  function tick() {
    ticking = false;
    var y = window.pageYOffset;
    for (var i = 0; i < scenes.length; i++) if (scenes[i].live) scenes[i].render(y);
  }
  function request() {
    if (ticking) return;
    for (var i = 0; i < scenes.length; i++) if (scenes[i].live) { ticking = true; requestAnimationFrame(tick); return; }
  }
  function measure() {
    vh = window.innerHeight;
    if (hero && !motion) hero.reset();
    scenes.forEach(function (s) { s.measure(); });
    request();
  }

  if (scenes.length) {
    scenes.forEach(function (s) { s.live = true; });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          scenes.forEach(function (s) { if (s.el === en.target) s.live = en.isIntersecting; });
        });
        request();
      }, { rootMargin: '10% 0px 10% 0px' });
      scenes.forEach(function (s) { io.observe(s.el); });
    }
    window.addEventListener('scroll', request, { passive: true });
  }
  var rt = 0;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(measure, 120); });
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  measure();

  /* dividers and the values deck draw once in view */
  var draws = document.querySelectorAll('[data-draw]');
  if (motion && 'IntersectionObserver' in window) {
    var dio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); dio.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    Array.prototype.forEach.call(draws, function (d) { dio.observe(d); });
  } else {
    Array.prototype.forEach.call(draws, function (d) { d.classList.add('in'); });
  }

  /* reduced motion switched on mid-visit: show everything finished and stop */
  function toStatic() {
    if (!reduceQ.matches || !motion) return;
    motion = false;
    root.classList.remove('bm');
    scenes.forEach(function (s) {
      s.live = false;
      all(s.el, '[style]').forEach(function (e) { e.removeAttribute('style'); });
      if (s.reset) s.reset();
    });
    scenes = [];
    Array.prototype.forEach.call(draws, function (d) { d.classList.add('in'); });
  }
  if (reduceQ.addEventListener) reduceQ.addEventListener('change', toStatic);
  else if (reduceQ.addListener) reduceQ.addListener(toStatic);
})();
