"use client"

import type React from "react"
import { useState } from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import Sidebar from "@/components/sidebar"
import MobileHeader from "@/components/mobile-header"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

// Note: Metadata doesn't work in "use client" components, move to separate file if needed
// export const metadata: Metadata = {
//   title: "Yoru - Anime Streaming",
//   description: "Stream your favorite anime with Yoru",
// }

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <html lang="en">
      <body className={`${inter.className} font-sans antialiased bg-background text-foreground`}>
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
          {/* Sidebar */}
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile Header */}
            <MobileHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

            {/* Scrollable Content */}
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
        <Analytics />
      </body>
    </html>
  )
}