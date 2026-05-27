const socket = io("https://chatflow-backend-1.onrender.com");

const messageContainer = document.getElementById("message-container");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const usernameModal = document.getElementById("username-modal");
const usernameInput = document.getElementById("username-input");
const joinBtn = document.getElementById("join-btn");
const onlineUsers = document.getElementById("online-users");

let username = "";

joinBtn.addEventListener("click", () => {
  if (usernameInput.value.trim() === "") {
    alert("Enter username");
    return;
  }

  username = usernameInput.value.trim();

  usernameModal.style.display = "none";

  socket.emit("join-chat", username);
});

socket.on("online-users", (count) => {
  onlineUsers.innerText = `${count} Online`;
});

sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

function sendMessage() {
  const message = messageInput.value.trim();

  if (message === "") return;

  const messageData = {
    username,
    message,
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })
  };

  socket.emit("send-message", messageData);

  messageInput.value = "";
}

socket.on("receive-message", (data) => {
  addMessage(data);
});

function addMessage(data) {
  const messageDiv = document.createElement("div");

  if (data.username === username) {
    messageDiv.classList.add("message", "my-message");
  } else {
    messageDiv.classList.add("message", "other-message");
  }

  messageDiv.innerHTML = `
    <div class="message-user">${data.username}</div>
    <div class="message-text">${data.message}</div>
    <div class="message-time">${data.time}</div>
  `;

  messageContainer.appendChild(messageDiv);

  messageContainer.scrollTop = messageContainer.scrollHeight;
}