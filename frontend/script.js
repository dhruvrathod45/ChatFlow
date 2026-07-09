// ==========================================================================
// CONFIGURATION & GLOBAL STATE
// ==========================================================================
const BACKEND_URL = window.location.hostname === "localhost" || 
                    window.location.hostname === "127.0.0.1" || 
                    window.location.protocol === "file:"
  ? "http://localhost:5000"
  : "https://chatflow-backend-q1i9.onrender.com";

let socket = null;
let currentUser = null;
let currentUsername = null;
const typingUsers = new Set();
let typingTimeout = null;
let isTyping = false;

// DOM Elements
const authOverlay = document.getElementById("auth-overlay");
const appContainer = document.getElementById("app-container");
const joinForm = document.getElementById("join-form");

const messageContainer = document.getElementById("message-container");
const messageInput = document.getElementById("message-input");
const onlineCount = document.getElementById("online-count");
const operatorsList = document.getElementById("operators-list");
const sidebarUserCount = document.getElementById("sidebar-user-count");
const chatSidebar = document.getElementById("chat-sidebar");
const connectionBanner = document.getElementById("connection-banner");
const bannerText = document.getElementById("banner-text");

const headerUserName = document.getElementById("header-user-name");
const headerUserAvatar = document.getElementById("header-user-avatar");

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initBackgroundParticles();
  checkSavedSession();
  setupInputListeners();
});

// Create ambient particles
function initBackgroundParticles() {
  const container = document.getElementById("particles-container");
  if (!container) return;
  const particleCount = 25;
  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement("div");
    p.classList.add("particle");
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.animationDelay = `${Math.random() * 12}s`;
    p.style.animationDuration = `${6 + Math.random() * 12}s`;
    container.appendChild(p);
  }
}

// Auto-restore session if username is saved
function checkSavedSession() {
  const savedUsername = localStorage.getItem("chatflow_username");
  
  if (savedUsername && savedUsername.trim() !== "") {
    currentUsername = savedUsername.trim();
    currentUser = {
      id: null,
      name: currentUsername
    };
    initializeInterface();
  }
}

function clearSessionData() {
  localStorage.removeItem("chatflow_username");
  currentUsername = null;
  currentUser = null;
}

// ==========================================================================
// ==========================================================================
// AUTHENTICATION ROUTINES (JOIN CHAT)
// ==========================================================================
function handleJoinSubmit(event) {
  event.preventDefault();
  
  const usernameInput = document.getElementById("join-username");
  const username = usernameInput.value.trim();
  
  if (username === "") {
    showToast("Operator callsign cannot be empty.", "error");
    return;
  }

  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.querySelector('.btn-text').innerText;
  submitBtn.disabled = true;
  submitBtn.querySelector('.btn-text').innerText = "CONNECTING...";

  // Save session
  localStorage.setItem("chatflow_username", username);
  currentUsername = username;
  currentUser = {
    id: null,
    name: currentUsername
  };

  showToast("Identity registered. Establishing neural link...", "success");
  
  // Animate transition and start app
  authOverlay.style.opacity = "0";
  setTimeout(() => {
    authOverlay.classList.add("overlay-hidden");
    initializeInterface();
    submitBtn.disabled = false;
    submitBtn.querySelector('.btn-text').innerText = originalBtnText;
  }, 400);
}

function logout() {
  showToast("Terminating connection. Purging session...", "warning");
  if (socket) {
    socket.disconnect();
  }
  clearSessionData();
  appContainer.classList.add("app-hidden");
  authOverlay.classList.remove("overlay-hidden");
  setTimeout(() => {
    authOverlay.style.opacity = "1";
    // Clear form fields
    joinForm.reset();
  }, 100);
}

// ==========================================================================
// CHAT APPLICATION INTERFACE INITIALIZATION
// ==========================================================================
function initializeInterface() {
  // Update user header profile details
  headerUserName.innerText = currentUser.name;
  headerUserAvatar.innerText = getUserInitials(currentUser.name);

  // Transition overlay and interface view
  authOverlay.classList.add("overlay-hidden");
  authOverlay.style.opacity = "0";
  appContainer.classList.remove("app-hidden");

  // Show skeletons in container
  messageContainer.innerHTML = `
    <div class="skeleton-message-left">
      <div class="skeleton-avatar"></div>
      <div class="skeleton-bubble"></div>
    </div>
    <div class="skeleton-message-right">
      <div class="skeleton-bubble"></div>
    </div>
    <div class="skeleton-message-left">
      <div class="skeleton-avatar"></div>
      <div class="skeleton-bubble" style="width:250px;"></div>
    </div>
  `;

  // Start Socket Connection
  connectSocket();
}

function getUserInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ==========================================================================
// SOCKET.IO REALTIME FLOW
// ==========================================================================
function connectSocket() {
  socket = io(BACKEND_URL, {
    auth: { username: currentUsername },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    transports: ["websocket", "polling"]
  });

  // Socket connected
  socket.on("connect", () => {
    hideConnectionBanner();
    updateConnectionIndicator("online");
    showToast("Linked to network hub.", "success");

    // Update currentUser ID with socket ID to match sidebar item ids
    if (currentUser) {
      currentUser.id = socket.id;
    }

    // Emit join chat
    socket.emit("join-chat");
  });

  // Socket connection error (auth failed, etc)
  socket.on("connect_error", (error) => {
    console.error("Socket Connection Error:", error.message);
    if (error.message.includes("Authentication error")) {
      showToast(error.message, "error");
      logout();
    } else {
      showConnectionBanner("Host offline. Re-establishing link...");
      updateConnectionIndicator("reconnecting");
    }
  });

  // Socket disconnected
  socket.on("disconnect", (reason) => {
    updateConnectionIndicator("offline");
    if (reason === "io server disconnect") {
      logout();
    } else {
      showConnectionBanner("Neural link lost. Re-establishing link...");
    }
  });

  // Load message history from server
  socket.on("message-history", (messages) => {
    // Clear skeletons
    messageContainer.innerHTML = "";
    
    if (messages.length === 0) {
      renderEmptyState();
    } else {
      messages.forEach(msg => addMessage(msg, false));
      scrollToBottom();
    }
  });

  // Incoming new message
  socket.on("receive-message", (data) => {
    // Remove empty state if visible
    const emptyState = document.getElementById("chat-empty-state");
    if (emptyState) emptyState.remove();

    addMessage(data, true);
  });

  // Active online count
  socket.on("online-users", (count) => {
    onlineCount.innerText = `${count} Online`;
    sidebarUserCount.innerText = count;
  });

  // Active online users list for sidebar
  socket.on("online-users-list", (users) => {
    renderOperators(users);
  });

  // Typing status listner
  socket.on("typing", (username) => {
    typingUsers.add(username);
    updateTypingIndicator();
  });

  socket.on("stop-typing", (username) => {
    typingUsers.delete(username);
    updateTypingIndicator();
  });

  // Listen for socket validation/authentication errors
  socket.on("chat-error", (err) => {
    showToast(err.message, "error");
  });
}

// ==========================================================================
// DOM RENDERING & MESSAGE ACTIONS
// ==========================================================================

// Add a single message bubble to the board
function addMessage(data, animate = true) {
  const isMe = data.username === currentUser.name;
  const isSys = data.isSystem === true || data.username === "System";

  if (isSys) {
    const sysDiv = document.createElement("div");
    sysDiv.className = "message-system";
    sysDiv.innerText = data.message;
    messageContainer.appendChild(sysDiv);
    if (animate) scrollToBottom();
    return;
  }

  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${isMe ? 'own-message' : ''}`;
  if (!animate) msgDiv.style.animation = "none"; // Disable animation during initial historical rendering

  const initials = getUserInitials(data.username);

  msgDiv.innerHTML = `
    ${!isMe ? `<div class="profile-avatar operator-avatar" style="width: 32px; height: 32px; border-radius: 8px;">${initials}</div>` : ''}
    <div class="message-bubble">
      <div class="message-bubble-header">
        <span class="message-user">${data.username}</span>
        <span class="message-time">${data.time}</span>
      </div>
      <div class="message-text">${escapeHTML(data.message)}</div>
    </div>
  `;

  messageContainer.appendChild(msgDiv);
  if (animate) scrollToBottom();
}

// Render active users on sidebar
function renderOperators(users) {
  operatorsList.innerHTML = "";
  
  users.forEach(user => {
    const initials = getUserInitials(user.name);
    const isMe = user.id === currentUser.id;

    const opCard = document.createElement("div");
    opCard.className = `operator-card ${isMe ? 'me' : ''}`;
    
    opCard.innerHTML = `
      <div class="operator-avatar">
        ${initials}
        <span class="operator-status-dot"></span>
      </div>
      <div class="operator-info">
        <span class="operator-name">${user.name} ${isMe ? '(You)' : ''}</span>
        <span class="operator-status-text">Active Link</span>
      </div>
    `;

    operatorsList.appendChild(opCard);
  });
}

function sendMessage() {
  const text = messageInput.value.trim();
  if (text === "" || !socket) return;

  socket.emit("send-message", { message: text });
  
  // Reset typing state
  isTyping = false;
  socket.emit("stop-typing");
  
  messageInput.value = "";
  messageInput.focus();
}

function setupInputListeners() {
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  // Typing event emission with debouncing
  messageInput.addEventListener("input", () => {
    if (!isTyping && socket) {
      isTyping = true;
      socket.emit("typing");
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      if (isTyping && socket) {
        isTyping = false;
        socket.emit("stop-typing");
      }
    }, 1500);
  });
}

function updateTypingIndicator() {
  const typingIndicator = document.getElementById("typing-indicator");
  if (typingUsers.size === 0) {
    typingIndicator.style.opacity = "0";
    typingIndicator.innerHTML = "";
    return;
  }

  const typers = Array.from(typingUsers).filter(name => name !== currentUser.name);
  if (typers.length === 0) {
    typingIndicator.style.opacity = "0";
    typingIndicator.innerHTML = "";
    return;
  }

  typingIndicator.style.opacity = "1";
  const namesText = typers.join(", ");
  typingIndicator.innerHTML = `
    <span>${namesText} ${typers.length === 1 ? 'is' : 'are'} transmitting data</span>
    <span class="typing-dots">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </span>
  `;
}

// Helpers
function scrollToBottom() {
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

function renderEmptyState() {
  messageContainer.innerHTML = `
    <div class="chat-empty-state" id="chat-empty-state">
      <div class="empty-glow-icon">💬</div>
      <h3>No neural transmissions yet.</h3>
      <p>Type your message below to broadcast securely over the sub-space channel.</p>
    </div>
  `;
}

function updateConnectionIndicator(status) {
  const indicator = document.getElementById("status-indicator");
  if (!indicator) return;

  indicator.className = "status-dot";
  if (status === "online") {
    indicator.classList.add("dot-online");
  } else if (status === "offline") {
    indicator.classList.add("dot-offline");
  } else {
    indicator.classList.add("dot-reconnecting");
  }
}

function showConnectionBanner(text) {
  bannerText.innerText = text;
  connectionBanner.classList.remove("banner-hidden");
}

function hideConnectionBanner() {
  connectionBanner.classList.add("banner-hidden");
}

function toggleSidebar() {
  chatSidebar.classList.toggle("active");
}

// Escapes special HTML tags to prevent XSS
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// ==========================================================================
// TOAST EMITTER
// ==========================================================================
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  toast.innerHTML = `
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);

  // Auto remove after 4.5s
  setTimeout(() => {
    toast.style.transform = "translateX(120%)";
    toast.style.opacity = "0";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4500);
}