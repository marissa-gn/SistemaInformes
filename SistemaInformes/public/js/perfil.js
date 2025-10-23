// =================== PERFIL.JS - FUNCIONALIDADES DEL PERFIL DE USUARIO ===================

/**
 * Función para mostrar/ocultar contraseñas
 * @param {string} fieldId - ID del campo de contraseña
 */
function togglePassword(fieldId) {
  const passwordInput = document.getElementById(fieldId);
  let iconId;
  
  if (fieldId === 'contrasena-actual') {
    iconId = 'iconoContrasenaActual';
  } else if (fieldId === 'contrasena') {
    iconId = 'iconoContrasena';
  } else if (fieldId === 'confirmar-contrasena') {
    iconId = 'iconoConfirmarContrasena';
  }
  
  const icono = document.getElementById(iconId);
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    icono.classList.remove('bi-eye');
    icono.classList.add('bi-eye-slash');
  } else {
    passwordInput.type = 'password';
    icono.classList.remove('bi-eye-slash');
    icono.classList.add('bi-eye');
  }
}

/**
 * Función para guardar cambios del perfil
 * @param {Event} event - Evento del botón
 */
async function guardarCambios(event) {
  // Guardar posición actual del scroll
  const scrollContainer = document.querySelector('.form-scroll-container');
  const currentScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
  
  // Prevenir comportamiento por defecto
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  // Recopilar datos del formulario
  const nombre = document.getElementById('nombre').value.trim();
  const apellido = document.getElementById('apellidos').value.trim();
  const correo = document.getElementById('correo').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const area_id = document.getElementById('area').value;
  const rol_id = document.getElementById('rol').value;
  const password = document.getElementById('contrasena').value.trim();
  const confirmarPassword = document.getElementById('confirmar-contrasena').value.trim();

  // Validar campos requeridos
  if (!nombre || !apellido || !correo || !area_id || !rol_id) {
    mostrarToastManual('Por favor completa todos los campos obligatorios', 'warning');
    // Restaurar posición del scroll
    if (scrollContainer) {
      scrollContainer.scrollTop = currentScrollTop;
    }
    return false;
  }

  // Validar contraseñas si se proporcionan
  if (password || confirmarPassword) {
    if (!password && confirmarPassword) {
      mostrarToastManual('Si quieres cambiar tu contraseña, debes ingresar la nueva contraseña', 'warning');
      // Restaurar posición del scroll
      if (scrollContainer) {
        scrollContainer.scrollTop = currentScrollTop;
      }
      return false;
    }

    if (password && !confirmarPassword) {
      mostrarToastManual('Debes confirmar tu nueva contraseña', 'warning');
      // Restaurar posición del scroll
      if (scrollContainer) {
        scrollContainer.scrollTop = currentScrollTop;
      }
      return false;
    }

    if (password !== confirmarPassword) {
      mostrarToastManual('Las nuevas contraseñas no coinciden', 'warning');
      // Restaurar posición del scroll
      if (scrollContainer) {
        scrollContainer.scrollTop = currentScrollTop;
      }
      return false;
    }

    if (password.length < 6) {
      mostrarToastManual('La nueva contraseña debe tener al menos 6 caracteres', 'warning');
      // Restaurar posición del scroll
      if (scrollContainer) {
        scrollContainer.scrollTop = currentScrollTop;
      }
      return false;
    }
  }

  // Validar formato de correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo)) {
    mostrarToastManual('Por favor ingresa un correo válido', 'warning');
    // Restaurar posición del scroll
    if (scrollContainer) {
      scrollContainer.scrollTop = currentScrollTop;
    }
    return false;
  }

  try {
    // Mostrar indicador de carga
    const btnGuardar = document.getElementById('btn-guardar');
    const originalText = btnGuardar.innerHTML;
    btnGuardar.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Guardando...';
    btnGuardar.disabled = true;

    // Preparar datos para enviar
    const datos = {
      nombre,
      apellido,
      email: correo,
      telefono,
      area_id: parseInt(area_id),
      rol_id: parseInt(rol_id)
    };

    // Solo incluir contraseña si se proporciona
    if (password) {
      datos.password = password;
    }

    // Enviar datos al servidor
    const response = await fetch('/api/perfil', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datos)
    });

    const result = await response.json();

    if (result.success) {
      // Actualizar la información mostrada
      const nombreCompleto = `${nombre} ${apellido.split(' ')[0]}`;
      const elementoNombre = document.querySelector('h5[style*="color: #a12424"]');
      if (elementoNombre) {
        elementoNombre.textContent = nombreCompleto;
      }

      // Limpiar campos de contraseña
      document.getElementById('contrasena').value = '';
      document.getElementById('confirmar-contrasena').value = '';

      mostrarToastManual('Perfil actualizado exitosamente', 'success');
    } else {
      mostrarToastManual(result.message || 'Error al actualizar el perfil', 'error');
    }

    // Restaurar botón
    btnGuardar.innerHTML = originalText;
    btnGuardar.disabled = false;

  } catch (error) {
    console.error('Error al guardar cambios:', error);
    mostrarToastManual('Error de conexión. Intenta nuevamente', 'error');
    
    // Restaurar botón
    const btnGuardar = document.getElementById('btn-guardar');
    btnGuardar.innerHTML = '<i class="bi bi-check-circle me-2"></i>Guardar Cambios';
    btnGuardar.disabled = false;
  }
  
  // Restaurar posición del scroll
  setTimeout(() => {
    if (scrollContainer) {
      scrollContainer.scrollTop = currentScrollTop;
    }
  }, 10);
  
  return false;
}

/**
 * Función para cancelar edición del perfil
 * @param {Event} event - Evento del botón
 */
async function cancelarEdicion(event) {
  // Guardar posición actual del scroll
  const scrollContainer = document.querySelector('.form-scroll-container');
  const currentScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
  
  // Prevenir comportamiento por defecto
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  try {
    // Recargar datos originales desde el servidor
    const response = await fetch('/api/perfil');
    const result = await response.json();

    if (result.success) {
      const userData = result.data;
      
      // Restaurar valores originales
      document.getElementById('nombre').value = userData.nombre;
      document.getElementById('apellidos').value = userData.apellido;
      document.getElementById('correo').value = userData.email;
      document.getElementById('telefono').value = userData.telefono || '';
      document.getElementById('area').value = userData.area_id || '';
      document.getElementById('rol').value = userData.rol_id || '';
      document.getElementById('contrasena').value = '';
      document.getElementById('confirmar-contrasena').value = '';
      
      mostrarToastManual('Cambios cancelados - datos restaurados', 'info');
    } else {
      mostrarToastManual('Error al restaurar datos originales', 'warning');
    }
  } catch (error) {
    console.error('Error al cancelar:', error);
    // Fallback: limpiar solo las contraseñas
    document.getElementById('contrasena').value = '';
    document.getElementById('confirmar-contrasena').value = '';
    mostrarToastManual('Cambios cancelados', 'warning');
  }
  
  // Restaurar posición del scroll
  setTimeout(() => {
    if (scrollContainer) {
      scrollContainer.scrollTop = currentScrollTop;
    }
  }, 10);
  
  return false;
}

/**
 * Función para mostrar toasts manuales
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de toast (success, error, warning, info)
 */
function mostrarToastManual(mensaje, tipo = 'info') {
  const tipoClasses = {
    success: { bg: 'bg-success', icon: 'bi-check-circle', title: 'Éxito' },
    error: { bg: 'bg-danger', icon: 'bi-x-circle', title: 'Error' },
    warning: { bg: 'bg-warning', icon: 'bi-exclamation-triangle', title: 'Advertencia' },
    info: { bg: 'bg-info', icon: 'bi-info-circle', title: 'Información' }
  };

  const config = tipoClasses[tipo] || tipoClasses.info;

  const toastHtml = `
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 9999;">
      <div class="toast show" role="alert">
        <div class="toast-header ${config.bg} text-white">
          <i class="${config.icon} me-2"></i>
          <strong class="me-auto">${config.title}</strong>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">${mensaje}</div>
      </div>
    </div>
  `;
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = toastHtml;
  document.body.appendChild(tempDiv);
  
  setTimeout(() => {
    if (tempDiv.parentNode) {
      tempDiv.parentNode.removeChild(tempDiv);
    }
  }, 4000);
}

/**
 * Inicialización del perfil cuando se carga el DOM
 */
function initializePerfil() {
  // Prevenir cualquier scroll automático
  window.addEventListener('scroll', function(e) {
    // No hacer nada, solo prevenir comportamientos extraños
  });

  // Botón Guardar
  const btnGuardar = document.getElementById('btn-guardar');
  if (btnGuardar) {
    btnGuardar.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      
      // Bloquear scroll durante la operación
      const body = document.body;
      const scrollContainer = document.querySelector('.form-scroll-container');
      const currentScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
      
      // Ejecutar función
      guardarCambios(event);
      
      // Forzar restauración inmediata
      if (scrollContainer) {
        scrollContainer.scrollTop = currentScrollTop;
      }
      
      return false;
    });
  }

  // Botón Cancelar
  const btnCancelar = document.getElementById('btn-cancelar');
  if (btnCancelar) {
    btnCancelar.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      
      // Bloquear scroll durante la operación
      const scrollContainer = document.querySelector('.form-scroll-container');
      const currentScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
      
      // Ejecutar función
      cancelarEdicion(event);
      
      // Forzar restauración inmediata
      if (scrollContainer) {
        scrollContainer.scrollTop = currentScrollTop;
      }
      
      return false;
    });
  }

  // Prevenir scroll al hacer focus en botones
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('focus', function(event) {
      event.preventDefault();
      // No hacer scroll al focus
      this.blur();
    });
    
    btn.addEventListener('mousedown', function(event) {
      event.preventDefault();
    });
  });

  // Validación en tiempo real para correo electrónico
  const correoInput = document.getElementById('correo');
  if (correoInput) {
    correoInput.addEventListener('input', function() {
      const correo = this.value;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (correo.length > 0 && !emailRegex.test(correo)) {
        this.style.borderColor = '#dc3545';
        this.classList.add('is-invalid');
      } else {
        this.style.borderColor = '';
        this.classList.remove('is-invalid');
      }
    });
  }

  // Validación en tiempo real para contraseñas
  const passwordInput = document.getElementById('contrasena');
  const confirmPasswordInput = document.getElementById('confirmar-contrasena');
  
  if (passwordInput) {
    passwordInput.addEventListener('input', function() {
      const password = this.value;
      const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';
      
      // Validar longitud mínima
      if (password.length > 0 && password.length < 6) {
        this.style.borderColor = '#dc3545';
        this.classList.add('is-invalid');
      } else {
        this.style.borderColor = '';
        this.classList.remove('is-invalid');
      }
      
      // Validar que coincidan si ambos tienen contenido
      if (password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword) {
        confirmPasswordInput.style.borderColor = '#dc3545';
        confirmPasswordInput.classList.add('is-invalid');
      } else if (password === confirmPassword) {
        confirmPasswordInput.style.borderColor = '';
        confirmPasswordInput.classList.remove('is-invalid');
      }
    });
  }
  
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', function() {
      const password = passwordInput ? passwordInput.value : '';
      const confirmPassword = this.value;
      
      // Validar que coincidan
      if (confirmPassword.length > 0 && password !== confirmPassword) {
        this.style.borderColor = '#dc3545';
        this.classList.add('is-invalid');
      } else {
        this.style.borderColor = '';
        this.classList.remove('is-invalid');
      }
    });
  }

  // Validación para campos requeridos
  const camposRequeridos = ['nombre', 'apellidos', 'correo', 'cargo', 'area', 'rol'];
  camposRequeridos.forEach(campo => {
    const input = document.getElementById(campo);
    if (input) {
      input.addEventListener('blur', function() {
        if (!this.value.trim()) {
          this.style.borderColor = '#dc3545';
        } else {
          this.style.borderColor = '';
        }
      });
    }
  });

  // Observar cambios en el DOM que puedan añadir elementos duplicados
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      // Si se añaden nodos que contengan "Inicio", eliminarlos
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) { // Element node
            // Buscar elementos con texto "Inicio" duplicados
            const inicioButtons = node.querySelectorAll ? node.querySelectorAll('*') : [];
            inicioButtons.forEach(el => {
              if (el.textContent && el.textContent.includes('Inicio') && 
                  el.classList && (el.classList.contains('btn-inicio') || el.classList.contains('btn'))) {
                // Si ya existe un botón de inicio en el DOM, eliminar el duplicado
                const existingInicio = document.querySelector('.btn-inicio-flotante, .btn-inicio');
                if (existingInicio && existingInicio !== el) {
                  el.remove();
                }
              }
            });
          }
        });
      }
    });
  });

  // Observar el body completo
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initializePerfil);