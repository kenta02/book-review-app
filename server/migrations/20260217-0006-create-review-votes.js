'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ReviewVotes', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      reviewId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Reviews', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      isHelpful: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE(3),
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)'),
      },
    });

    await queryInterface.addConstraint('ReviewVotes', {
      fields: ['reviewId', 'userId'],
      type: 'unique',
      name: 'uniq_review_vote',
    });
  },
  down: async (queryInterface /* , Sequelize */) => {
    await queryInterface.dropTable('ReviewVotes');
  },
};
