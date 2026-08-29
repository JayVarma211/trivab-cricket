import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCollection, addDocument, setDocument, deleteDocument } from '../../firebase/firestore';
import { Calendar, Trash2, Plus, AlertCircle, Edit2, Search, Activity, Download, X, Play, Clock, MapPin, Tag } from 'lucide-react';
import './Admin.css';

const SCHEDULE_TYPES = ['Match', 'Practice', 'Meeting', 'Event', 'Training', 'Selection Trial'];
const STATUS_OPTIONS = ['Upcoming', 'In Progress', 'Completed', 'Cancelled'];
const FORMAT_OPTIONS = ['T20', 'T10', '50-over', '100-ball', 'Practice', 'Other'];

export default function AdminMatches() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    type: 'Match',
    tournamentId: '',
    teamA: '',
    teamB: '',
    venue: '',
    date: '',
    time: '',
    status: 'Upcoming',
    format: 'T20',
    description: '',
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
      
      // Sort matches by date asc
      matchesData.sort((a, b) => new Date(a.date || '2099-01-01') - new Date(b.date || '2099-01-01'));

      setMatches(matchesData);
      setTeams(teamsData);
      setTournaments(tournamentsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load matches data');
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
    setSuccess('');

    if (formData.type === 'Match' && formData.teamA && formData.teamB && formData.teamA === formData.teamB) {
      setError('Team A and Team B cannot be the same team.');
      return;
    }

    try {
      // Find team IDs
      const teamAObj = teams.find(t => t.teamName === formData.teamA);
      const teamBObj = teams.find(t => t.teamName === formData.teamB);

      const targetAudience = (formData.teamA && formData.teamB)
        ? `${formData.teamA} vs ${formData.teamB}`
        : (formData.teamA || formData.teamB || 'All Teams');

      const matchData = {
        title: formData.title || (formData.teamA && formData.teamB ? `${formData.teamA} vs ${formData.teamB}` : `${formData.type} Session`),
        type: formData.type || 'Match',
        teamA: formData.teamA || '',
        teamB: formData.teamB || '',
        teamAId: teamAObj?.id || '',
        teamBId: teamBObj?.id || '',
        targetTeamName: targetAudience,
        venue: formData.venue || '',
        date: formData.date || '',
        time: formData.time || '',
        status: formData.status || 'Upcoming',
        format: formData.format || 'T20',
        tournamentId: formData.tournamentId || '',
        description: formData.description || '',
      };

      let matchDocId = editingId;

      if (editingId) {
        await setDocument('matches', editingId, matchData);
        await setDocument('schedules', editingId, matchData);
        setSuccess('Match / Schedule entry updated successfully!');
      } else {
        matchData.tossWinner = '';
        matchData.tossDecision = '';
        matchData.teamAScore = '';
        matchData.teamBScore = '';
        matchData.result = '';
        const docRef = await addDocument('matches', matchData);
        matchDocId = docRef.id;

        // Sync to schedules collection with same ID
        await setDocument('schedules', docRef.id, { id: docRef.id, ...matchData });
        setSuccess('New Match / Schedule entry created and published to captains!');
      }

      await fetchData();
      setShowForm(false);
      setEditingId(null);
      resetForm();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save match entry');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this match/schedule entry?')) return;
    
    try {
      await deleteDocument('matches', id);
      await deleteDocument('schedules', id).catch(() => {});
      setSuccess('Entry deleted.');
      fetchData();
    } catch (err) {
      setError('Failed to delete entry');
    }
  };

  const handleEdit = (match) => {
    setFormData({
      title: match.title || '',
      type: match.type || 'Match',
      teamA: match.teamA || '',
      teamB: match.teamB || '',
      venue: match.venue || '',
      date: match.date || '',
      time: match.time || '',
      status: match.status || 'Upcoming',
      format: match.format || 'T20',
      tournamentId: match.tournamentId || '',
      description: match.description || '',
    });
    setEditingId(match.id);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'Match',
      teamA: '',
      teamB: '',
      venue: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      status: 'Upcoming',
      format: 'T20',
      tournamentId: '',
      description: '',
    });
  };

  const filteredMatches = matches.filter(m => {
    const matchesSearch =
      m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.teamA?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.teamB?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.venue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.type?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
      'Title / Type',
      'Tournament ID',
      'Tournament Name',
      'Team A',
      'Team B',
      'Venue',
      'Format',
      'Date',
      'Time',
      'Status',
      'Result'
    ];

    const rows = matches.map(m => {
      const tournament = tournaments.find(t => t.id === m.tournamentId);
      return [
        m.id || '',
        m.title || m.type || 'Match',
        m.tournamentId || '',
        tournament ? tournament.name : 'General',
        m.teamA || '',
        m.teamB || '',
        m.venue || '',
        m.format || 'T20',
        m.date || '',
        m.time || '',
        m.status || '',
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
    link.setAttribute('download', `trivab_matches_schedule_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'In Progress' || status === 'Live') return 'badge-red';
    if (status === 'Completed') return 'badge-green';
    if (status === 'Cancelled') return 'badge-muted';
    return 'badge-gold';
  };

  if (loading) return <div className="container section-padding"><p>Loading Matches &amp; Schedule Console...</p></div>;

  return (
    <div className="admin-page container section-padding">

      {/* ── Page Header ── */}
      <div className="page-header flex justify-between items-center mb-xl flex-wrap gap-md">
        <div>
          <h1 className="display-sm text-gradient-gold">Matches &amp; Schedule</h1>
          <p className="text-secondary">Schedule matches, practice sessions, and manage match-day squads.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingId(null);
            setShowForm(true);
            setError('');
            setSuccess('');
          }}
          className="btn btn-gold"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} /> Schedule Match / Event
        </button>
      </div>

      {/* Global notifications */}
      {error && (
        <div className="alert alert-error mb-xl flex items-center gap-xs">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success mb-xl flex items-center gap-xs">
          <Activity size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* ── Filter / Search Bar ── */}
      <div className="flex gap-md items-center mb-lg flex-wrap">
        <div className="search-box flex-1 mb-0" style={{ marginBottom: 0 }}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by fixture title, team name, venue, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
        </div>

        {/* Status Pills */}
        <div className="flex gap-xs flex-wrap">
          {['All', 'Upcoming', 'In Progress', 'Completed', 'Cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                border: statusFilter === st ? '1px solid var(--admin-accent)' : '1px solid var(--admin-border)',
                background: statusFilter === st ? 'rgba(128,0,0,0.2)' : 'transparent',
                color: statusFilter === st ? 'var(--admin-text)' : 'var(--admin-muted)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <button
          onClick={exportMatchesToCSV}
          className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', padding: '8px 14px', fontSize: '0.85rem' }}
          title="Export CSV"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* ── Form Modal ── */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)'
        }}>
          <div style={{
            background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)',
            borderRadius: '16px', padding: 'var(--space-2xl)', width: '100%', maxWidth: '680px',
            maxHeight: '92vh', overflowY: 'auto', position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
              <h2 style={{ color: 'var(--admin-text)', margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                {editingId ? 'Edit Schedule / Match Fixture' : '📅 New Match / Schedule Entry'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--admin-text)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>

              {/* Title */}
              <div className="form-group">
                <label className="form-label">TITLE / FIXTURE NAME</label>
                <input
                  className="form-input"
                  type="text"
                  name="title"
                  placeholder="e.g. League Match / Morning Practice Session..."
                  value={formData.title}
                  onChange={handleInputChange}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', marginTop: '4px' }}>
                  If left blank, will default to "Team A vs Team B" or entry type.
                </span>
              </div>

              {/* Type & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                <div className="form-group">
                  <label className="form-label">TYPE *</label>
                  <select className="form-select" name="type" value={formData.type} onChange={handleInputChange}>
                    {SCHEDULE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">STATUS</label>
                  <select className="form-select" name="status" value={formData.status} onChange={handleInputChange}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Tournament */}
              <div className="form-group">
                <label className="form-label">TOURNAMENT</label>
                <select className="form-select" name="tournamentId" value={formData.tournamentId} onChange={handleInputChange}>
                  <option value="">-- General / All Tournaments --</option>
                  {tournaments.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Teams Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                <div className="form-group">
                  <label className="form-label">TEAM A (Optional)</label>
                  <select className="form-select" name="teamA" value={formData.teamA} onChange={handleInputChange}>
                    <option value="">-- Select Team A --</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.teamName}>{t.teamName}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">TEAM B (Optional)</label>
                  <select className="form-select" name="teamB" value={formData.teamB} onChange={handleInputChange}>
                    <option value="">-- Select Team B --</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.teamName}>{t.teamName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                <div className="form-group">
                  <label className="form-label">DATE *</label>
                  <input
                    className="form-input"
                    type="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">TIME</label>
                  <input
                    className="form-input"
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Venue & Format */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                <div className="form-group">
                  <label className="form-label">VENUE / LOCATION</label>
                  <input
                    className="form-input"
                    type="text"
                    name="venue"
                    placeholder="e.g. Kandivali Ground, Mumbai"
                    value={formData.venue}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">FORMAT</label>
                  <select className="form-select" name="format" value={formData.format} onChange={handleInputChange}>
                    {FORMAT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              {/* Description / Notes */}
              <div className="form-group">
                <label className="form-label">DESCRIPTION / NOTES FOR CAPTAINS</label>
                <textarea
                  className="form-input"
                  name="description"
                  rows={3}
                  placeholder="Any extra details, instructions, or rules for captains..."
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-gold">
                  {editingId ? 'Update Fixture' : 'Publish Schedule'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── Matches & Schedule Table ── */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fixture / Event Name</th>
              <th>Type</th>
              <th>Teams / Target</th>
              <th>Tournament</th>
              <th>Date &amp; Time</th>
              <th>Venue</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMatches.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--admin-muted)' }}>
                  No matches or schedule entries found. Click <strong>Schedule Match / Event</strong> to create one.
                </td>
              </tr>
            ) : (
              filteredMatches.map(match => {
                const tournament = tournaments.find(t => t.id === match.tournamentId);
                const displayTitle = match.title || (match.teamA && match.teamB ? `${match.teamA} vs ${match.teamB}` : match.type || 'Match');
                const displayTeams = match.teamA && match.teamB ? `${match.teamA} vs ${match.teamB}` : (match.targetTeamName || 'All Teams');

                return (
                  <tr key={match.id}>
                    <td>
                      <div>
                        <span className="font-semi text-gold" style={{ display: 'block', fontSize: '0.92rem' }}>{displayTitle}</span>
                        {match.description && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>{match.description.slice(0, 50)}...</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>
                        {match.type || 'Match'}
                      </span>
                    </td>
                    <td className="text-secondary text-sm font-semi">
                      {displayTeams}
                    </td>
                    <td className="text-secondary text-sm font-semi">
                      {tournament ? tournament.name : 'General / All'}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                        <Clock size={13} style={{ color: 'var(--admin-muted)' }} />
                        {match.date ? new Date(match.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        {match.time ? ` @ ${match.time}` : ''}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.83rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} style={{ color: 'var(--admin-muted)' }} />
                        {match.venue || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(match.status)}`} style={{ fontSize: '0.72rem' }}>
                        {match.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-sm">
                        <button
                          onClick={() => navigate(`/admin/matches/${match.id}/manage`)}
                          className="btn-table-action text-gold"
                          title="Start Match / Manage Squad & QR Scan"
                          style={{ color: '#EAB308', display: 'flex', alignItems: 'center', gap: '4px' }}
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
