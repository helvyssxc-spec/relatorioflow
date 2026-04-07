import { Outlet } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-slate-50/50 dark:bg-slate-950/50">
        {/* ── Header premium com gradiente sutil ── */}
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 px-4
          border-b border-slate-200/80 dark:border-slate-800/80
          bg-white/80 dark:bg-slate-900/80 backdrop-blur-md
          supports-[backdrop-filter]:bg-white/60">
          <SidebarTrigger
            className="-ml-1 text-slate-500 hover:text-slate-900 dark:text-slate-400
              dark:hover:text-slate-100 transition-colors duration-200
              hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
          />
          <Separator orientation="vertical" className="h-5 bg-slate-200 dark:bg-slate-700" />

          {/* Gradiente decorativo sutil no header */}
          <div className="flex-1 h-px bg-gradient-to-r from-blue-500/20 via-indigo-500/10 to-transparent rounded-full" />
        </header>

        {/* ── Conteúdo principal ── */}
        <main className="flex flex-col flex-1 gap-0 p-4 md:p-6 lg:p-8 min-h-0">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
