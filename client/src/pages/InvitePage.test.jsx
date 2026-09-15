import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import InvitePage from './InvitePage';
import { getInvite, joinPoll } from '../services/inviteService';

jest.mock('../services/inviteService', () => ({ getInvite: jest.fn(), joinPoll: jest.fn() }));

const CODE = 'q7Kx2Wm9aZ';
const STORAGE_KEY = 'polls.joins';
const JOIN_KEY = '0b7f1c3e-2a4d-4f6b-9c8e-1d2f3a4b5c6d';
const INVITE = {
  question: 'Where should we hold the Q4 team offsite?',
  details: 'Budget is small.\nVote by Thursday.',
  status: 'open',
  optionCount: 4,
};

const COPY = {
  loading: 'Loading poll…',
  eyebrow: "You're invited",
  help: "The poll's creator will see this name.",
  join: 'Join poll',
  joining: 'Joining…',
  empty: 'Enter a nickname.',
  taken: 'This nickname is taken in this poll. Try another one.',
  joinFailed: "Couldn't join the poll. Check your connection and try again.",
  brokenHeading: "This link doesn't work",
  brokenBody: 'It may be mistyped or incomplete. Ask the person who shared it for a new link.',
  loadError: "We couldn't load this poll.",
  loadErrorBody: 'Check your connection and try again.',
  tryAgain: 'Try again',
};

const apiError = (status) => Object.assign(new Error('Request failed'), { status });
const stored = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY));
const storeJoin = (joins) => window.localStorage.setItem(STORAGE_KEY, JSON.stringify(joins));

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function renderPage(path = `/i/${CODE}`) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/i/:inviteCode" element={<InvitePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

const nicknameField = () => screen.getByRole('textbox', { name: 'Your nickname' });
const joinButton = () => screen.getByRole('button', { name: COPY.join });

function expectNoIndex() {
  expect(document.head.querySelectorAll('meta[name="robots"][content="noindex"]')).toHaveLength(1);
}

async function renderInviteForm() {
  getInvite.mockResolvedValue(INVITE);
  const view = renderPage();
  await screen.findByRole('heading', { level: 1, name: COPY.eyebrow });
  return view;
}

describe('InvitePage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('shows "Loading poll…" with a skeleton while the poll loads', () => {
    getInvite.mockReturnValue(new Promise(() => {}));
    renderPage();

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(COPY.loading);
    expect(screen.getByRole('heading', { level: 1, name: COPY.loading })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.querySelector('[aria-busy="true"] [data-shape="sticker"]')).not.toBeNull();
    expect(getInvite).toHaveBeenCalledWith(CODE);
    expectNoIndex();
  });

  test('shows the invite: heading, status, option count, question, details, the nickname field and Join poll', async () => {
    await renderInviteForm();

    const article = screen.getByRole('article', { name: INVITE.question });
    expect(within(article).getByText('Open')).toBeInTheDocument();
    expect(within(article).getByText('4 options')).toBeInTheDocument();
    expect(within(article).getByText(/Budget is small\./).textContent).toBe(INVITE.details);
    expect(within(article).queryByRole('list')).not.toBeInTheDocument();

    expect(nicknameField()).toHaveValue('');
    expect(nicknameField()).toHaveAttribute('placeholder', 'e.g. Noa');
    expect(screen.getByText(COPY.help)).toBeInTheDocument();
    expect(screen.getByText('0/20')).toBeInTheDocument();
    expect(joinButton()).toHaveAttribute('type', 'submit');
    expect(joinButton()).not.toHaveAttribute('aria-disabled');

    // Minimal nav: the logo is the only link. Nothing but the page's own content is shown.
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expectNoIndex();
  });

  test('Join poll saves the nickname, locks the form while joining, then shows the joined screen', async () => {
    await renderInviteForm();
    const request = deferred();
    joinPoll.mockReturnValue(request.promise);

    await userEvent.type(nicknameField(), ' Noa ');
    await userEvent.click(joinButton());

    const joining = screen.getByRole('button', { name: COPY.joining });
    expect(joining).toHaveAttribute('aria-disabled', 'true');
    expect(nicknameField()).toHaveAttribute('readonly');
    expect(joinPoll).toHaveBeenCalledWith(CODE, { nickname: ' Noa ', joinKey: expect.any(String) });

    await act(async () => {
      request.resolve({ nickname: 'Noa' });
    });

    const heading = screen.getByRole('heading', { level: 1, name: "You're in, Noa" });
    expect(heading.querySelector('bdi')).toHaveTextContent('Noa');
    expect(heading).toHaveFocus();
    const article = screen.getByRole('article', { name: INVITE.question });
    expect(within(article).getByText('Open')).toBeInTheDocument();
    expect(within(article).getByText('4 options')).toBeInTheDocument();
    expect(within(article).getByText(/Budget is small\./)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(stored()[CODE]).toEqual({ joinKey: joinPoll.mock.calls[0][1].joinKey, nickname: 'Noa' });
    expectNoIndex();
  });

  test('Enter in the nickname field joins, the same as Join poll', async () => {
    await renderInviteForm();
    joinPoll.mockResolvedValue({ nickname: 'Noa' });

    await userEvent.type(nicknameField(), 'Noa{Enter}');

    expect(await screen.findByRole('heading', { level: 1, name: "You're in, Noa" })).toBeInTheDocument();
    expect(joinPoll).toHaveBeenCalledTimes(1);
  });

  test('repeated clicks and Enter presses while joining send exactly one request', async () => {
    await renderInviteForm();
    const request = deferred();
    joinPoll.mockReturnValue(request.promise);
    await userEvent.type(nicknameField(), 'Noa');

    await userEvent.dblClick(joinButton());
    await userEvent.click(screen.getByRole('button', { name: COPY.joining }));
    await userEvent.type(nicknameField(), '{Enter}{Enter}');

    expect(joinPoll).toHaveBeenCalledTimes(1);
    await act(async () => {
      request.resolve({ nickname: 'Noa' });
    });
    expect(joinPoll).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['empty', ''],
    ['spaces-only', '   '],
  ])('an %s nickname shows "Enter a nickname.", focuses the field and saves nothing', async (label, value) => {
    await renderInviteForm();
    if (value) {
      await userEvent.type(nicknameField(), value);
    }

    await userEvent.click(joinButton());

    expect(screen.getByText(COPY.empty)).toBeInTheDocument();
    expect(nicknameField()).toHaveAttribute('aria-invalid', 'true');
    expect(nicknameField()).toHaveFocus();
    expect(joinPoll).not.toHaveBeenCalled();

    await userEvent.type(nicknameField(), 'N');
    expect(screen.queryByText(COPY.empty)).not.toBeInTheDocument();
  });

  test('a taken nickname shows the taken error, keeps the text, focuses the field, and clears on change', async () => {
    await renderInviteForm();
    joinPoll.mockRejectedValue(apiError(409));
    await userEvent.type(nicknameField(), 'noa');

    await userEvent.click(joinButton());

    expect(await screen.findByText(COPY.taken)).toBeInTheDocument();
    expect(nicknameField()).toHaveValue('noa');
    expect(nicknameField()).not.toHaveAttribute('readonly');
    expect(nicknameField()).toHaveFocus();
    expect(nicknameField()).toHaveAccessibleDescription(`${COPY.taken} ${COPY.help} 3/20`);
    expect(joinButton()).toBeInTheDocument();

    await userEvent.type(nicknameField(), '2');
    expect(screen.queryByText(COPY.taken)).not.toBeInTheDocument();
  });

  test.each([
    ['a network failure', null],
    ['a server error', 500],
  ])('%s while joining shows the join error above the button, keeps the nickname and unlocks the form', async (label, status) => {
    await renderInviteForm();
    joinPoll.mockRejectedValueOnce(apiError(status)).mockResolvedValueOnce({ nickname: 'Noa' });
    await userEvent.type(nicknameField(), 'Noa');

    await userEvent.click(joinButton());

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(COPY.joinFailed);
    expect(screen.getByRole('main')).toContainElement(alert);
    // eslint-disable-next-line no-bitwise
    expect(nicknameField().compareDocumentPosition(alert) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(nicknameField()).toHaveValue('Noa');
    expect(nicknameField()).not.toHaveAttribute('readonly');

    await userEvent.click(joinButton());
    expect(await screen.findByRole('heading', { level: 1, name: "You're in, Noa" })).toBeInTheDocument();
    expect(joinPoll.mock.calls[1][1].joinKey).toBe(joinPoll.mock.calls[0][1].joinKey);
  });

  test('a device that already joined goes straight to the joined screen after loading, without joining again', async () => {
    storeJoin({ [CODE]: { joinKey: JOIN_KEY, nickname: 'Noa' } });
    const load = deferred();
    getInvite.mockReturnValue(load.promise);
    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent(COPY.loading);

    await act(async () => {
      load.resolve(INVITE);
    });

    const heading = screen.getByRole('heading', { level: 1, name: "You're in, Noa" });
    expect(heading).not.toHaveFocus();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(joinPoll).not.toHaveBeenCalled();
    expectNoIndex();
  });

  test('when another tab joined first, Join poll shows that nickname without saving a new participant', async () => {
    await renderInviteForm();
    storeJoin({ [CODE]: { joinKey: JOIN_KEY, nickname: 'Noa' } });
    await userEvent.type(nicknameField(), 'Dana');

    await userEvent.click(joinButton());

    expect(await screen.findByRole('heading', { level: 1, name: "You're in, Noa" })).toBeInTheDocument();
    expect(joinPoll).not.toHaveBeenCalled();
  });

  test('a link the API does not know shows "This link doesn\'t work" with no poll content or form', async () => {
    getInvite.mockRejectedValue(apiError(404));
    renderPage('/i/wrongCODE0');

    expect(await screen.findByRole('heading', { level: 1, name: COPY.brokenHeading })).toBeInTheDocument();
    expect(screen.getByText(COPY.brokenBody)).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expectNoIndex();
  });

  test('a device that joined still sees "This link doesn\'t work" when the poll is gone', async () => {
    storeJoin({ [CODE]: { joinKey: JOIN_KEY, nickname: 'Noa' } });
    getInvite.mockRejectedValue(apiError(404));
    renderPage();

    expect(await screen.findByRole('heading', { level: 1, name: COPY.brokenHeading })).toBeInTheDocument();
    expect(screen.queryByText(/You're in/)).not.toBeInTheDocument();
  });

  test.each([
    ['a network failure', null],
    ['a server error', 500],
  ])('%s while loading shows the load error, and "Try again" loads the poll again', async (label, status) => {
    getInvite.mockRejectedValueOnce(apiError(status));
    renderPage();

    const heading = await screen.findByRole('heading', { level: 1, name: COPY.loadError });
    expect(screen.getByRole('alert')).toContainElement(heading);
    expect(screen.getByRole('alert')).toHaveTextContent(COPY.loadErrorBody);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expectNoIndex();

    const retry = deferred();
    getInvite.mockReturnValueOnce(retry.promise);
    await userEvent.click(screen.getByRole('button', { name: COPY.tryAgain }));

    expect(screen.getByRole('status')).toHaveTextContent(COPY.loading);
    await act(async () => {
      retry.resolve(INVITE);
    });
    expect(screen.getByRole('heading', { level: 1, name: COPY.eyebrow })).toBeInTheDocument();
    expect(getInvite).toHaveBeenCalledTimes(2);
  });

  test('markup and script in the question, details and nickname are shown as plain text', async () => {
    getInvite.mockResolvedValue({
      ...INVITE,
      question: '<script>alert(1)</script>',
      details: '<img src=x onerror=alert(1)>',
    });
    joinPoll.mockResolvedValue({ nickname: '<b>Noa</b>' });
    const { container } = renderPage();
    await screen.findByRole('heading', { level: 1, name: COPY.eyebrow });

    await userEvent.type(nicknameField(), '<b>Noa</b>');
    await userEvent.click(joinButton());

    const heading = await screen.findByRole('heading', { level: 1, name: "You're in, <b>Noa</b>" });
    expect(heading.querySelector('bdi')).toHaveTextContent('<b>Noa</b>');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('<script>alert(1)</script>');
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
    expect(container.querySelector('script, img, b')).toBeNull();
  });

  test('a 20-character nickname with emoji and right-to-left text is isolated in the joined heading', async () => {
    const nickname = 'נועה \u{1F33B} from Haifa!!';
    storeJoin({ [CODE]: { joinKey: JOIN_KEY, nickname } });
    getInvite.mockResolvedValue(INVITE);
    renderPage();

    const heading = await screen.findByRole('heading', { level: 1, name: /^You're in, / });
    const bdi = heading.querySelector('bdi');
    expect(bdi).toHaveTextContent(nickname);
    expect(bdi).toHaveAttribute('dir', 'auto');
    expect(heading).toHaveClass('break-words');
  });

  test('the robots meta tag is removed when leaving the invite page', async () => {
    const view = await renderInviteForm();
    expectNoIndex();

    view.unmount();

    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]')).toBeNull());
  });
});
