const mysql = require('mysql2/promise');
const dbConfig = {
  host: 'localhost',
  user: 'si_user',
  password: 'si_password',
  database: 'sistema_informes',
  waitForConnections: true,
  connectionLimit: 10
};

async function testInsertInforme() {
  try {
    const pool = mysql.createPool(dbConfig);

    // Insertar un informe de prueba
    const query = `
      INSERT INTO informes (
        usuario_id, area_id, nombre_director, fecha_actividad, lugar_actividad, 
        colonia_comunidad, tipo_actividad, cantidad, descripcion_actividad, 
        sector_beneficia, numero_beneficiarios, monto_generado, 
        pertenece_procedimientos_area, responde_solicitud_ciudadania, 
        evidencia_fotografica, observaciones, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      1, // usuario_id
      1, // area_id
      'Director Test', // nombre_director
      '2025-11-24', // fecha_actividad
      'Lugar Test', // lugar_actividad
      'Colonia Test', // colonia_comunidad
      'Tipo Test', // tipo_actividad
      5, // cantidad
      'Descripción de prueba para verificar inserción', // descripcion_actividad
      'Sector Test', // sector_beneficia
      10, // numero_beneficiarios
      1000.00, // monto_generado
      1, // pertenece_procedimientos_area
      0, // responde_solicitud_ciudadania
      null, // evidencia_fotografica
      'Observación de prueba', // observaciones
      'borrador' // estado
    ];

    const [result] = await pool.execute(query, params);
    console.log('✅ Informe insertado exitosamente');
    console.log('📊 ID del informe:', result.insertId);

    // Verificar que se insertó
    const [check] = await pool.execute('SELECT COUNT(*) as total FROM informes');
    console.log('📋 Total de informes en la BD:', check[0].total);

    // Mostrar el informe que acabamos de insertar
    const [inserted] = await pool.execute(
      'SELECT id, usuario_id, area_id, estado, nombre_director, fecha_creacion FROM informes WHERE id = ?',
      [result.insertId]
    );
    console.log('📄 Informe creado:', inserted[0]);

    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    console.error('Stack:', e.stack);
    process.exit(1);
  }
}

testInsertInforme();
