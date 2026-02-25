import React from 'react';
import type { FormSchema, FieldDefinition } from '../types';
import { FieldRenderer } from '../react/FieldRenderer';

interface GridLayoutProps {
  schema: FormSchema;
  fields: FieldDefinition[];
}

/**
 * Renders fields in a CSS grid layout.
 * Respects schema.layout.columns for grid columns.
 */
export const GridLayout: React.FC<GridLayoutProps> = ({ schema, fields }) => {
  const columns = schema.layout?.columns ?? 1;

  // Group fields by section if sections are defined
  const sections = groupBySection(fields);

  if (sections.length <= 1) {
    // No sections, just a flat grid
    return (
      <div
        className="df-form__grid"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {fields.map((field) => (
          <FieldRenderer key={field.name} field={field} />
        ))}
      </div>
    );
  }

  // Render sections
  return (
    <div className="df-form">
      {sections.map((section) => (
        <div key={section.name} className="df-section">
          {section.name && (
            <div className="df-section__header">
              <h3 className="df-section__title">{section.name}</h3>
              {section.description && (
                <p className="df-section__description">{section.description}</p>
              )}
            </div>
          )}
          <div
            className="df-section__fields"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {section.fields.map((field) => (
              <FieldRenderer key={field.name} field={field} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

interface Section {
  name: string;
  description?: string;
  fields: FieldDefinition[];
}

function groupBySection(fields: FieldDefinition[]): Section[] {
  const sections: Section[] = [];
  let currentSection: Section = { name: '', fields: [] };

  for (const field of fields) {
    if (field.section && field.section !== currentSection.name) {
      if (currentSection.fields.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { name: field.section, fields: [field] };
    } else {
      currentSection.fields.push(field);
    }
  }

  if (currentSection.fields.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}
