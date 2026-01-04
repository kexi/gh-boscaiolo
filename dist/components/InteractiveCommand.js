import React, { useState, useEffect } from 'react';
import { Text, Box, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { useWorktrees } from '../hooks/useWorktrees.js';
import { WorktreeManager } from '../core/worktree.js';
export default function InteractiveCommand({ dryRun }) {
    const [stage, setStage] = useState('loading');
    const [selectedIndices, setSelectedIndices] = useState(new Set());
    const [cursorIndex, setCursorIndex] = useState(0);
    const [result, setResult] = useState(null);
    const { worktrees, loading, error } = useWorktrees();
    useEffect(() => {
        const hasLoaded = !loading;
        if (hasLoaded) {
            const hasNoWorktrees = worktrees.length === 0;
            if (hasNoWorktrees) {
                setStage('done');
            }
            else {
                setStage('select');
            }
        }
    }, [loading, worktrees.length]);
    useInput((input, key) => {
        const isSelectStage = stage === 'select';
        if (!isSelectStage)
            return;
        // Arrow keys
        if (key.upArrow) {
            const newIndex = Math.max(0, cursorIndex - 1);
            setCursorIndex(newIndex);
        }
        else if (key.downArrow) {
            const newIndex = Math.min(worktrees.length - 1, cursorIndex + 1);
            setCursorIndex(newIndex);
        }
        // Space to toggle selection
        if (input === ' ') {
            const newSelected = new Set(selectedIndices);
            const isSelected = newSelected.has(cursorIndex);
            if (isSelected) {
                newSelected.delete(cursorIndex);
            }
            else {
                newSelected.add(cursorIndex);
            }
            setSelectedIndices(newSelected);
        }
        // Enter to confirm
        if (key.return) {
            const hasNoSelection = selectedIndices.size === 0;
            if (hasNoSelection) {
                setStage('done');
            }
            else {
                setStage('cleanup');
            }
        }
        // Escape to cancel
        if (key.escape) {
            setStage('done');
        }
    });
    useEffect(() => {
        const isCleanupStage = stage === 'cleanup';
        if (isCleanupStage) {
            async function performCleanup() {
                const selectedWorktrees = worktrees.filter((_, i) => selectedIndices.has(i));
                const manager = new WorktreeManager();
                const cleanupResult = await manager.removeWorktrees(selectedWorktrees, { dryRun });
                setResult(cleanupResult);
                setStage('done');
            }
            performCleanup();
        }
    }, [stage, worktrees, selectedIndices, dryRun]);
    const isLoadingStage = loading;
    if (isLoadingStage) {
        return (React.createElement(Box, null,
            React.createElement(Text, { color: "cyan" },
                React.createElement(Spinner, { type: "dots" })),
            React.createElement(Text, null, " Loading worktrees...")));
    }
    const hasError = error !== null;
    if (hasError) {
        return React.createElement(Text, { color: "red" },
            "Error: ",
            error);
    }
    const hasNoWorktrees = worktrees.length === 0;
    if (hasNoWorktrees) {
        return React.createElement(Text, { color: "yellow" }, "No worktrees found");
    }
    const isSelectStage = stage === 'select';
    if (isSelectStage) {
        return (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, { color: "cyan", bold: true }, "Select worktrees to remove (Space to select, Enter to confirm, Esc to cancel)"),
            React.createElement(Box, { flexDirection: "column", marginY: 1 }, worktrees.map((wt, i) => {
                const isCursor = i === cursorIndex;
                const isSelected = selectedIndices.has(i);
                const cursor = isCursor ? '>' : ' ';
                const checkbox = isSelected ? '☑' : '☐';
                return (React.createElement(Box, { key: wt.path },
                    React.createElement(Text, { color: isCursor ? 'cyan' : undefined },
                        cursor,
                        " ",
                        checkbox,
                        " ",
                        (wt.branch || 'detached').padEnd(20),
                        " ",
                        wt.path,
                        wt.branchDeleted && React.createElement(Text, { color: "yellow" }, " [deleted]"),
                        wt.isLocked && React.createElement(Text, { color: "blue" }, " \uD83D\uDD12"))));
            })),
            React.createElement(Text, { color: "gray" },
                "Selected: ",
                selectedIndices.size)));
    }
    const isCleanupStage = stage === 'cleanup';
    if (isCleanupStage) {
        return (React.createElement(Box, null,
            React.createElement(Text, { color: "cyan" },
                React.createElement(Spinner, { type: "dots" })),
            React.createElement(Text, null, " Removing worktrees...")));
    }
    // done
    const hasNoSelection = selectedIndices.size === 0;
    if (hasNoSelection) {
        return React.createElement(Text, { color: "yellow" }, "No worktrees selected");
    }
    const isDryRunMode = dryRun === true;
    if (isDryRunMode) {
        return (React.createElement(Box, { flexDirection: "column" },
            React.createElement(Text, { color: "blue" },
                "[DRY RUN] Would remove ",
                selectedIndices.size,
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
//# sourceMappingURL=InteractiveCommand.js.map