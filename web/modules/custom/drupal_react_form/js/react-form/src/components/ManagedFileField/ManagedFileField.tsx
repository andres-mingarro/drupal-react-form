import { useState } from 'react';
import { evaluateStates } from '../../engine/statesEngine';
import type { BaseFieldProps } from '../../types/drupal-form';
import './ManagedFileField.scss';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadResult { fid: number; url: string; name: string; }

export function ManagedFileField({ name, element, formValues, onChange, error }: BaseFieldProps) {
  const states = evaluateStates(element.states, formValues);
  if (element.access === false || !states.visible) return null;

  const attrs      = element.attributes ?? {};
  const uploadUrl  = attrs.upload_url as string | undefined;
  const currentUrl = attrs.current_url as string | undefined;
  const accept     = attrs.accept as string | undefined;

  const [file, setFile]         = useState<File | null>(null);
  const [uploaded, setUploaded] = useState<UploadResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const hasError  = Boolean(error);
  const isRequired = element.required || states.required;
  const isDisabled = element.disabled || states.disabled;

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setUploaded(null);
    setUploadError(null);

    if (!f || !uploadUrl) {
      onChange(f);
      return;
    }

    setUploading(true);
    try {
      const csrfToken = await fetch('/session/token').then(r => r.text()).catch(() => '');
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': f.type || 'application/octet-stream',
          'X-CSRF-Token': csrfToken,
          'X-Filename': f.name,
        },
        body: await f.arrayBuffer(),
      });

      const data = await res.json() as { success: boolean; fid?: number; url?: string; name?: string; error?: string };

      if (data.success && data.fid) {
        const result = { fid: data.fid, url: data.url ?? '', name: data.name ?? f.name };
        setUploaded(result);
        onChange({ fid: data.fid, url: data.url });
      } else {
        setUploadError(data.error ?? 'Error al subir el archivo');
        onChange(null);
      }
    } catch {
      setUploadError('Error de conexión al subir el archivo');
      onChange(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setUploaded(null);
    setUploadError(null);
    onChange(null);
  };

  const showCurrent = !file && currentUrl;
  const showPreview = file && (uploaded || !uploadUrl);

  return (
    <div className={`drf-field drf-field--managed-file${hasError ? ' drf-field--error' : ''}`}>
      {element.title && element.titleDisplay !== 'invisible' && (
        <label htmlFor={`drf-${name}`} className={`drf-field__label${isRequired ? ' drf-field__label--required' : ''}`}>
          {element.title}
        </label>
      )}
      {element.description && element.descriptionDisplay === 'before' && (
        <p className="drf-field__description drf-field__description--before">{element.description}</p>
      )}

      {showCurrent && (
        <div className="drf-field--managed-file__current">
          <img src={currentUrl} alt="Foto actual" className="drf-field--managed-file__img" />
          <span className="drf-field--managed-file__current-label">Foto actual</span>
        </div>
      )}

      {showPreview ? (
        <div className="drf-field--managed-file__preview">
          {uploaded?.url && (
            <img src={uploaded.url} alt="Nueva foto" className="drf-field--managed-file__img" />
          )}
          <div className="drf-field--managed-file__info">
            <span className="drf-field--managed-file__icon" aria-hidden="true">
              {uploaded?.url ? '🖼️' : '📄'}
            </span>
            <div>
              <p className="drf-field--managed-file__filename">{uploaded?.name ?? file?.name}</p>
              {file && <p className="drf-field--managed-file__size">{formatBytes(file.size)}</p>}
            </div>
          </div>
          <button type="button" className="drf-field--managed-file__remove" onClick={handleRemove}>
            ✕ Quitar
          </button>
        </div>
      ) : (
        <div className="drf-field--managed-file__upload-area">
          <input
            type="file"
            id={`drf-${name}`}
            name={name}
            disabled={isDisabled || uploading}
            required={isRequired && !currentUrl}
            multiple={element.multiple}
            accept={accept}
            className="drf-field--managed-file__input"
            onChange={handleChange}
            aria-describedby={element.description ? `drf-${name}-desc` : undefined}
            aria-invalid={hasError || undefined}
          />
          {uploading && <p className="drf-field--managed-file__uploading">Subiendo imagen...</p>}
        </div>
      )}

      {element.description && element.descriptionDisplay !== 'before' && (
        <p id={`drf-${name}-desc`} className="drf-field__description">{element.description}</p>
      )}
      {uploadError && <p className="drf-field__error" role="alert">{uploadError}</p>}
      {hasError && !uploadError && <p className="drf-field__error" role="alert">{error}</p>}
    </div>
  );
}
