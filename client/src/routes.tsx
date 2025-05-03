
import { useState, useEffect } from "react";
import { Route, Router, Switch } from "wouter";
import DashboardPage from "./pages/dashboard";
import VendorsPage from "./pages/vendors";
import LoginPage from "./pages/login";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Layout from "./components/layout/Layout";

export function AppRoutes() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
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
          {isAuthenticated ? <DashboardPage /> : <LoginPage />}
        </Route>
        
        <Route path="/">
          {isAuthenticated ? (
            <Layout>
              <DashboardPage />
            </Layout>
          ) : (
            <LoginPage />
          )}
        </Route>
        
        <Route path="/dashboard">
          {isAuthenticated ? (
            <Layout>
              <DashboardPage />
            </Layout>
          ) : (
            <LoginPage />
          )}
        </Route>
        
        <Route path="/vendors">
          {isAuthenticated ? (
            <Layout>
              <VendorsPage />
            </Layout>
          ) : (
            <LoginPage />
          )}
        </Route>
        
        {/* Add more authenticated routes as needed */}
      </Switch>
    </Router>
  );
}
