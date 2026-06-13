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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [playingStyle, setPlayingStyle] = useState('Batsman');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [playerInitials, setPlayerInitials] = useState('');

  // New Fields Form State
  const [cricHeroesRegNo, setCricHeroesRegNo] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactMobile, setEmergencyContactMobile] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [dob, setDob] = useState('');
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

  // Custom clothes sizes
  const [customTshirtSize, setCustomTshirtSize] = useState('');
  const [customTrackPantSize, setCustomTrackPantSize] = useState('');

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

    // 1. Validations
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!playerInitials.trim()) {
      setError('Please enter your player initials.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!dob) {
      setError('Please select your Date of Birth.');
      return;
    }
    if (!bloodGroup) {
      setError('Please select your Blood Group.');
      return;
    }
    if (!instagramId.trim()) {
      setError('Please enter your Instagram ID.');
      return;
    }
    if (!photo) {
      setError('Please upload your profile photo.');
      return;
    }
    if (!cricHeroesRegNo) {
      setError('Please enter your Contact No. (CricHeroes Registered No.).');
      return;
    }
    if (!emergencyContactName || !emergencyContactMobile) {
      setError('Please enter Emergency Contact Name and Number.');
      return;
    }
    if (!playingStyle) {
      setError('Please select your playing style.');
      return;
    }
    if (!jerseyNumber) {
      setError('Please enter your jersey number.');
      return;
    }
    if (!sleeveType) {
      setError('Please select your sleeve type.');
      return;
    }
    if (!tshirtSize) {
      setError('Please select your t-shirt size.');
      return;
    }
    if (tshirtSize === 'Other' && !customTshirtSize.trim()) {
      setError('Please type your custom t-shirt size.');
      return;
    }
    if (!trackPantSize) {
      setError('Please select your track pant size.');
      return;
    }
    if (trackPantSize === 'Other' && !customTrackPantSize.trim()) {
      setError('Please type your custom track pant size.');
      return;
    }
    if (mcaPlayer === 'yes' && !mcaIdNumber.trim()) {
      setError('Please provide your MCA ID Number.');
      return;
    }
    if (mcaPlayer === 'yes' && !mcaCardPhoto) {
      setError('Please upload your MCA card photo.');
      return;
    }

    setLoading(true);

    try {
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
        mobile: cricHeroesRegNo, // CricHeroes Regis No. mapped to primary mobile field
        photoURL,
        createdAt: new Date().toISOString()
      };

      const generatedId = generatePlayerID('Free Agent');

      const finalTshirtSize = tshirtSize === 'Other' ? customTshirtSize.trim() : tshirtSize;
      const finalTrackPantSize = trackPantSize === 'Other' ? customTrackPantSize.trim() : trackPantSize;

      const playerProfileData = {
        playerId: generatedId,
        uid: firebaseUser.uid,
        fullName,
        playerInitials: playerInitials.trim().toUpperCase(),
        mobile: cricHeroesRegNo, // CricHeroes Regis No. mapped to primary mobile field
        cricHeroesRegNo,
        emergencyContactName,
        emergencyContactMobile,
        bloodGroup,
        dob,
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
        trackPantSize: finalTrackPantSize,
        tshirtSize: finalTshirtSize,
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
            <h2 className="display-sm text-gradient-gold">Join The Trivab BAPL Ecosystem</h2>
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
            
            {/* Column 1: Identity & Credentials */}
            <div className="form-column">
              <div className="form-group">
                <label className="form-label">Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="input-wrapper">
                  <User className="input-icon-left" size={18} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your full name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Player Initials <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="input-wrapper">
                  <User className="input-icon-left" size={18} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex. AS-77"
                    required
                    value={playerInitials}
                    onChange={(e) => setPlayerInitials(e.target.value.toUpperCase())}
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address <span style={{ color: '#ef4444' }}>*</span></label>
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
                <label className="form-label">Password <span style={{ color: '#ef4444' }}>*</span></label>
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
                <label className="form-label">Confirm Password <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="input-wrapper">
                  <Lock className="input-icon-left" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Confirm password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                <label className="form-label">Date of Birth <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="input-wrapper">
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Blood Group <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  className="form-select"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">-- Select Blood Group --</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Instagram ID <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="input-wrapper">
                  <span className="input-icon-left text-muted font-semi" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>@</span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="username"
                    required
                    value={instagramId}
                    onChange={(e) => setInstagramId(e.target.value)}
                    disabled={loading}
                    style={{ paddingLeft: '28px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Profile Photo <span style={{ color: '#ef4444' }}>*</span></label>
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

            {/* Column 2: Player Details & Contact */}
            <div className="form-column">
              <div className="form-group">
                <label className="form-label">Contact No. (CricHeroes Registered No.) <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="input-wrapper">
                  <Phone className="input-icon-left" size={18} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Contact No. (CricHeroes Registered No.)"
                    required
                    value={cricHeroesRegNo}
                    onChange={(e) => setCricHeroesRegNo(e.target.value)}
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Emergency Contact Person Name <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="input-wrapper">
                  <User className="input-icon-left" size={18} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Name of contact person"
                    required
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Emergency Contact Number <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="input-wrapper">
                  <Phone className="input-icon-left" size={18} />
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="Emergency mobile number"
                    required
                    value={emergencyContactMobile}
                    onChange={(e) => setEmergencyContactMobile(e.target.value)}
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Playing Style <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  className="form-select"
                  value={playingStyle}
                  onChange={(e) => setPlayingStyle(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="Wicket Keeper">Wicket Keeper</option>
                  <option value="All-Rounder">All-Rounder</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Jersey Number <span style={{ color: '#ef4444' }}>*</span></label>
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
                <label className="form-label">Sleeve Type <span style={{ color: '#ef4444' }}>*</span></label>
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

              <div className="form-group">
                <label className="form-label">T-Shirt Size <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  className="form-select"
                  value={tshirtSize}
                  onChange={(e) => setTshirtSize(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">-- Choose T-Shirt Size --</option>
                  <option value="S (36)">S (36)</option>
                  <option value="M (38)">M (38)</option>
                  <option value="L (40)">L (40)</option>
                  <option value="XL (42)">XL (42)</option>
                  <option value="XXL (44)">XXL (44)</option>
                  <option value="Other">Other</option>
                </select>
                {tshirtSize === 'Other' && (
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your T-shirt size manually"
                    value={customTshirtSize}
                    onChange={(e) => setCustomTshirtSize(e.target.value)}
                    required
                    disabled={loading}
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Track Pant Size <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  className="form-select"
                  value={trackPantSize}
                  onChange={(e) => setTrackPantSize(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">-- Choose Track Pant Size --</option>
                  <option value="S (30)">S (30)</option>
                  <option value="M (32)">M (32)</option>
                  <option value="L (34)">L (34)</option>
                  <option value="XL (36)">XL (36)</option>
                  <option value="XXL (38)">XXL (38)</option>
                  <option value="Other">Other</option>
                </select>
                {trackPantSize === 'Other' && (
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your track size manually"
                    value={customTrackPantSize}
                    onChange={(e) => setCustomTrackPantSize(e.target.value)}
                    required
                    disabled={loading}
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>

              <div className="form-group">
                <label className="form-label">MCA Registered Player? <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  className="form-select"
                  value={mcaPlayer}
                  onChange={(e) => setMcaPlayer(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

              {mcaPlayer === 'yes' && (
                <>
                  <div className="form-group">
                    <label className="form-label">MCA ID Number <span style={{ color: '#ef4444' }}>*</span></label>
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
                    <label className="form-label">MCA Card Photo <span style={{ color: '#ef4444' }}>*</span></label>
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

      {/* OTP Verification Modal removed */}
    </div>
  );
}
