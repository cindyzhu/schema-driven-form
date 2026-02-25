import React from 'react';
import type { FieldComponentProps } from '../types';
import { FieldWrapper } from './FieldWrapper';

export const SliderInput: React.FC<FieldComponentProps> = ({ field, definition }) => {
  const min = definition.props?.min ?? 0;
  const max = definition.props?.max ?? 100;
  const step = definition.props?.step ?? 1;

  return (
    <FieldWrapper field={field} definition={definition}>
      <div className="df-slider-wrapper">
        <input
          type="range"
          className="df-slider"
          value={field.value ?? min}
          min={min}
          max={max}
          step={step}
          disabled={field.disabled}
          onChange={(e) => field.onChange(Number(e.target.value))}
          onBlur={field.onBlur}
        />
        <span className="df-slider__value">{field.value ?? min}</span>
      </div>
    </FieldWrapper>
  );
};
