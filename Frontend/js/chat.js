const chatSection = document.getElementById("chatSection");
const messagesDiv = document.getElementById("messages");
const sendBtn = document.getElementById("sendBtn");
const questionInput = document.getElementById("questionInput");

function loadChat(chatId) {
    currentChatId = chatId;
    chatSection.classList.remove("hidden");
    messagesDiv.innerHTML = "";
}

sendBtn.onclick = async () => {
    const question = questionInput.value.trim();
    if (!question) return;

    addMessage("You", question, "user");
    questionInput.value = "";

    const response = await askQuestion(currentChatId, question);
    addMessage("Bot", response.answer, "bot");
};

function addMessage(sender, text, className) {
    const div = document.createElement("div");
    div.classList.add("message", className);
    div.innerHTML = `<span class="${className}">${sender}:</span> ${text}`;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
