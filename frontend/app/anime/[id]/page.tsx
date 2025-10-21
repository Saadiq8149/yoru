"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Play, AlertCircle, Loader } from "lucide-react";
import { useParams } from "next/navigation";

interface AnimeDetails {
  id: number;
  titleRomaji: string;
  titleEnglish: string;
  coverImage: string;
  bannerImage: string;
  episodes: number;
  status: string;
  description: string;
  genres: string[];
  year: number;
  averageScore: number;
  popularity: number;
}

interface Source {
  quality: string;
  url: string;
  source: string;
  referrer: string;
}

export default function AnimeDetailsPage() {
  const params = useParams();
  const animeId = params.id as string;

  const [anime, setAnime] = useState<AnimeDetails | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [loadingSources, setLoadingSources] = useState(false);
  const [error, setError] = useState("");
  const [dub, setDub] = useState(false);

  // Fetch anime details
  useEffect(() => {
    const fetchAnimeDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://34.47.230.194:4000/anime/${animeId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch anime details");
        }

        const data = await response.json();
        let animeDetails: AnimeDetails;

        animeDetails = {
          id: data.id,
          titleRomaji: data.title.romaji,
          titleEnglish: data.title.english,
          coverImage: data.coverImage.extraLarge,
          bannerImage: data.bannerImage,
          episodes: data.episodes,
          status: data.status,
          description: data.description,
          genres: data.genres,
          year: data.seasonYear,
          averageScore: data.averageScore,
          popularity: data.popularity,
        };

        setAnime(animeDetails);
        setSelectedEpisode(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (animeId) {
      fetchAnimeDetails();
    }
  }, [animeId]);

  // Fetch sources
  useEffect(() => {
    const fetchSources = async () => {
      if (!anime) return;

      try {
        setLoadingSources(true);
        const response = await fetch(`http://34.47.230.194:4000/sources`);

        if (response.ok) {
          const data = await response.json();
          setSources(data.sources || []);
        }
      } catch (err) {
        console.error("Error fetching sources:", err);
        setSources([]);
      } finally {
        setLoadingSources(false);
      }
    };

    if (anime) {
      fetchSources();
    }
  }, [anime, selectedEpisode, dub]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-foreground text-lg">{error || "Anime not found"}</p>
        <Link href="/search" className="text-primary hover:text-primary/80">
          Back to Search
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="sticky top-0 z-10 bg-card/50 backdrop-blur-md border-b border-border">
        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-6 py-4 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Search
        </Link>
      </div>

      {/* Banner */}
      <div className="relative h-96 w-full overflow-hidden">
        {anime.bannerImage && (
          <Image
            src={anime.bannerImage}
            alt={anime.titleEnglish || anime.titleRomaji}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="px-6 md:px-12 lg:px-16 py-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 -mt-32 relative z-10 mb-8">
          {/* Poster */}
          <div className="shrink-0 w-48 h-72">
            <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-primary shadow-lg">
              <Image
                src={anime.coverImage}
                alt={anime.titleEnglish || anime.titleRomaji}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col justify-end pb-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
              {anime.titleEnglish || anime.titleRomaji}
            </h1>

            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm font-semibold">
                {anime.status}
              </span>

              {anime.averageScore && (
                <div className="flex items-center gap-2">
                  <span className="text-primary font-bold">
                    {anime.averageScore}%
                  </span>
                  <span className="text-muted-foreground">Score</span>
                </div>
              )}

              {anime.year && (
                <span className="text-muted-foreground">{anime.year}</span>
              )}
            </div>

            {anime.genres && anime.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {anime.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 bg-secondary border border-border rounded-full text-sm text-muted-foreground"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {anime.description && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">Synopsis</h2>
            <p className="text-muted-foreground leading-relaxed line-clamp-3">
              {anime.description.replace(/<[^>]*>/g, "")}
            </p>
          </div>
        )}

        {/* Player Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Watch Episode
          </h2>

          {/* Episode Selection */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={dub}
                  onChange={(e) => setDub(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                English Dub
              </label>
            </div>

            {/* Episode List */}
            <div className="space-y-2">
              <label className="text-muted-foreground text-sm">
                Episode {selectedEpisode} of {anime.episodes}
              </label>
              <input
                type="range"
                min="1"
                max={anime.episodes}
                value={selectedEpisode}
                onChange={(e) => setSelectedEpisode(parseInt(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          {/* Sources Preview */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Available Sources
            </h3>
            {loadingSources ? (
              <div className="flex justify-center py-4">
                <Loader className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : sources.length === 0 ? (
              <p className="text-muted-foreground">
                Click play to load sources
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sources.slice(0, 3).map((source, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-secondary text-foreground rounded-lg text-sm"
                  >
                    {source.quality} - {source.source}
                  </span>
                ))}
                {sources.length > 3 && (
                  <span className="px-3 py-1 bg-muted text-muted-foreground rounded-lg text-sm">
                    +{sources.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Play Button */}
          <div className="flex justify-center">
            <Link
              href={`/player?animeId=${animeId}&anime=${encodeURIComponent(
                anime.titleEnglish || anime.titleRomaji
              )}&episode=${selectedEpisode}&dub=${dub}`}
            >
              <button className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-colors flex items-center justify-center gap-3 text-lg">
                <Play className="w-6 h-6" />
                <span>Watch Episode {selectedEpisode}</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
