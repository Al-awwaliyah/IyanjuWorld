import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Phone,
  Store,
} from "lucide-react";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

export interface BusinessHeaderProps {
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  verified?: boolean;
  open?: boolean;
  productCount?: number;
  showBackButton?: boolean;
  onChat?: () => void;
  chatting?: boolean;
  className?: string;
}

export default function BusinessHeader({
  name,
  description,
  logoUrl,
  coverUrl,
  city,
  state,
  phone,
  whatsapp,
  verified = false,
  open = true,
  productCount,
  showBackButton = true,
  onChat,
  chatting = false,
  className = "",
}: BusinessHeaderProps) {
  const location = [city, state]
    .filter(Boolean)
    .join(", ");

  const normalizedPhone = phone
    ? phone.replace(/[^\d+]/g, "")
    : "";

  const normalizedWhatsApp = whatsapp
    ? whatsapp.replace(/[^\d]/g, "")
    : "";

  return (
    <section
      className={[
        "overflow-hidden rounded-2xl border border-slate-200 bg-white",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="relative h-48 bg-slate-100 sm:h-56 lg:h-64">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <Store
              className="h-16 w-16"
              aria-hidden="true"
            />
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          {showBackButton ? (
            <Link to="/businesses">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="bg-white/95 shadow-sm backdrop-blur"
                aria-label="Back to businesses"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">
                  Businesses
                </span>
              </Button>
            </Link>
          ) : (
            <span />
          )}

          <Badge
            variant={open ? "success" : "neutral"}
            size="sm"
            dot
          >
            {open ? "Open" : "Closed"}
          </Badge>
        </div>
      </div>

      <div className="px-5 pb-5 sm:px-6">
        <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 items-end gap-4">
            <Avatar
              src={logoUrl}
              name={name}
              size="xl"
              className="border-4 border-white shadow-md"
            />

            <div className="min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">
                  {name}
                </h1>

                {verified && (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600"
                    title="Verified business"
                  >
                    <CheckCircle2
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                    Verified
                  </span>
                )}
              </div>

              {productCount !== undefined && (
                <p className="mt-1 text-sm text-slate-500">
                  {productCount}{" "}
                  {productCount === 1 ? "product" : "products"}
                </p>
              )}
            </div>
          </div>

          {onChat && (
            <Button
              type="button"
              variant="primary"
              size="md"
              loading={chatting}
              disabled={chatting}
              onClick={onChat}
              className="shrink-0"
            >
              <MessageCircle className="h-4 w-4" />
              Chat
            </Button>
          )}
        </div>

        {description && (
          <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {location && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
              <MapPin
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />
              {location}
            </span>
          )}

          {phone && normalizedPhone && (
            <a
              href={`tel:${normalizedPhone}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition
