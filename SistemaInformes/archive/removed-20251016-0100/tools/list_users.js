const db = require('../database/connection');

async function main() {
  try {
    const ok = await db.testConnection();
    if (!ok) {
      console.error('No se pudo conectar a la base de datos');
      process.exit(1);
    }

    const usuarios = await db.userQueries.getAll();
    if (!usuarios || usuarios.length === 0) {
      console.log('No hay usuarios en la base de datos.');
      process.exit(0);
    }

    console.log('Usuarios encontrados:');
    usuarios.forEach(u => {
      console.log(`- id=${u.id} | username=${u.username} | nombre=${u.nombre} ${u.apellido} | email=${u.email} | area_id=${u.area_id || 'NULL'} | rol=${u.rol_nombre || u.rol_id}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error al listar usuarios:', err.message || err);
    process.exit(1);
  }
}

main();
