const BASE_URL = "http://localhost:8000";

async function uploadPDF(chatId, file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("chat_id", chatId);

    const response = await fetch(`${BASE_URL}/upload-pdf`, {
        method: "POST",
        body: formData
    });

    return response.json();
}

async function askQuestion(chatId, question) {
    const response = await fetch(`${BASE_URL}/ask-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: chatId,
            question: question
        })
    });

    return response.json();
}
