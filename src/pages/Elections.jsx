import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion } from 'motion/react';
import { Calendar, Vote, Clock, AlertCircle, ShieldCheck, ArrowRight, MapPin, UserPlus } from 'lucide-react';
import api from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import LiveBDClock from '../shared/components/LiveBDClock.jsx';
import VotingCountdown from '../shared/components/VotingCountdown.jsx';

export default function Elections() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(Date.now());

  const fetchElections = async () => {
    try {
      const response = await api.get('/elections');
      setElections(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching elections:', err);
      setError('Failed to fetch scheduled active elections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElections();

    // Setup live interval clock for countdown timers
    const timer = setInterval(() => {
      setTick(Date.now());
    }, 1000);

    // Setup live socket connection for state changes
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('election:status_changed', (data) => {
      console.log('📡 Election state sync event received:', data);
      fetchElections();
    });

    return () => {
      clearInterval(timer);
      socket.disconnect();
    };
  }, []);

  const getRemainingTime = (endAtStr) => {
    const diff = new Date(endAtStr).getTime() - tick;
    if (diff <= 0) return 'Closed';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 font-sans">
      
      {/* HEADER SECTION */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="bg-emerald-50 border border-emerald-150 text-[#006a4e] px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 mb-2 shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5" /> Ballot Registry active
          </span>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Active Voting Booths</h2>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
            <MapPin className="h-4 w-4 text-slate-400" /> Active constituency portal: 
            <strong className="text-slate-700 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-150">
              {user?.constituency}
            </strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <LiveBDClock variant="light-badge" />
          <button
            onClick={() => navigate('/candidate/apply')}
            className="px-4 py-2.5 bg-[#006a4e] hover:bg-[#00523c] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer border border-[#00523c]"
          >
            <UserPlus className="h-4 w-4" /> Apply as Candidate
          </button>
        </div>
      </div>

      {/* ERROR HANDLER */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-sm font-medium mb-6">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* CONTENT REGION */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#006a4e]" />
        </div>
      ) : elections.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 max-w-xl mx-auto shadow-sm"
        >
          <div className="h-14 w-14 bg-slate-50 text-slate-400 border border-slate-150 rounded-full flex items-center justify-center mx-auto mb-4">
            <Vote className="h-7 w-7" />
          </div>
          <h4 className="text-lg font-black text-slate-800">No active elections found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            There are currently no active election sessions matching your constituency. Live updates are pushed to your secure terminal as scheduled.
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {elections.map((election) => {
            const timeRemaining = getRemainingTime(election.end_at);
            const isClosed = timeRemaining === 'Closed';

            return (
              <motion.div
                key={election.id}
                id={`election-card-${election.id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition-all duration-300"
              >
                <div>
                  {/* BADGES */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-mono tracking-wide uppercase font-bold">
                      ID: {election.id}
                    </span>
                    <span className="bg-indigo-50 border border-indigo-150 text-indigo-600 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
                      {election.election_type}
                    </span>
                  </div>

                  {/* TITLE & DESCRIPTION */}
                  <h3 className="text-base font-black text-slate-800 tracking-tight line-clamp-1 mb-1.5 uppercase">
                    {election.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                    {election.description}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  {/* CLOCK / SCHEDULERS */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Voting Schedule:
                    </span>
                    <VotingCountdown 
                      startAt={election.start_at} 
                      endAt={election.end_at} 
                      status={election.status} 
                    />
                  </div>

                  {/* ACTION TRIGGER BUTTON */}
                  {isClosed || election.status === 'CLOSED' || election.status === 'RESULTS_PUBLISHED' ? (
                    <button
                      id={`view-results-btn-${election.id}`}
                      onClick={() => navigate(`/elections/${election.id}/results`)}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-1.5 hover:gap-2 group cursor-pointer"
                    >
                      View Results Summary <ArrowRight className="h-4 w-4 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ) : (
                    <button
                      id={`cast-vote-btn-${election.id}`}
                      onClick={() => navigate(`/elections/${election.id}/vote`)}
                      disabled={isClosed}
                      className="w-full bg-[#006a4e] hover:bg-[#004e38] text-white py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-1.5 hover:gap-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent disabled:cursor-not-allowed group cursor-pointer"
                    >
                      Cast My Vote <ArrowRight className="h-4 w-4 text-emerald-100 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
