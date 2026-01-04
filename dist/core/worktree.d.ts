import type { Worktree, WorktreeCleanupOptions } from '../types/index.js';
export declare class WorktreeManager {
    private git;
    constructor();
    listWorktrees(): Promise<Worktree[]>;
    private parseWorktreeList;
    listBranches(): Promise<string[]>;
    findStaleWorktrees(days: number): Promise<Worktree[]>;
    findDeletedBranchWorktrees(): Promise<Worktree[]>;
    findMergedBranchWorktrees(baseBranch: string): Promise<Worktree[]>;
    private listMergedBranches;
    hasUncommittedChanges(worktreePath: string): Promise<boolean>;
    removeWorktree(path: string, force?: boolean): Promise<void>;
    removeWorktrees(worktrees: Worktree[], options?: WorktreeCleanupOptions): Promise<{
        removed: string[];
        failed: Array<{
            path: string;
            error: string;
        }>;
    }>;
}
//# sourceMappingURL=worktree.d.ts.map