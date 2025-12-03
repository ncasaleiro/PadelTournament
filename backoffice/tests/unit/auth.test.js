const request = require('supertest');
const app = require('../../src/server');
const User = require('../../src/database/models/User');
const db = require('../../src/database/db');

describe('Authentication API', () => {
    beforeEach(() => {
        // Ensure default users exist
        const data = db.load();
        const adminExists = data.users.find(u => u.username === 'admin');
        const refereeExists = data.users.find(u => u.username === 'referee');
        
        if (!adminExists) {
            User.create('admin', 'admin123', 'admin');
        }
        if (!refereeExists) {
            User.create('referee', 'referee123', 'referee');
        }
    });

    describe('POST /api/auth/login', () => {
        test('should return 400 if username is missing', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ password: 'admin123' });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Username and password are required');
        });

        test('should return 400 if password is missing', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'admin' });
            
            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Username and password are required');
        });

        test('should return 401 for invalid username', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'nonexistent', password: 'admin123' });
            
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid credentials');
        });

        test('should return 401 for invalid password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'admin', password: 'wrongpassword' });
            
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid credentials');
        });

        test('should return token and user for valid admin credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'admin', password: 'admin123' });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.username).toBe('admin');
            expect(response.body.user.role).toBe('admin');
            expect(response.body.user).toHaveProperty('user_id');
            expect(typeof response.body.token).toBe('string');
            expect(response.body.token.length).toBeGreaterThan(0);
        });

        test('should return token and user for valid referee credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'referee', password: 'referee123' });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.username).toBe('referee');
            expect(response.body.user.role).toBe('referee');
            expect(response.body.user).toHaveProperty('user_id');
            expect(typeof response.body.token).toBe('string');
        });

        test('should return valid JWT tokens for logins', async () => {
            const response1 = await request(app)
                .post('/api/auth/login')
                .send({ username: 'admin', password: 'admin123' });
            
            const response2 = await request(app)
                .post('/api/auth/login')
                .send({ username: 'admin', password: 'admin123' });
            
            expect(response1.status).toBe(200);
            expect(response2.status).toBe(200);
            // Both should have valid tokens
            expect(response1.body.token).toBeTruthy();
            expect(response2.body.token).toBeTruthy();
            // Tokens should be valid JWT format (3 parts separated by dots)
            expect(response1.body.token.split('.')).toHaveLength(3);
            expect(response2.body.token.split('.')).toHaveLength(3);
        });

        test('should return user object without password_hash', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'admin', password: 'admin123' });
            
            expect(response.status).toBe(200);
            expect(response.body.user).not.toHaveProperty('password_hash');
            expect(response.body.user).not.toHaveProperty('password');
        });
    });

    describe('User.authenticate', () => {
        test('should return null for non-existent user', () => {
            const result = User.authenticate('nonexistent', 'password');
            expect(result).toBeNull();
        });

        test('should return null for wrong password', () => {
            const result = User.authenticate('admin', 'wrongpassword');
            expect(result).toBeNull();
        });

        test('should return user object for correct credentials', () => {
            const result = User.authenticate('admin', 'admin123');
            expect(result).not.toBeNull();
            expect(result.username).toBe('admin');
            expect(result.role).toBe('admin');
            expect(result).toHaveProperty('user_id');
            expect(result).not.toHaveProperty('password_hash');
        });
    });
});

