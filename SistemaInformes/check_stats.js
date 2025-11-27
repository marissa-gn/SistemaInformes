const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'si_user',
  password: 'si_password',
  database: 'sistema_informes'
});

(async () => {
  try {
    // Check usuarios endpoint data
    const [usuarios] = await pool.execute(`
      SELECT 
        u.id as usuario_id,
        CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
        COUNT(i.id) as total_informes,
        SUM(CASE WHEN i.estado = 'enviado' THEN 1 ELSE 0 END) as enviados,
        SUM(CASE WHEN i.estado = 'aprobado' THEN 1 ELSE 0 END) as aprobados,
        SUM(CASE WHEN i.estado = 'rechazado' THEN 1 ELSE 0 END) as rechazados
      FROM usuarios u
      LEFT JOIN informes i ON u.id = i.usuario_id 
        AND i.estado IN ('enviado', 'aprobado', 'rechazado')
      WHERE u.activo = 1
      GROUP BY u.id, u.nombre, u.apellido
      ORDER BY total_informes DESC
      LIMIT 10
    `);

    console.log('✅ USUARIOS Y SUS INFORMES:');
    usuarios.forEach(u => {
      console.log(`${u.usuario_nombre} - Total: ${u.total_informes} (Enviados: ${u.enviados}, Aprobados: ${u.aprobados}, Rechazados: ${u.rechazados})`);
    });

    // Check other statistics
    const [beneficiarios] = await pool.execute(`
      SELECT nombre_director, SUM(numero_beneficiarios) as total_beneficiarios
      FROM informes
      WHERE estado IN ('enviado', 'aprobado', 'rechazado')
      GROUP BY nombre_director
      ORDER BY total_beneficiarios DESC
      LIMIT 5
    `);

    console.log('\n✅ TOP 5 DIRECTORES POR BENEFICIARIOS:');
    beneficiarios.forEach(b => {
      console.log(`${b.nombre_director}: ${b.total_beneficiarios}`);
    });

    // Check montos
    const [montos] = await pool.execute(`
      SELECT 
        SUM(CAST(monto_generado AS DECIMAL(10,2))) as total_generado,
        SUM(CAST(monto_invertido AS DECIMAL(10,2))) as total_invertido
      FROM informes
      WHERE estado IN ('enviado', 'aprobado', 'rechazado')
    `);

    console.log('\n✅ TOTALES DE MONTOS:');
    console.log(`Generado: $${montos[0].total_generado}`);
    console.log(`Invertido: $${montos[0].total_invertido}`);

    process.exit(0);
  } catch(e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
