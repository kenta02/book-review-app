import { DataTypes } from 'sequelize';

import { sequelize } from '../sequelize';

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  reviewId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Reviews', // 'Reviews' テーブルを参照
      key: 'id', // 'id' カラムを参照
    },
    onDelete: 'CASCADE', // レビューが削除されたときにコメントも削除される
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },

  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    // 自己参照の外部キー（親コメントのID）
    references: {
      model: 'Comments',
      key: 'id',
    },
    onDelete: 'SET NULL', // 親コメントが削除されたときにこのフィールドをNULLに設定
  },

  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },

  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

export default Comment;
