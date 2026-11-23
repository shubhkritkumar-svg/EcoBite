import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongo;

export async function startTestDb() {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-that-is-long-enough-for-tests';

  mongo = await MongoMemoryServer.create({ instance: { dbName: 'ecobite-test' } });
  await mongoose.connect(mongo.getUri(), { dbName: 'ecobite-test' });
}

export async function stopTestDb() {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
    mongo = null;
  }
}

export async function clearTestDb() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export const loginAs = async (request, baseUrl, email, password) => {
  const response = await request(baseUrl).post('/api/auth/login').send({ email, password });
  if (response.status !== 200) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(response.body)}`);
  }
  return response.body;
};
