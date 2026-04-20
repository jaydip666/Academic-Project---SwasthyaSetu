import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { User, Mail, Phone, Calendar, MapPin, Save, Edit2, ShieldCheck, CreditCard, Activity, Heart, Droplets, Camera, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EditProfile = () => {
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const fileInputRef = useRef(null);
    // ... (rest of initializations)
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_no: '',
        address: '',
        date_of_birth: '',
        blood_group: '',
        emergency_contact: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone_no: user.phone_no || '',
                address: user.address || '',
                date_of_birth: user.date_of_birth || '',
                blood_group: user.blood_group || '',
                emergency_contact: user.emergency_contact || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const uploadData = new FormData();
            uploadData.append('file', file);
            try {
                const res = await api.uploadFile('/auth/upload-avatar/', uploadData);
                updateUser({ ...user, profile_picture: res.path });
                alert('Profile picture updated successfully!');
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
            alert('Identity synchronization successful!');
            setEditing(false);
        } catch (error) {
            alert(`Synchronization error: ${error.message}`);
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
                <header style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', padding: '0.4rem 1rem', borderRadius: '2rem', marginBottom: '1.25rem', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <ShieldCheck size={14} /> Personal Identity
                        </div>
                        <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem', fontWeight: '800' }}>Patient <span className="gradient-text">Profile</span></h1>
                        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1.2rem' }}>Manage your digital health identity and preferences.</p>
                    </div>
                    {!editing && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setEditing(true)}
                            style={{ padding: '1rem 2rem', gap: '0.75rem', fontSize: '1rem', fontWeight: '800' }}
                        >
                            <Edit2 size={20} /> Modify Profile
                        </button>
                    )}
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '3rem', alignItems: 'start' }}>

                    {/* Identity Card */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px', background: 'hsl(var(--primary) / 0.05)', borderRadius: '50%' }}></div>
                            <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto 2rem' }}>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        width: '100%', height: '100%', borderRadius: '3.5rem',
                                        background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', fontSize: '3.5rem', fontWeight: '800',
                                        boxShadow: '0 20px 40px hsl(var(--primary) / 0.25)',
                                        border: '4px solid white',
                                        cursor: 'pointer',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {user?.profile_picture ? (
                                        <img src={api.getMediaUrl(user.profile_picture)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <>{user?.first_name?.[0]}{user?.last_name?.[0]}</>
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
                                    position: 'absolute', bottom: '5px', right: '5px',
                                    background: 'hsl(var(--primary))', color: 'white',
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '3px solid white', cursor: 'pointer'
                                }} onClick={() => fileInputRef.current?.click()}>
                                    <Camera size={14} />
                                </div>
                            </div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.5rem' }}>{user?.first_name} {user?.last_name}</h2>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem', fontWeight: '700', background: 'hsl(var(--muted))', padding: '0.5rem 1rem', borderRadius: '1rem' }}>
                                <Activity size={14} /> ID: SS-{user?.id?.slice(-8).toUpperCase()}
                            </div>
                        </div>

                        <div className="card" style={{ padding: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Heart size={18} style={{ color: 'hsl(346, 77%, 49%)' }} /> Vital Metrics
                            </h3>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'hsl(var(--muted) / 0.4)', borderRadius: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '700', fontSize: '0.9rem' }}>
                                        <Droplets size={16} style={{ color: 'hsl(var(--primary))' }} /> Blood
                                    </div>
                                    <span style={{ fontWeight: '800', color: 'hsl(var(--primary))' }}>{formData.blood_group || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'hsl(var(--muted) / 0.4)', borderRadius: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '700', fontSize: '0.9rem' }}>
                                        <Calendar size={16} style={{ color: 'hsl(var(--secondary))' }} /> DOB
                                    </div>
                                    <span style={{ fontWeight: '800' }}>{formData.date_of_birth || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="card" style={{ padding: '3.5rem' }}>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
                                <div className="form-group">
                                    <label className="form-label">First Name</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        className="input"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        disabled={!editing}
                                        style={{ height: '56px', borderRadius: '1rem' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Surname</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        className="input"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        disabled={!editing}
                                        style={{ height: '56px', borderRadius: '1rem' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="input"
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled={!editing}
                                        style={{ height: '56px', borderRadius: '1rem' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Mobile Number</label>
                                    <input
                                        type="tel"
                                        name="phone_no"
                                        className="input"
                                        value={formData.phone_no}
                                        onChange={handleChange}
                                        disabled={!editing}
                                        style={{ height: '56px', borderRadius: '1rem' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Date-of-Birth</label>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        className="input"
                                        value={formData.date_of_birth}
                                        onChange={handleChange}
                                        disabled={!editing}
                                        style={{ height: '56px', borderRadius: '1rem' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Blood Group</label>
                                    <select
                                        name="blood_group"
                                        className="input"
                                        value={formData.blood_group}
                                        onChange={handleChange}
                                        disabled={!editing}
                                        style={{ height: '56px', borderRadius: '1rem' }}
                                    >
                                        <option value="">Select Blood Group</option>
                                        <option value="A+">A Positive (A+)</option>
                                        <option value="A-">A Negative (A-)</option>
                                        <option value="B+">B Positive (B+)</option>
                                        <option value="B-">B Negative (B-)</option>
                                        <option value="O+">O Positive (O+)</option>
                                        <option value="O-">O Negative (O-)</option>
                                        <option value="AB+">AB Positive (AB+)</option>
                                        <option value="AB-">AB Negative (AB-)</option>
                                    </select>
                                </div>

                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Residential Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        className="input"
                                        value={formData.address}
                                        onChange={handleChange}
                                        disabled={!editing}
                                        placeholder="Full address for emergency"
                                        style={{ height: '56px', borderRadius: '1rem' }}
                                    />
                                </div>

                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Emergency Contact</label>
                                    <input
                                        type="tel"
                                        name="emergency_contact"
                                        className="input"
                                        value={formData.emergency_contact}
                                        onChange={handleChange}
                                        disabled={!editing}
                                        style={{ height: '56px', borderRadius: '1rem' }}
                                    />
                                </div>
                            </div>

                            {editing && (
                                <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'flex-end', borderTop: '1px solid hsl(var(--border))', paddingTop: '2.5rem' }}>
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => setEditing(false)}
                                        style={{ padding: '0.8rem 2rem', fontWeight: '700' }}
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading}
                                        style={{ padding: '0.8rem 2.5rem', gap: '0.75rem', fontWeight: '800' }}
                                    >
                                        <Save size={20} /> {loading ? 'Syncing...' : 'Commit Changes'}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>

                {/* Account Deletion Matrix */}
                <div className="card" style={{ marginTop: '3rem', border: '1px solid hsl(var(--accent) / 0.2)', background: 'hsl(var(--accent) / 0.02)', padding: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            <div style={{ background: 'hsl(var(--accent) / 0.1)', color: 'hsl(var(--accent))', padding: '1rem', borderRadius: '1rem' }}>
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'hsl(var(--accent))', marginBottom: '0.25rem' }}>Account Termination</h3>
                                <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.95rem' }}>Permanently remove your identity and all associated health records from our secure servers.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleDeleteAccount}
                            className="btn btn-outline"
                            style={{ borderColor: 'hsl(var(--accent))', color: 'hsl(var(--accent))', fontWeight: '800', padding: '0.8rem 2rem', gap: '0.75rem' }}
                        >
                            <Trash2 size={18} /> Delete My Identity
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditProfile;
