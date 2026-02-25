import React from 'react';
import type { FieldComponentProps, FieldOption } from '../types';
import { FieldWrapper } from './FieldWrapper';

/**
 * Cascader: multi-level linked selects.
 * Options use the `children` property for nesting.
 * Value is an array of selected values at each level.
 */
export const CascaderInput: React.FC<FieldComponentProps> = ({ field, definition }) => {
  const options = field.options ?? [];
  const value: any[] = Array.isArray(field.value) ? field.value : [];

  // Build levels from the nested options tree
  const levels: FieldOption[][] = [options];
  let current = options;
  for (let i = 0; i < value.length; i++) {
    const selected = current.find((o) => o.value === value[i]);
    if (selected?.children && selected.children.length > 0) {
      levels.push(selected.children);
      current = selected.children;
    } else {
      break;
    }
  }

  const handleChange = (level: number, selectedValue: string) => {
    const newValue = value.slice(0, level);
    if (selectedValue) {
      newValue.push(selectedValue);
    }
    field.onChange(newValue.length > 0 ? newValue : undefined);
  };

  return (
    <FieldWrapper field={field} definition={definition}>
      <div className="df-cascader">
        {levels.map((levelOptions, i) => (
          <select
            key={i}
            className="df-select"
            value={value[i] ?? ''}
            disabled={field.disabled}
            onChange={(e) => handleChange(i, e.target.value)}
            onBlur={field.onBlur}
          >
            <option value="">
              {definition.props?.placeholders?.[i] ?? `Select level ${i + 1}...`}
            </option>
            {levelOptions.map((opt) => (
              <option key={String(opt.value)} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
      </div>
    </FieldWrapper>
  );
};
