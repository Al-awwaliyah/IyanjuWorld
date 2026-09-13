import {
  MessageSquare,
} from "lucide-react";
import MessageBubble, {
  type MessageBubbleProps,
} from "./MessageBubble";
import Spinner from "../ui/Spinner";
import EmptyState from "../ui/EmptyState";

export interface MessageListProps {
  messages: MessageBubbleProps[];
  loading?: boolean;
  currentUserId?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

function getDateKey(
  value: string,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return [
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ].join("-");
}

function formatDateLabel(
  value: string,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const today = new Date();

  const todayKey = getDateKey(
    today.toISOString(),
  );
  const dateKey = getDateKey(value);

  if (dateKey === todayKey) {
    return "Today";
  }

  const yesterday = new Date(today);
  yesterday.setDate(
    yesterday.getDate() - 1,
  );

  if (
    dateKey ===
    getDateKey(
      yesterday.toISOString(),
    )
  ) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat(
    "en-NG",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  ).format(date);
}

export default function MessageList({
  messages,
  loading = false,
  emptyTitle = "No messages yet",
  emptyDescription = "Start the conversation by sending a message.",
  className = "",
}: MessageListProps) {
  if (loading) {
    return (
      <div
        className={[
          "flex min-h-80 items-center justify-center",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Spinner
          size="lg"
          label="Loading messages"
        />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div
        className={[
          "flex min-h-80 items-center justify-center",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <EmptyState
          icon={MessageSquare}
          title={emptyTitle}
          description={emptyDescription}
          className="border-0 bg-transparent"
        />
      </div>
    );
  }

  const sortedMessages = [
    ...messages,
  ].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime(),
  );

  return (
    <div
      className={[
        "space-y-5 overflow-y-auto px-3 py-5 sm:px-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {sortedMessages.map(
        (message, index) => {
          const previous =
            sortedMessages[index - 1];

          const currentDateKey =
            getDateKey(
              message.createdAt,
            );

          const previousDateKey =
            previous
              ? getDateKey(
                  previous.createdAt,
                )
              : "";

          const showDateDivider =
            index === 0 ||
            currentDateKey !==
              previousDateKey;

          return (
            <div
              key={message.id}
              className="space-y-4"
            >
              {showDateDivider && (
                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-slate-100" />

                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500">
                    {formatDateLabel(
                      message.createdAt,
                    )}
                  </span>

                  <div className="h-px flex-1 bg-slate-100" />
                </div>
              )}

              <MessageBubble
                {...message}
              />
            </div>
          );
        },
      )}
    </div>
  );
}
