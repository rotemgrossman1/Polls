export const FIELD_ERROR = {
  EMPTY: 'empty',
  DUPLICATE: 'duplicate',
};

export const NO_ERRORS = { question: null, options: {} };

// Only whitespace and invisible characters (zero-width spaces, joiners, BOM): counts as empty.
const BLANK = /^[\p{White_Space}\p{Default_Ignorable_Code_Point}]*$/u;

const isBlank = (text) => BLANK.test(text);

// Options match ignoring case, surrounding spaces and Unicode composition (as the API does).
const normalizeOption = (text) => text.trim().toLowerCase().normalize('NFC');

/**
 * Validates the Create poll form.
 * Returns { question: 'empty' | null, options: { [optionKey]: 'empty' | 'duplicate' } }.
 * The duplicate error goes on later duplicates; an empty option is never a duplicate.
 */
export function validatePollForm({ question, options }) {
  const errors = { question: isBlank(question) ? FIELD_ERROR.EMPTY : null, options: {} };
  const seen = new Set();

  options.forEach((option) => {
    if (isBlank(option.text)) {
      errors.options[option.key] = FIELD_ERROR.EMPTY;
      return;
    }
    const normalized = normalizeOption(option.text);
    if (seen.has(normalized)) {
      errors.options[option.key] = FIELD_ERROR.DUPLICATE;
    } else {
      seen.add(normalized);
    }
  });

  return errors;
}

export function hasErrors(errors) {
  return Boolean(errors.question) || Object.keys(errors.options).length > 0;
}

/**
 * After a failed submit, shown errors only clear: a shown error stays (with its current
 * reason) while its field is still invalid. Fields without a shown error get none until
 * the next submit.
 */
export function keepShownErrors(shown, current) {
  const options = {};
  Object.keys(shown.options).forEach((key) => {
    if (current.options[key]) {
      options[key] = current.options[key];
    }
  });

  return {
    question: shown.question && current.question ? current.question : null,
    options,
  };
}

// The first invalid field in form order: 'question', an option key, or null.
export function firstInvalidField(errors, options) {
  if (errors.question) {
    return 'question';
  }
  const invalidOption = options.find((option) => errors.options[option.key]);
  return invalidOption ? invalidOption.key : null;
}
