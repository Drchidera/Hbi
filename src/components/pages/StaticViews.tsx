import React, { useState } from 'react';
import type { VisaCategory } from '../../types';
import {
  Briefcase,
  GraduationCap,
  Building,
  Users,
  Compass,
  CreditCard,
  Building2,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface StaticViewsProps {
  view: 'categories' | 'process' | 'payments-info';
  onStartApplication: (cat?: VisaCategory) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const StaticViews: React.FC<StaticViewsProps> = ({
  view,
  onStartApplication,
  onOpenAuth,
}) => {
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  const handleCopy = (acc: string) => {
    navigator.clipboard.writeText(acc);
    setCopiedAccount(acc);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  if (view === 'categories') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
            Non-Immigrant Classifications
          </span>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">
            United States Visa Categories & Eligibility
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Independent advisory analysis for tourism, corporate trade, collegiate studies, and specialized exchange programs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* B1/B2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-slate-800" />
                <h3 className="text-lg font-bold text-slate-900">B1/B2 Visitor Visa</h3>
              </div>
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
                $240 USD Advisory Fee
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              For business visitors (B-1) conducting contract negotiations, consulting associates, and attending scientific conventions; and tourist visitors (B-2) for holidays, family visits, and medical treatment.
            </p>
            <div className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-700">
              <p className="font-semibold text-slate-900">Key Scrutiny Points:</p>
              <p>• Demonstrating intent to depart the U.S. at the conclusion of the visit (INA Section 214(b)).</p>
              <p>• Sufficient personal liquid funds to cover all travel and lodging expenses.</p>
              <p>• Binding residence and continuous social ties outside the United States.</p>
            </div>
            <button
              onClick={() => onStartApplication('B1_B2')}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            >
              Start B1/B2 Case File
            </button>
          </div>

          {/* F1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-slate-800" />
                <h3 className="text-lg font-bold text-slate-900">F1 Academic Student Visa</h3>
              </div>
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
                $290 USD Advisory Fee
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              For full-time students admitted to an accredited SEVP-certified U.S. university, college, high school, or language training program.
            </p>
            <div className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-700">
              <p className="font-semibold text-slate-900">Key Scrutiny Points:</p>
              <p>• Form I-20 validation and Student and Exchange Visitor Information System (SEVIS) compliance.</p>
              <p>• Liquid financial proof covering at least one full academic year's tuition and living costs.</p>
              <p>• Articulated educational goals matching post-graduation career opportunities in home country.</p>
            </div>
            <button
              onClick={() => onStartApplication('F1')}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            >
              Start F1 Student Case File
            </button>
          </div>

          {/* J1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-800" />
                <h3 className="text-lg font-bold text-slate-900">J1 Exchange Visitor Visa</h3>
              </div>
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
                $275 USD Advisory Fee
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              For professors, research scholars, short-term scholars, trainees, interns, teachers, and international visitors participating in Department of State-designated exchange visitor programs.
            </p>
            <div className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-700">
              <p className="font-semibold text-slate-900">Key Scrutiny Points:</p>
              <p>• Form DS-2019 (Certificate of Eligibility) and program sponsor confirmation.</p>
              <p>• English language proficiency verification required by host institution.</p>
              <p>• Analysis of Section 212(e) Two-Year Home-Country Physical Presence Requirement applicability.</p>
            </div>
            <button
              onClick={() => onStartApplication('J1')}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            >
              Start J1 Exchange Case File
            </button>
          </div>

          {/* H1B */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-slate-800" />
                <h3 className="text-lg font-bold text-slate-900">H1B Specialty Occupation</h3>
              </div>
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
                $480 USD Advisory Fee
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              For professional employees in specialty occupations requiring theoretical and practical application of a body of highly specialized knowledge, with bachelor's degree or higher.
            </p>
            <div className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-700">
              <p className="font-semibold text-slate-900">Key Scrutiny Points:</p>
              <p>• Approved USCIS Form I-797 Notice of Action and certified Labor Condition Application (LCA).</p>
              <p>• Employer-employee relationship verification and prevailing wage compliance documentation.</p>
              <p>• Degree equivalency evaluations and detailed client itinerary letters where applicable.</p>
            </div>
            <button
              onClick={() => onStartApplication('H1B')}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            >
              Start H1B Dossier Case File
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'process') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
            Procedural Architecture
          </span>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">
            The 12-Stage Application Lifecycle
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Every case file is tracked with complete date, time, and administrative audit stamps.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs max-w-4xl mx-auto">
          <div className="space-y-6 text-xs">
            {[
              {
                step: '01',
                title: 'Draft Phase',
                desc: 'Applicant begins form entry with auto-save. Uploads preliminary passport bio-data and background information.',
              },
              {
                step: '02',
                title: 'Submitted',
                desc: 'Applicant attests truthfulness and formally transmits the file to the administrative intake desk.',
              },
              {
                step: '03',
                title: 'Awaiting Payment',
                desc: 'Application fee is calculated based on visa classification. Corporate bank wire details are provided.',
              },
              {
                step: '04',
                title: 'Payment Under Review',
                desc: 'Applicant uploads bank wire transaction confirmation slip. Finance officers cross-reference bank records.',
              },
              {
                step: '05',
                title: 'Payment Confirmed',
                desc: 'Finance administrator verifies receipt of funds in corporate ledger and advances the case to the legal review queue.',
              },
              {
                step: '06',
                title: 'Processing',
                desc: 'Advisory officers examine DS-160 responses, employment proofs, travel ties, and photo dimensions.',
              },
              {
                step: '07',
                title: 'Additional Documents Required',
                desc: 'If bank statements or host letters show deficiencies, administrator issues specific upload instructions.',
              },
              {
                step: '08',
                title: 'Under Administrative Review',
                desc: 'Senior counsel conducts final pre-embassy readiness inspection and mock interview checklist validation.',
              },
              {
                step: '09',
                title: 'Approved by Service Administrator',
                desc: 'Internal dossier verification complete. Complete dossier is packaged for consular presentation. (Note: Not official US visa grant).',
              },
              {
                step: '10',
                title: 'Rejected by Service Administrator',
                desc: 'Dossier fails critical procedural criteria or exhibits unresolvable eligibility bars. Written explanation logged.',
              },
              {
                step: '11',
                title: 'Completed',
                desc: 'Applicant completes consular appointment roadmap and interview debriefing.',
              },
              {
                step: '12',
                title: 'Cancelled',
                desc: 'Applicant requests withdrawal of advisory case file prior to submission.',
              },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <span className="font-mono text-sm font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded shrink-0">
                  {s.step}
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{s.title}</h4>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8 mt-6 border-t border-slate-200 text-center">
            <button
              onClick={() => onStartApplication()}
              className="px-6 py-3 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              Initiate Application Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Manual payment guide
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
          Financial Protocol
        </span>
        <h1 className="text-3xl font-bold text-slate-900 mt-2">
          Manual Bank Transfer & Escrow Guide
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2">
          We operate zero automated payment gateway charges. All advisory payments are remitted via manual bank wire and verified by our finance desk.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-900" />
              <h3 className="text-base font-bold text-slate-900">
                Designated Corporate Bank Account
              </h3>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
              Active Deposit Account
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Bank Name:</span>
              <strong className="text-slate-900">JPMorgan Chase Bank, N.A.</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Account Name:</span>
              <strong className="text-slate-900">Beacon & Harbor Visa Advisory Group LLC</strong>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Account Number:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">984021948201</span>
              </div>
              <button
                onClick={() => handleCopy('984021948201')}
                className="px-3 py-1.5 text-xs font-bold text-slate-900 bg-amber-200 hover:bg-amber-300 rounded cursor-pointer"
              >
                {copiedAccount === '984021948201' ? 'Copied ✓' : 'Copy Number'}
              </button>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Routing / SWIFT:</span>
              <span className="font-mono text-slate-800">Routing: 021000021 / SWIFT: CHASUS33</span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
            <h4 className="font-bold text-slate-900">Transfer Instructions:</h4>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Log in to your retail or commercial online banking portal.</li>
              <li>Initiate a domestic wire, ACH transfer, or international SWIFT wire to the account above.</li>
              <li><strong>Mandatory:</strong> Include your Application Reference Number (e.g. USV-2026-XXXX) in the payment reference or memo line.</li>
              <li>Download the official PDF confirmation or take a clear screenshot of the completed transfer confirmation.</li>
              <li>Log in to your Applicant Portal and upload the receipt slip under the payment confirmation stage.</li>
            </ol>
          </div>
        </div>

        <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-1">Audit Verification Notice:</span>
            <p>
              A payment receipt upload does not immediately confirm payment. An authorized finance officer will review your receipt and verify ledger credit before updating your application status to "Payment Confirmed".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
