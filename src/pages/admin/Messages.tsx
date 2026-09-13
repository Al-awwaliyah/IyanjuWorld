import { useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  MessageSquare,
  MoreVertical,
  Search,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import PageContainer from "../../components/layout/PageContainer";
import AdminFilters from "../../components/admin/AdminFilters";
import AdminTable, {
  type AdminTableColumn,
  type AdminTableRowAction,
} from "../../components/admin/AdminTable";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Textarea from "../../components/ui/Textarea";

type ConversationType =
  | "customer_business"
  | "customer_rider"
  | "business_rider"
  | "business_admin";

type ConversationStatus =
  | "active"
  | "archived"
  | "blocked";

type Conversation = {
  id: string;
  reference: string;
  type: ConversationType;
  customerName: string | null;
  businessName: string | null;
  riderName: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  status: ConversationStatus;
  orderReference: string | null;
  createdAt: string;
};

type Message = {
  id: string;
  conversationId: string;
  senderName: string;
  senderRole: "customer" | "business" | "rider" | "admin";
  content: string;
  sentAt: string;
  read: boolean;
};

const initialConversations: Conversation[] = [
  {
    id: "conversation-001",
    reference: "CONV-001",
    type: "customer_business",
    customerName: "Amina Yusuf",
    businessName: "Amina Fashion Hub",
    riderName: null,
    lastMessage:
      "Please confirm if the blue version is still available.",
    lastMessageAt: "2026-09-12T10:25:00.000Z",
    unreadCount: 2,
    status: "active",
    orderReference: "ORD-AX1024",
    createdAt: "2026-09-11T08:15:00.000Z",
  },
  {
    id: "conversation-002",
    reference: "CONV-002",
    type: "customer_rider",
    customerName: "David Adeyemi",
    businessName: "Fresh Basket Market",
    riderName: "Ibrahim Musa",
    lastMessage:
      "I am about five minutes away from your location.",
    lastMessageAt: "2026-09-12T11:10:00.000Z",
    unreadCount: 1,
    status: "active",
    orderReference: "ORD-BX2048",
    createdAt: "2026-09-12T09:30:00.000Z",
  },
  {
    id: "conversation-003",
    reference: "CONV-003",
    type: "business_rider",
    customerName: null,
    businessName: "Urban Tech Store",
    riderName: "Mubarak Ali",
    lastMessage:
      "The package is ready for pickup.",
    lastMessageAt: "2026-09-12T12:40:00.000Z",
    unreadCount: 0,
    status: "active",
    orderReference: "ORD-CX3091",
    createdAt: "2026-09-12T10:05:00.000Z",
  },
  {
    id: "conversation-004",
    reference: "CONV-004",
    type: "business_admin",
    customerName: null,
    businessName: "Home Essentials NG",
    riderName: null,
    lastMessage:
      "We have uploaded the requested verification document.",
    lastMessageAt: "2026-09-11T16:20:00.000Z",
    unreadCount: 0,
    status: "active",
    orderReference: null,
    createdAt: "2026-09-10T14:00:00.000Z",
  },
  {
    id: "conversation-005",
    reference: "CONV-005",
    type: "customer_business",
    customerName: "Sarah Okafor",
    businessName: "Glow Beauty Store",
    riderName: null,
    lastMessage:
      "Thank you for resolving the issue.",
    lastMessageAt: "2026-09-08T15:30:00.000Z",
    unreadCount: 0,
    status: "archived",
    orderReference: "ORD-EX5098",
    createdAt: "2026-09-07T09:10:00.000Z",
  },
];

const initialMessages: Message[] = [
  {
    id: "message-001",
    conversationId: "conversation-001",
    senderName: "Amina Yusuf",
    senderRole: "customer",
    content:
      "Hello, is the blue version of this product still available?",
    sentAt: "2026-09-12T10:20:00.000Z",
    read: true,
  },
  {
    id: "message-002",
    conversationId: "conversation-001",
    senderName: "Amina Fashion Hub",
    senderRole: "business",
    content:
      "Yes, we currently have the blue version in stock.",
    sentAt: "2026-09-12T10:22:00.000Z",
    read: true,
  },
  {
    id: "message-003",
    conversationId: "conversation-001",
    senderName: "Amina Yusuf",
    senderRole: "customer",
    content:
      "Please confirm if the blue version is still available.",
    sentAt: "2026-09-12T10:25:00.000Z",
    read: false,
  },
  {
    id: "message-004",
    conversationId: "conversation-002",
    senderName: "David Adeyemi",
    senderRole: "customer",
    content:
      "Can you let me know when you are close?",
    sentAt: "2026-09-12T11:08:00.000Z",
    read: true,
  },
  {
    id: "message-005",
    conversationId: "conversation-002",
    senderName: "Ibrahim Musa",
    senderRole: "rider",
    content:
      "I am about five minutes away from your location.",
    sentAt: "2026-09-12T11:10:00.000Z",
    read: false,
  },
  {
    id: "message-006",
    conversationId: "conversation-003",
    senderName: "Urban Tech Store",
    senderRole: "business",
    content:
      "The package is ready for pickup.",
    sentAt: "2026-09-12T12:35:00.000Z",
    read: true,
  },
  {
    id: "message-007",
    conversationId: "conversation-003",
    senderName: "Mubarak Ali",
    senderRole: "rider",
    content:
      "The package is ready for pickup.",
    sentAt: "2026-09-12T12:40:00.000Z",
    read: true,
  },
  {
    id: "message-008",
    conversationId: "conversation-004",
    senderName: "Home Essentials NG",
    senderRole: "business",
    content:
      "We have uploaded the requested verification document.",
    sentAt: "2026-09-11T16:20:00.000Z",
    read: true,
  },
  {
    id: "message-009",
    conversationId: "conversation-005",
    senderName: "Sarah Okafor",
    senderRole: "customer",
    content:
      "Thank you for resolving the issue.",
    sentAt: "2026-09-08T15:30:00.000Z",
    read: true,
  },
];

const typeOptions = [
  { value: "", label: "All conversation types" },
  {
    value: "customer_business",
    label: "Customer ↔ Business",
  },
  {
    value: "customer_rider",
    label: "Customer ↔ Rider",
  },
  {
    value: "business_rider",
    label: "Business ↔ Rider",
  },
  {
    value: "business_admin",
    label: "Business ↔ Admin",
  },
];

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "blocked", label: "Blocked" },
];

const typeLabels: Record<
  ConversationType,
  string
> = {
  customer_business: "Customer ↔ Business",
  customer_rider: "Customer ↔ Rider",
  business_rider: "Business ↔ Rider",
  business_admin: "Business ↔ Admin",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function roleLabel(
  role: Message["senderRole"],
) {
  switch (role) {
    case "customer":
      return "Customer";
    case "business":
      return "Business";
    case "rider":
      return "Rider";
    case "admin":
      return "Admin";
    default:
      return role;
  }
}

function roleBadgeVariant(
  role: Message["senderRole"],
) {
  switch (role) {
    case "admin":
      return "info" as const;
    case "business":
      return "success" as const;
    case "rider":
      return "warning" as const;
    default:
      return "default" as const;
  }
}

export default function Messages() {
  const [conversations, setConversations] =
    useState<Conversation[]>(
      initialConversations,
    );

  const [messages, setMessages] =
    useState<Message[]>(initialMessages);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  const [selectedConversationId, setSelectedConversationId] =
    useState<string | null>(null);

  const [messageText, setMessageText] = useState("");

  const selectedConversation =
    conversations.find(
      (conversation) =>
        conversation.id === selectedConversationId,
    ) || null;

  const selectedMessages = useMemo(() => {
    if (!selectedConversationId) {
      return [];
    }

    return messages.filter(
      (message) =>
        message.conversationId ===
        selectedConversationId,
    );
  }, [messages, selectedConversationId]);

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return conversations.filter((conversation) => {
      const participants = [
        conversation.customerName,
        conversation.businessName,
        conversation.riderName,
        conversation.reference,
        conversation.orderReference,
        conversation.lastMessage,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || participants.includes(query);

      const matchesType =
        !type || conversation.type === type;

      const matchesStatus =
        !status || conversation.status === status;

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus
      );
    });
  }, [
    conversations,
    search,
    type,
    status,
  ]);

  const selectConversation = (
    conversation: Conversation,
  ) => {
    setSelectedConversationId(conversation.id);

    setConversations((current) =>
      current.map((item) =>
        item.id === conversation.id
          ? {
              ...item,
              unreadCount: 0,
            }
          : item,
      ),
    );

    setMessages((current) =>
      current.map((message) =>
        message.conversationId ===
          conversation.id
          ? {
              ...message,
              read: true,
            }
          : message,
      ),
    );
  };

  const archiveConversation = (
    conversationId: string,
  ) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              status: "archived",
            }
          : conversation,
      ),
    );

    if (
      selectedConversationId === conversationId
    ) {
      setSelectedConversationId(null);
    }
  };

  const activateConversation = (
    conversationId: string,
  ) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              status: "active",
            }
          : conversation,
      ),
    );
  };

  const blockConversation = (
    conversationId: string,
  ) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              status: "blocked",
            }
          : conversation,
      ),
    );

    if (
      selectedConversationId === conversationId
    ) {
      setSelectedConversationId(null);
    }
  };

  const sendAdminMessage = () => {
    if (
      !selectedConversation ||
      !messageText.trim() ||
      selectedConversation.status === "blocked"
    ) {
      return;
    }

    const now = new Date().toISOString();

    const newMessage: Message = {
      id: `message-${Date.now()}`,
      conversationId:
        selectedConversation.id,
      senderName: "Admin",
      senderRole: "admin",
      content: messageText.trim(),
      sentAt: now,
      read: true,
    };

    setMessages((current) => [
      ...current,
      newMessage,
    ]);

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id ===
        selectedConversation.id
          ? {
              ...conversation,
              lastMessage: newMessage.content,
              lastMessageAt: now,
            }
          : conversation,
      ),
    );

    setMessageText("");
  };

  const columns: AdminTableColumn<Conversation>[] = [
    {
      id: "conversation",
      header: "Conversation",
      accessor: "reference",
      sortable: true,
      render: (_, conversation) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <MessageSquare className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="font-medium text-slate-900">
              {conversation.reference}
            </div>

            <div className="mt-1 truncate text-xs text-slate-500">
              {typeLabels[conversation.type]}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "participants",
      header: "Participants",
      accessor: "customerName",
      render: (_, conversation) => (
        <div className="min-w-0 text-sm">
          {conversation.customerName && (
            <div className="truncate text-slate-800">
              {conversation.customerName}
            </div>
          )}

          {conversation.businessName && (
            <div className="truncate text-xs text-slate-500">
              {conversation.businessName}
            </div>
          )}

          {conversation.riderName && (
            <div className="truncate text-xs text-slate-500">
              {conversation.riderName}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "order",
      header: "Order",
      accessor: "orderReference",
      sortable: true,
      render: (value) => (
        <span className="text-sm text-slate-700">
          {value || "—"}
        </span>
      ),
    },
    {
      id: "lastMessage",
      header: "Last message",
      accessor: "lastMessage",
      render: (value, conversation) => (
        <div className="max-w-xs">
          <div className="truncate text-sm text-slate-700">
            {value}
          </div>

          <div className="mt-1 text-xs text-slate-400">
            {formatShortDate(
              conversation.lastMessageAt,
            )}
          </div>
        </div>
      ),
    },
    {
      id: "unread",
      header: "Unread",
      accessor: "unreadCount",
      sortable: true,
      align: "center",
      render: (value) =>
        value > 0 ? (
          <Badge variant="danger">
            {value}
          </Badge>
        ) : (
          <span className="text-sm text-slate-400">
            —
          </span>
        ),
    },
    {
      id: "status",
      header: "Status",
      accessor: "status",
      sortable: true,
      render: (value) => (
        <Badge
          variant={
            value === "active"
              ? "success"
              : value === "blocked"
                ? "danger"
                : "default"
          }
        >
          {value === "active"
            ? "Active"
            : value === "blocked"
              ? "Blocked"
              : "Archived"}
        </Badge>
      ),
    },
  ];

  const getRowActions = (
    conversation: Conversation,
  ): AdminTableRowAction[] => {
    const actions: AdminTableRowAction[] = [
      {
        id: "view",
        label: "Open conversation",
        icon: EyeIcon,
        onClick: () =>
          selectConversation(conversation),
      },
    ];

    if (conversation.status === "active") {
      actions.push(
        {
          id: "archive",
          label: "Archive conversation",
          icon: Archive,
          onClick: () =>
            archiveConversation(
              conversation.id,
            ),
        },
        {
          id: "block",
          label: "Block conversation",
          icon: ShieldAlert,
          danger: true,
          onClick: () =>
            blockConversation(
              conversation.id,
            ),
        },
      );
    } else if (
      conversation.status === "archived"
    ) {
      actions.push({
        id: "activate",
        label: "Restore conversation",
        icon: CheckCircle2,
        onClick: () =>
          activateConversation(
            conversation.id,
          ),
      });
    } else {
      actions.push({
        id: "activate",
        label: "Unblock conversation",
        icon: CheckCircle2,
        onClick: () =>
          activateConversation(
            conversation.id,
          ),
      });
    }

    return actions;
  };

  const totalUnread = conversations.reduce(
    (total, conversation) =>
      total + conversation.unreadCount,
    0,
  );

  const activeCount = conversations.filter(
    (conversation) =>
      conversation.status === "active",
  ).length;

  const archivedCount = conversations.filter(
    (conversation) =>
      conversation.status === "archived",
  ).length;

  const blockedCount = conversations.filter(
    (conversation) =>
      conversation.status === "blocked",
  ).length;

  return (
    <PageContainer
      title="Messages"
      description="Monitor platform conversations and communicate with users when administrative support is required."
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Message Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review conversations between customers, businesses,
            riders, and administrators.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-slate-500" />

              <div>
                <p className="text-sm text-slate-500">
                  Total conversations
                </p>

                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {conversations.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <Clock3 className="h-5 w-5 text-blue-600" />

              <div>
                <p className="text-sm text-slate-500">
                  Active
                </p>

                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {activeCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <UserRound className="h-5 w-5 text-amber-600" />

              <div>
                <p className="text-sm text-slate-500">
                  Unread messages
                </p>

                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {totalUnread}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <Archive className="h-5 w-5 text-slate-500" />

              <div>
                <p className="text-sm text-slate-500">
                  Archived / blocked
                </p>

                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {archivedCount + blockedCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        <AdminFilters>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search conversations..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <select
            value={type}
            onChange={(event) =>
              setType(event.target.value)
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            aria-label="Filter conversations by type"
          >
            {typeOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            aria-label="Filter conversations by status"
          >
            {statusOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setType("");
              setStatus("");
            }}
          >
            Clear filters
          </Button>
        </AdminFilters>

        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

            <div>
              <p className="font-medium text-blue-900">
                Messaging architecture
              </p>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                Customer, business, rider, and admin conversations
                use the shared conversations, conversation_members,
                messages, and attachments architecture. The
                dashboard is an interface to those conversations,
                not a separate messaging system.
              </p>
            </div>
          </div>
        </div>

        <div className="grid min-h-[560px] grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.5fr)]">
          <div
            className={
              selectedConversation
                ? "hidden border-r border-slate-200 lg:block"
                : "block border-r border-slate-200"
            }
          >
            <div className="border-b border-slate-100 px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Conversations
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {filteredConversations.length} result
                    {filteredConversations.length === 1
                      ? ""
                      : "s"}
                  </p>
                </div>

                <MessageSquare className="h-5 w-5 text-slate-400" />
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title="No conversations found"
                    description="No conversations match the current filters."
                  />
                </div>
              ) : (
                filteredConversations.map(
                  (conversation) => {
                    const isSelected =
                      selectedConversationId ===
                      conversation.id;

                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() =>
                          selectConversation(
                            conversation,
                          )
                        }
                        className={`w-full border-b border-slate-100 px-4 py-4 text-left transition ${
                          isSelected
                            ? "bg-slate-50"
                            : "bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                            <MessageSquare className="h-5 w-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {conversation.reference}
                                </p>

                                <p className="mt-1 truncate text-xs text-slate-500">
                                  {typeLabels[
                                    conversation.type
                                  ]}
                                </p>
                              </div>

                              {conversation.unreadCount >
                                0 && (
                                <Badge variant="danger">
                                  {
                                    conversation.unreadCount
                                  }
                                </Badge>
                              )}
                            </div>

                            <p className="mt-2 truncate text-sm text-slate-700">
                              {conversation.lastMessage}
                            </p>

                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className="truncate text-xs text-slate-400">
                                {conversation.customerName ||
                                  conversation.businessName ||
                                  conversation.riderName ||
                                  "Conversation"}
                              </span>

                              <span className="whitespace-nowrap text-xs text-slate-400">
                                {formatShortDate(
                                  conversation.lastMessageAt,
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  },
                )
              )}
            </div>
          </div>

          <div
            className={
              selectedConversation
                ? "block"
                : "hidden lg:flex"
            }
          >
            {!selectedConversation ? (
              <div className="flex flex-1 items-center justify-center p-8">
                <div className="max-w-sm text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <MessageSquare className="h-7 w-7" />
                  </div>

                  <h2 className="mt-4 text-lg font-semibold text-slate-900">
                    Select a conversation
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Select a conversation from the list to review
                    messages and respond when administrative
                    support is required.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[560px] flex-col">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedConversationId(
                          null,
                        )
                      }
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
                      aria-label="Back to conversations"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      <MessageSquare className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-slate-900">
                        {selectedConversation.reference}
                      </h2>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {
                          typeLabels[
                            selectedConversation.type
                          ]
                        }
                        {selectedConversation.orderReference
                          ? ` • ${selectedConversation.orderReference}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        selectedConversation.status ===
                        "active"
                          ? "success"
                          : selectedConversation.status ===
                              "blocked"
                            ? "danger"
                            : "default"
                      }
                    >
                      {selectedConversation.status ===
                      "active"
                        ? "Active"
                        : selectedConversation.status ===
                            "blocked"
                          ? "Blocked"
                          : "Archived"}
                    </Badge>

                    <button
                      type="button"
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                      aria-label="Conversation actions"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">
                  <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white px-4 py-3 text-center">
                    <p className="text-xs text-slate-500">
                      Conversation started{" "}
                      {formatDate(
                        selectedConversation.createdAt,
                      )}
                    </p>
                  </div>

                  {selectedMessages.map(
                    (message) => {
                      const isAdmin =
                        message.senderRole ===
                        "admin";

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isAdmin
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[70%] ${
                              isAdmin
                                ? "items-end"
                                : "items-start"
                            }`}
                          >
                            <div className="mb-1 flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-700">
                                {message.senderName}
                              </span>

                              <Badge
                                variant={roleBadgeVariant(
                                  message.senderRole,
                                )}
                              >
                                {roleLabel(
                                  message.senderRole,
                                )}
                              </Badge>
                            </div>

                            <div
                              className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                                isAdmin
                                  ? "rounded-br-md bg-slate-900 text-white"
                                  : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
                              }`}
                            >
                              {message.content}
                            </div>

                            <div
                              className={`mt-1 text-[11px] text-slate-400 ${
                                isAdmin
                                  ? "text-right"
                                  : "text-left"
                              }`}
                            >
                              {formatDate(
                                message.sentAt,
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>

                <div className="border-t border-slate-100 bg-white p-4">
                  {selectedConversation.status ===
                  "blocked" ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                      This conversation is blocked. Restore the
                      conversation before sending a message.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Textarea
                        value={messageText}
                        onChange={(event) =>
                          setMessageText(
                            event.target.value,
                          )
                        }
                        placeholder="Write an administrative message..."
                        rows={3}
                      />

                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-slate-400">
                          Admin messages are recorded in the
                          conversation history.
                        </p>

                        <Button
                          variant="primary"
                          disabled={
                            !messageText.trim()
                          }
                          onClick={
                            sendAdminMessage
                          }
                        >
                          Send message
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <AdminTable
          columns={columns}
          data={filteredConversations}
          rowKey={(conversation) =>
            conversation.id
          }
          getRowActions={getRowActions}
          emptyTitle="No conversations found"
          emptyDescription="No conversations match the current search or filters."
          pagination
          pageSize={10}
          stickyHeader
          striped
        />
      </div>
    </PageContainer>
  );
}

function EyeIcon(
  props: React.ComponentProps<typeof Eye>,
) {
  return <Eye {...props} />;
}
