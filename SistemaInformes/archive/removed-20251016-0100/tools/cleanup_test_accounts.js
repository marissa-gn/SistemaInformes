const db = require('../database/connection');
const fs = require('fs');
const path = require('path');

// Usuarios a conservar (por username)
const keep = ['marissa.gomez', 'emanuel.navor', 'jesus.sau'];

async function main() {
  try {
    const ok = await db.testConnection();
    if (!ok) {
      console.error('No se pudo conectar a la base de datos');
      process.exit(1);
    }

    // Obtener todos los usuarios
    const usuarios = await db.userQueries.getAll();
    const toDelete = usuarios.filter(u => !keep.includes(u.username));

    if (toDelete.length === 0) {
      console.log('No hay usuarios para eliminar.');
      process.exit(0);
    }

    const backupPath = path.join(__dirname, 'backup_deleted_users.sql');
    const lines = [];

    for (const u of toDelete) {
      // Backup usuario
      const cols = ['id','username','email','password_hash','nombre','apellido','telefono','area_id','rol_id','activo','created_at','updated_at'];
      const vals = cols.map(c => (u[c] === null || u[c] === undefined) ? 'NULL' : `'${String(u[c]).replace(/'/g, "''")}'`).join(', ');
      lines.push(`INSERT INTO usuarios (${cols.join(',')}) VALUES (${vals});`);

      // Backup informes del usuario
      const informes = await db.informeQueries.execute('SELECT * FROM informes WHERE usuario_id = ?', [u.id]);
      for (const inf of informes) {
        const infCols = Object.keys(inf);
        const infVals = infCols.map(c => (inf[c] === null || inf[c] === undefined) ? 'NULL' : `'${String(inf[c]).replace(/'/g, "''")}'`).join(', ');
        lines.push(`INSERT INTO informes (${infCols.join(',')}) VALUES (${infVals});`);
      }
    }

    fs.writeFileSync(backupPath, lines.join('\n'));
    console.log(`Backup escrito en ${backupPath} (contains ${toDelete.length} users and their informes)`);

    // Ejecutar borrado (DELETE) -- esto también eliminará informes por FK ON DELETE CASCADE
    const idsToDelete = toDelete.map(u => u.id);
    const [result] = await db.pool.execute(`DELETE FROM usuarios WHERE id IN (${idsToDelete.join(',')})`);

    console.log(`Usuarios eliminados: ${result.affectedRows}`);
    console.log('Operación completada. Si necesitas restaurar, ejecuta el SQL en tools/backup_deleted_users.sql');
    process.exit(0);
  } catch (err) {
    console.error('Error durante limpieza de cuentas:', err.message || err);
    process.exit(1);
  }
}

main();
