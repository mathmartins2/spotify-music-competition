import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { CallbackPage } from './pages/CallbackPage';
import { GroupsPage } from './pages/GroupsPage';
import { GroupDetailsPage } from './pages/GroupDetailsPage';
import { AuthService } from './services/auth';
import { AuthCallback } from './pages/AuthCallback';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  if (!AuthService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/callback" element={<AuthCallback />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/groups" replace />} />
            <Route path="groups" element={<GroupsPage />} />
            <Route path="groups/:id" element={<GroupDetailsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryProvider>
  );
}

export default App;
