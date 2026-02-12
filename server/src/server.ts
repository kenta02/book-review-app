import app from './app';
import { sequelize } from './sequelize';

const port = process.env.PORT || 3001;

(async () => {
  try {
    // DB接続確認
    await sequelize.authenticate();
    console.log('✅ DB connected');

    // テーブル作成(開発環境のみ)
    // alter: true を指定すると、既存テーブルの変更点を反映する
    // 注意：本番環境では使用しないこと
    await sequelize.sync({ force: true });
    console.log('✅ DB synced');

    // サーバー起動
    app.listen(port, () => console.log(`🚀 API running on http://localhost:${port}`));
  } catch (err) {
    console.error('❌ DB connection failed:', err);
    process.exit(1);
  }
})();
