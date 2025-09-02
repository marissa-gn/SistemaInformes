// Funciones para mostrar/ocultar toasts y manejar el modal de Áreas
function mostrarToastAreaEliminada() {
    const toast = document.getElementById('toastAreaEliminada');
    if (toast) {
        toast.style.display = 'block';
        const bsToast = bootstrap.Toast.getOrCreateInstance(toast);
        bsToast.show();
        toast.addEventListener('hidden.bs.toast', function () {
            toast.style.display = 'none';
        });
    }
}

function mostrarToastCambiosGuardados() {
    const toast = document.getElementById('toastCambiosGuardados');
    if (toast) {
        toast.style.display = 'block';
        const bsToast = bootstrap.Toast.getOrCreateInstance(toast);
        bsToast.show();
        toast.addEventListener('hidden.bs.toast', function () {
            toast.style.display = 'none';
        });
    }
}

// Guardar área desde el modal
window.addEventListener('DOMContentLoaded', function() {
    const btnGuardar = document.getElementById('btnGuardarArea');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', function() {
            const modal = document.getElementById('modalAreas');
            const bsModal = bootstrap.Modal.getOrCreateInstance(modal);
            bsModal.hide();
            mostrarToastCambiosGuardados();
        });
    }
});
