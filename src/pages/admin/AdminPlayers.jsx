import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCollection, setDocument, updateDocument, deleteDocument, syncTeamRosterCountAndNotify } from '../../firebase/firestore';
import { uploadImageToCloudinary } from '../../services/cloudinary';
import { Users, Trash2, Plus, AlertCircle, Search, Edit2, Upload, Eye, Download, User } from 'lucide-react';
import { generatePlayerID } from '../../utils/generatePlayerID';
import { QRCodeSVG } from 'qrcode.react';
import { downloadIDCardPDF } from '../../utils/generateIDCardPDF';
import './Admin.css';
import '../player/Player.css';

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
    nameOnJersey: '',
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
              nameOnJersey: (formData.nameOnJersey || '').trim().toUpperCase(),
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
          nameOnJersey: (formData.nameOnJersey || '').trim().toUpperCase(),
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
            await syncTeamRosterCountAndNotify(previousPlayer.teamId);
          }
          if (formData.teamId) {
            await syncTeamRosterCountAndNotify(formData.teamId);
          }
        } else if (formData.teamId) {
          await syncTeamRosterCountAndNotify(formData.teamId);
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
              nameOnJersey: (formData.nameOnJersey || '').trim().toUpperCase(),
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
          nameOnJersey: (formData.nameOnJersey || '').trim().toUpperCase(),
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

        // Sync team roster count and notify captain
        if (formData.teamId) {
          await syncTeamRosterCountAndNotify(formData.teamId);
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
      
      if (playerToDelete && playerToDelete.uid) {
        await deleteDocument('users', playerToDelete.uid);
      }
      
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
      
      if (captainToDelete && captainToDelete.uid) {
        await deleteDocument('users', captainToDelete.uid);
      }
      
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
      nameOnJersey: player.nameOnJersey || '',
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
      nameOnJersey: '',
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
      'Name on Jersey',
      'Instagram ID',
      'T-Shirt Size',
      'Track Pant Size',
      'Sleeve Type',
      'MCA Player',
      'MCA ID Number',
      'MCA Card URL',
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
        p.nameOnJersey || '',
        p.instagramId || '',
        p.tshirtSize || '',
        p.trackPantSize || '',
        p.sleeveType || '',
        p.mcaPlayer ? 'Yes' : 'No',
        p.mcaIdNumber || '',
        p.mcaCardURL || '',
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
      'Mobile / CricHeroes Reg No.',
      'Managed Team',
      'Date of Birth',
      'Blood Group',
      'Emergency Contact Name',
      'Emergency Contact Mobile',
      'Playing Style',
      'Jersey Number',
      'Name on Jersey',
      'Instagram ID',
      'T-Shirt Size',
      'Track Pant Size',
      'Sleeve Type',
      'MCA Player',
      'MCA ID Number',
      'Photo URL',
      'Joined Tournaments',
      'Created At'
    ];

    const rows = captains.map(c => {
      // Cross-reference the players collection using uid to get all registration fields
      const playerProfile = players.find(p => p.uid === c.uid || p.email === c.email) || {};

      const tournamentsStr = playerProfile.joinedTournaments && playerProfile.joinedTournaments.length > 0
        ? playerProfile.joinedTournaments.map(t => {
            const name = typeof t === 'string' ? t : t.name || t.id;
            const matches = t.matchesPlayed !== undefined ? t.matchesPlayed : 0;
            return `${name} (${matches} matches)`;
          }).join('; ')
        : 'None';

      return [
        c.captainId || c.id || '',
        c.fullName || '',
        c.email || '',
        playerProfile.cricHeroesRegNo || playerProfile.mobile || c.mobile || '',
        c.teamName || 'Unassigned',
        playerProfile.dob || '',
        playerProfile.bloodGroup || '',
        playerProfile.emergencyContactName || '',
        playerProfile.emergencyContactMobile || '',
        playerProfile.playingStyle || '',
        playerProfile.jerseyNumber !== undefined ? playerProfile.jerseyNumber : '',
        playerProfile.nameOnJersey || '',
        playerProfile.instagramId || '',
        playerProfile.tshirtSize || '',
        playerProfile.trackPantSize || '',
        playerProfile.sleeveType || '',
        playerProfile.mcaPlayer ? 'Yes' : 'No',
        playerProfile.mcaIdNumber || '',
        c.photoURL || playerProfile.photoURL || '',
        tournamentsStr,
        c.createdAt || ''
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
    link.setAttribute('download', `trivab_captains_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPlayers = players
    .filter(p =>
      p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.teamName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

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

            <div className="form-group">
              <label className="form-label">Team</label>
              <select
                className="form-select"
                value={formData.teamId}
                onChange={(e) => handleTeamChange(e.target.value)}
              >
                <option value="">Select Team</option>
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
              <label className="form-label">Name on Jersey</label>
              <input
                type="text"
                name="nameOnJersey"
                className="form-input"
                placeholder="Name on jersey (e.g. SHARMA)"
                value={formData.nameOnJersey}
                onChange={(e) => {
                  const upper = e.target.value.toUpperCase();
                  setFormData(prev => ({ ...prev, nameOnJersey: upper }));
                }}
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
                <option value="S (38)">S (38)</option>
                <option value="M (40)">M (40)</option>
                <option value="L (42)">L (42)</option>
                <option value="XL (44)">XL (44)</option>
                <option value="XXL (46)">XXL (46)</option>
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
                <option value="S (28)">S (28)</option>
                <option value="M (30)">M (30)</option>
                <option value="L (32)">L (32)</option>
                <option value="XL (34)">XL (34)</option>
                <option value="XXL (36)">XXL (36)</option>
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

      <div className="flex gap-md items-center mb-lg flex-wrap sm:flex-nowrap">
        <div className="search-box flex-1 mb-0" style={{ marginBottom: 0 }}>
          <Search size={18} />
          <input
            type="text"
            placeholder={activeTab === 'players' ? "Search players by name, email, or team..." : "Search captains by name, email, or team..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      {activeTab === 'players' ? (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Player Name</th>
                <th>Email</th>
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
                  <td colSpan="7" className="text-center text-muted">No players found.</td>
                </tr>
              ) : (
                filteredPlayers.map(player => (
                  <tr key={player.id}>
                    <td className="font-semi">{player.fullName}</td>
                    <td>{player.email}</td>
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
        <div className="table-responsive">
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
          <div 
            className="modal-content card card-gold animate-scale-in" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: '850px', 
              width: '95%',
              padding: 'var(--space-xl)', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              border: '1px solid var(--admin-border)',
              background: 'var(--admin-card-bg)',
              color: 'var(--admin-text)'
            }}
          >
            <button className="modal-close" onClick={() => setSelectedPlayerForDetails(null)}>✕</button>
            
            <div className="flex justify-between items-center mb-lg pb-sm" style={{ borderBottom: '1px solid var(--admin-border)', paddingRight: '40px' }}>
              <h3 className="text-lg font-bold text-gradient-gold">Player Profile Details & Pass</h3>
              <button 
                onClick={async () => {
                  try {
                    await downloadIDCardPDF('admin-player-card-render', `${selectedPlayerForDetails.playerId || selectedPlayerForDetails.id}.pdf`);
                  } catch (e) {
                    console.error("PDF download failed:", e);
                    alert("Failed to generate PDF pass");
                  }
                }}
                className="btn btn-gold btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <Download size={14} /> Download ID Card
              </button>
            </div>
            
            <div className="player-details-grid">
              
              {/* Left Column: ID Card Render & Main Actions */}
              <div className="flex flex-col items-center gap-md" style={{ width: '100%' }}>
                
                <div className="card-render-wrapper">
                  <div className="id-card-element" id="admin-player-card-render" style={{ margin: '0 auto' }}>
                    <div className="id-card-gold-accent" />
                    <div className="id-card-inner">
                      {/* LEFT: Photo */}
                      <div className="id-card-left">
                        <div className="id-player-photo">
                          {selectedPlayerForDetails.photoURL ? (
                            <img src={selectedPlayerForDetails.photoURL} alt={selectedPlayerForDetails.fullName} />
                          ) : (
                            <User size={36} />
                          )}
                        </div>
                        {/* Jersey number badge */}
                        {selectedPlayerForDetails.jerseyNumber && (
                          <div style={{
                            background: 'rgba(212,175,55,0.15)',
                            border: '1px solid rgba(212,175,55,0.3)',
                            borderRadius: '6px',
                            padding: '2px 10px',
                            textAlign: 'center',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}>
                            <div style={{ fontSize: '0.45rem', color: 'rgba(212,175,55,0.7)', letterSpacing: '0.1em', fontWeight: 700 }}>JERSEY</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#d4af37', lineHeight: 1.1 }}>
                              #{selectedPlayerForDetails.jerseyNumber}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* DIVIDER */}
                      <div className="id-card-divider" />

                      {/* RIGHT: Info */}
                      <div className="id-card-right">
                        {/* Header */}
                        <div className="id-card-header">
                          <div className="id-card-logo">
                            <img src="/logos/trivabsports.webp" className="id-card-brand-logo" alt="TRIVAB SPORTS" />
                          </div>
                          <div className="id-card-badge">VERIFIED PASS</div>
                        </div>

                        {/* Name & Style */}
                        <div>
                          <h3 className="id-player-name">{selectedPlayerForDetails.fullName}</h3>
                          <span className="id-player-style">{selectedPlayerForDetails.playingStyle}</span>
                        </div>



                        {/* Footer: ID & QR */}
                        <div className="id-card-footer">
                          <div className="id-code-group">
                            <span className="id-stat-lbl">Player ID</span>
                            <span className="id-code-text">{selectedPlayerForDetails.playerId || selectedPlayerForDetails.id}</span>
                          </div>
                          <div className="id-qr-box">
                            <QRCodeSVG value={selectedPlayerForDetails.playerId || selectedPlayerForDetails.id} size={68} bgColor="#ffffff" fgColor="#000000" level="H" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="divider w-full" />
                
                {/* Secondary QR verification view */}
                <div className="flex flex-col items-center gap-xs text-center w-full bg-secondary p-sm rounded-md" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--admin-border)', padding: '12px' }}>
                  <div className="bg-white p-xs rounded-md" style={{ display: 'inline-block', background: '#fff', padding: '8px' }}>
                    <QRCodeSVG value={selectedPlayerForDetails.playerId || selectedPlayerForDetails.id} size={110} />
                  </div>
                  <span className="text-xs text-muted mt-xs">Verify Pass QR: {selectedPlayerForDetails.playerId || selectedPlayerForDetails.id}</span>
                </div>
              </div>

              {/* Right Column: Full Profile & Tournament Details */}
              <div className="flex flex-col gap-md">
                
                {/* Section: Registration Information */}
                <div>
                  <h4 className="text-xs font-bold text-gradient-gold uppercase tracking-wider mb-sm" style={{ borderBottom: '1px solid var(--admin-border)', paddingBottom: '4px' }}>Registration Profile</h4>
                  
                  <div className="grid grid-2 gap-sm text-sm" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    
                    <div className="p-xs rounded-md" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--admin-border)', padding: '8px 12px' }}>
                      <span className="text-xs text-muted block mb-xxs">Full Name</span>
                      <strong className="text-gold">{selectedPlayerForDetails.fullName}</strong>
                    </div>

                    <div className="p-xs rounded-md" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--admin-border)', padding: '8px 12px' }}>
                      <span className="text-xs text-muted block mb-xxs">Player ID</span>
                      <strong>{selectedPlayerForDetails.playerId || selectedPlayerForDetails.id}</strong>
                    </div>

                    <div className="p-xs rounded-md" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--admin-border)', padding: '8px 12px', gridColumn: 'span 2' }}>
                      <span className="text-xs text-muted block mb-xxs">Email Address</span>
                      <span>{selectedPlayerForDetails.email}</span>
                    </div>

                    <div className="p-xs rounded-md" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--admin-border)', padding: '8px 12px' }}>
                      <span className="text-xs text-muted block mb-xxs">CricHeroes Regis No.</span>
                      <span>{selectedPlayerForDetails.cricHeroesRegNo || selectedPlayerForDetails.mobile || 'N/A'}</span>
                    </div>

                    <div className="p-xs rounded-md" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--admin-border)', padding: '8px 12px' }}>
                      <span className="text-xs text-muted block mb-xxs">Instagram ID</span>
                      {selectedPlayerForDetails.instagramId ? (
                        <a 
                          href={`https://instagram.com/${selectedPlayerForDetails.instagramId}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue"
                          style={{ color: '#60a5fa', textDecoration: 'underline' }}
                        >
                          @{selectedPlayerForDetails.instagramId}
                        </a>
                      ) : (
                        <span>N/A</span>
                      )}
                    </div>

                    <div className="p-xs rounded-md" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--admin-border)', padding: '8px 12px' }}>
                      <span className="text-xs text-muted block mb-xxs">Date of Birth</span>
                      <span>{selectedPlayerForDetails.dob || 'N/A'}</span>
                    </div>

                    <div className="p-xs rounded-md" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--admin-border)', padding: '8px 12px' }}>
                      <span className="text-xs text-muted block mb-xxs">Blood Group</span>
                      <span>{selectedPlayerForDetails.bloodGroup || 'N/A'}</span>
                    </div>

                    <div className="p-xs rounded-md" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--admin-border)', padding: '8px 12px', gridColumn: 'span 2' }}>
                      <span className="text-xs text-muted block mb-xxs">Emergency Contact</span>
                      <span>
                        {selectedPlayerForDetails.emergencyContactName 
                          ? `${selectedPlayerForDetails.emergencyContactName} (${selectedPlayerForDetails.emergencyContactMobile})` 
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section: Kit & Team Details */}
                <div>
                  <h4 className="text-xs font-bold text-gradient-gold uppercase tracking-wider mb-sm" style={{ borderBottom: '1px solid var(--admin-border)', paddingBottom: '4px' }}>Kit & Playing Style</h4>
                  
                  <div className="grid grid-3 gap-sm text-sm" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                    <div className="p-xs rounded-md text-center" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--admin-border)', padding: '8px' }}>
                      <span className="text-xs text-muted block mb-xxs">T-Shirt</span>
                      <strong>{selectedPlayerForDetails.tshirtSize || 'N/A'}</strong>
                    </div>
                    <div className="p-xs rounded-md text-center" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--admin-border)', padding: '8px' }}>
                      <span className="text-xs text-muted block mb-xxs">Track Pant</span>
                      <strong>{selectedPlayerForDetails.trackPantSize || 'N/A'}</strong>
                    </div>
                    <div className="p-xs rounded-md text-center" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--admin-border)', padding: '8px' }}>
                      <span className="text-xs text-muted block mb-xxs">Sleeve Type</span>
                      <strong>{selectedPlayerForDetails.sleeveType || 'N/A'}</strong>
                    </div>
                  </div>

                  <div className="grid grid-2 gap-sm text-sm" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '10px' }}>
                    <div className="p-xs rounded-md text-center" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--admin-border)', padding: '8px' }}>
                      <span className="text-xs text-muted block mb-xxs">Jersey Number</span>
                      <strong>#{selectedPlayerForDetails.jerseyNumber || 'N/A'}</strong>
                    </div>
                    <div className="p-xs rounded-md text-center" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--admin-border)', padding: '8px' }}>
                      <span className="text-xs text-muted block mb-xxs">Name on Jersey</span>
                      <strong>{selectedPlayerForDetails.nameOnJersey || 'N/A'}</strong>
                    </div>
                  </div>
                </div>

                {/* Section: MCA Registration */}
                <div>
                  <h4 className="text-xs font-bold text-gradient-gold uppercase tracking-wider mb-sm" style={{ borderBottom: '1px solid var(--admin-border)', paddingBottom: '4px' }}>MCA Card Verification</h4>
                  
                  <div className="p-xs rounded-md flex flex-col gap-xs" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--admin-border)', padding: '12px' }}>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">MCA Registered:</span>
                      <strong>{selectedPlayerForDetails.mcaPlayer ? 'Yes' : 'No'}</strong>
                    </div>
                    
                    {selectedPlayerForDetails.mcaPlayer && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted">MCA ID Number:</span>
                          <strong>{selectedPlayerForDetails.mcaIdNumber || 'N/A'}</strong>
                        </div>
                        {selectedPlayerForDetails.mcaCardURL && (
                          <div className="mt-xs">
                            <span className="text-xs text-muted block mb-xs">Card Attachment Preview:</span>
                            <a href={selectedPlayerForDetails.mcaCardURL} target="_blank" rel="noreferrer" style={{ display: 'inline-block' }}>
                              <img 
                                src={selectedPlayerForDetails.mcaCardURL} 
                                alt="MCA Card" 
                                style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--admin-border)' }} 
                              />
                            </a>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Section: Joined Tournaments Roster */}
                <div>
                  <h4 className="text-xs font-bold text-gradient-gold uppercase tracking-wider mb-sm" style={{ borderBottom: '1px solid var(--admin-border)', paddingBottom: '4px' }}>Joined Tournaments & Matches</h4>
                  
                  <div className="flex flex-col gap-sm">
                    {selectedPlayerForDetails.joinedTournaments && selectedPlayerForDetails.joinedTournaments.length > 0 ? (
                      selectedPlayerForDetails.joinedTournaments.map((t, idx) => {
                        const tName = typeof t === 'string' ? t : t.name || t.id;
                        const tId = typeof t === 'string' ? t : t.id;
                        const teamName = t.teamName || 'N/A';
                        const roleLabel = t.role ? t.role.charAt(0).toUpperCase() + t.role.slice(1) : 'Player';
                        const matchesPlayed = t.matchesPlayed !== undefined ? t.matchesPlayed : 0;
                        
                        return (
                          <div 
                            key={tId || idx} 
                            className="flex flex-col gap-xs p-xs rounded-md" 
                            style={{ 
                              background: 'rgba(128, 0, 0, 0.05)', 
                              border: '1px solid rgba(128, 0, 0, 0.2)', 
                              padding: '10px 14px' 
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-sm truncate" style={{ maxWidth: '240px' }}>{tName}</span>
                              <span className="badge badge-gold" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{matchesPlayed} Matches</span>
                            </div>
                            <div className="flex justify-between items-center text-xs opacity-95 mt-xs">
                              <span>Representing: <strong className="text-gold">{teamName}</strong> ({roleLabel})</span>
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
                                style={{ padding: '2px 8px', fontSize: '0.7rem', borderRadius: '4px', height: 'auto', border: '1px solid var(--admin-accent)' }}
                              >
                                Edit Matches
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-xs text-muted">No active tournament rosters.</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between mt-sm" style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '8px' }}>
                  <span className="opacity-70 text-sm">Status:</span>
                  <span className="text-green text-sm font-bold">{selectedPlayerForDetails.status}</span>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}
      {selectedCaptainForDetails && (
        <div className="modal-overlay" onClick={() => setSelectedCaptainForDetails(null)}>
          <div 
            className="modal-content card card-gold animate-scale-in" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: '850px', 
              width: '95%',
              padding: 'var(--space-xl)', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              border: '1px solid var(--admin-border)',
              background: 'var(--admin-card-bg)',
              color: 'var(--admin-text)'
            }}
          >
            <button className="modal-close" onClick={() => setSelectedCaptainForDetails(null)}>✕</button>
            
            <div className="flex justify-between items-center mb-lg pb-sm" style={{ borderBottom: '1px solid var(--admin-border)', paddingRight: '40px' }}>
              <h3 className="text-lg font-bold text-gradient-gold">Captain Profile Details & Pass</h3>
              <button 
                onClick={async () => {
                  try {
                    await downloadIDCardPDF('admin-captain-card-render', `${selectedCaptainForDetails.captainId || selectedCaptainForDetails.id}.pdf`);
                  } catch (e) {
                    console.error("PDF download failed:", e);
                    alert("Failed to generate PDF pass");
                  }
                }}
                className="btn btn-gold btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <Download size={14} /> Download ID Card
              </button>
            </div>
            
            <div className="player-details-grid">
              
              {/* Left Column: ID Card Render & Main Actions */}
              <div className="flex flex-col items-center gap-md">
                
                {/* ID Card Wrapper */}
                <div className="card-render-wrapper">
                  <div className="id-card-element" id="admin-captain-card-render" style={{ margin: '0 auto' }}>
                    <div className="id-card-gold-accent" />
                    <div className="id-card-inner">
                      {/* LEFT: Photo */}
                      <div className="id-card-left">
                        <div className="id-player-photo">
                          {selectedCaptainForDetails.photoURL ? (
                            <img src={selectedCaptainForDetails.photoURL} alt={selectedCaptainForDetails.fullName} />
                          ) : (
                            <User size={36} />
                          )}
                        </div>
                        {/* Jersey number badge */}
                        <div style={{
                          background: 'rgba(212,175,55,0.15)',
                          border: '1px solid rgba(212,175,55,0.3)',
                          borderRadius: '6px',
                          padding: '2px 10px',
                          textAlign: 'center',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}>
                          <div style={{ fontSize: '0.45rem', color: 'rgba(212,175,55,0.7)', letterSpacing: '0.1em', fontWeight: 700 }}>ROLE</div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d4af37', lineHeight: 1.1 }}>
                            CAPT
                          </div>
                        </div>
                      </div>

                      {/* DIVIDER */}
                      <div className="id-card-divider" />

                      {/* RIGHT: Info */}
                      <div className="id-card-right">
                        {/* Header */}
                        <div className="id-card-header">
                          <div className="id-card-logo">
                            <img src="/logos/trivabsports.webp" className="id-card-brand-logo" alt="TRIVAB SPORTS" />
                          </div>
                          <div className="id-card-badge">VERIFIED PASS</div>
                        </div>

                        {/* Name & Style */}
                        <div>
                          <h3 className="id-player-name">{selectedCaptainForDetails.fullName}</h3>
                          <span className="id-player-style">Team Captain</span>
                        </div>

                        {/* Footer: ID & QR */}
                        <div className="id-card-footer">
                          <div className="id-code-group">
                            <span className="id-stat-lbl">Captain ID</span>
                            <span className="id-code-text">{selectedCaptainForDetails.captainId || selectedCaptainForDetails.id}</span>
                          </div>
                          <div className="id-qr-box">
                            <QRCodeSVG value={selectedCaptainForDetails.captainId || selectedCaptainForDetails.id} size={68} bgColor="#ffffff" fgColor="#000000" level="H" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="divider w-full" />
                
                {/* Secondary QR verification view */}
                <div className="flex flex-col items-center gap-xs text-center w-full bg-secondary p-sm rounded-md" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--admin-border)', padding: '12px' }}>
                  <div className="bg-white p-xs rounded-md" style={{ display: 'inline-block', background: '#fff', padding: '8px' }}>
                    <QRCodeSVG value={selectedCaptainForDetails.captainId || selectedCaptainForDetails.id} size={110} />
                  </div>
                  <span className="text-xs text-muted mt-xs">Verify Pass QR: {selectedCaptainForDetails.captainId || selectedCaptainForDetails.id}</span>
                </div>
              </div>

              {/* Right Column: Full Profile */}
              <div className="flex flex-col gap-md">
                
                <div>
                  <h4 className="text-xs font-bold text-gradient-gold uppercase tracking-wider mb-sm" style={{ borderBottom: '1px solid var(--admin-border)', paddingBottom: '4px' }}>Captain Profile</h4>
                  
                  <div className="flex flex-col gap-sm text-sm">
                    <div className="p-xs rounded-md" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--admin-border)', padding: '8px 12px' }}>
                      <span className="text-xs text-muted block mb-xxs">Full Name</span>
                      <strong className="text-gold">{selectedCaptainForDetails.fullName}</strong>
                    </div>

                    <div className="p-xs rounded-md" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--admin-border)', padding: '8px 12px' }}>
                      <span className="text-xs text-muted block mb-xxs">Captain ID</span>
                      <strong>{selectedCaptainForDetails.captainId || selectedCaptainForDetails.id}</strong>
                    </div>

                    <div className="p-xs rounded-md" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--admin-border)', padding: '8px 12px' }}>
                      <span className="text-xs text-muted block mb-xxs">Email Address</span>
                      <span>{selectedCaptainForDetails.email}</span>
                    </div>

                    <div className="p-xs rounded-md" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--admin-border)', padding: '8px 12px' }}>
                      <span className="text-xs text-muted block mb-xxs">Mobile Number</span>
                      <span>{selectedCaptainForDetails.mobile || 'N/A'}</span>
                    </div>

                    <div className="p-xs rounded-md" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--admin-border)', padding: '8px 12px' }}>
                      <span className="text-xs text-muted block mb-xxs">Managed Team</span>
                      <strong className="text-gold">{selectedCaptainForDetails.teamName || 'Unassigned'}</strong>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
