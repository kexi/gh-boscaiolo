import React from 'react';
import { Box, Text } from 'ink';
export default function WorktreeTable({ worktrees, verbose }) {
    const isVerboseMode = verbose === true;
    return (React.createElement(Box, { flexDirection: "column", marginY: 1 }, worktrees.map((wt, i) => (React.createElement(Box, { key: i },
        React.createElement(Text, null,
            (wt.branch || 'detached').padEnd(20),
            " ",
            wt.path,
            isVerboseMode && ` ${wt.commit.substring(0, 7)}${wt.isLocked ? ' 🔒' : ''}`))))));
}
//# sourceMappingURL=WorktreeTable.js.map