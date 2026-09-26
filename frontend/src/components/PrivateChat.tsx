import { useEffect, useRef, useState } from "react";

import type { Message, User } from "../types";

import {
  getPrivateMessages,
  createMessage,
  deleteMessage,
  reportMessage,
} from "../services/api";

import { connectSocket, socket } from "../socket/socket";

import MessageBubble from "./MessageBubble";

interface Props {
  currentUser: User;
  otherUser: User;

  // true only when private chat is allowed
  // based on role + same-group membership
  isAllowedMentorChat?: boolean;
}

function PrivateChat({
  currentUser,
  otherUser,
  isAllowedMentorChat = false,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);

  const [text, setText] = useState("");

  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const [loading, setLoading] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // USER IDS
  // ==========================================

  const otherId = otherUser._id || otherUser.id || "";

  const currentId = currentUser._id || currentUser.id || "";

  // ==========================================
  // CHAT PERMISSION
  // ==========================================

  const isSameUser =
    currentId !== "" && otherId !== "" && currentId === otherId;

  const canChat =
    !isSameUser &&
    // ADMIN
    (currentUser.role === "ADMIN"
      ? true
      : // MENTEE -> MENTOR
        currentUser.role === "MENTEE" && otherUser.role === "MENTOR"
        ? isAllowedMentorChat
        : // MENTOR -> MENTEE
          currentUser.role === "MENTOR" && otherUser.role === "MENTEE"
          ? isAllowedMentorChat
          : false);

  // ==========================================
  // LOAD PRIVATE CHAT
  // ==========================================

  useEffect(() => {
    if (!canChat || !otherId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    loadMessages();

    // Connect socket
    if (!socket.connected) {
      connectSocket();
    }

    console.log("PRIVATE CHAT OPEN:", {
      currentId,
      otherId,
      currentRole: currentUser.role,
      otherRole: otherUser.role,
      canChat,
    });

    // ========================================
    // SOCKET MESSAGE
    // ========================================

    const handleMessage = (message: Message) => {
      const senderId =
        typeof message.senderId === "string"
          ? message.senderId
          : message.senderId?._id || message.senderId?.id || "";

      const recipientId =
        typeof message.recipientId === "string"
          ? message.recipientId
          : message.recipientId?._id || message.recipientId?.id || "";

      const isBetweenUsers =
        (senderId === otherId && recipientId === currentId) ||
        (senderId === currentId && recipientId === otherId);

      if (!isBetweenUsers) {
        return;
      }

      console.log("PRIVATE SOCKET MESSAGE:", message);

      setMessages((previous) => {
        const exists = previous.some((item) => item._id === message._id);

        if (exists) {
          return previous;
        }

        return [...previous, message];
      });
    };

    socket.on("message:new", handleMessage);

    // ========================================
    // CLEANUP
    // ========================================

    return () => {
      socket.off("message:new", handleMessage);
    };
  }, [otherId, currentId, canChat, currentUser.role, otherUser.role]);

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

      const response = await getPrivateMessages(otherId);

      console.log("PRIVATE MESSAGES:", response);

      setMessages(
        Array.isArray(response) ? response : response?.messages || [],
      );
    } catch (error: any) {
      console.error("Load private messages error:", error);

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
      alert("You are not allowed to chat with this user.");
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
      console.log("SENDING PRIVATE MESSAGE:", data);

      const message = await createMessage(data);

      setMessages((previous) => {
        if (previous.some((item) => item._id === message._id)) {
          return previous;
        }

        return [...previous, message];
      });

      // Send through socket
      if (socket.connected) {
        socket.emit("message:new", message);
      }

      setText("");
      setReplyTo(null);
    } catch (error: any) {
      console.error("Send private message error:", error);

      alert(error?.response?.data?.message || "Message could not be sent");
    }
  }

  // ==========================================
  // DELETE MESSAGE
  // ==========================================

  async function handleDelete(message: Message) {
    if (!window.confirm("Delete this message?")) {
      return;
    }

    try {
      const updated = await deleteMessage(message._id);

      setMessages((previous) =>
        previous.map((item) => (item._id === updated._id ? updated : item)),
      );
    } catch (error: any) {
      alert(error?.response?.data?.message || "Delete failed");
    }
  }

  // ==========================================
  // REPORT MESSAGE
  // ==========================================

  async function handleReport(message: Message) {
    const reason = window.prompt("Reason for report:");

    if (!reason?.trim()) {
      return;
    }

    try {
      await reportMessage(message._id, reason.trim());

      alert("Message reported");
    } catch (error: any) {
      alert(error?.response?.data?.message || "Report failed");
    }
  }

  // ==========================================
  // UNUSED MESSAGE ACTIONS
  // ==========================================

  async function unusedAction(message: Message) {
    console.log("Action not available in private chat:", message);
  }

  // ==========================================
  // NOT ALLOWED
  // ==========================================

  if (!canChat) {
    return (
      <div className="chat-container">
        <header className="chat-header">
          <div className="chat-person">
            <div className="avatar">
              {otherUser.name?.charAt(0).toUpperCase()}
            </div>

            <div>
              <h2>{otherUser.name}</h2>

              <span>{otherUser.role}</span>
            </div>
          </div>
        </header>

        <div className="empty-chat">
          <div>🔒</div>

          <h3>Private chat unavailable</h3>

          <p>You can privately chat only with users from your allowed group.</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PRIVATE CHAT UI
  // ==========================================

  return (
    <div className="chat-container">
      {/* HEADER */}

      <header className="chat-header">
        <div className="chat-person">
          <div className="avatar">
            {otherUser.name?.charAt(0).toUpperCase()}
          </div>

          <div>
            <h2>{otherUser.name}</h2>

            <span>{otherUser.role} • Private Chat</span>
          </div>
        </div>

        <div className="chat-header-right">
          <span className="connection-status">🟢 LIVE</span>
        </div>
      </header>

      {/* MESSAGES */}

      <div className="messages-area">
        {loading ? (
          <div className="loading">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="empty-chat">
            <div>💬</div>

            <h3>Start private chat</h3>

            <p>Send a message to {otherUser.name}</p>
          </div>
        ) : (
          messages.map((message) => (
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
          ))
        )}

        <div ref={bottomRef} />
      </div>

      {/* REPLY */}

      {replyTo && (
        <div className="reply-bar">
          <div>
            <strong>Replying to {replyTo.senderId?.name}</strong>

            <p>{replyTo.content}</p>
          </div>

          <button type="button" onClick={() => setReplyTo(null)}>
            ✕
          </button>
        </div>
      )}

      {/* COMPOSER */}

      <div className="message-composer">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type private message..."
        />

        <button type="button" className="send-btn" onClick={sendMessage}>
          ➤
        </button>
      </div>
    </div>
  );
}

export default PrivateChat;
