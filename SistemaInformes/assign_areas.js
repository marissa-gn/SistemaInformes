const mysql = require('mysql2/promise');
require('dotenv').config();

async function assignAreasToUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'si_user',
    password: process.env.DB_PASSWORD || 'si_password',
    database: process.env.DB_NAME || 'sistema_informes'
  });

  try {
    console.log('📊 Cargando datos...\n');
    
    // Obtener todas las áreas
    const [areas] = await connection.query('SELECT id, nombre FROM areas ORDER BY id');
    console.log(`✅ Áreas encontradas: ${areas.length}`);
    
    // Obtener todos los usuarios
    const [usuarios] = await connection.query('SELECT id, username, nombre, apellido FROM usuarios ORDER BY id');
    console.log(`✅ Usuarios encontrados: ${usuarios.length}\n`);

    // Distribuir usuarios entre áreas de forma cíclica
    console.log('🔄 Asignando áreas a usuarios...\n');
    
    let contador = 0;
    for (let i = 0; i < usuarios.length; i++) {
      const usuario = usuarios[i];
      const areaIndex = i % areas.length;  // Distribución cíclica
      const area = areas[areaIndex];
      
      // Actualizar usuario con su nueva área
      await connection.execute(
        'UPDATE usuarios SET area_id = ? WHERE id = ?',
        [area.id, usuario.id]
      );
      
      contador++;
      process.stdout.write(`\r✅ Usuarios actualizados: ${contador}/${usuarios.length}`);
    }

    console.log(`\n\n✅ ¡ÉXITO! Se asignaron áreas a todos los usuarios\n`);

    // Mostrar resumen de asignación
    console.log('═'.repeat(70));
    console.log('📊 RESUMEN DE ASIGNACIÓN DE ÁREAS');
    console.log('═'.repeat(70) + '\n');

    for (const area of areas) {
      const [countResult] = await connection.query(
        'SELECT COUNT(*) as count FROM usuarios WHERE area_id = ?',
        [area.id]
      );
      const count = countResult[0].count;
      if (count > 0) {
        console.log(`🏢 ${area.nombre.padEnd(40)} → ${count} usuarios`);
      }
    }

    console.log('\n' + '═'.repeat(70));
    console.log('📋 MUESTRA DE USUARIOS POR ÁREA:');
    console.log('═'.repeat(70) + '\n');

    for (const area of areas.slice(0, 5)) {
      console.log(`\n🏢 ${area.nombre}:`);
      const [usuariosArea] = await connection.query(
        'SELECT username, nombre, apellido FROM usuarios WHERE area_id = ? LIMIT 3',
        [area.id]
      );
      
      for (const usr of usuariosArea) {
        console.log(`   👤 ${usr.username.padEnd(25)} - ${usr.nombre} ${usr.apellido}`);
      }
    }

    console.log('\n' + '═'.repeat(70) + '\n');
    console.log('🎉 ¡ASIGNACIÓN COMPLETADA!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

assignAreasToUsers();
