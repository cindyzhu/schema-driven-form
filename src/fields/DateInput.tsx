import React from 'react';
import type { FieldComponentProps } from '../types';
import { FieldWrapper } from './FieldWrapper';

/** Handles: date, time, datetime */
export const DateInput: React.FC<FieldComponentProps> = ({ field, definition }) => {
  const inputType =
    definition.type === 'time' ? 'time' :
    definition.type === 'datetime' ? 'datetime-local' :
    'date';

  return (
    <FieldWrapper field={field} definition={definition}>
      <input
        id={field.name}
        name={field.name}
        type={inputType}
        className="df-date-input"
        value={field.value ?? ''}
        disabled={field.disabled}
        readOnly={field.readOnly}
        min={definition.props?.min}
        max={definition.props?.max}
        onChange={(e) => field.onChange(e.target.value || undefined)}
        onBlur={field.onBlur}
      />
    </FieldWrapper>
  );
};

/** Date range: two date inputs */
export const DateRangeInput: React.FC<FieldComponentProps> = ({ field, definition }) => {
  const value = field.value ?? [undefined, undefined];
  const start = value[0] ?? '';
  const end = value[1] ?? '';

  return (
    <FieldWrapper field={field} definition={definition}>
      <div className="df-date-range">
        <input
          type="date"
          className="df-date-input"
          value={start}
          disabled={field.disabled}
          placeholder="Start date"
          onChange={(e) => field.onChange([e.target.value || undefined, end || undefined])}
          onBlur={field.onBlur}
        />
        <span className="df-date-range__separator">to</span>
        <input
          type="date"
          className="df-date-input"
          value={end}
          disabled={field.disabled}
          placeholder="End date"
          min={start || undefined}
          onChange={(e) => field.onChange([start || undefined, e.target.value || undefined])}
          onBlur={field.onBlur}
        />
      </div>
    </FieldWrapper>
  );
};
