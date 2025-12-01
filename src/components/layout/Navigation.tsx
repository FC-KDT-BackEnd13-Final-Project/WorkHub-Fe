import { useState, useEffect, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Moon, Sun, Menu, X } from "lucide-react";

// 랜딩 페이지 상단 고정 네비게이션과 테마 토글을 관리하는 컴포넌트
interface NavigationProps {
  onOpenSidebar?: () => void;
  mobileMenuContent?: ReactNode;
}

export function Navigation({ onOpenSidebar, mobileMenuContent }: NavigationProps = {}) {
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
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
    <>
      <nav className="fixed top-0 w-full bg-background/90 backdrop-blur-md border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-2">
            {/*{onOpenSidebar && (*/}
            {/*  <Button*/}
            {/*    variant="ghost"*/}
            {/*    size=""*/}
            {/*    onClick={onOpenSidebar}*/}
            {/*    className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 h-8 rounded-md gap-1.5 has-[&_svg]:px-2.5 p-2 md:hidden"*/}
            {/*    aria-label="Open sidebar"*/}
            {/*  >*/}
            {/*    <Menu className="h-4 w-4" />*/}
            {/*  </Button>*/}
            {/*)}*/}
            <div className="text-xl font-medium">
              <span className="text-foreground">Work</span>
              <span style={{ color: "var(--point-color)" }}>Hub</span>
            </div>
          </div>

          {/* Desktop Navigation */}
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

          {/* Mobile Menu Button */}
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
          <div className="md:hidden py-4 border-t border-border">
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
      </div>
      </nav>
      <div className="h-[88px]" aria-hidden />
    </>
  );
}
