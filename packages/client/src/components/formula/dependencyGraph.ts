/**
 * Dependency graph for formula recalculation.
 * Tracks which cells depend on which other cells, supports
 * topological sort for recalculation order and circular reference detection.
 */

export class DependencyGraph {
  /**
   * Maps a cell to the set of cells it depends on (references).
   * e.g., if A1 = B1 + C1, then dependsOn.get("A1") = {"B1", "C1"}
   */
  private dependsOn: Map<string, Set<string>> = new Map();

  /**
   * Maps a cell to the set of cells that reference it (reverse index).
   * e.g., if A1 = B1 + C1, then dependents.get("B1") contains "A1"
   */
  private dependents: Map<string, Set<string>> = new Map();

  /**
   * Add a dependency: `cell` depends on `dependsOnCell`.
   */
  addDependency(cell: string, dependsOnCell: string): void {
    if (!this.dependsOn.has(cell)) {
      this.dependsOn.set(cell, new Set());
    }
    this.dependsOn.get(cell)!.add(dependsOnCell);

    if (!this.dependents.has(dependsOnCell)) {
      this.dependents.set(dependsOnCell, new Set());
    }
    this.dependents.get(dependsOnCell)!.add(cell);
  }

  /**
   * Remove all dependencies for a cell (before re-parsing its formula).
   */
  removeDependencies(cell: string): void {
    const deps = this.dependsOn.get(cell);
    if (deps) {
      for (const dep of deps) {
        const rev = this.dependents.get(dep);
        if (rev) {
          rev.delete(cell);
          if (rev.size === 0) this.dependents.delete(dep);
        }
      }
      this.dependsOn.delete(cell);
    }
  }

  /**
   * Get direct dependents of a cell (cells that reference it).
   */
  getDirectDependents(cell: string): string[] {
    const deps = this.dependents.get(cell);
    return deps ? [...deps] : [];
  }

  /**
   * Get all transitive dependents of a cell.
   */
  getAllDependents(cell: string): Set<string> {
    const result = new Set<string>();
    const queue = [cell];

    while (queue.length > 0) {
      const current = queue.pop()!;
      const deps = this.dependents.get(current);
      if (deps) {
        for (const dep of deps) {
          if (!result.has(dep)) {
            result.add(dep);
            queue.push(dep);
          }
        }
      }
    }

    return result;
  }

  /**
   * Detect if adding/keeping current dependencies for `cell` creates a cycle.
   * Uses DFS from `cell` through dependsOn to see if we can reach `cell` again.
   */
  detectCircular(cell: string): boolean {
    const visited = new Set<string>();

    const dfs = (current: string): boolean => {
      if (current === cell && visited.size > 0) return true;
      if (visited.has(current)) return false;
      visited.add(current);

      const deps = this.dependsOn.get(current);
      if (deps) {
        for (const dep of deps) {
          if (dfs(dep)) return true;
        }
      }
      return false;
    };

    // Start DFS from the cells that `cell` depends on
    const deps = this.dependsOn.get(cell);
    if (!deps) return false;

    for (const dep of deps) {
      if (dep === cell) return true; // Self-reference
      visited.clear();
      visited.add(cell);
      if (dfs(dep)) return true;
    }

    return false;
  }

  /**
   * Get the recalculation order for cells affected by a change to `changedCell`.
   * Returns cells in topological order (dependencies first).
   */
  getRecalculationOrder(changedCell: string): string[] {
    const affected = this.getAllDependents(changedCell);
    if (affected.size === 0) return [];

    // Topological sort using Kahn's algorithm within the affected set
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, Set<string>>();

    // Initialize in-degree to 0 for all affected cells
    for (const cell of affected) {
      inDegree.set(cell, 0);
      adjList.set(cell, new Set());
    }

    // Build subgraph edges: for each affected cell, look at its dependencies
    for (const cell of affected) {
      const deps = this.dependsOn.get(cell);
      if (deps) {
        for (const dep of deps) {
          if (affected.has(dep)) {
            adjList.get(dep)!.add(cell);
            inDegree.set(cell, (inDegree.get(cell) ?? 0) + 1);
          } else if (dep === changedCell) {
            // The changed cell is a source — contribute to in-degree
            // but it's not in affected set, so cells depending on it start ready
          }
        }
      }
    }

    // Start with cells that have in-degree 0 (only depend on changedCell or non-affected)
    const queue: string[] = [];
    for (const [cell, degree] of inDegree) {
      if (degree === 0) queue.push(cell);
    }

    const result: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const neighbors = adjList.get(current);
      if (neighbors) {
        for (const neighbor of neighbors) {
          const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
          inDegree.set(neighbor, newDeg);
          if (newDeg === 0) queue.push(neighbor);
        }
      }
    }

    // If result length < affected size, there's a cycle among remaining
    // Add remaining cells anyway (they'll get #REF! during evaluation)
    if (result.length < affected.size) {
      for (const cell of affected) {
        if (!result.includes(cell)) {
          result.push(cell);
        }
      }
    }

    return result;
  }

  /**
   * Get all cells that a given cell depends on.
   */
  getDependencies(cell: string): string[] {
    const deps = this.dependsOn.get(cell);
    return deps ? [...deps] : [];
  }

  /**
   * Clear all dependency data.
   */
  clear(): void {
    this.dependsOn.clear();
    this.dependents.clear();
  }

  /**
   * Get the number of tracked cells (for debugging/testing).
   */
  get size(): number {
    return this.dependsOn.size;
  }
}
