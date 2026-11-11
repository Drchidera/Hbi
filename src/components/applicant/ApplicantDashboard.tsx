import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { VisaApplication, PaymentSubmission } from '../../types';
import { VISA_CATEGORY_LABELS } from '../../types';
import { ApplicationTracker } from './ApplicationTracker';
import { PaymentModal } from './PaymentModal';
import {
  FileText,
  Plus,
  CreditCard,
  MessageSquare,
  Bell,
  User,
  Clock,
  ArrowRight,
  ShieldAlert,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ApplicantDashboardProps {
  onStartNewApplication: () => void;
  onOpenChat: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
}

export const ApplicantDashboard: React.FC<ApplicantDashboardProps> = ({
  onStartNewApplication,
  onOpenChat,
  onOpenSettings,
  onOpenNotifications,
}) => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<VisaApplication[]>([]);
  const [payments, setPayments] = useState<PaymentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // Payment modal state
  const [paymentApp, setPaymentApp] = useState<VisaApplication | null>(null);

  // Tab: 'applications' | 'payments'
  const [activeTab, setActiveTab] = useState<'applications' | 'payments'>('applications');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appsRes, payRes] = await Promise.all([
        api.getApplications(),
        api.getPayments(),
      ]);
      setApplications(appsRes.applications);
      setPayments(payRes.payments);

      // Default select the first application if exists
      if (appsRes.applications.length > 0 && !selectedAppId) {
        setSelectedAppId(appsRes.applications[0].id);
      }
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  const selectedApp = applications.find((a) => a.id === selectedAppId) || applications[0] || null;

  // Stats calculation
  const totalApps = applications.length;
  const awaitingPayment = applications.filter(
    (a) => a.status === 'Awaiting Payment' || a.status === 'Payment Under Review'
  ).length;
  const docsRequired = applications.filter((a) => a.status === 'Additional Documents Required').length;
  const activeProcessing = applications.filter(
    (a) =>
      a.status === 'Processing' ||
      a.status === 'Under Administrative Review' ||
      a.status === 'Payment Confirmed'
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Personalized Welcome Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Applicant Client Portal
            </span>
            <span className="text-xs text-slate-400">· Account #{user?.id.slice(-6).toUpperCase()}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {user?.fullName || 'Applicant'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review your visa case files, manage manual wire remittance slips, and track consular readiness.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onStartNewApplication}
            className="px-4 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Application</span>
          </button>

          <button
            onClick={onOpenChat}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <span>Advisory Messages</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
            Total Dossiers
          </span>
          <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
            {totalApps}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
            Under Active Audit
          </span>
          <span className="font-mono text-2xl font-bold text-blue-700 tabular-nums">
            {activeProcessing}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
            Awaiting Wire Payment
          </span>
          <span className="font-mono text-2xl font-bold text-amber-700 tabular-nums">
            {awaitingPayment}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
            Docs Action Required
          </span>
          <span className="font-mono text-2xl font-bold text-rose-600 tabular-nums">
            {docsRequired}
          </span>
        </div>
      </div>

      {/* Main Tabbed Workspace */}
      <div className="space-y-4">
        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'applications'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            My Applications ({applications.length})
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Payment History & Receipts ({payments.length})
          </button>
        </div>

        {/* TAB 1: APPLICATIONS LIST & TRACKING */}
        {activeTab === 'applications' && (
          <div>
            {applications.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
                <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 mb-1">No Active Visa Applications</h3>
                <p className="text-xs text-slate-500 mb-6">
                  You haven't initiated a U.S. visa case file yet. Select a visa category to get started with document audit and form guidance.
                </p>
                <button
                  onClick={onStartNewApplication}
                  className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
                >
                  Start First Application
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Applications Side Selector (4 cols) */}
                <div className="lg:col-span-4 space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                    Select Application File
                  </h3>
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => setSelectedAppId(app.id)}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                        selectedApp?.id === app.id
                          ? 'bg-white border-slate-900 shadow-md ring-1 ring-slate-900'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {app.referenceNumber}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {app.status}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-800 mb-1">
                        {VISA_CATEGORY_LABELS[app.visaCategory]}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                        <span>Fee: ${app.feeAmount}</span>
                        <span>{new Date(app.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Application Detailed Tracker (8 cols) */}
                <div className="lg:col-span-8">
                  {selectedApp && (
                    <ApplicationTracker
                      application={selectedApp}
                      onOpenPayment={() => setPaymentApp(selectedApp)}
                      onOpenChat={onOpenChat}
                      onRefresh={loadData}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PAYMENT HISTORY */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Wire Transfer & Payment Submissions</h3>
                <p className="text-xs text-slate-500">
                  Record of manual bank transfers submitted for administrative verification.
                </p>
              </div>
              <button
                onClick={() => {
                  const unpaidApp = applications.find(
                    (a) => a.paymentStatus === 'unpaid' || a.status === 'Awaiting Payment'
                  );
                  if (unpaidApp) {
                    setPaymentApp(unpaidApp);
                  } else if (applications[0]) {
                    setPaymentApp(applications[0]);
                  }
                }}
                className="px-3.5 py-2 text-xs font-bold text-slate-900 bg-amber-300 hover:bg-amber-400 rounded-lg transition-colors cursor-pointer"
              >
                Submit Payment Slip
              </button>
            </div>

            {payments.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No payment confirmations recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="px-6 py-3">Payment Ref</th>
                      <th className="px-6 py-3">Application Ref</th>
                      <th className="px-6 py-3">Designated Bank</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Wire Date</th>
                      <th className="px-6 py-3">Receipt Document</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3.5 font-mono font-medium text-slate-900">
                          {p.referenceNumber}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-600">
                          {p.applicationRef}
                        </td>
                        <td className="px-6 py-3.5 text-slate-700">
                          {p.bankName}
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-900 tabular-nums">
                          ${p.amount} USD
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              p.status === 'confirmed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'pending_review'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {p.status === 'confirmed' && 'Confirmed & Verified'}
                            {p.status === 'pending_review' && 'Awaiting Verification'}
                            {p.status === 'rejected' && 'Rejected'}
                            {p.status === 'receipt_re-requested' && 'Re-Upload Requested'}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-500">
                          {p.paymentDate}
                        </td>
                        <td className="px-6 py-3.5">
                          <a
                            href={p.receiptFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-slate-900 hover:text-amber-700 underline"
                          >
                            View Slip
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {paymentApp && (
        <PaymentModal
          application={paymentApp}
          isOpen={true}
          onClose={() => setPaymentApp(null)}
          onPaymentSubmitted={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
};
