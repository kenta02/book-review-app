# Book Review App - Server

サーバーの起動と開発に関するコマンドをまとめています。

## 📋 事前準備

### MySQLのセットアップ

```bash
# MySQLが起動していることを確認
sudo systemctl start mysql
sudo systemctl status mysql
```

### データベースとユーザーの作成

```bash
sudo mysql -e "
CREATE DATABASE IF NOT EXISTS book_review;
CREATE USER IF NOT EXISTS 'app'@'localhost' IDENTIFIED BY 'apppass';
GRANT ALL PRIVILEGES ON book_review.* TO 'app'@'localhost';
FLUSH PRIVILEGES;
"
```

### 環境変数の設定

`.env` ファイルが以下の内容で存在することを確認してください：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=app
DB_PASS=apppass
DB_NAME=book_review
```

## 🚀 コマンド

### 1. APIサーバーの起動

```bash
npm run dev
```

**目的：** 
- REST APIサーバーをポート `3001` で起動
- データベースに接続し、テーブルを自動作成・同期

**出力例：**
```
✅ DB connected
✅ DB synced
🚀 API running on http://localhost:3001
```

**アクセス可能なエンドポイント：**
- `GET http://localhost:3001/api/books` - 書籍一覧取得
- `POST http://localhost:3001/api/auth/register` - ユーザー登録
- その他のAPIエンドポイント

---

### 2. Swagger UIサーバーの起動

```bash
npm run swagger
```

**目的：**
- Swagger UIをポート `8080` で起動
- OpenAPI仕様を視覚的に確認・テスト可能にする
- APIサーバーへのプロキシ機能を提供

**出力例：**
```
📚 Swagger UI running on http://localhost:8080
📄 OpenAPI spec: http://localhost:8080/openapi.yaml
💾 OpenAPI JSON: http://localhost:8080/openapi.json
🔀 API proxy: http://localhost:8080/api/* -> http://localhost:3001/api/*
```

**アクセス方法：**
- ブラウザで [http://localhost:8080](http://localhost:8080) を開く
- OpenAPI仕様に基づいて、APIエンドポイントの動作確認・テストが可能

---

## 🔄 開発時の推奨フロー

1. **ターミナル1でAPIサーバーを起動：**
   ```bash
   npm run dev
   ```
   待機：`🚀 API running on http://localhost:3001` が表示されるまで

2. **ターミナル2でSwagger UIを起動：**
   ```bash
   npm run swagger
   ```

3. **ブラウザで [http://localhost:8080](http://localhost:8080) を開く**
   - API定義が表示され、エンドポイントのテストが可能

---

## ⚠️ トラブルシューティング

### `npm run dev` で DB接続エラーが出る場合

```
❌ DB connection failed: ConnectionRefusedError [SequelizeConnectionRefusedError]: connect ECONNREFUSED 127.0.0.1:3306
```

**解決方法：**
```bash
# MySQLサーバーを起動
sudo systemctl start mysql

# 接続確認
mysql -u app -p -h localhost book_review -e "SELECT 1;"
# パスワード: apppass
```

### `npm run swagger` で Parser error が出る場合

- ブラウザキャッシュをクリア（Ctrl+Shift+Delete）
- Swagger UIサーバーを再起動
- `http://localhost:8080/openapi.yaml` が YAML を返しているか確認

### APIサーバーが起動していない場合

Swagger UIで以下のエラーが表示されます：

```
Failed to fetch http://localhost:3001/api
```

**解決方法：**
- 別のターミナルで `npm run dev` を実行

---

## 📚 参考資料

- OpenAPI仕様：[openapi.yaml](src/openapi.yaml)
- データベース設計：[../../docs/specs/DATABASE.md](../../docs/specs/DATABASE.md)
