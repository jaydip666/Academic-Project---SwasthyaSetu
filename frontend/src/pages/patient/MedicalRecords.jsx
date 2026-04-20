import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useLocation } from 'react-router-dom';
import { FileText, Search, User, Download, Eye, Shield, FolderOpen, ChevronRight, HardDrive, Clock, ExternalLink, Calendar, PlusCircle, X, Send, Database, Zap } from 'lucide-react';

const MedicalRecords = () => {
    const location = useLocation();
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadForm, setUploadForm] = useState({ type: '', file: null });
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const initialize = async () => {
            const fetchedDoctors = await fetchAssignedDoctors();

            // Check for pre-selected doctor
            if (location.state?.doctorId) {
                const preSelected = fetchedDoctors.find(d => d.id === location.state.doctorId);
                if (preSelected) {
                    setSelectedDoctor(preSelected);
                }
            }
        };
        initialize();
    }, [location]);

    // Re-fetch files whenever selected doctor changes (filtering)
    useEffect(() => {
        fetchPatientFiles();
    }, [selectedDoctor]);


    const fetchAssignedDoctors = async () => {
        try {
            const response = await api.get('/appointments/');
            const appointmentList = Array.isArray(response) ? response : (response.appointments || []);
            const uniqueDoctors = {};
            appointmentList.forEach(apt => {
                if (!uniqueDoctors[apt.doctor_id]) {
                    uniqueDoctors[apt.doctor_id] = {
                        id: apt.doctor_id,
                        name: apt.doctor_name,
                        specialization: apt.doctor_specialization || 'Clinical Specialist'
                    };
                }
            });
            const doctorArray = Object.values(uniqueDoctors);
            setDoctors(doctorArray);
            return doctorArray;
        } catch (error) {
            console.error("Failed to fetch doctors", error);
            return [];
        }
    };

    const fetchPatientFiles = async () => {
        setLoading(true);
        setError(null);
        try {
            const url = selectedDoctor ? `/media/list?doctor_id=${selectedDoctor.id}` : '/media/list';
            const data = await api.get(url);
            setFiles(data);
        } catch (error) {
            console.error(error);
            setError(error.message || 'Error connecting to server.');
        } finally {
            setLoading(false);
        }
    };


    const handleSelectDoctor = (doctor) => {
        setSelectedDoctor(doctor);
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!uploadForm.file) return alert('Please select a file to upload');
        if (!uploadForm.type) return alert('Please specify report type');

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', uploadForm.file);
            formData.append('description', uploadForm.type);
            if (selectedDoctor) {
                formData.append('doctor_id', selectedDoctor.id);
            }

            await api.uploadFile('/media/upload', formData);

            // If a doctor is selected, notify them
            if (selectedDoctor) {
                try {
                    await api.post('/notifications/', {
                        user_id: selectedDoctor.id,
                        notification_type: 'report_uploaded',
                        title: 'New Medical Report',
                        message: `A new ${uploadForm.type} has been uploaded to your account by the patient.`
                    });
                } catch (notifErr) {
                    console.error("Notification failed", notifErr);
                }
            }

            alert('Report uploaded successfully!');
            setShowUploadModal(false);
            setUploadForm({ type: '', file: null });
            fetchPatientFiles();
        } catch (error) {
            alert('Failed to upload report: ' + (error.message || 'Unknown error'));
        } finally {
            setUploading(false);
        }
    };

    const filteredDoctors = doctors.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getFileUrl = (filePath) => api.getMediaUrl(`/media/${filePath}`);

    return (
        <div className="dashboard-page bg-gradient animate-fade-in">
            <div className="container dashboard-grid" style={{ flex: 1, alignItems: 'start' }}>

            {/* Doctor List */}
            <div className="glass-panel animate-slide-up dashboard-sidebar" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0', background: 'white', minHeight: '600px' }}>

                <div style={{ padding: '2.5rem', borderBottom: '1px solid hsl(var(--border))', background: 'linear-gradient(to bottom, hsl(var(--primary) / 0.03), transparent)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'hsl(var(--primary))', marginBottom: '1.5rem', fontWeight: '800', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Shield size={18} /> My Doctors
                    </div>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1.5rem' }}>Doctor <span className="gradient-text">List</span></h3>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                        <input
                            type="text"
                            className="input"
                            placeholder="Search doctors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '3.5rem', borderRadius: '1.25rem', height: '54px' }}
                        />
                    </div>
                </div>

                <div style={{ overflowY: 'auto', flex: 1, padding: '1.5rem' }}>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {/* All Records Option */}
                        <div
                            onClick={() => setSelectedDoctor(null)}
                            style={{
                                padding: '1.5rem',
                                borderRadius: '1.25rem',
                                cursor: 'pointer',
                                background: !selectedDoctor ? 'hsl(var(--primary) / 0.08)' : 'white',
                                border: !selectedDoctor ? '1px solid hsl(var(--primary) / 0.2)' : '1px solid hsl(var(--border))',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}
                        >
                            <Database size={20} color={!selectedDoctor ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'} />
                            <div style={{ fontWeight: '800', color: !selectedDoctor ? 'hsl(var(--primary))' : 'inherit' }}>All my Records</div>
                        </div>

                        {filteredDoctors.map(doc => (
                            <div
                                key={doc.id}
                                onClick={() => handleSelectDoctor(doc)}
                                style={{
                                    padding: '1.5rem',
                                    borderRadius: '1.25rem',
                                    cursor: 'pointer',
                                    background: selectedDoctor?.id === doc.id ? 'hsl(var(--primary) / 0.08)' : 'white',
                                    border: selectedDoctor?.id === doc.id ? '1px solid hsl(var(--primary) / 0.2)' : '1px solid hsl(var(--border))',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '1rem',
                                        background: selectedDoctor?.id === doc.id ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                                        color: selectedDoctor?.id === doc.id ? 'white' : 'hsl(var(--muted-foreground))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: '800', transition: 'all 0.3s'
                                    }}>
                                        {doc.name[0]}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '800', color: selectedDoctor?.id === doc.id ? 'hsl(var(--primary))' : 'inherit' }}>Dr. {doc.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: '600' }}>{doc.specialization}</div>
                                    </div>
                                </div>
                                <ChevronRight size={18} style={{ opacity: selectedDoctor?.id === doc.id ? 1 : 0.3 }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Records Area */}
            <div className="glass-panel animate-slide-up dashboard-main" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'white', minHeight: '600px' }}>
                <div style={{ padding: '3rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, hsl(var(--secondary) / 0.05), transparent)' }}>

                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'hsl(var(--secondary))', marginBottom: '1rem', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                            <FolderOpen size={16} /> Medical History
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800' }}>My <span className="gradient-text">Reports</span></h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <User size={16} color="hsl(var(--primary))" />
                            <span style={{ fontWeight: '700', color: 'hsl(var(--muted-foreground))' }}>
                                {selectedDoctor ? `Sharing with Dr. ${selectedDoctor.name}` : 'All my health records'}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="btn btn-primary"
                        style={{ borderRadius: '1rem', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
                    >
                        <PlusCircle size={20} />
                        Upload Report
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '3rem' }}>
                    {loading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '240px', borderRadius: '1.5rem' }}></div>)}
                        </div>
                    ) : error ? (
                        <div style={{ padding: '6rem 2rem', textAlign: 'center', background: 'hsl(346, 77%, 96%)', color: 'hsl(346, 77%, 49%)', borderRadius: '2rem', border: '1px solid hsl(346, 77%, 90%)' }}>
                            <Shield size={48} style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Access Restricted</h3>
                            <p style={{ fontWeight: '600' }}>{error}</p>
                        </div>
                    ) : files.length === 0 ? (
                        <div style={{ padding: '6rem 2rem', textAlign: 'center', background: 'hsl(var(--muted) / 0.1)', borderRadius: '2rem' }}>
                            <Clock size={48} style={{ opacity: 0.1, marginBottom: '2rem' }} />
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>No Reports Yet</h3>
                            <p style={{ color: 'hsl(var(--muted-foreground))', fontWeight: '500' }}>You haven't uploaded any medical reports yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                            {files.map(file => (
                                <div key={file.id} className="card animate-scale-in" style={{ padding: '0', overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
                                    <div style={{ padding: '2.5rem', background: 'hsl(var(--primary) / 0.03)', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                                        <div style={{ padding: '1.25rem', background: 'white', borderRadius: '1.25rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                                            <FileText size={48} color="hsl(var(--primary))" />
                                        </div>
                                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', opacity: 0.3 }}>
                                            <Zap size={16} />
                                        </div>
                                    </div>
                                    <div style={{ padding: '2rem' }}>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {file.description || file.file_name}
                                        </h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', fontWeight: '600', marginBottom: '2rem' }}>
                                            <Calendar size={14} />
                                            {new Date(file.uploaded_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                        <a
                                            href={getFileUrl(file.file_path)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-primary"
                                            style={{ width: '100%', height: '48px', borderRadius: '1rem', fontWeight: '800', fontSize: '0.85rem', gap: '0.75rem' }}
                                        >
                                            <Download size={18} /> Download Report
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Sync Modal */}
            {showUploadModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel animate-scale-in" style={{ width: '500px', padding: '2.5rem', background: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Upload <span className="gradient-text">Report</span></h3>
                            <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--muted-foreground))', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleUploadSubmit}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '700', fontSize: '0.9rem' }}>Report Type</label>
                                <select
                                    className="input"
                                    value={uploadForm.type}
                                    onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                                    style={{ width: '100%', height: '54px', borderRadius: '1rem', appearance: 'auto', paddingRight: '1rem' }}
                                    required
                                >
                                    <option value="">Select report type...</option>
                                    <option value="Blood Report">Blood Report</option>
                                    <option value="Urine Report">Urine Report</option>
                                    <option value="X-Ray Scan">X-Ray Scan</option>
                                    <option value="MRI Scan">MRI Scan</option>
                                    <option value="CT Scan">CT Scan</option>
                                    <option value="ECG/EKG">ECG/EKG</option>
                                    <option value="Biopsy Report">Biopsy Report</option>
                                    <option value="General Health Report">General Health Report</option>
                                    <option value="Discharge Summary">Discharge Summary</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '700', fontSize: '0.9rem' }}>Select Document</label>
                                <div
                                    onClick={() => fileInputRef.current.click()}
                                    style={{
                                        width: '100%',
                                        padding: '2rem',
                                        border: '2px dashed hsl(var(--border))',
                                        borderRadius: '1rem',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        background: 'hsl(var(--muted) / 0.1)',
                                        transition: 'var(--transition)'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'hsl(var(--primary))'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'hsl(var(--border))'}
                                >
                                    <Upload size={32} color="hsl(var(--primary))" style={{ marginBottom: '1rem' }} />
                                    <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{uploadForm.file ? uploadForm.file.name : 'Click to select medical file'}</p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    hidden
                                    onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={uploading}
                                style={{ width: '100%', height: '54px', borderRadius: '1.25rem', fontWeight: '800', gap: '0.75rem' }}
                            >
                                {uploading ? 'Uploading...' : (
                                    <>
                                        <Send size={18} />
                                        Upload Now
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};


export default MedicalRecords;
function Upload(props) {
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    );
}
