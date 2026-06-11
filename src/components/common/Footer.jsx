import { Link } from 'react-router-dom';
import { Trophy, Mail, Phone, MapPin, Instagram, Twitter, Youtube, Facebook } from 'lucide-react';
import './Footer.css';

const QUICK_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/tournaments', label: 'Tournaments' },
  { to: '/schedule', label: 'Match Schedule' },
  { to: '/sponsors', label: 'Sponsors' },
];

const PLAYER_LINKS = [
  { to: '/register', label: 'Register as Player' },
  { to: '/login', label: 'Player Login' },
  { to: '/news', label: 'News & Events' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact Us' },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top container">
        <div className="footer-brand">
          <Link to="/" className="footer-logo-container">
            <img src="/logos/trivabsports.webp" className="footer-logo-img" alt="TRIVAB SPORTS" />
          </Link>
          <p className="footer-tagline">
            The ultimate cricket management platform for teams, players, captains, and administrators.
          </p>
          <div className="footer-socials">
            <a href="https://www.instagram.com/baplcricket?igsh=NHQ2dWM0Y3Z5dnBj" target="_blank" rel="noreferrer" className="social-btn" aria-label="Instagram"><Instagram size={18} /></a>
            <a href="https://www.youtube.com/@baplcricket?si=dVnUedGn8K7gAmtP" target="_blank" rel="noreferrer" className="social-btn" aria-label="YouTube"><Youtube size={18} /></a>
          </div>
        </div>

        <div className="footer-links-group">
          <h4 className="footer-col-title">Quick Links</h4>
          <ul>
            {QUICK_LINKS.map(({ to, label }) => (
              <li key={to}><Link to={to} className="footer-link">{label}</Link></li>
            ))}
          </ul>
        </div>

        <div className="footer-links-group">
          <h4 className="footer-col-title">Players</h4>
          <ul>
            {PLAYER_LINKS.map(({ to, label }) => (
              <li key={to}><Link to={to} className="footer-link">{label}</Link></li>
            ))}
          </ul>
        </div>

        <div className="footer-contact-group">
          <h4 className="footer-col-title">Contact</h4>
          <ul className="contact-list">
            <li>
              <Mail size={16} />
              <a href="mailto:trivabsportsandevents@gmail.com" className="footer-link">trivabsportsandevents@gmail.com</a>
            </li>
            <li>
              <Phone size={16} />
              <a href="tel:+919930344130" className="footer-link">+91 99303 44130</a>
            </li>
            <li>
              <MapPin size={16} />
              <span className="footer-link">B202, Raj Heights, MG Road<br />Kandivali West, Mumbai 400067,<br />Maharashtra, India</span>
            </li>
          </ul>
          <div className="footer-badge">
            <span>🏏</span> Powered by TRIVAB Platform
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p className="footer-copy">
            &copy; 2026 TRIVAB SPORTS AND EVENTS. All rights reserved.
          </p>
          <div className="footer-bottom-links">
            <a href="#" className="footer-link">Privacy Policy</a>
            <span className="footer-sep">·</span>
            <a href="#" className="footer-link">Terms of Service</a>
            <span className="footer-sep">·</span>
            <a href="#" className="footer-link">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
