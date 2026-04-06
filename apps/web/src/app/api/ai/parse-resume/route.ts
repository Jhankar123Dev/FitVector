import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";
const PYTHON_SERVICE_SECRET = process.env.PYTHON_SERVICE_SECRET || "";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PDF or DOCX file." },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 },
      );
    }

    // Upload to Supabase Storage
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const fileExt = file.name.split(".").pop();
    const storagePath = `${session.user.id}/original.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      // Non-fatal — continue with parsing even if storage fails
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(storagePath);
    const rawResumeUrl = urlData?.publicUrl || null;

    // Proxy to Python AI service for parsing
    const pythonFormData = new FormData();
    pythonFormData.append("file", new Blob([arrayBuffer], { type: file.type }), file.name);

    const pythonRes = await fetch(`${PYTHON_SERVICE_URL}/ai/parse-resume`, {
      method: "POST",
      headers: {
        "X-Internal-Key": PYTHON_SERVICE_SECRET,
      },
      body: pythonFormData,
    });

    if (!pythonRes.ok) {
      const errText = await pythonRes.text();
      console.error("Python parse error:", errText);
      return NextResponse.json(
        { error: "Failed to parse resume. Please try again." },
        { status: 500 },
      );
    }

    const parseResult = await pythonRes.json();

    // Python returns { parsed_data: { contact, experience, skills, ... } }
    const parsedResume = parseResult.parsed_data ?? parseResult.parsed ?? parseResult;

    // Store parsed data in user_profiles
    await supabase
      .from("user_profiles")
      .upsert(
        {
          user_id: session.user.id,
          parsed_resume_json: parsedResume,
          raw_resume_url: rawResumeUrl,
          raw_resume_filename: file.name,
          resume_parsed_at: new Date().toISOString(),
          skills: parsedResume?.skills || [],
        },
        { onConflict: "user_id" },
      );

    // Insert a "Base Resume" row into tailored_resumes so it immediately
    // appears in the apply modal dropdown. Delete any existing Base Resume
    // first so re-uploads don't create duplicates.
    await supabase
      .from("tailored_resumes")
      .delete()
      .eq("user_id", session.user.id)
      .eq("version_name", "Base Resume");

    await supabase
      .from("tailored_resumes")
      .insert({
        user_id: session.user.id,
        version_name: "Base Resume",
        template_id: "base",
        latex_source: "", // no LaTeX for base resume — PDF download not supported
        job_title: null,
        company_name: null,
      });

    return NextResponse.json({
      data: {
        parsed: parsedResume,
        rawResumeUrl,
      },
    });
  } catch (error) {
    console.error("Parse resume error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
