import { type ComponentType, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DrupalForm } from './DrupalForm';
import { UserEditForm } from './features/UserEditForm';
import { NombreDelProyectoForm } from './features/NombreDelProyectoForm';
import type { DrupalFormDefinition } from './types/drupal-form';

// Registry opcional: forms dinámicos con componente dedicado para control total del markup.
// Si el form NO está aquí, igual funciona automáticamente con DrupalForm genérico.
const DYNAMIC_REGISTRY: Record<string, ComponentType<{ baseUrl?: string }>> = {
  nombre_del_proyecto: NombreDelProyectoForm,
};

document.querySelectorAll<HTMLElement>('[data-react-form]').forEach((container) => {
  const formId  = container.dataset.formId ?? '';
  const baseUrl = container.dataset.baseUrl ?? '';

  if (!formId) {
    console.warn('[drupal-react-form] Element missing data-form-id attribute', container);
    return;
  }

  const rawDefinition = container.dataset.formDefinition ?? null;
  let inlineDefinition: DrupalFormDefinition | null = null;
  if (rawDefinition) {
    try {
      inlineDefinition = JSON.parse(rawDefinition) as DrupalFormDefinition;
    } catch {
      console.warn('[drupal-react-form] Invalid data-form-definition JSON', container);
    }
  }

  // user:42 → UserEditForm
  const userMatch = formId.match(/^user:(\d+)$/);
  if (userMatch) {
    createRoot(container).render(
      <StrictMode>
        <UserEditForm uid={parseInt(userMatch[1], 10)} baseUrl={baseUrl} inlineDefinition={inlineDefinition} />
      </StrictMode>,
    );
    return;
  }

  // dynamic:form_id → componente dedicado si existe en registry,
  // de lo contrario DrupalForm genérico apuntando a la API dinámica.
  const dynamicMatch = formId.match(/^dynamic:(.+)$/);
  if (dynamicMatch) {
    const dynamicId = dynamicMatch[1];
    const DynamicComponent = DYNAMIC_REGISTRY[dynamicId];

    if (DynamicComponent) {
      createRoot(container).render(
        <StrictMode><DynamicComponent baseUrl={baseUrl} /></StrictMode>,
      );
      return;
    }

    // Sin componente dedicado: renderizado automático
    createRoot(container).render(
      <StrictMode>
        <DrupalForm
          formId={dynamicId}
          baseUrl={baseUrl}
          apiPath={`/api/react-form/dynamic/${dynamicId}`}
          submitPath={`/api/react-form/dynamic/${dynamicId}/submit`}
          inlineDefinition={inlineDefinition}
        />
      </StrictMode>,
    );
    return;
  }

  // Drupal Form API class: Drupal.mi_modulo.Form.MiForm → fetch genérico
  createRoot(container).render(
    <StrictMode>
      <DrupalForm
        formId={formId}
        baseUrl={baseUrl}
        apiPath={`/api/react-form/${formId}`}
        submitPath={`/api/react-form/${formId}/submit`}
        inlineDefinition={inlineDefinition}
      />
    </StrictMode>,
  );
});
