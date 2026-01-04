#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import App from './components/App.js';

const cli = meow(`
  Usage
    $ gh boscaiolo <command> [options]

  Commands
    stale         古い worktree をクリーンアップ
    deleted       削除されたブランチの worktree をクリーンアップ
    merged        マージ済みブランチの worktree をクリーンアップ
    interactive   インタラクティブに選択して削除
    list          worktree 一覧を表示

  Options
    --days <n>      stale: n日間アクセスなし (default: 30)
    --base <branch> merged: ベースブランチ (default: main)
    --dry-run       削除せずに対象のみ表示
    --verbose, -v   詳細情報を表示
    --yes, -y       確認をスキップ

  Examples
    $ gh boscaiolo deleted --dry-run
    $ gh boscaiolo stale --days 60 --yes
    $ gh boscaiolo merged --base main --verbose
`, {
  importMeta: import.meta,
  flags: {
    days: {
      type: 'number',
      default: 30,
    },
    base: {
      type: 'string',
      default: 'main',
    },
    dryRun: {
      type: 'boolean',
      default: false,
    },
    verbose: {
      type: 'boolean',
      shortFlag: 'v',
    },
    yes: {
      type: 'boolean',
      shortFlag: 'y',
    },
  },
});

render(<App command={cli.input[0]} flags={cli.flags} />);
