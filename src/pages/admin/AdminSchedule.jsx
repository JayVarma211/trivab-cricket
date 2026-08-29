import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCollection, addDocument, setDocument, deleteDocument } from '../../firebase/firestore';
import { orderBy } from '../../firebase/firestore';
import {
  Plus, Edit2, Trash2, X, CheckCircle2, AlertCircle,
  CalendarClock, MapPin, Clock, Users, Tag, Info
} from 'lucide-react';
import './Admin.css';

const SCHEDULE_TYPES = ['Practice', 'Match', 'Meeting', 'Event', 'Training', 'Selection Trial'];
const STATUS_OPTIONS = ['Upcoming', 'Completed', 'Cancelled'];

const EMPTY_FORM = {
  title: '',
  type: 'Practice',
  date: '',
  time: '',
  venue: '',
  description: '',
  targetTeamName: 'All Teams',
  status: 'Upcoming',
};

const TYPE_COLORS = {
  Practice: '#3B82F6',
  Match: '#EF4444',
  Meeting: '#F59E0B',
  Event: '#8B5CF6',
  Training: '#10B981',
  'Selection Trial': '#EC4899',
};

const STATUS_STYLES = {
  Upcoming: { background: 'rgba(59,130,246,0.15)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.3)' },
  Completed: { background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.3)' },
  Cancelled: { background: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)' },
};

function formatDisplayDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminSchedule() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    if (role !== 'admin') navigate('/admin/login');
  }, [role, navigate]);

  const fetchSchedules = async () => {
    try {
      const data = await getCollection('schedules', [orderBy('date', 'asc')]);
      setSchedules(data || []);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchedules(); }, []);

  const openAddForm = () => {
    setEditingId(null);
    setFormData({ ...EMPTY_FORM, date: new Date().toISOString().split('T')[0] });
    setShowForm(true);
    setMessage({ type: '', text: '' });
  };

  const openEditForm = (schedule) => {
    setEditingId(schedule.id);
    setFormData({
      title: schedule.title || '',
      type: schedule.type || 'Practice',
      date: schedule.date || '',
      time: schedule.time || '',
      venue: schedule.venue || '',
      description: schedule.description || '',
      targetTeamName: schedule.targetTeamName || 'All Teams',
      status: schedule.status || 'Upcoming',
    });
    setShowForm(true);
    setMessage({ type: '', text: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = { ...formData };
      if (editingId) {
        await setDocument('schedules', editingId, payload);
        setMessage({ type: 'success', text: 'Schedule updated successfully!' });
      } else {
        await addDocument('schedules', payload);
        setMessage({ type: 'success', text: 'Schedule created successfully!' });
      }
      await fetchSchedules();
      setShowForm(false);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this schedule entry? This cannot be undone.')) return;
    try {
      await deleteDocument('schedules', id);
      setSchedules(prev => prev.filter(s => s.id !== id));
      setMessage({ type: 'success', text: 'Schedule entry deleted.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Error deleting schedule entry.' });
    }
  };

  const handleField = (field, value) => setFormData(p => ({ ...p, [field]: value }));

  const filteredSchedules = filterStatus === 'All'
    ? schedules
    : schedules.filter(s => s.status === filterStatus);

  return (
    <div className="admin-page container section-padding">

      {/* ── Header ── */}
      <div className="page-header mb-xl" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <h1 className="display-sm text-gradient-gold">Captain Schedule</h1>
          <p className="text-secondary">Create and manage schedules visible to all captains.</p>
        </div>
        <button className="btn btn-gold" onClick={openAddForm} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> New Schedule
        </button>
      </div>

      {/* ── Message ── */}
      {message.text && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-xl`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ── Stats Bar ── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: 'var(--space-xl)' }}>
        {['All', 'Upcoming', 'Completed', 'Cancelled'].map(status => {
          const count = status === 'All' ? schedules.length : schedules.filter(s => s.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '6px 18px',
                borderRadius: '999px',
                border: filterStatus === status ? '1px solid var(--gold)' : '1px solid var(--admin-border)',
                background: filterStatus === status ? 'rgba(128,0,0,0.2)' : 'transparent',
                color: filterStatus === status ? 'var(--gold)' : 'var(--admin-muted)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              {status} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Add/Edit Modal ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)' }}>
          <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: 'var(--space-2xl)', width: '100%', maxWidth: '660px', maxHeight: '92vh', overflowY: 'auto', position: 'relative' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
              <h2 style={{ color: 'var(--admin-text)', margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                {editingId ? '✏️ Edit Schedule' : '📅 New Schedule Entry'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--admin-text)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>

              {/* Title */}
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Morning Practice Session"
                  required
                  value={formData.title}
                  onChange={e => handleField('title', e.target.value)}
                />
              </div>

              {/* Type + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                <div className="form-group">
                  <label className="form-label">Type *</label>
                  <select className="form-select" value={formData.type} onChange={e => handleField('type', e.target.value)}>
                    {SCHEDULE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={formData.status} onChange={e => handleField('status', e.target.value)}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Date + Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input className="form-input" type="date" required value={formData.date} onChange={e => handleField('date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input className="form-input" type="time" value={formData.time} onChange={e => handleField('time', e.target.value)} />
                </div>
              </div>

              {/* Venue */}
              <div className="form-group">
                <label className="form-label">Venue / Location</label>
                <input className="form-input" type="text" placeholder="e.g. Kandivali Ground, Mumbai" value={formData.venue} onChange={e => handleField('venue', e.target.value)} />
              </div>

              {/* Target */}
              <div className="form-group">
                <label className="form-label">Target Audience</label>
                <input className="form-input" type="text" placeholder="e.g. All Teams, Team A only..." value={formData.targetTeamName} onChange={e => handleField('targetTeamName', e.target.value)} />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description / Notes</label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Any additional details about this schedule..."
                  style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                  value={formData.description}
                  onChange={e => handleField('description', e.target.value)}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-gold" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Schedule' : 'Create Schedule'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── Schedule List ── */}
      <div className="admin-section">
        <h3 className="section-title">
          All Schedules ({filteredSchedules.length}{filterStatus !== 'All' ? ` ${filterStatus}` : ''})
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-4xl)', color: 'var(--admin-muted)' }}>
            <CalendarClock size={40} style={{ opacity: 0.3 }} />
            <p>Loading schedules...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-4xl)', color: 'var(--admin-muted)', border: '1px dashed var(--admin-border)', borderRadius: '12px' }}>
            <CalendarClock size={48} style={{ opacity: 0.25, marginBottom: 'var(--space-md)' }} />
            <p style={{ margin: 0 }}>
              {filterStatus === 'All'
                ? 'No schedules yet. Click New Schedule to get started.'
                : `No ${filterStatus.toLowerCase()} schedules.`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredSchedules.map(schedule => (
              <div
                key={schedule.id}
                style={{
                  background: 'var(--admin-card-bg)',
                  border: '1px solid var(--admin-border)',
                  borderLeft: `4px solid ${TYPE_COLORS[schedule.type] || '#800000'}`,
                  borderRadius: '12px',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  flexWrap: 'wrap',
                }}
              >
                {/* Date block */}
                <div style={{ textAlign: 'center', minWidth: '64px', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--admin-text)', lineHeight: 1 }}>
                    {schedule.date ? new Date(schedule.date + 'T00:00:00').getDate() : '—'}
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {schedule.date ? new Date(schedule.date + 'T00:00:00').toLocaleString('en-IN', { month: 'short' }) : ''}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--admin-muted)' }}>
                    {schedule.date ? new Date(schedule.date + 'T00:00:00').getFullYear() : ''}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ width: '1px', height: '56px', background: 'var(--admin-border)', flexShrink: 0 }} />

                {/* Main info */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ background: TYPE_COLORS[schedule.type] + '22', color: TYPE_COLORS[schedule.type], border: `1px solid ${TYPE_COLORS[schedule.type]}44`, borderRadius: '6px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
                      {schedule.type}
                    </span>
                    <span style={{ ...STATUS_STYLES[schedule.status], borderRadius: '6px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
                      {schedule.status}
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: 'var(--admin-text)' }}>
                    {schedule.title}
                  </h4>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {schedule.time && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--admin-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {schedule.time}
                      </span>
                    )}
                    {schedule.venue && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--admin-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} /> {schedule.venue}
                      </span>
                    )}
                    {schedule.targetTeamName && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--admin-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={12} /> {schedule.targetTeamName}
                      </span>
                    )}
                  </div>
                  {schedule.description && (
                    <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'var(--admin-muted)', lineHeight: 1.5 }}>
                      {schedule.description.slice(0, 100)}{schedule.description.length > 100 ? '...' : ''}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button className="btn-table-action" title="Edit" onClick={() => openEditForm(schedule)} style={{ color: 'var(--admin-accent)' }}>
                    <Edit2 size={16} />
                  </button>
                  <button className="btn-table-action" title="Delete" onClick={() => handleDelete(schedule.id)} style={{ color: '#ef4444' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
