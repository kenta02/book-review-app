import { sequelize } from '../src/sequelize';

async function describe(table: string) {
  try {
    const [rows] = await sequelize.query(`SHOW CREATE TABLE \`${table}\``);
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(`ERROR describing ${table}:`, err);
  }
}

(async () => {
  await describe('Users');
  await describe('Books');
  await describe('Reviews');
  await describe('ReviewVotes');
  await sequelize.close();
})();
