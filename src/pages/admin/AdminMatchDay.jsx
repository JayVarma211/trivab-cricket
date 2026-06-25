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
      <div className="page-header flex justify-between items-center mb-xl">
        <div>
          <button onClick={() => navigate('/admin/matches')} className="btn btn-outline btn-sm mb-sm flex items-center gap-xs" style={{ border: 'none', paddingLeft: 0 }}>
            <ArrowLeft size={16} /> Back to Schedule
          </button>
          <h1 className="display-sm text-gradient-gold">Match Day Console</h1>
          <p className="text-secondary">
            {match.teamA} vs {match.teamB} | {tournament ? tournament.name : 'Fixture'}
          </p>
        </div>

        <div className="flex gap-sm">
          <button onClick={handleDownloadRoster} className="btn btn-outline flex items-center gap-xs">
            <Download size={18} /> Download Roster sheets
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

      {/* Roster Scanner Camera Modal */}
      {scannerActive && (
        <div className="modal-overlay" onClick={stopCameraScanner}>
          <div className="modal-content text-center" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: 'var(--space-xl)', maxWidth: '480px', width: '100%' }}>
            <div className="flex justify-between items-center mb-md">
              <h3 className="text-md font-bold text-gradient-gold" style={{ margin: 0 }}>
                Scan Player QR Code (Team {scannerTarget})
              </h3>
              <button onClick={stopCameraScanner} className="btn btn-outline btn-sm text-red" style={{ border: 'none', background: 'none' }}><Square size={16} /></button>
            </div>
            
            <div id="matchday-camera-viewport" style={{ width: '100%', aspectRatio: '1.0', background: '#000', borderRadius: '12px', overflow: 'hidden', position: 'relative', border: '1px solid var(--border-card)' }}>
              {isCameraLoading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <Loader2 size={32} className="spin text-gold mb-sm" />
                  <p className="text-xs">Initializing camera feed...</p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted mt-md">Align the QR code within the camera scanner frame to read the player profile.</p>
          </div>
        </div>
      )}

      <div className="matchday-layout-grid">
        {/* LEFT COLUMN: Team A playing squad */}
        <div className="card card-gold col-1">
          <h2 className="text-lg font-bold text-gradient-gold flex justify-between items-center">
            <span>{match.teamA}</span>
            <span className="text-sm font-normal text-secondary">{playing13A.length} / 13</span>
          </h2>
          <p className="text-xs text-muted mb-md">Manage the Playing 13 roster list for Team A.</p>

          {/* Quick selection dropdown / checklist */}
          <div className="quick-selection-section mb-md p-sm" style={{ background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-xs">Select Registered Players</h3>
            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {rosterA.length === 0 ? (
                <p className="text-xs text-muted py-sm">No players registered to this team. Please check the Teams/Players manager.</p>
              ) : (
                rosterA.map(p => {
                  const isSelected = playing13A.some(s => s.id === p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => isSelected ? handleRemovePlayer(p.id, 'A') : handleAddPlayer(p, 'A')}
                      className={`flex justify-between items-center text-xs py-xxs px-xs rounded w-full text-left`}
                      style={{ 
                        background: isSelected ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
                        border: 'none',
                        color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                    >
                      <span>{p.fullName} (#{p.jerseyNumber || '—'})</span>
                      <span className="font-bold">{isSelected ? '✓ selected' : '+ add'}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="divider mb-md" />

          {/* Roster List display */}
          <div style={{ minHeight: '180px', maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {playing13A.length === 0 ? (
              <div className="text-center text-muted py-lg">
                <p className="text-xs">No players added to squad yet.</p>
              </div>
            ) : (
              playing13A.map((p, idx) => (
                <div key={p.id} className="flex justify-between items-center p-sm" style={{ background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-card)' }}>
                  <div className="flex items-center gap-xs">
                    <span className="text-xs font-bold text-muted">{idx + 1}.</span>
                    <div className="avatar avatar-sm bg-primary text-gold" style={{ width: '28px', height: '28px', fontSize: '0.75rem', borderRadius: '50%', overflow: 'hidden' }}>
                      {p.photoURL ? <img src={p.photoURL} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.fullName[0]}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <span className="text-xs font-semi text-primary block" style={{ lineHeight: 1.1 }}>{p.fullName}</span>
                      <span className="text-muted" style={{ fontSize: '0.65rem' }}>#{p.jerseyNumber || '—'} | {p.playingStyle || 'Player'}</span>
                    </div>
                  </div>
                  <button onClick={() => handleRemovePlayer(p.id, 'A')} className="btn-table-action text-red" style={{ background: 'none', border: 'none', cursor: 'pointer' }} title="Remove">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MIDDLE COLUMN: Controller Dashboard */}
        <div className="card col-1 flex flex-col justify-between" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-card)' }}>
          <div>
            <h2 className="text-lg font-bold text-gradient-gold pb-xs mb-md" style={{ borderBottom: '1px solid var(--border-card)' }}>
              Console Actions
            </h2>

            {/* QR Scanner Controls */}
            <div className="mb-lg">
              <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-sm">Barcode / QR Scanner</h3>
              <div className="flex gap-sm mb-sm">
                <button
                  onClick={() => startCameraScanner('A')}
                  disabled={match.status === 'Completed'}
                  className="btn btn-outline flex-1 flex items-center justify-center gap-xs text-xs py-sm"
                  style={{ opacity: match.status === 'Completed' ? 0.5 : 1 }}
                >
                  <Camera size={14} /> Scan Team A
                </button>
                <button
                  onClick={() => startCameraScanner('B')}
                  disabled={match.status === 'Completed'}
                  className="btn btn-outline flex-1 flex items-center justify-center gap-xs text-xs py-sm"
                  style={{ opacity: match.status === 'Completed' ? 0.5 : 1 }}
                >
                  <Camera size={14} /> Scan Team B
                </button>
              </div>

              {/* Manual player ID entry */}
              <div className="flex gap-xs mt-sm">
                <select
                  value={manualTarget}
                  onChange={(e) => setManualTarget(e.target.value)}
                  className="form-select text-xs"
                  style={{ width: '70px', padding: '6px' }}
                >
                  <option value="A">Team A</option>
                  <option value="B">Team B</option>
                </select>
                <input
                  type="text"
                  placeholder="Player ID or QR raw code..."
                  value={manualPlayerId}
                  onChange={(e) => setManualPlayerId(e.target.value)}
                  className="form-input text-xs"
                  style={{ flex: 1, padding: '6px' }}
                />
                <button
                  onClick={() => handleAddPlayerById(manualPlayerId, manualTarget)}
                  className="btn btn-gold btn-sm flex items-center gap-xxs"
                  style={{ padding: '6px 12px' }}
                >
                  <UserPlus size={14} /> Add
                </button>
              </div>
            </div>

            <div className="divider mb-lg" />

            {/* Match Day Status Flow */}
            <div className="mb-lg">
              <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-sm">Fixture Status: <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>{match.status}</span></h3>
              
              {match.status === 'Upcoming' && (
                <button
                  onClick={handleBeginMatch}
                  disabled={actionLoading}
                  className="btn btn-gold w-full flex items-center justify-center gap-xs"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', border: 'none' }}
                >
                  {actionLoading ? <Loader2 size={18} className="spin" /> : <Play size={18} />} Begin Match Day
                </button>
              )}

              {match.status === 'Live' && (
                <div className="alert alert-gold" style={{ display: 'flex', gap: '8px', padding: '8px 12px', background: 'rgba(212,175,55,0.08)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <Play size={16} className="text-gold animate-pulse" />
                  <span className="text-xs">Match is currently Live! You can update scores and results below at any time.</span>
                </div>
              )}

              {match.status === 'Completed' && (
                <div className="alert alert-success" style={{ display: 'flex', gap: '8px', padding: '8px 12px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '6px', color: '#22c55e' }}>
                  <CheckCircle2 size={16} />
                  <span className="text-xs">Match has been Completed. Roster statistics have been updated.</span>
                </div>
              )}
            </div>

            {/* Scoring updates panel (active when Live or Completed) */}
            {(match.status === 'Live' || match.status === 'Completed') && (
              <div className="scoring-panel p-sm card" style={{ background: 'var(--bg-secondary)' }}>
                <h3 className="text-xs font-bold text-gradient-gold mb-md uppercase tracking-wider">Score Sheet Updates</h3>
                
                <div className="form-group mb-sm">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Toss Winner</label>
                  <select
                    value={tossWinner}
                    onChange={(e) => setTossWinner(e.target.value)}
                    className="form-select text-xs"
                  >
                    <option value="">Select Toss Winner</option>
                    <option value={match.teamA}>{match.teamA}</option>
                    <option value={match.teamB}>{match.teamB}</option>
                  </select>
                </div>

                <div className="form-group mb-sm">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Toss Decision</label>
                  <select
                    value={tossDecision}
                    onChange={(e) => setTossDecision(e.target.value)}
                    className="form-select text-xs"
                  >
                    <option value="Bat">Bat</option>
                    <option value="Bowl">Bowl</option>
                  </select>
                </div>

                <div className="form-group mb-sm">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>{match.teamA} Score</label>
                  <input
                    type="text"
                    placeholder="e.g. 185/6 (20 ov)"
                    value={teamAScore}
                    onChange={(e) => setTeamAScore(e.target.value)}
                    className="form-input text-xs"
                  />
                </div>

                <div className="form-group mb-sm">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>{match.teamB} Score</label>
                  <input
                    type="text"
                    placeholder="e.g. 162/9 (20 ov)"
                    value={teamBScore}
                    onChange={(e) => setTeamBScore(e.target.value)}
                    className="form-input text-xs"
                  />
                </div>

                <div className="form-group mb-md">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Match Result / Summary</label>
                  <input
                    type="text"
                    placeholder="e.g. Supernovas won by 23 runs"
                    value={matchResult}
                    onChange={(e) => setMatchResult(e.target.value)}
                    className="form-input text-xs"
                  />
                </div>

                <button
                  onClick={handleCompleteMatch}
                  disabled={actionLoading}
                  className="btn btn-gold w-full text-xs py-sm flex items-center justify-center gap-xs"
                >
                  {actionLoading ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />} 
                  {match.status === 'Completed' ? 'Update Match Scores' : 'Complete Match & Update Stats'}
                </button>
              </div>
            )}
          </div>

          <div style={{ marginTop: '16px', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Powered by TRIVAB Sports Management Platform
          </div>
        </div>

        {/* RIGHT COLUMN: Team B playing squad */}
        <div className="card card-gold col-1">
          <h2 className="text-lg font-bold text-gradient-gold flex justify-between items-center">
            <span>{match.teamB}</span>
            <span className="text-sm font-normal text-secondary">{playing13B.length} / 13</span>
          </h2>
          <p className="text-xs text-muted mb-md">Manage the Playing 13 roster list for Team B.</p>

          {/* Quick selection dropdown / checklist */}
          <div className="quick-selection-section mb-md p-sm" style={{ background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-xs">Select Registered Players</h3>
            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {rosterB.length === 0 ? (
                <p className="text-xs text-muted py-sm">No players registered to this team. Please check the Teams/Players manager.</p>
              ) : (
                rosterB.map(p => {
                  const isSelected = playing13B.some(s => s.id === p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => isSelected ? handleRemovePlayer(p.id, 'B') : handleAddPlayer(p, 'B')}
                      className={`flex justify-between items-center text-xs py-xxs px-xs rounded w-full text-left`}
                      style={{ 
                        background: isSelected ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
                        border: 'none',
                        color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                    >
                      <span>{p.fullName} (#{p.jerseyNumber || '—'})</span>
                      <span className="font-bold">{isSelected ? '✓ selected' : '+ add'}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="divider mb-md" />

          {/* Roster List display */}
          <div style={{ minHeight: '180px', maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {playing13B.length === 0 ? (
              <div className="text-center text-muted py-lg">
                <p className="text-xs">No players added to squad yet.</p>
              </div>
            ) : (
              playing13B.map((p, idx) => (
                <div key={p.id} className="flex justify-between items-center p-sm" style={{ background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-card)' }}>
                  <div className="flex items-center gap-xs">
                    <span className="text-xs font-bold text-muted">{idx + 1}.</span>
                    <div className="avatar avatar-sm bg-primary text-gold" style={{ width: '28px', height: '28px', fontSize: '0.75rem', borderRadius: '50%', overflow: 'hidden' }}>
                      {p.photoURL ? <img src={p.photoURL} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.fullName[0]}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <span className="text-xs font-semi text-primary block" style={{ lineHeight: 1.1 }}>{p.fullName}</span>
                      <span className="text-muted" style={{ fontSize: '0.65rem' }}>#{p.jerseyNumber || '—'} | {p.playingStyle || 'Player'}</span>
                    </div>
                  </div>
                  <button onClick={() => handleRemovePlayer(p.id, 'B')} className="btn-table-action text-red" style={{ background: 'none', border: 'none', cursor: 'pointer' }} title="Remove">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
