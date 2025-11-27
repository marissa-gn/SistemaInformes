/**
 * Script para limpiar usuarios inactivos y liberar sus campos UNIQUE
 * Ejecutar: node cleanup_deleted_users.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sistema_informes',
  port: process.env.DB_PORT || 3306
};

async function cleanupDeletedUsers() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos');

    // Obtener usuarios inactivos sin el prefijo "DELETED_"
    const [inactiveUsers] = await connection.execute(
      `SELECT id, username, email, numero_nomina 
       FROM usuarios 
       WHERE activo = false AND username NOT LIKE 'DELETED_%'`
    );

    console.log(`📋 Encontrados ${inactiveUsers.length} usuarios inactivos para limpiar`);

    if (inactiveUsers.length === 0) {
      console.log('✨ No hay usuarios para limpiar');
      await connection.end();
      return;
    }

    // Limpiar cada usuario
    for (const user of inactiveUsers) {
      const timestamp = Date.now();
      const deletedUsername = `DELETED_${user.id}_${timestamp}`;
      const deletedEmail = `DELETED_${user.id}_${timestamp}@deleted.local`;
      const deletedNomina = `DELETED_${user.id}_${timestamp}`;

      await connection.execute(
        `UPDATE usuarios 
         SET username = ?, email = ?, numero_nomina = ?, updated_at = NOW()
         WHERE id = ?`,
        [deletedUsername, deletedEmail, deletedNomina, user.id]
      );

      console.log(`✅ Limpiado usuario: ${user.username} (ID: ${user.id})`);
    }

    console.log(`\n🎉 Limpieza completada. ${inactiveUsers.length} usuarios procesados`);
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar
cleanupDeletedUsers();
