// client/src/components/Login.tsx
import { useState } from 'react'

interface LoginProps {
    onLogin: (token: string, user: any) => void
}

// Mock users for testing
const MOCK_USERS = [
    {
        id: '1',
        username: 'admin',
        email: 'admin@evolveos.local',
        password: 'admin123',
        name: 'Administrator'
    },
    {
        id: '2',
        username: 'demo',
        email: 'demo@evolveos.local',
        password: 'demo123',
        name: 'Demo User'
    }
]

export default function Login({ onLogin }: LoginProps) {
    const [isLogin, setIsLogin] = useState(true)
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
        setError('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        if (isLogin) {
            // Mock login
            const user = MOCK_USERS.find(u => u.email === formData.email && u.password === formData.password)

            if (user) {
                // Create mock token
                const token = `mock-jwt-token-${user.id}-${Date.now()}`

                // Store in localStorage
                localStorage.setItem('token', token)
                localStorage.setItem('user', JSON.stringify({
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    name: user.name
                }))

                onLogin(token, user)
            } else {
                setError('Invalid email or password')
            }
        } else {
            // Mock registration
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match')
                setLoading(false)
                return
            }

            // Check if user exists
            const existingUser = MOCK_USERS.find(u => u.email === formData.email)
            if (existingUser) {
                setError('User already exists')
                setLoading(false)
                return
            }

            // Create new mock user
            const newUser = {
                id: String(MOCK_USERS.length + 1),
                username: formData.username,
                email: formData.email,
                password: formData.password,
                name: formData.username
            }

            // In real app, this would be saved to database
            // For mock, we'll just log in immediately
            const token = `mock-jwt-token-${newUser.id}-${Date.now()}`

            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify({
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                name: newUser.name
            }))

            onLogin(token, newUser)
        }

        setLoading(false)
    }

    const fillDemoCredentials = () => {
        setFormData({
            ...formData,
            email: 'admin@evolveos.local',
            password: 'admin123'
        })
    }

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            {/* Background pattern */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'radial-gradient(circle at 1px 1px, #333 1px, transparent 0)',
                backgroundSize: '40px 40px',
                opacity: 0.3
            }} />

            {/* Login Card */}
            <div style={{
                background: '#1e1e1e',
                borderRadius: '12px',
                padding: '40px',
                width: '400px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                border: '1px solid #333',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Logo */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '32px'
                }}>
                    <div style={{
                        fontSize: '48px',
                        marginBottom: '16px'
                    }}>
                        🖥️
                    </div>
                    <h1 style={{
                        color: '#fff',
                        fontSize: '24px',
                        fontWeight: 500,
                        margin: 0,
                        letterSpacing: '0.5px'
                    }}>
                        Evolve OS
                    </h1>
                    <p style={{
                        color: '#888',
                        fontSize: '14px',
                        marginTop: '8px'
                    }}>
                        {isLogin ? 'Welcome back' : 'Create your account'}
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        background: '#ff6b6b20',
                        border: '1px solid #ff6b6b',
                        borderRadius: '6px',
                        padding: '12px',
                        marginBottom: '20px',
                        color: '#ff6b6b',
                        fontSize: '13px',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                color: '#888',
                                fontSize: '12px',
                                marginBottom: '4px'
                            }}>
                                Username
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required={!isLogin}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: '#252525',
                                    border: '1px solid #333',
                                    borderRadius: '6px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            color: '#888',
                            fontSize: '12px',
                            marginBottom: '4px'
                        }}>
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#252525',
                                border: '1px solid #333',
                                borderRadius: '6px',
                                color: '#fff',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            color: '#888',
                            fontSize: '12px',
                            marginBottom: '4px'
                        }}>
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#252525',
                                border: '1px solid #333',
                                borderRadius: '6px',
                                color: '#fff',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {!isLogin && (
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                color: '#888',
                                fontSize: '12px',
                                marginBottom: '4px'
                            }}>
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required={!isLogin}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: '#252525',
                                    border: '1px solid #333',
                                    borderRadius: '6px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: '#0a4a8a',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 500,
                            cursor: loading ? 'default' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            marginBottom: '16px'
                        }}
                    >
                        {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>

                    <div style={{
                        textAlign: 'center',
                        color: '#888',
                        fontSize: '13px'
                    }}>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin)
                                setError('')
                                setFormData({
                                    username: '',
                                    email: '',
                                    password: '',
                                    confirmPassword: ''
                                })
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#0a4a8a',
                                cursor: 'pointer',
                                fontSize: '13px',
                                textDecoration: 'underline'
                            }}
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </div>
                </form>

                {/* Demo credentials */}
                {isLogin && (
                    <div style={{
                        marginTop: '32px',
                        padding: '16px',
                        background: '#252525',
                        borderRadius: '6px',
                        border: '1px dashed #444'
                    }}>
                        <p style={{
                            color: '#888',
                            fontSize: '12px',
                            margin: '0 0 8px 0'
                        }}>
                            Demo Credentials:
                        </p>
                        <p style={{
                            color: '#ccc',
                            fontSize: '12px',
                            margin: '4px 0',
                            fontFamily: 'monospace'
                        }}>
                            Email: admin@evolveos.local
                        </p>
                        <p style={{
                            color: '#ccc',
                            fontSize: '12px',
                            margin: '4px 0',
                            fontFamily: 'monospace'
                        }}>
                            Password: admin123
                        </p>
                        <button
                            onClick={fillDemoCredentials}
                            style={{
                                width: '100%',
                                marginTop: '8px',
                                padding: '6px',
                                background: 'transparent',
                                border: '1px solid #0a4a8a',
                                borderRadius: '4px',
                                color: '#0a4a8a',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            Fill Demo Credentials
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}