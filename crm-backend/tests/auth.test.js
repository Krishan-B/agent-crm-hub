const request = require('supertest');
const app = require('../src/app'); // Your Express app
// const supabase = require('../src/config/supabaseClient').supabase; // For mocking if needed

// Mock environment variables if they are not set in the test environment
// process.env.SUPABASE_URL = 'your_test_supabase_url';
// process.env.SUPABASE_ANON_KEY = 'your_test_supabase_anon_key';

describe('Auth API Endpoints', () => {
  // Test /api/auth/login
  describe('POST /api/auth/login', () => {
    it('should fail with 400 if email or password are not provided', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' }); // Missing password
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Please provide email and password');
    });

    // Add a test for successful login - this would require mocking Supabase
    // or a live test user + Supabase instance.
    // For now, we'll skip the actual successful login test that hits Supabase.
    it('should return 401 for invalid credentials (simulated)', async () => {
        // This test assumes Supabase will reject; actual call made.
        // To properly test this without hitting a live DB, supabase.auth.signInWithPassword would need to be mocked.
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'wrong@example.com', password: 'wrongpassword' });
        expect(res.statusCode).toEqual(401);
    });
  });

  // Test /api/auth/forgot-password
  describe('POST /api/auth/forgot-password', () => {
    it('should fail with 400 if email is not provided', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({});
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'Please provide an email address');
    });

    it('should return 200 for a valid email format (simulated success)', async () => {
        // This test assumes Supabase will accept; actual call made.
        // To properly test, supabase.auth.resetPasswordForEmail would need mocking.
        const res = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: 'test@example.com' });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'If an account with this email exists, a password reset link has been sent.');
    });
  });

  // Test /api/auth/me (requires protected route setup)
  describe('GET /api/auth/me', () => {
    it('should fail with 401 if no token is provided', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Not authorized, no token');
    });
    // A test for a successful /me would require a valid token from a logged-in user.
  });
});
