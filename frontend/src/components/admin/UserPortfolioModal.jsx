import React from 'react';
import { createPortal } from 'react-dom';
import { X, User, Phone, Mail, MapPin, Calendar, Heart, Shield, Activity, Droplets, Briefcase, Award, Star, Zap, Clock, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';

const UserPortfolioModal = ({ user, role, onClose }) => {
    if (!user) return null;

    const fullName = role === 'doctor'
        ? `Dr. ${user.first_name || user.doctor_name || ''} ${user.last_name || ''}`
        : `${user.first_name || user.full_name || user.username || ''} ${user.last_name || ''}`;

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
                    width: '100%', maxWidth: '900px',
                    borderRadius: '3rem',
                    boxShadow: '0 40px 80px -20px rgba(0,0,0,0.3)',
                    overflow: 'hidden',
                    maxHeight: '90vh',
                    display: 'flex', flexDirection: 'column',
                    position: 'relative'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '2rem', right: '2rem',
                        background: 'rgba(0,0,0,0.8)', border: 'none',
                        color: 'white', width: '48px', height: '48px',
                        borderRadius: '1.5rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 10, transition: 'all 0.2s ease'
                    }}
                >
                    <X size={24} />
                </button>

                {/* Hero Header */}
                <div style={{
                    padding: '4rem 3rem',
                    background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
                    color: 'white'
                }}>
                    <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
                        <div style={{
                            width: '120px', height: '120px',
                            background: 'white', borderRadius: '2.5rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'hsl(var(--primary))', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                            overflow: 'hidden'
                        }}>
                            {user.profile_picture ? (
                                <img src={api.getMediaUrl(user.profile_picture)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <User size={60} />
                            )}
                        </div>
                        <div>
                            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.2)', color: 'white', padding: '0.4rem 1rem', borderRadius: '2rem', marginBottom: '1rem', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', width: 'fit-content' }}>
                                <Shield size={14} /> Swasthya Verified {role}
                            </div>
                            <h2 style={{ fontSize: '3rem', fontWeight: '900', margin: 0 }}>{fullName}</h2>
                            <p style={{ opacity: 0.9, fontSize: '1.1rem', fontWeight: '600', marginTop: '0.5rem' }}>{user.email} • ID: {user.id?.slice(-8).toUpperCase() || 'EXTERNAL-NODE'}</p>
                        </div>
                    </div>
                </div>

                {/* Grid Content */}
                <div style={{ padding: '3rem', overflowY: 'auto', flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                        <Section title="Contact Information" icon={<Phone size={20} />}>
                            <InfoGrid>
                                <InfoItem label="Phone" value={user.phone_no || 'Not Linked'} icon={<Phone size={14} />} />
                                <InfoItem label="Email" value={user.email} icon={<Mail size={14} />} />
                                <InfoItem label="Address" value={user.address || 'Global Hub'} icon={<MapPin size={14} />} />
                            </InfoGrid>
                        </Section>

                        {/* Patient Specifics */}
                        {role === 'patient' && (
                        <Section title="Health Details" icon={<Activity size={20} />}>
                                <InfoGrid>
                                    <InfoItem label="Age" value={user.age ? `${user.age} Years` : 'N/A'} icon={<Calendar size={14} />} />
                                    <InfoItem label="Blood Type" value={user.blood_group || 'Unknown'} icon={<Droplets size={14} />} />
                                    <InfoItem label="Account Status" value="Active" icon={<Activity size={14} />} />
                                </InfoGrid>
                            </Section>
                        )}

                        {/* Doctor Specifics */}
                        {role === 'doctor' && (
                            <>
                                <Section title="Medical Expertise" icon={<Briefcase size={20} />}>
                                    <InfoGrid>
                                        <InfoItem label="Specialization" value={user.specialization || 'Clinical Generalist'} icon={<Award size={14} />} highlight />
                                        <InfoItem label="Experience" value={user.experience ? `${user.experience} Years` : 'New Faculty'} icon={<Clock size={14} />} />
                                        <InfoItem label="Consultation Fee" value={user.consultation_fee ? `₹${user.consultation_fee}` : 'Variable'} icon={<Zap size={14} />} />
                                    </InfoGrid>
                                </Section>

                                <Section title="Professional Credentials" icon={<Shield size={20} />}>
                                    <InfoGrid>
                                        <InfoItem label="License Number" value={user.license_no || 'Pending Verification'} icon={<Award size={14} />} />
                                        {user.license_certificate && (
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <a
                                                    href={api.getMediaUrl(user.license_certificate)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        background: 'hsl(var(--primary))',
                                                        color: 'white',
                                                        padding: '0.6rem 1.2rem',
                                                        borderRadius: '1rem',
                                                        fontSize: '0.85rem',
                                                        fontWeight: '700',
                                                        textDecoration: 'none',
                                                        boxShadow: '0 4px 12px hsl(var(--primary) / 0.2)',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <ExternalLink size={14} /> View License Certificate
                                                </a>
                                            </div>
                                        )}
                                    </InfoGrid>
                                </Section>
                            </>
                        )}
                    </div>

                    <div style={{ marginTop: '3rem', padding: '2rem', background: 'hsl(var(--primary)/0.03)', borderRadius: '2rem', border: '1px dashed hsl(var(--primary)/0.2)' }}>
                        <p style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontWeight: '500', margin: 0 }}>
                            <Zap size={16} inline style={{ marginRight: '0.5rem' }} />
                            Patient data is securely encrypted. Unauthorized access is strictly prohibited.
                        </p>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

const Section = ({ title, icon, children }) => (
    <div style={{ marginBottom: '1rem' }}>
        <h3 style={{
            fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'hsl(var(--foreground))'
        }}>
            <span style={{
                width: '32px', height: '32px', borderRadius: '0.5rem',
                background: 'hsl(var(--muted))', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'hsl(var(--primary))'
            }}>
                {icon}
            </span>
            {title}
        </h3>
        <div>
            {children}
        </div>
    </div>
);

const InfoGrid = ({ children }) => (
    <div style={{ display: 'grid', gap: '1rem' }}>
        {children}
    </div>
);

const InfoItem = ({ label, value, icon, highlight }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '130px', fontSize: '0.85rem', fontWeight: '600' }}>
            {icon} {label}
        </div>
        <div style={{
            fontWeight: highlight ? '800' : '700',
            color: highlight ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
            fontSize: '0.95rem'
        }}>
            {value}
        </div>
    </div>
);

export default UserPortfolioModal;
