/**
 * CLIテストで使用するカスタムエラークラス
 */
export class CLITestError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'CLITestError';
		Object.setPrototypeOf(this, CLITestError.prototype);
	}

	/**
	 * タイムアウトエラーを生成
	 */
	static timeout(ms: number): CLITestError {
		return new CLITestError(`CLI timeout after ${ms}ms`);
	}

	/**
	 * プロセス未起動エラーを生成
	 */
	static processNotStarted(): CLITestError {
		return new CLITestError('Process not started');
	}

	/**
	 * 出力待機タイムアウトエラーを生成
	 */
	static outputTimeout(pattern: string | RegExp): CLITestError {
		return new CLITestError(`Timeout waiting for: ${pattern}`);
	}

	/**
	 * 標準入力利用不可エラーを生成
	 */
	static stdinNotAvailable(): CLITestError {
		return new CLITestError('Process not started or stdin not available');
	}

	/**
	 * PTYプロセス未起動エラーを生成
	 */
	static ptyNotStarted(): CLITestError {
		return new CLITestError('PTY process not started');
	}

	/**
	 * プロセス終了タイムアウトエラーを生成
	 */
	static exitTimeout(): CLITestError {
		return new CLITestError('Process did not exit in time');
	}
}
