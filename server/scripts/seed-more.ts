import { sequelize } from '../src/sequelize';
import User from '../src/models/Users';
import Book from '../src/models/Book';
import Review from '../src/models/Review';
import Comment from '../src/models/Comment';
import Favorite from '../src/models/Favorite';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const target = {
      books: 2,
      reviews: 10,
      comments: 5,
      favorites: 3,
    };

    // ensure there are users
    const users = await User.findAll();
    if (users.length === 0) {
      console.log('No users found - creating demo users');
      await User.create({ username: 'seed_user1', email: `seed1@example.com`, password: 'x' });
      await User.create({ username: 'seed_user2', email: `seed2@example.com`, password: 'x' });
    }

    const allUsers = await User.findAll();

    // create books
    const newBooks = [];
    for (let i = 0; i < target.books; i++) {
      const suffix = Date.now().toString().slice(-5) + '_' + i;
      const title = `Seed Book ${suffix}`;
      const isbn = `SEED-${Date.now()}-${i}`;
      const bk = await Book.create({
        title,
        author: `Author ${suffix}`,
        publicationYear: 2000 + (i % 20),
        ISBN: isbn,
        summary: 'This is seed book for testing.',
      });
      newBooks.push(bk);
    }

    const allBooks = await Book.findAll();

    // create reviews
    const createdReviews = [];
    for (let i = 0; i < target.reviews; i++) {
      const user = allUsers[randInt(0, allUsers.length - 1)];
      const book = allBooks[randInt(0, allBooks.length - 1)];
      const review = await Review.create({
        bookId: book.get('id') as number,
        userId: user.get('id') as number,
        content: `自動テストレビュー #${i + 1} - ${Math.random().toString(36).slice(2, 10)}`,
        rating: randInt(1, 5),
      });
      createdReviews.push(review);
    }

    // create comments
    for (let i = 0; i < target.comments; i++) {
      const review = createdReviews[randInt(0, createdReviews.length - 1)];
      const user = allUsers[randInt(0, allUsers.length - 1)];
      await Comment.create({
        reviewId: review.get('id') as number,
        userId: user.get('id') as number,
        content: `自動テストコメント #${i + 1}`,
        parentId: null,
      });
    }

    // create favorites (ensure uniqueness)
    let favsCreated = 0;
    const attemptsLimit = 20;
    let attempts = 0;
    while (favsCreated < target.favorites && attempts < attemptsLimit) {
      attempts++;
      const user = allUsers[randInt(0, allUsers.length - 1)];
      const book = allBooks[randInt(0, allBooks.length - 1)];
      const exist = await Favorite.findOne({
        where: { userId: user.get('id'), bookId: book.get('id') },
      });
      if (!exist) {
        await Favorite.create({
          userId: user.get('id') as number,
          bookId: book.get('id') as number,
        });
        favsCreated++;
      }
    }

    console.log(
      `Seed-more completed: books=${target.books}, reviews=${target.reviews}, comments=${target.comments}, favorites=${favsCreated}`
    );
    process.exit(0);
  } catch (err) {
    console.error('Seed-more failed', err);
    process.exit(1);
  }
}

main();
