import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
    Calendar, Users, UserPlus, Building,
    Search, Filter, ArrowUpRight, Activity,
    Clock, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';

import Modal from '../../components/Modal';

const AdminBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const data = await api.get('/appointments/');
            setBookings(data);
        } catch (error) {
            console.error("Failed to fetch bookings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (bookingId, newStatus) => {
        if (newStatus === 'rescheduled') {
            if (!rescheduleData.date || !rescheduleData.time) {
                alert("Please select both date and time for rescheduling.");
                return;
            }
        }

        setSubmitting(true);
        try {
            const payload = { status: newStatus };
            if (newStatus === 'rescheduled') {
                payload.new_date = rescheduleData.date;
                payload.new_time = rescheduleData.time;
            }

            await api.post(`/appointments/${bookingId}/update_status/`, payload);
            alert(`Booking status updated to ${newStatus}`);
            setSelectedBooking(null);
            setRescheduleData({ date: '', time: '' });
            fetchBookings();
        } catch (error) {
            alert(error.message || "Failed to update status");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredBookings = bookings.filter(booking => {
        const matchesSearch =
            booking.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.patient_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.hospital_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.patient_display_id?.toString().includes(searchTerm) ||
            booking.doctor_display_id?.toString().includes(searchTerm);

        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
        const matchesDate = !dateFilter || booking.appointment_date === dateFilter;

        return matchesSearch && matchesStatus && matchesDate;
    });

    const getStatusIcon = (status) => {
        switch (status) {
            case 'accepted':
            case 'confirmed':
            case 'completed':
                return <CheckCircle2 size={16} className="text-success" />;
            case 'rescheduled':
                return <Activity size={16} className="text-primary" style={{ color: 'hsl(var(--primary))' }} />;
            case 'rejected':
            case 'cancelled':
                return <XCircle size={16} className="text-danger" />;
            case 'pending':
                return <Clock size={16} className="text-warning" />;
            default:
                return <AlertCircle size={16} />;
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'accepted':
            case 'confirmed':
            case 'completed':
                return 'status-pill-success';
            case 'rescheduled':
                return 'status-pill-primary';
            case 'rejected':
            case 'cancelled':
                return 'status-pill-danger';
            case 'pending':
                return 'status-pill-warning';
            default:
                return 'status-pill-info';
        }
    };

    return (
        <div className="dashboard-page bg-gradient animate-fade-in" style={{ padding: '4rem 1.5rem', flex: 1 }}>
            <div className="container">
                <header style={{ marginBottom: '4rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', padding: '0.4rem 1rem', borderRadius: '2rem', marginBottom: '1.25rem', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Activity size={14} /> Unified Booking Control
                    </div>
                    <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem', fontWeight: '800' }}>Patient <span className="gradient-text">Bookings</span></h1>
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1.2rem' }}>Comprehensive tracking of all medical appointments across the network.</p>
                </header>

                {/* Filters & Search */}
                <div className="card" style={{ padding: '1.5rem', marginBottom: '2.5rem', borderRadius: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                        <Search style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} size={18} />
                        <input
                            className="input"
                            placeholder="Search by Patient, Doctor, Hospital or ID..."
                            style={{ paddingLeft: '3.5rem', height: '54px', borderRadius: '1.25rem' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Calendar size={18} className="text-muted" />
                        <input
                            type="date"
                            className="input"
                            style={{ width: '200px', height: '54px', borderRadius: '1.25rem', cursor: 'pointer' }}
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Filter size={18} className="text-muted" />
                        <select
                            className="input"
                            style={{ width: '180px', height: '54px', borderRadius: '1.25rem', cursor: 'pointer' }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="accepted">Accepted</option>
                            <option value="rescheduled">Rescheduled</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    {(searchTerm || statusFilter !== 'all' || dateFilter) && (
                        <button
                            onClick={() => { setSearchTerm(''); setStatusFilter('all'); setDateFilter(''); }}
                            className="btn btn-outline"
                            style={{ height: '54px', borderRadius: '1.25rem', padding: '0 1.5rem', fontWeight: '700' }}
                        >
                            Reset
                        </button>
                    )}

                    <div style={{ marginLeft: 'auto', padding: '0.75rem 1.25rem', background: 'hsl(var(--muted))', borderRadius: '1rem', fontWeight: '700', fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))' }}>
                        Total: {filteredBookings.length} Nodes
                    </div>
                </div>

                {loading ? (
                    <div className="skeleton-table">
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '1rem', marginBottom: '1rem' }}></div>)}
                    </div>
                ) : (
                    <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '2rem', border: '1px solid hsl(var(--border))' }}>
                        <div className="table-wrapper-responsive">
                            <table className="admin-custom-table">
                                <thead>
                                    <tr>
                                        <th>Patient Details</th>
                                        <th>Token ID</th>
                                        <th>Medical Practitioner</th>
                                        <th>Facility Node</th>
                                        <th>Temporal Coordinates</th>
                                        <th>Status Tracking</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBookings.length > 0 ? (
                                        filteredBookings.map((booking) => (
                                            <tr key={booking.id || booking.internal_id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                                                            <Users size={20} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '800', fontSize: '1rem' }}>{booking.patient_name}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: '600' }}>ID: {booking.patient_display_id || 'N/A'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.7rem' }}>
                                                            {booking.token_number || 'N/A'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'hsl(var(--secondary) / 0.1)', color: 'hsl(var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <UserPlus size={20} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '800', fontSize: '1rem' }}>Dr. {booking.doctor_name}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: '600' }}>ID: {booking.doctor_display_id || 'N/A'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <Building size={16} className="text-muted" />
                                                        <span style={{ fontWeight: '700' }}>{booking.hospital_name || 'Central Hub'}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: '700' }}>{booking.appointment_date}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', fontWeight: '500' }}>{booking.appointment_time}</div>
                                                </td>
                                                <td>
                                                    <div className={`status-pill ${getStatusClass(booking.status)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '1rem', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                                        {getStatusIcon(booking.status)}
                                                        {booking.status === 'confirmed' ? 'Accepted' : booking.status}
                                                    </div>
                                                    {booking.status === 'rescheduled' && booking.rescheduled_by && (
                                                        <div style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700', lineHeight: '1.4' }}>
                                                            <div>BY: <span className="text-primary">{booking.rescheduled_by}</span></div>
                                                            <div>PREV: {booking.previous_appointment_date} {booking.previous_appointment_time}</div>
                                                            <div style={{ color: 'hsl(var(--primary))' }}>NEW: {booking.appointment_date} {booking.appointment_time}</div>
                                                            <div>ON: {booking.rescheduled_at ? new Date(booking.rescheduled_at).toLocaleString() : 'N/A'}</div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '5rem', color: 'hsl(var(--muted-foreground))' }}>
                                                <div style={{ opacity: 0.5, marginBottom: '1rem' }}>
                                                    <Calendar size={48} style={{ margin: '0 auto' }} />
                                                </div>
                                                <p style={{ fontWeight: '600' }}>No booking data packets found.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Management Modal */}
            <Modal
                isOpen={!!selectedBooking}
                onClose={() => { setSelectedBooking(null); setRescheduleData({ date: '', time: '' }); }}
                title="Appointment Management"
                subtitle="Override status or reschedule transmission window."
                maxWidth="450px"
            >
                {selectedBooking && (
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div style={{ background: 'hsl(var(--muted) / 0.2)', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid hsl(var(--border))' }}>
                            <div style={{ fontWeight: '800', marginBottom: '0.5rem' }}>{selectedBooking.patient_name} & Dr. {selectedBooking.doctor_name}</div>
                            <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', fontWeight: '600' }}>
                                Current: {selectedBooking.appointment_date} at {selectedBooking.appointment_time}
                            </div>
                            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>Current Status:</span>
                                <div className={`status-pill ${getStatusClass(selectedBooking.status)}`} style={{ padding: '0.25rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.65rem', fontWeight: '900' }}>
                                    {selectedBooking.status === 'confirmed' ? 'Accepted' : selectedBooking.status}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button
                                className="btn btn-outline"
                                onClick={() => handleUpdateStatus(selectedBooking.id || selectedBooking.internal_id, 'accepted')}
                                disabled={submitting || selectedBooking.status === 'accepted'}
                                style={{ height: '50px', borderRadius: '1rem', fontWeight: '800', color: '#22c55e', borderColor: '#22c55e30' }}
                            >
                                <CheckCircle2 size={16} /> Accept
                            </button>
                            <button
                                className="btn btn-outline"
                                onClick={() => handleUpdateStatus(selectedBooking.id || selectedBooking.internal_id, 'rejected')}
                                disabled={submitting || selectedBooking.status === 'rejected'}
                                style={{ height: '50px', borderRadius: '1rem', fontWeight: '800', color: '#ef4444', borderColor: '#ef444430' }}
                            >
                                <XCircle size={16} /> Reject
                            </button>
                            <button
                                className="btn btn-outline"
                                onClick={() => handleUpdateStatus(selectedBooking.id || selectedBooking.internal_id, 'completed')}
                                disabled={submitting || selectedBooking.status === 'completed' || !selectedBooking.is_paid}
                                style={{ height: '50px', borderRadius: '1rem', fontWeight: '800', color: '#3b82f6', borderColor: '#3b82f630' }}
                                title={!selectedBooking.is_paid ? "Cannot complete unpaid appointment" : ""}
                            >
                                <CheckCircle2 size={16} /> Complete
                            </button>
                            <button
                                className="btn btn-outline"
                                onClick={() => handleUpdateStatus(selectedBooking.id || selectedBooking.internal_id, 'cancelled')}
                                disabled={submitting || selectedBooking.status === 'cancelled'}
                                style={{ height: '50px', borderRadius: '1rem', fontWeight: '800', color: 'hsl(var(--muted-foreground))' }}
                            >
                                <XCircle size={16} /> Cancel
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid hsl(var(--primary) / 0.2)', background: 'hsl(var(--primary) / 0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontWeight: '800', color: 'hsl(var(--primary))' }}>
                                <Calendar size={18} /> Forced Reschedule
                            </div>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">New Date</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={rescheduleData.date}
                                        onChange={e => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                                        style={{ height: '48px', borderRadius: '0.75rem' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">New Time</label>
                                    <input
                                        type="time"
                                        className="input"
                                        value={rescheduleData.time}
                                        onChange={e => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                                        style={{ height: '48px', borderRadius: '0.75rem' }}
                                    />
                                </div>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleUpdateStatus(selectedBooking.id || selectedBooking.internal_id, 'rescheduled')}
                                    disabled={submitting}
                                    style={{ width: '100%', height: '50px', borderRadius: '1rem', fontWeight: '800', gap: '0.5rem', marginTop: '0.5rem' }}
                                >
                                    {submitting ? 'Updating...' : <><Activity size={18} /> Update Temporal Sync</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <style dangerouslySetInnerHTML={{
                __html: `
                .status-pill-success { background: #22c55e15; color: #22c55e; border: 1px solid #22c55e30; }
                .status-pill-danger { background: #ef444415; color: #ef4444; border: 1px solid #ef444430; }
                .status-pill-warning { background: #f59e0b15; color: #f59e0b; border: 1px solid #f59e0b30; }
                .status-pill-info { background: #3b82f615; color: #3b82f6; border: 1px solid #3b82f630; }
                .status-pill-primary { background: hsl(var(--primary) / 0.1); color: hsl(var(--primary)); border: 1px solid hsl(var(--primary) / 0.2); }
                
                .text-primary { color: hsl(var(--primary)); }
                .text-success { color: #22c55e; }
                .text-danger { color: #ef4444; }
                .text-warning { color: #f59e0b; }
                .text-muted { color: hsl(var(--muted-foreground)); }

                .admin-custom-table th {
                    background: hsl(var(--muted) / 0.5);
                    padding: 1.25rem 1.5rem;
                    text-transform: uppercase;
                    font-size: 0.75rem;
                    letter-spacing: 0.05em;
                    font-weight: 800;
                    color: hsl(var(--muted-foreground));
                    border-bottom: 1px solid hsl(var(--border));
                }

                .admin-custom-table td {
                    padding: 1.5rem;
                    border-bottom: 1px solid hsl(var(--border) / 0.5);
                    transition: var(--transition);
                }

                .admin-custom-table tr:hover td {
                    background: hsl(var(--primary) / 0.02);
                }

                .admin-custom-table tr:last-child td {
                    border-bottom: none;
                }
            `}} />
        </div>
    );
};

export default AdminBookings;
