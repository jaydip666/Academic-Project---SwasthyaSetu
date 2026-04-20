import React from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { X, MapPin, Building, ShieldCheck, Activity, Zap } from 'lucide-react';

const HospitalPortfolioModal = ({ hospital, onClose }) => {
    if (!hospital) return null;

    return createPortal(
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999,
            padding: '2rem'
        }} onClick={onClose}>
            <div
                className="animate-slide-up"
                style={{
                    background: 'white',
                    width: '100%',
                    maxWidth: '1000px',
                    maxHeight: '90vh',
                    borderRadius: '3rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '2rem', right: '2rem',
                        background: 'rgba(0,0,0,0.5)', border: 'none',
                        color: 'white', width: '48px', height: '48px',
                        borderRadius: '1.5rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 10, backdropFilter: 'blur(8px)'
                    }}
                >
                    <X size={24} />
                </button>

                {/* Header with Background */}
                <div style={{ position: 'relative', height: '300px' }}>
                    {hospital.image_url ? (
                        <img
                            src={api.getMediaUrl(hospital.image_url)}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div style={{
                            width: '100%', height: '100%',
                            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                        }}>
                            <Building size={80} />
                        </div>
                    )}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))',
                        display: 'flex', alignItems: 'flex-end', padding: '3rem'
                    }}>
                        <div>
                            <div style={{ display: 'flex', gap: '0.5rem', background: 'hsl(var(--primary) / 0.2)', color: 'white', padding: '0.4rem 1rem', borderRadius: '2rem', marginBottom: '1rem', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', width: 'fit-content', backdropFilter: 'blur(4px)' }}>
                                <ShieldCheck size={14} /> Registered Facility
                            </div>
                            <h2 style={{ fontSize: '3.5rem', fontWeight: '900', color: 'white', margin: 0 }}>{hospital.name}</h2>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <MapPin size={18} /> {hospital.location}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: '3rem', overflowY: 'auto', flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '4rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1.5rem' }}>Facility Summary</h3>
                            <p style={{ color: 'hsl(var(--muted-foreground))', lineHeight: '1.8', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
                                {hospital.address}. This facility is a primary node in the Swasthya Setu network, specializing in modern surgical sharding and decentralized therapeutic interventions.
                            </p>

                            <h4 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem' }}>In-House Specialists</h4>
                            <div style={{ display: 'grid', gap: '1.25rem' }}>
                                {hospital.doctors?.map(doc => (
                                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem', background: 'hsl(var(--muted) / 0.3)', borderRadius: '1.5rem' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '1rem', background: 'hsl(var(--primary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: '800' }}>
                                            {doc.doctor_name[0]}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: '800', margin: 0 }}>Dr. {doc.doctor_name}</p>
                                            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--primary))', fontWeight: '700', margin: 0 }}>{doc.specialization}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div style={{ padding: '2.5rem', background: 'hsl(var(--muted) / 0.2)', borderRadius: '2.5rem', border: '1px solid hsl(var(--border))' }}>
                                <h4 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '2rem' }}>Administrative Metrics</h4>
                                <div style={{ display: 'grid', gap: '2rem' }}>
                                    <MetricItem icon={<Activity size={20} />} label="Node Latency" value="24ms" />
                                    <MetricItem icon={<ShieldCheck size={20} />} label="Trust Score" value="A+" />
                                    <MetricItem icon={<Zap size={20} />} label="Capacity" value="High" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

const MetricItem = ({ icon, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ color: 'hsl(var(--primary))' }}>{icon}</div>
        <div>
            <p style={{ fontSize: '0.75rem', fontWeight: '800', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', margin: 0 }}>{label}</p>
            <p style={{ fontWeight: '900', margin: 0 }}>{value}</p>
        </div>
    </div>
);

export default HospitalPortfolioModal;
