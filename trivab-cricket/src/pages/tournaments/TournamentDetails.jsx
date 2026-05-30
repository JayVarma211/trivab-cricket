import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDocument, getCollection, where } from '../../firebase/firestore';
import { Trophy, Calendar, MapPin, Users, Award, Shield } from 'lucide-react';
import Loader from '../../components/common/Loader';
import './Tournaments.css';

export default function TournamentDetails() {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const tourn = await getDocument('tournaments', id);
        setTournament(tourn);

        const mList = await getCollection('matches', [where('tournamentId', '==', id)]);
        setMatches(mList);

        const tList = await getCollection('teams');
        setTeams(tList);
      } catch (err) {
        console.log('Using default mock tournament details page');
        setTournament({
          id: id,
          name: 'Champions Cup 2026',
          status: 'Live',
          description: 'The ultimate T20 championship faceoff featuring regional elite sports clubs competing for the TRIVAB Champions Cup.',
          winner: 'TBD',
          runnerUp: 'TBD'
        });
        setMatches([
          { id: 'm1', teamA: 'Mumbai Knights', teamB: 'Delhi Dynamos', venue: 'Wankhede Stadium', date: '2026-05-31', time: '18:30', status: 'Upcoming' },
          { id: 'm2', teamA: 'Chennai Super Kings', teamB: 'Kolkata Warriors', venue: 'Chepauk Stadium', date: '2026-06-01', time: '16:00', status: 'Upcoming' }
        ]);
        setTeams([
          { id: 't1', teamName: 'Mumbai Knights', captainName: 'Rohit Sharma' },
          { id: 't2', teamName: 'Delhi Dynamos', captainName: 'Rishabh Pant' },
          { id: 't3', teamName: 'Chennai Super Kings', captainName: 'MS Dhoni' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) return <Loader />;

  if (!tournament) {
    return (
      <div className="container section-padding text-center">
        <h2>Tournament Not Found</h2>
        <Link to="/tournaments" className="btn btn-gold mt-md">Back to Tournaments</Link>
      </div>
    );
  }

  return (
    <div className="tournament-details-page page-enter container section-padding">
      <div className="flex justify-between items-start mb-xl gap-lg flex-wrap">
        <div>
          <span className="badge badge-red mb-xs">{tournament.status}</span>
          <h1 className="display-md text-gradient-gold">{tournament.name}</h1>
          <p className="text-secondary max-width-600 mt-xs">{tournament.description}</p>
        </div>
        <div className="card winner-details-box flex gap-md items-center">
          <Trophy size={36} className="text-gold" />
          <div>
            <span className="text-xs text-muted block uppercase font-bold">Champions Trophy</span>
            <span className="text-sm font-bold text-primary">Winner: {tournament.winner || 'TBD'}</span>
          </div>
        </div>
      </div>

      <div className="tournament-details-grid">
        {/* Left col: Match Fixtures */}
        <div className="card matches-fixture-card">
          <h3 className="text-lg font-bold mb-md text-gradient-gold flex items-center gap-sm">
            <Calendar size={20} /> Match Schedule & Fixtures
          </h3>
          <div className="matches-timeline">
            {matches.length === 0 ? (
              <p className="text-sm text-muted">No scheduled matches logged for this tournament.</p>
            ) : (
              matches.map((m) => (
                <div className="match-card border-top-gold mb-md" key={m.id}>
                  <div className="match-card-header flex justify-between text-xs text-muted mb-xs">
                    <span className="flex items-center gap-xs"><Calendar size={12} /> {m.date} at {m.time}</span>
                    <span className="badge badge-blue">{m.status}</span>
                  </div>
                  <div className="match-teams-row flex justify-between items-center py-sm">
                    <span className="team-text font-bold">{m.teamA}</span>
                    <span className="vs-text text-muted text-xs font-bold">VS</span>
                    <span className="team-text font-bold">{m.teamB}</span>
                  </div>
                  <div className="match-card-footer flex justify-between items-center text-xs text-muted border-top pt-xs mt-xs">
                    <span className="flex items-center gap-xs"><MapPin size={12} /> {m.venue}</span>
                    <span className="text-gold font-semi">T20 League Match</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right col: Participating Teams */}
        <div className="card participating-teams-card">
          <h3 className="text-lg font-bold mb-md text-gradient-gold flex items-center gap-sm">
            <Users size={20} /> Participating Teams ({teams.length})
          </h3>
          <ul className="flex flex-col gap-sm team-details-list">
            {teams.map((t) => (
              <li className="team-item-row flex justify-between items-center" key={t.id}>
                <div className="flex items-center gap-sm">
                  <div className="avatar avatar-sm bg-secondary text-gold font-bold">
                    {t.teamName[0]}
                  </div>
                  <span className="font-semi text-sm text-primary">{t.teamName}</span>
                </div>
                <span className="badge badge-gold">Active Squad</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
