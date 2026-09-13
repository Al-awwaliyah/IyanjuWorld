import {
  CheckCheck,
  MessageCircle,
  Paperclip,
} from "lucide-react";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import { formatRelativeDate } from "../../libs/format";

export type ConversationType =
  | "customer_business"
  | "customer_rider"
  | "business_admin"
  | "business_rider"
  | "general";

export interface ConversationItemProps {
  id: string;
  title: string;
  subtitle?: string | null;
  avatarUrl?: string | null;
  avatarName?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
  online?: boolean;
  typing?: boolean;
  muted?: boolean;
  messageFromCurrentUser?: boolean;
  hasAttachment?: boolean;
  type?: ConversationType;
  selected?: boolean;
  onClick?: (id: string) => void;
  href?: string;
  className?: string;
}

function getConversationLabel(
  type: ConversationType,
) {
  switch (type) {
    case "customer_business":
      return "Business";
    case "customer_rider":
      return "Rider";
    case "business_admin":
      return "Admin";
    case "business_rider":
      return "Rider";
    default:
      return null;
  }
}

export default function ConversationItem({
  id,
  title,
  subtitle,
  avatarUrl,
  avatarName,
  lastMessage,
  lastMessageAt,
  unreadCount = 0,
  online = false,
  typing = false,
  muted = false,
  messageFromCurrentUser = false,
  hasAttachment = false,
  type = "general",
  selected = false,
  onClick,
  href,
  className = "",
}: ConversationItemProps) {
  const typeLabel =
    getConversationLabel(type);

  const content = (
    <>
      <div className="relative shrink-0">
        <Avatar
          src={avatarUrl ?? undefined}
          name={avatarName || title}
          size="md"
          status={
            online
              ? "online"
              : undefined
          }
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3
                className={[
                  "truncate text-sm",
                  unreadCount > 0
                    ? "font-bold text-slate-900"
                    : "font-semibold text-slate-800",
                ].join(" ")}
              >
                {title}
              </h3>

              {typeLabel && (
                <Badge
                  variant="neutral"
                  size="sm"
                >
                  {typeLabel}
                </Badge>
              )}
            </div>

            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-slate-400">
                {subtitle}
              </p>
            )}
          </div>

          {lastMessageAt && (
            <span
              className={[
                "shrink-0 text-[11px]",
                unreadCount > 0
                  ? "font-semibold text-slate-700"
                  : "text-slate-400",
              ].join(" ")}
            >
              {formatRelativeDate(
                lastMessageAt,
              )}
            </span>
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            {typing ? (
              <p className="text-xs font-medium text-emerald-600">
                Typing...
              </p>
            ) : (
              <div className="flex min-w-0 items-center gap-1.5">
                {messageFromCurrentUser && (
                  <CheckCheck
                    className="h-3.5 w-3.5 shrink-0 text-slate-400"
                    aria-hidden="true"
                  />
                )}

                {hasAttachment && (
                  <Paperclip
                    className="h-3.5 w-3.5 shrink-0 text-slate-400"
                    aria-hidden="true"
                  />
                )}

                <p
                  className={[
                    "truncate text-xs",
                    unreadCount > 0
                      ? "font-medium text-slate-700"
                      : "text-slate-500",
                  ].join(" ")}
                >
                  {lastMessage ||
                    (hasAttachment
                      ? "Attachment"
                      : "No messages yet")}
                </p>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {muted && (
              <MessageCircle
                className="h-3.5 w-3.5 text-slate-300"
                aria-label="Muted conversation"
              />
            )}

            {unreadCount > 0 && (
              <span className="flex min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold leading-4 text-white">
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );

  const sharedClassName = [
    "flex w-full gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
    selected
      ? "bg-slate-100"
      : "hover:bg-slate-50",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <a
        href={href}
        className={sharedClassName}
        aria-current={
          selected ? "page" : undefined
        }
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={sharedClassName}
      onClick={() => onClick?.(id)}
      aria-pressed={selected}
    >
      {content}
    </button>
  );
}
