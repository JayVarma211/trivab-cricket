import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../../firebase/auth';
import { Mail, AlertCircle, ArrowLeft, Trophy } from 'lucide-react';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await resetPassword(email);
      setMessage('Password reset link sent to your email. Check spam folder if not received.');
    } catch (err) {
      setError(err.message || 'Failed to send reset link.');
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
              <img src="/logos/trivabsports.jpg" alt="TRIVAB SPORTS" />
            </div>
            <h2 className="display-sm text-gradient-gold">Reset Password</h2>
            <p className="text-secondary text-sm">Reset password instructions will be sent via email</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="alert alert-success">
              <span>{message}</span>
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

            <button type="submit" className="btn btn-gold btn-lg auth-submit-btn" disabled={loading}>
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="auth-footer text-center">
            <Link to="/login" className="back-to-login">
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
