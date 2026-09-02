import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getCollection, orderBy } from '../firebase/firestore';
import { Calendar, MapPin, Search, ShieldCheck, Trophy, Users, X } from 'lucide-react';
import Loader from '../components/common/Loader';
import SEO from '../components/common/SEO';
import './tournaments/Tournaments.css';

export default function MatchSchedule() {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All | Live | Upcoming | Completed
  const [tournamentFilter, setTournamentFilter] = useState('All');
  const [selectedMatchForModal, setSelectedMatchForModal] = useState(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const [list, teamsList, tournamentsList] = await Promise.all([
          getCollection('matches', [orderBy('date')]),
          getCollection('teams'),
          getCollection('tournaments')
        ]);
        setMatches(list);
        setTeams(teamsList || []);
        setTournaments(tournamentsList || []);
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
    const matchesStatus = filter === 'All' || m.status === filter;
    const matchesTourn = tournamentFilter === 'All' || m.tournamentId === tournamentFilter;
    return matchesStatus && matchesTourn;
  });

  const modalTournament = selectedMatchForModal ? tournaments.find(t => t.id === selectedMatchForModal.tournamentId) : null;
  const modalTeamAObj = selectedMatchForModal ? teams.find(t => t.teamName === selectedMatchForModal.teamA) : null;
  const modalTeamBObj = selectedMatchForModal ? teams.find(t => t.teamName === selectedMatchForModal.teamB) : null;
  const modalTeamALogo = modalTeamAObj?.logoURL;
  const modalTeamBLogo = modalTeamBObj?.logoURL;

  const scheduleSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "TRIVAB Sports Live Match Schedules & Fixtures",
    "description": "View live, upcoming, and completed cricket match schedules, fixtures, and venues in the TRIVAB Sports leagues.",
    "url": "https://trivabsports.com/schedule"
  };

  return (
    <div className="matches-page page-enter container section-padding">
      <SEO 
        title="Live Match Schedules & Fixtures"
        description="Track live, upcoming, and completed cricket matches in TRIVAB Sports leagues. View match dates, times, venues, and status details."
        keywords="TRIVAB Sports schedule, cricket fixtures, live cricket matches, cricket tournament schedule, Mumbai cricket grounds"
        schema={scheduleSchema}
      />
      <div className="section-header">
        <span className="section-label">Fixtures</span>
        <h1 className="section-title">TRIVAB Sports <span className="text-gradient-gold">Match Schedules</span></h1>
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
        <select
          className="form-select"
          value={tournamentFilter}
          onChange={(e) => setTournamentFilter(e.target.value)}
          style={{ padding: '8px 16px', fontSize: '0.85rem', width: 'auto', borderRadius: '999px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
        >
          <option value="All">All Tournaments</option>
          {tournaments.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="grid grid-2 gap-xl">
          {filteredMatches.map((m) => {
            const tournament = tournaments.find(t => t.id === m.tournamentId);
            const teamAObj = teams.find(t => t.teamName === m.teamA);
            const teamBObj = teams.find(t => t.teamName === m.teamB);
            const teamALogo = teamAObj?.logoURL;
            const teamBLogo = teamBObj?.logoURL;

            return (
              <div 
                className={`card match-card-main ${m.status === 'Live' ? 'border-red-live' : ''}`} 
                key={m.id}
                onClick={() => setSelectedMatchForModal(m)}
                style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.5)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="flex justify-between items-center mb-md flex-wrap gap-xs">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge ${m.status === 'Live' ? 'badge-red' : m.status === 'Upcoming' ? 'badge-gold' : 'badge-green'}`}>
                      {m.status}
                    </span>
                    <span className="text-xs font-bold text-gold uppercase tracking-wider" style={{ fontSize: '0.75rem' }}>
                      {tournament ? tournament.name : 'Trivab Match'}
                    </span>
                  </div>
                  <span className="text-xs text-muted font-semi flex items-center gap-xs">
                    <Calendar size={14} /> {m.date} - {m.time} IST
                  </span>
                </div>

                <div className="match-scores-grid flex justify-between items-center py-md">
                  <div className="score-team flex flex-col items-center">
                    <div className="avatar avatar-md bg-secondary text-gold font-bold mb-xs" style={{ overflow: 'hidden', border: '1px solid var(--border)' }}>
                      {teamALogo ? (
                        <img src={teamALogo} alt={m.teamA} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        m.teamA[0]
                      )}
                    </div>
                    <span className="font-semi text-sm text-primary">{m.teamA}</span>
                    {(m.status === 'Completed' || m.status === 'Live') && (
                      <span className="text-lg font-bold text-gradient-gold mt-xs">{m.teamAScore || '—'}</span>
                    )}
                  </div>

                  <div className="score-vs text-center">
                    <span className="text-xs font-bold text-muted block">VS</span>
                    {m.status === 'Live' && <span className="live-dot text-xs text-red font-bold animate-pulse">LIVE MATCH</span>}
                  </div>

                  <div className="score-team flex flex-col items-center">
                    <div className="avatar avatar-md bg-secondary text-gold font-bold mb-xs" style={{ overflow: 'hidden', border: '1px solid var(--border)' }}>
                      {teamBLogo ? (
                        <img src={teamBLogo} alt={m.teamB} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        m.teamB[0]
                      )}
                    </div>
                    <span className="font-semi text-sm text-primary">{m.teamB}</span>
                    {(m.status === 'Completed' || m.status === 'Live') && (
                      <span className="text-lg font-bold text-gradient-gold mt-xs">{m.teamBScore || '—'}</span>
                    )}
                  </div>
                </div>

                {m.result && (
                  <div className="match-result text-center mb-md py-xxs px-sm rounded text-xs font-semi text-gold" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.1)' }}>
                    🏆 {m.result}
                  </div>
                )}

                <div className="divider mb-md" />

                <div className="flex justify-between items-center text-xs text-muted">
                  <span className="flex items-center gap-xs"><MapPin size={12} /> {m.venue}</span>
                  <span className="text-gold font-semi" style={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.5px' }}>Click to view Squads</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Match Details & squads Modal */}
      {selectedMatchForModal && createPortal(
        <div className="modal-overlay" onClick={() => setSelectedMatchForModal(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: 'var(--space-xl)', maxWidth: '640px', width: '100%', position: 'relative' }}>
              <button className="modal-close" onClick={() => setSelectedMatchForModal(null)} style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '1.25rem', border: 'none', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>✕</button>

              {/* Header info */}
              <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-card)', paddingBottom: '16px' }}>
                <span className={`badge ${selectedMatchForModal.status === 'Live' ? 'badge-red' : selectedMatchForModal.status === 'Upcoming' ? 'badge-gold' : 'badge-green'} mb-xs`}>
                  {selectedMatchForModal.status}
                </span>
                <h4 className="text-xs font-bold text-gold uppercase tracking-wider mt-xxs" style={{ margin: '4px 0' }}>
                  {modalTournament ? modalTournament.name : 'Trivab Tournament Fixture'}
                </h4>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', margin: '12px 0' }}>
                  <div className="avatar avatar-md bg-secondary text-gold font-bold" style={{ width: '48px', height: '48px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    {modalTeamALogo ? <img src={modalTeamALogo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : selectedMatchForModal.teamA[0]}
                  </div>
                  <h3 className="text-lg font-bold text-gradient-gold" style={{ margin: 0 }}>
                    {selectedMatchForModal.teamA} vs {selectedMatchForModal.teamB}
                  </h3>
                  <div className="avatar avatar-md bg-secondary text-gold font-bold" style={{ width: '48px', height: '48px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    {modalTeamBLogo ? <img src={modalTeamBLogo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : selectedMatchForModal.teamB[0]}
                  </div>
                </div>
                <p className="text-secondary text-xs flex justify-center items-center gap-xs mt-xs">
                  <Calendar size={12} /> {selectedMatchForModal.date} @ {selectedMatchForModal.time} IST | <MapPin size={12} /> {selectedMatchForModal.venue}
                </p>
              </div>

              {/* Match status details */}
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-card)', marginBottom: '20px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span className="text-sm font-bold text-primary block">{selectedMatchForModal.teamA}</span>
                    {(selectedMatchForModal.status === 'Completed' || selectedMatchForModal.status === 'Live') && (
                      <span className="text-xl font-bold text-gradient-gold block mt-xs">{selectedMatchForModal.teamAScore || '—'}</span>
                    )}
                  </div>
                  <span className="text-xs text-muted font-bold">VS</span>
                  <div style={{ textAlign: 'center' }}>
                    <span className="text-sm font-bold text-primary block">{selectedMatchForModal.teamB}</span>
                    {(selectedMatchForModal.status === 'Completed' || selectedMatchForModal.status === 'Live') && (
                      <span className="text-xl font-bold text-gradient-gold block mt-xs">{selectedMatchForModal.teamBScore || '—'}</span>
                    )}
                  </div>
                </div>

                {selectedMatchForModal.tossWinner && (
                  <div className="text-xs text-muted mt-md border-top pt-xs" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    🏏 <strong>Toss:</strong> {selectedMatchForModal.tossWinner} won and chose to {selectedMatchForModal.tossDecision || 'Bat'} first.
                  </div>
                )}

                {selectedMatchForModal.result && (
                  <div className="text-sm text-gold font-bold mt-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Trophy size={16} /> {selectedMatchForModal.result}
                  </div>
                )}
              </div>

            {/* Squad lists */}
            <div style={{ textAlign: 'left' }}>
              <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-sm flex items-center gap-xs" style={{ fontSize: '0.7rem' }}>
                <Users size={14} className="text-gold" /> Playing XI / XIII Squads
              </h4>

              {(!selectedMatchForModal.playing13A || selectedMatchForModal.playing13A.length === 0) && (!selectedMatchForModal.playing13B || selectedMatchForModal.playing13B.length === 0) ? (
                <p className="text-xs text-muted text-center py-md" style={{ margin: 0 }}>
                  Rosters have not been submitted/scanned by admin yet for this fixture.
                </p>
              ) : (
                <div className="grid grid-2 gap-lg mt-sm">
                  {/* Team A list */}
                  <div>
                    <h5 className="text-xs font-bold text-gold mb-xs">{selectedMatchForModal.teamA}</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '250px', overflowY: 'auto' }}>
                      {(selectedMatchForModal.playing13A || []).map((p, idx) => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-card)' }}>
                          <span className="text-xs font-bold text-muted" style={{ minWidth: '16px' }}>{idx + 1}.</span>
                          <div className="avatar avatar-sm bg-primary text-gold" style={{ width: '24px', height: '24px', fontSize: '0.65rem', borderRadius: '50%', overflow: 'hidden' }}>
                            {p.photoURL ? <img src={p.photoURL} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.fullName[0]}
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <span className="text-xs font-semi text-primary block" style={{ lineHeight: 1.1 }}>{p.fullName}</span>
                            <span className="text-muted" style={{ fontSize: '0.6rem', opacity: 0.8 }}>#{p.jerseyNumber || '—'} | {p.playingStyle || 'Player'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Team B list */}
                  <div>
                    <h5 className="text-xs font-bold text-gold mb-xs">{selectedMatchForModal.teamB}</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '250px', overflowY: 'auto' }}>
                      {(selectedMatchForModal.playing13B || []).map((p, idx) => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-card)' }}>
                          <span className="text-xs font-bold text-muted" style={{ minWidth: '16px' }}>{idx + 1}.</span>
                          <div className="avatar avatar-sm bg-primary text-gold" style={{ width: '24px', height: '24px', fontSize: '0.65rem', borderRadius: '50%', overflow: 'hidden' }}>
                            {p.photoURL ? <img src={p.photoURL} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.fullName[0]}
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <span className="text-xs font-semi text-primary block" style={{ lineHeight: 1.1 }}>{p.fullName}</span>
                            <span className="text-muted" style={{ fontSize: '0.6rem', opacity: 0.8 }}>#{p.jerseyNumber || '—'} | {p.playingStyle || 'Player'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
