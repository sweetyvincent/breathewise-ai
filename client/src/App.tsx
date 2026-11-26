/** Route table; every page is lazy-loaded so the first load stays small. */
import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Spinner } from '@/components/ui/feedback';
import Landing from '@/pages/Landing';

// Route-level code splitting keeps the first load small (charts are only fetched with the pages that use them).
const Auth = lazy(() => import('@/pages/Auth'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Planner = lazy(() => import('@/pages/Planner'));
const Indoor = lazy(() => import('@/pages/Indoor'));
const Mobility = lazy(() => import('@/pages/Mobility'));
const Chat = lazy(() => import('@/pages/Chat'));
const Impact = lazy(() => import('@/pages/Impact'));
const Community = lazy(() => import('@/pages/Community'));
const Learn = lazy(() => import('@/pages/Learn'));
const Settings = lazy(() => import('@/pages/Settings'));

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <Spinner label="Loading…" />
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="planner" element={<Planner />} />
          <Route path="indoor" element={<Indoor />} />
          <Route path="mobility" element={<Mobility />} />
          <Route path="chat" element={<Chat />} />
          <Route path="impact" element={<Impact />} />
          <Route path="community" element={<Community />} />
          <Route path="learn" element={<Learn />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
