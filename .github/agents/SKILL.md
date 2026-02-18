---
id: skill-spec
name: "SKILL Spec"
version: "1.0.0"
author: "kenta02"
visibility: "internal"
language: "ja"
tags: ["agent","skill","prompt-template"]
description: "Agent 用の SKILL 定義テンプレートとベストプラクティス（参考: TooMe の考察）"
---

# SKILL definition (テンプレート & ガイド)

概要
- 目的: エージェントが実行できる『能力（skill）』を明示的に定義し、再利用・検証・自動化を容易にする。
- 本ファイルは Qiita (TooMe) の考察を参考に、プロジェクトで使う SKILL の標準フォーマットと注意点をまとめたものです。

> 参考: TooMe — prompt/agent に関する考察（https://qiita.com/TooMe）

---

## 使いどころ
- Agent に新しい振る舞い（例: `code-review`, `create-test`, `refactor-suggestion`）を追加する際の仕様書。 
- CI／ツール用に「実行可能」な出力フォーマットを指定するためのテンプレート。

---

## SKILL 構造（推奨フォーマット）

- id: ユニークな識別子（例: `code-review.v1`）
- name: 表示名
- short_description: 1 行サマリ
- description: 詳細な説明（目的・前提・期待結果）
- inputs: 入力スキーマ（キー／型／必須／説明）
- outputs: 出力スキーマ（JSON schema 推奨）
- constraints: 実行時の制約（時間、権限、外部アクセス禁止など）
- examples: 入出力例（few‑shot / success case）
- evaluation: 検証方法と合格基準（ユニットテスト or QA チェック）
- version: バージョン
- owner: 担当者／チーム

---

## SKILL テンプレート（コピーして使える例）

```yaml
id: code-review.v1
name: "Code Review (Minimal)"
short_description: "PR の差分から主要な品質問題を抽出して修正案を出す"
description: |
  Input: Git diff or PR link.  
  Goal: Detect correctness, readability, performance, and security issues; provide minimal patch suggestions and tests.
inputs:
  - name: diff
    type: string
    required: true
    description: "git diff または PR の差分テキスト"
outputs:
  - name: findings
    type: array
    items:
      type: object
      properties:
        severity: { type: string }
        location: { type: string }
        message: { type: string }
        suggestion: { type: string }
constraints:
  - "Do not call external network resources"
  - "Max output size: 3000 chars"
examples:
  - input: "diff --git a/src/foo.ts b/src/foo.ts..."
    output: |
      - severity: high
        location: src/foo.ts:23
        message: "未処理の例外が発生する可能性があります"
        suggestion: "try/catch を追加して適切にハンドリングしてください"
evaluation:
  - "型チェック通過（tsc）"
  - "ユニットテスト追加 or 既存テストに影響なし"
version: "1.0.0"
owner: "backend-team"
```

---

## 実装上の注意・ベストプラクティス
- 出力は機械可読（JSON schema）にする：自動テスト・CI で検証しやすい。  
- 入力は最小限かつ明確に：不確定要素は placeholder に置き、機密は含めない。  
- Few‑shot 例（成功例）を必ず含める：望む出力の具体例を与えることで再現性が高まる。  
- 役割分離：SKILL は『何をするか』に集中し、ツール呼び出しや環境は上位エージェントが管理する。  
- 検証基準（evaluation）を明確に：合格/不合格が自動判定できるようにする。

---

## よくあるアンチパターン（避けるべき設計）
- 出力を自由テキストだけにする（解析・自動化が困難）
- 入力にシークレットを含める（履歴に残るリスク）
- テンプレート例が不十分で期待出力が不明瞭
- 検証基準がない（動いたかどうかの判定が人手に依存する）

---

## テスト & CI 統合
- 各 SKILL に対してユニットテストを用意（例: example input → schema 検証 + 合否判定）
- PR に SKILL 変更が含まれる場合は自動でスモークテストを走らせる（期待出力スナップショット比較）

---

## 変更履歴 / バージョニング
- SKILL は後方互換性を意識してバージョン管理する（例: `code-review.v1` → `code-review.v2`）。

---

## 参考・出典
- TooMe（Qiita） — prompt / agent 設計の考察（参考に構成を整理）

---

## 追加提案（運用）
- `/.github/agents/skills/` 配下で個別 SKILL ファイルを管理し、エージェントは必要な SKILL を参照する。  
- `skills` を CI でバリデートするツール（schema チェック / example 実行）を導入する。

---

（このファイルは参考記事の考察を踏まえて独自に整理したテンプレートです。原文は参照リンクをご確認ください。）
