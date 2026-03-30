"use client";

import Link from "next/link";
import { Bell, Menu, LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useUser } from "@/hooks/use-user";

interface EmployerNavbarProps {
  onMenuClick?: () => void;
}

export function EmployerNavbar({ onMenuClick }: EmployerNavbarProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user } = useUser();

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

  const initials = user?.name
    ? user.name
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
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-surface-500">{user?.email || ""}</p>
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
                  href="/employer/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-surface-600 transition-colors hover:bg-surface-50 hover:text-surface-800 sm:hidden"
                  onClick={() => setShowDropdown(false)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    signOut({ callbackUrl: "/login" });
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
