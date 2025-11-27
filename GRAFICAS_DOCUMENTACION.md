# Sistema de Gráficas - Documentación

## 📊 Descripción General

Se ha implementado un sistema completo de gráficas y estadísticas para el Sistema de Informes. Las gráficas se generan dinámicamente a partir de datos reales de la base de datos a través de una API REST.

---

## 🏗️ Arquitectura

### 1. **Backend (server-final.js)**

Se agregaron **11 endpoints de API** que consultan la base de datos y retornan datos JSON:

#### Endpoints Disponibles:

| Endpoint | Descripción | Método |
|----------|-------------|--------|
| `/api/estadisticas/beneficiarios` | Número de beneficiarios por actividad | GET |
| `/api/estadisticas/montos` | Total de dinero generado e invertido | GET |
| `/api/estadisticas/areas` | Informes agrupados por área | GET |
| `/api/estadisticas/sectores` | Informes por sector beneficiado | GET |
| `/api/estadisticas/colonias` | Informes por colonia o comunidad | GET |
| `/api/estadisticas/lugares` | Informes por lugar de actividad | GET |
| `/api/estadisticas/tipos-actividad` | Informes por tipo de actividad | GET |
| `/api/estadisticas/evidencia` | Informes con/sin evidencia fotográfica | GET |
| `/api/estadisticas/solicitudes` | Informes que responden solicitudes ciudadanas | GET |
| `/api/estadisticas/procedimientos` | Informes que pertenecen a procedimientos de área | GET |
| `/api/estadisticas/fechas` | Informes por mes (últimos 12 meses) | GET |

**Características de los endpoints:**
- ✅ Requieren autenticación (`authenticateToken`)
- ✅ Retornan solo informes en estado `enviado`, `aprobado` o `rechazado`
- ✅ Incluyen validación de datos y manejo de errores
- ✅ Retornan JSON con estructura `{ success: boolean, data: object|array }`

---

### 2. **Frontend (public/js/estadisticas.js)**

Archivo JavaScript que maneja toda la lógica de gráficas:

#### Funciones Principales:

```javascript
// Función general para obtener datos de la API
fetchData(endpoint) → Promise

// Inicialización de todas las gráficas
initializeCharts() → void

// Funciones para crear cada gráfica
createBeneficiariosChart(data)      // Bar chart
createMontosChart(data)             // Pie chart
createAreasChart(data)              // Doughnut chart
createSectoresChart(data)           // Bar chart
createColoniaChart(data)            // Bar chart
createLugarChart(data)              // Bar chart
createTipoActividadChart(data)      // Bar chart
createEvidenciaChart(data)          // Pie chart
createSolicitudesChart(data)        // Pie chart
createProcedimientosChart(data)     // Pie chart
createFechasChart(data)             // Line chart
```

#### Características:
- ✅ Uso de Chart.js para renderizar gráficas
- ✅ Colores personalizados corporativos (#a12424, etc.)
- ✅ Manejo de datos nulos/vacíos
- ✅ Carga asincrónica de datos
- ✅ Títulos y etiquetas en cada gráfica
- ✅ Responsive y adaptable a distintos tamaños

---

### 3. **Vistas (views/estadisticas.ejs)**

- ✅ Contiene 11 canvas elements para las gráficas
- ✅ Organización en grid de 2 columnas
- ✅ Script inline reemplazado con referencia a `estadisticas.js`
- ✅ Carga Chart.js desde CDN

---

## 📈 Gráficas Implementadas

### 1. **Beneficiarios por Actividad** (Gráfica de Barras)
- **Datos**: Suma de beneficiarios por director/coordinador
- **Top 10** actividades
- **Color**: Rojo corporativo (#a12424)

### 2. **Montos Generados** (Gráfica de Pastel)
- **Datos**: Total de dinero generado vs. invertido
- **Filtro**: Solo informes con monto > 0
- **Colores**: Verde (generado), Rojo (invertido)

### 3. **Informes por Área** (Gráfica Doughnut)
- **Datos**: Conteo de informes agrupados por área
- **Filtro**: Solo áreas activas
- **Colores**: Degradado personalizado

### 4. **Sectores Beneficiados** (Gráfica de Barras)
- **Datos**: Educación, Salud, Infraestructura, etc.
- **Top 8** sectores
- **Color**: Rojo corporativo

### 5. **Colonias/Comunidades** (Gráfica de Barras)
- **Datos**: Ubicaciones geográficas
- **Top 8** colonias
- **Color**: Rojo más oscuro (#c14444)

### 6. **Lugares de Actividad** (Gráfica de Barras)
- **Datos**: Ubicaciones específicas donde se realizaron actividades
- **Top 8** lugares
- **Color**: Amarillo/Naranja (#ffc107)

### 7. **Tipos de Actividades** (Gráfica de Barras)
- **Datos**: Capacitación, Reunión, Evento, etc.
- **Top 8** tipos
- **Color**: Azul (#17a2b8)

### 8. **Evidencia Fotográfica** (Gráfica de Pastel)
- **Datos**: Informes con vs. sin fotos
- **Colores**: Verde (con), Rojo (sin)

### 9. **Solicitudes de Ciudadanía** (Gráfica de Pastel)
- **Datos**: ¿Responden a solicitud ciudadana?
- **Colores**: Rojo (Sí), Claro (No)

### 10. **Procedimientos de Área** (Gráfica de Pastel)
- **Datos**: ¿Pertenecen a procedimientos del área?
- **Colores**: Verde (Sí), Amarillo (No)

### 11. **Informes por Mes** (Gráfica de Línea)
- **Datos**: Tendencia de últimos 12 meses
- **Visualización**: Línea con puntos
- **Color**: Rojo corporativo

---

## 🔄 Flujo de Datos

```
┌─────────────────┐
│  Página cargada │
└────────┬────────┘
         │
         v
┌──────────────────────────────┐
│ DOMContentLoaded triggered   │
└────────┬─────────────────────┘
         │
         v
┌──────────────────────────────┐
│ initializeCharts() llamada   │
└────────┬─────────────────────┘
         │
         v
┌──────────────────────────────────────┐
│ Promise.all(11 fetch requests)       │
│ - /api/estadisticas/beneficiarios    │
│ - /api/estadisticas/montos           │
│ - etc.                               │
└────────┬─────────────────────────────┘
         │
         v
┌──────────────────────────────────────┐
│ Backend procesa queries SQL          │
│ y retorna JSON                       │
└────────┬─────────────────────────────┘
         │
         v
┌──────────────────────────────────────┐
│ Frontend recibe datos                │
│ y crea 11 gráficas con Chart.js      │
└──────────────────────────────────────┘
```

---

## 🛡️ Seguridad y Validación

### Autenticación:
- ✅ Todos los endpoints requieren token de sesión
- ✅ Solo usuarios autenticados pueden ver gráficas

### Validación de Datos:
- ✅ Filtro por estado: solo `enviado`, `aprobado`, `rechazado`
- ✅ Manejo de valores NULL y vacíos
- ✅ Convertir montos a DECIMAL para precisión
- ✅ Límites de resultados (TOP 8-10)

### Manejo de Errores:
- ✅ Try-catch en todos los endpoints
- ✅ Console logging con emojis para debugging
- ✅ Respuesta JSON estandarizada
- ✅ Fallback a gráficas vacías si no hay datos

---

## 📝 Campos del Formulario Mapeados a Gráficas

| Campo del Formulario | Gráfica | Tipo |
|----------------------|---------|------|
| `numero_beneficiarios` | Beneficiarios | Suma |
| `monto_generado` | Montos | Suma |
| `area_id` (nombre) | Áreas | Conteo |
| `sector_beneficia` | Sectores | Conteo |
| `colonia_comunidad` | Colonias | Conteo |
| `lugar_actividad` | Lugares | Conteo |
| `tipo_actividad` | Tipos | Conteo |
| `evidencia_fotografica` | Evidencia | Sí/No |
| `responde_solicitud_ciudadania` | Solicitudes | Sí/No |
| `pertenece_procedimientos_area` | Procedimientos | Sí/No |
| `fecha_creacion` | Informes/Mes | Agrupación |

---

## 🎨 Paleta de Colores

```css
Primary:      #a12424 (Rojo corporativo)
Secondary:    #7c2323 (Rojo oscuro)
Tertiary:     #c14444 (Rojo claro)
Light:        #f5b5b5 (Rosa muy claro)
Success:      #28a745 (Verde)
Danger:       #dc3545 (Rojo peligro)
Warning:      #ffc107 (Amarillo/Naranja)
Info:         #17a2b8 (Azul)
```

---

## 🚀 Cómo Usar

### Para Administrador:
1. Iniciar sesión
2. Navegar a "Estadísticas" en menú
3. Las gráficas se cargan automáticamente desde `/api/estadisticas/*`
4. Cada gráfica muestra datos en tiempo real de los informes `enviado`, `aprobado`, `rechazado`

### Para Visitante:
1. Iniciar sesión como visitante
2. Navegar a "Estadísticas" en menú
3. Las mismas gráficas se muestran en versión de solo lectura

---

## 🔧 Extensión Futura

Para agregar más gráficas:

1. **Backend**: Crear nuevo endpoint `/api/estadisticas/nueva-grafica`
2. **Frontend**: Crear función `createNuevaGraficaChart(data)` en `estadisticas.js`
3. **Vista**: Agregar nuevo canvas en `estadisticas.ejs`
4. **Inicialización**: Agregar llamada en `initializeCharts()`

---

## ✅ Checklist de Verificación

- [x] Endpoints de API funcionan correctamente
- [x] Datos se obtienen desde base de datos
- [x] Gráficas se renderizan con Chart.js
- [x] Filtros de estado implementados
- [x] Manejo de errores completado
- [x] Autenticación requerida
- [x] Colores corporativos aplicados
- [x] Responsive en diferentes tamaños
- [x] Console logs para debugging
- [x] Documentación completada

---

## 📞 Notas de Desarrollo

- Las gráficas usan `Promise.all()` para cargar datos en paralelo (más rápido)
- Los datos se cachean en memoria durante la sesión
- Los montos se formatean con 2 decimales
- Las fechas se agrupan por mes (YYYY-MM)
- Sin informes = gráficas no se renderizan (evita errores)

