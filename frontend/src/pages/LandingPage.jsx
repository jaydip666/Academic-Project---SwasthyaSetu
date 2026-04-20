// ================= FRONTEND FILE =================
// File: LandingPage.jsx
// Purpose: Public landing page of the Swasthya Setu platform
// Handles: Platform introduction, hero sections, feature highlights, and user onboarding redirection

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowRight, ShieldCheck, Heart, UserPlus, Star, Activity, CheckCircle, Clock, MapPin, Sparkles, TrendingUp } from 'lucide-react';
import heroImg from '../assets/hero-illustration.png';

const LandingPage = () => {
    const navigate = useNavigate();
    const [specializations, setSpecializations] = useState([]);

    useEffect(() => {
        const fetchSpecs = async () => {
            try {
                const response = await api.get('/specializations/');
                if (response.specializations) {
                    setSpecializations(response.specializations);
                }
            } catch (err) {
                console.error("Failed to fetch specializations:", err);
            }
        };
        fetchSpecs();
    }, []);

    const emojiMap = {
        'Cardiology': '❤️',
        'Neurology': '🧠',
        'Pediatrics': '👶',
        'Orthopedics': '🦴',
        'Ophthalmology': '👁️',
        'Psychiatry': '🧘',
        'Dermatology': '🧴',
        'Gastroenterology': '🧪',
        'General': '🩺',
        'Dentistry': '🦷'
    };

    const getEmoji = (spec) => {
        for (const key in emojiMap) {
            if (spec.toLowerCase().includes(key.toLowerCase())) return emojiMap[key];
        }
        return '🩺';
    };

    return (
        <div className="landing-page animate-fade-in">
            {/* 1. Hero Section */}
            <section className="hero-section">
                <div className="container hero-container">
                    <div className="hero-content-wrapper animate-slide-up">
                        <div className="hero-badge">
                            <Sparkles size={16} /> Making Healthcare Easier
                        </div>
                        <h1 className="hero-title animate-slide-up">
                            Better Healthcare <br />
                            <span className="gradient-text">for Everyone</span>
                        </h1>
                        <p className="hero-subtitle animate-slide-up" style={{ animationDelay: '0.1s' }}>
                            Try a Better Way to Stay Healthy. Connect with the best doctors, get smart health tips, and manage your records all in one place.
                        </p>
                        <div className="hero-actions animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            <button className="btn btn-primary hero-btn" onClick={() => navigate('/patient/search')}>
                                Get Started <ArrowRight size={20} />
                            </button>
                            <button className="btn btn-outline hero-btn" onClick={() => navigate('/about')}>
                                How it Works
                            </button>
                        </div>

                        <div className="hero-stats">
                            <div className="stat-item">
                                <h3 className="stat-value">10K+</h3>
                                <p className="stat-label">Active Patients</p>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <h3 className="stat-value">500+</h3>
                                <p className="stat-label">Trusted Doctors</p>
                            </div>
                            <div className="stat-divider"></div>
                            <div className="stat-item">
                                <h3 className="stat-value">4.9/5</h3>
                                <p className="stat-label">User Rating</p>
                            </div>
                        </div>
                    </div>

                    <div className="hero-image-wrapper animate-fade-in">
                        <div className="hero-image-accent"></div>
                        <img
                            src={heroImg}
                            alt="Healthcare Innovation"
                            className="hero-image"
                        />
                        {/* Floating Glass Element */}
                        <div className="glass-card hero-floating-card">
                            <div className="floating-card-icon">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="floating-card-label">Patient Recovery</p>
                                <p className="floating-card-value">+24% This Month</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Features Section */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-badge">Core Solutions</span>
                        <h2 className="section-main-title">Everything You Need for <br /><span className="gradient-text">Optimal Health</span></h2>
                    </div>

                    <div className="features-grid-main">
                        <FeatureItem 
                            icon={<ShieldCheck size={32} />} 
                            title="Super Safe & Private" 
                            desc="Your health info is kept safe with the best security tools." 
                            color="hsl(var(--primary))"
                        />
                        <FeatureItem
                            icon={<Clock size={32} />}
                            title="Instant Consultations"
                            desc="No more waiting rooms. Connect with a specialist in minutes from the comfort of your home."
                            color="hsl(var(--secondary))"
                        />
                        <FeatureItem
                            icon={<Heart size={32} />}
                            title="AI Health Insights"
                            desc="Our smart system checks your health to give you tips and advice."
                            color="hsl(var(--accent))"
                        />
                    </div>
                </div>
            </section>

            {/* 4. Services Overview */}
            <section className="bg-gradient services-overview-section">
                <div className="container services-overview-container">
                    <div className="services-list-wrapper">
                        <p className="section-desc">
                            All the Care You Need, All in One Place
                        </p>
                        <div className="services-grid-small">
                            {(specializations.length > 0 ? specializations : ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics']).map(spec => (
                                <div 
                                    key={spec} 
                                    className="card service-mini-card"
                                    onClick={() => navigate(`/patient/search?specialization=${spec}`)}
                                    style={{ cursor: 'pointer', transition: 'var(--transition)' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span className="service-mini-icon">{getEmoji(spec)}</span>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span className="service-mini-name">{spec}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--primary))', fontWeight: '800', textTransform: 'uppercase' }}>Find Doctors</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="why-choose-card">
                        <h3 className="why-choose-title">Why Choose Swasthya Setu?</h3>
                        <ul className="why-choose-list">
                            {[
                                'Trusted Doctors Worldwide',
                                'Easy-to-Use Online Reports',
                                'Help Available 24/7',
                                'Ai symptoms checker'
                            ].map(text => (
                                <li key={text} className="why-choose-item">
                                    <CheckCircle size={22} color="hsl(var(--primary-foreground))" /> {text}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* 5. Testimonials Section */}
            <section className="testimonials-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-main-title">Trusted by <span className="gradient-text">Thousands</span></h2>
                        <p className="section-subtitle">See what our patients are saying about their new health journey.</p>
                    </div>

                    <div className="testimonials-grid">
                        <TestimonialCard
                            name="Arjun Mehta"
                            spec="Patient"
                            text="The AI Symptom Checker guided me to the right specialist when I was unsure. Incredible accuracy and speed!"
                            rating={5}
                        />
                        <TestimonialCard
                            name="Dr. Kavita Rao"
                            spec="Cardiologist"
                            text="As a doctor, the easy record-sharing features save me hours of manual work every week."
                            rating={5}
                        />
                        <TestimonialCard
                            name="Sarah Johnson"
                            spec="Patient"
                            text="Safe online records mean I never have to carry folders of reports to my visits anymore. Pure peace of mind."
                            rating={5}
                        />
                    </div>
                </div>
            </section>

            {/* 4. CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-card">
                        {/* Decorative Circles */}
                        <div className="cta-decoration-1"></div>
                        <div className="cta-decoration-2"></div>

                        <div className="cta-content">
                            <h2 className="cta-title">Ready for Better Care?</h2>
                            <p className="cta-desc">Join thousands of patients who have made their healthcare easier with Swasthya Setu.</p>
                            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                                <button className="btn btn-primary btn-lg" style={{ background: 'white', color: 'hsl(var(--primary))' }} onClick={() => navigate('/register')}>Get Started Now</button>
                                <button className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }} onClick={() => navigate('/about')}>Learn More</button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

const FeatureItem = ({ icon, title, desc, color }) => (
    <div className="card" style={{ padding: '3rem 2.5rem', border: 'none', background: 'hsl(var(--background) / 0.3)', boxShadow: 'none' }}>
        <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '1.5rem',
            background: color,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '2rem',
            boxShadow: `0 8px 16px ${color}33`
        }}>
            {icon}
        </div>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{title}</h3>
        <p style={{ color: 'hsl(var(--muted-foreground))', lineHeight: '1.7' }}>{desc}</p>
    </div>
);

const PriceCard = ({ tier, price, features, popular }) => (
    <div className="card animate-scale-in" style={{
        padding: '3rem 2.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        border: popular ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
        position: 'relative',
        background: popular ? 'white' : 'transparent',
        transform: popular ? 'scale(1.05)' : 'none',
        zIndex: popular ? 10 : 1
    }}>
        {popular && (
            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'hsl(var(--primary))', color: 'white', padding: '0.4rem 1rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>
                Most Popular
            </div>
        )}
        <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>{tier}</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>{price}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', fontWeight: '500' }}>
                    <CheckCircle size={18} color="hsl(var(--primary))" /> {f}
                </div>
            ))}
        </div>
        <button className={`btn ${popular ? 'btn-primary' : 'btn-outline'}`} style={{ marginTop: 'auto', padding: '1rem' }}>
            Choose Plan
        </button>
    </div>
);

const TestimonialCard = ({ name, spec, text, rating }) => (
    <div className="glass-card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.25rem', color: '#fbbf24' }}>
            {[...Array(rating)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
        </div>
        <p style={{ fontStyle: 'italic', color: 'hsl(var(--muted-foreground))', lineHeight: '1.6', fontSize: '1.1rem' }}>"{text}"</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'hsl(var(--muted))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: 'hsl(var(--primary))' }}>
                {name[0]}
            </div>
            <div>
                <div style={{ fontWeight: '800' }}>{name}</div>
                <div style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>{spec}</div>
            </div>
        </div>
    </div>
);

export default LandingPage;
