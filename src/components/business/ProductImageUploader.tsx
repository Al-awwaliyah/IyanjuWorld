import {
  Check,
  GripVertical,
  ImagePlus,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import EmptyState from "../ui/EmptyState";

export interface ProductImageItem {
  id: string;
  url: string;
  storagePath?: string | null;
  altText?: string | null;
  isPrimary?: boolean;
  sortOrder?: number;
  fileName?: string | null;
}

export interface ProductImageUploadFile {
  id: string;
  file: File;
  previewUrl: string;
  progress?: number;
  uploading?: boolean;
  error?: string | null;
}

export interface ProductImageUploaderProps {
  images?: ProductImageItem[];
  pendingFiles?: ProductImageUploadFile[];
  maxImages?: number;
  maxFileSizeMb?: number;
  acceptedTypes?: string[];
  loading?: boolean;
  uploading?: boolean;
  disabled?: boolean;
  error?: string | null;
  onFilesSelected?: (
    files: File[],
  ) => void;
  onRemoveImage?: (
    image: ProductImageItem,
  ) => void | Promise<void>;
  onRemovePendingFile?: (
    file: ProductImageUploadFile,
  ) => void;
  onSetPrimary?: (
    image: ProductImageItem,
  ) => void | Promise<void>;
  onReorder?: (
    images: ProductImageItem[],
  ) => void;
  onRetryUpload?: (
    file: ProductImageUploadFile,
  ) => void;
  className?: string;
}

const DEFAULT_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const DEFAULT_MAX_IMAGES = 8;
const DEFAULT_MAX_FILE_SIZE_MB = 5;

function formatFileSize(
  bytes: number,
) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function getFileExtension(
  fileName: string,
) {
  const parts =
    fileName.split(".");

  return parts.length > 1
    ? parts[
        parts.length - 1
      ].toUpperCase()
    : "FILE";
}

function createPendingId(
  file: File,
) {
  return [
    file.name,
    file.size,
    file.lastModified,
    Math.random()
      .toString(36)
      .slice(2, 8),
  ].join("-");
}

export default function ProductImageUploader({
  images = [],
  pendingFiles = [],
  maxImages = DEFAULT_MAX_IMAGES,
  maxFileSizeMb =
    DEFAULT_MAX_FILE_SIZE_MB,
  acceptedTypes =
    DEFAULT_ACCEPTED_TYPES,
  loading = false,
  uploading = false,
  disabled = false,
  error = null,
  onFilesSelected,
  onRemoveImage,
  onRemovePendingFile,
  onSetPrimary,
  onReorder,
  onRetryUpload,
  className = "",
}: ProductImageUploaderProps) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const [localError, setLocalError] =
    useState<string | null>(null);

  const [draggedId, setDraggedId] =
    useState<string | null>(null);

  const [dragOverId, setDragOverId] =
    useState<string | null>(null);

  const totalImageCount =
    images.length +
    pendingFiles.length;

  const remainingSlots = Math.max(
    maxImages - totalImageCount,
    0,
  );

  const isDisabled =
    disabled ||
    loading ||
    uploading;

  const displayError =
    error || localError;

  const acceptedAttribute =
    acceptedTypes.join(",");

  const acceptedTypeLabel =
    useMemo(() => {
      return acceptedTypes
        .map((type) => {
          const extension =
            type.split("/")[1];

          if (
            extension === "jpeg"
          ) {
            return "JPG";
          }

          return extension
            ? extension.toUpperCase()
            : type;
        })
        .join(", ");
    }, [acceptedTypes]);

  useEffect(() => {
    return () => {
      pendingFiles.forEach(
        (item) => {
          if (
            item.previewUrl.startsWith(
              "blob:",
            )
          ) {
            URL.revokeObjectURL(
              item.previewUrl,
            );
          }
        },
      );
    };
  }, [pendingFiles]);

  const validateFiles = (
    selectedFiles: File[],
  ) => {
    const validFiles: File[] = [];
    const rejectedMessages: string[] =
      [];

    const availableSlots =
      Math.max(
        maxImages -
          totalImageCount,
        0,
      );

    if (availableSlots === 0) {
      return {
        files: [],
        error: `You can upload up to ${maxImages} images per product.`,
      };
    }

    const filesToProcess =
      selectedFiles.slice(
        0,
        availableSlots,
      );

    if (
      selectedFiles.length >
      availableSlots
    ) {
      rejectedMessages.push(
        `Only ${availableSlots} more image${
          availableSlots === 1
            ? ""
            : "s"
        } can be added.`,
      );
    }

    filesToProcess.forEach(
      (file) => {
        if (
          !acceptedTypes.includes(
            file.type,
          )
        ) {
          rejectedMessages.push(
            `${file.name}: unsupported image format.`,
          );

          return;
        }

        const maxBytes =
          maxFileSizeMb *
          1024 *
          1024;

        if (file.size > maxBytes) {
          rejectedMessages.push(
            `${file.name}: maximum size is ${maxFileSizeMb} MB.`,
          );

          return;
        }

        validFiles.push(file);
      },
    );

    return {
      files: validFiles,
      error:
        rejectedMessages.length
          ? rejectedMessages.join(
              " ",
            )
          : null,
    };
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles =
      Array.from(
        event.target.files ||
          [],
      );

    if (!selectedFiles.length) {
      return;
    }

    const result =
      validateFiles(
        selectedFiles,
      );

    setLocalError(
      result.error,
    );

    if (
      result.files.length >
        0 &&
      onFilesSelected
    ) {
      onFilesSelected(
        result.files,
      );
    }

    event.target.value = "";
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();

    setDragOverId(null);

    if (isDisabled) {
      return;
    }

    const selectedFiles =
      Array.from(
        event.dataTransfer.files ||
          [],
      );

    if (!selectedFiles.length) {
      return;
    }

    const result =
      validateFiles(
        selectedFiles,
      );

    setLocalError(
      result.error,
    );

    if (
      result.files.length >
        0 &&
      onFilesSelected
    ) {
      onFilesSelected(
        result.files,
      );
    }
  };

  const moveImage = (
    fromIndex: number,
    toIndex: number,
  ) => {
    if (
      !onReorder ||
      fromIndex === toIndex
    ) {
      return;
    }

    const nextImages = [
      ...images,
    ];

    const [
      movedImage,
    ] = nextImages.splice(
      fromIndex,
      1,
    );

    nextImages.splice(
      toIndex,
      0,
      movedImage,
    );

    onReorder(
      nextImages.map(
        (image, index) => ({
          ...image,
          sortOrder: index,
        }),
      ),
    );
  };

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    imageId: string,
  ) => {
    if (
      isDisabled ||
      !onReorder
    ) {
      return;
    }

    setDraggedId(imageId);

    event.dataTransfer.effectAllowed =
      "move";

    event.dataTransfer.setData(
      "text/plain",
      imageId,
    );
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>,
    imageId: string,
  ) => {
    if (
      isDisabled ||
      !onReorder ||
      !draggedId
    ) {
      return;
    }

    event.preventDefault();

    setDragOverId(imageId);

    event.dataTransfer.dropEffect =
      "move";
  };

  const handleDropOnImage = (
    event: React.DragEvent<HTMLDivElement>,
    targetId: string,
  ) => {
    event.preventDefault();

    if (
      isDisabled ||
      !onReorder ||
      !draggedId ||
      draggedId === targetId
    ) {
      setDraggedId(null);
      setDragOverId(null);

      return;
    }

    const fromIndex =
      images.findIndex(
        (image) =>
          image.id ===
          draggedId,
      );

    const toIndex =
      images.findIndex(
        (image) =>
          image.id ===
          targetId,
      );

    if (
      fromIndex !== -1 &&
      toIndex !== -1
    ) {
      moveImage(
        fromIndex,
        toIndex,
      );
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const openFilePicker = () => {
    if (isDisabled) {
      return;
    }

    inputRef.current?.click();
  };

  return (
    <section
      className={[
        "rounded-2xl border border-slate-200 bg-white",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Product images
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Add clear product photos to help
              customers understand what you are
              selling.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
            {totalImageCount}/
            {maxImages} images
          </span>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {displayError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <X
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />

            <span>
              {displayError}
            </span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={
            acceptedAttribute
          }
          multiple
          onChange={
            handleFileChange
          }
          disabled={isDisabled}
          className="sr-only"
        />

        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {images.map(
              (
                image,
                index,
              ) => (
                <div
                  key={image.id}
                  draggable={
                    !isDisabled &&
                    Boolean(
                      onReorder,
                    )
                  }
                  onDragStart={(
                    event,
                  ) =>
                    handleDragStart(
                      event,
                      image.id,
                    )
                  }
                  onDragOver={(
                    event,
                  ) =>
                    handleDragOver(
                      event,
                      image.id,
                    )
                  }
                  onDrop={(
                    event,
                  ) =>
                    handleDropOnImage(
                      event,
                      image.id,
                    )
                  }
                  onDragEnd={
                    handleDragEnd
                  }
                  className={[
                    "group relative overflow-hidden rounded-2xl border bg-white transition-all",
                    image.isPrimary
                      ? "border-slate-400 ring-2 ring-slate-100"
                      : "border-slate-200",
                    dragOverId ===
                    image.id
                      ? "border-slate-500 ring-2 ring-slate-200"
                      : "",
                    draggedId ===
                    image.id
                      ? "opacity-50"
                      : "",
                  ]
                    .filter(
                      Boolean,
                    )
                    .join(" ")}
                >
                  <div className="aspect-square bg-slate-100">
                    <img
                      src={
                        image.url
                      }
                      alt={
                        image.altText ||
                        "Product image"
                      }
                      className="h-full w-full object-cover"
                      loading={
                        index === 0
                          ? "eager"
                          : "lazy"
                      }
                      onError={(
                        event,
                      ) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />
                  </div>

                  <div className="absolute left-2 top-2 flex items-center gap-1.5">
                    {image.isPrimary && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur">
                        <Star
                          className="h-3 w-3 fill-current"
                          aria-hidden="true"
                        />
                        Primary
                      </span>
                    )}

                    {onReorder && (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-slate-500 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100">
                        <GripVertical
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </span>
                    )}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 pt-8 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex min-w-0 items-center gap-1.5">
                      {!image.isPrimary &&
                        onSetPrimary && (
                          <button
                            type="button"
                            disabled={
                              isDisabled
                            }
                            onClick={() =>
                              onSetPrimary(
                                image,
                              )
                            }
                            className="rounded-lg bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Make primary
                          </button>
                        )}
                    </div>

                    {onRemoveImage && (
                      <button
                        type="button"
                        disabled={
                          isDisabled
                        }
                        onClick={() =>
                          onRemoveImage(
                            image,
                          )
                        }
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500 text-white shadow-sm transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Remove ${
                          image.altText ||
                          "product image"
                        }`}
                      >
                        <Trash2
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </button>
                    )}
                  </div>

                  {index === 0 &&
                    !image.isPrimary && (
                      <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                        First image
                      </div>
                    )}
                </div>
              ),
            )}
          </div>
        )}

        {pendingFiles.length >
          0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Upload queue
              </h3>

              {uploading && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Spinner
                    size="xs"
                    label="Uploading"
                  />
                  Uploading images...
                </div>
              )}
            </div>

            <div className="space-y-2">
              {pendingFiles.map(
                (item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-200">
                      <img
                        src={
                          item.previewUrl
                        }
                        alt={
                          item.file.name
                        }
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {item.file.name}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatFileSize(
                          item.file.size,
                        )}{" "}
                        ·{" "}
                        {getFileExtension(
                          item.file.name,
                        )}
                      </p>

                      {item.error ? (
                        <p className="mt-1 text-xs font-medium text-red-600">
                          {item.error}
                        </p>
                      ) : item.uploading ? (
                        <div className="mt-2">
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-slate-700 transition-all"
                              style={{
                                width: `${Math.min(
                                  Math.max(
                                    item.progress ||
                                      0,
                                    0,
                                  ),
                                  100,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ) : item.progress ===
                        100 ? (
                        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <Check
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          Uploaded
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      {item.error &&
                        onRetryUpload && (
                          <button
                            type="button"
                            onClick={() =>
                              onRetryUpload(
                                item,
                              )
                            }
                            disabled={
                              isDisabled
                            }
                            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Retry
                          </button>
                        )}

                      {onRemovePendingFile && (
                        <button
                          type="button"
                          onClick={() =>
                            onRemovePendingFile(
                              item,
                            )
                          }
                          disabled={
                            item.uploading ||
                            isDisabled
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Remove ${item.file.name}`}
                        >
                          <X
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                        </button>
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
            <Spinner
              size="lg"
              label="Loading product images"
            />
          </div>
        ) : (
          <div
            onDragOver={(event) => {
              if (!isDisabled) {
                event.preventDefault();
              }
            }}
            onDrop={handleDrop}
            className={[
              "rounded-2xl border-2 border-dashed px-5 py-8 text-center transition-colors sm:px-8",
              isDisabled
                ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                : "cursor-pointer border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white",
            ].join(" ")}
            onClick={openFilePicker}
            role="button"
            tabIndex={
              isDisabled ? -1 : 0
            }
            onKeyDown={(event) => {
              if (
                isDisabled
              ) {
                return;
              }

              if (
                event.key ===
                  "Enter" ||
                event.key ===
                  " "
              ) {
                event.preventDefault();
                openFilePicker();
              }
            }}
            aria-disabled={
              isDisabled
            }
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
              <ImagePlus
                className="h-6 w-6"
                aria-hidden="true"
              />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              Add product images
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
              Drag and drop images here or choose
              files from your device.
            </p>

            <div className="mt-4">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={
                  isDisabled ||
                  remainingSlots === 0
                }
                onClick={(event) => {
                  event.stopPropagation();
                  openFilePicker();
                }}
              >
                <Upload
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                Choose images
              </Button>
            </div>

            <p className="mt-4 text-xs text-slate-400">
              {acceptedTypeLabel} · Up to{" "}
              {maxFileSizeMb} MB each ·{" "}
              {remainingSlots} slot
              {remainingSlots === 1
                ? ""
                : "s"}{" "}
              remaining
            </p>
          </div>
        )}

        {images.length === 0 &&
          pendingFiles.length ===
            0 &&
          !loading && (
            <EmptyState
              icon={ImagePlus}
              title="No product images yet"
              description="Add at least one clear image so customers can see your product."
              className="border-0 bg-slate-50"
            />
          )}

        {images.length > 0 && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-start gap-2 text-xs leading-5 text-slate-500">
              <GripVertical
                className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                aria-hidden="true"
              />

              <p>
                {onReorder
                  ? "Drag images to change their order. The primary image is used as the main product image."
                  : "The primary image is used as the main product image shown to customers."}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
