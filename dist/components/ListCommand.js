import React from 'react';
import { Text, Box } from 'ink';
import Spinner from 'ink-spinner';
import { useWorktrees } from '../hooks/useWorktrees.js';
import WorktreeTable from './WorktreeTable.js';
export default function ListCommand({ verbose }) {
    const { worktrees, loading, error } = useWorktrees();
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
    // 統計情報
    const deletedCount = worktrees.filter(wt => wt.branchDeleted).length;
    const lockedCount = worktrees.filter(wt => wt.isLocked).length;
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { color: "cyan", bold: true },
                "Worktrees (",
                worktrees.length,
                " total)")),
        React.createElement(WorktreeTable, { worktrees: worktrees, verbose: verbose }),
        React.createElement(Box, { flexDirection: "column", marginTop: 1 },
            React.createElement(Text, { color: "gray" }, "Statistics:"),
            React.createElement(Text, { color: "gray" },
                "  \u2022 Total: ",
                worktrees.length),
            deletedCount > 0 && (React.createElement(Text, { color: "yellow" },
                "  \u2022 Deleted branches: ",
                deletedCount)),
            lockedCount > 0 && (React.createElement(Text, { color: "blue" },
                "  \u2022 Locked: ",
                lockedCount)))));
}
//# sourceMappingURL=ListCommand.js.map