import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Calendar, 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Globe, 
  FileText, 
  RefreshCw, 
  AlertTriangle, 
  Clock, 
  Database,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api.js';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [eventType, setEventType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // client-side search across user/email/desc

  // Stats summary state
  const [stats, setStats] = useState({
    total_logs: 0,
    today_logs: 0,
    anomaly_count_today: 0,
    events_by_type: {}
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        event_type: eventType || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined
      };

      const res = await api.get('/audit/logs', { params });
      // API returns: { logs, total, page, limit, pages }
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      toast.error('Failed to load system audit trails.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/audit/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching audit stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, eventType, dateFrom, dateTo]);

  useEffect(() => {
    fetchStats();
  }, [logs]);

  // Handle client-side search matching user, email or description
  const filteredLogs = logs.filter(log => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;
    
    const userName = log.user?.name?.toLowerCase() || '';
    const userEmail = log.user?.email?.toLowerCase() || '';
    const description = log.description?.toLowerCase() || '';
    const ip = log.ip_address?.toLowerCase() || '';
    const type = log.event_type?.toLowerCase() || '';
    
    return userName.includes(query) || 
           userEmail.includes(query) || 
           description.includes(query) || 
           ip.includes(query) ||
           type.includes(query);
  });

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('No log records available to export.');
      return;
    }

    const headers = ['Timestamp', 'Event Type', 'Description', 'IP Address', 'User Operator', 'User Email', 'Security Clearance', 'Associated Election'];
    const rows = filteredLogs.map(log => [
      new Date(log.created_at).toISOString(),
      log.event_type || 'N/A',
      `"${(log.description || '').replace(/"/g, '""')}"`,
      log.ip_address || 'N/A',
      log.user ? log.user.name : 'OneID Kernel-Unit',
      log.user ? log.user.email : 'system@oneid.gov.bd',
      log.user ? log.user.role : 'KERNEL_OR_ANONYMOUS',
      log.election ? log.election.title : 'None/Global Context'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `oneid_security_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Security logs exported successfully as decrypted CSV table.');
  };

  // Get color configurations for audit badges
  const getBadgeStyle = (type) => {
    const t = type?.toUpperCase() || '';
    if (t.includes('TAMPER') || t.includes('CRITICAL')) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (t.includes('ANOMALY') || t.includes('FAIL')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (t.includes('VERIFIED') || t.includes('SUCCESS') || t.includes('VOTE')) {
      return 'bg-[#006a4e]/10 text-[#006a4e] border-[#006a4e]/30';
    }
    if (t.includes('OPENED') || t.includes('CLOSED')) {
      return 'bg-blue-50 text-blue-800 border-blue-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div id="audit-logs-viewport" className="max-w-7xl mx-auto space-y-8">
        
        {/* Title Block */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <ShieldCheck className="h-9 w-9 text-[#006a4e] shrink-0" />
              Sovereign Security Audit System
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Immutable ledger operations trail and security verification logs for Bangladesh Election Portal.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { fetchLogs(); fetchStats(); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs font-mono uppercase rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" /> Reset / Refresh
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#006a4e] text-white font-bold text-xs font-mono uppercase rounded-xl hover:bg-[#00523c] transition shadow-sm cursor-pointer"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Dynamic Security Telemetry Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="h-1 bg-slate-300 absolute top-0 left-0 right-0" />
            <div className="text-xs font-black uppercase text-slate-400 font-mono tracking-wider">Total Audit Records</div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {statsLoading ? '...' : stats.total_logs}
              </span>
              <span className="text-xs text-slate-400 font-medium">events recorded</span>
            </div>
          </div>

          <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="h-1 bg-green-500 absolute top-0 left-0 right-0" />
            <div className="text-xs font-black uppercase text-green-600 font-mono tracking-wider">Hourly Activities (Today)</div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {statsLoading ? '...' : stats.today_logs}
              </span>
              <span className="text-xs text-slate-400 font-medium">events today</span>
            </div>
          </div>

          <div className="bg-[#006a4e]/5 border border-[#006a4e]/20 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="h-1 bg-[#006a4e] absolute top-0 left-0 right-0" />
            <div className="text-xs font-black uppercase text-[#006a4e] font-mono tracking-wider">Ledger Verifications</div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#006a4e] font-mono">
                {statsLoading ? '...' : (stats.events_by_type?.BLOCKCHAIN_VERIFIED || 0) + (stats.events_by_type?.BLOCKCHAIN_VERIFICATION_MANUAL || 0) + (stats.events_by_type?.BLOCKCHAIN_VERIFICATION || 0)}
              </span>
              <span className="text-xs text-slate-500 font-medium">cyber audits run</span>
            </div>
          </div>

          <div className="bg-red-50 border border-red-150 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="h-1 bg-red-500 absolute top-0 left-0 right-0" />
            <div className="text-xs font-black uppercase text-red-700 font-mono tracking-wider">Anomalies Detected Today</div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-black text-red-700 font-mono">
                {statsLoading ? '...' : stats.anomaly_count_today}
              </span>
              <span className="text-xs text-red-500 font-medium">flagged today</span>
            </div>
          </div>
        </div>

        {/* Filtering & Live Searching Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-700 font-black text-xs font-mono uppercase border-b border-slate-100 pb-3">
            <Filter className="h-4 w-4 text-[#006a4e]" />
            Control Registry Filters
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Event Type */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black font-mono text-slate-400">Classify Event</label>
              <select
                value={eventType}
                onChange={(e) => { setEventType(e.target.value); setPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-750 focus:outline-none focus:border-[#006a4e] transition"
              >
                <option value="">All Action Types</option>
                <option value="LOGIN_SUCCESS">Login Success</option>
                <option value="LOGIN_MFA_CHALLENGE">Login MFA Challenge</option>
                <option value="VOTE_CAST">Ballot Cast</option>
                <option value="BLOCKCHAIN_VERIFICATION_MANUAL">Manual Verification</option>
                <option value="BLOCKCHAIN_VERIFIED">Automated Trace</option>
                <option value="ELECTION_OPENED">Election Opened</option>
                <option value="ELECTION_CLOSED">Election Closed</option>
                <option value="SECURITY_ANOMALY_RESOLVED">Anomaly Resolved</option>
              </select>
            </div>

            {/* Date From */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black font-mono text-slate-400">Date Range (From)</label>
              <div className="relative">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#006a4e] transition"
                />
              </div>
            </div>

            {/* Date To */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black font-mono text-slate-400">Date Range (To)</label>
              <div className="relative">
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#006a4e] transition"
                />
              </div>
            </div>

            {/* Live Search */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black font-mono text-slate-400 font-bold">Query Content Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter key, operator email, desc..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#006a4e] transition placeholder-slate-400"
                />
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* Audio Logs Table */}
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-100 border-t-[#006a4e]" />
              <span className="text-xs text-slate-500 font-mono uppercase tracking-wide font-black">Decrypting Nodes Audits...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Database className="h-12 w-12 text-slate-300 mx-auto" />
              <div className="text-slate-800 font-bold text-sm">No Audit Logs Found</div>
              <p className="text-xs text-slate-400 font-medium">Verify your query filter settings or check connection with Bangladesh central portal node.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs text-slate-600">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200/60 font-mono text-[9px] uppercase font-black tracking-wider text-slate-500">
                    <th className="py-4 px-6">Timestamp / Index</th>
                    <th className="py-4 px-4">Event Code</th>
                    <th className="py-4 px-4">Security Description</th>
                    <th className="py-4 px-4">Source IP</th>
                    <th className="py-4 px-4">Operator Account</th>
                    <th className="py-4 px-4">Ledger Box</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredLogs.map((log) => {
                    const matchedType = log.event_type || 'SYSTEM';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 shrink-0">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-800 font-bold font-mono text-[10px]">
                              {new Date(log.created_at).toLocaleDateString()}
                            </span>
                            <span className="text-slate-400 font-semibold font-mono text-[9px]">
                              {new Date(log.created_at).toTimeString().split(' ')[0]}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded border text-[9px] uppercase font-black font-mono tracking-wide ${getBadgeStyle(matchedType)}`}>
                            {matchedType.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="py-4 px-4 max-w-sm">
                          <p className="text-slate-700 font-semibold text-xs leading-relaxed">
                            {log.description}
                          </p>
                        </td>

                        <td className="py-4 px-4">
                          <span className="text-[10px] font-mono bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded text-slate-600">
                            {log.ip_address || '127.0.0.1'}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          {log.user ? (
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-[10px] font-bold">
                                {log.user.name?.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800">{log.user.name}</span>
                                <span className="text-[9px] text-slate-400 font-mono tracking-tighter truncate max-w-[130px]">{log.user.email}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono tracking-wider italic">KERNEL/WATCHDOG</span>
                          )}
                        </td>

                        <td className="py-4 px-4 max-w-[120px] truncate">
                          {log.election ? (
                            <span className="text-[11px] font-bold text-slate-700 bg-slate-50 border border-slate-150 px-2 py-1 rounded-lg">
                              {log.election.title}
                            </span>
                          ) : log.election_id ? (
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1 rounded">
                              ID: {log.election_id}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-[10px] font-semibold uppercase tracking-wider">GLOBAL</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer with standard pagination controls */}
          {!loading && filteredLogs.length > 0 && (
            <div className="bg-slate-50 border-t border-slate-200/60 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <span className="text-xs text-slate-500 font-mono">
                Showing <strong>{filteredLogs.length}</strong> of <strong>{total}</strong> raw ledger audit events
              </span>
              
              <div className="flex justify-center items-center gap-1.5">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                {Array.from({ length: pages }).map((_, idx) => {
                  const currIdx = idx + 1;
                  // Only display surrounding pages to prevent overflow
                  if (currIdx === 1 || currIdx === pages || Math.abs(currIdx - page) <= 1) {
                    return (
                      <button
                        key={currIdx}
                        onClick={() => setPage(currIdx)}
                        className={`text-xs font-mono font-black h-8 w-8 rounded-lg border transition cursor-pointer ${
                          page === currIdx
                            ? 'bg-[#006a4e] border-[#006a4e] text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {currIdx}
                      </button>
                    );
                  }
                  if (currIdx === 2 || currIdx === pages - 1) {
                    return <span key={currIdx} className="text-slate-300 text-xs font-mono">...</span>;
                  }
                  return null;
                })}

                <button
                  type="button"
                  disabled={page === pages}
                  onClick={() => setPage(p => Math.min(p + 1, pages))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
