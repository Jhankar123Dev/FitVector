// ─── Verified Profile ──────────────────────────────────────────────────────

export interface VerifiedProfile {
  id: string;
  userId: string;
  identityVerified: boolean;
  identityDocumentRef: string | null;
  educationVerified: boolean;
  educationDocumentRef: string | null;
  employmentVerified: boolean;
  employmentDocumentRef: string | null;
  skillsVerified: boolean;
  skillsAssessmentId: string | null;
  verifiedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}
