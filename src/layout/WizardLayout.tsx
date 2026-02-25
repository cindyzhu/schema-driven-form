import React from 'react';
import type { FormSchema, FieldDefinition, FormState, FormEngineAPI } from '../types';
import { FieldRenderer } from '../react/FieldRenderer';
import { evaluateWhen } from '../utils/when';

interface WizardLayoutProps {
  schema: FormSchema;
  fields: FieldDefinition[];
  state: FormState;
  engine: FormEngineAPI;
}

export const WizardLayout: React.FC<WizardLayoutProps> = ({ schema, fields, state, engine }) => {
  const steps = schema.steps ?? [];
  if (steps.length === 0) return null;

  const currentStep = state.currentStep;
  const visibleSteps = steps.filter(
    (step) => !step.when || evaluateWhen(step.when, state.values)
  );
  const currentStepConfig = visibleSteps[currentStep];
  const columns = schema.layout?.columns ?? 1;

  // Get fields for the current step
  const stepFields = currentStepConfig
    ? fields.filter((f) => currentStepConfig.fieldNames.includes(f.name))
    : [];

  const isFirst = currentStep === 0;
  const isLast = currentStep === visibleSteps.length - 1;

  return (
    <div className="df-wizard">
      {/* Step indicator */}
      <div className="df-wizard__steps">
        {visibleSteps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          return (
            <React.Fragment key={step.id}>
              {index > 0 && <div className="df-wizard__step-connector" />}
              <div
                className={`df-wizard__step ${
                  isActive ? 'df-wizard__step--active' : ''
                } ${isCompleted ? 'df-wizard__step--completed' : ''}`}
              >
                <div className="df-wizard__step-number">
                  {isCompleted ? '✓' : index + 1}
                </div>
                <span className="df-wizard__step-title">{step.title}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Step content */}
      <div className="df-wizard__content">
        <div
          className="df-form__grid"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {stepFields.map((field) => (
            <FieldRenderer key={field.name} field={field} />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="df-wizard__actions">
        <button
          type="button"
          className="df-form__reset"
          onClick={() => engine.prevStep()}
          disabled={isFirst}
        >
          Previous
        </button>
        {isLast ? (
          <button
            type="button"
            className="df-form__submit"
            onClick={() => engine.submit()}
            disabled={state.submitting}
          >
            {state.submitting ? 'Submitting...' : 'Submit'}
          </button>
        ) : (
          <button
            type="button"
            className="df-form__submit"
            onClick={() => engine.nextStep()}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};
