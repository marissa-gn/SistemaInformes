const db = require('../database/connection');

async function main() {
  try {
    await db.testConnection();
    // Buscar usuario marissa.gomez
    const user = await db.userQueries.getByUsername('marissa.gomez');
    if (!user) {
      console.error('Usuario marissa.gomez no encontrado');
      process.exit(1);
    }

    // Insertar informe temporal
    const payload = {
      usuario_id: user.id,
      area_id: user.area_id || 1,
      titulo: 'INFORME_DE_PRUEBA_VISIBILIDAD',
      sector_beneficia: 'Prueba',
      lugar_actividad: 'Laboratorio',
      tipo_actividad: 'Test',
      numero_beneficiarios: 1,
      monto_generado: 0.0,
      monto_invertido: 0.0,
      responde_solicitud_ciudadania: 0,
      pertenece_procedimientos_area: 0,
      descripcion_actividad: 'Prueba de visibilidad',
      objetivos: 'Test',
      resultados: 'OK',
      observaciones: 'Ninguna',
      evidencia_fotografica: null,
      fecha_actividad: new Date().toISOString().split('T')[0],
      estado: 'borrador'
    };

    const informeId = await db.informeQueries.create(payload);
    console.log('Informe temporal creado con id=', informeId);

    // Consultar desde getAll (admin/visitante)
    const all = await db.informeQueries.getAll();
    const foundInAll = all.some(i => i.id === informeId);
    console.log('Presente en getAll():', foundInAll);

    // Consultar desde getByUser
    const byUser = await db.informeQueries.getByUser(user.id);
    const foundByUser = byUser.some(i => i.id === informeId);
    console.log('Presente en getByUser(user):', foundByUser);

    // Limpiar: borrar el informe creado
    await db.executeQuery('DELETE FROM informes WHERE id = ?', [informeId]);
    console.log('Informe temporal borrado');

    process.exit(0);
  } catch (err) {
    console.error('Error en test visibilidad:', err.message || err);
    process.exit(1);
  }
}

main();
