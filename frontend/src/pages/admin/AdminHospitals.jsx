import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Building, Trash2, Plus, MapPin, Phone, Shield, Zap, Globe, Cpu, X, Check, Eye, Edit3, FileSpreadsheet, Activity, Search } from 'lucide-react';
import Modal from '../../components/Modal';
import HospitalPortfolioModal from '../../components/admin/HospitalPortfolioModal';
import { exportToExcel } from '../../utils/excelExport';

const AdminHospitals = () => {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddHospital, setShowAddHospital] = useState(false);
    const [hospitalForm, setHospitalForm] = useState({ name: '', location: '', address: '', contact: '', image_url: '' });
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const getMediaUrl = api.getMediaUrl;

    useEffect(() => {
        fetchHospitals();
    }, []);

    const fetchHospitals = async () => {
        try {
            const data = await api.get('/admin/hospitals/');
            setHospitals(data);
        } catch (err) {
            console.error("Failed to fetch hospitals", err);
        } finally {
            setLoading(false);
        }
    };

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [submitting, setSubmitting] = useState(false);

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

            // 1. Upload file if selected
            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                const uploadRes = await api.uploadFile('/media/hospital-upload/', formData);
                finalImageUrl = uploadRes.path;
            }

            // 2. Add or Update hospital
            if (isEditing) {
                await api.put(`/admin/hospitals/${editingId}/`, {
                    ...hospitalForm,
                    image_url: finalImageUrl
                });
                alert('Infrastructure parameters updated');
            } else {
                await api.post('/admin/hospitals/', {
                    ...hospitalForm,
                    image_url: finalImageUrl
                });
                alert('New node deployed successfully');
            }

            setShowAddHospital(false);
            setHospitalForm({ name: '', location: '', address: '', contact: '', image_url: '' });
            setSelectedFile(null);
            setPreviewUrl(null);
            setIsEditing(false);
            setEditingId(null);
            fetchHospitals();
        } catch (err) {
            alert(err.message || 'Infrastructure deployment failed');
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
        if (!confirm('Hospital deleted')) return;
        try {
            await api.delete(`/admin/hospitals/${id}/delete/`);
            fetchHospitals();
        } catch (err) {
            console.error('Decommissioning sequence failed', err);
            alert('Decommissioning sequence failed');
        }
    };

    const handleExportExcel = async () => {
        setExporting(true);
        try {
            const formatHospitals = hospitals.map(h => ({
                'Hospital ID': String(h.hospital_id || h.internal_id || h.id),
                'Hospital Name': h.name,
                'Address': h.address || 'N/A',
                'City': h.location || 'N/A',
                'Contact Number': h.contact || 'N/A',
                'Email': h.email || 'N/A',
                'Status': h.status || 'Live'
            }));

            const success = exportToExcel({
                'Hospitals': formatHospitals
            }, `SwasthyaSetu_Hospitals_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

            if (!success) throw new Error('Excel generation failed');
        } catch (err) {
            console.error('Export Error:', err);
            alert('Failed to generate Excel report');
        } finally {
            setExporting(false);
        }
    };

    const filteredHospitals = hospitals.filter(h =>
        h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-gradient animate-fade-in" style={{ padding: '4rem 1.5rem', flex: 1 }}>
            <HospitalPortfolioModal
                hospital={selectedHospital}
                onClose={() => setSelectedHospital(null)}
            />
            <div className="container">
                <header style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', padding: '0.4rem 1rem', borderRadius: '2rem', marginBottom: '1.25rem', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Shield size={14} /> Network Architecture
                        </div>
                        <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem', fontWeight: '800' }}>Hospitals <span className="gradient-text"></span></h1>
                        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1.2rem' }}>Configure and monitor physical healthcare access points.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', width: '320px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                            <input
                                type="text"
                                placeholder="Search hospitals by name, city..."
                                className="input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '3rem', width: '100%', height: '54px', borderRadius: '1.25rem' }}
                            />
                        </div>
                        <button
                            className="btn btn-outline"
                            onClick={handleExportExcel}
                            disabled={exporting || loading}
                            style={{ height: '54px', padding: '0 1.5rem', borderRadius: '1.25rem', gap: '0.5rem', fontWeight: '800', border: '2px solid hsl(var(--primary) / 0.5)', color: 'hsl(var(--primary))' }}
                        >
                            {exporting ? <Activity size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
                            {exporting ? 'Export Excel' : 'Export Excel'}
                        </button>
                        <button className="btn btn-primary" onClick={() => setShowAddHospital(true)} style={{ height: '54px', padding: '0 2rem', borderRadius: '1.25rem', fontWeight: '800' }}>
                            <Plus size={20} />Add Hospital
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2rem' }}>
                        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '320px', borderRadius: '2rem' }}></div>)}
                    </div>
                ) : filteredHospitals.length === 0 ? (
                    <div className="card" style={{ padding: '8rem 2rem', textAlign: 'center' }}>
                        <div style={{ background: 'hsl(var(--muted))', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem', color: 'hsl(var(--muted-foreground))' }}>
                            <Building size={48} />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }}>No Matches Found</h2>
                        <p style={{ color: 'hsl(var(--muted-foreground))', maxWidth: '500px', margin: '0 auto' }}>Adjust your search parameters or check the medical directory for active facilities.</p>
                    </div>
                ) : (
                    <div className="hospital-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
                        gap: '2.5rem'
                    }}>
                        {filteredHospitals.map(hospital => (
                            <div key={hospital.id} className="card animate-scale-in" style={{ padding: '0', overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
                                <div style={{ padding: '2.5rem', borderBottom: '1px solid hsl(var(--border))', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ width: '60px', height: '60px', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: '0 12px 24px hsl(var(--primary) / 0.25)' }}>
                                            {hospital.image_url ? (
                                                <img src={getMediaUrl(hospital.image_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', background: 'hsl(var(--primary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Building size={32} />
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <div style={{ padding: '0.4rem 0.8rem', background: 'hsl(142, 70%, 45% / 0.1)', color: 'hsl(142, 70%, 45%)', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Zap size={12} /> Live
                                            </div>
                                            <button
                                                onClick={() => setSelectedHospital(hospital)}
                                                className="btn-icon"
                                                style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
                                                title="View Portfolio"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleEditClick(hospital)}
                                                className="btn-icon"
                                                style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}
                                                title="Edit Protocol"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteHospital(hospital.id)}
                                                className="btn-icon"
                                                style={{ background: 'hsl(346, 77%, 49% / 0.1)', color: 'hsl(346, 77%, 49%)' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '1.5rem' }}>{hospital.name}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.5rem', fontWeight: '500' }}>
                                        <MapPin size={16} color="hsl(var(--primary))" /> {hospital.location}
                                    </div>
                                </div>

                                <div style={{ padding: '2rem 2.5rem', background: 'hsl(var(--muted) / 0.2)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '800', color: 'hsl(var(--muted-foreground))', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Facility Address</div>
                                            <p style={{ fontSize: '0.9rem', fontWeight: '600', lineHeight: '1.4' }}>{hospital.address || 'Standard Protocol'}</p>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '800', color: 'hsl(var(--muted-foreground))', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Emergency Sync</div>
                                            <p style={{ fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Phone size={14} color="hsl(var(--secondary))" /> {hospital.contact || '+1-NOD-SYNC'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '1.5rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Globe size={18} style={{ color: 'hsl(var(--primary))' }} />
                                        <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>Regional Hub: {hospital.location?.split(' ')[0]}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Premium Deployment Modal */}
            <Modal
                isOpen={showAddHospital}
                onClose={() => {
                    setShowAddHospital(false);
                    setIsEditing(false);
                    setHospitalForm({ name: '', location: '', address: '', contact: '', image_url: '' });
                    setPreviewUrl(null);
                }}
                title={isEditing ? "Protocol Modification" : "Node Deployment"}
                subtitle={isEditing ? "Update existing regional node parameters." : "Initialize a new facility on the network."}
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
                            onClick={() => document.getElementById('hospital-image-input').click()}
                        >
                            <input
                                id="hospital-image-input"
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
                            {submitting ? 'Processing...' : <>{isEditing ? <Check size={18} /> : <Plus size={18} />} {isEditing ? 'Update Hospital' : 'Deploy Hospital'}</>}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AdminHospitals;
