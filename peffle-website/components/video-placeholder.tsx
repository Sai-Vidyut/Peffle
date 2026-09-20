"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

const SRC = "/how_it_works.mp4";

export function VideoPlaceholder() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { threshold: 0.45, rootMargin: "0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      video.pause();
      return;
    }

    if (inView) {
      video.play().catch(() => {
        /* Autoplay can fail if the browser blocks it; stay muted and idle. */
      });
    } else {
      video.pause();
    }
  }, [inView]);

  function toggleMute() {
    const video = videoRef.current;
    const next = !muted;
    setMuted(next);
    if (video) {
      video.muted = next;
      if (!next && inView) {
        video.play().catch(() => {});
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative my-5 overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--panel)]"
    >
      <video
        ref={videoRef}
        className="aspect-video w-full bg-[var(--panel-2)] object-cover"
        src={SRC}
        muted={muted}
        playsInline
        loop
        preload="metadata"
        aria-label="How to install and use Peffle"
      />

      <button
        type="button"
        onClick={toggleMute}
        aria-pressed={!muted}
        aria-label={muted ? "Unmute video" : "Mute video"}
        className={cn(
          "absolute right-3 bottom-3 z-10 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-panel)]/95 px-3.5 py-2 text-[12px] text-[var(--text)] backdrop-blur-sm transition-colors hover:bg-[var(--surface-border-btn)]"
        )}
      >
        {muted ? (
          <>
            <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
            Unmute
          </>
        ) : (
          <>
            <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
            Mute
          </>
        )}
      </button>
    </div>
  );
}
