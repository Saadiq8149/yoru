"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit2, LogOut, Clock, Play, Star, Zap } from "lucide-react";

export default function ProfilePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // User data
  const user = {
    name: "Anime Enthusiast",
    email: "user@yoru.app",
    joinDate: "January 2024",
    avatar: "/anime-profile-avatar.jpg",
  };

  // Stats data
  const stats = [
    {
      icon: Play,
      label: "Anime Watched",
      value: "127",
      color: "text-blue-400",
    },
    {
      icon: Clock,
      label: "Watch Time",
      value: "1,240h",
      color: "text-cyan-400",
    },
    {
      icon: Star,
      label: "Favorites",
      value: "34",
      color: "text-purple-400",
    },
    {
      icon: Zap,
      label: "Currently Watching",
      value: "12",
      color: "text-yellow-400",
    },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 space-y-8">
            {/* Profile Header */}
            <div className="space-y-6">
              {/* Background Gradient */}
              <div className="h-32 md:h-40 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl" />

              {/* Profile Info */}
              <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16 md:-mt-20 px-4 md:px-0">
                {/* Avatar */}
                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-card">
                  <AvatarImage
                    src={user.avatar || "/placeholder.svg"}
                    alt={user.name}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    AE
                  </AvatarFallback>
                </Avatar>

                {/* User Details */}
                <div className="flex-1 space-y-2">
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                    {user.name}
                  </h1>
                  <p className="text-muted-foreground">{user.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Member since {user.joinDate}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 w-full md:w-auto">
                  <Button
                    variant="outline"
                    size="default"
                    className="flex-1 md:flex-none gap-2 bg-transparent"
                  >
                    <Edit2 size={18} />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="default"
                    className="flex-1 md:flex-none gap-2 text-destructive hover:text-destructive"
                  >
                    <LogOut size={18} />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={index}
                    className="border-border hover:border-accent transition-colors duration-300"
                  >
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className={`${stat.color}`}>
                          <Icon size={28} />
                        </div>
                        <div>
                          <p className="text-2xl md:text-3xl font-bold text-foreground">
                            {stat.value}
                          </p>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {stat.label}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Preferences Section */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl">
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <span className="text-foreground">Notifications</span>
                    <div className="w-12 h-6 bg-primary rounded-full" />
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <span className="text-foreground">
                      Auto-play Next Episode
                    </span>
                    <div className="w-12 h-6 bg-primary rounded-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">Dark Mode</span>
                    <div className="w-12 h-6 bg-primary rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Section */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-xl md:text-2xl">Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-card transition-colors text-foreground">
                  Change Password
                </button>
                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-card transition-colors text-foreground">
                  Download Data
                </button>
                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-card transition-colors text-destructive">
                  Delete Account
                </button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
