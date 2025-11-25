import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";
import profileImage from "../../image/Jieun.jpg";

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { id: "projects", label: "Projects", icon: FolderOpen, path: "/projects", badge: "24" },
  { id: "team", label: "Team", icon: Users, path: "/team" },
  { id: "notifications", label: "Notifications", icon: Bell, path: "/notifications", badge: "5" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  const SidebarContent = ({ isMobile }: { isMobile?: boolean }) => (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <img src={profileImage} alt="김지은" className="h-12 w-12 rounded-full object-cover" />
              </div>
              <div>
                <p className="font-semibold text-base">김지은</p>
                <p className="text-xs text-muted-foreground">Work Hub</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            {isMobile ? (
              <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)}>
                <X className="h-4 w-4" aria-hidden />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={onToggle}>
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {navigationItems.map((item) => (
          <Button
            key={item.id}
            variant={location.pathname === item.path ? "secondary" : "ghost"}
            className={cn("w-full justify-start text-[15px] font-medium", collapsed && !isMobile && "justify-center px-2")}
            onClick={() => handleNavigate(item.path)}
          >
            <item.icon className={cn("h-4 w-4", !collapsed && "mr-3")} aria-hidden />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </Button>
        ))}
      </nav>

      <div className="border-t p-4">
        <Button
          variant="outline"
          className={cn("w-full justify-center text-sm", collapsed && !isMobile && "px-2")}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsMobileOpen(true)}
        className="fixed left-4 top-[100px] z-50 md:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-4 w-4" aria-hidden />
      </Button>

      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setIsMobileOpen(false)} aria-hidden />
      )}

      <div
        className={cn(
          "hidden md:flex sticky top-16 h-[calc(100vh-4rem)] flex-col border-r bg-white shadow-sm transition-all duration-300",
          collapsed ? "md:w-16" : "md:w-1/3",
        )}
      >
        <SidebarContent />
      </div>

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-full bg-white border-r transform transition-transform duration-300 md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent isMobile />
      </div>
    </>
  );
}
