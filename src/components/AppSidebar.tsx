import { FileText, LayoutDashboard, Clock, Settings, CreditCard, LogOut, ShieldCheck, LifeBuoy, HelpCircle } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/components/AdminRoute";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard },
  { title: "Histórico", url: "/app/reports", icon: Clock },
];

const bottomNav = [
  { title: "Configurações", url: "/app/configuracoes", icon: Settings },
  { title: "Planos", url: "/app/plano", icon: CreditCard },
];

interface AppSidebarProps {
  onOpenTutorial?: () => void;
}

export function AppSidebar({ onOpenTutorial }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, user } = useAuth();
  const { isAdmin } = useIsAdmin();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-background/50 backdrop-blur-xl">
      <SidebarContent className="bg-transparent">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <FileText className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base leading-none text-foreground tracking-tight">RelatorioFlow</span>
                <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-black tracking-tighter">PRO</span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 font-black">Engenharia Elite</span>
            </div>
          )}
        </div>

        <SidebarGroup className="px-3">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10 rounded-xl transition-all hover:bg-primary/5 group">
                    <NavLink 
                      to={item.url} 
                      end 
                      className="flex items-center gap-3 px-3 w-full" 
                      activeClassName="bg-primary/10 text-primary font-semibold shadow-sm"
                    >
                      <item.icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto px-3">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {bottomNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10 rounded-xl transition-all hover:bg-primary/5 group">
                    <NavLink 
                      to={item.url} 
                      end 
                      className="flex items-center gap-3 px-3 w-full" 
                      activeClassName="bg-primary/10 text-primary font-semibold shadow-sm"
                    >
                      <item.icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="h-10 rounded-xl transition-all hover:bg-primary/5 group">
                    <NavLink to="/admin" end className="flex items-center gap-3 px-3 w-full" activeClassName="bg-primary/10 text-primary font-semibold">
                      <ShieldCheck className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                      {!collapsed && <span className="text-sm">Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50 bg-transparent space-y-3">
        {user && !collapsed && (
          <div className="px-2 py-2 mb-2 flex items-center gap-3 bg-muted/30 rounded-2xl border border-border/50 overflow-hidden text-ellipsis whitespace-nowrap">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">{user.email?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate text-foreground">{user.user_metadata?.full_name || 'Engenheiro'}</span>
              <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
            </div>
          </div>
        )}
        
        <div className="space-y-1">
          {onOpenTutorial && (
            <button
              onClick={onOpenTutorial}
              className="flex items-center gap-3 w-full text-xs text-muted-foreground hover:text-foreground transition-all py-2 px-3 rounded-xl hover:bg-muted/50"
            >
              <HelpCircle className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Ver tutorial</span>}
            </button>
          )}
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full text-xs text-muted-foreground hover:text-red-500 transition-all py-2 px-3 rounded-xl hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

