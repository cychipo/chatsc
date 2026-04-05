import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Button, Input, Modal, Spin, Typography } from "antd";
import {
  Search,
  Ellipsis,
  UserRound,
  Shield,
  Cpu,
  Menu,
  Plus,
  Settings,
  Phone,
  BookUser,
  MessagesSquare,
} from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { searchUsers } from "../../services/auth.service";
import {
  createConversation,
  deleteConversation,
  getMembershipEvents,
  getMessages,
  leaveConversation,
  listConversations,
  sendMessage,
} from "../../services/chat.service";
import type { SearchableUser } from "../../types/auth";
import type { Conversation, MembershipEvent, Message } from "../../types/chat";
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
};

type ConversationContextMenuState = {
  conversationId: string;
  x: number;
  y: number;
};

export function ChatPage() {
  const { currentUser } = useAuthStore();
  const [state, setState] = useState<ChatState>({
    conversations: [],
    selectedConversationId: null,
    messages: [],
    membershipEvents: [],
    loadingConversations: true,
    loadingMessages: false,
    sendingMessage: false,
    hasMoreMessages: true,
  });
  const [inputValue, setInputValue] = useState("");
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<SearchableUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchableUser | null>(null);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [startingConversation, setStartingConversation] = useState(false);
  const [contextMenu, setContextMenu] =
    useState<ConversationContextMenuState | null>(null);
  const messageThreadRef = useRef<HTMLDivElement>(null);

  const palette = {
    page: "linear-gradient(180deg, #fbf4ea 0%, #fff8f1 100%)",
    shell: "rgba(255, 252, 247, 0.82)",
    text: "#431407",
    textMuted: "rgba(67, 20, 7, 0.55)",
    border: "rgba(154, 52, 18, 0.12)",
  };

  useEffect(() => {
    void loadConversations();
  }, []);

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
    const handleWindowClick = () => setContextMenu(null);

    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

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

  const loadConversations = async () => {
    try {
      const conversations = await listConversations();
      setState((prev) => ({
        ...prev,
        conversations,
        loadingConversations: false,
      }));
      if (!state.selectedConversationId && conversations[0]) {
        await selectConversation(conversations[0]._id);
      }
    } catch {
      setState((prev) => ({ ...prev, loadingConversations: false }));
    }
  };

  const selectConversation = async (conversationId: string) => {
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
        messages: messages.reverse(),
        membershipEvents,
        loadingMessages: false,
        hasMoreMessages: messages.length >= 10,
      }));
    } catch {
      setState((prev) => ({ ...prev, loadingMessages: false }));
    }
  };

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
        messages: [...olderMessages.reverse(), ...prev.messages],
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
    if (
      !inputValue.trim() ||
      !state.selectedConversationId ||
      state.sendingMessage
    )
      return;

    setState((prev) => ({ ...prev, sendingMessage: true }));
    try {
      const message = await sendMessage(
        state.selectedConversationId,
        inputValue.trim(),
      );
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, message],
        sendingMessage: false,
      }));
      setInputValue("");
    } catch {
      setState((prev) => ({ ...prev, sendingMessage: false }));
    }
  };

  const handleLeave = async () => {
    if (!state.selectedConversationId) return;
    try {
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
    selectedConversation?.displayTitle || selectedConversation?.title || "Đoạn chat";

  return (
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
        <main style={styles.workspaceSimple}>
          <aside style={{ ...styles.sidebarSimple, ...styles.glass(palette) }}>
            <div style={styles.profileBlock}>
              <Avatar size={48} src={currentUser?.avatarUrl} style={styles.profileAvatar}>
                {currentUser?.displayName?.charAt(0).toUpperCase() ?? "U"}
              </Avatar>
              <div>
                <Typography.Text style={styles.profileName as never}>
                  {currentUser?.displayName ?? "Người dùng"}
                </Typography.Text>
                <Typography.Text style={styles.profileStatus as never}>
                  @{currentUser?.username ?? "unknown"} · {currentUser?.email ?? ""}
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

            <div style={styles.sidebarSection}>
              <Typography.Text style={styles.sidebarLabel as never}>
                Đoạn chat gần đây
              </Typography.Text>
              {state.loadingConversations ? (
                <Spin />
              ) : (
                <ConversationList
                  conversations={state.conversations}
                  selectedId={state.selectedConversationId}
                  onSelect={selectConversation}
                  onContextMenu={handleConversationContextMenu}
                />
              )}
            </div>

            <button type="button" style={styles.settingsRow}>
              <Settings size={16} />
              <span>Cài đặt</span>
            </button>
          </aside>

          <section
            style={{ ...styles.chatMainSimple, ...styles.glass(palette) }}
          >
            <header style={styles.chatHeaderSimple}>
              <div style={styles.chatHeaderLeftSimple}>
                <Button type="text" shape="circle" icon={<Menu size={18} />} />
                <Avatar size={42} style={styles.chatHeaderAvatar}>
                  E
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
                  <Typography.Text
                    style={{ color: palette.textMuted, fontSize: 13 }}
                  >
                    Đang nhập...
                  </Typography.Text>
                </div>
              </div>
              <div style={styles.heroActions}>
                <Button
                  type="text"
                  shape="circle"
                  icon={<Search size={16} />}
                />
                <Button
                  type="text"
                  shape="circle"
                  icon={<Ellipsis size={16} />}
                />
              </div>
            </header>

            <div
              ref={messageThreadRef}
              onScroll={handleScroll}
              style={styles.messageStreamSimple}
            >
              <div style={styles.dayBadge}>Hôm nay</div>
              {state.loadingMessages && combinedTimeline.length === 0 ? (
                <Spin />
              ) : (
                combinedTimeline.map((item, index) =>
                  item.kind === "event" ? (
                    <EventBubble key={`event-${index}`} event={item.event} />
                  ) : (
                    <MessageBubble
                      key={item.message._id}
                      message={item.message}
                      isMine={item.message.senderId === currentUser?.id}
                      authorName={
                        item.message.senderId === currentUser?.id
                          ? currentUser?.displayName ?? "Bạn"
                          : selectedConversation?.directPeer?.displayName ??
                            selectedConversation?.displayTitle ??
                            "Người dùng"
                      }
                    />
                  ),
                )
              )}
            </div>

            <ChatComposer
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
              onLeave={handleLeave}
              loading={state.sendingMessage}
              disabled={!state.selectedConversationId || state.sendingMessage}
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
              onClick={() => void handleDeleteConversation(contextMenu.conversationId)}
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
                        <Typography.Text style={styles.searchResultName as never}>
                          {user.displayName}
                        </Typography.Text>
                        <Typography.Text style={styles.searchResultInfo as never}>
                          @{user.username}
                        </Typography.Text>
                        <Typography.Text style={styles.searchResultInfo as never}>
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
      </div>
    </div>
  );
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
    gridTemplateRows: "auto 1fr auto auto",
    gap: 14,
    borderRadius: 34,
    padding: 22,
    minHeight: 0,
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
  bottomTabs: {
    display: "flex",
    gap: 10,
    justifyContent: "space-between",
    paddingTop: 2,
  } satisfies React.CSSProperties,
  bottomTab: {
    border: "none",
    background: "transparent",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "#8d7168",
    fontSize: 13,
    fontWeight: 600,
    padding: "8px 10px",
    borderRadius: 999,
    whiteSpace: "nowrap",
  } satisfies React.CSSProperties,
  bottomTabActive: {
    color: "#c2410c",
    background: "rgba(255, 241, 237, 0.85)",
  } satisfies React.CSSProperties,
};
