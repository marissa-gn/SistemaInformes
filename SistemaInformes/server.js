const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const app = express();

// Configuración de EJS y layouts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);

// Archivos estáticos (CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal (pantalla de bienvenida)
app.get('/', (req, res) => {
  // Renderiza la vista de informes como pantalla de inicio
  res.render('VerInformes', { title: 'Inicio' });
});

// Ruta para ver informes
app.get('/informes', (req, res) => {
  // Renderiza la vista de informes
  res.render('VerInformes', { title: 'Informes' });
});

// Ruta para ver usuarios
app.get('/usuarios', (req, res) => {
  // Renderiza la vista de usuarios
  res.render('usuarios', { title: 'Usuarios' });
});

// Ruta para ver áreas
app.get('/areas', (req, res) => {
  // Renderiza la vista de áreas
  res.render('areas', { title: 'Áreas' });
});

// Inicializa el servidor en el puerto configurado
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
