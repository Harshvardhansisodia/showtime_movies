"use client";

import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

type Quality = { index: number; height?: number; name: string };
type AudioTrack = { index: number; name: string };

export default function HLSPlayer({
  videoUrl,
  title,
}: {
  videoUrl: string;
  title?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [currentAudioTrack, setCurrentAudioTrack] = useState<number>(-1);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);
  const [showAudioMenu, setShowAudioMenu] = useState<boolean>(false);
  const [seekIndicator, setSeekIndicator] = useState<null | "forward" | "backward">(null);

  const lastTapRef = useRef<{ time: number; side: "left" | "right" | null }>({ time: 0, side: null });
  const controlsTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      hlsRef.current = hls;

      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data: any) => {
        const levels = Array.isArray(data?.levels)
          ? data.levels.map((level: any, index: number) => ({
              index,
              height: level.height,
              name: level.height ? `${level.height}p` : `Level ${index}`,
            }))
          : [];
        setQualities([{ index: -1, name: "Auto" }, ...levels]);
        setCurrentQuality(-1);
      });

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_event, data: any) => {
        const tracks = Array.isArray(data?.audioTracks)
          ? data.audioTracks.map((track: any, index: number) => ({
              index,
              name: track.name || track.lang || `Audio ${index + 1}`,
            }))
          : [];
        setAudioTracks(tracks);
      });

      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_event, data: any) => {
        if (typeof data?.id === "number") setCurrentAudioTrack(data.id);
      });

      hls.on(Hls.Events.ERROR, (_event, data: any) => {
        if (data?.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              hlsRef.current = null;
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoUrl;
    }

    const handleTimeUpdate = () => setCurrentTime(video.currentTime || 0);
    const handleDurationChange = () => setDuration(video.duration || 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume ?? 1);
      setIsMuted(video.muted ?? false);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("volumechange", handleVolumeChange);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("volumechange", handleVolumeChange);
    };
  }, [videoUrl]);

  useEffect(() => {
    if (showControls && isPlaying) {
      const id = window.setTimeout(() => {
        setShowControls(false);
      }, 3000);
      controlsTimeoutRef.current = id;
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
    };
  }, [showControls, isPlaying]);

  const handleDoubleTap = (e: React.MouseEvent, side: "left" | "right") => {
    const now = Date.now();
    const video = videoRef.current;
    if (!video) return;

    if (now - lastTapRef.current.time < 300 && lastTapRef.current.side === side) {
      e.preventDefault();
      if (side === "left") {
        video.currentTime = Math.max(0, video.currentTime - 10);
        setSeekIndicator("backward");
      } else {
        video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
        setSeekIndicator("forward");
      }
      window.setTimeout(() => setSeekIndicator(null), 700);
      lastTapRef.current = { time: 0, side: null };
    } else {
      lastTapRef.current = { time: now, side };
    }
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = percent * (video.duration || 0);
  };

  const changeQuality = (index: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index;
      setCurrentQuality(index);
      setShowQualityMenu(false);
    }
  };

  const changeAudioTrack = (index: number) => {
    if (hlsRef.current) {
      hlsRef.current.audioTrack = index;
      setCurrentAudioTrack(index);
      setShowAudioMenu(false);
    }
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      await container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number | null | undefined) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black overflow-hidden rounded-2xl shadow-lg group"
      onMouseMove={() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      }}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video ref={videoRef} className="w-full h-full object-contain" />

      {/* Tap Areas */}
      <div className="absolute inset-0 flex pointer-events-none">
        <div className="w-1/3 h-full pointer-events-auto" onClick={(e) => handleDoubleTap(e, "left")} />
        <div className="w-1/3 h-full pointer-events-auto flex items-center justify-center" onClick={togglePlayPause}>
          {!isPlaying && (
            <div className="bg-black/60 rounded-full p-6 backdrop-blur-sm transition-all">
              <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
        </div>
        <div className="w-1/3 h-full pointer-events-auto" onClick={(e) => handleDoubleTap(e, "right")} />
      </div>

      {/* Seek Indicator */}
      {seekIndicator && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/70 rounded-full p-6 animate-fade text-white flex flex-col items-center backdrop-blur-sm">
            <svg className="w-10 h-10 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {seekIndicator === "forward" ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              )}
            </svg>
            <p className="font-semibold">{seekIndicator === "forward" ? "+10s" : "-10s"}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 md:bottom-12 left-0 right-0 transition-all duration-300 ${
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        } bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 backdrop-blur-md`}
      >
        {/* Progress Bar */}
        <div className="relative w-full h-1.5 bg-white/30 rounded-full mb-3 cursor-pointer" onClick={handleSeek}>
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between text-white text-sm">
          <div className="flex items-center gap-4">
            <button onClick={togglePlayPause} className="hover:scale-110 transition-transform">
              {isPlaying ? (
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                </svg>
              ) : (
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <span className="text-xs font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio */}
            {audioTracks.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowAudioMenu(!showAudioMenu)}
                  className="px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 text-xs"
                >
                  Audio
                </button>
                {showAudioMenu && (
                  <div className="absolute bottom-full mb-2 right-0 bg-black/90 text-xs rounded-lg overflow-hidden shadow-lg backdrop-blur-md">
                    {audioTracks.map((track) => (
                      <button
                        key={track.index}
                        onClick={() => changeAudioTrack(track.index)}
                        className={`block w-full px-4 py-2 hover:bg-white/20 text-left ${
                          currentAudioTrack === track.index ? "bg-blue-600" : ""
                        }`}
                      >
                        {track.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quality */}
            {qualities.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 text-xs"
                >
                  {qualities.find((q) => q.index === currentQuality)?.name || "Quality"}
                </button>
                {showQualityMenu && (
                  <div className="absolute bottom-full mb-2 right-0 bg-black/90 text-xs rounded-lg overflow-hidden shadow-lg backdrop-blur-md">
                    {qualities.map((q) => (
                      <button
                        key={q.index}
                        onClick={() => changeQuality(q.index)}
                        className={`block w-full px-4 py-2 hover:bg-white/20 text-left ${
                          currentQuality === q.index ? "bg-blue-600" : ""
                        }`}
                      >
                        {q.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button onClick={toggleFullscreen} className="hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5zm12 7h-3v2h5v-5h-2zm-3-9V5h5v5h-2V7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
