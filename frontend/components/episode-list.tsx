"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Play } from "lucide-react"

interface Episode {
  number: number
  title: string
  sources: Array<{
    name: string
    url: string
  }>
}

interface EpisodeListProps {
  episodes: Episode[]
  currentEpisode: number
  onEpisodeSelect: (episodeNumber: number) => void
}

export default function EpisodeList({ episodes, currentEpisode, onEpisodeSelect }: EpisodeListProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-foreground">Episodes</h3>
      <ScrollArea className="h-96 pr-4">
        <div className="space-y-2">
          {episodes.map((episode) => (
            <button
              key={episode.number}
              onClick={() => onEpisodeSelect(episode.number)}
              className={`w-full p-3 rounded-lg text-left transition-all duration-200 flex items-center gap-3 ${
                currentEpisode === episode.number
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80 text-foreground"
              }`}
            >
              <Play size={16} className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Ep {episode.number}</p>
                <p className="text-xs opacity-70 truncate">{episode.title}</p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
