import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/userSlice';
import logo from '../../assets/images/jinnar-viral-logo.png';

const adminNavLinks = [
    { path: '/admin',              label: '📊 Dashboard',        exact: true },
    { path: '/admin/draws',        label: '🎯 Draws'                         },
    { path: '/admin/submissions',  label: '📋 Submissions'                   },
    { path: '/admin/users',        label: '👥 Users'                         },
    { path: '/admin/announcements',label: '📢 Announcements'                 },
];

const AdminHeader = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.user);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
        setShowDropdown(false);
        setIsMobileOpen(false);
    };

    const isActive = (path, exact = false) =>
        exact ? location.pathname === path : location.pathname.startsWith(path);

    return (
        <header style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}
            className="shadow-xl sticky top-0 z-50">
            <div className="max-w-screen-2xl mx-auto px-4 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo + Admin Badge */}
                    <Link to="/admin" className="flex items-center gap-3 shrink-0">
                        <img src={logo} alt="Jinnar Viral" className="h-10 w-auto" />
                        <span style={{
                            background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                        }}>
                            Admin Panel
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {adminNavLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                                style={{
                                    color: isActive(link.path, link.exact) ? '#f59e0b' : '#94a3b8',
                                    background: isActive(link.path, link.exact) ? 'rgba(245,158,11,0.12)' : 'transparent',
                                    borderBottom: isActive(link.path, link.exact) ? '2px solid #f59e0b' : '2px solid transparent',
                                }}
                                onMouseEnter={e => {
                                    if (!isActive(link.path, link.exact)) {
                                        e.currentTarget.style.color = '#e2e8f0';
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isActive(link.path, link.exact)) {
                                        e.currentTarget.style.color = '#94a3b8';
                                        e.currentTarget.style.background = 'transparent';
                                    }
                                }}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right side: user info + dropdown */}
                    <div className="flex items-center gap-3">
                        {/* View Site Button */}
                        <Link
                            to="/home"
                            className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            ↗ View Site
                        </Link>

                        {/* Avatar dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all"
                                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}
                            >
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                                    style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff' }}>
                                    {user?.name?.[0]?.toUpperCase() || 'A'}
                                </div>
                                <span className="hidden md:block text-sm font-medium" style={{ color: '#e2e8f0' }}>
                                    {user?.name || 'Admin'}
                                </span>
                                <svg className="w-3 h-3" style={{ color: '#94a3b8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showDropdown && (
                                <div className="absolute right-0 mt-2 w-52 rounded-xl shadow-2xl py-2 z-50"
                                    style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div className="px-4 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                                        <p className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>{user?.name || 'Super Admin'}</p>
                                        <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{user?.email}</p>
                                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold"
                                            style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                                            {user?.role || 'super_admin'}
                                        </span>
                                    </div>
                                    <Link to="/admin" onClick={() => setShowDropdown(false)}
                                        className="block px-4 py-2 text-sm transition-colors"
                                        style={{ color: '#94a3b8' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        🏠 Dashboard
                                    </Link>
                                    <Link to="/home" onClick={() => setShowDropdown(false)}
                                        className="block px-4 py-2 text-sm transition-colors"
                                        style={{ color: '#94a3b8' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        ↗ View Live Site
                                    </Link>
                                    <hr style={{ borderColor: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
                                    <button onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 text-sm transition-colors"
                                        style={{ color: '#f87171' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        🚪 Logout
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Mobile hamburger */}
                        <button
                            className="lg:hidden p-2 rounded-lg"
                            style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.06)' }}
                            onClick={() => setIsMobileOpen(!isMobileOpen)}
                        >
                            {isMobileOpen ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMobileOpen && (
                <div className="lg:hidden px-4 pb-4 pt-2 flex flex-col gap-1"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {adminNavLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setIsMobileOpen(false)}
                            className="block px-4 py-3 rounded-lg text-sm font-medium transition-all"
                            style={{
                                color: isActive(link.path, link.exact) ? '#f59e0b' : '#94a3b8',
                                background: isActive(link.path, link.exact) ? 'rgba(245,158,11,0.1)' : 'transparent',
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <hr style={{ borderColor: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
                    <button onClick={handleLogout}
                        className="text-left px-4 py-3 rounded-lg text-sm font-medium"
                        style={{ color: '#f87171' }}>
                        🚪 Logout
                    </button>
                </div>
            )}
        </header>
    );
};

export default AdminHeader;
