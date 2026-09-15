import { useNavigate } from 'react-router';
import Button from '../components/Button';
import HeroCard from '../components/HeroCard';
import PageLayout from '../components/PageLayout';
import { COPY } from '../utils/uiCopy';
import { ROUTES } from '../utils/routes';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <PageLayout>
      <HeroCard heading={COPY.landing.heading} intro={COPY.landing.intro} />
      <Button icon="plus" block onClick={() => navigate(ROUTES.newPoll)}>
        {COPY.landing.createButton}
      </Button>
    </PageLayout>
  );
}
