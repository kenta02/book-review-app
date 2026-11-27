---
name: security
description: 認証・認可、入力検証、データ保護に関わる実装・レビューのときに使う
---

# セキュリティ・認証

本書籍レビューアプリのセキュリティポリシーと実装ガイドラインです。
「現状」は実装済みの内容、「未導入」はまだ実装がない内容です。未導入の項目を、あるものとして扱わないでください。

## 認証

- **方式**: JWT。`Authorization: Bearer <token>` ヘッダーで送信する。
- **有効期限**: 30 日の単一トークン（`server/src/services/auth.service.ts`）。
- **権限の判定**: role はトークンに含めない。認証ミドルウェアが毎回 DB から読む。
- **ミドルウェア**: `authenticateToken` / `requireAdmin`（`server/src/middleware/auth.ts`）。
- **クライアントの保存先**: `sessionStorage`（理由は `docs/adr/0001-jwt-storage.md`）。localStorage には保存しない。

## 認可

| 操作                                   | 必要な権限         |
| -------------------------------------- | ------------------ |
| 書籍・レビュー・コメントの参照         | 不要（公開）       |
| ユーザープロフィールの参照             | 不要（公開）       |
| レビュー投稿、コメント投稿             | ログイン           |
| レビューの編集・削除                   | 投稿者本人か管理者 |
| 書籍の登録・更新・削除                 | 管理者             |

## データ保護

- **パスワード**: bcrypt（cost: 10）でハッシュ化して保存する。8 文字以上。
- **クライアント**: パスワードは保存しない。
- **機密情報**: DB 接続情報や `JWT_SECRET` は環境変数（`.env`）で管理し、コミットしない。
- **HTTPS**: 本番環境では必須とする。

## API セキュリティ

- **入力バリデーション**: `server/src/validators/` の自前の検証関数を使う（`express-validator` や Zod は未導入）。
- **HTTP ヘッダー**: `helmet` を適用している。
- **CORS**: `server/src/app.ts` で設定する。許可オリジンは環境変数 `CORS_ORIGINS`（カンマ区切り）。
- **ボディサイズ**: JSON は 10kb まで。
- **エラー**: 実装の詳細を返さない。ログイン失敗は、ユーザーの有無が分からない同一のエラーにする。
- **SQL インジェクション**: Sequelize を使い、生の SQL では `replacements` でバインドする。

## ログ

- `server/src/utils/logger.ts` を使う。改行と ESC 文字を除去して出力する。
- パスワードやトークン本体は記録しない。
- `logger.info` は本番環境では出力されない。

## 依存関係

- 脆弱性の確認は `pnpm audit`。更新は Dependabot の PR も確認する。

## 未導入

- ログインの回数制限（rate limiter）
- 短い有効期限のアクセストークンと、リフレッシュトークン
- httpOnly Cookie でのトークン保持
- 監査ログ（ログの保存・ローテーションを含む）

## ドキュメント連携

- API の設計は [バックエンド連携・認証](../backend-integration/SKILL.md) を参照。
- コーディング規約は [コーディング規約](../coding-standards/SKILL.md) を参照。
