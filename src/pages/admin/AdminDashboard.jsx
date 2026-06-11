import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCollection, setDocument, addDocument } from '../../firebase/firestore';
import { logoutUser } from '../../firebase/auth';
import {
  Users, Trophy, Calendar, Image, ChevronRight, Activity, AlertCircle, Database, ScanLine
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
        const [players, teams, matches, tournaments, notifications] = await Promise.all([
          getCollection('players'),
          getCollection('teams'),
          getCollection('matches'),
          getCollection('tournaments'),
          getCollection('admin_notifications')
        ]);

        setStats({
          totalPlayers: players.length,
          totalTeams: teams.length,
          totalMatches: matches.length,
          totalTournaments: tournaments.length,
        });

        const sortedNotifications = (notifications || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
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

  const [seeding, setSeeding] = useState(false);
  const [seedingSuccess, setSeedingSuccess] = useState('');

  const handleInitializeDatabase = async () => {
    if (!window.confirm('This will seed the database with professional demo data (Tournaments, Teams, Players, Matches). Continue?')) return;
    setSeeding(true);
    setSeedingSuccess('');
    try {
      // 1. Seed Tournaments
      const tournamentsToSeed = [
        {
          id: 'bapl-south',
          data: {
            name: 'BAPL - South Mumbai Edition',
            logo: '/logos/baplt20south.jpg',
            status: 'Live',
            date: 'June - July 2026',
            teamCount: 8,
            description: 'South Mumbai Edition of the premier BAPL League.',
            createdAt: new Date().toISOString()
          }
        },
        {
          id: 'bapl-north',
          data: {
            name: 'BAPL - North Mumbai Edition',
            logo: '/logos/baplt20north.jpg',
            status: 'Upcoming',
            date: 'July - August 2026',
            teamCount: 8,
            description: 'North Mumbai Edition of the premier BAPL League.',
            createdAt: new Date().toISOString()
          }
        },
        {
          id: 'baplxpress-south',
          data: {
            name: 'BAPL XPRESS - South Mumbai Edition',
            logo: '/logos/baplxpresst20south.jpg',
            status: 'Upcoming',
            date: 'August 2026',
            teamCount: 6,
            description: 'South Mumbai Edition of the fast-paced BAPL XPRESS League.',
            createdAt: new Date().toISOString()
          }
        },
        {
          id: 'baplcorporate-south',
          data: {
            name: 'BAPL Corporate CUP - South Mumbai Edition',
            logo: '/logos/baplcorporate.jpg',
            status: 'Completed',
            date: 'April - May 2026',
            teamCount: 8,
            description: 'South Mumbai Edition of the BAPL Corporate Cup.',
            winner: 'Tata Challengers',
            runnerUp: 'Reliance Stars',
            createdAt: new Date().toISOString()
          }
        }
      ];

      for (const t of tournamentsToSeed) {
        await setDocument('tournaments', t.id, t.data);
      }

      // 2. Seed Teams and keep their auto-generated IDs to seed players & matches
      const teamList = [
        {
          teamName: 'Colaba Strikers',
          city: 'Colaba, Mumbai',
          captainName: 'Rohit Sharma',
          wins: 3,
          losses: 1,
          playerCount: 15,
          maxPlayers: 35,
          tournamentId: 'bapl-south',
          tournamentName: 'BAPL - South Mumbai Edition'
        },
        {
          teamName: 'Churchgate Kings',
          city: 'Churchgate, Mumbai',
          captainName: 'Virat Kohli',
          wins: 2,
          losses: 2,
          playerCount: 14,
          maxPlayers: 35,
          tournamentId: 'bapl-south',
          tournamentName: 'BAPL - South Mumbai Edition'
        },
        {
          teamName: 'Marine Drive Titans',
          city: 'Marine Lines, Mumbai',
          captainName: 'MS Dhoni',
          wins: 4,
          losses: 0,
          playerCount: 16,
          maxPlayers: 35,
          tournamentId: 'bapl-south',
          tournamentName: 'BAPL - South Mumbai Edition'
        },
        {
          teamName: 'Bandra Blasters',
          city: 'Bandra, Mumbai',
          captainName: 'Hardik Pandya',
          wins: 0,
          losses: 0,
          playerCount: 12,
          maxPlayers: 35,
          tournamentId: 'bapl-north',
          tournamentName: 'BAPL - North Mumbai Edition'
        },
        {
          teamName: 'Tata Challengers',
          city: 'Mumbai Central',
          captainName: 'Ratan Tata',
          wins: 5,
          losses: 1,
          playerCount: 18,
          maxPlayers: 35,
          tournamentId: 'baplcorporate-south',
          tournamentName: 'BAPL Corporate CUP - South Mumbai Edition'
        },
        {
          teamName: 'Reliance Stars',
          city: 'Navi Mumbai',
          captainName: 'Ambani XI',
          wins: 4,
          losses: 2,
          playerCount: 17,
          maxPlayers: 35,
          tournamentId: 'baplcorporate-south',
          tournamentName: 'BAPL Corporate CUP - South Mumbai Edition'
        }
      ];

      const createdTeams = [];
      for (const t of teamList) {
        const docRef = await addDocument('teams', t);
        createdTeams.push({ id: docRef.id, ...t });
      }

      // 3. Seed Players for these teams
      const playersToSeed = [
        {
          playerId: 'PL-SHARMA-45',
          fullName: 'Rohit Sharma',
          email: 'rohit.sharma@trivab.com',
          mobile: '9876543210',
          playingStyle: 'Batsman',
          jerseyNumber: '45',
          status: 'Active',
          teamName: 'Colaba Strikers'
        },
        {
          playerId: 'PL-KOHLI-18',
          fullName: 'Virat Kohli',
          email: 'virat.kohli@trivab.com',
          mobile: '9876543211',
          playingStyle: 'Batsman',
          jerseyNumber: '18',
          status: 'Active',
          teamName: 'Churchgate Kings'
        },
        {
          playerId: 'PL-DHONI-7',
          fullName: 'MS Dhoni',
          email: 'ms.dhoni@trivab.com',
          mobile: '9876543212',
          playingStyle: 'Wicket Keeper',
          jerseyNumber: '7',
          status: 'Active',
          teamName: 'Marine Drive Titans'
        },
        {
          playerId: 'PL-PANDYA-33',
          fullName: 'Hardik Pandya',
          email: 'hardik.pandya@trivab.com',
          mobile: '9876543213',
          playingStyle: 'All-Rounder',
          jerseyNumber: '33',
          status: 'Active',
          teamName: 'Bandra Blasters'
        },
        {
          playerId: 'PL-TATA-01',
          fullName: 'Ratan Tata',
          email: 'ratan.tata@trivab.com',
          mobile: '9876543214',
          playingStyle: 'Batsman',
          jerseyNumber: '1',
          status: 'Active',
          teamName: 'Tata Challengers'
        },
        {
          playerId: 'PL-AMBANI-02',
          fullName: 'Ambani XI',
          email: 'ambani.xi@trivab.com',
          mobile: '9876543215',
          playingStyle: 'All-Rounder',
          jerseyNumber: '2',
          status: 'Active',
          teamName: 'Reliance Stars'
        }
      ];

      for (const p of playersToSeed) {
        const matchedTeam = createdTeams.find(t => t.teamName === p.teamName);
        const playerDoc = {
          playerId: p.playerId,
          fullName: p.fullName,
          email: p.email,
          mobile: p.mobile,
          playingStyle: p.playingStyle,
          jerseyNumber: p.jerseyNumber,
          status: p.status,
          teamId: matchedTeam ? matchedTeam.id : '',
          teamName: p.teamName,
          role: 'captain',
          createdAt: new Date().toISOString()
        };
        await setDocument('players', p.playerId, playerDoc);
      }

      // 4. Seed Matches
      const matchesToSeed = [
        {
          tournamentId: 'bapl-south',
          teamA: 'Colaba Strikers',
          teamB: 'Churchgate Kings',
          venue: 'Wankhede Stadium',
          date: '2026-06-15',
          time: '18:00',
          format: 'T20',
          status: 'Upcoming',
          createdAt: new Date().toISOString()
        },
        {
          tournamentId: 'bapl-south',
          teamA: 'Marine Drive Titans',
          teamB: 'Colaba Strikers',
          venue: 'Brabourne Stadium',
          date: '2026-06-18',
          time: '19:30',
          format: 'T20',
          status: 'Live',
          tossWinner: 'Marine Drive Titans',
          tossDecision: 'Batting',
          teamAScore: '125/2 (12.4 overs)',
          teamBScore: '',
          result: '',
          createdAt: new Date().toISOString()
        },
        {
          tournamentId: 'bapl-north',
          teamA: 'Bandra Blasters',
          teamB: 'Colaba Strikers',
          venue: 'DY Patil Stadium',
          date: '2026-07-02',
          time: '16:00',
          format: 'T20',
          status: 'Upcoming',
          createdAt: new Date().toISOString()
        },
        {
          tournamentId: 'baplcorporate-south',
          teamA: 'Tata Challengers',
          teamB: 'Reliance Stars',
          venue: 'MCA Ground BKC',
          date: '2026-05-24',
          time: '14:00',
          format: 'T20',
          status: 'Completed',
          tossWinner: 'Tata Challengers',
          tossDecision: 'Bowling',
          teamAScore: '168/4 (19.2 overs)',
          teamBScore: '164/7 (20 overs)',
          result: 'Tata Challengers won by 6 wickets',
          createdAt: new Date().toISOString()
        }
      ];

      for (const m of matchesToSeed) {
        await addDocument('matches', m);
      }

      // 5. Seed Sponsors
      const sponsorsToSeed = [
        {
          id: 's1',
          data: {
            name: 'Panchnaad Groups',
            tier: 'Title Sponsor',
            role: 'Title Sponsor',
            bannerURL: '/logos/panchnaad.jpg',
            website: 'http://panchnaadgroup.com',
            description: 'Title Sponsor of the premier BAPL League, building the future of Mumbai.',
            displayOrder: 1
          }
        },
        {
          id: 's2',
          data: {
            name: 'Nexus Sports',
            tier: 'Co-Sponsor',
            role: 'Sports & Apparel Partner',
            bannerURL: '/logos/nexussports.jpg',
            website: 'https://nexus.com',
            description: 'Sports and apparel partner providing premium custom team kits.',
            displayOrder: 2
          }
        },
        {
          id: 's3',
          data: {
            name: 'buffering',
            tier: 'Co-Sponsor',
            role: 'Media Partner',
            bannerURL: '/logos/buffering.jpg',
            website: 'https://buffering.in',
            description: 'Official media coverage and broadcasting partner.',
            displayOrder: 3
          }
        },
        {
          id: 's4',
          data: {
            name: 'Regal interior studios',
            tier: 'Co-Sponsor',
            role: 'Design & Decor Partner',
            bannerURL: '/logos/regalinterior.jpg',
            website: 'https://regalstudios.com',
            description: 'Design and decor partner designing premium VIP enclosures.',
            displayOrder: 4
          }
        },
        {
          id: 's5',
          data: {
            name: 'crickstore',
            tier: 'Partner Sponsor',
            role: 'Associate Partner',
            bannerURL: '/logos/crickstore.jpg',
            website: 'https://www.crickstore.com',
            description: 'Associate partner supplying professional cricket equipment.',
            displayOrder: 5
          }
        },
        {
          id: 's6',
          data: {
            name: 'hub town',
            tier: 'Partner Sponsor',
            role: 'Real Estate Partner',
            bannerURL: '/logos/hubtown.jpg',
            website: 'http://www.hubtown.co.in',
            description: 'Real estate partner supporting community sports initiatives.',
            displayOrder: 6
          }
        },
        {
          id: 's7',
          data: {
            name: 'physiorehability',
            tier: 'Partner Sponsor',
            role: 'Physio Partner',
            bannerURL: '/logos/physiorehability.jpg',
            website: 'https://physiorehab.com',
            description: 'Official physiotherapy and muscle recovery partner.',
            displayOrder: 7
          }
        },
        {
          id: 's8',
          data: {
            name: 'upurFit',
            tier: 'Partner Sponsor',
            role: 'Pain & Relief Partner',
            bannerURL: '/logos/upurfit.jpg',
            website: 'https://upurfit.com',
            description: 'Pain relief and recovery partner keeping players fit.',
            displayOrder: 8
          }
        },
        {
          id: 's9',
          data: {
            name: 'midday gujrati',
            tier: 'Partner Sponsor',
            role: 'News Partner',
            bannerURL: '/logos/midday.jpg',
            website: 'https://www.gujaratimidday.com',
            description: 'Official Gujarati news media and print coverage partner.',
            displayOrder: 9
          }
        }
      ];

      for (const s of sponsorsToSeed) {
        await setDocument('sponsors', s.id, s.data);
      }

      setSeedingSuccess('Successfully initialized professional database with demo Tournaments, Teams, Captains, Matches, and Sponsors!');

      
      // Update counters dynamically
      const [playersList, teamsCount, matchesList, tournamentsList] = await Promise.all([
        getCollection('players'),
        getCollection('teams'),
        getCollection('matches'),
        getCollection('tournaments'),
      ]);

      setStats({
        totalPlayers: playersList.length,
        totalTeams: teamsCount.length,
        totalMatches: matchesList.length,
        totalTournaments: tournamentsList.length,
      });

    } catch (err) {
      console.error(err);
      setSeedingSuccess('Error initializing database: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="admin-page container section-padding">
      <div className="page-header mb-xl">
        <h1 className="display-sm text-gradient-gold">Admin Dashboard</h1>
        <p className="text-secondary">Overview of the TRIVAB sports platform metrics and management console.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid mb-xl">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <Users size={32} style={{ color: '#3b82f6' }} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Players</div>
            <div className="stat-value">{stats.totalPlayers}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
            <Trophy size={32} style={{ color: '#22c55e' }} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Teams</div>
            <div className="stat-value">{stats.totalTeams}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}>
            <Calendar size={32} style={{ color: '#a855f7' }} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Matches</div>
            <div className="stat-value">{stats.totalMatches}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }}>
            <Trophy size={32} style={{ color: '#f97316' }} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Tournaments</div>
            <div className="stat-value">{stats.totalTournaments}</div>
          </div>
        </div>
      </div>

      {/* Charts & Analytics */}
      <div className="admin-section mb-xl">
        <h3 className="section-title">Squad Statistics & Analytics</h3>
        <div className="grid grid-2 gap-lg">
          <div className="admin-chart-panel">
            <h4 className="text-md font-bold mb-md text-primary">Player Roles Distribution</h4>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={roleChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
                  <XAxis dataKey="name" stroke="var(--admin-text)" fontSize={12} />
                  <YAxis stroke="var(--admin-text)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--admin-card-bg)', borderColor: 'var(--admin-border)' }} />
                  <Bar dataKey="count" fill="var(--admin-accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="admin-chart-panel">
            <h4 className="text-md font-bold mb-md text-primary">Match Status Distribution</h4>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={matchChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
                  <XAxis dataKey="name" stroke="var(--admin-text)" fontSize={12} />
                  <YAxis stroke="var(--admin-text)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--admin-card-bg)', borderColor: 'var(--admin-border)' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="admin-section mb-xl">
        <h3 className="section-title">Quick Actions</h3>
        <div className="action-cards">
          <Link to="/admin/tournaments" className="action-card">
            <Trophy size={40} style={{ color: 'var(--admin-accent)' }} />
            <h3>Manage Tournaments</h3>
            <p>Create and schedule tournaments</p>
          </Link>
          <Link to="/admin/players" className="action-card">
            <Users size={40} style={{ color: 'var(--admin-accent)' }} />
            <h3>Manage Players</h3>
            <p>Add, edit, or remove players</p>
          </Link>
          <Link to="/admin/teams" className="action-card">
            <Trophy size={40} style={{ color: 'var(--admin-accent)' }} />
            <h3>Manage Teams</h3>
            <p>Create and manage teams</p>
          </Link>
          <Link to="/admin/matches" className="action-card">
            <Calendar size={40} style={{ color: 'var(--admin-accent)' }} />
            <h3>Schedule Matches</h3>
            <p>Plan tournament fixtures</p>
          </Link>
          <Link to="/admin/images" className="action-card">
            <Image size={40} style={{ color: 'var(--admin-accent)' }} />
            <h3>Upload Images</h3>
            <p>Upload media for tournament</p>
          </Link>
          <Link to="/scanner" className="action-card" target="_blank" rel="noreferrer">
            <ScanLine size={40} style={{ color: 'var(--admin-accent)' }} />
            <h3>QR Scanner</h3>
            <p>Scan &amp; verify player ID cards</p>
          </Link>
        </div>
      </div>

      {/* Database Initialization Panel */}
      <div className="admin-section mb-xl">
        <h3 className="section-title">System & Database Initialization</h3>
        <div className="admin-seeding-panel">
          <div className="flex flex-col gap-md">
            <div className="flex items-center gap-md">
              <Database size={32} style={{ color: 'var(--admin-accent)' }} />
              <div>
                <h4 className="text-md font-bold text-gradient-gold">Setup Demo Environment</h4>
                <p className="text-secondary text-sm">
                  If your database is brand new and empty, you won't be able to schedule matches or teams. Click below to automatically seed the database with tournaments, teams, and sample match data.
                </p>
              </div>
            </div>
            {seedingSuccess && (
              <div className={`alert ${seedingSuccess.startsWith('Error') ? 'alert-error' : 'alert-success'} mt-md`}>
                <AlertCircle size={18} />
                <span>{seedingSuccess}</span>
              </div>
            )}
            <div className="flex gap-md mt-md">
              <button
                type="button"
                onClick={handleInitializeDatabase}
                disabled={seeding}
                className="btn btn-gold flex-1"
                style={{ opacity: seeding ? 0.7 : 1 }}
              >
                {seeding ? 'Seeding Database...' : 'Initialize Professional Demo Data'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Roster Enrollments Feed (Admin Notifications) */}
      <div className="admin-section mb-xl">
        <h3 className="section-title">Roster Enrollments Feed</h3>
        <div style={{
          borderBottom: '1px solid var(--admin-border)',
          overflow: 'hidden',
        }}>
          {enrollNotifications.length > 0 ? (
            <div>
              {enrollNotifications.map((notif, idx) => (
                <div
                  key={notif.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-md) var(--space-lg)',
                    borderBottom: idx < enrollNotifications.length - 1 ? '1px solid var(--admin-border)' : 'none',
                    background: notif.type === 'captain_joined' ? 'rgba(212, 175, 55, 0.03)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: notif.type === 'captain_joined' ? 'var(--gold)' : '#22c55e' 
                    }} />
                    <div>
                      <p style={{ margin: 0, color: 'var(--admin-text)' }}>
                        <strong>{notif.title}</strong>: {notif.message}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--admin-text)', opacity: 0.6 }}>
                        {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: 'var(--space-xl)',
              textAlign: 'center',
              color: 'var(--admin-text)',
              opacity: 0.5,
            }}>
              <AlertCircle size={32} style={{ marginBottom: 'var(--space-md)' }} />
              <p>No new roster enrollment notifications yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="admin-section">
        <h3 className="section-title">Recent Activity</h3>
        <div style={{
          borderBottom: '1px solid var(--admin-border)',
          overflow: 'hidden',
        }}>
          {recentActivity.length > 0 ? (
            <div>
              {recentActivity.map((activity, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-md) var(--space-lg)',
                    borderBottom: idx < recentActivity.length - 1 ? '1px solid var(--admin-border)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <Activity size={18} style={{ color: 'var(--admin-accent)' }} />
                    <div>
                      <p style={{ margin: 0, color: 'var(--admin-text)' }}>
                        {activity.type === 'player' && '🎮 New player added: '}
                        {activity.type === 'team' && '🏏 New team created: '}
                        {activity.type === 'match' && '⏰ New match scheduled: '}
                        <strong>{activity.name}</strong>
                      </p>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--admin-text)', opacity: 0.6 }}>
                        {activity.time ? new Date(activity.time).toLocaleDateString() : 'Recently'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} style={{ color: 'var(--admin-text)', opacity: 0.5 }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: 'var(--space-xl)',
              textAlign: 'center',
              color: 'var(--admin-text)',
              opacity: 0.5,
            }}>
              <AlertCircle size={32} style={{ marginBottom: 'var(--space-md)' }} />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
