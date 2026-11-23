import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { seedDatabase } from './seed/seed.js';

async function start() {
  try {
    await connectDB();

    if (env.autoSeed) {
      const result = await seedDatabase();
      if (result.seeded) {
        console.log(`[seed] Demo data ready: ${result.restaurants} restaurants, ${result.menuItems} menu items, ${result.orders} orders.`);
        console.log('[seed] Customer: demo@ecobite.in / Demo@123');
        console.log('[seed] Admin:    admin@ecobite.in / Admin@123');
      }
    }

    const server = app.listen(env.port, () => {
      console.log(`[api] EcoBite API listening on http://localhost:${env.port}`);
      console.log(`[api] Health check: http://localhost:${env.port}/api/health`);
    });

    const shutdown = (signal) => {
      console.log(`\n[api] ${signal} received, shutting down...`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('[api] Failed to start:', error.message);
    console.error(
      '[api] Check that MongoDB is running and MONGO_URI in .env is correct, or set USE_MEMORY_DB=true for a zero-install demo.'
    );
    process.exit(1);
  }
}

start();
