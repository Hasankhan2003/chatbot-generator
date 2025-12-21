// uiComponents.js - Handles UI rendering and updates

class UIComponents {
    constructor() {
        this.chatListEl = document.getElementById('chatList');
        this.messagesContainerEl = document.getElementById('messagesContainer');
        this.welcomeScreenEl = document.getElementById('welcomeScreen');
        this.chatInterfaceEl = document.getElementById('chatInterface');
        this.currentChatTitleEl = document.getElementById('currentChatTitle');
        this.pdfNameEl = document.getElementById('pdfName');
        this.messageInputEl = document.getElementById('messageInput');
        this.sendBtnEl = document.getElementById('sendBtn');
    }

    // Render all chats in sidebar
    renderChatList(chats, currentChatId) {
        this.chatListEl.innerHTML = '';
        
        if (chats.length === 0) {
            this.chatListEl.innerHTML = '<p style="color: #aaa; padding: 20px; text-align: center;">No chats yet</p>';
            return;
        }

        chats.forEach(chat => {
            const chatItem = this.createChatItem(chat, chat.id === currentChatId);
            this.chatListEl.appendChild(chatItem);
        });
    }

    // Create a single chat item element
    createChatItem(chat, isActive) {
        const div = document.createElement('div');
        div.className = `chat-item ${isActive ? 'active' : ''}`;
        div.dataset.chatId = chat.id;
        
        div.innerHTML = `
            <div class="chat-item-content">
                <div class="chat-item-title">${chat.title}</div>
                <div class="chat-item-pdf">${chat.pdfName || 'No PDF'}</div>
            </div>
            <div class="chat-item-actions">
                <button class="btn-icon btn-delete" data-action="delete" title="Delete">🗑️</button>
            </div>
        `;
        
        return div;
    }

    // Render messages in chat
    renderMessages(messages) {
        this.messagesContainerEl.innerHTML = '';
        
        messages.forEach(msg => {
            const messageEl = this.createMessageElement(msg);
            this.messagesContainerEl.appendChild(messageEl);
        });

        // Scroll to bottom
        this.messagesContainerEl.scrollTop = this.messagesContainerEl.scrollHeight;
    }

    // Create a single message element
    createMessageElement(message) {
        const div = document.createElement('div');
        div.className = `message ${message.role}`;
        div.textContent = message.content;
        return div;
    }

    // Add a single message (for real-time updates)
    addMessage(message) {
        const messageEl = this.createMessageElement(message);
        this.messagesContainerEl.appendChild(messageEl);
        this.messagesContainerEl.scrollTop = this.messagesContainerEl.scrollHeight;
    }

    // Show welcome screen
    showWelcomeScreen() {
        this.welcomeScreenEl.style.display = 'flex';
        this.chatInterfaceEl.style.display = 'none';
    }

    // Show chat interface
    showChatInterface() {
        this.welcomeScreenEl.style.display = 'none';
        this.chatInterfaceEl.style.display = 'flex';
    }

    // Update chat header
    updateChatHeader(chat) {
        if (chat) {
            this.currentChatTitleEl.textContent = chat.title;
            this.pdfNameEl.textContent = chat.pdfName || 'No PDF uploaded';
        }
    }

    // Enable/disable message input
    setInputEnabled(enabled, hasPDF = false) {
        this.messageInputEl.disabled = !enabled || !hasPDF;
        this.sendBtnEl.disabled = !enabled || !hasPDF;
        
        if (!hasPDF) {
            this.messageInputEl.placeholder = 'Upload a PDF first...';
        } else {
            this.messageInputEl.placeholder = 'Ask a question about your PDF...';
        }
    }

    // Show modal
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    // Hide modal
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // Update upload status
    updateUploadStatus(text, isError = false) {
        const statusEl = document.getElementById('uploadStatus');
        statusEl.textContent = text;
        statusEl.style.color = isError ? '#dc3545' : '#28a745';
    }

    // Clear upload status
    clearUploadStatus() {
        document.getElementById('uploadStatus').textContent = '';
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Simple alert for now - you can enhance this later
        alert(message);
    }
}

// Create global instance
const ui = new UIComponents();