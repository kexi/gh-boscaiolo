import { useState, useEffect } from 'react';
import { WorktreeManager } from '../core/worktree.js';
export function useWorktrees() {
    const [worktrees, setWorktrees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        async function fetchWorktrees() {
            try {
                const manager = new WorktreeManager();
                const list = await manager.listWorktrees();
                setWorktrees(list);
            }
            catch (err) {
                const isError = err instanceof Error;
                const message = isError ? err.message : 'Unknown error';
                setError(message);
            }
            finally {
                setLoading(false);
            }
        }
        fetchWorktrees();
    }, []);
    return { worktrees, loading, error };
}
//# sourceMappingURL=useWorktrees.js.map