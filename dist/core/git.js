import { execSync } from 'child_process';
export class GitExecutor {
    async execute(command, options = {}) {
        try {
            const output = execSync(`git ${command}`, {
                cwd: options.cwd || process.cwd(),
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: '/bin/bash',
            });
            return output.trim();
        }
        catch (error) {
            const shouldThrow = options.throwOnError !== false;
            if (shouldThrow) {
                const isError = error instanceof Error;
                const message = isError ? error.message : 'Unknown git error';
                throw new Error(`Git command failed: ${message}`);
            }
            return '';
        }
    }
    async isGitRepository() {
        try {
            await this.execute('rev-parse --git-dir');
            return true;
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=git.js.map