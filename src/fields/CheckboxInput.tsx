import React from 'react';
import type { FieldComponentProps } from '../types';
import { FieldWrapper } from './FieldWrapper';

/** Single checkbox (boolean value) */
export const CheckboxInput: React.FC<FieldComponentProps> = ({ field, definition }) => {
  return (
    <FieldWrapper field={field} definition={definition}>
      <label className="df-checkbox-wrapper">
        <input
          type="checkbox"
          name={field.name}
          checked={!!field.value}
          disabled={field.disabled}
          onChange={(e) => field.onChange(e.target.checked)}
          onBlur={field.onBlur}
        />
        {definition.props?.checkboxLabel ?? ''}
      </label>
    </FieldWrapper>
  );
};

/** Checkbox group (array of values) */
export const CheckboxGroupInput: React.FC<FieldComponentProps> = ({ field, definition }) => {
  const options = field.options ?? [];
  const selected: any[] = Array.isArray(field.value) ? field.value : [];
  const horizontal = definition.props?.direction === 'horizontal';

  const toggle = (value: any) => {
    const newSelected = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    field.onChange(newSelected);
  };

  return (
    <FieldWrapper field={field} definition={definition}>
      <div className={`df-checkbox-group ${horizontal ? 'df-checkbox-group--horizontal' : ''}`}>
        {options.map((opt) => (
          <label key={String(opt.value)} className="df-checkbox-wrapper">
            <input
              type="checkbox"
              checked={selected.includes(opt.value)}
              disabled={field.disabled || opt.disabled}
              onChange={() => toggle(opt.value)}
              onBlur={field.onBlur}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </FieldWrapper>
  );
};
