// app.js - Main application logic and event handlers

class App {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInitialState();
    }

    setupEventListeners() {
        // New chat buttons
        document.getElementById('newChatBtn').addEventListener('click', () => this.createNewChat());
        document.getElementById('startNewChatBtn').addEventListener('click', () => this.createNewChat());

        // Chat list interactions
        document.getElementById('chatList').addEventListener('click', (e) => {
            const chatItem = e.target.closest('.chat-item');
            const deleteBtn = e.target.closest('[data-action="delete"]');

            if (deleteBtn && chatItem) {
                e.stopPropagation();
                this.deleteChat(chatItem.dataset.chatId);
            } else if (chatItem) {
                this.selectChat(chatItem.dataset.chatId);
            }
        });

        // Rename chat
        document.getElementById('renameChatBtn').addEventListener('click', () => this.openRenameModal());
        document.getElementById('cancelRenameBtn').addEventListener('click', () => this.closeRenameModal());
        document.getElementById('confirmRenameBtn').addEventListener('click', () => this.confirmRename());
        
        // Allow Enter key in rename modal
        document.getElementById('renameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.confirmRename();
        });

        // PDF upload
        document.getElementById('uploadBtn').addEventListener('click', () => {
            document.getElementById('pdfInput').click();
        });
        
        document.getElementById('pdfInput').addEventListener('change', (e) => {
            this.handlePDFUpload(e.target.files[0]);
        });

        // Message sending
        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Close modal on outside click
        document.getElementById('renameModal').addEventListener('click', (e) => {
            if (e.target.id === 'renameModal') this.closeRenameModal();
        });
    }

    loadInitialState() {
        const chats = chatManager.getAllChats();
        ui.renderChatList(chats, null);
        
        if (chats.length > 0) {
            // Optionally load the most recent chat
            // this.selectChat(chats[0].id);
            ui.showWelcomeScreen();
        } else {
            ui.showWelcomeScreen();
        }
    }

    createNewChat() {
        const chat = chatManager.createChat();
        chatManager.setCurrentChat(chat.id);
        
        this.refreshUI();
        ui.showChatInterface();
        ui.setInputEnabled(true, false);
    }

    selectChat(chatId) {
        chatManager.setCurrentChat(chatId);
        const chat = chatManager.getCurrentChat();
        
        if (chat) {
            ui.showChatInterface();
            ui.updateChatHeader(chat);
            ui.renderMessages(chat.messages);
            ui.setInputEnabled(true, !!chat.pdfName);
            ui.renderChatList(chatManager.getAllChats(), chatId);
            ui.clearUploadStatus();
        }
    }

    deleteChat(chatId) {
        if (confirm('Are you sure you want to delete this chat?')) {
            chatManager.deleteChat(chatId);
            
            // If deleted chat was current, show welcome screen
            if (chatManager.currentChatId === chatId) {
                chatManager.setCurrentChat(null);
                ui.showWelcomeScreen();
            }
            
            this.refreshUI();
        }
    }

    openRenameModal() {
        const chat = chatManager.getCurrentChat();
        if (chat) {
            document.getElementById('renameInput').value = chat.title;
            ui.showModal('renameModal');
            document.getElementById('renameInput').focus();
        }
    }

    closeRenameModal() {
        ui.hideModal('renameModal');
    }

    confirmRename() {
        const newTitle = document.getElementById('renameInput').value.trim();
        const chat = chatManager.getCurrentChat();
        
        if (newTitle && chat) {
            chatManager.renameChat(chat.id, newTitle);
            ui.updateChatHeader(chatManager.getCurrentChat());
            this.refreshUI();
            this.closeRenameModal();
        }
    }

    handlePDFUpload(file) {
        if (!file) return;

        const chat = chatManager.getCurrentChat();
        if (!chat) {
            ui.showNotification('Please create a chat first');
            return;
        }

        // Validate PDF
        if (file.type !== 'application/pdf') {
            ui.updateUploadStatus('Please upload a PDF file', true);
            return;
        }

        // Store PDF info
        chatManager.setPDF(chat.id, file.name, file);
        
        // Update UI
        ui.updateChatHeader(chatManager.getCurrentChat());
        ui.updateUploadStatus(`✓ ${file.name} uploaded`);
        ui.setInputEnabled(true, true);

        // Add system message
        this.addSystemMessage(`PDF "${file.name}" uploaded successfully. You can now ask questions about it.`);

        // Reset file input
        document.getElementById('pdfInput').value = '';

        // TODO: When backend is ready, send PDF to server here
        // this.uploadPDFToServer(file, chat.id);
    }

    sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message) return;

        const chat = chatManager.getCurrentChat();
        if (!chat || !chat.pdfName) {
            ui.showNotification('Please upload a PDF first');
            return;
        }

        // Add user message
        chatManager.addMessage(chat.id, {
            role: 'user',
            content: message
        });
        ui.addMessage({ role: 'user', content: message });

        // Clear input
        input.value = '';

        // Simulate assistant response (replace with API call later)
        this.simulateAssistantResponse(message);

        // TODO: When backend is ready, send message to server here
        // this.sendMessageToServer(message, chat.id);
    }

    simulateAssistantResponse(userMessage) {
        // This is a placeholder - replace with actual API call to your backend
        setTimeout(() => {
            const response = `This is a simulated response to: "${userMessage}". When you connect your backend, real responses will appear here.`;
            
            chatManager.addMessage(chatManager.currentChatId, {
                role: 'assistant',
                content: response
            });
            ui.addMessage({ role: 'assistant', content: response });
        }, 1000);
    }

    addSystemMessage(message) {
        chatManager.addMessage(chatManager.currentChatId, {
            role: 'system',
            content: message
        });
        ui.addMessage({ role: 'system', content: message });
    }

    refreshUI() {
        const chats = chatManager.getAllChats();
        ui.renderChatList(chats, chatManager.currentChatId);
    }

    // Placeholder methods for backend integration
    uploadPDFToServer(file, chatId) {
        // TODO: Implement when backend is ready
        // const formData = new FormData();
        // formData.append('pdf', file);
        // formData.append('chatId', chatId);
        // 
        // fetch('YOUR_BACKEND_URL/upload', {
        //     method: 'POST',
        //     body: formData
        // })
        // .then(response => response.json())
        // .then(data => console.log('PDF uploaded:', data))
        // .catch(error => console.error('Error:', error));
    }

    sendMessageToServer(message, chatId) {
        // TODO: Implement when backend is ready
        // fetch('YOUR_BACKEND_URL/chat', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ message, chatId })
        // })
        // .then(response => response.json())
        // .then(data => {
        //     chatManager.addMessage(chatId, {
        //         role: 'assistant',
        //         content: data.response
        //     });
        //     ui.addMessage({ role: 'assistant', content: data.response });
        // })
        // .catch(error => console.error('Error:', error));
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new App();
});