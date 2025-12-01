import { Routes, Route, useLocation, Navigate, useNavigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { Main } from "./components/Main";
import { Navigation } from "./components/Navigation";
import { Footer } from "./components/Footer";
import { Dashboard } from "./components/Dashboard";
import { ProjectsIndex } from "./components/ProjectsIndex";
import { ProjectNodesBoard } from "./components/ProjectNodesBoard";
import { ProjectNodeDetail } from "./components/ProjectNodeDetail";
import { ProjectMenu2 } from "./components/ProjectMenu2";
import { ProjectChecklist2 } from "./components/ProjectChecklist2";
import { ProjectPost2 } from "./components/ProjectPost2";
import { Sidebar } from "./components/Sidebar";
import { Toaster } from "./components/ui/sonner";
import { ProjectPostDetail } from "./components/ProjectPostDetail";
import { AdminUsers } from "./components/admin/AdminUsers";
import { AdminUserCreate } from "./components/admin/AdminUserCreate";
import { AdminUserSuccess } from "./components/admin/AdminUserSuccess";
import { AdminUserDetail } from "./components/admin/AdminUserDetail";
import { AdminPasswordReset } from "./components/admin/AdminPasswordReset";
import { AdminUserHistory } from "./components/admin/AdminUserHistory";
import { AdminUserProjects } from "./components/admin/AdminUserProjects";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SupportPage } from "./pages/SupportPage";
import { SupportTicketDetail } from "./pages/SupportTicketDetail";
import { SettingsPage } from "./pages/SettingsPage";

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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navigation />
      <main className="pt-16 flex-1">
        <Routes>
          <Route path="/" element={<LandingPage onLoginSuccess={handleLoginSuccess} />} />
          <Route element={<SidebarLayout />}>
            <Route
              path="/dashboard"
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/" replace />}
            />
            <Route
              path="/notifications"
              element={isAuthenticated ? <NotificationsPage /> : <Navigate to="/" replace />}
            />
            <Route
              path="/projects"
              element={isAuthenticated ? <ProjectsIndex /> : <Navigate to="/" replace />}
            />
            <Route
              path="/projects/:projectId/nodes"
              element={isAuthenticated ? <ProjectNodesBoard /> : <Navigate to="/" replace />}
            />
            <Route
              path="/projects/:projectId/nodes/new"
              element={isAuthenticated ? <ProjectNodesBoard /> : <Navigate to="/" replace />}
            />

            <Route
              path="/projects/:projectId/nodes/:nodeId"
              element={isAuthenticated ? <ProjectNodeDetail /> : <Navigate to="/" replace />}
            />
            <Route
              path="/projects/:projectId/nodes/:nodeId/posts"
              element={isAuthenticated ? <ProjectNodeDetail /> : <Navigate to="/" replace />}
            />
            <Route
              path="/admin/users"
              element={isAuthenticated ? <AdminUsers /> : <Navigate to="/" replace />}
            />
            <Route
              path="/admin/users/add"
              element={isAuthenticated ? <AdminUserCreate /> : <Navigate to="/" replace />}
            />
            <Route
              path="/admin/users/add/:type"
              element={isAuthenticated ? <AdminUserCreate /> : <Navigate to="/" replace />}
            />
            <Route
              path="/admin/users/add/success"
              element={isAuthenticated ? <AdminUserSuccess /> : <Navigate to="/" replace />}
            />
            <Route
              path="/admin/users/:userId"
              element={isAuthenticated ? <AdminUserDetail /> : <Navigate to="/" replace />}
            />
            <Route
              path="/admin/users/:userId/change-role"
              element={isAuthenticated ? <AdminUserDetail /> : <Navigate to="/" replace />}
            />
            <Route
              path="/admin/users/:userId/init-password"
              element={isAuthenticated ? <AdminUserDetail /> : <Navigate to="/" replace />}
            />
            <Route
              path="/admin/users/:userId/remove-user"
              element={isAuthenticated ? <AdminUserDetail /> : <Navigate to="/" replace />}
            />
            <Route
              path="/admin/users/:userId/history"
              element={isAuthenticated ? <AdminUserHistory /> : <Navigate to="/" replace />}
            />
            <Route
              path="/admin/users/:userId/projects"
              element={isAuthenticated ? <AdminUserProjects /> : <Navigate to="/" replace />}
            />
            <Route
              path="/projects/:projectId/nodes/support"
              element={isAuthenticated ? <SupportPage /> : <Navigate to="/" replace />}
            />
            <Route
              path="/projects/:projectId/nodes/support/:ticketId"
              element={isAuthenticated ? <SupportTicketDetail /> : <Navigate to="/" replace />}
            />
            <Route
              path="/settings"
              element={isAuthenticated ? <SettingsPage /> : <Navigate to="/" replace />}
            />
            <Route
              path="/admin/password"
              element={isAuthenticated ? <AdminPasswordReset /> : <Navigate to="/" replace />}
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
            <Route
              path="/projectpost/:postId"
              element={isAuthenticated ? <ProjectPostDetail /> : <Navigate to="/" replace />}
            />
            <Route
              path="/projects/:projectId/nodes/:nodeId/posts/:postId"
              element={isAuthenticated ? <ProjectPostDetail /> : <Navigate to="/" replace />}
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
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
                    <ProjectMenu2 activeTab={activeTab} onTabChange={setActiveTab} />
                </div>

                <div>
                    {activeTab === "form" ? <ProjectChecklist2 /> : <ProjectPost2 />}
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
