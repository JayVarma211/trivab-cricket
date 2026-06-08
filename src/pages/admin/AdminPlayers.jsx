import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCollection, setDocument, updateDocument, deleteDocument } from '../../firebase/firestore';
import { uploadImageToCloudinary } from '../../services/cloudinary';
import { Users, Trash2, Plus, AlertCircle, Search, Edit2, Upload, Eye } from 'lucide-react';
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

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    teamId: '',
    teamName: '',
    playingStyle: 'Batsman',
    jerseyNumber: '',
    photo: null,
  });

  useEffect(() => {
    if (role !== 'admin') navigate('/admin/login');
    fetchData();
  }, [role, navigate]);

  const fetchData = async () => {
    try {
      const playersData = await getCollection('players', []);
      const teamsData = await getCollection('teams', []);
      setPlayers(playersData);
      setTeams(teamsData);
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

      if (editingId) {
        const previousPlayer = players.find(p => p.id === editingId);
        const playerData = {
          fullName: formData.fullName,
          email: formData.email,
          mobile: formData.mobile,
          teamId: formData.teamId,
          teamName: formData.teamName,
          playingStyle: formData.playingStyle,
          jerseyNumber: formData.jerseyNumber,
          photoURL: photoURL || formData.photoURL || '',
          status: 'Active',
          playerId: previousPlayer?.playerId || editingId
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
        const playerData = {
          playerId: generatedId,
          fullName: formData.fullName,
          email: formData.email,
          mobile: formData.mobile,
          teamId: formData.teamId,
          teamName: formData.teamName,
          playingStyle: formData.playingStyle,
          jerseyNumber: formData.jerseyNumber,
          photoURL: photoURL || '',
          status: 'Active',
          createdAt: new Date().toISOString()
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

  const handleEdit = (player) => {
    setFormData({
      fullName: player.fullName,
      email: player.email,
      mobile: player.mobile,
      teamId: player.teamId,
      teamName: player.teamName,
      playingStyle: player.playingStyle,
      jerseyNumber: player.jerseyNumber,
      photoURL: player.photoURL,
      photo: null,
    });
    setEditingId(player.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      mobile: '',
      teamId: '',
      teamName: '',
      playingStyle: 'Batsman',
      jerseyNumber: '',
      photo: null,
    });
  };

  const filteredPlayers = players.filter(p =>
    p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.teamName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="container section-padding"><p>Loading...</p></div>;

  return (
    <div className="admin-page container section-padding">
      <div className="page-header flex justify-between items-center mb-xl">
        <div>
          <h1 className="display-sm text-gradient-gold">Player Management</h1>
          <p className="text-secondary">Total Players: {players.length}</p>
        </div>
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
            {editingId ? 'Edit Player' : 'Add New Player'}
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-2 gap-md">
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
              <label className="form-label">Mobile</label>
              <input
                type="tel"
                name="mobile"
                className="form-input"
                required
                value={formData.mobile}
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
          placeholder="Search by name, email, or team..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="table-responsive card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Player Name</th>
              <th>Email</th>
              <th>Team</th>
              <th>Position</th>
              <th>Jersey</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map(player => (
              <tr key={player.id}>
                <td className="font-semi">{player.fullName}</td>
                <td>{player.email}</td>
                <td className="text-gold font-semi">{player.teamName}</td>
                <td><span className="badge badge-gold">{player.playingStyle}</span></td>
                <td>#{player.jerseyNumber}</td>
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
            ))}
          </tbody>
        </table>
      </div>

      {selectedPlayerForDetails && (
        <div className="modal-overlay" onClick={() => setSelectedPlayerForDetails(null)}>
          <div className="modal-content card card-gold" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', padding: 'var(--space-xl)' }}>
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
              
              <div className="w-full text-sm text-left flex flex-col gap-xs" style={{ color: 'var(--admin-text)' }}>
                <div className="flex justify-between"><span className="opacity-70">Player ID:</span><strong>{selectedPlayerForDetails.playerId || selectedPlayerForDetails.id}</strong></div>
                <div className="flex justify-between"><span className="opacity-70">Email:</span><span>{selectedPlayerForDetails.email}</span></div>
                <div className="flex justify-between"><span className="opacity-70">Mobile:</span><span>{selectedPlayerForDetails.mobile}</span></div>
                <div className="flex justify-between"><span className="opacity-70">Team Name:</span><strong className="text-gold">{selectedPlayerForDetails.teamName || 'Free Agent'}</strong></div>
                <div className="flex justify-between"><span className="opacity-70">Jersey No:</span><span>#{selectedPlayerForDetails.jerseyNumber || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="opacity-70">Status:</span><span className="text-green">{selectedPlayerForDetails.status}</span></div>
              </div>
              
              <div className="divider" />
              
              <div className="qr-container bg-white p-sm rounded-md" style={{ display: 'inline-block', padding: '12px', background: '#fff', borderRadius: '8px' }}>
                <QRCodeSVG value={selectedPlayerForDetails.playerId || selectedPlayerForDetails.id} size={220} />
              </div>
              <p className="text-xs text-secondary opacity-60">Verified Player QR Code Pass</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
