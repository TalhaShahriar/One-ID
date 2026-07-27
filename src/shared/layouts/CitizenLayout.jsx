import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Vote, 
  FileText, 
  Car, 
  Home, 
  HeartHandshake, 
  User, 
  Bell, 
  LogOut, 
  Menu, 
  X,
  ShieldCheck,
  Database,
  Settings,
  Fingerprint,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import OneIDCard from '../components/OneIDCard.jsx';

import api from '../../lib/api.js';

export default function CitizenLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await api.get('/citizen/notifications');
        setNotifications(res.data);
        // Compute count (Mock click checking or localStorage memory)
        const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
        const unread = res.data.filter(n => !dismissed.includes(n.id));
        setUnreadCount(unread.length);
      } catch (err) {
        console.warn('Could not retrieve active layout notifications alerts.');
      }
    }
    if (user) {
      fetchNotifications();
      // Auto reconnect interval
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigations with module exact visual color accents
  const navItems = [
    { 
      name: 'Unified Dashboard', 
      path: '/dashboard', 
      icon: LayoutDashboard, 
      color: '#006A4E', // primary BD green
      role: 'VOTER'
    },
    { 
      name: 'Voter Cabinet', 
      path: '/elections', 
      icon: Vote, 
      color: '#7C3AED', // Voting Purple
      role: 'VOTER'
    },
    { 
      name: 'Tax & Revenue', 
      path: '/tax', 
      icon: FileText, 
      color: '#D97706', // Tax Amber
      role: 'VOTER'
    },
    { 
      name: 'Vehicle Registrar', 
      path: '/vehicle', 
      icon: Car, 
      color: '#0F6E56', // Vehicles Emerald
      role: 'VOTER'
    },
    { 
      name: 'Land Cabinet', 
      path: '/property', 
      icon: Home, 
      color: '#D85A30', // Property Rust
      role: 'VOTER'
    },
    { 
      name: 'Civil Registry', 
      path: '/civil-registry', 
      icon: HeartHandshake, 
      color: '#D4537E', // Civil Rose
      role: 'VOTER'
    },
    { 
      name: 'Security & Biometrics', 
      path: '/settings', 
      icon: Settings, 
      color: '#006A4E', // primary BD green
      role: 'VOTER'
    },
    { 
      name: 'My Security Profile', 
      path: '/profile', 
      icon: User, 
      color: '#4B5563', // Grey
      role: 'VOTER'
    },
    { 
      name: 'Blockchain Ledger', 
      path: '/blockchain-visualizer', 
      icon: Database, 
      color: '#0D9488', // Teal-green ledger color
      role: 'VOTER'
    },
    { 
      name: 'Help & FAQs', 
      path: '/help', 
      icon: HelpCircle, 
      color: '#006A4E', 
      role: 'VOTER'
    }
  ];

  // Derive page heading base name
  const currentNav = navItems.find(item => location.pathname.startsWith(item.path));
  const pageTitle = currentNav ? currentNav.name : 'OneID Bangladesh';

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-[#111827]">
      
      {/* Top Navigation Hub Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-8 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            id="mobile-sidebar-toggle"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-[#006A4E] text-white p-1.5 rounded-lg flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-gray-900 tracking-tight text-sm">OneID</span>
              <span className="text-xs text-emerald-700 block -mt-1 font-semibold">Bangladesh</span>
            </div>
          </Link>

          <div className="hidden lg:block h-6 w-px bg-gray-200 mx-2" />
          <h2 className="hidden lg:block text-base font-bold text-gray-800">{pageTitle}</h2>
        </div>

        {/* Right side widgets: Notifications, Mini Card, Logout */}
        <div className="flex items-center gap-4">
          
          {/* Notifications Alerts bell */}
          <Link 
            to="/notifications" 
            className="relative p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-all hover:scale-105"
            title="Alert Notifications"
            id="bell-icon"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#F42A41] text-white rounded-full flex items-center justify-center text-[8px] font-bold border-2 border-white shadow">
                {unreadCount}
              </span>
            )}
          </Link>

          {/* Mini User Identity widget */}
          {user && (
            <div className="hidden md:block w-48 lg:w-56">
              <Link to="/profile">
                <OneIDCard user={user} variant="mini" />
              </Link>
            </div>
          )}

          {/* Secure Logout Trigger */}
          <button
            onClick={handleLogout}
            className="p-2 gap-2 text-gray-500 hover:text-[#F42A41] hover:bg-red-50 rounded-lg transition-all flex items-center text-xs font-semibold"
            title="Sign Out Session"
            id="logout-button"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Structural Body */}
      <div className="flex-1 flex max-w-[100vw] overflow-x-hidden relative">
        
        {/* Left Sidebar Layout desktop */}
        <aside className="hidden lg:flex flex-col w-64 mr-2 bg-white border-r border-gray-200 py-6 px-4 shrink-0 shadow-sm">
          <div className="space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              const IconComp = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{ '--hover-color': item.color }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all group ${
                    active 
                      ? 'bg-[#006A4E]/10 text-[#006A4E] shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <IconComp 
                    style={{ color: active ? '#006A4E' : item.color }} 
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110`} 
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
          
          {/* Footer of details */}
          <div className="mt-auto pt-6 border-t border-gray-100 text-center">
            <span className="text-[10px] text-gray-400 font-mono">ONEID NODE #BD-2026-X</span>
          </div>
        </aside>

        {/* Mobile Sidebar overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden bg-opacity-40 backdrop-blur-sm bg-black transition-opacity">
            <div className="bg-white w-72 max-w-[85vw] h-full flex flex-col p-6 animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-[#006A4E] text-white p-1.5 rounded-lg flex items-center justify-center shadow">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 tracking-tight text-sm">OneID</span>
                    <span className="text-xs text-emerald-700 block -mt-1 font-semibold">Bangladesh</span>
                  </div>
                </div>
                <button 
                  onClick={() => setMobileOpen(false)}
                  className="p-1 rounded-lg text-gray-500 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {user && (
                <div className="mb-6">
                  <Link to="/profile" onClick={() => setMobileOpen(false)}>
                    <OneIDCard user={user} variant="mini" />
                  </Link>
                </div>
              )}

              <nav className="space-y-1.5 flex-1">
                {navItems.map((item) => {
                  const active = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                  const IconComp = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                        active 
                          ? 'bg-[#006A4E]/10 text-[#006A4E] shadow-sm' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <IconComp 
                        style={{ color: active ? '#006A4E' : item.color }} 
                        className="w-4.5 h-4.5 shrink-0" 
                      />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 mt-auto rounded-xl border border-red-200 text-[#F42A41] hover:bg-red-50 text-xs font-semibold transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out Session</span>
              </button>
            </div>
          </div>
        )}

        {/* Core Content Box with layout animations spacing */}
        <main className="flex-grow p-4 lg:p-8 min-w-0 max-w-full overflow-y-auto pb-20 sm:pb-4 flex flex-col">
          <div className="flex-grow">
            {children}
          </div>
          
          
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Extra small viewports) */}
      <div className="fixed bottom-0 left-0 right-0 z-45 bg-white/95 backdrop-blur-md border-t border-gray-200/80 px-1 py-1.5 flex items-center justify-around sm:hidden shadow-lg">
        {navItems.slice(0, 5).map((item) => {
          const active = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          const IconComp = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-extrabold transition-all duration-200 ${
                active 
                  ? 'text-[#006A4E]' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <IconComp 
                style={{ color: active ? '#006A4E' : item.color }} 
                className="w-4.5 h-4.5 transition-transform active:scale-95" 
              />
              <span className="truncate max-w-[64px] font-mono text-[9px] scale-90">{item.name.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
