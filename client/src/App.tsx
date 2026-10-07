import { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageLoader } from '@/components/ui/Misc';
import { AccountProvider } from '@/context/AccountContext';
import { useAuth } from '@/context/AuthContext';
import { AuthPage } from '@/pages/AuthPage';
import Dashboard from '@/pages/Dashboard';
import TradeLog from '@/pages/TradeLog';
import Analytics from '@/pages/Analytics';
import CalendarPage from '@/pages/CalendarPage';
import Accounts from '@/pages/Accounts';
import Import from '@/pages/Import';
import NotFound from '@/pages/NotFound';

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <AccountProvider>{children}</AccountProvider>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route element={<Protected><AppLayout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="trades" element={<TradeLog />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="import" element={<Import />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
