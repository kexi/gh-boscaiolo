import React, { useState, useEffect } from 'react';
import { Text, Box, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { useWorktrees } from '../hooks/useWorktrees.js';
import { WorktreeManager } from '../core/worktree.js';
import type { CommandFlags } from '../types/index.js';
import type { Worktree } from '../types/index.js';

export default function InteractiveCommand({ dryRun }: CommandFlags) {
  const [stage, setStage] = useState<'loading' | 'select' | 'cleanup' | 'done'>('loading');
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [cursorIndex, setCursorIndex] = useState(0);
  const [result, setResult] = useState<{ removed: string[]; failed: Array<{ path: string; error: string }> } | null>(null);
  const { worktrees, loading, error } = useWorktrees();

  useEffect(() => {
    const hasLoaded = !loading;
    if (hasLoaded) {
      const hasNoWorktrees = worktrees.length === 0;
      if (hasNoWorktrees) {
        setStage('done');
      } else {
        setStage('select');
      }
    }
  }, [loading, worktrees.length]);

  useInput((input, key) => {
    const isSelectStage = stage === 'select';
    if (!isSelectStage) return;

    // Arrow keys
    if (key.upArrow) {
      const newIndex = Math.max(0, cursorIndex - 1);
      setCursorIndex(newIndex);
    } else if (key.downArrow) {
      const newIndex = Math.min(worktrees.length - 1, cursorIndex + 1);
      setCursorIndex(newIndex);
    }

    // Space to toggle selection
    if (input === ' ') {
      const newSelected = new Set(selectedIndices);
      const isSelected = newSelected.has(cursorIndex);
      if (isSelected) {
        newSelected.delete(cursorIndex);
      } else {
        newSelected.add(cursorIndex);
      }
      setSelectedIndices(newSelected);
    }

    // Enter to confirm
    if (key.return) {
      const hasNoSelection = selectedIndices.size === 0;
      if (hasNoSelection) {
        setStage('done');
      } else {
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

  const isSelectStage = stage === 'select';
  if (isSelectStage) {
    return (
      <Box flexDirection="column">
        <Text color="cyan" bold>Select worktrees to remove (Space to select, Enter to confirm, Esc to cancel)</Text>
        <Box flexDirection="column" marginY={1}>
          {worktrees.map((wt, i) => {
            const isCursor = i === cursorIndex;
            const isSelected = selectedIndices.has(i);
            const cursor = isCursor ? '>' : ' ';
            const checkbox = isSelected ? '☑' : '☐';

            return (
              <Box key={wt.path}>
                <Text color={isCursor ? 'cyan' : undefined}>
                  {cursor} {checkbox} {(wt.branch || 'detached').padEnd(20)} {wt.path}
                  {wt.branchDeleted && <Text color="yellow"> [deleted]</Text>}
                  {wt.isLocked && <Text color="blue"> 🔒</Text>}
                </Text>
              </Box>
            );
          })}
        </Box>
        <Text color="gray">Selected: {selectedIndices.size}</Text>
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
  const hasNoSelection = selectedIndices.size === 0;
  if (hasNoSelection) {
    return <Text color="yellow">No worktrees selected</Text>;
  }

  const isDryRunMode = dryRun === true;
  if (isDryRunMode) {
    return (
      <Box flexDirection="column">
        <Text color="blue">[DRY RUN] Would remove {selectedIndices.size} worktrees</Text>
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
