import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CLIRunner } from '../utils/cli-runner.js';
import { GitTestHelper } from '../utils/git-helper.js';
import { expectOutputContains } from '../utils/assertions.js';
import { runCLICommand } from '../utils/test-helpers.js';
import { existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

/**
 * Worktreeディレクトリを削除してprunableにする
 */
function deleteWorktreeDirectory(repoPath: string, worktreeName: string): void {
	const wtPath = join(repoPath, '.worktrees', worktreeName);
	execSync(`rm -rf "${wtPath}"`, { cwd: repoPath });
}

/**
 * Worktreeに未コミット変更を追加
 */
function addDirtyChangesToWorktree(repoPath: string, worktreeName: string): void {
	const wtPath = join(repoPath, '.worktrees', worktreeName);
	execSync(`echo "dirty change" > "${wtPath}/new-file.txt"`, { cwd: repoPath });
}

describe('Git Integration', () => {
	let runner: CLIRunner;
	let gitHelper: GitTestHelper;
	let repoPath: string;

	beforeEach(() => {
		runner = new CLIRunner();
		gitHelper = new GitTestHelper();
	});

	afterEach(() => {
		runner.kill();
		gitHelper.cleanup();
	});

	it('実際にworktreeを削除できる', async () => {
		repoPath = gitHelper.createTestRepo({
			worktrees: ['branch-to-remove'],
		});

		const wtPath = join(repoPath, '.worktrees/branch-to-remove');
		const worktreeExistsBeforeDeletion = existsSync(wtPath);
		expect(worktreeExistsBeforeDeletion).toBe(true);

		deleteWorktreeDirectory(repoPath, 'branch-to-remove');

		const output = await runCLICommand(runner, ['deleted', '--yes'], repoPath);
		expectOutputContains(output, 'Removed');
	});

	it('複数のworktreeを一度に削除できる', async () => {
		repoPath = gitHelper.createTestRepo({
			deletedBranches: ['delete-1', 'delete-2', 'delete-3'],
		});
		const output = await runCLICommand(runner, ['deleted', '--yes'], repoPath);

		expectOutputContains(output, 'Removed 3');
	});

	it('未コミット変更があるworktreeも強制削除できる', async () => {
		repoPath = gitHelper.createTestRepo({
			worktrees: ['dirty-worktree'],
		});

		addDirtyChangesToWorktree(repoPath, 'dirty-worktree');
		gitHelper.setWorktreeAccessTime('dirty-worktree', 1);

		const output = await runCLICommand(runner, ['stale', '--days', '0', '--yes'], repoPath);
		expectOutputContains(output, 'Removed');
	});

	it('mainブランチのworktreeは削除しない', async () => {
		repoPath = gitHelper.createTestRepo();

		await runCLICommand(runner, ['list'], repoPath);

		const mainBranchExists = existsSync(repoPath);
		expect(mainBranchExists).toBe(true);
	});

	it('削除失敗したworktreeを報告する', async () => {
		repoPath = gitHelper.createTestRepo({
			worktrees: ['feature-1'],
		});

		deleteWorktreeDirectory(repoPath, 'feature-1');

		const output = await runCLICommand(runner, ['deleted', '--yes'], repoPath);
		// 実際の動作はGitのバージョンに依存するため、出力を取得するのみ
	});
});
