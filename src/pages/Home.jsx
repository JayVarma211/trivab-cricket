import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCollection, limit } from '../firebase/firestore';
import { Trophy, Calendar, ShieldCheck, Sparkles, ArrowRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import './Home.css';

const TICKER_LOGOS = [
  { src: '/logos/baplt20north.jpg', alt: 'BAPL North', class: 'logo-white-bg', link: '/tournaments/bapl-north' },
  { src: '/logos/baplt20south.jpg', alt: 'BAPL South', class: 'logo-white-bg', link: '/tournaments/bapl-south' },
  { src: '/logos/baplxpresst20north.jpg', alt: 'BAPL Xpress North', class: 'logo-black-bg', link: '/tournaments/baplxpress-north' },
  { src: '/logos/baplxpresst20south.jpg', alt: 'BAPL Xpress South', class: 'logo-black-bg', link: '/tournaments/baplxpress-south' },
  { src: '/logos/baplcorporate.jpg', alt: 'BAPL Corporate', class: 'logo-white-bg', link: '/tournaments/baplcorporate-south' },
  { src: '/logos/bapldadst20.jpg', alt: 'BAPL Dads', class: 'logo-black-bg', link: '/tournaments/bapldads-south' },
  { src: '/logos/trivabmonsoon.jpg', alt: 'Trivab Monsoon', class: 'logo-white-bg', link: '/tournaments/trivab-monsoon' },
  { src: '/logos/baplpune.jpg', alt: 'BAPL Pune', class: 'logo-white-bg', link: '/tournaments' },
  { src: '/logos/baplxpresst20puneedition.jpg', alt: 'BAPL Xpress Pune', class: 'logo-black-bg', link: '/tournaments' },
  { src: '/logos/baplcorporatepuneedition.jpg', alt: 'BAPL Corporate Pune', class: 'logo-white-bg', link: '/tournaments' },
  { src: '/logos/bapldadst20puneedition.jpg', alt: 'BAPL Dads Pune', class: 'logo-black-bg', link: '/tournaments' }
];

export default function Home() {
  const [recentTournaments, setRecentTournaments] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [stats] = useState({
    players: '2,000+',
    tournaments: '55+',
    teams: '73',
    matches: '3,050+'
  });

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const tourn = await getCollection('tournaments', [limit(3)]);
        setRecentTournaments(tourn);
        const matches = await getCollection('matches', [limit(3)]);
        setUpcomingMatches(matches);
      } catch (e) {
        console.log('Using default landing page items due to db config');
        setRecentTournaments([
          { id: 't1', name: 'Champions Cup 2026', status: 'Live', description: 'Elite T20 faceoff' },
          { id: 't2', name: 'Under-25 Premier League', status: 'Upcoming', description: 'Next-gen talent show' },
          { id: 't3', name: 'Corporate Shield Trophy', status: 'Completed', description: 'Corporate cricket showdown' },
        ]);
        setUpcomingMatches([
          { id: 'm1', teamA: 'Mumbai Knights', teamB: 'Delhi Dynamos', date: '31st May 2026', time: '18:30 IST', venue: 'Wankhede Stadium', status: 'Upcoming' },
          { id: 'm2', teamA: 'Chennai Super Kings', teamB: 'Kolkata Warriors', date: '1st June 2026', time: '16:00 IST', venue: 'Chepauk Stadium', status: 'Upcoming' }
        ]);
      }
    };
    fetchHomeData();
  }, []);

  // Framer Motion Animation Variants
  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.15 }
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  const scaleUp = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  return (
    <div className="home-page page-enter">
      {/* Hero Section */}
      <section className="hero-section bg-gradient-animated">
        {/* Animated Background Effects */}
        <div className="floating-ambient-particles">
          <div className="particle p1" />
          <div className="particle p2" />
          <div className="particle p3" />
        </div>

        <div className="orb orb-gold spline-float-1" style={{ top: '10%', left: '15%', width: '400px', height: '400px' }} />
        <div className="orb orb-blue spline-float-2" style={{ bottom: '15%', right: '10%', width: '500px', height: '500px' }} />

        <div className="container hero-container centered">
          <motion.div 
            className="hero-content"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.span className="section-label" variants={fadeInUp}>
              <Sparkles size={14} /> TRIVAB Sports &amp; Events
            </motion.span>
            
            <motion.h1 className="display-2xl hero-title" variants={fadeInUp}>
              Your Game, <br />
              <span className="text-gradient-gold">Our Stage</span>
            </motion.h1>
            
            <motion.p className="hero-subtitle text-secondary" variants={fadeInUp}>
              Providing passionate amateur cricketers with a professional platform to experience the true spirit of competitive leather-ball cricket. Driven by technology, transparency, and top-tier operations, we bring the excitement, intensity, and prestige of elite cricket directly to you.
            </motion.p>
            
            <motion.div className="hero-actions" variants={fadeInUp}>
              <Link to="/register" className="btn btn-gold btn-lg">
                Join As Player <ArrowRight size={18} />
              </Link>
              <Link to="/tournaments" className="btn btn-outline btn-lg">
                Browse Tournaments
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="stats-strip container section-padding-sm">
        <motion.div 
          className="grid grid-4 gap-lg"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          <motion.div className="stat-card" variants={fadeInUp}>
            <div className="stat-icon"><Trophy size={20} /></div>
            <span className="stat-value">{stats.tournaments}</span>
            <span className="stat-label">Tournaments Hosted</span>
          </motion.div>
          <motion.div className="stat-card" variants={fadeInUp}>
            <div className="stat-icon"><Star size={20} /></div>
            <span className="stat-value">{stats.players}</span>
            <span className="stat-label">Registered Players</span>
          </motion.div>
          <motion.div className="stat-card" variants={fadeInUp}>
            <div className="stat-icon"><Calendar size={20} /></div>
            <span className="stat-value">{stats.matches}</span>
            <span className="stat-label">Matches Completed</span>
          </motion.div>
          <motion.div className="stat-card" variants={fadeInUp}>
            <div className="stat-icon"><ShieldCheck size={20} /></div>
            <span className="stat-value">{stats.teams}</span>
            <span className="stat-label">Active Cricket Teams</span>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature Blocks */}
      <section className="features-section container section-padding">
        <div className="section-header">
          <span className="section-label">Features</span>
          <h2 className="section-title">Designed For Elite Tournaments</h2>
          <p className="section-subtitle">Take your cricket tournament to the next tier with robust management workflows.</p>
        </div>

        <motion.div 
          className="grid grid-3 gap-xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={containerVariants}
        >
          <motion.div className="card feature-box" variants={scaleUp} whileHover={{ y: -5 }}>
            <div className="feature-icon"><AwardIcon /></div>
            <h3 className="display-sm text-gradient-gold">Digital Player ID Card</h3>
            <p className="text-secondary text-sm">
              Register profiles online. Automatically obtain a digital cricket passport card with player picture, jersey number, and credentials.
            </p>
          </motion.div>
          <motion.div className="card feature-box" variants={scaleUp} whileHover={{ y: -5 }}>
            <div className="feature-icon"><QrIcon /></div>
            <h3 className="display-sm text-gradient-gold">QR Verification</h3>
            <p className="text-secondary text-sm">
              Organizers scan QR codes directly from the app interface to instantly verify player profiles and team rosters on match days.
            </p>
          </motion.div>
          <motion.div className="card feature-box" variants={scaleUp} whileHover={{ y: -5 }}>
            <div className="feature-icon"><TeamIcon /></div>
            <h3 className="display-sm text-gradient-gold">Team Cap Trackers</h3>
            <p className="text-secondary text-sm">
              Captain-specific databases track registration caps (up to 40 players) and automatically block surplus submissions when rosters fill.
            </p>
          </motion.div>
        </motion.div>
      </section>



      {/* Tournaments Horizontal Strip */}
      <section className="tournaments-ticker section-padding-sm" style={{ borderTop: '1px solid var(--border-card)', background: 'var(--bg-primary)' }}>
        <div className="container">
          <h4 className="text-center text-muted text-xs font-bold uppercase tracking-wider mb-sm" style={{ color: 'var(--gold)' }}>
            Our Tournaments
          </h4>
          <div className="ticker-wrap">
            <div className="ticker-content gap-xl flex items-center animate-marquee">
              {TICKER_LOGOS.map((logo, idx) => (
                <Link to={logo.link} key={`l1-${idx}`} className="tournament-ticker-frame" style={{ cursor: 'pointer' }}>
                  <img src={logo.src} alt={logo.alt} className={`tournament-ticker-img ${logo.class}`} />
                </Link>
              ))}
              {/* Duplicate for infinite effect */}
              {TICKER_LOGOS.map((logo, idx) => (
                <Link to={logo.link} key={`l2-${idx}`} className="tournament-ticker-frame" style={{ cursor: 'pointer' }}>
                  <img src={logo.src} alt={logo.alt} className={`tournament-ticker-img ${logo.class}`} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tournaments Grid Snippet */}
      <section className="recent-tournaments-section container section-padding">
        <div className="section-header">
          <span className="section-label">Tournaments</span>
          <h2 className="section-title">Active Tournaments</h2>
          <p className="section-subtitle">Stay updated with our ongoing and upcoming tournaments.</p>
        </div>

        <motion.div 
          className="grid grid-3 gap-lg"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={containerVariants}
        >
          {recentTournaments.map((t) => (
            <motion.div className="card tournament-summary-card" key={t.id} variants={fadeInUp} whileHover={{ y: -5 }}>
              <div className="flex justify-between items-start mb-sm">
                <span className={`badge ${t.status === 'Live' ? 'badge-red' : t.status === 'Upcoming' ? 'badge-gold' : 'badge-green'}`}>
                  {t.status}
                </span>
              </div>
              <h3 className="text-lg font-bold mb-xs">{t.name}</h3>
              <p className="text-muted text-sm mb-md">{t.description}</p>
              <Link to={`/tournaments/${t.id}`} className="btn btn-navy btn-sm" style={{ width: '100%' }}>
                Tournament Details
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex justify-center mt-xl">
          <Link to="/tournaments" className="btn btn-outline btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            View All Tournaments <ArrowRight size={18} />
          </Link>
        </div>
      </section>

    </div>
  );
}

// Inline Icons for aesthetic ease
function AwardIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

// Inline Icons for QR
function QrIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

// Inline Icons for Team
function TeamIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
