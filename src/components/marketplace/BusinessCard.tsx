import { Link } from "react-router-dom";
import { MapPin, Store } from "lucide-react";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";

export interface BusinessCardProps {
  id?: string;
  business?: BusinessCardProps;
  name?: string;
  slug?: string;
  description?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  city?: string | null;
  state?: string | null;
  verified?: boolean;
  open?: boolean;
  productCount?: number;
  className?: string;
}

export default function BusinessCard(props: BusinessCardProps) {
  const source = props.business ?? props;
  const {
    business: _business,
    name,
    slug,
    description,
    logoUrl,
    coverUrl,
    city,
    state,
    verified = false,
    open = true,
    productCount,
    className = "",
  } = source;
  const safeName = name ?? "Business";
  const safeSlug = slug ?? source.id ?? "";
  const location = [city, state]
    .filter(Boolean)
    .join(", ");

  return (
    <article
      className={[
        "group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Link
        to={`/businesses/${safeSlug}`}
        className="block"
        aria-label={`View ${safeName}`}
      >
        <div className="relative h-32 overflow-hidden bg-slate-100">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-100 text-slate-300">
              <Store
                className="h-10 w-10"
                aria-hidden="true"
              />
            </div>
          )}

          <div className="absolute right-3 top-3">
            <Badge
              variant={open ? "success" : "neutral"}
              size="sm"
              dot
            >
              {open ? "Open" : "Closed"}
            </Badge>
          </div>
        </div>

        <div className="relative px-4 pb-4">
          <div className="-mt-8 flex items-end justify-between">
            <Avatar
              src={logoUrl}
              name={safeName}
              size="lg"
              className="border-4 border-white shadow-sm"
            />

            {verified && (
              <Badge
                variant="info"
                size="sm"
                className="bg-brand-50 text-brand-700"
              >
                Verified
              </Badge>
            )}
          </div>

          <div className="mt-3">
            <h3 className="truncate text-base font-semibold text-slate-900">
              {name}
            </h3>

            {description && (
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
                {description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
              {location && (
                <span className="inline-flex min-w-0 items-center gap-1">
                  <MapPin
                    className="h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="truncate">
                    {location}
                  </span>
                </span>
              )}

              {productCount !== undefined && (
                <span>
                  {productCount}{" "}
                  {productCount === 1 ? "product" : "products"}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
