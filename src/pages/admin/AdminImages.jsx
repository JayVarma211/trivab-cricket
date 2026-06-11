import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { uploadImageToCloudinary } from '../../services/cloudinary';
import { Upload, AlertCircle, Loader } from 'lucide-react';
import { getCollection, addDocument, deleteDocument } from '../../firebase/firestore';
import './Admin.css';

export default function AdminImages() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [images, setImages] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const data = await getCollection('gallery');
        const sorted = (data || []).sort((a, b) => new Date(b.uploadedAt || b.createdAt) - new Date(a.uploadedAt || a.createdAt));
        setImages(sorted);
      } catch (err) {
        console.error("Failed to load gallery images:", err);
      }
    };
    fetchImages();
  }, []);

  if (role !== 'admin') navigate('/admin/login');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not a valid image file`);
        }

        const url = await uploadImageToCloudinary(file);
        return {
          name: file.name,
          url,
          size: (file.size / 1024 / 1024).toFixed(2),
          uploadedAt: new Date().toISOString()
        };
      });

      const results = await Promise.all(uploadPromises);
      
      const saved = [];
      for (const img of results) {
        const docRef = await addDocument('gallery', img);
        saved.push({ id: docRef.id, ...img });
      }

      setImages(prev => [...saved, ...prev]);
      setSuccess(`Successfully uploaded ${results.length} image(s)`);
    } catch (err) {
      setError(err.message || 'Failed to upload images');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this image from the gallery? This cannot be undone.')) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await deleteDocument('gallery', id);
      setImages(prev => prev.filter(img => img.id !== id));
      setSuccess('Image deleted successfully.');
    } catch (err) {
      setError('Failed to delete image: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page container section-padding">
      <div className="page-header mb-xl">
        <h1 className="display-sm text-gradient-gold">Media Library</h1>
        <p className="text-secondary">Upload and manage tournament images</p>
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

      <div className="card card-gold mb-xl p-lg">
        <h2 className="text-lg font-bold mb-md">Upload Images</h2>
        
        <div
          className={`upload-zone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !loading && fileInputRef.current?.click()}
          style={{ cursor: 'pointer' }}
        >
          <div className="upload-content">
            {loading ? (
              <>
                <Loader size={48} className="spin" />
                <p className="text-secondary mt-md">Uploading images...</p>
              </>
            ) : (
              <>
                <Upload size={48} className="text-gold" />
                <h3 className="text-lg font-bold mt-md">Drag images here</h3>
                <p className="text-secondary text-sm">or click to select files</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleChange}
                  className="hidden-file-input"
                  disabled={loading}
                />
              </>
            )}
          </div>
        </div>

        <p className="text-secondary text-sm mt-md text-center">
          Supported formats: JPG, PNG, GIF, WebP | Max file size: 10MB each
        </p>
      </div>

      {images.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold mb-md text-gradient-gold">Uploaded Images ({images.length})</h2>
          <div className="grid grid-4 gap-lg">
            {images.map((img) => (
              <div key={img.id} className="image-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border-card)', borderRadius: '12px', padding: '12px', justifyContent: 'space-between' }}>
                <div>
                  <div className="image-container" style={{ aspectRatio: '16/10', overflow: 'hidden', borderRadius: '8px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                    <img src={img.url} alt={img.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} />
                  </div>
                  <div className="image-info">
                    <p className="text-sm font-semi truncate" style={{ margin: '0 0 4px 0', color: 'var(--text-primary)' }} title={img.name}>{img.name}</p>
                    <p className="text-xs text-secondary" style={{ margin: 0, opacity: 0.8 }}>Size: {img.size} MB</p>
                    <p className="text-xs text-secondary" style={{ margin: '2px 0 0 0', opacity: 0.7 }}>
                      {new Date(img.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(img.url);
                      alert('Image URL copied to clipboard!');
                    }}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1, padding: '6px 12px', fontSize: '0.75rem', border: '1px solid var(--border)', borderRadius: '18px' }}
                  >
                    Copy URL
                  </button>
                  <button
                    onClick={() => handleDelete(img.id)}
                    className="btn btn-danger btn-sm"
                    style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '18px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
