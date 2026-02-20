
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
        // Añadir cabeceras que apuntan a peticiones AJAX/JSON para que el servidor las detecte
        options.headers['Accept'] = 'application/json';
        options.headers['X-Requested-With'] = 'XMLHttpRequest';

    // Debug logging can be enabled by setting window.__DEBUG__ = true in the console
    if (window && window.__DEBUG__) console.debug(`🔄 ${method} ${url}`, data);
        const response = await fetch(url, options);

        let parsed;
        try {
            parsed = await response.json();
        } catch (err) {
            // Respuesta no JSON (HTML/text) — devolver información mínima
            console.warn('Respuesta no JSON recibida de', url, 'status=', response.status);
            parsed = { success: response.ok, message: response.statusText, data: null };
        }

    if (window && window.__DEBUG__) console.debug(`📥 Respuesta ${response.status}:`, parsed);

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

// Implementación unificada de mostrarToast para toda la app
// Crea toasts estilo Bootstrap dentro de un contenedor global `#global-toast-container`.
// Si el contenedor no existe, se crea dinámicamente.
window.mostrarToast = function(mensaje, tipo = 'success') {
    // Minimal internal logging unless debug mode is enabled
    if (window && window.__DEBUG__) try { console.debug(`[toast:${tipo}] ${mensaje}`); } catch (e) {}

    const tiposConfig = {
        'success': { bgClass: 'toast-success', icon: 'bi-check-circle-fill' },
        'warning': { bgClass: 'toast-warning', icon: 'bi-exclamation-triangle-fill' },
        'danger':  { bgClass: 'toast-danger', icon: 'bi-x-circle-fill' },
        'info':    { bgClass: 'toast-info', icon: 'bi-info-circle-fill' }
    };

    const config = tiposConfig[tipo] || tiposConfig['success'];
    const containerId = 'global-toast-container';
    let container = document.getElementById(containerId);

    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        // posicionar en esquina superior derecha con padding
        container.className = 'position-fixed top-0 end-0 p-3';
        container.style.zIndex = 1080;
        document.body.appendChild(container);
    }

    const toastId = 'toast-' + Date.now();
    const toastHtml = `
        <div class="toast align-items-center text-white ${config.bgClass} border-0" id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi ${config.icon} me-2"></i>
                    ${mensaje}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHtml);
    const toastEl = document.getElementById(toastId);
    try {
        const bsToast = new bootstrap.Toast(toastEl, { autohide: true, delay: 3000 });
        bsToast.show();
        toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    } catch (e) {
        // Si bootstrap no está disponible, fallback sencillo
        setTimeout(() => { try { toastEl.remove(); } catch(e){} }, 3000);
    }
};

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
    
    // Permitir editar el username desde el formulario (antes se deshabilitaba)
    document.getElementById('username').disabled = false;
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
    try {
        const confirmUser = await confirmModal(`¿Estás seguro de eliminar al usuario "${nombreUsuario}"?`);
        if (!confirmUser) return;

        const response = await makeRequest(`/usuarios/${userId}`, 'DELETE');
    if (window && window.__DEBUG__) console.debug('eliminarUsuario: respuesta del servidor', response);

        // Considerar éxito tanto si el servidor devuelve { success: true } como si la respuesta HTTP es 2xx
        if (response && (response.success === true || (typeof response.status === 'number' && response.status >= 200 && response.status < 300))) {
            mostrarUsuarioEliminado();
            // En lugar de manipular sólo la fila, volver a cargar los usuarios para mantener numeración y estado consistentes
            try {
                await buscarUsuarios();
            } catch (e) {
                console.warn('No se pudo recargar la lista de usuarios tras eliminación:', e);
                // Fallback: remover la fila manualmente si la recarga falla
                const userRow = document.querySelector(`tr[data-user-id="${userId}"]`);
                if (userRow) userRow.remove();
            }
            mostrarToast(response.message || 'Usuario eliminado', 'success');
            return;
        }

        // Manejo de errores HTTP comunes
        if (response && response.status === 401) {
            mostrarToast('No autenticado. Por favor inicia sesión de nuevo.', 'danger');
            return;
        }
        if (response && response.status === 403) {
            mostrarToast('No tienes permisos para eliminar usuarios.', 'danger');
            return;
        }

        // Si el DELETE devolvió 404, intentar fallback POST (algún proxy/cliente bloqueó DELETE)
        if (response && response.status === 404) {
            console.warn('DELETE devolvió 404, intentando fallback POST /delete');
            try {
                const fallback = await makeRequest(`/usuarios/${userId}/delete`, 'POST');
                if (window && window.__DEBUG__) console.debug('fallback POST response', fallback);
                if (fallback && fallback.success) {
                    mostrarUsuarioEliminado();
                    const userRow = document.querySelector(`tr[data-user-id="${userId}"]`);
                    if (userRow) userRow.remove();
                    mostrarToast(fallback.message || 'Usuario eliminado (fallback)', 'success');
                    return;
                }
                mostrarToast(fallback.message || 'No se pudo eliminar el usuario (fallback)', 'danger');
                return;
            } catch (fbErr) {
                console.error('Error en fallback POST delete:', fbErr);
                mostrarToast('Error intentando eliminar usuario (fallback)', 'danger');
                return;
            }
        }

        mostrarToast((response && (response.message || (response.data && response.data.message))) || 'Error al eliminar usuario', 'danger');

    } catch (err) {
        console.error('Error en eliminarUsuario:', err);
        mostrarToast('Error de red al intentar eliminar usuario', 'danger');
    }
}


// Buscar usuarios
async function buscarUsuarios() {
    try {
        // Prefer explicit IDs used in the sidebar; fallback to generic placeholders
        const nombre = (document.querySelector('#nombre-filter') && document.querySelector('#nombre-filter').value) || document.querySelector('input[placeholder*="nombre"]')?.value || '';
        const area = document.querySelector('#area-filter')?.value || '';
        const rol = document.querySelector('#rol-filter')?.value || '';
        
        const params = new URLSearchParams();
        if (nombre) params.append('nombre', nombre);
        if (area) params.append('area', area);
        if (rol) params.append('rol', rol);
        
        const url = `/api/usuarios/buscar?${params.toString()}`;
        console.log('🔍 Llamando a buscarUsuarios:', url);
        
        const response = await makeRequest(url);
        console.log('📋 Respuesta:', response);
        
        if (response && response.success) {
            // The API returns { data: { usuarios: [...] } } or sometimes data could be the array
            const usuarios = (response.data && response.data.usuarios) ? response.data.usuarios : (Array.isArray(response.data) ? response.data : []);
            console.log('✅ Usuarios encontrados:', usuarios);
            actualizarTablaUsuarios(usuarios);
            mostrarToast(`Se encontraron ${usuarios.length} usuarios`, 'info');
        } else {
            console.error('❌ Error:', response);
            mostrarToast(response?.message || 'Error en la búsqueda', 'danger');
        }
    } catch (error) {
        console.error('❌ Exception en buscarUsuarios:', error);
        mostrarToast('Error en la búsqueda: ' + error.message, 'danger');
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
    try {
        // Usar los IDs específicos de la barra lateral de áreas
        const nombreInput = document.getElementById('nombre-area-filter');
        const areaSelect = document.getElementById('area-select-filter');
        const nombre = nombreInput ? (nombreInput.value || '') : '';
        const area_id = areaSelect ? (areaSelect.value || '') : '';

        const params = new URLSearchParams();
        if (nombre) params.append('nombre', nombre);
        if (area_id) params.append('area_id', area_id);

        const url = `/api/areas/buscar?${params.toString()}`;
        console.log('🔍 Llamando a buscarAreas:', url);

        const response = await makeRequest(url);
        console.log('📋 Respuesta:', response);

        if (response && response.success) {
            const areas = (response.data && response.data.areas) ? response.data.areas : (Array.isArray(response.data) ? response.data : []);
            console.log('✅ Áreas encontradas:', areas);
            actualizarTablaAreas(areas);
            mostrarToast(`Se encontraron ${areas.length} áreas`, 'info');
        } else {
            console.error('❌ Error:', response);
            mostrarToast(response?.message || 'Error en la búsqueda', 'danger');
        }
    } catch (error) {
        console.error('❌ Exception en buscarAreas:', error);
        mostrarToast('Error en la búsqueda: ' + error.message, 'danger');
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
function actualizarTablaHistorial(informes) {
    const tbody = document.getElementById('historial-tbody');
    if (!tbody) return;

    if (!informes || informes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">No hay informes en el historial</td>
            </tr>
        `;
    } else {
        tbody.innerHTML = informes.map((informe, index) => {
            let estadoBadge = '';
            if (informe.estado === 'aprobado') {
                estadoBadge = '<span class="badge bg-success">Aprobado</span>';
            } else if (informe.estado === 'en_revision') {
                estadoBadge = '<span class="badge bg-warning text-dark">En Revisión</span>';
            } else if (informe.estado === 'rechazado') {
                estadoBadge = '<span class="badge bg-danger">Rechazado</span>';
            } else if (informe.estado === 'enviado') {
                estadoBadge = '<span class="badge bg-info">Enviado</span>';
            } else {
                estadoBadge = `<span class="badge bg-secondary">${informe.estado}</span>`;
            }
            
            const isAprobado = informe.estado === 'aprobado';
            const fecha = new Date(informe.fecha_actividad || new Date()).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
            const fechaCapitalizada = fecha.charAt(0).toUpperCase() + fecha.slice(1);
            
            return `
                <tr data-informe-id="${informe.id}">
                    <td>${index + 1}</td>
                    <td>${new Date(informe.fecha_creacion).toLocaleDateString()}</td>
                    <td>${fechaCapitalizada}</td>
                    <td>${estadoBadge}</td>
                    <td>
                        <div class="d-flex justify-content-center gap-2">
                            <button class="btn btn-editar btn-sm" ${isAprobado ? '' : 'disabled'} onclick="mostrarDescargaIniciada()">
                                <i class="bi bi-download me-1"></i>Descargar
                            </button>
                            <button class="btn btn-outline-primary btn-sm" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#modalHistorialInforme"
                                    data-informe-id="${informe.id}"
                                    onclick="cargarInformeEnModal(this)">Ver</button>
                            <button class="btn btn-outline-danger btn-sm btn-eliminar-informe" 
                                    data-informe-id="${informe.id}"
                                    onclick="eliminarInforme('${informe.id}', '${informe.titulo || 'Informe'}')">Eliminar</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

// Cargar informe en modal del historial o admin
async function cargarInformeEnModal(btn) {
    const informeId = btn.getAttribute('data-informe-id');
    console.log('📋 Cargando informe ID:', informeId);
    
    try {
        const response = await makeRequest(`/api/informes/${informeId}`, 'GET');
        console.log('📊 Respuesta de API:', response);
        
        if (response.success && response.data) {
            const informe = response.data;
            console.log('✅ Datos del informe:', informe);
            
            // Helper function más robusta para llenar campos
            const llenarCampo = (elementId, valor) => {
                const elemento = document.getElementById(elementId);
                if (!elemento) {
                    console.warn('⚠️ Elemento no encontrado:', elementId);
                    return;
                }
                
                try {
                    // Convertir a string si es necesario
                    const valorStr = valor !== null && valor !== undefined ? String(valor) : '';
                    
                    if (elemento.tagName === 'TEXTAREA') {
                        // Para textareas, usar .value en lugar de .textContent
                        elemento.value = valorStr;
                    } else if (elemento.tagName === 'INPUT' || elemento.tagName === 'SELECT') {
                        // Remover todos los atributos restrictivos
                        elemento.removeAttribute('readonly');
                        elemento.removeAttribute('disabled');
                        elemento.removeAttribute('aria-disabled');
                        
                        // Asignar valor
                        elemento.value = valorStr;
                        
                        // Volver a poner readonly si es necesario
                        if (elemento.classList.contains('readonly-field')) {
                            elemento.setAttribute('readonly', 'readonly');
                        }
                    }
                    console.log('✏️ ' + elementId + ' = ' + valorStr.substring(0, 50));
                } catch (e) {
                    console.error('Error al llenar ' + elementId + ':', e);
                }
            };
            
            // Modal 1: Modal de Admin (ModalInforme.ejs)
            console.log('📋 Llenando modal admin...');
            llenarCampo('fechaInforme', informe.fecha_creacion ? new Date(informe.fecha_creacion).toISOString().split('T')[0] : '');
            llenarCampo('areaInforme', informe.area_nombre || '');
            llenarCampo('nombreDirector', informe.nombre_director || '');
            llenarCampo('lugarActividad', informe.lugar_actividad || '');
            llenarCampo('coloniaComunidad', informe.colonia_comunidad || '');
            llenarCampo('tipoActividad', informe.tipo_actividad || '');
            llenarCampo('cantidad', informe.cantidad || '');
            llenarCampo('sectorBeneficia', informe.sector_beneficia || '');
            llenarCampo('descripcionActividad', informe.descripcion_actividad || '');
            llenarCampo('numeroBeneficiarios', informe.numero_beneficiarios || '');
            llenarCampo('montoGenerado', informe.monto_generado ? `$${parseFloat(informe.monto_generado).toFixed(2)}` : '');
            llenarCampo('perteneceArea', informe.pertenece_procedimientos_area ? 'Sí' : 'No');
            llenarCampo('respondeClientela', informe.responde_solicitud_ciudadania ? 'Sí' : 'No');
            llenarCampo('observaciones', informe.observaciones || '');
            
            // Manejar evidencia fotográfica
            const galeriaEvidencia = document.getElementById('galeriaEvidencia');
            const sinEvidencia = document.getElementById('sinEvidencia');
            
            if (galeriaEvidencia && sinEvidencia) {
                if (informe.evidencia_fotografica) {
                    // Limpiar galería
                    galeriaEvidencia.innerHTML = '';
                    
                    // Parsear rutas de imágenes (separadas por comas o semicolons)
                    const rutasImagenes = informe.evidencia_fotografica.split(/[,;]/).filter(r => r.trim());
                    
                    if (rutasImagenes.length > 0) {
                        // Mostrar galería y esconder mensaje de sin evidencia
                        galeriaEvidencia.style.display = 'block';
                        sinEvidencia.style.display = 'none';
                        
                        // Crear elementos de imagen
                        const imagenes = rutasImagenes.map(ruta => {
                            const rutaLimpia = ruta.trim();
                            return `
                                <div class="mb-2">
                                    <img src="${rutaLimpia}" alt="Evidencia fotográfica" 
                                         style="max-width: 100%; max-height: 300px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                </div>
                            `;
                        }).join('');
                        
                        galeriaEvidencia.innerHTML = imagenes;
                    } else {
                        galeriaEvidencia.style.display = 'none';
                        sinEvidencia.style.display = 'block';
                    }
                } else {
                    galeriaEvidencia.style.display = 'none';
                    sinEvidencia.style.display = 'block';
                }
            }
            
            // Mostrar evaluación si está aprobado, rechazado O si tiene comentarios de revisión (para el capturista)
            const evaluacionDiv = document.getElementById('evaluacionAdmin');
            if (evaluacionDiv) {
                if (informe.estado === 'aprobado' || informe.estado === 'rechazado' || informe.comentarios_revision) {
                    evaluacionDiv.style.display = 'block';
                    
                    // Cambiar color según estado
                    const estadoField = document.getElementById('estadoEvaluacion');
                    if (estadoField) {
                        estadoField.value = informe.estado.toUpperCase();
                        estadoField.style.color = informe.estado === 'aprobado' ? '#28a745' : informe.estado === 'rechazado' ? '#dc3545' : '#ffc107';
                    }
                    
                    llenarCampo('comentariosRevision', informe.comentarios_revision || 'Sin comentarios');
                } else {
                    evaluacionDiv.style.display = 'none';
                }
            }
            
            // Guardar ID del informe en la ventana para usarlo en evaluarInforme
            window.informeActualId = informeId;
            
            // Mostrar botones de evaluación solo si está en estado 'enviado' Y el usuario es administrador
            const botonesEvaluacion = document.getElementById('botonesEvaluacion');
            if (botonesEvaluacion && informe.estado === 'enviado' && window.currentUserRole === 'administrador') {
                console.log('👤 Usuario rol:', window.currentUserRole, '- Mostrando botones de evaluación');
                botonesEvaluacion.style.display = 'flex';
                botonesEvaluacion.style.justifyContent = 'flex-start';
                botonesEvaluacion.style.gap = '10px';
                // Limpiar comentarios previos
                const comentariosField = document.getElementById('comentariosEvaluacion');
                if (comentariosField) comentariosField.value = '';
            } else if (botonesEvaluacion) {
                console.log('👤 Usuario rol:', window.currentUserRole, '- NO mostrando botones de evaluación (estado:', informe.estado, ')');
                botonesEvaluacion.style.display = 'none';
            }
            
            console.log('✅ Modal llenado exitosamente');
            
        } else {
            console.error('❌ Respuesta inválida:', response);
            mostrarToast('Error al cargar el informe', 'danger');
        }
    } catch (error) {
        console.error('❌ Error cargando informe:', error);
        mostrarToast('Error al cargar el informe', 'danger');
    }
}

// Función para evaluar informe (aceptar o rechazar)
async function evaluarInforme(accion) {
    if (!window.informeActualId) {
        mostrarToast('Error: No se encontró el ID del informe', 'danger');
        return;
    }
    
    const informeId = window.informeActualId;
    const comentarios = document.getElementById('comentariosEvaluacion')?.value || '';
    
    if (!comentarios.trim()) {
        mostrarToast('Por favor ingresa comentarios para la evaluación', 'warning');
        return;
    }
    
    const estado = accion === 'aceptar' ? 'aprobado' : 'rechazado';
    
    console.log('📤 Evaluando informe', informeId, 'como:', estado);
    
    try {
        const response = await makeRequest(`/api/informes/${informeId}/evaluar`, 'PUT', {
            estado: estado,
            comentarios: comentarios
        });
        
        if (response.success) {
            mostrarToast(`Informe ${estado} exitosamente`, 'success');
            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalInforme'));
            if (modal) modal.hide();
            // Recargar la tabla
            buscarInformes();
        } else {
            mostrarToast(response.message || 'Error al evaluar el informe', 'danger');
        }
    } catch (error) {
        console.error('Error evaluando informe:', error);
        mostrarToast('Error al evaluar el informe', 'danger');
    }
}

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
    try {
        // Recopilar parámetros de filtros (siguiendo el patrón de buscarUsuarios y buscarAreas)
        const areaSelectInformes = document.getElementById('area-filter-informes');
        const fechaDesdeInformes = document.getElementById('fecha-desde-informes');
        const fechaHastaInformes = document.getElementById('fecha-hasta-informes');
        
        const area_id = areaSelectInformes ? (areaSelectInformes.value || '') : '';
        const fecha_desde = fechaDesdeInformes ? (fechaDesdeInformes.value || '') : '';
        const fecha_hasta = fechaHastaInformes ? (fechaHastaInformes.value || '') : '';

        const params = new URLSearchParams();
        if (area_id) params.append('area_id', area_id);
        if (fecha_desde) params.append('fecha_desde', fecha_desde);
        if (fecha_hasta) params.append('fecha_hasta', fecha_hasta);

        const url = `/api/informes${params.toString() ? '?' + params.toString() : ''}`;
        console.log('🔍 Llamando a buscarInformes:', url);

        const response = await makeRequest(url);
        console.log('📋 Respuesta:', response);

        if (response && response.success) {
            const informes = (response.data && response.data.informes) ? response.data.informes : (Array.isArray(response.data) ? response.data : []);
            console.log('✅ Informes encontrados:', informes);
            actualizarTablaInformes(informes);
            mostrarToast(`Se encontraron ${informes.length} informes`, 'info');
        } else {
            console.error('❌ Error:', response);
            mostrarToast(response?.message || 'Error en la búsqueda', 'danger');
        }
    } catch (error) {
        console.error('❌ Exception en buscarInformes:', error);
        mostrarToast('Error en la búsqueda: ' + error.message, 'danger');
    }
}

// Función para cargar el historial del usuario
async function cargarHistorial() {
    console.log('📚 Cargando historial del usuario');
    
    try {
        const response = await makeRequest('/api/historial', 'GET');
        
        if (response.success && response.data) {
            console.log('✅ Historial cargado:', response.data.length);
            actualizarTablaHistorial(response.data);
        } else {
            console.log('❌ Error cargando historial:', response.message);
            mostrarToast('Error al cargar historial', 'danger');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        mostrarToast('Error al cargar historial', 'danger');
    }
}

// Función para actualizar la tabla del historial
function actualizarTablaHistorial(informes) {
    const tbody = document.getElementById('historial-tbody');
    if (!tbody) return;

    if (!informes || informes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">No hay informes en el historial</td>
            </tr>
        `;
    } else {
        tbody.innerHTML = informes.map((informe, index) => {
            const fechaActividad = new Date(informe.fecha_actividad);
            const periodoFormato = fechaActividad.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
            const periodoCapitalizado = periodoFormato.charAt(0).toUpperCase() + periodoFormato.slice(1);
            
            let estadoBadge = '';
            if (informe.estado === 'aprobado') {
                estadoBadge = '<span class="badge bg-success">Aprobado</span>';
            } else if (informe.estado === 'en_revision') {
                estadoBadge = '<span class="badge bg-warning text-dark">En Revisión</span>';
            } else if (informe.estado === 'rechazado') {
                estadoBadge = '<span class="badge bg-danger">Rechazado</span>';
            } else if (informe.estado === 'enviado') {
                estadoBadge = '<span class="badge bg-info">Enviado</span>';
            } else {
                estadoBadge = `<span class="badge bg-secondary">${informe.estado}</span>`;
            }
            
            return `
                <tr data-informe-id="${informe.id}">
                    <td>${index + 1}</td>
                    <td>${informe.fecha_creacion ? new Date(informe.fecha_creacion).toLocaleDateString() : ''}</td>
                    <td>${periodoCapitalizado}</td>
                    <td>${estadoBadge}</td>
                    <td>
                        <div class="d-flex justify-content-center gap-2 nowrap">
                            <button class="btn btn-editar btn-sm btn-min-70" 
                                    ${informe.estado !== 'aprobado' ? 'disabled' : ''}
                                    onclick="descargarInforme('${informe.id}')">
                                <i class="bi bi-download me-1"></i>Descargar
                            </button>
                            <button class="btn btn-secondary btn-sm btn-min-70" 
                                    data-bs-toggle="modal" 
                                    data-bs-target="#modalInforme"
                                    data-informe-id="${informe.id}"
                                    onclick="cargarInformeEnModal(this)">
                                Ver
                            </button>
                            <button class="btn btn-outline-danger btn-sm btn-eliminar-informe btn-min-70" 
                                    data-informe-id="${informe.id}"
                                    onclick="eliminarInforme('${informe.id}', '')">
                                Eliminar
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

// ============================================
// FUNCIONES DE ACTUALIZACIÓN DE INTERFAZ
// ============================================

// Actualizar tabla de usuarios (usar índice de fila para la numeración visible)
function actualizarTablaUsuarios(usuarios) {
    const tbody = document.getElementById('usuarios-tbody');
    if (!tbody) return;

    tbody.innerHTML = usuarios.map((usuario, index) => `
        <tr data-user-id="${usuario.id}" data-numero-nomina="${usuario.numero_nomina || ''}">
            <td>${index + 1}</td>
            <td>${usuario.nombre || 'Nombre'}</td>
            <td>${usuario.apellido || 'Apellidos'}</td>
            <td>${usuario.area_nombre || 'Sin área'}</td>
            <td>
                <div class="d-flex justify-content-center gap-2 nowrap">
                    <button class="btn btn-sm btn-editar btn-min-70" data-bs-toggle="modal" data-bs-target="#modalUsuarios" data-user-id="${usuario.id}" data-username="${usuario.username}" data-nombre="${usuario.nombre}" data-apellido="${usuario.apellido}" data-email="${usuario.email}" data-telefono="${usuario.telefono || ''}" data-area-id="${usuario.area_id || ''}" data-numero-nomina="${usuario.numero_nomina || ''}" data-rol-id="${usuario.rol_id}">Editar</button>
                    <button type="button" class="btn btn-sm btn-danger btn-eliminar-usuario btn-min-70" data-user-id="${usuario.id}" data-user-name="${usuario.nombre || ''} ${usuario.apellido || ''}">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Actualizar tabla de áreas
function actualizarTablaAreas(areas) {
    const tbody = document.getElementById('areas-tbody');
    if (!tbody) return;

    tbody.innerHTML = areas.map((area, index) => `
        <tr data-area-id="${area.id}">
            <td>${index + 1}</td>
            <td>${area.nombre}</td>
            <td>${area.descripcion || ''}</td>
            <td>
                <div class="d-flex justify-content-center gap-2 nowrap">
                    <button class="btn btn-sm btn-editar btn-min-70 btn-editar-area" data-bs-toggle="modal" data-bs-target="#modalAreas" data-area-id="${area.id}" data-area-nombre="${area.nombre}" data-area-descripcion="${area.descripcion || ''}">Editar</button>
                    <button class="btn btn-sm btn-danger btn-eliminar-area btn-min-70" data-area-id="${area.id}" data-area-nombre="${area.nombre}">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Actualizar tabla de informes
function actualizarTablaInformes(informes) {
    const tbody = document.getElementById('informes-tbody');
    if (!tbody) return;

    if (!informes || informes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">No hay informes registrados</td>
            </tr>
        `;
    } else {
        tbody.innerHTML = informes.map((informe, index) => `
            <tr data-informe-id="${informe.id}" id="informe-${informe.id}">
                <td>${index + 1}</td>
                <td>${informe.usuario_nombre || ''} ${informe.usuario_apellido || ''}</td>
                <td>${informe.area_nombre || ''}</td>
                <td>${informe.fecha_creacion ? new Date(informe.fecha_creacion).toLocaleDateString() : ''}</td>
                <td>
                    <div class="d-flex justify-content-center gap-2 nowrap">
                        <button class="btn btn-editar btn-sm btn-min-70" 
                                ${informe.estado !== 'aprobado' ? 'disabled' : ''}
                                onclick="descargarInforme('${informe.id}')">
                            <i class="bi bi-download me-1"></i>Descargar
                        </button>
                        <button type="button" class="btn btn-secondary btn-sm btn-min-70" 
                                data-informe-id="${informe.id}"
                                data-bs-toggle="modal" 
                                data-bs-target="#modalInforme"
                                onclick="cargarInformeEnModal(this)">
                            Abrir
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
}

// ============================================
// FUNCIONES DE MODALES Y FORMULARIOS
// ============================================

// ============================================
// FUNCIONES AUXILIARES - USUARIOS / ÁREAS
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
// FUNCIONES AUXILIARES - INFORMES
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
    if (window && window.__DEBUG__) console.debug('cerrarSesion: llamado');
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

    function logoutOnOk() { if (window && window.__DEBUG__) console.debug('cerrarSesion: confirmar pulsado'); performLogout(); }
    function logoutOnCancel() { if (window && window.__DEBUG__) console.debug('cerrarSesion: cancelar pulsado'); cleanupListeners(); bsModal.hide(); }
    function logoutOnHidden() { if (window && window.__DEBUG__) console.debug('cerrarSesion: modal ocultado'); cleanupListeners(); }

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
        if (window && window.__DEBUG__) console.debug('confirmModal.cleanup result=', result);
            if (finished) return;
            finished = true;
            try { okBtn.removeEventListener('click', confirmOnOk); } catch(e) {}
            try { cancelBtn.removeEventListener('click', confirmOnCancel); } catch(e) {}
            try { modalEl.removeEventListener('hidden.bs.modal', onHidden); } catch(e) {}
            // Hide the modal (if not already hidden)
            try { bsModal.hide(); } catch(e) {}
            resolve(result);
        }
        function confirmOnOk() { if (window && window.__DEBUG__) console.debug('confirmModal.onOk clicked'); cleanup(true); }
        function confirmOnCancel() { if (window && window.__DEBUG__) console.debug('confirmModal.onCancel clicked'); cleanup(false); }
    function confirmOnHidden() { if (window && window.__DEBUG__) console.debug('confirmModal.onHidden'); cleanup(false); }

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
    if (window && window.__DEBUG__) console.debug('🚀 Sistema de Informes - JavaScript cargado correctamente');

    // Cargar datos de filtros (áreas y roles) desde la API y poblar los selects/dropdowns
    (async function populateFilters() {
        try {
            const resp = await makeRequest('/api/filtros', 'GET');
            if (!resp || !resp.success || !resp.data) return;
            const areas = resp.data.areas || [];
            const roles = resp.data.roles || [];

            // Poblar selects relacionados con áreas
            const areaSelectIds = ['#area-filter', '#area', '#area_id', '#area-filter-informes'];
            areaSelectIds.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => {
                    try {
                        // Limpiar opciones excepto la primera (placeholder)
                        const placeholder = el.querySelector('option[value=""]') ? el.querySelector('option[value=""]').outerHTML : '<option value="">Todas las áreas</option>';
                        el.innerHTML = placeholder;
                        areas.forEach(a => {
                            const opt = document.createElement('option');
                            opt.value = a.id;
                            opt.textContent = a.nombre;
                            el.appendChild(opt);
                        });
                    } catch (e) { console.warn('populateFilters area select error', e); }
                });
            });

            // Poblar selects de roles
            const rolSelectIds = ['#rol-filter', '#rol_id'];
            rolSelectIds.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => {
                    try {
                        const placeholder = el.querySelector('option[value=""]') ? el.querySelector('option[value=""]').outerHTML : '<option value="">Selecciona...</option>';
                        el.innerHTML = placeholder;
                        roles.forEach(r => {
                            const opt = document.createElement('option');
                            opt.value = r.id;
                            opt.textContent = r.nombre;
                            el.appendChild(opt);
                        });
                    } catch (e) { console.warn('populateFilters rol select error', e); }
                });
            });

            // Poblar dropdown del sidebar para áreas (si existe)
            try {
                const dropdownList = document.querySelector('ul.dropdown-menu[aria-labelledby="dropdownArea"]');
                if (dropdownList) {
                    dropdownList.innerHTML = '';
                    areas.forEach(a => {
                        const li = document.createElement('li');
                        const aEl = document.createElement('a');
                        aEl.className = 'dropdown-item';
                        aEl.href = '#';
                        aEl.dataset.areaId = a.id;
                        aEl.textContent = a.nombre;
                        aEl.addEventListener('click', function(e) {
                            e.preventDefault();
                            const areaId = this.dataset.areaId;
                            
                            // Actualizar el botón dropdownArea con el data-area-id
                            const dropdownBtn = document.querySelector('#dropdownArea');
                            if (dropdownBtn) {
                                dropdownBtn.setAttribute('data-area-id', areaId);
                                dropdownBtn.textContent = this.textContent;
                            }
                            
                            // Si la página es de informes, ejecutar búsqueda
                            if (typeof buscarInformes === 'function') buscarInformes();
                        });
                        li.appendChild(aEl);
                        dropdownList.appendChild(li);
                    });
                }
            } catch (e) { console.warn('populateFilters dropdown error', e); }

        } catch (err) {
            console.warn('No se pudieron cargar filtros desde /api/filtros', err);
        }
    })();

    // Asegurar que los botones de buscar/limpiar del sidebar disparen las funciones correctas
    try {
        // Mapear data-action específicos por si la delegación falla en ciertas páginas
        const bindAction = (selector, fn) => {
            document.querySelectorAll(selector).forEach(el => {
                if (!el) return;
            el.addEventListener('click', function(e) {
                try { e.preventDefault(); fn(); } catch (ee) { console.warn('action bind error', ee); }
                });
            });
        };

        // Limpiar filtros
        bindAction('[data-action="limpiar-filtros"]', () => {
            const container = document.querySelector('form') || document;
            container.querySelectorAll('input, select, textarea').forEach(inp => {
                try {
                    if (inp.type === 'checkbox' || inp.type === 'radio') inp.checked = false;
                    else inp.value = '';
                    if (inp.tagName === 'SELECT') inp.selectedIndex = 0;
                } catch (ee) {}
            });
            // Trigger searches to refresh lists
            if (document.getElementById('usuarios-tbody') && typeof buscarUsuarios === 'function') buscarUsuarios();
            else if (document.getElementById('areas-tbody') && typeof buscarAreas === 'function') buscarAreas();
            else if (document.getElementById('informes-tbody') && typeof buscarInformes === 'function') buscarInformes();
        });

        // Limpiar filtros de informes específicamente
        bindAction('[data-action="limpiar-filtros-informes"]', () => {
            const areaFilter = document.getElementById('area-filter-informes');
            const fechaDesde = document.getElementById('fecha-desde-informes');
            const fechaHasta = document.getElementById('fecha-hasta-informes');
            
            if (areaFilter) areaFilter.selectedIndex = 0;
            if (fechaDesde) fechaDesde.value = '';
            if (fechaHasta) fechaHasta.value = '';
            
            if (typeof buscarInformes === 'function') buscarInformes();
        });

        // Limpiar filtros de áreas específicamente
        bindAction('[data-action="limpiar-filtros-areas"]', () => {
            const nombreAreaFilter = document.getElementById('nombre-area-filter');
            const areaSelectFilter = document.getElementById('area-select-filter');
            if (nombreAreaFilter) nombreAreaFilter.value = '';
            if (areaSelectFilter) areaSelectFilter.selectedIndex = 0;
            if (typeof buscarAreas === 'function') buscarAreas();
        });
    } catch (e) { console.warn('Could not bind sidebar direct actions', e); }
    
    // Event listener para el botón de guardar usuario
    const btnGuardarUsuario = document.getElementById('btn-guardar-usuario');
    if (btnGuardarUsuario) {
            btnGuardarUsuario.addEventListener('click', function(e) {
                e.preventDefault();
            
            const form = document.getElementById('form-usuario');
                if (!form) {
                console.warn('Formulario de usuario no encontrado en esta página');
                return;
            }
            
            const formData = new FormData(form);
            const userData = Object.fromEntries(formData);
            
            // Limpiar errores previos
            document.getElementById('confirm-password').classList.remove('is-invalid');
            document.getElementById('numero_nomina').classList.remove('is-invalid');
            
            // Validaciones específicas
            let isValid = true;
            
            // Validar contraseña si es nuevo usuario
            if (!usuarioEditando) {
                if (!userData.password) {
                    mostrarToast('La contraseña es requerida para nuevos usuarios', 'error');
                    document.getElementById('password').classList.add('is-invalid');
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
        console.warn('Botón guardar usuario no encontrado en esta página');
    }
    
    // Event listener para el botón de guardar área
    const btnGuardarArea = document.getElementById('btn-guardar-area');
    if (btnGuardarArea) {
            btnGuardarArea.addEventListener('click', function(e) {
            e.preventDefault();
            
            const form = document.getElementById('form-area');
            if (!form) {
                console.warn('form-area not found on btn click');
                return;
            }
                if (form.checkValidity()) {
                const formData = new FormData(form);
                const areaData = Object.fromEntries(formData);
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
            e.preventDefault();
            const form = this;
            if (form.checkValidity()) {
                const formData = new FormData(form);
                const areaData = Object.fromEntries(formData);
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
            // Agregar requisitos de contraseña
            agregarRequisitoContraseña();
            
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
                    // Mostrar badge de 'Perfil propio' si corresponde y deshabilitar cambio de rol
                    try {
                        const currentId = typeof window !== 'undefined' ? window.__CURRENT_USER_ID__ : null;
                        const badgeEl = document.getElementById('modal-badge-self');
                        const roleSelect = document.getElementById('rol_id');
                        const selfNote = document.getElementById('self-role-note');
                        const isSelf = currentId && String(currentId) === String(id);
                        if (badgeEl) badgeEl.style.display = isSelf ? 'inline-block' : 'none';
                        if (roleSelect) roleSelect.disabled = !!isSelf;
                        if (selfNote) selfNote.style.display = isSelf ? 'block' : 'none';
                    } catch (e) { console.warn('No se pudo evaluar perfil propio', e); }
                } else {
                    // Modo crear
                    abrirModalCrearUsuario();
                    const badgeEl = document.getElementById('modal-badge-self');
                    if (badgeEl) badgeEl.style.display = 'none';
                }
            } catch (err) {
                console.error('Error al inicializar modalUsuarios:', err);
                // Si hay error, asegurar que quede en modo crear
                abrirModalCrearUsuario();
            }
        });
        // Ensure modal resets when hidden so it can be used repeatedly for 'Añadir'
        modalUsuariosEl.addEventListener('hidden.bs.modal', function(event) {
            try {
                // Reset state variables and form
                usuarioEditando = null;
                limpiarFormularioUsuario();

                // Ensure role select and modal badge/note are reset
                const roleSelect = document.getElementById('rol_id');
                if (roleSelect) roleSelect.disabled = false;
                const badgeEl = document.getElementById('modal-badge-self');
                if (badgeEl) badgeEl.style.display = 'none';
                const selfNote = document.getElementById('self-role-note');
                if (selfNote) selfNote.style.display = 'none';
            } catch (e) {
                console.warn('Error resetting modal on hide:', e);
            }
        });
    }

    // ==================== VALIDACIÓN EN TIEMPO REAL DE CONTRASEÑA ====================
    // Función para validar contraseña
    function validarContraseña() {
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm-password');
        const passwordFeedback = passwordInput.nextElementSibling;
        const confirmPasswordFeedback = confirmPasswordInput.nextElementSibling;
        
        let passwordError = '';
        let confirmPasswordError = '';
        
        // Limpiar clases de error inicialmente
        passwordInput.classList.remove('is-invalid');
        confirmPasswordInput.classList.remove('is-invalid');
        
        // Validar campo de contraseña
        if (passwordInput.value === '') {
            passwordError = 'La contraseña es requerida.';
            passwordInput.classList.add('is-invalid');
        } else if (passwordInput.value.length < 6) {
            passwordError = 'La contraseña debe tener al menos 6 caracteres.';
            passwordInput.classList.add('is-invalid');
        } else {
            passwordInput.classList.remove('is-invalid');
            passwordInput.classList.add('is-valid');
            passwordError = '✓ Contraseña válida.';
        }
        
        // Actualizar mensaje de password
        if (passwordFeedback) {
            passwordFeedback.textContent = passwordError;
            if (passwordInput.value && passwordInput.value.length >= 6) {
                passwordFeedback.style.color = '#28a745';
            } else {
                passwordFeedback.style.color = '#dc3545';
            }
        }
        
        // Validar campo de confirmar contraseña solo si confirmPasswordRow está visible
        const confirmPasswordRow = document.getElementById('confirm-password-row');
        if (confirmPasswordRow && confirmPasswordRow.style.display !== 'none') {
            if (confirmPasswordInput.value === '') {
                confirmPasswordError = 'Debe confirmar la contraseña.';
                confirmPasswordInput.classList.add('is-invalid');
            } else if (passwordInput.value !== confirmPasswordInput.value) {
                confirmPasswordError = 'Las contraseñas no coinciden.';
                confirmPasswordInput.classList.add('is-invalid');
            } else {
                confirmPasswordInput.classList.remove('is-invalid');
                confirmPasswordInput.classList.add('is-valid');
                confirmPasswordError = '✓ Las contraseñas coinciden.';
            }
            
            // Actualizar mensaje de confirm password
            if (confirmPasswordFeedback) {
                confirmPasswordFeedback.textContent = confirmPasswordError;
                if (confirmPasswordInput.value && passwordInput.value === confirmPasswordInput.value) {
                    confirmPasswordFeedback.style.color = '#28a745';
                } else {
                    confirmPasswordFeedback.style.color = '#dc3545';
                }
            }
        }
    }
    
    // ==================== VALIDACIÓN EN TIEMPO REAL DE TODOS LOS CAMPOS ====================
    function validarCampo(input) {
        const feedbackEl = input.nextElementSibling;
        let esValido = false;
        let mensaje = '';
        
        if (!input.value || !input.value.trim()) {
            if (input.type === 'email') {
                mensaje = 'El correo electrónico es requerido.';
            } else if (input.name === 'numero_nomina') {
                mensaje = 'El número de nómina es requerido.';
            } else if (input.name === 'username') {
                mensaje = 'El usuario es requerido.';
            } else if (input.name === 'nombre') {
                mensaje = 'El nombre es requerido.';
            } else if (input.name === 'apellido') {
                mensaje = 'El apellido es requerido.';
            } else {
                mensaje = 'Este campo es requerido.';
            }
            input.classList.remove('is-valid');
            input.classList.add('is-invalid');
        } else if (input.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.value)) {
                mensaje = 'El correo electrónico no es válido.';
                input.classList.remove('is-valid');
                input.classList.add('is-invalid');
            } else {
                mensaje = '✓ Correo válido.';
                input.classList.remove('is-invalid');
                input.classList.add('is-valid');
                esValido = true;
            }
        } else {
            mensaje = '✓ ' + (input.name === 'username' ? 'Usuario' : input.name === 'numero_nomina' ? 'Número de nómina' : 'Campo') + ' válido.';
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
            esValido = true;
        }
        
        // Actualizar feedback
        if (feedbackEl && feedbackEl.classList && feedbackEl.classList.contains('invalid-feedback')) {
            feedbackEl.textContent = mensaje;
            feedbackEl.style.color = esValido ? '#28a745' : '#dc3545';
        }
    }
    
    function validarSelect(select) {
        if (!select.value || select.value === '') {
            select.classList.remove('is-valid');
            select.classList.add('is-invalid');
        } else {
            select.classList.remove('is-invalid');
            select.classList.add('is-valid');
        }
    }
    
    function agregarRequisitoContraseña() {
        const passwordInput = document.getElementById('password');
        if (!passwordInput) return;
        
        // Buscar o crear contenedor de requisitos
        let requisitosContainer = document.getElementById('password-requirements');
        if (!requisitosContainer) {
            requisitosContainer = document.createElement('div');
            requisitosContainer.id = 'password-requirements';
            requisitosContainer.className = 'form-text';
            requisitosContainer.style.marginTop = '6px';
            requisitosContainer.style.color = '#666';
            requisitosContainer.innerHTML = `
                <div style="margin-top: 8px; font-size: 0.875rem;">
                    <strong>Requerimientos de contraseña:</strong><br>
                    <span id="req-length" style="display: block; color: #dc3545;">• Mínimo 6 caracteres</span>
                </div>
            `;
            
            // Insertar después del invalid-feedback
            const invalidFeedback = passwordInput.parentElement.querySelector('.invalid-feedback');
            if (invalidFeedback) {
                invalidFeedback.parentElement.insertBefore(requisitosContainer, invalidFeedback.nextSibling);
            } else {
                passwordInput.parentElement.appendChild(requisitosContainer);
            }
            
            // Actualizar estado de requisitos mientras se escribe
            passwordInput.addEventListener('input', function() {
                const reqLength = document.getElementById('req-length');
                if (this.value.length >= 6) {
                    reqLength.style.color = '#28a745';
                } else {
                    reqLength.style.color = '#dc3545';
                }
            });
        }
    }
    
    // Agregar listeners para validación en tiempo real de todos los campos
    const camposRequeridos = ['username', 'numero_nomina', 'nombre', 'apellido', 'email', 'telefono'];
    camposRequeridos.forEach(campoId => {
        const input = document.getElementById(campoId);
        if (input) {
            input.addEventListener('input', function() { validarCampo(this); });
            input.addEventListener('change', function() { validarCampo(this); });
            input.addEventListener('blur', function() { validarCampo(this); });
        }
    });
    
    // Validar selects
    ['area_id', 'rol_id'].forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.addEventListener('change', function() { validarSelect(this); });
        }
    });
    
    // Agregar listeners para validación en tiempo real de contraseña
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', validarContraseña);
        passwordInput.addEventListener('change', validarContraseña);
        passwordInput.addEventListener('blur', validarContraseña);
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validarContraseña);
        confirmPasswordInput.addEventListener('change', validarContraseña);
        confirmPasswordInput.addEventListener('blur', validarContraseña);
    }

    // Asegurar que los botones 'Añadir' abran el modal programáticamente (fallback si data-bs falla)
    try {
        // Support both add-user and add-area buttons (some views use different class names)
        const addButtons = document.querySelectorAll('.btn-anadir-usuario, .btn-anadir-area');
        addButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                try {
                    e.preventDefault();
                    // Decide which modal to open based on button role
                    if (btn.classList.contains('btn-anadir-area')) {
                        abrirModalCrearArea();
                        const modalEl = document.getElementById('modalAreas');
                        if (modalEl) {
                            const bsModal = new bootstrap.Modal(modalEl);
                            bsModal.show();
                        }
                    } else {
                        // default -> crear usuario
                        abrirModalCrearUsuario();
                        const modalEl = document.getElementById('modalUsuarios');
                        if (modalEl) {
                            const bsModal = new bootstrap.Modal(modalEl);
                            bsModal.show();
                        }
                    }
                } catch (err) { console.warn('Error opening add modal programmatically', err); }
            });
        });
    } catch (err) {
        console.warn('Error attaching add button handlers', err);
    }

    // Botón de refrescar lista de usuarios (encabezado de la tabla)
    const btnRefrescar = document.getElementById('btn-refrescar-usuarios');
    if (btnRefrescar) {
        btnRefrescar.addEventListener('click', async function (e) {
            e.preventDefault();
            try {
                btnRefrescar.disabled = true;
                const original = btnRefrescar.innerHTML;
                btnRefrescar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
                await buscarUsuarios();
                mostrarToast('Lista de usuarios actualizada', 'success');
                btnRefrescar.innerHTML = original;
                } catch (err) {
                console.warn('Error al refrescar usuarios:', err);
                mostrarToast('Error al refrescar la lista', 'danger');
            } finally {
                btnRefrescar.disabled = false;
            }
        });
    }

    // Botón de refrescar lista de áreas
    const btnRefrescarAreas = document.getElementById('btn-refrescar-areas');
    if (btnRefrescarAreas) {
        btnRefrescarAreas.addEventListener('click', async function (e) {
            e.preventDefault();
            try {
                btnRefrescarAreas.disabled = true;
                const original = btnRefrescarAreas.innerHTML;
                btnRefrescarAreas.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
                await buscarAreas();
                mostrarToast('Lista de áreas actualizada', 'success');
                btnRefrescarAreas.innerHTML = original;
                } catch (err) {
                console.warn('Error al refrescar áreas:', err);
                mostrarToast('Error al refrescar la lista', 'danger');
            } finally {
                btnRefrescarAreas.disabled = false;
            }
        });
    }

    // Botón de refrescar lista de informes
    const btnRefrescarInformes = document.getElementById('btn-refrescar-informes');
    if (btnRefrescarInformes) {
        btnRefrescarInformes.addEventListener('click', async function (e) {
            e.preventDefault();
            try {
                btnRefrescarInformes.disabled = true;
                const original = btnRefrescarInformes.innerHTML;
                btnRefrescarInformes.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
                await buscarInformes();
                mostrarToast('Lista de informes actualizada', 'success');
                btnRefrescarInformes.innerHTML = original;
                } catch (err) {
                console.warn('Error al refrescar informes:', err);
                mostrarToast('Error al refrescar la lista', 'danger');
            } finally {
                btnRefrescarInformes.disabled = false;
            }
        });
    }

    // Botón de refrescar lista de historial
    const btnRefrescarHistorial = document.getElementById('btn-refrescar-historial');
    if (btnRefrescarHistorial) {
        btnRefrescarHistorial.addEventListener('click', async function (e) {
            e.preventDefault();
            try {
                btnRefrescarHistorial.disabled = true;
                const original = btnRefrescarHistorial.innerHTML;
                btnRefrescarHistorial.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
                await cargarHistorial();
                mostrarToast('Historial actualizado', 'success');
                btnRefrescarHistorial.innerHTML = original;
                } catch (err) {
                console.warn('Error al refrescar historial:', err);
                mostrarToast('Error al refrescar la lista', 'danger');
            } finally {
                btnRefrescarHistorial.disabled = false;
            }
        });
    }

    // Fallback helper expuesto en window para diagnóstico rápido desde el HTML
    window.__fallbackGuardarArea = function(btn) {
        try {
            if (window && window.__DEBUG__) console.debug('DEBUG: __fallbackGuardarArea called', { btn });
            const form = document.getElementById('form-area');
            if (!form) return console.error('form-area not found in fallback');
            // trigger submit programmatically
            form.dispatchEvent(new Event('submit', { cancelable: true }));
        } catch (err) {
            console.warn('DEBUG: fallback error', err);
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
    
    // Event listeners delegados para botones de áreas y usuarios
    document.addEventListener('click', function(e) {
        // Support for data-action attributes (delegated actions from layouts)
        const actionEl = e.target.closest && e.target.closest('[data-action]');
        if (actionEl) {
            const action = actionEl.dataset.action;
            try {
                switch (action) {
                    case 'logout':
                        e.preventDefault();
                        cerrarSesion();
                        break;
                    case 'buscar-usuarios':
                        e.preventDefault();
                        if (typeof buscarUsuarios === 'function') buscarUsuarios();
                        break;
                    case 'buscar-areas':
                        e.preventDefault();
                        if (typeof buscarAreas === 'function') buscarAreas();
                        break;
                    case 'buscar-informes':
                        e.preventDefault();
                        console.log('🔍 Evento buscar-informes disparado');
                        if (typeof buscarInformes === 'function') {
                            console.log('✅ Llamando buscarInformes()');
                            buscarInformes();
                        } else {
                            console.error('❌ buscarInformes no es una función');
                        }
                        break;
                    case 'buscar-historial':
                        e.preventDefault();
                        // Capturista layout may define buscarHistorial; fallback to buscarInformes
                        if (typeof window.buscarHistorial === 'function') window.buscarHistorial();
                        else if (typeof buscarInformes === 'function') buscarInformes();
                        break;
                    case 'limpiar-filtros':
                        e.preventDefault();
                        // Clear inputs/selects in the nearest form/filters container
                        const container = actionEl.closest('form') || actionEl.closest('.filters') || document;
                        container.querySelectorAll('input, select, textarea').forEach(inp => {
                            try {
                                if (inp.type === 'checkbox' || inp.type === 'radio') inp.checked = false;
                                else inp.value = '';
                                if (inp.tagName === 'SELECT') inp.selectedIndex = 0;
                            } catch (ee) {}
                        });
                        // Trigger appropriate search based on current visible table
                        if (document.getElementById('usuarios-tbody') && typeof buscarUsuarios === 'function') buscarUsuarios();
                        else if (document.getElementById('areas-tbody') && typeof buscarAreas === 'function') buscarAreas();
                        else if (document.getElementById('informes-tbody') && typeof buscarInformes === 'function') buscarInformes();
                        else if (typeof buscarUsuarios === 'function') buscarUsuarios();
                        break;
                    case 'limpiar-filtros-areas':
                        e.preventDefault();
                        // Limpiar específicamente los filtros de áreas
                        const nombreAreaFilter = document.getElementById('nombre-area-filter');
                        const areaSelectFilter = document.getElementById('area-select-filter');
                        if (nombreAreaFilter) nombreAreaFilter.value = '';
                        if (areaSelectFilter) areaSelectFilter.selectedIndex = 0;
                        if (typeof buscarAreas === 'function') buscarAreas();
                        break;
                    case 'limpiar-filtros-informes':
                        e.preventDefault();
                        // Limpiar específicamente los filtros de informes
                        const areaFilterInformes = document.getElementById('area-filter-informes');
                        const fechaDesdeInformes = document.getElementById('fecha-desde-informes');
                        const fechaHastaInformes = document.getElementById('fecha-hasta-informes');
                        
                        if (areaFilterInformes) areaFilterInformes.selectedIndex = 0;
                        if (fechaDesdeInformes) fechaDesdeInformes.value = '';
                        if (fechaHastaInformes) fechaHastaInformes.value = '';
                        
                        if (typeof buscarInformes === 'function') buscarInformes();
                        break;
                    default:
                        // Unknown action — ignore here (other handlers may exist)
                        break;
                }
            } catch (errAction) {
                console.warn('Error handling data-action', action, errAction);
            }
            return;
        }
        // Botones de editar área
        if (e.target.classList.contains('btn-editar-area')) {
            const areaId = e.target.dataset.areaId;
            const areaNombre = e.target.dataset.areaNombre;
            const areaDescripcion = e.target.dataset.areaDescripcion;
            editarArea(areaId, areaNombre, areaDescripcion);
            return;
        }

        // Botones de eliminar área
        if (e.target.classList.contains('btn-eliminar-area')) {
            const areaId = e.target.dataset.areaId;
            const areaNombre = e.target.dataset.areaNombre;
            eliminarArea(areaId, areaNombre);
            return;
        }

        // Botones de eliminar usuario (delegación para los botones en la tabla renderizada server-side)
        const eliminarUsuarioBtn = e.target.closest && e.target.closest('.btn-eliminar-usuario');
        if (eliminarUsuarioBtn) {
            e.preventDefault();
            const userId = eliminarUsuarioBtn.dataset.userId || eliminarUsuarioBtn.getAttribute('data-user-id');
            // Preferir data-user-name, si no existe intentar componer desde dataset
            const userName = eliminarUsuarioBtn.dataset.userName || eliminarUsuarioBtn.getAttribute('data-user-name') || `${eliminarUsuarioBtn.dataset.username || ''}`.trim();
            if (userId) {
                try {
                    eliminarUsuario(userId, userName || '');
                } catch (err) {
                    console.error('Error al intentar eliminar usuario desde handler delegado:', err);
                }
            }
            return;
        }

        // Botón para ver un informe (delegado)
        const verInformeBtn = e.target.closest && e.target.closest('.btn-ver-informe');
        if (verInformeBtn) {
            e.preventDefault();
            const informeId = verInformeBtn.dataset.informeId || verInformeBtn.getAttribute('data-informe-id');
            if (informeId) {
                try {
                    // Llamar a la función que carga el informe en el modal
                    verInforme(informeId);
                } catch (err) {
                    console.error('Error al abrir informe desde handler delegado:', err);
                }
            }
            return;
        }
    });

    // Inicializar búsqueda de informes si estamos en la página de Ver Informes
    if (document.getElementById('informes-tbody') && typeof buscarInformes === 'function') {
        buscarInformes();
    }

    // Inicializar búsqueda del historial si estamos en la página de Historial
    if (document.getElementById('historial-tbody') && typeof cargarHistorial === 'function') {
        cargarHistorial();
    }

    // Table sizing is handled by CSS (approx. 5 visible rows).
});

// --- Compatibility wrappers used by layouts (keeps old helper names available) ---
window.buscarHistorial = async function() {
    try {
        // Cargar historial de informes del usuario actual
        if (document.getElementById('historial-tbody')) {
            console.log('🔍 Cargando historial de informes...');
            
            // Usar la nueva función cargarHistorial que obtiene datos de /api/historial
            await cargarHistorial();
        } else if (typeof buscarInformes === 'function') {
            await buscarInformes();
        }
    } catch (e) {
        console.error('buscarHistorial error', e);
        mostrarToast('Error al buscar historial', 'danger');
    }
};

// Small convenience wrappers to preserve old layout helpers
window.mostrarCambiosGuardados = function(){ mostrarToast('Cambios guardados exitosamente', 'success'); };
window.mostrarCambiosCancelados = function(){ mostrarToast('Cambios cancelados', 'warning'); };
window.mostrarElementoEliminado = function(el = 'Elemento'){ mostrarToast(`${el} eliminado exitosamente`, 'success'); };
window.mostrarUsuarioEliminado = function(){ window.mostrarElementoEliminado('Usuario'); };
window.mostrarAreaEliminada = function(){ window.mostrarElementoEliminado('Área'); };
window.mostrarInformeRevisado = function(){ mostrarToast('Informe revisado exitosamente', 'success'); };
window.mostrarInformeEliminado = function(){ window.mostrarElementoEliminado('Informe'); };
/**
 * Descargar un informe como PDF
 * @param {string} informeId - ID del informe a descargar
 */
window.descargarInforme = function(informeId) {
  if (!informeId) {
    mostrarToast('ID de informe no válido', 'error');
    return;
  }

  // Mostrar toast de carga
  mostrarToast('Generando PDF...', 'info');
  
  // Crear un formulario temporal para descargar el PDF
  const form = document.createElement('form');
  form.method = 'GET';
  form.action = `/api/informes/${informeId}/descargar`;
  
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
  
  // Mostrar toast de éxito después de un segundo
  setTimeout(() => {
    mostrarToast('Descarga iniciada', 'success');
  }, 1000);
};

// Backward compatibility alias
window.mostrarDescargaIniciada = function(){ mostrarToast('Descarga iniciada', 'info'); };
window.mostrarInformeVisto = function(){ mostrarToast('Informe visualizado', 'info'); };
window.mostrarInformeBorrador = function(){ mostrarToast('Informe guardado como borrador', 'success'); };
window.mostrarInformeEnviado = function(){ mostrarToast('Informe enviado para revisión', 'success'); };
