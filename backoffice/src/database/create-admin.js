const User = require('./models/User');

function createInitialUsers() {
    console.log('🔧 Verificando utilizadores padrão...\n');
    
    try {
        // Verificar/Criar Admin
        let admin = User.getByUsername('admin');
        if (!admin) {
            console.log('📝 Criando utilizador admin...');
            admin = User.create('admin', 'admin123', 'admin');
            console.log('✅ Admin criado:', { user_id: admin.user_id, username: admin.username, role: admin.role });
        } else {
            // Verificar se a password está correta
            const authResult = User.authenticate('admin', 'admin123');
            if (!authResult) {
                console.log('⚠️  Password do admin incorreta. A atualizar...');
                User.update(admin.user_id, { password: 'admin123' });
                console.log('✅ Password do admin atualizada');
            } else {
                console.log('✅ Admin já existe e password está correta');
            }
            console.log('   Utilizador:', { user_id: admin.user_id, username: admin.username, role: admin.role });
        }
        
        console.log('');
        
        // Verificar/Criar Referee
        let referee = User.getByUsername('referee');
        if (!referee) {
            console.log('📝 Criando utilizador referee...');
            referee = User.create('referee', 'referee123', 'referee');
            console.log('✅ Referee criado:', { user_id: referee.user_id, username: referee.username, role: referee.role });
        } else {
            // Verificar se a password está correta
            const authResult = User.authenticate('referee', 'referee123');
            if (!authResult) {
                console.log('⚠️  Password do referee incorreta. A atualizar...');
                User.update(referee.user_id, { password: 'referee123' });
                console.log('✅ Password do referee atualizada');
            } else {
                console.log('✅ Referee já existe e password está correta');
            }
            console.log('   Utilizador:', { user_id: referee.user_id, username: referee.username, role: referee.role });
        }
        
        console.log('\n✅ Verificação concluída!');
        console.log('\n📋 Credenciais padrão:');
        console.log('   Admin:   username=admin, password=admin123');
        console.log('   Referee: username=referee, password=referee123');
        
    } catch (error) {
        console.error('❌ Erro ao criar utilizadores:', error.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    try {
        createInitialUsers();
        console.log('\n✅ Script concluído com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erro:', error);
        process.exit(1);
    }
}

module.exports = { createInitialUsers };

