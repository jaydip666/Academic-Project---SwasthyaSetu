import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FileText, Users, Calendar, TrendingUp, CreditCard, Activity, ArrowUpRight, UserCircle, Filter, UserPlus, Download, Star } from 'lucide-react';

const AdminAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exportingPDF, setExportingPDF] = useState(false);
    const [filters, setFilters] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate()
    });
    const [growthType, setGrowthType] = useState('monthly');
    const [doctorBreakdownDate, setDoctorBreakdownDate] = useState('');
    const [doctorBreakdownData, setDoctorBreakdownData] = useState([]);

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    const months = [
        { value: 1, label: 'January' }, { value: 2, label: 'February' },
        { value: 3, label: 'March' }, { value: 4, label: 'April' },
        { value: 5, label: 'May' }, { value: 6, label: 'June' },
        { value: 7, label: 'July' }, { value: 8, label: 'August' },
        { value: 9, label: 'September' }, { value: 10, label: 'October' },
        { value: 11, label: 'November' }, { value: 12, label: 'December' }
    ];

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const query = new URLSearchParams(filters).toString();
                const res = await api.get(`/admin/analytics/?${query}`);
                setData(res);
                if (!doctorBreakdownDate) {
                    setDoctorBreakdownData(res?.revenue?.breakdown || []);
                }
            } catch (err) {
                console.error("Failed to fetch analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [filters, doctorBreakdownDate]);

    useEffect(() => {
        if (doctorBreakdownDate) {
            const [y, m, d] = doctorBreakdownDate.split('-');
            const query = new URLSearchParams({ year: y, month: m, day: d }).toString();
            api.get(`/admin/analytics/?${query}`).then(res => {
                setDoctorBreakdownData(res?.revenue?.breakdown || []);
            }).catch(e => console.error("Failed to fetch specific breakdown date", e));
        } else if (data) {
            setDoctorBreakdownData(data?.revenue?.breakdown || []);
        }
    }, [doctorBreakdownDate, data]);

    const handleExportPDF = async () => {
        setExportingPDF(true);
        try {
            const query = new URLSearchParams(filters).toString();
            // Using unified api.getFile for host-aware resolution and credentials
            const blob = await api.getFile(`/admin/analytics/pdf/?${query}`);

            if (!blob) throw new Error('Failed to download report');

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Medical_Report_${filters.year}_${filters.month || 'ALL'}_${filters.day || 'ALL'}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Export failed", err);
            const errMsg = err.message || "Unknown error";
            const errData = err.data?.error || err.data?.detail || "";
            alert(`Export failed.\nError: ${errMsg}\n${errData}`);
        } finally {
            setExportingPDF(false);
        }
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => {
            const next = { ...prev, [name]: value };

            // If month or year changes, check if the currently selected day is valid
            if (name === 'month' || name === 'year') {
                if (next.month && next.day) {
                    const maxDays = new Date(next.year, next.month, 0).getDate();
                    if (next.day > maxDays) {
                        next.day = ''; // Reset to entire month
                    }
                }
            }

            return next;
        });
    };

    return (
        <div className="dashboard-page bg-gradient animate-fade-in" style={{ padding: '4rem 1.5rem', flex: 1 }}>
            <div className="container">
                <header style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', padding: '0.4rem 1rem', borderRadius: '2rem', marginBottom: '1.25rem', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Activity size={14} /> System Monitoring
                        </div>
                        <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem', fontWeight: '800' }}>System <span className="gradient-text">Analytics</span></h1>
                        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1.2rem' }}>Detailed system and financial reports.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                            className="btn btn-primary"
                            onClick={handleExportPDF}
                            disabled={exportingPDF || loading}
                            style={{ padding: '0 1.5rem', height: '48px', borderRadius: '1rem', gap: '0.75rem', fontWeight: '800' }}
                        >
                            {exportingPDF ? <Activity size={18} className="animate-spin" /> : <Download size={18} />}
                            {exportingPDF ? 'Compiling PDF...' : 'Export PDF'}
                        </button>

                        <div className="card" style={{ padding: '0.75rem', borderRadius: '1.5rem', display: 'flex', gap: '0.75rem', border: '1px solid hsl(var(--border))', marginBottom: 0 }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <select
                                    className="input"
                                    value={filters.year}
                                    onChange={e => handleFilterChange('year', e.target.value)}
                                    style={{ height: '48px', borderRadius: '1rem', width: '120px', fontSize: '0.9rem', fontWeight: '700' }}
                                >
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <select
                                    className="input"
                                    value={filters.month}
                                    onChange={e => handleFilterChange('month', e.target.value)}
                                    style={{ height: '48px', borderRadius: '1rem', width: '150px', fontSize: '0.9rem', fontWeight: '700' }}
                                >
                                    <option value="">Entire Year</option>
                                    {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <select
                                    className="input"
                                    value={filters.day}
                                    onChange={e => handleFilterChange('day', e.target.value)}
                                    disabled={!filters.month}
                                    style={{ height: '48px', borderRadius: '1rem', width: '120px', fontSize: '0.9rem', fontWeight: '700' }}
                                >
                                    <option value="">Entire Month</option>
                                    {Array.from(
                                        { length: filters.month ? new Date(filters.year, filters.month, 0).getDate() : 31 },
                                        (_, i) => (
                                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                                        )
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="stat-grid" style={{ marginBottom: '3rem' }}>
                        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '180px', borderRadius: '2rem' }}></div>)}
                    </div>
                ) : (
                    <>
                        <div className="stat-grid" style={{ marginBottom: '3rem' }}>
                            <AnalyticsCard
                                label="Total Users"
                                value={data?.user_stats?.total}
                                icon={<TrendingUp size={24} />}
                                color="hsl(var(--primary))"
                                trend="+8.4%"
                            />
                            <AnalyticsCard
                                label="New Patients"
                                value={data?.registrations?.patients}
                                icon={<Users size={24} />}
                                color="hsl(var(--secondary))"
                                trend="+12.5%"
                            />
                            <AnalyticsCard
                                label="New Doctors"
                                value={data?.registrations?.doctors}
                                icon={<UserPlus size={24} />}
                                color="hsl(280, 70%, 55%)"
                                trend="+3.2%"
                            />
                            <AnalyticsCard
                                label="Appointments"
                                value={data?.appointments}
                                icon={<Calendar size={24} />}
                                color="hsl(45, 93%, 47%)"
                                trend="+24.8%"
                            />
                            <AnalyticsCard
                                label="Revenue Yield"
                                value={`₹${(data?.revenue?.total || 0).toLocaleString()}`}
                                icon={<CreditCard size={24} />}
                                color="hsl(142, 70%, 45%)"
                                trend="+18.4%"
                            />
                            {/* Average Ratings */}
                            <AnalyticsCard
                                label="Avg Doctor Rating"
                                value={data?.ratings?.overall_doctor_avg ? data.ratings.overall_doctor_avg.toFixed(1) : 'N/A'}
                                icon={<Star size={24} />}
                                color="hsl(var(--secondary))"
                                trend=""
                            />
                            <AnalyticsCard
                                label="Avg Hospital Rating"
                                value={data?.ratings?.overall_hospital_avg ? data.ratings.overall_hospital_avg.toFixed(1) : 'N/A'}
                                icon={<Star size={24} />}
                                color="hsl(var(--primary))"
                                trend=""
                            />
                        </div>

                        <div className="dashboard-grid" style={{ marginBottom: '3rem' }}>
                            <div className="dashboard-main" style={{ gridColumn: 'span 12' }}>
                                <div className="card" style={{ padding: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                                        <div>
                                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>User Growth</h2>
                                            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>Total users and new accounts.</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', background: 'hsl(var(--muted))', padding: '0.4rem', borderRadius: '1rem' }}>
                                            <button
                                                onClick={() => setGrowthType('monthly')}
                                                style={{
                                                    padding: '0.5rem 1.25rem', borderRadius: '0.75rem', border: 'none', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer',
                                                    background: growthType === 'monthly' ? 'hsl(var(--card))' : 'transparent',
                                                    color: growthType === 'monthly' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                                    boxShadow: growthType === 'monthly' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >Monthly</button>
                                            <button
                                                onClick={() => setGrowthType('yearly')}
                                                style={{
                                                    padding: '0.5rem 1.25rem', borderRadius: '0.75rem', border: 'none', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer',
                                                    background: growthType === 'yearly' ? 'hsl(var(--card))' : 'transparent',
                                                    color: growthType === 'yearly' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                                    boxShadow: growthType === 'yearly' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >Yearly</button>
                                        </div>
                                    </div>

                                    <div style={{ height: '350px', width: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '2%', paddingBottom: '2.5rem' }}>
                                        {/* Chart Lines */}
                                        <div style={{ position: 'absolute', top: 0, bottom: '2.5rem', left: 0, right: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                                            {[1, 2, 3, 4].map(i => <div key={i} style={{ width: '100%', height: '1px', background: 'hsl(var(--border) / 0.5)' }}></div>)}
                                        </div>

                                        {(() => {
                                            const growthData = (growthType === 'monthly' ? data?.user_stats?.monthly_growth : data?.user_stats?.yearly_growth) || [];
                                            const max = Math.max(...growthData.map(d => d.count), 1);
                                            return growthData.map((item, idx) => {
                                                const height = (item.count / max) * 100;
                                                return (
                                                    <div key={idx} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' }}>
                                                        <div
                                                            className="chart-bar"
                                                            style={{
                                                                width: '60%',
                                                                height: `${height}%`,
                                                                background: 'linear-gradient(to top, hsl(var(--primary)), hsl(var(--secondary)))',
                                                                borderRadius: '0.5rem 0.5rem 0 0',
                                                                position: 'relative',
                                                                transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                cursor: 'help'
                                                            }}
                                                        >
                                                            <div className="bar-tooltip" style={{
                                                                position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)',
                                                                background: 'hsl(var(--foreground))', color: 'hsl(var(--background))',
                                                                padding: '0.4rem 0.8rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: '800',
                                                                whiteSpace: 'nowrap', opacity: 0, transition: 'opacity 0.2s', pointerEvents: 'none'
                                                            }}>
                                                                {item.count} Registrations
                                                            </div>
                                                        </div>
                                                        <div style={{ position: 'absolute', bottom: '-1.5rem', fontSize: '0.7rem', fontWeight: '700', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>
                                                            {item.label}
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="dashboard-grid">
                            <div className="dashboard-main" style={{ gridColumn: 'span 12' }}>
                                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                                    <div style={{ padding: '2rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div>
                                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Doctor Revenue Breakdown</h2>
                                            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.9rem' }}>Money earned by each doctor for the selected period.</p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', padding: '0.5rem 1rem', borderRadius: '1rem' }}>
                                                <Calendar size={16} className="text-muted" />
                                                <input
                                                    type="date"
                                                    value={doctorBreakdownDate}
                                                    onChange={e => setDoctorBreakdownDate(e.target.value)}
                                                    className="input"
                                                    style={{ border: 'none', background: 'transparent', height: 'auto', padding: 0, outline: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700', fontSize: '0.85rem' }}
                                                />
                                            </div>
                                            <div style={{ padding: '0.75rem 1.25rem', background: 'hsl(var(--muted))', borderRadius: '1rem', fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <TrendingUp size={16} /> Data Verified
                                            </div>
                                        </div>
                                    </div>

                                    <div className="table-wrapper-responsive" style={{ padding: '1rem' }}>
                                        <table className="admin-custom-table" style={{ border: 'none' }}>
                                            <thead>
                                                <tr>
                                                    <th>Doctor Name</th>
                                                    <th>Hospital Name</th>
                                                    <th style={{ textAlign: 'center' }}>Consultations</th>
                                                    <th style={{ textAlign: 'right' }}>Revenue Share</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {doctorBreakdownData.length > 0 ? (
                                                    doctorBreakdownData.map((row, idx) => (
                                                        <tr key={idx}>
                                                            <td>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                        <UserCircle size={20} />
                                                                    </div>
                                                                    <span style={{ fontWeight: '700' }}>Dr. {row.name}</span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span style={{ fontWeight: '600', color: 'hsl(var(--muted-foreground))' }}>{row.hospital_name || 'N/A'}</span>
                                                            </td>
                                                            <td style={{ textAlign: 'center', fontWeight: '800' }}>{row.count}</td>
                                                            <td style={{ textAlign: 'right', fontWeight: '800', color: 'hsl(142, 70%, 45%)' }}>₹{(row.amount || 0).toLocaleString()}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="4" style={{ textAlign: 'center', padding: '4rem', color: 'hsl(var(--muted-foreground))' }}>
                                                            No transaction data found for the selected time.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </>
                )}
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                .chart-bar:hover { filter: brightness(1.2); }
                .chart-bar:hover .bar-tooltip { opacity: 1 !important; }
                .dashboard-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 2rem; }
            `}} />
        </div>
    );
};

const AnalyticsCard = ({ label, value, icon, color, trend }) => (
    <div className="card animate-slide-up" style={{
        padding: '2rem',
        borderLeft: `4px solid ${color}`,
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div style={{
                width: '48px', height: '48px', borderRadius: '1rem',
                background: `${color}15`, color: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                {icon}
            </div>
            <div style={{
                fontSize: '0.75rem', fontWeight: '800', padding: '0.25rem 0.6rem',
                borderRadius: '0.5rem', background: '#22c55e10', color: '#22c55e',
                display: 'flex', alignItems: 'center', gap: '0.25rem'
            }}>
                <ArrowUpRight size={12} /> {trend}
            </div>
        </div>
        <div>
            <h3 style={{ fontSize: '2rem', fontWeight: '900', color: 'hsl(var(--foreground))', marginBottom: '0.25rem' }}>{value || 0}</h3>
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        </div>
    </div>
);

export default AdminAnalytics;
