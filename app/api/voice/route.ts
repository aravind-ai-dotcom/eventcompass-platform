import textToSpeech from "@google-cloud/text-to-speech";

function getTtsClient() {
  const encoded = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64;

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

  return new textToSpeech.TextToSpeechClient();
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return Response.json({ error: "Missing text" }, { status: 400 });
    }

    const client = getTtsClient();

    const [response] = await client.synthesizeSpeech({
      input: { text: text.slice(0, 900) },
      voice: {
        languageCode: process.env.GOOGLE_TTS_LANGUAGE_CODE || "en-US",
        name: process.env.GOOGLE_TTS_VOICE_NAME || "en-US-Neural2-F",
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
    return Response.json(
      { error: error instanceof Error ? error.message : "Google TTS failed" },
      { status: 502 }
    );
  }
}