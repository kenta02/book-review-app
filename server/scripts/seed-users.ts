import bcrypt from 'bcrypt';
import { sequelize } from '../src/sequelize';
import User from '../src/models/Users';

// simple argv parsing
const argv = process.argv.slice(2);
let count = 10;
let rawPassword = 'password';
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--count' && argv[i + 1]) {
    count = parseInt(argv[i + 1], 10) || count;
    i++;
  } else if (argv[i] === '--password' && argv[i + 1]) {
    rawPassword = argv[i + 1];
    i++;
  }
}

async function main() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const created: { username: string; email: string }[] = [];
    const hash = await bcrypt.hash(rawPassword, 10);

    for (let i = 0; i < count; i++) {
      const suffix = `${Date.now().toString().slice(-5)}_${i}`;
      const username = `seed_user_${suffix}`;
      const email = `seed${Date.now().toString().slice(-5)}_${i}@example.com`;

      // ensure uniqueness safety: if exists, skip
      const exist = await User.findOne({ where: { email } });
      if (exist) continue;

      await User.create({ username, email, password: hash });
      created.push({ username, email });
    }

    console.log(`Created ${created.length} users (password: ${rawPassword})`);
    if (created.length > 0) console.table(created.slice(0, 10));
    process.exit(0);
  } catch (err) {
    console.error('seed-users failed', err);
    process.exit(1);
  }
}

main();
