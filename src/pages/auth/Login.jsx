import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loginUser } from '../../firebase/auth';
import { getDocument } from '../../firebase/firestore';
import { Mail, Lock, Eye, EyeOff, Trophy, AlertCircle } from 'lucide-react';
import './Auth.css';

export default function Login() {
  const { setUserProfile } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginRole, setLoginRole] = useState('player');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await loginUser(email, password);
      const profile = await getDocument('users', user.uid);
      if (profile) {
        if (profile.role !== loginRole && profile.role !== 'admin') {
          setError(`You are registered as ${profile.role}. Please use the ${profile.role === 'captain' ? 'Captain' : 'Player'} login option.`);
          return;
        }
        setUserProfile(profile);
        if (profile.role === 'admin') navigate('/admin/dashboard');
        else if (profile.role === 'captain') navigate('/captain/dashboard');
        else navigate('/player/dashboard');
      } else {
        navigate('/player/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to login. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page-enter">
      <div className="orb orb-gold spline-float-1" style={{ top: '10%', left: '5%', width: '400px', height: '400px' }} />
      <div className="orb orb-navy spline-float-2" style={{ bottom: '10%', right: '5%', width: '500px', height: '500px' }} />

      <div className="container auth-container">
        <div className="auth-card card-gold">
          <div className="auth-header">
            <div className="auth-logo">
              <Trophy size={28} />
            </div>
            <h2 className="display-sm text-gradient-gold">Welcome Back</h2>
            <p className="text-secondary text-sm">Access your TRIVAB platform dashboard</p>
          </div>

          <div className="auth-role-switcher mb-md flex gap-sm">
            <button
              type="button"
              className={`btn btn-sm ${loginRole === 'player' ? 'btn-gold' : 'btn-outline'}`}
              onClick={() => setLoginRole('player')}
            >
              Player Login
            </button>
            <button
              type="button"
              className={`btn btn-sm ${loginRole === 'captain' ? 'btn-gold' : 'btn-outline'}`}
              onClick={() => setLoginRole('captain')}
            >
              Captain Login
            </button>
          </div>
          <p className="text-xs text-muted mb-lg">Choose the correct access type before signing in.</p>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
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
              <div className="flex justify-between items-center">
                <label className="form-label">Password</label>
                <Link to="/forgot-password" className="auth-link text-xs">Forgot Password?</Link>
              </div>
              <div className="input-wrapper">
                <Lock className="input-icon-left" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
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

            <button type="submit" className="btn btn-gold btn-lg auth-submit-btn" disabled={loading}>
              {loading ? 'Logging In...' : 'Log In'}
            </button>
          </form>

          <div className="auth-footer text-center">
            <span className="text-muted text-sm">Don't have an account? </span>
            <Link to="/register" className="auth-link text-sm font-semi">Register Here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
