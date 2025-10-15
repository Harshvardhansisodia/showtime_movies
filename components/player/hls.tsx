"use client";

import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

type Quality = { index: number; height?: number; name: string };
type AudioTrack = { index: number; name: string };
type Subtitle = { index: number; name: string; lang: string };

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
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<number>(-1);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);
  const [showAudioMenu, setShowAudioMenu] = useState<boolean>(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState<boolean>(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);
  const [seekIndicator, setSeekIndicator] = useState<null | "forward" | "backward">(null);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);

  const lastTapRef = useRef<{ time: number; side: "left" | "right" | null }>({ time: 0, side: null });
  const controlsTimeoutRef = useRef<number | null>(null);
  const volumeSliderRef = useRef<HTMLDivElement | null>(null);

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
      const storedToken = localStorage.getItem("hlstoken");
      if (storedToken) {
        if (videoUrl.includes("supabase")) {
          videoUrl = videoUrl;
        } else {
          const urlWithoutToken = videoUrl.split("?in=")[0];
          videoUrl = `${urlWithoutToken}?in=${storedToken}`;
        }
      }
      console.log("videoUrl", videoUrl);
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

      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_event, data: any) => {
        const tracks = Array.isArray(data?.subtitleTracks)
          ? data.subtitleTracks.map((track: any, index: number) => ({
              index,
              name: track.name || track.lang || `Subtitle ${index + 1}`,
              lang: track.lang || "",
            }))
          : [];
        setSubtitles([{ index: -1, name: "Off", lang: "" }, ...tracks]);
      });

      hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, (_event, data: any) => {
        if (typeof data?.id === "number") setCurrentSubtitle(data.id);
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
      
      // Handle native text tracks for Safari
      video.addEventListener("loadedmetadata", () => {
        const tracks = Array.from(video.textTracks).map((track, index) => ({
          index,
          name: track.label || track.language || `Subtitle ${index + 1}`,
          lang: track.language || "",
        }));
        if (tracks.length > 0) {
          setSubtitles([{ index: -1, name: "Off", lang: "" }, ...tracks]);
        }
      });
    }

    const handleTimeUpdate = () => setCurrentTime(video.currentTime || 0);
    const handleDurationChange = () => setDuration(video.duration || 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume ?? 1);
      setIsMuted(video.muted ?? false);
    };
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("volumechange", handleVolumeChange);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);

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
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleCanPlay);
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

  const handleDoubleTap = (side: "left" | "right") => {
    const now = Date.now();
    const video = videoRef.current;
    if (!video) return;

    if (now - lastTapRef.current.time < 300 && lastTapRef.current.side === side) {
      if (side === "left") {
        video.currentTime = Math.max(0, video.currentTime - 5);
        setSeekIndicator("backward");
      } else {
        video.currentTime = Math.min(video.duration || 0, video.currentTime + 5);
        setSeekIndicator("forward");
      }
      window.setTimeout(() => setSeekIndicator(null), 700);
      lastTapRef.current = { time: 0, side: null };
    } else {
      lastTapRef.current = { time: now, side };
    }
  };

  const handleTapAreaClick = (e: React.MouseEvent | React.TouchEvent, side: "left" | "right" | "center") => {
    e.preventDefault();
    e.stopPropagation();
    
    if (side === "center") {
      togglePlayPause();
    } else {
      handleDoubleTap(side);
    }
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
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

  const changeSubtitle = (index: number) => {
    const video = videoRef.current;
    if (hlsRef.current) {
      hlsRef.current.subtitleTrack = index;
      setCurrentSubtitle(index);
      setShowSubtitleMenu(false);
    } else if (video && video.textTracks) {
      // For native HLS (Safari)
      Array.from(video.textTracks).forEach((track, i) => {
        track.mode = i === index ? "showing" : "hidden";
      });
      setCurrentSubtitle(index);
      setShowSubtitleMenu(false);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = newVolume;
    setVolume(newVolume);
    if (newVolume === 0) {
      video.muted = true;
    } else if (video.muted) {
      video.muted = false;
    }
  };

  const handleVolumeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    handleVolumeChange(newVolume);
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
      onTouchStart={() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      }}
      onMouseLeave={() => {
        isPlaying && setShowControls(false);
        setShowVolumeSlider(false);
      }}
    >
      <video ref={videoRef} className="w-full h-full object-contain" crossOrigin="anonymous" />

      {/* Loading Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20">
            <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
          </div>
        </div>
      )}

      {/* Tap Areas */}
      <div className="absolute inset-0 flex pointer-events-none z-10">
        {/* Left tap area - backward */}
        <div 
          className="w-1/3 h-full pointer-events-auto" 
          onClick={(e) => handleTapAreaClick(e, "left")}
          onTouchEnd={(e) => handleTapAreaClick(e, "left")}
        />
        
        {/* Center tap area - play/pause */}
        <div 
          className="w-1/3 h-full pointer-events-auto flex items-center justify-center" 
          onClick={(e) => handleTapAreaClick(e, "center")}
          onTouchEnd={(e) => handleTapAreaClick(e, "center")}
        >
          {!isPlaying && !isBuffering && (
            <div className="bg-black/60 rounded-full p-4 sm:p-6 backdrop-blur-sm transition-all">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Right tap area - forward */}
        <div 
          className="w-1/3 h-full pointer-events-auto" 
          onClick={(e) => handleTapAreaClick(e, "right")}
          onTouchEnd={(e) => handleTapAreaClick(e, "right")}
        />
      </div>

      {/* Seek Indicator */}
      {seekIndicator && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="bg-black/80 rounded-full p-6 sm:p-8 animate-fade text-white flex flex-col items-center backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-1">
              {seekIndicator === "forward" ? (
                <>
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 -ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 -ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </>
              )}
            </div>
            <p className="font-bold text-base sm:text-lg mt-2">5 seconds</p>
          </div>
        </div>
      )}

      {/* Title Overlay */}
      {title && showControls && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-3 sm:p-6 transition-all duration-300 z-20">
          <h2 className="text-white text-sm sm:text-xl font-semibold drop-shadow-lg truncate">{title}</h2>
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        } bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 sm:p-6 backdrop-blur-md z-20`}
      >
        {/* Progress Bar */}
        <div 
          className="relative w-full h-1 sm:h-2 bg-white/20 rounded-full mb-3 sm:mb-4 cursor-pointer group/progress touch-none" 
          onClick={handleSeek}
          onTouchMove={handleSeek}
        >
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full relative"
            style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"></div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2 sm:gap-5">
            <button onClick={togglePlayPause} className="hover:scale-110 transition-transform active:scale-95">
              {isPlaying ? (
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <span className="text-xs sm:text-sm font-medium tracking-wide whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Subtitles/CC */}
            {subtitles.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSubtitleMenu(!showSubtitleMenu);
                    setShowAudioMenu(false);
                    setShowQualityMenu(false);
                    setShowVolumeSlider(false);
                  }}
                  className="px-2 py-1 sm:px-4 sm:py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-medium transition-all backdrop-blur-sm flex items-center gap-1 sm:gap-2"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 12h4v2H4v-2zm10 6H4v-2h10v2zm6 0h-4v-2h4v2zm0-4H10v-2h10v2z"/>
                  </svg>
                  <span className="hidden sm:inline">CC</span>
                </button>
                {showSubtitleMenu && (
                  <div className={`fixed sm:absolute bottom-16 sm:bottom-full right-2 sm:right-0 mb-0 sm:mb-3 bg-black/95 rounded-xl overflow-hidden shadow-2xl backdrop-blur-lg w-[200px] sm:min-w-[200px] ${subtitles.length > 5 ? 'max-h-[240px] overflow-y-auto' : ''}`}>
                    <div className="p-2">
                      {subtitles.map((sub) => (
                        <button
                          key={sub.index}
                          onClick={() => changeSubtitle(sub.index)}
                          className={`block w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-white/10 text-left text-xs sm:text-sm transition-all ${
                            currentSubtitle === sub.index ? "bg-blue-600 font-semibold" : ""
                          }`}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Audio */}
            {audioTracks.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowAudioMenu(!showAudioMenu);
                    setShowQualityMenu(false);
                    setShowSubtitleMenu(false);
                    setShowVolumeSlider(false);
                  }}
                  className="px-2 py-1 sm:px-4 sm:py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-medium transition-all backdrop-blur-sm flex items-center gap-1 sm:gap-2"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                  </svg>
                  <span className="hidden sm:inline">Audio</span>
                </button>
                {showAudioMenu && (
                  <div className={`fixed sm:absolute bottom-16 sm:bottom-full right-2 sm:right-0 mb-0 sm:mb-3 bg-black/95 rounded-xl overflow-hidden shadow-2xl backdrop-blur-lg w-[200px] sm:min-w-[200px] ${audioTracks.length > 5 ? 'max-h-[240px] overflow-y-auto' : ''}`}>
                    <div className="p-2">
                      {audioTracks.map((track) => (
                        <button
                          key={track.index}
                          onClick={() => changeAudioTrack(track.index)}
                          className={`block w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-white/10 text-left text-xs sm:text-sm transition-all ${
                            currentAudioTrack === track.index ? "bg-blue-600 font-semibold" : ""
                          }`}
                        >
                          {track.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quality */}
            {qualities.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowQualityMenu(!showQualityMenu);
                    setShowAudioMenu(false);
                    setShowSubtitleMenu(false);
                    setShowVolumeSlider(false);
                  }}
                  className="px-2 py-1 sm:px-4 sm:py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-medium transition-all backdrop-blur-sm flex items-center gap-1 sm:gap-2"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.5 12c0-2.23-1.28-4.15-3.15-5.1L12 2 7.65 6.9C5.78 7.85 4.5 9.77 4.5 12s1.28 4.15 3.15 5.1L12 22l4.35-4.9c1.87-.95 3.15-2.87 3.15-5.1z" />
                  </svg>
                  <span className="hidden sm:inline">{qualities.find((q) => q.index === currentQuality)?.name || "Quality"}</span>
                </button>
                {showQualityMenu && (
                  <div className="fixed sm:absolute bottom-16 sm:bottom-full right-2 sm:right-0 mb-0 sm:mb-3 bg-black/95 rounded-xl overflow-hidden shadow-2xl backdrop-blur-lg w-[140px] sm:min-w-[160px]">
                    <div className="p-2">
                      {qualities.map((q) => (
                        <button
                          key={q.index}
                          onClick={() => changeQuality(q.index)}
                          className={`block w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-white/10 text-left text-xs sm:text-sm transition-all ${
                            currentQuality === q.index ? "bg-blue-600 font-semibold" : ""
                          }`}
                        >
                          {q.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Volume with Slider - Desktop */}
            <div 
              className="relative hidden sm:flex items-center"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                onClick={() => {
                  const video = videoRef.current;
                  if (video) {
                    video.muted = !video.muted;
                  }
                }}
                className="hover:scale-110 transition-transform active:scale-95"
              >
                {isMuted || volume === 0 ? (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </button>
              {showVolumeSlider && (
                <div 
                  ref={volumeSliderRef}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-black/95 rounded-lg p-3 backdrop-blur-lg shadow-2xl"
                >
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeSliderChange}
                    className="w-24 h-1 appearance-none bg-white/20 rounded-full outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%, rgba(255,255,255,0.2) 100%)`
                    }}
                  />
                  <div className="text-center text-xs mt-2">{Math.round(volume * 100)}%</div>
                </div>
              )}
            </div>

            {/* Mobile Volume Toggle */}
            <button
              onClick={() => {
                const video = videoRef.current;
                if (video) {
                  video.muted = !video.muted;
                }
              }}
              className="sm:hidden hover:scale-110 transition-transform active:scale-95"
            >
              {isMuted || volume === 0 ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
              )}
            </button>

            <button onClick={toggleFullscreen} className="hover:scale-110 transition-transform active:scale-95">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                {isFullscreen ? (
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                ) : (
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes fade {
          0%, 100% { opacity: 0; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        .animate-fade {
          animation: fade 0.7s ease-in-out;
        }
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        div::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}
