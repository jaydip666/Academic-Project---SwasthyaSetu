// ================= FRONTEND FILE =================
// File: DoctorDashboard.jsx
// Purpose: Primary management interface for doctors
// Handles: Appointment tracking, status updates (Accept/Reject/Complete), and reschedule proposals

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Activity, Calendar, Clock, TrendingUp, Banknote, FileText, Bell, ShieldCheck, ChevronRight, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DoctorDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        today: 0,
        pending: 0,
        total: 0,
        revenue: 0
    });

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const response = await api.get('/appointments/');
            const data = Array.isArray(response) ? response : (response.appointments || []);
            const revenue = response.revenue || 0;

            // Robust date matching for today (considering local timezone)
            const today = new Date();
            const todayCount = data.filter(a => {
                const aptDate = new Date(a.appointment_date);
                return aptDate.getFullYear() === today.getFullYear() &&
                       aptDate.getMonth() === today.getMonth() &&
                       aptDate.getDate() === today.getDate();
            }).length;
            const pendingCount = data.filter(a => a.status === 'pending').length;

            setStats({
                today: todayCount,
                pending: pendingCount,
                total: data.length,
                revenue: revenue
            });
        } catch (error) {
            console.error("Failed to fetch appointments", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-page bg-gradient animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                <div className="dr-loading-label">Initializing Dashboard Registry...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-page bg-gradient animate-fade-in">
            <div className="container dashboard-grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gap: '2.5rem' }}>

                {/* Left: Dashboard Area */}
                <div className="dashboard-main" style={{ gridColumn: 'span 8' }}>
                    <header className="doctor-header">
                        <div className="header-badge">
                            <Activity size={16} /> Main Dashboard
                        </div>
                        <h1 className="header-title-dark">
                            Doctor <span className="gradient-text">Dashboard</span>
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                background: 'hsl(var(--primary))', color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: '800', overflow: 'hidden'
                            }}>
                                {user?.profile_picture ? (
                                    <img src={api.getMediaUrl(user.profile_picture)} alt="Doctor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <>{user?.first_name?.[0] || 'D'}</>
                                )}
                            </div>
                            <p className="header-desc-dark" style={{ margin: 0, opacity: 0.8, fontSize: '1.1rem' }}>Welcome back, <span style={{ fontWeight: 800, color: 'hsl(var(--primary))' }}>Dr. {user?.first_name} {user?.last_name}</span></p>
                        </div>
                    </header>

                    {/* Performance Metrics */}
                    <div className="stats-2x2-grid" style={{ marginBottom: '4rem', position: 'relative' }}>
                        {/* Decorative background glow */}
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '200px', height: '200px', background: 'hsl(var(--primary) / 0.1)', filter: 'blur(80px)', borderRadius: '50%', zIndex: -1 }}></div>

                        <StatCard label="Today's Visits" value={stats.today} icon={<Calendar size={28} />} color="hsl(var(--primary))" trend="Busy day" />
                        <StatCard label="Pending Visits" value={stats.pending} icon={<Clock size={28} />} color="hsl(38, 92%, 50%)" trend="Waitlist" />
                        <div onClick={() => navigate('/doctor/earnings')} style={{ cursor: 'pointer' }}>
                            <StatCard label="Total Earnings" value={`₹${stats.revenue.toLocaleString()}`} icon={<Activity size={28} />} color="hsl(142, 70%, 45%)" trend="Income" />
                        </div>
                        <StatCard label="Total Patients" value={stats.total} icon={<TrendingUp size={28} />} color="hsl(var(--secondary))" trend="Steady" />
                    </div>


                </div>

                {/* Right: Operational Control */}
                <div className="dashboard-sidebar" style={{ gridColumn: 'span 4' }}>
                    <div className="glass-panel rapid-access-panel" style={{ padding: '2rem' }}>
                        <div className="sidebar-section-header">
                            <div className="header-indicator"></div>
                            <h3 className="sidebar-section-title">Rapid Access</h3>
                        </div>
                        <div className="operational-links">
                            <OperationalLink title="Appointment Registry" subtitle="Manage clinical queue" icon={<Activity size={20} />} onClick={() => navigate('/doctor/appointments')} active={true} />
                            <OperationalLink title="Manage Slots" subtitle="Manage availability slots" icon={<Calendar size={20} />} onClick={() => navigate('/doctor/schedule')} />
                            <OperationalLink title="Earnings Analytics" subtitle="Analyze fiscal performance" icon={<Banknote size={20} />} onClick={() => navigate('/doctor/earnings')} />
                            <OperationalLink title="Clinical Records" subtitle="Analyze patient telemetry" icon={<FileText size={20} />} onClick={() => navigate('/doctor/records')} />
                        </div>
                    </div>

                </div>
            </div>



            <style>{`
                .stats-2x2-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 2rem;
                }
                @media (min-width: 1024px) {
                    .stats-2x2-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                .dashboard-page {
                    padding-bottom: 6rem;
                }

            `}</style>
        </div>
    );
};

// --- Sub-Components ---

const StatCard = ({ label, value, icon, color, trend }) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <div
            className="card animate-scale-in stat-card-premium"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                padding: '2.5rem',
                border: '1px solid hsl(var(--border) / 0.4)',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                overflow: 'hidden',
                background: isHovered ? 'white' : 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(12px)',
                cursor: 'default',
                transform: isHovered ? 'translateY(-8px)' : 'none',
                boxShadow: isHovered ? '0 30px 60px rgba(0,0,0,0.06)' : 'none',
                borderColor: isHovered ? `${color}40` : 'hsl(var(--border) / 0.4)'
            }}
        >
            {/* Color Glow Overlay */}
            <div className="card-glow-layer" style={{
                position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
                background: `radial-gradient(circle at top right, ${isHovered ? color + '15' : color + '08'}, transparent 70%)`,
                transition: 'background 0.3s ease',
                zIndex: 0
            }}></div>

            <div style={{ position: 'absolute', top: '-15px', right: '-15px', opacity: 0.045, transform: 'scale(2.8)', color: color, pointerEvents: 'none' }}>{icon}</div>

            <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '1.5rem',
                        background: `${color}15`, color: color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 10px 20px ${color}15`
                    }}>
                        {React.cloneElement(icon, { size: 28 })}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                </div>
                <h2 style={{ fontSize: '3.75rem', fontWeight: '900', marginBottom: '1.5rem', color: 'hsl(var(--foreground))', letterSpacing: '-0.035em' }}>{value}</h2>
                <div style={{
                    color: color, fontSize: '0.9rem', fontWeight: '800',
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    background: `${color}08`, padding: '0.4rem 0.8rem', borderRadius: '2rem'
                }}>
                    <ArrowUpRight size={14} /> {trend}
                </div>
            </div>
        </div>
    );
};

const OperationalLink = ({ title, subtitle, icon, onClick, active }) => (
    <button onClick={onClick} className="btn" style={{
        width: '100%',
        padding: '1.25rem',
        borderRadius: '1.5rem',
        background: active ? 'hsl(var(--primary) / 0.08)' : 'hsl(var(--muted) / 0.5)',
        border: active ? '1px solid hsl(var(--primary) / 0.2)' : '1px solid transparent',
        color: 'inherit',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
                width: '44px', height: '44px',
                background: active ? 'hsl(var(--primary))' : 'white',
                color: active ? 'white' : 'hsl(var(--primary))',
                borderRadius: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: active ? '0 8px 16px hsl(var(--primary) / 0.2)' : 'var(--shadow-sm)'
            }}>
                {React.cloneElement(icon, { size: 20 })}
            </div>
            <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '800', fontSize: '1.05rem', color: 'hsl(var(--foreground))', lineHeight: 1.2 }}>{title}</div>
                <div style={{ fontWeight: '600', fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.2rem' }}>{subtitle}</div>
            </div>
        </div>
        <ChevronRight size={16} style={{ opacity: 0.4, marginLeft: '0.5rem' }} />
    </button>
);



export default DoctorDashboard;
