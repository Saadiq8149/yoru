"use client";

import type React from "react";

import { Home, User, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 z-50 md:z-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold text-lg">
                夜
              </span>
            </div>
            <h1 className="text-xl font-bold text-sidebar-foreground">Yoru</h1>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-sidebar-foreground hover:text-sidebar-accent transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6 space-y-4">
          <NavLink icon={Home} label="Home" href="/" onClick={onClose} />
          <NavLink
            icon={Search}
            label="Search"
            href="/search"
            onClick={onClose}
          />
          <NavLink
            icon={User}
            label="Profile"
            href="/profile"
            onClick={onClose}
          />
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/60">© 2025 yoru</p>
        </div>
      </aside>
    </>
  );
}

interface NavLinkProps {
  icon: React.ComponentType<{ size: number }>;
  label: string;
  href: string;
  onClick: () => void;
}

function NavLink({ icon: Icon, label, href, onClick }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors group"
    >
      <Icon size={20} className="group-hover:scale-110 transition-transform" />
      <span className="font-medium">{label}</span>
    </Link>
  );
}
