import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCollection, addDocument, updateDocument, deleteDocument } from '../../firebase/firestore';
import { Calendar, Trash2, Plus, AlertCircle, Edit2, Search, Activity, Download } from 'lucide-react';
import './Admin.css';

export default function AdminMatches() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    tournamentId: '',
    teamA: '',
    teamB: '',
    venue: '',
    date: '',
    time: '',
    status: 'Upcoming',
    format: 'T20',
  });

  useEffect(() => {
    if (role !== 'admin') navigate('/admin/login');
    fetchData();
  }, [role, navigate]);

  const fetchData = async () => {
    try {
      const matchesData = await getCollection('matches', []);
      const teamsData = await getCollection('teams', []);
      const tournamentsData = await getCollection('tournaments', []);
      setMatches(matchesData);
      setTeams(teamsData);
      setTournaments(tournamentsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.teamA === formData.teamB) {
      setError('Team A and Team B cannot be the same');
      return;
    }

    try {
      const matchData = {
        teamA: formData.teamA,
        teamB: formData.teamB,
        venue: formData.venue,
        date: formData.date,
        time: formData.time,
        status: formData.status,
        format: formData.format,
        tournamentId: formData.tournamentId || '',
      };

      if (editingId) {
        await updateDocument('matches', editingId, matchData);
      } else {
        matchData.tossWinner = '';
        matchData.tossDecision = '';
        matchData.teamAScore = '';
        matchData.teamBScore = '';
        matchData.result = '';
        await addDocument('matches', matchData);
      }

      fetchData();
      setShowForm(false);
      setEditingId(null);
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to save match');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this match?')) return;
    
    try {
      await deleteDocument('matches', id);
      fetchData();
    } catch (err) {
      setError('Failed to delete match');
    }
  };

  const handleEdit = (match) => {
    setFormData({
      teamA: match.teamA,
      teamB: match.teamB,
      venue: match.venue,
      date: match.date,
      time: match.time,
      status: match.status,
      format: match.format || 'T20',
      tournamentId: match.tournamentId || '',
    });
    setEditingId(match.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      teamA: '',
      teamB: '',
      venue: '',
      date: '',
      time: '',
      status: 'Upcoming',
      format: 'T20',
      tournamentId: '',
    });
  };

  const filteredMatches = matches.filter(m =>
    m.teamA?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.teamB?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.venue?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const escapeCSV = (val) => {
    if (val === undefined || val === null) return '';
    let str = String(val);
    str = str.replace(/"/g, '""');
    if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
      return `"${str}"`;
    }
    return str;
  };

  const exportMatchesToCSV = () => {
    const headers = [
      'Match ID',
      'Tournament ID',
      'Tournament Name',
      'Team A',
      'Team B',
      'Venue',
      'Format',
      'Date',
      'Time',
      'Status',
      'Toss Winner',
      'Toss Decision',
      'Team A Score',
      'Team B Score',
      'Result'
    ];

    const rows = matches.map(m => {
      const tournament = tournaments.find(t => t.id === m.tournamentId);
      return [
        m.id || '',
        m.tournamentId || '',
        tournament ? tournament.name : 'N/A',
        m.teamA || '',
        m.teamB || '',
        m.venue || '',
        m.format || 'T20',
        m.date || '',
        m.time || '',
        m.status || '',
        m.tossWinner || '',
        m.tossDecision || '',
        m.teamAScore || '',
        m.teamBScore || '',
        m.result || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `trivab_matches_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Live') return 'badge-red';
    if (status === 'Completed') return 'badge-green';
    return 'badge-gold';
  };

  if (loading) return <div className="container section-padding"><p>Loading...</p></div>;

  return (
    <div className="admin-page container section-padding">
      <div className="page-header flex justify-between items-center mb-xl">
        <div>
          <h1 className="display-sm text-gradient-gold">Match Schedule</h1>
          <p className="text-secondary">Total Matches: {matches.length}</p>
        </div>
        <button
          onClick={() => {
            if (tournaments.length === 0) {
              alert('Please create a tournament first.');
              return;
            }
            if (teams.length < 2) {
              alert('Please add at least 2 teams first.');
              return;
            }
            resetForm();
            setEditingId(null);
            setShowForm(!showForm);
          }}
          disabled={tournaments.length === 0 || teams.length < 2}
          className="btn btn-gold"
          style={{
            opacity: (tournaments.length === 0 || teams.length < 2) ? 0.5 : 1,
            cursor: (tournaments.length === 0 || teams.length < 2) ? 'not-allowed' : 'pointer'
          }}
        >
          <Plus size={18} /> Schedule Match
        </button>
      </div>

      {tournaments.length === 0 ? (
        <div className="alert alert-error mb-xl" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <AlertCircle size={24} />
          <div>
            <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '4px' }}>No Active Tournaments Found</strong>
            <span>You must create at least one tournament in the <strong>Tournaments</strong> tab before scheduling matches.</span>
          </div>
        </div>
      ) : teams.length < 2 ? (
        <div className="alert alert-error mb-xl" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <AlertCircle size={24} />
          <div>
            <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '4px' }}>Insufficient Teams Found</strong>
            <span>You must add at least 2 teams in the <strong>Teams</strong> tab before you can schedule a match fixture.</span>
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
            {editingId ? 'Edit Match' : 'Schedule New Match'}
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-2 gap-md">
            <div className="form-group col-2">
              <label className="form-label">Assigned Tournament</label>
              <select
                name="tournamentId"
                className="form-select"
                value={formData.tournamentId}
                onChange={handleInputChange}
              >
                <option value="">Select Tournament (Optional)</option>
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Team A</label>
              <select
                name="teamA"
                className="form-select"
                required
                value={formData.teamA}
                onChange={handleInputChange}
              >
                <option value="">Select Team A</option>
                {(formData.tournamentId ? teams.filter(t => t.tournamentId === formData.tournamentId) : teams).map(team => (
                  <option key={team.id} value={team.teamName}>{team.teamName}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Team B</label>
              <select
                name="teamB"
                className="form-select"
                required
                value={formData.teamB}
                onChange={handleInputChange}
              >
                <option value="">Select Team B</option>
                {(formData.tournamentId ? teams.filter(t => t.tournamentId === formData.tournamentId) : teams).map(team => (
                  <option key={team.id} value={team.teamName}>{team.teamName}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Venue</label>
              <input
                type="text"
                name="venue"
                className="form-input"
                placeholder="Stadium/Ground Name"
                required
                value={formData.venue}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Match Format</label>
              <select
                name="format"
                className="form-select"
                value={formData.format}
                onChange={handleInputChange}
              >
                <option value="T20">T20</option>
                <option value="ODI">ODI</option>
                <option value="Test">Test</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                name="date"
                className="form-input"
                required
                value={formData.date}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Time</label>
              <input
                type="time"
                name="time"
                className="form-input"
                required
                value={formData.time}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Live">Live</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="flex gap-md col-2">
              <button type="submit" className="btn btn-gold flex-1">
                {editingId ? 'Update Match' : 'Schedule Match'}
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

      <div className="flex gap-md items-center mb-lg flex-wrap sm:flex-nowrap">
        <div className="search-box flex-1 mb-0" style={{ marginBottom: 0 }}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by team or venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
        </div>
        <button
          onClick={exportMatchesToCSV}
          className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--admin-accent)', color: 'var(--admin-text)', padding: '10px 16px' }}
          title="Download all scheduled matches as Excel/CSV"
        >
          <Download size={18} /> Export Excel
        </button>
      </div>

      <div className="table-responsive card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Team A vs Team B</th>
              <th>Tournament</th>
              <th>Date & Time</th>
              <th>Venue</th>
              <th>Format</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMatches.map(match => {
              const tournament = tournaments.find(t => t.id === match.tournamentId);
              return (
                <tr key={match.id}>
                  <td className="font-semi text-gold">{match.teamA} vs {match.teamB}</td>
                  <td className="text-secondary text-sm font-semi">{tournament ? tournament.name : 'N/A'}</td>
                  <td>{new Date(match.date).toLocaleDateString()} @ {match.time}</td>
                  <td>{match.venue}</td>
                  <td><span className="badge badge-gold">{match.format}</span></td>
                  <td><span className={`badge ${getStatusBadgeClass(match.status)}`}>{match.status}</span></td>
                  <td>
                    <div className="flex gap-sm">
                      <button
                        onClick={() => navigate(`/admin/matches/${match.id}/manage`)}
                        className="btn-table-action text-gold"
                        title="Manage Match Day"
                      >
                        <Activity size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(match)}
                        className="btn-table-action text-gold"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(match.id)}
                        className="btn-table-action text-red"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
