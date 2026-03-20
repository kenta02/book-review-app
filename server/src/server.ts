import app from './app';
import { sequelize } from './sequelize';
// モデル定義と関連付けを確実に読み込む
import './models';

const port = process.env.PORT || 3000;

(async () => {
  try {
    // DB接続確認
    await sequelize.authenticate();
    console.info('✅ DB connected');

    // テーブル作成(開発環境のみ)
    // alter: true を指定すると、既存テーブルの変更点を反映する
    // 注意：本番環境では使用しないこと
    await sequelize.sync({ force: false });
    console.info('✅ DB synced');

    // サーバー起動
    app.listen(port, () => console.info(`🚀 API running on http://localhost:${port}`));
  } catch (err) {
    console.error('❌ DB connection failed:', err);
    process.exit(1);
  }
})();
