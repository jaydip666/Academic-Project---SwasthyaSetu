import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, Phone, FileText, Search, Filter, Activity, MessageSquare, ChevronRight, Zap, Heart } from 'lucide-react';

const MyPatients = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const response = await api.get('/appointments/');
            const appointmentList = Array.isArray(response) ? response : (response.appointments || []);
            const uniquePatients = {};
            appointmentList.forEach(apt => {
                if (!uniquePatients[apt.patient_id]) {
                    uniquePatients[apt.patient_id] = {
                        id: apt.patient_id,
                        name: apt.patient_name,
                        last_visit: apt.appointment_date,
                        total_visits: 0,
                        status: 'Active',
                        profile_picture: apt.patient_profile_picture
                    };
                }
                uniquePatients[apt.patient_id].total_visits += 1;
                if (new Date(apt.appointment_date) > new Date(uniquePatients[apt.patient_id].last_visit)) {
                    uniquePatients[apt.patient_id].last_visit = apt.appointment_date;
                }
            });
            setPatients(Object.values(uniquePatients));
        } catch (error) {
            console.error("Failed to fetch patients", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-gradient animate-fade-in" style={{ padding: '4rem 1.5rem', flex: 1 }}>
            <div className="container">
                <header style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', padding: '0.4rem 1rem', borderRadius: '2rem', marginBottom: '1.25rem', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Activity size={14} /> Patient List
                        </div>
                        <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem', fontWeight: '800' }}>My <span className="gradient-text">Patients</span></h1>
                        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1.2rem' }}>View and manage all your patients.</p>
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
                        <input
                            type="text"
                            placeholder="Find patient..."
                            className="input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '3rem', width: '320px', height: '54px', borderRadius: '1.25rem' }}
                        />
                    </div>
                </header>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton" style={{ height: '320px', borderRadius: '2rem' }}></div>)}
                    </div>
                ) : filteredPatients.length === 0 ? (
                    <div className="card" style={{ padding: '8rem 2rem', textAlign: 'center' }}>
                        <div style={{ background: 'hsl(var(--muted))', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem', color: 'hsl(var(--muted-foreground))' }}>
                            <Heart size={48} />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }}>No Patients Found</h2>
                        <p style={{ color: 'hsl(var(--muted-foreground))', maxWidth: '500px', margin: '0 auto' }}>You haven't seen any patients yet. Your booked appointments will appear here.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>
                        {filteredPatients.map(patient => (
                            <div key={patient.id} className="card animate-scale-in" style={{ padding: '0', overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
                                <div style={{ padding: '2.5rem', borderBottom: '1px solid hsl(var(--border))' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                            <div style={{
                                                width: '64px', height: '64px', borderRadius: '1.5rem',
                                                background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
                                                color: 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1.5rem', fontWeight: '900', boxShadow: '0 10px 20px hsl(var(--primary) / 0.2)',
                                                overflow: 'hidden'
                                            }}>
                                                {patient.profile_picture ? (
                                                    <img src={api.getMediaUrl(patient.profile_picture)} alt="Patient" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <>{patient.name[0]}</>
                                                )}
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{patient.name}</h3>
                                                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', fontWeight: '600' }}>ID: #{patient.id.slice(-6).toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <div style={{ padding: '0.4rem 0.8rem', background: 'hsl(142, 70%, 45% / 0.1)', color: 'hsl(142, 70%, 45%)', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' }}>
                                            {patient.status}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '2rem 2.5rem', display: 'grid', gap: '1.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: '600', fontSize: '0.9rem' }}>
                                            <Calendar size={16} /> Last Visit
                                        </div>
                                        <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{new Date(patient.last_visit).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: '600', fontSize: '0.9rem' }}>
                                            <FileText size={16} /> Total Reports
                                        </div>
                                        <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{patient.total_visits} Records</span>
                                    </div>
                                </div>

                                <div style={{ padding: '1.5rem 2.5rem', background: 'hsl(var(--muted) / 0.2)', display: 'flex', gap: '1rem' }}>
                                    <button
                                        className="btn btn-primary"
                                        style={{ flex: 2, height: '48px', borderRadius: '1rem', fontWeight: '800', fontSize: '0.85rem', gap: '0.5rem' }}
                                        onClick={() => navigate('/doctor/records', { state: { patientId: patient.id, patientName: patient.name } })}
                                    >
                                        <Zap size={16} /> History
                                    </button>
                                    <button className="btn btn-outline" style={{ flex: 1, height: '48px', borderRadius: '1rem', background: 'white' }}>
                                        <MessageSquare size={18} />
                                    </button>
                                    <button
                                        className="btn btn-outline"
                                        style={{ width: '48px', height: '48px', borderRadius: '1rem', padding: '0', background: 'white' }}
                                        onClick={() => navigate('/doctor/records', { state: { patientId: patient.id, patientName: patient.name } })}
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyPatients;
