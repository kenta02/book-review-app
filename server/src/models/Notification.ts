import { DataTypes } from 'sequelize';

import { sequelize } from '../sequelize';

const Notification = sequelize.define(
  'Notification',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },

    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    payload: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    // このテーブルは createdAt のみを持ち、updatedAt は持たない
    updatedAt: false,
  }
);

export default Notification;
