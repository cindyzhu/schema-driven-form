import React from 'react';
import type { FieldComponentProps } from '../types';
import { useFormContext } from '../react/FormContext';
import { useFieldArray } from '../react/useFieldArray';
import { FieldRenderer } from '../react/FieldRenderer';
import { FieldWrapper } from './FieldWrapper';

export const FieldArrayInput: React.FC<FieldComponentProps> = ({ field, definition }) => {
  const { engine } = useFormContext();
  const { fields, append, remove } = useFieldArray(field.name);
  const subFields = definition.fields ?? [];
  const canRemove = !definition.minRows || fields.length > definition.minRows;
  const canAdd = !definition.maxRows || fields.length < definition.maxRows;

  return (
    <FieldWrapper field={field} definition={definition}>
      <div className="df-field-array">
        {fields.map((row, index) => (
          <div key={index} className="df-field-array__row">
            <div className="df-field-array__row-fields">
              {subFields.map((subField) => (
                <FieldRenderer
                  key={subField.name}
                  field={subField}
                  namePrefix={`${field.name}.${index}`}
                />
              ))}
            </div>
            {canRemove && (
              <button
                type="button"
                className="df-field-array__row-remove"
                onClick={() => remove(index)}
                disabled={field.disabled}
                title="Remove row"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {canAdd && (
          <button
            type="button"
            className="df-field-array__add"
            onClick={() => append()}
            disabled={field.disabled}
          >
            + Add {definition.props?.addLabel ?? 'Row'}
          </button>
        )}
      </div>
    </FieldWrapper>
  );
};
