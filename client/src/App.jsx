import { Navigate, Route, Routes } from 'react-router';
import LandingPage from './pages/LandingPage';
import CreatePollPage from './pages/CreatePollPage';
import PollCreatedPage from './pages/PollCreatedPage';
import { ROUTES } from './utils/routes';

export default function App() {
  return (
    <Routes>
      <Route path={ROUTES.home} element={<LandingPage />} />
      <Route path={ROUTES.newPoll} element={<CreatePollPage />} />
      <Route path={ROUTES.pollCreated} element={<PollCreatedPage />} />
      <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
    </Routes>
  );
}
