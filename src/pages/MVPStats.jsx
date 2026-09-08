import { useEffect, useState } from 'react';
import { Trophy, Star, Medal, Award, Flame } from 'lucide-react';
import Loader from '../components/common/Loader';

export default function MVPStats() {
  const [battingLeaderboard, setBattingLeaderboard] = useState([]);
  const [bowlingLeaderboard, setBowlingLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load simulation statistics
    setTimeout(() => {
      setBattingLeaderboard([
        { id: 1, name: 'Virat Kohli', team: 'Royal Challengers', runs: 642, strikeRate: 144.5, matches: 12 },
        { id: 2, name: 'Shubman Gill', team: 'Gujarat Titans', runs: 580, strikeRate: 139.8, matches: 12 },
        { id: 3, name: 'Rohit Sharma', team: 'Mumbai Knights', runs: 512, strikeRate: 136.2, matches: 11 }
      ]);
      setBowlingLeaderboard([
        { id: 1, name: 'Jasprit Bumrah', team: 'Mumbai Knights', wickets: 24, economy: 6.2, matches: 11 },
        { id: 2, name: 'Rashid Khan', team: 'Gujarat Titans', wickets: 21, economy: 6.8, matches: 12 },
        { id: 3, name: 'Yuzvendra Chahal', team: 'Rajasthan Royals', wickets: 19, economy: 7.4, matches: 12 }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="mvp-page page-enter container section-padding">
      <div className="section-header">
        <span className="section-label">Player Statistics</span>
        <h1 className="section-title">MVP & Tournament <span className="text-gradient-gold">Standings</span></h1>
        <p className="section-subtitle">Elite leaderboards tracking batting runs, wickets, strike rate, and best performances.</p>
      </div>

      <div className="grid grid-2 gap-xl">
        {/* Batting Orange Cap Leaderboard */}
        <div className="card card-gold">
          <h2 className="text-lg font-bold mb-md text-gradient-gold flex items-center gap-sm">
            <Flame size={20} className="text-gold" /> Orange Cap Batting Leaderboard
          </h2>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Batsman</th>
                  <th>Team</th>
                  <th>Runs</th>
                  <th>Strike Rate</th>
                </tr>
              </thead>
              <tbody>
                {battingLeaderboard.map((batsman, idx) => (
                  <tr key={batsman.id}>
                    <td className="font-bold">
                      {idx === 0 ? <Trophy size={16} className="text-gold" /> : `#${idx + 1}`}
                    </td>
                    <td className="font-semi text-primary">{batsman.name}</td>
                    <td>{batsman.team}</td>
                    <td className="font-bold text-gold">{batsman.runs} Runs</td>
                    <td>{batsman.strikeRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bowling Purple Cap Leaderboard */}
        <div className="card card-gold">
          <h2 className="text-lg font-bold mb-md text-gradient-gold flex items-center gap-sm">
            <Medal size={20} className="text-gold" /> Purple Cap Bowling Leaderboard
          </h2>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Bowler</th>
                  <th>Team</th>
                  <th>Wickets</th>
                  <th>Economy</th>
                </tr>
              </thead>
              <tbody>
                {bowlingLeaderboard.map((bowler, idx) => (
                  <tr key={bowler.id}>
                    <td className="font-bold">
                      {idx === 0 ? <Trophy size={16} className="text-gold" /> : `#${idx + 1}`}
                    </td>
                    <td className="font-semi text-primary">{bowler.name}</td>
                    <td>{bowler.team}</td>
                    <td className="font-bold text-gold">{bowler.wickets} Wkts</td>
                    <td>{bowler.economy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
