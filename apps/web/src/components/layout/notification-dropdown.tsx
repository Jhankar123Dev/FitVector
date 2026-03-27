"use client";

import {
  ArrowRightCircle,
  Bell,
  BriefcaseBusiness,
  CheckCheck,
  Info,
  Mail,
  Star,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import type { SeekerNotification, NotificationType } from "@/types/marketplace";

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: typeof Bell; borderColor: string; iconColor: string }
> = {
  status_change: { icon: ArrowRightCircle, borderColor: "border-l-blue-500", iconColor: "text-blue-500" },
  interview_invite: { icon: BriefcaseBusiness, borderColor: "border-l-purple-500", iconColor: "text-purple-500" },
  offer: { icon: Star, borderColor: "border-l-green-500", iconColor: "text-green-500" },
  rejection: { icon: XCircle, borderColor: "border-l-red-500", iconColor: "text-red-500" },
  general: { icon: Info, borderColor: "border-l-surface-400", iconColor: "text-surface-400" },
};

interface NotificationDropdownProps {
  notifications: SeekerNotification[];
  onMarkAllRead: () => void;
}

export function NotificationDropdown({
  notifications,
  onMarkAllRead,
}: NotificationDropdownProps) {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="absolute right-0 mt-2 w-80 rounded-xl border border-surface-200 bg-white shadow-card-hover">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-surface-800">Notifications</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAllRead}
            className="h-auto gap-1 px-2 py-1 text-xs text-surface-500 hover:text-surface-700"
          >
            <CheckCheck className="h-3 w-3" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications list */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Mail className="mb-2 h-8 w-8 text-surface-300" />
            <p className="text-sm text-surface-500">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const config = TYPE_CONFIG[notif.type];
            const Icon = config.icon;
            return (
              <a
                key={notif.id}
                href={notif.actionUrl}
                className={`flex gap-3 border-l-2 px-4 py-3 transition-colors hover:bg-surface-50 ${config.borderColor} ${
                  !notif.isRead ? "bg-brand-50/30" : ""
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  <Icon className={`h-4 w-4 ${config.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <p className="text-sm font-medium text-surface-800">{notif.title}</p>
                    {!notif.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-surface-500 line-clamp-2">
                    {notif.message}
                  </p>
                  <p className="mt-1 text-[10px] text-surface-400">
                    {formatRelativeTime(notif.createdAt)}
                  </p>
                </div>
              </a>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-surface-100 px-4 py-2">
          <a
            href="/dashboard/settings/notifications"
            className="text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            Notification preferences
          </a>
        </div>
      )}
    </div>
  );
}
