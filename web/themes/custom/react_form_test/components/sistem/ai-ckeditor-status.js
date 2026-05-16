/**
 * Controla el estado visual del logo y el botón Generate del AI CKEditor dialog.
 *
 * Señal usada: editor.isReadOnly (CKEditor5 Observable)
 *   → AiWriter hace enableReadOnlyMode('ai_ckeditor') al arrancar
 *   → AiWriter hace disableReadOnlyMode('ai_ckeditor') al terminar
 * Eso es un signal limpio y sin dependencias de texto/DOM.
 */
((Drupal) => {

  const original = Drupal.AjaxCommands.prototype.aiRequest;

  if (typeof original === 'function' && !original._wfwPatched) {

    function patchedAiRequest(ajax, parameters) {
      const dialog = document.querySelector('.ai-ckeditor-dialog');
      if (dialog) setLoading(dialog, true);

      original.call(this, ajax, parameters);

      // Un frame después el editor ya tiene isReadOnly=true
      requestAnimationFrame(() => {
        const textarea = document.querySelector(
          '#ai-ckeditor-response textarea[data-ckeditor5-id]'
        );
        const editorId = textarea?.getAttribute('data-ckeditor5-id');
        const editor = editorId ? Drupal.CKEditor5Instances?.get(editorId) : null;

        if (editor) {
          const stop = (evt, name, isReadOnly) => {
            if (!isReadOnly) {
              editor.off('change:isReadOnly', stop);
              if (dialog) setLoading(dialog, false);
            }
          };
          editor.on('change:isReadOnly', stop);
        } else {
          // Fallback si no hay editor disponible
          if (dialog) setTimeout(() => setLoading(dialog, false), 15_000);
        }
      });
    }

    patchedAiRequest._wfwPatched = true;
    Drupal.AjaxCommands.prototype.aiRequest = patchedAiRequest;
  }

  function setLoading(dialog, loading) {
    dialog.querySelector('.ia-logo')
      ?.classList.toggle('ia-thinking', loading);

    const actions = dialog.querySelector('.ai-ckeditor-generate-actions');
    actions?.classList.toggle('is-loading', loading);

    const btn = actions?.querySelector('input[type="submit"], button');
    if (btn) {
      if (loading) btn.setAttribute('disabled', 'disabled');
      else btn.removeAttribute('disabled');
    }
  }

})(Drupal);
