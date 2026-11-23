import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { seedDatabase } from './seed.js';

async function run() {
  try {
    await connectDB();
    const result = await seedDatabase({ reset: true });
    console.log('[seed] Done:', result);
    console.log('[seed] Demo customer: demo@ecobite.in / Demo@123');
    console.log('[seed] Admin:         admin@ecobite.in / Admin@123');
  } catch (error) {
    console.error('[seed] Failed:', error.message);
    process.exitCode = 1;
    if (env.useMemoryDb) {
      console.error('[seed] Note: USE_MEMORY_DB=true creates a temporary database, so seed data');
      console.error('[seed] disappears when this script exits. Set USE_MEMORY_DB=false to seed a real DB.');
    }
  } finally {
    await disconnectDB();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
}

run();
