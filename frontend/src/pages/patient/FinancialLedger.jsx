import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
    Download, FileText, TrendingUp, CreditCard, Banknote,
    ChevronLeft, RotateCcw, ShieldCheck, Zap, Activity,
    Search, Filter, Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FinancialLedger = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ patient_name: '', patient_id: '', ledger: [] });
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [doctorSearch, setDoctorSearch] = useState('');

    useEffect(() => {
        fetchLedger();
    }, []);

    const fetchLedger = async () => {
        try {
            const response = await api.get('/patient/ledger/');
            setData(response);
        } catch (error) {
            console.error("Failed to fetch financial ledger", error);
            if (error.data?.nexus_code === 'NP-404') {
                alert('Error: Your patient profile is missing. Please contact support.');
            } else {
                alert(`${error.message || 'Connection Error'}: Unable to load payment history.`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async (txnId = null) => {
        try {
            const endpoint = txnId
                ? `/patient/ledger/pdf/?txn_id=${txnId}`
                : `/patient/ledger/pdf/?payment_type=${paymentFilter}&doctor_name=${encodeURIComponent(doctorSearch)}`;
            const blob = await api.getFile(endpoint);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = txnId ? `Receipt_${txnId}.pdf` : `Ledger_${data.patient_name}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert('Failed to generate statement. Server is busy.');
        }
    };

    const totalPaid = data.ledger.reduce((sum, item) => sum + item.total, 0);
    const totalTax = data.ledger.reduce((sum, item) => sum + item.tax, 0);

    const filteredLedger = data.ledger.filter(item => {
        const matchesType = paymentFilter === 'all' || item.method.toLowerCase() === paymentFilter.toLowerCase();
        const matchesDoctor = item.doctor_name.toLowerCase().includes(doctorSearch.toLowerCase());
        return matchesType && matchesDoctor;
    });

    const cashSummary = filteredLedger.reduce((sum, item) => item.method.toLowerCase() === 'cash' ? sum + item.total : sum, 0);
    const onlineSummary = filteredLedger.reduce((sum, item) => item.method.toLowerCase() === 'online' ? sum + item.total : sum, 0);

    if (loading) {
        return (
            <div className="dashboard-page flex-center">
                <div className="telemetry-loader">
                    <RotateCcw className="animate-spin" size={48} />
                    <p>Loading Payment History...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page bg-gradient animate-fade-in">
            <div className="container" style={{ maxWidth: 'none', width: '98%' }}>

                {/* Header */}
                <header className="dashboard-header" style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <button
                            onClick={() => navigate('/patient')}
                            className="btn btn-ghost"
                            style={{ padding: '0.75rem', borderRadius: '1rem' }}
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div className="header-badge">
                            <ShieldCheck size={14} /> Payment History
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <h1 className="header-title">My Payments</h1>
                            <p className="header-subtitle">
                                Complete list of all your appointments and payments for <strong>{data.patient_name}</strong> (ID: {data.patient_id})
                            </p>
                        </div>
                        <button
                            className="btn btn-primary animate-pulse-subtle"
                            style={{ gap: '0.75rem', padding: '1.25rem 2rem', borderRadius: '1.5rem' }}
                            onClick={() => handleDownloadPDF()}
                        >
                            <Download size={20} /> Download Statement (PDF)
                        </button>
                    </div>
                </header>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                    <LedgerStat
                        label="Total Amount Paid"
                        value={`₹${totalPaid.toLocaleString()}`}
                        icon={<TrendingUp size={24} />}
                        color="hsl(var(--primary))"
                    />
                    <LedgerStat
                        label="Top Department"
                        value={
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'hsl(var(--foreground))' }}>
                                    {data.top_department ? data.top_department.name : 'N/A'}
                                </span>
                                <span style={{ fontSize: '1rem', color: 'hsl(var(--primary))' }}>
                                    {data.top_department ? `₹${data.top_department.amount.toLocaleString()}` : '₹0'}
                                </span>
                            </div>
                        }
                        icon={<Building2 size={24} />}
                        color="hsl(280, 70%, 50%)"
                    />
                    <LedgerStat
                        label="Total Appointments"
                        value={data.ledger.length}
                        icon={<FileText size={24} />}
                        color="hsl(var(--secondary))"
                    />
                </div>

                {/* Payment List */}
                <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '2rem', border: '1px solid hsl(var(--border))' }}>
                    <div style={{ padding: '2rem', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--muted) / 0.3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1.25rem' }}>Payment Details</h3>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'hsl(var(--background))', padding: '0.65rem 1rem', borderRadius: '1rem', border: '1px solid hsl(var(--border))' }}>
                                    <Search size={18} color="hsl(var(--muted-foreground))" style={{ marginRight: '0.5rem' }} />
                                    <input 
                                        type="text" 
                                        placeholder="Search by doctor name..." 
                                        value={doctorSearch}
                                        onChange={e => setDoctorSearch(e.target.value)}
                                        style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '220px', fontWeight: '600' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', background: 'hsl(var(--background))', borderRadius: '1rem', border: '1px solid hsl(var(--border))', overflow: 'hidden' }}>
                                    {['all', 'cash', 'online'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setPaymentFilter(type)}
                                            style={{
                                                padding: '0.65rem 1.25rem',
                                                background: paymentFilter === type ? 'hsl(var(--primary))' : 'transparent',
                                                color: paymentFilter === type ? 'white' : 'hsl(var(--muted-foreground))',
                                                border: 'none',
                                                fontWeight: paymentFilter === type ? '700' : '600',
                                                fontSize: '0.8rem',
                                                textTransform: 'capitalize',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            {type === 'cash' && <Banknote size={14} />}
                                            {type === 'online' && <CreditCard size={14} />}
                                            {type === 'all' && <Filter size={14} />}
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '2rem' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Banknote size={16} color="hsl(var(--primary))" /> Cash: <span style={{ color: 'hsl(var(--foreground))' }}>₹{cashSummary.toFixed(2)}</span>
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CreditCard size={16} color="hsl(var(--primary))" /> Online: <span style={{ color: 'hsl(var(--foreground))' }}>₹{onlineSummary.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                                    <th style={tableHeadStyle}>Date & Time</th>
                                    <th style={tableHeadStyle}>Receipt No.</th>
                                    <th style={tableHeadStyle}>Doctor</th>
                                    <th style={tableHeadStyle}>Payment Method</th>
                                    <th style={tableHeadStyle}>Subtotal</th>
                                    <th style={tableHeadStyle}>GST (18%)</th>
                                    <th style={tableHeadStyle}>Total</th>
                                    <th style={{ ...tableHeadStyle, textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLedger.length > 0 ? filteredLedger.map((item, idx) => (
                                    <tr key={idx} style={{
                                        borderBottom: '1px solid hsl(var(--border))',
                                        transition: 'background 0.2s'
                                    }}
                                        className="ledger-row"
                                    >
                                        <td style={tableCellStyle}>
                                            <div style={{ fontWeight: '700' }}>{item.date.split(' ')[0]}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>{item.date.split(' ')[1]}</div>
                                        </td>
                                        <td style={{ ...tableCellStyle, fontFamily: 'monospace', fontSize: '0.8rem', opacity: 0.7 }}>
                                            {item.transaction_id}
                                        </td>
                                        <td style={tableCellStyle}>
                                            <div style={{ fontWeight: '800' }}>Dr. {item.doctor_name}</div>
                                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'hsl(var(--primary))' }}>{item.doctor_specialty}</div>
                                        </td>
                                        <td style={tableCellStyle}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                                padding: '0.3rem 0.6rem', borderRadius: '0.6rem',
                                                background: 'hsl(var(--muted)/0.5)', fontSize: '0.7rem', fontWeight: '800'
                                            }}>
                                                {item.method === 'CASH' ? <Banknote size={12} /> : <CreditCard size={12} />}
                                                {item.method}
                                            </span>
                                        </td>
                                        <td style={tableCellStyle}>₹{item.subtotal.toFixed(2)}</td>
                                        <td style={tableCellStyle}>₹{item.tax.toFixed(2)}</td>
                                        <td style={{ ...tableCellStyle, fontWeight: '900', color: 'hsl(var(--primary))' }}>
                                            ₹{item.total.toFixed(2)}
                                        </td>
                                        <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleDownloadPDF(item.transaction_id)}
                                                className="btn btn-ghost"
                                                style={{ padding: '0.5rem', borderRadius: '0.75rem', color: 'hsl(var(--primary))' }}
                                                title="Download Receipt"
                                            >
                                                <Download size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="7" style={{ padding: '4rem', textAlign: 'center' }}>
                                            <Zap size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                            <p style={{ color: 'hsl(var(--muted-foreground))', fontWeight: '600' }}>No payment history found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <style>{`
                    .flex-center { display: flex; align-items: center; justifyContent: center; minHeight: 60vh; text-align: center; }
                    .ledger-row:hover { background: hsl(var(--primary) / 0.02); }
                    .ledger-row:last-child { border-bottom: none; }
                    @keyframes pulse-subtle {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.02); }
                        100% { transform: scale(1); }
                    }
                    .animate-pulse-subtle { animation: pulse-subtle 3s infinite ease-in-out; }
                `}</style>
            </div>
        </div>
    );
};

const LedgerStat = ({ label, value, icon, color }) => (
    <div className="card" style={{ padding: '2rem', border: '1px solid hsl(var(--border))', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.03, transform: 'scale(2)' }}>{icon}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{
                width: '44px', height: '44px', borderRadius: '1rem', background: `${color}10`, color: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                {icon}
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
            </span>
        </div>
        <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'hsl(var(--foreground))' }}>{value}</div>
    </div>
);

const tableHeadStyle = {
    padding: '1.25rem 2rem',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: '800',
    color: 'hsl(var(--muted-foreground))',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
};

const tableCellStyle = {
    padding: '1.5rem 2rem',
    fontSize: '0.9rem',
    fontWeight: '600'
};

export default FinancialLedger;
