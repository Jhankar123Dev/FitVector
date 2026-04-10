import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VerificationCategory, VerificationItem } from "@/types/marketplace";

const ALLOWED_CATEGORIES: VerificationCategory[] = [
  "identity",
  "education",
  "employment",
  "skills",
];

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const CATEGORY_META: Record<
  VerificationCategory,
  { label: string; description: string }
> = {
  identity: {
    label: "Identity Verification",
    description: "Verify your identity with Aadhaar or PAN card",
  },
  education: {
    label: "Education Verification",
    description: "Upload your degree certificate for validation",
  },
  employment: {
    label: "Employment Verification",
    description: "Verify current or last employment with offer letter",
  },
  skills: {
    label: "Skills Verification",
    description: "Pass a FitVector AI assessment to verify your technical skills",
  },
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // ── Parse multipart form data ───────────────────────────────────────────
    const formData = await req.formData();
    const category = formData.get("category") as string | null;
    const file = formData.get("file") as File | null;

    if (!category || !ALLOWED_CATEGORIES.includes(category as VerificationCategory)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, JPG, PNG" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5 MB" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // ── Upload to Supabase Storage ──────────────────────────────────────────
    const ext = file.name.split(".").pop() ?? "bin";
    const timestamp = Date.now();
    const storagePath = `${userId}/${category}/${timestamp}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: storageError } = await supabase.storage
      .from("verification-docs")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (storageError) {
      console.error("Verification storage upload error:", storageError);
      return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
    }

    // ── Upsert the verification row ─────────────────────────────────────────
    const now = new Date().toISOString();

    const { data: row, error: dbError } = await supabase
      .from("profile_verifications")
      .upsert(
        {
          user_id: userId,
          category,
          status: "pending",
          document_url: storagePath,
          document_name: file.name,
          submitted_at: now,
          updated_at: now,
        },
        { onConflict: "user_id,category" },
      )
      .select("id, category, status, document_name, verified_at, expires_at")
      .single();

    if (dbError || !row) {
      console.error("Verification DB upsert error:", dbError);
      return NextResponse.json({ error: "Failed to save verification record" }, { status: 500 });
    }

    const r = row as unknown as {
      id: string;
      category: VerificationCategory;
      status: string;
      document_name: string | null;
      verified_at: string | null;
      expires_at: string | null;
    };

    const meta = CATEGORY_META[r.category];

    const item: VerificationItem = {
      id: r.id,
      category: r.category,
      label: meta.label,
      description: meta.description,
      status: r.status as VerificationItem["status"],
      documentName: r.document_name ?? undefined,
      verifiedAt: r.verified_at ?? undefined,
      expiresAt: r.expires_at ?? undefined,
    };

    return NextResponse.json({ data: item });
  } catch (err) {
    console.error("Verification upload error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
