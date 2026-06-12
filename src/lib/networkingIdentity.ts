// Shared networking-intent helpers — read-time migration for deprecated fields.

type AlumniNi = {
  open_to_alumni_connections?: boolean;
  open_to_university_connections?: boolean;
};

/** Alumni intent: current field OR legacy university community field. */
export function isOpenToAlumniConnections(ni: AlumniNi): boolean {
  return !!(ni.open_to_alumni_connections || ni.open_to_university_connections);
}

/** Mentoring intent inferred from career interests (no separate enrollment question). */
export function isOpenToMentoringConversations(raw: Record<string, unknown>): boolean {
  const interests = (raw.career_interests as string[]) ?? [];
  return interests.some(c => /mentoring/i.test(c));
}
