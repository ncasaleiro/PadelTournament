const User = require('./models/User');

function validateDefaultUsers() {
    console.log('🔍 Validação de Utilizadores Padrão\n');
    console.log('='.repeat(50));
    
    let allValid = true;
    
    // Validar Admin
    console.log('\n📋 Validando Admin:');
    const admin = User.getByUsername('admin');
    if (!admin) {
        console.log('❌ Admin não encontrado na base de dados');
        allValid = false;
    } else {
        console.log('✅ Admin encontrado:', { user_id: admin.user_id, username: admin.username, role: admin.role });
        
        // Testar autenticação
        const adminAuth = User.authenticate('admin', 'admin123');
        if (!adminAuth) {
            console.log('❌ Autenticação do admin falhou (password incorreta)');
            allValid = false;
        } else {
            console.log('✅ Autenticação do admin bem-sucedida');
            console.log('   Dados:', { user_id: adminAuth.user_id, username: adminAuth.username, role: adminAuth.role });
        }
    }
    
    // Validar Referee
    console.log('\n📋 Validando Referee:');
    const referee = User.getByUsername('referee');
    if (!referee) {
        console.log('❌ Referee não encontrado na base de dados');
        allValid = false;
    } else {
        console.log('✅ Referee encontrado:', { user_id: referee.user_id, username: referee.username, role: referee.role });
        
        // Testar autenticação
        const refereeAuth = User.authenticate('referee', 'referee123');
        if (!refereeAuth) {
            console.log('❌ Autenticação do referee falhou (password incorreta)');
            allValid = false;
        } else {
            console.log('✅ Autenticação do referee bem-sucedida');
            console.log('   Dados:', { user_id: refereeAuth.user_id, username: refereeAuth.username, role: refereeAuth.role });
        }
    }
    
    // Resumo
    console.log('\n' + '='.repeat(50));
    if (allValid) {
        console.log('\n✅ VALIDAÇÃO CONCLUÍDA: Todos os utilizadores padrão estão corretos!');
        console.log('\n📋 Credenciais válidas:');
        console.log('   👤 Admin:   username=admin, password=admin123');
        console.log('   👤 Referee: username=referee, password=referee123');
    } else {
        console.log('\n❌ VALIDAÇÃO FALHOU: Alguns utilizadores têm problemas!');
        console.log('   Execute: npm run create-admin');
    }
    console.log('='.repeat(50) + '\n');
    
    return allValid;
}

// Executar se chamado diretamente
if (require.main === module) {
    const isValid = validateDefaultUsers();
    process.exit(isValid ? 0 : 1);
}

module.exports = { validateDefaultUsers };
















