import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPlayerByUID, setDocument } from '../../firebase/firestore';
import { uploadPlayerPhoto } from '../../firebase/storage';
import { ShieldCheck, User, Save, Upload, AlertCircle } from 'lucide-react';
import Loader from '../../components/common/Loader';
import './Player.css';

export default function PlayerProfile() {
  const { user } = useAuth();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Editable form fields
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [playingStyle, setPlayingStyle] = useState('Batsman');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const profile = await getPlayerByUID(user.uid);
        if (profile) {
          setPlayer(profile);
          setFullName(profile.fullName || '');
          setMobile(profile.mobile || '');
          setPlayingStyle(profile.playingStyle || 'Batsman');
          setJerseyNumber(profile.jerseyNumber || '');
          setPhotoPreview(profile.photoURL || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError('');

    try {
      let photoURL = player.photoURL || '';
      if (photo) {
        photoURL = await uploadPlayerPhoto(photo, player.playerId);
      }

      const updated = {
        ...player,
        fullName,
        mobile,
        playingStyle,
        jerseyNumber,
        photoURL
      };

      await setDocument('players', player.playerId, updated);
      setPlayer(updated);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  if (!player) {
    return (
      <div className="container section-padding text-center">
        <h2>No player profile linked to user account.</h2>
      </div>
    );
  }

  return (
    <div className="profile-page page-enter container section-padding">
      <div className="section-header">
        <span className="section-label">My Settings</span>
        <h1 className="section-title">Edit Player <span className="text-gradient-gold">Profile</span></h1>
        <p className="section-subtitle">Modify your display parameters, style parameters, or contact numbers.</p>
      </div>

      <div className="profile-layout-container card card-gold max-width-600" style={{ margin: '0 auto' }}>
        {success && (
          <div className="alert alert-success mb-md">
            <ShieldCheck size={18} />
            <span>Profile settings saved successfully.</span>
          </div>
        )}
        {error && (
          <div className="alert alert-error mb-md">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-md">
          {/* Avatar Upload */}
          <div className="profile-avatar-row flex gap-lg items-center mb-md justify-center">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="avatar-xl" />
            ) : (
              <div className="avatar-xl flex items-center justify-center bg-secondary font-bold text-gold">
                {fullName[0]?.toUpperCase() || 'P'}
              </div>
            )}
            <div>
              <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                <Upload size={14} /> Upload New Photo
                <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input
              type="tel"
              className="form-input"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Playing Style</label>
            <select
              className="form-select"
              value={playingStyle}
              onChange={(e) => setPlayingStyle(e.target.value)}
              disabled={saving}
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
              className="form-input"
              required
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(e.target.value)}
              disabled={saving}
            />
          </div>

          <button type="submit" className="btn btn-gold btn-lg mt-md w-full" disabled={saving}>
            {saving ? 'Saving changes...' : <><Save size={18} /> Save Settings</>}
          </button>
        </form>
      </div>
    </div>
  );
}
