"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search as SearchIcon, Loader } from "lucide-react";

interface AnimeResult {
  id: number;
  titleRomaji: string;
  titleEnglish: string;
  bannerImage: string;
  coverImage: string;
  status: string;
  episodes: number;
  description: string;
  year: number;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<AnimeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Debounce search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `http://34.47.230.194:4000/search/${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch search results");
      }

      const data = await response.json();

      let resultsArray: AnimeResult[] = [];
      console.log("Search results:", data);

      for (const item of data) {
        resultsArray.push({
          id: item.id,
          titleRomaji: item.title.romaji,
          titleEnglish: item.title.english,
          bannerImage: item.bannerImage,
          coverImage: item.coverImage.extraLarge,
          status: item.status,
          episodes: item.episodes,
          description: item.description,
          year: item.seasonYear,
        });
      }

      setResults(resultsArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Search Bar */}
      <div className="sticky top-0 z-10 bg-linear-to-b from-card to-transparent p-4 md:p-8 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-foreground">
            Search Anime
          </h1>

          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Search anime..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {error && (
            <div className="text-red-500 text-center py-8">{error}</div>
          )}

          {loading && (
            <div className="flex justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {!loading && results.length === 0 && searchQuery && (
            <div className="text-center py-12 text-muted-foreground">
              No anime found for "{searchQuery}"
            </div>
          )}

          {!loading && results.length > 0 && (
            <div>
              <p className="text-muted-foreground mb-6">
                Found {results.length} result{results.length !== 1 ? "s" : ""}{" "}
                for "{searchQuery}"
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {results.map((anime) => (
                  <Link key={anime.id} href={`/anime/${anime.id}`}>
                    <div className="group cursor-pointer h-full">
                      {/* Thumbnail */}
                      <div className="relative h-100 rounded-lg overflow-hidden bg-card border border-border mb-4 transition-all duration-300 group-hover:border-primary">
                        <Image
                          src={anime.coverImage || "/placeholder.svg"}
                          alt={anime.titleEnglish || anime.titleRomaji}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 50%, (max-width: 1024px) 33%, 25%"
                        />

                        {/* Status Badge */}
                        <div className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-primary-foreground">
                          {anime.status}
                        </div>

                        {/* Episodes Badge */}
                        {anime.episodes && (
                          <div className="absolute bottom-2 left-2 bg-card/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-foreground">
                            {anime.episodes} eps
                          </div>
                        )}

                        {/* Overlay on Hover */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                            View Details
                          </button>
                        </div>
                      </div>

                      {/* Info */}
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm">
                          {anime.titleEnglish || anime.titleRomaji}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {anime.episodes
                            ? `${anime.episodes} Episodes`
                            : "Ongoing"}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!loading && !searchQuery && (
            <div className="text-center py-12 text-muted-foreground">
              Enter a search term to find anime
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
