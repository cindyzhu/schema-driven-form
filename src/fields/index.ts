import type { FieldComponentProps } from '../types';
import { TextInput } from './TextInput';
import { NumberInput } from './NumberInput';
import { TextareaInput } from './TextareaInput';
import { SelectInput } from './SelectInput';
import { MultiSelectInput } from './MultiSelectInput';
import { RadioInput } from './RadioInput';
import { CheckboxInput, CheckboxGroupInput } from './CheckboxInput';
import { SwitchInput } from './SwitchInput';
import { DateInput, DateRangeInput } from './DateInput';
import { SliderInput } from './SliderInput';
import { RateInput } from './RateInput';
import { UploadInput } from './UploadInput';
import { ColorPickerInput } from './ColorPickerInput';
import { CascaderInput } from './CascaderInput';
import { FieldArrayInput } from './FieldArrayInput';
import { FieldGroupInput } from './FieldGroupInput';

/**
 * Default field component registry.
 * Maps field type strings to React components.
 * Users can override any of these or add new types.
 */
export const defaultFieldComponents: Record<string, React.ComponentType<FieldComponentProps>> = {
  text: TextInput,
  email: TextInput,
  url: TextInput,
  phone: TextInput,
  password: TextInput,
  number: NumberInput,
  textarea: TextareaInput,
  select: SelectInput,
  multiSelect: MultiSelectInput,
  radio: RadioInput,
  checkbox: CheckboxInput,
  checkboxGroup: CheckboxGroupInput,
  switch: SwitchInput,
  date: DateInput,
  time: DateInput,
  datetime: DateInput,
  dateRange: DateRangeInput,
  slider: SliderInput,
  rate: RateInput,
  upload: UploadInput,
  imageUpload: UploadInput,
  colorPicker: ColorPickerInput,
  cascader: CascaderInput,
  fieldArray: FieldArrayInput,
  fieldGroup: FieldGroupInput,
};

// Re-export all components for individual use
export { TextInput } from './TextInput';
export { NumberInput } from './NumberInput';
export { TextareaInput } from './TextareaInput';
export { SelectInput } from './SelectInput';
export { MultiSelectInput } from './MultiSelectInput';
export { RadioInput } from './RadioInput';
export { CheckboxInput, CheckboxGroupInput } from './CheckboxInput';
export { SwitchInput } from './SwitchInput';
export { DateInput, DateRangeInput } from './DateInput';
export { SliderInput } from './SliderInput';
export { RateInput } from './RateInput';
export { UploadInput } from './UploadInput';
export { ColorPickerInput } from './ColorPickerInput';
export { CascaderInput } from './CascaderInput';
export { FieldArrayInput } from './FieldArrayInput';
export { FieldGroupInput } from './FieldGroupInput';
export { FieldWrapper } from './FieldWrapper';
