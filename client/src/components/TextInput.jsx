import { useEffect, useLayoutEffect, useRef } from 'react';
import { COPY } from '../utils/uiCopy';
import { ICON_PATHS, ICON_STROKE_WIDTH } from '../utils/iconPaths';
import { cleanText } from '../utils/cleanText';
import { toSingleLine } from '../utils/singleLine';

// Single-line fields also turn line breaks and tabs into spaces.
const cleanSingleLine = (text) => toSingleLine(cleanText(text));

// Grows a field to fit its content. The height is border-box, so the borders are added to
// scrollHeight (content plus padding).
function fitHeight(field) {
  field.style.height = 'auto';
  const borders = field.offsetHeight - field.clientHeight;
  field.style.height = `${field.scrollHeight + borders}px`;
}

const FIELD =
  'block w-full min-h-12 resize-none overflow-hidden break-words rounded-md border px-4 py-3 text-text ' +
  'placeholder:text-text-muted read-only:cursor-default ' +
  'focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus';

/**
 * Labeled text field with help text, error message and character counter (catalog: TextInput).
 * Always a textarea so long text wraps and grows instead of scrolling out of view.
 * - `variant`: 'auto-grow' (single line, line breaks and tabs become spaces) or 'multiline'.
 *   Both remove control characters and lone surrogates, which the API rejects.
 * - `large`: question styling.
 * - `label`: omit when the caller renders its own <label htmlFor={id}> (option rows).
 * - `helpText`: shown between the label and the field.
 * - `onEnter`: single-line fields call it when Enter is pressed (Enter never adds a line break).
 */
export default function TextInput({
  id,
  label,
  helpText,
  value,
  onChange,
  maxLength,
  placeholder,
  variant = 'auto-grow',
  large = false,
  error = null,
  readOnly = false,
  autoComplete,
  enterKeyHint,
  onEnter,
  inputRef,
}) {
  const localRef = useRef(null);
  const multiline = variant === 'multiline';
  const clean = multiline ? cleanText : cleanSingleLine;
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  const counterId = `${id}-counter`;
  const atLimit = value.length >= maxLength;
  // Error first, then help text, then the counter.
  const describedBy = [error && errorId, helpText && helpId, counterId].filter(Boolean).join(' ');

  useLayoutEffect(() => {
    if (localRef.current) {
      fitHeight(localRef.current);
    }
  }, [value]);

  // Text wraps differently when the field gets narrower or wider (rotating a phone), so fit again.
  useEffect(() => {
    const field = localRef.current;
    if (!field || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    let width = field.clientWidth;
    const observer = new ResizeObserver(() => {
      if (field.clientWidth !== width) {
        width = field.clientWidth;
        fitHeight(field);
      }
    });
    observer.observe(field);
    return () => observer.disconnect();
  }, []);

  // Cleans typed or pasted text before the browser inserts it, so the caret stays right after it.
  // Cleaning only in handleChange makes React write back a different value, which moves the caret to
  // the end; handleChange still cleans anything that arrives another way.
  useEffect(() => {
    const field = localRef.current;
    if (!field) {
      return undefined;
    }
    const onBeforeInput = (event) => {
      const text = event.data ?? event.dataTransfer?.getData('text/plain') ?? '';
      if (!text || !event.inputType?.startsWith('insert')) {
        return;
      }
      const cleaned = clean(text);
      if (
        cleaned !== text &&
        typeof document.execCommand === 'function' &&
        document.execCommand('insertText', false, cleaned)
      ) {
        event.preventDefault();
      }
    };
    field.addEventListener('beforeinput', onBeforeInput);
    return () => field.removeEventListener('beforeinput', onBeforeInput);
  }, [clean]);

  function setRefs(node) {
    localRef.current = node;
    if (typeof inputRef === 'function') {
      inputRef(node);
    } else if (inputRef) {
      inputRef.current = node;
    }
  }

  function handleChange(event) {
    onChange(clean(event.target.value));
  }

  function handleKeyDown(event) {
    if (multiline || event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    // Enter that confirms an input method composition (e.g. Japanese, Chinese) is not a submit.
    if (onEnter && !event.nativeEvent.isComposing) {
      onEnter(event);
    }
  }

  const fieldState = error ? 'border-danger bg-danger-subtle' : 'border-border-strong bg-surface';
  const fieldSize = large ? 'text-xl font-medium leading-tight' : 'text-base leading-normal';

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="text-sm font-bold text-text">
          {label}
        </label>
      )}
      {helpText && (
        <p id={helpId} className="text-sm text-text-muted">
          {helpText}
        </p>
      )}
      <textarea
        id={id}
        ref={setRefs}
        rows={multiline ? 2 : 1}
        dir="auto"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        readOnly={readOnly}
        autoComplete={autoComplete}
        enterKeyHint={enterKeyHint}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={[FIELD, fieldState, fieldSize].join(' ')}
      />
      <div className="flex items-start gap-2">
        {error && (
          <p id={errorId} className="flex min-w-0 items-start gap-1 text-sm font-bold text-danger">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={ICON_STROKE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 shrink-0"
            >
              <path d={ICON_PATHS.alert} />
            </svg>
            <span>{error}</span>
          </p>
        )}
        <span
          id={counterId}
          className={`ml-auto shrink-0 text-sm tabular-nums ${atLimit ? 'font-bold text-text' : 'text-text-muted'}`}
        >
          {COPY.counter(value.length, maxLength)}
        </span>
      </div>
    </div>
  );
}
