import React from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  Link, 
  useNavigate 
} from 'react-router-dom';
import { Toaster } from 'sonner';
import { 
  Shield, 
  Vote, 
  Calendar, 
  UserCheck, 
  PlusSquare, 
  TrendingUp, 
  User, 
  UserPlus2, 
  Lock, 
  FileText, 
  LogOut, 
  Pocket, 
  CheckCircle2, 
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';

// Context & Protected Gate Imports
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Page Imports
import Login from './pages/Login.jsx';
import MFA from './pages/MFA.jsx';
import Register from './pages/Register.jsx';
import VerifyOTP from './pages/VerifyOTP.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import AdminElections from './pages/admin/Elections.jsx';
import CandidateReview from './pages/admin/CandidateReview.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AuditLogs from './pages/admin/AuditLogs.jsx';
import BlockchainStatus from './pages/admin/BlockchainStatus.jsx';
import BlockchainVisualizer from './pages/BlockchainVisualizer.jsx';
import LiveBDClock from './shared/components/LiveBDClock.jsx';
import VerifyIdentity from './pages/VerifyIdentity.jsx';
import CandidateApply from './pages/candidate/Apply.jsx';
import CandidateDashboard from './pages/candidate/Dashboard.jsx';
import HelpZone from './pages/HelpZone.jsx';
import Elections from './pages/Elections.jsx';
import VotePage from './pages/Vote.jsx';
import VoteSuccess from './pages/VoteSuccess.jsx';
import Verify from './pages/Verify.jsx';
import VoterHistory from './pages/voter/History.jsx';
import Results from './pages/Results.jsx';

// Tax Module Imports
import TaxDashboard from './pages/tax/TaxDashboard.jsx';
import TaxCalculator from './pages/tax/TaxCalculator.jsx';
import TaxReceipt from './pages/tax/TaxReceipt.jsx';
import TaxAdminDashboard from './pages/tax/TaxAdminDashboard.jsx';

// Vehicle Module Imports
import VehicleDashboard from './pages/vehicle/VehicleDashboard.jsx';
import VehicleTransfer from './pages/vehicle/VehicleTransfer.jsx';
import VehicleHistoryPublic from './pages/vehicle/VehicleHistoryPublic.jsx';
import VehicleAdminDashboard from './pages/vehicle/VehicleAdminDashboard.jsx';

// Property Module Imports
import PropertyDashboard from './pages/property/PropertyDashboard.jsx';
import TransferWizard from './pages/property/TransferWizard.jsx';
import BuyerConsentPage from './pages/property/BuyerConsentPage.jsx';
import PropertyHistoryPublic from './pages/property/PropertyHistoryPublic.jsx';
import PropertyAdminDashboard from './pages/property/PropertyAdminDashboard.jsx';

// Civil Registry Module Imports
import CivilDashboard from './pages/civil-registry/CivilDashboard.jsx';
import KaziRegistry from './pages/civil-registry/KaziRegistry.jsx';
import ChairmanArbitration from './pages/civil-registry/ChairmanArbitration.jsx';
import CivilVerifier from './pages/civil-registry/CivilVerifier.jsx';

// OneID Cohesive Pages and Layout Imports
import CitizenLayout from './shared/layouts/CitizenLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import Notifications from './pages/Notifications.jsx';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard.jsx';
import Landing from './pages/Landing.jsx';
import BreadcrumbNav from './shared/components/BreadcrumbNav.jsx';
import Footer from './shared/components/Footer.jsx';
import GlobalSearch from './shared/components/GlobalSearch.jsx';



/**
 * Top Navbar component for authenticated sessions.
 * Displays role-filtered navigation menu options and safe identity logouts.
 */
function AppNavbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  if (!isAuthenticated || !user) return null;
  if (user.role === 'VOTER' || user.role === 'CANDIDATE') return null;

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/login');
  };

  const closeMenu = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur px-4 sm:px-6 py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
        
        {/* LOGO NODE */}
        <Link to="/" className="flex items-center gap-2.5 group" onClick={closeMenu} aria-label="Navigate to Home">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#006a4e] font-sans font-black text-white shadow-md group-hover:scale-105 transition-transform duration-150">
            ID
          </div>
          <div className="text-left">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-800 leading-none">
              OneID <span className="text-[#006a4e]">Bangladesh</span>
            </h1>
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-mono font-bold mt-0.5">
              Unified Governance Platform
            </p>
          </div>
        </Link>

        {/* GLOBAL SEARCH & LIVE BD TIME */}
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-lg mx-4">
          <div className="flex-1 max-w-sm">
            <GlobalSearch />
          </div>
          <LiveBDClock variant="compact" />
        </div>

        {/* MOBILE TOGGLE BUTTON */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-50 border border-slate-200 transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* PROFILE-SPECIFIC TABS */}
        <nav className={`${mobileOpen ? 'flex' : 'hidden'} lg:flex w-full lg:w-auto flex-col lg:flex-row items-stretch lg:items-center gap-4 text-xs font-bold font-sans mt-2 lg:mt-0`}>
          
          {/* Mobile Global Search */}
          <div className="md:hidden w-full pb-2 border-b border-slate-100">
            <GlobalSearch />
          </div>
          
          {/* Super Admin & Admin hubs */}
          {user.role === 'SUPER_ADMIN' && (
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-2">
              <Link 
                to="/admin/super-dashboard" 
                onClick={closeMenu}
                className="text-amber-800 hover:text-amber-950 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors font-bold"
                aria-label="Super Admin Dashboard"
              >
                <Shield className="h-3.5 w-3.5 text-amber-600" /> Super Admin
              </Link>
            </div>
          )}

          {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-2">
              <Link 
                to="/admin/dashboard" 
                onClick={closeMenu}
                className="text-slate-600 hover:text-[#006a4e] bg-slate-50 border border-slate-200/60 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                aria-label="Admin Dashboard"
              >
                <TrendingUp className="h-3.5 w-3.5" /> Dashboard
              </Link>
              <Link 
                to="/admin/elections" 
                onClick={closeMenu}
                className="text-slate-600 hover:text-[#006a4e] bg-slate-50 border border-slate-200/60 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                aria-label="Admin Elections Management"
              >
                <Calendar className="h-3.5 w-3.5" /> Elections
              </Link>
              <Link 
                to="/admin/candidates" 
                onClick={closeMenu}
                className="text-slate-600 hover:text-[#006a4e] bg-slate-50 border border-slate-200/60 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                aria-label="Candidate Reviews"
              >
                <UserCheck className="h-3.5 w-3.5" /> Reviews
              </Link>
              <Link 
                to="/admin/blockchain-status" 
                onClick={closeMenu}
                className="text-slate-600 hover:text-[#006a4e] bg-[#006a4e]/5 border border-[#006a4e]/20 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                aria-label="Blockchain Status"
              >
                <Shield className="h-3.5 w-3.5 text-[#006a4e]" />
                <span>Blockchain</span>
                <span className="relative flex h-2 w-2 ml-0.5" title="Node Online">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </Link>
              <Link 
                to="/admin/audit-logs" 
                onClick={closeMenu}
                className="text-slate-600 hover:text-[#006a4e] bg-slate-50 border border-slate-200/60 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                aria-label="System Audit Logs"
              >
                <FileText className="h-3.5 w-3.5" /> Logs
              </Link>
            </div>
          )}

          {/* Candidate hubs */}
          {(user.role === 'CANDIDATE' || user.role === 'VOTER') && (
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-2">
              <Link 
                to="/candidate/dashboard" 
                onClick={closeMenu}
                className="text-slate-600 hover:text-[#006a4e] bg-slate-50 border border-slate-200/60 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                aria-label="Candidate Workspace"
              >
                <TrendingUp className="h-3.5 w-3.5" /> My Workspace
              </Link>
              <Link 
                to="/candidate/apply" 
                onClick={closeMenu}
                className="text-slate-600 hover:text-[#006a4e] bg-slate-50 border border-slate-200/60 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                aria-label="File Candidate Nomination"
              >
                <PlusSquare className="h-3.5 w-3.5" /> File Nomination
              </Link>
            </div>
          )}

          {/* Voter hub redirect option */}
          {(user.role === 'VOTER' || user.role === 'CANDIDATE') && (
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-2">
              <Link 
                to="/elections" 
                onClick={closeMenu}
                className="text-slate-600 hover:text-[#006a4e] bg-slate-50 border border-slate-200/60 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                aria-label="Voting Ballot Booths"
              >
                <Vote className="h-3.5 w-3.5" /> Ballot Booths
              </Link>
              <Link 
                to="/voter/history" 
                onClick={closeMenu}
                className="text-slate-600 hover:text-[#006a4e] bg-slate-50 border border-slate-200/60 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                aria-label="Voting History"
              >
                <Pocket className="h-3.5 w-3.5" /> History
              </Link>
              <Link
                to="/tax"
                onClick={closeMenu}
                className="text-slate-600 hover:text-[#006a4e] bg-slate-50 border border-slate-200/60 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                aria-label="Tax Filing"
              >
                <FileText className="h-3.5 w-3.5" /> Tax Filing
              </Link>
              <Link
                to="/vehicle"
                onClick={closeMenu}
                className="text-slate-600 hover:text-[#006a4e] bg-slate-50 border border-slate-200/60 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                aria-label="Vehicle BRTA Cabinet"
              >
                🚗 BRTA Cabinet
              </Link>
              <Link
                to="/property"
                onClick={closeMenu}
                className="text-slate-600 hover:text-[#006a4e] bg-slate-50 border border-slate-200/60 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                aria-label="Property Land Cabinet"
              >
                🏡 Land Cabinet
              </Link>
              <Link
                to="/civil-registry"
                onClick={closeMenu}
                className="text-slate-600 hover:text-[#006a4e] bg-slate-50 border border-slate-200/60 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors font-semibold"
                aria-label="Civil Registry"
              >
                📜 Civil Registry
              </Link>
            </div>
          )}

          {/* Tax Admin hub */}
          {(user.role === 'TAX_ADMIN' || user.role === 'ADMIN') && (
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-2">
              <Link 
                to="/tax/admin" 
                onClick={closeMenu}
                className="text-amber-800 hover:text-amber-950 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors font-bold"
                aria-label="Tax Administration"
              >
                <FileText className="h-3.5 w-3.5 text-amber-600" /> Tax Admin
              </Link>
            </div>
          )}

          {/* Vehicle Admin hub */}
          {(user.role === 'VEHICLE_ADMIN' || user.role === 'ADMIN') && (
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-2">
              <Link 
                to="/vehicle/admin" 
                onClick={closeMenu}
                className="text-rose-805 text-red-800 hover:text-red-950 bg-rose-50 border border-red-200 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors font-bold"
                aria-label="Vehicle BRTA Registrar"
              >
                🚗 BRTA Registrar
              </Link>
            </div>
          )}

          {/* Property Admin hub */}
          {(user.role === 'PROPERTY_ADMIN' || user.role === 'ADMIN') && (
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-2">
              <Link 
                to="/property/admin" 
                onClick={closeMenu}
                className="text-emerald-800 hover:text-emerald-950 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors font-bold"
                aria-label="Property Land Registrar"
              >
                🏡 Land Registrar
              </Link>
            </div>
          )}

          {/* Kazi Admin hub */}
          {(user.role === 'KAZI_ADMIN' || user.role === 'ADMIN') && (
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-2">
              <Link 
                to="/civil-registry/kazi" 
                onClick={closeMenu}
                className="text-teal-800 hover:text-teal-950 bg-teal-50 border border-teal-200 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors font-bold"
                aria-label="Kazi Administration Desk"
              >
                🕌 Kazi Desk
              </Link>
            </div>
          )}

          {/* UP Chairman hub */}
          {(user.role === 'LOCAL_AUTHORITY_ADMIN' || user.role === 'ADMIN') && (
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-2">
              <Link 
                to="/civil-registry/chairman" 
                onClick={closeMenu}
                className="text-amber-805 text-amber-800 hover:text-amber-950 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors font-bold"
                aria-label="UP Chairman Administration"
              >
                🏛️ UP Chairman
              </Link>
            </div>
          )}



          {/* User Signout */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 border-t lg:border-t-0 lg:border-l border-slate-205 lg:border-slate-200 pt-3 lg:pt-0 lg:pl-4">
            <div className="flex flex-col text-left lg:text-right leading-tight">
              <span className="text-slate-800 text-xs font-bold">{user.name}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">{user.role} Privilege</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="text-red-000 text-red-650 text-red-600 hover:bg-red-50 p-2.5 lg:p-2 rounded-lg border border-red-150 lg:border-transparent lg:hover:border-red-100 transition-all flex items-center justify-center gap-1.5"
              title="Terminate Secure Session"
              aria-label="Terminate Secure Session"
            >
              <LogOut className="h-4 w-4" /> <span className="lg:hidden text-xs">Terminate Session</span>
            </button>
          </div>

        </nav>

      </div>
    </header>
  );
}

/**
 * Universal Directory Redirect Gate.
 * Routes / directly to specific dashboards according to verified user roles.
 */
function RootRedirect() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Landing />;
  }

  // Redirect role models
  if (user.role === 'SUPER_ADMIN') {
    return <Navigate to="/admin/super-dashboard" replace />;
  } else if (user.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (user.role === 'TAX_ADMIN') {
    return <Navigate to="/tax/admin" replace />;
  } else if (user.role === 'VEHICLE_ADMIN') {
    return <Navigate to="/vehicle/admin" replace />;
  } else if (user.role === 'PROPERTY_ADMIN') {
    return <Navigate to="/property/admin" replace />;
  } else if (user.role === 'KAZI_ADMIN') {
    return <Navigate to="/civil-registry/kazi" replace />;
  } else if (user.role === 'LOCAL_AUTHORITY_ADMIN') {
    return <Navigate to="/civil-registry/chairman" replace />;
  } else if (user.role === 'CANDIDATE' || user.role === 'VOTER') {
    return <Navigate to="/dashboard" replace />;
  } else {
    return <Navigate to="/dashboard" replace />;
  }
}

/**
 * Clean Landing view for voters representing active state elements.
 */
function VoterHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 text-center space-y-6 font-sans">
      <div className="mx-auto h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-150 shadow-sm flex items-center justify-center">
        <Vote className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Voter Ballot Panel Synced</h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto font-medium">
          Welcome, <span className="text-[#006a4e] font-bold">{user?.name}</span>. You are fully enrolled and mapped in the centralized ward system configuration. Your security region coordinate is mapped: <strong className="font-mono">{user?.constituency}</strong>.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-xl mx-auto">
        <button
          onClick={() => navigate('/elections')}
          className="w-full sm:w-auto bg-[#006a4e] hover:bg-[#004e38] text-white font-extrabold text-xs px-6 py-3.5 rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer"
        >
          🗳️ Enter Active Voting Booths
        </button>
        <button
          onClick={() => navigate('/voter/history')}
          className="w-full sm:w-auto bg-slate-800 hover:bg-slate-950 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer"
        >
          📜 View My Voting History
        </button>
        <button
          onClick={() => navigate('/tax')}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer"
        >
          ৳ eVat & Tax Office
        </button>
        <button
          onClick={() => navigate('/vehicle')}
          className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer"
        >
          🚗 Vehicle & Licenses
        </button>
        <button
          onClick={() => navigate('/property')}
          className="w-full sm:w-auto bg-[#006a4e] hover:bg-[#004e38] text-white font-extrabold text-xs px-6 py-3.5 rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer"
        >
          🏡 Land & Title Mutations
        </button>

      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-xl mx-auto space-y-4 text-left">
        <h4 className="font-sans font-bold text-slate-800 flex items-center gap-1.5 text-sm border-b border-slate-100 pb-2">
          <Shield className="h-4.5 w-4.5 text-[#006a4e]" /> Sovereign Decentralization Protocols Checklist:
        </h4>
        <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Local asset and credentials identity actively validated.
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Zero-knowledge proofs prevent linking voter identity to any voter choice block.
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Live block tracking emits receipts to trace in public audit databases instantly.
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Unauthorized layout screen.
 */
function Unauthorized() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-center">
      <div className="max-w-md space-y-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="mx-auto w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center shadow-inner">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-black text-slate-800">Inadequate Session Privileges</h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Your node signature credentials does not contain valid authorization tags to look at this administration portal.
        </p>
        <Link 
          to="/" 
          className="inline-block mt-4 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-lg transition"
        >
          Return to Gate
        </Link>
      </div>
    </div>
  );
}


// Help Wrapper to handle conditional layout
const HelpWrapper = () => {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user) {
    if (user.role === 'VOTER' || user.role === 'CANDIDATE') {
      return (
        <CitizenLayout>
          <HelpZone />
        </CitizenLayout>
      );
    }
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <HelpZone />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <HelpZone />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 flex flex-col justify-start">
          
          <AppNavbar />
          <BreadcrumbNav />

          {/* MAIN PAGE MOUNTE ELEMENTS */}
          <main className="flex-grow">
            <Routes>
              
              {/* Public Enrollment Roots */}
              <Route path="/login" element={<Login />} />
              <Route path="/mfa" element={<MFA />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/blockchain-visualizer" element={<BlockchainVisualizer />} />
              <Route path="/verify-identity" element={<VerifyIdentity />} />

              {/* Secure Admin Gateways */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/elections" 
                element={
                  <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                    <AdminElections />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/candidates" 
                element={
                  <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                    <CandidateReview />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/audit-logs" 
                element={
                  <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                    <AuditLogs />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/blockchain-status" 
                element={
                  <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                    <BlockchainStatus />
                  </ProtectedRoute>
                } 
              />

              {/* Secure Candidate Gateways */}
              <Route 
                path="/candidate/dashboard" 
                element={
                  <ProtectedRoute roles={['VOTER', 'CANDIDATE']}>
                    <CandidateDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/candidate/apply" 
                element={
                  <ProtectedRoute roles={['VOTER', 'CANDIDATE']}>
                    <CandidateApply />
                  </ProtectedRoute>
                } 
              />

              {/* Secure Unified Citizen Dashboard Gateway */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute roles={['VOTER', 'CANDIDATE']}>
                    <CitizenLayout>
                      <Dashboard />
                    </CitizenLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/elections" 
                element={
                  <ProtectedRoute roles={['VOTER', 'CANDIDATE']}>
                    <CitizenLayout>
                      <Elections />
                    </CitizenLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/elections/:id/vote" 
                element={
                  <ProtectedRoute roles={['VOTER', 'CANDIDATE']}>
                    <CitizenLayout>
                      <VotePage />
                    </CitizenLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/vote/success" 
                element={
                  <ProtectedRoute roles={['VOTER', 'CANDIDATE']}>
                    <CitizenLayout>
                      <VoteSuccess />
                    </CitizenLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/voter/history" 
                element={
                  <ProtectedRoute roles={['VOTER', 'CANDIDATE']}>
                    <CitizenLayout>
                      <VoterHistory />
                    </CitizenLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/elections/:id/results" 
                element={
                  <ProtectedRoute roles={['ADMIN', 'VOTER', 'CANDIDATE']}>
                    <Results />
                  </ProtectedRoute>
                } 
              />

              {/* Secure Tax Module Routes */}
              <Route 
                path="/tax" 
                element={
                  <ProtectedRoute roles={['VOTER', 'CANDIDATE', 'ADMIN', 'TAX_ADMIN', 'SUPER_ADMIN']}>
                    <CitizenLayout>
                      <TaxDashboard />
                    </CitizenLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/tax/calculate" 
                element={
                  <ProtectedRoute roles={['VOTER', 'CANDIDATE', 'ADMIN', 'TAX_ADMIN', 'SUPER_ADMIN']}>
                    <CitizenLayout>
                      <TaxCalculator />
                    </CitizenLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/tax/receipt/:receiptNumber" 
                element={
                  <ProtectedRoute roles={['VOTER', 'CANDIDATE', 'ADMIN', 'TAX_ADMIN', 'SUPER_ADMIN']}>
                    <CitizenLayout>
                      <TaxReceipt />
                    </CitizenLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/tax/admin" 
                element={
                  <ProtectedRoute roles={['TAX_ADMIN', 'ADMIN', 'SUPER_ADMIN']}>
                    <TaxAdminDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Secure Vehicle Module Routes */}
              <Route 
                path="/vehicle" 
                element={
                  <ProtectedRoute roles={['VOTER', 'CANDIDATE', 'ADMIN', 'VEHICLE_ADMIN', 'SUPER_ADMIN']}>
                    <CitizenLayout>
                      <VehicleDashboard />
                    </CitizenLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/vehicle/transfer" 
                element={
                  <ProtectedRoute roles={['VOTER', 'CANDIDATE', 'ADMIN', 'VEHICLE_ADMIN', 'SUPER_ADMIN']}>
                    <CitizenLayout>
                      <VehicleTransfer />
                    </CitizenLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/vehicle/admin" 
                element={
                  <ProtectedRoute roles={['VEHICLE_ADMIN', 'ADMIN', 'SUPER_ADMIN']}>
                    <VehicleAdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="/vehicle/:registrationNo/history" element={<VehicleHistoryPublic />} />

              {/* Secure Property Module Routes */}
              <Route 
                path="/property" 
                element={
                  <ProtectedRoute roles={['VOTER', 'CANDIDATE', 'ADMIN', 'PROPERTY_ADMIN', 'SUPER_ADMIN']}>
                    <CitizenLayout>
                      <PropertyDashboard />
                    </CitizenLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/property/transfer" 
                element={
                  <ProtectedRoute roles={['VOTER', 'CANDIDATE', 'ADMIN', 'PROPERTY_ADMIN', 'SUPER_ADMIN']}>
                    <CitizenLayout>
                      <TransferWizard />
                    </CitizenLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/property/consent/:transferId" 
                element={
                  <ProtectedRoute roles={['VOTER', 'CANDIDATE', 'ADMIN', 'PROPERTY_ADMIN', 'SUPER_ADMIN']}>
                    <CitizenLayout>
                      <BuyerConsentPage />
                    </CitizenLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/property/admin" 
                element={
                  <ProtectedRoute roles={['PROPERTY_ADMIN', 'ADMIN', 'SUPER_ADMIN']}>
                    <PropertyAdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="/property/:propertyId/history" element={<PropertyHistoryPublic />} />

              {/* Secure Civil Registry Module Routes */}
              <Route 
                path="/civil-registry" 
                element={
                  <ProtectedRoute roles={['VOTER', 'CANDIDATE', 'ADMIN', 'KAZI_ADMIN', 'LOCAL_AUTHORITY_ADMIN', 'SUPER_ADMIN']}>
                    <CitizenLayout>
                      <CivilDashboard />
                    </CitizenLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/civil-registry/kazi" 
                element={
                  <ProtectedRoute roles={['KAZI_ADMIN', 'ADMIN', 'SUPER_ADMIN']}>
                    <KaziRegistry />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/civil-registry/chairman" 
                element={
                  <ProtectedRoute roles={['LOCAL_AUTHORITY_ADMIN', 'ADMIN', 'SUPER_ADMIN']}>
                    <ChairmanArbitration />
                  </ProtectedRoute>
                } 
              />
              <Route path="/civil-registry/verify" element={<CivilVerifier />} />

              {/* Secure Citizen Custom Pages */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute roles={['VOTER', 'CANDIDATE', 'ADMIN']}>
                    <CitizenLayout>
                      <Profile />
                    </CitizenLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute roles={['VOTER', 'CANDIDATE', 'ADMIN']}>
                    <CitizenLayout>
                      <Profile />
                    </CitizenLayout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/notifications" 
                element={
                  <ProtectedRoute roles={['VOTER', 'CANDIDATE']}>
                    <CitizenLayout>
                      <Notifications />
                    </CitizenLayout>
                  </ProtectedRoute>
                } 
              />
              {/* Public Help Route */}
              <Route 
                path="/help" 
                element={
                  <HelpWrapper />
                } 
              />

              {/* Secure Super Admin Gateway */}
              <Route 
                path="/admin/super-dashboard" 
                element={
                  <ProtectedRoute roles={['SUPER_ADMIN']}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                } 
              />



              {/* Public verification nodes */}
              <Route path="/landing" element={<Landing />} />
              <Route path="/verify" element={<Verify />} />

              {/* Ledger Route Entry Match */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </main>

          <Footer />
          <Toaster position="top-right" closeButton richColors theme="light" />

        </div>
      </Router>
    </AuthProvider>
  );
}
