import React from 'react';
import { Box, Text } from 'ink';
import type { Worktree } from '../types/index.js';

interface WorktreeTableProps {
  worktrees: Worktree[];
  verbose?: boolean;
}

export default function WorktreeTable({ worktrees, verbose }: WorktreeTableProps) {
  const isVerboseMode = verbose === true;

  return (
    <Box flexDirection="column" marginY={1}>
      {worktrees.map((wt, i) => {
        const status = wt.isPrunable ? ' [deleted]' : wt.isLocked ? ' [locked]' : '';
        return (
          <Box key={i}>
            <Text>
              {(wt.branch || 'detached').padEnd(20)} {wt.path}{status}
              {isVerboseMode && ` ${wt.commit.substring(0, 7)}`}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
