// ================= FRONTEND FILE =================
// File: Navbar.jsx
// Purpose: Primary navigation component across all application modules
// Handles: User profile dropdown, notification center, and module-specific navigation links

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, User, LogOut, ChevronDown, LayoutDashboard, Settings, Bell, Search, Menu, X } from 'lucide-react';
import { api } from '../services/api';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const notifRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000); // 30s poll
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const data = await api.get('/notifications/');
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.post(`/notifications/${id}/read/`);
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/notifications/read-all/');
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo */}
                <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
                        padding: '0.5rem',
                        borderRadius: '0.75rem',
                        color: 'white',
                        display: 'flex',
                        boxShadow: '0 4px 12px hsl(var(--primary) / 0.3)'
                    }}>
                        <Activity size={24} />
                    </div>
                    <span className="logo-text">Swasthya Setu</span>
                </Link>

                {/* Mobile Menu Toggle */}
                <button
                    className="mobile-toggle"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    {menuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>

                {/* Navigation Links */}
                <div className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
                    {/* Common Links for Everyone */}
                    <NavLink to="/" active={isActive('/')} onClick={() => setMenuOpen(false)}>Home</NavLink>
                    <NavLink to="/hospitals" active={isActive('/hospitals')} onClick={() => setMenuOpen(false)}>Hospitals</NavLink>
                    {user?.role === 'patient' && (
                        <NavLink to="/patient/search" active={isActive('/patient/search')} onClick={() => setMenuOpen(false)}>Doctors</NavLink>
                    )}
                    <NavLink to="/services" active={isActive('/services')} onClick={() => setMenuOpen(false)}>Services</NavLink>


                    {/* Role-Specific Secondary Links */}
                    {user?.role === 'doctor' && (
                        <>
                            <div className="nav-divider" style={{ width: '1px', height: '20px', background: 'hsl(var(--border))', margin: '0 0.5rem' }}></div>
                            <NavLink to="/doctor" active={isActive('/doctor')} onClick={() => { setMenuOpen(false); window.scrollTo(0, 0); }}>Dashboard</NavLink>
                            <NavLink to="/doctor/appointments" active={isActive('/doctor/appointments')} onClick={() => setMenuOpen(false)}>Appointments</NavLink>
                            <NavLink to="/doctor/schedule" active={isActive('/doctor/schedule')} onClick={() => setMenuOpen(false)}>Slots</NavLink>
                            <NavLink to="/doctor/records" active={isActive('/doctor/records')} onClick={() => setMenuOpen(false)}>Records</NavLink>
                        </>
                    )}

                    {user?.role === 'admin' && (
                        <>
                            <div className="nav-divider" style={{ width: '1px', height: '20px', background: 'hsl(var(--border))', margin: '0 0.5rem' }}></div>
                            <NavLink to="/admin" active={isActive('/admin')} onClick={() => setMenuOpen(false)} noDot>Admin Dashboard</NavLink>
                            <NavLink to="/admin/doctors" active={isActive('/admin/doctors')} onClick={() => setMenuOpen(false)} noDot>Doctors</NavLink>
                            <NavLink to="/admin/patients" active={isActive('/admin/patients')} onClick={() => setMenuOpen(false)} noDot>Patients</NavLink>
                            <NavLink to="/admin/hospitals" active={isActive('/admin/hospitals')} onClick={() => setMenuOpen(false)} noDot>Hospitals</NavLink>

                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <NavDropdown
                                    label="Management"
                                    active={['/admin/inquiries', '/admin/bookings', '/admin/reports', '/admin/analytics'].some(path => isActive(path))}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem' }}>
                                        <DropdownNavLink to="/admin/inquiries" active={isActive('/admin/inquiries')} onClick={() => setMenuOpen(false)}>Inquiries</DropdownNavLink>
                                        <DropdownNavLink to="/admin/bookings" active={isActive('/admin/bookings')} onClick={() => setMenuOpen(false)}>Bookings</DropdownNavLink>
                                        <DropdownNavLink to="/admin/reports" active={isActive('/admin/reports')} onClick={() => setMenuOpen(false)}>Reports</DropdownNavLink>
                                        <DropdownNavLink to="/admin/analytics" active={isActive('/admin/analytics')} onClick={() => setMenuOpen(false)}>Analytics</DropdownNavLink>
                                    </div>
                                </NavDropdown>
                            </div>
                        </>
                    )}

                    {user?.role === 'patient' && (
                        <>
                            <div className="nav-divider" style={{ width: '1px', height: '20px', background: 'hsl(var(--border))', margin: '0 0.5rem' }}></div>
                            <NavLink to="/patient" active={isActive('/patient')} onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
                            <NavLink to="/patient/records" active={isActive('/patient/records')} onClick={() => setMenuOpen(false)}>Records</NavLink>
                            <NavLink to="/patient/symptom-checker" active={isActive('/patient/symptom-checker')} onClick={() => setMenuOpen(false)}>AI Symptoms Checker</NavLink>
                        </>
                    )}


                    {!user && (
                        <NavLink to="/about" active={isActive('/about')} onClick={() => setMenuOpen(false)}>About</NavLink>
                    )}
                </div>

                {/* Right Actions */}
                <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    {!user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Link to="/login" className="login-link" style={{ fontWeight: '600', color: 'hsl(var(--foreground))', textDecoration: 'none', fontSize: '0.95rem' }}>
                                Login
                            </Link>
                            <Link to="/register" className="btn btn-primary nav-btn" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}>
                                Join Now
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {/* Notifications */}
                            <div ref={notifRef} style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setNotifOpen(!notifOpen)}
                                    style={{ background: 'none', border: 'none', color: unreadCount > 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))', cursor: 'pointer', display: 'flex', position: 'relative' }}
                                >
                                    <Bell size={22} fill={unreadCount > 0 ? 'currentColor' : 'none'} style={{ transition: 'var(--transition)' }} />
                                    {unreadCount > 0 && (
                                        <span style={{
                                            position: 'absolute',
                                            top: '-4px',
                                            right: '-4px',
                                            background: 'hsl(var(--accent))',
                                            color: 'white',
                                            fontSize: '0.65rem',
                                            fontWeight: '800',
                                            minWidth: '16px',
                                            height: '16px',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '0 4px',
                                            border: '2px solid hsl(var(--card))'
                                        }}>
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {notifOpen && (
                                    <div className="glass-card animate-slide-up notif-dropdown" style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 1rem)',
                                        right: '-80px',
                                        width: '320px',
                                        maxHeight: '450px',
                                        padding: '0',
                                        zIndex: 200,
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{ padding: '1rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsl(var(--muted) / 0.5)' }}>
                                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800' }}>Notifications</h4>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={markAllAsRead}
                                                    style={{ border: 'none', background: 'none', color: 'hsl(var(--primary))', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ overflowY: 'auto', maxHeight: '350px' }}>
                                            {notifications.length === 0 ? (
                                                <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                                                    <Bell size={32} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
                                                    <p style={{ fontSize: '0.85rem' }}>No notifications yet</p>
                                                </div>
                                            ) : (
                                                notifications.map(notif => (
                                                    <div
                                                        key={notif._id}
                                                        onClick={() => markAsRead(notif._id)}
                                                        className={`notif-item ${!notif.is_read ? 'unread' : ''}`}
                                                        style={{
                                                            padding: '1rem',
                                                            borderBottom: '1px solid hsl(var(--border) / 0.5)',
                                                            cursor: 'pointer',
                                                            transition: 'var(--transition)',
                                                            background: notif.is_read ? 'transparent' : 'hsl(var(--primary) / 0.03)',
                                                            position: 'relative'
                                                        }}
                                                    >
                                                        {!notif.is_read && (
                                                            <div style={{ position: 'absolute', left: '8px', top: '1.25rem', width: '6px', height: '6px', borderRadius: '50%', background: 'hsl(var(--primary))' }}></div>
                                                        )}
                                                        <div style={{ marginLeft: '0.75rem' }}>
                                                            <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.25rem' }}>{notif.title}</div>
                                                            <div style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', lineHeight: '1.4' }}>{notif.message}</div>
                                                            <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground) / 0.7)', marginTop: '0.5rem', fontWeight: '600' }}>
                                                                {new Date(notif.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                    </div>
                                )}
                            </div>

                            <div ref={dropdownRef} style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="user-button"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.4rem 0.6rem',
                                        background: 'hsl(var(--muted))',
                                        borderRadius: '2rem',
                                        border: '1px solid hsl(var(--border))',
                                        cursor: 'pointer',
                                        transition: 'var(--transition)'
                                    }}
                                >
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.85rem',
                                        fontWeight: '700',
                                        overflow: 'hidden'
                                    }}>
                                        {user?.profile_picture ? (
                                            <img src={api.getMediaUrl(user.profile_picture)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <>{user?.first_name?.[0]}{user?.last_name?.[0]}</>
                                        )}
                                    </div>
                                    <ChevronDown size={14} color="hsl(var(--muted-foreground))" className="dropdown-icon" />
                                </button>

                                {dropdownOpen && (
                                    <div className="glass-card animate-slide-up dropdown-menu" style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 1rem)',
                                        right: 0,
                                        width: '240px',
                                        padding: '0.75rem',
                                        zIndex: 200
                                    }}>
                                        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid hsl(var(--border))', marginBottom: '0.5rem' }}>
                                            <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user.role}</p>
                                            <p style={{ fontWeight: '700', fontSize: '1rem', color: 'hsl(var(--foreground))' }}>{user.first_name} {user.last_name}</p>
                                        </div>

                                        <DropdownItem
                                            icon={<LayoutDashboard size={18} />}
                                            label="Home Page"
                                            onClick={() => {
                                                setDropdownOpen(false);
                                                navigate(`/${user.role}`);
                                            }}
                                        />

                                        {user.role !== 'admin' && (
                                            <>
                                                <DropdownItem
                                                    icon={<User size={18} />}
                                                    label="My Profile"
                                                    onClick={() => {
                                                        setDropdownOpen(false);
                                                        navigate(`/${user.role}/profile`);
                                                    }}
                                                />
                                            </>
                                        )}

                                        <div style={{ borderTop: '1px solid hsl(var(--border))', margin: '0.5rem 0' }}></div>

                                        <DropdownItem
                                            icon={<LogOut size={18} />}
                                            label="Logout"
                                            onClick={handleLogout}
                                            danger
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

const NavLink = ({ to, children, active, onClick, noDot = false }) => (
    <Link to={to} onClick={onClick} className={`navbar-link ${active ? 'active' : ''}`} style={{
        color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
        fontWeight: active ? '700' : '500',
        position: 'relative'
    }}>
        {children}
        {active && !noDot && (
            <span style={{
                position: 'absolute',
                bottom: '-1.5rem',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: 'hsl(var(--primary))'
            }}></span>
        )}
    </Link>
);

const NavDropdown = ({ label, children, active }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`navbar-link ${active ? 'active' : ''}`}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                    fontWeight: active ? '700' : '500',
                    padding: '0 0.5rem',
                    height: '100%'
                }}
            >
                {label} <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'var(--transition)' }} />
            </button>
            {isOpen && (
                <div className="glass-card animate-slide-up" style={{
                    position: 'absolute',
                    top: 'calc(100% + 1.25rem)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    minWidth: '200px',
                    padding: '0.5rem',
                    zIndex: 200,
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    border: '1px solid hsl(var(--border))'
                }}>
                    {children}
                </div>
            )}
        </div>
    );
};

const DropdownNavLink = ({ to, children, active, onClick }) => (
    <Link
        to={to}
        onClick={onClick}
        style={{
            display: 'block',
            padding: '0.75rem 1rem',
            textDecoration: 'none',
            color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
            fontWeight: active ? '700' : '500',
            fontSize: '0.9rem',
            borderRadius: 'var(--radius-sm)',
            transition: 'var(--transition)',
            background: active ? 'hsl(var(--primary) / 0.08)' : 'transparent'
        }}
        onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'hsl(var(--primary) / 0.05)'; }}
        onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
        {children}
    </Link>
);

const DropdownItem = ({ icon, label, onClick, danger }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            width: '100%',
            padding: '0.75rem 1rem',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            borderRadius: 'var(--radius-sm)',
            color: danger ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))',
            fontSize: '0.9rem',
            fontWeight: '500',
            textAlign: 'left',
            transition: 'var(--transition)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = danger ? 'hsl(var(--accent) / 0.08)' : 'hsl(var(--primary) / 0.08)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
        <span style={{ color: danger ? 'hsl(var(--accent))' : 'hsl(var(--primary))' }}>{icon}</span>
        {label}
    </button>
);

export default Navbar;
