/* ============================================================
   EdgeSync Support — Agent Portal Logic
   agent/agent.js
   Configure APPWRITE_ENDPOINT and APPWRITE_PROJECT_ID below.
   ============================================================ */

(function () {
  'use strict';

  /* ── CONFIGURATION — update these with your Appwrite details ── */
  const APPWRITE_ENDPOINT   = 'https://fra.cloud.appwrite.io/v1';
  const APPWRITE_PROJECT_ID = 'YOUR_PROJECT_ID_HERE';
  const DB_ID               = 'YOUR_DATABASE_ID_HERE';
  const COLLECTION_CONVS    = 'conversations';
  const COLLECTION_MSGS     = 'messages';

  /* ── State ── */
  let sdk, databases, account, realtime;
  let currentUser = null;
  let conversations = [];
  let activeConvId  = null;
  let activeConv    = null;
  let activeTab     = 'open';
  let searchQuery   = '';
  let convUnsubs    = [];
  let msgUnsub      = null;
  let notesSaveTimeout = null;
  let isDemoMode    = false;

  /* ── Demo Data ── */
  const demoConvs = [
    { $id: 'demo-1', customerName: 'Adewale Okafor', customerEmail: 'adewale@email.com', status: 'open', source: 'Website', startedAt: new Date(Date.now() - 900000).toISOString(), assignedTo: null, lastMessage: 'Hello, I am interested in the Titan-X AWD. What is the current price?', unread: true },
    { $id: 'demo-2', customerName: 'Ngozi Eze', customerEmail: 'ngozi@email.com', status: 'waiting', source: 'WhatsApp', startedAt: new Date(Date.now() - 3600000).toISOString(), assignedTo: 'demo-agent', lastMessage: 'Can you send me the spec sheet?', unread: false },
    { $id: 'demo-3', customerName: 'Emeka Chukwu', customerEmail: 'emeka@email.com', status: 'closed', source: 'Website', startedAt: new Date(Date.now() - 86400000).toISOString(), assignedTo: 'demo-agent', lastMessage: 'Thank you, I have placed the order.', unread: false },
  ];
  const demoMsgs = {
    'demo-1': [
      { $id: 'm1', role: 'customer', body: 'Hello, I am interested in the Titan-X AWD. What is the current price?', createdAt: new Date(Date.now() - 900000).toISOString() }
    ],
    'demo-2': [
      { $id: 'm2', role: 'customer', body: 'Hi, I saw your listing for the Apex XL.', createdAt: new Date(Date.now() - 3700000).toISOString() },
      { $id: 'm3', role: 'agent', body: 'Hi Ngozi! Thanks for reaching out. Yes, the Apex XL is available. How can I help?', createdAt: new Date(Date.now() - 3680000).toISOString() },
      { $id: 'm4', role: 'customer', body: 'Can you send me the spec sheet?', createdAt: new Date(Date.now() - 3600000).toISOString() },
    ],
    'demo-3': [
      { $id: 'm5', role: 'customer', body: 'Thank you, I have placed the order.', createdAt: new Date(Date.now() - 86400000).toISOString() },
    ],
  };

  /* ── Utils ── */
  function toast(msg, duration = 3000) {
    const el = document.getElementById('agent-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('visible');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('visible'), duration);
  }

  function fmtTime(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    if (diffMs < 60000) return 'just now';
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffMs < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString();
  }

  function initials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  /* ── DOM refs ── */
  const loginScreen   = document.getElementById('login-screen');
  const dashboard     = document.getElementById('dashboard');
  const loginForm     = document.getElementById('login-form');
  const loginBtn      = document.getElementById('login-btn');
  const loginBtnText  = document.getElementById('login-btn-text');
  const loginSpinner  = document.getElementById('login-spinner');
  const demoBtn       = document.getElementById('demo-login-btn');
  const emailInput    = document.getElementById('login-email');
  const passInput     = document.getElementById('login-password');
  const emailErr      = document.getElementById('email-error');
  const passErr       = document.getElementById('password-error');
  const loginErr      = document.getElementById('login-error');
  const logoutBtn     = document.getElementById('logout-btn');
  const agentName     = document.getElementById('agent-display-name');
  const agentAvatar   = document.getElementById('agent-avatar-letter');
  const agentStatus   = document.getElementById('agent-status-label');
  const agentDot      = document.getElementById('agent-status-dot');
  const statOpen      = document.getElementById('stat-open');
  const statWaiting   = document.getElementById('stat-waiting');
  const convSearch    = document.getElementById('conv-search');
  const convList      = document.getElementById('conv-list');
  const countOpen     = document.getElementById('count-open');
  const countWaiting  = document.getElementById('count-waiting');
  const threadEmpty   = document.getElementById('thread-empty');
  const threadView    = document.getElementById('thread-view');
  const threadAvatar  = document.getElementById('thread-avatar');
  const threadName    = document.getElementById('thread-name');
  const threadSub     = document.getElementById('thread-sub');
  const threadMsgs    = document.getElementById('thread-messages');
  const threadTyping  = document.getElementById('thread-typing');
  const threadInput   = document.getElementById('thread-input');
  const threadSend    = document.getElementById('thread-send');
  const threadAttach  = document.getElementById('thread-attach');
  const fileInput     = document.getElementById('thread-file-input');
  const infoName      = document.getElementById('info-name');
  const infoEmail     = document.getElementById('info-email');
  const infoSource    = document.getElementById('info-source');
  const infoStarted   = document.getElementById('info-started');
  const infoAssigned  = document.getElementById('info-assigned');
  const convStatus    = document.getElementById('conv-status-select');
  const agentNotes    = document.getElementById('agent-notes');
  const saveNotesBtn  = document.getElementById('save-notes-btn');
  const btnBack       = document.getElementById('btn-back-list');
  const btnAssign     = document.getElementById('btn-assign-self');
  const btnClose      = document.getElementById('btn-close-conv');
  const btnReopen     = document.getElementById('btn-reopen-conv');
  const btnEmail      = document.getElementById('btn-email-customer');
  const btnWA         = document.getElementById('btn-whatsapp-customer');
  const statusToggle  = document.getElementById('status-toggle');
  const statusMenu    = document.getElementById('status-menu');
  const statusOptions = document.querySelectorAll('.status-option');

  /* ── Show Dashboard ── */
  function showDashboard(user) {
    currentUser = user;
    loginScreen.style.display = 'none';
    dashboard.style.display   = 'flex';
    agentName.textContent   = user.name || user.email || 'Agent';
    agentAvatar.textContent = initials(user.name || user.email || 'A');
    loadConversations();
  }

  /* ── Appwrite Init ── */
  function initAppwrite() {
    sdk       = Appwrite;
    const client = new sdk.Client();
    client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
    account   = new sdk.Account(client);
    databases = new sdk.Databases(client);
    realtime  = new sdk.Realtime(client);
  }

  /* ── Login ── */
  function setLoading(on) {
    loginBtn.disabled    = on;
    loginBtnText.style.display = on ? 'none' : 'inline';
    loginSpinner.style.display = on ? 'inline-block' : 'none';
  }

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    let valid = true;
    emailErr.classList.remove('visible');
    passErr.classList.remove('visible');
    loginErr.textContent = '';

    const email = emailInput.value.trim();
    const pass  = passInput.value;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailErr.classList.add('visible'); emailInput.classList.add('error'); valid = false;
    } else { emailInput.classList.remove('error'); }

    if (!pass) {
      passErr.classList.add('visible'); passInput.classList.add('error'); valid = false;
    } else { passInput.classList.remove('error'); }

    if (!valid) return;
    setLoading(true);

    try {
      initAppwrite();
      await account.createEmailPasswordSession(email, pass);
      const user = await account.get();
      showDashboard(user);
    } catch (err) {
      loginErr.textContent = err.message || 'Sign-in failed. Please check your credentials.';
      loginErr.classList.add('visible');
    } finally {
      setLoading(false);
    }
  });

  /* ── Demo Mode ── */
  demoBtn.addEventListener('click', () => {
    isDemoMode = true;
    conversations = [...demoConvs];
    showDashboard({ name: 'Demo Agent', email: 'demo@edgesync.io' });
  });

  /* ── Logout ── */
  logoutBtn.addEventListener('click', async () => {
    if (!isDemoMode) {
      try { await account.deleteSession('current'); } catch (_) {}
    }
    location.reload();
  });

  /* ── Load Conversations ── */
  async function loadConversations() {
    if (isDemoMode) {
      renderConvList();
      updateStats();
      subscribeConversations();
      return;
    }
    try {
      const res = await databases.listDocuments(DB_ID, COLLECTION_CONVS, [
        Appwrite.Query.orderDesc('$updatedAt'), Appwrite.Query.limit(100)
      ]);
      conversations = res.documents;
      renderConvList();
      updateStats();
      subscribeConversations();
    } catch (err) {
      toast('Failed to load conversations: ' + err.message);
    }
  }

  /* ── Render Conversation List ── */
  function renderConvList() {
    const filtered = conversations.filter(c => {
      const matchesTab = activeTab === 'all' || c.status === activeTab;
      const matchesSearch = !searchQuery ||
        (c.customerName || '').toLowerCase().includes(searchQuery) ||
        (c.customerEmail || '').toLowerCase().includes(searchQuery);
      return matchesTab && matchesSearch;
    });

    if (!filtered.length) {
      convList.innerHTML = `<div class="sidebar__empty">No conversations found.</div>`;
      return;
    }

    convList.innerHTML = filtered.map(c => `
      <div class="conv-item ${c.$id === activeConvId ? 'active' : ''} ${c.unread ? 'unread' : ''}"
           data-id="${c.$id}" role="option">
        ${c.unread ? '<div class="conv-item__unread-dot"></div>' : ''}
        <div class="conv-item__avatar">${initials(c.customerName)}</div>
        <div class="conv-item__body">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
            <div class="conv-item__name">${escHtml(c.customerName || 'Unknown')}</div>
            <div class="conv-item__time">${fmtTime(c.$updatedAt || c.startedAt)}</div>
          </div>
          <div class="conv-item__preview">${escHtml(c.lastMessage || '—')}</div>
        </div>
      </div>
    `).join('');

    convList.querySelectorAll('.conv-item').forEach(el => {
      el.addEventListener('click', () => openConversation(el.dataset.id));
    });
  }

  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── Update Stats ── */
  function updateStats() {
    const openCount    = conversations.filter(c => c.status === 'open').length;
    const waitingCount = conversations.filter(c => c.status === 'waiting').length;
    statOpen.textContent    = openCount;
    statWaiting.textContent = waitingCount;
    countOpen.textContent   = openCount;
    countWaiting.textContent = waitingCount;
    countWaiting.style.display = waitingCount > 0 ? 'inline-flex' : 'none';
  }

  /* ── Open Conversation ── */
  async function openConversation(id) {
    activeConvId = id;
    activeConv   = conversations.find(c => c.$id === id);
    if (!activeConv) return;

    /* Mark read */
    activeConv.unread = false;
    renderConvList();

    /* Populate info panel */
    infoName.textContent     = activeConv.customerName  || '—';
    infoEmail.textContent    = activeConv.customerEmail || '—';
    infoSource.textContent   = activeConv.source        || '—';
    infoStarted.textContent  = fmtTime(activeConv.startedAt || activeConv.$createdAt);
    infoAssigned.textContent = activeConv.assignedTo    || 'Unassigned';
    convStatus.value         = activeConv.status        || 'open';
    agentNotes.value         = activeConv.notes         || '';

    /* Thread header */
    threadAvatar.textContent = initials(activeConv.customerName);
    threadName.textContent   = activeConv.customerName  || 'Unknown Customer';
    threadSub.textContent    = `${capitalise(activeConv.status || 'open')} · ${activeConv.source || 'Website'}`;

    /* Show/hide resolve/reopen */
    const isClosed = activeConv.status === 'closed';
    btnClose.style.display  = isClosed ? 'none' : 'inline-flex';
    btnReopen.style.display = isClosed ? 'inline-flex' : 'none';

    /* Show thread */
    threadEmpty.style.display = 'none';
    threadView.style.display  = 'flex';

    /* Load messages */
    await loadMessages(id);

    /* Subscribe realtime */
    if (msgUnsub) { msgUnsub(); msgUnsub = null; }
    if (!isDemoMode) subscribeMessages(id);
  }

  function capitalise(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }

  /* ── Load Messages ── */
  async function loadMessages(convId) {
    threadMsgs.innerHTML = '';
    let msgs = [];
    if (isDemoMode) {
      msgs = demoMsgs[convId] || [];
    } else {
      try {
        const res = await databases.listDocuments(DB_ID, COLLECTION_MSGS, [
          Appwrite.Query.equal('conversationId', convId),
          Appwrite.Query.orderAsc('$createdAt'),
          Appwrite.Query.limit(200)
        ]);
        msgs = res.documents;
      } catch (err) { toast('Failed to load messages'); return; }
    }
    msgs.forEach(m => appendMessage(m));
    scrollToBottom();
    threadTyping.style.opacity = '0';
  }

  function appendMessage(msg) {
    const role = msg.role || (msg.isAgent ? 'agent' : 'customer');
    const div = document.createElement('div');
    div.className = `message message--${role}`;
    div.dataset.id = msg.$id;
    div.innerHTML = `
      <div class="message__avatar">${role === 'agent' ? initials(currentUser?.name || 'A') : initials(activeConv?.customerName)}</div>
      <div>
        <div class="message__bubble">${escHtml(msg.body || '')}</div>
        <div class="message__meta">${fmtTime(msg.$createdAt || msg.createdAt)}</div>
      </div>`;
    threadMsgs.appendChild(div);
  }

  function scrollToBottom() {
    threadMsgs.scrollTop = threadMsgs.scrollHeight;
  }

  /* ── Send Message ── */
  async function sendMessage() {
    const body = threadInput.value.trim();
    if (!body || !activeConvId) return;
    threadInput.value = '';
    threadSend.disabled = true;

    const msg = {
      conversationId: activeConvId,
      role: 'agent',
      body,
      agentId: currentUser?.$id || 'demo',
      agentName: currentUser?.name || 'Agent',
      $createdAt: new Date().toISOString(),
      $id: 'tmp-' + Date.now(),
    };

    appendMessage(msg);
    scrollToBottom();

    if (!isDemoMode) {
      try {
        await databases.createDocument(DB_ID, COLLECTION_MSGS, Appwrite.ID.unique(), {
          conversationId: activeConvId,
          role: 'agent',
          body,
          agentId: currentUser?.$id || '',
          agentName: currentUser?.name || 'Agent',
        });
        /* update conversation lastMessage */
        await databases.updateDocument(DB_ID, COLLECTION_CONVS, activeConvId, { lastMessage: body });
      } catch (err) { toast('Failed to send: ' + err.message); }
    } else {
      if (!demoMsgs[activeConvId]) demoMsgs[activeConvId] = [];
      demoMsgs[activeConvId].push({ ...msg });
    }
  }

  threadInput.addEventListener('input', () => {
    threadSend.disabled = !threadInput.value.trim();
    /* Auto-resize */
    threadInput.style.height = 'auto';
    threadInput.style.height = Math.min(threadInput.scrollHeight, 120) + 'px';
  });

  threadInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  threadSend.addEventListener('click', sendMessage);

  /* Quick replies */
  document.querySelectorAll('.quick-reply-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      threadInput.value = btn.dataset.reply;
      threadInput.dispatchEvent(new Event('input'));
      threadInput.focus();
    });
  });

  /* Attach */
  threadAttach.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) toast(`File "${fileInput.files[0].name}" ready to send — sending files requires full integration.`);
    fileInput.value = '';
  });

  /* ── Conversation Actions ── */
  async function updateConvStatus(newStatus) {
    if (!activeConvId) return;
    if (isDemoMode) {
      const c = conversations.find(c => c.$id === activeConvId);
      if (c) { c.status = newStatus; activeConv.status = newStatus; }
      renderConvList(); updateStats();
      toast(`Conversation marked as ${newStatus}`);
      return;
    }
    try {
      await databases.updateDocument(DB_ID, COLLECTION_CONVS, activeConvId, { status: newStatus });
      toast(`Conversation marked as ${newStatus}`);
    } catch (err) { toast('Update failed: ' + err.message); }
  }

  btnClose.addEventListener('click',  () => updateConvStatus('closed'));
  btnReopen.addEventListener('click', () => updateConvStatus('open'));
  convStatus.addEventListener('change', () => updateConvStatus(convStatus.value));

  btnAssign.addEventListener('click', async () => {
    if (!activeConvId) return;
    const name = currentUser?.name || currentUser?.email || 'Agent';
    if (isDemoMode) {
      activeConv.assignedTo = name;
      infoAssigned.textContent = name;
      toast('Assigned to you');
      return;
    }
    try {
      await databases.updateDocument(DB_ID, COLLECTION_CONVS, activeConvId, { assignedTo: name });
      infoAssigned.textContent = name;
      toast('Assigned to you');
    } catch (err) { toast('Failed: ' + err.message); }
  });

  btnBack.addEventListener('click', () => {
    threadEmpty.style.display = 'flex';
    threadView.style.display  = 'none';
    activeConvId = null;
    renderConvList();
  });

  /* Notes */
  agentNotes.addEventListener('input', () => {
    clearTimeout(notesSaveTimeout);
    notesSaveTimeout = setTimeout(() => saveNotes(), 1500);
  });
  saveNotesBtn.addEventListener('click', saveNotes);

  async function saveNotes() {
    if (!activeConvId) return;
    const notes = agentNotes.value;
    if (isDemoMode) { toast('Notes saved'); return; }
    try {
      await databases.updateDocument(DB_ID, COLLECTION_CONVS, activeConvId, { notes });
      toast('Notes saved');
    } catch (_) {}
  }

  /* Email / WhatsApp quick action */
  btnEmail.addEventListener('click', () => {
    const email = activeConv?.customerEmail;
    if (email) window.open(`mailto:${email}`, '_blank');
    else toast('No email address on file');
  });

  btnWA.addEventListener('click', () => {
    const phone = activeConv?.customerPhone;
    if (phone) window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank', 'noopener');
    else toast('No WhatsApp number on file');
  });

  /* ── Status Dropdown ── */
  statusToggle.addEventListener('click', e => {
    e.stopPropagation();
    statusMenu.classList.toggle('open');
    statusToggle.setAttribute('aria-expanded', statusMenu.classList.contains('open'));
  });
  document.addEventListener('click', () => statusMenu.classList.remove('open'));

  statusOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      statusOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      const s = opt.dataset.status;
      agentDot.className = `status-dot status-dot--${s}`;
      agentStatus.textContent = s === 'online' ? '● Online' : s === 'away' ? '● Away' : '● Offline';
      statusMenu.classList.remove('open');
    });
  });

  /* ── Sidebar Tabs ── */
  document.querySelectorAll('.sidebar__tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sidebar__tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      activeTab = tab.dataset.tab;
      renderConvList();
    });
  });

  /* ── Search ── */
  convSearch.addEventListener('input', () => {
    searchQuery = convSearch.value.toLowerCase().trim();
    renderConvList();
  });

  /* ── Realtime Subscriptions ── */
  function subscribeConversations() {
    if (isDemoMode) return;
    try {
      const unsub = realtime.subscribe(
        `databases.${DB_ID}.collections.${COLLECTION_CONVS}.documents`,
        e => {
          const doc = e.payload;
          const idx = conversations.findIndex(c => c.$id === doc.$id);
          if (e.events.some(ev => ev.includes('.create'))) {
            if (idx === -1) conversations.unshift({ ...doc, unread: true });
          } else if (e.events.some(ev => ev.includes('.update'))) {
            if (idx > -1) {
              const wasActive = conversations[idx].$id === activeConvId;
              conversations[idx] = { ...doc, unread: !wasActive };
              if (wasActive) {
                activeConv = conversations[idx];
                convStatus.value = doc.status;
                infoAssigned.textContent = doc.assignedTo || 'Unassigned';
              }
            }
          } else if (e.events.some(ev => ev.includes('.delete'))) {
            if (idx > -1) conversations.splice(idx, 1);
          }
          renderConvList();
          updateStats();
        }
      );
      convUnsubs.push(unsub);
    } catch (_) {}
  }

  function subscribeMessages(convId) {
    if (isDemoMode) return;
    try {
      msgUnsub = realtime.subscribe(
        `databases.${DB_ID}.collections.${COLLECTION_MSGS}.documents`,
        e => {
          if (!e.events.some(ev => ev.includes('.create'))) return;
          const msg = e.payload;
          if (msg.conversationId !== convId) return;
          /* Skip echo of our own messages */
          if (msg.role === 'agent') return;
          appendMessage(msg);
          scrollToBottom();
          threadTyping.style.opacity = '0';
        }
      );
    } catch (_) {}
  }

  /* ── Auto-dismiss login screen if session exists ── */
  (async function checkSession() {
    if (typeof Appwrite === 'undefined') return;
    try {
      initAppwrite();
      const user = await account.get();
      showDashboard(user);
    } catch (_) { /* Not logged in */ }
  })();

})();
