# Architecture - 実装チェックリスト

新しいモジュールやフィーチャーを追加する際にご確認ください。

## ディレクトリ構造

- [ ] 機能別フォルダ配下に `components/`, `hooks/`, `api/`, `types/`, `store/` を作成
- [ ] ファイルはケバブケース（`book-list.tsx` など）で命名
- [ ] `index.ts` でエクスポートをまとめている

## 依存関係

- [ ] Components は Hooks、Utils、Components のみに依存
- [ ] Hooks は API、Store、Utils に依存
- [ ] Pages は ONLY で Features に依存（他に直接依存しない）
- [ ] Store は Services、API に依存しない（単方向フロー）

## モジュール分離

- [ ] ビジネスロジックは Custom Hook に集約
- [ ] UI ロジックはコンポーネント内に集約
- [ ] 他の機能への依存関係をなるべく避ける（疎結合）

## バックエンド（サーバー）

- [ ] Controllers: リクエスト/レスポンスハンドリングのみ
- [ ] Services: ビジネスロジック、複雑な処理
- [ ] Repositories: データベースアクセスのみ
- [ ] 循環依存がないか確認

## 型定義

- [ ] 各モジュールで `types/index.ts` を作成
- [ ] グローバル型は `types/` に集約
- [ ] 他モジュールの型をインポートする際は最小限に

## テスト

- [ ] テストファイルを `__tests__/` または `.test.ts` で配置
- [ ] テスト対象ファイルと同じ階層に配置
