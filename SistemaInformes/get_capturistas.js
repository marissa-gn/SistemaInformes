const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'si_user',
  password: 'si_password',
  database: 'sistema_informes'
});

(async () => {
  try {
    const conn = await pool.getConnection();
    const [usuarios] = await conn.execute(
      'SELECT u.id, u.nombre, u.apellido FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE r.nombre = ? AND u.activo = 1 ORDER BY u.id',
      ['capturista']
    );
    console.log('Usuarios Capturistas Activos:');
    usuarios.forEach(u => console.log('  ID: ' + u.id + ', Nombre: ' + u.nombre + ' ' + u.apellido));
    conn.release();
    pool.end();
  } catch(e) { 
    console.error('Error:', e.message); 
  }
})();
