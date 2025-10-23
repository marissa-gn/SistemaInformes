const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();

console.log('🚀 Iniciando Sistema de Informes...');

// Configuración básica
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

// Middleware para layouts (excepto inicioSesion)
app.use((req, res, next) => {
  if (req.path === '/inicioSesion') {
    return next();
  }
  expressLayouts(req, res, next);
});

// Conexión a base de datos con manejo de errores robusto
let userQueries = null;
let areaQueries = null;
let informeQueries = null;
let executeQuery = null;
let dbConnected = false;

async function initializeDatabase() {
  try {
    const dbConnection = require('./database/connection');
    
    // Probar conexión primero
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
    
    // Probar una consulta simple para validar
    try {
      const testUser = await userQueries.getByUsername('marissa.gomez');
      console.log('✅ Consulta de prueba exitosa:', testUser ? 'Usuario encontrado' : 'Usuario no encontrado');
    } catch (testError) {
      console.error('⚠️ Error en consulta de prueba:', testError.message);
      dbConnected = false;
    }
    
  } catch (error) {
    console.log('⚠️ Error inicializando BD:', error.message);
    dbConnected = false;
  }
}

// Función para iniciar el servidor solo después de conectar la BD
async function startServer() {
  try {
    // Inicializar BD primero
    await initializeDatabase();
    
    // Solo iniciar el servidor si la BD está conectada
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos. El servidor no se iniciará.');
      process.exit(1);
    }
    
    // Iniciar servidor
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

// Sistema configurado para usar únicamente base de datos
// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  console.log(`🔐 Auth check para: ${req.method} ${req.path}`);
  if (!req.session.user) {
    console.log('❌ No hay sesión activa, redirigiendo a login');
    return res.redirect('/inicioSesion');
  }
  req.user = req.session.user;
  console.log(`✅ Usuario autenticado: ${req.user.username} (${req.user.rol})`);
  next();
};

// Middleware de autorización por roles
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    console.log(`🔒 Role check: Usuario ${req.user?.username} (${req.user?.rol}) para roles permitidos: [${allowedRoles.join(', ')}]`);
    if (!req.user || !allowedRoles.includes(req.user.rol)) {
      console.log(`❌ Acceso denegado: Rol ${req.user?.rol} no permitido`);
      return res.status(403).render('error', {
        title: 'Acceso Denegado',
        message: 'No tienes permisos para acceder a esta sección',
        layout: false
      });
    }
    console.log(`✅ Autorización exitosa para ${req.user.username}`);
    next();
  };
};

// Middleware para loggear todas las peticiones
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path} - Usuario: ${req.session?.user?.username || 'no autenticado'}`);
  next();
});

console.log('✅ Middlewares configurados');

// =================== RUTAS PÚBLICAS ===================

app.get('/', (req, res) => {
  if (req.session.user) {
    switch (req.session.user.rol) {
      case 'administrador':
        return res.redirect('/inicio-admin');
      case 'capturista':
        return res.redirect('/inicio-usuario');
      case 'visitante':
        return res.redirect('/ver-informes');
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

    let user = null;

    // Verificar que la base de datos esté disponible
    if (!dbConnected || !userQueries) {
      console.log('🔴 LOGIN FALLIDO - BD no disponible');
      return res.render('inicioSesion', { 
        title: 'Inicio de Sesión', 
        layout: false, 
        error: 'Sistema temporalmente no disponible. Intente más tarde.' 
      });
    }

    console.log('🔍 Intentando login para usuario:', username);

    // Autenticación únicamente con base de datos
    try {
      user = await userQueries.getByUsername(username);
      console.log('👤 Usuario obtenido de BD:', user ? user.username : 'No encontrado');
      
      if (user) {
        const isValid = await bcrypt.compare(password, user.password_hash);
        console.log('🔐 Validación de contraseña:', isValid ? 'CORRECTA' : 'INCORRECTA');
        
        if (!isValid) {
          user = null;
        }
      }
    } catch (dbError) {
      console.error('❌ Error en consulta BD:', dbError);
      return res.render('inicioSesion', { 
        title: 'Inicio de Sesión', 
        layout: false, 
        error: 'Error del sistema. Intente más tarde.' 
      });
    }

    if (!user) {
      console.log('🔴 LOGIN FALLIDO - Credenciales incorrectas');
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

    console.log('✅ LOGIN EXITOSO - Usuario:', user.username, 'Rol:', user.rol_nombre);

    // Redirigir según rol
    switch (user.rol_nombre) {
      case 'administrador':
        console.log('🏠 Redirigiendo a panel de administrador');
        return res.redirect('/inicio-admin');
      case 'capturista':
        console.log('🏠 Redirigiendo a panel de capturista');
        return res.redirect('/inicio-usuario');
      case 'visitante':
        console.log('🏠 Redirigiendo a panel de visitante');
        return res.redirect('/ver-informes');
      default:
        console.log('⚠️ Rol desconocido, redirigiendo a login');
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
  req.session.destroy((err) => {
    if (err) console.error('Error al cerrar sesión:', err);
    res.redirect('/inicioSesion');
  });
});

console.log('✅ Rutas públicas configuradas');

// =================== RUTAS ADMIN ===================

app.get('/inicio-admin', authenticateToken, authorizeRole('administrador'), (req, res) => {
  res.render('inicio', { 
    title: 'Inicio', 
    layout: 'layoutAdministrador', 
    user: req.user 
  });
});

app.get('/estadisticas', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    let estadisticas = {};
    
    if (dbConnected) {
      // Obtener estadísticas reales de la BD
      const totalUsuarios = await executeQuery('SELECT COUNT(*) as count FROM usuarios WHERE activo = true');
      const totalAreas = await executeQuery('SELECT COUNT(*) as count FROM areas WHERE activa = true');
      const totalInformes = await executeQuery('SELECT COUNT(*) as count FROM informes');
      const informesPendientes = await executeQuery('SELECT COUNT(*) as count FROM informes WHERE estado = "borrador"');
      const informesAprobados = await executeQuery('SELECT COUNT(*) as count FROM informes WHERE estado = "aprobado"');
      
      // Informes por área
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
      // Datos de ejemplo para modo offline
      estadisticas = {
        totalUsuarios: 1,
        totalAreas: 1,
        totalInformes: 0,
        informesPendientes: 0,
        informesAprobados: 0,
        informesPorArea: []
      };
    }
    
    res.render('estadisticas', { 
      title: 'Estadísticas', 
      layout: 'layoutAdministrador', 
      user: req.user,
      estadisticas: estadisticas
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.render('estadisticas', { 
      title: 'Estadísticas', 
      layout: 'layoutAdministrador', 
      user: req.user,
      estadisticas: { error: 'Error al cargar estadísticas' }
    });
  }
});

app.get('/usuarios', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    let usuarios = [];
    
    if (dbConnected && userQueries) {
      usuarios = await userQueries.getAll();
    } else {
      // Datos de ejemplo para modo offline
      usuarios = [
        { id: 1, username: 'admin', nombre: 'Administrador', apellido: 'Sistema', email: 'admin@sistema.com', rol_nombre: 'administrador' },
        { id: 2, username: 'capturista', nombre: 'Usuario', apellido: 'Capturista', email: 'capturista@sistema.com', rol_nombre: 'capturista' },
        { id: 3, username: 'visitante', nombre: 'Usuario', apellido: 'Visitante', email: 'visitante@sistema.com', rol_nombre: 'visitante' }
      ];
    }
    
    // Obtener también las áreas para los formularios
    let areas = [];
    try {
      if (dbConnected && areaQueries) {
        areas = await areaQueries.getAll();
      }
    } catch (error) {
      console.error('Error obteniendo áreas para vista usuarios:', error);
    }

    res.render('usuarios', { 
      title: 'Usuarios', 
      layout: 'layoutAdministrador',
      usuarios: usuarios,
      areas: areas,
      user: req.user
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.render('usuarios', { 
      title: 'Usuarios', 
      layout: 'layoutAdministrador',
      usuarios: [],
      user: req.user,
      error: 'Error al cargar usuarios'
    });
  }
});

app.get('/areas', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    let areas = [];
    
    if (dbConnected && areaQueries) {
      areas = await areaQueries.getAll();
    } else {
      // Datos de ejemplo para modo offline
      areas = [
        { id: 1, nombre: 'Finanzas y Contabilidad', descripcion: 'Área encargada de las finanzas', responsable: 'Juan Pérez' },
        { id: 2, nombre: 'Recursos Humanos', descripcion: 'Gestión del personal', responsable: 'María García' },
        { id: 3, nombre: 'Tecnologías de la Información', descripcion: 'Soporte técnico y desarrollo', responsable: 'Carlos López' }
      ];
    }
    
    res.render('areas', { 
      title: 'Áreas', 
      layout: 'layoutAdministrador',
      areas: areas,
      user: req.user
    });
  } catch (error) {
    console.error('Error obteniendo áreas:', error);
    res.render('areas', { 
      title: 'Áreas', 
      layout: 'layoutAdministrador',
      areas: [],
      user: req.user,
      error: 'Error al cargar áreas'
    });
  }
});

app.get('/informes', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    let informes = [];
    
    if (dbConnected && informeQueries) {
      informes = await informeQueries.getAll();
    } else {
      // Datos de ejemplo para modo offline
      informes = [
        { id: 1, titulo: 'Informe de Finanzas Q1', fecha_creacion: '2024-01-15', estado: 'aprobado', usuario_nombre: 'Juan', usuario_apellido: 'Pérez', area_nombre: 'Finanzas' },
        { id: 2, titulo: 'Informe de RRHH', fecha_creacion: '2024-01-10', estado: 'pendiente', usuario_nombre: 'María', usuario_apellido: 'García', area_nombre: 'Recursos Humanos' }
      ];
    }
    
    res.render('VerInformes', { 
      title: 'Informes', 
      layout: 'layoutAdministrador',
      informes: informes,
      user: req.user
    });
  } catch (error) {
    console.error('Error obteniendo informes:', error);
    res.render('VerInformes', { 
      title: 'Todos los Informes', 
      layout: 'layoutAdministrador',
      informes: [],
      user: req.user,
      error: 'Error al cargar informes'
    });
  }
});

// =================== ENDPOINTS CRUD USUARIOS ===================

// Crear usuario
app.post('/usuarios/crear', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    console.log('📝 Datos recibidos para crear usuario:', req.body);
    const { username, email, nombre, apellido, telefono, area_id, rol_id, password } = req.body;
    
    if (!username || !email || !nombre || !apellido || !rol_id) {
      console.log('❌ Campos faltantes:', { username: !!username, email: !!email, nombre: !!nombre, apellido: !!apellido, rol_id: !!rol_id });
      return res.status(400).json({ success: false, message: 'Campos requeridos faltantes' });
    }

    if (!dbConnected || !userQueries) {
      return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await userQueries.getByUsername(username);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'El usuario ya existe' });
    }

    // Generar hash de contraseña
    const defaultPassword = password || 'admin123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Crear usuario
    const userId = await userQueries.create({
      username,
      email,
      password_hash: passwordHash,
      nombre,
      apellido,
      telefono,
      area_id: area_id || null,
      rol_id
    });

    console.log('✅ Usuario creado:', username, 'ID:', userId);
    res.json({ success: true, message: 'Usuario creado exitosamente', userId });
    
  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar usuario
app.put('/usuarios/:id', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    const userId = req.params.id;
    const { nombre, apellido, telefono, area_id, rol_id, email } = req.body;
    
    if (!nombre || !apellido || !rol_id) {
      return res.status(400).json({ success: false, message: 'Campos requeridos faltantes' });
    }

    if (!dbConnected) {
      return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }

    // No permitir editarse a sí mismo el rol
    if (parseInt(userId) === req.user.id && parseInt(rol_id) !== req.user.rol_id) {
      return res.status(400).json({ success: false, message: 'No puedes cambiar tu propio rol' });
    }

    // Actualizar usuario
    await executeQuery(
      'UPDATE usuarios SET nombre = ?, apellido = ?, telefono = ?, area_id = ?, rol_id = ?, email = ? WHERE id = ?',
      [nombre, apellido, telefono, area_id || null, rol_id, email, userId]
    );

    console.log('✅ Usuario actualizado:', userId);
    res.json({ success: true, message: 'Usuario actualizado exitosamente' });
    
  } catch (error) {
    console.error('❌ Error actualizando usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Eliminar usuario
app.delete('/usuarios/:id', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (!dbConnected) {
      return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }

    // No permitir eliminarse a sí mismo
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ success: false, message: 'No puedes eliminarte a ti mismo' });
    }

    // Marcar como inactivo en lugar de eliminar
    await executeQuery(
      'UPDATE usuarios SET activo = false WHERE id = ?',
      [userId]
    );

    console.log('✅ Usuario eliminado (marcado inactivo):', userId);
    res.json({ success: true, message: 'Usuario eliminado exitosamente' });
    
  } catch (error) {
    console.error('❌ Error eliminando usuario:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// =================== ENDPOINTS CRUD ÁREAS ===================

// Crear área
app.post('/areas/crear', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    console.log('📝 Datos recibidos para crear área:', req.body);
    const { nombre, descripcion } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ success: false, message: 'El nombre del área es requerido' });
    }

    if (!dbConnected || !areaQueries) {
      return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }

    // Crear área (usando solo nombre y descripción)
    const areaId = await areaQueries.create({
      nombre,
      descripcion: descripcion || ''
    });

    console.log('✅ Área creada:', nombre, 'ID:', areaId);
    res.json({ success: true, message: 'Área creada exitosamente', areaId });
    
  } catch (error) {
    console.error('❌ Error creando área:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar área
app.put('/areas/:id', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    console.log('📝 Datos recibidos para actualizar área:', req.body);
    const areaId = req.params.id;
    const { nombre, descripcion } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ success: false, message: 'El nombre del área es requerido' });
    }

    if (!dbConnected || !areaQueries) {
      return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }

    // Actualizar área
    await areaQueries.update(areaId, {
      nombre,
      descripcion: descripcion || ''
    });

    console.log('✅ Área actualizada:', nombre, 'ID:', areaId);
    res.json({ success: true, message: 'Área actualizada exitosamente' });
    
  } catch (error) {
    console.error('❌ Error actualizando área:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Eliminar área
app.delete('/areas/:id', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    const areaId = req.params.id;
    
    if (!dbConnected) {
      return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }

    // Verificar si hay usuarios asignados al área
    const usuarios = await executeQuery(
      'SELECT COUNT(*) as count FROM usuarios WHERE area_id = ? AND activo = true',
      [areaId]
    );

    if (usuarios[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se puede eliminar el área porque tiene usuarios asignados' 
      });
    }

    // Marcar como inactiva
    await executeQuery(
      'UPDATE areas SET activa = false WHERE id = ?',
      [areaId]
    );

    console.log('✅ Área eliminada:', areaId);
    res.json({ success: true, message: 'Área eliminada exitosamente' });
    
  } catch (error) {
    console.error('❌ Error eliminando área:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// =================== ENDPOINTS CRUD INFORMES ===================

// Crear informe (para capturistas)
app.post('/informes/crear', authenticateToken, authorizeRole('capturista'), async (req, res) => {
  try {
    const informeData = {
      usuario_id: req.user.id,
      ...req.body
    };
    
    if (!dbConnected || !informeQueries) {
      return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }

    const informeId = await informeQueries.create(informeData);

    console.log('✅ Informe creado:', informeId, 'por usuario:', req.user.username);
    res.json({ success: true, message: 'Informe creado exitosamente', informeId });
    
  } catch (error) {
    console.error('❌ Error creando informe:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Aprobar/Rechazar informe (para administradores)
app.put('/informes/:id/revisar', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    const informeId = req.params.id;
    const { estado, comentarios } = req.body; // 'aprobado' o 'rechazado'
    
    if (!dbConnected || !informeQueries) {
      return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }

    await informeQueries.updateStatus(informeId, estado, req.user.id, comentarios);

    console.log('✅ Informe revisado:', informeId, 'Estado:', estado);
    res.json({ success: true, message: `Informe ${estado} exitosamente` });
    
  } catch (error) {
    console.error('❌ Error revisando informe:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Eliminar informe
app.delete('/informes/:id', authenticateToken, async (req, res) => {
  try {
    const informeId = req.params.id;
    
    if (!dbConnected) {
      return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }

    // Verificar permisos: solo el creador o administrador puede eliminar
    const informe = await executeQuery(
      'SELECT usuario_id FROM informes WHERE id = ?',
      [informeId]
    );

    if (!informe.length) {
      return res.status(404).json({ success: false, message: 'Informe no encontrado' });
    }

    const puedeEliminar = req.user.rol === 'administrador' || 
                         parseInt(informe[0].usuario_id) === req.user.id;

    if (!puedeEliminar) {
      return res.status(403).json({ success: false, message: 'Sin permisos para eliminar este informe' });
    }

    // Eliminar informe
    await executeQuery('DELETE FROM informes WHERE id = ?', [informeId]);

    console.log('✅ Informe eliminado:', informeId);
    res.json({ success: true, message: 'Informe eliminado exitosamente' });
    
  } catch (error) {
    console.error('❌ Error eliminando informe:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// =================== ENDPOINTS DE BÚSQUEDA Y FILTROS ===================

// Buscar usuarios
app.get('/api/usuarios/buscar', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    const { nombre, area, rol } = req.query;
    
    if (!dbConnected) {
      return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }

    let query = `
      SELECT u.*, r.nombre as rol_nombre, a.nombre as area_nombre
      FROM usuarios u 
      JOIN roles r ON u.rol_id = r.id 
      LEFT JOIN areas a ON u.area_id = a.id 
      WHERE u.activo = true
    `;
    const params = [];

    if (nombre) {
      query += ` AND (u.nombre LIKE ? OR u.apellido LIKE ? OR u.username LIKE ?)`;
      const nombreParam = `%${nombre}%`;
      params.push(nombreParam, nombreParam, nombreParam);
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
    res.json({ success: true, usuarios });
    
  } catch (error) {
    console.error('❌ Error buscando usuarios:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Buscar áreas
app.get('/api/areas/buscar', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    const { nombre } = req.query;
    
    if (!dbConnected) {
      return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }

    let query = `SELECT * FROM areas WHERE activa = true`;
    const params = [];

    if (nombre) {
      query += ` AND nombre LIKE ?`;
      params.push(`%${nombre}%`);
    }

    query += ` ORDER BY nombre`;

    const areas = await executeQuery(query, params);
    res.json({ success: true, areas });
    
  } catch (error) {
    console.error('❌ Error buscando áreas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Buscar informes
app.get('/api/informes/buscar', authenticateToken, async (req, res) => {
  try {
    const { area, estado, fecha_desde, fecha_hasta, titulo } = req.query;
    
    if (!dbConnected) {
      return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }

    let query = `
      SELECT i.*, u.nombre as usuario_nombre, u.apellido as usuario_apellido,
             a.nombre as area_nombre, ap.nombre as aprobado_por_nombre
      FROM informes i
      JOIN usuarios u ON i.usuario_id = u.id
      JOIN areas a ON i.area_id = a.id
      LEFT JOIN usuarios ap ON i.aprobado_por = ap.id
      WHERE 1=1
    `;
    const params = [];

    // Si no es administrador, solo ver sus propios informes
    if (req.user.rol !== 'administrador') {
      query += ` AND i.usuario_id = ?`;
      params.push(req.user.id);
    }

    if (area) {
      query += ` AND i.area_id = ?`;
      params.push(area);
    }

    if (estado) {
      query += ` AND i.estado = ?`;
      params.push(estado);
    }

    if (titulo) {
      query += ` AND i.titulo LIKE ?`;
      params.push(`%${titulo}%`);
    }

    if (fecha_desde) {
      query += ` AND DATE(i.fecha_creacion) >= ?`;
      params.push(fecha_desde);
    }

    if (fecha_hasta) {
      query += ` AND DATE(i.fecha_creacion) <= ?`;
      params.push(fecha_hasta);
    }

    query += ` ORDER BY i.fecha_creacion DESC`;

    const informes = await executeQuery(query, params);
    res.json({ success: true, informes });
    
  } catch (error) {
    console.error('❌ Error buscando informes:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener un informe específico
app.get('/api/informes/:id', authenticateToken, async (req, res) => {
  try {
    const informeId = req.params.id;
    
    if (!dbConnected || !informeQueries) {
      return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }

    let query = `
      SELECT i.*, u.nombre as usuario_nombre, u.apellido as usuario_apellido,
             a.nombre as area_nombre, ap.nombre as aprobado_por_nombre
      FROM informes i
      JOIN usuarios u ON i.usuario_id = u.id
      JOIN areas a ON i.area_id = a.id
      LEFT JOIN usuarios ap ON i.aprobado_por = ap.id
      WHERE i.id = ?
    `;
    const params = [informeId];
    
    // Si no es administrador, solo puede ver sus propios informes
    if (req.user.rol !== 'administrador') {
      query += ` AND i.usuario_id = ?`;
      params.push(req.user.id);
    }

    const informes = await executeQuery(query, params);
    
    if (informes.length === 0) {
      return res.status(404).json({ success: false, message: 'Informe no encontrado' });
    }
    
    res.json({ success: true, informe: informes[0] });
    
  } catch (error) {
    console.error('❌ Error obteniendo informe:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Obtener roles disponibles
app.get('/api/roles', authenticateToken, authorizeRole('administrador'), async (req, res) => {
  try {
    if (!dbConnected) {
      return res.status(500).json({ success: false, message: 'Base de datos no disponible' });
    }

    const roles = await executeQuery('SELECT * FROM roles ORDER BY nombre');
    res.json({ success: true, roles });
    
  } catch (error) {
    console.error('❌ Error obteniendo roles:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

console.log('✅ Rutas admin configuradas');

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
    } else {
      areas = [
        { id: 1, nombre: 'Finanzas y Contabilidad' },
        { id: 2, nombre: 'Recursos Humanos' },
        { id: 3, nombre: 'Tecnologías de la Información' }
      ];
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
      informes = await informeQueries.getAll();
    } else {
      informes = [
        { id: 1, titulo: 'Informe Ejemplo 1', fecha_creacion: '2024-01-15', estado: 'aprobado' },
        { id: 2, titulo: 'Informe Ejemplo 2', fecha_creacion: '2024-01-10', estado: 'pendiente' }
      ];
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

// RUTA DE PRUEBA - API para obtener áreas directamente
app.get('/api/test-areas', async (req, res) => {
  console.log('🧪 === RUTA DE PRUEBA: OBTENER ÁREAS ===');
  try {
    if (dbConnected && areaQueries) {
      const areas = await areaQueries.getAll();
      console.log('✅ Áreas obtenidas:', areas.length);
      console.log('📋 Datos de áreas:', JSON.stringify(areas, null, 2));
      
      res.json({
        success: true,
        areas: areas,
        count: areas.length,
        message: 'Áreas obtenidas correctamente'
      });
    } else {
      res.json({
        success: false,
        message: 'Base de datos no disponible',
        dbConnected: dbConnected,
        areaQueries: !!areaQueries
      });
    }
  } catch (error) {
    console.error('❌ Error en ruta de prueba:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

app.get('/perfil', authenticateToken, authorizeRole('capturista'), async (req, res) => {
  console.log('🎯 === INICIANDO CARGA DE PERFIL ===');
  console.log('👤 Usuario:', req.user.username);
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  try {
    let userData = req.user;
    let areas = [];
    
    // FORZAR RECARGA DE DATOS DEL USUARIO
    if (dbConnected && userQueries) {
      try {
        const fullUserData = await userQueries.getById(req.user.id);
        if (fullUserData) {
          userData = fullUserData;
          console.log('✅ Datos completos del usuario obtenidos');
        } else {
          console.log('⚠️ No se encontraron datos completos del usuario');
        }
      } catch (userError) {
        console.error('❌ Error obteniendo datos del usuario:', userError.message);
      }
    }
    
    // FORZAR CARGA DE ÁREAS
    console.log('🔍 Estado de conexión BD:', dbConnected);
    console.log('🔍 areaQueries disponible:', !!areaQueries);
    
    if (dbConnected && areaQueries) {
      try {
        console.log('🔍 Ejecutando areaQueries.getAll()...');
        areas = await areaQueries.getAll();
        console.log('✅ Áreas obtenidas de BD:', areas.length);
        
        if (areas && areas.length > 0) {
          console.log('📋 Primera área completa:', JSON.stringify(areas[0], null, 2));
          console.log('📋 Todas las áreas:', areas.map(a => `${a.id}: ${a.nombre}`));
        } else {
          console.log('⚠️ Array de áreas vacío o null');
        }
      } catch (areaError) {
        console.error('❌ Error obteniendo áreas:', areaError.message);
        console.error('❌ Stack trace:', areaError.stack);
        areas = [];
      }
    } else {
      console.log('⚠️ BD no disponible - dbConnected:', dbConnected, 'areaQueries:', !!areaQueries);
    }
    
    // SI NO HAY ÁREAS, USAR RESPALDO Y AVISAR
    if (!areas || areas.length === 0) {
      console.log('� USANDO ÁREAS DE RESPALDO - BD no retornó datos');
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
    
    console.log('📤 Enviando al frontend:', areas.length, 'áreas');
    console.log('🔍 DEPURACIÓN ÁREAS:');
    console.log('  - Array.isArray(areas):', Array.isArray(areas));
    console.log('  - areas.length:', areas.length);
    console.log('  - JSON.stringify(areas):', JSON.stringify(areas));
    if (areas.length > 0) {
      console.log('  - Primera área:', areas[0]);
      console.log('  - Keys primera área:', Object.keys(areas[0]));
    }
    
    // DESHABILITAR CACHÉ PARA ESTA RESPUESTA
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.render('perfil', { 
      title: 'Perfil', 
      layout: 'layoutUsuario', 
      user: userData,
      areas: areas
    });
    
    console.log('✅ Perfil renderizado exitosamente');
    
  } catch (error) {
    console.error('❌ Error general en perfil:', error.message);
    console.error('❌ Stack trace:', error.stack);
    
    // RESPALDO COMPLETO EN CASO DE ERROR
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
    
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.render('perfil', { 
      title: 'Perfil', 
      layout: 'layoutUsuario', 
      user: req.user,
      areas: areasRespaldo
    });
  }
});

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

    // No enviar datos sensibles
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
  console.log('🔄 === ACTUALIZANDO PERFIL ===');
  console.log('👤 Usuario:', req.user.username);
  console.log('📝 Datos recibidos:', { ...req.body, password: req.body.password ? '[HIDDEN]' : undefined });
  
  try {
    if (!dbConnected || !userQueries) {
      console.log('❌ BD no disponible');
      return res.status(503).json({ 
        success: false, 
        message: 'Base de datos no disponible' 
      });
    }

    const { nombre, apellido, email, telefono, area_id, password } = req.body;
    const userId = req.user.id;

    // Validaciones básicas
    if (!nombre?.trim() || !apellido?.trim() || !email?.trim()) {
      console.log('❌ Campos obligatorios faltantes');
      return res.status(400).json({ 
        success: false, 
        message: 'Nombre, apellido y email son obligatorios' 
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      console.log('❌ Email inválido:', email);
      return res.status(400).json({ 
        success: false, 
        message: 'Formato de email inválido' 
      });
    }

    // Verificar que el email no esté en uso por otro usuario
    try {
      const existingUser = await userQueries.getByEmail(email.trim());
      if (existingUser && existingUser.id !== userId) {
        console.log('❌ Email ya en uso por otro usuario');
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
      area_id: area_id ? parseInt(area_id) : null
    };

    // Hashear nueva contraseña si se proporciona
    if (password?.trim()) {
      if (password.trim().length < 6) {
        console.log('❌ Contraseña muy corta');
        return res.status(400).json({ 
          success: false, 
          message: 'La contraseña debe tener al menos 6 caracteres' 
        });
      }
      
      const bcrypt = require('bcryptjs');
      updateData.password_hash = await bcrypt.hash(password.trim(), 10);
      console.log('🔐 Contraseña hasheada');
    }

    // Actualizar usuario en BD
    const result = await userQueries.update(userId, updateData);
    
    if (result) {
      console.log('✅ Usuario actualizado en BD');
      
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

      console.log('✅ Sesión actualizada');

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
      console.log('❌ Error actualizando en BD');
      res.status(500).json({ 
        success: false, 
        message: 'Error al actualizar el perfil' 
      });
    }
    
  } catch (error) {
    console.error('❌ Error general actualizando perfil:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
});

console.log('✅ Rutas capturista configuradas');

// =================== RUTAS VISITANTE ===================

app.get('/ver-informes', authenticateToken, async (req, res) => {
  try {
    let informes = [];
    
    if (dbConnected && informeQueries) {
      informes = await informeQueries.getAll();
    } else {
      informes = [
        { id: 1, titulo: 'Informe Público 1', fecha_creacion: '2024-01-15', area_nombre: 'Finanzas' },
        { id: 2, titulo: 'Informe Público 2', fecha_creacion: '2024-01-10', area_nombre: 'RRHH' }
      ];
    }
    
    res.render('VerInformes', { 
      title: 'Ver Informes', 
      layout: 'layoutUsuario',
      informes: informes,
      user: req.user
    });
  } catch (error) {
    console.error('Error obteniendo informes:', error);
    res.render('VerInformes', { 
      title: 'Ver Informes', 
      layout: 'layoutUsuario',
      informes: [],
      user: req.user,
      error: 'Error al cargar informes'
    });
  }
});

console.log('✅ Rutas visitante configuradas');

// =================== MANEJO DE ERRORES ===================

// Página de error personalizada
app.use((req, res) => {
  res.status(404).send(`
    <h1>Página no encontrada</h1>
    <p>La página que buscas no existe.</p>
    <a href="/">Volver al inicio</a>
  `);
});

// Manejo de errores globales
app.use((err, req, res, next) => {
  console.error('Error capturado:', err);
  res.status(500).send(`
    <h1>Error del servidor</h1>
    <p>Ha ocurrido un error interno.</p>
    <a href="/">Volver al inicio</a>
  `);
});

// =================== INICIAR SERVIDOR ===================

const PORT = process.env.PORT || 3000;

// Iniciar el servidor
startServer();

// Manejo de errores de proceso
process.on('uncaughtException', (err) => {
  console.error('❌ Error crítico no capturado:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
});