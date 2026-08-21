const fs = require('fs');
const path = 'c:/Users/DANIEL/Rebuild of Jude site/index.html';
const lines = fs.readFileSync(path, 'utf8').split('\n');

// The garbled text is around lines 289-292
// Let's replace the entire hero content block cleanly
let newHeroContent = 
    <div class="hero__content">
      <div class="hero__brand-tag reveal">AxisEV Exclusive · Limited Allocation</div>
      <h1 class="hero__title reveal reveal-delay-1">
        CYBER
        <span class="hero__title-accent">TRUCK</span>
      </h1>
      <p class="hero__subtitle reveal reveal-delay-2">Dual Motor AWD · From ,500 · Lease From /mo</p>
      <div class="hero__ctas reveal reveal-delay-3">
        <button class="btn btn--primary" id="hero-enquire-btn">Enquire Now</button>
        <a href="#specs" class="btn btn--ghost" id="hero-compare-btn">Compare Models</a>
      </div>
    </div>
;

// Replace lines 286 to 297 with our new block
lines.splice(286, 12, newHeroContent);

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Hero content fixed.');
