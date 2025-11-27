// Usar el módulo de conexión existente del servidor
const path = require('path');
process.chdir(path.join(__dirname, '..'));

const dbConnection = require('./connection');

async function insertData() {
  try {
    console.log('📝 Iniciando inserción de datos de prueba...');

    // Primero, verificar qué usuarios existen
    const usuarios = await dbConnection.executeQuery(
      `SELECT u.id, u.nombre, u.apellido, r.nombre as rol 
       FROM usuarios u 
       JOIN roles r ON u.rol_id = r.id 
       WHERE r.nombre = 'capturista' 
       ORDER BY u.id`
    );
    
    console.log('\n📋 Usuarios capturistas disponibles:');
    usuarios.forEach(user => {
      console.log(`  - ID: ${user.id}, Nombre: ${user.nombre} ${user.apellido}`);
    });

    // Array de usuarios capturistas a los que agregar informes
    const usuariosIDs = usuarios.map(u => u.id);

    if (usuariosIDs.length === 0) {
      console.error('❌ No hay usuarios capturistas en la base de datos');
      process.exit(1);
    }

    // Datos de prueba variados
    const testData = [
      { nombre_director: 'Juan García', lugar: 'Centro Comunitario', colonia: 'Centro', tipo: 'Capacitación', cantidad: 50, descripcion: 'Capacitación en temas de salud comunitaria', sector: 'Salud', beneficiarios: 50, monto: 1500.00, observaciones: 'Excelente participación' },
      { nombre_director: 'María López', lugar: 'Escuela Primaria', colonia: 'Barrio Nuevo', tipo: 'Taller', cantidad: 30, descripcion: 'Taller de educación ambiental para estudiantes', sector: 'Educación', beneficiarios: 30, monto: 800.00, observaciones: 'Actividad educativa completada' },
      { nombre_director: 'Carlos Rodríguez', lugar: 'Parque Municipal', colonia: 'San José', tipo: 'Limpieza', cantidad: 40, descripcion: 'Jornada de limpieza de espacios públicos', sector: 'Ambiente', beneficiarios: 40, monto: 500.00, observaciones: 'Participación comunitaria satisfactoria' },
      { nombre_director: 'Ana Martínez', lugar: 'Mercado Central', colonia: 'Centro Histórico', tipo: 'Organización', cantidad: 25, descripcion: 'Organización de programas comunitarios', sector: 'Comercio', beneficiarios: 25, monto: 1200.00, observaciones: 'Coordinación exitosa' },
      { nombre_director: 'Pedro Sánchez', lugar: 'Hospital Local', colonia: 'Zona Médica', tipo: 'Campaña', cantidad: 60, descripcion: 'Campaña de prevención de enfermedades', sector: 'Salud', beneficiarios: 60, monto: 2000.00, observaciones: 'Impacto social positivo' },
      { nombre_director: 'Rosa García', lugar: 'Instituto Técnico', colonia: 'San Marcos', tipo: 'Conferencia', cantidad: 80, descripcion: 'Conferencia sobre emprendimiento', sector: 'Educación', beneficiarios: 80, monto: 1800.00, observaciones: 'Temas relevantes tratados' }
    ];

    let informInsertedCount = 0;

    // Para cada usuario capturista, insertar 2 informes
    for (const usuarioId of usuariosIDs) {
      for (let i = 0; i < 2; i++) {
        const dataIndex = (usuariosIDs.indexOf(usuarioId) * 2 + i) % testData.length;
        const data = testData[dataIndex];
        
        const dias = 20 - usuariosIDs.indexOf(usuarioId) - i;
        const fecha = new Date(2025, 10, dias).toISOString().split('T')[0]; // YYYY-MM-DD

        const estado = i === 0 ? 'enviado' : 'borrador';

        await dbConnection.executeQuery(
          `INSERT INTO informes (usuario_id, area_id, fecha_actividad, nombre_director, lugar_actividad, colonia_comunidad, tipo_actividad, cantidad, descripcion_actividad, sector_beneficia, numero_beneficiarios, monto_generado, pertenece_procedimientos_area, responde_solicitud_ciudadania, observaciones, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [usuarioId, 14, fecha, data.nombre_director, data.lugar, data.colonia, data.tipo, data.cantidad, data.descripcion, data.sector, data.beneficiarios, data.monto, 1, i === 0 ? 1 : 0, data.observaciones, estado]
        );
        
        console.log(`✅ Informe ${i + 1} para usuario ${usuarioId} insertado (Estado: ${estado})`);
        informInsertedCount++;
      }
    }

    // Agregar comentarios a algunos informes (simulando revisión)
    const allInformes = await dbConnection.executeQuery(`SELECT id, estado FROM informes ORDER BY fecha_creacion DESC LIMIT 4`);
    
    let updateCount = 0;
    for (const informe of allInformes) {
      if (updateCount < 2) {
        await dbConnection.executeQuery(
          `UPDATE informes SET comentarios_revision = ?, aprobado_por = 1 WHERE id = ?`,
          ['Muy buen trabajo, cumple con todos los requisitos', informe.id]
        );
        updateCount++;
      }
    }

    // Verificar
    const result = await dbConnection.executeQuery('SELECT COUNT(*) as total FROM informes');
    console.log(`\n✅ Total de informes en la base de datos: ${result[0].total}`);
    console.log(`✅ Se insertaron ${informInsertedCount} informes nuevos`);
    console.log('✅ Datos de prueba insertados exitosamente');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

insertData();
