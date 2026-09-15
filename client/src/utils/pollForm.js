import { ANSWER_TYPE, POLL_LIMITS } from './pollRules';

// Request body for POST /api/polls. Hidden details are never sent.
export function buildCreatePollPayload(form, clientRequestId) {
  const details = form.detailsShown ? form.details.trim() : '';

  return {
    question: form.question.trim(),
    details: details || null,
    answerType: form.answerType,
    options: form.options.map((option) => option.text.trim()),
    clientRequestId,
  };
}

// Whether Cancel should ask before discarding: anything typed or changed from the empty form.
export function hasUserInput(form) {
  return (
    form.question.length > 0 ||
    (form.detailsShown && form.details.length > 0) ||
    form.options.some((option) => option.text.length > 0) ||
    form.answerType !== ANSWER_TYPE.SINGLE ||
    form.options.length !== POLL_LIMITS.MIN_OPTIONS
  );
}
