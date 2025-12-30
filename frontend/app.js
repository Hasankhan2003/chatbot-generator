// Configuration
const BASE_URL = 'http://127.0.0.1:8000';

// State
let chats = [];
let activeChat = null;
let messages = [];
let isLoading = false;
let isUploadLoading = false;

// API Helper
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        // No Content
        if (response.status === 204) return null;

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Request failed' }));
            throw new Error(error.detail || `HTTP ${response.status}`);
        }

        // Some successful responses may have empty bodies - try to parse JSON safely
        const text = await response.text();
        if (!text) return null;
        try {
            return JSON.parse(text);
        } catch (e) {
            return null;
        }
    } catch (error) {
        throw error;
    }
} 

// Toast
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' 
        ? '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
        : '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    
    toast.innerHTML = `
        ${icon}
        <span class="toast-message">${message}</span>
        <button class="toast-close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>
    `;
    
    container.appendChild(toast);
    
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => toast.remove());
    
    setTimeout(() => toast.remove(), 4000);
}

// Modal
function showModal(title, content, onConfirm) {
    const container = document.getElementById('modal-container');
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
        <div class="modal">
            <h3 class="modal-title">${title}</h3>
            <div class="modal-content">${content}</div>
            <div class="modal-actions">
                <button class="btn btn-secondary modal-cancel">Cancel</button>
                <button class="btn btn-primary modal-confirm">Confirm</button>
            </div>
        </div>
    `;
    
    container.appendChild(modal);
    
    const cancelBtn = modal.querySelector('.modal-cancel');
    const confirmBtn = modal.querySelector('.modal-confirm');
    
    const close = () => modal.remove();
    
    cancelBtn.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });
    
    confirmBtn.addEventListener('click', () => {
        onConfirm();
        close();
    });
    
    // Focus first input if exists
    const input = modal.querySelector('input');
    if (input) {
        input.focus();
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                onConfirm();
                close();
            }
        });
    }
}

// Render chat list
function renderChatList() {
    const chatList = document.getElementById('chat-list');
    chatList.innerHTML = '';
    
    chats.forEach(chat => {
        const item = document.createElement('div');
        item.className = `chat-item ${activeChat?.id === chat.id ? 'active' : ''}`;
        item.dataset.chatId = chat.id;
        
        item.innerHTML = `
            <span class="chat-item-title">${chat.title}</span>
            <div class="chat-item-actions">
                <button class="icon-btn edit-chat" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="icon-btn delete-chat" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>
        `;
        
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.icon-btn')) {
                selectChat(chat);
            }
        });
        
        const editBtn = item.querySelector('.edit-chat');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            startEditChat(chat, item);
        });
        
        const deleteBtn = item.querySelector('.delete-chat');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            confirmDeleteChat(chat);
        });
        
        chatList.appendChild(item);
    });
}

// Start editing chat
function startEditChat(chat, itemElement) {
    const titleSpan = itemElement.querySelector('.chat-item-title');
    const actionsDiv = itemElement.querySelector('.chat-item-actions');
    
    const editDiv = document.createElement('div');
    editDiv.className = 'chat-item-edit';
    editDiv.innerHTML = `
        <input type="text" value="${chat.title}" class="edit-input">
        <button class="btn btn-primary btn-sm save-edit">Save</button>
        <button class="btn btn-secondary btn-sm cancel-edit">Cancel</button>
    `;
    
    titleSpan.style.display = 'none';
    actionsDiv.style.display = 'none';
    itemElement.insertBefore(editDiv, actionsDiv);
    
    const input = editDiv.querySelector('.edit-input');
    const saveBtn = editDiv.querySelector('.save-edit');
    const cancelBtn = editDiv.querySelector('.cancel-edit');
    
    input.focus();
    input.select();
    
    const save = async () => {
        const newTitle = input.value.trim();
        if (!newTitle) {
            showToast('Title cannot be empty', 'error');
            return;
        }
        
        try {
            const updated = await apiRequest(`/chats/${chat.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
            });
            
            chats = chats.map(c => c.id === chat.id ? updated : c);
            if (activeChat?.id === chat.id) {
                activeChat = updated;
                updateChatTitle();
            }
            renderChatList();
            showToast('Chat renamed successfully');
        } catch (error) {
            showToast('Failed to rename chat: ' + error.message, 'error');
        }
    };
    
    const cancel = () => {
        editDiv.remove();
        titleSpan.style.display = '';
        actionsDiv.style.display = '';
    };
    
    saveBtn.addEventListener('click', save);
    cancelBtn.addEventListener('click', cancel);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') save();
        if (e.key === 'Escape') cancel();
    });
}

// Confirm delete chat
function confirmDeleteChat(chat) {
    showModal(
        'Delete Chat',
        '<p>Are you sure you want to delete this chat? This action cannot be undone.</p>',
        () => deleteChat(chat.id)
    );
}

// Delete chat
async function deleteChat(chatId) {
    try {
        await apiRequest(`/chats/${chatId}`, { method: 'DELETE' });
        chats = chats.filter(c => c.id !== chatId);
        
        if (activeChat?.id === chatId) {
            activeChat = null;
            messages = [];
            updateView();
        }
        
        renderChatList();
        showToast('Chat deleted successfully');
    } catch (error) {
        showToast('Failed to delete chat: ' + error.message, 'error');
    }
}

// Select chat
async function selectChat(chat) {
    activeChat = chat;
    await loadMessages(chat.id);
    updateView();
    renderChatList();
}

// Load messages
async function loadMessages(chatId) {
    try {
        messages = await apiRequest(`/chats/${chatId}/messages`);
        renderMessages();
    } catch (error) {
        showToast('Failed to load messages: ' + error.message, 'error');
    }
}

// Render messages
function renderMessages() {
    const container = document.getElementById('messages-container');
    container.innerHTML = '';
    
    messages.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${msg.role}${msg.loading ? ' loading' : ''}`;
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        
        if (msg.loading) {
            bubble.innerHTML = `
                <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                    <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                </svg>
                Thinking...
            `;
        } else {
            const content = document.createElement('div');
            content.className = 'message-content';
            content.textContent = msg.content;
            bubble.appendChild(content);
            
            if (msg.sources && msg.sources.length > 0) {
                const sources = document.createElement('div');
                sources.className = 'message-sources';
                sources.textContent = 'Sources: ' + msg.sources.map(s => 
                    `Doc ${s.document_id} Chunk ${s.chunk_index}`
                ).join(', ');
                bubble.appendChild(sources);
            }
        }
        
        msgDiv.appendChild(bubble);
        container.appendChild(msgDiv);
    });
    
    scrollToBottom();
}

// Scroll to bottom
function scrollToBottom() {
    const container = document.getElementById('messages-container');
    container.scrollTop = container.scrollHeight;
}

// Update view
function updateView() {
    const emptyState = document.getElementById('empty-state');
    const chatView = document.getElementById('chat-view');
    
    if (activeChat) {
        emptyState.style.display = 'none';
        chatView.style.display = 'flex';
        updateChatTitle();
    } else {
        emptyState.style.display = 'flex';
        chatView.style.display = 'none';
    }
}

// Update chat title
function updateChatTitle() {
    const titleEl = document.getElementById('chat-title');
    if (activeChat) {
        titleEl.textContent = activeChat.title;
    }
}

// Load chats
async function loadChats() {
    try {
        chats = await apiRequest('/chats');
        renderChatList();
    } catch (error) {
        showToast('Failed to load chats: ' + error.message, 'error');
    }
}

// Create new chat
function createNewChat() {
    showModal(
        'Create New Chat',
        '<input type="text" placeholder="Enter chat title..." class="new-chat-input">',
        async () => {
            const input = document.querySelector('.new-chat-input');
            const title = input.value.trim();
            
            if (!title) {
                showToast('Please enter a chat title', 'error');
                return;
            }
            
            try {
                const chat = await apiRequest('/chats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title })
                });
                
                chats.unshift(chat);
                activeChat = chat;
                messages = [];
                updateView();
                renderChatList();
                showToast('Chat created successfully');
            } catch (error) {
                showToast('Failed to create chat: ' + error.message, 'error');
            }
        }
    );
}

// Upload document
async function uploadDocument(file) {
    if (!activeChat) {
        showToast('Please select a chat first', 'error');
        return;
    }
    
    if (!file.name.toLowerCase().endsWith('.pdf')) {
        showToast('Please upload a PDF file', 'error');
        return;
    }
    
    isUploadLoading = true;
    updateUploadButton();
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const result = await apiRequest(`/chats/${activeChat.id}/documents`, {
            method: 'POST',
            body: formData
        });
        
        showToast(`Document uploaded: ${result.filename} (${result.num_chunks} chunks)`);
    } catch (error) {
        showToast('Failed to upload document: ' + error.message, 'error');
    } finally {
        isUploadLoading = false;
        updateUploadButton();
        document.getElementById('file-input').value = '';
    }
}

// Update upload button
function updateUploadButton() {
    const btn = document.getElementById('upload-btn');
    btn.disabled = isUploadLoading;
    
    if (isUploadLoading) {
        btn.innerHTML = `
            <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
            </svg>
            Uploading...
        `;
    } else {
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload PDF
        `;
    }
}

// Send message
async function sendMessage() {
    const input = document.getElementById('message-input');
    const maxChunksInput = document.getElementById('max-chunks');
    const message = input.value.trim();
    
    if (!message || !activeChat || isLoading) return;
    
    const maxChunks = parseInt(maxChunksInput.value) || 5;
    
    input.value = '';
    isLoading = true;
    updateSendButton();
    
    // Add user message
    const userMsg = {
        id: Date.now(),
        role: 'user',
        content: message,
        created_at: new Date().toISOString()
    };
    messages.push(userMsg);
    
    // Add loading indicator
    const loadingMsg = {
        id: 'loading',
        role: 'assistant',
        content: '',
        loading: true
    };
    messages.push(loadingMsg);
    renderMessages();
    
    try {
        const result = await apiRequest(`/chats/${activeChat.id}/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                max_chunks: maxChunks
            })
        });
        
        // Remove loading, add actual response
        messages = messages.filter(m => m.id !== 'loading');
        
        const assistantMsg = {
            id: result.message_id,
            role: 'assistant',
            content: result.answer,
            sources: result.sources,
            created_at: new Date().toISOString()
        };
        messages.push(assistantMsg);
        renderMessages();
    } catch (error) {
        messages = messages.filter(m => m.id !== 'loading');
        renderMessages();
        showToast('Failed to send message: ' + error.message, 'error');
    } finally {
        isLoading = false;
        updateSendButton();
        input.focus();
    }
}

// Update send button
function updateSendButton() {
    const btn = document.getElementById('send-btn');
    const input = document.getElementById('message-input');
    
    btn.disabled = isLoading || !input.value.trim();
    
    if (isLoading) {
        btn.innerHTML = `
            <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
            </svg>
        `;
    } else {
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
        `;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load chats on startup
    loadChats();
    
    // New chat button
    document.getElementById('new-chat-btn').addEventListener('click', createNewChat);
    
    // Upload button
    document.getElementById('upload-btn').addEventListener('click', () => {
        document.getElementById('file-input').click();
    });
    
    // File input
    document.getElementById('file-input').addEventListener('change', (e) => {
        if (e.target.files[0]) {
            uploadDocument(e.target.files[0]);
        }
    });
    
    // Send button
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    
    // Message input - enter to send
    const messageInput = document.getElementById('message-input');
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Update send button state on input
    messageInput.addEventListener('input', updateSendButton);
});