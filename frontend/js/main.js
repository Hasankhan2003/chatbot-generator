const API_BASE = "http://localhost:8000";
let currentChatId = null;

const chatListEl = document.getElementById("chat-list");
const newChatBtn = document.getElementById("new-chat-btn");
const chatTitleEl = document.getElementById("chat-title");
const messagesEl = document.getElementById("messages");
const messageForm = document.getElementById("message-form");
const questionInput = document.getElementById("question-input");
const pdfInput = document.getElementById("pdf-input");
const renameChatBtn = document.getElementById("rename-chat-btn");
const deleteChatBtn = document.getElementById("delete-chat-btn");

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }
  return res.json();
}

async function loadChats() {
  const chats = await fetchJSON(`${API_BASE}/chats/`);
  chatListEl.innerHTML = "";
  chats.forEach((c) => {
    const li = document.createElement("li");
    li.textContent = c.name;
    li.dataset.id = c.id;
    li.addEventListener("click", () => selectChat(c.id));
    chatListEl.appendChild(li);
  });
}

function setActiveChatInList() {
  [...chatListEl.children].forEach((li) => {
    li.classList.toggle("active", Number(li.dataset.id) === currentChatId);
  });
}

async function selectChat(chatId) {
  currentChatId = chatId;
  setActiveChatInList();
  const detail = await fetchJSON(`${API_BASE}/chats/${chatId}`);
  chatTitleEl.textContent = detail.name;
  messagesEl.innerHTML = "";
  detail.messages.forEach((m) => addMessageToUI(m.role, m.content));
}

function addMessageToUI(role, content) {
  const div = document.createElement("div");
  div.classList.add("message", role);
  div.textContent = content;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

newChatBtn.addEventListener("click", async () => {
  const created = await fetchJSON(`${API_BASE}/chats/`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  await loadChats();
  await selectChat(created.id);
});

messageForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentChatId) {
    alert("Create or select a chat first.");
    return;
  }
  const question = questionInput.value.trim();
  if (!question) return;
  addMessageToUI("user", question);
  questionInput.value = "";

  try {
    const answer = await fetchJSON(`${API_BASE}/chats/${currentChatId}/messages`, {
      method: "POST",
      body: JSON.stringify({ question }),
    });
    addMessageToUI("assistant", answer.content);
  } catch (err) {
    addMessageToUI("assistant", "Error: " + err.message);
  }
});

pdfInput.addEventListener("change", async (e) => {
  if (!currentChatId) {
    alert("Create or select a chat first.");
    pdfInput.value = "";
    return;
  }
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  addMessageToUI("assistant", "Processing PDF and updating knowledge base...");

  try {
    const res = await fetch(`${API_BASE}/chats/${currentChatId}/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || "Upload failed");
    }
    addMessageToUI("assistant", "PDF processed. You can ask questions now.");
  } catch (err) {
    addMessageToUI("assistant", "Error: " + err.message);
  } finally {
    pdfInput.value = "";
  }
});

renameChatBtn.addEventListener("click", async () => {
  if (!currentChatId) return;
  const newName = prompt("New chat name:");
  if (!newName) return;
  await fetchJSON(`${API_BASE}/chats/${currentChatId}`, {
    method: "PATCH",
    body: JSON.stringify({ name: newName }),
  });
  await loadChats();
  await selectChat(currentChatId);
});

deleteChatBtn.addEventListener("click", async () => {
  if (!currentChatId) return;
  if (!confirm("Delete this chat?")) return;
  await fetchJSON(`${API_BASE}/chats/${currentChatId}`, { method: "DELETE" });
  currentChatId = null;
  chatTitleEl.textContent = "No chat selected";
  messagesEl.innerHTML = "";
  await loadChats();
});

loadChats();
