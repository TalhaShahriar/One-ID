import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { 
  Calendar, 
  Plus, 
  Vote, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  TrendingUp, 
  ChevronRight,
  Info,
  Edit3
} from 'lucide-react';
import api from '../../lib/api.js';
import { toast } from 'sonner';

// Bangladesh Standard Time is UTC+6.
// datetime-local inputs return strings like "2026-07-29T11:25" with NO timezone.
// We must explicitly attach the BD offset so the server stores the correct UTC time.

/** Convert a datetime-local input value ("YYYY-MM-DDTHH:mm") → ISO 8601 with +06:00 offset */
const bdLocalToISO = (dtLocalStr) => {
  if (!dtLocalStr) return '';
  return `${dtLocalStr}:00+06:00`;
};

/** Convert a stored UTC ISO string → datetime-local input value in Bangladesh local time */
const isoToBDLocal = (isoStr) => {
  if (!isoStr) return '';
  // Create date from ISO, then format in Asia/Dhaka timezone
  const d = new Date(isoStr);
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  // sv-SE locale gives YYYY-MM-DD HH:mm format; replace space with T for datetime-local
  return formatter.format(d).replace(' ', 'T');
};

/**
 * Admin Elections Dashboard Page.
 * Displays all scheduled, active, and closed elections in a polished status-tracked table.
 * Schedules new elections securely and updates statuses in real-time via websockets.
 */
export default function AdminElections() {
  const navigate = useNavigate();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingElection, setEditingElection] = useState(null);

  // Create Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [electionType, setElectionType] = useState('NATIONAL');
  const [administrativeUnit, setAdministrativeUnit] = useState('');
  const [constituencyScope, setConstituencyScope] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  // Edit Form states
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editElectionType, setEditElectionType] = useState('NATIONAL');
  const [editAdministrativeUnit, setEditAdministrativeUnit] = useState('');
  const [editConstituencyScope, setEditConstituencyScope] = useState('');
  const [editStartAt, setEditStartAt] = useState('');
  const [editEndAt, setEditEndAt] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Load elections init
  const fetchElections = async () => {
    try {
      const res = await api.get('/elections');
      setElections(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load registered elections from decentralized registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElections();

    // Dynamically connect websocket to listen to live node state adjustments
    const socketUrl = import.meta.env.VITE_API_BASE_URL 
      ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') 
      : window.location.origin;
    
    const socket = io(socketUrl, { withCredentials: true });

    socket.on('election:status_changed', (data) => {
      console.log('📡 Real-time update: Election status transition', data);
      setElections(prev => prev.map(el => {
        if (el.id === data.electionId) {
          return { ...el, status: data.status };
        }
        return el;
      }));
      toast.info(`Election status change: "${data.title}" is now ${data.status}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCreateElection = async (e) => {
    e.preventDefault();
    if (!title || !description || !administrativeUnit || !constituencyScope || !startAt || !endAt) {
      toast.error('Please input all core parameters before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/elections', {
        title,
        description,
        election_type: electionType,
        administrative_unit: administrativeUnit,
        constituency_scope: constituencyScope,
        start_at: bdLocalToISO(startAt),
        end_at: bdLocalToISO(endAt)
      });
      toast.success('Election successfully scheduled on the node ledger!');
      setIsModalOpen(false);
      // Clean form fields
      setTitle('');
      setDescription('');
      setAdministrativeUnit('');
      setConstituencyScope('');
      setStartAt('');
      setEndAt('');
      fetchElections();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Registration failed.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (el, e) => {
    e.stopPropagation();
    setEditingElection(el);
    setEditTitle(el.title || '');
    setEditDescription(el.description || '');
    setEditElectionType(el.election_type || 'NATIONAL');
    setEditAdministrativeUnit(el.administrative_unit || '');
    setEditConstituencyScope(el.constituency_scope || '');
    setEditStartAt(el.start_at ? isoToBDLocal(el.start_at) : '');
    setEditEndAt(el.end_at ? isoToBDLocal(el.end_at) : '');
    setIsEditModalOpen(true);
  };

  const handleUpdateElection = async (e) => {
    e.preventDefault();
    if (!editTitle || !editDescription || !editAdministrativeUnit || !editConstituencyScope || !editStartAt || !editEndAt) {
      toast.error('Please input all core parameters before updating.');
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/elections/${editingElection.id}`, {
        title: editTitle,
        description: editDescription,
        election_type: editElectionType,
        administrative_unit: editAdministrativeUnit,
        constituency_scope: editConstituencyScope,
        start_at: bdLocalToISO(editStartAt),
        end_at: bdLocalToISO(editEndAt)
      });
      toast.success('Election parameters updated successfully!');
      setIsEditModalOpen(false);
      setEditingElection(null);
      fetchElections();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Update failed.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSeedCandidates = async (e, el) => {
    e.stopPropagation();
    try {
      toast.loading(`Seeding candidates for ${el.title}...`, { id: `seed-cand-${el.id}` });
      await api.post('/candidates/seed-test', {
        election_id: el.id,
        constituency: el.constituency_scope === 'ALL' || el.constituency_scope === 'NATIONAL' ? 'Dhaka-1' : el.constituency_scope
      });
      toast.success('Successfully seeded approved test candidates!', { id: `seed-cand-${el.id}` });
      fetchElections();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to seed test candidates.', { id: `seed-cand-${el.id}` });
    }
  };

  const handleSeedVotes = async (e, el) => {
    e.stopPropagation();
    try {
      toast.loading(`Seeding random votes for ${el.title}...`, { id: `seed-votes-${el.id}` });
      const res = await api.post('/votes/seed-votes', {
        election_id: el.id,
        count: 10
      });
      toast.success(`Successfully seeded ${res.data.count} random votes!`, { id: `seed-votes-${el.id}` });
      fetchElections();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to seed random votes.', { id: `seed-votes-${el.id}` });
    }
  };

  // Helper mapping color-coded status badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return <span className="bg-slate-100/80 border border-slate-200 text-slate-500 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">Scheduled</span>;
      case 'ACTIVE':
        return <span className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider animate-pulse">Active</span>;
      case 'CLOSED':
        return <span className="bg-amber-50 border border-amber-200 text-amber-600 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">Closed</span>;
      case 'RESULTS_PUBLISHED':
        return <span className="bg-blue-50 border border-blue-200 text-blue-600 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">Published</span>;
      default:
        return <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full font-bold">{status}</span>;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8 font-sans">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Election Management Node
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Monitor, track live voters turnout, and schedule upcoming general and municipal balloting.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-3 rounded-lg flex items-center gap-2 transition shadow-sm hover:shadow"
        >
          <Plus className="h-4 w-4" /> Schedule New Election
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl">
          <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent animate-spin rounded-full mb-3"></div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">Fetching Ledger Records...</p>
        </div>
      ) : elections.length === 0 ? (
        <div className="border border-dashed border-slate-200 bg-white p-12 text-center rounded-2xl">
          <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Scheduled Elections Located</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">There are no current running or scheduled sessions in the database.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Title & Scope</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Scheduling Details</th>
                <th className="px-6 py-4 text-center">Candidates</th>
                <th className="px-6 py-4 text-center">Cast Ballots</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {elections.map((el) => (
                <tr 
                  key={el.id}
                  onClick={() => navigate(`/admin/elections/${el.id}`)}
                  className="hover:bg-slate-50 cursor-pointer transition"
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{el.title}</div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold">{el.election_type}</span>
                      <span>•</span>
                      <MapPin className="h-3.5 w-3.5 inline text-slate-400" /> {el.constituency_scope} ({el.administrative_unit})
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(el.status)}</td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-slate-600 font-medium flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 inline text-slate-400" /> Start: {new Date(el.start_at).toLocaleString('en-BD', { timeZone: 'Asia/Dhaka', dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                    <div className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 inline text-slate-400" /> End: {new Date(el.end_at).toLocaleString('en-BD', { timeZone: 'Asia/Dhaka', dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-blue-50 border border-blue-100 text-blue-600 px-3 py-1 rounded-md font-mono font-bold text-xs">
                      {el._count?.candidates ?? 0} Running
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-3 py-1 rounded-md font-mono font-bold text-xs flex items-center gap-1.5 justify-center w-24 mx-auto">
                      <Vote className="h-3.5 w-3.5" /> {el._count?.votes ?? 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 flex-wrap max-w-xs">
                      {(el.status === 'SCHEDULED' || el.status === 'ACTIVE') && (
                        <button
                          onClick={(e) => handleSeedCandidates(e, el)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white transition-colors flex items-center gap-1 text-xs font-bold"
                          title="Seed Test Candidates"
                        >
                          <Plus className="h-3.5 w-3.5" /> Seed Cands
                        </button>
                      )}
                      {el.status === 'ACTIVE' && (
                        <button
                          onClick={(e) => handleSeedVotes(e, el)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white transition-colors flex items-center gap-1 text-xs font-bold"
                          title="Seed Random Votes"
                        >
                          <Vote className="h-3.5 w-3.5" /> Seed Votes
                        </button>
                      )}
                      <button
                        onClick={(e) => openEditModal(el, e)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#006a4e] text-slate-600 hover:text-white transition-colors flex items-center gap-1 text-xs font-bold"
                        title="Edit Election Parameters"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Schedule New Election Cycle</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateElection} className="p-6 space-y-4 overflow-y-auto">
              
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">Election Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. 13th Parliament General Assembly - Dhaka-5 Division"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">Description Summary</label>
                <textarea 
                  required
                  rows={2}
                  placeholder="Explain guidelines, seat boundaries, or pilot details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">Election Type</label>
                  <select
                    value={electionType}
                    onChange={(e) => setElectionType(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                  >
                    <option value="NATIONAL">National Assembly</option>
                    <option value="LOCAL">Local Municipal election</option>
                    <option value="PRESIDENTIAL">Presidential ballot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">Constituency Scope</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Dhaka-5 or NATIONAL"
                    value={constituencyScope}
                    onChange={(e) => setConstituencyScope(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">Administrative Unit</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Dhaka Division or City Corporation"
                  value={administrativeUnit}
                  onChange={(e) => setAdministrativeUnit(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">Start Time</label>
                  <input 
                    type="datetime-local"
                    required
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">End Time</label>
                  <input 
                    type="datetime-local"
                    required
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs py-2.5 rounded-lg font-bold transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2.5 rounded-lg font-bold transition shadow-sm"
                >
                  {submitting ? 'Registering on Chain...' : 'Publish Scheduled Block'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* EDIT ELECTION MODAL */}
      {isEditModalOpen && editingElection && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Edit Election Parameters (ID #{editingElection.id})</h3>
              <button 
                onClick={() => { setIsEditModalOpen(false); setEditingElection(null); }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateElection} className="p-6 space-y-4 overflow-y-auto">
              
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">Election Title</label>
                <input 
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">Description Summary</label>
                <textarea 
                  required
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">Election Type</label>
                  <select
                    value={editElectionType}
                    onChange={(e) => setEditElectionType(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                  >
                    <option value="NATIONAL">National Assembly</option>
                    <option value="LOCAL">Local Municipal election</option>
                    <option value="PRESIDENTIAL">Presidential ballot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">Constituency Scope</label>
                  <input 
                    type="text"
                    required
                    value={editConstituencyScope}
                    onChange={(e) => setEditConstituencyScope(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">Administrative Unit</label>
                <input 
                  type="text"
                  required
                  value={editAdministrativeUnit}
                  onChange={(e) => setEditAdministrativeUnit(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">Start Time</label>
                  <input 
                    type="datetime-local"
                    required
                    value={editStartAt}
                    onChange={(e) => setEditStartAt(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">End Time</label>
                  <input 
                    type="datetime-local"
                    required
                    value={editEndAt}
                    onChange={(e) => setEditEndAt(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button 
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingElection(null); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs py-2.5 rounded-lg font-bold transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2.5 rounded-lg font-bold transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Updating Node Record...' : 'Save Parameters'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
