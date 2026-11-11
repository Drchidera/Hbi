export type Role = 'applicant' | 'admin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  countryOfResidence: string;
  role: Role;
  emailVerified: boolean;
  isRootAdmin?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type VisaCategory = 'B1_B2' | 'F1' | 'J1' | 'H1B' | 'OTHER';

export const VISA_CATEGORY_LABELS: Record<VisaCategory, string> = {
  B1_B2: 'B1/B2 Tourist & Business Visa',
  F1: 'F1 Academic Student Visa',
  J1: 'J1 Exchange Visitor Visa',
  H1B: 'H1B Specialty Occupation Work Visa',
  OTHER: 'Other Non-Immigrant Visa Category',
};

export type ApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Awaiting Payment'
  | 'Payment Under Review'
  | 'Payment Confirmed'
  | 'Processing'
  | 'Additional Documents Required'
  | 'Under Administrative Review'
  | 'Approved by Service Administrator'
  | 'Rejected by Service Administrator'
  | 'Completed'
  | 'Cancelled';

export const ALL_APPLICATION_STATUSES: ApplicationStatus[] = [
  'Draft',
  'Submitted',
  'Awaiting Payment',
  'Payment Under Review',
  'Payment Confirmed',
  'Processing',
  'Additional Documents Required',
  'Under Administrative Review',
  'Approved by Service Administrator',
  'Rejected by Service Administrator',
  'Completed',
  'Cancelled',
];

export interface StatusHistoryItem {
  id: string;
  status: ApplicationStatus;
  changedAt: string;
  changedBy: string;
  note?: string;
}

export interface ApplicationDocument {
  id: string;
  type:
    | 'passport_photo'
    | 'passport_page'
    | 'bank_statement'
    | 'invitation_letter'
    | 'employment_letter'
    | 'education_certificate'
    | 'supporting_doc'
    | 'payment_receipt'
    | 'other';
  name: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  status: 'uploaded' | 'verified' | 'rejected' | 'replacement_requested';
  adminFeedback?: string;
}

export interface VisaApplication {
  id: string;
  referenceNumber: string;
  userId: string;
  applicantName: string;
  applicantEmail: string;
  visaCategory: VisaCategory;
  status: ApplicationStatus;
  statusHistory: StatusHistoryItem[];
  feeAmount: number;
  paymentStatus: 'unpaid' | 'under_review' | 'confirmed' | 'rejected';
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;

  // 1. Personal Information
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    nationality: string;
    countryOfResidence: string;
    residentialAddress: string;
    phone: string;
    email: string;
    maritalStatus: string;
  };

  // 2. Passport Information
  passportInfo: {
    passportNumber: string;
    issuingCountry: string;
    issueDate: string;
    expiryDate: string;
    passportPhotoUrl?: string;
    passportPhotoName?: string;
    passportPageUrl?: string;
    passportPageName?: string;
  };

  // 3. Travel Information
  travelInfo: {
    purposeOfTravel: string;
    intendedTravelDate: string;
    intendedDurationOfStay: string;
    proposedDestination: string;
    accommodationInfo: string;
    travelFundingInfo: string;
  };

  // 4. Additional Information
  additionalInfo: {
    employmentStatus: string;
    currentEmployer?: string;
    jobTitle?: string;
    monthlyIncome?: string;
    educationalBackground?: string;
    previousInternationalTravel?: string;
    previousUsVisaHistory?: string;
    hasUsVisaDenial?: boolean;
    usVisaDenialDetails?: string;
    additionalNotes?: string;
  };

  // 5. Uploaded Documents
  documents: ApplicationDocument[];
  requestedDocumentsNote?: string;
  adminNotes?: string[];
  rejectionReason?: string;
}

export interface PaymentMethod {
  id: string;
  label: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  swiftOrRouting?: string;
  instructions: string;
  isActive: boolean;
  visaFees: Record<VisaCategory, number>;
}

export type PaymentStatus = 'pending_review' | 'confirmed' | 'rejected' | 'receipt_re-requested';

export interface PaymentSubmission {
  id: string;
  referenceNumber: string;
  applicationId: string;
  applicationRef: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  visaCategory: VisaCategory;
  amount: number;
  currency: string;
  paymentMethodId: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  transactionReference: string;
  paymentDate: string;
  receiptFileUrl: string;
  receiptFileName: string;
  status: PaymentStatus;
  adminNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  submittedAt: string;
}

export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: Role;
  senderName: string;
  text: string;
  attachments?: MessageAttachment[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicationId?: string;
  applicationRef?: string;
  status: 'open' | 'resolved';
  unreadByAdmin: number;
  unreadByApplicant: number;
  lastMessageAt: string;
  lastMessageText: string;
  messages: ChatMessage[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type:
    | 'application_submitted'
    | 'payment_submitted'
    | 'payment_confirmed'
    | 'payment_rejected'
    | 'status_changed'
    | 'document_requested'
    | 'chat_reply'
    | 'system';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: 'application' | 'payment' | 'user' | 'setting' | 'document' | 'auth';
  targetId: string;
  details: string;
}

export interface SystemSettings {
  websiteName: string;
  supportEmail: string;
  supportPhone: string;
  officeAddress: string;
  disclaimerNotice: string;
  announcementTitle?: string;
  announcementText?: string;
  isAnnouncementActive?: boolean;
  termsAndConditions: string;
  privacyPolicy: string;
}

export interface AuthSession {
  user: User;
  token: string;
}
