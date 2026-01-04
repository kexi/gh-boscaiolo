import { execa, type ExecaChildProcess } from 'execa';
import { EventEmitter } from 'events';
import stripAnsi from 'strip-ansi';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn as ptySpawn, type IPty } from 'node-pty';
import { CLITestError } from './test-errors.js';
import {
	CLI_SPAWN_TIMEOUT,
	STARTUP_DELAY,
	OUTPUT_WAIT_TIMEOUT,
	EXIT_WAIT_TIMEOUT,
} from './test-constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface CLIRunnerOptions {
	cwd: string;
	timeout?: number;
	env?: Record<string, string>;
}

interface CLIRunnerEvents {
	data: [text: string];
	exit: [code: number];
}

export interface CLIRunner {
	on<K extends keyof CLIRunnerEvents>(
		event: K,
		listener: (...args: CLIRunnerEvents[K]) => void
	): this;
	once<K extends keyof CLIRunnerEvents>(
		event: K,
		listener: (...args: CLIRunnerEvents[K]) => void
	): this;
	emit<K extends keyof CLIRunnerEvents>(event: K, ...args: CLIRunnerEvents[K]): boolean;
}

export class CLIRunner extends EventEmitter {
	private process: ExecaChildProcess | null = null;
	private ptyProcess: IPty | null = null;
	private output: string = '';
	private cliPath: string;
	private isInteractive: boolean = false;
	private exitCode: number | null = null;
	private hasExited: boolean = false;

	constructor() {
		super();
		// ビルド済みCLIのパスを解決
		this.cliPath = join(__dirname, '../../dist/cli.js');
	}

	/**
	 * CLIプロセスを起動
	 */
	async spawn(args: string[], options: CLIRunnerOptions): Promise<void> {
		const isInteractiveCommand = args.includes('interactive');
		this.isInteractive = isInteractiveCommand;

		if (isInteractiveCommand) {
			return this.spawnWithPty(args, options);
		}

		return this.spawnWithExeca(args, options);
	}

	/**
	 * Execaを使用してCLIプロセスを起動
	 */
	private async spawnWithExeca(args: string[], options: CLIRunnerOptions): Promise<void> {
		return new Promise((resolve, reject) => {
			const timeout = options.timeout || CLI_SPAWN_TIMEOUT;

			this.process = execa('node', [this.cliPath, ...args], {
				cwd: options.cwd,
				env: this.buildEnvironment(options.env),
				all: true,
				reject: false,
			});

			// オブジェクトで包むことで参照渡しを実現
			const state = { settled: false };

			const timer = this.setupTimeoutHandler(timeout, () => {
				const isNotSettled = !state.settled;
				if (isNotSettled) {
					state.settled = true;
					this.kill();
					reject(CLITestError.timeout(timeout));
				}
			});

			this.setupStdoutListener();
			this.setupStderrListener();
			this.setupProcessExitHandler(state, timer, resolve);

			// 起動確認
			setTimeout(() => {
				const isNotSettled = !state.settled;
				if (isNotSettled) {
					state.settled = true;
					clearTimeout(timer);
					resolve();
				}
			}, STARTUP_DELAY);
		});
	}

	/**
	 * 環境変数を構築
	 */
	private buildEnvironment(customEnv?: Record<string, string>): NodeJS.ProcessEnv {
		return {
			...process.env,
			...customEnv,
			FORCE_COLOR: '1',
		};
	}

	/**
	 * タイムアウトハンドラーを設定
	 */
	private setupTimeoutHandler(timeout: number, onTimeout: () => void): NodeJS.Timeout {
		return setTimeout(onTimeout, timeout);
	}

	/**
	 * 標準出力リスナーを設定
	 */
	private setupStdoutListener(): void {
		const hasStdout = this.process?.stdout;
		if (!hasStdout) {
			return;
		}

		this.process.stdout.on('data', (data: Buffer) => {
			const text = data.toString();
			this.output += text;
			this.emit('data', text);
		});
	}

	/**
	 * 標準エラー出力リスナーを設定
	 */
	private setupStderrListener(): void {
		const hasStderr = this.process?.stderr;
		if (!hasStderr) {
			return;
		}

		this.process.stderr.on('data', (data: Buffer) => {
			const text = data.toString();
			this.output += text;
			this.emit('data', text);
		});
	}

	/**
	 * プロセス終了ハンドラーを設定
	 */
	private setupProcessExitHandler(
		state: { settled: boolean },
		timer: NodeJS.Timeout,
		resolve: () => void
	): void {
		const hasProcess = this.process;
		if (!hasProcess) {
			return;
		}

		this.process
			.then((result) => {
				this.exitCode = result.exitCode;
				this.hasExited = true;
				this.emit('exit', result.exitCode);
				const isNotSettled = !state.settled;
				if (isNotSettled) {
					state.settled = true;
					clearTimeout(timer);
					resolve();
				}
			})
			.catch((error) => {
				const hasOutput = error.all;
				if (hasOutput) {
					this.output += error.all;
				}
				this.exitCode = error.exitCode || 1;
				this.hasExited = true;
				this.emit('exit', error.exitCode || 1);
				const isNotSettled = !state.settled;
				if (isNotSettled) {
					state.settled = true;
					clearTimeout(timer);
					resolve();
				}
			});
	}

	/**
	 * PTYを使用してインタラクティブCLIプロセスを起動
	 */
	private async spawnWithPty(args: string[], options: CLIRunnerOptions): Promise<void> {
		return new Promise((resolve, reject) => {
			const timeout = options.timeout || CLI_SPAWN_TIMEOUT;

			this.ptyProcess = ptySpawn(process.execPath, [this.cliPath, ...args], {
				name: 'xterm-color',
				cols: 80,
				rows: 30,
				cwd: options.cwd,
				env: this.buildEnvironment(options.env),
			});

			let settled = false;

			const timer = this.setupTimeoutHandler(timeout, () => {
				const isNotSettled = !settled;
				if (isNotSettled) {
					settled = true;
					this.kill();
					reject(CLITestError.timeout(timeout));
				}
			});

			// 出力を監視
			this.ptyProcess.onData((data: string) => {
				this.output += data;
				this.emit('data', data);
			});

			// プロセス終了を監視
			this.ptyProcess.onExit((event) => {
				this.exitCode = event.exitCode;
				this.hasExited = true;
				this.emit('exit', event.exitCode);
				const isNotSettled = !settled;
				if (isNotSettled) {
					settled = true;
					clearTimeout(timer);
					resolve();
				}
			});

			// 起動確認
			setTimeout(() => {
				const isNotSettled = !settled;
				if (isNotSettled) {
					settled = true;
					clearTimeout(timer);
					resolve();
				}
			}, STARTUP_DELAY);
		});
	}

	/**
	 * キー入力を送信 (インタラクティブモード用)
	 */
	write(input: string): void {
		const isUsingPty = this.isInteractive;
		if (isUsingPty) {
			const noProcess = !this.ptyProcess;
			if (noProcess) {
				throw CLITestError.ptyNotStarted();
			}
			this.ptyProcess.write(input);
		} else {
			const noProcess = !this.process || !this.process.stdin;
			if (noProcess) {
				throw CLITestError.stdinNotAvailable();
			}
			this.process.stdin.write(input);
		}
	}

	/**
	 * 特殊キーを送信
	 */
	sendKey(key: 'enter' | 'escape' | 'space' | 'up' | 'down'): void {
		const keyMap = {
			enter: '\r',
			escape: '\x1b',
			space: ' ',
			up: '\x1b[A',
			down: '\x1b[B',
		};
		this.write(keyMap[key]);
	}

	/**
	 * 出力待機 (特定のテキストが出現するまで)
	 */
	async waitForOutput(pattern: string | RegExp, timeout = OUTPUT_WAIT_TIMEOUT): Promise<void> {
		return new Promise((resolve, reject) => {
			const checkPatternMatch = (): void => {
				const cleanOutput = stripAnsi(this.output);
				const isRegexPattern = pattern instanceof RegExp;
				const isMatched = isRegexPattern
					? pattern.test(cleanOutput)
					: cleanOutput.includes(pattern);

				if (isMatched) {
					clearTimeout(timer);
					resolve();
				}
			};

			const timer = setTimeout(() => {
				reject(CLITestError.outputTimeout(pattern));
			}, timeout);

			checkPatternMatch();
			this.on('data', checkPatternMatch);
		});
	}

	/**
	 * プロセス終了を待機
	 */
	async waitForExit(timeout = EXIT_WAIT_TIMEOUT): Promise<number> {
		return new Promise((resolve, reject) => {
			// すでにプロセスが終了している場合は即座に解決
			const alreadyExited = this.hasExited;
			if (alreadyExited) {
				return resolve(this.exitCode ?? 0);
			}

			const isUsingPty = this.isInteractive;
			const noProcess = isUsingPty ? !this.ptyProcess : !this.process;
			if (noProcess) {
				return reject(CLITestError.processNotStarted());
			}

			const timer = setTimeout(() => {
				reject(CLITestError.exitTimeout());
			}, timeout);

			this.once('exit', (code) => {
				clearTimeout(timer);
				resolve(code);
			});
		});
	}

	/**
	 * プロセスを強制終了
	 */
	kill(): void {
		if (this.ptyProcess) {
			this.ptyProcess.kill();
			this.ptyProcess = null;
		}
		if (this.process) {
			this.process.kill();
			this.process = null;
		}
		this.isInteractive = false;
	}

	/**
	 * 生出力を取得
	 */
	getRawOutput(): string {
		return this.output;
	}

	/**
	 * ANSI制御文字を除去した出力を取得
	 */
	getCleanOutput(): string {
		return stripAnsi(this.output);
	}

	/**
	 * 出力をリセット
	 */
	clearOutput(): void {
		this.output = '';
	}
}
