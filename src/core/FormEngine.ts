import type {
  FormSchema,
  FieldDefinition,
  FormState,
  FieldState,
  Values,
  Errors,
  FieldOption,
  ValidationRule,
  Middleware,
  MiddlewareContext,
  EffectHandler,
  ValidatorHandler,
  FormEngineAPI,
  Effect,
} from '../types';
import { DependencyGraph } from './DependencyGraph';
import { ValidationRunner } from './ValidationRunner';
import { getByPath, setByPath, deleteByPath } from '../utils/path';
import { evaluateWhen } from '../utils/when';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
export interface FormEngineConfig {
  schema: FormSchema;
  initialValues?: Values;
  onSubmit?: (output: any) => void | Promise<void>;
  onChange?: (values: Values, changedField: string) => void;
  middleware?: Middleware[];
}

// ---------------------------------------------------------------------------
// FormEngine — Pure logic, no React dependency
// ---------------------------------------------------------------------------
export class FormEngine implements FormEngineAPI {
  private schema: FormSchema;
  private fieldMap = new Map<string, FieldDefinition>();
  private state: FormState;
  private initialValues: Values;
  private depGraph: DependencyGraph;
  private validator: ValidationRunner;
  private middlewares: Middleware[] = [];
  private effectHandlers = new Map<string, EffectHandler>();
  private listeners = new Set<(state: FormState) => void>();
  private fieldListeners = new Map<string, Set<(state: FieldState) => void>>();
  private onSubmitCallback?: (output: any) => void | Promise<void>;
  private onChangeCallback?: (values: Values, changedField: string) => void;
  private disposed = false;

  // Snapshot caches for useSyncExternalStore compatibility.
  // getSnapshot must return a referentially stable value when state hasn't changed.
  private stateVersion = 0;
  private cachedState: FormState | null = null;
  private cachedStateVersion = -1;
  private fieldSnapshotCache = new Map<string, { version: number; snapshot: FieldState }>();

  constructor(config: FormEngineConfig) {
    this.schema = config.schema;
    this.onSubmitCallback = config.onSubmit;
    this.onChangeCallback = config.onChange;

    if (config.middleware) {
      this.middlewares = [...config.middleware];
    }

    // Build field map from schema
    this.buildFieldMap(config.schema.fields, '');

    // Initialize values with defaults
    this.initialValues = this.buildDefaultValues(config.schema.fields, config.initialValues ?? {});

    // Initialize state
    this.state = {
      values: { ...this.initialValues },
      errors: {},
      touched: {},
      visible: this.buildVisibleMap(this.initialValues),
      disabled: this.buildDisabledMap(this.initialValues),
      options: this.buildOptionsMap(),
      rules: this.buildRulesMap(),
      fieldProps: {},
      submitting: false,
      submitCount: 0,
      valid: true,
      dirty: false,
      currentStep: 0,
    };

    // Build dependency graph
    this.depGraph = new DependencyGraph(config.schema.fields);

    // Initialize validator
    this.validator = new ValidationRunner();

    // Register built-in effect handlers
    this.registerBuiltInEffects();

    // Run initial effects to set up computed/dependent state
    this.runInitialEffects();
  }

  // -----------------------------------------------------------------------
  // Private: Initialization
  // -----------------------------------------------------------------------

  private buildFieldMap(fields: FieldDefinition[], prefix: string) {
    for (const field of fields) {
      const path = prefix ? `${prefix}.${field.name}` : field.name;
      this.fieldMap.set(path, field);

      if (field.fields && field.type === 'fieldGroup') {
        this.buildFieldMap(field.fields, path);
      }
      // fieldArray sub-fields are handled differently (dynamic rows)
    }
  }

  private buildDefaultValues(fields: FieldDefinition[], initial: Values): Values {
    let values = { ...initial };

    for (const field of fields) {
      const existing = getByPath(values, field.name);
      if (existing !== undefined) continue;

      if (field.defaultValue !== undefined) {
        values = setByPath(values, field.name, field.defaultValue);
      } else if (field.type === 'fieldGroup' && field.fields) {
        values = setByPath(values, field.name, this.buildDefaultValues(field.fields, {}));
      } else if (field.type === 'fieldArray') {
        values = setByPath(values, field.name, []);
      } else if (field.type === 'checkbox' || field.type === 'switch') {
        values = setByPath(values, field.name, false);
      }
    }

    return values;
  }

  private buildVisibleMap(values: Values): Record<string, boolean> {
    const visible: Record<string, boolean> = {};
    for (const [name, field] of this.fieldMap) {
      if (field.when) {
        visible[name] = evaluateWhen(field.when, values);
      } else if (typeof field.hidden === 'function') {
        visible[name] = !field.hidden(values);
      } else if (typeof field.hidden === 'boolean') {
        visible[name] = !field.hidden;
      } else {
        visible[name] = true;
      }
    }
    return visible;
  }

  private buildDisabledMap(values: Values): Record<string, boolean> {
    const disabled: Record<string, boolean> = {};
    for (const [name, field] of this.fieldMap) {
      if (typeof field.disabled === 'function') {
        disabled[name] = field.disabled(values);
      } else {
        disabled[name] = field.disabled ?? false;
      }
    }
    return disabled;
  }

  private buildOptionsMap(): Record<string, FieldOption[]> {
    const options: Record<string, FieldOption[]> = {};
    for (const [name, field] of this.fieldMap) {
      if (field.options) {
        options[name] = field.options;
      }
    }
    return options;
  }

  private buildRulesMap(): Record<string, ValidationRule[]> {
    const rules: Record<string, ValidationRule[]> = {};
    for (const [name, field] of this.fieldMap) {
      if (field.rules) {
        rules[name] = field.rules;
      }
    }
    return rules;
  }

  private registerBuiltInEffects() {
    this.effectHandlers.set('setValue', (fieldName, value) => {
      this.state = {
        ...this.state,
        values: setByPath(this.state.values, fieldName, value),
      };
    });

    this.effectHandlers.set('setOptions', (fieldName, options) => {
      this.state = {
        ...this.state,
        options: { ...this.state.options, [fieldName]: options },
      };
    });

    this.effectHandlers.set('setVisible', (fieldName, visible) => {
      this.state = {
        ...this.state,
        visible: { ...this.state.visible, [fieldName]: visible },
      };
    });

    this.effectHandlers.set('setDisabled', (fieldName, disabled) => {
      this.state = {
        ...this.state,
        disabled: { ...this.state.disabled, [fieldName]: disabled },
      };
    });

    this.effectHandlers.set('setRules', (fieldName, rules) => {
      this.state = {
        ...this.state,
        rules: { ...this.state.rules, [fieldName]: rules },
      };
    });

    this.effectHandlers.set('setProps', (fieldName, props) => {
      this.state = {
        ...this.state,
        fieldProps: {
          ...this.state.fieldProps,
          [fieldName]: { ...this.state.fieldProps[fieldName], ...props },
        },
      };
    });
  }

  private runInitialEffects() {
    // Run effects for all fields that have initial values
    for (const [name] of this.fieldMap) {
      const effects = this.depGraph.getEffectsForField(name);
      if (effects.length > 0) {
        this.executeEffects(name);
      }
    }
  }

  // -----------------------------------------------------------------------
  // Private: Effect & Dependency Execution
  // -----------------------------------------------------------------------

  private executeEffects(changedField: string) {
    const effects = this.depGraph.getEffectsForField(changedField);

    for (const { target, effect } of effects) {
      const watchFields = Array.isArray(effect.watch) ? effect.watch : [effect.watch];
      const watchValues = watchFields.map((f) => getByPath(this.state.values, f));

      const computedValue = effect.compute(...watchValues);

      const handler = this.effectHandlers.get(effect.action);
      if (handler) {
        handler(target, computedValue, this);
      }
    }
  }

  private processDependencies(changedField: string) {
    // Update visibility for fields that depend on this one via `when`
    for (const [name, field] of this.fieldMap) {
      if (field.when) {
        const wasVisible = this.state.visible[name];
        const isVisible = evaluateWhen(field.when, this.state.values);
        if (wasVisible !== isVisible) {
          this.state = {
            ...this.state,
            visible: { ...this.state.visible, [name]: isVisible },
          };
          // Clear value and error when field becomes hidden
          if (!isVisible) {
            this.state = {
              ...this.state,
              values: setByPath(this.state.values, name, this.fieldMap.get(name)?.defaultValue),
              errors: { ...this.state.errors },
            };
            delete this.state.errors[name];
          }
        }
      }
    }

    // Execute effects in topological order
    const affected = this.depGraph.getAffectedFields(changedField);
    for (const affectedField of affected) {
      this.executeEffects(affectedField);
    }

    // Execute direct effects from the changed field
    this.executeEffects(changedField);
  }

  // -----------------------------------------------------------------------
  // Private: Middleware
  // -----------------------------------------------------------------------

  private runMiddleware(context: Omit<MiddlewareContext, 'reject' | 'engine'>): boolean {
    let rejected = false;

    const fullContext: MiddlewareContext = {
      ...context,
      engine: this,
      reject: () => {
        rejected = true;
      },
    };

    const run = (index: number) => {
      if (index >= this.middlewares.length || rejected) return;
      this.middlewares[index](fullContext, () => run(index + 1));
    };

    run(0);
    return !rejected;
  }

  // -----------------------------------------------------------------------
  // Private: Notification
  // -----------------------------------------------------------------------

  private notify() {
    if (this.disposed) return;
    this.stateVersion++;
    // Invalidate all field snapshot caches
    this.fieldSnapshotCache.clear();
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  private notifyField(name: string) {
    if (this.disposed) return;
    const fieldListenerSet = this.fieldListeners.get(name);
    if (fieldListenerSet) {
      // Invalidate this field's cache
      this.fieldSnapshotCache.delete(name);
      const fieldState = this.getFieldState(name);
      if (fieldState) {
        for (const listener of fieldListenerSet) {
          listener(fieldState);
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // Public API: State
  // -----------------------------------------------------------------------

  getState(): FormState {
    // Return cached reference if version hasn't changed.
    // This is critical for useSyncExternalStore — getSnapshot must return
    // a referentially stable value when state hasn't changed.
    if (this.cachedStateVersion === this.stateVersion && this.cachedState) {
      return this.cachedState;
    }
    this.cachedState = this.state;
    this.cachedStateVersion = this.stateVersion;
    return this.state;
  }

  getValues(): Values {
    return this.state.values;
  }

  getValue(name: string): any {
    return getByPath(this.state.values, name);
  }

  getErrors(): Errors {
    return this.state.errors;
  }

  getFieldState(name: string): FieldState | undefined {
    const definition = this.fieldMap.get(name);
    if (!definition) return undefined;

    // Return cached snapshot if version hasn't changed
    const cached = this.fieldSnapshotCache.get(name);
    if (cached && cached.version === this.stateVersion) {
      return cached.snapshot;
    }

    const snapshot: FieldState = {
      name,
      value: getByPath(this.state.values, name),
      error: this.state.errors[name],
      touched: this.state.touched[name] ?? false,
      visible: this.state.visible[name] ?? true,
      disabled: this.state.disabled[name] ?? false,
      readOnly: definition.readOnly ?? false,
      options: this.state.options[name] ?? definition.options ?? [],
      rules: this.state.rules[name] ?? definition.rules ?? [],
      props: this.state.fieldProps[name] ?? definition.props ?? {},
      definition,
      onChange: (value: any) => this.setValue(name, value),
      onBlur: () => this.setFieldTouched(name, true),
    };

    this.fieldSnapshotCache.set(name, { version: this.stateVersion, snapshot });
    return snapshot;
  }

  getSchema(): FormSchema {
    return this.schema;
  }

  getFieldDefinitions(): FieldDefinition[] {
    return this.schema.fields;
  }

  getFieldDefinition(name: string): FieldDefinition | undefined {
    return this.fieldMap.get(name);
  }

  // -----------------------------------------------------------------------
  // Public API: Mutations
  // -----------------------------------------------------------------------

  setValue(name: string, value: any) {
    const prevValue = getByPath(this.state.values, name);

    // Run middleware
    const proceed = this.runMiddleware({
      field: name,
      value,
      prevValue,
      values: this.state.values,
      action: 'setValue',
    });
    if (!proceed) return;

    // Update value
    this.state = {
      ...this.state,
      values: setByPath(this.state.values, name, value),
      dirty: true,
    };

    // Process dependencies
    this.processDependencies(name);

    // Run validation for touched fields
    if (this.state.touched[name]) {
      const fieldDef = this.fieldMap.get(name);
      const rules = this.state.rules[name] ?? fieldDef?.rules ?? [];
      this.validator.validateFieldDebounced(
        name,
        rules,
        this.state.values,
        fieldDef?.required,
        (error) => {
          this.state = {
            ...this.state,
            errors: error
              ? { ...this.state.errors, [name]: error }
              : (() => { const { [name]: _, ...rest } = this.state.errors; return rest; })(),
            valid: error ? false : Object.keys(this.state.errors).filter((k) => k !== name).length === 0,
          };
          this.notifyField(name);
          this.notify();
        },
      );
    }

    // Fire onChange callback
    this.onChangeCallback?.(this.state.values, name);

    this.notifyField(name);
    this.notify();
  }

  setValues(values: Partial<Values>) {
    for (const [name, value] of Object.entries(values)) {
      this.setValue(name, value);
    }
  }

  setFieldError(name: string, error: string | undefined) {
    if (error) {
      this.state = {
        ...this.state,
        errors: { ...this.state.errors, [name]: error },
        valid: false,
      };
    } else {
      const { [name]: _, ...rest } = this.state.errors;
      this.state = {
        ...this.state,
        errors: rest,
        valid: Object.keys(rest).length === 0,
      };
    }
    this.notifyField(name);
    this.notify();
  }

  setFieldTouched(name: string, touched: boolean) {
    this.state = {
      ...this.state,
      touched: { ...this.state.touched, [name]: touched },
    };

    // Validate on blur
    if (touched) {
      const fieldDef = this.fieldMap.get(name);
      const rules = this.state.rules[name] ?? fieldDef?.rules ?? [];
      this.validator.validateFieldDebounced(
        name,
        rules,
        this.state.values,
        fieldDef?.required,
        (error) => {
          this.state = {
            ...this.state,
            errors: error
              ? { ...this.state.errors, [name]: error }
              : (() => { const { [name]: _, ...rest } = this.state.errors; return rest; })(),
          };
          this.notifyField(name);
          this.notify();
        },
      );
    }

    this.notifyField(name);
    this.notify();
  }

  setFieldOptions(name: string, options: FieldOption[]) {
    this.state = {
      ...this.state,
      options: { ...this.state.options, [name]: options },
    };
    this.notifyField(name);
    this.notify();
  }

  setFieldDisabled(name: string, disabled: boolean) {
    this.state = {
      ...this.state,
      disabled: { ...this.state.disabled, [name]: disabled },
    };
    this.notifyField(name);
    this.notify();
  }

  setFieldVisible(name: string, visible: boolean) {
    this.state = {
      ...this.state,
      visible: { ...this.state.visible, [name]: visible },
    };
    if (!visible) {
      // Clear value and error for hidden fields
      const { [name]: _, ...errors } = this.state.errors;
      this.state = {
        ...this.state,
        errors,
      };
    }
    this.notifyField(name);
    this.notify();
  }

  setFieldRules(name: string, rules: ValidationRule[]) {
    this.state = {
      ...this.state,
      rules: { ...this.state.rules, [name]: rules },
    };
    this.notify();
  }

  setFieldProps(name: string, props: Record<string, any>) {
    this.state = {
      ...this.state,
      fieldProps: {
        ...this.state.fieldProps,
        [name]: { ...this.state.fieldProps[name], ...props },
      },
    };
    this.notifyField(name);
    this.notify();
  }

  // -----------------------------------------------------------------------
  // Public API: Validation
  // -----------------------------------------------------------------------

  async validate(): Promise<{ valid: boolean; errors: Errors }> {
    // Build validation map
    const fieldsMap = new Map<string, { rules: ValidationRule[]; required?: boolean; visible: boolean }>();
    for (const [name, field] of this.fieldMap) {
      fieldsMap.set(name, {
        rules: this.state.rules[name] ?? field.rules ?? [],
        required: field.required,
        visible: this.state.visible[name] ?? true,
      });
    }

    // Field-level validation
    const fieldErrors = await this.validator.validateAll(fieldsMap, this.state.values);

    // Form-level validation
    const formErrors = this.schema.formRules
      ? await this.validator.validateFormRules(this.schema.formRules, this.state.values)
      : {};

    const errors = { ...fieldErrors, ...formErrors };
    const valid = Object.keys(errors).length === 0;

    // Touch all fields
    const touched: Record<string, boolean> = {};
    for (const [name] of this.fieldMap) {
      touched[name] = true;
    }

    this.state = {
      ...this.state,
      errors,
      touched,
      valid,
    };

    this.notify();
    return { valid, errors };
  }

  async validateField(name: string): Promise<string | undefined> {
    const field = this.fieldMap.get(name);
    if (!field) return undefined;

    const rules = this.state.rules[name] ?? field.rules ?? [];
    const error = await this.validator.validateField(name, rules, this.state.values, field.required);

    if (error) {
      this.state = {
        ...this.state,
        errors: { ...this.state.errors, [name]: error },
      };
    } else {
      const { [name]: _, ...rest } = this.state.errors;
      this.state = { ...this.state, errors: rest };
    }

    this.notifyField(name);
    this.notify();
    return error;
  }

  // -----------------------------------------------------------------------
  // Public API: Actions
  // -----------------------------------------------------------------------

  async submit(): Promise<void> {
    this.state = { ...this.state, submitting: true, submitCount: this.state.submitCount + 1 };
    this.notify();

    const { valid, errors } = await this.validate();

    if (!valid) {
      this.state = { ...this.state, submitting: false };
      this.notify();
      return;
    }

    // Build clean output (exclude hidden fields)
    const cleanValues = this.getCleanValues();

    try {
      await this.onSubmitCallback?.({
        values: cleanValues,
        meta: {
          valid: true,
          touched: { ...this.state.touched },
          dirty: this.getDirtyFields(),
          errors: {},
          hiddenFields: this.getHiddenFields(),
        },
      });
    } finally {
      this.state = { ...this.state, submitting: false };
      this.notify();
    }
  }

  reset(values?: Values) {
    const resetValues = values ?? this.initialValues;
    this.state = {
      values: { ...resetValues },
      errors: {},
      touched: {},
      visible: this.buildVisibleMap(resetValues),
      disabled: this.buildDisabledMap(resetValues),
      options: this.buildOptionsMap(),
      rules: this.buildRulesMap(),
      fieldProps: {},
      submitting: false,
      submitCount: this.state.submitCount,
      valid: true,
      dirty: false,
      currentStep: 0,
    };
    this.runInitialEffects();
    this.notify();
  }

  // -----------------------------------------------------------------------
  // Public API: Dynamic Schema
  // -----------------------------------------------------------------------

  addField(field: FieldDefinition, options?: { after?: string; before?: string }) {
    const fields = [...this.schema.fields];
    if (options?.after) {
      const index = fields.findIndex((f) => f.name === options.after);
      fields.splice(index + 1, 0, field);
    } else if (options?.before) {
      const index = fields.findIndex((f) => f.name === options.before);
      fields.splice(index, 0, field);
    } else {
      fields.push(field);
    }

    this.schema = { ...this.schema, fields };
    this.fieldMap.set(field.name, field);
    this.depGraph.addField(field);

    // Initialize field state
    if (field.defaultValue !== undefined) {
      this.state = {
        ...this.state,
        values: setByPath(this.state.values, field.name, field.defaultValue),
      };
    }
    this.state = {
      ...this.state,
      visible: { ...this.state.visible, [field.name]: true },
      disabled: { ...this.state.disabled, [field.name]: field.disabled === true },
    };
    if (field.options) {
      this.state = {
        ...this.state,
        options: { ...this.state.options, [field.name]: field.options },
      };
    }

    this.notify();
  }

  removeField(name: string) {
    this.schema = {
      ...this.schema,
      fields: this.schema.fields.filter((f) => f.name !== name),
    };
    this.fieldMap.delete(name);
    this.depGraph.removeField(name);

    // Clean up state
    this.state = {
      ...this.state,
      values: deleteByPath(this.state.values, name),
    };
    const { [name]: _e, ...errors } = this.state.errors;
    const { [name]: _t, ...touched } = this.state.touched;
    const { [name]: _v, ...visible } = this.state.visible;
    const { [name]: _d, ...disabled } = this.state.disabled;
    this.state = { ...this.state, errors, touched, visible, disabled };

    this.notify();
  }

  // -----------------------------------------------------------------------
  // Public API: Field Array
  // -----------------------------------------------------------------------

  appendRow(arrayName: string, value?: Values) {
    const current = getByPath(this.state.values, arrayName) ?? [];
    const field = this.fieldMap.get(arrayName);
    if (field?.maxRows && current.length >= field.maxRows) return;

    const newRow = value ?? (field?.fields ? this.buildDefaultValues(field.fields, {}) : {});
    this.state = {
      ...this.state,
      values: setByPath(this.state.values, arrayName, [...current, newRow]),
      dirty: true,
    };
    this.notify();
  }

  removeRow(arrayName: string, index: number) {
    const current = getByPath(this.state.values, arrayName) ?? [];
    const field = this.fieldMap.get(arrayName);
    if (field?.minRows && current.length <= field.minRows) return;

    const newArr = [...current];
    newArr.splice(index, 1);
    this.state = {
      ...this.state,
      values: setByPath(this.state.values, arrayName, newArr),
      dirty: true,
    };
    this.notify();
  }

  moveRow(arrayName: string, from: number, to: number) {
    const current = getByPath(this.state.values, arrayName) ?? [];
    const newArr = [...current];
    const [removed] = newArr.splice(from, 1);
    newArr.splice(to, 0, removed);
    this.state = {
      ...this.state,
      values: setByPath(this.state.values, arrayName, newArr),
      dirty: true,
    };
    this.notify();
  }

  // -----------------------------------------------------------------------
  // Public API: Wizard
  // -----------------------------------------------------------------------

  async nextStep(): Promise<boolean> {
    const steps = this.schema.steps;
    if (!steps || this.state.currentStep >= steps.length - 1) return false;

    // Validate current step fields
    const currentStepFields = steps[this.state.currentStep].fieldNames;
    let hasErrors = false;

    for (const name of currentStepFields) {
      const error = await this.validateField(name);
      if (error) hasErrors = true;
    }

    if (hasErrors) return false;

    // Find next visible step
    let nextStep = this.state.currentStep + 1;
    while (nextStep < steps.length) {
      const step = steps[nextStep];
      if (!step.when || evaluateWhen(step.when, this.state.values)) {
        break;
      }
      nextStep++;
    }

    if (nextStep >= steps.length) return false;

    this.state = { ...this.state, currentStep: nextStep };
    this.notify();
    return true;
  }

  prevStep() {
    const steps = this.schema.steps;
    if (!steps || this.state.currentStep <= 0) return;

    // Find previous visible step
    let prevStep = this.state.currentStep - 1;
    while (prevStep >= 0) {
      const step = steps[prevStep];
      if (!step.when || evaluateWhen(step.when, this.state.values)) {
        break;
      }
      prevStep--;
    }

    if (prevStep < 0) return;

    this.state = { ...this.state, currentStep: prevStep };
    this.notify();
  }

  async goToStep(step: number): Promise<boolean> {
    const steps = this.schema.steps;
    if (!steps || step < 0 || step >= steps.length) return false;

    // Validate all steps up to the target
    for (let i = 0; i < step; i++) {
      const stepConfig = steps[i];
      if (stepConfig.when && !evaluateWhen(stepConfig.when, this.state.values)) continue;

      for (const name of stepConfig.fieldNames) {
        const error = await this.validateField(name);
        if (error) return false;
      }
    }

    this.state = { ...this.state, currentStep: step };
    this.notify();
    return true;
  }

  // -----------------------------------------------------------------------
  // Public API: Subscriptions
  // -----------------------------------------------------------------------

  subscribe(listener: (state: FormState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeField(name: string, listener: (state: FieldState) => void): () => void {
    if (!this.fieldListeners.has(name)) {
      this.fieldListeners.set(name, new Set());
    }
    this.fieldListeners.get(name)!.add(listener);
    return () => this.fieldListeners.get(name)?.delete(listener);
  }

  // -----------------------------------------------------------------------
  // Public API: Extension
  // -----------------------------------------------------------------------

  use(middleware: Middleware) {
    this.middlewares.push(middleware);
  }

  registerEffect(action: string, handler: EffectHandler) {
    this.effectHandlers.set(action, handler);
  }

  registerValidator(type: string, handler: ValidatorHandler) {
    this.validator.registerValidator(type, handler);
  }

  // -----------------------------------------------------------------------
  // Public API: Lifecycle
  // -----------------------------------------------------------------------

  dispose() {
    this.disposed = true;
    this.listeners.clear();
    this.fieldListeners.clear();
    this.validator.dispose();
  }

  // -----------------------------------------------------------------------
  // Private: Helpers
  // -----------------------------------------------------------------------

  private getCleanValues(): Values {
    let clean = { ...this.state.values };
    for (const [name] of this.fieldMap) {
      if (!this.state.visible[name]) {
        clean = deleteByPath(clean, name);
      }
    }
    return clean;
  }

  private getDirtyFields(): Values {
    const dirty: Values = {};
    for (const [name] of this.fieldMap) {
      const current = getByPath(this.state.values, name);
      const initial = getByPath(this.initialValues, name);
      if (current !== initial) {
        dirty[name] = current;
      }
    }
    return dirty;
  }

  private getHiddenFields(): string[] {
    return Array.from(this.fieldMap.keys()).filter(
      (name) => !this.state.visible[name]
    );
  }
}
