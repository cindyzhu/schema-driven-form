import React from 'react';
import type { FieldComponentProps } from '../types';
import { FieldWrapper } from './FieldWrapper';

export const TextareaInput: React.FC<FieldComponentProps> = ({ field, definition }) => {
  return (
    <FieldWrapper field={field} definition={definition}>
      <textarea
        id={field.name}
        name={field.name}
        className="df-textarea"
        value={field.value ?? ''}
        placeholder={definition.placeholder}
        disabled={field.disabled}
        readOnly={field.readOnly}
        rows={definition.props?.rows ?? 4}
        onChange={(e) => field.onChange(e.target.value)}
        onBlur={field.onBlur}
      />
    </FieldWrapper>
  );
};
