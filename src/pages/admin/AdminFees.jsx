import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCollection, setDocument, addDocument } from '../../firebase/firestore';
import { safeFormatDate, safeFormatDateTime } from '../../utils/dateFormatter';
import { 
  CreditCard, Search, Plus, Edit2, AlertCircle, CheckCircle, Clock, X, Info, Calendar, DollarSign, History
} from 'lucide-react';
import Loader from '../../components/common/Loader';
import './Admin.css';

export default function AdminFees() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [teams, setTeams] = useState([]);
  const [fees, setFees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [totalTournamentFee, setTotalTournamentFee] = useState('');
  const [totalPaidAmount, setTotalPaidAmount] = useState('');
  const [receivingDate, setReceivingDate] = useState('');
  const [nextDueAmount, setNextDueAmount] = useState('');
  const [nextDue, setNextDue] = useState('');
  const [status, setStatus] = useState('Pending');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [historyModal, setHistoryModal] = useState(null); // { team, records }
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/admin/login');
    } else {
      fetchInitialData();
    }
  }, [role, navigate]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      const tournamentsData = await getCollection('tournaments') || [];
      setTournaments(tournamentsData);
      
      // Select the first tournament by default if available
      if (tournamentsData.length > 0) {
        setSelectedTournamentId(tournamentsData[0].id);
      }
      
      const teamsData = await getCollection('teams') || [];
      const feesData = await getCollection('team_fees') || [];
      setTeams(teamsData);
      setFees(feesData);
    } catch (err) {
      console.error('Error fetching initial fees data:', err);
      setError(`Failed to load tournament or team records: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (teamId, teamFeeRecord) => {
    setSelectedTeamId(teamId);
    if (teamFeeRecord) {
      setTotalTournamentFee(teamFeeRecord.totalTournamentFee || '');
      setTotalPaidAmount(teamFeeRecord.totalPaidAmount || '');
      setReceivingDate(teamFeeRecord.receivingDate || '');
      setNextDueAmount(teamFeeRecord.nextDueAmount || '');
      setStatus(teamFeeRecord.status || 'Pending');
      
      // Format nextDue date to YYYY-MM-DD for the HTML date input
      if (teamFeeRecord.nextDue) {
        try {
          const dateObj = new Date(teamFeeRecord.nextDue);
          if (!isNaN(dateObj.getTime())) {
            setNextDue(dateObj.toISOString().split('T')[0]);
          } else {
            setNextDue('');
          }
        } catch {
          setNextDue('');
        }
      } else {
        setNextDue('');
      }
      
      setMessage(teamFeeRecord.message || '');
    } else {
      // Default reset
      setTotalTournamentFee('');
      setTotalPaidAmount('');
      setReceivingDate('');
      setNextDueAmount('');
      setStatus('Pending');
      setNextDue('');
      setMessage('');
    }
    setError('');
    setSuccess('');
    setShowForm(true);
    
    // Smooth scroll to form
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedTeamId) {
      setError('Please select a team.');
      return;
    }

    const team = teams.find(t => t.id === selectedTeamId);
    if (!team) {
      setError('Selected team not found.');
      return;
    }

    setSaving(true);
    try {
      const feeRecord = {
        teamId: selectedTeamId,
        teamName: team.teamName,
        tournamentId: team.tournamentId || '',
        tournamentName: team.tournamentName || 'N/A',
        totalTournamentFee: totalTournamentFee ? String(totalTournamentFee).trim() : '0',
        totalPaidAmount: totalPaidAmount ? String(totalPaidAmount).trim() : '0',
        receivingDate: receivingDate || '',
        nextDueAmount: nextDueAmount ? String(nextDueAmount).trim() : '',
        nextDue: nextDue ? new Date(nextDue).toISOString() : '',
        status: status,
        message: message.trim(),
      };

      await setDocument('team_fees', selectedTeamId, feeRecord);
      
      // Save snapshot log to payment_history
      try {
        await addDocument('payment_history', {
          ...feeRecord,
          createdAt: new Date().toISOString()
        });
      } catch (historyErr) {
        console.warn("Failed to save payment history snapshot:", historyErr);
      }
      
      setSuccess(`Successfully updated fee details for team: ${team.teamName}`);
      
      // Refresh local data
      const updatedFees = await getCollection('team_fees') || [];
      setFees(updatedFees);
      
      // Reset form
      setSelectedTeamId('');
      setTotalTournamentFee('');
      setTotalPaidAmount('');
      setReceivingDate('');
      setNextDueAmount('');
      setStatus('Pending');
      setNextDue('');
      setMessage('');
      setShowForm(false);
    } catch (err) {
      console.error('Error saving fee document:', err);
      setError(`Failed to update fee details: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadgeClass = (statusVal) => {
    switch (statusVal) {
      case 'Paid':
        return 'badge-green';
      case 'Overdue':
        return 'badge-red';
      case 'Pending':
      default:
        return 'badge-gold';
    }
  };

  const getStatusIcon = (statusVal) => {
    switch (statusVal) {
      case 'Paid':
        return <CheckCircle size={14} className="text-green" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />;
      case 'Overdue':
        return <AlertCircle size={14} className="text-red" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />;
      case 'Pending':
      default:
        return <Clock size={14} className="text-gold" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />;
    }
  };

  const handleViewHistory = async (team) => {
    setHistoryLoading(true);
    setHistoryModal({ team, records: [] });
    try {
      const allHistory = await getCollection('payment_history') || [];
      const teamHistory = allHistory
        .filter(h => h.teamId === team.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setHistoryModal({ team, records: teamHistory });
    } catch (err) {
      console.error('Failed to load payment history:', err);
      setHistoryModal({ team, records: [] });
    } finally {
      setHistoryLoading(false);
    }
  };

  // Compile combined view data of teams with fee info
  const combinedData = teams.map(team => {
    const feeInfo = fees.find(f => f.teamId === team.id);
    return {
      team,
      feeInfo
    };
  });

  // Filter based on selected tournament, search, and status
  const filteredData = combinedData.filter(item => {
    // 1. Filter by Tournament Selection
    if (selectedTournamentId && item.team.tournamentId !== selectedTournamentId) {
      return false;
    }
    
    // 2. Filter by Search term
    const matchesSearch = item.team.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.team.tournamentName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 3. Filter by Status
    const feeStatus = item.feeInfo?.status || 'Unconfigured';
    const matchesStatus = statusFilter === 'All' || 
                          (statusFilter === 'Unconfigured' && !item.feeInfo) ||
                          (item.feeInfo && feeStatus === statusFilter);
                          
    return matchesSearch && matchesStatus;
  });

  // Teams eligible for dropdown selection (filtered by selected tournament)
  const selectableTeams = teams.filter(t => !selectedTournamentId || t.tournamentId === selectedTournamentId);

  // Format currency helper
  const formatCurrency = (val) => {
    if (!val || isNaN(val)) return '₹0';
    return `₹${Number(val).toLocaleString('en-IN')}`;
  };

  if (loading) return <Loader />;

  return (
    <div className="admin-page container section-padding animate-fade-in">
      <div className="page-header flex justify-between items-center mb-xl">
        <div>
          <h1 className="display-sm text-gradient-gold">Tournament Fees</h1>
          <p className="text-secondary">Manage and track fees status for all tournament teams</p>
        </div>
        <button
          onClick={() => {
            setSelectedTeamId('');
            setTotalTournamentFee('');
            setTotalPaidAmount('');
            setReceivingDate('');
            setNextDueAmount('');
            setStatus('Pending');
            setNextDue('');
            setMessage('');
            setError('');
            setSuccess('');
            setShowForm(!showForm);
          }}
          className="btn btn-gold"
          disabled={!selectedTournamentId}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? 'Close Form' : 'Update Team Fee'}
        </button>
      </div>

      {success && (
        <div className="alert alert-success mb-lg" style={{ color: '#22c55e', borderColor: 'rgba(34, 197, 94, 0.3)', background: 'rgba(34, 197, 94, 0.05)' }}>
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error mb-lg">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Tournament Filter Dropdown Card */}
      <div className="card mb-xl p-lg" style={{ borderLeft: '4px solid var(--admin-gold)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="form-label" style={{ fontWeight: 'bold', fontSize: '0.92rem', letterSpacing: '0.02em' }}>
            🎯 Select Tournament:
          </label>
          <select
            value={selectedTournamentId}
            onChange={(e) => {
              setSelectedTournamentId(e.target.value);
              setShowForm(false); // Reset form visibility on tournament switch
            }}
            className="form-select"
            style={{ width: '100%', maxWidth: '480px' }}
          >
            <option value="">-- View All Tournaments --</option>
            {tournaments.map(tourn => (
              <option key={tourn.id} value={tourn.id}>
                {tourn.tournamentName || tourn.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showForm && (
        <div className="card card-gold mb-xl p-lg animate-fade-in">
          <h2 className="text-lg font-bold mb-md text-gradient-gold flex items-center gap-xs">
            <CreditCard size={22} /> Configure Team Fees
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-2 gap-md">
            <div className="form-group col-2">
              <label className="form-label">Select Team <span className="text-red">*</span></label>
              <select
                className="form-select"
                required
                value={selectedTeamId}
                onChange={(e) => {
                  const tId = e.target.value;
                  const existingFee = fees.find(f => f.teamId === tId);
                  handleEditClick(tId, existingFee);
                }}
              >
                <option value="">-- Choose a Team from this Tournament --</option>
                {selectableTeams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.teamName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Total Tournament Fee (₹) <span className="text-red">*</span></label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 50000"
                required
                value={totalTournamentFee}
                onChange={(e) => setTotalTournamentFee(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Total Paid Amount (₹) <span className="text-red">*</span></label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 20000"
                required
                value={totalPaidAmount}
                onChange={(e) => setTotalPaidAmount(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Last Payment Receiving Date</label>
              <input
                type="date"
                className="form-input"
                value={receivingDate}
                onChange={(e) => setReceivingDate(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Status <span className="text-red">*</span></label>
              <select
                className="form-select"
                required
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={saving}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Next Due Amount (₹)</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 10000"
                value={nextDueAmount}
                onChange={(e) => setNextDueAmount(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Next Due Date</label>
              <input
                type="date"
                className="form-input"
                value={nextDue}
                onChange={(e) => setNextDue(e.target.value)}
                disabled={saving}
              />
            </div>

            {totalTournamentFee && (
              <div className="form-group col-2" style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--admin-border-accent)' }}>
                <span className="text-sm text-secondary font-semi">Calculated Balance Amount: </span>
                <span className="font-bold text-gradient-gold" style={{ fontSize: '1.1rem', marginLeft: '8px' }}>
                  {formatCurrency(Number(totalTournamentFee) - Number(totalPaidAmount || 0))}
                </span>
              </div>
            )}

            <div className="form-group col-2">
              <label className="form-label">Custom Message / Payment Notes</label>
              <textarea
                className="form-input"
                placeholder="e.g. First installment received. Next due by next week."
                rows="3"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={saving}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="flex gap-md col-2" style={{ marginTop: '12px' }}>
              <button type="submit" className="btn btn-gold flex-1" disabled={saving}>
                {saving ? 'Saving...' : 'Save Fee Details'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedTeamId('');
                  setTotalTournamentFee('');
                  setTotalPaidAmount('');
                  setReceivingDate('');
                  setNextDueAmount('');
                  setStatus('Pending');
                  setNextDue('');
                  setMessage('');
                  setError('');
                }}
                className="btn btn-outline flex-1"
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters & Search */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
        <div className="search-box" style={{ flex: 1, marginBottom: 0 }}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by team..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-select"
          style={{ width: 'auto', minWidth: '200px' }}
        >
          <option value="All">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Overdue">Overdue</option>
          <option value="Unconfigured">Not Configured</option>
        </select>
      </div>

      {/* Roster Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Team &amp; Tournament</th>
                <th>Status</th>
                <th>Total Fee</th>
                <th>Total Paid</th>
                <th>Balance</th>
                <th>Next Due</th>
                <th>Last Payment Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted" style={{ padding: '32px' }}>
                    <Info size={24} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.5 }} />
                    No team fee records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredData.map(({ team, feeInfo }) => {
                  const balance = feeInfo 
                    ? Number(feeInfo.totalTournamentFee || 0) - Number(feeInfo.totalPaidAmount || 0)
                    : 0;

                  return (
                    <tr key={team.id}>
                      <td style={{ verticalAlign: 'middle' }}>
                        <div className="font-semi text-primary">{team.teamName}</div>
                        <div className="text-xs text-muted">{team.tournamentName || 'No tournament assigned'}</div>
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        {feeInfo ? (
                          <span className={`badge ${getStatusBadgeClass(feeInfo.status)}`}>
                            {getStatusIcon(feeInfo.status)}
                            {feeInfo.status}
                          </span>
                        ) : (
                          <span className="badge badge-outline text-muted" style={{ border: '1px dashed var(--admin-border)' }}>
                            Not Configured
                          </span>
                        )}
                      </td>
                      <td style={{ verticalAlign: 'middle' }} className="font-bold text-primary">
                        {feeInfo ? formatCurrency(feeInfo.totalTournamentFee) : '—'}
                      </td>
                      <td style={{ verticalAlign: 'middle', color: '#22c55e', fontWeight: 'bold' }} className="text-green">
                        {feeInfo ? formatCurrency(feeInfo.totalPaidAmount) : '—'}
                      </td>
                      <td style={{ verticalAlign: 'middle', color: balance > 0 ? '#ef4444' : '#22c55e', fontWeight: 'bold' }} className="font-bold text-red">
                        {feeInfo ? formatCurrency(balance) : '—'}
                      </td>
                      <td style={{ verticalAlign: 'middle', fontSize: '0.85rem' }}>
                        {feeInfo && feeInfo.nextDue ? (
                          <div>
                            <div>{formatCurrency(feeInfo.nextDueAmount)}</div>
                            <div className="text-xs text-muted">{safeFormatDate(feeInfo.nextDue)}</div>
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ verticalAlign: 'middle', fontSize: '0.85rem' }}>
                        {feeInfo && feeInfo.receivingDate ? safeFormatDate(feeInfo.receivingDate) : '—'}
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleEditClick(team.id, feeInfo)}
                            className="btn btn-outline btn-xs flex items-center gap-xs"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center' }}
                          >
                            <Edit2 size={12} /> Configure
                          </button>
                          <button
                            onClick={() => handleViewHistory(team)}
                            className="btn btn-outline btn-xs flex items-center gap-xs"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', borderColor: '#3B82F6', color: '#60A5FA' }}
                          >
                            <History size={12} /> History
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

      {/* ── Payment History Modal ── */}
      {historyModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
        }}>
          <div style={{
            background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)',
            borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '780px',
            maxHeight: '88vh', overflowY: 'auto', position: 'relative'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--admin-border)', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ color: 'var(--admin-text)', margin: 0, fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={20} style={{ color: '#60A5FA' }} /> Payment History
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--admin-muted)' }}>
                  {historyModal.team.teamName} — {historyModal.team.tournamentName || 'All Tournaments'}
                </p>
              </div>
              <button onClick={() => setHistoryModal(null)} style={{ background: 'none', border: 'none', color: 'var(--admin-text)', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            {/* Body */}
            {historyLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--admin-muted)' }}>
                <Clock size={32} style={{ opacity: 0.4, marginBottom: '10px', display: 'block', margin: '0 auto 10px' }} />
                Loading history...
              </div>
            ) : historyModal.records.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--admin-muted)' }}>
                <History size={36} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>No payment history records found for this team.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {historyModal.records.map((rec, idx) => {
                  const bal = Number(rec.totalTournamentFee || 0) - Number(rec.totalPaidAmount || 0);
                  const statusColor = rec.status === 'Paid' ? '#22c55e' : rec.status === 'Overdue' ? '#ef4444' : '#d4af37';
                  return (
                    <div key={idx} style={{
                      background: 'rgba(255,255,255,0.02)', border: '1px solid var(--admin-border)',
                      borderRadius: '10px', padding: '14px 18px',
                      borderLeft: `3px solid ${statusColor}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--admin-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} /> {rec.createdAt ? safeFormatDateTime(rec.createdAt) : '—'}
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {rec.status || 'Pending'}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Total Fee</div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--admin-text)' }}>{formatCurrency(rec.totalTournamentFee)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'rgba(34,197,94,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Amount Paid</div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#22c55e' }}>{formatCurrency(rec.totalPaidAmount)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: bal > 0 ? 'rgba(239,68,68,0.8)' : 'rgba(34,197,94,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Balance</div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: bal > 0 ? '#ef4444' : '#22c55e' }}>{formatCurrency(bal)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Payment Date</div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--admin-text)' }}>{rec.receivingDate ? safeFormatDate(rec.receivingDate) : '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--admin-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Next Due</div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--admin-text)' }}>
                            {rec.nextDue ? safeFormatDate(rec.nextDue) : '—'}
                            {rec.nextDueAmount ? <span style={{ color: '#d4af37', marginLeft: '4px' }}>({formatCurrency(rec.nextDueAmount)})</span> : ''}
                          </div>
                        </div>
                      </div>
                      {rec.message && (
                        <div style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--admin-muted)', fontStyle: 'italic', borderTop: '1px solid var(--admin-border)', paddingTop: '8px' }}>
                          📝 {rec.message}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button onClick={() => setHistoryModal(null)} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
