import { Navigate, Route, Routes } from 'react-router';
import LandingPage from './pages/LandingPage';
import CreatePollPage from './pages/CreatePollPage';
import PollCreatedPage from './pages/PollCreatedPage';
import InvitePage from './pages/InvitePage';
import InviteLinkBrokenPage from './pages/InviteLinkBrokenPage';
import { ROUTES } from './utils/routes';

export default function App() {
  return (
    <Routes>
      <Route path={ROUTES.home} element={<LandingPage />} />
      <Route path={ROUTES.newPoll} element={<CreatePollPage />} />
      <Route path={ROUTES.pollCreated} element={<PollCreatedPage />} />
      <Route path={ROUTES.invite} element={<InvitePage />} />
      <Route path={ROUTES.inviteMissingCode} element={<InviteLinkBrokenPage />} />
      <Route path={ROUTES.inviteExtraSegments} element={<InviteLinkBrokenPage />} />
      <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
    </Routes>
  );
}
