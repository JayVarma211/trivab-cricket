import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCollection, setDocument, deleteDocument, where, addDocument, updateDocument } from '../../firebase/firestore';
import { Trophy, Trash2, Plus, AlertCircle, Edit2, Search, Calendar, Users, Eye, ArrowLeft, Loader2, Upload } from 'lucide-react';
import uploadImageToCloudinary from '../../services/cloudinary';
import './Admin.css';

const getCleanLogoUrl = (url) => {
  if (!url) return '';
  const u = url.toLowerCase();
  if (u.startsWith('/logos/') && (u.endsWith('.jpg') || u.endsWith('.jpeg'))) {
    if (u.includes('trivabmonsoon') || u.includes('bapllogo') || u.includes('trivabsports')) {
      return url;
    }
    return url.replace(/\.(jpg|jpeg)$/i, '.png');
  }
  return url;
};

const PREDEFINED_TOURNAMENTS = [
  { id: 'bapl-south', name: 'BAPL 3.0 - South Mumbai Edition', logo: '/logos/baplt20south.png', description: 'South Mumbai Edition of the premier BAPL 3.0 League.' },
  { id: 'bapl-north', name: 'BAPL 3.0 - North Mumbai Edition', logo: '/logos/baplt20north.png', description: 'North Mumbai Edition of the premier BAPL 3.0 League.' },
  { id: 'baplxpress-south', name: 'BAPL XPRESS - South Mumbai Edition', logo: '/logos/baplxpresst20south.png', description: 'South Mumbai Edition of the fast-paced BAPL XPRESS League.' },
  { id: 'baplxpress-north', name: 'BAPL XPRESS - North Mumbai Edition', logo: '/logos/baplxpresst20north.png', description: 'North Mumbai Edition of the fast-paced BAPL XPRESS League.' },
  { id: 'baplcorporate-north', name: 'BAPL Corporate Cup', logo: '/logos/baplcorporate.png', description: 'North Mumbai corporate edition of the BAPL Corporate Cup.' },
  { id: 'trivab-monsoon', name: 'Trivab Monsoon Championship', logo: '/logos/trivabmonsoon.jpg', description: 'The grand Trivab Monsoon Championship tournament.' },
  { id: 'bapldads-south', name: 'BAPL DADS T20 - South Mumbai Edition', logo: '/logos/bapldadst20.png', description: 'South Mumbai Edition of the BAPL DADS T20 League.' },
  { id: 'bapldads-north', name: 'BAPL DADS T20 - North Mumbai Edition', logo: '/logos/bapldadst20.png', description: 'North Mumbai Edition of the BAPL DADS T20 League.' },
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
    customName: '',
    customLogo: ''
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const handleActivate = async (pred) => {
    setError('');
    try {
      const dbTourn = tournaments.find(t => t.id === pred.id);
      if (dbTourn) {
        await updateDocument('tournaments', pred.id, { isActivated: true, joinEnabled: false });
      } else {
        const tournamentData = {
          name: pred.name,
          logo: pred.logo,
          status: 'Upcoming',
          date: 'TBD',
          teamCount: 12,
          description: pred.description,
          winner: 'TBD',
          runnerUp: 'TBD',
          isActivated: true,
          joinEnabled: false,
          createdAt: new Date().toISOString()
        };
        await setDocument('tournaments', pred.id, tournamentData);
      }
      fetchData();
      alert(`Tournament "${pred.name}" activated successfully!`);
    } catch (err) {
      console.error(err);
      setError('Failed to activate tournament: ' + err.message);
    }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate "${name}"? This will stop people from joining and registering.`)) return;
    setError('');
    try {
      await updateDocument('tournaments', id, { isActivated: false, joinEnabled: false });
      fetchData();
      alert(`Tournament "${name}" deactivated successfully.`);
    } catch (err) {
      console.error(err);
      setError('Failed to deactivate tournament');
    }
  };

  const handleToggleJoining = async (id, name, enabled) => {
    setError('');
    try {
      await updateDocument('tournaments', id, { joinEnabled: !enabled });
      await fetchData();
      alert(`Joining ${!enabled ? 'enabled' : 'disabled'} for "${name}".`);
    } catch (err) {
      console.error(err);
      setError('Failed to update tournament joining access');
    }
  };
  const exportToCSV = (data, headers, filename) => {
    const csvRows = [];
    csvRows.push(headers.join(','));
    for (const row of data) {
      const values = row.map(val => {
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadTeamsExcel = () => {
    if (!selectedTournamentForModal) return;
    const tournamentTeams = teams.filter(t => t.tournamentId === selectedTournamentForModal.id);
    const headers = ['Team Name', 'City', 'Captain Name', 'Matches Scheduled', 'Wins', 'Losses', 'Max Roster Limit'];
    const data = tournamentTeams.map(t => {
      const teamMatchesCount = matches.filter(m => 
        m.tournamentId === selectedTournamentForModal.id && 
        (m.teamA === t.teamName || m.teamB === t.teamName)
      ).length;
      return [
        t.teamName,
        t.city || 'TBD',
        t.captainName || 'Not Assigned',
        teamMatchesCount,
        t.wins || 0,
        t.losses || 0,
        t.maxPlayers || 40
      ];
    });
    exportToCSV(data, headers, `${selectedTournamentForModal.name.replace(/\s+/g, '_')}_Teams.csv`);
  };

  const downloadMatchesExcel = () => {
    if (!selectedTournamentForModal) return;
    const tournamentMatches = matches.filter(m => m.tournamentId === selectedTournamentForModal.id);
    const headers = ['Team A', 'Team B', 'Date', 'Time', 'Venue', 'Format', 'Status', 'Result'];
    const data = tournamentMatches.map(m => [
      m.teamA,
      m.teamB,
      m.date,
      m.time,
      m.venue,
      m.format,
      m.status,
      m.result || 'TBD'
    ]);
    exportToCSV(data, headers, `${selectedTournamentForModal.name.replace(/\s+/g, '_')}_Matches.csv`);
  };

  const downloadSquadExcel = () => {
    if (!selectedTournamentForModal || !viewingTeamSquad) return;
    const headers = [
      'Player Name', 
      'Player ID', 
      'Initials',
      'Mobile (CricHeroes No)', 
      'Emergency Contact Name', 
      'Emergency Contact Mobile', 
      'Blood Group', 
      'Date of Birth', 
      'Email', 
      'Playing Style', 
      'Jersey Number', 
      'Name on Jersey', 
      'MCA Player?', 
      'MCA ID Number', 
      'MCA Card URL',
      'Track Pant Size', 
      'T-Shirt Size', 
      'Sleeve Type', 
      'Instagram ID', 
      'Status',
      'Matches in Tournament',
      'Joined Tournaments & Matches',
      'Created At'
    ];
    const data = teamPlayers.map(p => {
      const tournObj = p.joinedTournaments?.find(jt => (typeof jt === 'string' ? jt : jt.id) === selectedTournamentForModal.id);
      const tournMatches = tournObj?.matchesPlayed !== undefined ? tournObj.matchesPlayed : 0;
      
      const tournamentsJoinedStr = p.joinedTournaments && p.joinedTournaments.length > 0
        ? p.joinedTournaments.map(t => {
            const name = typeof t === 'string' ? t : t.name || t.id;
            const matches = t.matchesPlayed !== undefined ? t.matchesPlayed : 0;
            return `${name} (${matches} matches)`;
          }).join('; ')
        : 'None';

      return [
        p.fullName || '—',
        p.playerId || '—',
        p.playerInitials || '—',
        p.mobile || '—',
        p.emergencyContactName || '—',
        p.emergencyContactMobile || '—',
        p.bloodGroup || '—',
        p.dob || '—',
        p.email || '—',
        p.playingStyle || 'Player',
        p.jerseyNumber || '—',
        p.nameOnJersey || '—',
        p.mcaPlayer ? 'Yes' : 'No',
        p.mcaIdNumber || '—',
        p.mcaCardURL || '—',
        p.trackPantSize || '—',
        p.tshirtSize || '—',
        p.sleeveType || '—',
        p.instagramId || '—',
        p.status || 'Active',
        tournMatches,
        tournamentsJoinedStr,
        p.createdAt || '—'
      ];
    });
    exportToCSV(data, headers, `${viewingTeamSquad.teamName.replace(/\s+/g, '_')}_Squad.csv`);
  };

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
      description: selected ? selected.description : '',
      customName: selected ? '' : (prev.customName || ''),
      customLogo: selected ? '' : (prev.customLogo || '')
    }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setFormData(prev => ({ ...prev, customLogo: url }));
      alert('Logo uploaded successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to upload logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.typeId) {
      setError('Please select a tournament type/edition');
      return;
    }

    try {
      const isCustom = formData.typeId === 'custom';
      let targetId = editingId;
      let tournamentData = {};

      if (isCustom) {
        if (!formData.customName) {
          setError('Please enter custom tournament name');
          return;
        }
        if (!targetId) {
          const slug = formData.customName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          targetId = `custom-${slug}-${Date.now().toString().slice(-4)}`;
        }
        tournamentData = {
          name: formData.customName,
          logo: formData.customLogo || '/logos/bapllogo.jpg',
          status: formData.status,
          date: formData.date || 'TBD',
          teamCount: formData.teamCount || 12,
          description: formData.description || '',
          winner: formData.winner || 'TBD',
          runnerUp: formData.runnerUp || 'TBD',
          createdAt: new Date().toISOString(),
          isCustom: true
        };
      } else {
        const selectedType = PREDEFINED_TOURNAMENTS.find(t => t.id === formData.typeId);
        targetId = formData.typeId;
        tournamentData = {
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
      }

      await setDocument('tournaments', targetId, {
        ...tournamentData,
        isActivated: true,
        joinEnabled: editingId
          ? tournaments.find(t => t.id === targetId)?.joinEnabled === true
          : false
      });

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
    const isPredefined = PREDEFINED_TOURNAMENTS.some(p => p.id === tourn.id);
    setFormData({
      typeId: isPredefined ? tourn.id : 'custom',
      status: tourn.status || 'Upcoming',
      date: tourn.date || '',
      teamCount: tourn.teamCount || 12,
      description: tourn.description || '',
      winner: tourn.winner || 'TBD',
      runnerUp: tourn.runnerUp || 'TBD',
      customName: isPredefined ? '' : (tourn.name || ''),
      customLogo: isPredefined ? '' : (tourn.logo || '')
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
      customName: '',
      customLogo: ''
    });
  };

  const filteredTournaments = tournaments.filter(t =>
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const REMOVED_TOURNAMENT_IDS = new Set(['baplcorporate-south', 'baplcorporate-pune']);

  const getStatusClass = (status) => {
    if (status === 'Live') return 'badge-red';
    if (status === 'Completed') return 'badge-green';
    return 'badge-gold';
  };

  const allItems = [
    ...PREDEFINED_TOURNAMENTS.map(pred => {
      const dbTourn = tournaments.find(t => t.id === pred.id);
      return {
        id: pred.id,
        name: dbTourn?.name || pred.name,
        logo: dbTourn?.logo || pred.logo,
        status: dbTourn ? (dbTourn.isActivated !== false ? dbTourn.status : 'Inactive') : 'Inactive',
        date: dbTourn?.date || 'TBD',
        teamCount: dbTourn?.teamCount || 12,
        description: dbTourn?.description || pred.description,
        isActive: !!dbTourn && dbTourn.isActivated !== false,
        dbTourn: dbTourn,
        isPredefined: true
      };
    }),
    ...tournaments
      .filter(t => !PREDEFINED_TOURNAMENTS.some(p => p.id === t.id) && !REMOVED_TOURNAMENT_IDS.has(t.id))
      .map(t => ({
        id: t.id,
        name: t.name,
        logo: t.logo,
        status: t.isActivated !== false ? t.status : 'Inactive',
        date: t.date || 'TBD',
        teamCount: t.teamCount || 12,
        description: t.description || '',
        isActive: t.isActivated !== false,
        dbTourn: t,
        isPredefined: false
      }))
  ];

  const filteredItems = allItems.filter(item => !REMOVED_TOURNAMENT_IDS.has(item.id) && (
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.status.toLowerCase().includes(searchTerm.toLowerCase())
  ));

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
                <option value="custom">-- Custom / New Tournament --</option>
              </select>
            </div>

            {formData.typeId === 'custom' && (
              <>
                <div className="form-group col-2">
                  <label className="form-label">Custom Tournament Name <span className="text-red">*</span></label>
                  <input
                    type="text"
                    name="customName"
                    className="form-input"
                    required={formData.typeId === 'custom'}
                    placeholder="e.g. TRIVAB Champions Cup"
                    value={formData.customName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Custom Tournament Logo URL</label>
                  <input
                    type="text"
                    name="customLogo"
                    className="form-input"
                    placeholder="e.g. https://domain.com/logo.png"
                    value={formData.customLogo}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Or Upload Logo Image</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                      id="custom-logo-file-input"
                    />
                    <label
                      htmlFor="custom-logo-file-input"
                      className="btn btn-outline btn-sm"
                      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Upload size={14} /> Choose File
                    </label>
                    {uploadingLogo && <span className="text-xs text-muted">Uploading...</span>}
                    {formData.customLogo && !uploadingLogo && (
                      <span className="text-xs text-green" style={{ color: '#22c55e' }}>✓ Uploaded</span>
                    )}
                  </div>
                </div>
              </>
            )}

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
        {filteredItems.map((item, idx, arr) => {
          const isActive = item.isActive;
          const displayTourn = item;
          const dbTourn = item.dbTourn;

          const badgeInactiveStyle = {
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'rgba(255, 255, 255, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '0.65rem',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: 'bold',
            display: 'inline-block'
          };

          return (
            <div 
              key={item.id} 
              className={`admin-tournament-item ${!isActive ? 'inactive-item' : ''}`} 
              onClick={() => isActive && handleTournamentClick(dbTourn)}
              style={{
                borderBottom: idx < arr.length - 1 ? '1px solid var(--admin-border)' : 'none',
                cursor: isActive ? 'pointer' : 'default',
                opacity: isActive ? 1 : 0.65
              }}
            >
              {/* Logo — circular white card badge */}
              {displayTourn.logo && (
                <div className="admin-tournament-logo-badge-wrapper" style={{
                  width: '65px',
                  height: '65px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  border: '2px solid var(--gold)',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                  padding: '4px'
                }}>
                  <img
                    src={getCleanLogoUrl(displayTourn.logo)}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                </div>
              )}

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--admin-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayTourn.name}
                  </h3>
                  {isActive ? (
                    <span className={`badge ${getStatusClass(displayTourn.status)}`}>{displayTourn.status}</span>
                  ) : (
                    <span style={badgeInactiveStyle}>Inactive</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>
                    <Calendar size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    {displayTourn.date || 'TBD'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>
                    <Users size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    {displayTourn.teamCount || 12} Teams
                  </span>
                  {isActive && displayTourn.status === 'Completed' && displayTourn.winner && displayTourn.winner !== 'TBD' && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--admin-green)' }}>
                      🏆 {displayTourn.winner}
                    </span>
                  )}
                </div>
                {displayTourn.description && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--admin-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '500px' }}>
                    {displayTourn.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                {isActive ? (
                  <>
                    <button
                      onClick={() => handleTournamentClick(dbTourn)}
                      className="btn-table-action"
                      title="View Details"
                      style={{ color: '#3b82f6' }}
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => handleEdit(dbTourn)}
                      className="btn-table-action"
                      title="Edit Settings"
                      style={{ color: 'var(--admin-gold)' }}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeactivate(item.id, item.name)}
                      className="btn btn-outline text-red btn-xs"
                      style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto' }}
                    >
                      Deactivate
                    </button>
                    {dbTourn && (
                      <button
                        onClick={() => handleToggleJoining(item.id, item.name, dbTourn.joinEnabled === true)}
                        className={`btn btn-xs ${dbTourn.joinEnabled === true ? 'btn-outline text-red' : 'btn-gold'}`}
                        style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto' }}
                      >
                        {dbTourn.joinEnabled === true ? 'Disable Joining' : 'Enable Joining'}
                      </button>
                    )}
                    {dbTourn && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="btn btn-outline text-red btn-xs"
                        style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto' }}
                      >
                        Delete
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleActivate(item)}
                      className="btn btn-gold btn-xs"
                      style={{ padding: '4px 12px', fontSize: '0.75rem', height: 'auto' }}
                    >
                      Activate
                    </button>
                    {dbTourn && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="btn btn-outline text-red btn-xs"
                        style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto' }}
                      >
                        Delete
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tournament Details & Squad Modal */}
      {selectedTournamentForModal && (
        <div className="modal-overlay" onClick={() => setSelectedTournamentForModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: 'var(--space-xl)', maxWidth: '850px', width: '95%', position: 'relative', color: 'var(--admin-text)' }}>
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
                <div className="admin-tournament-logo-modal-badge" style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  border: '2px solid var(--gold)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                  padding: '5px'
                }}>
                  <img
                    src={getCleanLogoUrl(selectedTournamentForModal.logo)}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Squad Roster ({teamPlayers.length} Players)
                    </h4>
                    <button 
                      onClick={downloadSquadExcel} 
                      className="btn btn-outline btn-xs" 
                      style={{ padding: '2px 8px', fontSize: '0.7rem', height: 'auto', border: '1px solid var(--admin-border)' }}
                    >
                      Download Excel
                    </button>
                  </div>
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
              <div className="admin-modal-layout-grid" style={{ textAlign: 'left' }}>
                
                {/* Left Column: Teams */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <h4 style={{ margin: '0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Teams Registered ({teams.filter(team => team.tournamentId === selectedTournamentForModal.id).length})
                    </h4>
                    {teams.filter(team => team.tournamentId === selectedTournamentForModal.id).length > 0 && (
                      <button 
                        onClick={downloadTeamsExcel} 
                        className="btn btn-outline btn-xs" 
                        style={{ padding: '2px 8px', fontSize: '0.7rem', height: 'auto', border: '1px solid var(--admin-border)' }}
                      >
                        Download Excel
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
                    {teams.filter(team => team.tournamentId === selectedTournamentForModal.id).length === 0 ? (
                      <div style={{ padding: '30px', textAlign: 'center', color: 'var(--admin-muted)', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--admin-border)', borderRadius: '8px' }}>
                        <p style={{ margin: 0, fontSize: '0.8rem' }}>No teams registered for this league yet.</p>
                      </div>
                    ) : (
                      teams.filter(team => team.tournamentId === selectedTournamentForModal.id).map(team => {
                        const teamMatchesCount = matches.filter(m => 
                          m.tournamentId === selectedTournamentForModal.id && 
                          (m.teamA === team.teamName || m.teamB === team.teamName)
                        ).length;

                        return (
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
                              <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>
                                Matches: {teamMatchesCount}
                              </span>
                            </div>
                            <ChevronRight size={16} style={{ color: 'var(--admin-muted)' }} />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right Column: Match Fixtures */}
                <div style={{ borderLeft: '1px solid var(--admin-border)', paddingLeft: '24px' }}>
                  <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Match Fixtures ({matches.filter(m => m.tournamentId === selectedTournamentForModal.id).length})
                      </h4>
                      {matches.filter(m => m.tournamentId === selectedTournamentForModal.id).length > 0 && (
                        <button 
                          onClick={downloadMatchesExcel} 
                          className="btn btn-outline btn-xs" 
                          style={{ padding: '2px 8px', fontSize: '0.7rem', height: 'auto', border: '1px solid var(--admin-border)' }}
                        >
                          Download Excel
                        </button>
                      )}
                    </div>
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
