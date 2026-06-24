import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCollection, limit } from '../firebase/firestore';
import { Trophy, Calendar, ShieldCheck, Sparkles, ArrowRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import SEO from '../components/common/SEO';
import './Home.css';

const TICKER_LOGOS = [
  { src: '/logos/baplt20north.png', alt: 'BAPL T20 North', imgClass: 'ticker-logo-silver', dark: false, link: '/tournaments/bapl-north' },
  { src: '/logos/baplxpresst20south.png', alt: 'BAPL Xpress South', imgClass: 'ticker-logo-silver', dark: false, link: '/tournaments/baplxpress-south' },
  { src: '/logos/baplcorporate.png', alt: 'BAPL Corporate Cup', imgClass: 'ticker-logo-silver', dark: false, link: '/tournaments/baplcorporate-south' },
  { src: '/logos/baplt20south.png', alt: 'BAPL T20 South', imgClass: 'ticker-logo-silver', dark: false, link: '/tournaments/bapl-south' },
  { src: '/logos/baplxpresst20north.png', alt: 'BAPL Xpress North', imgClass: 'ticker-logo-silver', dark: false, link: '/tournaments/baplxpress-north' },
  { src: '/logos/bapldadst20.png', alt: 'BAPL Dads T20', imgClass: 'ticker-logo-silver', dark: false, link: '/tournaments/bapldads-south' },
  { src: '/logos/baplpune.png', alt: 'BAPL T20 Pune', imgClass: 'ticker-logo-silver', dark: false, link: '/tournaments' },
  { src: '/logos/trivabmonsoon.jpg', alt: 'Trivab Monsoon', imgClass: 'ticker-logo-white', dark: false, link: '/tournaments/trivab-monsoon' },
  { src: '/logos/baplxpresst20puneedition.png', alt: 'BAPL Xpress Pune', imgClass: 'ticker-logo-silver', dark: false, link: '/tournaments' },
  { src: '/logos/baplcorporatepuneedition.png', alt: 'BAPL Corporate Pune', imgClass: 'ticker-logo-silver', dark: false, link: '/tournaments' },
  { src: '/logos/bapldadst20puneedition.png', alt: 'BAPL Dads Pune', imgClass: 'ticker-logo-silver', dark: false, link: '/tournaments' }
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
        const tourn = await getCollection('tournaments');
        const activeTourns = (tourn || []).filter(t => t.isActivated !== false);
        setRecentTournaments(diversifyTournaments(activeTourns).slice(0, 3));
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

  const homeSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SportsOrganization",
        "@id": "https://trivabsports.com/#organization",
        "name": "TRIVAB Sports",
        "alternateName": "TRIVAB Sports & Events",
        "url": "https://trivabsports.com",
        "logo": "https://trivabsports.com/logos/trivabsports.webp",
        "sameAs": [
          "https://www.instagram.com/baplcricket",
          "https://www.youtube.com/@baplcricket"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "email": "trivabsports@gmail.com",
          "contactType": "customer service",
          "areaServed": "IN",
          "availableLanguage": ["en", "hi"]
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://trivabsports.com/#website",
        "url": "https://trivabsports.com",
        "name": "TRIVAB Sports",
        "publisher": {
          "@id": "https://trivabsports.com/#organization"
        }
      }
    ]
  };

  return (
    <div className="home-page page-enter">
      <SEO 
        title=""
        description="TRIVAB Sports is the ultimate leather-ball cricket tournament and match management platform. Explore match schedules, register player profiles, track stats, and experience elite cricket."
        keywords="TRIVAB Sports, cricket tournament, tournament management, team management, player registration, sports platform, leather-ball cricket, local cricket league"
        schema={homeSchema}
      />
      {/* Hero Section */}
      <section className="hero-section">
        {/* Decorative Orbs — original hero background */}
        <div className="orb orb-1" aria-hidden="true" />
        <div className="orb orb-2" aria-hidden="true" />

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
              TRIVAB Sports <br />
              <span className="text-gradient-gold">Your Game, Our Stage</span>
            </motion.h1>
            
            <motion.p className="hero-subtitle text-secondary" variants={fadeInUp}>
              Providing passionate amateur cricketers with a professional platform to experience the true spirit of competitive leather-ball cricket. Driven by technology, transparency, and top-tier operations, we bring the excitement, intensity, and prestige of elite cricket directly to you.
            </motion.p>
            
            <motion.div className="hero-actions" variants={fadeInUp}>
              <Link to="/register" className="btn btn-gold btn-lg">
                Join Now <ArrowRight size={18} />
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
                <Link to={logo.link} key={`l1-${idx}`} style={{ cursor: 'pointer', display: 'inline-flex', textDecoration: 'none' }}>
                  <span className={`tournament-ticker-logo-wrap${logo.dark ? ' dark-frame' : ''}`}>
                    <img src={logo.src} alt={logo.alt} className={`ticker-logo-img-inner ${logo.imgClass}`} />
                  </span>
                </Link>
              ))}
              {/* Duplicate for infinite effect */}
              {TICKER_LOGOS.map((logo, idx) => (
                <Link to={logo.link} key={`l2-${idx}`} style={{ cursor: 'pointer', display: 'inline-flex', textDecoration: 'none' }}>
                  <span className={`tournament-ticker-logo-wrap${logo.dark ? ' dark-frame' : ''}`}>
                    <img src={logo.src} alt={logo.alt} className={`ticker-logo-img-inner ${logo.imgClass}`} />
                  </span>
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

function diversifyTournaments(list) {
  if (!list || list.length <= 1) return list;
  
  const groups = {
    bapl: [],
    corporate: [],
    xpress: [],
    kids: [],
    other: []
  };
  
  list.forEach(t => {
    const id = t.id.toLowerCase();
    if (id.includes('corporate')) {
      groups.corporate.push(t);
    } else if (id.includes('xpress')) {
      groups.xpress.push(t);
    } else if (id.includes('kids') || id.includes('dads')) {
      groups.kids.push(t);
    } else if (id.startsWith('bapl')) {
      groups.bapl.push(t);
    } else {
      groups.other.push(t);
    }
  });
  
  const result = [];
  const maxLen = Math.max(
    groups.bapl.length,
    groups.corporate.length,
    groups.xpress.length,
    groups.kids.length,
    groups.other.length
  );
  
  for (let i = 0; i < maxLen; i++) {
    if (groups.bapl[i]) result.push(groups.bapl[i]);
    if (groups.corporate[i]) result.push(groups.corporate[i]);
    if (groups.xpress[i]) result.push(groups.xpress[i]);
    if (groups.kids[i]) result.push(groups.kids[i]);
    if (groups.other[i]) result.push(groups.other[i]);
  }
  
  return result;
}
