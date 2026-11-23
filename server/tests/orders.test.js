import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { seedDatabase } from '../src/seed/seed.js';
import { computeTotals } from '../src/utils/pricing.js';
import { loginAs, startTestDb, stopTestDb } from './db.js';

let demo;
let admin;
let greenTiffin;
let greenMenu;
let pizzeria;
let pizzeriaMenu;

const auth = (session) => ({ Authorization: `Bearer ${session.token}` });

const orderPayload = (overrides = {}) => ({
  restaurantId: greenTiffin.id,
  items: [{ menuItemId: greenMenu[0].id, quantity: 2 }],
  addressId: demo.user.addresses[0]._id || demo.user.addresses[0].id,
  contactPhone: '9876543210',
  deliveryMode: 'bicycle',
  packaging: 'reusable',
  cutlery: false,
  paymentMethod: 'demo_upi',
  ...overrides,
});

beforeAll(async () => {
  await startTestDb();
  await seedDatabase();
  demo = await loginAs(request, app, 'demo@ecobite.in', 'Demo@123');
  admin = await loginAs(request, app, 'admin@ecobite.in', 'Admin@123');

  const green = await request(app).get('/api/restaurants/the-green-tiffin');
  greenTiffin = green.body.restaurant;
  greenMenu = green.body.menu;

  const pizza = await request(app).get('/api/restaurants/pizzeria-basilico');
  pizzeria = pizza.body.restaurant;
  pizzeriaMenu = pizza.body.menu;
});

afterAll(async () => {
  await stopTestDb();
});

describe('Orders API', () => {
  it('requires authentication to place an order', async () => {
    const response = await request(app).post('/api/orders').send(orderPayload());
    expect(response.status).toBe(401);
  });

  it('creates an order with server-side totals and eco rewards', async () => {
    const pointsBefore = (await request(app).get('/api/auth/me').set(auth(demo))).body.user.greenPoints;

    const response = await request(app).post('/api/orders').set(auth(demo)).send(orderPayload());
    expect(response.status).toBe(201);

    const { order } = response.body;
    const expected = computeTotals([
      { price: greenMenu[0].price, quantity: 2 },
    ]);

    expect(order.itemTotal).toBe(greenMenu[0].price * 2);
    expect(order.total).toBe(expected.total);
    expect(order.deliveryFee).toBe(25);
    expect(order.packagingFee).toBe(10);
    expect(order.taxes).toBe(expected.taxes);
    expect(order.status).toBe('placed');
    expect(order.eco.greenPointsEarned).toBe(25);
    expect(order.eco.co2SavedKg).toBeGreaterThan(0);
    expect(response.body.greenPointsEarned).toBe(25);

    const me = await request(app).get('/api/auth/me').set(auth(demo));
    expect(me.body.user.greenPoints).toBe(pointsBefore + 25);
  });

  it('ignores client-supplied prices and totals', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set(auth(demo))
      .send({
        ...orderPayload({ cutlery: true, packaging: 'compostable' }),
        total: 1,
        itemTotal: 1,
        items: [{ menuItemId: greenMenu[1].id, quantity: 1, price: 1 }],
      });

    expect(response.status).toBe(201);
    expect(response.body.order.itemTotal).toBe(greenMenu[1].price);
    expect(response.body.order.total).toBeGreaterThan(1);
    expect(response.body.order.items[0].price).toBe(greenMenu[1].price);
  });

  it('rejects items that belong to another restaurant', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set(auth(demo))
      .send(orderPayload({ items: [{ menuItemId: pizzeriaMenu[0].id, quantity: 1 }] }));
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/not on this restaurant menu/i);
  });

  it('rejects delivery modes the restaurant does not support', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set(auth(demo))
      .send({
        ...orderPayload(),
        restaurantId: pizzeria.id,
        items: [{ menuItemId: pizzeriaMenu[0].id, quantity: 1 }],
        deliveryMode: 'bicycle',
      });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/delivery mode/i);
  });

  it('validates quantities, pincode and empty carts', async () => {
    const empty = await request(app).post('/api/orders').set(auth(demo)).send(orderPayload({ items: [] }));
    expect(empty.status).toBe(400);

    const badQuantity = await request(app)
      .post('/api/orders')
      .set(auth(demo))
      .send(orderPayload({ items: [{ menuItemId: greenMenu[0].id, quantity: 0 }] }));
    expect(badQuantity.status).toBe(400);

    const badPincode = await request(app)
      .post('/api/orders')
      .set(auth(demo))
      .send({
        ...orderPayload(),
        addressId: undefined,
        address: {
          line1: '12 Test Road',
          area: 'Indiranagar',
          city: 'Bengaluru',
          pincode: '123',
        },
      });
    expect(badPincode.status).toBe(400);
  });

  it('lists only the current user orders and hides other users orders', async () => {
    const other = await request(app).post('/api/auth/register').send({
      name: 'Other Customer',
      email: 'other@example.com',
      password: 'Other1234',
    });

    const response = await request(app).get('/api/orders').set(auth(demo));
    expect(response.status).toBe(200);
    expect(response.body.orders.length).toBeGreaterThan(0);

    const someoneElsesOrder = response.body.orders[0].id;
    const forbidden = await request(app)
      .get(`/api/orders/${someoneElsesOrder}`)
      .set({ Authorization: `Bearer ${other.body.token}` });
    expect(forbidden.status).toBe(403);
  });

  it('simulates tracking: placed -> confirmed -> preparing -> out_for_delivery -> delivered', async () => {
    const created = await request(app)
      .post('/api/orders')
      .set(auth(demo))
      .send(orderPayload({ deliveryMode: 'standard', packaging: 'compostable', cutlery: true }));
    const orderId = created.body.order.id;

    const expectedStatuses = ['confirmed', 'preparing', 'out_for_delivery', 'delivered'];
    for (const status of expectedStatuses) {
      const advanced = await request(app)
        .post(`/api/orders/${orderId}/advance`)
        .set(auth(demo));
      expect(advanced.status).toBe(200);
      expect(advanced.body.order.status).toBe(status);
    }

    const beyond = await request(app).post(`/api/orders/${orderId}/advance`).set(auth(demo));
    expect(beyond.status).toBe(400);
  });

  it('lets an admin update any order status', async () => {
    const created = await request(app).post('/api/orders').set(auth(demo)).send(orderPayload());
    const orderId = created.body.order.id;

    const response = await request(app)
      .patch(`/api/admin/orders/${orderId}/status`)
      .set(auth(admin))
      .send({ status: 'delivered' });

    expect(response.status).toBe(200);
    expect(response.body.order.status).toBe('delivered');
    expect(response.body.order.deliveredAt).toBeTruthy();
  });

  it('cancels an order and reverses Green Points', async () => {
    const created = await request(app).post('/api/orders').set(auth(demo)).send(orderPayload());
    expect(created.status).toBe(201);

    const pointsAfterOrder = (await request(app).get('/api/auth/me').set(auth(demo))).body.user.greenPoints;

    const cancelled = await request(app)
      .patch(`/api/orders/${created.body.order.id}/cancel`)
      .set(auth(demo));
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.order.status).toBe('cancelled');
    expect(cancelled.body.order.paymentStatus).toBe('refund_simulated');

    const pointsAfterCancel = (await request(app).get('/api/auth/me').set(auth(demo))).body.user.greenPoints;
    expect(pointsAfterCancel).toBe(pointsAfterOrder - 25);

    const rewards = await request(app).get('/api/rewards').set(auth(demo));
    expect(rewards.body.ledger.some((entry) => entry.type === 'order_cancelled')).toBe(true);
  });

  it('returns a rewards summary with ledger and documented assumptions', async () => {
    const response = await request(app).get('/api/rewards/summary').set(auth(demo));
    expect(response.status).toBe(200);
    expect(response.body.ledger.length).toBeGreaterThan(0);
    expect(response.body.assumptions.petrolTwoWheelerKgPerKm).toBeGreaterThan(0);
    expect(response.body.tier.name).toBeTruthy();
  });
});
