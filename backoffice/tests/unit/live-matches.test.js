const request = require('supertest');
const app = require('../../src/server');
const Match = require('../../src/database/models/Match');
const Team = require('../../src/database/models/Team');
const Category = require('../../src/database/models/Category');
const db = require('../../src/database/db');

describe('Live Matches API', () => {
    let testCategoryId;
    let testTeam1Id;
    let testTeam2Id;
    let testMatchId;
    let testMatchId2;

    beforeAll(async () => {
        // Create test data
        const category = Category.create('Test Category Live');
        testCategoryId = category.category_id;

        const team1 = Team.create('Test Team Live 1', testCategoryId);
        testTeam1Id = team1.team_id;

        const team2 = Team.create('Test Team Live 2', testCategoryId);
        testTeam2Id = team2.team_id;

        // Create a playing match
        const match1 = Match.create({
            team1_id: testTeam1Id,
            team2_id: testTeam2Id,
            category_id: testCategoryId,
            status: 'playing',
            scheduled_date: '2024-01-01',
            scheduled_time: '10:00',
            court: 'Campo 1',
            sets_data: JSON.stringify([
                { gamesA: 6, gamesB: 4, tiebreak: null }
            ]),
            current_set_index: 1,
            current_set_data: JSON.stringify({
                gamesA: 3,
                gamesB: 2,
                tiebreak: null
            }),
            current_game_data: JSON.stringify({
                pointsA: 2,
                pointsB: 1,
                deuceState: null
            })
        });
        testMatchId = match1.match_id;

        // Create a scheduled match (should not appear in live)
        const match2 = Match.create({
            team1_id: testTeam1Id,
            team2_id: testTeam2Id,
            category_id: testCategoryId,
            status: 'scheduled',
            scheduled_date: '2024-01-02',
            scheduled_time: '11:00',
            court: 'Campo 2'
        });
        testMatchId2 = match2.match_id;
    });

    afterAll(() => {
        // Cleanup test data
        try {
            Match.delete(testMatchId);
            Match.delete(testMatchId2);
            Team.delete(testTeam1Id);
            Team.delete(testTeam2Id);
            Category.delete(testCategoryId);
        } catch (e) {
            // Ignore cleanup errors
        }
    });

    describe('GET /api/matches/live', () => {
        test('should return 200 without authentication', async () => {
            const response = await request(app)
                .get('/api/matches/live');
            
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('should return only playing matches', async () => {
            const response = await request(app)
                .get('/api/matches/live');
            
            expect(response.status).toBe(200);
            const matches = response.body;
            
            // All matches should have status 'playing'
            matches.forEach(match => {
                expect(match.status).toBe('playing');
            });
            
            // Should include our test match
            const testMatch = matches.find(m => m.match_id === testMatchId);
            expect(testMatch).toBeDefined();
            
            // Should not include scheduled match
            const scheduledMatch = matches.find(m => m.match_id === testMatchId2);
            expect(scheduledMatch).toBeUndefined();
        });

        test('should include all required score fields', async () => {
            const response = await request(app)
                .get('/api/matches/live');
            
            expect(response.status).toBe(200);
            const matches = response.body;
            
            const testMatch = matches.find(m => m.match_id === testMatchId);
            expect(testMatch).toBeDefined();
            
            // Check required fields
            expect(testMatch).toHaveProperty('sets_data');
            expect(testMatch).toHaveProperty('current_set_data');
            expect(testMatch).toHaveProperty('current_game_data');
            expect(testMatch).toHaveProperty('current_set_index');
            expect(testMatch).toHaveProperty('team1_name');
            expect(testMatch).toHaveProperty('team2_name');
            expect(testMatch).toHaveProperty('category_name');
        });

        test('should enrich matches with team and category names', async () => {
            const response = await request(app)
                .get('/api/matches/live');
            
            expect(response.status).toBe(200);
            const matches = response.body;
            
            const testMatch = matches.find(m => m.match_id === testMatchId);
            expect(testMatch).toBeDefined();
            expect(testMatch.team1_name).toBe('Test Team Live 1');
            expect(testMatch.team2_name).toBe('Test Team Live 2');
            expect(testMatch.category_name).toBe('Test Category Live');
        });

        test('should filter by category_id if provided', async () => {
            // Create another category and match (use unique name)
            const uniqueName = `Test Category Live 2 ${Date.now()}`;
            const category2 = Category.create(uniqueName);
            const team3 = Team.create('Test Team Live 3', category2.category_id);
            const team4 = Team.create('Test Team Live 4', category2.category_id);
            
            const match3 = Match.create({
                team1_id: team3.team_id,
                team2_id: team4.team_id,
                category_id: category2.category_id,
                status: 'playing',
                scheduled_date: '2024-01-03',
                scheduled_time: '12:00'
            });

            const response = await request(app)
                .get(`/api/matches/live?category_id=${testCategoryId}`);
            
            expect(response.status).toBe(200);
            const matches = response.body;
            
            // Should only include matches from testCategoryId
            matches.forEach(match => {
                expect(match.category_id).toBe(testCategoryId);
            });
            
            // Should not include match from category2
            const matchFromCategory2 = matches.find(m => m.match_id === match3.match_id);
            expect(matchFromCategory2).toBeUndefined();
            
            // Cleanup
            Match.delete(match3.match_id);
            Team.delete(team3.team_id);
            Team.delete(team4.team_id);
            Category.delete(category2.category_id);
        });

        test('should handle matches without scheduled_date', async () => {
            // Create a playing match without scheduled_date
            const matchNoDate = Match.create({
                team1_id: testTeam1Id,
                team2_id: testTeam2Id,
                category_id: testCategoryId,
                status: 'playing',
                scheduled_date: null,
                scheduled_time: null
            });

            const response = await request(app)
                .get('/api/matches/live');
            
            expect(response.status).toBe(200);
            const matches = response.body;
            
            // Match without scheduled_date should still be included in API response
            const foundMatch = matches.find(m => m.match_id === matchNoDate.match_id);
            expect(foundMatch).toBeDefined();
            
            // Cleanup
            Match.delete(matchNoDate.match_id);
        });

        test('should return empty array when no playing matches exist', async () => {
            // Temporarily change all matches to scheduled
            const allMatches = Match.getAll();
            const playingMatches = allMatches.filter(m => m.status === 'playing');
            
            // Change status of all playing matches
            playingMatches.forEach(match => {
                Match.update(match.match_id, { status: 'scheduled' });
            });

            const response = await request(app)
                .get('/api/matches/live');
            
            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
            
            // Restore original status
            playingMatches.forEach(match => {
                Match.update(match.match_id, { status: 'playing' });
            });
        });
    });

    describe('Score data validation', () => {
        test('should return valid JSON strings for score fields', async () => {
            const response = await request(app)
                .get('/api/matches/live');
            
            expect(response.status).toBe(200);
            const matches = response.body;
            
            const testMatch = matches.find(m => m.match_id === testMatchId);
            expect(testMatch).toBeDefined();
            
            // Verify JSON can be parsed
            expect(() => JSON.parse(testMatch.sets_data)).not.toThrow();
            expect(() => JSON.parse(testMatch.current_set_data)).not.toThrow();
            expect(() => JSON.parse(testMatch.current_game_data)).not.toThrow();
            
            // Verify structure
            const sets = JSON.parse(testMatch.sets_data);
            expect(Array.isArray(sets)).toBe(true);
            
            const currentSet = JSON.parse(testMatch.current_set_data);
            expect(currentSet).toHaveProperty('gamesA');
            expect(currentSet).toHaveProperty('gamesB');
            
            const currentGame = JSON.parse(testMatch.current_game_data);
            expect(currentGame).toHaveProperty('pointsA');
            expect(currentGame).toHaveProperty('pointsB');
        });

        test('should handle matches with tiebreak data', async () => {
            // Create match with tiebreak
            const matchWithTiebreak = Match.create({
                team1_id: testTeam1Id,
                team2_id: testTeam2Id,
                category_id: testCategoryId,
                status: 'playing',
                scheduled_date: '2024-01-04',
                scheduled_time: '13:00',
                sets_data: JSON.stringify([
                    { gamesA: 6, gamesB: 4, tiebreak: null }
                ]),
                current_set_index: 1,
                current_set_data: JSON.stringify({
                    gamesA: 6,
                    gamesB: 6,
                    tiebreak: {
                        pointsA: 5,
                        pointsB: 3
                    }
                }),
                current_game_data: JSON.stringify({
                    pointsA: 0,
                    pointsB: 0,
                    deuceState: null
                })
            });

            const response = await request(app)
                .get('/api/matches/live');
            
            expect(response.status).toBe(200);
            const matches = response.body;
            
            const foundMatch = matches.find(m => m.match_id === matchWithTiebreak.match_id);
            expect(foundMatch).toBeDefined();
            expect(foundMatch).not.toBeNull();
            
            const currentSet = typeof foundMatch.current_set_data === 'string' 
                ? JSON.parse(foundMatch.current_set_data) 
                : foundMatch.current_set_data;
            
            expect(currentSet).toBeDefined();
            expect(currentSet.tiebreak).toBeDefined();
            if (currentSet.tiebreak) {
                expect(currentSet.tiebreak.pointsA).toBe(5);
                expect(currentSet.tiebreak.pointsB).toBe(3);
            }
            
            // Cleanup
            Match.delete(matchWithTiebreak.match_id);
        });
    });
});
