import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function BreadcrumbNav() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Don't show breadcrumbs on public routes or landing pages
  const hiddenRoutes = ['/', '/login', '/register', '/mfa', '/verify-otp', '/forgot-password', '/landing', '/unauthorized'];
  if (!isAuthenticated || hiddenRoutes.includes(location.pathname)) {
    return null;
  }

  const pathnames = location.pathname.split('/').filter((x) => x);

  // Generate route specific labels
  const getBreadcrumbName = (pathSegment) => {
    const labels = {
      'admin': 'Admin',
      'dashboard': 'Dashboard',
      'elections': 'Elections',
      'candidates': 'Candidates',
      'blockchain-status': 'Blockchain',
      'audit-logs': 'Audit Logs',
      'candidate': 'Candidate',
      'apply': 'Apply',
      'vote': 'Vote',
      'success': 'Success',
      'voter': 'Voter',
      'history': 'History',
      'results': 'Results',
      'tax': 'Tax',
      'calculate': 'Calculate',
      'receipt': 'Receipt',
      'vehicle': 'Vehicle',
      'transfer': 'Transfer',
      'property': 'Property',
      'consent': 'Consent',
      'civil-registry': 'Civil Registry',
      'kazi': 'Kazi',
      'chairman': 'Chairman',
      'verify': 'Verify',
      'profile': 'Profile',
      'settings': 'Settings',
      'notifications': 'Notifications',
      'super-dashboard': 'Super Admin'
    };
    
    // Capitalize first letter if not in mapping
    return labels[pathSegment] || (pathSegment.charAt(0).toUpperCase() + pathSegment.slice(1).replace(/-/g, ' '));
  };

  return (
    <div className="bg-white/80 backdrop-blur border-b border-slate-200 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <nav aria-label="Breadcrumb" className="flex items-center space-x-1 sm:space-x-2 text-xs font-medium text-slate-500 font-sans overflow-x-auto whitespace-nowrap hide-scrollbar">
          <Link 
            to="/" 
            className="flex items-center hover:text-[#006a4e] transition-colors focus:outline-none focus:ring-2 focus:ring-[#006a4e] rounded"
            title="Home"
            aria-label="Home"
          >
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          
          {pathnames.map((value, index) => {
            const isLast = index === pathnames.length - 1;
            const to = `/${pathnames.slice(0, index + 1).join('/')}`;

            // Skip numeric IDs or long hashes in breadcrumbs
            const isId = value.length > 15 || !isNaN(value);
            const label = isId ? 'Details' : getBreadcrumbName(value);

            return (
              <React.Fragment key={to}>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" aria-hidden="true" />
                {isLast ? (
                  <span className="text-slate-800 font-bold max-w-[150px] sm:max-w-none truncate" aria-current="page">
                    {label}
                  </span>
                ) : (
                  <Link 
                    to={to} 
                    className="hover:text-[#006a4e] transition-colors max-w-[100px] sm:max-w-none truncate focus:outline-none focus:ring-2 focus:ring-[#006a4e] rounded"
                    aria-label={`Navigate to ${label}`}
                  >
                    {label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
