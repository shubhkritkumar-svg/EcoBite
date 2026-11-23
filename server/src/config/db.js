import mongoose from 'mongoose';
import { env } from './env.js';

let memoryServer = null;

function maskUri(uri) {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
}

export async function connectDB(uri = env.mongoUri) {
  mongoose.set('strictQuery', true);

  if (env.useMemoryDb) {
    // Zero-install demo mode. Data lives only while the API process is running.
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create({ instance: { dbName: 'ecobite' } });
    uri = memoryServer.getUri('ecobite');
    console.log('[db] USE_MEMORY_DB=true - using an in-memory MongoDB. Data resets on restart.');
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log(`[db] Connected to ${maskUri(uri)}`);
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
