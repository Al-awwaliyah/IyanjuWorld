import {
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";
import Button from "../ui/Button";

export interface BusinessContactActionsProps {
  phone?: string | null;
  whatsapp?: string | null;
  onChat?: () => void;
  chatting?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function BusinessContactActions({
  phone,
  whatsapp,
  onChat,
  chatting = false,
  disabled = false,
  className = "",
}: BusinessContactActionsProps) {
  const normalizedPhone = phone
    ? phone.replace(/[^\d+]/g, "")
    : "";

  const normalizedWhatsApp = whatsapp
    ? whatsapp.replace(/[^\d]/g, "")
    : "";

  const hasPhone = Boolean(phone && normalizedPhone);
  const hasWhatsApp = Boolean(
    whatsapp && normalizedWhatsApp,
  );
  const hasChat = Boolean(onChat);

  if (!hasPhone && !hasWhatsApp && !hasChat) {
    return null;
  }

  return (
    <div
      className={[
        "flex flex-col gap-2 sm:flex-row sm:flex-wrap",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {hasPhone && (
        <a
          href={`tel:${normalizedPhone}`}
          className="sm:flex-1"
        >
          <Button
            type="button"
            variant="outline"
            size="md"
            className="w-full"
            disabled={disabled}
          >
            <Phone className="h-4 w-4" />
            Call
          </Button>
        </a>
      )}

      {hasWhatsApp && (
        <a
          href={`https://wa.me/${normalizedWhatsApp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="sm:flex-1"
        >
          <Button
            type="button"
            variant="outline"
            size="md"
            className="w-full"
            disabled={disabled}
          >
            <Send className="h-4 w-4" />
            WhatsApp
          </Button>
        </a>
      )}

      {hasChat && (
        <Button
          type="button"
          variant="primary"
          size="md"
          loading={chatting}
          disabled={disabled || chatting}
          onClick={onChat}
          className="sm:flex-1"
        >
          <MessageCircle className="h-4 w-4" />
          Chat
        </Button>
      )}
    </div>
  );
}
