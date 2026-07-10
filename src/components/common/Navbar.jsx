import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { logoutUser } from '../../firebase/auth';
import {
  Trophy, Users, Calendar, Star, Award, Newspaper,
  Sun, Moon, Menu, X, ChevronDown, ChevronRight, LogOut, User,
  LayoutDashboard, Shield, Zap, Globe, Briefcase, Heart, Building2,
  Image, Mail
} from 'lucide-react';
import './Navbar.css';

const TOURNAMENTS_MENU = [
  { label: 'BAPL', to: '/tournaments/type/bapl', logo: '/logos/baplt20north.png' },
  { label: 'BAPL XPRESS', to: '/tournaments/type/baplxpress', logo: '/logos/baplxpresst20north.png' },
  { label: 'BAPL Corporate CUP', to: '/tournaments/type/baplcorporate', logo: '/logos/baplcorporate.png' },
  { label: 'Trivab Monsoon Championship', to: '/tournaments/trivab-monsoon', logo: '/logos/trivabmonsoon.jpg' },
  { label: 'BAPL 40+ DADS T20', to: '/tournaments/type/bapldads', logo: '/logos/bapldadst20.png' },
  { label: 'BAPL KIDS', to: '/tournaments/baplkids', logo: '/logos/bapllogo.jpg' }
];

const IndiaFlag = () => (
  <span style={{ display: 'inline-flex', alignItems: 'center', width: '18px', height: '12px', borderRadius: '2px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', marginRight: '2px' }}>
    <svg width="18" height="12" viewBox="0 0 18 12">
      <rect width="18" height="4" fill="#FF9933" />
      <rect y="4" width="18" height="4" fill="#FFFFFF" />
      <rect y="8" width="18" height="4" fill="#138808" />
      <circle cx="9" cy="6" r="1.2" fill="#000080" />
    </svg>
  </span>
);

const CommunityIcon = () => (
  <span style={{ display: 'inline-flex', alignItems: 'center', color: '#d4af37' }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="11" r="2.5" />
      <circle cx="12" cy="7" r="3" />
      <circle cx="18" cy="11" r="2.5" />
      <path d="M2 20c0-2.5 1.5-4 3.5-4h0.5l1 1.5" />
      <path d="M22 20c0-2.5-1.5-4-3.5-4h-0.5l-1 1.5" />
      <path d="M7.5 20c0-3.5 1.5-5.5 4.5-5.5s4.5 2 4.5 5.5" />
    </svg>
  </span>
);

const SERVICES_MENU = [
  { label: 'Corporate Sports Events', icon: <Building2 size={16} />, to: '/services?type=corporate' },
  { label: 'Community Sports Events', icon: <CommunityIcon />, to: '/services?type=community' },
  { label: 'International Cricket Tour', icon: <Globe size={16} />, to: '/services?type=international' },
  { label: 'Domestic Cricket Tour', icon: <IndiaFlag />, to: '/services?type=domestic' },
];

const ABOUT_MENU = [
  { label: 'TRIVAB Sports & Events', to: '/about?tab=trivab' },
  { label: 'Leadership Team', to: '/about?tab=leadership' },
  { label: 'Bharat Armyy Cricket Club', to: '/about?tab=bharat-army' },
  { label: 'Careers', to: '/about?tab=careers' }
];

const getLogoClass = (logoUrl) => {
  if (!logoUrl) return '';
  const url = logoUrl.toLowerCase();
  if (url.includes('cloudinary') || url.includes('http')) return '';
  if (url.includes('xpress')) return 'logo-black-bg';
  if (url.includes('dads')) return 'logo-white-bg';
  if (url.includes('baplt20') || url.includes('baplpune')) return 'logo-silver-bg';
  if (url.includes('corporate') || url.includes('monsoon')) return 'logo-white-bg';
  return '';
};

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
  const [servicesDropOpen, setServicesDropOpen] = useState(false);
  const servicesDropRef = useRef(null);
  const [aboutDropOpen, setAboutDropOpen] = useState(false);
  const aboutDropRef = useRef(null);
  const [mobileTournamentsOpen, setMobileTournamentsOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);


  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);
      
      if (menuOpen) {
        setVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [lastScrollY, menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setDropOpen(false);
    setTournamentsDropOpen(false);
    setServicesDropOpen(false);
    setAboutDropOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
      if (tournamentsDropRef.current && !tournamentsDropRef.current.contains(e.target)) setTournamentsDropOpen(false);
      if (servicesDropRef.current && !servicesDropRef.current.contains(e.target)) setServicesDropOpen(false);
      if (aboutDropRef.current && !aboutDropRef.current.contains(e.target)) setAboutDropOpen(false);
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
    <header className={`navbar ${scrolled || menuOpen ? 'navbar-scrolled navbar-menu-open' : ''} ${!visible && !menuOpen ? 'navbar-hidden' : ''}`}>
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <img src="/logos/trivabsports.webp" className="logo-image" alt="TRIVAB SPORTS" />
        </Link>

        {/* Desktop Nav */}
        <nav className="navbar-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>Home</NavLink>
          
          {/* About Us Dropdown */}
          <div className="nav-dropdown-wrapper" ref={aboutDropRef}>
            <button
              className={`nav-link dropdown-trigger ${location.pathname === '/about' ? 'active' : ''}`}
              onClick={() => setAboutDropOpen(prev => !prev)}
            >
              About Us <ChevronDown size={14} className={`drop-caret ${aboutDropOpen ? 'open' : ''}`} />
            </button>
            {aboutDropOpen && (
              <div className="services-nav-dropdown animate-fade-in-down">
                {ABOUT_MENU.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="services-nav-item"
                    style={{ fontSize: '0.85rem' }}
                    onClick={() => setAboutDropOpen(false)}
                  >
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Our Services Dropdown */}
          <div className="nav-dropdown-wrapper" ref={servicesDropRef}>
            <button
              className={`nav-link dropdown-trigger`}
              onClick={() => setServicesDropOpen(prev => !prev)}
            >
              Our Services <ChevronDown size={14} className={`drop-caret ${servicesDropOpen ? 'open' : ''}`} />
            </button>
            {servicesDropOpen && (
              <div className="services-nav-dropdown animate-fade-in-down">
                {SERVICES_MENU.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="services-nav-item"
                    onClick={() => setServicesDropOpen(false)}
                  >
                    <span className="service-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Tournaments Dropdown (BAPL) */}
          <div className="nav-dropdown-wrapper" ref={tournamentsDropRef}>
            <button
              className={`nav-link dropdown-trigger ${location.pathname.startsWith('/tournaments') ? 'active' : ''}`}
              onClick={() => setTournamentsDropOpen(prev => !prev)}
            >
              BAPL <ChevronDown size={14} className={`drop-caret ${tournamentsDropOpen ? 'open' : ''}`} />
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
                    <img src={item.logo} className={`nav-menu-logo ${getLogoClass(item.logo)}`} alt={item.label} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          {/* News & Events */}
          <NavLink to="/news" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            News &amp; Events
          </NavLink>
          <NavLink to="/contact" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Contact Us
          </NavLink>
        </nav>

        {/* Right actions */}
        <div className="navbar-actions">
          {/* Theme toggle */}
          <button className="btn btn-icon theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {!user && (
            <Link to="/register" className="btn btn-gold btn-sm mobile-register-btn">
              Register
            </Link>
          )}

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
            <NavLink to="/" className="mobile-nav-link" end onClick={() => setMenuOpen(false)}>Home</NavLink>
            
            {/* Mobile About Us Dropdown */}
            <div className="mobile-dropdown-wrapper" style={{ width: '100%' }}>
              <button
                className="mobile-nav-link"
                onClick={() => setMobileAboutOpen(prev => !prev)}
                style={{ width: '100%', justifyContent: 'space-between', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Users size={18} /> About Us
                </span>
                <ChevronDown size={16} style={{ transform: mobileAboutOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {mobileAboutOpen && (
                <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  {ABOUT_MENU.map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      className="mobile-nav-link"
                      style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Our Services */}
            <div className="mobile-dropdown-wrapper" style={{ width: '100%' }}>
              <button
                className="mobile-nav-link"
                onClick={() => setMobileServicesOpen(prev => !prev)}
                style={{ width: '100%', justifyContent: 'space-between', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Briefcase size={18} /> Our Services
                </span>
                <ChevronDown size={16} style={{ transform: mobileServicesOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {mobileServicesOpen && (
                <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  {SERVICES_MENU.map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      className="mobile-nav-link"
                      style={{ padding: '8px 12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Tournaments (BAPL) */}
            <div className="mobile-dropdown-wrapper" style={{ width: '100%' }}>
              <button
                className="mobile-nav-link"
                onClick={() => setMobileTournamentsOpen(prev => !prev)}
                style={{ width: '100%', justifyContent: 'space-between', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Trophy size={18} /> BAPL
                </span>
                <ChevronDown size={16} style={{ transform: mobileTournamentsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {mobileTournamentsOpen && (
                <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  {TOURNAMENTS_MENU.map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      className="mobile-nav-link"
                      style={{ padding: '8px 12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                      onClick={() => setMenuOpen(false)}
                    >
                      <img src={item.logo} className={getLogoClass(item.logo)} style={{ width: '22px', height: '22px', objectFit: 'contain' }} alt={item.label} />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <NavLink to="/schedule" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              <Calendar size={18} /> Matches
            </NavLink>
            <NavLink to="/gallery" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              <Image size={18} /> Gallery
            </NavLink>

            {/* News & Events */}
            <NavLink to="/news" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              <Newspaper size={18} /> News &amp; Events
            </NavLink>
            <NavLink to="/contact" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              <Mail size={18} /> Contact Us
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
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
