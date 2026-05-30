import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCollection, orderBy } from '../../firebase/firestore';
import { Trophy, Calendar, Users, Star, ArrowRight } from 'lucide-react';
import Loader from '../../components/common/Loader';
import './Tournaments.css';

export default function TournamentList() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const list = await getCollection('tournaments', [orderBy('createdAt', 'desc')]);
        setTournaments(list);
      } catch (err) {
        console.log('Using default mock tournaments list');
        setTournaments([
          { id: 't1', name: 'Champions Cup 2026', status: 'Live', description: 'Elite T20 faceoff featuring premier regional clubs.', date: 'May - June 2026', teamCount: 16 },
          { id: 't2', name: 'Under-25 Premier League', status: 'Upcoming', description: 'Showcasing next-generation rising stars and state prospects.', date: 'July 2026', teamCount: 12 },
          { id: 't3', name: 'Corporate Shield Trophy', status: 'Completed', description: 'Corporate cricket showdown for corporate division teams.', date: 'March 2026', teamCount: 8 }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, []);

  return (
    <div className="tournaments-page page-enter container section-padding">
      <div className="section-header">
        <span className="section-label">Leagues</span>
        <h1 className="section-title">TRIVAB <span className="text-gradient-gold">Tournaments</span></h1>
        <p className="section-subtitle">Browse through active, completed, or scheduled premier cricket tournaments.</p>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="grid grid-3 gap-xl">
          {tournaments.map((t) => (
            <div className="card tournament-card-main border-top-gold" key={t.id}>
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

              <div className="flex justify-between items-center mb-lg bg-secondary py-xs px-sm rounded">
                <span className="text-xs text-muted font-semi flex items-center gap-xs">
                  <Users size={14} /> {t.teamCount || 10} Teams
                </span>
                <span className="text-xs text-gold font-bold">T20 Format</span>
              </div>

              <Link to={`/tournaments/${t.id}`} className="btn btn-gold w-full text-center" style={{ display: 'flex' }}>
                View Roster & Schedule <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
