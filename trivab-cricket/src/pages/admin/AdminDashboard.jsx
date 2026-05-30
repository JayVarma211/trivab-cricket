import { useEffect, useState } from 'react';
import { getCollection, addDocument, setDocument, deleteDocument } from '../../firebase/firestore';
import {
  Users, Trophy, Calendar, Award, Shield, Plus, Trash2, Edit2,
  CheckCircle, FileSpreadsheet, Eye, LogIn, ExternalLink, Activity
} from 'lucide-react';
import Loader from '../../components/common/Loader';
import './Admin.css';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('players');
  const [loading, setLoading] = useState(true);

  // Db State Arrays
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [scanLogs, setScanLogs] = useState([]);

  // Create Form States
  const [newTeamName, setNewTeamName] = useState('');
  const [newTournName, setNewTournName] = useState('');
  const [newTournStatus, setNewTournStatus] = useState('Upcoming');

  const [matchTeamA, setMatchTeamA] = useState('');
  const [matchTeamB, setMatchTeamB] = useState('');
  const [matchVenue, setMatchVenue] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [matchStatus, setMatchStatus] = useState('Upcoming');

  const [sponsorName, setSponsorName] = useState('');
  const [sponsorTier, setSponsorTier] = useState('Title Sponsor');
  const [sponsorLink, setSponsorLink] = useState('');
  const [sponsorDesc, setSponsorDesc] = useState('');

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const p = await getCollection('players');
        const t = await getCollection('teams');
        const tr = await getCollection('tournaments');
        const m = await getCollection('matches');
        const s = await getCollection('sponsors');
        const l = await getCollection('qr_scan_logs');

        setPlayers(p);
        setTeams(t);
        setTournaments(tr);
        setMatches(m);
        setSponsors(s);
        setScanLogs(l);

        if (t.length > 0) {
          setMatchTeamA(t[0].teamName);
          setMatchTeamB(t[1]?.teamName || t[0].teamName);
        }
      } catch (err) {
        console.error('Error fetching admin data, using demo entries', err);
        // Fallbacks
        setPlayers([
          { playerId: 'TRIVAB-MUM-2026-9812', fullName: 'Rohan Sharma', teamName: 'Mumbai Knights', playingStyle: 'Batsman', jerseyNumber: '18', mobile: '9876543210' },
          { playerId: 'TRIVAB-BNG-2026-5421', fullName: 'Vikram Patel', teamName: 'Bangalore Royals', playingStyle: 'Batsman', jerseyNumber: '7', mobile: '9876543211' },
          { playerId: 'TRIVAB-CHN-2026-3847', fullName: 'Arjun Reddy', teamName: 'Chennai Warriors', playingStyle: 'Bowler', jerseyNumber: '13', mobile: '9876543212' }
        ]);
        setTeams([
          { id: 'team1', teamName: 'Mumbai Knights', playerCount: 1, city: 'Mumbai', wins: 5, losses: 2 },
          { id: 'team2', teamName: 'Bangalore Royals', playerCount: 1, city: 'Bangalore', wins: 7, losses: 1 },
          { id: 'team3', teamName: 'Chennai Warriors', playerCount: 1, city: 'Chennai', wins: 4, losses: 3 }
        ]);
        setTournaments([
          { id: 'tourn1', name: 'Champions Cup 2026', status: 'Live' }
        ]);
        setMatches([
          { id: 'match1', teamA: 'Mumbai Knights', teamB: 'Delhi Dynamos', venue: 'Wankhede', date: '2026-05-31', time: '18:30', status: 'Upcoming' }
        ]);
        setScanLogs([
          { id: 'log1', playerId: 'TRIVAB-MUM-2026-9812', fullName: 'Rohan Sharma', teamName: 'Mumbai Knights', scannedAt: '2026-05-30T10:15:30Z', status: 'Success' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // Creation Actions
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      const docData = {
        teamName: newTeamName,
        playerCount: 0,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDocument('teams', docData);
      setTeams(prev => [...prev, { id: docRef.id, ...docData }]);
      setNewTeamName('');
      alert('Team added successfully!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTournament = async (e) => {
    e.preventDefault();
    if (!newTournName.trim()) return;
    try {
      const docData = {
        name: newTournName,
        status: newTournStatus,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDocument('tournaments', docData);
      setTournaments(prev => [...prev, { id: docRef.id, ...docData }]);
      setNewTournName('');
      alert('Tournament created successfully!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    try {
      const docData = {
        teamA: matchTeamA,
        teamB: matchTeamB,
        venue: matchVenue,
        date: matchDate,
        time: matchTime,
        status: matchStatus,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDocument('matches', docData);
      setMatches(prev => [...prev, { id: docRef.id, ...docData }]);
      setMatchVenue('');
      alert('Match schedule created!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSponsor = async (e) => {
    e.preventDefault();
    try {
      const docData = {
        name: sponsorName,
        tier: sponsorTier,
        website: sponsorLink,
        description: sponsorDesc,
        displayOrder: sponsors.length + 1,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDocument('sponsors', docData);
      setSponsors(prev => [...prev, { id: docRef.id, ...docData }]);
      setSponsorName('');
      setSponsorLink('');
      setSponsorDesc('');
      alert('Sponsor details logged!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePlayer = async (id, isPlayerId = true) => {
    if (!confirm('Are you sure you want to delete this player?')) return;
    try {
      await deleteDocument('players', id);
      setPlayers(prev => prev.filter(p => p.playerId !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportPlayers = () => {
    const headers = ['Player ID,Full Name,Email,Team Name,Playing Style,Jersey,Mobile\n'];
    const rows = players.map(p => 
      `"${p.playerId}","${p.fullName}","${p.email || ''}","${p.teamName}","${p.playingStyle}","${p.jerseyNumber}","${p.mobile}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TRIVAB-Players-${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  if (loading) return <Loader />;

  return (
    <div className="admin-dashboard page-enter container section-padding">
      <div className="dashboard-header flex justify-between items-end mb-xl">
        <div>
          <span className="text-gold text-sm font-bold uppercase tracking-wider">Control Panel</span>
          <h1 className="display-md">Admin Dashboard</h1>
        </div>
        <button onClick={handleExportPlayers} className="btn btn-gold btn-sm">
          <FileSpreadsheet size={16} /> Export Players CSV
        </button>
      </div>

      <div className="tabs admin-tabs mb-xl">
        <button onClick={() => setActiveTab('players')} className={`tab-btn ${activeTab === 'players' ? 'active' : ''}`}>
          <Users size={16} /> Players List
        </button>
        <button onClick={() => setActiveTab('teams')} className={`tab-btn ${activeTab === 'teams' ? 'active' : ''}`}>
          <Shield size={16} /> Teams
        </button>
        <button onClick={() => setActiveTab('tournaments')} className={`tab-btn ${activeTab === 'tournaments' ? 'active' : ''}`}>
          <Trophy size={16} /> Tournaments
        </button>
        <button onClick={() => setActiveTab('matches')} className={`tab-btn ${activeTab === 'matches' ? 'active' : ''}`}>
          <Calendar size={16} /> Matches
        </button>
        <button onClick={() => setActiveTab('sponsors')} className={`tab-btn ${activeTab === 'sponsors' ? 'active' : ''}`}>
          <Award size={16} /> Sponsors
        </button>
        <button onClick={() => setActiveTab('logs')} className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}>
          <Activity size={16} /> QR Logs
        </button>
      </div>

      <div className="admin-content-card card">
        {/* Tab 1: Players Management */}
        {activeTab === 'players' && (
          <div className="admin-subpanel">
            <h3 className="text-lg font-bold mb-md text-gradient-gold">Manage Players ({players.length})</h3>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Player Name</th>
                    <th>ID</th>
                    <th>Team</th>
                    <th>Style</th>
                    <th>Jersey</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p) => (
                    <tr key={p.playerId}>
                      <td className="font-semi text-primary">{p.fullName}</td>
                      <td>{p.playerId}</td>
                      <td className="text-gold font-semi">{p.teamName}</td>
                      <td><span className="badge badge-gold">{p.playingStyle}</span></td>
                      <td>#{p.jerseyNumber}</td>
                      <td>
                        <button onClick={() => handleDeletePlayer(p.playerId)} className="btn-table-action text-red" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Teams Management */}
        {activeTab === 'teams' && (
          <div className="admin-subpanel">
            <h3 className="text-lg font-bold mb-md text-gradient-gold">Teams Configuration</h3>
            <form onSubmit={handleCreateTeam} className="flex gap-md mb-xl items-end max-width-600">
              <div className="form-group flex-1">
                <label className="form-label">New Team Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai Kings"
                  className="form-input"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-gold">
                <Plus size={18} /> Add Team
              </button>
            </form>

            <h4 className="text-sm font-bold uppercase tracking-wider mb-sm">Current Teams ({teams.length})</h4>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Team Name</th>
                    <th>Registered Players</th>
                    <th>Roster Slots</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t) => (
                    <tr key={t.id}>
                      <td className="font-semi text-primary">{t.teamName}</td>
                      <td className="font-bold text-gold">{t.playerCount || 0} players</td>
                      <td>
                        <span className={`badge ${(t.playerCount || 0) >= 35 ? 'badge-red' : 'badge-green'}`}>
                          {t.playerCount >= 35 ? 'Roster Filled' : `${35 - (t.playerCount || 0)} Slots Available`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Tournaments Management */}
        {activeTab === 'tournaments' && (
          <div className="admin-subpanel">
            <h3 className="text-lg font-bold mb-md text-gradient-gold">Configure Tournaments</h3>
            <form onSubmit={handleCreateTournament} className="flex gap-md mb-xl items-end max-width-600">
              <div className="form-group flex-1">
                <label className="form-label">Tournament Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai T20 League"
                  className="form-input"
                  required
                  value={newTournName}
                  onChange={(e) => setNewTournName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Initial Status</label>
                <select className="form-select" value={newTournStatus} onChange={(e) => setNewTournStatus(e.target.value)}>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Live">Live</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <button type="submit" className="btn btn-gold">
                <Plus size={18} /> Create
              </button>
            </form>

            <div className="grid grid-3 gap-lg">
              {tournaments.map((t) => (
                <div className="card" key={t.id}>
                  <h4 className="font-bold text-lg mb-xs">{t.name}</h4>
                  <span className={`badge ${t.status === 'Live' ? 'badge-red' : 'badge-gold'}`}>{t.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Match Schedule Scheduler */}
        {activeTab === 'matches' && (
          <div className="admin-subpanel">
            <h3 className="text-lg font-bold mb-md text-gradient-gold">Schedule Match Fixings</h3>
            <form onSubmit={handleCreateMatch} className="flex flex-col gap-md mb-xl max-width-600">
              <div className="grid grid-2 gap-md">
                <div className="form-group">
                  <label className="form-label">Team A</label>
                  <select className="form-select" value={matchTeamA} onChange={(e) => setMatchTeamA(e.target.value)}>
                    {teams.map(t => <option key={t.id} value={t.teamName}>{t.teamName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Team B</label>
                  <select className="form-select" value={matchTeamB} onChange={(e) => setMatchTeamB(e.target.value)}>
                    {teams.map(t => <option key={t.id} value={t.teamName}>{t.teamName}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-3 gap-md">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" required value={matchDate} onChange={(e) => setMatchDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input type="time" className="form-input" required value={matchTime} onChange={(e) => setMatchTime(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Venue</label>
                  <input type="text" placeholder="Venue Stadium" className="form-input" required value={matchVenue} onChange={(e) => setMatchVenue(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="btn btn-gold align-self-start">
                <Calendar size={18} /> Schedule Match
              </button>
            </form>
          </div>
        )}

        {/* Tab 5: Sponsor Management */}
        {activeTab === 'sponsors' && (
          <div className="admin-subpanel">
            <h3 className="text-lg font-bold mb-md text-gradient-gold">Manage League Sponsors</h3>
            <form onSubmit={handleCreateSponsor} className="flex flex-col gap-md mb-xl max-width-600">
              <div className="grid grid-2 gap-md">
                <div className="form-group">
                  <label className="form-label">Sponsor Company Name</label>
                  <input type="text" placeholder="Apex Pro Batting" className="form-input" required value={sponsorName} onChange={(e) => setSponsorName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Sponsorship Tier</label>
                  <select className="form-select" value={sponsorTier} onChange={(e) => setSponsorTier(e.target.value)}>
                    <option value="Title Sponsor">Title Sponsor</option>
                    <option value="Co-Sponsor">Co-Sponsor</option>
                    <option value="Partner Sponsor">Partner Sponsor</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Website URL Link</label>
                <input type="url" placeholder="https://apex.com" className="form-input" required value={sponsorLink} onChange={(e) => setSponsorLink(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Description Info</label>
                <textarea placeholder="Describe this partner organization..." className="form-textarea" required value={sponsorDesc} onChange={(e) => setSponsorDesc(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-gold align-self-start">
                <Plus size={18} /> Add Partner
              </button>
            </form>
          </div>
        )}

        {/* Tab 6: QR Scan Logs */}
        {activeTab === 'logs' && (
          <div className="admin-subpanel">
            <h3 className="text-lg font-bold mb-md text-gradient-gold">QR Verification logs</h3>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date & Time Scanned</th>
                    <th>Scanned Player Name</th>
                    <th>Team Name</th>
                    <th>Verification Result</th>
                  </tr>
                </thead>
                <tbody>
                  {scanLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center text-muted">No scan activities logged yet today.</td>
                    </tr>
                  ) : (
                    scanLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{new Date(log.scannedAt).toLocaleString()}</td>
                        <td className="font-semi text-primary">{log.fullName || log.playerId}</td>
                        <td>{log.teamName || 'N/A'}</td>
                        <td>
                          <span className={`badge ${log.status === 'Success' ? 'badge-green' : 'badge-red'}`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
