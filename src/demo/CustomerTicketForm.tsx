import React from 'react';
import { DynamicForm } from '../DynamicForm';
import type { FormSchema } from '../types';

const SUB_CATEGORIES: Record<string, { label: string; value: string }[]> = {
  billing: [
    { label: 'Refund Request', value: 'refund' },
    { label: 'Charge Error', value: 'charge_error' },
    { label: 'Invoice Issue', value: 'invoice' },
  ],
  technical: [
    { label: 'Bug Report', value: 'bug' },
    { label: 'Feature Request', value: 'feature' },
    { label: 'Performance Issue', value: 'performance' },
  ],
  account: [
    { label: 'Login Problem', value: 'login' },
    { label: 'Password Reset', value: 'password' },
    { label: 'Delete Account', value: 'delete' },
  ],
};

const ticketSchema: FormSchema = {
  layout: { columns: 2, labelPosition: 'top' },
  fields: [
    // --- Cascading selects ---
    {
      name: 'category',
      type: 'select',
      label: 'Issue Category',
      required: true,
      options: [
        { label: 'Billing', value: 'billing' },
        { label: 'Technical', value: 'technical' },
        { label: 'Account', value: 'account' },
      ],
    },
    {
      name: 'subCategory',
      type: 'select',
      label: 'Sub Category',
      required: true,
      options: [],
      effects: [
        {
          watch: 'category',
          action: 'setOptions',
          compute: (category: string) => SUB_CATEGORIES[category] ?? [],
        },
        {
          watch: 'category',
          action: 'setValue',
          compute: () => undefined, // Clear on parent change
        },
      ],
    },

    // --- Auto-set priority based on customer type ---
    {
      name: 'customerType',
      type: 'select',
      label: 'Customer Type',
      required: true,
      options: [
        { label: 'Regular', value: 'regular' },
        { label: 'Premium', value: 'premium' },
        { label: 'VIP', value: 'vip' },
      ],
    },
    {
      name: 'priority',
      type: 'select',
      label: 'Priority',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Normal', value: 'normal' },
        { label: 'High', value: 'high' },
        { label: 'Urgent', value: 'urgent' },
      ],
      effects: [
        {
          watch: 'customerType',
          action: 'setValue',
          compute: (type: string) => {
            if (type === 'vip') return 'urgent';
            if (type === 'premium') return 'high';
            return 'normal';
          },
        },
      ],
    },

    // --- Conditional field: refund amount ---
    {
      name: 'amount',
      type: 'number',
      label: 'Refund Amount ($)',
      placeholder: '0.00',
      when: { field: 'subCategory', value: 'refund' },
      rules: [
        { type: 'required' },
        { type: 'min', value: 0.01, message: 'Amount must be positive' },
        { type: 'max', value: 10000, message: 'Amount cannot exceed $10,000' },
      ],
    },

    // --- Dynamic validation: attachment required when amount > 100 ---
    {
      name: 'attachment',
      type: 'upload',
      label: 'Attachment',
      description: 'Required for refund amounts over $100',
      when: { field: 'subCategory', value: 'refund' },
      effects: [
        {
          watch: 'amount',
          action: 'setRules',
          compute: (amount: number) =>
            amount > 100
              ? [{ type: 'required', message: 'Attachment required for amounts over $100' }]
              : [],
        },
      ],
    },

    // --- Contact method with conditional fields ---
    {
      name: 'contactMethod',
      type: 'radio',
      label: 'Preferred Contact Method',
      colSpan: 2,
      required: true,
      options: [
        { label: 'Email', value: 'email' },
        { label: 'Phone', value: 'phone' },
      ],
      props: { direction: 'horizontal' },
    },
    {
      name: 'contactEmail',
      type: 'email',
      label: 'Contact Email',
      required: true,
      when: { field: 'contactMethod', value: 'email' },
      rules: [{ type: 'email' }],
    },
    {
      name: 'contactPhone',
      type: 'phone',
      label: 'Contact Phone',
      required: true,
      when: { field: 'contactMethod', value: 'phone' },
      rules: [{ type: 'phone' }],
    },

    // --- Description ---
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      placeholder: 'Describe your issue in detail...',
      required: true,
      colSpan: 2,
      rules: [
        { type: 'minLength', value: 20, message: 'Please provide at least 20 characters' },
      ],
    },

    // --- Auto-escalate for VIP ---
    {
      name: 'escalate',
      type: 'switch',
      label: 'Escalation',
      props: { switchLabel: 'Auto-escalate to manager' },
      colSpan: 2,
      effects: [
        {
          watch: 'customerType',
          action: 'setValue',
          compute: (type: string) => type === 'vip',
        },
        {
          watch: 'customerType',
          action: 'setDisabled',
          compute: (type: string) => type === 'vip', // VIP always escalated
        },
      ],
    },
  ],
};

export const CustomerTicketForm: React.FC = () => {
  return (
    <div>
      <h2>Demo 2: Customer Service Ticket</h2>
      <p style={{ color: '#6b7280', marginBottom: 16 }}>
        Cascading dependencies, conditional fields, dynamic validation, auto-fill, computed state.
      </p>
      <DynamicForm
        schema={ticketSchema}
        onSubmit={(output) => {
          alert('Ticket submitted!\n\n' + JSON.stringify(output.values, null, 2));
        }}
      />
    </div>
  );
};
