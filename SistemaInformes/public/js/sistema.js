// ========================// ============================================
// FUNCIONES PARA USUARIOS
// Buscar usuarios (implementación principal más abajo). Si necesitas buscar desde aquí,
// llama a la función `buscarUsuarios()` que está definida más abajo en el archivo.

// Función auxiliar para hacer requests
// Maneja FormData y JSON; normaliza respuestas no-JSON
async function makeRequest(url, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {},
        credentials: 'same-origin'
    };

    if (data) {
        // Si data es FormData - dejar que el browser ponga Content-Type (multipart boundary)
        if (typeof FormData !== 'undefined' && data instanceof FormData) {
            options.body = data;
        } else {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(data);
        }
    }

    try {
        console.log(`🔄 ${method} ${url}`, data);
        const response = await fetch(url, options);

        let parsed;
        try {
            parsed = await response.json();
        } catch (err) {
            // Respuesta no JSON (HTML/text) — devolver información mínima
            console.warn('Respuesta no JSON recibida de', url, 'status=', response.status);
            parsed = { success: response.ok, message: response.statusText, data: null };
        }

        console.log(`📥 Respuesta ${response.status}:`, parsed);

        return {
            success: parsed.success !== undefined ? parsed.success : response.ok,
            message: parsed.message,
            data: parsed.data !== undefined ? parsed.data : parsed,
            status: response.status
        };
    } catch (error) {
        console.error('❌ Error en petición:', error);
        return { success: false, message: error.message };
    }
}

// Fallback simple para mostrarToast si no está definido por las plantillas
if (typeof window !== 'undefined' && typeof mostrarToast !== 'function') {
    window.mostrarToast = function(mensaje, tipo = 'info') {
        try { console.log(`[toast:${tipo}] ${mensaje}`); } catch (e) {}
    };
}

// ============================================
// GESTIÓN DE USUARIOS
// ============================================

// Crear nuevo usuario
async function crearUsuario(userData) {
    const response = await makeRequest('/usuarios/crear', 'POST', userData);
    
    if (response.success) {
        mostrarToast('Usuario creado exitosamente', 'success');
        // Recargar la página para mostrar el nuevo usuario
        setTimeout(() => location.reload(), 1500);
    } else {
        mostrarToast(response.data.message || 'Error al crear usuario', 'danger');
    }
}

let usuarioEditando = null; // Variable global para controlar si estamos editando

// Función para abrir modal de crear usuario
function abrirModalCrearUsuario() {
    usuarioEditando = null;
    document.getElementById('modal-titulo').textContent = 'Crear Usuario';
    limpiarFormularioUsuario();
    
    // Mostrar campo de confirmar contraseña
    document.getElementById('confirm-password-row').style.display = 'block';
    document.getElementById('password').required = true;
    document.getElementById('confirm-password').required = true;
    document.getElementById('password-help').style.display = 'none';
    
    // Habilitar username
    document.getElementById('username').disabled = false;
}

// Función para editar usuario
function editarUsuario(id, username, nombre, apellido, email, telefono, areaId, rolId) {
    usuarioEditando = id;
    document.getElementById('modal-titulo').textContent = 'Editar Usuario';
    
    // Cargar datos en el formulario
    document.getElementById('usuario-id').value = id;
    document.getElementById('username').value = username;
    document.getElementById('nombre').value = nombre;
    document.getElementById('apellido').value = apellido;
    document.getElementById('email').value = email;
    document.getElementById('telefono').value = telefono || '';
    document.getElementById('area_id').value = areaId || '';
    document.getElementById('rol_id').value = rolId;
    
    // Ocultar campo de confirmar contraseña al editar
    document.getElementById('confirm-password-row').style.display = 'none';
    document.getElementById('password').required = false;
    document.getElementById('confirm-password').required = false;
    document.getElementById('password').value = '';
    document.getElementById('confirm-password').value = '';
    // cargar numero de nómina si existe en dataset
    const btn = document.querySelector(`button[data-user-id="${id}"]`);
    const nomEl = document.getElementById('numero_nomina');
    if (nomEl) {
        if (btn && btn.dataset && btn.dataset.numeroNomina !== undefined) {
            nomEl.value = btn.dataset.numeroNomina || '';
        } else {
            const row = document.querySelector(`tr[data-user-id="${id}"]`);
            nomEl.value = (row && row.dataset && row.dataset.numeroNomina) ? row.dataset.numeroNomina : '';
        }
    }
    document.getElementById('password-help').style.display = 'block';
    
    // Deshabilitar username al editar
    document.getElementById('username').disabled = true;
}

// Función para limpiar formulario
function limpiarFormularioUsuario() {
    document.getElementById('form-usuario').reset();
    document.getElementById('usuario-id').value = '';
    
    // Limpiar estados de validación
    const form = document.getElementById('form-usuario');
    form.classList.remove('was-validated');
    const inputs = form.querySelectorAll('.form-control, .form-select');
    inputs.forEach(input => {
        input.classList.remove('is-valid', 'is-invalid');
        input.disabled = false; // Habilitar todos los campos por defecto
    });
    
    // Configurar campos de contraseña
    document.getElementById('password').value = '';
    document.getElementById('confirm-password').value = '';
}

// Eliminar usuario
async function eliminarUsuario(userId, nombreUsuario) {
    const confirmUser = await confirmModal(`¿Estás seguro de eliminar al usuario "${nombreUsuario}"?`);
    if (!confirmUser) return;
    
    const response = await makeRequest(`/usuarios/${userId}`, 'DELETE');
    
    if (response.success) {
        mostrarUsuarioEliminado();
        // Remover el elemento de la tabla
        const userRow = document.querySelector(`tr[data-user-id="${userId}"]`);
        if (userRow) {
            userRow.remove();
        }
    } else {
        mostrarToast(response.data.message || 'Error al eliminar usuario', 'danger');
    }
}

// Buscar usuarios
async function buscarUsuarios() {
    const nombre = document.querySelector('input[placeholder*="nombre"]')?.value || '';
    const area = document.querySelector('#area-filter')?.value || '';
    const rol = document.querySelector('#rol-filter')?.value || '';
    
    const params = new URLSearchParams();
    if (nombre) params.append('nombre', nombre);
    if (area) params.append('area', area);
    if (rol) params.append('rol', rol);
    
    const response = await makeRequest(`/api/usuarios/buscar?${params.toString()}`);
    
    if (response.success) {
        actualizarTablaUsuarios(response.data.usuarios);
        mostrarToast(`Se encontraron ${response.data.usuarios.length} usuarios`, 'info');
    } else {
        mostrarToast('Error en la búsqueda', 'danger');
    }
}

// ============================================
// GESTIÓN DE ÁREAS
// ============================================

let areaEditando = null; // Variable para controlar si estamos editando

// Función para abrir modal de crear área
function abrirModalCrearArea() {
    areaEditando = null;
    document.getElementById('modalAreasLabel').textContent = 'Crear Área';
    limpiarFormularioArea();
}

// Función para guardar área (crear o actualizar)
async function guardarArea(areaData) {
    try {
        let response;
        
        if (areaEditando) {
            // Actualizar área existente  
            response = await makeRequest(`/areas/${areaEditando}`, 'PUT', areaData);
        } else {
            // Crear nueva área
            response = await makeRequest('/areas/crear', 'POST', areaData);
        }
        
        if (response.success) {
            const mensaje = areaEditando ? 'Área actualizada exitosamente' : 'Área creada exitosamente';
            mostrarToast(mensaje, 'success');
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalAreas'));
            if (modal) modal.hide();
            
            // Limpiar formulario y recargar
            limpiarFormularioArea();
            setTimeout(() => location.reload(), 1500);
        } else {
            mostrarToast(response.message || 'Error interno del servidor', 'error');
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error interno del servidor', 'error');
    }
}

// Eliminar área
async function eliminarArea(areaId, nombreArea) {
    const confirmArea = await confirmModal(`¿Estás seguro de eliminar el área "${nombreArea}"?`);
    if (!confirmArea) return;
    
    const response = await makeRequest(`/areas/${areaId}`, 'DELETE');
    
    if (response.success) {
        mostrarAreaEliminada();
        const areaRow = document.querySelector(`tr[data-area-id="${areaId}"]`);
        if (areaRow) {
            areaRow.remove();
        }
    } else {
        mostrarToast(response.data.message || 'Error al eliminar área', 'danger');
    }
}

// Editar área
function editarArea(areaId, nombre, descripcion) {
    areaEditando = areaId;
    document.getElementById('modalAreasLabel').textContent = 'Editar Área';
    
    // Cargar datos en el formulario
    document.getElementById('area-id').value = areaId;
    document.getElementById('area-nombre').value = nombre;
    document.getElementById('area-descripcion').value = descripcion || '';
}

// Función para limpiar formulario de área
function limpiarFormularioArea() {
    document.getElementById('form-area').reset();
    document.getElementById('area-id').value = '';
    
    // Remover clases de validación
    const form = document.getElementById('form-area');
    form.classList.remove('was-validated');
    const inputs = form.querySelectorAll('.form-control');
    inputs.forEach(input => {
        input.classList.remove('is-valid', 'is-invalid');
    });
}

// Buscar áreas
async function buscarAreas() {
    const nombre = document.querySelector('input[placeholder*="área"]')?.value || '';
    
    const params = new URLSearchParams();
    if (nombre) params.append('nombre', nombre);
    
    const response = await makeRequest(`/api/areas/buscar?${params.toString()}`);
    
    if (response.success) {
        actualizarTablaAreas(response.data.areas);
        mostrarToast(`Se encontraron ${response.data.areas.length} áreas`, 'info');
    } else {
        mostrarToast('Error en la búsqueda', 'danger');
    }
}

// ============================================
// GESTIÓN DE INFORMES
// ============================================

// Crear nuevo informe (acepta FormData o un objeto JSON)
async function crearInforme(informeData) {
    try {
        // Si es FormData (contiene archivos), enviar con fetch dejando que el navegador asigne Content-Type
        if (typeof FormData !== 'undefined' && informeData instanceof FormData) {
            const res = await fetch('/informes/crear', { method: 'POST', body: informeData, credentials: 'same-origin' });
            const json = await res.json();
            if (json.success) {
                mostrarToast('Informe creado exitosamente', 'success');
                setTimeout(() => window.location.href = '/historial', 2000);
            } else {
                mostrarToast(json.message || 'Error al crear informe', 'danger');
            }
            return;
        }

        // Caso normal: enviar JSON usando makeRequest
        const response = await makeRequest('/informes/crear', 'POST', informeData);
        if (response.success) {
            mostrarToast('Informe creado exitosamente', 'success');
            setTimeout(() => window.location.href = '/historial', 2000);
        } else {
            mostrarToast(response.data?.message || response.message || 'Error al crear informe', 'danger');
        }
    } catch (error) {
        console.error('Error creando informe:', error);
        mostrarToast('Error de red al crear informe', 'danger');
    }
}

// Revisar informe (aprobar/rechazar)
async function revisarInforme(informeId, estado, comentarios = '') {
    const response = await makeRequest(`/informes/${informeId}/revisar`, 'PUT', {
        estado: estado,
        comentarios: comentarios
    });
    
    if (response.success) {
        mostrarInformeRevisado();
        // Actualizar el estado en la interfaz
        const statusBadge = document.querySelector(`#informe-${informeId} .status-badge`);
        if (statusBadge) {
            statusBadge.textContent = estado.charAt(0).toUpperCase() + estado.slice(1);
            statusBadge.className = `badge ${estado === 'aprobado' ? 'bg-success' : 'bg-danger'}`;
        }
    } else {
        mostrarToast(response.data.message || 'Error al revisar informe', 'danger');
    }
}

// Eliminar informe
async function eliminarInforme(informeId, tituloInforme) {
    const confirmInforme = await confirmModal(`¿Estás seguro de eliminar el informe "${tituloInforme}"?`);
    if (!confirmInforme) return;
    
    const response = await makeRequest(`/informes/${informeId}`, 'DELETE');
    
    if (response.success) {
        mostrarInformeEliminado();
        const informeRow = document.querySelector(`tr[data-informe-id="${informeId}"]`);
        if (informeRow) {
            informeRow.remove();
        }
    } else {
        mostrarToast(response.data.message || 'Error al eliminar informe', 'danger');
    }
}

// Buscar informes
async function buscarInformes() {
    const area = document.querySelector('#area-filter')?.value || '';
    const estado = document.querySelector('#estado-filter')?.value || '';
    const fechaDesde = document.querySelector('#fecha-desde')?.value || '';
    const fechaHasta = document.querySelector('#fecha-hasta')?.value || '';
    const titulo = document.querySelector('input[placeholder*="informe"]')?.value || '';
    
    const params = new URLSearchParams();
    if (area) params.append('area', area);
    if (estado) params.append('estado', estado);
    if (fechaDesde) params.append('fecha_desde', fechaDesde);
    if (fechaHasta) params.append('fecha_hasta', fechaHasta);
    if (titulo) params.append('titulo', titulo);
    
    const response = await makeRequest(`/api/informes/buscar?${params.toString()}`);
    
    if (response.success) {
        actualizarTablaInformes(response.data.informes);
        mostrarToast(`Se encontraron ${response.data.informes.length} informes`, 'info');
    } else {
        mostrarToast('Error en la búsqueda', 'danger');
    }
}

// ============================================
// FUNCIONES DE ACTUALIZACIÓN DE INTERFAZ
// ============================================

// Actualizar tabla de usuarios
function actualizarTablaUsuarios(usuarios) {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = usuarios.map(usuario => `
        <tr data-user-id="${usuario.id}" data-numero-nomina="${usuario.numero_nomina || ''}">
            <td>${usuario.id}</td>
            <td>${usuario.nombre || 'Nombre'}</td>
            <td>${usuario.apellido || 'Apellidos'}</td>
            <td>${usuario.area_nombre || 'Sin área'}</td>
            <td>
                <div class="d-flex justify-content-center gap-2" style="white-space: nowrap;">
                    <button class="btn btn-sm btn-editar" data-bs-toggle="modal" data-bs-target="#modalUsuarios" data-user-id="${usuario.id}" data-username="${usuario.username}" data-nombre="${usuario.nombre}" data-apellido="${usuario.apellido}" data-email="${usuario.email}" data-telefono="${usuario.telefono || ''}" data-area-id="${usuario.area_id || ''}" data-numero-nomina="${usuario.numero_nomina || ''}" data-rol-id="${usuario.rol_id}" style="min-width: 70px;">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarUsuario(${usuario.id}, '${usuario.nombre} ${usuario.apellido}')">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Actualizar tabla de áreas
function actualizarTablaAreas(areas) {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = areas.map(area => `
        <tr data-area-id="${area.id}">
            <td>${area.id}</td>
            <td>${area.nombre}</td>
            <td>${area.descripcion}</td>
            <td>${area.responsable}</td>
            <td>${area.telefono || 'N/A'}</td>
            <td>${area.email || 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="eliminarArea(${area.id}, '${area.nombre}')">
                    <i class="bi bi-trash"></i> Eliminar
                </button>
            </td>
        </tr>
    `).join('');
}

// Actualizar tabla de informes
function actualizarTablaInformes(informes) {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = informes.map(informe => `
        <tr data-informe-id="${informe.id}" id="informe-${informe.id}">
            <td>${informe.id}</td>
            <td>${informe.titulo}</td>
            <td>${informe.area_nombre}</td>
            <td>${informe.usuario_nombre} ${informe.usuario_apellido}</td>
            <td>${new Date(informe.fecha_creacion).toLocaleDateString()}</td>
            <td>
                <span class="badge status-badge ${informe.estado === 'aprobado' ? 'bg-success' : informe.estado === 'rechazado' ? 'bg-danger' : 'bg-warning'}">
                    ${informe.estado.charAt(0).toUpperCase() + informe.estado.slice(1)}
                </span>
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-primary" onclick="verInforme(${informe.id})">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${informe.estado === 'borrador' ? `
                        <button class="btn btn-sm btn-success" onclick="revisarInforme(${informe.id}, 'aprobado')">
                            <i class="bi bi-check"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="revisarInforme(${informe.id}, 'rechazado')">
                            <i class="bi bi-x"></i>
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-danger" onclick="eliminarInforme(${informe.id}, '${informe.titulo}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ============================================
// FUNCIONES DE MODALES Y FORMULARIOS
// ============================================

// ============================================
// FUNCIONES AUXILIARES
// ============================================
async function guardarUsuario(userData) {
    try {
        let response;
        
        if (usuarioEditando) {
            // Actualizar usuario existente  
            response = await makeRequest(`/usuarios/${usuarioEditando}`, 'PUT', userData);
        } else {
            // Crear nuevo usuario
            response = await makeRequest('/usuarios/crear', 'POST', userData);
        }
        
        if (response.success) {
            const mensaje = usuarioEditando ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente';
            mostrarToast(mensaje, 'success');
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalUsuarios'));
            if (modal) modal.hide();
            
            // Limpiar formulario y recargar
            limpiarFormularioUsuario();
            setTimeout(() => location.reload(), 1500);
        } else {
            mostrarToast(response.message || 'Error interno del servidor', 'error');
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarToast('Error interno del servidor', 'error');
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

// Ver detalles de un informe
async function verInforme(informeId) {
    try {
            const response = await makeRequest(`/api/informes/${informeId}`, 'GET');
            if (response.success) {
                // La estructura del servidor devuelve { success: true, informe: { ... } }
                const informeData = response.data && response.data.informe ? response.data.informe : response.informe || response.data || null;
                if (informeData) {
                    cargarDatosInforme(informeData);
                    mostrarInformeVisto();
                } else {
                    mostrarToast('Respuesta inválida del servidor', 'error');
                }
            } else {
                mostrarToast('Error al cargar el informe', 'error');
            }
    } catch (error) {
        console.error('Error al obtener informe:', error);
        mostrarToast('Error al cargar el informe', 'error');
    }
}

// Función para cargar datos del informe en el modal
function cargarDatosInforme(informe) {
    // Cargar datos básicos
    const nombreRemitente = document.getElementById('nombreRemitente');
    if (nombreRemitente) nombreRemitente.value = `${informe.usuario_nombre || ''} ${informe.usuario_apellido || ''}`.trim();
    
    const fechaEnvio = document.getElementById('fechaEnvio');
    if (fechaEnvio && informe.fecha_actividad) fechaEnvio.value = informe.fecha_actividad.split('T')[0];
    
    const area = document.getElementById('area');
    if (area) area.value = informe.area_nombre || '';
    
    const sector = document.getElementById('sector');
    if (sector) sector.value = informe.sector_beneficia || '';
    
    const colonia = document.getElementById('colonia');
    if (colonia) colonia.value = informe.colonia || '';
    
    const lugar = document.getElementById('lugar');
    if (lugar) lugar.value = informe.lugar_actividad || '';
    
    const tipo = document.getElementById('tipo');
    if (tipo) tipo.value = informe.tipo_actividad || '';
    
    const beneficiarios = document.getElementById('beneficiarios');
    if (beneficiarios) beneficiarios.value = informe.numero_beneficiarios || '';
    
    const monto = document.getElementById('monto');
    if (monto) monto.value = informe.monto_generado || '';
    
    const montoInvertido = document.getElementById('montoInvertido');
    if (montoInvertido) montoInvertido.value = informe.monto_invertido || '';
    
    const descripcion = document.getElementById('descripcion');
    if (descripcion) descripcion.value = informe.descripcion_actividad || '';
    
    const observaciones = document.getElementById('observaciones');
    if (observaciones) observaciones.value = informe.observaciones || '';
    
    // Cargar campos de selección
    const solicitudCiudadania = document.getElementById('solicitudCiudadania');
    if (solicitudCiudadania) solicitudCiudadania.value = informe.responde_solicitud_ciudadania || '';
    
    const procedimientosArea = document.getElementById('procedimientosArea');
    if (procedimientosArea) procedimientosArea.value = informe.pertenece_procedimientos_area || '';
    
    // Cargar comentarios si existen
    const comentarios = document.getElementById('comentarios');
    if (comentarios) comentarios.value = informe.comentarios || '';

    // --- Campos del modal visitante (si existen) ---
    const v_nombreRemitente = document.getElementById('v_nombreRemitente');
    if (v_nombreRemitente) v_nombreRemitente.textContent = `${informe.usuario_nombre || ''} ${informe.usuario_apellido || ''}`.trim();

    const v_fechaEnvio = document.getElementById('v_fechaEnvio');
    if (v_fechaEnvio && informe.fecha_actividad) v_fechaEnvio.textContent = informe.fecha_actividad.split('T')[0];

    const v_area = document.getElementById('v_area');
    if (v_area) v_area.textContent = informe.area_nombre || '';

    const v_sector = document.getElementById('v_sector');
    if (v_sector) v_sector.textContent = informe.sector_beneficia || '';

    const v_colonia = document.getElementById('v_colonia');
    if (v_colonia) v_colonia.textContent = informe.colonia || '';

    const v_lugar = document.getElementById('v_lugar');
    if (v_lugar) v_lugar.textContent = informe.lugar_actividad || '';

    const v_tipo = document.getElementById('v_tipo');
    if (v_tipo) v_tipo.textContent = informe.tipo_actividad || '';

    const v_beneficiarios = document.getElementById('v_beneficiarios');
    if (v_beneficiarios) v_beneficiarios.textContent = informe.numero_beneficiarios || '';

    const v_monto = document.getElementById('v_monto');
    if (v_monto) v_monto.textContent = informe.monto_generado || '';

    const v_montoInvertido = document.getElementById('v_montoInvertido');
    if (v_montoInvertido) v_montoInvertido.textContent = informe.monto_invertido || '';

    const v_descripcion = document.getElementById('v_descripcion');
    if (v_descripcion) v_descripcion.textContent = informe.descripcion_actividad || '';

    const v_observaciones = document.getElementById('v_observaciones');
    if (v_observaciones) v_observaciones.textContent = informe.observaciones || '';

    const v_comentarios = document.getElementById('v_comentarios');
    if (v_comentarios) v_comentarios.textContent = informe.comentarios || '';

    const v_solicitudCiudadania = document.getElementById('v_solicitudCiudadania');
    if (v_solicitudCiudadania) v_solicitudCiudadania.textContent = informe.responde_solicitud_ciudadania || '';

    const v_procedimientosArea = document.getElementById('v_procedimientosArea');
    if (v_procedimientosArea) v_procedimientosArea.textContent = informe.pertenece_procedimientos_area || '';

    // Evidencias: si el informe incluye URLs de imágenes en informe.evidencias (array o CSV), mostrarlas
    const v_evidencia = document.getElementById('v_evidencia');
    if (v_evidencia) {
        v_evidencia.innerHTML = '';
        const evidencias = informe.evidencias || informe.evidencia_urls || informe.imagenes || null;
        if (evidencias) {
            let lista = Array.isArray(evidencias) ? evidencias : String(evidencias).split(',').map(s => s.trim()).filter(Boolean);
            lista.forEach(url => {
                const img = document.createElement('img');
                img.src = url;
                img.alt = 'Evidencia';
                img.style.maxWidth = '120px';
                img.style.maxHeight = '80px';
                img.className = 'me-2 mb-2 rounded';
                v_evidencia.appendChild(img);
            });
        }
    }
}

// Función mejorada de cerrar sesión
async function cerrarSesion() {
    console.log('cerrarSesion: llamado');
    const modalEl = document.getElementById('modalConfirm');
    if (!modalEl) {
        // fallback rápido usando confirmModal (que a su vez usará confirm nativo si el modal no existe)
        const okFallback = await confirmModal('¿Estás seguro de que deseas cerrar sesión?');
        if (okFallback) {
            mostrarToast('Cerrando sesión...', 'info');
            fetch('/logout', { method: 'POST' }).then(() => window.location.href = '/inicioSesion').catch(() => window.location.href = '/inicioSesion');
        }
        return;
    }

    const msgEl = modalEl.querySelector('#modalConfirmMessage');
    const okBtn = modalEl.querySelector('#modalConfirmOk');
    const cancelBtn = modalEl.querySelector('#modalConfirmCancel');

    if (!msgEl || !okBtn || !cancelBtn) {
        console.warn('cerrarSesion: elementos del modal no encontrados', { msgEl: !!msgEl, okBtn: !!okBtn, cancelBtn: !!cancelBtn });
        // fallback usando confirmModal
        const okFallback2 = await confirmModal('¿Estás seguro de que deseas cerrar sesión?');
        if (okFallback2) {
            mostrarToast('Cerrando sesión...', 'info');
            fetch('/logout', { method: 'POST' }).then(() => window.location.href = '/inicioSesion').catch(() => window.location.href = '/inicioSesion');
        }
        return;
    }

    msgEl.textContent = '¿Estás seguro de que deseas cerrar sesión?';
    const bsModal = new bootstrap.Modal(modalEl, { backdrop: 'static' });
    let finished = false;

    function cleanupListeners() {
        if (finished) return;
        finished = true;
        try { okBtn.removeEventListener('click', logoutOnOk); } catch (e) {}
        try { cancelBtn.removeEventListener('click', logoutOnCancel); } catch (e) {}
        try { modalEl.removeEventListener('hidden.bs.modal', onHidden); } catch (e) {}
    }

    function performLogout() {
        cleanupListeners();
        // Cerrar modales/offcanvas y limpiar backdrops antes de redirigir
        try {
            document.querySelectorAll('.modal.show').forEach((m) => {
                const modalInst = bootstrap.Modal.getInstance(m) || new bootstrap.Modal(m);
                modalInst.hide();
            });
            document.querySelectorAll('.offcanvas.show').forEach((o) => {
                const offInst = bootstrap.Offcanvas.getInstance(o) || new bootstrap.Offcanvas(o);
                offInst.hide();
            });
        } catch (e) {
            console.warn('Bootstrap hide error', e);
        }
        document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
        document.body.classList.remove('modal-open');
        try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (e) {}

        mostrarToast('Cerrando sesión...', 'info');
        fetch('/logout', { method: 'POST' })
            .then(() => { window.location.href = '/inicioSesion'; })
            .catch(() => { window.location.href = '/inicioSesion'; });
    }

    function logoutOnOk() { console.log('cerrarSesion: confirmar pulsado'); performLogout(); }
    function logoutOnCancel() { console.log('cerrarSesion: cancelar pulsado'); cleanupListeners(); bsModal.hide(); }
    function logoutOnHidden() { console.log('cerrarSesion: modal ocultado'); cleanupListeners(); }

    okBtn.addEventListener('click', logoutOnOk);
    cancelBtn.addEventListener('click', logoutOnCancel);
    modalEl.addEventListener('hidden.bs.modal', logoutOnHidden);

    bsModal.show();
    function onShownFocusCs() {
        try { okBtn.focus(); } catch (e) {}
        modalEl.removeEventListener('shown.bs.modal', onShownFocusCs);
    }
    modalEl.addEventListener('shown.bs.modal', onShownFocusCs);
}

// Muestra el modal de confirmación y retorna una Promise<boolean>
function confirmModal(message) {
    return new Promise((resolve) => {
        const modalEl = document.getElementById('modalConfirm');
        if (!modalEl) {
            // fallback to native confirm if modal missing (safe-check window.confirm)
            resolve(window.confirm ? window.confirm(message) : false);
            return;
        }

        const msgEl = modalEl.querySelector('#modalConfirmMessage');
        const okBtn = modalEl.querySelector('#modalConfirmOk');
        const cancelBtn = modalEl.querySelector('#modalConfirmCancel');

        msgEl.textContent = message;

        const bsModal = new bootstrap.Modal(modalEl, { backdrop: 'static' });
        let finished = false;

        // Guardar intentos de debug si los botones faltan
        if (!okBtn || !cancelBtn) {
            console.warn('confirmModal: botones del modal no encontrados', { okBtn: !!okBtn, cancelBtn: !!cancelBtn, modalEl });
            // fallback: usar confirm nativo como última instancia
            // Esto mantiene compatibilidad si el modal está dañado.
            resolve(window.confirm ? window.confirm(message) : false);
            return;
        }

        function cleanup(result) {
            console.log('confirmModal.cleanup result=', result);
            if (finished) return;
            finished = true;
            try { okBtn.removeEventListener('click', confirmOnOk); } catch(e) {}
            try { cancelBtn.removeEventListener('click', confirmOnCancel); } catch(e) {}
            try { modalEl.removeEventListener('hidden.bs.modal', onHidden); } catch(e) {}
            // Hide the modal (if not already hidden)
            try { bsModal.hide(); } catch(e) {}
            resolve(result);
        }
        function confirmOnOk() { console.log('confirmModal.onOk clicked'); cleanup(true); }
        function confirmOnCancel() { console.log('confirmModal.onCancel clicked'); cleanup(false); }
    function confirmOnHidden() { console.log('confirmModal.onHidden'); cleanup(false); }

        okBtn.addEventListener('click', confirmOnOk);
        cancelBtn.addEventListener('click', confirmOnCancel);
    modalEl.addEventListener('hidden.bs.modal', confirmOnHidden);

        bsModal.show();
        // Focalizar el botón OK cuando el modal esté completamente visible (evita aria-hidden warnings)
        function onShownFocus() {
            try { okBtn.focus(); } catch (e) {}
            modalEl.removeEventListener('shown.bs.modal', onShownFocus);
        }
        modalEl.addEventListener('shown.bs.modal', onShownFocus);
    });
}
    

// ============================================
// INICIALIZACIÓN
// ============================================

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema de Informes - JavaScript cargado correctamente');
    
    // Event listener para el botón de guardar usuario
    const btnGuardarUsuario = document.getElementById('btn-guardar-usuario');
    if (btnGuardarUsuario) {
        console.log('✅ Botón guardar usuario encontrado');
        btnGuardarUsuario.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔥 Click en botón guardar usuario');
            
            const form = document.getElementById('form-usuario');
            if (!form) {
                console.error('❌ Formulario no encontrado');
                return;
            }
            
            const formData = new FormData(form);
            const userData = Object.fromEntries(formData);
            console.log('📋 Datos del formulario:', userData);
            
            // Validaciones específicas
            let isValid = true;
            
            // Validar contraseña si es nuevo usuario
            if (!usuarioEditando) {
                if (!userData.password) {
                    mostrarToast('La contraseña es requerida para nuevos usuarios', 'error');
                    isValid = false;
                }
                
                if (userData.password !== userData.confirm_password) {
                    mostrarToast('Las contraseñas no coinciden', 'error');
                    document.getElementById('confirm-password').classList.add('is-invalid');
                    isValid = false;
                }
            }

            // Validar número de nómina (siempre requerido)
            if (!userData.numero_nomina || !userData.numero_nomina.trim()) {
                mostrarToast('El número de nómina es requerido', 'error');
                const nomEl = document.getElementById('numero_nomina');
                if (nomEl) nomEl.classList.add('is-invalid');
                isValid = false;
            }
            
            if (form.checkValidity() && isValid) {
                // Remover confirm_password de los datos antes de enviar
                delete userData.confirm_password;
                guardarUsuario(userData);
            } else {
                form.classList.add('was-validated');
                if (isValid) {
                    mostrarToast('Por favor, completa todos los campos requeridos', 'warning');
                }
            }
        });
    } else {
        console.error('❌ Botón guardar usuario NO encontrado');
    }
    
    // Event listener para el botón de guardar área
    const btnGuardarArea = document.getElementById('btn-guardar-area');
    if (btnGuardarArea) {
        btnGuardarArea.addEventListener('click', function(e) {
            console.log('DEBUG: btn-guardar-area clicked', { btn: e.currentTarget });
            e.preventDefault();
            
            const form = document.getElementById('form-area');
            if (!form) {
                console.error('DEBUG: form-area not found on btn click');
                return;
            }
            if (form.checkValidity()) {
                const formData = new FormData(form);
                const areaData = Object.fromEntries(formData);
                console.log('DEBUG: areaData to save (button click):', areaData);
                guardarArea(areaData);
            } else {
                form.classList.add('was-validated');
                mostrarToast('Por favor, completa todos los campos requeridos', 'warning');
            }
        });
    }

    // Fallback: manejar el submit del formulario directamente (por si el botón no se atachó o se envía con Enter)
    const formArea = document.getElementById('form-area');
    if (formArea) {
        formArea.addEventListener('submit', function(e) {
            console.log('DEBUG: form-area submit event', { form: this });
            e.preventDefault();
            const form = this;
            if (form.checkValidity()) {
                const formData = new FormData(form);
                const areaData = Object.fromEntries(formData);
                console.log('DEBUG: areaData to save (form submit):', areaData);
                guardarArea(areaData);
            } else {
                form.classList.add('was-validated');
                mostrarToast('Por favor, completa todos los campos requeridos', 'warning');
            }
        });
    }

    // Inicializar modal de Usuarios: decidir si es crear o editar según el botón que lo abre
    const modalUsuariosEl = document.getElementById('modalUsuarios');
    if (modalUsuariosEl) {
        modalUsuariosEl.addEventListener('show.bs.modal', function(event) {
            // event.relatedTarget es el botón que disparó la apertura del modal (puede ser undefined si se abre programáticamente)
            const trigger = event.relatedTarget;
            try {
                if (trigger && trigger.dataset && trigger.dataset.userId) {
                    // Abrir en modo edición y pasar los datos del dataset
                    const id = trigger.dataset.userId;
                    const username = trigger.dataset.username || '';
                    const nombre = trigger.dataset.nombre || '';
                    const apellido = trigger.dataset.apellido || '';
                    const email = trigger.dataset.email || '';
                    const telefono = trigger.dataset.telefono || '';
                    const areaId = trigger.dataset.areaId || trigger.dataset.area_id || '';
                    const rolId = trigger.dataset.rolId || trigger.dataset.rol_id || '';
                    editarUsuario(id, username, nombre, apellido, email, telefono, areaId, rolId);
                } else {
                    // Modo crear
                    abrirModalCrearUsuario();
                }
            } catch (err) {
                console.error('Error al inicializar modalUsuarios:', err);
                // Si hay error, asegurar que quede en modo crear
                abrirModalCrearUsuario();
            }
        });
    }

    // Fallback helper expuesto en window para diagnóstico rápido desde el HTML
    window.__fallbackGuardarArea = function(btn) {
        try {
            console.log('DEBUG: __fallbackGuardarArea called', { btn });
            const form = document.getElementById('form-area');
            if (!form) return console.error('form-area not found in fallback');
            // trigger submit programmatically
            form.dispatchEvent(new Event('submit', { cancelable: true }));
        } catch (err) {
            console.error('DEBUG: fallback error', err);
        }
    };
    
    const formCrearInforme = document.getElementById('form-crear-informe') || document.getElementById('formularioInforme');
    if (formCrearInforme) {
        formCrearInforme.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            // Pasar FormData directamente a crearInforme para que maneje archivos correctamente
            crearInforme(formData);
        });
    }
    
    // Event listeners para botones de áreas
    document.addEventListener('click', function(e) {
        // Botones de editar área
        if (e.target.classList.contains('btn-editar-area')) {
            const areaId = e.target.dataset.areaId;
            const areaNombre = e.target.dataset.areaNombre;
            const areaDescripcion = e.target.dataset.areaDescripcion;
            editarArea(areaId, areaNombre, areaDescripcion);
        }
        
        // Botones de eliminar área
        if (e.target.classList.contains('btn-eliminar-area')) {
            const areaId = e.target.dataset.areaId;
            const areaNombre = e.target.dataset.areaNombre;
            eliminarArea(areaId, areaNombre);
        }
    });
});