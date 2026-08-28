/* ============================================================
   AxisEV — Inbuilt Stealth Telemetry & Activity Tracker
   js/tracker.js
   
   Silently monitors visitor arrivals and all link/CTA clicks,
   collecting rich telemetry (browser, OS, device, resolution,
   area/IP, referrer, session metrics) and forwarding to the
   secure backend (/api/track) for Telegram alerting.
   Runs 100% in the background with zero UI or performance footprint.
   ============================================================ */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────
     1. CONFIGURATION
     All sensitive Telegram tokens are kept hidden in Cloudflare
     backend functions (/api/track).
     ────────────────────────────────────────────────────────── */
  const TRACKER_CONFIG = {
    apiEndpoint: '/api/track',
    trackWhatsAppClicks: true,
    trackLinkClicks: true,
    trackPageViews: true,
    alertCooldownMs: 1200,
  };

  /* ── State & Timers ── */
  const pageStartTime = Date.now();
  let lastAlertTime = 0;
  const recentClickHashes = new Set();

  /* ── Session & Visitor Identification ── */
  function getOrCreateId(storage, key, prefix) {
    try {
      let val = storage.getItem(key);
      if (!val) {
        val = prefix + '_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        storage.setItem(key, val);
      }
      return val;
    } catch (_) {
      return prefix + '_' + Math.random().toString(36).substring(2, 10);
    }
  }

  const sessionId = getOrCreateId(sessionStorage, 'ax_sess_id', 'ses');
  const visitorId = getOrCreateId(localStorage, 'ax_vis_id', 'usr');

  /* ── Device, OS & Browser Fingerprinting ── */
  function detectClientInfo() {
    const ua = navigator.userAgent || '';

    // Browser Detection
    let browser = 'Unknown Browser';
    if (/Edg\/([0-9.]+)/.test(ua)) {
      browser = 'Microsoft Edge ' + RegExp.$1;
    } else if (/OPR\/([0-9.]+)|Opera\/([0-9.]+)/.test(ua)) {
      browser = 'Opera ' + (RegExp.$1 || RegExp.$2);
    } else if (/SamsungBrowser\/([0-9.]+)/.test(ua)) {
      browser = 'Samsung Internet ' + RegExp.$1;
    } else if (/UCBrowser\/([0-9.]+)/.test(ua)) {
      browser = 'UC Browser ' + RegExp.$1;
    } else if (/Chrome\/([0-9.]+)/.test(ua)) {
      browser = 'Google Chrome ' + RegExp.$1;
    } else if (/CriOS\/([0-9.]+)/.test(ua)) {
      browser = 'Chrome iOS ' + RegExp.$1;
    } else if (/Firefox\/([0-9.]+)|FxiOS\/([0-9.]+)/.test(ua)) {
      browser = 'Mozilla Firefox ' + (RegExp.$1 || RegExp.$2);
    } else if (/Version\/([0-9.]+).*Safari/.test(ua)) {
      browser = 'Apple Safari ' + RegExp.$1;
    }

    // OS Detection
    let os = 'Unknown OS';
    if (/iPhone/.test(ua)) {
      const match = ua.match(/OS (\d+[_\d]*)/);
      os = 'iOS ' + (match ? match[1].replace(/_/g, '.') : '');
    } else if (/iPad/.test(ua)) {
      const match = ua.match(/OS (\d+[_\d]*)/);
      os = 'iPadOS ' + (match ? match[1].replace(/_/g, '.') : '');
    } else if (/Android (\d+(\.\d+)*)/.test(ua)) {
      os = 'Android ' + RegExp.$1;
    } else if (/Windows NT 10.0/.test(ua)) {
      os = 'Windows 10/11';
    } else if (/Windows NT 6.3/.test(ua)) {
      os = 'Windows 8.1';
    } else if (/Windows NT 6.1/.test(ua)) {
      os = 'Windows 7';
    } else if (/Mac OS X (\d+[_\d]*)/.test(ua)) {
      os = 'macOS ' + RegExp.$1.replace(/_/g, '.');
    } else if (/Linux/.test(ua)) {
      os = 'Linux';
    } else if (/CrOS/.test(ua)) {
      os = 'Chrome OS';
    }

    // Device Category
    let deviceType = '💻 Desktop';
    if (/(iPhone|Android.*Mobile|Windows Phone|BlackBerry|IEMobile)/i.test(ua)) {
      deviceType = '📱 Mobile';
    } else if (/(iPad|Tablet|Android(?!.*Mobile))/i.test(ua)) {
      deviceType = '📟 Tablet';
    }

    // Screen & Hardware Specs
    const screenRes = `${window.screen.width || 0}x${window.screen.height || 0}`;
    const viewportRes = `${window.innerWidth || 0}x${window.innerHeight || 0}`;
    const dpr = window.devicePixelRatio ? window.devicePixelRatio.toFixed(1) + 'x' : '1x';
    const touch = ('ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)) ? 'Yes' : 'No';
    const ram = navigator.deviceMemory ? `~${navigator.deviceMemory} GB` : 'N/A';
    const cpuCores = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Cores` : 'N/A';
    const language = navigator.language || navigator.userLanguage || 'Unknown';
    const networkConn = navigator.connection ? (navigator.connection.effectiveType || navigator.connection.type || 'Unknown') : 'Unknown';

    return {
      ua,
      browser,
      os,
      deviceType,
      screenRes,
      viewportRes,
      dpr,
      touch,
      ram,
      cpuCores,
      language,
      networkConn
    };
  }

  /* ── Time & Formatting Helpers ── */
  function getTimeOnSite() {
    const sec = Math.floor((Date.now() - pageStartTime) / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    return `${min}m ${sec % 60}s`;
  }

  function getSessionContext() {
    return {
      sessionId,
      visitorId,
      pathname: window.location.pathname || '/',
      currentUrl: window.location.href,
      referrer: document.referrer || 'Direct / Bookmark',
      timeOnSite: getTimeOnSite(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'N/A'
    };
  }

  /* ── Silent Dispatch to Backend ── */
  function sendEvent(payload) {
    try {
      const fullData = {
        ...payload,
        client: detectClientInfo(),
        session: getSessionContext(),
        sentAt: Date.now()
      };

      const bodyStr = JSON.stringify(fullData);

      if (navigator.sendBeacon) {
        const blob = new Blob([bodyStr], { type: 'application/json' });
        navigator.sendBeacon(TRACKER_CONFIG.apiEndpoint, blob);
      } else {
        fetch(TRACKER_CONFIG.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: bodyStr,
          keepalive: true
        }).catch(() => {});
      }
    } catch (_) {
      // Completely silent fallback — never disrupt user experience
    }
  }

  /* ── 1. WhatsApp Click Tracker (Highest Priority) ── */
  function trackWhatsAppClick(customMsg, targetContext) {
    if (!TRACKER_CONFIG.trackWhatsAppClicks) return;

    const now = Date.now();
    if (now - lastAlertTime < TRACKER_CONFIG.alertCooldownMs) return;
    lastAlertTime = now;

    sendEvent({
      eventType: 'whatsapp_click',
      element: 'WhatsApp CTA Button',
      customMsg: customMsg || '',
      targetContext: targetContext || 'WhatsApp Direct CTA'
    });
  }

  /* ── 2. General Link / Button Click Tracker ── */
  function trackClick(label, href, details) {
    if (!TRACKER_CONFIG.trackLinkClicks) return;

    const hash = `${label}_${href}_${details || ''}`;
    const now = Date.now();
    if (recentClickHashes.has(hash) && (now - lastAlertTime < 3000)) return;
    recentClickHashes.add(hash);
    setTimeout(() => recentClickHashes.delete(hash), 8000);

    lastAlertTime = now;

    sendEvent({
      eventType: 'link_click',
      element: label || 'Unknown Click',
      href: href || '',
      details: details || ''
    });
  }

  /* ── 3. Page View / New Visitor Arrival ── */
  function trackPageView() {
    if (!TRACKER_CONFIG.trackPageViews) return;

    // Only alert once per tab session for initial page arrival
    if (sessionStorage.getItem('ax_pv_sent')) return;
    sessionStorage.setItem('ax_pv_sent', '1');

    sendEvent({
      eventType: 'page_view',
      element: 'Page Entry',
      href: window.location.href,
      details: `Title: ${document.title}`
    });
  }

  /* ── Global Delegated Click Listener ── */
  function initGlobalClickListeners() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('a, button');
      if (!target) return;

      // Skip elements that are handled directly via trackWhatsAppClick in main.js
      if (
        target.id === 'chat-fab' ||
        target.id === 'promo-cta-btn' ||
        target.id === 'hero-enquire-btn' ||
        target.id === 'specs-enquire-btn' ||
        target.id === 'cta-enquire-btn' ||
        target.id === 'cta-drive-btn' ||
        target.classList.contains('feature-learn-more') ||
        target.classList.contains('shop-card__btn')
      ) {
        return;
      }

      const label = target.textContent.replace(/\s+/g, ' ').trim() || 
                    target.getAttribute('aria-label') || 
                    target.id || 
                    target.tagName;
      const href = target.getAttribute('href') || '';

      // Skip internal UI-only non-navigable buttons without data actions
      if (!href && !target.dataset.menu && !target.dataset.category && !target.dataset.model) {
        return;
      }

      const details = target.dataset.menu ? `Opened Menu: ${target.dataset.menu}` 
                    : target.dataset.category ? `Shop Category: ${target.dataset.category}` 
                    : target.dataset.model ? `Specs Model: ${target.dataset.model}` 
                    : '';

      trackClick(label, href, details);
    }, { capture: true, passive: true });
  }

  /* ── Expose Clean API ── */
  window.SiteTracker = {
    trackWhatsAppClick,
    trackClick,
    trackPageView
  };

  /* ── Auto-Initialize ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initGlobalClickListeners();
      setTimeout(trackPageView, 600);
    });
  } else {
    initGlobalClickListeners();
    setTimeout(trackPageView, 600);
  }

})();
