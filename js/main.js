/* ============================================================
   AxisEV — Main JavaScript
   js/main.js
   ============================================================ */

(function () {
  'use strict';

  /* ── Utils ── */
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

  /* ── WhatsApp Redirect Logic ── */
  const WHATSAPP_NUMBER = '13059950245';
  const WHATSAPP_MESSAGE = encodeURIComponent('Hello, I am interested in AxisEV vehicles.');

  function redirectToWhatsApp(e) {
    if (e) e.preventDefault();
    window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + WHATSAPP_MESSAGE, '_blank', 'noopener');
  }

  // Attach WhatsApp redirect to all CTAs & Chat FAB
  ['hero-enquire-btn', 'cta-enquire-btn', 'cta-drive-btn', 'specs-enquire-btn', 'chat-fab'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', redirectToWhatsApp);
  });

  ['mm-order-RWD Electric Truck', 'mm-order-AWD Electric Truck', 'mm-order-apex', 'mm-order-apex-xl'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', redirectToWhatsApp);
  });

  // Shop vehicle enquire buttons
  $$('.shop-card__btn').forEach(btn => {
    if (btn.textContent.trim() === 'Add to Cart') {
      btn.addEventListener('click', () => showToast('Added to enquiry list!'));
    } else {
      btn.addEventListener('click', redirectToWhatsApp);
    }
  });

  // Mega menu and Nav action toasts
  $$('[data-toast]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      showToast(el.getAttribute('data-toast'));
    });
  });

  /* ── Disclaimer Modal ── */
  const disclaimerModal = $('#disclaimer-modal');
  const openDisclaimerBtns = $$('.open-disclaimer-btn');
  const closeDisclaimerBtn = $('#disclaimer-close-btn');

  openDisclaimerBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (disclaimerModal && typeof disclaimerModal.showModal === 'function') {
        disclaimerModal.showModal();
      }
    });
  });

  if (closeDisclaimerBtn && disclaimerModal) {
    closeDisclaimerBtn.addEventListener('click', () => {
      disclaimerModal.close();
    });
  }

  /* ── Promo Banner dismiss ── */
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

  /* ── Nav scroll behaviour ── */
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

  /* ── Mobile menu ── */
  const hamburger = $('#nav-hamburger');
  const mobileMenu = $('#mobile-menu');
  const overlay = $('#nav-overlay');

  function closeMobile() {
    hamburger?.classList.remove('is-open');
    hamburger?.setAttribute('aria-expanded', 'false');
    mobileMenu?.classList.remove('is-open');
    overlay?.classList.remove('is-visible');
    document.body.style.overflow = '';
  }

  hamburger?.addEventListener('click', () => {
    const open = hamburger.classList.toggle('is-open');
    hamburger.setAttribute('aria-expanded', open);
    mobileMenu?.classList.toggle('is-open', open);
    overlay?.classList.toggle('is-visible', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  overlay?.addEventListener('click', closeMobile);
  $$('.nav__mobile-link').forEach(l => l.addEventListener('click', closeMobile));

  /* ── Mega Menu ── */
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
    backdrop?.classList.add('is-visible');
    $$('.nav__item').forEach(i => i.classList.remove('active'));
    $(`.nav__item[data-menu="${key}"]`)?.classList.add('active');
  }

  function closeMega(instant = false) {
    const close = () => {
      $$('.mega-menu').forEach(m => m.classList.remove('is-open'));
      backdrop?.classList.remove('is-visible');
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

  /* ── Hero BG parallax load ── */
  const heroBg = $('#hero-bg');
  if (heroBg) {
    window.addEventListener('load', () => heroBg.classList.add('loaded'));
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      heroBg.style.transform = `scale(1) translateY(${y * 0.25}px)`;
    }, { passive: true });
  }

  /* ── Reveal on scroll ── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  $$('.reveal').forEach(el => revealObserver.observe(el));

  /* ── Specs tabs ── */
  const specData = {
    'forge-pro': {
      label: 'Cybertruck All-Wheel Drive · Dual Motor AWD',
      rows: {
        Performance: { '0–60 mph': '4.1 sec', 'Top Speed': '112 mph', 'Peak Power': '600 hp' },
        'Range & Charging': { 'Range (est.)': '325 mi', 'Fast Charge Speed': '250 kW', 'Miles in 15 min': '136 mi' },
        Drivetrain: { Motor: 'Dual Electric', Drive: 'All-Wheel Drive', 'Tow Capacity': '11,000 lbs' },
        Dimensions: { 'Overall Length': '223"', 'Width (mirrors in)': '95"', 'Bed Dimensions': "6'×4'×1.7'" }
      }
    },
    'forge-ultra': {
      label: 'Cyberbeast · Tri-Motor AWD',
      rows: {
        Performance: { '0–60 mph': '2.6 sec', 'Top Speed': '130 mph', 'Peak Power': '845 hp' },
        'Range & Charging': { 'Range (est.)': '320 mi', 'Fast Charge Speed': '250 kW', 'Miles in 15 min': '130 mi' },
        Drivetrain: { Motor: 'Tri Electric', Drive: 'All-Wheel Drive', 'Tow Capacity': '11,000 lbs' },
        Dimensions: { 'Overall Length': '223"', 'Width (mirrors in)': '95"', 'Bed Dimensions': "6'×4'×1.7'" }
      }
    },
    'forge': {
      label: 'Cybertruck RWD · Rear-Wheel Drive',
      rows: {
        Performance: { '0–60 mph': '6.5 sec', 'Top Speed': '100 mph', 'Peak Power': '315 hp' },
        'Range & Charging': { 'Range (est.)': '250 mi', 'Fast Charge Speed': '200 kW', 'Miles in 10 min': '100 mi' },
        Drivetrain: { Motor: 'Single Electric', Drive: 'Rear-Wheel Drive', 'Tow Capacity': '7,500 lbs' },
        Dimensions: { 'Overall Length': '223"', 'Width (mirrors in)': '95"', 'Bed Dimensions': "6'×4'×1.7'" }
      }
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

  /* ── Shop tabs ── */
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

  /* ── Smooth anchor scroll ── */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href === '#' || !href) return;
      const target = $(href);
      if (!target) return;
      e.preventDefault();
      closeMobile();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

})();
