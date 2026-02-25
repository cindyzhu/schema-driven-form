import React, { useState } from 'react';
import type { FieldComponentProps } from '../types';
import { FieldWrapper } from './FieldWrapper';

export const RateInput: React.FC<FieldComponentProps> = ({ field, definition }) => {
  const count = definition.props?.count ?? 5;
  const [hovered, setHovered] = useState(0);
  const currentValue = field.value ?? 0;

  return (
    <FieldWrapper field={field} definition={definition}>
      <div
        className="df-rate"
        onMouseLeave={() => setHovered(0)}
      >
        {Array.from({ length: count }, (_, i) => {
          const starValue = i + 1;
          const isActive = starValue <= (hovered || currentValue);
          return (
            <button
              key={i}
              type="button"
              className={`df-rate__star ${isActive ? 'df-rate__star--active' : ''}`}
              onMouseEnter={() => !field.disabled && setHovered(starValue)}
              onClick={() => {
                if (!field.disabled) {
                  field.onChange(starValue === currentValue ? 0 : starValue);
                }
              }}
              onBlur={field.onBlur}
              disabled={field.disabled}
            >
              ★
            </button>
          );
        })}
      </div>
    </FieldWrapper>
  );
};
