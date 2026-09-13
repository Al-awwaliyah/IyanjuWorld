import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCheck,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  UserRound,
} from "lucide-react";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { getAuthState } from "../../libs/auth";
import {
  getSafeErrorMessage,
  logAppError,
} from "../../libs/errors";
import { formatDateTime } from "../../libs/format";
import { supabase } from "../../libs/supabase";

interface Conversation {
  id: string;
  title: string;
  participantName: string;
  participantRole: string;
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

interface ConversationMember {
  conversation_id: string;
  user_id: string;
  role: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  avatar: string | null;
  role: string | null;
}

function getRoleLabel(role: string | null) {
  switch ((role ?? "").toLowerCase()) {
    case "business":
      return "Business";

    case "rider":
      return "Rider";

    case "admin":
      return "IyanjuWorld Support";

    default:
      return "Customer";
  }
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0].slice(0, 1)}${parts[
    parts.length - 1
  ].slice(0, 1)}`.toUpperCase();
}

export default function Messages() {
  const [searchParams] = useSearchParams();

  const requestedConversationId =
    searchParams.get("conversation_id") ||
    searchParams.get("conversationId") ||
    "";

  const [currentUserId, setCurrentUserId] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>(
    []
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>(
    {}
  );

  const [selectedConversationId, setSelectedConversationId] =
    useState(requestedConversationId);

  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [messageError, setMessageError] = useState("");

  const loadConversations = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const authState = await getAuthState();

        if (!authState.user) {
          setError("Please sign in to access your messages.");
          return;
        }

        const userId = authState.user.id;
        setCurrentUserId(userId);

        const { data: memberships, error: membershipError } =
          await supabase
            .from("conversation_members")
            .select("conversation_id, user_id, role")
            .eq("user_id", userId);

        if (membershipError) {
          throw membershipError;
        }

        const memberRows = (memberships ??
          []) as ConversationMember[];

        if (memberRows.length === 0) {
          setConversations([]);
          setProfiles({});
          return;
        }

        const conversationIds = [
          ...new Set(
            memberRows.map((member) => member.conversation_id)
          ),
        ];

        const { data: conversationRows, error: conversationError } =
          await supabase
            .from("conversations")
            .select("id, created_at, updated_at")
            .in("id", conversationIds)
            .order("updated_at", { ascending: false });

        if (conversationError) {
          throw conversationError;
        }

        const { data: allMembers, error: allMembersError } =
          await supabase
            .from("conversation_members")
            .select("conversation_id, user_id, role")
            .in("conversation_id", conversationIds);

        if (allMembersError) {
          throw allMembersError;
        }

        const memberRowsAll = (allMembers ??
          []) as ConversationMember[];

        const participantIds = [
          ...new Set(
            memberRowsAll
              .filter((member) => member.user_id !== userId)
              .map((member) => member.user_id)
          ),
        ];

        let profileRows: Profile[] = [];

        if (participantIds.length > 0) {
          const { data, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, avatar, role")
            .in("id", participantIds);

          if (profileError) {
            throw profileError;
          }

          profileRows = (data ?? []) as Profile[];
        }

        const profileMap: Record<string, Profile> = {};

        profileRows.forEach((profile) => {
          profileMap[profile.id] = profile;
        });

        setProfiles(profileMap);

        const { data: latestMessages, error: latestError } =
          await supabase
            .from("messages")
            .select(
              "id, conversation_id, sender_id, body, created_at, read_at"
            )
            .in("conversation_id", conversationIds)
            .order("created_at", { ascending: false });

        if (latestError) {
          throw latestError;
        }

        const messageRows = (latestMessages ?? []) as Message[];

        const latestByConversation = new Map<string, Message>();

        messageRows.forEach((message) => {
          if (!latestByConversation.has(message.conversation_id)) {
            latestByConversation.set(message.conversation_id, message);
          }
        });

        const unreadByConversation = new Map<string, number>();

        messageRows.forEach((message) => {
          if (
            message.sender_id !== userId &&
            !message.read_at
          ) {
            unreadByConversation.set(
              message.conversation_id,
              (unreadByConversation.get(message.conversation_id) ??
                0) + 1
            );
          }
        });

        const conversationList: Conversation[] = (
          conversationRows ?? []
        ).map((conversation) => {
          const conversationMembers = memberRowsAll.filter(
            (member) =>
              member.conversation_id === conversation.id &&
              member.user_id !== userId
          );

          const participant =
            conversationMembers[0]?.user_id
              ? profileMap[conversationMembers[0].user_id]
              : undefined;

          const latest = latestByConversation.get(conversation.id);

          const participantName =
            participant?.full_name?.trim() ||
            "IyanjuWorld user";

          return {
            id: conversation.id,
            title: participantName,
            participantName,
            participantRole: getRoleLabel(
              participant?.role ?? conversationMembers[0]?.role ?? null
            ),
            lastMessage:
              latest?.body ||
              "No messages yet.",
            lastMessageAt:
              latest?.created_at ||
              conversation.updated_at ||
              conversation.created_at ||
              null,
            unreadCount:
              unreadByConversation.get(conversation.id) ?? 0,
          };
        });

        setConversations(conversationList);

        if (
          requestedConversationId &&
          conversationList.some(
            (conversation) =>
              conversation.id === requestedConversationId
          )
        ) {
          setSelectedConversationId(requestedConversationId);
        } else if (
          selectedConversationId &&
          conversationList.some(
            (conversation) =>
              conversation.id === selectedConversationId
          )
        ) {
          // Keep the current conversation.
        } else if (conversationList.length > 0) {
          setSelectedConversationId(conversationList[0].id);
        } else {
          setSelectedConversationId("");
        }
      } catch (err) {
        logAppError(err, {
          action: "customer.messages.load_conversations",
        });

        setError(getSafeErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [requestedConversationId, selectedConversationId]
  );

  const loadMessages = useCallback(async () => {
    if (!selectedConversationId || !currentUserId) {
      setMessages([]);
      return;
    }

    try {
      setLoadingMessages(true);
      setMessageError("");

      const { data, error: messagesQueryError } = await supabase
        .from("messages")
        .select(
          "id, conversation_id, sender_id, body, created_at, read_at"
        )
        .eq("conversation_id", selectedConversationId)
        .order("created_at", { ascending: true });

      if (messagesQueryError) {
        throw messagesQueryError;
      }

      setMessages((data ?? []) as Message[]);

      const unreadMessageIds = (data ?? [])
        .filter(
          (message) =>
            message.sender_id !== currentUserId &&
            !message.read_at
        )
        .map((message) => message.id);

      if (unreadMessageIds.length > 0) {
        const { error: readError } = await supabase
          .from("messages")
          .update({
            read_at: new Date().toISOString(),
          })
          .in("id", unreadMessageIds);

        if (readError) {
          logAppError(readError, {
            action: "customer.messages.mark_read",
          });
        }
      }

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === selectedConversationId
            ? {
                ...conversation,
                unreadCount: 0,
              }
            : conversation
        )
      );
    } catch (err) {
      logAppError(err, {
        action: "customer.messages.load_messages",
      });

      setMessageError(getSafeErrorMessage(err));
    } finally {
      setLoadingMessages(false);
    }
  }, [currentUserId, selectedConversationId]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    const channel = supabase
      .channel(`customer-messages-${selectedConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversationId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;

          setMessages((current) => {
            if (current.some((message) => message.id === incoming.id)) {
              return current;
            }

            return [...current, incoming];
          });

          if (incoming.sender_id !== currentUserId) {
            void supabase
              .from("messages")
              .update({
                read_at: new Date().toISOString(),
              })
              .eq("id", incoming.id)
              .then(({ error: readError }) => {
                if (readError) {
                  logAppError(readError, {
                    action: "customer.messages.realtime_mark_read",
                  });
                }
              });
          }

          setConversations((current) =>
            current.map((conversation) =>
              conversation.id === selectedConversationId
                ? {
                    ...conversation,
                    lastMessage: incoming.body,
                    lastMessageAt: incoming.created_at,
                    unreadCount:
                      incoming.sender_id === currentUserId
                        ? 0
                        : 0,
                  }
                : conversation
            )
          );
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          logAppError(
            new Error("Messaging realtime channel error"),
            {
              action: "customer.messages.realtime",
            }
          );
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, selectedConversationId]);

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) =>
      [
        conversation.participantName,
        conversation.participantRole,
        conversation.lastMessage,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [conversations, search]);

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) =>
          conversation.id === selectedConversationId
      ) ?? null,
    [conversations, selectedConversationId]
  );

  const selectedParticipant = useMemo(() => {
    if (!selectedConversation) {
      return null;
    }

    const conversationMembers = conversations.length
      ? undefined
      : undefined;

    void conversationMembers;

    return selectedConversation;
  }, [selectedConversation]);

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();

    const body = messageText.trim();

    if (!body || !selectedConversationId || !currentUserId) {
      return;
    }

    try {
      setSending(true);
      setMessageError("");

      const { data, error: insertError } = await supabase
        .from("messages")
        .insert({
          conversation_id: selectedConversationId,
          sender_id: currentUserId,
          body,
        })
        .select(
          "id, conversation_id, sender_id, body, created_at, read_at"
        )
        .single();

      if (insertError) {
        throw insertError;
      }

      if (data) {
        setMessages((current) => {
          if (current.some((message) => message.id === data.id)) {
            return current;
          }

          return [...current, data as Message];
        });

        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === selectedConversationId
              ? {
                  ...conversation,
                  lastMessage: body,
                  lastMessageAt: data.created_at,
                  unreadCount: 0,
                }
              : conversation
          )
        );
      }

      setMessageText("");
    } catch (err) {
      logAppError(err, {
        action: "customer.messages.send",
      });

      setMessageError(getSafeErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin" />
          <p className="text-sm">Loading your messages...</p>
        </div>
      </div>
    );
  }

  if (error && conversations.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white">
            <MessageCircle className="h-6 w-6 text-red-600" />
          </div>

          <h1 className="mt-4 text-xl font-semibold text-slate-900">
            Messages unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            {error}
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-5"
            onClick={() => void loadConversations(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] min-h-[600px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid h-full grid-cols-1 md:grid-cols-[320px_1fr]">
        <aside
          className={`flex h-full flex-col border-r border-slate-200 ${
            selectedConversationId ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="font-semibold text-slate-900">
                  Messages
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                  Contact businesses and riders.
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void loadConversations(true)}
                disabled={refreshing}
                aria-label="Refresh conversations"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="mt-4">
              <Input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search conversations..."
                aria-label="Search conversations"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <MessageCircle className="h-6 w-6 text-slate-400" />
                </div>

                <p className="mt-4 text-sm font-medium text-slate-800">
                  {search
                    ? "No conversations found"
                    : "No conversations yet"}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {search
                    ? "Try a different search term."
                    : "Messages with businesses and riders will appear here."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() =>
                      setSelectedConversationId(
                        conversation.id
                      )
                    }
                    className={`flex w-full gap-3 p-4 text-left transition-colors hover:bg-slate-50 ${
                      selectedConversationId === conversation.id
                        ? "bg-slate-50"
                        : ""
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <UserRound className="h-5 w-5 text-slate-500" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {conversation.participantName}
                        </p>

                        {conversation.unreadCount > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[10px] font-semibold text-white">
                            {conversation.unreadCount > 9
                              ? "9+"
                              : conversation.unreadCount}
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {conversation.participantRole}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {conversation.lastMessage}
                      </p>

                      {conversation.lastMessageAt && (
                        <p className="mt-1 text-[10px] text-slate-400">
                          {formatDateTime(
                            conversation.lastMessageAt
                          )}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section
          className={`flex h-full min-w-0 flex-col ${
            selectedConversationId ? "flex" : "hidden md:flex"
          }`}
        >
          {!selectedConversationId || !selectedConversation ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <MessageCircle className="h-8 w-8 text-slate-400" />
              </div>

              <h2 className="mt-5 text-lg font-semibold text-slate-900">
                Select a conversation
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Choose a conversation from your messages to view
                and send messages.
              </p>
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() =>
                    setSelectedConversationId("")
                  }
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  <UserRound className="h-5 w-5 text-slate-500" />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-semibold text-slate-900">
                    {selectedParticipant?.participantName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedParticipant?.participantRole}
                  </p>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
                {messageError && (
                  <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {messageError}
                  </div>
                )}

                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading messages...
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                      <MessageCircle className="h-6 w-6 text-slate-400" />
                    </div>

                    <p className="mt-4 text-sm font-medium text-slate-800">
                      Start the conversation
                    </p>

                    <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                      Send a message to communicate with this
                      customer, business, or rider.
                    </p>
                  </div>
                ) : (
                  <div className="mx-auto flex max-w-3xl flex-col gap-3">
                    {messages.map((message) => {
                      const ownMessage =
                        message.sender_id === currentUserId;

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            ownMessage
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[70%] ${
                              ownMessage
                                ? "rounded-br-md bg-slate-900 text-white"
                                : "rounded-bl-md bg-white text-slate-800"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words leading-6">
                              {message.body}
                            </p>

                            <div
                              className={`mt-2 flex items-center justify-end gap-1.5 text-[10px] ${
                                ownMessage
                                  ? "text-slate-300"
                                  : "text-slate-400"
                              }`}
                            >
                              <span>
                                {formatDateTime(
                                  message.created_at
                                )}
                              </span>

                              {ownMessage && (
                                <CheckCheck className="h-3 w-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <form
                onSubmit={handleSendMessage}
                className="border-t border-slate-200 bg-white p-3 sm:p-4"
              >
                <div className="mx-auto flex max-w-3xl items-end gap-2">
                  <Input
                    value={messageText}
                    onChange={(event) =>
                      setMessageText(event.target.value)
                    }
                    placeholder="Write a message..."
                    maxLength={2000}
                    disabled={sending}
                    aria-label="Message"
                    className="min-h-11"
                  />

                  <Button
                    type="submit"
                    disabled={
                      sending ||
                      !messageText.trim() ||
                      !selectedConversationId
                    }
                    size="icon"
                    className="h-11 w-11 shrink-0"
                    aria-label="Send message"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
