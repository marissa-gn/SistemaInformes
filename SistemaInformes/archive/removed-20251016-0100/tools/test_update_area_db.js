const db = require('../database/connection');

async function main(){
  try{
    await db.testConnection();
    const areaId = 1;
    const data = {
      nombre: 'Departamento de Tecnologías de la Información',
      descripcion: 'Área encargada del desarrollo y mantenimiento de sistemas informáticos'
    };
    await db.areaQueries.update(areaId, data);
    console.log('Update OK');
    process.exit(0);
  }catch(err){
    console.error('Error updating area:', err.message||err);
    process.exit(1);
  }
}

main();
