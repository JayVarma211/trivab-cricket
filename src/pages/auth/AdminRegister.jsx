import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import './Auth.css';

export default function AdminRegister() {
  return (
    <div className="auth-page page-enter">
      <div className="orb orb-gold spline-float-1" style={{ top: '5%', right: '5%', width: '400px', height: '400px' }} />
      <div className="orb orb-navy spline-float-2" style={{ bottom: '5%', left: '5%', width: '500px', height: '500px' }} />

      <div className="container auth-container">
        <div className="auth-card card-gold register-card">
          <div className="auth-header">
            <div className="auth-logo" style={{ color: 'var(--gold)' }}>
              <Shield size={28} />
            </div>
            <h2 className="display-sm text-gradient-gold">Admin Registration Disabled</h2>
            <p className="text-secondary text-sm">Admin access is restricted to the fixed admin sign-in account.</p>
          </div>

          <div className="alert alert-error">
            <strong>Registration is disabled.</strong>
            <p>Please use the permanent admin credentials at the admin login page.</p>
          </div>

          <div className="auth-footer text-center">
            <Link to="/admin/login" className="btn btn-gold btn-lg w-full mt-md">
              Go to Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
