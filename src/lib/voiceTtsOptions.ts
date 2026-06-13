export const ALLOWED_TTS_VOICES = [
  "en-US-Chirp3-HD-Aoede",
  "en-US-Chirp3-HD-Charon",
  "en-US-Neural2-F",
] as const;

export type AllowedTtsVoice = (typeof ALLOWED_TTS_VOICES)[number];

export type VoiceToneId = "guide" | "studio";

export interface VoiceToneOption {
  id: VoiceToneId;
  label: string;
  voiceName: AllowedTtsVoice;
}

export const VOICE_TONE_OPTIONS: VoiceToneOption[] = [
  { id: "guide", label: "Guide", voiceName: "en-US-Chirp3-HD-Aoede" },
  { id: "studio", label: "Studio", voiceName: "en-US-Chirp3-HD-Charon" },
];

export const VOICE_TONE_STORAGE_KEY = "compass_voice_tone";

export const ENV_DEFAULT_VOICE: AllowedTtsVoice = "en-US-Neural2-F";

export function getVoiceNameForTone(toneId: VoiceToneId): AllowedTtsVoice {
  return VOICE_TONE_OPTIONS.find(o => o.id === toneId)?.voiceName ?? VOICE_TONE_OPTIONS[0].voiceName;
}

export function isAllowedTtsVoice(value: string): value is AllowedTtsVoice {
  return (ALLOWED_TTS_VOICES as readonly string[]).includes(value);
}

export function resolveStoredTone(raw: string | null): VoiceToneId {
  if (raw === "guide" || raw === "studio") return raw;
  if (raw === "warm") return "guide";
  if (raw === "clear") return "studio";
  return "guide";
}
