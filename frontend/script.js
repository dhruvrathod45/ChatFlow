const socket = io("https://chat-flow-lyart.vercel.app/", {
  transports: ["websocket", "polling"]
});

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
overlay.style.background = "rgba(0,0,0,0.7)";
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
background:rgba(15,15,20,0.75);
border:1px solid rgba(255,255,255,0.08);
box-shadow:
0 0 50px rgba(0,255,200,0.12),
0 0 100px rgba(255,0,150,0.08);
">

<h1 style="
font-size:42px;
text-align:center;
margin-bottom:12px;
letter-spacing:4px;
">
CHATFLOW
</h1>

<p style="
text-align:center;
opacity:0.7;
margin-bottom:30px;
">
Enter your identity
</p>

<input
id="username-field"
type="text"
placeholder="Username..."
style="
width:100%;
height:60px;
border:none;
outline:none;
border-radius:18px;
padding:0 20px;
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
height:60px;
border:none;
cursor:pointer;
border-radius:18px;
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

/* JOIN */

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

  onlineCount.innerText =
  `${count} Online`;

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

  const data = {

    username,

    message,

    time: new Date().toLocaleTimeString([], {
      hour:"2-digit",
      minute:"2-digit"
    })

  };

  addMessage(data);

  socket.emit("send-message", data);

  messageInput.value = "";

}

/* RECEIVE */

socket.on("receive-message", (data) => {

  if(data.username !== username){

    addMessage(data);

  }

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