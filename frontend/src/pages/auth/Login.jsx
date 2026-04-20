// ================= FRONTEND FILE =================
// File: Login.jsx
// Purpose: User authentication portal
// Handles: Session initialization, user credential verification via API, and role-based redirection

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { LogIn, User, Lock, AlertCircle, Sparkles } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login/', formData);
            
            // Multi-role detection and synchronization
            if (response.multi_role) {
                navigate('/role-selection', { 
                    state: { 
                        user_id: response.user_id, 
                        available_roles: response.available_roles 
                    } 
                });
                return;
            }

            const { token, user } = response;
            login({ ...user, token });

            const role = user.role;
            if (role === 'admin') navigate('/admin');
            else if (role === 'doctor') navigate('/doctor');
            else navigate('/patient');

        } catch (err) {
            try {
                const obj = JSON.parse(err.message);
                const messages = Object.values(obj).flat().join(' | ');
                setError(messages);
            } catch {
                setError(err.message || 'Invalid username or password');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">

            <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '440px', padding: '3rem' }}>

                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        background: 'hsl(var(--primary) / 0.1)',
                        width: '64px',
                        height: '64px',
                        borderRadius: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        color: 'hsl(var(--primary))'
                    }}>
                        <LogIn size={32} />
                    </div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Login</h2>
                    <p style={{ color: 'hsl(var(--muted-foreground))' }}>Welcome back to <span style={{ color: 'hsl(var(--primary))', fontWeight: '700' }}>Swasthya Setu</span></p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="label">Identity/Username</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                name="username"
                                className="input"
                                placeholder="Enter your username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                style={{ paddingLeft: '3rem' }}
                            />
                            <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="label">Secure Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="password"
                                name="password"
                                className="input"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                style={{ paddingLeft: '3rem' }}
                            />
                            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Authenticating...' : 'Sign In to Portal'}
                    </button>
                    <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                        <Link to="/forgot-password" style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', textDecoration: 'none' }}>Forgot Password?</Link>
                    </div>
                </form>

                <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))' }}>
                    New user? <Link to="/register" style={{ color: 'hsl(var(--primary))', fontWeight: '700', textDecoration: 'none' }}>Create Account</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
