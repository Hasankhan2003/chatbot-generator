// chatManager.js - Handles chat data and state management

class ChatManager {
    constructor() {
        this.chats = this.loadChats();
        this.currentChatId = null;
    }

    // Load chats from localStorage
    loadChats() {
        const stored = localStorage.getItem('pdfChats');
        return stored ? JSON.parse(stored) : [];
    }

    // Save chats to localStorage
    saveChats() {
        localStorage.setItem('pdfChats', JSON.stringify(this.chats));
    }

    // Create a new chat
    createChat(title = 'New Chat') {
        const chat = {
            id: Date.now().toString(),
            title: title,
            pdfName: null,
            pdfFile: null, // Will store file reference for upload
            messages: [],
            createdAt: new Date().toISOString()
        };
        
        this.chats.unshift(chat);
        this.saveChats();
        return chat;
    }

    // Get chat by ID
    getChat(chatId) {
        return this.chats.find(chat => chat.id === chatId);
    }

    // Get all chats
    getAllChats() {
        return this.chats;
    }

    // Update chat
    updateChat(chatId, updates) {
        const chat = this.getChat(chatId);
        if (chat) {
            Object.assign(chat, updates);
            this.saveChats();
            return chat;
        }
        return null;
    }

    // Rename chat
    renameChat(chatId, newTitle) {
        return this.updateChat(chatId, { title: newTitle });
    }

    // Delete chat
    deleteChat(chatId) {
        const index = this.chats.findIndex(chat => chat.id === chatId);
        if (index !== -1) {
            this.chats.splice(index, 1);
            this.saveChats();
            return true;
        }
        return false;
    }

    // Add message to chat
    addMessage(chatId, message) {
        const chat = this.getChat(chatId);
        if (chat) {
            chat.messages.push({
                id: Date.now().toString(),
                ...message,
                timestamp: new Date().toISOString()
            });
            this.saveChats();
            return chat;
        }
        return null;
    }

    // Set PDF for chat
    setPDF(chatId, pdfName, pdfFile) {
        return this.updateChat(chatId, { 
            pdfName: pdfName,
            pdfFile: pdfFile 
        });
    }

    // Set current chat
    setCurrentChat(chatId) {
        this.currentChatId = chatId;
    }

    // Get current chat
    getCurrentChat() {
        return this.currentChatId ? this.getChat(this.currentChatId) : null;
    }
}

// Create global instance
const chatManager = new ChatManager();