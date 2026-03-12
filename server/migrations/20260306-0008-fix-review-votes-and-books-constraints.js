'use strict';

// helpers accept an options object so they can participate in transactions
async function dropUserIdForeignKeys(queryInterface, options = {}) {
  const refs = await queryInterface.getForeignKeyReferencesForTable('ReviewVotes', options);
  const userIdFks = refs.filter((ref) => ref.columnName === 'userId' && ref.constraintName);

  for (const fk of userIdFks) {
    await queryInterface.removeConstraint('ReviewVotes', fk.constraintName, options);
  }
}

async function dropUniqueTitleIndexes(queryInterface, options = {}) {
  const indexes = await queryInterface.showIndex('Books', options);

  for (const index of indexes) {
    const fieldNames = (index.fields || []).map((f) => f.attribute);
    const isUniqueTitleOnly =
      index.unique === true && fieldNames.length === 1 && fieldNames[0] === 'title';

    if (isUniqueTitleOnly) {
      await queryInterface.removeIndex('Books', index.name, options);
    }
  }
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // perform all changes in one transaction so partial failures roll back
    await queryInterface.sequelize.transaction(async (transaction) => {
      const opts = { transaction };

      await dropUserIdForeignKeys(queryInterface, opts);

      // userId NULL の既存データは不正データとして除去してから NOT NULL 化
      await queryInterface.sequelize.query(
        'DELETE FROM `ReviewVotes` WHERE `userId` IS NULL',
        opts
      );

      await queryInterface.changeColumn(
        'ReviewVotes',
        'userId',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          onUpdate: 'CASCADE',
        },
        opts
      );

      await queryInterface.addConstraint(
        'ReviewVotes',
        {
          fields: ['userId'],
          type: 'foreign key',
          name: 'fk_review_votes_user_id',
          references: {
            table: 'Users',
            field: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        opts
      );

      await dropUniqueTitleIndexes(queryInterface, opts);

      await queryInterface.addConstraint(
        'Books',
        {
          fields: ['title', 'author'],
          type: 'unique',
          name: 'uniq_books_title_author',
        },
        opts
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const opts = { transaction };

      // before we recreate the title-only unique index, make sure no duplicates exist
      // (we only care about title duplicates because the old constraint ignored author;
      // books with the same title but different authors are permitted even after up)
      const duplicates = await queryInterface.sequelize.query(
        `
        SELECT title, COUNT(*) cnt
        FROM Books
        GROUP BY title
        HAVING cnt > 1
      `,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      if (duplicates.length) {
        // abort the migration with an explanatory message; cleanup must be done manually
        const titles = duplicates.map((d) => d.title).join(', ');
        throw new Error(
          `cannot apply down migration: duplicate book titles present (${titles}). ` +
            'please resolve or delete duplicates before reverting.'
        );
      }

      await queryInterface.removeConstraint('Books', 'uniq_books_title_author', opts);

      await queryInterface.addConstraint(
        'Books',
        {
          fields: ['title'],
          type: 'unique',
          name: 'Books_title_unique',
        },
        opts
      );

      // mirror the logic used in `up`: drop whatever fk(s) exist on userId first
      await dropUserIdForeignKeys(queryInterface, opts);

      await queryInterface.changeColumn(
        'ReviewVotes',
        'userId',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          onUpdate: 'CASCADE',
        },
        opts
      );

      await queryInterface.addConstraint(
        'ReviewVotes',
        {
          fields: ['userId'],
          type: 'foreign key',
          name: 'fk_review_votes_user_id_set_null',
          references: {
            table: 'Users',
            field: 'id',
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },
        opts
      );
    });
  },
};
