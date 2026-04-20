import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, Trash2, Mail, Phone, Calendar, ShieldCheck, Search, MoreVertical, Activity, Heart, Droplets, Eye, FileSpreadsheet } from 'lucide-react';
import UserPortfolioModal from '../../components/admin/UserPortfolioModal';
import { exportToExcel } from '../../utils/excelExport';

const AdminPatients = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const data = await api.get('/admin/users/patient/');
            setPatients(data);
        } catch (err) {
            console.error("Failed to fetch patients", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this patient? All medical records will be permanently deleted.')) return;
        try {
            await api.delete(`/admin/users/${id}/delete/`);
            fetchPatients();
        } catch (err) {
            console.error('Delete failed', err);
            alert('Delete failed');
        }
    };

    const handleExportExcel = async () => {
        setExporting(true);
        try {
            const formatPatients = patients.map(p => ({
                'Patient ID': String(p.patient_id || p.internal_id || p.id),
                'Patient Name': `${p.first_name} ${p.last_name}`,
                'Email': p.email,
                'Phone Number': p.phone_no || 'N/A',
                'Gender': p.gender || 'N/A',
                'Date of Birth': p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : 'N/A',
                'Registration Date': p.date_joined ? new Date(p.date_joined).toLocaleDateString() : 'N/A'
            }));

            const success = exportToExcel({
                'Patients': formatPatients
            }, `SwasthyaSetu_Patients_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

            if (!success) throw new Error('Excel generation failed');
        } catch (err) {
            console.error('Export Error:', err);
            alert('Failed to generate Excel report');
        } finally {
            setExporting(false);
        }
    };

    const filteredPatients = patients.filter(p =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [selectedPatient, setSelectedPatient] = useState(null);

    return (
        <div className="bg-gradient animate-fade-in" style={{ padding: '4rem 1.5rem', flex: 1 }}>
            <UserPortfolioModal
                user={selectedPatient}
                role="patient"
                onClose={() => setSelectedPatient(null)}
            />
            <div className="container">
                <header style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                    {/* Header Code Same */}
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', padding: '0.4rem 1rem', borderRadius: '2rem', marginBottom: '1.25rem', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Activity size={14} /> Patient Stats
                        </div>
                        <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem', fontWeight: '800' }}>Patient <span className="gradient-text">List</span></h1>
                        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1.2rem' }}>View and manage all registered patients.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button
                            className="btn btn-outline"
                            onClick={handleExportExcel}
                            disabled={exporting || loading}
                            style={{ height: '54px', borderRadius: '1.25rem', gap: '0.5rem', fontWeight: '800', border: '2px solid hsl(var(--primary) / 0.5)', color: 'hsl(var(--primary))' }}
                        >
                            {exporting ? <Activity size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
                            {exporting ? 'Exporting...' : 'Export to Excel'}
                        </button>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                            <input
                                type="text"
                                placeholder="Search patients..."
                                className="input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '3rem', width: '280px', height: '54px', borderRadius: '1.25rem' }}
                            />
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton" style={{ height: '240px', borderRadius: '2rem' }}></div>)}
                    </div>
                ) : filteredPatients.length === 0 ? (
                    <div className="card" style={{ padding: '6rem 2rem', textAlign: 'center' }}>
                        <div style={{ background: 'hsl(var(--muted))', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: 'hsl(var(--muted-foreground))' }}>
                            <Search size={40} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>No Patients Found</h3>
                        <p style={{ color: 'hsl(var(--muted-foreground))' }}>Adjust your search parameters or check system logs.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>
                        {filteredPatients.map(p => (
                            <div key={p.id} className="card animate-slide-up" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid hsl(var(--border))' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                        <div style={{
                                            width: '64px', height: '64px', borderRadius: '1.5rem',
                                            background: 'hsl(var(--secondary) / 0.1)', color: 'hsl(var(--secondary))',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.5rem', fontWeight: '900', border: '1px solid hsl(var(--secondary) / 0.2)',
                                            overflow: 'hidden'
                                        }}>
                                            {p.profile_picture ? (
                                                <img src={api.getMediaUrl(p.profile_picture)} alt="Patient" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <>{p.first_name?.[0]}{p.last_name?.[0]}</>
                                            )}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{p.first_name} {p.last_name}</h3>
                                            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', fontWeight: '600' }}>ID: SS-{p.patient_id || p.internal_id || p.id?.slice(-8).toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => setSelectedPatient(p)}
                                            className="btn-icon"
                                            style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
                                            title="View Profile"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            className="btn-icon"
                                            style={{ background: 'hsl(346, 77%, 49% / 0.1)', color: 'hsl(346, 77%, 49%)' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div style={{ padding: '0.75rem', background: 'hsl(var(--muted) / 0.4)', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                        <Mail size={14} style={{ color: 'hsl(var(--primary))' }} />
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.email}</span>
                                    </div>
                                    <div style={{ padding: '0.75rem', background: 'hsl(var(--muted) / 0.4)', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                        <Phone size={14} style={{ color: 'hsl(var(--secondary))' }} /> {p.phone_no}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <div style={{ padding: '0.4rem 0.8rem', background: 'hsl(var(--primary) / 0.05)', color: 'hsl(var(--primary))', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Activity size={12} /> Active
                                    </div>
                                    <div style={{ padding: '0.4rem 0.8rem', background: 'hsl(346, 77%, 49% / 0.05)', color: 'hsl(346, 77%, 49%)', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Droplets size={12} /> {p.blood_group || 'O+'}
                                    </div>
                                    <div style={{ padding: '0.4rem 0.8rem', background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: '800', marginLeft: 'auto' }}>
                                        Joined {new Date(p.date_joined || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPatients;
