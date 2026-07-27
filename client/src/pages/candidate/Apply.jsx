import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  Award, 
  MapPin, 
  CheckCircle2, 
  Briefcase, 
  Vote, 
  Flag 
} from 'lucide-react';
import api from '../../lib/api.js';
import { toast } from 'sonner';

/**
 * Candidate Candidacy Papers Application Wizard.
 * Features a step-by-step layout for registering a candidate:
 * 1. Target Election selection
 * 2. Political Party selection
 * 3. Biodata (Constituency, Photo-URL, Education level, DOB, Manifesto)
 */
export default function CandidateApply() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [elections, setElections] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [electionId, setElectionId] = useState('');
  const [partyId, setPartyId] = useState('');
  const [constituency, setConstituency] = useState('');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60');
  const [dob, setDob] = useState('');
  const [education, setEducation] = useState('Bachelor');
  const [occupation, setOccupation] = useState('');
  const [manifesto, setManifesto] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadFilingContext() {
      try {
        const [electionsRes, partiesRes] = await Promise.all([
          api.get('/elections'),
          api.get('/candidates/parties')
        ]);
        
        // Filter out elections allowing filings (scheduled only)
        const scheduledOnly = electionsRes.data.filter(el => el.status === 'SCHEDULED');
        setElections(scheduledOnly);
        setParties(partiesRes.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load application system configs.');
      } finally {
        setLoading(false);
      }
    }
    loadFilingContext();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!electionId || !partyId || !constituency || !photoUrl || !dob || !education || !occupation || !manifesto) {
      toast.error('All profile parameter sections must be complete.');
      return;
    }

    if (manifesto.length > 500) {
      toast.error('Your manifesto exceeds the strict 500 character limits.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/candidates/apply', {
        election_id: electionId,
        party_id: partyId,
        constituency,
        photo_url: photoUrl,
        date_of_birth: dob,
        education,
        occupation,
        manifesto
      });
      
      toast.success('Application submitted successfully!');
      navigate('/candidate/dashboard');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 min-h-[50vh]">
        <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent animate-spin rounded-full mb-3"></div>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">Initializing System Gates...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 font-sans">
      
      {/* Box Envelope */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-8">
        
        {/* Header summary */}
        <div className="text-center space-y-2 border-b border-slate-100 pb-6">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-2">
            Submit Nomination Papers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Step-by-step registry portal to apply for candidacy status.
          </p>
        </div>

        {/* Wizard step Indicator circles */}
        <div className="flex items-center justify-center gap-12 text-sm">
          <div className="flex items-center gap-2">
            <span className={`h-8 w-8 flex items-center justify-center rounded-full text-xs font-bold transition-colors ${
              step >= 1 ? 'bg-[#006a4e] text-white' : 'bg-slate-100 text-slate-400'
            }`}>1</span>
            <span className={`font-semibold hidden sm:inline ${step === 1 ? 'text-slate-800' : 'text-slate-400'}`}>Election</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-8 w-8 flex items-center justify-center rounded-full text-xs font-bold transition-colors ${
              step >= 2 ? 'bg-[#006a4e] text-white' : 'bg-slate-100 text-slate-400'
            }`}>2</span>
            <span className={`font-semibold hidden sm:inline ${step === 2 ? 'text-slate-800' : 'text-slate-400'}`}>Party</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-8 w-8 flex items-center justify-center rounded-full text-xs font-bold transition-colors ${
              step >= 3 ? 'bg-[#006a4e] text-white' : 'bg-slate-100 text-slate-400'
            }`}>3</span>
            <span className={`font-semibold hidden sm:inline ${step === 3 ? 'text-slate-800' : 'text-slate-400'}`}>Biodata</span>
          </div>
        </div>

        {/* STEP 1: ELECTION DETAILS */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2.5">Select Election Segment</label>
              <select
                value={electionId}
                onChange={(e) => setElectionId(e.target.value)}
                className="w-full bg-white border border-slate-300 text-sm px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
              >
                <option value="">-- Choose target election cycle --</option>
                {elections.map((el) => (
                  <option key={el.id} value={el.id}>{el.title} ({el.constituency_scope})</option>
                ))}
              </select>
            </div>

            {elections.length === 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 text-xs text-amber-700 rounded-xl leading-relaxed font-semibold">
                ⚠️ Notice: There are currently no upcoming SCHEDULED elections accepting new candidacy applications at this node.
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="button"
                disabled={!electionId}
                onClick={() => setStep(2)}
                className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold px-5 py-3 rounded-lg flex items-center gap-1.5 transition"
              >
                Next Step <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PARTY SELECTION */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2.5">Political Party Affiliate</label>
              <div className="grid grid-cols-1 gap-3.5">
                {parties.map((part) => {
                  const active = partyId === part.id.toString();
                  return (
                    <div
                      key={part.id}
                      onClick={() => setPartyId(part.id.toString())}
                      className={`border rounded-xl p-4 flex items-center justify-between cursor-pointer transition ${
                        active 
                          ? 'border-[#006a4e] bg-emerald-50/10 ring-1 ring-[#006a4e]' 
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={part.symbol_url} 
                          alt={part.name} 
                          referrerPolicy="no-referrer"
                          className="h-10 w-10 object-contain rounded-md bg-white p-1 border border-slate-100"
                        />
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{part.name}</p>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">{part.abbreviation}</p>
                        </div>
                      </div>
                      
                      <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                        active ? 'border-[#006a4e] bg-[#006a4e] text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {active && <CheckCircle2 className="h-4 w-4 text-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold px-5 py-3 rounded-lg flex items-center gap-1.5 transition"
              >
                <ChevronLeft className="h-4 w-4" /> Prev Step
              </button>
              <button
                type="button"
                disabled={!partyId}
                onClick={() => setStep(3)}
                className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold px-5 py-3 rounded-lg flex items-center gap-1.5 transition"
              >
                Next Step <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: BIODATA & SUBMIT */}
        {step === 3 && (
          <form onSubmit={handleApply} className="space-y-5">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-1.5">Constituency Scope</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Dhaka-1"
                  value={constituency}
                  onChange={(e) => setConstituency(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-1.5">Date of Birth</label>
                <input 
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-1.5">Education Credentials</label>
                <select
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                >
                  <option value="SSC">Secondary High School (SSC)</option>
                  <option value="HSC">Higher Secondary School (HSC)</option>
                  <option value="Bachelor">Bachelor Degree</option>
                  <option value="Master">Master Degree</option>
                  <option value="PhD">Doctor of Philosophy (PhD)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-1.5">Current Occupation</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. High Court Advocate, Civil Engineer"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-1.5">Nominee photo URL</label>
              <input 
                type="url"
                required
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full bg-white border border-slate-300 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800 font-mono"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider">Candidate Manifesto</label>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  manifesto.length > 500 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {manifesto.length}/500 Characters
                </span>
              </div>
              <textarea 
                required
                rows={4}
                maxLength={500}
                placeholder="Commitments to infrastructure, community safety, utilities, etc..."
                value={manifesto}
                onChange={(e) => setManifesto(e.target.value)}
                className="w-full bg-white border border-slate-300 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-800 leading-relaxed"
              />
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold px-5 py-3 rounded-lg flex items-center gap-1.5 transition"
              >
                <ChevronLeft className="h-4 w-4" /> Prev Step
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-3 rounded-lg flex items-center gap-1.5 transition shadow-sm"
              >
                {submitting ? 'Lodging on Node...' : 'Publish Nomination Papers'}
              </button>
            </div>

          </form>
        )}

      </div>

    </div>
  );
}
