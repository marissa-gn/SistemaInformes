const bcrypt = require('bcryptjs');

async function verifyPassword() {
    const hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    const password = 'admin123';
    
    console.log('🔍 VERIFICANDO HASH DE BCRYPT\n');
    console.log(`Hash: ${hash}`);
    console.log(`Contraseña a verificar: "${password}"`);
    
    try {
        const isValid = await bcrypt.compare(password, hash);
        console.log(`\n¿La contraseña "${password}" coincide? ${isValid ? '✅ SÍ' : '❌ NO'}`);
        
        if (isValid) {
            console.log('\n🎉 ¡CONFIRMADO! La contraseña original es "admin123"');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

verifyPassword();