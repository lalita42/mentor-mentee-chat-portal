import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    console.log("========== API REQUEST ==========");

    console.log("URL:", `${API_URL}${config.url}`);

    console.log("TOKEN EXISTS:", Boolean(token));

    console.log("AUTH HEADER:", token ? "Bearer token attached" : "NO TOKEN");

    if (token) {
      config.headers = config.headers || {};

      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// AUTH

export interface LoginData {
  email: string;
  password: string;
}

export async function login(data: LoginData) {
  const response = await api.post("/auth/login", data);

  console.log("AUTH API RESPONSE:", response.data);

  return response.data;
}

export async function signup(data: {
  name: string;
  email: string;
  password: string;
  role: string;
  adminCode?: string;
}) {
  const response = await api.post("/auth/signup", data);
  return response.data;
}

// USERS

export async function getUsers(role?: string) {
  const response = await api.get("/users", {
    params: role ? { role } : {},
  });

  return response.data;
}

// GROUPS

export async function getGroups() {
  const response = await api.get("/groups");
  return response.data;
}

export async function getGroup(groupId: string) {
  const response = await api.get(`/groups/${groupId}`);
  return response.data;
}

export async function createGroup(name: string, memberIds: string[]) {
  const response = await api.post("/groups", {
    name,
    memberIds,
  });

  return response.data;
}
export async function updateGroup(
  groupId: string,
  data: {
    name: string;
    memberIds: string[];
  },
) {
  const response = await api.patch(`/groups/${groupId}`, data);

  return response.data;
}

export async function addMember(groupId: string, userId: string) {
  const response = await api.post(`/groups/${groupId}/members`, { userId });

  return response.data;
}

export async function removeMember(groupId: string, userId: string) {
  const response = await api.delete(`/groups/${groupId}/members/${userId}`);

  return response.data;
}

// MESSAGES

export async function getGroupMessages(groupId: string) {
  const response = await api.get("/messages", {
    params: { groupId },
  });

  return response.data;
}

export async function getPrivateMessages(userId: string) {
  const response = await api.get("/messages", {
    params: { otherUserId: userId },
  });

  return response.data;
}

export async function createMessage(data: any) {
  const response = await api.post("/messages", data);
  return response.data;
}

export async function deleteMessage(messageId: string) {
  const response = await api.delete(`/messages/${messageId}`);

  return response.data;
}

export async function togglePin(messageId: string) {
  const response = await api.patch(`/messages/${messageId}/pin`);

  return response.data;
}

export async function toggleDoubt(messageId: string) {
  const response = await api.patch(`/messages/${messageId}/doubt`);

  return response.data;
}

export async function toggleAnnouncement(messageId: string) {
  const response = await api.patch(`/messages/${messageId}/announcement`);

  return response.data;
}

export async function reportMessage(messageId: string, reason: string) {
  const response = await api.post(`/messages/${messageId}/report`, { reason });

  return response.data;
}

// FILE

export async function uploadFile(messageId: string, file: File) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post(`/messages/${messageId}/file`, formData);

  return response.data;
}

// REPORTS

export async function getReports() {
  const response = await api.get("/reports");
  return response.data;
}

export async function resolveReport(reportId: string) {
  const response = await api.patch(`/reports/${reportId}/resolve`);

  return response.data;
}

