"use client";

import AnimeCard from "./anime-card";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Anime {
  id: number;
  title: string;
  year: number;
  status: string;
  image: string;
  score?: number;
}

interface AnimeSectionProps {
  title: string;
  anime: Anime[];
  viewAllLink?: string;
}

export default function AnimeSection({
  title,
  anime,
  viewAllLink,
}: AnimeSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          {title}
        </h2>
        {viewAllLink && (
          <Link
            href={viewAllLink}
            className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      <div className="overflow-x-auto pb-4 -mx-4 md:-mx-8 px-4 md:px-8">
        <div className="flex gap-4 md:gap-6 min-w-min">
          {anime.map((item) => (
            <AnimeCard key={item.id} anime={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
