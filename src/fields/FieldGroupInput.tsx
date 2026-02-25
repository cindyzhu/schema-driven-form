import React from 'react';
import type { FieldComponentProps } from '../types';
import { FieldRenderer } from '../react/FieldRenderer';

export const FieldGroupInput: React.FC<FieldComponentProps> = ({ field, definition }) => {
  const subFields = definition.fields ?? [];

  return (
    <div
      className="df-field-group"
      style={{ gridColumn: definition.colSpan ? `span ${definition.colSpan}` : undefined }}
    >
      {definition.label && (
        <h4 className="df-field-group__title">{definition.label}</h4>
      )}
      <div
        className="df-field-group__fields"
        style={{
          gridTemplateColumns: definition.props?.columns
            ? `repeat(${definition.props.columns}, 1fr)`
            : '1fr',
        }}
      >
        {subFields.map((subField) => (
          <FieldRenderer
            key={subField.name}
            field={subField}
            namePrefix={field.name}
          />
        ))}
      </div>
    </div>
  );
};
