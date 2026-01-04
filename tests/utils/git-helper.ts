import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdtempSync, rmSync } from 'fs';

export interface TestRepoOptions {
	worktrees?: string[]; // 作成するworktree名のリスト
	deletedBranches?: string[]; // 削除するブランチ名
	mergedBranches?: string[]; // マージ済みブランチ名
}

export class GitTestHelper {
	private repoPath: string | null = null;

	/**
	 * テスト用Gitリポジトリを作成
	 */
	createTestRepo(options: TestRepoOptions = {}): string {
		this.repoPath = this.createTempDirectory();
		this.initializeGitRepository();
		this.createInitialCommit();

		const hasWorktrees = options.worktrees && options.worktrees.length > 0;
		if (hasWorktrees) {
			this.createWorktrees(options.worktrees);
		}

		const hasMergedBranches = options.mergedBranches && options.mergedBranches.length > 0;
		if (hasMergedBranches) {
			this.createMergedBranches(options.mergedBranches);
		}

		const hasDeletedBranches = options.deletedBranches && options.deletedBranches.length > 0;
		if (hasDeletedBranches) {
			this.createDeletedBranches(options.deletedBranches);
		}

		return this.repoPath;
	}

	/**
	 * 一時ディレクトリを作成
	 */
	private createTempDirectory(): string {
		const prefix = join(tmpdir(), 'gh-boscaiolo-test-');
		return mkdtempSync(prefix);
	}

	/**
	 * Gitリポジトリを初期化
	 */
	private initializeGitRepository(): void {
		this.exec('git init');
		this.exec('git config user.name "Test User"');
		this.exec('git config user.email "test@example.com"');
	}

	/**
	 * 初期コミットを作成
	 */
	private createInitialCommit(): void {
		this.exec('echo "# Test Repo" > README.md');
		this.exec('git add README.md');
		this.exec('git commit -m "Initial commit"');
		this.exec('git branch -M main');
	}

	/**
	 * Worktreeを作成
	 */
	private createWorktrees(worktreeNames: string[]): void {
		for (const name of worktreeNames) {
			const wtPath = this.getWorktreePath(name);
			this.exec(`git worktree add "${wtPath}" -b ${name}`);
		}
	}

	/**
	 * マージ済みブランチを作成
	 */
	private createMergedBranches(branchNames: string[]): void {
		for (const name of branchNames) {
			this.createWorktreeWithCommit(name);
			this.mergeToMain(name);
		}
	}

	/**
	 * Worktreeを作成してコミットを追加
	 */
	private createWorktreeWithCommit(branchName: string): void {
		const wtPath = this.getWorktreePath(branchName);
		this.exec(`git worktree add "${wtPath}" -b ${branchName}`);
		this.exec(`cd "${wtPath}" && echo "${branchName}" > ${branchName}.txt`);
		this.exec(`cd "${wtPath}" && git add ${branchName}.txt`);
		this.exec(`cd "${wtPath}" && git commit -m "Add ${branchName}"`);
	}

	/**
	 * ブランチをmainにマージ
	 */
	private mergeToMain(branchName: string): void {
		this.exec('git checkout main');
		this.exec(`git merge ${branchName} --no-ff -m "Merge ${branchName}"`);
	}

	/**
	 * 削除されたブランチを作成 (worktreeディレクトリを削除してprunableにする)
	 */
	private createDeletedBranches(branchNames: string[]): void {
		for (const name of branchNames) {
			const wtPath = this.getWorktreePath(name);
			this.exec(`git worktree add "${wtPath}" -b ${name}`);
			this.exec(`rm -rf "${wtPath}"`);
		}
	}

	/**
	 * Worktreeパスを取得
	 */
	private getWorktreePath(worktreeName: string): string {
		const hasRepoPath = this.repoPath;
		if (!hasRepoPath) {
			throw new Error('Repository not created');
		}
		return join(this.repoPath, '.worktrees', worktreeName);
	}

	/**
	 * ファイルの最終アクセス日時を変更 (staleテスト用)
	 */
	setWorktreeAccessTime(worktreeName: string, daysAgo: number): void {
		const wtPath = this.getWorktreePath(worktreeName);
		const timestamp = this.calculateTimestamp(daysAgo);
		const touchFormat = this.formatTimestampForTouch(timestamp);
		this.exec(`touch -t ${touchFormat} "${wtPath}"`);
	}

	/**
	 * 過去のタイムスタンプを計算
	 */
	private calculateTimestamp(daysAgo: number): Date {
		const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
		const timestamp = Date.now() - daysAgo * MILLISECONDS_PER_DAY;
		return new Date(timestamp);
	}

	/**
	 * touchコマンド用のタイムスタンプフォーマット
	 */
	private formatTimestampForTouch(date: Date): string {
		const dateStr = date
			.toISOString()
			.slice(0, 19)
			.replace(/[-:]/g, '')
			.replace('T', '');
		return `${dateStr.slice(0, 12)}.${dateStr.slice(12, 14)}`;
	}

	/**
	 * Git コマンドを実行
	 */
	private exec(command: string): string {
		const isNoRepoPath = !this.repoPath;
		if (isNoRepoPath) {
			throw new Error('Repository not created');
		}

		return execSync(command, {
			cwd: this.repoPath,
			encoding: 'utf-8',
			stdio: ['pipe', 'pipe', 'pipe'],
		}).trim();
	}

	/**
	 * リポジトリパスを取得
	 */
	getRepoPath(): string {
		const isNoRepoPath = !this.repoPath;
		if (isNoRepoPath) {
			throw new Error('Repository not created');
		}
		return this.repoPath;
	}

	/**
	 * テスト用リポジトリを削除
	 */
	cleanup(): void {
		if (this.repoPath) {
			try {
				rmSync(this.repoPath, { recursive: true, force: true });
			} catch (error) {
				console.error('Failed to cleanup test repo:', error);
			}
			this.repoPath = null;
		}
	}
}
