// client/src/App.tsx
import { useState, useEffect } from 'react'
import Desktop from './desktop/Desktop'
import Login from './components/Login'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session in localStorage
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (token && savedUser) {
      // In mock mode, just accept the stored user
      setIsAuthenticated(true)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const handleLogin = (token: string, userData: any) => {
    setIsAuthenticated(true)
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    setUser(null)
  }

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#888'
      }}>
        Loading...
      </div>
    )
  }

  return (
    <>
      {isAuthenticated ? (
        <Desktop onLogout={handleLogout} user={user} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  )
}

export default App