import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
    MapPin, Phone, Mail, Building, Users, Star,
    ArrowLeft, Shield, Activity, Clock, Zap,
    Award, Heart, Calendar, ArrowRight
} from 'lucide-react';
import BookingModal from '../components/BookingModal';

const HospitalDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    const handleBookClick = (doc) => {
        if (!user) {
            navigate('/login', { state: { from: `/hospitals/${id}` } });
        } else if (user.role !== 'patient') {
            alert('Only registered patients can book consultations.');
        } else {
            setSelectedDoctor(doc);
        }
    };

    const getMediaUrl = (url) => api.getMediaUrl(url) || "/hospital_default.png";

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await api.get(`/admin/hospitals/${id}/`);
                setHospital(data);
            } catch (error) {
                console.error("Failed to fetch hospital details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    if (loading) return (
        <div className="dashboard-page bg-gradient" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="skeleton" style={{ width: '80%', height: '80%', borderRadius: '3rem' }}></div>
        </div>
    );


    if (!hospital) return (
        <div className="dashboard-page bg-gradient" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div>
                <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1rem' }}>Hospital Not Found</h1>
                <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '2rem' }}>The requested facility is not registered in our system.</p>
                <button className="btn btn-primary" onClick={() => navigate('/hospitals')}>Back to Hospitals</button>
            </div>
        </div>
    );


    return (
        <div className="dashboard-page bg-gradient animate-fade-in" style={{ paddingBottom: '5rem' }}>

            {/* Hero Section */}
            <div style={{ position: 'relative', height: '60vh', overflow: 'hidden' }}>
                <img
                    src={getMediaUrl(hospital.image_url)}
                    alt={hospital.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7))',
                    display: 'flex', alignItems: 'flex-end', padding: '5rem 0'
                }}>
                    <div className="container">
                        <button
                            onClick={() => navigate('/hospitals')}
                            style={{
                                background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.3)', color: 'white',
                                padding: '0.75rem 1.5rem', borderRadius: '1.25rem',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                cursor: 'pointer', marginBottom: '2.5rem', fontWeight: '700'
                            }}
                        >
                            <ArrowLeft size={18} /> Back to Hospitals
                        </button>

                        <div style={{ display: 'flex', gap: '0.5rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', padding: '0.4rem 1rem', borderRadius: '2rem', marginBottom: '1.25rem', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', width: 'fit-content', backdropFilter: 'blur(5px)' }}>
                            <Shield size={14} /> Verified Hospital
                        </div>
                        <h1 style={{ fontSize: '5rem', fontWeight: '900', color: 'white', marginBottom: '1rem', textShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                            {hospital.name}
                        </h1>
                        <div style={{ display: 'flex', gap: '2rem', color: 'rgba(255, 255, 255, 1)', fontWeight: '600' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={20} /> {hospital.location}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Star size={20} fill="gold" stroke="gold" /> 4.9 Rating
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container" style={{ marginTop: '4rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '5rem' }}>
                    {/* Left Column: Info */}
                    <div>
                        <section style={{ marginBottom: '4rem' }}>
                            <h2 style={{ fontSize: '2.25rem', fontWeight: '800', marginBottom: '1.5rem' }}>Facility <span className="gradient-text">Overview</span></h2>
                            <p style={{ fontSize: '1.15rem', color: 'hsl(var(--muted-foreground))', lineHeight: '1.8', marginBottom: '2.5rem' }}>
                                {hospital.address}. Swasthya Setu operates as a modern healthcare center, providing state-of-the-art diagnostic tools and robotic healthcare integration. Our facility is equipped with the latest monitoring systems and secure patient record management.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                                <div style={{ padding: '2rem', background: 'white', border: '1px solid hsl(var(--border))', borderRadius: '2rem', textAlign: 'center' }}>
                                    <Clock style={{ color: 'hsl(var(--primary))', margin: '0 auto 1rem' }} size={32} />
                                    <h4 style={{ fontWeight: '800' }}>24/7 Access</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>Always Available</p>
                                </div>
                                <div style={{ padding: '2rem', background: 'white', border: '1px solid hsl(var(--border))', borderRadius: '2rem', textAlign: 'center' }}>
                                    <Zap style={{ color: 'hsl(var(--secondary))', margin: '0 auto 1rem' }} size={32} />
                                    <h4 style={{ fontWeight: '800' }}>Fast Action</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>Emergency Response</p>
                                </div>
                                <div style={{ padding: '2rem', background: 'white', border: '1px solid hsl(var(--border))', borderRadius: '2rem', textAlign: 'center' }}>
                                    <Award style={{ color: 'hsl(var(--primary))', margin: '0 auto 1rem' }} size={32} />
                                    <h4 style={{ fontWeight: '800' }}>Top Tier</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>Certified Facility</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 style={{ fontSize: '2.25rem', fontWeight: '800', marginBottom: '2.5rem' }}>Certified <span className="gradient-text">Specialists</span></h2>
                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                {hospital.doctors?.map(doc => (
                                    <div key={doc.id} className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'var(--transition)' }}>
                                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                            <div style={{
                                                width: '64px', height: '64px', borderRadius: '1.5rem',
                                                background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
                                                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1.5rem', fontWeight: '900', overflow: 'hidden'
                                            }}>
                                                {doc.profile_picture ? (
                                                    <img src={api.getMediaUrl(doc.profile_picture)} alt="Doctor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <>{doc.doctor_name?.[0]}</>
                                                )}
                                            </div>
                                            <div>
                                                <h4 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Dr. {doc.doctor_name}</h4>
                                                <p style={{ color: 'hsl(var(--primary))', fontWeight: '700', fontSize: '0.9rem' }}>{doc.specialization}</p>
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: '0.75rem 1.5rem', gap: '0.5rem' }}
                                            onClick={() => handleBookClick(doc)}
                                        >
                                            Book Now <ArrowRight size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Contact & Map */}
                    <div>
                        <div className="glass-panel" style={{ padding: '3rem', position: 'sticky', top: '100px', background: 'white', border: '1px solid hsl(var(--border))' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '2rem' }}>Contact Information</h3>

                            <div style={{ display: 'grid', gap: '2rem' }}>
                                <div style={{ display: 'flex', gap: '1.25rem' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '1rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Phone size={24} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Phone Number</p>
                                        <p style={{ fontWeight: '800', fontSize: '1.1rem' }}>{hospital.contact || '+1-800-HEALTH'}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1.25rem' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '1rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Email Address</p>
                                        <p style={{ fontWeight: '800', fontSize: '1.1rem' }}>contact@{hospital.name.toLowerCase().replace(/ /g, '')}.com</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1.25rem' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '1rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Building size={24} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Location</p>
                                        <p style={{ fontWeight: '800', fontSize: '1.1rem' }}>{hospital.address}</p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'hsl(var(--secondary) / 0.05)', borderRadius: '1.5rem', border: '1px solid hsl(var(--secondary) / 0.1)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'hsl(var(--secondary))', marginBottom: '0.5rem' }}>
                                    <Heart size={18} fill="currentColor" />
                                    <span style={{ fontWeight: '800', fontSize: '0.9rem' }}>Emergency Priority</span>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', fontWeight: '500' }}>
                                    All Swasthya Setu verified hospitals prioritize emergency cases.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {selectedDoctor && (
                <BookingModal
                    doctor={selectedDoctor}
                    onClose={() => setSelectedDoctor(null)}
                    onSuccess={() => {
                        setSelectedDoctor(null);
                        alert('Booking request sent successfully!');
                    }}
                />
            )}
        </div>
    );
};

export default HospitalDetails;
