# Mentor–Mentee Chat Portal – Backend

Backend API for the **Mentor–Mentee Chat Portal**, developed using **NestJS, TypeScript, MongoDB, Mongoose, JWT, and Socket.IO**.

The backend provides authentication, role-based access, group management, private and group messaging, file uploads, reports, doubts, announcements, and real-time communication.

---

## 1. Technologies Used

* NestJS
* TypeScript
* Node.js
* MongoDB
* Mongoose
* JWT
* Socket.IO
* Multer
* REST API

---

## 2. Main Features

### Authentication

* User Signup
* User Login
* JWT authentication
* Password validation
* Role-based access control

### User Roles

The backend supports three roles:

* **Admin**
* **Mentor**
* **Mentee**

### User Management

* Get users
* Get users by role
* Role-based user access
* User information management

### Group Management

* Create groups
* Get available groups
* Get group details
* Add members to groups
* View group members

### Group Chat

* Send group messages
* Get group messages
* Reply to messages
* Delete messages
* Pin messages
* Mark messages as doubt
* Create announcements
* Report messages

### Private Chat

* Send private messages
* Get private chat messages
* Real-time private communication
* Delete messages
* Report messages

### File Upload

The backend supports file uploads for chat messages.

Supported file types include:

* JPG
* PNG
* WEBP
* PDF

Maximum file size:

**5 MB**

### Reports

Users can report inappropriate messages.

Admin can view and manage reported messages.

### Real-Time Communication

Socket.IO is used for:

* Real-time messaging
* Group rooms
* Private messaging
* Typing events
* Socket connections

---

## 3. Project Structure

```text
src/
│
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
│
├── users/
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── user.schema.ts
│   └── users.module.ts
│
├── groups/
│   ├── groups.controller.ts
│   ├── groups.service.ts
│   ├── group.schema.ts
│   └── groups.module.ts
│
├── messages/
│   ├── messages.controller.ts
│   ├── messages.service.ts
│   ├── message.schema.ts
│   └── messages.module.ts
│
├── reports/
│   ├── reports.controller.ts
│   ├── reports.service.ts
│   └── reports.module.ts
│
├── uploads/
│
├── app.module.ts
├── main.ts
└── ...
```

> Folder names may differ slightly depending on the final backend implementation.

---

## 4. Installation

Clone the repository:

```bash
git clone <your-github-repository-url>
```

Go to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

---

## 5. Environment Variables

Create a `.env` file in the backend folder.

Example:

```env
PORT=5000

MONGODB_URI=mongodb://localhost:27017/mentor_mentee_chat

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
```

Use your actual MongoDB connection string and JWT secret.

Do not upload the `.env` file to GitHub.

---

## 6. Run the Backend

Start the development server:

```bash
npm run start:dev
```

The backend will normally run on:

```text
http://localhost:5000
```

---

## 7. Production

Build the backend:

```bash
npm run build
```

Start the production server:

```bash
npm run start:prod
```

---

## 8. Database

The project uses **MongoDB** with **Mongoose**.

Database flow:

```text
Frontend
   ↓
NestJS REST API
   ↓
Mongoose
   ↓
MongoDB
```

MongoDB stores:

* Users
* Groups
* Messages
* Reports
* Group members
* Message information

---

## 9. Authentication Flow

The authentication flow uses JWT.

```text
User
 ↓
Login / Signup
 ↓
NestJS Authentication
 ↓
JWT Token
 ↓
Frontend
 ↓
Authenticated API Requests
```

The JWT token is used to access protected backend APIs.

---

## 10. API Modules

The backend contains APIs for:

```text
Authentication
Users
Groups
Messages
Private Messages
Reports
File Uploads
```

Examples of operations:

```text
POST   /auth/signup
POST   /auth/login

GET    /users
GET    /users?role=MENTOR
GET    /users?role=MENTEE

GET    /groups
POST   /groups
GET    /groups/:id

GET    /messages/group/:id
POST   /messages

GET    /messages/private/:userId
DELETE /messages/:id

POST   /messages/:id/report
```

> Exact API routes may vary according to the final controller implementation.

---

## 11. Socket.IO

Socket.IO provides real-time communication between users.

The backend creates socket connections and handles events such as:

```text
connection
disconnect
join_group
leave_group
send_message
message:new
typing
```

Example communication:

```text
User A
   │
   │ Socket.IO
   ↓
NestJS Socket Server
   │
   ↓
User B
```

This allows messages to appear without refreshing the page.

---

## 12. Group Communication

When a user opens a group chat:

```text
User Login
    ↓
Dashboard
    ↓
Select Group
    ↓
Join Group Socket Room
    ↓
Send / Receive Messages
```

Each group can have multiple members.

---

## 13. Private Communication

Private messages are sent between individual users.

Example:

```text
Mentor
   ↕
Mentee
```

The backend verifies the users and stores private messages in MongoDB.

---

## 14. Role-Based Access

Different users have different permissions.

### Admin

* Manage groups
* Add members
* View reports
* Manage communication features

### Mentor

* Access assigned groups
* Communicate with mentees
* Handle doubts
* Create announcements

### Mentee

* Access assigned groups
* Communicate with mentors
* Ask doubts
* Participate in discussions

---

## 15. File Upload

Files can be uploaded through the backend.

Supported formats:

```text
.jpg
.jpeg
.png
.webp
.pdf
```

Maximum size:

```text
5 MB
```

Uploaded files are handled by the backend and can be shared through chat messages.

---

## 16. Error Handling

The backend handles common errors such as:

* Invalid credentials
* Unauthorized requests
* Invalid JWT token
* User not found
* Group not found
* Message not found
* Invalid file type
* File size exceeded
* Invalid request data

---

## 17. CORS

The backend allows the frontend application to communicate with the API and Socket.IO server.

Example development setup:

```text
Frontend
http://localhost:5173

Backend
http://localhost:5000
```

---

## 18. Development Flow

Start MongoDB:

```text
MongoDB
   ↓
NestJS Backend
   ↓
React Frontend
```

Run backend:

```bash
npm run start:dev
```

Run frontend:

```bash
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

## 19. Important Notes

* Make sure MongoDB is running.
* Make sure the backend is running before starting the frontend.
* Configure `.env` correctly.
* Keep the JWT secret private.
* Do not commit `.env` to GitHub.
* Make sure the frontend API URL matches the backend port.
* Socket.IO client and server should use compatible versions.

---

## 20. Project Goal

The main goal of this backend is to provide a secure and real-time communication system for mentors and mentees.

It manages:

* Authentication
* Users
* Groups
* Messages
* Private chats
* File sharing
* Reports
* Doubts
* Announcements
* Real-time communication

---

## 21. Backend Summary

```text
NestJS
   +
TypeScript
   +
MongoDB
   +
Mongoose
   +
JWT
   +
Socket.IO
   +
REST API
```

The backend provides the complete API and real-time communication layer for the Mentor–Mentee Chat Portal.


## Why I Chose MongoDB?

I chose MongoDB instead of PostgreSQL because this project is a real-time chat application. MongoDB has a flexible document structure, which makes it easier to store messages, files, doubts, and announcements. It also integrates easily with NestJS using Mongoose.
It is simple to develop and easy to scale as the number of users and messages grows.