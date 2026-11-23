import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));

// The project root `.env` is the single place for backend configuration.
dotenv.config({ path: path.resolve(here, '../../../.env') });
// Also allow a server/.env file (useful when deploying only the server folder).
dotenv.config({ path: path.resolve(here, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET must be set to at least 32 characters in production.');
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  isTest: process.env.NODE_ENV === 'test',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecobite',
  jwtSecret: process.env.JWT_SECRET || 'ecobite-local-development-secret-do-not-use-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  useMemoryDb: String(process.env.USE_MEMORY_DB).toLowerCase() === 'true',
  autoSeed: String(process.env.AUTO_SEED).toLowerCase() !== 'false',
};
