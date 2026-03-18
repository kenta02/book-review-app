import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DataTypes, Sequelize, type QueryInterface } from 'sequelize';

import migrationModule from '../migrations/20260318-0009-add-review-book-indexes.js';

type MigrationModule = {
  up: (queryInterface: QueryInterface, sequelizeModule: typeof import('sequelize')) => Promise<void>;
  down: (queryInterface: QueryInterface, sequelizeModule: typeof import('sequelize')) => Promise<void>;
};

type IndexField = {
  attribute: string;
};

type IndexInfo = {
  name: string;
  fields?: IndexField[];
};

const migration = migrationModule as unknown as MigrationModule;
const sequelizeModule = {
  INTEGER: DataTypes.INTEGER,
} as unknown as typeof import('sequelize');

describe('20260318-0009 migration', () => {
  let sequelize: Sequelize;
  let qi: QueryInterface;

  beforeEach(async () => {
    sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
    qi = sequelize.getQueryInterface();

    await qi.createTable('Reviews', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      bookId: { type: DataTypes.INTEGER, allowNull: false },
      rating: { type: DataTypes.TINYINT, allowNull: false },
    });
  });

  afterEach(async () => {
    if (sequelize) {
      await sequelize.close();
    }
  });

  it('adds bookId and bookId+rating indexes', async () => {
    await migration.up(qi, sequelizeModule);

    const indexes = (await qi.showIndex('Reviews')) as IndexInfo[];
    const indexSignatures = indexes.map((index) => ({
      name: index.name,
      fields: (index.fields || []).map((field) => field.attribute),
    }));

    expect(indexSignatures).toContainEqual({
      name: 'idx_reviews_book_id',
      fields: ['bookId'],
    });
    expect(indexSignatures).toContainEqual({
      name: 'idx_reviews_book_id_rating',
      fields: ['bookId', 'rating'],
    });
  });

  it('removes both indexes on down', async () => {
    await migration.up(qi, sequelizeModule);
    await migration.down(qi, sequelizeModule);

    const indexes = (await qi.showIndex('Reviews')) as IndexInfo[];
    const indexNames = indexes.map((index) => index.name);

    expect(indexNames).not.toContain('idx_reviews_book_id');
    expect(indexNames).not.toContain('idx_reviews_book_id_rating');
  });
});
