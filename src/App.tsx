import { Routes, Route } from "react-router-dom";
import { Main } from "./components/Main";
import { Navigation } from "./components/Navigation";
import { Dashboard } from "./components/Dashboard";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/Dashboard" element={<Dashboard />} />
      </Routes>
      <Toaster />
    </div>
  );
}

function LandingPage() {
  return (
    <>
      <Navigation />
      <div className="p-8 border-b" aria-hidden />
      <Main />
    </>
  );
}
