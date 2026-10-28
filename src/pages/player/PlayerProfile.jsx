import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPlayerByUIDOrEmail, setDocument, getDocument } from '../../firebase/firestore';
import uploadImageToCloudinary from '../../services/cloudinary';
import { ShieldCheck, User, Save, Upload, AlertCircle, Phone, Instagram, Shirt, Droplets } from 'lucide-react';
import Loader from '../../components/common/Loader';
import { QRCodeSVG } from 'qrcode.react';
import './Player.css';

export default function PlayerProfile() {
  const { user, role } = useAuth();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editable form fields — identity
  const [fullName, setFullName] = useState('');
  const [playerInitials, setPlayerInitials] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [instagramId, setInstagramId] = useState('');

  // Emergency contact
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactMobile, setEmergencyContactMobile] = useState('');

  // Cricket & kit details (player only)
  const [playingStyle, setPlayingStyle] = useState('Batsman');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [nameOnJersey, setNameOnJersey] = useState('');
  const [sleeveType, setSleeveType] = useState('');
  const [tshirtSize, setTshirtSize] = useState('');
  const [customTshirtSize, setCustomTshirtSize] = useState('');
  const [trackPantSize, setTrackPantSize] = useState('');
  const [customTrackPantSize, setCustomTrackPantSize] = useState('');

  // Photo
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Standard kit sizes
  const TSHIRT_SIZES = ['S (38)', 'M (40)', 'L (42)', 'XL (44)', 'XXL (46)', 'Other'];
  const TRACK_SIZES  = ['S (28)', 'M (30)', 'L (32)', 'XL (34)', 'XXL (36)', 'Other'];

  // Helper: detect if a value is a custom (non-standard) size
  const resolveSize = (value, standardList) => {
    if (!value) return { selected: '', custom: '' };
    if (standardList.includes(value)) return { selected: value, custom: '' };
    return { selected: 'Other', custom: value };
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        let profile = null;
        if (role === 'captain') {
          const captData = await getDocument('captains', user.uid);
          if (captData) {
            profile = {
              ...captData,
              playerId: captData.captainId,
              playingStyle: 'Team Captain',
              jerseyNumber: 'N/A'
            };
          }
        }
        if (!profile) {
          profile = await getPlayerByUIDOrEmail(user.uid, user.email);
        }
        if (profile) {
          setPlayer(profile);
          setFullName(profile.fullName || '');
          setPlayerInitials(profile.playerInitials || '');
          setMobile(profile.mobile || profile.cricHeroesRegNo || '');
          setDob(profile.dob || '');
          setEmail(profile.email || '');
          setBloodGroup(profile.bloodGroup || '');
          setInstagramId(profile.instagramId || '');
          setEmergencyContactName(profile.emergencyContactName || '');
          setEmergencyContactMobile(profile.emergencyContactMobile || '');
          setPlayingStyle(profile.playingStyle || 'Batsman');
          setJerseyNumber(profile.jerseyNumber || '');
          setNameOnJersey(profile.nameOnJersey || '');
          setSleeveType(profile.sleeveType || '');
          setPhotoPreview(profile.photoURL || null);

          const tshirt = resolveSize(profile.tshirtSize, TSHIRT_SIZES);
          setTshirtSize(tshirt.selected);
          setCustomTshirtSize(tshirt.custom);

          const track = resolveSize(profile.trackPantSize, TRACK_SIZES);
          setTrackPantSize(track.selected);
          setCustomTrackPantSize(track.custom);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, role]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
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
        photoURL = await uploadImageToCloudinary(photo);
      }

      const finalTshirtSize    = tshirtSize === 'Other' ? customTshirtSize.trim() : tshirtSize;
      const finalTrackPantSize = trackPantSize === 'Other' ? customTrackPantSize.trim() : trackPantSize;

      if (role === 'captain') {
        const updated = {
          ...player,
          fullName,
          playerInitials: playerInitials.trim().toUpperCase(),
          mobile,
          cricHeroesRegNo: mobile,
          email,
          dob,
          bloodGroup,
          instagramId,
          emergencyContactName,
          emergencyContactMobile,
          photoURL
        };
        await setDocument('captains', user.uid, updated);
        setPlayer({ ...updated, playerId: updated.captainId, playingStyle: 'Team Captain', jerseyNumber: 'N/A' });
      } else {
        const updated = {
          ...player,
          fullName,
          playerInitials: playerInitials.trim().toUpperCase(),
          mobile,
          cricHeroesRegNo: mobile,
          email,
          dob,
          bloodGroup,
          instagramId,
          emergencyContactName,
          emergencyContactMobile,
          playingStyle,
          jerseyNumber,
          nameOnJersey: nameOnJersey.trim().toUpperCase(),
          sleeveType,
          tshirtSize: finalTshirtSize,
          trackPantSize: finalTrackPantSize,
          photoURL
        };
        await setDocument('players', player.playerId, updated);
        setPlayer(updated);
      }
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <h2>No registered profile linked to this user account.</h2>
      </div>
    );
  }

  return (
    <div className="profile-page page-enter container section-padding">
      <div className="section-header">
        <span className="section-label">My Settings</span>
        <h1 className="section-title">Edit <span className="text-gradient-gold">Profile</span></h1>
        <p className="section-subtitle">Update your personal details, contact information, and kit preferences.</p>
      </div>

      <div className="profile-grid flex gap-xl flex-wrap justify-center items-start">
        {/* Form panel */}
        <div className="profile-form-panel card card-gold flex-1" style={{ minWidth: '320px', maxWidth: '680px' }}>
          {success && (
            <div className="alert alert-success mb-md">
              <ShieldCheck size={18} />
              <span>Profile updated successfully.</span>
            </div>
          )}
          {error && (
            <div className="alert alert-error mb-md">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="flex flex-col gap-md">

            {/* ── Avatar ── */}
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

            {/* ── Section: Identity ── */}
            <p className="text-xs font-bold uppercase tracking-wider text-gold" style={{ borderBottom: '1px solid var(--border-card)', paddingBottom: '6px' }}>
              Personal Information
            </p>

            <div className="form-group">
              <label className="form-label"><User size={14} style={{ marginRight: 4 }} />Full Name</label>
              <input type="text" className="form-input" required value={fullName}
                onChange={(e) => setFullName(e.target.value)} disabled={saving} />
            </div>

            <div className="form-group">
              <label className="form-label"><User size={14} style={{ marginRight: 4 }} />Player Initials</label>
              <input type="text" className="form-input" placeholder="e.g. AS-77" value={playerInitials}
                onChange={(e) => setPlayerInitials(e.target.value.toUpperCase())} disabled={saving} />
            </div>

            <div className="form-group">
              <label className="form-label"><Phone size={14} style={{ marginRight: 4 }} />Contact No. (CricHeroes Regis. No.)</label>
              <input type="text" className="form-input" required value={mobile}
                onChange={(e) => setMobile(e.target.value)} disabled={saving} />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" required value={email}
                onChange={(e) => setEmail(e.target.value)} disabled={saving} />
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input type="date" className="form-input" value={dob}
                onChange={(e) => setDob(e.target.value)} disabled={saving} />
            </div>

            <div className="form-group">
              <label className="form-label"><Droplets size={14} style={{ marginRight: 4 }} />Blood Group</label>
              <select className="form-select" value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)} disabled={saving}>
                <option value="">-- Select Blood Group --</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label"><Instagram size={14} style={{ marginRight: 4 }} />Instagram ID</label>
              <div className="input-wrapper">
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>@</span>
                <input type="text" className="form-input" placeholder="username" value={instagramId}
                  onChange={(e) => setInstagramId(e.target.value)} disabled={saving}
                  style={{ paddingLeft: '28px' }} />
              </div>
            </div>

            {/* ── Section: Emergency Contact ── */}
            <p className="text-xs font-bold uppercase tracking-wider text-gold" style={{ borderBottom: '1px solid var(--border-card)', paddingBottom: '6px', marginTop: '8px' }}>
              Emergency Contact
            </p>

            <div className="form-group">
              <label className="form-label"><User size={14} style={{ marginRight: 4 }} />Emergency Contact Name</label>
              <input type="text" className="form-input" placeholder="Name of contact person"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)} disabled={saving} />
            </div>

            <div className="form-group">
              <label className="form-label"><Phone size={14} style={{ marginRight: 4 }} />Emergency Contact Number</label>
              <input type="tel" className="form-input" placeholder="Emergency mobile number"
                value={emergencyContactMobile}
                onChange={(e) => setEmergencyContactMobile(e.target.value)} disabled={saving} />
            </div>

            {/* ── Section: Cricket & Kit (player only) ── */}
            {role !== 'captain' && (
              <>
                <p className="text-xs font-bold uppercase tracking-wider text-gold" style={{ borderBottom: '1px solid var(--border-card)', paddingBottom: '6px', marginTop: '8px' }}>
                  Cricket & Kit Details
                </p>

                <div className="form-group">
                  <label className="form-label">Playing Style</label>
                  <select className="form-select" value={playingStyle}
                    onChange={(e) => setPlayingStyle(e.target.value)} disabled={saving}>
                    <option value="Batsman">Batsman</option>
                    <option value="Bowler">Bowler</option>
                    <option value="Wicket Keeper">Wicket Keeper</option>
                    <option value="All-Rounder">All-Rounder</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label"><Shirt size={14} style={{ marginRight: 4 }} />Jersey Number</label>
                  <input type="number" className="form-input" placeholder="e.g. 18" value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value)} disabled={saving} />
                </div>

                <div className="form-group">
                  <label className="form-label"><Shirt size={14} style={{ marginRight: 4 }} />Name on Jersey</label>
                  <input type="text" className="form-input" placeholder="e.g. SHARMA"
                    value={nameOnJersey}
                    onChange={(e) => setNameOnJersey(e.target.value.toUpperCase())}
                    disabled={saving} style={{ textTransform: 'uppercase' }} />
                </div>

                <div className="form-group">
                  <label className="form-label">Sleeve Type</label>
                  <select className="form-select" value={sleeveType}
                    onChange={(e) => setSleeveType(e.target.value)} disabled={saving}>
                    <option value="">-- Choose Sleeve Type --</option>
                    <option value="Half Sleeve">Half Sleeve</option>
                    <option value="Full Sleeve">Full Sleeve</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">T-Shirt Size</label>
                  <select className="form-select" value={tshirtSize}
                    onChange={(e) => setTshirtSize(e.target.value)} disabled={saving}>
                    <option value="">-- Choose T-Shirt Size --</option>
                    {TSHIRT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {tshirtSize === 'Other' && (
                    <input type="text" className="form-input" placeholder="Enter your T-shirt size"
                      value={customTshirtSize}
                      onChange={(e) => setCustomTshirtSize(e.target.value)}
                      disabled={saving} style={{ marginTop: '8px' }} />
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Track Pant Size</label>
                  <select className="form-select" value={trackPantSize}
                    onChange={(e) => setTrackPantSize(e.target.value)} disabled={saving}>
                    <option value="">-- Choose Track Pant Size --</option>
                    {TRACK_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {trackPantSize === 'Other' && (
                    <input type="text" className="form-input" placeholder="Enter your track pant size"
                      value={customTrackPantSize}
                      onChange={(e) => setCustomTrackPantSize(e.target.value)}
                      disabled={saving} style={{ marginTop: '8px' }} />
                  )}
                </div>
              </>
            )}

            <button type="submit" className="btn btn-gold btn-lg mt-md w-full" disabled={saving}>
              {saving ? 'Saving changes...' : <><Save size={18} /> Save Settings</>}
            </button>
          </form>
        </div>

        {/* QR Code Panel */}
        <div className="profile-qr-panel card flex flex-col items-center justify-center text-center gap-md"
          style={{ width: '350px', background: 'var(--bg-card)', border: '1px solid var(--border-card)', padding: 'var(--space-xl)' }}>
          <h3 className="text-lg font-bold text-gradient-gold">Verification QR Code</h3>
          <p className="text-sm text-secondary">Present this QR code to officials on match day for quick roster check-in.</p>
          <div className="qr-container bg-white p-sm rounded-md" style={{ display: 'inline-block', padding: '12px', background: '#fff', borderRadius: '8px' }}>
            <QRCodeSVG value={player.playerId} size={220} />
          </div>
          <strong className="text-sm text-gold block mt-sm">{player.playerId}</strong>
          <span className="badge badge-gold">Status: Active</span>
        </div>
      </div>
    </div>
  );
}
