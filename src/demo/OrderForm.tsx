import React from 'react';
import { DynamicForm } from '../DynamicForm';
import type { FormSchema } from '../types';

const orderSchema: FormSchema = {
  layout: { columns: 2 },
  fields: [
    // --- Customer info section ---
    {
      name: 'customerName',
      type: 'text',
      label: 'Customer Name',
      required: true,
      section: 'Customer Information',
    },
    {
      name: 'customerEmail',
      type: 'email',
      label: 'Email',
      required: true,
      section: 'Customer Information',
      rules: [{ type: 'email' }],
    },

    // --- Shipping address (field group) ---
    {
      name: 'shipping',
      type: 'fieldGroup',
      label: 'Shipping Address',
      colSpan: 2,
      section: 'Addresses',
      props: { columns: 2 },
      fields: [
        { name: 'street', type: 'text', label: 'Street', required: true },
        { name: 'city', type: 'text', label: 'City', required: true },
        { name: 'state', type: 'text', label: 'State', required: true },
        { name: 'zip', type: 'text', label: 'ZIP Code', required: true, rules: [{ type: 'pattern', value: '^\\d{5}(-\\d{4})?$', message: 'Invalid ZIP code' }] },
      ],
    },

    // --- Same as shipping checkbox ---
    {
      name: 'sameAsShipping',
      type: 'checkbox',
      label: '',
      section: 'Addresses',
      colSpan: 2,
      props: { checkboxLabel: 'Billing address same as shipping' },
      defaultValue: true,
    },

    // --- Billing address (conditional) ---
    {
      name: 'billing',
      type: 'fieldGroup',
      label: 'Billing Address',
      colSpan: 2,
      section: 'Addresses',
      when: { field: 'sameAsShipping', not: true },
      props: { columns: 2 },
      fields: [
        { name: 'street', type: 'text', label: 'Street', required: true },
        { name: 'city', type: 'text', label: 'City', required: true },
        { name: 'state', type: 'text', label: 'State', required: true },
        { name: 'zip', type: 'text', label: 'ZIP Code', required: true },
      ],
    },

    // --- Order items (field array) ---
    {
      name: 'items',
      type: 'fieldArray',
      label: 'Order Items',
      colSpan: 2,
      section: 'Order Details',
      minRows: 1,
      maxRows: 10,
      props: { addLabel: 'Item' },
      fields: [
        {
          name: 'product',
          type: 'select',
          label: 'Product',
          required: true,
          options: [
            { label: 'Widget A', value: 'widget_a' },
            { label: 'Widget B', value: 'widget_b' },
            { label: 'Gadget X', value: 'gadget_x' },
            { label: 'Gadget Y', value: 'gadget_y' },
          ],
        },
        {
          name: 'quantity',
          type: 'number',
          label: 'Qty',
          required: true,
          defaultValue: 1,
          rules: [{ type: 'min', value: 1 }],
          props: { min: 1 },
        },
        {
          name: 'price',
          type: 'number',
          label: 'Unit Price ($)',
          required: true,
          rules: [{ type: 'min', value: 0 }],
          props: { min: 0, step: 0.01 },
        },
      ],
    },

    // --- Payment ---
    {
      name: 'paymentMethod',
      type: 'radio',
      label: 'Payment Method',
      section: 'Payment',
      required: true,
      options: [
        { label: 'Credit Card', value: 'credit' },
        { label: 'PayPal', value: 'paypal' },
        { label: 'Bank Transfer', value: 'bank' },
      ],
      props: { direction: 'horizontal' },
      colSpan: 2,
    },

    // --- Notes ---
    {
      name: 'notes',
      type: 'textarea',
      label: 'Order Notes',
      placeholder: 'Any special instructions...',
      section: 'Payment',
      colSpan: 2,
    },

    // --- Rating ---
    {
      name: 'satisfaction',
      type: 'rate',
      label: 'How did you find our store?',
      section: 'Payment',
    },

    // --- Priority shipping toggle ---
    {
      name: 'priorityShipping',
      type: 'switch',
      label: 'Priority Shipping',
      section: 'Payment',
      props: { switchLabel: 'Express delivery (+$9.99)' },
    },
  ],
};

export const OrderForm: React.FC = () => {
  return (
    <div>
      <h2>Demo 3: E-Commerce Order</h2>
      <p style={{ color: '#6b7280', marginBottom: 16 }}>
        Field arrays (line items), field groups (nested addresses), sections, conditional billing, all field types.
      </p>
      <DynamicForm
        schema={orderSchema}
        initialValues={{
          sameAsShipping: true,
          items: [{ product: '', quantity: 1, price: 0 }],
        }}
        onSubmit={(output) => {
          alert('Order submitted!\n\n' + JSON.stringify(output.values, null, 2));
        }}
      />
    </div>
  );
};
