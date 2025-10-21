"use client";

import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

interface Source {
  quality: string;
  url: string;
  source: string;
  referrer: string;
}

interface AnimeDetails {
  id: number;
  title: { romaji: string; english: string };
  coverImage: { extraLarge: string };
  episodes: number;
  status: string;
  description: string;
}

export default function PlayerPage() {
  const searchParams = useSearchParams();
  const animeId = searchParams.get("animeId");
  const animeTitle = searchParams.get("anime");
  const episodeNumber = parseInt(searchParams.get("episode") || "1");
  const dubParam = searchParams.get("dub") === "true";

  const [anime, setAnime] = useState<AnimeDetails | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [episodes, setEpisodes] = useState<number[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState(episodeNumber);
  const [loading, setLoading] = useState(true);
  const [loadingSources, setLoadingSources] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState(false);

  // Check for AniList auth
  useEffect(() => {
    const token = localStorage.getItem("anilist_token");
    if (token) {
      setAccessToken(token);
    }
  }, []);

  // Sync progress with AniList
  const updateAniListProgress = async (
    episode: number,
    totalEpisodes: number
  ) => {
    if (!accessToken || !animeId) return;

    try {
      setSyncProgress(true);
      const response = await fetch(
        "http://34.47.230.194:4000/anilist/update-progress",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            media_id: parseInt(animeId),
            episode: episode,
            total_episodes: totalEpisodes,
            access_token: accessToken,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ AniList sync:", data.message);

        // Show a brief success message
        const syncIndicator = document.createElement("div");
        syncIndicator.textContent = `✅ Synced: Episode ${episode}`;
        syncIndicator.className =
          "fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg z-50";
        document.body.appendChild(syncIndicator);

        setTimeout(() => {
          document.body.removeChild(syncIndicator);
        }, 3000);
      }
    } catch (error) {
      console.error("❌ AniList sync failed:", error);
    } finally {
      setSyncProgress(false);
    }
  };

  // Fetch anime details
  useEffect(() => {
    if (!animeId) return;

    setLoading(true);
    fetch(`http://34.47.230.194:4000/anime/${animeId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setAnime(data);
        setEpisodes(
          Array.from(
            { length: data.episodes || data.nextAiringEpisode.episode - 1 },
            (_, i) => i + 1
          )
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    console;
  }, [animeId]);

  // Fetch sources for current episode
  useEffect(() => {
    if (!animeId || !animeTitle) return;

    const fetchSources = async () => {
      setLoadingSources(true);
      try {
        const res = await fetch(
          `http://34.47.230.194:4000/sources?anilist_id=${animeId}&episode=${currentEpisode}&dub=${dubParam}&title=${encodeURIComponent(
            animeTitle
          )}`
        );
        const data = await res.json();
        const newSources = data.sources || [];
        setSources(newSources);
        if (newSources.length) setSelectedSource(newSources[0]);
      } catch (e) {
        console.error(e);
        setSources([]);
      } finally {
        setLoadingSources(false);
      }
    };

    fetchSources();
  }, [animeId, animeTitle, currentEpisode, dubParam]);

  // Reset sync progress when episode changes
  useEffect(() => {
    setSyncProgress(false);
  }, [currentEpisode]);

  useLayoutEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return; // video element not yet in DOM

    // Initialize only once
    if (!playerRef.current) {
      playerRef.current = videojs(videoEl, {
        controls: true,
        fluid: true,
        preload: "auto",
        playbackRates: [0.5, 1, 1.25, 1.5, 2],
        sources: [], // start empty
      });

      const player = playerRef.current;
      player.on("ready", () => console.log("✅ Player ready"));
      player.on("error", () =>
        console.error("❌ Player error:", player.error())
      );
      player.on("play", () => console.log("▶️ Playback started"));
      player.on("pause", () => console.log("⏸️ Playback paused"));

      // Sync progress when episode ends
      player.on("ended", () => {
        console.log("🏁 Playback ended");
        if (anime && accessToken) {
          updateAniListProgress(currentEpisode, anime.episodes);
        }
      });

      // Sync progress when user has watched 80% of the episode
      player.on("timeupdate", () => {
        const currentTime = player.currentTime();
        const duration = player.duration();

        if (currentTime && duration && currentTime / duration >= 0.8) {
          if (anime && accessToken && !syncProgress) {
            setSyncProgress(true);
            updateAniListProgress(currentEpisode, anime.episodes);
          }
        }
      });
    }

    // Update source if selectedSource exists
    if (selectedSource && playerRef.current) {
      const proxyUrl = `http://34.47.230.194:4000/proxy?url=${encodeURIComponent(
        selectedSource.url
      )}&ref=${encodeURIComponent(selectedSource.referrer)}`;
      console.log("🎥 Updating player source to:", proxyUrl);
      playerRef.current.src({ src: proxyUrl, type: "video/mp4" });
      playerRef.current.load();
    }
  }, [selectedSource]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!playerRef.current) return;

      // Don't handle keyboard shortcuts if user is typing in an input field
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true"
      ) {
        return;
      }

      const player = playerRef.current;

      // Prevent default behavior for our handled keys
      const handledKeys = [
        "Space",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "KeyF",
      ];
      if (handledKeys.includes(event.code)) {
        event.preventDefault();
        event.stopPropagation(); // Stop event from bubbling up
      }

      switch (event.code) {
        case "Space":
          // Play/Pause
          if (player.paused()) {
            player.play();
            console.log("⏯️ Keyboard: Play");
          } else {
            player.pause();
            console.log("⏯️ Keyboard: Pause");
          }
          break;

        case "ArrowLeft":
          // Seek backward 5 seconds
          const currentTimeLeft = player.currentTime();
          player.currentTime(Math.max(0, currentTimeLeft - 5));
          console.log("⏪ Keyboard: Seek -5s");
          break;

        case "ArrowRight":
          // Seek forward 5 seconds
          const currentTimeRight = player.currentTime();
          const duration = player.duration();
          player.currentTime(
            Math.min(duration || currentTimeRight + 5, currentTimeRight + 5)
          );
          console.log("⏩ Keyboard: Seek +5s");
          break;

        case "ArrowUp":
          // Volume up by 10%
          const currentVolumeUp = player.volume();
          const newVolumeUp = Math.min(1, currentVolumeUp + 0.1);
          player.volume(newVolumeUp);
          console.log(`🔊 Keyboard: Volume ${Math.round(newVolumeUp * 100)}%`);
          break;

        case "ArrowDown":
          // Volume down by 10%
          const currentVolumeDown = player.volume();
          const newVolumeDown = Math.max(0, currentVolumeDown - 0.1);
          player.volume(newVolumeDown);
          console.log(
            `🔉 Keyboard: Volume ${Math.round(newVolumeDown * 100)}%`
          );
          break;

        case "KeyF":
          // Toggle fullscreen
          if (player.isFullscreen()) {
            player.exitFullscreen();
            console.log("🪟 Keyboard: Exit fullscreen");
          } else {
            player.requestFullscreen();
            console.log("⛶ Keyboard: Enter fullscreen");
          }
          break;
      }
    };

    // Add event listener
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []); // Empty dependency - only set up once

  // Separate cleanup effect that only runs on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        console.log("♻️ Cleaning up Video.js player on unmount");
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []); // Empty dependency array = only runs on mount/unmount

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="sticky top-0 z-10 bg-card/50 backdrop-blur-md border-b border-border">
        <Link
          href={animeId ? `/anime/${animeId}` : "/search"}
          className="inline-flex items-center gap-2 px-6 py-4 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Details
        </Link>
      </div>

      <div className="p-6 max-w-7xl mx-auto grid lg:grid-cols-4 gap-8">
        {/* Player */}
        <div className="lg:col-span-3">
          <div className="rounded-lg overflow-hidden bg-black aspect-video mb-4">
            <video
              ref={videoRef}
              className="video-js vjs-big-play-centered w-full h-full"
              playsInline
            />
          </div>

          {/* Sources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Available Sources</h3>
            {loadingSources ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : sources.length === 0 ? (
              <p className="text-muted-foreground">
                No sources available for this episode
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sources.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedSource(src)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      selectedSource?.url === src.url
                        ? "bg-primary text-white"
                        : "bg-secondary hover:bg-muted"
                    }`}
                  >
                    {src.quality} – {src.source}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {anime && (
            <div className="bg-card rounded-lg p-6 mb-6">
              <div className="flex gap-4 mb-3">
                <Image
                  src={anime.coverImage.extraLarge}
                  alt={anime.title.english || anime.title.romaji}
                  width={80}
                  height={120}
                  className="rounded-lg object-cover"
                />
                <div>
                  <h2 className="font-bold text-lg">
                    {anime.title.english || anime.title.romaji}
                  </h2>
                  <p className="text-primary font-semibold">
                    Episode {currentEpisode}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {anime.description?.replace(/<[^>]*>/g, "")}
              </p>
            </div>
          )}

          {/* Episode List */}
          <div className="bg-card rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Episodes</h3>
            <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {episodes.map((ep) => (
                <button
                  key={ep}
                  onClick={() => setCurrentEpisode(ep)}
                  className={`py-2 rounded-lg text-sm ${
                    currentEpisode === ep
                      ? "bg-primary text-white"
                      : "bg-secondary hover:bg-muted"
                  }`}
                >
                  {ep}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
