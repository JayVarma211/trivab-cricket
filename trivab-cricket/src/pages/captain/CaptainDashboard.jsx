import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCollection, getDocument, setDocument, where } from '../../firebase/firestore';
import { Users, User, Award, ShieldAlert, Edit, Save, Bell, Plus, CheckCircle } from 'lucide-react';
import Loader from '../../components/common/Loader';
import './Captain.css';

export default function CaptainDashboard() {
  const { user } = useAuth();
  const [captain, setCaptain] = useState(null);
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [editMode, setEditMode] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [logoURL, setLogoURL] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCaptainData = async () => {
      if (!user) return;
      try {
        const captData = await getDocument('captains', user.uid);
        setCaptain(captData);

        if (captData && captData.teamId) {
          const teamData = await getDocument('teams', captData.teamId);
          setTeam(teamData);
          if (teamData) {
            setTeamName(teamData.teamName || '');
            setLogoURL(teamData.logoURL || '');
          }

          // Load players of this team
          const teamPlayers = await getCollection('players', [
            where('teamId', '==', captData.teamId)
          ]);
          setPlayers(teamPlayers);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCaptainData();
  }, [user]);

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    if (!captain?.teamId) return;
    setSaving(true);
    try {
      const updated = {
        ...team,
        teamName,
        logoURL
      };
      await setDocument('teams', captain.teamId, updated);
      setTeam(updated);
      setEditMode(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  if (!captain) {
    return (
      <div className="container section-padding text-center">
        <h2 className="display-sm text-red">Access Restrained</h2>
        <p className="text-secondary mb-md">This dashboard is only available for verified Team Captain profiles.</p>
      </div>
    );
  }

  const limitReached = players.length >= 35;

  return (
    <div className="captain-dashboard page-enter container section-padding">
      <div className="dashboard-header flex justify-between items-end mb-xl">
        <div>
          <span className="text-gold text-sm font-bold uppercase tracking-wider">Management Center</span>
          <h1 className="display-md">Captain Dashboard</h1>
          <p className="text-secondary text-sm">Managing: <span className="text-gold font-semi">{team?.teamName || 'Roster Team'}</span></p>
        </div>
        <button className="btn btn-gold btn-sm" onClick={() => setEditMode(!editMode)}>
          <Edit size={16} /> {editMode ? 'Cancel Edit' : 'Edit Team Info'}
        </button>
      </div>

      {/* Cap Limit Banner Notification */}
      {limitReached ? (
        <div className="alert alert-warning flex gap-sm items-center mb-xl">
          <Bell size={20} className="animate-bounce" />
          <div>
            <strong className="block text-sm">ROSTER CAP REACHED (35/35 Players)</strong>
            <span className="text-xs">Your squad contains the maximum permitted number of participants. New players will not be able to join your team.</span>
          </div>
        </div>
      ) : (
        <div className="alert alert-info flex gap-sm items-center mb-xl">
          <CheckCircle size={20} />
          <div>
            <span className="text-sm">Roster Status: <strong>{players.length} / 35 Players Registered</strong>. You can register {35 - players.length} more players.</span>
          </div>
        </div>
      )}

      <div className="captain-grid">
        {/* Team Configuration / Edit Mode */}
        {editMode ? (
          <div className="card card-gold edit-team-form">
            <h3 className="text-lg font-bold mb-md text-gradient-gold">Edit Team Profile</h3>
            <form onSubmit={handleSaveTeam} className="flex flex-col gap-md">
              <div className="form-group">
                <label className="form-label">Team Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Team Logo Image URL</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://example.com/logo.png"
                  value={logoURL}
                  onChange={(e) => setLogoURL(e.target.value)}
                  disabled={saving}
                />
              </div>
              <button type="submit" className="btn btn-gold" disabled={saving}>
                <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>
        ) : (
          <div className="card stats-panel-card">
            <h3 className="text-lg font-bold mb-md text-gradient-gold">Squad Distribution</h3>
            <div className="stats-row flex gap-lg">
              <div className="stat-box text-center">
                <span className="stat-num text-gradient-gold">{players.filter(p => p.playingStyle === 'Batsman').length}</span>
                <span className="stat-lbl block text-xs">BATSMEN</span>
              </div>
              <div className="stat-box text-center">
                <span className="stat-num text-gradient-gold">{players.filter(p => p.playingStyle === 'Bowler').length}</span>
                <span className="stat-lbl block text-xs">BOWLERS</span>
              </div>
              <div className="stat-box text-center">
                <span className="stat-num text-gradient-gold">{players.filter(p => p.playingStyle === 'Wicket Keeper').length}</span>
                <span className="stat-lbl block text-xs">KEEPERS</span>
              </div>
              <div className="stat-box text-center">
                <span className="stat-num text-gradient-gold">{players.filter(p => p.playingStyle === 'All-Rounder').length}</span>
                <span className="stat-lbl block text-xs">ALL-ROUNDERS</span>
              </div>
            </div>
          </div>
        )}

        {/* Players List */}
        <div className="card players-table-card">
          <h3 className="text-lg font-bold mb-md text-gradient-gold flex items-center gap-sm">
            <Users size={20} /> Squad Players List ({players.length})
          </h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>ID</th>
                  <th>Style</th>
                  <th>Jersey</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {players.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">No players have registered to this team yet.</td>
                  </tr>
                ) : (
                  players.map((p) => (
                    <tr key={p.playerId}>
                      <td className="flex items-center gap-sm font-semi text-primary">
                        <div className="avatar avatar-sm">
                          {p.photoURL ? <img src={p.photoURL} alt={p.fullName} /> : p.fullName[0]}
                        </div>
                        {p.fullName}
                      </td>
                      <td>{p.playerId}</td>
                      <td>
                        <span className="badge badge-gold">{p.playingStyle}</span>
                      </td>
                      <td className="font-bold">#{p.jerseyNumber}</td>
                      <td>{p.mobile}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
