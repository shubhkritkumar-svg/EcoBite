import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { seedDatabase } from '../src/seed/seed.js';
import { loginAs, startTestDb, stopTestDb } from './db.js';

beforeAll(async () => {
  await startTestDb();
  await seedDatabase();
});

afterAll(async () => {
  await stopTestDb();
});

describe('Authentication API', () => {
  it('registers a new customer and never returns the password hash', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Test Customer',
      email: 'new.customer@example.com',
      password: 'Secure123',
      phone: '9000011111',
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.email).toBe('new.customer@example.com');
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(response.body.user.role).toBe('customer');
  });

  it('rejects duplicate email addresses with 409', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Duplicate',
      email: 'demo@ecobite.in',
      password: 'Secure123',
    });
    expect(response.status).toBe(409);
  });

  it('rejects weak passwords with field-level errors', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Weak Password',
      email: 'weak@example.com',
      password: 'short',
    });
    expect(response.status).toBe(400);
    expect(response.body.errors.some((error) => error.field === 'password')).toBe(true);
  });

  it('logs in with seeded demo credentials', async () => {
    const session = await loginAs(request, app, 'demo@ecobite.in', 'Demo@123');
    expect(session.user.name).toBe('Aanya Sharma');
    expect(session.user.addresses.length).toBeGreaterThan(0);
    expect(session.token.split('.')).toHaveLength(3);
  });

  it('rejects a wrong password without revealing which field failed', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@ecobite.in', password: 'WrongPass1' });
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Incorrect email or password.');
  });

  it('returns the signed-in user for GET /api/auth/me', async () => {
    const session = await loginAs(request, app, 'demo@ecobite.in', 'Demo@123');
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${session.token}`);
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('demo@ecobite.in');
  });

  it('blocks protected endpoints without a token', async () => {
    const response = await request(app).get('/api/auth/me');
    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/log in/i);
  });

  it('updates the profile name and adds/removes an address', async () => {
    const session = await loginAs(request, app, 'demo@ecobite.in', 'Demo@123');

    const update = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${session.token}`)
      .send({ name: 'Aanya S.' });
    expect(update.status).toBe(200);
    expect(update.body.user.name).toBe('Aanya S.');

    const created = await request(app)
      .post('/api/users/me/addresses')
      .set('Authorization', `Bearer ${session.token}`)
      .send({
        label: 'Hostel',
        line1: '12, Lake View Road',
        area: 'Ulsoor',
        city: 'Bengaluru',
        pincode: '560008',
      });
    expect(created.status).toBe(201);
    expect(created.body.addresses).toHaveLength(3);

    const newAddress = created.body.addresses.find((address) => address.label === 'Hostel');
    const removed = await request(app)
      .delete(`/api/users/me/addresses/${newAddress._id}`)
      .set('Authorization', `Bearer ${session.token}`);
    expect(removed.status).toBe(200);
    expect(removed.body.addresses).toHaveLength(2);
  });
});
