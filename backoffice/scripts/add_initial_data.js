/**
 * Script para adicionar categorias e equipas iniciais à base de dados
 * v0.03-dev - 2025-12-06
 * 
 * Uso:
 *   node add_initial_data.js          - Adiciona dados (verifica duplicados)
 *   node add_initial_data.js clean     - Apaga todas as categorias e equipas
 *   node add_initial_data.js all       - Adiciona todas as categorias e equipas (ignora duplicados)
 */

const path = require('path');
const Category = require('../src/database/models/Category');
const Team = require('../src/database/models/Team');
const db = require('../src/database/db');

// Categorias a criar
const categories = ['M3', 'M4', 'M5', 'F4', 'F5', 'MX'];

// Equipas para M3 (6 equipas)
const teamsM3 = [
    'Equipa M3 A',
    'Equipa M3 B',
    'Equipa M3 C',
    'Equipa M3 D',
    'Equipa M3 E',
    'Equipa M3 F'
];

// Equipas para M5 (6 equipas)
const teamsM5 = [
    'Equipa M5 A',
    'Equipa M5 B',
    'Equipa M5 C',
    'Equipa M5 D',
    'Equipa M5 E',
    'Equipa M5 F'
];

// Equipas para M4 (6 equipas)
const teamsM4 = [
    'Equipa M4 A',
    'Equipa M4 B',
    'Equipa M4 C',
    'Equipa M4 D',
    'Equipa M4 E',
    'Equipa M4 F'
];

// Equipas para F4 (6 equipas)
const teamsF4 = [
    'Equipa F4 A',
    'Equipa F4 B',
    'Equipa F4 C',
    'Equipa F4 D',
    'Equipa F4 E',
    'Equipa F4 F'
];

// Equipas para F5 (6 equipas)
const teamsF5 = [
    'Equipa F5 A',
    'Equipa F5 B',
    'Equipa F5 C',
    'Equipa F5 D',
    'Equipa F5 E',
    'Equipa F5 F'
];

// Equipas para MX (6 equipas)
const teamsMX = [
    'Equipa MX A',
    'Equipa MX B',
    'Equipa MX C',
    'Equipa MX D',
    'Equipa MX E',
    'Equipa MX F'
];

function cleanDatabase() {
    console.log('🧹 A limpar base de dados (categorias e equipas)...\n');
    
    const data = db.load();
    const initialCategoriesCount = data.categories.length;
    const initialTeamsCount = data.teams.length;
    
    // Apagar todas as equipas primeiro (para evitar referências órfãs)
    console.log('🗑️  A apagar equipas...');
    data.teams = [];
    
    // Apagar todas as categorias
    console.log('🗑️  A apagar categorias...');
    data.categories = [];
    
    db.save(data);
    
    console.log(`\n✅ Base de dados limpa:`);
    console.log(`  - ${initialCategoriesCount} categorias removidas`);
    console.log(`  - ${initialTeamsCount} equipas removidas`);
}

async function addInitialData(forceAll = false) {
    console.log('🚀 A adicionar dados iniciais à base de dados...\n');
    
    // Adicionar categorias
    console.log('📋 A adicionar categorias...');
    const categoryMap = {};
    
    for (const categoryName of categories) {
        try {
            const category = Category.create(categoryName);
            categoryMap[categoryName] = category.category_id;
            console.log(`  ✅ Categoria "${categoryName}" criada (ID: ${category.category_id})`);
        } catch (error) {
            if (error.message.includes('Já existe')) {
                // Categoria já existe, obter ID
                const existing = Category.getAll().find(c => c.name === categoryName);
                if (existing) {
                    categoryMap[categoryName] = existing.category_id;
                    if (forceAll) {
                        console.log(`  ⚠️  Categoria "${categoryName}" já existe (ID: ${existing.category_id}) - ignorada`);
                    } else {
                        console.log(`  ⚠️  Categoria "${categoryName}" já existe (ID: ${existing.category_id})`);
                    }
                }
            } else {
                console.error(`  ❌ Erro ao criar categoria "${categoryName}":`, error.message);
            }
        }
    }
    
    // Adicionar equipas M3 (6 equipas)
    console.log('\n👥 A adicionar equipas M3 (6 equipas)...');
    const m3CategoryId = categoryMap['M3'];
    if (m3CategoryId) {
        let createdCount = 0;
        let skippedCount = 0;
        for (const teamName of teamsM3) {
            try {
                const team = Team.create(teamName, m3CategoryId);
                console.log(`  ✅ Equipa "${teamName}" criada (ID: ${team.team_id})`);
                createdCount++;
            } catch (error) {
                if (error.message.includes('Já existe')) {
                    if (forceAll) {
                        console.log(`  ⚠️  Equipa "${teamName}" já existe - ignorada`);
                    } else {
                        console.log(`  ⚠️  Equipa "${teamName}" já existe`);
                    }
                    skippedCount++;
                } else {
                    console.error(`  ❌ Erro ao criar equipa "${teamName}":`, error.message);
                }
            }
        }
        console.log(`  📊 M3: ${createdCount} criadas, ${skippedCount} já existiam`);
    } else {
        console.error('  ❌ Categoria M3 não encontrada!');
    }
    
    // Adicionar equipas M5 (6 equipas)
    console.log('\n👥 A adicionar equipas M5 (6 equipas)...');
    const m5CategoryId = categoryMap['M5'];
    if (m5CategoryId) {
        let createdCount = 0;
        let skippedCount = 0;
        for (const teamName of teamsM5) {
            try {
                const team = Team.create(teamName, m5CategoryId);
                console.log(`  ✅ Equipa "${teamName}" criada (ID: ${team.team_id})`);
                createdCount++;
            } catch (error) {
                if (error.message.includes('Já existe')) {
                    if (forceAll) {
                        console.log(`  ⚠️  Equipa "${teamName}" já existe - ignorada`);
                    } else {
                        console.log(`  ⚠️  Equipa "${teamName}" já existe`);
                    }
                    skippedCount++;
                } else {
                    console.error(`  ❌ Erro ao criar equipa "${teamName}":`, error.message);
                }
            }
        }
        console.log(`  📊 M5: ${createdCount} criadas, ${skippedCount} já existiam`);
    } else {
        console.error('  ❌ Categoria M5 não encontrada!');
    }
    
    // Adicionar equipas M4 (6 equipas)
    console.log('\n👥 A adicionar equipas M4 (6 equipas)...');
    const m4CategoryId = categoryMap['M4'];
    if (m4CategoryId) {
        let createdCount = 0;
        let skippedCount = 0;
        for (const teamName of teamsM4) {
            try {
                const team = Team.create(teamName, m4CategoryId);
                console.log(`  ✅ Equipa "${teamName}" criada (ID: ${team.team_id})`);
                createdCount++;
            } catch (error) {
                if (error.message.includes('Já existe')) {
                    if (forceAll) {
                        console.log(`  ⚠️  Equipa "${teamName}" já existe - ignorada`);
                    } else {
                        console.log(`  ⚠️  Equipa "${teamName}" já existe`);
                    }
                    skippedCount++;
                } else {
                    console.error(`  ❌ Erro ao criar equipa "${teamName}":`, error.message);
                }
            }
        }
        console.log(`  📊 M4: ${createdCount} criadas, ${skippedCount} já existiam`);
    } else {
        console.error('  ❌ Categoria M4 não encontrada!');
    }
    
    // Adicionar equipas F4 (6 equipas)
    console.log('\n👥 A adicionar equipas F4 (6 equipas)...');
    const f4CategoryId = categoryMap['F4'];
    if (f4CategoryId) {
        let createdCount = 0;
        let skippedCount = 0;
        for (const teamName of teamsF4) {
            try {
                const team = Team.create(teamName, f4CategoryId);
                console.log(`  ✅ Equipa "${teamName}" criada (ID: ${team.team_id})`);
                createdCount++;
            } catch (error) {
                if (error.message.includes('Já existe')) {
                    if (forceAll) {
                        console.log(`  ⚠️  Equipa "${teamName}" já existe - ignorada`);
                    } else {
                        console.log(`  ⚠️  Equipa "${teamName}" já existe`);
                    }
                    skippedCount++;
                } else {
                    console.error(`  ❌ Erro ao criar equipa "${teamName}":`, error.message);
                }
            }
        }
        console.log(`  📊 F4: ${createdCount} criadas, ${skippedCount} já existiam`);
    } else {
        console.error('  ❌ Categoria F4 não encontrada!');
    }
    
    // Adicionar equipas F5 (6 equipas)
    console.log('\n👥 A adicionar equipas F5 (6 equipas)...');
    const f5CategoryId = categoryMap['F5'];
    if (f5CategoryId) {
        let createdCount = 0;
        let skippedCount = 0;
        for (const teamName of teamsF5) {
            try {
                const team = Team.create(teamName, f5CategoryId);
                console.log(`  ✅ Equipa "${teamName}" criada (ID: ${team.team_id})`);
                createdCount++;
            } catch (error) {
                if (error.message.includes('Já existe')) {
                    if (forceAll) {
                        console.log(`  ⚠️  Equipa "${teamName}" já existe - ignorada`);
                    } else {
                        console.log(`  ⚠️  Equipa "${teamName}" já existe`);
                    }
                    skippedCount++;
                } else {
                    console.error(`  ❌ Erro ao criar equipa "${teamName}":`, error.message);
                }
            }
        }
        console.log(`  📊 F5: ${createdCount} criadas, ${skippedCount} já existiam`);
    } else {
        console.error('  ❌ Categoria F5 não encontrada!');
    }
    
    // Adicionar equipas MX (6 equipas)
    console.log('\n👥 A adicionar equipas MX (6 equipas)...');
    const mxCategoryId = categoryMap['MX'];
    if (mxCategoryId) {
        let createdCount = 0;
        let skippedCount = 0;
        for (const teamName of teamsMX) {
            try {
                const team = Team.create(teamName, mxCategoryId);
                console.log(`  ✅ Equipa "${teamName}" criada (ID: ${team.team_id})`);
                createdCount++;
            } catch (error) {
                if (error.message.includes('Já existe')) {
                    if (forceAll) {
                        console.log(`  ⚠️  Equipa "${teamName}" já existe - ignorada`);
                    } else {
                        console.log(`  ⚠️  Equipa "${teamName}" já existe`);
                    }
                    skippedCount++;
                } else {
                    console.error(`  ❌ Erro ao criar equipa "${teamName}":`, error.message);
                }
            }
        }
        console.log(`  📊 MX: ${createdCount} criadas, ${skippedCount} já existiam`);
    } else {
        console.error('  ❌ Categoria MX não encontrada!');
    }
    
    // Resumo
    console.log('\n📊 Resumo:');
    const allCategories = Category.getAll();
    const allTeams = Team.getAll();
    console.log(`  - Categorias: ${allCategories.length}`);
    console.log(`  - Equipas: ${allTeams.length}`);
    
    // Contar equipas por categoria usando os IDs do categoryMap
    if (m3CategoryId) console.log(`  - Equipas M3: ${allTeams.filter(t => t.category_id === m3CategoryId).length}`);
    if (m4CategoryId) console.log(`  - Equipas M4: ${allTeams.filter(t => t.category_id === m4CategoryId).length}`);
    if (m5CategoryId) console.log(`  - Equipas M5: ${allTeams.filter(t => t.category_id === m5CategoryId).length}`);
    if (f4CategoryId) console.log(`  - Equipas F4: ${allTeams.filter(t => t.category_id === f4CategoryId).length}`);
    if (f5CategoryId) console.log(`  - Equipas F5: ${allTeams.filter(t => t.category_id === f5CategoryId).length}`);
    if (mxCategoryId) console.log(`  - Equipas MX: ${allTeams.filter(t => t.category_id === mxCategoryId).length}`);
    
    console.log('\n✅ Processo concluído!');
}

// Processar argumentos da linha de comando
const args = process.argv.slice(2);
const command = args[0] || 'default';

if (command === 'clean') {
    // Limpar base de dados
    cleanDatabase();
} else if (command === 'all') {
    // Adicionar tudo (ignora duplicados)
    addInitialData(true).catch(error => {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });
} else {
    // Comportamento padrão: adiciona dados (verifica duplicados)
    addInitialData(false).catch(error => {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });
}

