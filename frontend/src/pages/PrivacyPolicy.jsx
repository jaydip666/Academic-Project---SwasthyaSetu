import { Shield, Lock, Eye, FileText, Scale, Heart } from 'lucide-react';

const PrivacyPolicy = () => {
    return (
        <div className="dashboard-page bg-gradient animate-fade-in" style={{ padding: '6rem 0' }}>
            <div className="container">
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', padding: '0.5rem 1.25rem', borderRadius: '2rem', marginBottom: '1.5rem', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Shield size={16} /> Privacy Protocol v2.6
                        </div>
                        <h1 style={{ fontSize: '3.5rem', marginBottom: '1.25rem', fontWeight: '800' }}>
                            Privacy <span className="gradient-text">Policy</span>
                        </h1>
                        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1.1rem', lineHeight: '1.6' }}>
                            Your medical data is your most sensitive asset. At Swasthya Setu, we prioritize cryptographic security and patient autonomy above all else.
                        </p>
                    </div>

                    <div className="glass-panel" style={{ padding: '4rem', display: 'flex', flexDirection: 'column', gap: '3rem', border: '1px solid var(--glass-border)' }}>
                        <PolicySection 
                            icon={<Lock size={24} />}
                            title="1. Data Encryption"
                            content="All physiological telemetry and clinical records are encrypted using AES-256 protocols before being committed to our secure medical nexus. Only authorized medical personnel with your explicit cryptographic consent can access these shards."
                        />
                        <PolicySection 
                            icon={<Eye size={24} />}
                            title="2. Transparency & Control"
                            content="You maintain absolute sovereignty over your health data. You can audit who has viewed your reports and revoke access to any clinical node at any time through your personal dashboard."
                        />
                        <PolicySection 
                            icon={<FileText size={24} />}
                            title="3. Information Collection"
                            content="We only collect metadata necessary for scheduling and clinical synchronization. We do not sell or monetize patient data for third-party pharmaceutical analytics or insurance profiling."
                        />
                        <PolicySection 
                            icon={<Heart size={24} />}
                            title="4. Patient Rights"
                            content="Under our protocol, you have the right to data portability, rectification of clinical errors, and the right to be forgotten (data purging) from our primary registry."
                        />
                    </div>

                    <div style={{ marginTop: '4rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '0.95rem' }}>
                        Last Updated: March 2026 | Swasthya Setu Compliance Division
                    </div>
                </div>
            </div>
        </div>
    );
};

const PolicySection = ({ icon, title, content }) => (
    <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ width: '54px', height: '54px', borderRadius: '1rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {icon}
        </div>
        <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>{title}</h3>
            <p style={{ color: 'hsl(var(--muted-foreground))', lineHeight: '1.8', fontSize: '1.05rem' }}>{content}</p>
        </div>
    </div>
);

export default PrivacyPolicy;
