import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Heart, 
  HelpCircle, 
  FileCheck2, 
  Clock, 
  Users, 
  ShieldCheck, 
  Calendar, 
  Sparkles, 
  DollarSign, 
  AlertTriangle, 
  X, 
  FileText, 
  CheckCircle, 
  TrendingUp, 
  Hourglass,
  RefreshCw,
  Baby,
  Skull,
  PlusCircle,
  Eye,
  Send
} from 'lucide-react';
import api from '../../lib/api.js';
import { toast } from 'sonner';
import NikahnamaCertificate from '../../components/NikahnamaCertificate.jsx';
import BirthCertificate from '../../components/BirthCertificate.jsx';
import DeathCertificate from '../../components/DeathCertificate.jsx';
import DivorceCertificate from '../../components/DivorceCertificate.jsx';
import { HeartCrack } from 'lucide-react';

export default function CivilDashboard() {
  const [activeTab, setActiveTab] = useState('marriage'); // 'marriage', 'birth', 'death'
  const [marriageStatus, setMarriageStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingNotice, setSubmittingNotice] = useState(false);

  // Birth & Death Records state
  const [birthRecords, setBirthRecords] = useState([]);
  const [deathRecords, setDeathRecords] = useState([]);
  const [loadingBirths, setLoadingBirths] = useState(false);
  const [loadingDeaths, setLoadingDeaths] = useState(false);

  // Modals state
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [divorceType, setDivorceType] = useState('TALAQ');
  const [selectedPastMarriage, setSelectedPastMarriage] = useState(null);

  const [showBirthModal, setShowBirthModal] = useState(false);
  const [showDeathModal, setShowDeathModal] = useState(false);
  const [selectedBirth, setSelectedBirth] = useState(null);
  const [selectedDeath, setSelectedDeath] = useState(null);

  // Birth Form
  const [birthForm, setBirthForm] = useState({
    childName: '',
    dateOfBirth: '',
    placeOfBirth: '',
    fatherOneId: '',
    motherOneId: ''
  });
  const [submittingBirth, setSubmittingBirth] = useState(false);

  // Death Form
  const [deathForm, setDeathForm] = useState({
    deceasedOneId: '',
    dateOfDeath: '',
    causeOfDeath: ''
  });
  const [submittingDeath, setSubmittingDeath] = useState(false);

  const [simulatedTimeOffset, setSimulatedTimeOffset] = useState(0);
  const [countdownText, setCountdownText] = useState('');

  // Marriage Application State
  const [myApplications, setMyApplications] = useState([]);
  const [showMarriageAppModal, setShowMarriageAppModal] = useState(false);
  const [marriageAppForm, setMarriageAppForm] = useState({
    partnerOneId: '',
    witness1OneId: '',
    witness2OneId: '',
    mahrAmountBDT: '',
    mahrType: 'PROMPT',
    roleType: 'GROOM',
    religion: 'ISLAM'
  });
  const [submittingMarriageApp, setSubmittingMarriageApp] = useState(false);
  const [verifyingPartner, setVerifyingPartner] = useState(false);
  const [verifiedPartner, setVerifiedPartner] = useState(null);

  const fetchMarriageData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/civil-registry/my-marriage');
      setMarriageStatus(res.data);

      const appRes = await api.get('/civil-registry/marriage/applications');
      if (appRes.data?.applications) {
        setMyApplications(appRes.data.applications);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to align with civil registers.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPartner = async () => {
    if (!marriageAppForm.partnerOneId.trim()) {
      toast.warn('Please enter Partner OneID to verify.');
      return;
    }
    setVerifyingPartner(true);
    try {
      const res = await api.get(`/civil-registry/verify-oneid/${marriageAppForm.partnerOneId.trim()}`);
      setVerifiedPartner(res.data);
      if (res.data?.found) {
        toast.success(`Partner Verified: ${res.data.name}`);
      }
    } catch (err) {
      console.error(err);
      setVerifiedPartner({ found: false });
      toast.error(err.response?.data?.error || 'Partner OneID verification failed.');
    } finally {
      setVerifyingPartner(false);
    }
  };

  const handleApplyMarriage = async (e) => {
    e.preventDefault();
    if (!marriageAppForm.partnerOneId.trim()) {
      toast.error('Partner OneID is required.');
      return;
    }

    setSubmittingMarriageApp(true);
    try {
      const res = await api.post('/civil-registry/marriage/apply', marriageAppForm);
      toast.success(res.data?.message || 'Marriage application submitted successfully!');
      setShowMarriageAppModal(false);
      setMarriageAppForm({
        partnerOneId: '',
        witness1OneId: '',
        witness2OneId: '',
        mahrAmountBDT: '',
        mahrType: 'PROMPT',
        roleType: 'GROOM',
        religion: 'ISLAM'
      });
      setVerifiedPartner(null);
      fetchMarriageData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to submit marriage application.');
    } finally {
      setSubmittingMarriageApp(false);
    }
  };

  const fetchBirthRecords = async () => {
    setLoadingBirths(true);
    try {
      const res = await api.get('/civil-registry/birth');
      if (res.data?.records) {
        setBirthRecords(res.data.records);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBirths(false);
    }
  };

  const fetchDeathRecords = async () => {
    setLoadingDeaths(true);
    try {
      const res = await api.get('/civil-registry/death');
      if (res.data?.records) {
        setDeathRecords(res.data.records);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDeaths(false);
    }
  };

  useEffect(() => {
    fetchMarriageData();
    fetchBirthRecords();
    fetchDeathRecords();
  }, []);

  // Set up divorce notice countdown ticker
  useEffect(() => {
    if (!marriageStatus?.marriage?.divorceProceeding) return;
    
    const proc = marriageStatus.marriage.divorceProceeding;
    if (proc.status === 'FINALIZED') {
      setCountdownText('DISSOLUTION COMPLETED');
      return;
    }

    const interval = setInterval(() => {
      const targetDate = new Date(proc.effectiveDate);
      const now = new Date(Date.now() + simulatedTimeOffset);
      const timeRemain = targetDate.getTime() - now.getTime();

      if (timeRemain <= 0) {
        setCountdownText('90-Day Waiting Window Complete. Verification node authorizes finalization.');
        clearInterval(interval);
      } else {
        const d = Math.floor(timeRemain / (24 * 60 * 60 * 1000));
        const h = Math.floor((timeRemain % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const m = Math.floor((timeRemain % (60 * 60 * 1000)) / (60 * 1000));
        const s = Math.floor((timeRemain % (60 * 1000)) / 1000);
        setCountdownText(`${d} Days : ${h} Hours : ${m} Mins : ${s} Secs Remaining`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [marriageStatus, simulatedTimeOffset]);

  const handleFileNotice = async (e) => {
    e.preventDefault();
    if (!marriageStatus?.marriage?.marriageId) return;

    setSubmittingNotice(true);
    try {
      await api.post('/civil-registry/divorce/notice', {
        marriageId: marriageStatus.marriage.marriageId,
        divorceType
      });
      toast.success('Dissolution notice filed successfully with Union Parishad Chairman.');
      setShowNoticeModal(false);
      fetchMarriageData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to serve Talaq notice.');
    } finally {
      setSubmittingNotice(false);
    }
  };

  const handleRegisterBirth = async (e) => {
    e.preventDefault();
    if (!birthForm.childName || !birthForm.dateOfBirth || !birthForm.placeOfBirth) {
      toast.error('Please complete all required fields for Birth Registration.');
      return;
    }

    setSubmittingBirth(true);
    try {
      const res = await api.post('/civil-registry/birth', birthForm);
      toast.success('Digital Birth Certificate generated & mined to Ledger!');
      setShowBirthModal(false);
      setBirthForm({ childName: '', dateOfBirth: '', placeOfBirth: '', fatherOneId: '', motherOneId: '' });
      fetchBirthRecords();
      if (res.data?.record) {
        setSelectedBirth(res.data.record);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to register birth record.');
    } finally {
      setSubmittingBirth(false);
    }
  };

  const handleRegisterDeath = async (e) => {
    e.preventDefault();
    if (!deathForm.deceasedOneId || !deathForm.dateOfDeath) {
      toast.error('Please provide Deceased OneID and Date of Death.');
      return;
    }

    setSubmittingDeath(true);
    try {
      const res = await api.post('/civil-registry/death', deathForm);
      toast.success('Digital Death Certificate generated & sealed on Ledger!');
      setShowDeathModal(false);
      setDeathForm({ deceasedOneId: '', dateOfDeath: '', causeOfDeath: '' });
      fetchDeathRecords();
      if (res.data?.record) {
        setSelectedDeath(res.data.record);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to register death record.');
    } finally {
      setSubmittingDeath(false);
    }
  };

  const triggerFastForward = () => {
    setSimulatedTimeOffset(90 * 24 * 60 * 60 * 1000 + 5000);
    toast.success('Simulation: Simulated clock shifted 90 days forward.');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans pb-16">
      
      {/* Title Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">OneID Civil Registry Portal</h1>
          <p className="text-xs text-slate-500 font-medium">
            Sovereign birth, death, marriage & divorce certificates built upon the decentralized public ledger core of Bangladesh.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
            Node Status:
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Sync Complete
          </span>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('marriage')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'marriage'
              ? 'bg-[#006A4E] text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Heart className="w-4 h-4" />
          Nikahnama & Marriage Registry
        </button>

        <button
          onClick={() => setActiveTab('birth')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'birth'
              ? 'bg-[#006A4E] text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Baby className="w-4 h-4" />
          Birth Certificates ({birthRecords.length})
        </button>

        <button
          onClick={() => setActiveTab('death')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'death'
              ? 'bg-[#006A4E] text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Skull className="w-4 h-4" />
          Death Certificates ({deathRecords.length})
        </button>
      </div>

      {/* TAB 1: MARRIAGE REGISTRY */}
      {activeTab === 'marriage' && (
        <>
          {loading ? (
            <div className="flex items-center justify-center p-20">
              <RefreshCw className="h-8 w-8 text-[#006a4e] animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* LEFT & CENTER PANEL */}
              <div className="lg:col-span-2 space-y-6">
                
                {marriageStatus?.marriage ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <NikahnamaCertificate marriage={marriageStatus.marriage} />

                    {marriageStatus.marriage.status === 'DIVORCE_PENDING' && marriageStatus.marriage.divorceProceeding && (
                      <div className="bg-amber-50 border border-amber-250 p-6 rounded-2xl shadow-sm space-y-6">
                        
                        <div className="flex items-start gap-3">
                          <div className="bg-amber-100 p-2.5 rounded-xl text-amber-800">
                            <Hourglass className="h-6 w-6 animate-spin text-amber-700" />
                          </div>
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight bg-amber-100 text-amber-800 border border-amber-200">
                              {marriageStatus.marriage.divorceProceeding.status} Wait period
                            </span>
                            <h3 className="text-base font-black text-slate-900">
                              Statutory 90-Day Arbitration Wait Window (Talaq/Mubarat)
                            </h3>
                            <p className="text-xs text-slate-600 font-medium">
                              Under Muslim Marriage Laws Amendment, verbal divorce is strictly invalid. Waiting clock prevents premature finalization.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white border border-slate-200 p-4 rounded-xl text-xs font-medium">
                          
                          <div className="space-y-1 border-l-2 border-[#006a4e] pl-3">
                            <span className="block text-[10px] font-bold text-[#006a4e] uppercase">
                              Step 1: Notice Served
                            </span>
                            <span className="text-[11px] font-black text-slate-800 block">
                              COMPLETE
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {new Date(marriageStatus.marriage.divorceProceeding.noticeFiledAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className={`space-y-1 border-l-2 pl-3 ${
                            marriageStatus.marriage.divorceProceeding.arbitrationFormedAt 
                              ? 'border-[#006a4e]' 
                              : 'border-slate-300'
                          }`}>
                            <span className="block text-[10px] font-bold uppercase text-slate-500">
                              Step 2: Council Formed
                            </span>
                            <span className={`text-[11px] font-black block ${
                              marriageStatus.marriage.divorceProceeding.arbitrationFormedAt ? 'text-[#006a4e]' : 'text-slate-400'
                            }`}>
                              {marriageStatus.marriage.divorceProceeding.arbitrationFormedAt ? 'COMPLETE' : 'PENDING CHAIRMAN'}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {marriageStatus.marriage.divorceProceeding.arbitrationFormedAt 
                                ? new Date(marriageStatus.marriage.divorceProceeding.arbitrationFormedAt).toLocaleDateString()
                                : 'Within 30 Days'}
                            </span>
                          </div>

                          <div className="space-y-1 border-l-2 border-slate-300 pl-3">
                            <span className="block text-[10px] font-bold uppercase text-slate-500">
                              Step 3: Council Attempts
                            </span>
                            <span className="text-[11px] font-black text-slate-800 block">
                              {marriageStatus.marriage.divorceProceeding.reconciliationAttempts} Sessions Logged
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Arbitration attempts
                            </span>
                          </div>

                          <div className="space-y-1 border-l-2 border-slate-300 pl-3">
                            <span className="block text-[10px] font-bold uppercase text-slate-500">
                              Step 4: finalization
                            </span>
                            <span className="text-[11px] font-black text-amber-700 block">
                              90-Day Iddat Loop
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              Ends {new Date(marriageStatus.marriage.divorceProceeding.effectiveDate).toLocaleDateString()}
                            </span>
                          </div>

                        </div>

                        <div className="bg-[#1e293b] border border-slate-700 text-white rounded-xl p-5 text-center shadow-lg font-mono relative overflow-hidden">
                          <span className="text-[10px] tracking-widest font-bold text-amber-400 uppercase">
                            Sovereign Registry Time Lock Active
                          </span>
                          
                          <h4 className="text-lg md:text-xl font-bold tracking-tight text-yellow-100 mt-2">
                            {countdownText}
                          </h4>

                          <div className="mt-4 flex justify-center gap-2">
                            <button
                              onClick={triggerFastForward}
                              className="bg-amber-600 hover:bg-amber-700 font-sans text-[11px] font-black uppercase text-white px-3.5 py-1.5 rounded-lg border border-amber-500 shadow transition flex items-center gap-1 cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5" /> Demo Fast Forward Time
                            </button>
                          </div>
                        </div>

                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6"
                  >
                    <div className="text-center space-y-4">
                      <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-150 flex items-center justify-center shadow-inner">
                        <Heart className="h-8 w-8 animate-pulse text-[#006a4e]" />
                      </div>
                      
                      <div className="max-w-md mx-auto space-y-2">
                        <h3 className="text-xl font-black text-slate-900 uppercase">
                          Civil Status: Eligible To Solemnize (Single)
                        </h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          You do not hold any active registered marriages. Bride & Groom can apply for marriage online through the OneID Sovereign Civil Registry.
                        </p>
                      </div>

                      <div className="flex justify-center pt-2">
                        <button
                          onClick={() => setShowMarriageAppModal(true)}
                          className="bg-[#006a4e] hover:bg-[#004e38] text-white font-black text-xs uppercase px-6 py-3 rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
                        >
                          <Heart className="w-4 h-4 text-pink-300" /> Apply for Marriage (Wedding Registration)
                        </button>
                      </div>

                      <div className="border-t border-slate-100 pt-4 max-w-sm mx-auto">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                          OneID Legal Certification Badge
                        </span>
                        <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-150 rounded-lg px-3 py-1 text-emerald-800 text-[10px] font-black uppercase">
                          <ShieldCheck className="h-3.5 w-3.5 text-[#006a4e]" /> Legally Single / Free-To-Marry
                        </div>
                      </div>
                    </div>

                    {/* Pending Marriage Applications if any */}
                    {myApplications.length > 0 && (
                      <div className="border-t border-slate-200 pt-6 space-y-4 text-left">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                          <FileCheck2 className="h-4 w-4 text-[#006a4e]" />
                          My Submitted Marriage Applications ({myApplications.length})
                        </h4>

                        <div className="space-y-3">
                          {myApplications.map((app) => (
                            <div key={app.id} className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl text-xs space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-slate-900">App ID: {app.marriageId}</span>
                                <span className="bg-amber-100 text-amber-800 font-black text-[9px] uppercase px-2 py-0.5 rounded-full border border-amber-300">
                                  {app.status === 'PENDING_APPROVAL' ? 'Awaiting Kazi Approval' : app.status}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 font-medium">
                                <div><span className="text-slate-400">Groom OneID:</span> <span className="font-mono font-bold">{app.groomOneId}</span></div>
                                <div><span className="text-slate-400">Bride OneID:</span> <span className="font-mono font-bold">{app.brideOneId}</span></div>
                                <div><span className="text-slate-400">Mahr Amount:</span> <span className="font-bold text-[#006a4e]">৳ {app.mahrAmountBDT ? app.mahrAmountBDT.toLocaleString() : 'N/A'}</span></div>
                                <div><span className="text-slate-400">Applied On:</span> <span className="font-mono">{new Date(app.registrationDate).toLocaleDateString()}</span></div>
                              </div>
                              <p className="text-[10px] text-amber-800 font-bold bg-amber-100/50 p-2 rounded-lg">
                                ⏳ Your wedding application has been queued for Licensed Kazi verification and Kabinnama issuance.
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Past Marriages & Dissolution Records */}
                {marriageStatus?.pastMarriages && marriageStatus.pastMarriages.length > 0 && (
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <HeartCrack className="h-5 w-5 text-red-600" />
                      Past Marriages & Dissolution Logs ({marriageStatus.pastMarriages.length})
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Sovereign record logs of finalized marital dissolutions. Click any record to inspect or download the official Divorce Certificate.
                    </p>

                    <div className="space-y-3">
                      {marriageStatus.pastMarriages.map((pm) => (
                        <div key={pm.id} className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl text-xs space-y-3 hover:shadow-xs transition-shadow">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="bg-red-50 border border-red-200 text-red-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                                Dissolved
                              </span>
                              <h4 className="font-bold text-slate-800 mt-1.5 font-mono">
                                Original Reg: {pm.marriageId}
                              </h4>
                            </div>
                            <button
                              onClick={() => setSelectedPastMarriage(pm)}
                              className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition shadow-3xs cursor-pointer flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" /> View Certificate
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 font-medium pt-1 border-t border-slate-200/50">
                            <div>
                              <span className="text-slate-400">Groom:</span> <span className="font-mono">{pm.groomOneId}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Bride:</span> <span className="font-mono">{pm.brideOneId}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Filing Type:</span> <span className="font-bold uppercase text-stone-600">{pm.divorceProceeding?.divorceType || 'TALAQ'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Dissolved On:</span> <span className="font-mono">
                                {pm.divorceProceeding?.actualEffectiveDate 
                                  ? new Date(pm.divorceProceeding.actualEffectiveDate).toLocaleDateString()
                                  : pm.divorceProceeding?.effectiveDate
                                    ? new Date(pm.divorceProceeding.effectiveDate).toLocaleDateString()
                                    : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* RIGHT SIDE PANEL */}
              <div className="space-y-6">
                
                {marriageStatus?.marriage && marriageStatus.marriage.status === 'ACTIVE' && (
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" /> Civil Registry Operations
                    </h3>
                    
                    <p className="text-xs text-slate-500 font-medium">
                      If marital obligations cannot be fulfilled, either citizen holds the legal privilege to request dissolution by serving immediate written notice according to the Muslim Marriages Act 1974.
                    </p>

                    <button
                      onClick={() => setShowNoticeModal(true)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase py-2.5 px-4 rounded-xl shadow transition tracking-wide text-center block cursor-pointer"
                    >
                      Serve Talaq/Mubarat Notice
                    </button>
                  </div>
                )}

                <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl shadow border border-slate-800 space-y-4 relative overflow-hidden">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-emerald-400" /> Executive Legal Compliance
                  </h3>

                  <div className="space-y-3 text-[11px] text-slate-300 leading-relaxed font-sans">
                    <div className="space-y-1">
                      <span className="font-bold text-emerald-400 block uppercase">• Anti-Bigamy Lock</span>
                      <p>OneID validates status dynamically across all registrars.</p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-emerald-400 block uppercase">• 90-Day Mandatory Buffer</span>
                      <p>Unilateral Talaq is frozen inside a 90-day time lock.</p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-emerald-400 block uppercase">• Union Parishad Arbitration</span>
                      <p>Local chairman forms an Arbitration Council within 30 days of filing.</p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}
        </>
      )}

      {/* TAB 2: BIRTH CERTIFICATES */}
      {activeTab === 'birth' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Baby className="w-5 h-5 text-emerald-600" />
                Digital Birth Registration & Certificates
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Apply for new child birth certificates, view cryptographic ledger seals, and download official QR-verified certificates.
              </p>
            </div>

            <button
              onClick={() => setShowBirthModal(true)}
              className="px-4 py-2.5 bg-[#006A4E] hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              Register New Birth
            </button>
          </div>

          {/* Viewer Modal if Birth Certificate is selected */}
          {selectedBirth && (
            <div className="bg-slate-50 p-6 rounded-2xl border border-emerald-200 relative">
              <button
                onClick={() => setSelectedBirth(null)}
                className="absolute top-4 right-4 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-3 py-1 rounded-lg"
              >
                Close Preview
              </button>
              <BirthCertificate birthRecord={selectedBirth} />
            </div>
          )}

          {/* List of Birth Records */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Registered Birth Records</h3>

            {loadingBirths ? (
              <div className="flex justify-center p-8">
                <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
              </div>
            ) : birthRecords.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
                <Baby className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">No birth records found on your profile.</p>
                <button
                  onClick={() => setShowBirthModal(true)}
                  className="text-xs text-emerald-600 font-bold hover:underline"
                >
                  Click here to register a birth record
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {birthRecords.map((b) => (
                  <div key={b.id} className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 transition-all bg-white flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{b.childName}</h4>
                      <p className="text-xs text-slate-500">
                        DOB: {new Date(b.dateOfBirth).toLocaleDateString()} • {b.placeOfBirth}
                      </p>
                      <p className="text-[10px] font-mono text-emerald-700 mt-1">BRN: {b.id}</p>
                    </div>

                    <button
                      onClick={() => setSelectedBirth(b)}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Certificate
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DEATH CERTIFICATES */}
      {activeTab === 'death' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Skull className="w-5 h-5 text-slate-800" />
                Digital Death Registration & Certificates
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Register civil death records, deactivate OneID accounts, and print official QR-verified death certificates.
              </p>
            </div>

            <button
              onClick={() => setShowDeathModal(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              Register Death Record
            </button>
          </div>

          {/* Viewer Modal if Death Certificate is selected */}
          {selectedDeath && (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-300 relative">
              <button
                onClick={() => setSelectedDeath(null)}
                className="absolute top-4 right-4 text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-3 py-1 rounded-lg"
              >
                Close Preview
              </button>
              <DeathCertificate deathRecord={selectedDeath} />
            </div>
          )}

          {/* List of Death Records */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Registered Death Records</h3>

            {loadingDeaths ? (
              <div className="flex justify-center p-8">
                <RefreshCw className="w-6 h-6 text-slate-600 animate-spin" />
              </div>
            ) : deathRecords.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
                <Skull className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">No death records found.</p>
                <button
                  onClick={() => setShowDeathModal(true)}
                  className="text-xs text-slate-700 font-bold hover:underline"
                >
                  Click here to log a civil death registration
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deathRecords.map((d) => (
                  <div key={d.id} className="p-4 rounded-xl border border-slate-200 hover:border-slate-800 transition-all bg-white flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Deceased OneID: {d.deceasedOneId}</h4>
                      <p className="text-xs text-slate-500">
                        DOD: {new Date(d.dateOfDeath).toLocaleDateString()} • Cause: {d.causeOfDeath || 'Natural Causes'}
                      </p>
                      <p className="text-[10px] font-mono text-slate-600 mt-1">DRN: {d.id}</p>
                    </div>

                    <button
                      onClick={() => setSelectedDeath(d)}
                      className="px-3 py-1.5 bg-slate-100 text-slate-800 hover:bg-slate-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Certificate
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: REGISTER BIRTH */}
      {showBirthModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden"
          >
            <div className="bg-[#006A4E] text-white px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Baby className="h-5 w-5" />
                <h3 className="text-sm font-bold uppercase tracking-tight">
                  Register Digital Birth Certificate
                </h3>
              </div>
              <button
                onClick={() => setShowBirthModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterBirth} className="p-6 space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Child's Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aayan Rahman"
                  value={birthForm.childName}
                  onChange={(e) => setBirthForm({ ...birthForm, childName: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={birthForm.dateOfBirth}
                    onChange={(e) => setBirthForm({ ...birthForm, dateOfBirth: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Place of Birth *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Square Hospital, Dhaka"
                    value={birthForm.placeOfBirth}
                    onChange={(e) => setBirthForm({ ...birthForm, placeOfBirth: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Father's OneID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. BD-880190012345"
                    value={birthForm.fatherOneId}
                    onChange={(e) => setBirthForm({ ...birthForm, fatherOneId: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mother's OneID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. BD-880190098765"
                    value={birthForm.motherOneId}
                    onChange={(e) => setBirthForm({ ...birthForm, motherOneId: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBirthModal(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBirth}
                  className="px-5 py-2.5 bg-[#006A4E] hover:bg-emerald-800 text-white font-bold rounded-xl shadow transition-all flex items-center gap-2"
                >
                  {submittingBirth ? 'Processing...' : 'Generate & Register Birth Certificate'}
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: REGISTER DEATH */}
      {showDeathModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden"
          >
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Skull className="h-5 w-5" />
                <h3 className="text-sm font-bold uppercase tracking-tight">
                  Register Civil Death Record
                </h3>
              </div>
              <button
                onClick={() => setShowDeathModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterDeath} className="p-6 space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Deceased OneID Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BD-880190012345"
                  value={deathForm.deceasedOneId}
                  onChange={(e) => setDeathForm({ ...deathForm, deceasedOneId: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Date of Death *</label>
                <input
                  type="date"
                  required
                  value={deathForm.dateOfDeath}
                  onChange={(e) => setDeathForm({ ...deathForm, dateOfDeath: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Stated Cause of Death</label>
                <input
                  type="text"
                  placeholder="e.g. Natural Causes / Cardiac Arrest"
                  value={deathForm.causeOfDeath}
                  onChange={(e) => setDeathForm({ ...deathForm, causeOfDeath: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeathModal(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDeath}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow transition-all flex items-center gap-2"
                >
                  {submittingDeath ? 'Processing...' : 'Register Death & Issue Certificate'}
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Marriage Application Modal (Bride/Groom) */}
      {showMarriageAppModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="bg-[#006a4e] px-6 py-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-300" />
                <h3 className="text-sm font-black uppercase tracking-tight">
                  Marriage Application (Kabinnama Request)
                </h3>
              </div>
              <button
                onClick={() => setShowMarriageAppModal(false)}
                className="text-white/80 hover:text-white bg-white/10 p-1.5 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleApplyMarriage} className="p-6 space-y-4 text-xs font-medium">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-emerald-900 leading-relaxed">
                <strong>📜 Notice:</strong> Your application will be submitted directly to the Licensed Kazi Desk. Once approved by the Kazi, your digital Kabinnama certificate will be issued.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Your Role in Marriage *</label>
                  <select
                    value={marriageAppForm.roleType}
                    onChange={(e) => setMarriageAppForm({ ...marriageAppForm, roleType: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#006a4e]"
                  >
                    <option value="GROOM">Groom (বর)</option>
                    <option value="BRIDE">Bride (কনে)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Religion / Protocol *</label>
                  <select
                    value={marriageAppForm.religion}
                    onChange={(e) => setMarriageAppForm({ ...marriageAppForm, religion: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#006a4e]"
                  >
                    <option value="ISLAM">Islam (Muslim Code 1974)</option>
                    <option value="HINDU">Hindu Marriage Act</option>
                    <option value="CHRISTIAN">Christian Marriage Act</option>
                    <option value="SPECIAL">Special Marriage Act</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {marriageAppForm.roleType === 'GROOM' ? 'Bride (কনে)' : 'Groom (বর)'} OneID *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. BD-880190012345 or BD-NID-..."
                    value={marriageAppForm.partnerOneId}
                    onChange={(e) => setMarriageAppForm({ ...marriageAppForm, partnerOneId: e.target.value })}
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 outline-none focus:ring-2 focus:ring-[#006a4e]"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyPartner}
                    disabled={verifyingPartner}
                    className="bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {verifyingPartner ? 'Verifying...' : 'Verify Partner'}
                  </button>
                </div>
                {verifiedPartner && (
                  <p className={`mt-1.5 text-[11px] font-bold ${verifiedPartner.found ? 'text-emerald-700' : 'text-red-600'}`}>
                    {verifiedPartner.found 
                      ? `✓ Verified: ${verifiedPartner.name || 'Valid OneID'} (Status: ${verifiedPartner.maritalStatus || 'SINGLE'})`
                      : '❌ OneID Partner record not found or invalid.'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mahr / Dower Fee (BDT) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 500000"
                    value={marriageAppForm.mahrAmountBDT}
                    onChange={(e) => setMarriageAppForm({ ...marriageAppForm, mahrAmountBDT: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#006a4e]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mahr Deferred/Prompt *</label>
                  <select
                    value={marriageAppForm.mahrType}
                    onChange={(e) => setMarriageAppForm({ ...marriageAppForm, mahrType: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#006a4e]"
                  >
                    <option value="PROMPT">Prompt (নগদ / Muajjal)</option>
                    <option value="DEFERRED">Deferred (বাকী / Muwajjal)</option>
                    <option value="PARTLY_PROMPT">Partly Prompt / Deferred</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Witness 1 OneID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. BD-88017..."
                    value={marriageAppForm.witness1OneId}
                    onChange={(e) => setMarriageAppForm({ ...marriageAppForm, witness1OneId: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 outline-none focus:ring-2 focus:ring-[#006a4e]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Witness 2 OneID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. BD-88018..."
                    value={marriageAppForm.witness2OneId}
                    onChange={(e) => setMarriageAppForm({ ...marriageAppForm, witness2OneId: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 outline-none focus:ring-2 focus:ring-[#006a4e]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowMarriageAppModal(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMarriageApp}
                  className="px-6 py-2.5 bg-[#006a4e] hover:bg-[#004e38] text-white font-black uppercase text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
                >
                  {submittingMarriageApp ? 'Submitting Application...' : 'Submit Application to Kazi'}
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden"
          >
            <div className="bg-red-50 px-5 py-4 border-b border-red-100 flex justify-between items-center">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <h3 className="text-xs font-black uppercase tracking-tight">
                  Serve Cryptographic Talaq Notice
                </h3>
              </div>
              <button
                onClick={() => setShowNoticeModal(false)}
                className="text-slate-400 hover:text-slate-700 bg-white border border-slate-150 p-1.5 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleFileNotice} className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-[11px] text-amber-800 leading-relaxed font-medium">
                <strong>⚠️ LEGAL DECLARATION REQUIREMENT:</strong> Under Section 7 of Muslim Marriages/Divorces Act, this notice will be dispatched immediately to the Union Parishad Chairman node for Arbitration setup.
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">
                  Select Notice Filing Protocol
                </label>
                <div className="grid grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setDivorceType('TALAQ')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-start transition ${
                      divorceType === 'TALAQ' 
                        ? 'border-red-600 bg-red-50/50 text-red-900' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="font-bold text-xs uppercase block">Talaq (Unilateral)</span>
                    <span className="text-[9px] mt-0.5 text-slate-450 leading-tight block">Served by husband to spouse and local Parishad.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDivorceType('MUBARAT')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-start transition ${
                      divorceType === 'MUBARAT' 
                        ? 'border-red-600 bg-red-50/50 text-red-900' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="font-bold text-xs uppercase block">Mubarat (Mutual)</span>
                    <span className="text-[9px] mt-0.5 text-slate-450 leading-tight block">Mutual agreement of dissolution with joint signature keys.</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNotice}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase py-2.5 rounded-xl shadow transition cursor-pointer disabled:opacity-50"
                >
                  {submittingNotice ? 'Logging with Chairman...' : 'Confirm NOTICE filing'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {selectedPastMarriage && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden relative p-6 space-y-6"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight flex items-center gap-1.5">
                <FileText className="h-5 w-5 text-red-600" />
                Sovereign Dissolution Certificate Preview
              </h3>
              <button
                onClick={() => setSelectedPastMarriage(null)}
                className="text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-lg transition cursor-pointer font-bold border border-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[70vh] p-2">
              <DivorceCertificate marriage={selectedPastMarriage} />
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
