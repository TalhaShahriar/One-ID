import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

/**
 * Route protection gate. Wraps children to guarantee authenticated and role-authorized access.
 * Re-routes expired sessions back to /login, and unauthorized personnel to /unauthorized.
 * 
 * @param {object} props
 * @param {React.ReactNode} props.children - Target children route layout
 * @param {string[]} [props.roles] - Array of authorized profiles (e.g. ['ADMIN', 'VOTER'])
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center font-sans">
        <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent animate-spin rounded-full mb-3"></div>
        <p className="text-xs uppercase tracking-widest text-slate-400 font-mono">Verifying Credentials Node...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
