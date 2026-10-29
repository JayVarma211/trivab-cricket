import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCollection, addDocument, setDocument, deleteDocument } from '../../firebase/firestore';
import { Plus, Edit2, Trash2, X, CheckCircle2, AlertCircle, Newspaper, Calendar, Tag, Upload, Trophy } from 'lucide-react';
import uploadImageToCloudinary from '../../services/cloudinary';
import './Admin.css';

const TAG_OPTIONS = ['Announcement', 'Tournament', 'Match Result', 'Sponsorship', 'General'];

export default function AdminNews() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const [articles, setArticles] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [tournamentFilter, setTournamentFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', date: '', tag: 'Announcement', tournamentId: 'all', tournamentName: 'All Tournaments', imageURL: '' });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (role !== 'admin') navigate('/admin/login');
  }, [role, navigate]);

  const fetchArticles = async () => {
    try {
      const [newsData, tournData] = await Promise.all([
        getCollection('news_events'),
        getCollection('tournaments').catch(() => [])
      ]);
      const sorted = (newsData || []).sort((a, b) => new Date(b.date) - new Date(a.date));
      setArticles(sorted);
      const validTourns = (tournData || [])
        .filter(t => t && !t.isDeleted && !t.deleted && t.isActivated !== false && (t.name || t.title)?.trim())
        .filter((t, idx, arr) => arr.findIndex(x => (x.name || x.title || '').trim().toLowerCase() === (t.name || t.title || '').trim().toLowerCase()) === idx)
        .sort((a, b) => (a.name || a.title || '').localeCompare(b.name || b.title || ''));
      setTournaments(validTourns);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArticles(); }, []);

  const openAddForm = () => {
    setEditingId(null);
    setFormData({ title: '', content: '', date: new Date().toISOString().split('T')[0], tag: 'Announcement', tournamentId: 'all', tournamentName: 'All Tournaments', imageURL: '' });
    setShowForm(true);
    setMessage({ type: '', text: '' });
  };

  const openEditForm = (article) => {
    setEditingId(article.id);
    setFormData({ title: article.title || '', content: article.content || '', date: article.date || '', tag: article.tag || 'Announcement', tournamentId: article.tournamentId || 'all', tournamentName: article.tournamentName || 'All Tournaments', imageURL: article.imageURL || '' });
    setShowForm(true);
    setMessage({ type: '', text: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const selectedTourn = tournaments.find(t => t.id === formData.tournamentId);
      const tournName = (formData.tournamentId === 'all' || !formData.tournamentId)
        ? 'All Tournaments'
        : (selectedTourn?.name || formData.tournamentName || 'Tournament');

      const payload = {
        ...formData,
        tournamentId: formData.tournamentId || 'all',
        tournamentName: tournName,
        updatedAt: new Date().toISOString()
      };
      if (editingId) {
        await setDocument('news_events', editingId, payload);
        setMessage({ type: 'success', text: 'Article updated successfully!' });
      } else {
        payload.createdAt = new Date().toISOString();
        await addDocument('news_events', payload);
        setMessage({ type: 'success', text: 'Article published successfully!' });
      }
      await fetchArticles();
      setShowForm(false);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save article: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this news article? This cannot be undone.')) return;
    try {
      await deleteDocument('news_events', id);
      setArticles(prev => prev.filter(a => a.id !== id));
      setMessage({ type: 'success', text: 'Article deleted.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Error deleting article.' });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setFormData(prev => ({ ...prev, imageURL: url }));
      alert('Image uploaded successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="admin-page container section-padding">
      {/* Header */}
      <div className="page-header mb-xl" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <h1 className="display-sm text-gradient-gold">News &amp; Events</h1>
          <p className="text-secondary">Publish and manage news articles visible to all website visitors.</p>
        </div>
        <button className="btn btn-gold" onClick={openAddForm} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> New Article
        </button>
      </div>

      {/* Global Message */}
      {message.text && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-xl`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-lg)',
        }}>
          <div style={{
            background: 'var(--admin-card-bg)',
            border: '1px solid var(--admin-border)',
            borderRadius: '16px',
            padding: 'var(--space-2xl)',
            width: '100%',
            maxWidth: '620px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
              <h2 style={{ color: 'var(--admin-text)', margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                {editingId ? 'Edit Article' : 'Publish New Article'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--admin-text)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              <div className="form-group">
                <label className="form-label">Article Title *</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Enter news headline..."
                  required
                  value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    className="form-input"
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category Tag</label>
                  <select className="form-select" value={formData.tag} onChange={e => setFormData(p => ({ ...p, tag: e.target.value }))}>
                    {TAG_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Target Tournament Selection */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Trophy size={14} style={{ color: 'var(--gold)' }} />
                  <span>SELECT TOURNAMENT *</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--admin-muted)', fontWeight: 400 }}>(Target Audience)</span>
                </label>
                <select
                  className="form-select"
                  value={formData.tournamentId || 'all'}
                  onChange={e => {
                    const tId = e.target.value;
                    const tObj = tournaments.find(t => t.id === tId);
                    setFormData(p => ({
                      ...p,
                      tournamentId: tId,
                      tournamentName: tId === 'all' ? 'All Tournaments' : (tObj?.name || 'Tournament')
                    }));
                  }}
                >
                  <option value="all">All Tournaments (General / Everyone)</option>
                  {tournaments.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name || t.title}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.74rem', color: 'var(--admin-muted)', marginTop: '4px', display: 'block' }}>
                  {(!formData.tournamentId || formData.tournamentId === 'all')
                    ? 'Visible to all captains, players, and general website visitors.'
                    : `Published specifically for members of ${formData.tournamentName || 'this tournament'}.`}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Content *</label>
                <textarea
                  className="form-input"
                  placeholder="Write the full article content here..."
                  required
                  rows={6}
                  style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                  value={formData.content}
                  onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Image <span style={{ color: 'var(--admin-muted)', fontWeight: 400 }}>(optional)</span></label>
                {formData.imageURL ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                    <img src={formData.imageURL} alt="Preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto' }}
                      onClick={() => setFormData(prev => ({ ...prev, imageURL: '' }))}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage || saving}
                      style={{ display: 'none' }}
                      id="news-image-upload"
                    />
                    <label htmlFor="news-image-upload" className="btn btn-outline btn-sm" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Upload size={16} />
                      {uploadingImage ? 'Uploading...' : 'Upload Image'}
                    </label>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-gold" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Article' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Articles List */}
      <div className="admin-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: 'var(--space-md)' }}>
          <h3 className="section-title" style={{ margin: 0 }}>Published Articles ({articles.length})</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--admin-muted)' }}>Filter Tournament:</label>
            <select
              className="form-select"
              value={tournamentFilter}
              onChange={e => setTournamentFilter(e.target.value)}
              style={{ width: 'auto', padding: '4px 12px', fontSize: '0.8rem', height: '34px' }}
            >
              <option value="All">All Tournaments</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name || t.title}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-4xl)', color: 'var(--admin-muted)' }}>
            <Newspaper size={40} style={{ opacity: 0.3 }} />
            <p>Loading articles...</p>
          </div>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-4xl)', color: 'var(--admin-muted)', border: '1px dashed var(--admin-border)', borderRadius: '12px' }}>
            <Newspaper size={48} style={{ opacity: 0.25, marginBottom: 'var(--space-md)' }} />
            <p style={{ margin: 0 }}>No articles published yet. Click <strong>New Article</strong> to get started.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Target Tournament</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles
                  .filter(article => tournamentFilter === 'All' || article.tournamentId === tournamentFilter || (!article.tournamentId && tournamentFilter === 'all'))
                  .map(article => (
                  <tr key={article.id}>
                    <td>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, color: 'var(--admin-text)' }}>{article.title}</p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--admin-muted)', marginTop: '2px' }}>
                          {article.content?.slice(0, 80)}...
                        </p>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>
                        <Tag size={10} style={{ marginRight: '4px' }} />{article.tag || 'General'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={article.tournamentId && article.tournamentId !== 'all' ? 'badge badge-blue' : 'badge badge-outline'}
                        style={{ fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trophy size={11} />
                        {article.tournamentName || (article.tournamentId && article.tournamentId !== 'all' ? article.tournamentId : 'All Tournaments')}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--admin-muted)', fontSize: '0.85rem' }}>
                        <Calendar size={14} />
                        {article.date ? new Date(article.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-table-action" title="Edit" onClick={() => openEditForm(article)} style={{ color: 'var(--admin-accent)' }}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn-table-action" title="Delete" onClick={() => handleDelete(article.id)} style={{ color: '#ef4444' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
