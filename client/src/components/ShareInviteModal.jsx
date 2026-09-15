import { useEffect, useId, useRef, useState } from 'react';
import Button from './Button';
import Sheet from './Sheet';
import { COPY } from '../utils/uiCopy';
import { ICON_PATHS, ICON_STROKE_WIDTH } from '../utils/iconPaths';
import { copyText, selectElementText } from '../utils/clipboard';

// Spec: "Copied" shows for 2 seconds after the last tap.
export const COPIED_DURATION_MS = 2000;

const ICON_BUTTON =
  'grid h-touch w-touch shrink-0 place-items-center rounded-full text-text-muted hover:bg-bg hover:text-text ' +
  'focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus';

function Icon({ path, className = 'h-5 w-5' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={ICON_STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      <path d={path} />
    </svg>
  );
}

/**
 * Share sheet for a poll's invite link (catalog: ShareInviteModal), built on Sheet.
 * - Copy: Clipboard API, then the copy command, then an error with the link text selected.
 *   Success shows "Copied" for 2 seconds (restarted by every tap) and announces "Link copied".
 * - Share link: only when the device supports sharing. Cancels and failures are ignored.
 * - Done, Close, Escape and a scrim tap call onClose.
 */
export default function ShareInviteModal({ open, link, onClose }) {
  const titleId = useId();
  const bodyId = useId();
  const errorId = useId();
  const copyRef = useRef(null);
  const linkRef = useRef(null);
  const timerRef = useRef(null);
  const openRef = useRef(open);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  // Every opening starts fresh; a copy that finishes after closing changes nothing.
  useEffect(() => {
    openRef.current = open;
    if (!open) {
      clearTimeout(timerRef.current);
      setCopied(false);
      setCopyFailed(false);
      setAnnouncement('');
    }
  }, [open]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  async function handleCopy() {
    // Emptied first, so copying again is announced again.
    setAnnouncement('');
    const success = await copyText(link, linkRef.current);
    if (!openRef.current) {
      return;
    }
    clearTimeout(timerRef.current);

    if (!success) {
      setCopied(false);
      setCopyFailed(true);
      if (linkRef.current) {
        selectElementText(linkRef.current);
      }
      return;
    }

    setCopyFailed(false);
    setCopied(true);
    setAnnouncement(COPY.share.copiedAnnouncement);
    timerRef.current = setTimeout(() => {
      setCopied(false);
      setAnnouncement('');
    }, COPIED_DURATION_MS);
  }

  async function handleShare() {
    try {
      await navigator.share({ text: COPY.share.shareText(link) });
    } catch {
      // Spec: canceling the device share options (AbortError) or a failed share shows no error,
      // and the sheet stays open.
    }
  }

  return (
    <Sheet open={open} onClose={onClose} labelledBy={titleId} describedBy={bodyId} initialFocusRef={copyRef}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <h2 id={titleId} className="break-words text-xl font-bold leading-tight text-text">
            {COPY.share.title}
          </h2>
          <p id={bodyId} className="text-base text-text-muted">
            {COPY.share.body}
          </p>
        </div>
        <button type="button" aria-label={COPY.share.close} onClick={onClose} className={`${ICON_BUTTON} -mr-3 -mt-2`}>
          <Icon path={ICON_PATHS.x} />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <div
          role="group"
          aria-label={COPY.inviteLink.label}
          aria-describedby={copyFailed ? errorId : undefined}
          className={`flex items-start gap-3 rounded-md border border-dashed px-4 py-3 ${
            copyFailed ? 'border-danger bg-danger-subtle' : 'border-border-strong bg-bg'
          }`}
        >
          <Icon path={ICON_PATHS.link} className="h-5 w-5 text-text-muted" />
          <span ref={linkRef} dir="ltr" className="min-w-0 flex-1 select-all break-all text-base font-medium text-text">
            {link}
          </span>
        </div>
        {copyFailed && (
          <p id={errorId} role="alert" className="flex items-start gap-1 text-sm font-bold text-danger">
            <Icon path={ICON_PATHS.alert} />
            <span>{COPY.share.copyError}</span>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Button ref={copyRef} icon="copy" block success={copied} onClick={handleCopy}>
          {copied ? COPY.share.copied : COPY.share.copy}
        </Button>
        {canShare && (
          <Button variant="secondary" icon="share" block onClick={handleShare}>
            {COPY.share.shareLink}
          </Button>
        )}
        <Button variant="ghost" block onClick={onClose}>
          {COPY.share.done}
        </Button>
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </Sheet>
  );
}
