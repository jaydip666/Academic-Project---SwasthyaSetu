import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
    TrendingUp, Calendar, Clock, User,
    ArrowUpRight, Download, BarChart2, Activity,
    ChevronLeft, Banknote, Zap, ShieldCheck, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DoctorEarnings = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [chartView, setChartView] = useState('monthly'); // 'daily', 'monthly', 'yearly'
    const [patientFilter, setPatientFilter] = useState('');

    useEffect(() => {
        fetchEarnings();
    }, [patientFilter]);

    const fetchEarnings = async () => {
        try {
            const query = patientFilter ? `?patient=${encodeURIComponent(patientFilter)}` : '';
            const response = await api.get(`/doctor/earnings/${query}`);
            setData(response);
        } catch (error) {
            console.error("Failed to fetch earnings analysis", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPdf = () => {
        const query = patientFilter ? `?patient=${encodeURIComponent(patientFilter)}` : '';
        window.open(`${window.location.protocol}//${window.location.hostname}:8000/api/doctor/earnings/pdf/${query}`, '_blank');
    };

    if (loading) {
        return (
            <div className="dashboard-page flex-center">
                <div className="telemetry-loader">
                    <Zap className="animate-spin" size={48} />
                    <p>Loading Earnings...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const currentChartData = chartView === 'daily'
        ? data.time_series_daily
        : chartView === 'yearly'
            ? data.time_series_yearly
            : data.time_series_monthly;

    return (
        <div className="dashboard-page bg-gradient animate-fade-in">
            <div className="container" style={{ maxWidth: '1400px' }}>

                {/* 1. Header Area */}
                <header className="dashboard-header" style={{ marginBottom: '3.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <button
                            onClick={() => navigate('/doctor')}
                            className="btn btn-ghost"
                            style={{ padding: '0.75rem', borderRadius: '1rem' }}
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div className="header-badge">
                            <ShieldCheck size={14} /> Earnings Records
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <h1 className="header-title">My <span className="gradient-text">Earnings</span></h1>
                            <p className="header-subtitle">
                                View your total earnings and appointment history.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            <button onClick={handleExportPdf} className="btn btn-outline" style={{ borderRadius: '1rem', height: '44px', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1.5rem' }}>
                                <Download size={18} /> Download Report
                            </button>
                        </div>
                    </div>
                </header>

                {/* 2. My Stats */}
                <div className="metrics-grid" style={{ marginBottom: '4rem' }}>
                    <EarningsStat
                        label="Total Earnings"
                        value={`₹ ${data.metrics.total_lifetime_revenue.toLocaleString()}`}
                        icon={<TrendingUp />}
                        color="hsl(var(--primary))"
                        trend="Overall income"
                    />
                    <EarningsStat
                        label="Current Year"
                        value={`₹ ${data.metrics.current_year_revenue.toLocaleString()}`}
                        icon={<BarChart2 />}
                        color="hsl(var(--secondary))"
                        trend="Year to Date"
                    />
                    <EarningsStat
                        label="Current Month"
                        value={`₹ ${data.metrics.current_month_revenue.toLocaleString()}`}
                        icon={<Activity />}
                        color="#10b981"
                        trend="On pace for growth"
                    />
                    <EarningsStat
                        label="Today's Revenue"
                        value={`₹ ${data.metrics.current_day_revenue.toLocaleString()}`}
                        icon={<Clock />}
                        color="hsl(25, 95%, 50%)"
                        trend="Generated Today"
                    />
                </div>

                {/* Grid Container for Breakdowns */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2.5rem', marginBottom: '2.5rem' }}>

                    {/* 3. Earnings Breakdown */}
                    <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '2.5rem', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <TrendingUp size={24} color="hsl(var(--secondary))" /> Revenue Breakdown
                            </h2>
                            <div style={{ display: 'flex', gap: '0.5rem', background: 'hsl(var(--muted) / 0.5)', padding: '0.35rem', borderRadius: '0.85rem' }}>
                                <button className={`btn-ghost ${chartView === 'daily' ? 'active-tab' : ''}`} onClick={() => setChartView('daily')} style={tabStyle(chartView === 'daily')}>Daily</button>
                                <button className={`btn-ghost ${chartView === 'monthly' ? 'active-tab' : ''}`} onClick={() => setChartView('monthly')} style={tabStyle(chartView === 'monthly')}>Monthly</button>
                                <button className={`btn-ghost ${chartView === 'yearly' ? 'active-tab' : ''}`} onClick={() => setChartView('yearly')} style={tabStyle(chartView === 'yearly')}>Yearly</button>
                            </div>
                        </div>


                        <div className="table-responsive" style={{ flex: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid hsl(var(--border) / 0.5)' }}>
                                        <th style={tableHeadStyle}>Period</th>
                                        <th style={{ ...tableHeadStyle, textAlign: 'right' }}>Revenue Generated</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentChartData.length === 0 ? (
                                        <tr><td colSpan="2" style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--muted-foreground))' }}>No data for this timeframe.</td></tr>
                                    ) : (
                                        currentChartData.map((item, idx) => (
                                            <tr key={idx} className="ledger-row" style={{ borderBottom: '1px solid hsl(var(--border) / 0.3)' }}>
                                                <td style={{ ...tableCellStyle, fontWeight: '800' }}>{item.period}</td>
                                                <td style={{ ...tableCellStyle, textAlign: 'right', color: 'hsl(var(--secondary))', fontWeight: '800' }}>₹{Number(item.amount).toFixed(2)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 4. Patient-Wise Breakdown */}
                    <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '2.5rem', display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Users size={24} color="#10b981" /> Earnings by Patient
                        </h2>

                        <div className="table-responsive" style={{ flex: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid hsl(var(--border) / 0.5)' }}>
                                        <th style={tableHeadStyle}>Patient Name</th>
                                        <th style={{ ...tableHeadStyle, textAlign: 'right' }}>Total Contribution</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.patient_revenue.length === 0 ? (
                                        <tr><td colSpan="2" style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--muted-foreground))' }}>No patient data recorded yet.</td></tr>
                                    ) : (
                                        data.patient_revenue.map((patient, idx) => (
                                            <tr key={idx} className="ledger-row" style={{ borderBottom: '1px solid hsl(var(--border) / 0.3)' }}>
                                                <td style={{ ...tableCellStyle, fontWeight: '800' }}>{patient.name}</td>
                                                <td style={{ ...tableCellStyle, textAlign: 'right', color: '#10b981', fontWeight: '800' }}>₹{Number(patient.amount).toFixed(2)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {/* 5. High-Fidelity Ledger */}
                <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '2.5rem', marginBottom: '4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Banknote size={24} color="hsl(var(--primary))" /> Payments
                        </h2>
                    </div>

                    <div className="table-responsive">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid hsl(var(--border) / 0.5)' }}>
                                    <th style={tableHeadStyle}>Transaction ID</th>
                                    <th style={tableHeadStyle}>Patient</th>
                                    <th style={tableHeadStyle}>Date</th>
                                    <th style={tableHeadStyle}>Amount</th>
                                    <th style={tableHeadStyle}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.financial_ledger.length === 0 ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--muted-foreground))' }}>Registry is empty.</td></tr>
                                ) : (
                                    data.financial_ledger.map((txn, idx) => (
                                        <tr key={idx} className="ledger-row" style={{ borderBottom: '1px solid hsl(var(--border) / 0.3)' }}>
                                            <td style={tableCellStyle}>
                                                <code style={{ fontSize: '0.75rem', background: 'hsl(var(--muted))', padding: '0.4rem 0.6rem', borderRadius: '0.4rem', color: 'hsl(var(--foreground))' }}>
                                                    {txn.txn_id !== 'N/A' ? txn.txn_id.slice(0, 16) + '...' : 'CASH-SETTLED'}
                                                </code>
                                            </td>
                                            <td style={tableCellStyle}>{txn.patient}</td>
                                            <td style={tableCellStyle}>{txn.date}</td>
                                            <td style={{ ...tableCellStyle, color: 'hsl(var(--primary))', fontWeight: '800' }}>₹{Number(txn.amount).toFixed(2)}</td>
                                            <td style={tableCellStyle}>
                                                <span className={`badge ${txn.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                                                    {txn.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <style>{`
                    .earnings-stat-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px hsl(var(--primary) / 0.1); }
                    .metrics-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 2.5rem;
                    }
                    @media (min-width: 1024px) {
                        .metrics-grid {
                            grid-template-columns: repeat(2, 1fr);
                        }
                    }
                    .chart-bar-container:hover .chart-tooltip { opacity: 1; }
                    .chart-tooltip {
                        position: absolute;
                        top: -35px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: hsl(var(--foreground));
                        color: hsl(var(--background));
                        padding: 0.4rem 0.75rem;
                        border-radius: 0.5rem;
                        font-size: 0.75rem;
                        font-weight: 800;
                        opacity: 0;
                        transition: all 0.2s ease;
                        white-space: nowrap;
                        pointer-events: none;
                        z-index: 10;
                        box-shadow: var(--shadow-md);
                    }
                    .ledger-row:hover { background: hsl(var(--primary) / 0.02); }
                `}</style>
            </div>
        </div>
    );
};

const EarningsStat = ({ label, value, icon, color, trend }) => (
    <div className="card earnings-stat-card" style={{ padding: '2.5rem', border: '1px solid hsl(var(--border) / 0.5)', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', background: 'white' }}>
        <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.04, transform: 'scale(2.5)', color: color }}>{icon}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
            <div style={{
                width: '52px', height: '52px', borderRadius: '1.25rem', background: `${color}15`, color: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 16px ${color}10`
            }}>
                {React.cloneElement(icon, { size: 24 })}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
            </span>
        </div>
        <div style={{ fontSize: '2.75rem', fontWeight: '900', color: 'hsl(var(--foreground))', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ padding: '0.2rem', background: '#10b98115', borderRadius: '50%', display: 'flex' }}>
                <ArrowUpRight size={14} />
            </div>
            {trend}
        </div>
    </div>
);


const tabStyle = (isActive) => ({
    padding: '0.4rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
    fontWeight: '800',
    background: isActive ? 'hsl(var(--background))' : 'transparent',
    color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s'
});

const tableHeadStyle = {
    padding: '1.25rem 1.5rem',
    textAlign: 'left',
    fontSize: '0.7rem',
    fontWeight: '800',
    color: 'hsl(var(--muted-foreground))',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
};

const tableCellStyle = {
    padding: '1.25rem 1.5rem',
    fontSize: '0.85rem',
    fontWeight: '600'
};

export default DoctorEarnings;
