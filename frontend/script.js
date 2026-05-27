const socket = io("https://chatflow-backend-1.onrender.com");

const messageContainer =
document.getElementById("message-container");

const messageInput =
document.getElementById("message-input");

const sendBtn =
document.getElementById("send-btn");

const onlineCount =
document.getElementById("online-count");

let username = "";

/* JOIN POPUP */

const overlay = document.createElement("div");

overlay.style.position = "fixed";
overlay.style.top = "0";
overlay.style.left = "0";
overlay.style.width = "100%";
overlay.style.height = "100%";
overlay.style.background = "rgba(0,0,0,0.72)";
overlay.style.backdropFilter = "blur(18px)";
overlay.style.display = "flex";
overlay.style.justifyContent = "center";
overlay.style.alignItems = "center";
overlay.style.zIndex = "9999";

overlay.innerHTML = `

<div style="
width:430px;
padding:40px;
border-radius:35px;
background:rgba(10,10,20,0.75);
border:1px solid rgba(255,255,255,0.08);
box-shadow:
0 0 60px rgba(0,255,200,0.12),
0 0 100px rgba(255,0,120,0.1);
">

<h1 style="
font-size:46px;
letter-spacing:4px;
margin-bottom:12px;
text-align:center;
">
CHATFLOW
</h1>

<p style="
opacity:0.7;
text-align:center;
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
height:62px;
border:none;
outline:none;
border-radius:20px;
padding:0 22px;
font-size:18px;
background:rgba(255,255,255,0.06);
color:white;
margin-bottom:22px;
"
/>

<button
id="enter-btn"
style="
width:100%;
height:62px;
border:none;
border-radius:20px;
cursor:pointer;
font-size:18px;
font-weight:bold;
color:white;
background:
linear-gradient(
135deg,
#00ffd5,
#7b61ff,
#ff00c8
);
box-shadow:
0 0 35px rgba(123,97,255,0.35);
"
>
Enter Chat
</button>

</div>
`;

document.body.appendChild(overlay);

const usernameField =
document.getElementById("username-field");

const enterBtn =
document.getElementById("enter-btn");

/* ENTER CHAT */

enterBtn.addEventListener("click", () => {

  if(usernameField.value.trim() === ""){

    alert("Enter username");

    return;
  }

  username = usernameField.value.trim();

  overlay.remove();

  socket.emit("join-chat", username);

});

/* ONLINE USERS */

socket.on("online-users", (count) => {

  onlineCount.innerText = `${count} Online`;

});

/* SEND MESSAGE */

sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keypress", (e) => {

  if(e.key === "Enter"){

    sendMessage();

  }

});

function sendMessage(){

  const message =
  messageInput.value.trim();

  if(message === "") return;

  const messageData = {

    username,

    message,

    time: new Date().toLocaleTimeString([], {
      hour:"2-digit",
      minute:"2-digit"
    })

  };

  socket.emit("send-message", messageData);

  messageInput.value = "";

}

/* RECEIVE MESSAGE */

socket.on("receive-message", (data) => {

  addMessage(data);

});

/* ADD MESSAGE */

function addMessage(data){

  const div =
  document.createElement("div");

  if(data.username === username){

    div.classList.add(
      "message",
      "own-message"
    );

  }else{

    div.classList.add("message");

  }

  div.innerHTML = `

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

  messageContainer.appendChild(div);

  messageContainer.scrollTop =
  messageContainer.scrollHeight;

}