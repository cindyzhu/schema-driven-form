import React from 'react';
import type { FieldComponentProps } from '../types';
import { FieldWrapper } from './FieldWrapper';

export const SwitchInput: React.FC<FieldComponentProps> = ({ field, definition }) => {
  const isActive = !!field.value;

  return (
    <FieldWrapper field={field} definition={definition}>
      <div
        className={`df-switch ${field.disabled ? 'df-switch--disabled' : ''}`}
        onClick={() => !field.disabled && field.onChange(!isActive)}
        role="switch"
        aria-checked={isActive}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            !field.disabled && field.onChange(!isActive);
          }
        }}
        onBlur={field.onBlur}
      >
        <div className={`df-switch__track ${isActive ? 'df-switch__track--active' : ''}`}>
          <div className="df-switch__thumb" />
        </div>
        {definition.props?.switchLabel && (
          <span className="df-switch__label">{definition.props.switchLabel}</span>
        )}
      </div>
    </FieldWrapper>
  );
};
