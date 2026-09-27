# Mentor–Mentee Chat Portal – Frontend

A web-based real-time chat portal designed for communication between **Mentors and Mentees**.

The frontend is built using **React, TypeScript, Vite, Axios, and Socket.IO Client**. It provides group chat, private chat, file sharing, replies, doubts, announcements, message reporting, and role-based features.

---

## 1. Technologies Used

* React.js
* TypeScript
* Vite
* CSS
* Axios
* Socket.IO Client
* React Router

---

## 2. Main Features

### Authentication

* User Login
* User Signup
* JWT-based authentication
* Role-based access

### User Roles

The application supports three roles:

* **Admin**
* **Mentor**
* **Mentee**

### Group Chat

* View available groups
* Send and receive messages
* Real-time messaging
* View group members
* Reply to messages
* Delete messages
* Pin messages
* Mark messages as doubt
* Create announcements
* Report messages

### Private Chat

Users can communicate privately according to their role and access permissions.

* Admin → Users
* Mentor → Mentees
* Mentee → Mentor

### File Sharing

Users can share files such as:

* JPG
* PNG
* WEBP
* PDF

Maximum file size:

**5 MB**

### Real-Time Communication

Socket.IO Client is used for:

* Real-time messages
* Typing events
* Group communication
* Socket connection and disconnection

---

## 3. Project Structure

```text
src/
│
├── components/
│   ├── Dashboard.tsx
│   ├── Sidebar.tsx
│   ├── GroupChat.tsx
│   ├── PrivateChat.tsx
│   ├── MessageBubble.tsx
│   ├── CreateGroupModal.tsx
│   └── ReportsPanel.tsx
│
├── pages/
│   ├── Login.tsx
│   └── Signup.tsx
│
├── services/
│   └── api.ts
│
├── socket/
│   └── socket.ts
│
├── types/
│   └── index.ts
│
├── App.tsx
├── main.tsx
└── index.css
```

---

## 4. Installation

Clone the repository:

```bash
git clone <your-github-repository-url>
```

Go to the frontend folder:

```bash
cd frontend
```

Install the dependencies:

```bash
npm install
```

---

## 5. Environment Variables

Create a `.env` file inside the frontend folder.

```env
VITE_API_URL=http://localhost:5000
```

The URL should point to the running backend server.

---

## 6. Run the Frontend

Start the development server:

```bash
npm run dev
```

The frontend normally runs at:

```text
http://localhost:5173
```

---

## 7. Backend Requirement

The frontend requires the NestJS backend to be running.

Application flow:

```text
React Frontend
      │
      │ REST API / Socket.IO
      ↓
NestJS Backend
      │
      ↓
MongoDB
```

Example:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:5000
```

---

## 8. API Communication

Axios is used for communication with the backend.

API functions are maintained in:

```text
src/services/api.ts
```

The frontend communicates with the backend for:

* Login
* Signup
* Users
* Groups
* Group creation
* Messages
* Private messages
* Message deletion
* Message pinning
* Doubts
* Announcements
* Reports
* File uploads

The JWT token is stored in local storage and sent with authenticated API requests.

---

## 9. Socket.IO

Socket.IO Client is used for real-time communication.

Socket configuration is available in:

```text
src/socket/socket.ts
```

It handles:

* Socket connection
* Socket disconnection
* Real-time messages
* Typing events
* Group communication

---

## 10. User Flow

### Admin

```text
Login
  ↓
Dashboard
  ↓
Create / Manage Groups
  ↓
Add Members
  ↓
Group Chat
  ↓
Manage Reports
```

### Mentor

```text
Login
  ↓
Dashboard
  ↓
Select Group
  ↓
Group Chat
  ↓
Chat with Mentees
  ↓
Handle Doubts / Announcements
```

### Mentee

```text
Login
  ↓
Dashboard
  ↓
Select Group
  ↓
Group Chat
  ↓
Chat with Mentor
  ↓
Ask Doubts
```

---

## 11. Message Features

Messages can support:

* Text messages
* Replies
* Delete
* Pin
* Doubt
* Announcement
* Report
* File attachment

---

## 12. Responsive Design

The frontend is designed to work on:

* Desktop
* Laptop
* Tablet
* Mobile devices

---

## 13. Production Build

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

## 14. Important Notes

* Make sure the backend is running before using the frontend.
* Make sure MongoDB is connected through the backend.
* Configure the `.env` file correctly.
* Do not commit passwords, JWT secrets, or other private credentials to GitHub.

---

## 15. Project Goal

The goal of this project is to provide a simple real-time communication platform for **mentors and mentees**.

The portal allows users to communicate through **group and private chats** while providing role-based access and useful mentorship features such as **doubts, announcements, replies, file sharing, and message reporting**.

---

## 16. Frontend Summary

The frontend uses:

```text
React
   +
TypeScript
   +
Vite
   +
Axios
   +
Socket.IO Client
   +
React Router
```

It provides a responsive interface with separate role-based functionality for **Admin, Mentor, and Mentee**.
