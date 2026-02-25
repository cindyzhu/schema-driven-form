# API Reference

## Schema Reference

### FormSchema

```typescript
interface FormSchema {
  fields: FieldDefinition[];      // Field definitions
  layout?: {
    columns?: number;             // Grid columns (default: 1)
    labelPosition?: 'top' | 'left' | 'right';
    gap?: number;
  };
  formRules?: FormRule[];         // Cross-field validation
  steps?: StepConfig[];           // Wizard mode configuration
}
```

### FieldDefinition

```typescript
interface FieldDefinition {
  name: string;                   // Unique field name (supports dot paths: "address.city")
  type: string;                   // Field type (see supported types below)
  label?: string;
  placeholder?: string;
  description?: string;           // Help text shown below field
  required?: boolean;
  disabled?: boolean | ((values) => boolean);
  hidden?: boolean | ((values) => boolean);
  readOnly?: boolean;
  defaultValue?: any;
  colSpan?: number;               // Grid column span
  section?: string;               // Group fields into sections

  // Validation
  rules?: ValidationRule[];

  // Dependencies
  when?: WhenCondition;           // Conditional visibility
  effects?: Effect[];             // Field interaction logic

  // Selection fields
  options?: FieldOption[];

  // Composite fields
  fields?: FieldDefinition[];     // Sub-fields for fieldArray/fieldGroup
  minRows?: number;               // Minimum rows for fieldArray
  maxRows?: number;               // Maximum rows for fieldArray

  // Pass-through
  props?: Record<string, any>;    // Custom props passed to field component

  // Escape hatch
  render?: (fieldState, engine) => ReactNode;  // Full custom render
}
```

## Field Types

| Type | Description | Value |
|------|-------------|-------|
| `text` | Text input | `string` |
| `email` | Email input | `string` |
| `url` | URL input | `string` |
| `phone` | Phone input | `string` |
| `password` | Password input | `string` |
| `number` | Number input | `number` |
| `textarea` | Multi-line text | `string` |
| `select` | Dropdown select | `any` |
| `multiSelect` | Multi-select with tags | `any[]` |
| `radio` | Radio group | `any` |
| `checkbox` | Single checkbox | `boolean` |
| `checkboxGroup` | Checkbox group | `any[]` |
| `switch` | Toggle switch | `boolean` |
| `date` | Date picker | `string` |
| `time` | Time picker | `string` |
| `datetime` | Date-time picker | `string` |
| `dateRange` | Date range picker | `[string, string]` |
| `slider` | Range slider | `number` |
| `rate` | Star rating | `number` |
| `upload` | File upload (drag & drop) | `FileInfo[]` |
| `colorPicker` | Color picker | `string` |
| `cascader` | Multi-level linked selects | `any[]` |
| `fieldArray` | Dynamic repeatable rows | `object[]` |
| `fieldGroup` | Nested object group | `object` |
| `custom` | User-defined | `any` |

## Validation

### Built-in Rules

```typescript
{ type: 'required', message?: string }
{ type: 'min', value: number }
{ type: 'max', value: number }
{ type: 'minLength', value: number }
{ type: 'maxLength', value: number }
{ type: 'pattern', value: string | RegExp, message: string }
{ type: 'email' }
{ type: 'url' }
{ type: 'phone' }
```

### Custom Validators

```typescript
// Sync
{ type: 'custom', validator: (value, allValues) => 'error' | undefined }

// Async (e.g., check username availability)
{ type: 'async', validator: async (value, allValues) => 'error' | undefined, debounce: 500 }
```

### Form-Level Cross-Field Validation

```typescript
const schema: FormSchema = {
  fields: [...],
  formRules: [
    {
      validator: (values) => {
        const errors = {};
        if (values.endDate <= values.startDate) {
          errors.endDate = 'End date must be after start date';
        }
        if (!values.phone && !values.email) {
          errors.phone = 'Provide at least phone or email';
        }
        return Object.keys(errors).length ? errors : undefined;
      },
    },
  ],
};
```

## Dependencies & Conditional Logic

### Simple Visibility (when)

```typescript
// Show field when another field has a specific value
{ name: 'phone', type: 'text', when: { field: 'contactMethod', value: 'phone' } }

// Multiple conditions (AND)
{ when: [{ field: 'type', value: 'premium' }, { field: 'amount', gt: 100 }] }

// OR conditions
{ when: { or: [{ field: 'status', value: 'active' }, { field: 'role', value: 'admin' }] } }

// NOT
{ when: { field: 'hideDetails', not: true } }

// IN
{ when: { field: 'country', in: ['US', 'CA', 'UK'] } }

// Comparison
{ when: { field: 'age', gte: 18 } }

// Custom test
{ when: { field: 'email', test: (v) => v?.endsWith('@company.com') } }
```

### Effects (Full Dependency System)

```typescript
{
  name: 'subCategory',
  type: 'select',
  effects: [
    // Cascade options: update options when parent changes
    {
      watch: 'category',
      action: 'setOptions',
      compute: (category) => SUB_CATEGORIES[category] ?? [],
    },
    // Clear value when parent changes
    {
      watch: 'category',
      action: 'setValue',
      compute: () => undefined,
    },
  ],
}

{
  name: 'total',
  type: 'number',
  disabled: true,
  effects: [
    // Multi-field computation
    {
      watch: ['quantity', 'price'],
      action: 'setValue',
      compute: (qty, price) => (qty ?? 0) * (price ?? 0),
    },
  ],
}

{
  name: 'attachment',
  type: 'upload',
  effects: [
    // Dynamic validation rules
    {
      watch: 'amount',
      action: 'setRules',
      compute: (amount) =>
        amount > 100
          ? [{ type: 'required', message: 'Attachment required for amounts over $100' }]
          : [],
    },
  ],
}
```

### Available Effect Actions

| Action | Description |
|--------|-------------|
| `setValue` | Set the field's value |
| `setOptions` | Update select/radio options |
| `setVisible` | Show/hide the field |
| `setDisabled` | Enable/disable the field |
| `setRules` | Change validation rules |
| `setProps` | Update arbitrary field props |

## Wizard Mode

```typescript
const schema: FormSchema = {
  steps: [
    { id: 'step1', title: 'Personal', fieldNames: ['name', 'email'] },
    { id: 'step2', title: 'Details', fieldNames: ['bio', 'avatar'] },
    { id: 'step3', title: 'Confirm', fieldNames: ['agreement'] },
  ],
  fields: [
    // All fields from all steps listed here
  ],
};
```

Steps support conditional visibility:

```typescript
{
  id: 'employment',
  title: 'Employment',
  fieldNames: ['company', 'title'],
  when: { field: 'status', not: 'unemployed' },  // Skip this step
}
```

## Layout

### Multi-Column Grid

```typescript
{ layout: { columns: 2 } }  // 2-column grid

// Individual fields can span multiple columns
{ name: 'description', type: 'textarea', colSpan: 2 }
```

### Sections

```typescript
fields: [
  { name: 'name', type: 'text', section: 'Personal Info' },
  { name: 'email', type: 'email', section: 'Personal Info' },
  { name: 'company', type: 'text', section: 'Work Info' },
]
```

## Custom Field Components

Replace any or all built-in field components:

```tsx
// With Ant Design
import { Input } from 'antd';

const AntTextInput = ({ field, definition }) => (
  <Form.Item label={definition.label} validateStatus={field.error ? 'error' : ''} help={field.error}>
    <Input value={field.value} onChange={e => field.onChange(e.target.value)} />
  </Form.Item>
);

<DynamicForm
  schema={schema}
  fieldComponents={{
    text: AntTextInput,
    email: AntTextInput,
    // ... override any type
  }}
/>
```

## Middleware

Intercept every state change:

```tsx
<DynamicForm
  schema={schema}
  middleware={[
    // Format phone numbers
    (ctx, next) => {
      if (ctx.field === 'phone') {
        ctx.value = formatPhoneNumber(ctx.value);
      }
      next();
    },
    // Prevent invalid transitions
    (ctx, next) => {
      if (ctx.field === 'status' && ctx.value === 'closed' && !ctx.values.resolution) {
        ctx.reject();
        return;
      }
      next();
    },
  ]}
/>
```

## Engine API (Headless)

Use the engine directly without the DynamicForm component:

```tsx
import { useForm, useField, FormContext } from './react';

function MyCustomForm() {
  const { engine, state, handleSubmit } = useForm({ schema, onSubmit });

  // Full programmatic control
  engine.setValue('email', 'user@example.com');
  engine.validate();
  engine.addField({ name: 'newField', type: 'text' });
  engine.removeField('oldField');

  return (
    <FormContext.Provider value={{ engine, mode: 'edit', fieldComponents }}>
      {/* Build your own UI */}
    </FormContext.Provider>
  );
}
```

### Engine Methods

| Method | Description |
|--------|-------------|
| `getValue(name)` | Get a field's value |
| `setValue(name, value)` | Set a field's value (triggers effects) |
| `getState()` | Get full form state |
| `validate()` | Validate all fields |
| `validateField(name)` | Validate a single field |
| `submit()` | Validate + trigger onSubmit |
| `reset(values?)` | Reset form to initial state |
| `addField(field, options?)` | Add a field at runtime |
| `removeField(name)` | Remove a field at runtime |
| `appendRow(arrayName)` | Add row to field array |
| `removeRow(arrayName, index)` | Remove row from field array |
| `nextStep()` | Wizard: go to next step |
| `prevStep()` | Wizard: go to previous step |
| `subscribe(listener)` | Listen to all state changes |
| `subscribeField(name, listener)` | Listen to specific field changes |
| `use(middleware)` | Add middleware |
| `registerEffect(action, handler)` | Register custom effect action |
| `registerValidator(type, handler)` | Register custom validator type |
| `dispose()` | Clean up subscriptions and timers |

## Component Props

```typescript
interface DynamicFormProps {
  schema: FormSchema;                      // Required: form definition
  initialValues?: Values;                  // Pre-fill values
  mode?: 'edit' | 'readonly' | 'disabled'; // Form mode
  context?: Record<string, any>;           // Custom context (e.g., userRole)
  onSubmit?: (output: FormOutput) => void;
  onChange?: (values, changedField) => void;
  onValidate?: (errors) => void;

  // Extension
  fieldComponents?: Record<string, ComponentType>;  // Override field renderers
  fieldWrapper?: (fieldState, children, ctx) => ReactNode;
  schemaPreprocessor?: (schema) => FormSchema;
  middleware?: Middleware[];
  plugins?: FormPlugin[];

  // Layout
  layoutComponent?: ComponentType;         // Custom layout component
  className?: string;
  style?: CSSProperties;

  // Autosave
  autosave?: { storage: 'localStorage' | 'sessionStorage'; key: string; interval?: number };

  // Ref
  engineRef?: MutableRefObject<FormEngineAPI | null>;
}
```

## Output Format

```typescript
onSubmit((output: FormOutput) => {
  output.values;   // Clean values (hidden fields excluded, typed correctly)
  output.meta;     // { valid, touched, dirty, errors, hiddenFields }
});
```
