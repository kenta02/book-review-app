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

    // --- previously we wiped all tables which risked data loss.
    // Instead perform key-based insert-or-ignore (findOrCreate) so existing
    // rows remain untouched and only missing records are added.
    // the rest of the script relies on the returned instances below.

    const pw = await bcrypt.hash('password', 10);

    // --- seed data definitions ------------------------------------------------
    const userInfos = [
      { username: 'alice', email: 'alice@example.com' },
      { username: 'bob', email: 'bob@example.com' },
      { username: 'charlie', email: 'charlie@example.com' },
    ];

    const bookInfos = [
      {
        title: '吾輩は猫である',
        author: '夏目漱石',
        publicationYear: 1905,
        ISBN: '9784101010014',
        summary: '猫の視点で描かれる人間社会の風刺。',
      },
      {
        title: '雪国',
        author: '川端康成',
        publicationYear: 1947,
        ISBN: '9784101010137',
        summary: '雪深い地方で交錯する男女の恋と孤独。',
      },
      {
        title: '羅生門',
        author: '芥川龍之介',
        publicationYear: 1915,
        ISBN: '9784101010151',
        summary: '道徳と人間の本性を問う短編。',
      },
      {
        title: '風の歌を聴け',
        author: '村上春樹',
        publicationYear: 1979,
        ISBN: '9784101010212',
        summary: '都市に生きる若者たちの日常と悩み。',
      },
      {
        title: '火花',
        author: '又吉直樹',
        publicationYear: 2015,
        ISBN: '9784101010304',
        summary: '漫才師の葛藤と友情を描いた小説。',
      },
      {
        title: 'コンビニ人間',
        author: '村田沙耶香',
        publicationYear: 2016,
        ISBN: '9784101010373',
        summary: 'コンビニで働く女性の視点から社会を問う。',
      },
    ];

    const reviewInfos = [
      { bookIndex: 0, userIndex: 1, content: 'とても役立ちました', rating: 5 },
      { bookIndex: 1, userIndex: 0, content: '良い概観ですが古い部分もあり', rating: 4 },

      // 追加のダミーレビュー（フロント開発用）
      { bookIndex: 0, userIndex: 0, content: '導入部分が良かった', rating: 4 },
      { bookIndex: 0, userIndex: 2, content: '具体例がもっと欲しい', rating: 3 },
      { bookIndex: 0, userIndex: 1, content: 'リファクタの章が素晴らしい', rating: 5 },
      { bookIndex: 0, userIndex: 0, content: 'サンプルコードが有用でした', rating: 4 },
      { bookIndex: 0, userIndex: 2, content: '章ごとのまとめが分かりやすい', rating: 4 },
      // 長文レビュー（トランケーション確認用）
      { bookIndex: 0, userIndex: 1, content: '長文レビュー: '.repeat(80), rating: 4 },
    ];

    const commentInfos = [
      { reviewIndex: 0, userIndex: 2, content: '同感です！' },
      { reviewIndex: 1, userIndex: 1, content: '補足: 具体例が良い' },
    ];

    const favoriteInfos = [
      { userIndex: 0, bookIndex: 0 },
      { userIndex: 1, bookIndex: 1 },
    ];
    // --------------------------------------------------------------------------

    // concrete instance types allow us to avoid `any`
    type UserInstance = InstanceType<typeof User>;
    type BookInstance = InstanceType<typeof Book>;
    type ReviewInstance = InstanceType<typeof Review>;

    // declare containers outside transaction so they are available for the
    // final log statement below
    let users: UserInstance[] = [];
    let books: BookInstance[] = [];
    let reviews: ReviewInstance[] = [];

    // perform all insert/find operations within a single transaction
    await sequelize.transaction(async (tx) => {
      // upsert users by email (unique key)
      users = [];
      for (const u of userInfos) {
        const [user] = await User.findOrCreate({
          where: { email: u.email },
          defaults: { ...u, password: pw },
          transaction: tx,
        });
        // if password might need update each run: use getter/setter to avoid
        // TypeScript complaining about `password` property on Model<any,any>
        const currentPw = user.get('password') as string;
        if (currentPw !== pw) {
          user.set('password', pw);
          await user.save({ transaction: tx });
        }
        users.push(user);
      }

      // upsert books by ISBN
      books = [];
      for (const b of bookInfos) {
        const [book] = await Book.findOrCreate({
          where: { ISBN: b.ISBN },
          defaults: b,
          transaction: tx,
        });
        books.push(book);
      }

      const uid = (i: number) => users[i].get('id') as number;
      const bid = (i: number) => books[i].get('id') as number;

      reviews = await Promise.all(
        reviewInfos.map(
          (r) =>
            Review.create(
              {
                bookId: bid(r.bookIndex),
                userId: uid(r.userIndex),
                content: r.content,
                rating: r.rating,
              },
              { transaction: tx }
            ) as Promise<ReviewInstance>
        )
      );

      await Promise.all(
        commentInfos.map((c) =>
          Comment.create(
            {
              reviewId: reviews[c.reviewIndex].get('id') as number,
              userId: uid(c.userIndex),
              content: c.content,
              parentId: null,
            },
            { transaction: tx }
          )
        )
      );

      // upsert favorites so rerunning script is safe
      await Promise.all(
        favoriteInfos.map((f) =>
          Favorite.findOrCreate({
            where: {
              userId: uid(f.userIndex),
              bookId: bid(f.bookIndex),
            },
            defaults: { userId: uid(f.userIndex), bookId: bid(f.bookIndex) },
            transaction: tx,
          })
        )
      );
    });

    console.log(
      `Seed completed: users=${users.length}, books=${books.length}, reviews=${
        reviews.length
      }, comments=${commentInfos.length}, favorites=${favoriteInfos.length}`
    );
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
