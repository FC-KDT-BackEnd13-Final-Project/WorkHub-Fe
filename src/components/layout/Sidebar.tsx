import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Bell,
  Settings,
  Menu,
  UserRound,
  LogOut,
  History,
} from "lucide-react";
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
export type NavigationItem = {
  label: string;
  icon: LucideIcon;
  path: string;
  badge?: string;
};

type StoredSettings = {
  profile?: {
    id?: string;
    email?: string;
    role?: string;
  };
  photo?: string;
};

type StoredUser = {
  id?: string;
  loginId?: string;
  name?: string;
  email?: string;
  role?: string;
  photoUrl?: string;
  avatarUrl?: string;
};

export const buildNavigationItems = (userRole: UserRole): NavigationItem[] =>
  userRole === "ADMIN"
    ? ([
        { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
        { label: "Projects", icon: FolderOpen, path: "/projects" },
        { label: "Users", icon: Users, path: "/admin/users" },
        { label: "History", icon: History, path: "/history" },
        { label: "Settings", icon: Settings, path: "/settings" },
      ] satisfies NavigationItem[])
    : ([
        { label: "Projects", icon: FolderOpen, path: "/projects" },
        { label: "Notifications", icon: Bell, path: "/notifications" },
        { label: "Settings", icon: Settings, path: "/settings" },
      ] satisfies NavigationItem[]);

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Settings 페이지 등에서 저장하는 프로필 정보를 공유 스토리지로부터 읽어온다.
  const [storedSettings] = useLocalStorageValue<StoredSettings | null>(
      PROFILE_STORAGE_KEY,
      {
        defaultValue: null,
        parser: (value) => JSON.parse(value),
        listen: true,
      },
  );

  // 백오피스 로그인 API가 user 키에만 역할을 저장하는 경우도 있어서 같이 구독한다.
  const [storedUser] = useLocalStorageValue<StoredUser | null>("user", {
    defaultValue: null,
    parser: (value) => JSON.parse(value),
    listen: true,
  });

  // 알림 페이지에서 읽음 처리할 때마다 저장하는 미확인 알림 개수를 동기화한다.
  const [notificationCount] = useLocalStorageValue<number>(
      "workhubUnreadNotificationCount",
      {
        defaultValue: initialNotifications.filter((n) => !n.read).length,
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

  const activeProjectCount = useMemo(() => {
    return companyUsers
        .flatMap((u) => u.projects ?? [])
        .filter((p) => p.status === "In Progress").length;
  }, []);

  // profile/user 어디에 role이 저장됐든 우선순위를 정해 단일 역할로 매핑한다.
  const userRole = useMemo<UserRole>(() => {
    const profileRole = normalizeUserRole(storedSettings?.profile?.role);
    if (profileRole) return profileRole;

    const storedUserRole = normalizeUserRole(storedUser?.role);
    return storedUserRole ?? "DEVELOPER";
  }, [storedSettings, storedUser]);

  const profileImageUrl =
      storedSettings?.photo ||
      storedUser?.photoUrl ||
      storedUser?.avatarUrl ||
      "/default-profile.png";

  const profileId =
      storedSettings?.profile?.id ??
      storedUser?.name ??
      storedUser?.loginId ??
      storedUser?.email ??
      "김지은";

  const profileEmail =
      storedSettings?.profile?.email ??
      storedUser?.email ??
      storedUser?.loginId ??
      "Work Hub";

  const navigationItems = buildNavigationItems(userRole);

  const handleLogout = () => {
    setAuthState(false);
    window.location.href = "/";
  };

  const getBadgeValue = (label: string) => {
    if (label === "Notifications" && notificationCount > 0)
      return String(notificationCount);
    if (label === "Projects" && activeProjectCount > 0)
      return String(activeProjectCount);
    return undefined;
  };

  const SidebarContent = () => {
    const isCompactDesktop = collapsed;

    return (
        <div className="flex h-full flex-col bg-white">
          {/* 상단 프로필/닫기/토글 */}
          <div className={cn("p-4", isCompactDesktop && "px-2")}>
            <div
                className={cn(
                    "flex items-center justify-between gap-6",
                    isCompactDesktop && "justify-center gap-2",
                )}
            >
              {!isCompactDesktop && (
                  <div className="flex items-center gap-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                      {profileImageUrl ? (
                          <img
                              src={profileImageUrl}
                              alt="사용자 프로필"
                              className="h-10 w-10 rounded-lg object-cover"
                          />
                      ) : (
                          <UserRound className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{profileId}</p>
                      <p className="text-xs text-muted-foreground">{profileEmail}</p>
                    </div>
                  </div>
              )}

              {/* 오른쪽 버튼 */}
              <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed((prev) => !prev)}
                    aria-label="사이드바 접기/펼치기"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
<<<<<<< Updated upstream

          {/* 메뉴 */}
          <nav
=======
        </div>
      </div>
      <nav
        className={cn(
          "flex-1 space-y-4 p-6",
          isCompact && "flex flex-col items-center space-y-0 gap-3 px-2 py-4",
        )}
      >
        {(
          userRole === "ADMIN"
            ? ([
                { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
                { label: "Projects", icon: FolderOpen, path: "/projects" },
                { label: "Users", icon: Users, path: "/admin/users" },
                { label: "History", icon: History, path: "/history" },
                { label: "Settings", icon: Settings, path: "/settings" },
              ] satisfies NavigationItem[])
            : ([
                { label: "Projects", icon: FolderOpen, path: "/projects" },
                { label: "Notifications", icon: Bell, path: "/notifications" },
                { label: "Settings", icon: Settings, path: "/settings" },
              ] satisfies NavigationItem[])
        ).map((item) => {
          const isActive = item.path ? (() => {
            if (item.path === "/admin/users") {
              // Users 메뉴는 /admin/users와 /admin/companies 둘 다 활성화
              return location.pathname.startsWith("/admin/users") || location.pathname.startsWith("/admin/companies");
            }
            return location.pathname.startsWith(item.path);
          })() : false;
          const badgeValue = (() => {
            if (item.label === "Notifications" && notificationCount > 0) {
              return String(notificationCount);
            }
            if (item.label === "Projects" && activeProjectCount > 0) {
              return String(activeProjectCount);
            }
            return item.badge;
          })();
          const isCompact = collapsed && !isMobile;
          return (
            <Button
              key={item.label}
              variant="ghost"
              size={isCompact ? "icon" : "default"}
>>>>>>> Stashed changes
              className={cn(
                  "flex-1 space-y-4 p-6",
                  isCompactDesktop && "flex flex-col items-center space-y-0 gap-3 px-2 py-4",
              )}
          >
            {navigationItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const badgeValue = getBadgeValue(item.label);

              return (
                  <Button
                      key={item.label}
                      variant="ghost"
                      size={isCompactDesktop ? "icon" : "default"}
                      className={cn(
                          !isCompactDesktop &&
                          "flex w-full items-center justify-start gap-3 text-sm transition-all",
                          isActive && "text-white",
                      )}
                      style={isActive ? { backgroundColor: "var(--point-color)" } : undefined}
                      onClick={() => navigate(item.path)}
                  >
                    <item.icon className="h-5 w-5" />
                    {!isCompactDesktop && (
                        <>
                          <span className="flex-1 text-left font-normal">{item.label}</span>
                          {badgeValue ? (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal">
                        {badgeValue}
                      </span>
                          ) : null}
                        </>
                    )}
                  </Button>
              );
            })}

            <Button
                variant="ghost"
                size={isCompactDesktop ? "icon" : "default"}
                className={cn(
                    isCompactDesktop
                        ? undefined
                        : "flex w-full items-center justify-start gap-3 text-sm transition-all hover:text-foreground",
                )}
                onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              {!isCompactDesktop && (
                  <span className="flex-1 text-left font-normal">Logout</span>
              )}
            </Button>
          </nav>
        </div>
    );
  };

  return (
      <>
        {/* 데스크탑 사이드바 */}
        <aside
            className={cn(
                "hidden md:flex flex-col border-r bg-white shadow-sm transition-[width] duration-200",
                collapsed ? "w-16" : "w-72",
            )}
        >
          <SidebarContent />
        </aside>
      </>
  );
}
