import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { uploadImageToCloudinary } from '../../services/cloudinary';
import { Upload, AlertCircle, Loader } from 'lucide-react';
import './Admin.css';

export default function AdminImages() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [dragActive, setDragActive] = useState(false);

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
          uploadedAt: new Date().toLocaleString()
        };
      });

      const results = await Promise.all(uploadPromises);
      setUploadedImages(prev => [...results, ...prev]);
      setSuccess(`Successfully uploaded ${results.length} image(s)`);
    } catch (err) {
      setError(err.message || 'Failed to upload images');
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

      {uploadedImages.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold mb-md text-gradient-gold">Uploaded Images</h2>
          <div className="grid grid-4 gap-lg">
            {uploadedImages.map((img, idx) => (
              <div key={idx} className="image-card">
                <div className="image-container">
                  <img src={img.url} alt={img.name} />
                </div>
                <div className="image-info">
                  <p className="text-sm font-semi truncate">{img.name}</p>
                  <p className="text-xs text-secondary">{img.size} MB</p>
                  <p className="text-xs text-secondary">{img.uploadedAt}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(img.url);
                    alert('Image URL copied to clipboard!');
                  }}
                  className="btn btn-outline btn-sm w-full mt-md"
                >
                  Copy URL
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
