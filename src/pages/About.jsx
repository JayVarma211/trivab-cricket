import { Trophy, ShieldCheck, Mail, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="about-page page-enter container section-padding">
      <div className="section-header">
        <span className="section-label">Our Story</span>
        <h1 className="section-title">About <span className="text-gradient-gold">TRIVAB</span></h1>
        <p className="section-subtitle">A digital-first platform reinventing local cricket management</p>
      </div>

      <div className="grid grid-2 gap-xl items-center" style={{ marginBottom: 'var(--space-3xl)' }}>
        <div className="animate-fade-in-left">
          <h2 className="display-sm mb-md text-gradient-gold">The Sports-Tech Vision</h2>
          <p className="text-secondary mb-md">
            TRIVAB Cricket Management Platform was founded in 2026 to bridge the gap between amateur leagues and professional tournament standards. We believe that every cricket match, regardless of division, deserves elite tracking, transparent schedules, and official player certification.
          </p>
          <p className="text-secondary mb-lg">
            Our app offers a mobile-first digital environment where captains can optimize player caps, admins can coordinate matches across venues, and players receive unique, QR-verified digital player identification cards.
          </p>
          <Link to="/register" className="btn btn-gold">
            Register Now <ArrowRight size={16} />
          </Link>
        </div>

        <div className="card card-gold animate-fade-in-right">
          <h3 className="text-lg font-bold mb-md text-gradient-gold">Why Choose TRIVAB?</h3>
          <ul className="flex flex-col gap-md">
            <li className="flex gap-sm items-start">
              <div className="text-gold" style={{ marginTop: '3px' }}><ShieldCheck size={18} /></div>
              <div>
                <strong className="text-sm">Roster Integrity (Max 35)</strong>
                <p className="text-xs text-muted">Enforced player limits ensure fair play across all competing squads.</p>
              </div>
            </li>
            <li className="flex gap-sm items-start">
              <div className="text-gold" style={{ marginTop: '3px' }}><Trophy size={18} /></div>
              <div>
                <strong className="text-sm">MVP Leaderboards</strong>
                <p className="text-xs text-muted">Advanced statistics engine tracking runs, wickets, strike rate, and catches.</p>
              </div>
            </li>
            <li className="flex gap-sm items-start">
              <div className="text-gold" style={{ marginTop: '3px' }}><Users size={18} /></div>
              <div>
                <strong className="text-sm">Captain Permissions</strong>
                <p className="text-xs text-muted">Custom captains database allows managers to run roster information smoothly.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="divider" style={{ margin: 'var(--space-3xl) 0' }} />

      <div className="text-center">
        <h2 className="display-sm mb-sm text-gradient-gold">Ready to Elevate Your Tournament?</h2>
        <p className="text-secondary max-width-600 mb-lg" style={{ margin: '0 auto var(--space-lg)' }}>
          Whether you are a player seeking an official ID, a captain managing a roster, or a sponsor looking to showcase your brand, TRIVAB has custom dashboards for you.
        </p>
        <div className="flex justify-center gap-md">
          <Link to="/contact" className="btn btn-outline">Talk to Support</Link>
          <Link to="/login" className="btn btn-gold">Platform Login</Link>
        </div>
      </div>
    </div>
  );
}
