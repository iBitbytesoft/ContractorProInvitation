import { useState, useEffect } from "react";
import { Route, Router, Switch, Redirect } from "wouter";
import DashboardPage from "./pages/dashboard";
import VendorsPage from "./pages/vendors";
import LoginPage from "./pages/login";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Layout from "./components/Layout";

export function AppRoutes() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      console.log("Authentication state changed:", !!user); // Debug log
    });

    return () => unsubscribe();
  }, [auth]);

  // Show loading while checking auth state
  if (isAuthenticated === null) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <Router>
      <Switch>
        <Route path="/login">
          {isAuthenticated ? <Redirect to="/dashboard" /> : <LoginPage />}
        </Route>
        
        {/* Root route - Show login page if not authenticated, dashboard if authenticated */}
        <Route path="/">
          {isAuthenticated ? (
            <Redirect to="/dashboard" />
          ) : (
            <LoginPage />
          )}
        </Route>
        
        {/* Dashboard route */}
        <Route path="/dashboard">
          {isAuthenticated ? (
            <Layout>
              <DashboardPage />
            </Layout>
          ) : (
            <LoginPage />
          )}
        </Route>
        
        {/* Vendors route */}
        <Route path="/vendors">
          {isAuthenticated ? (
            <Layout>
              <VendorsPage />
            </Layout>
          ) : (
            <LoginPage />
          )}
        </Route>
        
        {/* Fallback - redirect to login for any unknown route */}
        <Route>
          <LoginPage />
        </Route>
      </Switch>
    </Router>
  );
}
