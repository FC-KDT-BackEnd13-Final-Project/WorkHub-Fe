import { useState, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "../ui/button";
import { Moon, Sun, Menu, X } from "lucide-react";

// 랜딩 페이지 상단 고정 네비게이션과 테마 토글을 관리하는 컴포넌트
interface NavigationProps {
  onOpenSidebar?: () => void;
  mobileMenuContent?: ReactNode;
}

export function Navigation({ onOpenSidebar, mobileMenuContent }: NavigationProps = {}) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  const handleNavClick = (sectionId: string) => {
    if (location.pathname !== "/") {
      navigate(`/#${sectionId}`);
      setIsMobileMenuOpen(false);
      return;
    }
    scrollToSection(sectionId);
  };

  const navItems = [
    { label: 'Home', id: 'home' },
    { label: 'About', id: 'about' },
    { label: 'Team', id: 'team' },
  ];

  return (
      <nav className="sticky top-0 z-[200] w-full border-b border-border bg-white shadow-sm">
        <div className="flex w-full items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            {onOpenSidebar && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenSidebar}
                className="md:hidden"
                aria-label="사이드바 열기"
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            <div className="text-xl font-medium">
              <span className="text-foreground">Work</span>
              <span style={{ color: "var(--point-color)" }}>Hub</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
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
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4">
            {mobileMenuContent ? (
              mobileMenuContent
            ) : (
              <div className="flex flex-col space-y-4">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className="text-left text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>
  );
}
