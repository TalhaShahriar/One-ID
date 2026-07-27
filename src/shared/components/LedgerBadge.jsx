import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

/**
 * Reusable Blockchain Verification status indicator badge.
 * Prompts on mount to fetch status footprint from underlying platform secure registry.
 * @param {object} props 
 * @param {string} props.sector - Ledger Sector VOTE / TAX / VEHICLE etc. 
 * @param {string} props.recordId - Record UUID inside LedgerRecord schema
 */
export default function LedgerBadge({ sector, recordId }) {
  const [statusState, setStatusState] = useState('loading'); // loading, verified, pending, notfound

  useEffect(() => {
    let active = true;

    if (!recordId) {
      setStatusState('notfound');
      return;
    }

    async function queryRecord() {
      try {
        const response = await api.get(`/ledger/record/${recordId}`);
        if (!active) return;

        if (response.data && response.data.found) {
          if (response.data.merkleSealed) {
            setStatusState('verified');
          } else {
            setStatusState('pending');
          }
        } else {
          setStatusState('notfound');
        }
      } catch (err) {
        console.error(`Error confirming ledger record sequence ${recordId}:`, err);
        if (active) {
          setStatusState('notfound');
        }
      }
    }

    queryRecord();

    return () => {
      active = false;
    };
  }, [recordId, sector]);

  if (statusState === 'loading') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500 animate-pulse border border-slate-200">
        <Shield className="w-3.5 h-3.5 animate-spin" />
        Checking Ledger...
      </span>
    );
  }

  if (statusState === 'verified') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm" title={`Sector: ${sector}`}>
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        Blockchain Verified ✓
      </span>
    );
  }

  if (statusState === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 shadow-sm" title="Logged in transaction chain, pending cyclic Merkle seal batch.">
        <Shield className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
        Pending Seal
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 shadow-sm" title="No cryptographic reference chain trace on block database.">
      <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
      Not Found
    </span>
  );
}
