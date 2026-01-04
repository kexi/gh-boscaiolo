import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
	test: {
		// ESM環境
		environment: 'node',

		// グローバルタイムアウト (CLIは遅延が発生する可能性)
		testTimeout: 30000,
		hookTimeout: 30000,

		// ファイルパターン
		include: ['tests/**/*.test.{ts,tsx}'],

		// カバレッジ設定
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: ['src/**/*.{ts,tsx}'],
			exclude: ['src/**/*.d.ts', 'src/types/**', 'dist/**'],
		},

		// 並列実行を無効化 (Git操作の競合を防ぐ)
		pool: 'forks',
		poolOptions: {
			forks: {
				singleFork: true,
			},
		},

		// TypeScript解決
		resolve: {
			alias: {
				'@': join(__dirname, 'src'),
			},
		},
	},
});
