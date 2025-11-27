const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'si_user',
  password: 'si_password',
  database: 'sistema_informes'
});

(async () => {
  try {
    const informes = [
      { usuario_id: 1, area_id: 1, nombre_director: 'Juan Pérez', lugar_actividad: 'Palacio', colonia_comunidad: 'Centro', tipo_actividad: 'Reunión', cantidad: 1, numero_beneficiarios: 30, monto_generado: 5000, monto_invertido: 2000, sector_beneficia: 'Empleados', descripcion_actividad: 'Reunión de coordinación', observaciones: 'Exitosa', estado: 'borrador' },
      { usuario_id: 2, area_id: 2, nombre_director: 'María López', lugar_actividad: 'Oficina', colonia_comunidad: 'Centro', tipo_actividad: 'Capacitación', cantidad: 2, numero_beneficiarios: 50, monto_generado: 10000, monto_invertido: 5000, sector_beneficia: 'Empleados', descripcion_actividad: 'Capacitación al personal', observaciones: 'Muy bien', estado: 'enviado' },
      { usuario_id: 2, area_id: 2, nombre_director: 'Carlos García', lugar_actividad: 'Delegación', colonia_comunidad: 'Sur', tipo_actividad: 'Atención', cantidad: 3, numero_beneficiarios: 100, monto_generado: 15000, monto_invertido: 8000, sector_beneficia: 'Ciudadanos', descripcion_actividad: 'Atención a ciudadanos', observaciones: 'Bueno', estado: 'enviado' },
      { usuario_id: 3, area_id: 3, nombre_director: 'Ana Martínez', lugar_actividad: 'Parque', colonia_comunidad: 'Norte', tipo_actividad: 'Evento', cantidad: 1, numero_beneficiarios: 200, monto_generado: 20000, monto_invertido: 12000, sector_beneficia: 'Comunidad', descripcion_actividad: 'Evento comunitario', observaciones: 'Exitoso', estado: 'aprobado' },
      { usuario_id: 3, area_id: 3, nombre_director: 'Roberto Díaz', lugar_actividad: 'Escuela', colonia_comunidad: 'Poniente', tipo_actividad: 'Taller', cantidad: 2, numero_beneficiarios: 80, monto_generado: 8000, monto_invertido: 4000, sector_beneficia: 'Educación', descripcion_actividad: 'Taller educativo', observaciones: 'Regular', estado: 'rechazado' },
      { usuario_id: 1, area_id: 1, nombre_director: 'Pedro Sánchez', lugar_actividad: 'Alcaldía', colonia_comunidad: 'Centro', tipo_actividad: 'Junta', cantidad: 1, numero_beneficiarios: 20, monto_generado: 3000, monto_invertido: 1500, sector_beneficia: 'Directivos', descripcion_actividad: 'Junta administrativa', observaciones: 'Productiva', estado: 'aprobado' },
      { usuario_id: 2, area_id: 2, nombre_director: 'Laura Rodríguez', lugar_actividad: 'Biblioteca', colonia_comunidad: 'Centro', tipo_actividad: 'Capacitación', cantidad: 1, numero_beneficiarios: 40, monto_generado: 6000, monto_invertido: 3000, sector_beneficia: 'Público', descripcion_actividad: 'Capacitación en tecnología', observaciones: 'Satisfactoria', estado: 'borrador' }
    ];

    for (const inf of informes) {
      const query = `INSERT INTO informes (usuario_id, area_id, nombre_director, lugar_actividad, colonia_comunidad, tipo_actividad, cantidad, numero_beneficiarios, monto_generado, monto_invertido, sector_beneficia, descripcion_actividad, observaciones, estado, fecha_actividad) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
      const params = [inf.usuario_id, inf.area_id, inf.nombre_director, inf.lugar_actividad, inf.colonia_comunidad, inf.tipo_actividad, inf.cantidad, inf.numero_beneficiarios, inf.monto_generado, inf.monto_invertido, inf.sector_beneficia, inf.descripcion_actividad, inf.observaciones, inf.estado];
      await pool.execute(query, params);
    }
    
    console.log('✅ Insertados 7 informes de prueba');
    process.exit(0);
  } catch(e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
