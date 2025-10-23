(function(){
    const pwd = document.getElementById('password');
    const btn = document.getElementById('togglePassword');
    const icon = document.getElementById('togglePasswordIcon');
    if (btn && pwd) {
        btn.addEventListener('click', function(e){
            e.preventDefault();
            if (pwd.type === 'password') {
                pwd.type = 'text';
                if (icon) { icon.classList.remove('bi-eye'); icon.classList.add('bi-eye-slash'); }
            } else {
                pwd.type = 'password';
                if (icon) { icon.classList.remove('bi-eye-slash'); icon.classList.add('bi-eye'); }
            }
        });
    }
})();
