/* Shared nav + reveal for hallbridge.co subpages (the home page has the same logic inline). */
(function () {
  var nav = document.getElementById('nav');
  if (nav) nav.classList.add('scrolled');
  function closeAll() { document.querySelectorAll('.dd.open').forEach(function (x) { x.classList.remove('open'); x.firstElementChild.setAttribute('aria-expanded', 'false'); }); }
  document.querySelectorAll('.dd-btn').forEach(function (b) {
    b.addEventListener('click', function (e) {
      var li = b.parentElement, open = !li.classList.contains('open');
      closeAll(); if (open) { li.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
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
  var els = document.querySelectorAll('.reveal, .reveal-img');
  if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (entries) { entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
  els.forEach(function (el) { io.observe(el); });
})();
