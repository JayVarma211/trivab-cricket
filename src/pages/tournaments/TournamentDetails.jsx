import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDocument, getCollection, where, updateDocument, getPlayerByUIDOrEmail } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Trophy, Calendar, MapPin, Users, Award, Shield } from 'lucide-react';
import Loader from '../../components/common/Loader';
import './Tournaments.css';

const PREDEFINED_TOURNAMENTS = [
  { id: 'bapl-south', name: 'BAPL - South Mumbai Edition', logo: '/logos/baplt20south.jpg', description: 'South Mumbai Edition of the premier BAPL League.' },
  { id: 'bapl-north', name: 'BAPL - North Mumbai Edition', logo: '/logos/baplt20north.jpg', description: 'North Mumbai Edition of the premier BAPL League.' },
  { id: 'baplxpress-south', name: 'BAPL XPRESS - South Mumbai Edition', logo: '/logos/baplxpresst20south.jpg', description: 'South Mumbai Edition of the fast-paced BAPL XPRESS League.' },
  { id: 'baplxpress-north', name: 'BAPL XPRESS - North Mumbai Edition', logo: '/logos/baplxpresst20north.jpg', description: 'North Mumbai Edition of the fast-paced BAPL XPRESS League.' },
  { id: 'baplcorporate-south', name: 'BAPL Corporate CUP - South Mumbai Edition', logo: '/logos/baplcorporate.jpg', description: 'South Mumbai Edition of the BAPL Corporate Cup.' },
  { id: 'baplcorporate-north', name: 'BAPL Corporate CUP - North Mumbai Edition', logo: '/logos/baplcorporate.jpg', description: 'North Mumbai Edition of the BAPL Corporate Cup.' },
  { id: 'trivab-monsoon', name: 'Trivab Monsoon Championship', logo: '/logos/trivabmonsoon.jpg', description: 'The grand Trivab Monsoon Championship tournament.' },
  { id: 'bapldads-south', name: 'BAPL DADS T20 - South Mumbai Edition', logo: '/logos/bapldadst20.jpg', description: 'South Mumbai Edition of the BAPL DADS T20 League.' },
  { id: 'bapldads-north', name: 'BAPL DADS T20 - North Mumbai Edition', logo: '/logos/bapldadst20.jpg', description: 'North Mumbai Edition of the BAPL DADS T20 League.' },
  { id: 'baplkids', name: 'BAPL KIDS', logo: '/logos/bapllogo.jpg', description: 'The BAPL KIDS Cricket Championship.' },
];

export default function TournamentDetails() {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user, role } = useAuth();
  const [playerProfile, setPlayerProfile] = useState(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        let tourn = await getDocument('tournaments', id);
        
        if (!tourn) {
          const fallback = PREDEFINED_TOURNAMENTS.find(p => p.id === id);
          if (fallback) {
            tourn = {
              id: fallback.id,
              name: fallback.name,
              logo: fallback.logo,
              description: fallback.description,
              status: 'Upcoming',
              winner: 'TBD',
              runnerUp: 'TBD'
            };
          }
        }
        
        setTournament(tourn);

        const mList = await getCollection('matches', [where('tournamentId', '==', id)]);
        setMatches(mList);

        const tList = await getCollection('teams', [where('tournamentId', '==', id)]);
        setTeams(tList);
      } catch (err) {
        console.log('Using default mock tournament details page');
        const fallback = PREDEFINED_TOURNAMENTS.find(p => p.id === id) || {
          name: 'Champions Cup 2026',
          logo: null,
          description: 'The ultimate T20 championship faceoff featuring regional elite sports clubs competing for the TRIVAB Champions Cup.',
        };
        setTournament({
          id: id,
          name: fallback.name,
          status: 'Live',
          description: fallback.description,
          logo: fallback.logo,
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
        if (user) {
          try {
            const profile = await getPlayerByUIDOrEmail(user.uid, user.email);
            setPlayerProfile(profile);
            if (profile && profile.joinedTournaments) {
              const joined = profile.joinedTournaments.some(t => {
                const idToCompare = typeof t === 'string' ? t : t.id;
                return idToCompare === id;
              });
              setHasJoined(joined);
            }
          } catch (e) {
            console.error("Error fetching player profile:", e);
          }
        }
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, user]);

  const handleJoinTournament = async () => {
    if (!user) {
      alert('Please log in as a player to join this tournament!');
      return;
    }
    if (!playerProfile) {
      alert('Only registered players can join tournaments. Please update your profile or register as a player.');
      return;
    }
    setJoining(true);
    setJoinMessage('');
    try {
      const newRegistration = {
        id: tournament.id || id,
        name: tournament.name || 'Tournament Edition',
        joinedAt: new Date().toISOString()
      };
      const currentJoined = playerProfile.joinedTournaments || [];
      const updatedJoined = [...currentJoined, newRegistration];
      
      await updateDocument('players', playerProfile.id, {
        joinedTournaments: updatedJoined
      });
      
      setPlayerProfile(prev => ({
        ...prev,
        joinedTournaments: updatedJoined
      }));
      setHasJoined(true);
      setJoinMessage('Successfully joined tournament!');
    } catch (e) {
      console.error("Error joining tournament:", e);
      alert('Failed to join tournament. Please try again.');
    } finally {
      setJoining(false);
    }
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {tournament.logo && (
            <img 
              src={tournament.logo} 
              alt={tournament.name} 
              style={{ width: 80, height: 80, borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border)' }} 
            />
          )}
          <div>
            <span className="badge badge-red mb-xs">{tournament.status}</span>
            <h1 className="display-md text-gradient-gold">{tournament.name}</h1>
            <p className="text-secondary max-width-600 mt-xs">{tournament.description}</p>
            
            {user ? (
              role === 'admin' ? (
                <div className="mt-md" style={{ display: 'inline-block' }}><span className="badge badge-gold">Admin View</span></div>
              ) : (
                <div className="mt-md" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                  {hasJoined ? (
                    <button className="btn btn-gold btn-sm" disabled style={{ opacity: 0.8, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ✓ Joined Tournament
                    </button>
                  ) : (
                    <button className="btn btn-gold btn-sm" onClick={handleJoinTournament} disabled={joining} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {joining ? 'Joining...' : 'Join this Tournament'}
                    </button>
                  )}
                  {joinMessage && <span className="text-xs text-green font-bold" style={{ color: '#22c55e' }}>{joinMessage}</span>}
                </div>
              )
            ) : (
              <div className="mt-md">
                <Link to="/login" className="btn btn-gold btn-sm">
                  Login to Join Tournament
                </Link>
              </div>
            )}
          </div>
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
