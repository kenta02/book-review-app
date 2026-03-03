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

### 0. テストデータ（Seeder）

開発用のテストデータを投入するスクリプトを `server/scripts/seed-demo.ts` に用意しました。
`package.json` に npm スクリプトも追加してあるので、プロジェクトルートから実行できます。
スクリプトは再実行しても既存データを重複作成せず、新規のみ追加するよう改善されています。

```bash
# プロジェクトルートまたは server/ ディレクトリから実行
npm run seed-demo

# あるいは ts-node を直接使う場合
# ts-node が未インストールなら npx を利用
npx ts-node server/scripts/seed-demo.ts

# 実行後：users=3, books=6, reviews=8, comments=2, favorites=2 のデモデータ定義が適用されます
# （既にレコードがある場合は重複せずにスキップされます）
```

---

## 🚀 コマンド

### 1. APIサーバーの起動

```bash
npm run dev
```

**目的：**

- REST APIサーバーをポート `300` で起動
- データベースに接続し、テーブルを自動作成・同期

**出力例：**

```
✅ DB connected
✅ DB synced
🚀 API running on http://localhost:300
```

**アクセス可能なエンドポイント：**

- `GET http://localhost:300/api/books` - 書籍一覧取得
- `POST http://localhost:300/api/auth/register` - ユーザー登録
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
🔀 API proxy: http://localhost:8080/api/* -> http://localhost:300/api/*
```

**アクセス方法：**

- ブラウザで [http://localhost:8080](http://localhost:8080) を開く
- OpenAPI仕様に基づいて、APIエンドポイントの動作確認・テストが可能

> ⚠️ **重要**: Swagger UI はバックエンドのプロキシとして動作します。
> そのため、APIサーバー (`npm run dev`) を同時に起動しておかないと、
> リクエストがタイムアウトし続け **Loading 中のまま** になります。
> **開発時の認証トークンについて（便利な補助コマンド）**

開発・テスト時に毎回ログインしてトークンを取得するのが手間な場合、ヘルパースクリプト `get-token` を用意しています。ログインして取得した JWT を標準出力に表示するため、Swagger の Authorize へ貼り付けたり、`curl` の検証に利用できます。

- 実行例（seed データに含まれるユーザーでログイン）：

  デフォルトで投入されるテストユーザーは `alice`/`bob`/`charlie` に加えて README 内の例に合わせて `tanaka` がいます。
  パスワードはいずれも `password123` です。

  `npm run seed-demo` は同じ e-mail が存在すればパスワードも上書きするように改良されているので、
  変更があった場合は再実行するだけで OK です。
  ただし `tanaka` のパスワードだけを個別にリセットしたいときは `npm run seed-tanaka` を使ってください。

```bash
# サーバー配下（推奨）
cd server
npm run token -- --email tanaka@example.com --password password123

# またはプロジェクトルートから（ディレクトリ移動したくない場合）
npm --prefix server run token -- --email tanaka@example.com --password password123
```

- 出力例：

```
=== TOKEN ===
<JWT_TOKEN>
=== END TOKEN ===

curl example:
curl -H "Authorization: Bearer <JWT_TOKEN>" http://localhost:3000/api/auth/me
```

(パスワードやアカウントが間違っているとログイン失敗エラーが表示されます。まず `npm run seed-demo` してユーザーを投入するか、`/api/auth/register` で自分でアカウントを作成してください。)

- オプション：`--save` をつけると `server/.env` に `TEST_TOKEN=<JWT_TOKEN>` を追記します（ローカル限定の利便性向上。`.env` はコミットしないでください）。

**補足**: パスワードを変更したり、特定のユーザーのみをリセットしたりする場合は以下のコマンドが便利です。

```bash
# 全ユーザーのパスワードをデフォルト（password123）に更新する
npm run seed-demo

# tanaka@example.com のみパスワードを (再)設定する
npm run seed-tanaka
```

---

## 🔄 開発時の推奨フロー

1. **ターミナル1でAPIサーバーを起動：**

   ```bash
   npm run dev
   ```

   待機：`🚀 API running on http://localhost:300` が表示されるまで

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
Failed to fetch http://localhost:300/api
```

**解決方法：**

- 別のターミナルで `npm run dev` を実行

---

## 📚 参考資料

- OpenAPI仕様：[openapi.yaml](src/openapi.yaml)
- データベース設計：[../../docs/specs/DATABASE.md](../../docs/specs/DATABASE.md)
