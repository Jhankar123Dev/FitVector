"use client";

import { signOut } from "next-auth/react";
import { Bell, Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationDropdown } from "./notification-dropdown";
import { useUser } from "@/hooks/use-user";
import { useState, useRef, useEffect, useMemo } from "react";
import { MOCK_NOTIFICATIONS } from "@/lib/mock/seeker-marketplace-data";
import type { SeekerNotification } from "@/types/marketplace";

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user } = useUser();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<SeekerNotification[]>(MOCK_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-surface-200 bg-white px-4 sm:px-6">
      {/* Left: mobile menu */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        {/* Plan badge */}
        <span className="hidden rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium capitalize text-brand-700 sm:inline-flex">
          {user?.planTier || "free"}
        </span>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative text-surface-500 hover:text-surface-700"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowDropdown(false);
            }}
          >
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Button>

          {showNotifications && (
            <NotificationDropdown
              notifications={notifications}
              onMarkAllRead={handleMarkAllRead}
            />
          )}
        </div>

        {/* User avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-200 focus:ring-offset-2"
            onClick={() => {
              setShowDropdown(!showDropdown);
              setShowNotifications(false);
            }}
          >
            <Avatar className="h-8 w-8">
              {user?.image && <AvatarImage src={user.image} alt={user.name || ""} />}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-surface-200 bg-white shadow-card-hover">
              <div className="border-b border-surface-100 px-4 py-3">
                <p className="text-sm font-medium text-surface-800">{user?.name || "User"}</p>
                <p className="text-xs text-surface-500">{user?.email}</p>
              </div>
              <div className="py-1">
                <a
                  href="/dashboard/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-surface-600 hover:bg-surface-50 hover:text-surface-800 transition-colors"
                >
                  <User className="h-4 w-4" />
                  Profile Settings
                </a>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-surface-600 hover:bg-surface-50 hover:text-surface-800 transition-colors"
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
