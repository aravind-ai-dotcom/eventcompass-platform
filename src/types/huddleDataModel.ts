/**
 * Future Firestore huddle schema (documentation only — not wired yet).
 *
 * Collection: organizations/{org}/events/{eventId}/huddles
 *
 * huddles document fields:
 *   huddle_id       string
 *   title           string
 *   description     string
 *   topics          string[]
 *   host_user_id    string
 *   host_name       string
 *   location        string
 *   start_time      timestamp
 *   end_time        timestamp
 *   attendee_count  number
 *   participants    string[]   // denormalized preview ids
 *   status          "pending" | "active" | "ended"
 *   created_at      timestamp
 *
 * Subcollection / join table: huddle_participants
 *   participant_id  string
 *   huddle_id       string
 *   user_id         string
 *   joined_at       timestamp
 *   status          "heading" | "arrived" | "declined"
 */

export {};
