const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sistema_informes',
  charset: 'utf8mb4'
};

async function insertTestData() {
  let connection;
  try {
    // Crear conexión
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos');

    // Leer el archivo SQL
    const sqlFile = __dirname + '/insert_test_informes.sql';
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Dividir por punto y coma para ejecutar cada statement
    const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);

    for (const statement of statements) {
      if (statement.trim().startsWith('--') || statement.trim().length === 0) continue;
      
      try {
        console.log('📝 Ejecutando:', statement.substring(0, 80) + '...');
        await connection.execute(statement);
        console.log('✅ Ejecutado correctamente');
      } catch (err) {
        console.error('❌ Error:', err.message);
      }
    }

    console.log('\n✅ Inserción de datos de prueba completada');

    // Verificar los datos insertados
    const [informes] = await connection.execute('SELECT COUNT(*) as total FROM informes');
    console.log(`📊 Total de informes en la base de datos: ${informes[0].total}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

insertTestData();
