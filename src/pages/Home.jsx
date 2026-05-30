import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCollection, limit, orderBy } from '../firebase/firestore';
import { Trophy, Calendar, ShieldCheck, Sparkles, ArrowRight, Star, Heart, CheckCircle2 } from 'lucide-react';
import './Home.css';

export default function Home() {
  const [recentTournaments, setRecentTournaments] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [stats, setStats] = useState({
    players: '1,200+',
    tournaments: '15+',
    teams: '32',
    matches: '480+'
  });

  useEffect(() => {
    // Attempt loading mock/live data
    const fetchHomeData = async () => {
      try {
        const tourn = await getCollection('tournaments', [limit(3)]);
        setRecentTournaments(tourn);
        const matches = await getCollection('matches', [limit(3)]);
        setUpcomingMatches(matches);
      } catch (e) {
        console.log('Using default landing page items due to db config');
        // Fallback default state
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

  return (
    <div className="home-page page-enter">
      {/* Hero Section */}
      <section className="hero-section bg-gradient-animated">
        <div className="orb orb-gold" style={{ top: '10%', left: '15%', width: '400px', height: '400px' }} />
        <div className="orb orb-blue" style={{ bottom: '15%', right: '10%', width: '500px', height: '500px' }} />

        <div className="container hero-container">
          <div className="hero-content animate-fade-in-up">
            <span className="section-label">
              <Sparkles size={14} /> The Elite Cricket Suite
            </span>
            <h1 className="display-2xl hero-title">
              Manage Cricket <br />
              <span className="text-gradient-gold">Tournaments & Teams</span>
            </h1>
            <p className="hero-subtitle text-secondary">
              TRIVAB is a professional sports-tech management suite built to empower admins, team captains, and players with automatic Digital ID generation, real-time match scheduling, QR code verification, and MVP stats.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-gold btn-lg">
                Join As Player <ArrowRight size={18} />
              </Link>
              <Link to="/tournaments" className="btn btn-outline btn-lg">
                Browse Tournaments
              </Link>
            </div>
          </div>

          <div className="hero-image-container animate-fade-in-right">
            {/* Visual placeholder rendering interactive interface simulation */}
            <div className="premium-showcase-card card">
              <div className="showcase-header">
                <div className="live-dot"><span className="text-xs font-bold text-red">LIVE</span></div>
                <span className="text-xs text-muted">CRICKET CHAMPIONSHIP</span>
              </div>
              <div className="showcase-match-row">
                <div className="team-col">
                  <div className="team-badge-sim">MUM</div>
                  <span className="team-name-sim">Mumbai</span>
                </div>
                <div className="score-col">
                  <span className="score-sim text-gradient-gold">172 / 4</span>
                  <span className="overs-sim text-muted">18.4 Overs</span>
                </div>
                <div className="vs-col text-muted font-bold">VS</div>
                <div className="team-col">
                  <div className="team-badge-sim" style={{ background: '#1E4DB7' }}>DEL</div>
                  <span className="team-name-sim">Delhi</span>
                </div>
              </div>
              <div className="divider" style={{ margin: '15px 0' }} />
              <div className="showcase-id-teaser">
                <div className="mini-id-card">
                  <div className="mini-avatar" />
                  <div className="mini-details">
                    <span className="text-xs font-bold">Rohan Sharma</span>
                    <span className="text-xxs text-muted">ID: TRIVAB-MUM-2026-9812</span>
                  </div>
                  <div className="mini-qr" />
                </div>
                <p className="text-xs text-secondary text-center">
                  ✨ Instant Digital player ID card generation with secure QR verification on the spot.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="stats-strip container section-padding-sm">
        <div className="grid grid-4 gap-lg">
          <div className="stat-card">
            <div className="stat-icon"><Trophy size={20} /></div>
            <span className="stat-value">{stats.tournaments}</span>
            <span className="stat-label">Tournaments Hosted</span>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Star size={20} /></div>
            <span className="stat-value">{stats.players}</span>
            <span className="stat-label">Registered Players</span>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Calendar size={20} /></div>
            <span className="stat-value">{stats.matches}</span>
            <span className="stat-label">Matches Completed</span>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><ShieldCheck size={20} /></div>
            <span className="stat-value">{stats.teams}</span>
            <span className="stat-label">Active Cricket Teams</span>
          </div>
        </div>
      </section>

      {/* Feature Blocks */}
      <section className="features-section container section-padding">
        <div className="section-header">
          <span className="section-label">Features</span>
          <h2 className="section-title">Designed For Elite Tournaments</h2>
          <p className="section-subtitle">Take your cricket tournament to the next tier with robust management workflows.</p>
        </div>

        <div className="grid grid-3 gap-xl">
          <div className="card feature-box">
            <div className="feature-icon"><AwardIcon /></div>
            <h3 className="display-sm text-gradient-gold">Digital Player ID Card</h3>
            <p className="text-secondary text-sm">
              Register profiles online. Automatically obtain a digital cricket passport card with player picture, jersey number, and credentials.
            </p>
          </div>
          <div className="card feature-box">
            <div className="feature-icon"><QrIcon /></div>
            <h3 className="display-sm text-gradient-gold">QR Verification</h3>
            <p className="text-secondary text-sm">
              Organizers scan QR codes directly from the app interface to instantly verify player profiles and team rosters on match days.
            </p>
          </div>
          <div className="card feature-box">
            <div className="feature-icon"><TeamIcon /></div>
            <h3 className="display-sm text-gradient-gold">Team Cap Trackers</h3>
            <p className="text-secondary text-sm">
              Captain-specific databases track registration caps (up to 35 players) and automatically block surplus submissions when rosters fill.
            </p>
          </div>
        </div>
      </section>

      {/* Sponsors Horizontal Strip */}
      <section className="sponsors-ticker section-padding-sm bg-secondary">
        <div className="container">
          <h4 className="text-center text-muted text-xs font-bold uppercase tracking-wider mb-sm">
            Supported by top-tier Sponsors
          </h4>
          <div className="ticker-wrap">
            <div className="ticker-content gap-xl flex">
              <span className="ticker-logo">🏅 APEX SPORTS</span>
              <span className="ticker-logo">🏏 GOLDEN BAT LTD</span>
              <span className="ticker-logo">🥤 CRICKET ENERGY</span>
              <span className="ticker-logo">🏆 TRIVAB GLOBAL</span>
              <span className="ticker-logo">⚡ ACTIVE PRO</span>
              {/* Duplicate for infinite effect */}
              <span className="ticker-logo">🏅 APEX SPORTS</span>
              <span className="ticker-logo">🏏 GOLDEN BAT LTD</span>
              <span className="ticker-logo">🥤 CRICKET ENERGY</span>
              <span className="ticker-logo">🏆 TRIVAB GLOBAL</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tournaments Grid Snippet */}
      <section className="recent-tournaments-section container section-padding">
        <div className="flex justify-between items-end mb-lg">
          <div>
            <span className="section-label">Tournaments</span>
            <h2 className="display-md">Active Tournaments</h2>
          </div>
          <Link to="/tournaments" className="btn btn-outline btn-sm">
            View All Tournaments
          </Link>
        </div>

        <div className="grid grid-3 gap-lg">
          {recentTournaments.map((t) => (
            <div className="card tournament-summary-card" key={t.id}>
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
            </div>
          ))}
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
