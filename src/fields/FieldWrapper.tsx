import React from 'react';
import type { FieldState, FieldDefinition } from '../types';
import './fields.css';

interface FieldWrapperProps {
  field: FieldState;
  definition: FieldDefinition;
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared wrapper for all field components.
 * Renders label, description, error message, and required indicator.
 */
export const FieldWrapper: React.FC<FieldWrapperProps> = ({
  field,
  definition,
  children,
  className,
}) => {
  const hasError = field.touched && !!field.error;

  return (
    <div
      className={`df-field ${hasError ? 'df-field--error' : ''} ${className ?? ''}`}
      style={{ gridColumn: definition.colSpan ? `span ${definition.colSpan}` : undefined }}
    >
      {definition.label && (
        <label className="df-field__label" htmlFor={field.name}>
          {definition.label}
          {definition.required && <span className="df-field__required">*</span>}
        </label>
      )}
      <div className="df-field__control">{children}</div>
      {hasError && <div className="df-field__error">{field.error}</div>}
      {definition.description && !hasError && (
        <div className="df-field__description">{definition.description}</div>
      )}
    </div>
  );
};
