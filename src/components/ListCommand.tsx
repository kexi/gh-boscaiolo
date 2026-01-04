import React from 'react';
import { Text, Box } from 'ink';
import Spinner from 'ink-spinner';
import { useWorktrees } from '../hooks/useWorktrees.js';
import WorktreeTable from './WorktreeTable.js';
import type { CommandFlags } from '../types/index.js';

export default function ListCommand({ verbose }: CommandFlags) {
  const { worktrees, loading, error } = useWorktrees();

  const isLoadingStage = loading;
  if (isLoadingStage) {
    return (
      <Box>
        <Text color="cyan">
          <Spinner type="dots" />
        </Text>
        <Text> Loading worktrees...</Text>
      </Box>
    );
  }

  const hasError = error !== null;
  if (hasError) {
    return <Text color="red">Error: {error}</Text>;
  }

  const hasNoWorktrees = worktrees.length === 0;
  if (hasNoWorktrees) {
    return <Text color="yellow">No worktrees found</Text>;
  }

  // 統計情報
  const deletedCount = worktrees.filter(wt => wt.branchDeleted).length;
  const lockedCount = worktrees.filter(wt => wt.isLocked).length;

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color="cyan" bold>Worktrees ({worktrees.length} total)</Text>
      </Box>

      <WorktreeTable worktrees={worktrees} verbose={verbose} />

      <Box flexDirection="column" marginTop={1}>
        <Text color="gray">Statistics:</Text>
        <Text color="gray">  • Total: {worktrees.length}</Text>
        {deletedCount > 0 && (
          <Text color="yellow">  • Deleted branches: {deletedCount}</Text>
        )}
        {lockedCount > 0 && (
          <Text color="blue">  • Locked: {lockedCount}</Text>
        )}
      </Box>
    </Box>
  );
}
