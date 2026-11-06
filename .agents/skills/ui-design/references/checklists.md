# UI Design - 実装チェックリスト

## Tailwind CSS

- [ ] `tailwind.config.js` でテーマ・拡張設定完了
- [ ] ユーティリティクラスで一貫性のあるスタイル
- [ ] カスタムカラー・サイズは設定で定義
- [ ] ダークモード対応を検討
- [ ] `@apply` でコンポーネントスタイル集約（最小限）

## React コンポーネント設計

- [ ] Props を interface で型定義
- [ ] デフォルト値を設定（variant, size など）
- [ ] コンポーネント分割（Button, Card, Modal など）
- [ ] children プロップで柔軟性確保
- [ ] TypeScript で型安全に

## レスポンシブデザイン

- [ ] モバイル優先で設計（sm: → md: → lg: → xl:）
- [ ] Tailwind ブレークポイント活用
- [ ] 画像の lazy loading 実装
- [ ] 複数デバイスで動作確認

## モーダル・ダイアログ

- [ ] `role="dialog"` と `aria-modal="true"`、タイトルの関連付け（`aria-labelledby`）
- [ ] Esc キーで閉じられ、フォーカスが戻る
- [ ] スタイルは Tailwind で

## アクセシビリティ（a11y）

- [ ] セマンティック HTML（article, nav, aside など）
- [ ] ARIA 属性（role, aria-label, aria-describedby）
- [ ] キーボードナビゲーション対応（Tab, Enter, Esc）
- [ ] フォーカス管理（:focus-visible）
- [ ] 色覚障害対応（色のみに頼らない）

## パフォーマンス

- [ ] 画像最適化（WebP, AVIF）
- [ ] Lazy loading（Intersection Observer）
- [ ] CSS-in-JS 最小限化（Tailwind 推奨）
- [ ] 不要な再レンダリング防止

## ダークモード（オプション）

- [ ] `dark:` クラス活用
- [ ] システム設定を尊重
- [ ] contrast 確認

## テスト

- [ ] コンポーネント描画テスト
- [ ] ユーザーイベント テスト
- [ ] a11y テスト（axe など）
