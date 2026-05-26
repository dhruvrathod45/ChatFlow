const socket = io("http://localhost:5000", {
  transports: ["websocket"]
});

const joinScreen = document.getElementById("join-screen");
const chatContainer = document.getElementById("chat-container");

const joinBtn = document.getElementById("join-btn");
const usernameInput = document.getElementById("username-input");

const form = document.getElementById("chat-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("messages");

let username = "";

joinBtn.addEventListener("click", () => {

  if(usernameInput.value.trim() === "") return;

  username = usernameInput.value;

  joinScreen.style.display = "none";

  chatContainer.style.display = "flex";

  socket.emit("new-user", username);

});

function createMessage(data, isOwn = false) {

  const messageDiv = document.createElement("div");

  messageDiv.classList.add("message");

  if(isOwn){
    messageDiv.classList.add("own");
  }

  messageDiv.innerHTML = `

    <div class="message-user">${data.username}</div>

    <div class="message-text">${data.message}</div>

    <div class="message-time">${data.time}</div>

  `;

  messages.appendChild(messageDiv);

  messages.scrollTop = messages.scrollHeight;
}

function sendMessage(){

  if(input.value.trim() === "") return;

  const messageData = {

    username,

    message: input.value,

    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })

  };

  createMessage(messageData, true);

  socket.emit("send-message", messageData);

  input.value = "";
}

form.addEventListener("submit", (e) => {

  e.preventDefault();

  sendMessage();

});

input.addEventListener("keypress", (e) => {

  if(e.key === "Enter"){

    sendMessage();

  }

});

socket.on("receive-message", (data) => {

  createMessage(data);

});

socket.on("user-joined", (data) => {

  createMessage({

    username: "System",

    message: `${data} joined the chat`,

    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })

  });

});

socket.on("online-users", (count) => {

  document.getElementById("online-count").innerText =
    `${count} Online`;

});