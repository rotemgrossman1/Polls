import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation, useParams } from 'react-router';
import CreatePollPage from './CreatePollPage';
import { createPoll } from '../services/pollService';

jest.mock('../services/pollService', () => ({ createPoll: jest.fn() }));

function CreatedProbe() {
  const { pollId } = useParams();
  const { state } = useLocation();
  return (
    <p>
      Created {pollId}: {state.poll.question}
    </p>
  );
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/polls/new']}>
      <Routes>
        <Route path="/" element={<p>Landing page</p>} />
        <Route path="/polls/new" element={<CreatePollPage />} />
        <Route path="/polls/:pollId/created" element={<CreatedProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const question = () => screen.getByLabelText('Question');
const option = (n) => screen.getByRole('textbox', { name: `Option ${n}` });
const createButton = () => screen.getByRole('button', { name: /^(Create poll|Creating…)$/ });

async function fillValid() {
  await userEvent.type(question(), '  Where should we eat?  ');
  await userEvent.type(option(1), 'Pizza');
  await userEvent.type(option(2), ' Sushi ');
}

describe('CreatePollPage', () => {
  test('opens with an empty question, hidden details, Single choice, and two empty options', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Create a poll' })).toBeInTheDocument();
    expect(question()).toHaveValue('');
    expect(question()).toHaveAttribute('placeholder', 'What do you want to ask?');
    expect(question()).toHaveAttribute('maxLength', '200');
    expect(screen.getByText('0/200')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add details' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Details (optional)')).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Single choice/ })).toBeChecked();
    expect(screen.getAllByRole('textbox', { name: /^Option \d$/ })).toHaveLength(2);
    expect(option(1)).toHaveValue('');
    expect(option(1)).toHaveAttribute('maxLength', '100');
    expect(createButton()).toHaveTextContent('Create poll');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('Add details shows a focused 1000-character Details field; Remove details hides it', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Add details' }));

    const details = screen.getByLabelText('Details (optional)');
    expect(details).toHaveFocus();
    expect(details).toHaveAttribute('placeholder', 'Add context for the people answering.');
    expect(details).toHaveAttribute('maxLength', '1000');
    expect(screen.getByText('0/1000')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Remove details' }));

    expect(screen.queryByLabelText('Details (optional)')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add details' })).toHaveFocus();
  });

  test('submitting an empty form shows errors, focuses the question, and saves nothing', async () => {
    renderPage();

    await userEvent.click(createButton());

    expect(screen.getByText('Enter a question.')).toBeInTheDocument();
    expect(screen.getAllByText('Fill in this option or remove it.')).toHaveLength(2);
    expect(question()).toHaveFocus();
    expect(createPoll).not.toHaveBeenCalled();
  });

  test('focus moves to the first invalid option when the question is valid', async () => {
    renderPage();
    await userEvent.type(question(), 'Lunch?');
    await userEvent.type(option(1), 'Pizza');

    await userEvent.click(createButton());

    expect(option(2)).toHaveFocus();
    expect(option(2)).toHaveAccessibleDescription('Fill in this option or remove it. 0/100');
  });

  test('duplicate options are blocked, and each error clears as soon as its field is valid', async () => {
    renderPage();
    await userEvent.type(option(1), 'Yes');
    await userEvent.type(option(2), ' yes');

    await userEvent.click(createButton());

    expect(screen.getByText('This option is already in the list.')).toBeInTheDocument();
    expect(createPoll).not.toHaveBeenCalled();

    await userEvent.type(question(), 'Coming?');
    expect(screen.queryByText('Enter a question.')).not.toBeInTheDocument();

    await userEvent.clear(option(2));
    await userEvent.type(option(2), 'No');
    expect(screen.queryByText('This option is already in the list.')).not.toBeInTheDocument();
  });

  test('saving locks the form, then opens the confirmation with the saved poll', async () => {
    const save = deferred();
    createPoll.mockReturnValue(save.promise);
    renderPage();
    await fillValid();
    await userEvent.click(screen.getByRole('radio', { name: /Multiple choice/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Add option' }));
    await userEvent.type(option(3), 'Tacos');

    await userEvent.click(createButton());

    expect(createButton()).toHaveTextContent('Creating…');
    expect(createButton()).toHaveAttribute('aria-disabled', 'true');
    expect(question()).toHaveAttribute('readonly');
    expect(option(1)).toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /Single choice/ })).toBeDisabled();

    await userEvent.click(createButton());
    expect(createPoll).toHaveBeenCalledTimes(1);

    save.resolve({ id: 'poll-1', question: 'Where should we eat?' });

    expect(await screen.findByText('Created poll-1: Where should we eat?')).toBeInTheDocument();
    expect(createPoll).toHaveBeenCalledWith({
      question: 'Where should we eat?',
      details: null,
      answerType: 'multiple',
      options: ['Pizza', 'Sushi', 'Tacos'],
      clientRequestId: expect.any(String),
    });
  });

  test('removed details are not saved', async () => {
    createPoll.mockResolvedValue({ id: 'poll-1', question: 'Where should we eat?' });
    renderPage();
    await fillValid();
    await userEvent.click(screen.getByRole('button', { name: 'Add details' }));
    await userEvent.type(screen.getByLabelText('Details (optional)'), 'Secret context');
    await userEvent.click(screen.getByRole('button', { name: 'Remove details' }));

    await userEvent.click(createButton());

    await screen.findByText(/Created poll-1/);
    expect(createPoll.mock.calls[0][0].details).toBeNull();
  });

  test('a failed save shows the form error, keeps input, and unlocks the form', async () => {
    createPoll.mockRejectedValue(new Error('Network Error'));
    renderPage();
    await fillValid();

    await userEvent.click(createButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't create your poll. Check your connection and try again.",
    );
    expect(question()).toHaveValue('  Where should we eat?  ');
    expect(option(2)).toHaveValue(' Sushi ');
    expect(createButton()).toHaveTextContent('Create poll');
    expect(createButton()).not.toHaveAttribute('aria-disabled');
    expect(question()).not.toHaveAttribute('readonly');
  });

  test('Cancel on an untouched form returns to the landing page without saving', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByText('Landing page')).toBeInTheDocument();
    expect(createPoll).not.toHaveBeenCalled();
  });

  test('pasted text longer than the limit is cut at the limit', async () => {
    renderPage();

    question().focus();
    await userEvent.paste('q'.repeat(250));

    expect(question()).toHaveValue('q'.repeat(200));
    expect(screen.getByText('200/200')).toBeInTheDocument();
  });
});
