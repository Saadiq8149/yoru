"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Loader, Star } from "lucide-react";
import Link from "next/link";
import AnimeCard from "@/components/anime-card";

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
  averageScore?: number;
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

export default function PopularPage() {
  const [anime, setAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch popular anime
  const fetchPopular = async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await fetch(`/api/popular?page=${page}&per_page=20`);
      const data: ApiResponse = await response.json();

      if (append) {
        setAnime((prev) => [...prev, ...data.media]);
      } else {
        setAnime(data.media);
      }

      setHasNextPage(data.pageInfo.hasNextPage);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching popular anime:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPopular();
  }, []);

  const loadMore = () => {
    if (hasNextPage && !loadingMore) {
      fetchPopular(currentPage + 1, true);
    }
  };

  // Transform data
  const transformedAnime = anime.map((item) => ({
    id: item.id,
    title: item.title.english || item.title.romaji,
    year: item.seasonYear || 2024,
    status: item.status,
    image: item.coverImage.extraLarge,
    score: item.averageScore,
  }));

  if (loading && anime.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading popular anime...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/50 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-4 px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">
              Most Popular Anime
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {transformedAnime.map((item) => (
            <AnimeCard key={`${item.id}-${currentPage}`} anime={item} />
          ))}
        </div>

        {/* Load More Button */}
        {hasNextPage && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loadingMore ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </button>
          </div>
        )}

        {/* End message */}
        {!hasNextPage && anime.length > 0 && (
          <div className="text-center mt-8 text-muted-foreground">
            You've reached the end of popular anime!
          </div>
        )}
      </div>
    </div>
  );
}
