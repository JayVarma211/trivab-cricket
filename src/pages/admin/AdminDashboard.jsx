import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCollection, setDocument, addDocument } from '../../firebase/firestore';
import { safeParseDate, safeFormatDateTime } from '../../utils/dateFormatter';
import { logoutUser } from '../../firebase/auth';
import {
  Users, Trophy, Calendar, Image, ChevronRight, Activity, AlertCircle, Camera, Shield, Newspaper, MessageSquare
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import Loader from '../../components/common/Loader';
import './Admin.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalTeams: 0,
    totalMatches: 0,
    totalTournaments: 0,
    totalInquiries: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [roleChartData, setRoleChartData] = useState([]);
  const [matchChartData, setMatchChartData] = useState([]);
  const [enrollNotifications, setEnrollNotifications] = useState([]);

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/admin/login');
    }
  }, [role, navigate]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        let players = [];
        let teams = [];
        let matches = [];
        let tournaments = [];
        let notifications = [];
        let inquiries = [];

        try { players = await getCollection('players') || []; } catch (e) { console.warn("Failed to fetch players:", e); }
        try { teams = await getCollection('teams') || []; } catch (e) { console.warn("Failed to fetch teams:", e); }
        try { matches = await getCollection('matches') || []; } catch (e) { console.warn("Failed to fetch matches:", e); }
        try { tournaments = await getCollection('tournaments') || []; } catch (e) { console.warn("Failed to fetch tournaments:", e); }
        try { notifications = await getCollection('admin_notifications') || []; } catch (e) { console.warn("Failed to fetch admin_notifications:", e); }
        try { inquiries = await getCollection('contact_inquiries') || []; } catch (e) { console.warn("Failed to fetch contact_inquiries:", e); }

        setStats({
          totalPlayers: players.length,
          totalTeams: teams.length,
          totalMatches: matches.length,
          totalTournaments: tournaments.length,
          totalInquiries: inquiries.length,
        });

        const sortedNotifications = (notifications || [])
          .sort((a, b) => safeParseDate(b.createdAt) - safeParseDate(a.createdAt))
          .slice(0, 10);
        setEnrollNotifications(sortedNotifications);

        // Playing Style Data
        const stylesCount = {
          'Batsman': 0,
          'Bowler': 0,
          'Wicket Keeper': 0,
          'All-Rounder': 0
        };
        players.forEach(p => {
          if (stylesCount[p.playingStyle] !== undefined) {
            stylesCount[p.playingStyle]++;
          }
        });
        setRoleChartData(Object.keys(stylesCount).map(key => ({
          name: key,
          count: stylesCount[key]
        })));

        // Match Status Data
        const statusCount = {
          'Upcoming': 0,
          'Live': 0,
          'Completed': 0
        };
        matches.forEach(m => {
          if (statusCount[m.status] !== undefined) {
            statusCount[m.status]++;
          }
        });
        setMatchChartData(Object.keys(statusCount).map(key => ({
          name: key,
          count: statusCount[key]
        })));

        // Combine recent activity
        const activity = [
          ...players.map(p => ({ type: 'player', name: p.fullName, time: p.createdAt })).slice(0, 2),
          ...teams.map(t => ({ type: 'team', name: t.teamName, time: t.createdAt })).slice(0, 2),
          ...matches.map(m => ({ type: 'match', name: `${m.teamA} vs ${m.teamB}`, time: m.createdAt })).slice(0, 2),
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

        setRecentActivity(activity);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  if (loading) return <Loader />;

  return (
    <div className="admin-page container section-padding">
      <div className="page-header mb-xl">
        <h1 className="display-sm text-gradient-gold">Admin Dashboard</h1>
        <p className="text-secondary">Overview of the TRIVAB sports platform metrics and management console.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid mb-xl" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon"><Users size={24} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Players</div>
            <div className="stat-value">{stats.totalPlayers}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Trophy size={24} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Teams</div>
            <div className="stat-value">{stats.totalTeams}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Calendar size={24} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Matches</div>
            <div className="stat-value">{stats.totalMatches}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Activity size={24} /></div>
          <div className="stat-content">
            <div className="stat-label">Tournaments</div>
            <div className="stat-value">{stats.totalTournaments}</div>
          </div>
        </div>
        <div className="stat-card" onClick={() => navigate('/admin/inquiries')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon"><MessageSquare size={24} /></div>
          <div className="stat-content">
            <div className="stat-label">Contact Inquiries</div>
            <div className="stat-value">{stats.totalInquiries || 0}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="admin-section mb-xl">
        <h3 className="admin-section-title">Quick Actions</h3>
        <div className="action-cards-grid">
          <Link to="/admin/tournaments" className="action-card-new">
            <div className="action-card-icon"><Trophy size={22} /></div>
            <div className="action-card-info">
              <h4>Tournaments</h4>
              <p>Create and schedule tournaments</p>
            </div>
          </Link>
          <Link to="/admin/players" className="action-card-new">
            <div className="action-card-icon"><Users size={22} /></div>
            <div className="action-card-info">
              <h4>Players</h4>
              <p>Manage player registrations</p>
            </div>
          </Link>
          <Link to="/admin/teams" className="action-card-new">
            <div className="action-card-icon"><Shield size={22} /></div>
            <div className="action-card-info">
              <h4>Teams</h4>
              <p>Create and manage squads</p>
            </div>
          </Link>
          <Link to="/admin/matches" className="action-card-new">
            <div className="action-card-icon"><Calendar size={22} /></div>
            <div className="action-card-info">
              <h4>Matches</h4>
              <p>Schedule fixtures & manage</p>
            </div>
          </Link>
          <Link to="/admin/images" className="action-card-new">
            <div className="action-card-icon"><Image size={22} /></div>
            <div className="action-card-info">
              <h4>Gallery</h4>
              <p>Upload tournament media</p>
            </div>
          </Link>
          <Link to="/admin/news" className="action-card-new">
            <div className="action-card-icon"><Newspaper size={22} /></div>
            <div className="action-card-info">
              <h4>News &amp; Events</h4>
              <p>Publish announcements</p>
            </div>
          </Link>
          <Link to="/scanner" className="action-card-new action-card-scanner" target="_blank" rel="noreferrer">
            <div className="action-card-icon scanner-icon"><Camera size={22} /></div>
            <div className="action-card-info">
              <h4>QR Scanner</h4>
              <p>Verify player ID cards</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Charts & Analytics */}
      <div className="admin-section mb-xl">
        <h3 className="admin-section-title">Analytics</h3>
        <div className="grid grid-2 gap-lg">
          <div className="admin-chart-panel">
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--admin-text)', margin: '0 0 16px' }}>Player Roles</h4>
            <div style={{ width: '100%', height: 240 }}>
              {stats.totalPlayers > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                  <BarChart data={roleChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
                    <XAxis dataKey="name" stroke="var(--admin-muted)" fontSize={11} />
                    <YAxis stroke="var(--admin-muted)" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--admin-card-bg)', borderColor: 'var(--admin-border)', borderRadius: '8px', fontSize: '0.8rem' }} />
                    <Bar dataKey="count" fill="var(--admin-accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--admin-border)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', color: 'var(--admin-muted)', padding: '20px' }}>
                  <Users size={24} style={{ marginBottom: '8px', opacity: 0.5, color: 'var(--admin-gold)' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>No player data available</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '2px', textAlign: 'center' }}>Seed data or register players to view analytics</span>
                </div>
              )}
            </div>
          </div>
          <div className="admin-chart-panel">
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--admin-text)', margin: '0 0 16px' }}>Match Status</h4>
            <div style={{ width: '100%', height: 240 }}>
              {stats.totalMatches > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                  <BarChart data={matchChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
                    <XAxis dataKey="name" stroke="var(--admin-muted)" fontSize={11} />
                    <YAxis stroke="var(--admin-muted)" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--admin-card-bg)', borderColor: 'var(--admin-border)', borderRadius: '8px', fontSize: '0.8rem' }} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--admin-border)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', color: 'var(--admin-muted)', padding: '20px' }}>
                  <Activity size={24} style={{ marginBottom: '8px', opacity: 0.5, color: 'var(--admin-gold)' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>No match data available</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '2px', textAlign: 'center' }}>Seed data or schedule matches to view analytics</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two columns: Enrollment Feed + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
        {/* Roster Enrollments Feed */}
        <div>
          <h3 className="admin-section-title">Enrollment Feed</h3>
          <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius)', overflow: 'hidden' }}>
            {enrollNotifications.length > 0 ? (
              enrollNotifications.slice(0, 5).map((notif, idx) => (
                <div key={notif.id || idx} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '12px 16px',
                  borderBottom: idx < Math.min(enrollNotifications.length, 5) - 1 ? '1px solid var(--admin-border)' : 'none',
                }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', marginTop: '6px', flexShrink: 0,
                    background: notif.type === 'captain_joined' ? 'var(--admin-gold)' : '#22c55e' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, color: 'var(--admin-text)', fontSize: '0.825rem', fontWeight: 600 }}>{notif.title}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--admin-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notif.message}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.68rem', color: 'var(--admin-muted)', opacity: 0.7 }}>
                      {safeFormatDateTime(notif.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-muted)' }}>
                <AlertCircle size={28} style={{ marginBottom: '8px', opacity: 0.35 }} />
                <p style={{ margin: 0, fontSize: '0.8rem' }}>No enrollment notifications yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="admin-section-title">Recent Activity</h3>
          <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius)', overflow: 'hidden' }}>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: idx < recentActivity.length - 1 ? '1px solid var(--admin-border)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Activity size={14} style={{ color: 'var(--admin-gold)', flexShrink: 0 }} />
                    <div>
                      <p style={{ margin: 0, color: 'var(--admin-text)', fontSize: '0.825rem' }}>
                        {activity.type === 'player' && '🎮 '}
                        {activity.type === 'team' && '🏏 '}
                        {activity.type === 'match' && '⏰ '}
                        <strong>{activity.name}</strong>
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.68rem', color: 'var(--admin-muted)' }}>
                        {activity.time ? new Date(activity.time).toLocaleDateString() : 'Recently'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--admin-muted)', opacity: 0.4 }} />
                </div>
              ))
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--admin-muted)' }}>
                <AlertCircle size={28} style={{ marginBottom: '8px', opacity: 0.35 }} />
                <p style={{ margin: 0, fontSize: '0.8rem' }}>No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
