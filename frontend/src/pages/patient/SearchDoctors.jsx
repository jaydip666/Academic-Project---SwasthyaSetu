import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { Search, MapPin, User, Calendar, Filter, Star, ShieldCheck, ChevronRight, Zap, Award, BookOpen, X, Clock, MessageSquare } from 'lucide-react';
import BookingModal from '../../components/BookingModal';
import Modal from '../../components/Modal';

const SearchDoctors = () => {
    const [doctors, setDoctors] = useState([]);
    const [filteredDoctors, setFilteredDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [specializationFilter, setSpecializationFilter] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [portfolioDoctor, setPortfolioDoctor] = useState(null);
    const location = useLocation();

    const specializations = [...new Set((doctors || []).map(d => d?.specialization).filter(Boolean))];

    useEffect(() => {
        fetchDoctors();
        // Check for incoming filters from AI Symptom Checker
        if (location.state?.specialization) {
            setSpecializationFilter(location.state.specialization);
        } else if (location.state?.query) {
            setSpecializationFilter(location.state.query);
        }
    }, [location.state]);

    useEffect(() => {
        filterDoctors();
    }, [searchTerm, specializationFilter, doctors]);

    const fetchDoctors = async () => {
        try {
            const data = await api.get('/doctors/search/');
            setDoctors(data);
            setFilteredDoctors(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filterDoctors = () => {
        let result = doctors;

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(d =>
                d.doctor_name.toLowerCase().includes(lowerTerm) ||
                d.specialization.toLowerCase().includes(lowerTerm)
            );
        }

        if (specializationFilter) {
            result = result.filter(d => d.specialization?.toLowerCase() === specializationFilter.toLowerCase());
        }

        setFilteredDoctors(result);
    };

    const handleBook = (doctor) => {
        setSelectedDoctor(doctor);
    };

    const handleBookingSuccess = () => {
        alert('Booking request sent successfully!');
    };

    return (
        <div className="bg-gradient animate-fade-in" style={{ padding: '4rem 1.5rem', flex: 1 }}>
            <div className="container">
                <header style={{ marginBottom: '3.5rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', padding: '0.4rem 1.25rem', borderRadius: '2rem', marginBottom: '1.25rem', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Zap size={16} /> Our Doctors
                    </div>
                    <h1 style={{ fontSize: '3.5rem', marginBottom: '0.75rem', fontWeight: '800' }}>Find Your <span className="gradient-text">Doctor</span></h1>
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1.2rem', maxWidth: '600px' }}>
                        Connect with top medical experts across all specialties.
                    </p>
                </header>

                {/* Search & Intelligence Controls */}
                <div style={{
                    display: 'flex',
                    gap: '1.5rem',
                    marginBottom: '3rem',
                    flexWrap: 'wrap',
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '2rem',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid hsl(var(--border))'
                }}>
                    <div style={{ position: 'relative', flex: 2, minWidth: '300px' }}>
                        <Search size={22} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--primary))' }} />
                        <input
                            type="text"
                            className="input"
                            placeholder="Enter doctor name, specialization, or keyword..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '3.5rem', height: '60px', borderRadius: '1.25rem', fontSize: '1.1rem', background: 'hsl(var(--muted) / 0.3)', border: 'none' }}
                        />
                    </div>

                    <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                        <Filter size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--secondary))' }} />
                        <select
                            className="input"
                            value={specializationFilter}
                            onChange={(e) => setSpecializationFilter(e.target.value)}
                            style={{ paddingLeft: '3.5rem', height: '60px', borderRadius: '1.25rem', appearance: 'none', background: 'hsl(var(--muted) / 0.3)', border: 'none', fontWeight: '600' }}
                        >
                            <option value="">All Specialties</option>
                            {specializations.map(spec => (
                                <option key={spec} value={spec}>{spec}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Results Matrix */}
                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton" style={{ height: '320px', borderRadius: '2rem' }}></div>)}
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: '2.5rem'
                    }}>
                        {filteredDoctors.map(doctor => (
                            <DoctorCard
                                key={doctor.id}
                                doctor={doctor}
                                onBook={() => handleBook(doctor)}
                                onViewPortfolio={() => setPortfolioDoctor(doctor)}
                            />
                        ))}
                        {filteredDoctors.length === 0 && (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '6rem', color: 'hsl(var(--muted-foreground))' }}>
                                <User size={48} style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>No Doctors Found</h3>
                                <p>Try searching for something else to find a doctor.</p>
                            </div>
                        )}
                    </div>
                )}

                {selectedDoctor && (
                    <BookingModal
                        doctor={selectedDoctor}
                        onClose={() => setSelectedDoctor(null)}
                        onSuccess={handleBookingSuccess}
                    />
                )}

                {portfolioDoctor && (
                    <PortfolioModal
                        doctor={portfolioDoctor}
                        onClose={() => setPortfolioDoctor(null)}
                    />
                )}
            </div>
        </div>
    );
};

const DoctorCard = ({ doctor, onBook, onViewPortfolio }) => (
    <div className="card animate-slide-up" style={{ padding: '2.5rem', transition: 'var(--transition)', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ position: 'relative' }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '2rem',
                    background: 'hsl(var(--muted))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden'
                }}>
                    {doctor.profile_picture ? (
                        <img src={api.getMediaUrl(doctor.profile_picture)} alt="Doctor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <User size={36} style={{ color: 'hsl(var(--primary))' }} />
                    )}
                </div>
                <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: 'white', borderRadius: '50%', padding: '4px', boxShadow: 'var(--shadow-sm)' }}>
                    <ShieldCheck size={18} style={{ color: '#22c55e' }} fill="#22c55e20" />
                </div>
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#f59e0b', fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.25rem' }}>
                    <Star size={14} fill="#f59e0b" /> {doctor.average_rating} ({doctor.review_count}+ reviews)
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.25rem' }}>Dr. {doctor.doctor_name}</h3>
                <p style={{ color: 'hsl(var(--secondary))', fontWeight: '700', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    {doctor.specialization}
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'hsl(var(--primary) / 0.08)', color: 'hsl(var(--primary))', padding: '0.25rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>
                    <ShieldCheck size={12} /> {doctor.medical_system || 'Allopathic'}
                </div>
            </div>
        </div>

        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.6', flex: '1' }}>
            {doctor.description || "Certified medical professional dedicated to providing high-quality care and personalized treatment plans."}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: 'hsl(var(--muted-foreground))', fontWeight: '600' }}>
                <MapPin size={18} style={{ color: 'hsl(var(--primary))' }} />
                <span>Central Medical Complex</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: 'hsl(var(--muted-foreground))', fontWeight: '600' }}>
                <Calendar size={18} style={{ color: 'hsl(var(--secondary))' }} />
                <span>Next Slot: Tomorrow</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem', color: 'hsl(var(--foreground))', fontWeight: '800', marginTop: '0.5rem' }}>
                <Zap size={18} style={{ color: '#f59e0b' }} />
                <span>Fee: ₹{doctor.consultation_fee || '500'}</span>
            </div>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
            <button
                className="btn btn-outline"
                style={{ flex: 1, padding: '1rem', fontWeight: '800' }}
                onClick={onViewPortfolio}
            >
                View Profile
            </button>
            <button
                className="btn btn-primary"
                style={{ flex: 2, padding: '1rem', fontWeight: '800', gap: '0.5rem' }}
                onClick={onBook}
            >
                Book Now <ChevronRight size={18} />
            </button>
        </div>
    </div>
);

export default SearchDoctors;

const PortfolioModal = ({ doctor, onClose }) => {
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, [doctor.id]);

    const fetchReviews = async () => {
        try {
            const data = await api.get(`/reviews/doctor/${doctor.id}/`);
            setReviews(data);
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
        } finally {
            setLoadingReviews(false);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Doctor Profile"
            subtitle="Professional background and expertise"
            maxWidth="800px"
        >
            <div style={{ padding: '0', maxHeight: '70vh', overflowY: 'auto', paddingRight: '1rem' }}>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '3rem' }}>
                    <div style={{ width: '100px', height: '100px', borderRadius: '2.5rem', background: 'hsl(var(--primary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: '900', overflow: 'hidden' }}>
                        {doctor.profile_picture ? (
                            <img src={api.getMediaUrl(doctor.profile_picture)} alt="Doctor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <>{doctor.doctor_name?.[0]}</>
                        )}
                    </div>
                    <div>
                        <h2 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '0.5rem' }}>Dr. {doctor.doctor_name}</h2>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ padding: '0.4rem 1rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', borderRadius: '1rem', fontWeight: '800', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                                {doctor.specialization}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b', fontWeight: '800' }}>
                                <Star size={18} fill="#f59e0b" /> {doctor.average_rating}
                            </div>
                            <div style={{ padding: '0.4rem 1rem', background: 'hsl(var(--secondary) / 0.1)', color: 'hsl(var(--secondary))', borderRadius: '1rem', fontWeight: '800', textTransform: 'uppercase', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <ShieldCheck size={14} /> {doctor.medical_system || 'Allopathic'}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                    <div style={{ padding: '1.5rem', background: 'hsl(var(--muted) / 0.3)', borderRadius: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'hsl(var(--primary))' }}>
                            <Award size={24} />
                            <h4 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Experience & Expertise</h4>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1rem' }}>
                            <li style={{ fontSize: '1rem', fontWeight: '600', color: 'hsl(var(--foreground))' }}>• {doctor.experience || '0'}+ Years Clinical Experience</li>
                            <li style={{ fontSize: '1rem', fontWeight: '600', color: 'hsl(var(--foreground))' }}>• Senior Consultant in {doctor.specialization}</li>
                            <li style={{ fontSize: '1rem', fontWeight: '600', color: 'hsl(var(--foreground))' }}>• Practicing at {doctor.clinic_address || 'Central Medical Complex'}</li>
                        </ul>
                    </div>
                    <div style={{ padding: '1.5rem', background: 'hsl(var(--muted) / 0.3)', borderRadius: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'hsl(var(--secondary))' }}>
                            <BookOpen size={24} />
                            <h4 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Education</h4>
                        </div>
                        <p style={{ fontSize: '1rem', fontWeight: '600', color: 'hsl(var(--foreground))', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                            {doctor.education || "MD Physics-Medical Science\nPG Residency: Memorial Central\nFellowship: Global Health Center"}
                        </p>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '2.5rem', marginBottom: '3rem' }}>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.25rem' }}>About the Doctor</h4>
                    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1.05rem', lineHeight: '1.8', fontStyle: 'italic' }}>
                        "{doctor.description || "Committed to delivering high-quality medical care through advanced technology and personalized treatments."}"
                    </p>
                </div>

                <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '2.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Patient Reviews</h4>
                        <div style={{ fontSize: '0.9rem', color: 'hsl(var(--muted-foreground))', fontWeight: '600' }}>
                            {reviews.length} Verified Reviews
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {loadingReviews ? (
                            [1, 2].map(i => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '1.25rem' }}></div>)
                        ) : reviews.length > 0 ? (
                            reviews.map((review, i) => (
                                <div key={i} style={{ padding: '1.5rem', background: 'hsl(var(--muted) / 0.2)', borderRadius: '1.25rem', border: '1px solid hsl(var(--border))' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                        <div style={{ fontWeight: '800', fontSize: '1rem' }}>{review.patient_name}</div>
                                        <div style={{ display: 'flex', gap: '0.2rem', color: '#f59e0b' }}>
                                            {[...Array(5)].map((_, idx) => (
                                                <Star key={idx} size={14} fill={idx < review.rating ? '#f59e0b' : 'transparent'} />
                                            ))}
                                        </div>
                                    </div>
                                    <p style={{ margin: 0, color: 'hsl(var(--muted-foreground))', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                        {review.comment}
                                    </p>
                                    <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'hsl(var(--muted-foreground) / 0.6)', fontWeight: '600' }}>
                                        Date: {new Date(review.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted) / 0.1)', borderRadius: '1.5rem' }}>
                                <MessageSquare size={32} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <p style={{ fontWeight: '600' }}>No reviews for this doctor yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'flex-end', position: 'sticky', bottom: '0', background: 'white', paddingTop: '1rem', paddingBottom: '1rem', borderTop: '1px solid hsl(var(--border))' }}>
                    <button className="btn btn-primary" onClick={onClose} style={{ padding: '1rem 2.5rem', fontSize: '1rem', borderRadius: '1.25rem', fontWeight: '800' }}>
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
};
