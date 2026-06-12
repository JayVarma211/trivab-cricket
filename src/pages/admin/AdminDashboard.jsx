import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCollection, setDocument, addDocument } from '../../firebase/firestore';
import { logoutUser } from '../../firebase/auth';
import {
  Users, Trophy, Calendar, Image, ChevronRight, Activity, AlertCircle, Database, Camera, Shield, Newspaper
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
        let players = [];
        let teams = [];
        let matches = [];
        let tournaments = [];
        let notifications = [];

        try { players = await getCollection('players') || []; } catch (e) { console.warn("Failed to fetch players:", e); }
        try { teams = await getCollection('teams') || []; } catch (e) { console.warn("Failed to fetch teams:", e); }
        try { matches = await getCollection('matches') || []; } catch (e) { console.warn("Failed to fetch matches:", e); }
        try { tournaments = await getCollection('tournaments') || []; } catch (e) { console.warn("Failed to fetch tournaments:", e); }
        try { notifications = await getCollection('admin_notifications') || []; } catch (e) { console.warn("Failed to fetch admin_notifications:", e); }

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
          maxPlayers: 40,
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
          maxPlayers: 40,
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
          maxPlayers: 40,
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
          maxPlayers: 40,
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
          maxPlayers: 40,
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
          maxPlayers: 40,
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
                      {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : 'Just now'}
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

      {/* Database Initialization Panel */}
      <div className="admin-section">
        <h3 className="admin-section-title">System Initialization</h3>
        <div className="admin-seeding-panel">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <Database size={28} style={{ color: 'var(--admin-gold)', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ color: 'var(--admin-gold)', margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 700 }}>Setup Demo Environment</h4>
              <p style={{ color: 'var(--admin-muted)', margin: '0 0 16px', fontSize: '0.82rem', lineHeight: 1.6 }}>
                If your database is brand new and empty, click below to automatically seed the database with tournaments, teams, and sample match data.
              </p>
              {seedingSuccess && (
                <div className={`alert ${seedingSuccess.startsWith('Error') ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: '16px' }}>
                  <AlertCircle size={16} />
                  <span style={{ fontSize: '0.82rem' }}>{seedingSuccess}</span>
                </div>
              )}
              <button
                type="button"
                onClick={handleInitializeDatabase}
                disabled={seeding}
                className="btn btn-outline"
                style={{ opacity: seeding ? 0.7 : 1, fontSize: '0.85rem' }}
              >
                <Database size={16} />
                {seeding ? 'Seeding Database...' : 'Initialize Professional Demo Data'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
