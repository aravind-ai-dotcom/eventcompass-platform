// =============================================================================
// Compass SKO — top-level Firestore collection names (sko_* namespace)
// Isolated from TechXchange users/content collections.
// =============================================================================

export const SKO_COLLECTIONS = {
  editions: "sko_editions",
  geos: "sko_geos",
  markets: "sko_markets",
  sellerPersonas: "sko_sellerPersonas",
  users: "sko_users",
  speakers: "sko_speakers",
  contentItems: "sko_contentItems",
  contentAssets: "sko_contentAssets",
  contentClips: "sko_contentClips",
  ingestJobs: "sko_ingestJobs",
  pulseMetrics: "sko_pulseMetrics",
  pulseQuotes: "sko_pulseQuotes",
  briefs: "sko_briefs",
  briefItems: "sko_briefItems",
  podcasts: "sko_podcasts",
  seatReservations: "sko_seatReservations",
} as const;

export type SkoCollectionName = (typeof SKO_COLLECTIONS)[keyof typeof SKO_COLLECTIONS];
