import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import Alert from '../components/Alert';
import Button from '../components/Button';
import PageLayout from '../components/PageLayout';
import PollSummary from '../components/PollSummary';
import Skeleton from '../components/Skeleton';
import SuccessMark from '../components/SuccessMark';
import usePoll from '../hooks/usePoll';
import { COPY } from '../utils/uiCopy';
import { ROUTES } from '../utils/routes';

export default function PollCreatedPage() {
  const { pollId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // The poll handed over by the create form, kept for this visit only.
  const [handedOverPoll] = useState(() => (location.state && location.state.poll) || null);
  const { data: poll, loading, error } = usePoll(pollId, handedOverPoll);

  // Clear it from history so reloading the page loads the poll from the API.
  useEffect(() => {
    if (location.state && location.state.poll) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  const goHome = () => navigate(ROUTES.home);

  if (loading) {
    return (
      <PageLayout>
        <p role="status" className="text-base text-text-muted">
          {COPY.confirmation.loading}
        </p>
        <div
          aria-busy="true"
          className="flex flex-col gap-3 rounded-lg border border-text bg-surface p-5 shadow-md"
        >
          <Skeleton variant="line" width="2/5" />
          <Skeleton variant="title" width="3/4" />
          <Skeleton variant="row" />
          <Skeleton variant="row" />
        </div>
      </PageLayout>
    );
  }

  if (error || !poll) {
    return (
      <PageLayout>
        <Alert>{COPY.confirmation.loadError}</Alert>
        <Button block onClick={goHome}>
          {COPY.confirmation.backHome}
        </Button>
      </PageLayout>
    );
  }

  const bottomBar = (
    <>
      <Button variant="secondary" block="mobile" onClick={() => navigate(ROUTES.newPoll)}>
        {COPY.confirmation.createAnother}
      </Button>
      <Button block="mobile" onClick={goHome}>
        {COPY.confirmation.backHome}
      </Button>
    </>
  );

  return (
    <PageLayout bottomBar={bottomBar}>
      <div className="flex flex-col items-start gap-3">
        <SuccessMark />
        <h1 className="text-3xl font-bold leading-tight text-text">{COPY.confirmation.heading}</h1>
        <p className="text-base text-text-muted">{COPY.confirmation.intro}</p>
      </div>
      <PollSummary poll={poll} />
    </PageLayout>
  );
}
