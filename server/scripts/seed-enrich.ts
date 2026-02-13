import { sequelize } from '../src/sequelize';
import User from '../src/models/Users';
import Book from '../src/models/Book';
import Review from '../src/models/Review';
import Comment from '../src/models/Comment';
import Favorite from '../src/models/Favorite';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// simple argv parsing: --reviews --comments --favorites
const argv = process.argv.slice(2);
const opts: Record<string, number> = { reviews: 30, comments: 20, favorites: 10 };
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--reviews' && argv[i + 1]) {
    opts.reviews = parseInt(argv[i + 1], 10) || opts.reviews;
    i++;
  } else if (argv[i] === '--comments' && argv[i + 1]) {
    opts.comments = parseInt(argv[i + 1], 10) || opts.comments;
    i++;
  } else if (argv[i] === '--favorites' && argv[i + 1]) {
    opts.favorites = parseInt(argv[i + 1], 10) || opts.favorites;
    i++;
  }
}

async function main() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const users = await User.findAll();
    const books = await Book.findAll();
    if (users.length === 0 || books.length === 0) {
      console.error('Require at least 1 user and 1 book in DB. Run seed-demo or seed-books first.');
      process.exit(1);
    }

    const createdReviews = [];
    for (let i = 0; i < opts.reviews; i++) {
      const user = users[randInt(0, users.length - 1)];
      const book = books[randInt(0, books.length - 1)];
      const review = await Review.create({
        bookId: book.get('id') as number,
        userId: user.get('id') as number,
        content: `自動投入レビュー #${Date.now().toString().slice(-5)}-${i}`,
        rating: randInt(1, 5),
      });
      createdReviews.push(review);
    }

    for (let i = 0; i < opts.comments; i++) {
      const review = createdReviews[randInt(0, createdReviews.length - 1)];
      const user = users[randInt(0, users.length - 1)];
      await Comment.create({
        reviewId: review.get('id') as number,
        userId: user.get('id') as number,
        content: `自動投入コメント #${i + 1}`,
        parentId: null,
      });
    }

    let favsCreated = 0;
    const attemptsLimit = opts.favorites * 5;
    let attempts = 0;
    while (favsCreated < opts.favorites && attempts < attemptsLimit) {
      attempts++;
      const user = users[randInt(0, users.length - 1)];
      const book = books[randInt(0, books.length - 1)];
      const exist = await Favorite.findOne({ where: { userId: user.get('id'), bookId: book.get('id') } });
      if (!exist) {
        await Favorite.create({ userId: user.get('id') as number, bookId: book.get('id') as number });
        favsCreated++;
      }
    }

    console.log(`Seed-enrich completed: reviews=${createdReviews.length}, comments=${opts.comments}, favorites=${favsCreated}`);
    process.exit(0);
  } catch (err) {
    console.error('seed-enrich failed', err);
    process.exit(1);
  }
}

main();
