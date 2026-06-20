import textToSpeech from "@google-cloud/text-to-speech";
import { readFileSync } from "node:fs";
import {
  ENV_DEFAULT_VOICE,
  isAllowedTtsVoice,
} from "@/lib/voiceTtsOptions";

function getTtsClient() {
  const encoded = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64;
  const inlineJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const filePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (encoded) {
    const json = Buffer.from(encoded, "base64").toString("utf8");
    const credentials = JSON.parse(json);

    return new textToSpeech.TextToSpeechClient({
      projectId: credentials.project_id,
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
    });
  }

  if (inlineJson) {
    const credentials = JSON.parse(inlineJson);
    return new textToSpeech.TextToSpeechClient({
      projectId: credentials.project_id,
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
    });
  }

  if (filePath) {
    const credentials = JSON.parse(readFileSync(filePath, "utf8"));
    return new textToSpeech.TextToSpeechClient({
      projectId: credentials.project_id,
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
    });
  }

  return new textToSpeech.TextToSpeechClient();
}

function resolveLanguageCode(voiceName: string): string {
  if (voiceName.startsWith("en-US-")) return "en-US";

  const envLang = process.env.GOOGLE_TTS_LANGUAGE_CODE?.trim();
  if (envLang && !envLang.startsWith("en-US-")) return envLang;

  return "en-US";
}

function resolveVoiceName(requested?: unknown): string {
  if (typeof requested === "string" && isAllowedTtsVoice(requested)) {
    return requested;
  }

  const envVoice = process.env.GOOGLE_TTS_VOICE_NAME?.trim();
  if (envVoice && isAllowedTtsVoice(envVoice)) {
    return envVoice;
  }

  return ENV_DEFAULT_VOICE;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body?.text;
    const voiceName = resolveVoiceName(body?.voiceName);
    const languageCode = resolveLanguageCode(voiceName);

    console.log("[VOICE] Voice selected:", voiceName);
    console.log("[VOICE] Language code:", languageCode);

    if (!text || typeof text !== "string") {
      return Response.json({ error: "Missing text" }, { status: 400 });
    }

    const client = getTtsClient();

    const [response] = await client.synthesizeSpeech({
      input: { text: text.slice(0, 900) },
      voice: {
        languageCode,
        name: voiceName,
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 0.96,
        pitch: 0,
      },
    });

    if (!response.audioContent) {
      return Response.json({ error: "No audio returned" }, { status: 502 });
    }

    const audioBuffer =
      typeof response.audioContent === "string"
        ? Buffer.from(response.audioContent, "base64")
        : Buffer.from(response.audioContent);

    const arrayBuffer = audioBuffer.buffer.slice(
      audioBuffer.byteOffset,
      audioBuffer.byteOffset + audioBuffer.byteLength
    ) as ArrayBuffer;

    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[Google TTS]", error);
    const message = error instanceof Error ? error.message : "Google TTS failed";
    if (/default credentials|Could not load the default credentials/i.test(message)) {
      return Response.json(
        { error: "Google TTS credentials are not configured for this environment." },
        { status: 503 }
      );
    }
    return Response.json(
      { error: message },
      { status: 502 }
    );
  }
}
