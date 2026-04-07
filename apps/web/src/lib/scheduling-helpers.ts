/**
 * Transform human_interviews DB row → frontend ScheduledInterview shape.
 * Accepts an optional participants array (from interview_participants join).
 * Falls back to the single interviewer_id on the row when participants are absent.
 */

export interface InterviewParticipant {
  userId: string;
  name: string;
}

export function transformHumanInterview(
  row: Record<string, unknown>,
  applicantInfo?: { name: string; email: string },
  jobTitle?: string,
  participants?: InterviewParticipant[],
) {
  // Use full participant list when available; fall back to lead interviewer on row
  const interviewerIds =
    participants && participants.length > 0
      ? participants.map((p) => p.userId)
      : [row.interviewer_id as string];

  const interviewerNames =
    participants && participants.length > 0
      ? participants.map((p) => p.name)
      : ["Interviewer"];

  return {
    id: row.id as string,
    candidateId: row.applicant_id as string,
    candidateName: applicantInfo?.name || "",
    candidateEmail: applicantInfo?.email || "",
    jobPostId: row.job_post_id as string,
    jobTitle: jobTitle || "",
    interviewerIds,
    interviewerNames,
    type: mapInterviewType(row.interview_type as string),
    status: (row.status as string) || "scheduled",
    scheduledAt: (row.scheduled_at as string) || "",
    duration: (row.duration_minutes as number) || 60,
    meetingLink: (row.meeting_link as string) || null,
    location: null,
    interviewerNotes: (row.notes as string) || "",
    roundNumber: (row.round_number as number) || 1,
    rating: (row.rating as string) || null,
    feedback: row.feedback || null,
    calendarEventId: (row.calendar_event_id as string) || null,
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
