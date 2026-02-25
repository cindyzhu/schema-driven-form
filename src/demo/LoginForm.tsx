import React from 'react';
import { DynamicForm } from '../DynamicForm';
import type { FormSchema } from '../types';

const loginSchema: FormSchema = {
  layout: { columns: 1 },
  fields: [
    {
      name: 'email',
      type: 'email',
      label: 'Email',
      placeholder: 'you@example.com',
      required: true,
      rules: [{ type: 'email', message: 'Please enter a valid email' }],
    },
    {
      name: 'password',
      type: 'password',
      label: 'Password',
      placeholder: 'Enter your password',
      required: true,
      rules: [
        { type: 'minLength', value: 8, message: 'Password must be at least 8 characters' },
      ],
    },
    {
      name: 'remember',
      type: 'checkbox',
      label: '',
      props: { checkboxLabel: 'Remember me' },
    },
  ],
};

export const LoginForm: React.FC = () => {
  return (
    <div>
      <h2>Demo 1: Login Form</h2>
      <p style={{ color: '#6b7280', marginBottom: 16 }}>
        Basic fields, validation, submit handling.
      </p>
      <div style={{ maxWidth: 400 }}>
        <DynamicForm
          schema={loginSchema}
          onSubmit={(output) => {
            alert('Login submitted!\n\n' + JSON.stringify(output.values, null, 2));
          }}
        />
      </div>
    </div>
  );
};
