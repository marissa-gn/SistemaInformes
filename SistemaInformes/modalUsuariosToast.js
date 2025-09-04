// Funciones para mostrar/ocultar toasts y manejar el modal de Usuarios
function mostrarToastUsuarioEliminado() {
    const toast = document.getElementById('toastUsuarioEliminado');
    if (toast) {
        toast.style.display = 'block';
        const bsToast = bootstrap.Toast.getOrCreateInstance(toast);
        bsToast.show();
        toast.addEventListener('hidden.bs.toast', function () {
            toast.style.display = 'none';
        });
    }
}

function mostrarToastCambiosGuardadosUsuario() {
    const toast = document.getElementById('toastCambiosGuardadosUsuario');
    if (toast) {
        toast.style.display = 'block';
        const bsToast = bootstrap.Toast.getOrCreateInstance(toast);
        bsToast.show();
        toast.addEventListener('hidden.bs.toast', function () {
            toast.style.display = 'none';
        });
    }
}

// Guardar usuario desde el modal
window.addEventListener('DOMContentLoaded', function() {
    const btnGuardar = document.getElementById('btnGuardarUsuario');
    const passwordInput = document.getElementById('inputPassword5');
    const verificarPasswordInput = document.getElementById('verificarPasswordUsuario');
    // Comparación en tiempo real de contraseñas
    if (passwordInput && verificarPasswordInput) {
        const verificarPasswordHelpBlock = document.getElementById('verificarPasswordHelpBlock');
        function compararPasswords() {
            if (verificarPasswordInput.value === '') {
                verificarPasswordHelpBlock.textContent = 'Repite la contraseña para verificar que coincidan.';
                verificarPasswordHelpBlock.style.color = '';
                return;
            }
            if (passwordInput.value !== verificarPasswordInput.value) {
                verificarPasswordHelpBlock.textContent = 'Las contraseñas no coinciden.';
                verificarPasswordHelpBlock.style.color = 'red';
            } else {
                verificarPasswordHelpBlock.textContent = 'Las contraseñas coinciden.';
                verificarPasswordHelpBlock.style.color = 'green';
            }
        }
        passwordInput.addEventListener('input', compararPasswords);
        verificarPasswordInput.addEventListener('input', compararPasswords);
    }
    if (btnGuardar) {
        btnGuardar.addEventListener('click', function() {
            // Validación de contraseña
            const password = passwordInput?.value || '';
            const verificarPassword = verificarPasswordInput?.value || '';
            const passwordHelpBlock = document.getElementById('passwordHelpBlock');
            const verificarPasswordHelpBlock = document.getElementById('verificarPasswordHelpBlock');
            let valid = true;
            // Reglas: 8-20 caracteres, letras y números, sin espacios ni especiales ni emoji
            const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/;
            if (!regex.test(password)) {
                passwordHelpBlock.textContent = 'La contraseña debe tener entre 8 y 20 caracteres, incluir letras y números, sin espacios ni caracteres especiales.';
                passwordHelpBlock.style.color = 'red';
                valid = false;
            } else {
                passwordHelpBlock.textContent = 'Your password must be 8-20 characters long, contain letters and numbers, and must not contain spaces, special characters, or emoji.';
                passwordHelpBlock.style.color = '';
            }
            if (password !== verificarPassword) {
                verificarPasswordHelpBlock.textContent = 'Las contraseñas no coinciden.';
                verificarPasswordHelpBlock.style.color = 'red';
                valid = false;
            } else {
                verificarPasswordHelpBlock.textContent = 'Repite la contraseña para verificar que coincidan.';
                verificarPasswordHelpBlock.style.color = '';
            }
            if (!valid) return;
            const modal = document.getElementById('modalUsuarios');
            const bsModal = bootstrap.Modal.getOrCreateInstance(modal);
            bsModal.hide();
            mostrarToastCambiosGuardadosUsuario();
        });
    }
});
