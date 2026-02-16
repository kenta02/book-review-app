import path from 'path';
import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from '../src/sequelize';
import { Sequelize } from 'sequelize';

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

const umzug = new Umzug({
  migrations: {
    glob: path.join(MIGRATIONS_DIR, '*.js'),
    // migration ファイルは `module.exports = { up(queryInterface, Sequelize), down(...) }` になっている想定
    resolve: ({ name, path: migrationPath }: { name: string; path?: string }) => {
      if (!migrationPath) throw new Error(`migration path is undefined for ${name}`);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const migration = require(migrationPath);
      return {
        name,
        up: async () => migration.up(sequelize.getQueryInterface(), Sequelize),
        down: async () => migration.down(sequelize.getQueryInterface(), Sequelize),
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

async function run() {
  const cmd = process.argv[2] || 'up';
  try {
    if (cmd === 'up') {
      const executed = await umzug.up();
      console.log('MIGRATIONS: executed ->', executed.map((m) => m.name));
    } else if (cmd === 'down') {
      const reverted = await umzug.down();
      console.log('MIGRATIONS: reverted ->', reverted.map((m) => m.name));
    } else if (cmd === 'status') {
      const executed = await umzug.executed();
      const pending = await umzug.pending();
      console.log('MIGRATIONS executed:', executed.map((m) => m.name));
      console.log('MIGRATIONS pending :', pending.map((m) => m.name));
    } else if (cmd === 'pending') {
      const pending = await umzug.pending();
      console.log('MIGRATIONS pending :', pending.map((m) => m.name));
    } else {
      console.error('Unknown migration command:', cmd);
      process.exit(1);
    }

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('MIGRATIONS: error', err);
    await sequelize.close();
    process.exit(1);
  }
}

run();
