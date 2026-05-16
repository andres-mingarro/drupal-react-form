import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DrupalForm } from './DrupalForm';
import { UserEditForm } from './features/UserEditForm';
import type { DrupalFormDefinition } from './types/drupal-form';

document.querySelectorAll<HTMLElement>('[data-react-form]').forEach((container) => {
  const formId  = container.dataset.formId ?? '';
  const baseUrl = container.dataset.baseUrl ?? '';

  if (!formId) {
    console.warn('[drupal-react-form] Element missing data-form-id attribute', container);
    return;
  }

  // user:42  →  /api/react-form/user/42
  // Drupal.my_module.Form.MyForm  →  /api/react-form/Drupal.my_module.Form.MyForm
  // (el PHP convierte los puntos a backslashes para el class name)
  const userMatch  = formId.match(/^user:(\d+)$/);
  const apiPath    = userMatch
    ? `/api/react-form/user/${userMatch[1]}`
    : `/api/react-form/${formId}`;

  const submitPath = userMatch
    ? `/api/react-form/user/${userMatch[1]}/submit`
    : `/api/react-form/${formId}/submit`;

  const rawDefinition = container.dataset.formDefinition ?? null;
  let inlineDefinition: DrupalFormDefinition | null = null;
  if (rawDefinition) {
    try {
      inlineDefinition = JSON.parse(rawDefinition) as DrupalFormDefinition;
    } catch {
      console.warn('[drupal-react-form] Invalid data-form-definition JSON', container);
    }
  }

  if (userMatch) {
    createRoot(container).render(
      <StrictMode>
        <UserEditForm
          uid={parseInt(userMatch[1], 10)}
          baseUrl={baseUrl}
          inlineDefinition={inlineDefinition}
        />
      </StrictMode>,
    );
  } else {
    createRoot(container).render(
      <StrictMode>
        <DrupalForm
          formId={formId}
          baseUrl={baseUrl}
          apiPath={apiPath}
          submitPath={submitPath}
          inlineDefinition={inlineDefinition}
        />
      </StrictMode>,
    );
  }
});
