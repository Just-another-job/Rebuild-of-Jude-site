const fs = require('fs');
const path = 'c:/Users/DANIEL/Rebuild of Jude site/index.html';
const lines = fs.readFileSync(path, 'utf8').split('\n');

// Fix Hero
lines[290] = '      <p class="hero__subtitle reveal reveal-delay-2">Dual Motor · From $56,350 · Lease From $790/mo</p>';

// Fix CTA
lines[439] = '        <span class="order-cta__price-strike">$80,500</span>';
lines[440] = '        <span class="order-cta__price-highlight">$56,350 (referral rate)</span>';

// RWD Truck
lines[464] = '        <div class="shop-card__badge">From <s>$61,500</s> $43,050</div>';
lines[469] = '          <div class="shop-card__tag">Single Motor · RWD</div>';
lines[473] = '            <div class="shop-card__spec"><span class="spec-val">6.5s</span><span class="spec-lbl">0–60 mph</span></div>';
lines[478] = '            <span class="shop-card__price-main"><s>$61,500</s> <span class="price-highlight">$43,050</span></span>';
lines[479] = '            <span class="shop-card__price-lease">or from $600/mo</span>';

// AWD Truck
lines[490] = '        <div class="shop-card__badge shop-card__badge--blue">Most Popular · <s>$80,500</s> $56,350</div>';
lines[495] = '          <div class="shop-card__tag">Dual Motor · AWD</div>';
lines[499] = '            <div class="shop-card__spec"><span class="spec-val">4.1s</span><span class="spec-lbl">0–60 mph</span></div>';
lines[504] = '            <span class="shop-card__price-main"><s>$80,500</s> <span class="price-highlight">$56,350</span></span>';
lines[505] = '            <span class="shop-card__price-lease">or from $790/mo</span>';

// Performance Truck
lines[515] = '        <div class="shop-card__badge shop-card__badge--red">Ultimate · <s>$101,000</s> $70,700</div>';
lines[520] = '          <div class="shop-card__tag">Tri Motor · AWD</div>';
lines[522] = '          <p class="shop-card__desc">The fastest electric truck available. 0–60 in 2.6 seconds. 845 hp unleashed on demand.</p>';
lines[524] = '            <div class="shop-card__spec"><span class="spec-val">2.6s</span><span class="spec-lbl">0–60 mph</span></div>';
lines[529] = '            <span class="shop-card__price-main"><s>$101,000</s> <span class="price-highlight">$70,700</span></span>';
lines[530] = '            <span class="shop-card__price-lease">or from $990/mo</span>';

// AWD Crossover
lines[540] = '        <div class="shop-card__badge">From <s>$48,500</s> $33,950</div>';
lines[545] = '          <div class="shop-card__tag">Dual Motor · AWD</div>';
lines[549] = '            <div class="shop-card__spec"><span class="spec-val">4.8s</span><span class="spec-lbl">0–60 mph</span></div>';
lines[554] = '            <span class="shop-card__price-main"><s>$48,500</s> <span class="price-highlight">$33,950</span></span>';
lines[555] = '            <span class="shop-card__price-lease">or from $480/mo</span>';

// Luxury SUV
lines[565] = '        <div class="shop-card__badge">From <s>$81,000</s> $56,700</div>';
lines[570] = '          <div class="shop-card__tag">Dual Motor · AWD</div>';
lines[574] = '            <div class="shop-card__spec"><span class="spec-val">3.8s</span><span class="spec-lbl">0–60 mph</span></div>';
lines[579] = '            <span class="shop-card__price-main"><s>$81,000</s> <span class="price-highlight">$56,700</span></span>';
lines[580] = '            <span class="shop-card__price-lease">or from $850/mo</span>';

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Lines fixed.');
