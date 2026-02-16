import { DataTypes } from 'sequelize';

import { sequelize } from '../sequelize';

const ReviewVote = sequelize.define(
  'ReviewVote',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    reviewId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Reviews',
        key: 'id',
      },
      onDelete: 'CASCADE',
      unique: 'uniq_review_vote',
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
      onDelete: 'SET NULL',
      unique: 'uniq_review_vote',
    },

    isHelpful: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    // DB has only createdAt for this table (no updatedAt)
    updatedAt: false,
  }
);

export default ReviewVote;
