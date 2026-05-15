import { Suspense } from 'react';
import { ELEMENT_TYPE_MAP } from '../../engine/elementTypeMap';
import { evaluateStates } from '../../engine/statesEngine';
import type { DrupalElement, DrupalFormDefinition, FormValues } from '../../types/drupal-form';

interface ChildRendererProps {
  children: DrupalFormDefinition;
  formValues: FormValues;
  onChange: (name: string, value: unknown) => void;
  errors?: Record<string, string>;
}

function FallbackChild({ element }: { element: DrupalElement }) {
  console.warn(`[drupal-react-form] Unknown child type: "${element.type}"`);
  return null;
}

export function ChildRenderer({ children, formValues, onChange, errors = {} }: ChildRendererProps) {
  return (
    <>
      {Object.entries(children).map(([childName, childElement]) => {
        const states = evaluateStates(childElement.states, formValues);
        if (childElement.access === false || !states.visible) return null;

        const Component = ELEMENT_TYPE_MAP[childElement.type];
        const fieldProps = {
          name: childName,
          element: {
            ...childElement,
            required: childElement.required || states.required,
            disabled: childElement.disabled || states.disabled,
          },
          formValues,
          onChange: (v: unknown) => onChange(childName, v),
          error: errors[childName],
        };

        return (
          <Suspense key={childName} fallback={<div className="drf-loading" />}>
            {Component ? <Component {...fieldProps} /> : <FallbackChild element={childElement} />}
          </Suspense>
        );
      })}
    </>
  );
}
