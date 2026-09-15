import TextInput from './TextInput';
import { COPY } from '../utils/uiCopy';
import { FIELD_ERROR } from '../utils/pollValidation';
import { POLL_LIMITS } from '../utils/pollRules';
import { ICON_PATHS, ICON_STROKE_WIDTH } from '../utils/iconPaths';

const ICON_BUTTON =
  'grid h-touch w-touch shrink-0 place-items-center rounded-full ' +
  'focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus';

const ERROR_COPY = {
  [FIELD_ERROR.EMPTY]: COPY.errors.optionEmpty,
  [FIELD_ERROR.DUPLICATE]: COPY.errors.optionDuplicate,
};

function Icon({ path }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={ICON_STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d={path} />
    </svg>
  );
}

/**
 * One editable option tile (catalog: OptionEditorRow): drag handle, number badge that
 * labels the field, remove button (only above 2 options), and an auto-grow field.
 */
export default function OptionEditorRow({
  option,
  index,
  error,
  canRemove,
  locked,
  isDragging,
  dragActive,
  dragOffset,
  handleProps,
  onChangeText,
  onRemove,
  inputRef,
}) {
  const number = index + 1;
  const fieldId = `option-field-${option.key}`;

  const rowMotion =
    dragActive && !isDragging ? 'transition-transform duration-fast ease-standard motion-reduce:transition-none' : '';
  const tileBorder = error ? 'border-danger' : 'border-text';
  const tileDrag = isDragging
    ? 'shadow-md rotate-tilt-sm motion-reduce:rotate-0 transition duration-fast ease-emphasized motion-reduce:transition-none'
    : 'shadow-sm';

  return (
    <li
      data-option-row
      data-index={index}
      className={`relative ${isDragging ? 'z-dropdown' : ''} ${rowMotion}`}
      style={dragActive ? { transform: `translateY(${dragOffset}px)` } : undefined}
    >
      <div className={`flex flex-col gap-2 rounded-md border bg-surface px-3 pb-2 pt-1 ${tileBorder} ${tileDrag}`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={COPY.form.dragHandleLabel(number)}
            disabled={locked}
            className={`${ICON_BUTTON} touch-none select-none text-text disabled:cursor-not-allowed disabled:text-border-strong ${
              isDragging ? 'cursor-grabbing bg-action-subtle' : 'cursor-grab'
            }`}
            {...handleProps}
          >
            <Icon path={ICON_PATHS.grip} />
          </button>
          <label
            htmlFor={fieldId}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-text text-sm font-bold text-text"
          >
            <span aria-hidden="true">{number}</span>
            <span className="sr-only">{COPY.form.optionPlaceholder(number)}</span>
          </label>
          <span className="flex-1" />
          {canRemove && (
            <button
              type="button"
              aria-label={COPY.form.removeOptionLabel(number)}
              disabled={locked}
              onClick={() => onRemove(option.key)}
              className={`${ICON_BUTTON} text-text-muted hover:bg-bg hover:text-text disabled:cursor-not-allowed disabled:text-border-strong disabled:hover:bg-transparent`}
            >
              <Icon path={ICON_PATHS.x} />
            </button>
          )}
        </div>
        <TextInput
          id={fieldId}
          value={option.text}
          onChange={(value) => onChangeText(option.key, value)}
          maxLength={POLL_LIMITS.OPTION_MAX_LENGTH}
          placeholder={COPY.form.optionPlaceholder(number)}
          error={error ? ERROR_COPY[error] : null}
          readOnly={locked}
          inputRef={inputRef}
        />
      </div>
    </li>
  );
}
