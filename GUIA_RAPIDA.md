# 🎯 SISTEMA COMPLETO DE INFORMES - GUÍA RÁPIDA

## 📋 Estado Actual del Sistema

### ✅ Funcionalidades Implementadas

#### 1. **Creación de Informes (Capturista)**
- ✅ Crear informe nuevo → Estado: `borrador`
- ✅ Guardar como borrador temporalmente
- ✅ Editar informe en borrador
- ✅ Eliminar informe en borrador
- ✅ Enviar informe → Estado: `enviado`

#### 2. **Historial de Informes (Capturista)**
- ✅ Ver todos los propios informes
- ✅ Estados visibles: borrador, enviado, aprobado, rechazado
- ✅ Botón para ver detalles
- ✅ Botón para descargar (si está aprobado)
- ✅ Botón para eliminar

#### 3. **Revisión de Informes (Admin)**
- ✅ Ver tabla con informes enviados
- ✅ Abrir modal para ver detalles
- ✅ **Botones Aceptar/Rechazar** (solo admin)
- ✅ Agregar comentarios de evaluación
- ✅ Cambiar estado a: aprobado o rechazado

#### 4. **Visualización de Informes (Visitante)**
- ✅ Ver tabla con informes enviados
- ✅ Abrir modal para ver detalles (modo lectura)
- ✅ **NO ve botones de Aceptar/Rechazar** (solo lectura)
- ✅ Ver comentarios si ya están evaluados

#### 5. **Gráficas y Estadísticas**
- ✅ 11 gráficas diferentes
- ✅ Datos en tiempo real de la BD
- ✅ Beneficiarios, montos, áreas, lugares, etc.
- ✅ Filtrados por estado `enviado`, `aprobado`, `rechazado`

---

## 🔐 Control de Roles y Permisos

### **Capturista (usuario_id: cualquier usuario)**
```
PERMISOS:
  ✅ Crear informe → Borrador
  ✅ Editar informe en borrador
  ✅ Enviar informe
  ✅ Ver historial completo (todos sus informes)
  ✅ Eliminar informe en borrador
  ❌ Ver informes de otros
  ❌ Evaluar informes
  ❌ Cambiar estado de informes
  
RUTAS PERMITIDAS:
  GET  /informes/crear         → Formulario
  POST /informes/crear         → Crear
  PUT  /informes/:id/enviar    → Enviar
  GET  /historial              → Tabla historial
  GET  /api/informes/buscar    → API búsqueda
  DELETE /api/informes/:id     → Eliminar

MODAL:
  - VE: Todos los campos
  - VE: Evaluación solo si ya está aprobado/rechazado
  - NO VE: Botones Aceptar/Rechazar (solo admin)
```

### **Administrador (usuario_id: asignado como admin)**
```
PERMISOS:
  ✅ Ver todos los informes enviados
  ✅ Abrir modal de informe
  ✅ Evaluar informe (Aceptar/Rechazar)
  ✅ Agregar comentarios de evaluación
  ✅ Ver gráficas y estadísticas
  ✅ Gestionar usuarios
  ✅ Gestionar áreas
  ❌ Crear informes
  ❌ Editar informes
  ❌ Ver informes en borrador

RUTAS PERMITIDAS:
  GET  /informes               → Tabla informes
  GET  /api/informes/:id       → Detalles
  PUT  /api/informes/:id/evaluar → Evaluar
  GET  /estadisticas           → Gráficas
  GET  /usuarios               → Gestión
  GET  /areas                  → Gestión
  GET  /api/estadisticas/*     → APIs

MODAL:
  - VE: Todos los campos
  - VE: Sección de evaluación si estado es aprobado/rechazado
  - VE: Botones Aceptar/Rechazar si estado es enviado
```

### **Visitante (usuario_id: asignado como visitante)**
```
PERMISOS:
  ✅ Ver informes enviados (de todos)
  ✅ Abrir modal de informe
  ✅ Ver comentarios de evaluación
  ✅ Ver gráficas y estadísticas
  ❌ Editar informes
  ❌ Evaluar informes
  ❌ Crear informes
  ❌ Gestionar usuarios
  ❌ Gestionar áreas

RUTAS PERMITIDAS:
  GET  /ver-informes           → Tabla informes
  GET  /api/informes/:id       → Detalles
  GET  /estadisticas-visitante → Gráficas
  GET  /api/estadisticas/*     → APIs

MODAL:
  - VE: Todos los campos (modo lectura)
  - VE: Evaluación si ya está aprobado/rechazado
  - NO VE: Botones Aceptar/Rechazar (admin only)
```

---

## 🔄 Flujo de Estados del Informe

```
┌─────────────┐
│  BORRADOR   │  ← Capturista crea aquí
└─────┬───────┘
      │
      │ Capturista presiona "Enviar"
      │
      v
┌─────────────────┐
│    ENVIADO      │  ← Admin/Visitante ven aquí
└─────┬──────┬────┘
      │      │
      │      └──→ Visitante solo ve aquí
      │
   Admin presiona:
   "Aceptar" o "Rechazar"
      │
      v
┌──────────────────┐
│  APROBADO o      │  ← Capturista ve aquí + comentarios
│  RECHAZADO       │
└──────────────────┘
```

---

## 📊 Campos del Formulario → Gráficas

Cuando un capturista llena el formulario, cada campo se mapea a gráficas:

| Campo | Gráfica | Se ve en |
|-------|---------|----------|
| `fecha_actividad` | Informes por Mes | Admin + Visitante |
| `area_id` | Por Área | Admin + Visitante |
| `nombre_director` | Beneficiarios | Admin + Visitante |
| `lugar_actividad` | Lugares de Actividad | Admin + Visitante |
| `colonia_comunidad` | Colonias | Admin + Visitante |
| `tipo_actividad` | Tipos de Actividades | Admin + Visitante |
| `numero_beneficiarios` | Beneficiarios (suma) | Admin + Visitante |
| `monto_generado` | Montos | Admin + Visitante |
| `sector_beneficia` | Sectores Beneficiados | Admin + Visitante |
| `pertenece_procedimientos_area` | Procedimientos de Área | Admin + Visitante |
| `responde_solicitud_ciudadania` | Solicitudes de Ciudadanía | Admin + Visitante |
| `evidencia_fotografica` | Evidencia Fotográfica | Admin + Visitante |

---

## 🛡️ Características de Seguridad Implementadas

### 1. **Autenticación**
- ✅ Todas las rutas requieren token de sesión
- ✅ Token guardado en `req.user` después de login
- ✅ Middleware `authenticateToken` en todas las rutas protegidas

### 2. **Autorización por Rol**
- ✅ Middleware `authorizeRole('capturista'|'administrador'|'visitante')`
- ✅ Cada ruta verifica rol del usuario
- ✅ 403 Forbidden si no tiene permiso

### 3. **Validación de Datos**
- ✅ SQL Injection prevenido con prepared statements
- ✅ Validación de IDs antes de consultas
- ✅ Filtros de estado para evitar ver informes inválidos

### 4. **Control de Acceso en Frontend**
- ✅ Botones dinámicos basados en rol
- ✅ Modal con secciones visibles/ocultas por rol
- ✅ `window.currentUserRole` contiene rol del usuario
- ✅ Verificación en `cargarInformeEnModal()` para botones

### 5. **Restricción de Modalidades**
- ✅ Capturista: Solo ve/edita sus propios informes en historial
- ✅ Admin: Puede ver todos pero solo evalúa (no edita)
- ✅ Visitante: Solo lectura, sin botones funcionales

---

## 🚀 Cómo Usar el Sistema Completo

### Escenario 1: Capturista Crea Informe

1. **Iniciar sesión como capturista**
   - Email: `capturista@ejemplo.com` (ajusta según tu BD)
   - Contraseña: Tu contraseña

2. **Ir a "Crear Informe"**
   - Llenar formulario con todos los datos
   - Campos requeridos: Fecha, Área, Director, Lugar, Tipo Actividad, Descripción

3. **Guardar como Borrador**
   - Click "Guardar Borrador"
   - Informe guardado con estado `borrador`
   - Visible solo en su historial

4. **Revisar en Historial**
   - Click "Historial" en menú
   - Ver informe con botón "Ver"
   - Botones: Descargar (deshabilitado), Ver, Eliminar

5. **Enviar Informe**
   - Click "Enviar Informe"
   - Estado cambia a `enviado`
   - Ahora visible para admin/visitante

### Escenario 2: Admin Evalúa Informe

1. **Iniciar sesión como admin**
   - Email: `admin@ejemplo.com`
   - Contraseña: Tu contraseña

2. **Ir a "Ver Informes"**
   - Ve tabla con informes en estado `enviado`
   - Columnas: #, Nombre, Área, Fecha, Acciones

3. **Abrir Modal**
   - Click "Abrir" en informe
   - Modal muestra todos los campos
   - VE: Sección "Evaluación del Admin"
   - VE: Botones "Aceptar" y "Rechazar" (solo admin)

4. **Evaluar Informe**
   - Escribir comentarios en textarea
   - Click "Aceptar" o "Rechazar"
   - Estado cambia a `aprobado` o `rechazado`
   - Modal se cierra
   - Tabla se actualiza

### Escenario 3: Visitante Ve Informes

1. **Iniciar sesión como visitante**
   - Email: `visitante@ejemplo.com`
   - Contraseña: Tu contraseña

2. **Ir a "Ver Informes"**
   - Ve tabla con informes en estado `enviado`
   - Columnas: #, Nombre, Área, Fecha, Acciones

3. **Abrir Modal (Lectura)**
   - Click "Abrir" en informe
   - Modal muestra campos (solo lectura)
   - NO VE: Botones de evaluación
   - SI VE: Comentarios si ya está evaluado

### Escenario 4: Ver Estadísticas

1. **Iniciar sesión (admin o visitante)**

2. **Ir a "Estadísticas"**
   - 11 gráficas se cargan automáticamente
   - Datos en tiempo real de BD
   - Beneficiarios, Montos, Áreas, Lugares, etc.

3. **Interpretar Gráficas**
   - Gráficas de barras: comparación entre categorías
   - Gráficas de pastel: proporción total
   - Gráfica de línea: tendencia en tiempo

---

## 🔧 Estructura de Código

### Backend (`server-final.js`)

```javascript
// Rutas por rol
app.get('/informes', authToken, authorize('administrador')) → muestra tabla
app.get('/historial', authToken, authorize('capturista')) → historial
app.get('/ver-informes', authToken, authorize('visitante')) → lectura
app.put('/api/informes/:id/evaluar', authToken, authorize('admin')) → evaluar

// APIs
app.get('/api/informes/:id') → obtener detalles
app.put('/api/informes/:id/enviar') → cambiar a enviado
app.get('/api/estadisticas/*') → 11 endpoints
```

### Frontend

#### `public/js/sistema.js`
- `cargarInformeEnModal(btn)` → Llena modal con datos
- Revisa `window.currentUserRole` antes de mostrar botones
- Botones solo visibles si rol es `administrador`

#### `public/js/estadisticas.js`
- `initializeCharts()` → Carga todas las gráficas
- `fetchData(endpoint)` → Obtiene datos de API
- 11 funciones `create*Chart()` → Renderiza con Chart.js

#### `views/ModalInforme.ejs`
- Script que pasa `window.currentUserRole`
- Secciones visibles/ocultas según rol

---

## 📝 Ejemplos de Queries SQL

### 1. Obtener informes enviados para admin
```sql
SELECT i.*, a.nombre as area_nombre, u.nombre, u.apellido
FROM informes i
LEFT JOIN areas a ON i.area_id = a.id
LEFT JOIN usuarios u ON i.usuario_id = u.id
WHERE i.estado = 'enviado'
ORDER BY i.fecha_creacion DESC;
```

### 2. Contar beneficiarios por director
```sql
SELECT nombre_director, SUM(numero_beneficiarios) as total
FROM informes
WHERE estado IN ('enviado', 'aprobado', 'rechazado')
GROUP BY nombre_director
ORDER BY total DESC LIMIT 10;
```

### 3. Total dinero generado
```sql
SELECT SUM(CAST(monto_generado AS DECIMAL(10,2))) as total
FROM informes
WHERE estado IN ('enviado', 'aprobado', 'rechazado')
  AND monto_generado > 0;
```

---

## ✅ Verificación del Sistema

Antes de usar en producción, verifica:

- [ ] Servidor corriendo sin errores
- [ ] Puedes iniciar sesión con 3 roles diferentes
- [ ] Capturista puede crear → guardar → enviar informe
- [ ] Admin ve informe enviado y puede evaluarlo
- [ ] Visitante ve informe pero NO ve botones de evaluación
- [ ] Historial muestra informes del capturista
- [ ] Gráficas se cargan en página de estadísticas
- [ ] Cambio de estado aparece en tiempo real
- [ ] Console sin errores (F12 → Console)
- [ ] Network requests exitosos (F12 → Network)

---

## 🐛 Debugging

### Ver lo que está pasando
1. **Abrir DevTools**: F12
2. **Console**: Ver logs con emojis
3. **Network**: Ver requests a `/api/informes/*` y `/api/estadisticas/*`
4. **Application**: Ver cookies y sesión

### Logs importantes en console

```javascript
// Cuando se abre modal
📋 Cargando informe ID: 5
📊 Respuesta de API: {...}
✅ Datos del informe: {...}
👤 Usuario rol: administrador - Mostrando botones de evaluación

// Cuando se evalúa
📤 Evaluando informe 5 como: aprobado
✅ Informe aprobado exitosamente
```

---

## 🎓 Resumen de Cambios Recientes

### Restricciones por Rol (Nuevas)
- ✅ Botones de Aceptar/Rechazar solo visibles para admin
- ✅ Validación de rol en `cargarInformeEnModal()`
- ✅ `window.currentUserRole` disponible en todas las vistas

### Gráficas (Nuevas)
- ✅ 11 endpoints de API para estadísticas
- ✅ Archivo `estadisticas.js` con 11 gráficas
- ✅ Datos en tiempo real desde BD
- ✅ Filtrados por estado (solo enviado, aprobado, rechazado)

### Flujo de Informes
- ✅ Capturista: Borrador → Enviado
- ✅ Admin: Revisa Enviado → Aprobado/Rechazado
- ✅ Visitante: Solo lectura de Enviado/Evaluados
- ✅ Modal unificado para todas las vistas

---

## 📞 Ayuda Rápida

**P: ¿Cómo creo un nuevo tipo de usuario?**
R: En BD, agregar registro en tabla `usuarios` con rol nuevo

**P: ¿Cómo veo qué usuario está viendo qué?**
R: Revisar `req.user` en console del servidor y logs

**P: ¿Por qué no veo gráficas?**
R: 1) Verifica que haya informes en estado `enviado`
   2) Abre DevTools para ver si API responde
   3) Revisa Network tab para ver requests

**P: ¿Cómo agrego más gráficas?**
R: 1) Crear endpoint `/api/estadisticas/nueva` en servidor
   2) Crear función en `estadisticas.js`
   3) Agregar canvas en `estadisticas.ejs`
   4) Llamar desde `initializeCharts()`

---

**Sistema completo y funcional ✅**

Última actualización: [Fecha actual]
Versión: 1.0

