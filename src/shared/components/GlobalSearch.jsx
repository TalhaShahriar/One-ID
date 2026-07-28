import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';

const MODULES = [
  { name: 'Dashboard', path: '/admin/dashboard', role: 'ADMIN', icon: '📈' },
  { name: 'Elections', path: '/elections', roles: ['VOTER', 'CANDIDATE'], icon: '🗳️' },
  { name: 'Admin Elections', path: '/admin/elections', role: 'ADMIN', icon: '📅' },
  { name: 'Tax Filing', path: '/tax', roles: ['VOTER', 'CANDIDATE'], icon: '💰' },
  { name: 'Tax Admin', path: '/tax/admin', roles: ['TAX_ADMIN', 'ADMIN'], icon: '💰' },
  { name: 'Vehicle (BRTA)', path: '/vehicle', roles: ['VOTER', 'CANDIDATE'], icon: '🚗' },
  { name: 'Vehicle Admin', path: '/vehicle/admin', roles: ['VEHICLE_ADMIN', 'ADMIN'], icon: '🚗' },
  { name: 'Property (Land)', path: '/property', roles: ['VOTER', 'CANDIDATE'], icon: '🏡' },
  { name: 'Property Admin', path: '/property/admin', roles: ['PROPERTY_ADMIN', 'ADMIN'], icon: '🏡' },
  { name: 'Civil Registry', path: '/civil-registry', roles: ['VOTER', 'CANDIDATE'], icon: '📜' },
  { name: 'Kazi Desk', path: '/civil-registry/kazi', roles: ['KAZI_ADMIN', 'ADMIN'], icon: '🕌' },
  { name: 'UP Chairman', path: '/civil-registry/chairman', roles: ['LOCAL_AUTHORITY_ADMIN', 'ADMIN'], icon: '🏛️' },
  { name: 'Candidate Workspace', path: '/candidate/dashboard', roles: ['VOTER', 'CANDIDATE'], icon: '💼' },
  { name: 'Apply as Candidate', path: '/candidate/apply', roles: ['VOTER', 'CANDIDATE'], icon: '📝' },
  { name: 'Voter History', path: '/voter/history', roles: ['VOTER', 'CANDIDATE'], icon: '🕒' },
  { name: 'Blockchain Visualizer', path: '/admin/blockchain-status', role: 'ADMIN', icon: '🔗' },
  { name: 'Audit Logs', path: '/admin/audit-logs', role: 'ADMIN', icon: '📄' },
  { name: 'Candidate Reviews', path: '/admin/candidates', role: 'ADMIN', icon: '👥' },
  { name: 'Super Admin', path: '/super/dashboard', role: 'SUPER_ADMIN', icon: '👑' },
  { name: 'Profile Settings', path: '/profile', icon: '⚙️' },
];

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!user) return null;

  const filteredModules = MODULES.filter((mod) => {
    // Check role access
    const hasRoleAccess =
      !mod.role && !mod.roles ||
      (mod.role && user.role === mod.role) ||
      (mod.roles && mod.roles.includes(user.role));
    
    if (!hasRoleAccess) return false;

    // Filter by query
    return mod.name.toLowerCase().includes(query.toLowerCase());
  });

  const handleSelect = (path) => {
    navigate(path);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full md:max-w-sm" ref={searchRef}>
      <div className="relative">
        <label htmlFor="global-search-input" className="sr-only">Search modules</label>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
        <input
          id="global-search-input"
          ref={inputRef}
          type="text"
          placeholder="Search modules (e.g. Tax, Vehicle)..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-9 pr-14 py-1.5 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-[#006a4e] focus:bg-white transition-all outline-none"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-200/80 rounded border border-slate-300 pointer-events-none select-none">
          <kbd className="font-sans">⌘</kbd>K
        </div>
      </div>

      {isOpen && query.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50 max-h-64 overflow-y-auto">
          {filteredModules.length > 0 ? (
            <ul className="py-1">
              {filteredModules.map((mod, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => handleSelect(mod.path)}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700 transition-colors"
                  >
                    <span className="text-base">{mod.icon}</span>
                    {mod.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500 text-center">
              No modules found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
