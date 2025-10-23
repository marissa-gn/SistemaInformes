const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();

console.log('🚀 Iniciando Sistema de Informes...');

// =================== CONFIGURACIÓN BÁSICA ===================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuración de sesiones
app.use(session({
  secret: 'sistema-informes-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Middleware básico
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer: manejo de uploads de archivos (evidencias)
const fs = require('fs');
const multer = (() => {
  try {
    return require('multer');
  } catch (e) {
    console.warn('Multer no instalado. Las subidas de archivos no estarán disponibles.');
    return null;
  }
})();

// Asegurar carpeta de uploads
const uploadsDir = path.join(__dirname, 'public', 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
} catch (e) {
  console.warn('No se pudo crear public/uploads:', e.message);
}

let upload = null;
if (multer) {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      cb(null, `${unique}-${safeName}`);
    }
  });
  // aceptar solo imágenes y limitar tamaño a 5MB por archivo
  function fileFilter(req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Tipo de archivo no permitido'), false);
  }
  upload = multer({ storage: storage, fileFilter: fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
}

// Configuración de layouts
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware para layouts (excepto inicioSesion)
app.use((req, res, next) => {
  if (req.path === '/inicioSesion') {
    res.locals.layout = false;
  }
  next();
});

// Middleware para logging de requests (solo en desarrollo)
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📡 ${req.method} ${req.path}`);
  }
  next();
});

// =================== CONEXIÓN A BASE DE DATOS ===================
let userQueries = null;
let areaQueries = null;
let informeQueries = null;
let executeQuery = null;
let dbConnected = false;

async function initializeDatabase() {
  try {
    const dbConnection = require('./database/connection');
    
    const isConnected = await dbConnection.testConnection();
    if (!isConnected) {
      throw new Error('No se pudo conectar a la base de datos');
    }
    
    userQueries = dbConnection.userQueries;
    areaQueries = dbConnection.areaQueries;
    informeQueries = dbConnection.informeQueries;
    executeQuery = dbConnection.executeQuery;
    
    dbConnected = true;
    console.log('✅ Base de datos conectada correctamente');
    
    // Validar conexión con consulta simple
    const testUser = await userQueries.getByUsername('marissa.gomez');
    console.log('✅ Consulta de prueba exitosa');
    // Comprobar existencia de tablas críticas
    try {
      const requiredTables = ['usuarios', 'areas', 'informes', 'roles'];
      const rows = await executeQuery('SHOW TABLES');
      const existing = rows.map(r => Object.values(r)[0].toLowerCase());
      const missing = requiredTables.filter(t => !existing.includes(t));
      if (missing.length > 0) {
        const msg = 'Faltan tablas en la BD: ' + missing.join(', ');
        console.error('\u274c ' + msg);
        console.error('\u26a0\ufe0f Sugerencia: Ejecuta `npm run setup-db` para crear las tablas y datos de ejemplo.');
        // Salir con código de error para que el proceso padre/CI lo detecte
        process.exitCode = 1;
        throw new Error(msg);
      }
      console.log('✅ Tablas críticas presentes en la BD');
    } catch (tblErr) {
      console.error('❌ Error validando tablas:', tblErr.message);
      throw tblErr;
    }
    
  } catch (error) {
    console.error('❌ Error inicializando BD:', error.message);
    dbConnected = false;
    throw error;
  }
}

// =================== MIDDLEWARES DE AUTENTICACIÓN ===================
const authenticateToken = (req, res, next) => {
  if (!req.session.user) {
    // Si la petición espera JSON (AJAX/fetch), devolver error 401 JSON en lugar de redirigir
    const acceptsJson = req.xhr || req.headers['accept']?.includes('application/json') || req.headers['x-requested-with'] === 'XMLHttpRequest';
    if (acceptsJson) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    return res.redirect('/inicioSesion');
  }
  req.user = req.session.user;
  next();
};

const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.rol)) {
      // Detectar si la petición espera JSON (AJAX/fetch)
      const acceptsJson = req.xhr || req.headers['accept']?.includes('application/json') || req.headers['x-requested-with'] === 'XMLHttpRequest';
      if (acceptsJson) {
        return res.status(403).json({ success: false, message: 'No tienes permisos para acceder a esta sección' });
      }
      return res.status(403).render('error', {
        title: 'Acceso Denegado',
        message: 'No tienes permisos para acceder a esta sección',
        error: { status: 403 },
        layout: false
      });
    }
    next();
  };
};

// =================== RUTAS PÚBLICAS ===================

app.get('/', (req, res) => {
  if (req.session.user) {
    switch (req.session.user.rol) {
      case 'administrador':
        return res.redirect('/inicio-admin');
      case 'capturista':
        return res.redirect('/inicio-usuario');
      case 'visitante':
        return res.redirect('/inicio-visitante');
      default:
        return res.redirect('/inicioSesion');
    }
  }
  res.redirect('/inicioSesion');
});

app.get('/inicioSesion', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('inicioSesion', { 
    title: 'Inicio de Sesión', 
    layout: false, 
    error: null 
  });
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.render('inicioSesion', { 
        title: 'Inicio de Sesión', 
        layout: false, 
        error: 'Usuario y contraseña son requeridos' 
      });
    }

    if (!dbConnected || !userQueries) {
      return res.render('inicioSesion', { 
        title: 'Inicio de Sesión', 
        layout: false, 
        error: 'Sistema temporalmente no disponible. Intente más tarde.' 
      });
    }

    const user = await userQueries.getByUsername(username);
    
    if (!user || !await bcrypt.compare(password, user.password_hash)) {
      return res.render('inicioSesion', { 
        title: 'Inicio de Sesión', 
        layout: false, 
        error: 'Usuario o contraseña incorrectos' 
      });
    }

    // Crear sesión
    req.session.user = {
      id: user.id,
      username: user.username,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      rol: user.rol_nombre
    };

    // Redirigir según rol
    switch (user.rol_nombre) {
      case 'administrador':
        return res.redirect('/inicio-admin');
      case 'capturista':
        return res.redirect('/inicio-usuario');
      case 'visitante':
        return res.redirect('/inicio-visitante');
      default:
        return res.redirect('/inicioSesion');
    }

  } catch (error) {
    console.error('Error en login:', error);
    res.render('inicioSesion', { 
      title: 'Inicio de Sesión', 
      layout: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// Logout
app.post('/logout', (req, res) => {
  console.log('📤 Cerrando sesión del usuario...');
  
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('❌ Error al cerrar sesión:', err);
      }
      
      // Limpiar cookie de sesión
      res.clearCookie('connect.sid');
      console.log('✅ Sesión cerrada exitosamente - Redirigiendo a login');
      // Redirigir directamente al login
      res.redirect('/inicioSesion');
    });
  } else {
    // Si no hay sesión, redirigir al login
    console.log('⚠️ No hay sesión activa - Redirigiendo a login');
    res.redirect('/inicioSesion');
  }
});

// También agregar ruta GET para logout (por si acaso)
app.get('/logout', (req, res) => {
  console.log('📤 Logout GET - cerrando sesión');
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('❌ Error al cerrar sesión:', err);
      }
      res.clearCookie('connect.sid');
      console.log('✅ Sesión cerrada exitosamente (GET)');
      res.render('CierreSesion', { 
        title: 'Cierre de Sesión',
        message: 'Su sesión ha sido cerrada exitosamente',
        layout: false
      });
    });
  } else {
    console.log('⚠️ No hay sesión activa (GET)');
    res.render('CierreSesion', { 
      title: 'Cierre de Sesión',
      message: 'No había sesión activa',
      layout: false
    });
  }
});

// =================== RUTAS ADMIN ===================

app.get('/inicio-admin', authenticateToken, authorizeRole('administrador'), (req, res) => {
  res.render('inicio', { 
    title: 'Inicio', 
    layout: 'layout', 
    user: req.user 
  });
});

app.get('/estadisticas', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    let estadisticas = {};
    
    if (dbConnected) {
      const totalUsuarios = await executeQuery('SELECT COUNT(*) as count FROM usuarios WHERE activo = true');
      const totalAreas = await executeQuery('SELECT COUNT(*) as count FROM areas WHERE activa = true');
      const totalInformes = await executeQuery('SELECT COUNT(*) as count FROM informes');
      const informesPendientes = await executeQuery('SELECT COUNT(*) as count FROM informes WHERE estado = "borrador"');
      const informesAprobados = await executeQuery('SELECT COUNT(*) as count FROM informes WHERE estado = "aprobado"');
      
      const informesPorArea = await executeQuery(`
        SELECT a.nombre as area, COUNT(i.id) as total
        FROM areas a
        LEFT JOIN informes i ON a.id = i.area_id
        GROUP BY a.id, a.nombre
        ORDER BY total DESC
      `);
      
      estadisticas = {
        totalUsuarios: totalUsuarios[0].count,
        totalAreas: totalAreas[0].count,
        totalInformes: totalInformes[0].count,
        informesPendientes: informesPendientes[0].count,
        informesAprobados: informesAprobados[0].count,
        informesPorArea: informesPorArea
      };
    } else {
      estadisticas = {
        totalUsuarios: 0,
        totalAreas: 0,
        totalInformes: 0,
        informesPendientes: 0,
        informesAprobados: 0,
        informesPorArea: []
      };
    }
    
    res.render('estadisticas', { 
      title: 'Estadísticas', 
      layout: 'layout', 
      user: req.user,
      estadisticas: estadisticas
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.render('estadisticas', { 
      title: 'Estadísticas', 
      layout: 'layout', 
      user: req.user,
      estadisticas: { error: 'Error al cargar estadísticas' }
    });
  }
});

app.get('/usuarios', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    let usuarios = [];
    let areas = [];
    
    if (dbConnected && userQueries) {
      usuarios = await userQueries.getAll();
    }
    
    if (dbConnected && areaQueries) {
      areas = await areaQueries.getAll();
    }

    res.render('usuarios', { 
      title: 'Usuarios', 
      layout: 'layout',
      usuarios: usuarios,
      areas: areas,
      user: req.user
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.render('usuarios', { 
      title: 'Usuarios', 
      layout: 'layout',
      usuarios: [],
      areas: [],
      user: req.user,
      error: 'Error al cargar usuarios'
    });
  }
});

// Crear usuario
app.post('/usuarios/crear', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    const { username, email, nombre, apellido, telefono, area_id, rol_id, password, numero_nomina } = req.body;

    if (!username || !email || !nombre || !apellido || !rol_id || !numero_nomina) {
      return res.status(400).json({ success: false, message: 'Campos requeridos faltantes' });
    }

    if (!dbConnected || !userQueries) {
      return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }

    // Verificar si el usuario ya existe por username o nomina
    const existingUser = await userQueries.getByUsername(username);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'El usuario ya existe' });
    }

    // hash de contraseña
    const pwd = password || 'admin123';
    const passwordHash = await bcrypt.hash(pwd, 10);

    const userId = await userQueries.create({
      username,
      email,
      password_hash: passwordHash,
      nombre,
      apellido,
      telefono: telefono || null,
      numero_nomina,
      area_id: area_id || null,
      rol_id
    });

    res.json({ success: true, message: 'Usuario creado exitosamente', userId });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar usuario
app.put('/usuarios/:id', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    const userId = req.params.id;
    const { nombre, apellido, telefono, area_id, rol_id, email, password, numero_nomina } = req.body;

    if (!nombre || !apellido || !rol_id || !numero_nomina) {
      return res.status(400).json({ success: false, message: 'Campos requeridos faltantes' });
    }

    if (!dbConnected || !userQueries) {
      return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }

    // No permitir que el usuario cambie su propio rol a través de este endpoint si aplica
    if (parseInt(userId) === req.user.id && parseInt(rol_id) !== req.user.rol_id) {
      return res.status(400).json({ success: false, message: 'No puedes cambiar tu propio rol' });
    }

    const updateData = {
      nombre,
      apellido,
      telefono: telefono || null,
      area_id: area_id ? parseInt(area_id) : null,
      rol_id: rol_id ? parseInt(rol_id) : null,
      email,
      numero_nomina
    };

    if (password && password.trim()) {
      updateData.password_hash = await bcrypt.hash(password.trim(), 10);
    }

    const result = await userQueries.update(userId, updateData);
    if (result) {
      const updatedUser = await userQueries.getById(userId);
      res.json({ success: true, message: 'Usuario actualizado exitosamente', data: updatedUser });
    } else {
      res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
    }
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear usuario
app.post('/usuarios/crear', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    const { username, email, nombre, apellido, telefono, area_id, rol_id, password, numero_nomina } = req.body;
    if (!username || !email || !nombre || !apellido || !rol_id) {
      return res.status(400).json({ success: false, message: 'Campos requeridos faltantes' });
    }

    if (!dbConnected || !userQueries) {
      return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }

    const existingUser = await userQueries.getByUsername(username);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'El usuario ya existe' });
    }

    const defaultPassword = password || 'admin123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const userId = await userQueries.create({
      username,
      email,
      password_hash: passwordHash,
      nombre,
      apellido,
      telefono: telefono || null,
      numero_nomina: numero_nomina || null,
      area_id: area_id || null,
      rol_id
    });

    res.json({ success: true, message: 'Usuario creado exitosamente', userId });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar usuario
app.put('/usuarios/:id', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    const userId = req.params.id;
    const { nombre, apellido, telefono, area_id, rol_id, email, password, numero_nomina } = req.body;

    if (!nombre || !apellido || !rol_id) {
      return res.status(400).json({ success: false, message: 'Campos requeridos faltantes' });
    }

    if (!dbConnected || !userQueries) {
      return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }

    // No permitir cambiar el rol de uno mismo
    if (parseInt(userId) === req.user.id && parseInt(rol_id) !== req.user.rol_id) {
      return res.status(400).json({ success: false, message: 'No puedes cambiar tu propio rol' });
    }

    const updateData = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email?.trim() || null,
      telefono: telefono?.trim() || null,
      area_id: area_id ? parseInt(area_id) : null,
      rol_id: rol_id ? parseInt(rol_id) : null,
      numero_nomina: numero_nomina || null
    };

    if (password?.trim()) {
      if (password.trim().length < 6) {
        return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
      }
      updateData.password_hash = await bcrypt.hash(password.trim(), 10);
    }

    const result = await userQueries.update(userId, updateData);
    if (result) {
      res.json({ success: true, message: 'Usuario actualizado exitosamente' });
    } else {
      res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
    }
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

app.get('/areas', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    let areas = [];
    
    if (dbConnected && areaQueries) {
      areas = await areaQueries.getAll();
    }
    
    res.render('areas', { 
      title: 'Áreas', 
      layout: 'layout',
      areas: areas,
      user: req.user
    });
  } catch (error) {
    console.error('Error obteniendo áreas:', error);
    res.render('areas', { 
      title: 'Áreas', 
      layout: 'layout',
      areas: [],
      user: req.user,
      error: 'Error al cargar áreas'
    });
  }
});

// =================== ENDPOINTS CRUD ÁREAS (JSON) ===================

// Crear área
app.post('/areas/crear', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre) {
      return res.status(400).json({ success: false, message: 'El nombre del área es requerido' });
    }

    if (!dbConnected || !areaQueries) {
      return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }

    const areaId = await areaQueries.create({ nombre, descripcion: descripcion || '' });
    res.json({ success: true, message: 'Área creada exitosamente', areaId });
  } catch (error) {
    console.error('Error creando área:', error);
    // Manejar duplicados de nombre de área
    if (error && (error.code === 'ER_DUP_ENTRY' || String(error.message).toLowerCase().includes('duplicate'))) {
      return res.status(400).json({ success: false, message: 'Ya existe un área con ese nombre' });
    }
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar área
app.put('/areas/:id', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    const areaId = req.params.id;
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({ success: false, message: 'El nombre del área es requerido' });
    }

    if (!dbConnected || !areaQueries) {
      return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }

    await areaQueries.update(areaId, { nombre, descripcion: descripcion || '' });
    res.json({ success: true, message: 'Área actualizada exitosamente' });
  } catch (error) {
    console.error('Error actualizando área:', error);
    if (error && (error.code === 'ER_DUP_ENTRY' || String(error.message).toLowerCase().includes('duplicate'))) {
      return res.status(400).json({ success: false, message: 'Ya existe un área con ese nombre' });
    }
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Eliminar área (marcar inactiva)
app.delete('/areas/:id', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    const areaId = req.params.id;

    if (!dbConnected) {
      return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }

    const usuarios = await executeQuery('SELECT COUNT(*) as count FROM usuarios WHERE area_id = ? AND activo = true', [areaId]);
    if (usuarios[0].count > 0) {
      return res.status(400).json({ success: false, message: 'No se puede eliminar el área porque tiene usuarios asignados' });
    }

    await executeQuery('UPDATE areas SET activa = false WHERE id = ?', [areaId]);
    res.json({ success: true, message: 'Área eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando área:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

app.get('/informes', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    let informes = [];
    
    if (dbConnected && informeQueries) {
      informes = await informeQueries.getAll();
    }
    
    res.render('VerInformes', { 
      title: 'Informes', 
      layout: 'layout',
      informes: informes,
      user: req.user
    });
  } catch (error) {
    console.error('Error obteniendo informes:', error);
    res.render('VerInformes', { 
      title: 'Todos los Informes', 
      layout: 'layout',
      informes: [],
      user: req.user,
      error: 'Error al cargar informes'
    });
  }
});

// =================== RUTAS CAPTURISTA ===================

app.get('/inicio-usuario', authenticateToken, authorizeRole('capturista'), (req, res) => {
  res.render('inicioUsuario', { 
    title: 'Inicio - Usuario', 
    layout: 'layoutUsuario', 
    user: req.user 
  });
});

app.get('/generar-informe', authenticateToken, authorizeRole('capturista'), async (req, res) => {
  try {
    let areas = [];
    
    if (dbConnected && areaQueries) {
      areas = await areaQueries.getAll();
    }
    
    res.render('GenerarInforme', { 
      title: 'Generar Informe', 
      layout: 'layoutUsuario',
      areas: areas,
      user: req.user
    });
  } catch (error) {
    console.error('Error obteniendo áreas:', error);
    res.render('GenerarInforme', { 
      title: 'Generar Informe', 
      layout: 'layoutUsuario',
      areas: [],
      user: req.user,
      error: 'Error al cargar áreas'
    });
  }
});

app.get('/historial', authenticateToken, authorizeRole('capturista'), async (req, res) => {
  try {
    let informes = [];
    
    if (dbConnected && informeQueries) {
      // Mostrar solo los informes del usuario logueado en el historial
      informes = await informeQueries.getByUser(req.user.id);
    }
    
    res.render('historial', { 
      title: 'Historial', 
      layout: 'layoutUsuario',
      informes: informes,
      user: req.user
    });
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.render('historial', { 
      title: 'Historial', 
      layout: 'layoutUsuario',
      informes: [],
      user: req.user,
      error: 'Error al cargar historial'
    });
  }
});

// RUTA PERFIL OPTIMIZADA
app.get('/perfil', authenticateToken, authorizeRole('capturista'), async (req, res) => {
  try {
    let userData = req.user;
    let areas = [];
    
    // Obtener datos completos del usuario
    if (dbConnected && userQueries) {
      try {
        const fullUserData = await userQueries.getById(req.user.id);
        if (fullUserData) {
          userData = fullUserData;
        }
      } catch (userError) {
        console.error('Error al obtener datos del usuario:', userError.message);
      }
    }
    
    // Obtener áreas desde la BD
    if (dbConnected && areaQueries) {
      try {
        areas = await areaQueries.getAll();
        console.log('✅ Áreas cargadas para perfil:', areas.length);
      } catch (areaError) {
        console.error('❌ Error obteniendo áreas:', areaError.message);
        areas = [];
      }
    }
    
      // Obtener roles dinámicamente (mejor que tenerlos hardcodeados en la vista)
      let roles = [];
      if (dbConnected) {
        try {
          roles = await executeQuery('SELECT id, nombre FROM roles ORDER BY nombre');
        } catch (rolesErr) {
          console.warn('⚠️ No se pudieron cargar los roles desde la BD:', rolesErr.message);
          roles = [];
        }
      }
    
    // Respaldo si no hay áreas de BD
    if (!areas || areas.length === 0) {
      console.log('⚠️ Usando áreas de respaldo');
      areas = [
        { id: 1, nombre: 'Departamento de Tecnologías de la Información' },
        { id: 2, nombre: 'Finanzas y Contabilidad' },
        { id: 3, nombre: 'Recursos Humanos' },
        { id: 4, nombre: 'Mercadotecnia' },
        { id: 6, nombre: 'Obras Públicas' },
        { id: 7, nombre: 'Desarrollo Social' },
        { id: 8, nombre: 'Seguridad Pública' },
        { id: 9, nombre: 'Medio Ambiente' },
        { id: 10, nombre: 'Desarrollo Económico' }
      ];
    }
    
    // Anti-caché headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.render('perfil', { 
      title: 'Perfil', 
      layout: 'layoutUsuario', 
      user: userData,
      areas: areas,
      roles: roles
    });
    
  } catch (error) {
    console.error('❌ Error en perfil:', error.message);
    
    // Respaldo completo
    const areasRespaldo = [
      { id: 1, nombre: 'Departamento de Tecnologías de la Información' },
      { id: 2, nombre: 'Finanzas y Contabilidad' },
      { id: 3, nombre: 'Recursos Humanos' },
      { id: 4, nombre: 'Mercadotecnia' },
      { id: 6, nombre: 'Obras Públicas' },
      { id: 7, nombre: 'Desarrollo Social' },
      { id: 8, nombre: 'Seguridad Pública' },
      { id: 9, nombre: 'Medio Ambiente' },
      { id: 10, nombre: 'Desarrollo Económico' }
    ];
    
    res.render('perfil', { 
      title: 'Perfil', 
      layout: 'layoutUsuario', 
      user: req.user,
      areas: areasRespaldo
    });
  }
});

// =================== APIS ===================

// API para obtener datos del perfil del usuario actual
app.get('/api/perfil', authenticateToken, async (req, res) => {
  try {
    if (!dbConnected || !userQueries) {
      return res.status(503).json({ 
        success: false, 
        message: 'Base de datos no disponible' 
      });
    }

    const userData = await userQueries.getById(req.user.id);
    if (!userData) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    const safeUserData = {
      id: userData.id,
      username: userData.username,
      nombre: userData.nombre,
      apellido: userData.apellido,
      email: userData.email,
      telefono: userData.telefono,
      area_id: userData.area_id,
      area_nombre: userData.area_nombre,
      rol_id: userData.rol_id,
      rol_nombre: userData.rol_nombre
    };

    res.json({ 
      success: true, 
      data: safeUserData 
    });
  } catch (error) {
    console.error('Error al obtener datos del perfil:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// API para actualizar perfil del usuario
app.put('/api/perfil', authenticateToken, async (req, res) => {
  try {
    if (!dbConnected || !userQueries) {
      return res.status(503).json({ 
        success: false, 
        message: 'Base de datos no disponible' 
      });
    }

    const { nombre, apellido, email, telefono, area_id, rol_id, password } = req.body;
    const userId = req.user.id;

    // Validaciones básicas
    if (!nombre?.trim() || !apellido?.trim() || !email?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nombre, apellido y email son obligatorios' 
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Formato de email inválido' 
      });
    }

    // Verificar que el email no esté en uso por otro usuario
    try {
      const existingUser = await userQueries.getByEmail(email.trim());
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ 
          success: false, 
          message: 'El email ya está en uso por otro usuario' 
        });
      }
    } catch (emailCheckError) {
      console.log('⚠️ Error verificando email único:', emailCheckError.message);
    }

    // Preparar datos para actualización
    const updateData = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.trim(),
      telefono: telefono?.trim() || null,
      area_id: area_id ? parseInt(area_id) : null,
      rol_id: rol_id ? parseInt(rol_id) : null
    };

    // Hashear nueva contraseña si se proporciona
    if (password?.trim()) {
      if (password.trim().length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: 'La contraseña debe tener al menos 6 caracteres' 
        });
      }
      
      updateData.password_hash = await bcrypt.hash(password.trim(), 10);
    }

    // Actualizar usuario en BD
    const result = await userQueries.update(userId, updateData);
    
    if (result) {
      // Obtener datos actualizados
      const updatedUser = await userQueries.getById(userId);
      
      // Actualizar sesión con nuevos datos
      req.session.user = {
        ...req.session.user,
        nombre: updatedUser.nombre,
        apellido: updatedUser.apellido,
        email: updatedUser.email,
        telefono: updatedUser.telefono,
        area_id: updatedUser.area_id,
        area_nombre: updatedUser.area_nombre
      };

      res.json({ 
        success: true, 
        message: 'Perfil actualizado exitosamente',
        data: {
          id: updatedUser.id,
          username: updatedUser.username,
          nombre: updatedUser.nombre,
          apellido: updatedUser.apellido,
          email: updatedUser.email,
          telefono: updatedUser.telefono,
          area_id: updatedUser.area_id,
          area_nombre: updatedUser.area_nombre
        }
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar el perfil' 
      });
    }
    
  } catch (error) {
    console.error('❌ Error actualizando perfil:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

// =================== RUTAS VISITANTE ===================

app.get('/ver-informes', authenticateToken, authorizeRole('visitante'), async (req, res) => {
  try {
    let informes = [];
    
    if (dbConnected && informeQueries) {
      informes = await informeQueries.getAll();
    }
    
    res.render('VerInformes', { 
      title: 'Ver Informes', 
      layout: 'layoutVisitante',
      informes: informes,
      user: req.user,
      session: req.session
    });
  } catch (error) {
    console.error('Error obteniendo informes:', error);
    res.render('VerInformes', { 
      title: 'Ver Informes', 
      layout: 'layoutVisitante',
      informes: [],
      user: req.user,
      session: req.session,
      error: 'Error al cargar informes'
    });
  }
});

app.get('/inicio-visitante', authenticateToken, authorizeRole('visitante'), (req, res) => {
  res.render('inicioVisitante', { 
    title: 'Inicio - Visitante', 
    layout: 'layoutVisitante',
    user: req.user,
    session: req.session
  });
});

// Ruta para estadísticas (visitantes pueden ver gráficas)
app.get('/estadisticas-visitante', authenticateToken, authorizeRole('visitante'), async (req, res) => {
  try {
    // Obtener estadísticas básicas
    let stats = {
      totalInformes: 0,
      informesPorArea: [],
      informesPorMes: []
    };
    
    if (dbConnected && informeQueries) {
      const informes = await informeQueries.getAll();
      stats.totalInformes = informes.length;
      
      // Agrupar por área
      const porArea = {};
      informes.forEach(informe => {
        const area = informe.area_nombre || 'Sin área';
        porArea[area] = (porArea[area] || 0) + 1;
      });
      stats.informesPorArea = Object.entries(porArea).map(([area, count]) => ({ area, count }));
    }
    
    res.render('estadisticas', { 
      title: 'Estadísticas', 
      layout: 'layoutVisitante',
      stats: stats,
      user: req.user,
      session: req.session,
      readOnly: true
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.render('estadisticas', { 
      title: 'Estadísticas', 
      layout: 'layoutVisitante',
      stats: { totalInformes: 0, informesPorArea: [], informesPorMes: [] },
      user: req.user,
      session: req.session,
      readOnly: true,
      error: 'Error al cargar estadísticas'
    });
  }
});

// =================== MANEJO DE ERRORES ===================

// Página de error 404
app.use((req, res) => {
  const acceptsJson = req.xhr || req.headers['accept']?.includes('application/json') || req.headers['x-requested-with'] === 'XMLHttpRequest';
  if (acceptsJson) {
    return res.status(404).json({ success: false, message: 'Recurso no encontrado' });
  }
  res.status(404).render('error', {
    title: 'Página no encontrada',
    message: 'La página que buscas no existe.',
    error: { status: 404 },
    layout: false
  });
});

// =================== API ROUTES ===================

// API para búsqueda de usuarios
app.get('/api/usuarios/buscar', authenticateToken, async (req, res) => {
  try {
    const { nombre, area, rol } = req.query;
    
    let query = `
      SELECT u.*, a.nombre as area_nombre, r.nombre as rol_nombre
      FROM usuarios u 
      LEFT JOIN areas a ON u.area_id = a.id 
      JOIN roles r ON u.rol_id = r.id 
      WHERE u.activo = true
    `;
    
    const params = [];
    
    if (nombre) {
      query += ` AND (u.nombre LIKE ? OR u.apellido LIKE ? OR u.username LIKE ?)`;
      params.push(`%${nombre}%`, `%${nombre}%`, `%${nombre}%`);
    }
    
    if (area) {
      query += ` AND u.area_id = ?`;
      params.push(area);
    }
    
    if (rol) {
      query += ` AND u.rol_id = ?`;
      params.push(rol);
    }
    
    query += ` ORDER BY u.nombre, u.apellido`;
    
    const usuarios = await executeQuery(query, params);
    
    res.json({
      success: true,
      data: { usuarios },
      message: `Se encontraron ${usuarios.length} usuarios`
    });
    
  } catch (error) {
    console.error('Error en búsqueda de usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar usuarios',
      error: error.message
    });
  }
});

// API para búsqueda de áreas
app.get('/api/areas/buscar', authenticateToken, async (req, res) => {
  try {
    const { nombre } = req.query;
    
    let query = `
      SELECT a.*, COUNT(u.id) as total_usuarios
      FROM areas a 
      LEFT JOIN usuarios u ON a.id = u.area_id AND u.activo = true
      WHERE a.activa = true
    `;
    
    const params = [];
    
    if (nombre) {
      query += ` AND a.nombre LIKE ?`;
      params.push(`%${nombre}%`);
    }
    
    query += ` GROUP BY a.id ORDER BY a.nombre`;
    
    const areas = await executeQuery(query, params);
    
    res.json({
      success: true,
      data: { areas },
      message: `Se encontraron ${areas.length} áreas`
    });
    
  } catch (error) {
    console.error('Error en búsqueda de áreas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar áreas',
      error: error.message
    });
  }
});

// API para obtener datos para filtros
app.get('/api/filtros', authenticateToken, async (req, res) => {
  try {
    const areas = await areaQueries.getAll();
    const roles = await executeQuery('SELECT id, nombre FROM roles ORDER BY nombre');
    
    res.json({
      success: true,
      data: {
        areas: areas,
        roles: roles
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo filtros:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos de filtros'
    });
  }
});

// Manejo de errores globales
app.use((err, req, res, next) => {
  console.error('Error capturado:', err);
  const acceptsJson = req.xhr || req.headers['accept']?.includes('application/json') || req.headers['x-requested-with'] === 'XMLHttpRequest';
  if (acceptsJson) {
    return res.status(500).json({ success: false, message: 'Error interno del servidor', error: err && err.message ? err.message : String(err) });
  }
  res.status(500).render('error', {
    title: 'Error del servidor',
    message: 'Ha ocurrido un error interno.',
    error: err,
    layout: false
  });
});

// =================== INICIAR SERVIDOR ===================

async function startServer() {
  try {
    await initializeDatabase();
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🌐 Servidor ejecutándose en http://localhost:${PORT}`);
      console.log('✅ Sistema de Informes listo para usar');
    });
    
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();

// Manejo de errores de proceso
process.on('uncaughtException', (err) => {
  console.error('❌ Error crítico no capturado:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  process.exit(1);
});

// Ruta para crear informe (acepta multipart/form-data con evidencias)
if (upload) {
  app.post('/informes/crear', authenticateToken, authorizeRole('capturista'), upload.array('evidencia_fotografica', 10), async (req, res) => {
    try {
      // Construir objeto con los campos del formulario y convertir tipos cuando aplique
      // Recopilar URL de evidencias si existen
      let evidenciaCsv = null;
      if (req.files && req.files.length > 0) {
        const urls = req.files.map(f => `/uploads/${path.basename(f.path)}`);
        evidenciaCsv = urls.join(',');
      } else if (req.body && req.body.evidencia_fotografica) {
        evidenciaCsv = req.body.evidencia_fotografica; // aceptar si viene como CSV desde cliente
      }

      // Mapear y parsear valores
      const payload = {
        usuario_id: req.user.id,
        area_id: req.body.area_id ? parseInt(req.body.area_id) : null,
        titulo: req.body.titulo || null,
        sector_beneficia: req.body.sector_beneficia || null,
        lugar_actividad: req.body.lugar_actividad || null,
        tipo_actividad: req.body.tipo_actividad || null,
        numero_beneficiarios: req.body.numero_beneficiarios ? parseInt(req.body.numero_beneficiarios) : null,
        monto_generado: req.body.monto_generado ? parseFloat(req.body.monto_generado) : null,
        monto_invertido: req.body.monto_invertido ? parseFloat(req.body.monto_invertido) : null,
        responde_solicitud_ciudadania: (req.body.responde_solicitud_ciudadania === '1' || String(req.body.responde_solicitud_ciudadania).toLowerCase() === 'si' || String(req.body.responde_solicitud_ciudadania).toLowerCase() === 'true') ? 1 : (req.body.responde_solicitud_ciudadania === '0' || String(req.body.responde_solicitud_ciudadania).toLowerCase() === 'no' || String(req.body.responde_solicitud_ciudadania).toLowerCase() === 'false' ? 0 : null),
        pertenece_procedimientos_area: (req.body.pertenece_procedimientos_area === '1' || String(req.body.pertenece_procedimientos_area).toLowerCase() === 'si' || String(req.body.pertenece_procedimientos_area).toLowerCase() === 'true') ? 1 : (req.body.pertenece_procedimientos_area === '0' || String(req.body.pertenece_procedimientos_area).toLowerCase() === 'no' || String(req.body.pertenece_procedimientos_area).toLowerCase() === 'false' ? 0 : null),
        descripcion_actividad: req.body.descripcion_actividad || null,
        objetivos: req.body.objetivos || null,
        resultados: req.body.resultados || null,
        observaciones: req.body.observaciones || null,
        evidencia_fotografica: evidenciaCsv || null,
        fecha_actividad: req.body.fecha_actividad || null,
        estado: req.body.estado || 'borrador'
      };

      if (!dbConnected || !informeQueries) {
        return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
      }

      try {
        const informeId = await informeQueries.create(payload);
        res.json({ success: true, message: 'Informe creado exitosamente', informeId });
      } catch (dbErr) {
        // borrar archivos subidos si la inserción falla
        if (req.files && req.files.length) {
          try { req.files.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); }); } catch (e) { console.error('Error borrando archivos:', e.message); }
        }
        throw dbErr;
      }
    } catch (error) {
      console.error('Error creando informe con archivos:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  });
} else {
  // Fallback: si multer no está instalado, mantener una ruta que responde con error instructivo
  app.post('/informes/crear', authenticateToken, authorizeRole('capturista'), async (req, res) => {
    res.status(500).json({ success: false, message: 'Carga de archivos no configurada en el servidor (instala multer).' });
  });
}