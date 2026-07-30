export type RoleName = 'student' | 'staff' | 'lab_admin' | 'super_admin';

export type DocumentStatus = 'uploaded' | 'scanning' | 'ready' | 'rejected' | 'expired' | 'deleted';

export type JobStatus =
  | 'pending'
  | 'submitted'
  | 'queued'
  | 'printing'
  | 'released'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type PrinterStatus = 'online' | 'offline' | 'error' | 'maintenance';

export type ColorMode = 'bw' | 'color';

export interface AuthUser {
  id: string;
  adUsername: string;
  email: string;
  displayName: string;
  department?: string | null;
  role: RoleName;
}

export interface QuotaSummary {
  pagesAllocated: number;
  pagesUsed: number;
  pagesRemaining: number;
  creditBalance: number;
  periodType: 'monthly' | 'semester' | 'unlimited';
  periodStart: string;
  periodEnd: string;
  source: 'myq' | 'cache';
  lastSyncedAt: string;
}

export interface PrinterSummary {
  id: string;
  name: string;
  location: string;
  status: PrinterStatus;
  supportsColor: boolean;
  supportsDuplex: boolean;
  queueLength: number;
}

export interface DocumentSummary {
  id: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  pageCount: number | null;
  status: DocumentStatus;
  uploadedAt: string;
  expiresAt: string;
}

export interface PrintJobSummary {
  id: string;
  documentName: string;
  printerName: string;
  copies: number;
  colorMode: ColorMode;
  duplex: boolean;
  pageRange?: string | null;
  status: JobStatus;
  costEstimate: number | null;
  costActual: number | null;
  errorMessage?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

/** Shape returned by expo-document-picker for a selected file. */
export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string | null;
  size: number | null;
}
