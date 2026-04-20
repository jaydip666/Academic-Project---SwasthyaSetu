import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Activity, ShieldCheck, Heart, ArrowRight } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="footer-main">

            {/* Background Accent */}
            <div className="footer-accent footer-accent-1"></div>
            <div className="footer-accent footer-accent-2"></div>

            <div className="container footer-content">
                <div className="footer-grid">

                    {/* Brand Column */}
                    <div className="footer-brand">
                        <div className="footer-logo-container">
                            <div className="footer-logo-icon">
                                <Activity size={28} color="white" />
                            </div>
                            <span className="footer-logo-text">Swasthya <span className="gradient-text">Setu</span></span>
                        </div>
                        <p className="footer-tagline">
                            Leading the future of digital healthcare. We connect expert doctors with smart technology to help you stay healthy.
                        </p>
                        <div className="footer-socials">
                            <SocialIcon icon={<Facebook size={20} />} href="https://facebook.com/swasthyasetu" />
                            <SocialIcon icon={<Twitter size={20} />} href="https://twitter.com/swasthyasetu" />
                            <SocialIcon icon={<Instagram size={20} />} href="https://instagram.com/swasthyasetu" />
                            <SocialIcon icon={<Linkedin size={20} />} href="https://linkedin.com/company/swasthyasetu" />
                        </div>
                    </div>

                    {/* Quick Access */}
                    <div className="footer-links-col">
                        <h4 className="footer-heading">
                            Quick Links <span className="footer-heading-dot primary"></span>
                        </h4>
                        <ul className="footer-links-list">
                            <FooterLink to="/">Landing Page</FooterLink>
                            <FooterLink to="/about">About Us</FooterLink>
                            <FooterLink to="/services">Services</FooterLink>
                            <FooterLink to="/hospitals">Hospitals</FooterLink>
                            <FooterLink to="/contact">Contact Us</FooterLink>
                        </ul>
                    </div>

                    {/* Healthcare Tools */}
                    <div className="footer-links-col">
                        <h4 className="footer-heading">
                            Healthcare Tools <span className="footer-heading-dot secondary"></span>
                        </h4>
                        <ul className="footer-links-list">
                            <FooterLink to="/patient/search">Book an Appointment</FooterLink>
                            <FooterLink to="/patient/symptom-checker">Check Symptoms with AI</FooterLink>
                            <FooterLink to="/patient/records">Manage Your Records</FooterLink>
                            <FooterLink to="/patient/ledger">Safe and Easy Payments</FooterLink>
                        </ul>
                    </div>

                    {/* Contact Us */}
                    <div className="glass-panel footer-contact-card">
                        <h4 className="footer-heading">
                            Our Office <ShieldCheck size={18} color="hsl(var(--primary))" />
                        </h4>
                        <ul className="footer-contact-list">
                            <li>
                                <MapPin size={20} className="footer-contact-icon" />
                                <span>Medical Building, Medical District,<br />Central Terminal, IN 400001</span>
                            </li>
                            <li>
                                <Phone size={20} className="footer-contact-icon" />
                                <span>+91 800-SWASTHYA</span>
                            </li>
                            <li>
                                <Mail size={20} className="footer-contact-icon" />
                                <span>support@swasthyasetu.com</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Legal Bar */}
            <div className="footer-legal">
                <div className="container footer-legal-container">
                    <p className="footer-copyright">
                        &copy; {new Date().getFullYear()} Swasthya Setu Platform. All Rights Reserved.
                    </p>
                    <div className="footer-legal-links">
                        <Link to="/about" className="footer-legal-link">About</Link>
                        <Link to="/contact" className="footer-legal-link">Contact</Link>
                        <Link to="/privacy" className="footer-legal-link">Privacy Policy</Link>
                        <Link to="/terms" className="footer-legal-link">Terms of Service</Link>
                        <div className="footer-mission">
                            Secure & Encrypted <ShieldCheck size={14} color="hsl(var(--primary))" />
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

const SocialIcon = ({ icon, href = "#" }) => (
    <a href={href} target="_blank" rel="noreferrer" style={{
        color: 'white',
        background: 'rgba(255,255,255,0.05)',
        width: '48px',
        height: '48px',
        borderRadius: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1px solid rgba(255,255,255,0.1)'
    }}
        onMouseEnter={(e) => {
            e.currentTarget.style.background = 'hsl(var(--primary))';
            e.currentTarget.style.transform = 'translateY(-5px) rotate(8deg)';
            e.currentTarget.style.boxShadow = '0 10px 20px hsl(var(--primary) / 0.3)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            e.currentTarget.style.transform = 'translateY(0) rotate(0)';
            e.currentTarget.style.boxShadow = 'none';
        }}
    >
        {icon}
    </a>
);

const FooterLink = ({ to, children }) => (
    <li>
        <Link to={to} style={{
            textDecoration: 'none',
            color: 'hsl(var(--muted-foreground))',
            transition: 'all 0.3s',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.paddingLeft = '8px';
                const icon = e.currentTarget.querySelector('svg');
                if (icon) icon.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.color = 'hsl(var(--muted-foreground))';
                e.currentTarget.style.paddingLeft = '0';
                const icon = e.currentTarget.querySelector('svg');
                if (icon) icon.style.opacity = '0';
            }}
        >
            <ArrowRight size={14} style={{ opacity: 0, transition: 'opacity 0.3s' }} /> {children}
        </Link>
    </li>
);

export default Footer;