"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import HLS from "hls.js"
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface VideoPlayerProps {
  episodeNumber: number
  episodeTitle: string
  animeTitle: string
  bannerImage: string
  sourceUrl: string
}

export default function VideoPlayer({
  episodeNumber,
  episodeTitle,
  animeTitle,
  bannerImage,
  sourceUrl,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  // Initialize HLS.js
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (HLS.isSupported()) {
      const hls = new HLS()
      hls.loadSource(sourceUrl)
      hls.attachMedia(video)

      return () => {
        hls.destroy()
      }
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = sourceUrl
    }
  }, [sourceUrl])

  // Handle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Handle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        containerRef.current.requestFullscreen()
      } else {
        document.exitFullscreen()
      }
      setIsFullscreen(!isFullscreen)
    }
  }

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    videoRef.current.currentTime = percent * duration
  }

  // Show controls on mouse move
  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000)
    }
  }

  // Format time
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black rounded-lg overflow-hidden group"
      onMouseMove={handleMouseMove}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full aspect-video bg-black"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Controls Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Episode Info */}
        <div className="absolute top-4 left-4 right-4">
          <p className="text-sm text-white/70">{animeTitle}</p>
          <p className="text-lg font-semibold text-white">
            {episodeTitle} • Episode {episodeNumber}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-16 left-0 right-0 px-4">
          <div className="cursor-pointer" onClick={handleProgressClick} onMouseMove={(e) => e.stopPropagation()}>
            <Progress value={(currentTime / duration) * 100} className="h-1" />
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button onClick={togglePlay} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              {isPlaying ? <Pause size={24} className="text-white" /> : <Play size={24} className="text-white" />}
            </button>

            {/* Mute */}
            <button onClick={toggleMute} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              {isMuted ? <VolumeX size={24} className="text-white" /> : <Volume2 size={24} className="text-white" />}
            </button>

            {/* Time Display */}
            <span className="text-white text-sm ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <Maximize size={24} className="text-white" />
          </button>
        </div>
      </div>

      {/* Play Button Overlay (when paused) */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
            <Play size={32} className="text-white ml-1" />
          </div>
        </div>
      )}
    </div>
  )
}
