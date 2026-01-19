const User = require('./models/User');

function createViewer() {
    console.log('🔧 Verificando utilizador viewer...\n');
    
    try {
        // Verificar/Criar Viewer
        let viewer = User.getByUsername('viewer');
        if (!viewer) {
            console.log('📝 Criando utilizador viewer...');
            viewer = User.create('viewer', 'viewer123', 'viewer');
            console.log('✅ Viewer criado:', { user_id: viewer.user_id, username: viewer.username, role: viewer.role });
        } else {
            // Verificar se a password está correta
            const authResult = User.authenticate('viewer', 'viewer123');
            if (!authResult) {
                console.log('⚠️  Password do viewer incorreta. A atualizar...');
                User.update(viewer.user_id, { password: 'viewer123' });
                console.log('✅ Password do viewer atualizada');
            } else {
                console.log('✅ Viewer já existe e password está correta');
            }
            console.log('   Utilizador:', { user_id: viewer.user_id, username: viewer.username, role: viewer.role });
        }
        
        console.log('\n✅ Verificação concluída!');
        console.log('\n📋 Credenciais viewer:');
        console.log('   Viewer: username=viewer, password=viewer123');
        
    } catch (error) {
        console.error('❌ Erro ao criar viewer:', error.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    try {
        createViewer();
        console.log('\n✅ Script concluído com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erro:', error);
        process.exit(1);
    }
}

module.exports = { createViewer };




