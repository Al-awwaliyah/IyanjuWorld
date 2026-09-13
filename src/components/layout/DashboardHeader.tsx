import { Bell, Menu, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

export interface DashboardHeaderProps {
  title: string;
  description?: string;
  userName?: string | null;
  userAvatar?: string | null;
  notificationCount?: number;
  onMenuClick?: () => void;
  action?: ReactNode;
  onProfileClick?: () => void;
}

export default function DashboardHeader({
  title,
  description,
  userName,
  userAvatar,
  notificationCount = 0,
  onMenuClick,
  action,
  onProfileClick,
}: DashboardHeaderProps) {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
      return;
    }

    navigate("/customer/profile");
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {onMenuClick && (
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={onMenuClick}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-slate-900 sm:text-xl">
              {title}
            </h1>

            {description && (
              <p className="mt-0.5 hidden truncate text-sm text-slate-500 sm:block">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {action}

          <button
            type="button"
            aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ""}`}
            onClick={() => navigate("/customer/messages")}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Bell className="h-5 w-5" />

            {notificationCount > 0 && (
              <span className="absolute right-1 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-semibold leading-none text-white">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleProfileClick}
            className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100"
            aria-label="Open profile"
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName || "Profile"}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <UserRound className="h-4 w-4" />
              </span>
            )}

            <span className="hidden max-w-32 truncate text-sm font-medium text-slate-700 md:block">
              {userName || "Account"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
