import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ShieldCheck, User, Stethoscope, ArrowRight, Activity, Zap } from 'lucide-react';

const RoleSelection = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Data passed from Login.jsx
    const { user_id, available_roles } = location.state || {};

    useEffect(() => {
        if (!user_id || !available_roles) {
            navigate('/login');
        }
    }, [user_id, available_roles, navigate]);

    const handleRoleSelect = async (role) => {
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/select-role/', { user_id, role });
            // Login function in AuthContext usually sets state and redirects
            login(response.user);
            
            // Redirection logic based on role
            if (role === 'admin') navigate('/admin/dashboard');
            else if (role === 'doctor') navigate('/doctor/dashboard');
            else navigate('/patient/dashboard');
        } catch (err) {
            setError(err.message || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    const getRoleIcon = (role) => {
        switch(role) {
            case 'admin': return <ShieldCheck size={32} />;
            case 'doctor': return <Stethoscope size={32} />;
            default: return <User size={32} />;
        }
    };

    const getRoleColor = (role) => {
        switch(role) {
            case 'admin': return 'hsl(var(--primary))';
            case 'doctor': return 'hsl(280, 70%, 55%)';
            default: return 'hsl(var(--secondary))';
        }
    };

    const getRoleLabel = (role) => {
        switch(role) {
            case 'admin': return 'Administrator';
            case 'doctor': return 'Doctor';
            case 'patient': return 'Patient';
            default: return role;
        }
    };

    return (
        <div className="auth-page bg-gradient">
            <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '600px', padding: '4rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
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
                        <Zap size={32} />
                    </div>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '0.75rem', fontWeight: '800' }}>Select <span className="gradient-text">Account</span></h2>
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1.1rem' }}>
                        Multiple accounts found. Please choose which one to use.
                    </p>
                </div>

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: '2rem', padding: '1rem', borderRadius: '1rem', background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))', fontWeight: '600' }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {available_roles?.map((role) => (
                        <button
                            key={role}
                            onClick={() => handleRoleSelect(role)}
                            disabled={loading}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1.5rem',
                                padding: '1.75rem',
                                borderRadius: '1.5rem',
                                border: '1px solid hsl(var(--border))',
                                background: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                textAlign: 'left',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.08)';
                                e.currentTarget.style.borderColor = getRoleColor(role);
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.borderColor = 'hsl(var(--border))';
                            }}
                        >
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '1.1rem',
                                background: `${getRoleColor(role)}15`,
                                color: getRoleColor(role),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {getRoleIcon(role)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '800', fontSize: '1.25rem', color: 'hsl(var(--foreground))', textTransform: 'capitalize' }}>
                                    {role}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))', fontWeight: '600' }}>
                                    {getRoleLabel(role)}
                                </div>
                            </div>
                            <ArrowRight size={20} style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.5 }} />
                        </button>
                    ))}
                </div>

                <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                    <button 
                        onClick={() => navigate('/login')}
                        style={{ background: 'none', border: 'none', color: 'hsl(var(--muted-foreground))', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Return to Login
                    </button>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .bg-gradient { background: radial-gradient(circle at top right, hsl(var(--primary) / 0.05), transparent), radial-gradient(circle at bottom left, hsl(var(--secondary) / 0.05), transparent); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
                .glass-card { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 2.5rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1); }
                .gradient-text { background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary))); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            `}} />
        </div>
    );
};

export default RoleSelection;
