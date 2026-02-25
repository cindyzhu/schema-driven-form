// ============================================================================
// schema-driven-form — Public API
// ============================================================================

// Main component
export { DynamicForm } from './DynamicForm';

// Core engine (for headless usage)
export { FormEngine } from './core/FormEngine';
export type { FormEngineConfig } from './core/FormEngine';
export { DependencyGraph } from './core/DependencyGraph';
export { ValidationRunner } from './core/ValidationRunner';

// React hooks & context
export { useForm } from './react/useForm';
export { useField } from './react/useField';
export { useFieldArray } from './react/useFieldArray';
export { useFormContext, FormContext } from './react/FormContext';
export { FieldRenderer } from './react/FieldRenderer';

// Default field components (replaceable)
export { defaultFieldComponents } from './fields';
export {
  TextInput,
  NumberInput,
  TextareaInput,
  SelectInput,
  MultiSelectInput,
  RadioInput,
  CheckboxInput,
  CheckboxGroupInput,
  SwitchInput,
  DateInput,
  DateRangeInput,
  SliderInput,
  RateInput,
  UploadInput,
  ColorPickerInput,
  CascaderInput,
  FieldArrayInput,
  FieldGroupInput,
  FieldWrapper,
} from './fields';

// Layout components
export { GridLayout } from './layout/GridLayout';
export { WizardLayout } from './layout/WizardLayout';

// Types
export type {
  FormSchema,
  FieldDefinition,
  FieldType,
  FieldOption,
  ValidationRule,
  FormRule,
  Effect,
  EffectAction,
  WhenCondition,
  FormState,
  FieldState,
  FormEngineAPI,
  Middleware,
  MiddlewareContext,
  EffectHandler,
  ValidatorHandler,
  FormOutput,
  DynamicFormProps,
  FieldComponentProps,
  LayoutComponentProps,
  FormPlugin,
  LayoutConfig,
  StepConfig,
  RemoteConfig,
  Values,
  Errors,
} from './types';

// Utilities
export { getByPath, setByPath, deleteByPath } from './utils/path';
export { evaluateWhen, extractWhenDependencies } from './utils/when';
