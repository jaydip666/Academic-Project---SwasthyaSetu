// ================= FRONTEND FILE =================
// File: AdminDashboard.jsx
// Purpose: High-level administrative command center
// Handles: Platform statistics, hospital management (CRUD), and system-wide overview

import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Users, UserPlus, Calendar, Activity, Building, Trash2, Plus, Zap, Shield, Cpu, Bell, ExternalLink, MoreVertical, Check, Edit3, CreditCard, Search, TrendingUp } from 'lucide-react';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddHospital, setShowAddHospital] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [hospitalForm, setHospitalForm] = useState({ name: '', location: '', address: '', contact: '', image_url: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const getMediaUrl = api.getMediaUrl;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsData, hospitalsData] = await Promise.all([
                api.get('/admin/stats/'),
                api.get('/admin/hospitals/')
            ]);
            setStats(statsData);
            setHospitals(hospitalsData);
        } catch (error) {
            console.error("Failed to fetch admin data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleAddHospital = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let finalImageUrl = hospitalForm.image_url;

            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                const uploadRes = await api.uploadFile('/media/hospital-upload/', formData);
                finalImageUrl = uploadRes.path;
            }

            if (isEditing) {
                await api.put(`/admin/hospitals/${editingId}/`, {
                    ...hospitalForm,
                    image_url: finalImageUrl
                });
                alert('Hospital Profile Updated!');
            } else {
                await api.post('/admin/hospitals/', {
                    ...hospitalForm,
                    image_url: finalImageUrl
                });
                alert('Hospital Successfully Enrolled!');
            }

            setShowAddHospital(false);
            setHospitalForm({ name: '', location: '', address: '', contact: '', image_url: '' });
            setSelectedFile(null);
            setPreviewUrl(null);
            setIsEditing(false);
            setEditingId(null);
            fetchData();
        } catch (error) {
            alert(error.message || 'Enrolment Failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (hospital) => {
        setHospitalForm({
            name: hospital.name,
            location: hospital.location,
            address: hospital.address || '',
            contact: hospital.contact || '',
            image_url: hospital.image_url || ''
        });
        setEditingId(hospital.id);
        setIsEditing(true);
        setPreviewUrl(getMediaUrl(hospital.image_url));
        setShowAddHospital(true);
    };

    const handleDeleteHospital = async (id) => {
        const confirmTerm = window.confirm("Delete this hospital from the system?");
        if (!confirmTerm) return;
        try {
            await api.delete(`/admin/hospitals/${id}/delete/`);
            fetchData();
        } catch (error) {
            alert('Delete Failed.');
        }
    };


    return (
        <div className="dashboard-page bg-gradient animate-fade-in">
            <div className="container">
                <header className="dashboard-header-simple">
                    <div className="header-badge">
                        <Activity size={12} strokeWidth={3} /> Admin Control
                    </div>
                    <h1 className="header-title-main">Platform <span className="gradient-text">Analytics</span></h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'hsl(var(--primary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.9rem' }}>
                            {user?.first_name?.[0] || 'A'}
                        </div>
                        <p className="dr-subtitle" style={{ margin: 0 }}>Welcome back, <span style={{ fontWeight: 800, color: 'hsl(var(--primary))' }}>{user?.first_name || 'Administrator'}</span></p>
                    </div>
                </header>

                {loading ? (
                    <div className="skeleton-stat-grid">
                        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-stat-card"></div>)}
                    </div>
                ) : (
                    <>
                        {/* Matrix Stats */}
                        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            <StatCard label="Total Patients" value={stats.total_patients} icon={<TrendingUp size={28} />} color="hsl(var(--secondary))" trend="Active on Platform" />
                            <StatCard
                                label="Active Bookings"
                                value={stats?.appointments}
                                icon={<Calendar size={28} />}
                                color="hsl(45, 93%, 47%)"
                            />
                            <StatCard label="Total Doctors" value={stats.total_doctors} icon={<Activity size={28} />} color="hsl(142, 70%, 45%)" trend="Verified Professional Index" />
                        </div>

                        {/* Control Interface */}
                        <div className="admin-enrolment-wrapper" style={{ width: '100%' }}>
                            <div className="card admin-enrolment-card" style={{ width: '100%', maxWidth: '100%' }}>
                                <div className="card-header-flex" style={{ flexWrap: 'wrap', gap: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flex: 1, flexWrap: 'wrap' }}>
                                        <h2 className="widget-title" style={{ margin: 0 }}>Hospital Enrolment</h2>
                                        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                                            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))', opacity: 0.6 }} size={18} />
                                            <input
                                                className="input"
                                                placeholder="Search hospitals by name or location..."
                                                style={{ paddingLeft: '3rem', height: '48px', borderRadius: '1rem', width: '100%', fontSize: '0.9rem' }}
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddHospital(true)}>
                                        <Plus size={18} /> Add Hospital
                                    </button>
                                </div>

                                <div className="table-wrapper-responsive">
                                    <table className="admin-custom-table">
                                        <thead>
                                            <tr>
                                                <th>Hospital Name</th>
                                                <th>Location</th>
                                                <th className="hide-on-mobile">Contact</th>
                                                <th style={{ textAlign: 'right' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {hospitals.filter(h =>
                                                h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                h.location.toLowerCase().includes(searchTerm.toLowerCase())
                                            ).map(hospital => (
                                                <tr key={hospital.id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <div className="admin-table-img">
                                                                {hospital.image_url ? (
                                                                    <img src={getMediaUrl(hospital.image_url)} alt="" />
                                                                ) : (
                                                                    <Building size={20} />
                                                                )}
                                                            </div>
                                                            <span style={{ fontWeight: '600' }}>{hospital.name}</span>
                                                        </div>
                                                    </td>
                                                    <td>{hospital.location}</td>
                                                    <td className="hide-on-mobile">{hospital.contact}</td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <div className="action-btns">
                                                            <button className="btn-icon" onClick={() => handleEditClick(hospital)}><Edit3 size={18} /></button>
                                                            <button className="btn-icon text-danger" onClick={() => handleDeleteHospital(hospital.id)}><Trash2 size={18} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Enrolment Interface Modal */}
            <Modal
                isOpen={showAddHospital}
                onClose={() => {
                    setShowAddHospital(false);
                    setIsEditing(false);
                    setHospitalForm({ name: '', location: '', address: '', contact: '', image_url: '' });
                    setPreviewUrl(null);
                }}
                title={isEditing ? "Update Hospital" : "Add New Hospital"}
                subtitle={isEditing ? "Update hospital details." : "Add a new hospital to the system."}
                maxWidth="500px"
            >
                <form onSubmit={handleAddHospital} style={{ display: 'grid', gap: '1.5rem' }}>
                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: '800' }}>Hospital Name</label>
                        <input className="input" required style={{ height: '54px', borderRadius: '1.25rem' }} value={hospitalForm.name} onChange={e => setHospitalForm({ ...hospitalForm, name: e.target.value })} placeholder="e.g. Apex Central Shard" />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: '800' }}>Location</label>
                        <input className="input" required style={{ height: '54px', borderRadius: '1.25rem' }} value={hospitalForm.location} onChange={e => setHospitalForm({ ...hospitalForm, location: e.target.value })} placeholder="City / Region" />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: '800' }}>Address</label>
                        <input className="input" style={{ height: '54px', borderRadius: '1.25rem' }} value={hospitalForm.address} onChange={e => setHospitalForm({ ...hospitalForm, address: e.target.value })} placeholder="Full physical coordinates" />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: '800' }}>Contact</label>
                        <input className="input" style={{ height: '54px', borderRadius: '1.25rem' }} value={hospitalForm.contact} onChange={e => setHospitalForm({ ...hospitalForm, contact: e.target.value })} placeholder="+123 456 7890" />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: '800' }}>Hospital Hero Image</label>
                        <div
                            style={{
                                border: '2px dashed hsl(var(--border))',
                                borderRadius: '1.25rem',
                                padding: '1.5rem',
                                textAlign: 'center',
                                background: 'hsl(var(--muted) / 0.2)',
                                cursor: 'pointer',
                                transition: 'var(--transition)'
                            }}
                            onClick={() => document.getElementById('dashboard-hospital-image-input').click()}
                        >
                            <input
                                id="dashboard-hospital-image-input"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                            {previewUrl ? (
                                <div style={{ position: 'relative' }}>
                                    <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '1rem' }} />
                                    <div style={{ position: 'absolute', top: '0', right: '0', padding: '0.5rem' }}>
                                        <span style={{ background: 'white', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.7rem', fontWeight: '800', boxShadow: 'var(--shadow-sm)' }}>Change File</span>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ color: 'hsl(var(--muted-foreground))' }}>
                                    <Plus size={32} style={{ margin: '0 auto 0.5rem' }} />
                                    <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>Click to upload facility imagery</p>
                                    <p style={{ fontSize: '0.75rem' }}>PNG, JPG or WebP (Max 5MB)</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1.5rem' }}>
                        <button type="button" className="btn btn-outline" onClick={() => { setShowAddHospital(false); setPreviewUrl(null); setSelectedFile(null); setIsEditing(false); }} style={{ flex: 1, height: '54px', borderRadius: '1.25rem', fontWeight: '800' }}>Discard</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 1, height: '54px', borderRadius: '1.25rem', fontWeight: '800', gap: '0.5rem' }}>
                            {submitting ? 'Syncing...' : <>{isEditing ? <Check size={18} /> : <Check size={18} />} {isEditing ? 'Update Hospital' : 'Add Hospital'}</>}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

const StatCard = ({ label, value, icon, color, subValue }) => (
    <div className="card" style={{
        padding: '2.5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        borderLeft: `8px solid ${color}`,
        transition: 'var(--transition)',
        boxShadow: 'var(--shadow-md)'
    }}>
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
            <div style={{
                width: '64px', height: '64px', borderRadius: '1.25rem',
                background: `${color}10`, color: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)'
            }}>
                {icon}
            </div>
        </div>
        <div>
            <h3 style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1', marginBottom: '0.75rem' }}>{value}</h3>
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        </div>
        {subValue && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: color, fontWeight: '700', background: `${color}08`, padding: '0.5rem 0.75rem', borderRadius: '0.75rem', width: 'fit-content' }}>
                <Zap size={14} fill={color} /> {subValue}
            </div>
        )}
    </div>
);

const ActivityItem = ({ text, time, type }) => {
    const typeColor = type === 'success' ? '#22c55e' : type === 'caution' ? 'hsl(45, 93%, 47%)' : 'hsl(var(--primary))';
    return (
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'start', padding: '1.25rem', borderBottom: '1px solid hsl(var(--border))', borderRadius: '1rem', transition: 'var(--transition)' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: typeColor, marginTop: '0.4rem', flexShrink: 0, boxShadow: `0 0 10px ${typeColor}60` }}></div>
            <div style={{ flex: 1 }}>
                <p style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.25rem', color: 'hsl(var(--foreground))' }}>{text}</p>
                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', fontWeight: '500' }}>{time}</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
