const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'si_user',
  password: 'si_password',
  database: 'sistema_informes'
});

(async () => {
  try {
    const [rows] = await pool.execute('SELECT COUNT(*) as total, estado FROM informes GROUP BY estado');
    console.log('=== RESUMEN DE INFORMES POR ESTADO ===');
    rows.forEach(r => console.log(`${r.estado}: ${r.total}`));
    
    console.log('\n=== INFORMES VISIBLES (no borrador) ===');
    const [visible] = await pool.execute('SELECT id, nombre_director, estado FROM informes WHERE estado IN ("enviado","aprobado","rechazado") ORDER BY id');
    console.log(`Total: ${visible.length}`);
    visible.forEach(r => console.log(`ID: ${r.id} | Director: ${r.nombre_director} | Estado: ${r.estado}`));
    
    process.exit(0);
  } catch(e) {
    console.error(e.message);
    process.exit(1);
  }
})();
