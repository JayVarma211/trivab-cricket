import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCollection, getDocument, where } from '../../firebase/firestore';
import { CalendarClock, Clock, MapPin, Users, Tag, AlertCircle, Calendar, Shield } from 'lucide-react';
import Loader from '../../components/common/Loader';
import SEO from '../../components/common/SEO';
import './Captain.css';

const TYPE_COLORS = {
  Match: '#EF4444',
  Practice: '#3B82F6',
  Meeting: '#F59E0B',
  Event: '#8B5CF6',
  Training: '#10B981',
  'Selection Trial': '#EC4899',
};

const STATUS_STYLES = {
  Upcoming: { background: 'rgba(59,130,246,0.15)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.3)' },
  'In Progress': { background: 'rgba(239,68,68,0.2)', color: '#F87171', border: '1px solid rgba(239,68,68,0.4)' },
  Live: { background: 'rgba(239,68,68,0.2)', color: '#F87171', border: '1px solid rgba(239,68,68,0.4)' },
  Completed: { background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.3)' },
  Cancelled: { background: 'rgba(255,255,255,0.08)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.15)' },
};

export default function CaptainSchedule() {
  const { user, role } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [captainTeams, setCaptainTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // 1. Fetch captain teams
        let userTeams = await getCollection('teams', [where('captainId', '==', user.uid)]);
        if (!userTeams || userTeams.length === 0) {
          const captainDoc = await getDocument('captains', user.uid);
          if (captainDoc?.teamId) {
            const teamDoc = await getDocument('teams', captainDoc.teamId);
            if (teamDoc) userTeams = [teamDoc];
          }
        }
        setCaptainTeams(userTeams || []);

        // 2. Fetch all entries from matches and schedules
        const [matchesList, schedulesList] = await Promise.all([
          getCollection('matches', []).catch(() => []),
          getCollection('schedules', []).catch(() => [])
        ]);

        // Combine and deduplicate entries by ID or title+date
        const map = new Map();
        [...(matchesList || []), ...(schedulesList || [])].forEach((item) => {
          if (!item.id) return;
          map.set(item.id, {
            ...map.get(item.id),
            ...item
          });
        });

        const combined = Array.from(map.values());
        combined.sort((a, b) => new Date(a.date || '2099-01-01') - new Date(b.date || '2099-01-01'));

        setSchedules(combined);
      } catch (err) {
        console.error('Error fetching captain schedule:', err);
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Filter entries so captain sees matches/schedules relevant to their teams
  const teamNames = captainTeams.map(t => t.teamName).filter(Boolean);
  const teamIds = captainTeams.map(t => t.id).filter(Boolean);

  const isRelevantToCaptain = (s) => {
    // If captain has no team assigned yet, show public entries
    if (teamNames.length === 0) return true;

    // Check if entry is targeted to All Teams or general
    const target = (s.targetTeamName || '').toLowerCase();
    if (!target || target === 'all teams' || target.includes('all teams') || target === 'general / all') {
      return true;
    }

    // Check if captain's team is Team A or Team B or target
    const isTeamA = teamNames.some(tn => (s.teamA || '').toLowerCase() === tn.toLowerCase());
    const isTeamB = teamNames.some(tn => (s.teamB || '').toLowerCase() === tn.toLowerCase());
    const isTeamId = teamIds.some(ti => s.teamAId === ti || s.teamBId === ti || s.targetTeamId === ti);
    const isTitleMatch = teamNames.some(tn => (s.title || '').toLowerCase().includes(tn.toLowerCase()) || target.includes(tn.toLowerCase()));

    return isTeamA || isTeamB || isTeamId || isTitleMatch;
  };

  const relevantSchedules = schedules.filter(isRelevantToCaptain);

  const filtered = relevantSchedules.filter((s) => {
    const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
    const matchesType = filterType === 'All' || s.type === filterType;
    return matchesStatus && matchesType;
  });

  if (loading) return <Loader fullscreen={false} />;

  if (role !== 'captain' && role !== 'admin') {
    return (
      <div className="container section-padding text-center">
        <h2 className="display-sm text-red">Access Restrained</h2>
        <p className="text-secondary mb-md">This schedule console is strictly reserved for verified Team Captain profiles only.</p>
      </div>
    );
  }

  return (
    <>
      <SEO title="Schedule – Captain Management | TRIVAB Sports" description="Official match schedule for team captains." />

      <div className="captain-dashboard page-enter container section-padding">
        {/* Header */}
        <div className="dashboard-header mb-xl flex justify-between items-end flex-wrap gap-md">
          <div>
            <span className="text-gold text-sm font-bold uppercase tracking-wider">Captain Center</span>
            <h1 className="display-md">Official Match &amp; Event Schedule</h1>
            <p className="text-secondary text-sm">
              Showing scheduled fixtures and events for: {' '}
              <strong className="text-gold">
                {teamNames.length > 0 ? teamNames.join(', ') : 'All League Teams'}
              </strong>
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-md flex-wrap items-center mb-xl" style={{ gap: '12px' }}>
          {/* Status Filter */}
          <div className="flex gap-xs flex-wrap">
            {['All', 'Upcoming', 'In Progress', 'Completed', 'Cancelled'].map((st) => {
              const count = st === 'All' ? relevantSchedules.length : relevantSchedules.filter((s) => s.status === st).length;
              return (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '999px',
                    border: filterStatus === st ? '1px solid var(--gold)' : '1px solid var(--border-card)',
                    background: filterStatus === st ? 'rgba(212,175,55,0.15)' : 'var(--bg-card)',
                    color: filterStatus === st ? 'var(--gold)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                >
                  {st} ({count})
                </button>
              );
            })}
          </div>

          {/* Type Filter */}
          <select
            className="form-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ padding: '6px 16px', fontSize: '0.82rem', width: 'auto', borderRadius: '999px' }}
          >
            <option value="All">All Entry Types</option>
            <option value="Match">Match</option>
            <option value="Practice">Practice</option>
            <option value="Meeting">Meeting</option>
            <option value="Event">Event</option>
            <option value="Training">Training</option>
            <option value="Selection Trial">Selection Trial</option>
          </select>
        </div>

        {/* Schedule List */}
        {filtered.length === 0 ? (
          <div className="card text-center" style={{ padding: '48px 24px' }}>
            <CalendarClock size={48} style={{ opacity: 0.3, marginBottom: '16px', color: 'var(--gold)' }} />
            <h3 className="text-lg font-bold mb-xs">No Scheduled Matches Found</h3>
            <p className="text-secondary text-sm" style={{ margin: 0 }}>
              {relevantSchedules.length === 0
                ? 'No scheduled matches or events for your team yet.'
                : 'No schedules match the selected filters.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {filtered.map((sch) => {
              const typeColor = TYPE_COLORS[sch.type] || '#800000';
              const statusStyle = STATUS_STYLES[sch.status] || STATUS_STYLES.Upcoming;
              const dateObj = sch.date ? new Date(sch.date + 'T00:00:00') : null;
              const displayTitle = sch.title || (sch.teamA && sch.teamB ? `${sch.teamA} vs ${sch.teamB}` : `${sch.type || 'Match'} Fixture`);

              return (
                <div
                  key={sch.id}
                  className="card card-hover"
                  style={{
                    borderLeft: `4px solid ${typeColor}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div>
                    {/* Header badges */}
                    <div className="flex justify-between items-center mb-sm flex-wrap" style={{ gap: '8px' }}>
                      <span
                        style={{
                          background: typeColor + '22',
                          color: typeColor,
                          border: `1px solid ${typeColor}44`,
                          borderRadius: '6px',
                          padding: '2px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        {sch.type || 'Match'}
                      </span>
                      <span
                        style={{
                          ...statusStyle,
                          borderRadius: '6px',
                          padding: '2px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        {sch.status || 'Upcoming'}
                      </span>
                    </div>

                    {/* Date Block & Title */}
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '12px' }}>
                      {dateObj && (
                        <div
                          style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-card)',
                            borderRadius: '10px',
                            padding: '8px 14px',
                            textAlign: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: 900, lineHeight: 1, color: 'var(--text-primary)' }}>
                            {dateObj.getDate()}
                          </span>
                          <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase' }}>
                            {dateObj.toLocaleString('en-IN', { month: 'short' })}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-md font-bold" style={{ margin: 0, lineHeight: 1.3, color: 'var(--text-primary)' }}>
                          {displayTitle}
                        </h3>
                        {dateObj && (
                          <span className="text-xs text-muted">
                            {dateObj.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                      {sch.time && (
                        <div className="flex items-center gap-xs">
                          <Clock size={14} className="text-gold" />
                          <span>Time: <strong className="text-primary">{sch.time}</strong></span>
                        </div>
                      )}
                      {sch.venue && (
                        <div className="flex items-center gap-xs">
                          <MapPin size={14} className="text-gold" />
                          <span>Venue: <strong className="text-primary">{sch.venue}</strong></span>
                        </div>
                      )}
                      {(sch.teamA || sch.teamB || sch.targetTeamName) && (
                        <div className="flex items-center gap-xs">
                          <Shield size={14} className="text-gold" />
                          <span>Teams: <strong className="text-primary">{sch.teamA && sch.teamB ? `${sch.teamA} vs ${sch.teamB}` : (sch.targetTeamName || 'All Teams')}</strong></span>
                        </div>
                      )}
                      {sch.format && (
                        <div className="flex items-center gap-xs">
                          <Tag size={14} className="text-gold" />
                          <span>Format: <strong className="text-primary">{sch.format}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {sch.description && (
                      <p className="text-xs text-muted" style={{ marginTop: '12px', lineHeight: 1.5, borderTop: '1px solid var(--border-card)', paddingTop: '10px', whiteSpace: 'pre-line' }}>
                        {sch.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
