const newChatBtn = document.getElementById("newChatBtn");
const uploadSection = document.getElementById("uploadSection");
const uploadBtn = document.getElementById("uploadBtn");
const pdfInput = document.getElementById("pdfInput");
const chatList = document.getElementById("chatList");

let chats = JSON.parse(localStorage.getItem("chats")) || [];
let currentChatId = null;

function renderChats() {
    chatList.innerHTML = "";
    chats.forEach(chat => {
        const li = document.createElement("li");
        li.textContent = chat.name;
        li.onclick = () => loadChat(chat.id);
        chatList.appendChild(li);
    });
}

newChatBtn.onclick = () => {
    uploadSection.classList.remove("hidden");
};

uploadBtn.onclick = async () => {
    const file = pdfInput.files[0];
    if (!file) {
        alert("Please select a PDF");
        return;
    }

    const chatId = Date.now().toString();
    const chatName = file.name;

    await uploadPDF(chatId, file);

    chats.push({ id: chatId, name: chatName });
    localStorage.setItem("chats", JSON.stringify(chats));

    uploadSection.classList.add("hidden");
    loadChat(chatId);
};

renderChats();
