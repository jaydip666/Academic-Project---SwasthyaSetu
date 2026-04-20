// ================= FRONTEND FILE =================
// File: PatientDashboard.jsx
// Purpose: Primary landing page for patients after login
// Handles: Displaying upcoming appointments, pending reschedules, and health telemetry summary

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Calendar, Search, FileText, Activity, Clock, MapPin, User, ArrowRight, Stethoscope, ClipboardList, TrendingUp, Bell, ChevronRight, Zap, Star, Receipt, Download, UserCheck, Pill } from 'lucide-react';
import ReviewModal from '../../components/ReviewModal';
import StatusBadge from '../../components/StatusBadge';
import PaymentModal from '../../components/PaymentModal';
import { CreditCard, Banknote } from 'lucide-react';

const QueueSkeleton = () => (
    <div className="glass-card animate-pulse" style={{ padding: '2rem', borderRadius: '1.25rem', display: 'flex', gap: '1.5rem', alignItems: 'center', background: 'white', minHeight: '180px', marginBottom: '2rem', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' }}>
        <div style={{ width: '100px', height: '100px', borderRadius: '1.5rem', background: 'hsl(var(--muted) / 0.5)' }}></div>
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ height: '28px', width: '70%', background: 'hsl(var(--muted) / 0.5)', borderRadius: '0.6rem' }}></div>
            <div style={{ height: '18px', width: '40%', background: 'hsl(var(--muted) / 0.5)', borderRadius: '0.4rem' }}></div>
        </div>
        <div style={{ flex: 1, height: '110px', background: 'hsl(var(--muted) / 0.3)', borderRadius: '1.5rem' }}></div>
        <div style={{ flex: 1, height: '110px', background: 'hsl(var(--muted) / 0.3)', borderRadius: '1.5rem' }}></div>
        <div style={{ flex: 1, height: '110px', background: 'hsl(var(--muted) / 0.3)', borderRadius: '1.5rem' }}></div>
    </div>
);

const PatientDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [vaultCount, setVaultCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [payAppointment, setPayAppointment] = useState(null);
    const [recentReceipts, setRecentReceipts] = useState([]);
    const [suggestions, setSuggestions] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeSuggestionApt, setActiveSuggestionApt] = useState(null);
    const [suggestLoading, setSuggestLoading] = useState(false);

    const formatTime = (time24) => {
        if (!time24 || time24 === "00:00") return "12:00 AM";
        try {
            const [hours, minutes] = time24.split(':');
            const h = parseInt(hours);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${h12}:${minutes} ${ampm}`;
        } catch (e) {
            return time24;
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [appointmentsData, recordsData, receiptsData] = await Promise.all([
                api.get('/appointments/'),
                api.get('/media/list'),
                api.get('/clinical-receipts/')
            ]);
            setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
            setVaultCount(Array.isArray(recordsData) ? recordsData.length : 0);
            setRecentReceipts(Array.isArray(receiptsData) ? receiptsData.slice(0, 2) : []);
        } catch {
            console.error('Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleRescheduleResponse = async (id, action) => {
        if (action === 'decline') {
            fetchSuggestions(id);
            return;
        }
        try {
            await api.post('/appointments/reschedule/respond', {
                appointment_id: id,
                action: action
            });

            if (action === 'accept') {
                fetchDashboardData();
                alert(`Appointment updated successfully!`);
            } else if (action === 'reject') {
                fetchSuggestions(id, true);
                fetchDashboardData();
            }
        } catch (err) {
            alert('Failed to respond to reschedule: ' + (err.response?.data?.error || 'Network error'));
        }
    };

    const fetchSuggestions = async (id, isRejected = false) => {
        setSuggestLoading(true);
        try {
            const data = await api.get(`/appointments/${id}/suggestions/`);
            if (isRejected) {
                data.smart_message = "You have declined the proposed time. You can choose another slot or explore other doctors.";
            }
            setSuggestions(data);
            setShowSuggestions(true);
            setActiveSuggestionApt(appointments.find(a => a.id === id));
        } catch (err) {
            console.error(err);
        } finally {
            setSuggestLoading(false);
        }
    };

    const handleQuickBook = async (docId, date, time) => {
        try {
            await api.post('/appointments/create', {
                doctor_id: docId,
                appointment_date: date,
                appointment_time: time
            });
            setShowSuggestions(false);
            fetchDashboardData();
            alert('New appointment booked successfully!');
        } catch (err) {
            alert('Booking failed: ' + (err.message || 'Connection error'));
        }
    };

    const pendingReschedules = Array.isArray(appointments) ? appointments.filter(a => a?.status === 'reschedule_proposed') : [];

    const nextAppointment = appointments && Array.isArray(appointments)
        ? appointments
            .filter(app => {
                if (!app || !app.appointment_date) return false;
                // Exclude completed or rejected statuses
                if (['completed', 'rejected', 'reschedule_proposed'].includes(app.status)) return false;
                
                // Compare dates strictly as YYYY-MM-DD strings to avoid TZ issues
                const now = new Date();
                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                return app.appointment_date >= todayStr;
            })
            .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))[0]
        : null;

    return (
        <div className="dashboard-page bg-gradient animate-fade-in">
            <div className="container">
                {/* 1. Dynamic Welcome Header */}
                <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3rem 4rem' }}>
                    <div className="header-identity-left" style={{ display: 'flex', alignItems: 'center', gap: '3.5rem' }}>
                        <div className="header-avatar-container" style={{ width: '100px', height: '100px', borderRadius: '2.5rem', background: 'hsl(var(--primary) / 0.15)', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {user?.profile_picture ? (
                                <img src={api.getMediaUrl(user.profile_picture)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <User size={40} color="white" style={{ opacity: 0.5 }} />
                            )}
                        </div>

                        <div className="header-stats-left" style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
                            <div className="header-stat-pill">
                                <div className="pill-label">Total Visits</div>
                                <div className="pill-value" style={{ color: 'hsl(var(--primary))' }}>{Array.isArray(appointments) ? appointments.length : 0}</div>
                            </div>
                            <div style={{ width: '1px', height: '50px', background: 'rgba(255,255,255,0.1)' }}></div>
                            <div className="header-stat-pill">
                                <div className="pill-label">Safe Records</div>
                                <div className="pill-value" style={{ color: 'hsl(var(--secondary))' }}>{vaultCount}</div>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-header-content" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '600px' }}>

                        <h1 className="header-title" style={{ fontSize: '2.8rem', margin: '0.2rem 0 0.8rem' }}>
                            Welcome, {user?.first_name}!
                        </h1>
                        <p className="header-subtitle" style={{ fontSize: '1.1rem', opacity: 0.7, margin: 0 }}>
                            Explore your medical network, manage upcoming visits, and access your secure reports all in one place.
                        </p>
                    </div>
                </header>

                {pendingReschedules.length > 0 && !showSuggestions && (
                    <div className="reschedule-alerts animate-fade-in" style={{ marginBottom: '2rem' }}>
                        {pendingReschedules.map(apt => (
                            <div key={apt.id} className="glass-card" style={{
                                borderLeft: '8px solid hsl(var(--primary))',
                                padding: '2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.5rem',
                                background: 'white',
                                borderRadius: '2rem',
                                boxShadow: '0 15px 35px -10px rgba(0,0,0,0.08)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'hsl(var(--primary))', animation: 'pulse 2s infinite' }}></div>
                                            <span style={{ fontSize: '0.7rem', fontWeight: '900', color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Time Change</span>
                                        </div>
                                        <h4 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: 'hsl(var(--foreground))' }}>Dr. {apt.doctor_name} Proposed a Change</h4>
                                        <p style={{ margin: '0.5rem 0 0', fontSize: '1rem', color: 'hsl(var(--muted-foreground))', lineHeight: '1.6' }}>
                                            The time for your visit has been updated to <strong>{apt.proposed_date}</strong> at <strong>{formatTime(apt.proposed_time)}</strong>.
                                        </p>
                                    </div>
                                    <div style={{ background: 'hsl(var(--primary) / 0.05)', padding: '1rem', borderRadius: '1.25rem', textAlign: 'center', minWidth: '120px' }}>
                                        <Clock size={20} color="hsl(var(--primary))" style={{ marginBottom: '0.4rem' }} />
                                        <div style={{ fontWeight: '900', fontSize: '1.1rem' }}>{formatTime(apt.proposed_time)}</div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '700', opacity: 0.6 }}>PROPOSED TIME</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    <button onClick={() => handleRescheduleResponse(apt.id, 'accept')} className="btn btn-primary" style={{ padding: '0 2rem', height: '54px', borderRadius: '1.25rem', fontWeight: '900' }}>
                                        Accept New Slot
                                    </button>
                                    <button onClick={() => handleRescheduleResponse(apt.id, 'reject')} className="btn btn-outline" style={{ padding: '0 1.5rem', height: '54px', borderRadius: '1.25rem', fontWeight: '800', borderColor: 'hsl(0, 70%, 85%)', color: 'hsl(0, 70%, 45%)', background: 'hsl(0, 70%, 98%)' }}>
                                        Reject Request
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showSuggestions && suggestions && (
                    <div className="suggestions-hub animate-slide-up" style={{ marginBottom: '3rem' }}>
                        <div className="glass-card" style={{ padding: '2.5rem', background: 'white', borderRadius: '2.5rem', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '2rem', fontWeight: '950', color: 'hsl(var(--foreground))', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Pick a Time</h2>
                                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1.1rem', maxWidth: '600px' }}>
                                        {suggestions.smart_message || "We've checked our medical network to find other available times for you."}
                                    </p>
                                </div>
                                <button onClick={() => setShowSuggestions(false)} className="btn btn-ghost" style={{ borderRadius: '1.25rem' }}>
                                    Close
                                </button>
                            </div>

                            {suggestLoading ? (
                                <div style={{ textAlign: 'center', padding: '3rem' }}>
                                    <Zap size={32} className="animate-pulse" style={{ color: 'hsl(var(--primary))', marginBottom: '1rem' }} />
                                    <div style={{ fontWeight: '800' }}>Loading Slots...</div>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                                    {/* Doctor Slots */}
                                    <div>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: '900', color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Calendar size={16} /> Alternative Times
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {suggestions.doctor_slots && suggestions.doctor_slots.length > 0 ? (
                                                suggestions.doctor_slots.map((s, i) => (
                                                    <button key={i} onClick={() => handleQuickBook(s.doctor_id, s.date, s.raw_time || s.time)} className="suggestion-pill" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 1.25rem', background: 'hsl(var(--muted) / 0.3)', border: 'none', borderRadius: '1rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' }}>
                                                        <span style={{ fontWeight: '800' }}>{s.date}</span>
                                                        <span style={{ color: 'hsl(var(--primary))', fontWeight: '900' }}>{s.time}</span>
                                                    </button>
                                                ))
                                            ) : (
                                                <div style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))', padding: '1rem', background: 'hsl(var(--muted)/0.2)', borderRadius: '1rem' }}>
                                                    No direct slots available. Please try another specialist below.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Hospital Alternatives */}
                                    <div>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: '900', color: 'hsl(var(--secondary))', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <UserCheck size={16} /> Other Specialists
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {suggestions.hospital_alternatives.map((doc, i) => (
                                                <div key={i} onClick={() => navigate('/patient/search', { state: { doctorId: doc.doctor_id } })} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'hsl(var(--secondary) / 0.03)', borderRadius: '1.25rem', cursor: 'pointer' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'hsl(var(--secondary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>
                                                        {doc.doctor_name[0]}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '900', fontSize: '0.95rem' }}>Dr. {doc.doctor_name}</div>
                                                        <div style={{ fontSize: '0.75rem', fontWeight: '700', opacity: 0.6 }}>Same Hospital</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Area Alternatives */}
                                    <div>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: '900', color: 'hsl(var(--accent))', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <MapPin size={16} /> Nearby Hospitals
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {suggestions.area_alternatives.map((hosp, i) => (
                                                <div key={i} onClick={() => navigate('/patient/search', { state: { hospitalName: hosp.hospital_name } })} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'hsl(var(--accent) / 0.03)', borderRadius: '1.25rem', cursor: 'pointer' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '1rem', background: 'hsl(var(--accent))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>
                                                        <Stethoscope size={20} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '900', fontSize: '0.95rem' }}>{hosp.hospital_name}</div>
                                                        <div style={{ fontSize: '0.75rem', fontWeight: '700', opacity: 0.6 }}>Dr. {hosp.doctor_name}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <style>{`
                            .suggestion-pill:hover {
                                background: hsl(var(--primary) / 0.1) !important;
                                transform: translateY(-2px);
                            }
                            @keyframes pulse {
                                0% { transform: scale(1); opacity: 1; }
                                50% { transform: scale(1.5); opacity: 0.5; }
                                100% { transform: scale(1); opacity: 1; }
                            }
                        `}</style>
                    </div>
                )}

                <div className="dashboard-grid">

                    {/* Main Content Area */}
                    <div className="dashboard-main">

                        {/* Next Action Widget */}
                        <div className="action-hub">
                            <div className="card-header-flex">
                                <h3 className="widget-title">Your Next Visit</h3>
                            </div>


                            {loading ? (
                                <QueueSkeleton />
                            ) : nextAppointment ? (
                                <div className="clinical-path-card animate-slide-up" style={{
                                    background: 'white',
                                    padding: '2rem',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    gap: '24px',
                                    alignItems: 'stretch',
                                    boxShadow: '0 15px 45px -10px rgba(0,0,0,0.08)',
                                    marginBottom: '3rem',
                                    border: '1px solid hsl(var(--border) / 0.5)'
                                }}>
                                    {/* 1. [ AVATAR ] */}
                                    <div style={{ flex: '0 0 100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ width: '100px', height: '100px', borderRadius: '16px', background: 'hsl(var(--primary) / 0.05)', overflow: 'hidden', border: '2px solid white', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}>
                                            {nextAppointment.doctor_profile_picture ? (
                                                <img src={api.getMediaUrl(nextAppointment.doctor_profile_picture)} alt="Doctor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: '900', color: 'hsl(var(--primary))' }}>
                                                    {nextAppointment.doctor_name?.[0] || 'D'}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. [ DOCTOR INFO ] */}
                                    <div style={{ flex: '2', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '900', color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                            {nextAppointment.status === 'completed' ? 'Medical History' : 'Medical Visit'}
                                        </div>
                                        <h2 style={{ fontSize: '1.75rem', fontWeight: '950', color: 'hsl(var(--foreground))', margin: 0, letterSpacing: '-0.025em', whiteSpace: 'nowrap' }}>Dr. {nextAppointment.doctor_name}</h2>
                                        <div style={{ fontSize: '1rem', fontWeight: '700', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.7 }}>
                                            <MapPin size={16} />
                                            {nextAppointment.hospital_name || 'Central Medical Hub'}
                                        </div>
                                    </div>

                                    {/* 3. [ TOKEN BOX ] (CONDITIONALLY HIDDEN) */}
                                    {nextAppointment.status !== 'completed' ? (
                                        <>
                                            <div style={{
                                                flex: '1.4',
                                                background: 'linear-gradient(135deg, hsl(230, 80%, 60%), hsl(230, 80%, 45%))',
                                                color: 'white',
                                                borderRadius: '16px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '1.5rem',
                                                boxShadow: '0 10px 25px hsl(230, 80%, 50% / 0.3)',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: '900', color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.5rem', opacity: 0.9 }}>Your Token</div>
                                                <div style={{ fontSize: '3.2rem', fontWeight: '950', color: 'white', lineHeight: '1', letterSpacing: '-0.02em' }}>
                                                    {nextAppointment.token_id || (nextAppointment.token_number ? `TOKEN-${nextAppointment.token_number.toString().padStart(3, '0')}` : '---')}
                                                </div>
                                            </div>

                                            <div style={{
                                                flex: '1.2',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '12px'
                                            }}>
                                                <div style={{
                                                    background: nextAppointment.status === 'NOW SERVING' ? 'hsl(142, 70%, 94%)' : 'hsl(45, 93%, 94%)',
                                                    color: nextAppointment.status === 'NOW SERVING' ? 'hsl(142, 70%, 25%)' : 'hsl(45, 93%, 25%)',
                                                    padding: '0.75rem 1.5rem',
                                                    borderRadius: '12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    fontSize: '1rem',
                                                    fontWeight: '950',
                                                    border: '1px solid ' + (nextAppointment.status === 'NOW SERVING' ? 'hsl(142, 70%, 85%)' : 'hsl(45, 93%, 85%)'),
                                                    width: '100%',
                                                    justifyContent: 'center'
                                                }}>
                                                    <span style={{ fontSize: '1.2rem', color: nextAppointment.status === 'NOW SERVING' ? 'hsl(142, 70%, 45%)' : 'hsl(45, 93%, 47%)' }}>●</span>
                                                    {nextAppointment.status}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'hsl(var(--muted-foreground))' }}>
                                                    {Math.max(0, (nextAppointment.token_number || 1) - 1)} Ahead
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ flex: '2.6', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2rem' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '1.2rem', fontWeight: '950', color: 'hsl(142, 70%, 45%)', marginBottom: '0.2rem' }}>Session Completed</div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'hsl(var(--muted-foreground))' }}>Thank you for visiting</div>
                                            </div>
                                            <div style={{
                                                background: 'hsl(142, 70%, 94%)',
                                                color: 'hsl(142, 70%, 25%)',
                                                padding: '0.75rem 1.5rem',
                                                borderRadius: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                fontSize: '1rem',
                                                fontWeight: '950',
                                                border: '1px solid hsl(142, 70%, 85%)'
                                            }}>
                                                <span style={{ fontSize: '1.2rem', color: 'hsl(142, 70%, 45%)' }}>●</span>
                                                COMPLETED
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="glass-panel empty-widget" style={{ padding: '4rem', textAlign: 'center', borderRadius: '2rem' }}>
                                    <Calendar size={48} className="empty-icon" style={{ opacity: 0.3, marginBottom: '1.5rem' }} />
                                    <h3 className="empty-title" style={{ fontSize: '1.5rem', fontWeight: '900' }}>No Upcoming Visits</h3>
                                    <p className="empty-desc" style={{ color: 'hsl(var(--muted-foreground))' }}>Explore our network to book your next check-up.</p>
                                </div>
                            )}
                        </div>



                        {/* Service Hub */}
                        <div className="service-hub">
                            <h3 className="widget-title">Menu</h3>
                            <div className="service-card-grid">
                                <ServiceCard
                                    icon={<Search size={28} />}
                                    title="Doctor Search"
                                    desc="Find doctors in our medical network."
                                    color="hsl(var(--primary))"
                                    onClick={() => navigate('/patient/search')}
                                />
                                <ServiceCard
                                    icon={<Activity size={28} />}
                                    title="Symptom Checker"
                                    desc="Check your symptoms with AI."
                                    color="hsl(var(--secondary))"
                                    onClick={() => navigate('/patient/symptom-checker')}
                                />
                                <ServiceCard
                                    icon={<ClipboardList size={28} />}
                                    title="Medical Records"
                                    desc="See your safe medical records."
                                    color="hsl(var(--accent))"
                                    onClick={() => navigate('/patient/records')}
                                />
                                <ServiceCard
                                    icon={<CreditCard size={28} />}
                                    title="Financial & Billing"
                                    desc="Complete your appointment booking payments and view settlement history."
                                    color="hsl(142, 70%, 45%)"
                                    onClick={() => navigate('/patient/ledger')}
                                />

                            </div>
                        </div>
                    </div>

                    {/* Sidebar Area */}
                    <div className="dashboard-sidebar">
                        {/* Timeline Feed */}
                        <div className="card timeline-card">
                            <div className="timeline-header">
                                <h4 className="timeline-title">Your Visits</h4>
                                <Bell size={16} className="timeline-icon" />
                            </div>
                            <div className="timeline-body">
                                {loading ? (
                                    <div className="timeline-loading">Loading...</div>
                                ) : (Array.isArray(appointments) && appointments.length > 0) ? (
                                    appointments.slice(0, 4).map((app, i) => (
                                        <div key={i} className="timeline-item">
                                            <div className={`timeline-icon-box ${app.status === 'completed' ? 'active' : ''}`}>
                                                {app.doctor_profile_picture ? (
                                                    <img
                                                        src={api.getMediaUrl(app.doctor_profile_picture)}
                                                        alt="Doctor"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.parentElement.innerHTML = '<div style="color: inherit; font-weight: 800; font-size: 0.8rem;">' + (app.doctor_name?.[0] || 'D') + '</div>';
                                                        }}
                                                    />
                                                ) : (
                                                    <div style={{ color: 'inherit', fontWeight: '800', fontSize: '0.8rem' }}>
                                                        {app.doctor_name?.[0] || 'D'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="timeline-content">
                                                <div className="timeline-doctor">
                                                    Dr. {app.doctor_name}
                                                    <span style={{ marginLeft: '0.75rem', fontSize: '0.65rem', color: app.status === 'NOW SERVING' ? 'hsl(142, 70%, 45%)' : 'hsl(var(--primary))', fontWeight: '900', background: app.status === 'NOW SERVING' ? 'hsl(142, 70%, 45% / 0.08)' : 'hsl(var(--primary)/0.08)', padding: '0.15rem 0.5rem', borderRadius: '0.5rem', verticalAlign: 'middle', border: app.status === 'NOW SERVING' ? '1px solid hsl(142, 70%, 45% / 0.2)' : 'none' }}>
                                                        {app.token_id || (app.token_number ? `TOKEN-${app.token_number.toString().padStart(3, '0')}` : '---')}
                                                    </span>
                                                </div>
                                                <div className="timeline-date">{app.appointment_date}</div>
                                            </div>
                                            <div className="timeline-badges" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: 'auto' }}>
                                                <StatusBadge status={app.status} />
                                                {app.is_paid && (
                                                    <div style={{
                                                        fontSize: '0.6rem', fontWeight: '900', color: 'hsl(var(--primary))',
                                                        background: 'hsl(var(--primary) / 0.05)', padding: '0.2rem 0.4rem',
                                                        borderRadius: '0.4rem', border: '1px solid hsl(var(--primary) / 0.1)',
                                                        textTransform: 'uppercase', letterSpacing: '0.05em'
                                                    }}>
                                                        PAID
                                                    </div>
                                                )}
                                            </div>
                                            {app.status === 'accepted' && !app.is_paid && (
                                                <button
                                                    onClick={() => setPayAppointment(app)}
                                                    className="btn btn-primary"
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '0.6rem', gap: '0.4rem' }}
                                                >
                                                    <CreditCard size={14} /> Pay Now
                                                </button>
                                            )}
                                            {app.status === 'completed' && !app.is_reviewed && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedDoctor(app);
                                                        setIsReviewOpen(true);
                                                    }}
                                                    className="btn-review"
                                                    title="Submit Review"
                                                >
                                                    <Star size={14} fill="currentColor" />
                                                </button>
                                            )}
                                            {app.status === 'reschedule_proposed' && (
                                                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                                                    <button
                                                        onClick={() => handleRescheduleResponse(app.id, 'accept')}
                                                        className="btn btn-secondary"
                                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '0.6rem' }}
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => handleRescheduleResponse(app.id, 'reject')}
                                                        className="btn btn-outline"
                                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '0.6rem', border: '1px solid hsl(var(--accent, #ef4444))', color: 'hsl(var(--accent, #ef4444))' }}
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="timeline-empty">
                                        No historical data available.
                                    </div>
                                )}
                            </div>
                            <button
                                className="btn btn-ghost timeline-footer-btn"
                                onClick={() => navigate('/patient/archive')}
                            >
                                Past Visit Details <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {payAppointment && (
                    <PaymentModal
                        amount={payAppointment.amount || 500}
                        appointmentId={payAppointment.id}
                        onClose={() => setPayAppointment(null)}
                        onSuccess={() => {
                            setPayAppointment(null);
                            fetchDashboardData();
                        }}
                    />
                )}

                {selectedDoctor && (
                    <ReviewModal
                        isOpen={isReviewOpen}
                        onClose={() => {
                            setIsReviewOpen(false);
                            setSelectedDoctor(null);
                        }}
                        appointment={selectedDoctor}
                        onSuccess={() => {
                            alert('Review saved successfully.');
                            fetchDashboardData();
                        }}
                    />
                )}
            </div>
        </div>
    );
};

// --- Specialized Components ---

const ServiceCard = ({ icon, title, desc, color, onClick }) => (
    <div
        className="service-card"
        onClick={onClick}
        style={{ '--hover-color': color, '--hover-shadow': `${color}30` }}
    >
        <div className="service-card-icon-box" style={{ background: color, boxShadow: `0 10px 20px ${color}30` }}>
            {icon}
        </div>
        <h4 className="service-card-title">{title}</h4>
        <p className="service-card-desc">{desc}</p>
    </div>
);

export default PatientDashboard;
