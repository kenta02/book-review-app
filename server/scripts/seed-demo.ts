import bcrypt from 'bcrypt';
import { sequelize } from '../src/sequelize';
import User from '../src/models/Users';
import Book from '../src/models/Book';
import Review from '../src/models/Review';
import Comment from '../src/models/Comment';
import Favorite from '../src/models/Favorite';

async function main() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    // WARNING: this clears related tables in a safe dev order
    await Favorite.destroy({ where: {} });
    await Comment.destroy({ where: {} });
    await Review.destroy({ where: {} });
    await Book.destroy({ where: {} });
    await User.destroy({ where: {} });

    const pw = await bcrypt.hash('password', 10);

    const [alice, bob, charlie] = await Promise.all([
      User.create({ username: 'alice', email: 'alice@example.com', password: pw }),
      User.create({ username: 'bob', email: 'bob@example.com', password: pw }),
      User.create({ username: 'charlie', email: 'charlie@example.com', password: pw }),
    ]);

    const [book1, book2] = await Promise.all([
      Book.create({
        title: 'Clean Code',
        author: 'Robert C. Martin',
        publicationYear: 2008,
        ISBN: '9780132350884',
        summary: 'A handbook of agile software craftsmanship',
      }),
      Book.create({
        title: 'Design Patterns',
        author: 'Erich Gamma et al.',
        publicationYear: 1994,
        ISBN: '9780201633610',
        summary: 'Elements of Reusable Object-Oriented Software',
      }),
    ]);

    const [review1, review2] = await Promise.all([
      Review.create({
        bookId: book1.get('id') as number,
        userId: bob.get('id') as number,
        content: 'とても役立ちました',
        rating: 5,
      }),
      Review.create({
        bookId: book2.get('id') as number,
        userId: alice.get('id') as number,
        content: '良い概観ですが古い部分もあり',
        rating: 4,
      }),
    ]);

    // 追加のダミーレビュー（フロント開発用に複数）
    await Promise.all([
      Review.create({
        bookId: book1.get('id') as number,
        userId: alice.get('id') as number,
        content: '導入部分が良かった',
        rating: 4,
      }),
      Review.create({
        bookId: book1.get('id') as number,
        userId: charlie.get('id') as number,
        content: '具体例がもっと欲しい',
        rating: 3,
      }),
      Review.create({
        bookId: book1.get('id') as number,
        userId: bob.get('id') as number,
        content: 'リファクタの章が素晴らしい',
        rating: 5,
      }),
      Review.create({
        bookId: book1.get('id') as number,
        userId: alice.get('id') as number,
        content: 'サンプルコードが有用でした',
        rating: 4,
      }),
      Review.create({
        bookId: book1.get('id') as number,
        userId: charlie.get('id') as number,
        content: '章ごとのまとめが分かりやすい',
        rating: 4,
      }),
      // 長文レビュー（トランケーション確認用）
      Review.create({
        bookId: book1.get('id') as number,
        userId: bob.get('id') as number,
        content: '長文レビュー: '.repeat(80),
        rating: 4,
      }),
    ]);

    await Promise.all([
      Comment.create({
        reviewId: review1.get('id') as number,
        userId: charlie.get('id') as number,
        content: '同感です！',
        parentId: null,
      }),
      Comment.create({
        reviewId: review2.get('id') as number,
        userId: bob.get('id') as number,
        content: '補足: 具体例が良い',
        parentId: null,
      }),
    ]);

    await Promise.all([
      Favorite.create({ userId: alice.get('id') as number, bookId: book1.get('id') as number }),
      Favorite.create({ userId: bob.get('id') as number, bookId: book2.get('id') as number }),
    ]);

    console.log('Seed completed: users=3, books=2, reviews=2, comments=2, favorites=2');
    console.log(
      'Logins: email/password = alice@example.com/password, bob@example.com/password, charlie@example.com/password'
    );
    process.exit(0);
  } catch (err) {
    console.error('Seed failed', err);
    process.exit(1);
  }
}

main();
