'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Users
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true,
      },
      email: {
        type: Sequelize.STRING(254),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(128),
        allowNull: false,
      },
      role: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'user',
      },
      createdAt: {
        type: Sequelize.DATE(3),
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)'),
      },
      updatedAt: {
        type: Sequelize.DATE(3),
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)'),
      },
    });

    // Books
    await queryInterface.createTable('Books', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      author: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      publicationYear: {
        type: Sequelize.SMALLINT.UNSIGNED,
        allowNull: false,
      },
      ISBN: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE(3),
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)'),
      },
      updatedAt: {
        type: Sequelize.DATE(3),
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)'),
      },
    });

    // Reviews
    await queryInterface.createTable('Reviews', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      bookId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'Books', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      rating: {
        type: Sequelize.TINYINT.UNSIGNED,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE(3),
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)'),
      },
      updatedAt: {
        type: Sequelize.DATE(3),
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)'),
      },
    });

    // rating CHECK (MySQL 8+)
    await queryInterface.sequelize.query(
      "ALTER TABLE `Reviews` ADD CONSTRAINT `reviews_rating_between_1_5` CHECK (rating BETWEEN 1 AND 5)",
    );

    // Comments
    await queryInterface.createTable('Comments', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      reviewId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'Reviews', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      parentId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'Comments', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE(3),
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)'),
      },
      updatedAt: {
        type: Sequelize.DATE(3),
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)'),
      },
    });

    // Favorites (composite unique)
    await queryInterface.createTable(
      'Favorites',
      {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        userId: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'Users', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        bookId: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'Books', key: 'id' },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        },
        createdAt: {
          type: Sequelize.DATE(3),
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)'),
        },
        updatedAt: {
          type: Sequelize.DATE(3),
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)'),
        },
      },
      {
        uniqueKeys: {
          composite_user_book: {
            fields: ['userId', 'bookId'],
          },
        },
      },
    );

    // ReviewVotes
    await queryInterface.createTable('ReviewVotes', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      reviewId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'Reviews', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
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

    // Notifications
    await queryInterface.createTable('Notifications', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      payload: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE(3),
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)'),
      },
    });
  },

  down: async (queryInterface /* , Sequelize */) => {
    await queryInterface.dropTable('Notifications');
    await queryInterface.dropTable('ReviewVotes');
    await queryInterface.dropTable('Favorites');
    await queryInterface.dropTable('Comments');
    await queryInterface.dropTable('Reviews');
    await queryInterface.dropTable('Books');
    await queryInterface.dropTable('Users');
  },
};
