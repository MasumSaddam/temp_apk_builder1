import type {
  AuthUser,
  ColorMode,
  PickedFile,
  PrinterSummary,
  PrintJobSummary,
  QuotaSummary,
} from '@/types';
import { mockPrinters, mockPrintJobs, mockQuota, mockStudent } from './mock-data';
import { secureStorage } from './storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const REQUEST_TIMEOUT_MS = 6000;

/**
 * Mirrors the web frontend's data-layer pattern: try the real backend first,
 * fall back to demo data on any failure so the app is fully reviewable
 * without a live backend/AD connection. Set EXPO_PUBLIC_API_URL (baked in at
 * build time, same mechanism as Next's NEXT_PUBLIC_*) to point at a real
 * BRAC Print+ backend, e.g. https://print-api.bracu.ac.bd/api/v1.
 */
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!API_BASE_URL) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const token = await secureStorage.getAccessToken();
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function login(
  username: string,
  password: string,
): Promise<{ user: AuthUser } | { error: string }> {
  const result = await apiFetch<{ accessToken: string; refreshToken: string; user: AuthUser }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ username, password }) },
  );

  if (result) {
    await secureStorage.setTokens(result.accessToken, result.refreshToken);
    await secureStorage.setUser(result.user);
    return { user: result.user };
  }

  // Demo fallback so the app is fully reviewable without a live backend.
  if (username === 'student1' || username === 'demo') {
    const user: AuthUser = { ...mockStudent, adUsername: username };
    await secureStorage.setUser(user);
    return { user };
  }

  return { error: 'Invalid username or password.' };
}

export async function logout(): Promise<void> {
  await Promise.all([secureStorage.clearTokens(), secureStorage.clearUser()]);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  return secureStorage.getUser<AuthUser>();
}

export async function getQuota(): Promise<QuotaSummary> {
  return (await apiFetch<QuotaSummary>('/quotas/me')) ?? mockQuota;
}

export async function listPrinters(): Promise<PrinterSummary[]> {
  return (await apiFetch<PrinterSummary[]>('/printers')) ?? mockPrinters;
}

export async function listPrintJobs(): Promise<PrintJobSummary[]> {
  return (await apiFetch<PrintJobSummary[]>('/print-jobs')) ?? mockPrintJobs;
}

export async function getPrintJob(id: string): Promise<PrintJobSummary | null> {
  const remote = await apiFetch<PrintJobSummary>(`/print-jobs/${id}`);
  if (remote) return remote;
  return mockPrintJobs.find((j) => j.id === id) ?? null;
}

export interface UploadedDocument {
  id: string;
  originalFilename: string;
  pageCount: number | null;
  status: string;
}

export async function uploadDocument(file: PickedFile): Promise<UploadedDocument> {
  if (API_BASE_URL) {
    const form = new FormData();
    // React Native's fetch/FormData accepts this { uri, name, type } shape
    // for a file part - it is not a web File/Blob, this is RN-specific.
    form.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType ?? 'application/octet-stream',
    } as unknown as Blob);

    try {
      const token = await secureStorage.getAccessToken();
      const res = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: 'POST',
        body: form,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok) return (await res.json()) as UploadedDocument;
    } catch {
      // fall through to demo behavior below
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    id: `doc-demo-${Date.now()}`,
    originalFilename: file.name,
    pageCount: file.size ? Math.max(1, Math.round(file.size / 45_000)) : 1,
    status: 'ready',
  };
}

export interface SubmitPrintJobInput {
  documentId: string;
  documentName: string;
  printerId: string;
  printerName: string;
  copies: number;
  colorMode: ColorMode;
  duplex: boolean;
  pageRange?: string;
}

export async function submitPrintJob(input: SubmitPrintJobInput): Promise<PrintJobSummary> {
  const result = await apiFetch<PrintJobSummary>('/print-jobs', {
    method: 'POST',
    body: JSON.stringify({
      documentId: input.documentId,
      printerId: input.printerId,
      copies: input.copies,
      colorMode: input.colorMode,
      duplex: input.duplex,
      pageRange: input.pageRange,
    }),
  });
  if (result) return result;

  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    id: `job-demo-${Date.now()}`,
    documentName: input.documentName,
    printerName: input.printerName,
    copies: input.copies,
    colorMode: input.colorMode,
    duplex: input.duplex,
    pageRange: input.pageRange,
    status: 'submitted',
    costEstimate: input.copies * 0.5 * (input.colorMode === 'color' ? 4 : 1),
    costActual: null,
    createdAt: new Date().toISOString(),
  };
}
