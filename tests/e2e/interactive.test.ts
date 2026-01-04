import { describe, it, beforeEach, afterEach } from 'vitest';
import { CLIRunner } from '../utils/cli-runner.js';
import { GitTestHelper } from '../utils/git-helper.js';
import { expectOutputContains } from '../utils/assertions.js';

/**
 * インタラクティブコマンドのE2Eテスト
 *
 * 現在スキップ中の理由:
 * Inkアプリケーションは、stdinがTTY（raw modeをサポート）である必要があるが、
 * 通常のexecaやspawnではstdinがパイプとして扱われるため、
 * "Raw mode is not supported on the current process.stdin" エラーが発生する。
 *
 * 解決アプローチ:
 * 1. node-ptyを使用して疑似TTYを作成（現在、node-ptyのビルド問題により動作しない）
 * 2. より単純な統合テストとして書き直す
 * 3. 手動テストで検証する
 *
 * TODO: node-ptyのビルド問題を解決するか、別のアプローチを採用
 */
describe.skip('Interactive Command', () => {
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

	it('矢印キーでカーソル移動できる', async () => {
		repoPath = gitHelper.createTestRepo({
			worktrees: ['feature-1', 'feature-2'],
		});

		await runner.spawn(['interactive'], { cwd: repoPath, timeout: 15000 });
		await runner.waitForOutput('Select worktrees to remove');

		// 初期状態は最初の項目にカーソル
		let output = runner.getCleanOutput();
		expectOutputContains(output, '>');

		// 下矢印でカーソル移動
		runner.sendKey('down');
		await new Promise((resolve) => setTimeout(resolve, 200));

		runner.sendKey('down');
		await new Promise((resolve) => setTimeout(resolve, 200));

		// Escapeで終了
		runner.sendKey('escape');
		await runner.waitForExit();
	});

	it('スペースキーで項目を選択できる', async () => {
		repoPath = gitHelper.createTestRepo({
			worktrees: ['feature-1', 'feature-2'],
		});

		await runner.spawn(['interactive'], { cwd: repoPath, timeout: 15000 });
		await runner.waitForOutput('Select worktrees to remove');

		// スペースで選択
		runner.sendKey('space');
		await new Promise((resolve) => setTimeout(resolve, 200));

		const output = runner.getCleanOutput();
		expectOutputContains(output, '☑'); // チェックボックスがチェックされる

		// Escapeで終了
		runner.sendKey('escape');
		await runner.waitForExit();
	});

	it('Enterキーで選択を確定して削除実行 (dry-run)', async () => {
		repoPath = gitHelper.createTestRepo({
			worktrees: ['feature-to-delete'],
		});

		await runner.spawn(['interactive', '--dry-run'], {
			cwd: repoPath,
			timeout: 15000,
		});
		await runner.waitForOutput('Select worktrees to remove');

		// 下に移動してworktreeを選択
		runner.sendKey('down');
		await new Promise((resolve) => setTimeout(resolve, 200));

		runner.sendKey('space');
		await new Promise((resolve) => setTimeout(resolve, 200));

		// Enterで確定
		runner.sendKey('enter');
		await runner.waitForExit();

		const output = runner.getCleanOutput();
		expectOutputContains(output, 'DRY RUN');
		expectOutputContains(output, 'Would remove');
	});

	it('Escapeキーでキャンセルできる', async () => {
		repoPath = gitHelper.createTestRepo({
			worktrees: ['feature-1'],
		});

		await runner.spawn(['interactive'], { cwd: repoPath, timeout: 15000 });
		await runner.waitForOutput('Select worktrees to remove');

		// Escapeでキャンセル
		runner.sendKey('escape');
		await runner.waitForExit();

		const output = runner.getCleanOutput();
		expectOutputContains(output, 'No worktrees selected');
	});

	it('何も選択せずにEnterを押すとキャンセル', async () => {
		repoPath = gitHelper.createTestRepo({
			worktrees: ['feature-1'],
		});

		await runner.spawn(['interactive'], { cwd: repoPath, timeout: 15000 });
		await runner.waitForOutput('Select worktrees to remove');

		// 何も選択せずEnter
		runner.sendKey('enter');
		await runner.waitForExit();

		const output = runner.getCleanOutput();
		expectOutputContains(output, 'No worktrees selected');
	});
});
