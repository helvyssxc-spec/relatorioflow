import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <h2 className="text-xl font-semibold text-gray-900">Algo deu errado</h2>
            <p className="text-gray-600 text-sm">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
              Recarregar página
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
