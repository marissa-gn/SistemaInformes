// Función para mostrar la tostada de área eliminada
function mostrarToastAreaEliminada() {
    var toastEliminada = document.getElementById('toastAreaEliminada');
    if (!toastEliminada) return;
    toastEliminada.style.display = 'block';
    var bsToast = bootstrap.Toast.getOrCreateInstance(toastEliminada);
    bsToast.show();
    toastEliminada.addEventListener('hidden.bs.toast', function () {
        toastEliminada.style.display = 'none';
    }, { once: true });
}

// Función para mostrar la tostada de cambios guardados
function mostrarToastCambiosGuardados() {
    var toastGuardados = document.getElementById('toastCambiosGuardados');
    if (!toastGuardados) return;
    toastGuardados.style.display = 'block';
    var bsToast = bootstrap.Toast.getOrCreateInstance(toastGuardados);
    bsToast.show();
    toastGuardados.addEventListener('hidden.bs.toast', function () {
        toastGuardados.style.display = 'none';
    }, { once: true });
}

// Evento para el botón Guardar del modal ModalAreas
window.addEventListener('DOMContentLoaded', function() {
    var btnGuardar = document.getElementById('btnGuardarArea');
    var modal = document.getElementById('modalAreas');
    if (btnGuardar && modal) {
        btnGuardar.addEventListener('click', function() {
            var bsModal = bootstrap.Modal.getOrCreateInstance(modal);
            bsModal.hide();
            setTimeout(mostrarToastCambiosGuardados, 300);
        });
    }
});
