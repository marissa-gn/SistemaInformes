const dbConnection = require('./connection');

async function checkUsers() {
  try {
    const usuarios = await dbConnection.executeQuery(
      `SELECT id, nombre, apellido, rol FROM usuarios WHERE rol = 'capturista' ORDER BY id`
    );
    
    console.log('Usuarios capturistas en la base de datos:');
    usuarios.forEach(user => {
      console.log(`ID: ${user.id}, Nombre: ${user.nombre} ${user.apellido}, Rol: ${user.rol}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUsers();
