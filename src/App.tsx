import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'

// Pages
import Index from '@/pages/Index'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import NewReport from '@/pages/NewReport'
import DiarioObra from '@/pages/DiarioObra'
import RelatorioTecnico from '@/pages/RelatorioTecnico'
import RelatorioManutencao from '@/pages/RelatorioManutencao'
import ReportView from '@/pages/ReportView'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'
import Support from '@/pages/Support'
import AdminTickets from '@/pages/AdminTickets'
import Checkout from '@/pages/Checkout'
import RelatorioNBR16280 from '@/pages/RelatorioNBR16280'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Register />} />
            <Route path="/esqueci-senha" element={<ForgotPassword />} />
            <Route path="/redefinir-senha" element={<ResetPassword />} />

            {/* Protected */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="relatorio/novo" element={<NewReport />} />
              <Route path="relatorio/novo/diario" element={<DiarioObra />} />
              <Route path="relatorio/novo/tecnico" element={<RelatorioTecnico />} />
              <Route path="relatorio/novo/manutencao" element={<RelatorioManutencao />} />
              <Route path="relatorio/novo/nbr16280" element={<RelatorioNBR16280 />} />
              <Route path="relatorio/:id" element={<ReportView />} />
              <Route path="reports" element={<Reports />} />
              <Route path="configuracoes" element={<Settings />} />
              <Route path="suporte" element={<Support />} />
              <Route path="admin/tickets" element={<AdminTickets />} />
              <Route path="plano" element={<Checkout />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          {/* <Analytics /> */}
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
    </ErrorBoundary>
  )
}
