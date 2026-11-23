import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { seedDatabase } from '../src/seed/seed.js';
import { loginAs, startTestDb, stopTestDb } from './db.js';

let customer;
let admin;

beforeAll(async () => {
  await startTestDb();
  await seedDatabase();
  customer = await loginAs(request, app, 'demo@ecobite.in', 'Demo@123');
  admin = await loginAs(request, app, 'admin@ecobite.in', 'Admin@123');
});

afterAll(async () => {
  await stopTestDb();
});

describe('Security and error handling', () => {
  it('exposes a health endpoint', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.simulation).toMatch(/simulated/i);
  });

  it('sets security headers with Helmet', async () => {
    const response = await request(app).get('/api/health');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['content-security-policy']).toBeTruthy();
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('rejects malformed JSON with a clean 400 response', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "demo@ecobite.in", ');
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/invalid JSON/i);
  });

  it('rejects tampered or invalid tokens', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.real.token');
    expect(response.status).toBe(401);
  });

  it('blocks customers from admin endpoints and allows admins', async () => {
    const forbidden = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${customer.token}`);
    expect(forbidden.status).toBe(403);

    const allowed = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(allowed.status).toBe(200);
    expect(allowed.body.stats.orderCount).toBeGreaterThan(0);
    expect(allowed.body.stats.co2SavedKg).toBeGreaterThan(0);
  });

  it('returns structured 404 JSON for unknown API routes', async () => {
    const response = await request(app).get('/api/this-route-does-not-exist');
    expect(response.status).toBe(404);
    expect(response.body.message).toContain('/api/this-route-does-not-exist');
  });

  it('sanitizes MongoDB operator injection attempts', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: { $gt: '' }, password: 'anything' });
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeTruthy();
  });

  it('validates admin stats and restaurant listing endpoints', async () => {
    const restaurants = await request(app)
      .get('/api/admin/restaurants')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(restaurants.status).toBe(200);
    expect(restaurants.body.restaurants).toHaveLength(8);

    const badOrderStatus = await request(app)
      .patch('/api/admin/orders/000000000000000000000000/status')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'teleported' });
    expect(badOrderStatus.status).toBe(400);
  });
});
