const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const PDFDocument = require('pdfkit');

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

    // Verificar si ya existe un usuario con ese username, email o número de nómina
    const existingAny = await executeQuery('SELECT id, activo FROM usuarios WHERE (username = ? OR email = ? OR numero_nomina = ?) AND activo = true LIMIT 1', [username, email, numero_nomina || null]);
    if (existingAny && existingAny.length > 0) {
      return res.status(400).json({ success: false, message: 'Ya existe un usuario con ese username, email o número de nómina' });
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
    // Manejar duplicados (username/email/nomina)
    if (error && (error.code === 'ER_DUP_ENTRY' || String(error.message).toLowerCase().includes('duplicate'))) {
      return res.status(400).json({ success: false, message: 'Ya existe un usuario con ese username o número de nómina' });
    }
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

// Eliminar usuario (marcar como inactivo) - soft delete
app.delete('/usuarios/:id', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    const userId = req.params.id;

    console.log(`📤 DELETE /usuarios/${userId} invoked by session user=${req.session && req.session.user ? req.session.user.id : 'no-session'}`);

    if (!dbConnected || !executeQuery) {
      return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }

    // No permitir que un administrador se elimine a sí mismo por accidente
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ success: false, message: 'No puedes eliminar tu propio usuario' });
    }

    // Obtener datos del usuario antes de eliminarlo para liberar sus campos UNIQUE
    const user = await executeQuery('SELECT id, username, email, numero_nomina FROM usuarios WHERE id = ? AND activo = true', [userId]);
    if (!user || user.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado o ya eliminado' });
    }

    // Liberar los campos UNIQUE agregando timestamp y prefijo "DELETED_"
    const timestamp = Date.now();
    const deletedUsername = `DELETED_${user[0].id}_${timestamp}`;
    const deletedEmail = `DELETED_${user[0].id}_${timestamp}@deleted.local`;
    const deletedNomina = `DELETED_${user[0].id}_${timestamp}`;

    const result = await executeQuery(
      'UPDATE usuarios SET activo = false, username = ?, email = ?, numero_nomina = ?, updated_at = NOW() WHERE id = ? AND activo = true',
      [deletedUsername, deletedEmail, deletedNomina, userId]
    );
    
    if (result && result.affectedRows > 0) {
      return res.json({ success: true, message: 'Usuario eliminado correctamente' });
    }

    return res.status(404).json({ success: false, message: 'Error al eliminar el usuario' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Fallback: permitir eliminar por POST en caso de que DELETE sea impedido por algún proxy/cliente
app.post('/usuarios/:id/delete', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(`📤 POST /usuarios/${userId}/delete invoked by session user=${req.session && req.session.user ? req.session.user.id : 'no-session'}`);

    if (!dbConnected || !executeQuery) {
      return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }

    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ success: false, message: 'No puedes eliminar tu propio usuario' });
    }

    // Obtener datos del usuario antes de eliminarlo para liberar sus campos UNIQUE
    const user = await executeQuery('SELECT id, username, email, numero_nomina FROM usuarios WHERE id = ? AND activo = true', [userId]);
    if (!user || user.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado o ya eliminado' });
    }

    // Liberar los campos UNIQUE agregando timestamp y prefijo "DELETED_"
    const timestamp = Date.now();
    const deletedUsername = `DELETED_${user[0].id}_${timestamp}`;
    const deletedEmail = `DELETED_${user[0].id}_${timestamp}@deleted.local`;
    const deletedNomina = `DELETED_${user[0].id}_${timestamp}`;

    const result = await executeQuery(
      'UPDATE usuarios SET activo = false, username = ?, email = ?, numero_nomina = ?, updated_at = NOW() WHERE id = ? AND activo = true',
      [deletedUsername, deletedEmail, deletedNomina, userId]
    );
    
    if (result && result.affectedRows > 0) {
      return res.json({ success: true, message: 'Usuario eliminado correctamente' });
    }

    return res.status(404).json({ success: false, message: 'Error al eliminar el usuario' });
  } catch (error) {
    console.error('Error eliminando usuario (POST fallback):', error);
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
    let areas = [];
    let roles = [];
    
    if (dbConnected && informeQueries) {
      informes = await informeQueries.getAll();
    }
    
    // Obtener áreas
    if (dbConnected && areaQueries) {
      try {
        areas = await areaQueries.getAll();
      } catch (areaError) {
        console.error('Error obteniendo áreas:', areaError);
        areas = [];
      }
    }
    
    // Obtener roles
    if (dbConnected) {
      try {
        roles = await executeQuery('SELECT id, nombre FROM roles ORDER BY nombre');
      } catch (roleError) {
        console.error('Error obteniendo roles:', roleError);
        roles = [];
      }
    }
    
    res.render('VerInformes', { 
      title: 'Informes', 
      layout: 'layout',
      informes: informes,
      areas: areas,
      roles: roles,
      user: req.user
    });
  } catch (error) {
    console.error('Error obteniendo informes:', error);
    res.render('VerInformes', { 
      title: 'Todos los Informes', 
      layout: 'layout',
      informes: [],
      areas: [],
      roles: [],
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

// =================== API ROUTES ===================

// API para búsqueda de usuarios
app.get('/api/usuarios/buscar', authenticateToken, async (req, res) => {
  try {
    const { nombre, area, rol } = req.query;
    console.log('🔍 API: Buscando usuarios con:', { nombre, area, rol });
    
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
    
  query += ` ORDER BY u.id`;
    
    const usuarios = await executeQuery(query, params);
    console.log('✅ Encontrados:', usuarios.length, 'usuarios');
    
    res.json({
      success: true,
      data: { usuarios },
      message: `Se encontraron ${usuarios.length} usuarios`
    });
    
  } catch (error) {
    console.error('❌ Error en búsqueda de usuarios:', error);
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
    const { nombre, area_id } = req.query;
    console.log('🔍 API: Buscando áreas con:', { nombre, area_id });
    
    let query = `
      SELECT a.*, COUNT(u.id) as total_usuarios
      FROM areas a 
      LEFT JOIN usuarios u ON a.id = u.area_id AND u.activo = true
      WHERE a.activa = true
    `;
    
    const params = [];
    
    if (area_id) {
      query += ` AND a.id = ?`;
      params.push(area_id);
    }
    
    if (nombre) {
      query += ` AND a.nombre LIKE ?`;
      params.push(`%${nombre}%`);
    }
    
    query += ` GROUP BY a.id ORDER BY a.nombre`;
    
    const areas = await executeQuery(query, params);
    console.log('✅ Encontradas:', areas.length, 'áreas');
    
    res.json({
      success: true,
      data: { areas },
      message: `Se encontraron ${areas.length} áreas`
    });
    
  } catch (error) {
    console.error('❌ Error en búsqueda de áreas:', error);
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

// =================== API DE INFORMES ===================

// API para obtener historial del usuario actual
// API para búsqueda de informes (ANTES de /:id para que no sea interceptada)
// API para obtener todos los informes (admin) - ENDPOINT ÚNICO
app.get('/api/informes', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    console.log('🔍 API: Obteniendo informes');
    console.log('📋 Parámetros completos:', JSON.stringify(req.query));
    
    if (!informeQueries) {
      return res.status(500).json({ success: false, message: 'Conexión a BD no disponible' });
    }
    
    // Obtener parámetros de filtro
    let { area_id, fecha_desde, fecha_hasta } = req.query;
    
    console.log('📌 area_id recibido:', area_id, 'tipo:', typeof area_id);
    console.log('📌 fecha_desde recibido:', fecha_desde);
    console.log('📌 fecha_hasta recibido:', fecha_hasta);
    
    // SIEMPRE hacer el JOIN para obtener nombres de usuario y área
    let query = 'SELECT i.*, u.nombre as usuario_nombre, u.apellido as usuario_apellido, a.nombre as area_nombre FROM informes i JOIN usuarios u ON i.usuario_id = u.id JOIN areas a ON i.area_id = a.id WHERE 1=1';
    const params = [];
    
    // Filtro por área
    if (area_id && area_id !== '') {
      query += ' AND i.area_id = ?';
      const areaIdInt = parseInt(area_id);
      params.push(areaIdInt);
      console.log('✅ Filtro por área_id:', areaIdInt);
    }
    
    // Filtro por fecha desde
    if (fecha_desde && fecha_desde !== '') {
      query += ' AND DATE(i.fecha_creacion) >= ?';
      params.push(fecha_desde);
      console.log('✅ Filtro desde:', fecha_desde);
    }
    
    // Filtro por fecha hasta
    if (fecha_hasta && fecha_hasta !== '') {
      query += ' AND DATE(i.fecha_creacion) <= ?';
      params.push(fecha_hasta);
      console.log('✅ Filtro hasta:', fecha_hasta);
    }
    
    query += ' ORDER BY i.fecha_creacion DESC';
    
    console.log('🔧 Query final:', query);
    console.log('🔧 Parámetros:', params);
    
    const informes = await executeQuery(query, params);
    console.log(`✅ Encontrados: ${informes.length} informes`);
    
    res.json({
      success: true,
      data: informes
    });
  } catch (error) {
    console.error('❌ Error obteniendo informes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener informes',
      error: error.message
    });
  }
});

// API para obtener historial del usuario logueado (capturista)
app.get('/api/historial', authenticateToken, authorizeRole('capturista'), async (req, res) => {
  try {
    console.log('🔍 API: Obteniendo historial para usuario:', req.user.id);
    
    if (!informeQueries) {
      return res.status(500).json({ success: false, message: 'Conexión a BD no disponible' });
    }
    
    const informes = await informeQueries.getByUser(req.user.id);
    console.log(`✅ Se encontraron ${informes.length} informes del usuario`);
    
    res.json({
      success: true,
      data: informes
    });
  } catch (error) {
    console.error('❌ Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial',
      error: error.message
    });
  }
});

app.get('/api/informes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 API: Obteniendo informe ID:', id);
    
    const query = `
      SELECT i.*, 
             u.nombre as usuario_nombre, 
             u.apellido as usuario_apellido,
             a.nombre as area_nombre,
             ap.nombre as aprobado_por_nombre
      FROM informes i
      LEFT JOIN usuarios u ON i.usuario_id = u.id
      LEFT JOIN areas a ON i.area_id = a.id
      LEFT JOIN usuarios ap ON i.aprobado_por = ap.id
      WHERE i.id = ?
    `;
    
    const informe = await executeQuery(query, [id]);
    
    if (informe && informe.length > 0) {
      console.log('✅ Informe encontrado:', id);
      res.json({
        success: true,
        data: informe[0]
      });
    } else {
      console.log('❌ Informe no encontrado:', id);
      res.status(404).json({
        success: false,
        message: 'Informe no encontrado'
      });
    }
  } catch (error) {
    console.error('❌ Error obteniendo informe:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener informe',
      error: error.message
    });
  }
});

// Ruta para crear informe
app.post('/informes/crear', 
  authenticateToken, 
  authorizeRole('capturista'),
  (req, res, next) => {
    // Si multer está disponible, usarlo para procesar archivos
    if (upload) {
      upload.array('evidencia_fotografica', 10)(req, res, next);
    } else {
      next();
    }
  },
  async (req, res) => {
    try {
      console.log('📝 POST /informes/crear - Usuario ID:', req.user.id);
      console.log('📝 Body recibido:', req.body);
      console.log('📝 Files recibidos:', req.files ? req.files.length : 'ninguno');
    
    // Validar que el usuario sea capturista (sin esta línea porque ya está validado por authorizeRole)
    if (req.user.rol !== 'capturista') {
      console.warn('⚠️ Usuario sin permiso:', req.user.id, 'Rol:', req.user.rol);
      return res.status(403).json({ success: false, message: 'No tienes permiso para crear informes' });
    }
    
    // Mapear y parsear valores
    const payload = {
      usuario_id: req.user.id,
      area_id: req.body.area_id ? parseInt(req.body.area_id) : null,
      fecha_actividad: req.body.fecha_actividad || null,
      nombre_director: req.body.nombre_director || null,
      lugar_actividad: req.body.lugar_actividad || null,
      colonia_comunidad: req.body.colonia_comunidad || null,
      tipo_actividad: req.body.tipo_actividad || null,
      cantidad: req.body.cantidad ? parseInt(req.body.cantidad) : null,
      descripcion_actividad: req.body.descripcion_actividad || null,
      sector_beneficia: req.body.sector_beneficia || null,
      numero_beneficiarios: req.body.numero_beneficiarios ? parseInt(req.body.numero_beneficiarios) : null,
      monto_generado: req.body.monto_generado ? parseFloat(req.body.monto_generado) : null,
      responde_solicitud_ciudadania: (req.body.responde_solicitud_ciudadania === '1' || String(req.body.responde_solicitud_ciudadania).toLowerCase() === 'si' || String(req.body.responde_solicitud_ciudadania).toLowerCase() === 'true') ? 1 : (req.body.responde_solicitud_ciudadania === '0' || String(req.body.responde_solicitud_ciudadania).toLowerCase() === 'no' || String(req.body.responde_solicitud_ciudadania).toLowerCase() === 'false' ? 0 : null),
      pertenece_procedimientos_area: (req.body.pertenece_procedimientos_area === '1' || String(req.body.pertenece_procedimientos_area).toLowerCase() === 'si' || String(req.body.pertenece_procedimientos_area).toLowerCase() === 'true') ? 1 : (req.body.pertenece_procedimientos_area === '0' || String(req.body.pertenece_procedimientos_area).toLowerCase() === 'no' || String(req.body.pertenece_procedimientos_area).toLowerCase() === 'false' ? 0 : null),
      observaciones: req.body.observaciones || null,
      evidencia_fotografica: null,
      estado: req.body.estado || 'borrador'
    };

    console.log('✅ Payload preparado:', JSON.stringify(payload, null, 2));

    if (!dbConnected || !informeQueries) {
      console.error('❌ Base de datos no disponible');
      return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }

    try {
      const informeId = await informeQueries.create(payload);
      console.log('✅ Informe creado con ID:', informeId);
      return res.json({ success: true, message: 'Informe creado exitosamente', informeId });
    } catch (dbErr) {
      console.error('❌ Error en base de datos:', dbErr.message);
      console.error('❌ Query:', dbErr.sql || 'N/A');
      console.error('❌ Stack:', dbErr.stack);
      return res.status(500).json({ success: false, message: 'Error en base de datos: ' + dbErr.message });
    }
  } catch (error) {
    console.error('❌ Error general creando informe:', error.message);
    console.error('❌ Stack completo:', error.stack);
    return res.status(500).json({ success: false, message: 'Error interno del servidor: ' + error.message });
  }
});

// Endpoint para actualizar un informe en borrador
app.put('/informes/:id', 
  authenticateToken, 
  authorizeRole('capturista'),
  (req, res, next) => {
    // Si multer está disponible, usarlo para procesar archivos
    if (upload) {
      upload.array('evidencia_fotografica', 10)(req, res, next);
    } else {
      next();
    }
  },
  async (req, res) => {
    try {
      const { id } = req.params;
      const informeId = parseInt(id);
      
      if (!informeId) {
        return res.status(400).json({ success: false, message: 'ID de informe inválido' });
      }

      console.log('📝 PUT /informes/:id - Actualizando informe:', informeId);

      // Verificar que el informe pertenece al usuario y está en borrador
      const checkQuery = `
        SELECT id, estado, usuario_id FROM informes WHERE id = ? AND usuario_id = ?
      `;
      
      const informe = await executeQuery(checkQuery, [informeId, req.user.id]);
      
      if (!informe || informe.length === 0) {
        return res.status(404).json({ success: false, message: 'Informe no encontrado' });
      }

      if (informe[0].estado !== 'borrador') {
        return res.status(400).json({ success: false, message: 'Solo se pueden editar informes en borrador' });
      }

      // Preparar payload para actualización
      const payload = {
        area_id: req.body.area_id ? parseInt(req.body.area_id) : null,
        fecha_actividad: req.body.fecha_actividad || null,
        nombre_director: req.body.nombre_director || null,
        lugar_actividad: req.body.lugar_actividad || null,
        colonia_comunidad: req.body.colonia_comunidad || null,
        tipo_actividad: req.body.tipo_actividad || null,
        cantidad: req.body.cantidad ? parseInt(req.body.cantidad) : null,
        descripcion_actividad: req.body.descripcion_actividad || null,
        sector_beneficia: req.body.sector_beneficia || null,
        numero_beneficiarios: req.body.numero_beneficiarios ? parseInt(req.body.numero_beneficiarios) : null,
        monto_generado: req.body.monto_generado ? parseFloat(req.body.monto_generado) : null,
        responde_solicitud_ciudadania: (req.body.responde_solicitud_ciudadania === '1' || String(req.body.responde_solicitud_ciudadania).toLowerCase() === 'si' || String(req.body.responde_solicitud_ciudadania).toLowerCase() === 'true') ? 1 : (req.body.responde_solicitud_ciudadania === '0' || String(req.body.responde_solicitud_ciudadania).toLowerCase() === 'no' || String(req.body.responde_solicitud_ciudadania).toLowerCase() === 'false' ? 0 : null),
        pertenece_procedimientos_area: (req.body.pertenece_procedimientos_area === '1' || String(req.body.pertenece_procedimientos_area).toLowerCase() === 'si' || String(req.body.pertenece_procedimientos_area).toLowerCase() === 'true') ? 1 : (req.body.pertenece_procedimientos_area === '0' || String(req.body.pertenece_procedimientos_area).toLowerCase() === 'no' || String(req.body.pertenece_procedimientos_area).toLowerCase() === 'false' ? 0 : null),
        observaciones: req.body.observaciones || null
      };

      // Construir query de actualización dinámicamente
      const fields = [];
      const values = [];
      
      Object.entries(payload).forEach(([key, val]) => {
        if (val !== undefined) {
          fields.push(`${key} = ?`);
          values.push(val);
        }
      });

      if (fields.length === 0) {
        return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
      }

      fields.push('updated_at = NOW()');
      values.push(informeId);

      const updateQuery = `UPDATE informes SET ${fields.join(', ')} WHERE id = ?`;
      
      const result = await executeQuery(updateQuery, values);

      if (result.affectedRows === 0) {
        return res.status(400).json({ success: false, message: 'No se pudo actualizar el informe' });
      }

      console.log('✅ Informe actualizado:', informeId);
      return res.json({ success: true, message: 'Informe actualizado exitosamente', informeId });

    } catch (error) {
      console.error('❌ Error actualizando informe:', error.message);
      return res.status(500).json({ success: false, message: 'Error al actualizar el informe: ' + error.message });
    }
  }
);

// Endpoint para que el admin evalúe un informe (aceptar/rechazar)
app.put('/api/informes/:id/evaluar', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, comentarios } = req.body;
    const informeId = parseInt(id);
    
    if (!informeId) {
      return res.status(400).json({ success: false, message: 'ID de informe inválido' });
    }
    
    if (!['aprobado', 'rechazado'].includes(estado)) {
      return res.status(400).json({ success: false, message: 'Estado inválido. Debe ser aprobado o rechazado' });
    }
    
    // Actualizar estado y comentarios de evaluación
    const query = `
      UPDATE informes 
      SET estado = ?, 
          comentarios_revision = ?,
          aprobado_por = ?,
          fecha_aprobacion = NOW(),
          updated_at = NOW()
      WHERE id = ?
    `;
    
    const result = await executeQuery(query, [estado, comentarios || null, req.user.id, informeId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Informe no encontrado' });
    }
    
    console.log(`✅ Informe ${informeId} evaluado como ${estado} por admin ${req.user.id}`);
    
    res.json({ 
      success: true, 
      message: `Informe ${estado} exitosamente`,
      estado: estado
    });
    
  } catch (error) {
    console.error('❌ Error al evaluar informe:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al evaluar el informe',
      error: error.message 
    });
  }
});

// Endpoint para enviar/actualizar estado del informe
app.put('/api/informes/:id/enviar', authenticateToken, authorizeRole('capturista'), async (req, res) => {
  try {
    const { id } = req.params;
    const informeId = parseInt(id);
    
    if (!informeId) {
      return res.status(400).json({ success: false, message: 'ID de informe inválido' });
    }
    
    // Actualizar estado a "enviado"
    const query = `
      UPDATE informes 
      SET estado = 'enviado', updated_at = NOW()
      WHERE id = ? AND usuario_id = ?
    `;
    
    const result = await executeQuery(query, [informeId, req.user.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Informe no encontrado o no tienes permiso para actualizarlo' });
    }
    
    res.json({ 
      success: true, 
      message: 'Informe enviado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error al enviar informe:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al enviar el informe',
      error: error.message 
    });
  }
});

// Endpoint para eliminar un informe (solo el capturista que lo creó)
app.delete('/informes/:id', authenticateToken, authorizeRole('capturista'), async (req, res) => {
  try {
    const { id } = req.params;
    const informeId = parseInt(id);
    
    if (!informeId) {
      return res.status(400).json({ success: false, message: 'ID de informe inválido' });
    }

    // Verificar que el informe pertenece al usuario actual
    const checkQuery = `
      SELECT id, usuario_id, estado FROM informes WHERE id = ? AND usuario_id = ?
    `;
    
    const informe = await executeQuery(checkQuery, [informeId, req.user.id]);
    
    if (!informe || informe.length === 0) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar este informe' });
    }

    // Permitir eliminar solo si está en borrador o enviado
    if (!['borrador', 'enviado'].includes(informe[0].estado)) {
      return res.status(400).json({ success: false, message: 'Solo se pueden eliminar informes en borrador o enviado' });
    }

    // Eliminar el informe (eliminación física)
    const deleteQuery = `DELETE FROM informes WHERE id = ?`;
    const result = await executeQuery(deleteQuery, [informeId]);

    if (result.affectedRows === 0) {
      return res.status(400).json({ success: false, message: 'No se pudo eliminar el informe' });
    }

    console.log(`✅ Informe ${informeId} eliminado por usuario ${req.user.id}`);
    
    res.json({
      success: true,
      message: 'Informe eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error al eliminar informe:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el informe',
      error: error.message
    });
  }
});

// Endpoint para descargar informe como PDF
app.get('/api/informes/:id/descargar', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const informeId = parseInt(id);
    
    if (!informeId) {
      return res.status(400).json({ success: false, message: 'ID de informe inválido' });
    }
    
    // Obtener los datos del informe
    const query = `
      SELECT i.*, u.nombre as usuario_nombre, u.apellido as usuario_apellido, 
             a.nombre as area_nombre
      FROM informes i
      JOIN usuarios u ON i.usuario_id = u.id
      JOIN areas a ON i.area_id = a.id
      WHERE i.id = ? AND i.estado = 'aprobado'
    `;
    
    const results = await executeQuery(query, [informeId]);
    
    if (!results || results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Informe no encontrado o no está aprobado para descargar' 
      });
    }
    
    const informe = results[0];
    
    // Crear documento PDF
    const doc = new PDFDocument({ 
      size: 'A4',
      margin: 50
    });
    
    // Headers para descargar como archivo
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Informe_${informeId}_${new Date().getTime()}.pdf"`);
    
    // Pipe del documento al response
    doc.pipe(res);
    
    // Encabezado con logo y título
    doc.fontSize(16).font('Helvetica-Bold').text('AYUNTAMIENTO DE ATLACOMULCO', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('Sistema de Informes', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica-Bold').text('INFORME DE ACTIVIDAD', { align: 'center' });
    doc.moveDown(1);
    
    // Línea separadora
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);
    
    // Información del informe
    doc.fontSize(11).font('Helvetica-Bold').text('Información del Informe');
    doc.fontSize(10).font('Helvetica');
    doc.text(`ID: ${informe.id}`);
    doc.text(`Fecha de Creación: ${new Date(informe.fecha_creacion).toLocaleDateString('es-ES')}`);
    doc.text(`Período: ${new Date(informe.fecha_actividad).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`);
    doc.text(`Estado: Aprobado`);
    doc.moveDown(0.3);
    
    // Información del usuario
    doc.fontSize(11).font('Helvetica-Bold').text('Información del Capturista');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Nombre: ${informe.usuario_nombre} ${informe.usuario_apellido}`);
    doc.text(`Área: ${informe.area_nombre}`);
    doc.moveDown(0.3);
    
    // Línea separadora
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);
    
    // Detalles del informe
    doc.fontSize(11).font('Helvetica-Bold').text('Detalles de la Actividad');
    doc.moveDown(0.3);
    
    // Función auxiliar para agregar campo si existe
    const addField = (label, value) => {
      if (value) {
        doc.fontSize(10).font('Helvetica-Bold').text(`${label}:`, { continued: true });
        doc.font('Helvetica').text(` ${value}`);
      }
    };
    
    // Agregar todos los campos de datos
    addField('Nombre del Director', informe.nombre_director);
    addField('Número de Beneficiarios', informe.numero_beneficiarios);
    addField('Montos Generados', `$${parseFloat(informe.montos_generados || 0).toFixed(2)}`);
    addField('Montos Invertidos', `$${parseFloat(informe.montos_invertidos || 0).toFixed(2)}`);
    addField('Sector Externo', informe.sector_externo);
    addField('Colonia', informe.colonia);
    addField('Lugar de Reunión', informe.lugar_reunion);
    addField('Tipo de Actividad', informe.tipo_actividad);
    addField('Solicitudes Recibidas', informe.numero_solicitudes);
    addField('Solicitudes Resueltas', informe.numero_solicitudes_resueltas);
    addField('Procedimientos Iniciados', informe.numero_procedimientos);
    
    doc.moveDown(0.5);
    
    // Sección de Descripción
    if (informe.descripcion_actividad) {
      doc.fontSize(11).font('Helvetica-Bold').text('Descripción de la Actividad');
      doc.fontSize(10).font('Helvetica').text(informe.descripcion_actividad, {
        align: 'justify',
        width: 445,
        height: 100
      });
      doc.moveDown(0.5);
    }
    
    // Sección de Observaciones
    if (informe.observaciones_generales) {
      doc.fontSize(11).font('Helvetica-Bold').text('Observaciones Generales');
      doc.fontSize(10).font('Helvetica').text(informe.observaciones_generales, {
        align: 'justify',
        width: 445,
        height: 100
      });
      doc.moveDown(0.5);
    }
    
    // Línea separadora final
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);
    
    // Pie de página
    doc.fontSize(8).font('Helvetica').text(
      `Documento generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`,
      { align: 'center' }
    );
    
    // Finalizar documento
    doc.end();
    
    console.log(`✅ PDF del informe ${informeId} generado exitosamente`);
    
  } catch (error) {
    console.error('❌ Error al descargar informe:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al generar el PDF',
      error: error.message 
    });
  }
});

// =================== API ENDPOINTS PARA ESTADÍSTICAS ===================

// API: Beneficiarios por actividad
app.get('/api/estadisticas/beneficiarios', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        a.nombre as area_nombre,
        SUM(i.numero_beneficiarios) as total_beneficiarios,
        COUNT(i.id) as total_actividades
      FROM areas a
      LEFT JOIN informes i ON a.id = i.area_id
        AND i.estado IN ('enviado', 'aprobado', 'rechazado')
      WHERE a.activa = 1
      GROUP BY a.id, a.nombre
      ORDER BY total_beneficiarios DESC
      LIMIT 10
    `;
    
    const results = await executeQuery(query);
    res.json({ success: true, data: results || [] });
  } catch (error) {
    console.error('❌ Error en /api/estadisticas/beneficiarios:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo beneficiarios', error: error.message });
  }
});

// API: Montos generados e invertidos por área
app.get('/api/estadisticas/montos', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        a.nombre as area_nombre,
        COALESCE(SUM(CAST(i.monto_generado AS DECIMAL(10,2))), 0) as total_generado,
        COALESCE(SUM(CAST(i.monto_invertido AS DECIMAL(10,2))), 0) as total_invertido
      FROM areas a
      LEFT JOIN informes i ON a.id = i.area_id
        AND i.estado IN ('enviado', 'aprobado', 'rechazado')
      WHERE a.activa = 1
      GROUP BY a.id, a.nombre
      ORDER BY total_generado DESC
      LIMIT 10
    `;
    
    const results = await executeQuery(query);
    res.json({ success: true, data: results || [] });
  } catch (error) {
    console.error('❌ Error en /api/estadisticas/montos:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo montos', error: error.message });
  }
});

// API: Informes por área
app.get('/api/estadisticas/areas', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        a.nombre as area_nombre,
        COUNT(i.id) as total
      FROM areas a
      LEFT JOIN informes i ON a.id = i.area_id
        AND i.estado IN ('enviado', 'aprobado', 'rechazado')
      WHERE a.activa = 1
      GROUP BY a.id, a.nombre
      ORDER BY total DESC
    `;
    
    const results = await executeQuery(query);
    res.json({ success: true, data: results || [] });
  } catch (error) {
    console.error('❌ Error en /api/estadisticas/areas:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo áreas', error: error.message });
  }
});

// API: Informes por sector beneficiado
app.get('/api/estadisticas/sectores', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        sector_beneficia,
        COUNT(*) as total
      FROM informes
      WHERE estado IN ('enviado', 'aprobado', 'rechazado')
        AND sector_beneficia IS NOT NULL
        AND sector_beneficia != ''
      GROUP BY sector_beneficia
      ORDER BY total DESC
      LIMIT 10
    `;
    
    const results = await executeQuery(query);
    res.json({ success: true, data: results || [] });
  } catch (error) {
    console.error('❌ Error en /api/estadisticas/sectores:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo sectores', error: error.message });
  }
});

// API: Informes por colonia
app.get('/api/estadisticas/colonias', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        colonia_comunidad,
        COUNT(*) as total
      FROM informes
      WHERE estado IN ('enviado', 'aprobado', 'rechazado')
        AND colonia_comunidad IS NOT NULL
        AND colonia_comunidad != ''
      GROUP BY colonia_comunidad
      ORDER BY total DESC
      LIMIT 10
    `;
    
    const results = await executeQuery(query);
    res.json({ success: true, data: results || [] });
  } catch (error) {
    console.error('❌ Error en /api/estadisticas/colonias:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo colonias', error: error.message });
  }
});

// API: Informes por lugar de actividad
app.get('/api/estadisticas/lugares', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        lugar_actividad,
        COUNT(*) as total
      FROM informes
      WHERE estado IN ('enviado', 'aprobado', 'rechazado')
        AND lugar_actividad IS NOT NULL
        AND lugar_actividad != ''
      GROUP BY lugar_actividad
      ORDER BY total DESC
      LIMIT 10
    `;
    
    const results = await executeQuery(query);
    res.json({ success: true, data: results || [] });
  } catch (error) {
    console.error('❌ Error en /api/estadisticas/lugares:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo lugares', error: error.message });
  }
});

// API: Informes por tipo de actividad
app.get('/api/estadisticas/tipos-actividad', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        tipo_actividad,
        COUNT(*) as total
      FROM informes
      WHERE estado IN ('enviado', 'aprobado', 'rechazado')
        AND tipo_actividad IS NOT NULL
        AND tipo_actividad != ''
      GROUP BY tipo_actividad
      ORDER BY total DESC
      LIMIT 10
    `;
    
    const results = await executeQuery(query);
    res.json({ success: true, data: results || [] });
  } catch (error) {
    console.error('❌ Error en /api/estadisticas/tipos-actividad:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo tipos de actividad', error: error.message });
  }
});

// API: Informes con/sin evidencia fotográfica
app.get('/api/estadisticas/evidencia', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        SUM(CASE WHEN evidencia_fotografica IS NOT NULL AND evidencia_fotografica != '' THEN 1 ELSE 0 END) as con_evidencia,
        SUM(CASE WHEN evidencia_fotografica IS NULL OR evidencia_fotografica = '' THEN 1 ELSE 0 END) as sin_evidencia
      FROM informes
      WHERE estado IN ('enviado', 'aprobado', 'rechazado')
    `;
    
    const results = await executeQuery(query);
    const data = results[0] || { con_evidencia: 0, sin_evidencia: 0 };
    res.json({ success: true, data: data });
  } catch (error) {
    console.error('❌ Error en /api/estadisticas/evidencia:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo evidencia', error: error.message });
  }
});

// API: Informes que responden solicitudes de ciudadanía
app.get('/api/estadisticas/solicitudes', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        SUM(CASE WHEN responde_solicitud_ciudadania = 1 THEN 1 ELSE 0 END) as si,
        SUM(CASE WHEN responde_solicitud_ciudadania = 0 THEN 1 ELSE 0 END) as no
      FROM informes
      WHERE estado IN ('enviado', 'aprobado', 'rechazado')
    `;
    
    const results = await executeQuery(query);
    const data = results[0] || { si: 0, no: 0 };
    res.json({ success: true, data: data });
  } catch (error) {
    console.error('❌ Error en /api/estadisticas/solicitudes:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo solicitudes', error: error.message });
  }
});

// API: Informes que pertenecen a procedimientos de área
app.get('/api/estadisticas/procedimientos', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        SUM(CASE WHEN pertenece_procedimientos_area = 1 THEN 1 ELSE 0 END) as si,
        SUM(CASE WHEN pertenece_procedimientos_area = 0 THEN 1 ELSE 0 END) as no
      FROM informes
      WHERE estado IN ('enviado', 'aprobado', 'rechazado')
    `;
    
    const results = await executeQuery(query);
    const data = results[0] || { si: 0, no: 0 };
    res.json({ success: true, data: data });
  } catch (error) {
    console.error('❌ Error en /api/estadisticas/procedimientos:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo procedimientos', error: error.message });
  }
});

// API: Informes por mes (últimos 12 meses)
app.get('/api/estadisticas/fechas', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        DATE_FORMAT(fecha_creacion, '%Y-%m') as mes,
        COUNT(*) as total
      FROM informes
      WHERE estado IN ('enviado', 'aprobado', 'rechazado')
        AND fecha_creacion >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(fecha_creacion, '%Y-%m')
      ORDER BY mes ASC
    `;
    
    const results = await executeQuery(query);
    res.json({ success: true, data: results || [] });
  } catch (error) {
    console.error('❌ Error en /api/estadisticas/fechas:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo fechas', error: error.message });
  }
});

// =================== NUEVAS GRÁFICAS: CANTIDAD, BENEFICIARIOS Y MONTOS ===================

// API: Cantidad por año/mes/semana
app.get('/api/estadisticas/cantidad-temporal', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        DATE_FORMAT(fecha_creacion, '%Y') as año,
        DATE_FORMAT(fecha_creacion, '%m') as mes,
        WEEK(fecha_creacion) as semana,
        DATE_FORMAT(fecha_creacion, '%Y-%m-%d') as fecha,
        SUM(cantidad) as total_cantidad,
        COUNT(*) as total_informes
      FROM informes
      WHERE estado IN ('enviado', 'aprobado', 'rechazado')
        AND cantidad IS NOT NULL
        AND cantidad > 0
      GROUP BY DATE_FORMAT(fecha_creacion, '%Y'), 
               DATE_FORMAT(fecha_creacion, '%m'),
               WEEK(fecha_creacion),
               DATE_FORMAT(fecha_creacion, '%Y-%m-%d')
      ORDER BY año DESC, mes DESC, semana DESC
      LIMIT 52
    `;
    
    const results = await executeQuery(query);
    res.json({ success: true, data: results || [] });
  } catch (error) {
    console.error('❌ Error en /api/estadisticas/cantidad-temporal:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo cantidad temporal', error: error.message });
  }
});

// API: Beneficiarios por año/mes/semana
app.get('/api/estadisticas/beneficiarios-temporal', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        DATE_FORMAT(fecha_creacion, '%Y') as año,
        DATE_FORMAT(fecha_creacion, '%m') as mes,
        WEEK(fecha_creacion) as semana,
        DATE_FORMAT(fecha_creacion, '%Y-%m-%d') as fecha,
        SUM(numero_beneficiarios) as total_beneficiarios,
        COUNT(*) as total_informes
      FROM informes
      WHERE estado IN ('enviado', 'aprobado', 'rechazado')
        AND numero_beneficiarios IS NOT NULL
        AND numero_beneficiarios > 0
      GROUP BY DATE_FORMAT(fecha_creacion, '%Y'), 
               DATE_FORMAT(fecha_creacion, '%m'),
               WEEK(fecha_creacion),
               DATE_FORMAT(fecha_creacion, '%Y-%m-%d')
      ORDER BY año DESC, mes DESC, semana DESC
      LIMIT 52
    `;
    
    const results = await executeQuery(query);
    res.json({ success: true, data: results || [] });
  } catch (error) {
    console.error('❌ Error en /api/estadisticas/beneficiarios-temporal:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo beneficiarios temporal', error: error.message });
  }
});

// API: Montos (generados y gastados) por año/mes/semana
app.get('/api/estadisticas/montos-temporal', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        DATE_FORMAT(fecha_creacion, '%Y') as año,
        DATE_FORMAT(fecha_creacion, '%m') as mes,
        WEEK(fecha_creacion) as semana,
        DATE_FORMAT(fecha_creacion, '%Y-%m-%d') as fecha,
        SUM(CAST(monto_generado AS DECIMAL(12,2))) as total_generado,
        COUNT(CASE WHEN monto_generado > 0 THEN 1 END) as informes_con_monto,
        COUNT(*) as total_informes
      FROM informes
      WHERE estado IN ('enviado', 'aprobado', 'rechazado')
        AND monto_generado IS NOT NULL
      GROUP BY DATE_FORMAT(fecha_creacion, '%Y'), 
               DATE_FORMAT(fecha_creacion, '%m'),
               WEEK(fecha_creacion),
               DATE_FORMAT(fecha_creacion, '%Y-%m-%d')
      ORDER BY año DESC, mes DESC, semana DESC
      LIMIT 52
    `;
    
    const results = await executeQuery(query);
    res.json({ success: true, data: results || [] });
  } catch (error) {
    console.error('❌ Error en /api/estadisticas/montos-temporal:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo montos temporal', error: error.message });
  }
});

// API: Informes por usuario (capturista)
app.get('/api/estadisticas/usuarios', authenticateToken, async (req, res) => {
  try {
    const query = `
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
      WHERE u.rol_id = (SELECT id FROM roles WHERE nombre = 'capturista') AND u.activo = 1
      GROUP BY u.id, u.nombre, u.apellido
      ORDER BY total_informes DESC
      LIMIT 20
    `;
    
    const results = await executeQuery(query);
    res.json({ success: true, data: results || [] });
  } catch (error) {
    console.error('❌ Error en /api/estadisticas/usuarios:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo usuarios', error: error.message });
  }
});

// =================== MANEJO DE ERRORES Y INICIO DEL SERVIDOR ===================

// Ruta 404 - distinguir entre API y páginas HTML
app.use((req, res) => {
  // Si es una solicitud API (contiene /api/ o acepta JSON)
  if (req.path.includes('/api/') || req.accepts('json')) {
    return res.status(404).json({ 
      success: false, 
      message: 'Ruta no encontrada' 
    });
  }
  
  // Si es una página HTML tradicional
  res.status(404).render('error', { 
    message: 'Página no encontrada',
    user: req.user 
  });
});

// Manejador de errores global (4 parámetros para que Express lo reconozca como error handler)
app.use((err, req, res, next) => {
  console.error('❌ Error global:', err.message);
  console.error('❌ Path:', req.path);
  console.error('❌ Stack:', err.stack);
  
  // Si es una solicitud API
  if (req.path.includes('/api/') || req.accepts('json')) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Error interno del servidor'
    });
  }
  
  // Si es una página HTML
  res.status(err.status || 500).render('error', {
    message: err.message || 'Error interno del servidor',
    user: req.user
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
  // No forzamos la terminación inmediata para evitar que errores puntuales
  // derriben el servidor en caliente durante pruebas o uso interactivo.
  // Marcamos un código de salida no-cero para que supervisores lo detecten.
  process.exitCode = 1;
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  // Igual que arriba: registrar y fijar exitCode en lugar de terminar de inmediato.
  process.exitCode = 1;
});