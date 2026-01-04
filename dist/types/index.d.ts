export interface Worktree {
    path: string;
    branch: string | null;
    commit: string;
    isPrunable: boolean;
    isLocked: boolean;
    lockReason?: string;
    branchDeleted?: boolean;
    lastAccessed?: Date;
}
export interface WorktreeCleanupOptions {
    dryRun?: boolean;
    verbose?: boolean;
    skipConfirmation?: boolean;
}
export interface CleanupResult {
    total: number;
    removed: string[];
    failed: Array<{
        path: string;
        error: string;
    }>;
}
export interface GitCommandOptions {
    cwd?: string;
    throwOnError?: boolean;
}
export interface CommandFlags {
    days?: number;
    base?: string;
    dryRun?: boolean;
    verbose?: boolean;
    yes?: boolean;
}
//# sourceMappingURL=index.d.ts.map