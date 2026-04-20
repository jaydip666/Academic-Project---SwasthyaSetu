import { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Mail, User, Clock, Search, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

const AdminInquiries = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const data = await api.get('/admin/inquiries/');
            setInquiries(data);
        } catch (error) {
            console.error('Error fetching inquiries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        setDeletingId(id);
        try {
            await api.delete(`/admin/inquiries/${id}/delete/`);
            setInquiries(inquiries.filter(inc => inc.inquiry_id !== id));
        } catch (error) {
            console.error('Error deleting inquiry:', error);
        } finally {
            setDeletingId(null);
        }
    };

    const filteredInquiries = inquiries.filter(inc =>
        inc.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard-page animate-fade-in" style={{ background: 'hsl(var(--background))' }}>
            <div className="container">
                <header className="dashboard-header-simple">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', padding: '0.5rem 1rem', borderRadius: '2rem', width: 'fit-content', marginBottom: '1.5rem', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                        <MessageSquare size={16} /> Customer Support
                    </div>
                    <h1 className="header-title-main">Public <span className="gradient-text">Inquiries</span></h1>
                    <p className="header-subtitle-main">View and manage messages from website visitors.</p>
                </header>

                <div className="glass-card" style={{ padding: '2rem', marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} size={20} />
                            <input
                                type="text"
                                placeholder="Search by name, email, or message content..."
                                className="form-input"
                                style={{ paddingLeft: '3rem', borderRadius: '1.5rem', background: 'hsl(var(--muted) / 0.5)' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div style={{ color: 'hsl(var(--muted-foreground))', fontWeight: '600' }}>
                            Total Records: {filteredInquiries.length}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '10rem 0' }}>
                        <Loader2 size={48} className="animate-spin" style={{ color: 'hsl(var(--primary))', margin: '0 auto' }} />
                        <p style={{ marginTop: '1.5rem', fontWeight: '600', color: 'hsl(var(--muted-foreground))' }}>Loading messages...</p>
                    </div>
                ) : filteredInquiries.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '6rem' }}>
                        <div style={{ background: 'hsl(var(--muted))', width: '80px', height: '80px', borderRadius: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', color: 'hsl(var(--muted-foreground))' }}>
                            <CheckCircle2 size={40} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>All Clear!</h3>
                        <p style={{ color: 'hsl(var(--muted-foreground))' }}>No messages found.</p>
                    </div>
                ) : (
                    <div className="stat-grid" style={{ gridTemplateColumns: '1fr' }}>
                        {filteredInquiries.map((inquiry) => (
                            <div key={inquiry.id} className="glass-card animate-slide-up" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                        <div style={{ width: '56px', height: '56px', borderRadius: '1.25rem', background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '1.2rem' }}>
                                            {inquiry.first_name[0]}{inquiry.last_name[0]}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{inquiry.first_name} {inquiry.last_name}</h3>
                                            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem', color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem', fontWeight: '600' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={14} /> {inquiry.email}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={14} /> {new Date(inquiry.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        className="btn-deny"
                                        onClick={() => handleDelete(inquiry.inquiry_id)}
                                        disabled={deletingId === inquiry.inquiry_id}
                                        style={{ background: 'hsl(var(--accent) / 0.1)', border: 'none' }}
                                    >
                                        {deletingId === inquiry.id ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <>Delete <Trash2 size={18} /></>
                                        )}
                                    </button>
                                </div>
                                <div style={{ background: 'hsl(var(--muted) / 0.3)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid hsl(var(--border))' }}>
                                    <p style={{ lineHeight: '1.7', color: 'hsl(var(--foreground))', fontWeight: '500' }}>{inquiry.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminInquiries;
