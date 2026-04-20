// ================= FRONTEND FILE =================
// File: ServiceDetail.jsx
// Purpose: Detailed view for a specific medical department/service
// Handles: Department description, common treatments, and department-wise doctor list

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
    Stethoscope, Brain, Bone, Eye, Activity, Shield, 
    ArrowLeft, Calendar, Award, MapPin, Star, Sparkles, 
    ChevronRight, Zap, Info
} from 'lucide-react';

const departmentData = {
    "Dermatology": {
        icon: <Stethoscope size={44} />,
        color: "hsl(346, 77%, 49%)",
        desc: "Diagnosis and treatment of skin, hair, and nail conditions including acne, allergies, infections, and cosmetic dermatology care.",
        longDesc: "Our Dermatology department offers comprehensive care for all skin health needs. We specialize in medical dermatology, aesthetic enhancements, and specialized treatments for chronic skin conditions using modern diagnostic tools.",
        treatments: ["Acne & Scar Management", "Skin Cancer Screening", "Cosmetic Laser Therapy", "Allergy Testing", "Eczema & Psoriasis Care"]
    },
    "Neurology": {
        icon: <Brain size={44} />,
        color: "hsl(262, 83%, 58%)",
        desc: "Advanced diagnosis and treatment of disorders related to the brain, nervous system, and spinal cord.",
        longDesc: "The Neurology division at Swasthya Setu is dedicated to the study and treatment of complex neurological disorders. From stroke management to epilepsy and neurodegenerative diseases, we provide holistic neuro-care.",
        treatments: ["EEG Monitoring", "MRI Neuro-imaging", "Nerve Conduction Studies", "Cognitive Behavioral Therapy", "Sleep Analysis"]
    },
    "Orthopedics": {
        icon: <Bone size={44} />,
        color: "hsl(22, 90%, 50%)",
        desc: "Specialized treatment for bones, joints, muscles, and sports injuries including joint replacement and fracture care.",
        longDesc: "Our Orthopedic specialists combine surgical innovation with personalized rehabilitation. We focus on restoring mobility and enhancing quality of life through advanced joint, spine, and musculoskeletal care.",
        treatments: ["Joint Replacement Surgeries", "Arthroscopy", "Spinal Decompression", "Sports Injury Rehab", "Fracture Realignment"]
    },
    "Ophthalmology": {
        icon: <Eye size={44} />,
        color: "hsl(199, 89%, 48%)",
        desc: "Comprehensive eye care including vision testing, cataract treatment, and advanced eye surgeries.",
        longDesc: "Our Vision Center offers complete eye care for all ages. We specialize in precision surgeries, glaucoma management, and chronic eye condition treatment using state-of-the-art diagnostic sharding.",
        treatments: ["Cataract Extraction", "Robotic LASIK", "Glaucoma Filtration", "Retinal Repair", "Corneal Transplant"]
    },
    "General Medicine": {
        icon: <Activity size={44} />,
        color: "hsl(142, 71%, 45%)",
        desc: "Primary healthcare services including routine checkups, illness diagnosis, and preventive medical care.",
        longDesc: "General Medicine serves as the primary gateway to our healthcare ecosystem. We focus on preventive strategies, annual wellness checkups, and early detection of systemic health issues.",
        treatments: ["Preventive Screenings", "Diabetes Management", "Hypertension Control", "Infectious Disease Care", "Geriatric Medicine"]
    },
    "Pediatrics": {
        icon: <Sparkles size={44} />,
        color: "hsl(280, 70%, 55%)",
        desc: "Specialized healthcare for infants, children, and adolescents including growth monitoring and childhood disease treatment.",
        longDesc: "Our pediatrics team is committed to the physical, emotional, and social development of children. We provide a nursery-grade environment for treatments and recovery from infancy through adolescence.",
        treatments: ["Immunization Schedules", "Growth Monitoring", "Developmental Screening", "Pediatric Surgery", "Childhood Allergy Care"]
    },
    "Psychiatry": {
        icon: <Shield size={44} />,
        color: "hsl(200, 70%, 40%)",
        desc: "Mental health care including diagnosis and treatment of anxiety, depression, stress disorders, and behavioral conditions.",
        longDesc: "We provide a safe and confidential space for mental wellness. Our psychiatrists utilize evidence-based therapies to treat various mental health conditions and improve emotional resilience.",
        treatments: ["Psychodynamic Therapy", "Medication Management", "Mood Disorder Control", "Stress Resilience Training", "Corporate Wellness Coaching"]
    }
};

const ServiceDetail = () => {
    const { department } = useParams();
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const info = departmentData[department] || departmentData["General Medicine"];

    useEffect(() => {
        fetchDoctors();
        window.scrollTo(0, 0);
    }, [department]);

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const data = await api.get('/doctors/');
            // Filter doctors by specialization (department)
            const filtered = data.filter(doc => {
                if (!doc.specialization) return false;
                const docSpec = doc.specialization.toLowerCase();
                const deptName = department.toLowerCase();
                
                // Direct match or partial match
                if (docSpec.includes(deptName)) return true;
                
                // Handle common medical naming variations (ogy -> ogist, y -> ist)
                const deptBase = deptName.replace(/y$/, ""); // e.g. dermatology -> dermatolog
                if (docSpec.includes(deptBase)) return true;

                // Handle Orthopedics -> Orthopedic
                if (deptName === "orthopedics" && docSpec.includes("orthopedic")) return true;

                // General Medicine mapping
                if (department === "General Medicine") {
                    const medicineSpecs = ["general physician", "general practitioner", "internal medicine", "mbbs"];
                    return medicineSpecs.some(spec => docSpec.includes(spec));
                }

                return false;
            });
            setDoctors(filtered);
        } catch (error) {
            console.error('Failed to fetch department doctors:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-page bg-gradient animate-fade-in">
            <div className="container" style={{ maxWidth: '1200px' }}>
                
                {/* Back Navigation */}
                <button 
                    onClick={() => navigate('/services')}
                    className="btn btn-ghost"
                    style={{ marginBottom: '2rem', paddingLeft: 0, color: 'hsl(var(--muted-foreground))' }}
                >
                    <ArrowLeft size={18} /> Back to All Specialties
                </button>

                {/* 1. Hero Content */}
                <div className="glass-panel" style={{ padding: '4rem', marginBottom: '3rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ 
                        position: 'absolute', top: '-10%', right: '-5%', 
                        color: info.color, opacity: 0.05, transform: 'rotate(15deg) scale(4)' 
                    }}>
                        {info.icon}
                    </div>
                    
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ 
                            width: '80px', height: '80px', borderRadius: '1.5rem', 
                            background: info.color, color: 'white', display: 'flex', 
                            alignItems: 'center', justifyContent: 'center', marginBottom: '2rem',
                            boxShadow: `0 10px 30px ${info.color}44`
                        }}>
                            {info.icon}
                        </div>
                        <h1 style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
                            {department}
                        </h1>
                        <p style={{ fontSize: '1.25rem', color: 'hsl(var(--muted-foreground))', maxWidth: '800px', lineHeight: '1.6', fontWeight: '500' }}>
                            {info.longDesc}
                        </p>
                    </div>
                </div>

                <div className="dashboard-grid">
                    {/* Left Panel: Common Treatments */}
                    <div className="dashboard-main" style={{ gridColumn: 'span 4' }}>
                        <div className="card" style={{ padding: '2.5rem', height: '100%' }}>
                            <h3 className="widget-title" style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>
                                Clinical Protocols
                            </h3>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {info.treatments.map((t, idx) => (
                                    <div key={idx} className="glass-card" style={{ 
                                        padding: '1.25rem', display: 'flex', alignItems: 'center', 
                                        gap: '1rem', border: '1px solid hsl(var(--border) / 0.5)' 
                                    }}>
                                        <div style={{ 
                                            width: '8px', height: '8px', borderRadius: '50%', 
                                            background: info.color, boxShadow: `0 0 10px ${info.color}` 
                                        }}></div>
                                        <span style={{ fontWeight: '700', fontSize: '1rem' }}>{t}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ 
                                marginTop: '3rem', padding: '2rem', borderRadius: '1.5rem', 
                                background: 'hsl(var(--primary) / 0.05)', border: '1px dashed hsl(var(--primary) / 0.3)' 
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'hsl(var(--primary))', marginBottom: '0.75rem' }}>
                                    <Info size={18} />
                                    <span style={{ fontWeight: '800', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}>Telemetry Note</span>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', lineHeight: '1.5', margin: 0 }}>
                                    All treatments are integrated with our digital health vault for real-time monitoring and reporting.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Doctors List */}
                    <div className="dashboard-sidebar" style={{ gridColumn: 'span 8' }}>
                        <div className="card" style={{ padding: '2.5rem' }}>
                            <div className="card-header-flex" style={{ marginBottom: '2.5rem' }}>
                                <h3 className="widget-title" style={{ margin: 0 }}>
                                    Certified {department} Specialists
                                </h3>
                                <span style={{ 
                                    background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', 
                                    padding: '0.4rem 1rem', borderRadius: '1rem', fontWeight: '800', fontSize: '0.85rem' 
                                }}>
                                    {doctors.length} Experts Online
                                </span>
                            </div>

                            {loading ? (
                                <div style={{ display: 'grid', gap: '1.5rem' }}>
                                    {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '1.5rem' }}></div>)}
                                </div>
                            ) : doctors.length > 0 ? (
                                <div style={{ display: 'grid', gap: '1.5rem' }}>
                                    {doctors.map(doctor => (
                                        <div key={doctor.id} className="glass-card animate-slide-up" style={{ 
                                            padding: '1.5rem', display: 'flex', alignItems: 'center', 
                                            justifyContent: 'space-between', border: '1px solid hsl(var(--border) / 0.5)',
                                            transition: 'var(--transition)'
                                        }}>
                                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                                <div style={{ 
                                                    width: '80px', height: '80px', borderRadius: '1.25rem', 
                                                    background: 'hsl(var(--muted))', overflow: 'hidden',
                                                    border: '2px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                                }}>
                                                    {doctor.profile_picture ? (
                                                        <img 
                                                            src={api.getMediaUrl(doctor.profile_picture)} 
                                                            alt={doctor.doctor_name} 
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--primary))', fontWeight: '800', fontSize: '1.5rem' }}>
                                                            {doctor.doctor_name[0]}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 style={{ fontSize: '1.25rem', fontWeight: '900', margin: '0 0 0.4rem' }}>
                                                        Dr. {doctor.doctor_name}
                                                    </h4>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem', fontWeight: '600' }}>
                                                            <MapPin size={14} className="meta-icon-primary" />
                                                            {doctor.hospital_name || "Swasthya Setu Nexus"}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--primary))', fontSize: '0.9rem', fontWeight: '800' }}>
                                                            <Award size={14} />
                                                            {doctor.experience} Years Experience
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <button 
                                                className="btn btn-primary"
                                                style={{ padding: '1rem 1.75rem', borderRadius: '1.25rem', fontWeight: '800' }}
                                                onClick={() => navigate('/patient/search', { state: { doctor_id: doctor.id } })}
                                            >
                                                Book Appointment <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'hsl(var(--muted) / 0.3)', borderRadius: '2.5rem', border: '2px dashed hsl(var(--border))' }}>
                                    <Activity size={48} style={{ color: 'hsl(var(--muted-foreground))', opacity: 0.3, marginBottom: '1.5rem' }} />
                                    <h4 style={{ fontWeight: '800', marginBottom: '0.5rem' }}>Specialists Currently Offline</h4>
                                    <p style={{ color: 'hsl(var(--muted-foreground))' }}>We're currently synchronizing more experts for this department.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceDetail;
