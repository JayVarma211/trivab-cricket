import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCollection, setDocument, deleteDocument } from '../../firebase/firestore';
import { Trophy, Trash2, Plus, AlertCircle, Edit2, Search, Calendar, Users } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

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
      setTournaments(tournData);
    } catch (err) {
      console.error('Error fetching tournaments:', err);
      setError('Failed to load tournaments');
    } finally {
      setLoading(false);
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
            <div key={t.id} className="admin-tournament-item" style={{
              borderBottom: idx < filteredTournaments.length - 1 ? '1px solid var(--admin-border)' : 'none'
            }}>
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
                  onClick={() => handleEdit(t)}
                  className="btn-table-action"
                  title="Edit"
                  style={{ color: 'var(--admin-gold)' }}
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
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
    </div>
  );
}
