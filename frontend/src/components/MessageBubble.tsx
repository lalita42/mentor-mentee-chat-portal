import type { Message, User } from "../types/index";

interface Props {
  message: Message;

  currentUser: User;

  onReply: (message: Message) => void;

  onDelete: (message: Message) => void;

  onPin: (message: Message) => void;

  onDoubt: (message: Message) => void;

  onAnnouncement: (message: Message) => void;

  onReport: (message: Message) => void;
}

function MessageBubble({
  message,
  currentUser,
  onReply,
  onDelete,
  onPin,
  onDoubt,
  onAnnouncement,
  onReport,
}: Props) {
  const senderId = message.senderId?._id || message.senderId?.id || "";

  const currentUserId = currentUser._id || currentUser.id || "";

  const isOwn = senderId === currentUserId;

  const senderName = message.senderId?.name || "Unknown";

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (message.deleted) {
    return (
      <div className={`message-row ${isOwn ? "own" : ""}`}>
        <div className="deleted-message">🚫 This message was deleted</div>
      </div>
    );
  }

  return (
    <div className={`message-row ${isOwn ? "own" : ""}`}>
      {!isOwn && (
        <div className="message-avatar">
          {senderName.charAt(0).toUpperCase()}
        </div>
      )}

      <div className={`message-bubble ${isOwn ? "own-bubble" : ""}`}>
        {!isOwn && <div className="sender-name">{senderName}</div>}

        {message.type === "ANNOUNCEMENT" && (
          <div className="announcement-label">📢 ANNOUNCEMENT</div>
        )}

        {message.replyTo && (
          <div className="reply-preview">
            <strong>Reply</strong>

            <span>{message.replyTo.content}</span>
          </div>
        )}

        {message.content && (
          <div className="message-content">{message.content}</div>
        )}

        {message.fileUrl && (
          <div className="file-message">
            {message.type === "IMAGE" ? (
              <img
                src={`http://localhost:4000${message.fileUrl}`}
                alt={message.fileName || "image"}
              />
            ) : (
              <a
                href={`http://localhost:4000${message.fileUrl}`}
                target="_blank"
                rel="noreferrer"
              >
                📄 {message.fileName || "Open PDF"}
              </a>
            )}
          </div>
        )}

        <div className="message-footer">
          <span>{time}</span>

          {message.pinned && <span title="Pinned">📌</span>}

          {message.doubt && <span title="Doubt">❓</span>}

          {message.resolved && <span title="Resolved">✅</span>}
        </div>

        <div className="message-actions">
          <button onClick={() => onReply(message)} title="Reply">
            ↩
          </button>

          {(currentUser.role === "ADMIN" || currentUser.role === "MENTOR") && (
            <>
              <button onClick={() => onPin(message)} title="Pin">
                📌
              </button>

              <button
                onClick={() => onAnnouncement(message)}
                title="Announcement"
              >
                📢
              </button>
            </>
          )}

          {currentUser.role === "MENTEE" && isOwn && (
            <button onClick={() => onDoubt(message)} title="Mark doubt">
              ❓
            </button>
          )}

          {(currentUser.role === "MENTOR" || currentUser.role === "ADMIN") &&
            message.doubt && (
              <button onClick={() => onDoubt(message)} title="Resolve">
                ✅
              </button>
            )}

          <button onClick={() => onReport(message)} title="Report">
            🚩
          </button>

          {isOwn && (
            <button onClick={() => onDelete(message)} title="Delete">
              🗑
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
