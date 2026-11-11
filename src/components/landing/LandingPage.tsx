import React from 'react';
import {
  FileText,
  CreditCard,
  Building,
  GraduationCap,
  Briefcase,
  Users,
  ChevronRight,
  Clock,
  ArrowRight,
  Compass,
} from 'lucide-react';
import type { SystemSettings, VisaCategory } from '../../types';

interface LandingPageProps {
  settings: SystemSettings | null;
  onStartApplication: (category?: VisaCategory) => void;
  onTrackApplication: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenPaymentsGuide: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  settings,
  onStartApplication,
  onTrackApplication,
  onOpenAuth,
  onOpenPaymentsGuide,
}) => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Announcement Banner if configured */}
      {settings?.isAnnouncementActive && settings.announcementText && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 py-2.5 px-4 text-xs text-amber-950 text-center font-medium">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <span className="font-bold text-amber-800 uppercase tracking-wide text-[10px] px-2 py-0.5 bg-amber-200/60 rounded">
              {settings.announcementTitle || 'Advisory Update'}
            </span>
            <span>{settings.announcementText}</span>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative bg-slate-950 text-white overflow-hidden py-16 lg:py-24 border-b border-slate-800">
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/hero_visa_consulting_1794402050458.jpg"
            alt="Beacon & Harbor Executive Visa Advisory Suite in Washington DC"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-25 filter contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl">
            {/* Super header */}
            <div className="flex items-center gap-2 mb-4 text-xs tracking-wider uppercase font-semibold text-amber-400">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Premier U.S. Immigration & Visa Advisory Services</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-5 text-balance leading-tight">
              Strategic Counsel & Case Management for United States Visas.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8">
              Navigate U.S. consular procedures with dedicated document audits, comprehensive DS-160 file preparation, and manual bank wire escrow verification. Designed for tourists, scholars, and corporate professionals.
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <button
                onClick={() => onStartApplication()}
                className="px-6 py-3.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Initiate Visa Case File</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onTrackApplication}
                className="px-6 py-3.5 text-xs font-semibold text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Track Existing Application
              </button>

              <button
                onClick={onOpenPaymentsGuide}
                className="px-4 py-3.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                Manual Wire Instructions →
              </button>
            </div>

            {/* Quantitative trust stats */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-800 text-left">
              <div>
                <p className="font-mono text-2xl font-bold text-white tabular-nums">99.4%</p>
                <p className="text-[11px] text-slate-400 uppercase tracking-wide mt-0.5">Dossier Compliance Rate</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-amber-400 tabular-nums">12</p>
                <p className="text-[11px] text-slate-400 uppercase tracking-wide mt-0.5">Audited Lifecycle Stages</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-white tabular-nums">24-48h</p>
                <p className="text-[11px] text-slate-400 uppercase tracking-wide mt-0.5">Manual Wire Audit Speed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VISA CATEGORIES BENTO GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Practice Areas
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Select Your United States Visa Category
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-2xl">
              We provide tailored filing guidance, interview simulation, and financial proof verification for every non-immigrant classification.
            </p>
          </div>
          <button
            onClick={() => onStartApplication()}
            className="text-xs font-semibold text-slate-900 hover:text-amber-700 flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>View All Categories</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: B1/B2 */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="h-48 overflow-hidden relative">
                <img
                  src="/src/assets/images/visa_categories_business_1794402050697.jpg"
                  alt="B1/B2 Tourist and Business Visa Documentation"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-xs text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded tracking-wide">
                  MOST FREQUENT
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <Briefcase className="w-4 h-4 text-slate-700" />
                  <span>Tourism · Business · Conferences · Medical</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  B1 / B2 Visitor Visa
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Full guidance for commercial meetings, negotiations, family visitation, and tourism. Comprehensive scrutiny of strong home-country ties (property, career, family).
                </p>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1 mb-4">
                  <div className="flex justify-between text-slate-700">
                    <span>Advisory Fee:</span>
                    <span className="font-bold font-mono tabular-nums text-slate-900">$240 USD</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Standard Audit:</span>
                    <span>3–5 business days</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 pt-0">
              <button
                onClick={() => onStartApplication('B1_B2')}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Apply for B1/B2 Advisory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: F1 Student */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="h-48 overflow-hidden relative">
                <img
                  src="/src/assets/images/visa_categories_education_1794402050722.jpg"
                  alt="F1 Student Visa Application"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-xs text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded tracking-wide">
                  ACADEMIC
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <GraduationCap className="w-4 h-4 text-slate-700" />
                  <span>Colleges · Universities · English Programs</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  F1 Academic Student Visa
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Form I-20 validation, SEVIS fee guidance, sponsor financial statement review, and intensive consular interview simulation for undergraduate & graduate scholars.
                </p>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1 mb-4">
                  <div className="flex justify-between text-slate-700">
                    <span>Advisory Fee:</span>
                    <span className="font-bold font-mono tabular-nums text-slate-900">$290 USD</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>SEVIS Readiness:</span>
                    <span>Full Verification</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 pt-0">
              <button
                onClick={() => onStartApplication('F1')}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Apply for F1 Advisory</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: H1B, J1 & Other */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div className="p-6">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <Building className="w-4 h-4 text-slate-700" />
                <span>Specialty Occupations · Exchange · Corporate</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                H1B, J1 & Corporate Categories
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Specialized petition-based preparation for USCIS I-797 approval notices, DS-2019 exchange programs, research fellows, and executive intra-company transfers.
              </p>

              <div className="space-y-3 mb-6">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">H1B Specialty Work Visa</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">$480 USD</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Petition alignment, employer verification & LCA proof audit.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">J1 Exchange Scholar</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">$275 USD</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Exchange visitor program review & two-year home residency advisory.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 pt-0">
              <button
                onClick={() => onStartApplication('H1B')}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Apply for Specialty Category</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4-PHASE ADVISORY WORKFLOW */}
      <section className="bg-slate-900 text-white py-20 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Procedural Rigor
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
              The 4-Phase Advisory Workflow
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Every applicant file undergoes our rigorous 12-status verification lifecycle prior to embassy presentation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
                  Phase 01
                </span>
                <h3 className="text-base font-bold text-white mt-2 mb-2">
                  Profile & DS-160 Intake
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Complete our comprehensive online intake covering legal travel history, family ties, and employment records.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-500">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Auto-saved Draft System</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
                  Phase 02
                </span>
                <h3 className="text-base font-bold text-white mt-2 mb-2">
                  Document Vault Audit
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload 2x2 passport photos, bio-data pages, and bank proofs. We inspect image framing and financial sufficiency.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-500">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Immediate Feedback Notes</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
                  Phase 03
                </span>
                <h3 className="text-base font-bold text-white mt-2 mb-2">
                  Manual Wire Verification
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Remit advisory fees via direct bank wire. Administrators verify the bank slip and activate the processing queue.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-500">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                <span>Zero Gateway Fees</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
                  Phase 04
                </span>
                <h3 className="text-base font-bold text-white mt-2 mb-2">
                  Dossier Packaging & Prep
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Receive your structured consular dossier folder, appointment scheduling roadmap, and interview prep questions.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-500">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Live Advisory Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SENIOR COUNSEL & LEADERSHIP SPOTLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-5 relative min-h-[320px] lg:min-h-full">
            <img
              src="/src/assets/images/consultant_advisor_portrait_1794402052680.jpg"
              alt="Robert J. Davidson, Senior Immigration Advisor"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Senior Leadership & Advisory Board
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 mb-4">
              "Procedural precision is the cornerstone of consular credibility."
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
              Over two decades of experience in consular administrative affairs and international visa regulations. Our advisory board scrutinizes every application against Department of State Foreign Affairs Manual (FAM) criteria before submission.
            </p>
            <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-slate-900 text-sm">Robert J. Davidson, Esq.</p>
                <p className="text-xs text-slate-500">Senior Managing Director · Consular Practice Group</p>
              </div>
              <button
                onClick={() => onStartApplication()}
                className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
              >
                Schedule Case Assessment
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MANUAL WIRE TRANSFER TRANSPARENCY SECTION */}
      <section className="bg-slate-100/70 border-t border-slate-200 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h3 className="text-xl font-bold text-slate-900">
              Transparent Manual Bank Wire Payment System
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              We operate exclusively through direct corporate wire transfer and administrative verification. No unverified third-party gateways or automated card charges.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="font-bold text-slate-900 block mb-1">1. Transfer to Verified Account</span>
              <p className="text-slate-600 leading-relaxed">
                Send your processing fee directly to our verified corporate JPMorgan Chase or Bank of America account details provided in your dashboard.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="font-bold text-slate-900 block mb-1">2. Upload Wire Receipt</span>
              <p className="text-slate-600 leading-relaxed">
                Attach your official bank transaction receipt (PDF or clear image) and enter your bank transfer reference number.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="font-bold text-slate-900 block mb-1">3. Administrative Audit</span>
              <p className="text-slate-600 leading-relaxed">
                An authorized finance administrator manually validates the deposit with our bank records before advancing your case file to processing.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
