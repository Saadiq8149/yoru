"use client";

import { useState, useEffect } from "react";
import AnimeSection from "@/components/anime-section";
import Link from "next/link";
import {
  Loader,
  TrendingUp,
  Star,
  Clock,
  User,
  LogIn,
  LogOut,
} from "lucide-react";

interface Anime {
  id: number;
  title: {
    romaji: string;
    english: string;
  };
  coverImage: {
    extraLarge: string;
  };
  status: string;
  seasonYear: number;
  episodes: number;
  averageScore?: number;
  genres?: string[];
}

interface ApiResponse {
  media: Anime[];
  pageInfo: {
    total: number;
    currentPage: number;
    lastPage: number;
    hasNextPage: boolean;
  };
}

interface AniListUser {
  id: number;
  name: string;
  avatar: {
    medium: string;
  };
}

interface ContinueWatchingEntry {
  id: number;
  progress: number;
  status: string;
  media: Anime;
}

export default function Home() {
  const [trending, setTrending] = useState<Anime[]>([]);
  const [popular, setPopular] = useState<Anime[]>([]);
  const [latest, setLatest] = useState<Anime[]>([]);
  const [continueWatching, setContinueWatching] = useState<
    ContinueWatchingEntry[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Check for stored AniList auth
  useEffect(() => {
    const storedToken = localStorage.getItem("anilist_token");

    if (storedToken) {
      setAccessToken(storedToken);
      fetchAniListUser(storedToken);
    }

    // Handle OAuth callback
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const token = hash.match(/access_token=([^&]*)/)?.[1];
      if (token) {
        fetchAniListUser(token);
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }
    }
  }, []);

  // Fetch AniList user data
  const fetchAniListUser = async (token: string) => {
    try {
      const response = await fetch("http://localhost:4000/anilist/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: token }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setAccessToken(token);
        localStorage.setItem("anilist_token", token);
        localStorage.setItem("anilist_user", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Error fetching AniList user:", error);
    }
  };
  const [user, setUser] = useState<AniListUser | null>(null);

  // Fetch continue watching data
  const fetchContinueWatching = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch("http://localhost:4000/continue-watching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      });

      if (response.ok) {
        const data = await response.json();

        setContinueWatching(data.entries || []);
      }
    } catch (error) {
      console.error("Error fetching continue watching:", error);
    }
  };

  // AniList login
  const loginToAniList = async () => {
    try {
      const response = await fetch("http://localhost:4000/anilist/oauth-url");
      const data = await response.json();
      window.location.href = data.oauth_url;
    } catch (error) {
      console.error("Error getting OAuth URL:", error);
    }
  };

  // AniList logout
  const logoutFromAniList = () => {
    localStorage.removeItem("anilist_token");
    localStorage.removeItem("anilist_user");
    setAccessToken(null);
    setUser(null);
    setContinueWatching([]);
  };

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendingRes, popularRes, latestRes] = await Promise.all([
          fetch("http://localhost:4000/trending?per_page=12"),
          fetch("http://localhost:4000/popular?per_page=12"),
          fetch("http://localhost:4000/latest?per_page=12"),
        ]);

        const [trendingData, popularData, latestData] = await Promise.all([
          trendingRes.json() as Promise<ApiResponse>,
          popularRes.json() as Promise<ApiResponse>,
          latestRes.json() as Promise<ApiResponse>,
        ]);

        setTrending(trendingData.media || []);
        setPopular(popularData.media || []);
        setLatest(latestData.media || []);
      } catch (error) {
        console.error("Error fetching anime data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch continue watching when user is authenticated
  useEffect(() => {
    if (user && accessToken) {
      fetchContinueWatching();
    }
  }, [user, accessToken]);

  // Transform API data to component format
  const transformAnime = (anime: Anime[]) =>
    anime.map((item) => ({
      id: item.id,
      title: item.title.english || item.title.romaji,
      year: item.seasonYear || 2024,
      status: item.status,
      image: item.coverImage.extraLarge,
      score: item.averageScore,
    }));

  // Transform continue watching data
  const transformContinueWatching = (entries: ContinueWatchingEntry[]) =>
    entries.map((entry) => ({
      id: entry.media.id,
      title: entry.media.title.english || entry.media.title.romaji,
      year: entry.media.seasonYear || 2024,
      status: `Episode ${entry.progress}${
        entry.media.episodes ? `/${entry.media.episodes}` : ""
      }`,
      image: entry.media.coverImage.extraLarge,
      progress: entry.progress,
      totalEpisodes: entry.media.episodes,
    }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading anime data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 md:space-y-12">
      {/* AniList Auth Section */}
      <div className="flex justify-end">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img
                src={user.avatar.medium}
                alt={user.name}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-foreground font-medium">{user.name}</span>
            </div>
            <button
              onClick={logoutFromAniList}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={loginToAniList}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Login with AniList
          </button>
        )}
      </div>

      {/* Hero Section */}
      {user && continueWatching.length > 0 ? (
        // Continue Watching Hero Banner
        <div className="relative h-[70vh] min-h-[500px] rounded-2xl overflow-hidden">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${continueWatching[0].media.coverImage.extraLarge})`,
            }}
          >
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/60 to-transparent"></div>
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent"></div>
          </div>

          {/* Content */}
          <div className="relative h-full flex items-center">
            <div className="max-w-4xl mx-auto px-8 text-left">
              <div className="space-y-6">
                {/* Continue Watching Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/90 backdrop-blur-sm rounded-full text-primary-foreground font-semibold">
                  <Clock className="w-4 h-4" />
                  Continue Watching
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-7xl font-bold text-white drop-shadow-2xl leading-tight">
                  {continueWatching[0].media.title.english ||
                    continueWatching[0].media.title.romaji}
                </h1>

                {/* Progress Info */}
                <div className="flex items-center gap-4 text-white/90">
                  <span className="text-lg font-medium">
                    Episode {continueWatching[0].progress}
                    {continueWatching[0].media.episodes &&
                      ` of ${continueWatching[0].media.episodes}`}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-lg">
                    {continueWatching[0].media.seasonYear}
                  </span>
                  {continueWatching[0].media.status && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-lg">
                        {continueWatching[0].media.status}
                      </span>
                    </>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-md">
                  <div className="w-full bg-white/20 rounded-full h-2 backdrop-blur-sm">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          continueWatching[0].media.episodes
                            ? (continueWatching[0].progress /
                                continueWatching[0].media.episodes) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 pt-4">
                  <Link
                    href={`/player?animeId=${
                      continueWatching[0].media.id
                    }&anime=${encodeURIComponent(
                      continueWatching[0].media.title.english ||
                        continueWatching[0].media.title.romaji
                    )}&episode=${continueWatching[0].progress + 1}`}
                    className="flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 transition-all duration-300 hover:scale-105 shadow-2xl"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Continue Watching
                  </Link>
                  <Link
                    href={`/anime/${continueWatching[0].media.id}`}
                    className="flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-bold text-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
                  >
                    More Info
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Default Hero Section
        <div className="text-center space-y-4 py-16">
          <h1 className="text-4xl md:text-7xl font-bold bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent leading-tight">
            Discover Anime
          </h1>
          <p className="text-muted-foreground text-xl max-w-3xl mx-auto leading-relaxed">
            Watch the latest episodes, discover trending series, and explore the
            amazing world of anime
          </p>
          {!user && (
            <div className="pt-8">
              <button
                onClick={loginToAniList}
                className="flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 transition-all duration-300 hover:scale-105 shadow-xl mx-auto"
              >
                <LogIn className="w-5 h-5" />
                Login with AniList to Continue Watching
              </button>
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-4 pt-8">
            <Link
              href="/trending"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              View All Trending
            </Link>
            <Link
              href="/popular"
              className="flex items-center gap-2 px-6 py-3 bg-secondary text-foreground rounded-lg font-semibold hover:bg-muted transition-colors"
            >
              <Star className="w-4 h-4" />
              View All Popular
            </Link>
            <Link
              href="/latest"
              className="flex items-center gap-2 px-6 py-3 bg-secondary text-foreground rounded-lg font-semibold hover:bg-muted transition-colors"
            >
              <Clock className="w-4 h-4" />
              View Latest
            </Link>
          </div>
        </div>
      )}

      {/* Anime Sections */}
      {user && continueWatching.length > 1 && (
        <AnimeSection
          title="Continue Watching"
          anime={transformContinueWatching(continueWatching.slice(1))}
        />
      )}

      {trending.length > 0 && (
        <AnimeSection
          title="Trending Now"
          anime={transformAnime(trending)}
          viewAllLink="/trending"
        />
      )}

      {popular.length > 0 && (
        <AnimeSection
          title="Most Popular"
          anime={transformAnime(popular)}
          viewAllLink="/popular"
        />
      )}

      {latest.length > 0 && (
        <AnimeSection
          title="Latest Episodes"
          anime={transformAnime(latest)}
          viewAllLink="/latest"
        />
      )}
    </div>
  );
}
