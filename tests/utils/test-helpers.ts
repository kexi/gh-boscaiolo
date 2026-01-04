import type { CLIRunner } from './cli-runner.js';

/**
 * CLIコマンドを実行して出力を取得するヘルパー
 */
export async function runCLICommand(
	runner: CLIRunner,
	args: string[],
	cwd: string
): Promise<string> {
	await runner.spawn(args, { cwd });
	await runner.waitForExit();
	return runner.getCleanOutput();
}
