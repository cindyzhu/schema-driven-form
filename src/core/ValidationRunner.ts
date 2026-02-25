import type {
  ValidationRule,
  Values,
  Errors,
  FormRule,
  ValidatorHandler,
} from '../types';
import { getByPath } from '../utils/path';

// Built-in validator registry
const builtInValidators: Record<string, (value: any, rule: any, values: Values) => string | undefined> = {
  required: (value, rule) => {
    if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
      return rule.message ?? 'This field is required';
    }
    return undefined;
  },

  min: (value, rule) => {
    if (value != null && Number(value) < rule.value) {
      return rule.message ?? `Must be at least ${rule.value}`;
    }
    return undefined;
  },

  max: (value, rule) => {
    if (value != null && Number(value) > rule.value) {
      return rule.message ?? `Must be at most ${rule.value}`;
    }
    return undefined;
  },

  minLength: (value, rule) => {
    if (value != null && String(value).length < rule.value) {
      return rule.message ?? `Must be at least ${rule.value} characters`;
    }
    return undefined;
  },

  maxLength: (value, rule) => {
    if (value != null && String(value).length > rule.value) {
      return rule.message ?? `Must be at most ${rule.value} characters`;
    }
    return undefined;
  },

  pattern: (value, rule) => {
    if (value != null && value !== '') {
      const regex = typeof rule.value === 'string' ? new RegExp(rule.value) : rule.value;
      if (!regex.test(String(value))) {
        return rule.message ?? 'Invalid format';
      }
    }
    return undefined;
  },

  email: (value, rule) => {
    if (value != null && value !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(value))) {
        return rule.message ?? 'Invalid email address';
      }
    }
    return undefined;
  },

  url: (value, rule) => {
    if (value != null && value !== '') {
      try {
        new URL(String(value));
      } catch {
        return rule.message ?? 'Invalid URL';
      }
    }
    return undefined;
  },

  phone: (value, rule) => {
    if (value != null && value !== '') {
      const phoneRegex = /^[+]?[\d\s\-().]{7,20}$/;
      if (!phoneRegex.test(String(value))) {
        return rule.message ?? 'Invalid phone number';
      }
    }
    return undefined;
  },
};

export class ValidationRunner {
  private customValidators = new Map<string, ValidatorHandler>();
  private asyncTimers = new Map<string, ReturnType<typeof setTimeout>>();

  /**
   * Register a custom validator type.
   */
  registerValidator(type: string, handler: ValidatorHandler) {
    this.customValidators.set(type, handler);
  }

  /**
   * Validate a single field synchronously.
   */
  validateFieldSync(
    fieldName: string,
    rules: ValidationRule[],
    values: Values,
    required?: boolean,
  ): string | undefined {
    const value = getByPath(values, fieldName);

    // Check required first
    if (required) {
      const error = builtInValidators.required(value, { message: undefined });
      if (error) return error;
    }

    for (const rule of rules) {
      // Skip async rules in sync validation
      if (rule.type === 'async') continue;

      // Custom validator function
      if (rule.type === 'custom') {
        const error = (rule as any).validator(value, values);
        if (error) return error;
        continue;
      }

      // Built-in validator
      const builtIn = builtInValidators[rule.type];
      if (builtIn) {
        const error = builtIn(value, rule, values);
        if (error) return error;
        continue;
      }

      // Extension validator
      const custom = this.customValidators.get(rule.type);
      if (custom) {
        const error = custom(value, rule as any, values);
        if (typeof error === 'string') return error;
        // If it returns a promise, skip in sync mode
      }
    }

    return undefined;
  }

  /**
   * Validate a single field (sync + async).
   */
  async validateField(
    fieldName: string,
    rules: ValidationRule[],
    values: Values,
    required?: boolean,
  ): Promise<string | undefined> {
    // First run sync validation
    const syncError = this.validateFieldSync(fieldName, rules, values, required);
    if (syncError) return syncError;

    const value = getByPath(values, fieldName);

    // Then run async validators
    for (const rule of rules) {
      if (rule.type === 'async') {
        const error = await (rule as any).validator(value, values);
        if (error) return error;
      }

      // Extension validators that return promises
      if (rule.type !== 'custom' && rule.type !== 'async' && !builtInValidators[rule.type]) {
        const custom = this.customValidators.get(rule.type);
        if (custom) {
          const result = custom(value, rule as any, values);
          if (result instanceof Promise) {
            const error = await result;
            if (error) return error;
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Validate a field with debounce for async rules.
   */
  validateFieldDebounced(
    fieldName: string,
    rules: ValidationRule[],
    values: Values,
    required: boolean | undefined,
    callback: (error: string | undefined) => void,
  ) {
    // Clear existing timer for this field
    const existing = this.asyncTimers.get(fieldName);
    if (existing) clearTimeout(existing);

    // Run sync validation immediately
    const syncError = this.validateFieldSync(fieldName, rules, values, required);
    if (syncError) {
      callback(syncError);
      return;
    }

    // Check if there are async rules
    const asyncRules = rules.filter((r) => r.type === 'async');
    if (asyncRules.length === 0) {
      callback(undefined);
      return;
    }

    // Debounce async validation
    const debounce = Math.max(...asyncRules.map((r) => (r as any).debounce ?? 300));
    const timer = setTimeout(async () => {
      const error = await this.validateField(fieldName, rules, values, required);
      callback(error);
    }, debounce);

    this.asyncTimers.set(fieldName, timer);
  }

  /**
   * Validate all fields.
   */
  async validateAll(
    fieldsMap: Map<string, { rules: ValidationRule[]; required?: boolean; visible: boolean }>,
    values: Values,
  ): Promise<Errors> {
    const errors: Errors = {};

    const promises = Array.from(fieldsMap.entries()).map(async ([name, config]) => {
      // Skip hidden fields
      if (!config.visible) return;

      const error = await this.validateField(name, config.rules, values, config.required);
      if (error) {
        errors[name] = error;
      }
    });

    await Promise.all(promises);
    return errors;
  }

  /**
   * Run form-level validators.
   */
  async validateFormRules(rules: FormRule[], values: Values): Promise<Errors> {
    const errors: Errors = {};

    for (const rule of rules) {
      const result = await rule.validator(values);
      if (result) {
        Object.assign(errors, result);
      }
    }

    return errors;
  }

  /**
   * Clean up timers.
   */
  dispose() {
    for (const timer of this.asyncTimers.values()) {
      clearTimeout(timer);
    }
    this.asyncTimers.clear();
  }
}
