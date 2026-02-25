import React, { useEffect, useMemo } from 'react';
import type { DynamicFormProps, FormSchema } from './types';
import { FormContext } from './react/FormContext';
import { useForm } from './react/useForm';
import { defaultFieldComponents } from './fields';
import { GridLayout } from './layout/GridLayout';
import { WizardLayout } from './layout/WizardLayout';
import './fields/fields.css';

/**
 * DynamicForm — The main component.
 *
 * Provide a JSON schema, get a fully functional form.
 * Everything is customizable via props.
 */
export const DynamicForm: React.FC<DynamicFormProps> = ({
  schema: rawSchema,
  initialValues,
  mode = 'edit',
  context,
  onSubmit,
  onChange,
  onValidate,
  fieldComponents: userFieldComponents,
  fieldWrapper,
  schemaPreprocessor,
  middleware,
  plugins,
  layoutComponent: LayoutComponent,
  className,
  style,
  autosave,
  engineRef,
}) => {
  // Process schema
  const schema = useMemo(() => {
    // Synchronous preprocessor only for initial render
    // Async preprocessor would need useEffect + state
    if (schemaPreprocessor) {
      const result = schemaPreprocessor(rawSchema);
      if (result instanceof Promise) {
        console.warn('DynamicForm: Async schemaPreprocessor detected. Use synchronous preprocessor or handle async outside.');
        return rawSchema;
      }
      return result;
    }
    return rawSchema;
  }, [rawSchema, schemaPreprocessor]);

  // Merge field components: user overrides take precedence
  const fieldComponents = useMemo(
    () => ({
      ...defaultFieldComponents,
      ...userFieldComponents,
    }),
    [userFieldComponents],
  );

  // Initialize form engine
  const { engine, state, handleSubmit, reset } = useForm({
    schema,
    initialValues,
    onSubmit,
    onChange,
    middleware,
    plugins,
  });

  // Expose engine ref
  useEffect(() => {
    if (engineRef) {
      engineRef.current = engine;
    }
  }, [engine, engineRef]);

  // Autosave
  useEffect(() => {
    if (!autosave) return;

    const storage = autosave.storage === 'sessionStorage' ? sessionStorage : localStorage;
    const interval = autosave.interval ?? 5000;

    // Restore saved values
    try {
      const saved = storage.getItem(autosave.key);
      if (saved) {
        const parsed = JSON.parse(saved);
        engine.setValues(parsed);
      }
    } catch {
      // ignore parse errors
    }

    // Save periodically
    const timer = setInterval(() => {
      try {
        storage.setItem(autosave.key, JSON.stringify(engine.getValues()));
      } catch {
        // ignore storage errors
      }
    }, interval);

    return () => clearInterval(timer);
  }, [autosave, engine]);

  // Report validation errors
  useEffect(() => {
    if (onValidate && Object.keys(state.errors).length > 0) {
      onValidate(state.errors);
    }
  }, [state.errors, onValidate]);

  // Context value
  const contextValue = useMemo(
    () => ({
      engine,
      mode,
      context,
      fieldComponents,
      fieldWrapper,
    }),
    [engine, mode, context, fieldComponents, fieldWrapper],
  );

  // Determine layout
  const isWizard = schema.steps && schema.steps.length > 0;

  return (
    <FormContext.Provider value={contextValue}>
      <form
        className={`df-form ${className ?? ''}`}
        style={style}
        onSubmit={handleSubmit}
        noValidate
      >
        {LayoutComponent ? (
          <LayoutComponent schema={schema}>
            {schema.fields.map((field) => (
              <div key={field.name} />
            ))}
          </LayoutComponent>
        ) : isWizard ? (
          <WizardLayout
            schema={schema}
            fields={schema.fields}
            state={state}
            engine={engine}
          />
        ) : (
          <>
            <GridLayout schema={schema} fields={schema.fields} />
            <div className="df-form__actions">
              <button
                type="submit"
                className="df-form__submit"
                disabled={state.submitting}
              >
                {state.submitting ? 'Submitting...' : 'Submit'}
              </button>
              <button
                type="button"
                className="df-form__reset"
                onClick={() => reset()}
              >
                Reset
              </button>
            </div>
          </>
        )}
      </form>
    </FormContext.Provider>
  );
};

DynamicForm.displayName = 'DynamicForm';
