import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DrupalForm } from './DrupalForm';

document.querySelectorAll<HTMLElement>('[data-react-form]').forEach((container) => {
  const formId = container.dataset.formId ?? '';
  const baseUrl = container.dataset.baseUrl ?? '';

  if (!formId) {
    console.warn('[drupal-react-form] Element missing data-form-id attribute', container);
    return;
  }

  createRoot(container).render(
    <StrictMode>
      <DrupalForm formId={formId} baseUrl={baseUrl} />
    </StrictMode>,
  );
});
