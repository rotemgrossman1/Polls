import { useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import Alert from '../components/Alert';
import Button from '../components/Button';
import NicknameField from '../components/NicknameField';
import PageLayout from '../components/PageLayout';
import PollSummary from '../components/PollSummary';
import Skeleton from '../components/Skeleton';
import StickerHeading from '../components/StickerHeading';
import SuccessMark from '../components/SuccessMark';
import useInvite from '../hooks/useInvite';
import useJoinPoll, { JOIN_RESULT } from '../hooks/useJoinPoll';
import InviteLinkBrokenPage from './InviteLinkBrokenPage';
import { COPY } from '../utils/uiCopy';

const HTTP_NOT_FOUND = 404;
const FORM_ID = 'join-poll-form';
const NICKNAME_FIELD_ID = 'nickname';

// Invite pages are kept out of search engines in every state; React hoists this into <head>.
const noIndex = <meta name="robots" content="noindex" />;

/**
 * Invite page (/i/:inviteCode): loads the poll behind the link, then shows the nickname form, or
 * the joined screen when this device already joined. Every non-working link shows the same
 * "This link doesn't work" page; other load failures offer "Try again".
 */
export default function InvitePage() {
  const { inviteCode } = useParams();
  const invite = useInvite(inviteCode);
  const join = useJoinPoll(inviteCode);
  const fieldRef = useRef(null);
  const joinedHeadingRef = useRef(null);
  const joinedHereRef = useRef(false);

  // After joining from the form, the form is gone: move focus to the joined heading.
  useEffect(() => {
    if (join.joinedNickname && joinedHereRef.current && joinedHeadingRef.current) {
      joinedHeadingRef.current.focus();
    }
  }, [join.joinedNickname, invite.data]);

  async function handleSubmit(event) {
    event.preventDefault();
    const { status } = await join.submit();
    if (status === JOIN_RESULT.INVALID || status === JOIN_RESULT.TAKEN) {
      fieldRef.current.focus();
    } else if (status === JOIN_RESULT.JOINED) {
      joinedHereRef.current = true;
    }
  }

  if (invite.loading) {
    return (
      <PageLayout navVariant="minimal">
        {noIndex}
        <div role="status">
          <h1 className="text-base font-regular text-text-muted">{COPY.invite.loading}</h1>
        </div>
        <div aria-busy="true" className="flex flex-col gap-5">
          <Skeleton variant="sticker" width="1/2" />
          <div className="mt-2 flex flex-col gap-3 rounded-lg border border-text bg-surface p-5 shadow-md">
            <Skeleton variant="line" width="2/5" />
            <Skeleton variant="title" />
            <Skeleton variant="title" width="3/4" />
          </div>
          <div className="flex flex-col gap-3 rounded-lg border border-text bg-action-subtle p-5 shadow-md">
            <Skeleton variant="line" width="2/5" />
            <Skeleton variant="row" />
          </div>
        </div>
      </PageLayout>
    );
  }

  if (invite.error && invite.error.status === HTTP_NOT_FOUND) {
    return <InviteLinkBrokenPage />;
  }

  if (invite.error || !invite.data) {
    return (
      <PageLayout navVariant="minimal">
        {noIndex}
        <Alert as="h1" title={COPY.invite.loadError} body={COPY.invite.loadErrorBody} />
        <div>
          <Button block="mobile" onClick={invite.reload}>
            {COPY.invite.tryAgain}
          </Button>
        </div>
      </PageLayout>
    );
  }

  if (join.joinedNickname) {
    return (
      <PageLayout navVariant="minimal">
        {noIndex}
        <div className="flex flex-col items-start gap-3">
          <SuccessMark />
          <h1
            ref={joinedHeadingRef}
            tabIndex={-1}
            className="max-w-full break-words text-2xl font-bold leading-tight text-text outline-none"
          >
            {COPY.joined.headingPrefix}
            <bdi dir="auto">{join.joinedNickname}</bdi>
          </h1>
        </div>
        <PollSummary poll={invite.data} variant="invite" bubble />
      </PageLayout>
    );
  }

  const bottomBar = (
    <Button type="submit" form={FORM_ID} block="mobile" loading={join.joining}>
      {join.joining ? COPY.join.joiningButton : COPY.join.joinButton}
    </Button>
  );

  return (
    <PageLayout navVariant="minimal" bottomBar={bottomBar}>
      {noIndex}
      <form id={FORM_ID} noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        <StickerHeading icon="link">{COPY.invite.eyebrow}</StickerHeading>
        <PollSummary poll={invite.data} variant="invite" bubble />
        <NicknameField
          id={NICKNAME_FIELD_ID}
          value={join.nickname}
          onChange={join.setNickname}
          error={join.error}
          readOnly={join.joining}
          inputRef={fieldRef}
        />
        {join.joinFailed && <Alert>{COPY.join.joinFailed}</Alert>}
      </form>
    </PageLayout>
  );
}
