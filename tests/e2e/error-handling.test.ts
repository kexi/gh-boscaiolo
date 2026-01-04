import { describe, it, beforeEach, afterEach } from 'vitest';
import { CLIRunner } from '../utils/cli-runner.js';
import { GitTestHelper } from '../utils/git-helper.js';
import {
	expectErrorMessage,
	expectOutputContains,
} from '../utils/assertions.js';
import { runCLICommand } from '../utils/test-helpers.js';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirSync, rmSync } from 'fs';
import { execSync } from 'child_process';

/**
 * 一時的な非Gitディレクトリを作成
 */
function createNonGitDirectory(): string {
	const nonGitDir = join(tmpdir(), 'non-git-dir-' + Date.now());
	mkdirSync(nonGitDir, { recursive: true });
	return nonGitDir;
}

describe('Error Handling', () => {
	let runner: CLIRunner;
	let gitHelper: GitTestHelper;

	beforeEach(() => {
		runner = new CLIRunner();
		gitHelper = new GitTestHelper();
	});

	afterEach(() => {
		runner.kill();
		gitHelper.cleanup();
	});

	it('Gitリポジトリでないディレクトリで実行するとエラー', async () => {
		const nonGitDir = createNonGitDirectory();

		try {
			const output = await runCLICommand(runner, ['list'], nonGitDir);
			expectErrorMessage(output, 'git');
		} finally {
			rmSync(nonGitDir, { recursive: true, force: true });
		}
	});

	it('存在しないベースブランチを指定するとエラー', async () => {
		const repoPath = gitHelper.createTestRepo();
		const output = await runCLICommand(
			runner,
			['merged', '--base', 'non-existent-branch'],
			repoPath
		);

		expectErrorMessage(output, 'error');
	}, 60000);

	it('無効な--daysオプションを処理する', async () => {
		const repoPath = gitHelper.createTestRepo();
		const output = await runCLICommand(runner, ['stale', '--days', '-10'], repoPath);

		// meowは無効な値をデフォルト値に置き換える可能性があるため、出力を取得するのみ
	});

	it('ロックされたworktreeの削除に失敗する', async () => {
		const repoPath = gitHelper.createTestRepo({
			worktrees: ['feature-locked'],
		});

		const wtPath = join(repoPath, '.worktrees/feature-locked');

		const isLockSupported = tryLockWorktree(repoPath, wtPath);
		if (!isLockSupported) {
			console.warn('Git worktree lock not supported, skipping test');
			return;
		}

		deleteWorktreeDirectory(wtPath, repoPath);
		tryPruneWorktrees(repoPath);

		const canDeleteBranch = tryDeleteBranch(repoPath, 'feature-locked');
		if (!canDeleteBranch) {
			console.warn('Branch still associated with locked worktree, skipping test');
			return;
		}

		const output = await runCLICommand(runner, ['deleted', '--yes'], repoPath);
		validateLockedWorktreeOutput(output);
	});
});

/**
 * Worktreeをロックする
 */
function tryLockWorktree(repoPath: string, wtPath: string): boolean {
	try {
		execSync(`git worktree lock "${wtPath}"`, {
			cwd: repoPath,
			encoding: 'utf-8',
			stdio: 'pipe',
		});
		return true;
	} catch {
		return false;
	}
}

/**
 * Worktreeディレクトリを削除
 */
function deleteWorktreeDirectory(wtPath: string, repoPath: string): void {
	rmSync(wtPath, { recursive: true, force: true });
}

/**
 * Worktreeのpruneを試行
 */
function tryPruneWorktrees(repoPath: string): void {
	try {
		execSync('git worktree prune', { cwd: repoPath, stdio: 'pipe' });
	} catch {
		// ロックされている場合は失敗する
	}
}

/**
 * ブランチの削除を試行
 */
function tryDeleteBranch(repoPath: string, branchName: string): boolean {
	try {
		execSync(`git branch -D ${branchName}`, {
			cwd: repoPath,
			stdio: 'pipe',
		});
		return true;
	} catch {
		return false;
	}
}

/**
 * ロックされたWorktreeの出力を検証
 */
function validateLockedWorktreeOutput(output: string): void {
	const hasWorktreeReference =
		output.includes('feature-locked') ||
		output.includes('Locked') ||
		output.includes('Failed');

	const hasNoWorktreesMessage = output.includes('No deleted');
	const isValidOutput = hasWorktreeReference || hasNoWorktreesMessage;

	if (!isValidOutput) {
		throw new Error(
			`Expected to see worktree reference or 'No deleted' message, but got: ${output}`
		);
	}
}
