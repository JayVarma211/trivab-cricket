import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCollection } from '../../firebase/firestore';
import { Trophy, Calendar, Users, MapPin, ArrowRight, ChevronRight } from 'lucide-react';
import Loader from '../../components/common/Loader';
import './TournamentTypeDetails.css';

const PARENT_TOURNAMENTS = {
  'bapl': {
    name: 'BAPL League',
    description: 'The premier BAPL League, featuring top cricket squads in Mumbai competing across editions. Experience professional-grade cricket structure, turf pitches, and certified umpiring.',
    logo: '/logos/bapllogo.jpg',
    editions: [
      { id: 'bapl-north', name: 'BAPL - North Mumbai Edition', logo: '/logos/baplt20north.jpg', description: 'North Mumbai Edition of the premier BAPL League.', location: 'North Mumbai Grounds', comingSoon: false },
      { id: 'bapl-south', name: 'BAPL - South Mumbai Edition', logo: '/logos/baplt20south.jpg', description: 'South Mumbai Edition of the premier BAPL League.', location: 'South Mumbai', comingSoon: true },
      { id: 'bapl-pune', name: 'BAPL - Pune Edition', logo: '/logos/baplpune.jpg', description: 'Pune Edition of the premier BAPL League.', location: 'Pune', comingSoon: true },
    ]
  },
  'baplxpress': {
    name: 'BAPL XPRESS',
    description: 'Fast-paced, action-packed T20 matches in the BAPL XPRESS League. Dynamic short formats, aggressive play styles, and electric atmospheres.',
    logo: '/logos/bapllogo.jpg',
    editions: [
      { id: 'baplxpress-north', name: 'BAPL XPRESS - North Mumbai Edition', logo: '/logos/baplxpresst20north.jpg', description: 'North Mumbai Edition of the fast-paced BAPL XPRESS League.', location: 'North Mumbai Turfs', comingSoon: false },
      { id: 'baplxpress-south', name: 'BAPL XPRESS - South Mumbai Edition', logo: '/logos/baplxpresst20south.jpg', description: 'South Mumbai Edition of the fast-paced BAPL XPRESS League.', location: 'South Mumbai Turfs', comingSoon: true },
      { id: 'baplxpress-pune', name: 'BAPL XPRESS - Pune Edition', logo: '/logos/baplxpresst20puneedition.jpg', description: 'Pune Edition of the fast-paced BAPL XPRESS League.', location: 'Pune', comingSoon: true },
    ]
  },
  'baplcorporate': {
    name: 'BAPL Corporate CUP',
    description: 'The ultimate corporate face-off, blending workplace camaraderie with cricket passion. Weekend leagues designed for corporate clubs and business houses.',
    logo: '/logos/baplcorporate.jpg',
    editions: [
      { id: 'baplcorporate-north', name: 'BAPL Corporate CUP - North Mumbai Edition', logo: '/logos/baplcorporate.jpg', description: 'North Mumbai Edition of the BAPL Corporate Cup.', location: 'North Mumbai Sports Hubs', comingSoon: false },
      { id: 'baplcorporate-south', name: 'BAPL Corporate CUP - South Mumbai Edition', logo: '/logos/baplcorporate.jpg', description: 'South Mumbai Edition of the BAPL Corporate Cup.', location: 'South Mumbai Corporate Grounds', comingSoon: true },
      { id: 'baplcorporate-pune', name: 'BAPL Corporate CUP - Pune Edition', logo: '/logos/baplcorporatepuneedition.jpg', description: 'Pune Edition of the BAPL Corporate Cup.', location: 'Pune', comingSoon: true },
    ]
  },
  'bapldads': {
    name: 'BAPL 40+ DADS T20',
    description: 'Celebrating cricket passion for the seasoned veterans in the BAPL 40+ DADS T20 tournament. Relive the glory days in a highly competitive senior division.',
    logo: '/logos/bapldadst20.jpg',
    editions: [
      { id: 'bapldads-north', name: 'BAPL 40+ DADS T20 - North Mumbai Edition', logo: '/logos/bapldadst20.jpg', description: 'North Mumbai Edition of the BAPL 40+ DADS T20 League.', location: 'North Mumbai', comingSoon: false },
      { id: 'bapldads-south', name: 'BAPL 40+ DADS T20 - South Mumbai Edition', logo: '/logos/bapldadst20.jpg', description: 'South Mumbai Edition of the BAPL 40+ DADS T20 League.', location: 'South Mumbai Turf Grounds', comingSoon: true },
      { id: 'bapldads-pune', name: 'BAPL 40+ DADS T20 - Pune Edition', logo: '/logos/bapldadst20puneedition.jpg', description: 'Pune Edition of the BAPL 40+ DADS T20 League.', location: 'Pune', comingSoon: true },
    ]
  }
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
      
      const [allTeams, allMatches] = await Promise.all([
        getCollection('teams'),
        getCollection('matches')
      ]);

      const statsMap = {};
      editionIds.forEach(id => {
        const teams = allTeams.filter(t => t.tournamentId === id);
        const matches = allMatches.filter(m => m.tournamentId === id);
        
        let status = 'Upcoming';
        if (matches.some(m => m.status === 'Live')) {
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

  return (
    <div className="parent-hub-page page-enter container section-padding">
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
          <div className="parent-hub-logo-wrapper">
            <img src={parentData.logo} alt={parentData.name} className="parent-hub-logo animate-scale-in" style={{ mixBlendMode: 'multiply' }} />
          </div>
        )}
        <div className="parent-hub-info flex-1 min-width-300">
          <span className="badge badge-gold mb-xs">Tournament Category</span>
          <h1 className="display-sm text-gradient-gold">{parentData.name}</h1>
          <p className="text-secondary mt-xs max-width-700">{parentData.description}</p>
        </div>
      </div>

      {/* Editions Grid Title */}
      <div className="section-title-wrapper mb-lg">
        <h2 className="text-lg font-bold text-gradient-gold uppercase letter-spacing-04">Select Edition</h2>
        <p className="text-xs text-muted">Each edition features independent fixtures, standings, squads, and live statistics.</p>
      </div>

      {/* Edition Grid */}
      <div className="edition-grid">
        {parentData.editions.map((edition) => {
          const stats = editionStats[edition.id] || { teamCount: 0, matchCount: 0, status: 'Upcoming' };
          const isComingSoon = edition.comingSoon;
          
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
                    <img src={edition.logo} alt={edition.name} className="edition-card-logo" style={{ mixBlendMode: 'multiply' }} />
                  )}
                  <div>
                    <span className={`badge ${stats.status === 'Live' ? 'badge-red animate-pulse' : stats.status === 'Completed' ? 'badge-green' : 'badge-gold'} mb-xs`}>
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
