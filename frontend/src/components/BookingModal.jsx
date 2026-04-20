import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { X, Calendar as CalendarIcon, Clock, CheckCircle, ShieldCheck, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import PaymentModal from './PaymentModal';
import Modal from './Modal';

const BookingModal = ({ doctor, onClose, onSuccess }) => {
    const navigate = useNavigate();
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [booking, setBooking] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewMonth, setViewMonth] = useState(new Date());
    const [availabilityMap, setAvailabilityMap] = useState({});
    const [showPayment, setShowPayment] = useState(false);

    useEffect(() => {
        fetchAvailability();
    }, [viewMonth, doctor.id]);

    useEffect(() => {
        fetchSlots();
    }, [selectedDate, doctor.id]);

    const fetchAvailability = async () => {
        try {
            const m = viewMonth.getMonth() + 1;
            const y = viewMonth.getFullYear();
            const data = await api.get(`/doctor/availability-calendar/?doctor_id=${doctor.id}&month=${m}&year=${y}`);
            setAvailabilityMap(data);
        } catch (err) {
            console.error("Failed to fetch monthly availability", err);
        }
    };

    const fetchSlots = async () => {
        setLoading(true);
        try {
            const data = await api.get(`/time-slots/available/?doctor_id=${doctor.id}&date=${selectedDate}`);
            setSlots(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const changeMonth = (offset) => {
        const nextMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + offset, 1);
        setViewMonth(nextMonth);
    };

    const renderCalendarDays = () => {
        const days = [];
        const date = viewMonth;
        const totalDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();

        // Empty padding
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="cal-day-btn empty" />);
        }

        // Days
        const todayStr = new Date().toISOString().split('T')[0];
        for (let d = 1; d <= totalDays; d++) {
            const m_norm = String(date.getMonth() + 1).padStart(2, '0');
            const d_norm = String(d).padStart(2, '0');
            const dStr = `${date.getFullYear()}-${m_norm}-${d_norm}`;

            const isToday = dStr === todayStr;
            const isSelected = dStr === selectedDate;
            const isPast = dStr < todayStr;
            const availability = availabilityMap[dStr];
            const hasSlots = availability && availability.available;

            days.push(
                <button
                    key={d}
                    type="button"
                    disabled={isPast}
                    className={`cal-day-btn ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasSlots ? 'available' : ''}`}
                    onClick={() => setSelectedDate(dStr)}
                >
                    {d}
                </button>
            );
        }
        return days;
    };

    const [requestSuccess, setRequestSuccess] = useState(null);

    const handleInitiateBooking = async () => {
        if (!selectedSlot) return;
        setBooking(true);
        try {
            const res = await api.post('/appointments/create', {
                doctor_id: doctor.id,
                appointment_date: selectedDate,
                appointment_time: selectedSlot.start_time,
                hospital_id: doctor.hospital_id,
            });
            setRequestSuccess(res);
            // DO NOT show payment modal here - patient pays AFTER doctor approval
            // setShowPayment(true);
        } catch (err) {
            alert('Failed to book: ' + (err.message || 'Connection error'));
            setBooking(false);
        }
    };


    if (showPayment && requestSuccess) {
        return (
            <PaymentModal
                amount={doctor.consultation_fee || 500}
                appointmentId={requestSuccess.appointment_id}
                onClose={() => setShowPayment(false)}
                onSuccess={() => {
                    setShowPayment(false);
                }}
            />
        );
    }

    if (requestSuccess) {
        return (
            <Modal
                isOpen={true}
                onClose={() => { if (typeof onSuccess === 'function') onSuccess(); onClose(); }}
                title="Request Sent"
                subtitle="Booking Success"
                maxWidth="450px"
            >
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <div style={{ width: '80px', height: '80px', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                        <ShieldCheck size={40} />
                    </div>
                    <div style={{ background: 'hsl(var(--primary) / 0.08)', color: 'hsl(var(--primary))', padding: '1.25rem 2rem', borderRadius: '1rem', border: '1px solid hsl(var(--primary) / 0.2)', marginBottom: '1.5rem', display: 'inline-block' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Awaiting Doctor Approval</div>
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>Request Received</h3>
                    <p style={{ color: 'hsl(var(--muted-foreground))', lineHeight: '1.6', marginBottom: '2.5rem' }}>
                        Your appointment request with <strong>Dr. {doctor.doctor_name}</strong> has been sent. Once the doctor approves it, you can pay from your dashboard to confirm your spot.
                    </p>
                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', height: '54px', borderRadius: '1.25rem', fontWeight: '800' }}
                        onClick={() => { 
                            if (typeof onSuccess === 'function') onSuccess(); 
                            onClose();
                            navigate('/patient');
                        }}
                    >
                        Go to Dashboard
                    </button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Book Appointment"
            subtitle={`Dr. ${doctor.doctor_name} • ${doctor.specialization}`}
            maxWidth="540px"
        >
            {/* Selection Interface */}
            <div style={{ padding: '0' }}>

                {/* Premium Calendar Selection */}
                <div style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <label className="form-label" style={{ fontWeight: '800', color: 'hsl(var(--foreground))', margin: 0 }}>
                            Select Date
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => changeMonth(-1)}
                                className="btn btn-ghost"
                                style={{ padding: '0.4rem', borderRadius: '0.75rem' }}
                                disabled={viewMonth <= new Date(new Date().getFullYear(), new Date().getMonth(), 1)}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span style={{ fontSize: '0.9rem', fontWeight: '800', minWidth: '110px', textAlign: 'center' }}>
                                {viewMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </span>
                            <button onClick={() => changeMonth(1)} className="btn btn-ghost" style={{ padding: '0.4rem', borderRadius: '0.75rem' }}>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="calendar-grid-premium">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <div key={`${d}-${i}`} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: '900', color: 'hsl(var(--muted-foreground))', padding: '0.5rem 0' }}>{d}</div>
                        ))}
                        {renderCalendarDays()}
                    </div>
                </div>

                <style>{`
                    .calendar-grid-premium {
                        display: grid;
                        grid-template-columns: repeat(7, 1fr);
                        gap: 0.5rem;
                        background: hsl(var(--muted) / 0.15);
                        padding: 0.75rem;
                        border-radius: 1.5rem;
                        border: 1px solid hsl(var(--border));
                    }
                    .cal-day-btn {
                        aspect-ratio: 1;
                        border-radius: 1rem;
                        border: 2px solid transparent;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.9rem;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                        position: relative;
                        background: transparent;
                    }
                    .cal-day-btn.empty { cursor: default; }
                    .cal-day-btn.today { color: hsl(var(--primary)); }
                    .cal-day-btn.selected { 
                        background: hsl(var(--primary)); 
                        color: white !important;
                        box-shadow: 0 4px 12px hsl(var(--primary) / 0.3);
                    }
                    .cal-day-btn.available::after {
                        content: '';
                        position: absolute;
                        bottom: 4px;
                        width: 4px;
                        height: 4px;
                        border-radius: 50%;
                        background: #10b981;
                    }
                    .cal-day-btn:disabled { 
                        opacity: 0.25; 
                        cursor: not-allowed;
                    }
                    .cal-day-btn:not(.empty):not(:disabled):hover {
                        background: hsl(var(--primary) / 0.08);
                        border-color: hsl(var(--primary) / 0.2);
                    }
                `}</style>

                {/* Harmonic Slots Grid */}
                <div style={{ marginBottom: '2.5rem' }}>
                    <label className="form-label" style={{ fontWeight: '800', color: 'hsl(var(--foreground))', marginBottom: '0.75rem', display: 'block' }}>Available Temporal Slots</label>
                    {loading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton" style={{ height: '54px', borderRadius: '1rem' }}></div>)}
                        </div>
                    ) : slots.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            {slots.map(slot => (
                                <button
                                    key={slot.slot_id}
                                    onClick={() => setSelectedSlot(slot)}
                                    disabled={slot.remaining === 0}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        borderRadius: '1.25rem',
                                        border: `2px solid ${selectedSlot?.slot_id === slot.slot_id ? 'hsl(var(--primary))' : slot.remaining === 0 ? 'hsl(var(--border) / 0.5)' : 'hsl(var(--border))'}`,
                                        background: selectedSlot?.slot_id === slot.slot_id ? 'hsl(var(--primary))' : slot.remaining === 0 ? 'hsl(var(--muted) / 0.3)' : 'white',
                                        color: selectedSlot?.slot_id === slot.slot_id ? 'white' : slot.remaining === 0 ? 'hsl(var(--muted-foreground) / 0.5)' : 'hsl(var(--foreground))',
                                        cursor: slot.remaining === 0 ? 'not-allowed' : 'pointer',
                                        fontSize: '0.95rem',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: selectedSlot?.slot_id === slot.slot_id ? '0 10px 20px hsl(var(--primary) / 0.2)' : 'none',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '800' }}>
                                        <Clock size={12} opacity={0.6} /> {slot.start_time.slice(0, 5)}
                                    </div>
                                    <div style={{
                                        fontSize: '0.65rem',
                                        fontWeight: '700',
                                        color: selectedSlot?.slot_id === slot.slot_id ? 'rgba(255,255,255,0.8)' : slot.remaining === 0 ? 'hsl(var(--destructive))' : slot.remaining < 3 ? '#f59e0b' : 'hsl(var(--primary))'
                                    }}>
                                        {slot.remaining === 0 ? 'Full' : `${slot.remaining} left`}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            padding: '3rem',
                            background: 'hsl(var(--muted) / 0.5)',
                            borderRadius: '1.5rem',
                            color: 'hsl(var(--muted-foreground))',
                            border: '1px dashed hsl(var(--border))'
                        }}>
                            <Zap size={24} style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
                            <p style={{ fontWeight: '600' }}>No slots detected for this date.</p>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1rem' }}>
                    <button
                        className="btn btn-outline"
                        style={{ flex: 1, padding: '1.1rem', fontWeight: '800' }}
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        style={{ flex: 2, padding: '1.1rem', fontWeight: '800', gap: '0.75rem' }}
                        disabled={!selectedSlot || booking}
                        onClick={handleInitiateBooking}
                    >
                        {booking ? <RefreshCw className="animate-spin" size={20} /> : <CalendarIcon size={20} />}
                        {booking ? 'Initiating...' : `Request Approval`}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default BookingModal;

function RefreshCw(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
        </svg>
    );
}


