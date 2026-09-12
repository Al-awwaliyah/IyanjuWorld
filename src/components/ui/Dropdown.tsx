import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  className?: string;
}

export default function Dropdown({
  trigger,
  items,
  align = "right",
  className = "",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) {
      return;
    }

    item.onClick();
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="focus:outline-none"
      >
        {trigger}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-40 mt-2 min-w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg ${
            align === "left" ? "left-0" : "right-0"
          }`}
        >
          {items.map((item, index) => (
            <button
              key={`${item.label}-${index}`}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => handleItemClick(item)}
              className={[
                "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm",
                "transition-colors",
                item.danger
                  ? "text-red-600 hover:bg-red-50"
                  : "text-slate-700 hover:bg-slate-50",
                item.disabled
                  ? "cursor-not-allowed opacity-50"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {item.icon && (
                <span className="flex shrink-0 items-center">
                  {item.icon}
                </span>
              )}

              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
