// Función para mostrar la tostada de usuario eliminado
function mostrarToastUsuarioEliminado() {
    var toastEliminado = document.getElementById('toastUsuarioEliminado');
    if (!toastEliminado) return;
    toastEliminado.style.display = 'block';
    var bsToast = bootstrap.Toast.getOrCreateInstance(toastEliminado);
    bsToast.show();
    toastEliminado.addEventListener('hidden.bs.toast', function () {
        toastEliminado.style.display = 'none';
    }, { once: true });
}

// Función para mostrar la tostada de cambios guardados
function mostrarToastCambiosGuardadosUsuario() {
    var toastGuardados = document.getElementById('toastCambiosGuardadosUsuario');
    if (!toastGuardados) return;
    toastGuardados.style.display = 'block';
    var bsToast = bootstrap.Toast.getOrCreateInstance(toastGuardados);
    bsToast.show();
    toastGuardados.addEventListener('hidden.bs.toast', function () {
        toastGuardados.style.display = 'none';
    }, { once: true });
}

// Evento para el botón Guardar del modal ModalUsuarios
window.addEventListener('DOMContentLoaded', function() {
    var btnGuardar = document.getElementById('btnGuardarUsuario');
    var modal = document.getElementById('modalUsuarios');
    if (btnGuardar && modal) {
        btnGuardar.addEventListener('click', function() {
            var bsModal = bootstrap.Modal.getOrCreateInstance(modal);
            bsModal.hide();
            setTimeout(mostrarToastCambiosGuardadosUsuario, 300);
        });
    }
});
