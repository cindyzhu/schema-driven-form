// Utility functions for working with dot-notation paths in form values.

/**
 * Get a deeply nested value by dot-separated path.
 * Supports array indices: "items.0.name"
 */
export function getByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current == null) return undefined;
    current = current[key];
  }
  return current;
}

/**
 * Set a deeply nested value by dot-separated path (immutable).
 * Returns a new object without mutating the original.
 */
export function setByPath(obj: any, path: string, value: any): any {
  const keys = path.split('.');
  if (keys.length === 1) {
    return { ...obj, [path]: value };
  }

  const [head, ...rest] = keys;
  const restPath = rest.join('.');
  const nextIsIndex = /^\d+$/.test(rest[0]);

  const child = obj?.[head] ?? (nextIsIndex ? [] : {});
  const newChild = setByPath(child, restPath, value);

  if (Array.isArray(obj)) {
    const newArr = [...obj];
    newArr[Number(head)] = newChild;
    return newArr;
  }

  return { ...obj, [head]: newChild };
}

/**
 * Delete a deeply nested value by dot-separated path (immutable).
 */
export function deleteByPath(obj: any, path: string): any {
  const keys = path.split('.');
  if (keys.length === 1) {
    const { [path]: _, ...rest } = obj;
    return rest;
  }

  const [head, ...restKeys] = keys;
  const restPath = restKeys.join('.');
  const child = obj?.[head];
  if (child == null) return obj;

  return { ...obj, [head]: deleteByPath(child, restPath) };
}

/**
 * Flatten a nested object into dot-notation paths.
 */
export function flattenPaths(obj: any, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in obj) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(result, flattenPaths(val, fullPath));
    } else {
      result[fullPath] = val;
    }
  }
  return result;
}
