import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, FileText, ChevronDown, BookOpen, ShieldCheck, Mail, MessageCircle, 
  Search, X, CheckCircle2, ArrowRight, ExternalLink, Printer, Download,
  Vote, Home, Landmark, Heart, Car, ShieldAlert, Send, Copy, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

const MANUAL_DETAILS = [
  {
    id: "voting",
    title: "Voting & Election Flow",
    category: "Democracy & Elections",
    icon: Vote,
    color: "from-emerald-600 to-teal-700",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    desc: "Learn how to cast, verify, and track your cryptographic ballot on the OneID blockchain ledger.",
    targetUrl: "/elections",
    targetLabel: "Go to Active Elections",
    prerequisites: [
      "Verified OneID Citizen Account (NID & DOB matched)",
      "Active constituency registration in Bangladesh election database",
      "Valid mobile phone or email registered for MFA OTP"
    ],
    steps: [
      {
        number: "01",
        title: "Access Active Constituency Elections",
        description: "Navigate to the Elections module. The system automatically fetches your registered constituency (e.g., Dhaka-10) and displays active national or local ballots."
      },
      {
        number: "02",
        title: "Select Candidate & Review Platform",
        description: "Review candidate profiles, electoral manifestos, and party symbols. Click 'Cast Vote' to open the secure cryptographic ballot box."
      },
      {
        number: "03",
        title: "Multi-Factor Authorization (MFA)",
        description: "An automated 6-digit OTP is dispatched via SMS or Email. Enter the code to authorize ballot encryption and verify voter eligibility."
      },
      {
        number: "04",
        title: "Blind Token Hash Generation & Ledger Write",
        description: "Your selection is anonymized into a cryptographic zero-knowledge hash. The vote is mined into the next block on the OneID Merkle Tree ledger."
      },
      {
        number: "05",
        title: "Receive Cryptographic Ballot Receipt",
        description: "An immutable Receipt ID (e.g., #VOTE-8F39A1) is issued. You can paste this ID into the Public Ledger Explorer at any time to confirm your vote was counted without revealing candidate identity."
      }
    ],
    faqs: [
      { q: "Can anyone see who I voted for?", a: "No. The system uses blind token cryptography. Only the hash presence and candidate tally are recorded on the public ledger." },
      { q: "Can I vote more than once?", a: "No. Once a vote block is written with your OneID token for a specific election ID, duplicate attempts are rejected by the blockchain smart contract." }
    ]
  },
  {
    id: "property",
    title: "Property Transfer Wizard",
    category: "Land & Property Registry",
    icon: Home,
    color: "from-blue-600 to-indigo-700",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    desc: "Step-by-step guide to digital land deeds, mutation certificates, and peer-to-peer consent flows.",
    targetUrl: "/property",
    targetLabel: "Open Property Dashboard",
    prerequisites: [
      "Registered Property Record in OneID Land Registry (CS/RS/BS Khatian)",
      "Tax Clearance Certificate from NBR for the current fiscal year",
      "Buyer's verified OneID number"
    ],
    steps: [
      {
        number: "01",
        title: "Initiate Deed Transfer Proposal",
        description: "From your Property Locker, click 'Transfer Property'. Enter the buyer's OneID, agreed sale price in BDT, and deed boundary dimensions."
      },
      {
        number: "02",
        title: "Buyer Digital Consent & Sign-Off",
        description: "The buyer receives an active transfer notification in their OneID portal. They review land boundary maps, chain of ownership history, and sign with MFA."
      },
      {
        number: "03",
        title: "Land Tax & Stamp Duty Settlement",
        description: "The portal calculates mandatory government stamp duties and mutation fees. Payment can be processed online via integrated mobile/e-banking."
      },
      {
        number: "04",
        title: "Sub-Register / Land Officer Audit",
        description: "The district Sub-Register inspects the cryptographic deed payload and confirms no active civil court injunctions or duplicate land claims exist."
      },
      {
        number: "05",
        title: "Deed Mutation & Ledger Update",
        description: "Upon approval, ownership is updated on the ledger. A digital e-Namjari (Mutation) certificate is generated with a QR code for instant instant validation."
      }
    ],
    faqs: [
      { q: "What prevents land dual-selling fraud?", a: "The OneID ledger locks property records during active transfers. A property cannot be transferred if an active transaction or dispute flag is open." },
      { q: "How do I verify a seller's deed?", a: "Enter the Deed Hash or Khatian number in the Property Verifier to view full cryptographic chain-of-ownership logs." }
    ]
  },
  {
    id: "tax",
    title: "Tax & NBR Integration",
    category: "Revenue & Finance",
    icon: Landmark,
    color: "from-amber-600 to-orange-700",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    desc: "How to calculate income tax, submit e-Returns, and generate official NBR clearance certificates.",
    targetUrl: "/tax",
    targetLabel: "Access Tax Portal",
    prerequisites: [
      "Assigned 12-digit e-TIN linked to your OneID",
      "Income statement, asset records, and investment proof documents"
    ],
    steps: [
      {
        number: "01",
        title: "Auto-Fetch Income & Asset Profile",
        description: "Open the Tax Dashboard. The system aggregates salary, land assets, and vehicle holdings linked to your OneID into an integrated return statement."
      },
      {
        number: "02",
        title: "Run Tax Slab Calculation",
        description: "Use the interactive Tax Calculator. Income is calculated according to official NBR brackets (Exempt up to ৳3.5L, 5%, 10%, 15%, 20%, 25%)."
      },
      {
        number: "03",
        title: "Claim Investment Rebates",
        description: "Enter eligible investments (DPS, Stock Market, Sanchayapatra, Provident Fund) to claim up to 15% tax rebate on total payable tax."
      },
      {
        number: "04",
        title: "Submit E-Return & Pay Online",
        description: "Review your final tax liability and click 'Submit Tax Return'. Clear any outstanding dues directly via online payment channels."
      },
      {
        number: "05",
        title: "Download Tax Clearance Certificate",
        description: "Once submitted, download your official NBR Acknowledgment Receipt and Tax Clearance Certificate complete with digital stamp."
      }
    ],
    faqs: [
      { q: "Is e-Filing mandatory for OneID users?", a: "Yes, all citizens with taxable income or asset holdings exceeding threshold limits must file annual returns via OneID." }
    ]
  },
  {
    id: "civil",
    title: "Civil Registry (Marriage / Divorce)",
    category: "Civil Status & Identity",
    icon: Heart,
    color: "from-rose-600 to-pink-700",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
    desc: "Guide for digital Nikahnama registration, Kazi verification, and Union Parishad arbitration flows.",
    targetUrl: "/civil-registry",
    targetLabel: "Go to Civil Registry",
    prerequisites: [
      "Verified Groom and Bride OneID numbers",
      "Registered licensed Kazi credentials",
      "Details of two adult witnesses and Mahr amount"
    ],
    steps: [
      {
        number: "01",
        title: "Kazi Initiates Digital Nikahnama",
        description: "The licensed Kazi logs into the Nikahnama module and inputs the Groom OneID, Bride OneID, witness NIDs, and prompt Mahr / Deferred Mahr terms."
      },
      {
        number: "02",
        title: "Dual Biometric & MFA Verification",
        description: "Both Groom and Bride receive verification requests on their OneID mobile apps. They review terms and approve via MFA OTP or fingerprint scan."
      },
      {
        number: "03",
        title: "Digital Register Signature & Hash Seal",
        description: "Kazi digitally signs the entry. The Nikahnama contract is assigned a unique Registration ID and stored on the civil registry ledger."
      },
      {
        number: "04",
        title: "Talaq / Divorce Notice Procedure",
        description: "In case of divorce proceedings, a formal notice is logged in accordance with the Muslim Family Laws Ordinance 1961. Notice is served to the Union Parishad Chairman."
      },
      {
        number: "05",
        title: "90-Day Mandatory Arbitration Window",
        description: "The Chairman convenes up to 3 reconciliation meetings over 90 days. If reconciliation fails, the final divorce certificate is issued automatically."
      }
    ],
    faqs: [
      { q: "Can I download my Nikahnama certificate anytime?", a: "Yes. Authenticated spouses can view and print their QR-verified Digital Nikahnama from the Civil Registry portal." }
    ]
  },
  {
    id: "vehicle",
    title: "Vehicle & Transport Licensing",
    category: "BRTA & Public Transit",
    icon: Car,
    color: "from-purple-600 to-indigo-800",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    desc: "Manage BRTA vehicle ownership, driving license renewals, road tax, and e-chalan traffic fines.",
    targetUrl: "/vehicle",
    targetLabel: "Manage Vehicles",
    prerequisites: [
      "Vehicle Chassis / Engine Number or Smart Driving License ID",
      "Valid fitness certificate and insurance policy"
    ],
    steps: [
      {
        number: "01",
        title: "Link Vehicle Chassis to OneID",
        description: "Add your vehicle using Chassis and Registration Number. Your digital Blue Book is immediately generated."
      },
      {
        number: "02",
        title: "Pay Road Tax & Fitness Renewal",
        description: "View upcoming road tax expiry dates. Pay renewal fees online to instantly update your vehicle's digital fitness status."
      },
      {
        number: "03",
        title: "Digital Ownership Transfer",
        description: "Initiate vehicle sale by inputting buyer OneID. Upon buyer payment & BRTA verification, ownership shifts seamlessly."
      },
      {
        number: "04",
        title: "E-Chalan Traffic Violation Settlement",
        description: "Traffic police issue fines linked to your Driving License. Pay fines instantly to clear license points."
      }
    ],
    faqs: [
      { q: "How do traffic police verify my license?", a: "Police scan your OneID QR code or license number on their hand-held terminals for real-time status." }
    ]
  },
  {
    id: "security",
    title: "Security & OneID Authentication",
    category: "Cybersecurity & Privacy",
    icon: ShieldAlert,
    color: "from-slate-700 to-slate-900",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
    desc: "Understanding MFA, WebAuthn passkeys, session security, and immutable audit logs.",
    targetUrl: "/settings",
    targetLabel: "Security Settings",
    prerequisites: [
      "Registered email & phone number",
      "Optional WebAuthn device (Biometric TouchID/FaceID)"
    ],
    steps: [
      {
        number: "01",
        title: "Password & JWT Token Layer",
        description: "All access is authenticated using salted bcrypt password hashing and 7-day secure JSON Web Tokens (JWT)."
      },
      {
        number: "02",
        title: "Firebase Multi-Factor Authentication",
        description: "Critical civic transactions require secondary SMS or Email OTP verification powered by Firebase Auth."
      },
      {
        number: "03",
        title: "Immutable Security Audit Logs",
        description: "Every login, transaction attempt, and credential modification is logged with IP address and timestamp on our tamper-proof ledger."
      }
    ],
    faqs: [
      { q: "What should I do if I suspect unauthorized access?", a: "Immediately reset your password in Security Settings and revoke active sessions." }
    ]
  }
];

const HelpZone = () => {
  const [searchParams] = useSearchParams();
  const [activeFaq, setActiveFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedManual, setSelectedManual] = useState(null);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportForm, setSupportForm] = useState({
    topic: 'Technical Fault',
    oneid: '',
    email: '',
    message: ''
  });
  const [submittingSupport, setSubmittingSupport] = useState(false);

  // Auto open manual if passed in search params
  useEffect(() => {
    const manualParam = searchParams.get('manual');
    if (manualParam) {
      const found = MANUAL_DETAILS.find(m => m.id === manualParam || m.title.toLowerCase().includes(manualParam.toLowerCase()));
      if (found) {
        setSelectedManual(found);
      }
    }
  }, [searchParams]);

  const faqs = [
    {
      question: "What is Bangladesh OneID?",
      answer: "Bangladesh OneID is a unified digital identity standard. It links all your civic services including voting, tax compliance, property records, civil registry, and vehicle licensing into a single, immutable, blockchain-secured profile."
    },
    {
      question: "How does the blockchain secure my vote?",
      answer: "Your vote is recorded as a cryptographic hash on our ledger. It uses Merkle Trees to ensure data integrity, meaning no one (not even administrators) can alter or delete your ballot once cast. You receive a blind token receipt to verify it."
    },
    {
      question: "Can I transfer property entirely online?",
      answer: "Yes. Both buyer and seller use cryptographic signatures (OTP/MFA) to sign the digital deed. Once both parties consent and the payment is verified, the Land Ministry Admin approves it, transferring ownership instantly."
    },
    {
      question: "Why do I need a Firebase verification code?",
      answer: "For critical actions like transferring a vehicle or modifying a civil record, Multi-Factor Authentication (MFA) ensures that only you, the verified owner of the OneID, are authorizing the transaction."
    },
    {
      question: "How do I check my road tax or traffic fines?",
      answer: "Navigate to the 'Vehicle & Transport' module. You can view your registered vehicles, pending road taxes, and any traffic violations tied to your Driving License."
    },
    {
      question: "Is my data scalable and highly available?",
      answer: "Yes, the system leverages cloud infrastructure with distributed PostgreSQL (Cloud SQL) for relational data and blockchain logic for transaction sealing. It guarantees high availability, rapid reads, and horizontally scalable storage."
    }
  ];

  const filteredFaqs = faqs.filter(f => 
    f.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredManuals = MANUAL_DETAILS.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    if (!supportForm.message.trim()) {
      toast.error('Please enter a message for support.');
      return;
    }
    setSubmittingSupport(true);
    setTimeout(() => {
      setSubmittingSupport(false);
      setShowSupportModal(false);
      const ticketId = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
      toast.success(`Support Ticket Created! Reference ID: ${ticketId}. Our team will respond shortly.`);
      setSupportForm({ topic: 'Technical Fault', oneid: '', email: '', message: '' });
    }, 1000);
  };

  const handlePrintManual = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-emerald-900 via-[#006A4E] to-teal-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Official Documentation & Help Desk
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
            <HelpCircle className="w-9 h-9 text-emerald-300" />
            Citizen Help Zone & Manuals
          </h1>
          <p className="text-emerald-100 text-sm md:text-base leading-relaxed">
            Welcome to the centralized support and documentation portal. Access comprehensive step-by-step system manuals, platform workflows, security guidelines, and technical FAQs covering all modules of Bangladesh OneID.
          </p>

          {/* Search Bar */}
          <div className="pt-2">
            <div className="relative max-w-xl">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search manuals, FAQs, processes (e.g., voting, property, tax)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3.5 bg-white text-slate-800 placeholder-slate-400 text-sm font-medium rounded-2xl shadow-lg border-0 focus:ring-2 focus:ring-emerald-400 outline-none"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Manuals Grid */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Interactive System Manuals</h2>
              <p className="text-xs text-slate-500">Click any manual below to open complete step-by-step workflows, prerequisites & FAQs.</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-600 rounded-full self-start sm:self-auto">
            {filteredManuals.length} Guides Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredManuals.map((manual) => {
            const IconComp = manual.icon;
            return (
              <div 
                key={manual.id} 
                onClick={() => setSelectedManual(manual)}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-950/5 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md border ${manual.badgeColor}`}>
                      {manual.category}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Read Guide
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${manual.color} text-white shadow-md shadow-slate-200 shrink-0 group-hover:scale-105 transition-transform`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                      {manual.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 pt-1">
                    {manual.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>{manual.steps.length} Step Procedure</span>
                  <span className="text-emerald-600 font-bold group-hover:underline">View Manual &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredManuals.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">No system manuals matched your search "{searchQuery}"</p>
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-3 text-xs text-emerald-600 font-bold hover:underline"
            >
              Clear Search Filter
            </button>
          </div>
        )}
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Frequently Asked Questions (FAQ)</h2>
            <p className="text-xs text-slate-500">Quick answers to common questions about OneID services and security.</p>
          </div>
        </div>

        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => (
            <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden transition-all">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-4 md:p-5 text-left bg-slate-50/70 hover:bg-slate-100/80 transition-colors"
              >
                <span className="text-sm font-bold text-slate-800 pr-4 flex items-center gap-2">
                  <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">Q{idx+1}</span>
                  {faq.question}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${activeFaq === idx ? 'rotate-180 text-emerald-600' : ''}`} />
              </button>
              <AnimatePresence>
                {activeFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 bg-white text-xs md:text-sm leading-relaxed text-slate-600 border-t border-slate-100">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {filteredFaqs.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-500">
              No FAQs matched your search term. Try searching for "voting", "property", or "tax".
            </div>
          )}
        </div>
      </div>

      {/* Support Box */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 md:p-8 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            24/7 Citizen Support Hub
          </div>
          <h3 className="text-lg font-bold">Need Specialized Technical Support or Reporting an Issue?</h3>
          <p className="text-xs text-slate-300 max-w-xl">
            Our blockchain engineers, election officers, and land ministry administrators are available to assist with identity verification, deed disputes, or system inquiries.
          </p>
        </div>
        <button 
          onClick={() => setShowSupportModal(true)}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition-colors flex items-center gap-2 shrink-0"
        >
          <Mail className="w-4 h-4" />
          Contact Support Desk
        </button>
      </div>

      {/* DETAILED SYSTEM MANUAL MODAL */}
      <AnimatePresence>
        {selectedManual && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className={`p-6 md:p-8 bg-gradient-to-r ${selectedManual.color} text-white relative shrink-0`}>
                <button
                  onClick={() => setSelectedManual(null)}
                  className="absolute top-5 right-5 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="space-y-3 pr-8">
                  <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm">
                    {selectedManual.category} Manual
                  </span>
                  <div className="flex items-center gap-3">
                    {React.createElement(selectedManual.icon, { className: "w-8 h-8 text-emerald-300 shrink-0" })}
                    <h2 className="text-2xl font-black tracking-tight">{selectedManual.title}</h2>
                  </div>
                  <p className="text-xs md:text-sm text-white/90 leading-relaxed">
                    {selectedManual.desc}
                  </p>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1">
                {/* Prerequisites */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Prerequisites & System Requirements
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-600 font-medium">
                    {selectedManual.prerequisites.map((req, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Step-by-Step Procedure */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    Step-by-Step Operational Procedure
                  </h4>

                  <div className="space-y-4 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
                    {selectedManual.steps.map((step, idx) => (
                      <div key={idx} className="relative flex items-start gap-4 group">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-md z-10">
                          {step.number}
                        </div>
                        <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs group-hover:border-emerald-300 transition-colors">
                          <h5 className="text-sm font-bold text-slate-800">{step.title}</h5>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Manual FAQs */}
                {selectedManual.faqs && selectedManual.faqs.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-sm font-bold text-slate-800 tracking-tight">Module Specific FAQs</h4>
                    <div className="space-y-2">
                      {selectedManual.faqs.map((f, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-200/60">
                          <p className="font-bold text-slate-800">Q: {f.q}</p>
                          <p className="text-slate-600">A: {f.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrintManual}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Manual
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + '/help?manual=' + selectedManual.id);
                      toast.success('Direct link to this system manual copied to clipboard!');
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Link
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedManual(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                  >
                    Close
                  </button>
                  <Link
                    to={selectedManual.targetUrl}
                    onClick={() => setSelectedManual(null)}
                    className="px-5 py-2.5 bg-[#006A4E] hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    {selectedManual.targetLabel}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUPPORT DESK MODAL */}
      <AnimatePresence>
        {showSupportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">OneID Technical Support Desk</h3>
                    <p className="text-xs text-slate-400">Direct escalation to system engineering & civil admins.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSupportModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSupportSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Inquiry Category</label>
                  <select
                    value={supportForm.topic}
                    onChange={(e) => setSupportForm({ ...supportForm, topic: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Technical Fault">Technical Fault / System Error</option>
                    <option value="Account & MFA">Account Verification & MFA Issue</option>
                    <option value="Voting Discrepancy">Voting & Election Ledger Query</option>
                    <option value="Property Dispute">Property Transfer & Deed Dispute</option>
                    <option value="Tax Inquiry">Tax Calculation or Clearance Inquiry</option>
                    <option value="Other">Other Civil Registry Request</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">OneID Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. BD-880190012345"
                      value={supportForm.oneid}
                      onChange={(e) => setSupportForm({ ...supportForm, oneid: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      required
                      placeholder="citizen@bangladesh.gov.bd"
                      value={supportForm.email}
                      onChange={(e) => setSupportForm({ ...supportForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Description</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your query or issue in detail..."
                    value={supportForm.message}
                    onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                    className="w-full p-3.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSupportModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingSupport}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {submittingSupport ? 'Submitting...' : 'Submit Support Ticket'}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HelpZone;
