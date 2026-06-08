import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { logoutUser } from '../../firebase/auth';
import {
  Trophy, Users, Calendar, Star, Award, ScanLine,
  Sun, Moon, Menu, X, ChevronDown, ChevronRight, LogOut, User,
  LayoutDashboard, Shield, Zap
} from 'lucide-react';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/tournaments', label: 'Tournaments' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/mvp-stats', label: 'MVP & Stats' },
  { to: '/sponsors', label: 'Sponsors' },
  { to: '/organize', label: 'Organize' },
  { to: '/about', label: 'About' },
];

const TOURNAMENTS_MENU = [
  { label: 'BAPL', to: '/tournaments/type/bapl', logo: '/logos/bapllogo.jpg' },
  { label: 'BAPL XPRESS', to: '/tournaments/type/baplxpress', logo: '/logos/bapllogo.jpg' },
  { label: 'BAPL Corporate CUP', to: '/tournaments/type/baplcorporate', logo: '/logos/baplcorporate.jpg' },
  { label: 'Trivab Monsoon Championship', to: '/tournaments/trivab-monsoon', logo: '/logos/trivabmonsoon.jpg' },
  { label: 'BAPL DADS T20', to: '/tournaments/type/bapldads', logo: '/logos/bapldadst20.jpg' },
  { label: 'BAPL KIDS', to: '/tournaments/baplkids', logo: '/logos/bapllogo.jpg' }
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
  const [tournamentsDropOpen, setTournamentsDropOpen] = useState(false);
  const tournamentsDropRef = useRef(null);
  const [mobileTournamentsOpen, setMobileTournamentsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setDropOpen(false);
    setTournamentsDropOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
      if (tournamentsDropRef.current && !tournamentsDropRef.current.contains(e.target)) setTournamentsDropOpen(false);
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
          <img src="/logos/trivabsports.webp" className="logo-image" alt="TRIVAB SPORTS" />
        </Link>

        {/* Desktop Nav */}
        <nav className="navbar-links">
          {NAV_LINKS.map(({ to, label }) => {
            if (label === 'Tournaments') {
              return (
                <div key={to} className="nav-dropdown-wrapper" ref={tournamentsDropRef}>
                  <button
                    className={`nav-link dropdown-trigger ${location.pathname.startsWith('/tournaments') ? 'active' : ''}`}
                    onClick={() => setTournamentsDropOpen(prev => !prev)}
                  >
                    Tournaments <ChevronDown size={14} className={`drop-caret ${tournamentsDropOpen ? 'open' : ''}`} />
                  </button>
                  {tournamentsDropOpen && (
                    <div className="tournaments-nav-dropdown animate-fade-in-down">
                      {TOURNAMENTS_MENU.map((item) => (
                        <Link
                          key={item.label}
                          to={item.to}
                          className="tournaments-nav-item"
                          onClick={() => setTournamentsDropOpen(false)}
                        >
                          <img src={item.logo} className="nav-menu-logo" alt={item.label} />
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                end={to === '/'}
              >
                {label}
              </NavLink>
            );
          })}
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
              <Link to="/admin/login" className="btn btn-outline btn-sm" title="Admin Login">
                <Shield size={16} /> Admin
              </Link>
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
            {NAV_LINKS.map(({ to, label }) => {
              if (label === 'Tournaments') {
                return (
                  <div key={to} className="mobile-dropdown-wrapper" style={{ width: '100%' }}>
                    <button
                      className="mobile-nav-link"
                      onClick={() => setMobileTournamentsOpen(prev => !prev)}
                      style={{ width: '100%', justifyContent: 'space-between', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Trophy size={18} /> Tournaments
                      </span>
                      <ChevronDown size={16} style={{ transform: mobileTournamentsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    {mobileTournamentsOpen && (
                      <div className="mobile-submenu-list" style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                        {TOURNAMENTS_MENU.map((item) => (
                          <Link
                            key={item.label}
                            to={item.to}
                            className="mobile-nav-link"
                            style={{ padding: '8px 12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                            onClick={() => setMenuOpen(false)}
                          >
                            <img src={item.logo} style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'cover' }} alt={item.label} />
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <NavLink key={to} to={to} className="mobile-nav-link" end={to === '/'}>
                  {label}
                </NavLink>
              );
            })}
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
                <Link to="/admin/login" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>
                  <Shield size={16} /> Admin Login
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
