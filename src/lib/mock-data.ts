import type { AuthUser, PrinterSummary, PrintJobSummary, QuotaSummary } from '@/types';

export const mockStudent: AuthUser = {
  id: 'user-student-1',
  adUsername: 'student1',
  email: 'student1@bracu.ac.bd',
  displayName: 'Ayesha Rahman',
  department: 'CSE',
  role: 'student',
};

export const mockQuota: QuotaSummary = {
  pagesAllocated: 500,
  pagesUsed: 342,
  pagesRemaining: 158,
  creditBalance: 8.5,
  periodType: 'semester',
  periodStart: '2026-01-01',
  periodEnd: '2026-06-30',
  source: 'cache',
  lastSyncedAt: new Date().toISOString(),
};

export const mockPrinters: PrinterSummary[] = [
  {
    id: 'printer-1',
    name: 'UB1 Library Printer',
    location: 'UB1 Library, 4th Floor',
    status: 'online',
    supportsColor: false,
    supportsDuplex: true,
    queueLength: 2,
  },
  {
    id: 'printer-2',
    name: 'UB4 Lab Printer',
    location: 'UB4, Room 512',
    status: 'online',
    supportsColor: true,
    supportsDuplex: true,
    queueLength: 0,
  },
  {
    id: 'printer-3',
    name: 'UB2 Admin Printer',
    location: 'UB2, Ground Floor',
    status: 'offline',
    supportsColor: false,
    supportsDuplex: false,
    queueLength: 0,
  },
];

export const mockPrintJobs: PrintJobSummary[] = [
  {
    id: 'job-1',
    documentName: 'assignment_3_cse220.pdf',
    printerName: 'UB4 Lab Printer',
    copies: 1,
    colorMode: 'bw',
    duplex: true,
    status: 'completed',
    costEstimate: 4.0,
    costActual: 4.0,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 5 + 1000 * 60 * 2).toISOString(),
  },
  {
    id: 'job-2',
    documentName: 'lecture_notes_week7.pdf',
    printerName: 'UB1 Library Printer',
    copies: 2,
    colorMode: 'bw',
    duplex: true,
    status: 'printing',
    costEstimate: 6.0,
    costActual: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
  },
];
