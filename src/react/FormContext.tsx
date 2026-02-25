import { createContext, useContext } from 'react';
import type { FormEngineAPI } from '../types';

export interface FormContextValue {
  engine: FormEngineAPI;
  mode: 'edit' | 'readonly' | 'disabled';
  context?: Record<string, any>;
  fieldComponents: Record<string, React.ComponentType<any>>;
  fieldWrapper?: (fieldState: any, children: React.ReactNode, ctx?: Record<string, any>) => React.ReactNode;
}

export const FormContext = createContext<FormContextValue | null>(null);

export function useFormContext(): FormContextValue {
  const ctx = useContext(FormContext);
  if (!ctx) {
    throw new Error('useFormContext must be used within a <DynamicForm> or <FormProvider>');
  }
  return ctx;
}
