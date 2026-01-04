import type { GitCommandOptions } from '../types/index.js';
export declare class GitExecutor {
    execute(command: string, options?: GitCommandOptions): Promise<string>;
    isGitRepository(): Promise<boolean>;
}
//# sourceMappingURL=git.d.ts.map