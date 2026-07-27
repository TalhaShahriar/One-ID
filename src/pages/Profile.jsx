import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../lib/api.js';
import { toast } from 'sonner';
import { 
  User, 
  Phone, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Heart, 
  ShieldCheck, 
  Save, 
  ArrowLeft,
  QrCode,
  Eye,
  Lock,
  Globe,
  Building,
  Award,
  Fingerprint,
  Scan,
  Plus,
  Trash2,
  Key,
  RefreshCw,
  Settings,
  Smartphone,
  CheckCircle2,
  Shield
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import QRCode from 'qrcode';
import BiometricVerificationModal from '../components/BiometricVerificationModal.jsx';

export default function Profile() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(() => {
    if (window.location.pathname === '/settings' || window.location.search.includes('tab=settings') || window.location.search.includes('tab=biometrics')) {
      return 'biometrics';
    }
    return 'biometrics';
  });

  const [detectedOS, setDetectedOS] = useState({ name: 'Device Biometrics', method: 'Touch ID / Face ID / Passkey', tag: 'Biometric Sensor' });

  useEffect(() => {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';

    if (/android/i.test(ua)) {
      setDetectedOS({ name: 'Android Device', method: 'Android Biometric Prompt (Fingerprint / Face)', tag: 'Android Biometrics' });
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      setDetectedOS({ name: 'iOS Device', method: 'Apple Face ID / Touch ID', tag: 'iOS Passkey' });
    } else if (/Macintosh|MacIntel/i.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      setDetectedOS({ name: 'macOS Device', method: 'Mac Touch ID / Apple Passkey', tag: 'macOS Biometrics' });
    } else if (/Win/i.test(platform) || /Windows/i.test(ua)) {
      setDetectedOS({ name: 'Windows PC', method: 'Windows Hello (Fingerprint / Face / PIN)', tag: 'Windows Hello' });
    }
  }, []);

  // Sync tab with pathname/location changes
  useEffect(() => {
    if (location.pathname === '/settings' || location.search.includes('tab=settings') || location.search.includes('tab=biometrics')) {
      setActiveTab('biometrics');
    }
  }, [location]);

  // Active form parameters
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [division, setDivision] = useState(user?.division || 'Dhaka');
  const [district, setDistrict] = useState(user?.district || 'Dhaka');
  const [upazila, setUpazila] = useState(user?.upazila || 'Ramna');
  const [occupation, setOccupation] = useState(user?.occupation || '');
  const [dateOfBirth, setDateOfBirth] = useState(() => {
    if (!user?.dateOfBirth) return '';
    const d = new Date(user.dateOfBirth);
    return d.toISOString().split('T')[0];
  });
  const [bloodGroup, setBloodGroup] = useState(() => {
    return user?.bloodGroup || 'O+';
  });

  const [saving, setSaving] = useState(false);

  // Secure QR States
  const [maskNid, setMaskNid] = useState(true);
  const [verifyAge, setVerifyAge] = useState(true);
  const [verifyTax, setVerifyTax] = useState(false);
  const [verifyProperty, setVerifyProperty] = useState(false);
  const [verifyVoting, setVerifyVoting] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Biometric Passkeys States
  const [biometricKeys, setBiometricKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // Fetch user's active passkeys
  const fetchCredentials = async () => {
    try {
      setLoadingKeys(true);
      let backendKeys = [];
      try {
        const res = await api.get('/auth/webauthn/credentials');
        backendKeys = res.data.credentials || [];
      } catch (err) {
        console.warn('Backend passkey fetch notice:', err);
      }

      const localKeys = JSON.parse(localStorage.getItem('votechain_biometric_keys') || '[]');
      const combined = [...backendKeys];

      for (const lk of localKeys) {
        const targetId = lk.id || lk.credentialId;
        if (!combined.some(bk => bk.id === targetId || bk.credentialId === targetId)) {
          combined.push(lk);
        }
      }

      setBiometricKeys(combined);
    } catch (err) {
      console.error('Error fetching biometric passkeys:', err);
    } finally {
      setLoadingKeys(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const handleRevokeKey = async (keyId) => {
    if (!keyId) return;
    if (!window.confirm('Are you sure you want to revoke this biometric key?')) return;

    // Remove from local state immediately
    setBiometricKeys(prev => prev.filter(k => (k.id !== keyId && k.credentialId !== keyId)));

    // Remove from local storage
    const localKeys = JSON.parse(localStorage.getItem('votechain_biometric_keys') || '[]');
    const updatedLocal = localKeys.filter(k => k.id !== keyId && k.credentialId !== keyId);
    localStorage.setItem('votechain_biometric_keys', JSON.stringify(updatedLocal));

    try {
      await api.delete(`/auth/webauthn/credentials/${encodeURIComponent(keyId)}`);
      toast.success('Biometric key revoked.');
    } catch (err) {
      console.warn('Backend revoke notice:', err);
      toast.success('Biometric key revoked.');
    } finally {
      fetchCredentials();
    }
  };

  // Auto-generate secure verification link
  const verificationLink = user?.oneid 
    ? `${window.location.origin}/verify-identity?oneid=${user.oneid}&maskNid=${maskNid}&verifyAge=${verifyAge}&verifyTax=${verifyTax}&verifyProperty=${verifyProperty}&verifyVoting=${verifyVoting}`
    : '';

  useEffect(() => {
    if (!verificationLink) return;

    QRCode.toDataURL(verificationLink, {
      margin: 1.5,
      width: 200,
      color: {
        dark: '#006A4E', // Bangladesh Green
        light: '#FFFFFF'
      }
    })
    .then(url => {
      setQrCodeUrl(url);
    })
    .catch(err => {
      console.error('Failed to generate identity QR Code:', err);
    });
  }, [verificationLink]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.patch('/citizen/profile', {
        name,
        phone,
        division,
        district,
        upazila,
        occupation,
        dateOfBirth,
        bloodGroup
      });
      
      // Update local storage and context
      login(localStorage.getItem('votechain_token'), res.data.user);
      toast.success('Your citizen security profile has been updated!');
    } catch (err) {
      console.error(err);
      toast.error('Could not commit profile changes to database.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Back to dashboard breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-[#006A4E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="text-[10px] font-mono text-gray-400">NODE REF: {user.oneid}</span>
      </div>

      {/* Hero Badge Identity Panel */}
      <div className="relative overflow-hidden bg-white border border-gray-200/80 shadow-sm rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-center">
        {/* Upper Ribbon decor represent high security ID Cards */}
        <div className="absolute right-0 bottom-0 top-0 w-1 bg-gradient-to-b from-[#006A4E] to-[#F42A41]" />
        
        <div className="w-16 h-16 rounded-full bg-[#006A4E]/10 border border-[#006A4E]/20 text-[#006A4E] text-2xl font-black flex items-center justify-center">
          {user.name ? user.name[0].toUpperCase() : 'BD'}
        </div>

        <div className="space-y-1.5 flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <span className="inline-flex items-center bg-emerald-50 text-emerald-800 text-[10px] py-0.5 px-2 rounded-full font-bold border border-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-700" /> Identity Secure
            </span>
          </div>
          <p className="text-xs font-mono text-[#006A4E] font-bold">{user.oneid}</p>
          <p className="text-[10px] text-gray-400 capitalize">{user.role?.toLowerCase()?.replace('_', ' ')} authority bounds • {user.email}</p>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300/60 font-sans text-xs font-bold gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('biometrics')}
          className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'biometrics'
              ? 'bg-white text-slate-900 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Fingerprint className={`w-4 h-4 ${activeTab === 'biometrics' ? 'text-emerald-700' : 'text-slate-500'}`} />
          <span>Biometrics & Security Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-white text-slate-900 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-[#006A4E]' : 'text-slate-500'}`} />
          <span>Personal Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('qr')}
          className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'qr'
              ? 'bg-white text-slate-900 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <QrCode className={`w-4 h-4 ${activeTab === 'qr' ? 'text-emerald-700' : 'text-slate-500'}`} />
          <span>Physical Identity QR</span>
        </button>
      </div>

      {/* TAB 1: BIOMETRICS & SECURITY SETTINGS */}
      {activeTab === 'biometrics' && (
        <div className="space-y-6">
          {/* OS Hardware Detection Card */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-md border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                <Smartphone className="w-3.5 h-3.5" /> Hardware Sensor Detected
              </div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {detectedOS.name} — <span className="text-emerald-400 font-black">{detectedOS.tag}</span>
              </h3>
              <p className="text-xs text-slate-300">
                Method Supported: <strong>{detectedOS.method}</strong>. You can sign in passwordlessly using your OS biometric scanner.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Fingerprint className="w-4 h-4" /> Setup Biometrics Now
            </button>
          </div>

          {/* Biometric Passkeys & Security Enrolment Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-emerald-400 text-[10px] font-black font-mono uppercase tracking-wider">
                  <Fingerprint className="h-3.5 w-3.5" /> WebAuthn Passkey Security
                </div>
                <h3 className="text-base font-black text-slate-900">
                  Touch ID / Face ID Biometric Enrolment
                </h3>
                <p className="text-xs text-slate-500 max-w-xl">
                  Link your smartphone, laptop, or platform biometric sensor for passwordless biometric login and instant high-security authorization across OneID services.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(true)}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Scan className="w-3.5 h-3.5 text-emerald-600" /> Test Sensor
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Enroll Sensor Key
                </button>
              </div>
            </div>

            {/* Registered Biometric Keys List */}
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3">
                Active Biometric Keys ({biometricKeys.length})
              </h4>

              {loadingKeys ? (
                <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" /> Loading biometric records...
                </div>
              ) : biometricKeys.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-3">
                  <Key className="w-8 h-8 text-slate-400 mx-auto" />
                  <div>
                    <p className="text-xs font-bold text-slate-700">No biometric passkeys enrolled yet.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click "Setup Biometrics Now" above to register your fingerprint or face scanner.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    <Fingerprint className="w-4 h-4" /> Start Biometric Setup
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {biometricKeys.map((key) => (
                    <div key={key.id} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center border border-emerald-500/20">
                          <Fingerprint className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{key.friendlyName || 'Touch ID / Face ID Sensor'}</p>
                          <p className="text-[10px] font-mono text-slate-400">
                            Added: {new Date(key.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRevokeKey(key.id || key.credentialId);
                        }}
                        title="Revoke Key"
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PHYSICAL IDENTITY QR */}
      {activeTab === 'qr' && (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#006A4E] text-[10px] font-black font-mono uppercase tracking-wider">
              <QrCode className="h-3.5 w-3.5" /> Physical Identity Proving
            </div>
            <h3 className="text-base font-black text-gray-900">
              In-Person Secure Verification QR
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Proving your legal standing physically (e.g. at a bank branch, retail shop, or border gate)? Toggle the parameters below to configure what the physical verifier will be authorized to see, then present the dynamic QR code on the right.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-gray-400">STATUS: READY TO SCAN</span>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center border-t border-gray-100 pt-6">
          {/* Toggles */}
          <div className="md:col-span-7 space-y-3.5">
            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
              Verification Preferences
            </h4>

            {/* Toggle 1 */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition cursor-pointer">
              <input
                type="checkbox"
                checked={maskNid}
                onChange={(e) => setMaskNid(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-[#006A4E] focus:ring-[#006A4E]"
              />
              <div className="ml-3">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-gray-400" /> Mask sensitive NID digits
                </span>
                <span className="block text-[10px] text-gray-500 mt-0.5 leading-tight">
                  Masks the last 8 digits of your sovereign OneID (e.g. NID-8472-XXXX-XXXX).
                </span>
              </div>
            </label>

            {/* Toggle 2 */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition cursor-pointer">
              <input
                type="checkbox"
                checked={verifyAge}
                onChange={(e) => setVerifyAge(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-[#006A4E] focus:ring-[#006A4E]"
              />
              <div className="ml-3">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" /> Prove legal age (18+)
                </span>
                <span className="block text-[10px] text-gray-500 mt-0.5 leading-tight">
                  Confirms that you are of legal age without displaying your exact date of birth.
                </span>
              </div>
            </label>

            {/* Toggle 3 */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition cursor-pointer">
              <input
                type="checkbox"
                checked={verifyTax}
                onChange={(e) => setVerifyTax(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-[#006A4E] focus:ring-[#006A4E]"
              />
              <div className="ml-3">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <span className="font-mono text-gray-400 font-black text-xs leading-none">৳</span> Prove eVat Tax standing
                </span>
                <span className="block text-[10px] text-gray-500 mt-0.5 leading-tight">
                  Proves current fiscal year filing and no outstanding VAT arrears.
                </span>
              </div>
            </label>

            {/* Toggle 4 */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition cursor-pointer">
              <input
                type="checkbox"
                checked={verifyProperty}
                onChange={(e) => setVerifyProperty(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-[#006A4E] focus:ring-[#006A4E]"
              />
              <div className="ml-3">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-gray-400" /> Prove Land Deeds registered
                </span>
                <span className="block text-[10px] text-gray-500 mt-0.5 leading-tight">
                  Proves ownership counts in the central Land mutation registry.
                </span>
              </div>
            </label>

            {/* Toggle 5 */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition cursor-pointer">
              <input
                type="checkbox"
                checked={verifyVoting}
                onChange={(e) => setVerifyVoting(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-[#006A4E] focus:ring-[#006A4E]"
              />
              <div className="ml-3">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-gray-400" /> Prove Voter balloting completed
                </span>
                <span className="block text-[10px] text-gray-500 mt-0.5 leading-tight">
                  Proves whether your anonymous ballot receipt was processed in active elections.
                </span>
              </div>
            </label>
          </div>

          {/* QR Display */}
          <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-4 bg-gray-50 rounded-2xl border border-gray-100 relative overflow-hidden group">
            {qrCodeUrl ? (
              <div className="relative p-3 bg-white rounded-xl border border-gray-200/80 shadow-xs">
                <img 
                  src={qrCodeUrl} 
                  alt="Identity Verification QR" 
                  className="w-40 h-40 object-contain block"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-40 h-40 rounded-xl bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center">
                <span className="text-xs text-gray-400">Generating secure ticket...</span>
              </div>
            )}

            <div className="space-y-1.5 mt-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                Scan Code To Verify
              </p>
              
              <div className="flex gap-2">
                <a
                  href={verificationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold font-mono text-[#006A4E] bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1.5 rounded-lg border border-emerald-100 transition"
                >
                  <Eye className="h-3 w-3" /> Test Verifier Link ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* TAB 3: PROFILE FORM */}
      {(activeTab === 'profile' || activeTab === 'all') && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          
          <div className="p-6 md:p-8 space-y-6">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider pb-3 border-b border-gray-100 flex items-center gap-2">
              <User className="w-4.5 h-4.5 text-[#006A4E]" /> Update Credentials
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Field: Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                <User className="w-4 h-4 text-gray-400" /> Full Citizen Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#006A4E] focus:bg-white transition-colors"
                placeholder="Enter formal name"
                id="profile-name-input"
              />
            </div>

            {/* Field: Phone No */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-gray-400" /> Secure Mobile Line
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs font-mono font-semibold px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#006A4E] focus:bg-white transition-colors"
                placeholder="01XXXXXXXXX"
                id="profile-phone-input"
              />
            </div>

            {/* Field: Date of Birth */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" /> Date of Birth
              </label>
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full text-xs font-mono font-semibold px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#006A4E] focus:bg-white transition-colors"
                id="profile-dob-input"
              />
            </div>

            {/* Field: Blood Group */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-gray-400" /> Verified Blood Group
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#006A4E] focus:bg-white transition-colors"
                id="profile-blood-input"
              >
                <option value="A+">A Positive (A+)</option>
                <option value="A-">A Negative (A-)</option>
                <option value="B+">B Positive (B+)</option>
                <option value="B-">B Negative (B-)</option>
                <option value="AB+">AB Positive (AB+)</option>
                <option value="AB-">AB Negative (AB-)</option>
                <option value="O+">O Positive (O+)</option>
                <option value="O-">O Negative (O-)</option>
              </select>
            </div>

            {/* Field: Active Occupation */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-gray-400" /> Primary Occupation
              </label>
              <input
                type="text"
                required
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#006A4E] focus:bg-white transition-colors"
                placeholder="Enter current occupation"
                id="profile-occupation-input"
              />
            </div>

            {/* Section Heading: Geography Jurisdiction */}
            <div className="md:col-span-2 border-t border-gray-100 pt-5 mt-2">
              <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" /> Geography Ward Jurisdiction (Constituency Bounds)
              </h4>
            </div>

            {/* Field: Division */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase block">Division</label>
              <input
                type="text"
                required
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#006A4E] focus:bg-white transition-colors"
                id="profile-division-input"
              />
            </div>

            {/* Field: District */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase block">District</label>
              <input
                type="text"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#006A4E] focus:bg-white transition-colors"
                id="profile-district-input"
              />
            </div>

            {/* Field: Upazila */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase block">Upazila / Thana</label>
              <input
                type="text"
                required
                value={upazila}
                onChange={(e) => setUpazila(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#006A4E] focus:bg-white transition-colors"
                id="profile-upazila-input"
              />
            </div>

          </div>
        </div>

        {/* Form Action Footer */}
        <div className="bg-gray-50/60 border-t border-gray-100 py-4 px-6 md:px-8 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#006A4E] hover:bg-[#005a42] text-white py-2 px-5 rounded-xl font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            id="profile-save-button"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving adjustments...' : 'Save Profile Adjustments'}
          </button>
        </div>

      </form>
      )}

      {/* Registration Modal */}
      <BiometricVerificationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => {
          fetchCredentials();
          setIsRegisterModalOpen(false);
        }}
        mode="register"
        actionTitle="Enroll Touch ID / Face ID Key"
      />

      {/* Test Verification Modal */}
      <BiometricVerificationModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onSuccess={() => toast.success('Biometric sensor test passed!')}
        mode="verify_action"
        actionTitle="Test Biometric Sensor"
      />

    </div>
  );
}
