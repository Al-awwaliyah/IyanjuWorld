import {
  Download,
  FileText,
  Image as ImageIcon,
  X,
} from "lucide-react";

export type AttachmentPreviewType =
  | "image"
  | "file";

export interface AttachmentPreviewProps {
  name: string;
  url?: string | null;
  type: AttachmentPreviewType;
  size?: number | null;
  removable?: boolean;
  downloadable?: boolean;
  onRemove?: () => void;
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

export default function AttachmentPreview({
  name,
  url,
  type,
  size,
  removable = false,
  downloadable = false,
  onRemove,
  className = "",
}: AttachmentPreviewProps) {
  const fileSize = formatFileSize(size);

  return (
    <div
      className={[
        "relative overflow-hidden rounded-xl border border-slate-200 bg-white",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {type === "image" && url ? (
        <div className="relative">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            <img
              src={url}
              alt={name}
              className="max-h-64 w-full object-cover"
              loading="lazy"
            />
          </a>

          <div className="flex items-center gap-2 border-t border-slate-100 px-3 py-2.5">
            <ImageIcon
              className="h-4 w-4 shrink-0 text-slate-400"
              aria-hidden="true"
            />

            <p className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
              {name}
            </p>

            {fileSize && (
              <span className="shrink-0 text-[11px] text-slate-400">
                {fileSize}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <FileText
              className="h-5 w-5"
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">
              {name}
            </p>

            {fileSize && (
              <p className="mt-0.5 text-xs text-slate-400">
                {fileSize}
              </p>
            )}
          </div>

          {downloadable && url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
              aria-label={`Download ${name}`}
            >
              <Download
                className="h-4 w-4"
                aria-hidden="true"
              />
            </a>
          )}
        </div>
      )}

      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/75"
          aria-label={`Remove ${name}`}
        >
          <X
            className="h-4 w-4"
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
}
