import React from 'react';
import type { FieldComponentProps } from '../types';
import { FieldWrapper } from './FieldWrapper';

export const RadioInput: React.FC<FieldComponentProps> = ({ field, definition }) => {
  const options = field.options ?? [];
  const horizontal = definition.props?.direction === 'horizontal';

  return (
    <FieldWrapper field={field} definition={definition}>
      <div className={`df-radio-group ${horizontal ? 'df-radio-group--horizontal' : ''}`}>
        {options.map((opt) => (
          <label key={String(opt.value)} className="df-radio-wrapper">
            <input
              type="radio"
              name={field.name}
              value={String(opt.value)}
              checked={field.value === opt.value}
              disabled={field.disabled || opt.disabled}
              onChange={() => field.onChange(opt.value)}
              onBlur={field.onBlur}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </FieldWrapper>
  );
};
