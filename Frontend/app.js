// Configuration
const API_BASE_URL = 'http://localhost:5000/api'; // Update this when you deploy

// State Management
let chats = [];
let currentChatId = null;
let selectedFile = null;

// DOM Elements
const elements = {
    // Screens
    welcomeScreen: document.getElementById('welcomeScreen'),
    chatInterface: document.getElementById('chatInterface'),
    
    // Sidebar
    newChatBtn: document.getElementById('newChatBtn'),
    chatList: document.getElementById('chatList'),
    
    // Chat Interface
    currentChatTitle: document.getElementById('currentChatTitle'),
    renameChatBtn: document.getElementById('renameChatBtn'),
    deleteChatBtn: document.getElementById('deleteChatBtn'),
    messagesContainer: document.getElementById('messagesContainer'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    
    // New Chat Modal
    newChatModal: document.getElementById('newChatModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    chatName: document.getElementById('chatName'),
    pdfUpload: document.getElementById('pdfUpload'),
    fileUploadArea: document.getElementById('fileUploadArea'),
    fileInfo: document.getElementById('fileInfo'),
    fileName: document.getElementById('fileName'),
    removeFileBtn: document.getElementById('removeFileBtn'),
    cancelModalBtn: document.getElementById('cancelModalBtn'),
    createChatBtn: document.getElementById('createChatBtn'),
    welcomeNewChatBtn: document.getElementById('welcomeNewChatBtn'),
    
    // Rename Modal
    renameModal: document.getElementById('renameModal'),
    closeRenameModalBtn: document.getElementById('closeRenameModalBtn'),
    renameInput: document.getElementById('renameInput'),
    cancelRenameBtn: document.getElementById('cancelRenameBtn'),
    confirmRenameBtn: document.getElementById('confirmRenameBtn')
};

// Initialize App
function init() {
    loadChats();
    attachEventListeners();
}

// Event Listeners
function attachEventListeners() {
    // New Chat
    elements.newChatBtn.addEventListener('click', openNewChatModal);
    elements.welcomeNewChatBtn.addEventListener('click', openNewChatModal);
    elements.closeModalBtn.addEventListener('click', closeNewChatModal);
    elements.cancelModalBtn.addEventListener('click', closeNewChatModal);
    elements.createChatBtn.addEventListener('click', createNewChat);
    
    // File Upload
    elements.fileUploadArea.addEventListener('click', () => elements.pdfUpload.click());
    elements.pdfUpload.addEventListener('change', handleFileSelect);
    elements.removeFileBtn.addEventListener('click', removeFile);
    
    // Drag and Drop
    elements.fileUploadArea.addEventListener('dragover', handleDragOver);
    elements.fileUploadArea.addEventListener('dragleave', handleDragLeave);
    elements.fileUploadArea.addEventListener('drop', handleDrop);
    
    // Rename Chat
    elements.renameChatBtn.addEventListener('click', openRenameModal);
    elements.closeRenameModalBtn.addEventListener('click', closeRenameModal);
    elements.cancelRenameBtn.addEventListener('click', closeRenameModal);
    elements.confirmRenameBtn.addEventListener('click', renameChat);
    
    // Delete Chat
    elements.deleteChatBtn.addEventListener('click', deleteChat);
    
    // Send Message
    elements.sendBtn.addEventListener('click', sendMessage);
    elements.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

// Load Chats from Backend
async function loadChats() {
    try {
        const response = await fetch(`${API_BASE_URL}/chats`);
        if (response.ok) {
            chats = await response.json();
            renderChatList();
        }
    } catch (error) {
        console.error('Error loading chats:', error);
        // For development without backend
        chats = JSON.parse(localStorage.getItem('chats') || '[]');
        renderChatList();
    }
}

// Render Chat List
function renderChatList() {
    elements.chatList.innerHTML = '';
    
    if (chats.length === 0) {
        elements.chatList.innerHTML = '<p style="padding: 15px; color: #95a5a6; text-align: center; font-size: 14px;">No chats yet</p>';
        return;
    }
    
    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        if (chat.id === currentChatId) {
            chatItem.classList.add('active');
        }
        
        chatItem.innerHTML = `<span class="chat-item-name">${chat.name}</span>`;
        chatItem.addEventListener('click', () => selectChat(chat.id));
        
        elements.chatList.appendChild(chatItem);
    });
}

// Open New Chat Modal
function openNewChatModal() {
    elements.chatName.value = '';
    selectedFile = null;
    elements.fileInfo.classList.add('hidden');
    document.querySelector('.upload-placeholder').classList.remove('hidden');
    elements.createChatBtn.disabled = true;
    elements.newChatModal.classList.remove('hidden');
}

// Close New Chat Modal
function closeNewChatModal() {
    elements.newChatModal.classList.add('hidden');
}

// Handle File Select
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
        selectedFile = file;
        displayFileInfo(file.name);
    }
}

// Display File Info
function displayFileInfo(name) {
    elements.fileName.textContent = name;
    document.querySelector('.upload-placeholder').classList.add('hidden');
    elements.fileInfo.classList.remove('hidden');
    elements.createChatBtn.disabled = false;
}

// Remove File
function removeFile(e) {
    e.stopPropagation();
    selectedFile = null;
    elements.pdfUpload.value = '';
    elements.fileInfo.classList.add('hidden');
    document.querySelector('.upload-placeholder').classList.remove('hidden');
    elements.createChatBtn.disabled = true;
}

// Drag and Drop Handlers
function handleDragOver(e) {
    e.preventDefault();
    elements.fileUploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    elements.fileUploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    elements.fileUploadArea.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
        selectedFile = file;
        elements.pdfUpload.files = e.dataTransfer.files;
        displayFileInfo(file.name);
    }
}

// Create New Chat
async function createNewChat() {
    if (!selectedFile) return;
    
    const chatName = elements.chatName.value.trim() || selectedFile.name.replace('.pdf', '');
    
    const formData = new FormData();
    formData.append('name', chatName);
    formData.append('pdf', selectedFile);
    
    try {
        const response = await fetch(`${API_BASE_URL}/chats`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const newChat = await response.json();
            chats.unshift(newChat);
            renderChatList();
            selectChat(newChat.id);
            closeNewChatModal();
        } else {
            alert('Error creating chat. Please try again.');
        }
    } catch (error) {
        console.error('Error creating chat:', error);
        // For development without backend
        const newChat = {
            id: Date.now().toString(),
            name: chatName,
            messages: [],
            created_at: new Date().toISOString()
        };
        chats.unshift(newChat);
        localStorage.setItem('chats', JSON.stringify(chats));
        renderChatList();
        selectChat(newChat.id);
        closeNewChatModal();
    }
}

// Select Chat
async function selectChat(chatId) {
    currentChatId = chatId;
    const chat = chats.find(c => c.id === chatId);
    
    if (!chat) return;
    
    // Update UI
    elements.welcomeScreen.classList.add('hidden');
    elements.chatInterface.classList.remove('hidden');
    elements.currentChatTitle.textContent = chat.name;
    
    // Load messages
    try {
        const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`);
        if (response.ok) {
            chat.messages = await response.json();
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
    
    renderMessages(chat.messages);
    renderChatList();
    
    // Enable input
    elements.messageInput.disabled = false;
    elements.sendBtn.disabled = false;
    elements.messageInput.focus();
}

// Render Messages
function renderMessages(messages) {
    elements.messagesContainer.innerHTML = '';
    
    if (messages.length === 0) {
        elements.messagesContainer.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">No messages yet. Start by asking a question about your PDF.</p>';
        return;
    }
    
    messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.role}`;
        messageDiv.textContent = msg.content;
        elements.messagesContainer.appendChild(messageDiv);
    });
    
    scrollToBottom();
}

// Send Message
async function sendMessage() {
    const message = elements.messageInput.value.trim();
    if (!message || !currentChatId) return;
    
    const chat = chats.find(c => c.id === currentChatId);
    if (!chat) return;
    
    // Add user message
    const userMessage = { role: 'user', content: message };
    chat.messages.push(userMessage);
    renderMessages(chat.messages);
    elements.messageInput.value = '';
    
    // Show loading
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant loading';
    loadingDiv.textContent = 'Thinking...';
    elements.messagesContainer.appendChild(loadingDiv);
    scrollToBottom();
    
    try {
        const response = await fetch(`${API_BASE_URL}/chats/${currentChatId}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        
        if (response.ok) {
            const data = await response.json();
            chat.messages.push({ role: 'assistant', content: data.response });
            renderMessages(chat.messages);
        } else {
            loadingDiv.textContent = 'Error: Could not get response';
        }
    } catch (error) {
        console.error('Error sending message:', error);
        // For development without backend
        loadingDiv.remove();
        const assistantMessage = { 
            role: 'assistant', 
            content: 'This is a demo response. Connect to backend to get real answers from your PDF.' 
        };
        chat.messages.push(assistantMessage);
        localStorage.setItem('chats', JSON.stringify(chats));
        renderMessages(chat.messages);
    }
}

// Scroll to Bottom
function scrollToBottom() {
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
}

// Open Rename Modal
function openRenameModal() {
    if (!currentChatId) return;
    const chat = chats.find(c => c.id === currentChatId);
    if (!chat) return;
    
    elements.renameInput.value = chat.name;
    elements.renameModal.classList.remove('hidden');
    elements.renameInput.focus();
}

// Close Rename Modal
function closeRenameModal() {
    elements.renameModal.classList.add('hidden');
}

// Rename Chat
async function renameChat() {
    const newName = elements.renameInput.value.trim();
    if (!newName || !currentChatId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/chats/${currentChatId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
        });
        
        if (response.ok) {
            const chat = chats.find(c => c.id === currentChatId);
            if (chat) {
                chat.name = newName;
                elements.currentChatTitle.textContent = newName;
                renderChatList();
            }
            closeRenameModal();
        }
    } catch (error) {
        console.error('Error renaming chat:', error);
        // For development without backend
        const chat = chats.find(c => c.id === currentChatId);
        if (chat) {
            chat.name = newName;
            elements.currentChatTitle.textContent = newName;
            localStorage.setItem('chats', JSON.stringify(chats));
            renderChatList();
        }
        closeRenameModal();
    }
}

// Delete Chat
async function deleteChat() {
    if (!currentChatId) return;
    
    if (!confirm('Are you sure you want to delete this chat?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/chats/${currentChatId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            chats = chats.filter(c => c.id !== currentChatId);
            currentChatId = null;
            renderChatList();
            elements.chatInterface.classList.add('hidden');
            elements.welcomeScreen.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error deleting chat:', error);
        // For development without backend
        chats = chats.filter(c => c.id !== currentChatId);
        localStorage.setItem('chats', JSON.stringify(chats));
        currentChatId = null;
        renderChatList();
        elements.chatInterface.classList.add('hidden');
        elements.welcomeScreen.classList.remove('hidden');
    }
}

// Start the app
init();