# schema-driven-form — Architecture Design Document

## Overview

schema-driven-form is a universal, schema-driven, plugin-based dynamic form engine for React. It takes a JSON schema as input and renders a fully functional form with validation, field dependencies, conditional logic, and extensible architecture.

**Core Principle:** Schema in, data out. Everything in between is pluggable.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       schema-driven-form                         │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────────────┐ │
│  │  Schema       │    │   Engine     │    │   Renderer          │ │
│  │  Layer        │    │   (Core)     │    │                    │ │
│  │              │    │              │    │ Field Registry      │ │
│  │  Types       │    │ StateStore   │    │  ├ 20+ built-in    │ │
│  │  Parser      │    │ DepGraph     │    │  └ user-registered │ │
│  │  Normalizer  │    │ Validator    │    │                    │ │
│  │              │    │ Effects      │    │ Layout Registry     │ │
│  │     ▲        │    │ Middleware   │    │  ├ Grid            │ │
│  │     │        │    │              │    │  ├ Wizard          │ │
│  │  plugins     │    │     ▲        │    │  └ user-registered │ │
│  └──────────────┘    │  middleware  │    └────────────────────┘ │
│                      └──────────────┘                           │
│                                                                  │
│  7 Extension Points:                                             │
│  ① Field Plugin    — registerField(type, component)              │
│  ② Middleware      — engine.use(middleware)                       │
│  ③ Layout Plugin   — custom layout components                    │
│  ④ Validator Plugin — registerValidator(type, handler)           │
│  ⑤ Effect Action   — registerEffect(action, handler)            │
│  ⑥ Field Wrapper   — fieldWrapper prop                          │
│  ⑦ Schema Preprocessor — transform schema before engine sees it │
└──────────────────────────────────────────────────────────────────┘
```

---

## Package Structure

```
src/
├── types/              # Complete TypeScript type system
│   └── index.ts        # FormSchema, FieldDefinition, ValidationRule, etc.
│
├── core/               # Pure logic engine — zero React, zero DOM
│   ├── FormEngine.ts   # Main engine: state, effects, validation, middleware
│   ├── DependencyGraph.ts  # DAG for field dependencies + topological sort
│   └── ValidationRunner.ts # Sync + async validation pipeline
│
├── react/              # React bindings — thin wrapper over core
│   ├── FormContext.tsx  # React Context for engine distribution
│   ├── useForm.ts      # Hook: creates + manages engine lifecycle
│   ├── useField.ts     # Hook: connects any component to a form field
│   ├── useFieldArray.ts # Hook: dynamic array management
│   └── FieldRenderer.tsx # Maps field type → registered component
│
├── fields/             # Default field components (all replaceable)
│   ├── fields.css      # Minimal default styles
│   ├── FieldWrapper.tsx # Shared wrapper: label, error, description
│   ├── TextInput.tsx   # text, email, url, phone, password
│   ├── NumberInput.tsx  # number with type coercion
│   ├── TextareaInput.tsx
│   ├── SelectInput.tsx
│   ├── MultiSelectInput.tsx  # tag-based multi-select with dropdown
│   ├── RadioInput.tsx
│   ├── CheckboxInput.tsx     # single checkbox + checkbox group
│   ├── SwitchInput.tsx       # toggle switch
│   ├── DateInput.tsx         # date, time, datetime
│   ├── SliderInput.tsx       # range slider with value display
│   ├── RateInput.tsx         # star rating
│   ├── UploadInput.tsx       # drag & drop file upload
│   ├── ColorPickerInput.tsx
│   ├── CascaderInput.tsx     # multi-level linked selects
│   ├── FieldArrayInput.tsx   # dynamic repeatable rows
│   └── FieldGroupInput.tsx   # nested object groups
│
├── layout/             # Layout strategies
│   ├── GridLayout.tsx  # CSS Grid with sections
│   └── WizardLayout.tsx # Multi-step wizard with step indicator
│
├── utils/              # Pure utility functions
│   ├── path.ts         # Deep get/set/delete by dot-path
│   └── when.ts         # WhenCondition evaluator
│
├── DynamicForm.tsx     # Main component — all-in-one entry point
├── index.ts            # Public API exports
│
└── demo/               # Example forms
    ├── LoginForm.tsx
    ├── CustomerTicketForm.tsx
    ├── OrderForm.tsx
    └── WizardForm.tsx
```

---

## Core Engine Design

### StateStore

The engine maintains a single immutable state object:

```typescript
interface FormState {
  values: Values;           // Field values (supports nested paths)
  errors: Errors;           // Validation error messages
  touched: TouchedMap;      // Which fields have been interacted with
  visible: VisibleMap;      // Field visibility (computed from `when` + effects)
  disabled: DisabledMap;    // Field disabled state
  options: OptionsMap;      // Dynamic options for select/radio/checkbox
  rules: RulesMap;          // Dynamic validation rules
  fieldProps: PropsMap;     // Dynamic field props
  submitting: boolean;
  submitCount: number;
  valid: boolean;
  dirty: boolean;
  currentStep: number;      // Wizard step index
}
```

State updates are immutable. Every mutation creates a new state reference, enabling efficient React reconciliation via `useSyncExternalStore`.

### DependencyGraph (DAG)

The dependency graph is a Directed Acyclic Graph built from the schema at initialization time.

**Purpose:** When field A changes, determine which fields (B, C, D...) need to be updated, and in what order.

**Construction:**
1. Parse `effects[].watch` to find `A → B` edges
2. Parse `when` conditions to find visibility dependencies
3. Store edges bidirectionally (dependents + dependencies)

**Execution:**
1. Field A changes → `getAffectedFields('A')` traverses the graph
2. Returns affected fields in **topological order** (B before C if C depends on B)
3. Effects are executed in order, ensuring cascade correctness

**Cycle Detection:**
- DFS at construction time
- Throws descriptive error: `"Circular dependency detected: A → B → C → A"`

### ValidationRunner

Two-phase validation:

1. **Sync phase** — runs immediately on field change/blur
   - Built-in rules: required, min, max, minLength, maxLength, pattern, email, url, phone
   - Custom sync validators: `(value, formValues) => error | undefined`
   - Extension validators: registered via `registerValidator(type, handler)`

2. **Async phase** — debounced, runs after sync passes
   - Async validators: `(value, formValues) => Promise<error | undefined>`
   - Configurable debounce per field
   - Cancels pending validation when field changes again

3. **Form-level validation** — runs on submit
   - Cross-field validation rules
   - `(allValues) => { fieldName: error } | undefined`

### Effects System

Effects are the core mechanism for field interactions:

```typescript
interface Effect {
  watch: string | string[];     // Field(s) to observe
  action: string;               // What to do
  compute: (...values) => any;  // Pure function
}
```

**Built-in actions (6):**

| Action | What it does |
|--------|-------------|
| `setValue` | Sets the target field's value |
| `setOptions` | Updates select/radio options |
| `setVisible` | Shows/hides the field |
| `setDisabled` | Enables/disables the field |
| `setRules` | Changes validation rules dynamically |
| `setProps` | Updates arbitrary field props |

**Custom actions:** Register via `engine.registerEffect(action, handler)` for any behavior not covered by built-ins.

### Middleware Pipeline

Every state mutation passes through a middleware chain:

```typescript
type Middleware = (context: MiddlewareContext, next: () => void) => void;

interface MiddlewareContext {
  field: string;
  value: any;
  prevValue: any;
  values: Values;
  action: 'setValue' | 'setTouched' | 'validate' | 'submit' | 'reset';
  reject: (reason?: string) => void;
  engine: FormEngineAPI;
}
```

Use cases:
- Value transformation (format phone numbers)
- Business rule enforcement (prevent invalid state transitions)
- Audit logging
- Side effects (API calls)
- Undo/redo implementation

---

## React Integration

### Rendering Strategy

```
DynamicForm
  └── FormContext.Provider (engine + config)
        └── Layout (Grid or Wizard)
              └── FieldRenderer (per field)
                    ├── useField(name) → FieldState
                    ├── Component lookup (fieldComponents registry)
                    └── FieldWrapper (label + error + description)
```

### Performance

- **useSyncExternalStore** — fields only re-render when their specific state changes
- **Field-level subscriptions** — `engine.subscribeField(name, listener)` for granular updates
- **React.memo** on FieldRenderer — prevents unnecessary re-renders
- **Immutable state** — reference equality checks for efficient bailouts

---

## Extension Points

### 1. Custom Field Components

```tsx
import { DynamicForm } from './DynamicForm';

const MyRichEditor = ({ field, definition, form }) => (
  <div>
    <label>{definition.label}</label>
    <RichTextEditor value={field.value} onChange={field.onChange} />
    {field.error && <span>{field.error}</span>}
  </div>
);

<DynamicForm
  schema={schema}
  fieldComponents={{ richText: MyRichEditor }}
/>
```

### 2. Middleware

```tsx
<DynamicForm
  schema={schema}
  middleware={[
    (ctx, next) => {
      console.log(`${ctx.field} changed to ${ctx.value}`);
      next();
    },
  ]}
/>
```

### 3. Custom Validators

```tsx
const engine = useForm({ schema });
engine.engine.registerValidator('idCard', (value, rule, values) => {
  if (!isValidIdCard(value)) return 'Invalid ID card number';
});
```

### 4. Custom Effects

```tsx
engine.engine.registerEffect('fetchAndSetOptions', async (fieldName, params, engine) => {
  const options = await fetchOptions(params);
  engine.setFieldOptions(fieldName, options);
});
```

### 5. Form Plugins

```tsx
const auditPlugin: FormPlugin = {
  name: 'audit',
  setup: (engine) => {
    engine.use((ctx, next) => {
      auditLog.track(ctx.field, ctx.value);
      next();
    });
    return () => { /* cleanup */ };
  },
};

<DynamicForm schema={schema} plugins={[auditPlugin]} />
```

---

## Data Flow

```
                    ┌──────────────────────┐
  FormSchema JSON ──│ Schema Preprocessor  │──▶ Normalized Schema
                    └──────────────────────┘
                              │
                              ▼
                    ┌──────────────────────┐
  initialValues ───▶│     FormEngine       │◀── middleware[]
                    │                      │
                    │  StateStore           │
                    │  DependencyGraph      │
                    │  ValidationRunner     │
                    │  EffectExecutor       │
                    └──────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
              Field Registry      Layout Strategy
                    │                   │
                    ▼                   ▼
              ┌──────────────────────────────┐
              │     Rendered Form UI         │
              │     (with fieldWrapper)      │
              └──────────────────────────────┘
                          │
                          ▼ onSubmit
              ┌──────────────────────────────┐
              │  { values, meta }            │  ← clean typed output
              └──────────────────────────────┘
```

---

## Supported Field Types (20+)

| Type | Component | Value Type |
|------|-----------|------------|
| `text` | TextInput | `string` |
| `email` | TextInput | `string` |
| `url` | TextInput | `string` |
| `phone` | TextInput | `string` |
| `password` | TextInput | `string` |
| `number` | NumberInput | `number` |
| `textarea` | TextareaInput | `string` |
| `select` | SelectInput | `any` |
| `multiSelect` | MultiSelectInput | `any[]` |
| `radio` | RadioInput | `any` |
| `checkbox` | CheckboxInput | `boolean` |
| `checkboxGroup` | CheckboxGroupInput | `any[]` |
| `switch` | SwitchInput | `boolean` |
| `date` | DateInput | `string` (ISO) |
| `time` | DateInput | `string` |
| `datetime` | DateInput | `string` (ISO) |
| `dateRange` | DateRangeInput | `[string, string]` |
| `slider` | SliderInput | `number` |
| `rate` | RateInput | `number` |
| `upload` | UploadInput | `FileInfo[]` |
| `colorPicker` | ColorPickerInput | `string` (hex) |
| `cascader` | CascaderInput | `any[]` |
| `fieldArray` | FieldArrayInput | `object[]` |
| `fieldGroup` | FieldGroupInput | `object` |
| `custom` | User-defined | `any` |

---

## Design Decisions

1. **Core engine has zero React dependency** — Can run in Node.js for server-side validation, or be adapted to other frameworks.

2. **Immutable state updates** — Enables efficient React rendering and time-travel debugging.

3. **DAG-based dependency resolution** — Guarantees correct execution order for cascading effects. Cycle detection at initialization prevents runtime infinite loops.

4. **Plugin architecture over monolith** — The engine ships with essentials; everything else is pluggable. This keeps bundle size small while supporting unlimited complexity.

5. **Default fields are replaceable, not locked-in** — Users of Ant Design, MUI, Chakra, or any UI library can swap all field components in one prop.

6. **Validation is two-phase** — Sync validation provides instant feedback; async validation (API calls) is debounced to avoid excessive requests.

7. **Hidden fields are excluded from output** — Clean data by default. No stale values from conditionally hidden fields.
