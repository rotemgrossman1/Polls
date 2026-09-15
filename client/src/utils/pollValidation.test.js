import {
  FIELD_ERROR,
  NO_ERRORS,
  firstInvalidField,
  hasErrors,
  keepShownErrors,
  validatePollForm,
} from './pollValidation';

const opts = (...texts) => texts.map((text, i) => ({ key: `k${i}`, text }));

describe('validatePollForm', () => {
  test('a filled question with distinct options has no errors', () => {
    const errors = validatePollForm({ question: 'Lunch?', options: opts('Pizza', 'Sushi') });

    expect(errors).toEqual(NO_ERRORS);
    expect(hasErrors(errors)).toBe(false);
  });

  test.each(['', '   '])('question %p is empty', (question) => {
    const errors = validatePollForm({ question, options: opts('Pizza', 'Sushi') });

    expect(errors.question).toBe(FIELD_ERROR.EMPTY);
    expect(hasErrors(errors)).toBe(true);
  });

  test('empty and spaces-only options are empty', () => {
    const errors = validatePollForm({ question: 'Lunch?', options: opts('Pizza', '', '  ') });

    expect(errors.options).toEqual({ k1: FIELD_ERROR.EMPTY, k2: FIELD_ERROR.EMPTY });
  });

  test('a question or option of only invisible characters is empty', () => {
    const errors = validatePollForm({
      question: '\u200B\u200B\u200B',
      options: opts('Pizza', '\u200B\u200B', ' \u200D\u2060\uFEFF '),
    });

    expect(errors).toEqual({
      question: FIELD_ERROR.EMPTY,
      options: { k1: FIELD_ERROR.EMPTY, k2: FIELD_ERROR.EMPTY },
    });
  });

  test('invisible characters between visible ones do not make text empty', () => {
    const family = '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}';
    const errors = validatePollForm({ question: `Who comes? ${family}`, options: opts(family, 'Soft\u00ADhyphen') });

    expect(hasErrors(errors)).toBe(false);
  });

  test('later duplicates get the error, ignoring case and surrounding spaces', () => {
    const errors = validatePollForm({
      question: 'Coming?',
      options: opts('Yes', ' yes', 'No', 'YES  '),
    });

    expect(errors.options).toEqual({ k1: FIELD_ERROR.DUPLICATE, k3: FIELD_ERROR.DUPLICATE });
  });

  test('options equal after Unicode normalization are duplicates', () => {
    const errors = validatePollForm({
      question: 'Coffee?',
      options: opts('Café', 'Café', 'CAFÉ ', 'Tea'),
    });

    expect(errors.options).toEqual({ k1: FIELD_ERROR.DUPLICATE, k2: FIELD_ERROR.DUPLICATE });
  });

  test('two empty options are both empty, not duplicates', () => {
    const errors = validatePollForm({ question: 'Lunch?', options: opts('', '') });

    expect(errors.options).toEqual({ k0: FIELD_ERROR.EMPTY, k1: FIELD_ERROR.EMPTY });
  });

  test('right-to-left text and emoji are compared as entered', () => {
    const errors = validatePollForm({ question: 'לאן?', options: opts('🍕 פיצה', '🍣 סושי') });

    expect(hasErrors(errors)).toBe(false);
  });
});

describe('keepShownErrors', () => {
  test('clears a shown error once its field is valid', () => {
    const shown = { question: FIELD_ERROR.EMPTY, options: { k1: FIELD_ERROR.EMPTY } };

    expect(keepShownErrors(shown, NO_ERRORS)).toEqual(NO_ERRORS);
  });

  test('keeps a shown error while its field is still invalid, with the current reason', () => {
    const shown = { question: null, options: { k1: FIELD_ERROR.EMPTY } };
    const current = { question: null, options: { k1: FIELD_ERROR.DUPLICATE } };

    expect(keepShownErrors(shown, current)).toEqual({ question: null, options: { k1: FIELD_ERROR.DUPLICATE } });
  });

  test('does not add errors for fields that had none', () => {
    const current = { question: FIELD_ERROR.EMPTY, options: { k0: FIELD_ERROR.EMPTY } };

    expect(keepShownErrors(NO_ERRORS, current)).toEqual(NO_ERRORS);
  });

  test('drops errors of options that no longer exist', () => {
    const shown = { question: null, options: { gone: FIELD_ERROR.EMPTY } };
    const current = { question: null, options: {} };

    expect(keepShownErrors(shown, current).options).toEqual({});
  });
});

describe('firstInvalidField', () => {
  const options = opts('', 'Pizza', '');

  test('the question comes first', () => {
    const errors = { question: FIELD_ERROR.EMPTY, options: { k2: FIELD_ERROR.EMPTY } };

    expect(firstInvalidField(errors, options)).toBe('question');
  });

  test('then options in list order', () => {
    const errors = { question: null, options: { k2: FIELD_ERROR.EMPTY, k0: FIELD_ERROR.EMPTY } };

    expect(firstInvalidField(errors, options)).toBe('k0');
  });

  test('null when nothing is invalid', () => {
    expect(firstInvalidField(NO_ERRORS, options)).toBeNull();
  });
});
