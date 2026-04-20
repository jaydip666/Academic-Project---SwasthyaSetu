import { Users, Target, Shield, Heart, Sparkles, Award } from 'lucide-react';

const About = () => {
    return (
        <div className="dashboard-page bg-gradient animate-fade-in">

            <div className="container">
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', padding: '0.5rem 1.25rem', borderRadius: '2rem', marginBottom: '1.5rem', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Heart size={16} /> What We Believe In
                    </div>
                    <h1 style={{ fontSize: '4rem', marginBottom: '1.25rem', fontWeight: '800' }}>
                        Changing How <span className="gradient-text">Healthcare</span> Works
                    </h1>
                    <p style={{ color: 'hsl(var(--muted-foreground))', maxWidth: '740px', margin: '0 auto', fontSize: '1.25rem', lineHeight: '1.6' }}>
                        Swasthya Setu was born from a simple mission: to make good healthcare easy to find and use for everyone.
                    </p>
                </div>

                {/* Mission/Vision Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', marginBottom: '8rem' }}>
                    <AboutCard
                        icon={<Target size={32} />}
                        title="Our Goal"
                        desc="Connecting patients with top doctors through easy-to-use apps."
                    />
                    <AboutCard
                        icon={<Shield size={32} />}
                        title="What Matters to Us"
                        desc="Privacy, honesty, and putting patients first are at the heart of everything we do."
                    />
                    <AboutCard
                        icon={<Users size={32} />}
                        title="Our Team"
                        desc="A dedicated team of doctors, engineers, and designers working to make your healthcare better."
                    />
                </div>

                {/* Story Section */}
                <div style={{
                    display: 'flex',
                    gap: '5rem',
                    alignItems: 'center',
                    background: 'hsl(var(--card))',
                    padding: '5rem',
                    borderRadius: '3rem',
                    flexWrap: 'wrap',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid hsl(var(--border))'
                }}>
                    <div style={{ flex: 1, minWidth: '340px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'hsl(var(--secondary))', marginBottom: '1.5rem', fontWeight: '700' }}>
                            <Award size={24} /> ESTABLISHED 2026
                        </div>
                        <h2 style={{ fontSize: '2.75rem', marginBottom: '2rem', fontWeight: '800' }}>Helping You Trust <span className="gradient-text">Online Care</span></h2>
                        <p style={{ color: 'hsl(var(--muted-foreground))', lineHeight: '1.8', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                            Swasthya Setu ("Health Bridge") addresses the need for a simple way to manage your health. We saw how hard it was for people to handle their medical records or find the right doctor.
                        </p>
                        <p style={{ color: 'hsl(var(--muted-foreground))', lineHeight: '1.8', fontSize: '1.1rem' }}>
                            Today, we help thousands of people by letting them book appointments instantly, keep their records safe, and get care from the best hospitals.
                        </p>
                    </div>
                    <div style={{ flex: 1, minWidth: '340px', display: 'flex', justifyContent: 'center' }}>
                        <div style={{
                            width: '100%',
                            aspectRatio: '1',
                            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
                            borderRadius: '3rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            gap: '1rem',
                            boxShadow: '0 30px 60px hsl(var(--primary) / 0.2)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at center, transparent, rgba(0,0,0,0.1))' }}></div>
                            <Sparkles size={64} style={{ opacity: 0.8 }} />
                            <span style={{ fontSize: '2.5rem', fontWeight: '800', position: 'relative' }}>Swasthya Setu</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AboutCard = ({ icon, title, desc }) => (
    <div className="glass-panel" style={{ padding: '3.5rem', border: '1px solid var(--glass-border)' }}>
        <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '1.25rem',
            background: 'hsl(var(--primary) / 0.1)',
            color: 'hsl(var(--primary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '2rem',
            boxShadow: 'var(--shadow-sm)'
        }}>
            {icon}
        </div>
        <h3 style={{ fontSize: '1.75rem', marginBottom: '1rem', fontWeight: '800' }}>{title}</h3>
        <p style={{ color: 'hsl(var(--muted-foreground))', lineHeight: '1.7', fontSize: '1.05rem' }}>{desc}</p>
    </div>
);

export default About;
