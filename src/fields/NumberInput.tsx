import React from 'react';
import type { FieldComponentProps } from '../types';
import { FieldWrapper } from './FieldWrapper';

export const NumberInput: React.FC<FieldComponentProps> = ({ field, definition }) => {
  return (
    <FieldWrapper field={field} definition={definition}>
      <input
        id={field.name}
        name={field.name}
        type="number"
        className="df-input"
        value={field.value ?? ''}
        placeholder={definition.placeholder}
        disabled={field.disabled}
        readOnly={field.readOnly}
        min={definition.props?.min}
        max={definition.props?.max}
        step={definition.props?.step}
        onChange={(e) => {
          const val = e.target.value;
          field.onChange(val === '' ? undefined : Number(val));
        }}
        onBlur={field.onBlur}
      />
    </FieldWrapper>
  );
};
