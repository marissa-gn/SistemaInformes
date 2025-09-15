const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Middleware para layouts, excepto en /inicioSesion
app.use((req, res, next) => {
  if (req.path === '/inicioSesion') {
    res.locals.layout = false;
  }
  next();
});
app.use(expressLayouts);

app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
  res.render('VerInformes', { title: 'Inicio' });
});

app.get('/inicioSesion', (req, res) => {
  res.render('inicioSesion', { title: 'Iniciar Sesión', layout: false });
});

app.get('/informes', (req, res) => {
  res.render('VerInformes', { title: 'Informes' });
});

app.get('/usuarios', (req, res) => {
  res.render('usuarios', { title: 'Usuarios' });
});

app.get('/areas', (req, res) => {
  res.render('areas', { title: 'Áreas' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`A ver checale si ya se ve en http://localhost:${PORT}`);
});

// ...existing code...
