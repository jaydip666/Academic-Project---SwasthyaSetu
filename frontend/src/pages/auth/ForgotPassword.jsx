// ================= FRONTEND FILE =================
// File: ForgotPassword.jsx
// Purpose: Secure password reset portal
// Handles: User identity verification and password synchronization

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { User, Mail, Phone, Calendar, Lock, ArrowLeft, AlertCircle, CheckCircle, RefreshCcw } from 'lucide-react';

const ForgotPassword = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({
        identity: '',
        security_answer: '',
        new_password: '',
        confirm_password: ''
    });
    const [step, setStep] = useState(1); // 1: identify, 2: reset
    const [securityQuestion, setSecurityQuestion] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleVerifyIdentity = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        
        try {
            const response = await api.post('/auth/get-security-question/', {
                identity: formData.identity
            });
            setSecurityQuestion(response.security_question);
            setStep(2);
        } catch (error) {
            console.error('Identity Verification Error:', error);
            setMessage({ 
                type: 'error', 
                text: error.data?.error || 'Account synchronization failure.' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        if (formData.new_password !== formData.confirm_password) {
            setMessage({ type: 'error', text: 'Passwords do not match.' });
            setLoading(false);
            return;
        }

        if (formData.new_password.length < 6) {
            setMessage({ type: 'error', text: 'Security Protocol: Password must be at least 6 characters long.' });
            setLoading(false);
            return;
        }

        try {
            const response = await api.post('/auth/reset-password/', {
                identity: formData.identity,
                security_answer: formData.security_answer,
                new_password: formData.new_password
            });

            setMessage({ type: 'success', text: response.message || 'Nexus Synchronization Complete: Password updated successfully.' });
            setFormData({
                identity: '',
                security_answer: '',
                new_password: '',
                confirm_password: ''
            });
            setStep(1);
            setSecurityQuestion('');
        } catch (error) {
            console.error('Nexus Sync Error:', error);
            const errorMsg = error.data?.error || error.message || 'Nexus Synchronization Failure: Connection unstable.';
            setMessage({ 
                type: 'error', 
                text: errorMsg 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '540px', padding: '3.5rem' }}>
                
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
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
                        <RefreshCcw size={32} />
                    </div>
                    <h2 style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>Reset Password</h2>
                    <p style={{ color: 'hsl(var(--muted-foreground))' }}>
                        Enter your account details to update your password.
                    </p>
                </div>

                {message.text && (
                    <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{ 
                        marginBottom: '2rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem', 
                        padding: '1rem 1.25rem', 
                        borderRadius: 'var(--radius-sm)',
                        background: message.type === 'error' ? 'hsl(var(--destructive) / 0.1)' : 'hsl(142 71% 45% / 0.1)',
                        color: message.type === 'error' ? 'hsl(var(--destructive))' : 'hsl(142 71% 45%)',
                        fontWeight: '600'
                    }}>
                        {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                        {message.text}
                    </div>
                )}

                <form onSubmit={step === 1 ? handleVerifyIdentity : handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                    
                    <div className="input-group">
                        <label className="label">Username or Registered Email</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                name="identity"
                                className="input"
                                placeholder="e.g. johndoe or john@example.com"
                                value={formData.identity}
                                onChange={handleChange}
                                required
                                disabled={step === 2}
                                style={{ paddingLeft: '3rem', opacity: step === 2 ? 0.7 : 1 }}
                            />
                            <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                        </div>
                    </div>

                    {step === 2 && (
                        <>
                            <div className="input-group animate-slide-up" style={{ padding: '1.5rem', background: 'hsl(var(--muted) / 0.3)', borderRadius: '1rem', border: '1px solid hsl(var(--border) / 0.5)' }}>
                                <label className="label" style={{ color: 'hsl(var(--primary))', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verification Question</label>
                                <p style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0.5rem 0 1rem' }}>{securityQuestion}</p>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        name="security_answer"
                                        className="input"
                                        placeholder="Enter your security answer"
                                        value={formData.security_answer}
                                        onChange={handleChange}
                                        required
                                        style={{ paddingLeft: '3rem', background: 'white' }}
                                    />
                                    <ShieldCheck size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }} className="animate-slide-up">
                                <div className="input-group">
                                    <label className="label">New Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="password"
                                            name="new_password"
                                            className="input"
                                            placeholder="••••••••"
                                            value={formData.new_password}
                                            onChange={handleChange}
                                            required
                                            style={{ paddingLeft: '3rem' }}
                                        />
                                        <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="label">Confirm Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="password"
                                            name="confirm_password"
                                            className="input"
                                            placeholder="••••••••"
                                            value={formData.confirm_password}
                                            onChange={handleChange}
                                            required
                                            style={{ paddingLeft: '3rem' }}
                                        />
                                        <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ 
                            width: '100%', 
                            marginTop: '1rem', 
                            padding: '1.25rem',
                            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 8px 16px hsl(var(--primary) / 0.2)'
                        }}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : step === 1 ? 'Verify Identity' : 'Securely Update Password'}
                    </button>

                </form>

                <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                    <Link 
                        to="/login" 
                        style={{ 
                            color: 'hsl(var(--muted-foreground))', 
                            fontSize: '0.95rem', 
                            textDecoration: 'none',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'var(--transition)'
                        }}
                        className="hover-primary"
                    >
                        <ArrowLeft size={16} /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
