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
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Histórico", url: "/reports", icon: Clock },
];

const bottomNav = [
  { title: "Suporte", url: "/support", icon: LifeBuoy },
  { title: "Configurações", url: "/settings", icon: Settings },
  { title: "Planos", url: "/billing", icon: CreditCard },
];

interface AppSidebarProps {
  onOpenTutorial?: () => void;
}

export function AppSidebar({ onOpenTutorial }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const { isAdmin } = useIsAdmin();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2">
          <FileText className="h-7 w-7 text-sidebar-primary shrink-0" />
          {!collapsed && <span className="font-bold text-lg text-sidebar-foreground">RelatórioFlow</span>}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-primary/20 text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-primary/20 text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin" end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-primary/20 text-sidebar-primary font-medium">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border space-y-1">
        {onOpenTutorial && (
          <button
            onClick={onOpenTutorial}
            className="flex items-center gap-2 w-full text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors py-1"
          >
            <HelpCircle className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Ver tutorial</span>}
          </button>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors py-1"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
