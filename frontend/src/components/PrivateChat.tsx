import { useEffect, useRef, useState } from "react";

import type { Message, User } from "../types";

import {
  getPrivateMessages,
  createMessage,
  deleteMessage,
  reportMessage,
} from "../services/api";

import { socket } from "../socket/socket";

import MessageBubble from "./MessageBubble";

interface Props {
  currentUser: User;
  otherUser: User;

  // true only when private chat is allowed
  // based on role + same-group membership
  isAllowedMentorChat?: boolean;

  // Real online status comes from Dashboard
  isOtherUserOnline: boolean;
}

function PrivateChat({
  currentUser,
  otherUser,
  isAllowedMentorChat = false,
  isOtherUserOnline,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);

  const [text, setText] = useState("");

  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const [loading, setLoading] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // USER IDS
  // ==========================================

  const otherId = otherUser._id || otherUser.id || "";

  const currentId = currentUser._id || currentUser.id || "";

  // ==========================================
  // CHAT PERMISSION
  // ==========================================

  const isSameUser =
    currentId !== "" &&
    otherId !== "" &&
    currentId === otherId;

  /*
   * ADMIN:
   * Admin can privately chat with users.
   *
   * MENTOR:
   * Can chat with MENTEE from same group.
   *
   * MENTEE:
   * Can chat with MENTOR from same group.
   */

  const canChat =
    !isSameUser &&
    (
      currentUser.role === "ADMIN"
        ? true
        : (
            (
              (currentUser.role === "MENTEE" &&
                otherUser.role === "MENTOR") ||
              (currentUser.role === "MENTOR" &&
                otherUser.role === "MENTEE")
            )
              ? isAllowedMentorChat
              : false
          )
    );

  // ==========================================
  // LOAD PRIVATE CHAT
  // ==========================================

  useEffect(() => {
    if (!canChat || !otherId) {
      setMessages([]);
      setLoading(false);

      return;
    }

    let mounted = true;

    // LOAD EXISTING MESSAGES
    loadMessages();

    // ========================================
    // SOCKET MESSAGE
    // ========================================

    const handleMessage = (message: Message) => {
      if (!mounted) {
        return;
      }

      const senderId =
        typeof message.senderId === "string"
          ? message.senderId
          : message.senderId?._id ||
            message.senderId?.id ||
            "";

      const recipientId =
        typeof message.recipientId === "string"
          ? message.recipientId
          : message.recipientId?._id ||
            message.recipientId?.id ||
            "";

      const isBetweenUsers =
        (senderId === otherId &&
          recipientId === currentId) ||
        (senderId === currentId &&
          recipientId === otherId);

      if (!isBetweenUsers) {
        return;
      }

      console.log(
        "PRIVATE SOCKET MESSAGE:",
        message,
      );

      setMessages((previous) => {
        const exists = previous.some(
          (item) => item._id === message._id,
        );

        if (exists) {
          return previous;
        }

        return [...previous, message];
      });
    };

    // ========================================
    // SOCKET EVENTS
    // ========================================

    socket.on("message:new", handleMessage);

    // ========================================
    // CLEANUP
    // ========================================

    return () => {
      mounted = false;

      socket.off(
        "message:new",
        handleMessage,
      );
    };
  }, [
    otherId,
    currentId,
    canChat,
    currentUser.role,
    otherUser.role,
  ]);

  // ==========================================
  // AUTO SCROLL
  // ==========================================

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ==========================================
  // LOAD MESSAGES
  // ==========================================

  async function loadMessages() {
    try {
      setLoading(true);

      const response =
        await getPrivateMessages(otherId);

      console.log(
        "PRIVATE MESSAGES:",
        response,
      );

      setMessages(
        Array.isArray(response)
          ? response
          : response?.messages || [],
      );
    } catch (error) {
      console.error(
        "Load private messages error:",
        error,
      );

      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // SEND MESSAGE
  // ==========================================

  async function sendMessage() {
    if (!canChat) {
      return;
    }

    const content = text.trim();

    if (!content) {
      return;
    }

    const data = {
      chatType: "PRIVATE",
      recipientId: otherId,
      type: "TEXT",
      content,

      ...(replyTo
        ? {
            replyTo: replyTo._id,
          }
        : {}),
    };

    try {
      console.log(
        "SENDING PRIVATE MESSAGE:",
        data,
      );

      const message =
        await createMessage(data);

      setMessages((previous) => {
        if (
          previous.some(
            (item) =>
              item._id === message._id,
          )
        ) {
          return previous;
        }

        return [...previous, message];
      });

      /*
       * Keep current socket behavior.
       *
       * Backend REST API already creates the
       * message. We don't create it again
       * through send_message here.
       */
      if (socket.connected) {
        socket.emit(
          "message:new",
          message,
        );
      }

      setText("");

      setReplyTo(null);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } catch (error: any) {
      console.error(
        "Send private message error:",
        error,
      );

      alert(
        error?.response?.data?.message ||
          "Message could not be sent",
      );
    }
  }

  // ==========================================
  // DELETE MESSAGE
  // ==========================================

  async function handleDelete(
    message: Message,
  ) {
    if (
      !window.confirm(
        "Delete this message?",
      )
    ) {
      return;
    }

    try {
      const updated =
        await deleteMessage(
          message._id,
        );

      setMessages((previous) =>
        previous.map((item) =>
          item._id === updated._id
            ? updated
            : item,
        ),
      );
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
          "Delete failed",
      );
    }
  }

  // ==========================================
  // REPORT MESSAGE
  // ==========================================

  async function handleReport(
    message: Message,
  ) {
    const reason = window.prompt(
      "Reason for report:",
    );

    if (!reason?.trim()) {
      return;
    }

    try {
      await reportMessage(
        message._id,
        reason.trim(),
      );

      alert("Message reported");
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
          "Report failed",
      );
    }
  }

  // ==========================================
  // UNUSED MESSAGE ACTIONS
  // ==========================================

  async function unusedAction(
    message: Message,
  ) {
    console.log(
      "Action not available in private chat:",
      message,
    );
  }

  // ==========================================
  // AVATAR
  // ==========================================

  const avatarLetter =
    otherUser.name
      ?.charAt(0)
      .toUpperCase() || "?";

  // ==========================================
  // DISPLAY ROLE
  // ==========================================

  const displayRole =
    otherUser.role === "MENTOR"
      ? "Mentor"
      : otherUser.role === "MENTEE"
        ? "Mentee"
        : otherUser.role;

  // ==========================================
  // NOT ALLOWED
  // ==========================================

  if (!canChat) {
    return (
      <div className="private-chat">
        <header className="private-chat-header">
          <div className="private-user">
            <div className="private-avatar">
              {avatarLetter}
            </div>

            <div className="private-user-details">
              <h2>{otherUser.name}</h2>

              <span>{displayRole}</span>
            </div>
          </div>
        </header>

        <div className="private-restricted">
          <div className="restricted-icon">
            🔒
          </div>

          <h3>
            Private chat unavailable
          </h3>

          <p>
            You can privately chat only with
            allowed users from your group.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PRIVATE CHAT UI
  // ==========================================

  return (
    <div className="private-chat">

      {/* ========================================
          HEADER
      ======================================== */}

      <header className="private-chat-header">

        <div className="private-user">

          {/* AVATAR + ONLINE DOT */}

          <div className="private-avatar-wrap">

            <div className="private-avatar">
              {avatarLetter}
            </div>

            <span
              className={`private-online-dot ${
                isOtherUserOnline
                  ? "online"
                  : "offline"
              }`}
            />

          </div>

          {/* USER DETAILS */}

          <div className="private-user-details">

            <h2>
              {otherUser.name}
            </h2>

            <span>
              {displayRole}
            </span>

          </div>

        </div>

        {/* ======================================
            HEADER ACTIONS
        ====================================== */}

        <div className="private-header-actions">

          {/* REAL ONLINE/OFFLINE STATUS */}

          <div
            className={`private-live-status ${
              isOtherUserOnline
                ? "online"
                : "offline"
            }`}
          >

            <span className="status-dot" />

            {isOtherUserOnline
              ? "Online"
              : "Offline"}

          </div>

          <button
            type="button"
            className="private-header-btn"
            title="More options"
          >
            ⋮
          </button>

        </div>

      </header>

      {/* ========================================
          CHAT INFO
      ======================================== */}

      <div className="private-chat-info">
        <span>🔒</span>
        Messages are private and secure
      </div>

      {/* ========================================
          MESSAGES
      ======================================== */}

      <div className="private-messages">

        {loading ? (

          <div className="private-loading">

            <div className="private-loading-spinner" />

            <span>
              Loading conversation...
            </span>

          </div>

        ) : messages.length === 0 ? (

          <div className="private-empty">

            <div className="private-empty-avatar">
              {avatarLetter}
            </div>

            <h3>
              Start a conversation
            </h3>

            <p>
              Send a private message to{" "}
              <strong>
                {otherUser.name}
              </strong>
            </p>

            <div className="private-empty-hint">
              Your conversation will appear
              here.
            </div>

          </div>

        ) : (

          <>

            <div className="private-date-divider">
              <span>Today</span>
            </div>

            {messages.map((message) => (

              <MessageBubble
                key={message._id}
                message={message}
                currentUser={currentUser}
                onReply={setReplyTo}
                onDelete={handleDelete}
                onPin={unusedAction}
                onDoubt={unusedAction}
                onAnnouncement={unusedAction}
                onReport={handleReport}
              />

            ))}

          </>

        )}

        <div ref={bottomRef} />

      </div>

      {/* ========================================
          REPLY PREVIEW
      ======================================== */}

      {replyTo && (

        <div className="private-reply-preview">

          <div className="private-reply-line" />

          <div className="private-reply-content">

            <div className="private-reply-title">
              Replying to{" "}
              <strong>
                {replyTo.senderId?.name ||
                  "message"}
              </strong>
            </div>

            <p>
              {replyTo.content}
            </p>

          </div>

          <button
            type="button"
            className="private-reply-close"
            onClick={() =>
              setReplyTo(null)
            }
            title="Cancel reply"
          >
            ×
          </button>

        </div>

      )}

      {/* ========================================
          COMPOSER
      ======================================== */}

      <div className="private-composer">

        <button
          type="button"
          className="private-attach-btn"
          title="Attach file"
        >
          +
        </button>

        <div className="private-input-box">

          <input
            ref={inputRef}
            value={text}
            onChange={(e) =>
              setText(e.target.value)
            }
            onKeyDown={(e) => {

              if (
                e.key === "Enter" &&
                !e.shiftKey
              ) {
                e.preventDefault();
                sendMessage();
              }

            }}
            placeholder={`Message ${otherUser.name}...`}
          />

          <span className="private-input-hint">
            Enter ↵
          </span>

        </div>

        <button
          type="button"
          className={`private-send-btn ${
            text.trim()
              ? "has-text"
              : ""
          }`}
          onClick={sendMessage}
          disabled={!text.trim()}
          title="Send message"
        >
          <span>➤</span>
        </button>

      </div>

    </div>
  );
}

export default PrivateChat;