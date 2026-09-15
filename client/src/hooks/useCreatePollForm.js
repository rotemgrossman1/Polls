import { useReducer, useRef } from 'react';
import { createPoll } from '../services/pollService';
import { buildCreatePollPayload } from '../utils/pollForm';
import { ANSWER_TYPE, POLL_LIMITS } from '../utils/pollRules';
import { moveItem } from '../utils/reorder';
import { NO_ERRORS, hasErrors, keepShownErrors, validatePollForm } from '../utils/pollValidation';

export const SUBMIT_RESULT = {
  INVALID: 'invalid',
  CREATED: 'created',
  FAILED: 'failed',
  BUSY: 'busy',
};

let optionKeyCounter = 0;
const newOption = () => {
  optionKeyCounter += 1;
  return { key: `option-${optionKeyCounter}`, text: '' };
};

const initialState = () => ({
  question: '',
  detailsShown: false,
  details: '',
  answerType: ANSWER_TYPE.SINGLE,
  options: Array.from({ length: POLL_LIMITS.MIN_OPTIONS }, newOption),
  errors: NO_ERRORS,
  saving: false,
  saveFailed: false,
});

// Applies a field edit, then lets shown errors clear (never appear) for the new values.
function edit(state, changes) {
  const next = { ...state, ...changes };
  return { ...next, errors: keepShownErrors(state.errors, validatePollForm(next)) };
}

function reducer(state, action) {
  // The form is locked while saving.
  if (state.saving && !['saveFailed'].includes(action.type)) {
    return state;
  }

  switch (action.type) {
    case 'setQuestion':
      return edit(state, { question: action.value });
    case 'showDetails':
      return { ...state, detailsShown: true };
    case 'hideDetails':
      return { ...state, detailsShown: false, details: '' };
    case 'setDetails':
      return { ...state, details: action.value };
    case 'setAnswerType':
      return { ...state, answerType: action.value };
    case 'addOption':
      if (state.options.length >= POLL_LIMITS.MAX_OPTIONS) {
        return state;
      }
      return edit(state, { options: [...state.options, action.option] });
    case 'removeOption':
      if (state.options.length <= POLL_LIMITS.MIN_OPTIONS) {
        return state;
      }
      return edit(state, { options: state.options.filter((option) => option.key !== action.key) });
    case 'setOptionText':
      return edit(state, {
        options: state.options.map((option) =>
          option.key === action.key ? { ...option, text: action.value } : option,
        ),
      });
    case 'moveOption':
      return edit(state, { options: moveItem(state.options, action.from, action.to) });
    case 'submitInvalid':
      return { ...state, errors: action.errors, saveFailed: false };
    case 'saveStarted':
      return { ...state, errors: NO_ERRORS, saving: true, saveFailed: false };
    case 'saveFailed':
      return { ...state, saving: false, saveFailed: true };
    default:
      return state;
  }
}

/**
 * State and actions for the Create poll form.
 * `onCreated(poll)` runs after a successful save. One clientRequestId is used for the
 * lifetime of the form, so retrying after a failure cannot create a duplicate poll.
 */
export default function useCreatePollForm({ onCreated }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const savingRef = useRef(false);
  const clientRequestIdRef = useRef(null);
  if (!clientRequestIdRef.current) {
    clientRequestIdRef.current = crypto.randomUUID();
  }

  async function submit() {
    // Synchronous guard: repeated clicks before re-render still submit once.
    if (savingRef.current) {
      return { status: SUBMIT_RESULT.BUSY };
    }

    const errors = validatePollForm(state);
    if (hasErrors(errors)) {
      dispatch({ type: 'submitInvalid', errors });
      return { status: SUBMIT_RESULT.INVALID, errors };
    }

    savingRef.current = true;
    dispatch({ type: 'saveStarted' });

    let poll;
    try {
      poll = await createPoll(buildCreatePollPayload(state, clientRequestIdRef.current));
    } catch {
      savingRef.current = false;
      dispatch({ type: 'saveFailed' });
      return { status: SUBMIT_RESULT.FAILED };
    }

    onCreated(poll);
    return { status: SUBMIT_RESULT.CREATED, poll };
  }

  return {
    ...state,
    canAddOption: state.options.length < POLL_LIMITS.MAX_OPTIONS,
    canRemoveOption: state.options.length > POLL_LIMITS.MIN_OPTIONS,
    setQuestion: (value) => dispatch({ type: 'setQuestion', value }),
    showDetails: () => dispatch({ type: 'showDetails' }),
    hideDetails: () => dispatch({ type: 'hideDetails' }),
    setDetails: (value) => dispatch({ type: 'setDetails', value }),
    setAnswerType: (value) => dispatch({ type: 'setAnswerType', value }),
    addOption: () => {
      const option = newOption();
      dispatch({ type: 'addOption', option });
      return option.key;
    },
    removeOption: (key) => dispatch({ type: 'removeOption', key }),
    setOptionText: (key, value) => dispatch({ type: 'setOptionText', key, value }),
    moveOption: (from, to) => dispatch({ type: 'moveOption', from, to }),
    submit,
  };
}
