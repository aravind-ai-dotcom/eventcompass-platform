// =============================================================================
// EventCompass — ElevenLabs TTS API Route
// app/api/voice/route.ts
//
// POST /api/voice
// Body:    { text: string }
// Returns: audio/mpeg binary   (200)
//          { error: string }    (400 | 502 | 503)
//
// Env:
//   ELEVENLABS_API_KEY   — secret, server-only
//   ELEVENLABS_VOICE_ID  — e.g. "21m00Tcm4TlvDq8ikWAM" (Rachel)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { text?: unknown };
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text) {
      return NextResponse.json({ error: "Missing or empty text" }, { status: 400 });
    }

    const apiKey  = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;

    if (!apiKey || !voiceId) {
      return NextResponse.json(
        { error: "ElevenLabs not configured — set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID" },
        { status: 503 }
      );
    }

    const elRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key":   apiKey,
          "Content-Type": "application/json",
          Accept:         "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2",
          voice_settings: {
            stability:        0.45,
            similarity_boost: 0.80,
          },
        }),
      }
    );

    if (!elRes.ok) {
      const errBody = await elRes.text().catch(() => "");
      return NextResponse.json(
        { error: `ElevenLabs ${elRes.status}: ${errBody}` },
        { status: 502 }
      );
    }

    const audioBuffer = await elRes.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type":  "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
