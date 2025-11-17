// server/src/models/index.ts
import User from "./Users";
import Book from "./Book";
import Review from "./Review";
import Favorite from "./Favorite";
import Comment from "./Comment";

// User と Review の関連付け
User.hasMany(Review, { foreignKey: "userId" });
Review.belongsTo(User, { foreignKey: "userId" });

// Book と Review の関連付け
Book.hasMany(Review, { foreignKey: "bookId" });
Review.belongsTo(Book, { foreignKey: "bookId" });

// User と Favorite の関連付け
User.hasMany(Favorite, { foreignKey: "userId" });
Favorite.belongsTo(User, { foreignKey: "userId" });

// Book と Favorite の関連付け
Book.hasMany(Favorite, { foreignKey: "bookId" });
Favorite.belongsTo(Book, { foreignKey: "bookId" });

// Review と Comment の関連付け
Review.hasMany(Comment, { foreignKey: "reviewId" });
Comment.belongsTo(Review, { foreignKey: "reviewId" });

// Commentの自己参照の関連付け
// Comment の自己参照（親コメント → 子コメント）
Comment.hasMany(Comment, { foreignKey: "parentId", as: "replies" });
Comment.belongsTo(Comment, {
  foreignKey: "parentId",
  as: "parent",
});
