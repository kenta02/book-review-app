import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Sequelize, DataTypes, QueryTypes, type QueryInterface } from 'sequelize';

import migrationModule from '../migrations/20260306-0008-fix-review-votes-and-books-constraints.js';

type MigrationModule = {
  up: (
    queryInterface: QueryInterface,
    sequelizeModule: typeof import('sequelize')
  ) => Promise<void>;
  down: (
    queryInterface: QueryInterface,
    sequelizeModule: typeof import('sequelize')
  ) => Promise<void>;
};

type IndexField = {
  attribute: string;
};

type IndexInfo = {
  name: string;
  unique?: boolean;
  fields?: IndexField[];
};

type SQLiteForeignKeyRow = {
  from: string;
  on_delete: string;
};

const migration = migrationModule as unknown as MigrationModule;
const sequelizeModule = {
  INTEGER: DataTypes.INTEGER,
  QueryTypes,
} as unknown as typeof import('sequelize');

describe('20260306-0008 migration', () => {
  let sequelize: Sequelize;
  let qi: QueryInterface;

  beforeEach(async () => {
    sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
    qi = sequelize.getQueryInterface();
    await sequelize.query('PRAGMA foreign_keys = ON');

    // initial schema prior to running the migration
    await qi.createTable('Users', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    });

    await qi.createTable('ReviewVotes', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.INTEGER, allowNull: true },
    });

    await qi.addConstraint('ReviewVotes', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'fk_review_votes_user_id_set_null',
      references: { table: 'Users', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    await qi.createTable('Books', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING },
      author: { type: DataTypes.STRING },
    });

    await qi.addIndex('Books', ['title'], {
      unique: true,
      name: 'Books_title_unique',
    });
  });

  afterEach(async () => {
    if (sequelize) {
      await sequelize.close();
    }
  });

  describe('up', () => {
    it('removes null votes, makes userId not-null and cascades', async () => {
      await qi.bulkInsert('Users', [{ id: 1 }]);
      await qi.bulkInsert('ReviewVotes', [{ id: 1, userId: null }]);

      await migration.up(qi, sequelizeModule);

      const votes = await qi.sequelize.query<{ id: number; userId: number }>(
        'SELECT * FROM ReviewVotes',
        {
          type: QueryTypes.SELECT,
        }
      );
      expect(votes).toHaveLength(0);

      const desc = await qi.describeTable('ReviewVotes');
      expect(desc.userId.allowNull).toBe(false);

      const fkRows = await qi.sequelize.query<SQLiteForeignKeyRow>(
        "PRAGMA foreign_key_list('ReviewVotes')",
        { type: QueryTypes.SELECT }
      );
      const userFk = fkRows.find((f) => f.from === 'userId');
      expect(userFk).toBeDefined();
      expect(userFk?.on_delete).toBe('CASCADE');
    });

    it('enforces unique(title, author) after migration', async () => {
      await migration.up(qi, sequelizeModule);

      // Same title with different authors should be allowed.
      await qi.bulkInsert('Books', [
        { title: 'same-title', author: 'author-a' },
        { title: 'same-title', author: 'author-b' },
      ]);

      // Exact duplicate pair should be rejected.
      await expect(
        qi.bulkInsert('Books', [
          { title: 'same-title', author: 'author-a' },
          { title: 'same-title', author: 'author-a' },
        ])
      ).rejects.toThrow();
    });

    it('fails if a title+author duplicate exists', async () => {
      // Initial schema has unique(title), so make it permissive first to simulate dirty data.
      const indexes = (await qi.showIndex('Books')) as IndexInfo[];
      const titleOnlyUniqueIndexes = indexes.filter((index) => {
        const fields = (index.fields || []).map((f) => f.attribute);
        return index.unique === true && fields.length === 1 && fields[0] === 'title';
      });
      for (const index of titleOnlyUniqueIndexes) {
        await qi.removeIndex('Books', index.name);
      }

      await qi.bulkInsert('Books', [
        { title: 'A', author: 'B' },
        { title: 'A', author: 'B' },
      ]);
      await expect(migration.up(qi, sequelizeModule)).rejects.toThrow();
    });
  });

  describe('down', () => {
    it('reverts the changes and enforces duplicate-title check', async () => {
      // apply up first
      await migration.up(qi, sequelizeModule);

      // allowed under the new constraint
      await qi.bulkInsert('Books', [
        { title: 'dup', author: 'x' },
        { title: 'dup', author: 'y' },
      ]);

      // down should complain about duplicate title
      await expect(migration.down(qi, sequelizeModule)).rejects.toThrow(/duplicate book titles/);

      // remove the offending row and prepare a valid state for the remaining down checks
      await qi.sequelize.query("DELETE FROM Books WHERE title='dup' AND author='y'");

      await migration.down(qi, sequelizeModule);

      const desc = await qi.describeTable('ReviewVotes');
      expect(desc.userId.allowNull).toBe(true);

      const fkRows = await qi.sequelize.query<SQLiteForeignKeyRow>(
        "PRAGMA foreign_key_list('ReviewVotes')",
        { type: QueryTypes.SELECT }
      );
      const userFk = fkRows.find((f) => f.from === 'userId');
      expect(userFk).toBeDefined();
      expect(userFk?.on_delete).toBe('SET NULL');

      // After down, unique(title) should be enforced again.
      await expect(
        qi.bulkInsert('Books', [
          { title: 'dup', author: 'another-author' },
          { title: 'dup', author: 'yet-another-author' },
        ])
      ).rejects.toThrow();
    });

    it('drops all userId foreign keys even if non-standard names exist', async () => {
      await migration.up(qi, sequelizeModule);

      await qi.addConstraint('ReviewVotes', {
        fields: ['userId'],
        type: 'foreign key',
        name: 'some_other_fk',
        references: { table: 'Users', field: 'id' },
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      });

      await migration.down(qi, sequelizeModule);

      const fkRows = await qi.sequelize.query<SQLiteForeignKeyRow>(
        "PRAGMA foreign_key_list('ReviewVotes')",
        { type: QueryTypes.SELECT }
      );
      const userFk = fkRows.find((f) => f.from === 'userId');
      expect(userFk).toBeDefined();
      expect(userFk?.on_delete).toBe('SET NULL');
    });
  });
});
