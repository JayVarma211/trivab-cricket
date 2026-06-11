import { useState, useEffect } from 'react';
import { getCollection, addDocument, setDocument, deleteDocument } from '../../firebase/firestore';
import { Plus, Edit2, Trash2, X, CheckCircle2, AlertCircle, Newspaper, Calendar, Tag } from 'lucide-react';
import './Admin.css';

const TAG_OPTIONS = ['Announcement', 'Tournament', 'Match Result', 'Sponsorship', 'General'];

export default function AdminNews() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', date: '', tag: 'Announcement', imageURL: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchArticles = async () => {
    try {
      const data = await getCollection('news_events');
      const sorted = (data || []).sort((a, b) => new Date(b.date) - new Date(a.date));
      setArticles(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArticles(); }, []);

  const openAddForm = () => {
    setEditingId(null);
    setFormData({ title: '', content: '', date: new Date().toISOString().split('T')[0], tag: 'Announcement', imageURL: '' });
    setShowForm(true);
    setMessage({ type: '', text: '' });
  };

  const openEditForm = (article) => {
    setEditingId(article.id);
    setFormData({ title: article.title || '', content: article.content || '', date: article.date || '', tag: article.tag || 'Announcement', imageURL: article.imageURL || '' });
    setShowForm(true);
    setMessage({ type: '', text: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = { ...formData, updatedAt: new Date().toISOString() };
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
                <label className="form-label">Image URL <span style={{ color: 'var(--admin-muted)', fontWeight: 400 }}>(optional)</span></label>
                <input
                  className="form-input"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.imageURL}
                  onChange={e => setFormData(p => ({ ...p, imageURL: e.target.value }))}
                />
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
        <h3 className="section-title">Published Articles ({articles.length})</h3>

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
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map(article => (
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
