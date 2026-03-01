// サンプル

import { DataTypes, Model, Optional } from 'sequelize';

import { sequelize } from '../sequelize';

// attribute interface helps TypeScript know what fields exist on instances
export interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

// when creating a new user we don't provide id/role/timestamps
export interface UserCreationAttributes extends Optional<
  UserAttributes,
  'id' | 'role' | 'createdAt' | 'updatedAt'
> {}

const User = sequelize.define<Model<UserAttributes, UserCreationAttributes>>('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING(254),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(128),
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'user',
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

export default User;
