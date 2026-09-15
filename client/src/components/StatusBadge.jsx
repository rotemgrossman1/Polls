import { COPY } from '../utils/uiCopy';

// Poll status pill (catalog: StatusBadge). Only "Open" exists until Close poll ships.
const STATUSES = {
  open: {
    label: COPY.confirmation.status.open,
    classes: 'bg-success-subtle text-success',
  },
};

export default function StatusBadge({ status }) {
  const { label, classes } = STATUSES[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-current px-3 text-xs font-bold uppercase leading-normal ${classes}`}
    >
      <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-current" />
      {label}
    </span>
  );
}
