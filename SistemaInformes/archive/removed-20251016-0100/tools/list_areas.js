const db = require('../database/connection');

async function main(){
  try{
    await db.testConnection();
    const areas = await db.areaQueries.getAll();
    console.log('Áreas:');
    areas.forEach(a => console.log(`- id=${a.id} | nombre=${a.nombre}`));
    process.exit(0);
  }catch(err){
    console.error('Error list areas', err.message||err);
    process.exit(1);
  }
}

main();
