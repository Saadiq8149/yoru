"use client"

import { Menu } from "lucide-react"

interface MobileHeaderProps {
  onMenuClick: () => void
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="md:hidden bg-card border-b border-border px-4 py-4 flex items-center justify-between">
      <button onClick={onMenuClick} className="text-foreground hover:text-accent transition-colors">
        <Menu size={24} />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">夜</span>
        </div>
        <h1 className="text-lg font-bold">yoru</h1>
      </div>
      <div className="w-6" />
    </header>
  )
}
