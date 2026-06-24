import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCollection, orderBy } from '../../firebase/firestore';
import { Trophy, Calendar, Users, Star, ArrowRight } from 'lucide-react';
import Loader from '../../components/common/Loader';
import SEO from '../../components/common/SEO';
import './Tournaments.css';

const getCleanLogoUrl = (url) => {
  if (!url) return '';
  const u = url.toLowerCase();
  if (u.startsWith('/logos/') && (u.endsWith('.jpg') || u.endsWith('.jpeg'))) {
    if (u.includes('trivabmonsoon') || u.includes('bapllogo') || u.includes('trivabsports')) {
      return url;
    }
    return url.replace(/\.(jpg|jpeg)$/i, '.png');
  }
  return url;
};

const getLogoClass = (logoUrl) => {
  if (!logoUrl) return '';
  const url = logoUrl.toLowerCase();
  if (url.includes('cloudinary') || url.includes('http')) return '';
  if (url.includes('xpress')) return 'logo-black-bg';
  if (url.includes('dads') && url.includes('pune')) return 'logo-white-bg';
  if (url.includes('dads')) return 'logo-white-bg';
  if (url.includes('baplt20') || url.includes('baplpune')) return 'logo-silver-bg';
  if (url.includes('corporate') || url.includes('monsoon')) return 'logo-white-bg';
  return '';
};

const needsDarkContainer = (logoUrl) => {
  if (!logoUrl) return false;
  const url = logoUrl.toLowerCase();
  return url.includes('xpress');
};

const TRIVAB_TOURNAMENT_CATEGORIES = [
  {
    id: 'bapl',
    name: 'BAPL 3.0 (BAPL T20)',
    logo: '/logos/baplt20north.png',
    description: 'BAPL is the flagship season-long cricket league designed to deliver a true season-long competitive experience, running from October to May and redefining amateur cricket in India.',
    to: '/tournaments/type/bapl',
    badge: 'Flagship League'
  },
  {
    id: 'baplxpress',
    name: 'BAPL XPRESS',
    logo: '/logos/baplxpresst20north.png',
    description: 'A compact, high-intensity version of our flagship BAPL league—designed to deliver the same professional playing experience in a shorter, more flexible format.',
    to: '/tournaments/type/baplxpress',
    badge: 'Compact T20'
  },
  {
    id: 'baplcorporate',
    name: 'BAPL Corporate CUP',
    logo: '/logos/baplcorporate.png',
    description: 'TRIVAB’s premier corporate-only cricket tournament. This closed-format competition brings organizations together through cricket, teamwork, and high-intensity sport.',
    to: '/tournaments/type/baplcorporate',
    badge: 'Corporate Only'
  },
  {
    id: 'trivab-monsoon',
    name: 'Trivab Monsoon Championship',
    logo: '/logos/trivabmonsoon.jpg',
    description: 'One of TRIVAB’s most unique formats, played in a single-day Test match format with red leather balls and white playing attire, reviving the purest form of cricket.',
    to: '/tournaments/trivab-monsoon',
    badge: 'Red-Ball Test'
  },
  {
    id: 'bapldads',
    name: 'BAPL 40+ DADS T20',
    logo: '/logos/bapldadst20.png',
    description: 'A specially curated cricketing format designed exclusively for players aged 40 and above, bringing fathers and seasoned cricket lovers back onto the field.',
    to: '/tournaments/type/bapldads',
    badge: 'Aged 40+'
  },
  {
    id: 'baplkids',
    name: 'BAPL KIDS',
    logo: '/logos/bapllogo.jpg',
    description: 'TRIVAB’s junior cricket platform, designed to provide young cricketers across age groups U-10 to U-19 with a structured, high-quality, and competitive developmental pathway.',
    to: '/tournaments/baplkids',
    badge: 'Junior Pathway'
  }
];

export default function TournamentList() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const list = await getCollection('tournaments', [orderBy('createdAt', 'desc')]);
        setTournaments((list || []).filter(t => t.isActivated !== false));
      } catch (err) {
        console.log('Using database fallback for active tournaments');
        setTournaments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, []);

  const tournamentsListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "TRIVAB Sports Cricket Tournaments",
    "description": "Explore the range of professional leather-ball cricket tournaments and leagues organized by TRIVAB Sports.",
    "url": "https://trivabsports.com/tournaments",
    "numberOfItems": 6,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "BAPL 3.0 (BAPL T20)",
        "description": "BAPL is the flagship season-long cricket league designed to deliver a true season-long competitive experience."
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "BAPL XPRESS",
        "description": "A compact, high-intensity version of our flagship BAPL league—designed to deliver the same professional playing experience in a shorter format."
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "BAPL Corporate CUP",
        "description": "TRIVAB's premier corporate-only cricket tournament."
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "Trivab Monsoon Championship",
        "description": "Red-ball cricket in a single-day Test match format, reviving the purest form of cricket."
      },
      {
        "@type": "ListItem",
        "position": 5,
        "name": "BAPL 40+ DADS T20",
        "description": "A specially curated cricketing format designed exclusively for players aged 40 and above."
      },
      {
        "@type": "ListItem",
        "position": 6,
        "name": "BAPL KIDS",
        "description": "TRIVAB's junior cricket platform for age groups U-10 to U-19."
      }
    ]
  };

  return (
    <div className="tournaments-page page-enter container section-padding">
      <SEO 
        title="Cricket Tournaments"
        description="Browse TRIVAB Sports cricket tournaments, including BAPL T20, BAPL Xpress, Corporate Cups, Monsoon Championships, and Dads 40+ leagues."
        keywords="TRIVAB Sports Tournaments, BAPL T20 Mumbai, corporate cricket cups, monsoon cricket championship, junior pathway cricket"
        schema={tournamentsListSchema}
      />
      <div className="section-header">
        <span className="section-label">Leagues</span>
        <h1 className="section-title">TRIVAB Sports <span className="text-gradient-gold">Tournaments</span></h1>
        <p className="section-subtitle">Browse through active, completed, or scheduled premier cricket tournaments.</p>
      </div>

      {/* 1. Category Grid */}
      <div className="mb-2xl">
        <h2 className="display-sm text-gradient-gold mb-xl text-center">Our Tournament Series</h2>
        <div className="grid grid-3 gap-xl">
          {TRIVAB_TOURNAMENT_CATEGORIES.map((item) => (
            <div className="card tournament-card-main border-top-gold" key={item.id}>
              <div className="flex justify-between items-start mb-md w-full">
                <span className="badge badge-gold">{item.badge}</span>
                <div className="tournament-list-logo-badge">
                  <img 
                    src={getCleanLogoUrl(item.logo)} 
                    alt={item.name} 
                  />
                </div>
              </div>

              <h3 className="display-xs text-gradient-gold mb-sm">{item.name}</h3>
              <p className="text-secondary text-sm mb-lg" style={{ minHeight: '80px', lineHeight: 1.6 }}>{item.description}</p>

              <Link to={item.to} className="btn btn-gold w-full text-center" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                Explore Tournament <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Active Seasons List */}
      {loading ? (
        <Loader />
      ) : tournaments.length > 0 ? (
        <div style={{ marginTop: 'var(--space-2xl)' }}>
          <h2 className="display-sm text-gradient-gold mb-xl text-center">Active Schedules &amp; Standings</h2>
          <div className="grid grid-3 gap-xl">
            {tournaments.map((t) => (
              <div className="card tournament-card-main border-top-gold" key={t.id} style={{ background: 'var(--bg-secondary)' }}>
                <div className="flex justify-between items-center mb-sm">
                  <span className={`badge ${t.status === 'Live' ? 'badge-red' : t.status === 'Upcoming' ? 'badge-gold' : 'badge-green'}`}>
                    {t.status}
                  </span>
                  <span className="text-xs text-muted font-bold flex items-center gap-xs">
                    <Calendar size={12} /> {t.date || 'TBD'}
                  </span>
                </div>

                <h3 className="display-sm text-gradient-gold mb-sm">{t.name}</h3>
                <p className="text-secondary text-sm mb-lg line-clamp-3">{t.description}</p>

                <div className="flex justify-between items-center mb-lg bg-primary py-xs px-sm rounded">
                  <span className="text-xs text-muted font-semi flex items-center gap-xs">
                    <Users size={14} /> {t.teamCount || 10} Teams
                  </span>
                  <span className="text-xs text-gold font-bold">T20 Format</span>
                </div>

                <Link to={`/tournaments/${t.id}`} className="btn btn-outline w-full text-center" style={{ display: 'flex' }}>
                  View Roster &amp; Schedule <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
