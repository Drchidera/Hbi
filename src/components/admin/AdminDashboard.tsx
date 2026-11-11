import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type {
  VisaApplication,
  PaymentSubmission,
  PaymentMethod,
  AuditLog,
  SystemSettings,
  ApplicationStatus,
  VisaCategory,
} from '../../types';
import { ALL_APPLICATION_STATUSES, VISA_CATEGORY_LABELS } from '../../types';
import {
  Users,
  FileText,
  CreditCard,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Settings,
  ShieldAlert,
  Building,
  Plus,
  Trash2,
  Edit,
  Eye,
  MessageSquare,
  Lock,
  Download,
  FileCheck,
  ChevronRight,
  Save,
  Activity,
} from 'lucide-react';

interface AdminDashboardProps {
  onOpenChat: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onOpenChat }) => {
  const { user } = useAuth();

  // Navigation tab inside admin console
  const [activeTab, setActiveTab] = useState<
    'overview' | 'applications' | 'payments' | 'payment_settings' | 'audit_logs' | 'settings'
  >('overview');

  // Data states
  const [stats, setStats] = useState<any>({});
  const [applications, setApplications] = useState<VisaApplication[]>([]);
  const [payments, setPayments] = useState<PaymentSubmission[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Application Dossier Inspection Modal
  const [inspectingApp, setInspectingApp] = useState<VisaApplication | null>(null);
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('Processing');
  const [statusNote, setStatusNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [privateNoteText, setPrivateNoteText] = useState('');
  const [requestDocInstructions, setRequestDocInstructions] = useState('');

  // Payment Verification Modal
  const [inspectingPayment, setInspectingPayment] = useState<PaymentSubmission | null>(null);
  const [paymentAdminNote, setPaymentAdminNote] = useState('');

  // Bank Method Add/Edit Modal
  const [editingMethod, setEditingMethod] = useState<Partial<PaymentMethod> | null>(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<SystemSettings | null>(null);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, [categoryFilter, statusFilter]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, appsRes, payRes, methodsRes, logsRes, setRes] = await Promise.all([
        api.getAdminStats(),
        api.getApplications({
          category: categoryFilter,
          status: statusFilter,
          search: searchQuery,
        }),
        api.getPayments(),
        api.getPaymentMethods(),
        api.getAuditLogs(),
        api.getSettings(),
      ]);

      setStats(statsRes.stats);
      setApplications(appsRes.applications);
      setPayments(payRes.payments);
      setPaymentMethods(methodsRes.paymentMethods);
      setAuditLogs(logsRes.auditLogs);
      setSettings(setRes.settings);
      setSettingsForm(setRes.settings);
    } catch (e) {
      console.error('Failed to load admin dataset', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadAllData();
  };

  // Update application status
  const handleUpdateStatus = async (appId: string) => {
    try {
      const res = await api.updateApplicationStatus(
        appId,
        newStatus,
        statusNote,
        newStatus === 'Rejected by Service Administrator' ? rejectionReason : undefined
      );
      setInspectingApp(res.application);
      setStatusNote('');
      setRejectionReason('');
      loadAllData();
    } catch (err: any) {
      alert('Status update failed: ' + err.message);
    }
  };

  // Add private note
  const handleAddPrivateNote = async (appId: string) => {
    if (!privateNoteText.trim()) return;
    try {
      const res = await api.addAdminNote(appId, privateNoteText.trim());
      if (inspectingApp) {
        setInspectingApp({ ...inspectingApp, adminNotes: res.adminNotes });
      }
      setPrivateNoteText('');
      loadAllData();
    } catch (err: any) {
      alert('Failed to save private note: ' + err.message);
    }
  };

  // Request documents
  const handleRequestDocuments = async (appId: string) => {
    if (!requestDocInstructions.trim()) return;
    try {
      const res = await api.requestSupplementaryDocuments(appId, requestDocInstructions.trim());
      setInspectingApp(res.application);
      setRequestDocInstructions('');
      loadAllData();
    } catch (err: any) {
      alert('Failed to request documents: ' + err.message);
    }
  };

  // Verify payment
  const handleVerifyPayment = async (paymentId: string, action: 'confirm' | 'reject' | 're-request') => {
    try {
      await api.verifyPayment(paymentId, action, paymentAdminNote);
      setInspectingPayment(null);
      setPaymentAdminNote('');
      loadAllData();
    } catch (err: any) {
      alert('Payment action failed: ' + err.message);
    }
  };

  // Save bank payment method
  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMethod) return;
    try {
      const res = await api.savePaymentMethod(editingMethod);
      setPaymentMethods(res.paymentMethods);
      setEditingMethod(null);
      loadAllData();
    } catch (err: any) {
      alert('Failed to save bank account: ' + err.message);
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    if (!confirm('Are you sure you want to remove this bank account?')) return;
    try {
      const res = await api.deletePaymentMethod(id);
      setPaymentMethods(res.paymentMethods);
      loadAllData();
    } catch (err: any) {
      alert('Failed to delete method: ' + err.message);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm) return;
    try {
      const res = await api.updateSettings(settingsForm);
      setSettings(res.settings);
      setSettingsSavedMessage('System settings and disclosures successfully updated.');
      setTimeout(() => setSettingsSavedMessage(null), 3500);
      loadAllData();
    } catch (err: any) {
      alert('Failed to update settings: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md border border-amber-500/20">
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Lock className="w-4 h-4" />
            <span>Authorized Administrator Control Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Administrative Operations & Oversight
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Logged in as <strong className="text-white">{user?.fullName}</strong> ({user?.email}). Manage applicant dossiers, audit bank wire transfers, and update system policy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenChat}
            className="px-4 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Applicant Inquiries Center</span>
          </button>
        </div>
      </div>

      {/* Primary Admin Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-2 text-xs font-semibold">
        {[
          { key: 'overview', label: 'Overview Metrics' },
          { key: 'applications', label: `Dossiers (${applications.length})` },
          { key: 'payments', label: `Wire Verifications (${payments.length})` },
          { key: 'payment_settings', label: 'Bank Accounts & Fees' },
          { key: 'audit_logs', label: `Audit Trail (${auditLogs.length})` },
          { key: 'settings', label: 'System Configuration' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.key
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===================== TAB 1: OVERVIEW METRICS ===================== */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* 8 Mandated Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                Total Registered Applicants
              </span>
              <span className="font-mono text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
                {stats.totalApplicants || 0}
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                Total Visa Applications
              </span>
              <span className="font-mono text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
                {stats.totalApplications || 0}
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                New Applications
              </span>
              <span className="font-mono text-2xl sm:text-3xl font-bold text-blue-700 tabular-nums">
                {stats.newApplications || 0}
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                Active Processing
              </span>
              <span className="font-mono text-2xl sm:text-3xl font-bold text-indigo-700 tabular-nums">
                {stats.processingApplications || 0}
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                Awaiting Wire Payment
              </span>
              <span className="font-mono text-2xl sm:text-3xl font-bold text-amber-700 tabular-nums">
                {stats.awaitingPayment || 0}
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                Confirmed Payments
              </span>
              <span className="font-mono text-2xl sm:text-3xl font-bold text-emerald-700 tabular-nums">
                {stats.confirmedPaymentsCount || 0}
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                Rejected Applications
              </span>
              <span className="font-mono text-2xl sm:text-3xl font-bold text-rose-700 tabular-nums">
                {stats.rejectedApplicationsCount || 0}
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                Total Recorded Revenue
              </span>
              <span className="font-mono text-2xl sm:text-3xl font-bold text-emerald-800 tabular-nums">
                ${stats.totalRevenueUSD?.toLocaleString() || 0} USD
              </span>
            </div>
          </div>

          {/* Quick Action Tables in Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Wire Verifications */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <span>Pending Wire Verifications ({stats.pendingPaymentsCount || 0})</span>
                </h3>
                <button
                  onClick={() => setActiveTab('payments')}
                  className="text-xs text-amber-800 font-semibold hover:underline"
                >
                  Manage All →
                </button>
              </div>

              {payments.filter((p) => p.status === 'pending_review').length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No pending wire slips requiring review.</p>
              ) : (
                <div className="space-y-2">
                  {payments
                    .filter((p) => p.status === 'pending_review')
                    .slice(0, 4)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{p.applicantName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            Ref: {p.transactionReference} · App: {p.applicationRef}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-900 tabular-nums">
                            ${p.amount}
                          </span>
                          <button
                            onClick={() => {
                              setInspectingPayment(p);
                              setActiveTab('payments');
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded"
                          >
                            Verify
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Recent Audit Activities */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-600" />
                  <span>Recent Administrative Actions</span>
                </h3>
                <button
                  onClick={() => setActiveTab('audit_logs')}
                  className="text-xs text-slate-800 font-semibold hover:underline"
                >
                  View Full Audit Log →
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                {auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">{log.action}</p>
                      <p className="text-[11px] text-slate-500">{log.details}</p>
                    </div>
                    <time className="text-[10px] text-slate-400 font-mono tabular-nums shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: APPLICATION MANAGEMENT ===================== */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Filter Bar */}
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search applicant name, email, or ref..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              >
                <option value="all">All Visa Categories</option>
                <option value="B1_B2">B1/B2 Tourist & Business</option>
                <option value="F1">F1 Student</option>
                <option value="J1">J1 Exchange</option>
                <option value="H1B">H1B Work</option>
                <option value="OTHER">Other Categories</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              >
                <option value="all">All Application Statuses (12)</option>
                {ALL_APPLICATION_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              <button
                onClick={handleSearch}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
              >
                Apply Filter
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Reference #</th>
                  <th className="px-6 py-3.5">Applicant Name</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Fee Status</th>
                  <th className="px-6 py-3.5">Last Updated</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {app.referenceNumber}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{app.applicantName}</p>
                      <p className="text-[11px] text-slate-400">{app.applicantEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {VISA_CATEGORY_LABELS[app.visaCategory]}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-100 border-slate-200 text-slate-800">
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-semibold ${
                          app.paymentStatus === 'confirmed'
                            ? 'text-emerald-700'
                            : app.paymentStatus === 'under_review'
                            ? 'text-amber-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {app.paymentStatus === 'confirmed'
                          ? 'Confirmed ($' + app.feeAmount + ')'
                          : app.paymentStatus === 'under_review'
                          ? 'Slip Submitted'
                          : 'Unpaid ($' + app.feeAmount + ')'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono tabular-nums text-[11px]">
                      {new Date(app.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setInspectingApp(app);
                          setNewStatus(app.status);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        Review Dossier
                      </button>
                    </td>
                  </tr>
                ))}

                {applications.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      No applications found matching the selected filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: PAYMENT MANAGEMENT ===================== */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Manual Bank Wire Verifications</h3>
              <p className="text-xs text-slate-500">
                Audit incoming wire transfers and bank slips. Never mark a payment as successful without bank record reconciliation.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Payment Ref</th>
                  <th className="px-6 py-3.5">Application Ref</th>
                  <th className="px-6 py-3.5">Applicant</th>
                  <th className="px-6 py-3.5">Designated Bank</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Wire Ref #</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Receipt</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {p.referenceNumber}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {p.applicationRef}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{p.applicantName}</p>
                      <p className="text-[11px] text-slate-400">{p.applicantEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {p.bankName}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 tabular-nums">
                      ${p.amount} USD
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {p.transactionReference}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          p.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'pending_review'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={p.receiptFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-slate-900 hover:text-amber-700 underline"
                      >
                        View Slip
                      </a>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setInspectingPayment(p);
                          setPaymentAdminNote(p.adminNotes || '');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                      >
                        Verify Slip
                      </button>
                    </td>
                  </tr>
                ))}

                {payments.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-slate-400">
                      No bank wire confirmation records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== TAB 4: BANK ACCOUNTS & PROCESSING FEES ===================== */}
      {activeTab === 'payment_settings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Designated Bank Accounts & Visa Processing Fees
                </h3>
                <p className="text-xs text-slate-500">
                  Configure the corporate wire transfer destination accounts and category processing fees shown to applicants.
                </p>
              </div>
              <button
                onClick={() =>
                  setEditingMethod({
                    label: 'New Corporate Account',
                    bankName: '',
                    accountName: 'Beacon & Harbor Visa Advisory Group LLC',
                    accountNumber: '',
                    swiftOrRouting: '',
                    instructions:
                      'Transfer processing fee and upload confirmation receipt slip.',
                    isActive: true,
                    visaFees: { B1_B2: 240, F1: 290, J1: 275, H1B: 480, OTHER: 320 },
                  })
                }
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Bank Account</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paymentMethods.map((m) => (
                <div
                  key={m.id}
                  className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-slate-900 text-sm">{m.label}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          m.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {m.isActive ? 'Active Destination' : 'Deactivated'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 mb-3">
                      <p>
                        <span className="text-slate-400">Bank Name:</span> <strong>{m.bankName}</strong>
                      </p>
                      <p>
                        <span className="text-slate-400">Account Name:</span> <strong>{m.accountName}</strong>
                      </p>
                      <p>
                        <span className="text-slate-400">Account #:</span>{' '}
                        <strong className="font-mono text-slate-900">{m.accountNumber}</strong>
                      </p>
                      {m.swiftOrRouting && (
                        <p>
                          <span className="text-slate-400">Routing / SWIFT:</span>{' '}
                          <span className="font-mono">{m.swiftOrRouting}</span>
                        </p>
                      )}
                    </div>

                    <div className="mb-3">
                      <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                        Category Fees Breakdown
                      </span>
                      <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                        <div className="bg-white p-1.5 rounded border border-slate-200 text-center">
                          <span className="block text-[10px] text-slate-400">B1/B2</span>
                          <strong>${m.visaFees?.B1_B2 || 240}</strong>
                        </div>
                        <div className="bg-white p-1.5 rounded border border-slate-200 text-center">
                          <span className="block text-[10px] text-slate-400">F1</span>
                          <strong>${m.visaFees?.F1 || 290}</strong>
                        </div>
                        <div className="bg-white p-1.5 rounded border border-slate-200 text-center">
                          <span className="block text-[10px] text-slate-400">H1B</span>
                          <strong>${m.visaFees?.H1B || 480}</strong>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 italic mb-4 leading-relaxed">
                      "{m.instructions}"
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      onClick={() => setEditingMethod(m)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Account</span>
                    </button>
                    <button
                      onClick={() => handleDeletePaymentMethod(m.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 5: AUDIT LOGS ===================== */}
      {activeTab === 'audit_logs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-900">Immutable Administrative Audit Log</h3>
            <p className="text-xs text-slate-500">
              Complete regulatory record of every status alteration, note addition, payment approval, and setting modification.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Officer Name</th>
                  <th className="px-6 py-3.5">Action Code</th>
                  <th className="px-6 py-3.5">Entity Target</th>
                  <th className="px-6 py-3.5">Audit Specifics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-slate-500 tabular-nums">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 font-sans font-semibold text-slate-900">
                      {log.adminName}
                    </td>
                    <td className="px-6 py-3 text-slate-800 font-bold">
                      {log.action}
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {log.targetType}:{log.targetId.slice(-8)}
                    </td>
                    <td className="px-6 py-3 font-sans text-slate-700">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== TAB 6: SYSTEM SETTINGS ===================== */}
      {activeTab === 'settings' && settingsForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-4xl">
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Global Portal Settings & Regulatory Disclosures
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Configure contact coordinates, public announcement headers, terms of engagement, and statutory notices.
          </p>

          {settingsSavedMessage && (
            <div className="p-3 mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{settingsSavedMessage}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Website / Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.websiteName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, websiteName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Support Email
                </label>
                <input
                  type="email"
                  required
                  value={settingsForm.supportEmail}
                  onChange={(e) => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Support Telephone Hotline
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.supportPhone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, supportPhone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Physical Office Address
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.officeAddress}
                  onChange={(e) => setSettingsForm({ ...settingsForm, officeAddress: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* Announcement Banner */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Portal Advisory Announcement</span>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={settingsForm.isAnnouncementActive || false}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, isAnnouncementActive: e.target.checked })
                    }
                    className="rounded text-slate-900"
                  />
                  <span>Display Active Banner on Landing</span>
                </label>
              </div>

              <input
                type="text"
                placeholder="Announcement Title"
                value={settingsForm.announcementTitle || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, announcementTitle: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
              />

              <textarea
                rows={2}
                placeholder="Announcement text copy"
                value={settingsForm.announcementText || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, announcementText: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>

            {/* Terms and Privacy policies */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Terms & Conditions of Service
                </label>
                <textarea
                  rows={4}
                  value={settingsForm.termsAndConditions}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, termsAndConditions: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Privacy Policy & Document Retention Protocol
                </label>
                <textarea
                  rows={4}
                  value={settingsForm.privacyPolicy}
                  onChange={(e) => setSettingsForm({ ...settingsForm, privacyPolicy: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save System Settings</span>
            </button>
          </form>
        </div>
      )}

      {/* ===================== MODAL: APPLICATION DOSSIER INSPECTOR ===================== */}
      {inspectingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-amber-500/20">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400">
                    {inspectingApp.referenceNumber}
                  </span>
                  <span className="text-xs text-slate-400">· {VISA_CATEGORY_LABELS[inspectingApp.visaCategory]}</span>
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Dossier: {inspectingApp.applicantName} ({inspectingApp.applicantEmail})
                </h3>
              </div>
              <button
                onClick={() => setInspectingApp(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Status Update Control Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-900 block text-xs uppercase tracking-wide">
                  Change Application Lifecycle Status (12 Official Stages)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                    >
                      {ALL_APPLICATION_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => handleUpdateStatus(inspectingApp.id)}
                    className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    Commit Status Change
                  </button>
                </div>

                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Optional status transition explanation / audit remark..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />

                {newStatus === 'Rejected by Service Administrator' && (
                  <div>
                    <label className="block text-[11px] font-bold text-rose-700 mb-1">
                      Mandatory Administrative Rejection Explanation:
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Specify deficiency (e.g. Inadequate financial ties, illegible passport credentials)..."
                      className="w-full px-3 py-2 text-xs border border-rose-300 rounded-lg bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Request Additional Documents Section */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <span className="font-bold text-amber-950 block text-xs">
                  Request Supplementary Documentation from Applicant
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={requestDocInstructions}
                    onChange={(e) => setRequestDocInstructions(e.target.value)}
                    placeholder="e.g. Please supply past 6 months stamped official bank statement..."
                    className="flex-1 px-3 py-2 text-xs border border-amber-300 rounded-lg bg-white"
                  />
                  <button
                    onClick={() => handleRequestDocuments(inspectingApp.id)}
                    className="px-4 py-2 text-xs font-bold text-slate-900 bg-amber-300 hover:bg-amber-400 rounded-lg shrink-0 cursor-pointer"
                  >
                    Send Request
                  </button>
                </div>
              </div>

              {/* Submitted Information Tabs / Grids */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-4">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide pb-2 border-b border-slate-100">
                  Applicant Case Information Details
                </h4>

                {/* Personal & Passport */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">DOB:</span>
                    <span>{inspectingApp.personalInfo?.dateOfBirth || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Gender:</span>
                    <span>{inspectingApp.personalInfo?.gender || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Nationality:</span>
                    <span>{inspectingApp.personalInfo?.nationality || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Phone:</span>
                    <span>{inspectingApp.personalInfo?.phone || '—'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[10px]">Residential Address:</span>
                    <span>{inspectingApp.personalInfo?.residentialAddress || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Passport #:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {inspectingApp.passportInfo?.passportNumber || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Passport Expiry:</span>
                    <span>{inspectingApp.passportInfo?.expiryDate || '—'}</span>
                  </div>
                </div>

                {/* Travel & Professional */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Purpose:</span>
                    <span>{inspectingApp.travelInfo?.purposeOfTravel || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Intended Date:</span>
                    <span>{inspectingApp.travelInfo?.intendedTravelDate || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Destination:</span>
                    <span>{inspectingApp.travelInfo?.proposedDestination || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Employer:</span>
                    <span>{inspectingApp.additionalInfo?.currentEmployer || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Income:</span>
                    <span>{inspectingApp.additionalInfo?.monthlyIncome || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Prior U.S. Denial:</span>
                    <span className={inspectingApp.additionalInfo?.hasUsVisaDenial ? 'text-rose-700 font-bold' : ''}>
                      {inspectingApp.additionalInfo?.hasUsVisaDenial
                        ? `Yes: ${inspectingApp.additionalInfo?.usVisaDenialDetails || 'Disclosed'}`
                        : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents */}
              <div className="border border-slate-200 rounded-xl p-4">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide mb-3">
                  Uploaded Dossier Documents ({inspectingApp.documents.length})
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {inspectingApp.documents.map((d) => (
                    <div
                      key={d.id}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="truncate pr-2">
                        <p className="font-semibold text-slate-800 truncate">{d.name}</p>
                        <p className="text-[10px] text-slate-400">{d.type}</p>
                      </div>
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100 shrink-0"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Private Administrative Notes */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  Private Administrative Internal Notes
                </h4>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={privateNoteText}
                    onChange={(e) => setPrivateNoteText(e.target.value)}
                    placeholder="Enter confidential internal note (only visible to admins)..."
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                  <button
                    onClick={() => handleAddPrivateNote(inspectingApp.id)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shrink-0 cursor-pointer"
                  >
                    Add Note
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {inspectingApp.adminNotes?.map((note, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-100 text-slate-700 text-[11px]">
                      {note}
                    </div>
                  ))}
                  {(!inspectingApp.adminNotes || inspectingApp.adminNotes.length === 0) && (
                    <p className="text-slate-400 text-[11px]">No private notes entered.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: PAYMENT VERIFICATION ===================== */}
      {inspectingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-amber-500/20">
              <h3 className="text-base font-bold text-white">Manual Wire Slip Verification</h3>
              <button
                onClick={() => setInspectingPayment(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Applicant:</span>
                  <strong className="text-slate-900">{inspectingPayment.applicantName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Application Reference:</span>
                  <strong className="font-mono text-slate-900">{inspectingPayment.applicationRef}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Claimed Wire Amount:</span>
                  <strong className="font-mono text-sm text-slate-900">${inspectingPayment.amount} USD</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank Wire Reference #:</span>
                  <strong className="font-mono text-slate-900">{inspectingPayment.transactionReference}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Remittance Date:</span>
                  <span>{inspectingPayment.paymentDate}</span>
                </div>
              </div>

              {/* Receipt Preview Link */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-950 block">Bank Wire Advice / Slip:</span>
                  <span className="text-[11px] text-amber-800">{inspectingPayment.receiptFileName}</span>
                </div>
                <a
                  href={inspectingPayment.receiptFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 text-xs font-bold text-slate-900 bg-amber-200 hover:bg-amber-300 rounded"
                >
                  Inspect Slip File ↗
                </a>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Internal / Feedback Note
                </label>
                <textarea
                  rows={2}
                  value={paymentAdminNote}
                  onChange={(e) => setPaymentAdminNote(e.target.value)}
                  placeholder="e.g. Deposit cleared in JPMorgan Chase ledger on 11/11..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleVerifyPayment(inspectingPayment.id, 'confirm')}
                  className="py-2.5 px-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg text-center cursor-pointer"
                >
                  ✓ Confirm & Advance
                </button>

                <button
                  type="button"
                  onClick={() => handleVerifyPayment(inspectingPayment.id, 're-request')}
                  className="py-2.5 px-3 text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 rounded-lg text-center cursor-pointer"
                >
                  Re-Request Slip
                </button>

                <button
                  type="button"
                  onClick={() => handleVerifyPayment(inspectingPayment.id, 'reject')}
                  className="py-2.5 px-3 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg text-center cursor-pointer"
                >
                  ✕ Reject Slip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: EDIT BANK PAYMENT METHOD ===================== */}
      {editingMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-amber-500/20">
              <h3 className="text-base font-bold text-white">Bank Account Configuration</h3>
              <button
                onClick={() => setEditingMethod(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePaymentMethod} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Label / Nickname
                </label>
                <input
                  type="text"
                  required
                  value={editingMethod.label || ''}
                  onChange={(e) => setEditingMethod({ ...editingMethod, label: e.target.value })}
                  placeholder="e.g. Primary Corporate Wire Account"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    required
                    value={editingMethod.bankName || ''}
                    onChange={(e) => setEditingMethod({ ...editingMethod, bankName: e.target.value })}
                    placeholder="e.g. JPMorgan Chase Bank"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Name</label>
                  <input
                    type="text"
                    required
                    value={editingMethod.accountName || ''}
                    onChange={(e) => setEditingMethod({ ...editingMethod, accountName: e.target.value })}
                    placeholder="e.g. Beacon & Harbor LLC"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    required
                    value={editingMethod.accountNumber || ''}
                    onChange={(e) => setEditingMethod({ ...editingMethod, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Routing / SWIFT</label>
                  <input
                    type="text"
                    value={editingMethod.swiftOrRouting || ''}
                    onChange={(e) => setEditingMethod({ ...editingMethod, swiftOrRouting: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Category Fees */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Processing Fees ($ USD)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500">B1/B2</span>
                    <input
                      type="number"
                      value={editingMethod.visaFees?.B1_B2 || 240}
                      onChange={(e) =>
                        setEditingMethod({
                          ...editingMethod,
                          visaFees: {
                            ...editingMethod.visaFees!,
                            B1_B2: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">F1</span>
                    <input
                      type="number"
                      value={editingMethod.visaFees?.F1 || 290}
                      onChange={(e) =>
                        setEditingMethod({
                          ...editingMethod,
                          visaFees: {
                            ...editingMethod.visaFees!,
                            F1: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">H1B</span>
                    <input
                      type="number"
                      value={editingMethod.visaFees?.H1B || 480}
                      onChange={(e) =>
                        setEditingMethod({
                          ...editingMethod,
                          visaFees: {
                            ...editingMethod.visaFees!,
                            H1B: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Instructions</label>
                <textarea
                  rows={2}
                  value={editingMethod.instructions || ''}
                  onChange={(e) => setEditingMethod({ ...editingMethod, instructions: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={editingMethod.isActive ?? true}
                  onChange={(e) => setEditingMethod({ ...editingMethod, isActive: e.target.checked })}
                  className="rounded text-slate-900"
                />
                <label htmlFor="activeCheck" className="text-xs font-semibold text-slate-800">
                  Account is Active for Applicant Wire Remittance
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Save Bank Account Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
