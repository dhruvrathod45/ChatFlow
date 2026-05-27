const socket = io("https://chatflow-backend-1.onrender.com");

const messageContainer = document.getElementById("message-container");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");

let username = "";

/* CUSTOM JOIN SCREEN */

const overlay = document.createElement("div");

overlay.style.position = "fixed";
overlay.style.top = "0";
overlay.style.left = "0";
overlay.style.width = "100%";
overlay.style.height = "100%";
overlay.style.background = "rgba(0,0,0,0.75)";
overlay.style.backdropFilter = "blur(18px)";
overlay.style.display = "flex";
overlay.style.justifyContent = "center";
overlay.style.alignItems = "center";
overlay.style.zIndex = "9999";

overlay.innerHTML = `
  <div style="
    width:420px;
    padding:40px;
    border-radius:30px;
    background:rgba(15,15,25,0.7);
    border:1px solid rgba(255,255,255,0.08);
    box-shadow:
      0 0 80px rgba(0,255,200,0.15),
      0 0 120px rgba(255,0,150,0.12);
    text-align:center;
    color:white;
    font-family:sans-serif;
  ">
  
    <h1 style="
      font-size:42px;
      margin-bottom:10px;
      letter-spacing:4px;
    ">
      CHATFLOW
    </h1>

    <p style="
      opacity:0.7;
      margin-bottom:35px;
    ">
      Enter your neural identity
    </p>

    <input
      id="username-field"
      type="text"
      placeholder="Choose username..."
      style="
        width:100%;
        padding:18px;
        border-radius:18px;
        border:none;
        outline:none;
        background:rgba(255,255,255,0.08);
        color:white;
        font-size:18px;
        margin-bottom:25px;
      "
    />

    <button
      id="enter-chat-btn"
      style="
        width:100%;
        padding:18px;
        border:none;
        border-radius:18px;
        background:linear-gradient(135deg,#00ffd5,#ff00c8,#ff9d00);
        color:white;
        font-size:18px;
        font-weight:bold;
        cursor:pointer;
        transition:0.3s;
      "
    >
      Enter Chat
    </button>

  </div>
`;

document.body.appendChild(overlay);

const usernameField = document.getElementById("username-field");

const enterChatBtn = document.getElementById("enter-chat-btn");

/* JOIN */

enterChatBtn.addEventListener("click", () => {

  if(usernameField.value.trim() === ""){

    alert("Enter username");

    return;
  }

  username = usernameField.value.trim();

  overlay.remove();

  socket.emit("join-chat", username);

});

/* SEND MESSAGE */

sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keypress", (e) => {

  if(e.key === "Enter"){

    sendMessage();

  }

});

function sendMessage(){

  const message = messageInput.value.trim();

  if(message === "") return;

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

/* RECEIVE MESSAGE */

socket.on("receive-message", (data) => {

  addMessage(data);

});

/* ONLINE USERS */

socket.on("online-users", (count) => {

  const onlineBox = document.getElementById("online-count");

  if(onlineBox){

    onlineBox.innerText = `${count} Online`;

  }

});

/* ADD MESSAGE */

function addMessage(data){

  const messageDiv = document.createElement("div");

  if(data.username === username){

    messageDiv.classList.add("message", "own-message");

  }else{

    messageDiv.classList.add("message");

  }

  messageDiv.innerHTML = `

    <div class="message-user">
      ${data.username}
    </div>

    <div class="message-text">
      ${data.message}
    </div>

    <div class="message-time">
      ${data.time}
    </div>

  `;

  messageContainer.appendChild(messageDiv);

  messageContainer.scrollTop =
    messageContainer.scrollHeight;

}