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

## 🔐 Authentication & Security
- Secure User Registration & Login
- Password Hashing via Bcrypt (12 rounds)
- JWT Session Authentication (stateless)
- Protected REST API Routes
- Secure Handshake-level Socket Authentication
- Helmet Security Headers
- Request Rate Limiting (100 attempts / 15 mins)
- Custom In-place MongoDB injection sanitizer (Express 5 compatible)
- Input Sanitization & HTML Escaping (XSS protection)

## 💬 Realtime Messaging & Flow
- Instant Messaging using Socket.IO
- Live Message Broadcasting
- Persistent Message History (retains last 50 messages)
- Active Operators List (unique connected users directory)
- Live Typing Indicator (multi-user tracker with debounce)
- Connection Status Indicator (pulsing green dot for online, orange for reconnecting, red for offline)
- Auto Reconnection HUD Banner
- Loading Skeleton States & Toast notifications

## 🎨 Premium UI/UX
- Cyberpunk HUD Design
- High-blur Glassmorphism backdrop-filters
- Aurora Background Blurs & Animated Gradient Mesh
- Floating Particles background system
- Neon Outline Glow & Focus Highlights
- Responsive Collapsible Layout for mobile
- Entrance animations for message list items

---

# 🛠 Tech Stack

- **Frontend**: HTML5, CSS3 (Vanilla design system), Vanilla JavaScript (ES6+), Socket.IO client
- **Backend**: Node.js, Express.js, Socket.IO, JWT Authentication, Bcryptjs
- **Database**: MongoDB Atlas (NoSQL cluster), Mongoose ODM
- **Deployment**: Vercel (static web hosting), Render (live server node)

---

# 📂 Folder Structure

```text
CHATFLOW/
├── backend/
│   ├── config/
│   │   └── db.js               # Database connection setup
│   ├── controllers/
│   │   └── authController.js   # Registration and login logic
│   ├── middleware/
│   │   └── authMiddleware.js   # HTTP route JWT validation
│   ├── models/
│   │   ├── messageModel.js     # Chat message schema
│   │   └── user.js             # User identity schema
│   ├── routes/
│   │   └── authRoutes.js       # HTTP authentication routes
│   ├── sockets/
│   │   └── chatSocket.js       # Socket.IO connection & event handlers
│   ├── .env                    # Local environment secrets (ignored by git)
│   ├── package.json            # Node backend dependencies & scripts
│   └── server.js               # Backend entry point
├── frontend/
│   ├── index.html              # Main single page template
│   ├── script.js               # Client controller logic
│   └── style.css               # Premium CSS stylesheet
├── README.md                   # Project documentation
├── PROJECT_REPORT.md           # Developer implementation report
├── TECHNICAL_QA.md             # Project questions & answers reference
├── CHANGELOG.md                # System change registry
└── KNOWN_LIMITATIONS.md        # Technical debt & limitations documentation
```

---

# 🚀 Installation & Local Setup

### Prerequisites
- Node.js installed (v18 or higher recommended)
- A running MongoDB Atlas instance or local MongoDB server

### Step 1: Clone and Prepare Workspace
Clone the repository and enter the root directory:
```bash
git clone https://github.com/dhruvrathod45/ChatFlow.git
cd ChatFlow
```

### Step 2: Configure Backend Environment
Navigate to the `backend` folder:
```bash
cd backend
```
Create a `.env` file in the `backend` directory and add the following keys:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

### Step 3: Install Backend Dependencies
Execute the install command:
```bash
npm install
```

### Step 4: Run the Application
Start the backend server in development mode (using nodemon):
```bash
npm run dev
```
The server will boot, connect to MongoDB, and output:
```text
Server running on port 5000
MongoDB Connected
```

### Step 5: Open the Frontend
Visit:
```text
http://localhost:5000
```
or open `frontend/index.html` using a static server. The client automatically detects local environments and establishes a link with the backend.

---

# 🔒 Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Backend Server Port | `5000` |
| `MONGO_URI` | MongoDB Atlas Connection String | `mongodb+srv://...` |
| `JWT_SECRET` | Secret Key used to sign JWT Tokens | `chatflowsecret` |

---

# 📡 API Endpoints

All HTTP requests accept and return JSON payloads.

### 1. Register User
- **Endpoint**: `POST /api/auth/register`
- **Authentication**: None
- **Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```
- **Response (201 Created)**:
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1Ni...",
  "user": {
    "id": "6a4f6b66b30345b5cebaaf44",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### 2. Login User
- **Endpoint**: `POST /api/auth/login`
- **Authentication**: None
- **Request Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- **Response (200 OK)**:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1Ni...",
  "user": {
    "id": "6a4f6b66b30345b5cebaaf44",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

# 🔌 Socket.IO Events

WebSocket connections utilize the authorization header (`Authorization: Bearer <token>`) during the handshake.

### Client → Server
- `join-chat`: Triggers registration of the user's active session.
- `send-message`: Dispatches a text message. Payload: `{"message": "Hello!"}`
- `typing`: Informs the server that the user is typing.
- `stop-typing`: Informs the server that the user stopped typing.

### Server → Client
- `message-history`: Sent upon join. Contains the last 50 stored messages.
- `receive-message`: Dynamic receipt of new messages (or system messages).
- `online-users`: Real-time counter of unique connected users.
- `online-users-list`: Array of all currently connected users.
- `typing`: Displays the active typing user.
- `stop-typing`: Hides the typing state of the user.

---

# 🔮 Future Improvements
- Private Chats (1-to-1 rooms)
- Group Chat Creation
- Read Receipts & Message Reactions
- Emoji Picker Integration
- Image Sharing & File Uploads
- Push Notifications

---

# 🛠 Troubleshooting

### MongoDB Connection Failed
- Verify your `MONGO_URI` connection string.
- Ensure your IP address is whitelisted in MongoDB Atlas Network Security.

### Socket Not Connecting
- Check the JWT token. If expired, log out and log back in.
- Verify the backend server is running and CORS is configured properly.

### Backend Not Starting
- Verify `.env` is configured correctly.
- Run `npm install` to ensure all dependencies are resolved.

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

---

# 📄 License

This project is licensed under the **ISC License**.
