import React from 'react';
import type { FieldComponentProps } from '../types';
import { FieldWrapper } from './FieldWrapper';

export const SelectInput: React.FC<FieldComponentProps> = ({ field, definition }) => {
  const options = field.options ?? [];

  return (
    <FieldWrapper field={field} definition={definition}>
      <select
        id={field.name}
        name={field.name}
        className="df-select"
        value={field.value ?? ''}
        disabled={field.disabled}
        onChange={(e) => field.onChange(e.target.value || undefined)}
        onBlur={field.onBlur}
      >
        <option value="">{definition.placeholder ?? 'Select...'}</option>
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
};
