import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCollection, getDocument, setDocument, addDocument, getPlayerByUIDOrEmail, where, orderBy, updateDocument } from '../../firebase/firestore';
import { Users, User, Award, ShieldAlert, Edit, Save, Bell, Plus, CheckCircle, Shield } from 'lucide-react';
import Loader from '../../components/common/Loader';
import './Captain.css';

export default function CaptainDashboard() {
  const { user } = useAuth();
  const [captain, setCaptain] = useState(null);
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [editMode, setEditMode] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [logoURL, setLogoURL] = useState('');
  const [saving, setSaving] = useState(false);

  // Multi-team states
  const [managedTeams, setManagedTeams] = useState([]);
  const [activeTeamId, setActiveTeamId] = useState('');
  const [allTournaments, setAllTournaments] = useState([]);
  const [availableTournamentsToRegister, setAvailableTournamentsToRegister] = useState([]);

  // New team registration form states
  const [newTeamName, setNewTeamName] = useState('');
  const [regTournamentSelection, setRegTournamentSelection] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [regMessage, setRegMessage] = useState('');
  const [regError, setRegError] = useState('');

  // Enroll active team states
  const [enrollTournamentSelection, setEnrollTournamentSelection] = useState('');
  const [enrollingTeam, setEnrollingTeam] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState('');
  const [enrollError, setEnrollError] = useState('');

  useEffect(() => {
    const fetchCaptainData = async () => {
      if (!user) return;
      try {
        const captData = await getDocument('captains', user.uid);
        setCaptain(captData);

        // Fetch all tournaments
        const tournamentsList = await getCollection('tournaments', [orderBy('createdAt', 'desc')]);
        setAllTournaments(tournamentsList);

        // Fetch all teams managed by this captain
        let captainTeams = await getCollection('teams', [
          where('captainId', '==', user.uid)
        ]);

        if (captData?.teamId && !captainTeams.some(t => t.id === captData.teamId)) {
          const fallbackTeam = await getDocument('teams', captData.teamId);
          if (fallbackTeam) {
            // Self-heal: update team's captainId in DB
            if (fallbackTeam.captainId !== user.uid) {
              await updateDocument('teams', captData.teamId, { captainId: user.uid });
              fallbackTeam.captainId = user.uid;
            }
            captainTeams.push(fallbackTeam);
          }
        }
        setManagedTeams(captainTeams);

        let selectedTeam = null;
        if (captainTeams.length > 0) {
          const currentActiveId = captainTeams.some(t => t.id === activeTeamId)
            ? activeTeamId
            : (captData?.teamId && captainTeams.some(t => t.id === captData.teamId) ? captData.teamId : captainTeams[0].id);

          setActiveTeamId(currentActiveId);
          selectedTeam = captainTeams.find(t => t.id === currentActiveId);
          setTeam(selectedTeam);

          if (selectedTeam) {
            setTeamName(selectedTeam.teamName || '');
            setLogoURL(selectedTeam.logoURL || '');
          }

          // Load players of this team from registrations
          const teamRegs = await getCollection('registrations', [
            where('teamId', '==', currentActiveId)
          ]);
          const teamPlayers = teamRegs.map(reg => ({
            id: reg.playerId,
            playerId: reg.playerId,
            fullName: reg.playerName || reg.fullName,
            photoURL: reg.photoURL,
            playingStyle: reg.playingStyle,
            jerseyNumber: reg.jerseyNumber,
            mobile: reg.mobile || ''
          }));
          setPlayers(teamPlayers);
        }

        // Filter tournaments that the captain does not have a team in yet
        const joinedTournamentIds = captainTeams.map(t => t.tournamentId).filter(id => id);
        const available = tournamentsList.filter(t => !joinedTournamentIds.includes(t.id));
        setAvailableTournamentsToRegister(available);
        setRegTournamentSelection('');

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCaptainData();
  }, [user, activeTeamId]);

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    if (!captain?.teamId) return;
    setSaving(true);
    try {
      const updated = {
        ...team,
        teamName,
        logoURL
      };
      await setDocument('teams', activeTeamId, updated);
      setTeam(updated);
      setEditMode(false);
      
      // Update managedTeams list as well so the dropdown shows the new name
      setManagedTeams(prev => prev.map(t => t.id === activeTeamId ? { ...t, teamName, logoURL } : t));
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchActiveTeam = (teamId) => {
    setActiveTeamId(teamId);
  };

  const handleRegisterNewTeam = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegMessage('');

    if (!newTeamName.trim()) {
      setRegError('Please enter a team name.');
      return;
    }
    if (!regTournamentSelection) {
      setRegError('Please select a tournament.');
      return;
    }

    const selectedTourn = allTournaments.find(t => t.id === regTournamentSelection);
    if (!selectedTourn) {
      setRegError('Selected tournament not found.');
      return;
    }

    setCreatingTeam(true);
    try {
      // 1. Create new team document
      const teamDoc = await addDocument('teams', {
        teamName: newTeamName.trim(),
        city: '',
        logoURL: '',
        captainId: user.uid,
        captainName: captain.fullName,
        playerCount: 1, // Captain is the first player
        maxPlayers: 40,
        wins: 0,
        losses: 0,
        tournamentId: regTournamentSelection,
        tournamentName: selectedTourn.name,
        createdAt: new Date().toISOString()
      });

      // 2. Fetch captain player profile
      const playerProfile = await getPlayerByUIDOrEmail(user.uid, user.email);
      if (!playerProfile) {
        throw new Error('Player profile not found. Please contact support.');
      }

      // 3. Create registrations document
      const regId = `${playerProfile.id}_${regTournamentSelection}`;
      await setDocument('registrations', regId, {
        id: regId,
        playerId: playerProfile.id,
        playerName: playerProfile.fullName,
        playerEmail: playerProfile.email,
        photoURL: playerProfile.photoURL || '',
        playingStyle: 'All-Rounder',
        jerseyNumber: '7',
        mobile: playerProfile.mobile || '',
        tournamentId: regTournamentSelection,
        tournamentName: selectedTourn.name,
        teamId: teamDoc.id,
        teamName: newTeamName.trim(),
        matchesPlayed: 0,
        joinedAt: new Date().toISOString()
      });

      // 4. Update captain player document joinedTournaments list
      const currentJoined = playerProfile.joinedTournaments || [];
      const updatedJoined = [
        ...currentJoined,
        {
          id: regTournamentSelection,
          name: selectedTourn.name,
          teamId: teamDoc.id,
          teamName: newTeamName.trim(),
          matchesPlayed: 0,
          joinedAt: new Date().toISOString()
        }
      ];
      await updateDocument('players', playerProfile.id, {
        joinedTournaments: updatedJoined
      });

      setRegMessage('Team registered successfully!');
      setNewTeamName('');

      // Select the new team as active
      setActiveTeamId(teamDoc.id);
    } catch (err) {
      console.error(err);
      setRegError(err.message || 'Failed to register team. Please try again.');
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleEnrollActiveTeam = async (e) => {
    e.preventDefault();
    setEnrollError('');
    setEnrollMessage('');

    if (!enrollTournamentSelection) {
      setEnrollError('Please select a tournament.');
      return;
    }

    const selectedTourn = allTournaments.find(t => t.id === enrollTournamentSelection);
    if (!selectedTourn) {
      setEnrollError('Selected tournament not found.');
      return;
    }

    setEnrollingTeam(true);
    try {
      // 1. Update the team document
      await updateDocument('teams', activeTeamId, {
        tournamentId: enrollTournamentSelection,
        tournamentName: selectedTourn.name
      });

      // Update local team state
      const updatedTeam = {
        ...team,
        tournamentId: enrollTournamentSelection,
        tournamentName: selectedTourn.name
      };
      setTeam(updatedTeam);

      // Update managedTeams list so it reflects the change
      setManagedTeams(prev => prev.map(t => t.id === activeTeamId ? updatedTeam : t));

      // 2. Fetch ALL players currently in this team from the `players` collection
      const squadPlayers = await getCollection('players', [
        where('teamId', '==', activeTeamId)
      ]);

      // 3. Register each player (including captain) for this tournament
      for (const player of squadPlayers) {
        const regId = `${player.id}_${enrollTournamentSelection}`;
        
        // Create registrations document
        await setDocument('registrations', regId, {
          id: regId,
          playerId: player.id,
          playerName: player.fullName,
          playerEmail: player.email,
          photoURL: player.photoURL || '',
          playingStyle: player.playingStyle || 'All-Rounder',
          jerseyNumber: player.jerseyNumber || '7',
          mobile: player.mobile || '',
          tournamentId: enrollTournamentSelection,
          tournamentName: selectedTourn.name,
          teamId: activeTeamId,
          teamName: team.teamName,
          matchesPlayed: 0,
          joinedAt: new Date().toISOString()
        });

        // Update player document joinedTournaments
        const currentJoined = player.joinedTournaments || [];
        // Check if already in joinedTournaments to avoid duplicates
        if (!currentJoined.some(jt => jt.id === enrollTournamentSelection)) {
          const updatedJoined = [
            ...currentJoined,
            {
              id: enrollTournamentSelection,
              name: selectedTourn.name,
              teamId: activeTeamId,
              teamName: team.teamName,
              matchesPlayed: 0,
              joinedAt: new Date().toISOString()
            }
          ];
          await updateDocument('players', player.id, {
            joinedTournaments: updatedJoined
          });
        }
      }

      setEnrollMessage(`Success! ${team.teamName} has been enrolled in ${selectedTourn.name}.`);
      setEnrollTournamentSelection('');

      // Reload players registrations list for the dashboard
      const teamRegs = await getCollection('registrations', [
        where('teamId', '==', activeTeamId)
      ]);
      const teamPlayers = teamRegs.map(reg => ({
        id: reg.playerId,
        playerId: reg.playerId,
        fullName: reg.playerName || reg.fullName,
        photoURL: reg.photoURL,
        playingStyle: reg.playingStyle,
        jerseyNumber: reg.jerseyNumber,
        mobile: reg.mobile || ''
      }));
      setPlayers(teamPlayers);

    } catch (err) {
      console.error(err);
      setEnrollError(err.message || 'Failed to enroll team. Please try again.');
    } finally {
      setEnrollingTeam(false);
    }
  };

  if (loading) return <Loader />;

  if (!captain) {
    return (
      <div className="container section-padding text-center">
        <h2 className="display-sm text-red">Access Restrained</h2>
        <p className="text-secondary mb-md">This dashboard is only available for verified Team Captain profiles.</p>
      </div>
    );
  }

  const limitReached = players.length >= 40;

  return (
    <div className="captain-dashboard page-enter container section-padding">
      <div className="dashboard-header flex justify-between items-end mb-xl">
        <div>
          <span className="text-gold text-sm font-bold uppercase tracking-wider">Management Center</span>
          <h1 className="display-md">Captain Dashboard</h1>
          <p className="text-secondary text-sm">Managing: <span className="text-gold font-semi">{team?.teamName || 'Roster Team'}</span></p>
        </div>
        <button className="btn btn-gold btn-sm" onClick={() => setEditMode(!editMode)}>
          <Edit size={16} /> {editMode ? 'Cancel Edit' : 'Edit Team Info'}
        </button>
      </div>

      {/* Enroll Active Team Panel */}
      {team && (!team.tournamentId || team.tournamentId === '') && (
        <div className="card card-gold mb-xl page-enter" style={{ border: '2px solid var(--gold)', background: 'rgba(212, 175, 55, 0.05)', padding: '24px' }}>
          <div className="flex justify-between items-start gap-md flex-wrap">
            <div style={{ flex: '1 1 500px' }}>
              <h3 className="text-lg font-bold text-gradient-gold mb-xs flex items-center gap-sm">
                <Award size={22} className="text-gold" /> Enroll {team.teamName} in a Tournament
              </h3>
              <p className="text-sm text-secondary mb-md">
                Your team <strong className="text-primary">{team.teamName}</strong> is registered on the platform but has not been entered into any active tournament yet. Choose a tournament below to enroll your team, open player registrations, and activate your roster.
              </p>
            </div>
            
            <form onSubmit={handleEnrollActiveTeam} className="flex gap-sm items-end flex-wrap" style={{ flex: '1 1 300px' }}>
              <div className="form-group mb-none" style={{ flex: 1, minWidth: '200px' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Available Tournaments</label>
                <select
                  className="form-select"
                  value={enrollTournamentSelection}
                  onChange={(e) => setEnrollTournamentSelection(e.target.value)}
                  required
                  disabled={enrollingTeam}
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                >
                  <option value="">-- Choose Tournament --</option>
                  {availableTournamentsToRegister.length === 0 ? (
                    <option value="" disabled>No tournaments available</option>
                  ) : (
                    availableTournamentsToRegister.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))
                  )}
                </select>
              </div>
              <button
                type="submit"
                className="btn btn-gold btn-sm"
                disabled={enrollingTeam || !enrollTournamentSelection}
                style={{ height: '38px', padding: '0 20px' }}
              >
                {enrollingTeam ? 'Enrolling...' : 'Enroll Team'}
              </button>
            </form>
          </div>
          {enrollMessage && <p className="text-xs text-green font-bold mt-sm" style={{ color: '#22c55e' }}>{enrollMessage}</p>}
          {enrollError && <p className="text-xs text-red font-bold mt-sm" style={{ color: '#ef4444' }}>{enrollError}</p>}
        </div>
      )}

      {/* Cap Limit Banner Notification */}
      {limitReached ? (
        <div className="alert alert-warning flex gap-sm items-center mb-xl">
          <Bell size={20} className="animate-bounce" />
          <div>
            <strong className="block text-sm">ROSTER CAP REACHED (40/40 Players)</strong>
            <span className="text-xs">Your squad contains the maximum permitted number of participants. New players will not be able to join your team.</span>
          </div>
        </div>
      ) : (
        <div className="alert alert-info flex gap-sm items-center mb-xl">
          <CheckCircle size={20} />
          <div>
            <span className="text-sm">Roster Status: <strong>{players.length} / 40 Players Registered</strong>. You can register {40 - players.length} more players.</span>
          </div>
        </div>
      )}

      <div className="captain-grid">
        {/* Team Configuration / Edit Mode */}
        {editMode ? (
          <div className="card card-gold edit-team-form">
            <h3 className="text-lg font-bold mb-md text-gradient-gold">Edit Team Profile</h3>
            <form onSubmit={handleSaveTeam} className="flex flex-col gap-md">
              <div className="form-group">
                <label className="form-label">Team Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Team Logo Image URL</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://example.com/logo.png"
                  value={logoURL}
                  onChange={(e) => setLogoURL(e.target.value)}
                  disabled={saving}
                />
              </div>
              <button type="submit" className="btn btn-gold" disabled={saving}>
                <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>
        ) : (
          <div className="card stats-panel-card">
            <h3 className="text-lg font-bold mb-md text-gradient-gold">Squad Distribution</h3>
            <div className="stats-row flex gap-lg">
              <div className="stat-box text-center">
                <span className="stat-num text-gradient-gold">{players.filter(p => p.playingStyle === 'Batsman').length}</span>
                <span className="stat-lbl block text-xs">BATSMEN</span>
              </div>
              <div className="stat-box text-center">
                <span className="stat-num text-gradient-gold">{players.filter(p => p.playingStyle === 'Bowler').length}</span>
                <span className="stat-lbl block text-xs">BOWLERS</span>
              </div>
              <div className="stat-box text-center">
                <span className="stat-num text-gradient-gold">{players.filter(p => p.playingStyle === 'Wicket Keeper').length}</span>
                <span className="stat-lbl block text-xs">KEEPERS</span>
              </div>
              <div className="stat-box text-center">
                <span className="stat-num text-gradient-gold">{players.filter(p => p.playingStyle === 'All-Rounder').length}</span>
                <span className="stat-lbl block text-xs">ALL-ROUNDERS</span>
              </div>
            </div>
          </div>
        )}

        {/* Players List */}
        <div className="card players-table-card">
          <h3 className="text-lg font-bold mb-sm text-gradient-gold flex items-center gap-sm">
            <Users size={20} /> Squad Players List ({players.length})
          </h3>
          <div className="alert alert-info flex gap-xs items-center mb-md" style={{ padding: '10px 14px', background: 'rgba(128, 0, 0, 0.15)', border: '1px solid rgba(128, 0, 0, 0.3)', color: 'var(--text-primary)', borderRadius: '6px', marginBottom: '16px' }}>
            <ShieldAlert size={16} style={{ color: 'var(--gold)' }} />
            <span style={{ fontSize: '0.8rem' }}><strong>Roster Management:</strong> Player additions/removals are restricted to Administrators. Captains have read-only access to squad records.</span>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>ID</th>
                  <th>Style</th>
                  <th>Jersey</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {players.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">No players have registered to this team yet.</td>
                  </tr>
                ) : (
                  players.map((p) => (
                    <tr key={p.playerId}>
                      <td className="flex items-center gap-sm font-semi text-primary">
                        <div className="avatar avatar-sm">
                          {p.photoURL ? <img src={p.photoURL} alt={p.fullName} /> : p.fullName[0]}
                        </div>
                        {p.fullName}
                      </td>
                      <td>{p.playerId}</td>
                      <td>
                        <span className="badge badge-gold">{p.playingStyle}</span>
                      </td>
                      <td className="font-bold">#{p.jerseyNumber}</td>
                      <td>{p.mobile}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Roster & New Team Enrollment Section */}
        <div className="card mt-xl" style={{ gridColumn: 'span 2' }}>
          <h3 className="text-lg font-bold mb-md text-gradient-gold flex items-center gap-sm">
            <Shield size={20} /> Managed Teams & Tournament Registration
          </h3>

          <div className="grid grid-2 gap-xl">
            {/* Roster active team selection */}
            <div>
              <h4 className="text-sm font-bold mb-sm opacity-80">Select Active Managed Team</h4>
              <div className="form-group mb-md">
                <select
                  className="form-select"
                  value={activeTeamId}
                  onChange={(e) => handleSwitchActiveTeam(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                >
                  {managedTeams.length === 0 ? (
                    <option value="">-- No teams registered --</option>
                  ) : (
                    managedTeams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.teamName} [{t.tournamentName || 'Tournament'}]
                      </option>
                    ))
                  )}
                </select>
              </div>

              {team && (
                <div className="p-sm" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-card)', borderRadius: '8px' }}>
                  <h4 className="text-sm font-bold text-gradient-gold">{team.teamName}</h4>
                  <p className="text-xs text-muted mt-xs">Tournament: <strong>{team.tournamentName || 'N/A'}</strong></p>
                  <p className="text-xs text-muted mt-xs">Roster Size: <strong>{players.length} / 40 Players</strong></p>
                </div>
              )}
            </div>

            {/* Register a team for another tournament */}
            <div style={{ borderLeft: '1px solid var(--border-card)', paddingLeft: '24px' }}>
              <h4 className="text-sm font-bold mb-sm opacity-80">Register Team in another Tournament</h4>
              <form onSubmit={handleRegisterNewTeam} className="flex flex-col gap-sm">
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>New Team Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter new team name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    required
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Select Tournament</label>
                  <select
                    className="form-select"
                    value={regTournamentSelection}
                    onChange={(e) => setRegTournamentSelection(e.target.value)}
                    required
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  >
                    <option value="">-- Choose Tournament --</option>
                    {availableTournamentsToRegister.length === 0 ? (
                      <option value="" disabled>-- All tournaments registered --</option>
                    ) : (
                      availableTournamentsToRegister.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))
                    )}
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-gold btn-sm mt-xs w-full"
                  disabled={creatingTeam || !newTeamName.trim() || !regTournamentSelection}
                >
                  {creatingTeam ? 'Registering...' : 'Register Team'}
                </button>
                {regMessage && <p className="text-xs text-green font-bold mt-xs" style={{ color: '#22c55e' }}>{regMessage}</p>}
                {regError && <p className="text-xs text-red font-bold mt-xs" style={{ color: '#ef4444' }}>{regError}</p>}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
