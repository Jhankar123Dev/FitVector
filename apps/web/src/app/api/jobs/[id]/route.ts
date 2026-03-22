import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // In production, this would fetch from Supabase jobs table.
    // For now, return a placeholder that the frontend can work with.
    // The actual job data flows from search results stored client-side.

    return Response.json({
      data: {
        id,
        title: "Job details loaded from cache",
        companyName: "",
        companyLogoUrl: null,
        companyUrl: null,
        companySize: null,
        companyIndustry: null,
        companyRating: null,
        location: "",
        workMode: null,
        jobType: null,
        description: "",
        skillsRequired: [],
        skillsNiceToHave: [],
        experienceMin: null,
        experienceMax: null,
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null,
        postedAt: null,
        sources: [],
        url: "",
        applyUrl: null,
        matchScore: null,
        matchBucket: null,
        skillMatch: null,
        hasGapAnalysis: false,
        isSaved: false,
        isEasyApply: false,
        applicationStatus: null,
      },
    });
  } catch (error) {
    console.error("Job detail error:", error);
    return Response.json({ error: "Failed to load job details" }, { status: 500 });
  }
}
