import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCollection } from '../../firebase/firestore';
import { Trophy, Calendar, Users, MapPin, ArrowRight, ChevronRight } from 'lucide-react';
import Loader from '../../components/common/Loader';
import SEO from '../../components/common/SEO';
import './TournamentTypeDetails.css';

const PARENT_TOURNAMENTS = {
  'bapl': {
    name: 'BAPL 3.0 – The Flagship Cricket League',
    description: `Founded in 2023, BAPL was born from a simple yet revolutionary idea by one of the founder Ankit Shah. He questioned the traditional short-format tournaments where momentum is lost just as teams begin to peak—“Why not create a league that runs through an entire cricketing season?”

This vision led to the creation of BAPL, an extended-format cricket league designed to deliver a true season-long competitive experience, running from October to May and redefining amateur cricket in India.

BAPL is not just a tournament—it is a full-season cricketing experience built for serious amateur cricketers.`,
    logo: '/logos/baplt20north.png',
    highlights: [
      '20+ competitive teams',
      '8-month long professional league format',
      'Fully structured, professional tournament execution',
      'Select outstation match experiences',
      '16–18 matches per team per season',
      'Player kits, goodies, and official deliverables',
      'On-ground meals and refreshments for players',
      'Dedicated team managers for each squad',
      'HD live streaming and match broadcasting',
      'Multiple awards and recognitions in every match',
      '12–14 premium quality cricket grounds',
      'Grand opening ceremony and league night event'
    ],
    editions: [
      { id: 'bapl-north', name: 'BAPL 3.0 - North Mumbai Edition', logo: '/logos/baplt20north.png', description: 'North Mumbai Edition of the premier BAPL 3.0 League.', location: 'North Mumbai Grounds', comingSoon: false },
      { id: 'bapl-south', name: 'BAPL 3.0 - South Mumbai Edition', logo: '/logos/baplt20south.png', description: 'South Mumbai Edition of the premier BAPL 3.0 League.', location: 'South Mumbai', comingSoon: true },
      { id: 'bapl-pune', name: 'BAPL 3.0 - Pune Edition', logo: '/logos/baplpune.png', description: 'Pune Edition of the premier BAPL 3.0 League.', location: 'Pune', comingSoon: true },
    ]
  },
  'baplxpress': {
    name: 'BAPL XPRESS',
    description: `BAPL XPRESS is a compact, high-intensity version of our flagship BAPL league—designed to deliver the same professional cricketing experience in a shorter, more flexible format.

Tailored for teams and players who are unable to commit to a full-season tournament due to work or travel constraints, BAPL XPRESS retains the core structure, quality, and competitive spirit of BAPL in a streamlined schedule.

BAPL XPRESS delivers the complete TRIVAB experience—just faster, sharper, and more accessible`,
    logo: '/logos/baplxpresst20north.png',
    highlights: [
      '8–10 competitive teams',
      'Fast-paced T20 format',
      '9 -11 matches per team',
      '10–12 premium quality cricket grounds',
      'Multiple awards and recognitions in every match',
      'Player kits, goodies, and official deliverables',
      'HD live streaming and match broadcasting',
      'On-ground meals and refreshments for players',
      'Grand opening ceremony and league night event',
      'Professional tournament setup and execution',
      'Ideal for working professionals and compact team groups'
    ],
    editions: [
      { id: 'baplxpress-north', name: 'BAPL XPRESS - North Mumbai Edition', logo: '/logos/baplxpresst20north.png', description: 'North Mumbai Edition of the fast-paced BAPL XPRESS League.', location: 'North Mumbai Turfs', comingSoon: false },
      { id: 'baplxpress-south', name: 'BAPL XPRESS - South Mumbai Edition', logo: '/logos/baplxpresst20south.png', description: 'South Mumbai Edition of the fast-paced BAPL XPRESS League.', location: 'South Mumbai Turfs', comingSoon: true },
      { id: 'baplxpress-pune', name: 'BAPL XPRESS - Pune Edition', logo: '/logos/baplxpresst20puneedition.png', description: 'Pune Edition of the fast-paced BAPL XPRESS League.', location: 'Pune', comingSoon: true },
    ]
  },
  'baplcorporate': {
    name: 'BAPL Corporate Cup',
    description: `The BAPL Corporate Cup is TRIVAB’s premier corporate-only cricket tournament, designed exclusively for teams representing individual companies. This closed-format competition brings organizations together through cricket, teamwork, and high-intensity competitive sport.

Built on the same professional structure as the BAPL ecosystem, the Corporate Cup delivers a premium matchday experience where corporates engage, compete, and strengthen workplace camaraderie beyond office walls.

BAPL Corporate Cup transforms corporate cricket into a professional sporting experience—where business meets competition on the field.`,
    logo: '/logos/baplcorporate.png',
    highlights: [
      'Exclusive participation for corporate teams only (company-based entries)',
      'Professional T20 tournament format',
      'Matches conducted across 5–6 premium quality cricket grounds',
      'HD live streaming with YouTube broadcasting of all matches',
      'Dedicated match officials and certified scorers',
      'On-ground meals and refreshments for all players',
      'Dedicated team managers assigned to each corporate team',
      'Fully structured and professionally managed tournament operations'
    ],
    editions: [
      { id: 'baplcorporate-north', name: 'BAPL Corporate CUP - North Mumbai Edition', logo: '/logos/baplcorporate.png', description: 'North Mumbai Edition of the BAPL Corporate Cup.', location: 'North Mumbai Sports Hubs', comingSoon: false },
      { id: 'baplcorporate-south', name: 'BAPL Corporate CUP - South Mumbai Edition', logo: '/logos/baplcorporate.png', description: 'South Mumbai Edition of the BAPL Corporate Cup.', location: 'South Mumbai Corporate Grounds', comingSoon: true },
      { id: 'baplcorporate-pune', name: 'BAPL Corporate CUP - Pune Edition', logo: '/logos/baplcorporatepuneedition.png', description: 'Pune Edition of the BAPL Corporate Cup.', location: 'Pune', comingSoon: true },
    ]
  },
  'bapldads': {
    name: 'BAPL 40+ Dads Tournament',
    description: `The BAPL 40+ Dads Tournament is a specially curated cricketing format designed exclusively for players aged 40 and above. Built on the foundation of the BAPL XPRESS structure, this league ensures a fair, competitive, and enjoyable experience tailored for seasoned cricketers.

The tournament is created with a simple vision—to bring fathers and experienced cricket lovers back onto the field, allowing them to relive the joy, passion, and memories of the game they once played every day in their younger years through the TRIVAB platform.

BAPL 40+ Dads Tournament is where experience meets passion—bringing cricket back to those who never stopped loving the game.`,
    logo: '/logos/bapldadst20.png',
    highlights: [
      'Exclusive age category: 40 years and above only',
      'Designed for fair and balanced competitive play',
      'Based on the fast-paced BAPL XPRESS format',
      'Matches played on lush, premium solo cricket grounds only',
      'Professional tournament structure and match management',
      'HD live streaming and YouTube broadcasting of matches',
      'Certified match officials and scorers',
      'Dedicated team managers for all participating teams',
      'On-ground meals and refreshments for players'
    ],
    editions: [
      { id: 'bapldads-north', name: 'BAPL 40+ DADS T20 - North Mumbai Edition', logo: '/logos/bapldadst20.png', description: 'North Mumbai Edition of the BAPL 40+ DADS T20 League.', location: 'North Mumbai', comingSoon: false },
      { id: 'bapldads-south', name: 'BAPL 40+ DADS T20 - South Mumbai Edition', logo: '/logos/bapldadst20.png', description: 'South Mumbai Edition of the BAPL 40+ DADS T20 League.', location: 'South Mumbai Turf Grounds', comingSoon: true },
      { id: 'bapldads-pune', name: 'BAPL 40+ DADS T20 - Pune Edition', logo: '/logos/bapldadst20puneedition.png', description: 'Pune Edition of the BAPL 40+ DADS T20 League.', location: 'Pune', comingSoon: true },
    ]
  }
};

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
  if (url.includes('dads')) return 'logo-white-bg';
  if (url.includes('baplt20') || url.includes('baplpune')) return 'logo-silver-bg';
  if (url.includes('corporate') || url.includes('monsoon')) return 'logo-white-bg';
  return '';
};

const needsDarkContainer = (logoUrl) => {
  if (!logoUrl) return false;
  return logoUrl.toLowerCase().includes('xpress');
};

export default function TournamentTypeDetails() {
  const { typeId } = useParams();
  const navigate = useNavigate();
  const [parentData, setParentData] = useState(null);
  const [editionStats, setEditionStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = PARENT_TOURNAMENTS[typeId];
    if (!data) {
      navigate('/tournaments');
      return;
    }
    setParentData(data);
    fetchStats(data);
  }, [typeId, navigate]);

  const fetchStats = async (currentParent) => {
    try {
      const editionIds = currentParent.editions.map(e => e.id);
      
      const [allTeams, allMatches, dbTournaments] = await Promise.all([
        getCollection('teams'),
        getCollection('matches'),
        getCollection('tournaments')
      ]);

      const activeTournIds = new Set(dbTournaments.filter(t => t.isActivated !== false).map(t => t.id));

      const statsMap = {};
      editionIds.forEach(id => {
        const teams = allTeams.filter(t => t.tournamentId === id);
        const matches = allMatches.filter(m => m.tournamentId === id);
        
        let status = 'Upcoming';
        if (!activeTournIds.has(id)) {
          status = 'Inactive';
        } else if (matches.some(m => m.status === 'Live')) {
          status = 'Live';
        } else if (matches.some(m => m.status === 'Completed')) {
          status = 'Completed';
        } else if (matches.length > 0) {
          status = 'Active';
        }

        statsMap[id] = {
          teamCount: teams.length,
          matchCount: matches.length,
          status: status
        };
      });

      setEditionStats(statsMap);
    } catch (err) {
      console.error('Error fetching parent stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (!parentData) return null;

  const typeSchema = parentData ? {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": `${parentData.name} | TRIVAB Sports`,
    "description": parentData.description?.substring(0, 150) || "Cricket league organized by TRIVAB Sports",
    "sport": "Cricket",
    "organizer": {
      "@type": "SportsOrganization",
      "name": "TRIVAB Sports",
      "url": "https://trivabsports.com"
    }
  } : null;

  return (
    <div className="parent-hub-page page-enter container section-padding">
      <SEO 
        title={parentData.name}
        description={parentData.description?.substring(0, 155) || `Explore editions, rules, highlights, and team details for the ${parentData.name} hosted by TRIVAB Sports.`}
        keywords={`${parentData.name}, TRIVAB Sports, BAPL cricket, tournament editions, cricket details`}
        schema={typeSchema}
      />
      {/* Breadcrumbs */}
      <div className="breadcrumbs mb-md text-xs text-muted">
        <Link to="/" className="hover-gold">Home</Link>
        <ChevronRight size={10} className="mx-xs" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
        <Link to="/tournaments" className="hover-gold">Tournaments</Link>
        <ChevronRight size={10} className="mx-xs" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
        <span className="text-secondary">{parentData.name}</span>
      </div>

      {/* Hero Intro Header */}
      <div className="parent-hub-header flex gap-xl items-center mb-xl flex-wrap">
        {parentData.logo && (
          <img src={getCleanLogoUrl(parentData.logo)} alt={parentData.name} className={`parent-hub-logo animate-scale-in ${getLogoClass(getCleanLogoUrl(parentData.logo))}`} style={{ width: '130px', height: '130px', objectFit: 'contain', flexShrink: 0 }} />
        )}
        <div className="parent-hub-info flex-1 min-width-300">
          <span className="badge badge-gold mb-xs">Tournament Category</span>
          <h1 className="display-sm text-gradient-gold">{parentData.name}</h1>
          <p className="text-secondary mt-xs max-width-700" style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>{parentData.description}</p>
        </div>
      </div>

      {/* Highlights checklist grid */}
      {parentData.highlights && (
        <div className="card card-gold mb-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-card)' }}>
          <h3 className="text-md font-bold mb-md text-gradient-gold flex items-center gap-xs">
            <Trophy size={18} /> Tournament Key Highlights
          </h3>
          <div className="grid grid-2 gap-sm">
            {parentData.highlights.map((h, idx) => (
              <div key={idx} className="flex gap-xs items-center text-sm text-secondary">
                <span className="text-gold">✓</span>
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editions Grid Title */}
      <div className="section-title-wrapper mb-lg">
        <h2 className="text-lg font-bold text-gradient-gold uppercase letter-spacing-04">Select Edition</h2>
        <p className="text-xs text-muted">Each edition features independent fixtures, standings, squads, and live statistics.</p>
      </div>

      {/* Edition Grid */}
      <div className="edition-grid">
        {parentData.editions.map((edition) => {
          const stats = editionStats[edition.id] || { teamCount: 0, matchCount: 0, status: 'Upcoming' };
          const isComingSoon = edition.comingSoon && stats.status === 'Inactive';
          
          return (
            <div key={edition.id} className="card edition-hub-card border-top-gold page-enter">
              {isComingSoon && (
                <div className="edition-card-overlay">
                  <div className="coming-soon-badge">Coming Soon</div>
                </div>
              )}
              {/* Card Header Overlay Visual */}
              <div className="edition-card-visual flex items-center justify-between p-lg">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {edition.logo && (
                    <img src={getCleanLogoUrl(edition.logo)} alt={edition.name} className={`edition-card-logo ${getLogoClass(getCleanLogoUrl(edition.logo))}`} />
                  )}
                  <div>
                    <span className={`badge ${stats.status === 'Live' ? 'badge-red animate-pulse' : stats.status === 'Completed' ? 'badge-green' : stats.status === 'Inactive' ? 'badge-grey' : 'badge-gold'} mb-xs`}>
                      {isComingSoon ? 'Coming Soon' : stats.status}
                    </span>
                    <h3 className="text-md font-bold text-gradient-gold">{edition.name}</h3>
                  </div>
                </div>
              </div>

              {/* Card Info Details */}
              <div className="edition-card-body p-lg">
                <p className="text-sm text-secondary mb-md">{edition.description}</p>
                
                {/* Stats row */}
                <div className="edition-stats-box grid grid-3 gap-md mb-md">
                  <div className="stat-unit text-center">
                    <Users size={16} className="text-gold mx-auto mb-xs" />
                    <span className="value font-bold block">{stats.teamCount}</span>
                    <span className="label block uppercase">Teams</span>
                  </div>
                  <div className="stat-unit text-center">
                    <Calendar size={16} className="text-gold mx-auto mb-xs" />
                    <span className="value font-bold block">{stats.matchCount}</span>
                    <span className="label block uppercase">Fixtures</span>
                  </div>
                  <div className="stat-unit text-center">
                    <MapPin size={16} className="text-gold mx-auto mb-xs" />
                    <span className="value font-bold block truncate" style={{ fontSize: '0.8rem', lineHeight: '1.2' }} title={edition.location}>
                      {edition.location.split(' ')[0]}
                    </span>
                    <span className="label block uppercase">Venue</span>
                  </div>
                </div>

                {/* Features checklist */}
                <ul className="edition-features-list mb-lg text-sm text-secondary">
                  <li>✓ Certified Leather-Ball Umpiring</li>
                  <li>✓ Live Ball-by-Ball Mobile Scoring</li>
                  <li>✓ Player Profile &amp; Career Stats Tracking</li>
                </ul>

                {/* Action CTA Button */}
                <Link to={`/tournaments/${edition.id}`} className="btn btn-gold w-full text-center flex items-center justify-center gap-sm btn-arena">
                  View Tournament <ArrowRight size={16} className="arrow-icon" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
