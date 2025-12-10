import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderOpen, Users, Bell, Settings, Menu, X, UserRound, LogOut, History } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../ui/utils";
import { Button } from "../ui/button";
import { initialNotifications } from "../../data/notifications";
import { companyUsers } from "../admin/userData";
import {
  PROFILE_STORAGE_KEY,
  type UserRole,
  normalizeUserRole,
} from "../../constants/profile";
import { useLocalStorageValue } from "../../hooks/useLocalStorageValue";

// 로그인 이후 레이아웃에서 좌측 프로젝트 내비게이션과 상태를 담당
type NavigationItem = {
  label: string;
  icon: LucideIcon;
  path: string;
  badge?: string;
};

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

export function Sidebar({ isMobileOpen: controlledMobileOpen, onMobileOpenChange }: SidebarProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [uncontrolledMobileOpen, setUncontrolledMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  // Settings 페이지 등에서 저장하는 프로필 정보를 공유 스토리지로부터 읽어온다.
  const [storedProfile] = useLocalStorageValue<{ profile?: { role?: string } } | null>(
    PROFILE_STORAGE_KEY,
    {
      defaultValue: null,
      parser: (value) => JSON.parse(value),
      listen: true,
    },
  );

  // 백오피스 로그인 API가 user 키에만 역할을 저장하는 경우도 있어서 같이 구독한다.
  const [storedUser] = useLocalStorageValue<{ role?: string } | null>("user", {
    defaultValue: null,
    parser: (value) => JSON.parse(value),
    listen: true,
  });
  const [profileImageUrl] = useLocalStorageValue<string | null>("userProfileImage", {
    defaultValue: null,
    parser: (value) => value,
    serializer: (value) => value ?? "",
    listen: true,
  });
  // 알림 페이지에서 읽음 처리할 때마다 저장하는 미확인 알림 개수를 동기화한다.
  const [notificationCount, setNotificationCount] = useLocalStorageValue<number>(
    "workhubUnreadNotificationCount",
    {
      defaultValue: initialNotifications.filter((notification) => !notification.read).length,
      parser: (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
      },
      serializer: (value) => String(value),
    },
  );
  // 로그아웃 시 전역 인증 상태를 false로 만들어 라우팅을 막는다.
  const [, setAuthState] = useLocalStorageValue<boolean>("workhub:auth", {
    defaultValue: false,
    parser: (value) => value === "true",
    serializer: (value) => (value ? "true" : "false"),
    listen: false,
  });
  const isMobileOpen = controlledMobileOpen ?? uncontrolledMobileOpen;
  const setIsMobileOpen = useCallback(
    (open: boolean) => {
      if (onMobileOpenChange) {
        onMobileOpenChange(open);
      } else {
        setUncontrolledMobileOpen(open);
      }
    },
    [onMobileOpenChange],
  );

  const activeProjectCount = useMemo(() => {
    return companyUsers
      .flatMap((user) => user.projects ?? [])
      .filter((project) => project.status === "In Progress").length;
  }, []);

  // profile/user 어디에 role이 저장됐든 우선순위를 정해 단일 역할로 매핑한다.
  const userRole = useMemo<UserRole>(() => {
    const profileRole = normalizeUserRole(storedProfile?.profile?.role);
    if (profileRole) {
      return profileRole;
    }
    const storedUserRole = normalizeUserRole(storedUser?.role);
    return storedUserRole ?? "DEVELOPER";
  }, [storedProfile, storedUser]);


  const handleLogout = () => {
    setAuthState(false);
    setIsMobileOpen(false);
    window.location.href = "/";
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isMobileOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isMobileOpen]);

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
        {(
          [
            { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
            { label: "Projects", icon: FolderOpen, path: "/projects" },
            { label: "Users", icon: Users, path: "/admin/users" },
            userRole === "ADMIN"
              ? { label: "History", icon: History, path: "/history" }
              : { label: "Notifications", icon: Bell, path: "/notifications" },
            { label: "Settings", icon: Settings, path: "/settings" },
          ] satisfies NavigationItem[]
        ).map((item) => {
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
        <Button
          variant="ghost"
          className={cn(
            "flex w-full items-center gap-3 text-sm transition-all hover:text-foreground",
            collapsed && !isMobile ? "justify-center px-2" : "justify-start",
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="flex-1 text-left font-normal">Logout</span>}
        </Button>
      </nav>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden md:flex flex-col border-r bg-white shadow-sm transition-[width] duration-200",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarContent />
      </aside>
      <div className="md:hidden">
        {isMobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-white transition-transform duration-300",
            isMobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <SidebarContent isMobile />
        </div>
      </div>
    </>
  );
}
