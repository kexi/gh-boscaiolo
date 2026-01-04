import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import Spinner from 'ink-spinner';
import { WorktreeManager } from '../core/worktree.js';
import { formatDistance } from 'date-fns';
import { ja } from 'date-fns/locale';
export default function StaleCommand({ days = 30, dryRun, verbose, yes }) {
    const [stage, setStage] = useState('loading');
    const [staleWorktrees, setStaleWorktrees] = useState([]);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        async function fetchStaleWorktrees() {
            try {
                const manager = new WorktreeManager();
                const stale = await manager.findStaleWorktrees(days);
                setStaleWorktrees(stale);
                const hasNoTargets = stale.length === 0;
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
            catch (err) {
                const isError = err instanceof Error;
                const message = isError ? err.message : 'Unknown error';
                setError(message);
                setStage('done');
            }
        }
        fetchStaleWorktrees();
    }, [days, yes]);
    useEffect(() => {
        const isCleanupStage = stage === 'cleanup';
        if (isCleanupStage) {
            async function performCleanup() {
                const manager = new WorktreeManager();
                const cleanupResult = await manager.removeWorktrees(staleWorktrees, { dryRun });
                setResult(cleanupResult);
                setStage('done');
            }
            performCleanup();
        }
    }, [stage, staleWorktrees, dryRun]);
    const isLoadingStage = stage === 'loading';
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
    const hasNoTargets = staleWorktrees.length === 0;
    if (hasNoTargets) {
        return React.createElement(Text, { color: "green" },
            "\u2713 No stale worktrees found (older than ",
            days,
            " days)");
    }
    const isDisplayStage = stage === 'display';
    if (isDisplayStage) {
        const isDryRunMode = dryRun === true;
        return (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, { color: "yellow" },
                "Found ",
                staleWorktrees.length,
                " stale worktrees (older than ",
                days,
                " days):"),
            React.createElement(Box, { flexDirection: "column", marginY: 1 }, staleWorktrees.map((wt, i) => {
                const lastAccessed = wt.lastAccessed;
                const timeAgo = lastAccessed
                    ? formatDistance(lastAccessed, new Date(), { addSuffix: true, locale: ja })
                    : 'unknown';
                return (React.createElement(Box, { key: i, flexDirection: "column" },
                    React.createElement(Text, null,
                        (wt.branch || 'detached').padEnd(20),
                        " ",
                        wt.path),
                    verbose && (React.createElement(Text, { color: "gray" },
                        "  Last accessed: ",
                        timeAgo))));
            })),
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
                staleWorktrees.length,
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
//# sourceMappingURL=StaleCommand.js.map