'use client'
import Alba from '../components/Alba'
import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', background: '#131110',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '2rem', fontFamily: 'monospace',
        }}>
          <div style={{ color: '#C8A96E', fontSize: '1rem', marginBottom: '1rem' }}>
            Erreur ALBA — détail :
          </div>
          <div style={{
            color: '#ff6b6b', fontSize: '0.85rem', lineHeight: 1.8,
            background: '#1E1A16', padding: '1.5rem', borderRadius: '8px',
            maxWidth: 500, width: '100%', wordBreak: 'break-word',
          }}>
            <strong>{String(this.state.error)}</strong>
            <br/><br/>
            <span style={{color:'#B0A59A', fontSize:'0.75rem'}}>
              {this.state.error?.stack?.split('\n').slice(0,6).join('\n')}
            </span>
          </div>
        </div>
      )
    }
    return this.props.children;
  }
}

export default function Home() {
  return <ErrorBoundary><Alba /></ErrorBoundary>
}
