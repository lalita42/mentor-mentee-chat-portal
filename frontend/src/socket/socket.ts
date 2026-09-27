import { io } from "socket.io-client";

import { API_URL } from "../services/api";

// ==========================================
// SOCKET INSTANCE
// ==========================================

export const socket = io(API_URL, {
  autoConnect: false,
  transports: ["websocket"],
});

// ==========================================
// CONNECT SOCKET
// ==========================================

export function connectSocket() {
  const token =
    localStorage.getItem("token");

  console.log(
    "========== SOCKET CONNECT ==========",
  );

  console.log(
    "Socket URL:",
    API_URL,
  );

  console.log(
    "Token exists:",
    Boolean(token),
  );

  if (!token) {

    console.error(
      "❌ No token found. Socket will not connect.",
    );

    return;
  }

  // ========================================
  // AUTH TOKEN
  // ========================================

  socket.auth = {
    token,
  };

  // ========================================
  // CONNECT
  // ========================================

  if (!socket.connected) {

    socket.connect();

  }
}

// ==========================================
// DISCONNECT SOCKET
// ==========================================

export function disconnectSocket() {

  console.log(
    "========== SOCKET DISCONNECT ==========",
  );

  if (socket.connected) {

    socket.disconnect();

  }
}

// ==========================================
// SOCKET CONNECT EVENT
// ==========================================

socket.on(
  "connect",
  () => {

    console.log(
      "✅ Socket connected:",
      socket.id,
    );

    /*
     * Ask backend for current online users.
     *
     * Dashboard also requests this after
     * registering its listener.
     */

    socket.emit(
      "presence:get",
    );

  },
);

// ==========================================
// CONNECTION ERROR
// ==========================================

socket.on(
  "connect_error",
  (error) => {

    console.error(
      "❌ Socket connection error:",
      error.message,
    );

  },
);

// ==========================================
// DISCONNECT
// ==========================================

socket.on(
  "disconnect",
  (reason) => {

    console.log(
      "🔌 Socket disconnected:",
      reason,
    );

  },
);

// ==========================================
// GLOBAL PRESENCE LOG
// ==========================================

socket.on(
  "presence:update",
  (onlineUserIds: string[]) => {

    console.log(
      "👥 Online users:",
      onlineUserIds,
    );

  },
);