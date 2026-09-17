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

  function applySwitchableAttr(selector, ruAttr, enAttr, targetAttr, lang) {
    var el = document.querySelector(selector);
    if (!el) return;
    var attr = lang === 'en' ? enAttr : ruAttr;
    var val = el.getAttribute(attr);
    if (val) el.setAttribute(targetAttr, val);
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
    applySwitchableAttr('meta[name="description"]', 'data-desc-ru', 'data-desc-en', 'content', lang);
    applySwitchableAttr('meta[property="og:title"]', 'data-og-title-ru', 'data-og-title-en', 'content', lang);
    applySwitchableAttr('meta[property="og:description"]', 'data-og-desc-ru', 'data-og-desc-en', 'content', lang);
  }

  // На случай, если инлайн-скрипт в <head> ещё не выставил lang (старые кэшированные страницы) —
  // синхронизируем атрибут lang с сохранённым выбором сразу при загрузке.
  document.documentElement.setAttribute('lang', currentLang());
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

/* ---------- Мобильное меню (бургер) ---------- */
(function () {
  'use strict';

  document.documentElement.classList.add('js-nav');

  var burger = document.querySelector('.nav-burger');
  var nav = document.querySelector('nav.primary-nav');
  if (!burger || !nav) return;

  function isOpen() { return burger.getAttribute('aria-expanded') === 'true'; }

  function setOpen(open) {
    burger.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('nav-open', open);
  }

  burger.addEventListener('click', function () { setOpen(!isOpen()); });

  nav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setOpen(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) {
      setOpen(false);
      burger.focus();
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 720 && isOpen()) setOpen(false);
  });
})();

/* ---------- Кнопка «Сохранить как PDF» (печать текущей страницы) ---------- */
(function () {
  'use strict';
  var btn = document.getElementById('printBtn');
  if (!btn) return;
  btn.addEventListener('click', function () { window.print(); });
})();

/* ---------- Глубиномер-навигация по разделам «Опыта» ---------- */
(function () {
  'use strict';

  var rail = document.querySelector('.chart-rail');
  if (!rail) return;

  var marker = rail.querySelector('.chart-rail-marker');
  var stops = Array.prototype.slice.call(rail.querySelectorAll('.chart-rail-stop'));
  var targets = stops.map(function (a) {
    var href = a.getAttribute('href') || '';
    return href.charAt(0) === '#' ? document.querySelector(href) : null;
  });

  function update() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
    if (marker) marker.style.top = pct + '%';

    var currentIndex = 0;
    targets.forEach(function (el, i) {
      if (el && el.getBoundingClientRect().top - 140 <= 0) currentIndex = i;
    });
    stops.forEach(function (a, i) { a.classList.toggle('current', i === currentIndex); });
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () { update(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  update();
})();

/* ---------- Приборный кластер компетенций: целевые значения дуг ---------- */
(function () {
  'use strict';
  var CIRC = 132;
  document.querySelectorAll('.gauge[data-pct]').forEach(function (g) {
    var pct = parseFloat(g.getAttribute('data-pct')) || 0;
    var arc = g.querySelector('.gauge-arc');
    if (!arc) return;
    arc.style.setProperty('--target-offset', CIRC - (CIRC * pct / 100));
  });
})();
