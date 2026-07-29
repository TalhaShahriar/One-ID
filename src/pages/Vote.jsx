import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Flag, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  UserCheck2, 
  ArrowLeft, 
  FileText,
  Lock
} from 'lucide-react';
import api from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { toast } from 'sonner';
import VotingCountdown from '../shared/components/VotingCountdown.jsx';

export default function Vote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchElectionDetails = async () => {
    try {
      const response = await api.get(`/elections/${id}`);
      setElection(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching election details:', err);
      const resData = err.response?.data;
      setError(resData?.error || 'Failed to fetch candidate rosters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElectionDetails();
  }, [id]);

  const handleCastVote = async () => {
    if (!selectedCandidate) return;
    setIsSubmitting(true);
    try {
      const response = await api.post('/votes/cast', {
        election_id: id,
        candidate_id: selectedCandidate.id,
      });

      toast.success('Ballot ledgered successfully!');
      setIsConfirming(false);

      // Navigate to success receipt view passing receipt statistics
      navigate('/vote/success', {
        state: {
          receiptToken: response.data.receiptToken,
          qrCodeDataUrl: response.data.qrCodeDataUrl,
          castAt: response.data.castAt,
          electionTitle: election?.title,
          candidateName: selectedCandidate.user.name,
          partyAbbreviation: selectedCandidate.party?.abbreviation
        }
      });
    } catch (err) {
      console.error('Core casting failure:', err);
      const errMsg = err.response?.data?.error || 'A blockchain execution fault occurred.';
      toast.error(errMsg);
      setIsConfirming(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32 font-sans">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#006a4e]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-16 text-center font-sans">
        <div className="h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-black text-slate-800">Casting Access Suspended</h3>
        <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
          {error}
        </p>
        <Link 
          to="/elections" 
          className="inline-block mt-6 text-xs font-bold bg-slate-800 text-white rounded-lg px-4 py-2 hover:bg-slate-900 transition shadow-sm"
        >
          Return to Registry
        </Link>
      </div>
    );
  }

  const approvedCandidates = election?.candidates || [];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 font-sans">
      
      {/* NAVIGATION OUTLET */}
      <Link 
        to="/elections" 
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-6 group transition"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Live Booths
      </Link>

      {/* ELECTION CARD BIO */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 sm:p-8 rounded-3xl mb-8 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 text-slate-700/20 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <Vote className="h-48 w-48 stroke-[1.5]" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="bg-emerald-500 text-slate-950 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
              {election?.status}
            </span>
            <span className="bg-white/10 text-slate-200 border border-white/20 px-2.5 py-0.5 rounded-md text-[10px] font-bold font-mono">
              {election?.election_type}
            </span>
            {election && (
              <VotingCountdown 
                startAt={election.start_at} 
                endAt={election.end_at} 
                status={election.status} 
              />
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight uppercase">
            {election?.title}
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
            {election?.description}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono font-bold bg-emerald-950/40 border border-emerald-900/30 px-3 py-1.5 rounded-xl w-fit">
            <MapPin className="h-3.5 w-3.5" /> Enforced Constituency Limit: {user?.constituency}
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-4">
        <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-2">
          <UserCheck2 className="h-5 w-5 text-[#006a4e]" /> Candidates running in: {user?.constituency}
        </h3>
        <p className="text-xs text-slate-400 max-w-xl pr-4">
          Select exactly one candidate card matching your political alignment choice. Active votes are fully decoupled from voter identifiers in database records using zero-knowledge receipts.
        </p>
      </div>

       {/* CANDIDATE MATRIX LISTING */}
      {approvedCandidates.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-250 rounded-2xl px-4">
          <User className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">No Candidates Filed</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 mb-4">
            There are no candidate nomination applications approved inside this constituency.
          </p>

        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {approvedCandidates.map((cand) => {
            const isSelected = selectedCandidate?.id === cand.id;

            return (
              <div
                key={cand.id}
                id={`candidate-option-${cand.id}`}
                onClick={() => setSelectedCandidate(cand)}
                className={`bg-white border rounded-2xl p-5 hover:shadow transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected 
                    ? 'ring-2 ring-[#006a4e] border-transparent bg-emerald-50/10' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex gap-4 items-start mb-4">
                    {/* PHOTO OUTLET OR FALLBACK */}
                    <div className="h-14 w-14 rounded-xl bg-slate-150 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {cand.photo_url ? (
                        <img 
                          src={cand.photo_url} 
                          alt={cand.user?.name} 
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '';
                          }}
                        />
                      ) : (
                        <User className="h-6 w-6 text-slate-400" />
                      )}
                    </div>

                    <div className="space-y-0.5 text-left">
                      <h4 className="text-sm font-black text-slate-800">{cand.user?.name}</h4>
                      <p className="text-[11px] font-bold text-[#006a4e] flex items-center gap-1 uppercase">
                        <Flag className="h-3 w-3" /> {cand.party?.name} ({cand.party?.abbreviation})
                      </p>
                      <span className="inline-block bg-slate-100 border border-slate-200/60 text-slate-600 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase mt-1">
                        Constituency: {cand.constituency}
                      </span>
                    </div>
                  </div>

                  {/* MANIFESTO SECTION */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1.5 text-left mb-4">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Nomination Manifesto Excerpt:
                    </span>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-medium italic">
                      "{cand.manifesto || 'No manifesto summary attached.'}"
                    </p>
                  </div>
                </div>

                {/* SELECTOR RADIAL BLOCK */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-[10px] text-slate-400 font-medium">Click card to select Candidate</span>
                  <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected ? 'border-[#006a4e] bg-[#006a4e]' : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FOOTER ACTIONS BAR */}
      <div className="mt-12 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="text-left">
          <h4 className="text-sm font-black text-slate-800">Ready to Lock Your Ballot?</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            {selectedCandidate 
              ? `You have chosen: ${selectedCandidate.user?.name} (${selectedCandidate.party?.abbreviation})`
              : 'Select exactly one candidate from the list above to proceed.'
            }
          </p>
        </div>

        <button
          id="confirm-ballot-trigger"
          disabled={!selectedCandidate}
          onClick={() => setIsConfirming(true)}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-6 py-3 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Lock className="h-3.5 w-3.5" /> Confirm Vote Selection
        </button>
      </div>

      {/* ABSOLUTE MODAL CONFIRMATION DIALOGUE (No iframe blocking issues) */}
      <AnimatePresence>
        {isConfirming && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 text-center space-y-4"
            >
              <div className="mx-auto h-12 w-12 bg-amber-50 text-amber-600 rounded-full border border-amber-150 flex items-center justify-center shadow-inner">
                <AlertTriangle className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-800">Seal Permanent Ballot?</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  You are about to vote for <span className="text-indigo-600 font-bold">{selectedCandidate?.user?.name}</span> representing <span className="text-[#006a4e] font-bold">{selectedCandidate?.party?.name} ({selectedCandidate?.party?.abbreviation})</span>. This action is permanent and cannot be undone.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-left">
                <ul className="text-[10px] text-slate-500 space-y-1.5 leading-relaxed font-mono">
                  <li className="flex gap-1.5 items-start">
                    ✓ Verified cryptographic hash sequence coupled.
                  </li>
                  <li className="flex gap-1.5 items-start">
                    ✓ Zero identity records mapped to the block ballot.
                  </li>
                </ul>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  id="cancel-modal-btn"
                  onClick={() => setIsConfirming(false)}
                  disabled={isSubmitting}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  id="confirm-modal-btn"
                  onClick={handleCastVote}
                  disabled={isSubmitting}
                  className="bg-[#006a4e] hover:bg-[#004e38] text-white text-xs font-bold px-5 py-2.5 rounded-lg transition flex items-center gap-1 disabled:opacity-50"
                >
                  {isSubmitting ? 'Sealing ballot...' : 'Yes, Cast My Vote'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
