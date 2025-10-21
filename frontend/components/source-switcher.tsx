"use client"

import { Zap } from "lucide-react"

interface Source {
  name: string
  url: string
}

interface SourceSwitcherProps {
  sources: Source[]
  currentSource: number
  onSourceChange: (index: number) => void
}

export default function SourceSwitcher({ sources, currentSource, onSourceChange }: SourceSwitcherProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Zap size={18} className="text-accent" />
        <h3 className="font-semibold text-foreground">Video Sources</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => (
          <button
            key={index}
            onClick={() => onSourceChange(index)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              currentSource === index
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            }`}
          >
            {source.name}
          </button>
        ))}
      </div>
    </div>
  )
}
