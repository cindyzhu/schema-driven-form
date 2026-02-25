import React from 'react';
import type { FieldComponentProps } from '../types';
import { FieldWrapper } from './FieldWrapper';

/** Handles: text, email, url, phone, password */
export const TextInput: React.FC<FieldComponentProps> = ({ field, definition }) => {
  const inputType =
    definition.type === 'password' ? 'password' :
    definition.type === 'email' ? 'email' :
    definition.type === 'url' ? 'url' :
    definition.type === 'phone' ? 'tel' :
    'text';

  return (
    <FieldWrapper field={field} definition={definition}>
      <input
        id={field.name}
        name={field.name}
        type={inputType}
        className="df-input"
        value={field.value ?? ''}
        placeholder={definition.placeholder}
        disabled={field.disabled}
        readOnly={field.readOnly}
        onChange={(e) => field.onChange(e.target.value)}
        onBlur={field.onBlur}
        {...(field.props || {})}
      />
    </FieldWrapper>
  );
};
