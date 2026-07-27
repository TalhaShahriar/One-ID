import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api.js';

const AuthContext = createContext(null);

/**
 * Authentication Context Provider.
 * Persists JWT credentials, syncs active identity contexts, and manages session recovery.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('votechain_token'));
  const [loading, setLoading] = useState(true);

  // Sync active user credentials on mount
  useEffect(() => {
    async function restoreSession() {
      const storedToken = localStorage.getItem('votechain_token');
      if (storedToken) {
        try {
          // Fetch refreshed profile payload to validate stored JWT actively
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('votechain_user', JSON.stringify(res.data));
        } catch (error) {
          console.error('❌ Failed to restore authenticated session:', error);
          // Expired or bad token; purge cached states
          logout();
        }
      }
      setLoading(false);
    }
    restoreSession();
  }, [token]);

  /**
   * Safe login execution logic.
   * Saves credentials to browser variables and adjusts state hierarchies.
   * @param {string} newToken - Secure JWT string representation.
   * @param {object} newUser - Authenticated voter metadata payload.
   */
  const login = (newToken, newUser) => {
    localStorage.setItem('votechain_token', newToken);
    localStorage.setItem('votechain_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  /**
   * Safe session revocation logic. Clears local caching parameters.
   */
  const logout = () => {
    localStorage.removeItem('votechain_token');
    localStorage.removeItem('votechain_user');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom React Hook: useAuth
 * Exposes active session parameters safely across component trees.
 * @returns {{user: object|null, token: string|null, loading: boolean, login: Function, logout: Function, isAuthenticated: boolean}}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be consumed inside an AuthProvider element structure.');
  }
  return context;
}
