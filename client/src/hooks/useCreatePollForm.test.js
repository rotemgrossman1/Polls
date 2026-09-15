import { act, renderHook } from '@testing-library/react';
import useCreatePollForm, { SUBMIT_RESULT } from './useCreatePollForm';
import { createPoll } from '../services/pollService';

jest.mock('../services/pollService', () => ({
  createPoll: jest.fn(),
}));

const POLL = { id: 'poll-1', question: 'Lunch?', options: [] };

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup() {
  const onCreated = jest.fn();
  const view = renderHook(() => useCreatePollForm({ onCreated }));
  return { ...view, onCreated, form: () => view.result.current };
}

function fillValidForm(form) {
  act(() => {
    form().setQuestion('  Where should we eat?  ');
    form().setOptionText(form().options[0].key, ' Pizza ');
    form().setOptionText(form().options[1].key, 'Sushi');
  });
}

describe('useCreatePollForm', () => {
  test('starts empty: no details, Single choice, two empty options, no errors', () => {
    const { form } = setup();

    expect(form()).toMatchObject({
      question: '',
      detailsShown: false,
      details: '',
      answerType: 'single',
      saving: false,
      saveFailed: false,
      canAddOption: true,
      canRemoveOption: false,
      errors: { question: null, options: {} },
    });
    expect(form().options).toHaveLength(2);
    expect(form().options.every((option) => option.text === '')).toBe(true);
  });

  test('adds options up to 8 and returns the new option key', () => {
    const { form } = setup();
    let key;

    act(() => {
      key = form().addOption();
    });
    expect(form().options).toHaveLength(3);
    expect(form().options[2]).toEqual({ key, text: '' });

    act(() => {
      for (let i = 0; i < 10; i += 1) form().addOption();
    });
    expect(form().options).toHaveLength(8);
    expect(form().canAddOption).toBe(false);
  });

  test('removes options only while more than 2 remain', () => {
    const { form } = setup();

    act(() => form().removeOption(form().options[0].key));
    expect(form().options).toHaveLength(2);

    act(() => {
      form().addOption();
    });
    const [, middle] = form().options;
    act(() => form().removeOption(middle.key));

    expect(form().options).toHaveLength(2);
    expect(form().options.map((option) => option.key)).not.toContain(middle.key);
  });

  test('moves options and switching answer type keeps options and order', () => {
    const { form } = setup();
    act(() => {
      form().setOptionText(form().options[0].key, 'A');
      form().setOptionText(form().options[1].key, 'B');
    });

    act(() => form().moveOption(1, 0));
    act(() => form().setAnswerType('multiple'));
    act(() => form().setAnswerType('single'));

    expect(form().options.map((option) => option.text)).toEqual(['B', 'A']);
    expect(form().answerType).toBe('single');
  });

  test('removing details hides the field and discards its text', () => {
    const { form } = setup();

    act(() => form().showDetails());
    act(() => form().setDetails('Some context'));
    act(() => form().hideDetails());

    expect(form().detailsShown).toBe(false);
    expect(form().details).toBe('');
  });

  test('an invalid submit shows errors and saves nothing', async () => {
    const { form } = setup();
    act(() => form().setOptionText(form().options[1].key, 'Pizza'));

    let result;
    await act(async () => {
      result = await form().submit();
    });

    expect(result.status).toBe(SUBMIT_RESULT.INVALID);
    expect(form().errors).toEqual({ question: 'empty', options: { [form().options[0].key]: 'empty' } });
    expect(createPoll).not.toHaveBeenCalled();
  });

  test('after a failed submit errors clear as fields become valid, and no new errors appear', async () => {
    const { form } = setup();
    const [first, second] = form().options;
    act(() => {
      form().setOptionText(first.key, 'Yes');
      form().setOptionText(second.key, 'yes');
    });
    await act(async () => {
      await form().submit();
    });
    expect(form().errors).toEqual({ question: 'empty', options: { [second.key]: 'duplicate' } });

    act(() => form().setQuestion('Coming?'));
    expect(form().errors.question).toBeNull();

    act(() => form().setOptionText(second.key, ''));
    expect(form().errors.options[second.key]).toBe('empty');

    act(() => form().setOptionText(second.key, 'No'));
    expect(form().errors.options).toEqual({});

    act(() => form().setQuestion(''));
    act(() => form().setOptionText(first.key, ''));
    expect(form().errors).toEqual({ question: null, options: {} });
  });

  test('removing an option that has an error removes the error', async () => {
    const { form } = setup();
    act(() => {
      form().addOption();
    });
    await act(async () => {
      await form().submit();
    });
    const erroredKey = form().options[2].key;
    expect(form().errors.options[erroredKey]).toBe('empty');

    act(() => form().removeOption(erroredKey));

    expect(form().errors.options[erroredKey]).toBeUndefined();
  });

  test('a valid submit locks the form, saves the trimmed poll, and calls onCreated', async () => {
    const { form, onCreated } = setup();
    fillValidForm(form);
    act(() => form().showDetails());
    act(() => form().setDetails('   '));
    const save = deferred();
    createPoll.mockReturnValue(save.promise);

    let submitting;
    act(() => {
      submitting = form().submit();
    });

    expect(form().saving).toBe(true);
    act(() => form().setQuestion('Changed while saving'));
    expect(form().question).toBe('  Where should we eat?  ');

    await act(async () => {
      save.resolve(POLL);
      await submitting;
    });

    expect(createPoll).toHaveBeenCalledWith({
      question: 'Where should we eat?',
      details: null,
      answerType: 'single',
      options: ['Pizza', 'Sushi'],
      clientRequestId: expect.stringMatching(/^[0-9a-f-]{36}$/),
    });
    expect(onCreated).toHaveBeenCalledWith(POLL);
  });

  test('repeated submits while saving create exactly one poll', async () => {
    const { form } = setup();
    fillValidForm(form);
    const save = deferred();
    createPoll.mockReturnValue(save.promise);

    let results;
    await act(async () => {
      const pending = [form().submit(), form().submit(), form().submit()];
      save.resolve(POLL);
      results = await Promise.all(pending);
    });

    expect(createPoll).toHaveBeenCalledTimes(1);
    expect(results.map((result) => result.status)).toEqual([
      SUBMIT_RESULT.CREATED,
      SUBMIT_RESULT.BUSY,
      SUBMIT_RESULT.BUSY,
    ]);
  });

  test('a failed save keeps input, unlocks the form, and a retry reuses the client request id', async () => {
    const { form, onCreated } = setup();
    fillValidForm(form);
    createPoll.mockRejectedValueOnce(new Error('Network Error')).mockResolvedValueOnce(POLL);

    let result;
    await act(async () => {
      result = await form().submit();
    });

    expect(result.status).toBe(SUBMIT_RESULT.FAILED);
    expect(form()).toMatchObject({ saving: false, saveFailed: true, question: '  Where should we eat?  ' });
    expect(onCreated).not.toHaveBeenCalled();

    await act(async () => {
      result = await form().submit();
    });

    expect(result.status).toBe(SUBMIT_RESULT.CREATED);
    expect(form().saveFailed).toBe(false);
    const [firstCall, secondCall] = createPoll.mock.calls;
    expect(secondCall[0].clientRequestId).toBe(firstCall[0].clientRequestId);
  });

  test('the save error is removed on the next submit, even an invalid one', async () => {
    const { form } = setup();
    fillValidForm(form);
    createPoll.mockRejectedValueOnce(new Error('Network Error'));
    await act(async () => {
      await form().submit();
    });
    expect(form().saveFailed).toBe(true);

    act(() => form().setQuestion(''));
    await act(async () => {
      await form().submit();
    });

    expect(form().saveFailed).toBe(false);
  });

  test('each form gets its own client request id', async () => {
    createPoll.mockResolvedValue(POLL);
    const first = setup();
    const second = setup();
    fillValidForm(first.form);
    fillValidForm(second.form);

    await act(async () => {
      await first.form().submit();
      await second.form().submit();
    });

    const [a, b] = createPoll.mock.calls.map(([payload]) => payload.clientRequestId);
    expect(a).not.toBe(b);
  });
});
