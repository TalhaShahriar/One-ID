import React from 'react';
import { toast } from 'sonner';

export const showFirebaseDiagnosticToast = (err, context = 'OTP Verification') => {
  console.group(`🔥 Firebase Diagnostic: ${context}`);
  console.error('Code:', err.code);
  console.error('Message:', err.message);
  console.error('Full Error Object:', err);
  console.groupEnd();

  toast.error(
    <div className="flex flex-col gap-2 w-full">
      <div className="font-semibold text-red-700 text-sm">Firebase Diagnostic ({context})</div>
      <div className="bg-red-50 text-red-800 font-mono text-xs p-2 rounded border border-red-100 break-all">
        {err.code || 'UNKNOWN_ERROR'}
      </div>
      <div className="text-xs text-red-600 leading-relaxed">
        {err.message || 'No additional message provided by Firebase.'}
      </div>
      {err.code === 'auth/invalid-app-credential' && (
        <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
          <strong>Tip:</strong> App check or Recaptcha verification failed. Check API keys and domains in Firebase Console.
        </div>
      )}
      {err.code === 'auth/billing-not-enabled' && (
        <div className="text-xs text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
          <strong>Free Testing Tip:</strong> Real SMS requires a Firebase Blaze plan, but you can test <strong>100% FREE</strong> by adding a test phone number in Firebase Console (Auth &gt; Sign-in method &gt; Phone &gt; Test Phone Numbers), or simply type the Dev PIN <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">123456</code> to log in right now!
        </div>
      )}
      {err.code === 'auth/unauthorized-domain' && (
        <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
          <strong>Tip:</strong> The current domain is not authorized for Firebase Auth. Add it in Authentication &gt; Settings &gt; Authorized domains.
        </div>
      )}
    </div>,
    {
      duration: 10000,
    }
  );
};

export default function FirebaseDiagnosticPanel({ error }) {
  if (!error) return null;
  
  return (
    <div className="mt-4 w-full p-4 bg-red-50/50 border border-red-100 rounded-lg text-left">
      <h3 className="text-red-800 font-medium text-sm mb-2 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        Diagnostic Log
      </h3>
      <div className="space-y-1">
        <p className="text-xs text-red-600"><span className="font-semibold">Code:</span> <span className="font-mono bg-white px-1 py-0.5 rounded text-red-700">{error.code || 'N/A'}</span></p>
        <p className="text-xs text-red-600"><span className="font-semibold">Message:</span> {error.message || 'Unknown error'}</p>
      </div>
    </div>
  );
}
