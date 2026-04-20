import { useState } from 'react';
import { Star, X, MessageSquare, ShieldCheck, Zap } from 'lucide-react';
import Modal from './Modal';
import { api } from '../services/api';

const ReviewModal = ({ isOpen, onClose, appointment, onSuccess }) => {
    const [rating, setRating] = useState(5);
    const [hospitalRating, setHospitalRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [hover, setHover] = useState(0);
    const [hospitalHover, setHospitalHover] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/reviews/submit/', {
                appointment_id: appointment.id,
                doctor_id: appointment.doctor_id || appointment.id,
                hospital_id: appointment.hospital_id,
                rating,
                hospital_rating: hospitalRating,
                comment
            });
            onSuccess();
            onClose();
        } catch (error) {
            alert(`Failed to transmit feedback: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Professional Feedback"
            subtitle={`Transmitting assessment for Dr. ${appointment.doctor_name || 'Unknown'}`}
            maxWidth="500px"
        >
            <form onSubmit={handleSubmit} style={{ padding: '0.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '1.5rem', fontWeight: '600' }}>
                        How would you rate the clinical efficacy of your intervention?
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHover(star)}
                                onMouseLeave={() => setHover(0)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0',
                                    transition: 'var(--transition)',
                                    transform: (hover || rating) >= star ? 'scale(1.2)' : 'scale(1)'
                                }}
                            >
                                <Star
                                    size={40}
                                    fill={(hover || rating) >= star ? '#f59e0b' : 'transparent'}
                                    color={(hover || rating) >= star ? '#f59e0b' : 'hsl(var(--muted))'}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '1.5rem', fontWeight: '600' }}>
                        How would you rate the hospital facilities and services?
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={`h-${star}`}
                                type="button"
                                onClick={() => setHospitalRating(star)}
                                onMouseEnter={() => setHospitalHover(star)}
                                onMouseLeave={() => setHospitalHover(0)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0',
                                    transition: 'var(--transition)',
                                    transform: (hospitalHover || hospitalRating) >= star ? 'scale(1.2)' : 'scale(1)'
                                }}
                            >
                                <Star
                                    size={40}
                                    fill={(hospitalHover || hospitalRating) >= star ? '#f59e0b' : 'transparent'}
                                    color={(hospitalHover || hospitalRating) >= star ? '#f59e0b' : 'hsl(var(--muted))'}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                    <label className="form-label" style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MessageSquare size={18} color="hsl(var(--primary))" /> Narrative Feedback
                    </label>
                    <textarea
                        className="input"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Describe your surgical or clinical experience..."
                        style={{ minHeight: '120px', borderRadius: '1.25rem', paddingTop: '1rem', resize: 'none' }}
                        required
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="button" className="btn btn-outline" onClick={onClose} style={{ flex: 1, borderRadius: '1.25rem', fontWeight: '800' }}>
                        Abort
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ flex: 2, borderRadius: '1.25rem', fontWeight: '800', gap: '0.75rem' }}
                    >
                        {loading ? <Zap size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                        {loading ? 'Transmitting...' : 'Commit Feedback'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ReviewModal;
