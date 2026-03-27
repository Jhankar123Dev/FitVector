"use client";

import Link from "next/link";
import { Bell, Menu, LogOut, User, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useRef, useEffect } from "react";
import { MOCK_TEAM_MEMBERS } from "@/lib/mock/employer-data";

interface EmployerNavbarProps {
  onMenuClick?: () => void;
}

export function EmployerNavbar({ onMenuClick }: EmployerNavbarProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mock current user = first team member (admin)
  const currentUser = MOCK_TEAM_MEMBERS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = currentUser.name
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="sticky top-0 z-40 flex h-14 sm:h-16 items-center justify-between border-b border-surface-200 bg-white px-3 sm:px-4 md:px-6">
      {/* Left: mobile menu */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        {/* Switch to job seeker */}
        <Link
          href="/dashboard"
          className="hidden items-center gap-1.5 rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-600 transition-colors hover:bg-surface-50 hover:text-surface-800 sm:inline-flex"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          Job Seeker
        </Link>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-surface-500 hover:text-surface-700"
        >
          <Bell className="h-5 w-5" />
          {/* Notification dot */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent-500" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-200 focus:ring-offset-2"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-surface-200 bg-white shadow-card-hover">
              <div className="border-b border-surface-100 px-4 py-3">
                <p className="text-sm font-medium text-surface-800">
                  {currentUser.name || "User"}
                </p>
                <p className="text-xs text-surface-500">{currentUser.email}</p>
              </div>
              <div className="py-1">
                <Link
                  href="/employer/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-surface-600 transition-colors hover:bg-surface-50 hover:text-surface-800"
                  onClick={() => setShowDropdown(false)}
                >
                  <User className="h-4 w-4" />
                  Settings
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-surface-600 transition-colors hover:bg-surface-50 hover:text-surface-800 sm:hidden"
                  onClick={() => setShowDropdown(false)}
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Switch to Job Seeker
                </Link>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    // signOut would go here
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-surface-600 transition-colors hover:bg-surface-50 hover:text-surface-800"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
