import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Lock, Bell, Shield, Moon, Globe, LogOut, ShieldCheck, Cpu, Database, Eye, ChevronRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [notifications, setNotifications] = useState({
        email_notifications: true,
        sms_notifications: true,
        appointment_reminders: true
    });

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordData.new_password !== passwordData.confirm_password) {
            alert('Security keys do not match!');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password/', {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });
            alert('Access credentials updated successfully!');
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        } catch (error) {
            alert(`Credential update failure: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationToggle = (key) => {
        setNotifications({
            ...notifications,
            [key]: !notifications[key]
        });
    };

    const handleLogout = () => {
        if (confirm('Initiate session termination?')) {
            logout();
            navigate('/login');
        }
    };

    return (
        <div className="bg-gradient animate-fade-in" style={{ padding: '4rem 1.5rem', flex: 1 }}>
            <div className="container" style={{ maxWidth: '900px' }}>
                <header style={{ marginBottom: '4rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', padding: '0.4rem 1rem', borderRadius: '2rem', marginBottom: '1.25rem', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Cpu size={14} /> System Configuration
                    </div>
                    <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem', fontWeight: '800' }}>Terminal <span className="gradient-text">Settings</span></h1>
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1.2rem' }}>Configure your environment and security protocols.</p>
                </header>

                <div style={{ display: 'grid', gap: '2.5rem' }}>

                    {/* Security Authentication */}
                    <div className="card" style={{ overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
                        <div style={{ padding: '2rem 2.5rem', background: 'hsl(var(--muted) / 0.3)', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: 'white', borderRadius: '1rem', color: 'hsl(var(--primary))' }}>
                                <Lock size={22} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.3rem', fontWeight: '800' }}>Authentication Protocols</h2>
                                <p style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))', fontWeight: '500' }}>Manage access keys and encryption</p>
                            </div>
                        </div>
                        <div style={{ padding: '2.5rem' }}>
                            <form onSubmit={handlePasswordChange} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Current Master Key (Password)</label>
                                    <input
                                        type="password"
                                        className="input"
                                        placeholder="Enter current secure key"
                                        value={passwordData.current_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                        required
                                        style={{ height: '54px', borderRadius: '0.75rem' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">New Master Key</label>
                                    <input
                                        type="password"
                                        className="input"
                                        placeholder="Generate new key"
                                        value={passwordData.new_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                        required
                                        style={{ height: '54px', borderRadius: '1rem' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Verify New Key</label>
                                    <input
                                        type="password"
                                        className="input"
                                        placeholder="Confirm new key"
                                        value={passwordData.confirm_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                        required
                                        style={{ height: '54px', borderRadius: '1rem' }}
                                    />
                                </div>
                                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                    <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontWeight: '800' }} disabled={loading}>
                                        {loading ? 'Re-encrypting...' : 'Synchronize Keys'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>




                    {/* Termination Phase */}
                    <div className="card" style={{ borderColor: 'hsl(346, 77%, 49% / 0.3)', background: 'hsl(346, 77%, 49% / 0.02)' }}>
                        <div style={{ padding: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'hsl(346, 77%, 49%)', marginBottom: '0.25rem' }}>Terminate Uplink</h3>
                                <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.95rem', fontWeight: '500' }}>Disconnect from the Swasthya Setu network.</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="btn"
                                style={{ background: 'hsl(346, 77%, 49%)', color: 'white', padding: '0.8rem 2rem', fontWeight: '800', gap: '0.75rem', boxShadow: '0 10px 20px hsl(346, 77%, 49% / 0.2)' }}
                            >
                                <LogOut size={18} /> Disconnect
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ToggleOption = ({ label, description, checked, onChange, isLast }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '2rem 0',
        borderBottom: isLast ? 'none' : '1px solid hsl(var(--border))'
    }}>
        <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '0.35rem' }}>{label}</h4>
            <p style={{ fontSize: '0.95rem', color: 'hsl(var(--muted-foreground))', fontWeight: '500' }}>{description}</p>
        </div>
        <label style={{ position: 'relative', display: 'inline-block', width: '56px', height: '30px' }}>
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0, left: 0, right: 0, bottom: 0,
                background: checked ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                borderRadius: '30px',
                transition: 'var(--transition)',
                boxShadow: checked ? '0 4px 12px hsl(var(--primary) / 0.3)' : 'inset 0 2px 4px rgba(0,0,0,0.05)'
            }}>
                <span style={{
                    position: 'absolute',
                    content: '',
                    height: '24px',
                    width: '24px',
                    left: checked ? '29px' : '3px',
                    bottom: '3px',
                    background: 'white',
                    borderRadius: '50%',
                    transition: 'var(--transition)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {checked && <Zap size={10} style={{ color: 'hsl(var(--primary))' }} fill="currentColor" />}
                </span>
            </span>
        </label>
    </div>
);

export default Settings;
