import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import Spinner from 'ink-spinner';
import { useWorktrees } from '../hooks/useWorktrees.js';
import { WorktreeManager } from '../core/worktree.js';
import WorktreeTable from './WorktreeTable.js';
export default function DeletedCommand({ dryRun, verbose, yes }) {
    const [stage, setStage] = useState('loading');
    const [result, setResult] = useState(null);
    const { worktrees, loading, error } = useWorktrees();
    // 削除されたブランチのworktreeをフィルター（prunableまたはbranchDeleted）
    const deletedWorktrees = worktrees.filter(wt => wt.isPrunable || wt.branchDeleted);
    useEffect(() => {
        const hasLoaded = !loading;
        if (hasLoaded) {
            const hasNoTargets = deletedWorktrees.length === 0;
            const shouldAutoCleanup = yes === true;
            if (hasNoTargets) {
                setStage('done');
            }
            else if (shouldAutoCleanup) {
                setStage('cleanup');
            }
            else {
                setStage('display');
            }
        }
    }, [loading, deletedWorktrees.length, yes]);
    useEffect(() => {
        const isCleanupStage = stage === 'cleanup';
        if (isCleanupStage) {
            async function performCleanup() {
                const manager = new WorktreeManager();
                const cleanupResult = await manager.removeWorktrees(deletedWorktrees, { dryRun });
                setResult(cleanupResult);
                setStage('done');
            }
            performCleanup();
        }
    }, [stage, deletedWorktrees, dryRun]);
    const isLoadingStage = loading;
    if (isLoadingStage) {
        return (React.createElement(Box, null,
            React.createElement(Text, { color: "cyan" },
                React.createElement(Spinner, { type: "dots" })),
            React.createElement(Text, null, " Scanning worktrees...")));
    }
    const hasError = error !== null;
    if (hasError) {
        return React.createElement(Text, { color: "red" },
            "Error: ",
            error);
    }
    const hasNoTargets = deletedWorktrees.length === 0;
    if (hasNoTargets) {
        return React.createElement(Text, { color: "green" }, "\u2713 No deleted branch worktrees found");
    }
    const isDisplayStage = stage === 'display';
    if (isDisplayStage) {
        const isDryRunMode = dryRun === true;
        return (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, { color: "yellow" },
                "Found ",
                deletedWorktrees.length,
                " worktrees with deleted branches:"),
            React.createElement(WorktreeTable, { worktrees: deletedWorktrees, verbose: verbose }),
            React.createElement(Text, null, isDryRunMode ? (React.createElement(Text, { color: "blue" }, "[DRY RUN] Would remove these worktrees")) : (React.createElement(Text, { color: "yellow" }, "Run with --yes to remove these worktrees")))));
    }
    const isCleanupStage = stage === 'cleanup';
    if (isCleanupStage) {
        return (React.createElement(Box, null,
            React.createElement(Text, { color: "cyan" },
                React.createElement(Spinner, { type: "dots" })),
            React.createElement(Text, null, " Removing worktrees...")));
    }
    // done
    const isDryRunMode = dryRun === true;
    if (isDryRunMode) {
        return (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, { color: "blue" },
                "[DRY RUN] Would remove ",
                deletedWorktrees.length,
                " worktrees"),
            React.createElement(Text, { color: "green" }, "\u2713 Dry run complete")));
    }
    const hasResult = result !== null;
    if (hasResult) {
        const hasFailures = result.failed.length > 0;
        return (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, { color: "green" },
                "\u2713 Removed ",
                result.removed.length,
                " worktrees"),
            hasFailures && (React.createElement(Box, { flexDirection: "column", marginTop: 1 },
                React.createElement(Text, { color: "red" },
                    "Failed to remove ",
                    result.failed.length,
                    " worktrees:"),
                result.failed.map((f, i) => (React.createElement(Text, { key: i, color: "red" },
                    "  \u2022 ",
                    f.path,
                    ": ",
                    f.error)))))));
    }
    return React.createElement(Text, { color: "green" }, "\u2713 Cleanup complete");
}
//# sourceMappingURL=DeletedCommand.js.map