import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CLIRunner } from '../utils/cli-runner.js';
import { GitTestHelper } from '../utils/git-helper.js';
import {
	expectOutputContains,
	expectTableOutput,
} from '../utils/assertions.js';
import { runCLICommand } from '../utils/test-helpers.js';

describe('CLI Basic Commands', () => {
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

	describe('help command', () => {
		it('--help フラグで使い方を表示する', async () => {
			repoPath = gitHelper.createTestRepo();
			const output = await runCLICommand(runner, ['--help'], repoPath);

			const expectedHelpTexts = ['Usage', 'Commands', 'stale', 'deleted', 'merged', 'interactive', 'list'];
			expectedHelpTexts.forEach((text) => expectOutputContains(output, text));
		});
	});

	describe('list command', () => {
		it('worktree一覧を表示する', async () => {
			repoPath = gitHelper.createTestRepo({
				worktrees: ['feature-1', 'feature-2', 'bugfix-3'],
			});
			const output = await runCLICommand(runner, ['list'], repoPath);

			const expectedBranches = ['main', 'feature-1', 'feature-2', 'bugfix-3'];
			expectedBranches.forEach((branch) => expectOutputContains(output, branch));
			expectOutputContains(output, 'Worktrees (4 total)');
		});

		it('worktreeがない場合はメッセージを表示する', async () => {
			repoPath = gitHelper.createTestRepo();
			const output = await runCLICommand(runner, ['list'], repoPath);

			expectOutputContains(output, 'main');
		});
	});

	describe('deleted command', () => {
		it('削除されたブランチのworktreeを検出する', async () => {
			repoPath = gitHelper.createTestRepo({
				deletedBranches: ['deleted-branch-1', 'deleted-branch-2'],
			});
			const output = await runCLICommand(runner, ['deleted', '--dry-run'], repoPath);

			expectOutputContains(output, 'deleted-branch-1');
			expectOutputContains(output, 'deleted-branch-2');
			expectOutputContains(output, '[deleted]');
		});

		it('--dry-runフラグで削除せずに表示のみ行う', async () => {
			repoPath = gitHelper.createTestRepo({
				deletedBranches: ['to-delete'],
			});
			const output = await runCLICommand(runner, ['deleted', '--dry-run'], repoPath);

			expectOutputContains(output, 'DRY RUN');
			expectOutputContains(output, 'to-delete');
		}, 60000);
	});

	describe('stale command', () => {
		it('古いworktreeを検出する', async () => {
			repoPath = gitHelper.createTestRepo({
				worktrees: ['old-feature', 'new-feature'],
			});

			gitHelper.setWorktreeAccessTime('old-feature', 60);

			const output = await runCLICommand(
				runner,
				['stale', '--days', '30', '--dry-run'],
				repoPath
			);

			expectOutputContains(output, 'old-feature');
		});
	});

	describe('merged command', () => {
		it('マージ済みブランチのworktreeを検出する', async () => {
			repoPath = gitHelper.createTestRepo({
				mergedBranches: ['merged-feature'],
			});
			const output = await runCLICommand(
				runner,
				['merged', '--base', 'main', '--dry-run'],
				repoPath
			);

			expectOutputContains(output, 'merged-feature');
		});
	});

	describe('unknown command', () => {
		it('不明なコマンドに対してエラーを表示する', async () => {
			repoPath = gitHelper.createTestRepo();
			const output = await runCLICommand(runner, ['invalid-command'], repoPath);

			expectOutputContains(output, 'Unknown command');
		});
	});

	describe('no command', () => {
		it('コマンドなしで実行した場合エラーを表示する', async () => {
			repoPath = gitHelper.createTestRepo();
			const output = await runCLICommand(runner, [], repoPath);

			expectOutputContains(output, 'Error: No command specified');
			expectOutputContains(output, '--help');
		}, 60000);
	});
});
