/**
 * support/mocks/storage.ts
 *
 * Mock responses for Supabase Storage / S3 presigned-URL flows.
 *
 * Used by:
 *   - Resume upload (raw + tailored PDF)
 *   - Company logo upload
 *   - Verification document upload
 *   - Banner upload (employer branding)
 *
 * The fake URLs point to a deterministic test-only host so any leaked URL
 * is obviously identifiable.
 */

const TEST_STORAGE_HOST = "https://e2e-storage.fitvector.dev";

export const MOCK_RESUME_UPLOAD_RESPONSE = {
  data: {
    path: "raw-resumes/test_playwright_user/resume.pdf",
    url: `${TEST_STORAGE_HOST}/raw-resumes/test_playwright_user/resume.pdf`,
    filename: "resume.pdf",
    sizeBytes: 1024,
    mimeType: "application/pdf",
  },
} as const;

export const MOCK_TAILORED_PDF_RESPONSE = {
  data: {
    path: "tailored-resumes/test_playwright_user/tailored.pdf",
    url: `${TEST_STORAGE_HOST}/tailored-resumes/test_playwright_user/tailored.pdf`,
    filename: "tailored.pdf",
    sizeBytes: 2048,
    mimeType: "application/pdf",
  },
} as const;

export const MOCK_COMPANY_LOGO_RESPONSE = {
  data: {
    path: "company-logos/test_playwright_co/logo.png",
    url: `${TEST_STORAGE_HOST}/company-logos/test_playwright_co/logo.png`,
    filename: "logo.png",
    sizeBytes: 512,
    mimeType: "image/png",
  },
} as const;

export const MOCK_BANNER_UPLOAD_RESPONSE = {
  data: {
    path: "company-banners/test_playwright_co/banner.jpg",
    url: `${TEST_STORAGE_HOST}/company-banners/test_playwright_co/banner.jpg`,
    filename: "banner.jpg",
    sizeBytes: 4096,
    mimeType: "image/jpeg",
  },
} as const;

export const MOCK_VERIFICATION_DOCUMENT_RESPONSE = {
  data: {
    path: "verification/test_playwright_user/identity.pdf",
    url: `${TEST_STORAGE_HOST}/verification/test_playwright_user/identity.pdf`,
    filename: "identity.pdf",
    sizeBytes: 1024,
    mimeType: "application/pdf",
  },
} as const;

// ─── Common error responses ───────────────────────────────────────────────────

export const MOCK_STORAGE_FILE_TOO_LARGE_ERROR = {
  error: "File exceeds maximum size of 5MB",
} as const;

export const MOCK_STORAGE_INVALID_TYPE_ERROR = {
  error: "Invalid file type. Expected: application/pdf",
} as const;

// ─── Tiny in-memory image buffers (for upload tests) ──────────────────────────
// Single-pixel valid PNG / JPEG headers so client-side validators pass.

export const MINIMAL_PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x62, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

export const MINIMAL_JPEG_BUFFER = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
]);
