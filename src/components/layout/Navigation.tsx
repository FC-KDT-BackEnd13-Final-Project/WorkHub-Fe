import { useState, ReactNode, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { Moon, Sun, Menu, X, LogOut } from "lucide-react";
import { useLocalStorageValue } from "../../hooks/useLocalStorageValue";
import {
  PROFILE_STORAGE_KEY,
  type UserRole,
  normalizeUserRole,
} from "../../constants/profile";
import { buildNavigationItems, type NavigationItem } from "./Sidebar";

// 랜딩 페이지 상단 고정 네비게이션과 테마 토글을 관리하는 컴포넌트
interface NavigationProps {
  mobileMenuContent?: ReactNode;
}

export function Navigation({ mobileMenuContent }: NavigationProps = {}) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  type StoredSettings = {
    profile?: {
      role?: string;
    };
  };

  type StoredUser = {
    role?: string;
  };

  const [storedSettings] = useLocalStorageValue<StoredSettings | null>(PROFILE_STORAGE_KEY, {
    defaultValue: null,
    parser: (value) => JSON.parse(value),
    listen: true,
  });

  const [storedUser] = useLocalStorageValue<StoredUser | null>("user", {
    defaultValue: null,
    parser: (value) => JSON.parse(value),
    listen: true,
  });

  const userRole = useMemo<UserRole>(() => {
    const profileRole = normalizeUserRole(storedSettings?.profile?.role);
    if (profileRole) return profileRole;
    const storedUserRole = normalizeUserRole(storedUser?.role);
    return storedUserRole ?? "DEVELOPER";
  }, [storedSettings, storedUser]);

  const navItems: NavigationItem[] = buildNavigationItems(userRole);
  const [, setAuthState, removeAuthState] = useLocalStorageValue<boolean>("workhub:auth", {
    defaultValue: false,
    parser: (value) => value === "true",
    serializer: (value) => (value ? "true" : "false"),
    listen: false,
  });

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
      <nav className="sticky top-0 z-[200] w-full border-b border-border bg-white shadow-sm">
        <div className="flex w-full items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="text-xl font-medium">
              <span className="text-foreground">Work</span>
              <span style={{ color: "var(--point-color)" }}>Hub</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {[
              { label: "Home", id: "home" },
              { label: "About", id: "about" },
              { label: "Team", id: "team" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/#${item.id}`)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

          <div className="md:hidden flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 px-4">
            {mobileMenuContent ? (
              mobileMenuContent
            ) : (
              <div className="flex flex-col space-y-4">
                {navItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        navigate(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 text-left text-muted-foreground hover:text-foreground transition-colors",
                        isActive && "text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 text-left text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
  );
}
  const handleLogout = () => {
    setAuthState(false);
    removeAuthState();
    window.location.href = "/";
  };
