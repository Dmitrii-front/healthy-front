import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  fallback: ReactNode | ((error: Error, reset: () => void) => ReactNode)
  children: ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info)
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info)
    }
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      const { fallback } = this.props
      return typeof fallback === 'function' ? fallback(this.state.error, this.reset) : fallback
    }
    return this.props.children
  }
}
