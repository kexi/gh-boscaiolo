import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import Spinner from 'ink-spinner';
import { useWorktrees } from '../hooks/useWorktrees.js';
import { WorktreeManager } from '../core/worktree.js';
import WorktreeTable from './WorktreeTable.js';
import type { CommandFlags } from '../types/index.js';

export default function DeletedCommand({ dryRun, verbose, yes }: CommandFlags) {
  const [stage, setStage] = useState<'loading' | 'display' | 'cleanup' | 'done'>('loading');
  const [result, setResult] = useState<{ removed: string[]; failed: Array<{ path: string; error: string }> } | null>(null);
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
      } else if (shouldAutoCleanup) {
        setStage('cleanup');
      } else {
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
    return (
      <Box>
        <Text color="cyan">
          <Spinner type="dots" />
        </Text>
        <Text> Scanning worktrees...</Text>
      </Box>
    );
  }

  const hasError = error !== null;
  if (hasError) {
    return <Text color="red">Error: {error}</Text>;
  }

  const hasNoTargets = deletedWorktrees.length === 0;
  if (hasNoTargets) {
    return <Text color="green">✓ No deleted branch worktrees found</Text>;
  }

  const isDisplayStage = stage === 'display';
  if (isDisplayStage) {
    const isDryRunMode = dryRun === true;

    return (
      <Box flexDirection="column">
        <Text color="yellow">
          Found {deletedWorktrees.length} worktrees with deleted branches:
        </Text>
        <WorktreeTable worktrees={deletedWorktrees} verbose={verbose} />
        <Text>
          {isDryRunMode ? (
            <Text color="blue">[DRY RUN] Would remove these worktrees</Text>
          ) : (
            <Text color="yellow">Run with --yes to remove these worktrees</Text>
          )}
        </Text>
      </Box>
    );
  }

  const isCleanupStage = stage === 'cleanup';
  if (isCleanupStage) {
    return (
      <Box>
        <Text color="cyan">
          <Spinner type="dots" />
        </Text>
        <Text> Removing worktrees...</Text>
      </Box>
    );
  }

  // done
  const isDryRunMode = dryRun === true;
  if (isDryRunMode) {
    return (
      <Box flexDirection="column">
        <Text color="blue">[DRY RUN] Would remove {deletedWorktrees.length} worktrees</Text>
        <Text color="green">✓ Dry run complete</Text>
      </Box>
    );
  }

  const hasResult = result !== null;
  if (hasResult) {
    const hasFailures = result.failed.length > 0;

    return (
      <Box flexDirection="column">
        <Text color="green">✓ Removed {result.removed.length} worktrees</Text>
        {hasFailures && (
          <Box flexDirection="column" marginTop={1}>
            <Text color="red">Failed to remove {result.failed.length} worktrees:</Text>
            {result.failed.map((f, i) => (
              <Text key={i} color="red">  • {f.path}: {f.error}</Text>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  return <Text color="green">✓ Cleanup complete</Text>;
}
