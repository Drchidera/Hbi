import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { VisaApplication, VisaCategory, ApplicationDocument } from '../../types';
import { VISA_CATEGORY_LABELS } from '../../types';
import {
  FileText,
  User,
  Globe,
  Plane,
  Briefcase,
  Upload,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowRight,
  ArrowLeft,
  X,
  FileCheck,
  File,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

interface ApplicationWizardProps {
  initialCategory?: VisaCategory;
  existingApplication?: VisaApplication | null;
  onClose: () => void;
  onSuccess: (app: VisaApplication) => void;
  onProceedToPayment: (app: VisaApplication) => void;
}

export const ApplicationWizard: React.FC<ApplicationWizardProps> = ({
  initialCategory = 'B1_B2',
  existingApplication,
  onClose,
  onSuccess,
  onProceedToPayment,
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 7;

  // Selected category
  const [visaCategory, setVisaCategory] = useState<VisaCategory>(
    existingApplication?.visaCategory || initialCategory
  );

  // 1. Personal Information
  const [personalInfo, setPersonalInfo] = useState({
    fullName: existingApplication?.personalInfo?.fullName || user?.fullName || '',
    dateOfBirth: existingApplication?.personalInfo?.dateOfBirth || '',
    gender: existingApplication?.personalInfo?.gender || 'Male',
    nationality: existingApplication?.personalInfo?.nationality || user?.countryOfResidence || '',
    countryOfResidence: existingApplication?.personalInfo?.countryOfResidence || user?.countryOfResidence || 'United States',
    residentialAddress: existingApplication?.personalInfo?.residentialAddress || '',
    phone: existingApplication?.personalInfo?.phone || user?.phone || '',
    email: existingApplication?.personalInfo?.email || user?.email || '',
    maritalStatus: existingApplication?.personalInfo?.maritalStatus || 'Single',
  });

  // 2. Passport Information
  const [passportInfo, setPassportInfo] = useState({
    passportNumber: existingApplication?.passportInfo?.passportNumber || '',
    issuingCountry: existingApplication?.passportInfo?.issuingCountry || '',
    issueDate: existingApplication?.passportInfo?.issueDate || '',
    expiryDate: existingApplication?.passportInfo?.expiryDate || '',
    passportPhotoUrl: existingApplication?.passportInfo?.passportPhotoUrl || '',
    passportPhotoName: existingApplication?.passportInfo?.passportPhotoName || '',
    passportPageUrl: existingApplication?.passportInfo?.passportPageUrl || '',
    passportPageName: existingApplication?.passportInfo?.passportPageName || '',
  });

  // 3. Travel Information
  const [travelInfo, setTravelInfo] = useState({
    purposeOfTravel: existingApplication?.travelInfo?.purposeOfTravel || 'Tourism & Sightseeing',
    intendedTravelDate: existingApplication?.travelInfo?.intendedTravelDate || '',
    intendedDurationOfStay: existingApplication?.travelInfo?.intendedDurationOfStay || '2 Weeks',
    proposedDestination: existingApplication?.travelInfo?.proposedDestination || 'New York, NY',
    accommodationInfo: existingApplication?.travelInfo?.accommodationInfo || '',
    travelFundingInfo: existingApplication?.travelInfo?.travelFundingInfo || 'Self-funded from personal savings',
  });

  // 4. Additional Information
  const [additionalInfo, setAdditionalInfo] = useState({
    employmentStatus: existingApplication?.additionalInfo?.employmentStatus || 'Employed Full-Time',
    currentEmployer: existingApplication?.additionalInfo?.currentEmployer || '',
    jobTitle: existingApplication?.additionalInfo?.jobTitle || '',
    monthlyIncome: existingApplication?.additionalInfo?.monthlyIncome || '',
    educationalBackground: existingApplication?.additionalInfo?.educationalBackground || "Bachelor's Degree",
    previousInternationalTravel: existingApplication?.additionalInfo?.previousInternationalTravel || '',
    previousUsVisaHistory: existingApplication?.additionalInfo?.previousUsVisaHistory || 'No previous US visa',
    hasUsVisaDenial: existingApplication?.additionalInfo?.hasUsVisaDenial || false,
    usVisaDenialDetails: existingApplication?.additionalInfo?.usVisaDenialDetails || '',
    additionalNotes: existingApplication?.additionalInfo?.additionalNotes || '',
  });

  // 5. Documents
  const [documents, setDocuments] = useState<ApplicationDocument[]>(
    existingApplication?.documents || []
  );

  // Wizard states
  const [applicationId, setApplicationId] = useState<string | null>(existingApplication?.id || null);
  const [referenceNumber, setReferenceNumber] = useState<string>(existingApplication?.referenceNumber || '');
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [declarationAgreed, setDeclarationAgreed] = useState(false);
  const [autoSavedNotice, setAutoSavedNotice] = useState<string | null>(null);

  // Auto-save draft every 45 seconds if changes happen
  useEffect(() => {
    const timer = setInterval(() => {
      saveDraft(true);
    }, 45000);
    return () => clearInterval(timer);
  }, [visaCategory, personalInfo, passportInfo, travelInfo, additionalInfo, documents]);

  const saveDraft = async (silent: boolean = false) => {
    if (!silent) setSavingDraft(true);
    setError(null);
    try {
      if (applicationId) {
        const res = await api.updateApplication(applicationId, {
          visaCategory,
          personalInfo,
          passportInfo,
          travelInfo,
          additionalInfo,
          documents,
        });
        if (!silent) {
          setAutoSavedNotice('Application draft updated successfully.');
          setTimeout(() => setAutoSavedNotice(null), 3000);
        }
      } else {
        const res = await api.createApplication({
          visaCategory,
          isDraft: true,
          personalInfo,
          passportInfo,
          travelInfo,
          additionalInfo,
          documents,
        });
        setApplicationId(res.application.id);
        setReferenceNumber(res.application.referenceNumber);
        if (!silent) {
          setAutoSavedNotice(`Draft saved (Ref: ${res.application.referenceNumber}).`);
          setTimeout(() => setAutoSavedNotice(null), 3000);
        }
      }
    } catch (err: any) {
      if (!silent) setError('Failed to save draft: ' + err.message);
    } finally {
      if (!silent) setSavingDraft(false);
    }
  };

  const handleFileUpload = async (file: File, docType: ApplicationDocument['type'], customName?: string) => {
    setUploadingDocType(docType);
    setUploadProgress(20);
    setError(null);

    // Validate size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setError('File size exceeds the 20MB limit. Please upload a smaller document.');
      setUploadingDocType(null);
      return;
    }

    try {
      setUploadProgress(50);
      const res = await api.uploadFile(file, docType);
      setUploadProgress(90);

      const newDoc: ApplicationDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: docType,
        name: customName || file.name,
        fileUrl: res.url,
        fileSize: res.fileSize,
        mimeType: res.mimeType,
        uploadedAt: new Date().toISOString(),
        status: 'uploaded',
      };

      // If passport photo or page, sync to passportInfo
      if (docType === 'passport_photo') {
        setPassportInfo((prev) => ({
          ...prev,
          passportPhotoUrl: res.url,
          passportPhotoName: file.name,
        }));
      } else if (docType === 'passport_page') {
        setPassportInfo((prev) => ({
          ...prev,
          passportPageUrl: res.url,
          passportPageName: file.name,
        }));
      }

      // Filter out existing doc of same single-item type if replacing, or append
      setDocuments((prev) => {
        const isSingleType = ['passport_photo', 'passport_page'].includes(docType);
        if (isSingleType) {
          return [...prev.filter((d) => d.type !== docType), newDoc];
        }
        return [...prev, newDoc];
      });

      setUploadProgress(100);
      setTimeout(() => setUploadingDocType(null), 500);
    } catch (err: any) {
      setError('Upload failed: ' + err.message);
      setUploadingDocType(null);
    }
  };

  const removeDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleSubmitApplication = async () => {
    if (!declarationAgreed) {
      setError('You must confirm that all submitted information is accurate and agree to the service terms.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let finalAppId = applicationId;
      if (!finalAppId) {
        const createRes = await api.createApplication({
          visaCategory,
          isDraft: false,
          personalInfo,
          passportInfo,
          travelInfo,
          additionalInfo,
          documents,
        });
        finalAppId = createRes.application.id;
        onSuccess(createRes.application);
        onProceedToPayment(createRes.application);
        return;
      }

      // Update and submit
      await api.updateApplication(finalAppId, {
        visaCategory,
        personalInfo,
        passportInfo,
        travelInfo,
        additionalInfo,
        documents,
      });

      const submitRes = await api.submitApplication(finalAppId);
      onSuccess(submitRes.application);
      onProceedToPayment(submitRes.application);
    } catch (err: any) {
      setError('Failed to submit application: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-amber-500/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
                Step {currentStep} of {totalSteps}
              </span>
              {referenceNumber && (
                <span className="font-mono text-xs text-slate-400">
                  · Ref: <strong className="text-white">{referenceNumber}</strong>
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              {currentStep === 1 && 'Select U.S. Visa Category'}
              {currentStep === 2 && 'Personal Identification & Contact'}
              {currentStep === 3 && 'Passport Bio-Data & Photographs'}
              {currentStep === 4 && 'Intended Travel & Funding Details'}
              {currentStep === 5 && 'Professional & Immigration Background'}
              {currentStep === 6 && 'Upload Supporting Documentation'}
              {currentStep === 7 && 'Review Dossier & Submit'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => saveDraft(false)}
              disabled={savingDraft}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingDraft ? 'Saving...' : 'Save Draft'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice Bar */}
        {autoSavedNotice && (
          <div className="bg-emerald-50 text-emerald-800 text-xs px-6 py-2 border-b border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{autoSavedNotice}</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 text-rose-800 text-xs px-6 py-2 border-b border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step Progress Bar */}
        <div className="bg-slate-100 h-1.5 w-full">
          <div
            className="bg-amber-500 h-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* STEP 1: CATEGORY SELECTION */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Which category matches your purpose of travel?
                </h3>
                <p className="text-xs text-slate-500">
                  Select the appropriate visa classification to configure the corresponding checklist and filing fees.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(
                  [
                    {
                      cat: 'B1_B2',
                      name: 'B1/B2 Tourist & Business',
                      fee: '$240 USD',
                      desc: 'For business negotiations, short-term tourism, conferences, or visiting relatives.',
                    },
                    {
                      cat: 'F1',
                      name: 'F1 Academic Student',
                      fee: '$290 USD',
                      desc: 'For accredited U.S. college, university, or language conservatory enrollment with Form I-20.',
                    },
                    {
                      cat: 'J1',
                      name: 'J1 Exchange Visitor',
                      fee: '$275 USD',
                      desc: 'For scholars, research fellows, au pairs, and exchange programs with Form DS-2019.',
                    },
                    {
                      cat: 'H1B',
                      name: 'H1B Specialty Occupation',
                      fee: '$480 USD',
                      desc: 'For professionals holding USCIS I-797 approval notices and specialized degree qualifications.',
                    },
                    {
                      cat: 'OTHER',
                      name: 'Other Non-Immigrant Visa',
                      fee: '$320 USD',
                      desc: 'L1 intra-company, O1 extraordinary ability, P performers, or transit classifications.',
                    },
                  ] as const
                ).map((item) => (
                  <div
                    key={item.cat}
                    onClick={() => setVisaCategory(item.cat)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      visaCategory === item.cat
                        ? 'border-slate-900 bg-slate-900/5 ring-2 ring-slate-900/10'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-slate-900">{item.name}</span>
                      <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded tabular-nums">
                        {item.fee}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: PERSONAL INFORMATION */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Applicant Personal Information
                </h3>
                <p className="text-xs text-slate-500">
                  Ensure details match your primary international passport exactly.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Legal Name (as displayed on passport)
                  </label>
                  <input
                    type="text"
                    required
                    value={personalInfo.fullName}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                    placeholder="Surname, Given Names"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    required
                    value={personalInfo.dateOfBirth}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={personalInfo.gender}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, gender: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other / Non-Binary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nationality (Citizenship)
                  </label>
                  <input
                    type="text"
                    required
                    value={personalInfo.nationality}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, nationality: e.target.value })}
                    placeholder="e.g. British, Indian, Canadian"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Country of Current Residence
                  </label>
                  <input
                    type="text"
                    required
                    value={personalInfo.countryOfResidence}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, countryOfResidence: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Residential Street Address
                  </label>
                  <input
                    type="text"
                    required
                    value={personalInfo.residentialAddress}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, residentialAddress: e.target.value })}
                    placeholder="Street, City, Postal Code"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile / Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Marital Status
                  </label>
                  <select
                    value={personalInfo.maritalStatus}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, maritalStatus: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="Single">Single (Never Married)</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Legally Separated">Legally Separated</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PASSPORT INFORMATION */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Passport Bio-Data & Photographs
                </h3>
                <p className="text-xs text-slate-500">
                  U.S. regulations require passports to be valid for at least six months beyond your intended period of stay.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Passport Book Number
                  </label>
                  <input
                    type="text"
                    required
                    value={passportInfo.passportNumber}
                    onChange={(e) => setPassportInfo({ ...passportInfo, passportNumber: e.target.value })}
                    placeholder="e.g. P12345678"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Issuing Country / Authority
                  </label>
                  <input
                    type="text"
                    required
                    value={passportInfo.issuingCountry}
                    onChange={(e) => setPassportInfo({ ...passportInfo, issuingCountry: e.target.value })}
                    placeholder="e.g. United Kingdom"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Passport Issue Date
                  </label>
                  <input
                    type="date"
                    required
                    value={passportInfo.issueDate}
                    onChange={(e) => setPassportInfo({ ...passportInfo, issueDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Passport Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={passportInfo.expiryDate}
                    onChange={(e) => setPassportInfo({ ...passportInfo, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Uploads for Photo & Bio-data page */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* 2x2 Photo Upload */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-xs font-bold text-slate-900 block mb-1">
                    2x2 Inch Color Passport Photograph
                  </span>
                  <p className="text-[11px] text-slate-500 mb-3">
                    White background, neutral facial expression, no eyeglasses. JPG or PNG.
                  </p>

                  {passportInfo.passportPhotoUrl ? (
                    <div className="flex items-center justify-between p-2.5 bg-white border border-emerald-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs text-slate-800 font-medium truncate max-w-[150px]">
                          {passportInfo.passportPhotoName || 'Photo Attached'}
                        </span>
                      </div>
                      <label className="text-[11px] font-bold text-slate-700 hover:text-slate-900 cursor-pointer">
                        Replace
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'passport_photo', '2x2_Passport_Photo');
                          }}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-slate-400 bg-white rounded-lg cursor-pointer transition-colors text-center">
                      <Upload className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-700">Upload 2x2 Photograph</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">JPG / PNG up to 10MB</span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'passport_photo', '2x2_Passport_Photo');
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Passport Bio Data Page */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-xs font-bold text-slate-900 block mb-1">
                    Passport Information Page Copy
                  </span>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Clear scan of bio-data page with photo, signature, and machine-readable zone.
                  </p>

                  {passportInfo.passportPageUrl ? (
                    <div className="flex items-center justify-between p-2.5 bg-white border border-emerald-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs text-slate-800 font-medium truncate max-w-[150px]">
                          {passportInfo.passportPageName || 'Bio-Data Attached'}
                        </span>
                      </div>
                      <label className="text-[11px] font-bold text-slate-700 hover:text-slate-900 cursor-pointer">
                        Replace
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'passport_page', 'Passport_Bio_Data_Page');
                          }}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-slate-400 bg-white rounded-lg cursor-pointer transition-colors text-center">
                      <FileText className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-700">Upload Bio-Data Scan</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">PDF / JPG up to 15MB</span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'passport_page', 'Passport_Bio_Data_Page');
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: TRAVEL INFORMATION */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Intended Travel & Proposed Stay
                </h3>
                <p className="text-xs text-slate-500">
                  Provide estimated dates and itinerary details. U.S. Embassies expect coherent travel purposes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specific Purpose of Travel
                  </label>
                  <input
                    type="text"
                    required
                    value={travelInfo.purposeOfTravel}
                    onChange={(e) => setTravelInfo({ ...travelInfo, purposeOfTravel: e.target.value })}
                    placeholder="e.g. Attending annual medical device symposium & New York tourism"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Intended Travel Date
                  </label>
                  <input
                    type="date"
                    required
                    value={travelInfo.intendedTravelDate}
                    onChange={(e) => setTravelInfo({ ...travelInfo, intendedTravelDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Intended Duration of Stay
                  </label>
                  <input
                    type="text"
                    required
                    value={travelInfo.intendedDurationOfStay}
                    onChange={(e) => setTravelInfo({ ...travelInfo, intendedDurationOfStay: e.target.value })}
                    placeholder="e.g. 14 Days / 3 Months"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Proposed Destination City & State
                  </label>
                  <input
                    type="text"
                    required
                    value={travelInfo.proposedDestination}
                    onChange={(e) => setTravelInfo({ ...travelInfo, proposedDestination: e.target.value })}
                    placeholder="e.g. Chicago, Illinois"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Accommodation / Address in U.S.
                  </label>
                  <input
                    type="text"
                    required
                    value={travelInfo.accommodationInfo}
                    onChange={(e) => setTravelInfo({ ...travelInfo, accommodationInfo: e.target.value })}
                    placeholder="Hotel reservation or host family address"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Entity / Person Funding the Trip
                  </label>
                  <input
                    type="text"
                    required
                    value={travelInfo.travelFundingInfo}
                    onChange={(e) => setTravelInfo({ ...travelInfo, travelFundingInfo: e.target.value })}
                    placeholder="e.g. Self-funded / Employer sponsored / University fellowship"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: ADDITIONAL & BACKGROUND INFO */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Professional Ties & U.S. Visa History
                </h3>
                <p className="text-xs text-slate-500">
                  Consular officers assess non-immigrant intent via economic stability and immigration compliance.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Employment Status
                  </label>
                  <select
                    value={additionalInfo.employmentStatus}
                    onChange={(e) => setAdditionalInfo({ ...additionalInfo, employmentStatus: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="Employed Full-Time">Employed Full-Time</option>
                    <option value="Self-Employed / Business Owner">Self-Employed / Business Owner</option>
                    <option value="Student">Enrolled Student</option>
                    <option value="Retired">Retired</option>
                    <option value="Unemployed">Seeking Employment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Employer / Institution Name
                  </label>
                  <input
                    type="text"
                    value={additionalInfo.currentEmployer}
                    onChange={(e) => setAdditionalInfo({ ...additionalInfo, currentEmployer: e.target.value })}
                    placeholder="e.g. Meridian Global Technologies"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Job Title / Field of Study
                  </label>
                  <input
                    type="text"
                    value={additionalInfo.jobTitle}
                    onChange={(e) => setAdditionalInfo({ ...additionalInfo, jobTitle: e.target.value })}
                    placeholder="e.g. Senior Systems Architect"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Approximate Monthly Income ($ USD equivalent)
                  </label>
                  <input
                    type="text"
                    value={additionalInfo.monthlyIncome}
                    onChange={(e) => setAdditionalInfo({ ...additionalInfo, monthlyIncome: e.target.value })}
                    placeholder="e.g. $4,500"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Highest Educational Attainment
                  </label>
                  <input
                    type="text"
                    value={additionalInfo.educationalBackground}
                    onChange={(e) => setAdditionalInfo({ ...additionalInfo, educationalBackground: e.target.value })}
                    placeholder="e.g. Master of Science in Electrical Engineering, Imperial College"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Countries Visited in Past 5 Years
                  </label>
                  <input
                    type="text"
                    value={additionalInfo.previousInternationalTravel}
                    onChange={(e) => setAdditionalInfo({ ...additionalInfo, previousInternationalTravel: e.target.value })}
                    placeholder="e.g. France (2024), Germany (2023), Japan (2022)"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Previous U.S. Travel or Visa Record
                  </label>
                  <input
                    type="text"
                    value={additionalInfo.previousUsVisaHistory}
                    onChange={(e) => setAdditionalInfo({ ...additionalInfo, previousUsVisaHistory: e.target.value })}
                    placeholder="e.g. Issued B1/B2 in 2018 (expired), visited California in 2019"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                {/* Prior denial toggle */}
                <div className="sm:col-span-2 p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="denial"
                      checked={additionalInfo.hasUsVisaDenial}
                      onChange={(e) => setAdditionalInfo({ ...additionalInfo, hasUsVisaDenial: e.target.checked })}
                      className="rounded border-amber-400 text-slate-900"
                    />
                    <label htmlFor="denial" className="text-xs font-bold text-amber-950">
                      Have you ever been refused a U.S. visa or withdrawn an application at the port of entry?
                    </label>
                  </div>
                  {additionalInfo.hasUsVisaDenial && (
                    <div>
                      <textarea
                        rows={2}
                        value={additionalInfo.usVisaDenialDetails}
                        onChange={(e) => setAdditionalInfo({ ...additionalInfo, usVisaDenialDetails: e.target.value })}
                        placeholder="Please disclose the consular post, year, and section of law if known (e.g. 214(b) in London, 2021). Our advisors will prepare mitigating ties."
                        className="w-full px-3 py-2 text-xs border border-amber-300 rounded-lg bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: DOCUMENT VAULT UPLOADS */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Upload Supporting Dossier Documents
                </h3>
                <p className="text-xs text-slate-500">
                  Supported formats: <strong>JPG, PNG, PDF</strong> (maximum 20MB per file). Uploading robust supporting documentation expedites case audit.
                </p>
              </div>

              {/* Upload Slots */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    type: 'bank_statement' as const,
                    title: 'Bank Account Statements (Past 6 Months)',
                    desc: 'Official bank stamped statement showing liquid operational funds.',
                  },
                  {
                    type: 'employment_letter' as const,
                    title: 'Employer Introduction / Leave Authorization',
                    desc: 'Letterhead stating position, tenure, salary, and approved return date.',
                  },
                  {
                    type: 'invitation_letter' as const,
                    title: 'U.S. Host Invitation / Conference Pass',
                    desc: 'Conference registration, host family affidavit, or corporate invitation.',
                  },
                  {
                    type: 'education_certificate' as const,
                    title: 'Educational Certificates / Form I-20',
                    desc: 'Degrees, diplomas, academic transcripts, or university admission packets.',
                  },
                  {
                    type: 'supporting_doc' as const,
                    title: 'Property Deeds / Home Ties Proof',
                    desc: 'Real estate titles, vehicle registration, or local business ownership.',
                  },
                  {
                    type: 'other' as const,
                    title: 'Other Relevant Supplementary Evidence',
                    desc: 'Any additional corroborating affidavit or sponsorship proof.',
                  },
                ].map((slot) => {
                  const existingForSlot = documents.filter((d) => d.type === slot.type);
                  return (
                    <div key={slot.type} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block mb-0.5">{slot.title}</span>
                        <p className="text-[11px] text-slate-500 mb-3">{slot.desc}</p>

                        {/* List uploaded for this slot */}
                        {existingForSlot.length > 0 && (
                          <div className="space-y-1.5 mb-3">
                            {existingForSlot.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg text-xs"
                              >
                                <div className="flex items-center gap-2 truncate pr-2">
                                  <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="truncate text-slate-800 font-medium">{doc.name}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeDocument(doc.id)}
                                  className="text-slate-400 hover:text-rose-600 shrink-0"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload {slot.type.replace('_', ' ')}</span>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFileUpload(e.target.files[0], slot.type, slot.title);
                            }
                          }}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>

              {uploadingDocType && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-xs text-amber-900">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                  <div className="w-full">
                    <p className="font-semibold">Encrypting & Storing Document...</p>
                    <div className="bg-amber-200 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div className="bg-amber-600 h-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 7: REVIEW & CONFIRMATION */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Comprehensive Dossier Review
                </h3>
                <p className="text-xs text-slate-500">
                  Please review all biographical, passport, and travel assertions prior to final case submission.
                </p>
              </div>

              {/* Review card */}
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4 text-xs">
                {/* Header summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Selected Category</span>
                    <p className="font-bold text-slate-900 text-sm">{VISA_CATEGORY_LABELS[visaCategory]}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Applicable Advisory Fee</span>
                    <p className="font-mono font-bold text-slate-900 text-sm">
                      {visaCategory === 'B1_B2' && '$240 USD'}
                      {visaCategory === 'F1' && '$290 USD'}
                      {visaCategory === 'J1' && '$275 USD'}
                      {visaCategory === 'H1B' && '$480 USD'}
                      {visaCategory === 'OTHER' && '$320 USD'}
                    </p>
                  </div>
                </div>

                {/* Personal */}
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1">1. Personal & Contact</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Name:</span>
                      <span className="font-medium">{personalInfo.fullName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">DOB:</span>
                      <span>{personalInfo.dateOfBirth || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Nationality:</span>
                      <span>{personalInfo.nationality || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Marital:</span>
                      <span>{personalInfo.maritalStatus || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Passport */}
                <div className="pt-2 border-t border-slate-200">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1">2. Passport Information</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Passport No:</span>
                      <span className="font-mono font-medium">{passportInfo.passportNumber || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Expiry:</span>
                      <span>{passportInfo.expiryDate || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">2x2 Photo:</span>
                      <span className={passportInfo.passportPhotoUrl ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                        {passportInfo.passportPhotoUrl ? 'Attached ✓' : 'Not attached'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Bio-Data Scan:</span>
                      <span className={passportInfo.passportPageUrl ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                        {passportInfo.passportPageUrl ? 'Attached ✓' : 'Not attached'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Travel & Work */}
                <div className="pt-2 border-t border-slate-200">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1">3. Travel & Employment</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Purpose:</span>
                      <span>{travelInfo.purposeOfTravel || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Intended Date:</span>
                      <span>{travelInfo.intendedTravelDate || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Destination:</span>
                      <span>{travelInfo.proposedDestination || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Employer:</span>
                      <span>{additionalInfo.currentEmployer || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Monthly Income:</span>
                      <span>{additionalInfo.monthlyIncome || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Prior U.S. Denial:</span>
                      <span>{additionalInfo.hasUsVisaDenial ? 'Disclosed Yes' : 'None reported'}</span>
                    </div>
                  </div>
                </div>

                {/* Uploaded files count */}
                <div className="pt-2 border-t border-slate-200">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1">
                    4. Uploaded Documentation ({documents.length} Files Attached)
                  </h4>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {documents.map((d) => (
                      <span key={d.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px] text-slate-700">
                        <FileCheck className="w-3 h-3 text-emerald-600" />
                        {d.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Declaration Checkbox */}
              <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-xl space-y-2">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="declaration"
                    checked={declarationAgreed}
                    onChange={(e) => setDeclarationAgreed(e.target.checked)}
                    className="mt-0.5 rounded border-amber-400 text-slate-900 focus:ring-slate-900"
                  />
                  <label htmlFor="declaration" className="text-xs text-slate-800 leading-relaxed">
                    <strong>Applicant Attestation & Terms:</strong> I solemnly attest that all information entered in this dossier is complete, accurate, and truthful. I agree to the service terms and acknowledge that my case will advance to the bank transfer payment stage upon submission.
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Step</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setCurrentStep(currentStep + 1);
                }}
                className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitApplication}
                disabled={submitting || !declarationAgreed}
                className="px-6 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                    <span>Submitting Dossier...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Application & Proceed to Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
