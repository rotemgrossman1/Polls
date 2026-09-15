// Selects all the text inside `element`, so the user can copy it themselves.
export function selectElementText(element) {
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * Copies text to the clipboard. Tries the Clipboard API first; if it is missing or blocked, copies
 * a selection of `element` (which shows the same text) with execCommand. Resolves true when copied.
 */
export async function copyText(text, element) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Blocked (no permission, not a secure context): try the older copy command below.
    }
  }

  if (!element || typeof document.execCommand !== 'function') {
    return false;
  }
  try {
    selectElementText(element);
    const copied = document.execCommand('copy');
    if (copied) {
      window.getSelection().removeAllRanges();
    }
    return copied;
  } catch {
    // Some browsers throw instead of returning false when copying is not allowed.
    return false;
  }
}
