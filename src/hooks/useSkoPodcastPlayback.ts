"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getSkoVoiceOption,
  synthesizeSkoPodcastAudio,
  type SkoVoiceId,
} from "@/lib/skoPodcastVoice";
import type { SkoPodcastLanguage } from "@/types/sko";

interface Options {
  script?: string;
  language: SkoPodcastLanguage;
  voiceId: SkoVoiceId;
  storedAudioUrl?: string;
}

export function useSkoPodcastPlayback({
  script,
  language,
  voiceId,
  storedAudioUrl,
}: Options) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const sampleRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPlay = Boolean(storedAudioUrl || script);

  const cleanupBlob = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    sampleRef.current?.pause();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setPlaying(false);
  }, []);

  useEffect(() => {
    stop();
    cleanupBlob();
    audioRef.current = null;
    setError(null);
  }, [script, language, voiceId, storedAudioUrl, stop, cleanupBlob]);

  useEffect(() => () => {
    stop();
    cleanupBlob();
  }, [stop, cleanupBlob]);

  const resolveAudioUrl = useCallback(async (): Promise<string | null> => {
    if (storedAudioUrl) return storedAudioUrl;
    if (!script) return null;

    if (language !== "en-US") {
      await synthesizeSkoPodcastAudio(script, language, getSkoVoiceOption(voiceId).voiceName);
      setPlaying(true);
      return null;
    }

    const voice = getSkoVoiceOption(voiceId);
    const url = await synthesizeSkoPodcastAudio(script, language, voice.voiceName);
    blobUrlRef.current = url;
    return url;
  }, [storedAudioUrl, script, language, voiceId]);

  const togglePlay = useCallback(async () => {
    if (!canPlay) return;

    if (playing) {
      stop();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = await resolveAudioUrl();
      if (!url) {
        setLoading(false);
        return;
      }

      if (!audioRef.current) {
        audioRef.current = new Audio(url);
        audioRef.current.onended = () => setPlaying(false);
      } else if (audioRef.current.src !== url) {
        audioRef.current.src = url;
      }

      await audioRef.current.play();
      setPlaying(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Playback failed");
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  }, [canPlay, playing, stop, resolveAudioUrl]);

  const restart = useCallback(async () => {
    stop();
    if (!canPlay) return;
    setLoading(true);
    try {
      const url = await resolveAudioUrl();
      if (!url) return;
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setPlaying(false);
      await audioRef.current.play();
      setPlaying(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Playback failed");
    } finally {
      setLoading(false);
    }
  }, [canPlay, stop, resolveAudioUrl]);

  const previewVoice = useCallback(
    (sampleUrl: string) => {
      stop();
      if (!sampleRef.current) sampleRef.current = new Audio();
      sampleRef.current.src = sampleUrl;
      void sampleRef.current.play();
    },
    [stop],
  );

  return {
    playing,
    loading,
    error,
    canPlay,
    togglePlay,
    restart,
    stop,
    previewVoice,
    hasStoredAudio: Boolean(storedAudioUrl),
  };
}
