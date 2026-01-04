import { useState, useEffect } from 'react';
import { WorktreeManager } from '../core/worktree.js';
import type { Worktree } from '../types/index.js';

export function useWorktrees() {
  const [worktrees, setWorktrees] = useState<Worktree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWorktrees() {
      try {
        const manager = new WorktreeManager();
        const list = await manager.listWorktrees();
        setWorktrees(list);
      } catch (err: unknown) {
        const isError = err instanceof Error;
        const message = isError ? err.message : 'Unknown error';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchWorktrees();
  }, []);

  return { worktrees, loading, error };
}
