import { Routes, Route, useLocation } from "react-router-dom";
import { Main } from "./components/Main";
import { Navigation } from "./components/Navigation";
import { Dashboard } from "./components/Dashboard";
import { Toaster } from "./components/ui/sonner";
import { useEffect } from "react";

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <div className="p-8 border-b" aria-hidden />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/Dashboard/*" element={<Dashboard />} />
      </Routes>
      <Toaster />
    </div>
  );
}

function LandingPage() {
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
    <Main />
  );
}
