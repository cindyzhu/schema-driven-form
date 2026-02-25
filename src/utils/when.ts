import type { WhenCondition, Values } from '../types';
import { getByPath } from './path';

/**
 * Evaluate a WhenCondition (or array of conditions) against form values.
 * Multiple conditions in an array are treated as AND.
 */
export function evaluateWhen(
  condition: WhenCondition | WhenCondition[] | undefined,
  values: Values,
): boolean {
  if (!condition) return true;

  if (Array.isArray(condition)) {
    return condition.every((c) => evaluateSingle(c, values));
  }

  return evaluateSingle(condition, values);
}

function evaluateSingle(condition: WhenCondition, values: Values): boolean {
  if ('and' in condition) {
    return condition.and.every((c) => evaluateSingle(c, values));
  }

  if ('or' in condition) {
    return condition.or.some((c) => evaluateSingle(c, values));
  }

  if ('field' in condition) {
    const fieldValue = getByPath(values, condition.field);

    // equals
    if ('value' in condition) {
      return fieldValue === (condition as any).value;
    }

    // not equals
    if ('not' in condition) {
      return fieldValue !== (condition as any).not;
    }

    // in array
    if ('in' in condition) {
      return (condition as any).in.includes(fieldValue);
    }

    // comparison
    if ('gt' in condition || 'lt' in condition || 'gte' in condition || 'lte' in condition) {
      const c = condition as any;
      if (c.gt != null && !(fieldValue > c.gt)) return false;
      if (c.lt != null && !(fieldValue < c.lt)) return false;
      if (c.gte != null && !(fieldValue >= c.gte)) return false;
      if (c.lte != null && !(fieldValue <= c.lte)) return false;
      return true;
    }

    // custom test function
    if ('test' in condition) {
      return (condition as any).test(fieldValue);
    }
  }

  return true;
}

/**
 * Extract all field names referenced in a WhenCondition for dependency tracking.
 */
export function extractWhenDependencies(
  condition: WhenCondition | WhenCondition[] | undefined,
): string[] {
  if (!condition) return [];

  if (Array.isArray(condition)) {
    return condition.flatMap(extractSingleDeps);
  }

  return extractSingleDeps(condition);
}

function extractSingleDeps(condition: WhenCondition): string[] {
  if ('and' in condition) return condition.and.flatMap(extractSingleDeps);
  if ('or' in condition) return condition.or.flatMap(extractSingleDeps);
  if ('field' in condition) return [(condition as any).field];
  return [];
}
