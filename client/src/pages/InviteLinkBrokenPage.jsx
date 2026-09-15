import EmptyState from '../components/EmptyState';
import PageLayout from '../components/PageLayout';
import { COPY } from '../utils/uiCopy';

/**
 * "This link doesn't work": the same page for every non-working invite link (no code, extra path
 * segments, or a code the API does not know), so nobody can tell whether a poll exists.
 * React hoists the robots meta tag into <head>.
 */
export default function InviteLinkBrokenPage() {
  return (
    <PageLayout navVariant="minimal">
      <meta name="robots" content="noindex" />
      <EmptyState icon="brokenLink" heading={COPY.inviteLink.brokenHeading} body={COPY.inviteLink.brokenBody} />
    </PageLayout>
  );
}
