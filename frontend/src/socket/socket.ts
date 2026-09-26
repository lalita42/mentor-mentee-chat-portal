import { io } from "socket.io-client";

import { API_URL } from "../services/api";

export const socket = io(API_URL, {
  autoConnect: false,
  transports: ["websocket"],
});

export function connectSocket() {
  const token = localStorage.getItem("token");

  console.log("========== SOCKET CONNECT ==========");
  console.log("Socket URL:", API_URL);
  console.log("Token exists:", Boolean(token));

  if (!token) {
    console.error("❌ No token found. Socket will not connect.");
    return;
  }

  socket.auth = {
    token,
  };

  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket() {
  console.log("========== SOCKET DISCONNECT ==========");

  if (socket.connected) {
    socket.disconnect();
  }
}

socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("❌ Socket connection error:", error.message);
});

socket.on("disconnect", (reason) => {
  console.log("🔌 Socket disconnected:", reason);
});
