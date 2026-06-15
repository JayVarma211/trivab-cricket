import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDocument, getCollection, where, updateDocument, setDocument, addDocument, getPlayerByUIDOrEmail } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Trophy, Calendar, MapPin, Users, Award, Shield, Upload } from 'lucide-react';
import Loader from '../../components/common/Loader';
import uploadImageToCloudinary from '../../services/cloudinary';
import { sendCaptainRosterNotification } from '../../services/email';
import SEO from '../../components/common/SEO';
import './Tournaments.css';

const PREDEFINED_TOURNAMENTS = [
  {
    id: 'bapl-south',
    name: 'BAPL 3.0 - South Mumbai Edition',
    logo: '/logos/baplt20south.jpg',
    description: `BAPL 3.0 – The Flagship Cricket League
Founded in 2023, BAPL 3.0 was born from a simple yet revolutionary idea by one of the founder Ankit Shah. He questioned the traditional short-format tournaments where momentum is lost just as teams begin to peak—“Why not create a league that runs through an entire cricketing season?”

This vision led to the creation of BAPL 3.0, an extended-format cricket league designed to deliver a true season-long competitive experience, running from October to May and redefining amateur cricket in India.

BAPL 3.0 is not just a tournament—it is a full-season cricketing experience built for serious amateur cricketers.`,
    highlights: [
      '20+ competitive teams',
      '8-month long professional league format',
      'Fully structured, professional tournament execution',
      'Select outstation match experiences',
      '16–18 matches per team per season',
      'Player kits, goodies, and official deliverables',
      'On-ground meals and refreshments for players',
      'Dedicated team managers for each squad',
      'HD live streaming and match broadcasting',
      'Multiple awards and recognitions in every match',
      '12–14 premium quality cricket grounds',
      'Grand opening ceremony and league night event'
    ]
  },
  {
    id: 'bapl-north',
    name: 'BAPL 3.0 - North Mumbai Edition',
    logo: '/logos/baplt20north.jpg',
    description: `BAPL 3.0 – The Flagship Cricket League
Founded in 2023, BAPL 3.0 was born from a simple yet revolutionary idea by one of the founder Ankit Shah. He questioned the traditional short-format tournaments where momentum is lost just as teams begin to peak—“Why not create a league that runs through an entire cricketing season?”

This vision led to the creation of BAPL 3.0, an extended-format cricket league designed to deliver a true season-long competitive experience, running from October to May and redefining amateur cricket in India.

BAPL 3.0 is not just a tournament—it is a full-season cricketing experience built for serious amateur cricketers.`,
    highlights: [
      '20+ competitive teams',
      '8-month long professional league format',
      'Fully structured, professional tournament execution',
      'Select outstation match experiences',
      '16–18 matches per team per season',
      'Player kits, goodies, and official deliverables',
      'On-ground meals and refreshments for players',
      'Dedicated team managers for each squad',
      'HD live streaming and match broadcasting',
      'Multiple awards and recognitions in every match',
      '12–14 premium quality cricket grounds',
      'Grand opening ceremony and league night event'
    ]
  },
  {
    id: 'baplxpress-south',
    name: 'BAPL XPRESS - South Mumbai Edition',
    logo: '/logos/baplxpresst20south.jpg',
    description: `BAPL XPRESS is a compact, high-intensity version of our flagship BAPL league—designed to deliver the same professional cricketing experience in a shorter, more flexible format.

Tailored for teams and players who are unable to commit to a full-season tournament due to work or travel constraints, BAPL XPRESS retains the core structure, quality, and competitive spirit of BAPL in a streamlined schedule.

BAPL XPRESS delivers the complete TRIVAB experience—just faster, sharper, and more accessible`,
    highlights: [
      '8–10 competitive teams',
      'Fast-paced T20 format',
      '9 -11 matches per team',
      '10–12 premium quality cricket grounds',
      'Multiple awards and recognitions in every match',
      'Player kits, goodies, and official deliverables',
      'HD live streaming and match broadcasting',
      'On-ground meals and refreshments for players',
      'Grand opening ceremony and league night event',
      'Professional tournament setup and execution',
      'Ideal for working professionals and compact team groups'
    ]
  },
  {
    id: 'baplxpress-north',
    name: 'BAPL XPRESS - North Mumbai Edition',
    logo: '/logos/baplxpresst20north.jpg',
    description: `BAPL XPRESS is a compact, high-intensity version of our flagship BAPL league—designed to deliver the same professional cricketing experience in a shorter, more flexible format.

Tailored for teams and players who are unable to commit to a full-season tournament due to work or travel constraints, BAPL XPRESS retains the core structure, quality, and competitive spirit of BAPL in a streamlined schedule.

BAPL XPRESS delivers the complete TRIVAB experience—just faster, sharper, and more accessible`,
    highlights: [
      '8–10 competitive teams',
      'Fast-paced T20 format',
      '9 -11 matches per team',
      '10–12 premium quality cricket grounds',
      'Multiple awards and recognitions in every match',
      'Player kits, goodies, and official deliverables',
      'HD live streaming and match broadcasting',
      'On-ground meals and refreshments for players',
      'Grand opening ceremony and league night event',
      'Professional tournament setup and execution',
      'Ideal for working professionals and compact team groups'
    ]
  },
  {
    id: 'baplcorporate-south',
    name: 'BAPL Corporate CUP - South Mumbai Edition',
    logo: '/logos/baplcorporate.jpg',
    description: `The BAPL Corporate Cup is TRIVAB’s premier corporate-only cricket tournament, designed exclusively for teams representing individual companies. This closed-format competition brings organizations together through cricket, teamwork, and high-intensity competitive sport.

Built on the same professional structure as the BAPL ecosystem, the Corporate Cup delivers a premium matchday experience where corporates engage, compete, and strengthen workplace camaraderie beyond office walls.

BAPL Corporate Cup transforms corporate cricket into a professional sporting experience—where business meets competition on the field.`,
    highlights: [
      'Exclusive participation for corporate teams only (company-based entries)',
      'Professional T20 tournament format',
      'Matches conducted across 5–6 premium quality cricket grounds',
      'HD live streaming with YouTube broadcasting of all matches',
      'Dedicated match officials and certified scorers',
      'On-ground meals and refreshments for all players',
      'Dedicated team managers assigned to each corporate team',
      'Fully structured and professionally managed tournament operations'
    ]
  },
  {
    id: 'baplcorporate-north',
    name: 'BAPL Corporate CUP - North Mumbai Edition',
    logo: '/logos/baplcorporate.jpg',
    description: `The BAPL Corporate Cup is TRIVAB’s premier corporate-only cricket tournament, designed exclusively for teams representing individual companies. This closed-format competition brings organizations together through cricket, teamwork, and high-intensity competitive sport.

Built on the same professional structure as the BAPL ecosystem, the Corporate Cup delivers a premium matchday experience where corporates engage, compete, and strengthen workplace camaraderie beyond office walls.

BAPL Corporate Cup transforms corporate cricket into a professional sporting experience—where business meets competition on the field.`,
    highlights: [
      'Exclusive participation for corporate teams only (company-based entries)',
      'Professional T20 tournament format',
      'Matches conducted across 5–6 premium quality cricket grounds',
      'HD live streaming with YouTube broadcasting of all matches',
      'Dedicated match officials and certified scorers',
      'On-ground meals and refreshments for all players',
      'Dedicated team managers assigned to each corporate team',
      'Fully structured and professionally managed tournament operations'
    ]
  },
  {
    id: 'trivab-monsoon',
    name: 'Trivab Monsoon Championship',
    logo: '/logos/trivabmonsoon.jpg',
    description: `The BAPL Monsoon Test Championship is one of TRIVAB’s most unique and prestigious formats, designed to bring back the traditional essence of red-ball cricket in a competitive league structure.

Played in a single-day Test match format, this championship is conducted with red ball and white clothing, offering players a rare opportunity to experience the intensity, patience, and strategy of Test cricket in an amateur competitive setup. The tournament features a league stage followed by high-stakes finals to determine the champion team.

BAPL Monsoon Test Championship revives the purest format of cricket—where technique, temperament, and strategy define the champions.`,
    highlights: [
      'Traditional single-day Test match format',
      'Red ball cricket with white playing attire',
      'Breakfast, Full Lunch & Hi-tea will be served sessions wise',
      'League stage followed by knockout finals',
      'Professional tournament setup and match operations',
      'Certified match officials and scorers',
      'HD live streaming and YouTube broadcasting of matches',
      'Dedicated Premium cricket ground for all fixtures',
      'Structured competitive environment inspired by Test cricket standards'
    ]
  },
  {
    id: 'bapldads-south',
    name: 'BAPL DADS T20 - South Mumbai Edition',
    logo: '/logos/bapldadst20.jpg',
    description: `The BAPL 40+ Dads Tournament is a specially curated cricketing format designed exclusively for players aged 40 and above. Built on the foundation of the BAPL XPRESS structure, this league ensures a fair, competitive, and enjoyable experience tailored for seasoned cricketers.

The tournament is created with a simple vision—to bring fathers and experienced cricket lovers back onto the field, allowing them to relive the joy, passion, and memories of the game they once played every day in their younger years through the TRIVAB platform.

BAPL 40+ Dads Tournament is where experience meets passion—bringing cricket back to those who never stopped loving the game.`,
    highlights: [
      'Exclusive age category: 40 years and above only',
      'Designed for fair and balanced competitive play',
      'Based on the fast-paced BAPL XPRESS format',
      'Matches played on lush, premium solo cricket grounds only',
      'Professional tournament structure and match management',
      'HD live streaming and YouTube broadcasting of matches',
      'Certified match officials and scorers',
      'Dedicated team managers for all participating teams',
      'On-ground meals and refreshments for players'
    ]
  },
  {
    id: 'bapldads-north',
    name: 'BAPL DADS T20 - North Mumbai Edition',
    logo: '/logos/bapldadst20.jpg',
    description: `The BAPL 40+ Dads Tournament is a specially curated cricketing format designed exclusively for players aged 40 and above. Built on the foundation of the BAPL XPRESS structure, this league ensures a fair, competitive, and enjoyable experience tailored for seasoned cricketers.

The tournament is created with a simple vision—to bring fathers and experienced cricket lovers back onto the field, allowing them to relive the joy, passion, and memories of the game they once played every day in their younger years through the TRIVAB platform.

BAPL 40+ Dads Tournament is where experience meets passion—bringing cricket back to those who never stopped loving the game.`,
    highlights: [
      'Exclusive age category: 40 years and above only',
      'Designed for fair and balanced competitive play',
      'Based on the fast-paced BAPL XPRESS format',
      'Matches played on lush, premium solo cricket grounds only',
      'Professional tournament structure and match management',
      'HD live streaming and YouTube broadcasting of matches',
      'Certified match officials and scorers',
      'Dedicated team managers for all participating teams',
      'On-ground meals and refreshments for players'
    ]
  },
  {
    id: 'baplkids',
    name: 'BAPL KIDS',
    logo: '/logos/bapllogo.jpg',
    description: `The BAPL Kids Tournament is TRIVAB’s dedicated junior cricket platform, designed to provide young cricketers across age groups U-10, U-12, U-14, U-16, and U-19 with a structured, high-quality, and competitive playing experience.

BAPL Kids has quickly become a favourite among young players, who actively follow and aspire to participate in BAPL senior leagues. In the Mumbai circuit, most junior tournaments offer limited match exposure; BAPL Kids addresses this gap by ensuring a longer, more meaningful competitive structure that supports true player development.

Each participating team is guaranteed 8–10 competitive matches, creating a tournament environment that focuses on growth, experience, and performance.

BAPL Kids is more than a tournament—it is a development pathway that nurtures the next generation of cricketers and prepares them for the senior competitive stage`,
    highlights: [
      'Age groups: U-10, U-12, U-14, U-16 & U-19',
      'Red-ball cricket along with 20 & 40-over formats',
      '8–10 matches per team for extended competitive exposure',
      'Matches played across premium grounds, maidans, and gymkhanas',
      'Professional tournament structure and certified match officials',
      'Scholarships and individual match rewards for standout performers',
      'Pathway access and recognition linked to BAPL senior tournaments',
      'HD live coverage and professional match documentation'
    ]
  }
];

const getLogoClass = (logoUrl) => {
  if (!logoUrl) return '';
  const url = logoUrl.toLowerCase();
  if (url.includes('cloudinary') || url.includes('http')) return '';
  if (url.includes('xpress')) return 'logo-black-bg';
  if (url.includes('dads')) return 'logo-white-bg';
  if (url.includes('baplt20') || url.includes('baplpune')) return 'logo-silver-bg';
  if (url.includes('corporate') || url.includes('monsoon')) return 'logo-white-bg';
  return '';
};

const needsDarkContainer = (logoUrl) => {
  if (!logoUrl) return false;
  return logoUrl.toLowerCase().includes('xpress');
};

export default function TournamentDetails() {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Team Details Modal States
  const [selectedTeamForModal, setSelectedTeamForModal] = useState(null);
  const [teamModalPlayers, setTeamModalPlayers] = useState([]);
  const [teamModalTournaments, setTeamModalTournaments] = useState([]);
  const [loadingTeamModal, setLoadingTeamModal] = useState(false);

  const { user, role } = useAuth();
  const [playerProfile, setPlayerProfile] = useState(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  
  // Join Modal States
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinRole, setJoinRole] = useState(''); // 'captain' | 'player'
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLogo, setNewTeamLogo] = useState(null);
  const [newTeamLogoPreview, setNewTeamLogoPreview] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [modalError, setModalError] = useState('');

  const handleTeamClick = async (team) => {
    setSelectedTeamForModal(team);
    setLoadingTeamModal(true);
    setTeamModalPlayers([]);
    setTeamModalTournaments([]);
    try {
      // 1. Fetch team players roster from players collection
      const globalPlayers = await getCollection('players', [where('teamId', '==', team.id)]);
      
      // 2. Fetch registrations for this team
      const regs = await getCollection('registrations', [where('teamId', '==', team.id)]);
      
      // Find player IDs from registrations that are not in globalPlayers
      const globalPlayerIds = new Set(globalPlayers.map(p => p.id));
      const missingPlayerIds = regs
        .map(r => r.playerId)
        .filter(pid => pid && !globalPlayerIds.has(pid));
        
      // Fetch missing players in parallel
      const missingPlayers = await Promise.all(
        missingPlayerIds.map(async (pid) => {
          try {
            return await getDocument('players', pid);
          } catch (e) {
            console.error("Error fetching player:", pid, e);
            return null;
          }
        })
      );
      
      const allPlayers = [...globalPlayers, ...missingPlayers.filter(Boolean)];
      
      // 3. Add the captain to the squad members list if they are not already in it
      if (team.captainId) {
        let teamCaptain = null;
        try {
          teamCaptain = await getDocument('captains', team.captainId);
        } catch (captErr) {
          console.warn("Failed to fetch captain:", captErr);
        }
        
        if (teamCaptain) {
          const hasCaptain = allPlayers.some(p => p.uid === team.captainId || p.email === teamCaptain.email);
          if (!hasCaptain) {
            let capPl = null;
            try {
              const plByEmail = await getCollection('players', [where('email', '==', teamCaptain.email)]);
              if (plByEmail && plByEmail.length > 0) {
                capPl = plByEmail[0];
              }
            } catch (e) {}
            
            if (capPl) {
              allPlayers.unshift(capPl);
            } else {
              allPlayers.unshift({
                id: 'captain-virtual-' + team.captainId,
                fullName: teamCaptain.fullName || team.captainName || 'Team Captain',
                email: teamCaptain.email || '',
                mobile: teamCaptain.mobile || '',
                photoURL: teamCaptain.photoURL || '',
                playingStyle: 'All-Rounder',
                jerseyNumber: 'N/A',
                role: 'captain',
                isCaptain: true
              });
            }
          }
        }
      }
      
      setTeamModalPlayers(allPlayers);
      
      // 4. Fetch other tournaments they play in (based on same team name or captain)
      const queryField = team.captainId ? 'captainId' : 'teamName';
      const queryVal = team.captainId || team.teamName;
      const otherTeamDocs = await getCollection('teams', [where(queryField, '==', queryVal)]);
      const tourns = otherTeamDocs.map(doc => doc.tournamentName || 'Trivab Tournament');
      setTeamModalTournaments([...new Set(tourns)]);
    } catch (err) {
      console.error("Error loading team roster:", err);
    } finally {
      setLoadingTeamModal(false);
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        let tourn = await getDocument('tournaments', id);
        const fallback = PREDEFINED_TOURNAMENTS.find(p => p.id === id);
        let isActivated = true;
        
        if (!tourn) {
          isActivated = false;
          if (fallback) {
            tourn = {
              id: fallback.id,
              name: fallback.name,
              logo: fallback.logo,
              description: fallback.description,
              highlights: fallback.highlights,
              status: 'Inactive',
              winner: 'TBD',
              runnerUp: 'TBD'
            };
          }
        } else if (fallback) {
          tourn = {
            ...tourn,
            description: fallback.description,
            highlights: fallback.highlights
          };
        }
        
        if (tourn) {
          tourn.isActivated = isActivated;
        }
        
        setTournament(tourn);

        const mList = await getCollection('matches', [where('tournamentId', '==', id)]);
        setMatches(mList);

        const tList = await getCollection('teams', [where('tournamentId', '==', id)]);
        setTeams(tList);
      } catch (err) {
        console.error('Error fetching tournament details:', err);
        const fallback = PREDEFINED_TOURNAMENTS.find(p => p.id === id);
        setTournament(fallback ? {
          id: fallback.id,
          name: fallback.name,
          logo: fallback.logo,
          description: fallback.description,
          highlights: fallback.highlights,
          status: 'Inactive',
          winner: 'TBD',
          runnerUp: 'TBD',
          isActivated: false
        } : null);
        setMatches([]);
        setTeams([]);
      } finally {
        if (user) {
          try {
            const profile = await getPlayerByUIDOrEmail(user.uid, user.email);
            setPlayerProfile(profile);
            if (profile && profile.joinedTournaments) {
              const joined = profile.joinedTournaments.some(t => {
                const idToCompare = typeof t === 'string' ? t : t.id;
                return idToCompare === id;
              });
              setHasJoined(joined);
            }
          } catch (e) {
            console.error("Error fetching player profile:", e);
          }
        }
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, user]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewTeamLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewTeamLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleJoinTournament = async (e) => {
    if (e) e.preventDefault();
    if (tournament && tournament.isActivated === false) {
      alert('This tournament is currently deactivated/inactive and cannot be joined.');
      return;
    }
    if (!user) {
      alert('Please log in to join this tournament!');
      return;
    }
    if (!playerProfile) {
      alert('Player profile not found. Please complete your registration.');
      return;
    }
    if (!joinRole) {
      setModalError('Please select your role.');
      return;
    }

    setJoining(true);
    setModalError('');
    setJoinMessage('');

    try {
      let teamId = '';
      let teamName = '';

      if (joinRole === 'captain') {
        if (!newTeamName.trim()) {
          throw new Error('Please enter a team name.');
        }

        // Upload logo to Cloudinary if selected
        let logoURL = '';
        if (newTeamLogo) {
          try {
            logoURL = await uploadImageToCloudinary(newTeamLogo);
          } catch (err) {
            console.error(err);
            throw new Error('Failed to upload team logo.');
          }
        }

        // 1. Create a new team document
        const teamDoc = await addDocument('teams', {
          teamName: newTeamName.trim(),
          city: '',
          logoURL,
          captainId: user.uid,
          captainName: playerProfile.fullName,
          playerCount: 1, // Captain is counted as 1st player
          maxPlayers: 40,
          wins: 0,
          losses: 0,
          tournamentId: tournament.id || id,
          tournamentName: tournament.name || 'Tournament Edition',
          createdAt: new Date().toISOString()
        });

        teamId = teamDoc.id;
        teamName = newTeamName.trim();

        // 2. Write/Update the Captain profile
        const captId = `CAPT-${playerProfile.id.split('-').pop()}`;
        await setDocument('captains', user.uid, {
          captainId: captId,
          uid: user.uid,
          fullName: playerProfile.fullName,
          teamId: teamId,
          teamName: teamName,
          mobile: playerProfile.mobile || '',
          email: playerProfile.email,
          photoURL: playerProfile.photoURL || '',
          createdAt: new Date().toISOString()
        });

        // 3. Update User's global role to captain in Auth context / database
        await updateDocument('users', user.uid, {
          role: 'captain'
        });

        // 4. Send Admin Notification
        await addDocument('admin_notifications', {
          type: 'captain_joined',
          title: 'New Team Enrolled',
          message: `${playerProfile.fullName} registered team "${teamName}" as Captain for tournament "${tournament.name}"`,
          createdAt: new Date().toISOString(),
          read: false
        });

      } else {
        // Player Role
        if (!selectedTeamId) {
          throw new Error('Please select a team.');
        }

        const teamObj = teams.find(t => t.id === selectedTeamId);
        if (!teamObj) {
          throw new Error('Selected team not found.');
        }

        // Check roster limit
        if ((teamObj.playerCount || 0) >= 40) {
          throw new Error(`The team ${teamObj.teamName} has reached its limit of 40 players.`);
        }

        teamId = selectedTeamId;
        teamName = teamObj.teamName;

        // 1. Update team headcount
        const newCount = (teamObj.playerCount || 0) + 1;
        await updateDocument('teams', selectedTeamId, {
          playerCount: newCount
        });

        // Send email to captain for every 10 players registration
        if (newCount % 10 === 0) {
          try {
            const captainDoc = await getDocument('captains', teamObj.captainId);
            if (captainDoc && captainDoc.email) {
              await sendCaptainRosterNotification(
                captainDoc.email,
                captainDoc.fullName || 'Captain',
                teamName,
                newCount
              );
            }
          } catch (mailErr) {
            console.error("Failed to send captain notification email:", mailErr);
          }
        }

        // 2. Send Admin Notification
        await addDocument('admin_notifications', {
          type: 'player_joined',
          title: 'New Roster Enrollment',
          message: `${playerProfile.fullName} joined team "${teamName}" as Player for tournament "${tournament.name}"`,
          createdAt: new Date().toISOString(),
          read: false
        });
      }

      // Create a registration record for ease of relational queries
      const regId = `${playerProfile.id}_${tournament.id || id}`;
      await setDocument('registrations', regId, {
        id: regId,
        playerId: playerProfile.id,
        playerName: playerProfile.fullName,
        playerEmail: playerProfile.email,
        photoURL: playerProfile.photoURL || '',
        playingStyle: playerProfile.playingStyle || 'Batsman',
        jerseyNumber: playerProfile.jerseyNumber || '',
        mobile: playerProfile.mobile || '',
        tournamentId: tournament.id || id,
        tournamentName: tournament.name || 'Tournament Edition',
        teamId,
        teamName,
        role: joinRole,
        matchesPlayed: 0,
        joinedAt: new Date().toISOString()
      });

      // Update Player Profile joinedTournaments list locally and in DB
      const newRegistration = {
        id: tournament.id || id,
        name: tournament.name || 'Tournament Edition',
        teamId,
        teamName,
        role: joinRole,
        matchesPlayed: 0,
        joinedAt: new Date().toISOString()
      };
      
      const currentJoined = playerProfile.joinedTournaments || [];
      const updatedJoined = [...currentJoined, newRegistration];

      await updateDocument('players', playerProfile.id, {
        joinedTournaments: updatedJoined
      });

      setPlayerProfile(prev => ({
        ...prev,
        joinedTournaments: updatedJoined
      }));
      setHasJoined(true);
      setJoinMessage('Successfully joined tournament!');
      setShowJoinModal(false);

      // Reload participating teams
      const tList = await getCollection('teams', [where('tournamentId', '==', id)]);
      setTeams(tList);

    } catch (err) {
      console.error(err);
      setModalError(err.message || 'Failed to join tournament. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <Loader />;

  if (!tournament) {
    return (
      <div className="container section-padding text-center">
        <h2>Tournament Not Found</h2>
        <Link to="/tournaments" className="btn btn-gold mt-md">Back to Tournaments</Link>
      </div>
    );
  }

  const detailsSchema = tournament ? {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": `${tournament.name} | TRIVAB Sports`,
    "description": tournament.description?.substring(0, 150) || "Cricket tournament organized by TRIVAB Sports",
    "sport": "Cricket",
    "eventStatus": tournament.status === "Live" 
      ? "https://schema.org/EventScheduled" 
      : tournament.status === "Completed" 
        ? "https://schema.org/EventPostponed" 
        : "https://schema.org/EventScheduled",
    "organizer": {
      "@type": "SportsOrganization",
      "name": "TRIVAB Sports",
      "url": "https://trivabsports.com"
    }
  } : null;

  return (
    <div className="tournament-details-page page-enter container section-padding">
      <SEO 
        title={tournament.name}
        description={tournament.description?.substring(0, 155) || `Join the ${tournament.name} league hosted by TRIVAB Sports. Roster slots, schedules, standings, and team registration details.`}
        keywords={`${tournament.name}, TRIVAB Sports tournament, cricket matches, tournament details, player registration, team caps`}
        schema={detailsSchema}
      />
      <div className="flex justify-between items-start mb-xl gap-lg flex-wrap tournament-header-row">
        <div className="tournament-header-left" style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {tournament.logo && (
            <img 
              src={tournament.logo} 
              alt={tournament.name} 
              className={`tournament-details-logo-img ${getLogoClass(tournament.logo)}`}
              style={{ width: 110, height: 110, objectFit: 'contain', display: 'block', flexShrink: 0 }} 
            />
          )}
          <div style={{ minWidth: 0 }}>
            <span className="badge badge-red mb-xs">{tournament.status}</span>
            <h1 className="display-md text-gradient-gold tournament-page-title" style={{ wordBreak: 'break-word' }}>{tournament.name}</h1>
            <p className="text-secondary max-width-600 mt-xs" style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>{tournament.description}</p>
            
            {tournament && tournament.isActivated === false ? (
              <div className="mt-md">
                <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  Tournament Inactive
                </span>
              </div>
            ) : user ? (
              role === 'admin' ? (
                <div className="mt-md" style={{ display: 'inline-block' }}><span className="badge badge-gold">Admin View</span></div>
              ) : (
                <div className="mt-md" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                  {hasJoined ? (
                    <button className="btn btn-gold btn-sm join-btn-mobile" disabled style={{ opacity: 0.8, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ✓ Joined Tournament
                    </button>
                  ) : (
                    <button className="btn btn-gold btn-sm join-btn-mobile" onClick={() => { setModalError(''); setJoinRole(''); setNewTeamName(''); setSelectedTeamId(''); setShowJoinModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Join this Tournament
                    </button>
                  )}
                  {joinMessage && <span className="text-xs text-green font-bold" style={{ color: '#22c55e' }}>{joinMessage}</span>}
                </div>
              )
            ) : (
              <div className="mt-md">
                <Link to="/login" className="btn btn-gold btn-sm join-btn-mobile">
                  Login to Join Tournament
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className="card winner-details-box flex gap-md items-center" style={{ flexShrink: 0 }}>
          <Trophy size={36} className="text-gold" />
          <div>
            <span className="text-xs text-muted block uppercase font-bold">Champions Trophy</span>
            <span className="text-sm font-bold text-primary">Winner: {tournament.winner || 'TBD'}</span>
          </div>
        </div>
      </div>

      {/* Highlights checklist grid */}
      {tournament.highlights && (
        <div className="card card-gold mb-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-card)' }}>
          <h3 className="text-md font-bold mb-md text-gradient-gold flex items-center gap-xs">
            <Trophy size={18} /> Tournament Key Highlights
          </h3>
          <div className="grid grid-2 gap-sm">
            {tournament.highlights.map((h, idx) => (
              <div key={idx} className="flex gap-xs items-center text-sm text-secondary">
                <span className="text-gold">✓</span>
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="tournament-details-grid">
        {/* Left col: Match Fixtures */}
        <div className="card matches-fixture-card">
          <h3 className="text-lg font-bold mb-md text-gradient-gold flex items-center gap-sm">
            <Calendar size={20} /> Match Schedule & Fixtures
          </h3>
          <div className="matches-timeline">
            {matches.length === 0 ? (
              <p className="text-sm text-muted">No scheduled matches logged for this tournament.</p>
            ) : (
              matches.map((m) => {
                const teamAObj = teams.find(t => t.teamName === m.teamA);
                const teamBObj = teams.find(t => t.teamName === m.teamB);
                const teamALogo = teamAObj?.logoURL;
                const teamBLogo = teamBObj?.logoURL;

                return (
                  <div className="match-card border-top-gold mb-md" key={m.id}>
                    <div className="match-card-header flex justify-between text-xs text-muted mb-xs">
                      <span className="flex items-center gap-xs"><Calendar size={12} /> {m.date} at {m.time}</span>
                      <span className="badge badge-blue">{m.status}</span>
                    </div>
                    <div className="match-teams-row flex justify-between items-center py-sm flex-wrap gap-xs">
                      <div className="flex items-center gap-xs">
                        <div className="avatar avatar-sm bg-secondary text-gold font-bold" style={{ width: '24px', height: '24px', overflow: 'hidden', borderRadius: '50%', border: '1px solid var(--border)' }}>
                          {teamALogo ? <img src={teamALogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : m.teamA[0]}
                        </div>
                        <span className="team-text font-bold" style={{ fontSize: '0.85rem' }}>{m.teamA}</span>
                        {(m.status === 'Completed' || m.status === 'Live') && (
                          <span className="text-xs font-bold text-gradient-gold ml-xxs">({m.teamAScore || '—'})</span>
                        )}
                      </div>
                      
                      <span className="vs-text text-muted text-xs font-bold">VS</span>

                      <div className="flex items-center gap-xs">
                        {(m.status === 'Completed' || m.status === 'Live') && (
                          <span className="text-xs font-bold text-gradient-gold mr-xxs">({m.teamBScore || '—'})</span>
                        )}
                        <span className="team-text font-bold" style={{ fontSize: '0.85rem' }}>{m.teamB}</span>
                        <div className="avatar avatar-sm bg-secondary text-gold font-bold" style={{ width: '24px', height: '24px', overflow: 'hidden', borderRadius: '50%', border: '1px solid var(--border)' }}>
                          {teamBLogo ? <img src={teamBLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : m.teamB[0]}
                        </div>
                      </div>
                    </div>

                    {m.result && (
                      <div className="match-result text-center mb-xs py-xxs px-sm rounded text-xs font-semi text-gold" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.1)', marginBottom: '8px' }}>
                        🏆 {m.result}
                      </div>
                    )}

                    <div className="match-card-footer flex justify-between items-center text-xs text-muted border-top pt-xs mt-xs">
                      <span className="flex items-center gap-xs"><MapPin size={12} /> {m.venue}</span>
                      <span className="text-gold font-semi">{m.format || 'T20'} League Match</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right col: Participating Teams */}
        <div className="card participating-teams-card">
          <h3 className="text-lg font-bold mb-md text-gradient-gold flex items-center gap-sm">
            <Users size={20} /> Participating Teams ({teams.length})
          </h3>
          <ul className="flex flex-col gap-sm team-details-list">
            {teams.map((t) => (
              <li className="team-item-row flex justify-between items-center" key={t.id} onClick={() => handleTeamClick(t)} style={{ cursor: 'pointer', transition: 'background-color 0.2s', padding: '10px 14px', borderRadius: '8px' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <div className="flex items-center gap-sm">
                  <div className="avatar avatar-sm bg-secondary text-gold font-bold" style={{ width: '32px', height: '32px', fontSize: '0.9rem', borderRadius: '6px', overflow: 'hidden' }}>
                    {t.logoURL ? (
                      <img src={t.logoURL} alt={t.teamName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      t.teamName[0]
                    )}
                  </div>
                  <span className="font-semi text-sm text-primary">{t.teamName}</span>
                </div>
                <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>View Squad</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowJoinModal(false)}>✕</button>
            <h3 className="text-lg font-bold text-gradient-gold mb-md">Join {tournament.name}</h3>
            
            {modalError && (
              <div className="alert alert-error mb-md" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '6px' }}>
                <span className="text-xs">{modalError}</span>
              </div>
            )}

            <form onSubmit={handleJoinTournament} className="flex flex-col gap-md">
              <div className="form-group">
                <label className="form-label">Select Your Role</label>
                <select
                  className="form-select"
                  value={joinRole}
                  onChange={(e) => setJoinRole(e.target.value)}
                  required
                  disabled={joining}
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                >
                  <option value="">-- Choose Role --</option>
                  <option value="captain">Captain (Enroll a new Team)</option>
                  <option value="player">Player (Join an existing Team)</option>
                </select>
              </div>

              {joinRole === 'captain' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Team Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter new team name"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      required
                      disabled={joining}
                      style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Team Logo (Optional)</label>
                    <div className="file-upload-container">
                      {newTeamLogoPreview ? (
                        <div className="photo-preview-wrap">
                          <img src={newTeamLogoPreview} alt="Logo Preview" className="photo-preview" style={{ maxHeight: '80px', objectFit: 'contain' }} />
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setNewTeamLogo(null);
                              setNewTeamLogoPreview(null);
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="file-upload-label" style={{ padding: '15px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: '1.5px dashed var(--border-card)', borderRadius: '6px' }}>
                          <Upload size={20} />
                          <span className="text-xs font-medium">Upload Team Logo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            disabled={joining}
                            style={{ display: 'none' }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </>
              )}

              {joinRole === 'player' && (
                <div className="form-group">
                  <label className="form-label">Select Team</label>
                  <select
                    className="form-select"
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    required
                    disabled={joining}
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  >
                    <option value="">-- Choose Team --</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.teamName} ({t.playerCount || 0}/40 players)</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-gold btn-md mt-sm w-full"
                disabled={joining || !joinRole}
              >
                {joining ? 'Enrolling...' : 'Complete Enrollment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Team Details Modal */}
      {selectedTeamForModal && (
        <div className="modal-overlay" onClick={() => setSelectedTeamForModal(null)} style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: 'var(--space-xl)', maxWidth: '580px', width: '100%', maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}>
            <button className="modal-close" onClick={() => setSelectedTeamForModal(null)} style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '1.25rem', border: 'none', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>✕</button>
            
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', borderBottom: '1px solid var(--border-card)', paddingBottom: '16px' }}>
              <div className="avatar avatar-lg bg-secondary text-gold font-bold" style={{ width: '60px', height: '60px', fontSize: '1.5rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                {selectedTeamForModal.logoURL ? (
                  <img src={selectedTeamForModal.logoURL} alt={selectedTeamForModal.teamName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  selectedTeamForModal.teamName[0]
                )}
              </div>
              <div style={{ textAlign: 'left' }}>
                <h3 className="text-lg font-bold text-gradient-gold" style={{ margin: 0 }}>{selectedTeamForModal.teamName}</h3>
                <p className="text-secondary text-xs" style={{ margin: '4px 0 0 0', opacity: 0.8 }}>
                  Captain: <strong>{selectedTeamForModal.captainName || 'N/A'}</strong>
                </p>
              </div>
            </div>

            {loadingTeamModal ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ margin: '0 auto var(--space-sm)' }} />
                <p style={{ fontSize: '0.85rem' }}>Loading squad details...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: 'var(--bg-secondary)', padding: '12px 6px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span className="text-xs text-muted" style={{ display: 'block', fontSize: '0.65rem', letterSpacing: '0.5px' }}>SQUAD SIZE</span>
                    <span className="text-sm font-bold text-primary" style={{ display: 'block', marginTop: '4px' }}>{teamModalPlayers.length} / 40</span>
                  </div>
                  <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-card)', borderRight: '1px solid var(--border-card)' }}>
                    <span className="text-xs text-muted" style={{ display: 'block', fontSize: '0.65rem', letterSpacing: '0.5px' }}>MATCHES HERE</span>
                    <span className="text-sm font-bold text-primary" style={{ display: 'block', marginTop: '4px' }}>
                      {matches.filter(m => m.teamA === selectedTeamForModal.teamName || m.teamB === selectedTeamForModal.teamName).length}
                    </span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span className="text-xs text-muted" style={{ display: 'block', fontSize: '0.65rem', letterSpacing: '0.5px' }}>TOTAL TOURNAMENTS</span>
                    <span className="text-sm font-bold text-primary" style={{ display: 'block', marginTop: '4px' }}>{teamModalTournaments.length}</span>
                  </div>
                </div>

                {/* Tournaments list */}
                {teamModalTournaments.length > 0 && (
                  <div style={{ textAlign: 'left' }}>
                    <h4 className="text-xs font-bold text-muted uppercase tracking-wider" style={{ fontSize: '0.7rem' }}>Participating In:</h4>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {teamModalTournaments.map((tName, idx) => (
                        <span key={idx} className="badge badge-gold" style={{ fontSize: '0.68rem', textTransform: 'none', padding: '3px 10px' }}>{tName}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Squad roster list */}
                <div style={{ textAlign: 'left' }}>
                  <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-sm" style={{ fontSize: '0.7rem', marginBottom: '8px' }}>Squad Roster</h4>
                  {teamModalPlayers.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>No players registered in this squad roster yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                      {teamModalPlayers.map(p => {
                        const tournObj = p.joinedTournaments?.find(jt => (typeof jt === 'string' ? jt : jt.id) === id);
                        const tournMatches = tournObj?.matchesPlayed !== undefined ? tournObj.matchesPlayed : 0;
                        return (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-card)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div className="avatar avatar-sm bg-primary text-gold" style={{ width: '28px', height: '28px', fontSize: '0.75rem', borderRadius: '50%', overflow: 'hidden' }}>
                                {p.photoURL ? (
                                  <img src={p.photoURL} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  p.fullName[0]
                                )}
                              </div>
                              <div style={{ textAlign: 'left' }}>
                                <span className="text-sm font-semi text-primary" style={{ display: 'block', lineHeight: 1.2 }}>{p.fullName}</span>
                                <span className="text-muted" style={{ fontSize: '0.68rem', opacity: 0.8 }}>{p.playingStyle || 'Player'}</span>
                                <span className="text-gold" style={{ fontSize: '0.68rem', display: 'block', marginTop: '2px' }}>
                                  Matches: {tournMatches} (Total: {p.matchesPlayed || 0})
                                </span>
                              </div>
                            </div>
                            <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>#{p.jerseyNumber || '—'}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
