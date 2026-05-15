import { useEffect, useRef, useState } from 'react';
import { evaluateStates } from '../../engine/statesEngine';
import type { BaseFieldProps } from '../../types/drupal-form';
import './EntityAutocomplete.scss';

interface Suggestion { id: string; label: string; }

export function EntityAutocomplete({ name, element, formValues, onChange, onBlur, error }: BaseFieldProps) {
  const states = evaluateStates(element.states, formValues);
  if (element.access === false || !states.visible) return null;

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasError = Boolean(error);
  const isRequired = element.required || states.required;
  const isDisabled = element.disabled || states.disabled;
  const targetType = element.attributes?.target_type as string ?? '';

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); setOpen(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/entity-autocomplete?q=${encodeURIComponent(query)}&target_type=${encodeURIComponent(targetType)}&_format=json`);
        const data: Suggestion[] = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch { setSuggestions([]); }
      finally { setLoading(false); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, targetType]);

  const select = (s: Suggestion) => {
    setQuery(s.label);
    onChange(s.id);
    setOpen(false);
  };

  return (
    <div className={`drf-field drf-field--entity-autocomplete${hasError ? ' drf-field--error' : ''}`}>
      {element.title && element.titleDisplay !== 'invisible' && (
        <label htmlFor={`drf-${name}`} className={`drf-field__label${isRequired ? ' drf-field__label--required' : ''}`}>
          {element.title}
        </label>
      )}
      <div className="drf-field--entity-autocomplete__wrapper">
        <input
          id={`drf-${name}`}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={`drf-${name}-list`}
          className={`drf-field__input${hasError ? ' drf-field__input--error' : ''}`}
          value={query}
          disabled={isDisabled}
          required={isRequired}
          placeholder={element.placeholder ?? 'Escribí para buscar...'}
          onChange={e => { setQuery(e.target.value); if (!e.target.value) onChange(null); }}
          onBlur={() => { setTimeout(() => setOpen(false), 200); onBlur?.(); }}
          aria-invalid={hasError || undefined}
        />
        {loading && <span className="drf-field--entity-autocomplete__spinner" aria-hidden="true" />}
        {open && (
          <ul id={`drf-${name}-list`} role="listbox" className="drf-field--entity-autocomplete__dropdown">
            {suggestions.map(s => (
              <li key={s.id} role="option" className="drf-field--entity-autocomplete__option"
                onMouseDown={() => select(s)}>
                {s.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      {element.description && <p className="drf-field__description">{element.description}</p>}
      {hasError && <p className="drf-field__error" role="alert">{error}</p>}
    </div>
  );
}
