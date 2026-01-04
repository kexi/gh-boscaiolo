import { expect } from 'vitest';
import stripAnsi from 'strip-ansi';
import { realpathSync } from 'fs';

/**
 * ANSI制御文字を除去した出力を取得
 */
function getCleanOutput(output: string): string {
	return stripAnsi(output);
}

/**
 * 出力に特定のテキストが含まれることを検証
 */
export function expectOutputContains(output: string, text: string): void {
	const clean = getCleanOutput(output);
	expect(clean).toContain(text);
}

/**
 * 出力が特定のパターンにマッチすることを検証
 */
export function expectOutputMatches(output: string, pattern: RegExp): void {
	const clean = getCleanOutput(output);
	expect(clean).toMatch(pattern);
}

/**
 * パスが出力に含まれることを検証（シンボリックリンクを考慮）
 */
function expectPathInOutput(cleanOutput: string, path: string): void {
	try {
		const realPath = realpathSync(path);
		const hasOriginalPath = cleanOutput.includes(path);
		const hasRealPath = cleanOutput.includes(realPath);
		const hasPath = hasOriginalPath || hasRealPath;
		expect(hasPath).toBe(true);
		return;
	} catch {
		// パスが存在しない場合は元のパスをチェック
		expect(cleanOutput).toContain(path);
	}
}

/**
 * テーブル形式の出力を検証
 */
export function expectTableOutput(
	output: string,
	expectedRows: Array<{ branch: string; path: string }>,
): void {
	const clean = getCleanOutput(output);

	for (const row of expectedRows) {
		expect(clean).toContain(row.branch);
		expectPathInOutput(clean, row.path);
	}
}

/**
 * エラーメッセージを検証（大文字小文字を区別しない）
 */
export function expectErrorMessage(output: string, message: string): void {
	const clean = getCleanOutput(output);
	const lowerCaseClean = clean.toLowerCase();
	const lowerCaseMessage = message.toLowerCase();
	expect(lowerCaseClean).toContain(lowerCaseMessage);
}
