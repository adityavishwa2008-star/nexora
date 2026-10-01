import { Component } from 'react'

class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    return <main className="container page-section error-boundary" role="alert">
      <p className="eyebrow">NEXORA needs a refresh</p>
      <h1>Something went wrong.</h1>
      <p className="form-error">{this.state.error.message || 'The page could not be rendered.'}</p>
      <button className="button" type="button" onClick={this.handleReload}>Reload page</button>
    </main>
  }
}

export default ErrorBoundary