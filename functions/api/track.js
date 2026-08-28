/**
 * Cloudflare Pages Serverless Function
 * Endpoint: /api/track
 * 
 * Secure backend handler for visitor & click telemetry.
 * Extracts Cloudflare edge geolocation (IP, City, Region, Country, Postal, Lat/Long, ISP/ASN)
 * and dispatches rich formatted alert messages directly to Telegram Bot API.
 * 
 * Telegram Bot Token & Chat ID remain 100% isolated in the backend environment.
 */

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    
    // Read Telegram credentials from environment secrets or fallback config
    const botToken = env.TELEGRAM_BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';
    const chatId = env.TELEGRAM_CHAT_ID || 'YOUR_TELEGRAM_CHAT_ID';

    // Parse request body
    let body = {};
    try {
      body = await request.json();
    } catch (_) {
      body = {};
    }

    const {
      eventType = 'click',
      element = 'Unknown Element',
      href = '',
      details = '',
      customMsg = '',
      targetContext = '',
      client = {},
      session = {},
    } = body;

    // Extract Cloudflare Edge Geo & Network Data
    const cf = request.cf || {};
    const ip = request.headers.get('cf-connecting-ip') || 
               request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               'Unknown IP';
    
    const city = cf.city || 'Unknown City';
    const region = cf.region || cf.regionCode || 'Unknown Region';
    const country = cf.country || 'Unknown Country';
    const postalCode = cf.postalCode || 'N/A';
    const latitude = cf.latitude || null;
    const longitude = cf.longitude || null;
    const timezone = cf.timezone || session.timezone || 'N/A';
    const isp = cf.asOrganization || cf.isp || 'N/A';
    const asn = cf.asn ? `AS${cf.asn}` : '';

    // Country flag emoji calculation from 2-letter ISO code
    let flagEmoji = '';
    if (country && country.length === 2) {
      flagEmoji = country
        .toUpperCase()
        .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0))) + ' ';
    }

    // Google Maps coordinates link
    const mapLink = (latitude && longitude)
      ? `<a href="https://maps.google.com/?q=${latitude},${longitude}">📍 View Exact Pin</a>`
      : 'N/A';

    // Formatter helpers
    const escapeHtml = (str) => {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };

    const ispFull = [isp, asn].filter(Boolean).join(' • ') || 'N/A';
    const timestamp = new Date().toUTCString().replace('GMT', 'UTC');

    let alertTitle = '🔔 <b>SITE ACTIVITY ALERT</b>';
    let specificContent = [];

    if (eventType === 'whatsapp_click') {
      alertTitle = '🚨 <b>WHATSAPP LEAD / LINK CLICK ALERT!</b>';
      specificContent = [
        `🎯 <b>Action:</b> WhatsApp Enquiry / Click`,
        targetContext ? `🏷️ <b>Source Context:</b> ${escapeHtml(targetContext)}` : '',
        customMsg ? `💬 <b>Message Content:</b> <i>"${escapeHtml(customMsg)}"</i>` : '',
        `📞 <b>Connected Number:</b> <code>+1 305-995-0245</code> (Flow 100% Untouched)`,
      ];
    } else if (eventType === 'link_click') {
      alertTitle = '🔗 <b>LINK / BUTTON CLICKED!</b>';
      specificContent = [
        `🎯 <b>Clicked Element:</b> ${escapeHtml(element)}`,
        href ? `🌐 <b>Target URL:</b> <code>${escapeHtml(href)}</code>` : '',
        details ? `📝 <b>Details:</b> ${escapeHtml(details)}` : '',
      ];
    } else if (eventType === 'page_view') {
      alertTitle = '👀 <b>NEW VISITOR ARRIVED ON SITE!</b>';
      specificContent = [
        `🌐 <b>Landing URL:</b> <code>${escapeHtml(session.currentUrl || '/')}</code>`,
        `🧭 <b>Referrer:</b> ${escapeHtml(session.referrer || 'Direct / None')}`,
      ];
    }

    // Construct unified rich HTML alert
    const messageLines = [
      alertTitle,
      ``,
      ...specificContent.filter(Boolean),
      ``,
      `📍 <b>Location & Area Details:</b>`,
      `• <b>IP Address:</b> <code>${escapeHtml(ip)}</code>`,
      `• <b>City / State:</b> ${escapeHtml(city)}, ${escapeHtml(region)}`,
      `• <b>Country:</b> ${flagEmoji}${escapeHtml(country)}`,
      `• <b>Postal / ZIP:</b> ${escapeHtml(postalCode)}`,
      `• <b>Coordinates:</b> ${latitude || '?'}, ${longitude || '?'} (${mapLink})`,
      `• <b>ISP / Carrier:</b> ${escapeHtml(ispFull)}`,
      `• <b>Timezone:</b> ${escapeHtml(timezone)}`,
      ``,
      `💻 <b>Device & Browser Specs:</b>`,
      `• <b>Device Type:</b> ${client.deviceType || 'Unknown'}`,
      `• <b>Operating System:</b> ${escapeHtml(client.os || 'Unknown')}`,
      `• <b>Browser:</b> ${escapeHtml(client.browser || 'Unknown')}`,
      `• <b>Screen Resolution:</b> ${client.screenRes || 'N/A'} (Viewport: ${client.viewportRes || 'N/A'}, DPR: ${client.dpr || '1x'})`,
      `• <b>Hardware Specs:</b> ${client.cpuCores || 'N/A'} | RAM: ${client.ram || 'N/A'} | Touch: ${client.touch || 'N/A'}`,
      `• <b>Language / Locale:</b> ${escapeHtml(client.language || 'Unknown')}`,
      `• <b>Network Type:</b> ${escapeHtml(client.networkConn || 'Unknown')}`,
      ``,
      `🧭 <b>Session & Page Context:</b>`,
      `• <b>Current Page:</b> <code>${escapeHtml(session.pathname || '/')}</code>`,
      `• <b>Referrer:</b> ${escapeHtml(session.referrer || 'Direct / None')}`,
      `• <b>Time on Page:</b> ${escapeHtml(session.timeOnSite || '0s')}`,
      `• <b>Session ID:</b> <code>${escapeHtml(session.sessionId || 'N/A')}</code>`,
      `• <b>Visitor ID:</b> <code>${escapeHtml(session.visitorId || 'N/A')}</code>`,
      `• <b>Timestamp:</b> ${timestamp}`
    ].filter(line => line !== null);

    const messageText = messageLines.join('\n');

    // Only dispatch if valid bot token is configured
    if (botToken && chatId && botToken !== 'YOUR_TELEGRAM_BOT_TOKEN' && chatId !== 'YOUR_TELEGRAM_CHAT_ID') {
      try {
        const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        await fetch(tgUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: messageText,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
        });
      } catch (tgErr) {
        // Fail silently in background
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err) {
    // Return silent success to client so no frontend logs or errors ever appear
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Handle OPTIONS preflight if needed
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
