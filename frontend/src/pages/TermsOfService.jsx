import { Scale, ShieldCheck, ScrollText, AlertTriangle, Cpu, Globe } from 'lucide-react';

const TermsOfService = () => {
    return (
        <div className="dashboard-page bg-gradient animate-fade-in" style={{ padding: '6rem 0' }}>
            <div className="container">
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'hsl(var(--secondary) / 0.1)', color: 'hsl(var(--secondary))', padding: '0.5rem 1.25rem', borderRadius: '2rem', marginBottom: '1.5rem', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Scale size={16} /> User Agreement v1.4
                        </div>
                        <h1 style={{ fontSize: '3.5rem', marginBottom: '1.25rem', fontWeight: '800' }}>
                            Terms of <span className="gradient-text">Service</span>
                        </h1>
                        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1.1rem', lineHeight: '1.6' }}>
                            By accessing the Swasthya Setu platform, you agree to follow our rules and medical standards.
                        </p>
                    </div>

                    <div className="glass-panel" style={{ padding: '4rem', display: 'flex', flexDirection: 'column', gap: '3rem', border: '1px solid var(--glass-border)' }}>
                        <TermsSection 
                            icon={<ShieldCheck size={24} />}
                            title="1. Platform Eligibility"
                            content="Users must be at least 18 years of age or supervised by a legal guardian to use our services. Accuracy of provided health information is the responsibility of the user."
                        />
                        <TermsSection 
                            icon={<Cpu size={24} />}
                            title="2. AI Service Disclaimer"
                            content="The Swasthya AI Symptom Checker is an informational tool. It does not provide medical diagnoses. In case of emergencies, users must seek immediate offline help."
                        />
                        <TermsSection 
                            icon={<ScrollText size={24} />}
                            title="3. Booking Protocols"
                            content="Appointments scheduled through our platform are a formal agreement between patient and doctor. Cancellations and reschedules must be done through the system to keep records updated."
                        />
                        <TermsSection 
                            icon={<AlertTriangle size={24} />}
                            title="4. Prohibited Conduct"
                            content="Any attempt to bypass security systems, copy doctor lists, or harass doctors will result in immediate account closure and legal action."
                        />
                        <TermsSection 
                            icon={<Globe size={24} />}
                            title="5. Jurisdiction"
                            content="These terms are governed by the health laws of India. Any disputes will be resolved through our support center."
                        />
                    </div>

                    <div style={{ marginTop: '4rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '0.95rem' }}>
                        Last Updated: March 2026 | Swasthya Setu Legal Governance
                    </div>
                </div>
            </div>
        </div>
    );
};

const TermsSection = ({ icon, title, content }) => (
    <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ width: '54px', height: '54px', borderRadius: '1rem', background: 'hsl(var(--secondary) / 0.1)', color: 'hsl(var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {icon}
        </div>
        <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>{title}</h3>
            <p style={{ color: 'hsl(var(--muted-foreground))', lineHeight: '1.8', fontSize: '1.05rem' }}>{content}</p>
        </div>
    </div>
);

export default TermsOfService;
