/**
 * Unit tests for Match API endpoints
 */

const request = require('supertest');
const express = require('express');
const app = require('../../src/server');

describe('Match API', () => {
    let matchId;
    let categoryId;
    let team1Id;
    let team2Id;

    beforeAll(async () => {
        // Clear database for clean tests
        const data = db.load();
        data.matches = [];
        data.categories = [];
        data.teams = [];
        db.save(data);

        // Create test data
        const categoryRes = await request(app)
            .post('/api/categories')
            .send({ name: 'TestCategory' });
        categoryId = categoryRes.body.category_id;

        const team1Res = await request(app)
            .post('/api/teams')
            .send({ name: 'Team 1', category_id: categoryId, group_name: 'A' });
        team1Id = team1Res.body.team_id;

        const team2Res = await request(app)
            .post('/api/teams')
            .send({ name: 'Team 2', category_id: categoryId, group_name: 'A' });
        team2Id = team2Res.body.team_id;
    });

    afterAll(() => {
        // Clean up
        const data = db.load();
        data.matches = [];
        data.categories = [];
        data.teams = [];
        db.save(data);
    });

    describe('POST /api/matches', () => {
        test('should create a new match', async () => {
            const res = await request(app)
                .post('/api/matches')
                .send({
                    team1_id: team1Id,
                    team2_id: team2Id,
                    category_id: categoryId,
                    phase: 'Group',
                    group_name: 'A',
                    scheduled_date: '2025-12-10',
                    scheduled_time: '10:00',
                    court: 'Court 1'
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('match_id');
            expect(res.body.status).toBe('scheduled');
            matchId = res.body.match_id;
        });

        test('should require team1_id, team2_id, category_id', async () => {
            const res = await request(app)
                .post('/api/matches')
                .send({
                    phase: 'Group'
                });

            expect(res.status).toBe(500);
        });
    });

    describe('GET /api/matches', () => {
        test('should get all matches', async () => {
            const res = await request(app)
                .get('/api/matches');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        test('should filter matches by status', async () => {
            const res = await request(app)
                .get('/api/matches?status=scheduled');

            expect(res.status).toBe(200);
            res.body.forEach(match => {
                expect(match.status).toBe('scheduled');
            });
        });

        test('should filter matches by category', async () => {
            const res = await request(app)
                .get(`/api/matches?category_id=${categoryId}`);

            expect(res.status).toBe(200);
            res.body.forEach(match => {
                expect(match.category_id).toBe(categoryId);
            });
        });
    });

    describe('GET /api/matches/:id', () => {
        test('should get match by id', async () => {
            const res = await request(app)
                .get(`/api/matches/${matchId}`);

            expect(res.status).toBe(200);
            expect(res.body.match_id).toBe(matchId);
        });

        test('should return 404 for non-existent match', async () => {
            const res = await request(app)
                .get('/api/matches/99999');

            expect(res.status).toBe(404);
        });
    });

    describe('POST /api/matches/:id/start', () => {
        test('should start a match', async () => {
            const res = await request(app)
                .post(`/api/matches/${matchId}/start`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('playing');
        });
    });

    describe('POST /api/matches/:id/score/increment', () => {
        test('should increment point for team A', async () => {
            const res = await request(app)
                .post(`/api/matches/${matchId}/score/increment`)
                .send({ team: 'A' });

            expect(res.status).toBe(200);
            const game = JSON.parse(res.body.current_game_data);
            expect(game.pointsA).toBe(1);
        });

        test('should increment point for team B', async () => {
            const res = await request(app)
                .post(`/api/matches/${matchId}/score/increment`)
                .send({ team: 'B' });

            expect(res.status).toBe(200);
            const game = JSON.parse(res.body.current_game_data);
            expect(game.pointsB).toBeGreaterThan(0);
        });

        test('should win game after 4 points', async () => {
            // Score 4 points for team A
            for (let i = 0; i < 4; i++) {
                await request(app)
                    .post(`/api/matches/${matchId}/score/increment`)
                    .send({ team: 'A' });
            }

            const res = await request(app)
                .get(`/api/matches/${matchId}`);

            const set = JSON.parse(res.body.current_set_data);
            expect(set.gamesA).toBe(1);
            
            const game = JSON.parse(res.body.current_game_data);
            expect(game.pointsA).toBe(0); // Game reset
        });

        test('should start tiebreak at 6-6', async () => {
            // Win 6 games for each team
            for (let game = 0; game < 6; game++) {
                for (let point = 0; point < 4; point++) {
                    await request(app)
                        .post(`/api/matches/${matchId}/score/increment`)
                        .send({ team: 'A' });
                }
            }
            for (let game = 0; game < 6; game++) {
                for (let point = 0; point < 4; point++) {
                    await request(app)
                        .post(`/api/matches/${matchId}/score/increment`)
                        .send({ team: 'B' });
                }
            }

            const res = await request(app)
                .get(`/api/matches/${matchId}`);

            const set = JSON.parse(res.body.current_set_data);
            expect(set.gamesA).toBe(6);
            expect(set.gamesB).toBe(6);
            expect(set.tiebreak).not.toBeNull();
        });

        test('should win tiebreak and set', async () => {
            // Ensure we're in tiebreak (6-6)
            let res = await request(app).get(`/api/matches/${matchId}`);
            let set = JSON.parse(res.body.current_set_data);
            
            if (!set.tiebreak || set.gamesA !== 6 || set.gamesB !== 6) {
                // Set up tiebreak first
                for (let game = 0; game < 6; game++) {
                    for (let point = 0; point < 4; point++) {
                        await request(app)
                            .post(`/api/matches/${matchId}/score/increment`)
                            .send({ team: 'A' });
                    }
                }
                for (let game = 0; game < 6; game++) {
                    for (let point = 0; point < 4; point++) {
                        await request(app)
                            .post(`/api/matches/${matchId}/score/increment`)
                            .send({ team: 'B' });
                    }
                }
            }

            // Win tiebreak 7-5
            for (let i = 0; i < 7; i++) {
                await request(app)
                    .post(`/api/matches/${matchId}/score/increment`)
                    .send({ team: 'A' });
            }
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post(`/api/matches/${matchId}/score/increment`)
                    .send({ team: 'B' });
            }
            // Final point to win
            await request(app)
                .post(`/api/matches/${matchId}/score/increment`)
                .send({ team: 'A' });

            res = await request(app).get(`/api/matches/${matchId}`);
            const sets = JSON.parse(res.body.sets_data);
            expect(sets.length).toBeGreaterThan(0);
            expect(sets[sets.length - 1].gamesA).toBe(7);
            expect(sets[sets.length - 1].gamesB).toBe(6);
        });
    });

    describe('POST /api/matches/:id/score/decrement', () => {
        test('should decrement point', async () => {
            // First increment
            await request(app)
                .post(`/api/matches/${matchId}/score/increment`)
                .send({ team: 'A' });

            // Then decrement
            const res = await request(app)
                .post(`/api/matches/${matchId}/score/decrement`)
                .send({ team: 'A' });

            expect(res.status).toBe(200);
            const game = JSON.parse(res.body.current_game_data);
            expect(game.pointsA).toBe(0);
        });

        test('should undo game win', async () => {
            // Win a game
            for (let i = 0; i < 4; i++) {
                await request(app)
                    .post(`/api/matches/${matchId}/score/increment`)
                    .send({ team: 'A' });
            }

            // Undo
            await request(app)
                .post(`/api/matches/${matchId}/score/decrement`)
                .send({ team: 'A' });

            const res = await request(app).get(`/api/matches/${matchId}`);
            const set = JSON.parse(res.body.current_set_data);
            // Game should be undone
            expect(set.gamesA).toBeLessThan(1);
        });
    });

    describe('POST /api/matches/:id/finish', () => {
        test('should finish a match', async () => {
            const res = await request(app)
                .post(`/api/matches/${matchId}/finish`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('finished');
        });
    });

    describe('PUT /api/matches/:id', () => {
        test('should update match', async () => {
            const res = await request(app)
                .put(`/api/matches/${matchId}`)
                .send({
                    scheduled_time: '14:00',
                    court: 'Court 2'
                });

            expect(res.status).toBe(200);
            expect(res.body.scheduled_time).toBe('14:00');
            expect(res.body.court).toBe('Court 2');
        });

        test('should update referee notes', async () => {
            const res = await request(app)
                .put(`/api/matches/${matchId}`)
                .send({
                    referee_notes: 'Test notes'
                });

            expect(res.status).toBe(200);
            expect(res.body.referee_notes).toBe('Test notes');
        });

        test('should update events data', async () => {
            const events = [
                { type: 'point', data: { team: 'A' }, timestamp: new Date().toISOString() }
            ];
            const res = await request(app)
                .put(`/api/matches/${matchId}`)
                .send({
                    events_data: JSON.stringify(events)
                });

            expect(res.status).toBe(200);
            expect(res.body.events_data).toBeDefined();
        });
    });

    describe('DELETE /api/matches/:id', () => {
        test('should delete a match', async () => {
            const res = await request(app)
                .delete(`/api/matches/${matchId}`);

            expect(res.status).toBe(204);
        });
    });
});

