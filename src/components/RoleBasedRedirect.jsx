import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

/**
 * A Higher-Order Component / Wrapper that automatically redirects users 
 * based on their role metadata. 
 * Prevents unauthorized access and routes them to their designated dashboard
 * if they try to access a route they don't have permission for.
 */
export default function RoleBasedRedirect({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center font-sans">
        <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent animate-spin rounded-full mb-3"></div>
        <p className="text-xs uppercase tracking-widest text-slate-400 font-mono">Verifying Role Metadata...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Automatically redirect based on their role metadata instead of just a generic unauthorized page
    const roleRedirects = {
      'SUPER_ADMIN': '/admin/super-dashboard',
      'ADMIN': '/admin/dashboard',
      'TAX_ADMIN': '/tax/admin',
      'VEHICLE_ADMIN': '/vehicle/admin',
      'PROPERTY_ADMIN': '/property/admin',
      'CIVIL_REGISTRY_ADMIN': '/civil-registry/admin',
      'KAZI_ADMIN': '/civil-registry/kazi',
      'LOCAL_AUTHORITY_ADMIN': '/civil-registry/chairman',
      'VOTER': '/dashboard',
      'CANDIDATE': '/dashboard'
    };

    const redirectPath = roleRedirects[user.role] || '/unauthorized';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

export function withRoleRedirect(WrappedComponent, allowedRoles) {
  return function RoleRedirectWrapper(props) {
    return (
      <RoleBasedRedirect allowedRoles={allowedRoles}>
        <WrappedComponent {...props} />
      </RoleBasedRedirect>
    );
  };
}
