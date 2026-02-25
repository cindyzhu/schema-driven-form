import React from 'react';
import type { FieldDefinition, FieldState } from '../types';
import { useFormContext } from './FormContext';
import { useField } from './useField';

interface FieldRendererProps {
  field: FieldDefinition;
  namePrefix?: string;
}

/**
 * Renders a single field by looking up the registered component for its type.
 * Wraps with fieldWrapper if provided.
 */
export const FieldRenderer: React.FC<FieldRendererProps> = React.memo(({ field, namePrefix }) => {
  const { engine, mode, context, fieldComponents, fieldWrapper } = useFormContext();
  const fullName = namePrefix ? `${namePrefix}.${field.name}` : field.name;
  const fieldState = useField(fullName);

  // Don't render if not visible
  if (!fieldState.visible) return null;

  // Check access control
  if (field.access?.view && context) {
    const userRole = context.userRole;
    if (userRole && !field.access.view.includes(userRole)) {
      return null;
    }
  }

  // Custom render function (escape hatch)
  if (field.render) {
    return <>{field.render(fieldState, engine)}</>;
  }

  // Look up registered component
  const Component = fieldComponents[field.type];
  if (!Component) {
    console.warn(`DynamicForm: No component registered for field type "${field.type}"`);
    return (
      <div style={{ color: 'red', fontSize: 12 }}>
        Unknown field type: {field.type}
      </div>
    );
  }

  // Determine effective disabled/readOnly state
  const effectiveFieldState: FieldState = {
    ...fieldState,
    disabled: fieldState.disabled || mode === 'disabled',
    readOnly: fieldState.readOnly || mode === 'readonly',
  };

  // Check edit access
  if (field.access?.edit && context) {
    const userRole = context.userRole;
    if (userRole && !field.access.edit.includes(userRole)) {
      effectiveFieldState.readOnly = true;
    }
  }

  const element = (
    <Component
      field={effectiveFieldState}
      definition={field}
      form={engine}
    />
  );

  // Apply wrapper if provided
  if (fieldWrapper) {
    return <>{fieldWrapper(effectiveFieldState, element, context)}</>;
  }

  return element;
});

FieldRenderer.displayName = 'FieldRenderer';
