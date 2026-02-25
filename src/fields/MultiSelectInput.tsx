import React, { useState, useRef, useEffect } from 'react';
import type { FieldComponentProps } from '../types';
import { FieldWrapper } from './FieldWrapper';

export const MultiSelectInput: React.FC<FieldComponentProps> = ({ field, definition }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const options = field.options ?? [];
  const selected: any[] = Array.isArray(field.value) ? field.value : [];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (value: any) => {
    const newSelected = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    field.onChange(newSelected);
  };

  const removeTag = (value: any, e: React.MouseEvent) => {
    e.stopPropagation();
    field.onChange(selected.filter((v) => v !== value));
  };

  return (
    <FieldWrapper field={field} definition={definition}>
      <div className="df-multi-select" ref={ref}>
        <div
          className="df-multi-select__tags"
          onClick={() => !field.disabled && setOpen(!open)}
          tabIndex={0}
          onBlur={() => {
            // Delay to allow click on option
            setTimeout(() => {
              if (ref.current && !ref.current.contains(document.activeElement)) {
                setOpen(false);
                field.onBlur();
              }
            }, 150);
          }}
        >
          {selected.length === 0 && (
            <span className="df-multi-select__placeholder">
              {definition.placeholder ?? 'Select...'}
            </span>
          )}
          {selected.map((val) => {
            const opt = options.find((o) => o.value === val);
            return (
              <span key={String(val)} className="df-multi-select__tag">
                {opt?.label ?? val}
                <button
                  type="button"
                  className="df-multi-select__tag-remove"
                  onClick={(e) => removeTag(val, e)}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
        {open && (
          <div className="df-multi-select__dropdown">
            {options.map((opt) => (
              <div
                key={String(opt.value)}
                className="df-multi-select__option"
                onClick={() => toggle(opt.value)}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  readOnly
                  style={{ accentColor: '#3b82f6' }}
                />
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </FieldWrapper>
  );
};
