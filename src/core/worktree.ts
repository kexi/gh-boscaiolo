import { stat } from 'fs/promises';
import { execSync } from 'child_process';
import { GitExecutor } from './git.js';
import type { Worktree, WorktreeCleanupOptions } from '../types/index.js';

export class WorktreeManager {
  private git: GitExecutor;

  constructor() {
    this.git = new GitExecutor();
  }

  async listWorktrees(): Promise<Worktree[]> {
    const output = await this.git.execute('worktree list --porcelain');
    const worktrees = this.parseWorktreeList(output);

    // ブランチ削除状態を確認
    const branches = await this.listBranches();
    const branchSet = new Set(branches);

    return worktrees.map(wt => ({
      ...wt,
      branchDeleted: wt.branch !== null && !branchSet.has(wt.branch),
    }));
  }

  private parseWorktreeList(output: string): Worktree[] {
    const worktrees: Worktree[] = [];
    const lines = output.split('\n');

    let current: Partial<Worktree> = {};

    for (const line of lines) {
      const isWorktreeLine = line.startsWith('worktree ');
      if (isWorktreeLine) {
        current.path = line.substring(9);
        continue;
      }

      const isHeadLine = line.startsWith('HEAD ');
      if (isHeadLine) {
        current.commit = line.substring(5);
        continue;
      }

      const isBranchLine = line.startsWith('branch ');
      if (isBranchLine) {
        current.branch = line.substring(7).replace('refs/heads/', '');
        continue;
      }

      const isPrunableLine = line.startsWith('prunable ');
      if (isPrunableLine) {
        current.isPrunable = true;
        continue;
      }

      const isLockedLine = line.startsWith('locked ');
      if (isLockedLine) {
        current.isLocked = true;
        current.lockReason = line.substring(7);
        continue;
      }

      const isEmptyLine = line === '';
      if (isEmptyLine) {
        const hasPath = current.path !== undefined;
        if (hasPath) {
          worktrees.push({
            path: current.path!,
            branch: current.branch || null,
            commit: current.commit || '',
            isPrunable: current.isPrunable || false,
            isLocked: current.isLocked || false,
            lockReason: current.lockReason,
          });
        }
        current = {};
      }
    }

    // 最後の worktree を追加（空行で終わらない場合）
    const hasPath = current.path !== undefined;
    if (hasPath) {
      worktrees.push({
        path: current.path!,
        branch: current.branch || null,
        commit: current.commit || '',
        isPrunable: current.isPrunable || false,
        isLocked: current.isLocked || false,
        lockReason: current.lockReason,
      });
    }

    return worktrees;
  }

  async listBranches(): Promise<string[]> {
    const output = await this.git.execute('branch -a');
    return output
      .split('\n')
      .map(line => line.trim().replace(/^[*+]\s+/, '').replace(/^remotes\//, ''))
      .filter(Boolean);
  }

  async findStaleWorktrees(days: number): Promise<Worktree[]> {
    const worktrees = await this.listWorktrees();
    const threshold = Date.now() - (days * 24 * 60 * 60 * 1000);

    const staleWorktrees: Worktree[] = [];

    for (const wt of worktrees) {
      try {
        const stats = await stat(wt.path);
        // Windows では atime が信頼できないため mtime を使用
        const lastAccessTime = process.platform === 'win32' ? stats.mtime : stats.atime;
        const isStale = lastAccessTime.getTime() < threshold;

        if (isStale) {
          staleWorktrees.push({
            ...wt,
            lastAccessed: lastAccessTime,
          });
        }
      } catch {
        // ディレクトリが存在しない場合はスキップ
        continue;
      }
    }

    return staleWorktrees;
  }

  async findDeletedBranchWorktrees(): Promise<Worktree[]> {
    const worktrees = await this.listWorktrees();
    return worktrees.filter(wt => wt.branchDeleted);
  }

  async findMergedBranchWorktrees(baseBranch: string): Promise<Worktree[]> {
    const worktrees = await this.listWorktrees();
    const mergedBranches = await this.listMergedBranches(baseBranch);
    const mergedSet = new Set(mergedBranches);

    return worktrees.filter(wt => {
      const hasBranch = wt.branch !== null;
      const isMerged = hasBranch && mergedSet.has(wt.branch!);
      return isMerged;
    });
  }

  private async listMergedBranches(baseBranch: string): Promise<string[]> {
    const output = await this.git.execute(`branch --merged ${baseBranch}`);
    return output
      .split('\n')
      .map(line => line.trim().replace(/^[*+]\s+/, ''))
      .filter(branch => branch && branch !== baseBranch);
  }

  async hasUncommittedChanges(worktreePath: string): Promise<boolean> {
    try {
      const status = await this.git.execute('status --porcelain', { cwd: worktreePath });
      const hasChanges = status.length > 0;
      return hasChanges;
    } catch {
      return false;
    }
  }

  async removeWorktree(path: string, force: boolean = false): Promise<void> {
    const forceFlag = force ? ' --force' : '';
    await this.git.execute(`worktree remove ${path}${forceFlag}`);
  }

  async removeWorktrees(
    worktrees: Worktree[],
    options: WorktreeCleanupOptions = {}
  ): Promise<{ removed: string[]; failed: Array<{ path: string; error: string }> }> {
    const result = {
      removed: [] as string[],
      failed: [] as Array<{ path: string; error: string }>,
    };

    const isDryRun = options.dryRun === true;
    if (isDryRun) {
      return result;
    }

    for (const wt of worktrees) {
      const isLocked = wt.isLocked;
      if (isLocked) {
        result.failed.push({
          path: wt.path,
          error: `Locked: ${wt.lockReason || 'no reason given'}`,
        });
        continue;
      }

      try {
        // 未コミット変更をチェック
        const hasDirty = await this.hasUncommittedChanges(wt.path);
        await this.removeWorktree(wt.path, hasDirty);
        result.removed.push(wt.path);
      } catch (error: unknown) {
        const isError = error instanceof Error;
        const message = isError ? error.message : 'Unknown error';
        result.failed.push({
          path: wt.path,
          error: message,
        });
      }
    }

    return result;
  }
}
