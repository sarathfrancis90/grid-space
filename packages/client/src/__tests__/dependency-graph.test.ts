import { describe, it, expect, beforeEach } from "vitest";
import { DependencyGraph } from "../components/formula/dependencyGraph";

describe("DependencyGraph", () => {
  let graph: DependencyGraph;

  beforeEach(() => {
    graph = new DependencyGraph();
  });

  describe("addDependency / getDependencies", () => {
    it("adds a dependency", () => {
      graph.addDependency("A1", "B1");
      expect(graph.getDependencies("A1")).toContain("B1");
    });

    it("adds multiple dependencies", () => {
      graph.addDependency("A1", "B1");
      graph.addDependency("A1", "C1");
      const deps = graph.getDependencies("A1");
      expect(deps).toContain("B1");
      expect(deps).toContain("C1");
    });

    it("tracks reverse dependents", () => {
      graph.addDependency("A1", "B1");
      expect(graph.getDirectDependents("B1")).toContain("A1");
    });
  });

  describe("removeDependencies", () => {
    it("removes all dependencies for a cell", () => {
      graph.addDependency("A1", "B1");
      graph.addDependency("A1", "C1");
      graph.removeDependencies("A1");
      expect(graph.getDependencies("A1")).toHaveLength(0);
    });

    it("cleans up reverse dependents", () => {
      graph.addDependency("A1", "B1");
      graph.removeDependencies("A1");
      expect(graph.getDirectDependents("B1")).not.toContain("A1");
    });

    it("does not affect other cells", () => {
      graph.addDependency("A1", "B1");
      graph.addDependency("C1", "B1");
      graph.removeDependencies("A1");
      expect(graph.getDirectDependents("B1")).toContain("C1");
    });
  });

  describe("detectCircular", () => {
    it("detects self-reference", () => {
      graph.addDependency("A1", "A1");
      expect(graph.detectCircular("A1")).toBe(true);
    });

    it("detects A1→B1→A1 cycle", () => {
      graph.addDependency("A1", "B1");
      graph.addDependency("B1", "A1");
      expect(graph.detectCircular("A1")).toBe(true);
      expect(graph.detectCircular("B1")).toBe(true);
    });

    it("detects A1→B1→C1→A1 cycle", () => {
      graph.addDependency("A1", "B1");
      graph.addDependency("B1", "C1");
      graph.addDependency("C1", "A1");
      expect(graph.detectCircular("A1")).toBe(true);
    });

    it("returns false when no cycle", () => {
      graph.addDependency("A1", "B1");
      graph.addDependency("A1", "C1");
      expect(graph.detectCircular("A1")).toBe(false);
    });

    it("returns false for linear chain", () => {
      graph.addDependency("A1", "B1");
      graph.addDependency("B1", "C1");
      graph.addDependency("C1", "D1");
      expect(graph.detectCircular("A1")).toBe(false);
    });
  });

  describe("getAllDependents", () => {
    it("finds transitive dependents", () => {
      // B1 references A1, C1 references B1
      graph.addDependency("B1", "A1");
      graph.addDependency("C1", "B1");
      const deps = graph.getAllDependents("A1");
      expect(deps.has("B1")).toBe(true);
      expect(deps.has("C1")).toBe(true);
    });

    it("returns empty set for leaf cell", () => {
      graph.addDependency("A1", "B1");
      const deps = graph.getAllDependents("A1");
      expect(deps.size).toBe(0);
    });
  });

  describe("getRecalculationOrder", () => {
    it("returns correct order for chain A1→B1→C1", () => {
      // B1 depends on A1, C1 depends on B1
      graph.addDependency("B1", "A1");
      graph.addDependency("C1", "B1");
      const order = graph.getRecalculationOrder("A1");
      const b1Idx = order.indexOf("B1");
      const c1Idx = order.indexOf("C1");
      expect(b1Idx).toBeGreaterThanOrEqual(0);
      expect(c1Idx).toBeGreaterThanOrEqual(0);
      expect(b1Idx).toBeLessThan(c1Idx);
    });

    it("handles diamond dependencies", () => {
      // A→B, A→C, B→D, C→D
      graph.addDependency("B1", "A1");
      graph.addDependency("C1", "A1");
      graph.addDependency("D1", "B1");
      graph.addDependency("D1", "C1");
      const order = graph.getRecalculationOrder("A1");
      const b1Idx = order.indexOf("B1");
      const c1Idx = order.indexOf("C1");
      const d1Idx = order.indexOf("D1");
      expect(b1Idx).toBeLessThan(d1Idx);
      expect(c1Idx).toBeLessThan(d1Idx);
    });

    it("returns empty array when no dependents", () => {
      const order = graph.getRecalculationOrder("A1");
      expect(order).toHaveLength(0);
    });

    it("includes all affected cells", () => {
      graph.addDependency("B1", "A1");
      graph.addDependency("C1", "A1");
      const order = graph.getRecalculationOrder("A1");
      expect(order).toContain("B1");
      expect(order).toContain("C1");
      expect(order).toHaveLength(2);
    });
  });

  describe("clear", () => {
    it("clears all data", () => {
      graph.addDependency("A1", "B1");
      graph.addDependency("C1", "D1");
      graph.clear();
      expect(graph.size).toBe(0);
      expect(graph.getDependencies("A1")).toHaveLength(0);
    });
  });
});
