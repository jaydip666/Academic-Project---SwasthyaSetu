import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, Trash2, Mail, Phone, Calendar, ShieldCheck, UserPlus, Search, Filter, MoreVertical, ExternalLink, Eye, Check, X, ShieldAlert, Award, FileSpreadsheet, Activity } from 'lucide-react';
import UserPortfolioModal from '../../components/admin/UserPortfolioModal';
import { exportToExcel } from '../../utils/excelExport';

const AdminDoctors = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [hospitals, setHospitals] = useState([]);
    const [assigningId, setAssigningId] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'pending'
    const [pendingDoctors, setPendingDoctors] = useState([]);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        if (activeTab === 'active') {
            fetchDoctors();
        } else {
            fetchPendingDoctors();
        }
        fetchHospitals();
    }, [activeTab]);

    // ... (fetchHospitals, handleAssignHospital, fetchDoctors, handleDelete logic remains same)
    const fetchHospitals = async () => {
        try {
            const data = await api.get('/admin/hospitals/');
            setHospitals(data);
        } catch (err) {
            console.error("Failed to fetch hospitals", err);
        }
    };

    const handleAssignHospital = async (doctorId, hospitalId) => {
        setAssigningId(doctorId);
        try {
            await api.post('/admin/assign-doctor/', { doctor_id: doctorId, hospital_id: hospitalId });
            alert('Doctor assigned to hospital');
            fetchDoctors();
        } catch (err) {
            console.error('Assignment failed', err);
            alert('Assignment failed');
        } finally {
            setAssigningId(null);
        }
    };

    const fetchDoctors = async () => {
        try {
            const data = await api.get('/admin/users/doctor/');
            setDoctors(data);
        } catch (err) {
            console.error("Failed to fetch doctors", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingDoctors = async () => {
        setLoading(true);
        try {
            const data = await api.get('/admin/doctor-registrations/');
            setPendingDoctors(data);
        } catch (err) {
            console.error("Failed to fetch pending doctors", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRegistrationAction = async (id, action) => {
        if (!confirm(`Are you sure you want to ${action} this doctor?`)) return;
        try {
            await api.post(`/admin/doctor-registrations/${id}/status/`, { action });
            alert(`Doctor ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
            fetchPendingDoctors();
        } catch (err) {
            alert(`Action failed: ${err.message || 'Unknown error'}`);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this doctor? This will also remove their medical records.')) return;
        try {
            await api.delete(`/admin/users/${id}/delete/`);
            if (activeTab === 'active') fetchDoctors();
            else fetchPendingDoctors();
        } catch (err) {
            console.error('Deletion failed', err);
            alert('Deletion failed');
        }
    };

    const handleExportExcel = async () => {
        setExporting(true);
        try {
            const formatDoctors = (activeTab === 'active' ? doctors : pendingDoctors).map(d => ({
                'Doctor ID': String(d.doctor_id || d.internal_id || d.id),
                'Doctor Name': d.doctor_name || `${d.first_name} ${d.last_name}`,
                'Medical System': d.medical_system || 'Allopathic',
                'Specialization / Department': d.specialization || 'N/A',
                'Hospital Name': hospitals.find(h => h.id === d.hospital_id)?.name || 'Freelance / Unassigned',
                'Contact Number': d.phone_no || 'N/A',
                'Email': d.email,
                'Experience': d.experience ? `${d.experience} Years` : 'N/A',
                'Status': d.status || (activeTab === 'active' ? 'Active' : 'Pending')
            }));

            const success = exportToExcel({
                'Doctors': formatDoctors
            }, `SwasthyaSetu_Doctors_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

            if (!success) throw new Error('Excel generation failed');
        } catch (err) {
            console.error('Export Error:', err);
            alert('Failed to generate Excel report');
        } finally {
            setExporting(false);
        }
    };

    const filteredDoctors = doctors.filter(doc =>
        `${doc.first_name} ${doc.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-gradient animate-fade-in" style={{ padding: '4rem 1.5rem', flex: 1 }}>
            <UserPortfolioModal
                user={selectedDoctor}
                role="doctor"
                onClose={() => setSelectedDoctor(null)}
            />
            <div className="container">
                <header style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                    {/* Header content same */}
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', padding: '0.4rem 1rem', borderRadius: '2rem', marginBottom: '1.25rem', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <ShieldCheck size={14} /> Staff Management
                        </div>
                        <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem', fontWeight: '800' }}>Medical <span className="gradient-text">Doctors</span></h1>
                        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1.2rem' }}>List of all registered doctors in the system.</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <div style={{ display: 'flex', background: 'hsl(var(--muted)/0.5)', padding: '0.4rem', borderRadius: '1.25rem' }}>
                            <button
                                onClick={() => setActiveTab('active')}
                                style={{
                                    padding: '0.6rem 1.5rem',
                                    borderRadius: '1rem',
                                    fontWeight: '800',
                                    fontSize: '0.85rem',
                                    background: activeTab === 'active' ? 'white' : 'transparent',
                                    color: activeTab === 'active' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                    boxShadow: activeTab === 'active' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                Active Doctors
                            </button>
                            <button
                                onClick={() => setActiveTab('pending')}
                                style={{
                                    padding: '0.6rem 1.5rem',
                                    borderRadius: '1rem',
                                    fontWeight: '800',
                                    fontSize: '0.85rem',
                                    background: activeTab === 'pending' ? 'white' : 'transparent',
                                    color: activeTab === 'pending' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                    boxShadow: activeTab === 'pending' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                                    transition: 'all 0.3s ease',
                                    position: 'relative'
                                }}
                            >
                                Pending Requests
                                {pendingDoctors.length > 0 && activeTab !== 'pending' && (
                                    <span style={{ position: 'absolute', top: '-5px', right: '-5px', width: '20px', height: '20px', background: 'hsl(var(--primary))', color: 'white', borderRadius: '50%', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {pendingDoctors.length}
                                    </span>
                                )}
                            </button>
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
                                    placeholder={`Search ${activeTab === 'active' ? 'Doctor' : 'Applicant'}...`}
                                    className="input"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ paddingLeft: '3rem', width: '280px', height: '54px', borderRadius: '1.25rem' }}
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton" style={{ height: '280px', borderRadius: '2rem' }}></div>)}
                    </div>
                ) : activeTab === 'active' ? (
                    filteredDoctors.length === 0 ? (
                        <div className="card" style={{ padding: '6rem 2rem', textAlign: 'center' }}>
                            <div style={{ background: 'hsl(var(--muted))', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: 'hsl(var(--muted-foreground))' }}>
                                <Search size={40} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>No Active Doctors</h3>
                            <p style={{ color: 'hsl(var(--muted-foreground))' }}>Try searching for something else or add a new doctor.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>
                            {filteredDoctors.map(doc => (
                                <div key={doc.id} className="card animate-slide-up" style={{ padding: '0', overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
                                    <div style={{ padding: '2rem', borderBottom: '1px solid hsl(var(--border))', background: 'linear-gradient(135deg, hsl(var(--primary) / 0.05), transparent)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ position: 'relative' }}>
                                                <div style={{
                                                    width: '80px', height: '80px', borderRadius: '2rem',
                                                    background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
                                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '2rem', fontWeight: '900', boxShadow: '0 10px 20px hsl(var(--primary) / 0.2)',
                                                    overflow: 'hidden'
                                                }}>
                                                    {doc.profile_picture ? (
                                                        <img src={api.getMediaUrl(doc.profile_picture)} alt="Doctor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <>{doc.first_name?.[0]}{doc.last_name?.[0]}</>
                                                    )}
                                                </div>
                                                <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: 'white', padding: '4px', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                                    <div style={{ width: '12px', height: '12px', background: '#22c55e', borderRadius: '50%' }}></div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <select
                                                    className="input"
                                                    style={{ height: '40px', borderRadius: '0.75rem', fontSize: '0.8rem', padding: '0 1rem', width: '150px' }}
                                                    value={doc.hospital_id || ''}
                                                    onChange={(e) => handleAssignHospital(doc.id, e.target.value)}
                                                    disabled={assigningId === doc.id}
                                                >
                                                    <option value="">Unassigned</option>
                                                    {hospitals.map(h => (
                                                        <option key={h.id} value={h.id}>{h.name}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => setSelectedDoctor(doc)}
                                                    className="btn-icon"
                                                    style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
                                                    title="View Portfolio"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="btn-icon"
                                                    style={{ background: 'hsl(346, 77%, 49% / 0.1)', color: 'hsl(346, 77%, 49%)' }}
                                                    title="Delete Doctor"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ marginTop: '1.5rem' }}>
                                            <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Dr. {doc.first_name} {doc.last_name}</h3>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <p style={{ color: 'hsl(var(--primary))', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <Calendar size={14} /> Joined {new Date(doc.date_joined || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                </p>
                                                <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: '600' }}>ID: {doc.doctor_id || doc.internal_id || doc.id?.slice(-8).toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ padding: '1.5rem 2rem' }}>
                                        <div style={{ display: 'grid', gap: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: '500' }}>
                                                <div style={{ padding: '0.4rem', background: 'hsl(var(--muted))', borderRadius: '0.5rem' }}><Mail size={16} /></div>
                                                {doc.email}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: '500' }}>
                                                <div style={{ padding: '0.4rem', background: 'hsl(var(--muted))', borderRadius: '0.5rem' }}><Phone size={16} /></div>
                                                {doc.phone_no}
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dotted hsl(var(--border))' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    <div style={{ padding: '0.4rem 0.8rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>
                                                        {doc.medical_system || 'Allopathic'}
                                                    </div>
                                                    <div style={{ padding: '0.4rem 0.8rem', background: 'hsl(var(--secondary) / 0.1)', color: 'hsl(var(--secondary))', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>
                                                        {doc.specialization || 'General Practice'}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'hsl(var(--muted-foreground))' }}>
                                                    {hospitals.find(h => h.id === doc.hospital_id)?.name || 'Freelance Doctor'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    pendingDoctors.filter(doc => (doc.doctor_name || '').toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                        <div className="card" style={{ padding: '6rem 2rem', textAlign: 'center' }}>
                            <div style={{ background: 'hsl(var(--muted))', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: 'hsl(var(--muted-foreground))' }}>
                                <UserPlus size={40} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>No Pending Applications</h3>
                            <p style={{ color: 'hsl(var(--muted-foreground))' }}>No new doctor registrations.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
                            {pendingDoctors.filter(doc => (doc.doctor_name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(doc => (
                                <div key={doc.id} className="card animate-slide-up" style={{ padding: '0', overflow: 'hidden', border: '2px solid hsl(var(--primary) / 0.1)' }}>
                                    <div style={{ padding: '2rem', background: 'hsl(var(--primary) / 0.02)', borderBottom: '1px solid hsl(var(--border))' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '48px', height: '48px', borderRadius: '1rem', background: 'hsl(var(--primary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>
                                                    {doc.doctor_name?.[0]}
                                                </div>
                                                <div>
                                                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>{doc.doctor_name}</h3>
                                                    <p style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', fontWeight: '600' }}>Registered on {new Date(doc.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <div style={{ padding: '0.4rem 0.8rem', background: 'hsl(45, 100%, 96%)', color: 'hsl(45, 93%, 47%)', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase' }}>
                                                    PENDING
                                                </div>
                                                <button
                                                    onClick={() => setSelectedDoctor({
                                                        ...doc,
                                                        first_name: doc.doctor_name.split(' ')[0],
                                                        last_name: doc.doctor_name.split(' ').slice(1).join(' ')
                                                    })}
                                                    className="btn-icon"
                                                    style={{ background: 'white', color: 'hsl(var(--primary))', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                                                    title="View Full Profile"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div className="mini-card" style={{ padding: '0.8rem', background: 'white', borderRadius: '1rem', border: '1px solid hsl(var(--border))' }}>
                                                <div style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem' }}>System / Specialization</div>
                                                <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>{doc.medical_system || 'Allopathic'} • {doc.specialization}</div>
                                            </div>
                                            <div className="mini-card" style={{ padding: '0.8rem', background: 'white', borderRadius: '1rem', border: '1px solid hsl(var(--border))' }}>
                                                <div style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Experience</div>
                                                <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>{doc.experience} Years</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ padding: '1.5rem 2rem' }}>
                                        <div style={{ marginBottom: '1.5rem', display: 'grid', gap: '0.75rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))' }}>
                                                <Mail size={16} /> {doc.email}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))' }}>
                                                <ShieldAlert size={16} /> License: {doc.license_no}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <button
                                                onClick={() => handleRegistrationAction(doc.id, 'approve')}
                                                className="btn btn-primary"
                                                style={{ flex: 1, height: '48px', borderRadius: '1rem', gap: '0.5rem' }}
                                            >
                                                <Check size={18} /> Approve
                                            </button>
                                            <button
                                                onClick={() => handleRegistrationAction(doc.id, 'reject')}
                                                className="btn btn-outline"
                                                style={{ flex: 1, height: '48px', borderRadius: '1rem', gap: '0.5rem', color: 'hsl(346, 77%, 49%)', borderColor: 'hsl(346, 77%, 49% / 0.3)' }}
                                            >
                                                <X size={18} /> Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default AdminDoctors;
