(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Плавное проявление блоков при скролле ---------- */
  var revealEls = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    document.documentElement.classList.add('js-reveal');

    var counters = new WeakMap();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var parent = el.parentElement;
        var index = counters.has(parent) ? counters.get(parent) : 0;
        counters.set(parent, index + 1);
        el.style.transitionDelay = Math.min(index * 70, 280) + 'ms';
        el.classList.add('is-visible');
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Параллакс батиметрических линий ---------- */
  var layers = document.querySelectorAll('.parallax-layer');
  if (layers.length && !reduceMotion) {
    var ticking = false;
    var applyParallax = function () {
      var y = window.scrollY;
      layers.forEach(function (layer) {
        var speed = parseFloat(layer.getAttribute('data-speed')) || 0;
        layer.style.transform = 'translateY(' + (y * speed) + 'px)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(applyParallax);
        ticking = true;
      }
    }, { passive: true });
    applyParallax();
  }
})();

(function () {
  'use strict';

  var STORAGE_KEY = 'site-lang';

  function currentLang() {
    return document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'ru';
  }

  function applyMeta(lang) {
    var titleAttr = lang === 'en' ? 'data-title-en' : 'data-title-ru';
    if (document.body.hasAttribute(titleAttr)) {
      document.title = document.body.getAttribute(titleAttr);
    }
    document.querySelectorAll('[data-alt-ru]').forEach(function (el) {
      var attr = lang === 'en' ? 'data-alt-en' : 'data-alt-ru';
      var val = el.getAttribute(attr);
      if (val) el.setAttribute('alt', val);
    });
  }

  applyMeta(currentLang());

  var toggle = document.querySelector('.lang-toggle');
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(currentLang() === 'en'));
    toggle.addEventListener('click', function () {
      var next = currentLang() === 'en' ? 'ru' : 'en';
      document.documentElement.setAttribute('data-lang', next);
      document.documentElement.setAttribute('lang', next);
      localStorage.setItem(STORAGE_KEY, next);
      applyMeta(next);
      toggle.setAttribute('aria-pressed', String(next === 'en'));
    });
  }
})();

/* ---------- «Качующая» подсветка вкладки между страницами ---------- */
(function () {
  'use strict';

  var STORAGE_KEY = 'nav-pill-from';

  function clearPending() {
    document.documentElement.classList.remove('nav-pending');
  }

  var nav = document.querySelector('nav.primary-nav');
  if (!nav) { clearPending(); return; }

  var ul = nav.querySelector('ul');
  var activeLink = nav.querySelector('a.active');
  var links = nav.querySelectorAll('a');

  var trackedLinks = document.querySelectorAll('.brand, nav.primary-nav a');
  trackedLinks.forEach(function (a) {
    a.addEventListener('click', function () {
      if (!activeLink) return;
      try { sessionStorage.setItem(STORAGE_KEY, activeLink.getAttribute('href')); } catch (e) {}
    });
  });

  if (!activeLink || !ul) { clearPending(); return; }

  var fromHref = null;
  try {
    fromHref = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {}

  if (!fromHref) { clearPending(); return; }

  var fromLink = null;
  links.forEach(function (a) {
    if (a.getAttribute('href') === fromHref) fromLink = a;
  });
  if (!fromLink || fromLink === activeLink) { clearPending(); return; }

  function rectFor(link) {
    var r = link.getBoundingClientRect();
    var ur = ul.getBoundingClientRect();
    return { left: r.left - ur.left, top: r.top - ur.top, width: r.width, height: r.height };
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var pill = document.createElement('span');
  pill.className = 'nav-pill-indicator';
  pill.setAttribute('aria-hidden', 'true');
  ul.appendChild(pill);

  function place(rect) {
    pill.style.left = rect.left + 'px';
    pill.style.top = rect.top + 'px';
    pill.style.width = rect.width + 'px';
    pill.style.height = rect.height + 'px';
  }

  function finish() {
    clearPending();
    if (pill.parentNode) pill.parentNode.removeChild(pill);
  }

  if (reduceMotion) {
    place(rectFor(activeLink));
    finish();
    return;
  }

  pill.style.transition = 'none';
  place(rectFor(fromLink));

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      pill.style.transition = '';
      place(rectFor(activeLink));
    });
  });

  pill.addEventListener('transitionend', function handler(e) {
    if (e.propertyName !== 'left') return;
    pill.removeEventListener('transitionend', handler);
    finish();
  });

  window.setTimeout(finish, 900);
})();
