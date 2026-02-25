import React from 'react';
import { DynamicForm } from '../DynamicForm';
import type { FormSchema } from '../types';

const onboardingSchema: FormSchema = {
  layout: { columns: 2 },
  steps: [
    {
      id: 'personal',
      title: 'Personal Info',
      fieldNames: ['firstName', 'lastName', 'email', 'phone', 'birthDate'],
    },
    {
      id: 'employment',
      title: 'Employment',
      fieldNames: ['employmentStatus', 'company', 'jobTitle', 'salary', 'startDate'],
    },
    {
      id: 'preferences',
      title: 'Preferences',
      fieldNames: ['interests', 'theme', 'notifications', 'bio'],
    },
    {
      id: 'review',
      title: 'Review',
      fieldNames: ['agreement', 'marketingConsent'],
    },
  ],
  fields: [
    // --- Step 1: Personal Info ---
    {
      name: 'firstName',
      type: 'text',
      label: 'First Name',
      required: true,
      placeholder: 'John',
    },
    {
      name: 'lastName',
      type: 'text',
      label: 'Last Name',
      required: true,
      placeholder: 'Doe',
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email Address',
      required: true,
      placeholder: 'john@example.com',
      rules: [{ type: 'email' }],
    },
    {
      name: 'phone',
      type: 'phone',
      label: 'Phone Number',
      placeholder: '+1 (555) 000-0000',
      rules: [{ type: 'phone' }],
    },
    {
      name: 'birthDate',
      type: 'date',
      label: 'Date of Birth',
    },

    // --- Step 2: Employment ---
    {
      name: 'employmentStatus',
      type: 'select',
      label: 'Employment Status',
      required: true,
      colSpan: 2,
      options: [
        { label: 'Employed', value: 'employed' },
        { label: 'Self-employed', value: 'self_employed' },
        { label: 'Student', value: 'student' },
        { label: 'Retired', value: 'retired' },
        { label: 'Unemployed', value: 'unemployed' },
      ],
    },
    {
      name: 'company',
      type: 'text',
      label: 'Company',
      placeholder: 'Company name',
      when: {
        or: [
          { field: 'employmentStatus', value: 'employed' },
          { field: 'employmentStatus', value: 'self_employed' },
        ],
      },
    },
    {
      name: 'jobTitle',
      type: 'text',
      label: 'Job Title',
      placeholder: 'Your role',
      when: {
        or: [
          { field: 'employmentStatus', value: 'employed' },
          { field: 'employmentStatus', value: 'self_employed' },
        ],
      },
    },
    {
      name: 'salary',
      type: 'slider',
      label: 'Annual Salary Range ($K)',
      colSpan: 2,
      when: { field: 'employmentStatus', not: 'unemployed' },
      props: { min: 0, max: 300, step: 10 },
    },
    {
      name: 'startDate',
      type: 'date',
      label: 'Start Date',
      when: {
        or: [
          { field: 'employmentStatus', value: 'employed' },
          { field: 'employmentStatus', value: 'self_employed' },
        ],
      },
    },

    // --- Step 3: Preferences ---
    {
      name: 'interests',
      type: 'checkboxGroup',
      label: 'Interests',
      colSpan: 2,
      options: [
        { label: 'Technology', value: 'tech' },
        { label: 'Design', value: 'design' },
        { label: 'Business', value: 'business' },
        { label: 'Science', value: 'science' },
        { label: 'Arts', value: 'arts' },
        { label: 'Sports', value: 'sports' },
      ],
      props: { direction: 'horizontal' },
    },
    {
      name: 'theme',
      type: 'colorPicker',
      label: 'Preferred Theme Color',
      defaultValue: '#3b82f6',
    },
    {
      name: 'notifications',
      type: 'switch',
      label: 'Notifications',
      props: { switchLabel: 'Enable email notifications' },
      defaultValue: true,
    },
    {
      name: 'bio',
      type: 'textarea',
      label: 'Short Bio',
      placeholder: 'Tell us about yourself...',
      colSpan: 2,
      rules: [{ type: 'maxLength', value: 500, message: 'Bio must be 500 characters or less' }],
    },

    // --- Step 4: Review ---
    {
      name: 'agreement',
      type: 'checkbox',
      label: '',
      colSpan: 2,
      required: true,
      props: { checkboxLabel: 'I agree to the Terms of Service and Privacy Policy' },
    },
    {
      name: 'marketingConsent',
      type: 'checkbox',
      label: '',
      colSpan: 2,
      props: { checkboxLabel: 'I would like to receive marketing emails (optional)' },
    },
  ],
};

export const WizardForm: React.FC = () => {
  return (
    <div>
      <h2>Demo 4: Multi-Step Onboarding Wizard</h2>
      <p style={{ color: '#6b7280', marginBottom: 16 }}>
        Wizard layout, step validation, conditional steps, all field types showcase.
      </p>
      <DynamicForm
        schema={onboardingSchema}
        onSubmit={(output) => {
          alert('Onboarding complete!\n\n' + JSON.stringify(output.values, null, 2));
        }}
      />
    </div>
  );
};
