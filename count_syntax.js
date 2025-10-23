const fs = require('fs');
const path = 'c:/Users/gomna/OneDrive - Universidad Autónoma del Estado de México/Desktop/SistemaInformes/SistemaInformes/public/js/sistema.js';
const s = fs.readFileSync(path,'utf8');
const counts = {
  opens: (s.match(/{/g)||[]).length,
  closes: (s.match(/}/g)||[]).length,
  backticks: (s.match(/`/g)||[]).length,
  opens_paren: (s.match(/\(/g)||[]).length,
  closes_paren: (s.match(/\)/g)||[]).length,
  semicolons: (s.match(/;/g)||[]).length
};
console.log('COUNTS', counts);
console.log('--- LAST 200 CHARACTERS ---');
console.log(s.slice(-400));
console.log('\n--- LAST 60 LINES ---');
const lines = s.split(/\r?\n/);
console.log(lines.slice(Math.max(0, lines.length-60)).join('\n'));
