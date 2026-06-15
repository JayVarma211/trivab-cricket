import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCollection, deleteDocument, updateDocument } from '../../firebase/firestore';
import { safeParseDate, safeFormatDate } from '../../utils/dateFormatter';
import { Mail, Trash2, Calendar, User, Search, MessageSquare, AlertCircle } from 'lucide-react';
import './Admin.css';

export default function AdminInquiries() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchInquiries();
  }, [role, navigate]);

  const fetchInquiries = async () => {
    try {
      const data = await getCollection('contact_inquiries');
      // Sort newest first
      const sorted = (data || []).sort((a, b) => safeParseDate(b.createdAt) - safeParseDate(a.createdAt));
      setInquiries(sorted);

      // Mark all unread inquiries as read
      const unread = sorted.filter(inq => inq.read === false);
      for (const inq of unread) {
        try {
          await updateDocument('contact_inquiries', inq.id, { read: true });
        } catch (e) {
          console.warn("Failed to mark inquiry as read:", inq.id, e);
        }
      }
    } catch (err) {
      console.error('Error fetching inquiries:', err);
      setError('Failed to load inquiries.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inquiry?')) return;
    setError('');
    setSuccess('');
    try {
      await deleteDocument('contact_inquiries', id);
      setInquiries(prev => prev.filter(item => item.id !== id));
      setSuccess('Inquiry deleted successfully.');
    } catch (err) {
      setError('Failed to delete inquiry.');
    }
  };

  const filteredInquiries = inquiries.filter(i =>
    i.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="container section-padding"><p>Loading inquiries...</p></div>;

  return (
    <div className="admin-page container section-padding">
      <div className="page-header mb-xl">
        <h1 className="display-sm text-gradient-gold">Contact Inquiries</h1>
        <p className="text-secondary">Total Inquiries Received: {inquiries.length}</p>
      </div>

      {error && (
        <div className="alert alert-error mb-lg">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-lg">
          <span>{success}</span>
        </div>
      )}

      <div className="search-box mb-lg">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search by sender, email, subject, or message..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
        />
      </div>

      {filteredInquiries.length === 0 ? (
        <div className="card text-center py-xl">
          <Mail size={48} className="text-muted mb-md" style={{ margin: '0 auto' }} />
          <p className="text-secondary">No inquiries found.</p>
        </div>
      ) : (
        <div className="grid grid-2 gap-lg">
          {filteredInquiries.map((inq) => (
            <div key={inq.id} className="card card-gold flex flex-col justify-between" style={{ height: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-card)' }}>
              <div>
                <div className="flex justify-between items-start mb-md pb-xs" style={{ borderBottom: '1px solid var(--border-card)' }}>
                  <div>
                    <span className="badge badge-gold mb-xxs" style={{ textTransform: 'none' }}>{inq.subject}</span>
                    <h3 className="text-md font-bold text-primary flex items-center gap-xs mt-xxs">
                      <User size={16} className="text-gold" /> {inq.name}
                    </h3>
                    <a href={`mailto:${inq.email}`} className="text-xs text-gold font-semi block mt-xxs">{inq.email}</a>
                  </div>
                  <span className="text-xs text-muted flex items-center gap-xxs" style={{ whiteSpace: 'nowrap' }}>
                    <Calendar size={12} />
                    {safeFormatDate(inq.createdAt, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="message-content text-sm text-secondary" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, marginBottom: '16px' }}>
                  {inq.message}
                </div>
              </div>

              <div className="flex justify-end pt-sm border-top" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <button
                  onClick={() => handleDelete(inq.id)}
                  className="btn btn-danger btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.75rem', borderRadius: '18px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff' }}
                >
                  <Trash2 size={14} /> Delete Inquiry
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
