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
import ReportView from '@/pages/ReportView'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'
import Checkout from '@/pages/Checkout'

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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Register />} />

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
              <Route path="relatorio/:id" element={<ReportView />} />
              <Route path="reports" element={<Reports />} />
              <Route path="configuracoes" element={<Settings />} />
              <Route path="plano" element={<Checkout />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
