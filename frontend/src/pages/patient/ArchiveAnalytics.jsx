import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
    Calendar, Clock, MapPin, User, ChevronRight, Zap,
    Filter, Search, TrendingUp, CheckCircle2, AlertCircle,
    FileText, Award, Star, History, MousePointer2
} from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import PaymentModal from '../../components/PaymentModal';
import { CreditCard } from 'lucide-react';

const ArchiveAnalytics = () => {
    const [appointments, setAppointments] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [payAppointment, setPayAppointment] = useState(null);

    useEffect(() => {
        fetchAppointments();
    }, []);

    useEffect(() => {
        if (Array.isArray(appointments)) {
            filterData();
        }
    }, [appointments, statusFilter, searchTerm]);

    const fetchAppointments = async () => {
        try {
            const data = await api.get('/appointments/');
            setAppointments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch appointment history:", error);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    const filterData = () => {
        let result = appointments;

        if (statusFilter !== 'all') {
            result = result.filter(app => app && app.status === statusFilter);
        }

        if (searchTerm) {
            const lowTerm = searchTerm.toLowerCase();
            result = result.filter(app =>
                app && (
                    (app.doctor_name && app.doctor_name.toLowerCase().includes(lowTerm)) ||
                    (app.hospital_name && app.hospital_name.toLowerCase().includes(lowTerm))
                )
            );
        }

        setFilteredAppointments(result);
    };

    const stats = {
        total: appointments?.length || 0,
        completed: appointments?.filter(a => a?.status === 'completed' || a?.status === 'confirmed').length || 0,
        pending: appointments?.filter(a => a?.status === 'pending').length || 0,
        pendingPayment: appointments?.filter(a => a?.status === 'accepted' && !a?.is_paid).length || 0,
        totalSpent: appointments?.reduce((acc, a) => acc + (a?.is_paid ? (parseFloat(a?.amount) || 500) : 0), 0) || 0
    };

    return (
        <div className="bg-gradient animate-fade-in" style={{ padding: '4rem 1.5rem', flex: 1 }}>
            <div className="container">
                <header style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'hsl(var(--primary) / 0.08)', color: 'hsl(var(--primary))', padding: '0.5rem 1.25rem', borderRadius: '2rem', marginBottom: '1.5rem', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        <History size={15} /> Visit History
                    </div>
                    <h1 style={{ fontSize: '3rem', marginBottom: '0.75rem', fontWeight: '950', letterSpacing: '-0.03em' }}>My <span className="gradient-text">Appointments</span></h1>
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1.1rem', maxWidth: '650px', fontWeight: '500', lineHeight: '1.6', opacity: 0.8 }}>
                        View all your past and upcoming medical appointments in one place.
                    </p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3.5rem' }}>
                    <StatCard icon={<History />} label="Total Visits" value={stats.total} color="hsl(var(--primary))" />
                    <StatCard icon={<CheckCircle2 />} label="Completed" value={stats.completed} color="hsl(160, 84%, 39%)" />
                    <StatCard icon={<Clock />} label="Pending Payments" value={stats.pendingPayment} color="hsl(25, 95%, 50%)" />
                    <StatCard icon={<TrendingUp />} label="Total Spent" value={`Rs. ${stats.totalSpent}`} color="hsl(var(--secondary))" />
                </div>

                <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2.5rem', borderRadius: '2rem', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', border: '1px solid hsl(var(--border))' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--primary))', opacity: 0.6 }} />
                        <input
                            type="text"
                            className="input"
                            placeholder="Search by doctor or hospital..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '3.5rem', borderRadius: '1.25rem', height: '52px', background: 'hsl(var(--primary) / 0.03)', border: 'none', fontWeight: '600' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', background: 'hsl(var(--muted) / 0.5)', padding: '0.4rem', borderRadius: '1.5rem' }}>
                        {['all', 'pending', 'accepted', 'completed', 'rejected'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                style={{
                                    padding: '0.6rem 1.25rem',
                                    borderRadius: '1.1rem',
                                    fontSize: '0.75rem',
                                    fontWeight: '900',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    border: 'none',
                                    background: statusFilter === status ? 'white' : 'transparent',
                                    color: statusFilter === status ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                    boxShadow: statusFilter === status ? '0 4px 10px rgba(0,0,0,0.05)' : 'none',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: 'pointer'
                                }}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '1.25rem' }}>
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '2.5rem' }}></div>)
                    ) : filteredAppointments.length > 0 ? (
                        filteredAppointments.map((app, i) => (
                            <div key={i} className="card archive-item animate-slide-up" style={{ padding: '0', overflow: 'hidden', border: '1px solid hsl(var(--border))', borderRadius: '2.5rem', transition: 'all 0.4s ease' }}>
                                <div style={{ display: 'flex', alignItems: 'stretch', flexWrap: 'wrap' }}>
                                    <div style={{ padding: '2rem', background: 'hsl(var(--primary) / 0.03)', minWidth: '140px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid hsl(var(--primary) / 0.05)' }}>
                                        <div style={{ fontSize: '2.2rem', fontWeight: '950', color: 'hsl(var(--foreground))', lineHeight: 1, letterSpacing: '-0.03em' }}>
                                            {app.appointment_date ? new Date(app.appointment_date).getDate() : '--'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '900', color: 'hsl(var(--primary))', textTransform: 'uppercase', marginTop: '0.4rem', letterSpacing: '0.1em' }}>
                                            {app.appointment_date ? new Date(app.appointment_date).toLocaleString('default', { month: 'short' }) : '---'}
                                        </div>
                                        <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'hsl(var(--muted-foreground))', marginTop: '0.2rem', opacity: 0.7 }}>
                                            {app.appointment_date ? new Date(app.appointment_date).getFullYear() : '----'}
                                        </div>
                                    </div>

                                    <div style={{ padding: '1.75rem 2.5rem', flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                            <div style={{ width: '64px', height: '64px', borderRadius: '1.5rem', overflow: 'hidden', border: '2px solid white', boxShadow: '0 8px 20px rgba(0,0,0,0.06)', background: 'hsl(var(--muted))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {app.doctor_profile_picture ? (
                                                    <img 
                                                        src={api.getMediaUrl(app.doctor_profile_picture)} 
                                                        alt="Doctor" 
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.parentElement.innerHTML = '<div style="color: hsl(var(--primary)); font-weight: 950; font-size: 1.25rem;">' + (app.doctor_name?.[0] || 'D') + '</div>';
                                                        }}
                                                    />
                                                ) : (
                                                    <div style={{ color: 'hsl(var(--primary))', fontWeight: '950', fontSize: '1.25rem' }}>
                                                        {app.doctor_name?.[0] || 'D'}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '0.3rem', color: 'hsl(var(--foreground))', letterSpacing: '-0.01em' }}>Dr. {app.doctor_name || 'Medical Specialist'}</h3>
                                                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700' }}>
                                                        <Clock size={14} style={{ color: 'hsl(var(--primary))', opacity: 0.8 }} /> {app.appointment_time || 'Loading'}
                                                    </span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700' }}>
                                                        <MapPin size={14} style={{ color: 'hsl(var(--secondary))', opacity: 0.8 }} /> {app.hospital_name || 'Hospital'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '1.1rem', fontWeight: '950', color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>Rs. {app.amount || 500}</div>
                                                <div style={{ fontSize: '0.65rem', fontWeight: '900', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Amount Paid</div>
                                            </div>
                                            <StatusBadge status={app.status || 'pending'} />
                                            {app.status === 'accepted' && !app.is_paid && (
                                                <button
                                                    onClick={() => setPayAppointment(app)}
                                                    className="btn btn-primary"
                                                    style={{ padding: '0.6rem 1.25rem', borderRadius: '1.1rem', boxShadow: '0 8px 15px hsl(var(--primary) / 0.15)', fontWeight: '900', letterSpacing: '0.04em' }}
                                                >
                                                    <CreditCard size={18} /> Pay Now
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '8rem 2rem', background: 'hsl(var(--muted) / 0.2)', borderRadius: '3rem', border: '2px dashed hsl(var(--border))' }}>
                            <AlertCircle size={48} style={{ opacity: 0.2, marginBottom: '2rem' }} />
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'hsl(var(--muted-foreground))' }}>No appointments found.</h3>
                            <p style={{ color: 'hsl(var(--muted-foreground))' }}>You haven't booked any appointments yet.</p>
                        </div>
                    )}
                </div>

                {payAppointment && (
                    <PaymentModal
                        amount={payAppointment.amount || 500}
                        appointmentId={payAppointment.id}
                        onClose={() => setPayAppointment(null)}
                        onSuccess={() => {
                            setPayAppointment(null);
                            fetchAppointments();
                        }}
                    />
                )}
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, color }) => (
    <div className="card" style={{ padding: '2.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', border: '1px solid hsl(var(--border))' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '1.5rem', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: 'hsl(var(--foreground))', lineHeight: 1, marginBottom: '0.25rem' }}>{value}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        </div>
    </div>
);

export default ArchiveAnalytics;
