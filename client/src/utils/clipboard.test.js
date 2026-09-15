import { copyText, selectElementText } from './clipboard';

const LINK = 'https://polls.test/i/q7Kx2Wm9aZ';

function linkElement() {
  const span = document.createElement('span');
  span.textContent = LINK;
  document.body.appendChild(span);
  return span;
}

function setClipboard(value) {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true });
}

describe('clipboard', () => {
  afterEach(() => {
    delete navigator.clipboard;
    delete document.execCommand;
    window.getSelection().removeAllRanges();
    document.body.innerHTML = '';
  });

  test('selectElementText selects all the text in the element', () => {
    selectElementText(linkElement());

    expect(window.getSelection().toString()).toBe(LINK);
  });

  test('copies with the Clipboard API when it works', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    document.execCommand = jest.fn();

    await expect(copyText(LINK, linkElement())).resolves.toBe(true);

    expect(writeText).toHaveBeenCalledWith(LINK);
    expect(document.execCommand).not.toHaveBeenCalled();
  });

  test('falls back to copying a selection of the element when the Clipboard API is blocked', async () => {
    setClipboard({ writeText: jest.fn().mockRejectedValue(new Error('NotAllowedError')) });
    let selectedWhenCopying;
    document.execCommand = jest.fn(() => {
      selectedWhenCopying = window.getSelection().toString();
      return true;
    });

    await expect(copyText(LINK, linkElement())).resolves.toBe(true);

    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(selectedWhenCopying).toBe(LINK);
    expect(window.getSelection().toString()).toBe('');
  });

  test('falls back when there is no Clipboard API', async () => {
    document.execCommand = jest.fn(() => true);

    await expect(copyText(LINK, linkElement())).resolves.toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });

  test.each([
    ['the copy command returns false', () => false],
    [
      'the copy command throws',
      () => {
        throw new Error('SecurityError');
      },
    ],
  ])('fails when %s', async (label, execCommand) => {
    document.execCommand = jest.fn(execCommand);

    await expect(copyText(LINK, linkElement())).resolves.toBe(false);
  });

  test('fails when neither way of copying exists', async () => {
    await expect(copyText(LINK, linkElement())).resolves.toBe(false);
  });
});
