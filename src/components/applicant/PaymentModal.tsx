import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { VisaApplication, PaymentMethod } from '../../types';
import { VISA_CATEGORY_LABELS } from '../../types';
import {
  CreditCard,
  Building,
  Copy,
  Check,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Loader2,
  Lock,
} from 'lucide-react';

interface PaymentModalProps {
  application: VisaApplication;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSubmitted: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  application,
  isOpen,
  onClose,
  onPaymentSubmitted,
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [amount, setAmount] = useState<number>(application.feeAmount || 240);
  const [transactionReference, setTransactionReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');

  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPaymentMethods();
    }
  }, [isOpen]);

  const loadPaymentMethods = async () => {
    try {
      const res = await api.getPaymentMethods();
      setPaymentMethods(res.paymentMethods);
      if (res.paymentMethods.length > 0) {
        setSelectedMethodId(res.paymentMethods[0].id);
        const fee = res.paymentMethods[0].visaFees[application.visaCategory] || application.feeAmount || 240;
        setAmount(fee);
      }
    } catch (e: any) {
      setError('Failed to retrieve verified bank accounts: ' + e.message);
    }
  };

  const selectedMethod = paymentMethods.find((p) => p.id === selectedMethodId) || paymentMethods[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('File exceeds 15MB limit. Please upload a smaller receipt slip.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const res = await api.uploadFile(file, 'payment_receipt');
      setReceiptFile(file);
      setReceiptUrl(res.url);
      setReceiptFileName(file.name);
    } catch (err: any) {
      setError('Failed to upload receipt slip: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!receiptUrl) {
      setError('Please upload a screenshot or PDF receipt of your wire transfer.');
      return;
    }

    if (!transactionReference.trim()) {
      setError('Please enter the bank transaction reference number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitPayment({
        applicationId: application.id,
        amount: Number(amount),
        paymentMethodId: selectedMethod?.id || 'manual',
        transactionReference: transactionReference.trim(),
        paymentDate,
        receiptFileUrl: receiptUrl,
        receiptFileName: receiptFileName || 'Bank_Transfer_Slip.pdf',
      });

      // Show exact mandatory message
      setSubmittedMessage(res.message);
      onPaymentSubmitted();
    } catch (err: any) {
      setError('Failed to submit payment confirmation: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Manual Wire Transfer & Escrow</h3>
              <p className="text-xs text-slate-300">
                Application Ref: <strong className="text-white">{application.referenceNumber}</strong> ({VISA_CATEGORY_LABELS[application.visaCategory]})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success confirmation screen */}
        {submittedMessage ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Payment Submitted for Audit</h4>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm text-emerald-900 leading-relaxed font-medium">
              "{submittedMessage}"
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Our financial officers will cross-reference your transaction reference with incoming bank statements. Once verified, your application status will automatically update to <strong>Payment Confirmed</strong>.
            </p>
            <button
              onClick={() => {
                setSubmittedMessage(null);
                onClose();
              }}
              className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Return to Dossier
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Fee Display */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Application Processing Fee
                </span>
                <span className="text-xs text-slate-600">
                  {VISA_CATEGORY_LABELS[application.visaCategory]}
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                  ${amount} USD
                </span>
              </div>
            </div>

            {/* Multiple accounts selection if available */}
            {paymentMethods.length > 1 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Designee Corporate Account
                </label>
                <select
                  value={selectedMethodId}
                  onChange={(e) => setSelectedMethodId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {paymentMethods.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label} ({m.bankName})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 2-5: Administrator's Active Bank Details */}
            {selectedMethod && (
              <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-amber-700" />
                    <span>Official Designated Bank Account</span>
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    {selectedMethod.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Bank Name:</span>
                    <strong className="text-slate-900">{selectedMethod.bankName}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Account Name:</span>
                    <strong className="text-slate-900">{selectedMethod.accountName}</strong>
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-between p-2.5 bg-white border border-amber-200 rounded-lg">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Account Number:</span>
                      <strong className="font-mono text-sm tracking-wider text-slate-900">
                        {selectedMethod.accountNumber}
                      </strong>
                      {selectedMethod.swiftOrRouting && (
                        <span className="block text-[11px] text-slate-500 font-mono mt-0.5">
                          {selectedMethod.swiftOrRouting}
                        </span>
                      )}
                    </div>

                    {/* 6. Copy Account Number button */}
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedMethod.accountNumber)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-900 bg-amber-200 hover:bg-amber-300 rounded-md transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-800" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Account Number</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 7. Payment Instructions */}
                {selectedMethod.instructions && (
                  <div className="pt-2 border-t border-amber-200/60 text-[11px] text-amber-950 leading-relaxed">
                    <p className="font-semibold mb-0.5">Wire Instructions:</p>
                    <p>{selectedMethod.instructions}</p>
                  </div>
                )}
              </div>
            )}

            {/* 8. Payment Confirmation Form Fields */}
            <div className="border-t border-slate-200 pt-4 space-y-3.5">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Submit Transfer Confirmation Advice
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount Paid ($ USD)
                  </label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Wire / Deposit
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Transaction Reference / Wire Ref #
                </label>
                <input
                  type="text"
                  required
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  placeholder="e.g. TR-98420184920 or FedWire #89201"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>

              {/* Receipt File Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload Bank Transfer Receipt (PDF or Screenshot)
                </label>
                {receiptUrl ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-medium text-emerald-950 truncate">
                        {receiptFileName || 'Receipt_Slip.pdf'}
                      </span>
                    </div>
                    <label className="text-[11px] font-bold text-emerald-900 hover:underline cursor-pointer shrink-0">
                      Change
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={handleReceiptUpload}
                      />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 rounded-lg cursor-pointer transition-colors text-center">
                    {uploading ? (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                        <span>Processing Receipt Document...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-400 mb-1" />
                        <span className="text-xs font-semibold text-slate-800">
                          Click to select Screenshot or PDF receipt
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          PDF, JPG, PNG up to 15MB
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleReceiptUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || uploading}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Submitting Confirmation...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Submit Payment Confirmation for Administrative Review</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
