import { useId, useRef } from 'react';
import Button from './Button';
import Sheet from './Sheet';

/**
 * Confirms a destructive action (catalog: ConfirmDialog), built on Sheet. Initial focus is on
 * the safe action; Escape and a scrim tap act as the safe action.
 */
export default function ConfirmDialog({ open, title, body, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  const titleId = useId();
  const bodyId = useId();
  const cancelRef = useRef(null);

  return (
    <Sheet
      open={open}
      onClose={onCancel}
      role="alertdialog"
      labelledBy={titleId}
      describedBy={bodyId}
      initialFocusRef={cancelRef}
    >
      <h2 id={titleId} className="text-xl font-bold leading-tight text-text">
        {title}
      </h2>
      <p id={bodyId} className="text-base text-text">
        {body}
      </p>
      <div className="flex flex-col gap-2 md:flex-row-reverse md:justify-start">
        <Button variant="danger" block="mobile" onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button ref={cancelRef} variant="secondary" block="mobile" onClick={onCancel}>
          {cancelLabel}
        </Button>
      </div>
    </Sheet>
  );
}
