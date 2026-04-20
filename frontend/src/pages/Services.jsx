import { useNavigate } from 'react-router-dom';
import {
    CheckCircle, Activity, Stethoscope, Brain, Bone, Eye,
    ArrowRight, Sparkles, X, Shield, Zap, Award
} from 'lucide-react';
import Modal from '../components/Modal';

const Services = () => {
    const navigate = useNavigate();

    const services = [
        {
            icon: <Stethoscope size={32} />,
            name: "Dermatology",
            desc: "Diagnosis and treatment of skin, hair, and nail conditions including acne, allergies, infections, and cosmetic dermatology care.",
            color: "hsl(346, 77%, 49%)"
        },
        {
            icon: <Brain size={32} />,
            name: "Neurology",
            desc: "Advanced diagnosis and treatment of disorders related to the brain, nervous system, and spinal cord.",
            color: "hsl(262, 83%, 58%)"
        },
        {
            icon: <Bone size={32} />,
            name: "Orthopedics",
            desc: "Specialized treatment for bones, joints, muscles, and sports injuries including joint replacement and fracture care.",
            color: "hsl(22, 90%, 50%)"
        },
        {
            icon: <Eye size={32} />,
            name: "Ophthalmology",
            desc: "Comprehensive eye care including vision testing, cataract treatment, and advanced eye surgeries.",
            color: "hsl(199, 89%, 48%)"
        },
        {
            icon: <Activity size={32} />,
            name: "General Medicine",
            desc: "Primary healthcare services including routine checkups, illness diagnosis, and preventive medical care.",
            color: "hsl(142, 71%, 45%)"
        },
        {
            icon: <Sparkles size={32} />,
            name: "Pediatrics",
            desc: "Specialized healthcare for infants, children, and adolescents including growth monitoring and childhood disease treatment.",
            color: "hsl(280, 70%, 55%)"
        },
        {
            icon: <Shield size={32} />,
            name: "Psychiatry",
            desc: "Mental health care including diagnosis and treatment of anxiety, depression, stress disorders, and behavioral conditions.",
            color: "hsl(200, 70%, 40%)"
        }
    ];

    return (
        <div className="dashboard-page bg-gradient animate-fade-in">

            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', padding: '0.5rem 1.25rem', borderRadius: '2rem', marginBottom: '1.5rem', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Sparkles size={16} /> Comprehensive Medical Solutions
                    </div>
                    <h1 style={{ fontSize: '3.5rem', marginBottom: '1.25rem', fontWeight: '800' }}>
                        World-Class <span className="gradient-text">Specialties</span>
                    </h1>
                    <p style={{ color: 'hsl(var(--muted-foreground))', maxWidth: '640px', margin: '0 auto', fontSize: '1.2rem', lineHeight: '1.6' }}>
                        Empowering your health journey with cutting-edge technology and compassionate expertise across all medical fields.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2.5rem' }}>
                    {services.map((service, index) => (
                        <div key={index} className="glass-panel animate-slide-up" style={{
                            padding: '3.5rem 3rem',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            border: '1px solid var(--glass-border)',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            borderRadius: '2.5rem',
                            position: 'relative'
                        }}
                            onClick={() => navigate(`/services/${service.name}`)}
                        >
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '2rem',
                                background: service.color,
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '2.5rem',
                                boxShadow: `0 10px 20px ${service.color}44`,
                                transition: 'transform 0.3s ease'
                            }}>
                                {service.icon}
                            </div>
                            <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem', fontWeight: '900', letterSpacing: '-0.02em' }}>{service.name}</h3>
                            <p style={{ color: 'hsl(var(--muted-foreground))', lineHeight: '1.7', fontSize: '1.05rem', marginBottom: '2.5rem', fontWeight: '500', flex: 1 }}>{service.desc}</p>
                            
                            <button
                                className="btn btn-primary"
                                style={{ 
                                    width: '100%', 
                                    padding: '1.25rem', 
                                    borderRadius: '1.5rem', 
                                    background: service.color, 
                                    boxShadow: `0 8px 16px ${service.color}33`,
                                    fontSize: '1rem',
                                    fontWeight: '800'
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/services/${service.name}`);
                                }}
                            >
                                Learn More <ArrowRight size={18} />
                            </button>
                        </div>
                    ))}
                </div>


                {/* Refined CTA Section */}
                <div style={{
                    marginTop: '6rem',
                    background: 'linear-gradient(135deg, hsl(var(--foreground)), #1a1a1a)',
                    borderRadius: '2.5rem',
                    padding: '4rem 2rem',
                    color: 'white',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-lg)'
                }}>
                    <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'hsl(var(--primary) / 0.1)', borderRadius: '50%' }}></div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'white', fontWeight: '800' }}>Ready for Personalized Care?</h2>
                        <p style={{ marginBottom: '2.5rem', opacity: 0.8, fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>Connect with our network of over 500+ certified specialists and start your wellness journey today.</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }} onClick={() => navigate('/patient/search')}>
                                Book Appointment Now
                            </button>
                            <button className="btn btn-outline" style={{ borderColor: 'white', color: 'white', padding: '1rem 2.5rem', fontSize: '1.1rem' }} onClick={() => navigate('/contact')}>
                                Speak with Support
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Services;
