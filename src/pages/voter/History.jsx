import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  History as HistoryIcon, 
  ShieldAlert, 
  CheckCircle, 
  Lock, 
  Calendar, 
  Search,
  MapPin
} from 'lucide-react';
import api from '../../lib/api.js';

export default function History() {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    try {
      const response = await api.get('/votes/history');
      setHistoryList(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching voting history:', err);
      setError('Failed to load your ledger participation logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-50 border-emerald-150 text-[#006a4e]';
      case 'CLOSED':
      case 'RESULTS_PUBLISHED':
        return 'bg-slate-100 border-slate-200 text-slate-600';
      default:
        return 'bg-indigo-50 border-indigo-150 text-indigo-600';
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 font-sans space-y-8">
      
      {/* 1. HEADER BANNER */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <HistoryIcon className="h-7 w-7 text-[#006a4e]" /> My Voting History
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl font-medium leading-relaxed">
            Verify list of elections you participated in. To ensure ballot anonymity, candidate choices are NEVER logged alongside user credentials.
          </p>
        </div>
      </div>

      {/* 2. GUARANTEE PRIVACY ALERTBOX */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex gap-3.5 items-start text-amber-900"
      >
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-left space-y-1">
          <h4 className="text-xs font-black uppercase tracking-tight text-slate-800">Ballot Secrecy Guarantee</h4>
          <p className="text-xs text-slate-600 leading-relaxed font-semibold">
            Your vote choices are never stored against your name — ballot secrecy is guaranteed. Only the transaction logging completion sequence is audited here to secure validation and prevent duplicate casting loops.
          </p>
        </div>
      </motion.div>

      {/* 3. HISTORY HISTORY DATA TABLE */}
      {loading ? (
        <div className="flex justify-center items-center py-20 font-sans">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#006a4e]" />
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-bold font-mono">
          {error}
        </div>
      ) : historyList.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm max-w-lg mx-auto"
        >
          <div className="h-12 w-12 rounded-full border border-slate-150 bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Calendar className="h-5 w-5" />
          </div>
          <h4 className="text-base font-black text-slate-700">No Cast Logs Found</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            You have not cast any blockchain-coupled ballots in OneID yet.
          </p>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-6 py-4">Sovereign Election Title</th>
                  <th className="px-6 py-4">Cast Audit Timestamp</th>
                  <th className="px-6 py-4">Poll Status</th>
                  <th className="px-6 py-4 text-right">Receipt status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                {historyList.map((item, index) => (
                  <tr 
                    key={`${item.election_id}-${index}`}
                    className="hover:bg-slate-50/60 transition"
                  >
                    {/* ELECTION TITLE */}
                    <td className="px-6 py-4 font-bold text-slate-800 uppercase tracking-tight">
                      {item.election?.title}
                    </td>

                    {/* CAST TIMESTAMP */}
                    <td className="px-6 py-4 font-mono font-bold text-slate-500">
                      {item.voted_at 
                        ? new Date(item.voted_at).toLocaleString() 
                        : 'Unmarked'
                      }
                    </td>

                    {/* ELECTION STATUS BADGE */}
                    <td className="px-6 py-4">
                      <span className={`inline-block border px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide ${
                        getStatusStyle(item.election?.status)
                      }`}>
                        {item.election?.status}
                      </span>
                    </td>

                    {/* SEALED CONFIRMATION CHECK */}
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#006a4e] font-extrabold uppercase font-mono">
                        <CheckCircle className="h-4 w-4" /> LEDGER SEALED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

    </div>
  );
}
