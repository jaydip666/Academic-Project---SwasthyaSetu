import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
    FileText, Search, User, UserPlus,
    Calendar, Clock, CheckCircle2, AlertCircle,
    Activity, Shield, Filter, Database
} from 'lucide-react';

const AdminReports = () => {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');

    useEffect(() => {
        fetchTracks();
    }, []);

    const fetchTracks = async () => {
        try {
            const data = await api.get('/admin/report-tracks/');
            setTracks(data);
        } catch (error) {
            console.error("Failed to fetch report tracks", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTracks = tracks.filter(track => {
        const matchesSearch =
            track.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            track.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            track.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            track.patient_id?.toString().includes(searchTerm) ||
            track.doctor_id?.toString().includes(searchTerm);

        const matchesStatus = statusFilter === 'all' || track.status === statusFilter;

        const matchesDate = !dateFilter || (track.uploaded_at && new Date(track.uploaded_at).toISOString().split('T')[0] === dateFilter);

        return matchesSearch && matchesStatus && matchesDate;
    });

    const getStatusIcon = (status) => {
        return status === 'Viewed' ?
            <CheckCircle2 size={16} className="text-success" /> :
            <Clock size={16} className="text-warning" />;
    };

    return (
        <div className="dashboard-page bg-gradient animate-fade-in" style={{ padding: '4rem 1.5rem', flex: 1 }}>
            <div className="container">
                <header style={{ marginBottom: '4rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', padding: '0.4rem 1rem', borderRadius: '2rem', marginBottom: '1.25rem', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Shield size={14} /> Medical Report Tracking
                    </div>
                    <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem', fontWeight: '800' }}>Patient <span className="gradient-text">Reports</span></h1>
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1.2rem' }}>Track medical records shared between patients and doctors.</p>
                </header>

                {/* Filters */}
                <div className="card" style={{ padding: '1.5rem', marginBottom: '2.5rem', borderRadius: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                        <Search style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} size={18} />
                        <input
                            className="input"
                            placeholder="Search by Patient, Doctor or Filename..."
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
                            style={{ width: '200px', height: '54px', borderRadius: '1.25rem', cursor: 'pointer' }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Any Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Viewed">Viewed</option>
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
                                        <th>Patient</th>
                                        <th>Shared With</th>
                                        <th>Medical File</th>
                                        <th>Date Shared</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTracks.length > 0 ? (
                                        filteredTracks.map((track) => (
                                            <tr key={track.track_id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <User size={20} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '800' }}>{track.patient_name}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: '600' }}>ID: {track.patient_id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'hsl(var(--secondary) / 0.1)', color: 'hsl(var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <UserPlus size={20} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '800' }}>Dr. {track.doctor_name}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: '600' }}>ID: {track.doctor_id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <FileText size={18} className="text-primary" />
                                                        <div>
                                                            <div style={{ fontWeight: '700' }}>{track.file_name}</div>
                                                            <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>Medical Record</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: '700' }}>{new Date(track.uploaded_at).toLocaleDateString()}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>{new Date(track.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                        <div className={`status-pill ${track.status === 'Viewed' ? 'status-pill-success' : 'status-pill-warning'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: '0.75rem', fontWeight: '800', fontSize: '0.7rem', textTransform: 'uppercase', width: 'fit-content' }}>
                                                            {getStatusIcon(track.status)}
                                                            {track.status}
                                                        </div>
                                                        {track.viewed_at && (
                                                            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))', fontWeight: '600', paddingLeft: '0.5rem' }}>
                                                                at {new Date(track.viewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '5rem', color: 'hsl(var(--muted-foreground))' }}>
                                                <Database size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.2 }} />
                                                <p style={{ fontWeight: '600' }}>No medical reports found.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .status-pill-success { background: #22c55e15; color: #22c55e; border: 1px solid #22c55e30; }
                .status-pill-warning { background: #f59e0b15; color: #f59e0b; border: 1px solid #f59e0b30; }
                .text-success { color: #22c55e; }
                .text-warning { color: #f59e0b; }
                .text-primary { color: hsl(var(--primary)); }
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
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid hsl(var(--border) / 0.5);
                }

                .admin-custom-table tr:hover td {
                    background: hsl(var(--primary) / 0.02);
                }
            `}} />
        </div>
    );
};

export default AdminReports;
