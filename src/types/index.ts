// ============================================================================
// DynamicForm — Complete Type System
// ============================================================================

// ---------------------------------------------------------------------------
// Values & Utility Types
// ---------------------------------------------------------------------------
export type Values = Record<string, any>;
export type Errors = Record<string, string>;
export type TouchedMap = Record<string, boolean>;
export type VisibleMap = Record<string, boolean>;
export type DisabledMap = Record<string, boolean>;
export type OptionsMap = Record<string, FieldOption[]>;
export type RulesMap = Record<string, ValidationRule[]>;
export type PropsMap = Record<string, Record<string, any>>;

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
export interface FormSchema {
  fields: FieldDefinition[];
  layout?: LayoutConfig;
  formRules?: FormRule[];
  steps?: StepConfig[];
}

export interface LayoutConfig {
  columns?: number;
  labelPosition?: 'top' | 'left' | 'right';
  labelWidth?: number | string;
  gap?: number;
  size?: 'small' | 'medium' | 'large';
}

export interface StepConfig {
  id: string;
  title: string;
  description?: string;
  fieldNames: string[];
  when?: WhenCondition;
}

// ---------------------------------------------------------------------------
// Field Definition
// ---------------------------------------------------------------------------
export interface FieldDefinition {
  // Identity
  name: string;
  type: FieldType | string;

  // Display
  label?: string;
  placeholder?: string;
  description?: string;
  colSpan?: number;

  // State
  defaultValue?: any;
  required?: boolean;
  disabled?: boolean | ((values: Values) => boolean);
  hidden?: boolean | ((values: Values) => boolean);
  readOnly?: boolean;

  // Validation
  rules?: ValidationRule[];

  // Dependencies
  when?: WhenCondition | WhenCondition[];
  effects?: Effect[];

  // Selection fields
  options?: FieldOption[];
  remote?: RemoteConfig;

  // Composite fields
  fields?: FieldDefinition[];
  minRows?: number;
  maxRows?: number;

  // Layout
  section?: string;

  // Access control
  access?: {
    view?: string[];
    edit?: string[];
  };

  // Pass-through props to field component
  props?: Record<string, any>;

  // Full custom render (escape hatch)
  render?: (fieldState: FieldState, engine: FormEngineAPI) => any;

  // Open for extension
  [key: string]: any;
}

export type FieldType =
  | 'text'
  | 'number'
  | 'password'
  | 'email'
  | 'url'
  | 'phone'
  | 'textarea'
  | 'select'
  | 'multiSelect'
  | 'radio'
  | 'checkbox'
  | 'checkboxGroup'
  | 'switch'
  | 'date'
  | 'dateRange'
  | 'time'
  | 'datetime'
  | 'upload'
  | 'slider'
  | 'rate'
  | 'cascader'
  | 'colorPicker'
  | 'fieldArray'
  | 'fieldGroup'
  | 'custom';

// ---------------------------------------------------------------------------
// Field Options
// ---------------------------------------------------------------------------
export interface FieldOption {
  label: string;
  value: any;
  disabled?: boolean;
  children?: FieldOption[];
}

// ---------------------------------------------------------------------------
// Remote Config (async options loading)
// ---------------------------------------------------------------------------
export interface RemoteConfig {
  url?: string;
  loader?: (params: any) => Promise<FieldOption[]>;
  searchable?: boolean;
  debounce?: number;
  params?: (values: Values) => Record<string, any>;
  transform?: (data: any) => FieldOption[];
  watchFields?: string[];
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
export type ValidationRule =
  | RequiredRule
  | MinRule
  | MaxRule
  | MinLengthRule
  | MaxLengthRule
  | PatternRule
  | EmailRule
  | UrlRule
  | PhoneRule
  | CustomRule
  | AsyncRule
  | ExtensionRule;

export interface RequiredRule {
  type: 'required';
  message?: string;
}
export interface MinRule {
  type: 'min';
  value: number;
  message?: string;
}
export interface MaxRule {
  type: 'max';
  value: number;
  message?: string;
}
export interface MinLengthRule {
  type: 'minLength';
  value: number;
  message?: string;
}
export interface MaxLengthRule {
  type: 'maxLength';
  value: number;
  message?: string;
}
export interface PatternRule {
  type: 'pattern';
  value: string | RegExp;
  message?: string;
}
export interface EmailRule {
  type: 'email';
  message?: string;
}
export interface UrlRule {
  type: 'url';
  message?: string;
}
export interface PhoneRule {
  type: 'phone';
  message?: string;
}
export interface CustomRule {
  type: 'custom';
  validator: (value: any, values: Values) => string | undefined;
  message?: string;
}
export interface AsyncRule {
  type: 'async';
  validator: (value: any, values: Values) => Promise<string | undefined>;
  debounce?: number;
  trigger?: 'change' | 'blur' | 'submit';
  message?: string;
}
export interface ExtensionRule {
  type: string;
  message?: string;
  [key: string]: any;
}

export interface FormRule {
  validator: (values: Values) => Record<string, string> | undefined | Promise<Record<string, string> | undefined>;
}

// ---------------------------------------------------------------------------
// Effects (Dependency System)
// ---------------------------------------------------------------------------
export interface Effect {
  watch: string | string[];
  action: EffectAction | string;
  compute: (...watchedValues: any[]) => any;
}

export type EffectAction =
  | 'setValue'
  | 'setOptions'
  | 'setVisible'
  | 'setDisabled'
  | 'setRules'
  | 'setProps';

// ---------------------------------------------------------------------------
// When Condition (Visibility Shorthand)
// ---------------------------------------------------------------------------
export type WhenCondition =
  | WhenEquals
  | WhenNot
  | WhenIn
  | WhenComparison
  | WhenTest
  | WhenAnd
  | WhenOr;

export interface WhenEquals {
  field: string;
  value: any;
}
export interface WhenNot {
  field: string;
  not: any;
}
export interface WhenIn {
  field: string;
  in: any[];
}
export interface WhenComparison {
  field: string;
  gt?: number;
  lt?: number;
  gte?: number;
  lte?: number;
}
export interface WhenTest {
  field: string;
  test: (value: any) => boolean;
}
export interface WhenAnd {
  and: WhenCondition[];
}
export interface WhenOr {
  or: WhenCondition[];
}

// ---------------------------------------------------------------------------
// Engine State
// ---------------------------------------------------------------------------
export interface FormState {
  values: Values;
  errors: Errors;
  touched: TouchedMap;
  visible: VisibleMap;
  disabled: DisabledMap;
  options: OptionsMap;
  rules: RulesMap;
  fieldProps: PropsMap;
  submitting: boolean;
  submitCount: number;
  valid: boolean;
  dirty: boolean;
  currentStep: number;
}

export interface FieldState {
  name: string;
  value: any;
  error: string | undefined;
  touched: boolean;
  visible: boolean;
  disabled: boolean;
  readOnly: boolean;
  options: FieldOption[];
  rules: ValidationRule[];
  props: Record<string, any>;
  definition: FieldDefinition;
  onChange: (value: any) => void;
  onBlur: () => void;
}

// ---------------------------------------------------------------------------
// Engine API
// ---------------------------------------------------------------------------
export interface FormEngineAPI {
  // State
  getState: () => FormState;
  getValues: () => Values;
  getValue: (name: string) => any;
  getFieldState: (name: string) => FieldState | undefined;
  getErrors: () => Errors;

  // Mutations
  setValue: (name: string, value: any) => void;
  setValues: (values: Partial<Values>) => void;
  setFieldError: (name: string, error: string | undefined) => void;
  setFieldTouched: (name: string, touched: boolean) => void;
  setFieldOptions: (name: string, options: FieldOption[]) => void;
  setFieldDisabled: (name: string, disabled: boolean) => void;
  setFieldVisible: (name: string, visible: boolean) => void;
  setFieldRules: (name: string, rules: ValidationRule[]) => void;
  setFieldProps: (name: string, props: Record<string, any>) => void;

  // Validation
  validate: () => Promise<{ valid: boolean; errors: Errors }>;
  validateField: (name: string) => Promise<string | undefined>;

  // Actions
  submit: () => Promise<void>;
  reset: (values?: Values) => void;

  // Dynamic schema
  addField: (field: FieldDefinition, options?: { after?: string; before?: string }) => void;
  removeField: (name: string) => void;

  // Field Array
  appendRow: (arrayName: string, value?: Values) => void;
  removeRow: (arrayName: string, index: number) => void;
  moveRow: (arrayName: string, from: number, to: number) => void;

  // Wizard
  nextStep: () => Promise<boolean>;
  prevStep: () => void;
  goToStep: (step: number) => Promise<boolean>;

  // Subscriptions
  subscribe: (listener: (state: FormState) => void) => () => void;
  subscribeField: (name: string, listener: (fieldState: FieldState) => void) => () => void;

  // Extension
  use: (middleware: Middleware) => void;
  registerEffect: (action: string, handler: EffectHandler) => void;
  registerValidator: (type: string, handler: ValidatorHandler) => void;

  // Lifecycle
  dispose: () => void;
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
export interface MiddlewareContext {
  field: string;
  value: any;
  prevValue: any;
  values: Values;
  action: 'setValue' | 'setTouched' | 'validate' | 'submit' | 'reset';
  reject: (reason?: string) => void;
  engine: FormEngineAPI;
}

export type Middleware = (context: MiddlewareContext, next: () => void) => void;

// ---------------------------------------------------------------------------
// Extension Handlers
// ---------------------------------------------------------------------------
export type EffectHandler = (
  fieldName: string,
  computedValue: any,
  engine: FormEngineAPI,
) => void | Promise<void>;

export type ValidatorHandler = (
  value: any,
  rule: ExtensionRule,
  values: Values,
) => string | undefined | Promise<string | undefined>;

// ---------------------------------------------------------------------------
// Form Output
// ---------------------------------------------------------------------------
export interface FormOutput {
  values: Values;
  meta: {
    valid: boolean;
    touched: TouchedMap;
    dirty: Values;
    errors: Errors;
    hiddenFields: string[];
  };
}

// ---------------------------------------------------------------------------
// Component Props
// ---------------------------------------------------------------------------
export interface DynamicFormProps {
  schema: FormSchema;
  initialValues?: Values;
  mode?: 'edit' | 'readonly' | 'disabled';
  context?: Record<string, any>;
  onSubmit?: (output: FormOutput) => void | Promise<void>;
  onChange?: (values: Values, changedField: string) => void;
  onValidate?: (errors: Errors) => void;

  // Extension
  fieldComponents?: Record<string, React.ComponentType<FieldComponentProps>>;
  fieldWrapper?: (fieldState: FieldState, children: React.ReactNode, context?: Record<string, any>) => React.ReactNode;
  schemaPreprocessor?: (schema: FormSchema) => FormSchema | Promise<FormSchema>;
  middleware?: Middleware[];
  plugins?: FormPlugin[];

  // Layout
  layoutComponent?: React.ComponentType<LayoutComponentProps>;
  className?: string;
  style?: React.CSSProperties;

  // Autosave
  autosave?: {
    storage?: 'localStorage' | 'sessionStorage';
    key: string;
    interval?: number;
  };

  // Ref
  engineRef?: React.MutableRefObject<FormEngineAPI | null>;
}

export interface FieldComponentProps {
  field: FieldState;
  definition: FieldDefinition;
  form: FormEngineAPI;
}

export interface LayoutComponentProps {
  schema: FormSchema;
  children: React.ReactNode;
}

export interface FormPlugin {
  name: string;
  setup: (engine: FormEngineAPI) => void | (() => void);
}
