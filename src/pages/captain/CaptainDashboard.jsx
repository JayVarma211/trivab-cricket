import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCollection, getDocument, setDocument, addDocument, getPlayerByUIDOrEmail, where, orderBy, updateDocument } from '../../firebase/firestore';
import { Users, User, Award, ShieldAlert, Edit, Save, Bell, Plus, CheckCircle, Shield, Upload, CreditCard, Clock, Calendar, AlertCircle } from 'lucide-react';
import Loader from '../../components/common/Loader';
import uploadImageToCloudinary from '../../services/cloudinary';
import { safeFormatDate, safeFormatDateTime, safeParseDate } from '../../utils/dateFormatter';
import './Captain.css';

export default function CaptainDashboard() {
  const { user } = useAuth();
  const [captain, setCaptain] = useState(null);
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamFees, setTeamFees] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Edit states
  const [editMode, setEditMode] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [logoURL, setLogoURL] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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

        const tournamentsList = await getCollection('tournaments', [orderBy('createdAt', 'desc')]);
        setAllTournaments((tournamentsList || []).filter(t => t.isActivated !== false));

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

          // Fetch team fees info
          try {
            const feesData = await getDocument('team_fees', currentActiveId);
            setTeamFees(feesData);
          } catch (feesErr) {
            console.warn("Failed to fetch team fees info:", feesErr);
            setTeamFees(null);
          }

          // Fetch payment history
          try {
            const historyData = await getCollection('payment_history', [
              where('teamId', '==', currentActiveId)
            ]);
            historyData.sort((a, b) => safeParseDate(b.createdAt).getTime() - safeParseDate(a.createdAt).getTime());
            setPaymentHistory(historyData);
          } catch (histErr) {
            console.warn("Failed to fetch payment history:", histErr);
            setPaymentHistory([]);
          }

          // Fetch announcements
          try {
            const announcementsData = await getCollection('news_events', [
              where('tag', '==', 'Announcement')
            ]);
            announcementsData.sort((a, b) => new Date(b.date) - new Date(a.date));
            setAnnouncements(announcementsData.slice(0, 1));
          } catch (announceErr) {
            console.warn("Failed to fetch announcements:", announceErr);
            setAnnouncements([]);
          }
        } else {
          setTeamFees(null);
          setPaymentHistory([]);
          setAnnouncements([]);
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

      {/* Announcements Notice Box */}
      {announcements && announcements.length > 0 && (
        <div className="card card-gold mb-xl animate-fade-in" style={{ borderLeft: '4px solid var(--gold)' }}>
          <h3 className="text-md font-bold mb-md text-gradient-gold flex items-center gap-xs">
            <Bell size={20} className="text-gold animate-bounce" /> Tournament Announcements &amp; Notices
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '16px' 
          }}>
            {announcements.map((ann, idx) => (
              <div 
                key={ann.id || idx} 
                style={{ 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-card)', 
                  borderRadius: '12px', 
                  padding: '16px', 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {ann.imageURL && (
                  <div style={{ width: '100%', height: '160px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={ann.imageURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '6px' }}>
                    <span className="badge badge-gold" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>ANNOUNCEMENT</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {safeFormatDate(ann.date)}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)', lineHeight: '1.3' }}>{ann.title}</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-line', flex: 1 }}>{ann.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="captain-grid">
        {/* FIRST: Active Managed Team Selection */}
        <div className="card">
          <h3 className="text-lg font-bold mb-md text-gradient-gold flex items-center gap-sm">
            <Shield size={20} /> Active Managed Team
          </h3>
          <div style={{ maxWidth: '600px' }}>
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
              <div className="p-sm flex items-center gap-md flex-wrap" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-card)', borderRadius: '8px', padding: '16px' }}>
                {team.logoURL ? (
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '10px',
                    border: '2px solid var(--gold)',
                    overflow: 'hidden',
                    background: 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <img src={team.logoURL} alt={team.teamName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '10px',
                    border: '2px dashed rgba(212,175,55,0.4)',
                    background: 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: 'var(--gold)'
                  }}>
                    <Shield size={32} style={{ opacity: 0.6 }} />
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <h4 className="text-base font-bold text-gradient-gold" style={{ fontSize: '1.1rem', marginBottom: '6px' }}>{team.teamName}</h4>
                  <p className="text-xs text-muted mt-xs" style={{ fontSize: '0.78rem' }}>Tournament: <strong className="text-primary">{team.tournamentName || 'N/A'}</strong></p>
                  <p className="text-xs text-muted mt-xs" style={{ fontSize: '0.78rem' }}>Roster Size: <strong className="text-primary">{players.length} / 40 Players</strong></p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tournament Fees Card */}
        {team && (() => {
          const getFeesBorderColor = (statusVal) => {
            switch (statusVal) {
              case 'Paid': return '#22c55e';
              case 'Overdue': return '#ef4444';
              case 'Pending': return '#d4af37';
              default: return 'var(--border-card)';
            }
          };

          const getFeesBgColor = (statusVal) => {
            switch (statusVal) {
              case 'Paid': return 'rgba(34, 197, 94, 0.1)';
              case 'Overdue': return 'rgba(239, 68, 68, 0.1)';
              case 'Pending': return 'rgba(212, 175, 55, 0.1)';
              default: return 'rgba(255,255,255,0.05)';
            }
          };

          const getFeesTextColor = (statusVal) => {
            switch (statusVal) {
              case 'Paid': return '#22c55e';
              case 'Overdue': return '#ef4444';
              case 'Pending': return '#d4af37';
              default: return 'var(--text-secondary)';
            }
          };

          const getFeesIcon = (statusVal) => {
            switch (statusVal) {
              case 'Paid': return <CheckCircle size={20} className="text-green" />;
              case 'Overdue': return <AlertCircle size={20} className="text-red" />;
              case 'Pending':
              default:
                return <Clock size={20} className="text-gold" />;
            }
          };

          const formatCurrency = (val) => {
            if (!val || isNaN(val)) return '₹0';
            return `₹${Number(val).toLocaleString('en-IN')}`;
          };

          const totalFee = Number(teamFees?.totalTournamentFee || parseFloat(String(teamFees?.amount || '').replace(/[^\d.]/g, '')) || 0);
          const totalPaid = Number(teamFees?.totalPaidAmount || (teamFees?.status === 'Paid' ? totalFee : 0));
          const balance = totalFee - totalPaid;

          return (
            <div className="card animate-fade-in" style={{ borderLeft: `4px solid ${getFeesBorderColor(teamFees?.status)}` }}>
              <h3 className="text-lg font-bold mb-md text-gradient-gold flex items-center gap-sm">
                <CreditCard size={20} /> Tournament Payment Details
              </h3>
              {teamFees ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Status & Message Info */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-card)', paddingBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        padding: '10px',
                        borderRadius: '8px',
                        background: getFeesBgColor(teamFees.status),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {getFeesIcon(teamFees.status)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-muted uppercase tracking-wider" style={{ margin: 0, fontSize: '0.7rem' }}>Payment Status</h4>
                        <span className="font-bold" style={{ fontSize: '1.15rem', color: getFeesTextColor(teamFees.status) }}>
                          {teamFees.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing grid */}
                  <div className="grid grid-3 gap-md">
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-card)', borderRadius: '8px' }}>
                      <h4 className="text-xs font-bold text-muted uppercase tracking-wider" style={{ margin: '0 0 4px', fontSize: '0.68rem' }}>Total Tournament Fee</h4>
                      <span className="font-bold text-primary" style={{ fontSize: '1.1rem' }}>
                        {formatCurrency(totalFee)}
                      </span>
                    </div>

                    <div style={{ padding: '12px', background: 'rgba(22,163,74,0.02)', border: '1px solid rgba(22,163,74,0.15)', borderRadius: '8px' }}>
                      <h4 className="text-xs font-bold text-muted uppercase tracking-wider" style={{ margin: '0 0 4px', fontSize: '0.68rem', color: 'rgba(34,197,94,0.8)' }}>Total Paid Amount</h4>
                      <span className="font-bold text-green" style={{ fontSize: '1.1rem', color: '#22c55e' }}>
                        {formatCurrency(totalPaid)}
                      </span>
                    </div>

                    <div style={{ padding: '12px', background: balance > 0 ? 'rgba(239,68,68,0.02)' : 'rgba(22,163,74,0.02)', border: balance > 0 ? '1px solid rgba(239,68,68,0.15)' : '1px solid rgba(22,163,74,0.15)', borderRadius: '8px' }}>
                      <h4 className="text-xs font-bold text-muted uppercase tracking-wider" style={{ margin: '0 0 4px', fontSize: '0.68rem', color: balance > 0 ? 'rgba(239,68,68,0.8)' : 'rgba(34,197,94,0.8)' }}>Remaining Balance</h4>
                      <span className="font-bold" style={{ fontSize: '1.1rem', color: balance > 0 ? '#ef4444' : '#22c55e' }}>
                        {formatCurrency(balance)}
                      </span>
                    </div>
                  </div>

                  {/* Due amount & dates grid */}
                  <div className="grid grid-3 gap-md">
                    <div>
                      <h4 className="text-xs font-bold text-muted uppercase tracking-wider" style={{ margin: '0 0 4px', fontSize: '0.68rem' }}>Last Payment Date</h4>
                      <span className="font-semi text-primary" style={{ fontSize: '0.92rem' }}>
                        {teamFees.receivingDate ? safeFormatDate(teamFees.receivingDate) : '—'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-muted uppercase tracking-wider" style={{ margin: '0 0 4px', fontSize: '0.68rem' }}>Next Due Amount</h4>
                      <span className="font-semi text-primary" style={{ fontSize: '0.92rem' }}>
                        {teamFees.nextDueAmount ? formatCurrency(teamFees.nextDueAmount) : '—'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-muted uppercase tracking-wider" style={{ margin: '0 0 4px', fontSize: '0.68rem' }}>Next Due Date</h4>
                      <span className="font-semi text-primary" style={{ fontSize: '0.92rem' }}>
                        {teamFees.nextDue ? safeFormatDate(teamFees.nextDue) : 'No due date set'}
                      </span>
                    </div>
                  </div>

                  {teamFees.message && (
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid var(--border-card)',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)'
                    }}>
                      <strong className="block text-xs uppercase tracking-wider text-gold" style={{ marginBottom: '4px', opacity: 0.8 }}>Message from Admin:</strong>
                      {teamFees.message}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-card)', paddingTop: '10px', marginTop: '4px' }}>
                    <span>Updated on: <strong>{safeFormatDateTime(teamFees.updatedAt)}</strong></span>
                    <span className="text-gold" style={{ fontWeight: '500' }}>Admin Managed Only</span>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '20px 10px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-card)', borderRadius: '8px' }}>
                  <Clock size={32} className="text-gold" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <h4 className="text-sm font-bold opacity-80" style={{ margin: '0 0 4px' }}>No Fee Record Found</h4>
                  <p className="text-xs text-muted" style={{ margin: 0, maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                    Tournament fees for your team <strong>{team.teamName}</strong> have not been configured by the admin yet. Please check back later or contact support.
                  </p>
                </div>
              )}

              {/* PAYMENT HISTORY LOG TABLE */}
              {paymentHistory && paymentHistory.length > 0 && (
                <div style={{ marginTop: '24px', borderTop: '1px dashed var(--border-card)', paddingTop: '20px' }}>
                  <h4 className="text-sm font-bold mb-md text-gradient-gold flex items-center gap-xs">
                    <Calendar size={16} /> Payment Log &amp; Transaction History
                  </h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '8px 4px', fontWeight: 'bold' }}>Payment Date</th>
                          <th style={{ padding: '8px 4px', fontWeight: 'bold' }}>Total Paid</th>
                          <th style={{ padding: '8px 4px', fontWeight: 'bold' }}>Status</th>
                          <th style={{ padding: '8px 4px', fontWeight: 'bold' }}>Next Due</th>
                          <th style={{ padding: '8px 4px', fontWeight: 'bold' }}>Message / Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistory.map((hist, idx) => (
                          <tr key={hist.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '10px 4px', color: 'var(--text-primary)' }}>
                              {hist.receivingDate ? safeFormatDate(hist.receivingDate) : safeFormatDate(hist.createdAt)}
                            </td>
                            <td style={{ padding: '10px 4px', fontWeight: 'bold', color: '#22c55e' }}>
                              {formatCurrency(hist.totalPaidAmount)}
                            </td>
                            <td style={{ padding: '10px 4px' }}>
                              <span style={{ 
                                padding: '2px 8px', 
                                borderRadius: '4px', 
                                fontSize: '0.72rem', 
                                fontWeight: 'bold',
                                color: getFeesTextColor(hist.status),
                                background: getFeesBgColor(hist.status)
                              }}>
                                {hist.status}
                              </span>
                            </td>
                            <td style={{ padding: '10px 4px', color: 'var(--text-secondary)' }}>
                              {hist.nextDue ? (
                                <div>
                                  <div style={{ fontWeight: '500' }}>{formatCurrency(hist.nextDueAmount)}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{safeFormatDate(hist.nextDue)}</div>
                                </div>
                              ) : '—'}
                            </td>
                            <td style={{ padding: '10px 4px', color: 'var(--text-muted)', fontSize: '0.78rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={hist.message || ''}>
                              {hist.message || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* SECOND: Squad Distribution or Edit Mode Form */}
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
                <label className="form-label">Team Logo</label>
                {logoURL ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                    <img src={logoURL} alt="Preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => setLogoURL('')}
                    >
                      Remove Logo
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        setUploadingLogo(true);
                        try {
                          const url = await uploadImageToCloudinary(file);
                          setLogoURL(url);
                          alert('Logo uploaded successfully!');
                        } catch (err) {
                          console.error(err);
                          alert('Failed to upload logo.');
                        } finally {
                          setUploadingLogo(false);
                        }
                      }}
                      disabled={uploadingLogo || saving}
                      style={{ display: 'none' }}
                      id="captain-team-logo-upload"
                    />
                    <label htmlFor="captain-team-logo-upload" className="btn btn-outline btn-sm" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Upload size={16} />
                      {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    </label>
                  </div>
                )}
              </div>
              <button type="submit" className="btn btn-gold" disabled={saving || uploadingLogo}>
                <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>
        ) : (
          <div className="card stats-panel-card" style={{ padding: '20px' }}>
            <h3 className="text-lg font-bold mb-sm text-gradient-gold">Squad Distribution</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '12px', 
              marginTop: '12px' 
            }}>
              <div className="stat-box text-center" style={{ minWidth: 'auto', padding: '12px 8px' }}>
                <span className="stat-num text-gradient-gold" style={{ fontSize: '1.6rem', display: 'block', fontWeight: 800 }}>{players.filter(p => p.playingStyle === 'Batsman').length}</span>
                <span className="stat-lbl block text-xs" style={{ fontSize: '0.65rem', letterSpacing: '0.05em', color: 'var(--text-muted)', marginTop: '2px' }}>BATSMEN</span>
              </div>
              <div className="stat-box text-center" style={{ minWidth: 'auto', padding: '12px 8px' }}>
                <span className="stat-num text-gradient-gold" style={{ fontSize: '1.6rem', display: 'block', fontWeight: 800 }}>{players.filter(p => p.playingStyle === 'Bowler').length}</span>
                <span className="stat-lbl block text-xs" style={{ fontSize: '0.65rem', letterSpacing: '0.05em', color: 'var(--text-muted)', marginTop: '2px' }}>BOWLERS</span>
              </div>
              <div className="stat-box text-center" style={{ minWidth: 'auto', padding: '12px 8px' }}>
                <span className="stat-num text-gradient-gold" style={{ fontSize: '1.6rem', display: 'block', fontWeight: 800 }}>{players.filter(p => p.playingStyle === 'Wicket Keeper').length}</span>
                <span className="stat-lbl block text-xs" style={{ fontSize: '0.65rem', letterSpacing: '0.05em', color: 'var(--text-muted)', marginTop: '2px' }}>KEEPERS</span>
              </div>
              <div className="stat-box text-center" style={{ minWidth: 'auto', padding: '12px 8px' }}>
                <span className="stat-num text-gradient-gold" style={{ fontSize: '1.6rem', display: 'block', fontWeight: 800 }}>{players.filter(p => p.playingStyle === 'All-Rounder').length}</span>
                <span className="stat-lbl block text-xs" style={{ fontSize: '0.65rem', letterSpacing: '0.05em', color: 'var(--text-muted)', marginTop: '2px' }}>ALL-ROUNDERS</span>
              </div>
            </div>
          </div>
        )}

        {/* THIRD: Players List */}
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
      </div>
    </div>
  );
}
