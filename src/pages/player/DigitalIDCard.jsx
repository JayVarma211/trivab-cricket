import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPlayerByUIDOrEmail, getDocument } from '../../firebase/firestore';
import { downloadIDCardPDF } from '../../utils/generateIDCardPDF';
import { QRCodeSVG } from 'qrcode.react';
import { Download, User, Shield, Star } from 'lucide-react';
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
              jerseyNumber: 'CAP'
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

  const showTeam = player.teamName && player.teamName !== 'Free Agent' && player.teamName !== 'free-agent';
  const totalMatches = player.joinedTournaments
    ? player.joinedTournaments.reduce((acc, t) => acc + (t.matchesPlayed || 0), 0)
    : 0;
  const tournamentNames = player.joinedTournaments && player.joinedTournaments.length > 0
    ? player.joinedTournaments.map(t => typeof t === 'string' ? t : (t.name || 'Trivab Tournament')).join(', ')
    : 'No Tournaments Joined';

  return (
    <div className="digital-id-page page-enter container section-padding">
      <div className="section-header">
        <span className="section-label">Player Verification</span>
        <h1 className="section-title">Digital <span className="text-gradient-gold">ID Card</span></h1>
        <p className="section-subtitle">Official verified player pass for TRIVAB Cricket Tournament matches.</p>
      </div>

      <div className="id-card-layout">
        {/* The Card Render Box — Landscape Format */}
        <div className="card-render-wrapper">
          <div className="id-card-element" id="player-card-render">
            {/* Gold top stripe */}
            <div className="id-card-gold-accent" />

            <div className="id-card-inner">
              {/* LEFT: Photo */}
              <div className="id-card-left">
                <div className="id-player-photo">
                  {player.photoURL ? (
                    <img src={player.photoURL} alt={player.fullName} />
                  ) : (
                    <User size={36} />
                  )}
                </div>
                {/* Jersey number badge */}
                {player.jerseyNumber && (
                  <div style={{
                    background: 'rgba(212,175,55,0.15)',
                    border: '1px solid rgba(212,175,55,0.3)',
                    borderRadius: '6px',
                    padding: '2px 10px',
                    textAlign: 'center',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ fontSize: '0.45rem', color: 'rgba(212,175,55,0.7)', letterSpacing: '0.1em', fontWeight: 700 }}>JERSEY</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#d4af37', lineHeight: 1.1 }}>
                      #{player.jerseyNumber}
                    </div>
                  </div>
                )}
              </div>

              {/* DIVIDER */}
              <div className="id-card-divider" />

              {/* RIGHT: Info */}
              <div className="id-card-right">
                {/* Header */}
                <div className="id-card-header">
                  <div className="id-card-logo">
                    <img src="/logos/trivabsports.webp" className="id-card-brand-logo" alt="TRIVAB SPORTS" />
                  </div>
                  <div className="id-card-badge">VERIFIED PASS</div>
                </div>

                {/* Name & Style */}
                <div>
                  <h3 className="id-player-name">{player.fullName}</h3>
                  <span className="id-player-style">{player.playingStyle}</span>
                </div>

                {/* Stats row */}
                <div className="id-player-stats-row">
                  {showTeam && (
                    <div style={{ maxWidth: '120px' }}>
                      <span className="id-stat-lbl">Team</span>
                      <span className="id-stat-val" style={{ 
                        fontSize: '0.72rem', color: '#fff', display: 'block',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }} title={player.teamName}>
                        {player.teamName}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="id-stat-lbl">Matches</span>
                    <span className="id-stat-val">{totalMatches}</span>
                  </div>
                </div>

                {/* Tournaments */}
                <div className="id-player-tournaments-row">
                  <span className="id-stat-lbl">Tournaments</span>
                  <span className="id-tournaments-val" title={tournamentNames}>{tournamentNames}</span>
                </div>

                {/* Footer: ID & QR */}
                <div className="id-card-footer">
                  <div className="id-code-group">
                    <span className="id-stat-lbl">Player ID</span>
                    <span className="id-code-text">{player.playerId}</span>
                  </div>
                  <div className="id-qr-box">
                    <QRCodeSVG value={player.playerId} size={52} bgColor="#ffffff" fgColor="#000000" level="H" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info panel */}
        <div className="id-actions-panel card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }} className="text-gradient-gold">
              ID Card Options
            </h2>
            <p className="text-secondary" style={{ fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '20px' }}>
              This card is dynamically linked to your database entry. Present the QR code to tournament officials for scanning on match day to confirm your registration status.
            </p>

            {/* Player summary */}
            <div style={{
              background: 'rgba(212,175,55,0.04)',
              border: '1px solid rgba(212,175,55,0.12)',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Full Name</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{player.fullName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Role</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--gold)' }}>{player.playingStyle}</div>
                </div>
                {showTeam && (
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Team</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{player.teamName}</div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Jersey</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>#{player.jerseyNumber || 'N/A'}</div>
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                setGenerating(true);
                try {
                  await downloadIDCardPDF('player-card-render', `TRIVAB-${player.playerId}.pdf`);
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

          {/* Large QR for scan display */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              background: '#fff', 
              padding: '14px', 
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}>
              <QRCodeSVG value={player.playerId} size={160} bgColor="#ffffff" fgColor="#000000" level="H" />
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Scan to verify · <strong>{player.playerId}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
