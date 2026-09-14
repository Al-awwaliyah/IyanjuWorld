

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  ChevronRight,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  UserRound,
  XCircle,
} from "lucide-react";
import { supabase } from "../../libs/supabase";
import { getCurrentProfile, type Profile } from "../../libs/auth";
import {
  getSafeErrorMessage,
  logAppError,
} from "../../libs/errors";
import { formatRelativeDate } from "../../libs/format";

type Business = {
  id: string;
  name: string;
  owner_id: string;
};

type Conversation = {
  id: string;
  type: string;
  subject: string | null;
  created_at: string;
  updated_at: string;
};

type ConversationMember = {
  conversation_id: string;
  user_id: string;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
  read_at: string | null;
};

type Contact = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

type ConversationRow = Conversation & {
  contact: Contact | null;
  lastMessage: Message | null;
  unreadCount: number;
};

function getConversationLabel(type: string) {
  const normalized = type.toLowerCase();

  if (normalized.includes("customer")) {
    return "Customer";
  }

  if (normalized.includes("rider")) {
    return "Rider";
  }

  if (normalized.includes("admin")) {
    return "Admin";
  }

  return "Conversation";
}

export default function BusinessMessages() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [conversations, setConversations] = useState<
    ConversationRow[]
  >([]);

  const [selectedConversationId, setSelectedConversationId] =
    useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] =
    useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadConversations();
  }, []);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    void loadMessages(selectedConversationId);
  }, [selectedConversationId]);

  async function loadConversations() {
    setLoading(true);
    setError("");

    try {
      const currentProfile = await getCurrentProfile();

      if (!currentProfile) {
        throw new Error("Unable to load your account.");
      }

      setProfile(currentProfile);

      const { data: businessData, error: businessError } =
        await supabase
          .from("businesses")
          .select("id, name, owner_id")
          .eq("owner_id", currentProfile.id)
          .maybeSingle();

      if (businessError) {
        throw businessError;
      }

      if (!businessData) {
        throw new Error(
          "Your business profile could not be found.",
        );
      }

      setBusiness(businessData as Business);

      const { data: memberData, error: memberError } =
        await supabase
          .from("conversation_members")
          .select("conversation_id, user_id")
          .eq("user_id", currentProfile.id);

      if (memberError) {
        throw memberError;
      }

      const members = (memberData ??
        []) as ConversationMember[];

      const conversationIds = [
        ...new Set(
          members
            .map((member) => member.conversation_id)
            .filter(Boolean),
        ),
      ];

      if (conversationIds.length === 0) {
        setConversations([]);
        setSelectedConversationId(null);
        return;
      }

      const { data: conversationData, error: conversationError } =
        await supabase
          .from("conversations")
          .select(
            "id, type, subject, created_at, updated_at",
          )
          .in("id", conversationIds)
          .order("updated_at", { ascending: false });

      if (conversationError) {
        throw conversationError;
      }

      const conversationRows =
        (conversationData ?? []) as Conversation[];

      if (conversationRows.length === 0) {
        setConversations([]);
        setSelectedConversationId(null);
        return;
      }

      const { data: allMemberData, error: allMemberError } =
        await supabase
          .from("conversation_members")
          .select("conversation_id, user_id")
          .in("conversation_id", conversationIds);

      if (allMemberError) {
        throw allMemberError;
      }

      const allMembers = (allMemberData ??
        []) as ConversationMember[];

      const contactIds = [
        ...new Set(
          allMembers
            .filter(
              (member) => member.user_id !== currentProfile.id,
            )
            .map((member) => member.user_id)
            .filter(Boolean),
        ),
      ];

      let contacts: Contact[] = [];

      if (contactIds.length > 0) {
        const { data: contactData, error: contactError } =
          await supabase
            .from("profiles")
            .select("id, full_name, email, phone")
            .in("id", contactIds);

        if (contactError) {
          throw contactError;
        }

        contacts = (contactData ?? []) as Contact[];
      }

      const contactMap = new Map(
        contacts.map((contact) => [contact.id, contact]),
      );

      const membersByConversation = new Map<
        string,
        ConversationMember[]
      >();

      for (const member of allMembers) {
        const existing =
          membersByConversation.get(
            member.conversation_id,
          ) ?? [];

        existing.push(member);
        membersByConversation.set(
          member.conversation_id,
          existing,
        );
      }

      const { data: messageData, error: messageError } =
        await supabase
          .from("messages")
          .select(
            "id, conversation_id, sender_id, body, created_at, read_at",
          )
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false });

      if (messageError) {
        throw messageError;
      }

      const allMessages = (messageData ?? []) as Message[];

      const lastMessageMap = new Map<string, Message>();
      const unreadMap = new Map<string, number>();

      for (const message of allMessages) {
        if (!lastMessageMap.has(message.conversation_id)) {
          lastMessageMap.set(
            message.conversation_id,
            message,
          );
        }

        if (
          message.sender_id !== currentProfile.id &&
          !message.read_at
        ) {
          unreadMap.set(
            message.conversation_id,
            (unreadMap.get(message.conversation_id) ?? 0) +
              1,
          );
        }
      }

      const rows: ConversationRow[] =
        conversationRows.map((conversation) => {
          const membersForConversation =
            membersByConversation.get(conversation.id) ?? [];

          const otherMember = membersForConversation.find(
            (member) =>
              member.user_id !== currentProfile.id,
          );

          return {
            ...conversation,
            contact: otherMember
              ? contactMap.get(otherMember.user_id) ?? null
              : null,
            lastMessage:
              lastMessageMap.get(conversation.id) ?? null,
            unreadCount:
              unreadMap.get(conversation.id) ?? 0,
          };
        });

      setConversations(rows);

      if (
        selectedConversationId &&
        rows.some(
          (conversation) =>
            conversation.id === selectedConversationId,
        )
      ) {
        return;
      }

      setSelectedConversationId(rows[0]?.id ?? null);
    } catch (err) {
      logAppError("business-messages-load", err);
      setError(getSafeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(conversationId: string) {
    setMessagesLoading(true);
    setError("");

    try {
      const { data, error: messageError } =
        await supabase
          .from("messages")
          .select(
            "id, conversation_id, sender_id, body, created_at, read_at",
          )
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

      if (messageError) {
        throw messageError;
      }

      const loadedMessages = (data ?? []) as Message[];

      setMessages(loadedMessages);

      const unreadIds = loadedMessages
        .filter(
          (message) =>
            message.sender_id !== profile?.id &&
            !message.read_at,
        )
        .map((message) => message.id);

      if (unreadIds.length > 0) {
        const now = new Date().toISOString();

        const { error: readError } = await supabase
          .from("messages")
          .update({ read_at: now })
          .in("id", unreadIds);

        if (readError) {
          logAppError(
            "business-messages-mark-read",
            readError,
          );
        }

        setMessages((current) =>
          current.map((message) =>
            unreadIds.includes(message.id)
              ? { ...message, read_at: now }
              : message,
          ),
        );

        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === conversationId
              ? { ...conversation, unreadCount: 0 }
              : conversation,
          ),
        );
      }
    } catch (err) {
      logAppError("business-messages-thread-load", err);
      setError(getSafeErrorMessage(err));
    } finally {
      setMessagesLoading(false);
    }
  }

  async function sendMessage() {
    const body = messageText.trim();

    if (!body || !selectedConversationId || !profile) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const { data, error: insertError } =
        await supabase
          .from("messages")
          .insert({
            conversation_id: selectedConversationId,
            sender_id: profile.id,
            body,
          })
          .select(
            "id, conversation_id, sender_id, body, created_at, read_at",
          )
          .single();

      if (insertError) {
        throw insertError;
      }

      const newMessage = data as Message;

      setMessages((current) => [
        ...current,
        newMessage,
      ]);

      setMessageText("");

      setConversations((current) =>
        current
          .map((conversation) =>
            conversation.id === selectedConversationId
              ? {
                  ...conversation,
                  updated_at: newMessage.created_at,
                  lastMessage: newMessage,
                }
              : conversation,
          )
          .sort(
            (a, b) =>
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime(),
          ),
      );
    } catch (err) {
      logAppError("business-message-send", err);
      setError(getSafeErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) =>
      [
        conversation.contact?.full_name || "",
        conversation.contact?.email || "",
        conversation.contact?.phone || "",
        conversation.subject || "",
        conversation.type || "",
        conversation.lastMessage?.body || "",
      ].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [conversations, search]);

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) =>
          conversation.id === selectedConversationId,
      ) ?? null,
    [conversations, selectedConversationId],
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading messages...</span>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <MessageCircle className="mx-auto mb-4 h-10 w-10 text-gray-400" />

          <h1 className="text-xl font-semibold text-gray-900">
            Business profile unavailable
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {error ||
              "We could not find a business associated with your account."}
          </p>

          <Link
            to="/business/settings"
            className="mt-6 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Open Business Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Messages
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Communicate with customers, riders, and platform
            administrators.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadConversations()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="grid min-h-[650px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:grid-cols-[340px_1fr]">
        <aside className="border-b border-gray-200 lg:border-b-0 lg:border-r">
          <div className="border-b border-gray-200 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search conversations..."
                className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
              />
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <MessageCircle className="mx-auto mb-3 h-9 w-9 text-gray-300" />

                <p className="font-medium text-gray-900">
                  No conversations
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Messages will appear here when a conversation
                  is available.
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const active =
                  conversation.id === selectedConversationId;

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() =>
                      setSelectedConversationId(
                        conversation.id,
                      )
                    }
                    className={`w-full border-b border-gray-100 p-4 text-left transition ${
                      active
                        ? "bg-gray-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <UserRound className="h-5 w-5 text-gray-500" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {conversation.contact
                              ?.full_name ||
                              "User"}
                          </p>

                          {conversation.lastMessage && (
                            <span className="shrink-0 text-[11px] text-gray-400">
                              {formatRelativeDate(
                                conversation.lastMessage
                                  .created_at,
                              )}
                            </span>
                          )}
                        </div>

                        <p className="mt-0.5 text-xs text-gray-500">
                          {getConversationLabel(
                            conversation.type,
                          )}
                        </p>

                        <p className="mt-1 truncate text-sm text-gray-500">
                          {conversation.lastMessage?.body ||
                            conversation.subject ||
                            "No messages yet"}
                        </p>
                      </div>

                      {conversation.unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-900 px-1.5 text-[10px] font-bold text-white">
                          {conversation.unreadCount > 9
                            ? "9+"
                            : conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <div className="flex min-h-[650px] flex-col">
          {!selectedConversation ? (
            <div className="flex flex-1 items-center justify-center px-6 text-center">
              <div>
                <MessageCircle className="mx-auto mb-4 h-12 w-12 text-gray-300" />

                <h2 className="text-lg font-semibold text-gray-900">
                  Select a conversation
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Choose a conversation from the list to view
                  messages.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <UserRound className="h-5 w-5 text-gray-500" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-gray-900">
                      {selectedConversation.contact
                        ?.full_name || "User"}
                    </h2>

                    <p className="text-xs text-gray-500">
                      {getConversationLabel(
                        selectedConversation.type,
                      )}
                    </p>
                  </div>
                </div>

                <ChevronRight className="h-5 w-5 text-gray-300" />
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50/70 p-5">
                {messagesLoading ? (
                  <div className="flex min-h-[400px] items-center justify-center">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading conversation...
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex min-h-[400px] items-center justify-center text-center">
                    <div>
                      <MessageCircle className="mx-auto mb-3 h-9 w-9 text-gray-300" />

                      <p className="font-medium text-gray-900">
                        No messages yet
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Send the first message in this
                        conversation.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => {
                    const ownMessage =
                      message.sender_id === profile?.id;

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
                          className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[70%] ${
                            ownMessage
                              ? "rounded-br-md bg-gray-900 text-white"
                              : "rounded-bl-md border border-gray-200 bg-white text-gray-900"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm leading-6">
                            {message.body || ""}
                          </p>

                          <div
                            className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${
                              ownMessage
                                ? "text-gray-300"
                                : "text-gray-400"
                            }`}
                          >
                            <span>
                              {formatRelativeDate(
                                message.created_at,
                              )}
                            </span>

                            {ownMessage && (
                              <Check className="h-3 w-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendMessage();
                }}
                className="border-t border-gray-200 bg-white p-4"
              >
                <div className="flex items-end gap-3">
                  <textarea
                    value={messageText}
                    onChange={(event) =>
                      setMessageText(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey
                      ) {
                        event.preventDefault();
                        void sendMessage();
                      }
                    }}
                    rows={2}
                    placeholder="Write a message..."
                    className="min-h-[48px] flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                  />

                  <button
                    type="submit"
                    disabled={
                      sending || !messageText.trim()
                    }
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Send message"
                  >
                    {sending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <p className="mt-2 text-xs text-gray-400">
                  Press Enter to send. Use Shift + Enter for a
                  new line.
                </p>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
