window.Pages = window.Pages || {};

window.Pages.chatbot = {
  history: [],
  suggestions: [
    'Nearest hospital to me', 'Next bus on route 12', 'Traffic near downtown',
    'Garbage collection schedule', 'Water supply timing today', 'Report an electricity fault',
    'Government schemes for citizens', 'Tourist spots nearby', 'Emergency numbers',
  ],

  render(root) {
    if (this.history.length === 0) {
      this.history.push({ role: 'bot', text: "Hi, I'm your City AI Assistant. Ask me about hospitals, bus timings, traffic, waste collection, water supply, electricity complaints, government schemes, tourist spots, or emergency services." });
    }
    root.innerHTML = `
      <div class="chat-scroll" id="chat-scroll"></div>
      <div class="chat-suggestions" id="chat-suggestions"></div>
      <div class="chat-input-bar">
        <input type="text" id="chat-input" placeholder="Ask anything about the city…" />
        <button class="chat-send" id="chat-send"><i data-lucide="send"></i></button>
      </div>
    `;
    this.renderMessages();
    document.getElementById('chat-suggestions').innerHTML = this.suggestions.map(s => `<div class="chip">${s}</div>`).join('');
    lucide.createIcons();

    root.querySelectorAll('.chip').forEach(chip => chip.addEventListener('click', () => this.send(chip.textContent)));
    document.getElementById('chat-send').addEventListener('click', () => this.send());
    document.getElementById('chat-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') this.send(); });
  },

  renderMessages() {
    const scroll = document.getElementById('chat-scroll');
    scroll.innerHTML = this.history.map(m => `<div class="msg ${m.role === 'user' ? 'msg-user' : 'msg-bot'}">${m.text}</div>`).join('');
    scroll.scrollIntoView({ block: 'end' });
  },

  async send(prefill) {
    const input = document.getElementById('chat-input');
    const text = (prefill ?? input.value).trim();
    if (!text) return;
    input.value = '';
    this.history.push({ role: 'user', text });
    this.renderMessages();

    const scroll = document.getElementById('chat-scroll');
    const typingEl = document.createElement('div');
    typingEl.className = 'msg msg-bot';
    typingEl.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    scroll.appendChild(typingEl);

    try {
      const res = await fetch(window.app.apiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, uid: window.app.user?.uid || null }),
      });
      if (!res.ok) throw new Error('backend error');
      const data = await res.json();
      typingEl.remove();
      this.history.push({ role: 'bot', text: data.reply || "I couldn't find an answer for that." });
    } catch (e) {
      typingEl.remove();
      this.history.push({ role: 'bot', text: "I can't reach the assistant backend right now. Make sure the Python API is running and CONFIG.API_BASE_URL points to it (see README)." });
    }
    this.renderMessages();
  },
};
