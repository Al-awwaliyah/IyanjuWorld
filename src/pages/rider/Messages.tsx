import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCheck,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  UserRound,
  X,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { getCurrentProfile } from "../../libs/auth";
import { supabase } from "../../libs/supabase";
import {
  getSafeErrorMessage,
  logAppError,
} from "../../libs/errors";
import {
  formatDateTime,
  formatRelativeDate,
} from "../../libs/format";

type Conversation = {
  id: string;
  type: string | null;
  title: string | null;
  created_at: string;
  updated_at: string | null;
};

type ConversationMember = {
  conversation_id: string;
  user_id: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  avatar: string | null;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

type ConversationView = Conversation & {
  otherUser?: Profile;
  lastMessage?: Message;
  unreadCount: number;
};

function getConversationTitle(
  conversation: ConversationView
) {
  if (conversation.title?.trim()) {
    return conversation.title;
  }

  if (conversation.otherUser?.full_name?.trim()) {
    return conversation.otherUser.full_name;
  }

  return "Conversation";
}

function getRoleLabel(role: string | null | undefined) {
  switch (String(role ?? "").toLowerCase()) {
    case "customer":
      return "Customer";
    case "business":
      return "Business";
    case "admin":
      return "IyanjuWorld Support";
    default:
      return "User";
  }
}

function formatMessageTime(value: string) {
  return formatDateTime(value);
}

export default function RiderMessages() {
  const [searchParams, setSearchParams] = useSearchParams();

  const orderIdFromUrl = searchParams.get("orderId");
  const reasonFromUrl = searchParams.get("reason");

  const [profile, setProfile] = useState<Profile | null>(
    null
  );
  const [conversations, setConversations] = useState<
    ConversationView[]
  >([]);
  const [selectedConversationId, setSelectedConversationId] =
    useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedOtherUser, setSelectedOtherUser] =
    useState<Profile | null>(null);

  const [search, setSearch] = useState("");
  const [messageText, setMessageText] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] =
    useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");
  const [messageError, setMessageError] = useState("");

  const loadConversations = useCallback(
    async (showRefreshState = false) => {
      try {
        if (showRefreshState) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const currentProfile = await getCurrentProfile();

        if (!currentProfile?.id) {
          throw new Error("Your session could not be verified.");
        }

        const currentUser = currentProfile as Profile;
        setProfile(currentUser);

        const { data: memberRows, error: memberError } =
          await supabase
            .from("conversation_members")
            .select("conversation_id, user_id")
            .eq("user_id", currentUser.id);

        if (memberError) {
          throw memberError;
        }

        const memberships =
          (memberRows ?? []) as ConversationMember[];

        if (memberships.length === 0) {
          setConversations([]);
          return;
        }

        const conversationIds = [
          ...new Set(
            memberships.map(
              (membership) => membership.conversation_id
            )
          ),
        ];

        const { data: conversationRows, error: conversationError } =
          await supabase
            .from("conversations")
            .select(
              `
                id,
                type,
                title,
                created_at,
                updated_at
              `
            )
            .in("id", conversationIds)
            .order("updated_at", {
              ascending: false,
              nullsFirst: false,
            });

        if (conversationError) {
          throw conversationError;
        }

        const conversationList =
          (conversationRows ?? []) as Conversation[];

        if (conversationList.length === 0) {
          setConversations([]);
          return;
        }

        const { data: allMemberRows, error: allMembersError } =
          await supabase
            .from("conversation_members")
            .select("conversation_id, user_id")
            .in("conversation_id", conversationIds);

        if (allMembersError) {
          throw allMembersError;
        }

        const allMembers =
          (allMemberRows ?? []) as ConversationMember[];

        const otherUserIds = [
          ...new Set(
            allMembers
              .filter(
                (member) => member.user_id !== currentUser.id
              )
              .map((member) => member.user_id)
          ),
        ];

        let profiles: Profile[] = [];

        if (otherUserIds.length > 0) {
          const { data: profileRows, error: profilesError } =
            await supabase
              .from("profiles")
              .select(
                `
                  id,
                  full_name,
                  phone,
                  role,
                  avatar
                `
              )
              .in("id", otherUserIds);

          if (profilesError) {
            throw profilesError;
          }

          profiles = (profileRows ?? []) as Profile[];
        }

        const profileMap = new Map(
          profiles.map((item) => [item.id, item])
        );

        const { data: messageRows, error: messagesError } =
          await supabase
            .from("messages")
            .select(
              `
                id,
                conversation_id,
                sender_id,
                body,
                created_at,
                read_at
              `
            )
            .in("conversation_id", conversationIds)
            .order("created_at", {
              ascending: false,
            });

        if (messagesError) {
          throw messagesError;
        }

        const allMessages =
          (messageRows ?? []) as Message[];

        const enriched = conversationList.map(
          (conversation) => {
            const members = allMembers.filter(
              (member) =>
                member.conversation_id === conversation.id
            );

            const otherMember = members.find(
              (member) => member.user_id !== currentUser.id
            );

            const conversationMessages =
              allMessages.filter(
                (message) =>
                  message.conversation_id ===
                  conversation.id
              );

            const lastMessage =
              conversationMessages[0];

            const unreadCount = conversationMessages.filter(
              (message) =>
                message.sender_id !== currentUser.id &&
                !message.read_at
            ).length;

            return {
              ...conversation,
              otherUser: otherMember
                ? profileMap.get(otherMember.user_id)
                : undefined,
              lastMessage,
              unreadCount,
            };
          }
        );

        setConversations(enriched);

        /*
         * If the page was opened with an order ID, try to find an
         * existing conversation connected to that order through
         * the conversation metadata. If no such metadata exists,
         * the normal conversation list remains available.
         *
         * We intentionally do not invent a conversation schema here.
         */
        if (selectedConversationId) {
          const stillExists = enriched.some(
            (conversation) =>
              conversation.id === selectedConversationId
          );

          if (!stillExists) {
            setSelectedConversationId(null);
            setSelectedOtherUser(null);
          }
        }
      } catch (err) {
        logAppError(err, {
          operation: "rider.messages.load_conversations",
        });

        setConversations([]);
        setError(getSafeErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedConversationId]
  );

  const loadMessages = useCallback(
    async (conversationId: string) => {
      if (!conversationId || !profile?.id) {
        return;
      }

      try {
        setLoadingMessages(true);
        setMessageError("");

        const conversation = conversations.find(
          (item) => item.id === conversationId
        );

        setSelectedOtherUser(
          conversation?.otherUser ?? null
        );

        const { data, error: messagesError } =
          await supabase
            .from("messages")
            .select(
              `
                id,
                conversation_id,
                sender_id,
                body,
                created_at,
                read_at
              `
            )
            .eq("conversation_id", conversationId)
            .order("created_at", {
              ascending: true,
            });

        if (messagesError) {
          throw messagesError;
        }

        const loadedMessages = (data ?? []) as Message[];

        setMessages(loadedMessages);

        const unreadIds = loadedMessages
          .filter(
            (message) =>
              message.sender_id !== profile.id &&
              !message.read_at
          )
          .map((message) => message.id);

        if (unreadIds.length > 0) {
          const now = new Date().toISOString();

          const { error: readError } = await supabase
            .from("messages")
            .update({
              read_at: now,
            })
            .in("id", unreadIds)
            .eq("conversation_id", conversationId);

          if (readError) {
            logAppError(readError, {
              operation:
                "rider.messages.mark_read",
              conversationId,
            });
          }

          setMessages((current) =>
            current.map((message) =>
              unreadIds.includes(message.id)
                ? {
                    ...message,
                    read_at: now,
                  }
                : message
            )
          );

          setConversations((current) =>
            current.map((conversation) =>
              conversation.id === conversationId
                ? {
                    ...conversation,
                    unreadCount: 0,
                  }
                : conversation
            )
          );
        }
      } catch (err) {
        logAppError(err, {
          operation: "rider.messages.load_messages",
          conversationId,
        });

        setMessages([]);
        setMessageError(getSafeErrorMessage(err));
      } finally {
        setLoadingMessages(false);
      }
    },
    [conversations, profile]
  );

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      setSelectedOtherUser(null);
      return;
    }

    void loadMessages(selectedConversationId);
  }, [selectedConversationId, loadMessages]);

  useEffect(() => {
    if (
      !orderIdFromUrl ||
      conversations.length === 0 ||
      selectedConversationId
    ) {
      return;
    }

    /*
     * The current schema does not guarantee an order_id column
     * on conversations, so do not query an assumed column.
     *
     * Keep the order context visible in the composer so the rider
     * can select the appropriate existing conversation.
     */
  }, [
    orderIdFromUrl,
    reasonFromUrl,
    conversations.length,
    selectedConversationId,
  ]);

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    const channel = supabase
      .channel(
        `rider-messages-${selectedConversationId}`
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversationId}`,
        },
        (payload) => {
          const incoming =
            payload.new as Message;

          setMessages((current) => {
            if (
              current.some(
                (message) => message.id === incoming.id
              )
            ) {
              return current;
            }

            return [...current, incoming];
          });

          if (
            profile?.id &&
            incoming.sender_id !== profile.id
          ) {
            void supabase
              .from("messages")
              .update({
                read_at: new Date().toISOString(),
              })
              .eq("id", incoming.id)
              .is("read_at", null);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [profile?.id, selectedConversationId]);

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const title = getConversationTitle(
        conversation
      ).toLowerCase();

      const role = getRoleLabel(
        conversation.otherUser?.role
      ).toLowerCase();

      const lastMessage =
        conversation.lastMessage?.body
          ?.toLowerCase() ?? "";

      return (
        title.includes(query) ||
        role.includes(query) ||
        lastMessage.includes(query)
      );
    });
  }, [conversations, search]);

  const totalUnread = useMemo(
    () =>
      conversations.reduce(
        (sum, conversation) =>
          sum + conversation.unreadCount,
        0
      ),
    [conversations]
  );

  const sendMessage = async () => {
    if (
      !profile?.id ||
      !selectedConversationId ||
      !messageText.trim() ||
      sending
    ) {
      return;
    }

    try {
      setSending(true);
      setMessageError("");

      const body = messageText.trim();

      const { data, error: insertError } =
        await supabase
          .from("messages")
          .insert({
            conversation_id: selectedConversationId,
            sender_id: profile.id,
            body,
          })
          .select(
            `
              id,
              conversation_id,
              sender_id,
              body,
              created_at,
              read_at
            `
          )
          .single();

      if (insertError) {
        throw insertError;
      }

      if (data) {
        setMessages((current) => [
          ...current,
          data as Message,
        ]);
      }

      setMessageText("");

      /*
       * The final notification implementation will send a real
       * device push notification from the server when a message
       * is inserted. This page must not depend on a dashboard-only
       * notification.
       */
    } catch (err) {
      logAppError(err, {
        operation: "rider.messages.send",
        conversationId: selectedConversationId,
      });

      setMessageError(getSafeErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const handleComposerKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const selectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);

    if (orderIdFromUrl || reasonFromUrl) {
      setSearchParams({});
    }
  };

  const closeConversation = () => {
    setSelectedConversationId(null);
    setSelectedOtherUser(null);
    setMessages([]);
  };

  if (loading) {
    return (
      <div className="min-h-full bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-5">
            <div className="h-8 w-48 rounded bg-slate-200" />
            <div className="grid h-[650px] rounded-2xl bg-white lg:grid-cols-[320px_1fr]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/rider/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Messages
              </h1>

              {totalUnread > 0 && (
                <span className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-bold text-white">
                  {totalUnread} unread
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-slate-600">
              Communicate with customers, businesses, and IyanjuWorld support.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadConversations(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">
                Messages could not be loaded
              </p>

              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {orderIdFromUrl && !selectedConversationId && (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

              <div className="min-w-0">
                <p className="text-sm font-bold text-blue-900">
                  Delivery issue
                </p>

                <p className="mt-1 text-sm leading-6 text-blue-800">
                  Select the relevant customer or business conversation below
                  to discuss order{" "}
                  <span className="font-semibold">
                    {orderIdFromUrl.slice(0, 8)}
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid min-h-[680px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[330px_1fr]">
          <aside
            className={`border-r border-slate-200 ${
              selectedConversationId
                ? "hidden lg:block"
                : "block"
            }`}
          >
            <div className="border-b border-slate-100 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search conversations"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="max-h-[590px] overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <MessageCircle className="h-7 w-7" />
                  </div>

                  <h2 className="mt-4 text-base font-bold text-slate-900">
                    No conversations
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Your rider conversations will appear here.
                  </p>
                </div>
              ) : (
                filteredConversations.map(
                  (conversation) => {
                    const selected =
                      conversation.id ===
                      selectedConversationId;

                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() =>
                          selectConversation(
                            conversation.id
                          )
                        }
                        className={`flex w-full items-start gap-3 border-b border-slate-100 p-4 text-left transition ${
                          selected
                            ? "bg-blue-50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                          <UserRound className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {getConversationTitle(
                                conversation
                              )}
                            </p>

                            {conversation.lastMessage && (
                              <span className="shrink-0 text-[10px] text-slate-400">
                                {formatRelativeDate(
                                  conversation
                                    .lastMessage
                                    .created_at
                                )}
                              </span>
                            )}
                          </div>

                          <p className="mt-0.5 text-xs font-medium text-slate-400">
                            {getRoleLabel(
                              conversation.otherUser
                                ?.role
                            )}
                          </p>

                          <div className="mt-1 flex items-center gap-2">
                            <p className="min-w-0 flex-1 truncate text-xs text-slate-500">
                              {conversation.lastMessage
                                ?.body ||
                                "No messages yet"}
                            </p>

                            {conversation.unreadCount >
                              0 && (
                              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  }
                )
              )}
            </div>
          </aside>

          <section
            className={`flex min-h-[680px] flex-col ${
              selectedConversationId
                ? "block"
                : "hidden lg:flex"
            }`}
          >
            {!selectedConversationId ? (
              <div className="flex flex-1 items-center justify-center p-8 text-center">
                <div>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                    <MessageCircle className="h-8 w-8" />
                  </div>

                  <h2 className="mt-5 text-xl font-bold text-slate-900">
                    Select a conversation
                  </h2>

                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    Choose a customer, business, or support conversation to
                    start messaging.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <header className="flex items-center gap-3 border-b border-slate-100 p-4">
                  <button
                    type="button"
                    onClick={closeConversation}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                    <UserRound className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {selectedOtherUser?.full_name ||
                        "Conversation"}
                    </p>

                    <p className="text-xs text-slate-500">
                      {getRoleLabel(
                        selectedOtherUser?.role
                      )}
                    </p>
                  </div>

                  {selectedOtherUser?.phone && (
                    <a
                      href={`tel:${selectedOtherUser.phone}`}
                      className="hidden rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:block"
                    >
                      Call
                    </a>
                  )}
                </header>

                {messageError && (
                  <div className="mx-4 mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{messageError}</p>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
                  {loadingMessages ? (
                    <div className="flex h-full items-center justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-center">
                      <div>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                          <MessageCircle className="h-6 w-6" />
                        </div>

                        <p className="mt-4 text-sm font-semibold text-slate-700">
                          No messages yet
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Send a message to start the conversation.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message) => {
                        const own =
                          message.sender_id ===
                          profile?.id;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${
                              own
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[70%] ${
                                own
                                  ? "rounded-br-md bg-blue-700 text-white"
                                  : "rounded-bl-md border border-slate-200 bg-white text-slate-900"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words text-sm leading-6">
                                {message.body}
                              </p>

                              <div
                                className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${
                                  own
                                    ? "text-blue-100"
                                    : "text-slate-400"
                                }`}
                              >
                                <span>
                                  {formatMessageTime(
                                    message.created_at
                                  )}
                                </span>

                                {own &&
                                  (message.read_at ? (
                                    <CheckCheck className="h-3.5 w-3.5" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5" />
                                  ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 bg-white p-4">
                  <div className="flex items-end gap-3">
                    <textarea
                      value={messageText}
                      onChange={(event) =>
                        setMessageText(
                          event.target.value
                        )
                      }
                      onKeyDown={handleComposerKeyDown}
                      rows={2}
                      placeholder="Type a message..."
                      className="min-h-[52px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                    />

                    <button
                      type="button"
                      onClick={() => void sendMessage()}
                      disabled={
                        sending ||
                        !messageText.trim()
                      }
                      className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Send message"
                    >
                      {sending ? (
                        <RefreshCw className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  <p className="mt-2 text-[11px] text-slate-400">
                    Press Enter to send. Use Shift + Enter for a new line.
                  </p>
                </div>
              </>
            )}
          </section>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

            <div>
              <p className="text-sm font-bold text-slate-900">
                Rider communication
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Messages are part of the delivery communication system. New
                messages will later trigger true device push notifications
                through the platform notification service, so users do not
                need to keep the dashboard open to receive them.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
