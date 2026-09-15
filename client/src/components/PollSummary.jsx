import { useId } from 'react';
import StatusBadge from './StatusBadge';
import { COPY } from '../utils/uiCopy';
import { ANSWER_TYPE } from '../utils/pollRules';
import { ICON_PATHS, ICON_STROKE_WIDTH } from '../utils/iconPaths';

// `stroke` paths are outlined; an optional `fill` path is drawn solid.
const ANSWER_TYPE_ICONS = {
  [ANSWER_TYPE.SINGLE]: { stroke: ICON_PATHS.singleChoice, fill: ICON_PATHS.singleChoiceDot },
  [ANSWER_TYPE.MULTIPLE]: { stroke: ICON_PATHS.multipleChoice },
};

function MetaIcon({ icon, testId }) {
  return (
    <svg
      aria-hidden="true"
      data-testid={testId}
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
  );
}

/**
 * Read-only view of a poll (catalog: PollSummary). User text is rendered as plain text,
 * wraps in full, and keeps its direction; details keep their line breaks.
 * - `variant="default"`: status, answer type and the numbered option list (the creator's poll).
 * - `variant="invite"`: status and "{n} options" only; takes the invite DTO, which has no id,
 *   options or answer type.
 * - `bubble`: a speech-bubble tail pointing up at the screen heading directly above the card.
 */
export default function PollSummary({ poll, variant = 'default', bubble = false }) {
  const questionId = useId();
  const invite = variant === 'invite';

  return (
    <article
      aria-labelledby={questionId}
      className={`relative flex flex-col gap-2 rounded-lg border border-text bg-surface p-5 shadow-md ${
        bubble ? 'mt-2' : ''
      }`}
    >
      {bubble && (
        <span
          aria-hidden="true"
          data-testid="bubble-tail"
          className="absolute -top-3 left-8 h-5 w-5 rotate-45 border-l border-t border-text bg-surface"
        />
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-text-muted">
        <StatusBadge status={poll.status} />
        {invite ? (
          <span className="inline-flex items-center gap-1">
            <MetaIcon icon={{ stroke: ICON_PATHS.list }} testId="option-count-icon" />
            {COPY.invite.optionCount(poll.optionCount)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <MetaIcon icon={ANSWER_TYPE_ICONS[poll.answerType]} testId="answer-type-icon" />
            {COPY.confirmation.answerType[poll.answerType]}
          </span>
        )}
      </div>
      <h2 id={questionId} dir="auto" className="break-words text-2xl font-bold leading-tight text-text">
        {poll.question}
      </h2>
      {poll.details && (
        <p dir="auto" className="whitespace-pre-wrap break-words text-base leading-normal text-text">
          {poll.details}
        </p>
      )}
      {!invite && (
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
      )}
    </article>
  );
}
