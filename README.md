# gh-boscaiolo

Git worktree のクリーンアップに特化した GitHub CLI 拡張機能です。

> 🪓 **boscaiolo** = イタリア語で「木こり」を意味します

## 特徴

- 🗑️ **5つのクリーンアップモード**: 削除済みブランチ、古い worktree、マージ済みブランチ、インタラクティブ選択、一覧表示
- 🎨 **リッチなターミナル UI**: React Ink によるインタラクティブな表示
- 🔒 **安全性重視**: 未コミット変更の検出、ロック worktree のスキップ、dry-run モード
- ⚡ **高速**: TypeScript + ESM で軽量・高速動作
- 🌍 **クロスプラットフォーム**: macOS、Linux、Windows 対応

## インストール

### GitHub CLI 経由（推奨）

```bash
gh extension install kexi/gh-boscaiolo

# インストール後、依存関係をインストール
cd ~/.local/share/gh/extensions/gh-boscaiolo
pnpm install
```

### npm/pnpm 経由

```bash
# npm
npm install -g gh-boscaiolo

# pnpm
pnpm add -g gh-boscaiolo
```

## 使用方法

### コマンド一覧

```bash
gh boscaiolo <command> [options]
```

#### `deleted` - 削除されたブランチの worktree をクリーンアップ

リモートやローカルで削除されたブランチに紐づく worktree を検出・削除します。

```bash
gh boscaiolo deleted [--dry-run] [--verbose] [--yes]
```

**例:**
```bash
# 削除対象を確認（削除しない）
gh boscaiolo deleted --dry-run

# 確認なしで削除
gh boscaiolo deleted --yes

# 詳細情報を表示して削除
gh boscaiolo deleted --verbose
```

#### `stale` - 古い worktree をクリーンアップ

指定日数以上アクセスされていない worktree を検出・削除します。

```bash
gh boscaiolo stale --days <n> [--dry-run] [--verbose] [--yes]
```

**オプション:**
- `--days <n>`: アクセスなし期間（日数、デフォルト: 30）

**例:**
```bash
# 60日間アクセスなしの worktree を確認
gh boscaiolo stale --days 60 --dry-run

# 14日間アクセスなしの worktree を削除
gh boscaiolo stale --days 14 --yes
```

#### `merged` - マージ済みブランチの worktree をクリーンアップ

指定したベースブランチにマージ済みのブランチの worktree を検出・削除します。

```bash
gh boscaiolo merged --base <branch> [--dry-run] [--verbose] [--yes]
```

**オプション:**
- `--base <branch>`: ベースブランチ（デフォルト: main）

**例:**
```bash
# main にマージ済みの worktree を確認
gh boscaiolo merged --dry-run

# develop にマージ済みの worktree を削除
gh boscaiolo merged --base develop --yes
```

#### `interactive` - インタラクティブに選択して削除

キーボード操作で削除する worktree を選択できます。

```bash
gh boscaiolo interactive [--dry-run]
```

**操作方法:**
- `↑/↓`: カーソル移動
- `Space`: 選択/選択解除
- `Enter`: 削除実行
- `Esc`: キャンセル

#### `list` - worktree 一覧を表示

すべての worktree を一覧表示し、統計情報を表示します（診断用）。

```bash
gh boscaiolo list [--verbose]
```

**例:**
```bash
# シンプルな一覧
gh boscaiolo list

# 詳細情報付き（コミットハッシュ、ロック状態など）
gh boscaiolo list --verbose
```

### 共通オプション

すべてのコマンドで使用可能なオプション：

| オプション | 短縮形 | 説明 |
|-----------|--------|------|
| `--dry-run` | - | 削除せずに対象のみ表示 |
| `--verbose` | `-v` | 詳細情報を表示（コミットハッシュ、ロック状態など） |
| `--yes` | `-y` | 確認をスキップして自動実行 |

## 安全機能

### 未コミット変更の検出

worktree に未コミットの変更がある場合、自動的に `--force` フラグ付きで削除します。

### ロックされた worktree のスキップ

`git worktree lock` でロックされた worktree は自動的にスキップされます。

### Dry-run モード

すべてのコマンドで `--dry-run` をサポートしており、実際の削除前に対象を確認できます。

```bash
gh boscaiolo deleted --dry-run
# 出力例:
# Found 2 worktrees with deleted branches:
# feature-old          /path/to/.worktrees/feature-old
# bugfix-123           /path/to/.worktrees/bugfix-123
# [DRY RUN] Would remove these worktrees
```

## 開発

### 必要要件

- Node.js 18.0.0 以上
- pnpm（推奨）

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/YOUR_USERNAME/gh-boscaiolo.git
cd gh-boscaiolo

# 依存関係をインストール
pnpm install

# ビルド
pnpm build

# ローカルでテスト
./bin/gh-boscaiolo list
```

### プロジェクト構成

```
gh-boscaiolo/
├── src/
│   ├── cli.tsx                    # CLI エントリーポイント
│   ├── components/                # React Ink コンポーネント
│   │   ├── App.tsx                # メインルーティング
│   │   ├── DeletedCommand.tsx     # deleted コマンド UI
│   │   ├── StaleCommand.tsx       # stale コマンド UI
│   │   ├── MergedCommand.tsx      # merged コマンド UI
│   │   ├── InteractiveCommand.tsx # interactive コマンド UI
│   │   ├── ListCommand.tsx        # list コマンド UI
│   │   └── WorktreeTable.tsx      # テーブル表示コンポーネント
│   ├── core/
│   │   ├── git.ts                 # Git コマンド実行基盤
│   │   └── worktree.ts            # Worktree 操作ロジック
│   ├── hooks/
│   │   └── useWorktrees.ts        # Worktree データ取得フック
│   └── types/
│       └── index.ts               # TypeScript 型定義
├── bin/
│   └── gh-boscaiolo               # 実行可能スクリプト
└── dist/                          # ビルド成果物
```

### 技術スタック

- **React Ink**: ターミナル UI フレームワーク
- **TypeScript**: 型安全性
- **meow**: CLI 引数パーサー
- **date-fns**: 日付フォーマット

## セキュリティポリシー

### サプライチェーン攻撃対策

このプロジェクトでは、npm/pnpm サプライチェーン攻撃から保護するため、以下のセキュリティ対策を実装しています：

#### 1. パッケージ公開日チェック

**公開から1日以上経過したパッケージのみをインストールします。**

新規公開されたパッケージは、悪意のあるコードが含まれている可能性があるため、即座にインストールしません。これにより、以下のリスクを軽減します：

- タイポスクワッティング攻撃
- パッケージハイジャック
- 悪意のあるパッケージの即時インストール

#### 2. 自動チェックの仕組み

**ローカル開発:**
```bash
# パッケージの公開日を手動チェック
pnpm run check-package-age

# セキュリティチェックを実行
pnpm run security-check
```

**CI/CD (GitHub Actions):**
- Pull Request で `package.json` や `pnpm-lock.yaml` が変更された場合、自動的にチェック
- 1日以内のパッケージが検出されると、警告コメントが自動投稿
- 毎日定期的に依存関係をチェック

#### 3. .npmrc セキュリティ設定

`.npmrc` ファイルで以下のセキュリティ設定を有効化しています：

- `frozen-lockfile=true`: ロックファイルを厳密に使用
- `strict-ssl=true`: セキュアなレジストリ接続
- パッケージの整合性チェック

#### 4. 新しいパッケージを追加する場合

1. パッケージを `package.json` に追加
2. `pnpm install` を実行（警告が表示される可能性があります）
3. `pnpm run check-package-age` でパッケージの公開日を確認
4. 1日以内のパッケージの場合：
   - パッケージの公式性を確認
   - メンテナの信頼性を確認
   - 可能であれば1日以上待ってから再度インストール

## ライセンス

MIT

## 貢献

Issue や Pull Request を歓迎します！

## 類似プロジェクト

- [eikster-dk/gh-worktree](https://github.com/eikster-dk/gh-worktree): worktree の作成に特化
- [despreston/gh-worktree](https://github.com/despreston/gh-worktree): worktree の作成と管理

**gh-boscaiolo の違い**: クリーンアップに特化し、リッチな UI とインタラクティブな操作を提供します。
