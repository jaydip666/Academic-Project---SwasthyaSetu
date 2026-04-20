import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
    Calendar as CalendarIcon, Clock, Save, Plus, Trash2, Zap, RotateCcw,
    ShieldCheck, Sun, Moon, ChevronLeft, ChevronRight, LayoutGrid, CalendarDays,
    CheckCircle
} from 'lucide-react';

const DoctorSchedule = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [schedule, setSchedule] = useState({});
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewMonth, setViewMonth] = useState(new Date());
    const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' or 'weekly'
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            const data = await api.get('/doctor/schedule/');
            setSchedule(data || {});
        } catch (error) {
            console.error("Failed to fetch schedule", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTimeChange = (key, index, field, value) => {
        const newSchedule = { ...schedule };
        if (!newSchedule[key]) return;
        
        // Ensure structure is object-based
        if (Array.isArray(newSchedule[key])) {
            newSchedule[key] = { slots: newSchedule[key], limit: 10 };
        }
        
        newSchedule[key].slots[index][field] = value;
        setSchedule(newSchedule);
    };

    const handleLimitChange = (key, value) => {
        const newSchedule = { ...schedule };
        if (!newSchedule[key]) {
            newSchedule[key] = { slots: [], limit: parseInt(value) || 10 };
        } else if (Array.isArray(newSchedule[key])) {
            newSchedule[key] = { slots: newSchedule[key], limit: parseInt(value) || 10 };
        } else {
            newSchedule[key].limit = parseInt(value) || 10;
        }
        setSchedule(newSchedule);
    };

    const addSlot = (key) => {
        const newSchedule = { ...schedule };
        if (!newSchedule[key]) {
            newSchedule[key] = { slots: [], limit: 10 };
        } else if (Array.isArray(newSchedule[key])) {
            newSchedule[key] = { slots: newSchedule[key], limit: 10 };
        }
        
        newSchedule[key].slots.push({ start: '09:00', end: '17:00' });
        setSchedule(newSchedule);
    };

    const removeSlot = (key, index) => {
        const newSchedule = { ...schedule };
        if (Array.isArray(newSchedule[key])) {
            newSchedule[key] = { slots: newSchedule[key], limit: 10 };
        }
        
        newSchedule[key].slots.splice(index, 1);
        setSchedule(newSchedule);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/doctor/schedule/update/', schedule);
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 3000);
        } catch (error) {
            alert(`Failed to save schedule: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    // Calendar logic
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const calendarDate = (day) => {
        const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split('T')[0];
    };

    const isDateSelected = (day) => calendarDate(day) === selectedDate;
    const isToday = (day) => calendarDate(day) === new Date().toISOString().split('T')[0];
    const hasSlots = (day) => schedule[calendarDate(day)] && schedule[calendarDate(day)].length > 0;

    const changeMonth = (offset) => {
        setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + offset, 1));
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(viewMonth);
        const firstDay = getFirstDayOfMonth(viewMonth);
        const calendarGrid = [];

        // Padding for first week
        for (let i = 0; i < firstDay; i++) {
            calendarGrid.push(<div key={`pad-${i}`} className="calendar-day-empty"></div>);
        }

        // Days of month
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = calendarDate(d);
            const dayConfig = schedule[dateStr];
            const active = isDateSelected(d);
            const today = isToday(d);
            const slotsCount = Array.isArray(dayConfig) ? dayConfig.length : (dayConfig?.slots?.length || 0);

            const isPast = new Date(dateStr).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);

            calendarGrid.push(
                <div
                    key={d}
                    className={`calendar-day ${active ? 'active' : ''} ${today ? 'today' : ''} ${isPast ? 'past' : ''}`}
                    onClick={() => !isPast && setSelectedDate(dateStr)}
                    style={{ cursor: isPast ? 'not-allowed' : 'pointer', opacity: isPast ? 0.3 : 1 }}
                >
                    <span className="day-number">{d}</span>
                    {slotsCount > 0 && <div className="slot-indicator">{slotsCount}</div>}
                    {slotsCount === 0 && (Array.isArray(schedule[daysOfWeek[new Date(dateStr).getDay()]]) ? 
                        schedule[daysOfWeek[new Date(dateStr).getDay()]]?.length > 0 :
                        schedule[daysOfWeek[new Date(dateStr).getDay()]]?.slots?.length > 0) && (
                        <div className="slot-indicator-fallback" />
                    )}
                </div>
            );
        }

        return calendarGrid;
    };

    if (loading) return (
        <div className="bg-gradient" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="skeleton" style={{ width: '400px', height: '200px', borderRadius: '2rem' }}></div>
        </div>
    );

    const getCurrentKey = () => {
        if (activeTab === 'weekly') {
            const d = new Date(selectedDate);
            return daysOfWeek[d.getDay()];
        }
        return selectedDate;
    };

    const activeKey = getCurrentKey();
    const dayConfig = schedule[activeKey];
    const currentSlots = Array.isArray(dayConfig) ? dayConfig : (dayConfig?.slots || []);
    const currentLimit = Array.isArray(dayConfig) ? 10 : (dayConfig?.limit || 10);
    const isWeeklyKey = daysOfWeek.includes(activeKey);

    return (
        <div className="bg-gradient animate-fade-in" style={{ padding: '4rem 1.5rem', flex: 1, color: 'hsl(var(--foreground))' }}>
            <div className="container" style={{ maxWidth: '1200px' }}>

                {/* Protocol Header */}
                <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', padding: '0.4rem 1rem', borderRadius: '2rem', marginBottom: '1.25rem', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <ShieldCheck size={14} /> Manage Availability
                        </div>
                        <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem', fontWeight: '800' }}>Schedule <span className="gradient-text">Manager</span></h1>
                        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1.1rem' }}>Set your available hours and appointment limits.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-outline" onClick={fetchSchedule} style={{ height: '54px', padding: '0 1.5rem', borderRadius: '1.25rem' }}>
                            <RotateCcw size={18} />
                        </button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ height: '54px', padding: '0 2.5rem', borderRadius: '1.25rem', fontWeight: '800', gap: '0.75rem' }}>
                            {saving ? <Zap size={18} className="animate-spin" /> : <Save size={18} />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: '2.5rem', alignItems: 'start' }}>

                    {/* Left: Calendar & Selector */}
                    <div className="glass-panel" style={{ padding: '2rem', background: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', background: 'hsl(var(--muted) / 0.3)', padding: '0.4rem', borderRadius: '1.25rem' }}>
                                <button
                                    className={`btn btn-sm ${activeTab === 'calendar' ? 'btn-primary' : 'btn-ghost'}`}
                                    onClick={() => setActiveTab('calendar')}
                                    style={{ padding: '0 1.5rem', height: '40px', borderRadius: '0.9rem' }}
                                >
                                    <CalendarDays size={16} style={{ marginRight: '0.5rem' }} /> Calendar
                                </button>
                                <button
                                    className={`btn btn-sm ${activeTab === 'weekly' ? 'btn-primary' : 'btn-ghost'}`}
                                    onClick={() => setActiveTab('weekly')}
                                    style={{ padding: '0 1.5rem', height: '40px', borderRadius: '0.9rem' }}
                                >
                                    <LayoutGrid size={16} style={{ marginRight: '0.5rem' }} /> Weekly Defaults
                                </button>
                            </div>

                            {activeTab === 'calendar' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    <button onClick={() => changeMonth(-1)} className="nav-btn"><ChevronLeft size={20} /></button>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', width: '150px', textAlign: 'center' }}>
                                        {viewMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </h3>
                                    <button onClick={() => changeMonth(1)} className="nav-btn"><ChevronRight size={20} /></button>
                                </div>
                            )}
                        </div>

                        {activeTab === 'calendar' ? (
                            <div className="calendar-container">
                                <div className="calendar-weekdays">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
                                </div>
                                <div className="calendar-grid">
                                    {renderCalendar()}
                                </div>
                            </div>
                        ) : (
                            <div className="weekly-selector">
                                {daysOfWeek.map((day) => (
                                    <button
                                        key={day}
                                        className={`weekly-btn ${selectedDate === day ? 'active' : ''}`}
                                        onClick={() => setSelectedDate(day)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div className="day-dot"></div>
                                            <span>{day}</span>
                                        </div>
                                        {schedule[day]?.length > 0 ?
                                            <span className="node-active">ACTIVE NODE</span> :
                                            <span className="node-closed">CLOSED</span>
                                        }
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Slot Management */}
                    <div className="glass-panel animate-slide-up" style={{ padding: '0', overflow: 'hidden', background: 'white' }}>
                        <div style={{
                            padding: '2rem',
                            background: 'linear-gradient(135deg, hsl(var(--primary) / 0.05), transparent)',
                            borderBottom: '1px solid hsl(var(--border))'
                        }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                                    {isWeeklyKey ? `Default ${activeKey}` : new Date(activeKey).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                                </h3>
                                <div style={{
                                    display: 'inline-flex', padding: '0.4rem 0.8rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: '800',
                                    background: currentSlots.length > 0 ? 'hsl(142, 70%, 45% / 0.1)' : 'hsl(0, 70%, 50% / 0.1)',
                                    color: currentSlots.length > 0 ? 'hsl(142, 70%, 45%)' : 'hsl(0, 70%, 50%)'
                                }}>
                                    {currentSlots.length > 0 ? 'ACTIVE WINDOWS' : 'UNAVAILABLE'}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'hsl(var(--muted-foreground))' }}>DAY LIMIT</label>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type="number" 
                                        className="input" 
                                        style={{ height: '40px', width: '80px', paddingLeft: '1rem', borderRadius: '0.75rem', textAlign: 'center' }} 
                                        value={currentLimit} 
                                        onChange={(e) => handleLimitChange(activeKey, e.target.value)}
                                        placeholder="10"
                                    />
                                </div>
                            </div>
                        </div>
                        </div>

                        <div style={{ padding: '2rem' }}>
                            <div style={{ display: 'grid', gap: '1.25rem' }}>
                                {currentSlots.length === 0 && !isWeeklyKey && (
                                    <div style={{
                                        padding: '1.5rem', borderRadius: '1.25rem', border: '1px dashed hsl(var(--border))',
                                        textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem'
                                    }}>
                                        Using Weekly Defaults for this date. Add specific slots to override.
                                    </div>
                                )}

                                {currentSlots.map((slot, index) => (
                                    <div key={index} className="slot-row animate-scale-in">
                                        <div className="time-input-group">
                                            <div style={{ position: 'relative', flex: 1 }}>
                                                <Clock size={14} className="input-icon" />
                                                <input
                                                    type="time"
                                                    className="input"
                                                    value={slot.start}
                                                    onChange={(e) => handleTimeChange(activeKey, index, 'start', e.target.value)}
                                                />
                                            </div>
                                            <div className="time-separator"></div>
                                            <div style={{ position: 'relative', flex: 1 }}>
                                                <Clock size={14} className="input-icon" />
                                                <input
                                                    type="time"
                                                    className="input"
                                                    value={slot.end}
                                                    onChange={(e) => handleTimeChange(activeKey, index, 'end', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            className="delete-slot-btn"
                                            onClick={() => removeSlot(activeKey, index)}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}

                                <button className="add-slot-btn" onClick={() => addSlot(activeKey)}>
                                    <Plus size={18} /> Add Temporal Segment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Toast Protocol */}
            {showSuccessToast && (
                <div className="toast-protocol animate-slide-up">
                    <div className="toast-icon">
                        <CheckCircle size={20} />
                    </div>
                    <div className="toast-content">
                        <div className="toast-title">Protocol Synchronized</div>
                        <div className="toast-desc">Temporal configuration calibrated successfully.</div>
                    </div>
                    <div className="toast-timer"></div>
                </div>
            )}

            <style>{`
                .calendar-container { width: 100%; }
                .calendar-weekdays {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    text-align: center;
                    font-weight: 800;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    color: hsl(var(--muted-foreground));
                    margin-bottom: 2rem;
                    letter-spacing: 0.1em;
                }
                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 0.75rem;
                }
                .calendar-day {
                    aspect-ratio: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    border-radius: 1.25rem;
                    cursor: pointer;
                    position: relative;
                    transition: all 0.2s;
                    border: 1px solid transparent;
                    font-weight: 700;
                }
                .calendar-day:hover { background: hsl(var(--primary) / 0.05); }
                .calendar-day.active {
                    background: hsl(var(--primary));
                    color: white;
                    box-shadow: 0 10px 25px hsl(var(--primary) / 0.3);
                }
                .calendar-day.today { border-color: hsl(var(--primary) / 0.3); }
                .calendar-day.today::after {
                    content: '';
                    position: absolute;
                    bottom: 8px;
                    width: 4px;
                    height: 4px;
                    background: currentColor;
                    border-radius: 50%;
                }
                .slot-indicator {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    font-size: 0.6rem;
                    background: rgba(255,255,255,0.2);
                    padding: 2px 6px;
                    border-radius: 10px;
                }
                .calendar-day:not(.active) .slot-indicator {
                    background: hsl(var(--primary) / 0.1);
                    color: hsl(var(--primary));
                }
                .slot-indicator-fallback {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 6px;
                    height: 6px;
                    background: hsl(var(--muted) / 0.3);
                    border-radius: 50%;
                }
                .nav-btn {
                    width: 44px;
                    height: 44px;
                    border-radius: 1rem;
                    border: 1px solid hsl(var(--border));
                    background: transparent;
                    display: flex;
                    alignItems: center;
                    justifyContent: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .nav-btn:hover { background: hsl(var(--muted) / 0.1); }
                .weekly-selector { display: grid; gap: 0.75rem; }
                .weekly-btn {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.25rem 2rem;
                    border-radius: 1.25rem;
                    background: hsl(var(--muted) / 0.05);
                    border: 1.5px solid transparent;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-weight: 700;
                }
                .weekly-btn.active {
                    background: hsl(var(--primary) / 0.05);
                    border-color: hsl(var(--primary) / 0.3);
                    color: hsl(var(--primary));
                }
                .day-dot { width: 8px; height: 8px; border-radius: 50%; background: hsl(var(--primary)); }
                .node-active { font-size: 0.65rem; color: hsl(142, 70%, 45%); }
                .node-closed { font-size: 0.65rem; opacity: 0.4; }
                
                .slot-row { display: flex; align-items: center; gap: 1rem; }
                .time-input-group { display: flex; align-items: center; gap: 0.75rem; flex: 1; }
                .input-icon { position: absolute; left: 1.25rem; top: 50%; transform: translateY(-50%); color: hsl(var(--primary)); opacity: 0.5; }
                .input { 
                    height: 52px; width: 100%; border-radius: 1.1rem; padding-left: 3rem; 
                    background: hsl(var(--muted) / 0.05); border: 1px solid hsl(var(--border));
                    font-weight: 600; font-size: 0.9rem;
                }
                .time-separator { width: 12px; height: 2px; background: hsl(var(--border)); }
                .delete-slot-btn {
                    width: 52px; height: 52px; border-radius: 1.1rem; background: #fff5f5; 
                    color: #ff4d4d; border: 1px solid #ffe3e3; cursor: pointer;
                }
                .add-slot-btn {
                    width: 100%; height: 52px; border-radius: 1.1rem; border: 2px dashed hsl(var(--border));
                    background: transparent; color: hsl(var(--muted-foreground)); 
                    font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
                    cursor: pointer; margin-top: 1rem;
                }
                .add-slot-btn:hover { background: hsl(var(--muted) / 0.1); }

                .toast-protocol {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    background: white;
                    border: 1px solid hsl(var(--border));
                    padding: 1.25rem 1.5rem;
                    border-radius: 1.25rem;
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    z-index: 1000;
                    min-width: 350px;
                    overflow: hidden;
                }
                .toast-icon {
                    width: 44px;
                    height: 44px;
                    background: hsl(142, 70%, 45% / 0.1);
                    color: hsl(142, 70%, 45%);
                    border-radius: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .toast-title { font-weight: 800; font-size: 1rem; color: hsl(var(--foreground)); }
                .toast-desc { font-size: 0.8rem; color: hsl(var(--muted-foreground)); font-weight: 600; }
                .toast-timer {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 3px;
                    background: hsl(142, 70%, 45%);
                    animation: toast-timer 3s linear forwards;
                }
                @keyframes toast-timer {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
};

export default DoctorSchedule;

