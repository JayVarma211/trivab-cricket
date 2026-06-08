import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPlayerByUIDOrEmail, getCollection, where } from '../../firebase/firestore';
import { ShieldCheck, User, Award, Settings, Bell, Calendar, Trophy } from 'lucide-react';
import Loader from '../../components/common/Loader';
import './Player.css';

export default function PlayerDashboard() {
  const { user } = useAuth();
  const [player, setPlayer] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      try {
        const playerProfile = await getPlayerByUIDOrEmail(user.uid, user.email);
        setPlayer(playerProfile);

        if (playerProfile) {
          // Fetch notifications
          const notifs = await getCollection('notifications', [
            where('userId', '==', user.uid),
            where('read', '==', false)
          ]);
          setNotifications(notifs);

          // Fetch matches for their team
          if (playerProfile.teamId) {
            const teamMatches = await getCollection('matches', [
              where('teamA', '==', playerProfile.teamName)
            ]);
            setMatches(teamMatches);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  if (loading) return <Loader />;

  if (!player) {
    return (
      <div className="container section-padding text-center">
        <h2 className="display-sm text-red">Profile Action Required</h2>
        <p className="text-secondary mb-md">Your user account is not linked to a player profile yet.</p>
        <Link to="/register" className="btn btn-gold">Complete Registration</Link>
      </div>
    );
  }

  return (
    <div className="player-dashboard page-enter container section-padding">
      <div className="dashboard-header flex justify-between items-center mb-xl">
        <div>
          <span className="text-gold text-sm font-bold uppercase tracking-wider">Dashboard</span>
          <h1 className="display-md">Welcome, {player.fullName}</h1>
        </div>
        <div className="flex gap-md">
          <Link to="/player/profile" className="btn btn-outline btn-sm">
            <Settings size={16} /> Edit Profile
          </Link>
          <Link to="/player/id-card" className="btn btn-gold btn-sm">
            <Award size={16} /> View ID Card
          </Link>
        </div>
      </div>

      <div className="grid grid-3 gap-xl">
        {/* Col 1: Profile Summary Card */}
        <div className="card player-summary-panel">
          <div className="profile-badge-pic mb-md">
            {player.photoURL ? (
              <img src={player.photoURL} alt={player.fullName} className="avatar-xl" />
            ) : (
              <div className="avatar-xl text-center flex items-center justify-center bg-secondary font-bold text-gold">
                {player.fullName[0]}
              </div>
            )}
          </div>
          <h2 className="text-lg font-bold text-center">{player.fullName}</h2>
          <span className="badge badge-gold text-center block mb-md" style={{ display: 'inline-block', margin: '0 auto' }}>
            {player.playingStyle}
          </span>
          <div className="divider mb-md" />
          <ul className="flex flex-col gap-sm">
            <li className="flex justify-between text-sm">
              <span className="text-muted">Player ID</span>
              <span className="font-semi">{player.playerId}</span>
            </li>
            <li className="flex justify-between text-sm">
              <span className="text-muted">Team</span>
              <span className="font-semi text-gold">{player.teamName}</span>
            </li>
            <li className="flex justify-between text-sm">
              <span className="text-muted">Jersey No.</span>
              <span className="font-semi">#{player.jerseyNumber}</span>
            </li>
            <li className="flex justify-between text-sm">
              <span className="text-muted">Mobile</span>
              <span className="font-semi">{player.mobile}</span>
            </li>
          </ul>
        </div>

        {/* Col 2: Match Schedule Widget */}
        <div className="card">
          <h2 className="text-lg font-bold mb-md text-gradient-gold flex items-center gap-sm">
            <Calendar size={20} /> My Matches
          </h2>
          {matches.length === 0 ? (
            <p className="text-sm text-muted">No matches scheduled for team {player.teamName} yet.</p>
          ) : (
            <div className="flex flex-col gap-md">
              {matches.map((m) => (
                <div className="match-mini-card" key={m.id}>
                  <div className="flex justify-between text-xs text-muted">
                    <span>{m.date} - {m.time}</span>
                    <span className="badge badge-blue">{m.status}</span>
                  </div>
                  <h4 className="text-sm font-bold mt-xs">{m.teamA} vs {m.teamB}</h4>
                  <p className="text-xs text-muted mt-xs">Venue: {m.venue}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Col 3: Notifications Feed */}
        <div className="card">
          <h2 className="text-lg font-bold mb-md text-gradient-gold flex items-center gap-sm">
            <Bell size={20} /> Notifications
          </h2>
          {notifications.length === 0 ? (
            <div className="empty-notif text-center">
              <ShieldCheck className="text-gold mb-sm" size={32} style={{ margin: '0 auto' }} />
              <p className="text-sm text-secondary">All caught up! Roster verification email sent upon sign up.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-md">
              {notifications.map((n) => (
                <div className="alert alert-info py-sm" key={n.id}>
                  <span className="text-xs">{n.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
