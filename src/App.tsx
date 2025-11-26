import { Routes, Route, useLocation, Navigate, useNavigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { Main } from "./components/Main";
import { Navigation } from "./components/Navigation";
import { Dashboard } from "./components/Dashboard";
import { ProjectsIndex } from "./components/ProjectsIndex";
import { ProjectNodesBoard } from "./components/ProjectNodesBoard";
import { CustomerMenu2 } from "./components/CustomerMenu2";
import { CustomerForm2 } from "./components/CustomerForm2";
import { CustomerReport2 } from "./components/CustomerReport2";
import { Sidebar } from "./components/Sidebar";
import { Toaster } from "./components/ui/sonner";

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
          <Route element={<SidebarLayout />}>
            <Route
              path="/dashboard"
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/" replace />}
            />
            <Route
              path="/projects"
              element={isAuthenticated ? <ProjectsIndex /> : <Navigate to="/" replace />}
            />
            <Route
              path="/projects/:projectId/nodes/:nodeId"
              element={isAuthenticated ? <ProjectNodesBoard /> : <Navigate to="/" replace />}
            />
            <Route
              path="/projectdetail"
              element={isAuthenticated ? <ProjectDetailPage type="report" /> : <Navigate to="/" replace />}
            />
            <Route
              path="/projectdetail/:projectId"
              element={isAuthenticated ? <ProjectDetailPage type="report" /> : <Navigate to="/" replace />}
            />
            <Route
              path="/projectdetail/new"
              element={isAuthenticated ? <ProjectDetailPage type="form" /> : <Navigate to="/" replace />}
            />
            <Route
              path="/projectdetail/post"
              element={isAuthenticated ? <ProjectDetailPage type="report" /> : <Navigate to="/" replace />}
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
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

function ProjectDetailPage({ type }: { type: "form" | "report" }) {
  const [activeTab, setActiveTab] = useState<"form" | "report">(type);

    return (
        <div className="pt-8 pb-12">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <div className="mb-6 pt-6">
                    <CustomerMenu2 activeTab={activeTab} onTabChange={setActiveTab} />
                </div>

                <div>
                    {activeTab === "form" ? <CustomerForm2 /> : <CustomerReport2 />}
                </div>
            </div>
        </div>
    );
}

function SidebarLayout() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
