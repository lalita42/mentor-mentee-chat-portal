export type Role = "ADMIN" | "MENTOR" | "MENTEE";

export type ChatType = "GROUP" | "PRIVATE";

export type MessageType = "TEXT" | "IMAGE" | "PDF" | "ANNOUNCEMENT";

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: Role;
}

export interface Group {
  _id: string;
  name: string;
  createdBy: User;
  members: User[];
}

export interface Message {
  _id: string;

  senderId: User;

  recipientId?: User | string | null;

  groupId?: string | null;

  chatType: ChatType;

  type: MessageType;

  content: string;

  fileUrl?: string | null;

  fileName?: string | null;

  replyTo?: {
    _id: string;
    content: string;
    senderId: User;
    type: MessageType;
  } | null;

  pinned: boolean;

  doubt: boolean;

  resolved: boolean;

  deleted: boolean;

  createdAt: string;

  updatedAt: string;
}

export interface Report {
  _id: string;

  messageId: Message;

  reporterId: User;

  reason: string;

  resolved: boolean;

  createdAt: string;
}
