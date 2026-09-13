import {
  MessageSquare,
  Search,
} from "lucide-react";
import ConversationItem, {
  type ConversationItemProps,
} from "./ConversationItem";
import Input from "../ui/Input";
import Spinner from "../ui/Spinner";
import EmptyState from "../ui/EmptyState";

export interface ConversationListProps {
  conversations: ConversationItemProps[];
  loading?: boolean;
  selectedConversationId?: string | null;
  searchValue?: string;
  onSearchChange?: (
    value: string,
  ) => void;
  onConversationSelect?: (
    id: string,
  ) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export default function ConversationList({
  conversations,
  loading = false,
  selectedConversationId = null,
  searchValue = "",
  onSearchChange,
  onConversationSelect,
  emptyTitle = "No conversations yet",
  emptyDescription = "Your messages and conversations will appear here.",
  className = "",
}: ConversationListProps) {
  const normalizedSearch =
    searchValue.trim().toLowerCase();

  const filteredConversations =
    normalizedSearch
      ? conversations.filter(
          (conversation) =>
            conversation.title
              .toLowerCase()
              .includes(normalizedSearch) ||
            conversation.subtitle
              ?.toLowerCase()
              .includes(normalizedSearch) ||
            conversation.lastMessage
              ?.toLowerCase()
              .includes(normalizedSearch),
        )
      : conversations;

  return (
    <aside
      className={[
        "flex min-h-0 flex-col rounded-2xl border border-slate-200 bg-white",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="border-b border-slate-100 p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <MessageSquare
              className="h-5 w-5"
              aria-hidden="true"
            />
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Messages
            </h2>

            <p className="text-xs text-slate-400">
              {conversations.length}{" "}
              {conversations.length === 1
                ? "conversation"
                : "conversations"}
            </p>
          </div>
        </div>

        {onSearchChange && (
          <Input
            type="search"
            placeholder="Search conversations..."
            value={searchValue}
            onChange={(event) =>
              onSearchChange(
                event.target.value,
              )
            }
            leftIcon={
              <Search
                className="h-4 w-4"
                aria-hidden="true"
              />
            }
          />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex min-h-56 items-center justify-center">
            <Spinner
              size="lg"
              label="Loading conversations"
            />
          </div>
        ) : filteredConversations.length ===
          0 ? (
          <EmptyState
            icon={MessageSquare}
            title={
              normalizedSearch
                ? "No matching conversations"
                : emptyTitle
            }
            description={
              normalizedSearch
                ? "Try a different search term."
                : emptyDescription
            }
            className="border-0 bg-transparent px-4 py-12"
          />
        ) : (
          <div className="space-y-1">
            {filteredConversations.map(
              (conversation) => (
                <ConversationItem
                  key={conversation.id}
                  {...conversation}
                  selected={
                    selectedConversationId ===
                    conversation.id
                  }
                  onClick={
                    onConversationSelect
                  }
                />
              ),
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
