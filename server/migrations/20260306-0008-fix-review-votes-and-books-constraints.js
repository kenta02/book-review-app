'use strict';

async function dropUserIdForeignKeys(queryInterface) {
  const refs = await queryInterface.getForeignKeyReferencesForTable('ReviewVotes');
  const userIdFks = refs.filter(
    (ref) => ref.columnName === 'userId' && ref.constraintName
  );

  for (const fk of userIdFks) {
    await queryInterface.removeConstraint('ReviewVotes', fk.constraintName);
  }
}

async function dropUniqueTitleIndexes(queryInterface) {
  const indexes = await queryInterface.showIndex('Books');

  for (const index of indexes) {
    const fieldNames = (index.fields || []).map((f) => f.attribute);
    const isUniqueTitleOnly =
      index.unique === true &&
      fieldNames.length === 1 &&
      fieldNames[0] === 'title';

    if (isUniqueTitleOnly) {
      await queryInterface.removeIndex('Books', index.name);
    }
  }
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await dropUserIdForeignKeys(queryInterface);

    // userId NULL の既存データは不正データとして除去してから NOT NULL 化
    await queryInterface.sequelize.query(
      'DELETE FROM `ReviewVotes` WHERE `userId` IS NULL'
    );

    await queryInterface.changeColumn('ReviewVotes', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('ReviewVotes', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'fk_review_votes_user_id',
      references: {
        table: 'Users',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    await dropUniqueTitleIndexes(queryInterface);

    await queryInterface.addConstraint('Books', {
      fields: ['title', 'author'],
      type: 'unique',
      name: 'uniq_books_title_author',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Books', 'uniq_books_title_author');

    await queryInterface.addConstraint('Books', {
      fields: ['title'],
      type: 'unique',
      name: 'Books_title_unique',
    });

    await queryInterface.removeConstraint('ReviewVotes', 'fk_review_votes_user_id');

    await queryInterface.changeColumn('ReviewVotes', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      onUpdate: 'CASCADE',
    });

    await queryInterface.addConstraint('ReviewVotes', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'fk_review_votes_user_id_set_null',
      references: {
        table: 'Users',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },
};
