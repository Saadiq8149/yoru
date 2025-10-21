"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";

interface AnimeCardProps {
  anime: {
    id: number;
    title: string;
    year: number;
    status: string;
    image: string;
    progress?: number;
    totalEpisodes?: number;
  };
}

export default function AnimeCard({ anime }: AnimeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isContinueWatching = anime.progress !== undefined;
  const progressPercentage = anime.totalEpisodes
    ? (anime.progress! / anime.totalEpisodes) * 100
    : 0;

  // For continue watching, link to player with next episode
  const nextEpisode = isContinueWatching ? anime.progress! + 1 : 1;
  const href = isContinueWatching
    ? `/player?animeId=${anime.id}&anime=${encodeURIComponent(
        anime.title
      )}&episode=${nextEpisode}`
    : `/anime/${anime.id}`;

  return (
    <Link href={href}>
      <div
        className="shrink-0 w-40 md:w-48 group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative h-56 md:h-64 rounded-lg overflow-hidden bg-card border border-border transition-all duration-300 group-hover:border-accent">
          <Image
            src={anime.image || "/placeholder.svg"}
            alt={anime.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Status Badge */}
          <div className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-primary-foreground">
            {anime.status}
          </div>

          {/* Progress Bar for Continue Watching */}
          {isContinueWatching && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2">
              <div className="w-full bg-gray-600 rounded-full h-1.5 mb-1">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-white">
                Episode {anime.progress}
                {anime.totalEpisodes ? `/${anime.totalEpisodes}` : ""}
              </div>
            </div>
          )}

          {/* Overlay on Hover */}
          {isHovered && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300">
              <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors">
                {isContinueWatching ? "Continue Watching" : "Watch Now"}
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-3 space-y-1">
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-colors">
            {anime.title}
          </h3>
          <p className="text-sm text-muted-foreground">{anime.year}</p>
        </div>
      </div>
    </Link>
  );
}
