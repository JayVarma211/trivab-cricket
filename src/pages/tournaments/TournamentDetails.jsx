import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDocument, getCollection, where, updateDocument, setDocument, addDocument, getPlayerByUIDOrEmail } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Trophy, Calendar, MapPin, Users, Award, Shield, Upload } from 'lucide-react';
import Loader from '../../components/common/Loader';
import uploadImageToCloudinary from '../../services/cloudinary';
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
  
  // Join Modal States
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinRole, setJoinRole] = useState(''); // 'captain' | 'player'
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLogo, setNewTeamLogo] = useState(null);
  const [newTeamLogoPreview, setNewTeamLogoPreview] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [modalError, setModalError] = useState('');

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
        console.error('Error fetching tournament details:', err);
        const fallback = PREDEFINED_TOURNAMENTS.find(p => p.id === id);
        setTournament(fallback ? {
          id: fallback.id,
          name: fallback.name,
          logo: fallback.logo,
          description: fallback.description,
          status: 'Upcoming',
          winner: 'TBD',
          runnerUp: 'TBD'
        } : null);
        setMatches([]);
        setTeams([]);
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

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewTeamLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewTeamLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleJoinTournament = async (e) => {
    if (e) e.preventDefault();
    if (!user) {
      alert('Please log in to join this tournament!');
      return;
    }
    if (!playerProfile) {
      alert('Player profile not found. Please complete your registration.');
      return;
    }
    if (!joinRole) {
      setModalError('Please select your role.');
      return;
    }

    setJoining(true);
    setModalError('');
    setJoinMessage('');

    try {
      let teamId = '';
      let teamName = '';

      if (joinRole === 'captain') {
        if (!newTeamName.trim()) {
          throw new Error('Please enter a team name.');
        }

        // Upload logo to Cloudinary if selected
        let logoURL = '';
        if (newTeamLogo) {
          try {
            logoURL = await uploadImageToCloudinary(newTeamLogo);
          } catch (err) {
            console.error(err);
            throw new Error('Failed to upload team logo.');
          }
        }

        // 1. Create a new team document
        const teamDoc = await addDocument('teams', {
          teamName: newTeamName.trim(),
          city: '',
          logoURL,
          captainId: user.uid,
          captainName: playerProfile.fullName,
          playerCount: 1, // Captain is counted as 1st player
          maxPlayers: 35,
          wins: 0,
          losses: 0,
          tournamentId: tournament.id || id,
          tournamentName: tournament.name || 'Tournament Edition',
          createdAt: new Date().toISOString()
        });

        teamId = teamDoc.id;
        teamName = newTeamName.trim();

        // 2. Write/Update the Captain profile
        const captId = `CAPT-${playerProfile.id.split('-').pop()}`;
        await setDocument('captains', user.uid, {
          captainId: captId,
          uid: user.uid,
          fullName: playerProfile.fullName,
          teamId: teamId,
          teamName: teamName,
          mobile: playerProfile.mobile || '',
          email: playerProfile.email,
          photoURL: playerProfile.photoURL || '',
          createdAt: new Date().toISOString()
        });

        // 3. Update User's global role to captain in Auth context / database
        await updateDocument('users', user.uid, {
          role: 'captain'
        });

        // 4. Send Admin Notification
        await addDocument('admin_notifications', {
          type: 'captain_joined',
          title: 'New Team Enrolled',
          message: `${playerProfile.fullName} registered team "${teamName}" as Captain for tournament "${tournament.name}"`,
          createdAt: new Date().toISOString(),
          read: false
        });

      } else {
        // Player Role
        if (!selectedTeamId) {
          throw new Error('Please select a team.');
        }

        const teamObj = teams.find(t => t.id === selectedTeamId);
        if (!teamObj) {
          throw new Error('Selected team not found.');
        }

        // Check roster limit
        if ((teamObj.playerCount || 0) >= 35) {
          throw new Error(`The team ${teamObj.teamName} has reached its limit of 35 players.`);
        }

        teamId = selectedTeamId;
        teamName = teamObj.teamName;

        // 1. Update team headcount
        await updateDocument('teams', selectedTeamId, {
          playerCount: (teamObj.playerCount || 0) + 1
        });

        // 2. Send Admin Notification
        await addDocument('admin_notifications', {
          type: 'player_joined',
          title: 'New Roster Enrollment',
          message: `${playerProfile.fullName} joined team "${teamName}" as Player for tournament "${tournament.name}"`,
          createdAt: new Date().toISOString(),
          read: false
        });
      }

      // Create a registration record for ease of relational queries
      const regId = `${playerProfile.id}_${tournament.id || id}`;
      await setDocument('registrations', regId, {
        id: regId,
        playerId: playerProfile.id,
        playerName: playerProfile.fullName,
        playerEmail: playerProfile.email,
        photoURL: playerProfile.photoURL || '',
        playingStyle: playerProfile.playingStyle || 'Batsman',
        jerseyNumber: playerProfile.jerseyNumber || '',
        mobile: playerProfile.mobile || '',
        tournamentId: tournament.id || id,
        tournamentName: tournament.name || 'Tournament Edition',
        teamId,
        teamName,
        role: joinRole,
        matchesPlayed: 0,
        joinedAt: new Date().toISOString()
      });

      // Update Player Profile joinedTournaments list locally and in DB
      const newRegistration = {
        id: tournament.id || id,
        name: tournament.name || 'Tournament Edition',
        teamId,
        teamName,
        role: joinRole,
        matchesPlayed: 0,
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
      setShowJoinModal(false);

      // Reload participating teams
      const tList = await getCollection('teams', [where('tournamentId', '==', id)]);
      setTeams(tList);

    } catch (err) {
      console.error(err);
      setModalError(err.message || 'Failed to join tournament. Please try again.');
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
                <div className="mt-md" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                  {hasJoined ? (
                    <button className="btn btn-gold btn-sm" disabled style={{ opacity: 0.8, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ✓ Joined Tournament
                    </button>
                  ) : (
                    <button className="btn btn-gold btn-sm" onClick={() => { setModalError(''); setJoinRole(''); setNewTeamName(''); setSelectedTeamId(''); setShowJoinModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Join this Tournament
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
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowJoinModal(false)}>✕</button>
            <h3 className="text-lg font-bold text-gradient-gold mb-md">Join {tournament.name}</h3>
            
            {modalError && (
              <div className="alert alert-error mb-md" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '6px' }}>
                <span className="text-xs">{modalError}</span>
              </div>
            )}

            <form onSubmit={handleJoinTournament} className="flex flex-col gap-md">
              <div className="form-group">
                <label className="form-label">Select Your Role</label>
                <select
                  className="form-select"
                  value={joinRole}
                  onChange={(e) => setJoinRole(e.target.value)}
                  required
                  disabled={joining}
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                >
                  <option value="">-- Choose Role --</option>
                  <option value="captain">Captain (Enroll a new Team)</option>
                  <option value="player">Player (Join an existing Team)</option>
                </select>
              </div>

              {joinRole === 'captain' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Team Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter new team name"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      required
                      disabled={joining}
                      style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Team Logo (Optional)</label>
                    <div className="file-upload-container">
                      {newTeamLogoPreview ? (
                        <div className="photo-preview-wrap">
                          <img src={newTeamLogoPreview} alt="Logo Preview" className="photo-preview" style={{ maxHeight: '80px', objectFit: 'contain' }} />
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setNewTeamLogo(null);
                              setNewTeamLogoPreview(null);
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="file-upload-label" style={{ padding: '15px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: '1.5px dashed var(--border-card)', borderRadius: '6px' }}>
                          <Upload size={20} />
                          <span className="text-xs font-medium">Upload Team Logo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            disabled={joining}
                            style={{ display: 'none' }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </>
              )}

              {joinRole === 'player' && (
                <div className="form-group">
                  <label className="form-label">Select Team</label>
                  <select
                    className="form-select"
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    required
                    disabled={joining}
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  >
                    <option value="">-- Choose Team --</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.teamName} ({t.playerCount || 0}/35 players)</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-gold btn-md mt-sm w-full"
                disabled={joining || !joinRole}
              >
                {joining ? 'Enrolling...' : 'Complete Enrollment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
