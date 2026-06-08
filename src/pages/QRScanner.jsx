import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { getDocument, getPlayerByEmail, logQRScan } from '../firebase/firestore';
import { Scan, ShieldAlert, ShieldCheck, Camera, Search, UserCheck, Play, Square } from 'lucide-react';
import './QRScanner.css';

export default function QRScanner() {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const [playerInfo, setPlayerInfo] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [status, setStatus] = useState('idle'); // idle | scanning | verified | failed
  const [errorMessage, setErrorMessage] = useState('');
  const [cameraSupported, setCameraSupported] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    // Check if mediaDevices are supported in this context
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.isSecureContext) {
      console.warn('Camera not supported or insecure context:', {
        mediaDevices: !!navigator.mediaDevices,
        getUserMedia: !!navigator.mediaDevices?.getUserMedia,
        secureContext: window.isSecureContext,
      });
      setCameraSupported(false);
    }

    return () => {
      // Cleanup: stop scanning if still running when page unmounts
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((e) => console.log('Scanner cleanup warning:', e));
      }
    };
  }, []);

  const startScanning = async () => {
    setErrorMessage('');
    setScanResult(null);
    setPlayerInfo(null);
    setStatus('idle');

    if (!cameraSupported) {
      setErrorMessage('Camera access is not supported in this browser context (requires HTTPS).');
      return;
    }

    try {
      setIsScanning(true);
      const html5QrCode = new Html5Qrcode('qr-scanner-camera-box');
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
        { facingMode: 'environment' }, // Explicitly request back-facing camera
        config,
        async (decodedText) => {
          // On QR Code Scan Success
          await stopScanning();
          setScanResult(decodedText);
          handleVerification(decodedText);
        },
        (errorMessage) => {
          // Silent failure logs for standard camera noise
        }
      );
    } catch (err) {
      console.error('Camera starting error:', err);
      setIsScanning(false);
      setStatus('failed');
      setErrorMessage('Could not open camera. Please check permissions and try again.');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
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
        throw new Error('Invalid QR Code content. No Player ID found.');
      }

      // Query player database
      const profile = await getDocument('players', parsedData.playerId);

      if (!profile && parsedData.email) {
        setStatus('scanning');
        const fallbackProfile = await getPlayerByEmail(parsedData.email);
        if (fallbackProfile) {
          setPlayerInfo(fallbackProfile);
          setStatus('verified');
          await logQRScan({
            playerId: fallbackProfile.playerId,
            fullName: fallbackProfile.fullName,
            teamName: fallbackProfile.teamName,
            scannedAt: new Date().toISOString(),
            status: 'Success'
          });
          return;
        }
      }

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
        setErrorMessage(`Player profile for ID "${parsedData.playerId}" does not exist in databases.`);
        
        // Log the failed activity
        await logQRScan({
          playerId: parsedData.playerId,
          scannedAt: new Date().toISOString(),
          status: 'Not Found / Routed to Register'
        });

        // Automatically route to registration form after a brief pause
        setTimeout(() => {
          navigate('/register');
        }, 3000);
      }
    } catch (err) {
      setStatus('failed');
      setErrorMessage(err.message || 'Verification failed. Re-scan.');
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      handleVerification(searchId.trim());
    }
  };

  return (
    <div className="scanner-page page-enter container section-padding">
      <div className="section-header">
        <span className="section-label">Verify Players</span>
        <h1 className="section-title">QR Code <span className="text-gradient-gold">Verification</span></h1>
        <p className="section-subtitle">Scan digital ID codes or input Player IDs to check database validation.</p>
      </div>

      <div className="scanner-grid">
        {/* Camera container */}
        <div className="card card-gold camera-card">
          <div className="camera-header">
            <Camera size={20} className="text-gold" />
            <span className="text-sm font-bold">Device Camera Scanner</span>
          </div>

          <div className="camera-action-btn-container" style={{ marginBottom: '15px' }}>
            {!isScanning ? (
              <button type="button" onClick={startScanning} className="btn btn-gold w-full flex items-center justify-center gap-sm">
                <Play size={18} /> Start Camera Scanner
              </button>
            ) : (
              <button type="button" onClick={stopScanning} className="btn btn-outline text-red w-full flex items-center justify-center gap-sm">
                <Square size={18} /> Stop Camera Scanner
              </button>
            )}
          </div>

          <div className="scanner-viewport-wrapper">
            {isScanning && <div className="scanner-laser-line" />}
            {isScanning && <div className="scanner-overlay-square" />}
            <div id="qr-scanner-camera-box">
              {!isScanning && (
                <div className="text-center text-sm text-secondary py-lg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', gap: '10px' }}>
                  <Camera size={32} style={{ color: 'var(--text-muted)' }} />
                  <p style={{ margin: 0 }}>Camera is currently off.</p>
                  <p className="text-xs text-muted" style={{ margin: 0 }}>Click the button above to start scanning.</p>
                </div>
              )}
              {isScanning && !cameraSupported && (
                <div className="text-center text-sm text-red py-lg">
                  <p>Camera access is not available in this browser or context.</p>
                  <p>Please open the app using a secure connection (HTTPS).</p>
                </div>
              )}
            </div>
          </div>

          <div className="divider" style={{ margin: '15px 0' }} />

          <form onSubmit={handleManualSearch} className="manual-search-form">
            <span className="text-xs text-muted block mb-xs">Camera issues? Enter Player ID manually:</span>
            <div className="flex gap-sm">
              <input
                type="text"
                placeholder="TRIVAB-MUM-2026-9812"
                className="form-input text-sm"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
              <button type="submit" className="btn btn-gold btn-sm">
                <Search size={16} /> Search
              </button>
            </div>
          </form>
        </div>

        {/* Results Panel */}
        <div className="card results-card">
          <h3 className="text-lg font-bold mb-md text-gradient-gold flex items-center gap-sm">
            <UserCheck size={20} /> Scan Results
          </h3>

          {status === 'idle' && (
            <div className="scan-status-placeholder text-center text-muted py-lg">
              <Scan size={48} className="text-muted animate-pulse mb-sm" style={{ margin: '0 auto' }} />
              <p className="text-sm">Position QR Code in camera frame or write the ID code to proceed.</p>
            </div>
          )}

          {status === 'scanning' && (
            <div className="scan-status-placeholder text-center text-gold py-lg">
              <div className="spinner mb-sm" style={{ margin: '0 auto' }} />
              <p className="text-sm">Fetching Firestore records...</p>
            </div>
          )}

          {status === 'verified' && playerInfo && (
            <div className="verified-details animate-fade-in-up">
              <div className="alert alert-success flex gap-sm items-center mb-md">
                <ShieldCheck size={20} />
                <span className="text-sm font-bold">VERIFIED TRIVAB MEMBER</span>
              </div>

              <div className="flex gap-lg items-center mb-lg">
                <div className="result-photo">
                  {playerInfo.photoURL ? (
                    <img src={playerInfo.photoURL} alt={playerInfo.fullName} />
                  ) : (
                    <span className="avatar-lg font-bold flex items-center justify-center bg-secondary text-gold">
                      {playerInfo.fullName[0]}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-bold">{playerInfo.fullName}</h4>
                  <span className="badge badge-gold">{playerInfo.playingStyle}</span>
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
                  <span className="font-semi text-sm">#{playerInfo.jerseyNumber}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted text-sm">Contact Number</span>
                  <span className="font-semi text-sm">{playerInfo.mobile}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted text-sm">Roster Status</span>
                  <span className="badge badge-green">Active Member</span>
                </li>
              </ul>
            </div>
          )}

          {status === 'failed' && (
            <div className="verified-details animate-fade-in-up">
              <div className="alert alert-error flex gap-sm items-center mb-md">
                <ShieldAlert size={20} />
                <span className="text-sm font-bold">VERIFICATION FAILED</span>
              </div>
              <p className="text-sm text-secondary mb-md">{errorMessage}</p>
              <p className="text-xs text-muted">
                Redirecting you to registration page so you can register a new profile...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
