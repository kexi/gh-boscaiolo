import { execSync } from 'child_process';
import type { GitCommandOptions } from '../types/index.js';

export class GitExecutor {
  async execute(command: string, options: GitCommandOptions = {}): Promise<string> {
    try {
      const output = execSync(`git ${command}`, {
        cwd: options.cwd || process.cwd(),
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return output.trim();
    } catch (error: unknown) {
      const shouldThrow = options.throwOnError !== false;
      if (shouldThrow) {
        const isError = error instanceof Error;
        const message = isError ? error.message : 'Unknown git error';
        throw new Error(`Git command failed: ${message}`);
      }
      return '';
    }
  }

  async isGitRepository(): Promise<boolean> {
    try {
      await this.execute('rev-parse --git-dir');
      return true;
    } catch {
      return false;
    }
  }
}
