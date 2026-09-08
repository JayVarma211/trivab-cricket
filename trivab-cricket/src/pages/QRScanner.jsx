import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { getDocument, logQRScan } from '../firebase/firestore';
import { Scan, ShieldAlert, ShieldCheck, Camera, Search, UserCheck, RefreshCw, Users, AlertTriangle } from 'lucide-react';
import './QRScanner.css';

export default function QRScanner() {
  const navigate = useNavigate();
  const [playerInfo, setPlayerInfo] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [status, setStatus] = useState('idle'); // idle | scanning | verified | failed
  const [errorMessage, setErrorMessage] = useState('');
  const [cameraError, setCameraError] = useState(false);
  const [scannerActive, setScannerActive] = useState(true);

  // Team Selection Mode (All, Team A, Team B)
  const [selectedTeamMode, setSelectedTeamMode] = useState('all'); // 'all' | 'teamA' | 'teamB'
  const [teamAName, setTeamAName] = useState('Team A');
  const [teamBName, setTeamBName] = useState('Team B');

  const scannerRef = useRef(null);

  const initScanner = () => {
    setCameraError(false);
    
    // Ensure target DOM node exists before rendering
    const container = document.getElementById('qr-scanner-camera-box');
    if (!container) return;

    try {
      // Clear any prior instance
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }

      const scanner = new Html5QrcodeScanner(
        'qr-scanner-camera-box',
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minDim = Math.min(viewfinderWidth, viewfinderHeight);
            const boxSize = Math.max(140, Math.floor(minDim * 0.75));
            return { width: boxSize, height: boxSize };
          },
          aspectRatio: 1.0,
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
        },
        /* verbose= */ false
      );

      scannerRef.current = scanner;

      scanner.render(
        async (decodedText) => {
          // Pause/Clear scanner safely on code match
          try {
            await scanner.clear();
          } catch (e) {
            console.log('Scanner clear handle', e);
          }
          setScannerActive(false);
          handleVerification(decodedText);
        },
        (error) => {
          // Ignore repeated frame scanning error logs
        }
      );
    } catch (err) {
      console.error('Camera Scanner initialization error:', err);
      setCameraError(true);
    }
  };

  useEffect(() => {
    initScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.log('Cleanup warning:', e));
      }
    };
  }, []);

  const restartScanner = () => {
    setStatus('idle');
    setPlayerInfo(null);
    setErrorMessage('');
    setScannerActive(true);
    setTimeout(() => {
      initScanner();
    }, 100);
  };

  const handleVerification = async (dataString) => {
    setStatus('scanning');
    setErrorMessage('');
    setPlayerInfo(null);

    try {
      let parsedData = {};
      try {
        parsedData = JSON.parse(dataString);
      } catch {
        parsedData = { playerId: dataString }; // raw string fallback
      }

      if (!parsedData.playerId) {
        throw new Error('Invalid QR Code. No Player ID detected.');
      }

      // Query player database
      const profile = await getDocument('players', parsedData.playerId);

      if (profile) {
        setPlayerInfo(profile);
        setStatus('verified');

        // Log the scan activity
        await logQRScan({
          playerId: profile.playerId,
          fullName: profile.fullName,
          teamName: profile.teamName,
          scannedAt: new Date().toISOString(),
          status: 'Success'
        });
      } else {
        setStatus('failed');
        setErrorMessage(`Player ID "${parsedData.playerId}" was not found in active database.`);
        
        // Log failed activity
        await logQRScan({
          playerId: parsedData.playerId,
          scannedAt: new Date().toISOString(),
          status: 'Not Found'
        });

        // Auto route to register after pause if player isn't found
        setTimeout(() => {
          navigate('/register');
        }, 3500);
      }
    } catch (err) {
      setStatus('failed');
      setErrorMessage(err.message || 'Verification error. Please scan again.');
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      handleVerification(searchId.trim());
    }
  };

  // Helper check for Team A / Team B validation
  const getTeamValidation = () => {
    if (!playerInfo) return null;
    const playerTeam = (playerInfo.teamName || '').toLowerCase().trim();

    if (selectedTeamMode === 'teamA') {
      const matchName = teamAName.toLowerCase().trim();
      const isValid = playerTeam.includes(matchName) || matchName.includes(playerTeam) || selectedTeamMode === 'teamA';
      return {
        matched: isValid,
        targetTeam: teamAName,
        message: isValid
          ? `Verified for ${teamAName}`
          : `Team Warning: Player is in "${playerInfo.teamName}", not "${teamAName}"`
      };
    }

    if (selectedTeamMode === 'teamB') {
      const matchName = teamBName.toLowerCase().trim();
      const isValid = playerTeam.includes(matchName) || matchName.includes(playerTeam) || selectedTeamMode === 'teamB';
      return {
        matched: isValid,
        targetTeam: teamBName,
        message: isValid
          ? `Verified for ${teamBName}`
          : `Team Warning: Player is in "${playerInfo.teamName}", not "${teamBName}"`
      };
    }

    return { matched: true, message: 'Verified Active Member' };
  };

  const teamCheck = getTeamValidation();

  return (
    <div className="scanner-page page-enter container section-padding">
      <div className="section-header">
        <span className="section-label">Verify Squads</span>
        <h1 className="section-title">Match Day <span className="text-gradient-gold">QR Scanner</span></h1>
        <p className="section-subtitle">Scan player digital IDs to verify roster eligibility for Team A vs Team B.</p>
      </div>

      {/* Team Selection Mode Tabs */}
      <div className="team-scan-selector card mb-lg">
        <div className="flex items-center gap-sm mb-sm text-gold text-sm font-bold">
          <Users size={18} /> Select Scanning Team Mode:
        </div>
        <div className="team-pill-group">
          <button
            className={`team-pill ${selectedTeamMode === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedTeamMode('all')}
          >
            All Players
          </button>
          <button
            className={`team-pill team-a-pill ${selectedTeamMode === 'teamA' ? 'active' : ''}`}
            onClick={() => setSelectedTeamMode('teamA')}
          >
            {teamAName} (Team A)
          </button>
          <button
            className={`team-pill team-b-pill ${selectedTeamMode === 'teamB' ? 'active' : ''}`}
            onClick={() => setSelectedTeamMode('teamB')}
          >
            {teamBName} (Team B)
          </button>
        </div>

        {/* Custom Team Name Inputs */}
        <div className="team-names-row mt-sm flex gap-md">
          <div className="flex-1">
            <label className="text-xs text-muted block mb-xs">Team A Name:</label>
            <input
              type="text"
              className="form-input text-xs"
              value={teamAName}
              onChange={(e) => setTeamAName(e.target.value)}
              placeholder="e.g. Mumbai Knights"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted block mb-xs">Team B Name:</label>
            <input
              type="text"
              className="form-input text-xs"
              value={teamBName}
              onChange={(e) => setTeamBName(e.target.value)}
              placeholder="e.g. Delhi Dynamos"
            />
          </div>
        </div>
      </div>

      <div className="scanner-grid">
        {/* Camera container */}
        <div className="card card-gold camera-card">
          <div className="camera-header flex justify-between items-center">
            <div className="flex items-center gap-sm">
              <Camera size={20} className="text-gold" />
              <span className="text-sm font-bold">Camera Feed</span>
            </div>
            {!scannerActive && (
              <button onClick={restartScanner} className="btn btn-gold btn-xs flex items-center gap-xs">
                <RefreshCw size={14} /> Re-open Camera
              </button>
            )}
          </div>

          <div id="qr-scanner-camera-box" style={{ width: '100%', minHeight: '280px' }} />

          {cameraError && (
            <div className="alert alert-error text-xs mt-sm">
              Camera access error or permission denied. Ensure camera permissions are enabled in your mobile browser, or use manual search below.
            </div>
          )}

          <div className="divider" style={{ margin: '15px 0' }} />

          <form onSubmit={handleManualSearch} className="manual-search-form">
            <span className="text-xs text-muted block mb-xs">Enter Player ID code manually:</span>
            <div className="flex gap-sm">
              <input
                type="text"
                placeholder="TRIVAB-MUM-2026-9812"
                className="form-input text-sm"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
              <button type="submit" className="btn btn-gold btn-sm">
                <Search size={16} /> Verify
              </button>
            </div>
          </form>
        </div>

        {/* Results Panel */}
        <div className="card results-card">
          <h3 className="text-lg font-bold mb-md text-gradient-gold flex items-center gap-sm">
            <UserCheck size={20} /> Verification Results
          </h3>

          {status === 'idle' && (
            <div className="scan-status-placeholder text-center text-muted py-lg">
              <Scan size={48} className="text-muted animate-pulse mb-sm" style={{ margin: '0 auto' }} />
              <p className="text-sm">Position QR Code in camera frame or search Player ID above.</p>
              {selectedTeamMode !== 'all' && (
                <span className="badge badge-gold mt-sm">
                  Filter Active: {selectedTeamMode === 'teamA' ? teamAName : teamBName}
                </span>
              )}
            </div>
          )}

          {status === 'scanning' && (
            <div className="scan-status-placeholder text-center text-gold py-lg">
              <div className="spinner mb-sm" style={{ margin: '0 auto' }} />
              <p className="text-sm">Verifying with database...</p>
            </div>
          )}

          {status === 'verified' && playerInfo && (
            <div className="verified-details animate-fade-in-up">
              {teamCheck && teamCheck.matched ? (
                <div className="alert alert-success flex gap-sm items-center mb-md">
                  <ShieldCheck size={20} />
                  <span className="text-sm font-bold">{teamCheck.message.toUpperCase()}</span>
                </div>
              ) : (
                <div className="alert alert-warning flex gap-sm items-center mb-md">
                  <AlertTriangle size={20} />
                  <span className="text-sm font-bold">{teamCheck?.message}</span>
                </div>
              )}

              <div className="flex gap-lg items-center mb-lg">
                <div className="result-photo">
                  {playerInfo.photoURL ? (
                    <img src={playerInfo.photoURL} alt={playerInfo.fullName} />
                  ) : (
                    <span className="avatar-lg font-bold flex items-center justify-center bg-secondary text-gold">
                      {playerInfo.fullName ? playerInfo.fullName[0] : 'P'}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-bold">{playerInfo.fullName}</h4>
                  <span className="badge badge-gold">{playerInfo.playingStyle || 'Player'}</span>
                </div>
              </div>

              <ul className="flex flex-col gap-sm result-list">
                <li className="flex justify-between">
                  <span className="text-muted text-sm">Player ID</span>
                  <span className="font-semi text-sm">{playerInfo.playerId}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted text-sm">Team Name</span>
                  <span className="font-semi text-sm text-gold">{playerInfo.teamName}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted text-sm">Jersey Number</span>
                  <span className="font-semi text-sm">#{playerInfo.jerseyNumber || 'N/A'}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted text-sm">Contact Number</span>
                  <span className="font-semi text-sm">{playerInfo.mobile || 'N/A'}</span>
                </li>
              </ul>

              <div className="mt-md text-center">
                <button onClick={restartScanner} className="btn btn-gold btn-sm w-full">
                  <RefreshCw size={16} /> Scan Next Player
                </button>
              </div>
            </div>
          )}

          {status === 'failed' && (
            <div className="verified-details animate-fade-in-up">
              <div className="alert alert-error flex gap-sm items-center mb-md">
                <ShieldAlert size={20} />
                <span className="text-sm font-bold">VERIFICATION FAILED</span>
              </div>
              <p className="text-sm text-secondary mb-md">{errorMessage}</p>
              <p className="text-xs text-muted mb-md">
                Redirecting to registration page so a profile can be created...
              </p>
              <button onClick={restartScanner} className="btn btn-gold btn-sm w-full">
                <RefreshCw size={16} /> Retry Camera Scan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
