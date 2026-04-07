import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Button, Input, Modal, Spin, Typography } from "antd";
import { Search, Ellipsis, LogOut, Plus } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { searchUsers } from "../../services/auth.service";
import {
  createConversation,
  deleteConversation,
  getMembershipEvents,
  getMessages,
  leaveConversation,
  listConversations,
  mapRealtimeMessage,
  markConversationRead,
  searchMessages,
} from "../../services/chat.service";
import { chatSocketService } from "../../services/chat-socket.service";
import type { SearchableUser } from "../../types/auth";
import type {
  ChatConnectionState,
  ChatSocketError,
  Conversation,
  ConversationPreviewUpdate,
  MembershipEvent,
  Message,
  MessageSearchResult,
  RealtimeMessage,
  TypingPresenceUpdate,
} from "../../types/chat";
import { ChatComposer } from "./components/chat-composer";
import { ConversationList } from "./components/conversation-list";
import { EventBubble, MessageBubble } from "./components/message-bubble";

type ChatState = {
  conversations: Conversation[];
  selectedConversationId: string | null;
  messages: Message[];
  membershipEvents: MembershipEvent[];
  loadingConversations: boolean;
  loadingMessages: boolean;
  sendingMessage: boolean;
  hasMoreMessages: boolean;
  typingByConversationId: Record<string, TypingPresenceUpdate | undefined>;
};

type ConversationContextMenuState = {
  conversationId: string;
  x: number;
  y: number;
};

const SELECTED_CONVERSATION_PARAM = "conversationId";

function readSelectedConversationIdFromLocation(search: string) {
  const params = new URLSearchParams(search);
  return params.get(SELECTED_CONVERSATION_PARAM);
}

function replaceSelectedConversationInLocation(conversationId: string | null) {
  const params = new URLSearchParams(window.location.search);

  if (conversationId) {
    params.set(SELECTED_CONVERSATION_PARAM, conversationId);
  } else {
    params.delete(SELECTED_CONVERSATION_PARAM);
  }

  const nextSearch = params.toString();
  const nextUrl = nextSearch
    ? `${window.location.pathname}?${nextSearch}`
    : window.location.pathname;

  window.history.replaceState({}, document.title, nextUrl);
}

function upsertMessage(messages: Message[], message: Message) {
  if (messages.some((item) => item._id === message._id)) {
    return messages;
  }

  return [...messages, message].sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
  );
}

function updateConversationPreview(
  conversations: Conversation[],
  preview: ConversationPreviewUpdate,
) {
  const target = conversations.find(
    (conversation) => conversation._id === preview.conversationId,
  );

  if (!target) {
    return null;
  }

  const next = conversations.map((conversation) =>
    conversation._id === preview.conversationId
      ? {
          ...conversation,
          lastMessagePreview: preview.lastMessagePreview,
          lastMessageAt: preview.lastMessageAt,
          unreadCount: preview.unreadCount,
          hasUnread: preview.hasUnread,
        }
      : conversation,
  );

  return next.sort((a, b) => {
    const right = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    const left = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    return right - left;
  });
}

export function ChatPage() {
  const { currentUser, isAuthenticated, logout } = useAuthStore();
  const [state, setState] = useState<ChatState>({
    conversations: [],
    selectedConversationId: null,
    messages: [],
    membershipEvents: [],
    loadingConversations: true,
    loadingMessages: false,
    sendingMessage: false,
    hasMoreMessages: true,
    typingByConversationId: {},
  });
  const [inputValue, setInputValue] = useState("");
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<SearchableUser[]>(
    [],
  );
  const [selectedUser, setSelectedUser] = useState<SearchableUser | null>(null);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [startingConversation, setStartingConversation] = useState(false);
  const [isMessageSearchOpen, setIsMessageSearchOpen] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [messageSearchResults, setMessageSearchResults] = useState<
    MessageSearchResult[]
  >([]);
  const [searchingMessages, setSearchingMessages] = useState(false);
  const [messageSearchError, setMessageSearchError] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] =
    useState<ConversationContextMenuState | null>(null);
  const [connectionState, setConnectionState] =
    useState<ChatConnectionState>("disconnected");
  const messageThreadRef = useRef<HTMLDivElement>(null);
  const joinedConversationRef = useRef<string | null>(null);
  const hasRestoredConversationFromUrlRef = useRef(false);
  const requestedConversationIdRef = useRef(
    readSelectedConversationIdFromLocation(window.location.search),
  );
  const conversationsRef = useRef<Conversation[]>([]);
  const typingTimeoutsRef = useRef<Record<string, number | undefined>>({});

  const palette = {
    page: "linear-gradient(180deg, #fbf4ea 0%, #fff8f1 100%)",
    shell: "rgba(255, 252, 247, 0.82)",
    text: "#431407",
    textMuted: "rgba(67, 20, 7, 0.55)",
    border: "rgba(154, 52, 18, 0.12)",
  };

  const selectedConversation = useMemo(
    () =>
      state.conversations.find(
        (item) => item._id === state.selectedConversationId,
      ) ?? null,
    [state.conversations, state.selectedConversationId],
  );

  const combinedTimeline = useMemo(() => {
    const eventItems =
      selectedConversation?.type === "group"
        ? state.membershipEvents.map((event) => ({
            kind: "event" as const,
            date: event.occurredAt,
            event,
          }))
        : [];
    const messageItems = state.messages.map((message) => ({
      kind: "message" as const,
      date: message.sentAt,
      message,
    }));
    return [...eventItems, ...messageItems].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [selectedConversation?.type, state.membershipEvents, state.messages]);

  const loadConversations = useCallback(async () => {
    try {
      const conversations = await listConversations();
      conversationsRef.current = conversations;
      setState((prev) => ({
        ...prev,
        conversations,
        loadingConversations: false,
      }));
    } catch {
      setState((prev) => ({ ...prev, loadingConversations: false }));
    }
  }, []);

  const resetMessageSearch = useCallback(() => {
    setIsMessageSearchOpen(false);
    setMessageSearchQuery("");
    setMessageSearchResults([]);
    setSearchingMessages(false);
    setMessageSearchError(null);
    setHighlightedMessageId(null);
  }, []);

  const selectConversation = useCallback(async (conversationId: string) => {
    setState((prev) => ({
      ...prev,
      selectedConversationId: conversationId,
      loadingMessages: true,
      messages: [],
      membershipEvents: [],
      hasMoreMessages: true,
    }));

    try {
      const [messages, membershipEvents] = await Promise.all([
        getMessages(conversationId),
        getMembershipEvents(conversationId),
      ]);
      setState((prev) => ({
        ...prev,
        messages,
        membershipEvents,
        loadingMessages: false,
        hasMoreMessages: messages.length >= 10,
      }));

      const readState =
        chatSocketService.getConnectionState() === "connected"
          ? await chatSocketService.markConversationRead(conversationId)
          : await markConversationRead(conversationId);
      setState((prev) => ({
        ...prev,
        conversations: prev.conversations.map((conversation) =>
          conversation._id === conversationId
            ? {
                ...conversation,
                unreadCount: readState.unreadCount,
                hasUnread: readState.unreadCount > 0,
              }
            : conversation,
        ),
      }));
    } catch {
      setState((prev) => ({ ...prev, loadingMessages: false }));
    }
  }, []);

  const handleIncomingMessage = useCallback(
    (incomingMessage: RealtimeMessage) => {
      const message = mapRealtimeMessage(incomingMessage);
      let shouldReloadConversations = false;

      setState((prev) => {
        const existingConversation = prev.conversations.find(
          (conversation) => conversation._id === message.conversationId,
        );

        if (!existingConversation) {
          shouldReloadConversations = true;
        }

        const nextConversations = existingConversation
          ? (updateConversationPreview(prev.conversations, {
              conversationId: message.conversationId,
              lastMessagePreview: message.content,
              lastMessageAt: message.sentAt,
              unreadCount: existingConversation.unreadCount,
              hasUnread: existingConversation.hasUnread,
            }) ?? prev.conversations)
          : prev.conversations;

        conversationsRef.current = nextConversations;

        return {
          ...prev,
          conversations: nextConversations,
          messages:
            prev.selectedConversationId === message.conversationId
              ? upsertMessage(prev.messages, message)
              : prev.messages,
        };
      });

      if (shouldReloadConversations) {
        void loadConversations();
      }

      if (incomingMessage.senderId === currentUser?.id) {
        setInputValue("");
        setState((prev) => ({ ...prev, sendingMessage: false }));
      }
    },
    [currentUser?.id, loadConversations],
  );

  const handlePreviewUpdate = useCallback(
    (preview: ConversationPreviewUpdate) => {
      let shouldReloadConversations = false;

      setState((prev) => {
        const nextConversations = updateConversationPreview(
          prev.conversations,
          preview,
        );

        if (!nextConversations) {
          shouldReloadConversations = true;
          return prev;
        }

        conversationsRef.current = nextConversations;

        return {
          ...prev,
          conversations: nextConversations,
        };
      });

      if (shouldReloadConversations) {
        void loadConversations();
      }
    },
    [loadConversations],
  );

  const handleConversationRead = useCallback(
    (payload: { conversationId: string }) => {
      setState((prev) => ({
        ...prev,
        conversations: prev.conversations.map((conversation) =>
          conversation._id === payload.conversationId
            ? {
                ...conversation,
                unreadCount: 0,
                hasUnread: false,
              }
            : conversation,
        ),
      }));

      if (state.selectedConversationId !== payload.conversationId) {
        return;
      }

      void getMessages(payload.conversationId)
        .then((messages) => {
          setState((prev) => ({
            ...prev,
            messages,
          }));
        })
        .catch(() => undefined);
    },
    [state.selectedConversationId],
  );

  const handleTypingPresence = useCallback(
    (payload: TypingPresenceUpdate) => {
      if (payload.userId === currentUser?.id) {
        return;
      }

      const existingTimeout = typingTimeoutsRef.current[payload.conversationId];

      if (existingTimeout) {
        window.clearTimeout(existingTimeout);
        typingTimeoutsRef.current[payload.conversationId] = undefined;
      }

      setState((prev) => ({
        ...prev,
        typingByConversationId: {
          ...prev.typingByConversationId,
          [payload.conversationId]: payload.isTyping ? payload : undefined,
        },
      }));

      if (!payload.isTyping) {
        return;
      }

      const expiresAt = payload.expiresAt
        ? new Date(payload.expiresAt).getTime()
        : Date.now() + 4000;
      const timeoutMs = Math.max(expiresAt - Date.now(), 0);

      typingTimeoutsRef.current[payload.conversationId] = window.setTimeout(
        () => {
          setState((prev) => ({
            ...prev,
            typingByConversationId: {
              ...prev.typingByConversationId,
              [payload.conversationId]: undefined,
            },
          }));
          typingTimeoutsRef.current[payload.conversationId] = undefined;
        },
        timeoutMs,
      );
    },
    [currentUser?.id],
  );

  const handleSocketError = useCallback((_error: ChatSocketError) => {
    setState((prev) => ({ ...prev, sendingMessage: false }));
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (
      state.loadingConversations ||
      hasRestoredConversationFromUrlRef.current
    ) {
      return;
    }

    hasRestoredConversationFromUrlRef.current = true;

    const conversationIdFromUrl = requestedConversationIdRef.current;

    if (!conversationIdFromUrl) {
      return;
    }

    const targetConversation = state.conversations.find(
      (conversation) => conversation._id === conversationIdFromUrl,
    );

    if (!targetConversation) {
      replaceSelectedConversationInLocation(null);
      requestedConversationIdRef.current = null;
      return;
    }

    void selectConversation(conversationIdFromUrl);
  }, [selectConversation, state.conversations, state.loadingConversations]);

  useEffect(() => {
    if (!hasRestoredConversationFromUrlRef.current) {
      return;
    }

    if (
      state.selectedConversationId === null &&
      requestedConversationIdRef.current !== null
    ) {
      return;
    }

    replaceSelectedConversationInLocation(state.selectedConversationId);
    requestedConversationIdRef.current = state.selectedConversationId;
  }, [state.selectedConversationId]);

  useEffect(() => {
    if (!isAuthenticated) {
      chatSocketService.disconnect();
      setConnectionState("disconnected");
      return;
    }

    chatSocketService.connect();

    const unsubscribeConnection = chatSocketService.onConnectionState(
      (nextState) => {
        setConnectionState(nextState);
      },
    );
    const unsubscribeMessage = chatSocketService.onMessage(
      handleIncomingMessage,
    );
    const unsubscribePreview = chatSocketService.onPreview(handlePreviewUpdate);
    const unsubscribeRead = chatSocketService.onRead(handleConversationRead);
    const unsubscribeTyping = chatSocketService.onTyping(handleTypingPresence);
    const unsubscribeError = chatSocketService.onError(handleSocketError);

    return () => {
      unsubscribeConnection();
      unsubscribeMessage();
      unsubscribePreview();
      unsubscribeRead();
      unsubscribeTyping();
      unsubscribeError();
      chatSocketService.disconnect();
    };
  }, [
    handleConversationRead,
    handleIncomingMessage,
    handlePreviewUpdate,
    handleSocketError,
    handleTypingPresence,
    isAuthenticated,
  ]);

  useEffect(() => {
    if (!selectedConversationIdIsValid(state.selectedConversationId)) {
      return;
    }

    const nextConversationId = state.selectedConversationId;
    const previousConversationId = joinedConversationRef.current;

    if (previousConversationId === nextConversationId) {
      return;
    }

    const syncConversationSubscription = async () => {
      try {
        if (previousConversationId) {
          await chatSocketService.leaveConversation(previousConversationId);
        }
        await chatSocketService.joinConversation(nextConversationId);
        joinedConversationRef.current = nextConversationId;
      } catch {
        return;
      }
    };

    void syncConversationSubscription();
  }, [state.selectedConversationId]);

  useEffect(() => {
    if (!isNewChatModalOpen) {
      return;
    }

    const trimmedQuery = userSearchQuery.trim();

    if (trimmedQuery.length < 2) {
      setUserSearchResults([]);
      setSearchingUsers(false);
      return;
    }

    let cancelled = false;
    setSearchingUsers(true);

    const timer = window.setTimeout(async () => {
      try {
        const results = await searchUsers(trimmedQuery);
        if (!cancelled) {
          setUserSearchResults(results);
        }
      } catch {
        if (!cancelled) {
          setUserSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setSearchingUsers(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isNewChatModalOpen, userSearchQuery]);

  useEffect(() => {
    if (!isMessageSearchOpen || !state.selectedConversationId) {
      setSearchingMessages(false);
      setMessageSearchResults([]);
      setMessageSearchError(null);
      return;
    }

    const trimmedQuery = messageSearchQuery.trim();

    if (trimmedQuery.length < 2) {
      setSearchingMessages(false);
      setMessageSearchResults([]);
      setMessageSearchError(null);
      return;
    }

    let cancelled = false;
    setSearchingMessages(true);
    setMessageSearchError(null);

    const timer = window.setTimeout(async () => {
      try {
        const results = await searchMessages(state.selectedConversationId!, trimmedQuery);
        if (!cancelled) {
          setMessageSearchResults(results);
        }
      } catch {
        if (!cancelled) {
          setMessageSearchResults([]);
          setMessageSearchError("Không thể tìm kiếm tin nhắn lúc này.");
        }
      } finally {
        if (!cancelled) {
          setSearchingMessages(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isMessageSearchOpen, messageSearchQuery, state.selectedConversationId]);

  useEffect(() => {
    const handleWindowClick = () => setContextMenu(null);

    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

  useEffect(() => {
    return () => {
      for (const timeoutId of Object.values(typingTimeoutsRef.current)) {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
      }
    };
  }, []);

  const loadMoreMessages = useCallback(async () => {
    if (
      !state.selectedConversationId ||
      !state.hasMoreMessages ||
      state.loadingMessages
    )
      return;
    const oldestMessage = state.messages[0];
    if (!oldestMessage) return;

    setState((prev) => ({ ...prev, loadingMessages: true }));
    try {
      const olderMessages = await getMessages(state.selectedConversationId, {
        before: oldestMessage.sentAt,
        limit: 10,
      });
      setState((prev) => ({
        ...prev,
        messages: [...olderMessages, ...prev.messages],
        loadingMessages: false,
        hasMoreMessages: olderMessages.length >= 10,
      }));
    } catch {
      setState((prev) => ({ ...prev, loadingMessages: false }));
    }
  }, [
    state.selectedConversationId,
    state.hasMoreMessages,
    state.loadingMessages,
    state.messages,
  ]);

  const handleScroll = useCallback(() => {
    const container = messageThreadRef.current;
    if (!container) return;
    if (
      container.scrollTop === 0 &&
      state.hasMoreMessages &&
      !state.loadingMessages
    ) {
      void loadMoreMessages();
    }
  }, [loadMoreMessages, state.hasMoreMessages, state.loadingMessages]);

  const handleSend = async () => {
    if (!inputValue.trim()) {
      return;
    }

    if (!state.selectedConversationId || state.sendingMessage) {
      return;
    }

    if (connectionState !== "connected") {
      return;
    }

    setState((prev) => ({ ...prev, sendingMessage: true }));

    try {
      await chatSocketService.sendMessage(
        state.selectedConversationId,
        inputValue.trim(),
      );
      await chatSocketService.updateTypingPresence(
        state.selectedConversationId,
        false,
      );
    } catch {
      setState((prev) => ({ ...prev, sendingMessage: false }));
    }
  };

  const handleLeave = async () => {
    if (!state.selectedConversationId) return;
    try {
      await chatSocketService.leaveConversation(state.selectedConversationId);
      joinedConversationRef.current = null;
      await leaveConversation(state.selectedConversationId);
      setState((prev) => ({
        ...prev,
        selectedConversationId: null,
        messages: [],
        membershipEvents: [],
      }));
      await loadConversations();
    } catch {
      return;
    }
  };

  const handleOpenMessageSearch = () => {
    if (!state.selectedConversationId) {
      setMessageSearchError("Hãy mở một đoạn chat trước khi tìm kiếm tin nhắn.");
      setMessageSearchResults([]);
      setIsMessageSearchOpen(true);
      return;
    }

    setMessageSearchError(null);
    setMessageSearchResults([]);
    setMessageSearchQuery("");
    setIsMessageSearchOpen(true);
  };

  const handleOpenSearchResult = async (message: MessageSearchResult) => {
    if (state.selectedConversationId !== message.conversationId) {
      await selectConversation(message.conversationId);
    }

    resetMessageSearch();
    setHighlightedMessageId(message.messageId);

    window.setTimeout(() => {
      const target = document.getElementById(`message-${message.messageId}`);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);

    window.setTimeout(() => {
      setHighlightedMessageId((current) => (
        current === message.messageId ? null : current
      ));
    }, 2200);
  };

  const handleConversationContextMenu = (
    conversation: Conversation,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    setContextMenu({
      conversationId: conversation._id,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleDeleteConversation = async (conversationId: string) => {
    setContextMenu(null);

    try {
      if (joinedConversationRef.current === conversationId) {
        await chatSocketService.leaveConversation(conversationId);
        joinedConversationRef.current = null;
      }

      await deleteConversation(conversationId);
      const conversations = await listConversations();

      setState((prev) => ({
        ...prev,
        conversations,
        loadingConversations: false,
        selectedConversationId:
          prev.selectedConversationId === conversationId
            ? null
            : prev.selectedConversationId,
        messages:
          prev.selectedConversationId === conversationId ? [] : prev.messages,
        membershipEvents:
          prev.selectedConversationId === conversationId
            ? []
            : prev.membershipEvents,
      }));
    } catch {
      return;
    }
  };

  const resetNewChatModal = () => {
    setIsNewChatModalOpen(false);
    setUserSearchQuery("");
    setUserSearchResults([]);
    setSelectedUser(null);
    setSearchingUsers(false);
    setStartingConversation(false);
  };

  const handleStartConversation = async () => {
    if (!selectedUser || startingConversation) {
      return;
    }

    setStartingConversation(true);

    try {
      const conversation = await createConversation({
        type: "direct",
        participantIds: [selectedUser.id],
      });
      const conversations = await listConversations();

      setState((prev) => ({
        ...prev,
        conversations,
        loadingConversations: false,
      }));

      await selectConversation(conversation._id);
      resetNewChatModal();
    } catch {
      setStartingConversation(false);
    }
  };

  const headerTitle =
    selectedConversation?.displayTitle ||
    selectedConversation?.title ||
    "Chọn một đoạn chat";
  const activeTypingPresence = state.selectedConversationId
    ? state.typingByConversationId[state.selectedConversationId]
    : undefined;
  const headerSubtitle = selectedConversation?.directPeer?.email ?? "";

  return (
    <>
      <style>{`
        @keyframes chatTypingDotBounce {
          0%, 80%, 100% {
            opacity: 0.35;
            transform: translateY(0);
          }
          40% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }
      `}</style>
      <div
        style={{
          minHeight: "100vh",
          background: palette.page,
          color: palette.text,
          display: "grid",
          placeItems: "center",
        }}
      >
      <div style={{ width: "100%", paddingInline: 24 }}>
        <main
          style={styles.workspaceSimple}
        >
          <aside
            style={{
              ...styles.sidebarSimple,
              ...styles.glass(palette),
            }}
          >
            <div style={styles.profileBlock}>
              <Avatar
                size={48}
                src={currentUser?.avatarUrl}
                style={styles.profileAvatar}
              >
                {currentUser?.displayName?.charAt(0).toUpperCase() ?? "U"}
              </Avatar>
              <div>
                <Typography.Text style={styles.profileName as never}>
                  {currentUser?.displayName ?? "Người dùng"}
                </Typography.Text>
                <Typography.Text style={styles.profileStatus as never}>
                  @{currentUser?.username ?? "unknown"} ·{" "}
                  {currentUser?.email ?? ""}
                </Typography.Text>
              </div>
            </div>

            <Button
              type="primary"
              shape="round"
              icon={<Plus size={16} />}
              style={styles.newMessageButton}
              onClick={() => setIsNewChatModalOpen(true)}
            >
              Tin nhắn mới
            </Button>

            <div style={styles.sidebarSection} data-testid="conversation-list">
              <Typography.Text style={styles.sidebarLabel as never}>
                Đoạn chat gần đây
              </Typography.Text>
              {state.loadingConversations ? (
                <Spin />
              ) : (
                <ConversationList
                  conversations={state.conversations}
                  selectedId={state.selectedConversationId}
                  onSelect={(conversationId) =>
                    void selectConversation(conversationId)
                  }
                  onContextMenu={handleConversationContextMenu}
                />
              )}
            </div>

            <Button
              type="text"
              icon={<LogOut size={16} />}
              style={styles.settingsRow}
              onClick={() => void logout()}
            >
              Đăng xuất
            </Button>
          </aside>

          <section
            style={{ ...styles.chatMainSimple, ...styles.glass(palette) }}
          >
            <div style={styles.chatTopStack}>
              <header style={styles.chatHeaderSimple}>
                <div style={styles.chatHeaderLeftSimple}>
                  <Avatar size={42} style={styles.chatHeaderAvatar}>
                    {headerTitle.charAt(0).toUpperCase()}
                  </Avatar>
                  <div>
                    <Typography.Title
                      level={3}
                      style={{
                        margin: 0,
                        color: palette.text,
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                      }}
                    >
                      {headerTitle}
                    </Typography.Title>
                    {headerSubtitle ? (
                      <Typography.Text
                        style={{ color: palette.textMuted, fontSize: 13 } as never}
                      >
                        {headerSubtitle}
                      </Typography.Text>
                    ) : null}
                  </div>
                </div>
                <div style={styles.heroActions}>
                  <Button
                    type="text"
                    shape="circle"
                    icon={<Search size={16} />}
                    onClick={handleOpenMessageSearch}
                  />
                  <Button
                    type="text"
                    shape="circle"
                    icon={<Ellipsis size={16} />}
                  />
                </div>
              </header>
            </div>

            <div
              ref={messageThreadRef}
              onScroll={handleScroll}
              style={styles.messageStreamSimple}
              data-testid="message-thread"
            >
              {selectedConversation ? (
                <>
                  <div style={styles.dayBadge}>Hôm nay</div>
                  {state.loadingMessages && combinedTimeline.length === 0 ? (
                    <Spin />
                  ) : (
                    <>
                      {combinedTimeline.map((item, index) =>
                        item.kind === "event" ? (
                          <EventBubble
                            key={`event-${index}`}
                            event={item.event}
                          />
                        ) : (
                          <MessageBubble
                            key={item.message._id}
                            anchorId={`message-${item.message._id}`}
                            highlighted={highlightedMessageId === item.message._id}
                            message={item.message}
                            isMine={item.message.senderId === currentUser?.id}
                            authorName={
                              item.message.senderId === currentUser?.id
                                ? (item.message.senderDisplayName ??
                                  currentUser?.displayName ??
                                  "Bạn")
                                : (item.message.senderDisplayName ??
                                  selectedConversation.directPeer?.displayName ??
                                  selectedConversation.displayTitle ??
                                  "Người dùng")
                            }
                            authorAvatarUrl={
                              item.message.senderId === currentUser?.id
                                ? (item.message.senderAvatarUrl ?? currentUser?.avatarUrl)
                                : item.message.senderAvatarUrl
                            }
                          />
                        ),
                      )}
                      {activeTypingPresence?.isTyping ? (
                        <div style={styles.typingIndicatorRow}>
                          <Avatar size={28} style={styles.typingIndicatorAvatar}>
                            {(selectedConversation.directPeer?.displayName ?? "N").charAt(0).toUpperCase()}
                          </Avatar>
                          <div style={styles.typingIndicatorBubble}>
                            <span style={styles.typingDots}>
                              <span style={{ ...styles.typingDot, animationDelay: "0ms" }} />
                              <span style={{ ...styles.typingDot, animationDelay: "180ms" }} />
                              <span style={{ ...styles.typingDot, animationDelay: "360ms" }} />
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </>
              ) : (
                <div style={styles.emptyChatState}>
                  <Typography.Title
                    level={3}
                    style={styles.emptyChatTitle as never}
                  >
                    Chọn một đoạn chat
                  </Typography.Title>
                  <Typography.Text style={styles.emptyChatDescription as never}>
                    Chọn cuộc trò chuyện bên trái hoặc bắt đầu một tin nhắn mới.
                  </Typography.Text>
                </div>
              )}
            </div>

            <ChatComposer
              value={inputValue}
              onChange={(value) => {
                setInputValue(value);

                if (
                  !state.selectedConversationId ||
                  connectionState !== "connected"
                ) {
                  return;
                }

                void chatSocketService.updateTypingPresence(
                  state.selectedConversationId,
                  value.trim().length > 0,
                );
              }}
              onSend={handleSend}
              onLeave={handleLeave}
              loading={state.sendingMessage}
              disabled={!state.selectedConversationId}
              connectionState={connectionState}
            />
          </section>
        </main>

        {contextMenu ? (
          <div
            style={{
              ...styles.contextMenu,
              top: contextMenu.y,
              left: contextMenu.x,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              style={styles.contextMenuItem}
              onClick={() =>
                void handleDeleteConversation(contextMenu.conversationId)
              }
            >
              Xoá đoạn chat
            </button>
          </div>
        ) : null}

        <Modal
          title="Tin nhắn mới"
          open={isNewChatModalOpen}
          onCancel={resetNewChatModal}
          onOk={handleStartConversation}
          okText="Bắt đầu chat"
          cancelText="Đóng"
          okButtonProps={{
            disabled: !selectedUser,
            loading: startingConversation,
          }}
        >
          <div style={styles.modalContent}>
            <Input
              value={userSearchQuery}
              onChange={(event) => {
                setUserSearchQuery(event.target.value);
                setSelectedUser(null);
              }}
              placeholder="Tìm bằng email hoặc username"
              size="large"
            />

            {userSearchQuery.trim().length < 2 ? (
              <Typography.Text style={styles.searchHint as never}>
                Nhập ít nhất 2 ký tự để tìm người dùng.
              </Typography.Text>
            ) : searchingUsers ? (
              <div style={styles.searchState}>
                <Spin />
              </div>
            ) : userSearchResults.length === 0 ? (
              <Typography.Text style={styles.searchHint as never}>
                Không tìm thấy người dùng phù hợp.
              </Typography.Text>
            ) : (
              <div style={styles.searchResults}>
                {userSearchResults.map((user) => {
                  const isActive = selectedUser?.id === user.id;

                  return (
                    <button
                      key={user.id}
                      type="button"
                      style={{
                        ...styles.searchResultItem,
                        ...(isActive ? styles.searchResultItemActive : {}),
                      }}
                      onClick={() => setSelectedUser(user)}
                    >
                      <Avatar style={styles.searchResultAvatar}>
                        {user.displayName.charAt(0).toUpperCase()}
                      </Avatar>
                      <div style={styles.searchResultMeta}>
                        <Typography.Text
                          style={styles.searchResultName as never}
                        >
                          {user.displayName}
                        </Typography.Text>
                        <Typography.Text
                          style={styles.searchResultInfo as never}
                        >
                          @{user.username}
                        </Typography.Text>
                        <Typography.Text
                          style={styles.searchResultInfo as never}
                        >
                          {user.email}
                        </Typography.Text>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Modal>

        <Modal
          title="Tìm kiếm tin nhắn"
          open={isMessageSearchOpen}
          onCancel={resetMessageSearch}
          onOk={resetMessageSearch}
          okText="Đóng"
          cancelButtonProps={{ style: { display: "none" } }}
        >
          <div style={styles.modalContent}>
            <Input
              value={messageSearchQuery}
              onChange={(event) => {
                setMessageSearchQuery(event.target.value);
                setMessageSearchError(null);
              }}
              placeholder="Tìm trong đoạn chat hiện tại"
              size="large"
            />

            {messageSearchError ? (
              <Typography.Text style={styles.searchHint as never}>
                {messageSearchError}
              </Typography.Text>
            ) : messageSearchQuery.trim().length < 2 ? (
              <Typography.Text style={styles.searchHint as never}>
                Nhập ít nhất 2 ký tự để tìm tin nhắn.
              </Typography.Text>
            ) : searchingMessages ? (
              <div style={styles.searchState}>
                <Spin />
              </div>
            ) : messageSearchResults.length === 0 ? (
              <Typography.Text style={styles.searchHint as never}>
                Không tìm thấy tin nhắn phù hợp.
              </Typography.Text>
            ) : (
              <div style={styles.searchResults}>
                {messageSearchResults.map((message) => (
                  <button
                    key={`${message.messageId}-${message.sentAt}`}
                    type="button"
                    style={styles.searchResultItem}
                    onClick={() => void handleOpenSearchResult(message)}
                  >
                    <Avatar src={message.senderAvatarUrl} style={styles.searchResultAvatar}>
                      {(message.senderDisplayName ?? "U").charAt(0).toUpperCase()}
                    </Avatar>
                    <div style={styles.searchResultMeta}>
                      <Typography.Text style={styles.searchResultName as never}>
                        {message.senderDisplayName ?? "Người dùng"}
                      </Typography.Text>
                      <Typography.Text style={styles.searchResultInfo as never}>
                        {formatRelativeSentDate(message.sentAt)} · {new Date(message.sentAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography.Text>
                      <Typography.Paragraph style={styles.searchResultMessage as never}>
                        {renderHighlightedSearchText(message.content, messageSearchQuery)}
                      </Typography.Paragraph>
                      <Typography.Text style={styles.searchResultInfo as never}>
                        Mã hoá: {message.encryptedContent ?? "Không có"}
                      </Typography.Text>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
    </>
  );
}

function renderHighlightedSearchText(content: string, query: string) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return content;
  }

  const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matcher = new RegExp(`(${escapedQuery})`, "ig");
  const parts = content.split(matcher);

  return parts.map((part, index) => {
    if (part.toLowerCase() === trimmedQuery.toLowerCase()) {
      return (
        <mark key={`${part}-${index}`} style={styles.searchHighlight}>
          {part}
        </mark>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function formatRelativeSentDate(value: string) {
  const sentDate = new Date(value);
  const now = new Date();
  const sentDay = new Date(sentDate.getFullYear(), sentDate.getMonth(), sentDate.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = today.getTime() - sentDay.getTime();
  const diffDays = Math.round(diffMs / 86400000);

  if (diffDays <= 0) {
    return "Hôm nay";
  }

  if (diffDays <= 7) {
    return `${diffDays} ngày trước`;
  }

  return sentDate.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function selectedConversationIdIsValid(
  conversationId: string | null,
): conversationId is string {
  return Boolean(conversationId);
}

const styles = {
  glass: (palette: Record<string, string>): React.CSSProperties => ({
    background: palette.shell,
    border: `1px solid ${palette.border}`,
    boxShadow:
      "0 18px 38px rgba(194, 65, 12, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(18px)",
  }),
  workspaceSimple: {
    minHeight: "calc(100vh - 66px)",
    display: "grid",
    gridTemplateColumns: "360px minmax(0, 1fr)",
    gap: 20,
    alignItems: "stretch",
  } satisfies React.CSSProperties,
  sidebarSimple: {
    display: "grid",
    gridTemplateRows: "auto auto 1fr auto",
    gap: 18,
    alignContent: "start",
    borderRadius: 34,
    padding: 22,
  } satisfies React.CSSProperties,
  profileBlock: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  } satisfies React.CSSProperties,
  profileAvatar: {
    background: "linear-gradient(135deg, #9b2f00, #c2410c)",
    color: "#fff7ed",
    fontWeight: 700,
  } satisfies React.CSSProperties,
  profileName: {
    display: "block",
    color: "#431407",
    fontWeight: 700,
    fontSize: 15,
  } satisfies React.CSSProperties,
  profileStatus: {
    display: "block",
    color: "rgba(67, 20, 7, 0.55)",
    fontSize: 12,
    marginTop: 2,
  } satisfies React.CSSProperties,
  newMessageButton: {
    height: 42,
    border: "none",
    background: "linear-gradient(135deg, #9b2f00, #c2410c)",
    boxShadow: "0 18px 38px rgba(194, 65, 12, 0.14)",
  } satisfies React.CSSProperties,
  sidebarSection: {
    display: "grid",
    gap: 12,
    minHeight: 0,
    alignContent: "start",
  } satisfies React.CSSProperties,
  sidebarLabel: {
    color: "#8d7168",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  } satisfies React.CSSProperties,
  settingsRow: {
    border: "none",
    background: "transparent",
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    color: "#8d7168",
    padding: 0,
    fontSize: 14,
  } satisfies React.CSSProperties,
  chatMainSimple: {
    display: "grid",
    gridTemplateRows: "auto minmax(0, 1fr) auto",
    gap: 14,
    borderRadius: 34,
    padding: 22,
    minHeight: 0,
  } satisfies React.CSSProperties,
  chatTopStack: {
    display: "grid",
    gap: 14,
    alignContent: "start",
  } satisfies React.CSSProperties,
  chatHeaderSimple: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  } satisfies React.CSSProperties,
  chatHeaderLeftSimple: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  } satisfies React.CSSProperties,
  chatHeaderAvatar: {
    background: "#ffffff",
    color: "#9b2f00",
    fontWeight: 700,
  } satisfies React.CSSProperties,
  heroActions: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
  } satisfies React.CSSProperties,
  messageStreamSimple: {
    display: "grid",
    gap: 14,
    alignContent: "start",
    overflow: "auto",
    minHeight: 0,
    paddingRight: 8,
  } satisfies React.CSSProperties,
  emptyChatState: {
    minHeight: 0,
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    gap: 10,
    textAlign: "center",
    padding: 24,
  } satisfies React.CSSProperties,
  emptyChatTitle: {
    margin: 0,
    color: "#431407",
    fontFamily: "Plus Jakarta Sans, sans-serif",
  } satisfies React.CSSProperties,
  emptyChatDescription: {
    color: "rgba(67, 20, 7, 0.55)",
    fontSize: 14,
    maxWidth: 360,
  } satisfies React.CSSProperties,
  dayBadge: {
    justifySelf: "center",
    padding: "6px 14px",
    borderRadius: 999,
    background: "rgba(255, 241, 237, 0.9)",
    color: "#8d7168",
    fontSize: 12,
    fontWeight: 600,
  } satisfies React.CSSProperties,
  modalContent: {
    display: "grid",
    gap: 16,
  } satisfies React.CSSProperties,
  searchHint: {
    color: "rgba(67, 20, 7, 0.55)",
    fontSize: 13,
  } satisfies React.CSSProperties,
  searchState: {
    display: "grid",
    placeItems: "center",
    minHeight: 120,
  } satisfies React.CSSProperties,
  searchResults: {
    display: "grid",
    gap: 10,
    maxHeight: 320,
    overflow: "auto",
  } satisfies React.CSSProperties,
  searchResultItem: {
    border: "1px solid rgba(154, 52, 18, 0.12)",
    background: "rgba(255, 252, 247, 0.92)",
    borderRadius: 18,
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: 12,
    alignItems: "center",
    padding: 14,
    textAlign: "left",
    cursor: "pointer",
  } satisfies React.CSSProperties,
  searchResultItemActive: {
    border: "1px solid rgba(194, 65, 12, 0.32)",
    boxShadow: "0 12px 24px rgba(194, 65, 12, 0.08)",
    background: "rgba(255, 247, 237, 0.96)",
  } satisfies React.CSSProperties,
  searchResultAvatar: {
    background: "linear-gradient(135deg, #9b2f00, #c2410c)",
    color: "#fff7ed",
    fontWeight: 700,
  } satisfies React.CSSProperties,
  searchResultMeta: {
    display: "grid",
    gap: 2,
    minWidth: 0,
  } satisfies React.CSSProperties,
  searchResultName: {
    color: "#431407",
    fontWeight: 700,
  } satisfies React.CSSProperties,
  searchResultInfo: {
    color: "rgba(67, 20, 7, 0.55)",
    fontSize: 13,
  } satisfies React.CSSProperties,
  searchResultMessage: {
    margin: 0,
    color: "#431407",
    fontSize: 13,
    lineHeight: 1.45,
  } satisfies React.CSSProperties,
  searchHighlight: {
    background: "rgba(251, 191, 36, 0.45)",
    color: "#431407",
    padding: "0 2px",
    borderRadius: 4,
  } satisfies React.CSSProperties,
  contextMenu: {
    position: "fixed",
    zIndex: 1200,
    background: "rgba(255, 252, 247, 0.98)",
    border: "1px solid rgba(154, 52, 18, 0.12)",
    borderRadius: 16,
    boxShadow: "0 18px 38px rgba(194, 65, 12, 0.12)",
    padding: 8,
  } satisfies React.CSSProperties,
  contextMenuItem: {
    border: "none",
    background: "transparent",
    color: "#7f1d1d",
    fontSize: 14,
    padding: "10px 12px",
    borderRadius: 10,
    cursor: "pointer",
  } satisfies React.CSSProperties,
  typingIndicatorRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
    maxWidth: "78%",
  } satisfies React.CSSProperties,
  typingIndicatorAvatar: {
    background: "#ffffff",
    color: "#9b2f00",
    fontWeight: 700,
  } satisfies React.CSSProperties,
  typingIndicatorBubble: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 44,
    padding: "0 14px",
    borderRadius: 18,
    background: "#ffe2db",
    color: "#8d7168",
  } satisfies React.CSSProperties,
  typingDots: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  } satisfies React.CSSProperties,
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: "999px",
    background: "currentColor",
    opacity: 0.35,
    animation: "chatTypingDotBounce 1.1s infinite ease-in-out",
  } satisfies React.CSSProperties,
};
