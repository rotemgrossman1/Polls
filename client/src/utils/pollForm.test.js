import { buildCreatePollPayload, hasUserInput } from './pollForm';

const REQUEST_ID = '0b7f1c3e-2a4d-4f6b-9c8e-1d2f3a4b5c6d';

function form(overrides = {}) {
  return {
    question: '',
    detailsShown: false,
    details: '',
    answerType: 'single',
    options: [
      { key: 'a', text: '' },
      { key: 'b', text: '' },
    ],
    ...overrides,
  };
}

describe('buildCreatePollPayload', () => {
  test('trims text and keeps options in displayed order', () => {
    const payload = buildCreatePollPayload(
      form({
        question: '  Where should we eat?  ',
        detailsShown: true,
        details: '  Team lunch.\nBudget is small.  ',
        answerType: 'multiple',
        options: [
          { key: 'b', text: ' Sushi ' },
          { key: 'a', text: 'Pizza  ' },
        ],
      }),
      REQUEST_ID,
    );

    expect(payload).toEqual({
      question: 'Where should we eat?',
      details: 'Team lunch.\nBudget is small.',
      answerType: 'multiple',
      options: ['Sushi', 'Pizza'],
      clientRequestId: REQUEST_ID,
    });
  });

  test('sends null details when the details field is hidden, even if text remains', () => {
    const payload = buildCreatePollPayload(form({ detailsShown: false, details: 'Old text' }), REQUEST_ID);

    expect(payload.details).toBeNull();
  });

  test('sends null details when shown details are only spaces', () => {
    const payload = buildCreatePollPayload(form({ detailsShown: true, details: '   ' }), REQUEST_ID);

    expect(payload.details).toBeNull();
  });
});

describe('hasUserInput', () => {
  test('the untouched form has no input', () => {
    expect(hasUserInput(form())).toBe(false);
  });

  test('shown but empty details are not input', () => {
    expect(hasUserInput(form({ detailsShown: true }))).toBe(false);
  });

  test.each([
    ['a question', { question: 'Lunch?' }],
    ['spaces in the question', { question: '  ' }],
    ['details', { detailsShown: true, details: 'Context' }],
    ['option text', { options: [{ key: 'a', text: 'Pizza' }, { key: 'b', text: '' }] }],
    ['multiple choice', { answerType: 'multiple' }],
    [
      'an added option',
      {
        options: [
          { key: 'a', text: '' },
          { key: 'b', text: '' },
          { key: 'c', text: '' },
        ],
      },
    ],
  ])('%s counts as input', (label, overrides) => {
    expect(hasUserInput(form(overrides))).toBe(true);
  });
});
