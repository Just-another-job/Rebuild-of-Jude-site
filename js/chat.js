/* ============================================================
   Customer Support Chat Widget Logic
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const fab = document.getElementById('chat-fab');
  const widget = document.getElementById('chat-widget');
  const closeBtn = document.getElementById('chat-widget-close');
  const messagesContainer = document.getElementById('chat-widget-messages');
  const inputEl = document.getElementById('chat-widget-input');
  const sendBtn = document.getElementById('chat-widget-send');

  // Toggle Widget
  function toggleWidget() {
    widget.classList.toggle('open');
    if (widget.classList.contains('open')) {
      inputEl.focus();
    }
  }

  if (fab) fab.addEventListener('click', (e) => {
    e.preventDefault();
    toggleWidget();
  });
  
  if (closeBtn) closeBtn.addEventListener('click', () => {
    widget.classList.remove('open');
  });

  // Appwrite Config (Matches agent.js)
  const APPWRITE_ENDPOINT   = 'https://fra.cloud.appwrite.io/v1';
  const APPWRITE_PROJECT_ID = 'YOUR_PROJECT_ID_HERE';
  const DB_ID               = 'YOUR_DATABASE_ID_HERE';
  const COLLECTION_CONVS    = 'conversations';
  const COLLECTION_MSGS     = 'messages';

  let sdk, databases, realtime;
  let conversationId = localStorage.getItem('axis_chat_id');
  
  // Init Appwrite (fail gracefully if not configured)
  try {
    if (typeof Appwrite !== 'undefined') {
      sdk = new Appwrite.Client();
      sdk.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
      databases = new Appwrite.Databases(sdk);
      realtime = new Appwrite.Realtime(sdk);
      
      if (conversationId && APPWRITE_PROJECT_ID !== 'YOUR_PROJECT_ID_HERE') {
        loadMessages();
        subscribeToMessages();
      }
    }
  } catch (err) {
    console.warn("Appwrite init failed (demo mode active)", err);
  }

  // Scroll to bottom
  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Add message to UI
  function appendMessage(text, role) {
    const div = document.createElement('div');
    div.className = `chat-msg chat-msg--${role}`;
    div.textContent = text;
    messagesContainer.appendChild(div);
    scrollToBottom();
  }

  // Demo responses
  const demoResponses = [
    "Thanks for reaching out! Since this is a demo, I'm an automated assistant.",
    "Our electric vehicles offer up to 335 miles of range.",
    "You can schedule a test drive at your nearest showroom.",
    "Would you like to know more about our charging network?"
  ];

  // Send Message
  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    // UI update immediately
    appendMessage(text, 'customer');
    inputEl.value = '';

    // If Appwrite is not configured, use Demo Mode
    if (APPWRITE_PROJECT_ID === 'YOUR_PROJECT_ID_HERE' || typeof Appwrite === 'undefined') {
      setTimeout(() => {
        const randomReply = demoResponses[Math.floor(Math.random() * demoResponses.length)];
        appendMessage(randomReply, 'agent');
      }, 1000);
      return;
    }

    // Appwrite active logic
    try {
      if (!conversationId) {
        // Create new conversation
        const conv = await databases.createDocument(DB_ID, COLLECTION_CONVS, Appwrite.ID.unique(), {
          customerName: 'Guest User',
          source: 'Website',
          status: 'open',
          lastMessage: text
        });
        conversationId = conv.$id;
        localStorage.setItem('axis_chat_id', conversationId);
        subscribeToMessages();
      } else {
        // Update last message
        await databases.updateDocument(DB_ID, COLLECTION_CONVS, conversationId, { lastMessage: text });
      }

      // Create message document
      await databases.createDocument(DB_ID, COLLECTION_MSGS, Appwrite.ID.unique(), {
        conversationId: conversationId,
        role: 'customer',
        body: text
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  }

  async function loadMessages() {
    try {
      const res = await databases.listDocuments(DB_ID, COLLECTION_MSGS, [
        Appwrite.Query.equal('conversationId', conversationId),
        Appwrite.Query.orderAsc('$createdAt'),
        Appwrite.Query.limit(50)
      ]);
      
      // Clear welcome message
      messagesContainer.innerHTML = '';
      
      res.documents.forEach(msg => {
        appendMessage(msg.body, msg.role);
      });
      scrollToBottom();
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }

  function subscribeToMessages() {
    if (!realtime || !conversationId) return;
    realtime.subscribe(`databases.${DB_ID}.collections.${COLLECTION_MSGS}.documents`, e => {
      if (e.events.some(ev => ev.includes('.create'))) {
        const msg = e.payload;
        if (msg.conversationId === conversationId && msg.role === 'agent') {
          appendMessage(msg.body, 'agent');
        }
      }
    });
  }

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
});
