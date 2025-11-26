import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderOpen, Users, Bell, Settings, Menu, X, UserRound } from "lucide-react";
import { cn } from "./ui/utils";
import { Button } from "./ui/button";
import { initialNotifications } from "../data/notifications";
import { companyUsers } from "./admin/userData";

const navigationItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Projects", icon: FolderOpen, path: "/projects" },
  { label: "Users", icon: Users, path: "/admin/users" },
  { label: "Notifications", icon: Bell, badge: "5", path: "/notifications" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(
    initialNotifications.filter((notification) => !notification.read).length,
  );

  const activeProjectCount = useMemo(() => {
    return companyUsers
      .flatMap((user) => user.projects ?? [])
      .filter((project) => project.status === "In Progress").length;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("userProfileImage");
    if (stored) {
      setProfileImageUrl(stored);
    }

    const storedCount = window.localStorage.getItem("workhubUnreadNotificationCount");
    if (storedCount !== null) {
      setNotificationCount(Number(storedCount));
    }

    const handleNotificationUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<number>;
      if (typeof customEvent.detail === "number") {
        setNotificationCount(customEvent.detail);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "workhubUnreadNotificationCount" && event.newValue !== null) {
        setNotificationCount(Number(event.newValue));
      }
    };

    window.addEventListener("workhub:notifications", handleNotificationUpdate as EventListener);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("workhub:notifications", handleNotificationUpdate as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const SidebarContent = ({ isMobile }: { isMobile?: boolean }) => (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="사용자 프로필" className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <UserRound className="h-10 w-10 text-muted-foreground" />
                )}
             </div>
              <div>
                <p className="font-semibold">김지은</p>
                <p className="text-xs text-muted-foreground">Work Hub</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-6">
            {isMobile ? (
              <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => setCollapsed((prev) => !prev)}>
                <Menu className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-4 p-6">
        {navigationItems.map((item) => {
          const isActive = item.path ? location.pathname.startsWith(item.path) : false;
          const badgeValue = (() => {
            if (item.label === "Notifications" && notificationCount > 0) {
              return String(notificationCount);
            }
            if (item.label === "Projects" && activeProjectCount > 0) {
              return String(activeProjectCount);
            }
            return item.badge;
          })();
          return (
            <Button
              key={item.label}
              variant="ghost"
              className={cn(
                "flex w-full items-center gap-3 text-sm transition-all",
                collapsed && !isMobile ? "justify-center px-2" : "justify-start",
                isActive && "text-white",
              )}
              style={isActive ? { backgroundColor: "var(--point-color)" } : undefined}
              onClick={() => item.path && navigate(item.path)}
            >
              <item.icon className="h-4 w-4" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left font-normal">{item.label}</span>
                  {badgeValue ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal">{badgeValue}</span>
                  ) : null}
                </>
              )}
            </Button>
          );
        })}
      </nav>
      <div className="p-6">
        <Button
          variant="ghost"
          className={cn("w-full justify-center text-sm text-muted-foreground hover:text-foreground", collapsed && !isMobile && "px-2")}
        >
          {!collapsed ? "Logout" : "⎋"}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-24 z-50 md:hidden"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </Button>
      <aside
        className={cn(
          "hidden md:flex flex-col border-r bg-white shadow-sm transition-[width] duration-200",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarContent />
      </aside>
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-white transition-transform duration-300 md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent />
      </div>
    </>
  );
}
