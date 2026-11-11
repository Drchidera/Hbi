import React, { useState } from 'react';
import type { VisaApplication, ApplicationStatus } from '../../types';
import { VISA_CATEGORY_LABELS, ALL_APPLICATION_STATUSES } from '../../types';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  MessageSquare,
  Upload,
  ArrowRight,
  ShieldAlert,
  FileCheck,
  XCircle,
  Calendar,
  Building,
  User,
} from 'lucide-react';
import { api } from '../../lib/api';

interface ApplicationTrackerProps {
  application: VisaApplication;
  onOpenPayment: () => void;
  onOpenChat: () => void;
  onRefresh: () => void;
}

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({
  application,
  onOpenPayment,
  onOpenChat,
  onRefresh,
}) => {
  const [replacingDocId, setReplacingDocId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const getStatusBadgeClass = (status: ApplicationStatus) => {
    switch (status) {
      case 'Draft':
        return 'text-slate-600 bg-slate-100 border-slate-200';
      case 'Submitted':
        return 'text-sky-700 bg-sky-50 border-sky-200';
      case 'Awaiting Payment':
        return 'text-amber-800 bg-amber-50 border-amber-300';
      case 'Payment Under Review':
        return 'text-amber-700 bg-amber-100 border-amber-300';
      case 'Payment Confirmed':
        return 'text-emerald-700 bg-emerald-50 border-emerald-300';
      case 'Processing':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'Additional Documents Required':
        return 'text-rose-700 bg-rose-50 border-rose-300';
      case 'Under Administrative Review':
        return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      case 'Approved by Service Administrator':
        return 'text-emerald-800 bg-emerald-100 border-emerald-300';
      case 'Rejected by Service Administrator':
        return 'text-rose-800 bg-rose-100 border-rose-300';
      case 'Completed':
        return 'text-slate-900 bg-slate-200 border-slate-300';
      case 'Cancelled':
        return 'text-slate-500 bg-slate-100 border-slate-200';
      default:
        return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  const handleDocumentReplacement = async (e: React.ChangeEvent<HTMLInputElement>, docId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const res = await api.uploadFile(file, 'supporting_doc');
      const updatedDocs = application.documents.map((d) =>
        d.id === docId
          ? {
              ...d,
              name: file.name,
              fileUrl: res.url,
              fileSize: res.fileSize,
              uploadedAt: new Date().toISOString(),
              status: 'uploaded' as const,
            }
          : d
      );

      await api.updateApplication(application.id, { documents: updatedDocs });
      setReplacingDocId(null);
      onRefresh();
    } catch (err: any) {
      setUploadError('Failed to upload replacement document: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Dossier Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-semibold text-slate-500">
                REFERENCE:
              </span>
              <strong className="font-mono text-base text-slate-900 tracking-wide">
                {application.referenceNumber}
              </strong>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(
                  application.status
                )}`}
              >
                {application.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {VISA_CATEGORY_LABELS[application.visaCategory]} · Created on{' '}
              {new Date(application.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(application.status === 'Awaiting Payment' ||
              application.status === 'Draft' ||
              application.paymentStatus === 'unpaid') && (
              <button
                onClick={onOpenPayment}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Submit Wire Payment</span>
              </button>
            )}

            <button
              onClick={onOpenChat}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>Contact Case Officer</span>
            </button>
          </div>
        </div>

        {/* Administrative Status Banner */}
        {(application.status === 'Approved by Service Administrator' ||
          application.status === 'Rejected by Service Administrator') && (
          <div className="mt-4 p-3.5 bg-slate-900 text-slate-100 rounded-lg text-xs leading-relaxed flex items-start gap-2.5 border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-200 uppercase tracking-wide text-[11px] mb-0.5">
                Case File Review: {application.status}
              </p>
              <p className="text-slate-300">
                Your dossier review has been finalized by our senior advisory desk.
              </p>
              {application.rejectionReason && (
                <p className="mt-2 text-rose-300 font-semibold bg-rose-950/50 p-2 rounded border border-rose-800/60">
                  Reviewer Notes: {application.rejectionReason}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Callout if Additional Documents are requested */}
        {application.status === 'Additional Documents Required' && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Supplementary Documents Requested by Administrator:</p>
                <p className="text-rose-800 bg-white p-2.5 rounded border border-rose-200">
                  {application.requestedDocumentsNote || 'Please supply updated bank statements and passport photo.'}
                </p>
                <p className="text-[11px] text-rose-700">
                  You may replace or append documents directly in the Document Vault below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Application details grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Applicant Legal Name</span>
            <strong className="text-slate-900">{application.applicantName}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Passport Number</span>
            <strong className="font-mono text-slate-900">{application.passportInfo?.passportNumber || '—'}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Intended Travel Date</span>
            <span className="text-slate-800">{application.travelInfo?.intendedTravelDate || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Advisory Fee Status</span>
            <span
              className={`font-semibold ${
                application.paymentStatus === 'confirmed'
                  ? 'text-emerald-700'
                  : application.paymentStatus === 'under_review'
                  ? 'text-amber-700'
                  : 'text-slate-600'
              }`}
            >
              {application.paymentStatus === 'confirmed'
                ? 'Paid & Confirmed ($' + application.feeAmount + ')'
                : application.paymentStatus === 'under_review'
                ? 'Wire Slip Under Review'
                : 'Awaiting Payment ($' + application.feeAmount + ')'}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Timeline & Document Locker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timeline Column (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <span>Audit & Procedural Lifecycle History</span>
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Complete chronological record of all administrative status changes, notes, and verification stamps.
          </p>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {application.statusHistory && application.statusHistory.length > 0 ? (
              application.statusHistory.map((item, idx) => (
                <div key={item.id || idx} className="relative group text-xs">
                  {/* Pin Dot */}
                  <div
                    className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                      idx === 0 ? 'border-amber-500 ring-2 ring-amber-200' : 'border-slate-300'
                    }`}
                  />
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-bold text-slate-900 text-xs">
                      {item.status}
                    </span>
                    <time className="text-[11px] text-slate-400 font-mono tabular-nums">
                      {new Date(item.changedAt).toLocaleString()}
                    </time>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-1">
                    Updated by: <span className="text-slate-700 font-medium">{item.changedBy}</span>
                  </p>
                  {item.note && (
                    <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-700 text-xs leading-relaxed">
                      {item.note}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No status transitions recorded yet.</p>
            )}
          </div>
        </div>

        {/* Document Vault Column (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-slate-600" />
                <span>Uploaded Documents Locker</span>
              </h3>
              <span className="font-mono text-xs text-slate-500 tabular-nums">
                {application.documents.length} items
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Private dossier files submitted for consular compliance.
            </p>

            {uploadError && (
              <div className="p-2 mb-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded">
                {uploadError}
              </div>
            )}

            <div className="space-y-2.5">
              {application.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between gap-2"
                >
                  <div className="truncate pr-2">
                    <p className="font-semibold text-slate-800 truncate">{doc.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                      {doc.type.replace('_', ' ')} · {(doc.fileSize / 1024).toFixed(0)} KB
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded"
                    >
                      View
                    </a>

                    {application.status === 'Additional Documents Required' && (
                      <label className="px-2 py-1 text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded cursor-pointer">
                        {uploading && replacingDocId === doc.id ? 'Uploading...' : 'Replace'}
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            setReplacingDocId(doc.id);
                            handleDocumentReplacement(e, doc.id);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}

              {application.documents.length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No supplementary documents uploaded.
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-slate-100 text-[11px] text-slate-400">
            Files are encrypted and stored in compliance with U.S. privacy safeguards.
          </div>
        </div>
      </div>
    </div>
  );
};
