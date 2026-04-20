import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useLocation } from 'react-router-dom';
import { FileText, Search, User, Download, Eye, Shield, FolderOpen, ChevronRight, HardDrive, Clock, ExternalLink, Calendar, PlusCircle, X, Send } from 'lucide-react';

const DoctorRecords = () => {
    const location = useLocation();
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestForm, setRequestForm] = useState({ type: '', message: '' });
    const [requesting, setRequesting] = useState(false);

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadForm, setUploadForm] = useState({ type: '', file: null });
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!uploadForm.file) return alert('Please select a file to upload');
        if (!uploadForm.type) return alert('Please specify report type');

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', uploadForm.file);
            formData.append('description', uploadForm.type);
            formData.append('patient_id', selectedPatient.id);

            await api.uploadFile('/media/upload', formData);

            alert('Report uploaded successfully.');
            setShowUploadModal(false);
            setUploadForm({ type: '', file: null });
            fetchPatientFiles(selectedPatient.id);
        } catch (error) {
            alert('Failed to upload report: ' + (error.message || 'Unknown error'));
        } finally {
            setUploading(false);
        }
    };



    useEffect(() => {
        const initialize = async () => {
            const fetchedPatients = await fetchRecentPatients();

            // Check for pre-selected patient from dashboard/directory
            if (location.state?.patientId) {
                const preSelected = fetchedPatients.find(p => p.id === location.state.patientId);
                if (preSelected) {
                    setSelectedPatient(preSelected);
                    fetchPatientFiles(preSelected.id);
                } else if (location.state.patientName) {
                    // Fallback if patient not in initial list but name is provided
                    const dummy = { id: location.state.patientId, name: location.state.patientName };
                    setSelectedPatient(dummy);
                    fetchPatientFiles(dummy.id);
                }
            }
        };
        initialize();
    }, [location]);

    const fetchRecentPatients = async () => {
        try {
            const response = await api.get('/appointments/');
            const appointmentList = Array.isArray(response) ? response : (response.appointments || []);
            const uniquePatients = {};
            appointmentList.forEach(apt => {
                if (!uniquePatients[apt.patient_id]) {
                    uniquePatients[apt.patient_id] = {
                        id: apt.patient_id,
                        name: apt.patient_name,
                        last_visit: apt.appointment_date
                    };
                }
            });
            const patientArray = Object.values(uniquePatients);
            setPatients(patientArray);
            return patientArray;
        } catch (error) {
            console.error("Failed to fetch patients", error);
            return [];
        }
    };

    const fetchPatientFiles = async (patientId) => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.get(`/media/patient-files?patient_id=${patientId}`);
            setFiles(data);
        } catch (error) {
            console.error(error);
            setError(error.message || 'Connection error.');
            setFiles([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPatient = (patient) => {
        setSelectedPatient(patient);
        fetchPatientFiles(patient.id);
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        if (!requestForm.type) return alert('Please select a report type');

        setRequesting(true);
        try {
            await api.post('/reports/request/', {
                patient_id: selectedPatient.id,
                report_type: requestForm.type,
                message: requestForm.message
            });
            alert('Request sent successfully!');
            setShowRequestModal(false);
            setRequestForm({ type: '', message: '' });
        } catch (error) {
            alert('Failed to send request: ' + (error.message || 'Unknown error'));
        } finally {
            setRequesting(false);
        }
    };

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.includes(searchTerm)
    );

    return (
        <div className="dashboard-page bg-gradient animate-fade-in">
            <div className="container dashboard-grid" style={{ flex: 1, alignItems: 'start' }}>

            {/* Terminal: Secure Registry */}
            <div className="glass-panel animate-slide-up dashboard-sidebar" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0', background: 'white', minHeight: '600px' }}>

                <div style={{ padding: '2.5rem', borderBottom: '1px solid hsl(var(--border))', background: 'linear-gradient(to bottom, hsl(var(--primary) / 0.03), transparent)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'hsl(var(--primary))', marginBottom: '1.5rem', fontWeight: '800', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Shield size={18} /> Patient Registry
                    </div>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1.5rem' }}>Patient <span className="gradient-text">List</span></h3>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                        <input
                            type="text"
                            className="input"
                            placeholder="Search by name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '3.5rem', borderRadius: '1.25rem', height: '54px' }}
                        />
                    </div>
                </div>

                <div style={{ overflowY: 'auto', flex: 1, padding: '1.5rem' }}>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {filteredPatients.map(patient => (
                            <div
                                key={patient.id}
                                onClick={() => handleSelectPatient(patient)}
                                style={{
                                    padding: '1.5rem',
                                    borderRadius: '1.25rem',
                                    cursor: 'pointer',
                                    background: selectedPatient?.id === patient.id ? 'hsl(var(--primary) / 0.08)' : 'white',
                                    border: selectedPatient?.id === patient.id ? '1px solid hsl(var(--primary) / 0.2)' : '1px solid hsl(var(--border))',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '1rem',
                                        background: selectedPatient?.id === patient.id ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                                        color: selectedPatient?.id === patient.id ? 'white' : 'hsl(var(--muted-foreground))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: '800', transition: 'all 0.3s'
                                    }}>
                                        {patient.name[0]}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '800', color: selectedPatient?.id === patient.id ? 'hsl(var(--primary))' : 'inherit' }}>{patient.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: '600' }}>#{patient.id.slice(-8).toUpperCase()}</div>
                                    </div>
                                </div>
                                <ChevronRight size={18} style={{ opacity: selectedPatient?.id === patient.id ? 1 : 0.3 }} />
                            </div>
                        ))}
                    </div>
                    {filteredPatients.length === 0 && (
                        <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                            <Search size={32} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                            <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>No patients found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Console: Medical Vault */}
            <div className="glass-panel animate-slide-up dashboard-main" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'white', minHeight: '600px' }}>
                {!selectedPatient ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))', padding: '4rem' }}>
                        <div style={{ background: 'hsl(var(--muted))', width: '120px', height: '120px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2.5rem', color: 'hsl(var(--muted-foreground) / 0.5)' }}>
                            <HardDrive size={54} />
                        </div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'hsl(var(--foreground))', marginBottom: '1rem' }}>Patient Records</h2>
                        <p style={{ maxWidth: '400px', textAlign: 'center', lineHeight: '1.6', fontWeight: '500' }}>Select a patient from the list to view their medical records.</p>
                    </div>
                ) : (
                    <>
                        <div style={{ padding: '3rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, hsl(var(--secondary) / 0.05), transparent)' }}>

                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'hsl(var(--secondary))', marginBottom: '1rem', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                    <FolderOpen size={16} /> Medical History
                                </div>
                                <h2 style={{ fontSize: '2.5rem', fontWeight: '800' }}>Medical <span className="gradient-text">Records</span></h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                                    <User size={16} color="hsl(var(--primary))" />
                                    <span style={{ fontWeight: '700', color: 'hsl(var(--muted-foreground))' }}>{selectedPatient.name}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className="btn btn-outline"
                                    style={{ borderRadius: '1rem', gap: '0.5rem', padding: '0.75rem 1.5rem', border: '1px solid hsl(var(--primary))', color: 'hsl(var(--primary))' }}
                                >
                                    <PlusCircle size={20} />
                                    Upload Report
                                </button>
                                <button
                                    onClick={() => setShowRequestModal(true)}
                                    className="btn btn-primary"
                                    style={{ borderRadius: '1rem', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
                                >
                                    <Send size={20} />
                                    Request Reports
                                </button>
                            </div>
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
                                    <p style={{ fontSize: '0.9rem', marginTop: '1rem', opacity: 0.8 }}>Records are only visible for confirmed patient relationships.</p>
                                </div>
                            ) : files.length === 0 ? (
                                <div style={{ padding: '6rem 2rem', textAlign: 'center', background: 'hsl(var(--muted) / 0.1)', borderRadius: '2rem' }}>
                                    <Clock size={48} style={{ opacity: 0.1, marginBottom: '2rem' }} />
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>No Reports</h3>
                                    <p style={{ color: 'hsl(var(--muted-foreground))', fontWeight: '500' }}>No reports have been uploaded for this patient yet.</p>
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
                                                    <ExternalLink size={16} />
                                                </div>
                                            </div>
                                            <div style={{ padding: '2rem' }}>
                                                <h4 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {file.description}
                                                </h4>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', fontWeight: '600', marginBottom: '2rem' }}>
                                                    <Calendar size={14} />
                                                    {new Date(file.uploaded_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                                <a
                                                    href={api.getMediaUrl(`/media/${file.file_path}`)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-primary"
                                                    style={{ width: '100%', height: '48px', borderRadius: '1rem', fontWeight: '800', fontSize: '0.85rem', gap: '0.75rem' }}
                                                >
                                                    <Download size={18} /> Download
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            {/* Request Modal */}
            {showRequestModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel animate-scale-in" style={{ width: '500px', padding: '2.5rem', background: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Request <span className="gradient-text">Report</span></h3>
                            <button onClick={() => setShowRequestModal(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--muted-foreground))', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleRequestSubmit}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '700', fontSize: '0.9rem' }}>Report Type</label>
                                <select
                                    className="input"
                                    value={requestForm.type}
                                    onChange={(e) => setRequestForm({ ...requestForm, type: e.target.value })}
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
                                </select>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '700', fontSize: '0.9rem' }}>Additional Instructions</label>
                                <textarea
                                    className="input"
                                    placeholder="Describe why you need this report..."
                                    value={requestForm.message}
                                    onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                                    style={{ width: '100%', minHeight: '120px', borderRadius: '1rem', padding: '1rem', resize: 'vertical' }}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={requesting}
                                style={{ width: '100%', height: '54px', borderRadius: '1.25rem', fontWeight: '800', gap: '0.75rem' }}
                            >
                                {requesting ? 'Sending...' : (
                                    <>
                                        <Send size={18} />
                                        Send Request
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Sync Modal */}
            {showUploadModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass-panel animate-scale-in" style={{ width: '500px', padding: '2.5rem', background: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Sync <span className="gradient-text">Diagnostics</span></h3>
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
                                    <PlusCircle size={32} color="hsl(var(--primary))" style={{ marginBottom: '1rem' }} />
                                    <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{uploadForm.file ? uploadForm.file.name : 'Click to select report file'}</p>
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


export default DoctorRecords;
