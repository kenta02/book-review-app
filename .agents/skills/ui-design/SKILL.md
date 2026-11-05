---
id: "ui-design"
name: "UI 実装・スタイリング"
version: "1.0.0"
author: "kenta02"
visibility: "internal"
language: "ja"
tags: ["ui", "design", "frontend", "react"]
description: "React コンポーネント設計、Tailwind CSS、アクセシビリティに関するガイドライン"
---

# UI 実装・スタイリング

## コンポーネント設計

- React コンポーネントは関数コンポーネント + TypeScript で実装。
- 再利用性を優先し、Props と子要素を明確に設計。
  - 例: `BookCard`, `BookList`, `ReviewForm`, `RatingStars` など。
- 単一責任原則に従い、複雑なロジックは Custom Hook に抽出。

## スタイリング

- **Tailwind CSS**: クラスベースのスタイリングを基本。
- **カスタムユーティリティ**: `src/styles` または `tailwind.config.js` に定義。
- **CSS-in-JS**: 動的スタイルが必要な場合は Emotion や Styled Components を検討。

## アクセシビリティ（a11y）

- キーボード操作をサポート（Tab キーナビゲーション）。
- ARIA 属性を適切に設定（`aria-label`, `aria-describedby`, `role` など）。
- スクリーンリーダー対応を意識。

## UI ライブラリ

- **UI ライブラリ**: 指定なし。モーダル等は Tailwind CSS と標準 HTML / ARIA で実装し、必要になった時点で選定する。
- **アイコン**: 指定なし（必要になった時点で選定）。
- **画像最適化**: WebP/AVIF、lazy loading、responsive images を活用。
