import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDocument, setDocument } from '../../firebase/firestore';
import { Mail, Lock, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';
import '../auth/Auth.css';

const cleanEnvVar = (val) => {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '');
};

const ADMIN_EMAIL = cleanEnvVar(import.meta.env.VITE_ADMIN_EMAIL);
const ADMIN_PASSWORD = cleanEnvVar(import.meta.env.VITE_ADMIN_PASSWORD);

export default function AdminLogin() {
  const { setUserProfile } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setError('Admin login is restricted to the fixed admin account.');
      setLoading(false);
      return;
    }

    try {
      let firebaseUser;
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        firebaseUser = cred.user;
      } catch (authErr) {
        console.warn("Direct admin sign-in failed, checking if we need to auto-create admin:", authErr);
        if (password === ADMIN_PASSWORD) {
          try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            firebaseUser = cred.user;
          } catch (createErr) {
            console.error("Auto-create admin failed:", createErr);
            throw authErr;
          }
        } else {
          throw authErr;
        }
      }

      // Check if admin user exists in Firestore, create if not
      let userProfile = await getDocument('users', firebaseUser.uid);
      
      if (!userProfile) {
        // Create admin user in Firestore
        userProfile = {
          uid: firebaseUser.uid,
          name: 'Admin',
          email: email,
          role: 'admin',
          mobile: '',
          photoURL: '',
          status: 'Active',
          createdAt: new Date().toISOString(),
        };
        await setDocument('users', firebaseUser.uid, userProfile);
      } else if (userProfile.role !== 'admin') {
        userProfile.role = 'admin';
        await setDocument('users', firebaseUser.uid, userProfile);
      }

      setUserProfile(userProfile);
      navigate('/admin/dashboard');
    } catch (err) {
      console.error("Admin login error:", err);
      setError('Incorrect admin email or password. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page-enter">
      <div className="orb orb-gold spline-float-1" style={{ top: '5%', right: '5%', width: '400px', height: '400px' }} />
      <div className="orb orb-navy spline-float-2" style={{ bottom: '5%', left: '5%', width: '500px', height: '500px' }} />

      <div className="container auth-container">
        <div className="auth-card card-gold login-card" style={{ maxWidth: '420px', margin: '0 auto' }}>
          <div className="auth-header">
            <div className="auth-logo">
              <img src="/logos/trivabsports.jpg" alt="TRIVAB SPORTS" />
            </div>
            <h2 className="display-sm text-gradient-gold">Admin Login</h2>
            <p className="text-secondary text-sm">Access tournament management console</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} autoComplete="off">
            {/* Dummy hidden inputs to prevent browser autofill */}
            <input type="text" name="dummy-email" style={{ display: 'none' }} autoComplete="new-username" />
            <input type="password" name="dummy-password" style={{ display: 'none' }} autoComplete="new-password" />
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon-left" size={18} />
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter admin email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  placeholder="Enter admin password"
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

            <button type="submit" className="btn btn-gold btn-lg w-full mt-md" disabled={loading}>
              {loading ? 'Logging in...' : 'Sign In as Admin'}
            </button>
          </form>

          <div className="auth-footer text-center">
            <span className="text-muted text-sm">Admin access is restricted to the permanent account.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
