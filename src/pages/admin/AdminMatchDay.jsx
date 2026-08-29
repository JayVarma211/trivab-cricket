import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDocument, getCollection, updateDocument, where } from '../../firebase/firestore';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Play, CheckCircle2, AlertCircle, Camera, Download, 
  Trash2, Plus, Loader2, ArrowLeft, ShieldAlert, Square, UserPlus
} from 'lucide-react';
import './Admin.css';

export default function AdminMatchDay() {
  const { matchId } = useParams();
  const { role } = useAuth();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Players data
  const [rosterA, setRosterA] = useState([]); // All registered players for Team A
  const [rosterB, setRosterB] = useState([]); // All registered players for Team B
  const [playing13A, setPlaying13A] = useState([]); // Playing squad for Team A (max 13)
  const [playing13B, setPlaying13B] = useState([]); // Playing squad for Team B (max 13)

  // Scanner & manual input states
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerTarget, setScannerTarget] = useState(''); // 'A' or 'B'
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);
  const [manualPlayerId, setManualPlayerId] = useState('');
  const [manualTarget, setManualTarget] = useState('A');
  const scannerRef = useRef(null);

  // Score states
  const [tossWinner, setTossWinner] = useState('');
  const [tossDecision, setTossDecision] = useState('Bat');
  const [teamAScore, setTeamAScore] = useState('');
  const [teamBScore, setTeamBScore] = useState('');
  const [matchResult, setMatchResult] = useState('');

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchMatchDetails();
  }, [matchId, role, navigate]);

  useEffect(() => {
    // Check if mediaDevices are supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.isSecureContext) {
      setCameraSupported(false);
    }
    return () => {
      stopCameraScanner();
    };
  }, []);

  const fetchMatchDetails = async () => {
    setLoading(true);
    try {
      const matchDoc = await getDocument('matches', matchId);
      if (!matchDoc) {
        setError('Match fixture not found.');
        setLoading(false);
        return;
      }
      setMatch(matchDoc);
      setTossWinner(matchDoc.tossWinner || '');
      setTossDecision(matchDoc.tossDecision || 'Bat');
      setTeamAScore(matchDoc.teamAScore || '');
      setTeamBScore(matchDoc.teamBScore || '');
      setMatchResult(matchDoc.result || '');

      // Load squads if already saved
      setPlaying13A(matchDoc.playing13A || []);
      setPlaying13B(matchDoc.playing13B || []);

      // Load tournament details
      if (matchDoc.tournamentId) {
        const tournDoc = await getDocument('tournaments', matchDoc.tournamentId);
        setTournament(tournDoc);
      }

      // Fetch all players for Team A and Team B
      const playersA = await getCollection('players', [where('teamName', '==', matchDoc.teamA)]);
      const playersB = await getCollection('players', [where('teamName', '==', matchDoc.teamB)]);
      setRosterA(playersA || []);
      setRosterB(playersB || []);

    } catch (err) {
      console.error('Error fetching match details:', err);
      setError('Failed to load match day details.');
    } finally {
      setLoading(false);
    }
  };

  // QR Code camera handler
  const startCameraScanner = async (targetTeam) => {
    if (isCameraLoading || scannerActive) return;
    setIsCameraLoading(true);
    setScannerTarget(targetTeam);
    setError('');

    if (!cameraSupported) {
      setError('Camera access is not supported in this browser context (requires HTTPS).');
      setIsCameraLoading(false);
      return;
    }

    try {
      setScannerActive(true);
      // Brief pause to allow the DOM node to mount
      setTimeout(async () => {
        try {
          const html5QrCode = new Html5Qrcode('matchday-camera-viewport');
          scannerRef.current = html5QrCode;

          const config = {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            },
            aspectRatio: 1.0
          };

          await html5QrCode.start(
            { facingMode: 'environment' },
            config,
            async (decodedText) => {
              // Successfully scanned
              await stopCameraScanner();
              handleAddPlayerById(decodedText, targetTeam);
            },
            () => {}
          );
          setIsCameraLoading(false);
        } catch (err) {
          console.error('Failed to initialize Html5Qrcode:', err);
          setError('Could not open camera scanner. Please verify permissions.');
          setScannerActive(false);
          setIsCameraLoading(false);
        }
      }, 300);
    } catch (err) {
      console.error('Camera startup error:', err);
      setScannerActive(false);
      setIsCameraLoading(false);
    }
  };

  const stopCameraScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    scannerRef.current = null;
    setScannerActive(false);
    setIsCameraLoading(false);
  };

  // Handle adding player to squad
  const handleAddPlayer = (player, targetTeam) => {
    setError('');
    const squad = targetTeam === 'A' ? playing13A : playing13B;
    const setSquad = targetTeam === 'A' ? setPlaying13A : setPlaying13B;
    const opponentSquad = targetTeam === 'A' ? playing13B : playing13A;

    if (squad.length >= 13) {
      setError(`Cannot add player. Squad limit is 13 players.`);
      return;
    }

    if (squad.some(p => p.id === player.id)) {
      setError(`${player.fullName} is already selected in this squad.`);
      return;
    }

    if (opponentSquad.some(p => p.id === player.id)) {
      setError(`${player.fullName} is already selected in the opposing squad.`);
      return;
    }

    setSquad(prev => [...prev, player]);
    setSuccess(`Added ${player.fullName} to Team ${targetTeam === 'A' ? 'A' : 'B'}`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleRemovePlayer = (playerId, targetTeam) => {
    const setSquad = targetTeam === 'A' ? setPlaying13A : setPlaying13B;
    setSquad(prev => prev.filter(p => p.id !== playerId));
  };

  const handleAddPlayerById = (idOrValue, targetTeam) => {
    setError('');
    let val = idOrValue.trim();
    // Try to parse if it is JSON from QR
    try {
      const parsed = JSON.parse(idOrValue);
      if (parsed.playerId) val = parsed.playerId;
    } catch (e) {
      // Use raw text value
    }

    const roster = targetTeam === 'A' ? rosterA : rosterB;
    const matchedPlayer = roster.find(p => p.playerId === val || p.id === val || p.qrValue === val);

    if (matchedPlayer) {
      handleAddPlayer(matchedPlayer, targetTeam);
      setManualPlayerId('');
    } else {
      // Check if player exists in general database but assigned to another team
      setError(`Player ID "${val}" not found in registered roster of Team ${targetTeam === 'A' ? match.teamA : match.teamB}.`);
    }
  };

  // Download Roster sheets
  const handleDownloadRoster = () => {
    if (!match) return;

    let content = `====================================================\n`;
    content += `        TRIVAB SPORTS AND EVENTS - OFFICIAL MATCH SHEET\n`;
    content += `====================================================\n\n`;
    content += `Match Fixture: ${match.teamA} vs ${match.teamB}\n`;
    content += `Tournament   : ${tournament ? tournament.name : 'Trivab League'}\n`;
    content += `Date & Time  : ${match.date} @ ${match.time}\n`;
    content += `Venue        : ${match.venue}\n`;
    content += `Format       : ${match.format || 'T20'}\n`;
    content += `Status       : ${match.status}\n\n`;

    if (match.status === 'Completed') {
      content += `RESULT       : ${matchResult || 'TBD'}\n`;
      content += `Scores       : ${match.teamA} - ${teamAScore || 'N/A'} | ${match.teamB} - ${teamBScore || 'N/A'}\n\n`;
    }

    content += `----------------------------------------------------\n`;
    content += `TEAM A PLAYING SQUAD: ${match.teamA} (${playing13A.length} Players)\n`;
    content += `----------------------------------------------------\n`;
    if (playing13A.length === 0) {
      content += `No players selected.\n`;
    } else {
      playing13A.forEach((p, idx) => {
        content += `${String(idx + 1).padStart(2, ' ')}. [${p.playerId}] ${p.fullName.padEnd(25)} Jersey: #${p.jerseyNumber || '—'} (${p.playingStyle || 'Player'})\n`;
      });
    }
    content += `\n`;

    content += `----------------------------------------------------\n`;
    content += `TEAM B PLAYING SQUAD: ${match.teamB} (${playing13B.length} Players)\n`;
    content += `----------------------------------------------------\n`;
    if (playing13B.length === 0) {
      content += `No players selected.\n`;
    } else {
      playing13B.forEach((p, idx) => {
        content += `${String(idx + 1).padStart(2, ' ')}. [${p.playerId}] ${p.fullName.padEnd(25)} Jersey: #${p.jerseyNumber || '—'} (${p.playingStyle || 'Player'})\n`;
      });
    }
    content += `\n====================================================\n`;
    content += `Generated on: ${new Date().toLocaleString()}\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Match_${match.teamA}_vs_${match.teamB}_Rosters.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Begin Match Action
  const handleBeginMatch = async () => {
    if (playing13A.length === 0 || playing13B.length === 0) {
      setError('Please add at least 1 player to both squads before starting the match.');
      return;
    }
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {
        status: 'Live',
        playing13A,
        playing13B,
        tossWinner,
        tossDecision,
      };

      await updateDocument('matches', matchId, updateData);
      setMatch(prev => ({ ...prev, ...updateData }));
      setSuccess('Match has started! Status is now LIVE.');
    } catch (err) {
      console.error(err);
      setError('Failed to start the match.');
    } finally {
      setActionLoading(false);
    }
  };

  // Complete Match Action + Stats Update Engine
  const handleCompleteMatch = async () => {
    if (!teamAScore.trim() || !teamBScore.trim() || !matchResult.trim()) {
      setError('Please provide Team A Score, Team B Score, and the Match Result.');
      return;
    }
    if (playing13A.length === 0 || playing13B.length === 0) {
      setError('No playing squads are saved for this match. Cannot compile statistics.');
      return;
    }

    if (!window.confirm('Completing the match will update statistics (matches played) for all playing roster members. Proceed?')) {
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Update Match document in Firestore
      const updateData = {
        status: 'Completed',
        playing13A,
        playing13B,
        teamAScore,
        teamBScore,
        result: matchResult,
        tossWinner,
        tossDecision,
      };
      await updateDocument('matches', matchId, updateData);
      setMatch(prev => ({ ...prev, ...updateData }));

      // 2. Increment stats for playing squad players (playing13A & playing13B)
      const allPlayingPlayers = [...playing13A, ...playing13B];
      let updatedCount = 0;

      for (const player of allPlayingPlayers) {
        try {
          const profile = await getDocument('players', player.id);
          if (!profile) continue;

          const overallMatches = (profile.matchesPlayed || 0) + 1;
          const currentJoined = profile.joinedTournaments || [];
          let updatedJoined = [];

          if (match.tournamentId) {
            let found = false;
            updatedJoined = currentJoined.map(t => {
              const jtId = typeof t === 'string' ? t : t.id;
              if (jtId === match.tournamentId) {
                found = true;
                const mPlayed = (t.matchesPlayed || 0) + 1;
                return { ...t, matchesPlayed: mPlayed };
              }
              return t;
            });

            if (!found) {
              updatedJoined.push({
                id: match.tournamentId,
                name: tournament ? tournament.name : 'Tournament Edition',
                teamId: profile.teamId || '',
                teamName: profile.teamName || '',
                role: profile.role || 'player',
                matchesPlayed: 1,
                joinedAt: new Date().toISOString()
              });
            }
          } else {
            updatedJoined = currentJoined;
          }

          // Write stats update back to player profile
          await updateDocument('players', player.id, {
            matchesPlayed: overallMatches,
            joinedTournaments: updatedJoined
          });
          updatedCount++;
        } catch (e) {
          console.error(`Failed to update stats for player ${player.fullName}:`, e);
        }
      }

      setSuccess(`Match Completed successfully! Automatically updated stats for ${updatedCount} players.`);
    } catch (err) {
      console.error(err);
      setError('Failed to complete the match.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="container section-padding text-center"><Loader2 size={48} className="spin text-gold" style={{ margin: '0 auto' }} /><p className="mt-md">Loading Match Day Console...</p></div>;

  return (
    <div className="admin-page container section-padding">
      {/* 1. Header Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
        <button onClick={() => navigate('/admin/matches')} className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start', border: 'none', paddingLeft: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} /> Back to Schedule
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="display-sm text-gradient-gold" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>Match Day Console</h1>
            <p className="text-secondary" style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>
              {match.teamA} vs {match.teamB} | {tournament ? tournament.name : 'Fixture'}
            </p>
          </div>
          <button onClick={handleDownloadRoster} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, width: 'fit-content' }}>
            <Download size={18} /> Download Roster
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-lg flex items-center gap-sm">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-lg flex items-center gap-sm">
          <CheckCircle2 size={20} style={{ color: '#22c55e' }} />
          <span style={{ color: '#22c55e' }}>{success}</span>
        </div>
      )}

      {/* 2. Match Status Banner Card */}
      <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '24px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--admin-muted)', marginBottom: '12px' }}>Match Status</h2>
          <span className="badge badge-gold" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>{match.status}</span>
        </div>
        
        {match.status === 'Upcoming' && (
          <button
            onClick={handleBeginMatch}
            disabled={actionLoading}
            className="btn btn-gold"
            style={{ width: '100%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
          >
            {actionLoading ? <Loader2 size={18} className="spin" /> : <Play size={18} />} Begin Match Day
          </button>
        )}
        {match.status === 'Live' && (
          <div style={{ display: 'flex', gap: '12px', padding: '16px', background: 'rgba(212,175,55,0.08)', border: '1px solid var(--admin-border)', borderRadius: '12px', alignItems: 'center' }}>
            <Play size={20} className="text-gold animate-pulse" />
            <span style={{ fontSize: '0.9rem', color: 'var(--admin-text)' }}>Match is currently Live! Update scores and complete the match below.</span>
          </div>
        )}
        {match.status === 'Completed' && (
          <div style={{ display: 'flex', gap: '12px', padding: '16px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px', alignItems: 'center', color: '#22c55e' }}>
            <CheckCircle2 size={20} />
            <span style={{ fontSize: '0.9rem' }}>Match has been Completed. Statistics have been updated.</span>
          </div>
        )}
      </div>

      {/* 3. QR Scanner & Manual Entry Section */}
      <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--admin-muted)', marginBottom: '16px' }}>Squad Entry — QR Scanner & Manual Add</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={() => startCameraScanner('A')}
            disabled={match.status === 'Completed'}
            className="btn btn-outline"
            style={{ flex: '1 1 calc(50% - 8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: match.status === 'Completed' ? 0.5 : 1 }}
          >
            <Camera size={16} /> Scan Team A
          </button>
          <button
            onClick={() => startCameraScanner('B')}
            disabled={match.status === 'Completed'}
            className="btn btn-outline"
            style={{ flex: '1 1 calc(50% - 8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: match.status === 'Completed' ? 0.5 : 1 }}
          >
            <Camera size={16} /> Scan Team B
          </button>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          <select
            value={manualTarget}
            onChange={(e) => setManualTarget(e.target.value)}
            className="form-select"
            style={{ width: '100px', flexShrink: 0 }}
          >
            <option value="A">Team A</option>
            <option value="B">Team B</option>
          </select>
          <input
            type="text"
            placeholder="Player ID or QR raw code..."
            value={manualPlayerId}
            onChange={(e) => setManualPlayerId(e.target.value)}
            className="form-input"
            style={{ flex: '1 1 200px' }}
          />
          <button
            onClick={() => handleAddPlayerById(manualPlayerId, manualTarget)}
            className="btn btn-gold"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
          >
            <UserPlus size={16} /> Add
          </button>
        </div>
      </div>

      {/* 4. Team Squads — Side by Side */}
      <div className="matchday-squads-grid" style={{ marginBottom: '24px' }}>
        {/* Team A */}
        <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--admin-gold)', margin: 0 }}>{match.teamA}</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--admin-muted)', fontWeight: 600 }}>{playing13A.length} / 13</span>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--admin-muted)', marginBottom: '12px' }}>Select From Registered Players</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {rosterA.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--admin-muted)', padding: '24px 0', opacity: 0.7 }}>
                  <ShieldAlert size={24} style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>No players registered</p>
                </div>
              ) : (
                rosterA.map(p => {
                  const isSelected = playing13A.some(s => s.id === p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => isSelected ? handleRemovePlayer(p.id, 'A') : handleAddPlayer(p, 'A')}
                      style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 12px', borderRadius: '8px',
                        background: isSelected ? 'var(--admin-gold-dim)' : 'var(--bg-secondary)',
                        border: isSelected ? '1px solid var(--admin-border-accent)' : '1px solid var(--border-card)',
                        color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                        cursor: 'pointer', transition: 'all 0.2s',
                        textAlign: 'left', width: '100%'
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{p.fullName} <span style={{ opacity: 0.7 }}>(#{p.jerseyNumber || '—'})</span></span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{isSelected ? '✓ Added' : '+ Add'}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
          
          <div style={{ height: '1px', background: 'var(--admin-border)', margin: '16px 0' }} />
          
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--admin-muted)', marginBottom: '12px' }}>Playing Squad</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {playing13A.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--admin-muted)', padding: '32px 0', opacity: 0.7 }}>
                  <UserPlus size={24} style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Squad is empty</p>
                </div>
              ) : (
                playing13A.map((p, idx) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--admin-muted)', width: '20px' }}>{idx + 1}.</span>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--admin-border-accent)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                        {p.photoURL ? <img src={p.photoURL} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.fullName[0]}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--admin-text)', lineHeight: 1.2 }}>{p.fullName}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>#{p.jerseyNumber || '—'} • {p.playingStyle || 'Player'}</span>
                      </div>
                    </div>
                    <button onClick={() => handleRemovePlayer(p.id, 'A')} style={{ background: 'none', border: 'none', color: 'var(--admin-red)', cursor: 'pointer', padding: '6px', opacity: 0.8 }} title="Remove">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Team B */}
        <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--admin-gold)', margin: 0 }}>{match.teamB}</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--admin-muted)', fontWeight: 600 }}>{playing13B.length} / 13</span>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--admin-muted)', marginBottom: '12px' }}>Select From Registered Players</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {rosterB.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--admin-muted)', padding: '24px 0', opacity: 0.7 }}>
                  <ShieldAlert size={24} style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>No players registered</p>
                </div>
              ) : (
                rosterB.map(p => {
                  const isSelected = playing13B.some(s => s.id === p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => isSelected ? handleRemovePlayer(p.id, 'B') : handleAddPlayer(p, 'B')}
                      style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 12px', borderRadius: '8px',
                        background: isSelected ? 'var(--admin-gold-dim)' : 'var(--bg-secondary)',
                        border: isSelected ? '1px solid var(--admin-border-accent)' : '1px solid var(--border-card)',
                        color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                        cursor: 'pointer', transition: 'all 0.2s',
                        textAlign: 'left', width: '100%'
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{p.fullName} <span style={{ opacity: 0.7 }}>(#{p.jerseyNumber || '—'})</span></span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{isSelected ? '✓ Added' : '+ Add'}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
          
          <div style={{ height: '1px', background: 'var(--admin-border)', margin: '16px 0' }} />
          
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--admin-muted)', marginBottom: '12px' }}>Playing Squad</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {playing13B.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--admin-muted)', padding: '32px 0', opacity: 0.7 }}>
                  <UserPlus size={24} style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Squad is empty</p>
                </div>
              ) : (
                playing13B.map((p, idx) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--admin-muted)', width: '20px' }}>{idx + 1}.</span>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--admin-border-accent)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                        {p.photoURL ? <img src={p.photoURL} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.fullName[0]}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--admin-text)', lineHeight: 1.2 }}>{p.fullName}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>#{p.jerseyNumber || '—'} • {p.playingStyle || 'Player'}</span>
                      </div>
                    </div>
                    <button onClick={() => handleRemovePlayer(p.id, 'B')} style={{ background: 'none', border: 'none', color: 'var(--admin-red)', cursor: 'pointer', padding: '6px', opacity: 0.8 }} title="Remove">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Score Sheet Section */}
      {(match.status === 'Live' || match.status === 'Completed') && (
        <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--admin-muted)', marginBottom: '16px' }}>Score Sheet</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">Toss Winner</label>
              <select
                value={tossWinner}
                onChange={(e) => setTossWinner(e.target.value)}
                className="form-select"
              >
                <option value="">Select Toss Winner</option>
                <option value={match.teamA}>{match.teamA}</option>
                <option value={match.teamB}>{match.teamB}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Toss Decision</label>
              <select
                value={tossDecision}
                onChange={(e) => setTossDecision(e.target.value)}
                className="form-select"
              >
                <option value="Bat">Bat</option>
                <option value="Bowl">Bowl</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{match.teamA} Score</label>
              <input
                type="text"
                placeholder="e.g. 185/6 (20 ov)"
                value={teamAScore}
                onChange={(e) => setTeamAScore(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">{match.teamB} Score</label>
              <input
                type="text"
                placeholder="e.g. 162/9 (20 ov)"
                value={teamBScore}
                onChange={(e) => setTeamBScore(e.target.value)}
                className="form-input"
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Match Result / Summary</label>
            <input
              type="text"
              placeholder="e.g. Supernovas won by 23 runs"
              value={matchResult}
              onChange={(e) => setMatchResult(e.target.value)}
              className="form-input"
            />
          </div>
          <button
            onClick={handleCompleteMatch}
            disabled={actionLoading}
            className="btn btn-gold"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
          >
            {actionLoading ? <Loader2 size={16} className="spin" /> : <CheckCircle2 size={16} />} 
            {match.status === 'Completed' ? 'Update Match Scores' : 'Complete Match & Update Stats'}
          </button>
        </div>
      )}

      {/* 6. Camera Scanner Modal */}
      {scannerActive && (
        <div className="modal-overlay" onClick={stopCameraScanner} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div className="modal-content text-center" onClick={e => e.stopPropagation()} style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '24px', maxWidth: '480px', width: '100%', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--admin-gold)' }}>
                Scan Player QR Code (Team {scannerTarget})
              </h3>
              <button onClick={stopCameraScanner} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Square size={16} />
              </button>
            </div>
            
            <div id="matchday-camera-viewport" style={{ width: '100%', aspectRatio: '1.0', background: '#000', borderRadius: '12px', overflow: 'hidden', position: 'relative', border: '1px solid var(--admin-border)' }}>
              {isCameraLoading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-muted)' }}>
                  <Loader2 size={32} className="spin text-gold" style={{ marginBottom: '12px' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Initializing camera feed...</p>
                </div>
              )}
            </div>
            <p style={{ margin: '16px 0 0', fontSize: '0.85rem', color: 'var(--admin-muted)' }}>Align the QR code within the frame to read the profile.</p>
          </div>
        </div>
      )}
    </div>
  );
}
