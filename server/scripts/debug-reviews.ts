import { sequelize } from '../src/sequelize';
import Review from '../src/models/Review';

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');
    const res = await Review.findAndCountAll({ attributes: ['id'] });
    console.log('OK', res.count);
    process.exit(0);
  } catch (err) {
    console.error('ERR', err);
    process.exit(1);
  }
})();