import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MapPin, Star, ArrowRight, Shield, Activity, Clock, Trash2, Building, X, Globe, Heart } from 'lucide-react';
import Modal from '../components/Modal';

const Hospitals = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedHospital, setSelectedHospital] = useState(null);

    useEffect(() => {
        fetchHospitals();
    }, []);

    const fetchHospitals = async () => {
        try {
            // Using the existing manage_hospitals GET endpoint
            const data = await api.get('/admin/hospitals/');
            setHospitals(data);
        } catch (error) {
            console.error("Failed to fetch hospitals", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this hospital?')) return;
        try {
            await api.delete(`/admin/hospitals/${id}/delete/`);
            fetchHospitals();
        } catch (error) {
            alert('Delete failed.');
        }
    };

    return (
        <div className="dashboard-page bg-gradient animate-fade-in">
            <div className="container">
                <div className="section-header">
                    <div className="header-badge">
                        <Shield size={16} /> Our Hospitals
                    </div>
                    <h1 className="header-title-main">
                        Partner <span className="gradient-text">Hospitals</span>
                    </h1>
                    <p className="header-subtitle-main">
                        We collaborate with world-class medical institutions to provide seamless healthcare services and prioritize your well-being.
                    </p>
                </div>

                {loading ? (
                    <div className="stat-grid">
                        {[1, 2, 3].map(i => <div key={i} className="skeleton hospital-skeleton"></div>)}
                    </div>
                ) : (
                    <div className="hospital-card-grid">
                        {hospitals.map(hospital => (
                            <div key={hospital.id} className="card hospital-display-card animate-slide-up">
                                <div className="hospital-card-visual">
                                    {hospital.image_url ? (
                                        <img src={api.getMediaUrl(hospital.image_url)} alt={hospital.name} className="hospital-visual-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <Building size={80} className="hospital-visual-icon" />
                                    )}
                                    <div className="hospital-rating-badge">
                                        <div className="rating-pill">
                                            <Star size={14} fill="gold" stroke="gold" /> 4.9
                                        </div>
                                        {user?.role === 'admin' && (
                                            <button
                                                onClick={() => handleDelete(hospital.id)}
                                                className="delete-node-btn"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="hospital-card-body">
                                    <h3 className="hospital-display-name">{hospital.name}</h3>

                                    <div className="hospital-meta-list">
                                        <div className="hospital-meta-item">
                                            <MapPin size={20} className="meta-icon-primary" /> {hospital.location}
                                        </div>
                                        <div className="hospital-meta-item highlight">
                                            <Clock size={20} /> Operational 24/7
                                        </div>
                                    </div>

                                    <button
                                        className="btn btn-primary hospital-explore-btn"
                                        onClick={() => navigate(`/hospitals/${hospital.id}`)}
                                    >
                                        Explore Services <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {selectedHospital && (
                    <HospitalDetailModal
                        hospital={selectedHospital}
                        onClose={() => setSelectedHospital(null)}
                    />
                )}
            </div>
        </div>
    );
};

const HospitalDetailModal = ({ hospital, onClose }) => (
    <Modal
        isOpen={true}
        onClose={onClose}
        title="Hospital Details"
        subtitle="Information about this hospital"
        maxWidth="800px"
    >
        <div style={{ padding: '0' }}>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '3rem' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '1.5rem', background: 'hsl(var(--primary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 24px hsl(var(--primary) / 0.2)', overflow: 'hidden' }}>
                    {hospital.image_url ? (
                        <img src={api.getMediaUrl(hospital.image_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <Building size={40} />
                    )}
                </div>
                <div>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '0.5rem' }}>{hospital.name}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700' }}>
                        <MapPin size={18} /> {hospital.location}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <StatCard icon={<Building size={20} />} label="Total Capacity" value="500+ Beds" color="var(--primary)" />
                <StatCard icon={<Activity size={20} />} label="Emergency Units" value="24/7 Active" color="var(--secondary)" />
                <StatCard icon={<Globe size={20} />} label="Category" value="Top Rated" color="var(--primary)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '3rem', marginBottom: '3rem' }}>
                <div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem', borderLeft: '4px solid hsl(var(--primary))', paddingLeft: '1rem' }}>Specialized Wards</h4>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <WardItem label="Advanced Cardiac Care" icon={<Heart size={16} />} />
                        <WardItem label="Neurological Research" icon={<Activity size={16} />} />
                        <WardItem label="Advanced Testing" icon={<Shield size={16} />} />
                    </div>
                </div>
                <div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem', borderLeft: '4px solid hsl(var(--secondary))', paddingLeft: '1rem' }}>Infrastructure</h4>
                    <p style={{ color: 'hsl(var(--muted-foreground))', lineHeight: '1.7', fontSize: '1rem', fontWeight: '500' }}>
                        Located at {hospital.address || "the heart of the city's medical district"}, this facility features state-of-the-art diagnostic tools and robotic surgical suites.
                    </p>
                </div>
            </div>

            <button className="btn btn-primary" onClick={onClose} style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', fontWeight: '800', borderRadius: '1.5rem' }}>
                Close
            </button>
        </div>
    </Modal>
);

const StatCard = ({ icon, label, value, color }) => (
    <div style={{ padding: '1.5rem', background: 'hsl(var(--muted) / 0.3)', borderRadius: '1.5rem', textAlign: 'center' }}>
        <div style={{ color: `hsl(${color})`, marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>{icon}</div>
        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{label}</div>
        <div style={{ fontSize: '1.25rem', fontWeight: '900' }}>{value}</div>
    </div>
);

const WardItem = ({ label, icon }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'white', border: '1px solid hsl(var(--border))', borderRadius: '1rem', fontWeight: '700', fontSize: '0.95rem' }}>
        <div style={{ color: 'hsl(var(--primary))' }}>{icon}</div>
        {label}
    </div>
);

export default Hospitals;
