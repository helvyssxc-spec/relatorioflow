import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ArrowUpCircle, LayoutDashboard, Clock, LifeBuoy, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { useTutorial } from "@/hooks/useTutorial";
import { TutorialModal } from "@/components/TutorialModal";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  showUpgrade?: boolean;
}

const mobileNav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Criar" },
  { to: "/reports", icon: Clock, label: "Histórico" },
  { to: "/support", icon: LifeBuoy, label: "Suporte" },
  { to: "/settings", icon: SettingsIcon, label: "Config" },
];

const AppLayout = ({ children, title, showUpgrade = true }: AppLayoutProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const tutorial = useTutorial();
  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar onOpenTutorial={tutorial.restart} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger />
              <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {showUpgrade && (
                <Button asChild variant="outline" size="sm" className="hidden sm:flex gap-1 text-primary border-primary/30">
                  <Link to="/billing"><ArrowUpCircle className="h-4 w-4" /> Fazer upgrade</Link>
                </Button>
              )}
              <NotificationBell />
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                {initials}
              </div>
            </div>
          </header>
          <main className="flex-1 p-3 sm:p-6 overflow-auto pb-20 md:pb-6">{children}</main>

          {/* Mobile bottom navigation */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex items-center justify-around py-2 z-50">
            {mobileNav.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
                  location.pathname === item.to ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Tutorial modal */}
      <TutorialModal
        isOpen={tutorial.isOpen}
        step={tutorial.step}
        total={tutorial.total}
        onNext={tutorial.next}
        onPrev={tutorial.prev}
        onFinish={tutorial.finish}
      />
    </SidebarProvider>
  );
};

export default AppLayout;
