import type { AllowedTtsVoice } from "@/lib/voiceTtsOptions";
import type { SkoPodcastLanguage } from "@/types/sko";

export type SkoVoiceId = "warm" | "executive" | "field";

export interface SkoVoiceOption {
  id: SkoVoiceId;
  label: string;
  voiceName: AllowedTtsVoice;
  sampleUrl: string;
}

export const SKO_VOICE_OPTIONS: SkoVoiceOption[] = [
  {
    id: "warm",
    label: "Warm narrator",
    voiceName: "en-US-Chirp3-HD-Aoede",
    sampleUrl: "/audio/sko/warm.mp3",
  },
  {
    id: "executive",
    label: "Executive brief",
    voiceName: "en-US-Chirp3-HD-Charon",
    sampleUrl: "/audio/sko/clear.mp3",
  },
  {
    id: "field",
    label: "Field seller",
    voiceName: "en-US-Neural2-F",
    sampleUrl: "/audio/sko/field.mp3",
  },
];

export function getSkoVoiceOption(id: SkoVoiceId): SkoVoiceOption {
  return SKO_VOICE_OPTIONS.find(v => v.id === id) ?? SKO_VOICE_OPTIONS[0];
}

/** Synthesize podcast audio — Google TTS for English, speech synthesis for Chinese. */
export async function synthesizeSkoPodcastAudio(
  text: string,
  language: SkoPodcastLanguage,
  voiceName: AllowedTtsVoice,
): Promise<string> {
  if (language === "en-US") {
    const res = await fetch("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.slice(0, 900), voiceName }),
    });
    if (!res.ok) {
      throw new Error(`TTS failed (${res.status})`);
    }
    const blob = await res.blob();
    if (!blob.size) throw new Error("Empty audio response");
    return URL.createObjectURL(blob);
  }

  return synthesizeWithSpeechSynthesis(text, language);
}

function synthesizeWithSpeechSynthesis(
  text: string,
  language: SkoPodcastLanguage,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      reject(new Error("Speech synthesis unavailable"));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text.slice(0, 900));
    utterance.lang = language === "zh-TW" ? "zh-TW" : "zh-CN";
    utterance.rate = 0.95;

    utterance.onend = () => resolve("speech-synthesis://played");
    utterance.onerror = () => reject(new Error("Speech synthesis failed"));

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}
