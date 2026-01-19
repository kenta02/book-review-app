import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize";

const Favorite = sequelize.define("Favorite", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  bookId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Books",
      key: "id",
    },
    onDelete: "RESTRICT",
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

export default Favorite;
