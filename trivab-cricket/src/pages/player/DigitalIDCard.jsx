import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPlayerByUID, setDocument } from '../../firebase/firestore';
import { uploadPlayerQR, uploadPlayerPDF } from '../../firebase/storage';
import { generateIDCardPDF, downloadIDCardPDF } from '../../utils/generateIDCardPDF';
import { QRCodeSVG } from 'qrcode.react';
import { Award, Download, Share2, Shield, User, Trophy } from 'lucide-react';
import Loader from '../../components/common/Loader';
import './Player.css';

export default function DigitalIDCard() {
  const { user } = useAuth();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [qrBlobURL, setQrBlobURL] = useState('');
  const qrRef = useRef(null);

  useEffect(() => {
    const fetchPlayer = async () => {
      if (!user) return;
      try {
        const data = await getPlayerByUID(user.uid);
        setPlayer(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayer();
  }, [user]);

  // Handle uploading PDF and QR to storage to complete the generation loop
  const handleFinalizeStorage = async () => {
    if (!player) return;
    setGenerating(true);
    try {
      // 1. Generate PDF blob
      const pdfBlob = await generateIDCardPDF('player-card-render');
      const pdfURL = await uploadPlayerPDF(pdfBlob, player.playerId);

      // 2. Capture QR code as URL (using SVG fallback)
      const updatedData = { ...player, pdfURL };
      await setDocument('players', player.playerId, updatedData);
      setPlayer(updatedData);
      alert('Your digital ID Card PDF has been generated and saved to Firebase Storage!');
    } catch (err) {
      console.error('Finalization err:', err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <Loader />;

  if (!player) {
    return (
      <div className="container section-padding text-center">
        <h2 className="display-sm text-red">No Player Profile Found</h2>
        <p className="text-secondary mb-md">Ensure your account is registered properly as a player.</p>
      </div>
    );
  }

  // Value encoded in the QR code
  const qrValue = JSON.stringify({
    playerId: player.playerId,
    fullName: player.fullName,
    teamName: player.teamName,
    playingStyle: player.playingStyle,
    jerseyNumber: player.jerseyNumber
  });

  return (
    <div className="digital-id-page page-enter container section-padding">
      <div className="section-header">
        <span className="section-label">Player Verification</span>
        <h1 className="section-title">Digital <span className="text-gradient-gold">ID Card</span></h1>
        <p className="section-subtitle">Official verified player pass for TRIVAB Cricket Tournament matches.</p>
      </div>

      <div className="id-card-layout">
        {/* The Card Render Box */}
        <div className="card-render-wrapper">
          <div className="id-card-element" id="player-card-render">
            <div className="id-card-gold-accent" />
            <div className="id-card-inner">
              <div className="id-card-header">
                <div className="id-card-logo">
                  <Trophy size={16} /> TRIVAB
                </div>
                <div className="id-card-badge">VERIFIED PASS</div>
              </div>

              <div className="id-card-body">
                <div className="id-player-photo">
                  {player.photoURL ? (
                    <img src={player.photoURL} alt={player.fullName} />
                  ) : (
                    <User size={48} />
                  )}
                </div>

                <div className="id-player-details">
                  <h3 className="id-player-name">{player.fullName}</h3>
                  <span className="id-player-style">{player.playingStyle}</span>
                  
                  <div className="id-player-stats-row">
                    <div>
                      <span className="id-stat-lbl">TEAM</span>
                      <span className="id-stat-val text-gradient-gold">{player.teamName || 'Free Agent'}</span>
                    </div>
                    <div>
                      <span className="id-stat-lbl">JERSEY</span>
                      <span className="id-stat-val text-gradient-gold">#{player.jerseyNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="id-card-footer">
                <div className="id-code-group">
                  <span className="id-stat-lbl">PLAYER ID</span>
                  <span className="id-code-text">{player.playerId}</span>
                </div>
                <div className="id-qr-box" ref={qrRef}>
                  <QRCodeSVG value={qrValue} size={64} bgColor="#ffffff" fgColor="#000000" level="H" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info panel */}
        <div className="id-actions-panel card">
          <h2 className="text-lg font-bold text-gradient-gold">ID Card Options</h2>
          <p className="text-secondary text-sm mb-lg">
            This card is dynamically linked to your database entry. Present the QR code to tournament officials for scanning on match day to confirm your registration status.
          </p>

          <div className="flex flex-col gap-md">
            <button
              onClick={() => downloadIDCardPDF('player-card-render', `${player.playerId}.pdf`)}
              className="btn btn-gold w-full"
            >
              <Download size={18} /> Download ID Card PDF
            </button>
            <button
              onClick={handleFinalizeStorage}
              className="btn btn-outline w-full"
              disabled={generating}
            >
              <Award size={18} /> {generating ? 'Saving PDF...' : 'Upload & Sync PDF to Database'}
            </button>

            {player.pdfURL && (
              <a
                href={player.pdfURL}
                target="_blank"
                rel="noreferrer"
                className="btn btn-navy text-center w-full"
                style={{ display: 'block' }}
              >
                View Stored PDF Document
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
