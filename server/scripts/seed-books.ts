import { sequelize } from '../src/sequelize';
import Book from '../src/models/Book';
import User from '../src/models/Users';

// simple argv parsing for --count
const argv = process.argv.slice(2);
let count = 20;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--count' && argv[i + 1]) {
    count = parseInt(argv[i + 1], 10) || count;
    i++;
  }
}

async function main() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const users = await User.findAll();
    if (users.length === 0) {
      console.log('No users found - create at least one user (seed-tanaka or seed-demo)');
    }

    const created: any[] = [];
    for (let i = 0; i < count; i++) {
      const suffix = `${Date.now().toString().slice(-5)}_${i}`;
      const title = `Seeded Book ${suffix}`;
      // keep ISBN <= 20 chars to match DB schema (unique-ish)
      const shortSuffix = (Date.now().toString().slice(-6) + i).slice(0, 10);
      const isbn = `SEED-${shortSuffix}`; // e.g. SEED-12345678
      const bk = await Book.create({
        title,
        author: `Author ${i + 1}`,
        publicationYear: 1990 + (i % 30),
        ISBN: isbn,
        summary: `自動生成されたテスト用書籍 (${i + 1})`,
      });
      created.push(bk);
    }

    console.log(`Created ${created.length} books`);
    process.exit(0);
  } catch (err) {
    console.error('seed-books failed', err);
    process.exit(1);
  }
}

main();
