import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../firebase/auth';
import {
  Users, Trophy, Calendar, Image, BarChart3, LogOut, Menu, Home,
  Newspaper, X, ChevronRight, Shield, Scan, MessageSquare
} from 'lucide-react';
import '../../pages/admin/Admin.css';

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  const menuItems = [
    { label: 'Dashboard', icon: <BarChart3 size={20} />, to: '/admin/dashboard', section: 'main' },
    { label: 'Tournaments', icon: <Trophy size={20} />, to: '/admin/tournaments', section: 'main' },
    { label: 'Players', icon: <Users size={20} />, to: '/admin/players', section: 'main' },
    { label: 'Teams', icon: <Shield size={20} />, to: '/admin/teams', section: 'main' },
    { label: 'Matches', icon: <Calendar size={20} />, to: '/admin/matches', section: 'main' },
    { label: 'Images', icon: <Image size={20} />, to: '/admin/images', section: 'main' },
    { label: 'News & Events', icon: <Newspaper size={20} />, to: '/admin/news', section: 'content' },
    { label: 'Inquiries', icon: <MessageSquare size={20} />, to: '/admin/inquiries', section: 'content' },
  ];

  const mainItems = menuItems.filter(i => i.section === 'main');
  const contentItems = menuItems.filter(i => i.section === 'content');

  return (
    <div className="admin-layout-wrapper">
      {/* Sidebar */}
      <aside className={`admin-sidebar-new ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-brand">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flex: 1, gap: '10px' }}>
            <img src="/logos/trivabsports.webp" style={{ height: '36px', objectFit: 'contain' }} alt="TRIVAB" />
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--admin-gold)', letterSpacing: '0.04em' }}>TRIVAB</span>
          </Link>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Admin Badge */}
        <div className="sidebar-admin-badge">
          <div className="admin-avatar-circle">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              <Shield size={18} />
            )}
          </div>
          <div>
            <p className="admin-badge-name">{user?.displayName?.split(' ')[0] || 'Admin'}</p>
            <p className="admin-badge-role">Administrator</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav-new">
          <div className="nav-section-label">Management</div>
          {mainItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                <span className="sidebar-nav-label">{item.label}</span>
                {isActive && <ChevronRight size={14} className="sidebar-nav-arrow" />}
              </Link>
            );
          })}

          <div className="nav-section-label" style={{ marginTop: 'var(--space-lg)' }}>Content</div>
          {contentItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                <span className="sidebar-nav-label">{item.label}</span>
                {isActive && <ChevronRight size={14} className="sidebar-nav-arrow" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer-new">
          <Link to="/" className="sidebar-footer-link">
            <Home size={16} />
            <span>View Website</span>
          </Link>
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="admin-content-area">
        {/* Top Header Bar */}
        <header className="admin-top-header">
          <button className="admin-hamburger" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="admin-header-title">
            <span className="admin-header-logo-text">TRIVAB</span>
            <span className="admin-header-sep">·</span>
            <span className="admin-header-page">Admin Console</span>
          </div>
          <div className="admin-header-right">
            <Link to="/scanner" className="admin-header-scan-btn" title="Scan Players QR">
              <Scan size={20} style={{ marginRight: '8px' }} />
            </Link>
            <div className="admin-header-user">
              <div className="admin-header-avatar">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  <span>{user?.displayName?.[0]?.toUpperCase() || 'A'}</span>
                )}
              </div>
              <span className="admin-header-username">{user?.displayName?.split(' ')[0] || 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="admin-main-content-area">
          {children}
        </main>
      </div>
    </div>
  );
}
