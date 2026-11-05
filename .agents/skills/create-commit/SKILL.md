---
name: create-commit
description: 差分を確認し、プロジェクト規約（[TYPE] 説明（日本語））でコミットを作成する。「コミットして」と言われたときに使う。
---

# コミット作成

## 手順

1. `git status` と `git diff`（ステージ済みは `git diff --cached`）で変更内容を確認する。
2. 現在のブランチを確認する。`main` / `develop` への直接コミットは避け、
   ブランチ戦略（`../docs/projects/book-review-app/specs/BRANCH_STRATEGY.md`）に沿った
   `feature/` `bugfix/` `hotfix/` ブランチで作業する。違反する場合はコミット前にユーザーへ警告する。
3. 目的の異なる変更が混在していれば、分けてコミットすることを提案する。
4. ファイルは名前を指定して追加する（`git add -A` / `git add .` は使わない）。
   `.env`、秘密情報、`node_modules`、ローカル専用ファイル（`CLAUDE.md`、`.claude/`、`.agents/skills/`）は含めない。
5. コミットメッセージを作る。

   - 形式: `[TYPE] 説明（日本語）`
   - TYPE: ADD / FIX / REFACTOR / DOCS / TEST / STYLE / PERF / CHORE
   - 1 行目は変更の「何を」を簡潔に。必要なら空行の後に「なぜ」を箇条書きで補足する。

6. 使っているツール（Claude / Codex など）がコミットに付与すべきと指示している
   共同作成者表記（Co-Authored-By など）があれば、末尾に付ける。
7. `git commit` を実行し、`git show --stat HEAD` で結果を確認する。

## 守ること

- push は、ユーザーが明示的に求めたときだけ行う。
- フック失敗時は `--no-verify` で回避せず、原因を直して新しくコミットし直す。
- コミット前に `lint` / `check-types` / `test:ci`（DoD）が通っているか確認し、未実施なら報告する。
