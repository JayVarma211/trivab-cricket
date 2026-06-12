import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCollection, setDocument, deleteDocument, where, addDocument } from '../../firebase/firestore';
import { Trophy, Trash2, Plus, AlertCircle, Edit2, Search, Calendar, Users, Eye, ArrowLeft, Loader2 } from 'lucide-react';
import './Admin.css';

const PREDEFINED_TOURNAMENTS = [
  { id: 'bapl-south', name: 'BAPL - South Mumbai Edition', logo: '/logos/baplt20south.jpg', description: 'South Mumbai Edition of the premier BAPL League.' },
  { id: 'bapl-north', name: 'BAPL - North Mumbai Edition', logo: '/logos/baplt20north.jpg', description: 'North Mumbai Edition of the premier BAPL League.' },
  { id: 'baplxpress-south', name: 'BAPL XPRESS - South Mumbai Edition', logo: '/logos/baplxpresst20south.jpg', description: 'South Mumbai Edition of the fast-paced BAPL XPRESS League.' },
  { id: 'baplxpress-north', name: 'BAPL XPRESS - North Mumbai Edition', logo: '/logos/baplxpresst20north.jpg', description: 'North Mumbai Edition of the fast-paced BAPL XPRESS League.' },
  { id: 'baplcorporate-south', name: 'BAPL Corporate CUP - South Mumbai Edition', logo: '/logos/baplcorporate.jpg', description: 'South Mumbai Edition of the BAPL Corporate Cup.' },
  { id: 'baplcorporate-north', name: 'BAPL Corporate CUP - North Mumbai Edition', logo: '/logos/baplcorporate.jpg', description: 'North Mumbai Edition of the BAPL Corporate Cup.' },
  { id: 'trivab-monsoon', name: 'Trivab Monsoon Championship', logo: '/logos/trivabmonsoon.jpg', description: 'The grand Trivab Monsoon Championship tournament.' },
  { id: 'bapldads-south', name: 'BAPL DADS T20 - South Mumbai Edition', logo: '/logos/bapldadst20.jpg', description: 'South Mumbai Edition of the BAPL DADS T20 League.' },
  { id: 'bapldads-north', name: 'BAPL DADS T20 - North Mumbai Edition', logo: '/logos/bapldadst20.jpg', description: 'North Mumbai Edition of the BAPL DADS T20 League.' },
  { id: 'baplkids', name: 'BAPL KIDS', logo: '/logos/bapllogo.jpg', description: 'The BAPL KIDS Cricket Championship.' },
];

export default function AdminTournaments() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  // Tournament Details & Squad states
  const [selectedTournamentForModal, setSelectedTournamentForModal] = useState(null);
  const [viewingTeamSquad, setViewingTeamSquad] = useState(null);
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [loadingTeamPlayers, setLoadingTeamPlayers] = useState(false);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [matchFormData, setMatchFormData] = useState({
    teamA: '',
    teamB: '',
    venue: '',
    format: 'T20',
    date: '',
    time: '',
    status: 'Upcoming'
  });

  const [formData, setFormData] = useState({
    typeId: '',
    status: 'Upcoming',
    date: '',
    teamCount: 12,
    description: '',
    winner: 'TBD',
    runnerUp: 'TBD',
  });

  useEffect(() => {
    if (role !== 'admin') navigate('/admin/login');
    fetchData();
  }, [role, navigate]);

  const fetchData = async () => {
    try {
      const tournData = await getCollection('tournaments', []);
      const teamsData = await getCollection('teams', []);
      const matchesData = await getCollection('matches', []);
      setTournaments(tournData);
      setTeams(teamsData || []);
      setMatches(matchesData || []);
    } catch (err) {
      console.error('Error fetching tournaments:', err);
      setError('Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const handleTournamentClick = (tourn) => {
    setSelectedTournamentForModal(tourn);
    setViewingTeamSquad(null);
    setShowMatchForm(false);
  };

  const handleTeamClick = async (team) => {
    setViewingTeamSquad(team);
    setLoadingTeamPlayers(true);
    setTeamPlayers([]);
    try {
      const players = await getCollection('players', [where('teamId', '==', team.id)]);
      setTeamPlayers(players || []);
    } catch (err) {
      console.error("Error loading team roster:", err);
    } finally {
      setLoadingTeamPlayers(false);
    }
  };

  const handleMatchSubmit = async (e) => {
    e.preventDefault();
    if (!matchFormData.teamA || !matchFormData.teamB) {
      alert('Please select both Team A and Team B');
      return;
    }
    if (matchFormData.teamA === matchFormData.teamB) {
      alert('Team A and Team B cannot be the same');
      return;
    }
    try {
      const matchData = {
        ...matchFormData,
        tournamentId: selectedTournamentForModal.id,
        tossWinner: '',
        tossDecision: '',
        teamAScore: '',
        teamBScore: '',
        result: ''
      };
      await addDocument('matches', matchData);
      const matchesData = await getCollection('matches', []);
      setMatches(matchesData || []);
      setShowMatchForm(false);
      setMatchFormData({
        teamA: '',
        teamB: '',
        venue: '',
        format: 'T20',
        date: '',
        time: '',
        status: 'Upcoming'
      });
      alert('Match scheduled successfully!');
    } catch (err) {
      console.error("Error scheduling match:", err);
      alert('Failed to schedule match');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'teamCount' ? parseInt(value) : value
    }));
  };

  const handleTypeChange = (e) => {
    const typeId = e.target.value;
    const selected = PREDEFINED_TOURNAMENTS.find(t => t.id === typeId);
    setFormData(prev => ({
      ...prev,
      typeId,
      description: selected ? selected.description : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.typeId) {
      setError('Please select a tournament type/edition');
      return;
    }

    try {
      const selectedType = PREDEFINED_TOURNAMENTS.find(t => t.id === formData.typeId);
      
      const tournamentData = {
        name: selectedType.name,
        logo: selectedType.logo,
        status: formData.status,
        date: formData.date || 'TBD',
        teamCount: formData.teamCount || 12,
        description: formData.description || selectedType.description,
        winner: formData.winner || 'TBD',
        runnerUp: formData.runnerUp || 'TBD',
        createdAt: new Date().toISOString()
      };

      // We use setDocument with the selected predefined ID (e.g., 'bapl-south')
      // to link directly with our navbar dropdown links.
      await setDocument('tournaments', formData.typeId, tournamentData);

      fetchData();
      setShowForm(false);
      setEditingId(null);
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to save tournament');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tournament? This will remove it from database logs.')) return;
    
    try {
      await deleteDocument('tournaments', id);
      fetchData();
    } catch (err) {
      setError('Failed to delete tournament');
    }
  };

  const handleEdit = (tourn) => {
    setFormData({
      typeId: tourn.id,
      status: tourn.status || 'Upcoming',
      date: tourn.date || '',
      teamCount: tourn.teamCount || 12,
      description: tourn.description || '',
      winner: tourn.winner || 'TBD',
      runnerUp: tourn.runnerUp || 'TBD',
    });
    setEditingId(tourn.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      typeId: '',
      status: 'Upcoming',
      date: '',
      teamCount: 12,
      description: '',
      winner: 'TBD',
      runnerUp: 'TBD',
    });
  };

  const filteredTournaments = tournaments.filter(t =>
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusClass = (status) => {
    if (status === 'Live') return 'badge-red';
    if (status === 'Completed') return 'badge-green';
    return 'badge-gold';
  };

  if (loading) return <div className="container section-padding"><p>Loading...</p></div>;

  return (
    <div className="admin-page container section-padding">
      <div className="page-header flex justify-between items-center mb-xl">
        <div>
          <h1 className="display-sm text-gradient-gold">Tournament Management</h1>
          <p className="text-secondary">Scheduled/Seeded Tournaments: {tournaments.length}</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingId(null);
            setShowForm(!showForm);
          }}
          className="btn btn-gold"
        >
          <Plus size={18} /> Schedule Tournament
        </button>
      </div>

      {error && (
        <div className="alert alert-error mb-lg">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {showForm && (
        <div className="card card-gold mb-xl p-lg">
          <h2 className="text-lg font-bold mb-md">
            {editingId ? 'Edit Tournament Settings' : 'Schedule Predefined Tournament'}
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-2 gap-md">
            <div className="form-group col-2">
              <label className="form-label">Tournament Type / Edition</label>
              <select
                name="typeId"
                className="form-select"
                required
                disabled={!!editingId}
                value={formData.typeId}
                onChange={handleTypeChange}
              >
                <option value="">Select Tournament Type</option>
                {PREDEFINED_TOURNAMENTS.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Duration Date Range (e.g. May - June 2026)</label>
              <input
                type="text"
                name="date"
                className="form-input"
                placeholder="e.g. June - July 2026"
                required
                value={formData.date}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Expected Team Count</label>
              <input
                type="number"
                name="teamCount"
                className="form-input"
                min="2"
                required
                value={formData.teamCount}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tournament Status</label>
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

            {formData.status === 'Completed' && (
              <>
                <div className="form-group">
                  <label className="form-label">Winner Team</label>
                  <input
                    type="text"
                    name="winner"
                    className="form-input"
                    value={formData.winner}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Runner-Up Team</label>
                  <input
                    type="text"
                    name="runnerUp"
                    className="form-input"
                    value={formData.runnerUp}
                    onChange={handleInputChange}
                  />
                </div>
              </>
            )}

            <div className="form-group col-2">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                className="form-textarea"
                required
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="flex gap-md col-2">
              <button type="submit" className="btn btn-gold flex-1">
                {editingId ? 'Update Tournament' : 'Schedule Tournament'}
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
          placeholder="Search by tournament name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="admin-tournament-list">
        {filteredTournaments.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-muted)' }}>
            <Trophy size={36} style={{ opacity: 0.25, marginBottom: '12px' }} />
            <p style={{ margin: 0, fontSize: '0.875rem' }}>No tournaments yet. Click "Schedule Tournament" to create one.</p>
          </div>
        ) : (
          filteredTournaments.map((t, idx) => (
            <div 
              key={t.id} 
              className="admin-tournament-item" 
              onClick={() => handleTournamentClick(t)}
              style={{
                borderBottom: idx < filteredTournaments.length - 1 ? '1px solid var(--admin-border)' : 'none'
              }}
            >
              {/* Logo — transparent, no background */}
              {t.logo && (
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <img
                    src={t.logo}
                    alt=""
                    className={t.logo.toLowerCase().includes('xpress') || t.logo.toLowerCase().includes('dads') ? 'logo-black-bg' : 'logo-white-bg'}
                    style={{
                      width: '48px',
                      height: '48px',
                      objectFit: 'contain',
                    }}
                  />
                </div>
              )}

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--admin-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.name}
                  </h3>
                  <span className={`badge ${getStatusClass(t.status)}`}>{t.status}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>
                    <Calendar size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    {t.date || 'TBD'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>
                    <Users size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    {t.teamCount || 12} Teams
                  </span>
                  {t.status === 'Completed' && t.winner && t.winner !== 'TBD' && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--admin-green)' }}>
                      🏆 {t.winner}
                    </span>
                  )}
                </div>
                {t.description && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--admin-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '500px' }}>
                    {t.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleTournamentClick(t); }}
                  className="btn-table-action"
                  title="View Details"
                  style={{ color: '#3b82f6' }}
                >
                  <Eye size={15} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(t); }}
                  className="btn-table-action"
                  title="Edit"
                  style={{ color: 'var(--admin-gold)' }}
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                  className="btn-table-action"
                  title="Delete"
                  style={{ color: 'var(--admin-red)' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tournament Details & Squad Modal */}
      {selectedTournamentForModal && (
        <div className="modal-overlay" onClick={() => setSelectedTournamentForModal(null)} style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: 'var(--space-xl)', maxWidth: '850px', width: '95%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', color: 'var(--admin-text)' }}>
            <button className="modal-close" onClick={() => setSelectedTournamentForModal(null)} style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '1.25rem', border: 'none', background: 'none', color: 'var(--admin-muted)', cursor: 'pointer' }}>✕</button>

            {/* Back Button for Squad View */}
            {viewingTeamSquad && (
              <button 
                onClick={() => setViewingTeamSquad(null)} 
                className="btn btn-outline btn-sm mb-md" 
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.8rem', height: 'auto', border: '1px solid var(--admin-border)' }}
              >
                <ArrowLeft size={14} /> Back to Tournament
              </button>
            )}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', borderBottom: '1px solid var(--admin-border)', paddingBottom: '16px' }}>
              {selectedTournamentForModal.logo && (
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={selectedTournamentForModal.logo}
                    alt=""
                    className={selectedTournamentForModal.logo.toLowerCase().includes('xpress') || selectedTournamentForModal.logo.toLowerCase().includes('dads') ? 'logo-black-bg' : 'logo-white-bg'}
                    style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                  />
                </div>
              )}
              <div style={{ textAlign: 'left' }}>
                <h3 className="text-lg font-bold text-gradient-gold" style={{ margin: 0 }}>
                  {viewingTeamSquad ? `${viewingTeamSquad.teamName} Squad` : selectedTournamentForModal.name}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--admin-muted)' }}>
                  {viewingTeamSquad 
                    ? `Representing ${selectedTournamentForModal.name}` 
                    : `Duration: ${selectedTournamentForModal.date || 'TBD'} | Status: ${selectedTournamentForModal.status}`
                  }
                </p>
              </div>
            </div>

            {/* Conditional Views */}
            {viewingTeamSquad ? (
              /* Squad / Players List Roster View */
              <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Squad Roster ({teamPlayers.length} Players)
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--admin-gold)', fontWeight: 600 }}>
                    Captain: {viewingTeamSquad.captainName || 'Not Assigned'}
                  </span>
                </div>

                {loadingTeamPlayers ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--admin-muted)' }}>
                    <Loader2 size={28} className="spin text-gold" style={{ margin: '0 auto 8px' }} />
                    <p style={{ margin: 0, fontSize: '0.8rem' }}>Loading player squad...</p>
                  </div>
                ) : teamPlayers.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--admin-muted)', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--admin-border)', borderRadius: '8px' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>No players registered under this team squad yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                    {teamPlayers.map((p, idx) => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', fontWeight: 700, minWidth: '16px' }}>{idx + 1}.</span>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', background: 'var(--admin-card-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {p.photoURL ? (
                              <img src={p.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Users size={14} style={{ color: 'var(--admin-gold)' }} />
                            )}
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-text)', display: 'block' }}>{p.fullName}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--admin-muted)', display: 'block' }}>{p.playingStyle || 'Player'}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>
                            Matches: {p.joinedTournaments?.find(jt => (typeof jt === 'string' ? jt : jt.id) === selectedTournamentForModal.id)?.matchesPlayed || 0}
                          </span>
                          <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>
                            #{p.jerseyNumber || '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Main Details View: Teams (Left) & Matches (Right) */
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', textAlign: 'left' }}>
                
                {/* Left Column: Teams */}
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Teams Registered ({teams.filter(team => team.tournamentId === selectedTournamentForModal.id).length})
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
                    {teams.filter(team => team.tournamentId === selectedTournamentForModal.id).length === 0 ? (
                      <div style={{ padding: '30px', textAlign: 'center', color: 'var(--admin-muted)', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--admin-border)', borderRadius: '8px' }}>
                        <p style={{ margin: 0, fontSize: '0.8rem' }}>No teams registered for this league yet.</p>
                      </div>
                    ) : (
                      teams.filter(team => team.tournamentId === selectedTournamentForModal.id).map(team => (
                        <div 
                          key={team.id} 
                          onClick={() => handleTeamClick(team)}
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', 
                            background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--admin-border)', 
                            cursor: 'pointer', transition: 'all 0.2s' 
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'var(--admin-gold)';
                            e.currentTarget.style.background = 'rgba(212,175,55,0.03)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'var(--admin-border)';
                            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                          }}
                        >
                          {/* Team Logo */}
                          <div style={{ width: '38px', height: '38px', borderRadius: '6px', overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--admin-border)', flexShrink: 0 }}>
                            {team.logoURL ? (
                              <img src={team.logoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#000' }}>{team.teamName[0]}</span>
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong style={{ fontSize: '0.85rem', color: 'var(--admin-text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {team.teamName}
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--admin-muted)', display: 'block' }}>
                              Capt: {team.captainName || 'Not Assigned'}
                            </span>
                          </div>
                          <ChevronRight size={16} style={{ color: 'var(--admin-muted)' }} />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right Column: Match Fixtures */}
                <div style={{ borderLeft: '1px solid var(--admin-border)', paddingLeft: '24px' }}>
                  <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Match Fixtures ({matches.filter(m => m.tournamentId === selectedTournamentForModal.id).length})
                    </h4>
                    <button 
                      onClick={() => setShowMatchForm(!showMatchForm)} 
                      className="btn btn-gold btn-xs" 
                      style={{ padding: '4px 10px', fontSize: '0.75rem', height: 'auto' }}
                    >
                      {showMatchForm ? 'Cancel' : '+ Schedule'}
                    </button>
                  </div>

                  {/* Inline Match Scheduler Form */}
                  {showMatchForm && (
                    <form onSubmit={handleMatchSubmit} style={{ background: 'rgba(212,175,55,0.03)', border: '1px solid rgba(212,175,55,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <strong style={{ fontSize: '0.75rem', color: 'var(--admin-gold)', display: 'block' }}>New Match Scheduler</strong>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.65rem', color: 'var(--admin-muted)', display: 'block', marginBottom: '2px' }}>Team A</label>
                          <select 
                            required 
                            className="form-select" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem', height: '30px' }}
                            value={matchFormData.teamA} 
                            onChange={e => setMatchFormData(p => ({ ...p, teamA: e.target.value }))}
                          >
                            <option value="">Select Team A</option>
                            {teams.filter(t => t.tournamentId === selectedTournamentForModal.id).map(t => (
                              <option key={t.id} value={t.teamName}>{t.teamName}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.65rem', color: 'var(--admin-muted)', display: 'block', marginBottom: '2px' }}>Team B</label>
                          <select 
                            required 
                            className="form-select" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem', height: '30px' }}
                            value={matchFormData.teamB} 
                            onChange={e => setMatchFormData(p => ({ ...p, teamB: e.target.value }))}
                          >
                            <option value="">Select Team B</option>
                            {teams.filter(t => t.tournamentId === selectedTournamentForModal.id).map(t => (
                              <option key={t.id} value={t.teamName}>{t.teamName}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.65rem', color: 'var(--admin-muted)', display: 'block', marginBottom: '2px' }}>Date</label>
                          <input 
                            type="date" 
                            required 
                            className="form-input" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem', height: '30px' }}
                            value={matchFormData.date} 
                            onChange={e => setMatchFormData(p => ({ ...p, date: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.65rem', color: 'var(--admin-muted)', display: 'block', marginBottom: '2px' }}>Time</label>
                          <input 
                            type="time" 
                            required 
                            className="form-input" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem', height: '30px' }}
                            value={matchFormData.time} 
                            onChange={e => setMatchFormData(p => ({ ...p, time: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.65rem', color: 'var(--admin-muted)', display: 'block', marginBottom: '2px' }}>Venue</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="Venue name"
                            className="form-input" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem', height: '30px' }}
                            value={matchFormData.venue} 
                            onChange={e => setMatchFormData(p => ({ ...p, venue: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.65rem', color: 'var(--admin-muted)', display: 'block', marginBottom: '2px' }}>Format</label>
                          <select 
                            className="form-select" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem', height: '30px' }}
                            value={matchFormData.format} 
                            onChange={e => setMatchFormData(p => ({ ...p, format: e.target.value }))}
                          >
                            <option value="T20">T20</option>
                            <option value="ODI">ODI</option>
                            <option value="Test">Test</option>
                          </select>
                        </div>
                      </div>

                      <button type="submit" className="btn btn-gold btn-sm w-full" style={{ padding: '6px', fontSize: '0.8rem', height: 'auto', marginTop: '4px' }}>
                        Save Match Fixture
                      </button>
                    </form>
                  )}

                  {/* Matches List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: showMatchForm ? '160px' : '380px', overflowY: 'auto', paddingRight: '4px' }}>
                    {matches.filter(m => m.tournamentId === selectedTournamentForModal.id).length === 0 ? (
                      <div style={{ padding: '30px', textAlign: 'center', color: 'var(--admin-muted)', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--admin-border)', borderRadius: '8px' }}>
                        <p style={{ margin: 0, fontSize: '0.8rem' }}>No matches scheduled yet.</p>
                      </div>
                    ) : (
                      matches.filter(m => m.tournamentId === selectedTournamentForModal.id).map(m => (
                        <div key={m.id} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid var(--admin-border)', fontSize: '0.8rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span className={`badge ${m.status === 'Live' ? 'badge-red' : m.status === 'Upcoming' ? 'badge-gold' : 'badge-green'}`} style={{ fontSize: '0.6rem', padding: '1px 6px' }}>
                              {m.status}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--admin-muted)' }}>{m.date} · {m.time}</span>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
                            <span style={{ color: 'var(--admin-text)' }}>{m.teamA}</span>
                            <span style={{ color: 'var(--admin-gold)' }}>
                              {(m.status === 'Completed' || m.status === 'Live') ? `${m.teamAScore || '—'} : ${m.teamBScore || '—'}` : 'vs'}
                            </span>
                            <span style={{ color: 'var(--admin-text)' }}>{m.teamB}</span>
                          </div>
                          
                          <div style={{ fontSize: '0.7rem', color: 'var(--admin-muted)', marginTop: '4px', textAlign: 'center', borderTop: '1px dashed rgba(255,255,255,0.03)', paddingTop: '4px' }}>
                            📍 {m.venue} {m.result && `| Winner: ${m.result}`}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
