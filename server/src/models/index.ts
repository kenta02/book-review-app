// server/src/models/index.ts
import User from './Users';
import Book from './Book';
import Review from './Review';
import Favorite from './Favorite';
import Comment from './Comment';
import ReviewVote from './ReviewVote';
import Notification from './Notification';

// User と Review の関連付け
User.hasMany(Review, {
  foreignKey: 'userId',
  onDelete: 'SET NULL',
  constraints: true,
});
Review.belongsTo(User, {
  foreignKey: 'userId',
});

// Book と Review の関連付け
Book.hasMany(Review, { foreignKey: 'bookId' });
Review.belongsTo(Book, { foreignKey: 'bookId' });

// Review と ReviewVote の関連付け
Review.hasMany(ReviewVote, {
  foreignKey: 'reviewId',
  onDelete: 'CASCADE',
  constraints: true,
});
ReviewVote.belongsTo(Review, { foreignKey: 'reviewId' });

// User と ReviewVote の関連付け
User.hasMany(ReviewVote, {
  foreignKey: 'userId',
  onDelete: 'SET NULL',
  constraints: true,
});
ReviewVote.belongsTo(User, { foreignKey: 'userId' });

// User と Favorite の関連付け
User.hasMany(Favorite, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
  constraints: true,
});
Favorite.belongsTo(User, { foreignKey: 'userId' });

// Book と Favorite の関連付け
Book.hasMany(Favorite, { foreignKey: 'bookId' });
Favorite.belongsTo(Book, { foreignKey: 'bookId' });

// Review と Comment の関連付け
Review.hasMany(Comment, {
  foreignKey: 'reviewId',
  onDelete: 'CASCADE',
  constraints: true,
});
Comment.belongsTo(Review, { foreignKey: 'reviewId' });

// User と Comment の関連付け
User.hasMany(Comment, {
  foreignKey: 'userId',
  onDelete: 'SET NULL',
  constraints: true,
});
Comment.belongsTo(User, { foreignKey: 'userId' });

// Commentの自己参照の関連付け
// Comment の自己参照（親コメント → 子コメント）
Comment.hasMany(Comment, {
  foreignKey: 'parentId',
  as: 'replies',
  onDelete: 'SET NULL',
  constraints: true,
});
Comment.belongsTo(Comment, {
  foreignKey: 'parentId',
  as: 'parent',
});

// User と Notification の関連付け
User.hasMany(Notification, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
  constraints: true,
});
Notification.belongsTo(User, { foreignKey: 'userId' });
