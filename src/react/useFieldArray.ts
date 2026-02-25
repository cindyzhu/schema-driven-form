import { useCallback, useMemo } from 'react';
import type { Values } from '../types';
import { useFormContext } from './FormContext';
import { useField } from './useField';

export interface UseFieldArrayReturn {
  fields: Values[];
  append: (value?: Values) => void;
  remove: (index: number) => void;
  move: (from: number, to: number) => void;
  insert: (index: number, value: Values) => void;
  name: string;
}

/**
 * Hook for managing dynamic arrays of field groups.
 */
export function useFieldArray(name: string): UseFieldArrayReturn {
  const { engine } = useFormContext();
  const field = useField(name);

  const fields = useMemo(() => {
    return Array.isArray(field.value) ? field.value : [];
  }, [field.value]);

  const append = useCallback(
    (value?: Values) => {
      engine.appendRow(name, value);
    },
    [engine, name],
  );

  const remove = useCallback(
    (index: number) => {
      engine.removeRow(name, index);
    },
    [engine, name],
  );

  const move = useCallback(
    (from: number, to: number) => {
      engine.moveRow(name, from, to);
    },
    [engine, name],
  );

  const insert = useCallback(
    (index: number, value: Values) => {
      const current = Array.isArray(field.value) ? [...field.value] : [];
      current.splice(index, 0, value);
      engine.setValue(name, current);
    },
    [engine, name, field.value],
  );

  return useMemo(
    () => ({ fields, append, remove, move, insert, name }),
    [fields, append, remove, move, insert, name],
  );
}
