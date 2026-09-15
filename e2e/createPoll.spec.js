// QA end-to-end tests for Create poll. Oracle: specs/features/2026-09-14-create-poll.md.
const { randomUUID } = require('crypto');
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { API_URL } = require('./helpers/env');
const { countPollsByQuestion, insertForeignPoll } = require('./helpers/db');

// Word for word from the spec's UI Copy table.
const COPY = {
  landingHeading: 'Welcome',
  landingIntro: 'Create a poll and share it with others.',
  landingButton: 'Create poll',
  formHeading: 'Create a poll',
  questionLabel: 'Question',
  questionPlaceholder: 'What do you want to ask?',
  addDetails: 'Add details',
  detailsLabel: 'Details (optional)',
  detailsPlaceholder: 'Add context for the people answering.',
  removeDetails: 'Remove details',
  answerTypeLabel: 'Answer type',
  single: 'Single choice — people pick one answer',
  multiple: 'Multiple choice — people can pick more than one answer',
  optionsLabel: 'Options',
  optionsHelper: 'Add 2 to 8 options. Drag to reorder.',
  addOption: 'Add option',
  addOptionHint: 'You can add up to 8 options.',
  createButton: 'Create poll',
  creatingButton: 'Creating…',
  cancelButton: 'Cancel',
  questionError: 'Enter a question.',
  optionEmptyError: 'Fill in this option or remove it.',
  optionDuplicateError: 'This option is already in the list.',
  saveError: "Couldn't create your poll. Check your connection and try again.",
  discardTitle: 'Discard this poll?',
  discardBody: "What you've entered will be lost.",
  discard: 'Discard',
  keepEditing: 'Keep editing',
  confirmHeading: 'Poll created',
  confirmIntro: 'Your poll is open and ready for answers.',
  confirmSingle: 'Single choice',
  confirmMultiple: 'Multiple choice',
  confirmStatus: 'Open',
  backHome: 'Back to home',
  createAnother: 'Create another poll',
  loading: 'Loading poll…',
  loadError: "We couldn't load this poll.",
};

const FOCUS_RING_COLOR = 'rgb(15, 118, 110)'; // --color-focus
const TOUCH_TARGET_MIN = 44; // --touch-target-min

const unique = (label) => `${label} ${randomUUID().slice(0, 8)}`;
const isCreateRequest = (req) => req.method() === 'POST' && new URL(req.url()).pathname === '/api/polls';

const question = (page) => page.getByRole('textbox', { name: COPY.questionLabel, exact: true });
const details = (page) => page.getByRole('textbox', { name: COPY.detailsLabel, exact: true });
const option = (page, n) => page.getByRole('textbox', { name: `Option ${n}`, exact: true });
const optionFields = (page) => page.getByRole('textbox', { name: /^Option \d$/ });
const createButton = (page) => page.getByRole('button', { name: COPY.createButton, exact: true });
const addOptionButton = (page) => page.getByRole('button', { name: COPY.addOption, exact: true });
const dragHandle = (page, n) => page.getByRole('button', { name: `Drag to reorder option ${n}`, exact: true });

function countCreateRequests(page) {
  const counter = { count: 0 };
  page.on('request', (req) => {
    if (isCreateRequest(req)) counter.count += 1;
  });
  return counter;
}

async function fillPoll(page, { questionText, options = ['Pizza', 'Sushi'] }) {
  await question(page).fill(questionText);
  for (let i = 0; i < options.length; i += 1) {
    if (i >= 2) {
      // eslint-disable-next-line no-await-in-loop
      await addOptionButton(page).click();
    }
    // eslint-disable-next-line no-await-in-loop
    await option(page, i + 1).fill(options[i]);
  }
}

async function optionValues(page) {
  return optionFields(page).evaluateAll((fields) => fields.map((field) => field.value));
}

async function expectNoHorizontalScroll(page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
}

async function createPollViaApi(request, overrides = {}) {
  const res = await request.post(`${API_URL}/polls`, {
    data: {
      question: unique('API poll'),
      answerType: 'single',
      options: ['Yes', 'No'],
      clientRequestId: randomUUID(),
      ...overrides,
    },
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data;
}

function gate() {
  let release;
  const opened = new Promise((resolve) => {
    release = resolve;
  });
  return { opened, release };
}

// Drags a handle to a target point with a mouse, or with real touch events on touch projects.
async function dragTo(page, handle, targetY, useTouch) {
  await handle.scrollIntoViewIfNeeded();
  const box = await handle.boundingBox();
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  const steps = 12;

  if (useTouch) {
    const cdp = await page.context().newCDPSession(page);
    const touch = (type, y) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: type === 'touchEnd' ? [] : [{ x: startX, y, id: 1 }],
      });
    await touch('touchStart', startY);
    for (let i = 1; i <= steps; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await touch('touchMove', startY + ((targetY - startY) * i) / steps);
    }
    await touch('touchEnd', targetY);
    await cdp.detach();
    return;
  }

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX, targetY, { steps });
  await page.mouse.up();
}

async function axeViolations(page, screen) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  return results.violations.map((v) => `${screen}: ${v.id} — ${v.help} (${v.nodes.length})`);
}

test.describe('landing page', () => {
  test('the app opens on the landing page, and Create poll opens the form', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(COPY.landingHeading);
    await expect(page.getByText(COPY.landingIntro, { exact: true })).toBeVisible();

    await page.getByRole('button', { name: COPY.landingButton, exact: true }).click();

    await expect(page).toHaveURL(/\/polls\/new$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(COPY.formHeading);
  });
});

test.describe('create poll form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/polls/new');
  });

  test('opens with an empty question, hidden details, Single choice, and exactly two empty options', async ({ page }) => {
    await expect(question(page)).toHaveValue('');
    await expect(question(page)).toHaveAttribute('placeholder', COPY.questionPlaceholder);
    await expect(page.getByText('0/200', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: COPY.addDetails, exact: true })).toBeVisible();
    await expect(details(page)).toHaveCount(0);
    await expect(page.getByRole('group', { name: COPY.answerTypeLabel })).toBeVisible();
    await expect(page.getByRole('radio', { name: COPY.single })).toBeChecked();
    await expect(page.getByRole('radio', { name: COPY.multiple })).not.toBeChecked();
    await expect(page.getByRole('group', { name: COPY.optionsLabel })).toBeVisible();
    await expect(page.getByText(COPY.optionsHelper, { exact: true })).toBeVisible();
    await expect(optionFields(page)).toHaveCount(2);
    await expect(option(page, 1)).toHaveValue('');
    await expect(option(page, 1)).toHaveAttribute('placeholder', 'Option 1');
    await expect(option(page, 2)).toHaveAttribute('placeholder', 'Option 2');
    await expect(page.getByRole('button', { name: /^Remove option/ })).toHaveCount(0);
    await expect(createButton(page)).toBeVisible();
    await expect(page.getByRole('button', { name: COPY.cancelButton, exact: true })).toBeVisible();
  });

  test('typed and pasted text is cut at 200, 1000, and 100 characters and each counter shows the maximum', async ({ page }) => {
    await question(page).click();
    await page.keyboard.insertText('q'.repeat(250));
    await expect(question(page)).toHaveValue('q'.repeat(200));
    await expect(page.getByText('200/200', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: COPY.addDetails, exact: true }).click();
    await expect(details(page)).toBeFocused();
    await expect(details(page)).toHaveAttribute('placeholder', COPY.detailsPlaceholder);
    await page.keyboard.insertText('d'.repeat(1100));
    await expect(details(page)).toHaveValue('d'.repeat(1000));
    await expect(page.getByText('1000/1000', { exact: true })).toBeVisible();

    await option(page, 1).click();
    await page.keyboard.insertText('o'.repeat(150));
    await expect(option(page, 1)).toHaveValue('o'.repeat(100));
    await expect(page.getByText('100/100', { exact: true })).toBeVisible();
  });

  test('Remove details hides the details field and its text is not saved', async ({ page }) => {
    const questionText = unique('Details removed');
    await fillPoll(page, { questionText });
    await page.getByRole('button', { name: COPY.addDetails, exact: true }).click();
    await details(page).fill('Secret context that must not be saved');
    await page.getByRole('button', { name: COPY.removeDetails, exact: true }).click();
    await expect(details(page)).toHaveCount(0);

    const createRequest = page.waitForRequest(isCreateRequest);
    await createButton(page).click();

    expect((await createRequest).postDataJSON().details).toBeNull();
    await expect(page.getByRole('heading', { level: 1, name: COPY.confirmHeading })).toBeVisible();
    await expect(page.getByText('Secret context that must not be saved')).toHaveCount(0);
  });

  test('Add option focuses each new option up to 8, then is disabled with the limit hint', async ({ page }) => {
    for (let n = 3; n <= 8; n += 1) {
      // eslint-disable-next-line no-await-in-loop
      await addOptionButton(page).click();
      // eslint-disable-next-line no-await-in-loop
      await expect(option(page, n)).toBeFocused();
      // eslint-disable-next-line no-await-in-loop
      await expect(option(page, n)).toHaveValue('');
    }

    await expect(optionFields(page)).toHaveCount(8);
    await expect(addOptionButton(page)).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByText(COPY.addOptionHint, { exact: true })).toBeVisible();

    // A user can still tap the aria-disabled button; Playwright needs force to do the same.
    await addOptionButton(page).click({ force: true });
    await expect(optionFields(page)).toHaveCount(8);
  });

  test('remove buttons appear only above two options, and removing one deletes it and renumbers the rest', async ({ page }) => {
    await fillPoll(page, { questionText: unique('Remove'), options: ['Pizza', 'Sushi'] });
    await expect(page.getByRole('button', { name: /^Remove option/ })).toHaveCount(0);

    await addOptionButton(page).click();
    await option(page, 3).fill('Tacos');
    await expect(page.getByRole('button', { name: /^Remove option/ })).toHaveCount(3);

    await page.getByRole('button', { name: 'Remove option 2', exact: true }).click();

    expect(await optionValues(page)).toEqual(['Pizza', 'Tacos']);
    await expect(option(page, 2)).toHaveValue('Tacos');
    await expect(page.getByRole('button', { name: /^Remove option/ })).toHaveCount(0);
  });

  test('dragging an option by its handle moves it, and the new order is the order saved', async ({ page }, testInfo) => {
    const questionText = unique('Drag order');
    await fillPoll(page, { questionText, options: ['Pizza', 'Sushi', 'Tacos'] });

    const lastRow = page.getByRole('listitem').filter({ has: option(page, 3) });
    await lastRow.scrollIntoViewIfNeeded();
    const lastBox = await lastRow.boundingBox();
    await dragTo(page, dragHandle(page, 1), lastBox.y + lastBox.height - 4, Boolean(testInfo.project.use.hasTouch));

    await expect.poll(() => optionValues(page)).toEqual(['Sushi', 'Tacos', 'Pizza']);

    const createRequest = page.waitForRequest(isCreateRequest);
    await createButton(page).click();
    expect((await createRequest).postDataJSON().options).toEqual(['Sushi', 'Tacos', 'Pizza']);

    const items = page.getByRole('article').getByRole('listitem');
    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toContainText('Sushi');
    await expect(items.nth(1)).toContainText('Tacos');
    await expect(items.nth(2)).toContainText('Pizza');
  });

  test('submitting an empty form shows every field error, focuses the question, and sends nothing', async ({ page }) => {
    const creates = countCreateRequests(page);

    await createButton(page).click();

    await expect(page.getByText(COPY.questionError, { exact: true })).toBeVisible();
    await expect(page.getByText(COPY.optionEmptyError, { exact: true })).toHaveCount(2);
    await expect(question(page)).toBeFocused();
    await expect(question(page)).toHaveAccessibleDescription(new RegExp(COPY.questionError.replace('.', '\\.')));
    expect(creates.count).toBe(0);
  });

  test('a spaces-only question and option count as empty and nothing is saved', async ({ page }) => {
    const creates = countCreateRequests(page);
    await question(page).fill('     ');
    await option(page, 1).fill('   ');
    await option(page, 2).fill('Sushi');

    await createButton(page).click();

    await expect(page.getByText(COPY.questionError, { exact: true })).toBeVisible();
    await expect(option(page, 1)).toHaveAccessibleDescription(/Fill in this option or remove it\./);
    await expect(page.getByText(COPY.optionEmptyError, { exact: true })).toHaveCount(1);
    expect(creates.count).toBe(0);
  });

  test('options that match after trimming and ignoring case show the duplicate error and nothing is saved', async ({ page }) => {
    const creates = countCreateRequests(page);
    await fillPoll(page, { questionText: unique('Duplicates'), options: ['Yes', '  YES '] });

    await createButton(page).click();

    await expect(option(page, 2)).toHaveAccessibleDescription(/This option is already in the list\./);
    await expect(option(page, 2)).toBeFocused();
    expect(creates.count).toBe(0);
  });

  test('focus moves to the first invalid field, and each error clears as soon as its field is valid', async ({ page }) => {
    await option(page, 1).fill('Pizza');
    await createButton(page).click();
    await expect(question(page)).toBeFocused();
    await expect(page.getByText(COPY.questionError, { exact: true })).toBeVisible();

    await question(page).fill('Lunch?');
    await expect(page.getByText(COPY.questionError, { exact: true })).toHaveCount(0);
    await expect(page.getByText(COPY.optionEmptyError, { exact: true })).toHaveCount(1);

    await createButton(page).click();
    await expect(option(page, 2)).toBeFocused();
    await option(page, 2).fill('Sushi');
    await expect(page.getByText(COPY.optionEmptyError, { exact: true })).toHaveCount(0);
  });

  test('while saving, the button reads Creating… and the form cannot be edited or submitted again; repeated clicks create one poll', async ({ page }) => {
    const questionText = unique('Saving lock');
    const creates = countCreateRequests(page);
    const saving = gate();
    await page.route('**/api/polls', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      await saving.opened;
      return route.continue();
    });
    await fillPoll(page, { questionText });

    await createButton(page).dblclick();

    const creating = page.getByRole('button', { name: COPY.creatingButton, exact: true });
    await expect(creating).toBeVisible();
    await expect(creating).toHaveAttribute('aria-disabled', 'true');
    await expect(question(page)).not.toBeEditable();
    await expect(option(page, 1)).not.toBeEditable();
    await expect(page.getByRole('radio', { name: COPY.multiple })).toBeDisabled();
    await expect(page.getByRole('button', { name: COPY.cancelButton, exact: true })).toBeDisabled();
    await expect(addOptionButton(page)).toBeDisabled();
    // Extra taps and Enter on the locked button; Playwright needs force to tap an aria-disabled button.
    await creating.click({ force: true });
    await page.keyboard.press('Enter');

    saving.release();

    await expect(page.getByRole('heading', { level: 1, name: COPY.confirmHeading })).toBeVisible();
    expect(creates.count).toBe(1);
    expect(await countPollsByQuestion(questionText)).toBe(1);
  });

  for (const failure of [
    {
      name: 'a server error',
      fail: (route) =>
        route.fulfill({ status: 500, contentType: 'application/json', body: '{"data":null,"error":"Something went wrong"}' }),
    },
    { name: 'a network failure', fail: (route) => route.abort('failed') },
  ]) {
    test(`after ${failure.name} while saving, all input is kept, the form error shows, and a retry creates exactly one poll`, async ({ page }) => {
      const questionText = unique('Save failure');
      let failNext = true;
      await page.route('**/api/polls', async (route) => {
        if (route.request().method() === 'POST' && failNext) {
          failNext = false;
          return failure.fail(route);
        }
        return route.fallback();
      });
      await fillPoll(page, { questionText, options: ['Pizza', 'Sushi', 'Tacos'] });
      await page.getByRole('button', { name: COPY.addDetails, exact: true }).click();
      await details(page).fill('Team lunch');
      await page.getByText(COPY.multiple, { exact: true }).click();

      await createButton(page).click();

      await expect(page.getByRole('alert')).toHaveText(COPY.saveError);
      await expect(question(page)).toHaveValue(questionText);
      await expect(details(page)).toHaveValue('Team lunch');
      await expect(page.getByRole('radio', { name: COPY.multiple })).toBeChecked();
      expect(await optionValues(page)).toEqual(['Pizza', 'Sushi', 'Tacos']);
      await expect(question(page)).toBeEditable();
      await expect(createButton(page)).not.toHaveAttribute('aria-disabled', 'true');

      await createButton(page).click();

      await expect(page.getByRole('heading', { level: 1, name: COPY.confirmHeading })).toBeVisible();
      expect(await countPollsByQuestion(questionText)).toBe(1);
    });
  }

  test('if the poll is saved but the response is lost, a retry shows that same poll and creates no duplicate', async ({ page }) => {
    const questionText = unique('Lost response');
    let firstId = null;
    await page.route('**/api/polls', async (route) => {
      if (route.request().method() === 'POST' && firstId === null) {
        const response = await route.fetch();
        firstId = (await response.json()).data.id;
        return route.abort('connectionreset');
      }
      return route.fallback();
    });
    await fillPoll(page, { questionText });

    await createButton(page).click();
    await expect(page.getByRole('alert')).toHaveText(COPY.saveError);
    expect(await countPollsByQuestion(questionText)).toBe(1);

    await createButton(page).click();

    await expect(page.getByRole('heading', { level: 1, name: COPY.confirmHeading })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/polls/${firstId}/created$`));
    expect(await countPollsByQuestion(questionText)).toBe(1);
  });

  test('a saved poll stores trimmed text, the answer type, and the displayed order, and the confirmation shows it all with status Open', async ({ page, request }) => {
    const questionText = unique('Trimmed');
    await question(page).fill(`   ${questionText}   `);
    await page.getByRole('button', { name: COPY.addDetails, exact: true }).click();
    await details(page).fill('  Line one\nLine two  ');
    await page.getByText(COPY.multiple, { exact: true }).click();
    await option(page, 1).fill('  Pizza ');
    await option(page, 2).fill('Sushi');
    await addOptionButton(page).click();
    await option(page, 3).fill(' Tacos  ');

    await createButton(page).click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(COPY.confirmHeading);
    await expect(page.getByText(COPY.confirmIntro, { exact: true })).toBeVisible();
    const summary = page.getByRole('article', { name: questionText });
    await expect(summary.getByRole('heading', { level: 2 })).toHaveText(questionText);
    await expect(summary).toContainText('Line one');
    await expect(summary).toContainText('Line two');
    await expect(summary.getByText(COPY.confirmMultiple, { exact: true })).toBeVisible();
    await expect(summary.getByText(COPY.confirmStatus, { exact: true })).toBeVisible();
    const items = summary.getByRole('listitem');
    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toContainText('Pizza');
    await expect(items.nth(2)).toContainText('Tacos');
    await expect(page.getByRole('button', { name: COPY.backHome, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: COPY.createAnother, exact: true })).toBeVisible();

    const pollId = page.url().match(/\/polls\/([^/]+)\/created$/)[1];
    const stored = (await (await request.get(`${API_URL}/polls/${pollId}`)).json()).data;
    expect(stored).toMatchObject({
      question: questionText,
      details: 'Line one\nLine two',
      answerType: 'multiple',
      status: 'open',
    });
    expect(stored.options.map((o) => o.text)).toEqual(['Pizza', 'Sushi', 'Tacos']);
  });

  test('Cancel on an untouched form returns to the landing page without asking', async ({ page }) => {
    await page.getByRole('button', { name: COPY.cancelButton, exact: true }).click();

    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(COPY.landingHeading);
  });

  test('Cancel after typing asks first; Keep editing and Escape both keep the input', async ({ page }) => {
    await question(page).fill('Half-filled question');

    await page.getByRole('button', { name: COPY.cancelButton, exact: true }).click();
    const dialog = page.getByRole('alertdialog', { name: COPY.discardTitle });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleDescription(COPY.discardBody);
    await expect(dialog.getByRole('button', { name: COPY.keepEditing, exact: true })).toBeFocused();
    await dialog.getByRole('button', { name: COPY.keepEditing, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(question(page)).toHaveValue('Half-filled question');

    await page.getByRole('button', { name: COPY.cancelButton, exact: true }).click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(question(page)).toHaveValue('Half-filled question');
    await expect(page.getByRole('button', { name: COPY.cancelButton, exact: true })).toBeFocused();
  });

  test('Discard returns to the landing page and saves nothing', async ({ page }) => {
    const questionText = unique('Discarded');
    const creates = countCreateRequests(page);
    await fillPoll(page, { questionText });

    await page.getByRole('button', { name: COPY.cancelButton, exact: true }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: COPY.discard, exact: true }).click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(COPY.landingHeading);
    expect(creates.count).toBe(0);
    expect(await countPollsByQuestion(questionText)).toBe(0);
  });

  test('the discard dialog traps focus and returns it to Cancel when closed', async ({ page }) => {
    await question(page).fill('Something');
    await page.getByRole('button', { name: COPY.cancelButton, exact: true }).click();
    const dialog = page.getByRole('alertdialog');
    const keepEditing = dialog.getByRole('button', { name: COPY.keepEditing, exact: true });
    const discard = dialog.getByRole('button', { name: COPY.discard, exact: true });

    await expect(keepEditing).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(discard).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(keepEditing).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(discard).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: COPY.cancelButton, exact: true })).toBeFocused();
  });

  test('markup and script in every text field are shown as plain text and never run', async ({ page }) => {
    const dialogs = [];
    page.on('dialog', (d) => {
      dialogs.push(d.message());
      d.dismiss();
    });
    const questionText = unique('<script>window.__xss = "question"</script>');
    const imagePayload = '<img src=x onerror="window.__xss = \'img\'">';
    await fillPoll(page, { questionText, options: [imagePayload, '<b>bold</b>'] });
    await page.getByRole('button', { name: COPY.addDetails, exact: true }).click();
    await details(page).fill('<svg onload="alert(1)"></svg>');

    await createButton(page).click();
    const summary = page.getByRole('article', { name: questionText });
    await expect(summary.getByRole('heading', { level: 2 })).toHaveText(questionText);
    await expect(summary.getByText(imagePayload, { exact: true })).toBeVisible();
    await expect(summary.getByText('<b>bold</b>', { exact: true })).toBeVisible();
    await expect(summary.getByText('<svg onload="alert(1)"></svg>', { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('article', { name: questionText })).toBeVisible();

    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
    expect(dialogs).toEqual([]);
    await expect(summary.locator('script, img, b, svg:not([aria-hidden="true"])')).toHaveCount(0);
  });

  test('the longest allowed poll with RTL text, emoji, and unbroken words wraps in full with no horizontal scroll', async ({ page }) => {
    const longQuestion = `${unique('לאן נצא בחמישי? 🍕')} ${'Pneumonoultramicroscopicsilicovolcanoconiosis'.repeat(4)}`.slice(0, 200);
    const longDetails = Array.from({ length: 40 }, (_, i) => `Line ${i}: ${'details '.repeat(4)}`).join('\n').slice(0, 1000);
    const longOptions = [
      'a'.repeat(100),
      `אפשרות ארוכה מאוד בעברית עם אימוג׳י 🎉 ${'מילה '.repeat(20)}`.slice(0, 100),
      ...Array.from({ length: 6 }, (_, i) => `Option ${i + 3} ${'long text '.repeat(12)}`.slice(0, 100)),
    ];

    await fillPoll(page, { questionText: longQuestion, options: longOptions });
    await page.getByRole('button', { name: COPY.addDetails, exact: true }).click();
    await details(page).fill(longDetails);
    await expectNoHorizontalScroll(page);
    // No text hidden: any vertical overflow must fit inside the field's bottom padding.
    const fieldsHidingText = await page.getByRole('textbox').evaluateAll((fields) =>
      fields
        .filter((f) => {
          const paddingBottom = parseFloat(getComputedStyle(f).paddingBottom);
          return f.scrollHeight - f.clientHeight > paddingBottom || f.scrollWidth > f.clientWidth + 1;
        })
        .map((f) => f.id),
    );
    expect(fieldsHidingText).toEqual([]);

    await createButton(page).click();

    const summary = page.getByRole('article', { name: longQuestion.trim() });
    await expect(summary.getByRole('heading', { level: 2 })).toHaveText(longQuestion.trim());
    await expect(summary.getByRole('listitem')).toHaveCount(8);
    for (const text of longOptions) {
      // eslint-disable-next-line no-await-in-loop
      await expect(summary.getByText(text.trim(), { exact: true })).toBeVisible();
    }
    await expectNoHorizontalScroll(page);
    const clippedText = await summary.evaluate((article) =>
      Array.from(article.querySelectorAll('h2, p, li span[dir]'))
        .filter((el) => el.scrollWidth > el.clientWidth + 1)
        .map((el) => el.textContent.slice(0, 20)),
    );
    expect(clippedText).toEqual([]);
  });

  test('a keyboard-only user can fill in and create a poll, with the focus ring on every focused control', async ({ page }) => {
    const questionText = unique('Keyboard only');
    const focusRing = () =>
      page.evaluate(() => {
        const el = document.activeElement;
        const target = el.type === 'radio' ? el.closest('label') : el;
        const style = getComputedStyle(target);
        return { style: style.outlineStyle, color: style.outlineColor };
      });

    await page.goto('/');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: COPY.landingButton, exact: true })).toBeFocused();
    expect(await focusRing()).toEqual({ style: 'solid', color: FOCUS_RING_COLOR });
    await page.keyboard.press('Enter');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(COPY.formHeading);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(question(page)).toBeFocused();
    expect(await focusRing()).toEqual({ style: 'solid', color: FOCUS_RING_COLOR });
    await page.keyboard.type(questionText);

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: COPY.addDetails, exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('radio', { name: COPY.single })).toBeFocused();
    expect(await focusRing()).toEqual({ style: 'solid', color: FOCUS_RING_COLOR });
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('radio', { name: COPY.multiple })).toBeChecked();

    await option(page, 1).focus();
    await page.keyboard.type('Pizza');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(option(page, 2)).toBeFocused();
    await page.keyboard.type('Sushi');
    await page.keyboard.press('Tab');
    await expect(addOptionButton(page)).toBeFocused();
    expect(await focusRing()).toEqual({ style: 'solid', color: FOCUS_RING_COLOR });
    await page.keyboard.press('Enter');
    await expect(option(page, 3)).toBeFocused();
    await page.keyboard.type('Tacos');

    for (let i = 0; i < 8; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const onCreate = await createButton(page).evaluate((el) => el === document.activeElement);
      if (onCreate) break;
      // eslint-disable-next-line no-await-in-loop
      await page.keyboard.press('Tab');
    }
    await expect(createButton(page)).toBeFocused();
    const createRequest = page.waitForRequest(isCreateRequest);
    await page.keyboard.press('Enter');

    const payload = (await createRequest).postDataJSON();
    expect(payload).toMatchObject({ question: questionText, answerType: 'multiple', options: ['Pizza', 'Sushi', 'Tacos'] });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(COPY.confirmHeading);
  });
});

// Regression tests for open bugs (QA Report, Bugs). Marked test.fail() until dev fixes each bug.
test.describe('regression tests for open bugs', () => {
  test('BUG-01: a question of only zero-width spaces shows the empty-question error and saves nothing', async ({ page }) => {
    const creates = countCreateRequests(page);
    await page.goto('/polls/new');
    await question(page).fill('\u200B\u200B\u200B');
    await option(page, 1).fill('Pizza');
    await option(page, 2).fill('Sushi');

    await createButton(page).click();

    await expect(page.getByText(COPY.questionError, { exact: true })).toBeVisible({ timeout: 3000 });
    expect(creates.count).toBe(0);
  });

  test('BUG-06: auto-growing text fields are tall enough for their content, borders included', async ({ page }) => {
    await page.goto('/polls/new');
    await question(page).fill('A question long enough to wrap onto a second line on narrow screens, and then some more words');
    await option(page, 1).fill('Pizza');

    const tooShort = await page.getByRole('textbox').evaluateAll((fields) =>
      fields.filter((f) => f.scrollHeight > f.clientHeight + 1).map((f) => f.id + ': ' + (f.scrollHeight - f.clientHeight) + 'px'),
    );
    expect(tooShort).toEqual([]);
  });
});

test.describe('confirmation screen', () => {
  test('Back to home opens the landing page and Create another poll opens an empty form', async ({ page, request }) => {
    const poll = await createPollViaApi(request);

    await page.goto(`/polls/${poll.id}/created`);
    await page.getByRole('button', { name: COPY.createAnother, exact: true }).click();
    await expect(page).toHaveURL(/\/polls\/new$/);
    await expect(question(page)).toHaveValue('');
    await expect(optionFields(page)).toHaveCount(2);
    await expect(page.getByRole('radio', { name: COPY.single })).toBeChecked();

    await page.goto(`/polls/${poll.id}/created`);
    await page.getByRole('button', { name: COPY.backHome, exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(COPY.landingHeading);
  });

  test('reloading the confirmation shows Loading poll… and then the same poll', async ({ page }) => {
    const questionText = unique('Reload');
    await page.goto('/polls/new');
    await fillPoll(page, { questionText });
    await createButton(page).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(COPY.confirmHeading);

    const loading = gate();
    await page.route('**/api/polls/*', async (route) => {
      await loading.opened;
      return route.fallback();
    });
    await page.reload();

    await expect(page.getByRole('status')).toHaveText(COPY.loading);
    loading.release();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(COPY.confirmHeading);
    await expect(page.getByRole('article', { name: questionText })).toBeVisible();
  });

  test('a poll that does not exist, belongs to another user, or has a malformed id shows the load error with Back to home', async ({ page }) => {
    const foreignQuestion = unique('Another user private poll');
    const foreignId = await insertForeignPoll(foreignQuestion);

    for (const id of [randomUUID(), foreignId, 'not-a-poll-id']) {
      // eslint-disable-next-line no-await-in-loop
      await page.goto(`/polls/${id}/created`);
      // eslint-disable-next-line no-await-in-loop
      await expect(page.getByRole('alert')).toHaveText(COPY.loadError);
      // eslint-disable-next-line no-await-in-loop
      await expect(page.getByRole('heading', { name: COPY.confirmHeading })).toHaveCount(0);
      // eslint-disable-next-line no-await-in-loop
      await expect(page.getByText(foreignQuestion)).toHaveCount(0);
    }

    await page.getByRole('button', { name: COPY.backHome, exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(COPY.landingHeading);
  });
});

test.describe('accessibility and responsiveness', () => {
  test('every button, link, text field, and answer card is at least 44×44px', async ({ page, request }) => {
    const tooSmall = async () =>
      page.evaluate((min) => {
        const targets = [
          ...document.querySelectorAll('button, a[href], textarea'),
          ...Array.from(document.querySelectorAll('input[type="radio"]')).map((r) => r.closest('label')),
        ];
        return targets
          .filter((el) => el && el.getClientRects().length > 0)
          .map((el) => ({ el, box: el.getBoundingClientRect() }))
          .filter(({ box }) => box.width < min || box.height < min)
          .map(({ el, box }) => `${el.tagName} "${el.getAttribute('aria-label') || el.textContent.trim().slice(0, 20)}" ${Math.round(box.width)}x${Math.round(box.height)}`);
      }, TOUCH_TARGET_MIN);

    await page.goto('/');
    expect(await tooSmall()).toEqual([]);

    await page.goto('/polls/new');
    await page.getByRole('button', { name: COPY.addDetails, exact: true }).click();
    await addOptionButton(page).click();
    expect(await tooSmall()).toEqual([]);

    await question(page).fill('Anything');
    await page.getByRole('button', { name: COPY.cancelButton, exact: true }).click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    expect(await tooSmall()).toEqual([]);

    const poll = await createPollViaApi(request);
    await page.goto(`/polls/${poll.id}/created`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(COPY.confirmHeading);
    expect(await tooSmall()).toEqual([]);
  });

  test('landing, form, field errors, discard dialog, confirmation, and load error have no WCAG 2.2 AA violations', async ({ page, request }) => {
    const violations = [];

    await page.goto('/');
    violations.push(...(await axeViolations(page, 'landing')));

    await page.goto('/polls/new');
    await expect(question(page)).toBeVisible();
    violations.push(...(await axeViolations(page, 'form')));

    await createButton(page).click();
    await expect(page.getByText(COPY.questionError, { exact: true })).toBeVisible();
    violations.push(...(await axeViolations(page, 'form errors')));

    await question(page).fill('Anything');
    await page.getByRole('button', { name: COPY.cancelButton, exact: true }).click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    // Scan only after the entrance animation finishes; mid-fade opacity lowers contrast.
    await page.getByRole('alertdialog').evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    violations.push(...(await axeViolations(page, 'discard dialog')));

    const poll = await createPollViaApi(request, { details: 'Some context' });
    await page.goto(`/polls/${poll.id}/created`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(COPY.confirmHeading);
    violations.push(...(await axeViolations(page, 'confirmation')));

    await page.goto(`/polls/${randomUUID()}/created`);
    await expect(page.getByRole('alert')).toHaveText(COPY.loadError);
    violations.push(...(await axeViolations(page, 'load error')));

    expect(violations).toEqual([]);
  });

  test('at 200% text size nothing is lost horizontally and a poll can still be created', async ({ page }) => {
    const questionText = unique('Zoomed');
    await page.goto('/polls/new');
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });

    await fillPoll(page, { questionText });
    await expectNoHorizontalScroll(page);
    await createButton(page).click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(COPY.confirmHeading);
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await expectNoHorizontalScroll(page);
    await expect(page.getByRole('article', { name: questionText })).toBeVisible();
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('buttons do not animate and the discard dialog appears without animation', async ({ page }) => {
      await page.goto('/polls/new');

      // No property transitions (transition-property none), so nothing animates.
      const transitionProperty = await createButton(page).evaluate((el) => getComputedStyle(el).transitionProperty);
      expect(transitionProperty).toBe('none');

      await question(page).fill('Anything');
      await page.getByRole('button', { name: COPY.cancelButton, exact: true }).click();
      const animation = await page.getByRole('alertdialog').evaluate((el) => getComputedStyle(el).animationName);
      expect(animation).toBe('none');
    });
  });
});
