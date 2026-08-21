const fs = require('fs');
const path = 'c:/Users/DANIEL/Rebuild of Jude site/index.html';
let html = fs.readFileSync(path, 'utf8');

// Header / CTA instances
html = html.replace('AWD Electric Truck from', 'Cybertruck from');

// Nav / Footer Links
html = html.replace(/>RWD Electric Truck</g, '>Cybertruck RWD<');
html = html.replace(/>AWD Electric Truck</g, '>Cybertruck All-Wheel Drive<');
html = html.replace(/>Performance Electric Truck</g, '>Cyberbeast<');
html = html.replace(/>AWD Electric Crossover</g, '>Model Y<');
html = html.replace(/>Luxury Electric SUV</g, '>Model X<');

// Shop card exact replacements
html = html.replace('<h3 class="shop-card__name">RWD Electric Truck</h3>', '<h3 class="shop-card__name">Cybertruck RWD</h3>');
html = html.replace('<h3 class="shop-card__name">AWD Electric Truck</h3>', '<h3 class="shop-card__name">Cybertruck All-Wheel Drive</h3>');
html = html.replace('<h3 class="shop-card__name">Performance Electric Truck</h3>', '<h3 class="shop-card__name">Cyberbeast</h3>');
html = html.replace('<h3 class="shop-card__name">AWD Electric Crossover</h3>', '<h3 class="shop-card__name">Model Y Long Range</h3>');
html = html.replace('<h3 class="shop-card__name">Luxury Electric SUV</h3>', '<h3 class="shop-card__name">Model X</h3>');

// Spec Tags
html = html.replace('<div class="shop-card__tag">Single Motor · RWD</div>', '<div class="shop-card__tag">Rear-Wheel Drive</div>');
html = html.replace('<div class="shop-card__tag">Dual Motor · AWD</div>', '<div class="shop-card__tag">Dual Motor AWD</div>');
html = html.replace('<div class="shop-card__tag">Tri Motor · AWD</div>', '<div class="shop-card__tag">Tri-Motor AWD</div>');

fs.writeFileSync(path, html, 'utf8');
console.log('Names updated to real Tesla trims.');
