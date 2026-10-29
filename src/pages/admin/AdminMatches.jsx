import { useState, useEffect, useMemo } from 'react';
import { checkMatchDateConflict } from '../../utils/matchConflict';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { useAuth } from '../../context/AuthContext';
import { getCollection, addDocument, setDocument, deleteDocument } from '../../firebase/firestore';
import { Calendar, Trash2, Plus, AlertCircle, Edit2, Search, Activity, Download, X, Play, Clock, MapPin, Tag } from 'lucide-react';
import './Admin.css';

const SCHEDULE_TYPES = ['Match', 'Practice', 'Meeting', 'Event', 'Training', 'Selection Trial'];
const STATUS_OPTIONS = ['Upcoming', 'In Progress', 'Completed', 'Cancelled'];
const FORMAT_OPTIONS = ['T20', 'T10', '50-over', '100-ball', 'Practice', 'Other'];

export const getStringVal = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    return val.id || val.name || val.teamName || val.title || '';
  }
  return String(val);
};

export const formatTimeAMPM = (timeStr) => {
  if (!timeStr) return '';
  const trimmed = getStringVal(timeStr).trim();
  if (!trimmed) return '';
  if (/am|pm/i.test(trimmed)) return trimmed;

  const parts = trimmed.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].slice(0, 2);
    if (!isNaN(hours)) {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      if (hours === 0) hours = 12;
      const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
      return `${formattedHours}:${minutes} ${ampm}`;
    }
  }
  return trimmed;
};

export const timeTo24h = (timeStr) => {
  if (!timeStr) return '';
  const trimmed = getStringVal(timeStr).trim();
  if (!trimmed) return '';

  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = ampmMatch[2];
    const ampm = ampmMatch[3].toUpperCase();

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
    return `${formattedHours}:${minutes}`;
  }

  const h24Match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (h24Match) {
    let hours = parseInt(h24Match[1], 10);
    const minutes = h24Match[2];
    const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
    return `${formattedHours}:${minutes}`;
  }

  return '';
};

export const formatDateSafe = (dateStr) => {
  if (!dateStr) return 'TBD';
  const str = typeof dateStr === 'string' ? dateStr.trim() : (dateStr?.seconds ? new Date(dateStr.seconds * 1000).toISOString() : String(dateStr).trim());
  if (!str || str.toUpperCase() === 'TBD') return 'TBD';
  try {
    let d = new Date(str);
    if (isNaN(d.getTime())) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        d = new Date(str + 'T00:00:00');
      }
    }
    if (isNaN(d.getTime())) {
      return str;
    }
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return String(str);
  }
};

export const formatDateForInput = (dateStr) => {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  if (str.toUpperCase() === 'TBD') return 'TBD';

  if (typeof dateStr === 'object' && dateStr?.seconds) {
    const d = new Date(dateStr.seconds * 1000);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const ymdMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return str;
};

export const getMatchDateYMD = (dateStr) => {
  if (!dateStr || String(dateStr).trim().toUpperCase() === 'TBD') return '';

  if (typeof dateStr === 'object' && dateStr?.seconds) {
    const d = new Date(dateStr.seconds * 1000);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const str = String(dateStr).trim();
  const ymdMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;
  }

  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const day = String(dmyMatch[1]).padStart(2, '0');
    const month = String(dmyMatch[2]).padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return '';
};

export const getMatchMonthYear = (dateStr) => {
  if (!dateStr) return '';
  const inputDateStr = getMatchDateYMD(dateStr);
  if (!inputDateStr) return '';
  const parts = inputDateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const d = new Date(year, month, 1);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    }
  }
  return '';
};

export default function AdminMatches() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [detailFilter, setDetailFilter] = useState('All');
  const [detailFilterValue, setDetailFilterValue] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    type: 'Match',
    tournamentId: '',
    teamA: '',
    teamB: '',
    venue: '',
    date: '',
    time: '',
    status: 'Upcoming',
    format: 'T20',
    description: '',
  });

  useEffect(() => {
    if (role !== 'admin') navigate('/admin/login');
    fetchData();
  }, [role, navigate]);

  const fetchData = async () => {
    try {
      const [matchesData, schedulesData, teamsData, tournamentsData] = await Promise.all([
        getCollection('matches', []).catch(() => []),
        getCollection('schedules', []).catch(() => []),
        getCollection('teams', []).catch(() => []),
        getCollection('tournaments', []).catch(() => [])
      ]);

      const map = new Map();
      [...(matchesData || []), ...(schedulesData || [])].forEach((item) => {
        if (!item.id) return;
        map.set(item.id, { ...map.get(item.id), ...item });
      });

      const combinedMatches = Array.from(map.values());
      
      // Sort matches by date asc, placing TBD at the end
      combinedMatches.sort((a, b) => {
        const parseTime = (d) => {
          if (!d || String(d).trim().toUpperCase() === 'TBD') return Infinity;
          const t = new Date(d).getTime();
          return isNaN(t) ? Infinity : t;
        };
        return parseTime(a.date) - parseTime(b.date);
      });

      setMatches(combinedMatches);
      setTeams(teamsData || []);
      const validTourns = (tournamentsData || [])
        .filter(t => t && !t.isDeleted && !t.deleted && t.isActivated !== false && (t.name || t.title)?.trim())
        .filter((t, idx, arr) => arr.findIndex(x => (x.name || x.title || '').trim().toLowerCase() === (t.name || t.title || '').trim().toLowerCase()) === idx)
        .sort((a, b) => (a.name || a.title || '').localeCompare(b.name || b.title || ''));
      setTournaments(validTourns);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load matches data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'tournamentId') {
      const newTournamentId = value;
      const newAvailableTeams = newTournamentId
        ? teams.filter(t => t.tournamentId === newTournamentId)
        : teams;

      const teamAStillValid = newAvailableTeams.some(t => t.teamName === formData.teamA);
      const teamBStillValid = newAvailableTeams.some(t => t.teamName === formData.teamB);

      setFormData(prev => ({
        ...prev,
        tournamentId: newTournamentId,
        teamA: teamAStillValid ? prev.teamA : '',
        teamB: teamBStillValid ? prev.teamB : '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const dateConflictWarning = useMemo(() => {
    if (editingId) return null;
    const teamAObj = teams.find(t => t.teamName === formData.teamA);
    const teamBObj = teams.find(t => t.teamName === formData.teamB);
    return checkMatchDateConflict({
      targetDate: formData.date,
      teamA: formData.teamA,
      teamB: formData.teamB,
      teamAId: teamAObj?.id,
      teamBId: teamBObj?.id,
      existingMatches: matches,
      excludeMatchId: editingId
    });
  }, [formData.date, formData.teamA, formData.teamB, teams, matches, editingId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.type === 'Match' && formData.teamA && formData.teamB && formData.teamA === formData.teamB) {
      setError('Team A and Team B cannot be the same team.');
      return;
    }

    // Find team IDs
    const teamAObj = teams.find(t => t.teamName === formData.teamA);
    const teamBObj = teams.find(t => t.teamName === formData.teamB);

    // Check for date conflict on NEW match scheduling only (never blocks old matches)
    if (!editingId) {
      const conflictError = checkMatchDateConflict({
        targetDate: formData.date,
        teamA: formData.teamA,
        teamB: formData.teamB,
        teamAId: teamAObj?.id,
        teamBId: teamBObj?.id,
        existingMatches: matches,
        excludeMatchId: null
      });

      if (conflictError) {
        setError(conflictError);
        return;
      }
    }

    try {

      const targetAudience = (formData.teamA && formData.teamB)
        ? `${formData.teamA} vs ${formData.teamB}`
        : (formData.teamA || formData.teamB || 'All Teams');

      const formattedTime = formatTimeAMPM(formData.time);

      const matchData = {
        title: formData.title || (formData.teamA && formData.teamB ? `${formData.teamA} vs ${formData.teamB}` : `${formData.type} Session`),
        type: formData.type || 'Match',
        teamA: formData.teamA || '',
        teamB: formData.teamB || '',
        teamAId: teamAObj?.id || '',
        teamBId: teamBObj?.id || '',
        targetTeamName: targetAudience,
        venue: formData.venue || 'TBD',
        date: formData.date || 'TBD',
        time: formattedTime || '',
        status: formData.status || 'Upcoming',
        format: formData.format || 'T20',
        tournamentId: formData.tournamentId || '',
        description: formData.description || '',
      };

      let matchDocId = editingId;

      if (editingId) {
        await setDocument('matches', editingId, matchData);
        try {
          await setDocument('schedules', editingId, matchData);
        } catch (sErr) {
          console.warn('Sync to schedules collection skipped:', sErr);
        }
        setSuccess('Match / Schedule entry updated successfully!');
      } else {
        matchData.tossWinner = '';
        matchData.tossDecision = '';
        matchData.teamAScore = '';
        matchData.teamBScore = '';
        matchData.result = '';
        const docRef = await addDocument('matches', matchData);
        matchDocId = docRef.id;

        try {
          await setDocument('schedules', docRef.id, { id: docRef.id, ...matchData });
        } catch (sErr) {
          console.warn('Sync to schedules collection skipped:', sErr);
        }
        setSuccess('New Match / Schedule entry created and published to captains!');
      }

      await fetchData();
      setShowForm(false);
      setEditingId(null);
      resetForm();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save match entry');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this match/schedule entry?')) return;
    
    try {
      await deleteDocument('matches', id);
      await deleteDocument('schedules', id).catch(() => {});
      setSuccess('Entry deleted.');
      fetchData();
    } catch (err) {
      setError('Failed to delete entry');
    }
  };

  const handleEdit = (match) => {
    if (!match) return;
    const tournId = getStringVal(match.tournamentId);
    const tA = getStringVal(match.teamA);
    const tB = getStringVal(match.teamB);
    const tTitle = getStringVal(match.title);
    const tType = getStringVal(match.type) || 'Match';
    const tVenue = getStringVal(match.venue);
    const tStatus = getStringVal(match.status) || 'Upcoming';
    const tFormat = getStringVal(match.format) || 'T20';
    const tDesc = getStringVal(match.description);
    const rawDate = match.date;
    const rawTime = getStringVal(match.time);
    const isDateTBD = typeof rawDate === 'string' && rawDate.trim().toUpperCase() === 'TBD';

    setFormData({
      title: tTitle,
      type: tType,
      teamA: tA,
      teamB: tB,
      venue: tVenue || '',
      date: isDateTBD ? 'TBD' : formatDateForInput(rawDate),
      time: timeTo24h(rawTime),
      status: tStatus,
      format: tFormat,
      tournamentId: tournId,
      description: tDesc,
    });
    setEditingId(match.id);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'Match',
      teamA: '',
      teamB: '',
      venue: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      status: 'Upcoming',
      format: 'T20',
      tournamentId: '',
      description: '',
    });
  };

  const filteredMatches = matches.filter(m => {
    const matchesSearch =
      m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.teamA?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.teamB?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.venue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.type?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    const tournament = tournaments.find(t => t.id === getStringVal(m.tournamentId) || t.name === getStringVal(m.tournamentId));
    const filterValue = detailFilterValue.toLowerCase();

    let matchesDetail = true;
    if (detailFilter === 'Date') {
      if (dateFrom || dateTo) {
        const matchDate = getMatchDateYMD(m.date);
        if (!matchDate) {
          matchesDetail = false;
        } else {
          if (dateFrom && dateTo) {
            const minDate = dateFrom <= dateTo ? dateFrom : dateTo;
            const maxDate = dateFrom <= dateTo ? dateTo : dateFrom;
            matchesDetail = matchDate >= minDate && matchDate <= maxDate;
          } else if (dateFrom) {
            matchesDetail = matchDate >= dateFrom;
          } else if (dateTo) {
            matchesDetail = matchDate <= dateTo;
          }
        }
      } else {
        matchesDetail = true;
      }
    } else if (detailFilter === 'Month') {
      matchesDetail = !detailFilterValue || (
        formatDateForInput(m.date).startsWith(detailFilterValue) ||
        getMatchMonthYear(m.date) === detailFilterValue ||
        getMatchMonthYear(m.date).toLowerCase().includes(filterValue)
      );
    } else if (detailFilter === 'Team') {
      matchesDetail = !detailFilterValue || [m.teamA, m.teamB, m.targetTeamName].some(team => getStringVal(team).toLowerCase().includes(filterValue));
    } else if (detailFilter === 'Tournament') {
      matchesDetail = !detailFilterValue || getStringVal(m.tournamentId).toLowerCase() === filterValue || getStringVal(tournament?.name).toLowerCase() === filterValue;
    } else if (detailFilter === 'Ground') {
      matchesDetail = !detailFilterValue || getStringVal(m.venue).toLowerCase().includes(filterValue);
    }

    return matchesSearch && matchesStatus && matchesDetail;
  });

  const monthOptions = [...new Set(matches.map(match => getMatchMonthYear(match.date)).filter(Boolean))].sort((a, b) => {
    return new Date(`01 ${a}`) - new Date(`01 ${b}`);
  });

  const filterOptions = {
    Month: monthOptions,
    Team: [...new Set(matches.flatMap(m => [getStringVal(m.teamA), getStringVal(m.teamB)]).filter(Boolean))].sort(),
    Tournament: [...new Set(tournaments.map(tournament => getStringVal(tournament.name)).filter(Boolean))].sort(),
    Ground: [...new Set(matches.map(match => getStringVal(match.venue)).filter(Boolean))].sort(),
  };

  const selectedTournId = getStringVal(formData.tournamentId);
  const availableTeams = selectedTournId
    ? teams.filter(t => getStringVal(t.tournamentId) === selectedTournId || getStringVal(t.tournamentName) === selectedTournId)
    : teams;

  const exportMatchesToPDF = () => {
    if (!filteredMatches || filteredMatches.length === 0) {
      alert('No matches found to export based on the current filter.');
      return;
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;

    // Header Banner
    doc.setFillColor(15, 23, 42); // #0f172a
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Title
    doc.setTextColor(234, 179, 8); // #eab308
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('TRIVAB SPORTS AND EVENTS - MATCHES & SCHEDULE REPORT', margin, 12);

    // Filter Info Subtitle
    doc.setTextColor(226, 232, 240);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    const now = new Date();
    const exportDateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const exportTimeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    let filterSummary = `Export Date: ${exportDateStr} | Time: ${exportTimeStr}`;
    filterSummary += ` | Total Matches: ${filteredMatches.length}`;
    if (searchTerm) filterSummary += ` | Search: "${searchTerm}"`;
    if (statusFilter !== 'All') filterSummary += ` | Status: ${statusFilter}`;
    if (detailFilter === 'Date') {
      if (dateFrom && dateTo) {
        filterSummary += ` | Date Range: ${formatDateSafe(dateFrom)} to ${formatDateSafe(dateTo)}`;
      } else if (dateFrom) {
        filterSummary += ` | Date From: ${formatDateSafe(dateFrom)}`;
      } else if (dateTo) {
        filterSummary += ` | Date Up To: ${formatDateSafe(dateTo)}`;
      }
    } else if (detailFilter !== 'All' && detailFilterValue) {
      filterSummary += ` | ${detailFilter}: ${detailFilterValue}`;
    }

    doc.text(filterSummary, margin, 20);

    // Table Setup
    const columns = [
      { header: '#', width: 10 },
      { header: 'Fixture / Event Title', width: 40 },
      { header: 'Teams / Target', width: 85 },
      { header: 'Tournament', width: 38 },
      { header: 'Date & Time', width: 40 },
      { header: 'Venue', width: 38 },
      { header: 'Status', width: 22 },
    ];

    let currentY = 32;

    const drawHeaderRow = (y) => {
      doc.setFillColor(30, 41, 59); // #1e293b
      doc.rect(margin, y, pageWidth - (margin * 2), 9, 'F');

      doc.setTextColor(234, 179, 8); // Gold header text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);

      let x = margin + 3;
      columns.forEach(col => {
        doc.text(col.header, x, y + 6);
        x += col.width;
      });

      return y + 9;
    };

    currentY = drawHeaderRow(currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    filteredMatches.forEach((m, idx) => {
      if (currentY + 10 > pageHeight - 15) {
        doc.addPage();
        currentY = 15;
        currentY = drawHeaderRow(currentY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
      }

      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
      doc.rect(margin, currentY, pageWidth - (margin * 2), 9, 'F');

      doc.setDrawColor(226, 232, 240);
      doc.line(margin, currentY + 9, pageWidth - margin, currentY + 9);

      const tournId = getStringVal(m.tournamentId);
      const tournament = tournaments.find(t => t.id === tournId || t.name === tournId);
      const tAStr = getStringVal(m.teamA);
      const tBStr = getStringVal(m.teamB);
      const displayTitle = getStringVal(m.title) || (tAStr && tBStr ? `${tAStr} vs ${tBStr}` : getStringVal(m.type) || 'Match');
      const displayTeams = tAStr && tBStr ? `${tAStr} vs ${tBStr}` : (getStringVal(m.targetTeamName) || 'All Teams');
      const displayTourn = tournament ? tournament.name : 'General / All';
      const dateTimeStr = `${formatDateSafe(m.date)}${m.time ? ' @ ' + formatTimeAMPM(m.time) : ''}`;
      const venueStr = getStringVal(m.venue) || '—';
      const statusStr = getStringVal(m.status) || 'Upcoming';

      doc.setTextColor(30, 41, 59);

      let x = margin + 3;

      // #
      doc.text(String(idx + 1), x, currentY + 6);
      x += columns[0].width;

      // Fixture
      const titleLines = doc.splitTextToSize(displayTitle, columns[1].width - 4);
      doc.text(titleLines[0] || '', x, currentY + 6);
      x += columns[1].width;

      // Teams / Target
      const teamsLines = doc.splitTextToSize(displayTeams, columns[2].width - 4);
      doc.text(teamsLines[0] || '', x, currentY + 6);
      x += columns[2].width;

      // Tournament
      const tournLines = doc.splitTextToSize(displayTourn, columns[3].width - 4);
      doc.text(tournLines[0] || '', x, currentY + 6);
      x += columns[3].width;

      // Date & Time
      doc.text(dateTimeStr, x, currentY + 6);
      x += columns[4].width;

      // Venue
      const venueLines = doc.splitTextToSize(venueStr, columns[5].width - 4);
      doc.text(venueLines[0] || '', x, currentY + 6);
      x += columns[5].width;

      // Status
      if (statusStr === 'In Progress' || statusStr === 'Live') {
        doc.setTextColor(220, 38, 38);
      } else if (statusStr === 'Completed') {
        doc.setTextColor(22, 163, 74);
      } else {
        doc.setTextColor(202, 138, 4);
      }
      doc.setFont('helvetica', 'bold');
      doc.text(statusStr, x, currentY + 6);
      doc.setFont('helvetica', 'normal');

      currentY += 9;
    });

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 22, pageHeight - 8);
      doc.text('TRIVAB SPORTS AND EVENTS - Tournament Management', margin, pageHeight - 8);
    }

    doc.save(`Trivab_Matches_Schedule_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'In Progress' || status === 'Live') return 'badge-red';
    if (status === 'Completed') return 'badge-green';
    if (status === 'Cancelled') return 'badge-muted';
    return 'badge-gold';
  };

  if (loading) return <div className="container section-padding"><p>Loading Matches &amp; Schedule Console...</p></div>;

  return (
    <div className="admin-page container section-padding">

      {/* ── Page Header ── */}
      <div className="page-header flex justify-between items-center mb-xl flex-wrap gap-md">
        <div>
          <h1 className="display-sm text-gradient-gold">Matches &amp; Schedule</h1>
          <p className="text-secondary">Schedule matches, practice sessions, and manage match-day squads.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingId(null);
            setShowForm(true);
            setError('');
            setSuccess('');
          }}
          className="btn btn-gold"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} /> Schedule Match / Event
        </button>
      </div>

      {/* Global notifications */}
      {error && (
        <div className="alert alert-error mb-xl flex items-center gap-xs">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success mb-xl flex items-center gap-xs">
          <Activity size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* ── Filter / Search Bar ── */}
      <div className="flex gap-md items-center mb-lg flex-wrap">
        <div className="search-box flex-1 mb-0" style={{ marginBottom: 0 }}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by fixture title, team name, venue, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
        </div>

        <select
          className="form-select"
          value={detailFilter}
          onChange={(e) => {
            setDetailFilter(e.target.value);
            setDetailFilterValue('');
            setDateFrom('');
            setDateTo('');
          }}
          aria-label="Filter matches by"
          style={{ minWidth: '150px', width: 'auto' }}
        >
          <option value="All">Filter: All</option>
          <option value="Date">Filter: Date Range</option>
          <option value="Month">Filter: Month</option>
          <option value="Team">Filter: Team</option>
          <option value="Tournament">Filter: Tournament</option>
          <option value="Ground">Filter: Ground</option>
        </select>

        {detailFilter !== 'All' && detailFilter === 'Date' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--admin-muted)', fontWeight: 500 }}>From:</span>
              <input
                className="form-input"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="Filter matches from date"
                style={{ width: 'auto' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--admin-muted)', fontWeight: 500 }}>To:</span>
              <input
                className="form-input"
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="Filter matches to date"
                style={{ width: 'auto' }}
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                type="button"
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
                className="btn btn-outline"
                style={{
                  padding: '6px 10px',
                  fontSize: '0.75rem',
                  lineHeight: 1,
                  border: '1px solid var(--admin-border)',
                  color: 'var(--admin-muted)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Clear date range filter"
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>
        )}

        {detailFilter !== 'All' && detailFilter === 'Month' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              className="form-input"
              type="month"
              value={detailFilterValue}
              onChange={(e) => setDetailFilterValue(e.target.value)}
              aria-label="Select match month"
              style={{ width: 'auto' }}
            />
            {filterOptions['Month'] && filterOptions['Month'].length > 0 && (
              <select
                className="form-select"
                value={detailFilterValue}
                onChange={(e) => setDetailFilterValue(e.target.value)}
                aria-label="Select month name"
                style={{ minWidth: '150px', width: 'auto' }}
              >
                <option value="">All Months</option>
                {filterOptions['Month'].map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {detailFilter !== 'All' && detailFilter !== 'Date' && detailFilter !== 'Month' && (
          <select
            className="form-select"
            value={detailFilterValue}
            onChange={(e) => setDetailFilterValue(e.target.value)}
            aria-label={`Filter matches by ${detailFilter.toLowerCase()}`}
            style={{ minWidth: '170px', width: 'auto' }}
          >
            <option value="">All {detailFilter}s</option>
            {filterOptions[detailFilter]?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )}

        {/* Status Pills */}
        <div className="flex gap-xs flex-wrap">
          {['All', 'Upcoming', 'In Progress', 'Completed', 'Cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                border: statusFilter === st ? '1px solid var(--admin-accent)' : '1px solid var(--admin-border)',
                background: statusFilter === st ? 'rgba(128,0,0,0.2)' : 'transparent',
                color: statusFilter === st ? 'var(--admin-text)' : 'var(--admin-muted)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <button
          onClick={exportMatchesToPDF}
          className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', padding: '8px 14px', fontSize: '0.85rem' }}
          title="Download PDF"
        >
          <Download size={16} /> Download PDF
        </button>
      </div>

      {/* ── Form Modal ── */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)'
        }}>
          <div style={{
            background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)',
            borderRadius: '16px', padding: 'var(--space-2xl)', width: '100%', maxWidth: '680px',
            maxHeight: '92vh', overflowY: 'auto', position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
              <h2 style={{ color: 'var(--admin-text)', margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                {editingId ? 'Edit Schedule / Match Fixture' : '📅 New Match / Schedule Entry'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--admin-text)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>

              {/* Title */}
              <div className="form-group">
                <label className="form-label">TITLE / FIXTURE NAME</label>
                <input
                  className="form-input"
                  type="text"
                  name="title"
                  placeholder="e.g. League Match / Morning Practice Session..."
                  value={formData.title}
                  onChange={handleInputChange}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', marginTop: '4px' }}>
                  If left blank, will default to "Team A vs Team B" or entry type.
                </span>
              </div>

              {/* Type & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                <div className="form-group">
                  <label className="form-label">TYPE *</label>
                  <select className="form-select" name="type" value={formData.type} onChange={handleInputChange}>
                    {SCHEDULE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">STATUS</label>
                  <select className="form-select" name="status" value={formData.status} onChange={handleInputChange}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Tournament */}
              <div className="form-group">
                <label className="form-label">TOURNAMENT</label>
                <select className="form-select" name="tournamentId" value={formData.tournamentId} onChange={handleInputChange}>
                  <option value="">-- General / All Tournaments --</option>
                  {tournaments.map(t => (
                    <option key={t.id} value={t.id}>{t.name || t.title}</option>
                  ))}
                </select>
              </div>

              {/* Teams Selection (Filtered by selected Tournament) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>TEAM A (Optional)</span>
                    {formData.tournamentId && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 600 }}>
                        ({availableTeams.length} {availableTeams.length === 1 ? 'team' : 'teams'})
                      </span>
                    )}
                  </label>
                  <select className="form-select" name="teamA" value={formData.teamA} onChange={handleInputChange}>
                    <option value="">-- Select Team A --</option>
                    {availableTeams.length === 0 ? (
                      <option value="" disabled>No teams found for this tournament</option>
                    ) : (
                      availableTeams.map(t => (
                        <option key={t.id} value={t.teamName}>{t.teamName}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>TEAM B (Optional)</span>
                    {formData.tournamentId && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 600 }}>
                        ({availableTeams.length} {availableTeams.length === 1 ? 'team' : 'teams'})
                      </span>
                    )}
                  </label>
                  <select className="form-select" name="teamB" value={formData.teamB} onChange={handleInputChange}>
                    <option value="">-- Select Team B --</option>
                    {availableTeams.length === 0 ? (
                      <option value="" disabled>No teams found for this tournament</option>
                    ) : (
                      availableTeams.map(t => (
                        <option key={t.id} value={t.teamName}>{t.teamName}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ margin: 0 }}>DATE (Optional / TBD)</label>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, date: p.date === 'TBD' ? '' : 'TBD' }))}
                      style={{
                        background: formData.date === 'TBD' ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)',
                        border: '1px solid ' + (formData.date === 'TBD' ? 'var(--gold)' : 'var(--admin-border)'),
                        color: formData.date === 'TBD' ? 'var(--gold)' : 'var(--admin-muted)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {formData.date === 'TBD' ? '✓ TBD Set' : 'Set as TBD'}
                    </button>
                  </div>
                  <input
                    className="form-input"
                    type={formData.date === 'TBD' || (formData.date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) ? 'text' : 'date'}
                    name="date"
                    placeholder="YYYY-MM-DD or TBD"
                    value={formData.date}
                    onChange={handleInputChange}
                  />
                  <span style={{ fontSize: '0.73rem', color: 'var(--admin-muted)', marginTop: '4px' }}>
                    Optional. Enter date, leave blank, or type TBD to schedule later.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">TIME (Optional)</label>
                  <input
                    className="form-input"
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                  />
                  {formData.time && (
                    <span style={{ fontSize: '0.78rem', color: '#EAB308', marginTop: '6px', display: 'block', fontWeight: 600 }}>
                      ⏰ Format: {formatTimeAMPM(formData.time)}
                    </span>
                  )}
                </div>
              </div>

              {dateConflictWarning && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#f87171',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{dateConflictWarning}</span>
                </div>
              )}

              {/* Venue & Format */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                <div className="form-group">
                  <label className="form-label">VENUE / LOCATION (Optional / TBD)</label>
                  <input
                    className="form-input"
                    type="text"
                    name="venue"
                    placeholder="e.g. Kandivali Ground, Mumbai (or TBD)"
                    value={formData.venue}
                    onChange={handleInputChange}
                  />
                  <span style={{ fontSize: '0.73rem', color: 'var(--admin-muted)', marginTop: '4px' }}>
                    Optional. Leave blank or type TBD to set location later.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">FORMAT</label>
                  <select className="form-select" name="format" value={formData.format} onChange={handleInputChange}>
                    {FORMAT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              {/* Description / Notes */}
              <div className="form-group">
                <label className="form-label">DESCRIPTION / NOTES FOR CAPTAINS</label>
                <textarea
                  className="form-input"
                  name="description"
                  rows={3}
                  placeholder="Any extra details, instructions, or rules for captains..."
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-gold">
                  {editingId ? 'Update Fixture' : 'Publish Schedule'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── Matches & Schedule Table ── */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fixture / Event Name</th>
              <th>Type</th>
              <th>Teams / Target</th>
              <th>Tournament</th>
              <th>Date &amp; Time</th>
              <th>Venue</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMatches.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--admin-muted)' }}>
                  No matches or schedule entries found. Click <strong>Schedule Match / Event</strong> to create one.
                </td>
              </tr>
            ) : (
              filteredMatches.map(match => {
                const tournId = getStringVal(match.tournamentId);
                const tournament = tournaments.find(t => t.id === tournId || t.name === tournId);
                const tAStr = getStringVal(match.teamA);
                const tBStr = getStringVal(match.teamB);
                const displayTitle = getStringVal(match.title) || (tAStr && tBStr ? `${tAStr} vs ${tBStr}` : getStringVal(match.type) || 'Match');
                const displayTeams = tAStr && tBStr ? `${tAStr} vs ${tBStr}` : (getStringVal(match.targetTeamName) || 'All Teams');

                return (
                  <tr key={match.id}>
                    <td>
                      <div>
                        <span className="font-semi text-gold" style={{ display: 'block', fontSize: '0.92rem' }}>{displayTitle}</span>
                        {match.description && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>{getStringVal(match.description).slice(0, 50)}...</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>
                        {getStringVal(match.type) || 'Match'}
                      </span>
                    </td>
                    <td className="text-secondary text-sm font-semi">
                      {displayTeams}
                    </td>
                    <td className="text-secondary text-sm font-semi">
                      {tournament ? tournament.name : 'General / All'}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                        <Clock size={13} style={{ color: 'var(--admin-muted)' }} />
                        {formatDateSafe(match.date)}
                        {match.time ? ` @ ${formatTimeAMPM(match.time)}` : ''}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.83rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} style={{ color: 'var(--admin-muted)' }} />
                        {match.venue || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(match.status)}`} style={{ fontSize: '0.72rem' }}>
                        {match.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-sm">
                        <button
                          onClick={() => navigate(`/admin/matches/${match.id}/manage`)}
                          className="btn-table-action text-gold"
                          title="Start Match / Manage Squad & QR Scan"
                          style={{ color: '#EAB308', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Activity size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(match)}
                          className="btn-table-action text-gold"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(match.id)}
                          className="btn-table-action text-red"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
