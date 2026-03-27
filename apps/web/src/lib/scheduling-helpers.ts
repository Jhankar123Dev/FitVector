/**
 * Transform human_interviews DB row → frontend ScheduledInterview shape.
 * DB has single interviewer_id; frontend expects arrays → wrap as [id], [name].
 */

export function transformHumanInterview(
  row: Record<string, unknown>,
  applicantInfo?: { name: string; email: string },
  jobTitle?: string,
  interviewerName?: string,
) {
  return {
    id: row.id as string,
    candidateId: row.applicant_id as string,
    candidateName: applicantInfo?.name || "",
    candidateEmail: applicantInfo?.email || "",
    jobPostId: row.job_post_id as string,
    jobTitle: jobTitle || "",
    interviewerIds: [row.interviewer_id as string],
    interviewerNames: [interviewerName || "Interviewer"],
    type: mapInterviewType(row.interview_type as string),
    status: (row.status as string) || "scheduled",
    scheduledAt: (row.scheduled_at as string) || "",
    duration: (row.duration_minutes as number) || 60,
    meetingLink: (row.meeting_link as string) || null,
    location: null, // MVP: no physical location tracking
    interviewerNotes: (row.notes as string) || "",
    roundNumber: (row.round_number as number) || 1,
    rating: (row.rating as string) || null,
    feedback: row.feedback || null,
    createdBy: row.interviewer_id as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// Map DB interview_type to frontend ScheduledInterviewType
function mapInterviewType(dbType: string): string {
  const map: Record<string, string> = {
    phone_screen: "phone",
    technical: "video",
    behavioral: "video",
    culture_fit: "video",
    hiring_manager: "video",
    panel: "onsite",
  };
  return map[dbType] || "video";
}
