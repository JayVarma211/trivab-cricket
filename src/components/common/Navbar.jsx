import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { logoutUser } from '../../firebase/auth';
import {
  Trophy, Users, Calendar, Star, Award, ScanLine,
  Sun, Moon, Menu, X, ChevronDown, LogOut, User,
  LayoutDashboard, Shield, Zap
} from 'lucide-react';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/tournaments', label: 'Tournaments' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/mvp-stats', label: 'MVP & Stats' },
  { to: '/sponsors', label: 'Sponsors' },
  { to: '/about', label: 'About' },
];

export default function Navbar() {
  const { user, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setDropOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'captain') return '/captain/dashboard';
    return '/player/dashboard';
  };

  const getRoleIcon = () => {
    if (role === 'admin') return <Shield size={14} />;
    if (role === 'captain') return <Zap size={14} />;
    return <User size={14} />;
  };

  const getRoleBadgeClass = () => {
    if (role === 'admin') return 'role-badge admin';
    if (role === 'captain') return 'role-badge captain';
    return 'role-badge player';
  };

  return (
    <header className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">
            <Trophy size={22} />
          </div>
          <span className="logo-text">
            TRIVAB<span className="logo-dot">.</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="navbar-links">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end={to === '/'}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="navbar-actions">
          {/* QR Scanner */}
          <Link to="/scanner" className="btn btn-icon scanner-btn" title="Scan QR Code">
            <ScanLine size={20} />
          </Link>

          {/* Theme toggle */}
          <button className="btn btn-icon theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <div className="user-menu" ref={dropRef}>
              <button className="user-trigger" onClick={() => setDropOpen((p) => !p)}>
                <div className="user-avatar">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="avatar" />
                  ) : (
                    <span>{user.displayName?.[0]?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div className="user-info">
                  <span className="user-name">{user.displayName?.split(' ')[0] || 'User'}</span>
                  <span className={getRoleBadgeClass()}>
                    {getRoleIcon()} {role}
                  </span>
                </div>
                <ChevronDown size={16} className={`drop-caret ${dropOpen ? 'open' : ''}`} />
              </button>

              {dropOpen && (
                <div className="user-dropdown animate-fade-in-down">
                  <Link to={getDashboardLink()} className="drop-item">
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  <Link to="/player/profile" className="drop-item">
                    <User size={16} /> My Profile
                  </Link>
                  <Link to="/player/id-card" className="drop-item">
                    <Award size={16} /> My ID Card
                  </Link>
                  <div className="drop-divider" />
                  <button className="drop-item drop-logout" onClick={handleLogout}>
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-btns">
              <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
              <Link to="/register" className="btn btn-gold btn-sm">Register</Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="btn btn-icon hamburger"
            onClick={() => setMenuOpen((p) => !p)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="mobile-menu animate-fade-in-down">
          <div className="mobile-nav-links">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} className="mobile-nav-link" end={to === '/'}>
                {label}
              </NavLink>
            ))}
            <NavLink to="/scanner" className="mobile-nav-link scanner-link">
              <ScanLine size={18} /> Scan QR Code
            </NavLink>
          </div>
          <div className="mobile-auth">
            {user ? (
              <>
                <Link to={getDashboardLink()} className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }}>
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogout}>
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>Login</Link>
                <Link to="/register" className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }}>Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
