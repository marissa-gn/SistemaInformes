const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'public', 'js', 'sistema.js');
const src = fs.readFileSync(file, 'utf8');

const re = /function\s+([a-zA-Z0-9_]+)\s*\(|async function\s+([a-zA-Z0-9_]+)\s*\(/g;
const counts = {};
let m;
while ((m = re.exec(src)) !== null) {
  const name = m[1] || m[2];
  counts[name] = (counts[name] || 0) + 1;
}

const duplicates = Object.entries(counts).filter(([k,v]) => v>1).sort((a,b)=>b[1]-a[1]);
if (duplicates.length===0) {
  console.log('No duplicate function names found in public/js/sistema.js');
  process.exit(0);
}

console.log('Duplicate function names:');
duplicates.forEach(d => console.log(`${d[0]}: ${d[1]} times`));
process.exit(0);
