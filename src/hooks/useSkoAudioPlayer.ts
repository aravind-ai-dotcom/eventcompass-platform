"use client";

import { useEffect, useRef, useState } from "react";

interface UseSkoAudioPlayerOptions {
  audioUrl?: string;
  onStop?: () => void;
}

export function useSkoAudioPlayer({ audioUrl, onStop }: UseSkoAudioPlayerOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    stop();
  }, [audioUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  function stop() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlaying(false);
    onStop?.();
  }

  function togglePlay() {
    if (!audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      void audioRef.current.play();
      setPlaying(true);
    }
  }

  function restart() {
    if (!audioRef.current || !audioUrl) return;
    audioRef.current.currentTime = 0;
    void audioRef.current.play();
    setPlaying(true);
  }

  return { playing, togglePlay, restart, stop, hasAudio: Boolean(audioUrl) };
}

/** Stop SKO audio when navigating away */
export function useStopAudioOnRouteChange(stop: () => void) {
  useEffect(() => {
    return () => stop();
  }, [stop]);
}
