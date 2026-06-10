import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../firebase/auth';
import {
  Users, Trophy, Calendar, Image, BarChart3, LogOut, Menu, Shield, Home, ClipboardList
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
    { label: 'Go to Website', icon: <Home size={20} />, to: '/' },
    { label: 'Dashboard', icon: <BarChart3 size={20} />, to: '/admin/dashboard' },
    { label: 'Tournaments', icon: <Trophy size={20} />, to: '/admin/tournaments' },
    { label: 'Players', icon: <Users size={20} />, to: '/admin/players' },
    { label: 'Teams', icon: <Trophy size={20} />, to: '/admin/teams' },
    { label: 'Matches', icon: <Calendar size={20} />, to: '/admin/matches' },
    { label: 'Images', icon: <Image size={20} />, to: '/admin/images' },
    { label: 'Organize Form', icon: <ClipboardList size={20} />, to: '/admin/organize-form' },
  ];

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open-sidebar' : 'closed'}`}>
        <div className="sidebar-header">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src="/logos/trivabsports.webp" style={{ height: '80px', objectFit: 'contain' }} alt="TRIVAB SPORTS" />
          </Link>
          <button className="sidebar-toggle-close" onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--admin-text)', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-item ${location.pathname === item.to ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-profile">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="avatar" className="admin-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
            ) : (
              <div className="admin-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--admin-accent)', color: '#000', fontWeight: 'bold' }}>
                {user?.displayName?.[0]?.toUpperCase() || 'A'}
              </div>
            )}
            <div>
              <p className="text-sm font-semi" style={{ margin: 0, color: 'var(--admin-text)' }}>{user?.displayName?.split(' ')[0] || 'Admin'}</p>
              <p className="text-sm text-secondary" style={{ margin: 0 }}>Admin</p>
            </div>
          </div>
          <button className="nav-item logout-btn" onClick={handleLogout} style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', width: '100%' }}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content Area */}
      <div className="admin-layout-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100vh', overflowX: 'hidden' }}>
        {/* Toggle bar for mobile */}
        <header className="admin-mobile-header">
          <button className="mobile-toggle-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <span className="mobile-header-title">TRIVAB Admin Console</span>
        </header>

        <main className="admin-main-content-wrapper" style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
