const API_BASE = "http://127.0.0.1:8000";

let chats = [];
let currentChatId = null;

const chatListEl        = document.getElementById("chat-list");
const newChatBtn        = document.getElementById("new-chat-btn");
const emptyNewChatBtn   = document.getElementById("empty-new-chat-btn");
const chatTitleEl       = document.getElementById("chat-title");
const renameChatBtn     = document.getElementById("rename-chat-btn");
const fileInput         = document.getElementById("file-input");
const documentsStatusEl = document.getElementById("documents-status");
const messagesEl        = document.getElementById("messages");
const messageInput      = document.getElementById("message-input");
const maxChunksInput    = document.getElementById("max-chunks-input");
const toastEl           = document.getElementById("toast");
const emptyStateEl      = document.getElementById("empty-state");
const chatContainerEl   = document.getElementById("chat-container");
const sendButton        = document.getElementById("send-btn");

/* ── Utilities ─────────────────────────────────────────────────────────── */

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2500);
}

async function api(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers    = isFormData ? {} : { "Content-Type": "application/json" };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });

  if (!res.ok) {
    let text;
    try   { text = await res.text(); }
    catch { text = res.statusText;   }
    throw new Error(`Error ${res.status}: ${text}`);
  }

  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : res.text();
}

/* ── UI state ───────────────────────────────────────────────────────────── */

function showEmptyState() {
  currentChatId = null;
  emptyStateEl.style.display    = "flex";
  chatContainerEl.style.display = "none";
  messagesEl.innerHTML          = "";
  documentsStatusEl.textContent = "";
  chatTitleEl.textContent       = "Chat";
}

function showChatContainer() {
  emptyStateEl.style.display    = "none";
  chatContainerEl.style.display = "flex";
}

/* ── Chats ──────────────────────────────────────────────────────────────── */

async function loadChats() {
  try {
    chats = await api("/chats");
    renderChatList();
    showEmptyState();
  } catch (e) {
    console.error(e);
    showToast("Failed to load chats");
  }
}

function renderChatList() {
  chatListEl.innerHTML = "";
  chats.forEach((chat) => {
    const li = document.createElement("li");
    li.className  = "chat-item" + (chat.id === currentChatId ? " active" : "");
    li.dataset.id = chat.id;

    const mainRow   = document.createElement("div");
    mainRow.className = "chat-item-main";

    const titleSpan = document.createElement("span");
    titleSpan.textContent = chat.title || `Chat ${chat.id}`;
    mainRow.appendChild(titleSpan);

    const actionsRow = document.createElement("div");
    actionsRow.className = "chat-item-actions";

    const renameBtn  = document.createElement("button");
    renameBtn.type   = "button";
    renameBtn.className = "chat-action-btn rename";
    renameBtn.title  = "Rename";
    renameBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      renameChat(chat.id);
    });

    const deleteBtn  = document.createElement("button");
    deleteBtn.type   = "button";
    deleteBtn.className = "chat-action-btn delete";
    deleteBtn.title  = "Delete";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteChat(chat.id);
    });

    actionsRow.appendChild(renameBtn);
    actionsRow.appendChild(deleteBtn);
    li.appendChild(mainRow);
    li.appendChild(actionsRow);
    li.addEventListener("click", () => selectChat(chat.id));
    chatListEl.appendChild(li);
  });
}

async function createChat() {
  try {
    const chat = await api("/chats", {
      method: "POST",
      body: JSON.stringify({ title: "New Chat" }),
    });
    chats.unshift(chat);
    renderChatList();
    selectChat(chat.id);
  } catch (e) {
    console.error(e);
    showToast("Failed to create chat");
  }
}

async function deleteChat(chatId) {
  const chat = chats.find((c) => c.id === chatId);
  if (!chat) return;
  if (!confirm(`Delete "${chat.title || "this chat"}" and all its messages?`)) return;
  try {
    await api(`/chats/${chatId}`, { method: "DELETE" });
    chats = chats.filter((c) => c.id !== chatId);
    if (currentChatId === chatId) showEmptyState();
    renderChatList();
  } catch (e) {
    console.error(e);
    showToast("Failed to delete chat");
  }
}

async function renameChat(chatId) {
  const chat = chats.find((c) => c.id === chatId);
  if (!chat) return;
  const newTitle = prompt("Enter new chat title:", chat.title || "");
  if (newTitle === null) return;
  try {
    const updated = await api(`/chats/${chatId}`, {
      method: "PUT",
      body: JSON.stringify({ title: newTitle || null }),
    });
    const idx = chats.findIndex((c) => c.id === chatId);
    if (idx !== -1) chats[idx] = updated;
    renderChatList();
    if (currentChatId === chatId)
      chatTitleEl.textContent = updated.title || `Chat ${updated.id}`;
  } catch (e) {
    console.error(e);
    showToast("Failed to rename chat");
  }
}

async function selectChat(chatId) {
  currentChatId = chatId;
  const chat    = chats.find((c) => c.id === chatId);
  chatTitleEl.textContent = chat ? chat.title || `Chat ${chat.id}` : "Chat";
  renderChatList();
  showChatContainer();
  await loadMessages(chatId);
}

/* ── Documents ──────────────────────────────────────────────────────────── */

async function uploadDocument(file) {
  if (!currentChatId) {
    showToast("Create or select a chat first");
    return;
  }
  const formData = new FormData();
  formData.append("file", file);
  documentsStatusEl.textContent = "Uploading and processing PDF...";
  try {
    const doc = await api(`/chats/${currentChatId}/documents`, {
      method: "POST",
      body: formData,
    });
    documentsStatusEl.textContent =
      `Document "${doc.filename}" processed (${doc.num_chunks} chunks).`;
  } catch (e) {
    console.error(e);
    documentsStatusEl.textContent = "";
    showToast("Failed to upload document");
  }
}

/* ── Messages ───────────────────────────────────────────────────────────── */

async function loadMessages(chatId) {
  messagesEl.innerHTML = "";
  if (!chatId) return;
  try {
    const msgs = await api(`/chats/${chatId}/messages`);
    msgs.forEach((m) => addMessageToUI(m.role, m.content));
    messagesEl.scrollTop = messagesEl.scrollHeight;
  } catch (e) {
    console.error(e);
    showToast("Failed to load messages");
  }
}

function addMessageToUI(role, content, metaText = "") {
  const div  = document.createElement("div");
  div.className = `message ${role}`;

  const text = document.createElement("div");
  text.textContent = content;
  div.appendChild(text);

  if (metaText) {
    const meta = document.createElement("div");
    meta.className   = "meta";
    meta.textContent = metaText;
    div.appendChild(meta);
  }

  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function sendMessage() {
  if (!currentChatId) {
    showToast("Select or create a chat first");
    return;
  }

  const text = messageInput.value.trim();
  if (!text) return;

  const maxChunks = parseInt(maxChunksInput.value || "5", 10);

  addMessageToUI("user", text);
  messageInput.value = "";
  messageInput.focus();

  addMessageToUI("assistant", "Thinking...");
  const thinkingNode = messagesEl.lastChild;

  try {
    const res = await api(`/chats/${currentChatId}/ask`, {
      method: "POST",
      body: JSON.stringify({ message: text, max_chunks: maxChunks }),
    });

    thinkingNode.firstChild.textContent = res.answer;

    if (Array.isArray(res.sources) && res.sources.length > 0) {
      const firstSource = res.sources[0];
      const srcText = firstSource.source
        ? `Source: ${firstSource.source} (chunk ${firstSource.chunk_index})`
        : "";
      if (srcText) {
        const meta = document.createElement("div");
        meta.className   = "meta";
        meta.textContent = srcText;
        thinkingNode.appendChild(meta);
      }
    }
  } catch (e) {
    console.error(e);
    thinkingNode.firstChild.textContent = "Error: failed to get answer.";
    showToast("Failed to send message");
  }
}

/* ── Event listeners ────────────────────────────────────────────────────── */

newChatBtn.addEventListener("click", createChat);
emptyNewChatBtn.addEventListener("click", createChat);

renameChatBtn.addEventListener("click", () => {
  if (currentChatId) renameChat(currentChatId);
});

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    uploadDocument(file);
    fileInput.value = "";
  }
});

// Send button — type="button" + no wrapping form = zero chance of page refresh
sendButton.addEventListener("click", sendMessage);

// Enter sends; Shift+Enter inserts a newline
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

/* ── Init ───────────────────────────────────────────────────────────────── */

loadChats();
