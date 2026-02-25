import { useState, useEffect, useCallback } from 'react';
import type { FieldState, FieldDefinition } from '../types';
import { useFormContext } from './FormContext';
import { getByPath } from '../utils/path';

const EMPTY_DEFINITION: FieldDefinition = { name: '', type: 'text' };

/**
 * Hook to connect any component to a form field.
 * Returns the current field state and handlers for rendering any field type.
 *
 * Works for both top-level fields (registered in the engine's fieldMap)
 * and dynamic nested fields (e.g., fieldArray rows like "items.0.product")
 * which are NOT in the fieldMap.
 */
export function useField(name: string): FieldState {
  const { engine } = useFormContext();

  const readFieldState = useCallback((): FieldState => {
    // Try the engine's registered field state first
    const engineState = engine.getFieldState(name);
    if (engineState) return engineState;

    // For dynamic nested fields (e.g., "items.0.product"),
    // build state directly from raw engine values.
    const state = engine.getState();
    const value = getByPath(state.values, name);

    return {
      name,
      value,
      error: state.errors[name],
      touched: state.touched[name] ?? false,
      visible: true, // if parent rendered us, we're visible
      disabled: state.disabled[name] ?? false,
      readOnly: false,
      options: state.options[name] ?? [],
      rules: state.rules[name] ?? [],
      props: {},
      definition: EMPTY_DEFINITION,
      onChange: (newValue: any) => engine.setValue(name, newValue),
      onBlur: () => engine.setFieldTouched(name, true),
    };
  }, [engine, name]);

  const [fieldState, setFieldState] = useState<FieldState>(readFieldState);

  useEffect(() => {
    setFieldState(readFieldState());

    const unsub = engine.subscribe(() => {
      setFieldState(readFieldState());
    });
    return unsub;
  }, [engine, name, readFieldState]);

  return fieldState;
}
