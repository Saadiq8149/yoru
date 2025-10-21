"use client"

import type React from "react"

import { useState } from "react"
import { Search } from "lucide-react"

interface EpisodeSearchProps {
  totalEpisodes: number
  onEpisodeSelect: (episodeNumber: number) => void
}

export default function EpisodeSearch({ totalEpisodes, onEpisodeSelect }: EpisodeSearchProps) {
  const [inputValue, setInputValue] = useState("")

  const handleSearch = () => {
    const episodeNum = Number.parseInt(inputValue)
    if (episodeNum > 0 && episodeNum <= totalEpisodes) {
      onEpisodeSelect(episodeNum)
      setInputValue("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-foreground">Jump to Episode</h3>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="number"
            min="1"
            max={totalEpisodes}
            placeholder={`1-${totalEpisodes}`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          Go
        </button>
      </div>
      <p className="text-xs text-muted-foreground">Enter episode number (1-{totalEpisodes})</p>
    </div>
  )
}
