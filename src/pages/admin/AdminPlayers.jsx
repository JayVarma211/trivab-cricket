import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCollection, setDocument, updateDocument, deleteDocument } from '../../firebase/firestore';
import { uploadImageToCloudinary } from '../../services/cloudinary';
import { Users, Trash2, Plus, AlertCircle, Search, Edit2, Upload, Eye, Download } from 'lucide-react';
import { generatePlayerID } from '../../utils/generatePlayerID';
import { QRCodeSVG } from 'qrcode.react';
import './Admin.css';

export default function AdminPlayers() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [selectedPlayerForDetails, setSelectedPlayerForDetails] = useState(null);

  const [activeTab, setActiveTab] = useState('players');
  const [captains, setCaptains] = useState([]);
  const [selectedCaptainForDetails, setSelectedCaptainForDetails] = useState(null);
  const [tournaments, setTournaments] = useState([]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    cricHeroesRegNo: '',
    emergencyContactName: '',
    emergencyContactMobile: '',
    bloodGroup: '',
    dob: '',
    teamId: '',
    teamName: '',
    playingStyle: 'Batsman',
    jerseyNumber: '',
    photo: null,
    instagramId: '',
    tshirtSize: '',
    trackPantSize: '',
    sleeveType: '',
    mcaPlayer: false,
    mcaIdNumber: '',
    mcaCardURL: '',
    mcaCardFile: null,
  });

  useEffect(() => {
    if (role !== 'admin') navigate('/admin/login');
    fetchData();
  }, [role, navigate]);

  const fetchData = async () => {
    try {
      const playersData = await getCollection('players', []);
      const teamsData = await getCollection('teams', []);
      const captainsData = await getCollection('captains', []);
      const tournamentsData = await getCollection('tournaments', []);
      setPlayers(playersData);
      setTeams(teamsData);
      setCaptains(captainsData);
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

  const handlePhotoChange = (e) => {
    setFormData(prev => ({
      ...prev,
      photo: e.target.files[0]
    }));
  };

  const handleTeamChange = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    setFormData(prev => ({
      ...prev,
      teamId,
      teamName: team?.teamName || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      let photoURL = '';
      if (formData.photo) {
        photoURL = await uploadImageToCloudinary(formData.photo);
      }

      let mcaCardURL = '';
      if (formData.mcaCardFile) {
        mcaCardURL = await uploadImageToCloudinary(formData.mcaCardFile);
      }

      if (editingId) {
        const previousPlayer = players.find(p => p.id === editingId);
        let playerTournaments = previousPlayer?.joinedTournaments || [];

        if (formData.teamId) {
          const teamObj = teams.find(t => t.id === formData.teamId);
          if (teamObj && teamObj.tournamentId) {
            const tournObj = tournaments.find(t => t.id === teamObj.tournamentId);
            const tournamentName = tournObj?.name || 'Tournament Edition';
            
            const alreadyJoined = playerTournaments.some(t => {
              const idToCompare = typeof t === 'string' ? t : t.id;
              if (idToCompare === teamObj.tournamentId) {
                t.teamId = formData.teamId;
                t.teamName = teamObj.teamName;
                return true;
              }
              return false;
            });
            
            if (!alreadyJoined) {
              playerTournaments = [
                ...playerTournaments,
                {
                  id: teamObj.tournamentId,
                  name: tournamentName,
                  teamId: formData.teamId,
                  teamName: teamObj.teamName,
                  matchesPlayed: 0,
                  joinedAt: new Date().toISOString()
                }
              ];
            }
            
            // Upsert registration in Firestore
            const regId = `${editingId}_${teamObj.tournamentId}`;
            await setDocument('registrations', regId, {
              id: regId,
              playerId: editingId,
              playerName: formData.fullName,
              playerEmail: formData.email,
              photoURL: photoURL || formData.photoURL || previousPlayer?.photoURL || '',
              playingStyle: formData.playingStyle || 'Batsman',
              jerseyNumber: formData.jerseyNumber || '',
              mobile: formData.mobile || formData.cricHeroesRegNo || '',
              cricHeroesRegNo: formData.cricHeroesRegNo || formData.mobile || '',
              tournamentId: teamObj.tournamentId,
              tournamentName: tournamentName,
              teamId: formData.teamId,
              teamName: teamObj.teamName,
              matchesPlayed: 0,
              joinedAt: new Date().toISOString()
            });
          }
        }

        const playerData = {
          fullName: formData.fullName,
          email: formData.email,
          mobile: formData.mobile || formData.cricHeroesRegNo || '',
          cricHeroesRegNo: formData.cricHeroesRegNo || formData.mobile || '',
          emergencyContactName: formData.emergencyContactName || '',
          emergencyContactMobile: formData.emergencyContactMobile || '',
          bloodGroup: formData.bloodGroup || '',
          dob: formData.dob || '',
          teamId: formData.teamId,
          teamName: formData.teamName,
          playingStyle: formData.playingStyle,
          jerseyNumber: formData.jerseyNumber,
          photoURL: photoURL || formData.photoURL || '',
          status: 'Active',
          playerId: previousPlayer?.playerId || editingId,
          joinedTournaments: playerTournaments,
          instagramId: formData.instagramId || '',
          tshirtSize: formData.tshirtSize || '',
          trackPantSize: formData.trackPantSize || '',
          sleeveType: formData.sleeveType || '',
          mcaPlayer: formData.mcaPlayer,
          mcaIdNumber: formData.mcaPlayer ? formData.mcaIdNumber : '',
          mcaCardURL: mcaCardURL || formData.mcaCardURL || '',
        };
        await updateDocument('players', editingId, playerData);

        // Adjust headcount counts
        if (previousPlayer && previousPlayer.teamId !== formData.teamId) {
          if (previousPlayer.teamId) {
            const prevTeam = teams.find(t => t.id === previousPlayer.teamId);
            if (prevTeam) {
              await updateDocument('teams', previousPlayer.teamId, {
                playerCount: Math.max(0, (prevTeam.playerCount || 0) - 1)
              });
            }
          }
          if (formData.teamId) {
            const newTeam = teams.find(t => t.id === formData.teamId);
            if (newTeam) {
              await updateDocument('teams', formData.teamId, {
                playerCount: (newTeam.playerCount || 0) + 1
              });
            }
          }
        }
      } else {
        const generatedId = generatePlayerID(formData.teamName || 'GEN');
        let playerTournaments = [];

        if (formData.teamId) {
          const teamObj = teams.find(t => t.id === formData.teamId);
          if (teamObj && teamObj.tournamentId) {
            const tournObj = tournaments.find(t => t.id === teamObj.tournamentId);
            const tournamentName = tournObj?.name || 'Tournament Edition';
            
            playerTournaments = [
              {
                id: teamObj.tournamentId,
                name: tournamentName,
                teamId: formData.teamId,
                teamName: teamObj.teamName,
                matchesPlayed: 0,
                joinedAt: new Date().toISOString()
              }
            ];

            // Create registration record
            const regId = `${generatedId}_${teamObj.tournamentId}`;
            await setDocument('registrations', regId, {
              id: regId,
              playerId: generatedId,
              playerName: formData.fullName,
              playerEmail: formData.email,
              photoURL: photoURL || '',
              playingStyle: formData.playingStyle || 'Batsman',
              jerseyNumber: formData.jerseyNumber || '',
              mobile: formData.mobile || formData.cricHeroesRegNo || '',
              cricHeroesRegNo: formData.cricHeroesRegNo || formData.mobile || '',
              tournamentId: teamObj.tournamentId,
              tournamentName: tournamentName,
              teamId: formData.teamId,
              teamName: teamObj.teamName,
              matchesPlayed: 0,
              joinedAt: new Date().toISOString()
            });
          }
        }

        const playerData = {
          playerId: generatedId,
          fullName: formData.fullName,
          email: formData.email,
          mobile: formData.mobile || formData.cricHeroesRegNo || '',
          cricHeroesRegNo: formData.cricHeroesRegNo || formData.mobile || '',
          emergencyContactName: formData.emergencyContactName || '',
          emergencyContactMobile: formData.emergencyContactMobile || '',
          bloodGroup: formData.bloodGroup || '',
          dob: formData.dob || '',
          teamId: formData.teamId,
          teamName: formData.teamName,
          playingStyle: formData.playingStyle,
          jerseyNumber: formData.jerseyNumber,
          photoURL: photoURL || '',
          status: 'Active',
          createdAt: new Date().toISOString(),
          joinedTournaments: playerTournaments,
          instagramId: formData.instagramId || '',
          tshirtSize: formData.tshirtSize || '',
          trackPantSize: formData.trackPantSize || '',
          sleeveType: formData.sleeveType || '',
          mcaPlayer: formData.mcaPlayer,
          mcaIdNumber: formData.mcaPlayer ? formData.mcaIdNumber : '',
          mcaCardURL: mcaCardURL || '',
        };
        await setDocument('players', generatedId, playerData);

        // Increment team player count
        if (formData.teamId) {
          const newTeam = teams.find(t => t.id === formData.teamId);
          if (newTeam) {
            await updateDocument('teams', formData.teamId, {
              playerCount: (newTeam.playerCount || 0) + 1
            });
          }
        }
      }

      fetchData();
      setShowForm(false);
      setEditingId(null);
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to save player');
    }
  };

  const updateMatchesPlayed = async (playerId, tournamentId, newCount) => {
    try {
      const regId = `${playerId}_${tournamentId}`;
      await updateDocument('registrations', regId, {
        matchesPlayed: newCount
      });

      const playerDoc = players.find(p => p.id === playerId);
      if (playerDoc && playerDoc.joinedTournaments) {
        const updatedJoined = playerDoc.joinedTournaments.map(t => {
          const idToCompare = typeof t === 'string' ? t : t.id;
          if (idToCompare === tournamentId) {
            return {
              ...t,
              matchesPlayed: newCount
            };
          }
          return t;
        });
        await updateDocument('players', playerId, {
          joinedTournaments: updatedJoined
        });
        
        setPlayers(prev => prev.map(p => {
          if (p.id === playerId) {
            return {
              ...p,
              joinedTournaments: updatedJoined
            };
          }
          return p;
        }));
        
        setSelectedPlayerForDetails(prev => ({
          ...prev,
          joinedTournaments: updatedJoined
        }));
      }
    } catch (err) {
      console.error("Error updating matches played:", err);
      alert("Failed to update matches played");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this player?')) return;
    
    try {
      const playerToDelete = players.find(p => p.id === id);
      await deleteDocument('players', id);
      
      if (playerToDelete && playerToDelete.teamId) {
        const teamObj = teams.find(t => t.id === playerToDelete.teamId);
        if (teamObj) {
          await updateDocument('teams', playerToDelete.teamId, {
            playerCount: Math.max(0, (teamObj.playerCount || 0) - 1)
          });
        }
      }
      fetchData();
    } catch (err) {
      setError('Failed to delete player');
    }
  };

  const handleDeleteCaptain = async (id) => {
    if (!window.confirm('Are you sure you want to delete this captain profile?')) return;
    try {
      const captainToDelete = captains.find(c => c.id === id);
      await deleteDocument('captains', id);
      if (captainToDelete && captainToDelete.teamId) {
        await updateDocument('teams', captainToDelete.teamId, {
          captainName: '',
          captainId: ''
        });
      }
      fetchData();
    } catch (err) {
      setError('Failed to delete captain profile');
    }
  };

  const handleEdit = (player) => {
    setFormData({
      fullName: player.fullName || '',
      email: player.email || '',
      mobile: player.mobile || '',
      cricHeroesRegNo: player.cricHeroesRegNo || '',
      emergencyContactName: player.emergencyContactName || '',
      emergencyContactMobile: player.emergencyContactMobile || '',
      bloodGroup: player.bloodGroup || '',
      dob: player.dob || '',
      teamId: player.teamId || '',
      teamName: player.teamName || '',
      playingStyle: player.playingStyle || 'Batsman',
      jerseyNumber: player.jerseyNumber || '',
      photoURL: player.photoURL || '',
      photo: null,
      instagramId: player.instagramId || '',
      tshirtSize: player.tshirtSize || '',
      trackPantSize: player.trackPantSize || '',
      sleeveType: player.sleeveType || '',
      mcaPlayer: !!player.mcaPlayer,
      mcaIdNumber: player.mcaIdNumber || '',
      mcaCardURL: player.mcaCardURL || '',
      mcaCardFile: null,
    });
    setEditingId(player.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      mobile: '',
      cricHeroesRegNo: '',
      emergencyContactName: '',
      emergencyContactMobile: '',
      bloodGroup: '',
      dob: '',
      teamId: '',
      teamName: '',
      playingStyle: 'Batsman',
      jerseyNumber: '',
      photoURL: '',
      photo: null,
      instagramId: '',
      tshirtSize: '',
      trackPantSize: '',
      sleeveType: '',
      mcaPlayer: false,
      mcaIdNumber: '',
      mcaCardURL: '',
      mcaCardFile: null,
    });
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

  const exportPlayersToCSV = () => {
    const headers = [
      'Player ID',
      'Full Name',
      'Email',
      'CricHeroes Regis No',
      'Date of Birth',
      'Blood Group',
      'Emergency Contact Name',
      'Emergency Contact Mobile',
      'Playing Style',
      'Jersey Number',
      'Instagram ID',
      'T-Shirt Size',
      'Track Pant Size',
      'Sleeve Type',
      'MCA Player',
      'MCA ID Number',
      'MCA Card URL',
      'Team Name',
      'Status',
      'Joined Tournaments & Matches',
      'Created At'
    ];

    const rows = players.map(p => {
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
        p.cricHeroesRegNo || p.mobile || '',
        p.dob || '',
        p.bloodGroup || '',
        p.emergencyContactName || '',
        p.emergencyContactMobile || '',
        p.playingStyle || '',
        p.jerseyNumber !== undefined ? p.jerseyNumber : '',
        p.instagramId || '',
        p.tshirtSize || '',
        p.trackPantSize || '',
        p.sleeveType || '',
        p.mcaPlayer ? 'Yes' : 'No',
        p.mcaIdNumber || '',
        p.mcaCardURL || '',
        p.teamName || 'Free Agent',
        p.status || '',
        tournamentsJoinedStr,
        p.createdAt || ''
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
    link.setAttribute('download', `trivab_players_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCaptainsToCSV = () => {
    const headers = [
      'Captain ID',
      'Full Name',
      'Email',
      'Mobile',
      'Managed Team',
      'Created At'
    ];

    const rows = captains.map(c => [
      c.captainId || c.id || '',
      c.fullName || '',
      c.email || '',
      c.mobile || '',
      c.teamName || 'Unassigned',
      c.createdAt || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `trivab_captains_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPlayers = players.filter(p =>
    p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.teamName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCaptains = captains.filter(c =>
    c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.teamName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="container section-padding"><p>Loading...</p></div>;

  return (
    <div className="admin-page container section-padding">
      <div className="page-header flex justify-between items-center mb-md">
        <div>
          <h1 className="display-sm text-gradient-gold">Roster Management</h1>
          <p className="text-secondary">Manage registered players, captains, and tournament participation.</p>
        </div>
        <div className="flex gap-sm flex-wrap">
          {activeTab === 'players' ? (
            <>
              <button
                onClick={exportPlayersToCSV}
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--admin-accent)', color: 'var(--admin-text)' }}
                title="Download all player details as Excel/CSV"
              >
                <Download size={18} /> Download Excel
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setEditingId(null);
                  setShowForm(!showForm);
                }}
                className="btn btn-gold"
              >
                <Plus size={18} /> Add Player
              </button>
            </>
          ) : (
            <button
              onClick={exportCaptainsToCSV}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--admin-accent)', color: 'var(--admin-text)' }}
              title="Download all captain details as Excel/CSV"
            >
              <Download size={18} /> Download Excel
            </button>
          )}
        </div>
      </div>

      {/* Tabs Toggle */}
      <div className="flex gap-md mb-xl" style={{ borderBottom: '1px solid var(--admin-border)', paddingBottom: '12px' }}>
        <button
          className={`btn ${activeTab === 'players' ? 'btn-gold' : 'btn-outline'} btn-sm`}
          onClick={() => { setActiveTab('players'); setShowForm(false); }}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          Registered Players ({players.length})
        </button>
        <button
          className={`btn ${activeTab === 'captains' ? 'btn-gold' : 'btn-outline'} btn-sm`}
          onClick={() => { setActiveTab('captains'); setShowForm(false); }}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          Team Captains ({captains.length})
        </button>
      </div>

      {error && (
        <div className="alert alert-error mb-lg">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {activeTab === 'players' && showForm && (
        <div className="card card-gold mb-xl p-lg animate-scale-in">
          <h2 className="text-lg font-bold mb-md text-gradient-gold">
            {editingId ? 'Edit Player' : 'Add New Player'}
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-2 gap-md">
            {/* Personal Details */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="fullName"
                className="form-input"
                required
                value={formData.fullName}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-input"
                required
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">CricHeroes Regis No.</label>
              <input
                type="text"
                name="cricHeroesRegNo"
                className="form-input"
                placeholder="Registration ID"
                required
                value={formData.cricHeroesRegNo || formData.mobile}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                name="dob"
                className="form-input"
                required
                value={formData.dob}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select
                name="bloodGroup"
                className="form-select"
                required
                value={formData.bloodGroup}
                onChange={handleInputChange}
              >
                <option value="">-- Choose Blood Group --</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Instagram ID</label>
              <input
                type="text"
                name="instagramId"
                className="form-input"
                placeholder="Username without @"
                value={formData.instagramId}
                onChange={handleInputChange}
              />
            </div>

            {/* Playing Details */}
            <div className="form-group">
              <label className="form-label">Team</label>
              <select
                className="form-select"
                value={formData.teamId}
                onChange={(e) => handleTeamChange(e.target.value)}
              >
                <option value="">Select Team (Free Agent)</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.teamName}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Playing Style</label>
              <select
                name="playingStyle"
                className="form-select"
                value={formData.playingStyle}
                onChange={handleInputChange}
              >
                <option value="Batsman">Batsman</option>
                <option value="Bowler">Bowler</option>
                <option value="Wicket Keeper">Wicket Keeper</option>
                <option value="All-Rounder">All-Rounder</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Jersey Number</label>
              <input
                type="number"
                name="jerseyNumber"
                className="form-input"
                required
                value={formData.jerseyNumber}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sleeve Type</label>
              <select
                name="sleeveType"
                className="form-select"
                required
                value={formData.sleeveType}
                onChange={handleInputChange}
              >
                <option value="">-- Choose Sleeve Type --</option>
                <option value="Half Sleeve">Half Sleeve</option>
                <option value="Full Sleeve">Full Sleeve</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">T-Shirt Size</label>
              <select
                name="tshirtSize"
                className="form-select"
                required
                value={formData.tshirtSize}
                onChange={handleInputChange}
              >
                <option value="">-- Choose T-Shirt Size --</option>
                <option value="S (36)">S (36)</option>
                <option value="M (38)">M (38)</option>
                <option value="L (40)">L (40)</option>
                <option value="XL (42)">XL (42)</option>
                <option value="XXL (44)">XXL (44)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Track Pant Size</label>
              <select
                name="trackPantSize"
                className="form-select"
                required
                value={formData.trackPantSize}
                onChange={handleInputChange}
              >
                <option value="">-- Choose Track Pant Size --</option>
                <option value="S (30)">S (30)</option>
                <option value="M (32)">M (32)</option>
                <option value="L (34)">L (34)</option>
                <option value="XL (36)">XL (36)</option>
                <option value="XXL (38)">XXL (38)</option>
              </select>
            </div>

            {/* Emergency & MCA Details */}
            <div className="form-group">
              <label className="form-label">Emergency Contact Name</label>
              <input
                type="text"
                name="emergencyContactName"
                className="form-input"
                required
                value={formData.emergencyContactName}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Emergency Contact Number</label>
              <input
                type="tel"
                name="emergencyContactMobile"
                className="form-input"
                required
                value={formData.emergencyContactMobile}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">MCA Registered Player?</label>
              <select
                name="mcaPlayer"
                className="form-select"
                value={formData.mcaPlayer ? 'yes' : 'no'}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    mcaPlayer: e.target.value === 'yes'
                  }));
                }}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            {formData.mcaPlayer && (
              <>
                <div className="form-group">
                  <label className="form-label">MCA ID Number</label>
                  <input
                    type="text"
                    name="mcaIdNumber"
                    className="form-input"
                    required={formData.mcaPlayer}
                    value={formData.mcaIdNumber}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group col-2">
                  <label className="form-label">MCA Card Photo</label>
                  <div className="flex gap-md items-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          mcaCardFile: e.target.files[0]
                        }));
                      }}
                      className="form-input flex-1"
                    />
                    {formData.mcaCardURL && (
                      <a href={formData.mcaCardURL} target="_blank" rel="noreferrer">
                        <img src={formData.mcaCardURL} alt="MCA Card" className="avatar-sm" style={{ objectFit: 'cover', border: '1px solid var(--admin-border)' }} />
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="form-group col-2">
              <label className="form-label">Player Photo</label>
              <div className="flex gap-md items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="form-input flex-1"
                />
                {formData.photoURL && <img src={formData.photoURL} alt="Preview" className="avatar-sm" />}
              </div>
            </div>

            <div className="flex gap-md col-2">
              <button type="submit" className="btn btn-gold flex-1">
                {editingId ? 'Update Player' : 'Add Player'}
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
          placeholder={activeTab === 'players' ? "Search players by name, email, or team..." : "Search captains by name, email, or team..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
        />
      </div>

      {activeTab === 'players' ? (
        <div className="table-responsive card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Player Name</th>
                <th>Email</th>
                <th>Team</th>
                <th>Position</th>
                <th>Jersey</th>
                <th>Joined Tournaments</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted">No players found.</td>
                </tr>
              ) : (
                filteredPlayers.map(player => (
                  <tr key={player.id}>
                    <td className="font-semi">{player.fullName}</td>
                    <td>{player.email}</td>
                    <td className="text-gold font-semi">{player.teamName || 'Free Agent'}</td>
                    <td><span className="badge badge-gold">{player.playingStyle}</span></td>
                    <td>#{player.jerseyNumber || 'N/A'}</td>
                    <td style={{ fontSize: '0.8rem', maxWidth: '200px' }} className="truncate" title={
                      player.joinedTournaments && player.joinedTournaments.length > 0
                        ? player.joinedTournaments.map(t => typeof t === 'string' ? t : t.name || t.id).join(', ')
                        : 'None'
                    }>
                      {player.joinedTournaments && player.joinedTournaments.length > 0
                        ? player.joinedTournaments.map(t => typeof t === 'string' ? t : t.name || t.id).join(', ')
                        : 'None'}
                    </td>
                    <td><span className="badge badge-green">{player.status}</span></td>
                    <td>
                      <div className="flex gap-sm">
                        <button
                          onClick={() => setSelectedPlayerForDetails(player)}
                          className="btn-table-action text-blue"
                          title="View Details"
                          style={{ color: '#3b82f6' }}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(player)}
                          className="btn-table-action text-gold"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(player.id)}
                          className="btn-table-action text-red"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-responsive card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Captain Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Managed Team</th>
                <th>Captain ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCaptains.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted">No captains found.</td>
                </tr>
              ) : (
                filteredCaptains.map(captain => (
                  <tr key={captain.id}>
                    <td className="font-semi">{captain.fullName}</td>
                    <td>{captain.email}</td>
                    <td>{captain.mobile}</td>
                    <td className="text-gold font-semi">{captain.teamName || 'Unassigned'}</td>
                    <td><code>{captain.captainId || captain.id}</code></td>
                    <td>
                      <div className="flex gap-sm">
                        <button
                          onClick={() => setSelectedCaptainForDetails(captain)}
                          className="btn-table-action text-blue"
                          title="View Details"
                          style={{ color: '#3b82f6' }}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCaptain(captain.id)}
                          className="btn-table-action text-red"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedPlayerForDetails && (
        <div className="modal-overlay" onClick={() => setSelectedPlayerForDetails(null)}>
          <div className="modal-content card card-gold animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', padding: 'var(--space-xl)', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="modal-close" onClick={() => setSelectedPlayerForDetails(null)}>✕</button>
            <h3 className="text-lg font-bold text-gradient-gold mb-md">Player Verification Details</h3>
            
            <div className="flex flex-col items-center gap-md text-center">
              <div className="avatar-xl mb-sm" style={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--admin-accent)' }}>
                {selectedPlayerForDetails.photoURL ? (
                  <img src={selectedPlayerForDetails.photoURL} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div className="avatar-xl flex items-center justify-center bg-secondary font-bold text-gold" style={{ width: '100%', height: '100%' }}>
                    {selectedPlayerForDetails.fullName[0]?.toUpperCase() || 'P'}
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="text-xl font-bold">{selectedPlayerForDetails.fullName}</h4>
                <span className="badge badge-gold mt-xs">{selectedPlayerForDetails.playingStyle}</span>
              </div>
              
              <div className="divider" />
              
              <div className="w-full text-sm text-left flex flex-col gap-xs" style={{ color: 'var(--admin-text)', maxHeight: '420px', overflowY: 'auto', paddingRight: '6px' }}>
                <div className="flex justify-between"><span className="opacity-70">Player ID:</span><strong>{selectedPlayerForDetails.playerId || selectedPlayerForDetails.id}</strong></div>
                <div className="flex justify-between"><span className="opacity-70">Email:</span><span>{selectedPlayerForDetails.email}</span></div>
                <div className="flex justify-between"><span className="opacity-70">CricHeroes Regis No:</span><span>{selectedPlayerForDetails.cricHeroesRegNo || selectedPlayerForDetails.mobile || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="opacity-70">Date of Birth:</span><span>{selectedPlayerForDetails.dob || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="opacity-70">Blood Group:</span><span>{selectedPlayerForDetails.bloodGroup || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="opacity-70">Emergency Contact:</span><span>{selectedPlayerForDetails.emergencyContactName ? `${selectedPlayerForDetails.emergencyContactName} (${selectedPlayerForDetails.emergencyContactMobile})` : 'N/A'}</span></div>
                <div className="flex justify-between"><span className="opacity-70">Instagram:</span><span>{selectedPlayerForDetails.instagramId ? `@${selectedPlayerForDetails.instagramId}` : 'N/A'}</span></div>
                <div className="flex justify-between"><span className="opacity-70">Team Name:</span><strong className="text-gold">{selectedPlayerForDetails.teamName || 'Free Agent'}</strong></div>
                <div className="flex justify-between"><span className="opacity-70">Jersey No:</span><span>#{selectedPlayerForDetails.jerseyNumber || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="opacity-70">Track Pant Size:</span><span>{selectedPlayerForDetails.trackPantSize || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="opacity-70">T-Shirt Size:</span><span>{selectedPlayerForDetails.tshirtSize || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="opacity-70">Sleeve Type:</span><span>{selectedPlayerForDetails.sleeveType || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="opacity-70">MCA Player:</span><span>{selectedPlayerForDetails.mcaPlayer ? 'Yes' : 'No'}</span></div>
                {selectedPlayerForDetails.mcaPlayer && (
                  <>
                    <div className="flex justify-between"><span className="opacity-70">MCA ID Number:</span><span>{selectedPlayerForDetails.mcaIdNumber || 'N/A'}</span></div>
                    {selectedPlayerForDetails.mcaCardURL && (
                      <div className="flex flex-col gap-xs mt-xs mb-sm">
                        <span className="opacity-70 text-xs font-bold uppercase">MCA Card:</span>
                        <a href={selectedPlayerForDetails.mcaCardURL} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                          <img 
                            src={selectedPlayerForDetails.mcaCardURL} 
                            alt="MCA Card" 
                            style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: '6px', border: '1px solid var(--border)' }} 
                          />
                        </a>
                      </div>
                    )}
                  </>
                )}
                
                <div className="divider" style={{ margin: '12px 0' }} />
                
                <div className="flex flex-col gap-xs w-full">
                  <span className="opacity-70 text-xs font-bold uppercase block mb-xs">Joined Tournaments & Roles</span>
                  {selectedPlayerForDetails.joinedTournaments && selectedPlayerForDetails.joinedTournaments.length > 0 ? (
                    <div className="flex flex-col gap-sm" style={{ maxHeight: '180px', overflowY: 'auto', width: '100%' }}>
                      {selectedPlayerForDetails.joinedTournaments.map((t, idx) => {
                        const tName = typeof t === 'string' ? t : t.name || t.id;
                        const tId = typeof t === 'string' ? t : t.id;
                        const teamName = t.teamName || 'N/A';
                        const roleLabel = t.role ? t.role.charAt(0).toUpperCase() + t.role.slice(1) : 'Player';
                        const matchesPlayed = t.matchesPlayed !== undefined ? t.matchesPlayed : 0;
                        
                        return (
                          <div key={tId || idx} className="card p-xs flex flex-col gap-xs" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-card)', padding: '8px 12px', borderRadius: '6px' }}>
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-xs truncate" style={{ maxWidth: '200px' }}>{tName}</span>
                              <span className="badge badge-gold" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{matchesPlayed} Matches</span>
                            </div>
                            <div className="flex justify-between items-center text-xs opacity-80 mt-xs">
                              <span>Team: <strong className="text-gold">{teamName}</strong> ({roleLabel})</span>
                              <button 
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const newValStr = prompt(`Enter matches played for ${selectedPlayerForDetails.fullName} in ${tName}:`, matchesPlayed);
                                  if (newValStr !== null) {
                                    const newVal = parseInt(newValStr, 10);
                                    if (!isNaN(newVal)) {
                                      await updateMatchesPlayed(selectedPlayerForDetails.id, tId, newVal);
                                    }
                                  }
                                }}
                                className="btn btn-outline"
                                style={{ padding: '2px 8px', fontSize: '0.7rem', borderRadius: '4px', height: 'auto' }}
                              >
                                Edit Matches
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-muted">No tournaments joined.</span>
                  )}
                </div>
                <div className="flex justify-between mt-sm"><span className="opacity-70">Status:</span><span className="text-green">{selectedPlayerForDetails.status}</span></div>
              </div>
              
              <div className="divider" />
              
              <div className="qr-container bg-white p-sm rounded-md" style={{ display: 'inline-block', padding: '12px', background: '#fff', borderRadius: '8px' }}>
                <QRCodeSVG value={selectedPlayerForDetails.playerId || selectedPlayerForDetails.id} size={140} />
              </div>
              <p className="text-xs text-secondary opacity-60">Verified Player QR Code Pass</p>
            </div>
          </div>
        </div>
      )}
      {selectedCaptainForDetails && (
        <div className="modal-overlay" onClick={() => setSelectedCaptainForDetails(null)}>
          <div className="modal-content card card-gold animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', padding: 'var(--space-xl)', maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="modal-close" onClick={() => setSelectedCaptainForDetails(null)}>✕</button>
            <h3 className="text-lg font-bold text-gradient-gold mb-md">Captain Verification Details</h3>
            
            <div className="flex flex-col items-center gap-md text-center">
              <div className="avatar-xl mb-sm" style={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--admin-accent)' }}>
                {selectedCaptainForDetails.photoURL ? (
                  <img src={selectedCaptainForDetails.photoURL} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div className="avatar-xl flex items-center justify-center bg-secondary font-bold text-gold" style={{ width: '100%', height: '100%' }}>
                    {selectedCaptainForDetails.fullName[0]?.toUpperCase() || 'C'}
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="text-xl font-bold">{selectedCaptainForDetails.fullName}</h4>
                <span className="badge badge-gold mt-xs">Team Captain</span>
              </div>
              
              <div className="divider" />
              
              <div className="w-full text-sm text-left flex flex-col gap-xs" style={{ color: 'var(--admin-text)' }}>
                <div className="flex justify-between"><span className="opacity-70">Captain ID:</span><strong>{selectedCaptainForDetails.captainId || selectedCaptainForDetails.id}</strong></div>
                <div className="flex justify-between"><span className="opacity-70">Email:</span><span>{selectedCaptainForDetails.email}</span></div>
                <div className="flex justify-between"><span className="opacity-70">Mobile:</span><span>{selectedCaptainForDetails.mobile}</span></div>
                <div className="flex justify-between"><span className="opacity-70">Managed Team:</span><strong className="text-gold">{selectedCaptainForDetails.teamName || 'Unassigned'}</strong></div>
              </div>
              
              <div className="divider" />
              
              <div className="qr-container bg-white p-sm rounded-md" style={{ display: 'inline-block', padding: '12px', background: '#fff', borderRadius: '8px' }}>
                <QRCodeSVG value={selectedCaptainForDetails.captainId || selectedCaptainForDetails.id} size={140} />
              </div>
              <p className="text-xs text-secondary opacity-60">Verified Captain QR Code Pass</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
