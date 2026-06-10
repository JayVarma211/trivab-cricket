import { useEffect, useState } from 'react';
import { getCollection, orderBy } from '../firebase/firestore';
import { Calendar, MapPin, Search, ShieldCheck } from 'lucide-react';
import Loader from '../components/common/Loader';
import './tournaments/Tournaments.css';

export default function MatchSchedule() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All | Live | Upcoming | Completed

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const list = await getCollection('matches', [orderBy('date')]);
        setMatches(list);
      } catch (err) {
        console.error('Error fetching matches:', err);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const filteredMatches = matches.filter((m) => {
    if (filter === 'All') return true;
    return m.status === filter;
  });

  return (
    <div className="matches-page page-enter container section-padding">
      <div className="section-header">
        <span className="section-label">Fixtures</span>
        <h1 className="section-title">League <span className="text-gradient-gold">Match Schedules</span></h1>
        <p className="section-subtitle">Real-time status updates on past, current live matches, and upcoming games.</p>
      </div>

      <div className="flex justify-between items-center mb-xl flex-wrap gap-md">
        <div className="tabs">
          {['All', 'Live', 'Upcoming', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`tab-btn ${filter === tab ? 'active' : ''}`}
            >
              {tab} Matches
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="grid grid-2 gap-xl">
          {filteredMatches.map((m) => (
            <div className={`card match-card-main ${m.status === 'Live' ? 'border-red-live' : ''}`} key={m.id}>
              <div className="flex justify-between items-center mb-md">
                <span className={`badge ${m.status === 'Live' ? 'badge-red' : m.status === 'Upcoming' ? 'badge-gold' : 'badge-green'}`}>
                  {m.status}
                </span>
                <span className="text-xs text-muted font-semi flex items-center gap-xs">
                  <Calendar size={14} /> {m.date} - {m.time} IST
                </span>
              </div>

              <div className="match-scores-grid flex justify-between items-center py-md">
                <div className="score-team flex flex-col items-center">
                  <div className="avatar avatar-md bg-secondary text-gold font-bold mb-xs">
                    {m.teamA[0]}
                  </div>
                  <span className="font-semi text-sm text-primary">{m.teamA}</span>
                  {m.status === 'Completed' && <span className="text-lg font-bold text-gradient-gold mt-xs">{m.scoreA || 'N/A'}</span>}
                </div>

                <div className="score-vs text-center">
                  <span className="text-xs font-bold text-muted block">VS</span>
                  {m.status === 'Live' && <span className="live-dot text-xs text-red font-bold">LIVE MATCH</span>}
                </div>

                <div className="score-team flex flex-col items-center">
                  <div className="avatar avatar-md bg-secondary text-gold font-bold mb-xs">
                    {m.teamB[0]}
                  </div>
                  <span className="font-semi text-sm text-primary">{m.teamB}</span>
                  {m.status === 'Completed' && <span className="text-lg font-bold text-gradient-gold mt-xs">{m.scoreB || 'N/A'}</span>}
                </div>
              </div>

              <div className="divider mb-md" />

              <div className="flex justify-between items-center text-xs text-muted">
                <span className="flex items-center gap-xs"><MapPin size={12} /> {m.venue}</span>
                <span className="font-semi">T20 Match</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
