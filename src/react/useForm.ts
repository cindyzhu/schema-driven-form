import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { FormEngine } from '../core/FormEngine';
import type { FormSchema, Values, Middleware, FormPlugin, FormState, FormEngineAPI } from '../types';

export interface UseFormOptions {
  schema: FormSchema;
  initialValues?: Values;
  onSubmit?: (output: any) => void | Promise<void>;
  onChange?: (values: Values, changedField: string) => void;
  middleware?: Middleware[];
  plugins?: FormPlugin[];
}

export interface UseFormReturn {
  engine: FormEngineAPI;
  state: FormState;
  handleSubmit: (e?: React.FormEvent) => void;
  reset: (values?: Values) => void;
}

export function useForm(options: UseFormOptions): UseFormReturn {
  const { schema, initialValues, onSubmit, onChange, middleware, plugins } = options;

  // Create engine once, store in ref
  const engineRef = useRef<FormEngine | null>(null);
  if (!engineRef.current) {
    const engine = new FormEngine({
      schema,
      initialValues,
      onSubmit,
      onChange,
      middleware,
    });
    if (plugins) {
      for (const plugin of plugins) {
        plugin.setup(engine);
      }
    }
    engineRef.current = engine;
  }

  const engine = engineRef.current;

  // Use useState + subscribe for React-friendly state management.
  // This avoids useSyncExternalStore snapshot caching issues entirely.
  const [state, setState] = useState<FormState>(() => engine.getState());

  useEffect(() => {
    // Sync state immediately in case it changed between render and effect
    setState(engine.getState());

    const unsub = engine.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsub();
    };
  }, [engine]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault?.();
      engine.submit();
    },
    [engine],
  );

  const reset = useCallback(
    (values?: Values) => engine.reset(values),
    [engine],
  );

  return useMemo(
    () => ({ engine, state, handleSubmit, reset }),
    [engine, state, handleSubmit, reset],
  );
}
