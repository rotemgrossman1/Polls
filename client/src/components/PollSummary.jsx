import StatusBadge from './StatusBadge';
import { COPY } from '../utils/uiCopy';
import { ANSWER_TYPE } from '../utils/pollRules';
import { ICON_PATHS, ICON_STROKE_WIDTH } from '../utils/iconPaths';

// `stroke` paths are outlined; an optional `fill` path is drawn solid.
const ANSWER_TYPE_ICONS = {
  [ANSWER_TYPE.SINGLE]: { stroke: ICON_PATHS.singleChoice, fill: ICON_PATHS.singleChoiceDot },
  [ANSWER_TYPE.MULTIPLE]: { stroke: ICON_PATHS.multipleChoice },
};

/**
 * Read-only view of a poll (catalog: PollSummary). User text is rendered as plain text,
 * wraps in full, and keeps its direction; details keep their line breaks.
 */
export default function PollSummary({ poll }) {
  const questionId = `poll-summary-question-${poll.id}`;
  const icon = ANSWER_TYPE_ICONS[poll.answerType];

  return (
    <article
      aria-labelledby={questionId}
      className="flex flex-col gap-2 rounded-lg border border-text bg-surface p-5 shadow-md"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-text-muted">
        <StatusBadge status={poll.status} />
        <span className="inline-flex items-center gap-1">
          <svg
            aria-hidden="true"
            data-testid="answer-type-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={ICON_STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 shrink-0"
          >
            <path d={icon.stroke} />
            {icon.fill && <path d={icon.fill} fill="currentColor" stroke="none" />}
          </svg>
          {COPY.confirmation.answerType[poll.answerType]}
        </span>
      </div>
      <h2 id={questionId} dir="auto" className="break-words text-2xl font-bold leading-tight text-text">
        {poll.question}
      </h2>
      {poll.details && (
        <p dir="auto" className="whitespace-pre-wrap break-words text-base leading-normal text-text">
          {poll.details}
        </p>
      )}
      <ol className="flex flex-col divide-y-2 divide-border border-t-2 border-border">
        {poll.options.map((option, index) => (
          <li key={option.id} className="flex items-start gap-3 py-3 font-medium text-text last:pb-0">
            <span
              aria-hidden="true"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-text text-sm font-bold"
            >
              {index + 1}
            </span>
            <span dir="auto" className="min-w-0 break-words pt-1">
              {option.text}
            </span>
          </li>
        ))}
      </ol>
    </article>
  );
}
