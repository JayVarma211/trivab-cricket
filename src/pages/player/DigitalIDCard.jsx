import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPlayerByUIDOrEmail, getDocument } from '../../firebase/firestore';
import { generateIDCardPDF, downloadIDCardPDF } from '../../utils/generateIDCardPDF';
import { QRCodeSVG } from 'qrcode.react';
import { Download, User, Trophy } from 'lucide-react';
import Loader from '../../components/common/Loader';
import './Player.css';

export default function DigitalIDCard() {
  const { user, role } = useAuth();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchPlayer = async () => {
      if (!user) return;
      try {
        let data = null;
        if (role === 'captain') {
          const captData = await getDocument('captains', user.uid);
          if (captData) {
            data = {
              ...captData,
              playerId: captData.captainId,
              playingStyle: 'Team Captain',
              jerseyNumber: 'N/A'
            };
          }
        }
        
        if (!data) {
          data = await getPlayerByUIDOrEmail(user.uid, user.email);
        }
        
        setPlayer(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayer();
  }, [user, role]);

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
    jerseyNumber: player.jerseyNumber,
    email: player.email,
    uid: player.uid
  });

  const showTeam = player.teamName && player.teamName !== 'Free Agent' && player.teamName !== 'free-agent';

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
                  <img src="/logos/trivabsports.webp" className="id-card-brand-logo" alt="TRIVAB SPORTS" />
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
                    {showTeam && (
                      <div>
                        <span className="id-stat-lbl">TEAM</span>
                        <span className="id-stat-val text-gradient-gold">{player.teamName}</span>
                      </div>
                    )}
                    <div>
                      <span className="id-stat-lbl">JERSEY</span>
                      <span className="id-stat-val text-gradient-gold">#{player.jerseyNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="id-stat-lbl">MATCHES</span>
                      <span className="id-stat-val text-gradient-gold">
                        {player.joinedTournaments
                          ? player.joinedTournaments.reduce((acc, t) => acc + (t.matchesPlayed || 0), 0)
                          : 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="id-card-footer">
                <div className="id-code-group">
                  <span className="id-stat-lbl">PLAYER ID</span>
                  <span className="id-code-text">{player.playerId}</span>
                </div>
                <div className="id-qr-box">
                  <QRCodeSVG value={player.playerId} size={64} bgColor="#ffffff" fgColor="#000000" level="H" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info panel */}
        <div className="id-actions-panel card flex flex-col items-center justify-between" style={{ minHeight: '400px' }}>
          <div>
            <h2 className="text-lg font-bold text-gradient-gold mb-sm text-center">ID Card Options</h2>
            <p className="text-secondary text-sm mb-lg text-center">
              This card is dynamically linked to your database entry. Present the QR code to tournament officials for scanning on match day to confirm your registration status.
            </p>

            <div className="flex flex-col gap-md">
              <button
                onClick={async () => {
                  setGenerating(true);
                  try {
                    await downloadIDCardPDF('player-card-render', `${player.playerId}.pdf`);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setGenerating(false);
                  }
                }}
                className="btn btn-gold w-full"
                disabled={generating}
              >
                <Download size={18} /> {generating ? 'Preparing PDF...' : 'Download ID Card PDF'}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-center gap-xs mt-lg">
            <div className="qr-container bg-white p-sm rounded-md" style={{ display: 'inline-block', padding: '12px', background: '#fff', borderRadius: '8px' }}>
              <QRCodeSVG value={player.playerId} size={220} />
            </div>
            <span className="text-xs text-muted mt-xs">Verify Pass QR: {player.playerId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
