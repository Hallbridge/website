/* Shared nav + reveal for hallbridge.co subpages (the home page has the same logic inline). */
(function () {
  var nav = document.getElementById('nav');
  if (nav) nav.classList.add('scrolled');
  function closeAll() { document.querySelectorAll('.dd.open').forEach(function (x) { x.classList.remove('open'); x.firstElementChild.setAttribute('aria-expanded', 'false'); }); }
  document.querySelectorAll('.dd-btn').forEach(function (b) {
    b.addEventListener('click', function (e) {
      // The header is a link. With a mouse, hover opens the menu and a click follows the link.
      // On touch screens the first tap opens the menu and a second tap follows the link.
      var li = b.parentElement, touch = window.matchMedia('(hover: none)').matches;
      if (touch && li.querySelector('.dd-menu') && !li.classList.contains('open')) { e.preventDefault(); closeAll(); li.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
      e.stopPropagation();
    });
  });
  document.addEventListener('click', closeAll);
  document.querySelectorAll('.dd-menu a').forEach(function (a) { a.addEventListener('click', function () { a.blur(); closeAll(); }); });
  var burger = document.getElementById('hamburger'), menu = document.getElementById('mobileMenu');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', !open); document.body.style.overflow = open ? 'hidden' : '';
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeAll(); if (menu) setMenu(false); } });

  /* Menu links that point at one service inside a section land at the top of that section, then highlight the service. */
  function landOnSection() {
    var id = decodeURIComponent(location.hash.slice(1)); if (!id) return;
    var el = document.getElementById(id); if (!el) return;
    var box = el.closest('.dg-row') || el.closest('section');
    if (!box || box === el) return;
    var nav = document.getElementById('nav'), off = (nav ? nav.offsetHeight : 70) + 24;
    window.scrollTo({ top: box.getBoundingClientRect().top + window.pageYOffset - off, behavior: 'auto' });
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  }
  window.addEventListener('load', function () { setTimeout(landOnSection, 60); });
  window.addEventListener('hashchange', landOnSection);
  document.querySelectorAll('a[href*="#"]').forEach(function (a) {
    a.addEventListener('click', function () {
      var u = new URL(a.href, location.href);
      if (u.pathname === location.pathname && u.hash === location.hash) setTimeout(landOnSection, 0);
    });
  });
  /* Parallax on the statement band (About page), same motion as the home page used. */
  var par = document.querySelector('[data-parallax]');
  if (par && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var r = par.parentElement.getBoundingClientRect();
        if (r.bottom > 0 && r.top < innerHeight) { var p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; par.style.transform = 'translate3d(0,' + (p * -60) + 'px,0)'; }
        ticking = false;
      });
    }, { passive: true });
  }
  /* .steps (the search process timeline) draws its line when it gets .in */
  var els = document.querySelectorAll('.reveal, .reveal-img, .steps');
  if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (entries) { entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
  els.forEach(function (el) { io.observe(el); });
})();

/* concept previews: play only while on screen */
(function(){var v=document.querySelectorAll('.lab-vid');if(!v.length)return;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window))return;
    var io=new IntersectionObserver(function(es){es.forEach(function(e){var el=e.target;
      if(e.isIntersecting){if(!el.src){el.src=el.dataset.src;}var p=el.play();if(p&&p.catch)p.catch(function(){});}else{el.pause();}});},{threshold:.35});
    v.forEach(function(el){io.observe(el);});})();
