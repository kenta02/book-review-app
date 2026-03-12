import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const isTestRuntime = process.env.VITEST === 'true' || process.env.NODE_ENV === 'test';

const dbName = process.env.DB_NAME ?? (isTestRuntime ? 'test_db' : '');
const dbUser = process.env.DB_USER ?? (isTestRuntime ? 'test_user' : '');
const dbPass = process.env.DB_PASS ?? '';
const dbHost = process.env.DB_HOST;
const dbPort = Number(process.env.DB_PORT) || 3306;

if (!isTestRuntime && (!dbName || !dbUser)) {
  throw new Error('Database configuration (DB_NAME, DB_USER) must be provided via env');
}

export const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  port: dbPort,
  dialect: 'mysql' as const,
  logging: false,
});
