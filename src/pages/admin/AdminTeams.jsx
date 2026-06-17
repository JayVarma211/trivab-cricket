import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCollection, addDocument, updateDocument, deleteDocument, where } from '../../firebase/firestore';
import { Trophy, Trash2, Plus, AlertCircle, Edit2, Search, X, Users, Loader2, Download } from 'lucide-react';
import './Admin.css';

export default function AdminTeams() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [players, setPlayers] = useState([]);
  const [captains, setCaptains] = useState([]);
  const [registrations, setRegistrations] = useState([]);
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
    maxPlayers: 40,
    tournamentId: '',
    tournamentName: '',
  });

  const [selectedTournamentFilter, setSelectedTournamentFilter] = useState('All');
  const [selectedTeamForModal, setSelectedTeamForModal] = useState(null);
  const [teamModalPlayers, setTeamModalPlayers] = useState([]);
  const [loadingTeamModal, setLoadingTeamModal] = useState(false);

  useEffect(() => {
    if (role !== 'admin') navigate('/admin/login');
    fetchData();
  }, [role, navigate]);

  const handleTeamClick = (team) => {
    setSelectedTeamForModal(team);
    
    // 1. Get unique playerIds in registrations for this team
    const registeredPlayerIds = registrations
      .filter(r => r.teamId === team.id)
      .map(r => r.playerId);
      
    const globalPlayers = players.filter(p => p.teamId === team.id);
    
    // Find player profiles for the registered IDs
    const registeredPlayers = players.filter(p => registeredPlayerIds.includes(p.id));
    
    // Combine them, making sure they are unique by id
    const combined = [...globalPlayers];
    registeredPlayers.forEach(rp => {
      if (!combined.some(p => p.id === rp.id)) {
        combined.push(rp);
      }
    });
    
    // 2. Add the captain to the squad members list if they are not already in it
    if (team.captainId) {
      const captainProfile = captains.find(c => c.uid === team.captainId || c.teamId === team.id);
      if (captainProfile) {
        const hasCaptain = combined.some(p => p.uid === team.captainId || p.email === captainProfile.email);
        if (!hasCaptain) {
          // Try to find the captain's player profile
          const captainPlayer = players.find(p => p.uid === team.captainId || p.email === captainProfile.email);
          if (captainPlayer) {
            combined.unshift(captainPlayer); // Add captain at the top
          } else {
            // Create a virtual player object for the captain so they display nicely in the modal
            combined.unshift({
              id: 'captain-virtual-' + team.captainId,
              fullName: captainProfile.fullName || team.captainName || 'Team Captain',
              email: captainProfile.email || '',
              mobile: captainProfile.mobile || '',
              photoURL: captainProfile.photoURL || '',
              playingStyle: 'All-Rounder',
              jerseyNumber: 'N/A',
              role: 'captain',
              isCaptain: true
            });
          }
        }
      }
    }
    
    setTeamModalPlayers(combined);
  };

  const escapeCSV = (val) => {
    if (val === undefined || val === null) return '';
    let str = String(val);
    str = str.replace(/"/g, '""');
    if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
      return `"${str}"`;
    }
    return str;
  };

  const exportTeamPlayersToCSV = () => {
    if (!selectedTeamForModal || teamModalPlayers.length === 0) return;

    const headers = [
      'Player ID',
      'Full Name',
      'Email',
      'Mobile',
      'Playing Style',
      'Jersey Number',
      'Joined Tournaments & Matches'
    ];

    const rows = teamModalPlayers.map(p => {
      const tournamentsJoinedStr = p.joinedTournaments && p.joinedTournaments.length > 0
        ? p.joinedTournaments.map(t => {
            const name = typeof t === 'string' ? t : t.name || t.id;
            const matches = t.matchesPlayed !== undefined ? t.matchesPlayed : 0;
            return `${name} (${matches} matches)`;
          }).join('; ')
        : 'None';

      return [
        p.playerId || p.id || '',
        p.fullName || '',
        p.email || '',
        p.mobile || '',
        p.playingStyle || '',
        p.jerseyNumber || '',
        tournamentsJoinedStr
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
    const safeTeamName = selectedTeamForModal.teamName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute('download', `${safeTeamName}_players_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTeamPlayersCount = (team) => {
    // 1. Unique playerIds in registrations for this team
    const registeredPlayerIds = registrations
      .filter(r => r.teamId === team.id)
      .map(r => r.playerId);
    
    // 2. Players who have this teamId globally set
    const globalPlayerIds = players
      .filter(p => p.teamId === team.id)
      .map(p => p.id);
      
    const uniqueIds = new Set([...registeredPlayerIds, ...globalPlayerIds]);
    
    // 3. Count the captain if present
    if (team.captainId) {
      const captainProfile = captains.find(c => c.uid === team.captainId || c.teamId === team.id);
      if (captainProfile) {
        const hasCaptain = Array.from(uniqueIds).some(pid => {
          const pObj = players.find(p => p.id === pid);
          return pObj && (pObj.uid === team.captainId || pObj.email === captainProfile.email);
        });
        if (!hasCaptain) {
          const matchPlayer = players.find(p => p.email === captainProfile.email || p.uid === team.captainId);
          if (matchPlayer) {
            uniqueIds.add(matchPlayer.id);
          } else {
            return uniqueIds.size + 1;
          }
        }
      } else {
        return uniqueIds.size + 1;
      }
    }
    
    return uniqueIds.size;
  };

  const fetchData = async () => {
    try {
      const teamsData = await getCollection('teams', []);
      const tournamentsData = await getCollection('tournaments', []);
      const playersData = await getCollection('players', []);
      const captainsData = await getCollection('captains', []);
      const registrationsData = await getCollection('registrations', []);
      setTeams(teamsData);
      setTournaments((tournamentsData || []).filter(t => t.isActivated !== false));
      setPlayers(playersData);
      setCaptains(captainsData || []);
      setRegistrations(registrationsData || []);
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
        maxPlayers: formData.maxPlayers || 40,
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
      const teamToDelete = teams.find(t => t.id === id);
      await deleteDocument('teams', id);
      
      // Update players belonging to this team to be Free Agents
      const teamPlayers = players.filter(p => p.teamId === id);
      for (const p of teamPlayers) {
        await updateDocument('players', p.id, {
          teamId: '',
          teamName: 'Free Agent'
        });
      }

      // Update captain associated with this team if they exist
      if (teamToDelete && teamToDelete.captainId) {
        try {
          await updateDocument('captains', teamToDelete.captainId, {
            teamId: '',
            teamName: ''
          });
        } catch (captErr) {
          console.warn("Failed to update captain team fields:", captErr);
        }
      }
      
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
      maxPlayers: team.maxPlayers || 40,
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
      maxPlayers: 40,
      tournamentId: '',
      tournamentName: '',
    });
  };

  const filteredTeams = teams.filter(t => {
    const matchesSearch = t.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTournament = selectedTournamentFilter === 'All' || t.tournamentId === selectedTournamentFilter;
    return matchesSearch && matchesTournament;
  });

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
            <span>You must create at least one tournament in the <strong>Tournaments</strong> tab before you can add and register teams.</span>
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

      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
        <div className="search-box" style={{ flex: 1, marginBottom: 0 }}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by team name or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
        </div>
        <select
          value={selectedTournamentFilter}
          onChange={(e) => setSelectedTournamentFilter(e.target.value)}
          className="form-select"
          style={{ width: 'auto', minWidth: '220px' }}
        >
          <option value="All">All Tournaments</option>
          {tournaments.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-3 gap-lg">
        {filteredTeams.map(team => (
          <div 
            key={team.id} 
            className="card card-gold p-lg" 
            onClick={() => handleTeamClick(team)}
            style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="flex justify-between items-start mb-md">
              <div>
                <h3 className="text-lg font-bold text-gradient-gold">{team.teamName}</h3>
                {team.city && team.city !== 'Location TBD' && (
                  <p className="text-secondary text-sm">{team.city}</p>
                )}
              </div>
              {team.logoURL ? (
                <img 
                  src={team.logoURL} 
                  alt={team.teamName} 
                  style={{ 
                    width: '48px', 
                    height: '48px', 
                    objectFit: 'cover', 
                    borderRadius: '8px',
                    border: '1px solid rgba(212,175,55,0.4)',
                    background: 'rgba(255,255,255,0.05)',
                    flexShrink: 0
                  }} 
                />
              ) : (
                <Trophy size={28} className="text-gold" style={{ flexShrink: 0 }} />
              )}
            </div>

            <div className="team-stats mb-md">
              <div className="stat-row">
                <span className="label">Captain: </span>
                <span className="value font-semi">{team.captainName || 'Not assigned'}</span>
              </div>
              <div className="stat-row">
                <span className="label">Wins: </span>
                <span className="value text-green font-semi">{team.wins || 0}</span>
              </div>
              <div className="stat-row">
                <span className="label">Losses: </span>
                <span className="value text-red font-semi">{team.losses || 0}</span>
              </div>
              <div className="stat-row">
                <span className="label">Players: </span>
                <span className="value">{getTeamPlayersCount(team)}/{team.maxPlayers}</span>
              </div>
              {team.tournamentName && (
                <div className="stat-row">
                  <span className="label">League: </span>
                  <span className="value text-gold font-semi" style={{ fontSize: '0.8rem' }}>{team.tournamentName}</span>
                </div>
              )}
            </div>

            <div className="flex gap-md" onClick={e => e.stopPropagation()}>
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

      {/* Roster Squad details modal */}
      {selectedTeamForModal && (
        <div className="modal-overlay" onClick={() => setSelectedTeamForModal(null)} style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: 'var(--space-xl)', maxWidth: '540px', width: '100%', maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}>
            <button className="modal-close" onClick={() => setSelectedTeamForModal(null)} style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '1.25rem', border: 'none', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>✕</button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', borderBottom: '1px solid var(--border-card)', paddingBottom: '16px' }}>
              <div className="avatar avatar-md bg-secondary text-gold font-bold" style={{ width: '48px', height: '48px', fontSize: '1.25rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                {selectedTeamForModal.teamName[0]}
              </div>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <h3 className="text-lg font-bold text-gradient-gold" style={{ margin: 0 }}>{selectedTeamForModal.teamName}</h3>
                <p className="text-secondary text-xs" style={{ margin: '4px 0 0 0', opacity: 0.8 }}>
                  Captain: <strong>{selectedTeamForModal.captainName || 'N/A'}</strong> | League: <strong>{selectedTeamForModal.tournamentName || 'Trivab Tournament'}</strong>
                </p>
              </div>
              <button 
                onClick={exportTeamPlayersToCSV} 
                className="btn btn-outline" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--admin-accent)', color: 'var(--admin-text)', padding: '6px 12px', fontSize: '0.8rem' }}
                title="Download this team's roster as CSV"
              >
                <Download size={14} /> Download Excel
              </button>
            </div>

            {loadingTeamModal ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
                <Loader2 size={32} className="spin text-gold" style={{ margin: '0 auto var(--space-sm)' }} />
                <p style={{ fontSize: '0.85rem' }}>Loading roster details...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ textAlign: 'left' }}>
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-xs" style={{ fontSize: '0.7rem' }}>Squad Members ({teamModalPlayers.length})</h4>
                  {teamModalPlayers.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>No players registered in this squad roster yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
                      {teamModalPlayers.map((p, idx) => {
                        const tournObj = p.joinedTournaments?.find(jt => (typeof jt === 'string' ? jt : jt.id) === selectedTeamForModal.tournamentId);
                        const tournMatches = tournObj?.matchesPlayed !== undefined ? tournObj.matchesPlayed : 0;
                        return (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-card)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span className="text-xs text-muted" style={{ minWidth: '16px' }}>{idx + 1}.</span>
                              <div className="avatar avatar-sm bg-primary text-gold" style={{ width: '24px', height: '24px', fontSize: '0.65rem', borderRadius: '50%', overflow: 'hidden' }}>
                                {p.photoURL ? <img src={p.photoURL} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.fullName[0]}
                              </div>
                              <div style={{ textAlign: 'left' }}>
                                <span className="text-xs font-semi text-primary block" style={{ lineHeight: 1.1 }}>{p.fullName}</span>
                                <span className="text-muted" style={{ fontSize: '0.6rem', opacity: 0.8 }}>{p.playingStyle || 'Player'}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>Matches: {tournMatches} (Total: {p.matchesPlayed || 0})</span>
                              <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>#{p.jerseyNumber || '—'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
