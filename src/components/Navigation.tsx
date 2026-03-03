import { Link, useLocation } from "react-router-dom";
import { ProfessionalButton } from "@/components/ui/button-variants";
import { Home, BarChart3, LayoutDashboard, Archive, Menu, X } from "lucide-react";
import { AdminIcon } from "@/components/ui/AdminIcon";
import { CheckInIcon } from "@/components/ui/CheckInIcon";
import { ViewLogsIcon } from "@/components/ui/ViewLogsIcon";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo, memo } from "react";

const NavigationItem = memo(({ href, label, icon: Icon, isActive }: {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
  isActive: boolean;
}) => (
  <Link key={href} to={href}>
    <ProfessionalButton
      variant={isActive ? "default" : "ghost"}
      size="sm"
      className={cn(
        "flex items-center gap-2 transition-all duration-200 hover:scale-105",
        isActive && "bg-primary text-primary-foreground shadow-button"
      )}
    >
      {Icon === AdminIcon || Icon === CheckInIcon || Icon === ViewLogsIcon ? (
        <Icon className={
          Icon === ViewLogsIcon
            ? isActive
              ? "w-4 h-4 text-white"
              : "w-4 h-4 text-primary hover:text-white transition-colors"
            : Icon === CheckInIcon
              ? isActive
                ? "w-4 h-4 text-white"
                : "w-4 h-4 text-primary hover:text-white transition-colors"
              : Icon === AdminIcon
                ? isActive
                  ? "w-4 h-4 text-white"
                  : "w-4 h-4 text-primary hover:text-white transition-colors"
                : "w-4 h-4 text-primary hover:text-white transition-colors"
        } />
      ) : (
        <Icon className="w-4 h-4 text-primary" />
      )}
      <span className="hidden lg:inline">{label}</span>
    </ProfessionalButton>
  </Link>
));

NavigationItem.displayName = 'NavigationItem';

export const Navigation = memo(() => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const checkAdmin = () => {
      const token = localStorage.getItem('adminToken');
      const adminStatus = localStorage.getItem('isAdmin');

      if (adminStatus === 'true' && token) {
        // Use localStorage-based auth (no API call needed)
        console.log('Admin verified via localStorage');
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    };

    checkAdmin();
    // Listen for storage changes
    window.addEventListener('storage', checkAdmin);
    // Also listen for custom admin state change events
    window.addEventListener('adminStateChange', checkAdmin);
    return () => {
      window.removeEventListener('storage', checkAdmin);
      window.removeEventListener('adminStateChange', checkAdmin);
    };
  }, []);

  const navItems = useMemo(() => {
    const isGuestPage = location.pathname === '/guest-signup';

    if (isGuestPage) {
      // Only show minimal navigation for guests
      return [
        { href: "/", label: "Home", icon: Home }
      ];
    }

    return [
      { href: "/", label: "Check In/Out", icon: CheckInIcon },
      { href: "/logs", label: "View Logs", icon: ViewLogsIcon },
      ...(isAdmin
        ? [
          { href: "/admin-dashboard", label: "Admin", icon: AdminIcon },
          { href: "/stored-records", label: "Records Storage", icon: Archive }
        ]
        : [{ href: "/admin-login", label: "Admin", icon: AdminIcon }]
      ),
    ];
  }, [isAdmin, location.pathname]);

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md shadow-card">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img
              src="/dzikwa-logo.svg"
              alt="Dzikwa Logo"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-[7px] shadow-button"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link key={item.href} to={item.href}>
                  <ProfessionalButton
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "flex items-center gap-2 transition-all duration-200 hover:scale-105",
                      isActive && "bg-primary text-primary-foreground shadow-button"
                    )}
                  >
                    {Icon === AdminIcon || Icon === CheckInIcon || Icon === ViewLogsIcon ? (
                      <Icon className={
                        Icon === ViewLogsIcon
                          ? isActive
                            ? "w-4 h-4 text-white"
                            : "w-4 h-4 text-primary hover:text-white transition-colors"
                          : Icon === CheckInIcon
                            ? isActive
                              ? "w-4 h-4 text-white"
                              : "w-4 h-4 text-primary hover:text-white transition-colors"
                            : Icon === AdminIcon
                              ? isActive
                                ? "w-4 h-4 text-white"
                                : "w-4 h-4 text-primary hover:text-white transition-colors"
                              : "w-4 h-4 text-primary hover:text-white transition-colors"
                      } />
                    ) : (
                      <Icon className="w-4 h-4 text-primary" />
                    )}
                    <span className="hidden lg:inline">{item.label}</span>
                  </ProfessionalButton>
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-foreground hover:text-primary transition-colors p-2"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-card/95 backdrop-blur-md">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <Link key={item.href} to={item.href} onClick={() => setIsMenuOpen(false)}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted hover:text-primary"
                      )}
                    >
                      {typeof Icon === 'function' && (Icon.name === 'AdminIcon' || Icon.name === 'CheckInIcon' || Icon.name === 'ViewLogsIcon') ? (
                        <Icon className={Icon.name === 'ViewLogsIcon' ? "w-5 h-5 text-white" : "w-5 h-5 text-primary"} />
                      ) : (
                        <Icon className="w-5 h-5 text-primary" />
                      )}
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
});

Navigation.displayName = 'Navigation';