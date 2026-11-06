---
id: "architecture"
name: "アーキテクチャ・ディレクトリ構成"
version: "1.0.0"
author: "kenta02"
visibility: "internal"
language: "ja"
tags: ["architecture","design"]
description: "プロジェクトのファイル/モジュール配置や機能分離に関するガイドライン"
---

# アーキテクチャ・ディレクトリ構成

本書籍レビュー・管理アプリケーション専用の構成ガイドです。

## 基本方針

- 機能ごとにモジュールを分離し、再利用性とテスト容易性を高める（例: 書籍検索／レビュー投稿／ユーザ管理など）。
- フロントエンドとバックエンドを明確に分け、それぞれに独立したビルドとテストセットを持つ。
- 共通ユーティリティは `shared` や `utils` として独立ディレクトリに配置。
- ディレクトリ命名はケバブケース、ファイルはキャメルケースを基本とする。

## ディレクトリ例

```
book-review-app/
├── client/        # React アプリ
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/
│   │   └── types/
│   └── ...
├── server/        # Node/Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── models/
│   └── ...
├── docs/          # ドキュメント
└── scripts/       # 開発支援スクリプト
```

## 注意点

- 増えすぎたディレクトリは機能別サブディレクトリでまとめる。
- アーキテクチャ変更時はドキュメントを更新し、チームで共有する。
