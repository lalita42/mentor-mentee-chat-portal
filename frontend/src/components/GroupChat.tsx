import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  Group,
  Message,
  User,
} from "../types";

import {
  addMember,
  createMessage,
  deleteMessage,
  getGroup,
  getGroupMessages,
  reportMessage,
  toggleAnnouncement,
  toggleDoubt,
  togglePin,
  uploadFile,
} from "../services/api";

import {
  connectSocket,
  socket,
} from "../socket/socket";

import MessageBubble from "./MessageBubble";

interface Props {
  group: Group;
  currentUser: User;
  onPrivateSelect: (user: User) => void;
}

function GroupChat({
  group,
  currentUser,
  onPrivateSelect,
}: Props) {
  const [messages, setMessages] =
    useState<Message[]>([]);

  const [text, setText] =
    useState("");

  const [replyTo, setReplyTo] =
    useState<Message | null>(null);

  const [typing, setTyping] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [showMembers, setShowMembers] =
    useState(false);

  const [groupData, setGroupData] =
    useState<Group>(group);

  const bottomRef =
    useRef<HTMLDivElement>(null);

  const fileRef =
    useRef<HTMLInputElement>(null);

  // ==========================================
  // GROUP ID
  // ==========================================

  const groupId =
    groupData._id ||
    group._id ||
    "";

  // ==========================================
  // CURRENT USER ID
  // ==========================================

  const currentUserId =
    currentUser._id ||
    currentUser.id ||
    "";

  // ==========================================
  // LOAD GROUP + MESSAGES + SOCKET
  // ==========================================

  useEffect(() => {
    if (!groupId) {
      return;
    }

    loadGroup();
    loadMessages();

    connectSocket();

    // ========================================
    // JOIN GROUP
    // ========================================

    socket.emit("join_group", {
      groupId,
    });

    console.log(
      "JOINED GROUP:",
      groupId,
    );

    // ========================================
    // NEW MESSAGE
    // ========================================

    const handleMessage = (
      message: Message,
    ) => {
      console.log(
        "SOCKET NEW MESSAGE:",
        message,
      );

      let incomingGroupId = "";

      if (
        typeof message.groupId ===
        "string"
      ) {
        incomingGroupId =
          message.groupId;
      } else if (
        message.groupId &&
        typeof message.groupId ===
          "object"
      ) {
        incomingGroupId = String(
          (message.groupId as any)
            ._id,
        );
      }

      if (
        incomingGroupId !==
        groupId
      ) {
        return;
      }

      setMessages((previous) => {
        const exists =
          previous.some(
            (item) =>
              item._id ===
              message._id,
          );

        if (exists) {
          return previous;
        }

        return [
          ...previous,
          message,
        ];
      });
    };

    // ========================================
    // TYPING
    // ========================================

    const handleTyping = (
      data: any,
    ) => {
      if (
        data?.userId &&
        data.userId !==
          currentUserId
      ) {
        setTyping(
          Boolean(
            data.isTyping,
          ),
        );
      }
    };

    socket.on(
      "message:new",
      handleMessage,
    );

    socket.on(
      "typing",
      handleTyping,
    );

    // ========================================
    // CLEANUP
    // ========================================

    return () => {
      socket.emit(
        "leave_group",
        {
          groupId,
        },
      );

      socket.off(
        "message:new",
        handleMessage,
      );

      socket.off(
        "typing",
        handleTyping,
      );

      console.log(
        "LEFT GROUP:",
        groupId,
      );
    };
  }, [
    groupId,
    currentUserId,
  ]);

  // ==========================================
  // UPDATE GROUP WHEN PROP CHANGES
  // ==========================================

  useEffect(() => {
    setGroupData(group);
  }, [group]);

  // ==========================================
  // AUTO SCROLL
  // ==========================================

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ==========================================
  // LOAD GROUP
  // ==========================================

  async function loadGroup() {
    try {
      const data =
        await getGroup(groupId);

      console.log(
        "GROUP DETAILS:",
        data,
      );

      setGroupData(data);
    } catch (error: any) {
      console.error(
        "LOAD GROUP ERROR:",
        error,
      );

      console.error(
        "SERVER:",
        error?.response?.data,
      );
    }
  }

  // ==========================================
  // LOAD MESSAGES
  // ==========================================

  async function loadMessages() {
    try {
      setLoading(true);

      const data =
        await getGroupMessages(
          groupId,
        );

      console.log(
        "GROUP MESSAGES:",
        data,
      );

      if (Array.isArray(data)) {
        setMessages(data);
      } else if (
        data &&
        Array.isArray(
          data.messages,
        )
      ) {
        setMessages(
          data.messages,
        );
      } else {
        setMessages([]);
      }
    } catch (error: any) {
      console.error(
        "LOAD GROUP MESSAGES ERROR:",
        error,
      );

      console.error(
        "SERVER:",
        error?.response?.data,
      );

      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // TYPING
  // ==========================================

  function handleTyping(
    value: string,
  ) {
    setText(value);

    socket.emit(
      "typing",
      {
        room: `group:${groupId}`,
        groupId,
        isTyping:
          value.length > 0,
      },
    );
  }

  // ==========================================
  // SEND MESSAGE
  // ==========================================

  async function sendMessage() {
    const content =
      text.trim();

    if (!content) {
      return;
    }

    const data = {
      chatType: "GROUP",
      groupId,
      type: "TEXT",
      content,

      ...(replyTo
        ? {
            replyTo:
              replyTo._id,
          }
        : {}),
    };

    try {
      console.log(
        "SENDING GROUP MESSAGE:",
        data,
      );

      if (!socket.connected) {
        connectSocket();
      }

      socket.emit(
        "send_message",
        data,
        (message: Message) => {
          console.log(
            "SOCKET MESSAGE RESPONSE:",
            message,
          );

          if (!message) {
            return;
          }

          setMessages(
            (previous) => {
              if (
                previous.some(
                  (item) =>
                    item._id ===
                    message._id,
                )
              ) {
                return previous;
              }

              return [
                ...previous,
                message,
              ];
            },
          );
        },
      );

      setText("");
      setReplyTo(null);

      socket.emit(
        "typing",
        {
          room: `group:${groupId}`,
          groupId,
          isTyping: false,
        },
      );
    } catch (error) {
      console.error(
        "SOCKET SEND ERROR:",
        error,
      );

      // REST fallback
      try {
        const message =
          await createMessage(
            data,
          );

        setMessages(
          (previous) => {
            if (
              previous.some(
                (item) =>
                  item._id ===
                  message._id,
              )
            ) {
              return previous;
            }

            return [
              ...previous,
              message,
            ];
          },
        );

        setText("");
        setReplyTo(null);
      } catch (
        fallbackError: any
      ) {
        console.error(
          "REST MESSAGE ERROR:",
          fallbackError,
        );

        alert(
          fallbackError?.response
            ?.data?.message ||
            "Message could not be sent",
        );
      }
    }
  }

  // ==========================================
  // DELETE MESSAGE
  // ==========================================

  async function handleDelete(
    message: Message,
  ) {
    const confirmed =
      window.confirm(
        "Delete this message?",
      );

    if (!confirmed) {
      return;
    }

    try {
      const updated =
        await deleteMessage(
          message._id,
        );

      setMessages(
        (previous) =>
          previous.map(
            (item) =>
              item._id ===
              updated._id
                ? updated
                : item,
          ),
      );

      socket.emit(
        "message:new",
        updated,
      );
    } catch (error: any) {
      alert(
        error?.response?.data
          ?.message ||
          "Cannot delete message",
      );
    }
  }

  // ==========================================
  // PIN
  // ==========================================

  async function handlePin(
    message: Message,
  ) {
    try {
      const updated =
        await togglePin(
          message._id,
        );

      setMessages(
        (previous) =>
          previous.map(
            (item) =>
              item._id ===
              updated._id
                ? updated
                : item,
          ),
      );
    } catch (error: any) {
      alert(
        error?.response?.data
          ?.message ||
          "Cannot pin message",
      );
    }
  }

  // ==========================================
  // DOUBT
  // ==========================================

  async function handleDoubt(
    message: Message,
  ) {
    try {
      const updated =
        await toggleDoubt(
          message._id,
        );

      setMessages(
        (previous) =>
          previous.map(
            (item) =>
              item._id ===
              updated._id
                ? updated
                : item,
          ),
      );
    } catch (error: any) {
      alert(
        error?.response?.data
          ?.message ||
          "Cannot update doubt",
      );
    }
  }

  // ==========================================
  // ANNOUNCEMENT
  // ==========================================

  async function handleAnnouncement(
    message: Message,
  ) {
    try {
      const updated =
        await toggleAnnouncement(
          message._id,
        );

      setMessages(
        (previous) =>
          previous.map(
            (item) =>
              item._id ===
              updated._id
                ? updated
                : item,
          ),
      );
    } catch (error: any) {
      alert(
        error?.response?.data
          ?.message ||
          "Cannot create announcement",
      );
    }
  }

  // ==========================================
  // REPORT
  // ==========================================

  async function handleReport(
    message: Message,
  ) {
    const reason =
      window.prompt(
        "Why are you reporting this message?",
      );

    if (!reason?.trim()) {
      return;
    }

    try {
      await reportMessage(
        message._id,
        reason.trim(),
      );

      alert(
        "Message reported",
      );
    } catch (error: any) {
      alert(
        error?.response?.data
          ?.message ||
          "Report failed",
      );
    }
  }

  // ==========================================
  // FILE
  // ==========================================

  async function handleFile(
    file: File,
  ) {
    if (
      file.size >
      5 * 1024 * 1024
    ) {
      alert(
        "Maximum file size is 5 MB",
      );

      return;
    }

    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (
      !allowed.includes(
        file.type,
      )
    ) {
      alert(
        "Only JPG, PNG, WEBP and PDF allowed",
      );

      return;
    }

    try {
      const draft =
        await createMessage({
          chatType: "GROUP",
          groupId,

          type:
            file.type ===
            "application/pdf"
              ? "PDF"
              : "IMAGE",

          content: "",
        });

      const uploaded =
        await uploadFile(
          draft._id,
          file,
        );

      setMessages(
        (previous) => {
          if (
            previous.some(
              (item) =>
                item._id ===
                uploaded._id,
            )
          ) {
            return previous;
          }

          return [
            ...previous,
            uploaded,
          ];
        },
      );
    } catch (error: any) {
      console.error(
        "FILE UPLOAD ERROR:",
        error,
      );

      alert(
        error?.response?.data
          ?.message ||
          "File upload failed",
      );
    }
  }

  // ==========================================
  // ADD MEMBER
  // ==========================================

  async function handleAddMember(
    userId: string,
  ) {
    if (
      currentUser.role !==
      "ADMIN"
    ) {
      alert(
        "Only admin can add members.",
      );

      return;
    }

    try {
      const updated =
        await addMember(
          groupId,
          userId,
        );

      setGroupData(updated);

      alert(
        "Member added successfully",
      );
    } catch (error: any) {
      alert(
        error?.response?.data
          ?.message ||
          "Cannot add member",
      );
    }
  }

  // ==========================================================
  // PRIVATE CHAT PERMISSION
  // ==========================================================

  function canPrivateChatWith(
    member: User,
  ) {
    const memberId =
      member._id ||
      member.id ||
      "";

    // No ID
    if (!memberId) {
      return false;
    }

    // Cannot chat with yourself
    if (
      String(memberId) ===
      String(currentUserId)
    ) {
      return false;
    }

    // ADMIN can chat with group members
    if (
      currentUser.role ===
      "ADMIN"
    ) {
      return true;
    }

    // MENTOR can chat with MENTEE
    if (
      currentUser.role ===
      "MENTOR"
    ) {
      return (
        member.role ===
        "MENTEE"
      );
    }

    // MENTEE can chat with MENTOR
    if (
      currentUser.role ===
      "MENTEE"
    ) {
      return (
        member.role ===
        "MENTOR"
      );
    }

    return false;
  }

  // ==========================================================
  // PRIVATE CHAT USERS
  //
  // IMPORTANT:
  // groupData.members means only members of THIS GROUP.
  // ==========================================================

  const privateChatUsers =
    groupData.members?.filter(
      (member) =>
        canPrivateChatWith(
          member,
        ),
    ) || [];

  // ==========================================
  // OPEN PRIVATE CHAT
  // ==========================================

  function openPrivateChat(
    person: User,
  ) {
    console.log(
      "OPEN PRIVATE CHAT WITH:",
      person,
    );

    if (
      !canPrivateChatWith(
        person,
      )
    ) {
      console.warn(
        "PRIVATE CHAT NOT ALLOWED",
      );

      return;
    }

    onPrivateSelect(person);
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="chat-container">

      {/* =================================================
          CENTER CHAT
      ================================================= */}

      <div className="chat-main-column">

        {/* HEADER */}

        <header className="chat-header">

          <div className="chat-person">

            <div className="avatar">
              #
            </div>

            <div>
              <h2>
                {groupData.name}
              </h2>

              <span>
                {groupData.members
                  ?.length || 0}{" "}
                members • Quant +
                Reasoning Sprint
              </span>
            </div>

          </div>

          <div className="chat-header-right">

            <span className="connection-status">
              🟢 LIVE
            </span>

            <button
              className="header-btn"
              onClick={() =>
                setShowMembers(
                  (previous) =>
                    !previous,
                )
              }
            >
              •••
            </button>

          </div>

        </header>

        {/* =================================================
            PINNED MESSAGE
        ================================================= */}

        {(() => {
          const pinnedMessage =
            messages.find(
              (message) =>
                message.pinned &&
                !message.deleted,
            );

          return (
            <div className="pinned-bar">

              <span className="pin-icon">
                ⚑
              </span>

              <div className="pinned-content">

                <strong>
                  Pinned
                </strong>

                <span>
                  {" "}
                  •{" "}
                  {pinnedMessage
                    ? pinnedMessage.content
                    : "Welcome to the batch. Drop your questions here and I'll keep the important links pinned."}
                </span>

              </div>

              <button>
                VIEW
              </button>

            </div>
          );
        })()}

        {/* =================================================
            MESSAGES
        ================================================= */}

        <div className="messages-area">

          {loading ? (
            <div className="loading">
              Loading messages...
            </div>
          ) : messages.length ===
            0 ? (
            <div className="empty-chat">

              <div className="empty-chat-icon">
                💬
              </div>

              <h3>
                No messages yet
              </h3>

              <p>
                Start the conversation
              </p>

            </div>
          ) : (
            messages.map(
              (message) => (
                <MessageBubble
                  key={
                    message._id
                  }
                  message={
                    message
                  }
                  currentUser={
                    currentUser
                  }
                  onReply={
                    setReplyTo
                  }
                  onDelete={
                    handleDelete
                  }
                  onPin={
                    handlePin
                  }
                  onDoubt={
                    handleDoubt
                  }
                  onAnnouncement={
                    handleAnnouncement
                  }
                  onReport={
                    handleReport
                  }
                />
              ),
            )
          )}

          {typing && (
            <div className="typing">
              Someone is typing...
            </div>
          )}

          <div
            ref={bottomRef}
          />

        </div>

        {/* =================================================
            REPLY BAR
        ================================================= */}

        {replyTo && (
          <div className="reply-bar">

            <div>

              <strong>
                Replying to{" "}
                {
                  replyTo
                    .senderId
                    ?.name
                }
              </strong>

              <p>
                {
                  replyTo.content
                }
              </p>

            </div>

            <button
              onClick={() =>
                setReplyTo(null)
              }
            >
              ✕
            </button>

          </div>
        )}

        {/* =================================================
            COMPOSER
        ================================================= */}

        <div className="message-composer">

          <input
            type="file"
            ref={fileRef}
            hidden
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={(event) => {
              const file =
                event.target
                  .files?.[0];

              if (file) {
                handleFile(
                  file,
                );
              }

              event.target.value =
                "";
            }}
          />

          <button
            className="icon-btn"
            onClick={() =>
              fileRef.current?.click()
            }
          >
            📎
          </button>

          <input
            value={text}
            onChange={(event) =>
              handleTyping(
                event.target.value,
              )
            }
            onKeyDown={(event) => {
              if (
                event.key ===
                  "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();

                sendMessage();
              }
            }}
            placeholder="Write a message..."
          />

          <button
            className="send-btn"
            onClick={
              sendMessage
            }
          >
            ➤
          </button>

        </div>

        {/* =================================================
            COMPOSER OPTIONS
        ================================================= */}

        <div className="chat-options">

          <button
            onClick={() => {
              const lastMessage =
                messages[
                  messages.length -
                    1
                ];

              if (lastMessage) {
                handleDoubt(
                  lastMessage,
                );
              }
            }}
          >
            ◉ MARK AS DOUBT
          </button>

          {currentUser.role ===
            "MENTOR" && (
            <button
              onClick={() => {
                const lastMessage =
                  messages[
                    messages.length -
                      1
                  ];

                if (
                  lastMessage
                ) {
                  handleAnnouncement(
                    lastMessage,
                  );
                }
              }}
            >
              ♧ ANNOUNCEMENT
            </button>
          )}

          <span className="composer-hint">
            Enter to send • Shift
            + Enter for a new line
          </span>

        </div>

      </div>

      {/* =================================================
          RIGHT TOOLKIT
      ================================================= */}

      <aside className="mentor-toolkit">

        <div className="toolkit-heading">
          GROUP TOOLKIT
        </div>

        {/* =================================================
            DOUBT HUB
        ================================================= */}

        <div className="toolkit-card doubt-card">

          <div className="toolkit-card-title">

            <span>
              ◉ Doubt hub
            </span>

            <span className="count-badge">
              {
                messages.filter(
                  (message) =>
                    message.doubt &&
                    !message.resolved &&
                    !message.deleted,
                ).length
              }
            </span>

          </div>

          <p className="toolkit-description">
            Questions that still
            need a mentor response.
          </p>

          {(() => {
            const openDoubt =
              messages.find(
                (message) =>
                  message.doubt &&
                  !message.resolved &&
                  !message.deleted,
              );

            if (!openDoubt) {
              return (
                <div className="no-doubt">
                  No open doubts 🎉
                </div>
              );
            }

            return (
              <>
                <div className="doubt-message">
                  {
                    openDoubt.content
                  }
                </div>

                <button
                  className="jump-thread"
                  onClick={() => {
                    document
                      .getElementById(
                        `message-${openDoubt._id}`,
                      )
                      ?.scrollIntoView({
                        behavior:
                          "smooth",
                      });
                  }}
                >
                  JUMP TO THREAD →
                </button>
              </>
            );
          })()}

        </div>

        {/* =================================================
            PRIVATE CHAT
        ================================================= */}

        <div className="toolkit-card">

          <div className="toolkit-card-title">

            <span>
              💬 Private chat
            </span>

            <span className="count-badge">
              {
                privateChatUsers.length
              }
            </span>

          </div>

          <p className="toolkit-description">

            {currentUser.role ===
            "MENTOR"
              ? "Chat privately with your mentees from this group."
              : currentUser.role ===
                  "MENTEE"
                ? "Chat privately with your mentor from this group."
                : "Chat privately with group members."}

          </p>

          <div className="roster-list">

            {privateChatUsers.length ===
            0 ? (
              <div className="no-doubt">
                No private chat users
                available.
              </div>
            ) : (
              privateChatUsers.map(
                (member) => {
                  const memberId =
                    member._id ||
                    member.id ||
                    "";

                  return (
                    <div
                      className="roster-item"
                      key={memberId}
                    >

                      {/* AVATAR */}

                      <div className="avatar small">
                        {member.name
                          ?.charAt(
                            0,
                          )
                          .toUpperCase() ||
                          "U"}
                      </div>

                      {/* NAME */}

                      <div className="roster-info">

                        <strong>
                          {
                            member.name
                          }
                        </strong>

                        <span>
                          {member.role ===
                          "MENTOR"
                            ? "Mentor"
                            : member.role ===
                                "MENTEE"
                              ? "Mentee"
                              : "Admin"}
                        </span>

                      </div>

                      {/* CHAT */}

                      <button
                        type="button"
                        className="roster-chat"
                        onClick={() =>
                          openPrivateChat(
                            member,
                          )
                        }
                      >
                        💬 Chat
                      </button>

                    </div>
                  );
                },
              )
            )}

          </div>

        </div>

        {/* =================================================
            BUILT FOR SIGNAL
        ================================================= */}

        <div className="toolkit-card">

          <div className="toolkit-card-title">
            <span>
              ▣ Built for signal
            </span>
          </div>

          <p className="toolkit-description">
            Announcements, pins,
            replies, files, and
            resolved doubts keep
            the group useful.
          </p>

        </div>

        {/* =================================================
            GROUP STATS
        ================================================= */}

        <div className="toolkit-card stats-card">

          <div className="stat-row">

            <span>
              Messages
            </span>

            <strong>
              {
                messages.length
              }
            </strong>

          </div>

          <div className="stat-row">

            <span>
              Pinned
            </span>

            <strong>
              {
                messages.filter(
                  (message) =>
                    message.pinned &&
                    !message.deleted,
                ).length
              }
            </strong>

          </div>

          <div className="stat-row">

            <span>
              Open doubts
            </span>

            <strong>
              {
                messages.filter(
                  (message) =>
                    message.doubt &&
                    !message.resolved &&
                    !message.deleted,
                ).length
              }
            </strong>

          </div>

        </div>

      </aside>

      {/* =================================================
          MEMBERS SIDE MODAL
      ================================================= */}

      {showMembers && (
        <div className="side-modal">

          <div className="modal-header">

            <h3>
              Group Members
            </h3>

            <button
              onClick={() =>
                setShowMembers(false)
              }
            >
              ✕
            </button>

          </div>

          {groupData.members?.map(
            (member) => {
              const memberId =
                member._id ||
                member.id ||
                "";

              const isSelf =
                String(
                  memberId,
                ) ===
                String(
                  currentUserId,
                );

              /*
               * IMPORTANT:
               *
               * MENTOR -> MENTEE
               * MENTEE -> MENTOR
               * ADMIN -> anyone
               */

              const canShowChat =
                !isSelf &&
                canPrivateChatWith(
                  member,
                );

              return (
                <div
                  className="roster-item"
                  key={memberId}
                >

                  {/* AVATAR */}

                  <div className="avatar small">
                    {member.name
                      ?.charAt(
                        0,
                      )
                      .toUpperCase() ||
                      "U"}
                  </div>

                  {/* NAME + ROLE */}

                  <div className="roster-info">

                    <strong>
                      {member.name}
                    </strong>

                    <span>
                      {member.role ===
                      "MENTOR"
                        ? "Mentor"
                        : member.role ===
                            "MENTEE"
                          ? "Mentee"
                          : "Admin"}
                    </span>

                  </div>

                  {/* CHAT BUTTON */}

                  {canShowChat && (
                    <button
                      type="button"
                      className="roster-chat-btn"
                      onClick={() => {
                        setShowMembers(
                          false,
                        );

                        openPrivateChat(
                          member,
                        );
                      }}
                    >
                      💬 Chat
                    </button>
                  )}

                </div>
              );
            },
          )}

          {currentUser.role ===
            "ADMIN" && (
            <div className="add-member-area">

              <p>
                Add or remove
                members using admin
                controls.
              </p>

            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default GroupChat;