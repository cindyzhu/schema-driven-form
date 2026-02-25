import { useState } from 'react';
import { LoginForm, CustomerTicketForm, OrderForm, WizardForm } from './demo';

const demos = [
  { id: 'login', label: '1. Login Form', component: LoginForm },
  { id: 'ticket', label: '2. Customer Ticket', component: CustomerTicketForm },
  { id: 'order', label: '3. E-Commerce Order', component: OrderForm },
  { id: 'wizard', label: '4. Wizard Onboarding', component: WizardForm },
];

function App() {
  const [activeDemo, setActiveDemo] = useState('login');
  const ActiveComponent = demos.find((d) => d.id === activeDemo)?.component ?? LoginForm;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>
          schema-driven-form
        </h1>
        <p style={{ color: '#6b7280', marginTop: 4 }}>
          A universal, schema-driven, plugin-based dynamic form engine for React.
        </p>
      </header>

      {/* Demo selector */}
      <nav style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
        {demos.map((demo) => (
          <button
            key={demo.id}
            onClick={() => setActiveDemo(demo.id)}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 500,
              border: '1px solid',
              borderColor: activeDemo === demo.id ? '#3b82f6' : '#d1d5db',
              background: activeDemo === demo.id ? '#eff6ff' : '#fff',
              color: activeDemo === demo.id ? '#3b82f6' : '#374151',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {demo.label}
          </button>
        ))}
      </nav>

      {/* Active demo */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
        <ActiveComponent />
      </div>

      {/* Footer */}
      <footer style={{ marginTop: 32, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
        schema-driven-form v1.0 — Schema in, data out. Everything in between is pluggable.
      </footer>
    </div>
  );
}

export default App;
