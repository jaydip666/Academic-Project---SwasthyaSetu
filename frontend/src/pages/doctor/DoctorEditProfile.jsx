import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { User, Mail, Phone, MapPin, Save, Edit2, FileText, ShieldCheck, Award, Briefcase, Zap, X, Check, BookOpen, Camera, ChevronDown, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DoctorEditProfile = () => {
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone_no: '',
        email: '',
        specialization: '',
        license_no: '',
        experience: '',
        clinic_address: '',
        consultation_fee: '',
        description: '',
        education: '',
        medical_system: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone_no: user.phone_no || '',
                specialization: user.specialization || '',
                license_no: user.license_no || '',
                experience: user.experience || '',
                clinic_address: user.clinic_address || '',
                consultation_fee: user.consultation_fee || '',
                description: user.description || '',
                education: user.education || '',
                medical_system: user.medical_system || 'Allopathic'
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const uploadData = new FormData();
            uploadData.append('file', file);
            try {
                const res = await api.uploadFile('/auth/upload-avatar/', uploadData);
                updateUser({ ...user, profile_picture: res.path });
                alert('Profile picture updated!');
            } catch (error) {
                alert('Upload failed: ' + error.message);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/auth/update-profile/', formData);
            updateUser({ ...user, ...formData });
            setEditing(false);
        } catch (error) {
            alert(`Failed to update profile: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm("CRITICAL ACTION: Are you absolutely certain you wish to purge your entire identity from the Swasthya Setu network? This action is irreversible and will delete all your records and appointment history.");
        if (confirmed) {
            setLoading(true);
            try {
                await api.delete('/auth/delete-account/');
                logout();
                navigate('/login');
            } catch (err) {
                alert("Identity Purge Failed: " + err.message);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="bg-gradient animate-fade-in" style={{ padding: '4rem 1.5rem', flex: 1 }}>
            <div className="container" style={{ maxWidth: '1000px' }}>

                {/* Identity Header */}
                <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', padding: '0.4rem 1rem', borderRadius: '2rem', marginBottom: '1.25rem', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <ShieldCheck size={14} /> Doctor Profile
                        </div>
                        <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem', fontWeight: '800' }}>Professional <span className="gradient-text">Profile</span></h1>
                        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1.2rem' }}>Manage your professional details and expertise.</p>
                    </div>

                    {!editing && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setEditing(true)}
                            style={{ padding: '0.8rem 2rem', borderRadius: '1.25rem', fontWeight: '800' }}
                        >
                            <Edit2 size={18} /> Edit Profile
                        </button>
                    )}
                </header>

                <div className="glass-panel animate-slide-up" style={{ padding: '0', background: 'white', overflow: 'hidden' }}>

                    {/* Visual Presence */}
                    <div style={{ padding: '3rem', background: 'linear-gradient(135deg, hsl(var(--primary) / 0.05), transparent)', display: 'flex', alignItems: 'center', gap: '2.5rem', borderBottom: '1px solid hsl(var(--border))' }}>
                        <div style={{ position: 'relative' }}>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    width: '120px', height: '120px', borderRadius: '2.5rem',
                                    background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: '900',
                                    boxShadow: '0 20px 40px hsl(var(--primary) / 0.25)',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    border: '3px solid white'
                                }}
                            >
                                {user?.profile_picture ? (
                                    <img src={api.getMediaUrl(user.profile_picture)} alt="Doctor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <>{formData.first_name?.[0]}{formData.last_name?.[0]}</>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarChange}
                                style={{ display: 'none' }}
                                accept="image/*"
                            />
                            <div style={{
                                position: 'absolute', bottom: '-8px', right: '-8px',
                                background: 'hsl(var(--primary))', padding: '6px', borderRadius: '1rem',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)', color: 'white',
                                cursor: 'pointer', border: '2px solid white'
                            }} onClick={() => fileInputRef.current?.click()}>
                                <Camera size={18} />
                            </div>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '0.25rem' }}>Dr. {formData.first_name} {formData.last_name}</h2>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <span style={{ color: 'hsl(var(--primary))', fontWeight: '700', fontSize: '1.1rem' }}>{formData.specialization || 'Consultant Physician'}</span>
                                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'hsl(var(--border))' }}></div>
                                <span style={{ color: 'hsl(var(--muted-foreground))', fontWeight: '600' }}>Exp: {formData.experience || '0'} Years</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ padding: '3.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', marginBottom: '3rem' }}>

                            {/* Personal Telemetry */}
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '800' }}>First Name</label>
                                <input name="first_name" className="input" style={{ height: '54px', borderRadius: '1.25rem' }} value={formData.first_name} onChange={handleChange} disabled={!editing} placeholder="Nexus Name" />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '800' }}>Last Name</label>
                                <input name="last_name" className="input" style={{ height: '54px', borderRadius: '1.25rem' }} value={formData.last_name} onChange={handleChange} disabled={!editing} placeholder="Legacy Name" />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '800' }}>Secure Email</label>
                                <input name="email" className="input" style={{ height: '54px', borderRadius: '1.25rem' }} value={formData.email} onChange={handleChange} disabled={!editing} placeholder="nexus@swasthyasetu.com" />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '800' }}>Comm channel</label>
                                <input name="phone_no" className="input" style={{ height: '54px', borderRadius: '1.25rem' }} value={formData.phone_no} onChange={handleChange} disabled={!editing} placeholder="+1-COM-SYNC" />
                            </div>

                            {/* Clinical Core */}
                            <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                                <div style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Clinical Matrix</h3>
                                    <div style={{ flex: 1, height: '1px', background: 'hsl(var(--border))' }}></div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '800' }}>Primary Specialization</label>
                                <input name="specialization" className="input" style={{ height: '54px', borderRadius: '1.25rem' }} value={formData.specialization} onChange={handleChange} disabled={!editing} placeholder="e.g. Neural Oncology" />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '800' }}>Medical System</label>
                                <div style={{ position: 'relative' }}>
                                    <select 
                                        name="medical_system" 
                                        className="input" 
                                        style={{ height: '54px', borderRadius: '1.25rem', paddingLeft: '3.5rem', cursor: 'pointer', appearance: 'none' }} 
                                        value={formData.medical_system || 'Allopathic'} 
                                        onChange={handleChange} 
                                        disabled={!editing}
                                    >
                                        <option value="Allopathic">Allopathic</option>
                                        <option value="Homeopathic">Homeopathic</option>
                                        <option value="Ayurvedic">Ayurvedic</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <ShieldCheck size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--primary))' }} />
                                    <ChevronDown size={14} style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))', pointerEvents: 'none' }} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '800' }}>Medical Authorization ID</label>
                                <input name="license_no" className="input" style={{ height: '54px', borderRadius: '1.25rem' }} value={formData.license_no} onChange={handleChange} disabled={!editing} placeholder="LIC-XXXX-XXXX" />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '800' }}>Clinical Longevity (Years)</label>
                                <input type="number" name="experience" className="input" style={{ height: '54px', borderRadius: '1.25rem' }} value={formData.experience} onChange={handleChange} disabled={!editing} />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '800' }}>Consultation Band (₹)</label>
                                <input type="number" name="consultation_fee" className="input" style={{ height: '54px', borderRadius: '1.25rem' }} value={formData.consultation_fee} onChange={handleChange} disabled={!editing} />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label" style={{ fontWeight: '800' }}>Nexus Clinic Headquarters</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--primary))' }} />
                                    <input name="clinic_address" className="input" style={{ height: '54px', borderRadius: '1.25rem', paddingLeft: '3.5rem' }} value={formData.clinic_address} onChange={handleChange} disabled={!editing} placeholder="Standard physical coordinates" />
                                </div>
                            </div>

                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label" style={{ fontWeight: '800' }}>Academic Shards (Qualifications)</label>
                                <div style={{ position: 'relative' }}>
                                    <BookOpen size={18} style={{ position: 'absolute', left: '1.25rem', top: '1.25rem', color: 'hsl(var(--secondary))' }} />
                                    <textarea
                                        name="education"
                                        className="input"
                                        style={{ minHeight: '100px', borderRadius: '1.25rem', paddingLeft: '3.5rem', paddingTop: '1rem', resize: 'vertical' }}
                                        value={formData.education}
                                        onChange={handleChange}
                                        disabled={!editing}
                                        placeholder="MD, MBBS, Specializations..."
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label" style={{ fontWeight: '800' }}>Professional Narrative (About)</label>
                                <div style={{ position: 'relative' }}>
                                    <FileText size={18} style={{ position: 'absolute', left: '1.25rem', top: '1.25rem', color: 'hsl(var(--primary))' }} />
                                    <textarea
                                        name="description"
                                        className="input"
                                        style={{ minHeight: '120px', borderRadius: '1.25rem', paddingLeft: '3.5rem', paddingTop: '1rem', resize: 'vertical' }}
                                        value={formData.description}
                                        onChange={handleChange}
                                        disabled={!editing}
                                        placeholder="Tell patients about your clinical expertise and mission..."
                                    />
                                </div>
                            </div>
                        </div>

                        {editing && (
                            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'flex-end', paddingTop: '2rem', borderTop: '1px solid hsl(var(--border))' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setEditing(false)} style={{ padding: '0.8rem 2.5rem', borderRadius: '1.25rem', fontWeight: '800' }}>
                                    Abort
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.8rem 2.5rem', borderRadius: '1.25rem', fontWeight: '800', gap: '0.75rem' }}>
                                    {loading ? <Zap size={18} className="animate-spin" /> : <Save size={18} />}
                                    {loading ? 'Synchronizing...' : 'Save Credentials'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                {/* Account Deletion Matrix */}
                <div className="card" style={{ marginTop: '3rem', border: '1px solid hsl(var(--accent) / 0.2)', background: 'hsl(var(--accent) / 0.02)', padding: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            <div style={{ background: 'hsl(var(--accent) / 0.1)', color: 'hsl(var(--accent))', padding: '1rem', borderRadius: '1rem' }}>
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'hsl(var(--accent))', marginBottom: '0.25rem' }}>Professional De-registration</h3>
                                <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.95rem' }}>Permanently remove your clinical identity and all associated professional records from Swasthya Setu.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleDeleteAccount}
                            className="btn btn-outline"
                            style={{ borderColor: 'hsl(var(--accent))', color: 'hsl(var(--accent))', fontWeight: '800', padding: '0.8rem 2rem', gap: '0.75rem' }}
                        >
                            <Trash2 size={18} /> Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorEditProfile;
