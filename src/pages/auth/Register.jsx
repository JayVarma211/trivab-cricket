import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { registerUser } from '../../firebase/auth';
import { setDocument, addDocument, updateDocument, getAllTeams, getCollection, orderBy } from '../../firebase/firestore';
import uploadImageToCloudinary from '../../services/cloudinary';
import { generatePlayerID } from '../../utils/generatePlayerID';
import {
  User, Mail, Lock, Phone, Upload, AlertCircle, Eye, EyeOff, Trophy, Shirt
} from 'lucide-react';
import './Auth.css';

export default function Register() {
  const { setUserProfile } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [playingStyle, setPlayingStyle] = useState('Batsman');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // New Fields Form State
  const [mcaPlayer, setMcaPlayer] = useState('no'); // 'yes' | 'no'
  const [mcaIdNumber, setMcaIdNumber] = useState('');
  const [mcaCardPhoto, setMcaCardPhoto] = useState(null);
  const [mcaCardPhotoPreview, setMcaCardPhotoPreview] = useState(null);
  const [trackPantSize, setTrackPantSize] = useState('');
  const [tshirtSize, setTshirtSize] = useState('');
  const [sleeveType, setSleeveType] = useState('');
  const [instagramId, setInstagramId] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleMcaCardChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMcaCardPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMcaCardPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Validations
      if (!trackPantSize) {
        throw new Error('Please select your track pant size.');
      }
      if (!tshirtSize) {
        throw new Error('Please select your t-shirt size.');
      }
      if (!sleeveType) {
        throw new Error('Please select your sleeve type.');
      }

      // 2. Register User in Firebase Auth
      const firebaseUser = await registerUser(email, password, fullName);

      // 3. Upload MCA card photo to Cloudinary if applicable
      let mcaCardURL = '';
      if (mcaPlayer === 'yes' && mcaCardPhoto) {
        try {
          mcaCardURL = await uploadImageToCloudinary(mcaCardPhoto);
        } catch (err) {
          console.error(err);
          throw new Error('Failed to upload MCA card image');
        }
      }

      // 4. Upload profile photo to Cloudinary if present
      let photoURL = '';
      if (photo) {
        try {
          photoURL = await uploadImageToCloudinary(photo);
        } catch (err) {
          console.error(err);
          throw new Error('Failed to upload profile image');
        }
      }

      // 5. Save Firestore documents
      const userProfileData = {
        uid: firebaseUser.uid,
        name: fullName,
        email,
        role: 'player', // All users register with a common player role
        mobile,
        photoURL,
        createdAt: new Date().toISOString()
      };

      const generatedId = generatePlayerID('Free Agent');

      const playerProfileData = {
        playerId: generatedId,
        uid: firebaseUser.uid,
        fullName,
        mobile,
        email,
        playingStyle,
        jerseyNumber,
        photoURL,
        qrValue: generatedId,
        qrCodeURL: '',
        pdfURL: '',
        status: 'Active',
        createdAt: new Date().toISOString(),
        joinedTournaments: [], // Empty initially, players join tournaments later
        teamId: '',
        teamName: 'Free Agent',
        mcaPlayer: mcaPlayer === 'yes',
        mcaIdNumber: mcaPlayer === 'yes' ? mcaIdNumber : '',
        mcaCardURL: mcaPlayer === 'yes' ? mcaCardURL : '',
        trackPantSize,
        tshirtSize,
        sleeveType,
        instagramId
      };

      await setDocument('users', firebaseUser.uid, userProfileData);
      await setDocument('players', generatedId, playerProfileData);

      setUserProfile(userProfileData);
      
      // Navigate to player dashboard
      navigate('/player/dashboard');

    } catch (err) {
      setError(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page-enter">
      <div className="orb orb-gold spline-float-1" style={{ top: '5%', right: '5%', width: '400px', height: '400px' }} />
      <div className="orb orb-navy spline-float-2" style={{ bottom: '5%', left: '5%', width: '500px', height: '500px' }} />

      <div className="container auth-container">
        <div className="auth-card card-gold register-card">
          <div className="auth-header">
            <div className="auth-logo">
              <img src="/logos/trivabsports.webp" alt="TRIVAB SPORTS" />
            </div>
            <h2 className="display-sm text-gradient-gold">Join the Platform</h2>
            <p className="text-secondary text-sm">Register your profile for tournaments & matches</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form className="auth-form register-form-grid" onSubmit={handleSubmit} autoComplete="off">
            {/* Dummy hidden inputs to prevent browser autofill */}
            <input type="text" name="dummy-email" style={{ display: 'none' }} autoComplete="new-username" />
            <input type="password" name="dummy-password" style={{ display: 'none' }} autoComplete="new-password" />
            
            {/* Column 1: Core credentials & apparel sizes */}
            <div className="form-column">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-wrapper">
                  <User className="input-icon-left" size={18} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <Mail className="input-icon-left" size={18} />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="name@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <div className="input-wrapper">
                  <Phone className="input-icon-left" size={18} />
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="10 digit number"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon-left" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Choose password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="input-icon-right"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Instagram ID</label>
                <div className="input-wrapper">
                  <span className="input-icon-left text-muted font-semi" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>@</span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="username"
                    value={instagramId}
                    onChange={(e) => setInstagramId(e.target.value)}
                    disabled={loading}
                    style={{ paddingLeft: '28px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Track Pant Size</label>
                <select
                  className="form-select"
                  value={trackPantSize}
                  onChange={(e) => setTrackPantSize(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">-- Choose Track Pant Size --</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">T-Shirt Size</label>
                <select
                  className="form-select"
                  value={tshirtSize}
                  onChange={(e) => setTshirtSize(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">-- Choose T-Shirt Size --</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Sleeve Type</label>
                <select
                  className="form-select"
                  value={sleeveType}
                  onChange={(e) => setSleeveType(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">-- Choose Sleeve Type --</option>
                  <option value="Half Sleeve">Half Sleeve</option>
                  <option value="Full Sleeve">Full Sleeve</option>
                </select>
              </div>
            </div>

            {/* Column 2: Player Details & Photo */}
            <div className="form-column">
              <div className="form-group">
                <label className="form-label">Playing Style</label>
                <select
                  className="form-select"
                  value={playingStyle}
                  onChange={(e) => setPlayingStyle(e.target.value)}
                  disabled={loading}
                >
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="Wicket Keeper">Wicket Keeper</option>
                  <option value="All-Rounder">All-Rounder</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Jersey Number</label>
                <div className="input-wrapper">
                  <Shirt className="input-icon-left" size={18} />
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 18"
                    required
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">MCA Registered Player?</label>
                <select
                  className="form-select"
                  value={mcaPlayer}
                  onChange={(e) => setMcaPlayer(e.target.value)}
                  disabled={loading}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              {mcaPlayer === 'yes' && (
                <>
                  <div className="form-group">
                    <label className="form-label">MCA ID Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter MCA Registration ID"
                      required={mcaPlayer === 'yes'}
                      value={mcaIdNumber}
                      onChange={(e) => setMcaIdNumber(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">MCA Card Photo</label>
                    <div className="file-upload-container">
                      {mcaCardPhotoPreview ? (
                        <div className="photo-preview-wrap">
                          <img src={mcaCardPhotoPreview} alt="MCA Card Preview" className="photo-preview" style={{ maxHeight: '80px', objectFit: 'contain' }} />
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setMcaCardPhoto(null);
                              setMcaCardPhotoPreview(null);
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="file-upload-label">
                          <Upload size={24} />
                          <span className="text-xs font-medium">Upload MCA Card</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleMcaCardChange}
                            disabled={loading}
                            style={{ display: 'none' }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Profile Photo</label>
                <div className="file-upload-container">
                  {photoPreview ? (
                    <div className="photo-preview-wrap">
                      <img src={photoPreview} alt="Preview" className="photo-preview" />
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          setPhoto(null);
                          setPhotoPreview(null);
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="file-upload-label">
                      <Upload size={24} />
                      <span className="text-xs font-medium">Upload Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        disabled={loading}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-gold btn-lg auth-submit-btn full-width-btn" disabled={loading}>
              {loading ? 'Creating Account & Profile...' : 'Complete Registration'}
            </button>
          </form>

          <div className="auth-footer text-center">
            <span className="text-muted text-sm">Already registered? </span>
            <Link to="/login" className="auth-link text-sm font-semi">Log In Here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
