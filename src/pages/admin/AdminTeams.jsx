import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCollection, addDocument, updateDocument, deleteDocument } from '../../firebase/firestore';
import { Trophy, Trash2, Plus, AlertCircle, Edit2, Search } from 'lucide-react';
import './Admin.css';

export default function AdminTeams() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    teamName: '',
    city: '',
    captainId: '',
    captainName: '',
    wins: 0,
    losses: 0,
    maxPlayers: 35,
    tournamentId: '',
    tournamentName: '',
  });

  useEffect(() => {
    if (role !== 'admin') navigate('/admin/login');
    fetchData();
  }, [role, navigate]);

  const fetchData = async () => {
    try {
      const teamsData = await getCollection('teams', []);
      const tournamentsData = await getCollection('tournaments', []);
      setTeams(teamsData);
      setTournaments(tournamentsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'wins' || name === 'losses' || name === 'maxPlayers' ? parseInt(value) : value
    }));
  };

  const handleTournamentChange = (e) => {
    const tournamentId = e.target.value;
    const selected = tournaments.find(t => t.id === tournamentId);
    setFormData(prev => ({
      ...prev,
      tournamentId,
      tournamentName: selected ? selected.name : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const teamData = {
        teamName: formData.teamName,
        city: formData.city,
        captainId: formData.captainId,
        captainName: formData.captainName,
        wins: formData.wins || 0,
        losses: formData.losses || 0,
        playerCount: formData.playerCount || 0,
        maxPlayers: formData.maxPlayers || 35,
        tournamentId: formData.tournamentId || '',
        tournamentName: formData.tournamentName || '',
      };

      if (editingId) {
        await updateDocument('teams', editingId, teamData);
      } else {
        await addDocument('teams', teamData);
      }

      fetchData();
      setShowForm(false);
      setEditingId(null);
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to save team');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    
    try {
      await deleteDocument('teams', id);
      fetchData();
    } catch (err) {
      setError('Failed to delete team');
    }
  };

  const handleEdit = (team) => {
    setFormData({
      teamName: team.teamName,
      city: team.city || '',
      captainId: team.captainId || '',
      captainName: team.captainName || '',
      wins: team.wins || 0,
      losses: team.losses || 0,
      maxPlayers: team.maxPlayers || 35,
      tournamentId: team.tournamentId || '',
      tournamentName: team.tournamentName || '',
    });
    setEditingId(team.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      teamName: '',
      city: '',
      captainId: '',
      captainName: '',
      wins: 0,
      losses: 0,
      maxPlayers: 35,
      tournamentId: '',
      tournamentName: '',
    });
  };

  const filteredTeams = teams.filter(t =>
    t.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="container section-padding"><p>Loading...</p></div>;

  return (
    <div className="admin-page container section-padding">
      <div className="page-header flex justify-between items-center mb-xl">
        <div>
          <h1 className="display-sm text-gradient-gold">Team Management</h1>
          <p className="text-secondary">Total Teams: {teams.length}</p>
        </div>
        <button
          onClick={() => {
            if (tournaments.length === 0) {
              alert('Please create a tournament first.');
              return;
            }
            resetForm();
            setEditingId(null);
            setShowForm(!showForm);
          }}
          disabled={tournaments.length === 0}
          className="btn btn-gold"
          style={{
            opacity: tournaments.length === 0 ? 0.5 : 1,
            cursor: tournaments.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          <Plus size={18} /> Add Team
        </button>
      </div>

      {tournaments.length === 0 ? (
        <div className="alert alert-error mb-xl" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <AlertCircle size={24} />
          <div>
            <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '4px' }}>No Active Tournaments Found</strong>
            <span>You must create at least one tournament in the <strong>Tournaments</strong> tab (or click "Initialize Professional Demo Data" on the Dashboard) before you can add and register teams.</span>
          </div>
        </div>
      ) : null}

      {error && (
        <div className="alert alert-error mb-lg">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {showForm && (
        <div className="card card-gold mb-xl p-lg">
          <h2 className="text-lg font-bold mb-md">
            {editingId ? 'Edit Team' : 'Add New Team'}
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-2 gap-md">
            <div className="form-group">
              <label className="form-label">Team Name</label>
              <input
                type="text"
                name="teamName"
                className="form-input"
                placeholder="e.g. Mumbai Knights"
                required
                value={formData.teamName}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                name="city"
                className="form-input"
                placeholder="e.g. Mumbai"
                value={formData.city}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Tournament</label>
              <select
                name="tournamentId"
                className="form-select"
                value={formData.tournamentId}
                onChange={handleTournamentChange}
              >
                <option value="">Select Tournament (Optional)</option>
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Captain Name</label>
              <input
                type="text"
                name="captainName"
                className="form-input"
                placeholder="Captain name"
                value={formData.captainName}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Players</label>
              <input
                type="number"
                name="maxPlayers"
                className="form-input"
                min="1"
                value={formData.maxPlayers}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Wins</label>
              <input
                type="number"
                name="wins"
                className="form-input"
                min="0"
                value={formData.wins}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Losses</label>
              <input
                type="number"
                name="losses"
                className="form-input"
                min="0"
                value={formData.losses}
                onChange={handleInputChange}
              />
            </div>

            <div className="flex gap-md col-2">
              <button type="submit" className="btn btn-gold flex-1">
                {editingId ? 'Update Team' : 'Add Team'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="btn btn-outline flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="search-box mb-lg">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search by team name or city..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="grid grid-3 gap-lg">
        {filteredTeams.map(team => (
          <div key={team.id} className="card card-gold p-lg">
            <div className="flex justify-between items-start mb-md">
              <div>
                <h3 className="text-lg font-bold text-gradient-gold">{team.teamName}</h3>
                <p className="text-secondary text-sm">{team.city || 'Location TBD'}</p>
              </div>
              <Trophy size={24} className="text-gold" />
            </div>

            <div className="team-stats mb-md">
              <div className="stat-row">
                <span className="label">Captain:</span>
                <span className="value font-semi">{team.captainName || 'Not assigned'}</span>
              </div>
              <div className="stat-row">
                <span className="label">Wins:</span>
                <span className="value text-green font-semi">{team.wins || 0}</span>
              </div>
              <div className="stat-row">
                <span className="label">Losses:</span>
                <span className="value text-red font-semi">{team.losses || 0}</span>
              </div>
              <div className="stat-row">
                <span className="label">Players:</span>
                <span className="value">{team.playerCount || 0}/{team.maxPlayers}</span>
              </div>
              {team.tournamentName && (
                <div className="stat-row">
                  <span className="label">League:</span>
                  <span className="value text-gold font-semi" style={{ fontSize: '0.8rem' }}>{team.tournamentName}</span>
                </div>
              )}
            </div>

            <div className="flex gap-md">
              <button
                onClick={() => handleEdit(team)}
                className="btn btn-outline flex-1"
              >
                <Edit2 size={16} /> Edit
              </button>
              <button
                onClick={() => handleDelete(team.id)}
                className="btn btn-outline text-red flex-1"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
