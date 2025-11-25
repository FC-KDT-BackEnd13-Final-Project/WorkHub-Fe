import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Main } from "./components/Main";
import { Navigation } from "./components/Navigation";
import { Dashboard } from "./components/Dashboard";
import { Toaster } from "./components/ui/sonner";
import { useEffect } from "react";
import App2 from "./App2";

export default function App() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("workhub:auth") === "true";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("workhub:auth", isAuthenticated ? "true" : "false");
  }, [isAuthenticated]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <div className="pt-16">
        <Routes>
          <Route path="/" element={<LandingPage onLoginSuccess={handleLoginSuccess} />} />
          <Route
            path="/dashboard"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <div className="h-20 border-b" aria-hidden />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/Dashboard/*" element={<Dashboard />} />
        <Route path="/projectdetail/new" element={<App2 />} />
      </Routes>
      <Toaster />
    </div>
  );
}

function LandingPage({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace("#", "");
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  return (
    <Main onLoginSuccess={onLoginSuccess} />
  );
}
