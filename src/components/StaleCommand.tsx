import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import Spinner from 'ink-spinner';
import { WorktreeManager } from '../core/worktree.js';
import WorktreeTable from './WorktreeTable.js';
import type { CommandFlags } from '../types/index.js';
import type { Worktree } from '../types/index.js';
import { formatDistance } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function StaleCommand({ days = 30, dryRun, verbose, yes }: CommandFlags) {
  const [stage, setStage] = useState<'loading' | 'display' | 'cleanup' | 'done'>('loading');
  const [staleWorktrees, setStaleWorktrees] = useState<Worktree[]>([]);
  const [result, setResult] = useState<{ removed: string[]; failed: Array<{ path: string; error: string }> } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        } else if (shouldAutoCleanup) {
          setStage('cleanup');
        } else {
          setStage('display');
        }
      } catch (err: unknown) {
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

  const hasNoTargets = staleWorktrees.length === 0;
  if (hasNoTargets) {
    return <Text color="green">✓ No stale worktrees found (older than {days} days)</Text>;
  }

  const isDisplayStage = stage === 'display';
  if (isDisplayStage) {
    const isDryRunMode = dryRun === true;

    return (
      <Box flexDirection="column">
        <Text color="yellow">
          Found {staleWorktrees.length} stale worktrees (older than {days} days):
        </Text>
        <Box flexDirection="column" marginY={1}>
          {staleWorktrees.map((wt, i) => {
            const lastAccessed = wt.lastAccessed;
            const timeAgo = lastAccessed
              ? formatDistance(lastAccessed, new Date(), { addSuffix: true, locale: ja })
              : 'unknown';

            return (
              <Box key={i} flexDirection="column">
                <Text>
                  {(wt.branch || 'detached').padEnd(20)} {wt.path}
                </Text>
                {verbose && (
                  <Text color="gray">  Last accessed: {timeAgo}</Text>
                )}
              </Box>
            );
          })}
        </Box>
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
        <Text color="blue">[DRY RUN] Would remove {staleWorktrees.length} worktrees</Text>
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
