import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
    Download, FileText, ChevronLeft, RotateCcw, ShieldCheck,
    Stethoscope, Clock, MapPin, Receipt
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ClinicalReceipts = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [receipts, setReceipts] = useState([]);

    useEffect(() => {
        fetchReceipts();
    }, []);

    const fetchReceipts = async () => {
        try {
            const response = await api.get('/clinical-receipts/');
            setReceipts(Array.isArray(response) ? response : []);
        } catch {
            console.error("Failed to fetch clinical receipts");
            alert("Unable to load receipts.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async (receipt) => {
        if (receipt.is_virtual_record) {
            window.open(api.getMediaUrl(`/media/${receipt.file_path}`), '_blank');
            return;
        }
        try {
            const blob = await api.getFile(`/clinical-receipts/${receipt.id}/pdf/`);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Clinical_Receipt_${receipt.receipt_number}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch {
            alert('Failed to generate PDF. Server is busy.');
        }
    };

    if (loading) {
        return (
            <div className="dashboard-page flex-center">
                <div className="telemetry-loader">
                    <RotateCcw className="animate-spin" size={48} />
                    <p>Loading Medical Records...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page bg-gradient animate-fade-in">
            <div className="container" style={{ maxWidth: '1200px' }}>

                <header className="dashboard-header" style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <button onClick={() => navigate('/patient')} className="btn btn-ghost" style={{ padding: '0.75rem', borderRadius: '1rem' }}>
                            <ChevronLeft size={24} />
                        </button>
                        <div className="header-badge">
                            <Receipt size={14} /> Clinical Invoices
                        </div>
                    </div>
                    <h1 className="header-title">Payment Receipts</h1>
                    <p className="header-subtitle">
                        Receipts and records from your hospital visits.
                    </p>
                </header>

                <div className="receipts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                    {(Array.isArray(receipts) && receipts.length > 0) ? receipts.map((receipt, idx) => (
                        <div key={idx} className="card receipt-card animate-slide-up" style={{
                            padding: '2rem',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '2rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.5rem',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'hsl(var(--primary))';
                                e.currentTarget.style.boxShadow = '0 20px 40px -20px hsl(var(--primary) / 0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'hsl(var(--border))';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div className="receipt-status-badge" style={{
                                position: 'absolute', top: '1.5rem', right: '1.5rem',
                                background: 'hsl(142, 70%, 95%)', color: 'hsl(142, 70%, 45%)',
                                padding: '0.4rem 0.8rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: '800'
                            }}>
                                COMPLETED
                            </div>

                            <div className="receipt-card-header">
                                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                    Receipt Number
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '900', color: 'hsl(var(--foreground))' }}>
                                    {receipt.receipt_number}
                                </div>
                            </div>

                            <div className="receipt-details">
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '1rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Stethoscope size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '1rem' }}>Dr. {receipt.doctor_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>{receipt.doctor_specialization}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="receipt-mini-info">
                                        <Clock size={12} style={{ opacity: 0.5 }} />
                                        <span>{receipt.discharge_date ? new Date(receipt.discharge_date).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    <div className="receipt-mini-info">
                                        <MapPin size={12} style={{ opacity: 0.5 }} />
                                        <span>{receipt.hospital_name || 'Main Campus'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="receipt-charges" style={{ background: 'hsl(var(--muted) / 0.3)', padding: '1.25rem', borderRadius: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>Consultation</span>
                                    <span style={{ fontWeight: '700' }}>₹{receipt.consultation_charges}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>Other Charges</span>
                                    <span style={{ fontWeight: '700' }}>₹{((receipt.medicine_charges || 0) + (receipt.procedure_charges || 0) + (receipt.other_charges || 0)).toFixed(2)}</span>
                                </div>
                                <div style={{ borderTop: '1px dashed hsl(var(--border))', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '800' }}>Total Paid</span>
                                    <span style={{ fontSize: '1.25rem', fontWeight: '900', color: 'hsl(var(--primary))' }}>₹{(receipt.total_amount || 0).toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', borderRadius: '1.25rem', padding: '1rem', gap: '0.75rem' }}
                                onClick={() => handleDownloadPDF(receipt)}
                            >
                                <Download size={18} /> {receipt.is_virtual_record ? 'View Digital Record' : 'Download Official PDF'}
                            </button>
                        </div>
                    )) : (
                        <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', background: 'transparent', border: '2px dashed hsl(var(--border))', borderRadius: '2rem' }}>
                            <FileText size={64} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                            <h3 style={{ fontWeight: '800', marginBottom: '0.5rem' }}>No Receipts Found</h3>
                            <p style={{ color: 'hsl(var(--muted-foreground))' }}>Your receipts will appear here after your appointment is finished.</p>
                        </div>
                    )}
                </div>

                <style>{`
                    .receipt-card { background: white; }
                    .receipt-mini-info { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: hsl(var(--muted-foreground)); font-weight: 700; }
                    .flex-center { display: flex; align-items: center; justify-content: center; min-height: 60vh; text-align: center; }
                    @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                    .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                `}</style>
            </div>
        </div>
    );
};

export default ClinicalReceipts;
