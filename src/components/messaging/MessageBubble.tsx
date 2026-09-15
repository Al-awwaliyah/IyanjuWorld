import {
  Check,
  CheckCheck,
  Download,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { formatDateTime } from "../../libs/format";

export type MessageStatus =
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export type MessageAttachmentType =
  | "image"
  | "file";

export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  type: MessageAttachmentType;
  mimeType?: string | null;
  size?: number | null;
}

export interface MessageBubbleProps {
  id: string;
  content?: string | null;
  createdAt: string;
  isMine?: boolean;
  status?: MessageStatus;
  senderName?: string | null;
  attachment?: MessageAttachment | null;
  showSender?: boolean;
  className?: string;
}

function formatFileSize(
  size?: number | null,
) {
  if (!size || size <= 0) {
    return "";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function StatusIcon({
  status,
}: {
  status: MessageStatus;
}) {
  if (status === "sending") {
    return (
      <span className="text-slate-400">
        <Check
          className="h-3.5 w-3.5"
          aria-hidden="true"
        />
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="font-semibold text-red-500">
        !
      </span>
    );
  }

  if (
    status === "delivered" ||
    status === "read"
  ) {
    return (
      <CheckCheck
        className={[
          "h-3.5 w-3.5",
          status === "read"
            ? "text-emerald-500"
            : "text-slate-400",
        ].join(" ")}
        aria-hidden="true"
      />
    );
  }

  return (
    <Check
      className="h-3.5 w-3.5 text-slate-400"
      aria-hidden="true"
    />
  );
}

export default function MessageBubble({
  content,
  createdAt,
  isMine = false,
  status = "sent",
  senderName,
  attachment,
  showSender = false,
  className = "",
}: MessageBubbleProps) {
  return (
    <div
      className={[
        "flex w-full",
        isMine
          ? "justify-end"
          : "justify-start",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={[
          "max-w-[85%] sm:max-w-[70%]",
          isMine
            ? "items-end"
            : "items-start",
        ].join(" ")}
      >
        {showSender &&
          senderName &&
          !isMine && (
            <p className="mb-1 px-1 text-xs font-semibold text-slate-500">
              {senderName}
            </p>
          )}

        <div
          className={[
            "overflow-hidden rounded-2xl",
            isMine
              ? "rounded-br-md bg-ink-900 text-white"
              : "rounded-bl-md border border-slate-200 bg-white text-slate-800",
          ].join(" ")}
        >
          {attachment && (
            <div className="border-b border-white/10">
              {attachment.type ===
                "image" ? (
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="max-h-72 w-full max-w-md object-cover"
                    loading="lazy"
                  />
                </a>
              ) : (
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className={[
                    "flex items-center gap-3 px-4 py-3 transition-colors",
                    isMine
                      ? "hover:bg-white/10"
                      : "hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      isMine
                        ? "bg-white/10"
                        : "bg-slate-100",
                    ].join(" ")}
                  >
                    <FileText
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {attachment.name}
                    </p>

                    {attachment.size && (
                      <p
                        className={[
                          "mt-0.5 text-xs",
                          isMine
                            ? "text-slate-300"
                            : "text-slate-400",
                        ].join(" ")}
                      >
                        {formatFileSize(
                          attachment.size,
                        )}
                      </p>
                    )}
                  </div>

                  <Download
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                </a>
              )}
            </div>
          )}

          {content && (
            <p className="whitespace-pre-wrap break-words px-4 py-2.5 text-sm leading-6">
              {content}
            </p>
          )}
        </div>

        <div
          className={[
            "mt-1 flex items-center gap-1 px-1",
            isMine
              ? "justify-end"
              : "justify-start",
          ].join(" ")}
        >
          {attachment?.type ===
            "image" && (
            <ImageIcon
              className="h-3 w-3 text-slate-400"
              aria-hidden="true"
            />
          )}

          <span className="text-[10px] text-slate-400">
            {formatDateTime(createdAt)}
          </span>

          {isMine && (
            <StatusIcon status={status} />
          )}

          {status === "failed" && (
            <span className="text-[10px] font-medium text-red-500">
              Failed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
