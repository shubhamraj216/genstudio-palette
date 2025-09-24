// src/pages/index.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Homepage from "../components/Homepage";
import AuthModal from "../components/auth/AuthModal";
import { useAuth } from "../hooks/use-auth";

type AuthMode = "login" | "signup" | "forgot-password" | "guest";

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  const handleGetStarted = () => {
    if (user) {
      navigate("/app");
      return;
    }
    setAuthMode("signup");
    setAuthOpen(true);
  };

  const handleLogin = () => {
    if (user) {
      navigate("/app");
      return;
    }
    setAuthMode("login");
    setAuthOpen(true);
  };

  const handleAuthClose = () => {
    setAuthOpen(false);
    // if user logged in, route to /app
    if (localStorage.getItem("access_token")) {
      navigate("/app");
    }
  };

  const handleLogout = () => {
    logout();
    // optionally navigate back to home
    navigate("/");
  };

  return (
    <>
      <Homepage
        onGetStarted={handleGetStarted}
        onLogin={handleLogin}
        userName={user ? `${user.first_name ?? ""}'s Playground`.trim() || user.email : null}
        onLogout={handleLogout}
      />
      <AuthModal isOpen={authOpen} onClose={handleAuthClose} initialMode={authMode} />
    </>
  );
};

export default Index;
