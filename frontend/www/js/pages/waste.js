window.Pages = window.Pages || {};

window.Pages.waste = {
  categoryMeta: {
    Plastic: { icon: 'recycle', cls: 'svc-blue', tip: 'Rinse and place in the blue recyclables bin. Avoid crushing bottles flat — sorting machines read shape.' },
    Metal: { icon: 'cog', cls: 'svc-teal', tip: 'Metal is infinitely recyclable — drop cans and scrap in the metal recycling bin.' },
    Paper: { icon: 'file-text', cls: 'svc-amber', tip: 'Keep it dry and flatten boxes. Wet or food-soiled paper goes to organic waste instead.' },
    'Organic Waste': { icon: 'leaf', cls: 'svc-green', tip: 'Compostable — use the green bin. Great for community composting programs.' },
    Glass: { icon: 'wine', cls: 'svc-purple', tip: 'Rinse and separate by color if your facility asks. Glass never expires as a material — recycle indefinitely.' },
    'Electronic Waste': { icon: 'cpu', cls: 'svc-red', tip: 'Never bin e-waste — take it to a certified e-waste drop-off point; batteries and boards contain hazardous materials.' },
  },

  render(root) {
    root.innerHTML = `
      <div class="card">
        <div class="upload-well" id="waste-well"><i data-lucide="image-plus"></i><div>Tap to upload or capture a photo of the waste item</div></div>
        <input type="file" id="waste-input" accept="image/*" capture="environment" class="hidden" />
        <img id="waste-preview" class="upload-preview hidden" />
      </div>
      <div id="waste-result"></div>
    `;
    lucide.createIcons();
    document.getElementById('waste-well').addEventListener('click', () => document.getElementById('waste-input').click());
    document.getElementById('waste-input').addEventListener('change', (e) => this.handleFile(e));
  },

  handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      document.getElementById('waste-preview').src = reader.result;
      document.getElementById('waste-preview').classList.remove('hidden');
      this.classify(reader.result);
    };
    reader.readAsDataURL(file);
  },

  async classify(dataUrl) {
    const resultBox = document.getElementById('waste-result');
    resultBox.innerHTML = `<div class="card"><div class="empty-state"><i data-lucide="loader-2" style="animation:spin 0.9s linear infinite;"></i><div class="empty-state-title">Classifying…</div></div></div>`;
    lucide.createIcons();
    try {
      const res = await fetch(window.app.apiUrl('/api/waste-classify'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });
      if (!res.ok) throw new Error('bad response');
      const data = await res.json();
      const meta = this.categoryMeta[data.category] || this.categoryMeta['Plastic'];
      resultBox.innerHTML = `
        <div class="card">
          <div class="waste-result">
            <div class="waste-result-icon ${meta.cls}"><i data-lucide="${meta.icon}"></i></div>
            <div style="flex:1;">
              <div style="font-weight:800;font-size:16px;">${data.category}</div>
              <div style="font-size:11.5px;color:var(--text-faint);">Confidence ${Math.round((data.confidence || 0.8) * 100)}%</div>
              <div class="confidence-bar"><div class="confidence-fill" style="width:${Math.round((data.confidence || 0.8) * 100)}%"></div></div>
            </div>
          </div>
          <div style="margin-top:14px;font-size:13px;color:var(--text-dim);line-height:1.5;">${meta.tip}</div>
        </div>`;
      lucide.createIcons();
    } catch (e) {
      resultBox.innerHTML = `<div class="card"><div class="empty-state"><i data-lucide="wifi-off"></i><div class="empty-state-title">Couldn't classify</div><div class="empty-state-sub">Make sure the Python backend is running — see backend/README for the ML Kit / model hook.</div></div></div>`;
      lucide.createIcons();
    }
  },
};
