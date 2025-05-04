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

// Add logging for debugging
console.log("App.tsx is being evaluated");

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
  console.log("ProtectedRoute component rendering, auth state:", isAuthenticated);

  useEffect(() => {
    console.log("ProtectedRoute: Setting up auth listener");
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      console.log("ProtectedRoute: Auth state changed", !!user);
      setIsAuthenticated(!!user);
      if (!user) {
        console.log("ProtectedRoute: Redirecting to login");
        setLocation('/login');
      }
    });
    return () => unsubscribe();
  }, [setLocation]);

  if (isAuthenticated === null) {
    console.log("ProtectedRoute: Still checking auth state, showing loading");
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  console.log("ProtectedRoute: Auth check complete, authenticated:", isAuthenticated);
  return isAuthenticated ? children : null;
}

export default function App() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  console.log("App component rendering");

  // Handle authentication state
  useEffect(() => {
    console.log("App: Setting up auth listener");
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      console.log("App: Auth state changed", !!user);
      setIsAuthenticated(!!user);
      
      // Redirect based on auth state and current path
      const currentPath = window.location.pathname;
      console.log("Current path:", currentPath);
      
      if (user && currentPath === '/login') {
        console.log("App: Redirecting to dashboard after login");
        setLocation('/dashboard');
      }
      
      if (user && currentPath === '/') {
        console.log("App: Redirecting to dashboard from root");
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
          {isAuthenticated === null ? (
            <div className="flex justify-center items-center h-screen">Loading authentication...</div>
          ) : isAuthenticated ? (
            <Layout>
              <Dashboard />
            </Layout>
          ) : (
            <Login />
          )}
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