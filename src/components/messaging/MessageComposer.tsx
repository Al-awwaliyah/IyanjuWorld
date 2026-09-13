import {
  Paperclip,
  Send,
  X,
} from "lucide-react";
import {
  useRef,
  useState,
} from "react";
import Button from "../ui/Button";

export interface MessageComposerAttachment {
  file: File;
  previewUrl?: string;
}

export interface MessageComposerProps {
  value?: string;
  onChange?: (value: string) => void;
  onSend: (
    message: string,
    attachment?: File,
  ) => Promise<void> | void;
  disabled?: boolean;
  sending?: boolean;
  placeholder?: string;
  allowAttachments?: boolean;
  acceptedFileTypes?: string;
  maxFileSizeMb?: number;
  className?: string;
}

export default function MessageComposer({
  value,
  onChange,
  onSend,
  disabled = false,
  sending = false,
  placeholder = "Write a message...",
  allowAttachments = true,
  acceptedFileTypes =
    "image/jpeg,image/png,image/webp,application/pdf,.doc,.docx",
  maxFileSizeMb = 5,
  className = "",
}: MessageComposerProps) {
  const [internalValue, setInternalValue] =
    useState("");
  const [attachment, setAttachment] =
    useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] =
    useState<string | null>(null);
  const [error, setError] =
    useState("");

  const fileInputRef =
    useRef<HTMLInputElement>(null);
  const textareaRef =
    useRef<HTMLTextAreaElement>(null);

  const message =
    value !== undefined
      ? value
      : internalValue;

  const setMessage = (
    nextValue: string,
  ) => {
    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onChange?.(nextValue);

    if (error) {
      setError("");
    }
  };

  const clearAttachment = () => {
    if (attachmentPreview) {
      URL.revokeObjectURL(
        attachmentPreview,
      );
    }

    setAttachment(null);
    setAttachmentPreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const maxBytes =
      maxFileSizeMb *
      1024 *
      1024;

    if (file.size > maxBytes) {
      setError(
        `Attachment must be ${maxFileSizeMb} MB or smaller.`,
      );
      event.target.value = "";
      return;
    }

    if (
      file.type.startsWith(
        "image/",
      )
    ) {
      const preview =
        URL.createObjectURL(file);

      if (attachmentPreview) {
        URL.revokeObjectURL(
          attachmentPreview,
        );
      }

      setAttachmentPreview(preview);
    } else {
      setAttachmentPreview(null);
    }

    setAttachment(file);
    setError("");
  };

  const submitMessage = async () => {
    const trimmedMessage =
      message.trim();

    if (
      !trimmedMessage &&
      !attachment
    ) {
      setError(
        "Write a message or attach a file.",
      );
      return;
    }

    try {
      await onSend(
        trimmedMessage,
        attachment ?? undefined,
      );

      setMessage("");
      clearAttachment();

      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    } catch {
      setError(
        "We couldn't send your message. Please try again.",
      );
    }
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      disabled ||
      sending
    ) {
      return;
    }

    await submitMessage();
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (
        !disabled &&
        !sending
      ) {
        void submitMessage();
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={[
        "border-t border-slate-200 bg-white p-3 sm:p-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {attachment && (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
          {attachmentPreview ? (
            <img
              src={attachmentPreview}
              alt={attachment.name}
              className="h-12 w-12 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500">
              <Paperclip
                className="h-5 w-5"
                aria-hidden="true"
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">
              {attachment.name}
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              {(
                attachment.size /
                (1024 * 1024)
              ).toFixed(2)}{" "}
              MB
            </p>
          </div>

          <button
            type="button"
            onClick={clearAttachment}
            disabled={disabled || sending}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Remove attachment"
          >
            <X
              className="h-4 w-4"
              aria-hidden="true"
            />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {allowAttachments && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFileTypes}
              onChange={handleFileChange}
              disabled={
                disabled ||
                sending
              }
              className="hidden"
            />

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={
                disabled ||
                sending
              }
              className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Attach file"
            >
              <Paperclip
                className="h-5 w-5"
                aria-hidden="true"
              />
            </button>
          </>
        )}

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(event) =>
            setMessage(
              event.target.value,
            )
          }
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={
            disabled ||
            sending
          }
          rows={1}
          className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Message"
        />

        <Button
          type="submit"
          size="md"
          loading={sending}
          disabled={
            disabled ||
            sending ||
            (!message.trim() &&
              !attachment)
          }
          className="mb-0.5"
          aria-label="Send message"
        >
          <Send
            className="h-4 w-4"
            aria-hidden="true"
          />
          <span className="hidden sm:inline">
            Send
          </span>
        </Button>
      </div>

      {error && (
        <p
          className="mt-2 px-1 text-xs text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}

      <p className="mt-2 px-1 text-[11px] text-slate-400">
        Press Enter to send · Shift + Enter for a new line
      </p>
    </form>
  );
}
