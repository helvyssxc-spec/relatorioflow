import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FilePlus,
  FolderOpen,
  Settings,
  LogOut,
  HardHat,
  CreditCard,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/useAuth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const navMain = [
  { to: '/app/dashboard',      icon: LayoutDashboard, label: 'Início' },
  { to: '/app/relatorio/novo', icon: FilePlus,         label: 'Novo Relatório' },
  { to: '/app/reports',        icon: FolderOpen,       label: 'Histórico' },
]

const navAccount = [
  { to: '/app/configuracoes', icon: Settings,    label: 'Configurações' },
  { to: '/app/plano',         icon: CreditCard,  label: 'Meu Plano' },
]

export function AppSidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'RF'

  return (
    <Sidebar className="border-r border-slate-200/80 dark:border-slate-800/80">
      {/* ── Brand ── */}
      <SidebarHeader className="px-4 py-5 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-3">
          {/* Logo com gradiente azul-índigo */}
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600
            flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <HardHat className="w-4.5 h-4.5 text-white" strokeWidth={2} />
            {/* brilho interno */}
            <div className="absolute inset-0 rounded-xl bg-white/10" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight truncate">
              RelatórioFlow
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest">
              MVP
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {/* ── Navegação principal ── */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest
            text-slate-400 dark:text-slate-600 px-2 mb-1">
            Relatórios
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navMain.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium',
                          'transition-all duration-150',
                          isActive
                            ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/5 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            className={cn(
                              'w-4 h-4 shrink-0 transition-colors',
                              isActive ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500'
                            )}
                            strokeWidth={isActive ? 2.5 : 2}
                          />
                          <span>{item.label}</span>
                          {isActive && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          )}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Conta ── */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest
            text-slate-400 dark:text-slate-600 px-2 mb-1">
            Conta
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navAccount.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium',
                          'transition-all duration-150',
                          isActive
                            ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/5 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            className={cn(
                              'w-4 h-4 shrink-0 transition-colors',
                              isActive ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500'
                            )}
                            strokeWidth={isActive ? 2.5 : 2}
                          />
                          <span>{item.label}</span>
                          {isActive && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          )}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer — usuário + logout ── */}
      <SidebarFooter className="px-3 py-4 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-1">
          <NavLink 
            to="/app/configuracoes"
            className="flex flex-1 items-center gap-3 px-2 py-2 rounded-lg
              hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors duration-150 group min-w-0"
          >
            <Avatar className="w-7 h-7 shrink-0">
              <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate leading-tight">
                {user?.email ?? '—'}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-600">Ver perfil</p>
            </div>
          </NavLink>
          <button
            onClick={handleSignOut}
            title="Sair"
            className="p-1.5 rounded-md text-slate-400 hover:text-red-500 dark:hover:text-red-400
              hover:bg-red-50 dark:hover:bg-red-500/10
              transition-all duration-150"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
