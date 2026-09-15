// QA end-to-end tests for Share and join poll. Oracle: specs/features/2026-09-15-share-and-join-poll.md.
const { randomUUID } = require('crypto');
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { API_URL, CLIENT_URL, E2E_USERNAME } = require('./helpers/env');
const { insertForeignPoll } = require('./helpers/db');
const { participantNicknames, deletePoll } = require('./helpers/participants');

// Word for word from the spec's UI Copy table (and Create poll's for the confirmation screen).
const COPY = {
  confirmHeading: 'Poll created',
  confirmLoading: 'Loading poll…',
  confirmLoadError: "We couldn't load this poll.",
  backHome: 'Back to home',
  createAnother: 'Create another poll',
  sharePoll: 'Share poll',
  shareTitle: 'Invite people',
  shareBody: 'Anyone with this link can join and answer your poll.',
  linkLabel: 'Invite link',
  copy: 'Copy',
  copied: 'Copied',
  copiedAnnouncement: 'Link copied',
  copyError: "Couldn't copy the link. Select it and copy it yourself.",
  shareLink: 'Share link',
  shareText: (link) => `Answer my poll here: ${link}`,
  done: 'Done',
  close: 'Close',
  eyebrow: "You're invited",
  open: 'Open',
  optionCount: (n) => `${n} options`,
  loading: 'Loading poll…',
  nicknameLabel: 'Your nickname',
  nicknamePlaceholder: 'e.g. Noa',
  nicknameHelp: "The poll's creator will see this name.",
  counter: (count) => `${count}/20`,
  join: 'Join poll',
  joining: 'Joining…',
  nicknameEmpty: 'Enter a nickname.',
  nicknameTaken: 'This nickname is taken in this poll. Try another one.',
  joinFailed: "Couldn't join the poll. Check your connection and try again.",
  joinedHeading: (nickname) => `You're in, ${nickname}`,
  brokenHeading: "This link doesn't work",
  brokenBody: 'It may be mistyped or incomplete. Ask the person who shared it for a new link.',
  loadError: "We couldn't load this poll.",
  loadErrorBody: 'Check your connection and try again.',
  tryAgain: 'Try again',
};

const FOCUS_RING_COLOR = 'rgb(15, 118, 110)'; // --color-focus
const TOUCH_TARGET_MIN = 44; // --touch-target-min
const COPIED_MS = 2000; // Spec: "Copied" for 2 seconds after the last tap.
const INVITE_CODE = /^[0-9A-Za-z]{10}$/;

const unique = (label) => `${label} ${randomUUID().slice(0, 8)}`;
// Builds text from code points, so invisible characters and emoji stay readable in this file.
const ch = (...codePoints) => String.fromCodePoint(...codePoints);

const SERVER_ERROR = { status: 500, contentType: 'application/json', body: '{"data":null,"error":"Something went wrong"}' };
const FAILURES = [
  { name: 'a server error', fail: (route) => route.fulfill(SERVER_ERROR) },
  { name: 'a network failure', fail: (route) => route.abort('failed') },
];

function gate() {
  let release;
  const opened = new Promise((resolve) => {
    release = resolve;
  });
  return { opened, release };
}

function hasLoneSurrogate(text) {
  for (let i = 0; i < text.length; i += 1) {
    const unit = text.charCodeAt(i);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = text.charCodeAt(i + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      i += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      return true;
    }
  }
  return false;
}

async function createPollViaApi(request, overrides = {}) {
  const res = await request.post(`${API_URL}/polls`, {
    data: {
      question: unique('Where should we eat?'),
      answerType: 'single',
      options: ['Pizza', 'Sushi'],
      clientRequestId: randomUUID(),
      ...overrides,
    },
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data;
}

async function joinViaApi(request, inviteCode, nickname) {
  const res = await request.post(`${API_URL}/invites/${inviteCode}/participants`, {
    data: { nickname, joinKey: randomUUID() },
  });
  expect(res.status()).toBe(201);
}

const invitePath = (poll) => `/i/${poll.inviteCode}`;
const createdPath = (poll) => `/polls/${poll.id}/created`;
const inviteLinkOf = (poll) => `${CLIENT_URL}/i/${poll.inviteCode}`;

const nicknameField = (page) => page.getByRole('textbox', { name: COPY.nicknameLabel, exact: true });
const joinButton = (page) => page.getByRole('button', { name: COPY.join, exact: true });
const sharePollButton = (page) => page.getByRole('button', { name: COPY.sharePoll, exact: true });
const shareSheet = (page) => page.getByRole('dialog', { name: COPY.shareTitle });
const eyebrowHeading = (page) => page.getByRole('heading', { level: 1, name: COPY.eyebrow });
const joinedHeading = (page, nickname) => page.getByRole('heading', { level: 1, name: COPY.joinedHeading(nickname) });
const brokenHeading = (page) => page.getByRole('heading', { level: 1, name: COPY.brokenHeading });

function countJoinRequests(page) {
  const counter = { count: 0 };
  page.on('request', (req) => {
    if (req.method() === 'POST' && /^\/api\/invites\/[^/]+\/participants$/.test(new URL(req.url()).pathname)) {
      counter.count += 1;
    }
  });
  return counter;
}

async function openInvite(page, poll) {
  await page.goto(invitePath(poll));
  await expect(eyebrowHeading(page)).toBeVisible();
}

async function joinWith(page, nickname) {
  await nicknameField(page).fill(nickname);
  await joinButton(page).click();
}

async function openShareSheet(page, poll) {
  await page.goto(createdPath(poll));
  await sharePollButton(page).click();
  const sheet = shareSheet(page);
  await expect(sheet).toBeVisible();
  return sheet;
}

// Device share support: 'unsupported' removes it; otherwise calls are recorded in window.__shared,
// and window.__shareMode = 'cancel' makes the next calls reject like a canceled share sheet.
async function stubShare(page, support) {
  await page.addInitScript((mode) => {
    window.__shared = [];
    if (mode === 'unsupported') {
      delete Navigator.prototype.share;
      delete Navigator.prototype.canShare;
      return;
    }
    Object.defineProperty(Navigator.prototype, 'share', {
      configurable: true,
      writable: true,
      value(data) {
        window.__shared.push(data);
        return window.__shareMode === 'cancel'
          ? Promise.reject(new DOMException('Share canceled', 'AbortError'))
          : Promise.resolve();
      },
    });
  }, support);
}

async function robotsNoIndexCount(page) {
  return page.locator('head meta[name="robots"][content="noindex"]').count();
}

async function expectNoHorizontalScroll(page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
}

// Finite animations (sheet entrance, success mark) finished, so contrast is measured at rest.
async function settleAnimations(page) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished),
    ),
  );
}

async function axeViolations(page, screen) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  return results.violations.map((v) => `${screen}: ${v.id} — ${v.help} (${v.nodes.length})`);
}

function focusRing(page) {
  return page.evaluate(() => {
    const style = getComputedStyle(document.activeElement);
    return { style: style.outlineStyle, color: style.outlineColor };
  });
}

async function tabUntilFocused(page, locator, maxTabs = 20) {
  for (let i = 0; i < maxTabs; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await locator.evaluate((el) => el === document.activeElement)) return;
    // eslint-disable-next-line no-await-in-loop
    await page.keyboard.press('Tab');
  }
  await expect(locator).toBeFocused();
}

function controlsSmallerThanTouchTarget(page) {
  return page.evaluate((min) => {
    return Array.from(document.querySelectorAll('button, a[href], input, textarea'))
      .filter((el) => el.getClientRects().length > 0)
      .map((el) => ({ el, box: el.getBoundingClientRect() }))
      .filter(({ box }) => box.width < min || box.height < min)
      .map(({ el, box }) => `${el.tagName} "${el.getAttribute('aria-label') || el.textContent.trim().slice(0, 20)}" ${Math.round(box.width)}x${Math.round(box.height)}`);
  }, TOUCH_TARGET_MIN);
}

test.describe('share sheet', () => {
  test('Share poll is the main action once the poll loads, and is not shown while loading, on the load error, or for another user\'s poll', async ({ page, request }) => {
    const poll = await createPollViaApi(request);
    const loading = gate();
    await page.route(`**/api/polls/${poll.id}`, async (route) => {
      await loading.opened;
      return route.continue();
    });

    await page.goto(createdPath(poll));
    await expect(page.getByRole('status')).toHaveText(COPY.confirmLoading);
    await expect(sharePollButton(page)).toHaveCount(0);
    loading.release();

    await expect(page.getByRole('heading', { level: 1, name: COPY.confirmHeading })).toBeVisible();
    await expect(sharePollButton(page)).toBeVisible();
    await expect(page.getByRole('button', { name: COPY.backHome, exact: true })).toBeVisible();
    const createAnother = page.getByRole('button', { name: COPY.createAnother, exact: true });
    await expect(createAnother).toBeVisible();
    // The main action is the filled button; the secondary action is not.
    const fills = await Promise.all(
      [sharePollButton(page), createAnother].map((button) => button.evaluate((el) => getComputedStyle(el).backgroundColor)),
    );
    expect(fills[0]).not.toBe(fills[1]);

    await page.goto(`/polls/${randomUUID()}/created`);
    await expect(page.getByRole('alert')).toHaveText(COPY.confirmLoadError);
    await expect(sharePollButton(page)).toHaveCount(0);

    const foreignQuestion = unique('Another user private poll');
    const foreignId = await insertForeignPoll(foreignQuestion);
    await page.goto(`/polls/${foreignId}/created`);
    await expect(page.getByRole('alert')).toHaveText(COPY.confirmLoadError);
    await expect(sharePollButton(page)).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText(foreignQuestion)).toHaveCount(0);
  });

  test('the share sheet shows the title, body, the full invite link without the poll id, Copy, Done and Close', async ({ page, request }) => {
    await stubShare(page, 'unsupported');
    const poll = await createPollViaApi(request);

    const sheet = await openShareSheet(page, poll);

    await expect(sheet).toHaveAccessibleDescription(COPY.shareBody);
    await expect(sheet.getByText(COPY.shareBody, { exact: true })).toBeVisible();
    expect(poll.inviteCode).toMatch(INVITE_CODE);
    const link = sheet.getByRole('group', { name: COPY.linkLabel });
    await expect(link).toHaveText(inviteLinkOf(poll));
    await expect(link).not.toContainText(poll.id);
    await expect(sheet.getByRole('button', { name: COPY.copy, exact: true })).toBeFocused();
    await expect(sheet.getByRole('button', { name: COPY.done, exact: true })).toBeVisible();
    await expect(sheet.getByRole('button', { name: COPY.close, exact: true })).toBeVisible();
    await expect(sheet.getByRole('button', { name: COPY.shareLink, exact: true })).toHaveCount(0);
  });

  test('Copy puts the invite link on the clipboard, changes to Copied, and announces Link copied', async ({ page, request }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: CLIENT_URL });
    const poll = await createPollViaApi(request);
    const sheet = await openShareSheet(page, poll);

    await sheet.getByRole('button', { name: COPY.copy, exact: true }).click();

    await expect(sheet.getByRole('button', { name: COPY.copied, exact: true })).toBeVisible();
    await expect(sheet.getByRole('status')).toHaveText(COPY.copiedAnnouncement);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(inviteLinkOf(poll));
    await expect(sheet.getByRole('alert')).toHaveCount(0);
  });

  test('Copied shows for 2 seconds after the last tap, then the button reads Copy again', async ({ page, request }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: CLIENT_URL });
    await page.clock.install();
    const poll = await createPollViaApi(request);
    const sheet = await openShareSheet(page, poll);
    await page.clock.pauseAt(Date.now() + 60 * 1000);
    const copied = sheet.getByRole('button', { name: COPY.copied, exact: true });
    const copy = sheet.getByRole('button', { name: COPY.copy, exact: true });

    await copy.click();
    await expect(copied).toBeVisible();
    await page.clock.runFor(1500);
    await copied.click();
    await page.clock.runFor(COPIED_MS - 1);
    await expect(copied).toBeVisible();
    await page.clock.runFor(1);

    await expect(copy).toBeVisible();
    await expect(sheet.getByRole('status')).toHaveText('');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(inviteLinkOf(poll));
  });

  test('when copying is blocked, the copy error is shown under the link and the link text is selected', async ({ page, request }) => {
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, 'clipboard', {
        configurable: true,
        get: () => ({ writeText: () => Promise.reject(new DOMException('Blocked', 'NotAllowedError')) }),
      });
      Document.prototype.execCommand = () => false;
    });
    const poll = await createPollViaApi(request);
    const sheet = await openShareSheet(page, poll);

    await sheet.getByRole('button', { name: COPY.copy, exact: true }).click();

    await expect(sheet.getByRole('alert')).toHaveText(COPY.copyError);
    const link = sheet.getByRole('group', { name: COPY.linkLabel });
    await expect(link).toHaveAccessibleDescription(COPY.copyError);
    expect(await page.evaluate(() => window.getSelection().toString())).toBe(inviteLinkOf(poll));
    await expect(sheet.getByRole('button', { name: COPY.copy, exact: true })).toBeVisible();
    await expect(sheet.getByRole('status')).toHaveText('');
    const [alertBox, linkBox] = await Promise.all([sheet.getByRole('alert').boundingBox(), link.boundingBox()]);
    expect(alertBox.y).toBeGreaterThanOrEqual(linkBox.y + linkBox.height);
  });

  test('Share link opens the device share options with the spec text, and canceling them shows no error and keeps the sheet open', async ({ page, request }) => {
    await stubShare(page, 'supported');
    const poll = await createPollViaApi(request);
    const sheet = await openShareSheet(page, poll);
    const shareLink = sheet.getByRole('button', { name: COPY.shareLink, exact: true });

    await shareLink.click();
    await expect.poll(() => page.evaluate(() => window.__shared)).toEqual([{ text: COPY.shareText(inviteLinkOf(poll)) }]);

    await page.evaluate(() => {
      window.__shareMode = 'cancel';
    });
    await shareLink.click();
    await expect.poll(() => page.evaluate(() => window.__shared.length)).toBe(2);

    await expect(sheet).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(shareLink).toBeVisible();
  });

  test('Done, the close button, Escape and a tap outside close the sheet and return focus to Share poll; selecting the link by dragging outside does not', async ({ page, request }) => {
    const poll = await createPollViaApi(request);
    await page.goto(createdPath(poll));
    const sheet = shareSheet(page);
    const closers = [
      ['Done', () => sheet.getByRole('button', { name: COPY.done, exact: true }).click()],
      ['Close', () => sheet.getByRole('button', { name: COPY.close, exact: true }).click()],
      ['Escape', () => page.keyboard.press('Escape')],
      ['a tap outside', () => page.mouse.click(5, 5)],
    ];

    for (const [label, closeSheet] of closers) {
      // eslint-disable-next-line no-await-in-loop
      await sharePollButton(page).click();
      // eslint-disable-next-line no-await-in-loop
      await expect(sheet, label).toBeVisible();
      // eslint-disable-next-line no-await-in-loop
      await closeSheet();
      // eslint-disable-next-line no-await-in-loop
      await expect(sheet, label).toHaveCount(0);
      // eslint-disable-next-line no-await-in-loop
      await expect(sharePollButton(page), label).toBeFocused();
    }

    await sharePollButton(page).click();
    const linkBox = await sheet.getByRole('group', { name: COPY.linkLabel }).boundingBox();
    await page.mouse.move(linkBox.x + linkBox.width - 4, linkBox.y + linkBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(5, 5, { steps: 8 });
    await page.mouse.up();
    await expect(sheet).toBeVisible();
  });

  test('opening the share sheet again, and after a reload, shows the same link', async ({ page, request }) => {
    const poll = await createPollViaApi(request);
    const linkText = () => shareSheet(page).getByRole('group', { name: COPY.linkLabel }).textContent();

    await openShareSheet(page, poll);
    const first = await linkText();
    await shareSheet(page).getByRole('button', { name: COPY.done, exact: true }).click();
    await sharePollButton(page).click();
    const second = await linkText();
    await page.reload();
    await sharePollButton(page).click();
    const third = await linkText();

    expect(first).toBe(inviteLinkOf(poll));
    expect([second, third]).toEqual([first, first]);
  });
});

test.describe('opening an invite link', () => {
  test('a device that has not joined sees Loading poll…, then You\'re invited with the status, option count, question, details, nickname field and Join poll', async ({ page, request }) => {
    const poll = await createPollViaApi(request, { details: 'Team lunch.\nBudget is small.', options: ['Pizza', 'Sushi', 'Tacos'] });
    const loading = gate();
    await page.route(`**/api/invites/${poll.inviteCode}`, async (route) => {
      await loading.opened;
      return route.continue();
    });

    await page.goto(invitePath(poll));
    await expect(page.getByRole('status')).toHaveText(COPY.loading);
    await expect(nicknameField(page)).toHaveCount(0);
    loading.release();

    await expect(eyebrowHeading(page)).toBeVisible();
    const article = page.getByRole('article', { name: poll.question });
    await expect(article.getByRole('heading', { level: 2 })).toHaveText(poll.question);
    await expect(article.getByText(COPY.open, { exact: true })).toBeVisible();
    await expect(article.getByText(COPY.optionCount(3), { exact: true })).toBeVisible();
    await expect(article.getByText('Team lunch.', { exact: false })).toHaveText('Team lunch.\nBudget is small.');
    await expect(nicknameField(page)).toHaveValue('');
    await expect(joinButton(page)).toBeVisible();
    await expect(joinButton(page)).not.toHaveAttribute('aria-disabled', 'true');
  });

  test('the invite page and the joined screen never show answer options, other nicknames, the creator, or the poll id', async ({ page, request }) => {
    const poll = await createPollViaApi(request, { options: ['OptionAlphaSecret', 'OptionBetaSecret'] });
    await joinViaApi(request, poll.inviteCode, 'OtherPersonSecret');
    const expectNothingHidden = async (screen) => {
      const html = await page.content();
      for (const secret of ['OptionAlphaSecret', 'OptionBetaSecret', 'OtherPersonSecret', poll.id, E2E_USERNAME]) {
        expect(html, `${screen} contains ${secret}`).not.toContain(secret);
      }
      await expect(page.getByRole('radio')).toHaveCount(0);
      await expect(page.getByRole('checkbox')).toHaveCount(0);
      await expect(page.getByRole('listitem')).toHaveCount(0);
    };

    await openInvite(page, poll);
    await expectNothingHidden('invite page');
    await joinWith(page, 'Me');
    await expect(joinedHeading(page, 'Me')).toBeVisible();
    await expectNothingHidden('joined screen');
  });

  test('every link that doesn\'t work shows the identical "This link doesn\'t work" page, with no poll content and no form', async ({ page, request }) => {
    const poll = await createPollViaApi(request);
    const code = poll.inviteCode;
    const swappedCase = [...code].map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join('');
    const paths = [
      ['a made-up code', '/i/Zz9aB8cD7e'],
      ['the code with its letter case changed', `/i/${swappedCase}`],
      ['a cut-off code', `/i/${code.slice(0, 9)}`],
      ['a much shorter code', `/i/${code.slice(0, 4)}`],
      ['a very long code', `/i/${code}${'x'.repeat(300)}`],
      ['no code', '/i'],
      ['no code and a trailing slash', '/i/'],
      ['extra path segments', '/i/a/b'],
      ['the code followed by another segment', `/i/${code}/extra`],
      // Broken percent-encoding (/i/abc%E0%A4%A) is not listed: `vite preview` answers it with its own
      // 404 before the app loads, so the result depends on the static host, not on the app.
    ];
    const snapshot = async () => ({
      text: await page.locator('body').innerText(),
      title: await page.title(),
      robots: await robotsNoIndexCount(page),
      forms: await page.getByRole('textbox').count(),
      articles: await page.getByRole('article').count(),
    });

    let baseline = null;
    for (const [label, path] of paths) {
      // eslint-disable-next-line no-await-in-loop
      await page.goto(path);
      // eslint-disable-next-line no-await-in-loop
      await expect(brokenHeading(page), label).toBeVisible();
      // eslint-disable-next-line no-await-in-loop
      const current = await snapshot();
      if (!baseline) {
        baseline = current;
        expect(baseline.text).toContain(COPY.brokenBody);
        expect(baseline).toMatchObject({ robots: 1, forms: 0, articles: 0 });
      }
      expect(current, label).toEqual(baseline);
      expect(current.text, label).not.toContain(poll.question);
    }
  });

  test('a link with tracking parameters, a trailing slash, or a fragment opens the right poll', async ({ page, request }) => {
    const poll = await createPollViaApi(request);

    for (const suffix of ['?utm_source=whatsapp&fbclid=abc123', '/', '/?utm_medium=chat', '#join']) {
      // eslint-disable-next-line no-await-in-loop
      await page.goto(`${invitePath(poll)}${suffix}`);
      // eslint-disable-next-line no-await-in-loop
      await expect(page.getByRole('article', { name: poll.question }), suffix).toBeVisible();
      // eslint-disable-next-line no-await-in-loop
      await expect(eyebrowHeading(page), suffix).toBeVisible();
    }
  });

  for (const failure of FAILURES) {
    test(`after ${failure.name} while loading, the load error and Try again are shown, and Try again loads the poll`, async ({ page, request }) => {
      const poll = await createPollViaApi(request);
      let failNext = true;
      const retry = gate();
      await page.route(`**/api/invites/${poll.inviteCode}`, async (route) => {
        if (failNext) {
          failNext = false;
          return failure.fail(route);
        }
        await retry.opened;
        return route.continue();
      });

      await page.goto(invitePath(poll));

      const alert = page.getByRole('alert');
      await expect(alert.getByRole('heading', { level: 1 })).toHaveText(COPY.loadError);
      await expect(alert).toContainText(COPY.loadErrorBody);
      await expect(nicknameField(page)).toHaveCount(0);
      await expect(page.getByRole('article')).toHaveCount(0);
      expect(await robotsNoIndexCount(page)).toBe(1);

      await page.getByRole('button', { name: COPY.tryAgain, exact: true }).click();
      await expect(page.getByRole('status')).toHaveText(COPY.loading);
      retry.release();

      await expect(eyebrowHeading(page)).toBeVisible();
      await expect(page.getByRole('article', { name: poll.question })).toBeVisible();
      await expect(page.getByRole('alert')).toHaveCount(0);
    });
  }

  test('invite pages are marked noindex while loading, on the form, with a field error, when joined, on a load error and on a broken link', async ({ page, request }) => {
    const poll = await createPollViaApi(request);
    const loading = gate();
    let failLoad = false;
    await page.route(`**/api/invites/${poll.inviteCode}`, async (route) => {
      if (failLoad) return route.fulfill(SERVER_ERROR);
      await loading.opened;
      return route.continue();
    });
    const counts = {};

    await page.goto(invitePath(poll));
    await expect(page.getByRole('status')).toHaveText(COPY.loading);
    counts.loading = await robotsNoIndexCount(page);
    loading.release();
    await expect(eyebrowHeading(page)).toBeVisible();
    counts.form = await robotsNoIndexCount(page);
    await joinButton(page).click();
    await expect(page.getByText(COPY.nicknameEmpty, { exact: true })).toBeVisible();
    counts.fieldError = await robotsNoIndexCount(page);
    await joinWith(page, 'Noa');
    await expect(joinedHeading(page, 'Noa')).toBeVisible();
    counts.joined = await robotsNoIndexCount(page);
    failLoad = true;
    await page.reload();
    await expect(page.getByRole('button', { name: COPY.tryAgain, exact: true })).toBeVisible();
    counts.loadError = await robotsNoIndexCount(page);
    await page.goto('/i/Zz9aB8cD7e');
    await expect(brokenHeading(page)).toBeVisible();
    counts.broken = await robotsNoIndexCount(page);

    expect(counts).toEqual({ loading: 1, form: 1, fieldError: 1, joined: 1, loadError: 1, broken: 1 });
  });

  test('a device that joined a poll that was deleted later sees "This link doesn\'t work"', async ({ page, request }) => {
    const poll = await createPollViaApi(request);
    await openInvite(page, poll);
    await joinWith(page, 'Noa');
    await expect(joinedHeading(page, 'Noa')).toBeVisible();

    await deletePoll(poll.id);
    await page.reload();

    await expect(brokenHeading(page)).toBeVisible();
    await expect(joinedHeading(page, 'Noa')).toHaveCount(0);
    await expect(page.getByText(poll.question)).toHaveCount(0);
  });
});

test.describe('joining', () => {
  test('the nickname field shows its label, placeholder, help text and counter, and typed or pasted text is cut at 20 without splitting an emoji', async ({ page, request }) => {
    const poll = await createPollViaApi(request);
    await openInvite(page, poll);
    const field = nicknameField(page);

    await expect(field).toHaveAttribute('placeholder', COPY.nicknamePlaceholder);
    await expect(page.getByText(COPY.nicknameHelp, { exact: true })).toBeVisible();
    await expect(page.getByText(COPY.counter(0), { exact: true })).toBeVisible();
    await expect(field).toHaveAccessibleDescription(`${COPY.nicknameHelp} ${COPY.counter(0)}`);

    await field.click();
    await page.keyboard.insertText('n'.repeat(25));
    await expect(field).toHaveValue('n'.repeat(20));
    await expect(page.getByText(COPY.counter(20), { exact: true })).toBeVisible();

    await field.fill('');
    await page.keyboard.insertText(`Noa${ch(0x1f355).repeat(10)}`);
    const value = await field.inputValue();
    expect(value.startsWith('Noa')).toBe(true);
    expect(value.length).toBeLessThanOrEqual(20);
    expect(hasLoneSurrogate(value)).toBe(false);
    await expect(page.getByText(COPY.counter(value.length), { exact: true })).toBeVisible();
  });

  for (const [label, value] of [
    ['empty', ''],
    ['spaces-only', '   '],
    ['invisible-only', ch(0x200b, 0x2060, 0x200b)],
  ]) {
    test(`an ${label} nickname shows "Enter a nickname.", focuses the field, and sends and saves nothing; the error stays for blank text and clears for a letter`, async ({ page, request }) => {
      const poll = await createPollViaApi(request);
      await openInvite(page, poll);
      const joins = countJoinRequests(page);
      const field = nicknameField(page);
      if (value) {
        await field.click();
        await page.keyboard.insertText(value);
      }

      await joinButton(page).click();

      const error = page.getByText(COPY.nicknameEmpty, { exact: true });
      await expect(error).toBeVisible();
      await expect(field).toBeFocused();
      await expect(field).toHaveAttribute('aria-invalid', 'true');
      await page.keyboard.press('Space');
      await expect(error).toBeVisible();
      await page.keyboard.type('N');
      await expect(error).toHaveCount(0);
      expect(joins.count).toBe(0);
      expect(await participantNicknames(poll.id)).toEqual([]);
    });
  }

  test('a nickname already used in this poll, ignoring case, spaces and invisible characters, shows the taken error, keeps the text, focuses the field, and saves nothing', async ({ page, request }) => {
    const poll = await createPollViaApi(request);
    await joinViaApi(request, poll.inviteCode, 'Noa');
    await openInvite(page, poll);
    const field = nicknameField(page);
    const taken = page.getByText(COPY.nicknameTaken, { exact: true });

    for (const variant of ['Noa', 'NOA', '  noa ', `N${ch(0x200b)}oa`]) {
      // eslint-disable-next-line no-await-in-loop
      await field.fill(variant);
      // eslint-disable-next-line no-await-in-loop
      await expect(taken, `before joining with ${JSON.stringify(variant)}`).toHaveCount(0);
      // eslint-disable-next-line no-await-in-loop
      await joinButton(page).click();
      // eslint-disable-next-line no-await-in-loop
      await expect(taken).toBeVisible();
      // eslint-disable-next-line no-await-in-loop
      await expect(field).toHaveValue(variant);
      // eslint-disable-next-line no-await-in-loop
      await expect(field).toBeFocused();
    }

    await page.keyboard.type('h');
    await expect(taken).toHaveCount(0);
    expect(await participantNicknames(poll.id)).toEqual(['Noa']);
  });

  test('while joining, the button reads Joining… and the form is locked; a double click and repeated Enter save exactly one participant', async ({ page, request }) => {
    const poll = await createPollViaApi(request);
    await openInvite(page, poll);
    const joins = countJoinRequests(page);
    const saving = gate();
    await page.route(`**/api/invites/${poll.inviteCode}/participants`, async (route) => {
      await saving.opened;
      return route.continue();
    });
    await nicknameField(page).fill('Noa');

    await joinButton(page).dblclick();

    const joining = page.getByRole('button', { name: COPY.joining, exact: true });
    await expect(joining).toBeVisible();
    await expect(joining).toHaveAttribute('aria-disabled', 'true');
    await expect(nicknameField(page)).not.toBeEditable();
    await joining.click({ force: true });
    await nicknameField(page).press('Enter');
    await page.keyboard.press('Enter');
    saving.release();

    await expect(joinedHeading(page, 'Noa')).toBeVisible();
    expect(joins.count).toBe(1);
    expect(await participantNicknames(poll.id)).toEqual(['Noa']);
  });

  for (const failure of FAILURES) {
    test(`after ${failure.name} while joining, the join error shows above the button, the nickname is kept, and a retry saves one participant`, async ({ page, request }) => {
      const poll = await createPollViaApi(request);
      await openInvite(page, poll);
      let failNext = true;
      await page.route(`**/api/invites/${poll.inviteCode}/participants`, async (route) => {
        if (failNext) {
          failNext = false;
          return failure.fail(route);
        }
        return route.fallback();
      });

      await joinWith(page, 'Noa');

      const alert = page.getByRole('alert');
      await expect(alert).toHaveText(COPY.joinFailed);
      await expect(nicknameField(page)).toHaveValue('Noa');
      await expect(nicknameField(page)).toBeEditable();
      await expect(joinButton(page)).not.toHaveAttribute('aria-disabled', 'true');
      const [alertBox, buttonBox] = await Promise.all([alert.boundingBox(), joinButton(page).boundingBox()]);
      expect(alertBox.y + alertBox.height).toBeLessThanOrEqual(buttonBox.y);

      await joinButton(page).click();

      await expect(joinedHeading(page, 'Noa')).toBeVisible();
      expect(await participantNicknames(poll.id)).toEqual(['Noa']);
    });
  }

  test('if the join is saved but the response is lost, a retry shows the joined screen without a taken error and saves one participant', async ({ page, request }) => {
    const poll = await createPollViaApi(request);
    await openInvite(page, poll);
    let lost = false;
    await page.route(`**/api/invites/${poll.inviteCode}/participants`, async (route) => {
      if (!lost) {
        lost = true;
        await route.fetch();
        return route.abort('connectionreset');
      }
      return route.fallback();
    });

    await joinWith(page, 'Noa');
    await expect(page.getByRole('alert')).toHaveText(COPY.joinFailed);
    expect(await participantNicknames(poll.id)).toEqual(['Noa']);

    await joinButton(page).click();

    await expect(joinedHeading(page, 'Noa')).toBeVisible();
    await expect(page.getByText(COPY.nicknameTaken, { exact: true })).toHaveCount(0);
    expect(await participantNicknames(poll.id)).toEqual(['Noa']);
  });

  test('after joining, the joined screen shows the trimmed nickname, status, option count, question and details, with focus on its heading', async ({ page, request }) => {
    const poll = await createPollViaApi(request, { details: 'Bring snacks.', options: ['Pizza', 'Sushi', 'Tacos', 'Salad'] });
    await openInvite(page, poll);

    await joinWith(page, '  Noa  ');

    const heading = joinedHeading(page, 'Noa');
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();
    const article = page.getByRole('article', { name: poll.question });
    await expect(article.getByText(COPY.open, { exact: true })).toBeVisible();
    await expect(article.getByText(COPY.optionCount(4), { exact: true })).toBeVisible();
    await expect(article.getByText('Bring snacks.', { exact: true })).toBeVisible();
    await expect(page.getByRole('textbox')).toHaveCount(0);
    await expect(page.getByRole('main').getByRole('button')).toHaveCount(0);
    expect(await participantNicknames(poll.id)).toEqual(['Noa']);
  });

  test('reloading, or opening the link in a new tab, after joining shows the joined screen with the same nickname and sends no new join', async ({ page, request }) => {
    const poll = await createPollViaApi(request);
    await openInvite(page, poll);
    const joins = countJoinRequests(page);
    await joinWith(page, 'Noa');
    await expect(joinedHeading(page, 'Noa')).toBeVisible();

    await page.reload();
    await expect(joinedHeading(page, 'Noa')).toBeVisible();
    await expect(nicknameField(page)).toHaveCount(0);

    const tab = await page.context().newPage();
    const tabJoins = countJoinRequests(tab);
    await tab.goto(invitePath(poll));
    await expect(joinedHeading(tab, 'Noa')).toBeVisible();
    await expect(nicknameField(tab)).toHaveCount(0);

    expect(joins.count).toBe(1);
    expect(tabJoins.count).toBe(0);
    expect(await participantNicknames(poll.id)).toEqual(['Noa']);
  });

  test('with two tabs on the nickname form, joining in both saves only the first nickname, and the second tab shows it', async ({ page, request }) => {
    const poll = await createPollViaApi(request);
    const second = await page.context().newPage();
    await openInvite(page, poll);
    await openInvite(second, poll);
    const secondJoins = countJoinRequests(second);

    await joinWith(page, 'Noa');
    await expect(joinedHeading(page, 'Noa')).toBeVisible();
    await joinWith(second, 'Dana');

    await expect(joinedHeading(second, 'Noa')).toBeVisible();
    expect(secondJoins.count).toBe(0);
    expect(await participantNicknames(poll.id)).toEqual(['Noa']);
  });

  test('a different browser is a new participant, and the nickname used on the first device is taken there', async ({ page, browser, request }) => {
    const poll = await createPollViaApi(request);
    await openInvite(page, poll);
    await joinWith(page, 'Noa');
    await expect(joinedHeading(page, 'Noa')).toBeVisible();

    const otherBrowser = await browser.newContext();
    try {
      const other = await otherBrowser.newPage();
      await other.goto(`${CLIENT_URL}${invitePath(poll)}`);
      await expect(nicknameField(other)).toHaveValue('');
      await joinWith(other, 'Noa');
      await expect(other.getByText(COPY.nicknameTaken, { exact: true })).toBeVisible();
      await joinWith(other, 'Noa 2');
      await expect(joinedHeading(other, 'Noa 2')).toBeVisible();
    } finally {
      await otherBrowser.close();
    }

    expect(await participantNicknames(poll.id)).toEqual(['Noa', 'Noa 2']);
  });

  test('the same nickname can join two different polls', async ({ page, request }) => {
    const first = await createPollViaApi(request);
    const second = await createPollViaApi(request);

    for (const poll of [first, second]) {
      // eslint-disable-next-line no-await-in-loop
      await openInvite(page, poll);
      // eslint-disable-next-line no-await-in-loop
      await joinWith(page, 'Noa');
      // eslint-disable-next-line no-await-in-loop
      await expect(joinedHeading(page, 'Noa')).toBeVisible();
    }

    expect(await participantNicknames(first.id)).toEqual(['Noa']);
    expect(await participantNicknames(second.id)).toEqual(['Noa']);
  });

  test('the poll\'s creator can open their own share link and join, with nothing prefilled', async ({ page, request }) => {
    const poll = await createPollViaApi(request);
    const sheet = await openShareSheet(page, poll);
    const link = await sheet.getByRole('group', { name: COPY.linkLabel }).textContent();

    await page.goto(link);
    await expect(eyebrowHeading(page)).toBeVisible();
    await expect(nicknameField(page)).toHaveValue('');
    await joinWith(page, 'Creator');

    await expect(joinedHeading(page, 'Creator')).toBeVisible();
    expect(await participantNicknames(poll.id)).toEqual(['Creator']);
  });

  test('joining still works on the page when the browser blocks storage', async ({ page, request }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new DOMException('Storage is blocked', 'SecurityError');
        },
      });
    });
    const poll = await createPollViaApi(request);
    await openInvite(page, poll);

    await joinWith(page, 'Noa');

    await expect(joinedHeading(page, 'Noa')).toBeVisible();
    expect(await participantNicknames(poll.id)).toEqual(['Noa']);
  });

  test('markup and script in the question, details and nickname are shown as plain text and never run', async ({ page, request }) => {
    const dialogs = [];
    page.on('dialog', (dialog) => {
      dialogs.push(dialog.message());
      dialog.dismiss();
    });
    const question = unique('<script>window.__xss = "question"</script>');
    const details = '<img src=x onerror="window.__xss = \'details\'">';
    const nickname = '<script>x</script>';
    const poll = await createPollViaApi(request, { question, details });

    await openInvite(page, poll);
    const article = page.getByRole('article', { name: question });
    await expect(article.getByRole('heading', { level: 2 })).toHaveText(question);
    await expect(article.getByText(details, { exact: true })).toBeVisible();
    await joinWith(page, nickname);
    await expect(joinedHeading(page, nickname)).toBeVisible();
    await page.reload();
    await expect(joinedHeading(page, nickname)).toBeVisible();

    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
    expect(dialogs).toEqual([]);
    await expect(page.getByRole('main').locator('script, img')).toHaveCount(0);
  });
});

test.describe('accessibility and responsiveness', () => {
  test('a keyboard-only user can open the share sheet, stays inside it with Tab and Shift+Tab, and Escape returns to Share poll, with the focus ring shown', async ({ page, request }) => {
    await stubShare(page, 'unsupported');
    const poll = await createPollViaApi(request);
    await page.goto(createdPath(poll));
    await expect(sharePollButton(page)).toBeVisible();

    await tabUntilFocused(page, sharePollButton(page));
    expect(await focusRing(page)).toEqual({ style: 'solid', color: FOCUS_RING_COLOR });
    await page.keyboard.press('Enter');

    const sheet = shareSheet(page);
    await expect(sheet.getByRole('button', { name: COPY.copy, exact: true })).toBeFocused();
    expect(await focusRing(page)).toEqual({ style: 'solid', color: FOCUS_RING_COLOR });
    for (const key of ['Tab', 'Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab']) {
      // eslint-disable-next-line no-await-in-loop
      await page.keyboard.press(key);
      // eslint-disable-next-line no-await-in-loop
      expect(await sheet.evaluate((el) => el.contains(document.activeElement) && el !== document.activeElement), key).toBe(true);
      // eslint-disable-next-line no-await-in-loop
      expect(await focusRing(page), key).toEqual({ style: 'solid', color: FOCUS_RING_COLOR });
    }

    await page.keyboard.press('Escape');
    await expect(sheet).toHaveCount(0);
    await expect(sharePollButton(page)).toBeFocused();
  });

  test('a keyboard-only user can join: Tab to the nickname field, type, and press Enter', async ({ page, request }) => {
    const poll = await createPollViaApi(request);
    await openInvite(page, poll);

    await tabUntilFocused(page, nicknameField(page));
    expect(await focusRing(page)).toEqual({ style: 'solid', color: FOCUS_RING_COLOR });
    await page.keyboard.type('Keys');
    await page.keyboard.press('Enter');

    await expect(joinedHeading(page, 'Keys')).toBeFocused();
    expect(await participantNicknames(poll.id)).toEqual(['Keys']);
  });

  test('every control on the confirmation screen, share sheet, invite page, joined screen and error pages is at least 44×44px', async ({ page, request }) => {
    await stubShare(page, 'supported');
    const poll = await createPollViaApi(request);
    const failures = {};

    await page.goto(createdPath(poll));
    await expect(sharePollButton(page)).toBeVisible();
    failures.confirmation = await controlsSmallerThanTouchTarget(page);
    await sharePollButton(page).click();
    await settleAnimations(page);
    failures.shareSheet = await controlsSmallerThanTouchTarget(page);

    await openInvite(page, poll);
    await joinButton(page).click();
    await expect(page.getByText(COPY.nicknameEmpty, { exact: true })).toBeVisible();
    failures.inviteWithError = await controlsSmallerThanTouchTarget(page);
    await joinWith(page, 'Noa');
    await expect(joinedHeading(page, 'Noa')).toBeVisible();
    failures.joined = await controlsSmallerThanTouchTarget(page);

    await page.goto('/i/Zz9aB8cD7e');
    await expect(brokenHeading(page)).toBeVisible();
    failures.broken = await controlsSmallerThanTouchTarget(page);

    const other = await createPollViaApi(request);
    await page.route(`**/api/invites/${other.inviteCode}`, (route) => route.fulfill(SERVER_ERROR));
    await page.goto(invitePath(other));
    await expect(page.getByRole('button', { name: COPY.tryAgain, exact: true })).toBeVisible();
    failures.loadError = await controlsSmallerThanTouchTarget(page);

    expect(failures).toEqual({ confirmation: [], shareSheet: [], inviteWithError: [], joined: [], broken: [], loadError: [] });
  });

  test('the share sheet, invite page, nickname error, join error, joined screen, broken link and load error have no WCAG 2.2 AA violations', async ({ page, request }) => {
    await stubShare(page, 'supported');
    const poll = await createPollViaApi(request, { details: 'Some context' });
    const violations = [];

    await openShareSheet(page, poll);
    await settleAnimations(page);
    violations.push(...(await axeViolations(page, 'share sheet')));

    await openInvite(page, poll);
    violations.push(...(await axeViolations(page, 'invite page')));
    await joinButton(page).click();
    await expect(page.getByText(COPY.nicknameEmpty, { exact: true })).toBeVisible();
    violations.push(...(await axeViolations(page, 'nickname error')));

    await page.route(`**/api/invites/${poll.inviteCode}/participants`, (route) => route.fulfill(SERVER_ERROR), { times: 1 });
    await joinWith(page, 'Noa');
    await expect(page.getByRole('alert')).toHaveText(COPY.joinFailed);
    violations.push(...(await axeViolations(page, 'join error')));

    await joinButton(page).click();
    await expect(joinedHeading(page, 'Noa')).toBeVisible();
    await settleAnimations(page);
    violations.push(...(await axeViolations(page, 'joined screen')));

    await page.goto('/i/Zz9aB8cD7e');
    await expect(brokenHeading(page)).toBeVisible();
    violations.push(...(await axeViolations(page, 'broken link')));

    const other = await createPollViaApi(request);
    await page.route(`**/api/invites/${other.inviteCode}`, (route) => route.fulfill(SERVER_ERROR));
    await page.goto(invitePath(other));
    await expect(page.getByRole('button', { name: COPY.tryAgain, exact: true })).toBeVisible();
    violations.push(...(await axeViolations(page, 'load error')));

    expect(violations).toEqual([]);
  });

  test('the longest question and details, and a 20-character nickname with emoji and right-to-left text, show in full with no horizontal scroll', async ({ page, request }) => {
    const question = `${unique('לאן נצא בחמישי?')} ${'Pneumonoultramicroscopicsilicovolcanoconiosis'.repeat(5)}`.slice(0, 200).trim();
    const details = Array.from({ length: 40 }, (_, i) => `Line ${i}: ${'details '.repeat(4)}`).join('\n').slice(0, 1000).trim();
    const nickname = `נועה${ch(0x1f355).repeat(8)}`;
    expect(nickname.length).toBe(20);
    const poll = await createPollViaApi(request, { question, details });
    const clippedText = () =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll('main h1, main h2, main p'))
          .filter((el) => el.scrollWidth > el.clientWidth + 1)
          .map((el) => el.textContent.slice(0, 20)),
      );

    await openInvite(page, poll);
    await expect(page.getByRole('article').getByRole('heading', { level: 2 })).toHaveText(question);
    await expectNoHorizontalScroll(page);
    expect(await clippedText()).toEqual([]);

    await joinWith(page, nickname);

    await expect(joinedHeading(page, nickname)).toBeVisible();
    await expectNoHorizontalScroll(page);
    expect(await clippedText()).toEqual([]);
  });

  test('at 200% text size the share sheet shows the full link wrapped, and the invite page and joined screen lose nothing horizontally', async ({ page, request }) => {
    const poll = await createPollViaApi(request);
    const enlargeText = () => page.addStyleTag({ content: 'html { font-size: 200% !important; }' });

    await page.goto(createdPath(poll));
    await enlargeText();
    await sharePollButton(page).click();
    const link = shareSheet(page).getByRole('group', { name: COPY.linkLabel });
    await expect(link).toHaveText(inviteLinkOf(poll));
    expect(await link.locator('span').evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await expectNoHorizontalScroll(page);

    await page.goto(invitePath(poll));
    await enlargeText();
    await expect(eyebrowHeading(page)).toBeVisible();
    await expectNoHorizontalScroll(page);
    await joinWith(page, 'Noa');
    await expect(joinedHeading(page, 'Noa')).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('the share sheet appears without animation', async ({ page, request }) => {
      const poll = await createPollViaApi(request);

      const sheet = await openShareSheet(page, poll);

      expect(await sheet.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
    });
  });
});
