import { useEffect, useRef } from 'react';
import Button from './Button';
import OptionEditorRow from './OptionEditorRow';
import useDragReorder from '../hooks/useDragReorder';
import { COPY } from '../utils/uiCopy';
import { ICON_PATHS, ICON_STROKE_WIDTH } from '../utils/iconPaths';

const HELPER_ID = 'options-helper';
const LIMIT_HINT_ID = 'add-option-hint';

/**
 * Edits the poll's options (catalog: OptionListEditor): add, remove, drag to reorder.
 * fieldRefs: a ref holding a Map of option key -> field element, shared with the page
 * so it can focus the first invalid option.
 */
export default function OptionListEditor({
  options,
  errors,
  canAdd,
  canRemove,
  locked,
  fieldRefs,
  onAdd,
  onRemove,
  onChangeText,
  onMove,
}) {
  const containerRef = useRef(null);
  const pendingFocusKey = useRef(null);
  const { drag, getHandleProps } = useDragReorder({
    containerRef,
    rowSelector: '[data-option-row]',
    onMove,
    disabled: locked,
  });

  useEffect(() => {
    const key = pendingFocusKey.current;
    if (key && fieldRefs.current.has(key)) {
      fieldRefs.current.get(key).focus();
      pendingFocusKey.current = null;
    }
  }, [options, fieldRefs]);

  function handleAdd() {
    pendingFocusKey.current = onAdd();
  }

  // Focus moves to the next row's field, or the previous one when the last row goes.
  function handleRemove(key) {
    const index = options.findIndex((option) => option.key === key);
    const neighbor = options[index + 1] || options[index - 1];
    pendingFocusKey.current = neighbor ? neighbor.key : null;
    onRemove(key);
  }

  const registerField = (key) => (node) => {
    if (node) {
      fieldRefs.current.set(key, node);
    } else {
      fieldRefs.current.delete(key);
    }
  };

  return (
    <fieldset className="flex flex-col gap-3" aria-describedby={HELPER_ID}>
      <legend className="mb-2 text-sm font-bold text-text">{COPY.form.optionsLabel}</legend>
      <p id={HELPER_ID} className="text-sm text-text-muted">
        {COPY.form.optionsHelper}
      </p>
      <div ref={containerRef} className="relative">
        {drag && (
          <div
            aria-hidden="true"
            data-testid="drop-slot"
            className="pointer-events-none absolute inset-x-0 rounded-md border border-dashed border-border-strong bg-bg"
            style={{ top: drag.slotTop, height: drag.slotHeight }}
          />
        )}
        <ol className="flex flex-col gap-3">
          {options.map((option, index) => (
            <OptionEditorRow
              key={option.key}
              option={option}
              index={index}
              error={errors[option.key]}
              canRemove={canRemove}
              locked={locked}
              isDragging={drag !== null && drag.from === index}
              dragActive={drag !== null}
              dragOffset={drag ? (drag.from === index ? drag.offset : drag.shifts[index]) : 0}
              handleProps={getHandleProps(index)}
              onChangeText={onChangeText}
              onRemove={handleRemove}
              inputRef={registerField(option.key)}
            />
          ))}
        </ol>
      </div>
      <Button
        variant="secondary-dashed"
        icon="plus"
        block
        disabled={locked}
        unavailable={!canAdd && !locked}
        aria-describedby={canAdd ? undefined : LIMIT_HINT_ID}
        onClick={handleAdd}
      >
        {COPY.form.addOption}
      </Button>
      {!canAdd && (
        <p id={LIMIT_HINT_ID} className="flex items-center gap-1 text-sm font-medium text-text-muted">
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
            <path d={ICON_PATHS.info} />
          </svg>
          {COPY.form.addOptionHint}
        </p>
      )}
    </fieldset>
  );
}
