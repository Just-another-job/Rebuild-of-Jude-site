/* ============================================================
   AxisEV â€” Main JavaScript
   js/main.js
   ============================================================ */

(function () {
  'use strict';

  /* â”€â”€ Utils â”€â”€ */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  function showToast(msg, duration = 3000) {
    let toast = $('#site-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('visible'), duration);
  }
  window.Utils = { showToast };

  /* â”€â”€ Promo Banner dismiss â”€â”€ */
  const promoClose = $('#promo-close');
  const promoBanner = $('#promo-banner');
  if (promoClose && promoBanner) {
    promoClose.addEventListener('click', () => {
      promoBanner.style.transition = 'height 0.3s ease, opacity 0.3s ease';
      promoBanner.style.opacity = '0';
      promoBanner.style.height = '0';
      promoBanner.style.overflow = 'hidden';
      document.body.style.setProperty('--promo-height', '0px');
    });
  }

  /* â”€â”€ Nav scroll behaviour â”€â”€ */
  const nav = $('#main-nav');
  let lastScroll = 0;
  function onScroll() {
    const y = window.scrollY;
    if (y > 60) {
      nav.classList.add('nav--scrolled');
      nav.classList.remove('nav--transparent');
    } else {
      nav.classList.remove('nav--scrolled');
      nav.classList.add('nav--transparent');
    }
    lastScroll = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* â”€â”€ Mobile menu â”€â”€ */
  const hamburger = $('#nav-hamburger');
  const mobileMenu = $('#mobile-menu');
  const overlay = $('#nav-overlay');

  function closeMobile() {
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    document.body.style.overflow = '';
  }

  hamburger?.addEventListener('click', () => {
    const open = hamburger.classList.toggle('is-open');
    hamburger.setAttribute('aria-expanded', open);
    mobileMenu.classList.toggle('is-open', open);
    overlay.classList.toggle('is-visible', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  overlay?.addEventListener('click', closeMobile);

  $$('.nav__mobile-link').forEach(l => l.addEventListener('click', closeMobile));

  /* â”€â”€ Mega Menu â”€â”€ */
  const backdrop = $('.mega-menu-backdrop');
  let activeMenu = null;
  let hideTimer = null;

  function openMega(key) {
    clearTimeout(hideTimer);
    if (activeMenu === key) return;
    closeMega(true);
    activeMenu = key;
    const menu = $(`#mega-${key}`);
    if (!menu) return;
    menu.classList.add('is-open');
    backdrop.classList.add('is-visible');
    $$('.nav__item').forEach(i => i.classList.remove('active'));
    $(`.nav__item[data-menu="${key}"]`)?.classList.add('active');
  }

  function closeMega(instant = false) {
    const close = () => {
      $$('.mega-menu').forEach(m => m.classList.remove('is-open'));
      backdrop.classList.remove('is-visible');
      $$('.nav__item').forEach(i => i.classList.remove('active'));
      activeMenu = null;
    };
    if (instant) { close(); } else { hideTimer = setTimeout(close, 180); }
  }

  $$('.nav__item[data-menu]').forEach(item => {
    const key = item.dataset.menu;
    item.addEventListener('mouseenter', () => openMega(key));
    item.addEventListener('mouseleave', () => closeMega());
  });

  $$('.mega-menu').forEach(m => {
    m.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    m.addEventListener('mouseleave', () => closeMega());
  });

  backdrop?.addEventListener('click', () => closeMega(true));

  /* â”€â”€ Hero BG parallax load â”€â”€ */
  const heroBg = $('#hero-bg');
  if (heroBg) {
    window.addEventListener('load', () => heroBg.classList.add('loaded'));
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      heroBg.style.transform = `scale(1) translateY(${y * 0.25}px)`;
    }, { passive: true });
  }

  /* â”€â”€ Reveal on scroll â”€â”€ */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  $$('.reveal').forEach(el => revealObserver.observe(el));

  /* â”€â”€ Specs tabs â”€â”€ */
  const specData = {
    'forge-pro': {
      label: 'Forge Pro Â· Dual Motor AWD',
      rows: { Performance: { '0â€“60 mph': '4.1 sec', 'Top Speed': '112 mph', 'Peak Power': '600 hp' },
               'Range & Charging': { 'Range (est.)': '325 mi', 'Fast Charge Speed': '250 kW', 'Miles in 15 min': '136 mi' },
               Drivetrain: { Motor: 'Dual Electric', Drive: 'All-Wheel Drive', 'Tow Capacity': '11,000 lbs' },
               Dimensions: { 'Overall Length': '223"', 'Width (mirrors in)': '95"', 'Bed Dimensions': '6\'Ã—4\'Ã—1.7\'' } }
    },
    'forge-ultra': {
      label: 'Forge Ultra Â· Tri Motor AWD',
      rows: { Performance: { '0â€“60 mph': '2.6 sec', 'Top Speed': '130 mph', 'Peak Power': '845 hp' },
               'Range & Charging': { 'Range (est.)': '320 mi', 'Fast Charge Speed': '250 kW', 'Miles in 15 min': '130 mi' },
               Drivetrain: { Motor: 'Tri Electric', Drive: 'All-Wheel Drive', 'Tow Capacity': '11,000 lbs' },
               Dimensions: { 'Overall Length': '223"', 'Width (mirrors in)': '95"', 'Bed Dimensions': '6\'Ã—4\'Ã—1.7\'' } }
    },
    'forge': {
      label: 'Forge Â· Single Motor RWD',
      rows: { Performance: { '0â€“60 mph': '6.5 sec', 'Top Speed': '100 mph', 'Peak Power': '315 hp' },
               'Range & Charging': { 'Range (est.)': '250 mi', 'Fast Charge Speed': '200 kW', 'Miles in 15 min': '100 mi' },
               Drivetrain: { Motor: 'Single Electric', Drive: 'Rear-Wheel Drive', 'Tow Capacity': '7,500 lbs' },
               Dimensions: { 'Overall Length': '223"', 'Width (mirrors in)': '95"', 'Bed Dimensions': '6\'Ã—4\'Ã—1.7\'' } }
    }
  };

  function renderSpecs(modelKey) {
    const grid = $('#specs-grid');
    if (!grid) return;
    const data = specData[modelKey];
    if (!data) return;
    $('#specs-subtitle').textContent = data.label;
    grid.innerHTML = Object.entries(data.rows).map(([cat, items]) => `
      <div class="specs__category">
        <h3 class="specs__category-title">${cat}</h3>
        ${Object.entries(items).map(([label, val]) => `
          <div class="specs__item">
            <span class="specs__item-label">${label}</span>
            <span class="specs__item-value">${val}</span>
          </div>`).join('')}
      </div>`).join('');
    $$('.reveal', grid).forEach(el => revealObserver.observe(el));
  }

  $$('.specs__model-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.specs__model-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      renderSpecs(tab.dataset.model);
    });
  });

  /* Initial specs render */
  const firstTab = $('.specs__model-tab.active');
  if (firstTab) renderSpecs(firstTab.dataset.model);

  /* â”€â”€ Shop tabs â”€â”€ */
  $$('.shop__tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.shop__tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const cat = tab.dataset.category;
      $$('[data-category-panel]').forEach(panel => {
        panel.classList.toggle('hidden', panel.dataset.categoryPanel !== cat);
      });
    });
  });

  /* â”€â”€ Chat FAB (WhatsApp) â”€â”€ */
  const chatFab = $('#chat-fab');
  if (chatFab) {
    /* Chat FAB logic is handled entirely by chat.js now */
  }

  /* â”€â”€ Smooth anchor scroll â”€â”€ */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = $(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      closeMobile();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

})();



