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
  const [allPlayersList, setAllPlayersList] = useState([]); // All registered players in DB
  const [searchRosterA, setSearchRosterA] = useState('');
  const [searchRosterB, setSearchRosterB] = useState('');
  const [showAllPlayersA, setShowAllPlayersA] = useState(false);
  const [showAllPlayersB, setShowAllPlayersB] = useState(false);

  // Scanner & manual input states
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerTarget, setScannerTarget] = useState(''); // 'A' or 'B'
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);
  const [cameraModalError, setCameraModalError] = useState('');
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

      // Fetch all registered players in system
      const allPlayers = await getCollection('players');
      setAllPlayersList(allPlayers || []);

      const cleanStr = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
      const targetA = cleanStr(matchDoc.teamA);
      const targetB = cleanStr(matchDoc.teamB);

      const isMatch = (p, target) => {
        if (!target) return false;
        const pTeam = cleanStr(p.teamName || p.teamId || p.team);
        if (!pTeam) return false;
        return pTeam === target || pTeam.includes(target) || target.includes(pTeam);
      };

      const playersA = (allPlayers || []).filter(p => isMatch(p, targetA));
      const playersB = (allPlayers || []).filter(p => isMatch(p, targetB));

      setRosterA(playersA);
      setRosterB(playersB);

    } catch (err) {
      console.error('Error fetching match details:', err);
      setError('Failed to load match day details.');
    } finally {
      setLoading(false);
    }
  };

  // QR Code camera handler
  const startCameraScanner = (targetTeam) => {
    setScannerTarget(targetTeam);
    setCameraModalError('');
    setError('');
    setScannerActive(true);
    // Attempt auto-start camera
    setTimeout(() => {
      handleStartLiveCamera();
    }, 150);
  };

  const handleStartLiveCamera = async () => {
    setIsCameraLoading(true);
    setCameraModalError('');

    // Check secure context / HTTPS
    const isSecure = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isSecure) {
      setCameraModalError('Camera stream requires HTTPS (Secure Connection). Please open the site via HTTPS, or use Image Photo Upload / Manual Player ID entry below.');
      setIsCameraLoading(false);
      return;
    }

    try {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
        } catch (e) {}
        scannerRef.current = null;
      }

      const viewport = document.getElementById('matchday-camera-viewport');
      if (!viewport) {
        setIsCameraLoading(false);
        return;
      }

      const html5QrCode = new Html5Qrcode('matchday-camera-viewport');
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: (width, height) => {
          const minDim = Math.min(width, height);
          const boxSize = Math.max(120, Math.floor(minDim * 0.75));
          return { width: boxSize, height: boxSize };
        },
        aspectRatio: 1.0
      };

      // Camera strategy 1: facingMode environment
      try {
        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          async (decodedText) => {
            await stopCameraScanner();
            handleAddPlayerById(decodedText, scannerTarget);
          },
          () => {}
        );
      } catch (err1) {
        console.warn('facingMode environment failed, trying device enumeration:', err1);
        // Strategy 2: Get cameras and pick first available
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            const backCam = devices.find(d => /back|rear|environment/i.test(d.label)) || devices[0];
            await html5QrCode.start(
              backCam.id,
              config,
              async (decodedText) => {
                await stopCameraScanner();
                handleAddPlayerById(decodedText, scannerTarget);
              },
              () => {}
            );
          } else {
            // Strategy 3: facingMode user
            await html5QrCode.start(
              { facingMode: 'user' },
              config,
              async (decodedText) => {
                await stopCameraScanner();
                handleAddPlayerById(decodedText, scannerTarget);
              },
              () => {}
            );
          }
        } catch (err2) {
          throw err1;
        }
      }

      setIsCameraLoading(false);
    } catch (err) {
      console.error('Camera startup error:', err);
      setCameraModalError('Camera stream could not open. Ensure camera permissions are allowed in browser settings, or use Image Upload / Manual ID below.');
      setIsCameraLoading(false);
    }
  };

  const handleFileUploadScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCameraLoading(true);
    setCameraModalError('');

    try {
      let html5QrCode = scannerRef.current;
      if (!html5QrCode) {
        html5QrCode = new Html5Qrcode('matchday-camera-viewport');
        scannerRef.current = html5QrCode;
      }
      const decodedText = await html5QrCode.scanFile(file, true);
      await stopCameraScanner();
      handleAddPlayerById(decodedText, scannerTarget);
    } catch (err) {
      console.error('File scan error:', err);
      setCameraModalError('No QR code detected in the selected image. Please upload a clear photo or use manual Player ID entry.');
    } finally {
      setIsCameraLoading(false);
    }
  };

  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    scannerRef.current = null;
    setScannerActive(false);
    setIsCameraLoading(false);
    setCameraModalError('');
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
    let val = (idOrValue || '').trim().toLowerCase();
    try {
      const parsed = JSON.parse(idOrValue);
      if (parsed.playerId) val = parsed.playerId.trim().toLowerCase();
    } catch (e) {}

    const roster = targetTeam === 'A' ? rosterA : rosterB;
    let matchedPlayer = roster.find(p => 
      (p.playerId && p.playerId.toLowerCase() === val) || 
      (p.id && p.id.toLowerCase() === val) || 
      (p.qrValue && p.qrValue.toLowerCase() === val) ||
      (p.fullName && p.fullName.toLowerCase() === val)
    );

    // Fallback search across all registered players in system
    if (!matchedPlayer) {
      matchedPlayer = allPlayersList.find(p => 
        (p.playerId && p.playerId.toLowerCase() === val) || 
        (p.id && p.id.toLowerCase() === val) || 
        (p.qrValue && p.qrValue.toLowerCase() === val) ||
        (p.fullName && p.fullName.toLowerCase() === val)
      );
    }

    if (matchedPlayer) {
      handleAddPlayer(matchedPlayer, targetTeam);
      setManualPlayerId('');
    } else {
      setError(`Player "${idOrValue}" not found in database.`);
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
      </di      {/* 4. Team Squads — Side by Side */}
      <div className="matchday-squads-grid" style={{ marginBottom: '24px' }}>
        {/* Team A */}
        <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--admin-gold)', margin: 0 }}>{match.teamA}</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--admin-muted)', fontWeight: 600 }}>{playing13A.length} / 13</span>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--admin-muted)', margin: 0 }}>
                Select Registered Players ({showAllPlayersA ? allPlayersList.length : rosterA.length})
              </h4>
              {allPlayersList.length > 0 && (
                <button
                  onClick={() => setShowAllPlayersA(!showAllPlayersA)}
                  style={{ background: 'none', border: 'none', color: 'var(--admin-gold)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {showAllPlayersA ? 'Show Team Only' : 'Show All DB Players'}
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder="Search by player name or ID..."
              value={searchRosterA}
              onChange={(e) => setSearchRosterA(e.target.value)}
              className="form-input"
              style={{ fontSize: '0.8rem', padding: '6px 10px', marginBottom: '8px' }}
            />

            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {(() => {
                const listToFilter = showAllPlayersA || rosterA.length === 0 ? allPlayersList : rosterA;
                const filtered = listToFilter.filter(p => 
                  !searchRosterA.trim() || 
                  p.fullName?.toLowerCase().includes(searchRosterA.toLowerCase()) || 
                  p.playerId?.toLowerCase().includes(searchRosterA.toLowerCase())
                );

                if (filtered.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', color: 'var(--admin-muted)', padding: '16px 0', opacity: 0.7 }}>
                      <ShieldAlert size={20} style={{ margin: '0 auto 6px' }} />
                      <p style={{ margin: 0, fontSize: '0.8rem' }}>
                        {rosterA.length === 0 && !showAllPlayersA ? 'No direct team matches found. Click "Show All DB Players" above.' : 'No matching players found.'}
                      </p>
                    </div>
                  );
                }

                return filtered.map(p => {
                  const isSelected = playing13A.some(s => s.id === p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => isSelected ? handleRemovePlayer(p.id, 'A') : handleAddPlayer(p, 'A')}
                      style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 10px', borderRadius: '8px',
                        background: isSelected ? 'var(--admin-gold-dim)' : 'var(--bg-secondary)',
                        border: isSelected ? '1px solid var(--admin-border-accent)' : '1px solid var(--border-card)',
                        color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                        cursor: 'pointer', transition: 'all 0.2s',
                        textAlign: 'left', width: '100%'
                      }}
                    >
                      <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                        {p.fullName} <span style={{ opacity: 0.65, fontSize: '0.75rem' }}>({p.teamName || 'Unassigned'})</span>
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>{isSelected ? '✓ Added' : '+ Add'}</span>
                    </button>
                  );
                });
              })()}
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
                        {p.photoURL ? <img src={p.photoURL} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (p.fullName ? p.fullName[0] : 'P')}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--admin-gold)', margin: 0 }}>{match.teamB}</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--admin-muted)', fontWeight: 600 }}>{playing13B.length} / 13</span>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--admin-muted)', margin: 0 }}>
                Select Registered Players ({showAllPlayersB ? allPlayersList.length : rosterB.length})
              </h4>
              {allPlayersList.length > 0 && (
                <button
                  onClick={() => setShowAllPlayersB(!showAllPlayersB)}
                  style={{ background: 'none', border: 'none', color: 'var(--admin-gold)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {showAllPlayersB ? 'Show Team Only' : 'Show All DB Players'}
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder="Search by player name or ID..."
              value={searchRosterB}
              onChange={(e) => setSearchRosterB(e.target.value)}
              className="form-input"
              style={{ fontSize: '0.8rem', padding: '6px 10px', marginBottom: '8px' }}
            />

            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {(() => {
                const listToFilter = showAllPlayersB || rosterB.length === 0 ? allPlayersList : rosterB;
                const filtered = listToFilter.filter(p => 
                  !searchRosterB.trim() || 
                  p.fullName?.toLowerCase().includes(searchRosterB.toLowerCase()) || 
                  p.playerId?.toLowerCase().includes(searchRosterB.toLowerCase())
                );

                if (filtered.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', color: 'var(--admin-muted)', padding: '16px 0', opacity: 0.7 }}>
                      <ShieldAlert size={20} style={{ margin: '0 auto 6px' }} />
                      <p style={{ margin: 0, fontSize: '0.8rem' }}>
                        {rosterB.length === 0 && !showAllPlayersB ? 'No direct team matches found. Click "Show All DB Players" above.' : 'No matching players found.'}
                      </p>
                    </div>
                  );
                }

                return filtered.map(p => {
                  const isSelected = playing13B.some(s => s.id === p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => isSelected ? handleRemovePlayer(p.id, 'B') : handleAddPlayer(p, 'B')}
                      style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 10px', borderRadius: '8px',
                        background: isSelected ? 'var(--admin-gold-dim)' : 'var(--bg-secondary)',
                        border: isSelected ? '1px solid var(--admin-border-accent)' : '1px solid var(--border-card)',
                        color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                        cursor: 'pointer', transition: 'all 0.2s',
                        textAlign: 'left', width: '100%'
                      }}
                    >
                      <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                        {p.fullName} <span style={{ opacity: 0.65, fontSize: '0.75rem' }}>({p.teamName || 'Unassigned'})</span>
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>{isSelected ? '✓ Added' : '+ Add'}</span>
                    </button>
                  );
                });
              })()}
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
                        {p.photoURL ? <img src={p.photoURL} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (p.fullName ? p.fullName[0] : 'P')}
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
      </div>    </div>
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
        <div className="modal-overlay" onClick={stopCameraScanner} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="modal-content text-center" onClick={e => e.stopPropagation()} style={{ background: 'var(--admin-card-bg, #141720)', border: '1px solid var(--admin-border, #333)', borderRadius: '16px', padding: '20px', maxWidth: '420px', width: '100%', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--admin-gold, #d4af37)' }}>
                Scan Player QR Code (Team {scannerTarget === 'A' ? match?.teamA || 'A' : match?.teamB || 'B'})
              </h3>
              <button onClick={stopCameraScanner} style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }} title="Close Modal">
                ✕
              </button>
            </div>
            
            <div id="matchday-camera-viewport" style={{ width: '100%', height: '280px', background: '#000', borderRadius: '12px', overflow: 'hidden', position: 'relative', border: '1px solid var(--admin-border, #333)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isCameraLoading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', background: '#000', zIndex: 10 }}>
                  <Loader2 size={32} className="spin text-gold" style={{ marginBottom: '12px' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Opening camera feed...</p>
                </div>
              )}

              {cameraModalError && (
                <div style={{ padding: '16px', color: '#f87171', textAlign: 'center', zIndex: 10 }}>
                  <AlertCircle size={32} style={{ margin: '0 auto 8px', color: '#ef4444' }} />
                  <p style={{ margin: '0 0 12px', fontSize: '0.82rem', lineHeight: 1.4 }}>{cameraModalError}</p>
                  <button onClick={handleStartLiveCamera} className="btn btn-gold btn-sm" style={{ margin: '0 auto' }}>
                    <Camera size={14} /> Tap to Retry Camera
                  </button>
                </div>
              )}
            </div>

            <p style={{ margin: '12px 0 0', fontSize: '0.8rem', color: 'var(--admin-muted, #888)' }}>Align the QR code within the frame to read the profile.</p>

            {/* Redundant options: Photo Capture/Upload & Manual ID */}
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--admin-border, #333)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label className="btn btn-outline btn-xs" style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                  <Camera size={14} /> Upload or Capture QR Photo
                  <input type="file" accept="image/*" capture="environment" onChange={handleFileUploadScan} style={{ display: 'none' }} />
                </label>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#aaa', display: 'block', marginBottom: '6px' }}>Or enter Player ID manually:</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="TRIVAB-MUM-2026-9812"
                    value={manualPlayerId}
                    onChange={(e) => setManualPlayerId(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '0.85rem', flex: 1 }}
                  />
                  <button
                    onClick={() => {
                      if (manualPlayerId.trim()) {
                        handleAddPlayerById(manualPlayerId, scannerTarget);
                        stopCameraScanner();
                      }
                    }}
                    className="btn btn-gold btn-sm"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
