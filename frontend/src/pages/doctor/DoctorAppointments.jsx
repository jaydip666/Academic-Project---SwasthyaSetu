// File: DoctorAppointments.jsx
// Purpose: Premium Clinical Management & Appointment Registry for Doctors
// Handles: Appointment lifecycle, clinical documentation (EHR), and practice analytics

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
    Calendar, Clock, User, CheckCircle, XCircle, FileText,
    ChevronRight, Activity, Bell, Zap, TrendingUp, Search,
    UserCheck, ShieldCheck, ArrowUpRight, Mail, Phone,
    Banknote, CreditCard, ChevronDown, Filter, MoreVertical,
    Clipboard, Thermometer, Heart, Info, RefreshCw, X, Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DoctorAppointments = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        today: 0,
        pending: 0,
        total: 0,
        revenue: 0,
        completed: 0
    });

    const [selectedApt, setSelectedApt] = useState(null);
    const [rescheduleApt, setRescheduleApt] = useState(null);
    const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '' });

    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, apt: null, action: '' });

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const response = await api.get('/appointments/');
            const data = Array.isArray(response) ? response : (response.appointments || []);
            const revenue = response.revenue || 0;

            const todayStr = new Date().toISOString().split('T')[0];
            const todayCount = data.filter(a => a.appointment_date === todayStr).length;
            const pendingCount = data.filter(a => a.status === 'pending').length;
            const completedCount = data.filter(a => a.status === 'completed').length;

            setStats({
                today: todayCount,
                pending: pendingCount,
                total: data.length,
                revenue: revenue,
                completed: completedCount
            });
            setAppointments(data.sort((a, b) => b.id - a.id));
        } catch (error) {
            console.error("Failed to fetch appointments", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAppointments = appointments.filter(apt => {
        const matchesSearch =
            apt.patient_name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
            apt.patient_email?.toLowerCase()?.includes(searchTerm.toLowerCase());

        const matchesDate = !dateFilter || apt.appointment_date === dateFilter;

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'rescheduled' ? (apt.status === 'rescheduled' || apt.status === 'reschedule_proposed') : apt.status === statusFilter);

        return matchesSearch && matchesDate && matchesStatus;
    });

    const handleStatusUpdate = async (appointmentId, newStatus, clinicalData = {}) => {
        try {
            await api.post(`/appointments/${appointmentId}/update_status/`, {
                status: newStatus,
                ...clinicalData
            });
            fetchAppointments();
        } catch (error) {
            alert(error.response?.data?.error || 'Update failed.');
        }
    };

    const handleCompleteSession = async (aptId) => {
        const confirmClose = window.confirm("Are you sure you want to close this session? Ensure all consultation has been finished.");
        if (confirmClose) {
            await handleStatusUpdate(aptId, 'completed');
        }
    };

    const handleRescheduleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/appointments/${rescheduleApt.id}/propose_reschedule/`, {
                new_date: rescheduleForm.date,
                new_time: rescheduleForm.time
            });
            setRescheduleApt(null);
            fetchAppointments();
            alert('Reschedule proposal sent to patient.');
        } catch (error) {
            alert('Failed to propose reschedule.');
        }
    };

    // Calculate progress for today
    const progress = stats.today > 0 ? (stats.completed / (stats.today || 1)) * 100 : 0;

    return (
        <div className="dashboard-page bg-gradient animate-fade-in" style={{ paddingBottom: '6rem' }}>
            <div className="container dashboard-grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gap: '2.5rem' }}>
                <div style={{ gridColumn: 'span 12' }}>

                    {/* --- Header Section --- */}
                    <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: 'hsl(var(--primary))', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem' }}>
                                <Activity size={16} /> Clinical Command Center
                            </div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-0.02em', margin: 0 }}>
                                Appointment <span className="gradient-text">Registry</span>
                            </h1>
                            <p style={{ color: 'hsl(var(--muted-foreground))', marginTop: '0.5rem', fontSize: '1.125rem' }}>Manage your clinical queue and patient interactions with precision.</p>
                        </div>

                    </header>

                    {/* --- Stat Grid --- */}
                    <div className="stats-4x-grid" style={{ marginBottom: '3rem' }}>
                        <StatBox label="Today's Caseload" value={stats.today} icon={<Calendar />} color="hsl(var(--primary))" detail={`${Math.round(progress)}% completion`} />
                        <StatBox label="Waitlist/Pending" value={stats.pending} icon={<Clock />} color="hsl(38, 92%, 50%)" detail="Awaiting action" />
                        <StatBox label="Revenue (MTD)" value={`\u20b9${stats.revenue.toLocaleString()}`} icon={<Banknote />} color="hsl(142, 70%, 45%)" detail="Verified billing" />
                        <StatBox label="Success Registry" value={stats.completed} icon={<CheckCircle />} color="hsl(215, 90%, 50%)" detail="Sessions closed" />
                    </div>

                    {/* --- Main Workspace --- */}
                    <div className="glass-panel main-workspace-panel" style={{ padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>

                        <div className="workspace-header" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                            <div className="status-filters" style={{ display: 'flex', gap: '0.5rem', background: 'hsl(var(--muted) / 0.4)', padding: '0.375rem', borderRadius: '1rem', flexWrap: 'wrap' }}>
                                {['all', 'accepted', 'pending', 'completed'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`filter-btn-custom ${statusFilter === status ? 'active' : ''}`}
                                    >
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                ))}
                            </div>

                            <div className="action-filters" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexGrow: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                <div style={{ position: 'relative', flexGrow: 1, maxWidth: '24rem' }}>
                                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground) / 0.6)' }} size={18} />
                                    <input
                                        className="custom-input search-input"
                                        placeholder="Search patient, email or registry ID..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <Calendar style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground) / 0.6)' }} size={18} />
                                    <input
                                        type="date"
                                        className="custom-input date-input"
                                        value={dateFilter}
                                        onChange={e => setDateFilter(e.target.value)}
                                    />
                                </div>
                                {(searchTerm || dateFilter || statusFilter !== 'all') && (
                                    <button
                                        onClick={() => { setSearchTerm(''); setDateFilter(''); setStatusFilter('all'); }}
                                        className="btn btn-outline reset-btn"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>

                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '6rem', borderRadius: '1rem' }}></div>)}
                            </div>
                        ) : filteredAppointments.length === 0 ? (
                            <div style={{ padding: '5rem 0', textAlign: 'center' }}>
                                <div style={{ width: '6rem', height: '6rem', background: 'hsl(var(--muted) / 0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'hsl(var(--muted-foreground) / 0.4)' }}>
                                    <UserCheck size={48} />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>No Records Identified</h3>
                                <p style={{ color: 'hsl(var(--muted-foreground))', marginTop: '0.5rem' }}>Try adjusting your filters or date selection.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {filteredAppointments.map((apt, idx) => (
                                    <AppointmentRow
                                        key={apt.id}
                                        apt={apt}
                                        idx={idx}
                                        navigate={navigate}
                                        onStatusUpdate={handleStatusUpdate}
                                        onReschedule={() => setRescheduleApt(apt)}
                                        onComplete={() => handleCompleteSession(apt.id)}
                                        onActionRequest={(apt, action) => setConfirmModal({ isOpen: true, apt, action })}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- Modals --- */}
                {rescheduleApt && (
                    <Modal onClose={() => setRescheduleApt(null)} title="Propose Reschedule" subtitle="Shift the clinical synchronization window">
                        <form onSubmit={handleRescheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: '800', color: 'hsl(var(--muted-foreground))' }}>Preferred Date</label>
                                <input type="date" className="custom-modal-input" required value={rescheduleForm.date} onChange={e => setRescheduleForm({ ...rescheduleForm, date: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: '800', color: 'hsl(var(--muted-foreground))' }}>Preferred Time Slot</label>
                                <input type="time" className="custom-modal-input" required value={rescheduleForm.time} onChange={e => setRescheduleForm({ ...rescheduleForm, time: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem' }}>
                                <button type="button" onClick={() => setRescheduleApt(null)} className="btn btn-outline" style={{ flex: 1, height: '3.5rem' }}>Dismiss</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '3.5rem', boxShadow: 'var(--shadow-md)' }}>Transmit Proposal</button>
                            </div>
                        </form>
                    </Modal>
                )}



                {confirmModal.isOpen && (
                    <Modal 
                        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} 
                        title={confirmModal.action === 'accepted' ? "Confirm Acceptance" : "Decline Request"}
                        subtitle={confirmModal.action === 'accepted' ? "Acknowledge this patient and finalize the slot." : "This request will be permanently removed from the active queue."}
                    >
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <p style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '2rem' }}>
                                Confirm clinical synchronization with <strong>{confirmModal.apt?.patient_name}</strong>?
                            </p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn btn-outline" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} style={{ flex: 1, height: '3.5rem' }}>Cancel</button>
                                <button 
                                    className={`btn ${confirmModal.action === 'accepted' ? 'btn-primary' : ''}`}
                                    onClick={() => {
                                        handleStatusUpdate(confirmModal.apt.id, confirmModal.action);
                                        setConfirmModal({ ...confirmModal, isOpen: false });
                                    }} 
                                    style={{ 
                                        flex: 1, height: '3.5rem',
                                        background: confirmModal.action === 'rejected' ? '#dc2626' : '',
                                        color: confirmModal.action === 'rejected' ? 'white' : ''
                                    }}
                                >
                                    Confirm {confirmModal.action === 'accepted' ? 'Acceptance' : 'Rejection'}
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}

            </div>

            <style>{`
                .stats-4x-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1.5rem;
                }
                @media (max-width: 1024px) {
                    .stats-4x-grid { grid-template-columns: repeat(2, 1fr); }
                    .ehr-grid > div { grid-column: span 12 !important; }
                    .main-workspace-panel { padding: 1.5rem !important; }
                }
                @media (max-width: 640px) {
                    .stats-4x-grid { grid-template-columns: 1fr; }
                    .action-filters { width: 100%; justify-content: stretch !important; }
                    .search-input, .date-input { width: 100% !important; }
                }

                .filter-btn-custom {
                    padding: 0.625rem 1.5rem;
                    border-radius: 0.75rem;
                    font-size: 0.875rem;
                    font-weight: 800;
                    border: none;
                    background: transparent;
                    color: hsl(var(--muted-foreground));
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .filter-btn-custom:hover {
                    background: rgba(255, 255, 255, 0.5);
                }
                .filter-btn-custom.active {
                    background: white;
                    color: hsl(var(--primary));
                    box-shadow: var(--shadow-sm);
                    transform: scale(1.05);
                }

                .custom-input {
                    height: 3.5rem;
                    padding-left: 3rem;
                    padding-right: 1rem;
                    border-radius: 1rem;
                    border: 1px solid hsl(var(--border) / 0.6);
                    background: rgba(255, 255, 255, 0.5);
                    font-weight: 500;
                    color: black;
                    width: 100%;
                    transition: all 0.3s ease;
                }
                .search-input { width: 24rem; }
                .date-input { width: auto; }
                .custom-input:focus {
                    background: white;
                    outline: none;
                    border-color: hsl(var(--primary));
                    box-shadow: 0 0 0 4px hsl(var(--primary) / 0.1);
                }

                .reset-btn {
                    height: 3.5rem;
                    padding: 0 1.5rem;
                    border-radius: 1rem;
                    border-width: 2px;
                }

                .custom-modal-input {
                    height: 3.5rem;
                    padding: 0 1.25rem;
                    border-radius: 1rem;
                    border: 1.5px solid hsl(var(--border) / 0.8);
                    background: white;
                    color: black;
                    width: 100%;
                    transition: all 0.3s ease;
                }
                .custom-modal-input.small { height: 3rem; }
                .custom-modal-input.textarea { height: auto; }
                .custom-modal-input:focus {
                    outline: none;
                    border-color: hsl(var(--primary));
                    box-shadow: 0 0 0 4px hsl(var(--primary) / 0.1);
                }

                @keyframes customSpin { 100% { transform: rotate(360deg); } }
                .animate-spin-custom { animation: customSpin 1s linear infinite; }
            `}</style>
        </div>
    );
};

// --- Sub Components ---

const StatBox = ({ label, value, icon, color, detail }) => (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1.25rem', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', cursor: 'default' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '8rem', height: '8rem', marginRight: '-4rem', marginTop: '-4rem', background: `radial-gradient(circle, rgba(0,0,0,0.05) 0%, transparent 70%)`, borderRadius: '50%' }}></div>
        <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '1rem', background: 'transparent', color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${color}40`, backgroundColor: `${color}15` }}>
            {React.cloneElement(icon, { size: 28 })}
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--muted-foreground))', opacity: 0.8, marginBottom: '0.25rem' }}>{label}</div>
            <div style={{ fontSize: '1.875rem', fontWeight: '900', color: 'black', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                {value}
                <span style={{ fontSize: '0.75rem', fontWeight: '800', padding: '0.125rem 0.5rem', borderRadius: '1rem', background: 'rgba(0,0,0,0.05)', color: 'hsl(var(--muted-foreground))' }}>{detail}</span>
            </div>
        </div>
    </div>
);

const AppointmentRow = ({ apt, idx, navigate, onStatusUpdate, onReschedule, onComplete, onActionRequest }) => {
    const isToday = apt.appointment_date === new Date().toISOString().split('T')[0];
    const isActive = apt.status === 'accepted' || apt.status === 'confirmed';

    return (
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', borderRadius: '1.75rem', border: isToday && isActive ? '1px solid hsl(var(--primary) / 0.2)' : '1px solid hsl(var(--border) / 0.4)', background: isToday && isActive ? 'hsl(var(--primary) / 0.03)' : 'rgba(255,255,255,0.5)', transition: 'all 0.3s ease', animation: `slideUp 0.5s ease forwards`, animationDelay: `${idx * 0.05}s`, opacity: 0, transform: 'translateY(10px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ position: 'relative' }}>
                    <div style={{ width: '4rem', height: '4rem', borderRadius: '1rem', background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border) / 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {apt.patient_profile_picture ? (
                            <img src={api.getMediaUrl(apt.patient_profile_picture)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <User size={24} color="hsl(var(--muted-foreground) / 0.4)" />
                        )}
                    </div>
                    {isToday && isActive && <div style={{ position: 'absolute', top: '-0.375rem', right: '-0.375rem', width: '1rem', height: '1rem', borderRadius: '50%', background: 'hsl(var(--primary))', border: '2px solid white', animation: 'customPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: '900', color: 'black', margin: 0 }}>{apt.patient_name}</h4>
                        <StatusTag status={apt.status} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', fontWeight: '800', color: 'hsl(var(--muted-foreground))' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Calendar size={14} /> {new Date(apt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Clock size={14} /> {apt.appointment_time}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.125rem 0.5rem', background: 'hsl(var(--muted) / 0.3)', borderRadius: '0.5rem', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'black' }}><Zap size={10} /> {apt.token_id || (apt.token_number ? `TK-${apt.token_number}` : '---')}</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
                {/* Meta Info */}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {isActive && (
                        <button
                            onClick={apt.is_paid ? onComplete : () => alert('Awaiting patient payment before session can be closed.')}
                            className={`btn ${apt.is_paid ? 'btn-primary' : 'btn-outline'}`}
                            title={apt.is_paid ? "Close Session" : "Payment Required"}
                            style={{ 
                                height: '3rem', padding: '0 1.5rem', borderRadius: '0.75rem', 
                                fontSize: '0.875rem', gap: '0.5rem', 
                                background: apt.is_paid ? '' : 'hsl(var(--muted)/0.3)',
                                cursor: apt.is_paid ? 'pointer' : 'not-allowed',
                                color: apt.is_paid ? '' : 'hsl(var(--muted-foreground))',
                                border: apt.is_paid ? '' : '1px solid hsl(var(--border)/0.5)'
                            }}
                        >
                            {apt.is_paid ? <Zap size={18} /> : <Lock size={16} />} Close Session
                        </button>
                    )}

                    {apt.status === 'pending' && (
                        <>
                            <button 
                                onClick={() => onActionRequest(apt, 'accepted')} 
                                title="Accept Patient"
                                style={{ height: '3rem', width: '3rem', borderRadius: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }}
                            >
                                <CheckCircle size={20} />
                            </button>
                            <button 
                                onClick={() => onActionRequest(apt, 'rejected')} 
                                title="Decline Patient"
                                style={{ height: '3rem', width: '3rem', borderRadius: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }}
                            >
                                <XCircle size={20} />
                            </button>
                            <button onClick={onReschedule} style={{ height: '3rem', padding: '0 1rem', borderRadius: '0.75rem', background: 'rgba(255, 255, 255, 0.5)', border: '1px solid hsl(var(--border) / 0.6)', fontWeight: '800', fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', cursor: 'pointer', transition: 'all 0.3s' }}>Shift</button>
                        </>
                    )}

                    <button
                        onClick={() => navigate('/doctor/records', { state: { patientId: apt.patient_id, patientName: apt.patient_name } })}
                        style={{ height: '3rem', width: '3rem', borderRadius: '0.75rem', background: 'hsl(var(--muted) / 0.4)', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid transparent', cursor: 'pointer', transition: 'all 0.3s' }}
                    >
                        <FileText size={20} />
                    </button>
                </div>
            </div>
            <style>{`
                @media (min-width: 1280px) { .xl-flex { display: flex !important; } }
                @keyframes customPulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
            `}</style>
        </div>
    );
};

const StatusTag = ({ status }) => {
    const config = {
        pending: { bg: 'rgba(245, 158, 11, 0.1)', text: '#d97706', label: 'Pending Request' },
        accepted: { bg: 'rgba(34, 197, 94, 0.1)', text: '#16a34a', label: 'Confirmed' },
        confirmed: { bg: 'rgba(34, 197, 94, 0.1)', text: '#16a34a', label: 'Confirmed' },
        completed: { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563eb', label: 'Closed Session' },
        rejected: { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626', label: 'Declined' },
        rescheduled: { bg: 'rgba(99, 102, 241, 0.1)', text: '#4f46e5', label: 'Rescheduled' },
        reschedule_proposed: { bg: 'rgba(99, 102, 241, 0.05)', text: '#818cf8', label: 'Proposal Sent' }
    }[status] || { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))', label: status };

    return (
        <span style={{ background: config.bg, color: config.text, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.625rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid currentColor', opacity: 0.8 }}>
            {config.label}
        </span>
    );
};

const Modal = ({ children, onClose, title, subtitle, wide }) => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)' }} onClick={onClose} className="animate-fade-in"></div>
        <div style={{ position: 'relative', background: 'white', borderRadius: '2.5rem', width: '100%', maxWidth: wide ? '64rem' : '32rem', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 32px 128px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} className="animate-slide-up">
            <div style={{ padding: '2.5rem 2.5rem 0 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2 style={{ fontSize: '1.875rem', fontWeight: '900', color: 'black', margin: 0, letterSpacing: '-0.02em' }}>{title}</h2>
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontWeight: '600', marginTop: '0.375rem' }}>{subtitle}</p>
                </div>
                <button onClick={onClose} style={{ padding: '0.75rem', borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))', transition: 'all 0.3s' }} onMouseOver={e => e.currentTarget.style.background = 'hsl(var(--muted))'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}><X size={24} /></button>
            </div>
            <div style={{ padding: '2.5rem', overflowY: 'auto' }}>
                {children}
            </div>
        </div>
    </div>
);

export default DoctorAppointments;
