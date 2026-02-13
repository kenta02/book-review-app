import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const dbName = process.env.DB_NAME ?? '';
const dbUser = process.env.DB_USER ?? '';
const dbPass = process.env.DB_PASS ?? '';
const dbHost = process.env.DB_HOST;
const dbPort = Number(process.env.DB_PORT) || 3306;

if (!dbName || !dbUser) {
  throw new Error('Database configuration (DB_NAME, DB_USER) must be provided via env');
}

export const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  port: dbPort,
  dialect: 'mysql' as const,
  logging: false,
});
