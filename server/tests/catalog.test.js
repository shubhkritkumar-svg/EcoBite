import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { seedDatabase } from '../src/seed/seed.js';
import { loginAs, startTestDb, stopTestDb } from './db.js';

let admin;
let customer;

beforeAll(async () => {
  await startTestDb();
  await seedDatabase();
  admin = await loginAs(request, app, 'admin@ecobite.in', 'Admin@123');
  customer = await loginAs(request, app, 'demo@ecobite.in', 'Demo@123');
});

afterAll(async () => {
  await stopTestDb();
});

describe('Restaurant catalogue API', () => {
  it('lists all 8 seeded restaurants', async () => {
    const response = await request(app).get('/api/restaurants');
    expect(response.status).toBe(200);
    expect(response.body.count).toBe(8);
    expect(response.body.restaurants.map((restaurant) => restaurant.slug)).toContain('the-green-tiffin');
  });

  it('searches by name and area', async () => {
    const byName = await request(app).get('/api/restaurants?search=pizza');
    expect(byName.body.restaurants).toHaveLength(1);
    expect(byName.body.restaurants[0].name).toBe('Pizzeria Basilico');

    const byArea = await request(app).get('/api/restaurants?search=Indiranagar');
    expect(byArea.body.restaurants.length).toBeGreaterThan(0);
    expect(byArea.body.restaurants[0].area).toBe('Indiranagar');
  });

  it('filters by cuisine and eco certification', async () => {
    const southIndian = await request(app).get('/api/restaurants?cuisine=South%20Indian');
    expect(southIndian.body.restaurants.length).toBe(2);

    const eco = await request(app).get('/api/restaurants?eco=true');
    expect(eco.body.restaurants.length).toBeGreaterThan(0);
    expect(eco.body.restaurants.every((restaurant) => restaurant.isEcoCertified)).toBe(true);
  });

  it('sorts by delivery time', async () => {
    const response = await request(app).get('/api/restaurants?sort=delivery');
    const times = response.body.restaurants.map((restaurant) => restaurant.deliveryTimeMins);
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it('returns a restaurant with its menu', async () => {
    const list = await request(app).get('/api/restaurants?search=green%20tiffin');
    const slug = list.body.restaurants[0].slug;

    const response = await request(app).get(`/api/restaurants/${slug}`);
    expect(response.status).toBe(200);
    expect(response.body.restaurant.name).toBe('The Green Tiffin');
    expect(response.body.menu).toHaveLength(8);
    expect(response.body.menu[0]).toHaveProperty('price');
  });

  it('returns 404 for an unknown restaurant', async () => {
    const response = await request(app).get('/api/restaurants/does-not-exist');
    expect(response.status).toBe(404);
  });

  it('enforces admin-only access on writes (RBAC)', async () => {
    const response = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ name: 'Fake Kitchen' });
    expect(response.status).toBe(403);
  });

  it('allows an admin to create, update and delete a restaurant and its menu', async () => {
    const created = await request(app)
      .post('/api/restaurants')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'Test Kitchen',
        description: 'A temporary restaurant created by the automated test suite.',
        cuisines: ['Healthy'],
        area: 'Test Area',
        city: 'Bengaluru',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
        priceForTwo: 500,
        deliveryTimeMins: 25,
        distanceKm: 2,
        deliveryModes: ['ev'],
        packagingOptions: ['compostable'],
      });
    expect(created.status).toBe(201);
    const restaurantId = created.body.restaurant.id;

    const updated = await request(app)
      .put(`/api/restaurants/${restaurantId}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ rating: 4.9 });
    expect(updated.status).toBe(200);
    expect(updated.body.restaurant.rating).toBe(4.9);

    const item = await request(app)
      .post('/api/menu-items')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        restaurant: restaurantId,
        name: 'Test Bowl',
        description: 'A bowl used by the test suite.',
        price: 199,
        category: 'Mains',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
      });
    expect(item.status).toBe(201);

    const removed = await request(app)
      .delete(`/api/restaurants/${restaurantId}`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(removed.status).toBe(200);
  });

  it('refuses to delete a restaurant that has order history', async () => {
    const all = await request(app).get('/api/admin/restaurants').set('Authorization', `Bearer ${admin.token}`);
    const greenTiffin = all.body.restaurants.find((restaurant) => restaurant.slug === 'the-green-tiffin');
    const response = await request(app)
      .delete(`/api/restaurants/${greenTiffin.id}`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(response.status).toBe(409);
  });

  it('validates the menu item payload', async () => {
    const response = await request(app)
      .post('/api/menu-items')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ name: 'X', price: -5 });
    expect(response.status).toBe(400);
  });
});
