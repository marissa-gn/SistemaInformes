const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const archiveDir = path.join(projectRoot, 'archive', 'removed-20251016-0100');

const files = [
  'server-backup.js',
  'ng-build.js',
  'ng-build.bat',
  'count_syntax.js',
  'verificar-db.js',
  'verificar-estructuras.js',
  'verify-hash.js',
  'tools/backup_deleted_users.sql',
  'tools/check_duplicates.js',
  'tools/cleanup_test_accounts.js',
  'tools/find_duplicate_functions.js',
  'tools/list_areas.js',
  'tools/list_users.js',
  'tools/test_informe_visibility.js',
  'tools/test_update_area_db.js'
];

async function moveFile(rel) {
  try {
    const src = path.join(projectRoot, rel);
    if (!fs.existsSync(src)) {
      console.log(`SKIP (not found): ${rel}`);
      return;
    }
    const dest = path.join(archiveDir, rel);
    const destDir = path.dirname(dest);
    fs.mkdirSync(destDir, { recursive: true });
    fs.renameSync(src, dest);
    console.log(`MOVED: ${rel} -> archive/${rel}`);
  } catch (err) {
    console.error(`ERROR moving ${rel}:`, err.message);
  }
}

(async function main(){
  try {
    fs.mkdirSync(archiveDir, { recursive: true });
    for (const f of files) await moveFile(f);
    console.log('\nDone.');
  } catch (err) {
    console.error('Fatal:', err);
    process.exit(1);
  }
})();
