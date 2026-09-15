import { COPY } from '../utils/uiCopy';
import { ANSWER_TYPE } from '../utils/pollRules';
import { ICON_PATHS, ICON_STROKE_WIDTH } from '../utils/iconPaths';

const CHOICES = [
  { value: ANSWER_TYPE.SINGLE, label: COPY.form.singleChoice },
  { value: ANSWER_TYPE.MULTIPLE, label: COPY.form.multipleChoice },
];

const CARD =
  'relative flex min-h-12 items-center gap-3 rounded-md border px-4 py-3 font-medium ' +
  'transition duration-fast ease-emphasized motion-reduce:transition-none ' +
  'has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus';

// Single or Multiple choice as answer tiles over native radios (catalog: AnswerTypeSelector).
export default function AnswerTypeSelector({ name = 'answer-type', value, onChange, disabled = false }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-sm font-bold text-text">{COPY.form.answerTypeLabel}</legend>
      {CHOICES.map((choice) => {
        const selected = choice.value === value;
        const stateClasses = selected
          ? 'border-action-hover bg-action text-action-text shadow-none'
          : 'border-text bg-surface text-text shadow-sm';
        const interaction = disabled
          ? 'cursor-not-allowed'
          : `cursor-pointer ${selected ? '' : 'hover:translate-y-lift motion-reduce:hover:translate-y-0'}`;

        return (
          <label key={choice.value} className={`${CARD} ${stateClasses} ${interaction}`}>
            <input
              type="radio"
              className="sr-only"
              name={name}
              value={choice.value}
              checked={selected}
              disabled={disabled}
              onChange={() => onChange(choice.value)}
            />
            <span
              aria-hidden="true"
              data-testid={`answer-type-indicator-${choice.value}`}
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border bg-surface ${
                selected ? 'border-surface text-action' : 'border-text'
              }`}
            >
              {selected && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={ICON_STROKE_WIDTH}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d={ICON_PATHS.check} />
                </svg>
              )}
            </span>
            <span className="min-w-0 break-words">{choice.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
