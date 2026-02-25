import React from 'react';
import type { FieldComponentProps } from '../types';
import { FieldWrapper } from './FieldWrapper';

export const ColorPickerInput: React.FC<FieldComponentProps> = ({ field, definition }) => {
  return (
    <FieldWrapper field={field} definition={definition}>
      <div className="df-color-picker">
        <input
          type="color"
          className="df-color-picker__input"
          value={field.value ?? '#000000'}
          disabled={field.disabled}
          onChange={(e) => field.onChange(e.target.value)}
          onBlur={field.onBlur}
        />
        <span className="df-color-picker__value">{field.value ?? '#000000'}</span>
      </div>
    </FieldWrapper>
  );
};
