import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { registerUser } from '../../firebase/auth';
import { setDocument, addDocument, updateDocument, getAllTeams } from '../../firebase/firestore';
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
  const [role, setRole] = useState('player'); // player | captain
  const [teamSelection, setTeamSelection] = useState('');
  const [playingStyle, setPlayingStyle] = useState('Batsman');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState('');

  // Load existing teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamList = await getAllTeams();
        const exampleTeams = [
          { id: 'example-mi', teamName: 'Mumbai Indians (Example)' },
          { id: 'example-csk', teamName: 'Chennai Super Kings (Example)' },
          { id: 'example-rcb', teamName: 'Royal Challengers Bangalore (Example)' }
        ];
        const combinedTeams = [...teamList, ...exampleTeams];
        setTeams(combinedTeams);
        if (combinedTeams.length > 0) {
          setTeamSelection(combinedTeams[0].id);
        }
      } catch (err) {
        console.error('Error fetching teams, using fallbacks:', err);
        const exampleTeams = [
          { id: 'example-mi', teamName: 'Mumbai Indians ' },
          { id: 'example-csk', teamName: 'Chennai Super Kings ' },
          { id: 'example-rcb', teamName: 'Royal Challengers Bangalore ' }
        ];
        setTeams(exampleTeams);
        setTeamSelection(exampleTeams[0].id);
      }
    };
    fetchTeams();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Register User in Firebase Auth
      const firebaseUser = await registerUser(email, password, fullName);

      // 2. Generate Unique Player ID & QR Data
      const selectedTeamObj = teams.find(t => t.id === teamSelection);
      const existingTeamName = selectedTeamObj ? selectedTeamObj.teamName : 'Free Agent';
      const generatedId = generatePlayerID(role === 'captain' ? teamName.trim() || 'GEN' : existingTeamName);

      // Enforce Max player limit (35)
      if (role === 'player' && selectedTeamObj && !selectedTeamObj.id.startsWith('example-')) {
        const currentCount = selectedTeamObj.playerCount || 0;
        const maxLimit = selectedTeamObj.maxPlayers || 35;
        if (currentCount >= maxLimit) {
          throw new Error(`Registration failed. The team ${selectedTeamObj.teamName} has reached its roster limit of ${maxLimit} players.`);
        }
      }

      // 3. Upload photo to Cloudinary if present
      let photoURL = '';
      if (photo) {
        try {
          photoURL = await uploadImageToCloudinary(photo);
        } catch (err) {
          console.error(err);
          throw new Error('Failed to upload profile image');
        }
      }

      // 4. Save Firestore documents
      const userProfileData = {
        uid: firebaseUser.uid,
        name: fullName,
        email,
        role,
        mobile,
        photoURL,
        createdAt: new Date().toISOString()
      };

      let selectedTeamId = teamSelection;
      let selectedTeamName = existingTeamName;

      if (role === 'captain') {
        if (!teamName.trim()) {
          throw new Error('Please enter your team name for captain registration.');
        }

        const teamDoc = await addDocument('teams', {
          teamName: teamName.trim(),
          city: '',
          logoURL: '',
          captainId: firebaseUser.uid,
          captainName: fullName,
          playerCount: 0,
          maxPlayers: 35,
          wins: 0,
          losses: 0,
          createdAt: new Date().toISOString()
        });

        selectedTeamId = teamDoc.id;
        selectedTeamName = teamName.trim();
      }

      await setDocument('users', firebaseUser.uid, userProfileData);

      if (role === 'player') {
        const playerProfileData = {
          playerId: generatedId,
          uid: firebaseUser.uid,
          fullName,
          mobile,
          email,
          teamId: selectedTeamId,
          teamName: selectedTeamName,
          playingStyle,
          jerseyNumber,
          photoURL,
          qrValue: generatedId,
          qrCodeURL: '',
          pdfURL: '',
          status: 'Active',
          createdAt: new Date().toISOString()
        };

        await setDocument('players', generatedId, playerProfileData);

        // Increment team player count
        if (selectedTeamId && !selectedTeamId.startsWith('example-') && selectedTeamObj) {
          const currentCount = selectedTeamObj.playerCount || 0;
          await updateDocument('teams', selectedTeamId, {
            playerCount: currentCount + 1
          });
        }
      }

      if (role === 'captain') {
        const captainData = {
          captainId: `CAPT-${generatedId.split('-').pop()}`,
          uid: firebaseUser.uid,
          fullName,
          teamId: selectedTeamId,
          teamName: selectedTeamName,
          mobile,
          email,
          photoURL,
          createdAt: new Date().toISOString()
        };
        await setDocument('captains', firebaseUser.uid, captainData);
        
        // Also update team doc with captain details
        await updateDocument('teams', selectedTeamId, {
          captainName: fullName,
          captainId: firebaseUser.uid
        });
      }

      setUserProfile(userProfileData);
      
      // Navigate to dashboard
      if (role === 'captain') navigate('/captain/dashboard');
      else navigate('/player/dashboard');

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
              <Trophy size={28} />
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

          <form className="auth-form register-form-grid" onSubmit={handleSubmit}>
            {/* Column 1: Core credentials */}
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
                <label className="form-label">Sign Up Role</label>
                <div className="auth-role-switcher flex gap-sm">
                  <button
                    type="button"
                    className={`btn btn-sm ${role === 'player' ? 'btn-gold' : 'btn-outline'}`}
                    onClick={() => setRole('player')}
                    disabled={loading}
                  >
                    Player
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${role === 'captain' ? 'btn-gold' : 'btn-outline'}`}
                    onClick={() => setRole('captain')}
                    disabled={loading}
                  >
                    Team Captain
                  </button>
                </div>
              </div>
            </div>

            {/* Column 2: Player Details & Photo */}
            <div className="form-column">
              {role === 'player' ? (
                <div className="form-group">
                  <label className="form-label">Team Selection</label>
                  <select
                    className="form-select"
                    value={teamSelection}
                    onChange={(e) => setTeamSelection(e.target.value)}
                    required
                    disabled={loading}
                  >
                    {teams.length === 0 ? (
                      <option value="">-- No teams available --</option>
                    ) : (
                      teams.map((t) => {
                        const isFull = t.playerCount >= (t.maxPlayers || 35) && !t.id.startsWith('example-');
                        return (
                          <option key={t.id} value={t.id} disabled={isFull}>
                            {t.teamName} {t.id.startsWith('example-') ? '' : `(${t.playerCount || 0}/${t.maxPlayers || 35})${isFull ? ' - FULL' : ''}`}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Team Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your team name"
                    required={role === 'captain'}
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}

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
              {loading ? 'Creating Account & Unique ID...' : 'Complete Registration'}
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
