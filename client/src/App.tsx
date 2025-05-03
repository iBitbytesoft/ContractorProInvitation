import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Layout from './components/Layout';
import Dashboard from './pages/dashboard';
import Assets from './pages/assets';
import Vendors from './pages/vendors';
import Team from './pages/team';
import Documents from './pages/documents';
import BusinessProfile from './pages/business-profile';
import Login from './pages/login';
import AcceptInvitation from './pages/accept-invitation';
import { Toaster } from 'sonner';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      setIsAuthenticated(!!user);
      if (!user) {
        setLocation('/login');
      }
    });
    return () => unsubscribe();
  }, [setLocation]);

  if (isAuthenticated === null) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return isAuthenticated ? children : null;
}

function EmptyPage() {
  return <div className="w-full h-screen bg-white"></div>;
}

export default function App() {
  const [, setLocation] = useLocation();

  // Handle post-login redirect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      if (user && window.location.pathname === '/login') {
        setLocation('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [setLocation]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      <Switch>
        <Route path="/">
          <EmptyPage />
        </Route>
        <Route path="/login">
          <Login />
        </Route>
        <Route path="/accept-invitation/:token">
          <AcceptInvitation />
        </Route>
        <Route path="/dashboard">
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        </Route>
        <Route path="/vendors">
          <ProtectedRoute>
            <Layout>
              <Vendors />
            </Layout>
          </ProtectedRoute>
        </Route>
        <Route path="/assets">
          <ProtectedRoute>
            <Layout>
              <Assets />
            </Layout>
          </ProtectedRoute>
        </Route>
        <Route path="/team">
          <ProtectedRoute>
            <Layout>
              <Team />
            </Layout>
          </ProtectedRoute>
        </Route>
        <Route path="/documents">
          <ProtectedRoute>
            <Layout>
              <Documents />
            </Layout>
          </ProtectedRoute>
        </Route>
        <Route path="/business-profile">
          <ProtectedRoute>
            <Layout>
              <BusinessProfile />
            </Layout>
          </ProtectedRoute>
        </Route>
      </Switch>
    </QueryClientProvider>
  );
}