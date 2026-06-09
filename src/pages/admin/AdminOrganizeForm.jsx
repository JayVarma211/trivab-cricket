import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDocument, setDocument } from '../../firebase/firestore';
import { ClipboardList, Save, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import Loader from '../../components/common/Loader';
import './Admin.css';

export default function AdminOrganizeForm() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    formTitle: 'Booking & Inquiry Form',
    formSubtitle: 'Fill out details about your tournament plans and our representative will call you back with estimates.',
    types: 'Corporate Cup, Turf Championship, T20 League, Box Cricket Tournament, Monsoon Cup',
    teamsOptions: '4-6, 8, 12, 16, 20+',
    requestPlaceholder: 'Describe turf choices, custom kit sizing, schedule times, or umpire details...'
  });

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/admin/login');
      return;
    }

    const fetchConfig = async () => {
      try {
        const config = await getDocument('settings', 'organizeForm');
        if (config) {
          setFormData({
            formTitle: config.formTitle || 'Booking & Inquiry Form',
            formSubtitle: config.formSubtitle || 'Fill out details about your tournament plans and our representative will call you back with estimates.',
            types: config.types || 'Corporate Cup, Turf Championship, T20 League, Box Cricket Tournament, Monsoon Cup',
            teamsOptions: config.teamsOptions || '4-6, 8, 12, 16, 20+',
            requestPlaceholder: config.requestPlaceholder || 'Describe turf choices, custom kit sizing, schedule times, or umpire details...'
          });
        }
      } catch (err) {
        console.error('Error loading form settings:', err);
        setError('Failed to load form settings from database.');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [role, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await setDocument('settings', 'organizeForm', formData);
      setSuccess('Organize page form configuration updated successfully!');
    } catch (err) {
      console.error('Error saving form settings:', err);
      setError(err.message || 'Failed to update form settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container section-padding"><Loader /></div>;

  return (
    <div className="admin-page container section-padding">
      <div className="page-header mb-xl">
        <h1 className="display-sm text-gradient-gold">Organize Form Settings</h1>
        <p className="text-secondary">Configure the public inquiry form fields and drop-down selections on the Organize page.</p>
      </div>

      {error && (
        <div className="alert alert-error mb-lg">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-info flex gap-sm items-center mb-lg" style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#22c55e' }}>
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-2 gap-xl items-start">
        {/* Editor Form */}
        <div className="card border-top-gold p-lg">
          <h2 className="text-lg font-bold mb-md text-gradient-gold flex items-center gap-sm">
            <ClipboardList size={20} /> Form Fields Configuration
          </h2>

          <form onSubmit={handleSave} className="flex flex-col gap-md">
            <div className="form-group">
              <label className="form-label">Form Title</label>
              <input
                type="text"
                name="formTitle"
                className="form-input"
                required
                value={formData.formTitle}
                onChange={handleInputChange}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Form Subtitle / Instructions</label>
              <textarea
                name="formSubtitle"
                className="form-input"
                rows="2"
                required
                value={formData.formSubtitle}
                onChange={handleInputChange}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tournament Types (Comma-separated)</label>
              <input
                type="text"
                name="types"
                className="form-input"
                required
                placeholder="e.g. Corporate Cup, Turf Championship"
                value={formData.types}
                onChange={handleInputChange}
                disabled={saving}
              />
              <span className="text-xs text-muted mt-xs">Provide a comma-separated list of tournament categories.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Expected Team Count Options (Comma-separated)</label>
              <input
                type="text"
                name="teamsOptions"
                className="form-input"
                required
                placeholder="e.g. 4-6, 8, 12, 16, 20+"
                value={formData.teamsOptions}
                onChange={handleInputChange}
                disabled={saving}
              />
              <span className="text-xs text-muted mt-xs">Provide expected team choices for the dropdown.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Special Requests / Requirements Placeholder</label>
              <textarea
                name="requestPlaceholder"
                className="form-input"
                rows="2"
                required
                value={formData.requestPlaceholder}
                onChange={handleInputChange}
                disabled={saving}
              />
            </div>

            <button type="submit" className="btn btn-gold w-full mt-sm" disabled={saving}>
              <Save size={18} /> {saving ? 'Saving Changes...' : 'Save Form Configuration'}
            </button>
          </form>
        </div>

        {/* Live Preview Panel */}
        <div className="card p-lg" style={{ background: 'rgba(255, 255, 255, 0.01)', borderStyle: 'dashed' }}>
          <h2 className="text-lg font-bold mb-md text-gradient-gold flex items-center gap-sm">
            <Eye size={20} /> Live Form Preview
          </h2>
          <p className="text-xs text-muted mb-lg">This is how the booking card will render on the public /organize page.</p>

          <div className="card p-lg border-top-gold" style={{ background: 'var(--bg-card)', pointerEvents: 'none', opacity: 0.85 }}>
            <h3 className="text-md font-bold text-gradient-gold mb-sm">{formData.formTitle}</h3>
            <p className="text-xs text-secondary mb-md">{formData.formSubtitle}</p>

            <div className="flex flex-col gap-sm">
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Contact Person Name *</label>
                <input type="text" className="form-input" placeholder="e.g. John Doe" readOnly />
              </div>

              <div className="grid grid-2 gap-sm">
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Business Email *</label>
                  <input type="text" className="form-input" placeholder="e.g. john@company.com" readOnly />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Mobile Phone *</label>
                  <input type="text" className="form-input" placeholder="10 digit number" readOnly />
                </div>
              </div>

              <div className="grid grid-2 gap-sm">
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Tournament Type</label>
                  <select className="form-select" readOnly>
                    {formData.types.split(',').map((t, idx) => (
                      <option key={idx}>{t.trim()}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Expected Teams</label>
                  <select className="form-select" readOnly>
                    {formData.teamsOptions.split(',').map((o, idx) => (
                      <option key={idx}>{o.trim()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Special Requests / Requirements</label>
                <textarea className="form-input" rows="2" placeholder={formData.requestPlaceholder} readOnly />
              </div>

              <button className="btn btn-gold w-full mt-xs" style={{ fontSize: '0.8rem', padding: '10px' }}>
                Submit Inquiry / Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
