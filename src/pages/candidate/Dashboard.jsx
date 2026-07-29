import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History, 
  Clock, 
  CheckCircle, 
  XOctagon, 
  Award, 
  AlertCircle, 
  Calendar, 
  User, 
  ChevronRight, 
  Plus,
  Compass
} from 'lucide-react';
import api from '../../lib/api.js';
import { toast } from 'sonner';
import VotingCountdown from '../../shared/components/VotingCountdown.jsx';

/**
 * Candidate Profile Tracker Dashboard.
 * Fetches applications belonging to the current candidate session.
 * Visualizes status, election timelines, and any administrative feedbacks.
 */
export default function CandidateDashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/candidates/my-applications');
      setApplications(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to restore candidate profile logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Helper formatting application statuses
  const renderStatusCard = (app) => {
    switch (app.status) {
      case 'APPROVED':
        return (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <h4 className="text-sm font-bold text-emerald-800">Candidacy Approved</h4>
              <p className="text-xs text-emerald-600 mt-1 leading-relaxed">
                Your papers have been approved by the Election Secretariat. You are officially registered of the ballot roster!
              </p>
            </div>
          </div>
        );
      case 'REJECTED':
        return (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <XOctagon className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-800">Candidacy Declined</h4>
              <p className="text-xs text-red-600 mt-1 font-bold leading-relaxed">
                Reason: {app.rejection_reason || 'Failure to comply with verification criteria.'}
              </p>
            </div>
          </div>
        );
      case 'PENDING':
      default:
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-800">Under Review</h4>
              <p className="text-xs text-amber-600 mt-1 leading-relaxed">
                Our verification nodes are validating your assets disclosure, papers, and qualifications.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8 font-sans">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Nominee Workspace Terminal
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Monitor registration papers status, election deadlines, and submit new ballot filings.
          </p>
        </div>
        <button
          onClick={() => navigate('/candidate/apply')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-3 rounded-lg flex items-center gap-2 transition shadow-sm"
        >
          <Plus className="h-4 w-4" /> File New Candidacy
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl">
          <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent animate-spin rounded-full mb-3"></div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">Restoring Records...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="border border-dashed border-slate-200 bg-white p-12 text-center rounded-2xl max-w-md mx-auto space-y-3">
          <Compass className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No Applications Filed</h3>
          <p className="text-xs text-slate-400 font-medium">You haven't submitted candidacy papers for any active or upcoming election cycles yet.</p>
          <button
            onClick={() => navigate('/candidate/apply')}
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition inline-block mt-2"
          >
            File Nomination Papers Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {applications.map((app) => (
            <div 
              key={app.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between hover:shadow transition"
            >
              
              {/* Top Meta info */}
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-black text-slate-800 text-base leading-snug">{app.election.title}</h3>
                    <p className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Filed on {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <img 
                    src={app.photo_url} 
                    alt="Nominee Profile" 
                    referrerPolicy="no-referrer"
                    className="h-12 w-12 rounded-lg object-cover bg-slate-50 border border-slate-100 shadow-sm shrink-0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-b border-sky-50 bg-slate-50/50 p-3 rounded-lg text-xs">
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Party Ballot</span>
                    <span className="font-bold text-slate-700">{app.party.name} ({app.party.abbreviation})</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Constituency</span>
                    <span className="font-bold text-slate-700 font-mono">{app.constituency}</span>
                  </div>
                </div>

                {renderStatusCard(app)}
              </div>

              {/* Action details if approved */}
              {app.status === 'APPROVED' && (
                <div className="pt-2">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Assembly Status:</span>
                    <div className="flex items-center gap-2">
                      <span className="bg-sky-50 border border-sky-100 text-sky-600 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider text-[10px]">
                        {app.election.status}
                      </span>
                      <VotingCountdown 
                        startAt={app.election.start_at} 
                        endAt={app.election.end_at} 
                        status={app.election.status} 
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>
          ))}

        </div>
      )}

    </div>
  );
}
