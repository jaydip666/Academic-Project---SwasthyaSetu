import { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Globe, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

const Contact = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        message: ''
    });
    const [status, setStatus] = useState({ loading: false, success: false, error: '' });

    const validateForm = () => {
        if (!formData.first_name || !formData.last_name || !formData.email || !formData.message) {
            setStatus({ ...status, error: 'All fields are strictly required.' });
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setStatus({ ...status, error: 'Please enter a valid electronic mail address.' });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, success: false, error: '' });

        if (!validateForm()) {
            setStatus(prev => ({ ...prev, loading: false }));
            return;
        }

        try {
            await api.post('/inquiries/submit/', formData);
            setStatus({ loading: false, success: true, error: '' });
            setFormData({ first_name: '', last_name: '', email: '', message: '' });
        } catch (err) {
            console.error("Submission error:", err);
            setStatus({ 
                loading: false, 
                success: false, 
                error: err.data?.error || 'Digital transmission failure. Please try again later.' 
            });
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (status.error) setStatus({ ...status, error: '' });
    };

    return (
        <div className="dashboard-page bg-gradient animate-fade-in">

            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', padding: '0.5rem 1.25rem', borderRadius: '2rem', marginBottom: '1.5rem', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <MessageSquare size={16} /> 24/7 Support Available
                    </div>
                    <h1 style={{ fontSize: '3.5rem', marginBottom: '1.25rem', fontWeight: '800' }}>
                        Get in <span className="gradient-text">Touch</span>
                    </h1>
                    <p style={{ color: 'hsl(var(--muted-foreground))', maxWidth: '640px', margin: '0 auto', fontSize: '1.2rem', lineHeight: '1.6' }}>
                        Have questions about our medical services? Our dedicated support team is here to assist you every step of the way.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '4rem', alignItems: 'start' }}>

                    {/* Contact Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: '800' }}>Contact Information</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <ContactItem
                                icon={<Phone size={24} />}
                                title="Primary Support"
                                info="+91 98765 43210"
                                sub="Available Monday - Friday, 9am - 6pm"
                            />
                            <ContactItem
                                icon={<Mail size={24} />}
                                title="Electronic Mail"
                                info="support@swasthyasetu.com"
                                sub="Average response time: 4 hours"
                            />
                            <ContactItem
                                icon={<MapPin size={24} />}
                                title="Global Headquarters"
                                info="Swasthya Setu Innovation Park"
                                sub="SG Highway, Ahmedabad, Gujarat 380015"
                            />
                            <ContactItem
                                icon={<Globe size={24} />}
                                title="Social Media"
                                info="@swasthyasetu"
                                sub="Stay updated on all platforms"
                            />
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="glass-panel animate-slide-up" style={{ padding: '3.5rem', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', color: 'hsl(var(--primary))' }}>
                            <Send size={24} />
                            <h3 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: 'hsl(var(--foreground))' }}>Send an Inquiry</h3>
                        </div>

                        {status.success ? (
                            <div className="animate-slide-up" style={{ textAlign: 'center', padding: '2rem 0' }}>
                                <div style={{ background: 'hsl(var(--secondary) / 0.1)', color: 'hsl(var(--secondary))', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                    <CheckCircle2 size={40} />
                                </div>
                                <h4 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Inquiry Delivered!</h4>
                                <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '2rem' }}>Our team has received your message and will respond shortly.</p>
                                <button className="btn btn-outline" onClick={() => setStatus({ ...status, success: false })} style={{ width: '100%' }}>
                                    Send Another Message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                                {status.error && (
                                    <div style={{ background: 'hsl(var(--accent) / 0.1)', color: 'hsl(var(--accent))', padding: '1rem', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', fontWeight: '600' }}>
                                        <AlertCircle size={18} /> {status.error}
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem' }}>
                                    <div className="input-group">
                                        <label className="label">First Name</label>
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            className="input"
                                            placeholder="John"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Last Name</label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            className="input"
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="label">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="label">Your Message</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="input"
                                        rows="5"
                                        placeholder="How can our medical team assist you?"
                                        style={{ resize: 'none' }}
                                    ></textarea>
                                </div>
                                <button
                                    className="btn btn-primary"
                                    disabled={status.loading}
                                    style={{ width: '100%', padding: '1.1rem', fontSize: '1.1rem', fontWeight: '700', gap: '0.75rem' }}
                                >
                                    {status.loading ? (
                                        <>Transmitting... <Loader2 size={20} className="animate-spin" /></>
                                    ) : (
                                        <>Deliver Message <Send size={20} /></>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

const ContactItem = ({ icon, title, info, sub }) => (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'start' }}>
        <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '1.25rem',
            background: 'hsl(var(--primary) / 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'hsl(var(--primary))',
            flexShrink: 0,
            boxShadow: 'var(--shadow-sm)'
        }}>
            {icon}
        </div>
        <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', fontWeight: '700', color: 'hsl(var(--foreground))' }}>{title}</h4>
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'hsl(var(--primary))', marginBottom: '0.4rem' }}>{info}</div>
            <div style={{ fontSize: '0.95rem', color: 'hsl(var(--muted-foreground))', lineHeight: '1.5' }}>{sub}</div>
        </div>
    </div>
);

export default Contact;
