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
  { to: "/app/dashboard", icon: LayoutDashboard, label: "Criar" },
  { to: "/app/reports", icon: Clock, label: "Histórico" },
  { to: "/app/configuracoes", icon: SettingsIcon, label: "Config" },
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
      <div className="min-h-screen flex w-full bg-background selection:bg-primary/20 selection:text-primary">
        <AppSidebar onOpenTutorial={tutorial.restart} />
        <div className="flex-1 flex flex-col min-w-0 bg-background/50">
          <header className="h-16 flex items-center justify-between border-b border-border/50 px-6 backdrop-blur-xl bg-background/80 sticky top-0 z-40">
            <div className="flex items-center gap-4 min-w-0">
              <SidebarTrigger className="hover:bg-primary/10 hover:text-primary transition-colors" />
              <div className="h-4 w-px bg-border/50 hidden sm:block" />
              <h1 className="text-sm font-bold tracking-tight text-foreground/80 uppercase truncate">{title}</h1>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              {showUpgrade && (
                <Button asChild variant="outline" size="sm" className="hidden sm:flex gap-2 rounded-full border-primary/20 hover:bg-primary/5 text-primary text-xs font-semibold px-4 transition-all hover:scale-105 active:scale-95">
                  <Link to="/app/plano"><ArrowUpCircle className="h-3.5 w-3.5" /> Fazer upgrade</Link>
                </Button>
              )}
              <NotificationBell />
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-primary/20 ring-4 ring-primary/10">
                {initials}
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-8 overflow-auto pb-24 md:pb-8 max-w-7xl mx-auto w-full animate-fade-in">
            {children}
          </main>

          {/* Mobile bottom navigation */}
          <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-sm bg-background/80 backdrop-blur-2xl border border-border/50 flex items-center justify-around py-3 rounded-2xl z-50 shadow-2xl overflow-hidden ring-1 ring-black/5">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
            {mobileNav.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-1 text-[10px] font-bold uppercase tracking-wider transition-all relative z-10",
                  location.pathname === item.to ? "text-primary scale-110" : "text-muted-foreground/60 hover:text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", location.pathname === item.to ? "stroke-[2.5px]" : "stroke-[1.5px]")} />
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
