# SistemaInformes

Pequeñas notas para desarrollo

Requisitos:
- Node.js 18+ (o compatible)
- MySQL en ejecución si vas a usar la base de datos

Comandos principales:

- Instalar dependencias:

```powershell
npm install
```

- Iniciar en modo producción:

```powershell
npm start
```

- Iniciar en modo desarrollo (con nodemon):

```powershell
npm run dev
```

Logout / confirmación

- El botón "Cerrar sesión" ahora abre un modal de confirmación (no usa `confirm()` nativo).
- Al confirmar, la app cierra modales/offcanvas abiertos, limpia backdrops y envía un POST a `/logout`.
- Después de logout el usuario es redirigido a `/inicioSesion`.

Notas de seguridad

- Actualmente la petición POST a `/logout` no incluye CSRF token. Si el proyecto necesita protección CSRF, recomiendo integrar `csurf` y pasar el token a las vistas.

Si quieres que agregue el CSRF o modifique el texto/estilo del modal, lo hago enseguida.

## Inicializar base de datos

Si aún no has creado la base de datos y tablas, ejecuta:

```powershell
npm run setup-db
```

Esto crea la base de datos `sistema_informes`, las tablas necesarias y datos de ejemplo.

Credenciales de ejemplo generadas por el script:
- Administrador: usuario `admin` / contraseña `admin123`
- Capturista: usuario `marissa.gomez` / contraseña `admin123`