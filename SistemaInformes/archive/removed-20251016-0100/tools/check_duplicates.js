const db = require('../database/connection');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    const ok = await db.testConnection();
    if (!ok) {
      console.error('No DB connection');
      process.exit(1);
    }

    console.log('Checking duplicate usernames/emails...');
    const [dupeUsernames] = await db.pool.query("SELECT username, COUNT(*) as c FROM usuarios GROUP BY username HAVING c>1");
    const [dupeEmails] = await db.pool.query("SELECT email, COUNT(*) as c FROM usuarios GROUP BY email HAVING c>1");
    const [dupeAreas] = await db.pool.query("SELECT nombre, COUNT(*) as c FROM areas GROUP BY nombre HAVING c>1");

    console.log('Duplicate usernames:', dupeUsernames.length ? dupeUsernames : 'none');
    console.log('Duplicate emails:', dupeEmails.length ? dupeEmails : 'none');
    console.log('Duplicate area names:', dupeAreas.length ? dupeAreas : 'none');

    // Check files referenced by informes
    console.log('\nChecking evidencia_fotografica files...');
    const [informes] = await db.pool.query('SELECT id, evidencia_fotografica FROM informes');
    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
    const missingFiles = [];
    const referencedFiles = new Set();

    for (const inf of informes) {
      if (!inf.evidencia_fotografica) continue;
      const parts = String(inf.evidencia_fotografica).split(',').map(s=>s.trim()).filter(Boolean);
      for (const p of parts) {
        // aceptar rutas absolutas o relativas que apunten a /uploads/...
        const base = p.startsWith('/uploads/') ? p.replace('/uploads/', '') : path.basename(p);
        referencedFiles.add(base);
        const full = path.join(uploadsDir, base);
        if (!fs.existsSync(full)) missingFiles.push({ informeId: inf.id, file: base });
      }
    }

    console.log('Referenced files found:', referencedFiles.size);
    if (missingFiles.length) {
      console.log('Missing files referenced in informes:');
      missingFiles.forEach(m => console.log(`- informe ${m.informeId}: ${m.file}`));
    } else {
      console.log('No missing evidence files.');
    }

    // Orphan files: files in uploads not referenced
    const allFiles = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
    const orphan = allFiles.filter(f => !referencedFiles.has(f));
    console.log('\nFiles in uploads:', allFiles.length);
    console.log('Orphan files (not referenced by any informe):', orphan.length ? orphan.slice(0,50) : 'none');

    process.exit(0);
  } catch (err) {
    console.error('Error checking duplicates:', err.message || err);
    process.exit(1);
  }
}

main();
