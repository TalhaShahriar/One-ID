import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  MapPin, 
  BookOpen, 
  Check, 
  X, 
  User, 
  Clock, 
  Info, 
  Award, 
  Briefcase, 
  FileSignature 
} from 'lucide-react';
import api from '../../lib/api.js';
import { toast } from 'sonner';

/**
 * Admin Candidate Review and Verification Hub.
 * Renders all candidate filings with status=PENDING in a structured grid or table.
 * Opens side-drawers for comprehensive biodata verification and handles approvals or rejection notices.
 */
export default function CandidateReview() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actingClass, setActingClass] = useState(false);

  const fetchPending = async () => {
    try {
      const res = await api.get('/candidates/pending');
      setCandidates(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to locate pending files from distributed database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id) => {
    if (!id) return;
    setActingClass(true);
    try {
      await api.patch(`/candidates/${id}/approve`);
      toast.success('Applicant successfully verified and approved as Candidate!');
      setSelectedCandidate(null);
      fetchPending();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Verification action failed.');
    } finally {
      setActingClass(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!selectedCandidate || !rejectionReason.trim()) {
      toast.error('A clear rejection justification explanation is mandatory.');
      return;
    }

    setActingClass(true);
    try {
      await api.patch(`/candidates/${selectedCandidate.id}/reject`, {
        reason: rejectionReason
      });
      toast.success('Filing officially rejected and candidate updated.');
      setShowRejectModal(false);
      setSelectedCandidate(null);
      setRejectionReason('');
      fetchPending();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Rejection action failed.');
    } finally {
      setActingClass(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8 font-sans">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          Candidacy Verification Panel
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Verify political affiliations, age limits, academic records, and manifestos prior to ballot publishing.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl">
          <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent animate-spin rounded-full mb-3"></div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">Loading Applications...</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="border border-dashed border-slate-200 bg-white p-12 text-center rounded-2xl">
          <Check className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Perfect Status Reached</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">There are no pending applications awaiting security clearance.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main applications table */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Nominee details</th>
                  <th className="px-6 py-4">Election Target</th>
                  <th className="px-6 py-4">Ward Constituency</th>
                  <th className="px-6 py-4">Filing Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {candidates.map((cand) => (
                  <tr 
                    key={cand.id}
                    onClick={() => {
                      setSelectedCandidate(cand);
                      setRejectionReason('');
                    }}
                    className={`hover:bg-slate-50/80 cursor-pointer transition ${
                      selectedCandidate?.id === cand.id ? 'bg-emerald-50/30' : ''
                    }`}
                  >
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img 
                        src={cand.photo_url} 
                        alt={cand.user.name} 
                        referrerPolicy="no-referrer"
                        className="h-10 w-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shadow-sm shrink-0"
                      />
                      <div>
                        <div className="font-bold text-slate-800">{cand.user.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] uppercase font-mono">{cand.party.abbreviation}</span>
                          <span>•</span>
                          <span className="truncate max-w-[120px]">{cand.user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-700">{cand.election.title}</div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mt-0.5">{cand.election.election_type}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-600 text-xs">
                      {cand.constituency}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                      {new Date(cand.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SIDE DETAILS DRAWER */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            {selectedCandidate ? (
              <div className="space-y-6">
                
                {/* Drawer Profile Brief */}
                <div className="text-center pb-4 border-b border-slate-100">
                  <img 
                    src={selectedCandidate.photo_url} 
                    alt={selectedCandidate.user.name} 
                    referrerPolicy="no-referrer"
                    className="h-24 w-24 rounded-2xl object-cover bg-slate-100 border border-slate-200 mx-auto shadow-md mb-3"
                  />
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">{selectedCandidate.user.name}</h3>
                  <p className="text-xs text-[#006a4e] font-bold uppercase tracking-wider mt-1">{selectedCandidate.party.name} Nominee</p>
                </div>

                {/* Core Parameters */}
                <div className="space-y-4">
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Constituency</p>
                      <p className="text-xs font-bold text-slate-700 font-mono mt-0.5">{selectedCandidate.constituency}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth (Age Verification)</p>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">
                        {new Date(selectedCandidate.date_of_birth).toLocaleDateString()} ({new Date().getFullYear() - new Date(selectedCandidate.date_of_birth).getFullYear()} Years old)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <BookOpen className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Education Level</p>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5">{selectedCandidate.education}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Briefcase className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Occupation</p>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5">{selectedCandidate.occupation}</p>
                    </div>
                  </div>

                </div>

                {/* Manifesto Text */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-1.5">
                  <div className="text-slate-700 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 mb-1">
                    <FileSignature className="h-3.5 w-3.5" /> Manifesto Pledges
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{selectedCandidate.manifesto}"
                  </p>
                </div>

                {/* Action Controls */}
                <div className="flex gap-2.5 pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => setShowRejectModal(true)}
                    disabled={actingClass}
                    className="flex-1 py-3 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 shadow-sm"
                  >
                    <X className="h-4 w-4" /> Decline Papers
                  </button>
                  <button 
                    onClick={() => handleApprove(selectedCandidate.id)}
                    disabled={actingClass}
                    className="flex-1 py-3 bg-[#006a4e] hover:bg-[#00523a] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Check className="h-4 w-4" /> Grant Approval
                  </button>
                </div>

              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Info className="h-8 w-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">Select an applicant nomination row to inspect their full credentials list.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* REJECT DIALOG MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <X className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Reject Candidate Profile</h3>
                <p className="text-xs text-slate-500 mt-1">Specify detailed statutory reason(s) for rejecting the candidate's papers.</p>
              </div>
            </div>

            <form onSubmit={handleReject} className="space-y-4 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Commission's ReasonNote</label>
                <textarea 
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Failure to comply with mandatory minimum age criterion (25) or pending verification of asset disclosures."
                  className="w-full bg-white border border-slate-300 text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-semibold text-slate-800 leading-relaxed"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs rounded-lg text-slate-600 font-bold transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={actingClass}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-xs rounded-lg text-white font-bold transition shadow-sm"
                >
                  {actingClass ? 'Rejecting...' : 'Reject Application'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
