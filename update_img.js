const fs = require('fs');
const path = 'c:/Users/DANIEL/Rebuild of Jude site/index.html';
const lines = fs.readFileSync(path, 'utf8').split('\n');

// Change the image src for the Performance Electric Truck (around line 518)
lines[517] = '          <img src="assets/images/nav/Performance Electric Truck.jpg" alt="Performance Electric Truck tri-motor electric truck" class="shop-card__img" loading="lazy" />';

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Image src updated.');
