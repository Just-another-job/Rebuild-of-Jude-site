const fs = require('fs');
const path = 'c:/Users/DANIEL/Rebuild of Jude site/index.html';
let html = fs.readFileSync(path, 'utf8');

// Fix encoding
html = html.replace(/Ã‚Â·/g, '·');
html = html.replace(/Ã¢â‚¬â€œ/g, '–');
html = html.replace(/'/g, '·');

// Fix prices
html = html.replace(/\\,500/g, '\,500');
html = html.replace(/\\,050/g, '\,050');
html = html.replace(/\\\\/g, '\');

html = html.replace(/\\,500/g, '\,500');
html = html.replace(/\\,050/g, '\,350');
html = html.replace(/\\\\/g, '\');
html = html.replace(/\\\/g, '\');

html = html.replace(/\\,500/g, '\,000');
html = html.replace(/\\,050/g, '\,700');
html = html.replace(/\,299\\\/g, '\');

html = html.replace(/\\,500/g, '\,500');
html = html.replace(/\\,950/g, '\,950');
html = html.replace(/\\\\/g, '\');

html = html.replace(/\,149\\\/g, '\');

fs.writeFileSync(path, html, 'utf8');
console.log('Fixed using Node.js');
