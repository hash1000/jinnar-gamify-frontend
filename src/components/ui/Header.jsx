import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/userSlice';
import logo from '../../assets/images/jinnar-viral-logo.png';
import { MenuIcon, CloseIcon } from './Icons';
import { useCurrency, SUPPORTED_CURRENCIES } from '../../contexts/CurrencyContext';

// ─── Nav link sets ────────────────────────────────────────────────────────────

const userNavLinks = [
    { path: '/challenge',     label: 'Viral Challenge' },
    { path: '/leaderboards',  label: 'Leaderboards'    },
    { path: '/rules',         label: 'Rules'           },
    { path: '/announcements', label: 'Announcements'   },
    { path: '/faq',           label: 'FAQ'             },
];

const adminNavLinks = [
    { path: '/admin',               label: 'Dashboard'     },
    { path: '/admin/draws',         label: 'Draws'         },
    { path: '/admin/submissions',   label: 'Submissions'   },
    { path: '/admin/users',         label: 'Users'         },
    { path: '/admin/finances',      label: 'Finances'      },
    { path: '/admin/announcements', label: 'Announcements' },
];

// ─── Component ────────────────────────────────────────────────────────────────

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state) => state.user);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
    const currencyRef = useRef(null);
    const { activeCurrency, activeCurrencyMeta, switchCurrency } = useCurrency();

    // Detect if we are on an admin page
    const isAdminPage = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';
    const navLinks = isAdminPage ? adminNavLinks : userNavLinks;

    // Close currency dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (currencyRef.current && !currencyRef.current.contains(e.target)) {
                setShowCurrencyMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/home');
        setShowDropdown(false);
        setIsMobileMenuOpen(false);
    };

    // Hide header on auth pages
    const authPaths = ['/login', '/register', '/signin', '/signup', '/verify', '/forgot-password', '/reset-password', '/admin/login'];
    if (authPaths.includes(location.pathname)) return null;

    const isActive = (path) => {
        if (path === '/admin') return location.pathname === '/admin';
        return location.pathname.startsWith(path);
    };

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <nav className="bg-white px-6 py-4 shadow-sm relative z-50">
            <div className="flex justify-between items-center">
                {/* Logo */}
                <Link to={isAdminPage ? '/admin' : '/home'} className="flex items-center gap-2" onClick={closeMobileMenu}>
                    <img src={logo} alt="Jinnar Viral Logo" className="h-16 md:h-24 w-auto" />
                    {isAdminPage && (
                        <span className="hidden md:inline-block text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-blue-800 text-white ml-1">
                            Admin
                        </span>
                    )}
                </Link>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-gray-700 focus:outline-none"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <CloseIcon className="w-8 h-8" /> : <MenuIcon className="w-8 h-8" />}
                </button>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                    <div className="flex gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`text-sm font-medium transition-colors ${isActive(link.path)
                                    ? 'text-blue-800 border-b-2 border-blue-800 pb-1'
                                    : 'text-gray-700 hover:text-blue-800'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Currency Switcher */}
                    <div className="relative" ref={currencyRef}>
                        <button
                            id="currency-switcher-btn"
                            onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-sm font-semibold text-gray-700"
                            title="Switch currency"
                        >
                            <span>{activeCurrencyMeta?.flag}</span>
                            <span>{activeCurrency}</span>
                            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {showCurrencyMenu && (
                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                                <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Select Currency</p>
                                {SUPPORTED_CURRENCIES.map((c) => (
                                    <button
                                        key={c.code}
                                        id={`currency-option-${c.code}`}
                                        onClick={() => { switchCurrency(c.code); setShowCurrencyMenu(false); }}
                                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${activeCurrency === c.code
                                            ? 'bg-blue-50 text-blue-800 font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="text-lg">{c.flag}</span>
                                        <span className="font-medium">{c.code}</span>
                                        <span className="ml-auto text-gray-400 text-xs">{c.symbol}</span>
                                        {activeCurrency === c.code && (
                                            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right-side actions */}
                    {isAdminPage ? (
                        // Admin: View Site link + avatar
                        <div className="flex items-center gap-4">
                            <Link
                                to="/home"
                                className="text-sm font-medium text-gray-500 hover:text-blue-800 transition-colors"
                            >
                                ↗ View Site
                            </Link>
                            <div className="relative">
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center hover:bg-blue-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-white font-bold text-sm"
                                >
                                    {user?.name?.[0]?.toUpperCase() || 'A'}
                                </button>
                                {showDropdown && (
                                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                                        <div className="px-4 py-2 border-b border-gray-200">
                                            <p className="text-sm font-semibold text-gray-900">{user?.name || 'Admin'}</p>
                                            <p className="text-xs text-gray-500">{user?.email}</p>
                                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
                                                {user?.role || 'super_admin'}
                                            </span>
                                        </div>
                                        <Link to="/admin" onClick={() => setShowDropdown(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">🏠 Dashboard</Link>
                                        <Link to="/home" onClick={() => setShowDropdown(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">↗ View Live Site</Link>
                                        <div className="border-t border-gray-200 my-1" />
                                        <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : isAuthenticated ? (
                        // User: Join Draw + Upload + profile avatar
                        <div className="flex gap-4 items-center">
                            <button
                                onClick={() => navigate('/challenge')}
                                className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold py-2 px-6 rounded-md transition-colors"
                            >
                                Join Active Draw
                            </button>
                            <button
                                onClick={() => navigate('/upload')}
                                className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-6 rounded-md flex items-center gap-2 transition-colors"
                            >
                                Upload Video
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            {/* Profile Avatar Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center hover:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </button>
                                {showDropdown && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                                        <div className="px-4 py-2 border-b border-gray-200">
                                            <p className="text-sm font-semibold text-gray-900">{user?.name || user?.email || 'User'}</p>
                                            {user?.email && <p className="text-xs text-gray-500">{user.email}</p>}
                                        </div>
                                        <Link to="/dashboard" onClick={() => setShowDropdown(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Dashboard</Link>
                                        <Link to="/dashboard" onClick={() => setShowDropdown(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Videos</Link>
                                        <Link to="/settings" onClick={() => setShowDropdown(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</Link>
                                        {(user?.role?.toLowerCase() === 'superadmin' ||
                                            user?.role?.toLowerCase() === 'super admin' ||
                                            user?.role === 'admin' ||
                                            user?.isAdmin) && (
                                                <>
                                                    <div className="border-t border-gray-200 my-1" />
                                                    <Link to="/admin" onClick={() => setShowDropdown(false)} className="block px-4 py-2 text-sm text-blue-800 font-bold hover:bg-blue-50">🔐 Admin Dashboard</Link>
                                                </>
                                            )}
                                        <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Logout</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Unauthenticated
                        <div className="flex gap-4">
                            <button onClick={() => navigate('/register')} className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold py-2 px-6 rounded-md transition-colors">Register</button>
                            <button onClick={() => navigate('/login')} className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-6 rounded-md transition-colors">Login</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-100 py-4 px-6 flex flex-col gap-4">
                    <div className="flex flex-col gap-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={closeMobileMenu}
                                className={`text-base font-medium py-2 ${isActive(link.path) ? 'text-blue-800' : 'text-gray-700'}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                    <hr className="border-gray-100" />

                    {/* Currency Switcher */}
                    <div className="relative" ref={currencyRef}>
                        <button
                            id="currency-switcher-btn-mobile"
                            onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-sm font-semibold text-gray-700"
                            title="Switch currency"
                        >
                            <span>{activeCurrencyMeta?.flag}</span>
                            <span>{activeCurrency}</span>
                            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {showCurrencyMenu && (
                            <div className="absolute left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                                <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Select Currency</p>
                                {SUPPORTED_CURRENCIES.map((c) => (
                                    <button
                                        key={c.code}
                                        id={`currency-option-mobile-${c.code}`}
                                        onClick={() => { switchCurrency(c.code); setShowCurrencyMenu(false); }}
                                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${activeCurrency === c.code
                                            ? 'bg-blue-50 text-blue-800 font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="text-lg">{c.flag}</span>
                                        <span className="font-medium">{c.code}</span>
                                        <span className="ml-auto text-gray-400 text-xs">{c.symbol}</span>
                                        {activeCurrency === c.code && (
                                            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <hr className="border-gray-100" />

                    {isAdminPage ? (
                        <div className="flex flex-col gap-3">
                            <Link to="/home" onClick={closeMobileMenu} className="text-gray-700 py-2">↗ View Live Site</Link>
                            <button onClick={handleLogout} className="text-red-600 text-left py-2">Logout</button>
                        </div>
                    ) : isAuthenticated ? (
                        <>
                            <div className="flex flex-col gap-3">
                                <Link to="/dashboard" onClick={closeMobileMenu} className="text-gray-700 py-2">My Dashboard</Link>
                                <Link to="/settings" onClick={closeMobileMenu} className="text-gray-700 py-2">Settings</Link>
                                {(user?.role?.toLowerCase() === 'superadmin' || user?.role === 'admin' || user?.isAdmin) && (
                                    <Link to="/admin" onClick={closeMobileMenu} className="text-blue-800 font-semibold py-2">🔐 Admin Dashboard</Link>
                                )}
                                <button onClick={handleLogout} className="text-red-600 text-left py-2">Logout</button>
                            </div>
                            <div className="flex flex-col gap-3 mt-2">
                                <button onClick={() => { navigate('/challenge'); closeMobileMenu(); }} className="bg-yellow-400 text-blue-900 font-bold py-3 px-6 rounded-md text-center">Join Active Draw</button>
                                <button onClick={() => { navigate('/upload'); closeMobileMenu(); }} className="bg-blue-800 text-white font-bold py-3 px-6 rounded-md flex items-center justify-center gap-2">Upload Video</button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <button onClick={() => { navigate('/register'); closeMobileMenu(); }} className="bg-yellow-400 text-blue-900 font-bold py-3 px-6 rounded-md text-center">Register</button>
                            <button onClick={() => { navigate('/login'); closeMobileMenu(); }} className="bg-blue-800 text-white font-bold py-3 px-6 rounded-md text-center">Login</button>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Header;
