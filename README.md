# 🚀 ChatFlow — Realtime Cybernetic Chat Interface

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white">
  <img src="https://img.shields.io/badge/Express.js-Framework-black?style=for-the-badge&logo=express">
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white">
  <img src="https://img.shields.io/badge/Socket.IO-Realtime-black?style=for-the-badge&logo=socket.io">
  <img src="https://img.shields.io/badge/JWT-Authentication-orange?style=for-the-badge&logo=jsonwebtokens">
  <img src="https://img.shields.io/badge/License-ISC-blue?style=for-the-badge">
</p>

A premium **real-time chat application** built with **Node.js, Express.js, MongoDB Atlas, Socket.IO, and Vanilla JavaScript**. ChatFlow delivers secure authentication, realtime messaging, persistent chat history, and a futuristic cyberpunk-inspired interface with premium glassmorphism effects.

---

# 🌐 Live Demo

### Frontend

https://chat-flow-lyart.vercel.app/

### Backend API

https://chatflow-backend-q1i9.onrender.com/

---

# ✨ Features

## 🔐 Authentication

- Secure User Registration
- Secure Login
- JWT Authentication
- Bcrypt Password Hashing
- Protected API Routes
- WebSocket JWT Authentication

---

## 💬 Realtime Messaging

- Instant Messaging using Socket.IO
- Live Message Broadcasting
- Persistent Message History
- Online Users Tracking
- Live Typing Indicator
- Auto Reconnection
- Connection Status Indicator

---

## 🎨 Premium UI

- Cyberpunk Design
- Glassmorphism
- Aurora Background Effects
- Animated Gradient Mesh
- Floating Particles
- Neon Glow Components
- Smooth Micro Animations
- Responsive Layout
- Premium Message Cards
- Animated Buttons
- Glass Sidebar
- Modern Chat Interface

---

## 🛡 Security

- JWT Session Authentication
- Bcrypt Password Encryption
- Helmet Security Headers
- Express Rate Limiting
- XSS Protection
- MongoDB Injection Protection
- Input Validation
- Secure Socket Authentication

---

# 🛠 Tech Stack

## Frontend

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- Socket.IO Client

## Backend

- Node.js
- Express.js
- Socket.IO
- JWT Authentication

## Database

- MongoDB Atlas
- Mongoose

## Security

- bcryptjs
- helmet
- express-rate-limit

## Deployment

- Vercel
- Render

---

# 🏗 Architecture

```text
Browser
      │
      ▼
Frontend (Vercel)
      │
      ├──────── REST API ────────┐
      │                          │
      ▼                          ▼
Express.js Server + Socket.IO (Render)
                │
                ▼
         MongoDB Atlas
```

---

# 📂 Project Structure

```text
ChatFlow/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── sockets/
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── README.md
├── PROJECT_REPORT.md
├── TECHNICAL_QA.md
├── CHANGELOG.md
└── KNOWN_LIMITATIONS.md
```

---

# ⚙️ Installation

## 1. Clone the Repository

```bash
git clone https://github.com/dhruvrathod45/ChatFlow.git

cd ChatFlow
```

---

## 2. Install Dependencies

```bash
cd backend

npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file inside the **backend** folder.

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key
```

---

## 4. Run the Backend

Development

```bash
npm run dev
```

Production

```bash
npm start
```

---

## 5. Open the Frontend

Visit

```
http://localhost:5000
```

or open

```
frontend/index.html
```

using Live Server.

---

# 🔒 Environment Variables

| Variable | Description |
|-----------|-------------|
| PORT | Backend Server Port |
| MONGO_URI | MongoDB Atlas Connection String |
| JWT_SECRET | Secret Key used to sign JWT Tokens |

---

# 📡 API Endpoints

## Register

```
POST /api/auth/register
```

### Request

```json
{
  "name":"John Doe",
  "email":"john@example.com",
  "password":"password123"
}
```

---

## Login

```
POST /api/auth/login
```

### Request

```json
{
  "email":"john@example.com",
  "password":"password123"
}
```

---

# 🔌 Socket.IO Events

## Client → Server

- join-chat
- send-message
- typing
- stop-typing

---

## Server → Client

- message-history
- receive-message
- online-users
- online-users-list
- typing
- stop-typing

---

# 🛡 Security Features

- JWT Authentication
- Secure Socket Handshake
- Password Hashing (bcrypt)
- Helmet Security Headers
- Rate Limiting
- Input Validation
- MongoDB Injection Protection
- XSS Protection

---

# 🚀 Deployment

## Frontend

**Vercel**

https://chat-flow-lyart.vercel.app/

---

## Backend

**Render**

https://chatflow-backend-q1i9.onrender.com/

---

---

# 🔮 Future Improvements

- Private Chats
- Chat Rooms
- Message Reactions
- Emoji Picker
- Voice Messages
- Image Sharing
- File Uploads
- Push Notifications
- Read Receipts
- User Profiles
- AI Chat Assistant
- Message Search
- PWA Support
- Mobile Application

---

# 🛠 Troubleshooting

### MongoDB Connection Failed

- Verify your `MONGO_URI`
- Ensure your IP address is whitelisted in MongoDB Atlas

### Socket Not Connecting

- Check the JWT token
- Verify backend URL
- Confirm CORS configuration

### Backend Not Starting

- Verify `.env`
- Install dependencies
- Ensure the selected port is available

---

# 👨‍💻 Author

**Dhruv Rathod**

### GitHub

https://github.com/dhruvrathod45

### LinkedIn

https://www.linkedin.com/in/dhruvrathod45/

### Portfolio

https://dhruvportfolio-nu.vercel.app/

---

# ⭐ Support

If you found this project helpful, consider giving it a **⭐ Star** on GitHub!

It helps support the project and motivates future development.

---

# 📄 License

This project is licensed under the **ISC License**.
