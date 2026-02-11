import bcrypt from 'bcrypt';
import { sequelize } from '../src/sequelize';
import User from '../src/models/Users';

async function main() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const pw = await bcrypt.hash('password123', 10);

    // Upsert style: find or create, if exists update password
    const [user, created] = await User.findOrCreate({
      where: { email: 'tanaka@example.com' },
      defaults: {
        username: 'tanaka',
        email: 'tanaka@example.com',
        password: pw,
      },
    });

    if (!created) {
      await user.update({ password: pw, username: 'tanaka' });
      console.log('User existed: updated password and username');
    } else {
      console.log('User created: tanaka@example.com');
    }

    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed', err);
    process.exit(1);
  }
}

main();
