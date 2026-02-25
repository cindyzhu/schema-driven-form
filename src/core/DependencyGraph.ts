import type { FieldDefinition, Effect } from '../types';
import { extractWhenDependencies } from '../utils/when';

/**
 * Directed Acyclic Graph (DAG) for field dependencies.
 * Used to determine which fields need to be updated when a field value changes,
 * and in what order (topological sort).
 */
export class DependencyGraph {
  // fieldName -> set of fields that depend on it
  private dependents = new Map<string, Set<string>>();
  // fieldName -> set of fields it depends on
  private dependencies = new Map<string, Set<string>>();
  // fieldName -> list of effects triggered by this field
  private effectsByWatcher = new Map<string, Array<{ target: string; effect: Effect }>>();
  // fieldName -> list of fields that trigger its when condition
  private whenDeps = new Map<string, string[]>();

  constructor(fields: FieldDefinition[]) {
    this.buildGraph(fields);
    this.detectCycles();
  }

  private buildGraph(fields: FieldDefinition[]) {
    for (const field of fields) {
      // Build from effects
      if (field.effects) {
        for (const effect of field.effects) {
          const watchFields = Array.isArray(effect.watch) ? effect.watch : [effect.watch];
          for (const watchField of watchFields) {
            // watchField -> field.name dependency
            this.addEdge(watchField, field.name);
            // Store the effect for later execution
            if (!this.effectsByWatcher.has(watchField)) {
              this.effectsByWatcher.set(watchField, []);
            }
            this.effectsByWatcher.get(watchField)!.push({ target: field.name, effect });
          }
        }
      }

      // Build from when conditions
      const whenDeps = extractWhenDependencies(field.when);
      if (whenDeps.length > 0) {
        this.whenDeps.set(field.name, whenDeps);
        for (const dep of whenDeps) {
          this.addEdge(dep, field.name);
        }
      }

      // Recursively process nested fields (fieldArray, fieldGroup)
      if (field.fields) {
        this.buildGraph(field.fields);
      }
    }
  }

  private addEdge(from: string, to: string) {
    if (!this.dependents.has(from)) {
      this.dependents.set(from, new Set());
    }
    this.dependents.get(from)!.add(to);

    if (!this.dependencies.has(to)) {
      this.dependencies.set(to, new Set());
    }
    this.dependencies.get(to)!.add(from);
  }

  /**
   * Detect cycles using DFS. Throws if a circular dependency is found.
   */
  private detectCycles() {
    const visited = new Set<string>();
    const inStack = new Set<string>();

    const dfs = (node: string, path: string[]) => {
      if (inStack.has(node)) {
        const cycleStart = path.indexOf(node);
        const cycle = path.slice(cycleStart).concat(node);
        throw new Error(
          `Circular dependency detected: ${cycle.join(' → ')}`
        );
      }
      if (visited.has(node)) return;

      visited.add(node);
      inStack.add(node);
      path.push(node);

      const deps = this.dependents.get(node);
      if (deps) {
        for (const dep of deps) {
          dfs(dep, [...path]);
        }
      }

      inStack.delete(node);
    };

    for (const node of this.dependents.keys()) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }
  }

  /**
   * Get all fields that need to be updated when `fieldName` changes,
   * in topological order (respecting cascading dependencies).
   */
  getAffectedFields(fieldName: string): string[] {
    const result: string[] = [];
    const visited = new Set<string>();

    const traverse = (name: string) => {
      const deps = this.dependents.get(name);
      if (!deps) return;

      for (const dep of deps) {
        if (!visited.has(dep)) {
          visited.add(dep);
          result.push(dep);
          traverse(dep); // cascade
        }
      }
    };

    traverse(fieldName);
    return this.topologicalSort(result);
  }

  /**
   * Get effects that should fire when `fieldName` changes.
   */
  getEffectsForField(fieldName: string): Array<{ target: string; effect: Effect }> {
    return this.effectsByWatcher.get(fieldName) ?? [];
  }

  /**
   * Get when-condition dependencies for a field.
   */
  getWhenDeps(fieldName: string): string[] {
    return this.whenDeps.get(fieldName) ?? [];
  }

  /**
   * Check if field A has any field depending on it.
   */
  hasDependents(fieldName: string): boolean {
    return this.dependents.has(fieldName) && this.dependents.get(fieldName)!.size > 0;
  }

  /**
   * Topological sort of a subset of fields.
   */
  private topologicalSort(fields: string[]): string[] {
    const fieldSet = new Set(fields);
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (node: string) => {
      if (visited.has(node)) return;
      visited.add(node);

      const nodeDeps = this.dependencies.get(node);
      if (nodeDeps) {
        for (const dep of nodeDeps) {
          if (fieldSet.has(dep)) {
            visit(dep);
          }
        }
      }

      result.push(node);
    };

    for (const field of fields) {
      visit(field);
    }

    return result;
  }

  /**
   * Add a new field to the graph at runtime.
   */
  addField(field: FieldDefinition) {
    this.buildGraph([field]);
    // Re-check cycles after adding
    this.detectCycles();
  }

  /**
   * Remove a field from the graph at runtime.
   */
  removeField(fieldName: string) {
    this.dependents.delete(fieldName);
    this.effectsByWatcher.delete(fieldName);
    this.whenDeps.delete(fieldName);

    // Remove from all dependency sets
    for (const [, deps] of this.dependents) {
      deps.delete(fieldName);
    }
    for (const [, deps] of this.dependencies) {
      deps.delete(fieldName);
    }
    this.dependencies.delete(fieldName);
  }
}
