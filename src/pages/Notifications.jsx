import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../lib/api.js';
import { 
  Bell, 
  CheckCircle, 
  Trash2, 
  ArrowLeft,
  Database,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(() => {
    return JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
  });

  useEffect(() => {
    async function loadNotifications() {
      try {
        setLoading(true);
        const res = await api.get('/citizen/notifications');
        setNotifications(res.data);
      } catch (err) {
        console.warn('Could not pull secure system notification streams:', err);
        toast.error('Failed to sync notification updates.');
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      loadNotifications();
    }
  }, [user]);

  // Sync dismissed items to localStorage actively
  const syncDismissed = (newDismissed) => {
    setDismissed(newDismissed);
    localStorage.setItem('dismissed_notifications', JSON.stringify(newDismissed));
  };

  const handleMarkRead = (id) => {
    if (!dismissed.includes(id)) {
      const updated = [...dismissed, id];
      syncDismissed(updated);
      toast.success('Notification marked as read.');
    }
  };

  const handleMarkAllRead = () => {
    const allIds = notifications.map(n => n.id);
    syncDismissed(allIds);
    toast.success('All notifications marked as read.');
  };

  const handleClearHistory = () => {
    const allIds = notifications.map(n => n.id);
    syncDismissed(allIds);
    toast.success('Notification history cleared.');
  };

  const activeNotifications = notifications.filter(n => !dismissed.includes(n.id));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-[#006A4E] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-gray-500 text-center">Syncing secure client notification feeds...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Breadcrumb row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-[#006A4E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="text-[10px] font-mono text-gray-400">OneID Alerts Channel</span>
      </div>

      {/* Main Header Board */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="bg-[#006A4E]/10 p-2.5 text-[#006A4E] rounded-xl">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-950">Identity Notifications Inbox</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {activeNotifications.length === 0 ? 'No active unread updates' : `You have ${activeNotifications.length} unread security logs`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeNotifications.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="py-1.5 px-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-xs transition"
                id="mark-all-read-btn"
              >
                Mark All Read
              </button>
            )}
            <button
              onClick={handleClearHistory}
              className="py-1.5 px-3.5 border border-red-200 text-[#F42A41] hover:bg-red-50 font-semibold rounded-lg text-xs transition"
              id="clear-notifications-btn"
            >
              Clear Current Inbox
            </button>
          </div>
        </div>
      </div>

      {/* Notifications list */}
      <div className="space-y-3">
        {activeNotifications.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-extrabold text-gray-900">Your Inbox is Clean!</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed mt-1">
              There are no new unread audit logs or security dispatches under your sovereign digital key records.
            </p>
          </div>
        ) : (
          activeNotifications.map((notif) => {
            // Determine colors
            let color = '#4B5563'; // Grey default
            let sectorName = 'Identity';
            if (notif.module === 'Voting') {
               color = '#7C3AED';
               sectorName = 'Voter Cabinet';
            } else if (notif.module === 'Tax') {
               color = '#D97706';
               sectorName = 'Tax & Revenue';
            } else if (notif.module === 'Vehicles') {
               color = '#0F6E56';
               sectorName = 'Vehicle Registry';
            } else if (notif.module === 'Property') {
               color = '#D85A30';
               sectorName = 'Land Cabinet';
            } else if (notif.module === 'Civil') {
               color = '#D4537E';
               sectorName = 'Civil Registry';
            }

            return (
              <div 
                key={notif.id} 
                className="relative bg-white border border-gray-200/80 rounded-xl p-5 hover:border-gray-300 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden"
              >
                {/* Horizontal Module ribbon strip */}
                <div style={{ backgroundColor: color }} className="absolute left-0 top-0 bottom-0 w-1" />

                <div className="flex gap-4 items-start min-w-0">
                  <div 
                    style={{ backgroundColor: `${color}15`, color }}
                    className="p-2 rounded-lg shrink-0"
                  >
                    <Bell className="w-4 h-4" />
                  </div>
                  
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-bold text-gray-900 leading-normal">{notif.message}</p>
                    
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                      <span>{new Date(notif.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                      <span>•</span>
                      <span>{new Date(notif.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                      <span>•</span>
                      <span className="capitalize">{sectorName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  
                  {notif.ledgerRecordId && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-[#006A4E]/10 text-[#006A4E] py-0.5 px-2 rounded-full border border-[#006A4E]/20">
                      <Database className="w-3.5 h-3.5" /> SECURE SEALED
                    </span>
                  )}
                  
                  <button
                    onClick={() => handleMarkRead(notif.id)}
                    className="p-1 px-3 text-xs bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors flex items-center gap-1.5 font-semibold"
                    title="Dismiss alert"
                  >
                    Dismiss
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
