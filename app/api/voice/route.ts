
import textToSpeech from "@google-cloud/text-to-speech";

import { NextResponse } from "next/server";

export async function POST(req: Request) {

  try {

    const { text } = await req.json();

    if (!text || typeof text !== "string") {

      return NextResponse.json({ error: "Missing text" }, { status: 400 });

    }

    const client = new textToSpeech.TextToSpeechClient();

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

      return NextResponse.json({ error: "No audio returned" }, { status: 502 });

    }

    const audioBuffer =

      typeof response.audioContent === "string"

        ? Buffer.from(response.audioContent, "base64")

        : Buffer.from(response.audioContent);

    const body = new Uint8Array(audioBuffer);

    return new Response(body.buffer as ArrayBuffer, {

      headers: {

        "Content-Type": "audio/mpeg",

        "Cache-Control": "no-store",

      },

    });

  } catch (error) {

    console.error("[Google TTS]", error);

    return NextResponse.json(

      { error: error instanceof Error ? error.message : "Google TTS failed" },

      { status: 502 }

    );

  }

}

